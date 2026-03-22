---
sidebar_position: 2
title: Hovedpanel
description: Sanntidsoversikt over aktiv printer med 3D-modellvisning, AMS-status, kamera og tilpassbare widgets
---

# Hovedpanel

Hovedpanelet er det sentrale kontrollsenteret i Bambu Dashboard. Det viser sanntidsstatus for den valgte printeren og lar deg overvåke, styre og tilpasse visningen etter behov.

Gå til: **https://localhost:3443/**

## Sanntidsoversikt

Når en printer er aktiv, oppdateres alle verdier kontinuerlig via MQTT:

- **Dysetemperatur** — animert SVG-ringmåler med måltemperatur
- **Sengtemperatur** — tilsvarende ringmåler for byggplaten
- **Fremgangsprosent** — stor prosentindikator med gjenværende tid
- **Lag-teller** — aktuelt lag / totalt antall lag
- **Hastighet** — Stille / Standard / Sport / Turbo med skyveknapp

:::tip Sanntidsoppdatering
Alle verdier oppdateres direkte fra printeren via MQTT uten å laste siden på nytt. Forsinkelsen er typisk under 1 sekund.
:::

## 3D-modellvisning

Hvis printeren sender en `.3mf`-fil med modellen, vises en interaktiv 3D-forhåndsvisning:

1. Modellen lastes automatisk når en print starter
2. Roter modellen ved å dra med musen
3. Scroll for å zoome inn/ut
4. Klikk **Tilbakestill** for å gå tilbake til standardvisning

:::info Støtte
3D-visning krever at printeren sender modelldata. Ikke alle printjobber inkluderer dette.
:::

## AMS-status

AMS-panelet viser alle monterte AMS-enheter med sporer og filament:

- **Sporefarge** — visuell fargerepresentasjon fra Bambu-metadata
- **Filamentnavn** — materiale og merkevare
- **Aktivt spor** — markert med puls-animasjon under printing
- **Feil** — rød indikator ved AMS-feil (blokkering, tom, fuktig)

Klikk på et spor for å se full filamentinfo og koble det til filamentlageret.

## Kamera-feed

Live kameravisning konverteres via ffmpeg (RTSPS → MPEG1):

1. Kameraet starter automatisk når du åpner dashboardet
2. Klikk på kamerabildet for å åpne fullskjerm
3. Bruk **Snapshot**-knappen for å ta et stillbilde
4. Klikk **Skjul kamera** for å frigjøre plass

:::warning Ytelse
Kamerastrøm bruker ca. 2–5 Mbit/s. Deaktiver kameraet på trege nettverkstilkoblinger.
:::

## Temperatur-sparklines

Under AMS-panelet vises mini-grafer (sparklines) for siste 30 minutter:

- Dysetemperatur over tid
- Sengtemperatur over tid
- Kammertemperatur (der tilgjengelig)

Klikk på en sparkline for å åpne fullstendig telemetri-grafvisning.

## Widget-tilpasning

Dashboardet bruker et dra-og-slipp-rutenett (grid layout):

1. Klikk **Tilpass layout** (blyant-ikon øverst til høyre)
2. Dra widgets til ønsket posisjon
3. Endre størrelse ved å dra i hjørnet
4. Klikk **Lås layout** for å fryse plasseringen
5. Klikk **Lagre** for å bevare oppsettet

Tilgjengelige widgets:
| Widget | Beskrivelse |
|---|---|
| Kamera | Live kameravisning |
| AMS | Spol- og filamentstatus |
| Temperatur | Ringmålere for dyse og seng |
| Fremgang | Prosentindikator og tidestimering |
| Telemetri | Fans, trykk, hastighet |
| 3D-modell | Interaktiv modellvisning |
| Sparklines | Mini-temperaturgrafer |

:::tip Lagring
Layouten lagres per bruker i nettleseren (localStorage). Ulike brukere kan ha ulike oppsett.
:::
