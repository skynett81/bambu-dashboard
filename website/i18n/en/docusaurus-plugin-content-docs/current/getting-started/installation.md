---
sidebar_position: 1
title: Installation
description: Install 3DPrintForge on your server or local machine
---

# Installation

## Requirements

| Requirement | Minimum | Recommended |
|-------------|---------|-------------|
| Node.js | 22.x | 22.x LTS |
| RAM | 512 MB | 1 GB+ |
| Disk | 500 MB | 2 GB+ |
| OS | Linux, macOS, Windows | Linux (Ubuntu/Debian) |

:::warning Node.js 22 is required
3DPrintForge uses SQLite (innebygd) which is built into Node.js 22. Older versions are not supported.
:::

## Installation with install.sh (recommended)

The easiest way is to use the interactive installation script:

```bash
git clone https://github.com/skynett81/3dprintforge.git
cd 3dprintforge
./install.sh
```

The script guides you through setup in the browser. For terminal-based installation with systemd support:

```bash
./install.sh --cli
```

## Manual installation

```bash
# 1. Clone the repository
git clone https://github.com/skynett81/3dprintforge.git
cd 3dprintforge

# 2. Install dependencies
npm install

# 3. Start the dashboard
npm start
```

Open your browser at `https://localhost:3443` (or `http://localhost:3000` which redirects).

:::info Self-signed SSL certificate
On first startup the dashboard generates a self-signed SSL certificate. The browser will show a warning — this is normal. See [HTTPS certificates](./setup#https-sertifikater) to install your own certificate.
:::

## Docker

```bash
docker-compose up -d
```

See [Docker setup](../advanced/docker) for full configuration.

## Systemd service

To run the dashboard as a background service:

```bash
./install.sh --cli
# Choose "Yes" when asked about the systemd service
```

Or manually:

```bash
sudo systemctl enable --now 3dprintforge
sudo systemctl status 3dprintforge
```

## Updating

3DPrintForge has built-in auto-update via GitHub Releases. You can update from the dashboard under **Settings → Update**, or manually:

```bash
git pull
npm install
npm start
```

## Uninstallation

```bash
./uninstall.sh
```

The script removes the service, configuration, and data (you choose what gets deleted).

### Data directories

3DPrintForge automatically creates these directories in `data/`:

| Directory | Contents | Backup |
|-----------|----------|--------|
| `uploads/` | Slicer uploads | Recommended |
| `library/` | File library (3MF/STL/gcode) | Recommended |
| `model-cache/` | Cached 3MF from printers | Optional (regenerated) |
| `history-models/` | 3MF files linked to history | Recommended |
| `toolpath-cache/` | Cached gcode toolpath | Optional (regenerated) |
