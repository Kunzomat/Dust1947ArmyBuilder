<?php
header("Access-Control-Allow-Origin: http://localhost:3000");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, X-API-Key");
header("Access-Control-Max-Age: 86400");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

require_once __DIR__ . "/auth.php";
require_once __DIR__ . '/unit_rating.php';
require_once __DIR__ . '/db_connection.php';

// $conn ist jetzt durch db_connection.php verfügbar

// Prüfen, ob eine einzelne Einheit abgefragt wird
if (isset($_GET['unit_id'])) {
    $unit_id = intval($_GET['unit_id']);

    // 1️⃣ Einheit + Fraktion laden
    // WICHTIG: Separate Queries für Stats und Rules, um Cartesian Product zu vermeiden

    // Hauptquery: Unit mit Waffen (ohne Stats/Rules)
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
			w.disposable as weapon_disposable
		FROM units u
		LEFT JOIN factions f ON u.faction_id = f.id
		LEFT JOIN blocs b ON f.bloc_id = b.id
		LEFT JOIN unit_rules uur ON u.id = uur.unit_id
		LEFT JOIN rules ur ON uur.unit_rule_id = ur.id
		LEFT JOIN unit_weapons uw ON u.id = uw.unit_id
		LEFT JOIN weapons w ON uw.weapon_id = w.id
		WHERE u.id = ?
		ORDER BY u.id, w.id
		";

		$stmt = $conn->prepare($sql);
		$stmt->bind_param("s", $unit_id); // "s" für String
		$stmt->execute();
		$result = $stmt->get_result();

		$units = [];
		$weaponIds = [];

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
						'stats' => [],
						'rules' => []
					];
					$weaponIds[$weaponId] = true;
				}
			}
		}

		// 2️⃣ Lade Weapon Stats separat (verhindert Cartesian Product)
		if (!empty($weaponIds)) {
			$weaponIdList = implode(',', array_map('intval', array_keys($weaponIds)));
			$statsSql = "
				SELECT
					weapon_id,
					id AS stat_id,
					target_type,
					target_level,
					dice,
					damage
				FROM weapon_stats
				WHERE weapon_id IN ($weaponIdList)
				ORDER BY weapon_id, target_level, target_type
			";

			$statsResult = $conn->query($statsSql);
			if ($statsResult) {
				while ($statRow = $statsResult->fetch_assoc()) {
					$wid = $statRow['weapon_id'];
					// Finde die Unit und Waffe
					foreach ($units as &$unit) {
						foreach ($unit['weapons'] as &$weapon) {
							if ($weapon['id'] == $wid) {
								if (!isset($weapon['stats'])) {
									$weapon['stats'] = [];
								}
								$weapon['stats'][$statRow['stat_id']] = [
									'type' => $statRow['target_type'],
									'level' => $statRow['target_level'],
									'dice' => $statRow['dice'],
									'damage' => $statRow['damage']
								];
								break;
							}
						}
					}
				}
			}

			// 3️⃣ Lade Weapon Rules separat (verhindert Cartesian Product)
			$rulesSql = "
				SELECT
					wr.weapon_id,
					r.id AS rule_id,
					r.name AS rule_name,
					r.bonus_factor AS rule_bonus_factor,
					r.short_text AS rule_desc,
					r.full_text AS rule_text
				FROM weapon_rules wr
				LEFT JOIN rules r ON wr.rule_id = r.id
				WHERE wr.weapon_id IN ($weaponIdList)
				ORDER BY wr.weapon_id, r.name
			";

			$rulesResult = $conn->query($rulesSql);
			if ($rulesResult) {
				while ($ruleRow = $rulesResult->fetch_assoc()) {
					$wid = $ruleRow['weapon_id'];
					// Finde die Unit und Waffe
					foreach ($units as &$unit) {
						foreach ($unit['weapons'] as &$weapon) {
							if ($weapon['id'] == $wid && !empty($ruleRow['rule_id'])) {
								if (!isset($weapon['rules'])) {
									$weapon['rules'] = [];
								}
								$weapon['rules'][$ruleRow['rule_id']] = [
									'id' => $ruleRow['rule_id'],
									'name' => $ruleRow['rule_name'],
									'bonus_factor' => isset($ruleRow['rule_bonus_factor']) ? (float)$ruleRow['rule_bonus_factor'] : 0.5,
									'desc' => $ruleRow['rule_desc'],
									'text' => $ruleRow['rule_text']
								];
								break;
							}
						}
					}
				}
			}
		}

		foreach ($units as &$unit) {
			$unit['theoretical_points'] = compute_theoretical_points($unit);
			$unit['special_rules'] = array_values($unit['special_rules']);
			$unit['weapons'] = array_values($unit['weapons']);
			foreach ($unit['weapons'] as &$weapon) {
				$weapon['rules'] = array_values($weapon['rules'] ?? []);
				$weapon['stats'] = array_values($weapon['stats'] ?? []);
			}
		}

		//echo json_encode(array_values($units), JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
		echo json_encode(reset($units), JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
    exit;
}

// Standard: Alle Einheiten
$sql = "SELECT id, name, type, points, image_url FROM units";
$result = $conn->query($sql);

$units = [];
if ($result) {
    while ($row = $result->fetch_assoc()) {
        $units[] = $row;
    }
}

echo json_encode($units, JSON_PRETTY_PRINT);
$conn->close();
