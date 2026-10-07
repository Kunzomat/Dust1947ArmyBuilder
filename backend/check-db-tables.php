<?php
require_once __DIR__ . '/dev_tools_guard.php';
require_once __DIR__ . '/db_connection.php';
// $conn is provided by db_connection.php (uses config.local.php locally).

echo "=== TABLES IN DATABASE ===\n";
$result = $conn->query('SHOW TABLES');
while ($row = $result->fetch_row()) {
    echo "  - " . $row[0] . "\n";
}

echo "\n=== CHECKING FOR BLOCKS/GAMESYSTEM TABLE ===\n";
$tableResult = $conn->query("SHOW TABLES LIKE '%block%'");
if ($tableResult->num_rows > 0) {
    echo "Found: ";
    while ($row = $tableResult->fetch_row()) {
        echo $row[0] . "\n";
    }
} else {
    echo "No 'blocks' table found.\n";
}

// Check blocs table structure
echo "\n=== BLOCS TABLE STRUCTURE ===\n";
$structResult = $conn->query("DESCRIBE blocs");
while ($row = $structResult->fetch_assoc()) {
    echo "  " . $row['Field'] . " (" . $row['Type'] . ")\n";
}

$conn->close();
?>

