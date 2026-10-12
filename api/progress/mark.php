<?php
declare(strict_types=1);
require_once dirname(__DIR__) . '/_bootstrap.php';
require_once __DIR__ . '/_progress.php';
require_once dirname(__DIR__) . '/leaderboard/_leaderboard.php';
require_once dirname(__DIR__) . '/achievements/_achievements.php';

antara_method('POST');
antara_enforce_write_origin();
antara_session_rate_limit('progress-mark', 18, 10);
$userId = antara_require_user();
$data = antara_input();
$planet = strtolower(trim((string)($data['planet'] ?? '')));
$type = strtolower(trim((string)($data['type'] ?? '')));
$key = strtolower(trim((string)($data['key'] ?? '')));
$label = trim((string)($data['label'] ?? ''));

if (!antara_progress_event_is_allowed($planet, $type, $key)) {
    antara_json(['success' => false, 'message' => 'Milestone eksplorasi tidak dikenali.'], 422);
}

if (function_exists('mb_strlen') && function_exists('mb_substr')) {
    if (mb_strlen($label, 'UTF-8') > 160) {
        $label = mb_substr($label, 0, 160, 'UTF-8');
    }
} elseif (strlen($label) > 160) {
    $label = substr($label, 0, 160);
}

$pdo = antara_db_or_fail();
try {
    antara_progress_ensure_schema($pdo);
    antara_leaderboard_ensure_schema($pdo);
    $pdo->beginTransaction();

    $insert = $pdo->prepare(
        'INSERT IGNORE INTO user_progress_events
         (user_id, planet_code, event_type, event_key, event_label, created_at)
         VALUES (:user_id, :planet, :event_type, :event_key, :event_label, NOW())'
    );
    $insert->execute([
        'user_id' => $userId,
        'planet' => $planet,
        'event_type' => $type,
        'event_key' => $key,
        'event_label' => $label !== '' ? $label : null,
    ]);
    $added = $insert->rowCount() > 0;

    $summary = antara_progress_summary($pdo, $userId);
    $planetSummary = null;
    foreach ($summary['planets'] as $item) {
        if ($item['planet'] === $planet) {
            $planetSummary = $item;
            break;
        }
    }

    if ($planetSummary !== null) {
        antara_progress_sync_legacy_summary($pdo, $userId, $planet, (int)$planetSummary['progress']);
    }

    $completion = antara_completion_sync($pdo, $userId, $summary);

    $pdo->commit();
    $achievementSummary = null;
    try {
        $achievementPayload = antara_achievements_payload($pdo, $userId);
        $achievementSummary = $achievementPayload['summary'] ?? null;
    } catch (Throwable $achievementError) {
        error_log('ANTARA achievement sync after progress: ' . $achievementError->getMessage());
    }
    antara_json([
        'success' => true,
        'added' => $added,
        'planet' => $planetSummary,
        'overall' => $summary['overall'],
        'completion' => $completion,
        'achievements' => $achievementSummary,
    ]);
} catch (Throwable $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    error_log('ANTARA progress mark error: ' . $e->getMessage());
    antara_json(['success' => false, 'message' => 'Progress belum dapat disimpan. Coba lagi setelah koneksi database siap.'], 503);
}
