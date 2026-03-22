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

Analysis data is shown on the file card and used by the [Cost Estimator](../analyse/costestimator).

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

## Send to printer

From the file library you can send directly to a printer:

1. Click on the file → **Send to printer**
2. Select target printer
3. Select AMS slot (for multicolor prints)
4. Click **Start print** or **Add to queue**

:::warning Direct send
Direct send starts the print immediately without confirmation in Bambu Studio. Make sure the printer is ready.
:::
