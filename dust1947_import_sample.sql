-- Dust 1947 Unit Import SQL
-- Generated automatically from dust1947_import_data.json
-- Total units: 459

-- Ensure Game System exists
INSERT IGNORE INTO game_systems (id, name, description)
VALUES (1, 'Dust 1947', 'Dust 1947 alternate history wargame');

-- Disable foreign key checks temporarily
SET FOREIGN_KEY_CHECKS = 0;

-- Import units
INSERT INTO units (name, type, level, points, health, speed, march_speed, image_url, notes, game_system_id)
VALUES
('Unit AL100', 'I', 1, 10, 1, 4, 2, 'AL100.jpg', 'Auto-generated - requires manual data entry | Card: AL100', 1),
('Unit AL101', 'I', 1, 10, 1, 4, 2, 'AL101.jpg', 'Auto-generated - requires manual data entry | Card: AL101', 1),
('Unit AL104', 'I', 1, 10, 1, 4, 2, 'AL104.jpg', 'Auto-generated - requires manual data entry | Card: AL104', 1),
('Unit AL105', 'I', 1, 10, 1, 4, 2, 'AL105.jpg', 'Auto-generated - requires manual data entry | Card: AL105', 1),
('Unit AL106', 'I', 1, 10, 1, 4, 2, 'AL106.jpg', 'Auto-generated - requires manual data entry | Card: AL106', 1),
('Unit AL107', 'I', 1, 10, 1, 4, 2, 'AL107.jpg', 'Auto-generated - requires manual data entry | Card: AL107', 1),
('Unit AL108', 'I', 1, 10, 1, 4, 2, 'AL108.jpg', 'Auto-generated - requires manual data entry | Card: AL108', 1),
('Unit AL109', 'I', 1, 10, 1, 4, 2, 'AL109.jpg', 'Auto-generated - requires manual data entry | Card: AL109', 1),
('Unit AL110', 'I', 1, 10, 1, 4, 2, 'AL110.jpg', 'Auto-generated - requires manual data entry | Card: AL110', 1),
('Unit AL111', 'I', 1, 10, 1, 4, 2, 'AL111.jpg', 'Auto-generated - requires manual data entry | Card: AL111', 1);

-- Re-enable foreign key checks
SET FOREIGN_KEY_CHECKS = 1;

-- Verify import
SELECT COUNT(*) as total_units FROM units WHERE game_system_id = 1;

