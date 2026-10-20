<?php
// Standalone regression tests: no database, config, credentials or writes.
// php backend/army_validation.test.php
require_once __DIR__ . '/army_validation.php';

$checks = 0;
function checkArmy($condition, $message) {
    global $checks;
    $checks++;
    if (!$condition) throw new RuntimeException($message);
}
function armyTestUnit($overrides = []) {
    return array_merge([
        'army_unit_id' => 1, 'unit_id' => 500, 'unit_name' => 'Unit',
        'faction_id' => 1, 'bloc_id' => 1, 'type' => 'I', 'unit_points' => 10,
        'quantity' => 1, 'rule_names' => ['ARMOR 2'],
    ], $overrides);
}
function armyTestResult($units) {
    return dust1947_validate_army_composition(['id' => 1, 'bloc_id' => 1, 'points_limit' => 100], $units, [], []);
}
function armyTestRules($units) {
    return array_column(armyTestResult($units)['violations'], 'rule');
}

foreach (['H', 'HERO', 'I', 'V', 'A'] as $type) {
    foreach ([true, 1, '1', false, 0, '0', null] as $flag) {
        $unit = armyTestUnit(['type' => $type, 'is_unique' => $flag]);
        $expected = in_array($flag, [true, 1, '1'], true);
        foreach ([
            [$unit, array_merge($unit, ['army_unit_id' => 2])],
            [array_merge($unit, ['quantity' => '2'])],
        ] as $units) {
            checkArmy(in_array(15, armyTestRules($units), true) === $expected, "Rule 15: $type / " . var_export($flag, true));
        }
        checkArmy(!in_array(15, armyTestRules([$unit]), true), 'A single unique unit is allowed');
    }
}
$hero = armyTestUnit(['type' => 'H']);
$copies = [$hero, array_merge($hero, ['army_unit_id' => 2])];
checkArmy(armyTestResult($copies)['isValid'], 'Missing flag means generic hero duplicates allowed');
checkArmy(!in_array(15, armyTestRules([
    array_merge($hero, ['is_unique' => true]),
    array_merge($hero, ['army_unit_id' => 2, 'unit_id' => 501, 'is_unique' => true]),
]), true), 'Same display name with distinct unit identities is allowed');

$infantry = armyTestUnit(['army_unit_id' => 10, 'unit_id' => 10]);
$heroes = array_map(static fn($unit) => array_merge($unit, [
    'is_unique' => false, 'attached_to_army_unit_id' => 10,
]), $copies);
$rules = armyTestRules(array_merge([$infantry], $heroes));
checkArmy(in_array(17, $rules, true) && !in_array(15, $rules, true), 'Generic heroes still obey attachment maximum');
$siblings = array_map(static fn($unit) => array_merge($unit, ['rule_names' => ['ARMOR 2', 'SIBLINGS']]), $heroes);
checkArmy(armyTestResult(array_merge([$infantry], $siblings))['isValid'], 'Siblings exception is unchanged');
$uniqueSiblings = array_map(static fn($unit) => array_merge($unit, ['is_unique' => true]), $siblings);
$rules = armyTestRules(array_merge([$infantry], $uniqueSiblings));
checkArmy(in_array(15, $rules, true) && !in_array(17, $rules, true), 'Siblings does not override uniqueness');
$longType = array_map(static fn($unit) => array_merge($unit, ['type' => 'HERO']), $heroes);
checkArmy(!in_array(17, armyTestRules(array_merge([$infantry], $longType)), true), 'Do not broaden legacy hero predicate');

echo "Army validation: $checks checks passed.\n";
