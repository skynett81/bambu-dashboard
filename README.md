# Bambu Dashboard

Self-hosted web dashboard for monitoring and controlling Bambu Lab 3D printers over your local network.

Built with pure HTML/CSS/JS on the frontend and Node.js on the backend — only 2 npm dependencies (`mqtt`, `ws`).

## Features

### Real-time Monitoring
- **Live sparkline stats strip** — Grafana-style stat panels with rolling SVG sparklines for nozzle, bed, chamber temps, fan speed, print speed, and layer progress
- **Temperature gauges** — animated SVG ring gauges for nozzle, bed, and chamber
- **Print progress** — percentage ring, countdown timer, ETA, elapsed time, layer info
- **AMS visualization** — filament colors, remaining %, humidity, temperature (multi-AMS support)
- **Camera livestream** — RTSPS via ffmpeg + jsmpeg, click-to-fullscreen

### Multi-printer Support
- Manage multiple printers from a single dashboard
- Printer selector with instant switching
- Per-printer data across all panels (history, statistics, filament, errors, telemetry, maintenance)
- Printer identification tags on shared views (history table, error log, waste log)

### Controls
- Pause, resume, stop with confirmation dialogs
- Light toggle
- Speed profiles — Silent / Standard / Sport / Ludicrous
- Fan control — part fan, aux fan, chamber fan
- Temperature presets — nozzle, bed, chamber
- Home / calibration commands
- G-code console for direct commands

### Data & Analytics
- **Print history** — full log with printer, filename, status, duration, filament, layers
- **Statistics** — success rates, filament usage by type/brand, prints per week, monthly trends, temperature stats, per-day breakdown, CSV export
- **Telemetry** — time-series charts for temperatures, fan speeds, speed magnitude, print progress
- **Error log** — all printer errors with severity, timestamps, and printer identification
- **Filament inventory** — per-printer spool management with brand, type, color, weight, and cost tracking
- **Waste tracking** — automatic and manual waste logging with cost estimates
- **Maintenance** — component wear tracking, nozzle history, maintenance scheduling, service logging

### Infrastructure
- **18 languages** — English, Norwegian, German, French, Spanish, Italian, Japanese, Korean, Dutch, Polish, Portuguese (BR), Russian, Swedish, Turkish, Ukrainian, Chinese (Simplified), Czech, Hungarian
- **HTTPS support** — self-signed or custom certificates
- **Browser notifications** — print started, finished, failed
- **Responsive design** — desktop, tablet, mobile
- **Demo mode** — 3 mock printers with simulated telemetry for testing
- **Setup wizard** — web-based first-time configuration with security token
- **Zero framework frontend** — pure HTML/CSS/JS, no build step

## Requirements

- Node.js 22+
- ffmpeg (optional, for camera streaming)

## Quick Start

```bash
git clone <repo-url> bambu-dashboard
cd bambu-dashboard
./install.sh
```

The install script checks dependencies, installs npm packages, and launches a web-based setup wizard where you can add your printers. Optionally sets up a systemd service for auto-start.

## Manual Install

```bash
npm install
cp config.example.json config.json
# Edit config.json with your printer details
npm start
```

Open `http://localhost:3000` in your browser. Add printers via the Settings tab or edit `config.json` directly.

## Docker

```bash
cp config.example.json config.json
# Edit config.json
docker compose up -d
```

> **Note:** `network_mode: host` is required for LAN access to printers via MQTT (port 8883).

## Demo Mode

Run with simulated printers to explore the dashboard without real hardware:

```bash
npm run demo
```

This starts 3 mock printers (P2S Combo, X1 Carbon, H2D) with:
- Simulated print jobs cycling through heating → printing → cooling → idle
- Live telemetry data collection
- Seeded history, filament inventory, and error records
- Full AMS data per printer

## Configuration

Edit `config.json`:

```json
{
  "printers": [
    {
      "id": "my-printer",
      "name": "P2S Combo",
      "ip": "192.168.1.100",
      "serial": "01S00A000000000",
      "accessCode": "your-access-code",
      "model": "P2S Combo"
    }
  ],
  "server": {
    "port": 3000,
    "httpsPort": 3443,
    "cameraWsPortStart": 9001,
    "forceHttps": false
  },
  "camera": {
    "enabled": true,
    "resolution": "640x480",
    "framerate": 15,
    "bitrate": "1000k"
  }
}
```

The access code is found on the printer screen under **Settings > WiFi/Network** (LAN Access Code).

Printers can also be added, edited, and deleted via the Settings tab — no restart required.

## Commands

| Command | Description |
|---------|-------------|
| `npm start` | Start the server |
| `npm run dev` | Start with auto-reload (development) |
| `npm run demo` | Start with 3 mock printers (demo mode) |
| `npm run setup` | Run the setup wizard |
| `./install.sh` | Interactive installer |
| `./uninstall.sh` | Uninstaller |

## Architecture

```
Browser <──WebSocket──> Node.js <──MQTTS:8883──> Printer
Browser <──WS:9001────> ffmpeg  <──RTSPS:322───> Camera
```

- **Backend**: Node.js with `mqtt` and `ws` (2 dependencies)
- **Frontend**: Vanilla HTML/CSS/JS — 21 component modules, no build step
- **Database**: SQLite (built into Node.js 22, `--experimental-sqlite`)
- **Camera**: ffmpeg transcodes RTSPS to MPEG1 for browser playback via jsmpeg
- **Real-time**: WebSocket hub broadcasts printer state to all connected clients

### Server Modules

| Module | Purpose |
|--------|---------|
| `index.js` | Main entry point, HTTP/HTTPS servers, demo mode |
| `config.js` | Configuration management |
| `database.js` | SQLite schema, migrations (v1–v8), CRUD operations |
| `api-routes.js` | REST API endpoints |
| `printer-manager.js` | Printer lifecycle management |
| `mqtt-client.js` | MQTT connectivity to Bambu printers |
| `mqtt-commands.js` | MQTT command serialization |
| `websocket-hub.js` | WebSocket broadcast hub |
| `camera-stream.js` | ffmpeg camera stream management |
| `print-tracker.js` | Print job tracking and history |
| `telemetry-sampler.js` | Time-series data collection |
| `setup-wizard.js` | First-time web-based setup |

## Ports

| Port | Protocol | Description |
|------|----------|-------------|
| 3000 | HTTP/WS | Dashboard + WebSocket |
| 3443 | HTTPS/WSS | Secure dashboard (if certificates configured) |
| 9001+ | WS | Camera streams (one per printer) |
| 8883 | MQTTS | Outbound to printer (not exposed) |

## HTTPS Setup

Place your certificate files in the `certs/` directory:

```
certs/
  cert.pem
  key.pem
```

The server automatically detects certificates and enables HTTPS on port 3443. Set `forceHttps: true` in config to redirect all HTTP traffic.

## cPanel / Shared Hosting

1. Use Node.js Selector, set version to 22+
2. Set environment variable: `NODE_OPTIONS=--experimental-sqlite`
3. Set startup file: `server/index.js`
4. Run `npm install` via terminal

> Camera streaming requires ffmpeg, which is typically not available on shared hosting.

## Language Support

18 languages available via Settings > Language. Language preference is saved per browser.

## Uninstall

```bash
./uninstall.sh
```

Removes the systemd service and optionally cleans up data, config, and dependencies.
