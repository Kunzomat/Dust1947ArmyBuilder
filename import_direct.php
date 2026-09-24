<?php
/**
 * Dust 1947 Direct Database Import
 * Importiert Einheiten direkt aus JSON-Datei in die Datenbank
 */

// ============================================
// KONFIGURATION
// ============================================

require_once __DIR__ . '/backend/db_connection.php';

$jsonFile = __DIR__ . '/dust1947_import_data.json';
$imageBasePath = 'dust47cardrepo-main/'; // Pfad zu den Bildern

// ============================================
// HAUPTPROGRAMM
// ============================================

echo "\n╔════════════════════════════════════════════════════════════════╗\n";
echo "║         Dust 1947 DIRECT IMPORT                               ║\n";
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
echo "🎮 Setting up Game System 'Dust 1947'...\n";
$result = $conn->query("SELECT id FROM game_systems WHERE name = 'Dust 1947' LIMIT 1");

if ($result && $result->num_rows > 0) {
    $gameSystem = $result->fetch_assoc();
    $gameSystemId = $gameSystem['id'];
    echo "   ✅ Found existing: ID $gameSystemId\n";
} else {
    $conn->query("INSERT INTO game_systems (name, description) VALUES ('Dust 1947', 'Dust 1947 alternate history wargame')");
    $gameSystemId = $conn->insert_id;
    echo "   ✅ Created new: ID $gameSystemId\n";
}

// Import stats
$stats = [
    'total' => 0,
    'success' => 0,
    'failed' => 0,
    'updated' => 0,
    'errors' => []
];

// Import units
echo "\n📥 Importing units...\n";
echo str_repeat("─", 60) . "\n";

$startTime = microtime(true);
$stmt = $conn->prepare("
    INSERT INTO units (name, type, level, points, health, speed, march_speed, image_url, notes, game_system_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE
        points = VALUES(points),
        health = VALUES(health),
        speed = VALUES(speed),
        march_speed = VALUES(march_speed)
");

foreach ($units as $index => $unit) {
    $stats['total']++;

    try {
        $name = !empty($unit['name']) && $unit['name'] !== "Unit " . $unit['card_id']
            ? $unit['name']
            : $unit['card_id'];
        $type = $unit['type'] ?? 'I';
        $level = intval($unit['level'] ?? 1);
        $points = intval($unit['points'] ?? 10);
        $health = intval($unit['health'] ?? 1);
        $speed = intval($unit['speed'] ?? 4);
        $march_speed = intval($unit['march_speed'] ?? 2);
        $image = $unit['image_url'] ?? '';
        $notes = ($unit['notes'] ?? '') . ' | Card: ' . $unit['card_id'];

        $stmt->bind_param(
            'ssiiiissi',
            $name, $type, $level, $points, $health, $speed, $march_speed, $image, $notes, $gameSystemId
        );

        if ($stmt->execute()) {
            $stats['success']++;
            $icon = "✅";
        } else {
            $stats['failed']++;
            $icon = "❌";
            $stats['errors'][] = [
                'card_id' => $unit['card_id'],
                'error' => $conn->error
            ];
        }

        // Progress indicator
        if (($index + 1) % 50 === 0) {
            $progress = round(($index + 1) / count($units) * 100);
            echo "[" . str_pad($progress, 3, " ", STR_PAD_LEFT) . "%] " . ($index + 1) . "/" . count($units) . " units processed...\n";
        }
    } catch (Exception $e) {
        $stats['failed']++;
        $stats['errors'][] = [
            'card_id' => $unit['card_id'] ?? 'unknown',
            'error' => $e->getMessage()
        ];
        $icon = "❌";
    }
}

$stmt->close();

$endTime = microtime(true);
$duration = round($endTime - $startTime, 2);

// Summary
echo str_repeat("─", 60) . "\n\n";
echo "📊 IMPORT SUMMARY\n";
echo "═" . str_repeat("═", 58) . "═\n";
echo "Total units processed:    " . $stats['total'] . "\n";
echo "✅ Successfully imported:  " . $stats['success'] . "\n";
echo "❌ Failed imports:         " . $stats['failed'] . "\n";
echo "⏱️  Time taken:            " . $duration . " seconds\n";
if ($stats['total'] > 0) {
    echo "⚡ Average speed:        " . round($stats['total'] / $duration) . " units/sec\n";
}
echo "═" . str_repeat("═", 58) . "═\n";

if (!empty($stats['errors'])) {
    echo "\n⚠️  ERRORS (first 10):\n";
    foreach (array_slice($stats['errors'], 0, 10) as $error) {
        echo "   • " . $error['card_id'] . ": " . substr($error['error'], 0, 60) . "\n";
    }
    if (count($stats['errors']) > 10) {
        echo "   ... and " . (count($stats['errors']) - 10) . " more errors\n";
    }
}

// Verify import
echo "\n✨ Verifying import...\n";
$verifyResult = $conn->query("
    SELECT
        COUNT(*) as total_units,
        COUNT(DISTINCT game_system_id) as game_systems,
        MIN(points) as min_points,
        MAX(points) as max_points,
        AVG(points) as avg_points
    FROM units
    WHERE game_system_id = $gameSystemId
");

if ($verifyResult) {
    $verify = $verifyResult->fetch_assoc();
    echo "   📊 Units in Dust 1947: " . $verify['total_units'] . "\n";
    echo "   💰 Points range: " . $verify['min_points'] . " - " . $verify['max_points'] . " (avg: " . round($verify['avg_points'], 1) . ")\n";
}

echo "\n✅ Import complete!\n\n";

$conn->close();

// Exit code
exit($stats['failed'] > 0 ? 1 : 0);
?>

