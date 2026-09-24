-- Migration: game system assignment for units, weapons, rules, and platoons
-- Ziel: Objekte koennen einem Game System zugeordnet werden,
--       NULL bedeutet global verfuegbar fuer alle Systeme.

USE dust1947;

-- 1) Ensure game_systems table exists
CREATE TABLE IF NOT EXISTS game_systems (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2) Add missing columns via information_schema checks
SET @db := DATABASE();

SET @col_exists := (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'blocs' AND COLUMN_NAME = 'sytem_id'
);
SET @sql := IF(@col_exists = 0,
  'ALTER TABLE blocs ADD COLUMN sytem_id INT NULL AFTER description',
  'SELECT "blocs.sytem_id already exists"');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col_exists := (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'units' AND COLUMN_NAME = 'game_system_id'
);
SET @sql := IF(@col_exists = 0,
  'ALTER TABLE units ADD COLUMN game_system_id INT NULL AFTER faction_id',
  'SELECT "units.game_system_id already exists"');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col_exists := (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'weapons' AND COLUMN_NAME = 'game_system_id'
);
SET @sql := IF(@col_exists = 0,
  'ALTER TABLE weapons ADD COLUMN game_system_id INT NULL AFTER disposable',
  'SELECT "weapons.game_system_id already exists"');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col_exists := (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'rules' AND COLUMN_NAME = 'game_system_id'
);
SET @sql := IF(@col_exists = 0,
  'ALTER TABLE rules ADD COLUMN game_system_id INT NULL AFTER full_text',
  'SELECT "rules.game_system_id already exists"');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col_exists := (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'platoons' AND COLUMN_NAME = 'game_system_id'
);
SET @sql := IF(@col_exists = 0,
  'ALTER TABLE platoons ADD COLUMN game_system_id INT NULL AFTER rule_id',
  'SELECT "platoons.game_system_id already exists"');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Make platoon rules optional for existing databases
SET @rule_nullable := (
  SELECT IS_NULLABLE
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'platoons' AND COLUMN_NAME = 'rule_id'
);
SET @sql := IF(@rule_nullable = 'NO',
  'ALTER TABLE platoons MODIFY COLUMN rule_id INT NULL',
  'SELECT "platoons.rule_id already nullable"');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @fk_exists := (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.REFERENTIAL_CONSTRAINTS rc
  JOIN INFORMATION_SCHEMA.KEY_COLUMN_USAGE kcu
    ON rc.CONSTRAINT_NAME = kcu.CONSTRAINT_NAME
   AND rc.CONSTRAINT_SCHEMA = kcu.TABLE_SCHEMA
  WHERE kcu.TABLE_SCHEMA = @db
    AND kcu.TABLE_NAME = 'platoons'
    AND kcu.COLUMN_NAME = 'rule_id'
    AND rc.DELETE_RULE = 'SET NULL'
);
SET @sql := IF(@fk_exists = 0,
  'ALTER TABLE platoons DROP FOREIGN KEY fk_platoons_rule',
  'SELECT "fk_platoons_rule already uses SET NULL"');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @fk_exists := (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
  WHERE TABLE_SCHEMA = @db
    AND TABLE_NAME = 'platoons'
    AND COLUMN_NAME = 'rule_id'
    AND REFERENCED_TABLE_NAME = 'rules'
);
SET @sql := IF(@fk_exists = 0,
  'ALTER TABLE platoons ADD CONSTRAINT fk_platoons_rule FOREIGN KEY (rule_id) REFERENCES rules(id) ON DELETE SET NULL',
  'SELECT "fk_platoons_rule already exists"');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 3) Add missing indexes for filters
SET @idx_exists := (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS
  WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'blocs' AND INDEX_NAME = 'idx_blocs_sytem_id'
);
SET @sql := IF(@idx_exists = 0,
  'ALTER TABLE blocs ADD INDEX idx_blocs_sytem_id (sytem_id)',
  'SELECT "idx_blocs_sytem_id already exists"');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @idx_exists := (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS
  WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'units' AND INDEX_NAME = 'idx_units_game_system_id'
);
SET @sql := IF(@idx_exists = 0,
  'ALTER TABLE units ADD INDEX idx_units_game_system_id (game_system_id)',
  'SELECT "idx_units_game_system_id already exists"');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @idx_exists := (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS
  WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'weapons' AND INDEX_NAME = 'idx_weapons_game_system_id'
);
SET @sql := IF(@idx_exists = 0,
  'ALTER TABLE weapons ADD INDEX idx_weapons_game_system_id (game_system_id)',
  'SELECT "idx_weapons_game_system_id already exists"');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @idx_exists := (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS
  WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'rules' AND INDEX_NAME = 'idx_rules_game_system_id'
);
SET @sql := IF(@idx_exists = 0,
  'ALTER TABLE rules ADD INDEX idx_rules_game_system_id (game_system_id)',
  'SELECT "idx_rules_game_system_id already exists"');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @idx_exists := (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS
  WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'platoons' AND INDEX_NAME = 'idx_platoons_game_system_id'
);
SET @sql := IF(@idx_exists = 0,
  'ALTER TABLE platoons ADD INDEX idx_platoons_game_system_id (game_system_id)',
  'SELECT "idx_platoons_game_system_id already exists"');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 4) Add foreign keys if missing

-- blocs.sytem_id -> game_systems.id
SET @fk_exists := (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
  WHERE TABLE_SCHEMA = @db
    AND TABLE_NAME = 'blocs'
    AND COLUMN_NAME = 'sytem_id'
    AND REFERENCED_TABLE_NAME = 'game_systems'
);
SET @sql := IF(
  @fk_exists = 0,
  'ALTER TABLE blocs ADD CONSTRAINT fk_blocs_game_system FOREIGN KEY (sytem_id) REFERENCES game_systems(id) ON DELETE SET NULL',
  'SELECT "fk_blocs_game_system already exists"'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Note:
-- For legacy installations with mixed signed/unsigned IDs, game_system_id
-- constraints on units/weapons/rules/platoons are intentionally not added
-- here to avoid migration failures on existing data.




