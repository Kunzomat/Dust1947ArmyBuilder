-- Additive, rerunnable seed completing the central actions catalogue with every further Dust 1947 special action
-- (MySQL 8.4). Authoritative source: Dust1947_v1.1.pdf (page numbers in each description); actions that the PDF
-- does not define come from the old Dust Infinite Army Builder data (file and line in each description).
-- Die faces: Faction Symbol = star-in-circle (dice_block), Crosshair Symbol = dice_sight, Shield Symbol = dice_shield.
-- Existing rows (matched by name) are never modified; this script inserts missing actions and removes the
-- entries listed in the DELETE below (skills/modifiers, replaced ENGINEERING variants).
-- Which unit may use which action is deliberately not modelled here.
USE dust1947;
SET NAMES utf8mb4 COLLATE utf8mb4_general_ci;

DROP TEMPORARY TABLE IF EXISTS all_action_seed;
CREATE TEMPORARY TABLE all_action_seed (
    type_code VARCHAR(64) NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    dice_count INT UNSIGNED NULL,
    success_symbols VARCHAR(255) NULL,
    sort_order INT NOT NULL
) DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO all_action_seed (type_code, name, description, dice_count, success_symbols, sort_order) VALUES
('special_action', 'FOLLOW ME',
'A unit with the Follow Me skill can take a FOLLOW ME special action once per turn. All friendly infantry units with armor 1 or 2 within range 2 and in LOS roll a die. On the Faction Symbol they take an immediate MOVE action with a rating of 2. A hero within range 1 and LOS to, or controlling, scenery with this skill can use the Follow Me skill.\n\nSource: PDF p. 7 (FOLLOW ME); Operation Babylon terrain p. 10 (desert archeological pit).',
1, 'Faction Symbol', 9),
('special_action', 'MEDEVAC',
'A vehicle with the Medevac skill can perform a MEDEVAC special action. Select an infantry unit within range 1 and roll a die for each soldier eliminated from the unit. Each Faction Symbol returns 1 of the eliminated soldiers to the unit.\n\nSource: PDF p. 7 (MEDEVAC).',
1, 'Faction Symbol', 10),
('special_action', 'RESURRECTION',
'A hero equipped with a Blutkreuz may take a RESURRECTION special action. Select a mindless zombie unit within range 1. Roll a die for each zombie soldier eliminated from the unit. Each Faction Symbol returns one of the eliminated zombie soldiers to the unit.\n\nSource: PDF p. 7 (RESURRECTION, MINDLESS).',
1, 'Faction Symbol', 11),
('special_action', 'AIR ALERT',
'A vehicle with the Air Alert skill can take an AIR ALERT special action. Select an enemy aircraft within LOS and roll a die: on the Faction Symbol, any friendly vehicles performing an ATTACK or SUSTAINED ATTACK against that aircraft hit on rolls of the Crosshair Symbol and the Faction Symbol for the remainder of the turn.\n\nSource: PDF p. 6 (AIR ALERT).',
1, 'Faction Symbol', 12),
('special_action', 'AIR TRAFFIC CONTROL',
'A unit with the Air Traffic Control skill may take an AIR TRAFFIC CONTROL special action by selecting a friendly aircraft that has already activated this turn. Roll a die: on the Faction Symbol that aircraft ends its activation and immediately activates again. A unit may only be reactivated once per turn.\n\nSource: PDF p. 6 (AIR TRAFFIC CONTROL).',
1, 'Faction Symbol', 13),
('special_action', 'AMMO REPLENISH',
'An infantry unit within LOS and range 1 of scenery with the Ammo Replenish skill can execute an AMMO REPLENISH special action to replenish all limited ammo weapons. A vehicle unit within LOS and range 1 of the scenery with this skill can spend 2 actions to replenish all limited ammo weapons. No dice are rolled.\n\nSource: PDF p. 6 (AMMO REPLENISH).',
NULL, NULL, 14),
('special_action', 'CAMOUFLAGE',
'A unit with the Camouflage skill may take a CAMOUFLAGE special action. If it does, it cannot be attacked at range 3 or higher. This benefit ends if the camouflaged unit takes any action other than MOVE or NOTHING (artillery observers can use their skill to attack with an artillery unit as well). The unit starts the game camouflaged. This skill is not shared with any unit a hero joins. No dice are rolled.\n\nSource: PDF p. 6 (CAMOUFLAGE).',
NULL, NULL, 15),
('special_action', 'DOZER',
'A vehicle equipped with a dozer blade can perform a DOZER special action to dig in and gain cover from any angle until it performs a MOVE or MARCH MOVE action. No dice are rolled.\n\nSource: PDF p. 6 (DOZER BLADE).',
NULL, NULL, 16),
('special_action', 'EXECUTE',
'A unit with the Execute skill can take an EXECUTE special action to choose and eliminate a soldier that is part of a unit with a stunned token (including a hero) within range 1. No dice are rolled.\n\nSource: PDF p. 6 (EXECUTE).',
NULL, NULL, 17),
('psyker_special_action', 'PSYCHIC SCREAM',
'Once per game, a unit with the Psychic Scream skill may execute the PSYCHIC SCREAM free action to attack all units (friend or foe) within a range 3 radius. Ignores LOS, infantry saves, and cover saves.\n\nSource: PDF p. 7 (PSYCHIC SCREAM). Number of attack dice is defined by the unit/weapon profile and is not given in the rules text.',
NULL, NULL, 18),
('psyker_special_action', 'PSYCHIC VORTEX',
'Once per game, execute the PSYCHIC VORTEX free action to attack all units, friends or foes, within a range 2 radius. Ignores Line of Sight, Infantry and Cover Saves.\n\nSource: old Army Builder data/skills.json line 107 (not in the PDF). Number of attack dice is not given in the source.',
NULL, NULL, 19),
('special_action', 'LAUNCH SMOKE',
'Once per game, a vehicle with Smoke Launchers may take a free LAUNCH SMOKE special action to place a smoke screen on itself. This covers any 1 square occupied by the vehicle plus 3 adjacent squares that form a larger 2x2 square. The adjacent squares are chosen by the player using the smoke launcher and do not need to be in LOS of the vehicle. No dice are rolled.\n\nSource: PDF p. 7 (SMOKE LAUNCHERS). Old Army Builder (skills.json lines 124-125) additionally knows the same effect as "Smoke Grenades" for infantry.',
NULL, NULL, 20),
('special_action', 'SPY REVEALED!',
'A unit with the Spy skill that is not on the battlefield can execute a SPY REVEALED! activation. Roll 2 dice: if you score 1 Faction Symbol, the unit is immediately placed within range 1 of an enemy unit and it has 1 action for this activation. If you score 2 Faction Symbols, it is placed within range 1 of an enemy unit and has 2 actions for this activation. If you do not score any Faction Symbol, the unit is not placed on the battlefield and may only perform NOTHING actions this activation. It can try another SPY REVEALED! for its next activation.\n\nA unit that is not on the battlefield cannot be the target of command actions. A spy that has not entered the battlefield by the end of the game is considered destroyed. This skill is not shared with a unit joined.\n\nSource: PDF p. 7 (SPY).',
2, 'Faction Symbol', 21),
('special_action', 'RELOAD',
'A unit with reload or salvo weapons must be assigned a RELOAD special action to return the loaded token before the weapon may be fired again. A unit may perform an ATTACK and a RELOAD action during the same activation. No dice are rolled.\n\nSource: PDF p. 10 (RELOAD WEAPONS, SALVO WEAPONS); p. 6 (ARTILLERY OBSERVER).',
NULL, NULL, 22),
('special_action', 'SMOKESCREEN',
'An artillery weapon can fire smoke shells instead of explosives. The weapon does not attack; instead, roll a die: on the Faction Symbol or the Crosshair Symbol, choose a target point within the artillery weapon''s fire arc, range, and LOS and place a 2x2 smoke screen there; it fills the target point and the squares that make contact with the target point. It blocks LOS and provides cover until the end of the next turn. A smoke screen cannot be fired into a building or bunker.\n\nSource: PDF p. 10 (SMOKESCREEN).',
1, 'Faction Symbol, Crosshair Symbol', 23),
('special_action', 'ENGINEERING',
'A unit or vehicle that is able to do so (infantry units, engineer vehicles, and vehicles with cutting weapons, grapple weapons, a dozer blade or a crane) can be assigned an ENGINEERING special action. The effect depends on the target; unless stated otherwise, roll a die and succeed on the Faction Symbol.\n\nBarbed wire (infantry): clear a gap through an adjacent section of barbed wire. On the Faction Symbol, the unit clears a gap range 1 wide in the adjacent section of barbed wire and may continue its activation. On any other roll, it fails to clear a gap and ends its activation.\n\nBarbed wire (cutting or grapple weapons): an engineer vehicle equipped with these weapons can attempt to cut a gap through an adjacent barbed wire entanglement. Roll a die (vehicles with paired chainsaws or paired claws roll 2 dice): on the Faction Symbol, the vehicle clears a gap range 1 wide in the adjacent section of barbed wire.\n\nMinefield (infantry): attempt to clear a gap through an adjacent minefield. On the Faction Symbol, the unit clears a gap range 1 by 1 in the minefield; on any other roll, the unit is the target of an ATTACK action as if they had moved through the minefield, and receives a suppression token.\n\nMinefield (dozer blade): an engineer vehicle equipped with a dozer blade can attempt to clear a gap through an adjacent minefield. On the Faction Symbol, it clears a square gap range 2 by range 2 in the adjacent minefield. On any other roll, the vehicle fails to clear a gap in the adjacent minefield.\n\nBunker or strongpoint (dozer blade): an engineer vehicle equipped with a dozer blade can attempt to bury an adjacent bunker or strongpoint by taking 2 ENGINEERING special actions (one after the other) in the same activation. Roll a die: on the Faction Symbol, the vehicle buries the bunker or strongpoint and any units occupying it are eliminated.\n\nTrench (dozer blade): an engineer vehicle equipped with a dozer blade can attempt to fill in an adjacent trench. Roll a die: on the Faction Symbol, the vehicle fills the trench. Any units occupying the trench escape unharmed and are placed in a square adjacent to the filled trench.\n\nWreck (clearing): to push a wreck aside, assign the vehicle an ENGINEERING special action and roll a die: on the Faction Symbol, the wreck is removed from the play area. If the vehicle is equipped with a dozer blade or crane, it clears the wreck on a roll of the Crosshair Symbol or the Faction Symbol.\n\nSource: PDF p. 10 (BARBED WIRE, MINEFIELDS, ENGINEER VEHICLES: CUTTING AND GRAPPLE WEAPONS, DOZER BLADES; CUTTING WEAPONS; GRAPPLE WEAPONS), p. 9 (CLEARING), p. 6 (DOZER BLADE, ENGINEER VEHICLE).',
1, 'Faction Symbol', 24),
('special_action', 'RAID',
'The vehicle can spend all its actions to do a RAID special action. It can do MOVE + ATTACK + MOVE in this activation, but cannot be reactivated this turn.\n\nSource: old Army Builder data/skills.json line 111. The PDF (pp. 3-5) only mentions the raid special action without defining it.',
NULL, NULL, 32),
('special_action', 'AMMO SUPPLY',
'Once per game, perform an AMMO SUPPLY special action to re-supply all limited ammo weapons for friendly ground units on the battlefield.\n\nSource: old Army Builder data/skills.json line 15 (not in the PDF).',
NULL, NULL, 33),
('special_action', 'GET MOVING YOU MONSTER',
'A High Priest can use the GET MOVING YOU MONSTER special action on a Mythos Creature (at a distance with the Psychic Choir skill).\n\nSource: old Army Builder data/skills.json lines 70 and 105. Dice, success symbols, range and effect are not defined in any source.',
NULL, NULL, 34),
('special_action', 'CLOSE WOUNDS',
'A High Priest can use the CLOSE WOUNDS special action on a Mythos Creature (at a distance with the Psychic Choir skill).\n\nSource: old Army Builder data/skills.json lines 70 and 105. Dice, success symbols, range and effect are not defined in any source.',
NULL, NULL, 35),
('officer_special_action', 'SEEK, STRIKE, DESTROY',
'An officer performing a SEEK, STRIKE, DESTROY special action rolls a die. On a roll of the Faction Symbol or the Crosshair Symbol, they may place a Move Stimulants token on an M5-series Heavy Destroyer Walker (such as an M5A Bulldog) or an M10A2 or M10A3 Medium Tank in its platoon that does not already have one.\n\nSource: old Army Builder data/blocs.json line 343 (platoon advantage). Range is not defined in the source.',
1, 'Faction Symbol, Crosshair Symbol', 37),
('special_action', 'CLEAN MY OPTICS',
'Tito can perform a CLEAN MY OPTICS action on an adjacent vehicle. This vehicle rolls one extra die on all its weapons until the end of the turn. One use per turn only. Tito can perform it as a free action on the same vehicle while a squad he has joined performs MAKESHIFT REPAIR.\n\nSource: old Army Builder data/units.json lines 8795 and 9043.',
NULL, NULL, 38),
('special_action', 'JUICE IT UP!',
'Tito can perform a JUICE IT UP! action on an adjacent vehicle. Until the end of the turn, this vehicle uses its March value instead of its Move value. One use per turn only. Tito can perform it as a free action on the same vehicle while a squad he has joined performs MAKESHIFT REPAIR.\n\nSource: old Army Builder data/units.json lines 8799 and 9043.',
NULL, NULL, 39),
('special_action', 'BOTTOMS UP',
'Once per game at the start of his activation, Marek can issue a BOTTOMS UP special free action: all Desert Scorpions Kill Squads, Heavy Kill Squads and Heavy Engineer Squads in or in support of this platoon (and heroes joined) gain the Expert skill with their ranged weapons until the end of the turn.\n\nSource: old Army Builder data/blocs.json line 685 (platoon advantage).',
NULL, NULL, 40);

