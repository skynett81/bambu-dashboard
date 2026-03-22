---
sidebar_position: 5
title: Waste Tracking
description: Track filament waste from AMS purge and support material, calculate costs, and optimize efficiency
---

# Waste Tracking

Waste Tracking gives you full insight into how much filament is wasted during printing — AMS purge, flushing during material changes, and support material — and what it costs you.

Go to: **https://localhost:3443/#waste**

## Waste categories

Bambu Dashboard distinguishes between three types of waste:

| Category | Source | Typical amount |
|---|---|---|
| **AMS purge** | Color change in AMS during multicolor print | 5–30 g per change |
| **Material change flush** | Cleaning during switch between different materials | 10–50 g per change |
| **Support material** | Support structures removed after print | Varies |

## AMS purge tracking

AMS purge data is pulled directly from MQTT telemetry and G-code analysis:

- **Grams per color change** — calculated from G-code purge block
- **Number of color changes** — counted from print log
- **Total purge consumption** — sum over the selected period

:::tip Reduce purge
Bambu Studio has settings for purge volume per color combination. Reduce the purge volume for color pairs with low color difference (e.g. white → light gray) to save filament.
:::

## Efficiency calculation

Efficiency is calculated as:

```
Efficiency % = (model material / total consumption) × 100

Total consumption = model material + purge + support material
```

**Example:**
- Model: 45 g
- Purge: 12 g
- Support: 8 g
- Total: 65 g
- **Efficiency: 69%**

Efficiency is shown as a trend chart over time to see if you are improving.

## Waste cost

Based on registered filament prices, the following is calculated:

| Item | Calculation |
|---|---|
| Purge cost | Purge grams × price/gram per color |
| Support cost | Support grams × price/gram |
| **Total waste cost** | Sum of above |
| **Cost per successful print** | Waste cost / number of prints |

## Waste per printer and material

Filter the view by:

- **Printer** — see which printer generates the most waste
- **Material** — see waste per filament type
- **Period** — day, week, month, year

The table view shows a ranked list with the highest waste first, including estimated cost.

## Optimization tips

The system automatically generates suggestions to reduce waste:

- **Flipped color order** — If color A→B purges more than B→A, the system suggests swapping the order
- **Merge color change layers** — Groups layers with the same color to minimize changes
- **Support structure optimization** — Estimates support reduction by changing orientation

:::info Accuracy
Purge calculations are estimated from G-code. Actual waste may vary 10–20% due to printer behavior.
:::

## Export and reporting

1. Click **Export waste data**
2. Select period and format (CSV / PDF)
3. Waste data can be included in project reports and invoices as a cost item

See also [Filament Analytics](./filamentanalytics) for a combined consumption overview.
