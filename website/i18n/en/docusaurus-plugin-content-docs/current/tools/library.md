---
sidebar_position: 2
title: File Library
description: Upload and manage 3D models and G-code files, analyze G-code, and link to MakerWorld and Printables
---

# File Library

The File Library is a central place to store and manage all your 3D models and G-code files — with automatic G-code analysis and integration with MakerWorld and Printables.

Go to: **https://localhost:3443/#library**

## Uploading models

### Single upload

1. Go to **File Library**
2. Click **Upload** or drag files to the upload area
3. Supported formats: `.3mf`, `.gcode`, `.bgcode`, `.stl`, `.obj`
4. The file is automatically analyzed after upload

:::info Storage folder
Files are stored in the folder configured under **Settings → File Library → Storage folder**. Default: `./data/library/`
:::

### Batch upload

Drag and drop an entire folder to upload all supported files at once. Files are processed in the background and you are notified when everything is ready.

## G-code analysis

After upload, `.gcode` and `.bgcode` files are automatically analyzed:

| Metric | Description |
|---|---|
| Estimated print time | Time calculated from G-code commands |
| Filament consumption | Grams and meters per material/color |
| Layer count | Total number of layers |
| Layer height | Recorded layer height |
| Materials | Detected materials (PLA, PETG, etc.) |
| Infill percentage | If available in metadata |
| Support material | Estimated support weight |
| Printer model | Target printer from metadata |

Analysis data is shown on the file card and used by the [Cost Estimator](../analytics/costestimator).

## File cards and metadata

Each file card shows:
- **Filename** and format
- **Upload date**
- **Thumbnail** (from `.3mf` or generated)
- **Analyzed print time** and filament consumption
- **Tags** and category
- **Linked prints** — number of times printed

Click on a card to open the detail view with full metadata and history.

## Organization

### Tags

Add tags for easy searching:
1. Click on the file → **Edit metadata**
2. Enter tags (comma-separated): `benchy, test, PLA, calibration`
3. Search the library with tag filter

### Categories

Organize files into categories:
- Click **New category** in the sidebar
- Drag files into the category
- Categories can be nested (subcategories supported)

## Link to MakerWorld

1. Go to **Settings → Integrations → MakerWorld**
2. Log in with your Bambu Lab account
3. Back in the library: click on a file → **Link to MakerWorld**
4. Search for the model on MakerWorld and select the correct match
5. Metadata (designer, licensing, rating) is imported from MakerWorld

The link shows the designer name and original URL on the file card.

## Link to Printables

1. Go to **Settings → Integrations → Printables**
2. Paste your Printables API key
3. Link files to Printables models in the same way as MakerWorld

## Send to Printer

The **Send to Printer** button is available on every file card and in the detail view. It sends the file directly to a printer and starts the print:

1. Click **Send to Printer** on the file card (or open the file and click the button)
2. Select the target printer from the dropdown
3. Select AMS/filament slot for multicolour prints
4. Confirm and the print starts immediately

:::warning Direct send
Send to Printer starts the print immediately without confirmation in your slicer. Make sure the printer is ready (bed clear, filament loaded, nozzle clean).
:::

## Add to Queue

The **Add to Queue** button lets you schedule a file for later printing without starting it immediately:

1. Click **Add to Queue** on the file card
2. Select the target printer (or let the queue assign automatically)
3. Optionally set priority (low, normal, high)
4. The file is added to the print queue

The queue respects printer availability and filament compatibility. When a printer finishes its current job, the next queued item starts automatically if auto-dispatch is enabled.

:::tip Batch operations
Select multiple files in the library (hold Shift or Ctrl) and use **Add to Queue** to queue them all at once. The queue handles ordering based on priority and filament compatibility.
:::

## 3D Preview

All 3MF files in the library have a **▶ 3D Preview** button that opens the [3MFConsortium 3mfViewer](https://github.com/3MFConsortium/3mfViewer):

- **Full 3D viewing** — scene tree, materials, colours, wireframe and beam lattice
- **lib3mf WASM** — spec-compliant parsing of metadata, thumbnails and mesh data
- **Interactive** — rotate, zoom and pan the model with mouse controls
- Powered by the official [3MF Consortium](https://github.com/3mfconsortium) standard
