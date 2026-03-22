---
sidebar_position: 2
title: Activity Calendar
description: GitHub-style heatmap calendar showing printer activity per day throughout the year with year selector and detail view
---

# Activity Calendar

The Activity Calendar shows a visual overview of your printing activity throughout the entire year — inspired by GitHub's contribution overview.

Go to: **https://localhost:3443/#calendar**

## Heatmap overview

The calendar displays 365 days (52 weeks) as a grid of colored squares:

- **Gray** — no prints this day
- **Light green** — 1–2 prints
- **Green** — 3–5 prints
- **Dark green** — 6–10 prints
- **Deep green** — 11+ prints

The squares are organized with weekdays vertically (Mon–Sun) and weeks horizontally from left (January) to right (December).

:::tip Color coding
You can switch the heatmap metric from **Number of prints** to **Hours** or **Grams of filament** via the selector above the calendar.
:::

## Year selector

Click **< Year >** to navigate between years:

- All years with recorded print activity are available
- The current year is shown by default
- The future is gray (no data)

## Detail view per day

Click on a square to see details for that day:

- **Date** and day of week
- **Number of prints** — successful and failed
- **Total filament used** (grams)
- **Total print hours**
- **List of prints** — click to open in history

## Monthly overview

Below the heatmap, a monthly overview is shown with:
- Total prints per month as a bar chart
- Best day of the month highlighted
- Comparison with the same month last year (%)

## Printer filter

Select a printer from the dropdown at the top to show activity for only one printer, or select **All** for an aggregated view.

Multi-printer view shows stacked colors by clicking **Stacked** in the view selector.

## Streaks and records

Below the calendar, the following is shown:

| Statistic | Description |
|---|---|
| **Longest streak** | Most consecutive days with at least one print |
| **Current streak** | Ongoing run of active days |
| **Most active day** | The day with the most prints overall |
| **Most active week** | The week with the most prints |
| **Most active month** | The month with the most prints |

## Export

Click **Export** to download calendar data:

- **PNG** — image of the heatmap (for sharing)
- **CSV** — raw data with one row per day (date, count, grams, hours)

The PNG export is optimized for sharing on social media with the printer name and year as a subtitle.
