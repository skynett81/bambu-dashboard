---
sidebar_position: 3
title: ABS
description: Guide to ABS printing — temperature, enclosure, warping, and glue stick
---

# ABS

ABS (Acrylonitrile Butadiene Styrene) is a thermoplastic with good heat stability and impact resistance. It requires an enclosure and is more demanding than PLA/PETG, but produces durable functional parts.

## Settings

| Parameter | Value |
|-----------|-------|
| Nozzle temperature | 240–260 °C |
| Bed temperature | 90–110 °C |
| Chamber temperature | 45–55 °C (X1C/P1S) |
| Part cooling | 0–20% |
| Aux fan | 0% |
| Speed | 80–100% |
| Drying | Recommended (4–6 h at 70 °C) |

## Recommended build plates

| Plate | Suitability | Glue stick? |
|-------|---------|----------|
| Engineering Plate (Textured PEI) | Excellent | Yes (recommended) |
| High Temp Plate | Excellent | Yes |
| Cool Plate (Smooth PEI) | Avoid | — |
| Textured PEI | Good | Yes |

:::tip Glue stick for ABS
Always use glue stick on the Engineering Plate with ABS. It improves adhesion and makes it easier to release the print without damaging the plate.
:::

## Enclosure (chamber)

ABS **requires** a closed chamber to prevent warping:

- **X1C and P1S:** Built-in chamber with active heat management — ideal for ABS
- **P1P:** Partially open — add a top cover for better results
- **A1 / A1 Mini:** Open CoreXY — **not recommended** for ABS without a custom enclosure

Keep the chamber closed throughout the print. Don't open it to check the print — waiting until it cools down also prevents warping on release.

## Warping

ABS is highly prone to warping (corners lifting):

- **Increase bed temperature** — try 105–110 °C
- **Use brim** — 5–10 mm brim in Bambu Studio
- **Avoid drafts** — close all air flows around the printer
- **Lower part cooling to 0%** — cooling causes warping

:::warning Fumes
ABS emits styrene fumes during printing. Ensure good ventilation in the room, or use a HEPA/active carbon filter. The Bambu P1S has a built-in filter.
:::

## Post-processing

ABS can be sanded, painted, and glued more easily than PETG and PLA. It can also be vapor smoothed with acetone for a smooth surface — but be very careful with acetone exposure.

## Storage

Dry at **70 °C for 4–6 hours** before printing. Store in a sealed box — ABS absorbs moisture, which causes popping sounds and weak layers.
