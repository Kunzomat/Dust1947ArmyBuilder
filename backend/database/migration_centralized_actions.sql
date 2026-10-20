-- Additive, rerunnable centralized action catalogue (MySQL 8.4).
-- Existing rules and all other game data are deliberately untouched.
USE dust1947;
SET NAMES utf8mb4 COLLATE utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS action_types (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(64) NOT NULL,
    name VARCHAR(255) NOT NULL,
    UNIQUE KEY uq_action_types_code (code),
    UNIQUE KEY uq_action_types_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS actions (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    action_type_id INT UNSIGNED NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    dice_count INT UNSIGNED NULL,
    success_symbols VARCHAR(255) NULL,
    sort_order INT NOT NULL DEFAULT 0,
    UNIQUE KEY uq_actions_name (name),
    CONSTRAINT fk_actions_type FOREIGN KEY (action_type_id)
        REFERENCES action_types(id) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Never overwrite an administrator's edits on rerun. Match names as well as
-- stable codes so a pre-existing equivalent type cannot be seeded twice.
INSERT INTO action_types (code, name)
SELECT seed.code, seed.name FROM (
    SELECT 'normal_action' AS code, 'Normal Action' AS name
    UNION ALL SELECT 'special_action', 'Special Action'
    UNION ALL SELECT 'officer_special_action', 'Officer Special Action'
    UNION ALL SELECT 'psyker_special_action', 'Psyker Special Action'
) seed
WHERE NOT EXISTS (
    SELECT 1 FROM action_types t WHERE t.code = seed.code
    OR REGEXP_REPLACE(TRIM(t.name), '[[:space:]]+', ' ') = seed.name
);

-- Source: exact user-provided complete definitions, 2026-10-16.
-- No PSYKER MASTERY variants/modifiers and no unverified standard actions.
INSERT INTO actions (action_type_id, name, description, dice_count, success_symbols, sort_order)
SELECT t.id, seed.name, seed.description, 1, 'Faction Symbol', seed.sort_order
FROM (
    SELECT 'PSYCHIC VEIL' AS name,
    'A Unit with a Psyker may take a Psychic Veil Special Action. Roll one die. On a roll of the Faction Symbol, select one friendly Unit within Line of Sight and Range 2 of the Psyker. The target Unit gains the effects of Camouflage: it cannot be attacked at Range 3 or higher. This protection ends if the target Unit takes any Action other than a Move or Nothing Action.' AS description,
    0 AS sort_order
    UNION ALL SELECT 'PSYCHIC TELEPORTATION',
    'A Unit with a Psyker may take a Psychic Teleportation Special Action. Roll one die. On a roll of the Faction Symbol, select one friendly ground Unit within Line of Sight and Range 2 of the Psyker. Immediately place the selected Unit anywhere in the play area where it can legally be placed. The teleported Unit counts as Activated for this Turn.',
    1
    UNION ALL SELECT 'PSYCHIC EMPOWERMENT',
    'A Unit with a Psyker may take a Psychic Empowerment Special Action. Roll one die. On a roll of the Faction Symbol, select one friendly Unit within Range 2 and Line of Sight of the Psyker. During its next Sustained Attack Action with Ranged weapons, the target Unit Hits on rolls of its Faction Symbol as well as the Hit Symbol.',
    2
) seed
JOIN action_types t ON t.code = 'psyker_special_action'
WHERE NOT EXISTS (
    SELECT 1 FROM actions a
    WHERE REGEXP_REPLACE(TRIM(a.name), '[[:space:]]+', ' ') = seed.name
);
