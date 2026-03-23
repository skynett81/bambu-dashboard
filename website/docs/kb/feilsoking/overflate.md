---
sidebar_position: 4
title: Overflatefeil
description: Diagnose og fiks vanlige overflateproblem — blobs, zits, lag-linjer, elephant foot og mer
---

# Overflatefeil

Overflaten på en 3D-print forteller mye om hva som skjer inne i systemet. De fleste overflatefeil har én til to klare årsaker — med riktig diagnose er de overraskende enkle å rette opp.

## Rask diagnoseoversikt

| Symptom | Vanligste årsak | Første tiltak |
|---|---|---|
| Blobs og zits | Overextrusion, seam-plassering | Juster seam, kalibrer flow |
| Synlige lag-linjer | Z-wobble, for tykke lag | Bytt til finere lag, sjekk Z-akse |
| Elephant foot | Første lag for bredt | Elephant foot compensation |
| Ringing/ghosting | Vibrasjoner ved høy hastighet | Senk hastighet, aktiver input shaper |
| Under-extrusion | Blokkert dyse, for lav temp | Rens dyse, øk temp |
| Over-extrusion | For høy flow rate | Kalibrer flow rate |
| Pillowing | For få topplag, for lite kjøling | Øk antall topplag, øk kjølevifte |
| Lagdeling | For lav temp, for mye kjøling | Øk temp, reduser kjølevifte |

---

## Blobs og zits

Blobs er uregelmessige klumper på overflaten. Zits er prikklignende punkter — gjerne langs seam-linjen.

### Årsaker

- **Overextrusion** — for mye plast ekstruderes og presses ut til siden
- **Dårlig seam-plassering** — standard "nearest"-seam samler all overgang på samme sted
- **Retract-problem** — utilstrekkelig retract gir press-build-up i dysen
- **Fuktig filament** — fuktighet skaper mikrobobler og drypp

### Løsninger

**Seam-innstillinger i Bambu Studio:**
```
Bambu Studio → Kvalitet → Seam position
- Aligned: Alle seams på samme sted (synlig, men ryddig)
- Nearest: Nærmeste punkt (sprer blobs tilfeldig)
- Back: Bak objektet (anbefalt for visuell kvalitet)
- Random: Tilfeldig fordeling (kamuflerer seam best)
```

**Flow rate-kalibrering:**
```
Bambu Studio → Kalibrering → Flow rate
Juster i steg på ±2 % inntil blobs forsvinner
```

:::tip Seam på "Back" for visuell kvalitet
Plasser seam på baksiden av objektet slik at den er minst synlig. Kombiner med "Wipe on retract" for renere seam-avslutning.
:::

---

## Synlige lag-linjer

Alle FDM-prints har lag-linjer, men de skal være konsistente og knapt synlige på normale prints. Unormal synlighet peker på konkrete problemer.

### Årsaker

- **Z-wobble** — Z-aksen vibrerer eller er ikke rett, gir bølgete mønster over hele høyden
- **For tykke lag** — laghøyde over 0.28 mm er merkbar selv på perfekte prints
- **Temperatursvingninger** — inkonsistent smeltetemperatur gir varierende bredde på lag
- **Inkonsistent filamentdiameter** — billig filament med varierende diameter

### Løsninger

**Z-wobble:**
- Sjekk at skruespindelen (Z-leadscrew) er ren og smurt
- Kontroller at spindelen ikke er bøyd (visuell inspeksjon ved rotering)
- Se vedlikeholdsartikkel for [smøring av Z-akse](/docs/kb/vedlikehold/smoring)

**Laghøyde:**
- Bytt til 0.12 mm eller 0.16 mm for jevnere overflate
- Husk at halvering av laghøyde dobler printtid

**Temperatursvingninger:**
- Bruk PID-kalibrering (tilgjengelig via Bambu Studios vedlikeholdsmeny)
- Unngå lufttrekk som kjøler ned dysen under printing

---

## Elephant foot

Elephant foot er når det første laget er bredere enn resten av objektet — som om objektet "bretter seg ut" i bunnen.

### Årsaker

- Første lag squishes for hardt mot platen (for tett Z-offset)
- For høy bedtemperatur holder plasten myk og flytende for lenge
- For lav kjøling på første lag gir plast mer tid til å spre seg

### Løsninger

**Elephant foot compensation i Bambu Studio:**
```
Bambu Studio → Kvalitet → Elephant foot compensation
Start med 0.1–0.2 mm og juster til foten forsvinner
```

**Z-offset:**
- Kalibrer first layer height på nytt
- Hev Z-offset 0.05 mm om gangen til foten er borte

**Bedtemperatur:**
- Senk bedtemperatur 5–10 °C
- For PLA: 55 °C er ofte nok — 65 °C kan gi elephant foot

:::warning Ikke kompenser for mye
For høy elephant foot compensation kan gi et hull mellom første lag og resten. Juster forsiktig i steg på 0.05 mm.
:::

---

## Ringing og ghosting

Ringing (også kalt "ghosting" eller "echoing") er et bølgemønster i overflaten like etter skarpe kanter eller hjørner. Mønsteret "ekkoer" ut fra kanten.

### Årsaker

- **Vibrasjoner** — rask akselerasjon og deselerasjon ved hjørner sender vibrasjoner gjennom rammen
- **For høy hastighet** — særlig yttervegg-hastighet over 100 mm/s gir markant ringing
- **Løse deler** — løs spole, vibrerende kabelhylse eller løst montert printer

### Løsninger

**Bambu Lab input shaper (Resonance Compensation):**
```
Bambu Studio → Printer → Resonance compensation
Bambu Lab X1C og P1S har innebygd akselerometer og autokalibrerer dette
```

