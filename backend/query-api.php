<?php
// Einfacher Query-Endpoint für direkte DB-Zugriffe
// WICHTIG: Nur für lokale Entwicklung! Nicht in Produktion!

require_once __DIR__ . '/dev_tools_guard.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once 'db_connection.php';

try {
    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        $input = json_decode(file_get_contents('php://input'), true);
        $query = $input['query'] ?? null;

        if (!$query) {
            http_response_code(400);
            echo json_encode(['error' => 'Keine Query bereitgestellt']);
            exit;
        }

        // Sicherheit: Nur SELECT erlauben (oder mit Passwort alle Queries)
        $allowedMethods = ['SELECT', 'INSERT', 'UPDATE', 'DELETE'];
        $isAllowed = false;
        foreach ($allowedMethods as $method) {
            if (stripos(trim($query), $method) === 0) {
                $isAllowed = true;
                break;
            }
        }

        if (!$isAllowed) {
            http_response_code(403);
            echo json_encode(['error' => 'Query-Typ nicht erlaubt']);
            exit;
        }

        $result = $conn->query($query);

        if ($result === false) {
            http_response_code(400);
            echo json_encode(['error' => $conn->error]);
            exit;
        }

        // Für SELECT: Ergebnisse als Array
        if (stripos(trim($query), 'SELECT') === 0) {
            $rows = $result->fetch_all(MYSQLI_ASSOC);
            echo json_encode(['success' => true, 'rows' => $rows, 'count' => count($rows)]);
        } else {
            // Für INSERT/UPDATE/DELETE
            echo json_encode([
                'success' => true,
                'affected_rows' => $conn->affected_rows,
                'insert_id' => $conn->insert_id
            ]);
        }

    } else {
        http_response_code(400);
        echo json_encode(['error' => 'Nur POST erlaubt']);
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
?>

