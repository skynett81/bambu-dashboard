---
sidebar_position: 3
title: Diagnostics
description: Health score, telemetry graphs, bed mesh visualization, and component monitoring for Bambu Lab printers
---

# Diagnostics

The Diagnostics page gives you an in-depth overview of your printer's health, performance, and condition over time.

Go to: **https://localhost:3443/#diagnostics**

## Health score

Each printer calculates a **health score** from 0–100 based on:

| Factor | Weight | Description |
|---|---|---|
| Success rate (30d) | 30% | Proportion of successful prints in the last 30 days |
| Component wear | 25% | Average wear on critical components |
| HMS errors (30d) | 20% | Number and severity of errors |
| Calibration status | 15% | Time since last calibration |
| Temperature stability | 10% | Deviation from target temperature during printing |

**Score interpretation:**
- 🟢 80–100 — Excellent condition
- 🟡 60–79 — Good, but some things should be checked
- 🟠 40–59 — Reduced performance, maintenance recommended
- 🔴 0–39 — Critical, maintenance required

:::tip History
Click the health graph to see the score's development over time. Large drops may indicate a specific event.
:::

## Telemetry graphs

The telemetry page shows interactive graphs for all sensor values:

### Available datasets

- **Nozzle temperature** — actual vs. target
- **Bed temperature** — actual vs. target
- **Chamber temperature** — ambient temperature inside the machine
- **Extruder motor** — current draw and temperature
- **Fan speeds** — toolhead, chamber, AMS
- **Pressure** (X1C) — chamber pressure for AMS
- **Acceleration** — vibration data (ADXL345)

### Navigating the graphs

1. Select **Time period**: Last hour / 24 hours / 7 days / 30 days / Custom
2. Select **Printer** from the dropdown
3. Select **Dataset** to display (multiple selection supported)
4. Scroll to zoom in on the timeline
5. Click and drag to pan
6. Double-click to reset zoom

### Exporting telemetry data

1. Click **Export** on the graph
2. Select format: **CSV**, **JSON**, or **PNG** (image)
3. The selected time period and dataset are exported

## Bed Mesh

The bed mesh visualization shows the flatness calibration of the build plate:

1. Go to **Diagnostics → Bed Mesh**
2. Select printer
3. The latest mesh is displayed as a 3D surface and heatmap:
   - **Blue** — lower than center (concave)
   - **Green** — approximately flat
   - **Red** — higher than center (convex)
4. Hover over a point to see the exact deviation in mm

### Scan bed mesh from UI

1. Click **Scan now** (requires the printer to be idle)
2. Confirm in the dialog — the printer starts automatic calibration
3. Wait until the scan is complete (approx. 3–5 minutes)
4. The new mesh is displayed automatically

:::warning Heat up first
Bed mesh should be scanned with a heated bed (50–60°C for PLA) for accurate calibration.
:::

## Component wear

See [Wear Prediction](./wearprediction) for detailed documentation.

The Diagnostics page shows a condensed overview:
- Percentage score per component
- Next recommended maintenance
- Click **Details** for full wear analysis
