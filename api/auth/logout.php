<?php
declare(strict_types=1);
require_once dirname(__DIR__) . '/_bootstrap.php';

antara_method('POST');

// Revoke the long-lived browser token before destroying the PHP session.
antara_revoke_remember_token();

$_SESSION = [];
if (ini_get('session.use_cookies')) {
    $params = session_get_cookie_params();
    setcookie(session_name(), '', time() - 42000, $params['path'], $params['domain'], $params['secure'], $params['httponly']);
}
session_destroy();

antara_json(['success' => true, 'message' => 'Sesi ANTARA telah ditutup.']);
