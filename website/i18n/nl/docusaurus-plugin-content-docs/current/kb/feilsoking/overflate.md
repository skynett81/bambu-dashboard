---
sidebar_position: 4
title: Oppervlaktefouten
description: Diagnose en herstel van veelvoorkomende oppervlakteproblemen — blobs, zits, laaglijnen, elephant foot en meer
---

# Oppervlaktefouten

Het oppervlak van een 3D-print vertelt veel over wat er in het systeem gebeurt. De meeste oppervlaktefouten hebben één of twee duidelijke oorzaken — met de juiste diagnose zijn ze verrassend eenvoudig te verhelpen.

## Snel diagnoseoverzicht

| Symptoom | Meest voorkomende oorzaak | Eerste actie |
|---|---|---|
| Blobs en zits | Overextrusie, naadplaatsing | Pas naad aan, kalibreer flow |
| Zichtbare laaglijnen | Z-wobble, te dikke lagen | Schakel over naar fijnere lagen, controleer Z-as |
| Elephant foot | Eerste laag te breed | Elephant foot compensatie |
| Ringing/ghosting | Trillingen bij hoge snelheid | Verlaag snelheid, activeer input shaper |
| Onder-extrusie | Verstopte nozzle, te lage temp | Reinig nozzle, verhoog temp |
| Over-extrusie | Te hoge flow rate | Kalibreer flow rate |
| Pillowing | Te weinig toplagen, te weinig koeling | Verhoog aantal toplagen, verhoog koelventilator |
| Laagscheiding | Te lage temp, te veel koeling | Verhoog temp, verlaag koelventilator |

---

## Blobs en zits

Blobs zijn onregelmatige klonten op het oppervlak. Zits zijn prikachtige punten — vaak langs de naadlijn.

### Oorzaken

- **Overextrusie** — te veel plastic wordt geëxtrudeerd en naar de zijkant geperst
- **Slechte naadplaatsing** — standaard "nearest"-naad verzamelt alle overgangen op dezelfde plek
- **Retractieprobleem** — onvoldoende retractie geeft drukopbouw in de nozzle
- **Vochtig filament** — vocht creëert microbelletjes en druppels

### Oplossingen

**Naadinstelling in Bambu Studio:**
```
Bambu Studio → Kwaliteit → Naadpositie
- Aligned: Alle naden op dezelfde plek (zichtbaar, maar netjes)
- Nearest: Dichtstbijzijnd punt (verspreidt blobs willekeurig)
- Back: Achter het object (aanbevolen voor visuele kwaliteit)
- Random: Willekeurige verdeling (camoufleert naad het beste)
```

**Flow rate-kalibrering:**
```
Bambu Studio → Kalibrering → Flow rate
Pas aan in stappen van ±2% totdat blobs verdwijnen
```

:::tip Naad op "Back" voor visuele kwaliteit
Plaats de naad aan de achterkant van het object zodat deze het minst zichtbaar is. Combineer met "Wipe on retract" voor een schonere naadafwerking.
:::

---

## Zichtbare laaglijnen

Alle FDM-prints hebben laaglijnen, maar ze moeten consistent zijn en nauwelijks zichtbaar bij normale prints. Abnormale zichtbaarheid wijst op concrete problemen.

### Oorzaken

- **Z-wobble** — de Z-as trilt of staat niet recht, geeft golvend patroon over de hele hoogte
- **Te dikke lagen** — laagdikte boven 0,28 mm is merkbaar zelfs bij perfecte prints
- **Temperatuurschommelingen** — inconsistente smelttemperatuur geeft wisselende laagbreedte
- **Inconsistente filamentdiameter** — goedkoop filament met wisselende diameter

### Oplossingen

**Z-wobble:**
- Controleer of de spindelas (Z-leadscrew) schoon en gesmeerd is
- Controleer of de spindel niet gebogen is (visuele inspectie bij rotatie)
- Zie onderhoudsartikel voor [smeren van de Z-as](/docs/kb/vedlikehold/smoring)

**Laagdikte:**
- Schakel over naar 0,12 mm of 0,16 mm voor een gelijkmatiger oppervlak
- Onthoud dat halvering van de laagdikte de printtijd verdubbelt

**Temperatuurschommelingen:**
- Gebruik PID-kalibrering (beschikbaar via het onderhoudsmenu van Bambu Studio)
- Vermijd tocht die de nozzle afkoelt tijdens het printen

