<?php
/**
 * Dust 1947 Bulk Import Script
 * Importiert Einheiten aus JSON-Datei in die Datenbank
 *
 * Verwendung: php import_units.php [json_file]
 */

// ============================================
// KONFIGURATION
// ============================================

$jsonFile = isset($argv[1]) ? $argv[1] : 'dust1947_import_data.json';
$API_BASE = 'http://localhost:8180/admin_api.php';
$API_KEY = getenv('REACT_APP_API_KEY') ?: 'your-api-key-here';

// ============================================
// FUNKTIONEN
// ============================================

function apiCall($endpoint, $method = 'GET', $data = null) {
    global $API_BASE, $API_KEY;

    $url = "$API_BASE?action=$endpoint";
    $headers = [
        'X-API-Key: ' . $API_KEY,
        'Content-Type: application/json'
    ];

    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $method);

    if ($method === 'POST' && $data) {
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
    }

    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    return [
        'code' => $httpCode,
        'data' => json_decode($response, true)
    ];
}

function getGameSystemId($name) {
    $result = apiCall('game_systems.list');
    if ($result['code'] === 200 && is_array($result['data'])) {
        foreach ($result['data'] as $system) {
            if ($system['name'] === $name) {
                return $system['id'];
            }
        }
    }

    // Create if not exists
    $createResult = apiCall('game_systems.create', 'POST', [
        'name' => $name,
        'description' => "Dust 1947 - $name"
    ]);

    if ($createResult['code'] === 200) {
        return $createResult['data']['id'];
    }

    return null;
}

function getFactionId($name) {
    $result = apiCall('factions.list');
    if ($result['code'] === 200 && is_array($result['data'])) {
        foreach ($result['data'] as $faction) {
            if ($faction['name'] === $name) {
                return $faction['id'];
            }
        }
    }

    return null;
}

function importUnit($unit, $gameSystemId) {
    $unitData = [
        'name' => $unit['name'] !== '' ? $unit['name'] : 'Unit ' . $unit['card_id'],
        'type' => $unit['type'] ?? 'I',
        'level' => intval($unit['level'] ?? 1),
        'points' => intval($unit['points'] ?? 10),
        'health' => intval($unit['health'] ?? 1),
        'speed' => intval($unit['speed'] ?? 4),
        'march_speed' => intval($unit['march_speed'] ?? 2),
        'image_url' => $unit['image_url'] ?? '',
        'notes' => ($unit['notes'] ?? '') . ' | Card: ' . $unit['card_id'],
        'game_system_id' => $gameSystemId,
        'faction_id' => null
    ];

    $result = apiCall('units.create', 'POST', $unitData);

    return [
        'success' => $result['code'] === 200,
        'code' => $result['code'],
        'data' => $result['data']
    ];
}

// ============================================
// HAUPTPROGRAMM
// ============================================

echo "\n╔════════════════════════════════════════════════════════════════╗\n";
echo "║         Dust 1947 BULK IMPORT SCRIPT                           ║\n";
echo "╚════════════════════════════════════════════════════════════════╝\n\n";

// Check file
if (!file_exists($jsonFile)) {
    echo "❌ ERROR: File not found: $jsonFile\n";
    exit(1);
}

// Read JSON
echo "📖 Reading $jsonFile...\n";
$json = file_get_contents($jsonFile);
$data = json_decode($json, true);

if (!$data || !isset($data['units'])) {
    echo "❌ ERROR: Invalid JSON format\n";
    exit(1);
}

$units = $data['units'];
echo "✅ Found " . count($units) . " units\n\n";

// Get or create Game System
echo "🎮 Setting up Game System...\n";
$gameSystemId = getGameSystemId('Dust 1947');
if (!$gameSystemId) {
    echo "⚠️  Warning: Could not get/create game system\n";
}
echo "   Game System ID: $gameSystemId\n\n";

// Import stats
$stats = [
    'total' => 0,
    'success' => 0,
    'failed' => 0,
    'errors' => []
];

// Import units
echo "📥 Importing units...\n";
echo str_repeat("─", 60) . "\n";

$startTime = microtime(true);
foreach ($units as $index => $unit) {
    $result = importUnit($unit, $gameSystemId);
    $stats['total']++;

    if ($result['success']) {
        $stats['success']++;
        $icon = "✅";
    } else {
        $stats['failed']++;
        $icon = "❌";
        $stats['errors'][] = [
            'card_id' => $unit['card_id'],
            'error' => $result['data']['error'] ?? 'Unknown error',
            'code' => $result['code']
        ];
    }

    // Progress indicator
    if (($index + 1) % 50 === 0) {
        $progress = round(($index + 1) / count($units) * 100);
        echo "[" . str_pad($progress, 3, " ", STR_PAD_LEFT) . "%] " . ($index + 1) . "/" . count($units) . " units processed...\n";
    }
}

$endTime = microtime(true);
$duration = round($endTime - $startTime, 2);

// Summary
echo str_repeat("─", 60) . "\n\n";
echo "📊 IMPORT SUMMARY\n";
echo "═" . str_repeat("═", 58) . "═\n";
echo "Total units processed: " . $stats['total'] . "\n";
echo "✅ Successfully imported: " . $stats['success'] . "\n";
echo "❌ Failed imports: " . $stats['failed'] . "\n";
echo "⏱️  Time taken: " . $duration . " seconds\n";
echo "⚡ Average speed: " . round($stats['total'] / $duration) . " units/sec\n";
echo "═" . str_repeat("═", 58) . "═\n";

if (!empty($stats['errors'])) {
    echo "\n⚠️  ERRORS:\n";
    foreach ($stats['errors'] as $error) {
        echo "   • " . $error['card_id'] . ": " . $error['error'] . " (HTTP " . $error['code'] . ")\n";
    }
}

echo "\n✨ Import complete!\n\n";

// Exit code
exit($stats['failed'] > 0 ? 1 : 0);
?>