**Reduser hastighet:**
```
Yttervegg: Senk til 60–80 mm/s
Akselerasjon: Reduser fra standard til 3000–5000 mm/s²
```

**Mekanisk sjekk:**
- Kontroller at printeren står på et stabilt underlag
- Sjekk at spolen ikke vibrerer i sporens holder
- Stram alle tilgjengelige skruer på rammens ytre paneler

:::tip X1C og P1S autokalibrerer ringing
Bambu Lab X1C og P1S har innebygd akselerometerkalibrering som kjøres automatisk ved start. Kjør "Full calibration" fra vedlikeholdsmenyen om ringing dukker opp etter en periode.
:::

---

## Under-extrusion

Under-extrusion er når printeren ekstruderer for lite plast. Resultatet er tynne, svake vegger, synlige hull mellom lag, og "scraggly" overflate.

### Årsaker

- **Delvis blokkert dyse** — karbonoppbygging reduserer gjennomstrømning
- **For lav dysetemperatur** — plasten er ikke flytende nok
- **Slitt tannhjul** i extruder-mekanismen griper ikke filamentet godt nok
- **For høy hastighet** — extruder klarer ikke holde tritt med ønsket flow

### Løsninger

**Kald trekk (Cold pull):**
```
1. Varm dysen til 220 °C
2. Trykk filament manuelt inn
3. Kjøl dysen ned til 90 °C (PLA) mens du holder trykk
4. Trekk filamentet raskt ut
5. Gjenta til det som trekkes ut er rent
```

**Temperaturjustering:**
- Øk dysetemperatur 5–10 °C og test på nytt
- Kjøring med for lav temperatur er en vanlig under-extrusion-årsak

**Flow rate-kalibrering:**
```
Bambu Studio → Kalibrering → Flow rate
Øk gradvis til under-extrusion forsvinner
```

**Sjekk extruder-tannhjul:**
- Fjern filament og inspiser tannhjulet
- Rengjør med en liten børste om det er filamentpulver i tannene

---

## Over-extrusion

Over-extrusion gir for bred streng — overflaten ser løsgjordt, glanset eller ujevn ut, med tendens til blobs.

### Årsaker

- **For høy flow rate** (EM — Extrusion Multiplier)
- **Feil filamentdiameter** — 2.85 mm filament med 1.75 mm-profil gir massiv over-extrusion
- **For høy dysetemperatur** gjør plasten for flytende

### Løsninger

**Flow rate-kalibrering:**
```
Bambu Studio → Kalibrering → Flow rate
Senk i steg på 2 % til overflaten er jevn og matt
```

**Verifiser filamentdiameter:**
- Mål faktisk filamentdiameter med en skyvelær på 5–10 steder langs filamentet
- Gjennomsnitt avvik over 0.05 mm indikerer lavkvalitets-filament

---

## Pillowing

Pillowing er boblete, ujevne topplag med "puter" av plast mellom topplagene. Særlig tydelig med lav infill og for få topplag.

### Årsaker

- **For få topplag** — plasten over infill kollapser ned i hullene
- **For lite kjøling** — plasten stivner ikke raskt nok til å bygge bro over infill-hullene
- **For lav infill** — store huller i infill er vanskelige å bruke over

### Løsninger

**Øk antall topplag:**
```
Bambu Studio → Kvalitet → Top shell layers
Minimum: 4 lag
Anbefalt for jevn overflate: 5–6 lag
```

**Øk kjøling:**
- PLA bør ha kjølevifte på 100 % fra lag 3
- Utilstrekkelig kjøling er den vanligste årsaken til pillowing

**Øk infill:**
- Gå fra 10–15 % opp til 20–25 % om pillowing vedvarer
- Gyroid-mønster gir jevnere bro-overflate enn linjer

:::tip Ironing
Bambu Studios "ironing"-funksjon kjører dysen over topplaget en ekstra gang for å jevne ut overflaten. Aktiver under Kvalitet → Ironing for beste topplag-finish.
:::

---

## Lagdeling (Layer separation / delamination)

Lagdeling er når lag ikke kleber skikkelig til hverandre. I verste fall sprekker printen opp langs lag-linjer.

### Årsaker

- **For lav dysetemperatur** — plasten smelter ikke godt nok inn i laget under
- **For mye kjøling** — stivner plasten for raskt før den rekker å fuse
- **For høy lagtykkelse** — over 80 % av dyse-diameter gir dårlig fusjon
- **For høy hastighet** — redusert smeltetid per mm bane

### Løsninger

**Øk temperatur:**
- Prøv +10 °C fra standard og observer
- ABS og ASA er særlig sensitive — krever kontrollert kammervarmte

**Reduser kjøling:**
- ABS: kjølevifte AV (0 %)
- PETG: 20–40 % maks
- PLA: kan tåle full kjøling, men reduser om lagdeling oppstår

**Lagtykkelse:**
- Bruk maks 75 % av dyse-diameter
- Med 0.4 mm dyse: maks anbefalt laghøyde er 0.30 mm

**Sjekk at innelukket er varmt nok (ABS/ASA/PA/PC):**
```
Bambu Lab X1C/P1S: La kammeret varme opp til 40–60 °C
før print starter — ikke åpne dør under printing
```

---

## Generelle feilsøkingstips

1. **Endre én ting om gangen** — test med et lite kalibreringsprint mellom hver endring
2. **Tørk filamentet først** — mange overflatefeil er egentlig fuktsymptomer
3. **Rens dysen** — delvis blokkering gir inkonsistente overflatefeil som er vanskelige å diagnostisere
4. **Kjør fullstendig kalibrering** fra Bambu Studios vedlikeholdsmeny etter større justeringer
5. **Bruk Bambu Dashboard** for å spore hvilke innstillinger som ga best resultat over tid
