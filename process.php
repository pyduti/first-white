<?php
declare(strict_types=1);

function isHttps(): bool
{
    return (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off')
        || (isset($_SERVER['SERVER_PORT']) && (int) $_SERVER['SERVER_PORT'] === 443)
        || (isset($_SERVER['HTTP_X_FORWARDED_PROTO']) && strtolower((string) $_SERVER['HTTP_X_FORWARDED_PROTO']) === 'https');
}

function strLength(string $value): int
{
    if (function_exists('mb_strlen')) {
        return mb_strlen($value, 'UTF-8');
    }

    if (preg_match_all('/./us', $value, $matches) !== false) {
        return count($matches[0]);
    }

    return strlen($value);
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

function normalizeText(string $value): string
{
    $value = preg_replace('/\s+/u', ' ', trim($value)) ?? '';
    return str_replace(["\r", "\n"], ' ', $value);
}

function cleanMessage(string $value): string
{
    $value = trim($value);
    return preg_replace('/[^\P{C}\t\n\r]+/u', '', $value) ?? '';
}

function currentHostOnly(): string
{
    $rawHost = trim((string) ($_SERVER['HTTP_HOST'] ?? ''));

    if ($rawHost === '') {
        return '';
    }

    $host = parse_url('//' . $rawHost, PHP_URL_HOST);

    return is_string($host) ? strtolower($host) : strtolower($rawHost);
}

function isValidRequestOrigin(): bool
{
    $allowedHost = currentHostOnly();

    if ($allowedHost === '') {
        return false;
    }

    $origin = trim((string) ($_SERVER['HTTP_ORIGIN'] ?? ''));

    if ($origin !== '') {
        $originHost = parse_url($origin, PHP_URL_HOST);
        return is_string($originHost) && strtolower($originHost) === $allowedHost;
    }

    $referer = trim((string) ($_SERVER['HTTP_REFERER'] ?? ''));

    if ($referer !== '') {
        $refererHost = parse_url($referer, PHP_URL_HOST);
        return is_string($refererHost) && strtolower($refererHost) === $allowedHost;
    }

    return true;
}

function ensureJsonContentType(): void
{
    $contentType = strtolower(trim((string) ($_SERVER['CONTENT_TYPE'] ?? '')));

    if ($contentType === '' || strpos($contentType, 'application/json') !== 0) {
        respond(415, [
            'success' => false,
            'message' => 'Invalid content type.'
        ]);
    }
}

function ensureValidUserAgent(): void
{
    $userAgent = trim((string) ($_SERVER['HTTP_USER_AGENT'] ?? ''));
    $length = strLength($userAgent);

    if ($userAgent === '' || $length < 10 || $length > 500) {
        respond(400, [
            'success' => false,
            'message' => 'Invalid request.'
        ]);
    }
}

function ensureSessionRateLimit(): void
{
    $now = time();

    if (!isset($_SESSION['contact_attempts']) || !is_array($_SESSION['contact_attempts'])) {
        $_SESSION['contact_attempts'] = [];
    }

    $_SESSION['contact_attempts'] = array_values(array_filter(
        $_SESSION['contact_attempts'],
        static fn ($ts): bool => is_numeric($ts) && ((int) $ts > ($now - 1800))
    ));

    if (!empty($_SESSION['last_contact_submit']) && ($now - (int) $_SESSION['last_contact_submit']) < 20) {
        respond(429, [
            'success' => false,
            'message' => 'Please wait a moment before sending another request.'
        ]);
    }

    if (count($_SESSION['contact_attempts']) >= 5) {
        respond(429, [
            'success' => false,
            'message' => 'Too many attempts. Please try again later.'
        ]);
    }
}

function registerSuccessfulSubmit(): void
{
    $now = time();

    if (!isset($_SESSION['contact_attempts']) || !is_array($_SESSION['contact_attempts'])) {
        $_SESSION['contact_attempts'] = [];
    }

    $_SESSION['last_contact_submit'] = $now;
    $_SESSION['contact_attempts'][] = $now;

    $_SESSION['form_token'] = bin2hex(random_bytes(32));
    $_SESSION['form_token_created'] = $now;

    $_SESSION['contact_success'] = true;
    $_SESSION['contact_success_at'] = $now;
}

ini_set('session.use_strict_mode', '1');
ini_set('session.cookie_httponly', '1');
ini_set('session.cookie_samesite', 'Lax');

if (isHttps()) {
    ini_set('session.cookie_secure', '1');
}

session_start();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    respond(405, [
        'success' => false,
        'message' => 'Method not allowed.'
    ]);
}

if (!isValidRequestOrigin()) {
    respond(403, [
        'success' => false,
        'message' => 'Invalid request origin.'
    ]);
}

ensureJsonContentType();
ensureValidUserAgent();
ensureSessionRateLimit();

$contentLength = isset($_SERVER['CONTENT_LENGTH']) ? (int) $_SERVER['CONTENT_LENGTH'] : 0;

if ($contentLength <= 0 || $contentLength > 25000) {
    respond(413, [
        'success' => false,
        'message' => 'Invalid request size.'
    ]);
}

$raw = file_get_contents('php://input');
$data = json_decode((string) $raw, true);

if (!is_array($data)) {
    respond(400, [
        'success' => false,
        'message' => 'Invalid request.'
    ]);
}

$token = (string) ($data['token'] ?? '');
$startedAt = (int) ($data['startedAt'] ?? 0);
$honeypot = trim((string) ($data['website'] ?? ''));

if (
    empty($_SESSION['form_token'])
    || empty($_SESSION['form_token_created'])
    || (time() - (int) $_SESSION['form_token_created']) > 1800
) {
    respond(403, [
        'success' => false,
        'message' => 'Security check failed. Please refresh the page and try again.'
    ]);
}

if (!hash_equals((string) $_SESSION['form_token'], $token)) {
    respond(403, [
        'success' => false,
        'message' => 'Security check failed. Please refresh the page and try again.'
    ]);
}

if ($honeypot !== '') {
    respond(400, [
        'success' => false,
        'message' => 'Request rejected.'
    ]);
}

$elapsedMs = (int) round(microtime(true) * 1000) - $startedAt;

if ($startedAt <= 0 || $elapsedMs < 1200 || $elapsedMs > 7200000) {
    respond(400, [
        'success' => false,
        'message' => 'Security timing check failed. Please try again.'
    ]);
}

$formId = normalizeText((string) ($data['formId'] ?? ''));
$fullName = normalizeText((string) ($data['full_name'] ?? ''));
$email = strtolower(normalizeText((string) ($data['email'] ?? '')));
$phone = normalizeText((string) ($data['phone'] ?? ''));
$destination = normalizeText((string) ($data['destination'] ?? ''));
$subject = normalizeText((string) ($data['subject'] ?? ''));
$message = cleanMessage((string) ($data['message'] ?? ''));
$consent = !empty($data['consent']) || !empty($data['privacyConsent']);

$nameRegex = "/^[\p{L}\s'’. -]{2,100}$/u";

if ($fullName === '' || !preg_match($nameRegex, $fullName)) {
    respond(422, [
        'success' => false,
        'message' => 'Please enter a valid full name.'
    ]);
}

if ($email === '' || !filter_var($email, FILTER_VALIDATE_EMAIL) || strlen($email) > 120) {
    respond(422, [
        'success' => false,
        'message' => 'Please enter a valid email address.'
    ]);
}

if (preg_match('/[\r\n]/', $email) || preg_match('/[\r\n]/', $fullName)) {
    respond(422, [
        'success' => false,
        'message' => 'Invalid input.'
    ]);
}

if ($phone !== '' && !preg_match('/^\+?[0-9()\s.\-]{7,22}$/', $phone)) {
    respond(422, [
        'success' => false,
        'message' => 'Please enter a valid phone number.'
    ]);
}

$allowedDestinations = [
    '',
    'england',
    'scotland',
    'wales',
    'northern-ireland',
    'undecided',
];

if (!in_array($destination, $allowedDestinations, true)) {
    respond(422, [
        'success' => false,
        'message' => 'Please select a valid destination.'
    ]);
}

if ($formId === 'contact-form') {
    if ($subject === '' || strLength($subject) < 3 || strLength($subject) > 120) {
        respond(422, [
            'success' => false,
            'message' => 'Please enter a valid subject.'
        ]);
    }
}

$messageLength = strLength($message);

if ($messageLength < 5) {
    respond(422, [
        'success' => false,
        'message' => 'Please enter your message.'
    ]);
}

if ($messageLength > 1500) {
    respond(422, [
        'success' => false,
        'message' => 'Your message is too long.'
    ]);
}

$urlCount = preg_match_all('/https?:\/\/|www\./i', $message);

if ($urlCount > 2) {
    respond(422, [
        'success' => false,
        'message' => 'Too many links in the message.'
    ]);
}

if (!$consent) {
    respond(422, [
        'success' => false,
        'message' => 'Please agree to the Privacy Policy before submitting the form.'
    ]);
}

registerSuccessfulSubmit();

usleep(random_int(800000, 1400000));

respond(200, [
    'success' => true,
    'message' => 'Thank you. Your message has been sent successfully.',
    'redirect' => 'thanks_you.php'
]);