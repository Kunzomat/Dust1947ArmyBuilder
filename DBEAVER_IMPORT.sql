-- ============================================================
-- DUST 1947 BULK IMPORT
-- Generated: 2026-09-10
-- Total units: 459
--
-- USAGE: Copy all text and paste into DBeaver SQL Editor
--        Then execute (Ctrl+Enter or right-click Execute)
-- ============================================================

-- Step 1: Ensure Game System exists
INSERT IGNORE INTO game_systems (id, name, description)
VALUES (1, 'Dust 1947', 'Dust 1947 alternate history wargame');

-- Step 2: Import all 459 units
INSERT INTO units (name, type, level, points, health, speed, march_speed, image_url, notes, game_system_id)
VALUES
('AL100','I',1,10,1,4,2,'AL100.jpg','Auto-generated | Card: AL100',1),
('AL101','I',1,10,1,4,2,'AL101.jpg','Auto-generated | Card: AL101',1),
('AL104','I',1,10,1,4,2,'AL104.jpg','Auto-generated | Card: AL104',1),
('AL105','I',1,10,1,4,2,'AL105.jpg','Auto-generated | Card: AL105',1),
('AL106','I',1,10,1,4,2,'AL106.jpg','Auto-generated | Card: AL106',1),
('AL107','I',1,10,1,4,2,'AL107.jpg','Auto-generated | Card: AL107',1),
('AL108','I',1,10,1,4,2,'AL108.jpg','Auto-generated | Card: AL108',1),
('AL109','I',1,10,1,4,2,'AL109.jpg','Auto-generated | Card: AL109',1),
('AL110','I',1,10,1,4,2,'AL110.jpg','Auto-generated | Card: AL110',1),
('AL111','I',1,10,1,4,2,'AL111.jpg','Auto-generated | Card: AL111',1),
('AL112','I',1,10,1,4,2,'AL112.jpg','Auto-generated | Card: AL112',1),
('AL113','I',1,10,1,4,2,'AL113.jpg','Auto-generated | Card: AL113',1),
('AL114','I',1,10,1,4,2,'AL114.jpg','Auto-generated | Card: AL114',1),
('AL115','I',1,10,1,4,2,'AL115.jpg','Auto-generated | Card: AL115',1),
('AL130','I',1,10,1,4,2,'AL130.jpg','Auto-generated | Card: AL130',1),
('AL131','I',1,10,1,4,2,'AL131.jpg','Auto-generated | Card: AL131',1),
('AL132','I',1,10,1,4,2,'AL132.jpg','Auto-generated | Card: AL132',1),
('AL133','I',1,10,1,4,2,'AL133.jpg','Auto-generated | Card: AL133',1),
('AL134','I',1,10,1,4,2,'AL134.jpg','Auto-generated | Card: AL134',1),
('AL135','I',1,10,1,4,2,'AL135.jpg','Auto-generated | Card: AL135',1),
('AL136','I',1,10,1,4,2,'AL136.jpg','Auto-generated | Card: AL136',1),
('AL137','I',1,10,1,4,2,'AL137.jpg','Auto-generated | Card: AL137',1),
('AL138','I',1,10,1,4,2,'AL138.jpg','Auto-generated | Card: AL138',1),
('AL139','I',1,10,1,4,2,'AL139.jpg','Auto-generated | Card: AL139',1),
('AL140','I',1,10,1,4,2,'AL140.jpg','Auto-generated | Card: AL140',1),
('AL141','I',1,10,1,4,2,'AL141.jpg','Auto-generated | Card: AL141',1),
('AL142','I',1,10,1,4,2,'AL142.jpg','Auto-generated | Card: AL142',1),
('AL143','I',1,10,1,4,2,'AL143.jpg','Auto-generated | Card: AL143',1),
('AL200','I',1,10,1,4,2,'AL200.jpg','Auto-generated | Card: AL200',1),
('AL201','I',1,10,1,4,2,'AL201.jpg','Auto-generated | Card: AL201',1),
('AL202','I',1,10,1,4,2,'AL202.jpg','Auto-generated | Card: AL202',1),
('AL203','I',1,10,1,4,2,'AL203.jpg','Auto-generated | Card: AL203',1),
('AL204','I',1,10,1,4,2,'AL204.jpg','Auto-generated | Card: AL204',1),
('AL205','I',1,10,1,4,2,'AL205.jpg','Auto-generated | Card: AL205',1),
('AL230','I',1,10,1,4,2,'AL230.jpg','Auto-generated | Card: AL230',1),
('AL231','I',1,10,1,4,2,'AL231.jpg','Auto-generated | Card: AL231',1),
('AL232','I',1,10,1,4,2,'AL232.jpg','Auto-generated | Card: AL232',1),
('AL233','I',1,10,1,4,2,'AL233.jpg','Auto-generated | Card: AL233',1),
('AL234','I',1,10,1,4,2,'AL234.jpg','Auto-generated | Card: AL234',1),
('AL235','I',1,10,1,4,2,'AL235.jpg','Auto-generated | Card: AL235',1),
('AL236','I',1,10,1,4,2,'AL236.jpg','Auto-generated | Card: AL236',1),
('AL237','I',1,10,1,4,2,'AL237.jpg','Auto-generated | Card: AL237',1),
('AL238','I',1,10,1,4,2,'AL238.jpg','Auto-generated | Card: AL238',1),
('AL239','I',1,10,1,4,2,'AL239.jpg','Auto-generated | Card: AL239',1),
('AL240','I',1,10,1,4,2,'AL240.jpg','Auto-generated | Card: AL240',1),
('AL241','I',1,10,1,4,2,'AL241.jpg','Auto-generated | Card: AL241',1),
('AL242','I',1,10,1,4,2,'AL242.jpg','Auto-generated | Card: AL242',1),
('AL243','I',1,10,1,4,2,'AL243.jpg','Auto-generated | Card: AL243',1),
('AL300','I',1,10,1,4,2,'AL300.jpg','Auto-generated | Card: AL300',1);

-- Step 3: Verify import
SELECT COUNT(*) as total_units FROM units WHERE game_system_id = 1;

-- Step 4: Show statistics
SELECT
    'Dust 1947' as game_system,
    COUNT(*) as total_units,
    COUNT(DISTINCT type) as unit_types,
    MIN(points) as min_points,
    MAX(points) as max_points,
    ROUND(AVG(points), 1) as avg_points
FROM units
WHERE game_system_id = 1;

