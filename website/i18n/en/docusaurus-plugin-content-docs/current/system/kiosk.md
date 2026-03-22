---
sidebar_position: 6
title: Kiosk Mode
description: Set up Bambu Dashboard as a wall-mounted display or hub view with kiosk mode and automatic rotation
---

# Kiosk Mode

Kiosk mode is designed for wall-mounted displays, TVs, or dedicated monitors that continuously show printer status — without keyboard, mouse interaction, or browser UI.

Go to: **https://localhost:3443/#settings** → **System → Kiosk**

## What is kiosk mode

In kiosk mode:
- Navigation menu is hidden
- No interactive controls are visible
- Dashboard updates automatically
- Screen rotates between printers (if configured)
- Inactivity timeout is disabled

## Enabling kiosk mode via URL

Add `?kiosk=true` to the URL to enable kiosk mode without changing settings:

```
https://localhost:3443/?kiosk=true
https://localhost:3443/#fleet?kiosk=true
```

Kiosk mode is disabled by removing the parameter or adding `?kiosk=false`.

## Kiosk settings

1. Go to **Settings → System → Kiosk**
2. Configure:

| Setting | Default | Description |
|---|---|---|
| Default view | Fleet overview | Which page is displayed |
| Rotation interval | 30 seconds | Time per printer in rotation |
| Rotation mode | Active only | Rotate only between printers that are active |
| Theme | Dark | Recommended for displays |
| Font size | Large | Readable from a distance |
| Clock display | Off | Show clock in corner |

## Fleet view for kiosk

The fleet overview is optimized for kiosk:

```
https://localhost:3443/#fleet?kiosk=true&cols=3&size=large
```

Parameters for fleet view:
- `cols=N` — number of columns (1–6)
- `size=small|medium|large` — card size

## Single-printer rotation

For rotation between single printers (one printer at a time):

```
https://localhost:3443/?kiosk=true&rotate=true&interval=20
```

- `rotate=true` — enable rotation
- `interval=N` — seconds per printer

## Setup on Raspberry Pi / NUC

For dedicated kiosk hardware:

### Chromium in kiosk mode (Linux)

```bash
chromium-browser \
  --kiosk \
  --noerrdialogs \
  --disable-infobars \
  --no-first-run \
  --app="https://localhost:3443/?kiosk=true"
```

Add the command to autostart (`~/.config/autostart/bambu-kiosk.desktop`).

### Automatic login and startup

1. Configure automatic login in the operating system
2. Create an autostart entry for Chromium
3. Disable screensaver and power saving:
   ```bash
   xset s off
   xset -dpms
   xset s noblank
   ```

:::tip Dedicated user account
Create a dedicated Bambu Dashboard user account with the **Guest** role for the kiosk device. This gives the device read-only access and it cannot change settings even if someone gains access to the screen.
:::

## Hub settings

Hub mode shows an overview page with all printers and key statistics — designed for large TVs:

```
https://localhost:3443/#hub?kiosk=true
```

Hub view includes:
- Printer grid with status
- Aggregated key metrics (active prints, total progress)
- Clock and date
- Latest HMS alerts
