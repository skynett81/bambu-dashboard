# Bambu Dashboard

> Self-hosted web dashboard for monitoring and controlling Bambu Lab 3D printers over your local network.

Created by **SkyNett81** &bull; [MIT License](LICENSE)

![Bambu Dashboard](docs/dashboard.png)

---

## Features

### Real-time Monitoring
- **Live sparkline stats** — Grafana-style rolling graphs for nozzle, bed, chamber temps, fan speed, print speed, and layer progress
- **Temperature gauges** — animated SVG ring gauges for nozzle, bed, and chamber
- **Print progress** — percentage ring, countdown timer, ETA, elapsed time, layer info
- **3D print preview** — live 3D model viewer with layer-by-layer animation and filament color tracking
- **MakerWorld integration** — auto-detects MakerWorld prints and shows model image with visual print progress reveal
- **AMS visualization** — filament colors, remaining %, humidity, temperature (multi-AMS support)
- **Camera livestream** — RTSPS via ffmpeg + jsmpeg, click-to-fullscreen

### Multi-printer Support
- Manage multiple printers from a single dashboard
- Instant printer switching with per-printer data across all panels
- Supports P1, P2, X1, A1, and H2D series

### Controls
- Pause / resume / stop with confirmation dialogs
- Light toggle, speed profiles (Silent / Standard / Sport / Ludicrous)
- Fan control (part, aux, chamber), temperature presets
- Home / calibration commands, G-code console

### Data & Analytics
- **Print history** — full log with status, duration, filament, layers (CSV export)
- **Statistics** — success rates, filament usage by type/brand, prints per week, monthly trends
- **Telemetry** — time-series charts for temperatures, fan speeds, speed, print progress
- **Error log** — all printer errors with severity, timestamps, and search
- **Filament inventory** — spool management with brand, type, color, weight, cost tracking
- **Waste tracking** — automatic and manual waste logging with cost estimates
- **Maintenance** — component wear tracking, nozzle history, maintenance scheduling

### Notifications
6 channels supported: **Telegram**, **Discord**, **Email (SMTP)**, **Webhook**, **ntfy**, **Pushover**

Events: print started, finished, failed, cancelled, printer error, maintenance due, bed cooled, update available. Quiet hours supported.

### Infrastructure
- **18 languages** — English, Norwegian, German, French, Spanish, Italian, Japanese, Korean, Dutch, Polish, Portuguese (BR), Russian, Swedish, Turkish, Ukrainian, Chinese (Simplified), Czech, Hungarian
- **HTTPS support** — auto-detected from `certs/` directory
- **Browser notifications** — real-time alerts for print events
- **Responsive design** — desktop, tablet, mobile
- **Auto-update** — checks GitHub Releases, one-click update with automatic backup
- **Demo mode** — 3 mock printers for testing without hardware
- **Setup wizard** — web-based first-time configuration
- **Zero framework frontend** — pure HTML/CSS/JS, no build step
- **Layout lock** — drag-and-drop dashboard cards, lock/unlock via header button

---

## Requirements

- **Node.js 22+** (required — uses built-in SQLite via `--experimental-sqlite`)
- **ffmpeg** (optional — for camera livestream)

---

## Quick Start

### Option 1: Install Script (Recommended)

```bash
git clone https://github.com/skynett81/bambu-dashboard.git
cd bambu-dashboard
./install.sh
```

This will:
1. Check/install Node.js 22+
2. Install npm dependencies
3. Launch a web-based setup wizard where you add your printers

The setup wizard runs at `http://<your-ip>:3000` — open it in your browser to complete setup.

For a terminal-based install instead:
```bash
./install.sh --cli
```

### Option 2: Manual Install

```bash
git clone https://github.com/skynett81/bambu-dashboard.git
cd bambu-dashboard
npm install
cp config.example.json config.json
```

