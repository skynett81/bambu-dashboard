---
sidebar_position: 4
title: Felületi hibák
description: A leggyakoribb felületi problémák diagnosztizálása és javítása — blobs, zits, rétegvonalak, elephant foot és egyebek
---

# Felületi hibák

A 3D nyomat felülete sokat elárul arról, mi történik a rendszerben. A legtöbb felületi hibának egy-két egyértelmű oka van — a megfelelő diagnózissal meglepően egyszerű kijavítani őket.

## Gyors diagnosztikai áttekintés

| Tünet | Leggyakoribb ok | Első lépés |
|---|---|---|
| Blobs és zits | Túl sok extrudálás, varrás elhelyezése | Varrás beállítása, flow kalibrálása |
| Látható rétegvonalak | Z-wobble, túl vastag rétegek | Finomabb rétegre váltás, Z-tengely ellenőrzése |
| Elephant foot | Első réteg túl széles | Elephant foot kompenzáció |
| Ringing/ghosting | Vibráció nagy sebességnél | Sebesség csökkentése, input shaper aktiválása |
| Alul-extrudálás | Eltömött fúvóka, túl alacsony hőmérséklet | Fúvóka tisztítása, hőmérséklet emelése |
| Túl-extrudálás | Túl magas flow rate | Flow rate kalibrálása |
| Pillowing | Túl kevés felső réteg, túl kevés hűtés | Felső rétegek növelése, ventilátor növelése |
| Rétegszétválás | Túl alacsony hőm., túl sok hűtés | Hőmérséklet emelése, ventilátor csökkentése |

---

## Blobs és zits

A blobs-ok szabálytalan csomók a felületen. A zits-ek pont-szerű helyek — általában a varrás mentén.

### Okok

- **Túl-extrudálás** — túl sok anyag extrudálódik és oldalra nyomódik
- **Rossz varrás-elhelyezés** — a standard "nearest" varrás minden átmenetet ugyanarra a helyre koncentrál
- **Visszahúzási probléma** — elégtelen visszahúzás nyomásfelhalmozódást okoz a fúvókában
- **Nedves filament** — a nedvesség mikrobubborékokat és csepegést okoz

### Megoldások

**Varrás beállítások a Bambu Studio-ban:**
```
Bambu Studio → Minőség → Varrás pozíciója
- Aligned: Minden varrás ugyanazon a helyen (látható, de rendezett)
- Nearest: Legközelebbi pont (véletlenszerűen szétszórja a blob-okat)
- Back: Az objektum mögött (ajánlott vizuális minőséghez)
- Random: Véletlenszerű elosztás (legjobban álcázza a varrást)
```

**Flow rate kalibrálás:**
```
Bambu Studio → Kalibrálás → Flow rate
Állítsa be ±2%-os lépésekben, amíg a blobs-ok eltűnnek
```

:::tip Varrás "Back"-re vizuális minőséghez
Helyezze a varrást az objektum hátuljára, hogy a lehető legkevésbé legyen látható. Kombinálja a "Wipe on retract" funkcióval a tisztább varrás-lezáráshoz.
:::

---

## Látható rétegvonalak

Minden FDM nyomatnak van rétegvonala, de ezeknek konzisztensnek és alig láthatónak kell lenniük normál nyomatoknál. A rendellenes láthatóság konkrét problémákra utal.

### Okok

- **Z-wobble** — a Z-tengely vibrál vagy nem egyenes, hullámos mintát hoz létre a teljes magasságban
- **Túl vastag rétegek** — 0,28 mm feletti rétegmagasság még tökéletes nyomatoknál is észrevehető
- **Hőmérséklet-ingadozás** — következetlen olvadási hőmérséklet változó rétegszélességet eredményez
- **Következetlen filament-átmérő** — olcsó filament változó átmérővel

### Megoldások

**Z-wobble:**
- Ellenőrizze, hogy az orsó (Z-leadscrew) tiszta és kent-e
- Ellenőrizze, hogy az orsó nem hajlott-e (vizuális ellenőrzés forgatáskor)
- Lásd a karbantartási cikket a [Z-tengely kenéséhez](/docs/kb/vedlikehold/smoring)

**Rétegmagasság:**
- Váltson 0,12 mm-re vagy 0,16 mm-re egyenletesebb felületért
- Ne feledje, hogy a rétegmagasság felezése megduplázza a nyomtatási időt

**Hőmérséklet-ingadozás:**
- Használjon PID kalibrálást (elérhető a Bambu Studio karbantartási menüjén keresztül)
- Kerülje a huzatot, amely lehűti a fúvókát nyomtatás közben

---

## Elephant foot

