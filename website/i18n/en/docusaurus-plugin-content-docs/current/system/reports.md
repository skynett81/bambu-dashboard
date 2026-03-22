---
sidebar_position: 7
title: Reports
description: Automatic weekly and monthly email reports with statistics, activity summaries, and maintenance reminders
---

# Reports

Bambu Dashboard can send automatic email reports with statistics and activity summaries — weekly, monthly, or both.

Go to: **https://localhost:3443/#settings** → **System → Reports**

## Prerequisites

Reports require email notifications to be configured. Set up SMTP under **Settings → Notifications → Email** before enabling reports. See [Notifications](../funksjoner/notifications).

## Enabling automatic reports

1. Go to **Settings → Reports**
2. Enable **Weekly report** and/or **Monthly report**
3. Select **Send time**:
   - Weekly: day of week and time
   - Monthly: day of month (e.g. 1st Monday / last Friday)
4. Enter **Recipient email** (comma-separated for multiple)
5. Click **Save**

Send a test report to see the formatting: click **Send test report now**.

## Contents of the weekly report

The weekly report covers the last 7 days:

### Summary
- Total number of prints
- Number successful / failed / cancelled
- Success rate and change from previous week
- Most active printer

### Activity
- Prints per day (mini graph)
- Total print hours
- Total filament consumption (grams and cost)

### Filament
- Consumption per material and vendor
- Estimated remaining per spool (spools below 20% highlighted)

### Maintenance
- Maintenance tasks completed this week
- Overdue maintenance tasks (red warning)
- Tasks due next week

### HMS errors
- Number of HMS errors this week per printer
- Unacknowledged errors (require attention)

## Contents of the monthly report

The monthly report covers the last 30 days and includes everything from the weekly report, plus:

### Trend
- Comparison with previous month (%)
- Activity map (heatmap thumbnail for the month)
- Monthly success rate development

### Costs
- Total filament cost
- Total electricity cost (if power monitoring is configured)
- Total wear cost
- Combined maintenance cost

### Wear and health
- Health score per printer (with change from previous month)
- Components approaching replacement time

### Statistics highlights
- Longest successful print
- Most used filament type
- Printer with highest activity

## Customizing the report

1. Go to **Settings → Reports → Customization**
2. Check / uncheck sections to include
3. Select **Printer filter**: all printers or a selection
4. Select **Logo display**: show Bambu Dashboard logo in header or disable
5. Click **Save**

## Report archive

All sent reports are saved and can be reopened:

1. Go to **Settings → Reports → Archive**
2. Select a report from the list (sorted by date)
3. Click **Open** to view the HTML version
4. Click **Download PDF** to download the report

Reports are automatically deleted after **90 days** (configurable).