---

## Elephant foot

Elephant foot is wanneer de eerste laag breder is dan de rest van het object — alsof het object zich "uitvouwt" aan de onderkant.

### Oorzaken

- Eerste laag wordt te hard tegen de plaat gedrukt (Z-offset te nauw)
- Te hoge bedtemperatuur houdt het plastic te lang zacht en vloeibaar
- Te weinig koeling op de eerste laag geeft plastic meer tijd om te spreiden

### Oplossingen

**Elephant foot compensatie in Bambu Studio:**
```
Bambu Studio → Kwaliteit → Elephant foot compensatie
Begin met 0,1–0,2 mm en pas aan totdat de voet verdwijnt
```

**Z-offset:**
- Kalibreer de eerste laagdikte opnieuw
- Verhoog de Z-offset met 0,05 mm per keer totdat de voet weg is

**Bedtemperatuur:**
- Verlaag de bedtemperatuur met 5–10 °C
- Voor PLA: 55 °C is vaak genoeg — 65 °C kan elephant foot veroorzaken

:::warning Compenseer niet te veel
Te hoge elephant foot compensatie kan een gat creëren tussen de eerste laag en de rest. Pas voorzichtig aan in stappen van 0,05 mm.
:::

---

## Ringing en ghosting

Ringing (ook wel "ghosting" of "echoing" genoemd) is een golfpatroon in het oppervlak direct na scherpe randen of hoeken. Het patroon "echoot" vanuit de rand.

### Oorzaken

- **Trillingen** — snelle versnelling en vertraging bij hoeken stuurt trillingen door het frame
- **Te hoge snelheid** — met name buitenwandsnelheid boven 100 mm/s geeft merkbare ringing
- **Losse onderdelen** — losse spoel, trillende kabelgeleider of losgemonteerde printer

### Oplossingen

**Bambu Lab input shaper (Resonantiecompensatie):**
```
Bambu Studio → Printer → Resonantiecompensatie
Bambu Lab X1C en P1S hebben ingebouwde accelerometer en kalibreren dit automatisch
```

**Verlaag snelheid:**
```
Buitenwand: Verlaag naar 60–80 mm/s
Versnelling: Verlaag van standaard naar 3000–5000 mm/s²
```

**Mechanische controle:**
- Controleer of de printer op een stabiel oppervlak staat
- Controleer of de spoel niet trilt in de spoelenhouder
- Zet alle beschikbare schroeven op de buitenpanelen van het frame aan

:::tip X1C en P1S kalibreren ringing automatisch
Bambu Lab X1C en P1S hebben ingebouwde accelerometerkalibrering die automatisch uitvoert bij het opstarten. Voer "Volledige kalibrering" uit via het onderhoudsmenu als ringing na een periode optreedt.
:::

---

## Onder-extrusie

Onder-extrusie is wanneer de printer te weinig plastic extrudeert. Het resultaat zijn dunne, zwakke wanden, zichtbare gaten tussen lagen en een "rafelig" oppervlak.

### Oorzaken

- **Gedeeltelijk verstopte nozzle** — koolstofopbouw vermindert de doorstroom
- **Te lage nozzletemperatuur** — het plastic is niet vloeibaar genoeg
- **Versleten tandwiel** in het extrudermechanisme grijpt het filament niet goed
- **Te hoge snelheid** — extruder kan de gewenste flow niet bijhouden

### Oplossingen

**Cold pull:**
```
1. Verwarm de nozzle tot 220 °C
2. Duw filament handmatig in
3. Koel de nozzle af tot 90 °C (PLA) terwijl je druk houdt
4. Trek het filament snel uit
5. Herhaal totdat het getrokken materiaal schoon is
```

**Temperatuurafstelling:**
- Verhoog de nozzletemperatuur met 5–10 °C en test opnieuw
- Te laag temperatuur is een veelvoorkomende oorzaak van onder-extrusie

**Flow rate-kalibrering:**
```
Bambu Studio → Kalibrering → Flow rate
Verhoog geleidelijk totdat de onder-extrusie verdwijnt
```

**Controleer extrudertandwiel:**
- Verwijder het filament en inspecteer het tandwiel
- Reinig met een kleine borstel als er filamentpoeder in de tanden zit

