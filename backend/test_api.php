<?php
// Test der reparierten API
require_once 'db_connection.php';

// Finde eine Unit mit Waffen
$sql = "SELECT id FROM units LIMIT 1";
$result = $conn->query($sql);
if ($result && $row = $result->fetch_assoc()) {
    $unit_id = $row['id'];

    echo "=== TEST: Unit ID $unit_id ===\n\n";

    // Rufe die neue API-Logik auf
    include 'api.php';
}
?>

