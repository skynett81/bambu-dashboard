---
sidebar_position: 7
title: Különleges anyagok
description: ASA, PC, PP, PVA, HIPS és más különleges anyagok haladó alkalmazásokhoz
---

# Különleges anyagok

A szokásos anyagokon túl számos speciális anyag létezik adott felhasználási esetekhez — UV-álló kültéri alkatrészektől a vízben oldódó tartóanyagig. Íme egy praktikus áttekintés.

---

## ASA (Acrylonitrile Styrene Acrylate)

Az ASA a legjobb alternatíva az ABS helyett kültéri használatra. Szinte azonosan nyomtatható az ABS-sel, de sokkal jobban tűri a napsugárzást és az időjárást.

### Beállítások

| Paraméter | Érték |
|-----------|-------|
| Fúvóka hőmérséklet | 240–260 °C |
| Ágy hőmérséklet | 90–110 °C |
| Kamra hőmérséklet | 45–55 °C |
| Alkatrész hűtés | 0–20% |
| Szárítás | Ajánlott (70 °C / 4–6 ó) |

### Tulajdonságok

- **UV-álló:** Kifejezetten hosszú távú napsugárzásnak tervezve sárgulás vagy repedés nélkül
- **Hőstabil:** Üvegesedési hőmérséklet ~100 °C
- **Ütésálló:** Jobb ütésállóság, mint az ABS
- **Kamra szükséges:** Ugyanúgy warpol, mint az ABS — X1C/P1S adja a legjobb eredményt

:::tip ASA ABS helyett kültéren
Az alkatrész kültéren lesz európai klímában (nap, eső, fagy)? Válassza az ASA-t az ABS helyett. Az ASA sok évig kitart látható degradáció nélkül. Az ABS hónapok után repedezni és sárgulni kezd.
:::

### Felhasználási területek
- Kültéri konzolok, burkolatok és rögzítési pontok
- Autó aerodinamikai alkatrészek, antenna tartók
- Kerti bútorok és kültéri környezet
- Jelzőtáblák és adagolók épületek külső oldalán

---

## PC (Polikarbonát)

A polikarbonát az egyik legerősebb és legütésállóbb 3D nyomtatható műanyag. Átlátszó és rendkívüli hőmérsékleteket visel el.

### Beállítások

| Paraméter | Érték |
|-----------|-------|
| Fúvóka hőmérséklet | 260–310 °C |
| Ágy hőmérséklet | 100–120 °C |
| Kamra hőmérséklet | 50–70 °C |
| Alkatrész hűtés | 0–20% |
| Szárítás | Szükséges (80 °C / 8–12 ó) |

:::danger A PC all-metal hotend-et és magas hőmérsékletet igényel
A PC nem olvad standard PLA hőmérsékleten. A Bambu X1C megfelelő fúvóka beállítással kezeli a PC-t. Mindig ellenőrizze, hogy a hotend PTFE alkatrészei bírják-e az Ön hőmérsékletét — a standard PTFE nem bírja a folyamatos 240–250 °C feletti működést.
:::

### Tulajdonságok

- **Rendkívül ütésálló:** Törésálló még alacsony hőmérsékleten is
- **Átlátszó:** Használható ablakokhoz, lencsékhez és optikai alkatrészekhez
- **Hőstabil:** Üvegesedési hőmérséklet ~147 °C — a legmagasabb a szokásos anyagok között
- **Higroszkópos:** Gyorsan felszívja a nedvességet — mindig alaposan szárítsa meg
- **Warping:** Erős összehúzódás — kamrát és brim-et igényel

### Felhasználási területek
- Védőpajzsok és burkolatok
- Hőnek ellenálló elektromos burkolatok
- Lencsefoglalatok és optikai alkatrészek
- Robot vázak és drón testek

---

## PP (Polipropilén)

A polipropilén az egyik legnehezebben nyomtatható anyag, de egyedi tulajdonságokat nyújt, amelyeket semmilyen más műanyag nem tud felülmúlni.

### Beállítások

| Paraméter | Érték |
|-----------|-------|
| Fúvóka hőmérséklet | 220–250 °C |
| Ágy hőmérséklet | 80–100 °C |
| Alkatrész hűtés | 20–50% |
| Szárítás | Ajánlott (70 °C / 6 ó) |

### Tulajdonságok

- **Kémiailag ellenálló:** Elviseli az erős savakat, bázisokat, alkoholt és a legtöbb oldószert
- **Könnyű és rugalmas:** Alacsony sűrűség, elviseli az ismételt hajlítást (élő csuklópánt effektus)
- **Alacsony tapadás:** Rosszul tapad önmagához és a nyomtatólemezhez — ez a kihívás
- **Nem mérgező:** Biztonságos élelmiszer-kontaktushoz (színtől és adalékanyagoktól függően)

:::warning A PP rosszul tapad mindenhez
A PP arról közismert, hogy nem tapad a nyomtatólemezhez. Használjon PP szalagot (mint a Tesa szalag vagy dedikált PP szalag) az Engineering Plate-en, vagy használjon PP-hez speciálisan formulált ragasztót. 15–20 mm-es brim szükséges.
:::

### Felhasználási területek
- Laboratóriumi palackok és vegyszer tartályok
- Élelmiszertároló alkatrészek és konyhai eszközök
- Élő csuklópántok (dobozfedelek, amelyek ezer nyitás/zárás ciklust bírnak)
- Vegyszernek ellenálló autóipari alkatrészek

