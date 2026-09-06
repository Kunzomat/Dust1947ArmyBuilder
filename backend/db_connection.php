<?php
// Zentrale Datenbankverbindung
// Verwendet automatisch lokale oder remote Config

// Prüfe ob lokale Config existiert
if (file_exists(__DIR__ . '/config.local.php')) {
    require_once __DIR__ . '/config.local.php';
} else {
    // Remote/Production Config
    define('DB_HOST', 'database-5019385374.webspace-host.com');
    define('DB_NAME', 'dbs15166077');
    define('DB_USER', 'dbu358620');
    define('DB_PASS', '!Don10Draco!');

    // API Key von externem config.php
    if (!defined('API_KEY')) {
        $configPath = dirname(__DIR__, 3) . '/config.php';
        if (file_exists($configPath)) {
            require_once $configPath;
        }
    }
}

mysqli_report(MYSQLI_REPORT_ERROR | MYSQLI_REPORT_STRICT);

function getDbConnection() {
    static $conn = null;

    if ($conn === null) {
        $conn = new mysqli(DB_HOST, DB_USER, DB_PASS, DB_NAME);
        $conn->set_charset("utf8mb4");
    }

    return $conn;
}

// Create global connection for backward compatibility
// Note: Errors are caught by the including script
$conn = new mysqli(DB_HOST, DB_USER, DB_PASS, DB_NAME);
$conn->set_charset("utf8mb4");

