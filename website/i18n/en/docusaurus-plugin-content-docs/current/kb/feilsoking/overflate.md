---
sidebar_position: 4
title: Surface Defects
description: Diagnose and fix common surface problems — blobs, zits, layer lines, elephant foot and more
---

# Surface Defects

The surface of a 3D print tells you a lot about what is happening inside the system. Most surface defects have one or two clear causes — with the right diagnosis they are surprisingly easy to fix.

## Quick Diagnosis Overview

| Symptom | Most Common Cause | First Action |
|---|---|---|
| Blobs and zits | Over-extrusion, seam placement | Adjust seam, calibrate flow |
| Visible layer lines | Z-wobble, layers too thick | Switch to finer layers, check Z-axis |
| Elephant foot | First layer too wide | Elephant foot compensation |
| Ringing/ghosting | Vibrations at high speed | Lower speed, enable input shaper |
| Under-extrusion | Blocked nozzle, temperature too low | Clean nozzle, increase temp |
| Over-extrusion | Flow rate too high | Calibrate flow rate |
| Pillowing | Too few top layers, insufficient cooling | Increase top layers, increase cooling fan |
| Layer separation | Temperature too low, too much cooling | Increase temp, reduce cooling fan |

---

## Blobs and Zits

Blobs are irregular lumps on the surface. Zits are pinpoint dots — often along the seam line.

### Causes

- **Over-extrusion** — too much plastic is extruded and pushed to the side
- **Poor seam placement** — the default "nearest" seam collects all transitions in the same spot
- **Retraction issues** — insufficient retraction creates pressure build-up in the nozzle
- **Moist filament** — moisture creates micro-bubbles and drips

### Solutions

**Seam settings in Bambu Studio:**
```
Bambu Studio → Quality → Seam position
- Aligned: All seams in the same place (visible but tidy)
- Nearest: Nearest point (spreads blobs randomly)
- Back: Behind the object (recommended for visual quality)
- Random: Random distribution (best camouflage for seam)
```

**Flow rate calibration:**
```
Bambu Studio → Calibration → Flow rate
Adjust in steps of ±2% until blobs disappear
```

:::tip Seam on "Back" for visual quality
Place the seam on the back of the object so it is least visible. Combine with "Wipe on retract" for a cleaner seam finish.
:::

---

## Visible Layer Lines

All FDM prints have layer lines, but they should be consistent and barely visible on normal prints. Abnormal visibility points to specific problems.

### Causes

- **Z-wobble** — the Z-axis vibrates or is not straight, creating a wavy pattern over the entire height
- **Layers too thick** — layer height above 0.28 mm is noticeable even on perfect prints
- **Temperature fluctuations** — inconsistent melt temperature causes varying layer width
- **Inconsistent filament diameter** — cheap filament with varying diameter

### Solutions

**Z-wobble:**
- Check that the Z-leadscrew is clean and lubricated
- Verify that the screw is not bent (visual inspection while rotating)
- See maintenance article for [Z-axis lubrication](/docs/kb/vedlikehold/smoring)

**Layer height:**
- Switch to 0.12 mm or 0.16 mm for a smoother surface
- Remember that halving layer height doubles print time

**Temperature fluctuations:**
- Use PID calibration (available via Bambu Studio maintenance menu)
- Avoid drafts that cool the nozzle during printing

---

## Elephant Foot

Elephant foot is when the first layer is wider than the rest of the object — as if the object "spreads out" at the base.

### Causes

- First layer squishes too hard against the plate (Z-offset too tight)
- Bed temperature too high keeps the plastic soft and fluid for too long
- Insufficient cooling on the first layer gives plastic more time to spread

### Solutions

**Elephant foot compensation in Bambu Studio:**
```
Bambu Studio → Quality → Elephant foot compensation
Start with 0.1–0.2 mm and adjust until the foot disappears
```

**Z-offset:**
- Recalibrate first layer height
- Raise Z-offset by 0.05 mm at a time until the foot is gone

**Bed temperature:**
- Lower bed temperature by 5–10 °C
- For PLA: 55 °C is often enough — 65 °C can cause elephant foot

:::warning Do not over-compensate
Too high elephant foot compensation can create a gap between the first layer and the rest. Adjust carefully in steps of 0.05 mm.
:::

---

## Ringing and Ghosting

Ringing (also called "ghosting" or "echoing") is a wave pattern in the surface just after sharp edges or corners. The pattern "echoes" out from the edge.

### Causes

- **Vibrations** — rapid acceleration and deceleration at corners sends vibrations through the frame
- **Speed too high** — especially outer wall speed above 100 mm/s produces noticeable ringing
- **Loose parts** — loose spool, vibrating cable chain or loosely mounted printer

### Solutions

**Bambu Lab input shaper (Resonance Compensation):**
```
Bambu Studio → Printer → Resonance compensation
Bambu Lab X1C and P1S have a built-in accelerometer and auto-calibrate this
```

