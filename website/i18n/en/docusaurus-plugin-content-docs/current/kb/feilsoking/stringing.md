---
sidebar_position: 3
title: Stringing
description: Causes of stringing and solutions — retract, temperature, and drying
---

# Stringing

Stringing (or "oozing") is thin plastic threads that form between separate parts of the object while the nozzle moves without extruding. It gives a "spider web"-like appearance on the print.

## Causes of stringing

1. **Nozzle temperature too high** — hot plastic is liquid and drips
2. **Poor retract settings** — filament is not pulled back quickly enough
3. **Wet filament** — moisture causes steam and extra flow
4. **Speed too low** — nozzle spends a long time in transit positions

## Diagnosis

**Wet filament?** Do you hear a crackling/popping sound during printing? The filament is wet — dry it first before adjusting other settings.

**Too high temp?** Do you see dripping from the nozzle during "pause" moments? Lower the temperature by 5–10 °C.

## Solutions

### 1. Dry the filament

Wet filament is the most common cause of stringing that cannot be dialed out:

| Material | Drying temperature | Time |
|-----------|----------------|-----|
| PLA | 45–55 °C | 4–6 hours |
| PETG | 60–65 °C | 6–8 hours |
| TPU | 55–60 °C | 6–8 hours |
| PA | 75–85 °C | 8–12 hours |

### 2. Lower nozzle temperature

Start by lowering 5 °C at a time:
- PLA: try 210–215 °C (down from 220 °C)
- PETG: try 235–240 °C (down from 245 °C)

:::warning Too low temp causes poor layer fusion
Lower temperature carefully. Too low a temperature causes poor layer fusion, weak prints, and extrusion problems.
:::

### 3. Adjust retract settings

Retraction pulls filament back into the nozzle during "travel" movement to prevent dripping:

```
Bambu Studio → Filament → Retract:
- Retract distance: 0.4–1.0 mm (direct drive)
- Retract speed: 30–45 mm/s
```

:::tip Bambu Lab printers have direct drive
All Bambu Lab printers (X1C, P1S, A1) use a direct drive extruder. Direct drive requires **shorter** retract distance than Bowden systems (typically 0.5–1.5 mm vs. 3–7 mm).
:::

### 4. Increase travel speed

Faster movement between points gives the nozzle less time to drip:
- Increase "travel speed" to 200–300 mm/s
- Bambu Lab printers handle this well

### 5. Enable "Avoid Crossing Perimeters"

Slicer setting that causes the nozzle to avoid crossing open areas where stringing will be visible:
```
Bambu Studio → Quality → Avoid crossing perimeters
```

### 6. Lower speed (for TPU)

For TPU, the solution is the opposite of other materials:
- Lower print speed to 20–35 mm/s
- TPU is elastic and compresses at too high a speed — this causes "ooze after"

## After adjustments

Test with a standard stringing test model (e.g. "torture tower" from MakerWorld). Adjust one variable at a time and observe the change.

:::note Perfect is rarely possible
Some stringing is normal for most materials. Focus on reducing to an acceptable level, not eliminating it entirely. PETG will always have slightly more stringing than PLA.
:::
