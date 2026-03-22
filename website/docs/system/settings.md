---
sidebar_position: 3
title: Innstillinger
description: Komplett oversikt over alle innstillinger i Bambu Dashboard — printer, varsler, tema, OBS, energi, webhooks og mer
---

# Innstillinger

Alle innstillinger i Bambu Dashboard er samlet på én side med tydelige kategorier. Her er en oversikt over hva som finnes i hver kategori.

Gå til: **https://localhost:3443/#settings**

## Printere

Administrer registrerte printere:

| Innstilling | Beskrivelse |
|---|---|
| Legg til printer | Registrer en ny printer med serienummer og tilgangsnøkkel |
| Printernavn | Egendefinert visningsnavn |
| Printermodell | X1C / X1C Combo / X1E / P1S / P1S Combo / P1P / P2S / P2S Combo / A1 / A1 Combo / A1 mini / H2S / H2D / H2C |
| MQTT-tilkobling | Bambu Cloud MQTT eller lokal MQTT |
| Tilgangsnøkkel | LAN Access Code fra Bambu Lab-appen |
| IP-adresse | For lokal (LAN) modus |
| Kamerainnstillinger | Aktiver/deaktiver, oppløsning |

Se [Kom i gang](../kom-i-gang/oppsett) for steg-for-steg-oppsett av første printer.

## Varsler

Se fullstendig dokumentasjon i [Varsler](../funksjoner/notifications).

Rask oversikt:
- Aktiver/deaktiver varselkanaler (Telegram, Discord, e-post, osv.)
- Per-kanal-hendelsesfilter
- Stille timer (tidsrom uten varsler)
- Testknapp per kanal

## Tema

Se fullstendig dokumentasjon i [Tema](./themes).

- Lys / Mørk / Auto-modus
- 6 fargepaletter
- Egendefinert aksentfarge
- Avrunding og kompakthet

## OBS-overlay

Konfigurasjon for OBS-overlay:

| Innstilling | Beskrivelse |
|---|---|
| Standardtema | dark / light / minimal |
| Standardposisjon | Hjørne for overlay |
| Standardskala | Skalering (0.5–2.0) |
| Vis QR-kode | Vis QR-kode til dashboardet i overlayen |

Se [OBS-overlay](../funksjoner/obs-overlay) for full URL-syntaks og oppsett.

## Energi og strøm

| Innstilling | Beskrivelse |
|---|---|
| Tibber API Token | Tilgang til Tibber-spotpriser |
| Nordpool-prisområde | Velg norsk prisregion |
| Nettleie (kr/kWh) | Din nettleiesats |
| Printereffekt (W) | Konfigurer effektforbruk per printermodell |

## Home Assistant

| Innstilling | Beskrivelse |
|---|---|
| MQTT-broker | IP, port, brukernavn, passord |
| Discovery-prefiks | Standard: `homeassistant` |
| Aktiver discovery | Publiser enheter til HA |

## Webhooks

Globale webhook-innstillinger:

| Innstilling | Beskrivelse |
|---|---|
| Webhook URL | Mottaker-URL for hendelser |
| Hemmelig nøkkel | HMAC-SHA256-signatur |
| Hendelsesfilter | Hvilke hendelser som sendes |
| Retry-forsøk | Antall forsøk ved feil (standard: 3) |
| Timeout | Sekunder før forespørsel gir opp (standard: 10) |

## Kø-innstillinger

| Innstilling | Beskrivelse |
|---|---|
| Automatisk dispatch | Aktiver/deaktiver |
| Dispatch-strategi | Første ledige / Minst brukt / Rund-robin |
| Krev bekreftelse | Manuell godkjenning før sending |
| Staggered start | Forsinkelse mellom printere i kø |

## Sikkerhet

| Innstilling | Beskrivelse |
|---|---|
| Øktvarighet | Timer/dager før automatisk utlogging |
| Tving 2FA | Krev 2FA for alle brukere |
| IP-hviteliste | Begrens tilgang til spesifikke IP-adresser |
| HTTPS-sertifikat | Last opp egendefinert sertifikat |

## System

| Innstilling | Beskrivelse |
|---|---|
| Serverport | Standard: 3443 |
| Loggformat | JSON / Tekst |
| Loggnivå | Error / Warn / Info / Debug |
| Database-opprydding | Automatisk sletting av gammel historikk |
| Oppdateringer | Sjekk for nye versjoner |
