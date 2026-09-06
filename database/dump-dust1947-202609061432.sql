-- MySQL dump 10.13  Distrib 8.0.19, for Win64 (x86_64)
--
-- Host: localhost    Database: dust1947
-- ------------------------------------------------------
-- Server version	8.4.11

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `armies`
--

DROP TABLE IF EXISTS `armies`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `armies` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `bloc_id` int unsigned NOT NULL,
  `points_limit` int unsigned NOT NULL DEFAULT '100',
  PRIMARY KEY (`id`),
  KEY `idx_armies_faction` (`bloc_id`),
  CONSTRAINT `fk_armies_faction` FOREIGN KEY (`bloc_id`) REFERENCES `blocs` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `armies`
--

LOCK TABLES `armies` WRITE;
/*!40000 ALTER TABLE `armies` DISABLE KEYS */;
INSERT INTO `armies` VALUES (7,'ooooooooooooo',1,102),(10,'test',1,100);
/*!40000 ALTER TABLE `armies` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `army_platoons`
--

DROP TABLE IF EXISTS `army_platoons`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `army_platoons` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `army_id` int unsigned NOT NULL,
  `platoon_id` int unsigned NOT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_armies_platoons_army` (`army_id`),
  KEY `fk_armies_platoons_platoon` (`platoon_id`),
  CONSTRAINT `fk_armies_platoons_army` FOREIGN KEY (`army_id`) REFERENCES `armies` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_armies_platoons_platoon` FOREIGN KEY (`platoon_id`) REFERENCES `platoons` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=18 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `army_platoons`
--

LOCK TABLES `army_platoons` WRITE;
/*!40000 ALTER TABLE `army_platoons` DISABLE KEYS */;
INSERT INTO `army_platoons` VALUES (17,7,2);
/*!40000 ALTER TABLE `army_platoons` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `army_units`
--

DROP TABLE IF EXISTS `army_units`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `army_units` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `army_id` int unsigned NOT NULL,
  `platoon_unit_id` int unsigned DEFAULT NULL,
  `unit_id` int unsigned NOT NULL,
  `quantity` int NOT NULL DEFAULT '1',
  `army_platoon_id` int unsigned DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_army_units_army` (`army_id`),
  KEY `idx_army_units_platoon` (`platoon_unit_id`),
  KEY `idx_army_units_unit` (`unit_id`),
  KEY `fk_army_units_army_platoon` (`army_platoon_id`),
  CONSTRAINT `fk_armies_units_army` FOREIGN KEY (`army_id`) REFERENCES `armies` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_armies_units_unit` FOREIGN KEY (`unit_id`) REFERENCES `units` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_army_units_army_platoon` FOREIGN KEY (`army_platoon_id`) REFERENCES `army_platoons` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=176 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `army_units`
--

LOCK TABLES `army_units` WRITE;
/*!40000 ALTER TABLE `army_units` DISABLE KEYS */;
INSERT INTO `army_units` VALUES (166,7,NULL,1,1,NULL),(167,7,NULL,2,1,NULL),(168,7,NULL,11,1,NULL),(170,7,NULL,5,1,NULL),(171,7,NULL,6,1,NULL),(172,7,NULL,5,1,NULL),(173,7,NULL,6,1,NULL),(174,7,NULL,20,1,NULL),(175,10,NULL,214,1,NULL);
/*!40000 ALTER TABLE `army_units` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `blocs`
--

DROP TABLE IF EXISTS `blocs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `blocs` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `description` text COLLATE utf8mb4_general_ci,
  `sytem_id` int unsigned NOT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_blocs_system` (`sytem_id`),
  CONSTRAINT `blocs_ibfk_1` FOREIGN KEY (`sytem_id`) REFERENCES `game_systems` (`id`),
  CONSTRAINT `fk_blocs_system` FOREIGN KEY (`sytem_id`) REFERENCES `game_system` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `blocs`
--

LOCK TABLES `blocs` WRITE;
/*!40000 ALTER TABLE `blocs` DISABLE KEYS */;
INSERT INTO `blocs` VALUES (1,'Imperium',NULL,2),(2,'Aeldari',NULL,2),(3,'Free Sector Forces',NULL,2),(4,'Star Wars Republik',NULL,1),(5,'Konföderation unabhängiger Systeme','Test',3);
/*!40000 ALTER TABLE `blocs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `factions`
--

DROP TABLE IF EXISTS `factions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `factions` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `bloc_id` int unsigned NOT NULL,
  `name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `description` text COLLATE utf8mb4_general_ci,
  `symbol_url` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_factions_bloc` (`bloc_id`),
  CONSTRAINT `fk_factions_bloc` FOREIGN KEY (`bloc_id`) REFERENCES `blocs` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `factions`
--

LOCK TABLES `factions` WRITE;
/*!40000 ALTER TABLE `factions` DISABLE KEYS */;
INSERT INTO `factions` VALUES (1,1,'Space Marines',NULL,'http://kunzomat.de/dust1947/backend/images/spacemarine.png'),(2,2,'Aeldari',NULL,'http://kunzomat.de/dust1947/backend/images/aeldari.png'),(3,1,'Steel Legion',NULL,'http://kunzomat.de/dust1947/backend/images/steellegion.png'),(4,3,'Free Sector Forces\r\n','test','');
/*!40000 ALTER TABLE `factions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `game_system`
--

DROP TABLE IF EXISTS `game_system`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `game_system` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `description` text COLLATE utf8mb4_general_ci,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `game_system`
--

LOCK TABLES `game_system` WRITE;
/*!40000 ALTER TABLE `game_system` DISABLE KEYS */;
INSERT INTO `game_system` VALUES (1,'Dust 1947',NULL),(2,'Warhammer 40k',NULL),(3,'Star Wars',NULL),(4,'Dune','Test');
/*!40000 ALTER TABLE `game_system` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `game_systems`
--

DROP TABLE IF EXISTS `game_systems`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `game_systems` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `description` text,
  `rules_version` varchar(50) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `game_systems`
--

LOCK TABLES `game_systems` WRITE;
/*!40000 ALTER TABLE `game_systems` DISABLE KEYS */;
INSERT INTO `game_systems` VALUES (1,'Warhammer 40K - 10th Edition','Games Workshop Warhammer 40,000 10th Edition Regeln','10.0','2026-09-03 13:00:34','2026-09-03 13:00:34'),(2,'Kill Team','Games Workshop Kill Team Skirmish Rules','Latest','2026-09-03 13:00:34','2026-09-03 13:00:34'),(3,'Necromunda','Games Workshop Necromunda Gang Warfare','Latest','2026-09-03 13:00:34','2026-09-03 13:00:34');
/*!40000 ALTER TABLE `game_systems` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `platoon_units`
--

DROP TABLE IF EXISTS `platoon_units`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `platoon_units` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `platoon_id` int unsigned NOT NULL,
  `slot` enum('COMMAND_1','COMBAT_1','COMBAT_2','COMBAT_3','COMBAT_4','COMBAT_5','COMBAT_6') CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `unit_id` int unsigned NOT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_platoon_units_platoon` (`platoon_id`),
  KEY `fk_platoon_units_units` (`unit_id`),
  CONSTRAINT `fk_platoon_units_platoon` FOREIGN KEY (`platoon_id`) REFERENCES `platoons` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_platoon_units_units` FOREIGN KEY (`unit_id`) REFERENCES `units` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=27 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `platoon_units`
--

LOCK TABLES `platoon_units` WRITE;
/*!40000 ALTER TABLE `platoon_units` DISABLE KEYS */;
INSERT INTO `platoon_units` VALUES (1,1,'COMMAND_1',1),(2,1,'COMBAT_1',5),(3,1,'COMBAT_2',5),(4,1,'COMBAT_3',6),(5,1,'COMBAT_4',6),(6,2,'COMMAND_1',201),(7,2,'COMBAT_1',203),(8,2,'COMBAT_2',203),(9,2,'COMBAT_3',203),(10,2,'COMBAT_4',202),(11,2,'COMBAT_5',202),(12,2,'COMBAT_6',202),(13,3,'COMMAND_1',100),(14,3,'COMMAND_1',101),(15,3,'COMBAT_1',103),(18,3,'COMBAT_2',103),(21,3,'COMBAT_3',103),(22,3,'COMBAT_3',104),(23,3,'COMBAT_3',105),(24,3,'COMBAT_4',103),(25,3,'COMBAT_4',104),(26,3,'COMBAT_4',105);
/*!40000 ALTER TABLE `platoon_units` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `platoons`
--

DROP TABLE IF EXISTS `platoons`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `platoons` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `rule_id` int unsigned NOT NULL,
  `faction_id` int unsigned NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_platoons_army_name` (`name`),
  KEY `fk_platoons_faction` (`faction_id`),
  KEY `fk_platoons_rule` (`rule_id`),
  CONSTRAINT `fk_platoons_faction` FOREIGN KEY (`faction_id`) REFERENCES `factions` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_platoons_rule` FOREIGN KEY (`rule_id`) REFERENCES `rules` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `platoons`
--

LOCK TABLES `platoons` WRITE;
/*!40000 ALTER TABLE `platoons` DISABLE KEYS */;
INSERT INTO `platoons` VALUES (1,'Tactical Platoon',1,1),(2,'Infantry Platoon',1,3),(3,'Guardian Platoon',1,2);
/*!40000 ALTER TABLE `platoons` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `rules`
--

DROP TABLE IF EXISTS `rules`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `rules` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `full_text` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci,
  `short_text` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2147483733 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `rules`
--

LOCK TABLES `rules` WRITE;
/*!40000 ALTER TABLE `rules` DISABLE KEYS */;
INSERT INTO `rules` VALUES (1,'ARMOR 3','Diese Einheit ignoriert x Schaden von Angriffen.','Reduziert Schaden','2025-11-15 23:24:04'),(2,'FAST','Diese Einheit darf sich zus??tzliche Felder bewegen.','Zus??tzliche Bewegung','2025-11-15 23:24:04'),(3,'AIR TRAFFIC CONTROL','This unit may take an AIR TRAFFIC CONTROL special action by selecting a friendly aircraft that has already activated this turn. Roll a die, on that aircraft ends their activation and immediately activates again. A unit may only be reactivated once per turn.','Re-activate aircraft','1817-06-30 09:07:50'),(4,'AMMO REPLENISH','An infantry unit within LOS and range 1 of scenery with this skill can execute an AMMO REPLENISH special action to replenish all limited ammo weapons. A vehicle unit within LOS and range 1 of the scenery with this skill can spend 2 actions to replenish all limited ammo weapons.','Replenish ammo','1817-06-30 09:07:40'),(5,'AMPHIBIOUS','This vehicle can enter and move through water and swamp as if it were open terrain.','Move through water/swamp','1817-06-30 09:07:40'),(6,'AND STAY DOWN','Any unit hit by this unit???s ranged weapons automatically gains a suppression token if it does not already have one. This skill is not shared with any unit a hero joins.','Apply suppression on hit','1817-06-30 09:07:42'),(7,'ARTILLERY OBSERVER','When this performs an ATTACK or SUSTAINED ATTACK action, they may use the artillery weapons of a friendly unit that has not yet activated, rather than their own weapons. The artillery unit immediately activates and performs an ATTACK, SUSTAINED ATTACK, or fires smoke (whichever the artillery observer is performing) with its artillery weapons.','Use friendly artillery','1817-06-30 09:07:42'),(8,'ASSAULT SHIELD','An assault shield is equipment that gives access to the skill of the same name, carried by the unit leader, who protects the rest of the unit squad with it. You can elect to assign the leader hits during a CC attack. If the assault shield roll fails, the leader and the assault shield is lost.','Unit leader protection','1817-06-30 09:07:47'),(9,'ASSAULT VEHICLE','Passengers in this vehicle (or aircraft) can disembark from it even if the vehicle (or aircraft) has already activated in the current turn.','Disembark anytime','1817-06-30 09:07:42'),(10,'ASSASSIN','This hero chooses which enemy soldiers are assigned hits when performing an ATTACK action with CC weapons. However, the assassin cannot target the unit leader unless it is a hero or the last remaining soldier in the target unit. This skill is not shared with any unit a hero joins.','Control hit assignment','1817-06-30 09:07:43'),(11,'AT THE DOUBLE','This unit (and any unit it has joined or hero that has joined it) may perform a free MOVE action immediately after performing a MARCH MOVE action.','Free move after march','1817-06-30 09:07:41'),(12,'BERSERK','When this hero scores a hit with a CC weapon, roll another die scoring a further hit on . Continue scoring hits and rolling an additional die for each hit until it rolls a miss. This skill is not shared with any unit a hero joins.','Chain hits on CC attack','1817-06-30 09:07:43'),(13,'BLACK OPS','If your force has a hero with this skill, roll 4 dice for initiative rolls.','Extra initiative dice','1817-06-30 04:47:45'),(14,'BLUTKREUZ','All Mindless Zombie units within range 1 of this hero at the start of their Activation increase their MOVE to 3 or their MARCH MOVE to 4, and gain the Charge skill. This skill is not shared with any unit a hero joins.','Buff nearby zombies','1817-06-30 04:47:32'),(15,'BRAVE','This unit rolls 3 dice instead of 2 when rolling to remove under fire or suppression tokens.','Extra dice to remove suppression','1817-06-30 04:47:47'),(16,'CAMOUFLAGE','This unit may take a CAMOUFLAGE special action. If it does, it cannot be attacked at range 3 or higher. This benefit ends if the camouflaged unit takes any action other than MOVE or NOTHING (artillery observers can use their skill to attack with an artillery unit as well). The unit starts the game camouflaged. This skill is not shared with any unit a hero joins.','Camouflage action','1817-06-30 04:47:38'),(17,'CHARGE','This unit (and any unit it has joined or hero that has joined it) may perform a free attack action using CC weapons immediately after performing a MARCH MOVE action.','Free CC attack after march','1817-06-30 04:47:41'),(18,'CHEAT DEATH','If this hero is eliminated, roll a die after resolving the attack that eliminated it. On or , the hero removes 1 point of damage and survives, but gains a stunned token. A hero can only cheat death once per game. A stunned unit cannot fight, including fighting back if attacked in CC. Any time a stunned unit activates, it must perform a NOTHING action as its first action, then remove any stunned tokens. If a stunned unit attempts a reactive attack, it rolls 1 die rather than 2 to see if it can make a reactive attack.','Survive lethal hit once','1817-06-30 04:47:43'),(19,'COMMAND SQUAD','May perform special actions with its officer, medic, or mechanic to reactivate, rally, heal, repair, or rearm units.','Special squad actions','1817-06-30 04:47:41'),(20,'COMMAND VEHICLE','This vehicle provides any command squad mounted in it with an additional radio operator. In addition, officers, mechanics, and medics mounted in the command vehicle can re-roll failed COMMAND SQUAD special actions.','Extra operator & reroll','1817-06-30 04:47:27'),(21,'COMMISSAR','Individual commissars must join an infantry unit with the same armor value at the start of the game, becoming part of the unit for the rest of the game. When a unit from a specific faction is joined by a commissar, that commissar is always considered as belonging to that faction. A unit with a commissar rolls 3 dice instead of 2 when rolling to remove under fire or suppression. There cannot be more than 1 commissar in a unit. Commissars must have the same armor rating as the unit they join. If a unit is returned to the game for any reason, any commissar joined to the unit returns with them. Commissar Poon: This SSU character is both a hero and a commissar and must join a unit, but no other hero or commissar can join the same unit. Unlike other heroes he can be returned to the game if he is destroyed (as non-hero commissars sometimes can through special rules like reserves or platoon advantages).','Join infantry, boost suppression roll','1817-06-30 04:47:41'),(22,'DAMAGE RESILIENT','When this infantry, vehicle, or hero unit is the target of an attack that rolls successful hits, first roll for any saves, then determine the final damage. Roll 1 die for each point of damage, negating 1 point for each. The unit takes any remaining damage. This skill is not shared with any unit a hero or unit joins.','Reduce damage from hits','1817-06-30 04:47:34'),(23,'DEFENSIVE TACTICS','This unit (and any unit it has joined or hero that has joined it) gains the Damage Resilient skill when in cover (even against weapons that negate cover and CC attacks).','Gain Damage Resilient in cover','0000-00-00 00:00:00'),(24,'DESERT FOX','Any unit reactivated by a unit with this skill using Get Moving You Monkeys gains the At The Double skill for that activation.','Grant At The Double when reactivated','0000-00-00 00:00:00'),(25,'DEVOUR','Each time this unit inflicts 1 point of damage in close combat, it heals 1 health. This unit can???t have more health than the maximum on its unit card. Since close combat is simultaneous (except against First Strike), this unit can heal itself while taking damage.','Heal 1 HP per CC damage','0000-00-00 00:00:00'),(26,'DOZER BLADE','A vehicle equipped with a dozer blade can perform a DOZER special action to dig in and gain cover from any angle until it performs a MOVE or MARCH MOVE action. A vehicle with a dozer blade can also perform ENGINEERING special actions.','Dig in & gain cover, perform ENGINEERING actions','0000-00-00 00:00:00'),(27,'ENGINEER VEHICLE','This vehicle has special equipment that allows it to perform specific ENGINEERING special actions.','Perform ENGINEERING actions','0000-00-00 00:00:00'),(28,'EXECUTE','This unit can take an EXECUTE special action to choose and eliminate a soldier that is part of a unit with a stunned token (including a hero) within range 1.','Execute stunned soldier within range','0000-00-00 00:00:00'),(29,'EXPERT','A hero with this skill hits on as well as when making an ATTACK or SUSTAINED ATTACK action with the specified weapon. If a vehicle is equipped with the weapons mentioned, the skill applies. This skill is not shared with any unit a hero joins.','Hit more reliably with specific weapon','0000-00-00 00:00:00'),(30,'FIGHTING SPIRIT','Once per game, this unit (and any unit it has joined or hero that has joined it) hits on as well as SUSTAINED ATTACK action.','Boost attack once per game','0000-00-00 00:00:00'),(31,'FLAME BURST','When making an ATTACK, this shoots a fireball of intense heat, attacking all ground units in 1 target square. Units hit by these weapons gain a suppression token (removing an under fire token if the unit had one) and do not receive an infantry or cover save.','Fireball damages ground units & applies suppression','0000-00-00 00:00:00'),(32,'FIRST STRIKE','This unit resolves all their CC attacks and applies the results (including removing eliminated miniatures) before the enemy units make their CC attacks. First strike takes effect regardless of whether the unit initiated the attack or is retaliating. This unit does not share this skill with any unit they join nor with heroes that join this unit. If a unit with this skill attacks another unit with this skill, both resolve their attacks simultaneously, before any other units perform their attacks.','Resolve CC attacks first','0000-00-00 00:00:00'),(33,'FLYING','This unit can pass over any unit, and over any terrain as if it were open terrain, provided that it ends its MOVE or MARCH MOVE action in a place it could normally occupy. Only a flying unit can join a flying unit.','Pass over units/terrain, only flying units can join','0000-00-00 00:00:00'),(34,'FOLLOW ME','This unit can take a FOLLOW ME special action once per turn. All friendly infantry units with armor 1 or 2 within range 2 and in LOS roll a die. On a success they take an immediate MOVE action with a rating of 2.','Force nearby infantry to move immediately','0000-00-00 00:00:00'),(35,'GENERAL','This hero may take a free OFFICER special action each time they activate and, if joined to a unit with an officer, roll 2 dice when attempting OFFICER special actions.','Free OFFICER action per activation','0000-00-00 00:00:00'),(36,'GORILLA','Only a gorilla hero may join a gorilla unit. Gorilla heroes cannot join units that are not gorillas.','Only gorilla heroes can join gorilla units','0000-00-00 00:00:00'),(37,'GRAPPLE','This weapon is a grapple weapon.','Grapple weapon','0000-00-00 00:00:00'),(38,'HALF-TRACKED MOVE','MOVE and MARCH MOVE actions by this unit are affected by the type of terrain being crossed as indicated in the terrain table.','Movement affected by terrain','0000-00-00 00:00:00'),(39,'HELICOPTER','A helicopter can hover and therefore does not have to take a MOVE action as its first action allowing it to be assigned SUSTAINED ATTACK actions.','Hover & perform SUSTAINED ATTACKs','0000-00-00 00:00:00'),(40,'INFANTRY ACE','This hero rolls a die when it activates: on a success this hero (and any unit it has joined or hero that has joined it) gains a third action for this activation.','Gain third action on die roll','0000-00-00 00:00:00'),(41,'INTERROGATE','If a unit with this skill (or a unit joined) uses a CC weapon to eliminate a hero or officer, or execute a hero or officer, roll 4 dice for initiative at the start of each turn for the rest of the game.','Roll initiative after killing hero/officer','0000-00-00 00:00:00'),(42,'JAMMER','All successful dice rolls for actions performed by an enemy unit using a radio within range 6 of a unit equipped with a jammer are re-rolled. Enemies in command vehicles must re-roll successful dice rolls for each attempt to perform an action using a radio. Jammer also affects ATTACK actions and SUSTAINED ATTACK actions triggered by artillery observers, causing them to re-roll successful dice rolls.','Force enemies to re-roll dice within range 6','0000-00-00 00:00:00'),(43,'KILLING SPREE','When this hero scores a hit with a ranged weapon, roll another die scoring a further hit on success. Continue scoring hits and rolling an additional die for each hit until it rolls a miss. If the hero has a special rule that allows it to hit on a specific number, rolls of that number only count as a hit for the first roll. This skill is not shared with any unit a hero joins.','Chain extra hits until miss','1817-06-29 13:35:29'),(44,'LARGE ORDNANCE','When this weapon is assigned an ATTACK or SUSTAINED ATTACK action, choose a target point within the weapon???s fire arc, range, and LOS. The explosion includes the square of the target point plus 3 chosen adjacent squares that form a 2x2 larger square. The adjacent squares do not need to be in range or LOS of the weapon.','Affects target + 3 adjacent squares','1817-06-29 13:35:30'),(45,'LASER WEAPONS','When a laser weapon makes a SUSTAINED ATTACK, re-roll misses on the initial roll. Additional rolls gained through the Laser Weapons special rule are not re-rolled.','Re-roll misses on sustained attack','1817-06-29 13:35:39'),(46,'LESSER MYTHOS CREATURES','This unit can never be the target of any command squad, officer, or medic special actions.','Immune to command actions','1817-06-29 13:35:46'),(47,'LONER','This hero may not join a unit.','Cannot join a unit','1817-06-29 13:35:30'),(48,'LUCKY','Once per game, this hero may re-roll any dice that failed to hit with any of their weapons when making an ATTACK or SUSTAINED ATTACK action. This hero does not share this skill with any unit they join. You do not need to declare the use of this skill prior to the original roll.','One-time re-roll of failed attacks','1817-06-29 13:35:27'),(49,'MAKESHIFT REPAIR','A vehicle unit within LOS and range 1 of scenery with this skill can spend 2 actions to perform a MAKESHIFT REPAIR on itself only.','Repair self within range 1 of scenery','1817-06-29 13:35:21'),(50,'MECHANIC','This unit may be assigned a MAKESHIFT REPAIR special action. It may not perform this action while it is a passenger or pilot and may not target itself with the Mechanic skill.','Perform MAKESHIFT REPAIR, with restrictions','1817-06-29 13:35:23'),(51,'MEDEVAC','This vehicle can perform a MEDEVAC special action. If it does, select an infantry unit within range 1 and roll a die for each soldier eliminated from the unit. Each returns 1 of the eliminated soldiers to the unit.','Return eliminated infantry within range 1','1817-06-29 13:35:43'),(52,'MERCENARY','This unit can be fielded by any bloc.','Fieldable by any bloc','1817-06-29 13:35:14'),(53,'MINDLESS','These are zombies that can be led by a hero equipped with the Blutkreuz skill. Mindless zombies cannot take or hold objectives but may contest them (applies to units joined) and are immune to suppression (both of these rules apply to units joined). Mindless Zombies can be joined by a zombie hero or a hero equipped with a Blutkreuz.','Zombies, immune to suppression, contest objectives','1817-06-29 10:23:28'),(54,'MOVE AND FIRE','This unit (and any unit it has joined or hero that has joined it) may either perform a free MOVE action immediately before or after performing a SUSTAINED ATTACK action using ranged weapons, or a free ATTACK action using ranged weapons immediately before or after taking a MARCH MOVE action.','Move and attack freely around action','1817-06-29 10:23:25'),(55,'MYTHOS CREATURE','Immune to suppression and critical hits.','Immune to suppression and critical hits','1817-06-29 10:23:19'),(56,'NAVAL UNIT','This unit treats water as open terrain, but cannot enter any other type of terrain. A naval unit may take a free ATTACK action immediately after it performs a MARCH MOVE action. An eliminated naval unit becomes water terrain.','Water is open terrain, can attack after march','1817-06-29 10:23:33'),(57,'NOTHIN???S EASY','Any unit joined by this hero cannot gain under fire or suppression tokens.','Joined units ignore suppression','1817-06-29 10:23:37'),(58,'OFFICER','This hero may perform OFFICER special actions.','Can perform OFFICER actions','1817-06-29 10:23:40'),(59,'PASSENGERS','This vehicle can transport infantry units. # is the number of passenger spaces available inside the vehicle.','Transport infantry units','1817-06-29 10:22:24'),(60,'PILOT','A vehicle with this attribute can only be piloted by the named hero. The vehicle can still be fielded without a pilot. This vehicle is unique, so only one may be included in any player???s force.','Vehicle requires specific pilot','1817-06-29 10:22:17'),(61,'PSYCHIC SCREAM','Once per game, this unit may execute the PSYCHIC SCREAM free action to attack all units (friend or foe) within a range 3 radius. Ignores LOS, infantry saves, and cover saves.','Area attack ignoring LOS and saves','1817-06-29 10:23:40'),(62,'RADIATION','Targets must re-roll successful saves against this weapon.','Forces re-rolls of saves','1817-06-29 10:23:28'),(63,'RED BANNER','All friendly infantry units within range 2 and with LOS to this unit roll 3 dice when rallying.','Boosts friendly infantry rally rolls','1817-06-29 08:19:35'),(64,'RESURRECTION','A hero equipped with a Blutkreuz may take a RESURRECTION special action. Select a mindless zombie unit within range 1. Roll a die for each zombie soldier eliminated from the unit. Each returns one of the eliminated soldiers to the unit.','Revive zombies within range 1','1817-06-29 08:19:16'),(65,'SAVAGE ANIMAL','This unit hits on SCOUT as well as specified with the weapon. If this unit (and any unit it has joined or hero that has joined it) performs a MARCH MOVE action during its first action of the game, it gains a third action for this activation.','Hits on SCOUT and gains extra action after march','1817-06-29 08:19:32'),(66,'SEALIFTER','These are naval units that are equipped to carry units into battle.','Naval units can transport others','1817-06-29 08:19:22'),(67,'SMALL VEHICLES','Small vehicles always receive cover. When in cover, they do not gain an improved save. They determine and affect LOS as if they were infantry units, but do block LOS for other small vehicles.','Small vehicles treated as infantry for LOS','1817-06-29 08:19:30'),(68,'SMOKE LAUNCHERS','Once per game, this vehicle may take a free LAUNCH SMOKE special action to place a smoke screen on itself. This covers any 1 square occupied by the vehicle plus 3 adjacent squares that form a larger 2x2 square. The adjacent squares are chosen by the player using the smoke launcher and do not need to be in LOS of the vehicle.','Deploy smoke screen around vehicle','1817-06-29 08:19:10'),(69,'SPY','A unit with this skill can choose to: Enter or be deployed on the battlefield like any other unit. Stay off the battlefield for as long as desired. If it does so, the unit only does NOTHING actions, can pass, and counts towards the number of units in play. Execute a SPY REVEALED! activation, if the unit is not already on the battlefield. Roll 2 dice: If you score 1, the unit is immediately placed within range 1 of an enemy unit and it has 1 action for this activation. If you score 2, the unit is immediately placed within range 1 of an enemy unit and it has 2 actions for this activation. If you don???t score any, the unit is not placed on the battlefield and may only perform NOTHING actions this activation. It can try another SPY REVEALED! for its next activation. A unit that is not on the battlefield cannot be the target of command actions. This skill is not shared with a unit joined.','Can deploy off-field and perform SPY REVEALED! actions','1817-06-29 08:19:20'),(70,'SPORES (FUNGI FROM YUGGOTH)','Attacks all units within range 1 around the unit. Target infantry receive no cover save (but still have an infantry save).','Area attack ignoring cover save for infantry','1817-06-29 08:19:11'),(71,'STEEL GUARD','This unit never has a cover save, but always passes their infantry save on a roll of as well as specified. Only a Steel Guard hero may join a Steel Guard unit, and join only units that are Steel Guard. A unit with this skill also gains the Damage Resilient skill.','Always passes infantry save, exclusive hero/unit rule','1817-06-29 08:19:23'),(72,'STRONGPOINT','A strongpoint unit must be deployed in a strongpoint or bunker.','Must be deployed in strongpoint or bunker','1817-06-29 08:19:15'),(73,'SUPERHUMANS','Superhumans are heroes. They cannot join other units but can share a square with them like regular heroes. Superhumans pass a normal cover save and an infantry save on a roll of as well as specified, and benefit from enhanced forms of cover saves like other units. A superhuman never receives under fire or suppression tokens.','Heroes that cannot join units, ignore suppression','0000-00-00 00:00:00'),(74,'SUPPORT WEAPON','Support weapon units have several soldiers on the same base; treat them as if every miniature is on a separate base. If they???ve sustained damage, they have 1 soldier left for each point remaining on their damage track. Every time the unit loses 1 miniature, it loses 1 appropriate weapon. These units use a 2-man team to fire the support weapon. Only the third or fourth soldiers of the unit can fire other weapons if the support weapon fires. Each time you attack with a support weapon, choose which weapons the crew are using.','Multi-soldier unit with separate weapon actions','0000-00-00 00:00:00'),(75,'TAKE AIM','This hero hits on rolls of as well as specified when making a SUSTAINED ATTACK action with ranged weapons. This skill is not shared with any unit a hero joins.','Improves hero ranged attack rolls','0000-00-00 00:00:00'),(76,'TRACKED','This unit???s MOVE and MARCH MOVE actions are affected by the type of terrain being crossed as indicated in the terrain table.','Movement modified by terrain','0000-00-00 00:00:00'),(77,'TRAILBLAZER','This unit (and any unit it has joined or hero that has joined it) can move through enemy units.','Can move through enemy units','0000-00-00 00:00:00'),(78,'WHEELED','This unit???s MOVE and MARCH MOVE actions are affected by the type of terrain being crossed as indicated in the terrain table.','Movement affected by terrain for wheeled units','0000-00-00 00:00:00'),(79,'ZOMBIE','This unit never makes cover saves, but always passes its infantry saves on a roll of as well as specified. An officer, medic, or mechanic cannot target a zombie with their COMMAND SQUAD special actions. A zombie unit can never mount a vehicle or aircraft as passengers. Only a zombie hero may join a zombie unit. Zombie heroes cannot join units that are not zombies.','Ignores cover saves, only zombie heroes may join','0000-00-00 00:00:00'),(80,'LARGE VEHICLES','','','0000-00-00 00:00:00'),(81,'HUGE VEHICLES','','','0000-00-00 00:00:00'),(82,'PHASER WEAPONS','Units hit by phaser weapons do not receive a cover save, but infantry units retain their infantry save.','Units hit by phaser weapons do not receive a cover save, but infantry units retain their infantry save.','0000-00-00 00:00:00'),(83,'TESLA WEAPONS','When a unit takes damage from this weapon, it receives a stunned token. A stunned unit cannot fight, including fighting back with a retaliatory attack if attacked in CC. When a stunned unit activates, it performs a NOTHING action as its first action, then removes all stunned tokens. If a stunned unit attempts a reactive attack, it rolls 1 die rather than 2 to see if it can do so, removing the stunned token whether or not it succeeds. A unit with both a suppression token and a stunned token loses only a single action. If a unit is hit by this weapon during a reactive attack, it receives the stunned token at the end of its activation.','When a unit takes damage from this weapon, it receives a stunned token. A stunned unit cannot fight, including fighting back with a retaliatory attack if attacked in CC. When a stunned unit activates, it performs a NOTHING action as its first action, then','0000-00-00 00:00:00'),(84,'ARTILLERY WEAPONS',NULL,'Artillery can either fire at a target point they can see, or be fired remotely by an artillery observer unit with LOS to the target polnt. They may shoot over buildings, vehicles, walls, and other terrain, but they cannot be fired from inside buildings or','1804-05-08 17:00:00'),(85,'PSYKER','','	\nCan perform PSYKER actions','0000-00-00 00:00:00'),(86,'GRANADE','Target Infantery receive no Cover Save for this weapon but still receive Infantery Save. Vehicle Units retain their Cover Save.','Target Infantery receive no Cover Save for this weapon but still receive Infantery Save. Vehicle Units retain their Cover Save.','2025-12-06 11:01:22');
/*!40000 ALTER TABLE `rules` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `unit_abilities`
--

DROP TABLE IF EXISTS `unit_abilities`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `unit_abilities` (
  `unit_id` int unsigned NOT NULL,
  `abilitie` int NOT NULL,
  KEY `idx_unit_abilities_unit_id` (`unit_id`) USING BTREE,
  CONSTRAINT `fk_unit_abilities_unit` FOREIGN KEY (`unit_id`) REFERENCES `units` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `unit_abilities`
--

LOCK TABLES `unit_abilities` WRITE;
/*!40000 ALTER TABLE `unit_abilities` DISABLE KEYS */;
INSERT INTO `unit_abilities` VALUES (5,2),(11,2);
/*!40000 ALTER TABLE `unit_abilities` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `unit_rules`
--

DROP TABLE IF EXISTS `unit_rules`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `unit_rules` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `ability_id` int unsigned DEFAULT NULL,
  `unit_id` int unsigned NOT NULL,
  `unit_rule_id` int unsigned NOT NULL,
  `note` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_unit_rules_unit_id` (`unit_id`),
  KEY `idx_unit_rules_unit_rule_id` (`unit_rule_id`),
  CONSTRAINT `fk_unit_rules_rule` FOREIGN KEY (`unit_rule_id`) REFERENCES `rules` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_unit_rules_unit` FOREIGN KEY (`unit_id`) REFERENCES `units` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=46 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `unit_rules`
--

LOCK TABLES `unit_rules` WRITE;
/*!40000 ALTER TABLE `unit_rules` DISABLE KEYS */;
INSERT INTO `unit_rules` VALUES (1,NULL,5,22,NULL),(2,NULL,6,22,NULL),(3,NULL,1,22,NULL),(4,NULL,2,22,NULL),(5,NULL,1,58,NULL),(6,NULL,2,22,NULL),(7,NULL,2,33,NULL),(8,NULL,2,32,NULL),(9,NULL,2,17,NULL),(10,NULL,2,12,NULL),(11,NULL,2,29,'Energie Fist'),(12,NULL,4,22,NULL),(13,NULL,7,22,NULL),(14,NULL,7,33,NULL),(15,NULL,7,17,NULL),(16,NULL,7,32,NULL),(17,NULL,11,22,NULL),(18,NULL,11,33,NULL),(19,NULL,11,17,NULL),(20,NULL,11,32,NULL),(21,NULL,9,22,NULL),(22,NULL,9,33,NULL),(23,NULL,9,17,NULL),(24,NULL,9,32,NULL),(25,NULL,8,22,NULL),(26,NULL,8,33,NULL),(27,NULL,8,17,NULL),(28,NULL,8,32,NULL),(29,NULL,15,22,NULL),(30,NULL,100,58,NULL),(31,NULL,101,33,NULL),(32,NULL,107,17,NULL),(33,NULL,107,32,NULL),(34,NULL,108,17,NULL),(35,NULL,108,32,NULL),(36,NULL,102,85,NULL),(37,NULL,101,40,NULL),(38,NULL,120,33,NULL),(39,NULL,120,59,'11'),(40,NULL,109,75,NULL),(41,NULL,110,75,NULL),(42,NULL,111,75,NULL),(43,NULL,200,85,NULL),(44,NULL,201,40,NULL),(45,NULL,214,52,NULL);
/*!40000 ALTER TABLE `unit_rules` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `unit_weapons`
--

DROP TABLE IF EXISTS `unit_weapons`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `unit_weapons` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `unit_id` int unsigned NOT NULL,
  `weapon_id` int unsigned NOT NULL,
  `number` tinyint unsigned NOT NULL,
  `firing_arc` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_unit_weapons_unit_id` (`unit_id`),
  KEY `idx_unit_weapons_weapon_id` (`weapon_id`),
  CONSTRAINT `fk_unit_weapons_unit` FOREIGN KEY (`unit_id`) REFERENCES `units` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_unit_weapons_weapon` FOREIGN KEY (`weapon_id`) REFERENCES `weapons` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=83 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `unit_weapons`
--

LOCK TABLES `unit_weapons` WRITE;
/*!40000 ALTER TABLE `unit_weapons` DISABLE KEYS */;
INSERT INTO `unit_weapons` VALUES (1,5,4,1,''),(4,5,3,4,''),(5,5,5,1,''),(6,1,1,1,''),(7,1,2,1,''),(8,2,1,1,''),(9,2,2,1,''),(10,4,3,5,''),(11,6,3,4,''),(12,6,9,1,''),(13,7,1,5,''),(14,7,8,5,''),(15,11,6,1,''),(16,11,1,4,''),(17,11,8,3,''),(18,11,2,1,''),(19,9,2,1,''),(20,9,1,4,''),(21,9,8,4,''),(22,8,6,1,''),(23,8,1,4,''),(24,8,8,4,''),(25,15,3,3,''),(26,15,9,2,''),(27,20,11,1,'R'),(28,20,11,1,'L'),(29,20,10,1,'T'),(30,21,11,1,'R'),(31,21,11,1,'L'),(32,21,44,1,'T'),(33,100,110,1,''),(34,100,101,1,''),(35,101,110,1,''),(36,101,101,1,''),(37,102,110,3,''),(38,102,111,3,''),(39,103,108,5,''),(40,103,109,5,''),(41,104,108,5,''),(42,104,109,5,''),(43,104,102,1,''),(44,105,108,5,''),(45,105,109,5,''),(46,105,103,1,''),(47,107,110,4,''),(48,107,114,4,''),(49,107,115,1,''),(50,108,110,4,''),(51,108,112,4,''),(52,108,113,1,''),(53,109,104,5,''),(54,110,104,4,''),(55,110,105,1,''),(56,111,104,4,''),(57,111,102,1,''),(58,120,106,1,'F'),(59,120,107,1,'T'),(60,200,200,1,''),(61,200,202,1,''),(62,201,1,1,''),(63,201,5,1,''),(64,202,201,5,''),(65,203,8,1,''),(66,203,200,1,''),(67,203,201,4,''),(68,204,201,2,''),(69,204,203,1,''),(70,205,201,2,''),(71,205,11,1,''),(72,206,201,2,''),(73,206,204,1,''),(74,210,207,1,'T'),(75,210,11,1,'F'),(76,210,45,1,'R'),(77,210,45,1,'L'),(78,211,206,1,'T'),(79,211,11,1,'F'),(80,211,45,1,'R'),(81,211,45,1,'L'),(82,214,200,5,'');
/*!40000 ALTER TABLE `unit_weapons` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `units`
--

DROP TABLE IF EXISTS `units`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `units` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `faction_id` int unsigned NOT NULL,
  `points` int NOT NULL,
  `points_override` int DEFAULT NULL,
  `speed` int NOT NULL,
  `march_speed` int NOT NULL,
  `type` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `level` tinyint unsigned NOT NULL,
  `health` tinyint unsigned NOT NULL,
  `image_url` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `notes` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci,
  PRIMARY KEY (`id`),
  KEY `idx_units_faction_id` (`faction_id`),
  CONSTRAINT `fk_units_faction_id` FOREIGN KEY (`faction_id`) REFERENCES `factions` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=215 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `units`
--

LOCK TABLES `units` WRITE;
/*!40000 ALTER TABLE `units` DISABLE KEYS */;
INSERT INTO `units` VALUES (1,'Lieutenant',1,12,NULL,2,3,'H',3,4,'http://kunzomat.de/dust1947/backend/images/SM_LT_EFI.png',NULL),(2,'Chaplain (Jump Pack)',1,12,NULL,3,6,'H',3,4,'http://kunzomat.de/dust1947/backend/images/SM_CH_EFI.png',NULL),(4,'Tactical Squad (Boltguns)',1,11,NULL,2,3,'I',3,1,'http://kunzomat.de/dust1947/backend/images/SM_TS_STD.png',NULL),(5,'Tactical Squad (Plasma Pistol & Energie Sword)',1,11,NULL,2,3,'I',3,1,'http://kunzomat.de/dust1947/backend/images/SM_TS_BPE.png',NULL),(6,'Tactical Squad (Missile launcher)',1,11,NULL,2,3,'I',3,1,'http://kunzomat.de/dust1947/backend/images/SM_TS_MIS.png',NULL),(7,'Assault Squad (Jump Pack)',1,11,NULL,3,6,'I',3,1,'http://kunzomat.de/dust1947/backend/images/',NULL),(8,'Assault Squad (Jump Pack + Flame)',1,11,NULL,3,6,'I',3,1,'http://kunzomat.de/dust1947/backend/images/SM_AS_FLM.png',NULL),(9,'Assault Squad (Jump Pack E-Fist)',1,11,NULL,3,6,'I',3,1,'http://kunzomat.de/dust1947/backend/images/SM_AS_EFI.png',NULL),(11,'Assault Squad (Jump Pack + Flame + E-Fist)',1,11,NULL,3,6,'I',3,1,'http://kunzomat.de/dust1947/backend/images/SM_AS_EFF.png',NULL),(15,'Devastator Squad (2x ML)',1,12,NULL,2,3,'I',3,1,'http://kunzomat.de/dust1947/backend/images/SM_DE_MIS.png',NULL),(20,'Predator Annihilator Tank',1,22,NULL,2,4,'V',5,8,'http://kunzomat.de/dust1947/backend/images/SM_PD_ANN.png',NULL),(21,'Predator Destructor Tank',1,22,NULL,2,4,'V',5,8,'http://kunzomat.de/dust1947/backend/images/SM_PD_DES.png',NULL),(100,'Autarch',2,10,NULL,2,4,'H',2,4,'http://kunzomat.de/dust1947/backend/images/AD_AU_STD.png',NULL),(101,'Autarch Wayleaper',2,8,NULL,3,6,'H',2,4,'http://kunzomat.de/dust1947/backend/images/AD_AU_WAY.png',NULL),(102,'Warlocks',2,8,NULL,2,4,'I',2,1,'http://kunzomat.de/dust1947/backend/images/AD_WL_STD.png',NULL),(103,'Guardian Defender',2,6,NULL,2,4,'I',2,1,'http://kunzomat.de/dust1947/backend/images/AD_GD_STD.png',NULL),(104,'Guardian Defender (Shuriken Cannon)',2,6,NULL,2,4,'I',2,1,'http://kunzomat.de/dust1947/backend/images/AD_GD_SCA.png',NULL),(105,'Guardian Defender (Bright Lance)',2,6,NULL,2,4,'I',2,1,'http://kunzomat.de/dust1947/backend/images/AD_GD_BLA.png',NULL),(107,'Howling Banshee',2,9,NULL,3,5,'I',2,1,'http://kunzomat.de/dust1947/backend/images/AD_HB_DBL.png',NULL),(108,'Striking Scorpions',2,9,NULL,3,5,'I',2,1,'http://kunzomat.de/dust1947/backend/images/AD_SS_BTB.png',NULL),(109,'Dark Reaper',2,12,NULL,2,3,'I',3,1,'http://kunzomat.de/dust1947/backend/images/AD_DR_STD.png',NULL),(110,'Dark Reaper (Tempest Launcher)',2,12,NULL,2,3,'I',3,1,'http://kunzomat.de/dust1947/backend/images/AD_DR_TEL.png',NULL),(111,'Dark Reaper (Shuriken Cannon)',2,12,NULL,2,3,'I',3,1,'http://kunzomat.de/dust1947/backend/images/AD_DR_SCA.png',NULL),(120,'Wave Serpent (Bright Lance)',2,15,NULL,3,6,'V',4,6,'http://kunzomat.de/dust1947/backend/images/AD_SP_BRL.png',NULL),(200,'Primaris Psyker',3,5,NULL,2,3,'I',2,4,'http://kunzomat.de/dust1947/backend/images/IM_PP_STD.png',NULL),(201,'Marshal',3,5,NULL,2,3,'I',2,4,'http://kunzomat.de/dust1947/backend/images/IM_MA_STD.png',NULL),(202,'Infantry Squad',3,4,NULL,2,3,'I',1,1,'http://kunzomat.de/dust1947/backend/images/IM_IS_STD.png',NULL),(203,'Infantry Squad (Sergeant)',3,4,NULL,2,3,'I',1,1,'http://kunzomat.de/dust1947/backend/images/IM_IS_SER.png',NULL),(204,'Heavy Weapons Team (Autocannon)',3,5,NULL,1,3,'I',1,1,'http://kunzomat.de/dust1947/backend/images/IM_SW_AUT.png',NULL),(205,'Heavy Weapons Team (Lascannon)',3,5,NULL,1,3,'I',1,1,'http://kunzomat.de/dust1947/backend/images/IM_SW_LAS.png',NULL),(206,'Heavy Weapons Team (Mortar)',3,5,NULL,1,3,'I',1,1,'http://kunzomat.de/dust1947/backend/images/IM_SW_MOR.png',NULL),(210,'Leman Russ Vanquisher',3,22,NULL,2,4,'V',5,8,'http://kunzomat.de/dust1947/backend/images/IM_LR_VAN.png',NULL),(211,'Leman Russ Demolisher',3,22,NULL,2,4,'V',5,8,'http://kunzomat.de/dust1947/backend/images/IM_LR_DEM.png',NULL),(214,'Militzsquad',4,5,NULL,2,3,'I',1,1,NULL,NULL);
/*!40000 ALTER TABLE `units` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Temporary view structure for view `v_army_points`
--

DROP TABLE IF EXISTS `v_army_points`;
/*!50001 DROP VIEW IF EXISTS `v_army_points`*/;
SET @saved_cs_client     = @@character_set_client;
/*!50503 SET character_set_client = utf8mb4 */;
/*!50001 CREATE VIEW `v_army_points` AS SELECT 
 1 AS `army_id`,
 1 AS `army_name`,
 1 AS `bloc_id`,
 1 AS `points_limit`,
 1 AS `points_current`*/;
