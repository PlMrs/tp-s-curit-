-- phpMyAdmin SQL Dump
-- version 4.8.5
-- https://www.phpmyadmin.net/
--
-- Hôte : 127.0.0.1:3306
-- Généré le :  Dim 19 juin 2022 à 22:48
-- Version du serveur :  5.7.26
-- Version de PHP :  7.2.18

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET AUTOCOMMIT = 0;
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de données :  `tpsecu`
--

-- --------------------------------------------------------

--
-- Structure de la table `messages`
--

DROP TABLE IF EXISTS `messages`;
CREATE TABLE IF NOT EXISTS `messages` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `match_id` int(11) NOT NULL,
  `from` int(11) NOT NULL,
  `message` varchar(255) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `FK_5fdaf93e2a9fbc143071e7059e0` (`match_id`),
  KEY `FK_671851391885ee9558647e68fd0` (`from`)
) ENGINE=InnoDB DEFAULT CHARSET=utf32;

-- --------------------------------------------------------

--
-- Structure de la table `planning`
--

DROP TABLE IF EXISTS `planning`;
CREATE TABLE IF NOT EXISTS `planning` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `by` int(11) NOT NULL,
  `with` int(11) NOT NULL,
  `start` datetime NOT NULL,
  `end` datetime NOT NULL,
  `isValidated` tinyint(4) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `FK_5cc569827846cfd30ebbd1ac1ca` (`by`),
  KEY `FK_223a5fbeb8d1037792210b5222e` (`with`)
) ENGINE=InnoDB DEFAULT CHARSET=utf32;

-- --------------------------------------------------------

--
-- Structure de la table `swipe`
--

DROP TABLE IF EXISTS `swipe`;
CREATE TABLE IF NOT EXISTS `swipe` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_1` int(11) NOT NULL,
  `user_2` int(11) NOT NULL,
  `isMatched` tinyint(4) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `FK_df73b774c580d2d07063e736fc6` (`user_1`),
  KEY `FK_bddadbfb9c0e7e28c1f7af12534` (`user_2`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf32;

--
-- Déchargement des données de la table `swipe`
--

INSERT INTO `swipe` (`id`, `user_1`, `user_2`, `isMatched`) VALUES
(1, 1, 2, 0);

-- --------------------------------------------------------

--
-- Structure de la table `user`
--

DROP TABLE IF EXISTS `user`;
CREATE TABLE IF NOT EXISTS `user` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `surname` varchar(100) NOT NULL,
  `email` varchar(300) NOT NULL,
  `password` varchar(255) NOT NULL,
  `role` enum('A','C') NOT NULL DEFAULT 'C',
  `needs` enum('T','H','D','A') NOT NULL DEFAULT 'D',
  `picture` varchar(255) NOT NULL DEFAULT 'default.jpg',
  `description` varchar(255) DEFAULT NULL,
  `carte_id` varchar(255) DEFAULT NULL,
  `certificatScolaire` varchar(255) DEFAULT NULL,
  `verified` tinyint(4) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf32;

--
-- Déchargement des données de la table `user`
--

INSERT INTO `user` (`id`, `name`, `surname`, `email`, `password`, `role`, `needs`, `picture`, `description`, `carte_id`, `certificatScolaire`, `verified`) VALUES
(1, 'utilisateur', 'utilisateur', 'mail@mail.fr', 'azerty', 'A', 'D', 'default.jpg', NULL, NULL, NULL, 0),
(2, 'dupond', 'jean', 'mail2@mail2.fr', 'aqwzsx', 'C', 'D', 'default.jpg', NULL, NULL, NULL, 0);

--
-- Contraintes pour les tables déchargées
--

--
-- Contraintes pour la table `messages`
--
ALTER TABLE `messages`
  ADD CONSTRAINT `FK_5fdaf93e2a9fbc143071e7059e0` FOREIGN KEY (`match_id`) REFERENCES `swipe` (`id`) ON DELETE CASCADE ON UPDATE NO ACTION,
  ADD CONSTRAINT `FK_671851391885ee9558647e68fd0` FOREIGN KEY (`from`) REFERENCES `user` (`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

--
-- Contraintes pour la table `planning`
--
ALTER TABLE `planning`
  ADD CONSTRAINT `FK_223a5fbeb8d1037792210b5222e` FOREIGN KEY (`with`) REFERENCES `user` (`id`) ON DELETE CASCADE ON UPDATE NO ACTION,
  ADD CONSTRAINT `FK_5cc569827846cfd30ebbd1ac1ca` FOREIGN KEY (`by`) REFERENCES `user` (`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

--
-- Contraintes pour la table `swipe`
--
ALTER TABLE `swipe`
  ADD CONSTRAINT `FK_bddadbfb9c0e7e28c1f7af12534` FOREIGN KEY (`user_2`) REFERENCES `user` (`id`) ON DELETE CASCADE ON UPDATE NO ACTION,
  ADD CONSTRAINT `FK_df73b774c580d2d07063e736fc6` FOREIGN KEY (`user_1`) REFERENCES `user` (`id`) ON DELETE CASCADE ON UPDATE NO ACTION;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
