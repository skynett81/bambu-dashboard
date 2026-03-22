---
sidebar_position: 4
title: Maintenance
description: Keep track of nozzle changes, lubrication, and other maintenance tasks with reminders, intervals, and a cost log
---

# Maintenance

The Maintenance module helps you plan and track all maintenance on your Bambu Lab printers — from nozzle changes to lubricating rails.

Go to: **https://localhost:3443/#maintenance**

## Maintenance plan

Bambu Dashboard comes with preconfigured maintenance intervals for all Bambu Lab printer models:

| Task | Interval (default) | Model |
|---|---|---|
| Clean nozzle | Every 200 hours | All |
| Replace nozzle (brass) | Every 500 hours | All |
| Replace nozzle (hardened) | Every 2000 hours | All |
| Lubricate X-axis | Every 300 hours | X1C, P1S |
| Lubricate Z-axis | Every 300 hours | All |
| Clean AMS gears | Every 200 hours | AMS |
| Clean chamber | Every 500 hours | X1C |
| Replace PTFE tube | As needed / 1000 hours | All |
| Full calibration | Monthly | All |

All intervals can be customized per printer.

## Nozzle change log

1. Go to **Maintenance → Nozzles**
2. Click **Log nozzle change**
3. Fill in:
   - **Date** — automatically set to today
   - **Nozzle material** — Brass / Hardened Steel / Copper / Ruby Tip
   - **Nozzle diameter** — 0.2 / 0.4 / 0.6 / 0.8 mm
   - **Brand/model** — optional
   - **Price** — for cost log
   - **Hours at change** — automatically fetched from the print time counter
4. Click **Save**

The log shows all nozzle history sorted by date.

:::tip Advance reminder
Set **Notify X hours in advance** (e.g. 50 hours) to get a notification well before the next recommended change.
:::

## Creating maintenance tasks

1. Click **New task** (+ icon)
2. Fill in:
   - **Task name** — e.g. "Lubricate Y-axis"
   - **Printer** — select relevant printer(s)
   - **Interval type** — Hours / Days / Number of prints
   - **Interval** — e.g. 300 hours
   - **Last performed** — enter when it was last done (set a back-date)
3. Click **Create**

## Intervals and reminders

For active tasks, the following is shown:
- **Green** — time to next maintenance > 50% of interval remaining
- **Yellow** — time to next maintenance < 50% remaining
- **Orange** — time to next maintenance < 20% remaining
- **Red** — maintenance overdue

### Configuring reminders

1. Click on a task → **Edit**
2. Enable **Reminders**
3. Set **Notify at** e.g. 10% remaining until due
4. Select notification channel (see [Notifications](../funksjoner/notifications))

## Mark as done

1. Find the task in the list
2. Click **Done** (checkmark icon)
3. The interval resets from today's date/hours
4. A log entry is created automatically

## Cost log

All maintenance tasks can have an associated cost:

- **Parts** — nozzles, PTFE tubes, lubricants
- **Time** — hours spent × hourly rate
- **External service** — paid repair

Costs are summed per printer and shown in the statistics overview.

## Maintenance history

Go to **Maintenance → History** to see:
- All completed maintenance tasks
- Date, hours, and cost
- Who performed it (in multi-user setups)
- Comments and notes

Export history to CSV for accounting purposes.
