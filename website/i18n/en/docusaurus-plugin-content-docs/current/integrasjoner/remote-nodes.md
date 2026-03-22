---
sidebar_position: 4
title: Remote Nodes
description: Connect multiple Bambu Dashboard instances to view all printers from one central dashboard
---

# Remote Nodes

The Remote Nodes feature lets you connect multiple Bambu Dashboard instances together so you can view and control all printers from one central interface — regardless of whether they are on the same network or at different locations.

Go to: **https://localhost:3443/#settings** → **Integrations → Remote Nodes**

## Use cases

- **Home + office** — View printers at both locations from the same dashboard
- **Makerspace** — Central dashboard for all instances in the room
- **Guest instances** — Give customers limited visibility without full access

## Architecture

```
Primary instance (your PC)
  ├── Printer A (local MQTT)
  ├── Printer B (local MQTT)
  └── Remote node: Secondary instance
        ├── Printer C (MQTT at remote location)
        └── Printer D (MQTT at remote location)
```

The primary instance polls remote nodes via REST API and aggregates data locally.

## Adding a remote node

### Step 1: Generate API key on the remote instance

1. Log in to the remote instance (e.g. `https://192.168.2.50:3443`)
2. Go to **Settings → API Keys**
3. Click **New key** → give it the name "Primary node"
4. Set permissions: **Read** (minimum) or **Read + Write** (for remote control)
5. Copy the key

### Step 2: Connect from the primary instance

1. Go to **Settings → Remote Nodes**
2. Click **Add remote node**
3. Fill in:
   - **Name**: e.g. "Office" or "Garage"
   - **URL**: `https://192.168.2.50:3443` or external URL
   - **API key**: the key from step 1
4. Click **Test connection**
5. Click **Save**

:::warning Self-signed certificate
If the remote instance uses a self-signed certificate, enable **Ignore TLS errors** — but only do this for internal network connections.
:::

## Aggregated view

After connecting, remote printers appear in:

- **Fleet overview** — labeled with the remote node's name and a cloud icon
- **Statistics** — aggregated across all instances
- **Filament inventory** — combined overview

## Remote control

With **Read + Write** permission you can control remote printers directly:

- Pause / Resume / Stop
- Add to print queue (job is sent to the remote instance)
- View camera stream (proxied through the remote instance)

:::info Latency
Camera stream via remote node may have noticeable delay depending on network speed and distance.
:::

## Access control

Restrict what data the remote node shares:

1. On the remote instance: go to **Settings → API Keys → [Key name]**
2. Restrict access:
   - Specific printers only
   - No camera stream
   - Read-only

## Health and monitoring

Status for each remote node is shown in **Settings → Remote Nodes**:

- **Connected** — last poll successful
- **Disconnected** — cannot reach the remote node
- **Authentication error** — API key invalid or expired
- **Last sync** — timestamp of last successful data synchronization
