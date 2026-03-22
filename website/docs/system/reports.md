---
sidebar_position: 7
title: Rapporter
description: Automatiske ukentlige og månedlige e-postrapporter med statistikk, aktivitetssammendrag og vedlikeholdspåminnelser
---

# Rapporter

Bambu Dashboard kan sende automatiske e-postrapporter med statistikk og aktivitetssammendrag — ukentlig, månedlig eller begge deler.

Gå til: **https://localhost:3443/#settings** → **System → Rapporter**

## Forutsetninger

Rapporter krever at e-postvarsler er konfigurert. Sett opp SMTP under **Innstillinger → Varsler → E-post** før du aktiverer rapporter. Se [Varsler](../funksjoner/notifications).

## Aktivere automatiske rapporter

1. Gå til **Innstillinger → Rapporter**
2. Aktiver **Ukentlig rapport** og/eller **Månedlig rapport**
3. Velg **Sendingstidspunkt**:
   - Ukentlig: ukedag og klokkeslett
   - Månedlig: dag i måneden (f.eks. 1. måndag / siste fredag)
4. Fyll inn **Mottaker-e-post** (kommaseparert for flere)
5. Klikk **Lagre**

Send en testrapport for å se formateringen: klikk **Send testrapport nå**.

## Innhold i ukentlig rapport

Den ukentlige rapporten dekker siste 7 dager:

### Sammendrag
- Totalt antall prints
- Antall vellykkede / feilede / avbrutte
- Suksessrate og endring fra forrige uke
- Mest aktive printer

### Aktivitet
- Prints per dag (minigraf)
- Totale print-timer
- Totalt filamentforbruk (gram og kostnad)

### Filament
- Forbruk per materiale og leverandør
- Estimert gjenværende per spole (spoler under 20 % fremhevet)

### Vedlikehold
- Vedlikeholdsoppgaver utført denne uken
- Forfalne vedlikeholdsoppgaver (rød advarsel)
- Oppgaver som forfaller neste uke

### HMS-feil
- Antall HMS-feil denne uken per printer
- Ukvitterte feil (krever oppmerksomhet)

## Innhold i månedlig rapport

Den månedlige rapporten dekker siste 30 dager og inneholder alt fra ukesrapporten, pluss:

### Trend
- Sammenligning med forrige måned (%)
- Aktivitetskart (heatmap-miniatur for måneden)
- Månedlig suksessrateutvikling

### Kostnader
- Total filamentkostnad
- Total strømkostnad (hvis strømmåling er konfigurert)
- Total slitasjekostnad
- Samlet vedlikeholdskostnad

### Slitasje og helse
- Helsescore per printer (med endring fra forrige måned)
- Komponenter som nærmer seg utbytte-tidspunktet

### Statistikk-høydepunkter
- Lengste vellykkede print
- Mest brukte filamenttype
- Printer med høyest aktivitet

## Tilpasse rapporten

1. Gå til **Innstillinger → Rapporter → Tilpasning**
2. Huk av / fra seksjoner du vil inkludere
3. Velg **Printer-filter**: alle printere eller et utvalg
4. Velg **Logovisning**: vis Bambu Dashboard-logo i header eller slå av
5. Klikk **Lagre**

## Rapport-arkiv

Alle sendte rapporter lagres og kan åpnes på nytt:

1. Gå til **Innstillinger → Rapporter → Arkiv**
2. Velg rapport fra listen (sortert etter dato)
3. Klikk **Åpne** for å se HTML-versjonen
4. Klikk **Last ned PDF** for å laste ned rapporten

Rapporter slettes automatisk etter **90 dager** (konfigurerbart).
