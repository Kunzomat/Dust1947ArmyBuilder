-- Dust 1947 Database Schema
-- Für lokale Entwicklungsumgebung

CREATE DATABASE IF NOT EXISTS dust1947
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE dust1947;

-- Game Systems
CREATE TABLE IF NOT EXISTS game_systems (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Blocs (Allianzen)
CREATE TABLE IF NOT EXISTS blocs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    image_url VARCHAR(255),
    sytem_id INT UNSIGNED NULL,
    FOREIGN KEY (sytem_id) REFERENCES game_systems(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Factions (innerhalb eines Blocs)
CREATE TABLE IF NOT EXISTS factions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    bloc_id INT NOT NULL,
    symbol_url VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (bloc_id) REFERENCES blocs(id) ON DELETE CASCADE
);

-- Rules (Spezialregeln)
CREATE TABLE IF NOT EXISTS rules (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    short_text TEXT,
    full_text TEXT,
    game_system_id INT UNSIGNED NULL,
    FOREIGN KEY (game_system_id) REFERENCES game_systems(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Units (Einheiten)
CREATE TABLE IF NOT EXISTS units (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    type VARCHAR(50),
    level VARCHAR(10),
    speed INT,
    march_speed INT,
    points INT NOT NULL DEFAULT 0,
    health INT,
    notes TEXT,
    image_url VARCHAR(255),
    faction_id INT NOT NULL,
    game_system_id INT UNSIGNED NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (faction_id) REFERENCES factions(id) ON DELETE CASCADE,
    FOREIGN KEY (game_system_id) REFERENCES game_systems(id) ON DELETE SET NULL
);

-- Unit Rules (Spezialregeln von Einheiten)
CREATE TABLE IF NOT EXISTS unit_rules (
    id INT AUTO_INCREMENT PRIMARY KEY,
    unit_id INT NOT NULL,
    unit_rule_id INT NOT NULL,
    note TEXT,
    FOREIGN KEY (unit_id) REFERENCES units(id) ON DELETE CASCADE,
    FOREIGN KEY (unit_rule_id) REFERENCES rules(id) ON DELETE CASCADE
);

-- Weapons (Waffen)
CREATE TABLE IF NOT EXISTS weapons (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    `range` VARCHAR(20),
    disposable BOOLEAN DEFAULT FALSE,
    game_system_id INT UNSIGNED NULL,
    FOREIGN KEY (game_system_id) REFERENCES game_systems(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Unit Weapons (Waffen einer Einheit)
CREATE TABLE IF NOT EXISTS unit_weapons (
    id INT AUTO_INCREMENT PRIMARY KEY,
    unit_id INT NOT NULL,
    weapon_id INT NOT NULL,
    number INT DEFAULT 1,
    firing_arc VARCHAR(50),
    FOREIGN KEY (unit_id) REFERENCES units(id) ON DELETE CASCADE,
    FOREIGN KEY (weapon_id) REFERENCES weapons(id) ON DELETE CASCADE
);

-- Weapon Stats (Angriffswerte)
CREATE TABLE IF NOT EXISTS weapon_stats (
    id INT AUTO_INCREMENT PRIMARY KEY,
    weapon_id INT NOT NULL,
    target_type VARCHAR(50),
    target_level VARCHAR(10),
    dice INT,
    damage INT,
    FOREIGN KEY (weapon_id) REFERENCES weapons(id) ON DELETE CASCADE
);

-- Weapon Rules (Spezialregeln von Waffen)
CREATE TABLE IF NOT EXISTS weapon_rules (
    id INT AUTO_INCREMENT PRIMARY KEY,
    weapon_id INT NOT NULL,
    rule_id INT NOT NULL,
    FOREIGN KEY (weapon_id) REFERENCES weapons(id) ON DELETE CASCADE,
    FOREIGN KEY (rule_id) REFERENCES rules(id) ON DELETE CASCADE
);

-- Platoons (Zug-Templates)
CREATE TABLE IF NOT EXISTS platoons (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    faction_id INT NOT NULL,
    rule_id INT NULL,
    game_system_id INT UNSIGNED NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (faction_id) REFERENCES factions(id) ON DELETE CASCADE,
    FOREIGN KEY (rule_id) REFERENCES rules(id) ON DELETE SET NULL,
    FOREIGN KEY (game_system_id) REFERENCES game_systems(id) ON DELETE SET NULL
);

-- Platoon Units (Slots in einem Platoon)
CREATE TABLE IF NOT EXISTS platoon_units (
    id INT AUTO_INCREMENT PRIMARY KEY,
    platoon_id INT NOT NULL,
    unit_id INT NOT NULL,
    slot VARCHAR(50),
    FOREIGN KEY (platoon_id) REFERENCES platoons(id) ON DELETE CASCADE,
    FOREIGN KEY (unit_id) REFERENCES units(id) ON DELETE CASCADE
);

-- Armies (Spieler-Armeen)
CREATE TABLE IF NOT EXISTS armies (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    bloc_id INT NOT NULL,
    points_limit INT DEFAULT 100,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (bloc_id) REFERENCES blocs(id) ON DELETE CASCADE
);

-- Army Platoons (Platoons in einer Armee)
CREATE TABLE IF NOT EXISTS army_platoons (
    id INT AUTO_INCREMENT PRIMARY KEY,
    army_id INT NOT NULL,
    platoon_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (army_id) REFERENCES armies(id) ON DELETE CASCADE,
    FOREIGN KEY (platoon_id) REFERENCES platoons(id) ON DELETE CASCADE
);

-- Army Units (Einheiten in einer Armee)
CREATE TABLE IF NOT EXISTS army_units (
    id INT AUTO_INCREMENT PRIMARY KEY,
    army_id INT NOT NULL,
    unit_id INT NOT NULL,
    quantity INT DEFAULT 1,
    army_platoon_id INT NULL,
    platoon_unit_id INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (army_id) REFERENCES armies(id) ON DELETE CASCADE,
    FOREIGN KEY (unit_id) REFERENCES units(id) ON DELETE CASCADE,
    FOREIGN KEY (army_platoon_id) REFERENCES army_platoons(id) ON DELETE CASCADE,
    FOREIGN KEY (platoon_unit_id) REFERENCES platoon_units(id) ON DELETE SET NULL
);

-- View für Army Points
CREATE OR REPLACE VIEW v_army_points AS
SELECT
    a.id AS army_id,
    a.name AS army_name,
    a.bloc_id,
    a.points_limit,
    COALESCE(SUM(u.points * au.quantity), 0) AS points_current
FROM armies a
LEFT JOIN army_units au ON au.army_id = a.id
LEFT JOIN units u ON u.id = au.unit_id
GROUP BY a.id;

