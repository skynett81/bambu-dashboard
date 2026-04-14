# 3DPrintForge

> Self-hosted web dashboard for monitoring and controlling your 3D printers over your local network.

Created by **SkyNett81** &bull; [AGPL-3.0 License](LICENSE)

[![ko-fi](https://ko-fi.com/img/githubbutton_sm.svg)](https://ko-fi.com/V7V21NRKM7)

![3DPrintForge](docs/project/dashboard.png)

---

## Highlights

- **Real-time monitoring** — live temperature gauges, sparkline graphs, print progress, 3D model preview
- **Multi-printer** — manage all your printers from one dashboard with instant switching
- **Print Guard** — automatic protection using xcam + 5 sensor monitors (temp, filament, fan, stall, errors)
- **Print Queue** — multi-printer dispatch with load balancing and pre-print filament checks
- **Filament Inventory** — favorites, color filters, bulk add, HueForge TD, CSV import, Spoolman sync
- **Model Forge** — 51 parametric 3D generators across 8 categories: organization (Gridfinity, storage boxes, cable labels), mechanical (gears, pulleys, springs, hinges, snap-fits), printer (spool adapters, cable chains, first-layer tests, nozzle storage), home (hooks, clips, pots, organizers, wall plates, lidded boxes), tech (phone/headphone stands, VESA mounts, Raspberry Pi cases, battery holders), creative (voronoi, topographic maps, 3D QR, shapes, honeycomb, dice towers, miniature bases)
- **Cloud Slicer** — upload files, auto-slice with OrcaSlicer/PrusaSlicer, FTPS to printer
- **7 notification channels** — Telegram, Discord, Email, Webhook, ntfy, Pushover, SMS
- **Multi-brand** — Bambu Lab, Snapmaker, Prusa, OctoPrint, Creality, Elegoo, Voron, AnkerMake, QIDI, RatRig
- **Security hardened** — CIS/NIS2 aligned: scrypt auth, CSRF, CSP, rate limiting, TOFU cert pinning, SSRF guards
- **590+ API endpoints** — full REST API with OpenAPI docs at `/api/docs`
- **English UI** — entire application in English, documentation site available in English and Norwegian
- **Docusaurus documentation** — available at `/docs/` and on GitHub Pages
- **Zero frameworks** — pure HTML/CSS/JS frontend, Node.js 22 backend with 9 npm packages

---

## Requirements

| Requirement | Version | Required | Notes |
|-------------|---------|----------|-------|
| **Node.js** | 22.0+ | Yes | Uses built-in SQLite |
| **npm** | Included with Node.js | Yes | Package manager |
| **ffmpeg** | Any recent version | No | Only needed for camera livestream |
| **git** | Any recent version | No | For cloning, auto-updates, and version control |
| **openssl** | Any recent version | No | For auto-SSL certificate generation (usually pre-installed) |

## Supported Printers

### Bambu Lab (MQTT over LAN)

- **P1 Series** — P1S, P1S Combo, P1P
- **P2 Series** — P2S, P2S Combo
- **X1 Series** — X1 Carbon, X1 Carbon Combo, X1E
- **A1 Series** — A1, A1 Combo, A1 Mini
- **H2 Series** — H2S, H2D, H2C (toolchanger)

### PrusaLink (HTTP REST API)

- **Prusa** — MK4, MK3.9, Mini+, XL (with PrusaLink firmware)

### Snapmaker SACP (Binary TCP, port 8888)

- **Snapmaker J1**, J1s — IDEX dual-nozzle with mirror/duplicate modes
- **Snapmaker Artisan** — 400×400×400, dual extruder, enclosure, air purifier
- Uses official `@snapmaker/snapmaker-sacp-sdk` npm package

### Snapmaker 2.0 HTTP (REST API, port 8080)

- **Snapmaker A150**, A250, A350 — with touchscreen token approval
- Supports enclosure LED, fan, temperature control

### OctoPrint (HTTP REST API)

- **Ender 3** — all variants (Pro, V2, S1, Neo)
- **Prusa MK3** — i3 MK3S+ with OctoPrint
- **Anycubic** — Mega, Kobra, Vyper
- **Artillery** — Sidewinder, Genius
- **Any printer** running OctoPrint on Raspberry Pi or similar

### Moonraker / Klipper (WebSocket API)

- **Snapmaker** — U1 (deep integration: NFC filament, AI defect detection, timelapse, entangle detection, calibration trends)
- **Voron** — all models with Klipper + Moonraker
- **Creality** — K1, K1 Max, Ender 3 V3, and other Klipper models
- **Elegoo** — Neptune series with Klipper firmware
- **AnkerMake** — M5, M5C series. Two options:
  - **Community Klipper firmware** — Full Moonraker support (recommended)
  - **Stock firmware** — Use [ankermake-m5-protocol](https://github.com/Ankermgmt/ankermake-m5-protocol) alongside 3DPrintForge for native MQTT+PPPP access (Python-based, requires AnkerMake account token)
- **QIDI** — X-Max, X-Plus with Moonraker
- **RatRig** — V-Core, V-Minion
- Any printer running **Klipper + Moonraker**

## Supported Platforms

| Platform | Support |
|----------|---------|
| Linux (Ubuntu, Debian, Fedora, etc.) | Full support |
| macOS | Full support |
| Windows | Works with Node.js, no install script |
| Docker | Full support (`network_mode: host` required) |
| Pterodactyl / wisp.gg | Egg file included |

---

## Quick Start

For a detailed step-by-step guide, see **[INSTALL.md](INSTALL.md)**.

### Option 1: Install Script (Recommended)

```bash
git clone https://github.com/skynett81/3dprintforge.git
cd 3dprintforge
./install.sh
```

This will:
1. Check/install Node.js 22+
2. Install npm dependencies
3. Launch a 7-step web setup wizard:
   - EULA acceptance
   - System check with auto-install
   - Network scan (auto-discover printers on LAN)
   - Add printers (Bambu Lab, Moonraker/Klipper, PrusaLink) with test connection
   - Create admin account with password
   - Server settings and quick notification setup
   - Summary and launch

The setup wizard runs at `http://<your-ip>:3000` — open it in your browser to complete setup.

For a terminal-based install instead:
```bash
./install.sh --cli
```

### Option 2: Manual Install

```bash
git clone https://github.com/skynett81/3dprintforge.git
cd 3dprintforge
npm install
cp config.example.json config.json
```

Edit `config.json` with your printer details (see [Configuration](#configuration)), then:

```bash
npm start
```

Open `https://localhost:3443` in your browser (HTTP on port 3000 redirects automatically).

### Option 3: Docker

```bash
git clone https://github.com/skynett81/3dprintforge.git
cd 3dprintforge
cp config.example.json config.json
# Edit config.json with your printer details
docker compose up -d
```

> **Important:** `network_mode: host` is required for LAN access to printers via MQTT (port 8883) and camera streams (port 322). This is already set in `docker-compose.yml`.

### Option 4: One-Line Install (curl)

```bash
curl -fsSL https://raw.githubusercontent.com/skynett81/3dprintforge/main/install.sh | bash
```

Or with wget:
```bash
wget -qO- https://raw.githubusercontent.com/skynett81/3dprintforge/main/install.sh | bash
```

### Option 5: Pterodactyl / wisp.gg

Import the included egg file for game panel hosting:

1. Go to **Admin > Nests > Import Egg**
2. Upload `egg-3dprintforge.json`
3. Create a server with the egg — it auto-installs Node.js and dependencies
4. Set environment variables: `BAMBU_IP`, `BAMBU_SERIAL`, `BAMBU_ACCESS_CODE`

### Option 6: systemd Service (Manual)

After any install method, create a systemd service for auto-start:

```bash
sudo tee /etc/systemd/system/3dprintforge.service > /dev/null <<EOF
[Unit]
Description=3DPrintForge
After=network.target

[Service]
Type=simple
User=$(whoami)
WorkingDirectory=$(pwd)
ExecStart=$(which node) server/index.js
Restart=on-failure
RestartSec=5
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable --now 3dprintforge
```

Manage with: `sudo systemctl {start|stop|restart|status} 3dprintforge`

### Option 7: PM2 Process Manager

```bash
npm install -g pm2
pm2 start server/index.js --name 3dprintforge
pm2 save
pm2 startup  # auto-start on boot
```

### Option 8: Demo Mode (No Hardware)

Try the dashboard without a real printer:

```bash
git clone https://github.com/skynett81/3dprintforge.git
cd 3dprintforge
npm install
npm run demo
```

This starts 3 simulated printers (P2S Combo, X1 Carbon, H2D) with live print cycles, telemetry, AMS data, and seeded history.

### Option 9: Raspberry Pi

```bash
# Install Node.js 22 on Raspberry Pi (ARM64)
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt-get install -y nodejs ffmpeg git

git clone https://github.com/skynett81/3dprintforge.git
cd 3dprintforge
./install.sh
```

> **Tip:** Raspberry Pi 4 (2GB+) or Pi 5 recommended. Pi 3 works but camera streaming may be slow.

### Option 10: Unraid / TrueNAS / NAS

Use the Docker method with the Unraid Community Applications template or TrueNAS TrueCharts:

```bash
docker run -d --name 3dprintforge \
  --network host \
  -v /mnt/user/appdata/3dprintforge/data:/app/data \
  -v /mnt/user/appdata/3dprintforge/config.json:/app/config.json \
  -v /mnt/user/appdata/3dprintforge/certs:/app/certs \
  --restart unless-stopped \
  ghcr.io/skynett81/3dprintforge:latest
```

---

## Configuration

Edit `config.json` (created from `config.example.json`):

```json
{
  "printers": [
    {
      "id": "my-bambu",
      "name": "My P1S",
      "ip": "192.168.1.100",
      "serial": "01S00A000000000",
      "accessCode": "12345678",
      "model": "P1S",
      "type": "bambu"
    },
    {
      "id": "my-klipper",
      "name": "My Voron",
      "ip": "192.168.1.200",
      "type": "moonraker",
      "port": 80
    },
    {
      "id": "my-prusa",
      "name": "My MK4",
      "ip": "192.168.1.150",
      "type": "prusalink",
      "accessCode": "your-api-key"
    }
  ],
  "server": {
    "port": 3000,
    "httpsPort": 3443,
    "cameraWsPortStart": 9001,
    "forceHttps": true
  }
}
```

### Finding Your Printer Details

**Bambu Lab:**

| Field | Where to Find |
|-------|--------------|
| `ip` | Printer screen: Settings > WiFi/Network > IP Address |
| `serial` | Printer screen: Settings > Device > Serial Number |
| `accessCode` | Printer screen: Settings > WiFi/Network > LAN Access Code |

**PrusaLink:**

| Field | Where to Find |
|-------|--------------|
| `ip` | Printer screen: Settings > Network > IP Address |
| `accessCode` | PrusaLink API key from printer screen or PrusaSlicer |

**OctoPrint:**

| Field | Where to Find |
|-------|--------------|
| `ip` | OctoPrint host IP (e.g. your Raspberry Pi) |
| `port` | OctoPrint port (default 80) |
| `accessCode` | OctoPrint API key from Settings → API → Global API Key |
| `webcamUrl` | Optional: Custom webcam snapshot URL |

**Moonraker / Klipper:**

| Field | Where to Find |
|-------|--------------|
| `ip` | Your printer's network IP address |
| `port` | Moonraker port (default 80) |

> **Tip:** The setup wizard auto-discovers Bambu and Moonraker printers on your network. Printers can also be added, edited, and deleted from the Settings tab in the dashboard — no restart required.

### Multiple Printers

Mix Bambu Lab, OctoPrint, PrusaLink, and Moonraker printers in the same `printers` array. Each printer gets its own connection and camera stream (on consecutive ports starting from `cameraWsPortStart`).

---

## HTTPS

HTTPS is enabled by default. On first start, the server auto-generates a self-signed SSL certificate if none exists. HTTPS runs on port 3443, and HTTP traffic on port 3000 is automatically redirected.

To use your own certificate, place files in `certs/cert.pem` and `certs/key.pem`.

The server includes HSTS and CSP security headers. To disable forced HTTPS, set `"forceHttps": false` in config.json.

---

## Authentication

The setup wizard guides you through creating an admin account. You can also configure it manually:

Authentication is **disabled by default**. Enable it to protect the dashboard:

```json
{
  "auth": {
    "enabled": true,
    "password": "your-password",
    "username": "admin",
    "sessionDurationHours": 24
  }
}
```

Or use environment variables (for Docker/Pterodactyl):
```bash
BAMBU_AUTH_PASSWORD=your-password BAMBU_AUTH_USERNAME=admin npm start
```

---

## Notifications

Configure in **Settings > Notifications** in the dashboard:

| Channel | Configuration |
|---------|--------------|
| Telegram | Bot token + chat ID |
| Discord | Webhook URL |
| Email | SMTP host, port, credentials |
| Webhook | Custom URL with headers |
| ntfy | Server URL + topic |
| Pushover | API token + user key |
| SMS | Twilio or generic HTTP gateway |

14 events available including print status, errors, maintenance, queue, and filament alerts. Quiet hours supported.

---

## Updating

The dashboard checks for updates automatically (every 6 hours). When a new version is available, a toast notification appears.

**From the dashboard:** Click "View details" on the toast or go to Settings > System > Update Now.

**Manual (git):**
```bash
git pull && npm install
# Restart the server
```

**Docker:**
```bash
docker compose pull && docker compose up -d
```

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| Bambu printer not connecting | Verify IP (`ping`), access code, port 8883 open, same LAN |
| Moonraker printer not connecting | Verify IP (`ping`), Moonraker running, port open (default 80) |
| Camera not working | Install `ffmpeg`, verify camera enabled on printer |
| SQLite error | Update to Node.js 22+: `node -v` |
| Docker: printer not found | Ensure `network_mode: host` in docker-compose.yml |
| Port already in use | Change `server.port` in config.json or set `SERVER_PORT` env var |
| Dashboard blank after update | Clear browser cache (Ctrl+Shift+R) |

---

## More Documentation

- **[Features](docs/project/features.md)** — complete feature list
- **[Architecture](docs/project/architecture.md)** — stack, modules, components, project structure
- **[Changelog](docs/project/changelog.md)** — version history
- **[Security](docs/system/security.md)** — authentication, encryption, rate limiting, SSRF guards
- **[Installation Guide](INSTALL.md)** — detailed step-by-step install instructions
- **[Docusaurus Docs](website/)** — full documentation site at `/docs/` and [GitHub Pages](https://skynett81.github.io/3dprintforge/)

---

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b my-feature`
3. Run in dev mode: `npm run dev`
4. Test with demo: `npm run demo`
5. Submit a pull request

---

## License

[AGPL-3.0](LICENSE) — SkyNett81
