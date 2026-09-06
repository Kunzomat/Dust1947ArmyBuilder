<?php
// Direct Migration Runner - wird direkt ausgeführt
// Database Migration für Game Systems & Blocs

require_once __DIR__ . '/db_connection.php';

echo "\n";
echo "========================================\n";
echo "  GAME SYSTEMS & BLOCS MIGRATION\n";
echo "========================================\n\n";

try {
    $conn = getDbConnection();
    if (!$conn) {
        throw new Exception("Connection failed: " . mysqli_connect_error());
    }
    echo "[OK] Database connected\n\n";
} catch (Exception $e) {
    die("[ERROR] " . $e->getMessage() . "\n");
}

// Migration Steps
$steps = [
    "CREATE TABLE IF NOT EXISTS game_systems (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL UNIQUE,
        description TEXT,
        rules_version VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )" => "Creating game_systems table",

    "ALTER TABLE blocs ADD COLUMN IF NOT EXISTS description TEXT AFTER name"
        => "Adding description column to blocs",

    "ALTER TABLE blocs ADD COLUMN IF NOT EXISTS game_system_id INT AFTER description"
        => "Adding game_system_id column to blocs",

    "ALTER TABLE blocs ADD FOREIGN KEY (game_system_id) REFERENCES game_systems(id) ON DELETE SET NULL"
        => "Adding foreign key constraint",

    "INSERT IGNORE INTO game_systems (id, name, description, rules_version) VALUES
        (1, 'Warhammer 40K - 10th Edition', 'Games Workshop Warhammer 40,000 10th Edition Regeln', '10.0'),
        (2, 'Kill Team', 'Games Workshop Kill Team Skirmish Rules', 'Latest'),
        (3, 'Necromunda', 'Games Workshop Necromunda Gang Warfare', 'Latest')"
        => "Inserting default game systems"
];

$stepNum = 1;
foreach ($steps as $sql => $desc) {
    echo "Step $stepNum: $desc...\n";

    if ($conn->query($sql)) {
        echo "[OK] Complete\n\n";
    } else {
        // Check if error is because column/constraint already exists
        if (stripos($conn->error, "Duplicate") !== false ||
            stripos($conn->error, "already exists") !== false ||
            stripos($conn->error, "Duplicate key") !== false) {
            echo "[INFO] Already exists (skipped)\n\n";
        } else {
            echo "[WARNING] Error: " . $conn->error . "\n\n";
        }
    }
    $stepNum++;
}

// Verification
echo "========================================\n";
echo "  VERIFICATION\n";
echo "========================================\n\n";

// Check game_systems
echo "Game Systems in database:\n";
$result = $conn->query("SELECT id, name, rules_version FROM game_systems ORDER BY id");
if ($result) {
    $count = 0;
    while ($row = $result->fetch_assoc()) {
        echo "  [" . $row['id'] . "] " . $row['name'] . " (v" . $row['rules_version'] . ")\n";
        $count++;
    }
    echo "  Total: $count systems\n";
} else {
    echo "  [ERROR] " . $conn->error . "\n";
}

echo "\n";

// Check blocs table structure
echo "Blocs Table Structure:\n";
$result = $conn->query("DESCRIBE blocs");
if ($result) {
    while ($row = $result->fetch_assoc()) {
        $key = ($row['Key'] == 'PRI') ? ' [PRIMARY]' : (($row['Key'] == 'MUL') ? ' [FOREIGN]' : '');
        echo "  " . $row['Field'] . " (" . $row['Type'] . ")" . $key . "\n";
    }
} else {
    echo "  [ERROR] " . $conn->error . "\n";
}

echo "\n";

// Check sample data
echo "Sample Blocs Data:\n";
$result = $conn->query("
    SELECT b.id, b.name, COALESCE(b.description, 'No desc') as description,
           COALESCE(gs.name, 'None') as game_system
    FROM blocs b
    LEFT JOIN game_systems gs ON b.game_system_id = gs.id
    LIMIT 10
");

if ($result && $result->num_rows > 0) {
    while ($row = $result->fetch_assoc()) {
        $desc = strlen($row['description']) > 40 ? substr($row['description'], 0, 40) . '...' : $row['description'];
        echo "  [" . $row['id'] . "] " . $row['name'] . " | GameSystem: " . $row['game_system'] . " | " . $desc . "\n";
    }
} else {
    echo "  No blocs found yet\n";
}

echo "\n";
echo "========================================\n";
echo "  [OK] MIGRATION COMPLETE!\n";
echo "========================================\n";
echo "\nReady to use the new Game Systems & Blocs features!\n";
echo "Frontend: Run 'npm start' in dust1947-frontend folder\n";
echo "Admin Panel: Game Systems tab will be available\n";
echo "\n";

$conn->close();
?>

