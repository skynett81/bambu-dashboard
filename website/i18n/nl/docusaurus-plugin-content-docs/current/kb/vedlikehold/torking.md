---
sidebar_position: 5
title: Filament drogen
description: Waarom, wanneer en hoe filament te drogen — temperaturen, tijden en opslagtips voor alle materialen
---

# Filament drogen

Vochtig filament is een van de meest voorkomende en meest onderschatte oorzaken van slechte prints. Zelfs filament dat er droog uitziet kan genoeg vocht hebben geabsorbeerd om het resultaat te bederven — met name voor materialen zoals nylon en PVA.

## Waarom filament drogen?

Veel kunststoftypen zijn **hygroscopisch** — ze absorberen vocht uit de lucht in de loop van de tijd. Wanneer vochtig filament door de hete nozzle gaat, verdampt het water plotseling en creëert microbelletjes in het gesmolten plastic. Het resultaat is:

- **Knappende en krakende geluiden** tijdens het printen
- **Nevel of stoom** zichtbaar uit de nozzle
- **Stringing en hairing** die niet weg te stellen zijn
- **Ruw of korrelig oppervlak** — met name op toplagen
- **Zwakke onderdelen** met slechte laaghechting en microscheurtjes
- **Matte of doffe afwerking** op materialen die normaal glanzend of zijdeglanzend horen te zijn

:::warning Droog filament VOORDAT je instellingen aanpast
Veel mensen besteden uren aan het aanpassen van retractie en temperatuur zonder verbetering te zien — omdat de oorzaak vochtig filament is. Droog het filament altijd en test opnieuw voordat je printinstellingen wijzigt.
:::

## Welke materialen moeten worden gedroogd?

Alle kunststoftypen kunnen vochtig worden, maar de mate van hygroscopiciteit varieert enorm:

| Materiaal | Hygroscopisch | Droogtemperatuur | Droogtijd | Prioriteit |
|---|---|---|---|---|
| PLA | Laag | 45–50 °C | 4–6 uur | Optioneel |
| PETG | Gemiddeld | 65 °C | 4–6 uur | Aanbevolen |
| ABS | Gemiddeld | 65–70 °C | 4 uur | Aanbevolen |
| TPU | Gemiddeld | 50–55 °C | 4–6 uur | Aanbevolen |
| ASA | Gemiddeld | 65 °C | 4 uur | Aanbevolen |
| PC | Hoog | 70–80 °C | 6–8 uur | Vereist |
| PA/Nylon | Extreem hoog | 70–80 °C | 8–12 uur | VEREIST |
| PA-CF | Extreem hoog | 70–80 °C | 8–12 uur | VEREIST |
| PVA | Extreem hoog | 45–50 °C | 4–6 uur | VEREIST |

:::tip Nylon en PVA zijn kritiek
PA/Nylon en PVA kunnen in een normaal binnenklimaat in **enkele uren** genoeg vocht absorberen om onprintbaar te worden. Open nooit een nieuwe spoel van deze materialen zonder direct daarna te drogen — en print altijd vanuit een gesloten box of droogbox.
:::

## Tekenen van vochtig filament

Je hoeft niet altijd filament te drogen op basis van een tabel. Leer de symptomen te herkennen:

| Symptoom | Vocht? | Andere mogelijke oorzaken |
|---|---|---|
| Knappende/krakende geluiden | Ja, zeer waarschijnlijk | Gedeeltelijk verstopte nozzle |
| Nevel/stoom uit de nozzle | Ja, vrijwel zeker | Geen andere oorzaak |
| Ruw, korrelig oppervlak | Ja, mogelijk | Te lage temp, te hoge snelheid |
| Stringing die niet verdwijnt | Ja, mogelijk | Verkeerde retractie, te hoge temp |
| Zwakke, brosse onderdelen | Ja, mogelijk | Te lage temp, verkeerde vulling |
| Kleurverandering of matte afwerking | Ja, mogelijk | Verkeerde temp, verbrand plastic |

## Droogmethoden

### Filamentdroger (aanbevolen)

Speciale filamentdroogers zijn de eenvoudigste en veiligste oplossing. Ze houden de temperatuur nauwkeurig vast en laten je direct vanuit de droger printen gedurende de hele taak.

Populaire modellen:
- **eSun eBOX** — betaalbaar, kan vanuit de box printen, ondersteunt de meeste materialen
- **Bambu Lab Filament Dryer** — geoptimaliseerd voor Bambu AMS, ondersteunt hoge temperaturen
- **Polymaker PolyDryer** — goed thermometer en goede temperatuurregeling
- **Sunlu S2 / S4** — budgetvriendelijk, meerdere spoelen tegelijk

