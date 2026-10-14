<?php
declare(strict_types=1);
require_once dirname(__DIR__) . '/_bootstrap.php';
require_once __DIR__ . '/_quiz.php';

antara_method('POST');
antara_enforce_write_origin();
antara_session_rate_limit('quiz_next', 80, 60);
$userId = antara_require_user();
$data = antara_input();
$token = strtolower(trim((string)($data['runToken'] ?? '')));
$position = (int)($data['position'] ?? 0);
if ($position < 2 || $position > ANTARA_QUIZ_QUESTION_COUNT) antara_json(['success'=>false,'message'=>'Posisi soal berikutnya tidak valid.'],422);

$pdo = antara_db_or_fail();
try {
    antara_quiz_ensure_schema($pdo);
    $pdo->beginTransaction();
    $run = antara_quiz_find_run($pdo, $userId, $token, true);
    if (!$run) antara_json(['success'=>false,'message'=>'Run kuis tidak ditemukan.'],404);
    if ((string)$run['status'] !== 'active') antara_json(['success'=>false,'message'=>'Run kuis sudah selesai.'],409);

    $prev = $pdo->prepare('SELECT answered_at FROM quiz_run_questions WHERE run_id=:run_id AND position=:position LIMIT 1');
    $prev->execute(['run_id'=>(int)$run['id'],'position'=>$position - 1]);
    if (!$prev->fetchColumn()) antara_json(['success'=>false,'message'=>'Selesaikan soal sebelumnya terlebih dahulu.'],409);

    $stmt = $pdo->prepare('SELECT * FROM quiz_run_questions WHERE run_id=:run_id AND position=:position LIMIT 1 FOR UPDATE');
    $stmt->execute(['run_id'=>(int)$run['id'],'position'=>$position]);
    $row = $stmt->fetch();
    if (!$row) antara_json(['success'=>false,'message'=>'Soal berikutnya tidak ditemukan.'],404);
    if ($row['answered_at'] !== null) antara_json(['success'=>false,'message'=>'Soal berikutnya sudah dijawab.'],409);
    if ($row['served_at'] === null) {
        $pdo->prepare('UPDATE quiz_run_questions SET served_at=NOW(6) WHERE id=:id')->execute(['id'=>(int)$row['id']]);
        $stmt->execute(['run_id'=>(int)$run['id'],'position'=>$position]);
        $row = $stmt->fetch();
    }
    $score = (int)$run['server_score'];
    $prevStreakStmt = $pdo->prepare('SELECT streak_after FROM quiz_run_questions WHERE run_id=:run_id AND position=:position LIMIT 1');
    $prevStreakStmt->execute(['run_id'=>(int)$run['id'],'position'=>$position - 1]);
    $streak = (int)($prevStreakStmt->fetchColumn() ?: 0);
    $pdo->commit();

    antara_json(['success'=>true,'question'=>antara_quiz_public_question($row),'score'=>$score,'streak'=>$streak]);
} catch (Throwable $e) {
    if ($pdo->inTransaction()) $pdo->rollBack();
    error_log('ANTARA quiz next error: '.$e->getMessage());
    antara_json(['success'=>false,'message'=>'Soal berikutnya belum dapat dimuat.'],503);
}
