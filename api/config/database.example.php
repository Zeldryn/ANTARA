<?php
declare(strict_types=1);

// Generic XAMPP defaults only. Existing database.php takes precedence.
// Hosting credentials must be supplied through server environment variables.
function antara_db(): PDO
{
    static $pdo = null;
    if ($pdo instanceof PDO) {
        return $pdo;
    }

    $setting = static function (string $name, string $default): string {
        $value = getenv($name);
        return $value === false ? $default : $value;
    };
    $host = $setting('ANTARA_DB_HOST', '127.0.0.1');
    $port = $setting('ANTARA_DB_PORT', '3306');
    $database = $setting('ANTARA_DB_NAME', 'antara');
    $username = $setting('ANTARA_DB_USER', 'root');
    $password = $setting('ANTARA_DB_PASSWORD', '');

    if (!preg_match('/^[0-9]{1,5}$/', $port) || (int)$port < 1 || (int)$port > 65535) {
        throw new RuntimeException('Port database ANTARA tidak valid.');
    }
    if (str_contains($host, ';') || str_contains($database, ';')) {
        throw new RuntimeException('Konfigurasi database ANTARA tidak valid.');
    }
    $pdo = new PDO(
        "mysql:host={$host};port={$port};dbname={$database};charset=utf8mb4",
        $username,
        $password,
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
         PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
         PDO::ATTR_EMULATE_PREPARES => false]
    );
    return $pdo;
}
