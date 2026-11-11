-- Widen weapon_stats.dice / weapon_stats.damage from VARCHAR(2) to VARCHAR(16).
-- Reason: dice notation such as "***" (3 chars) failed with
-- "Data too long for column 'dice'" when saving weapon stats.
-- Widening VARCHAR keeps all existing values unchanged (no truncation/rewrite).
-- Idempotent: only alters when the current length is below 16.
-- Take a backup before applying (Dust-Ops).
USE dust1947;

SET @dice_len := (
  SELECT CHARACTER_MAXIMUM_LENGTH
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'weapon_stats' AND COLUMN_NAME = 'dice'
);
SET @damage_len := (
  SELECT CHARACTER_MAXIMUM_LENGTH
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'weapon_stats' AND COLUMN_NAME = 'damage'
);

SET @sql := IF(@dice_len IS NOT NULL AND @dice_len < 16,
  'ALTER TABLE weapon_stats MODIFY COLUMN dice VARCHAR(16) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL',
  'SELECT "weapon_stats.dice already wide enough"');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := IF(@damage_len IS NOT NULL AND @damage_len < 16,
  'ALTER TABLE weapon_stats MODIFY COLUMN damage VARCHAR(16) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL',
  'SELECT "weapon_stats.damage already wide enough"');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