Az elephant foot akkor keletkezik, amikor az első réteg szélesebb, mint az objektum többi része — mintha az objektum "kiterülne" az aljánál.

### Okok

- Az első réteg túl erősen van lenyomva az ágyra (Z-offset túl közel)
- A túl magas ágyhőmérséklet túl sokáig tartja az anyagot puhán és folyékonyán
- Az elégtelen hűtés az első rétegen több időt ad az anyagnak a szétterüléshez

### Megoldások

**Elephant foot kompenzáció a Bambu Studio-ban:**
```
Bambu Studio → Minőség → Elephant foot kompenzáció
Kezdje 0,1–0,2 mm-rel és állítsa be, amíg a lába el nem tűnik
```

**Z-offset:**
- Kalibrálja újra az első réteg magasságát
- Emelje a Z-offsetet 0,05 mm-enként, amíg a lába el nem tűnik

**Ágyhőmérséklet:**
- Csökkentse az ágyhőmérsékletet 5–10 °C-kal
- PLA esetén: 55 °C gyakran elegendő — 65 °C elephant foot-ot okozhat

:::warning Ne kompenzáljon túl sokat
A túl magas elephant foot kompenzáció rést hozhat létre az első réteg és a többi között. Óvatosan állítsa 0,05 mm-es lépésekben.
:::

---

## Ringing és ghosting

A ringing (más nevén "ghosting" vagy "echoing") hullámos minta a felületen éles élek vagy sarkok után. A minta "visszhangzik" az élből.

### Okok

- **Vibráció** — a gyors gyorsulás és lassulás a sarkoknál rezgéseket küld a vázon át
- **Túl nagy sebesség** — különösen a 100 mm/s feletti külső fal sebesség jelentős ringing-et okoz
- **Laza alkatrészek** — laza orsó, rezgő kábelvezető vagy rosszul rögzített nyomtató

### Megoldások

**Bambu Lab input shaper (Rezonancia kompenzáció):**
```
Bambu Studio → Nyomtató → Rezonancia kompenzáció
A Bambu Lab X1C és P1S beépített gyorsulásmérővel rendelkezik és automatikusan kalibrálja ezt
```

**Sebesség csökkentése:**
```
Külső fal: Csökkentse 60–80 mm/s-re
Gyorsulás: Csökkentse a standardról 3000–5000 mm/s²-re
```

**Mechanikai ellenőrzés:**
- Ellenőrizze, hogy a nyomtató stabil alapon áll
- Ellenőrizze, hogy az orsó nem vibrál-e a tartóban
- Húzza meg az összes elérhető csavart a váz külső paneljein

:::tip Az X1C és P1S automatikusan kalibrálja a ringing-et
A Bambu Lab X1C és P1S beépített gyorsulásmérő-kalibrációval rendelkezik, amely automatikusan fut indításkor. Futtassa a "Teljes kalibrálás"-t a karbantartási menüből, ha a ringing egy idő után visszatér.
:::

---

## Alul-extrudálás

Az alul-extrudálás akkor keletkezik, amikor a nyomtató túl kevés anyagot extrudál. Az eredmény vékony, gyenge falak, látható hézagok a rétegek között és "rongyos" felület.

### Okok

- **Részben eltömött fúvóka** — szénlerakódás csökkenti az áramlást
- **Túl alacsony fúvóka-hőmérséklet** — az anyag nem eléggé folyékony
- **Elkopott fogaskerék** az extruder-mechanizmusban nem fogja meg eléggé a filamentet
- **Túl nagy sebesség** — az extruder nem tud lépést tartani a kívánt áramlással

### Megoldások

**Hideg húzás (Cold pull):**
```
1. Melegítse fel a fúvókát 220 °C-ra
2. Nyomja be kézzel a filamentet
3. Hűtse a fúvókát 90 °C-ra (PLA) nyomás fenntartásával
4. Húzza ki gyorsan a filamentet
5. Ismételje, amíg a kihúzott anyag tiszta nem lesz
```

**Hőmérséklet-beállítás:**
- Emelje a fúvóka hőmérsékletét 5–10 °C-kal és tesztelje újra
- A túl alacsony hőmérséklet az alul-extrudálás gyakori oka

**Flow rate kalibrálás:**
```
Bambu Studio → Kalibrálás → Flow rate
Fokozatosan növelje, amíg az alul-extrudálás el nem tűnik
```

**Extruder fogaskerék ellenőrzése:**
- Távolítsa el a filamentet és vizsgálja meg a fogaskereket
- Tisztítsa kis kefével, ha filamentpor van a fogakban

---

## Túl-extrudálás

