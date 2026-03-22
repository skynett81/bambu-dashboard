---
sidebar_position: 5
title: PWA
description: Telepítsd a Bambu Dashboardot Progressive Web App-ként alkalmazásszerű élményért, offline módért és háttérbeli értesítésekért
---

# PWA (Progressive Web App)

A Bambu Dashboard telepíthető Progressive Web App (PWA) formájában — alkalmazásszerű élmény közvetlenül a böngészőből, alkalmazásbolt nélkül. Gyorsabb hozzáférést, háttérbeli push értesítéseket és korlátozott offline funkcionalitást kapsz.

## Telepítés alkalmazásként

### Asztali gép (Chrome / Edge / Chromium)

1. Nyisd meg a `https://localhost:3443` oldalt a böngészőben
2. Keresd a **Telepítés** ikont a címsorban (lefelé mutató nyíl monitorikonnal)
3. Kattints rá
4. Kattints a **Telepítés** gombra a párbeszédablakban
5. A Bambu Dashboard böngésző-UI nélkül, önálló ablakban nyílik meg

Alternatíva: Kattints a három pontra (⋮) → **Bambu Dashboard telepítése...**

### Asztali gép (Firefox)

A Firefox nem támogatja teljes mértékben a PWA-telepítést. Legjobb élményért használj Chrome-ot vagy Edge-et.

### Mobil (Android – Chrome)

1. Nyisd meg a **https://a-te-szerver-ip:3443** oldalt Chrome-ban
2. Koppints a három pontra → **Hozzáadás a kezdőképernyőhöz**
3. Adj nevet az alkalmazásnak, és koppints a **Hozzáadás** gombra
4. Az ikon megjelenik a kezdőképernyőn — az alkalmazás böngésző-UI nélkül, teljes képernyőn nyílik meg

### Mobil (iOS – Safari)

1. Nyisd meg a **https://a-te-szerver-ip:3443** oldalt Safariban
2. Koppints a **Megosztás** ikonra (felfelé mutató nyíllal rendelkező négyzet)
3. Görgess le, és válaszd a **Hozzáadás a kezdőképernyőhöz** lehetőséget
4. Koppints a **Hozzáadás** gombra

:::warning iOS-korlátozások
Az iOS korlátozott PWA-támogatással rendelkezik. A push értesítések csak iOS 16.4 és újabb verziókban működnek. Az offline mód korlátozott.
:::

## Offline mód

A PWA gyorsítótárba menti a szükséges erőforrásokat a korlátozott offline használathoz:

| Funkció | Elérhető offline |
|---|---|
| Utolsó ismert nyomtatóállapot | ✅ (gyorsítótárból) |
| Nyomtatási előzmények | ✅ (gyorsítótárból) |
| Filamentraktár | ✅ (gyorsítótárból) |
| Valós idejű állapot (MQTT) | ❌ Kapcsolat szükséges |
| Kamerafolyam | ❌ Kapcsolat szükséges |
| Parancsok küldése a nyomtatónak | ❌ Kapcsolat szükséges |

Offline nézetben egy szalagcím jelenik meg felül: „Kapcsolat megszakadt — utolsó ismert adatok láthatók".

## Push értesítések a háttérben

A PWA képes push értesítéseket küldeni, még ha az alkalmazás nincs is nyitva:

1. Nyisd meg a PWA-t
2. Navigálj a **Beállítások → Értesítések → Böngésző push** menüpontra
3. Kattints az **Push értesítések aktiválása** gombra
4. Fogadd el az engedélykérő párbeszédablakot
5. Az értesítések az operációs rendszer értesítési központjába érkeznek

A push értesítések az [Értesítések](../funksjoner/notifications) részben konfigurált összes eseményhez működnek.

:::info Service Worker
A push értesítések megkövetelik, hogy a böngésző a háttérben fusson (nem teljes rendszerleállítás). A PWA Service Workert használ a fogadáshoz.
:::

## Alkalmazásikon és megjelenés

A PWA automatikusan a Bambu Dashboard ikonját használja. Testreszabáshoz:

1. Navigálj a **Beállítások → Rendszer → PWA** menüpontra
2. Tölts fel egyedi ikont (minimum 512×512 px PNG)
3. Adj meg **Alkalmazásnevet** és **Rövid nevet** (mobilon az ikon alatt jelenik meg)
4. Válassz **Témaszínt** a mobilon megjelenő állapotsorhoz

## A PWA frissítése

A PWA automatikusan frissül, amikor a szerver frissül:

- Megjelenik egy diszkrét szalagcím: „Új verzió elérhető — kattints a frissítéshez"
- Kattints a szalagcímre az új verzió betöltéséhez
- Nincs szükség manuális újratelepítésre
