---
sidebar_position: 1
title: Labels
description: Generate QR codes, spool labels for thermal printers (ZPL), color cards, and shared color palettes for filament inventory
---

# Labels

The Labels tool generates professional labels for your filament spools — QR codes, spool labels for thermal printers, and color cards for visual identification.

Go to: **https://localhost:3443/#labels**

## QR codes

Generate QR codes that link to filament information in the dashboard:

1. Go to **Labels → QR Codes**
2. Select the spool you want to generate a QR code for
3. The QR code is generated automatically and shown in the preview
4. Click **Download PNG** or **Print**

The QR code contains a URL to the filament profile in the dashboard. Scan with your phone to quickly pull up spool information.

### Batch generation

1. Click **Select all** or check individual spools
2. Click **Generate all QR codes**
3. Download as a ZIP with one PNG per spool, or print all at once

## Spool labels

Professional labels for thermal printers with full spool information:

### Label content (default)

- Spool color (filled color block)
- Material name (large text)
- Vendor
- Color hex code
- Temperature recommendations (nozzle and bed)
- QR code
- Barcode (optional)

### ZPL for thermal printers

Generate ZPL code (Zebra Programming Language) for Zebra, Brother, and Dymo printers:

1. Go to **Labels → Thermal Printing**
2. Select label size: **25×54 mm** / **36×89 mm** / **62×100 mm**
3. Select the spool(s)
4. Click **Generate ZPL**
5. Send the ZPL code to the printer via:
   - **Print directly** (USB connection)
   - **Copy ZPL** and send via terminal command
   - **Download .zpl file**

:::tip Printer setup
For automatic printing, configure the label printer under **Settings → Label Printer** with IP address and port (default: 9100 for RAW TCP).
:::

### PDF labels

For regular printers, generate a PDF with correct dimensions:

1. Select label size from the template
2. Click **Generate PDF**
3. Print on self-adhesive paper (Avery or equivalent)

## Color cards

Color cards are a compact grid showing all spools visually:

1. Go to **Labels → Color Cards**
2. Select which spools to include (all active, or select manually)
3. Select card format: **A4** (4×8), **A3** (6×10), **Letter**
4. Click **Generate PDF**

Each cell shows:
- Color block with actual color
- Material name and color hex
- Material number (for quick reference)

Ideal to laminate and hang at the printer station.

## Shared color palettes

Export a selection of colors as a shared palette:

1. Go to **Labels → Color Palettes**
2. Select spools to include in the palette
3. Click **Share palette**
4. Copy the link — others can import the palette into their dashboard
5. The palette is displayed with hex codes and can be exported to **Adobe Swatch** (`.ase`) or **Procreate** (`.swatches`)
