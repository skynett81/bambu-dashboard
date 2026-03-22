---
sidebar_position: 2
title: Strømpris
description: Koble til Tibber eller Nordpool for live timespriser, prishistorikk og prisvarsler
---

# Strømpris

Strømpris-integrasjonen henter live strømpriser fra Tibber eller Nordpool for å gi nøyaktige strømkostnadsberegninger per print og varsler om gode eller dårlige pristider for printing.

Gå til: **https://localhost:3443/#settings** → **Integrasjoner → Strømpris**

## Tibber-integrasjon

Tibber er en norsk strømleverandør med åpent API for spotpriser.

### Oppsett

1. Logg inn på [developer.tibber.com](https://developer.tibber.com)
2. Generer en **Personal Access Token**
3. I Bambu Dashboard: lim inn token under **Tibber API Token**
4. Velg **Hjem** (der prisene skal hentes fra, hvis du har flere hjem)
5. Klikk **Test tilkobling**
6. Klikk **Lagre**

### Tilgjengelig data fra Tibber

- **Spotpris nå** — øyeblikkelig pris inkl. avgifter (kr/kWh)
- **Priser neste 24 timer** — Tibber leverer morgendagens priser fra ca. kl. 13:00
- **Prishistorikk** — opp til 30 dager bakover
- **Kostnad per print** — beregnet ut fra faktisk printtid × timespriser

## Nordpool-integrasjon

Nordpool er energibørsen som leverer råspotpriser for Norden.

### Oppsett

1. Gå til **Integrasjoner → Nordpool**
2. Velg **Prisområde**: NO1 (Oslo) / NO2 (Kristiansand) / NO3 (Trondheim) / NO4 (Tromsø) / NO5 (Bergen)
3. Velg **Valuta**: NOK / EUR
4. Velg **Skatt og avgifter**:
   - Huk av **Inkluder mva** (25 %)
   - Fyll inn **Nettleie** (kr/kWh) — se faktura fra nettselskapet
   - Fyll inn **Forbruksavgift** (Elavgift, kr/kWh)
5. Klikk **Lagre**

:::info Nettleie
Nettleien varierer etter nettselskap og prismodell. Sjekk din siste strøm-faktura for riktig sats.
:::

## Timespriser

Timespriser vises som et stolpediagram for de neste 24–48 timene:

- **Grønn** — billige timer (under gjennomsnitt)
- **Gul** — gjennomsnittspris
- **Rød** — dyre timer (over gjennomsnitt)
- **Grå** — timer uten tilgjengelig prisfremskrivning

Hover over en time for å se eksakt pris (kr/kWh).

## Prishistorikk

Gå til **Strømpris → Historikk** for å se:

- Daglig gjennomsnittspris siste 30 dager
- Dyreste og billigste time per dag
- Total strømkostnad for prints per dag

## Prisvarsler

Sett opp automatiske varsler basert på strømpris:

1. Gå til **Strømpris → Prisvarsler**
2. Klikk **Nytt varsel**
3. Velg varseltype:
   - **Pris under grense** — varsle når strømpris faller under X kr/kWh
   - **Pris over grense** — varsle når pris stiger over X kr/kWh
   - **Billigste time i dag** — varsle når dagens billigste time starter
4. Velg varselkanal
5. Klikk **Lagre**

:::tip Smart planlegging
Kombiner prisvarsler med utskriftskøen: sett opp en automatisering som sender køjobber automatisk når strømprisen er lav (krever webhook-integrasjon eller Home Assistant).
:::

## Strømpris i kostnadsberegneren

Aktivert strømprisintegrasjon gir nøyaktige strømkostnader i [Kostnadsberegneren](../analyse/costestimator). Velg **Live pris** i stedet for fast pris for å bruke aktuell Tibber/Nordpool-pris.
