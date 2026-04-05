---
sidebar_position: 5
title: Printer Controls
description: Control temperature, speed, fans, and send G-code directly to the printer
---

# Printer Controls

The control panel gives you full manual control over the printer directly from the dashboard.

## Temperature control

### Nozzle
- Set target temperature between 0–350 °C
- Click **Set** to send the command
- Real-time reading displayed with animated ring gauge

### Heated bed
- Set target temperature between 0–120 °C
- Automatic shutoff after print (configurable)

### Chamber (X1C and P1S only)
- View chamber temperature (passive — not controllable)

:::warning Maximum temperatures
Do not exceed recommended temperatures for nozzle and bed. For hardened steel nozzle (HF type): max 300 °C. For brass: max 260 °C. See the printer manual.
:::

## Speed profiles

The speed control provides four preset profiles:

| Profile | Speed | Use case |
|---------|-------|----------|
| Silent | 50% | Noise reduction, night printing |
| Standard | 100% | Normal use |
| Sport | 124% | Faster prints |
| Turbo | 166% | Maximum speed (quality reduction) |

The slider lets you set a custom percentage between 50–200%.

## Fan control

Control fan speeds manually:

| Fan | Description | Range |
|-----|-------------|-------|
| Part cooling fan | Cools the printed object | 0–100% |
| Auxiliary fan | Chamber circulation | 0–100% |
| Chamber fan | Active chamber cooling | 0–100% |

:::tip Good settings
- **PLA/PETG:** Part cooling 100%, aux 30%
- **ABS/ASA:** Part cooling 0–20%, chamber fan off
- **TPU:** Part cooling 50%, low speed
:::

## G-code console

Send G-code commands directly to the printer:

```gcode
; Example: Move head position
G28 ; Home all axes
G1 X150 Y150 Z10 F3000 ; Move to center
M104 S220 ; Set nozzle temperature
M140 S60  ; Set bed temperature
```

:::danger Be careful with G-code
Incorrect G-code can damage the printer. Only send commands you understand. Avoid `M600` (filament change) in the middle of a print.
:::

## Filament operations

From the control panel you can:

- **Load filament** — heats up the nozzle and feeds filament
- **Unload filament** — heats up and retracts filament
- **Purge nozzle** — run a purge cycle

## Macros

Save and run sequences of G-code commands as macros:

1. Click **New macro**
2. Give the macro a name
3. Write the G-code sequence
4. Save and run with one click

Example macro for bed calibration:
```gcode
G28
M84
M500
```

## Print control

During an active print you can:

- **Pause** — pauses the print after the current layer
- **Resume** — continues a paused print
- **Stop** — cancels the print (not reversible)
- **Emergency stop** — immediate stop of all motors

## Bambu Lab controls

Bambu Lab printers expose additional control cards via 40+ MQTT commands:

### Calibration UI

Run calibration routines directly from the dashboard:
- **Auto-level** — full bed mesh calibration
- **Vibration compensation** — input shaping calibration
- **Flow calibration** — extrusion multiplier tuning
- **Motor noise cancellation** — stepper motor tuning

### Camera controls

- **Toggle camera light** — turn the chamber LED on/off
- **Recording** — start/stop timelapse recording
- **Resolution** — switch between available resolutions

### AMS drying

- Start and stop AMS drying cycles per slot
- Set target temperature and duration
- Monitor drying progress in real time

### HMS error system

- **HMS (Health Management System)** — real-time error codes from the printer
- Severity levels with descriptions and suggested fixes
- Error history log for diagnostics

### System cards

- **LED control** — chamber light brightness
- **Nozzle type** — report installed nozzle to the printer
- **Print speed** — override speed factor during print
- **Firmware info** — view current firmware version

## Snapmaker U1 controls

The Snapmaker U1 has deep integration with the following control panels:

### NFC filament

- Automatic filament recognition via NFC reader
- Material type, colour and temperature settings read from the spool tag
- Linked to filament inventory for tracking

### AI defect detection

- Real-time defect monitoring during printing
- Automatic pause on detected failures (spaghetti, layer shift, adhesion)
- Sensitivity level configuration
- Event log with captured images

### Timelapse

- Built-in timelapse recording
- Configurable interval and resolution
- Download timelapse videos from the dashboard

### Print configuration

- Per-print settings for speed, temperature and support
- Profile management for different materials
- Save and recall configuration presets

### Calibration

- Bed levelling (manual and auto)
- Z-offset calibration
- Extrusion calibration
- First-layer calibration assist

### Purifier control

- Start/stop the built-in air purifier
- Fan speed control
- Filter life monitoring with replacement alerts

### Power monitor

- Real-time power consumption in watts
- Per-print energy usage tracking
- Cost calculation integration
