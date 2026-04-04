---
sidebar_position: 2
title: Main Panel
description: Real-time overview of the active printer with 3D model view, AMS status, camera, and customizable widgets
---

# Main Panel

The main panel is the central control center in 3DPrintForge. It shows real-time status for the selected printer and lets you monitor, control, and customize the view as needed.

Go to: **https://localhost:3443/**

## Real-time overview

When a printer is active, all values update continuously via MQTT:

- **Nozzle temperature** — animated SVG ring gauge with target temperature
- **Bed temperature** — equivalent ring gauge for the build plate
- **Progress percentage** — large percentage indicator with time remaining
- **Layer counter** — current layer / total number of layers
- **Speed** — Silent / Standard / Sport / Turbo with slider

:::tip Real-time updates
All values are updated directly from the printer via MQTT without reloading the page. Latency is typically under 1 second.
:::

### 3D Model Viewer

During active printing, an interactive 3D preview of the model is displayed:

- **EnhancedViewer** — Three.js-based renderer with smooth shading, 3-point lighting and build plate grid
- **Per-layer colours** — multi-colour prints show correct filament colour per layer
- **Print progress** — model is clipped at current layer with green edge glow
- **Gcode toolpath** — for Moonraker/Klipper printers, gcode is shown as coloured toolpath (blue bottom → red top)
- **3MFConsortium 3mfViewer** — for 3MF files from library, full 3D viewer with scene tree and materials
- **Orbit controls** — rotate, zoom and pan with mouse, auto-rotation during printing
- **Universal** — works for all printer types (Bambu Lab FTPS, Moonraker HTTP, local files)

## AMS status

The AMS panel shows all mounted AMS units with slots and filament:

- **Slot color** — visual color representation from Bambu metadata
- **Filament name** — material and brand
- **Active slot** — highlighted with pulse animation during printing
- **Error** — red indicator on AMS errors (clog, empty, moisture)

Click on a slot to see full filament info and link it to the filament inventory.

## Camera feed

Live camera view is converted via ffmpeg (RTSPS → MPEG1):

1. The camera starts automatically when you open the dashboard
2. Click on the camera image to open full screen
3. Use the **Snapshot** button to take a still image
4. Click **Hide camera** to free up space

:::warning Performance
Camera stream uses approximately 2–5 Mbit/s. Disable the camera on slow network connections.
:::

## Temperature sparklines

Below the AMS panel, mini-graphs (sparklines) show the last 30 minutes:

- Nozzle temperature over time
- Bed temperature over time
- Chamber temperature (where available)

Click on a sparkline to open the full telemetry graph view.

## Widget customization

The dashboard uses a drag-and-drop grid layout:

1. Click **Customize layout** (pencil icon in the top right)
2. Drag widgets to the desired position
3. Resize by dragging the corner
4. Click **Lock layout** to freeze the positions
5. Click **Save** to preserve the layout

Available widgets:
| Widget | Description |
|--------|-------------|
| Camera | Live camera view |
| AMS | Spool and filament status |
| Temperature | Ring gauges for nozzle and bed |
| Progress | Percentage indicator and time estimate |
| Telemetry | Fans, pressure, speed |
| 3D model | Interactive model view |
| Sparklines | Mini temperature graphs |

:::tip Saving
The layout is saved per user in the browser (localStorage). Different users can have different layouts.
:::
