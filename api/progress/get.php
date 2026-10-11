<?php
declare(strict_types=1);
require_once dirname(__DIR__) . '/_bootstrap.php';

antara_method('GET');
$userId = antara_require_user();
$pdo = antara_db_or_fail();
$stmt = $pdo->prepare('SELECT planet_code, progress_percent, completed, updated_at FROM user_progress WHERE user_id = :user_id ORDER BY id ASC');
$stmt->execute(['user_id' => $userId]);

$progress = array_map(static fn(array $row): array => [
    'planet' => (string)$row['planet_code'],
    'progress' => (int)$row['progress_percent'],
    'completed' => (bool)$row['completed'],
    'updatedAt' => (string)$row['updated_at'],
], $stmt->fetchAll());

antara_json(['success' => true, 'progress' => $progress]);
