---
sidebar_position: 1
title: Your first print
description: Step-by-step guide for starting your first 3D print and monitoring it in 3DPrintForge
---

# Your first print

This guide walks you through the entire process — from a connected printer to a finished print — with 3DPrintForge as your control center.

## Step 1 — Check that the printer is connected

When you open the dashboard, you see the status card for your printer at the top of the sidebar or on the overview panel.

**Green status** means the printer is online and ready.

| Status | Color | Meaning |
|--------|-------|---------|
| Online | Green | Ready to print |
| Idle | Gray | Connected, but not active |
| Printing | Blue | Print in progress |
| Error | Red | Requires attention |

If the printer shows red status:
1. Check that the printer is powered on
2. Verify that it is connected to the same network as the dashboard
3. Go to **Settings → Printers** and confirm the IP address and access code

:::tip Use LAN mode for faster response
LAN mode provides lower latency than cloud mode. Enable it under printer settings if the printer and dashboard are on the same network.
:::

## Step 2 — Upload your model

3DPrintForge does not start prints directly — that is Bambu Studio's or MakerWorld's job. The dashboard takes over as soon as the print begins.

**Via Bambu Studio:**
1. Open Bambu Studio on your PC
2. Import or open your `.stl` or `.3mf` file
3. Slice the model (select filament, supports, infill, etc.)
4. Click **Print** in the top right corner

**Via MakerWorld:**
1. Find the model on [makerworld.com](https://makerworld.com)
2. Click **Print** directly from the website
3. Bambu Studio opens automatically with the model ready

## Step 3 — Start the print

In Bambu Studio, select the send method:

| Method | Requirements | Benefits |
|--------|-------------|---------|
| **Cloud** | Bambu account + internet | Works from anywhere |
| **LAN** | Same network | Faster, no cloud |
| **SD card** | Physical access | No network required |

Click **Send** — the printer receives the job and automatically begins the heating phase.

:::info The print appears in the dashboard
Within a few seconds of Bambu Studio sending the job, the active print is displayed in the dashboard under **Active Print**.
:::

## Step 4 — Monitor in the dashboard

Once the print is running, the dashboard gives you a complete overview:

### Progress
- Percentage complete and estimated time remaining are shown on the printer card
- Click the card for a detail view with layer information

### Temperatures
The detail panel shows real-time temperatures:
- **Nozzle** — current and target temperature
- **Build plate** — current and target temperature
- **Chamber** — air temperature inside the printer (important for ABS/ASA)

### Camera
Click the camera icon on the printer card to see a live feed directly in the dashboard. You can keep the camera open in a separate window while doing other things.

:::warning Check the first layers
The first 3–5 layers are critical. Poor adhesion now means a failed print later. Watch the camera and verify that the filament is laying down neatly and evenly.
:::

### 3D model viewer
- **3D model viewer** — see an interactive 3D preview of the model during printing

### Print Guard
3DPrintForge has an AI-powered **Print Guard** that automatically detects spaghetti failures and can pause the print. Enable it under **Monitoring → Print Guard**.

## Step 5 — After the print is finished

When the print is done, the dashboard shows a completion message (and sends a notification if you have set up [alerts](./notification-setup)).

### Check the history
Go to **History** in the sidebar to view the completed print:
- Total print time
- Filament consumption (grams used, estimated cost)
- Errors or HMS events during the print
- Camera image from completion (if enabled)

### Log a note
Click on the print in the history and add a note — for example "Needed a bit more brim" or "Perfect result". This is useful when you print the same model again later.

### Check filament consumption
Under **Filament** you can see that the spool weight has been updated based on what was used. The dashboard deducts it automatically.

## Tips for beginners

:::tip Don't leave your first print unattended
Keep an eye on the first 10–15 minutes. Once you are confident that the print is adhering well, you can let the dashboard monitor the rest.
:::

- **Weigh empty spools** — enter the starting weight on spools for accurate remaining estimates (see [Filament Inventory](./filament-setup))
- **Set up Telegram notifications** — get notified when the print is done without having to wait around (see [Notifications](./notification-setup))
- **Check the build plate** — clean plate = better adhesion. Wipe with IPA (isopropyl alcohol) between prints
- **Use the right plate** — see [Choosing the right build plate](./choosing-plate) for what suits your filament
