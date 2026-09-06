-- Migration: Add Game Systems and extend Blocs table
-- Für Dust1947 Database

USE dust1947;

-- 1. Create game_systems table if it doesn't exist
CREATE TABLE IF NOT EXISTS game_systems (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    rules_version VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 2. Add description to blocs table if it doesn't exist
ALTER TABLE blocs
ADD COLUMN IF NOT EXISTS description TEXT AFTER name;

-- 3. Add game_system_id to blocs if it doesn't exist
ALTER TABLE blocs
ADD COLUMN IF NOT EXISTS game_system_id INT AFTER description;

-- 4. Add Foreign Key constraint from blocs to game_systems if it doesn't exist
SET @constraintExists = 0;
SELECT COUNT(*) INTO @constraintExists
FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
WHERE TABLE_NAME = 'blocs'
  AND COLUMN_NAME = 'game_system_id'
  AND REFERENCED_TABLE_NAME = 'game_systems';

-- Only add constraint if it doesn't exist
SET @sql = IF(@constraintExists = 0,
    'ALTER TABLE blocs ADD FOREIGN KEY (game_system_id) REFERENCES game_systems(id) ON DELETE SET NULL',
    'SELECT "Constraint already exists"'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 6. Insert default game systems if table is empty
INSERT IGNORE INTO game_systems (id, name, description, rules_version)
VALUES
    (1, 'Warhammer 40K - 10th Edition', 'Games Workshop Warhammer 40,000 10th Edition Regeln', '10.0'),
    (2, 'Kill Team', 'Games Workshop Kill Team Skirmish Rules', 'Latest'),
    (3, 'Necromunda', 'Games Workshop Necromunda Gang Warfare', 'Latest');

-- Display results
SELECT '=== GAME SYSTEMS ===' as info;
SELECT * FROM game_systems;

SELECT '=== BLOCKS TABLE STRUCTURE ===' as info;
DESCRIBE blocks;

SELECT '=== BLOCKS DATA ===' as info;
SELECT b.id, b.name, b.description, gs.name as game_system
FROM blocks b
LEFT JOIN game_systems gs ON b.game_system_id = gs.id
LIMIT 10;


