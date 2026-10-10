<?php
declare(strict_types=1);
require_once dirname(__DIR__) . '/_bootstrap.php';
require_once __DIR__ . '/_progress.php';
require_once dirname(__DIR__) . '/leaderboard/_leaderboard.php';

antara_method('GET');
$userId = antara_require_user();
$pdo = antara_db_or_fail();

try {
    antara_progress_ensure_schema($pdo);
    antara_leaderboard_ensure_schema($pdo);
    $summary = antara_progress_summary($pdo, $userId);
    antara_completion_sync($pdo, $userId, $summary);
    antara_json([
        'success' => true,
        'overall' => $summary['overall'],
        'planets' => $summary['planets'],
        // Compatibility alias for older callers that expected `progress`.
        'progress' => $summary['planets'],
    ]);
} catch (Throwable $e) {
    error_log('ANTARA progress get error: ' . $e->getMessage());
    antara_json(['success' => false, 'message' => 'Progress belum dapat dibaca dari database.'], 503);
}