Werkwijze:
```
1. Leg spoelen in de droger
2. Stel de temperatuur in op basis van de tabel hierboven
3. Stel de timer in op de aanbevolen tijd
4. Wacht — onderbreek het proces niet
5. Print direct vanuit de droger of verpak onmiddellijk
```

### Voedseldroger

Een gewone voedseldroger werkt verrassend goed als filamentdroger:

- Betaalbaar in aanschaf (beschikbaar vanaf ~€15)
- Goede luchtcirculatie
- Ondersteunt temperaturen tot 70–75 °C op veel modellen

:::warning Controleer de maximumtemperatuur van jouw droger
Veel goedkope voedseldrogers hebben onnauwkeurige thermostaten en kunnen ±10 °C variëren. Meet de werkelijke temperatuur met een thermometer voor PA en PC die hoge warmte vereisen.
:::

### Oven

De keukenoven kan in noodgevallen worden gebruikt, maar vereist voorzichtigheid:

:::danger Gebruik NOOIT een gewone oven boven 60 °C voor PLA — het vervormt!
PLA begint al te verzachten bij 55–60 °C. Een hete oven kan spoelen beschadigen, de kern smelten en het filament onbruikbaar maken. Gebruik de oven nooit voor PLA tenzij je weet dat de temperatuur nauwkeurig gekalibreerd is en onder 50 °C blijft.
:::

Voor materialen die hogere temperaturen verdragen (ABS, ASA, PA, PC):
```
1. Verwarm de oven voor op de gewenste temperatuur
2. Gebruik een thermometer om de werkelijke temperatuur te verifiëren
3. Leg spoelen op een rek (niet direct op de ovenvloer)
4. Laat de deur op een kier staan om vocht te laten ontsnappen
5. Houd toezicht de eerste keer dat je deze methode gebruikt
```

### Bambu Lab AMS

Bambu Lab AMS Lite en AMS Pro hebben een ingebouwde droogfunctie (lage warmte + luchtcirculatie). Dit is geen vervanging voor volledig drogen, maar houdt al gedroogd filament droog tijdens het printen.

- AMS Lite: Passief drogen — beperkt vochtopname, droogt niet actief
- AMS Pro: Actieve verwarming — enig drogen mogelijk, maar niet zo effectief als een speciale droger

## Filament opslaan

Correcte opslag na het drogen is even belangrijk als het droogproces zelf:

### Beste oplossingen

1. **Droogkast met silicagel** — speciale kast met hygrometer en droogmiddel. Houdt de vochtigheid stabiel laag (onder 20% RH ideaal)
2. **Vacuümzakken** — zuig lucht eruit en verzegel met droogmiddel erin. Goedkoopste langetermijnopslag
3. **Ziplock-zakken met droogmiddel** — eenvoudig en effectief voor kortere perioden

### Silicagel en droogmiddel

- **Blauw/oranje silicagel** geeft verzadiging aan — vervang of regenereer (droog in oven op 120 °C) als de kleur verandert
- **Silicagelkorrels** zijn effectiever dan granulaat
- **Droogmiddelpakketjes** van filamentfabrikanten kunnen worden geregenereerd en hergebruikt

### Hygrometer in opslagbox

Een goedkope digitale hygrometer toont de actuele luchtvochtigheid in de box:

| Relatieve luchtvochtigheid (RH) | Status |
|---|---|
| Onder 15% | Ideaal |
| 15–30% | Goed voor de meeste materialen |
| 30–50% | Acceptabel voor PLA en PETG |
| Boven 50% | Problematisch — met name voor PA, PVA, PC |

## Praktische tips

- **Droog direct VOOR het printen** — gedroogd filament kan binnen dagen weer vochtig worden in een normaal binnenklimaat
- **Print vanuit de droger** voor PA, PC en PVA — niet alleen drogen en opbergen
- **Nieuwe spoel ≠ droge spoel** — fabrikanten verzegelen met droogmiddel, maar de opslagketen kan gefaald hebben. Droog altijd nieuwe spoelen van hygroscopische materialen
- **Markeer gedroogde spoelen** met de droogdatum
- **Speciale PTFE-buis** van droger naar printer minimaliseert blootstelling tijdens het printen

## Bambu Dashboard en droogstatus

Bambu Dashboard laat je filamentinformatie bijhouden, inclusief de laatste droogdatum, onder filamentprofielen. Gebruik dit om bij te houden welke spoelen vers gedroogd zijn en welke een nieuwe ronde nodig hebben.
