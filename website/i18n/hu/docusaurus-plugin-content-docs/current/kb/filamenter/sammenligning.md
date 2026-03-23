---
sidebar_position: 9
title: Anyagok összehasonlítása
description: Hasonlítsa össze az összes 3D nyomtatási anyagot egymás mellett — szilárdság, hőmérséklet, ár, nehézség
---

# Anyagok összehasonlítása

A megfelelő filament kiválasztása ugyanolyan fontos, mint a megfelelő eszköz megválasztása egy munkához. Ez a cikk teljes képet nyújt — az egyszerű összehasonlítási táblázattól a Shore keménységig, HDT értékekig és egy praktikus döntési útmutatóig.

## Nagy összehasonlítási táblázat

| Anyag | Szilárdság | Hőállóság | Rugalmasság | UV-állóság | Kémiai áll. | Fúvóka igény | Kamra | Nehézség | Ár |
|---|---|---|---|---|---|---|---|---|---|
| PLA | ★★★ | ★ | ★ | ★ | ★ | Réz | Nem | ★ Könnyű | Alacsony |
| PETG | ★★★ | ★★ | ★★ | ★★ | ★★★ | Réz | Nem | ★★ | Alacsony |
| ABS | ★★★ | ★★★ | ★★ | ★ | ★★ | Réz | IGEN | ★★★ | Alacsony |
| ASA | ★★★ | ★★★ | ★★ | ★★★★ | ★★ | Réz | IGEN | ★★★ | Közepes |
| TPU | ★★ | ★★ | ★★★★★ | ★★ | ★★ | Réz | Nem | ★★★ | Közepes |
| PA (Nylon) | ★★★★ | ★★★ | ★★★ | ★★ | ★★★★ | Réz | IGEN | ★★★★ | Magas |
| PA-CF | ★★★★★ | ★★★★ | ★★ | ★★★ | ★★★★ | Edzett acél | IGEN | ★★★★ | Magas |
| PC | ★★★★ | ★★★★ | ★★ | ★★ | ★★★ | Réz | IGEN | ★★★★ | Magas |
| PLA-CF | ★★★★ | ★★ | ★ | ★ | ★ | Edzett acél | Nem | ★★ | Közepes |

**Magyarázat:**
- ★ = gyenge/alacsony/rossz
- ★★★ = közepes/standard
- ★★★★★ = kiváló/legjobb a kategóriájában

---

## Válasszon megfelelő anyagot — döntési útmutató

Nem biztos a választásban? Kövesse ezeket a kérdéseket:

### Hőt kell-e elviselnie?
**Igen** → ABS, ASA, PC vagy PA

- Kevés hő (~90 °C-ig): **ABS** vagy **ASA**
- Sok hő (100 °C felett): **PC** vagy **PA**
- Maximális hőállóság: **PC** (~120 °C-ig) vagy **PA-CF** (~160 °C-ig)

### Rugalmasságra van szüksége?
**Igen** → **TPU**

- Nagyon puha (mint a gumi): TPU 85A
- Standard rugalmas: TPU 95A
- Félig rugalmas: PETG vagy PA

### Kültéren fogják-e használni?
**Igen** → **ASA** az egyértelmű választás

Az ASA kifejezetten UV-expozícióra lett kifejlesztve és kültéren felülmúlja az ABS-t. A PETG a második legjobb választás, ha az ASA nem elérhető.

### Maximális szilárdságra van szüksége?
**Igen** → **PA-CF** vagy **PC**

- Legerősebb könnyű kompozit: **PA-CF**
- Legerősebb tiszta hőre lágyuló műanyag: **PC**
- Jó szilárdság alacsonyabb áron: **PA (Nylon)**

### A lehető legegyszerűbb nyomtatás?
→ **PLA**

A PLA a legmegbocsátóbb anyag, ami létezik. Legalacsonyabb hőmérséklet, nincs kamra-követelmény, alacsony warping kockázat.

### Élelmiszer-kontaktus?
→ **PLA** (fenntartásokkal)

A PLA önmagában nem mérgező, de:
- Használjon rozsdamentes acél fúvókát (nem rezet — ólmot tartalmazhat)
- Az FDM nyomatok soha nem "élelmiszer-biztosak" a porózus felület miatt — baktériumok szaporodhatnak
- Kerülje az igényes környezeteket (savak, forró víz, mosogatógép)
- A PETG jobb alternatíva egyszeri kontaktushoz

---

## Shore keménység magyarázata

A Shore keménységet az elasztomerek és műanyag anyagok keménységének és merevségének leírására használják. A 3D nyomtatásnál különösen releváns a TPU és más rugalmas filamentek esetén.

### Shore A — rugalmas anyagok

A Shore A skála 0-tól (rendkívül puha, majdnem mint a gél) 100-ig (rendkívül kemény gumi) terjed. A 90A feletti értékek merev műanyag anyagokhoz kezdenek közeledni.

| Shore A érték | Érzékelt keménység | Példa |
|---|---|---|
| 30A | Rendkívül puha | Szilikon, zselé |
| 50A | Nagyon puha | Puha gumi, fülhallgató-dugó |
| 70A | Puha | Autógumi, futócipő talpbetét |
| 85A | Közepesen puha | Kerékpár gumiabroncs, puha TPU filamentek |
| 95A | Félig kemény | Standard TPU filament |
| 100A ≈ 55D | Skálák határán | — |

