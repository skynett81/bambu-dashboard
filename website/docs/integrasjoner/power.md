---
sidebar_position: 3
title: Strømmåling
description: Mål faktisk strømforbruk per print med Shelly eller Tasmota smartplugg og koble til kostnadsoversikten
---

# Strømmåling

Koble en smartplugg med energimåling til printeren for å logge faktisk strømforbruk per print — ikke bare estimater.

Gå til: **https://localhost:3443/#settings** → **Integrasjoner → Strømmåling**

## Støttede enheter

| Enhet | Protokoll | Anbefaling |
|---|---|---|
| **Shelly Plug S / Plus Plug S** | HTTP REST / MQTT | Anbefalt — enkel oppsett |
| **Shelly 1PM / 2PM** | HTTP REST / MQTT | For fastmontert installasjon |
| **Tasmota-enheter** | MQTT | Fleksibelt for egenbygde oppsett |
| **TP-Link Kasa (EP25)** | HTTP REST | Fungerer, men begrenset støtte |

:::tip Anbefalt enhet
Shelly Plug S Plus med fastvare 1.0+ er testet og anbefalt. Støtter Wi-Fi, MQTT og HTTP REST uten sky-avhengighet.
:::

## Oppsett med Shelly

### Forutsetninger

- Shelly-pluggen er tilkoblet samme nettverk som Bambu Dashboard
- Shellyen er konfigurert med statisk IP eller DHCP-reservasjon

### Konfigurasjon

1. Gå til **Innstillinger → Strømmåling**
2. Klikk **Legg til strømmåler**
3. Velg **Type**: Shelly
4. Fyll inn:
   - **IP-adresse**: f.eks. `192.168.1.150`
   - **Kanal**: 0 (for enkeltuttak-plugger)
   - **Autentisering**: brukernavn og passord hvis konfigurert
5. Klikk **Test tilkobling**
6. Koble pluggen til en **Printer**: velg fra nedtrekkslisten
7. Klikk **Lagre**

### Polling-intervall

Standard polling-intervall er 10 sekunder. Reduser til 5 for mer nøyaktige målinger, øk til 30 for lavere nettverksbelastning.

## Oppsett med Tasmota

1. Konfigurer Tasmota-enheten med MQTT (se Tasmota-dokumentasjonen)
2. I Bambu Dashboard: velg **Type**: Tasmota
3. Fyll inn MQTT-topic for enheten: f.eks. `tasmota/power-plug-1`
4. Koble til printer og klikk **Lagre**

Bambu Dashboard abonnerer automatisk på `{topic}/SENSOR` for effektmålinger.

## Hva måles

Når strømmåling er aktivert, logges følgende per print:

| Metrikk | Beskrivelse |
|---|---|
| **Øyeblikkelig effekt** | Watt under printing (live) |
| **Totalt energiforbruk** | kWh for hele printen |
| **Gjennomsnittlig effekt** | kWh / printtid |
| **Energikostnad** | kWh × strømpris (fra Tibber/Nordpool) |

Dataene lagres i printhistorikken og er tilgjengelig for analyse.

## Live-visning

Øyeblikkelig effektforbruk vises i:

- **Dashboardet** — som en ekstra widget (aktiver i widget-innstillinger)
- **Flåteoversikten** — som en liten indikator på printerkortet
- **Home Assistant** — eksponert som `sensor.printer_power_watts`

## Sammenligning med estimat

Etter print vises en sammenligning:

| | Estimert | Faktisk |
|---|---|---|
| Energiforbruk | 1.17 kWh | 1.09 kWh |
| Strømkostnad | 2.16 kr | 2.02 kr |
| Avvik | — | -6.8 % |

Konsekvent avvik kan brukes til å kalibrere estimatene i [Kostnadsberegneren](../analyse/costestimator).

## Slå av printer automatisk

Shelly/Tasmota kan slå av printeren automatisk etter ferdig print:

1. Gå til **Strømmåling → [Printer] → Automatisk av**
2. Aktiver **Slå av X minutter etter ferdig print**
3. Sett tidsforsinkelse (f.eks. 10 minutter)

:::danger Avkjøling
La printeren kjøle ned i minst 5–10 minutter etter ferdig print før strømmen kuttes. Dysen bør avkjøles under 50°C for å unngå varme-kryp i hotenden.
:::
