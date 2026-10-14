<?php
declare(strict_types=1);
require_once dirname(__DIR__) . '/_bootstrap.php';
require_once __DIR__ . '/_quiz.php';
require_once dirname(__DIR__) . '/achievements/_achievements.php';

antara_method('POST');
antara_enforce_write_origin();
antara_session_rate_limit('quiz_answer', 80, 60);
$userId = antara_require_user();
$data = antara_input();
$token = strtolower(trim((string)($data['runToken'] ?? '')));
$position = (int)($data['position'] ?? 0);
$answer = strtoupper(trim((string)($data['answer'] ?? '')));
if ($position < 1 || $position > ANTARA_QUIZ_QUESTION_COUNT) antara_json(['success'=>false,'message'=>'Posisi soal tidak valid.'],422);
if ($answer !== '' && !in_array($answer, ['A','B','C','D'], true)) antara_json(['success'=>false,'message'=>'Pilihan jawaban tidak valid.'],422);

$pdo = antara_db_or_fail();
try {
    antara_quiz_ensure_schema($pdo);
    $pdo->beginTransaction();
    $run = antara_quiz_find_run($pdo, $userId, $token, true);
    if (!$run) antara_json(['success'=>false,'message'=>'Run kuis tidak ditemukan.'],404);
    if ((string)$run['status'] !== 'active') antara_json(['success'=>false,'message'=>'Run kuis ini sudah selesai.'],409);
    if (strtotime((string)$run['expires_at']) < time()) {
        $pdo->prepare("UPDATE game_runs SET status='expired', finished_at=NOW() WHERE id=:id")->execute(['id'=>(int)$run['id']]);
        $pdo->commit();
        antara_json(['success'=>false,'message'=>'Waktu run kuis sudah kedaluwarsa.'],410);
    }

    $stmt = $pdo->prepare(
        'SELECT q.*, TIMESTAMPDIFF(MICROSECOND, q.served_at, NOW(6)) AS elapsed_us
         FROM quiz_run_questions q
         WHERE q.run_id = :run_id AND q.position = :position LIMIT 1 FOR UPDATE'
    );
    $stmt->execute(['run_id'=>(int)$run['id'],'position'=>$position]);
    $row = $stmt->fetch();
    if (!$row) antara_json(['success'=>false,'message'=>'Soal run tidak ditemukan.'],404);
    if ($row['answered_at'] !== null) antara_json(['success'=>false,'message'=>'Soal ini sudah dijawab.'],409);
    if ($row['served_at'] === null) antara_json(['success'=>false,'message'=>'Soal ini belum dimulai.'],409);

    $responseMs = max(0, (int)floor(((int)$row['elapsed_us']) / 1000));
    $limitMs = (int)$row['time_limit_ms'];
    $timedOut = $responseMs > ($limitMs + ANTARA_QUIZ_NETWORK_GRACE_MS);
    $correct = !$timedOut && $answer !== '' && hash_equals((string)$row['correct_key'], $answer);

    $prevStmt = $pdo->prepare('SELECT streak_after FROM quiz_run_questions WHERE run_id=:run_id AND position < :position AND answered_at IS NOT NULL ORDER BY position DESC LIMIT 1');
    $prevStmt->execute(['run_id'=>(int)$run['id'],'position'=>$position]);
    $prevStreak = (int)($prevStmt->fetchColumn() ?: 0);
    $streak = $correct ? $prevStreak + 1 : 0;
    $scoreParts = antara_quiz_score((int)$row['level'], $responseMs, $limitMs, $streak, $correct);

    $update = $pdo->prepare(
        'UPDATE quiz_run_questions
         SET answered_at=NOW(6), answer_key=:answer_key, is_correct=:is_correct, timed_out=:timed_out,
             response_ms=:response_ms, points=:points, streak_after=:streak
         WHERE id=:id'
    );
    $update->execute([
        'answer_key'=>$answer !== '' ? $answer : null,
        'is_correct'=>$correct ? 1 : 0,
        'timed_out'=>$timedOut || $answer === '' ? 1 : 0,
        'response_ms'=>$responseMs,
        'points'=>$scoreParts['points'],
        'streak'=>$streak,
        'id'=>(int)$row['id'],
    ]);
    $pdo->prepare('UPDATE game_runs SET server_score = server_score + :points WHERE id=:run_id')
        ->execute(['points'=>$scoreParts['points'],'run_id'=>(int)$run['id']]);

    $bank = antara_quiz_bank();
    $q = $bank[(int)$row['question_id']];
    $scoreStmt = $pdo->prepare('SELECT server_score FROM game_runs WHERE id=:id');
    $scoreStmt->execute(['id'=>(int)$run['id']]);
    $scoreTotal = (int)$scoreStmt->fetchColumn();

    $hasNext = $position < ANTARA_QUIZ_QUESTION_COUNT;
    $summary = null;
    if (!$hasNext) {
        $summary = antara_quiz_finalize($pdo, (int)$run['id'], $userId);
        antara_achievements_sync($pdo, $userId);
    }
    $pdo->commit();

    antara_json([
        'success'=>true,
        'correct'=>$correct,
        'timedOut'=>$timedOut || $answer === '',
        'answer'=>$answer !== '' ? $answer : null,
        'correctKey'=>(string)$row['correct_key'],
        'correctText'=>(string)$q['options'][(string)$row['correct_key']],
        'explanation'=>(string)$q['explanation'],
        'reference'=>(string)$q['reference'],
        'responseMs'=>$responseMs,
        'points'=>$scoreParts['points'],
        'scoreParts'=>$scoreParts,
        'scoreTotal'=>$scoreTotal,
        'streak'=>$streak,
        'hasNext'=>$hasNext,
        'finished'=>!$hasNext,
        'summary'=>$summary,
    ]);
} catch (Throwable $e) {
    if ($pdo->inTransaction()) $pdo->rollBack();
    error_log('ANTARA quiz answer error: '.$e->getMessage());
    antara_json(['success'=>false,'message'=>'Jawaban belum dapat diproses.'],503);
}
