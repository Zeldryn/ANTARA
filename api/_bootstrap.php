<?php
declare(strict_types=1);

require_once __DIR__ . '/config/database.php';

$isHttps = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off')
    || (($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '') === 'https');

if (session_status() !== PHP_SESSION_ACTIVE) {
    session_name('ANTARA_SESSION');
    session_set_cookie_params([
        'lifetime' => 0,
        'path' => '/',
        'secure' => $isHttps,
        'httponly' => true,
        'samesite' => 'Lax',
    ]);
    session_start();
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

function antara_user_payload(array $row): array
{
    return [
        'id' => (int)$row['id'],
        'name' => (string)$row['full_name'],
        'username' => (string)$row['username'],
        'email' => (string)$row['email'],
        'role' => 'PENJELAJAH ANTARA',
        'avatar' => $row['avatar_url'] ?? null,
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
