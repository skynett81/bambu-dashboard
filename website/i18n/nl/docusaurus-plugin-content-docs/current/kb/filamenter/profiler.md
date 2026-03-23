---
sidebar_position: 8
title: Printprofielen en instellingen
description: Begrijp en pas printprofielen aan in Bambu Studio — snelheid, temperatuur, retractie en kwaliteitsinstellingen
---

# Printprofielen en instellingen

Een printprofiel is een verzameling instellingen die exact bepaalt hoe de printer werkt — van temperatuur en snelheid tot retractie en laagdikte. Het juiste profiel is het verschil tussen een perfecte print en een mislukte.

## Wat is een printprofiel?

Bambu Studio onderscheidt drie soorten profielen:

- **Filamentprofiel** — temperatuur, koeling, retractie en droging voor een specifiek materiaal
- **Procesprofiel** — laagdikte, snelheid, vulling en ondersteuningsinstellingen
- **Printerprofiel** — machinespecifieke instellingen (automatisch ingesteld voor Bambu Lab-printers)

Bambu Studio levert generieke profielen voor alle Bambu Lab-filamenten en een groot aantal materialen van derden. Externe leveranciers zoals Polyalkemi, eSUN en Fillamentum maken bovendien geoptimaliseerde profielen die zijn afgestemd op precies hun filament.

Profielen kunnen vrij worden geïmporteerd, geëxporteerd en gedeeld tussen gebruikers.

## Profielen importeren in Bambu Studio

1. Download het profiel (JSON-bestand) van de website van de leverancier of MakerWorld
2. Open Bambu Studio
3. Ga naar **Bestand → Importeren → Configuratie importeren**
4. Selecteer het gedownloade bestand
5. Het profiel verschijnt onder filamentkeuze in de slicer

:::tip Organisatie
Geef profielen een beschrijvende naam, bijv. "Polyalkemi PLA HF 0.20mm Balanced", zodat je de volgende keer het juiste profiel gemakkelijk terugvindt.
:::

## Belangrijke instellingen uitgelegd

### Temperatuur

Temperatuur is de belangrijkste afzonderlijke instelling. Te lage temperatuur geeft slechte laaghechting en ondervulling. Te hoog geeft stringing, borrelend oppervlak en verbrand filament.

| Instelling | Beschrijving | Typisch PLA | Typisch PETG | Typisch ABS |
|---|---|---|---|---|
| Nozzletemperatuur | Smelttemperatuur | 200–220 °C | 230–250 °C | 240–260 °C |
| Bedtemperatuur | Bouwplatewarmte | 55–65 °C | 70–80 °C | 90–110 °C |
| Kamertemperatuur | Behuizingstemperatuur | Niet nodig | Optioneel | 40–60 °C aanbevolen |

Bambu Lab X1C en de P1-serie hebben actieve kamerverwarming. Voor ABS en ASA is dit cruciaal om warping en laagscheiding te voorkomen.

### Snelheid

Bambu Lab-printers kunnen extreem snel rijden, maar hogere snelheid betekent niet altijd beter resultaat. Met name de buitenwandsnelheid beïnvloedt het oppervlak.

| Instelling | Wat het beïnvloedt | Kwaliteitsmodus | Gebalanceerd | Snel |
|---|---|---|---|---|
| Buitenwand | Oppervlakresultaat | 45–60 mm/s | 100 mm/s | 150+ mm/s |
| Binnenwand | Structurele sterkte | 100 mm/s | 150 mm/s | 200+ mm/s |
| Vulling | Interne vulling | 150 mm/s | 200 mm/s | 300+ mm/s |
| Toplaag | Bovenkant oppervlak | 45–60 mm/s | 80 mm/s | 100 mm/s |
| Onderlaag | Eerste laag | 30–50 mm/s | 50 mm/s | 50 mm/s |

:::tip Buitenwandsnelheid is de sleutel tot oppervlaktekwaliteit
Verlaag de buitenwandsnelheid naar 45–60 mm/s voor een zijdeglanzende afwerking. Dit geldt met name voor Silk PLA en matte filamenten. Binnenwanden en vulling kunnen nog steeds snel rijden zonder dat het oppervlak wordt beïnvloed.
:::

### Retractie (terugtrekking)

Retractie trekt het filament een beetje terug in de nozzle wanneer de printer beweegt zonder te extruderen. Dit voorkomt stringing (haarfijne draden tussen onderdelen). Onjuiste retractie-instellingen geven ofwel stringing (te weinig) of verstopping (te veel).

