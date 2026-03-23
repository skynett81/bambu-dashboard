---
sidebar_position: 8
title: Printprofiler og innstillinger
description: Forstå og tilpasse printprofiler i Bambu Studio — hastighet, temperatur, retract og kvalitetsinnstillinger
---

# Printprofiler og innstillinger

En printprofil er en samling innstillinger som bestemmer nøyaktig hvordan printeren jobber — fra temperatur og hastighet til retract og laghøyde. Riktig profil er forskjellen mellom en perfekt print og en mislykket en.

## Hva er en printprofil?

Bambu Studio skiller mellom tre typer profiler:

- **Filamentprofil** — temperatur, kjøling, retract og tørking for et spesifikt materiale
- **Prossessprofil** — laghøyde, hastighet, infill og støtteinnstillinger
- **Printerprofil** — maskinspesifikke innstillinger (settes automatisk for Bambu Lab-printere)

Bambu Studio leverer generiske profiler for alle Bambu Lab-filamenter og en rekke tredjepartsmaterialer. Tredjepartsleverandører som Polyalkemi, eSUN og Fillamentum lager i tillegg optimaliserte profiler som er finjustert for akkurat deres filament.

Profiler kan importeres, eksporteres og deles fritt mellom brukere.

## Importere profiler i Bambu Studio

1. Last ned profilen (JSON-fil) fra leverandørens nettside eller MakerWorld
2. Åpne Bambu Studio
3. Gå til **Fil → Importer → Importer konfigurasjon**
4. Velg nedlastet fil
5. Profilen dukker opp under filamentvalg i sliceren

:::tip Organisering
Gi profiler et beskrivende navn, f.eks. «Polyalkemi PLA HF 0.20mm Balanced», slik at du lett finner riktig profil neste gang.
:::

## Viktige innstillinger forklart

### Temperatur

Temperatur er den viktigste enkeltinnstillingen. For lav temperatur gir dårlig lagheft og underfylling. For høy gir stringing, boblende overflate og brent filament.

| Innstilling | Beskrivelse | Typisk PLA | Typisk PETG | Typisk ABS |
|---|---|---|---|---|
| Dysetemperatur | Smeltetemperatur | 200–220 °C | 230–250 °C | 240–260 °C |
| Bed-temperatur | Byggplatevarme | 55–65 °C | 70–80 °C | 90–110 °C |
| Kammertemperatur | Innelukke-temp | Ikke nødvendig | Valgfritt | 40–60 °C anbefalt |

Bambu Lab X1C og P1-serien har aktiv kammervarmefunksjon. For ABS og ASA er dette kritisk for å unngå warping og lagdeling.

### Hastighet

Bambu Lab-printere kan kjøre ekstremt raskt, men høyere hastighet betyr ikke alltid bedre resultat. Det er spesielt yttervegghastigheten som påvirker overflaten.

| Innstilling | Hva det påvirker | Kvalitetsmodus | Balansert | Rask |
|---|---|---|---|---|
| Yttervegg | Overflateresultat | 45–60 mm/s | 100 mm/s | 150+ mm/s |
| Innervegg | Strukturell styrke | 100 mm/s | 150 mm/s | 200+ mm/s |
| Infill | Indre fylling | 150 mm/s | 200 mm/s | 300+ mm/s |
| Topplag | Topp-overflate | 45–60 mm/s | 80 mm/s | 100 mm/s |
| Bunnlag | Første lag | 30–50 mm/s | 50 mm/s | 50 mm/s |

:::tip Yttervegg-hastighet er nøkkelen til overflatekvalitet
Senk yttervegghastigheten til 45–60 mm/s for silkeglanset finish. Dette gjelder spesielt for Silk PLA og Matte-filamenter. Indre vegger og infill kan fortsatt kjøre raskt uten at overflaten påvirkes.
:::

### Retract (tilbaketrekking)

Retract trekker filamentet litt tilbake i dysen når printeren beveger seg uten å ekskrudere. Dette forhindrer stringing (hårfine tråder mellom deler). Feil retract-innstillinger gir enten stringing (for lite) eller jamming (for mye).

