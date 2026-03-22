---
sidebar_position: 1
title: Statistikk
description: Suksessrate, filamentforbruk, trender og nøkkeltall for alle Bambu Lab-printere over tid
---

# Statistikk

Statistikk-siden gir deg en komplett oversikt over printeraktiviteten din med nøkkeltall, trender og filamentforbruk over valgfri tidsperiode.

Gå til: **https://localhost:3443/#statistics**

## Nøkkeltall

Øverst på siden vises fire KPI-kort:

| Nøkkeltall | Beskrivelse |
|---|---|
| **Suksessrate** | Andel vellykkede prints av totalt antall prints |
| **Totalt filament** | Gram brukt i valgt periode |
| **Totale print-timer** | Akkumulert printtid |
| **Gjennomsnittlig printtid** | Median varighet per print |

Hvert nøkkeltall viser endring fra forrige periode (↑ opp / ↓ ned) som prosentavvik.

## Suksessrate

Suksessraten beregnes per printer og totalt:

- **Vellykket** — print fullført uten avbrudd
- **Avbrutt** — manuelt stoppet av bruker
- **Feilet** — stoppet av Print Guard, HMS-feil eller maskinvaresvikt

Klikk på suksessrate-diagrammet for å se hvilke prints som feilet og årsaken.

:::tip Forbedre suksessraten
Bruk [Feilmønsteranalyse](../overvaaking/erroranalysis) for å identifisere og rette opp årsaker til mislykkede prints.
:::

## Trender

Trendvisningen viser utvikling over tid som linjediagram:

1. Velg **Tidsperiode**: Siste 7 / 30 / 90 / 365 dager
2. Velg **Gruppering**: Dag / Uke / Måned
3. Velg **Metrikk**: Antall prints / Timer / Gram / Suksessrate
4. Klikk **Sammenlign** for å overlappe to metrikker

Grafen støtter zoom (scroll) og panorering (klikk og dra).

## Filamentforbruk

Filamentforbruk vises som:

- **Stolpediagram** — forbruk per dag/uke/måned
- **Kakediagram** — fordeling mellom materialer (PLA, PETG, ABS, osv.)
- **Tabell** — detaljert liste med totalt gram, meter og kostnad per materiale

### Forbruk per printer

Bruk flervalg-filteret øverst for å:
- Vise kun én printer
- Sammenligne to printere side ved side
- Se aggregert totalt for alle printere

## Aktivitetskalender

Se en kompakt GitHub-stil heatmap direkte på statistikk-siden (forenklet visning), eller gå til full [Aktivitetskalender](./calendar) for mer detaljert visning.

## Eksport

1. Klikk **Eksporter statistikk**
2. Velg datointervall og hvilke metrikker du vil ha med
3. Velg format: **CSV** (rådata), **PDF** (rapport) eller **JSON**
4. Filen lastes ned

CSV-eksporten er kompatibel med Excel og Google Sheets for videre analyse.

## Sammenlikning med forrige periode

Aktiver **Vis forrige periode** for å overlappe grafer med tilsvarende forrige periode:

- Siste 30 dager vs. 30 dagene før
- Inneværende måned vs. forrige måned
- Inneværende år vs. fjoråret

Dette gjør det enkelt å se om du printer mer eller mindre enn før, og om suksessraten forbedrer seg.
