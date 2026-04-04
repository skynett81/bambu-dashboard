---
sidebar_position: 2
title: First-time Setup
description: Connect your Bambu Lab printer and configure the dashboard
---

# First-time Setup

When the dashboard runs for the first time, the setup wizard opens automatically.

## Setup wizard

The wizard is available at `https://your-server:3443/setup`. It guides you through:

1. Create an administrator user
2. Add a printer
3. Test the connection
4. Configure notifications (optional)

## Adding a printer

You need three things to connect to your printer:

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
