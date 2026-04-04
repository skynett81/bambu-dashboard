---
sidebar_position: 3
title: Daily use
description: A practical guide to daily use of 3DPrintForge — morning routine, monitoring, after print, and maintenance
---

# Daily use

This guide covers how to use 3DPrintForge effectively in everyday life — from when you start the day to when you turn off the lights.

## Morning routine

Open the dashboard and do a quick review of these points:

### 1. Check printer status
The overview panel shows the status of all your printers. Look for:
- **Red icons** — errors that require attention
- **Pending messages** — HMS warnings from overnight
- **Unfinished prints** — if you had a night print, is it done?

### 2. Check AMS levels
Go to **Filament** or see the AMS widget on the dashboard:
- Are any spools below 100 g? Replace or order new
- Right filament in the right slot for today's prints?

### 3. Check alerts and events
Under **Notification log** (bell icon) you can see:
- Events that happened overnight
- Errors that were logged automatically
- HMS codes that triggered an alarm

## Starting a print

### From file (Bambu Studio)
1. Open Bambu Studio
2. Load and slice the model
3. Send to printer — the dashboard updates automatically

### From the queue
If you have planned prints in advance:
1. Go to **Queue**
2. Click **Start next** or drag a job to the top
3. Confirm with **Send to printer**

See the [Print queue documentation](../features/queue) for full information on queue management.

### Scheduled print (scheduler)
To start a print at a specific time:
1. Go to **Scheduler**
2. Click **+ New job**
3. Select file, printer, and time
4. Enable **Electricity price optimization** to automatically select the cheapest hour

See [Scheduler](../features/scheduler) for details.

## Monitoring an active print

### Camera view
Click the camera icon on the printer card. You can:
- View the live feed in the dashboard
- Open in a separate tab for background monitoring
- Take a manual screenshot

### Progress information
The active print card shows:
- Percentage complete
- Estimated time remaining
- Current layer / total number of layers
- Active filament and color

### Temperatures
Real-time temperature curves are displayed in the detail panel:
- Nozzle temperature — should stay stable within ±2°C
- Plate temperature — important for good adhesion
- Chamber temperature — rises gradually, particularly relevant for ABS/ASA

### 3D model viewer
- **3D model viewer** — interactive 3D preview with Three.js, per-layer colours and gcode toolpath

### Print Guard
If **Print Guard** is enabled, the dashboard automatically monitors for spaghetti and volumetric deviations. If something is detected:
1. The print is paused
2. You receive a notification
3. The camera images are saved for post-review

## After print — check routine

### Check quality
1. Open the camera and take a look at the result while it is still on the plate
2. Go to **History → Last print** to view statistics
3. Log a note: what went well, what can be improved

### Archive
Prints in the history are never automatically archived — they just stay there. If you want to tidy up:
- Click a print → **Archive** to move it to the archive
- Use **Projects** to group related prints

### Update filament weight
If you weigh the spool for accuracy (recommended):
1. Weigh the spool
2. Go to **Filament → [The spool]**
3. Update **Remaining weight**

## Maintenance reminders

The dashboard tracks maintenance intervals automatically. Under **Maintenance** you can see:

| Task | Interval | Status |
|------|----------|--------|
| Clean nozzle | Every 50 hours | Checked automatically |
| Lubricate rods | Every 200 hours | Tracked in the dashboard |
| Calibrate plate | After plate change | Manual reminder |
| Clean AMS | Monthly | Calendar notification |

Enable maintenance alerts under **Monitoring → Maintenance → Alerts**.

:::tip Set up a weekly maintenance day
A fixed maintenance day each week (e.g. Sunday evening) saves you from unnecessary downtime. Use the reminder function in the dashboard.
:::

## Electricity price — best time to print

If you have connected the electricity price integration (Nordpool / Home Assistant):

1. Go to **Analytics → Electricity price**
2. View the price graph for the next 24 hours
3. The cheapest hours are marked in green

Use the **Scheduler** with **Electricity price optimization** enabled — the dashboard will then automatically start the job in the cheapest available window.

:::info Typical cheapest hours
Night-time (01:00–06:00) is usually cheapest in Norway. An 8-hour print sent to the queue the evening before can save you 30–50% on electricity costs.
:::
