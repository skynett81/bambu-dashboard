---
sidebar_position: 3
title: Filament Analytics
description: Detailed analysis of filament consumption, costs, forecasts, usage rates, and waste per material and vendor
---

# Filament Analytics

Filament Analytics gives you full insight into your filament usage — what you use, what it costs, and what you can save.

Go to: **https://localhost:3443/#filament-analytics**

## Consumption overview

At the top, a summary for the selected period is shown:

- **Total consumption** — grams and meters for all materials
- **Estimated cost** — based on registered price per spool
- **Most used material** — type and vendor
- **Reuse rate** — proportion of filament in the actual model vs. support/purge

### Consumption per material

A pie chart and table show the breakdown between materials:

| Column | Description |
|---|---|
| Material | PLA, PETG, ABS, PA, etc. |
| Vendor | Bambu Lab, PolyMaker, Prusament, etc. |
| Grams used | Total weight |
| Meters | Estimated length |
| Cost | Grams × price per gram |
| Prints | Number of prints using this material |

Click on a row to drill down to individual spool level.

## Usage rates

The usage rate shows average filament consumption per time unit:

- **Grams per hour** — during active printing
- **Grams per week** — including printer downtime
- **Grams per print** — average per print

These are used to calculate forecasts for future needs.

:::tip Purchase planning
Use the usage rate to plan your spool inventory. The system automatically alerts when estimated stock will run out within 14 days (configurable).
:::

## Cost forecast

Based on historical usage rates, the following is calculated:

- **Estimated consumption next 30 days** (grams per material)
- **Estimated cost next 30 days**
- **Recommended stock level** (enough for 30 / 60 / 90 days of operation)

The forecast accounts for seasonal variation if you have data from at least one year.

## Waste and efficiency

See [Waste Tracking](./waste) for full documentation. Filament Analytics shows a summary:

- **AMS purge** — grams and proportion of total consumption
- **Support material** — grams and proportion
- **Actual model material** — remaining proportion (efficiency %)
- **Estimated waste cost** — what the waste is costing you

## Spool log

All spools (active and empty) are logged:

| Field | Description |
|---|---|
| Spool name | Material name and color |
| Original weight | Registered weight at start |
| Remaining weight | Calculated remaining |
| Used | Total grams used |
| Last used | Date of last print |
| Status | Active / Empty / Stored |

## Price registration

For accurate cost analysis, register prices per spool:

1. Go to **Filament Inventory**
2. Click on a spool → **Edit**
3. Enter **Purchase price** and **Weight at purchase**
4. The system calculates price per gram automatically

Spools without a registered price use the **default price per gram** (set in **Settings → Filament → Default price**).

## Export

1. Click **Export filament data**
2. Select period and format (CSV / PDF)
3. CSV includes one row per print with grams, cost, and material
