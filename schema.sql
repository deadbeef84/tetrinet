-- MySQL dump 10.13  Distrib 5.1.54, for debian-linux-gnu (x86_64)
--
-- Host: localhost    Database: ucms_tetrinet
-- ------------------------------------------------------
-- Server version	5.1.54-1ubuntu4

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `game`
--

DROP TABLE IF EXISTS `game`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `game` (
  `game_id` int(11) NOT NULL AUTO_INCREMENT,
  `date` datetime NOT NULL,
  `calculated_results` tinyint(4) NOT NULL DEFAULT '0',
  `num_players` int(11) DEFAULT NULL,
  PRIMARY KEY (`game_id`)
) ENGINE=MyISAM AUTO_INCREMENT=336 DEFAULT CHARSET=utf8 COLLATE=utf8_swedish_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `game_action`
--

DROP TABLE IF EXISTS `game_action`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `game_action` (
  `game_action_id` int(11) NOT NULL AUTO_INCREMENT,
  `game_id` int(11) NOT NULL,
  `player_id` varchar(255) COLLATE utf8_swedish_ci NOT NULL,
  `target_player_id` varchar(255) COLLATE utf8_swedish_ci NOT NULL,
  `type` int(11) NOT NULL,
  `time` int(11) NOT NULL,
  PRIMARY KEY (`game_action_id`),
  KEY `game_action_FI_1` (`game_id`),
  KEY `game_action_FI_2` (`player_id`),
  KEY `game_action_FI_3` (`target_player_id`)
) ENGINE=MyISAM AUTO_INCREMENT=17185 DEFAULT CHARSET=utf8 COLLATE=utf8_swedish_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `game_result`
--

DROP TABLE IF EXISTS `game_result`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `game_result` (
  `game_result_id` int(11) NOT NULL AUTO_INCREMENT,
  `game_id` int(11) NOT NULL,
  `player_id` varchar(255) COLLATE utf8_swedish_ci NOT NULL,
  `place` int(11) NOT NULL,
  `num_keys` int(11) NOT NULL,
  `num_blocks` int(11) NOT NULL,
  `num_lines` int(11) NOT NULL,
  `num_lines_sent` int(11) NOT NULL,
  `time` int(11) NOT NULL,
  `true_skill_mean` double DEFAULT NULL,
  `true_skill_stddev` double DEFAULT NULL,
  PRIMARY KEY (`game_result_id`),
  KEY `game_result_FI_1` (`game_id`),
  KEY `game_result_FI_2` (`player_id`)
) ENGINE=MyISAM AUTO_INCREMENT=1544 DEFAULT CHARSET=utf8 COLLATE=utf8_swedish_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `player`
--

DROP TABLE IF EXISTS `player`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `player` (
  `player_id` varchar(255) COLLATE utf8_swedish_ci NOT NULL,
  `name` varchar(255) COLLATE utf8_swedish_ci NOT NULL,
  `true_skill_mean` double DEFAULT NULL,
  `true_skill_stddev` double DEFAULT NULL,
  PRIMARY KEY (`player_id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8 COLLATE=utf8_swedish_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2011-12-14 15:08:00
