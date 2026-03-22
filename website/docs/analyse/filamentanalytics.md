---
sidebar_position: 3
title: Filamentanalyse
description: Detaljert analyse av filamentforbruk, kostnader, prognoser, forbruksrater og avfall per materiale og leverandør
---

# Filamentanalyse

Filamentanalysen gir deg full innsikt i filamentforbruket ditt — hva du bruker, hva det koster, og hva du kan spare.

Gå til: **https://localhost:3443/#filament-analytics**

## Forbruksoversikt

Øverst vises en oppsummering for valgt periode:

- **Totalt forbruk** — gram og meter for alle materialer
- **Estimert kostnad** — basert på registrert pris per spole
- **Mest brukte material** — type og leverandør
- **Gjenbruksrate** — andel filament i faktisk modell vs. støtte/purge

### Forbruk per materiale

Kakediagram og tabell viser fordeling mellom materialer:

| Kolonne | Beskrivelse |
|---|---|
| Materiale | PLA, PETG, ABS, PA, osv. |
| Leverandør | Bambu Lab, PolyMaker, Prusament, osv. |
| Gram brukt | Total vekt |
| Meter | Estimert lengde |
| Kostnad | Gram × pris per gram |
| Prints | Antall prints med dette materialet |

Klikk på en rad for å bore ned i enkeltspole-nivå.

## Forbruksrater

Forbruksraten viser gjennomsnittlig filamentforbruk per tidsenhet:

- **Gram per time** — under aktiv printing
- **Gram per uke** — inkludert printer-nedetid
- **Gram per print** — gjennomsnitt per utskrift

Disse brukes til å beregne prognoser for fremtidig behov.

:::tip Innkjøpsplanlegging
Bruk forbruksraten til å planlegge spolelager. Systemet varsler automatisk når estimert beholdning vil gå tom innen 14 dager (konfigurerbart).
:::

## Kostnadsprognose

Basert på historisk forbruksrate beregnes:

- **Estimert forbruk neste 30 dager** (gram per materiale)
- **Estimert kostnad neste 30 dager**
- **Anbefalt lagerbeholdning** (nok til 30 / 60 / 90 dagers drift)

Prognosen tar høyde for sesongvariasjon hvis du har data fra minst ett år.

## Avfall og effektivitet

Se [Avfallssporing](./waste) for full dokumentasjon. Filamentanalysen viser et sammendrag:

- **AMS-purge** — gram og andel av totalt forbruk
- **Støttemateriell** — gram og andel
- **Faktisk modellmateriale** — resterende andel (effektivitet %)
- **Estimert kostnad for avfall** — hva avfallet koster deg

## Spole-logg

Alle spoler (aktive og tomme) er loggført:

| Felt | Beskrivelse |
|---|---|
| Spolenavn | Materialnavn og farge |
| Opprinnelig vekt | Registrert vekt ved oppstart |
| Gjenværende vekt | Beregnet gjenværende |
| Brukt | Gram brukt totalt |
| Sist brukt | Dato for siste print |
| Status | Aktiv / Tom / Lagret |

## Prisregistrering

For nøyaktig kostnadsanalyse, registrer priser per spole:

1. Gå til **Filamentlager**
2. Klikk på en spole → **Rediger**
3. Fyll inn **Kjøpspris** og **Vekt ved kjøp**
4. Systemet beregner pris per gram automatisk

Spoler uten registrert pris bruker **standard pris per gram** (settes i **Innstillinger → Filament → Standardpris**).

## Eksport

1. Klikk **Eksporter filamentdata**
2. Velg periode og format (CSV / PDF)
3. CSV inkluderer en rad per print med gram, kostnad og materiale
