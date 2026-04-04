---
sidebar_position: 4
title: Scheduler
description: Schedule prints, manage the print queue, and set up automatic dispatch
---

# Scheduler

The Scheduler lets you organize and automate print jobs with a calendar view and an intelligent print queue.

## Calendar view

The calendar view gives an overview of all scheduled and completed prints:

- **Month, week, and day view** — choose your level of detail
- **Color coding** — different colors per printer and status
- **Click an event** — see details about the print

Completed prints are shown automatically based on the print history.

## Print queue

The print queue lets you line up jobs that are sent to the printer in order:

### Adding a job to the queue

1. Click **+ Add job**
2. Select file (from printer SD, local upload, or FTP)
3. Set priority (high, normal, low)
4. Select target printer (or "automatic")
5. Click **Add**

### Queue management

| Action | Description |
|----------|-------------|
| Drag and drop | Rearrange the order |
| Pause queue | Temporarily stop dispatching |
| Skip | Send the next job without waiting |
| Delete | Remove a job from the queue |

:::tip Multi-printer dispatch
With multiple printers, the queue can automatically distribute jobs to idle printers. Enable **Automatic dispatch** under **Scheduler → Settings**.
:::

## Scheduled prints

Set up prints to start at a specific time:

1. Click **+ Schedule print**
2. Select file and printer
3. Set start time
4. Configure notification (optional)
5. Save
- **3D preview** — view the 3D model directly from scheduled prints

:::warning Printer must be idle
Scheduled prints only start if the printer is in standby mode at the specified time. If the printer is busy, the start is deferred to the next available time (configurable).
:::

## Load balancing

With automatic load balancing, jobs are distributed intelligently between printers:

- **Round-robin** — even distribution between all printers
- **Least busy** — send to the printer with the shortest estimated finish time
- **Manual** — you choose the printer yourself for each job

Configure under **Scheduler → Load Balancing**.

## Notifications

The scheduler integrates with notification channels:

- Notification when a job starts
- Notification when a job is done
- Notification on error or delay

See [Features Overview](./overview#varsler) to configure notification channels.
