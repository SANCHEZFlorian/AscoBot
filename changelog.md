# Changelog

Toutes les modifications notables apportées à ce projet seront documentées dans ce fichier.

## [Inédit] - 2026-04-16

### Ajouts
- **Système de Salons Vocaux Dynamiques (Module B)** : Introduction du concept "Join To Create". Les utilisateurs peuvent rejoindre un salon maître pour déclencher la création automatique d'un salon vocal temporaire dont ils sont propriétaires.
- **Support Multi-Environnement** : Gestion automatique des tokens et des configurations de base de données selon l'environnement (`development` ou `production`).
- **Initialisation de la Base de Données** : Script d'initialisation automatique des tables MySQL au démarrage du bot pour garantir une structure de données cohérente.
- **Commande `/changelog`** : Nouvelle commande permettant de consulter les dernières mises à jour directement depuis Discord.

### Améliorations
- **Système de Logs (Module A)** : 
    - Amélioration de la journalisation des messages modifiés.
    - Support des messages très longs (envoi sous forme de fichier `.txt` si > 1000 caractères).
    - Prévisualisation des pièces jointes (images) directement dans les logs.
    - Ajout des logs pour les entrées/sorties de membres et les états vocaux.
- **Gestion des Dépendances** : Integration de `mysql2` pour la persistance des données et `canvas` pour les futures fonctionnalités graphiques.

---
*Note : Ce changelog est généré automatiquement suite aux dernières modifications du système de logging et du module vocal.*
