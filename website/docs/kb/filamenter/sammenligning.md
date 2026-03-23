---
sidebar_position: 9
title: Materialsammenligning
description: Sammenlign alle 3D-print materialer side ved side — styrke, temp, pris, vanskelighetsgrad
---

# Materialsammenligning

Å velge riktig filament er like viktig som å velge riktig verktøy til en jobb. Denne artikkelen gir deg hele bildet — fra enkel sammenligningstabell til Shore-hardhet, HDT-verdier og en praktisk beslutningsveiledning.

## Stor sammenligningstabell

| Materiale | Styrke | Temp-res | Fleksibilitet | UV-res | Kjemisk res | Dyse-krav | Innelukke | Vanskelighet | Pris |
|---|---|---|---|---|---|---|---|---|---|
| PLA | ★★★ | ★ | ★ | ★ | ★ | Messing | Nei | ★ Lett | Lav |
| PETG | ★★★ | ★★ | ★★ | ★★ | ★★★ | Messing | Nei | ★★ | Lav |
| ABS | ★★★ | ★★★ | ★★ | ★ | ★★ | Messing | JA | ★★★ | Lav |
| ASA | ★★★ | ★★★ | ★★ | ★★★★ | ★★ | Messing | JA | ★★★ | Medium |
| TPU | ★★ | ★★ | ★★★★★ | ★★ | ★★ | Messing | Nei | ★★★ | Medium |
| PA (Nylon) | ★★★★ | ★★★ | ★★★ | ★★ | ★★★★ | Messing | JA | ★★★★ | Høy |
| PA-CF | ★★★★★ | ★★★★ | ★★ | ★★★ | ★★★★ | Herdet stål | JA | ★★★★ | Høy |
| PC | ★★★★ | ★★★★ | ★★ | ★★ | ★★★ | Messing | JA | ★★★★ | Høy |
| PLA-CF | ★★★★ | ★★ | ★ | ★ | ★ | Herdet stål | Nei | ★★ | Medium |

**Forklaring:**
- ★ = svak/lav/dårlig
- ★★★ = middels/standard
- ★★★★★ = excellent/best i klassen

---

## Velg riktig materiale — beslutningsveiledning

Usikker på hva du skal velge? Følg disse spørsmålene:

### Trenger det å tåle varme?
**Ja** → ABS, ASA, PC eller PA

- Litt varme (til ~90 °C): **ABS** eller **ASA**
- Mye varme (over 100 °C): **PC** eller **PA**
- Maksimal temperaturmotstand: **PC** (til ~120 °C) eller **PA-CF** (til ~160 °C)

### Trenger det fleksibilitet?
**Ja** → **TPU**

- Veldig myk (som gummi): TPU 85A
- Standard fleksibelt: TPU 95A
- Semi-fleksibelt: PETG eller PA

### Skal det brukes utendørs?
**Ja** → **ASA** er det klare valget

ASA er utviklet spesifikt for UV-eksponering og er overlegen ABS utendørs. PETG er nest beste valg om ASA ikke er tilgjengelig.

### Trenger det maksimal styrke?
**Ja** → **PA-CF** eller **PC**

- Sterkeste lett-vekt kompositt: **PA-CF**
- Sterkeste rene termoplast: **PC**
- God styrke til lavere pris: **PA (Nylon)**

### Enklest mulig printing?
→ **PLA**

PLA er det mest tilgivende materialet som finnes. Laveste temperatur, ingen innelukke-krav, liten warping-risiko.

### Mat-kontakt?
→ **PLA** (med forbehold)

PLA er i seg selv ikke giftig, men:
- Bruk dyse i rustfritt stål (ikke messing — kan inneholde bly)
- FDM-printer aldri "food-safe" pga. porøs overflate — bakterier kan vokse
- Unngå krevende miljøer (syre, varmt vann, oppvaskmaskin)
- PETG er et bedre alternativ for engangs-kontakt

---

## Shore-hardhet forklart

Shore-hardhet brukes til å beskrive hardhet og stivhet hos elastomere og plastmaterialer. For 3D-print er det særlig relevant for TPU og andre fleksible filamenter.

### Shore A — fleksible materialer

Shore A-skalaen går fra 0 (ekstremt myk, nesten som gel) til 100 (ekstremt hard gummi). Verdier over 90A begynner å nærme seg rigide plastmaterialer.

| Shore A-verdi | Opplevd hardhet | Eksempel |
|---|---|---|
| 30A | Ekstremt myk | Silikon, gelé |
| 50A | Veldig myk | Myk gummi, øreplugger |
| 70A | Myk | Bilslange, løpesko-mellomsåle |
| 85A | Medium myk | Sykkeldekk, myke TPU-filament |
| 95A | Halvstiv | Standard TPU filament |
| 100A ≈ 55D | Grense mellom skalaene | — |

