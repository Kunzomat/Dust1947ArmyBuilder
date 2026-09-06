<?php
// Migration Runner für Game Systems & Blocs
require_once 'db_connection.php';

echo "<pre>";
echo "========================================\n";
echo "  GAME SYSTEMS & BLOCS MIGRATION\n";
echo "========================================\n\n";

// Get connection
try {
    $conn = getDbConnection();
    if (!$conn) {
        throw new Exception("Could not get database connection");
    }
    echo "✓ Database connected\n\n";
} catch (Exception $e) {
    echo "✗ Connection failed: " . $e->getMessage() . "\n";
    exit;
}

// 1. Create game_systems table
echo "Step 1: Creating game_systems table...\n";
$sql1 = "CREATE TABLE IF NOT EXISTS game_systems (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    rules_version VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
)";

if ($conn->query($sql1)) {
    echo "✓ game_systems table ready\n\n";
} else {
    echo "✗ Error: " . $conn->error . "\n\n";
}

// 2. Add description to blocs
echo "Step 2: Adding description column to blocs...\n";
$sql2 = "ALTER TABLE blocs ADD COLUMN IF NOT EXISTS description TEXT AFTER name";

if ($conn->query($sql2)) {
    echo "✓ description column added\n\n";
} else {
    echo "✗ Error: " . $conn->error . "\n\n";
}

// 3. Add game_system_id to blocs
echo "Step 3: Adding game_system_id column to blocs...\n";
$sql3 = "ALTER TABLE blocs ADD COLUMN IF NOT EXISTS game_system_id INT AFTER description";

if ($conn->query($sql3)) {
    echo "✓ game_system_id column added\n\n";
} else {
    echo "✗ Error: " . $conn->error . "\n\n";
}

// 4. Add Foreign Key constraint
echo "Step 4: Adding foreign key constraint...\n";

// First check if constraint already exists
$checkFk = $conn->query("
    SELECT COUNT(*) as cnt FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
    WHERE TABLE_NAME = 'blocs'
      AND COLUMN_NAME = 'game_system_id'
      AND REFERENCED_TABLE_NAME = 'game_systems'
");

$result = $checkFk->fetch_assoc();
if ($result['cnt'] > 0) {
    echo "✓ Foreign key constraint already exists\n\n";
} else {
    $sql4 = "ALTER TABLE blocs ADD FOREIGN KEY (game_system_id) REFERENCES game_systems(id) ON DELETE SET NULL";
    if ($conn->query($sql4)) {
        echo "✓ Foreign key constraint added\n\n";
    } else {
        echo "✗ Error: " . $conn->error . "\n\n";
    }
}

// 5. Insert default game systems if table is empty
echo "Step 5: Inserting default game systems...\n";
$checkSystems = $conn->query("SELECT COUNT(*) as cnt FROM game_systems");
$sysCount = $checkSystems->fetch_assoc();

if ($sysCount['cnt'] == 0) {
    $sql5 = "INSERT INTO game_systems (id, name, description, rules_version) VALUES
        (1, 'Warhammer 40K - 10th Edition', 'Games Workshop Warhammer 40,000 10th Edition Regeln', '10.0'),
        (2, 'Kill Team', 'Games Workshop Kill Team Skirmish Rules', 'Latest'),
        (3, 'Necromunda', 'Games Workshop Necromunda Gang Warfare', 'Latest')";

    if ($conn->query($sql5)) {
        echo "✓ Default game systems inserted\n\n";
    } else {
        echo "✗ Error: " . $conn->error . "\n\n";
    }
} else {
    echo "✓ Game systems already exist (" . $sysCount['cnt'] . " systems)\n\n";
}

// Verification
echo "========================================\n";
echo "  VERIFICATION\n";
echo "========================================\n\n";

echo "📊 Game Systems:\n";
$result = $conn->query("SELECT id, name, rules_version FROM game_systems ORDER BY id");
if ($result && $result->num_rows > 0) {
    while ($row = $result->fetch_assoc()) {
        echo "  [" . $row['id'] . "] " . $row['name'] . " (v" . $row['rules_version'] . ")\n";
    }
} else {
    echo "  No game systems found\n";
}

echo "\n📋 Blocs Table Structure:\n";
$result = $conn->query("DESCRIBE blocs");
if ($result) {
    while ($row = $result->fetch_assoc()) {
        $key = ($row['Key'] == 'PRI') ? ' [PRIMARY]' : (($row['Key'] == 'MUL') ? ' [FOREIGN]' : '');
        echo "  - " . $row['Field'] . " (" . $row['Type'] . ")" . $key . "\n";
    }
} else {
    echo "  Error: " . $conn->error . "\n";
}

echo "\n📦 Sample Blocs Data:\n";
$result = $conn->query("
    SELECT b.id, b.name, b.description, gs.name as game_system, b.game_system_id
    FROM blocs b
    LEFT JOIN game_systems gs ON b.game_system_id = gs.id
    LIMIT 10
");

if ($result && $result->num_rows > 0) {
    while ($row = $result->fetch_assoc()) {
        $gs = $row['game_system'] ? $row['game_system'] : 'None';
        $desc = $row['description'] ? substr($row['description'], 0, 30) . '...' : 'No desc';
        echo "  [" . $row['id'] . "] " . $row['name'] . " | GameSystem: " . $gs . " | " . $desc . "\n";
    }
} else {
    echo "  No blocs found yet\n";
}

echo "\n========================================\n";
echo "  ✅ MIGRATION COMPLETE!\n";
echo "========================================\n";

$conn->close();
?>

