<?php
/**
 * Guard for development-only helper scripts (query-api.php, debug_weapons.php,
 * test_api.php, migrate.php, execute-migration.php, run-migration.php,
 * import_from_sql.php, check-db-tables.php, unit_points.php, ...).
 *
 * These scripts expose raw SQL execution, schema dumps, or other
 * unauthenticated debug functionality that must never be reachable on a
 * deployed/production server. They stay available for local development.
 *
 * Uses the same convention already used by db_connection.php/auth.php to
 * distinguish local dev from production: config.local.php is present
 * locally (git-ignored) and absent in the deployed environment.
 *
 * Usage: require this file as the very first line of any dev-only script.
 */

if (!file_exists(__DIR__ . '/config.local.php')) {
    http_response_code(403);
    header('Content-Type: application/json; charset=UTF-8');
    echo json_encode([
        'error' => 'This development tool is disabled in this environment.'
    ]);
    exit;
}