A túl-extrudálás túl széles szálat eredményez — a felület lazának, fényesnek vagy egyenetlennek tűnik, blob-okra való hajlammal.

### Okok

- **Túl magas flow rate** (EM — Extrusion Multiplier)
- **Hibás filament-átmérő** — 2,85 mm-es filament 1,75 mm-es profillal masszív túl-extrudálást okoz
- **Túl magas fúvóka-hőmérséklet** túl folyékonnyá teszi az anyagot

### Megoldások

**Flow rate kalibrálás:**
```
Bambu Studio → Kalibrálás → Flow rate
Csökkentse 2%-os lépésekben, amíg a felület egyenletes és matt nem lesz
```

**Filament átmérő ellenőrzése:**
- Mérje meg a tényleges filament átmérőjét tolómérővel 5–10 helyen a filament mentén
- 0,05 mm feletti átlagos eltérés olcsó filamentre utal

---

## Pillowing

A pillowing buborékos, egyenetlen felső rétegek "párnákkal" az anyagban. Különösen feltűnő kis kitöltésnél és túl kevés felső rétegnél.

### Okok

- **Túl kevés felső réteg** — a kitöltés feletti anyag beleesik a lyukakba
- **Túl kevés hűtés** — az anyag nem szilárdul meg elég gyorsan, hogy áthidalja a kitöltési lyukakat
- **Túl alacsony kitöltés** — nagy lyukak a kitöltésben nehezen áthidalhatók

### Megoldások

**Felső rétegek növelése:**
```
Bambu Studio → Minőség → Felső kéreg rétegek
Minimum: 4 réteg
Ajánlott egyenletes felülethez: 5–6 réteg
```

**Hűtés növelése:**
- A PLA-nál a hűtőventilátor 100%-on legyen a 3. rétegtől
- Az elégtelen hűtés a pillowing leggyakoribb oka

**Kitöltés növelése:**
- Váltson 10–15%-ról 20–25%-ra, ha a pillowing fennmarad
- A Gyroid mintázat egyenletesebb híd-felületet ad, mint a vonalak

:::tip Vasalás (Ironing)
A Bambu Studio "ironing" funkciója egy extra menettel viszi át a fúvókát a felső rétegen a felület egyenletesítéséhez. Aktiválja a Minőség → Ironing menüpontban a legjobb felső réteg-eredményhez.
:::

---

## Rétegszétválás (Layer separation / delamination)

A rétegszétválás akkor következik be, amikor a rétegek nem tapadnak kellően egymáshoz. Súlyos esetben a nyomat a rétegvonalak mentén törik szét.

### Okok

- **Túl alacsony fúvóka-hőmérséklet** — az anyag nem olvad bele kellően az alatta lévő rétegbe
- **Túl sok hűtés** — az anyag túl gyorsan szilárdul, mielőtt összeolvadhatna
- **Túl nagy rétegvastagság** — a fúvóka átmérőjének 80%-a felett rossz fúzió keletkezik
- **Túl nagy sebesség** — csökkentett olvadási idő mm-enként

### Megoldások

**Hőmérséklet emelése:**
- Próbáljon +10 °C-ot a standardtól és figyelje meg
- Az ABS és ASA különösen érzékeny — kontrollált kamra-fűtést igényel

**Hűtés csökkentése:**
- ABS: ventilátor KI (0 %)
- PETG: max. 20–40 %
- PLA: eltűri a teljes hűtést, de csökkentse, ha rétegszétválás keletkezik

**Rétegvastagság:**
- Használjon max. 75%-ot a fúvóka átmérőjéből
- 0,4 mm-es fúvókával: max. ajánlott rétegmagasság 0,30 mm

**Ellenőrizze, hogy a kamra elég meleg-e (ABS/ASA/PA/PC):**
```
Bambu Lab X1C/P1S: Hagyja a kamrát felmelegedni 40–60 °C-ra
a nyomtatás megkezdése előtt — ne nyissa ki az ajtót nyomtatás közben
```

---

## Általános hibaelhárítási tippek

1. **Egyszerre csak egy dolgot változtasson** — kis kalibrációs nyomattal tesztelje minden változtatás között
2. **Először szárítsa meg a filamentet** — sok felületi hiba valójában nedvesség tünete
3. **Tisztítsa meg a fúvókát** — a részleges eltömődés következetlen felületi hibákat okoz, amelyek nehezen diagnosztizálhatók
4. **Futtasson teljes kalibrálást** a Bambu Studio karbantartási menüjéből nagyobb beállítások után
5. **Használja a Bambu Dashboard-ot** annak nyomon követéséhez, hogy mely beállítások adták a legjobb eredményt idővel
