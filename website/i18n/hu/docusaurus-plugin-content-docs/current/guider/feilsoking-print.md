---
sidebar_position: 5
title: Sikertelen nyomtatás hibaelhárítása
description: Diagnosztizáld és oldd meg a gyakori nyomtatási hibákat a Bambu Dashboard hibanaplói és eszközei segítségével
---

# Sikertelen nyomtatás hibaelhárítása

Valami rosszul sült el? Ne aggódj — a legtöbb nyomtatási hibának egyszerű megoldása van. A Bambu Dashboard segít gyorsan megtalálni az okot.

## 1. lépés — Ellenőrizd a HMS-hibakódokat

A HMS (Handling, Monitoring, Sensing) a Bambu Labs hibakezelő rendszere. Minden hiba automatikusan naplózódik a dashboardban.

1. Menj a **Megfigyelés → Hibák** menüpontra
2. Keresd meg a sikertelen nyomtatást
3. Kattints a hibakódra a részletes leírásért és a javasolt megoldásért

Gyakori HMS-kódok:

| Kód | Leírás | Gyors megoldás |
|-----|--------|----------------|
| 0700 1xxx | AMS-hiba (elakadás, motorprobléma) | Ellenőrizd a filament útját az AMS-ben |
| 0300 0xxx | Extruziós hiba (alul/felül-extrudálás) | Tisztítsd meg a fúvókát, ellenőrizd a filamentet |
| 0500 xxxx | Kalibrálási hiba | Futtass újrakalibrálást |
| 1200 xxxx | Hőmérsékleti eltérés | Ellenőrizd a kábel csatlakozásait |
| 0C00 xxxx | Kamerahiba | Indítsd újra a nyomtatót |

:::tip Hibakódok az előzményekben
Az **Előzmények → [Nyomtatás] → HMS-napló** menüpontban láthatod az összes hibakódot, amely a folyamat során keletkezett — még akkor is, ha a nyomtatás „befejeződött".
:::

## Gyakori hibák és megoldások

### Rossz tapadás (az első réteg nem tapad)

**Tünetek:** A nyomtatás leválik a lemezről, felkunkorodik, az első réteg hiányzik

**Okok és megoldások:**

| Ok | Megoldás |
|----|---------|
| Piszkos lemez | Töröld meg IPA-alkohollal |
| Helytelen lemezhőmérséklet | Emeld 5°C-kal |
| Helytelen Z-eltolás | Futtasd újra az Auto Bed Leveling-et |
| Hiányzó ragasztóstift (PETG/ABS) | Vigyél fel egy vékony réteg ragasztóstiftet |
| Túl gyors első réteg sebesség | Csökkentsd 20–30 mm/s-ra az első rétegnél |

**Gyors ellenőrzőlista:**
1. Tiszta a lemez? (IPA + szálmentes törlőpapír)
2. Megfelelő lemezt használsz a filament típusához? (lásd [Megfelelő lemez kiválasztása](./velge-rett-plate))
3. Elvégezted-e a Z-kalibrálást az utolsó lemezcsere után?

---

### Vetemedés (a sarkok felemelkednek)

**Tünetek:** A sarkok felfelé hajlanak a lemezről, különösen nagy, lapos modelleknél

**Okok és megoldások:**

| Ok | Megoldás |
|----|---------|
| Hőmérséklet-különbség | Zárd be az elülső ajtót a nyomtatón |
| Hiányzó brim | Engedélyezd a brimet a Bambu Studioban (3–5 mm) |
| Túl hideg lemez | Emeld a lemezhőmérsékletet 5–10°C-kal |
| Nagy zsugorodású filament (ABS) | Engineering Plate + kamrahőmérséklet >40°C |

**Az ABS és az ASA különösen érzékeny.** Mindig biztosítsd:
- Elülső ajtó zárva
- Minimális szellőzés
- Engineering Plate + ragasztóstift
- Kamrahőmérséklet 40°C+

---

### Stringing (szálak a részek között)

**Tünetek:** Finom műanyagszálak a modell különálló részei között

**Okok és megoldások:**

| Ok | Megoldás |
|----|---------|
| Nedves filament | Szárítsd a filamentet 6–8 óráig (60–70°C) |
| Túl magas fúvókahőmérséklet | Csökkentsd 5°C-kal |
| Túl kevés visszahúzás | Növeld a visszahúzás hosszát a Bambu Studioban |
| Túl lassú mozgási sebesség | Növeld az utazási sebességet 200+ mm/s-ra |

