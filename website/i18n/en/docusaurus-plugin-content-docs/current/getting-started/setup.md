---
sidebar_position: 2
title: First-time Setup
description: Connect your 3D printer and configure the dashboard
---

# First-time Setup

When the dashboard runs for the first time, the setup wizard opens automatically.

## Setup wizard

The wizard is available at `https://your-server:3443/setup`. It guides you through:

1. Create an administrator user
2. Add a printer
3. Test the connection
4. Configure notifications (optional)

## Supported printer types

3DPrintForge supports multiple connection protocols. The setup wizard detects your printer type automatically.

| Printer brand | Connection | Required info |
|---------------|-----------|---------------|
| **Bambu Lab** | MQTT (port 8883) | IP, serial number, access code |
| **Prusa** (MK4, Mini, XL) | PrusaLink HTTP API | IP, API key |
| **Snapmaker** (U1, J1, A-series) | Moonraker / SACP | IP address |
| **Voron** | Moonraker WebSocket | IP address |
| **Creality** (K1, K1 Max, K2 Plus) | Moonraker WebSocket | IP address |
| **Elegoo** (Neptune 4 series) | Moonraker WebSocket | IP address |
| **AnkerMake** (M5, M5C) | Moonraker WebSocket | IP address |
| **QIDI** (X-Max 3, X-Plus 3, Q1 Pro) | Moonraker WebSocket | IP address |
| **RatRig** (V-Core, V-Minion) | Moonraker WebSocket | IP address |
| **Sovol** (SV06, SV07, SV08) | Moonraker WebSocket | IP address |
| Any Klipper printer | Moonraker WebSocket | IP address |

## Adding a Bambu Lab printer

You need three things to connect to a Bambu Lab printer:

| Field | Description | Example |
|-------|-------------|---------|
| IP address | The printer's local IP | `192.168.1.100` |
| Serial number | 15 characters, found on the bottom of the printer | `01P09C123456789` |
| Access Code | 8 characters, found in the printer's network settings | `12345678` |

### Finding the Access Code on the printer

**X1C / P1S / P1P:**
1. Go to **Settings** on the screen
2. Select **WLAN** or **LAN**
3. Look for **Access Code**

**A1 / A1 Mini:**
1. Tap the screen and select **Settings**
2. Go to **WLAN**
3. Look for **Access Code**

## Adding a Prusa printer (PrusaLink)

1. Ensure PrusaLink is enabled on your printer (Prusa MK4, Mini, XL)
2. In the setup wizard, select **Prusa (PrusaLink)** as printer type
3. Enter the printer's IP address
4. Enter the PrusaLink API key (found in the printer's network settings or the PrusaLink web interface)
5. Click **Test connection**

## Adding a Moonraker/Klipper printer

For Snapmaker, Voron, Creality, Elegoo, AnkerMake, QIDI, RatRig, Sovol and other Klipper-based printers:

1. Ensure Moonraker is running on the printer (most Klipper printers include it)
2. In the setup wizard, select the brand or **Klipper/Moonraker** as printer type
3. Enter the printer's IP address
4. Click **Test connection**

:::info Snapmaker U1
The Snapmaker U1 supports both Moonraker and the native SACP protocol. For full feature access (NFC filament, AI defect detection, purifier, power monitor), the SACP connection is established automatically alongside Moonraker.
:::

:::tip Static IP address
Set a static IP address for your printer in your router (DHCP reservation). This way you won't need to update the dashboard every time the printer gets a new IP.
:::

:::tip Automatic configuration
3DPrintForge automatically detects the printer type and configures file access (FTPS/HTTP), camera mode and other features based on brand and model.
:::

## AMS configuration

After the printer is connected, AMS status updates automatically. You can:

- Give each slot a name and color
- Link spools to your filament inventory
- View filament consumption per spool

Go to **Settings → Printer → AMS** for manual configuration.

## HTTPS certificates {#https-sertifikater}

### Self-signed certificate (default)

The dashboard automatically generates a self-signed certificate on startup. To trust it in the browser:

- **Chrome/Edge:** Click "Advanced" → "Proceed to site"
- **Firefox:** Click "Advanced" → "Accept the Risk and Continue"

### Custom certificate

Place the certificate files in the folder and configure in `config.json`:

```json
{
  "ssl": {
    "cert": "/path/to/cert.pem",
    "key": "/path/to/key.pem"
  }
}
```

:::info Let's Encrypt
Using a domain name? Generate a free certificate with Let's Encrypt and Certbot, and point `cert` and `key` to the files in `/etc/letsencrypt/live/your-domain/`.
:::

## Environment variables

All settings can be overridden with environment variables:

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3000` | HTTP port |
| `HTTPS_PORT` | `3443` | HTTPS port |
| `NODE_ENV` | `production` | Environment |
| `AUTH_SECRET` | (auto) | JWT secret |

## Multi-printer setup

You can add multiple printers under **Settings → Printers → Add printer**. Use the printer selector at the top of the dashboard to switch between them.