| Materiale | Retract-distanse | Retract-hastighet | Merknad |
|---|---|---|---|
| PLA | 0.8–2.0 mm | 30–50 mm/s | Standard for de fleste |
| PETG | 1.0–3.0 mm | 20–40 mm/s | For mye = jamming |
| ABS | 0.5–1.5 mm | 30–50 mm/s | Lignende PLA |
| TPU | 0–1.0 mm | 10–20 mm/s | Minimal! Eller deaktiver |
| Nylon | 1.0–2.0 mm | 30–40 mm/s | Krever tørt filament |

:::warning TPU-retract
For TPU og andre fleksible materialer: bruk minimal retract (0–1 mm) eller deaktiver helt. For mye retract forårsaker at det myke filamentet bøyer seg og blokkerer i Bowden-røret, noe som fører til jamming.
:::

### Laghøyde

Laghøyde bestemmer balansen mellom detaljnivå og printhastighet. Lav laghøyde gir finere detaljer og glattere overflater, men tar mye lengre tid.

| Laghøyde | Beskrivelse | Bruksområde |
|---|---|---|
| 0.08 mm | Ultrafin | Miniatyrfigurer, detaljerte modeller |
| 0.12 mm | Fin | Visuell kvalitet, tekst, logoer |
| 0.16 mm | Høy kvalitet | Standard for de fleste prints |
| 0.20 mm | Balansert | God balanse tid/kvalitet |
| 0.28 mm | Rask | Funksjonelle deler, prototyper |

Bambu Studio opererer med prosessinnstillinger som «0.16mm High Quality» og «0.20mm Balanced Quality» — disse setter laghøyde og tilpasser hastighet og kjøling automatisk.

### Infill (fylling)

Infill bestemmer hvor mye materiale som fyller innsiden av printen. Mer infill = sterkere, tyngre og lengre printtid.

| Prosent | Bruksområde | Anbefalt mønster |
|---|---|---|
| 10–15 % | Dekorasjon, visuell | Gyroid |
| 20–30 % | Generelt bruk | Cubic, Gyroid |
| 40–60 % | Funksjonelle deler | Cubic, Honeycomb |
| 80–100 % | Maksimal styrke | Rectilinear |

:::tip Gyroid er kong
Gyroid-mønster gir best styrke-til-vekt-ratio og er isotropisk — like sterk i alle retninger. Det er også raskere å printe enn honeycomb og ser bra ut ved åpne modeller. Standard valg for de fleste situasjoner.
:::

## Profil-tips per materiale

### PLA — kvalitetsfokus

PLA er tilgivende og lett å jobbe med. Fokus på overflatekvalitet:

- **Yttervegg:** 60 mm/s for perfekt overflate, spesielt med Silk PLA
- **Kjølevifte:** 100 % etter lag 3 — kritisk for skarpe detaljer og broer
- **Brim:** Ikke nødvendig på ren PLA med riktig kalibrert plate
- **Laghøyde:** 0.16 mm High Quality gir fin balanse for dekorative deler

### PETG — balanse

PETG er sterkere enn PLA, men mer krevende å fine-tune:

- **Prosessinnstilling:** 0.16 mm High Quality eller 0.20 mm Balanced Quality
- **Kjølevifte:** 30–50 % — for mye kjøling gir dårlig lagheft og skjøre prints
- **Z-hop:** Aktiver for å unngå at dysen drar i overflaten ved travelMove
- **Stringing:** Juster retract og print litt varmere heller enn kaldere

### ABS — innelukke er alt

ABS printer fint, men krever kontrollert miljø:

- **Kjølevifte:** AV (0 %) — helt kritisk! Kjøling forårsaker lagdeling og warping
- **Innelukke:** Lukk dørene og la kammeret varme opp til 40–60 °C før print starter
- **Brim:** 5–8 mm anbefalt for store og flate deler — unngår warping i hjørner
- **Ventilasjon:** Sørg for god ventilasjon i rommet — ABS avgir styren-damper

### TPU — sakte og forsiktig

Fleksible materialer krever helt annen tilnærming:

- **Hastighet:** Maks 30 mm/s — for rask printing forårsaker at filamentet bukter seg
- **Retract:** Minimal (0–1 mm) eller deaktiver helt
- **Direkte drive:** TPU fungerer kun på Bambu Lab sine maskiner med innebygd direct drive
- **Laghøyde:** 0.20 mm Balanced gir god lagfusjon uten for mye spenning

### Nylon — tørt filament er alt

Nylon er hygroskopisk og absorberer fuktighet i løpet av timer:

