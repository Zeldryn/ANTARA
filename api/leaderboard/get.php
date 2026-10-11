<?php
declare(strict_types=1);
require_once dirname(__DIR__) . '/_bootstrap.php';

antara_method('GET');
$game = trim((string)($_GET['game'] ?? 'general'));
if (!preg_match('/^[a-z0-9_-]{1,40}$/', $game)) {
    antara_json(['success' => false, 'message' => 'Kode permainan tidak valid.'], 422);
}

$pdo = antara_db_or_fail();
$stmt = $pdo->prepare(
    'SELECT u.id AS user_id, u.username, u.full_name, MAX(gs.score) AS score FROM game_scores gs JOIN users u ON u.id = gs.user_id WHERE gs.game_code = :game GROUP BY u.id, u.username, u.full_name ORDER BY score DESC, u.username ASC LIMIT 100'
);
$stmt->execute(['game' => $game]);
$rows = $stmt->fetchAll();

$entries = array_map(static fn(array $row, int $index): array => [
    'rank' => $index + 1,
    'userId' => (int)$row['user_id'],
    'username' => (string)$row['username'],
    'name' => (string)$row['full_name'],
    'score' => (int)$row['score'],
], $rows, array_keys($rows));

antara_json(['success' => true, 'game' => $game, 'entries' => $entries]);
