# Installation Guide

Step-by-step guide for installing 3DPrintForge on your system.

---

## Prerequisites

| Requirement | Version | Notes |
|-------------|---------|-------|
| **Node.js** | 22.0+ | Required — uses built-in SQLite (SQLite (innebygd)) |
| **npm** | Included with Node.js | Package manager |
| **ffmpeg** | Any recent version | Optional — only needed for camera livestream |
| **git** | Any recent version | For cloning and auto-updates |
| **openssl** | Any recent version | Optional — for auto-SSL certificate generation (usually pre-installed) |

### Check if you have Node.js 22+

```bash
node -v
```

If the version is below 22, or Node.js is not installed, the install script will handle it for you. To install manually:

**Ubuntu / Debian:**
```bash
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt-get install -y nodejs
```

**Fedora / RHEL:**
```bash
curl -fsSL https://rpm.nodesource.com/setup_22.x | sudo bash -
sudo dnf install -y nodejs
```

**macOS (Homebrew):**
```bash
brew install node@22
```

**Windows:**
Download from [nodejs.org](https://nodejs.org/) (v22 LTS or later).

### Install ffmpeg (optional, for camera)

**Ubuntu / Debian:**
```bash
sudo apt-get install -y ffmpeg
```

**Fedora / RHEL:**
```bash
sudo dnf install -y ffmpeg
```

**macOS:**
```bash
brew install ffmpeg
```

---

## Method 1: Install Script (Recommended)

The easiest way to get started. Works on Linux and macOS.

```bash
git clone https://github.com/skynett81/3dprintforge.git
cd 3dprintforge
./install.sh
```

This will:
1. Check for Node.js 22+ (installs it if missing)
2. Install npm dependencies
3. Launch a **7-step web setup wizard** at `http://<your-ip>:3000`

The wizard guides you through:
- **EULA acceptance**
- **System check** with auto-install for missing components
- **Network scan** to auto-discover printers on your LAN
- **Printer setup** for Bambu Lab, Moonraker/Klipper, and PrusaLink printers with test connection
- **Security** — create an admin account to protect your dashboard
- **Server settings** — ports, camera, and quick notification setup
- **Launch** — start the dashboard with optional systemd auto-start

### Terminal-based install (no browser needed)

```bash
./install.sh --cli
```

The CLI installer will:
1. Check/install Node.js 22+
2. Install npm dependencies
3. Prompt you for printer details (IP, serial, access code)
4. Create `config.json`
5. Optionally create a **systemd service** so the dashboard starts on boot

---

## Method 2: Manual Install

```bash
git clone https://github.com/skynett81/3dprintforge.git
cd 3dprintforge
npm install
```

### Create config file

```bash
cp config.example.json config.json
```

### Edit config.json

Open `config.json` in your editor and add your printer(s):

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
  ]
}
```

### Where to find printer details

| Field | Location on printer |
|-------|---------------------|
| `ip` | Settings > WiFi/Network > IP Address |
| `serial` | Settings > Device > Serial Number |
| `accessCode` | Settings > WiFi/Network > LAN Access Code |
| `model` | Your printer model: `P1S`, `P1P`, `P2S Combo`, `X1 Carbon`, `X1E`, `A1`, `A1 Mini`, `H2D` |

### Start the server

```bash
npm start
```

Open `https://localhost:3443` in your browser (HTTP on port 3000 redirects automatically).

> **Tip:** You can also add, edit, and remove printers from the Settings tab in the dashboard without editing config.json.

---

## Method 3: Docker

```bash
git clone https://github.com/skynett81/3dprintforge.git
cd 3dprintforge
cp config.example.json config.json
```

Edit `config.json` with your printer details (see above), then:

```bash
docker compose up -d
```

> **Important:** `network_mode: host` is required for LAN access to printers via MQTT (port 8883) and camera streams (port 322). This is already configured in `docker-compose.yml`.

### Docker with environment variables (no config.json)

```bash
docker compose up -d \
  -e BAMBU_IP=192.168.1.100 \
  -e BAMBU_SERIAL=01S00A000000000 \
  -e BAMBU_ACCESS_CODE=12345678
```

### View logs

```bash
docker compose logs -f
```

### Stop

```bash
docker compose down
```

---

## Method 4: Pterodactyl / wisp.gg

1. In your panel, go to **Nests** > **Import Egg**
2. Upload `egg-3dprintforge.json` from the project root
3. Create a new server using the imported egg
4. Configure the startup variables:
   - **Server Port** — must match the allocation port
   - **Printer IP** — your printer's LAN IP
   - **Printer Serial** — serial number from the printer
   - **Printer Access Code** — LAN access code from the printer
   - **Auth Password** — (optional) set a password to protect the dashboard
