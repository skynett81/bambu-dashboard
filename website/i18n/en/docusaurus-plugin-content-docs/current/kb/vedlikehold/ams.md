---
sidebar_position: 3
title: AMS Maintenance
description: Maintenance of AMS — PTFE tubes, filament path, and moisture prevention
---

# AMS Maintenance

AMS (Automatic Material System) is a precision system that requires regular maintenance to work reliably. The most common problems are a dirty filament path and moisture in the housing.

## PTFE tubes

PTFE tubes transport filament from the AMS to the printer. They are among the first parts to wear out.

### Inspection
Check PTFE tubes for:
- **Kinks or bends** — impedes filament flow
- **Wear at connections** — white dust around the inlets
- **Shape deformation** — especially with CF materials

### Replacing PTFE tubes
1. Release filament from AMS (run unload cycle)
2. Press in the blue locking ring around the tube at the fitting
3. Pull out the tube (requires a firm grip)
4. Cut new tube to the correct length (not shorter than the original)
5. Push in until it stops and lock

:::tip AMS Lite vs. AMS
AMS Lite (A1/A1 Mini) has a simpler PTFE configuration than full AMS (P1S/X1C). The tubes are shorter and easier to replace.
:::

## Filament path

### Cleaning the filament path
Filaments leave dust and residue in the filament path, especially CF materials:

1. Unload all slots
2. Use compressed air or a soft brush to blow out loose dust
3. Run a piece of clean nylon or PTFE cleaning filament through the path

### Sensors
AMS uses sensors to detect filament position and filament breaks. Keep sensor windows clean:
- Gently wipe sensor lenses with a clean brush
- Avoid IPA directly on sensors

## Moisture

AMS does not protect filament from moisture. For hygroscopic materials (PA, PETG, TPU) the following is recommended:

### Dry AMS alternatives
- **Sealed box:** Place spools in an airtight box with silica gel
- **Bambu Dry Box:** Official drying box accessory
- **External feeder:** Use a filament feeder outside the AMS for sensitive materials

### Moisture indicators
Place humidity indicator cards (hygrometer) inside the AMS housing. Replace silica gel pouches when above 30% relative humidity.

## Drive wheels and clamping mechanism

### Inspection
Check the drive wheels (extruder wheels in AMS) for:
- Filament residue between teeth
- Wear on gear teeth
- Uneven friction when pulling manually

### Cleaning
1. Use a toothbrush or brush to remove residue between the drive wheel teeth
2. Blow with compressed air
3. Avoid oil and lubricant — the grip level is calibrated for dry operation

## Maintenance intervals

| Activity | Interval |
|-----------|---------|
| Visual inspection of PTFE tubes | Monthly |
| Cleaning filament path | Every 100 hours |
| Check sensors | Monthly |
| Replace silica gel (dry setup) | As needed (at 30%+ RH) |
| Replace PTFE tubes | When visible wear is present |
