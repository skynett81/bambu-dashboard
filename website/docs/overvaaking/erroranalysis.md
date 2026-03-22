---
sidebar_position: 6
title: Feilmønsteranalyse
description: AI-basert analyse av feilmønstre, korrelasjoner mellom feil og miljøfaktorer, og konkrete forbedringsforslag
---

# Feilmønsteranalyse

Feilmønsteranalysen bruker historiske data fra prints og feil for å identifisere mønstre, årsaker og korrelasjoner — og gir deg konkrete forslag til forbedringer.

Gå til: **https://localhost:3443/#error-analysis**

## Hva analyseres

Systemet analyserer følgende datapunkter:

- HMS-feilkoder og tidspunkter
- Filamenttype og leverandør ved feil
- Temperatur ved feil (dyse, seng, kammer)
- Print-hastighet og -profil
- Tid på døgnet og dag i uken
- Tids siden siste vedlikehold
- Printermodell og firmware-versjon

## Korrelasjonsanalyse

Systemet leter etter statistiske korrelasjoner mellom feil og faktorer:

**Eksempler på korrelasjoner som oppdages:**
- «78 % av AMS-blokkeringsfeil oppstår med filament fra leverandør X»
- «Dyse-verstoppelse skjer 3× hyppigere etter 6+ timer kontinuerlig printing»
- «Heft-feil øker ved kammertemperatur under 18°C»
- «Stringing-feil korrelerer med luftfuktighet over 60 % (hvis hygrometer tilkoblet)»

Korrelasjoner med statistisk signifikans (p < 0.05) vises øverst.

:::info Datakrav
Analysen er mest nøyaktig med minimum 50 prints i historikken. Med færre prints vises estimater med lav konfidens.
:::

## Forbedringsforslag

Basert på analysene genereres konkrete forslag:

| Forslagstype | Eksempel |
|---|---|
| Filament | «Bytt til en annen leverandør for PA-CF — 3 av 4 feil brukte LeverandørX» |
| Temperatur | «Øk sengtemperatur med 5°C for PETG — heft-feil reduseres estimert 60 %» |
| Hastighet | «Reduser hastighet til 80 % etter 4 timer — dyseblokkeringer reduseres estimert 45 %» |
| Vedlikehold | «Rengjør extruder-tannhjul — slitasje korrelerer med 40 % av ekstruderingsfeil» |
| Kalibrering | «Kjør bed leveling — 12 av 15 heft-feil siste uke korrelerer med feil kalibrering» |

Hvert forslag viser:
- Estimert effekt (%-reduksjon i feil)
- Konfidens (lav / medium / høy)
- Steg-for-steg-implementering
- Lenke til relevant dokumentasjon

## Helsescore-påvirkning

Analysen kobles til helsescoren (se [Diagnostikk](./diagnostics)):

- Viser hvilke faktorer som trekker ned scoren mest
- Estimerer score-forbedring ved å implementere hvert forslag
- Prioriterer forslag etter potensiell score-forbedring

## Tidslinjevisning

Gå til **Feilanalyse → Tidslinje** for å se en kronologisk oversikt:

1. Velg printer og tidsperiode
2. Feil vises som punkter på tidslinjen, fargekodet etter type
3. Horisontale linjer markerer vedlikeholdsoppgaver
4. Klynger av feil (mange feil på kort tid) er uthevet i rødt

Klikk på en klynge for å åpne analyse av den spesifikke perioden.

## Rapporter

Generer en PDF-rapport over feilanalysen:

1. Klikk **Generer rapport**
2. Velg tidsperiode (f.eks. siste 90 dager)
3. Velg innhold: korrelasjoner, forslag, tidslinje, helsescore
4. Last ned PDF eller send til e-post

Rapportene lagres under prosjekter hvis printer er koblet til et prosjekt.

:::tip Ukentlig gjennomgang
Sett opp automatisk ukentlig e-postrapport under **Innstillinger → Rapporter** for å holde deg oppdatert uten å besøke dashboardet manuelt. Se [Rapporter](../system/reports).
:::
