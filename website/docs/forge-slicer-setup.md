---
title: Forge Slicer setup
description: Connect the skynett81/OrcaSlicer fork to 3DPrintForge for in-app slicing
---

# Forge Slicer setup

3DPrintForge can drive a custom OrcaSlicer fork
([skynett81/OrcaSlicer](https://github.com/skynett81/OrcaSlicer))
running in REST service mode. The fork stays open in the background,
3DPrintForge talks to it over HTTP, and you get in-dashboard slicing
without spawning the slicer CLI per request.

This guide walks through the end-user setup. If you're developing the
fork itself, see [`FORGE_SLICER_API.md`](./FORGE_SLICER_API.md) and
the C++ reference under `forge-slicer-cpp/`.

## What you get

- 🟢 Live status pill in the 3DPrintForge header
- ⚡ Slice models from the dashboard with live progress (stages,
  layer counter, percent)
- 🚀 Slice + send to printer in one click
- 🔄 Profile catalog mirrored automatically every 5 minutes
- ⏹ Cancel button mid-slice
- 📦 Multi-extruder filament breakdown per toolhead
- 🔔 Toast notifications on disconnect / reconnect

## Prerequisites

- 3DPrintForge **v1.1.21** or newer (check `Settings → System → Updates`)
- A built `skynett81/OrcaSlicer` binary with the `--rest-port` flag
  (see [building the fork](#building-the-fork) below)

## Quick start (existing binary)

If you already have the fork built:

```bash
# Start the slicer in service mode (no GUI window)
./orca-slicer --rest-port 8765
```

Open 3DPrintForge → look at the header. Within a few seconds the
🟢 **Forge Slicer** badge appears. Done.

To verify from the command line:
```bash
curl http://127.0.0.1:8765/api/health
# {"ok":true,"service":"forge-slicer","version":"...","upstream":"OrcaSlicer ..."}
```

## Building the fork

```bash
git clone https://github.com/skynett81/OrcaSlicer.git
cd OrcaSlicer
# Follow upstream OrcaSlicer build instructions — the fork carries
# the same dependencies plus cpp-httplib (header-only).
./build_release_macos.sh    # or build_release_linux.sh / build_msvc.bat
./build/bin/orca-slicer --rest-port 8765
```

For headless servers (Raspberry Pi running 3DPrintForge):
```bash
# Compile in headless mode if the fork supports it
./build_release_linux.sh --headless
./build/bin/orca-slicer --rest-port 8765 --rest-bind 127.0.0.1
```

## Configuration

3DPrintForge reads its forge-slicer settings from `config.json`:

```json
{
  "forge_slicer": {
    "enabled": true,
    "url": "http://127.0.0.1:8765",
    "token": ""
  }
}
```

Or from environment variables (overrides `config.json`):

```bash
FORGE_SLICER_URL=http://192.168.1.50:8765 \
FORGE_SLICER_TOKEN=secret-bearer-token \
npm start
```

You can also configure it from the UI without editing files:
**Settings → System → Integrations → Forge Slicer**, or open Slicer
Studio (`#slicer/studio`) — the settings card is at the top of both
panels.

## Security

Defaults are safe:
- `--rest-bind 127.0.0.1` — refuses remote connections
- No auth required — anyone running the localhost-only service has
  shell access already

If you need to expose the slicer beyond loopback (e.g. running it on
one machine and 3DPrintForge on another), set a token:

```bash
./orca-slicer --rest-port 8765 --rest-bind 0.0.0.0 --rest-token "long-random-string"
```

Then in 3DPrintForge:
- **Service URL:** `http://192.168.1.50:8765`
- **Token:** `long-random-string`
- Click **Test connection**

The token is sent as `Authorization: Bearer …` on every request. The
fork rejects requests without it (401).

## Auto-start

To launch the fork automatically with 3DPrintForge, add a systemd
service (Linux):

```ini
# /etc/systemd/system/forge-slicer.service
[Unit]
Description=Forge Slicer service
After=network.target

[Service]
ExecStart=/opt/orca-slicer/orca-slicer --rest-port 8765
Restart=on-failure
RestartSec=10
User=printforge

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl enable --now forge-slicer
```

## Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| Badge stays grey ('Forge Slicer offline') | Service isn't reachable on the configured URL | Check `curl http://127.0.0.1:8765/api/health` |
| 'Token required' error | Token mismatch | Ensure 3DPrintForge's token equals what the fork was started with |
| Profiles don't appear | Sync hasn't run yet, or service started after 3DPrintForge | Click **Test connection** in Settings, then **Sync now** |
| Slicing fails with 501 | Fork only implements Phase 1-2 (health + profiles) | The fork needs Phase 3 work — slice still falls back to native |
| Disconnect toast every minute | Service crashes and restarts | Check the fork's stderr; common cause is a bad multipart upload |
| 'Forge Slicer not reachable' on slice but badge is green | Probe cache stale | Add `?force=1` to /api/slicer/forge/status, or restart 3DPrintForge |

## Falling back

If the fork goes down (or you don't run one), 3DPrintForge silently
falls back to the next available slicer:

1. **Forge Slicer** (REST service) — best UX, live progress
2. **CLI bridge** — spawns OrcaSlicer / BambuStudio / Snapmaker Orca
   on demand if installed
3. **Native engine** — pure-JS slicer that always works (slower,
   fewer features)

The Slicer Studio result banner reports which backend was used so you
always know what produced the gcode.

## Disabling the integration

If you don't run the fork and don't want to see the offline badge:
**Settings → System → Integrations → Forge Slicer → uncheck Enable**.
The header badge hides entirely. Slicer Studio uses bridge or native
without prompting.

## Developer mode

If you're hacking on the fork's C++ side, run the Node mock server
on a different port to validate 3DPrintForge changes without rebuilding:

```bash
cd 3DPrintForge
node tools/forge-slicer-mock.js --port 8766
```

Then point 3DPrintForge at the mock:
```bash
FORGE_SLICER_URL=http://127.0.0.1:8766 npm start
```

The mock returns plausible profile catalogs, slice payloads, and full
SSE progress streams — same shape as the real fork.
