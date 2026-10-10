<?php
declare(strict_types=1);
require_once dirname(__DIR__) . '/_bootstrap.php';

antara_method('GET');
$userId = (int)($_SESSION['user_id'] ?? 0);

if ($userId <= 0) {
    antara_json(['success' => true, 'authenticated' => false, 'user' => null]);
}

$pdo = antara_db_or_fail();
$hasBio = antara_ensure_users_bio_column($pdo);
$bioColumn = $hasBio ? ', bio' : '';

try {
    $stmt = $pdo->prepare('SELECT id, full_name, username, email, avatar_url' . $bioColumn . ', created_at FROM users WHERE id = :id LIMIT 1');
    $stmt->execute(['id' => $userId]);
    $user = $stmt->fetch();

    if (!$user) {
        antara_revoke_remember_token($pdo);
        $_SESSION = [];
        session_destroy();
        antara_json(['success' => true, 'authenticated' => false, 'user' => null]);
    }

    antara_json(['success' => true, 'authenticated' => true, 'user' => antara_user_payload($user)]);
} catch (PDOException $e) {
    error_log('ANTARA me error: ' . $e->getMessage());
    antara_json(['success' => false, 'message' => 'Status akun gagal dibaca.'], 500);
}
