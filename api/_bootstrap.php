<?php
declare(strict_types=1);

require_once __DIR__ . '/config/database.php';

$isHttps = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off')
    || (($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '') === 'https');

const ANTARA_SESSION_TTL = 2592000; // 30 days
const ANTARA_REMEMBER_COOKIE = 'ANTARA_REMEMBER';

if (session_status() !== PHP_SESSION_ACTIVE) {
    // Keep the authenticated PHP session alive across browser restarts. The
    // remember token below can recreate it if the PHP session file is cleaned.
    ini_set('session.gc_maxlifetime', (string)ANTARA_SESSION_TTL);
    session_name('ANTARA_SESSION');
    session_set_cookie_params([
        'lifetime' => ANTARA_SESSION_TTL,
        'path' => '/',
        'secure' => $isHttps,
        'httponly' => true,
        'samesite' => 'Lax',
    ]);
    session_start();

    // Rolling expiration. This refreshes only the opaque session id cookie,
    // never account data in JavaScript-accessible storage.
    if (session_id() !== '' && isset($_COOKIE[session_name()])) {
        setcookie(session_name(), session_id(), [
            'expires' => time() + ANTARA_SESSION_TTL,
            'path' => '/',
            'secure' => $isHttps,
            'httponly' => true,
            'samesite' => 'Lax',
        ]);
    }
}

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
header('Pragma: no-cache');
header('X-Content-Type-Options: nosniff');
header('Referrer-Policy: same-origin');

