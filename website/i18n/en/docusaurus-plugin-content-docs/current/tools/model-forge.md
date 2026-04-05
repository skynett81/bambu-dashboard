---
sidebar_position: 7
title: Model Forge
description: 8 built-in parametric design tools for creating custom 3D models directly in the dashboard
---

# Model Forge

Model Forge is a suite of 8 parametric design tools built into 3DPrintForge. Create custom 3D-printable models without leaving the dashboard — no external CAD software required. Model Forge replaces the standalone Sign Maker from earlier versions and adds 7 additional tools.

Go to: **https://localhost:3443/#model-forge**

## Tools

### Sign Maker

Create custom text signs with full control over:

- Font selection (multiple fonts available)
- Text size, spacing and alignment
- Border style and thickness
- Mounting holes for wall mounting
- Base plate dimensions and rounding
- Export as STL ready for slicing

### Lithophane

Convert any image into a 3D-printable lithophane:

- Upload JPG, PNG or BMP images
- Adjustable thickness range (min/max)
- Flat, curved or cylindrical shapes
- Border and frame options
- Positive or negative mode
- Optimised for white PLA printed on edge

### Storage Box

Generate parametric storage boxes:

- Custom width, depth and height
- Wall thickness control
- Divider grid (rows and columns)
- Lid options: none, snap-fit or sliding
- Corner rounding
- Label slot on the front face
- Stacking lip for vertical organisation

### Text Plate

Create engraved or embossed text plates and name tags:

- Single or multi-line text
- Engraved (recessed) or embossed (raised) text
- Font and size selection
- Plate shape: rectangle, rounded rectangle or oval
- Pin/magnet hole options for attachment
- QR code embedding

### Keychain

Design custom keychains:

- Text and icon support
- Shape options: rectangle, circle, heart, tag, oval
- Ring hole for key attachment
- Adjustable thickness and size
- Dual-colour support (pause at layer for colour swap)

### Cable Label

Generate clip-on cable management labels:

- Cable diameter selector (common sizes or custom)
- Clip-on or wrap-around styles
- Text on one or both sides
- Snap-fit closure
- Batch generation for multiple cables

### Image Relief

Convert images to raised 3D relief models:

- Upload JPG, PNG or BMP images
- Adjustable relief depth
- Smooth or sharp edge transitions
- Base plate with optional border
- Greyscale to height mapping
- Suitable for decorative wall art

### Stencil

Generate stencils from images or text:

- Image-to-stencil conversion with threshold control
- Text stencils with bridge support (letters like A, B, D keep their centres)
- Adjustable border and margin
- Bridge width control for structural integrity
- Export as STL for 3D printing or SVG for laser cutting

## Workflow

1. Open **Model Forge** from the sidebar
2. Select a tool
3. Configure parameters using the live preview
4. Click **Generate** to create the STL
5. **Download** the file or **Send to Library** to store it
6. From the library, use **Send to Printer** or **Add to Queue**

## Tips

:::tip Material choice
For lithophanes, use white PLA and print on edge at 100% infill. For stencils, use PETG or ABS for durability. For storage boxes, PLA or PETG both work well.
:::

:::tip Preview
All tools show a live 3D preview as you adjust parameters. Rotate and zoom the preview to check the result before generating.
:::
