---
sidebar_position: 5
title: Print Queue
description: Schedule and automate prints with a prioritized queue, automatic dispatch, and staggered start
---

# Print Queue

The print queue lets you schedule prints in advance and send them automatically to available printers when they become idle.

Go to: **https://localhost:3443/#queue**

## Creating a queue

1. Go to **Print Queue** in the navigation menu
2. Click **New job** (+ icon)
3. Fill in:
   - **Filename** — upload `.3mf` or `.gcode`
   - **Target printer** — select a specific printer or **Automatic**
   - **Priority** — Low / Normal / High / Critical
   - **Scheduled start** — now or a specific date/time
4. Click **Add to queue**

:::tip Drag and drop
You can drag files directly from the file explorer onto the queue page to add them quickly.
:::

## Adding files

### Upload file

1. Click **Upload** or drag a file to the upload field
2. Supported formats: `.3mf`, `.gcode`, `.bgcode`
3. The file is saved in the file library and linked to the queue job

### From the file library

1. Go to **File Library** and find the file
2. Click **Add to queue** on the file
3. The job is created with default settings — edit if needed

### From history

1. Open a previous print in **History**
2. Click **Print again**
3. The job is added with the same settings as last time

## Priority

The queue is processed in priority order:

| Priority | Color | Description |
|---|---|---|
| Critical | Red | Sent to the first available printer regardless of other jobs |
| High | Orange | Ahead of normal and low jobs |
| Normal | Blue | Default order (FIFO) |
| Low | Gray | Only sent when no higher jobs are waiting |

Drag and drop jobs in the queue to change the order manually within the same priority level.

## Automatic dispatch

When **Automatic dispatch** is enabled, Bambu Dashboard monitors all printers and sends the next job automatically:

1. Go to **Settings → Queue**
2. Enable **Automatic dispatch**
3. Choose **Dispatch strategy**:
   - **First available** — sends to the first printer that becomes idle
   - **Least used** — prioritizes the printer with the fewest prints today
   - **Round-robin** — rotates evenly between all printers

:::warning Confirmation
Enable **Require confirmation** in settings if you want to manually approve each dispatch before the file is sent.
:::

## Staggered start

Staggered start is useful for preventing all printers from starting and finishing at the same time:

1. In the **New job** dialog, expand **Advanced settings**
2. Enable **Staggered start**
3. Set **Delay between printers** (e.g. 30 minutes)
4. The system distributes start times automatically

**Example:** 4 identical jobs with a 30-minute delay start at 08:00, 08:30, 09:00, and 09:30.

## Queue status and tracking

The queue overview shows all jobs with status:

| Status | Description |
|---|---|
| Waiting | Job is in queue and waiting for a printer |
| Scheduled | Has a scheduled start time in the future |
| Sending | Being transferred to printer |
| Printing | In progress on the selected printer |
| Completed | Done — linked to history |
| Failed | Error during sending or printing |
| Cancelled | Manually cancelled |

:::info Notifications
Enable notifications for queue events under **Settings → Notifications → Queue** to get notified when a job starts, completes, or fails. See [Notifications](./notifications).
:::
