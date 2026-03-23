---
sidebar_position: 8
title: Utskriftsprofiler och inställningar
description: Förstå och anpassa utskriftsprofiler i Bambu Studio — hastighet, temperatur, retract och kvalitetsinställningar
---

# Utskriftsprofiler och inställningar

En utskriftsprofil är en samling inställningar som bestämmer exakt hur skrivaren arbetar — från temperatur och hastighet till retract och lagerhoojd. Rätt profil är skillnaden mellan en perfekt utskrift och en misslyckad.

## Vad är en utskriftsprofil?

Bambu Studio skiljer mellan tre typer av profiler:

- **Filamentprofil** — temperatur, kylning, retract och torkning för ett specifikt material
- **Processprofil** — lagerhoojd, hastighet, infill och stödinställningar
- **Skrivarprofil** — maskinspecifika inställningar (ställs in automatiskt för Bambu Lab-skrivare)

Bambu Studio levererar generiska profiler för alla Bambu Lab-filamenter och en rad tredjeparts-material. Tredjeparts-leverantörer som Polyalkemi, eSUN och Fillamentum skapar dessutom optimerade profiler som är finjusterade för precis deras filament.

Profiler kan importeras, exporteras och delas fritt mellan användare.

## Importera profiler i Bambu Studio

1. Ladda ner profilen (JSON-fil) från leverantörens webbplats eller MakerWorld
2. Öppna Bambu Studio
3. Gå till **Fil → Importera → Importera konfiguration**
4. Välj nedladdad fil
5. Profilen dyker upp under filamentval i slicern

:::tip Organisering
Ge profiler ett beskrivande namn, t.ex. «Polyalkemi PLA HF 0.20mm Balanced», så att du lätt hittar rätt profil nästa gång.
:::

## Viktiga inställningar förklarade

### Temperatur

Temperatur är den viktigaste enskilda inställningen. För låg temperatur ger dålig lageradhesion och underfyllning. För hög ger stringing, bubblande yta och bränt filament.

| Inställning | Beskrivning | Typisk PLA | Typisk PETG | Typisk ABS |
|---|---|---|---|---|
| Munstyckstemperatur | Smälttemperatur | 200–220 °C | 230–250 °C | 240–260 °C |
| Bädd-temperatur | Byggplatteuppvärmning | 55–65 °C | 70–80 °C | 90–110 °C |
| Kammartemperatur | Inneslutnings-temp | Inte nödvändigt | Valfritt | 40–60 °C rekommenderas |

Bambu Lab X1C och P1-serien har aktiv kammaruppvärmningsfunktion. För ABS och ASA är detta kritiskt för att undvika warping och lagerskillnad.

### Hastighet

Bambu Lab-skrivare kan köra extremt snabbt, men högre hastighet betyder inte alltid bättre resultat. Det är särskilt yttervägghastigheten som påverkar ytan.

| Inställning | Vad det påverkar | Kvalitetsläge | Balanserat | Snabbt |
|---|---|---|---|---|
| Yttervägg | Ytresultat | 45–60 mm/s | 100 mm/s | 150+ mm/s |
| Innervägg | Strukturell styrka | 100 mm/s | 150 mm/s | 200+ mm/s |
| Infill | Inre fyllning | 150 mm/s | 200 mm/s | 300+ mm/s |
| Topplag | Topp-yta | 45–60 mm/s | 80 mm/s | 100 mm/s |
| Bottenlager | Första lager | 30–50 mm/s | 50 mm/s | 50 mm/s |

:::tip Yttervägghastighet är nyckeln till ytkvalitet
Sänk yttervägghastigheten till 45–60 mm/s för silkesglänsande finish. Detta gäller särskilt för Silk PLA och Matte-filamenter. Innerväggar och infill kan fortfarande köra snabbt utan att ytan påverkas.
:::

### Retract (återdragning)

Retract drar tillbaka filamenten lite i munstycket när skrivaren rör sig utan att extrudera. Detta förhindrar stringing (hårfina trådar mellan delar). Felaktiga retract-inställningar ger antingen stringing (för lite) eller jamming (för mycket).