| Materiaal | Retractieafstand | Retractiesnelheid | Opmerking |
|---|---|---|---|
| PLA | 0,8–2,0 mm | 30–50 mm/s | Standaard voor de meeste |
| PETG | 1,0–3,0 mm | 20–40 mm/s | Te veel = verstopping |
| ABS | 0,5–1,5 mm | 30–50 mm/s | Vergelijkbaar met PLA |
| TPU | 0–1,0 mm | 10–20 mm/s | Minimaal! Of deactiveer |
| Nylon | 1,0–2,0 mm | 30–40 mm/s | Vereist droog filament |

:::warning TPU-retractie
Voor TPU en andere flexibele materialen: gebruik minimale retractie (0–1 mm) of deactiveer volledig. Te veel retractie zorgt ervoor dat het zachte filament buigt en blokkeert in de Bowden-buis, wat leidt tot verstopping.
:::

### Laagdikte

Laagdikte bepaalt de balans tussen detailniveau en printsnelheid. Lage laagdikte geeft fijnere details en gladdere oppervlakken, maar duurt veel langer.

| Laagdikte | Beschrijving | Toepassing |
|---|---|---|
| 0,08 mm | Ultrafijn | Miniatuurfiguren, gedetailleerde modellen |
| 0,12 mm | Fijn | Visuele kwaliteit, tekst, logo's |
| 0,16 mm | Hoge kwaliteit | Standaard voor de meeste prints |
| 0,20 mm | Gebalanceerd | Goede balans tijd/kwaliteit |
| 0,28 mm | Snel | Functionele onderdelen, prototypes |

Bambu Studio werkt met procesinstellingen zoals "0.16mm High Quality" en "0.20mm Balanced Quality" — deze stellen de laagdikte in en passen snelheid en koeling automatisch aan.

### Vulling (Infill)

Vulling bepaalt hoeveel materiaal de binnenkant van de print vult. Meer vulling = sterker, zwaarder en langere printtijd.

| Percentage | Toepassing | Aanbevolen patroon |
|---|---|---|
| 10–15% | Decoratie, visueel | Gyroid |
| 20–30% | Algemeen gebruik | Cubic, Gyroid |
| 40–60% | Functionele onderdelen | Cubic, Honeycomb |
| 80–100% | Maximale sterkte | Rectilinear |

:::tip Gyroid is koning
Gyroid-patroon geeft de beste sterkte-gewichtsverhouding en is isotropisch — even sterk in alle richtingen. Het is ook sneller te printen dan honeycomb en ziet er goed uit bij open modellen. Standaardkeuze voor de meeste situaties.
:::

## Profieltips per materiaal

### PLA — kwaliteitsgericht

PLA is vergevingsgezind en gemakkelijk te bewerken. Focus op oppervlaktekwaliteit:

- **Buitenwand:** 60 mm/s voor perfecte afwerking, met name bij Silk PLA
- **Koelventilator:** 100% na laag 3 — cruciaal voor scherpe details en bruggen
- **Brim:** Niet nodig bij puur PLA met correct gekalibreerde plaat
- **Laagdikte:** 0,16 mm High Quality geeft een goede balans voor decoratieve onderdelen

### PETG — balans

PETG is sterker dan PLA, maar vergt meer fine-tuning:

- **Procesinstelling:** 0,16 mm High Quality of 0,20 mm Balanced Quality
- **Koelventilator:** 30–50% — te veel koeling geeft slechte laaghechting en brosse prints
- **Z-hop:** Activeer om te voorkomen dat de nozzle over het oppervlak sleept bij verplaatsing
- **Stringing:** Pas retractie aan en print iets warmer in plaats van kouder

### ABS — behuizing is alles

ABS print goed, maar vereist een gecontroleerde omgeving:

- **Koelventilator:** UIT (0%) — absoluut cruciaal! Koeling veroorzaakt laagscheiding en warping
- **Behuizing:** Sluit deuren en laat de kamer opwarmen tot 40–60 °C voordat de print start
- **Brim:** 5–8 mm aanbevolen voor grote, platte onderdelen — voorkomt warping in hoeken
- **Ventilatie:** Zorg voor goede ventilatie in de ruimte — ABS geeft styreendampen af

### TPU — langzaam en voorzichtig

Flexibele materialen vereisen een heel andere aanpak:

- **Snelheid:** Max. 30 mm/s — te snel printen zorgt ervoor dat het filament krom trekt
- **Retractie:** Minimaal (0–1 mm) of volledig deactiveren
- **Direct drive:** TPU werkt alleen op Bambu Lab-machines met ingebouwde direct drive
- **Laagdikte:** 0,20 mm Balanced geeft goede laagfusie zonder te veel spanning

