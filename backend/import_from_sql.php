<?php
/**
 * Dust 1947 SQL Import Runner
 */

require_once __DIR__ . '/dev_tools_guard.php';

require_once __DIR__ . '/backend/db_connection.php';

$sqlFile = __DIR__ . '/dust1947_import.sql';

echo "\n╔════════════════════════════════════════════════════════════════╗\n";
echo "║         DUST 1947 SQL IMPORT RUNNER                           ║\n";
echo "╚════════════════════════════════════════════════════════════════╝\n\n";

if (!file_exists($sqlFile)) {
    echo "❌ ERROR: File not found: $sqlFile\n";
    exit(1);
}

echo "📖 Reading SQL file: $sqlFile\n";
$sqlContent = file_get_contents($sqlFile);
$fileSize = filesize($sqlFile) / 1024;
echo "   Size: " . round($fileSize, 1) . " KB\n\n";

// Ensure Game System exists
echo "🎮 Creating Game System...\n";
$conn->query("INSERT IGNORE INTO game_systems (id, name, description) VALUES (1, 'Dust 1947', 'Dust 1947 alternate history wargame')");
echo "   ✅ Game System ready\n\n";

// Execute SQL
echo "📥 Executing import (this may take a moment)...\n";
$startTime = microtime(true);

if ($conn->multi_query($sqlContent)) {
    // Process results if any
    do {
        if ($result = $conn->store_result()) {
            $result->free();
        }
    } while ($conn->more_results() && $conn->next_result());

    $endTime = microtime(true);
    $duration = round($endTime - $startTime, 2);

    echo "   ✅ SQL executed successfully ($duration seconds)\n\n";

    // Verify
    echo "✨ Verifying import...\n";
    $result = $conn->query("
        SELECT
            COUNT(*) as total_units,
            COUNT(DISTINCT type) as types,
            MIN(points) as min_pts,
            MAX(points) as max_pts,
            AVG(points) as avg_pts
        FROM units
        WHERE game_system_id = 1
    ");

    if ($result && $row = $result->fetch_assoc()) {
        echo "   ✅ Total units: " . $row['total_units'] . "\n";
        echo "   ✅ Unit types: " . $row['types'] . "\n";
        echo "   ✅ Points range: " . $row['min_pts'] . " - " . $row['max_pts'] . " (avg: " . round($row['avg_pts'], 1) . ")\n";
        $result->free();
    }

    echo "\n✅ Import complete!\n\n";
} else {
    echo "❌ ERROR: " . $conn->error . "\n";
    exit(1);
}

$conn->close();
exit(0);
?>