function antara_json(array $payload, int $status = 200): never
{
    http_response_code($status);
    echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function antara_method(string $method): void
{
    if (strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET') !== strtoupper($method)) {
        header('Allow: ' . strtoupper($method));
        antara_json(['success' => false, 'message' => 'Metode request tidak diizinkan.'], 405);
    }
}

function antara_input(): array
{
    $contentType = strtolower((string)($_SERVER['CONTENT_TYPE'] ?? ''));

    if (str_contains($contentType, 'application/json')) {
        $raw = file_get_contents('php://input');
        if ($raw === false || trim($raw) === '') {
            return [];
        }

        try {
            $decoded = json_decode($raw, true, 32, JSON_THROW_ON_ERROR);
        } catch (JsonException) {
            antara_json(['success' => false, 'message' => 'Payload JSON tidak valid.'], 400);
        }

        if (!is_array($decoded)) {
            antara_json(['success' => false, 'message' => 'Payload request tidak valid.'], 400);
        }

        return $decoded;
    }

    return $_POST;
}


function antara_enforce_write_origin(): void
{
    $method = strtoupper((string)($_SERVER['REQUEST_METHOD'] ?? 'GET'));
    if (!in_array($method, ['POST', 'PUT', 'PATCH', 'DELETE'], true)) {
        return;
    }

    $fetchSite = strtolower(trim((string)($_SERVER['HTTP_SEC_FETCH_SITE'] ?? '')));
    if ($fetchSite !== '' && !in_array($fetchSite, ['same-origin', 'none'], true)) {
        antara_json(['success' => false, 'message' => 'Request lintas situs ditolak.'], 403);
    }

    $origin = trim((string)($_SERVER['HTTP_ORIGIN'] ?? ''));
    if ($origin !== '') {
        $originHost = strtolower((string)(parse_url($origin, PHP_URL_HOST) ?? ''));
        $requestHost = strtolower(preg_replace('/:\\d+$/', '', (string)($_SERVER['HTTP_HOST'] ?? '')) ?? '');
        if ($originHost === '' || $requestHost === '' || !hash_equals($requestHost, $originHost)) {
            antara_json(['success' => false, 'message' => 'Origin request tidak valid.'], 403);
        }
    }
}

function antara_session_rate_limit(string $bucket, int $limit, int $windowSeconds): void
{
    $now = time();
    $key = 'rate_' . preg_replace('/[^a-z0-9_-]/i', '_', $bucket);
    $events = $_SESSION[$key] ?? [];
    if (!is_array($events)) $events = [];
    $events = array_values(array_filter($events, static fn($ts): bool => is_int($ts) && $ts > ($now - $windowSeconds)));

    if (count($events) >= $limit) {
        header('Retry-After: ' . $windowSeconds);
        antara_json(['success' => false, 'message' => 'Terlalu banyak request. Coba lagi sebentar.'], 429);
    }

    $events[] = $now;
    $_SESSION[$key] = $events;
}

function antara_ensure_users_bio_column(PDO $pdo): bool
{
    static $checked = null;
    if ($checked !== null) return $checked;

    try {
        $column = $pdo->query("SHOW COLUMNS FROM users LIKE 'bio'")->fetch();
        if ($column) {
            $checked = true;
            return true;
        }

        $pdo->exec("ALTER TABLE users ADD COLUMN bio VARCHAR(280) NULL AFTER avatar_url");
        $checked = true;
        return true;
    } catch (Throwable $e) {
        error_log('ANTARA bio schema check error: ' . $e->getMessage());
        $checked = false;
        return false;
    }
}

function antara_user_payload(array $row): array
{
    return [
        'id' => (int)$row['id'],
        'name' => (string)$row['full_name'],
        'username' => (string)$row['username'],
        'email' => (string)$row['email'],
        'role' => 'PENJELAJAH ANTARA',
        'avatar' => $row['avatar_url'] ?? null,
        'bio' => isset($row['bio']) ? (string)$row['bio'] : '',
        'createdAt' => $row['created_at'] ?? null,
    ];
}

function antara_require_user(): int
{
    $userId = (int)($_SESSION['user_id'] ?? 0);
    if ($userId <= 0) {
        antara_json(['success' => false, 'message' => 'Silakan masuk ke ANTARA terlebih dahulu.'], 401);
    }
    return $userId;
}

function antara_db_or_fail(): PDO
{
    try {
        return antara_db();
    } catch (PDOException $e) {
        error_log('ANTARA database error: ' . $e->getMessage());
        antara_json([
            'success' => false,
            'message' => 'Database ANTARA belum dapat dihubungi. Periksa MySQL dan konfigurasi database.',
        ], 503);
    }
}

function antara_remember_ensure_schema(PDO $pdo): void
{
    $pdo->exec(
        'CREATE TABLE IF NOT EXISTS user_remember_tokens (
            id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
            user_id BIGINT UNSIGNED NOT NULL,
            token_hash CHAR(64) NOT NULL,
            expires_at DATETIME NOT NULL,
            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            last_used_at DATETIME NULL,
            PRIMARY KEY (id),
            UNIQUE KEY uq_remember_token_hash (token_hash),
            KEY idx_remember_user (user_id),
            KEY idx_remember_expiry (expires_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci'
    );
}

function antara_set_remember_cookie(string $token, int $expiresAt): void
{
    global $isHttps;
    setcookie(ANTARA_REMEMBER_COOKIE, $token, [
        'expires' => $expiresAt,
        'path' => '/',
        'secure' => $isHttps,
        'httponly' => true,
        'samesite' => 'Lax',
    ]);
}

function antara_clear_remember_cookie(): void
{
    global $isHttps;
    setcookie(ANTARA_REMEMBER_COOKIE, '', [
        'expires' => time() - 3600,
        'path' => '/',
        'secure' => $isHttps,
        'httponly' => true,
        'samesite' => 'Lax',
    ]);
}

function antara_issue_remember_token(PDO $pdo, int $userId): void
{
    if ($userId <= 0) return;
    antara_remember_ensure_schema($pdo);

    // Keep the token list small and revoke expired tokens while we are here.
    $pdo->exec('DELETE FROM user_remember_tokens WHERE expires_at <= NOW()');

    $token = bin2hex(random_bytes(32));
    $hash = hash('sha256', $token);
    $expiresAt = time() + ANTARA_SESSION_TTL;
    $expiresSql = date('Y-m-d H:i:s', $expiresAt);
    $stmt = $pdo->prepare(
        'INSERT INTO user_remember_tokens (user_id, token_hash, expires_at, last_used_at)
         VALUES (:user_id, :token_hash, :expires_at, NOW())'
    );
    $stmt->execute(['user_id' => $userId, 'token_hash' => $hash, 'expires_at' => $expiresSql]);
    antara_set_remember_cookie($token, $expiresAt);
}

function antara_revoke_remember_token(?PDO $pdo = null): void
{
    $token = trim((string)($_COOKIE[ANTARA_REMEMBER_COOKIE] ?? ''));
    if ($token !== '' && strlen($token) === 64 && ctype_xdigit($token)) {
        try {
            $pdo ??= antara_db();
            antara_remember_ensure_schema($pdo);
            $stmt = $pdo->prepare('DELETE FROM user_remember_tokens WHERE token_hash = :token_hash');
            $stmt->execute(['token_hash' => hash('sha256', $token)]);
        } catch (Throwable $e) {
            error_log('ANTARA remember revoke error: ' . $e->getMessage());
        }
    }
    antara_clear_remember_cookie();
}

function antara_restore_remembered_session(): void
{
    if ((int)($_SESSION['user_id'] ?? 0) > 0) return;

    $token = trim((string)($_COOKIE[ANTARA_REMEMBER_COOKIE] ?? ''));
    if ($token === '' || strlen($token) !== 64 || !ctype_xdigit($token)) return;

    try {
        $pdo = antara_db();
        antara_remember_ensure_schema($pdo);
        $stmt = $pdo->prepare(
            'SELECT id, user_id FROM user_remember_tokens
             WHERE token_hash = :token_hash AND expires_at > NOW() LIMIT 1'
        );
        $stmt->execute(['token_hash' => hash('sha256', $token)]);
        $row = $stmt->fetch();
        if (!$row) {
            antara_clear_remember_cookie();
            return;
        }

        session_regenerate_id(true);
        $_SESSION['user_id'] = (int)$row['user_id'];

        // Sliding 30-day window for an actively used remembered account.
        $expiresAt = time() + ANTARA_SESSION_TTL;
        $refresh = $pdo->prepare(
            'UPDATE user_remember_tokens SET expires_at = :expires_at, last_used_at = NOW() WHERE id = :id'
        );
        $refresh->execute(['expires_at' => date('Y-m-d H:i:s', $expiresAt), 'id' => (int)$row['id']]);
        antara_set_remember_cookie($token, $expiresAt);
    } catch (Throwable $e) {
        // A temporary DB outage must not destroy a valid browser token. The next
        // request can retry restoration when the database is reachable again.
        error_log('ANTARA remember restore error: ' . $e->getMessage());
    }
}

antara_restore_remembered_session();