### Nylon — droog filament is alles

Nylon is hygroscopisch en absorbeert vocht in enkele uren:

- **Altijd drogen:** 70–80 °C gedurende 8–12 uur vóór het printen
- **Behuizing:** Print vanuit droogbox direct naar AMS om het filament droog te houden
- **Retractie:** Matig (1,0–2,0 mm) — vochtig nylon geeft veel meer stringing
- **Bouwplaat:** Engineering Plate met lijm, of Garolite-plaat voor beste hechting

## Bambu Lab voorinstellingen

Bambu Studio heeft ingebouwde profielen voor de gehele Bambu Lab-productfamilie:

- Bambu Lab Basic PLA, PETG, ABS, TPU, PVA, PA, PC, ASA
- Bambu Lab ondersteuningsmaterialen (Support W, Support G)
- Bambu Lab Specialty (PLA-CF, PETG-CF, ABS-GF, PA-CF, PPA-CF, PPA-GF)
- Generieke profielen (Generic PLA, Generic PETG, enz.) die als startpunt dienen voor filamenten van derden

Generieke profielen zijn een goed startpunt. Pas de temperatuur aan met ±5 °C op basis van het werkelijke filament.

## Profielen van derden

Veel toonaangevende leveranciers bieden kant-en-klare Bambu Studio-profielen aan die zijn geoptimaliseerd voor hun specifieke filament:

| Leverancier | Beschikbare profielen | Downloaden |
|---|---|---|
| [Polyalkemi](https://polyalkemi.no) | PLA, PLA High Speed, PETG, PETG-CF, ABS | [Bambu Lab-profielen](https://gammel.polyalkemi.no/bambulabprofiler/) |
| [eSUN](https://www.esun3d.com) | PLA+, ePLA-Lite, PETG, eABS | [eSUN-profielen](https://www.esun3d.com/bambu-lab-3d-printer-filament-setting/) |
| [Fillamentum](https://fillamentum.com) | Nonoilen PLA, PLA, PET-G | [Fillamentum-profielen](https://fillamentum.com/pages/bambu-lab-print-profiles) |
| [Spectrum](https://spectrumfilaments.com) | PETG FR V0, PETG-HT100 | [Spectrum-profielen](https://spectrumfilaments.com/bambu-lab-profiles/) |
| [Fiberlogy](https://fiberlogy.com) | Easy-PETG, Matte-PETG, TPU 30D | [Fiberlogy-profielen](https://fiberlogy.com/en/printing-profiles/) |
| [add:north](https://addnorth.com) | PLA, PETG, AduraX, X-PLA | [add:north-profielen](https://addnorth.com/printing-profiles) |

:::info Waar profielen te vinden?
- **Bambu Studio:** Ingebouwde profielen voor Bambu Lab-materialen en veel derde partijen
- **Website van de leverancier:** Zoek naar "Bambu Studio profile" of "JSON profile" onder downloads
- **Bambu Dashboard:** Onder het Printprofielen-paneel in de Hulpmiddelen-sectie
- **MakerWorld:** Profielen worden vaak samen met modellen gedeeld door andere gebruikers
:::

## Profielen exporteren en delen

Eigen profielen kunnen worden geëxporteerd en gedeeld met anderen:

1. Ga naar **Bestand → Exporteren → Configuratie exporteren**
2. Selecteer welke profielen (filament, proces, printer) je wilt exporteren
3. Sla op als JSON-bestand
4. Deel het bestand direct of upload naar MakerWorld

Dit is met name handig als je een profiel in de loop van de tijd hebt verfijnd en het wilt bewaren bij herinstallatie van Bambu Studio.

---

## Probleemoplossing met profielen

### Stringing

Haarfijne draden tussen geprinte onderdelen — probeer in deze volgorde:

1. Vergroot de retractieafstand met 0,5 mm
2. Verlaag de printtemperatuur met 5 °C
3. Activeer "Wipe on retract"
4. Controleer of het filament droog is

### Ondervulling / gaten in wanden

De print ziet er niet solide uit of heeft gaten:

1. Controleer of de instelling voor filamentdiameter klopt (1,75 mm)
2. Kalibreer de flow rate in Bambu Studio (Kalibrering → Flow Rate)
3. Verhoog de temperatuur met 5 °C
4. Controleer op gedeeltelijk verstopte nozzle

### Slechte laaghechting

Lagen zitten niet goed aan elkaar:

1. Verhoog de temperatuur met 5–10 °C
2. Verlaag de koelventilator (met name PETG en ABS)
3. Verlaag de printsnelheid
4. Controleer of de behuizing warm genoeg is (voor ABS/ASA)
