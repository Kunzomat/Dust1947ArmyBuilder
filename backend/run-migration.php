<?php
// Migration Runner für Game Systems und Blocks Table
require_once __DIR__ . '/dev_tools_guard.php';
require_once 'db_connection.php';

echo "<pre>";
echo "=== Starting Database Migration ===\n\n";

// Read migration file
$migration = file_get_contents('database/migration_game_systems.sql');

// Split by semicolons and execute each statement
$statements = explode(';', $migration);
$executed = 0;
$errors = 0;

foreach ($statements as $statement) {
    $trimmed = trim($statement);
    if (empty($trimmed)) continue;

    // Skip comments
    if (substr($trimmed, 0, 2) === '--') continue;
    if (substr($trimmed, 0, 2) === '/*') continue;

    echo "Executing: " . substr($trimmed, 0, 80) . "...\n";

    if ($conn->query($trimmed) === false) {
        echo "  ❌ Error: " . $conn->error . "\n";
        $errors++;
    } else {
        echo "  ✅ Success\n";
        $executed++;
    }
}

echo "\n=== Migration Complete ===\n";
echo "Executed: $executed statements\n";
echo "Errors: $errors\n";

// Verify results
echo "\n=== Verification ===\n";

echo "\n📊 Game Systems:\n";
$result = $conn->query("SELECT * FROM game_systems");
if ($result) {
    while ($row = $result->fetch_assoc()) {
        echo "  - ID: {$row['id']}, Name: {$row['name']}\n";
    }
} else {
    echo "  Error: " . $conn->error . "\n";
}

echo "\n📋 Blocks Table Structure:\n";
$result = $conn->query("DESCRIBE blocks");
if ($result) {
    while ($row = $result->fetch_assoc()) {
        echo "  - {$row['Field']} ({$row['Type']})\n";
    }
} else {
    echo "  Error: " . $conn->error . "\n";
}

echo "\n📦 Blocks Data:\n";
$result = $conn->query("SELECT b.id, b.name, b.description, gs.name as game_system FROM blocks b LEFT JOIN game_systems gs ON b.game_system_id = gs.id");
if ($result && $result->num_rows > 0) {
    while ($row = $result->fetch_assoc()) {
        echo "  - {$row['id']}: {$row['name']} (GameSystem: " . ($row['game_system'] ?? 'None') . ")\n";
    }
} else {
    echo "  No blocks found\n";
}

$conn->close();
echo "\n</pre>";
?>

