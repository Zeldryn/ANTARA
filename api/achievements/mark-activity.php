<?php
declare(strict_types=1);
require_once dirname(__DIR__) . '/_bootstrap.php';
require_once __DIR__ . '/_achievements.php';
antara_method('POST');
antara_enforce_write_origin();
antara_session_rate_limit('achievement_activity',20,60);
$userId=antara_require_user();
$data=antara_input();
$key=strtolower(trim((string)($data['key'] ?? '')));
$allowed=['first-launch'=>'Peluncuran pertama'];
if (!isset($allowed[$key])) antara_json(['success'=>false,'message'=>'Aktivitas achievement tidak dikenali.'],422);
$pdo=antara_db_or_fail();
try {
    antara_achievements_ensure_schema($pdo);
    $stmt=$pdo->prepare('INSERT IGNORE INTO user_activity_events (user_id,event_key,event_label,created_at) VALUES (:user_id,:event_key,:event_label,NOW())');
    $stmt->execute(['user_id'=>$userId,'event_key'=>$key,'event_label'=>$allowed[$key]]);
    $payload=antara_achievements_payload($pdo,$userId);
    antara_json(['success'=>true,'recorded'=>$stmt->rowCount()>0,'summary'=>$payload['summary']]);
} catch (Throwable $e) {
    error_log('ANTARA achievement activity error: '.$e->getMessage());
    antara_json(['success'=>false,'message'=>'Aktivitas belum dapat dicatat.'],503);
}
