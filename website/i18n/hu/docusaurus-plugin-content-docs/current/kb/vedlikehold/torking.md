---
sidebar_position: 5
title: Filament szárítás
description: Miért, mikor és hogyan kell szárítani a filamentet — hőmérsékletek, idők és tárolási tippek minden anyaghoz
---

# Filament szárítás

A nedves filament az egyik leggyakoribb és legtöbbször alábecsült oka a rossz nyomatoknak. A száraznak látszó filament is felszívhat annyi nedvességet, hogy tönkreteszi az eredményt — különösen nylon és PVA esetén.

## Miért kell szárítani a filamentet?

Sok műanyag típus **higroszkópos** — idővel nedvességet szív fel a levegőből. Amikor a nedves filament áthalad a forró fúvókán, a víz hirtelen elpárolog és mikrobubborékokat hoz létre az olvadt anyagban. Az eredmény:

- **Pattanó és kattogó hangok** nyomtatás közben
- **Köd vagy gőz** látható a fúvókából
- **Stringing és hairing**, amely nem hangolható ki
- **Érdes vagy szemcsés felület** — különösen a felső rétegeken
- **Gyenge alkatrészek** rossz réteg-tapadással és mikrorepedésekkel
- **Matt vagy csúnya finish** olyan anyagokon, amelyeknek egyébként fényesnek vagy selyemfényűnek kellene lenniük

:::warning Szárítsa meg a filamentet a beállítások módosítása ELŐTT
Sokan órákat töltenek a visszahúzás és hőmérséklet hangolásával javulás nélkül — mert az ok nedves filament. Mindig szárítsa meg a filamentet és tesztelje újra, mielőtt módosítaná a nyomtatási beállításokat.
:::

## Mely anyagoknak kell szárítás?

Minden műanyag típus megátnedvesedhet, de a higroszkopicitás mértéke óriásian különbözik:

| Anyag | Higroszkópos | Szárítási hőm. | Szárítási idő | Prioritás |
|---|---|---|---|---|
| PLA | Alacsony | 45–50 °C | 4–6 óra | Opcionális |
| PETG | Közepes | 65 °C | 4–6 óra | Ajánlott |
| ABS | Közepes | 65–70 °C | 4 óra | Ajánlott |
| TPU | Közepes | 50–55 °C | 4–6 óra | Ajánlott |
| ASA | Közepes | 65 °C | 4 óra | Ajánlott |
| PC | Magas | 70–80 °C | 6–8 óra | Szükséges |
| PA/Nylon | Rendkívül magas | 70–80 °C | 8–12 óra | SZÜKSÉGES |
| PA-CF | Rendkívül magas | 70–80 °C | 8–12 óra | SZÜKSÉGES |
| PVA | Rendkívül magas | 45–50 °C | 4–6 óra | SZÜKSÉGES |

:::tip A Nylon és PVA kritikus
A PA/Nylon és PVA elegendő nedvességet szívhat fel ahhoz, hogy **néhány óra** alatt nyomtathatatlanná váljon normál beltéri klímában. Soha ne nyisson fel új tekercset ezekből az anyagokból szárítás nélkül — és mindig nyomtasson zárt dobozból vagy szárítóból.
:::

## A nedves filament jelei

Nem mindig kell a táblázat szerint szárítani a filamentet. Tanulja meg felismerni a tüneteket:

| Tünet | Nedvesség? | Egyéb lehetséges okok |
|---|---|---|
| Kattogó/pattogó hangok | Igen, nagyon valószínű | Részben eltömött fúvóka |
| Köd/gőz a fúvókából | Igen, majdnem biztos | Nincs más ok |
| Érdes, szemcsés felület | Igen, lehetséges | Túl alacsony hőm., túl nagy sebesség |
| Stringing, amely nem tűnik el | Igen, lehetséges | Rossz visszahúzás, túl magas hőm. |
| Gyenge, törékeny alkatrészek | Igen, lehetséges | Túl alacsony hőm., rossz kitöltés |
| Színváltozás vagy matt felület | Igen, lehetséges | Rossz hőmérséklet, megégett anyag |

## Szárítási módszerek

### Filament szárító (ajánlott)

A dedikált filament szárítók a legegyszerűbb és legbiztonságosabb megoldás. Pontos hőmérsékletet tartanak fenn és lehetővé teszik a nyomtatást közvetlenül a szárítóból az egész munka alatt.

Népszerű modellek:
- **eSun eBOX** — megfizethető, nyomtathat a dobozból, legtöbb anyagot támogat
- **Bambu Lab Filament Dryer** — Bambu AMS-re optimalizálva, magas hőmérsékletet támogat
- **Polymaker PolyDryer** — jó hőmérő és jó hőmérséklet-szabályozás
- **Sunlu S2 / S4** — költséghatékony, több tekercs egyszerre

