---
sidebar_position: 3
title: Daglig bruk
description: En praktisk guide til daglig bruk av Bambu Dashboard — morgenrutine, overvåking, etter print og vedlikehold
---

# Daglig bruk

Denne guiden dekker hvordan du bruker Bambu Dashboard effektivt i hverdagen — fra du starter dagen til du slår av lyset.

## Morgenrutine

Åpne dashboardet og ta en rask gjennomgang av disse punktene:

### 1. Sjekk printer-status
Oversiktspanelet viser statusen til alle printerene dine. Se etter:
- **Røde ikoner** — feil som krever oppmerksomhet
- **Ventilerende meldinger** — HMS-advarsler fra natten
- **Uavsluttede prints** — hvis du hadde nattprint, er den ferdig?

### 2. Sjekk AMS-nivåer
Gå til **Filament** eller se AMS-widgeten på dashboardet:
- Er noen spoler under 100 g? Bytt ut eller bestill ny
- Riktig filament i riktig spor for dagens prints?

### 3. Sjekk varsler og hendelser
Under **Varslingslogg** (klokke-ikonet) ser du:
- Hendelser som skjedde natten
- Feil som ble logget automatisk
- HMS-koder som utløste alarm

## Starte en print

### Fra fil (Bambu Studio)
1. Åpne Bambu Studio
2. Last inn og skiver modellen
3. Send til printer — dashboardet oppdateres automatisk

### Fra køen
Hvis du har planlagt prints på forhånd:
1. Gå til **Kø**
2. Klikk **Start neste** eller dra en jobb til toppen
3. Bekreft med **Send til printer**

Se [Utskriftskø-dokumentasjon](../funksjoner/queue) for full informasjon om køhåndtering.

### Planlagt print (scheduler)
For å starte en print på et bestemt tidspunkt:
1. Gå til **Planlegger**
2. Klikk **+ Ny jobb**
3. Velg fil, printer og tidspunkt
4. Aktiver **Strømpris-optimalisering** for å automatisk velge billigste time

Se [Planlegger](../funksjoner/scheduler) for detaljer.

## Overvåke en aktiv print

### Kameravisning
Klikk kameraikonet på printerkortet. Du kan:
- Se live-feed i dashboardet
- Åpne i separat fane for bakgrunnsovervåking
- Ta et manuelt skjermbilde

### Fremdriftsinformasjon
Det aktive print-kortet viser:
- Prosent ferdig
- Estimert tid igjen
- Nåværende lag / totalt antall lag
- Aktivt filament og farge

### Temperaturer
Sanntids temperaturkurver vises i detaljpanelet:
- Dysetemperatur — bør holde seg stabil innen ±2°C
- Platetemperatur — viktig for god heft
- Kammertemperatur — stiger gradvis, særlig relevant for ABS/ASA

### Print Guard
Er **Print Guard** aktivert, overvåker dashboardet automatisk for spaghetti og volumetriske avvik. Hvis noe oppdages:
1. Printen settes på pause
2. Du mottar et varsel
3. Kamerabildene lagres for etterkontroll

## Etter print — sjekkrutine

### Sjekk kvalitet
1. Åpne kamera og ta en titt på resultatet mens det fortsatt er på platen
2. Gå til **Historikk → Siste print** for å se statistikk
3. Logg et notat: hva gikk bra, hva kan forbedres

### Arkiver
Prints i historikken arkiveres aldri automatisk — de blir liggende. Vil du rydde opp:
- Klikk på en print → **Arkiver** for å flytte den til arkivet
- Bruk **Prosjekter** for å gruppere relaterte prints

### Oppdater filamentvekt
Hvis du veier spolen for nøyaktighet (anbefalt):
1. Vei spolen
2. Gå til **Filament → [Spolen]**
3. Oppdater **Gjenstående vekt**

## Vedlikeholdspåminnelser

Dashboardet sporer vedlikeholdsintervaller automatisk. Under **Vedlikehold** ser du:

| Oppgave | Intervall | Status |
|---------|-----------|--------|
| Rense dyse | Hver 50 timer | Sjekkes automatisk |
| Smøre stenger | Hver 200 timer | Spores i dashboardet |
| Kalibrere plate | Etter platebytte | Manuell påminnelse |
| Rense AMS | Månedlig | Kalender-varsling |

Aktiver vedlikeholdsvarsler under **Overvåking → Vedlikehold → Varsler**.

:::tip Sett opp ukentlig vedlikeholdsdag
En fast vedlikeholdsdag i uka (f.eks. søndag kveld) sparer deg for unødvendige driftstopp. Bruk påminnelsesfunksjonen i dashboardet.
:::

## Strømpris — beste tid å printe

Hvis du har koblet til strømprisintegrasjonen (Nordpool / Home Assistant):

1. Gå til **Analyse → Strømpris**
2. Se prisgraf for neste 24 timer
3. Billigste timer er markert med grønt

Bruk **Planlegger** med **Strømprisoptimalisering** aktivert — da starter dashboardet automatisk jobben i billigste tilgjengelige vindu.

:::info Typisk billigste tider
Natt (kl. 01:00–06:00) er som regel billigst i Norge. En 8-timers print sendt til kø kvelden før kan spare deg 30–50 % på strømkostnaden.
:::
