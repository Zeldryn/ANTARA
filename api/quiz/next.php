<?php
declare(strict_types=1);
require_once dirname(__DIR__) . '/_bootstrap.php';
require_once __DIR__ . '/_quiz.php';

antara_method('POST');
antara_enforce_write_origin();
antara_session_rate_limit('quiz_next', 160, 60);
$userId = antara_require_user();
$data = antara_input();
$token = strtolower(trim((string)($data['runToken'] ?? '')));
$level = (int)($data['level'] ?? 0);
$advanceLevel = !empty($data['advanceLevel']);
if ($level < 1 || $level > ANTARA_QUIZ_LEVEL_COUNT) antara_json(['success'=>false,'message'=>'Level kuis tidak valid.'],422);

$pdo = antara_db_or_fail();
try {
    antara_quiz_ensure_schema($pdo);
    $pdo->beginTransaction();
    $run = antara_quiz_find_run($pdo, $userId, $token, true);
    if (!$run) antara_json(['success'=>false,'message'=>'Run kuis tidak ditemukan.'],404);
    if ((string)$run['status'] !== 'active') antara_json(['success'=>false,'message'=>'Run kuis sudah selesai.'],409);
    if (strtotime((string)$run['expires_at']) < time()) {
        $pdo->prepare("UPDATE game_runs SET status='expired', finished_at=NOW() WHERE id=:id")->execute(['id'=>(int)$run['id']]);
        $pdo->commit();
        antara_json(['success'=>false,'message'=>'Waktu run kuis sudah kedaluwarsa.'],410);
    }

    $currentStack = antara_quiz_stack_progress($pdo, (int)$run['id'], $level);
    $targetLevel = $level;
    if ($advanceLevel) {
        if (!$currentStack['complete']) antara_json(['success'=>false,'message'=>'Kuasai 15/15 soal level ini sebelum naik level.'],409);
        if ($level >= ANTARA_QUIZ_LEVEL_COUNT) antara_json(['success'=>false,'message'=>'Semua level sudah selesai.'],409);
        $targetLevel = $level + 1;
    } elseif ($currentStack['complete']) {
        antara_json(['success'=>false,'message'=>'Level ini sudah 15/15. Gunakan tombol naik level.'],409);
    }

    if (!antara_quiz_previous_levels_complete($pdo, (int)$run['id'], $targetLevel)) {
        antara_json(['success'=>false,'message'=>'Selesaikan 15/15 level sebelumnya terlebih dahulu.'],409);
    }

    $row = antara_quiz_find_next_stack_question($pdo, (int)$run['id'], $targetLevel, true);
    if (!$row) antara_json(['success'=>false,'message'=>'Tidak ada soal tersisa di level ini.'],409);

    // A legitimate question can only be activated once per attempt. Retry activation
    // happens after its previous answered_at timestamp.
    $alreadyActive = $row['served_at'] !== null && ($row['answered_at'] === null || strcmp((string)$row['served_at'], (string)$row['answered_at']) > 0);
    if ($alreadyActive) antara_json(['success'=>false,'message'=>'Soal berikutnya sudah aktif.'],409);

    $pdo->prepare('UPDATE quiz_run_questions SET served_at=NOW(6) WHERE id=:id')->execute(['id'=>(int)$row['id']]);
    $stmt = $pdo->prepare('SELECT * FROM quiz_run_questions WHERE id=:id LIMIT 1');
    $stmt->execute(['id'=>(int)$row['id']]);
    $row = $stmt->fetch();

    $score = (int)$run['server_score'];
    $prevStreakStmt = $pdo->prepare(
        'SELECT streak_after FROM quiz_run_questions
         WHERE run_id=:run_id AND answered_at IS NOT NULL
         ORDER BY answered_at DESC, id DESC LIMIT 1'
    );
    $prevStreakStmt->execute(['run_id'=>(int)$run['id']]);
    $streak = (int)($prevStreakStmt->fetchColumn() ?: 0);
    $stack = antara_quiz_stack_progress($pdo, (int)$run['id'], $targetLevel);
    $pdo->commit();

    antara_json([
        'success'=>true,
        'question'=>antara_quiz_public_question($row),
        'score'=>$score,
        'streak'=>$streak,
        'stack'=>$stack,
        'levelChanged'=>$targetLevel !== $level,
    ]);
} catch (Throwable $e) {
    if ($pdo->inTransaction()) $pdo->rollBack();
    error_log('ANTARA quiz next error: '.$e->getMessage());
    antara_json(['success'=>false,'message'=>'Soal berikutnya belum dapat dimuat.'],503);
}
