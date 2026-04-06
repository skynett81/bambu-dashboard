---
sidebar_position: 3
title: Settings
description: Complete overview of all settings in 3DPrintForge — printer, notifications, theme, OBS, energy, webhooks, and more
---

# Settings

All settings in 3DPrintForge are gathered on one page with clear categories. Here is an overview of what is available in each category.

Go to: **https://localhost:3443/#settings**

## Printers

Manage registered printers:

| Setting | Description |
|---|---|
| Add printer | Register a new printer with serial number and access key |
| Printer name | Custom display name |
| Printer model | X1C / X1C Combo / X1E / P1S / P1S Combo / P1P / P2S / P2S Combo / A1 / A1 Combo / A1 mini / H2S / H2D / H2C |
| MQTT connection | Bambu Cloud MQTT or local MQTT |
| Access key | LAN Access Code from the Bambu Lab app |
| IP address | For local (LAN) mode |
| Camera settings | Enable/disable, resolution |

See [Getting Started](../getting-started/setup) for step-by-step setup of your first printer.

## Notifications

See full documentation in [Notifications](../features/notifications).

Quick overview:
- Enable/disable notification channels (Telegram, Discord, email, etc.)
- Per-channel event filter
- Quiet hours (time range without notifications)
- Test button per channel

## Theme

See full documentation in [Theme](./themes).

- Light / Dark / Auto mode
- 6 color palettes
- Custom accent color
- Roundness and density

## OBS overlay

Configuration for OBS overlay:

| Setting | Description |
|---|---|
| Default theme | dark / light / minimal |
| Default position | Corner for overlay |
| Default scale | Scaling (0.5–2.0) |
| Show QR code | Show QR code to dashboard in overlay |

See [OBS Overlay](../features/obs-overlay) for full URL syntax and setup.

## Energy and power

| Setting | Description |
|---|---|
| Tibber API Token | Access to Tibber spot prices |
| Nordpool price area | Select Norwegian price region |
| Grid fee (per kWh) | Your grid tariff |
| Printer power (W) | Configure power consumption per printer model |

## Home Assistant

| Setting | Description |
|---|---|
| MQTT broker | IP, port, username, password |
| Discovery prefix | Default: `homeassistant` |
| Enable discovery | Publish devices to HA |

## Webhooks

Global webhook settings:

| Setting | Description |
|---|---|
| Webhook URL | Recipient URL for events |
| Secret key | HMAC-SHA256 signature |
| Event filter | Which events are sent |
| Retry attempts | Number of attempts on failure (default: 3) |
| Timeout | Seconds before request gives up (default: 10) |

## Queue settings

| Setting | Description |
|---|---|
| Automatic dispatch | Enable/disable |
| Dispatch strategy | First available / Least used / Round-robin |
| Require confirmation | Manual approval before sending |
| Staggered start | Delay between printers in queue |

## Security

| Setting | Description |
|---|---|
| Session duration | Hours/days before automatic logout |
| Force 2FA | Require 2FA for all users |
| IP whitelist | Restrict access to specific IP addresses |
| HTTPS certificate | Upload custom certificate |

## System

| Setting | Description |
|---|---|
| Server port | Default: 3443 |
| Log format | JSON / Text |
| Log level | Error / Warn / Info / Debug |
| Database cleanup | Automatic deletion of old history |
| Updates | Check for new versions |

### Server Management

Located in **Settings → System → Updates** tab:

| Action | Description |
|---|---|
| Restart Server | Sends `POST /api/server/restart` and auto-reconnects when the server is back online |
| Clear Browser Cache | Unregisters the service worker, clears all browser caches, and calls the server clear-cache endpoint |
| Unregister Service Worker | Removes the service worker — fixes stale cache issues after updates |

## 3D Viewing

| Setting | Description |
|---|---|
| 3D Viewing | Three.js renderer, toolpath colours, model cache |