**A nedvességteszt:** Figyelj pattanó hangokra, vagy keress buborékokat az extrudálásban — ez nedves filamentre utal. A Bambu AMS beépített páratartalom-mérővel rendelkezik; ellenőrizd a páratartalmat az **AMS-állapot** menüpontban.

:::tip Filamentszárító
Fektess be egy filamentszárítóba (pl. Bambu Filament Dryer), ha nylonnal vagy TPU-val dolgozol — ezek 12 órán belül felszívják a nedvességet.
:::

---

### Spagetti (a nyomtatás összeomlik egy csomóvá)

**Tünetek:** A filament lazán lóg a levegőben, a nyomtatás felismerhetetlen

**Okok és megoldások:**

| Ok | Megoldás |
|----|---------|
| Korai rossz tapadás → leváló → összeomlás | Lásd a tapadás részt fentebb |
| Túl magas sebesség | Csökkentsd a sebességet 20–30%-kal |
| Helytelen támasztékkonfiguráció | Engedélyezd a támasztékot a Bambu Studioban |
| Túl meredek túlnyúlás | Oszd fel a modellt, vagy forgasd 45°-kal |

**Használd a Print Guardot a spagetti automatikus megállításához** — lásd a következő részt.

---

### Alulextrudálás (vékony, gyenge rétegek)

**Tünetek:** A rétegek nem szilárdak, lyukak a falakban, gyenge modell

**Okok és megoldások:**

| Ok | Megoldás |
|----|---------|
| Részlegesen eltömött fúvóka | Végezz hideg lehúzást (Cold Pull, lásd karbantartás) |
| Túl nedves filament | Szárítsd a filamentet |
| Túl alacsony hőmérséklet | Emeld a fúvókahőmérsékletet 5–10°C-kal |
| Túl magas sebesség | Csökkentsd 20–30%-kal |
| Sérült PTFE-cső | Vizsgáld meg és cseréld ki a PTFE-csövet |

## A Print Guard használata automatikus védelemhez

A Print Guard figyelemmel követi a kamerákat a képfelismerés segítségével, és automatikusan leállítja a nyomtatást, ha spagettit észlel.

**A Print Guard engedélyezése:**
1. Menj a **Megfigyelés → Print Guard** menüpontra
2. Engedélyezd az **Automatikus észlelés** opciót
3. Válassz műveletet: **Szünet** (ajánlott) vagy **Megszakítás**
4. Állítsd be az érzékenységet (kezdd **Közepesen**)

**Amikor a Print Guard beavatkozik:**
1. Értesítést kapsz egy kameraképpel arról, amit észlelt
2. A nyomtatás szünetel
3. Választhatsz: **Folytatás** (ha hamis pozitív) vagy **Nyomtatás megszakítása**

:::info Hamis pozitívok
A Print Guard néha sok vékony oszlopból álló modelleken reagálhat. Csökkentse az érzékenységet, vagy ideiglenesen tiltsa le az összetett modellekhez.
:::

## Diagnosztikai eszközök a dashboardban

### Hőmérsékleti napló
Az **Előzmények → [Nyomtatás] → Hőmérsékletek** menüpontban láthatod a hőmérsékleti görbét a teljes nyomtatás során. Figyeld:
- Hirtelen hőmérsékletesések (fúvóka- vagy lemezhiba)
- Egyenetlen hőmérsékletek (kalibrálási igény)

### Filamentstatisztikák
Ellenőrizd, hogy a felhasznált filament megegyezik-e a becslésekkel. Nagy eltérés alulextrudálásra vagy filamenttörésre utalhat.

## Mikor fordulj a támogatáshoz?

Lépj kapcsolatba a Bambu Labs támogatásával, ha:
- A HMS-kód ismétlődik, miután követted az összes javasolt megoldást
- Mechanikai sérülést látsz a nyomtatón (hajlított rudak, törött fogaskerekek)
- A hőmérsékleti értékek lehetetlenek (pl. a fúvóka -40°C-ot mutat)
- A firmware-frissítés nem oldja meg a problémát

**Hasznos, ha kéznél van a támogatáshoz:**
- HMS-hibakódok a dashboard hibanaplójából
- Kamerakép a hibáról
- Melyik filamentet és beállításokat használtad (exportálható az előzményekből)
- Nyomtatómodell és firmware-verzió (megjelenik a **Beállítások → Nyomtató → Információ** menüpontban)
