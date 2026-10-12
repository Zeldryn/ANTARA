<?php
declare(strict_types=1);
require_once dirname(__DIR__) . '/_bootstrap.php';
require_once __DIR__ . '/_leaderboard.php';

antara_method('GET');
$type = strtolower(trim((string)($_GET['type'] ?? 'completion')));
$limit = (int)($_GET['limit'] ?? 50);
$userId = (int)($_SESSION['user_id'] ?? 0);
$pdo = antara_db_or_fail();

try {
    antara_leaderboard_ensure_schema($pdo);

    if ($type === 'completion') {
        $entries = antara_completion_entries($pdo, $limit);
        $me = $userId > 0 ? antara_completion_user_rank($pdo, $userId) : null;
        antara_json([
            'success' => true,
            'type' => 'completion',
            'entries' => $entries,
            'me' => $me,
            'integrity' => [
                'serverVerified' => true,
                'minimumCompletionSeconds' => ANTARA_COMPLETION_MIN_SECONDS,
            ],
        ]);
    }

    if ($type === 'game') {
        $game = strtolower(trim((string)($_GET['game'] ?? 'general')));
        if (!preg_match('/^[a-z0-9_-]{1,40}$/', $game)) {
            antara_json(['success' => false, 'message' => 'Kode permainan tidak valid.'], 422);
        }
        $entries = antara_verified_game_entries($pdo, $game, $limit);
        $me = $userId > 0 ? antara_verified_game_user_rank($pdo, $userId, $game) : null;
        antara_json([
            'success' => true,
            'type' => 'game',
            'game' => $game,
            'entries' => $entries,
            'me' => $me,
            'verifiedOnly' => true,
        ]);
    }

    antara_json(['success' => false, 'message' => 'Jenis leaderboard tidak dikenali.'], 422);
} catch (Throwable $e) {
    error_log('ANTARA leaderboard get error: ' . $e->getMessage());
    antara_json(['success' => false, 'message' => 'Leaderboard belum dapat dimuat dari database.'], 503);
}
