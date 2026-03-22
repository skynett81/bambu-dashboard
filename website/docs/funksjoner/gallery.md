---
sidebar_position: 8
title: Galleri
description: Se milestone-screenshots tatt automatisk ved 25, 50, 75 og 100 % fremgang for alle prints
---

# Galleri

Galleriet samler automatiske screenshots tatt underveis i hver print. Bildene tas ved faste milepæler og gir deg en visuell logg over printens utvikling.

Gå til: **https://localhost:3443/#gallery**

## Milestone-screenshots

Bambu Dashboard tar automatisk et screenshot fra kameraet ved følgende milepæler:

| Milepæl | Tidspunkt |
|---|---|
| **25 %** | Et kvart gjennom printen |
| **50 %** | Halvveis |
| **75 %** | Tre kvart gjennom |
| **100 %** | Print fullført |

Screenshots lagres kobles til den aktuelle printhistorikk-oppføringen og vises i galleriet.

:::info Krav
Milestone-screenshots krever at kameraet er tilkoblet og aktivt. Deaktiverte kameraer genererer ingen bilder.
:::

## Aktivere screenshot-funksjonen

1. Gå til **Innstillinger → Galleri**
2. Slå på **Automatiske milestone-screenshots**
3. Velg hvilke milepæler du vil aktivere (alle fire er på som standard)
4. Velg **Bildekvalitet**: Lav (640×360) / Medium (1280×720) / Høy (1920×1080)
5. Klikk **Lagre**

## Bildevisning

Galleriet er organisert per print:

1. Bruk **filter** øverst for å velge printer, dato eller filnavn
2. Klikk på en print-rad for å ekspandere og se alle fire bilder
3. Klikk på et bilde for å åpne forhåndsvisning

### Forhåndsvisning

Forhåndsvisningen viser:
- Fullstørrelsesbilde
- Milepæl og tidsstempel
- Printnavn og printer
- **←** / **→** for å bla mellom bilder i samme print

## Fullskjermvisning

Klikk **Fullskjerm** (eller trykk `F`) i forhåndsvisningen for å fylle hele skjermen. Bruk piltastene for å bla mellom bilder.

## Last ned bilder

- **Enkeltbilde**: Klikk **Last ned** i forhåndsvisningen
- **Alle bilder for en print**: Klikk **Last ned alle** på print-raden — du får en `.zip`-fil
- **Velg flere**: Huk av avkryssingsboksene og klikk **Last ned valgte**

## Slett bilder

:::warning Lagringsplass
Galleribilder kan ta betydelig plass over tid. Sett opp automatisk sletting for gamle bilder.
:::

### Manuell sletting

1. Velg ett eller flere bilder (huk av)
2. Klikk **Slett valgte**
3. Bekreft i dialogen

### Automatisk rydding

1. Gå til **Innstillinger → Galleri → Automatisk rydding**
2. Aktiver **Slett bilder eldre enn**
3. Sett antall dager (f.eks. 90 dager)
4. Rydding kjøres automatisk hver natt kl. 03:00

## Kobling til printhistorikk

Hvert bilde er knyttet til en print-oppføring i historikken:

- Klikk **Se i historikk** på en print i galleriet for å hoppe til historikk-oppføringen
- I historikken vises et thumbnail av 100 %-bildet hvis det finnes

## Deling

Del et galleri-bilde via tidsbegrenset lenke:

1. Åpne bildet i forhåndsvisning
2. Klikk **Del**
3. Velg utløpstid og kopier lenken
