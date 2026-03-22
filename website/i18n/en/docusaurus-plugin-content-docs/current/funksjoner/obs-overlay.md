---
sidebar_position: 4
title: OBS Overlay
description: Add a transparent status overlay for your Bambu Lab printer directly in OBS Studio
---

# OBS Overlay

The OBS overlay lets you display your printer's real-time status directly in OBS Studio — perfect for livestreaming or recording 3D printing.

## Overlay URL

The overlay is available as a web page with a transparent background:

```
https://localhost:3443/obs-overlay?printer=PRINTER_ID
```

Replace `PRINTER_ID` with your printer's ID (found under **Settings → Printers**).

### Available parameters

| Parameter | Default | Description |
|---|---|---|
| `printer` | first printer | Printer ID to display |
| `theme` | `dark` | `dark`, `light`, or `minimal` |
| `scale` | `1.0` | Scaling (0.5–2.0) |
| `position` | `bottom-left` | `top-left`, `top-right`, `bottom-left`, `bottom-right` |
| `opacity` | `0.9` | Transparency (0.0–1.0) |
| `fields` | all | Comma-separated list: `progress,temp,ams,time` |
| `color` | `#00d4ff` | Accent color (hex) |

**Example with parameters:**
```
https://localhost:3443/obs-overlay?printer=abc123&theme=minimal&scale=1.2&position=top-right&fields=progress,time
```

## Setup in OBS Studio

### Step 1: Add a browser source

1. Open OBS Studio
2. Click **+** under **Sources**
3. Select **Browser** (Browser Source)
4. Give the source a name, e.g. `Bambu Overlay`
5. Click **OK**

### Step 2: Configure the browser source

Fill in the following in the settings dialog:

| Field | Value |
|---|---|
| URL | `https://localhost:3443/obs-overlay?printer=YOUR_ID` |
| Width | `400` |
| Height | `200` |
| FPS | `30` |
| Custom CSS | *(leave blank)* |

Check:
- ✅ **Shutdown source when not visible**
- ✅ **Refresh browser when scene becomes active**

:::warning HTTPS and localhost
OBS may warn about a self-signed certificate. Go to `https://localhost:3443` in Chrome/Firefox first and accept the certificate. OBS will then use the same approval.
:::

### Step 3: Transparent background

The overlay is built with `background: transparent`. For this to work in OBS:

1. Do **not** check **Custom background color** in the browser source
2. Make sure the overlay is not wrapped in an opaque element
3. Set the **Blend Mode** to **Normal** on the source in OBS

:::tip Alternative: Chroma key
If transparency doesn't work, use filter → **Chroma Key** with a green background:
Add `&bg=green` to the URL, and apply a chroma key filter on the source in OBS.
:::

## What the overlay shows

The default overlay includes:

- **Progress bar** with percentage value
- **Remaining time** (estimated)
- **Nozzle temperature** and **bed temperature**
- **Active AMS slot** with filament color and name
- **Printer model** and name (can be disabled)

## Minimal mode for streaming

For a subtle overlay during streaming:

```
https://localhost:3443/obs-overlay?theme=minimal&fields=progress,time&scale=0.8&opacity=0.7
```

This shows only a small progress bar with remaining time in the corner.
