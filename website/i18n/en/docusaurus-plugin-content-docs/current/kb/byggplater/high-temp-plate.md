---
sidebar_position: 4
title: High Temp Plate
description: High temperature plate for ABS, ASA, PC, and PA — tolerates up to 120 °C bed temperature
---

# High Temp Plate

The High Temp Plate is designed for materials that require high bed temperature. It tolerates up to 120 °C and is necessary for polycarbonate (PC) and high-temperature variants of PA.

## Properties

- **Surface:** Smooth with high-temperature coating
- **Max bed temperature:** 120 °C
- **Bottom surface on print:** Glossy/smooth
- **Adhesion:** Good at high temperature — releases upon cooling

## Best suited for

| Material | Bed temperature | Glue stick |
|-----------|---------------|---------|
| ABS | 90–110 °C | Yes |
| ASA | 90–110 °C | Yes |
| PC | 100–120 °C | Yes (required) |
| PA6 | 80–90 °C | Yes |
| PA12 | 70–85 °C | Yes |
| PA-CF | 90–100 °C | Yes |

## Not suited for

- PLA — the plate runs too hot, PLA adheres too much
- PETG — risk of plate damage without glue stick
- TPU — Engineering Plate is better

## Glue stick

Glue stick is strongly recommended (and required for PC) to:
1. Improve first layer adhesion
2. Protect the plate's coating
3. Ease print removal after cooling

Apply a thin, even layer. For PC and PA: use slightly more than for ABS.

:::warning PC requires extra care
Polycarbonate (PC) prints at 250–280 °C nozzle and 100–120 °C bed. Without an enclosure (chamber) and High Temp Plate, success rate is very low. Only X1C and P1S are recommended for PC printing.
:::

## Maintenance

```bash
# After PC/ABS with glue stick:
1. Let plate cool to 50 °C
2. Remove print carefully (flex the plate)
3. Wash with warm water and dish soap
4. Dry thoroughly — water on a hot plate can damage the coating

# Between prints:
1. Wipe with IPA
2. Check coating for wear
```

:::danger Avoid thermal shock
Never place a cold plate on a hot bed, or spray cold IPA on a hot plate. Temperature differences can damage the coating or cause deformation of the steel plate.
:::

## Lifespan

The High Temp Plate lasts shorter than the Engineering Plate due to higher thermal stress:
- **Normal use (ABS/ASA):** 200–400 prints
- **Intensive use (PC):** 100–200 prints

Replace when visible coating wear is present, or when adhesion problems persist.
