<?php
declare(strict_types=1);
require_once dirname(__DIR__) . '/_bootstrap.php';

antara_method('POST');
antara_enforce_write_origin();
$userId = antara_require_user();
$data = antara_input();
$action = strtolower(trim((string)($data['action'] ?? 'profile')));
$pdo = antara_db_or_fail();
$hasBio = antara_ensure_users_bio_column($pdo);
$bioColumn = $hasBio ? ', bio' : '';

try {
    $stmt = $pdo->prepare('SELECT id, full_name, username, email, password_hash, avatar_url' . $bioColumn . ', created_at FROM users WHERE id = :id LIMIT 1');
    $stmt->execute(['id' => $userId]);
    $current = $stmt->fetch();

    if (!$current) {
        $_SESSION = [];
        session_destroy();
        antara_json(['success' => false, 'message' => 'Sesi akun tidak ditemukan. Silakan masuk kembali.'], 401);
    }

    if ($action === 'avatar') {
        if (!isset($_FILES['avatar']) || !is_array($_FILES['avatar'])) {
            antara_json(['success' => false, 'message' => 'Pilih foto profil terlebih dahulu.'], 422);
        }

        $file = $_FILES['avatar'];
        $uploadError = (int)($file['error'] ?? UPLOAD_ERR_NO_FILE);
        if ($uploadError !== UPLOAD_ERR_OK) {
            antara_json(['success' => false, 'message' => 'Upload foto profil gagal. Coba pilih foto lain.'], 422);
        }

        $tmpName = (string)($file['tmp_name'] ?? '');
        $size = (int)($file['size'] ?? 0);
        if ($tmpName === '' || !is_uploaded_file($tmpName) || $size <= 0 || $size > 3 * 1024 * 1024) {
            antara_json(['success' => false, 'message' => 'Foto profil maksimal 3 MB setelah diproses.'], 422);
        }

        $imageInfo = @getimagesize($tmpName);
        if (!is_array($imageInfo) || empty($imageInfo[0]) || empty($imageInfo[1])) {
            antara_json(['success' => false, 'message' => 'File yang dipilih bukan gambar yang valid.'], 422);
        }
        if ((int)$imageInfo[0] > 4096 || (int)$imageInfo[1] > 4096) {
            antara_json(['success' => false, 'message' => 'Resolusi foto terlalu besar.'], 422);
        }

        if (class_exists('finfo')) {
            $finfo = new finfo(FILEINFO_MIME_TYPE);
            $mime = (string)$finfo->file($tmpName);
        } else {
            $mime = (string)($imageInfo['mime'] ?? '');
        }
        $extensions = [
            'image/jpeg' => 'jpg',
            'image/png' => 'png',
            'image/webp' => 'webp',
        ];
        if (!isset($extensions[$mime])) {
            antara_json(['success' => false, 'message' => 'Format foto harus JPG, PNG, atau WebP.'], 422);
        }

        $webRoot = dirname(__DIR__, 2);
        $relativeDir = 'assets/uploads/avatars';
        $uploadDir = $webRoot . DIRECTORY_SEPARATOR . 'assets' . DIRECTORY_SEPARATOR . 'uploads' . DIRECTORY_SEPARATOR . 'avatars';
        if (!is_dir($uploadDir) && !mkdir($uploadDir, 0755, true) && !is_dir($uploadDir)) {
            throw new RuntimeException('Direktori avatar tidak dapat dibuat.');
        }

        $filename = sprintf('u%d-%s.%s', $userId, bin2hex(random_bytes(12)), $extensions[$mime]);
        $destination = $uploadDir . DIRECTORY_SEPARATOR . $filename;
        if (!move_uploaded_file($tmpName, $destination)) {
            throw new RuntimeException('File avatar tidak dapat disimpan.');
        }
        @chmod($destination, 0644);

        $avatarUrl = $relativeDir . '/' . $filename;
        $previousAvatar = trim((string)($current['avatar_url'] ?? ''));
        $update = $pdo->prepare('UPDATE users SET avatar_url = :avatar_url, updated_at = NOW() WHERE id = :id');
        $update->execute(['avatar_url' => $avatarUrl, 'id' => $userId]);
        $current['avatar_url'] = $avatarUrl;

        if ($previousAvatar !== '' && str_starts_with($previousAvatar, $relativeDir . '/')) {
            $oldPath = $webRoot . DIRECTORY_SEPARATOR . str_replace('/', DIRECTORY_SEPARATOR, $previousAvatar);
            if (is_file($oldPath) && realpath(dirname($oldPath)) === realpath($uploadDir)) {
                @unlink($oldPath);
            }
        }

        antara_json([
            'success' => true,
            'message' => 'Foto profil berhasil diperbarui.',
            'user' => antara_user_payload($current),
        ]);
    }

    if ($action === 'avatar-remove') {
        $webRoot = dirname(__DIR__, 2);
        $relativeDir = 'assets/uploads/avatars';
        $uploadDir = $webRoot . DIRECTORY_SEPARATOR . 'assets' . DIRECTORY_SEPARATOR . 'uploads' . DIRECTORY_SEPARATOR . 'avatars';
        $previousAvatar = trim((string)($current['avatar_url'] ?? ''));

        $update = $pdo->prepare('UPDATE users SET avatar_url = NULL, updated_at = NOW() WHERE id = :id');
        $update->execute(['id' => $userId]);
        $current['avatar_url'] = null;

        if ($previousAvatar !== '' && str_starts_with($previousAvatar, $relativeDir . '/')) {
            $oldPath = $webRoot . DIRECTORY_SEPARATOR . str_replace('/', DIRECTORY_SEPARATOR, $previousAvatar);
            if (is_file($oldPath) && is_dir($uploadDir) && realpath(dirname($oldPath)) === realpath($uploadDir)) {
                @unlink($oldPath);
            }
        }

        antara_json([
            'success' => true,
            'message' => 'Foto profil dihapus.',
            'user' => antara_user_payload($current),
        ]);
    }

    if ($action === 'profile') {
        $fullName = trim((string)($data['fullName'] ?? $current['full_name']));
        $username = trim((string)($data['username'] ?? $current['username']));
        $email = strtolower(trim((string)($data['email'] ?? $current['email'])));
        $bio = trim((string)($data['bio'] ?? ($current['bio'] ?? '')));
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
        $bioLength = function_exists('mb_strlen') ? mb_strlen($bio) : strlen($bio);
        if ($bioLength > 280) {
            $errors['bio'] = 'Bio maksimal 280 karakter.';
        }
        if ($bio !== '' && !$hasBio) {
            $errors['bio'] = 'Penyimpanan bio belum siap di database.';
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

        if ($hasBio) {
            $update = $pdo->prepare('UPDATE users SET full_name = :full_name, username = :username, email = :email, bio = :bio, updated_at = NOW() WHERE id = :id');
            $update->execute([
                'full_name' => $fullName,
                'username' => $username,
                'email' => $email,
                'bio' => $bio !== '' ? $bio : null,
                'id' => $userId,
            ]);
        } else {
            $update = $pdo->prepare('UPDATE users SET full_name = :full_name, username = :username, email = :email, updated_at = NOW() WHERE id = :id');
            $update->execute([
                'full_name' => $fullName,
                'username' => $username,
                'email' => $email,
                'id' => $userId,
            ]);
        }

        $current['full_name'] = $fullName;
        $current['username'] = $username;
        $current['email'] = $email;
        if ($hasBio) $current['bio'] = $bio;

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
