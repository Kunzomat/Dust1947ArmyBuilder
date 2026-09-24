#!/usr/bin/env php
<?php
/**
 * Dust 1947 Batch API Importer
 * Importiert die 459 Einheiten in Batches über die HTTP API
 */

$jsonFile = isset($argv[1]) ? $argv[1] : __DIR__ . '/dust1947_import_data.json';

// Config
define('API_BASE', 'http://localhost:8180/admin_api.php');
define('API_KEY', 'local-dev-key-12345');
define('BATCH_SIZE', 10);

echo "\n╔════════════════════════════════════════════════════════════════╗\n";
echo "║         DUST 1947 BATCH API IMPORT                            ║\n";
echo "╚════════════════════════════════════════════════════════════════╝\n\n";

// Validate file
if (!file_exists($jsonFile)) {
    echo "❌ ERROR: File not found: $jsonFile\n";
    exit(1);
}

// Load JSON
echo "📖 Loading JSON...\n";
$json = json_decode(file_get_contents($jsonFile), true);
if (!$json || !isset($json['units'])) {
    echo "❌ ERROR: Invalid JSON\n";
    exit(1);
}

$units = $json['units'];
echo "✅ Loaded " . count($units) . " units\n\n";

// Ensure game system exists
echo "🎮 Ensuring Game System exists...\n";
$systems = callAPI('game_systems.list', 'GET');
$gameSystemId = null;

if ($systems && is_array($systems)) {
    foreach ($systems as $sys) {
        if ($sys['name'] === 'Dust 1947') {
            $gameSystemId = $sys['id'];
            break;
        }
    }
}

if (!$gameSystemId) {
    echo "   Creating new Game System...\n";
    $result = callAPI('game_systems.create', 'POST', [
        'name' => 'Dust 1947',
        'description' => 'Dust 1947 alternate history wargame'
    ]);
    if ($result && isset($result['id'])) {
        $gameSystemId = $result['id'];
    }
}

if ($gameSystemId) {
    echo "   ✅ Game System ID: $gameSystemId\n\n";
} else {
    echo "   ⚠️  Could not get/create game system\n\n";
    $gameSystemId = 1;
}

// Import units in batches
echo "📥 Importing " . count($units) . " units in batches...\n";
echo str_repeat("─", 60) . "\n";

$stats = [
    'total' => 0,
    'success' => 0,
    'failed' => 0,
    'errors' => []
];

$startTime = microtime(true);
$batch = [];

foreach ($units as $index => $unit) {
    $batch[] = [
        'name' => $unit['card_id'],
        'type' => $unit['type'] ?? 'I',
        'level' => intval($unit['level'] ?? 1),
        'points' => intval($unit['points'] ?? 10),
        'health' => intval($unit['health'] ?? 1),
        'speed' => intval($unit['speed'] ?? 4),
        'march_speed' => intval($unit['march_speed'] ?? 2),
        'image_url' => $unit['image_url'] ?? '',
        'notes' => 'Card: ' . $unit['card_id'],
        'game_system_id' => $gameSystemId
    ];

    $stats['total']++;

    // Send batch
    if (count($batch) >= BATCH_SIZE || $index === count($units) - 1) {
        foreach ($batch as $unitData) {
            $result = callAPI('units.create', 'POST', $unitData);
            if ($result && isset($result['id'])) {
                $stats['success']++;
            } else {
                $stats['failed']++;
                $stats['errors'][] = [
                    'unit' => $unitData['name'],
                    'error' => $result['error'] ?? 'Unknown error'
                ];
            }
        }

        $progress = round(($index + 1) / count($units) * 100);
        echo "[" . str_pad($progress, 3, " ", STR_PAD_LEFT) . "%] " . ($index + 1) . "/" . count($units) . "\n";

        $batch = [];
    }
}

$endTime = microtime(true);
$duration = round($endTime - $startTime, 2);

// Summary
echo str_repeat("─", 60) . "\n\n";
echo "📊 IMPORT SUMMARY\n";
echo "═" . str_repeat("═", 58) . "═\n";
echo "Total units:    " . $stats['total'] . "\n";
echo "Success:        " . $stats['success'] . "\n";
echo "Failed:         " . $stats['failed'] . "\n";
echo "Duration:       " . $duration . " seconds\n";
if ($stats['total'] > 0) {
    echo "Speed:          " . round($stats['total'] / $duration) . " units/sec\n";
}
echo "═" . str_repeat("═", 58) . "═\n";

if (!empty($stats['errors'])) {
    echo "\n⚠️  Errors (first 5):\n";
    foreach (array_slice($stats['errors'], 0, 5) as $error) {
        echo "   • " . $error['unit'] . ": " . substr($error['error'], 0, 50) . "\n";
    }
}

echo "\n✅ Import process complete!\n\n";

// ============================================
// API HELPER FUNCTION
// ============================================

function callAPI($action, $method = 'GET', $data = null) {
    $url = API_BASE . '?action=' . urlencode($action);

    $headers = [
        'X-API-Key: ' . API_KEY,
        'Content-Type: application/json'
    ];

    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $method);
    curl_setopt($ch, CURLOPT_TIMEOUT, 10);

    if ($method === 'POST' && $data) {
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
    }

    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $error = curl_error($ch);
    curl_close($ch);

    if ($error) {
        return ['error' => $error];
    }

    if ($httpCode >= 400) {
        return ['error' => "HTTP $httpCode"];
    }

    return json_decode($response, true);
}

exit($stats['failed'] > 0 ? 1 : 0);
?>

