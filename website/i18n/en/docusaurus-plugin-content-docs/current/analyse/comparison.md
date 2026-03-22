---
sidebar_position: 6
title: Print Comparison
description: Compare two prints side by side with detailed metrics, graphs, and gallery images for A/B analysis
---

# Print Comparison

Print Comparison lets you analyze two prints side by side — useful for comparing settings, materials, printers, or versions of the same model.

Go to: **https://localhost:3443/#comparison**

## Selecting prints to compare

1. Go to **Print Comparison**
2. Click **Select print A** and search history
3. Click **Select print B** and search history
4. Click **Compare** to load the comparison view

:::tip Faster access
From **History** you can right-click a print and select **Set as print A** or **Compare with...** to jump directly to comparison mode.
:::

## Metric comparison

Metrics are shown in two columns (A and B) with the better one highlighted:

| Metric | Description |
|---|---|
| Success | Completed / Cancelled / Failed |
| Duration | Total print time |
| Filament consumption | Total grams and per color |
| Filament efficiency | Model % of total consumption |
| Max nozzle temperature | Highest recorded nozzle temperature |
| Max bed temperature | Highest recorded bed temperature |
| Speed setting | Silent / Standard / Sport / Turbo |
| AMS changes | Number of color changes |
| HMS errors | Any errors during print |
| Printer | Which printer was used |

Cells with the better value are shown with a green background.

## Temperature graphs

Two temperature graphs are shown side by side (or overlaid):

- **Separate view** — graph A on the left, graph B on the right
- **Overlaid view** — both in the same graph with different colors

Use the overlaid view to directly compare temperature stability and heating speed.

## Gallery images

If both prints have milestone screenshots, they are shown in a grid:

| Print A | Print B |
|---|---|
| 25% image A | 25% image B |
| 50% image A | 50% image B |
| 75% image A | 75% image B |
| 100% image A | 100% image B |

Click an image to open fullscreen preview with slide animation.

## Timelapse comparison

If both prints have a timelapse, the videos are shown side by side:

- Synchronized playback — both start and pause at the same time
- Independent playback — control each video separately

## Settings differences

The system automatically highlights differences in print settings (extracted from G-code metadata):

- Different layer heights
- Different infill patterns or percentages
- Different support settings
- Different speed profiles

Differences are shown with an orange highlight in the settings table.

## Save comparison

1. Click **Save comparison**
2. Give the comparison a name (e.g. "PLA vs PETG - Benchy")
3. The comparison is saved and available via **History → Comparisons**

## Export

1. Click **Export**
2. Select **PDF** for a report with all metrics and images
3. The report can be linked to a project for documentation of material choices
