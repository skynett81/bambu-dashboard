---
sidebar_position: 3
title: Power Monitoring
description: Measure actual power consumption per print with a Shelly or Tasmota smart plug and link to the cost overview
---

# Power Monitoring

Connect a smart plug with energy monitoring to the printer to log actual power consumption per print — not just estimates.

Go to: **https://localhost:3443/#settings** → **Integrations → Power Monitoring**

## Supported devices

| Device | Protocol | Recommendation |
|---|---|---|
| **Shelly Plug S / Plus Plug S** | HTTP REST / MQTT | Recommended — easy setup |
| **Shelly 1PM / 2PM** | HTTP REST / MQTT | For hardwired installation |
| **Shelly Gen2 / Gen3** | HTTP REST / MQTT | Newer models with extended API |
| **Tasmota devices** | MQTT | Flexible for custom setups |

:::tip Recommended device
Shelly Plug S Plus with firmware 1.0+ is tested and recommended. Supports Wi-Fi, MQTT, and HTTP REST without cloud dependency.
:::

## Setup with Shelly

### Prerequisites

- The Shelly plug is connected to the same network as Bambu Dashboard
- The Shelly is configured with a static IP or DHCP reservation

### Configuration

1. Go to **Settings → Power Monitoring**
2. Click **Add power meter**
3. Select **Type**: Shelly
4. Fill in:
   - **IP address**: e.g. `192.168.1.150`
   - **Channel**: 0 (for single-outlet plugs)
   - **Authentication**: username and password if configured
5. Click **Test connection**
6. Link the plug to a **Printer**: select from the dropdown
7. Click **Save**

### Polling interval

The default polling interval is 10 seconds. Reduce to 5 for more accurate measurements, increase to 30 for lower network load.

## Setup with Tasmota

1. Configure the Tasmota device with MQTT (see Tasmota documentation)
2. In Bambu Dashboard: select **Type**: Tasmota
3. Enter the MQTT topic for the device: e.g. `tasmota/power-plug-1`
4. Link to printer and click **Save**

Bambu Dashboard automatically subscribes to `{topic}/SENSOR` for power readings.

## What is measured

When power monitoring is enabled, the following is logged per print:

| Metric | Description |
|---|---|
| **Instantaneous power** | Watts during printing (live) |
| **Total energy consumption** | kWh for the entire print |
| **Average power** | kWh / print time |
| **Energy cost** | kWh × electricity price (from Tibber/Nordpool) |

Data is saved in print history and available for analysis.

## Live view

Instantaneous power consumption is shown in:

- **Dashboard** — as an extra widget (enable in widget settings)
- **Fleet overview** — as a small indicator on the printer card

## Comparison with estimate

After printing, a comparison is shown:

| | Estimated | Actual |
|---|---|---|
| Energy consumption | 1.17 kWh | 1.09 kWh |
| Electricity cost | 2.16 | 2.02 |
| Deviation | — | -6.8% |

Consistent deviations can be used to calibrate the estimates in [Cost Estimator](../analyse/costestimator).

## Turn off printer automatically

Shelly/Tasmota can automatically turn off the printer after a completed print:

1. Go to **Power Monitoring → [Printer] → Auto off**
2. Enable **Turn off X minutes after print completed**
3. Set time delay (e.g. 10 minutes)

:::danger Cooling
Let the printer cool down for at least 5–10 minutes after the print is done before cutting power. The nozzle should cool below 50°C to avoid heat creep in the hotend.
:::
