---
sidebar_position: 5
title: Avfallssporing
description: Spor filamentavfall fra AMS-purge og støttemateriell, beregn kostnader og optimaliser effektiviteten
---

# Avfallssporing

Avfallssporing gir deg full innsikt i hvor mye filament som går til spille under printing — AMS-purge, spyling ved materialbytter og støttemateriell — og hva det koster deg.

Gå til: **https://localhost:3443/#waste**

## Avfallskategorier

Bambu Dashboard skiller mellom tre typer avfall:

| Kategori | Kilde | Typisk andel |
|---|---|---|
| **AMS-purge** | Fargeskifte i AMS under multicolor-print | 5–30 g per bytte |
| **Materialbytte-spyling** | Rensing ved skifte mellom ulike materialer | 10–50 g per bytte |
| **Støttemateriell** | Støttestrukturer som fjernes etter print | Varierer |

## AMS-purge-tracking

AMS-purge-data hentes direkte fra MQTT-telemetri og G-kode-analyse:

- **Gram per fargeskifte** — beregnet fra G-kode-purge-blokk
- **Antall fargeskifter** — talt fra printlogg
- **Totalt purge-forbruk** — summen over valgt periode

:::tip Reduser purge
Bambu Studio har innstillinger for purge-volum per fargekombinasjon. Reduser purge-volumet for fargepar med lav fargeforskjell (f.eks. hvit → lysegrå) for å spare filament.
:::

## Effektivitetsberegning

Effektivitet beregnes som:

```
Effektivitet % = (modellmateriale / totalt forbruk) × 100

Totalt forbruk = modellmateriale + purge + støttemateriale
```

**Eksempel:**
- Modell: 45 g
- Purge: 12 g
- Støtte: 8 g
- Totalt: 65 g
- **Effektivitet: 69 %**

Effektiviteten vises som et trenddiagram over tid for å se om du forbedrer deg.

## Kostnad for avfall

Basert på registrerte filamentpriser beregnes:

| Post | Beregning |
|---|---|
| Purge-kostnad | Purge-gram × pris/gram per farge |
| Støtte-kostnad | Støtte-gram × pris/gram |
| **Total avfallskostnad** | Sum av over |
| **Kostnad per vellykket print** | Avfallskostnad / antall prints |

## Avfall per printer og materiale

Filtrer visningen etter:

- **Printer** — se hvilken printer som genererer mest avfall
- **Materiale** — se avfall per filamenttype
- **Periode** — dag, uke, måned, år

Tabellvisningen viser rangert liste med høyest avfall øverst, inkludert estimert kostnad.

## Optimaliseringstips

Systemet genererer automatiske forslag for å redusere avfall:

- **Flipped fargerekkefølge** — Hvis farge A→B purger mer enn B→A, foreslår systemet å bytte rekkefølgen
- **Slå sammen fargebytte-lag** — Grupperer lag med lik farge for å minimere bytter
- **Støttestruktur-optimalisering** — Estimerer støttereduksjon ved å endre orientering

:::info Nøyaktighet
Purge-beregninger er estimerte fra G-kode. Faktisk avfall kan variere 10–20 % pga. printeratferd.
:::

## Eksport og rapportering

1. Klikk **Eksporter avfallsdata**
2. Velg periode og format (CSV / PDF)
3. Avfallsdata kan inkluderes i prosjektrapporter og fakturaer som kostnadspost

Se også [Filamentanalyse](./filamentanalytics) for samlet forbruksoversikt.
