<?php
declare(strict_types=1);
require_once dirname(__DIR__) . '/_bootstrap.php';
require_once __DIR__ . '/_quiz.php';

antara_method('POST');
antara_enforce_write_origin();
antara_session_rate_limit('quiz_start', 8, 60);
$userId = antara_require_user();
$pdo = antara_db_or_fail();

try {
    antara_quiz_ensure_schema($pdo);
    $bank = antara_quiz_bank();
    $questionIds = antara_quiz_select_question_ids();
    $token = bin2hex(random_bytes(32));
    $tokenHash = hash('sha256', $token);

    $pdo->beginTransaction();
    $pdo->prepare("UPDATE game_runs SET status = 'abandoned', finished_at = NOW() WHERE user_id = :user_id AND game_code = :game AND status = 'active'")
        ->execute(['user_id' => $userId, 'game' => ANTARA_QUIZ_GAME_CODE]);

    $runStmt = $pdo->prepare(
        "INSERT INTO game_runs (user_id, game_code, run_token_hash, status, server_score, started_at, expires_at, created_at)
         VALUES (:user_id, :game, :hash, 'active', 0, NOW(), DATE_ADD(NOW(), INTERVAL " . ANTARA_QUIZ_RUN_MINUTES . " MINUTE), NOW())"
    );
    $runStmt->execute(['user_id' => $userId, 'game' => ANTARA_QUIZ_GAME_CODE, 'hash' => $tokenHash]);
    $runId = (int)$pdo->lastInsertId();

    $insert = $pdo->prepare(
        'INSERT INTO quiz_run_questions (run_id, position, question_id, level, correct_key, time_limit_ms, served_at, created_at)
         VALUES (:run_id, :position, :question_id, :level, :correct_key, :time_limit_ms, :served_at, NOW())'
    );
    foreach ($questionIds as $index => $questionId) {
        $q = $bank[$questionId];
        $level = (int)$q['level'];
        $insert->execute([
            'run_id' => $runId,
            'position' => $index + 1,
            'question_id' => $questionId,
            'level' => $level,
            'correct_key' => (string)$q['answer'],
            'time_limit_ms' => antara_quiz_question_time_ms($q),
            'served_at' => $index === 0 ? date('Y-m-d H:i:s.u') : null,
        ]);
    }
    // PHP's date() does not preserve microseconds; use database clock for the first question.
    $pdo->prepare('UPDATE quiz_run_questions SET served_at = NOW(6) WHERE run_id = :run_id AND position = 1')
        ->execute(['run_id' => $runId]);
    $first = $pdo->prepare('SELECT * FROM quiz_run_questions WHERE run_id = :run_id AND position = 1 LIMIT 1');
    $first->execute(['run_id' => $runId]);
    $question = $first->fetch();
    $pdo->commit();

    antara_json([
        'success' => true,
        'runToken' => $token,
        'gameCode' => ANTARA_QUIZ_GAME_CODE,
        'questionCount' => ANTARA_QUIZ_STACK_SIZE,
        'totalQuestionPool' => count($bank),
        'stack' => antara_quiz_stack_progress($pdo, $runId),
        'question' => antara_quiz_public_question($question),
        'score' => 0,
        'streak' => 0,
    ]);
} catch (Throwable $e) {
    if ($pdo->inTransaction()) $pdo->rollBack();
    error_log('ANTARA quiz start error: ' . $e->getMessage());
    antara_json(['success' => false, 'message' => 'Kuis belum dapat dimulai. Periksa database ANTARA.'], 503);
}
