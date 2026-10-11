<?php
declare(strict_types=1);
require_once dirname(__DIR__) . '/_bootstrap.php';

antara_method('POST');
$userId = antara_require_user();
$data = antara_input();
$game = trim((string)($data['game'] ?? 'general'));
$scoreRaw = $data['score'] ?? null;

if (!preg_match('/^[a-z0-9_-]{1,40}$/', $game)) {
    antara_json(['success' => false, 'message' => 'Kode permainan tidak valid.'], 422);
}
if (filter_var($scoreRaw, FILTER_VALIDATE_INT) === false) {
    antara_json(['success' => false, 'message' => 'Skor harus berupa bilangan bulat.'], 422);
}
$score = (int)$scoreRaw;
if ($score < 0 || $score > 1000000000) {
    antara_json(['success' => false, 'message' => 'Nilai skor di luar batas.'], 422);
}

$pdo = antara_db_or_fail();
$stmt = $pdo->prepare('INSERT INTO game_scores (user_id, game_code, score, created_at) VALUES (:user_id, :game, :score, NOW())');
$stmt->execute(['user_id' => $userId, 'game' => $game, 'score' => $score]);

antara_json(['success' => true, 'message' => 'Skor berhasil disimpan.', 'score' => $score], 201);
