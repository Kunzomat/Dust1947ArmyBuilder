-- Apply before deploying code that reads units.is_unique.
-- Preserve exactly the old hero predicate: uppercase type = H, NOT HERO.
-- Backfill only when adding the column; reruns preserve subsequent edits.
USE dust1947;

SET @is_unique_exists := (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'units' AND COLUMN_NAME = 'is_unique'
);
SET @sql := IF(@is_unique_exists = 0,
  'ALTER TABLE units ADD COLUMN is_unique BOOLEAN NOT NULL DEFAULT 0 AFTER type',
  'SELECT "units.is_unique already exists"');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := IF(@is_unique_exists = 0,
  'UPDATE units SET is_unique = 1 WHERE BINARY UPPER(COALESCE(type, '''')) = BINARY ''H''',
  'SELECT "units.is_unique backfill skipped"');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
