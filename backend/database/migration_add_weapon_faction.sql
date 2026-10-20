-- Add optional direct faction ownership to weapons without changing existing records.
USE dust1947;

SET @db := DATABASE();

SET @column_exists := (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'weapons' AND COLUMN_NAME = 'faction_id'
);
SET @sql := IF(
  @column_exists = 0,
  'ALTER TABLE weapons ADD COLUMN faction_id INT NULL AFTER game_system_id',
  'SELECT "weapons.faction_id already exists"'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @index_exists := (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.STATISTICS
  WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'weapons' AND INDEX_NAME = 'idx_weapons_faction_id'
);
SET @sql := IF(
  @index_exists = 0,
  'ALTER TABLE weapons ADD INDEX idx_weapons_faction_id (faction_id)',
  'SELECT "idx_weapons_faction_id already exists"'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @foreign_key_exists := (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
  WHERE TABLE_SCHEMA = @db
    AND TABLE_NAME = 'weapons'
    AND COLUMN_NAME = 'faction_id'
    AND REFERENCED_TABLE_NAME = 'factions'
);
SET @sql := IF(
  @foreign_key_exists = 0,
  'ALTER TABLE weapons ADD CONSTRAINT fk_weapons_faction FOREIGN KEY (faction_id) REFERENCES factions(id) ON DELETE SET NULL',
  'SELECT "fk_weapons_faction already exists"'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
