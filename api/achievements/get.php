<?php
declare(strict_types=1);
require_once dirname(__DIR__) . '/_bootstrap.php';
require_once __DIR__ . '/_achievements.php';
antara_method('GET');
$userId=antara_require_user();
$pdo=antara_db_or_fail();
try {
    $payload=antara_achievements_payload($pdo,$userId);
    antara_json(['success'=>true]+$payload);
} catch (Throwable $e) {
    error_log('ANTARA achievements get error: '.$e->getMessage());
    antara_json(['success'=>false,'message'=>'Pencapaian belum dapat dimuat dari database.'],503);
}
