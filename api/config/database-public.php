<?php
declare(strict_types=1);
/**
 * Safe deployable database connector: credentials are loaded only from environment.
 * A private api/config/database.php may override this file on a server, but that
 * private file MUST NOT be committed or distributed in a public ZIP.
 * XAMPP localhost works with standard development defaults.
 */
function antara_db(): PDO
{
    static $pdo = null;
    if ($pdo instanceof PDO) return $pdo;
    $serverHost = strtolower((string)($_SERVER['HTTP_HOST'] ?? $_SERVER['SERVER_NAME'] ?? 'localhost'));
    $isLocal = preg_match('/^(localhost|127\.0\.0\.1|\[::1\])(?::[0-9]+)?$/', $serverHost) === 1;
    if (!$isLocal && (getenv('ANTARA_DB_NAME') === false || getenv('ANTARA_DB_USER') === false)) {
        throw new PDOException('Set ANTARA_DB_NAME and ANTARA_DB_USER in the server environment.');
    }
    $host = getenv('ANTARA_DB_HOST') ?: '127.0.0.1';
    $port = getenv('ANTARA_DB_PORT') ?: '3306';
    $name = getenv('ANTARA_DB_NAME') ?: 'antara';
    $user = getenv('ANTARA_DB_USER') ?: 'root';
    $pass = getenv('ANTARA_DB_PASS') ?: '';
    $dsn = "mysql:host={$host};port={$port};dbname={$name};charset=utf8mb4";
    $pdo = new PDO($dsn, $user, $pass, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ]);
    return $pdo;
}
