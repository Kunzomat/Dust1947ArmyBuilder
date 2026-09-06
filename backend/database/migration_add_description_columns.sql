-- Migration: Add description columns to game_system/faction tables
-- Compatible with singular and plural table names used in this project

USE dust1947;

-- game_system (singular)
SET @has_game_system = (
    SELECT COUNT(*)
    FROM information_schema.tables
    WHERE table_schema = DATABASE()
      AND table_name = 'game_system'
);
SET @sql = IF(
    @has_game_system > 0,
    'ALTER TABLE game_system ADD COLUMN IF NOT EXISTS description TEXT AFTER name',
    'SELECT "Table game_system not found, skipping"'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- game_systems (plural)
SET @has_game_systems = (
    SELECT COUNT(*)
    FROM information_schema.tables
    WHERE table_schema = DATABASE()
      AND table_name = 'game_systems'
);
SET @sql = IF(
    @has_game_systems > 0,
    'ALTER TABLE game_systems ADD COLUMN IF NOT EXISTS description TEXT AFTER name',
    'SELECT "Table game_systems not found, skipping"'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- faction (singular)
SET @has_faction = (
    SELECT COUNT(*)
    FROM information_schema.tables
    WHERE table_schema = DATABASE()
      AND table_name = 'faction'
);
SET @sql = IF(
    @has_faction > 0,
    'ALTER TABLE faction ADD COLUMN IF NOT EXISTS description TEXT AFTER name',
    'SELECT "Table faction not found, skipping"'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- factions (plural)
SET @has_factions = (
    SELECT COUNT(*)
    FROM information_schema.tables
    WHERE table_schema = DATABASE()
      AND table_name = 'factions'
);
SET @sql = IF(
    @has_factions > 0,
    'ALTER TABLE factions ADD COLUMN IF NOT EXISTS description TEXT AFTER name',
    'SELECT "Table factions not found, skipping"'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

