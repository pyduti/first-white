<?php
declare(strict_types=1);

function isHttps(): bool
{
    return (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off')
        || (isset($_SERVER['SERVER_PORT']) && (int) $_SERVER['SERVER_PORT'] === 443)
        || (isset($_SERVER['HTTP_X_FORWARDED_PROTO']) && strtolower((string) $_SERVER['HTTP_X_FORWARDED_PROTO']) === 'https');
}

function respond(int $status, array $data): void
{
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
    header('Pragma: no-cache');
    header('X-Content-Type-Options: nosniff');
    header('Referrer-Policy: same-origin');

    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

ini_set('session.use_strict_mode', '1');
ini_set('session.cookie_httponly', '1');
ini_set('session.cookie_samesite', 'Lax');

if (isHttps()) {
    ini_set('session.cookie_secure', '1');
}

session_start();

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    respond(405, [
        'success' => false,
        'message' => 'Method not allowed.'
    ]);
}

$tokenLifetime = 1800;

if (
    empty($_SESSION['form_token'])
    || empty($_SESSION['form_token_created'])
    || (time() - (int) $_SESSION['form_token_created']) > $tokenLifetime
) {
    $_SESSION['form_token'] = bin2hex(random_bytes(32));
    $_SESSION['form_token_created'] = time();
}

respond(200, [
    'success' => true,
    'token' => $_SESSION['form_token'],
    'expiresIn' => $tokenLifetime
]);