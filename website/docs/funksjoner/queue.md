---
sidebar_position: 5
title: Utskriftskø
description: Planlegg og automatiser utskrifter med prioritert kø, automatisk dispatch og staggered start
---

# Utskriftskø

Utskriftskøen lar deg planlegge utskrifter på forhånd og sende dem automatisk til tilgjengelige printere når de er ledige.

Gå til: **https://localhost:3443/#queue**

## Opprette en kø

1. Gå til **Utskriftskø** i navigasjonsmenyen
2. Klikk **Ny jobb** (+ ikon)
3. Fyll inn:
   - **Filnavn** — last opp `.3mf` eller `.gcode`
   - **Målprinter** — velg spesifikk printer eller **Automatisk**
   - **Prioritet** — Lav / Normal / Høy / Kritisk
   - **Planlagt start** — nå eller en bestemt dato/klokkeslett
4. Klikk **Legg til i kø**

:::tip Dra og slipp
Du kan dra filer direkte fra filutforskeren til køsiden for å legge dem til raskt.
:::

## Legge til filer

### Last opp fil

1. Klikk **Last opp** eller dra en fil til opplastingsfeltet
2. Støttede formater: `.3mf`, `.gcode`, `.bgcode`
3. Filen lagres i filbiblioteket og kobles til køjobben

### Fra filbiblioteket

1. Gå til **Filbibliotek** og finn filen
2. Klikk **Legg til i kø** på filen
3. Jobben opprettes med standardinnstillinger — rediger om nødvendig

### Fra historikk

1. Åpne en tidligere print i **Historikk**
2. Klikk **Print igjen**
3. Jobben legges til med samme innstillinger som sist

## Prioritet

Køen behandles i prioritetsrekkefølge:

| Prioritet | Farge | Beskrivelse |
|---|---|---|
| Kritisk | Rød | Sendes til første ledige printer uavhengig av andre jobber |
| Høy | Oransje | Foran normale og lave jobber |
| Normal | Blå | Standardrekkefølge (FIFO) |
| Lav | Grå | Sendes kun når ingen høyere jobber venter |

Dra og slipp jobber i køen for å endre rekkefølgen manuelt innenfor samme prioritetsnivå.

## Automatisk dispatch

Når **Automatisk dispatch** er aktivert, overvåker Bambu Dashboard alle printere og sender neste jobb automatisk:

1. Gå til **Innstillinger → Kø**
2. Slå på **Automatisk dispatch**
3. Velg **Dispatch-strategi**:
   - **Første ledige** — sender til første printer som blir ledig
   - **Minst brukt** — prioriterer printeren med færrest prints i dag
   - **Rund-robin** — roter likt mellom alle printere

:::warning Bekreftelse
Aktivér **Krev bekreftelse** i innstillingene hvis du vil godkjenne hver dispatch manuelt før filen sendes.
:::

## Staggered start (forskjøvet oppstart)

Staggered start er nyttig for å unngå at alle printere starter og slutter samtidig:

1. I **Ny jobb**-dialogen, ekspander **Avanserte innstillinger**
2. Aktiver **Staggered start**
3. Sett **Forsinkelse mellom printere** (f.eks. 30 minutter)
4. Systemet fordeler starttidspunktene automatisk

**Eksempel:** 4 identiske jobber med 30 minutters forsinkelse starter kl. 08:00, 08:30, 09:00 og 09:30.

## Køstatus og oppfølging

Køoversikten viser alle jobber med status:

| Status | Beskrivelse |
|---|---|
| Venter | Jobben er i kø og venter på printer |
| Planlagt | Har planlagt starttidspunkt i fremtiden |
| Sender | Overføres til printer |
| Printer | Pågår på valgt printer |
| Fullført | Ferdig — kobles til historikk |
| Feilet | Feil ved sending eller under print |
| Avbrutt | Manuelt avbrutt |

:::info Varsler
Aktiver varsler for køhendelser under **Innstillinger → Varsler → Kø** for å få melding når en jobb starter, fullfører eller feiler. Se [Varsler](./notifications).
:::
