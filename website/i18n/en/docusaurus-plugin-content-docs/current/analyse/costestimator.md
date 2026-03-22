---
sidebar_position: 4
title: Cost Estimator
description: Upload a 3MF or GCode file and calculate the total cost for filament, electricity, and machine wear before printing
---

# Cost Estimator

The Cost Estimator lets you estimate the total cost of a print before sending it to the printer — based on filament consumption, electricity price, and machine wear.

Go to: **https://localhost:3443/#cost-estimator**

## Upload file

1. Go to **Cost Estimator**
2. Drag and drop a file into the upload field, or click **Select file**
3. Supported formats: `.3mf`, `.gcode`, `.bgcode`
4. Click **Analyze**

:::info Analysis
The system analyzes the G-code to extract filament consumption, estimated print time, and material profile. This typically takes 2–10 seconds.
:::

## Filament calculation

After analysis, the following is shown:

| Field | Value (example) |
|---|---|
| Estimated filament | 47.3 g |
| Material (from file) | PLA |
| Price per gram | 0.025 (from filament inventory) |
| **Filament cost** | **1.18** |

Switch material in the dropdown to compare costs with different filament types or vendors.

:::tip Material override
If the G-code doesn't contain material information, select the material manually from the list. The price is automatically fetched from the filament inventory.
:::

## Electricity calculation

The electricity cost is calculated based on:

- **Estimated print time** — from G-code analysis
- **Printer power** — configured per printer model (W)
- **Electricity price** — fixed price (per kWh) or live from Tibber/Nordpool

| Field | Value (example) |
|---|---|
| Estimated print time | 3 hours 22 min |
| Printer power | 350 W (X1C) |
| Estimated consumption | 1.17 kWh |
| Electricity price | 1.85 per kWh |
| **Electricity cost** | **2.16** |

Enable the Tibber or Nordpool integration to use planned hourly prices based on desired start time.

## Machine wear

The wear cost is estimated based on:

- Print time × hourly cost per printer model
- Extra wear for abrasive materials (CF, GF, etc.)

| Field | Value (example) |
|---|---|
| Print time | 3 hours 22 min |
| Hourly cost (wear) | 0.80 per hour |
| **Wear cost** | **2.69** |

The hourly cost is calculated from component prices and expected lifetime (see [Wear Prediction](../overvaaking/wearprediction)).

## Total

| Cost item | Amount |
|---|---|
| Filament | 1.18 |
| Electricity | 2.16 |
| Machine wear | 2.69 |
| **Total** | **6.03** |
| + Markup (30%) | 1.81 |
| **Selling price** | **7.84** |

Adjust the markup in the percentage field to calculate the recommended selling price to the customer.

## Save estimate

Click **Save estimate** to link the analysis to a project:

1. Select an existing project or create a new one
2. The estimate is saved and can be used as a basis for invoicing
3. Actual cost (after printing) is automatically compared with the estimate

## Batch calculation

Upload multiple files at once to calculate the total cost for a complete set:

1. Click **Batch mode**
2. Upload all `.3mf`/`.gcode` files
3. The system calculates individually and in total
4. Export the summary as PDF or CSV
