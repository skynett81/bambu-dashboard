---
sidebar_position: 1
title: Bienvenue sur Bambu Dashboard
description: Un tableau de bord puissant et auto-hébergé pour les imprimantes 3D Bambu Lab
---

# Bienvenue sur Bambu Dashboard

[![ko-fi](https://ko-fi.com/img/githubbutton_sm.svg)](https://ko-fi.com/V7V21NRKM7)

**Bambu Dashboard** est un panneau de contrôle complet et auto-hébergé pour les imprimantes 3D Bambu Lab. Il vous offre une vue d'ensemble et un contrôle total sur votre imprimante, le stock de filaments, l'historique d'impression et bien plus — le tout depuis un seul onglet de navigateur.

## Qu'est-ce que Bambu Dashboard ?

Bambu Dashboard se connecte directement à votre imprimante via MQTT sur le réseau local, sans dépendance aux serveurs Bambu Lab. Vous pouvez également vous connecter à Bambu Cloud pour synchroniser les modèles et l'historique d'impression.

### Fonctionnalités principales

- **Tableau de bord en direct** — températures en temps réel, progression, caméra, statut AMS avec indicateur LIVE
- **Stock de filaments** — suivez toutes les bobines avec synchronisation AMS, support bobine EXT, infos matériau, compatibilité plateau et guide de séchage
- **Suivi des filaments** — suivi précis avec 4 niveaux de repli (capteur AMS → estimation EXT → cloud → durée)
- **Guide des matériaux** — 15 matériaux avec températures, compatibilité plateau, séchage, propriétés et conseils
- **Historique d'impression** — journal complet avec noms de modèles, liens MakerWorld, consommation de filament et coûts
- **Planificateur** — vue calendrier, file d'attente d'impression avec équilibrage de charge et vérification du filament
- **Contrôle de l'imprimante** — température, vitesse, ventilateurs, console G-code
- **Print Guard** — protection automatique avec xcam + 5 moniteurs de capteurs
- **Estimateur de coût** — matériau, électricité, main-d'œuvre, usure, marge avec prix de vente suggéré
- **Maintenance** — suivi avec intervalles basés sur la KB, durée de vie de la buse, durée de vie du plateau et guide
- **Alertes sonores** — 9 événements configurables avec téléchargement de son personnalisé et haut-parleur d'imprimante (M300)
- **Journal d'activité** — chronologie persistante de tous les événements (impressions, erreurs, maintenance, filament)
- **Notifications** — 7 canaux (Telegram, Discord, e-mail, ntfy, Pushover, SMS, webhook)
- **Multi-imprimante** — prend en charge toute la gamme Bambu Lab
- **17 langues** — norvégien, anglais, allemand, français, espagnol, italien, japonais, coréen, néerlandais, polonais, portugais, suédois, turc, ukrainien, chinois, tchèque, hongrois
- **Auto-hébergé** — aucune dépendance au cloud, vos données sur votre machine

### Nouveautés de la v1.1.13

- **Détection de bobine EXT** pour P2S/A1 via le champ de mapping MQTT — consommation de filament correctement suivie pour la bobine externe
- **Base de données des matériaux filament** avec 15 matériaux, compatibilité plateau, guide de séchage et propriétés
- **Panneau de maintenance** avec intervalles basés sur la KB, 4 nouveaux types de buses, onglet guide avec liens vers la documentation
- **Alertes sonores** avec 9 événements, téléchargement personnalisé (MP3/OGG/WAV, max 10 s), contrôle du volume et haut-parleur d'imprimante
- **Journal d'activité** — chronologie persistante de toutes les bases de données, que la page soit ouverte ou non
- **Codes d'erreur HMS** avec des descriptions lisibles parmi 270+ codes
- **i18n complet** — toutes les 2944 clés traduites en 17 langues
- **Docs auto-générées** — la documentation est générée automatiquement lors de l'installation et du démarrage du serveur

## Démarrage rapide

| Tâche | Lien |
|-------|------|
| Installer le tableau de bord | [Installation](./kom-i-gang/installasjon) |
| Configurer la première imprimante | [Configuration](./kom-i-gang/oppsett) |
| Connecter Bambu Cloud | [Bambu Cloud](./kom-i-gang/bambu-cloud) |
| Explorer toutes les fonctionnalités | [Fonctionnalités](./funksjoner/oversikt) |
| Guide des filaments | [Guide des matériaux](./kb/filamenter/guide) |
| Guide de maintenance | [Maintenance](./kb/vedlikehold/dyse) |
| Documentation API | [API](./avansert/api) |

:::tip Mode démo
Vous pouvez essayer le tableau de bord sans imprimante physique en exécutant `npm run demo`. Cela démarre 3 imprimantes simulées avec des cycles d'impression en direct.
:::

## Imprimantes prises en charge

Toutes les imprimantes Bambu Lab avec le mode LAN :

- **Série X1** : X1C, X1C Combo, X1E
- **Série P1** : P1S, P1S Combo, P1P
- **Série P2** : P2S, P2S Combo
- **Série A** : A1, A1 Combo, A1 mini
- **Série H2** : H2S, H2D (double buse), H2C (changeur d'outils, 6 têtes)

## Fonctionnalités en détail

### Suivi des filaments

Le tableau de bord suit automatiquement la consommation de filament avec 4 niveaux de repli :

1. **Diff capteur AMS** — le plus précis, compare le remain% de début/fin
2. **EXT direct** — pour P2S/A1 sans vt_tray, utilise l'estimation cloud
3. **Estimation cloud** — données des travaux d'impression Bambu Cloud
4. **Estimation par durée** — ~30 g/heure comme dernier recours

Toutes les valeurs sont affichées comme le minimum entre le capteur AMS et la base de données des bobines pour éviter les erreurs après des impressions échouées.

### Guide des matériaux

Base de données intégrée avec 15 matériaux incluant :
- Températures (buse, plateau, enceinte)
- Compatibilité plateau (Cool, Engineering, High Temp, Textured PEI)
- Informations de séchage (température, durée, hygroscopicité)
- 8 propriétés (résistance, flexibilité, résistance à la chaleur, UV, surface, facilité d'utilisation)
- Niveau de difficulté et exigences spéciales (buse durcie, enceinte)

### Alertes sonores

9 événements configurables avec prise en charge de :
- **Clips audio personnalisés** — téléchargez des MP3/OGG/WAV (max 10 secondes, 500 Ko)
- **Tonalités intégrées** — sons métalliques/synthétiques générés avec l'API Web Audio
- **Haut-parleur d'imprimante** — mélodies G-code M300 directement sur le buzzer de l'imprimante
- **Compte à rebours** — alerte sonore quand il reste 1 minute d'impression

### Maintenance

Système de maintenance complet avec :
- Suivi des composants (buse, tube PTFE, tiges, roulements, AMS, plateau, séchage)
- Intervalles basés sur la KB issus de la documentation
- Durée de vie des buses par type (laiton, acier durci, HS01)
- Durée de vie des plateaux par type (Cool, Engineering, High Temp, Textured PEI)
- Onglet guide avec conseils et liens vers la documentation complète

## Aperçu technique

Bambu Dashboard est construit avec Node.js 22 et du HTML/CSS/JS natif — pas de frameworks lourds, pas d'étape de compilation. La base de données est SQLite, intégrée à Node.js 22.

- **Backend** : Node.js 22 avec seulement 3 paquets npm (mqtt, ws, basic-ftp)
- **Frontend** : Vanilla HTML/CSS/JS, pas d'étape de compilation
- **Base de données** : SQLite via le built-in Node.js 22 `--experimental-sqlite`
- **Documentation** : Docusaurus avec 17 langues, générée automatiquement lors de l'installation
- **API** : 177+ points de terminaison, documentation OpenAPI sur `/api/docs`

Voir [Architecture](./avansert/arkitektur) pour les détails.
