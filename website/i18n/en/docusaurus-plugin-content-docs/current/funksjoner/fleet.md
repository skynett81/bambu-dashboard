---
sidebar_position: 3
title: Fleet Overview
description: Manage and monitor all Bambu Lab printers in one grid with sorting, filtering, and real-time status
---

# Fleet Overview

The Fleet Overview gives you a compact view of all connected printers on one page. Perfect for workshops, classrooms, or anyone with more than one printer.

Go to: **https://localhost:3443/#fleet**

## Multi-printer grid

All registered printers are displayed in a responsive grid:

- **Card size** — Small (compact), Medium (standard), Large (detailed)
- **Number of columns** — Adapts automatically to screen width, or set manually
- **Updates** — Each card updates independently via MQTT

Each printer card shows:
| Field | Description |
|---|---|
| Printer name | Configured name with model icon |
| Status | Idle / Printing / Paused / Error / Offline |
| Progress | Percentage bar with remaining time |
| Temperature | Nozzle and bed (compact) |
| Active filament | Color and material from AMS |
| Camera thumbnail | Still image updated every 30 seconds |

## Status indicator per printer

Status colors make it easy to see the state at a glance:

- **Green pulse** — Actively printing
- **Blue** — Idle and ready
- **Yellow** — Paused (manually or by Print Guard)
- **Red** — Error detected
**Gray** — Offline or unreachable

:::tip Kiosk mode
Use the fleet overview in kiosk mode on a wall-mounted display. See [Kiosk Mode](../system/kiosk) for setup.
:::

## Sorting

Click **Sort** to choose the order:

1. **Name** — Alphabetical A–Z
2. **Status** — Active printers first
3. **Progress** — Most complete first
4. **Last active** — Most recently used first
5. **Model** — Grouped by printer model

The sort order is remembered until your next visit.

## Filtering

Use the filter field at the top to narrow the view:

- Type a printer name or part of a name
- Select **Status** from the dropdown (All / Printing / Idle / Error)
- Select **Model** to show only one printer type (X1C, P1S, A1, etc.)
- Click **Clear filter** to show all

:::info Search
Search filters in real time without reloading the page.
:::

## Actions from the fleet overview

Right-click a card (or click the three dots) for quick actions:

- **Open dashboard** — Go directly to the printer's main panel
- **Pause print** — Pauses the printer
- **Stop print** — Cancels the ongoing print (requires confirmation)
- **View camera** — Opens camera view in a popup
- **Go to settings** — Opens printer settings

:::danger Stop print
Stopping a print is not reversible. Always confirm in the dialog that appears.
:::

## Aggregated statistics

At the top of the fleet overview, a summary row shows:

- Total number of printers
- Number of active prints
- Total filament consumption today
- Estimated completion time for the longest ongoing print