SET character_set_client = @saved_cs_client;

--
-- Table structure for table `weapon_rules`
--

DROP TABLE IF EXISTS `weapon_rules`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `weapon_rules` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `weapon_id` int unsigned NOT NULL,
  `rule_id` int unsigned NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_weapon_rules_weapon_id` (`weapon_id`),
  KEY `idx_weapon_rules_rule_id` (`rule_id`),
  CONSTRAINT `fk_weapon_rules_rule` FOREIGN KEY (`rule_id`) REFERENCES `rules` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_weapon_rules_weapon` FOREIGN KEY (`weapon_id`) REFERENCES `weapons` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=18 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `weapon_rules`
--

LOCK TABLES `weapon_rules` WRITE;
/*!40000 ALTER TABLE `weapon_rules` DISABLE KEYS */;
INSERT INTO `weapon_rules` VALUES (1,2,83),(2,4,82),(3,6,31),(4,11,45),(5,7,62),(7,10,45),(8,100,83),(9,111,83),(10,103,45),(11,107,45),(12,114,83),(13,115,83),(14,202,83),(15,204,86),(16,206,86),(17,207,86);
/*!40000 ALTER TABLE `weapon_rules` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `weapon_stats`
--

DROP TABLE IF EXISTS `weapon_stats`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `weapon_stats` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `weapon_id` int unsigned NOT NULL,
  `target_type` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `target_level` tinyint unsigned NOT NULL,
  `dice` varchar(2) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `damage` varchar(2) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_weapon_stats_weapon_id` (`weapon_id`),
  CONSTRAINT `fk_weapon_stats_weapon` FOREIGN KEY (`weapon_id`) REFERENCES `weapons` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=346 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `weapon_stats`
--

LOCK TABLES `weapon_stats` WRITE;
/*!40000 ALTER TABLE `weapon_stats` DISABLE KEYS */;
INSERT INTO `weapon_stats` VALUES (1,1,'I',1,'3','1'),(2,1,'I',2,'3','1'),(3,1,'I',3,'2','1'),(4,1,'I',4,'1','1'),(5,1,'V',1,'1','2'),(6,1,'V',2,'1','1'),(7,1,'V',3,'1','1'),(8,3,'I',1,'1','1'),(9,3,'I',2,'3','1'),(10,3,'I',3,'3','1'),(11,3,'I',4,'3','1'),(12,3,'V',1,'1','2'),(13,3,'V',2,'1','1'),(14,3,'V',3,'1','1'),(15,3,'A',1,'2','1'),(16,3,'A',2,'1','1'),(17,5,'I',1,'1','1'),(18,5,'I',2,'1','1'),(19,5,'I',3,'1','1'),(20,5,'I',4,'1','1'),(21,5,'V',1,'1','2'),(22,5,'V',2,'1','2'),(23,5,'V',3,'1','2'),(24,5,'V',4,'1','2'),(25,5,'V',5,'1','2'),(26,5,'V',6,'1','2'),(27,5,'V',7,'1','2'),(28,4,'I',1,'2','1'),(29,4,'I',2,'2','1'),(30,4,'I',3,'2','1'),(31,4,'I',4,'2','1'),(32,4,'V',1,'1','#'),(33,4,'V',2,'1','4'),(34,4,'V',3,'1','3'),(35,4,'V',4,'1','2'),(36,4,'V',5,'1','2'),(37,4,'V',6,'1','1'),(38,4,'V',7,'1','1'),(39,2,'I',1,'1','1'),(40,2,'I',2,'1','1'),(41,2,'I',3,'1','1'),(42,2,'I',4,'1','1'),(43,2,'V',1,'1','3'),(44,2,'V',2,'1','3'),(45,2,'V',3,'1','3'),(46,2,'V',4,'1','3'),(47,2,'V',5,'1','3'),(48,2,'V',6,'1','3'),(49,2,'V',7,'1','3'),(50,9,'I',1,'*','1'),(51,9,'I',2,'*','1'),(52,9,'I',3,'*','1'),(53,9,'I',4,'*','1'),(54,9,'V',1,'1','#'),(55,9,'V',2,'1','#'),(56,9,'V',3,'1','5'),(57,9,'V',4,'1','5'),(58,9,'V',5,'1','4'),(59,9,'V',6,'1','4'),(60,9,'V',7,'1','3'),(61,8,'I',1,'2','1'),(62,8,'I',2,'2','1'),(63,8,'I',3,'2','1'),(64,8,'I',4,'2','1'),(65,8,'V',1,'1','1'),(66,8,'V',2,'1','1'),(67,8,'V',3,'1','1'),(68,8,'V',4,'1','1'),(69,8,'V',5,'1','1'),(70,8,'V',6,'1','1'),(71,8,'V',7,'1','1'),(72,6,'I',1,'*','1'),(73,6,'I',2,'*','1'),(74,6,'I',3,'*','1'),(75,6,'I',4,'*','1'),(76,6,'V',1,'1','#'),(77,6,'V',2,'1','#'),(78,6,'V',3,'1','2'),(79,6,'V',4,'1','2'),(80,6,'V',5,'1','2'),(81,6,'V',6,'1','2'),(82,6,'V',7,'1','2'),(83,10,'I',1,'2','#'),(84,10,'I',2,'2','#'),(85,10,'I',3,'2','#'),(86,10,'I',4,'2','#'),(87,10,'V',1,'12','1'),(88,10,'V',2,'10','1'),(89,10,'V',3,'9','1'),(90,10,'V',4,'7','1'),(91,10,'V',5,'6','1'),(92,10,'V',6,'4','1'),(93,10,'V',7,'3','1'),(94,11,'I',1,'1','#'),(95,11,'I',2,'1','#'),(96,11,'I',3,'1','#'),(97,11,'I',4,'1','#'),(98,11,'V',1,'8','1'),(99,11,'V',2,'7','1'),(100,11,'V',3,'6','1'),(101,11,'V',4,'5','1'),(102,11,'V',5,'4','1'),(103,11,'V',6,'3','1'),(104,11,'V',7,'2','1'),(105,44,'I',1,'5','1'),(106,44,'I',2,'4','1'),(107,44,'I',3,'4','1'),(108,44,'I',4,'3','1'),(109,44,'V',1,'8','#'),(110,44,'V',2,'7','#'),(111,44,'V',3,'6','6'),(112,44,'V',4,'5','5'),(113,44,'V',5,'4','4'),(114,44,'V',6,'3','3'),(115,44,'V',7,'2','2'),(116,45,'I',1,'9','1'),(117,45,'I',2,'9','1'),(118,45,'I',3,'7','1'),(119,45,'I',4,'5','1'),(120,45,'V',1,'5','#'),(121,45,'V',2,'4','#'),(122,45,'V',3,'1','5'),(123,100,'I',1,'1','1'),(124,100,'I',2,'1','1'),(125,100,'I',3,'1','1'),(126,100,'I',4,'1','1'),(127,100,'V',1,'1','2'),(128,100,'V',2,'1','2'),(129,100,'V',3,'1','2'),(130,100,'V',4,'1','2'),(131,100,'V',5,'1','2'),(132,100,'V',6,'1','1'),(133,100,'V',7,'1','1'),(134,101,'I',1,'2','1'),(135,101,'I',2,'2','1'),(136,101,'I',3,'2','1'),(137,101,'I',4,'2','1'),(138,101,'V',1,'1','2'),(139,101,'V',2,'1','2'),(140,101,'V',3,'1','2'),(141,101,'V',4,'1','2'),(142,101,'V',5,'1','2'),(143,101,'V',6,'1','2'),(144,101,'V',7,'1','2'),(145,109,'I',1,'1','1'),(146,109,'I',2,'1','1'),(147,109,'I',3,'1','1'),(148,109,'I',4,'1','1'),(149,109,'V',1,'1','2'),(150,109,'V',2,'1','2'),(151,109,'V',3,'1','2'),(152,109,'V',4,'1','2'),(153,109,'V',5,'1','2'),(154,109,'V',6,'1','2'),(155,109,'V',7,'1','2'),(156,111,'I',1,'1','1'),(157,111,'I',2,'1','1'),(158,111,'I',3,'1','1'),(159,111,'I',4,'1','1'),(160,111,'V',1,'1','2'),(161,111,'V',2,'1','2'),(162,111,'V',3,'1','2'),(163,111,'V',4,'1','2'),(164,111,'V',5,'1','2'),(165,111,'V',6,'1','2'),(166,111,'V',7,'1','2'),(167,112,'I',1,'2','1'),(168,112,'I',2,'2','1'),(169,112,'I',3,'2','1'),(170,112,'I',4,'2','1'),(171,112,'V',1,'2','2'),(172,112,'V',2,'2','2'),(173,112,'V',3,'2','2'),(174,112,'V',4,'2','2'),(175,112,'V',5,'2','2'),(176,112,'V',6,'2','2'),(177,112,'V',7,'2','2'),(178,113,'I',1,'2','1'),(179,113,'I',2,'2','1'),(180,113,'I',3,'2','1'),(181,113,'I',4,'2','1'),(182,113,'V',1,'2','3'),(183,113,'V',2,'2','3'),(184,113,'V',3,'2','3'),(185,113,'V',4,'2','3'),(186,113,'V',5,'2','3'),(187,113,'V',6,'2','3'),(188,113,'V',7,'2','3'),(189,114,'I',1,'3','1'),(190,114,'I',2,'3','1'),(191,114,'I',3,'3','1'),(192,114,'I',4,'3','1'),(193,114,'V',1,'1','1'),(194,114,'V',2,'1','1'),(195,114,'V',3,'1','1'),(196,114,'V',4,'1','1'),(197,114,'V',5,'1','1'),(198,114,'V',6,'1','1'),(199,114,'V',7,'1','1'),(200,115,'I',1,'4','1'),(201,115,'I',2,'4','1'),(202,115,'I',3,'4','1'),(203,115,'I',4,'4','1'),(204,115,'V',1,'1','1'),(205,115,'V',2,'1','1'),(206,115,'V',3,'1','1'),(207,115,'V',4,'1','1'),(208,115,'V',5,'1','1'),(209,115,'V',6,'1','1'),(210,115,'V',7,'1','1'),(211,202,'I',1,'1','1'),(212,202,'I',2,'1','1'),(213,202,'I',3,'1','1'),(214,202,'I',4,'1','1'),(215,202,'V',1,'1','2'),(216,202,'V',2,'1','2'),(217,202,'V',3,'1','2'),(218,202,'V',4,'1','2'),(219,202,'V',5,'1','1'),(220,202,'V',6,'1','1'),(221,202,'V',7,'1','1'),(222,110,'I',1,'4','1'),(223,110,'I',2,'3','1'),(224,110,'I',3,'2','1'),(225,110,'I',4,'1','1'),(226,110,'V',1,'2','1'),(227,110,'V',2,'1','1'),(228,108,'I',1,'4','1'),(229,108,'I',2,'3','1'),(230,108,'I',3,'2','1'),(231,108,'I',4,'1','1'),(232,108,'V',1,'2','1'),(233,108,'V',2,'1','1'),(234,108,'A',1,'2','1'),(235,108,'A',2,'1','1'),(236,102,'I',1,'9','1'),(237,102,'I',2,'9','1'),(238,102,'I',3,'7','1'),(239,102,'I',4,'5','1'),(240,102,'V',1,'5','1'),(241,102,'V',2,'4','1'),(242,102,'V',3,'1','1'),(243,103,'I',1,'4','1'),(244,103,'I',2,'3','1'),(245,103,'I',3,'3','1'),(246,103,'I',4,'2','1'),(247,103,'V',1,'8','2'),(248,103,'V',2,'7','2'),(249,103,'V',3,'6','2'),(250,103,'V',4,'5','2'),(251,103,'V',5,'4','2'),(252,103,'V',6,'3','1'),(253,103,'V',7,'2','1'),(254,104,'I',1,'*','1'),(255,104,'I',2,'*','1'),(256,104,'I',3,'*','1'),(257,104,'I',4,'*','1'),(258,104,'V',1,'1','#'),(259,104,'V',2,'1','#'),(260,104,'V',3,'1','5'),(261,104,'V',4,'1','5'),(262,104,'V',5,'1','4'),(263,104,'V',6,'1','4'),(264,104,'V',7,'1','3'),(265,105,'I',1,'**','1'),(266,105,'I',2,'**','1'),(267,105,'I',3,'**','1'),(268,105,'I',4,'**','1'),(269,105,'V',1,'*','2'),(270,105,'V',2,'*','2'),(271,105,'V',3,'3','2'),(272,105,'V',4,'3','2'),(273,105,'V',5,'2','2'),(274,105,'V',6,'2','1'),(275,105,'V',7,'1','1'),(276,106,'I',1,'6','1'),(277,106,'I',2,'5','1'),(278,106,'I',3,'3','1'),(279,106,'I',4,'2','1'),(280,106,'V',1,'3','1'),(281,106,'V',2,'1','1'),(282,107,'I',1,'4','1'),(283,107,'I',2,'4','1'),(284,107,'I',3,'3','1'),(285,107,'I',4,'3','1'),(286,107,'V',1,'10','1'),(287,107,'V',2,'9','1'),(288,107,'V',3,'8','1'),(289,107,'V',4,'7','1'),(290,107,'V',5,'6','1'),(291,107,'V',6,'5','1'),(292,107,'V',7,'4','1'),(293,200,'I',1,'3','1'),(294,200,'I',2,'2','1'),(295,200,'I',3,'1','1'),(296,200,'V',1,'1','1'),(297,200,'V',2,'1','1'),(298,201,'I',1,'3','1'),(299,201,'I',2,'2','1'),(300,201,'I',3,'1','1'),(301,201,'V',1,'1','1'),(302,201,'V',2,'1','1'),(303,201,'A',1,'1','1'),(304,201,'A',2,'1','1'),(305,203,'I',1,'8','1'),(306,203,'I',2,'7','1'),(307,203,'I',3,'6','1'),(308,203,'I',4,'5','1'),(309,203,'V',1,'3','2'),(310,203,'V',2,'2','2'),(311,203,'V',3,'1','2'),(312,203,'A',1,'3','1'),(313,203,'A',2,'2','1'),(314,203,'A',3,'1','1'),(315,204,'I',1,'*','1'),(316,204,'I',2,'*','1'),(317,204,'I',3,'*','1'),(318,204,'I',4,'*','1'),(319,204,'V',1,'*','2'),(320,204,'V',2,'*','2'),(321,204,'V',3,'*','2'),(322,204,'V',4,'*','1'),(323,204,'V',5,'*','1'),(324,207,'I',1,'4','1'),(325,207,'I',2,'3','1'),(326,207,'I',3,'3','1'),(327,207,'I',4,'2','1'),(328,207,'V',1,'1','#'),(329,207,'V',2,'1','#'),(330,207,'V',3,'1','#'),(331,207,'V',4,'1','#'),(332,207,'V',5,'1','#'),(333,207,'V',6,'1','5'),(334,207,'V',7,'1','4'),(335,206,'I',1,'**','1'),(336,206,'I',2,'**','1'),(337,206,'I',3,'**','1'),(338,206,'I',4,'**','1'),(339,206,'V',1,'1','#'),(340,206,'V',2,'1','#'),(341,206,'V',3,'1','#'),(342,206,'V',4,'1','4'),(343,206,'V',5,'1','3'),(344,206,'V',6,'1','2'),(345,206,'V',7,'1','1');
/*!40000 ALTER TABLE `weapon_stats` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `weapons`
--

DROP TABLE IF EXISTS `weapons`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `weapons` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `range` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `disposable` tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=208 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `weapons`
--

LOCK TABLES `weapons` WRITE;
/*!40000 ALTER TABLE `weapons` DISABLE KEYS */;
INSERT INTO `weapons` VALUES (1,'Bolt Pistol','2',0),(2,'Energie Fist','C',0),(3,'Boltgun','4',0),(4,'Plasma Pistol','2',0),(5,'Energie Sword','C',0),(6,'Flamer','1',0),(7,'Meltagun','3',0),(8,'Chainsword','C',0),(9,'Missile Launcher','4',0),(10,'Twin Lascannon','12',0),(11,'Lascannon','12',0),(44,'Predator Autocannon','12',0),(45,'Heavy Bolter','9',0),(100,'Singing spear','C',0),(101,'Star Glaive','C',0),(102,'Shuriken cannon','8',0),(103,'Bright lance','12',0),(104,'Reaper Launcher','12',0),(105,'Tempest Launcher','12',0),(106,'Twin Shuriken Catapult','4',0),(107,'Dual Bright Lance','12',0),(108,'Shuriken Catapult','4',0),(109,'Plasma Grenades','C',1),(110,'Shuriken Pistol','2',0),(111,'Witchblade','C',0),(112,'Scorpion chainsword','C',0),(113,'Biting Blade','C',0),(114,'Banshee blade','C',0),(115,'Dual Banshee blade','C',0),(200,'Laspistol','2',0),(201,'Lasgun','5',0),(202,'Force stave','C',0),(203,'Autocannon','12',0),(204,'Mortar','12',0),(206,'Demolisher cannon','6',0),(207,' Vanquisher Cannon','18',0);
/*!40000 ALTER TABLE `weapons` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping routines for database 'dust1947'
--

--
-- Final view structure for view `v_army_points`
--

/*!50001 DROP VIEW IF EXISTS `v_army_points`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = utf8mb4 */;
/*!50001 SET character_set_results     = utf8mb4 */;
/*!50001 SET collation_connection      = utf8mb4_0900_ai_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 DEFINER=`o15166077`@`%` SQL SECURITY INVOKER */
/*!50001 VIEW `v_army_points` AS select `a`.`id` AS `army_id`,`a`.`name` AS `army_name`,`a`.`bloc_id` AS `bloc_id`,`a`.`points_limit` AS `points_limit`,coalesce(sum((`u`.`points` * `au`.`quantity`)),0) AS `points_current` from ((`armies` `a` left join `army_units` `au` on((`au`.`army_id` = `a`.`id`))) left join `units` `u` on((`u`.`id` = `au`.`unit_id`))) group by `a`.`id`,`a`.`name`,`a`.`bloc_id`,`a`.`points_limit` */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-09-06 14:32:48
