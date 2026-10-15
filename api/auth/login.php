<?php
declare(strict_types=1);
require_once dirname(__DIR__) . '/_bootstrap.php';

antara_method('POST');
$data = antara_input();

$identifier = trim((string)($data['identifier'] ?? $data['email'] ?? $data['username'] ?? ''));
$password = (string)($data['password'] ?? '');

if ($identifier === '' || $password === '') {
    antara_json(['success' => false, 'message' => 'Masukkan username/email dan kata sandi.'], 422);
}

$pdo = antara_db_or_fail();
$hasBio = antara_ensure_users_bio_column($pdo);
$bioColumn = $hasBio ? ', bio' : '';

try {
    $stmt = $pdo->prepare(
        'SELECT id, full_name, username, email, password_hash, avatar_url' . $bioColumn . ', created_at FROM users WHERE username = :username_identifier OR email = :email_identifier LIMIT 1'
    );
    $stmt->execute(['username_identifier' => $identifier, 'email_identifier' => strtolower($identifier)]);
    $user = $stmt->fetch();

    if (!$user || !password_verify($password, (string)$user['password_hash'])) {
        antara_json(['success' => false, 'message' => 'Username/email atau kata sandi salah.'], 401);
    }

    if (password_needs_rehash((string)$user['password_hash'], PASSWORD_DEFAULT)) {
        $rehash = password_hash($password, PASSWORD_DEFAULT);
        if ($rehash !== false) {
            $updateHash = $pdo->prepare('UPDATE users SET password_hash = :password_hash, updated_at = NOW() WHERE id = :id');
            $updateHash->execute(['password_hash' => $rehash, 'id' => (int)$user['id']]);
        }
    }

    $updateLogin = $pdo->prepare('UPDATE users SET last_login_at = NOW() WHERE id = :id');
    $updateLogin->execute(['id' => (int)$user['id']]);

    session_regenerate_id(true);
    $_SESSION['user_id'] = (int)$user['id'];
    try { antara_issue_remember_token($pdo, (int)$user['id']); } catch (Throwable $rememberError) { error_log('ANTARA remember token issue error: ' . $rememberError->getMessage()); }

    antara_json([
        'success' => true,
        'message' => 'Akses ANTARA berhasil dibuka.',
        'user' => antara_user_payload($user),
    ]);
} catch (PDOException $e) {
    error_log('ANTARA login error: ' . $e->getMessage());
    antara_json(['success' => false, 'message' => 'Login gagal karena gangguan database.'], 500);
}
