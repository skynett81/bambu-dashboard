---
sidebar_position: 1
title: Velkommen til Bambu Dashboard
description: En kraftig, selvdriftet dashboard for Bambu Lab 3D-printere
---

# Velkommen til Bambu Dashboard

**Bambu Dashboard** er et selvdriftet, fullverdig kontrollpanel for Bambu Lab 3D-printere. Det gir deg full oversikt og kontroll over printer, filamentlager, printhistorikk og mer — alt fra én nettleser-fane.

## Hva er Bambu Dashboard?

Bambu Dashboard kobler seg direkte til printeren din via MQTT over LAN, uten avhengighet av Bambu Lab sine servere. Du kan også koble til Bambu Cloud for synkronisering av modeller og printhistorikk.

### Viktigste funksjoner

- **Live dashboard** — sanntids temperatur, fremgang, kamera, AMS-status
- **Filamentlager** — spor alle spoler, farger, AMS-synk, tørking
- **Printhistorikk** — komplett logg med statistikk og eksport
- **Planlegger** — kalendervisning og print-kø
- **Printerkontroll** — temperatur, hastighet, vifter, G-code konsoll
- **Varsler** — 7 kanaler (Telegram, Discord, e-post, ntfy, Pushover, SMS, webhook)
- **Multi-printer** — støtter hele Bambu Lab-serien: X1C, X1E, P1S, P1P, P2S, A1, A1 mini, A1 Combo, H2S, H2D, H2C og mer
- **Selvdriftet** — ingen sky-avhengighet, dine data på din maskin

## Hurtigstart

| Oppgave | Lenke |
|---------|-------|
| Installer dashboardet | [Installasjon](./kom-i-gang/installasjon) |
| Konfigurer første printer | [Oppsett](./kom-i-gang/oppsett) |
| Koble til Bambu Cloud | [Bambu Cloud](./kom-i-gang/bambu-cloud) |
| Utforsk alle funksjoner | [Funksjoner](./funksjoner/oversikt) |
| API-dokumentasjon | [API](./avansert/api) |

:::tip Demo-modus
Du kan prøve dashboardet uten en fysisk printer ved å kjøre `npm run demo`. Dette starter 3 simulerte printere med live print-sykluser.
:::

## Støttede printere

- **X1-serien**: X1C, X1C Combo, X1E
- **P1-serien**: P1S, P1S Combo, P1P
- **P2-serien**: P2S, P2S Combo
- **A-serien**: A1, A1 Combo, A1 mini
- **H2-serien**: H2S, H2D (dobbel dyse), H2C (verktøybytter, 6 hoder)

## Teknisk oversikt

Bambu Dashboard er bygget med Node.js 22 og vanilla HTML/CSS/JS — ingen tunge rammeverk, ingen build-steg. Databasen er SQLite, innebygd i Node.js 22. Se [Arkitektur](./avansert/arkitektur) for detaljer.