- **Tørk alltid:** 70–80 °C i 8–12 timer før print
- **Innelukke:** Kjør fra tørke-box direkte inn i AMS for å holde filamentet tørt
- **Retract:** Moderat (1.0–2.0 mm) — fuktig nylon gir mye mer stringing
- **Byggplate:** Engineering Plate med lim, eller Garolite-plate for best heft

## Bambu Lab forhåndsinnstillinger

Bambu Studio har innebygde profiler for hele Bambu Lab-produktfamilien:

- Bambu Lab Basic PLA, PETG, ABS, TPU, PVA, PA, PC, ASA
- Bambu Lab Support materialer (Support W, Support G)
- Bambu Lab Specialty (PLA-CF, PETG-CF, ABS-GF, PA-CF, PPA-CF, PPA-GF)
- Generiske profiler (Generic PLA, Generic PETG, osv.) som fungerer som utgangspunkt for tredjepartsfilament

Generiske profiler er et godt startpunkt. Finjuster temperatur med ±5 °C basert på faktisk filament.

## Tredjepartsprofiler

Mange ledende leverandører tilbyr ferdige Bambu Studio-profiler optimalisert for akkurat sitt filament:

| Leverandør | Tilgjengelige profiler | Last ned |
|---|---|---|
| [Polyalkemi](https://polyalkemi.no) | PLA, PLA High Speed, PETG, PETG-CF, ABS | [Bambu Lab-profiler](https://gammel.polyalkemi.no/bambulabprofiler/) |
| [eSUN](https://www.esun3d.com) | PLA+, ePLA-Lite, PETG, eABS | [eSUN-profiler](https://www.esun3d.com/bambu-lab-3d-printer-filament-setting/) |
| [Fillamentum](https://fillamentum.com) | Nonoilen PLA, PLA, PET-G | [Fillamentum-profiler](https://fillamentum.com/pages/bambu-lab-print-profiles) |
| [Spectrum](https://spectrumfilaments.com) | PETG FR V0, PETG-HT100 | [Spectrum-profiler](https://spectrumfilaments.com/bambu-lab-profiles/) |
| [Fiberlogy](https://fiberlogy.com) | Easy-PETG, Matte-PETG, TPU 30D | [Fiberlogy-profiler](https://fiberlogy.com/en/printing-profiles/) |
| [add:north](https://addnorth.com) | PLA, PETG, AduraX, X-PLA | [add:north-profiler](https://addnorth.com/printing-profiles) |

:::info Hvor finne profiler?
- **Bambu Studio:** Innebygde profiler for Bambu Lab-materialer og mange tredjeparter
- **Leverandørens nettside:** Søk etter «Bambu Studio profile» eller «JSON profile» under nedlastinger
- **Bambu Dashboard:** Under Printprofiler-panelet i Verktøy-seksjonen
- **MakerWorld:** Profiler deles ofte sammen med modeller av andre brukere
:::

## Eksportere og dele profiler

Egne profiler kan eksporteres og deles med andre:

1. Gå til **Fil → Eksporter → Eksporter konfigurasjon**
2. Velg hvilke profiler (filament, prosess, printer) du vil eksportere
3. Lagre som JSON-fil
4. Del filen direkte eller last opp til MakerWorld

Dette er spesielt nyttig om du har finjustert en profil over tid og vil ta vare på den ved reinstallasjon av Bambu Studio.

---

## Feilsøking med profiler

### Stringing

Hårfine tråder mellom printede deler — prøv i denne rekkefølgen:

1. Øk retract-distanse med 0.5 mm
2. Senk printtemperatur med 5 °C
3. Aktiver «Wipe on retract»
4. Sjekk at filamentet er tørt

### Underfylling / hull i vegger

Printen ser ikke solid ut eller har huller:

1. Sjekk at filament-diameter-innstillingen stemmer (1.75 mm)
2. Kalibrer flow rate i Bambu Studio (Kalibrering → Flow Rate)
3. Øk temperatur med 5 °C
4. Sjekk for delvis blokkert dyse

### Dårlig lagheft

Lagene henger ikke godt sammen:

1. Øk temperatur med 5–10 °C
2. Reduser kjølevifte (spesielt PETG og ABS)
3. Reduser printhastighet
4. Sjekk at innelukket er varmt nok (for ABS/ASA)
