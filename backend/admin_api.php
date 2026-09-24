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

function nullableInt($value)
{
    if ($value === null || $value === '') return null;
    return (int)$value;
}

function respondJson($data, $statusCode = 200)
{
    http_response_code($statusCode);
    echo json_encode($data);
}

function listImageFiles($directory)
{
    if (!is_dir($directory)) {
        return [];
    }

    $allowedExtensions = ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'];
    $files = array_values(array_filter(scandir($directory), function ($file) use ($directory, $allowedExtensions) {
        if ($file === '.' || $file === '..') {
            return false;
        }

        $path = $directory . DIRECTORY_SEPARATOR . $file;
        if (!is_file($path)) {
            return false;
        }

        $extension = strtolower(pathinfo($file, PATHINFO_EXTENSION));
        return in_array($extension, $allowedExtensions, true);
    }));

    natcasesort($files);
    return array_values($files);
}

function buildImageUploadResult($imagesDirectory, $originalName, $binaryContent, $extension)
{
    $safeBaseName = preg_replace('/[^A-Za-z0-9_-]/', '_', pathinfo($originalName, PATHINFO_FILENAME));
    $safeBaseName = trim($safeBaseName, '_');
    if ($safeBaseName === '') {
        $safeBaseName = 'image';
    }
    if (strlen($safeBaseName) > 120) {
        $safeBaseName = substr($safeBaseName, 0, 120);
    }

    $targetFileName = sprintf('%s_%s.%s', $safeBaseName, date('YmdHis'), $extension);
    $targetPath = $imagesDirectory . DIRECTORY_SEPARATOR . $targetFileName;

    $counter = 1;
    while (file_exists($targetPath)) {
        $targetFileName = sprintf('%s_%s_%d.%s', $safeBaseName, date('YmdHis'), $counter, $extension);
        $targetPath = $imagesDirectory . DIRECTORY_SEPARATOR . $targetFileName;
        $counter++;
    }

    if (file_put_contents($targetPath, $binaryContent) === false) {
        return ['error' => 'Image could not be saved'];
    }

    return [
        'message' => 'Image uploaded',
        'filename' => $targetFileName,
        'originalName' => $originalName,
    ];
}

function getUploadErrorMessage($errorCode)
{
    switch ($errorCode) {
        case UPLOAD_ERR_INI_SIZE:
        case UPLOAD_ERR_FORM_SIZE:
            return 'Die Datei ist zu groß für die PHP-Upload-Grenze.';
        case UPLOAD_ERR_PARTIAL:
            return 'Die Datei wurde nur teilweise hochgeladen.';
        case UPLOAD_ERR_NO_FILE:
            return 'Es wurde keine Datei ausgewählt.';
        case UPLOAD_ERR_NO_TMP_DIR:
            return 'Dem Server fehlt ein temporäres Upload-Verzeichnis.';
        case UPLOAD_ERR_CANT_WRITE:
            return 'Der Server konnte die Datei nicht auf die Festplatte schreiben.';
        case UPLOAD_ERR_EXTENSION:
            return 'Der Upload wurde durch eine PHP-Erweiterung gestoppt.';
        default:
            return 'Upload fehlgeschlagen.';
    }
}

function ensureBlocsImageColumn($conn)
{
    $checkResult = $conn->query("SHOW COLUMNS FROM blocs LIKE 'image_url'");
    if ($checkResult && $checkResult->num_rows === 0) {
        $conn->query("ALTER TABLE blocs ADD COLUMN image_url VARCHAR(255) NULL AFTER description");
    }
}

