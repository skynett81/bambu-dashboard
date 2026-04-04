---
sidebar_position: 6
title: Multiple printers
description: Set up and manage multiple Bambu printers in 3DPrintForge — fleet overview, queue, and staggered start
---

# Multiple printers

Have more than one printer? 3DPrintForge is built for fleet management — you can monitor, control, and coordinate all your printers from one place.

## Adding a new printer

1. Go to **Settings → Printers**
2. Click **+ Add printer**
3. Fill in:

| Field | Example | Explanation |
|-------|---------|-------------|
| Device serial number (SN) | 01P... | Found in Bambu Handy or on the printer's screen |
| IP address | 192.168.1.101 | For LAN mode (recommended) |
| Access code | 12345678 | 8-digit code on the printer's screen |
| Name | "Bambu #2 - P1S" | Displayed in the dashboard |
| Model | P1P, P1S, X1C, A1 | Select the correct model for the right icons and features |

4. Click **Test connection** — you should see green status
5. Click **Save**

:::info Printer capabilities
3DPrintForge automatically uses the correct configuration per printer brand and model. Bambu Lab printers use FTPS for file access, while Moonraker/Klipper printers use HTTP API. See [Architecture](../advanced/architecture) for details.
:::

:::tip Give printers descriptive names
"Bambu 1" and "Bambu 2" are confusing. Use names like "X1C - Production" and "P1S - Prototypes" to keep track.
:::

## The fleet overview

After all printers are added, they are displayed together in the **Fleet** panel. Here you can see:

```
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│ X1C - Production│  │ P1S - Prototypes│  │ A1 - Hobby room │
│ ████████░░ 82%  │  │ Idle            │  │ ████░░░░░░ 38%  │
│ 1h 24m left     │  │ Ready to print  │  │ 3h 12m left     │
│ Temp: 220/60°C  │  │ AMS: 4 spools   │  │ Temp: 235/80°C  │
└─────────────────┘  └─────────────────┘  └─────────────────┘
```

You can:
- Click on a printer for full detail view
- See all temperatures, AMS status, and active errors at a glance
- Filter by status (active prints, idle, errors)

## Print queue — distributing work

The print queue lets you plan prints for all printers from one place.

**How it works:**
1. Go to **Queue**
2. Click **+ Add job**
3. Select file and settings
4. Select printer, or choose **Automatic assignment**

### Automatic assignment
With automatic assignment, the dashboard selects a printer based on:
- Available capacity
- Filament available in AMS
- Scheduled maintenance windows

Enable under **Settings → Queue → Automatic assignment**.

### Prioritization
Drag and drop jobs in the queue to change the order. A job with **High priority** jumps ahead of regular jobs.

## Staggered start — avoiding power spikes

If you start many printers at the same time, the heating phase can cause a significant power spike. Staggered start distributes the startup:

**How to enable it:**
1. Go to **Settings → Fleet → Staggered start**
2. Enable **Distributed startup**
3. Set delay between printers (recommended: 2–5 minutes)

**Example with 3 printers and a 3-minute delay:**
```
08:00 — Printer 1 starts heating
08:03 — Printer 2 starts heating
08:06 — Printer 3 starts heating
```

:::tip Relevant for circuit breaker size
An X1C draws approximately 1000W during heating. Three printers simultaneously = 3000W, which can trip a 16A breaker. Staggered start eliminates the problem.
:::

## Printer groups

Printer groups let you organize printers logically and send commands to the entire group:

**Creating a group:**
1. Go to **Settings → Printer groups**
2. Click **+ New group**
3. Give the group a name (e.g. "Production floor", "Hobby room")
4. Add printers to the group

**Group functions:**
- View combined statistics for the group
- Send a pause command to the entire group simultaneously
- Set a maintenance window for the group

## Monitoring all printers

### Multi-view camera
Go to **Fleet → Camera view** to see all camera feeds side by side:

```
┌──────────────┐  ┌──────────────┐
│  X1C Feed    │  │  P1S Feed    │
│  [Live]      │  │  [Idle]      │
└──────────────┘  └──────────────┘
┌──────────────┐  ┌──────────────┐
│  A1 Feed     │  │  + Add       │
│  [Live]      │  │              │
└──────────────┘  └──────────────┘
```

### Alerts per printer
You can configure different notification rules for different printers:
- Production printer: always alert, including at night
- Hobby printer: alert daytime only

See [Notifications](./notification-setup) for setup.

## Tips for fleet operation

- **Standardize filament slots**: Keep PLA white in slot 1, PLA black in slot 2 on all printers — job distribution becomes simpler
- **Check AMS levels daily**: See [Daily use](./daily-use) for morning routine
- **Stagger maintenance**: Don't maintain all printers at the same time — always keep at least one active
- **Name files clearly**: File names like `logo_x1c_pla_0.2mm.3mf` make it easy to choose the right printer
