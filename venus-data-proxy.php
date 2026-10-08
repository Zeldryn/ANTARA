<?php
declare(strict_types=1);

/*
 * ANTARA Venus scientific-data same-origin cache.
 *
 * Browsers can reject the NASA PDS fallback because the archive does not
 * consistently expose permissive CORS headers. This endpoint is intentionally
 * tiny: it fetches one fixed, public PDS product on the server, validates it,
 * caches it locally, and returns it from the same origin as ANTARA.
 */

$asset = $_GET['asset'] ?? '';
if ($asset !== 'topogrd') {
    http_response_code(400);
    header('Content-Type: text/plain; charset=utf-8');
    echo 'Unsupported Venus data asset.';
    exit;
}

$source = 'https://pds-geosciences.wustl.edu/mgn/mgn-v-rss-5-gravity-l2-v1/mg_5201/images/topogrd.img';
$cacheDir = __DIR__ . DIRECTORY_SEPARATOR . 'assets' . DIRECTORY_SEPARATOR . 'venus-data';
$cacheFile = $cacheDir . DIRECTORY_SEPARATOR . 'topogrd.img';
$expectedBytes = 64800;

function serve_topography(string $bytes) {
    header('Content-Type: application/octet-stream');
    header('Content-Length: ' . strlen($bytes));
    header('Cache-Control: public, max-age=604800, immutable');
    header('X-ANTARA-Source: NASA-PDS-Magellan-Topography');
    echo $bytes;
    exit;
}

if (is_file($cacheFile)) {
    $cached = @file_get_contents($cacheFile);
    if ($cached !== false && strlen($cached) === $expectedBytes) {
        serve_topography($cached);
    }
}

$bytes = false;
if (function_exists('curl_init')) {
    $ch = curl_init($source);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_FOLLOWLOCATION => true,
        CURLOPT_CONNECTTIMEOUT => 8,
        CURLOPT_TIMEOUT => 20,
        CURLOPT_USERAGENT => 'ANTARA-Education/1.0',
        CURLOPT_SSL_VERIFYPEER => true,
        CURLOPT_FAILONERROR => true,
    ]);
    $result = curl_exec($ch);
    if (is_string($result)) $bytes = $result;
    curl_close($ch);
}

if ($bytes === false) {
    $context = stream_context_create([
        'http' => [
            'timeout' => 20,
            'follow_location' => 1,
            'user_agent' => 'ANTARA-Education/1.0',
        ],
        'ssl' => [
            'verify_peer' => true,
            'verify_peer_name' => true,
        ],
    ]);
    $result = @file_get_contents($source, false, $context);
    if (is_string($result)) $bytes = $result;
}

if (!is_string($bytes) || strlen($bytes) !== $expectedBytes) {
    http_response_code(502);
    header('Content-Type: text/plain; charset=utf-8');
    header('Cache-Control: no-store');
    echo 'NASA PDS topography could not be fetched by the server.';
    exit;
}

if (!is_dir($cacheDir)) @mkdir($cacheDir, 0775, true);
$tmp = $cacheFile . '.tmp';
if (@file_put_contents($tmp, $bytes, LOCK_EX) === $expectedBytes) {
    @rename($tmp, $cacheFile);
} else {
    @unlink($tmp);
}

serve_topography($bytes);