**A TPU 95A** az ipari szabvány a 3D nyomtatásban és jó egyensúlyt biztosít a rugalmasság és nyomtathatóság között. A **TPU 85A** nagyon puha és több türelmet igényel nyomtatás közben.

### Shore D — merev anyagok

A Shore D keményebb hőre lágyuló műanyagokhoz használatos:

| Anyag | Hozzávetőleges Shore D |
|---|---|
| PLA | ~80D |
| PETG | ~70D |
| ABS | ~75D |
| PC | ~80D |
| PA (Nylon) | ~70–75D |

:::tip Nem ugyanaz
A Shore A 95 és Shore D 40 nem ugyanaz, még ha a számok közelinek is tűnnek. A skálák különbözők és csak részben fedik át egymást a 100A/55D határ körül. Mindig ellenőrizze, melyik skálát adja meg a szállító.
:::

---

## Hőmérsékleti tűrőképesség — HDT és VST

Tudni, hogy melyik hőmérsékleten kezd meghibásodni egy anyag, kritikus a funkcionális alkatrészeknél. Két standard mérést használnak:

- **HDT (Heat Deflection Temperature)** — az a hőmérséklet, amelyen az anyag 0,25 mm-t hajlik standardizált terhelés alatt. Az üzemi hőmérséklet mérőszáma terhelés alatt.
- **VST (Vicat Softening Temperature)** — az a hőmérséklet, amelyen egy standardizált tű 1 mm-t süllyed az anyagba. Az abszolút lágyulási pont mérőszáma terhelés nélkül.

| Anyag | HDT (°C) | VST (°C) | Gyakorlati max. hőm. |
|---|---|---|---|
| PLA | 52–60 | 55–65 | ~50 °C |
| PETG | 70–80 | 75–85 | ~70 °C |
| ABS | 85–105 | 95–110 | ~90 °C |
| ASA | 90–105 | 95–108 | ~90 °C |
| TPU | 40–70 | változó | ~60 °C |
| PA (Nylon) | 70–180 | 180–220 | ~80–160 °C |
| PA-CF | 100–200 | 200–230 | ~100–180 °C |
| PC | 120–140 | 145–160 | ~120 °C |
| PLA-CF | 55–65 | 60–70 | ~55 °C |

:::warning PLA meleg környezetben
A PLA alkatrészek egy autóban nyáron katasztrófa receptje. Egy parkolt autó műszerfalán 80–90 °C is lehet. Használjon ABS-t, ASA-t vagy PETG-t mindenhez, ami napfénynek vagy hőnek lehet kitéve.
:::

:::info A PA változatoknak nagyon eltérő tulajdonságaik vannak
A PA anyagcsalád, nem egyetlen anyag. A PA6 alacsonyabb HDT-vel rendelkezik (~70 °C), míg a PA12 és PA6-CF 160–200 °C-on lehet. Mindig ellenőrizze az adatlapot az adott filamenthez.
:::

---

## Fúvóka követelmények

### Réz fúvóka (standard)

Minden anyaghoz működik **karbonszálas vagy üvegszálas** töltőanyag **nélkül**:
- PLA, PETG, ABS, ASA, TPU, PA, PC, PVA
- A réz puha és gyorsan kopik abrazív anyagoktól

### Edzett acél fúvóka (kompozitokhoz szükséges)

**SZÜKSÉGES** ezekhez:
- PLA-CF (szénszálas PLA)
- PETG-CF
- PA-CF
- ABS-GF (üvegszálas ABS)
- PPA-CF, PPA-GF
- Minden filament, amelynek nevében "-CF", "-GF", "-HF" vagy "szénszálas" szerepel

Az edzett acélnak alacsonyabb a hővezető képessége, mint a réznek — kompenzáljon +5–10 °C-kal a fúvóka hőmérsékletén.

:::danger A szénszálas filamentek gyorsan tönkreteszik a réz fúvókákat
Egy réz fúvóka már néhány száz gramm CF filament után észrevehetően elkophat. Az eredmény fokozatos alul-extrudálás és pontatlan méretek. Fektessen be edzett acélba, ha kompozitokat nyomtat.
:::

---

## Rövid anyagáttekintés felhasználási terület szerint

| Felhasználási terület | Ajánlott anyag | Alternatíva |
|---|---|---|
| Dekoráció, figurák | PLA, PLA Silk | PETG |
| Funkcionális beltéri alkatrészek | PETG | PLA+ |
| Kültéri expozíció | ASA | PETG |
| Rugalmas alkatrészek, tokok | TPU 95A | TPU 85A |
| Motortér, meleg környezetek | PA-CF, PC | ABS |
| Könnyű, merev konstrukció | PLA-CF | PA-CF |
| Tartóanyag (oldódó) | PVA | HIPS |
| Élelmiszer-kontaktus (korlátozott) | PLA (rozsdamentes fúvóka) | — |
| Maximális szilárdság | PA-CF | PC |
| Átlátszó | PETG átlátszó | PC átlátszó |

Lásd az egyes anyagcikkeket a hőmérséklet-beállítások, hibaelhárítás és ajánlott profilok részletes információiért Bambu Lab nyomtatókhoz.
