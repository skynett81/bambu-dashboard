---
sidebar_position: 8
title: Server Log
description: View the server log in real time, filter by level and module, and troubleshoot issues with Bambu Dashboard
---

# Server Log

The server log gives you insight into what is happening inside Bambu Dashboard — useful for troubleshooting, monitoring, and diagnostics.

Go to: **https://localhost:3443/#logs**

## Real-time view

The log stream updates in real time via WebSocket:

1. Go to **System → Server Log**
2. New log lines appear automatically at the bottom
3. Click **Lock bottom** to always scroll to the latest log
4. Click **Freeze** to stop auto-scrolling and read existing lines

The default view shows the last 500 log lines.

## Log levels

Each log line has a level:

| Level | Color | Description |
|---|---|---|
| **ERROR** | Red | Errors that affect functionality |
| **WARN** | Orange | Warnings — something may go wrong |
| **INFO** | Blue | Normal operational information |
| **DEBUG** | Gray | Detailed developer information |

:::info Log level configuration
Change log level under **Settings → System → Log level**. For normal operation, use **INFO**. Use **DEBUG** only for troubleshooting as it generates much more data.
:::

## Filtering

Use the filter toolbar at the top of the log view:

1. **Log level** — show only ERROR / WARN / INFO / DEBUG or a combination
2. **Module** — filter by system module:
   - `mqtt` — MQTT communication with printers
   - `api` — API requests
   - `db` — database operations
   - `auth` — authentication events
   - `queue` — print queue events
   - `guard` — Print Guard events
   - `backup` — backup operations
3. **Free text** — search log text (supports regex)
4. **Timestamp** — filter by date range

Combine filters for precise troubleshooting.

## Common error situations

### MQTT connection issues

Look for log lines from the `mqtt` module:

```
ERROR [mqtt] Connection to printer XXXX failed: Connection refused
```

**Solution:** Check that the printer is on, the access key is correct, and the network is working.

### Database errors

```
ERROR [db] Migration v95 failed: SQLITE_CONSTRAINT
```

**Solution:** Take a backup and run database repair via **Settings → System → Repair database**.

### Authentication errors

```
WARN [auth] Failed login for user admin from IP 192.168.1.x
```

Many failed logins may indicate a brute-force attempt. Check whether IP whitelisting should be enabled.

## Exporting logs

1. Click **Export log**
2. Select time period (default: last 24 hours)
3. Choose format: **TXT** (human-readable) or **JSON** (machine-readable)
4. The file is downloaded

Exported logs are useful when reporting bugs or contacting support.

## Log rotation

Logs are rotated automatically:

| Setting | Default |
|---|---|
| Max log file size | 50 MB |
| Number of rotated files to keep | 5 |
| Total max log size | 250 MB |

Adjust under **Settings → System → Log rotation**. Older log files are automatically compressed with gzip.

## Log file location

Log files are stored on the server:

```
./data/logs/
├── bambu-dashboard.log          (active log)
├── bambu-dashboard.log.1.gz     (rotated)
├── bambu-dashboard.log.2.gz     (rotated)
└── ...
```

:::tip SSH access
To read logs directly on the server via SSH:
```bash
tail -f ./data/logs/bambu-dashboard.log
```
:::
