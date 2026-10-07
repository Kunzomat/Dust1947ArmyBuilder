<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

require_once __DIR__ . "/auth.php";
require_once __DIR__ . '/unit_rating.php';
require_once __DIR__ . '/db_connection.php';
require_once __DIR__ . '/army_validation.php';

// $conn ist jetzt durch db_connection.php verfügbar

function jsonBody(): array {
    $raw = file_get_contents("php://input");
    if (!$raw) return [];
    $data = json_decode($raw, true);
    return is_array($data) ? $data : [];
}

function ok($data, int $code = 200): void {
    http_response_code($code);
    echo json_encode($data);
    exit;
}

function fail(string $msg, int $code = 400, $extra = null): void {
    http_response_code($code);
    $out = ["error" => $msg];
    if ($extra !== null) $out["details"] = $extra;
    echo json_encode($out);
    exit;
}

function requireInt($value, string $name): int {
    if ($value === null || $value === '' || !is_numeric($value)) {
        fail("Missing/invalid parameter: $name", 400);
    }
    return (int)$value;
}

function requireString($value, string $name): string {
    $s = trim((string)$value);
    if ($s === '') fail("Missing/invalid parameter: $name", 400);
    return $s;
}

function splitRuleNames(?string $value): array {
    if ($value === null || $value === '') return [];
    return array_values(array_filter(array_map('trim', explode('||', $value)), fn($name) => $name !== ''));
}

function extractArmorValueFromRuleNames(array $ruleNames): ?int {
    foreach ($ruleNames as $ruleName) {
        if (preg_match('/^ARMOR\s+(\d+)$/i', trim((string)$ruleName), $matches)) {
            return (int)$matches[1];
        }
    }
    return null;
}

function loadUnitDefinitions(mysqli $conn, array $unitIds): array {
    $unitIds = array_values(array_unique(array_map('intval', array_filter($unitIds, fn($id) => (int)$id > 0))));
    if (empty($unitIds)) return [];

    $idList = implode(',', $unitIds);
    $sql = "
        SELECT
            u.id AS unit_id,
            u.name AS unit_name,
            u.faction_id,
            f.bloc_id,
            f.name AS faction_name,
            u.type,
            u.points,
            u.level,
            u.health,
            GROUP_CONCAT(DISTINCT r.name ORDER BY r.name SEPARATOR '||') AS rule_names
        FROM units u
        JOIN factions f ON f.id = u.faction_id
        LEFT JOIN unit_rules ur ON ur.unit_id = u.id
        LEFT JOIN rules r ON r.id = ur.unit_rule_id
        WHERE u.id IN ($idList)
        GROUP BY u.id, u.name, u.faction_id, f.bloc_id, f.name, u.type, u.points, u.level, u.health
    ";

    $result = $conn->query($sql);
    $definitions = [];

    while ($row = $result->fetch_assoc()) {
        $ruleNames = splitRuleNames($row['rule_names'] ?? null);
        $normalizedRules = array_map(static fn($name) => strtoupper(trim((string)$name)), $ruleNames);
        $definitions[(int)$row['unit_id']] = [
            'unit_id' => (int)$row['unit_id'],
            'unit_name' => $row['unit_name'],
            'faction_id' => (int)$row['faction_id'],
            'bloc_id' => (int)$row['bloc_id'],
            'faction_name' => $row['faction_name'],
            'type' => $row['type'],
            'points' => (int)$row['points'],
            'level' => $row['level'] !== null ? (int)$row['level'] : null,
            'health' => $row['health'] !== null ? (int)$row['health'] : null,
            'rule_names' => $ruleNames,
            'is_mercenary' => in_array('MERCENARY', $normalizedRules, true) ? 1 : 0,
            'is_commissar' => in_array('COMMISSAR', $normalizedRules, true) ? 1 : 0,
            'has_pilot_skill' => in_array('PILOT', $normalizedRules, true) ? 1 : 0,
            'has_ace_pilot_skill' => in_array('ACE PILOT', $normalizedRules, true) ? 1 : 0,
            'has_siblings_rule' => in_array('SIBLINGS', $normalizedRules, true) ? 1 : 0,
            'armor_value' => extractArmorValueFromRuleNames($ruleNames),
        ];
    }

    return $definitions;
}

