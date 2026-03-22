---
sidebar_position: 6
title: Bed Mesh
description: 3D visualization of build plate flatness calibration with heatmap, scan from UI, and calibration guidance
---

# Bed Mesh

The Bed Mesh tool gives you a visual representation of the build plate's flatness — essential for good adhesion and an even first layer.

Go to: **https://localhost:3443/#bedmesh**

## What is bed mesh?

Bambu Lab printers scan the build plate surface with a probe and create a map (mesh) of height deviations. The printer's firmware automatically compensates for deviations during printing. Bambu Dashboard visualizes this map for you.

## Visualization

### 3D surface

The bed mesh map is shown as an interactive 3D surface:

- Use the mouse to rotate the view
- Scroll to zoom in/out
- Click **Top view** for a bird's-eye view
- Click **Side view** to see the profile

The color scale shows deviations from average height:
- **Blue** — lower than center (concave)
- **Green** — approximately flat (< 0.1 mm deviation)
- **Yellow** — moderate deviation (0.1–0.2 mm)
- **Red** — high deviation (> 0.2 mm)

### Heatmap

Click **Heatmap** for a flat 2D view of the mesh map — easier to read for most people.

The heatmap shows:
- Exact deviation values (mm) for each measurement point
- Marked problem points (deviation > 0.3 mm)
- Dimensions of the measurements (number of rows × columns)

## Scan bed mesh from UI

:::warning Requirements
The scan requires the printer to be idle and the bed temperature to be stabilized. Heat up the bed to the desired temperature BEFORE scanning.
:::

1. Go to **Bed Mesh**
2. Select printer from the dropdown
3. Click **Scan now**
4. Select bed temperature for the scan:
   - **Cold** (room temperature) — quick, but less accurate
   - **Warm** (50–60°C PLA, 70–90°C PETG) — recommended
5. Confirm in the dialog — the printer automatically starts the probe sequence
6. Wait until the scan is complete (3–8 minutes depending on mesh size)
7. The new mesh map is displayed automatically

## Calibration guidance

After scanning, the system provides concrete recommendations:

| Finding | Recommendation |
|---|---|
| Deviation < 0.1 mm everywhere | Excellent — no action needed |
| Deviation 0.1–0.2 mm | Good — compensation handled by firmware |
| Deviation > 0.2 mm in corners | Adjust bed springs manually (if possible) |
| Deviation > 0.3 mm | Bed may be damaged or incorrectly mounted |
| Center higher than corners | Thermal expansion — normal for warm beds |

:::tip Historical comparison
Click **Compare with previous** to see if the mesh map has changed over time — useful for detecting that the plate is gradually warping.
:::

## Mesh history

All mesh scans are saved with a timestamp:

1. Click **History** in the bed mesh sidebar
2. Select two scans to compare them (a difference map is shown)
3. Delete old scans you no longer need

## Export

Export mesh data as:
- **PNG** — image of heatmap (for documentation)
- **CSV** — raw data with X, Y, and height deviation per point
