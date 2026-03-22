---
sidebar_position: 2
title: Teknisk arkitektur
description: Arkitekturoversikt for Bambu Dashboard — stack, moduler, database og WebSocket
---

# Teknisk arkitektur

## Systemdiagram

```
Browser <──WebSocket──> Node.js <──MQTTS:8883──> Printer
Browser <──WS:9001+──> ffmpeg  <──RTSPS:322───> Camera
```

Dashboardet kommuniserer med printeren via MQTT over TLS (port 8883) og kameraet via RTSPS (port 322). Nettleseren kobler til dashboardet over HTTPS og WebSocket.

## Teknisk stack

| Lag | Teknologi |
|-----|-----------|
| Frontend | Vanilla HTML/CSS/JS — 76 komponentmoduler, ingen build-steg, ingen rammeverk |
| Backend | Node.js 22 med 3 npm-pakker: `mqtt`, `ws`, `basic-ftp` |
| Database | SQLite (innebygd i Node.js 22 via `--experimental-sqlite`) |
| Kamera | ffmpeg transkoder RTSPS til MPEG1, jsmpeg rendrer i nettleseren |
| Sanntid | WebSocket-hub sender printer-tilstand til alle tilkoblede klienter |
| Protokoll | MQTT over TLS (port 8883) med printerens LAN Access Code |

## Porter

| Port | Protokoll | Retning | Beskrivelse |
|------|-----------|---------|-------------|
| 3000 | HTTP + WS | Inn | Dashboard (omdirigerer til HTTPS) |
| 3443 | HTTPS + WSS | Inn | Sikkert dashboard (standard) |
| 9001+ | WS | Inn | Kamerastrømmer (én per printer) |
| 8883 | MQTTS | Ut | Tilkobling til printer |
| 322 | RTSPS | Ut | Kamera fra printer |

## Servermoduler (44)

| Modul | Formål |
|-------|--------|
| `index.js` | HTTP/HTTPS-servere, auto-SSL, CSP/HSTS-headere, statiske filer, demo-modus |
| `config.js` | Konfigurasjonslasting, standardverdier, env-overstyringer og migrasjoner |
| `database.js` | SQLite-skjema, 105 migrasjoner, CRUD-operasjoner |
| `api-routes.js` | REST API (284+ endepunkter) |
| `auth.js` | Autentisering og sesjonsadministrasjon |
| `backup.js` | Backup og gjenoppretting |
| `printer-manager.js` | Printer-livssyklus, MQTT-tilkoblingsadministrasjon |
| `mqtt-client.js` | MQTT-tilkobling til Bambu-printere |
| `mqtt-commands.js` | MQTT-kommandobygning (pause, fortsett, stopp, osv.) |
| `websocket-hub.js` | WebSocket-kringkasting til alle nettleserklienter |
| `camera-stream.js` | ffmpeg-prosessadministrasjon for kamerastrømmer |
| `print-tracker.js` | Print-jobsporing, tilstandsoverganger, historikk-logging |
| `print-guard.js` | Printbeskyttelse via xcam + sensorovervåking |
| `queue-manager.js` | Print-kø med multi-printer dispatch og lastbalansering |
| `slicer-service.js` | Lokal slicer CLI-bro, filopplasting, FTPS-opplasting |
| `telemetry.js` | Telemetri-databehandling |
| `telemetry-sampler.js` | Tidsserie-datasampling |
| `thumbnail-service.js` | Thumbnail-henting via FTPS fra printer SD |
| `timelapse-service.js` | Timelapse-opptak og -administrasjon |
| `notifications.js` | 7-kanals varslingsystem (Telegram, Discord, E-post, Webhook, ntfy, Pushover, SMS) |
| `updater.js` | GitHub Releases auto-oppdatering med backup |
| `setup-wizard.js` | Nettbasert oppsettveiviser for første gangs bruk |
| `ecom-license.js` | Lisensadministrasjon |
| `failure-detection.js` | Feildeteksjon og -analyse |
| `bambu-cloud.js` | Bambu Cloud API-integrasjon |
| `bambu-rfid-data.js` | RFID-filamentdata fra AMS |
| `circuit-breaker.js` | Kretstrykksmønster for tjenestestabilitet |
| `energy-service.js` | Energi- og strømprisberegning |
| `error-pattern-analyzer.js` | Mønsteranalyse av HMS-feil |
| `file-parser.js` | Parsing av 3MF/GCode-filer |
| `logger.js` | Strukturert logging |
| `material-recommender.js` | Materialanbefalinger |
| `milestone-service.js` | Milepæl- og prestasjonssporing |
| `plugin-manager.js` | Plugin-system for utvidelser |
| `power-monitor.js` | Strømmåler-integrasjon (Shelly/Tasmota) |
| `price-checker.js` | Strømpris-henting (Tibber/Nordpool) |
| `printer-discovery.js` | Automatisk printer-oppdagelse på LAN |
| `remote-nodes.js` | Fler-node-administrasjon |
| `report-service.js` | Rapportgenerering |
| `seed-filament-db.js` | Seeding av filamentdatabase |
| `spoolease-data.js` | SpoolEase-integrasjon |
| `validate.js` | Inndata-validering |
| `wear-prediction.js` | Slitasjepredikering for komponenter |

## Frontend-komponenter (76)

Alle komponenter er vanilla JavaScript-moduler uten build-steg. De lastes direkte i nettleseren via `<script type="module">`.

| Komponent | Formål |
|-----------|--------|
| `print-preview.js` | 3D-modellviser + MakerWorld-bildeavsløring |
| `model-viewer.js` | WebGL 3D-rendring med laganimasjon |
| `temperature-gauge.js` | Animerte SVG-ringgauger |
| `sparkline-stats.js` | Grafana-style statistikkpaneler |
| `ams-panel.js` | AMS-filamentvisualisering |
| `camera-view.js` | jsmpeg-videospiller med fullskjerm |
| `controls-panel.js` | Printerkontroll UI |
| `history-table.js` | Printhistorikk med søk, filtre, CSV-eksport |
| `filament-tracker.js` | Filamentlager med favoritter, fargefiltring |
| `queue-panel.js` | Print-kø-administrasjon |
| `knowledge-panel.js` | Kunnskapsbase-leser og -editor |

## Database

SQLite-databasen er innebygd i Node.js 22 og krever ingen ekstern instalasjon. Skjemaet håndteres av 105 migrasjoner i `db/migrations.js`.

Hoveddatabeller:

- `printers` — printerkonfigurasjon
- `print_history` — alle printjobber
- `filaments` — filamentlager
- `ams_slots` — AMS-sporkobling
- `queue` — print-kø
- `notifications_config` — varselinnstillinger
- `maintenance_log` — vedlikeholdslogg

## Sikkerhet

- HTTPS med auto-generert sertifikat (eller ditt eget)
- JWT-basert autentisering
- CSP og HSTS-headere
- Rate limiting (200 req/min)
- Ingen ekstern sky-avhengighet for kjernefunksjoner
