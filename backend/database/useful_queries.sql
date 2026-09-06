-- ===================================
-- Nützliche SQL-Abfragen für Dust1947
-- ===================================

-- 1. Übersicht aller Einheiten mit Fraktion
SELECT
    u.id,
    u.name AS unit_name,
    f.name AS faction_name,
    b.name AS bloc_name,
    u.type,
    u.points,
    u.health
FROM units u
JOIN factions f ON u.faction_id = f.id
JOIN blocs b ON f.bloc_id = b.id
ORDER BY b.name, f.name, u.points;

-- 2. Alle Waffen einer Einheit
SELECT
    u.name AS unit_name,
    w.name AS weapon_name,
    uw.number AS weapon_count,
    uw.firing_arc,
    ws.target_type,
    ws.dice,
    ws.damage
FROM units u
JOIN unit_weapons uw ON u.id = uw.unit_id
JOIN weapons w ON uw.weapon_id = w.id
LEFT JOIN weapon_stats ws ON w.id = ws.weapon_id
WHERE u.id = 1  -- Unit ID anpassen
ORDER BY w.name, ws.target_type;

-- 3. Alle Armeen mit Punktestand
SELECT
    a.id,
    a.name AS army_name,
    b.name AS bloc_name,
    a.points_limit,
    COALESCE(SUM(u.points * au.quantity), 0) AS points_used,
    a.points_limit - COALESCE(SUM(u.points * au.quantity), 0) AS points_remaining
FROM armies a
JOIN blocs b ON a.bloc_id = b.id
LEFT JOIN army_units au ON a.id = au.army_id
LEFT JOIN units u ON au.unit_id = u.id
GROUP BY a.id
ORDER BY a.name;

-- 4. Einheiten in einer bestimmten Armee
SELECT
    u.name AS unit_name,
    u.type,
    u.points,
    au.quantity,
    (u.points * au.quantity) AS total_points
FROM army_units au
JOIN units u ON au.unit_id = u.id
WHERE au.army_id = 1  -- Army ID anpassen
ORDER BY u.type, u.name;

-- 5. Alle Spezialregeln einer Einheit
SELECT
    u.name AS unit_name,
    r.name AS rule_name,
    r.short_text
FROM units u
JOIN unit_rules ur ON u.id = ur.unit_id
JOIN rules r ON ur.unit_rule_id = r.id
WHERE u.id = 1  -- Unit ID anpassen
ORDER BY r.name;

-- 6. Statistik: Anzahl Einheiten pro Fraktion
SELECT
    f.name AS faction_name,
    b.name AS bloc_name,
    COUNT(u.id) AS unit_count,
    AVG(u.points) AS avg_points
FROM factions f
JOIN blocs b ON f.bloc_id = b.id
LEFT JOIN units u ON f.id = u.faction_id
GROUP BY f.id
ORDER BY b.name, f.name;

-- 7. Teuerste Einheiten
SELECT
    u.name,
    f.name AS faction_name,
    u.type,
    u.points
FROM units u
JOIN factions f ON u.faction_id = f.id
ORDER BY u.points DESC
LIMIT 10;

-- 8. Waffen mit den meisten Schadenswürfeln
SELECT
    w.name AS weapon_name,
    ws.target_type,
    ws.dice,
    ws.damage,
    (ws.dice * ws.damage) AS max_damage
FROM weapons w
JOIN weapon_stats ws ON w.id = ws.weapon_id
ORDER BY max_damage DESC
LIMIT 10;

-- 9. Alle Platoons einer Fraktion
SELECT
    p.name AS platoon_name,
    f.name AS faction_name,
    COUNT(pu.id) AS unit_slots
FROM platoons p
JOIN factions f ON p.faction_id = f.id
LEFT JOIN platoon_units pu ON p.id = pu.platoon_id
GROUP BY p.id
ORDER BY f.name, p.name;

-- 10. Datenbankstatistik
SELECT
    'Blocs' AS tabelle, COUNT(*) AS anzahl FROM blocs
UNION ALL
SELECT 'Factions', COUNT(*) FROM factions
UNION ALL
SELECT 'Units', COUNT(*) FROM units
UNION ALL
SELECT 'Weapons', COUNT(*) FROM weapons
UNION ALL
SELECT 'Rules', COUNT(*) FROM rules
UNION ALL
SELECT 'Armies', COUNT(*) FROM armies;

