<?php
declare(strict_types=1);
require_once dirname(__DIR__) . '/_bootstrap.php';

antara_method('POST');
antara_require_user();

antara_json([
    'success' => false,
    'message' => 'Pengiriman skor mentah dinonaktifkan. Skor leaderboard hanya diterima dari run permainan yang diverifikasi server.',
    'code' => 'RAW_SCORE_SUBMISSION_DISABLED',
], 410);
