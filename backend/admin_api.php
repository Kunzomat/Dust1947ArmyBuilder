<?php
/**
 * Admin API - CRUD Operations for all base data
 * Manages: Factions, Units, Weapons, Rules, Platoons, Blocs
 */

// Start output buffering to prevent any stray output
ob_start();

// Suppress all output before JSON
error_reporting(0);
ini_set('display_errors', '0');

// Clear any previous output
ob_clean();

// Set headers
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, X-API-Key');
header('Content-Type: application/json');

// Handle preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    ob_end_flush();
    exit();
}

try {
    require_once 'db_connection.php';

    // Load API key config
    if (file_exists(__DIR__ . '/config.local.php')) {
        require_once __DIR__ . '/config.local.php';
    }

    // Verify API Key
    $clientKey = $_SERVER['HTTP_X_API_KEY'] ?? '';
    if (!defined('API_KEY') || !hash_equals(API_KEY, $clientKey)) {
        http_response_code(401);
        echo json_encode(['error' => 'Unauthorized']);
        ob_end_flush();
        exit();
    }
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Initialization failed', 'details' => $e->getMessage()]);
    ob_end_flush();
    exit();
}

$action = $_GET['action'] ?? '';
$method = $_SERVER['REQUEST_METHOD'];

try {
    $conn = getDbConnection();

    // ============================================
    // FACTIONS
    // ============================================

    if ($action === 'factions.list') {
        $result = $conn->query("SELECT * FROM factions ORDER BY name");
        echo json_encode($result->fetch_all(MYSQLI_ASSOC));
    }

    elseif ($action === 'factions.create') {
        $data = json_decode(file_get_contents('php://input'), true);
        $stmt = $conn->prepare("INSERT INTO factions (name, description, symbol_url, bloc_id) VALUES (?, ?, ?, ?)");
        $description = $data['description'] ?? '';
        $symbol = $data['symbol_url'] ?? '';
        $stmt->bind_param('sssi', $data['name'], $description, $symbol, $data['bloc_id']);
        $stmt->execute();
        echo json_encode(['id' => $conn->insert_id, 'message' => 'Faction created']);
    }

    elseif ($action === 'factions.update') {
        $data = json_decode(file_get_contents('php://input'), true);
        $stmt = $conn->prepare("UPDATE factions SET name=?, description=?, symbol_url=?, bloc_id=? WHERE id=?");
        $description = $data['description'] ?? '';
        $symbol = $data['symbol_url'] ?? '';
        $stmt->bind_param('sssii', $data['name'], $description, $symbol, $data['bloc_id'], $data['id']);
        $stmt->execute();
        echo json_encode(['message' => 'Faction updated']);
    }

    elseif ($action === 'factions.delete') {
        $id = $_GET['id'] ?? 0;
        $conn->query("DELETE FROM factions WHERE id=$id");
        echo json_encode(['message' => 'Faction deleted']);
    }

    // ============================================
    // UNITS
    // ============================================

    elseif ($action === 'units.list') {
        $query = "
            SELECT u.*, f.name as faction_name
            FROM units u
            LEFT JOIN factions f ON u.faction_id = f.id
            ORDER BY u.name
        ";
        $result = $conn->query($query);
        echo json_encode($result->fetch_all(MYSQLI_ASSOC));
    }

    elseif ($action === 'units.get') {
        $id = $_GET['id'] ?? 0;
        $query = "
            SELECT u.*, f.name as faction_name
            FROM units u
            LEFT JOIN factions f ON u.faction_id = f.id
            WHERE u.id = $id
        ";
        $result = $conn->query($query);
        echo json_encode($result->fetch_assoc());
    }

    elseif ($action === 'units.create') {
        $data = json_decode(file_get_contents('php://input'), true);
        $stmt = $conn->prepare("
            INSERT INTO units (
                name, faction_id, type, points,
                level, speed, march_speed, health,
                image_url, notes
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ");
        $stmt->bind_param(
            'sisiisiiss',
            $data['name'],
            $data['faction_id'],
            $data['type'],
            $data['points'],
            $data['level'],
            $data['speed'],
            $data['march_speed'],
            $data['health'],
            $data['image_url'],
            $data['notes']
        );
        $stmt->execute();
        echo json_encode(['id' => $conn->insert_id, 'message' => 'Unit created']);
    }

    elseif ($action === 'units.update') {
        $data = json_decode(file_get_contents('php://input'), true);
        $stmt = $conn->prepare("
            UPDATE units SET
                name=?, faction_id=?, type=?, points=?,
                level=?, speed=?, march_speed=?, health=?,
                image_url=?, notes=?
            WHERE id=?
        ");
        $stmt->bind_param(
            'sisiisiissi',
            $data['name'],
            $data['faction_id'],
            $data['type'],
            $data['points'],
            $data['level'],
            $data['speed'],
            $data['march_speed'],
            $data['health'],
            $data['image_url'],
            $data['notes'],
            $data['id']
        );
        $stmt->execute();
        echo json_encode(['message' => 'Unit updated']);
    }

    elseif ($action === 'units.delete') {
        $id = $_GET['id'] ?? 0;
        // Delete relations first
        $conn->query("DELETE FROM unit_weapons WHERE unit_id=$id");
        $conn->query("DELETE FROM unit_rules WHERE unit_id=$id");
        $conn->query("DELETE FROM army_units WHERE unit_id=$id");
        // Delete unit
        $conn->query("DELETE FROM units WHERE id=$id");
        echo json_encode(['message' => 'Unit deleted']);
    }

    // ============================================
    // WEAPONS
    // ============================================

    elseif ($action === 'weapons.list') {
        $result = $conn->query("SELECT * FROM weapons ORDER BY name");
        $weapons = $result->fetch_all(MYSQLI_ASSOC);
        // Convert disposable to proper boolean/integer
        foreach ($weapons as &$weapon) {
            $weapon['disposable'] = (int)$weapon['disposable'];
        }
        echo json_encode($weapons);
    }

    elseif ($action === 'weapons.create') {
        $data = json_decode(file_get_contents('php://input'), true);
        $stmt = $conn->prepare("
            INSERT INTO weapons (name, `range`, disposable)
            VALUES (?, ?, ?)
        ");
        $disposable = ($data['disposable'] === true || $data['disposable'] === 1 || $data['disposable'] === '1') ? 1 : 0;
        $stmt->bind_param('ssi', $data['name'], $data['range'], $disposable);
        $stmt->execute();
        echo json_encode(['id' => $conn->insert_id, 'message' => 'Weapon created']);
    }

    elseif ($action === 'weapons.update') {
        $data = json_decode(file_get_contents('php://input'), true);
        $stmt = $conn->prepare("
            UPDATE weapons SET name=?, `range`=?, disposable=?
            WHERE id=?
        ");
        $disposable = ($data['disposable'] === true || $data['disposable'] === 1 || $data['disposable'] === '1') ? 1 : 0;
        $stmt->bind_param('ssii', $data['name'], $data['range'], $disposable, $data['id']);
        $stmt->execute();
        echo json_encode(['message' => 'Weapon updated']);
    }

    elseif ($action === 'weapons.delete') {
        $id = $_GET['id'] ?? 0;
        // Check if weapon is in use
        $check = $conn->query("SELECT COUNT(*) as cnt FROM unit_weapons WHERE weapon_id=$id")->fetch_assoc();
        if ($check['cnt'] > 0) {
            echo json_encode(['error' => 'Weapon is in use by units']);
            exit();
        }
        $conn->query("DELETE FROM weapons WHERE id=$id");
        echo json_encode(['message' => 'Weapon deleted']);
    }

    // ============================================
    // RULES
    // ============================================

    elseif ($action === 'rules.list') {
        $result = $conn->query("SELECT * FROM rules ORDER BY name");
        echo json_encode($result->fetch_all(MYSQLI_ASSOC));
    }

    elseif ($action === 'rules.create') {
        $data = json_decode(file_get_contents('php://input'), true);
        $stmt = $conn->prepare("INSERT INTO rules (name, short_text, full_text) VALUES (?, ?, ?)");
        $short = $data['short_text'] ?? $data['description'] ?? '';
        $full = $data['full_text'] ?? $data['description'] ?? '';
        $stmt->bind_param('sss', $data['name'], $short, $full);
        $stmt->execute();
        echo json_encode(['id' => $conn->insert_id, 'message' => 'Rule created']);
    }

    elseif ($action === 'rules.update') {
        $data = json_decode(file_get_contents('php://input'), true);
        $stmt = $conn->prepare("UPDATE rules SET name=?, short_text=?, full_text=? WHERE id=?");
        $short = $data['short_text'] ?? $data['description'] ?? '';
        $full = $data['full_text'] ?? $data['description'] ?? '';
        $stmt->bind_param('sssi', $data['name'], $short, $full, $data['id']);
        $stmt->execute();
        echo json_encode(['message' => 'Rule updated']);
    }

    elseif ($action === 'rules.delete') {
        $id = $_GET['id'] ?? 0;
        // Check if rule is in use
        $check = $conn->query("SELECT COUNT(*) as cnt FROM unit_rules WHERE unit_rule_id=$id")->fetch_assoc();
        if ($check['cnt'] > 0) {
            echo json_encode(['error' => 'Rule is in use by units']);
            exit();
        }
        $conn->query("DELETE FROM rules WHERE id=$id");
        echo json_encode(['message' => 'Rule deleted']);
    }

    // ============================================
    // PLATOONS
    // ============================================

    elseif ($action === 'platoons.list') {
        $query = "
            SELECT p.*, f.name as faction_name, r.name as rule_name,
                   COUNT(pu.id) as slot_count
            FROM platoons p
            LEFT JOIN factions f ON p.faction_id = f.id
            LEFT JOIN rules r ON p.rule_id = r.id
            LEFT JOIN platoon_units pu ON p.id = pu.platoon_id
            GROUP BY p.id
            ORDER BY p.name
        ";
        $result = $conn->query($query);
        echo json_encode($result->fetch_all(MYSQLI_ASSOC));
    }

    elseif ($action === 'platoons.create') {
        $data = json_decode(file_get_contents('php://input'), true);
        $rule_id = $data['rule_id'] ?: null;
        $stmt = $conn->prepare("INSERT INTO platoons (name, faction_id, rule_id) VALUES (?, ?, ?)");
        $stmt->bind_param('sii', $data['name'], $data['faction_id'], $rule_id);
        $stmt->execute();
        echo json_encode(['id' => $conn->insert_id, 'message' => 'Platoon created']);
    }

    elseif ($action === 'platoons.update') {
        $data = json_decode(file_get_contents('php://input'), true);
        $rule_id = $data['rule_id'] ?: null;
        $stmt = $conn->prepare("UPDATE platoons SET name=?, faction_id=?, rule_id=? WHERE id=?");
        $stmt->bind_param('siii', $data['name'], $data['faction_id'], $rule_id, $data['id']);
        $stmt->execute();
        echo json_encode(['message' => 'Platoon updated']);
    }

    elseif ($action === 'platoons.delete') {
        $id = $_GET['id'] ?? 0;
        $conn->query("DELETE FROM army_platoons WHERE platoon_id=$id");
        $conn->query("DELETE FROM platoons WHERE id=$id");
        echo json_encode(['message' => 'Platoon deleted']);
    }

    // ============================================
    // GAME SYSTEMS
    // ============================================

    elseif ($action === 'game_systems.list') {
        $result = $conn->query("SELECT id, name, description, NULL AS rules_version FROM game_system ORDER BY name");
        echo json_encode($result->fetch_all(MYSQLI_ASSOC));
    }

    elseif ($action === 'game_systems.create') {
        $data = json_decode(file_get_contents('php://input'), true);
        $stmt = $conn->prepare("INSERT INTO game_system (name, description) VALUES (?, ?)");
        $description = $data['description'] ?? '';
        $stmt->bind_param('ss', $data['name'], $description);
        $stmt->execute();
        echo json_encode(['id' => $conn->insert_id, 'message' => 'Game System created']);
    }

    elseif ($action === 'game_systems.update') {
        $data = json_decode(file_get_contents('php://input'), true);
        $stmt = $conn->prepare("UPDATE game_system SET name=?, description=? WHERE id=?");
        $description = $data['description'] ?? '';
        $stmt->bind_param('ssi', $data['name'], $description, $data['id']);
        $stmt->execute();
        echo json_encode(['message' => 'Game System updated']);
    }

    elseif ($action === 'game_systems.delete') {
        $id = $_GET['id'] ?? 0;
        // Check if game system is in use
        $check = $conn->query("SELECT COUNT(*) as cnt FROM blocs WHERE sytem_id=$id")->fetch_assoc();
        if ($check['cnt'] > 0) {
            http_response_code(400);
            echo json_encode(['error' => 'Game System is in use by blocs']);
            exit();
        }
        $conn->query("DELETE FROM game_system WHERE id=$id");
        echo json_encode(['message' => 'Game System deleted']);
    }

    // ============================================
    // BLOCS (mit Game System Zugehörigkeit)
    // ============================================

    elseif ($action === 'blocs.list') {
        $query = "
            SELECT
                b.id,
                b.name,
                b.description,
                b.sytem_id,
                b.sytem_id AS game_system_id,
                gs.name as game_system_name
            FROM blocs b
            LEFT JOIN game_system gs ON b.sytem_id = gs.id
            ORDER BY b.name
        ";
        $result = $conn->query($query);
        echo json_encode($result->fetch_all(MYSQLI_ASSOC));
    }

    elseif ($action === 'blocs.create') {
        $data = json_decode(file_get_contents('php://input'), true);
        $description = $data['description'] ?? '';
        $system_id = $data['sytem_id'] ?? ($data['game_system_id'] ?? null);
        $stmt = $conn->prepare("INSERT INTO blocs (name, description, sytem_id) VALUES (?, ?, ?)");
        $stmt->bind_param('ssi', $data['name'], $description, $system_id);
        $stmt->execute();
        echo json_encode(['id' => $conn->insert_id, 'message' => 'Bloc created']);
    }

    elseif ($action === 'blocs.update') {
        $data = json_decode(file_get_contents('php://input'), true);
        $description = $data['description'] ?? '';
        $system_id = $data['sytem_id'] ?? ($data['game_system_id'] ?? null);
        $stmt = $conn->prepare("UPDATE blocs SET name=?, description=?, sytem_id=? WHERE id=?");
        $stmt->bind_param('ssii', $data['name'], $description, $system_id, $data['id']);
        $stmt->execute();
        echo json_encode(['message' => 'Bloc updated']);
    }

    elseif ($action === 'blocs.delete') {
        $id = $_GET['id'] ?? 0;
        $conn->query("DELETE FROM blocs WHERE id=$id");
        echo json_encode(['message' => 'Bloc deleted']);
    }

    // ============================================
    // PLATOON UNITS (Slot Management)
    // ============================================

    elseif ($action === 'platoon_units.list') {
        $platoon_id = $_GET['platoon_id'] ?? 0;
        $query = "
            SELECT pu.*, u.name as unit_name, u.points as unit_points
            FROM platoon_units pu
            JOIN units u ON pu.unit_id = u.id
            WHERE pu.platoon_id = $platoon_id
            ORDER BY pu.slot
        ";
        $result = $conn->query($query);
        echo json_encode($result->fetch_all(MYSQLI_ASSOC));
    }

    elseif ($action === 'platoon_units.add') {
        $data = json_decode(file_get_contents('php://input'), true);
        $stmt = $conn->prepare("INSERT INTO platoon_units (platoon_id, unit_id, slot) VALUES (?, ?, ?)");
        $stmt->bind_param('iis', $data['platoon_id'], $data['unit_id'], $data['slot']);
        $stmt->execute();
        echo json_encode(['id' => $conn->insert_id, 'message' => 'Slot added']);
    }

    elseif ($action === 'platoon_units.update') {
        $data = json_decode(file_get_contents('php://input'), true);
        $stmt = $conn->prepare("UPDATE platoon_units SET unit_id=?, slot=? WHERE id=?");
        $stmt->bind_param('isi', $data['unit_id'], $data['slot'], $data['id']);
        $stmt->execute();
        echo json_encode(['message' => 'Slot updated']);
    }

    elseif ($action === 'platoon_units.delete') {
        $id = $_GET['id'] ?? 0;
        $conn->query("DELETE FROM platoon_units WHERE id=$id");
        echo json_encode(['message' => 'Slot deleted']);
    }

    // ============================================
    // UNIT TYPES (Dynamic from units table)
    // ============================================

    elseif ($action === 'unit_types.list') {
        // Get distinct types from units table
        $query = "SELECT DISTINCT type as name FROM units WHERE type IS NOT NULL AND type != '' ORDER BY type";
        $result = $conn->query($query);
        $types = $result->fetch_all(MYSQLI_ASSOC);
        echo json_encode($types);
    }

    // ============================================
    // RELATIONS
    // ============================================

    // Unit Weapons
    elseif ($action === 'unit_weapons.list') {
        $unit_id = $_GET['unit_id'] ?? 0;
        $query = "
            SELECT uw.*, w.name as weapon_name, uw.number as quantity
            FROM unit_weapons uw
            JOIN weapons w ON uw.weapon_id = w.id
            WHERE uw.unit_id = $unit_id
        ";
        $result = $conn->query($query);
        echo json_encode($result->fetch_all(MYSQLI_ASSOC));
    }

    elseif ($action === 'unit_weapons.add') {
        $data = json_decode(file_get_contents('php://input'), true);
        $stmt = $conn->prepare("INSERT INTO unit_weapons (unit_id, weapon_id, number) VALUES (?, ?, ?)");
        $quantity = $data['quantity'] ?? 1;
        $stmt->bind_param('iii', $data['unit_id'], $data['weapon_id'], $quantity);
        $stmt->execute();
        echo json_encode(['message' => 'Weapon added to unit']);
    }

    elseif ($action === 'unit_weapons.remove') {
        $data = json_decode(file_get_contents('php://input'), true);
        $conn->query("DELETE FROM unit_weapons WHERE unit_id={$data['unit_id']} AND weapon_id={$data['weapon_id']}");
        echo json_encode(['message' => 'Weapon removed from unit']);
    }

    // Unit Rules
    elseif ($action === 'unit_rules.list') {
        $unit_id = $_GET['unit_id'] ?? 0;
        $query = "
            SELECT ur.*, r.name as rule_name
            FROM unit_rules ur
            JOIN rules r ON ur.unit_rule_id = r.id
            WHERE ur.unit_id = $unit_id
        ";
        $result = $conn->query($query);
        echo json_encode($result->fetch_all(MYSQLI_ASSOC));
    }

    elseif ($action === 'unit_rules.add') {
        $data = json_decode(file_get_contents('php://input'), true);
        $stmt = $conn->prepare("INSERT INTO unit_rules (unit_id, unit_rule_id) VALUES (?, ?)");
        $rule_id = $data['unit_rule_id'] ?? $data['rule_id']; // Accept both field names
        $stmt->bind_param('ii', $data['unit_id'], $rule_id);
        $stmt->execute();
        echo json_encode(['message' => 'Rule added to unit']);
    }

    elseif ($action === 'unit_rules.remove') {
        $data = json_decode(file_get_contents('php://input'), true);
        $rule_id = $data['unit_rule_id'] ?? $data['rule_id']; // Accept both field names
        $conn->query("DELETE FROM unit_rules WHERE unit_id={$data['unit_id']} AND unit_rule_id={$rule_id}");
        echo json_encode(['message' => 'Rule removed from unit']);
    }

    // ============================================
    // WEAPON STATS
    // ============================================

    elseif ($action === 'weapon_stats.list') {
        $weapon_id = $_GET['weapon_id'] ?? 0;
        $result = $conn->query("SELECT * FROM weapon_stats WHERE weapon_id = $weapon_id ORDER BY target_type, target_level");
        echo json_encode($result->fetch_all(MYSQLI_ASSOC));
    }

    elseif ($action === 'weapon_stats.save') {
        $data = json_decode(file_get_contents('php://input'), true);
        $weapon_id = $data['weapon_id'];
        $stats = $data['stats'];

        // Delete existing stats
        $conn->query("DELETE FROM weapon_stats WHERE weapon_id = $weapon_id");

        // Insert new stats (only non-empty ones)
        $stmt = $conn->prepare("INSERT INTO weapon_stats (weapon_id, target_type, target_level, dice, damage) VALUES (?, ?, ?, ?, ?)");
        foreach ($stats as $stat) {
            if (!empty($stat['dice']) || !empty($stat['damage'])) {
                $stmt->bind_param('isiss', $weapon_id, $stat['target_type'], $stat['target_level'], $stat['dice'], $stat['damage']);
                $stmt->execute();
            }
        }
        echo json_encode(['message' => 'Weapon stats saved']);
    }

    // ============================================
    // WEAPON RULES
    // ============================================

    elseif ($action === 'weapon_rules.list') {
        $weapon_id = $_GET['weapon_id'] ?? 0;
        $result = $conn->query("SELECT * FROM weapon_rules WHERE weapon_id = $weapon_id");
        echo json_encode($result->fetch_all(MYSQLI_ASSOC));
    }

    elseif ($action === 'weapon_rules.save') {
        $data = json_decode(file_get_contents('php://input'), true);
        $weapon_id = $data['weapon_id'];
        $rule_ids = $data['rule_ids'];

        // Delete existing rules
        $conn->query("DELETE FROM weapon_rules WHERE weapon_id = $weapon_id");

        // Insert new rules
        $stmt = $conn->prepare("INSERT INTO weapon_rules (weapon_id, rule_id) VALUES (?, ?)");
        foreach ($rule_ids as $rule_id) {
            $stmt->bind_param('ii', $weapon_id, $rule_id);
            $stmt->execute();
        }
        echo json_encode(['message' => 'Weapon rules saved']);
    }

    else {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid action']);
    }

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}

// Flush output buffer
ob_end_flush();
?>
