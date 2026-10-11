<?php
declare(strict_types=1);
require_once __DIR__ . '/_bootstrap.php';

antara_method('GET');
$pdo = antara_db_or_fail();

try {
    $pdo->query('SELECT 1');
    antara_json(['success' => true, 'database' => 'connected', 'php' => PHP_VERSION]);
} catch (PDOException $e) {
    error_log('ANTARA health error: ' . $e->getMessage());
    antara_json(['success' => false, 'database' => 'unavailable'], 503);
}
