---
sidebar_position: 1
title: Poor Adhesion
description: Causes and solutions for poor first layer adhesion — plate, temp, glue stick, speed, Z-offset
---

# Poor Adhesion

Poor adhesion is one of the most common problems in 3D printing. The first layer doesn't stick, or prints stop adhering midway through.

## Symptoms

- First layer doesn't adhere — print moves or lifts
- Corners and edges lift (warping)
- Print detaches in the middle of the job
- Uneven first layer with gaps or loose threads

## Checklist — try in this order

### 1. Clean the plate
The most common cause of poor adhesion is grease or dirt on the plate.

```
1. Wipe the plate with IPA (isopropyl alcohol)
2. Avoid touching the print surface with bare fingers
3. For persistent problems: wash with water and mild dish soap
```

### 2. Calibrate Z-offset

Z-offset is the height between the nozzle and the plate at the first layer. Too high = the thread hangs loose. Too low = the nozzle scrapes the plate.

**Correct Z-offset:**
- First layer should look slightly transparent
- The thread should be pressed down to the plate with a small "squish"
- Threads should melt slightly into each other

Adjust Z-offset via **Controls → Live Adjust Z** during printing.

:::tip Live-adjust while printing
Bambu Dashboard shows Z-offset adjustment buttons during an active print. Adjust in steps of ±0.02 mm while watching the first layer.
:::

### 3. Check bed temperature

| Material | Too low temp | Recommended |
|-----------|-------------|---------|
| PLA | Below 30 °C | 35–45 °C |
| PETG | Below 60 °C | 70–85 °C |
| ABS | Below 80 °C | 90–110 °C |
| TPU | Below 25 °C | 30–45 °C |

Try increasing bed temperature by 5 °C at a time.

### 4. Use glue stick

Glue stick improves adhesion for most materials on most plates:
- Apply a thin, even layer
- Let dry for 30 seconds before starting
- Especially important for: ABS, PA, PC, PETG (on smooth PEI)

### 5. Lower first layer speed

Lower speed on the first layer gives better contact between filament and plate:
- Default: 50 mm/s for first layer
- Try: 30–40 mm/s
- Bambu Studio: under **Quality → First layer speed**

### 6. Check plate condition

A worn plate gives poor adhesion even with perfect settings. Replace the plate if:
- PEI coating is visibly damaged
- Cleaning doesn't help

### 7. Use brim

For materials prone to warping (ABS, PA, large flat objects):
- Add brim in slicer: 5–10 mm width
- Increases contact area and holds down edges

## Special cases

### Large flat objects
Large flat objects are most prone to detachment. Remedies:
- Brim 8–10 mm
- Increase bed temperature
- Close chamber (ABS/PA)
- Lower part cooling

### Glazed surfaces
Plates with too much accumulated glue stick can become glazed. Wash thoroughly with water and start fresh.

### After filament change
Different materials require different settings. Check that bed temp and plate are configured for the new material.
