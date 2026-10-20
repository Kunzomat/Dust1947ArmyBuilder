<?php
// Isolated admin action catalogue. Included only after the existing API auth.
// Names are canonicalized on every write; CI unique indexes arbitrate races.
function actionCatalogueText($value, $field, $max, $collapse = false, $required = true)
{
    if (!is_string($value) || preg_match('//u', $value) !== 1) {
        throw new InvalidArgumentException("$field must be text");
    }
    $text = $collapse ? preg_replace('/\s+/u', ' ', $value) : $value;
    $text = preg_replace('/^\s+|\s+$/u', '', $text);
    $length = preg_match_all('/./us', $text);
    if (($required && $text === '') || $length > $max || strpos($text, "\0") !== false) {
        throw new InvalidArgumentException("$field is required and must not exceed $max characters");
    }
    return $text;
}

function actionCatalogueInt($value, $field, $min = 1, $max = 4294967295)
{
    if ((!is_int($value) && !is_string($value))
        || !preg_match('/^-?\d+$/D', (string)$value)
        || (float)$value < $min || (float)$value > $max) {
        throw new InvalidArgumentException("$field must be an integer between $min and $max");
    }
    return (int)$value;
}

function validateActionCatalogueData($data, $isType)
{
    $result = ['name' => actionCatalogueText($data['name'] ?? null, 'name', 255, true)];
    if ($isType) {
        $code = $data['code'] ?? null;
        if (!is_string($code) || !preg_match('/^[a-z][a-z0-9_]{0,63}$/D', $code)) {
            throw new InvalidArgumentException('code must use lowercase letters, digits and underscores (max 64)');
        }
        $result['code'] = $code;
    } else {
        $result['action_type_id'] = actionCatalogueInt($data['action_type_id'] ?? null, 'action_type_id');
        $result['description'] = actionCatalogueText($data['description'] ?? null, 'description', 16000);
        $dice = $data['dice_count'] ?? null;
        $result['dice_count'] = $dice === null || $dice === '' ? null
            : actionCatalogueInt($dice, 'dice_count', 0);
        $symbols = $data['success_symbols'] ?? null;
        $result['success_symbols'] = $symbols === null ? null
            : actionCatalogueText($symbols, 'success_symbols', 255, true, false);
        if ($result['success_symbols'] === '') $result['success_symbols'] = null;
        $result['sort_order'] = actionCatalogueInt(array_key_exists('sort_order', $data) ? $data['sort_order'] : 0,
            'sort_order', -2147483648, 2147483647);
    }
    return $result;
}

function actionCatalogueRow($conn, $table, $id, $lock = false)
{
    // $table is selected from a fixed whitelist by the dispatcher.
    $stmt = $conn->prepare("SELECT * FROM $table WHERE id = ?" . ($lock ? ' FOR UPDATE' : ''));
    $stmt->bind_param('i', $id);
    $stmt->execute();
    return $stmt->get_result()->fetch_assoc();
}

