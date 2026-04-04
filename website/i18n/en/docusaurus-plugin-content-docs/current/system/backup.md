---
sidebar_position: 2
title: Backup
description: Create, restore, and schedule automatic backups of 3DPrintForge data
---

# Backup

3DPrintForge can back up all configuration, history, and data so you can easily restore in the event of system failure, server migration, or update issues.

Go to: **https://localhost:3443/#settings** → **System → Backup**

## What is included in a backup

| Data type | Included | Note |
|-----------|----------|------|
| Printer setup and configurations | ✅ | |
| Print history | ✅ | |
| Filament inventory | ✅ | |
| Users and roles | ✅ | Passwords stored hashed |
| Settings | ✅ | Incl. notification configurations |
| Maintenance log | ✅ | |
| Projects and invoices | ✅ | |
| File library (metadata) | ✅ | |
| File library (files) | Optional | Can be large |
| Timelapse videos | Optional | Can be very large |
| Gallery images | Optional | |
| `data/model-cache/` | Cached 3MF models | Optional |
| `data/history-models/` | 3MF linked to history | Recommended |
| `data/toolpath-cache/` | Cached gcode toolpath | Optional |

## Creating a manual backup

1. Go to **Settings → Backup**
2. Choose what to include (see the table above)
3. Click **Create backup now**
4. A progress indicator is shown while the backup is being created
5. Click **Download** when the backup is ready

The backup is saved as a `.zip` file with a timestamp in the filename:
```
3dprintforge-backup-2026-03-22T14-30-00.zip
```

## Downloading a backup

Backup files are stored in the backup folder on the server (configurable). You can also download them directly:

1. Go to **Backup → Existing backups**
2. Find the backup in the list (sorted by date)
3. Click **Download** (download icon)

:::info Storage folder
Default storage folder: `./data/backups/`. Change under **Settings → Backup → Storage folder**.
:::

## Scheduled automatic backup

1. Enable **Automatic backup** under **Backup → Scheduling**
2. Choose interval:
   - **Daily** — runs at 03:00 (configurable)
   - **Weekly** — a specific day and time
   - **Monthly** — first day of the month
3. Choose **Number of backups to keep** (e.g. 7 — older ones are deleted automatically)
4. Click **Save**

:::tip External storage
For important data: mount an external disk or network drive as the backup storage folder. That way backups survive even if the system disk fails.
:::

## Restoring from backup

:::warning Restore overwrites existing data
Restoring replaces all existing data with the contents of the backup file. Make sure you have a fresh backup of the current data first.
:::

### From an existing backup on the server

1. Go to **Backup → Existing backups**
2. Find the backup in the list
3. Click **Restore**
4. Confirm in the dialog
5. The system restarts automatically after restoration

### From a downloaded backup file

1. Click **Upload backup**
2. Select the `.zip` file from your computer
3. The file is validated — you can see what is included
4. Click **Restore from file**
5. Confirm in the dialog

## Backup validation

3DPrintForge validates all backup files before restoring:

- Checks that the ZIP format is valid
- Verifies that the database schema is compatible with the current version
- Shows a warning if the backup is from an older version (migration will be performed automatically)
