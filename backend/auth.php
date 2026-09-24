<?php
// ===== CORS =====
$allowedOrigins = [
    "https://kunzomat.de",
    "http://localhost:3000",     // React Dev Server
    "http://localhost:3001",     // Local frontend alternate port
    "http://localhost:8000",     // PHP Built-in Server
    "http://127.0.0.1:3000",
    "http://127.0.0.1:3001",
    "http://127.0.0.1:8000"
];
$origin = $_SERVER['HTTP_ORIGIN'] ?? "";

if ($origin !== "" && (in_array($origin, $allowedOrigins, true) || preg_match('#^https?://(localhost|127\.0\.0\.1)(:\d+)?$#', $origin) === 1)) {
    header("Access-Control-Allow-Origin: $origin");
    header("Vary: Origin");
}

header("Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, X-API-Key");
header("Access-Control-Max-Age: 86400");
header("Content-Type: application/json; charset=UTF-8");

// ===== Preflight =====
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

// ===== API KEY =====
// Lokale Config hat Vorrang
if (file_exists(__DIR__ . '/config.local.php')) {
    require_once __DIR__ . '/config.local.php';
} else {
    // Production: Pfad ggf. anpassen!
    $configPath = dirname(__DIR__, 3) . '/config.php';
    if (file_exists($configPath)) {
        require_once $configPath;
    }
}

/**
 * Verify API Key from request headers
 * @return bool True if API key is valid
 */
function verifyApiKey() {
    $clientKey = $_SERVER['HTTP_X_API_KEY'] ?? '';
    return defined('API_KEY') && hash_equals(API_KEY, $clientKey);
}

$clientKey = $_SERVER['HTTP_X_API_KEY'] ?? '';

if (!defined('API_KEY') || !hash_equals(API_KEY, $clientKey)) {
    http_response_code(401);
    echo json_encode(["error" => "Unauthorized"]);
    exit;
}
