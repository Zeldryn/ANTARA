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

    $progress = antara_quiz_stack_progress($pdo, (int)$run['id']);
    if ($progress['complete']) {
        antara_json(['success'=>false,'message'=>'Tantangan 15/15 ini sudah selesai.'],409);
    }

    $row = antara_quiz_find_next_stack_question($pdo, (int)$run['id'], 0, true);
    if (!$row) antara_json(['success'=>false,'message'=>'Tidak ada soal tersisa pada tantangan ini.'],409);

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
    $progress = antara_quiz_stack_progress($pdo, (int)$run['id']);
    $pdo->commit();

    antara_json([
        'success'=>true,
        'question'=>antara_quiz_public_question($row),
        'score'=>$score,
        'streak'=>$streak,
        'stack'=>$progress,
        'levelChanged'=>false,
    ]);
} catch (Throwable $e) {
    if ($pdo->inTransaction()) $pdo->rollBack();
    error_log('ANTARA quiz next error: '.$e->getMessage());
    antara_json(['success'=>false,'message'=>'Soal berikutnya belum dapat dimuat.'],503);
}
