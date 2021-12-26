-- phpMyAdmin SQL Dump
-- version 5.0.2
-- https://www.phpmyadmin.net/
--
-- Hôte : 127.0.0.1:3306
-- Généré le : Dim 26 déc. 2021 à 17:41
-- Version du serveur :  5.7.31
-- Version de PHP : 7.3.21

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de données : `ascobot`
--

-- --------------------------------------------------------

--
-- Structure de la table `baie`
--

DROP TABLE IF EXISTS `baie`;
CREATE TABLE IF NOT EXISTS `baie` (
  `Nom` varchar(256) NOT NULL,
  `Image` varchar(256) NOT NULL,
  `Description` varchar(256) NOT NULL,
  `Numéro` int(255) UNSIGNED NOT NULL,
  `Dimension` decimal(10,1) UNSIGNED NOT NULL,
  `Fermeté` varchar(30) NOT NULL,
  `Épicée` int(1) UNSIGNED NOT NULL,
  `Sèche` int(1) UNSIGNED NOT NULL,
  `Sucrée` int(1) UNSIGNED NOT NULL,
  `Amère` int(1) UNSIGNED NOT NULL,
  `Acide` int(1) UNSIGNED NOT NULL,
  `Effet` varchar(256) NOT NULL,
  `Arbre` varchar(256) NOT NULL,
  `Type de Pokébloc` varchar(256) NOT NULL,
  `Type de Poffin` varchar(256) NOT NULL,
  `Effet d'EV` varchar(256) DEFAULT NULL,
  `Effet de bonheur` varchar(256) DEFAULT NULL,
  `Effet Combat` varchar(256) DEFAULT NULL,
  `Effet Hors Combat` varchar(256) DEFAULT NULL,
  `Effet Tenu` varchar(256) DEFAULT NULL,
  PRIMARY KEY (`Numéro`),
  UNIQUE KEY `Numéro` (`Numéro`),
  KEY `Numéro_2` (`Numéro`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4;

--
-- Déchargement des données de la table `baie`
--

INSERT INTO `baie` (`Nom`, `Image`, `Description`, `Numéro`, `Dimension`, `Fermeté`, `Épicée`, `Sèche`, `Sucrée`, `Amère`, `Acide`, `Effet`, `Arbre`, `Type de Pokébloc`, `Type de Poffin`, `Effet d'EV`, `Effet de bonheur`, `Effet Combat`, `Effet Hors Combat`, `Effet Tenu`) VALUES
('Baie Chilan', '', 'Une baie pour Pokébloc Marron', 48, '27.2', 'Tendre', 1, 0, 1, 0, 0, 'Pokébloc uniquement', 'Enigma', 'Marron', 'Aucun', NULL, NULL, NULL, NULL, NULL);

-- --------------------------------------------------------

--
-- Structure de la table `capacité`
--

DROP TABLE IF EXISTS `capacité`;
CREATE TABLE IF NOT EXISTS `capacité` (
  `Nom` varchar(256) DEFAULT NULL,
  `Type` varchar(256) DEFAULT NULL,
  `Description` varchar(256) DEFAULT NULL,
  `Catégorie` varchar(256) DEFAULT NULL,
  `PP` int(10) UNSIGNED DEFAULT NULL,
  `Puissance` int(10) UNSIGNED DEFAULT NULL,
  `Précision` int(10) UNSIGNED DEFAULT NULL,
  `Cible` varchar(256) DEFAULT NULL,
  `Influence` varchar(256) DEFAULT NULL,
  `Priorité` int(11) DEFAULT NULL,
  `Probabilité d'effet` int(10) UNSIGNED DEFAULT NULL
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------

--
-- Structure de la table `ct/cs/dt`
--

DROP TABLE IF EXISTS `ct/cs/dt`;
CREATE TABLE IF NOT EXISTS `ct/cs/dt` (
  `Nom` varchar(256) DEFAULT NULL,
  `Image` varchar(256) DEFAULT NULL,
  `Description` varchar(256) DEFAULT NULL,
  `Numéro` varchar(256) DEFAULT NULL,
  `Capacité donnée` varchar(256) DEFAULT NULL
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------

--
-- Structure de la table `objet`
--

DROP TABLE IF EXISTS `objet`;
CREATE TABLE IF NOT EXISTS `objet` (
  `ID` int(10) UNSIGNED NOT NULL,
  `Nom` varchar(256) DEFAULT NULL,
  `Image` varchar(256) DEFAULT NULL,
  `Description` varchar(256) DEFAULT NULL,
  `Effet Combat` varchar(256) DEFAULT NULL,
  `Effet Hors Combat` varchar(256) DEFAULT NULL,
  `Effet Tenu` varchar(256) DEFAULT NULL,
  `Prix de vente` int(10) UNSIGNED DEFAULT NULL,
  `Prix de revent` int(10) UNSIGNED DEFAULT NULL,
  PRIMARY KEY (`ID`),
  UNIQUE KEY `ID` (`ID`),
  KEY `ID_2` (`ID`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------

--
-- Structure de la table `objet de soin`
--

DROP TABLE IF EXISTS `objet de soin`;
CREATE TABLE IF NOT EXISTS `objet de soin` (
  `Nom` varchar(256) DEFAULT NULL,
  `Image` varchar(256) DEFAULT NULL,
  `Description` varchar(256) DEFAULT NULL,
  `Effet de soin` varchar(256) DEFAULT NULL,
  `Effet de statut` varchar(256) DEFAULT NULL,
  `Effet de PP` varchar(256) DEFAULT NULL,
  `Effet d'EV` varchar(256) DEFAULT NULL,
  `Effet de talent` varchar(256) DEFAULT NULL,
  `Effet de niveau` varchar(256) DEFAULT NULL,
  `Prix de vente` int(10) UNSIGNED DEFAULT NULL,
  `Prix de revente` int(10) UNSIGNED DEFAULT NULL,
  `ID` int(10) UNSIGNED NOT NULL,
  PRIMARY KEY (`ID`),
  UNIQUE KEY `ID` (`ID`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------

--
-- Structure de la table `objet rare`
--

DROP TABLE IF EXISTS `objet rare`;
CREATE TABLE IF NOT EXISTS `objet rare` (
  `Nom` varchar(256) DEFAULT NULL,
  `Image` varchar(256) DEFAULT NULL,
  `Description` varchar(256) DEFAULT NULL,
  `Effet Hors Combat` varchar(256) DEFAULT NULL,
  `Passif` varchar(256) DEFAULT NULL
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------

--
-- Structure de la table `poffin`
--

DROP TABLE IF EXISTS `poffin`;
CREATE TABLE IF NOT EXISTS `poffin` (
  `Nom` varchar(256) DEFAULT NULL,
  `Image` varchar(256) DEFAULT NULL,
  `Description` varchar(256) DEFAULT NULL,
  `Goût` varchar(256) DEFAULT NULL,
  `Épicée` int(10) UNSIGNED DEFAULT NULL,
  `Sèche` int(10) UNSIGNED DEFAULT NULL,
  `Sucrée` int(10) UNSIGNED DEFAULT NULL,
  `Amère` int(10) UNSIGNED DEFAULT NULL,
  `Acide` int(10) UNSIGNED DEFAULT NULL
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------

--
-- Structure de la table `pokéball`
--

DROP TABLE IF EXISTS `pokéball`;
CREATE TABLE IF NOT EXISTS `pokéball` (
  `Nom` varchar(256) DEFAULT NULL,
  `Image` varchar(256) DEFAULT NULL,
  `Description` varchar(256) DEFAULT NULL,
  `Prix de vente` int(255) UNSIGNED DEFAULT NULL,
  `Prix de revente` int(255) UNSIGNED DEFAULT NULL,
  `Bonus Ball` int(255) UNSIGNED DEFAULT NULL
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4;

--
-- Déchargement des données de la table `pokéball`
--

INSERT INTO `pokéball` (`Nom`, `Image`, `Description`, `Prix de vente`, `Prix de revente`, `Bonus Ball`) VALUES
('Poké Ball', NULL, 'Un objet semblable à une capsule, qui capture les Pokémon sauvages. Il suffit pour cela de le lancer comme une balle.', 200, 100, 1),
('Octo Ball', NULL, 'Reçu en récompense. Équivaut à une Master Ball', 50000, 25000, 255);

-- --------------------------------------------------------

--
-- Structure de la table `pokébloc`
--

DROP TABLE IF EXISTS `pokébloc`;
CREATE TABLE IF NOT EXISTS `pokébloc` (
  `Nom` varchar(256) DEFAULT NULL,
  `Image` varchar(256) DEFAULT NULL,
  `Description` varchar(256) DEFAULT NULL,
  `Goût` varchar(256) DEFAULT NULL,
  `Épicée` int(10) UNSIGNED DEFAULT NULL,
  `Sèche` int(10) UNSIGNED DEFAULT NULL,
  `Sucrée` int(10) UNSIGNED DEFAULT NULL,
  `Amère` int(10) UNSIGNED DEFAULT NULL,
  `Acide` int(10) UNSIGNED DEFAULT NULL
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------

--
-- Structure de la table `pokémon`
--

DROP TABLE IF EXISTS `pokémon`;
CREATE TABLE IF NOT EXISTS `pokémon` (
  `Numéro` int(4) UNSIGNED NOT NULL,
  `Nom` varchar(256) DEFAULT NULL,
  `Surnom` varchar(256) DEFAULT NULL,
  `Image` varchar(256) DEFAULT NULL,
  `Description` varchar(256) DEFAULT NULL,
  `Empreinte` varchar(256) DEFAULT NULL,
  `Type` varchar(256) DEFAULT NULL,
  `Catégorie` varchar(256) DEFAULT NULL,
  `Forme` varchar(256) DEFAULT NULL,
  `Shiny` int(1) UNSIGNED DEFAULT NULL,
  `Méga-évolution` int(1) UNSIGNED DEFAULT NULL,
  `Dynamax` int(1) UNSIGNED DEFAULT NULL,
  `Gigamax` int(1) UNSIGNED DEFAULT NULL,
  `Taille` decimal(10,2) UNSIGNED DEFAULT NULL,
  `Poids` decimal(10,2) UNSIGNED DEFAULT NULL,
  `Talent` varchar(256) DEFAULT NULL,
  `Groupe d'oeuf` varchar(256) DEFAULT NULL,
  `Éclosion` int(10) UNSIGNED DEFAULT NULL,
  `Point d'effort` int(10) UNSIGNED DEFAULT NULL,
  `Catégorie point d'effort` varchar(256) DEFAULT NULL,
  `Point d'expérience` int(10) UNSIGNED DEFAULT NULL,
  `Expérience au niveau 100` int(30) UNSIGNED DEFAULT NULL,
  `Sexe` varchar(10) DEFAULT NULL,
  `Mâle` int(3) UNSIGNED DEFAULT NULL,
  `Femelle` int(3) UNSIGNED DEFAULT NULL,
  `Asexué` int(3) UNSIGNED DEFAULT NULL,
  `Taux de capture` int(3) UNSIGNED DEFAULT NULL,
  `Prévolution` varchar(256) DEFAULT NULL,
  `Évolution` varchar(256) DEFAULT NULL,
  `Capacité par niveau` varchar(256) DEFAULT NULL,
  `Capacité par CT/CS` varchar(256) DEFAULT NULL,
  `Capacité par donneur` varchar(256) DEFAULT NULL,
  `Capacité par reproduction` varchar(256) DEFAULT NULL,
  `Dresseur d'origine` varchar(256) DEFAULT NULL,
  `Niveau` int(3) UNSIGNED DEFAULT NULL,
  `Expérience` int(30) UNSIGNED DEFAULT NULL,
  `Pokerus` int(2) UNSIGNED DEFAULT NULL,
  `Objet Tenu` varchar(256) DEFAULT NULL,
  `Ruban` varchar(256) DEFAULT NULL,
  `PV` int(5) UNSIGNED DEFAULT NULL,
  `EV PV` int(5) UNSIGNED DEFAULT NULL,
  `IV PV` int(5) UNSIGNED DEFAULT NULL,
  `Attaque` int(5) UNSIGNED DEFAULT NULL,
  `EV Attaque` int(5) UNSIGNED DEFAULT NULL,
  `IV Attaque` int(5) UNSIGNED DEFAULT NULL,
  `Défense` int(5) UNSIGNED DEFAULT NULL,
  `EV Défense` int(5) UNSIGNED DEFAULT NULL,
  `IV Défense` int(5) UNSIGNED DEFAULT NULL,
  `Attaque Spéciale` int(5) UNSIGNED DEFAULT NULL,
  `EV Attaque Spéciale` int(5) UNSIGNED DEFAULT NULL,
  `IV Attaque Spéciale` int(5) UNSIGNED DEFAULT NULL,
  `Défense Spéciale` int(5) UNSIGNED DEFAULT NULL,
  `EV Défense Spéciale` int(5) UNSIGNED DEFAULT NULL,
  `IV Défense Spéciale` int(5) UNSIGNED DEFAULT NULL,
  `Bonheur` int(5) UNSIGNED DEFAULT NULL,
  `Sang-Froid` int(255) UNSIGNED NOT NULL DEFAULT '0',
  `Beauté` int(255) UNSIGNED NOT NULL DEFAULT '0',
  `Grâce` int(255) UNSIGNED NOT NULL DEFAULT '0',
  `Intelligence` int(255) UNSIGNED NOT NULL DEFAULT '0',
  `Robustesse` int(255) UNSIGNED NOT NULL DEFAULT '0',
  PRIMARY KEY (`Numéro`),
  UNIQUE KEY `Numéro` (`Numéro`),
  KEY `Numéro_2` (`Numéro`),
  KEY `Numéro_3` (`Numéro`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4;

--
-- Déchargement des données de la table `pokémon`
--

INSERT INTO `pokémon` (`Numéro`, `Nom`, `Surnom`, `Image`, `Description`, `Empreinte`, `Type`, `Catégorie`, `Forme`, `Shiny`, `Méga-évolution`, `Dynamax`, `Gigamax`, `Taille`, `Poids`, `Talent`, `Groupe d'oeuf`, `Éclosion`, `Point d'effort`, `Catégorie point d'effort`, `Point d'expérience`, `Expérience au niveau 100`, `Sexe`, `Mâle`, `Femelle`, `Asexué`, `Taux de capture`, `Prévolution`, `Évolution`, `Capacité par niveau`, `Capacité par CT/CS`, `Capacité par donneur`, `Capacité par reproduction`, `Dresseur d'origine`, `Niveau`, `Expérience`, `Pokerus`, `Objet Tenu`, `Ruban`, `PV`, `EV PV`, `IV PV`, `Attaque`, `EV Attaque`, `IV Attaque`, `Défense`, `EV Défense`, `IV Défense`, `Attaque Spéciale`, `EV Attaque Spéciale`, `IV Attaque Spéciale`, `Défense Spéciale`, `EV Défense Spéciale`, `IV Défense Spéciale`, `Bonheur`, `Sang-Froid`, `Beauté`, `Grâce`, `Intelligence`, `Robustesse`) VALUES
(1, 'Bulbizarre', NULL, NULL, NULL, NULL, 'Plante, Poison', 'Pokémon Graine', NULL, NULL, NULL, NULL, NULL, '0.70', '6.90', 'Engrais, Chloriohylle', 'Monstrueux, Végétal', 5120, 1, 'Attaque Spéciale', 64, 1059860, NULL, 88, 13, 0, 45, NULL, 'Herbizarre', 'Charge, Rugissement, Fouet Lianes, Croissance, Vampigraine, Tranch\'Herbe, Poudre Dodo, Poudre Toxic, Canon Graine, Bélier, Doux Parfum, Synthèse, Soucigraine, Damoclès, Lance-Soleil', 'CT10, CT 11, CT 17, CT19, CT21, CT24, CT25, CT28, CT29, CT31, CT34, CT39, CT41, CT46, CT50, CT74, CT76, CT88, CT94, DT00, DT01, DT17, DT20, DT22, DT26, DT27, DT59, DT65, DT71, DT72, DT77, DT85', 'Aire d\'Herbe, Canon Graine, Étreinte, Giga-Sangsue, Ronflement, Sabotage, Soucigraine, Synthèse, Gliss\'Herbe', 'Amnésie, Charme, Champ Herbu, Coud\'Krâne, Danse-Fleur, Détritus, Feuille Magik, Force-Nature, Giga-Sangsue, Malédiction, Mégafouet, Racines, Siffl\'Herbe, Tempête Verte, Ténacité, Tempête Florale, Toxik', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, 0, 0, 0);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
