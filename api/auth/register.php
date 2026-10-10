<?php
declare(strict_types=1);
require_once dirname(__DIR__) . '/_bootstrap.php';

antara_method('POST');
$data = antara_input();

$fullName = trim((string)($data['fullName'] ?? ''));
$username = trim((string)($data['username'] ?? ''));
$email = strtolower(trim((string)($data['email'] ?? '')));
$password = (string)($data['password'] ?? '');
$confirmPassword = (string)($data['confirmPassword'] ?? '');

$errors = [];

if ($fullName === '' || strlen($fullName) < 2 || strlen($fullName) > 60) {
    $errors['fullName'] = 'Nama penjelajah harus 2 sampai 60 karakter.';
}
if (!preg_match('/^[A-Za-z0-9_]{3,20}$/', $username)) {
    $errors['username'] = 'Username harus 3 sampai 20 karakter dan hanya berisi huruf, angka, atau underscore.';
}
if (!filter_var($email, FILTER_VALIDATE_EMAIL) || strlen($email) > 254) {
    $errors['email'] = 'Alamat email tidak valid.';
}
if (strlen($password) < 8 || strlen($password) > 128) {
    $errors['password'] = 'Kata sandi harus 8 sampai 128 karakter.';
}
if ($confirmPassword !== '' && !hash_equals($password, $confirmPassword)) {
    $errors['confirmPassword'] = 'Konfirmasi kata sandi belum sama.';
}

if ($errors) {
    antara_json(['success' => false, 'message' => 'Periksa kembali data pendaftaran.', 'errors' => $errors], 422);
}

$pdo = antara_db_or_fail();

try {
    $check = $pdo->prepare('SELECT username, email FROM users WHERE username = :username OR email = :email LIMIT 2');
    $check->execute(['username' => $username, 'email' => $email]);

    foreach ($check->fetchAll() as $existing) {
        if (strcasecmp((string)$existing['username'], $username) === 0) {
            $errors['username'] = 'Username ini sudah digunakan.';
        }
        if (strcasecmp((string)$existing['email'], $email) === 0) {
            $errors['email'] = 'Email ini sudah terdaftar.';
        }
    }

    if ($errors) {
        antara_json(['success' => false, 'message' => 'Akun dengan data tersebut sudah ada.', 'errors' => $errors], 409);
    }

    $hash = password_hash($password, PASSWORD_DEFAULT);
    if ($hash === false) {
        throw new RuntimeException('Password hashing gagal.');
    }

    $insert = $pdo->prepare(
        'INSERT INTO users (full_name, username, email, password_hash, created_at, updated_at) VALUES (:full_name, :username, :email, :password_hash, NOW(), NOW())'
    );
    $insert->execute([
        'full_name' => $fullName,
        'username' => $username,
        'email' => $email,
        'password_hash' => $hash,
    ]);

    $userId = (int)$pdo->lastInsertId();
    session_regenerate_id(true);
    $_SESSION['user_id'] = $userId;
    try { antara_issue_remember_token($pdo, $userId); } catch (Throwable $rememberError) { error_log('ANTARA remember token issue error: ' . $rememberError->getMessage()); }

    $user = [
        'id' => $userId,
        'full_name' => $fullName,
        'username' => $username,
        'email' => $email,
        'avatar_url' => null,
        'bio' => '',
        'created_at' => date('Y-m-d H:i:s'),
    ];

    antara_json([
        'success' => true,
        'message' => 'Identitas ANTARA berhasil dibuat.',
        'user' => antara_user_payload($user),
    ], 201);
} catch (PDOException $e) {
    if ((string)$e->getCode() === '23000') {
        antara_json(['success' => false, 'message' => 'Username atau email sudah digunakan.'], 409);
    }
    error_log('ANTARA register error: ' . $e->getMessage());
    antara_json(['success' => false, 'message' => 'Pendaftaran gagal karena gangguan database.'], 500);
} catch (Throwable $e) {
    error_log('ANTARA register error: ' . $e->getMessage());
    antara_json(['success' => false, 'message' => 'Pendaftaran gagal diproses.'], 500);
}
