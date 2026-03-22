---
sidebar_position: 5
title: PA / Nylon
description: Guide to nylon printing — drying, glue stick, settings, and variants
---

# PA / Nylon

Nylon (Polyamide / PA) is one of the strongest and most wear-resistant 3D printing materials. It is ideal for mechanical parts, gears, bearings, and other high-load components.

## Settings

| Parameter | PA6 | PA12 | PA-CF |
|-----------|-----|------|-------|
| Nozzle temperature | 260–280 °C | 250–270 °C | 270–290 °C |
| Bed temperature | 70–90 °C | 60–80 °C | 80–100 °C |
| Part cooling | 0–30% | 0–30% | 0–20% |
| Drying (required) | 80 °C / 8–12 h | 80 °C / 8 h | 80 °C / 12 h |

## Drying — critical for nylon

Nylon is **extremely hygroscopic**. It absorbs moisture from the air within hours.

:::danger Always dry nylon
Wet nylon gives poor results — weak print, bubbles, bubbly surface, and poor layer fusion. Dry nylon **immediately** before printing, and use it within a few hours afterward.

- **Temperature:** 75–85 °C
- **Time:** 8–12 hours
- **Method:** Filament dryer or oven with fan
:::

Bambu AMS is not recommended for nylon without a sealed and dry configuration. Use an external filament feeder directly to the printer if possible.

## Build plates

| Plate | Suitability | Glue stick? |
|-------|---------|----------|
| Engineering Plate (Textured PEI) | Excellent | Yes (required) |
| High Temp Plate | Good | Yes (required) |
| Cool Plate | Poor | — |

:::warning Glue stick is required
Nylon adheres poorly without glue stick. Apply a thin, even layer (Bambu Lab or Pritt stick). Without glue stick, nylon lifts from the plate.
:::

## Warping

Nylon warps significantly:
- Use brim (8–15 mm)
- Close the chamber (X1C/P1S gives best results)
- Avoid large flat parts without brim
- Keep ventilation minimal

## Variants

### PA6 (Nylon 6)
Most common, good strength and flexibility. Absorbs a lot of moisture.

### PA12 (Nylon 12)
More dimensionally stable and absorbs somewhat less moisture than PA6. Easier to print.

### PA-CF (carbon fiber)
Very stiff and light. Requires hardened steel nozzle. Prints drier than standard nylon.

### PA-GF (glass fiber filled)
Good stiffness at lower cost than CF. Requires hardened steel nozzle.

## Storage

Store nylon in a sealed box with aggressive silica gel. The Bambu Lab drying box is ideal. Never leave nylon open overnight.
