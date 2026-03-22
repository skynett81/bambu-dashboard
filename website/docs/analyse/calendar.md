---
sidebar_position: 2
title: Aktivitetskalender
description: GitHub-stil heatmap-kalender som viser printeraktivitet per dag gjennom året med årsvelger og detaljvisning
---

# Aktivitetskalender

Aktivitetskalenderen viser en visuell oversikt over printeraktiviteten din gjennom hele året — inspirert av GitHub sin bidragsoversikt.

Gå til: **https://localhost:3443/#calendar**

## Heatmap-oversikt

Kaleneren viser 365 dager (52 uker) som et rutenett av fargede ruter:

- **Grå** — ingen prints denne dagen
- **Lysegrønn** — 1–2 prints
- **Grønn** — 3–5 prints
- **Mørkegrønn** — 6–10 prints
- **Dyp grønn** — 11+ prints

Rutene er organisert med ukedager vertikalt (Man–Søn) og uker horisontalt fra venstre (januar) til høyre (desember).

:::tip Fargekoding
Du kan bytte heatmap-metrikken fra **Antall prints** til **Timer** eller **Gram filament** via velgeren over kaleneren.
:::

## Årsvelger

Klikk **< År >** for å navigere mellom år:

- Alle år med registrert printaktivitet er tilgjengelige
- Det nåværende året vises som standard
- Fremtiden er grå (ingen data)

## Detaljvisning per dag

Klikk på en rute for å se detaljer for den aktuelle dagen:

- **Dato** og ukedag
- **Antall prints** — vellykkede og feilede
- **Totalt filament brukt** (gram)
- **Totale print-timer**
- **Liste over prints** — klikk for å åpne i historikken

## Månedsoversikt

Under heatmapen vises en månedsoversikt med:
- Total prints per måned som stolpediagram
- Beste dag i måneden uthevet
- Sammenligning med samme måned fjoråret (%)

## Printer-filter

Velg printer fra nedtrekkslisten øverst for å vise aktivitet kun for én printer, eller velg **Alle** for aggregert visning.

Flerprinter-visning viser fargene stablet ved å klikke **Stablet** i visningsvelgeren.

## Streaks og rekorder

Under kaleneren vises:

| Statistikk | Beskrivelse |
|---|---|
| **Lengste streak** | Flest påfølgende dager med minst én print |
| **Nåværende streak** | Pågående rekke av aktive dager |
| **Mest aktive dag** | Dagen med flest prints totalt |
| **Mest aktive uke** | Uken med flest prints |
| **Mest aktive måned** | Måneden med flest prints |

## Eksport

Klikk **Eksporter** for å laste ned kalenderdata:

- **PNG** — bilde av heatmapen (for deling)
- **CSV** — rådata med én rad per dag (dato, antall, gram, timer)

PNG-eksporten er optimalisert for deling på sosiale medier med printernavnet og året som undertittel.