function mergeUnitDefinition(array $row, array $definition): array {
    return array_merge($row, $definition, [
        'unit_id' => $row['unit_id'] ?? $definition['unit_id'] ?? null,
        'unit_name' => $row['unit_name'] ?? $definition['unit_name'] ?? null,
    ]);
}

/**
 * Loads an army plus its platoons/units/platoon-templates in the shape
 * needed both by `armies.get` (API response) and `army.analyze` (validation
 * only), so the two actions share one query/assembly implementation instead
 * of diverging copies.
 *
 * @return array{0: array, 1: array, 2: array, 3: array}|null [army, platoons, units, platoonTemplates], or null if army not found
 */
function loadArmyDetailArrays(mysqli $conn, int $id): ?array {
    $stmt = $conn->prepare("
        SELECT
            a.id,
            a.name,
            a.bloc_id,
            b.name AS bloc_name,
            a.points_limit,
            COALESCE(SUM(COALESCE(u.points, 0) * COALESCE(au.quantity, 1)), 0) AS points_current
        FROM armies a
        JOIN blocs b ON b.id = a.bloc_id
        LEFT JOIN army_units au ON au.army_id = a.id
        LEFT JOIN units u ON u.id = au.unit_id
        WHERE a.id = ?
        GROUP BY a.id, a.name, a.bloc_id, b.name, a.points_limit
    ");
    $stmt->bind_param("i", $id);
    $stmt->execute();
    $army = $stmt->get_result()->fetch_assoc();

    if (!$army) return null;

    // Platoons in army
    $stmt = $conn->prepare("
        SELECT ap.id AS army_platoon_id, p.id AS platoon_id, p.name, p.rule_id, p.faction_id
        FROM army_platoons ap
        JOIN platoons p ON p.id = ap.platoon_id
        WHERE ap.army_id = ?
        ORDER BY ap.id ASC
    ");
    $stmt->bind_param("i", $id);
    $stmt->execute();
    $platoons = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);

    // Units in army (with slot info if inside platoon_unit_id)
    $stmt = $conn->prepare("
        SELECT
            au.id AS army_unit_id,
            au.army_id,
            au.army_platoon_id,
            au.platoon_unit_id,
            pu.slot AS platoon_slot,
            au.unit_id,
            u.name AS unit_name,
            u.points AS unit_points,
            au.quantity,
            f.name as faction_name
        FROM army_units au
        JOIN units u ON u.id = au.unit_id
        LEFT JOIN platoon_units pu ON pu.id = au.platoon_unit_id
        LEFT JOIN factions f ON u.faction_id = f.id
        WHERE au.army_id = ?
        ORDER BY au.id ASC
    ");
    $stmt->bind_param("i", $id);
    $stmt->execute();
    $units = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);

    $unitDefinitions = loadUnitDefinitions($conn, array_column($units, 'unit_id'));
    foreach ($units as &$unitRow) {
        $definition = $unitDefinitions[(int)$unitRow['unit_id']] ?? null;
        if ($definition) {
            $unitRow = mergeUnitDefinition($unitRow, $definition);
        }
    }
    unset($unitRow);

    $stmt = $conn->prepare("
        SELECT
            ap.id AS army_platoon_id,
            ap.platoon_id,
            pu.id AS platoon_unit_id,
            pu.unit_id,
            pu.slot
        FROM army_platoons ap
        JOIN platoon_units pu ON pu.platoon_id = ap.platoon_id
        WHERE ap.army_id = ?
        ORDER BY ap.id ASC, pu.slot ASC, pu.id ASC
    ");
    $stmt->bind_param("i", $id);
    $stmt->execute();
    $platoonTemplates = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);

    $templateDefinitions = loadUnitDefinitions($conn, array_column($platoonTemplates, 'unit_id'));
    foreach ($platoonTemplates as &$templateRow) {
        $templateUnitId = isset($templateRow['unit_id']) ? (int)$templateRow['unit_id'] : null;
        $definition = $templateUnitId !== null ? ($templateDefinitions[$templateUnitId] ?? null) : null;
        if ($definition) {
            $templateRow = mergeUnitDefinition($templateRow, $definition);
        }
    }
    unset($templateRow);

    return [$army, $platoons, $units, $platoonTemplates];
}

$action = $_GET['action'] ?? '';

/**
 * =========================================================
 * Armies
 * =========================================================
 * GET  ?action=armies.list
 * GET  ?action=armies.get&id=1
 * POST ?action=armies.create  {name,bloc_id,points_limit}
 * PUT  ?action=armies.update&id=1 {name?points_limit?}
 * POST ?action=armies.delete&id=1
 */
 
if ($action === 'unit.list') {
    $blocId = isset($_GET['bloc_id']) ? (int)$_GET['bloc_id'] : null;
    $selectedSystemId = null;

    if ($blocId !== null) {
        $stmtSystem = $conn->prepare("SELECT sytem_id FROM blocs WHERE id = ?");
        $stmtSystem->bind_param("i", $blocId);
        $stmtSystem->execute();
        $blocRow = $stmtSystem->get_result()->fetch_assoc();
        $selectedSystemId = $blocRow ? ($blocRow['sytem_id'] !== null ? (int)$blocRow['sytem_id'] : null) : null;
    }

    if ($blocId !== null) {
        if ($selectedSystemId !== null) {
            $stmt = $conn->prepare("
                SELECT u.*, f.bloc_id AS bloc_id, f.name AS faction_name
                FROM units u
                JOIN factions f ON f.id = u.faction_id
                WHERE (
                    f.bloc_id = ?
                    OR EXISTS (
                        SELECT 1
                        FROM unit_rules ur2
                        JOIN rules r2 ON r2.id = ur2.unit_rule_id
                        WHERE ur2.unit_id = u.id
                          AND UPPER(r2.name) = 'MERCENARY'
                    )
                )
                  AND (u.game_system_id IS NULL OR u.game_system_id = ?)
            ");
            $stmt->bind_param("ii", $blocId, $selectedSystemId);
        } else {
            $stmt = $conn->prepare("
                SELECT u.*, f.bloc_id AS bloc_id, f.name AS faction_name
                FROM units u
                JOIN factions f ON f.id = u.faction_id
                WHERE f.bloc_id = ?
                   OR EXISTS (
                        SELECT 1
                        FROM unit_rules ur2
                        JOIN rules r2 ON r2.id = ur2.unit_rule_id
                        WHERE ur2.unit_id = u.id
                          AND UPPER(r2.name) = 'MERCENARY'
                    )
            ");
            $stmt->bind_param("i", $blocId);
        }
    } else {
        $stmt = $conn->prepare("
            SELECT u.*, f.bloc_id AS bloc_id, f.name AS faction_name
            FROM units u
            JOIN factions f ON f.id = u.faction_id
        ");
    }

    $stmt->execute();
    $res = $stmt->get_result();
    $units = $res->fetch_all(MYSQLI_ASSOC);
    $definitions = loadUnitDefinitions($conn, array_column($units, 'id'));

    foreach ($units as &$unitRow) {
        $definition = $definitions[(int)$unitRow['id']] ?? null;
        if ($definition) {
            $unitRow['rule_names'] = $definition['rule_names'];
            $unitRow['is_mercenary'] = $definition['is_mercenary'];
            $unitRow['armor_value'] = $definition['armor_value'];
        }
    }

    ok([
        "units" => $units
    ]);
}

if ($action === 'unit.get') {
  $id = requireInt($_GET['id'] ?? null, 'id');

    // 1️⃣ Einheit + Fraktion laden
    $sql = "
    SELECT 
      u.id AS unit_id,
      u.name AS unit_name,
      u.notes,
      u.type,
      u.level,
      u.speed,
      u.march_speed,
      u.points,
      u.image_url,
      u.health,
      u.faction_id AS faction_id,
      f.name AS faction_name,
      f.symbol_url AS faction_symbol_url,
      b.name AS bloc_name,
      b.image_url AS bloc_symbol_url,
      ur.id AS special_rule_id,
      ur.name AS special_rule_name,
      uur.note AS special_rule_note,
      ur.bonus_factor AS special_rule_bonus_factor,
      ur.short_text AS special_rule_desc,
      ur.full_text AS special_rule_text,
      uw.id AS unit_weapon_id,
      uw.number AS weapon_number,
      uw.firing_arc AS weapon_firing_arc,
      w.id AS weapon_id,
      w.name AS weapon_name,
      w.range AS weapon_range,
      w.disposable as weapon_disposable,
      wr.id AS weapon_rule_id,
      wr.name AS weapon_rule_name,
      wr.bonus_factor AS weapon_rule_bonus_factor,
      wr.short_text AS weapon_rule_desc,
      wr.full_text AS weapon_rule_text,
      ws.id AS weapon_stat_id,
      ws.target_type AS weapon_target_type,
      ws.target_level AS weapon_target_level,
      ws.dice AS weapon_dice,
      ws.damage AS weapon_damage
    FROM units u
    LEFT JOIN factions f ON u.faction_id = f.id
    LEFT JOIN blocs b ON f.bloc_id = b.id
    LEFT JOIN unit_rules uur ON u.id = uur.unit_id
    LEFT JOIN rules ur ON uur.unit_rule_id = ur.id
    LEFT JOIN unit_weapons uw ON u.id = uw.unit_id
    LEFT JOIN weapons w ON uw.weapon_id = w.id
    LEFT JOIN weapon_stats ws ON w.id = ws.weapon_id
    LEFT JOIN weapon_rules wwr ON w.id = wwr.weapon_id
    LEFT JOIN rules wr ON wwr.rule_id = wr.id
    WHERE u.id = ?
    ORDER BY u.id, w.id, wr.id
    ";

		$stmt = $conn->prepare($sql);
		$stmt->bind_param("s", $id); // "s" für String
		$stmt->execute();
		$result = $stmt->get_result();

		$units = [];
		
		while ($row = $result->fetch_assoc()) {
			$unitId = $row['unit_id'];
			$weaponId = $row['weapon_id'];
			$unitWeaponId = $row['unit_weapon_id'];

			if (!isset($units[$unitId])) {
				$units[$unitId] = [
					'id' => $unitId,
					'name' => $row['unit_name'],
					'type' => $row['type'],
					'level' => $row['level'],
					'notes' => $row['notes'],
					'speed' => $row['speed'],
					'march_speed' => $row['march_speed'],
					'faction' => $row['faction_name'],
					'faction_symbol_url' => $row['faction_symbol_url'],
          'bloc_name' => $row['bloc_name'],
          'bloc_symbol_url' => $row['bloc_symbol_url'],
					'points' => $row['points'],
					'image_url' => $row['image_url'],
					'health' => $row['health'],
					'faction_id' => $row['faction_id'],
					'special_rules' => [],
					'weapons' => []
				];
			}

			if (!empty($row['special_rule_id'])) {
				$units[$unitId]['special_rules'][$row['special_rule_id']] = [
					'id' => $row['special_rule_id'],
					'name' => $row['special_rule_name'],
					'note' => $row['special_rule_note'],
          'bonus_factor' => isset($row['special_rule_bonus_factor']) ? (float)$row['special_rule_bonus_factor'] : 0.5,
					'desc' => $row['special_rule_desc'],
					'text' => $row['special_rule_text']
				];
			}

			if (!empty($weaponId)) {
				if (!isset($units[$unitId]['weapons'][$unitWeaponId])) {
					$units[$unitId]['weapons'][$unitWeaponId] = [
						'id' => $weaponId,
						'name' => $row['weapon_name'],
						'range' => $row['weapon_range'],
						'disposable' => $row['weapon_disposable'],
						'number' => $row['weapon_number'],
						'arc' => $row['weapon_firing_arc'],
						'rules' => []
					];
				}
				if (!empty($row['weapon_rule_id'])) {
					 $units[$unitId]['weapons'][$unitWeaponId]['rules'][$row['weapon_rule_id']] = [
						'id' => $row['weapon_rule_id'],
						'name' => $row['weapon_rule_name'],
            'bonus_factor' => isset($row['weapon_rule_bonus_factor']) ? (float)$row['weapon_rule_bonus_factor'] : 0.5,
						'desc' => $row['weapon_rule_desc'],
						'text' => $row['weapon_rule_text']
					];
				}
				if (!empty($row['weapon_stat_id'])) {
					$units[$unitId]['weapons'][$unitWeaponId]['stats'][$row['weapon_stat_id']] = [
						'type' => $row['weapon_target_type'],
						'level' => $row['weapon_target_level'],
						'dice' => $row['weapon_dice'],
						'damage' => $row['weapon_damage']
					];
				}
			}
		}

		foreach ($units as &$unit) {
			$unit['theoretical_points'] = compute_theoretical_points($unit);
			$unit['special_rules'] = array_values($unit['special_rules']);
			$unit['weapons'] = array_values($unit['weapons']);
			foreach ($unit['weapons'] as &$weapon) {
				$weapon['rules'] = array_values($weapon['rules']);
			}
		}

		ok(["unit" => reset($units)]);
    exit;
}

if ($action === 'armies.list') {
  $sql = "SELECT
        a.id,
        a.name,
        a.bloc_id,
        b.name AS bloc_name,
        a.points_limit,
        COALESCE(SUM(COALESCE(u.points, 0) * COALESCE(au.quantity, 1)), 0) AS points_current
      FROM armies a
      JOIN blocs b ON b.id = a.bloc_id
      LEFT JOIN army_units au ON au.army_id = a.id
      LEFT JOIN units u ON u.id = au.unit_id
      GROUP BY a.id, a.name, a.bloc_id, b.name, a.points_limit
            ORDER BY a.name DESC";
    $res = $conn->query($sql);
    ok(["armies" => $res->fetch_all(MYSQLI_ASSOC)]);
}

if ($action === 'armies.get') {
    $id = requireInt($_GET['id'] ?? null, 'id');

    $loaded = loadArmyDetailArrays($conn, $id);
    if ($loaded === null) fail("Army not found", 404);
    [$army, $platoons, $units, $platoonTemplates] = $loaded;

    // current points sum (simple: unit_points * quantity)
    $sum = 0;
    foreach ($units as $row) {
        $sum += ((int)$row['unit_points']) * ((int)$row['quantity']);
    }

    // Authoritative server-side rule validation (faction bonus, points limit,
    // bloc/mercenary checks, platoon TO&E, etc.) - see army_validation.php.
    // The frontend uses this result directly instead of recomputing it.
    $validation = dust1947_validate_army_composition($army, $units, $platoons, $platoonTemplates);

    ok([
        "army" => $army,
        "platoons" => $platoons,
        "platoon_templates" => $platoonTemplates,
        "units" => $units,
        "points_used" => $sum,
        "points_remaining" => ((int)$army["points_limit"]) - $sum,
        "validation" => $validation
    ]);
}

if ($action === 'armies.create') {
    $body = jsonBody();
    $name = requireString($body['name'] ?? null, 'name');
    $blocId = requireInt($body['bloc_id'] ?? null, 'bloc_id');
    $limit = isset($body['points_limit']) ? (int)$body['points_limit'] : 100;

    $stmt = $conn->prepare("INSERT INTO armies (name, bloc_id, points_limit) VALUES (?, ?, ?)");
    $stmt->bind_param("sii", $name, $blocId, $limit);
    $stmt->execute();

    ok(["id" => $conn->insert_id], 201);
}

if ($action === 'armies.update') {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        fail("Use POST", 405);
    }

    $body = jsonBody();

    $id = requireInt($body['id'] ?? null, 'id');
    $name = requireString($body['name'] ?? null, 'name');
    $pointsLimit = requireInt($body['points_limit'] ?? null, 'points_limit');

    $stmt = $conn->prepare("
        UPDATE armies
        SET name = ?, points_limit = ?
        WHERE id = ?
    ");
    $stmt->bind_param("sii", $name, $pointsLimit, $id);
    $stmt->execute();

    ok(["ok" => true]);
}

if ($action === 'armies.delete') {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        fail("Use POST", 405);
    }

    $body = jsonBody();
    $id = requireInt($body['id'] ?? null, 'id');

    $stmt = $conn->prepare("DELETE FROM armies WHERE id = ?");
    $stmt->bind_param("i", $id);
    $stmt->execute();

    ok(["ok" => true]);
}

if ($action === 'factions.list') {
	if ($_SERVER['REQUEST_METHOD'] !== 'GET') fail("Use GET", 405);
    $sql = "SELECT id, name, symbol_url FROM factions ORDER BY name";
    $res = $conn->query($sql);
    if (!$res) fail("Database error", 500);

    ok(["factions" => $res->fetch_all(MYSQLI_ASSOC)]);
}

if ($action === 'blocs.list') {
	if ($_SERVER['REQUEST_METHOD'] !== 'GET') fail("Use GET", 405);
    $sql = "SELECT b.id, b.name, b.sytem_id AS game_system_id, gs.name AS game_system_name
            FROM blocs b
            LEFT JOIN game_systems gs ON gs.id = b.sytem_id
            ORDER BY b.name";
    $res = $conn->query($sql);
    if (!$res) fail("Database error", 500);

    ok(["blocs" => $res->fetch_all(MYSQLI_ASSOC)]);
}


/**
 * =========================================================
 * Platoons
 * =========================================================
 * GET  ?action=platoons.list&bloc_id=3
 * POST ?action=army.platoons.add  {army_id, platoon_id}
 * POST ?action=army.platoons.remove&id=ARMY_PLATOON_ID
 */

if ($action === 'platoons.list') {
    $blocId = requireInt($_GET['bloc_id'] ?? null, 'bloc_id');
    $selectedSystemId = null;

    $stmtSystem = $conn->prepare("SELECT sytem_id FROM blocs WHERE id = ?");
    $stmtSystem->bind_param("i", $blocId);
    $stmtSystem->execute();
    $blocRow = $stmtSystem->get_result()->fetch_assoc();
    $selectedSystemId = $blocRow ? ($blocRow['sytem_id'] !== null ? (int)$blocRow['sytem_id'] : null) : null;

    if ($selectedSystemId !== null) {
        $stmt = $conn->prepare("
            SELECT p.id, p.name, p.rule_id, p.faction_id
            FROM platoons p
            JOIN factions f ON f.id = p.faction_id
            WHERE f.bloc_id = ?
              AND (p.game_system_id IS NULL OR p.game_system_id = ?)
            ORDER BY p.id ASC
        ");
        $stmt->bind_param("ii", $blocId, $selectedSystemId);
    } else {
        $stmt = $conn->prepare("
            SELECT p.id, p.name, p.rule_id, p.faction_id
            FROM platoons p
            JOIN factions f ON f.id = p.faction_id
            WHERE f.bloc_id = ?
            ORDER BY p.id ASC
        ");
        $stmt->bind_param("i", $blocId);
    }

    $stmt->execute();

    ok([
        "platoons" => $stmt->get_result()->fetch_all(MYSQLI_ASSOC)
    ]);
}

if ($action === 'army.platoons.add') {
    $body = jsonBody();
    $armyId = requireInt($body['army_id'] ?? null, 'army_id');
    $platoonId = requireInt($body['platoon_id'] ?? null, 'platoon_id');

    $stmt = $conn->prepare("INSERT INTO army_platoons (army_id, platoon_id) VALUES (?, ?)");
    $stmt->bind_param("ii", $armyId, $platoonId);
    $stmt->execute();

    ok(["id" => $conn->insert_id], 201);
}

if ($action === 'army.platoons.remove') {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') fail("Use POST", 405);
	$body = jsonBody();
    $id = requireInt($body['id'] ?? null, 'id');

    $stmt = $conn->prepare("DELETE FROM army_platoons WHERE id = ?");
    $stmt->bind_param("i", $id);
    $stmt->execute();

    ok(["ok" => true]);
}

/**
 * =========================================================
 * Army Units
 * =========================================================
 * POST   ?action=army.units.add
 *        {
 *          army_id,
 *          unit_id,
 *          quantity,
 *          platoon_id (optional: null or omitted for "free unit"),
 *          platoon_unit_id (optional)
 *        }
 *
 * PUT    ?action=army.units.update&id=ARMY_UNIT_ID  {quantity}
 * POST   ?action=army.units.delete&id=ARMY_UNIT_ID
 */

if ($action === 'army.units.add') {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        fail("Use POST", 405);
    }

    $body = jsonBody();

    $armyId = requireInt($body['army_id'] ?? null, 'army_id');
    $unitId = requireInt($body['unit_id'] ?? null, 'unit_id');
    $qty    = isset($body['quantity']) ? max(1, (int)$body['quantity']) : 1;

	$armyPlatoonId = $body['army_platoon_id'] ?? null;
	$platoonUnitId = $body['platoon_unit_id'] ?? null;

	if ($armyPlatoonId !== null) {
		$armyPlatoonId = requireInt($armyPlatoonId, 'army_platoon_id');

		// Slot-Einheit?
		if ($platoonUnitId !== null) {
			$platoonUnitId = requireInt($platoonUnitId, 'platoon_unit_id');

			// 🔒 Slot darf nur einmal belegt sein
			$stmt = $conn->prepare("
				SELECT 1
				FROM army_units
				WHERE army_platoon_id = ?
				  AND platoon_unit_id = ?
				LIMIT 1
			");
			$stmt->bind_param("ii", $armyPlatoonId, $platoonUnitId);
			$stmt->execute();

			if ($stmt->get_result()->num_rows > 0) {
				fail("Slot already occupied in this platoon", 409);
			}
		}

		// ✅ Platoon-Unit ODER Support-Unit
		$stmt = $conn->prepare("
			INSERT INTO army_units
			  (army_id, unit_id, quantity, army_platoon_id, platoon_unit_id)
			VALUES (?, ?, ?, ?, ?)
		");
		$stmt->bind_param(
			"iiiii",
			$armyId,
			$unitId,
			$qty,
			$armyPlatoonId,
			$platoonUnitId // NULL erlaubt → Support
		);
		$stmt->execute();

		ok(["id" => $conn->insert_id], 201);
	}

    // 🔹 Freie Einheit (kein Platoon)
    $stmt = $conn->prepare("
        INSERT INTO army_units
          (army_id, unit_id, quantity, army_platoon_id, platoon_unit_id)
        VALUES (?, ?, ?, NULL, NULL)
    ");
    $stmt->bind_param("iii", $armyId, $unitId, $qty);
    $stmt->execute();

    ok(["id" => $conn->insert_id], 201);
}

if ($action === 'army.units.update') {
    if ($_SERVER['REQUEST_METHOD'] !== 'PUT') fail("Use PUT", 405);
    $id = requireInt($_GET['id'] ?? null, 'id');
    $body = jsonBody();
    $qty = isset($body['quantity']) ? max(1, (int)$body['quantity']) : null;
    if ($qty === null) fail("Missing quantity", 400);

    $stmt = $conn->prepare("UPDATE army_units SET quantity = ? WHERE id = ?");
    $stmt->bind_param("ii", $qty, $id);
    $stmt->execute();

    ok(["ok" => true]);
}

if ($action === 'army.units.delete') {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') fail("Use POST", 405);
	$body = jsonBody();
	$id = requireInt($body['id'] ?? null, 'id');

    $stmt = $conn->prepare("DELETE FROM army_units WHERE id = ?");
    $stmt->bind_param("i", $id);
    $stmt->execute();

    ok(["ok" => true]);
}

/**
 * =========================================================
 * Platoon Unit Templates
 * (Welche Units sind in einem Platoon-Slot erlaubt?)
 * =========================================================
 * GET ?action=platoon.units.list&platoon_id=2
 */
if ($action === 'platoon.units.list') {
    $platoonId = requireInt($_GET['platoon_id'] ?? null, 'platoon_id');

    $stmt = $conn->prepare("
        SELECT pu.id, pu.platoon_id, pu.slot, pu.unit_id, u.name AS unit_name, u.points AS unit_points, f.name AS faction_name
        FROM platoon_units pu
        JOIN units u ON u.id = pu.unit_id
		LEFT JOIN factions f ON u.faction_id = f.id
        WHERE pu.platoon_id = ?
        ORDER BY pu.id ASC
    ");
    $stmt->bind_param("i", $platoonId);
    $stmt->execute();
    ok(["platoon_units" => $stmt->get_result()->fetch_all(MYSQLI_ASSOC)]);
}

if ($action === 'army.analyze') {
    // This used to be a separate, partial re-implementation of the
    // bloc/faction-bonus rules (fixed unit_rule_id=52 for "mercenary",
    // simplified 75% check, no points-limit/platoon/hero checks at all).
    // It now shares the same data loading and the same rule engine as
    // `armies.get` (see army_validation.php), so there is a single
    // authoritative implementation of the rules. The response keeps its
    // original field names for backward compatibility, derived from the
    // unified validation result, and additionally exposes the full
    // validation payload under "validation".
    $armyId = requireInt($_GET['id'] ?? null, 'id');

    $loaded = loadArmyDetailArrays($conn, $armyId);
    if ($loaded === null) fail("Army not found", 404);
    [$army, $platoons, $units, $platoonTemplates] = $loaded;

    $validation = dust1947_validate_army_composition($army, $units, $platoons, $platoonTemplates);

    $armyBlocId = dust1947_to_int($army['bloc_id'] ?? null, null);
    $blocValid = true;
    foreach ($units as $unit) {
        if (dust1947_is_mercenary($unit) || dust1947_is_captured($unit)) continue;
        $unitBlocId = dust1947_get_unit_bloc_id($unit);
        if ($unitBlocId !== null && $unitBlocId !== $armyBlocId) {
            $blocValid = false;
            break;
        }
    }

    ok([
        "bloc_valid" => $blocValid,
        "faction_bonus" => [
            "eligible" => !$validation['pureMercenaryForce'] && $validation['forceType'] === 'Faction Force',
            "dominant_faction_id" => $validation['selectedFactionId'],
            "percent" => round(($validation['factionShare'] ?? 0) * 100, 2)
        ],
        "total_points" => $validation['pointsUsed'],
        "validation" => $validation
    ]);
}


fail("Unknown action", 404, ["action" => $action]);