| Material | Retract-avstånd | Retract-hastighet | Anmärkning |
|---|---|---|---|
| PLA | 0,8–2,0 mm | 30–50 mm/s | Standard för de flesta |
| PETG | 1,0–3,0 mm | 20–40 mm/s | För mycket = jamming |
| ABS | 0,5–1,5 mm | 30–50 mm/s | Liknande PLA |
| TPU | 0–1,0 mm | 10–20 mm/s | Minimal! Eller inaktivera |
| Nylon | 1,0–2,0 mm | 30–40 mm/s | Kräver torr filament |

:::warning TPU-retract
För TPU och andra flexibla material: använd minimal retract (0–1 mm) eller inaktivera helt. För mycket retract orsakar att det mjuka filamenten böjer sig och blockerar i Bowden-röret, vilket leder till jamming.
:::

### Lagerhoojd

Lagerhoojd bestämmer balansen mellan detaljnivå och utskriftshastighet. Låg lagerhoojd ger finare detaljer och jämnare ytor, men tar mycket längre tid.

| Lagerhoojd | Beskrivning | Användningsområde |
|---|---|---|
| 0,08 mm | Ultrafin | Miniatyrer, detaljerade modeller |
| 0,12 mm | Fin | Visuell kvalitet, text, logotyper |
| 0,16 mm | Hög kvalitet | Standard för de flesta utskrifter |
| 0,20 mm | Balanserat | God balans tid/kvalitet |
| 0,28 mm | Snabbt | Funktionella delar, prototyper |

Bambu Studio opererar med processinställningar som «0.16mm High Quality» och «0.20mm Balanced Quality» — dessa ställer in lagerhoojd och anpassar hastighet och kylning automatiskt.

### Infill (fyllning)

Infill bestämmer hur mycket material som fyller insidan av utskriften. Mer infill = starkare, tyngre och längre utskriftstid.

| Procent | Användningsområde | Rekommenderat mönster |
|---|---|---|
| 10–15 % | Dekoration, visuell | Gyroid |
| 20–30 % | Allmänt bruk | Cubic, Gyroid |
| 40–60 % | Funktionella delar | Cubic, Honeycomb |
| 80–100 % | Maximal styrka | Rectilinear |

:::tip Gyroid är kung
Gyroid-mönster ger bäst styrka-till-vikt-förhållande och är isotropiskt — lika starkt i alla riktningar. Det är också snabbare att skriva ut än honeycomb och ser bra ut vid öppna modeller. Standardval för de flesta situationer.
:::

## Profiltips per material

### PLA — kvalitetsfokus

PLA är förlåtande och lätt att arbeta med. Fokus på ytkvalitet:

- **Yttervägg:** 60 mm/s för perfekt yta, särskilt med Silk PLA
- **Kylfläkt:** 100 % efter lager 3 — kritiskt för skarpa detaljer och bryggor
- **Brim:** Inte nödvändigt på ren PLA med korrekt kalibrerad platta
- **Lagerhoojd:** 0,16 mm High Quality ger fin balans för dekorativa delar

### PETG — balans

PETG är starkare än PLA, men mer krävande att finjustera:

- **Processinställning:** 0,16 mm High Quality eller 0,20 mm Balanced Quality
- **Kylfläkt:** 30–50 % — för mycket kylning ger dålig lageradhesion och spröda utskrifter
- **Z-hop:** Aktivera för att undvika att munstycket drar i ytan vid travelMove
- **Stringing:** Justera retract och skriv ut lite varmare snarare än kallare

### ABS — inneslutning är allt

ABS skriver ut bra, men kräver kontrollerad miljö:

- **Kylfläkt:** AV (0 %) — helt kritiskt! Kylning orsakar lagerskillnad och warping
- **Inneslutning:** Stäng dörrarna och låt kammaren värmas upp till 40–60 °C innan utskrift startar
- **Brim:** 5–8 mm rekommenderas för stora och platta delar — undviker warping i hörn
- **Ventilation:** Se till att rummet är väl ventilerat — ABS avger styren-ångor

### TPU — långsamt och försiktigt

Flexibla material kräver helt annan tillvägagångssätt:

- **Hastighet:** Max 30 mm/s — för snabb utskrift orsakar att filamenten böjer sig
- **Retract:** Minimal (0–1 mm) eller inaktivera helt
- **Direct drive:** TPU fungerar bara på Bambu Labs maskiner med inbyggd direct drive
- **Lagerhoojd:** 0,20 mm Balanced ger god lagerfusion utan för mycket spänning

### Nylon — torr filament är allt

Nylon är hygroskopisk och absorberar fukt inom timmar:

