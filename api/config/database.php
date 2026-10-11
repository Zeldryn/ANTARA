<?php
declare(strict_types=1);

function antara_db(): PDO
{
    static $pdo = null;
    if ($pdo instanceof PDO) {
        return $pdo;
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
