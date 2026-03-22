---
sidebar_position: 2
title: Technical Architecture
description: Architecture overview for Bambu Dashboard — stack, modules, database, and WebSocket
---

# Technical Architecture

## System diagram

```
Browser <──WebSocket──> Node.js <──MQTTS:8883──> Printer
Browser <──WS:9001+──> ffmpeg  <──RTSPS:322───> Camera
```

The dashboard communicates with the printer via MQTT over TLS (port 8883) and the camera via RTSPS (port 322). The browser connects to the dashboard over HTTPS and WebSocket.

## Technology stack

| Layer | Technology |
|-----|-----------|
| Frontend | Vanilla HTML/CSS/JS — 76 component modules, no build step, no framework |
| Backend | Node.js 22 with 3 npm packages: `mqtt`, `ws`, `basic-ftp` |
| Database | SQLite (built into Node.js 22 via `--experimental-sqlite`) |
| Camera | ffmpeg transcodes RTSPS to MPEG1, jsmpeg renders in the browser |
| Real-time | WebSocket hub broadcasts printer state to all connected clients |
| Protocol | MQTT over TLS (port 8883) with the printer's LAN Access Code |

## Ports

| Port | Protocol | Direction | Description |
|------|-----------|---------|-------------|
| 3000 | HTTP + WS | In | Dashboard (redirects to HTTPS) |
| 3443 | HTTPS + WSS | In | Secure dashboard (default) |
| 9001+ | WS | In | Camera streams (one per printer) |
| 8883 | MQTTS | Out | Connection to printer |
| 322 | RTSPS | Out | Camera from printer |

## Server modules (44)

| Module | Purpose |
|-------|--------|
| `index.js` | HTTP/HTTPS servers, auto-SSL, CSP/HSTS headers, static files, demo mode |
| `config.js` | Configuration loading, defaults, env overrides and migrations |
| `database.js` | SQLite schema, 105 migrations, CRUD operations |
| `api-routes.js` | REST API (284+ endpoints) |
| `auth.js` | Authentication and session management |
| `backup.js` | Backup and restoration |
| `printer-manager.js` | Printer lifecycle, MQTT connection management |
| `mqtt-client.js` | MQTT connection to Bambu printers |
| `mqtt-commands.js` | MQTT command building (pause, resume, stop, etc.) |
| `websocket-hub.js` | WebSocket broadcasting to all browser clients |
| `camera-stream.js` | ffmpeg process management for camera streams |
| `print-tracker.js` | Print job tracking, state transitions, history logging |
| `print-guard.js` | Print protection via xcam + sensor monitoring |
| `queue-manager.js` | Print queue with multi-printer dispatch and load balancing |
| `slicer-service.js` | Local slicer CLI bridge, file upload, FTPS upload |
| `telemetry.js` | Telemetry data processing |
| `telemetry-sampler.js` | Time series data sampling |
| `thumbnail-service.js` | Thumbnail retrieval via FTPS from printer SD |
| `timelapse-service.js` | Timelapse recording and management |
| `notifications.js` | 7-channel notification system (Telegram, Discord, Email, Webhook, ntfy, Pushover, SMS) |
| `updater.js` | GitHub Releases auto-update with backup |
| `setup-wizard.js` | Web-based setup wizard for first-time use |
| `ecom-license.js` | License management |
| `failure-detection.js` | Failure detection and analysis |
| `bambu-cloud.js` | Bambu Cloud API integration |
| `bambu-rfid-data.js` | RFID filament data from AMS |
| `circuit-breaker.js` | Circuit breaker pattern for service stability |
| `energy-service.js` | Energy and electricity price calculation |
| `error-pattern-analyzer.js` | Pattern analysis of HMS errors |
| `file-parser.js` | Parsing of 3MF/GCode files |
| `logger.js` | Structured logging |
| `material-recommender.js` | Material recommendations |
| `milestone-service.js` | Milestone and achievement tracking |
| `plugin-manager.js` | Plugin system for extensions |
| `power-monitor.js` | Power meter integration (Shelly/Tasmota) |
| `price-checker.js` | Electricity price fetching (Tibber/Nordpool) |
| `printer-discovery.js` | Automatic printer discovery on LAN |
| `remote-nodes.js` | Multi-node management |
| `report-service.js` | Report generation |
| `seed-filament-db.js` | Filament database seeding |
| `spoolease-data.js` | SpoolEase integration |
| `validate.js` | Input validation |
| `wear-prediction.js` | Component wear prediction |

## Frontend components (76)

All components are vanilla JavaScript modules with no build step. They are loaded directly in the browser via `<script type="module">`.

| Component | Purpose |
|-----------|--------|
| `print-preview.js` | 3D model viewer + MakerWorld image reveal |
| `model-viewer.js` | WebGL 3D rendering with layer animation |
| `temperature-gauge.js` | Animated SVG ring gauges |
| `sparkline-stats.js` | Grafana-style statistics panels |
| `ams-panel.js` | AMS filament visualization |
| `camera-view.js` | jsmpeg video player with fullscreen |
| `controls-panel.js` | Printer control UI |
| `history-table.js` | Print history with search, filters, CSV export |
| `filament-tracker.js` | Filament inventory with favorites, color filtering |
| `queue-panel.js` | Print queue management |
| `knowledge-panel.js` | Knowledge base reader and editor |

## Database

The SQLite database is built into Node.js 22 and requires no external installation. The schema is managed by 105 migrations in `db/migrations.js`.

Main tables:

- `printers` — printer configuration
- `print_history` — all print jobs
- `filaments` — filament inventory
- `ams_slots` — AMS slot mapping
- `queue` — print queue
- `notifications_config` — notification settings
- `maintenance_log` — maintenance log

## Security

- HTTPS with auto-generated certificate (or your own)
- JWT-based authentication
- CSP and HSTS headers
- Rate limiting (200 req/min)
- No external cloud dependency for core functions
