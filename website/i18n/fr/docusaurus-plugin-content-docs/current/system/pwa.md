---
sidebar_position: 5
title: PWA
description: Installez Bambu Dashboard comme Progressive Web App pour une expérience similaire à une application, le mode hors ligne et les notifications en arrière-plan
---

# PWA (Progressive Web App)

Bambu Dashboard peut être installé comme une Progressive Web App (PWA) — une expérience similaire à une application directement depuis le navigateur, sans boutique d'applications. Vous bénéficiez d'un accès plus rapide, de notifications push en arrière-plan et de fonctionnalités hors ligne limitées.

## Installer comme application

### Bureau (Chrome / Edge / Chromium)

1. Ouvrez `https://localhost:3443` dans le navigateur
2. Cherchez l'icône **Installer** dans la barre d'adresse (flèche vers le bas avec icône d'écran)
3. Cliquez dessus
4. Cliquez sur **Installer** dans la boîte de dialogue
5. Bambu Dashboard s'ouvre comme une fenêtre séparée sans interface navigateur

Alternativement : cliquez sur les trois points (⋮) → **Installer Bambu Dashboard...**

### Bureau (Firefox)

Firefox ne prend pas en charge l'installation PWA complète directement. Utilisez Chrome ou Edge pour la meilleure expérience.

### Mobile (Android – Chrome)

1. Ouvrez **https://votre-ip-serveur:3443** dans Chrome
2. Appuyez sur les trois points → **Ajouter à l'écran d'accueil**
3. Donnez un nom à l'application et appuyez sur **Ajouter**
4. L'icône apparaît sur l'écran d'accueil — l'application s'ouvre en plein écran sans interface navigateur

### Mobile (iOS – Safari)

1. Ouvrez **https://votre-ip-serveur:3443** dans Safari
2. Appuyez sur l'icône **Partager** (carré avec flèche vers le haut)
3. Faites défiler vers le bas et sélectionnez **Sur l'écran d'accueil**
4. Appuyez sur **Ajouter**

:::warning Limitations iOS
iOS a un support PWA limité. Les notifications push ne fonctionnent qu'à partir d'iOS 16.4. Le mode hors ligne est limité.
:::

## Mode hors ligne

La PWA met en cache les ressources nécessaires pour une utilisation hors ligne limitée :

| Fonctionnalité | Disponible hors ligne |
|---|---|
| Dernier statut connu des imprimantes | ✅ (depuis le cache) |
| Historique d'impression | ✅ (depuis le cache) |
| Stock de filaments | ✅ (depuis le cache) |
| Statut en temps réel (MQTT) | ❌ Nécessite une connexion |
| Flux caméra | ❌ Nécessite une connexion |
| Envoi de commandes à l'imprimante | ❌ Nécessite une connexion |

L'affichage hors ligne montre une bannière en haut : « Connexion perdue — affichage des dernières données connues ».

## Notifications push en arrière-plan

La PWA peut envoyer des notifications push même si l'application n'est pas ouverte :

1. Ouvrez la PWA
2. Accédez à **Paramètres → Notifications → Push navigateur**
3. Cliquez sur **Activer les notifications push**
4. Acceptez la boîte de dialogue des permissions
5. Les notifications sont livrées au centre de notifications du système d'exploitation

Les notifications push fonctionnent pour tous les événements configurés dans [Notifications](../funksjoner/notifications).

:::info Service Worker
Les notifications push nécessitent que le navigateur s'exécute en arrière-plan (pas d'arrêt complet du système). La PWA utilise un Service Worker pour la réception.
:::

## Icône et apparence de l'application

La PWA utilise automatiquement l'icône Bambu Dashboard. Pour personnaliser :

1. Accédez à **Paramètres → Système → PWA**
2. Téléchargez une icône personnalisée (minimum 512×512 px PNG)
3. Indiquez le **Nom de l'application** et le **Nom court** (affiché sous l'icône sur mobile)
4. Choisissez la **Couleur du thème** pour la barre d'état sur mobile

## Mettre à jour la PWA

La PWA se met à jour automatiquement quand le serveur est mis à jour :

- Une bannière discrète s'affiche : « Nouvelle version disponible — cliquez pour mettre à jour »
- Cliquez sur la bannière pour charger la nouvelle version
- Aucune réinstallation manuelle n'est nécessaire
