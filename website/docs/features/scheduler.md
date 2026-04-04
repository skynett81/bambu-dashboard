---
sidebar_position: 4
title: Planlegger
description: Planlegg prints, administrer print-kø og sett opp automatisk dispatch
---

# Planlegger

Planleggeren lar deg organisere og automatisere printjobber med kalendervisning og en intelligent print-kø.

## Kalendervisning

Kalendervisningen gir en oversikt over alle planlagte og gjennomførte prints:

- **Måneds-, uke- og dagvisning** — velg detaljeringsnivå
- **Fargekoding** — ulike farger per printer og status
- **Klikk en hendelse** — se detaljer om printen

Fullførte prints vises automatisk basert på printhistorikken.

## Print-kø

Print-køen lar deg stille opp jobber som sendes til printeren i rekkefølge:

### Legge til jobb i køen

1. Klikk **+ Legg til jobb**
2. Velg fil (fra printer SD, lokal opplasting, eller FTP)
3. Angi prioritet (høy, normal, lav)
4. Velg målprinter (eller "automatisk")
5. Klikk **Legg til**

### Køstyring

| Handling | Beskrivelse |
|----------|-------------|
| Dra og slipp | Omorganiser rekkefølgen |
| Pause kø | Stopp utsendelse midlertidig |
| Hopp over | Send neste jobb uten å vente |
| Slett | Fjern jobb fra køen |

:::tip Multi-printer dispatch
Med flere printere kan køen automatisk fordele jobs til ledige printere. Aktiver **Automatisk dispatch** under **Planlegger → Innstillinger**.
:::

## Planlagte prints

Sett opp prints som skal starte på et bestemt tidspunkt:

1. Klikk **+ Planlegg print**
2. Velg fil og printer
3. Angi starttidspunkt
4. Konfigurer varsling (valgfritt)
5. Lagre
- **3D-forhåndsvisning** — se 3D-modellen direkte fra planlagte prints

:::warning Printer må være ledig
Planlagte prints starter bare dersom printeren er i stand-by-modus på angitt tidspunkt. Hvis printeren er opptatt, forskyves starten til neste tilgjengelige tidspunkt (konfigurerbart).
:::

## Last balansering

Med automatisk last balansering fordeles jobber intelligent mellom printere:

- **Round-robin** — jevn fordeling mellom alle printere
- **Minst opptatt** — send til printeren med kortest estimert ferdig-tid
- **Manuell** — du velger printer selv for hver jobb

Konfigurer under **Planlegger → Last balansering**.

## Varsler

Planleggeren integrerer med varslingskanaler:

- Varsel når jobb starter
- Varsel når jobb er ferdig
- Varsel ved feil eller forsinkelse

Se [Funksjoner oversikt](./overview#varsler) for å konfigurere varslingskanaler.
