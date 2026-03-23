---
sidebar_position: 7
title: Speciale materialen
description: ASA, PC, PP, PVA, HIPS en andere speciale materialen voor geavanceerde toepassingen
---

# Speciale materialen

Naast de gewone materialen zijn er een aantal speciale materialen voor specifieke gebruiksgevallen — van UV-bestendige buitenonderdelen tot wateroplosbaar ondersteuningsmateriaal. Hier is een praktisch overzicht.

---

## ASA (Acrylonitrile Styrene Acrylate)

ASA is het beste alternatief voor ABS voor buitengebruik. Het print vrijwel identiek aan ABS, maar verdraagt zonlicht en weer veel beter.

### Instellingen

| Parameter | Waarde |
|-----------|--------|
| Nozzletemperatuur | 240–260 °C |
| Bedtemperatuur | 90–110 °C |
| Kamertemperatuur | 45–55 °C |
| Deelkoeling | 0–20% |
| Drogen | Aanbevolen (70 °C / 4–6 u) |

### Eigenschappen

- **UV-bestendig:** Speciaal ontworpen voor langdurige blootstelling aan zonlicht zonder vergeling of scheuren
- **Warmtestabiel:** Glasovergangstemperatuur ~100 °C
- **Slagvast:** Betere slagweerstand dan ABS
- **Behuizing vereist:** Warpt op dezelfde manier als ABS — X1C/P1S geeft de beste resultaten

:::tip ASA in plaats van ABS voor buiten
Moet het onderdeel buiten in een Europees klimaat leven (zon, regen, vorst)? Kies ASA boven ABS. ASA verdraagt vele jaren zonder zichtbare degradatie. ABS begint na maanden te scheuren en te vergelen.
:::

### Toepassingen
- Buitenbeugels, behuizingen en bevestigingspunten
- Autoaerodynamica-onderdelen, antennemontagepunten
- Tuinmeubilair en buitenomgevingen
- Buitensignalering en dispensers op de buitenkant van gebouwen

---

## PC (Polycarbonaat)

Polycarbonaat is een van de sterkste en meest slagvaste kunststoffen die kunnen worden 3D-geprint. Het is transparant en verdraagt extreme temperaturen.

### Instellingen

| Parameter | Waarde |
|-----------|--------|
| Nozzletemperatuur | 260–310 °C |
| Bedtemperatuur | 100–120 °C |
| Kamertemperatuur | 50–70 °C |
| Deelkoeling | 0–20% |
| Drogen | Vereist (80 °C / 8–12 u) |

:::danger PC vereist all-metal hotend en hoge temperatuur
PC smelt niet bij standaard PLA-temperaturen. Bambu X1C met de juiste nozzle-opstelling kan PC aan. Controleer altijd of de PTFE-componenten in de hotend de temperatuur aankunnen — standaard PTFE verdraagt niet meer dan 240–250 °C continu.
:::

### Eigenschappen

- **Zeer slagvast:** Bestand tegen breuken zelfs bij lage temperaturen
- **Transparant:** Kan worden gebruikt voor ramen, lenzen en optische componenten
- **Warmtestabiel:** Glasovergangstemperatuur ~147 °C — hoogste van veelgebruikte materialen
- **Hygroscopisch:** Absorbeert vocht snel — altijd grondig drogen
- **Warping:** Sterke krimp — vereist behuizing en brim

### Toepassingen
- Veiligheidsvisieren en beschermende afdekking
- Elektrische behuizingen die hitte verdragen
- Lenshouders en optische componenten
- Robotframes en droneromp

---

## PP (Polypropyleen)

Polypropyleen is een van de moeilijkste materialen om te printen, maar geeft unieke eigenschappen die geen ander kunststofmateriaal kan evenaren.

### Instellingen

| Parameter | Waarde |
|-----------|--------|
| Nozzletemperatuur | 220–250 °C |
| Bedtemperatuur | 80–100 °C |
| Deelkoeling | 20–50% |
| Drogen | Aanbevolen (70 °C / 6 u) |

### Eigenschappen

- **Chemisch bestendig:** Verdraagt sterke zuren, basen, alcohol en de meeste oplosmiddelen
- **Licht en flexibel:** Lage dichtheid, verdraagt herhaald buigen (levend scharnier-effect)
- **Lage hechting:** Hecht slecht aan zichzelf en aan de bouwplaat — dat is de uitdaging
- **Niet giftig:** Veilig voor voedselcontact (afhankelijk van kleur en additieven)

:::warning PP hecht slecht op alles
PP staat berucht om niet aan de bouwplaat te hechten. Gebruik PP-tape (zoals Tesa-tape of speciale PP-tape) op de Engineering Plate, of gebruik lijmstift speciaal geformuleerd voor PP. Brim van 15–20 mm is noodzakelijk.
:::

### Toepassingen
- Laboratoriumflessen en chemicaliënhouders
- Voedselbewaring en keukengereedschap
- Levende scharnieren (deksels die duizenden open/sluit-cycli verdragen)
- Autoonderdelen die bestand zijn tegen chemicaliën

