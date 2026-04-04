---
sidebar_position: 4
title: Kostnadsberegner
description: Last opp 3MF- eller GCode-fil og beregn totalkostnad for filament, strøm og maskinslitasje før du printer
---

# Kostnadsberegner

Kostnadsberegneren lar deg estimere totalkostnaden for en print før du sender den til printeren — basert på filamentforbruk, strømpris og maskinslitasje.

Gå til: **https://localhost:3443/#cost-estimator**

## Last opp fil

1. Gå til **Kostnadsberegner**
2. Dra og slipp en fil i opplastingsfeltet, eller klikk **Velg fil**
3. Støttede formater: `.3mf`, `.gcode`, `.bgcode`
4. Klikk **Analyser**

For 3MF-filer er det også tilgjengelig en 3D-forhåndsvisning via 3MFConsortium sin 3mfViewer.

:::info Analyse
Systemet analyserer G-koden for å trekke ut filamentforbruk, estimert printtid og materialprofil. Dette tar vanligvis 2–10 sekunder.
:::

## Filamentberegning

Etter analyse vises:

| Felt | Verdi (eksempel) |
|---|---|
| Estimert filament | 47.3 g |
| Materiale (fra fil) | PLA |
| Pris per gram | 0.025 kr (fra filamentlager) |
| **Filamentkostnad** | **1.18 kr** |

Bytt materiale i nedtrekkslisten for å sammenligne kostnader med ulike filamenttyper eller leverandører.

:::tip Materialoverride
Hvis G-koden ikke inneholder materialinformasjon, velg materiale manuelt fra listen. Prisen hentes automatisk fra filamentlageret.
:::

## Strømberegning

Strømkostnaden beregnes basert på:

- **Estimert printtid** — fra G-kode-analyse
- **Printerens effekt** — konfigurert per printermodell (W)
- **Strømpris** — fast pris (kr/kWh) eller live fra Tibber/Nordpool

| Felt | Verdi (eksempel) |
|---|---|
| Estimert printtid | 3 timer 22 min |
| Printereffekt | 350 W (X1C) |
| Estimert forbruk | 1.17 kWh |
| Strømpris | 1.85 kr/kWh |
| **Strømkostnad** | **2.16 kr** |

Aktivér Tibber- eller Nordpool-integrasjonen for å bruke planlagte timespriser basert på ønsket starttidspunkt.

## Maskinslitasje

Slitasjekostnaden estimeres basert på:

- Printtid × timekostnad per printermodell
- Ekstra slitasje for abrasivt materiale (CF, GF, osv.)

| Felt | Verdi (eksempel) |
|---|---|
| Printtid | 3 timer 22 min |
| Timekostnad (slitasje) | 0.80 kr/time |
| **Slitasjekostnad** | **2.69 kr** |

Timekostnaden beregnes fra komponentpriser og forventet levetid (se [Slitasjepredikasjon](../monitoring/wearprediction)).

## Totalsum

| Kostnadspost | Beløp |
|---|---|
| Filament | 1.18 kr |
| Strøm | 2.16 kr |
| Maskinslitasje | 2.69 kr |
| **Totalt** | **6.03 kr** |
| + Påslag (30 %) | 1.81 kr |
| **Salgspris** | **7.84 kr** |

Juster påslaget i prosent-feltet for å beregne anbefalt salgspris til kunden.

## Lagre estimat

Klikk **Lagre estimat** for å koble analysen til et prosjekt:

1. Velg eksisterende prosjekt eller opprett nytt
2. Estimatet lagres og kan brukes som grunnlag for faktura
3. Faktisk kostnad (etter print) sammenlignes automatisk med estimatet

## Batchberegning

Last opp flere filer samtidig for å beregne total kostnad for et komplett sett:

1. Klikk **Batchmodus**
2. Last opp alle `.3mf`/`.gcode`-filer
3. Systemet beregner individuelt og summert kostnad
4. Eksporter sammendraget som PDF eller CSV
