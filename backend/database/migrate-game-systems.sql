-- Game Systems & Blocs Migration für Dust1947
-- Führe dieses Script in der MySQL/MariaDB aus

-- 1. Erstelle game_systems Tabelle falls nicht vorhanden
CREATE TABLE IF NOT EXISTS game_systems (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    rules_version VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 2. Füge description Spalte zu blocs hinzu
ALTER TABLE blocs ADD COLUMN IF NOT EXISTS description TEXT AFTER name;

-- 3. Füge game_system_id Spalte zu blocs hinzu
ALTER TABLE blocs ADD COLUMN IF NOT EXISTS game_system_id INT AFTER description;

-- 4. Füge Foreign Key Constraint hinzu
ALTER TABLE blocs ADD FOREIGN KEY (game_system_id) REFERENCES game_systems(id) ON DELETE SET NULL;

-- 5. Füge Standard Game Systems ein
INSERT IGNORE INTO game_systems (id, name, description, rules_version) VALUES
    (1, 'Warhammer 40K - 10th Edition', 'Games Workshop Warhammer 40,000 10th Edition Regeln', '10.0'),
    (2, 'Kill Team', 'Games Workshop Kill Team Skirmish Rules', 'Latest'),
    (3, 'Necromunda', 'Games Workshop Necromunda Gang Warfare', 'Latest');

-- Verification
SELECT '=== GAME SYSTEMS ===' AS info;
SELECT * FROM game_systems;

SELECT '=== BLOCS TABLE STRUCTURE ===' AS info;
DESCRIBE blocs;

SELECT '=== SAMPLE DATA ===' AS info;
SELECT b.id, b.name, b.description, gs.name as game_system
FROM blocs b
LEFT JOIN game_systems gs ON b.game_system_id = gs.id
LIMIT 10;