---

## Over-extrusie

Over-extrusie geeft een te brede streng — het oppervlak ziet er los, glanzend of ongelijkmatig uit, met de neiging tot blobs.

### Oorzaken

- **Te hoge flow rate** (EM — Extrusion Multiplier)
- **Verkeerde filamentdiameter** — 2,85 mm filament met een 1,75 mm-profiel geeft massale over-extrusie
- **Te hoge nozzletemperatuur** maakt het plastic te vloeibaar

### Oplossingen

**Flow rate-kalibrering:**
```
Bambu Studio → Kalibrering → Flow rate
Verlaag in stappen van 2% totdat het oppervlak gelijkmatig en mat is
```

**Verifieer filamentdiameter:**
- Meet de werkelijke filamentdiameter met een schuifmaat op 5–10 plaatsen langs het filament
- Gemiddelde afwijking van meer dan 0,05 mm duidt op goedkoop filament

---

## Pillowing

Pillowing zijn bobbelige, ongelijkmatige toplagen met "kussens" van plastic tussen de toplagen. Bijzonder opvallend bij lage vulling en te weinig toplagen.

### Oorzaken

- **Te weinig toplagen** — het plastic boven de vulling zakt in de gaten
- **Te weinig koeling** — het plastic stolt niet snel genoeg om over de vullingsgaten te bruggen
- **Te lage vulling** — grote gaten in de vulling zijn moeilijk te overbruggen

### Oplossingen

**Verhoog het aantal toplagen:**
```
Bambu Studio → Kwaliteit → Bovenste schaallagen
Minimum: 4 lagen
Aanbevolen voor gelijkmatig oppervlak: 5–6 lagen
```

**Verhoog koeling:**
- PLA moet koelventilator op 100% hebben vanaf laag 3
- Onvoldoende koeling is de meest voorkomende oorzaak van pillowing

**Verhoog vulling:**
- Ga van 10–15% naar 20–25% als pillowing aanhoudt
- Gyroid-patroon geeft een gelijkmatiger brugoppervlak dan lijnen

:::tip Strijken (Ironing)
Bambu Studio's "ironing"-functie laat de nozzle een extra keer over de toplaag rijden om het oppervlak te egaliseren. Activeer via Kwaliteit → Ironing voor de beste toplaagafwerking.
:::

---

## Laagscheiding (Layer separation / delamination)

Laagscheiding is wanneer lagen niet goed aan elkaar hechten. In het ergste geval barst de print open langs laaglijnen.

### Oorzaken

- **Te lage nozzletemperatuur** — het plastic smelt niet goed genoeg in de onderliggende laag
- **Te veel koeling** — het plastic stolt te snel voordat het kan fuseren
- **Te grote laagdikte** — boven 80% van de nozzlediameter geeft slechte fusie
- **Te hoge snelheid** — verminderde smeltijd per mm baan

### Oplossingen

**Verhoog temperatuur:**
- Probeer +10 °C ten opzichte van standaard en observeer
- ABS en ASA zijn bijzonder gevoelig — vereisen gecontroleerde kamerverwarming

**Verminder koeling:**
- ABS: koelventilator UIT (0%)
- PETG: max. 20–40%
- PLA: kan volledige koeling verdragen, maar verlaag als laagscheiding optreedt

**Laagdikte:**
- Gebruik max. 75% van de nozzlediameter
- Met een 0,4 mm nozzle: max. aanbevolen laagdikte is 0,30 mm

**Controleer of de behuizing warm genoeg is (ABS/ASA/PA/PC):**
```
Bambu Lab X1C/P1S: Laat de kamer opwarmen tot 40–60 °C
voordat de print start — open de deur niet tijdens het printen
```

---

## Algemene probleemoplossingstips

1. **Verander één ding per keer** — test met een kleine kalibreerprint tussen elke wijziging
2. **Droog eerst het filament** — veel oppervlaktefouten zijn eigenlijk vochtproblemen
3. **Reinig de nozzle** — gedeeltelijke verstopping geeft inconsistente oppervlaktefouten die moeilijk te diagnosticeren zijn
4. **Voer een volledige kalibrering uit** via het onderhoudsmenu van Bambu Studio na grote aanpassingen
5. **Gebruik Bambu Dashboard** om bij te houden welke instellingen het beste resultaat gaven over tijd
