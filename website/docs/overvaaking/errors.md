---
sidebar_position: 2
title: Feillogg
description: Komplett oversikt over HMS-feilkoder fra printerne med alvorlighetsgrad, søk og lenker til Bambu Wiki
---

# Feillogg

Feilloggen samler alle feil og HMS-varsler (Health, Maintenance, Safety) fra printerne dine. Bambu Dashboard har en innebygd database med 268 HMS-koder for Bambu Lab-printere.

Gå til: **https://localhost:3443/#errors**

## HMS-koder

Bambu Lab-printere sender HMS-koder via MQTT når noe er galt. Bambu Dashboard oversetter disse automatisk til lesbare feilmeldinger:

| Kode | Eksempel | Kategori |
|---|---|---|
| `0700 0100 0001 0001` | Nozzle heatbreak clogged | Dyse/ekstruder |
| `0700 0200 0002 0001` | AMS filament stuck | AMS |
| `0700 0300 0003 0001` | Bed leveling failed | Byggplate |
| `0700 0500 0001 0001` | MC disconnect | Elektronikk |

Den komplette listen dekker alle 268 kjente koder for X1C, P1S, P1P, A1 og A1 Mini.

## Alvorlighetsgrad

Feil klassifiseres i fire nivåer:

| Nivå | Farge | Beskrivelse |
|---|---|---|
| **Kritisk** | Rød | Krever umiddelbar handling — print stoppet |
| **Høy** | Oransje | Bør behandles raskt — print kan fortsette |
| **Medium** | Gul | Bør undersøkes — ingen umiddelbar fare |
| **Info** | Blå | Informasjonsmelding, ingen handling nødvendig |

## Søk og filtrering

Bruk verktøylinjen øverst i feilloggen:

1. **Fritekst-søk** — søk i feilmelding, HMS-kode eller printerbeskrivelse
2. **Printer** — vis feil kun fra én printer
3. **Kategori** — AMS / Dyse / Plate / Elektronikk / Kalibrering / Annet
4. **Alvorlighetsgrad** — Alle / Kritisk / Høy / Medium / Info
5. **Dato** — filtrer på datoperiode
6. **Ukvitterte** — vis kun feil som ikke er kvittert

Klikk **Nullstill filter** for å se alle feil.

## Wiki-lenker

For hver HMS-kode vises en lenke til Bambu Lab Wiki med:

- Fullstendig feilbeskrivelse
- Mulige årsaker
- Steg-for-steg-feilsøkingsveiledning
- Offisielle Bambu Lab-anbefalinger

Klikk **Åpne wiki** på en feiloppføring for å åpne den relevante wiki-siden i en ny fane.

:::tip Lokal kopi
Bambu Dashboard cacher wiki-innholdet lokalt for offline-bruk. Innholdet oppdateres ukentlig automatisk.
:::

## Kvittere feil

Kvittering markerer en feil som behandlet uten å slette den:

1. Klikk på en feil i listen
2. Klikk **Kvitter** (hake-ikon)
3. Skriv inn en valgfri notat om hva som ble gjort
4. Feilen markeres med hake og flyttes til «Kvitterte»-listen

### Massekvittering

1. Velg flere feil med avkryssingsbokser
2. Klikk **Kvitter valgte**
3. Alle valgte feil kvitteres simultaneously

## Statistikk

Øverst i feilloggen vises:

- Totalt antall feil siste 30 dager
- Antall ukvitterte feil
- Hyppigst forekommende HMS-kode
- Printer med flest feil

## Eksport

1. Klikk **Eksporter** (nedlastingsikon)
2. Velg format: **CSV** eller **JSON**
3. Filteret brukes på eksporten — sett ønsket filter først
4. Filen lastes ned automatisk

## Varsler for nye feil

Aktiver varsler for nye HMS-feil:

1. Gå til **Innstillinger → Varsler**
2. Huk av **Nye HMS-feil**
3. Velg minimumsalvorlighetsgrad for varsling (anbefalt: **Høy** og over)
4. Velg varselkanal

Se [Varsler](../funksjoner/notifications) for kanaloppsett.
