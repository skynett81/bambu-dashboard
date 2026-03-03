# Architecture

Technical architecture of Bambu Dashboard.

---

## Overview

```
Browser <──WebSocket──> Node.js <──MQTTS:8883──> Printer
Browser <──WS:9001+──> ffmpeg  <──RTSPS:322───> Camera
```

## Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Vanilla HTML/CSS/JS — 31 component modules, no build step, no frameworks |
| Backend | Node.js 22 with 3 npm packages: `mqtt`, `ws`, `basic-ftp` |
| Database | SQLite (built into Node.js 22 via `--experimental-sqlite`) |
| Camera | ffmpeg transcodes RTSPS to MPEG1, jsmpeg renders in browser |
| Real-time | WebSocket hub broadcasts printer state to all connected clients |
| Protocol | MQTT over TLS (port 8883) using the printer's LAN access code |

## Ports

| Port | Protocol | Direction | Description |
|------|----------|-----------|-------------|
| 3000 | HTTP + WS | Inbound | Dashboard (redirects to HTTPS) |
| 3443 | HTTPS + WSS | Inbound | Secure dashboard (default) |
| 9001+ | WS | Inbound | Camera streams (one per printer) |
| 8883 | MQTTS | Outbound | Connection to printer |
| 322 | RTSPS | Outbound | Camera feed from printer |

---

## Server Modules (24)

| Module | Purpose |
|--------|---------|
| `index.js` | HTTP/HTTPS servers, auto-SSL, CSP/HSTS headers, static files, demo mode |
| `config.js` | Configuration loading, defaults, env overrides, and migrations |
| `database.js` | SQLite schema, 60 migrations, CRUD operations |
| `api-routes.js` | REST API (~130 endpoints) |
| `auth.js` | Authentication and session management |
| `backup.js` | Backup and restore functionality |
| `printer-manager.js` | Printer lifecycle, MQTT connection management |
| `mqtt-client.js` | MQTT connectivity to Bambu printers |
| `mqtt-commands.js` | MQTT command serialization (pause, resume, stop, etc.) |
| `websocket-hub.js` | WebSocket broadcast to all browser clients |
| `camera-stream.js` | ffmpeg process management for camera streams |
| `print-tracker.js` | Print job tracking, state transitions, history logging |
| `print-guard.js` | Print protection via xcam + sensor monitoring |
| `queue-manager.js` | Print queue with multi-printer dispatch and load balancing |
| `slicer-service.js` | Local slicer CLI bridge, file upload, FTPS upload |
| `telemetry.js` | Telemetry data processing |
| `telemetry-sampler.js` | Time-series data sampling |
| `thumbnail-service.js` | Print thumbnail fetching via FTPS from printer SD |
| `timelapse-service.js` | Timelapse capture and management |
| `notifications.js` | 7-channel notification system (Telegram, Discord, Email, Webhook, ntfy, Pushover, SMS) |
| `updater.js` | GitHub Releases auto-update with backup |
| `setup-wizard.js` | Web-based first-time setup |
| `ecom-license.js` | License management |
| `failure-detection.js` | Failure detection and analysis |

### Demo Modules

| Module | Purpose |
|--------|---------|
| `demo/mock-printer.js` | Simulated printer with live print cycles |
| `demo/mock-data.js` | Seed data for demo mode |

---

## Frontend Components (31)

| Component | Purpose |
|-----------|---------|
| `print-preview.js` | 3D model viewer + MakerWorld image reveal |
| `model-viewer.js` | WebGL 3D renderer with layer animation |
| `model-info-panel.js` | 3D model metadata and model link display |
| `temperature-gauge.js` | Animated SVG ring gauges |
| `sparkline-stats.js` | Grafana-style stat panels with rolling graphs |
| `ams-panel.js` | AMS filament visualization |
| `camera-view.js` | jsmpeg video player with fullscreen + stream URL |
| `controls-panel.js` | Printer controls UI with file upload |
| `history-table.js` | Print history with search, filters, CSV export |
| `statistics-panel.js` | Charts and aggregated stats |
| `telemetry-panel.js` | Live values, fan dashboard, time-series charts |
| `filament-tracker.js` | Filament inventory with favorites, color filter, import, views |
| `waste-panel.js` | Waste tracking and statistics |
| `maintenance-panel.js` | Maintenance scheduling and wear tracking |
| `protection-panel.js` | Print Guard status, settings, and log |
| `queue-panel.js` | Print queue management UI |
| `knowledge-panel.js` | Knowledge base browser and editor |
| `learning-panel.js` | Learning center with course progress |
| `settings-dialog.js` | Printer config, notifications, preferences |
| `dashboard-dnd.js` | Drag-and-drop card layout with lock toggle |
| `notifications.js` | Browser notification system |
| `printer-selector.js` | Multi-printer switcher |
| `printer-info.js` | Printer info display |
| `error-log.js` | Error log viewer with HMS descriptions |
| `update-panel.js` | Auto-update UI with toast notifications |
| `active-filament.js` | Active filament display on dashboard |
| `fan-display.js` | Fan speed visualization |
| `print-progress.js` | Print progress tracking |
| `speed-control.js` | Speed profile control with slider |
| `quick-status.js` | Quick status card |
| `panel-utils.js` | Shared panel utilities |