-- Skills/modifiers and artificial ENGINEERING variants that earlier versions of this seed created as actions.
-- The catalogue has no link tables to actions, so no assignments are affected.
DELETE FROM actions WHERE name IN (
    'MECHANIC CREW', 'ADDIE''S CALL',
    'ENGINEERING: CLEAR BARBED WIRE (INFANTRY)',
    'ENGINEERING: CLEAR MINEFIELD (INFANTRY)',
    'ENGINEERING: CUT BARBED WIRE (ENGINEER VEHICLE)',
    'ENGINEERING: BURY BUNKER OR STRONGPOINT (DOZER BLADE)',
    'ENGINEERING: FILL TRENCH (DOZER BLADE)',
    'ENGINEERING: CLEAR MINEFIELD (DOZER BLADE)',
    'ENGINEERING: CLEAR WRECK'
);

INSERT INTO actions (action_type_id, name, description, dice_count, success_symbols, sort_order)
SELECT t.id, s.name, s.description, s.dice_count, s.success_symbols, s.sort_order
FROM all_action_seed s
JOIN action_types t ON t.code = s.type_code
WHERE NOT EXISTS (
    SELECT 1 FROM actions a
    WHERE REGEXP_REPLACE(TRIM(a.name), '[[:space:]]+', ' ') = s.name
);

DROP TEMPORARY TABLE all_action_seed;