try {
    $conn = getDbConnection();
    $imagesDirectory = __DIR__ . DIRECTORY_SEPARATOR . 'images';

    if ($action === 'images.list') {
        respondJson(listImageFiles($imagesDirectory));
        exit();
    } elseif ($action === 'images.upload') {
        if ($method !== 'POST') {
            respondJson(['error' => 'Method not allowed'], 405);
            exit();
        }

        if (!is_dir($imagesDirectory) && !mkdir($imagesDirectory, 0775, true) && !is_dir($imagesDirectory)) {
            respondJson(['error' => 'Image directory could not be created'], 500);
            exit();
        }
        $allowedExtensions = ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'];
        $allowedMimeTypes = [
            'image/png',
            'image/jpeg',
            'image/gif',
            'image/webp',
            'image/svg+xml',
            'text/plain',
            'text/xml',
            'application/xml',
        ];

        if (isset($_FILES['image'])) {
            $file = $_FILES['image'];

            if (($file['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_OK) {
                respondJson(['error' => getUploadErrorMessage($file['error'] ?? UPLOAD_ERR_NO_FILE)], 400);
                exit();
            }

            $originalName = $file['name'] ?? 'image';
            $extension = strtolower(pathinfo($originalName, PATHINFO_EXTENSION));
            if (!in_array($extension, $allowedExtensions, true)) {
                respondJson(['error' => 'Unsupported image format'], 400);
                exit();
            }

            $finfo = finfo_open(FILEINFO_MIME_TYPE);
            $mimeType = $finfo ? finfo_file($finfo, $file['tmp_name']) : false;
            if ($finfo) {
                finfo_close($finfo);
            }

            if ($mimeType === false || !in_array($mimeType, $allowedMimeTypes, true)) {
                respondJson(['error' => 'Invalid image content'], 400);
                exit();
            }

            if ($extension !== 'svg') {
                $imageInfo = @getimagesize($file['tmp_name']);
                if ($imageInfo === false) {
                    respondJson(['error' => 'Uploaded file is not a valid image'], 400);
                    exit();
                }
            }

            $binaryContent = file_get_contents($file['tmp_name']);
            $result = buildImageUploadResult($imagesDirectory, $originalName, $binaryContent, $extension);
            if (isset($result['error'])) {
                respondJson($result, 500);
                exit();
            }

            respondJson($result);
            exit();
        }

        $data = json_decode(file_get_contents('php://input'), true);
        $imageData = $data['imageData'] ?? '';
        $originalName = $data['originalName'] ?? 'image.png';

        if (!$imageData || !preg_match('/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/', $imageData, $matches)) {
            respondJson(['error' => 'Invalid image payload'], 400);
            exit();
        }

        $mimeType = strtolower($matches[1]);
        $base64Data = $matches[2];
        $mimeToExtension = [
            'image/png' => 'png',
            'image/jpeg' => 'jpg',
            'image/gif' => 'gif',
            'image/webp' => 'webp',
            'image/svg+xml' => 'svg',
        ];

        if (!isset($mimeToExtension[$mimeType])) {
            respondJson(['error' => 'Unsupported image format'], 400);
            exit();
        }

        $extension = strtolower(pathinfo($originalName, PATHINFO_EXTENSION));
        if (!in_array($extension, $allowedExtensions, true)) {
            $extension = $mimeToExtension[$mimeType];
            $originalName = pathinfo($originalName, PATHINFO_FILENAME) . '.' . $extension;
        }

        $binaryContent = base64_decode($base64Data, true);
        if ($binaryContent === false) {
            respondJson(['error' => 'Image data could not be decoded'], 400);
            exit();
        }

        if ($extension !== 'svg' && @getimagesizefromstring($binaryContent) === false) {
            respondJson(['error' => 'Uploaded file is not a valid image'], 400);
            exit();
        }

        $result = buildImageUploadResult($imagesDirectory, $originalName, $binaryContent, $extension);
        if (isset($result['error'])) {
            respondJson($result, 500);
            exit();
        }

        respondJson($result);
        exit();
    }

    // ============================================
    // FACTIONS
    // ============================================

    if ($action === 'factions.list') {
        $result = $conn->query("
            SELECT
                f.*,
                b.name AS bloc_name,
                b.sytem_id AS game_system_id,
                gs.name AS game_system_name
            FROM factions f
            LEFT JOIN blocs b ON f.bloc_id = b.id
            LEFT JOIN game_systems gs ON b.sytem_id = gs.id
            ORDER BY f.name
        ");
        echo json_encode($result->fetch_all(MYSQLI_ASSOC));
    } elseif ($action === 'factions.create') {
        $data = json_decode(file_get_contents('php://input'), true);
        $stmt = $conn->prepare("INSERT INTO factions (name, description, symbol_url, bloc_id) VALUES (?, ?, ?, ?)");
        $description = $data['description'] ?? '';
        $symbol = $data['symbol_url'] ?? '';
        $stmt->bind_param('sssi', $data['name'], $description, $symbol, $data['bloc_id']);
        $stmt->execute();
        echo json_encode(['id' => $conn->insert_id, 'message' => 'Faction created']);
    } elseif ($action === 'factions.update') {
        $data = json_decode(file_get_contents('php://input'), true);
        $stmt = $conn->prepare("UPDATE factions SET name=?, description=?, symbol_url=?, bloc_id=? WHERE id=?");
        $description = $data['description'] ?? '';
        $symbol = $data['symbol_url'] ?? '';
        $stmt->bind_param('sssii', $data['name'], $description, $symbol, $data['bloc_id'], $data['id']);
        $stmt->execute();
        echo json_encode(['message' => 'Faction updated']);
    } elseif ($action === 'factions.delete') {
        $id = $_GET['id'] ?? 0;
        $conn->query("DELETE FROM factions WHERE id=$id");
        echo json_encode(['message' => 'Faction deleted']);
    }

    // ============================================
    // UNITS
    // ============================================

    elseif ($action === 'units.list') {
        $gameSystemId = isset($_GET['game_system_id']) && $_GET['game_system_id'] !== '' ? (int)$_GET['game_system_id'] : null;
        $query = "
            SELECT u.*, f.name as faction_name, gs.name as game_system_name
            FROM units u
            LEFT JOIN factions f ON u.faction_id = f.id
            LEFT JOIN game_systems gs ON u.game_system_id = gs.id
        ";
        if ($gameSystemId !== null) {
            $query .= " WHERE u.game_system_id IS NULL OR u.game_system_id = $gameSystemId ";
        }
        $query .= "
            ORDER BY u.name
        ";
        $result = $conn->query($query);
        echo json_encode($result->fetch_all(MYSQLI_ASSOC));
    } elseif ($action === 'units.get') {
        $id = $_GET['id'] ?? 0;
        $query = "
            SELECT u.*, f.name as faction_name, gs.name as game_system_name
            FROM units u
            LEFT JOIN factions f ON u.faction_id = f.id
            LEFT JOIN game_systems gs ON u.game_system_id = gs.id
            WHERE u.id = $id
        ";
        $result = $conn->query($query);
        echo json_encode($result->fetch_assoc());
    } elseif ($action === 'units.create') {
        $data = json_decode(file_get_contents('php://input'), true);
        $game_system_id = nullableInt($data['game_system_id'] ?? null);
        $stmt = $conn->prepare("
            INSERT INTO units (
                name, faction_id, game_system_id, type, points,
                level, speed, march_speed, health,
                image_url, notes
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ");
        $stmt->bind_param(
            'siisisiiiss',
            $data['name'],
            $data['faction_id'],
            $game_system_id,
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
    } elseif ($action === 'units.update') {
        $data = json_decode(file_get_contents('php://input'), true);
        $game_system_id = nullableInt($data['game_system_id'] ?? null);
        $stmt = $conn->prepare("
            UPDATE units SET
                name=?, faction_id=?, game_system_id=?, type=?, points=?,
                level=?, speed=?, march_speed=?, health=?,
                image_url=?, notes=?
            WHERE id=?
        ");
        $stmt->bind_param(
            'siisisiiissi',
            $data['name'],
            $data['faction_id'],
            $game_system_id,
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
    } elseif ($action === 'units.delete') {
        $id = $_GET['id'] ?? 0;
        // Delete relations first
        $conn->query("DELETE FROM unit_weapons WHERE unit_id=$id");
        $conn->query("DELETE FROM unit_rules WHERE unit_id=$id");
        $conn->query("DELETE FROM army_units WHERE unit_id=$id");
        // Delete unit
        $conn->query("DELETE FROM units WHERE id=$id");
        echo json_encode(['message' => 'Unit deleted']);
    } elseif ($action === 'units.clone') {
        $data = json_decode(file_get_contents('php://input'), true);
        $sourceId = isset($data['id']) ? (int)$data['id'] : 0;

        if ($sourceId <= 0) {
            http_response_code(400);
            echo json_encode(['error' => 'Ungültige Unit-ID']);
            exit;
        }

        $sourceStmt = $conn->prepare("SELECT name, faction_id, game_system_id, type, points, level, speed, march_speed, health, image_url, notes FROM units WHERE id = ?");
        $sourceStmt->bind_param('i', $sourceId);
        $sourceStmt->execute();
        $source = $sourceStmt->get_result()->fetch_assoc();

        if (!$source) {
            http_response_code(404);
            echo json_encode(['error' => 'Unit nicht gefunden']);
            exit;
        }

        $clonedName = array_key_exists('name', $data) ? (string)$data['name'] : ($source['name'] . ' (Kopie)');
        $factionId = array_key_exists('faction_id', $data) ? (int)$data['faction_id'] : (int)$source['faction_id'];
        $gameSystemId = array_key_exists('game_system_id', $data)
            ? nullableInt($data['game_system_id'])
            : nullableInt($source['game_system_id']);
        $type = array_key_exists('type', $data) ? (string)$data['type'] : $source['type'];
        $points = array_key_exists('points', $data) ? (int)$data['points'] : (int)$source['points'];
        $level = array_key_exists('level', $data) ? (string)$data['level'] : $source['level'];
        $speed = array_key_exists('speed', $data) ? nullableInt($data['speed']) : nullableInt($source['speed']);
        $marchSpeed = array_key_exists('march_speed', $data) ? nullableInt($data['march_speed']) : nullableInt($source['march_speed']);
        $health = array_key_exists('health', $data) ? nullableInt($data['health']) : nullableInt($source['health']);
        $imageUrl = array_key_exists('image_url', $data) ? (string)$data['image_url'] : $source['image_url'];
        $notes = array_key_exists('notes', $data) ? (string)$data['notes'] : $source['notes'];

        try {
            $conn->begin_transaction();

            $insertUnitStmt = $conn->prepare("\n                INSERT INTO units (\n                    name, faction_id, game_system_id, type, points,\n                    level, speed, march_speed, health,\n                    image_url, notes\n                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)\n            ");
            $insertUnitStmt->bind_param(
                'siisisiiiss',
                $clonedName,
                $factionId,
                $gameSystemId,
                $type,
                $points,
                $level,
                $speed,
                $marchSpeed,
                $health,
                $imageUrl,
                $notes
            );
            $insertUnitStmt->execute();
            $newUnitId = (int)$conn->insert_id;

            $cloneWeaponsStmt = $conn->prepare("\n                INSERT INTO unit_weapons (unit_id, weapon_id, number, firing_arc)\n                SELECT ?, weapon_id, number, firing_arc\n                FROM unit_weapons\n                WHERE unit_id = ?\n            ");
            $cloneWeaponsStmt->bind_param('ii', $newUnitId, $sourceId);
            $cloneWeaponsStmt->execute();

            $cloneRulesStmt = $conn->prepare("\n                INSERT INTO unit_rules (unit_id, unit_rule_id, note)\n                SELECT ?, unit_rule_id, note\n                FROM unit_rules\n                WHERE unit_id = ?\n            ");
            $cloneRulesStmt->bind_param('ii', $newUnitId, $sourceId);
            $cloneRulesStmt->execute();

            $conn->commit();

            echo json_encode([
                'id' => $newUnitId,
                'message' => 'Unit erfolgreich geklont'
            ]);
        } catch (Throwable $e) {
            $conn->rollback();
            http_response_code(500);
            echo json_encode(['error' => 'Fehler beim Klonen der Unit: ' . $e->getMessage()]);
        }
    }

    // ============================================
    // WEAPONS
    // ============================================

    elseif ($action === 'weapons.list') {
        $gameSystemId = isset($_GET['game_system_id']) && $_GET['game_system_id'] !== '' ? (int)$_GET['game_system_id'] : null;
        $query = "
            SELECT
                w.id,
                w.name,
                w.`range`,
                w.disposable,
                w.game_system_id,
                gs.name as game_system_name,
                GROUP_CONCAT(DISTINCT f.id ORDER BY f.name SEPARATOR ',') AS faction_ids,
                GROUP_CONCAT(DISTINCT f.name ORDER BY f.name SEPARATOR ' | ') AS faction_names
            FROM weapons w
            LEFT JOIN game_systems gs ON w.game_system_id = gs.id
            LEFT JOIN unit_weapons uw ON uw.weapon_id = w.id
            LEFT JOIN units u ON uw.unit_id = u.id
            LEFT JOIN factions f ON u.faction_id = f.id
        ";
        if ($gameSystemId !== null) {
            $query .= " WHERE w.game_system_id IS NULL OR w.game_system_id = $gameSystemId ";
        }
        $query .= "
            GROUP BY w.id, w.name, w.`range`, w.disposable, w.game_system_id, gs.name
            ORDER BY w.name
        ";

        $result = $conn->query($query);
        $weapons = $result->fetch_all(MYSQLI_ASSOC);
        // Convert disposable to proper boolean/integer
        foreach ($weapons as &$weapon) {
            $weapon['disposable'] = (int)$weapon['disposable'];
        }
        echo json_encode($weapons);
    } elseif ($action === 'weapons.create') {
        $data = json_decode(file_get_contents('php://input'), true);
        $game_system_id = nullableInt($data['game_system_id'] ?? null);
        $stmt = $conn->prepare("
            INSERT INTO weapons (name, `range`, disposable, game_system_id)
            VALUES (?, ?, ?, ?)
        ");
        $disposable = ($data['disposable'] === true || $data['disposable'] === 1 || $data['disposable'] === '1') ? 1 : 0;
        $stmt->bind_param('ssii', $data['name'], $data['range'], $disposable, $game_system_id);
        $stmt->execute();
        echo json_encode(['id' => $conn->insert_id, 'message' => 'Weapon created']);
    } elseif ($action === 'weapons.update') {
        $data = json_decode(file_get_contents('php://input'), true);
        $game_system_id = nullableInt($data['game_system_id'] ?? null);
        $stmt = $conn->prepare("
            UPDATE weapons SET name=?, `range`=?, disposable=?, game_system_id=?
            WHERE id=?
        ");
        $disposable = ($data['disposable'] === true || $data['disposable'] === 1 || $data['disposable'] === '1') ? 1 : 0;
        $stmt->bind_param('ssiii', $data['name'], $data['range'], $disposable, $game_system_id, $data['id']);
        $stmt->execute();
        echo json_encode(['message' => 'Weapon updated']);
    } elseif ($action === 'weapons.clone') {
        $data = json_decode(file_get_contents('php://input'), true);
        $sourceId = isset($data['id']) ? (int)$data['id'] : 0;

        if ($sourceId <= 0) {
            http_response_code(400);
            echo json_encode(['error' => 'Ungültige Waffen-ID']);
            exit;
        }

        $sourceStmt = $conn->prepare("SELECT name, `range`, disposable, game_system_id FROM weapons WHERE id = ?");
        $sourceStmt->bind_param('i', $sourceId);
        $sourceStmt->execute();
        $source = $sourceStmt->get_result()->fetch_assoc();

        if (!$source) {
            http_response_code(404);
            echo json_encode(['error' => 'Waffe nicht gefunden']);
            exit;
        }

        $clonedName = $source['name'] . ' (Kopie)';
        $range = $source['range'];
        $disposable = (int)$source['disposable'];
        $gameSystemId = nullableInt($source['game_system_id']);

        try {
            $conn->begin_transaction();

            $insertWeaponStmt = $conn->prepare("INSERT INTO weapons (name, `range`, disposable, game_system_id) VALUES (?, ?, ?, ?)");
            $insertWeaponStmt->bind_param('ssii', $clonedName, $range, $disposable, $gameSystemId);
            $insertWeaponStmt->execute();
            $newWeaponId = (int)$conn->insert_id;

            $cloneStatsStmt = $conn->prepare("
                INSERT INTO weapon_stats (weapon_id, target_type, target_level, dice, damage)
                SELECT ?, target_type, target_level, dice, damage
                FROM weapon_stats
                WHERE weapon_id = ?
            ");
            $cloneStatsStmt->bind_param('ii', $newWeaponId, $sourceId);
            $cloneStatsStmt->execute();

            $cloneRulesStmt = $conn->prepare("
                INSERT INTO weapon_rules (weapon_id, rule_id)
                SELECT ?, rule_id
                FROM weapon_rules
                WHERE weapon_id = ?
            ");
            $cloneRulesStmt->bind_param('ii', $newWeaponId, $sourceId);
            $cloneRulesStmt->execute();

            $conn->commit();

            echo json_encode([
                'id' => $newWeaponId,
                'message' => 'Waffe erfolgreich geklont'
            ]);
        } catch (Throwable $e) {
            $conn->rollback();
            http_response_code(500);
            echo json_encode(['error' => 'Fehler beim Klonen der Waffe: ' . $e->getMessage()]);
        }
    } elseif ($action === 'weapons.delete') {
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
        $gameSystemId = isset($_GET['game_system_id']) && $_GET['game_system_id'] !== '' ? (int)$_GET['game_system_id'] : null;
        $query = "
            SELECT r.*, gs.name as game_system_name
            FROM rules r
            LEFT JOIN game_systems gs ON r.game_system_id = gs.id
        ";
        if ($gameSystemId !== null) {
            $query .= " WHERE r.game_system_id IS NULL OR r.game_system_id = $gameSystemId ";
        }
        $query .= " ORDER BY r.name";

        $result = $conn->query($query);
        echo json_encode($result->fetch_all(MYSQLI_ASSOC));
    } elseif ($action === 'rules.create') {
        $data = json_decode(file_get_contents('php://input'), true);
        $game_system_id = nullableInt($data['game_system_id'] ?? null);
        $stmt = $conn->prepare("INSERT INTO rules (name, short_text, full_text, game_system_id) VALUES (?, ?, ?, ?)");
        $short = $data['short_text'] ?? $data['description'] ?? '';
        $full = $data['full_text'] ?? $data['description'] ?? '';
        $stmt->bind_param('sssi', $data['name'], $short, $full, $game_system_id);
        $stmt->execute();
        echo json_encode(['id' => $conn->insert_id, 'message' => 'Rule created']);
    } elseif ($action === 'rules.update') {
        $data = json_decode(file_get_contents('php://input'), true);
        $game_system_id = nullableInt($data['game_system_id'] ?? null);
        $stmt = $conn->prepare("UPDATE rules SET name=?, short_text=?, full_text=?, game_system_id=? WHERE id=?");
        $short = $data['short_text'] ?? $data['description'] ?? '';
        $full = $data['full_text'] ?? $data['description'] ?? '';
        $stmt->bind_param('sssii', $data['name'], $short, $full, $game_system_id, $data['id']);
        $stmt->execute();
        echo json_encode(['message' => 'Rule updated']);
    } elseif ($action === 'rules.delete') {
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
        $gameSystemId = isset($_GET['game_system_id']) && $_GET['game_system_id'] !== '' ? (int)$_GET['game_system_id'] : null;
        $query = "
            SELECT p.*, f.name as faction_name, r.name as rule_name,
                   gs.name as game_system_name,
                   COUNT(pu.id) as slot_count
            FROM platoons p
            LEFT JOIN factions f ON p.faction_id = f.id
            LEFT JOIN rules r ON p.rule_id = r.id
            LEFT JOIN game_systems gs ON p.game_system_id = gs.id
            LEFT JOIN platoon_units pu ON p.id = pu.platoon_id
        ";
        if ($gameSystemId !== null) {
            $query .= " WHERE p.game_system_id IS NULL OR p.game_system_id = $gameSystemId ";
        }
        $query .= " GROUP BY p.id ORDER BY p.name";

        $result = $conn->query($query);
        echo json_encode($result->fetch_all(MYSQLI_ASSOC));
    } elseif ($action === 'platoons.create') {
        $data = json_decode(file_get_contents('php://input'), true);
        $rule_id = $data['rule_id'] ?: null;
        $game_system_id = nullableInt($data['game_system_id'] ?? null);
        $stmt = $conn->prepare("INSERT INTO platoons (name, faction_id, rule_id, game_system_id) VALUES (?, ?, ?, ?)");
        $stmt->bind_param('siii', $data['name'], $data['faction_id'], $rule_id, $game_system_id);
        $stmt->execute();
        echo json_encode(['id' => $conn->insert_id, 'message' => 'Platoon created']);
    } elseif ($action === 'platoons.update') {
        $data = json_decode(file_get_contents('php://input'), true);
        $rule_id = $data['rule_id'] ?: null;
        $game_system_id = nullableInt($data['game_system_id'] ?? null);
        $stmt = $conn->prepare("UPDATE platoons SET name=?, faction_id=?, rule_id=?, game_system_id=? WHERE id=?");
        $stmt->bind_param('siiii', $data['name'], $data['faction_id'], $rule_id, $game_system_id, $data['id']);
        $stmt->execute();
        echo json_encode(['message' => 'Platoon updated']);
    } elseif ($action === 'platoons.delete') {
        $id = $_GET['id'] ?? 0;
        $conn->query("DELETE FROM army_platoons WHERE platoon_id=$id");
        $conn->query("DELETE FROM platoons WHERE id=$id");
        echo json_encode(['message' => 'Platoon deleted']);
    }

    // ============================================
    // GAME SYSTEMS
    // ============================================

    elseif ($action === 'game_systems.list') {
        $result = $conn->query("SELECT id, name, description, NULL AS rules_version FROM game_systems ORDER BY name");
        echo json_encode($result->fetch_all(MYSQLI_ASSOC));
    } elseif ($action === 'game_systems.create') {
        $data = json_decode(file_get_contents('php://input'), true);
        $stmt = $conn->prepare("INSERT INTO game_systems (name, description) VALUES (?, ?)");
        $description = $data['description'] ?? '';
        $stmt->bind_param('ss', $data['name'], $description);
        $stmt->execute();
        echo json_encode(['id' => $conn->insert_id, 'message' => 'Game System created']);
    } elseif ($action === 'game_systems.update') {
        $data = json_decode(file_get_contents('php://input'), true);
        $stmt = $conn->prepare("UPDATE game_systems SET name=?, description=? WHERE id=?");
        $description = $data['description'] ?? '';
        $stmt->bind_param('ssi', $data['name'], $description, $data['id']);
        $stmt->execute();
        echo json_encode(['message' => 'Game System updated']);
    } elseif ($action === 'game_systems.delete') {
        $id = $_GET['id'] ?? 0;
        $usage = 0;
        $usage += (int)$conn->query("SELECT COUNT(*) as cnt FROM blocs WHERE sytem_id=$id")->fetch_assoc()['cnt'];
        $usage += (int)$conn->query("SELECT COUNT(*) as cnt FROM units WHERE game_system_id=$id")->fetch_assoc()['cnt'];
        $usage += (int)$conn->query("SELECT COUNT(*) as cnt FROM weapons WHERE game_system_id=$id")->fetch_assoc()['cnt'];
        $usage += (int)$conn->query("SELECT COUNT(*) as cnt FROM rules WHERE game_system_id=$id")->fetch_assoc()['cnt'];
        $usage += (int)$conn->query("SELECT COUNT(*) as cnt FROM platoons WHERE game_system_id=$id")->fetch_assoc()['cnt'];

        if ($usage > 0) {
            http_response_code(400);
            echo json_encode(['error' => 'Game System is still in use']);
            exit();
        }
        $conn->query("DELETE FROM game_systems WHERE id=$id");
        echo json_encode(['message' => 'Game System deleted']);
    }

    // ============================================
    // BLOCS (mit Game System Zugehörigkeit)
    // ============================================

    elseif ($action === 'blocs.list') {
        ensureBlocsImageColumn($conn);
        $query = "
            SELECT
                b.id,
                b.name,
                b.description,
                b.image_url,
                b.sytem_id,
                b.sytem_id AS game_system_id,
                gs.name as game_system_name
            FROM blocs b
            LEFT JOIN game_systems gs ON b.sytem_id = gs.id
            ORDER BY b.name
        ";
        $result = $conn->query($query);
        echo json_encode($result->fetch_all(MYSQLI_ASSOC));
    } elseif ($action === 'blocs.create') {
        ensureBlocsImageColumn($conn);
        $data = json_decode(file_get_contents('php://input'), true);
        $description = $data['description'] ?? '';
        $image_url = $data['image_url'] ?? '';
        $system_id = $data['sytem_id'] ?? ($data['game_system_id'] ?? null);
        $stmt = $conn->prepare("INSERT INTO blocs (name, description, image_url, sytem_id) VALUES (?, ?, ?, ?)");
        $stmt->bind_param('sssi', $data['name'], $description, $image_url, $system_id);
        $stmt->execute();
        echo json_encode(['id' => $conn->insert_id, 'message' => 'Bloc created']);
    } elseif ($action === 'blocs.update') {
        ensureBlocsImageColumn($conn);
        $data = json_decode(file_get_contents('php://input'), true);
        $description = $data['description'] ?? '';
        $image_url = $data['image_url'] ?? '';
        $system_id = $data['sytem_id'] ?? ($data['game_system_id'] ?? null);
        $stmt = $conn->prepare("UPDATE blocs SET name=?, description=?, image_url=?, sytem_id=? WHERE id=?");
        $stmt->bind_param('sssii', $data['name'], $description, $image_url, $system_id, $data['id']);
        $stmt->execute();
        echo json_encode(['message' => 'Bloc updated']);
    } elseif ($action === 'blocs.delete') {
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
    } elseif ($action === 'platoon_units.add') {
        $data = json_decode(file_get_contents('php://input'), true);
        $platoon_id = isset($data['platoon_id']) ? (int)$data['platoon_id'] : 0;
        $unit_id = isset($data['unit_id']) ? (int)$data['unit_id'] : 0;
        $slot = $data['slot'] ?? '';

        if ($platoon_id <= 0 || $unit_id <= 0 || $slot === '') {
            http_response_code(400);
            echo json_encode(['error' => 'platoon_id, unit_id und slot sind erforderlich']);
            exit();
        }

        $stmt = $conn->prepare("INSERT INTO platoon_units (platoon_id, unit_id, slot) VALUES (?, ?, ?)");
        $stmt->bind_param('iis', $platoon_id, $unit_id, $slot);
        $stmt->execute();
        echo json_encode(['id' => $conn->insert_id, 'message' => 'Slot added']);
    } elseif ($action === 'platoon_units.update') {
        $data = json_decode(file_get_contents('php://input'), true);
        $id = isset($data['id']) ? (int)$data['id'] : 0;
        $unit_id = isset($data['unit_id']) ? (int)$data['unit_id'] : 0;
        $slot = $data['slot'] ?? '';

        if ($id <= 0 || $unit_id <= 0 || $slot === '') {
            http_response_code(400);
            echo json_encode(['error' => 'id, unit_id und slot sind erforderlich']);
            exit();
        }

        $stmt = $conn->prepare("UPDATE platoon_units SET unit_id=?, slot=? WHERE id=?");
        $stmt->bind_param('isi', $unit_id, $slot, $id);
        $stmt->execute();
        echo json_encode(['message' => 'Slot updated']);
    } elseif ($action === 'platoon_units.delete') {
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
            SELECT uw.*, uw.id as unit_weapon_id, w.name as weapon_name, COALESCE(uw.number, 1) as quantity
            FROM unit_weapons uw
            JOIN weapons w ON uw.weapon_id = w.id
            WHERE uw.unit_id = $unit_id
            ORDER BY uw.id ASC
        ";
        $result = $conn->query($query);
        echo json_encode($result->fetch_all(MYSQLI_ASSOC));
    }

    // Weapon -> assigned units
    elseif ($action === 'weapon_units.list') {
        $weapon_id = isset($_GET['weapon_id']) ? (int)$_GET['weapon_id'] : 0;

        if ($weapon_id <= 0) {
            http_response_code(400);
            echo json_encode(['error' => 'weapon_id ist erforderlich']);
            exit;
        }

        $query = "
            SELECT
                uw.id AS unit_weapon_id,
                uw.weapon_id,
                uw.unit_id,
                COALESCE(uw.number, 1) AS quantity,
                uw.firing_arc,
                u.name AS unit_name,
                u.type AS unit_type,
                f.name AS faction_name,
                gs.name AS game_system_name
            FROM unit_weapons uw
            JOIN units u ON uw.unit_id = u.id
            LEFT JOIN factions f ON u.faction_id = f.id
            LEFT JOIN game_systems gs ON u.game_system_id = gs.id
            WHERE uw.weapon_id = $weapon_id
            ORDER BY u.name ASC, uw.id ASC
        ";

        $result = $conn->query($query);
        echo json_encode($result->fetch_all(MYSQLI_ASSOC));
    } elseif ($action === 'unit_weapons.add') {
        $data = json_decode(file_get_contents('php://input'), true);
        $unit_id = isset($data['unit_id']) ? (int)$data['unit_id'] : 0;
        $weapon_id = isset($data['weapon_id']) ? (int)$data['weapon_id'] : 0;
        $number = isset($data['number']) ? (int)$data['number'] : (isset($data['quantity']) ? (int)$data['quantity'] : 1);
        $number = max(1, $number);

        $rawArc = $data['firing_arc'] ?? ($data['fire_arc'] ?? '');
        $firing_arc = strtoupper(trim((string)$rawArc));
        $allowedArcs = ['L', 'R', 'F', 'T', 'REAR'];
        if (!in_array($firing_arc, $allowedArcs, true)) {
            $firing_arc = 'F';
        }

        if ($unit_id <= 0 || $weapon_id <= 0) {
            http_response_code(400);
            echo json_encode(['error' => 'unit_id und weapon_id sind erforderlich']);
            exit;
        }

        $stmt = $conn->prepare("INSERT INTO unit_weapons (unit_id, weapon_id, number, firing_arc) VALUES (?, ?, ?, ?)");
        if (!$stmt) {
            http_response_code(500);
            echo json_encode(['error' => 'Prepare fehlgeschlagen: ' . $conn->error]);
            exit;
        }

        $stmt->bind_param('iiis', $unit_id, $weapon_id, $number, $firing_arc);
        if (!$stmt->execute()) {
            http_response_code(500);
            echo json_encode(['error' => 'Execute fehlgeschlagen: ' . $stmt->error]);
            exit;
        }

        echo json_encode([
            'message' => 'Weapon added to unit',
            'id' => $stmt->insert_id,
            'unit_id' => $unit_id,
            'weapon_id' => $weapon_id,
            'number' => $number,
            'firing_arc' => $firing_arc
        ]);
    } elseif ($action === 'unit_weapons.update') {
        $data = json_decode(file_get_contents('php://input'), true);
        $assignment_id = isset($data['weapon_assignment_id']) ? (int)$data['weapon_assignment_id'] : (isset($data['id']) ? (int)$data['id'] : 0);
        $unit_id = isset($data['unit_id']) ? (int)$data['unit_id'] : 0;
        $number = isset($data['number']) ? (int)$data['number'] : (isset($data['quantity']) ? (int)$data['quantity'] : 1);
        $number = max(1, $number);

        $rawArc = $data['firing_arc'] ?? ($data['fire_arc'] ?? '');
        $firing_arc = strtoupper(trim((string)$rawArc));
        $allowedArcs = ['L', 'R', 'F', 'T', 'REAR'];
        if (!in_array($firing_arc, $allowedArcs, true)) {
            $firing_arc = 'F';
        }

        if ($assignment_id <= 0 || $unit_id <= 0) {
            http_response_code(400);
            echo json_encode(['error' => 'weapon_assignment_id und unit_id sind erforderlich']);
            exit;
        }

        $stmt = $conn->prepare("UPDATE unit_weapons SET number = ?, firing_arc = ? WHERE id = ? AND unit_id = ?");
        if (!$stmt) {
            http_response_code(500);
            echo json_encode(['error' => 'Prepare fehlgeschlagen: ' . $conn->error]);
            exit;
        }

        $stmt->bind_param('isii', $number, $firing_arc, $assignment_id, $unit_id);
        if (!$stmt->execute()) {
            http_response_code(500);
            echo json_encode(['error' => 'Execute fehlgeschlagen: ' . $stmt->error]);
            exit;
        }

        echo json_encode([
            'message' => 'Weapon assignment updated',
            'updated' => $stmt->affected_rows,
            'id' => $assignment_id,
            'unit_id' => $unit_id,
            'number' => $number,
            'firing_arc' => $firing_arc,
        ]);
    } elseif ($action === 'unit_weapons.remove') {
        $data = json_decode(file_get_contents('php://input'), true);
        $assignment_id = isset($data['weapon_assignment_id']) ? (int)$data['weapon_assignment_id'] : 0;
        $unit_id = isset($data['unit_id']) ? (int)$data['unit_id'] : 0;
        $weapon_id = isset($data['weapon_id']) ? (int)$data['weapon_id'] : 0;

        if ($assignment_id > 0) {
            $stmt = $conn->prepare("DELETE FROM unit_weapons WHERE id = ?");
            $stmt->bind_param('i', $assignment_id);
            $stmt->execute();
        } else {
            $stmt = $conn->prepare("DELETE FROM unit_weapons WHERE unit_id = ? AND weapon_id = ?");
            $stmt->bind_param('ii', $unit_id, $weapon_id);
            $stmt->execute();
        }
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
    } elseif ($action === 'unit_rules.add') {
        $data = json_decode(file_get_contents('php://input'), true);
        $stmt = $conn->prepare("INSERT INTO unit_rules (unit_id, unit_rule_id) VALUES (?, ?)");
        $rule_id = $data['unit_rule_id'] ?? $data['rule_id']; // Accept both field names
        $stmt->bind_param('ii', $data['unit_id'], $rule_id);
        $stmt->execute();
        echo json_encode(['message' => 'Rule added to unit']);
    } elseif ($action === 'unit_rules.remove') {
        $data = json_decode(file_get_contents('php://input'), true);
        $assignment_id = isset($data['id']) ? (int)$data['id'] : (isset($data['unit_rule_assignment_id']) ? (int)$data['unit_rule_assignment_id'] : 0);
        $unit_id = isset($data['unit_id']) ? (int)$data['unit_id'] : 0;
        $rule_id = isset($data['unit_rule_id']) ? (int)$data['unit_rule_id'] : (isset($data['rule_id']) ? (int)$data['rule_id'] : 0);

        if ($assignment_id > 0) {
            $stmt = $conn->prepare("DELETE FROM unit_rules WHERE id = ? AND unit_id = ?");
            $stmt->bind_param('ii', $assignment_id, $unit_id);
            $stmt->execute();
        } else {
            $stmt = $conn->prepare("DELETE FROM unit_rules WHERE unit_id = ? AND unit_rule_id = ?");
            $stmt->bind_param('ii', $unit_id, $rule_id);
            $stmt->execute();
        }
        echo json_encode(['message' => 'Rule removed from unit']);
    }

    // ============================================
    // WEAPON STATS
    // ============================================

    elseif ($action === 'weapon_stats.list') {
        $weapon_id = $_GET['weapon_id'] ?? 0;
        $result = $conn->query("SELECT * FROM weapon_stats WHERE weapon_id = $weapon_id ORDER BY target_type, target_level");
        echo json_encode($result->fetch_all(MYSQLI_ASSOC));
    } elseif ($action === 'weapon_stats.save') {
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
    } elseif ($action === 'weapon_rules.save') {
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

    // ============================================
    // THEORETICAL POINTS CALCULATION
    // ============================================

    elseif ($action === 'units.calculate_points') {
        require_once 'unit_rating.php';

        $unit_id = $_GET['id'] ?? 0;

        // Get unit data with relations
        $query = "
             SELECT u.*, f.name as faction_name, gs.name as game_system_name
             FROM units u
             LEFT JOIN factions f ON u.faction_id = f.id
             LEFT JOIN game_systems gs ON u.game_system_id = gs.id
             WHERE u.id = $unit_id
         ";
        $unitResult = $conn->query($query);
        if (!$unitResult || $unitResult->num_rows === 0) {
            respondJson(['error' => 'Unit not found'], 404);
            exit();
        }

        $unit = $unitResult->fetch_assoc();

        // Get weapons
        $weaponQuery = "
             SELECT uw.id AS unit_weapon_id, uw.unit_id, uw.number, uw.firing_arc,
                    w.id AS weapon_id, w.name, w.range, w.disposable
             FROM unit_weapons uw
             LEFT JOIN weapons w ON uw.weapon_id = w.id
             WHERE uw.unit_id = $unit_id
         ";
        $weaponResult = $conn->query($weaponQuery);
        $weapons = [];

        if ($weaponResult) {
            while ($w = $weaponResult->fetch_assoc()) {
                $weaponId = (int)$w['weapon_id'];

                // Get weapon stats
                $statsQuery = "SELECT target_type, target_level, dice, damage FROM weapon_stats WHERE weapon_id = $weaponId";
                $statsResult = $conn->query($statsQuery);
                $stats = [];
                if ($statsResult) {
                    while ($s = $statsResult->fetch_assoc()) {
                        $stats[] = [
                            'type' => $s['target_type'],
                            'level' => $s['target_level'],
                            'dice' => $s['dice'],
                            'damage' => $s['damage']
                        ];
                    }
                }

                // Get weapon rules with bonus_factor from rules table
                $rulesQuery = "SELECT r.id, r.name, r.full_text, r.bonus_factor FROM weapon_rules wr LEFT JOIN rules r ON wr.rule_id = r.id WHERE wr.weapon_id = $weaponId";
                $rulesResult = $conn->query($rulesQuery);
                $rules = [];
                if ($rulesResult) {
                    while ($r = $rulesResult->fetch_assoc()) {
                        $rules[] = [
                            'id' => $r['id'],
                            'name' => $r['name'],
                            'text' => $r['full_text'],
                            'bonus_factor' => isset($r['bonus_factor']) ? (float)$r['bonus_factor'] : 0.5
                        ];
                    }
                }

                $weapons[] = [
                    'id' => $weaponId,
                    'name' => $w['name'],
                    'range' => $w['range'],
                    'disposable' => (int)$w['disposable'],
                    'number' => (int)$w['number'],
                    'arc' => $w['firing_arc'],
                    'stats' => $stats,
                    'rules' => $rules
                ];
            }
        }

        // Get unit special rules with bonus_factor from rules table
        $rulesQuery = "SELECT r.id, r.name, r.full_text, r.bonus_factor FROM unit_rules ur LEFT JOIN rules r ON ur.unit_rule_id = r.id WHERE ur.unit_id = $unit_id";
        $rulesResult = $conn->query($rulesQuery);
        $special_rules = [];
        if ($rulesResult) {
            while ($r = $rulesResult->fetch_assoc()) {
                $special_rules[] = [
                    'id' => $r['id'],
                    'name' => $r['name'],
                    'text' => $r['full_text'],
                    'bonus_factor' => isset($r['bonus_factor']) ? (float)$r['bonus_factor'] : 0.5
                ];
            }
        }

        // Calculate theoretical points
        $unitForRating = [
            'health' => (float)$unit['health'],
            'models' => isset($unit['models']) ? (int)$unit['models'] : 1,
            'speed' => (float)$unit['speed'],
            'march_speed' => (float)$unit['march_speed'],
            'level' => (float)$unit['level'],
            'special_rules' => $special_rules,
            'weapons' => $weapons
        ];

        $components = compute_theoretical_points_components($unitForRating);

        respondJson([
            'id' => $unit_id,
            'name' => $unit['name'],
            'fixed_points' => (int)$unit['points'],
            'theoretical_points' => $components['theoreticalPoints'],
            'details' => $components
        ]);
    } else {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid action']);
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}

// Flush output buffer
ob_end_flush();
