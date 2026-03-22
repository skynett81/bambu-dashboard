---
sidebar_position: 2
title: Warping
description: Causes of warping and solutions — enclosure, brim, temperature, and draft shield
---

# Warping

Warping occurs when the corners or edges of a print lift from the plate during or after printing. It is caused by thermal contraction of the material.

## What is warping?

When plastic cools, it contracts. Upper layers are warmer than lower layers — this creates stress that pulls the edges upward and bends the print. The greater the temperature difference, the more warping.

## Materials most susceptible

| Material | Warping risk | Requires enclosure |
|-----------|-------------|-----------------|
| PLA | Low | No |
| PETG | Low–Moderate | No |
| ABS | High | Yes |
| ASA | High | Yes |
| PA/Nylon | Very high | Yes |
| PC | Very high | Yes |
| TPU | Low | No |

## Solutions

### 1. Use an enclosure (chamber)

The most important measure for ABS, ASA, PA, and PC:
- Keep chamber temperature at 40–55 °C for best results
- X1C and P1S: enable chamber fans in "closed" mode
- A1/P1P: use a cover cap to retain heat

### 2. Use brim

A brim is a single layer of extra wide edges that anchors the print to the plate:

```
Bambu Studio:
1. Select the print in slicer
2. Go to Support → Brim
3. Set width to 5–10 mm (the more warping, the wider)
4. Type: Outer Brim Only (recommended)
```

:::tip Brim width guide
- PLA (rarely needed): 3–5 mm
- PETG: 4–6 mm
- ABS/ASA: 6–10 mm
- PA/Nylon: 8–15 mm
:::

### 3. Increase bed temperature

Higher bed temperature reduces the temperature difference between layers:
- ABS: try 105–110 °C
- PA: 85–95 °C
- PETG: 80–85 °C

### 4. Reduce part cooling

For materials prone to warping — lower or disable part cooling:
- ABS/ASA: 0–20% part cooling
- PA: 0–30% part cooling

### 5. Avoid drafts and cold air

Keep the printer away from:
- Windows and exterior doors
- Air conditioning and fans
- Drafts in the room

For P1P and A1: cover openings with cardboard during critical prints.

### 6. Draft Shield

A draft shield is a thin wall around the object that keeps the heat in:

```
Bambu Studio:
1. Go to Support → Draft Shield
2. Enable and set distance (3–5 mm)
```

Especially useful for tall, slender objects.

### 7. Model design measures

When designing your own models:
- Avoid large flat bases (add chamfer/rounding in corners)
- Split large flat parts into smaller sections
- Use "mouse ears" — small circles in corners — in slicer or CAD

## Warping after cooling

Sometimes the print looks fine, but warping occurs after it is removed from the plate:
- Always wait until the plate and print are **completely cool** (below 40 °C) before removal
- For ABS: let cool inside the closed chamber for slower cooling
- Avoid placing a hot print on a cold surface
