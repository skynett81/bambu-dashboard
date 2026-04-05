---
sidebar_position: 1
title: Features Overview
description: Complete overview of all features in 3DPrintForge
---

# Features Overview

3DPrintForge brings everything you need to monitor and control your 3D printers together in one place — supporting Bambu Lab, Prusa, Snapmaker, and all Klipper/Moonraker-based printers.

## Dashboard

The main dashboard shows real-time status for the active printer:

- **Temperature** — animated SVG ring gauges for nozzle and bed
- **Progress** — percentage progress with estimated finish time
- **Camera** — live camera view (RTSPS → MPEG1 via ffmpeg)
- **AMS panel** — visual representation of all AMS slots with filament color
- **Speed control** — slider to adjust speed (Silent, Standard, Sport, Turbo)
- **Statistics panels** — Grafana-style panels with scrolling graphs
- **Telemetry** — live values for fans, temperatures, pressure

Panels can be dragged and dropped to customize the layout. Use the lock button to lock the layout.

## Filament inventory

See [Filament](./filament) for full documentation.

- Track all spools with name, color, weight, and vendor
- AMS synchronization — see which spools are loaded in the AMS
- Drying log and drying schedule
- Color card and NFC tag support
- Import/export (CSV)

## Print history

See [History](./history) for full documentation.

- Complete log of all prints
- Filament tracking per print
- Links to MakerWorld models
- Statistics and export to CSV
- 3D preview with 3mfViewer (3MF) or gcode toolpath, with option to upload 3MF files

## Scheduler

See [Scheduler](./scheduler) for full documentation.

- Calendar view of prints
- Print queue with prioritization
- Multi-printer dispatch

## Model Forge

See [Model Forge](../tools/model-forge) for full documentation.

- 8 parametric design tools built into the dashboard
- **Sign Maker** — custom text signs with fonts, borders and mounting holes
- **Lithophane** — convert images to 3D-printable lithophanes
- **Storage Box** — parametric storage boxes with dividers and lids
- **Text Plate** — engraved or embossed text plates and name tags
- **Keychain** — custom keychains with text and shapes
- **Cable Label** — cable management labels with clip-on design
- **Image Relief** — convert images to raised 3D relief models
- **Stencil** — generate stencils from images or text for spray painting

## Printer control

See [Controls](./controls) for full documentation.

- Temperature control (nozzle, bed, chamber)
- Speed profile control
- Fan control
- G-code console
- Filament load/unload
- Bambu Lab: calibration UI, camera controls, AMS drying, HMS error system
- Snapmaker U1: NFC filament, AI defect detection, timelapse, calibration, purifier, power monitor

## G-code tools

- **G-code Analyzer** — parse G-code files for estimated print time, filament usage, layer count, materials and more
- **3D Toolpath Viewer** — interactive 3D visualisation of G-code toolpaths with per-layer colouring

## Remote access

Secure remote access via Cloudflare Tunnel, configured under **Settings > System > Remote Access**. Access your dashboard from anywhere without port forwarding or VPN.

## Notifications

3DPrintForge supports 7 notification channels:

| Channel | Events |
|---------|--------|
| Telegram | Print complete, error, pause |
| Discord | Print complete, error, pause |
| Email | Print complete, error |
| ntfy | All events |
| Pushover | All events |
| SMS (Twilio) | Critical errors |
| Webhook | Custom payload |

Configure under **Settings → Notifications**.

## Print Guard

Print Guard monitors an active print via camera (xcam) and sensors:

- Automatic pause on spaghetti failure
- Configurable sensitivity level
- Log of detected events

## Maintenance

The maintenance section tracks:

- Next recommended service per component (nozzle, plates, AMS)
- Wear tracking based on print history
- Manual registration of maintenance tasks

## Multi-printer, multi-brand

With multi-printer support you can:

- Manage multiple printers from one dashboard
- Switch between printers with the printer selector
- View status overview for all printers simultaneously
- Distribute print jobs with the print queue
- Connect Bambu Lab (MQTT), Prusa (PrusaLink), Snapmaker (SACP/Moonraker), and all Klipper/Moonraker printers
- Supported brands: Bambu Lab, Prusa, Snapmaker, Voron, Creality, Elegoo, AnkerMake, QIDI, RatRig, Sovol and more

## PWA support

3DPrintForge is an installable Progressive Web App:

- Install on desktop or mobile from the browser
- Push notifications for print events (complete, error, pause)
- Works offline for cached pages

## OBS overlay

A dedicated `obs.html` page provides a clean overlay for OBS Studio integration when livestreaming prints.

## Updates

Built-in auto-update via GitHub Releases. Notification and update directly from the dashboard under **Settings → Update**.
