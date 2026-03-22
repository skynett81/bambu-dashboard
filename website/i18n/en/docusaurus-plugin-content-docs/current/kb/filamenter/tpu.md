---
sidebar_position: 4
title: TPU
description: Guide to TPU printing — temperature, speed, and retract settings
---

# TPU

TPU (Thermoplastic Polyurethane) is a flexible material used for cases, gaskets, wheels, and other parts that require elasticity.

## Settings

| Parameter | Value |
|-----------|-------|
| Nozzle temperature | 220–240 °C |
| Bed temperature | 30–45 °C |
| Part cooling | 50–80% |
| Speed | 30–50% (IMPORTANT) |
| Retract | Minimal or disabled |
| Drying | Recommended (6–8 h at 60 °C) |

:::danger Low speed is critical
TPU must be printed slowly. Too high a speed causes the material to compress in the extruder and creates jams. Start at 30% speed and increase carefully.
:::

## Recommended build plates

| Plate | Suitability | Glue stick? |
|-------|---------|----------|
| Textured PEI | Excellent | No |
| Cool Plate (Smooth PEI) | Good | No |
| Engineering Plate | Good | No |

## Retract settings

TPU is elastic and responds poorly to aggressive retraction:

- **Direct drive (X1C/P1S/A1):** Retract 0.5–1.0 mm, 25 mm/s
- **Bowden (avoid with TPU):** Very demanding, not recommended

For very soft TPU (Shore A 85 or lower): disable retraction entirely and rely on temperature and speed control.

## Tips

- **Dry the filament** — wet TPU is extremely difficult to print
- **Use direct extruder** — Bambu Lab P1S/X1C/A1 all have direct drive
- **Avoid high temperature** — above 250 °C TPU degrades and gives discolored prints
- **Stringing** — TPU tends to string; lower temperature by 5 °C or increase cooling

:::tip Shore hardness
TPU comes in different Shore hardnesses (A85, A95, A98). The lower the Shore A, the softer and more challenging to print. Bambu Lab's TPU is Shore A 95 — a good starting point.
:::

## Storage

TPU is highly hygroscopic (absorbs moisture). Wet TPU causes:
- Bubbles and hissing
- Weak and brittle print (paradoxically for a flexible material)
- Stringing

**Always dry TPU** at 60 °C for 6–8 hours before printing. Store in a sealed box with silica gel.