**TPU 95A** er industristandarden for 3D-print og gir god balanse mellom elastisitet og printbarhet. **TPU 85A** er veldig myk og krever mer tålmodighet under printing.

### Shore D — rigide materialer

Shore D brukes for hardere termoplaster:

| Materiale | Omtrentlig Shore D |
|---|---|
| PLA | ~80D |
| PETG | ~70D |
| ABS | ~75D |
| PC | ~80D |
| PA (Nylon) | ~70–75D |

:::tip Ikke blankt det samme
Shore A 95 og Shore D 40 er ikke det samme selv om tallene kan virke nære. Skalaene er forskjellige og overlapper bare delvis rundt 100A/55D-grensen. Sjekk alltid hvilken skala leverandøren oppgir.
:::

---

## Temperaturtoleranser — HDT og VST

Å vite ved hvilken temperatur et materiale begynner å gi etter er kritisk for funksjonelle deler. To standardmålinger brukes:

- **HDT (Heat Deflection Temperature)** — temperaturen der materialet bøyer seg 0.25 mm under en standardisert last. Mål for brukstemperatur under belastning.
- **VST (Vicat Softening Temperature)** — temperaturen der en standardisert nål synker 1 mm inn i materialet. Mål for absolutt mykningspunkt uten last.

| Materiale | HDT (°C) | VST (°C) | Praktisk maks-temp |
|---|---|---|---|
| PLA | 52–60 | 55–65 | ~50 °C |
| PETG | 70–80 | 75–85 | ~70 °C |
| ABS | 85–105 | 95–110 | ~90 °C |
| ASA | 90–105 | 95–108 | ~90 °C |
| TPU | 40–70 | varierer | ~60 °C |
| PA (Nylon) | 70–180 | 180–220 | ~80–160 °C |
| PA-CF | 100–200 | 200–230 | ~100–180 °C |
| PC | 120–140 | 145–160 | ~120 °C |
| PLA-CF | 55–65 | 60–70 | ~55 °C |

:::warning PLA i varme miljøer
PLA-deler i en bil om sommeren er en katastrofeoppskrift. Dashbordet i en parkert bil kan nå 80–90 °C. Bruk ABS, ASA eller PETG til alt som kan bli stående i sol eller varme.
:::

:::info PA-varianter har svært ulike egenskaper
PA er en familie av materialer, ikke ett enkelt materiale. PA6 har lavere HDT (~70 °C), mens PA12 og PA6-CF kan ligge på 160–200 °C. Sjekk alltid datablad for akkurat det filamentet du bruker.
:::

---

## Dyse-krav

### Messing-dyse (standard)

Fungerer for alle materialer **uten** karbonfiber eller glassfiberfyll:
- PLA, PETG, ABS, ASA, TPU, PA, PC, PVA
- Messing er myk og vil slites raskt av abrasive materialer

### Herdet stål-dyse (krav for kompositter)

**PÅKREVD** for:
- PLA-CF (karbon-fiber PLA)
- PETG-CF
- PA-CF
- ABS-GF (glassfiber ABS)
- PPA-CF, PPA-GF
- Alle filamenter med "-CF", "-GF", "-HF" eller "karbonfiber" i navnet

Herdet stål har lavere varmeledningsevne enn messing — kompenser med +5–10 °C på dysetemperatur.

:::danger Karbonfiber-filamenter ødelegger messingdyser raskt
En messingdyse kan bli merkbart slitt etter bare noen hundre gram CF-filament. Resultatet er gradvis under-extrusion og unøyaktige mål. Invester i herdet stål om du printer kompositter.
:::

---

## Kort materialoversikt per bruksområde

| Bruksområde | Anbefalt materiale | Alternativ |
|---|---|---|
| Dekorasjon, figurer | PLA, PLA Silk | PETG |
| Funksjonelle innendørsdeler | PETG | PLA+ |
| Utendørs eksponering | ASA | PETG |
| Fleksible deler, deksler | TPU 95A | TPU 85A |
| Motorrom, varme miljøer | PA-CF, PC | ABS |
| Lett, stiv konstruksjon | PLA-CF | PA-CF |
| Støttemateriell (soluble) | PVA | HIPS |
| Mat-kontakt (begrenset) | PLA (rustfri dyse) | — |
| Maksimal styrke | PA-CF | PC |
| Transparent | PETG klar | PC klar |

Se individuelle materialartikler for detaljert informasjon om temperaturinnstillinger, feilsøking og anbefalte profiler for Bambu Lab-printere.
