---
sidebar_position: 1
title: Welkom bij Bambu Dashboard
description: Een krachtig, zelf-gehost dashboard voor Bambu Lab 3D-printers
---

# Welkom bij Bambu Dashboard

**Bambu Dashboard** is een zelf-gehost, volledig uitgerust controlepaneel voor Bambu Lab 3D-printers. Het geeft je volledig inzicht en controle over je printer, filamentvoorraad, printgeschiedenis en meer — allemaal vanuit één browsertabblad.

## Wat is Bambu Dashboard?

Bambu Dashboard verbindt rechtstreeks met je printer via MQTT over LAN, zonder afhankelijkheid van de servers van Bambu Lab. Je kunt ook verbinding maken met Bambu Cloud voor synchronisatie van modellen en printgeschiedenis.

### Belangrijkste functies

- **Live dashboard** — realtime temperatuur, voortgang, camera, AMS-status
- **Filamentvoorraad** — volg alle spoelen, kleuren, AMS-synchronisatie, drogen
- **Printgeschiedenis** — volledig logboek met statistieken en export
- **Planner** — kalenderweergave en printwachtrij
- **Printerbesturing** — temperatuur, snelheid, ventilatoren, G-code console
- **Meldingen** — 7 kanalen (Telegram, Discord, e-mail, ntfy, Pushover, SMS, webhook)
- **Multi-printer** — ondersteunt de volledige Bambu Lab-serie: X1C, X1E, P1S, P1P, P2S, A1, A1 mini, A1 Combo, H2S, H2D, H2C en meer
- **Zelf-gehost** — geen cloudafhankelijkheid, jouw gegevens op jouw machine

## Snel starten

| Taak | Link |
|------|------|
| Dashboard installeren | [Installatie](./kom-i-gang/installasjon) |
| Eerste printer configureren | [Instellen](./kom-i-gang/oppsett) |
| Verbinding maken met Bambu Cloud | [Bambu Cloud](./kom-i-gang/bambu-cloud) |
| Alle functies verkennen | [Functies](./funksjoner/oversikt) |
| API-documentatie | [API](./avansert/api) |

:::tip Demomodus
Je kunt het dashboard uitproberen zonder een fysieke printer door `npm run demo` uit te voeren. Dit start 3 gesimuleerde printers met live printcycli.
:::

## Ondersteunde printers

- **X1-serie**: X1C, X1C Combo, X1E
- **P1-serie**: P1S, P1S Combo, P1P
- **P2-serie**: P2S, P2S Combo
- **A-serie**: A1, A1 Combo, A1 mini
- **H2-serie**: H2S, H2D (dubbele nozzle), H2C (toolwisselaar, 6 koppen)

## Technisch overzicht

Bambu Dashboard is gebouwd met Node.js 22 en vanilla HTML/CSS/JS — geen zware frameworks, geen bouwstap. De database is SQLite, ingebouwd in Node.js 22. Zie [Architectuur](./avansert/arkitektur) voor details.
