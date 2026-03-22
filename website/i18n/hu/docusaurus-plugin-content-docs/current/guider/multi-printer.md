---
sidebar_position: 6
title: Több nyomtató
description: Több Bambu nyomtató beállítása és kezelése a Bambu Dashboardban — flottaáttekintés, sor és lépcsőzetes indítás
---

# Több nyomtató

Van egynél több nyomtatód? A Bambu Dashboard flottakezelésre lett tervezve — egyetlen helyről figyelheted, irányíthatod és koordinálhatod az összes nyomtatót.

## Új nyomtató hozzáadása

1. Menj a **Beállítások → Nyomtatók** menüpontra
2. Kattints a **+ Nyomtató hozzáadása** gombra
3. Töltsd ki:

| Mező | Példa | Magyarázat |
|------|-------|------------|
| Eszközszám (SN) | 01P... | Megtalálható a Bambu Handyben vagy a nyomtató képernyőjén |
| IP-cím | 192.168.1.101 | LAN módhoz (ajánlott) |
| Hozzáférési kód | 12345678 | 8 jegyű kód a nyomtató képernyőjén |
| Név | „Bambu #2 - P1S" | Megjelenik a dashboardban |
| Modell | P1P, P1S, X1C, A1 | Válaszd ki a megfelelő modellt a helyes ikonokhoz és funkciókhoz |

4. Kattints a **Kapcsolat tesztelése** gombra — zöld állapotot kell látnod
5. Kattints a **Mentés** gombra

:::tip Adj leíró neveket a nyomtatóknak
A „Bambu 1" és „Bambu 2" zavaró. Használj olyan neveket, mint az „X1C - Gyártás" és „P1S - Prototípusok", hogy áttekinthető maradjon.
:::

## A flottaáttekintő

Miután az összes nyomtató hozzá van adva, együtt jelennek meg a **Flotta** panelen. Itt láthatod:

```
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│ X1C - Gyártás   │  │ P1S - Prototíp. │  │ A1 - Hobbyterem │
│ ████████░░ 82%  │  │ Szabad          │  │ ████░░░░░░ 38%  │
│ 1ó 24p maradt   │  │ Nyomtatásra kész│  │ 3ó 12p maradt   │
│ Hőm.: 220/60°C  │  │ AMS: 4 tekercs  │  │ Hőm.: 235/80°C  │
└─────────────────┘  └─────────────────┘  └─────────────────┘
```

Lehetőségeid:
- Kattints egy nyomtatóra a teljes részletes nézethez
- Az összes hőmérsékletet, AMS-állapotot és aktív hibát egyszerre tekintsd meg
- Szűrj állapot szerint (aktív nyomtatások, szabad, hibás)

## Nyomtatási sor — munkaelosztás

A nyomtatási sor lehetővé teszi, hogy az összes nyomtató nyomtatásait egyetlen helyről tervezd meg.

**Így működik:**
1. Menj a **Sor** menüpontra
2. Kattints a **+ Feladat hozzáadása** gombra
3. Válaszd ki a fájlt és a beállításokat
4. Válaszd ki a nyomtatót, vagy válaszd az **Automatikus hozzárendelés** opciót

### Automatikus hozzárendelés
Az automatikus hozzárendeléssel a dashboard a nyomtatót a következők alapján választja ki:
- Szabad kapacitás
- Az AMS-ben elérhető filament
- Tervezett karbantartási ablak

Engedélyezd a **Beállítások → Sor → Automatikus hozzárendelés** menüpontban.

### Prioritás
Húzd és ejtsd a feladatokat a sorban a sorrend módosításához. A **Magas prioritású** feladat megelőzi a normál feladatokat.

## Lépcsőzetes indítás — áramcsúcs elkerülése

Ha egyszerre sok nyomtatót indítasz el, a felmelegítési fázis erős áramcsúcsot okozhat. A lépcsőzetes indítás elosztja az indítást:

**Így engedélyezd:**
1. Menj a **Beállítások → Flotta → Lépcsőzetes indítás** menüpontra
2. Engedélyezd az **Elosztott indítás** opciót
3. Állítsd be a késleltetést a nyomtatók között (ajánlott: 2–5 perc)

**Példa 3 nyomtatóval és 3 perces késleltetéssel:**
```
08:00 — 1. nyomtató elkezdi a felmelegítést
08:03 — 2. nyomtató elkezdi a felmelegítést
08:06 — 3. nyomtató elkezdi a felmelegítést
```

:::tip Biztosítékméretezés szempontjából releváns
Egy X1C körülbelül 1000W-ot fogyaszt felmelegítés közben. Három nyomtató egyszerre = 3000W, ami 16A-es biztosítékot válthat ki. A lépcsőzetes indítás kiküszöböli a problémát.
:::

## Nyomtatócsoportok

A nyomtatócsoportok lehetővé teszik a nyomtatók logikus szervezését és parancsok küldését az egész csoportnak:

**Csoport létrehozása:**
1. Menj a **Beállítások → Nyomtatócsoportok** menüpontra
2. Kattints a **+ Új csoport** gombra
3. Adj nevet a csoportnak (pl. „Gyártósor", „Hobbyterem")
4. Add hozzá a nyomtatókat a csoporthoz

**Csoportfunkciók:**
- Összesített statisztikák megtekintése a csoporthoz
- Szünet parancs küldése az egész csoportnak egyszerre
- Karbantartási ablak beállítása a csoporthoz

## Összes nyomtató figyelése

### Többnézetes kamera
Menj a **Flotta → Kameranézet** menüpontra az összes kamerafolyam egymás melletti megtekintéséhez:

```
┌──────────────┐  ┌──────────────┐
│  X1C Feed    │  │  P1S Feed    │
│  [Élő]       │  │  [Szabad]    │
└──────────────┘  └──────────────┘
┌──────────────┐  ┌──────────────┐
│  A1 Feed     │  │  + Hozzáadás │
│  [Élő]       │  │              │
└──────────────┘  └──────────────┘
```

### Értesítések nyomtatónként
Különböző értesítési szabályokat konfigurálhatsz különböző nyomtatókhoz:
- Gyártónyomtató: mindig értesítés, éjszaka is
- Hobbynyomtató: csak nappal értesítés

Lásd az [Értesítések](./varsler-oppsett) oldalt a beállításhoz.

## Tippek flottaüzemeltetéshez

- **Szabványosítsd a filamenthelyet**: Tartsd a PLA fehéret az 1. helyen, a PLA feketét a 2. helyen minden nyomtatón — így könnyebb a munkaelosztás
- **Ellenőrizd az AMS szintjeket naponta**: Lásd a [Napi használat](./daglig-bruk) oldalt a reggeli rutinhoz
- **Karbantartás felváltva**: Ne tarts egyszerre karbantartást az összes nyomtatón — mindig tartsd legalább az egyiket aktívan
- **Nevezd el a fájlokat egyértelműen**: Az olyan fájlnevek, mint a `logo_x1c_pla_0.2mm.3mf`, megkönnyítik a megfelelő nyomtató kiválasztását
