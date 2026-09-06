<?php
$host = 'localhost';
$user = 'root';
$pass = 'dust1947';
$db = 'dust1947';

$conn = new mysqli($host, $user, $pass, $db);
if ($conn->connect_error) {
    die('Connection failed: ' . $conn->connect_error);
}

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

