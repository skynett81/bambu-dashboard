---
sidebar_position: 1
title: Statistics
description: Success rate, filament consumption, trends, and key metrics for all Bambu Lab printers over time
---

# Statistics

The Statistics page gives you a complete overview of your printing activity with key metrics, trends, and filament consumption over any time period.

Go to: **https://localhost:3443/#statistics**

## Key metrics

At the top of the page, four KPI cards are shown:

| Metric | Description |
|---|---|
| **Success rate** | Proportion of successful prints out of total prints |
| **Total filament** | Grams used in the selected period |
| **Total print hours** | Accumulated print time |
| **Average print time** | Median duration per print |

Each metric shows the change from the previous period (↑ up / ↓ down) as a percentage deviation.

## Success rate

The success rate is calculated per printer and overall:

- **Successful** — print completed without interruption
- **Cancelled** — manually stopped by user
- **Failed** — stopped by Print Guard, HMS error, or hardware fault

Click on the success rate chart to see which prints failed and the reason.

:::tip Improve success rate
Use [Error Pattern Analysis](../overvaaking/erroranalysis) to identify and fix the causes of failed prints.
:::

## Trends

The trend view shows development over time as a line chart:

1. Select **Time period**: Last 7 / 30 / 90 / 365 days
2. Select **Grouping**: Day / Week / Month
3. Select **Metric**: Number of prints / Hours / Grams / Success rate
4. Click **Compare** to overlay two metrics

The chart supports zoom (scroll) and panning (click and drag).

## Filament consumption

Filament consumption is shown as:

- **Bar chart** — consumption per day/week/month
- **Pie chart** — breakdown between materials (PLA, PETG, ABS, etc.)
- **Table** — detailed list with total grams, meters, and cost per material

### Consumption per printer

Use the multi-select filter at the top to:
- Show only one printer
- Compare two printers side by side
- See aggregated total for all printers

## Activity calendar

View a compact GitHub-style heatmap directly on the statistics page (simplified view), or go to the full [Activity Calendar](./calendar) for a more detailed view.

## Export

1. Click **Export statistics**
2. Select date range and which metrics to include
3. Choose format: **CSV** (raw data), **PDF** (report), or **JSON**
4. The file is downloaded

The CSV export is compatible with Excel and Google Sheets for further analysis.

## Comparison with previous period

Enable **Show previous period** to overlay graphs with the corresponding previous period:

- Last 30 days vs. the 30 days before
- Current month vs. previous month
- Current year vs. last year

This makes it easy to see whether you are printing more or less than before, and whether the success rate is improving.
