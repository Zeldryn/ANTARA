<?php
declare(strict_types=1);
require_once dirname(__DIR__) . '/_bootstrap.php';
require_once __DIR__ . '/_achievements.php';

antara_method('GET');
$userId = antara_require_user();
$pdo = antara_db_or_fail();

try {
    antara_achievements_sync($pdo, $userId);
    $catalog = antara_achievement_catalog();

    $pdo->beginTransaction();
    $stmt = $pdo->prepare(
        'SELECT ua.id, ua.unlocked_at, a.code, a.name, a.description, a.icon
         FROM user_achievements ua
         JOIN achievements a ON a.id = ua.achievement_id
         WHERE ua.user_id = :user_id AND ua.notified_at IS NULL
         ORDER BY ua.unlocked_at ASC, ua.id ASC
         LIMIT 5
         FOR UPDATE'
    );
    $stmt->execute(['user_id' => $userId]);
    $rows = $stmt->fetchAll();

    if ($rows) {
        $ids = array_map(static fn(array $row): int => (int)$row['id'], $rows);
        $placeholders = implode(',', array_fill(0, count($ids), '?'));
        $update = $pdo->prepare("UPDATE user_achievements SET notified_at = NOW() WHERE id IN ($placeholders) AND notified_at IS NULL");
        $update->execute($ids);
    }
    $pdo->commit();

    $items = [];
    foreach ($rows as $row) {
        $code = (string)$row['code'];
        $def = $catalog[$code] ?? [];
        $items[] = [
            'code' => $code,
            'name' => (string)$row['name'],
            'description' => (string)$row['description'],
            'icon' => (string)$row['icon'],
            'tier' => (string)($def['tier'] ?? 'common'),
            'category' => (string)($def['category'] ?? 'special'),
            'unlockedAt' => (string)$row['unlocked_at'],
        ];
    }

    antara_json(['success' => true, 'items' => $items, 'count' => count($items)]);
} catch (Throwable $e) {
    if ($pdo->inTransaction()) $pdo->rollBack();
    error_log('ANTARA achievement notification error: ' . $e->getMessage());
    antara_json(['success' => false, 'message' => 'Notifikasi pencapaian belum dapat dimuat.'], 503);
}