function handleActionCatalogue($conn, $action, $method)
{
    $inTransaction = false;
    try {
        [$table, $operation] = array_pad(explode('.', $action, 2), 2, '');
        $isType = $table === 'action_types';
        $methods = ['list' => 'GET', 'get' => 'GET', 'create' => 'POST',
            'update' => 'POST', 'clone' => 'POST', 'delete' => 'DELETE'];
        if (!isset($methods[$operation])) {
            respondJson(['error' => 'Unknown action catalogue endpoint'], 404);
            return;
        }
        if ($method !== $methods[$operation]) {
            header('Allow: ' . $methods[$operation]);
            respondJson(['error' => 'Method not allowed'], 405);
            return;
        }
        if ($operation === 'list') {
            $sql = $isType ? 'SELECT * FROM action_types ORDER BY name, id'
                : 'SELECT a.*, t.name AS action_type_name, t.code AS action_type_code
                   FROM actions a JOIN action_types t ON t.id = a.action_type_id
                   ORDER BY a.sort_order, a.name, a.id';
            respondJson($conn->query($sql)->fetch_all(MYSQLI_ASSOC));
            return;
        }
        $data = [];
        if ($method === 'POST') {
            $json = json_decode(file_get_contents('php://input'));
            if (!$json instanceof stdClass) {
                throw new InvalidArgumentException('Request body must be a JSON object');
            }
            $data = (array)$json;
        }
        $id = null;
        if (in_array($operation, ['get', 'delete', 'update', 'clone'], true)) {
            $id = actionCatalogueInt($method === 'POST' ? ($data['id'] ?? null) : ($_GET['id'] ?? null), 'id');
        }
        // Serialize clone/update with deletion of their source; never copy links.
        $conn->begin_transaction();
        $inTransaction = true;
        $source = $id === null ? null : actionCatalogueRow($conn, $table, $id, true);
        if ($id !== null && !$source) {
            $conn->rollback();
            $inTransaction = false;
            respondJson(['error' => $isType ? 'Action type not found' : 'Action not found'], 404);
            return;
        }
        if ($operation === 'get') {
            $conn->commit();
            $inTransaction = false;
            respondJson($source);
            return;
        }
        if ($operation === 'delete') {
            $stmt = $conn->prepare("DELETE FROM $table WHERE id = ?");
            $stmt->bind_param('i', $id);
            $stmt->execute(); // FK RESTRICT returns an explicit 409 below.
        } else {
            // Like Rules: clone submits the complete editable draft plus source id.
            $values = validateActionCatalogueData($data, $isType);
            if ($isType && $operation === 'update' && $values['code'] !== $source['code']) {
                throw new InvalidArgumentException('Action type code is stable and cannot be changed');
            }
            if (!$isType && !actionCatalogueRow($conn, 'action_types', $values['action_type_id'], true)) {
                throw new InvalidArgumentException('Selected action type does not exist');
            }
            // Compare normalized existing names too, in case data was imported
            // with repeated whitespace outside this API.
            $duplicate = $conn->prepare("SELECT id FROM $table
                WHERE REGEXP_REPLACE(TRIM(name), '[[:space:]]+', ' ') = ? AND id <> ?");
            $exclude = $operation === 'update' ? $id : 0;
            $duplicate->bind_param('si', $values['name'], $exclude);
            $duplicate->execute();
            if ($duplicate->get_result()->fetch_assoc()) {
                $conn->rollback();
                $inTransaction = false;
                respondJson(['error' => 'An entry with this name already exists'], 409);
                return;
            }
            if ($isType) {
                $stmt = $conn->prepare($operation === 'update'
                    ? 'UPDATE action_types SET code=?, name=? WHERE id=?'
                    : 'INSERT INTO action_types (code, name) VALUES (?, ?)');
                if ($operation === 'update') $stmt->bind_param('ssi', $values['code'], $values['name'], $id);
                else $stmt->bind_param('ss', $values['code'], $values['name']);
            } else {
                $stmt = $conn->prepare($operation === 'update'
                    ? 'UPDATE actions SET action_type_id=?, name=?, description=?, dice_count=?, success_symbols=?, sort_order=? WHERE id=?'
                    : 'INSERT INTO actions (action_type_id, name, description, dice_count, success_symbols, sort_order) VALUES (?, ?, ?, ?, ?, ?)');
                if ($operation === 'update') {
                    $stmt->bind_param('issisii', $values['action_type_id'], $values['name'], $values['description'],
                        $values['dice_count'], $values['success_symbols'], $values['sort_order'], $id);
                } else {
                    $stmt->bind_param('issisi', $values['action_type_id'], $values['name'], $values['description'],
                        $values['dice_count'], $values['success_symbols'], $values['sort_order']);
                }
            }
            $stmt->execute();
        }
        $resultId = in_array($operation, ['create', 'clone'], true) ? (int)$conn->insert_id : $id;
        $conn->commit();
        $inTransaction = false;
        respondJson(['id' => $resultId, 'message' => 'Saved'], in_array($operation, ['create', 'clone'], true) ? 201 : 200);
    } catch (InvalidArgumentException $e) {
        if ($inTransaction) $conn->rollback();
        respondJson(['error' => $e->getMessage()], 400);
    } catch (mysqli_sql_exception $e) {
        if ($inTransaction) $conn->rollback();
        $code = (int)$e->getCode();
        if ($code === 1062) respondJson(['error' => 'An entry with this name or code already exists'], 409);
        elseif ($code === 1451) respondJson(['error' => 'Action type is referenced by actions and cannot be deleted'], 409);
        elseif ($code === 1452) respondJson(['error' => 'Selected action type does not exist'], 400);
        else respondJson(['error' => 'Action catalogue database request failed'], 500);
    } catch (Throwable $e) {
        if ($inTransaction) $conn->rollback();
        respondJson(['error' => 'Action catalogue request failed'], 500);
    }
}
