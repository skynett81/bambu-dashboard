---
sidebar_position: 6
title: Printsammenligning
description: Sammenlign to prints side ved side med detaljerte metrikker, grafer og galleribilder for A/B-analyse
---

# Printsammenligning

Printsammenlikningen lar deg analysere to prints side ved side — nyttig for å sammenligne innstillinger, materialer, printere eller versjoner av samme modell.

Gå til: **https://localhost:3443/#comparison**

## Velge prints å sammenligne

1. Gå til **Printsammenligning**
2. Klikk **Velg print A** og søk i historikken
3. Klikk **Velg print B** og søk i historikken
4. Klikk **Sammenlign** for å laste sammenligningsvisningen

:::tip Raskere tilgang
Fra **Historikk** kan du høyreklikke på en print og velge **Angi som print A** eller **Sammenlign med...** for å hoppe direkte til sammenlikningsmodus.
:::

## Metrikk-sammenligning

Metrikkene vises i to kolonner (A og B) med markering av hvilken som er best:

| Metrikk | Beskrivelse |
|---|---|
| Suksess | Fullført / Avbrutt / Feilet |
| Varighet | Total printtid |
| Filamentforbruk | Gram totalt og per farge |
| Filamenteffektivitet | Modell-% av totalt forbruk |
| Maks dysetemperatur | Høyeste registrerte dysetemperatur |
| Maks sengtemperatur | Høyeste registrerte sengtemperatur |
| Hastighetsinnstilling | Stille / Standard / Sport / Turbo |
| AMS-bytter | Antall fargeskifter |
| HMS-feil | Eventuelle feil under print |
| Printer | Hvilken printer som ble brukt |

Celler med den beste verdien vises med grønn bakgrunn.

## Temperaturgrafer

To temperaturgrafer vises side ved side (eller overlagret):

- **Separat visning** — graf A til venstre, graf B til høyre
- **Overlappet visning** — begge i samme graf med ulike farger

Bruk overlappet visning for å se temperaturstabilitet og oppvarmingshastighet direkte.

## Galleribilder

Hvis begge prints har milestone-screenshots, vises de i et grid:

| Print A | Print B |
|---|---|
| 25%-bilde A | 25%-bilde B |
| 50%-bilde A | 50%-bilde B |
| 75%-bilde A | 75%-bilde B |
| 100%-bilde A | 100%-bilde B |

Klikk på et bilde for å åpne fullskjermforhåndsvisning med slide-animasjon.

## Timelapse-sammenligning

Hvis begge prints har timelapse, vises videoene side ved side:

- Synkronisert avspilling — begge starter og pauser samtidig
- Uavhengig avspilling — kontroller hver video separat

## Innstillingsforskjeller

Systemet fremhever automatisk forskjeller i printinnstillinger (hentet fra G-kode-metadata):

- Ulike lagtykkelser
- Ulike infill-mønstre eller -prosent
- Ulike støtteinnstillinger
- Ulike hastighetsprofiler

Forskjeller vises med oransje markering i innstillingstabellen.

## Lagre sammenligning

1. Klikk **Lagre sammenligning**
2. Gi sammenligningen et navn (f.eks. «PLA vs PETG - Benchy»)
3. Sammenligningen lagres og er tilgjengelig via **Historikk → Sammenligninger**

## Eksport

1. Klikk **Eksporter**
2. Velg **PDF** for en rapport med alle metrikker og bilder
3. Rapporten kan kobles til et prosjekt for dokumentasjon av materialvalg