**Reduce speed:**
```
Outer wall: Lower to 60–80 mm/s
Acceleration: Reduce from standard to 3000–5000 mm/s²
```

**Mechanical check:**
- Verify the printer sits on a stable surface
- Check that the spool does not vibrate in its holder
- Tighten all accessible screws on the frame's outer panels

:::tip X1C and P1S auto-calibrate ringing
Bambu Lab X1C and P1S have built-in accelerometer calibration that runs automatically at startup. Run "Full calibration" from the maintenance menu if ringing appears after a period of use.
:::

---

## Under-Extrusion

Under-extrusion is when the printer extrudes too little plastic. The result is thin, weak walls, visible gaps between layers, and a scraggly surface.

### Causes

- **Partially blocked nozzle** — carbon buildup reduces flow
- **Nozzle temperature too low** — plastic is not fluid enough
- **Worn gear** in the extruder mechanism does not grip the filament well enough
- **Speed too high** — extruder cannot keep up with the desired flow

### Solutions

**Cold pull:**
```
1. Heat nozzle to 220 °C
2. Push filament in manually
3. Cool nozzle to 90 °C (PLA) while maintaining pressure
4. Pull filament out quickly
5. Repeat until what comes out is clean
```

**Temperature adjustment:**
- Increase nozzle temperature by 5–10 °C and test again
- Running at too low a temperature is a common under-extrusion cause

**Flow rate calibration:**
```
Bambu Studio → Calibration → Flow rate
Increase gradually until under-extrusion disappears
```

**Check extruder gear:**
- Remove filament and inspect the gear
- Clean with a small brush if there is filament powder in the teeth

---

## Over-Extrusion

Over-extrusion produces too wide a bead — the surface looks loose, glossy or uneven, with a tendency toward blobs.

### Causes

- **Flow rate too high** (EM — Extrusion Multiplier)
- **Wrong filament diameter** — 2.85 mm filament with a 1.75 mm profile causes massive over-extrusion
- **Nozzle temperature too high** makes the plastic too fluid

### Solutions

**Flow rate calibration:**
```
Bambu Studio → Calibration → Flow rate
Lower in steps of 2% until the surface is even and matte
```

**Verify filament diameter:**
- Measure actual filament diameter with calipers at 5–10 locations along the filament
- Average deviation over 0.05 mm indicates low-quality filament

---

## Pillowing

Pillowing is bubbly, uneven top layers with "pillows" of plastic between the top layers. Particularly noticeable with low infill and too few top layers.

### Causes

- **Too few top layers** — plastic over infill collapses into the gaps
- **Insufficient cooling** — plastic does not solidify fast enough to bridge over infill gaps
- **Infill too low** — large gaps in infill are difficult to bridge over

### Solutions

**Increase number of top layers:**
```
Bambu Studio → Quality → Top shell layers
Minimum: 4 layers
Recommended for smooth surface: 5–6 layers
```

**Increase cooling:**
- PLA should have the cooling fan at 100% from layer 3
- Insufficient cooling is the most common cause of pillowing

**Increase infill:**
- Go from 10–15% up to 20–25% if pillowing persists
- Gyroid pattern gives a more even bridging surface than lines

:::tip Ironing
Bambu Studio's "ironing" feature runs the nozzle over the top layer an extra time to smooth out the surface. Enable under Quality → Ironing for the best top layer finish.
:::

---

## Layer Separation / Delamination

Layer separation is when layers do not adhere properly to each other. In the worst case the print cracks apart along layer lines.

### Causes

- **Nozzle temperature too low** — plastic does not melt well enough into the layer below
- **Too much cooling** — plastic solidifies too quickly before it has time to fuse
- **Layer thickness too high** — over 80% of nozzle diameter gives poor fusion
- **Speed too high** — reduced melt time per mm of travel

### Solutions

**Increase temperature:**
- Try +10 °C from standard and observe
- ABS and ASA are particularly sensitive — require controlled chamber heating

**Reduce cooling:**
- ABS: cooling fan OFF (0%)
- PETG: 20–40% max
- PLA: can tolerate full cooling, but reduce if layer separation occurs

**Layer thickness:**
- Use max 75% of nozzle diameter
- With 0.4 mm nozzle: max recommended layer height is 0.30 mm

**Check enclosure is warm enough (ABS/ASA/PA/PC):**
```
Bambu Lab X1C/P1S: Let the chamber warm up to 40–60 °C
before print starts — do not open door during printing
```

---

## General Troubleshooting Tips

1. **Change one thing at a time** — test with a small calibration print between each change
2. **Dry the filament first** — many surface defects are actually moisture symptoms
3. **Clean the nozzle** — partial blockage gives inconsistent surface defects that are difficult to diagnose
4. **Run a full calibration** from the Bambu Studio maintenance menu after major adjustments
5. **Use Bambu Dashboard** to track which settings produced the best results over time
