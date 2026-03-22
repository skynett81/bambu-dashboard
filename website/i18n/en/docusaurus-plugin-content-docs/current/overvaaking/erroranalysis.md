---
sidebar_position: 6
title: Error Pattern Analysis
description: AI-based analysis of error patterns, correlations between errors and environmental factors, and concrete improvement suggestions
---

# Error Pattern Analysis

Error pattern analysis uses historical data from prints and errors to identify patterns, causes, and correlations — and gives you concrete suggestions for improvement.

Go to: **https://localhost:3443/#error-analysis**

## What is analyzed

The system analyzes the following data points:

- HMS error codes and timestamps
- Filament type and vendor at the time of error
- Temperature at error (nozzle, bed, chamber)
- Print speed and profile
- Time of day and day of week
- Time since last maintenance
- Printer model and firmware version

## Correlation analysis

The system looks for statistical correlations between errors and factors:

**Examples of correlations detected:**
- "78% of AMS clog errors occur with filament from vendor X"
- "Nozzle clogs happen 3× more often after 6+ hours of continuous printing"
- "Adhesion failures increase when chamber temperature is below 18°C"
- "Stringing errors correlate with humidity above 60% (if hygrometer connected)"

Correlations with statistical significance (p < 0.05) are shown at the top.

:::info Data requirements
The analysis is most accurate with a minimum of 50 prints in history. With fewer prints, estimates are shown with low confidence.
:::

## Improvement suggestions

Based on the analysis, concrete suggestions are generated:

| Suggestion type | Example |
|---|---|
| Filament | "Switch to a different vendor for PA-CF — 3 of 4 errors used VendorX" |
| Temperature | "Increase bed temperature by 5°C for PETG — adhesion failures estimated to decrease 60%" |
| Speed | "Reduce speed to 80% after 4 hours — nozzle clogs estimated to decrease 45%" |
| Maintenance | "Clean extruder gear — wear correlates with 40% of extrusion failures" |
| Calibration | "Run bed leveling — 12 of 15 adhesion failures last week correlate with incorrect calibration" |

Each suggestion shows:
- Estimated effect (% reduction in errors)
- Confidence (low / medium / high)
- Step-by-step implementation
- Link to relevant documentation

## Health score impact

The analysis is linked to the health score (see [Diagnostics](./diagnostics)):

- Shows which factors are dragging the score down the most
- Estimates score improvement by implementing each suggestion
- Prioritizes suggestions by potential score improvement

## Timeline view

Go to **Error Analysis → Timeline** to see a chronological overview:

1. Select printer and time period
2. Errors are shown as points on the timeline, color-coded by type
3. Horizontal lines mark maintenance tasks
4. Clusters of errors (many errors in a short time) are highlighted in red

Click on a cluster to open analysis for that specific period.

## Reports

Generate a PDF report of the error analysis:

1. Click **Generate report**
2. Select time period (e.g. last 90 days)
3. Select content: correlations, suggestions, timeline, health score
4. Download PDF or send to email

Reports are saved under projects if the printer is linked to a project.

:::tip Weekly review
Set up an automatic weekly email report under **Settings → Reports** to stay up to date without visiting the dashboard manually. See [Reports](../system/reports).
:::
