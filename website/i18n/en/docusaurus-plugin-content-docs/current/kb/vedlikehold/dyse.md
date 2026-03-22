---
sidebar_position: 1
title: Nozzle Maintenance
description: Cleaning, cold pull, nozzle replacement, and nozzle types for Bambu Lab printers
---

# Nozzle Maintenance

The nozzle is one of the most critical components in the printer. Proper maintenance extends its lifespan and ensures good print results.

## Nozzle types

| Nozzle type | Materials | Estimated lifespan | Max temp |
|----------|-----------|-------------------|----------|
| Brass (standard) | PLA, PETG, ABS, TPU | 200–500 hours | 300 °C |
| Hardened steel | All including CF/GF | 300–600 hours | 300 °C |
| HS01 (Bambu) | All including CF/GF | 500–1000 hours | 300 °C |

:::danger Never use a brass nozzle with CF/GF
Carbon fiber and glass fiber filled filaments wear down brass nozzles within hours. Switch to hardened steel before printing CF/GF materials.
:::

## Cleaning

### Simple cleaning (between spools)
1. Heat the nozzle to 200–220 °C
2. Manually push filament through until it comes out clean
3. Quickly pull out the filament ("cold pull" — see below)

### IPA cleaning
For stubborn residue:
1. Heat the nozzle to 200 °C
2. Drip 1–2 drops of IPA on the nozzle end (carefully!)
3. Let the vapor dissolve residue
4. Pull fresh filament through

:::warning Be careful with IPA on a hot nozzle
IPA boils at 83 °C and vapors strongly on a hot nozzle. Use small amounts and avoid inhaling.
:::

## Cold Pull

Cold pull is the most effective method for removing contamination and carbon deposits from the nozzle.

**Step by step:**
1. Heat the nozzle to 200–220 °C
2. Manually push nylon filament (or whatever is in the nozzle) in
3. Let the nylon soak in the nozzle for 1–2 minutes
4. Lower temperature to 80–90 °C (for nylon)
5. Wait until the nozzle cools to the target
6. Pull the filament out quickly and firmly in one motion
7. Inspect the end: should have the shape of the nozzle interior — clean and without residue
8. Repeat 3–5 times until the filament pulls out clean and white

:::tip Nylon for cold pull
Nylon gives the best result for cold pulls because it adheres well to contamination. White nylon makes it easy to see if the pull is clean.
:::

## Nozzle replacement

### Signs that the nozzle should be replaced
- Blobby surfaces and poor dimensional accuracy
- Persistent extrusion problems after cleaning
- Visible wear or deformation of the nozzle hole
- Nozzle has passed its estimated lifespan

### Procedure (P1S/X1C)
1. Heat the nozzle to 200 °C
2. Release extruder motor (free the filament)
3. Use a wrench to loosen the nozzle (counter-clockwise)
4. Replace the nozzle while hot — **do not let the nozzle cool with tools on it**
5. Tighten to the desired torque (do not overtighten)
6. Run calibration after replacement

:::warning Always replace while hot
Tightening torque from a cold nozzle can crack the component during heating. Always replace and tighten while the nozzle is hot (200 °C).
:::

## Maintenance intervals

| Activity | Interval |
|-----------|---------|
| Cleaning (cold pull) | After 50 hours, or when changing material |
| Visual inspection | Weekly |
| Nozzle replacement (brass) | 200–500 hours |
| Nozzle replacement (hardened steel) | 300–600 hours |
