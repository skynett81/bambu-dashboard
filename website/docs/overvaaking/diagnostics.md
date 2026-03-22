---
sidebar_position: 3
title: Diagnostikk
description: Helsescore, telemetri-grafer, bed mesh-visualisering og komponentovervåking for Bambu Lab-printere
---

# Diagnostikk

Diagnostikk-siden gir deg en dyptgående oversikt over printerens helse, ytelse og tilstand over tid.

Gå til: **https://localhost:3443/#diagnostics**

## Helsescore

Hvert printer beregner en **helsescore** fra 0–100 basert på:

| Faktor | Vekting | Beskrivelse |
|---|---|---|
| Suksessrate (30d) | 30 % | Andel vellykkede prints siste 30 dager |
| Komponentslitasje | 25 % | Gjennomsnittlig slitasje på kritiske deler |
| HMS-feil (30d) | 20 % | Antall og alvorlighetsgrad av feil |
| Kalibreringsstatus | 15 % | Tid siden siste kalibrering |
| Temperaturstabilitet | 10 % | Avvik fra måltemperatur under printing |

**Score-tolkning:**
- 🟢 80–100 — Utmerket tilstand
- 🟡 60–79 — God, men noe bør undersøkes
- 🟠 40–59 — Redusert ytelse, vedlikehold anbefales
- 🔴 0–39 — Kritisk, vedlikehold påkrevd

:::tip Historikk
Klikk på helsegrafen for å se scorens utvikling over tid. Store fall kan indikere en spesifikk hendelse.
:::

## Telemetri-grafer

Telemetri-siden viser interaktive grafer for alle sensorverdier:

### Tilgjengelige datasett

- **Dysetemperatur** — faktisk vs. mål
- **Sengtemperatur** — faktisk vs. mål
- **Kammertemperatur** — omgivelsestemperatur inne i maskinen
- **Extruder-motor** — strømforbruk og temperatur
- **Viftehastigheter** — verktøyhode, kammer, AMS
- **Trykk** (X1C) — chamberpressure for AMS
- **Akselerasjon** — vibrationsdata (ADXL345)

### Navigere i grafene

1. Velg **Tidsperiode**: Siste time / 24 timer / 7 dager / 30 dager / Egendefinert
2. Velg **Printer** fra nedtrekkslisten
3. Velg **Datasett** å vise (flervalg støttes)
4. Scroll for å zoome inn på tidslinjen
5. Klikk og dra for å panorere
6. Dobbeltklikk for å tilbakestille zoom

### Eksportere telemetridata

1. Klikk **Eksporter** på grafen
2. Velg format: **CSV**, **JSON** eller **PNG** (bilde)
3. Valgt tidsperiode og datasett eksporteres

## Bed Mesh

Bed mesh-visualiseringen viser flathetskalibreringen av byggplaten:

1. Gå til **Diagnostikk → Bed Mesh**
2. Velg printer
3. Siste mesh vises som en 3D-overflate og heatmap:
   - **Blå** — lavere enn senter (konkav)
   - **Grønn** — tilnærmet flatt
   - **Rød** — høyere enn senter (konveks)
4. Svev over et punkt for å se nøyaktig avvik i mm

### Skann bed mesh fra UI

1. Klikk **Skann nå** (krever at printeren er ledig)
2. Bekreft i dialogen — printeren starter automatisk kalibrering
3. Vent til skanningen er ferdig (ca. 3–5 minutter)
4. Den nye meshen vises automatisk

:::warning Varm opp først
Bed mesh bør skannes med oppvarmet seng (50–60°C for PLA) for nøyaktig kalibrering.
:::

## Komponentslitasje

Se [Slitasjepredikasjon](./wearprediction) for detaljert dokumentasjon.

Diagnostikk-siden viser en komprimert oversikt:
- Prosentscore per komponent
- Neste anbefalte vedlikehold
- Klikk **Detaljer** for full slitasjeanalyse
