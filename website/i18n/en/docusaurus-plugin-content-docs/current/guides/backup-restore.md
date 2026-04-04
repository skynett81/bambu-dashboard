---
sidebar_position: 9
title: Backup and restore
description: Automatic and manual backup of 3DPrintForge, restoration, and migrating to a new server
---

# Backup and restore

3DPrintForge stores all data locally — print history, filament inventory, settings, users, and more. Regular backups ensure you do not lose anything in the event of a server failure or when migrating.

## What is included in a backup?

| Data | Included | Notes |
|------|----------|-------|
| Print history | Yes | All logs and statistics |
| Filament inventory | Yes | Spools, weights, brands |
| Settings | Yes | All system settings |
| Printer configuration | Yes | IP addresses, access codes |
| Users and roles | Yes | Passwords stored hashed |
| Notification configuration | Yes | Telegram tokens, etc. |
| Camera images | Optional | Can become large files |
| Timelapse videos | Optional | Excluded by default |
| `data/model-cache/` | Cached 3MF models | Optional |
| `data/history-models/` | 3MF linked to history | Recommended |
| `data/toolpath-cache/` | Cached gcode toolpath | Optional |

## Automatic nightly backup

By default, an automatic backup runs every night at 03:00.

**View and configure automatic backup:**
1. Go to **System → Backup**
2. Under **Automatic backup** you can see:
   - Last successful backup and timestamp
   - Next scheduled backup
   - Number of backups stored (default: 7 days)

**Configure:**
- **Time** — change from the default 03:00 to a time that suits you
- **Retention period** — number of days backups are kept (7, 14, 30 days)
- **Storage location** — local folder (default) or external path
- **Compression** — enabled by default (reduces size by 60–80%)

:::info Backup files are stored here by default
```
/path/to/3dprintforge/data/backups/
backup-2025-03-22-030000.tar.gz
backup-2025-03-21-030000.tar.gz
...
```
:::

## Manual backup

Take a backup at any time:

1. Go to **System → Backup**
2. Click **Take backup now**
3. Wait until the status shows **Completed**
4. Download the backup file by clicking **Download**

**Alternatively via terminal:**
```bash
cd /path/to/3dprintforge
node scripts/backup.js
```

The backup file is saved in `data/backups/` with a timestamp in the filename.

## Restoring from backup

:::warning Restoration overwrites existing data
All existing data is replaced by the contents of the backup file. Make sure you are restoring the correct file.
:::

### Via the dashboard

1. Go to **System → Backup**
2. Click **Restore**
3. Select a backup file from the list, or upload a backup file from disk
4. Click **Restore now**
5. The dashboard restarts automatically after restoration

### Via terminal

```bash
cd /path/to/3dprintforge
node scripts/restore.js data/backups/backup-2025-03-22-030000.tar.gz
```

After restoration, restart the dashboard:
```bash
sudo systemctl restart 3dprintforge
# or
npm start
```

## Exporting and importing settings

Want to save only the settings (not all history)?

**Exporting:**
1. Go to **System → Settings → Export**
2. Select what to include:
   - Printer configuration
   - Notification configuration
   - User accounts
   - Filament brands and profiles
3. Click **Export** — you download a `.json` file

**Importing:**
1. Go to **System → Settings → Import**
2. Upload the `.json` file
3. Select which parts to import
4. Click **Import**

:::tip Useful for new installations
Exported settings are handy to bring to a new server. Import them after a fresh installation to avoid having to configure everything from scratch.
:::

## Migrating to a new server

How to move 3DPrintForge with all data to a new machine:

### Step 1 — Take a backup on the old server

1. Go to **System → Backup → Take backup now**
2. Download the backup file
3. Copy the file to the new server (USB, scp, network share)

### Step 2 — Install on the new server

```bash
git clone https://github.com/skynett81/3dprintforge.git
cd 3dprintforge
./install.sh
```

Follow the installation guide. You don't need to configure anything — just get the dashboard up and running.

### Step 3 — Restore the backup

Once the dashboard is running on the new server:

1. Go to **System → Backup → Restore**
2. Upload the backup file from the old server
3. Click **Restore now**

Everything is now in place: history, filament inventory, settings, and users.

### Step 4 — Verify the connection

1. Go to **Settings → Printers**
2. Test the connection to each printer
3. Check that IP addresses are still correct (the new server may have a different IP)

## Tips for good backup hygiene

- **Test restoration** — take a backup and restore it on a test machine at least once. Untested backups are not real backups.
- **Store externally** — regularly copy the backup file to an external drive or cloud storage (Nextcloud, Google Drive, etc.)
- **Set up an alert** — enable an alert for "Backup failed" under **Settings → Notifications → Events** so you know immediately if something goes wrong