5. Start the server

The egg automatically installs Node.js 22 and ffmpeg. Reinstalling the server from the panel runs `git pull` to update to the latest release.

---

## Method 5: Demo Mode (No Hardware)

Try the full dashboard without a real printer:

```bash
git clone https://github.com/skynett81/3dprintforge.git
cd 3dprintforge
npm install
npm run demo
```

This starts 3 simulated printers (P2S Combo, X1 Carbon, H2D) with live print cycles, telemetry, AMS data, and seeded history. Open `https://localhost:3443` to explore.

---

## Post-install Setup

### Enable authentication (optional)

Add to `config.json`:

```json
{
  "auth": {
    "enabled": true,
    "password": "your-password",
    "username": "admin"
  }
}
```

Or use environment variables:
```bash
BAMBU_AUTH_PASSWORD=your-password npm start
```

### HTTPS (enabled by default)

HTTPS is enabled automatically on first start. The server auto-generates a self-signed SSL certificate and redirects HTTP (port 3000) to HTTPS (port 3443). Security headers (HSTS, CSP) are included.

To use your own certificate, place files in the `certs/` directory:

```
certs/
  cert.pem
  key.pem
```

To disable forced HTTPS redirect, set `"forceHttps": false` in config.json.

### Set up notifications (optional)

Go to **Settings** > **Notifications** in the dashboard to configure:
- Telegram
- Discord
- Email (SMTP)
- Webhook
- ntfy
- Pushover
- SMS (Twilio or generic HTTP gateway)

### Cloud Slicer (optional)

If you have **OrcaSlicer** or **PrusaSlicer** installed, the dashboard can auto-detect the CLI and slice uploaded files locally. To use a custom slicer path, set the `SLICER_PATH` environment variable.

### Run as systemd service (Linux)

If you didn't use `./install.sh --cli` (which offers this automatically):

```bash
sudo tee /etc/systemd/system/3dprintforge.service > /dev/null <<EOF
[Unit]
Description=3DPrintForge
After=network.target

[Service]
Type=simple
User=$USER
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

Check status:
```bash
sudo systemctl status 3dprintforge
sudo journalctl -u 3dprintforge -f
```

---

## Multiple Printers

Add more entries to the `printers` array in `config.json`:

```json
{
  "printers": [
    {
      "id": "printer-1",
      "name": "P1S",
      "ip": "192.168.1.100",
      "serial": "...",
      "accessCode": "...",
      "model": "P1S"
    },
    {
      "id": "printer-2",
      "name": "X1 Carbon",
      "ip": "192.168.1.101",
      "serial": "...",
      "accessCode": "...",
      "model": "X1 Carbon"
    }
  ]
}
```

Each printer gets its own MQTT connection and camera stream (on consecutive WebSocket ports starting from `cameraWsPortStart`, default 9001).

You can also add printers from the **Settings** tab in the dashboard — no restart required.

---

## Updating

### Automatic (from dashboard)

The dashboard checks for updates every 6 hours. When a new version is available, a toast notification banner appears at the top of the page. Click **View details** to go to Settings > System, then select **Update Now** — the server backs up current files, downloads the new version, and restarts.

### Manual (git)

```bash
cd 3dprintforge
git pull
npm install
# Restart the server or service
sudo systemctl restart 3dprintforge
```

### Docker

```bash
docker compose pull
docker compose up -d
```

### Pterodactyl

Click **Reinstall** in your panel — the egg runs `git pull` automatically.

---

## Uninstall

```bash
./uninstall.sh
```

This will:
1. Stop the running server and/or Docker container
2. Optionally remove the systemd service
3. Optionally delete config, database, and all data
4. Optionally remove the project directory

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| Printer not connecting | Verify IP is reachable (`ping`), access code matches, port 8883 is open |
| Camera not working | Install `ffmpeg`, verify camera streaming is enabled on the printer |
| SQLite error | Update to Node.js 22+: `node -v` |
| Docker: printer not found | Ensure `network_mode: host` in docker-compose.yml |
| Port already in use | Change `server.port` in config.json or set `SERVER_PORT` env var |
| Dashboard blank after update | Clear browser cache (Ctrl+Shift+R) |
| Cannot write to database | Check file permissions on the `data/` directory |

For more help, open an issue: https://github.com/skynett81/3dprintforge/issues
