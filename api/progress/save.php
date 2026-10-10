<?php
declare(strict_types=1);
require_once dirname(__DIR__) . '/_bootstrap.php';

antara_method('POST');
$userId = antara_require_user();
$data = antara_input();
$planet = strtolower(trim((string)($data['planet'] ?? '')));
$progressRaw = $data['progress'] ?? null;

$allowedPlanets = ['sun', 'mercury', 'venus', 'earth', 'mars', 'asteroid-belt', 'jupiter', 'saturn', 'uranus', 'neptune'];
if (!in_array($planet, $allowedPlanets, true)) {
    antara_json(['success' => false, 'message' => 'Objek Tata Surya tidak dikenali.'], 422);
}
if (filter_var($progressRaw, FILTER_VALIDATE_INT) === false) {
    antara_json(['success' => false, 'message' => 'Progres harus berupa bilangan bulat.'], 422);
}
$progress = max(0, min(100, (int)$progressRaw));
$completed = $progress >= 100 ? 1 : 0;

$pdo = antara_db_or_fail();
$stmt = $pdo->prepare(
    'INSERT INTO user_progress (user_id, planet_code, progress_percent, completed, created_at, updated_at) VALUES (:user_id, :planet, :progress, :completed, NOW(), NOW()) ON DUPLICATE KEY UPDATE progress_percent = GREATEST(progress_percent, VALUES(progress_percent)), completed = GREATEST(completed, VALUES(completed)), updated_at = NOW()'
);
$stmt->execute(['user_id' => $userId, 'planet' => $planet, 'progress' => $progress, 'completed' => $completed]);

antara_json(['success' => true, 'message' => 'Progres eksplorasi tersimpan.', 'planet' => $planet, 'progress' => $progress]);