Edit `config.json` with your printer details (see [Configuration](#configuration)), then:

```bash
npm start
```

Open `http://localhost:3000` in your browser.

### Option 3: Docker

```bash
git clone https://github.com/skynett81/bambu-dashboard.git
cd bambu-dashboard
cp config.example.json config.json
# Edit config.json with your printer details
docker compose up -d
```

> **Important:** `network_mode: host` is required for LAN access to printers via MQTT (port 8883) and camera streams (port 322). This is already set in `docker-compose.yml`.

### Option 4: Demo Mode (No Hardware)

Try the dashboard without a real printer:

```bash
git clone https://github.com/skynett81/bambu-dashboard.git
cd bambu-dashboard
npm install
npm run demo
```

This starts 3 simulated printers (P2S Combo, X1 Carbon, H2D) with live print cycles, telemetry, AMS data, and seeded history.

---

## Configuration

Edit `config.json` (created from `config.example.json`):

```json
{
  "printers": [
    {
      "id": "my-printer",
      "name": "My P1S",
      "ip": "192.168.1.100",
      "serial": "01S00A000000000",
      "accessCode": "12345678",
      "model": "P1S"
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

### Finding Your Printer Details

| Field | Where to Find |
|-------|--------------|
| `ip` | Printer screen: Settings > WiFi/Network > IP Address |
| `serial` | Printer screen: Settings > Device > Serial Number |
| `accessCode` | Printer screen: Settings > WiFi/Network > LAN Access Code |
| `model` | Your printer model (e.g., `P1S`, `P2S Combo`, `X1 Carbon`, `A1 Mini`, `H2D`) |

> **Tip:** Printers can also be added, edited, and deleted from the Settings tab in the dashboard — no restart required.

### Multiple Printers

Add more entries to the `printers` array. Each printer gets its own MQTT connection and camera stream (on consecutive ports starting from `cameraWsPortStart`).

```json
{
  "printers": [
    { "id": "printer-1", "name": "P1S", "ip": "192.168.1.100", "serial": "...", "accessCode": "...", "model": "P1S" },
    { "id": "printer-2", "name": "X1C", "ip": "192.168.1.101", "serial": "...", "accessCode": "...", "model": "X1 Carbon" }
  ]
}
```

---

## HTTPS Setup

Place certificate files in the `certs/` directory:

```
certs/
  cert.pem
  key.pem
```

The server auto-detects certificates and enables HTTPS on port 3443. Set `"forceHttps": true` in config to redirect all HTTP traffic.

Generate a self-signed certificate for testing:
```bash
mkdir -p certs
openssl req -x509 -newkey rsa:2048 -keyout certs/key.pem -out certs/cert.pem -days 365 -nodes -subj '/CN=localhost'
```

---

## Commands

| Command | Description |
|---------|-------------|
| `npm start` | Start the server |
| `npm run dev` | Start with auto-reload (development) |
| `npm run demo` | Start with 3 mock printers |
| `npm run setup` | Run the setup wizard |
| `./install.sh` | Interactive installer (web wizard) |
| `./install.sh --cli` | Terminal-based installer with systemd option |
| `./start.sh` | Start the server (same as `npm start`) |
| `./uninstall.sh` | Remove service, data, config (interactive) |

---

## Architecture

```
Browser ◄──WebSocket──► Node.js ◄──MQTTS:8883──► Printer
Browser ◄──WS:9001+───► ffmpeg  ◄──RTSPS:322──► Camera
```

### Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Vanilla HTML/CSS/JS — 21 component modules, no build step, no frameworks |
| Backend | Node.js 22 with 3 npm packages: `mqtt`, `ws`, `basic-ftp` |
| Database | SQLite (built into Node.js 22 via `--experimental-sqlite`) |
| Camera | ffmpeg transcodes RTSPS → MPEG1 → jsmpeg in browser |
| Real-time | WebSocket hub broadcasts printer state to all connected clients |
| Protocol | MQTT over TLS (port 8883) using the printer's LAN access code |

### Ports

| Port | Protocol | Direction | Description |
|------|----------|-----------|-------------|
| 3000 | HTTP + WS | Inbound | Dashboard + WebSocket |
| 3443 | HTTPS + WSS | Inbound | Secure dashboard (if certs configured) |
| 9001+ | WS | Inbound | Camera streams (one per printer) |
| 8883 | MQTTS | Outbound | Connection to printer |
| 322 | RTSPS | Outbound | Camera feed from printer |

### Server Modules

| Module | Purpose |
|--------|---------|
| `index.js` | HTTP/HTTPS servers, static files, demo mode |
| `config.js` | Configuration loading and defaults |
| `database.js` | SQLite schema, migrations (v1–v8), CRUD |
| `api-routes.js` | REST API (40+ endpoints) |
| `printer-manager.js` | Printer lifecycle, MQTT connection management |
| `mqtt-client.js` | MQTT connectivity to Bambu printers |
| `mqtt-commands.js` | MQTT command serialization (pause, resume, stop, etc.) |
| `websocket-hub.js` | WebSocket broadcast to all browser clients |
| `camera-stream.js` | ffmpeg process management for camera streams |
| `print-tracker.js` | Print job tracking, state transitions, history logging |
| `telemetry-sampler.js` | Time-series data sampling |
| `thumbnail-service.js` | Print thumbnail fetching via FTPS from printer SD |
| `notifications.js` | 6-channel notification system |
| `updater.js` | GitHub Releases auto-update with backup |
| `setup-wizard.js` | Web-based first-time setup |

### Frontend Components

| Component | Purpose |
|-----------|---------|
| `print-preview.js` | 3D model viewer + MakerWorld image reveal |
| `model-viewer.js` | WebGL 3D renderer with layer animation |
| `temperature-gauge.js` | Animated SVG ring gauges |
| `sparkline-stats.js` | Grafana-style stat panels with rolling graphs |
| `ams-panel.js` | AMS filament visualization |
| `camera-view.js` | jsmpeg video player |
| `controls-panel.js` | Printer controls UI |
| `history-table.js` | Print history with search and filters |
| `statistics-panel.js` | Charts and aggregated stats |
| `telemetry-panel.js` | Time-series telemetry charts |
| `filament-tracker.js` | Filament inventory management |
| `waste-panel.js` | Waste tracking and statistics |
| `maintenance-panel.js` | Maintenance scheduling and wear tracking |
| `settings-dialog.js` | Printer config, notifications, preferences |
| `dashboard-dnd.js` | Drag-and-drop card layout with lock toggle |
| `notifications.js` | Browser notification system |
| `printer-selector.js` | Multi-printer switcher |
| `error-log.js` | Error log viewer |
| `update-panel.js` | Auto-update UI |

---

## Systemd Service

The `--cli` installer can create a systemd service automatically. To set it up manually:

```bash
sudo tee /etc/systemd/system/bambu-dashboard.service > /dev/null <<EOF
[Unit]
Description=Bambu Dashboard
After=network.target

[Service]
Type=simple
User=$USER
WorkingDirectory=$(pwd)
ExecStart=$(which node) --experimental-sqlite server/index.js
Restart=on-failure
RestartSec=5
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable --now bambu-dashboard
```

Manage with:
```bash
sudo systemctl status bambu-dashboard
sudo systemctl restart bambu-dashboard
sudo journalctl -u bambu-dashboard -f
```

---

## Updating

The dashboard checks for updates automatically (every 6 hours by default). When a new version is available, a badge appears in the header.

**From the dashboard:** Click the update badge → "Update Now". The server backs up current files, downloads the new version, and restarts automatically.

**Manual update (git):**
```bash
git pull
npm install
# Restart the server
```

**Docker update:**
```bash
docker compose pull
docker compose up -d
```

---

## Language Support

18 languages available. Change via Settings > Language. Preference is saved per browser.

English, Norwegian (Bokmal), German, French, Spanish, Italian, Japanese, Korean, Dutch, Polish, Portuguese (Brazil), Russian, Swedish, Turkish, Ukrainian, Chinese (Simplified), Czech, Hungarian.

---

## Troubleshooting

### Printer not connecting
- Verify the printer IP is reachable: `ping 192.168.1.100`
- Verify the LAN access code matches (regenerating it on the printer will change it)
- Ensure MQTT port 8883 is not blocked by your firewall
- The printer must be on the same LAN as the server

### Camera not working
- Requires `ffmpeg` installed on the server
- Verify the printer has camera streaming enabled
- Check that camera WebSocket port (default 9001) is not blocked

### Node.js version
- Node.js 22+ is required. Check with: `node -v`
- The `--experimental-sqlite` flag is required for the built-in SQLite module

### Demo mode
- Run `npm run demo` or `BAMBU_DEMO=true npm start`
- Demo data can be removed from Settings > Demo section

### Docker: printer not found
- `network_mode: host` is required in `docker-compose.yml` (default)
- Bridge mode will not work because the server needs direct LAN access

---

## Project Structure

```
bambu-dashboard/
├── server/                    # Backend
│   ├── index.js               # Entry point
│   ├── config.js              # Configuration
│   ├── database.js            # SQLite database
│   ├── api-routes.js          # REST API
│   ├── printer-manager.js     # Printer management
│   ├── mqtt-client.js         # MQTT connection
│   ├── mqtt-commands.js       # Command serialization
│   ├── websocket-hub.js       # WebSocket hub
│   ├── camera-stream.js       # Camera streaming
│   ├── print-tracker.js       # Print job tracking
│   ├── telemetry-sampler.js   # Telemetry sampling
│   ├── thumbnail-service.js   # Thumbnail fetching
│   ├── notifications.js       # Notification system
│   ├── updater.js             # Auto-update
│   ├── setup-wizard.js        # Setup wizard
│   └── demo/                  # Demo mode
│       ├── mock-printer.js    # Simulated printers
│       └── mock-data.js       # Seed data
├── public/                    # Frontend (served as static files)
│   ├── index.html             # Main page
│   ├── setup.html             # Setup wizard page
│   ├── css/
│   │   └── components.css     # All styles
│   ├── js/
│   │   ├── app.js             # Main app logic
│   │   ├── state.js           # State management
│   │   ├── i18n.js            # Internationalization
│   │   ├── components/        # 21 UI components
│   │   ├── utils/             # Shared utilities
│   │   └── lib/               # Third-party (jsmpeg)
│   ├── lang/                  # 18 language files
│   └── assets/                # Icons and fonts
├── config.example.json        # Configuration template
├── package.json
├── Dockerfile
├── docker-compose.yml
├── install.sh                 # Interactive installer
├── uninstall.sh               # Uninstaller
├── start.sh                   # Start script
└── LICENSE
```

---

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b my-feature`
3. Run in dev mode: `npm run dev`
4. Test with demo: `npm run demo`
5. Submit a pull request

---

## License

[MIT](LICENSE) — SkyNett81