Eljárás:
```
1. Helyezze a tekercseket a szárítóba
2. Állítsa be a fenti táblázat szerinti hőmérsékletet
3. Állítson be időzítőt az ajánlott időre
4. Várjon — ne szakítsa meg a folyamatot idő előtt
5. Nyomtasson közvetlenül a szárítóból, vagy azonnal csomagolja be
```

### Élelmiszer-dehidrátor

Egy közönséges élelmiszer-dehidrátor meglepően jól működik filament szárítóként:

- Megfizethető vételár
- Jó levegő-keringés
- Sok modellen 70–75 °C-ig támogat hőmérsékleteket

:::warning Ellenőrizze a dehidrátor maximális hőmérsékletét
Sok olcsó élelmiszer-dehidrátor pontatlan termosztáttal rendelkezik és ±10 °C-ot is ingadozhat. Mérje meg a tényleges hőmérsékletet hőmérővel a PA és PC esetén, amelyek magas hőt igényelnek.
:::

### Sütő

A konyhai sütő szükség esetén használható, de óvatosságot igényel:

:::danger SOHA ne használjon normál sütőt 60 °C felett PLA esetén — eldeformálódik!
A PLA már 55–60 °C-on megpuhul. A meleg sütő tönkreteheti a tekercseket, megolvaszthatja a magot és használhatatlanná teheti a filamentet. Soha ne használjon sütőt PLA esetén, hacsak nem biztos abban, hogy a hőmérséklet pontosan kalibrált és 50 °C alatt van.
:::

Magasabb hőmérsékletet elviselő anyagokhoz (ABS, ASA, PA, PC):
```
1. Melegítse elő a sütőt a kívánt hőmérsékletre
2. Hőmérővel ellenőrizze a tényleges hőmérsékletet
3. Helyezze a tekercseket rácsra (ne közvetlenül a sütő aljára)
4. Hagyja résnyire nyitva az ajtót, hogy a nedvesség el tudjon párologni
5. Figyeljen első alkalommal, amikor ezt a módszert használja
```

### Bambu Lab AMS

A Bambu Lab AMS Lite és AMS Pro beépített szárítási funkcióval rendelkezik (alacsony hő + levegő-keringés). Ez nem helyettesíti a teljes szárítást, de fenntartja a már megszárított filament szárazságát nyomtatás közben.

- AMS Lite: Passzív szárítás — korlátozza a nedvességfelvételt, nem aktívan szárít
- AMS Pro: Aktív fűtés — némi szárítás lehetséges, de nem olyan hatékony, mint egy dedikált szárító

## Filament tárolása

A megfelelő tárolás szárítás után ugyanolyan fontos, mint maga a szárítási folyamat:

### Legjobb megoldások

1. **Száraz szekrény szilika-géllel** — dedikált szekrény higromérővel és szárítószerrel. A páratartalmat stabilan alacsonyan tartja (ideálisan 20% RH alatt)
2. **Vákuum tasakok** — szívja ki a levegőt és zárja le szárítószerrel belül. A legolcsóbb hosszú távú tárolás
3. **Ziplock tasakok szárítószerrel** — egyszerű és hatékony rövidebb időszakokra

### Szilika-gél és szárítószerek

- **Kék/narancssárga szilika-gél** jelzi a telítettségi fokot — cserélje ki vagy regenerálja (szárítsa sütőben 120 °C-on), amikor megváltozik a színe
- **Granulált szilika-gél** hatékonyabb, mint a por
- **Szárítószer-csomagok** filamentgyártóktól regenerálhatók és újrahasználhatók

### Higromérő a tároló dobozban

Egy olcsó digitális higromérő mutatja a dobozban lévő aktuális páratartalmat:

| Relatív páratartalom (RH) | Állapot |
|---|---|
| 15% alatt | Ideális |
| 15–30% | Jó a legtöbb anyaghoz |
| 30–50% | Elfogadható PLA és PETG esetén |
| 50% felett | Problémás — különösen PA, PVA, PC esetén |

## Gyakorlati tippek

- **Szárítson közvetlenül nyomtatás ELŐTT** — a megszárított filament napok alatt újra megátnedvesedhet normál beltéri klímában
- **Nyomtasson a szárítóból** PA, PC és PVA esetén — ne csak szárítsa meg és tegye félre
- **Új tekercs ≠ száraz tekercs** — a gyártók szárítószerrel pecsételik le, de a tárolási lánc csődöt mondhatott. Mindig szárítsa meg a higroszkópos anyagok új tekercseit
- **Jelölje meg a megszárított tekercseket** a szárítás dátumával
- **Dedikált PTFE cső** a szárítótól a nyomtatóig minimalizálja az expozíciót nyomtatás közben

## Bambu Dashboard és szárítási állapot

A Bambu Dashboard lehetővé teszi a filament-információk naplózását, beleértve az utolsó szárítás dátumát a filamentprofilokban. Használja ezt annak nyomon követéséhez, hogy mely tekercsek frissen szárítottak és melyeknek van szükségük egy új körre.
