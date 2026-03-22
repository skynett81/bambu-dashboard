---
sidebar_position: 4
title: Lubrication
description: Lubrication of linear rods, rails, and intervals for Bambu Lab printers
---

# Lubrication

Proper lubrication of moving parts reduces wear, lowers noise levels, and ensures precise movement. Bambu Lab printers use linear motion systems that require periodic lubrication.

## Lubrication types

| Component | Lubrication type | Product |
|-----------|-------------|---------|
| Linear rods (XY) | Light machine oil or PTFE spray | 3-in-1, Super Lube |
| Z-axis lead screw | Thick grease | Super Lube grease |
| Linear rails | Light lithium grease | Bambu Lab grease |
| Cable chain links | None (dry) | — |

## Linear rods

### X and Y axes
The rods are hardened steel rods that slide through linear bearings:

```
Interval: Every 200–300 hours, or when squeaking sounds occur
Amount: Very little — one drop per rod point is enough
Method:
1. Turn off the printer
2. Move the carriage manually to the end
3. Apply 1 drop of light oil at the midpoint of the rod
4. Move the carriage slowly back and forth 10 times
5. Wipe off excess oil with lint-free paper
```

:::warning Do not over-lubricate
Too much oil attracts dust and creates an abrasive paste. Use minimal amounts and always wipe off excess.
:::

### Z-axis (vertical)
The Z-axis uses a lead screw that requires grease (not oil):

```
Interval: Every 200 hours
Method:
1. Turn off the printer
2. Apply a thin layer of grease along the lead screw
3. Run the Z-axis up and down manually (or via maintenance menu)
4. Grease distributes automatically
```

## Linear rails

Bambu Lab P1S and X1C use linear rails (MGN12) on the Y-axis:

```
Interval: Every 300–500 hours
Method:
1. Remove some old grease with a needle or toothpick from the injection opening
2. Inject new grease with a syringe and thin cannula
3. Run the axis back and forth to distribute the grease
```

Bambu Lab sells official lubricant (Bambu Lubricant) that is calibrated for the system.

## Lubrication maintenance for different models

### X1C / P1S
- Y-axis: Linear rails — Bambu grease
- X-axis: Carbon rods — light oil
- Z-axis: Dual lead screw — Bambu grease

### A1 / A1 Mini
- All axes: Steel rods — light oil
- Z-axis: Single lead screw — Bambu grease

## Signs that lubrication is needed

- **Squeaking or scraping sounds** during movement
- **Vibration patterns** visible on vertical walls (VFA)
- **Inaccurate dimensions** without other causes
- **Increased pitch** from the motion system

## Lubrication intervals

| Activity | Interval |
|-----------|---------|
| Oil XY rods | Every 200–300 hours |
| Grease Z lead screw | Every 200 hours |
| Grease linear rails (X1C/P1S) | Every 300–500 hours |
| Full maintenance cycle | Semi-annually (or 500 hours) |

Use the maintenance module in the dashboard to track intervals automatically.