### Other Frontend Files

| File | Purpose |
|------|---------|
| `js/app.js` | Main application logic |
| `js/state.js` | State management |
| `js/i18n.js` | Internationalization |
| `js/lib/jsmpeg.min.js` | JSMpeg video decoder |
| `css/main.css` | Core styles |
| `css/components.css` | Component styles |
| `css/responsive.css` | Responsive breakpoints |
| `obs.html` | OBS streaming overlay page |

---

## Project Structure

```
bambu-dashboard/
├── server/                    # Backend (24 modules)
│   ├── index.js               # Entry point (auto-SSL, CSP, HSTS)
│   ├── config.js              # Configuration
│   ├── database.js            # SQLite database (60 migrations)
│   ├── api-routes.js          # REST API (~130 endpoints)
│   ├── auth.js                # Authentication
│   ├── backup.js              # Backup and restore
│   ├── printer-manager.js     # Printer management
│   ├── mqtt-client.js         # MQTT connection
│   ├── mqtt-commands.js       # Command serialization
│   ├── websocket-hub.js       # WebSocket hub
│   ├── camera-stream.js       # Camera streaming
│   ├── print-tracker.js       # Print job tracking
│   ├── print-guard.js         # Print protection (xcam + sensors)
│   ├── queue-manager.js       # Print queue management
│   ├── slicer-service.js      # Local slicer CLI bridge
│   ├── telemetry.js           # Telemetry processing
│   ├── telemetry-sampler.js   # Telemetry sampling
│   ├── thumbnail-service.js   # Thumbnail fetching
│   ├── timelapse-service.js   # Timelapse capture
│   ├── notifications.js       # 7-channel notifications
│   ├── updater.js             # Auto-update
│   ├── setup-wizard.js        # Setup wizard
│   ├── ecom-license.js        # License management
│   ├── failure-detection.js   # Failure detection
│   └── demo/                  # Demo mode
│       ├── mock-printer.js    # Simulated printers
│       └── mock-data.js       # Seed data
├── public/                    # Frontend (served as static files)
│   ├── index.html             # Main page
│   ├── login.html             # Login page
│   ├── setup.html             # Setup wizard page
│   ├── obs.html               # OBS streaming overlay
│   ├── css/
│   │   ├── main.css           # Core styles
│   │   ├── components.css     # Component styles
│   │   └── responsive.css     # Responsive breakpoints
│   ├── js/
│   │   ├── app.js             # Main app logic
│   │   ├── state.js           # State management
│   │   ├── i18n.js            # Internationalization
│   │   ├── components/        # 31 UI components
│   │   ├── utils/             # Shared utilities
│   │   └── lib/               # Third-party (jsmpeg)
│   ├── lang/                  # 17 language files
│   └── assets/                # Icons and fonts
├── config.example.json        # Configuration template
├── egg-bambu-dashboard.json   # Pterodactyl egg
├── package.json
├── Dockerfile
├── docker-compose.yml
├── install.sh                 # Interactive installer
├── uninstall.sh               # Uninstaller
├── start.sh                   # Start script
└── LICENSE
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
| `./start.sh --demo` | Start in demo mode |
| `./uninstall.sh` | Remove service, data, config (interactive) |

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

## Pterodactyl / wisp.gg

A ready-made egg file is included for Pterodactyl Panel, Pelican, and wisp.gg:

1. In your panel, go to **Nests** > **Import Egg**
2. Upload `egg-bambu-dashboard.json` from the project root
3. Create a server using the egg
4. Configure the **Server Port**, **Auth Password**, and other variables
5. Start the server

The egg installs Node.js 22, ffmpeg, and clones the repository automatically. Reinstalling the server from the panel runs `git pull` to update to the latest release.
