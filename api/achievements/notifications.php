<?php
declare(strict_types=1);
require_once dirname(__DIR__) . '/_bootstrap.php';
require_once __DIR__ . '/_achievements.php';

antara_method('GET');
$userId = antara_require_user();
$pdo = antara_db_or_fail();

try {
    antara_achievements_sync($pdo, $userId);
    $items = antara_achievement_claim_notifications($pdo, $userId, 5);
    antara_json(['success' => true, 'items' => $items, 'count' => count($items)]);
} catch (Throwable $e) {
    if ($pdo->inTransaction()) $pdo->rollBack();
    error_log('ANTARA achievement notification error: ' . $e->getMessage());
    antara_json(['success' => false, 'message' => 'Notifikasi pencapaian belum dapat dimuat.'], 503);
}
