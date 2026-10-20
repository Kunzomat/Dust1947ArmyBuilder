<?php
// Standalone, no database or credentials needed: php backend/actions_admin.test.php
require_once __DIR__ . '/actions_admin.php';

function checkCatalogue($condition, $message)
{
    if (!$condition) throw new RuntimeException($message);
}
function rejectCatalogue($callback)
{
    try { $callback(); } catch (InvalidArgumentException $e) { return; }
    throw new RuntimeException('Expected validation failure');
}

$draft = ['name' => "  Psychic\t Veil  ", 'action_type_id' => 4,
    'description' => 'Exact full definition.', 'dice_count' => '', 'success_symbols' => '   ', 'sort_order' => -2];
$valid = validateActionCatalogueData($draft, false);
checkCatalogue($valid['name'] === 'Psychic Veil', 'Normalize name whitespace');
checkCatalogue($valid['dice_count'] === null && $valid['success_symbols'] === null, 'Preserve blank as NULL');
checkCatalogue($valid['sort_order'] === -2 && $valid['action_type_id'] === 4, 'Retain integer fields');
checkCatalogue(validateActionCatalogueData(array_merge($draft, ['dice_count' => 0]), false)['dice_count'] === 0, 'Do not coerce zero to NULL');
foreach ([
    ['name' => '  '], ['name' => []], ['name' => str_repeat('x', 256)],
    ['name' => "bad\0name"], ['description' => ''], ['description' => false],
    ['action_type_id' => 0], ['action_type_id' => '1oops'], ['action_type_id' => true],
    ['dice_count' => -1], ['dice_count' => 1.5], ['dice_count' => '1e2'],
    ['dice_count' => 4294967296], ['success_symbols' => []], ['sort_order' => '1.1'],
    ['sort_order' => 2147483648], ['sort_order' => null]
] as $override) {
    rejectCatalogue(fn() => validateActionCatalogueData(array_merge($draft, $override), false));
}
foreach (['Normal Action', " Normal\t Action "] as $name) {
    checkCatalogue(validateActionCatalogueData(['name' => $name, 'code' => 'normal_action'], true)
        === ['name' => 'Normal Action', 'code' => 'normal_action'], 'Type canonicalization');
}
foreach (['Normal', 'bad code', '', '_bad', str_repeat('a', 65), null, []] as $code) {
    rejectCatalogue(fn() => validateActionCatalogueData(['name' => 'Type', 'code' => $code], true));
}
foreach ([null, [], true, 0, -1, '1x', '1.0', 4294967296] as $id) {
    rejectCatalogue(fn() => actionCatalogueInt($id, 'id'));
}

// Exercise dispatcher errors before any DB access. Any unexpected DB access
// fails this test, rather than ever connecting to a real database.
function respondJson($data, $statusCode = 200)
{
    http_response_code($statusCode);
    $GLOBALS['catalogueResponse'] = $data;
}
foreach (['actions', 'action_types'] as $resource) {
    foreach (['list' => 'POST', 'get' => 'POST', 'create' => 'GET',
        'update' => 'PUT', 'clone' => 'GET', 'delete' => 'POST'] as $operation => $method) {
        handleActionCatalogue(null, "$resource.$operation", $method);
        checkCatalogue(http_response_code() === 405, 'Wrong method must return 405');
    }
    handleActionCatalogue(null, "$resource.unknown", 'GET');
    checkCatalogue(http_response_code() === 404, 'Unknown operation must return 404');
    $_GET = ['id' => 'garbage'];
    handleActionCatalogue(null, "$resource.get", 'GET');
    checkCatalogue(http_response_code() === 400, 'Invalid id must return 400');
    handleActionCatalogue(null, "$resource.create", 'POST');
    checkCatalogue(http_response_code() === 400, 'Empty/non-JSON body must return 400');
}

// Small connection double verifies existence and FK-error mapping without SQL
// execution. Actual constraints/migration reruns remain Dust-Ops/Test checks.
class CatalogueTestResult
{
    private $row;
    function __construct($row) { $this->row = $row; }
    function fetch_assoc() { return $this->row; }
    function fetch_all($mode) { return $this->row ? [$this->row] : []; }
}
class CatalogueTestStatement
{
    private $db;
    private $sql;
    function __construct($db, $sql) { $this->db = $db; $this->sql = $sql; }
    function bind_param($types, &...$parameters) { $this->db->bindings = $parameters; }
    function execute()
    {
        if (str_starts_with($this->sql, 'DELETE') && $this->db->deleteError) {
            throw new mysqli_sql_exception('Simulated constraint', $this->db->deleteError);
        }
    }
    function get_result() { return new CatalogueTestResult($this->db->row); }
}
class CatalogueTestConnection
{
    public $row = null;
    public $bindings = [];
    public $deleteError = null;
    public $rolledBack = false;
    function begin_transaction() {}
    function commit() {}
    function rollback() { $this->rolledBack = true; }
    function prepare($sql) { return new CatalogueTestStatement($this, $sql); }
    function query($sql) { return new CatalogueTestResult($this->row); }
}
$db = new CatalogueTestConnection();
$_GET = ['id' => '123'];
foreach (['actions', 'action_types'] as $resource) {
    foreach (['get' => 'GET', 'delete' => 'DELETE'] as $operation => $method) {
        handleActionCatalogue($db, "$resource.$operation", $method);
        checkCatalogue(http_response_code() === 404, 'Missing row must return 404');
        checkCatalogue($db->bindings === [123], 'IDs must be bound integer parameters');
    }
}
$db->row = ['id' => 123, 'code' => 'normal_action', 'name' => 'Normal Action'];
handleActionCatalogue($db, 'action_types.get', 'GET');
checkCatalogue(http_response_code() === 200 && $GLOBALS['catalogueResponse'] === $db->row, 'Get returns row');
handleActionCatalogue($db, 'action_types.list', 'GET');
checkCatalogue(http_response_code() === 200 && count($GLOBALS['catalogueResponse']) === 1, 'List returns rows');
$db->deleteError = 1451;
handleActionCatalogue($db, 'action_types.delete', 'DELETE');
checkCatalogue(http_response_code() === 409 && $db->rolledBack, 'Referenced type must return 409 and roll back');
checkCatalogue(strpos($GLOBALS['catalogueResponse']['error'], 'referenced') !== false, 'Referenced error must be explicit');
$db->deleteError = null;
handleActionCatalogue($db, 'action_types.delete', 'DELETE');
checkCatalogue(http_response_code() === 200, 'Unreferenced delete succeeds');
echo "Action catalogue validation and dispatcher tests passed (no database access).\n";
