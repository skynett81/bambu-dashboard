---
sidebar_position: 5
title: PWA
description: Bambu Dashboard installeren als Progressive Web App voor een app-achtige ervaring, offlinemodus en achtergrondsnotificaties
---

# PWA (Progressive Web App)

Bambu Dashboard kan worden geïnstalleerd als een Progressive Web App (PWA) — een app-achtige ervaring rechtstreeks vanuit de browser, zonder app store. U krijgt snellere toegang, pushnotificaties op de achtergrond en beperkte offline functionaliteit.

## Installeren als app

### Desktop (Chrome / Edge / Chromium)

1. Open `https://localhost:3443` in de browser
2. Zoek naar het **Installeren**-icoon in de adresbalk (pijl omlaag met schermicoon)
3. Klik erop
4. Klik **Installeren** in het dialoogvenster
5. Bambu Dashboard opent als een eigen venster zonder browser-UI

Alternatief: klik op de drie puntjes (⋮) → **Bambu Dashboard installeren...**

### Desktop (Firefox)

Firefox ondersteunt geen volledige PWA-installatie. Gebruik Chrome of Edge voor de beste ervaring.

### Mobiel (Android – Chrome)

1. Open **https://ip-van-uw-server:3443** in Chrome
2. Tik op de drie puntjes → **Toevoegen aan startscherm**
3. Geef de app een naam en tik **Toevoegen**
4. Het icoon verschijnt op het startscherm — de app opent in volledig scherm zonder browser-UI

### Mobiel (iOS – Safari)

1. Open **https://ip-van-uw-server:3443** in Safari
2. Tik op het **Delen**-icoon (vierkant met pijl omhoog)
3. Scroll naar beneden en kies **Voeg toe aan beginscherm**
4. Tik **Voeg toe**

:::warning iOS-beperkingen
iOS heeft beperkte PWA-ondersteuning. Pushnotificaties werken alleen op iOS 16.4 en nieuwer. Offlinemodus is beperkt.
:::

## Offlinemodus

De PWA slaat benodigde bronnen op in cache voor beperkt offlinegebruik:

| Functie | Offline beschikbaar |
|---|---|
| Laatste bekende printerstatus | ✅ (uit cache) |
| Printgeschiedenis | ✅ (uit cache) |
| Filamentopslag | ✅ (uit cache) |
| Realtime status (MQTT) | ❌ Verbinding vereist |
| Camerafeed | ❌ Verbinding vereist |
| Opdrachten sturen naar printer | ❌ Verbinding vereist |

De offlineweergave toont een banner bovenaan: «Verbinding verbroken — laatste bekende data wordt weergegeven».

## Pushnotificaties op de achtergrond

De PWA kan pushnotificaties sturen ook als de app niet geopend is:

1. Open de PWA
2. Ga naar **Instellingen → Meldingen → Browser Push**
3. Klik **Pushnotificaties activeren**
4. Accepteer het toestemmingsdialoogvenster
5. Notificaties worden bezorgd in het notificatiecentrum van het besturingssysteem

Pushnotificaties werken voor alle gebeurtenissen die zijn geconfigureerd in [Meldingen](../funksjoner/notifications).

:::info Service Worker
Pushnotificaties vereisen dat de browser op de achtergrond actief is (geen volledig afsluiten). De PWA gebruikt een Service Worker voor ontvangst.
:::

## App-icoon en uiterlijk

De PWA gebruikt automatisch het Bambu Dashboard-icoon. Om aan te passen:

1. Ga naar **Instellingen → Systeem → PWA**
2. Upload een aangepast icoon (minimaal 512×512 px PNG)
3. Stel **App-naam** en **Korte naam** in (weergegeven onder het icoon op mobiel)
4. Kies **Themakleur** voor de statusbalk op mobiel

## De PWA bijwerken

De PWA wordt automatisch bijgewerkt wanneer de server wordt bijgewerkt:

- Er verschijnt een subtiele banner: «Nieuwe versie beschikbaar — klik om bij te werken»
- Klik op de banner om de nieuwe versie te laden
- Geen handmatige herinstallatie nodig
