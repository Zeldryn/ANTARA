<?php
declare(strict_types=1);
require_once dirname(__DIR__) . '/_bootstrap.php';

antara_method('POST');
$userId = antara_require_user();
$data = antara_input();
$action = strtolower(trim((string)($data['action'] ?? 'profile')));
$pdo = antara_db_or_fail();

try {
    $stmt = $pdo->prepare('SELECT id, full_name, username, email, password_hash, avatar_url, created_at FROM users WHERE id = :id LIMIT 1');
    $stmt->execute(['id' => $userId]);
    $current = $stmt->fetch();

    if (!$current) {
        $_SESSION = [];
        session_destroy();
        antara_json(['success' => false, 'message' => 'Sesi akun tidak ditemukan. Silakan masuk kembali.'], 401);
    }

    if ($action === 'profile') {
        $fullName = trim((string)($data['fullName'] ?? $current['full_name']));
        $username = trim((string)($data['username'] ?? $current['username']));
        $email = strtolower(trim((string)($data['email'] ?? $current['email'])));
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

        if ($errors) {
            antara_json(['success' => false, 'message' => 'Periksa kembali data akun.', 'errors' => $errors], 422);
        }

        $check = $pdo->prepare('SELECT id, username, email FROM users WHERE id <> :id AND (username = :username OR email = :email) LIMIT 2');
        $check->execute(['id' => $userId, 'username' => $username, 'email' => $email]);
        foreach ($check->fetchAll() as $existing) {
            if (strcasecmp((string)$existing['username'], $username) === 0) {
                $errors['username'] = 'Username ini sudah digunakan.';
            }
            if (strcasecmp((string)$existing['email'], $email) === 0) {
                $errors['email'] = 'Email ini sudah digunakan.';
            }
        }
        if ($errors) {
            antara_json(['success' => false, 'message' => 'Username atau email sudah digunakan akun lain.', 'errors' => $errors], 409);
        }

        $update = $pdo->prepare('UPDATE users SET full_name = :full_name, username = :username, email = :email, updated_at = NOW() WHERE id = :id');
        $update->execute([
            'full_name' => $fullName,
            'username' => $username,
            'email' => $email,
            'id' => $userId,
        ]);

        $current['full_name'] = $fullName;
        $current['username'] = $username;
        $current['email'] = $email;

        antara_json([
            'success' => true,
            'message' => 'Identitas akun berhasil diperbarui.',
            'user' => antara_user_payload($current),
        ]);
    }

    if ($action === 'password') {
        $currentPassword = (string)($data['currentPassword'] ?? '');
        $newPassword = (string)($data['newPassword'] ?? '');
        $confirmPassword = (string)($data['confirmPassword'] ?? '');
        $errors = [];

        if ($currentPassword === '' || !password_verify($currentPassword, (string)$current['password_hash'])) {
            $errors['currentPassword'] = 'Kata sandi saat ini tidak cocok.';
        }
        if (strlen($newPassword) < 8 || strlen($newPassword) > 128) {
            $errors['newPassword'] = 'Kata sandi baru harus 8 sampai 128 karakter.';
        }
        if ($newPassword !== $confirmPassword) {
            $errors['confirmPassword'] = 'Konfirmasi kata sandi baru belum sama.';
        }
        if ($errors) {
            antara_json(['success' => false, 'message' => 'Periksa kembali perubahan kata sandi.', 'errors' => $errors], 422);
        }

        $hash = password_hash($newPassword, PASSWORD_DEFAULT);
        if ($hash === false) {
            throw new RuntimeException('Password hashing gagal.');
        }

        $update = $pdo->prepare('UPDATE users SET password_hash = :password_hash, updated_at = NOW() WHERE id = :id');
        $update->execute(['password_hash' => $hash, 'id' => $userId]);

        antara_json(['success' => true, 'message' => 'Kata sandi berhasil diperbarui.']);
    }

    antara_json(['success' => false, 'message' => 'Aksi pengaturan akun tidak dikenal.'], 400);
} catch (PDOException $e) {
    if ((string)$e->getCode() === '23000') {
        antara_json(['success' => false, 'message' => 'Username atau email sudah digunakan akun lain.'], 409);
    }
    error_log('ANTARA account update error: ' . $e->getMessage());
    antara_json(['success' => false, 'message' => 'Pengaturan akun gagal disimpan karena gangguan database.'], 500);
} catch (Throwable $e) {
    error_log('ANTARA account update error: ' . $e->getMessage());
    antara_json(['success' => false, 'message' => 'Pengaturan akun gagal diproses.'], 500);
}