---

## PVA (Polyvinyl Alcohol) — vízben oldódó tartóanyag

A PVA speciális anyag, amelyet kizárólag tartóanyagként használnak. Vízben oldódik és tiszta felületet hagy a modellen.

### Beállítások

| Paraméter | Érték |
|-----------|-------|
| Fúvóka hőmérséklet | 180–220 °C |
| Ágy hőmérséklet | 35–60 °C |
| Szárítás | Kritikus (55 °C / 6–8 ó) |

:::danger A PVA rendkívül higroszkópos
A PVA gyorsabban szívja fel a nedvességet, mint bármely más szokásos filament. Nyomtatás előtt alaposan szárítsa meg a PVA-t, és mindig zárt dobozban, szilika-géllel tárolja. A nedves PVA odaragad a fúvókában és rendkívül nehéz eltávolítani.
:::

### Használat és feloldás

1. Nyomtassa ki a modellt PVA tartóanyaggal (többanyagos nyomtatót igényel — AMS)
2. Helyezze a kész nyomatot meleg vízbe (30–40 °C)
3. Hagyja 30–120 percig, szükség esetén cserélje a vizet
4. Öblítse le tiszta vízzel és hagyja megszáradni

**Mindig használjon dedikált extrudert a PVA-hoz**, ha lehetséges — a standard extruderben lévő PVA maradékok tönkretehetik a következő nyomatot.

### Felhasználási területek
- Összetett tartószerkezetek, amelyek kézzel nem távolíthatók el
- Belső túlnyúlás-tartás látható felületi lenyomat nélkül
- Üregekkel és belső csatornákkal rendelkező modellek

---

## HIPS (High Impact Polystyrene) — oldószerben oldódó tartóanyag

A HIPS egy másik tartóanyag, amelyet ABS-sel való használatra terveztek. **Limonénban** (citrusos oldószer) oldódik.

### Beállítások

| Paraméter | Érték |
|-----------|-------|
| Fúvóka hőmérséklet | 220–240 °C |
| Ágy hőmérséklet | 90–110 °C |
| Kamra hőmérséklet | 45–55 °C |
| Szárítás | Ajánlott (65 °C / 4–6 ó) |

### Használat ABS-sel

A HIPS ugyanolyan hőmérsékleten nyomtat, mint az ABS, és jól tapad hozzá. Nyomtatás után a HIPS feloldódik, ha a nyomatot D-limonénba mártják 30–60 percre.

:::warning A limonén nem víz
A D-limonén narancshéjból kivont oldószer. Viszonylag ártalmatlan, de mégis használjon kesztyűt és szellőztetett helyen dolgozzon. Ne öntse a használt limonént a lefolyóba — adja le hulladékgyűjtő helyen.
:::

### Összehasonlítás: PVA vs HIPS

| Tulajdonság | PVA | HIPS |
|------------|-----|------|
| Oldószer | Víz | D-limonén |
| Saját anyag | PLA-kompatibilis | ABS-kompatibilis |
| Nedvességérzékenység | Rendkívül magas | Közepes |
| Költség | Magas | Közepes |
| Elérhetőség | Jó | Közepes |

---

## PVB / Fibersmooth — etanollal simítható anyag

A PVB (Polyvinyl Butyral) egyedi anyag, amely **etanollal (szesszel) simítható** — ugyanúgy, ahogy az ABS acetonnal simítható, de sokkal biztonságosabban.

### Beállítások

| Paraméter | Érték |
|-----------|-------|
| Fúvóka hőmérséklet | 190–210 °C |
| Ágy hőmérséklet | 35–55 °C |
| Alkatrész hűtés | 80–100% |
| Szárítás | Ajánlott (55 °C / 4 ó) |

### Etanolos simítás

1. Nyomtassa ki a modellt standard PVB beállításokkal
2. Vigyen fel 99%-os izopropil-alkoholt (IPA) vagy etanolt ecsettel
3. Hagyja száradni 10–15 percig — a felület egyenletesen kiegyenlítődik
4. Szükség esetén ismételje meg a simább felületért
5. Alternatíva: Vigye fel és tegye zárt tartályba 5 percre gőzkezeléshez

:::tip Biztonságosabb, mint az aceton
Az IPA/etanol sokkal biztonságosabban kezelhető, mint az aceton. A lobbanáspontja magasabb és a gőzök sokkal kevésbé mérgezők. Mégis ajánlott a jó szellőzés.
:::

### Felhasználási területek
- Figurák és dekorációk, ahol sima felület kívánatos
- Prezentációra szánt prototípusok
- Festésre kerülő alkatrészek — a sima felület jobb festékfelvételt ad

---

## Ajánlott nyomtatólemezek különleges anyagokhoz

| Anyag | Ajánlott lemez | Ragasztó? |
|-------|---------------|----------|
| ASA | Engineering Plate / High Temp Plate | Igen |
| PC | High Temp Plate | Igen (szükséges) |
| PP | Engineering Plate + PP szalag | PP-specifikus szalag |
| PVA | Cool Plate / Textured PEI | Nem |
| HIPS | Engineering Plate / High Temp Plate | Igen |
| PVB | Cool Plate / Textured PEI | Nem |