- **Torka alltid:** 70–80 °C i 8–12 timmar innan utskrift
- **Inneslutning:** Kör från torkbox direkt in i AMS för att hålla filamenten torr
- **Retract:** Modererat (1,0–2,0 mm) — fuktig nylon ger mycket mer stringing
- **Byggplatta:** Engineering Plate med lim, eller Garolite-platta för bäst adhesion

## Bambu Lab förinställningar

Bambu Studio har inbyggda profiler för hela Bambu Lab-produktfamiljen:

- Bambu Lab Basic PLA, PETG, ABS, TPU, PVA, PA, PC, ASA
- Bambu Lab Support material (Support W, Support G)
- Bambu Lab Specialty (PLA-CF, PETG-CF, ABS-GF, PA-CF, PPA-CF, PPA-GF)
- Generiska profiler (Generic PLA, Generic PETG, osv.) som fungerar som utgångspunkt för tredjeparts-filament

Generiska profiler är en bra startpunkt. Finjustera temperatur med ±5 °C baserat på faktisk filament.

## Tredjeparts-profiler

Många ledande leverantörer erbjuder färdiga Bambu Studio-profiler optimerade för precis deras filament:

| Leverantör | Tillgängliga profiler | Ladda ner |
|---|---|---|
| [Polyalkemi](https://polyalkemi.no) | PLA, PLA High Speed, PETG, PETG-CF, ABS | [Bambu Lab-profiler](https://gammel.polyalkemi.no/bambulabprofiler/) |
| [eSUN](https://www.esun3d.com) | PLA+, ePLA-Lite, PETG, eABS | [eSUN-profiler](https://www.esun3d.com/bambu-lab-3d-printer-filament-setting/) |
| [Fillamentum](https://fillamentum.com) | Nonoilen PLA, PLA, PET-G | [Fillamentum-profiler](https://fillamentum.com/pages/bambu-lab-print-profiles) |
| [Spectrum](https://spectrumfilaments.com) | PETG FR V0, PETG-HT100 | [Spectrum-profiler](https://spectrumfilaments.com/bambu-lab-profiles/) |
| [Fiberlogy](https://fiberlogy.com) | Easy-PETG, Matte-PETG, TPU 30D | [Fiberlogy-profiler](https://fiberlogy.com/en/printing-profiles/) |
| [add:north](https://addnorth.com) | PLA, PETG, AduraX, X-PLA | [add:north-profiler](https://addnorth.com/printing-profiles) |

:::info Var hittar man profiler?
- **Bambu Studio:** Inbyggda profiler för Bambu Lab-material och många tredjeparts
- **Leverantörens webbplats:** Sök efter «Bambu Studio profile» eller «JSON profile» under nedladdningar
- **Bambu Dashboard:** Under Utskriftsprofiler-panelen i Verktyg-sektionen
- **MakerWorld:** Profiler delas ofta tillsammans med modeller av andra användare
:::

## Exportera och dela profiler

Egna profiler kan exporteras och delas med andra:

1. Gå till **Fil → Exportera → Exportera konfiguration**
2. Välj vilka profiler (filament, process, skrivare) du vill exportera
3. Spara som JSON-fil
4. Dela filen direkt eller ladda upp till MakerWorld

Detta är särskilt användbart om du har finjusterat en profil över tid och vill bevara den vid ominstallation av Bambu Studio.

---

## Felsökning med profiler

### Stringing

Hårfina trådar mellan utskrivna delar — prova i denna ordning:

1. Öka retract-avstånd med 0,5 mm
2. Sänk utskriftstemperatur med 5 °C
3. Aktivera «Wipe on retract»
4. Kontrollera att filamenten är torr

### Underfyllning / hål i väggar

Utskriften ser inte solid ut eller har hål:

1. Kontrollera att filament-diameter-inställningen stämmer (1,75 mm)
2. Kalibrera flow rate i Bambu Studio (Kalibrering → Flow Rate)
3. Höj temperatur med 5 °C
4. Kontrollera för delvis blockerat munstycke

### Dålig lageradhesion

Lagren häftar inte bra ihop:

1. Höj temperatur med 5–10 °C
2. Minska kylfläkt (särskilt PETG och ABS)
3. Minska utskriftshastighet
4. Kontrollera att inneslutningen är tillräckligt varm (för ABS/ASA)
