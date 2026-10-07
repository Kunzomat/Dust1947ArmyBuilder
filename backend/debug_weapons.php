<?php
require_once __DIR__ . '/dev_tools_guard.php';
require_once 'db_connection.php';

echo "=== WEAPON STATS & RULES CHECK ===\n\n";

// Prüfe, ob weapon_stats und weapon_rules für Waffen existieren
$sql = "SELECT
    w.id, w.name,
    COUNT(DISTINCT ws.id) as stat_count,
    COUNT(DISTINCT wr.id) as rule_count
FROM weapons w
LEFT JOIN weapon_stats ws ON w.id = ws.weapon_id
LEFT JOIN weapon_rules wr ON w.id = wr.weapon_id
GROUP BY w.id
LIMIT 10";

$result = $conn->query($sql);
if (!$result) {
    echo "Query Error: " . $conn->error . "\n";
    exit;
}

echo "Waffen mit Stats & Rules Count:\n";
while ($row = $result->fetch_assoc()) {
    echo json_encode($row, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE) . "\n";
}

echo "\n\n=== BEISPIEL: CARTESIAN PRODUCT ISSUE ===\n";

// Zeige ein Beispiel einer Waffe mit mehreren Stats und Rules
$sql2 = "SELECT
    w.id, w.name,
    ws.id as stat_id, ws.target_type, ws.target_level, ws.dice, ws.damage,
    wr.id as rule_id, r.name as rule_name
FROM weapons w
LEFT JOIN weapon_stats ws ON w.id = ws.weapon_id
LEFT JOIN weapon_rules wr ON w.id = wr.weapon_id
LEFT JOIN rules r ON wr.rule_id = r.id
WHERE w.id IN (
    SELECT w.id FROM weapons w
    LEFT JOIN weapon_stats ws ON w.id = ws.weapon_id
    LEFT JOIN weapon_rules wr ON w.id = wr.weapon_id
    GROUP BY w.id
    HAVING COUNT(DISTINCT ws.id) > 0 AND COUNT(DISTINCT wr.id) > 0
)
LIMIT 20";

$result2 = $conn->query($sql2);
if ($result2) {
    echo "Weapon mit Stats und Rules (Cartesian Product Beispiel):\n";
    while ($row = $result2->fetch_assoc()) {
        echo json_encode($row) . "\n";
    }
}
?>