---

## PVA (Polyvinyl Alcohol) — wateroplosbaar ondersteuningsmateriaal

PVA is een speciaal materiaal dat uitsluitend wordt gebruikt als ondersteuningsmateriaal. Het lost op in water en laat een schoon oppervlak achter op het model.

### Instellingen

| Parameter | Waarde |
|-----------|--------|
| Nozzletemperatuur | 180–220 °C |
| Bedtemperatuur | 35–60 °C |
| Drogen | Kritiek (55 °C / 6–8 u) |

:::danger PVA is extreem hygroscopisch
PVA absorbeert vocht sneller dan elk ander veelgebruikt filament. Droog PVA grondig VOOR het printen, en bewaar het altijd in een verzegelde box met silica. Vochtig PVA kleeft vast in de nozzle en is zeer moeilijk te verwijderen.
:::

### Gebruik en oplossing

1. Print model met PVA als ondersteuningsmateriaal (vereist multi-material printer — AMS)
2. Leg de afgewerkte print in warm water (30–40 °C)
3. Laat 30–120 minuten staan, ververs water indien nodig
4. Spoel af met schoon water en laat drogen

**Gebruik altijd een speciale extruder voor PVA** indien mogelijk — PVA-resten in een standaard extruder kunnen de volgende print bederven.

### Toepassingen
- Complexe ondersteuningsstructuren die handmatig onmogelijk te verwijderen zijn
- Intern ophangondersteuning zonder merkbare oppervlakafdruk
- Modellen met holle ruimtes en interne kanalen

---

## HIPS (High Impact Polystyrene) — oplosmiddeloplosbaar ondersteuningsmateriaal

HIPS is een ander ondersteuningsmateriaal, ontworpen voor gebruik met ABS. Het lost op in **limoneen** (citrus-oplosmiddel).

### Instellingen

| Parameter | Waarde |
|-----------|--------|
| Nozzletemperatuur | 220–240 °C |
| Bedtemperatuur | 90–110 °C |
| Kamertemperatuur | 45–55 °C |
| Drogen | Aanbevolen (65 °C / 4–6 u) |

### Gebruik met ABS

HIPS print op dezelfde temperaturen als ABS en hecht er goed aan. Na het printen wordt HIPS opgelost door de print 30–60 minuten in D-limoneen te leggen.

:::warning Limoneen is geen water
D-limoneen is een oplosmiddel gewonnen uit sinaasappelschillen. Het is relatief onschadelijk, maar gebruik toch handschoenen en werk in een geventileerde ruimte. Gooi gebruikte limoneen niet in het afvoer — lever in bij een chemisch afvaldepot.
:::

### Vergelijking: PVA vs HIPS

| Eigenschap | PVA | HIPS |
|----------|-----|------|
| Oplosmiddel | Water | D-limoneen |
| Eigen materiaal | PLA-compatibel | ABS-compatibel |
| Vochtgevoeligheid | Extreem hoog | Gemiddeld |
| Kosten | Hoog | Gemiddeld |
| Beschikbaarheid | Goed | Gemiddeld |

---

## PVB / Fibersmooth — ethanol-gladmakend materiaal

PVB (Polyvinyl Butyral) is een uniek materiaal dat kan worden **gladgemaakt met ethanol (alcohol)** — op dezelfde manier als ABS met aceton kan worden gladgemaakt, maar veel veiliger.

### Instellingen

| Parameter | Waarde |
|-----------|--------|
| Nozzletemperatuur | 190–210 °C |
| Bedtemperatuur | 35–55 °C |
| Deelkoeling | 80–100% |
| Drogen | Aanbevolen (55 °C / 4 u) |

### Ethanol-smoothing

1. Print het model op standaard PVB-instellingen
2. Breng 99% isopropylalcohol (IPA) of ethanol aan met een penseel
3. Laat 10–15 minuten drogen — het oppervlak vloeit gelijkmatig uit
4. Herhaal indien nodig voor een gladder oppervlak
5. Alternatief: Breng aan en leg 5 minuten in een gesloten container voor damperbehandeling

:::tip Veiliger dan aceton
IPA/ethanol is veel veiliger te hanteren dan aceton. Het vlampunt is hoger en de dampen zijn veel minder giftig. Goede ventilatie wordt toch aanbevolen.
:::

### Toepassingen
- Figuren en decoraties waarbij een glad oppervlak gewenst is
- Prototypes voor presentatiedoeleinden
- Onderdelen die worden geschilderd — glad oppervlak geeft betere verf

---

## Aanbevolen bouwplaten voor speciale materialen

| Materiaal | Aanbevolen plaat | Lijmstift? |
|-----------|----------------|----------|
| ASA | Engineering Plate / High Temp Plate | Ja |
| PC | High Temp Plate | Ja (vereist) |
| PP | Engineering Plate + PP-tape | PP-specifieke tape |
| PVA | Cool Plate / Textured PEI | Nee |
| HIPS | Engineering Plate / High Temp Plate | Ja |
| PVB | Cool Plate / Textured PEI | Nee |
