-- Additive, rerunnable seed of the six standard Dust 1947 command actions (MySQL 8.4).
-- Source (authoritative): Dust1947_v1.1.pdf, page 8 (Command Actions), page 6 (Command Squad,
-- Command Vehicle), page 7 (Officer, General, Mechanic) and page 9 (Makeshift Repair vs. critical hits).
-- Die faces: Faction Symbol = star-in-circle (dice_block), Crosshair Symbol = dice_sight, Shield Symbol = dice_shield.
-- Existing rows are only corrected while they still hold the exact text of the first seed
-- (MD5 guard), so later administrator edits are never overwritten. Missing rows are inserted by name.
USE dust1947;
SET NAMES utf8mb4 COLLATE utf8mb4_general_ci;

DROP TEMPORARY TABLE IF EXISTS standard_action_seed;
CREATE TEMPORARY TABLE standard_action_seed (
    type_code VARCHAR(64) NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    dice_count INT UNSIGNED NULL,
    success_symbols VARCHAR(255) NULL,
    sort_order INT NOT NULL,
    old_hash CHAR(32) NULL
) DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO standard_action_seed (type_code, name, description, dice_count, success_symbols, sort_order, old_hash) VALUES
('officer_special_action', 'RALLY',
'An officer may take a RALLY special action to remove under fire, suppression, or stunned tokens from units. You can either select all units within LOS and range 2 of the officer, or if the officer has access to a radio operator or radio, they can select any 1 unit anywhere in the play area to rally.\n\nFor each unit rallied, roll 2 dice: if both dice roll the Faction Symbol, remove all tokens. If only one die rolls the Faction Symbol, and the unit has a suppression token, replace the suppression token with an under fire token; otherwise remove the under fire token from the unit.\n\nOfficer special actions can be used from inside a ground vehicle or an aircraft (not on the vehicle itself). A hero with the General skill may take a free OFFICER special action each time they activate and, if joined to a unit with an officer, rolls 2 dice when attempting OFFICER special actions. Officers in a command vehicle can re-roll failed COMMAND SQUAD special actions.',
2, 'Faction Symbol', 5, '08137a1d47caf312901253474b456359'),
('officer_special_action', 'GET MOVING YOU BUNCH OF MONKEYS',
'A unit with an officer may take a GET MOVING YOU BUNCH OF MONKEYS special action. Roll a die: on the Faction Symbol the player selects any ground unit that has already been activated this turn and is within LOS and range 2 of the officer. The command squad''s activation immediately ends, and the selected unit is reactivated.\n\nWith a successful use of this special action, you activate 2 units consecutively. A unit may only be reactivated once per turn.\n\nIf the officer has access to a radio operator or radio, they can reactivate any unit in the play area.\n\nOfficer special actions can be used from inside a ground vehicle or an aircraft (not on the vehicle itself). A hero with the General skill may take a free OFFICER special action each time they activate and, if joined to a unit with an officer, rolls 2 dice when attempting OFFICER special actions. Officers in a command vehicle can re-roll failed COMMAND SQUAD special actions.',
1, 'Faction Symbol', 6, NULL),
('officer_special_action', 'AMMO DROP',
'A unit with an officer may take an AMMO DROP special action. Roll a die: on the Faction Symbol or the Crosshair Symbol the player selects any ground unit that is within LOS and range 2 of the officer that has limited ammo weapons, and replenishes it back to a full supply of ammunition.\n\nIf the officer has access to a radio operator or radio, they can request an ammo drop for any ground unit in the play area.\n\nOfficer special actions can be used from inside a ground vehicle or an aircraft (not on the vehicle itself). A hero with the General skill may take a free OFFICER special action each time they activate and, if joined to a unit with an officer, rolls 2 dice when attempting OFFICER special actions. Officers in a command vehicle can re-roll failed COMMAND SQUAD special actions.',
1, 'Faction Symbol, Crosshair Symbol', 7, NULL),
('special_action', 'GET UP, IT AIN''T THAT BAD',
'A unit with a medic may take a GET UP, IT AIN''T THAT BAD action. Roll a die: on the Faction Symbol or the Crosshair Symbol select any infantry unit within LOS and range 1 of the medic. If the unit is a support weapon or hero, 1 point of damage is removed; otherwise, an eliminated miniature is returned to the unit. Unit may perform this skill on themselves.\n\nReturning an eliminated miniature does not change the amount of ammunition the unit has for any limited-ammo weapons.\n\nMedic special actions can be used from inside a ground vehicle (not on the vehicle itself), but not from inside an aircraft. A unit that can never be the target of command squad, officer, or medic special actions cannot be selected. Medics in a command vehicle can re-roll failed COMMAND SQUAD special actions.',
1, 'Faction Symbol, Crosshair Symbol', 3, '8e52a2f88108e3d1ceb8d922bf4d570c'),
('special_action', 'INJECT STIMULANTS',
'A unit with a medic may take an INJECT STIMULANTS action. Select any infantry unit within LOS and range 1 of the medic to receive a stimulants token. If a unit activates while it has a stimulants token, it removes the token and rolls a die. Depending on the roll, the unit:\n\nFaction Symbol: Choose either of the stimulant effects listed below.\nCrosshair Symbol: The unit treats an ATTACK action as a SUSTAINED ATTACK action.\nShield Symbol: The unit treats a MOVE action as a MARCH MOVE action.\n\nEither stimulant effect results in the unit taking 3 actions during the current activation (this can never cause a unit to take more than 3 actions in a single activation).\n\nMedic special actions can be used from inside a ground vehicle (not on the vehicle itself), but not from inside an aircraft. Medics in a command vehicle can re-roll failed COMMAND SQUAD special actions.',
1, 'Faction Symbol, Crosshair Symbol, Shield Symbol', 8, NULL),
('special_action', 'MAKESHIFT REPAIR',
'A unit with a mechanic may take a MAKESHIFT REPAIR action. Target a vehicle within LOS and range 1 of the mechanic and roll 5 dice. Each Faction Symbol returns 1 point of damage to the target vehicle.\n\nMechanics cannot be passengers or pilots and perform this action, and may not target themselves with the Mechanic skill. Mechanic special actions can be used from inside a ground vehicle (not on the vehicle itself), but not from inside an aircraft. Mechanics in a command vehicle can re-roll failed COMMAND SQUAD special actions.\n\nA MAKESHIFT REPAIR action that repairs all remaining damage, returning the vehicle to its full damage track, also clears any critical hits. Alternatively, this action can be used to remove the 1 critical hit without restoring the vehicle''s damage track.',
5, 'Faction Symbol', 4, 'c1074380e5c7d7136891669dc039fc94');

-- Correct only rows still in the first-seed state.
UPDATE actions a
JOIN standard_action_seed s ON s.name = a.name AND s.old_hash IS NOT NULL AND MD5(a.description) = s.old_hash
SET a.description = s.description, a.dice_count = s.dice_count, a.success_symbols = s.success_symbols;

INSERT INTO actions (action_type_id, name, description, dice_count, success_symbols, sort_order)
SELECT t.id, s.name, s.description, s.dice_count, s.success_symbols, s.sort_order
FROM standard_action_seed s
JOIN action_types t ON t.code = s.type_code
WHERE NOT EXISTS (
    SELECT 1 FROM actions a
    WHERE REGEXP_REPLACE(TRIM(a.name), '[[:space:]]+', ' ') = s.name
);

DROP TEMPORARY TABLE standard_action_seed;
