---
sidebar_position: 7
title: Model Forge
description: 17 built-in parametric 3D tools — sign maker, lithophane, storage box, text plate, keychain, cable label, relief, stencil, NFC tags, 3MF converter, calibration, lattice, multi-color, vase, threads, texture, and 3MF validator
---

# Model Forge

Model Forge is a suite of 17 parametric design tools built into 3DPrintForge. Create custom 3D-printable models directly in the dashboard — no external CAD software required.

Go to: **https://localhost:3443/#model-forge**

:::info Technology
All tools export 3MF files compatible with all major slicers. Model Forge is built on **lib3mf WASM** (3MF Consortium) with a shared **MeshBuilder** providing 9 geometry primitives. Every tool includes a live **Three.js** 3D preview.
:::

## Tools overview

| # | Tool | Description |
|---|------|-------------|
| 1 | [Sign Maker](#sign-maker) | QR codes, labels, warning signs with frame and stand |
| 2 | [Lithophane](#lithophane) | Convert images to 3D printable light panels (flat/curved/cylinder) |
| 3 | [Storage Box](#storage-box) | Parametric boxes with dividers (Gridfinity compatible) |
| 4 | [Text Plate](#text-plate) | Custom 3D text on a plate with multi-line support |
| 5 | [Keychain](#keychain) | Custom keychains with text and shapes |
| 6 | [Cable Label](#cable-label) | Wrap-around labels for cables and wires |
| 7 | [Relief](#relief) | Convert images to raised 3D surfaces or stamps |
| 8 | [Stencil](#stencil) | Create cut-out stencils from images |
| 9 | [NFC Filament Tag](#nfc-filament-tag) | Write filament info to NFC tags (OpenSpool format) |
| 10 | [3MF Converter](#3mf-converter) | Convert Bambu Lab .3mf to Snapmaker U1 format |
| 11 | [Calibration Tools](#calibration-tools) | 8 sub-tools for printer calibration and testing |
| 12 | [Lattice Structure](#lattice-structure) | BCC/FCC/octet/diamond/cubic lattice cells |
| 13 | [Multi-Color](#multi-color) | Multi-object 3MF for AMS/MMU color assignment |
| 14 | [Advanced Vase](#advanced-vase) | 7 vase profiles with parametric control |
| 15 | [Threads & Joints](#threads--joints) | Bolts, nuts, standoffs, and snap-fit clips |
| 16 | [Texture Surface](#texture-surface) | 8 embossed texture patterns for surfaces |
| 17 | [3MF Validator](#3mf-validator) | Validate 3MF files, check mesh integrity, detect extensions |

---

## Sign Maker

Create custom text signs with QR codes, labels, and warning signs:

- **Text** — single or multi-line text with font selection
- **QR code** — embed a QR code alongside text
- **Frame** — decorative border with adjustable thickness
- **Stand** — integrated stand for desk placement
- **Mounting holes** — wall mount option
- **Size** — adjustable width, height, and depth

## Lithophane

Convert any image into a 3D-printable light panel:

- **Image upload** — JPG, PNG, or BMP
- **Shape** — flat, curved, or cylindrical
- **Resolution** — detail level (pixels per mm)
- **Thickness** — minimum and maximum thickness range
- **Inversion** — swap light and dark areas
- **Border** — optional frame around the panel

:::tip Best results
Print with white PLA at 100% infill. Place a light source behind the panel to reveal the image.
:::

## Storage Box

Generate parametric storage boxes with Gridfinity compatibility:

- **Dimensions** — width, depth, and height in mm
- **Wall thickness** — adjustable walls
- **Dividers** — internal divider grid (X and Y directions)
- **Lid** — none, snap-fit, or sliding lid
- **Corners** — rounded or sharp
- **Label slot** — front-facing label area
- **Gridfinity** — compatible base pattern for modular stacking

## Text Plate

Create 3D text plates with multi-line support:

- **Text** — multi-line text with line break control
- **Font** — font and size selection
- **Alignment** — left, center, or right
- **Style** — embossed (raised) or engraved (recessed) text
- **Base plate** — adjustable size and shape
- **Mounting** — optional holes for screws or magnets

## Keychain

Design custom keychains:

- **Text** — short text or initials
- **Shape** — rectangle, circle, oval, heart, tag, or custom
- **Ring hole** — automatic attachment hole
- **Thickness** — total keychain thickness
- **Multi-color** — layer-based color swap support for AMS/MMU printers

## Cable Label

Generate wrap-around cable management labels:

- **Text** — cable name or identifier
- **Style** — clip-on or wrap-around
- **Cable diameter** — common sizes or custom input
- **Font** — readable fonts optimized for small text
- **Batch** — generate multiple labels on one plate

## Relief

Convert images to raised 3D surfaces or stamps:

- **Image upload** — JPG, PNG, or BMP
- **Depth** — adjustable relief depth
- **Inversion** — swap raised and recessed areas
- **Smoothing** — surface smoothness control
- **Border** — optional frame around the relief
- **Resolution** — detail level based on image size

## Stencil

Create cut-out stencils from images:

- **Image upload** — automatic conversion with threshold control
- **Text** — alternative text-based stencil
- **Bridges** — automatic bridge generation for floating elements (e.g. the center of letters like O, A, B)
- **Thickness** — stencil thickness in mm
- **Margin** — border around the stencil
- **Bridge width** — adjustable for structural integrity

## NFC Filament Tag

Write filament information to NFC tags in OpenSpool format:

- **Filament data** — material type, color, brand, weight
- **OpenSpool format** — compatible with OpenSpool-enabled printers
- **Tag writing** — direct NFC tag programming from the browser
- **Spool inventory** — link to existing spools in your inventory

## 3MF Converter

Convert Bambu Lab .3mf project files to Snapmaker U1 format:

- **Input** — Bambu Lab .3mf files with embedded print profiles
- **Output** — converted .3mf compatible with Snapmaker U1
- **Profile mapping** — translates Bambu print settings to Snapmaker equivalents
- **Batch conversion** — convert multiple files at once

## Calibration Tools

8 sub-tools for printer calibration and testing:

| Sub-tool | Purpose |
|----------|---------|
| Tolerance test | Test dimensional accuracy with graduated fit slots |
| Bed level | Generate a bed leveling pattern for first-layer calibration |
| Temp tower | Temperature tower for finding optimal print temperature |
| Retraction test | Retraction distance and speed calibration |
| Vase mode test | Spiral vase for testing single-wall quality |
| QR block | QR code calibration block |
| Custom shapes | Basic geometric shapes for testing |
| Thread test | Threaded connection tolerance test |

## Lattice Structure

Generate lattice unit cells for lightweight structural infill:

- **Type** — BCC, FCC, octet, diamond, or cubic lattice
- **Cell size** — unit cell dimensions
- **Strut diameter** — configurable strut thickness
- **Array** — repeat cells in X, Y, Z directions
- **Use case** — lightweight brackets, heat exchangers, aesthetic panels

## Multi-Color

Create multi-object 3MF files for AMS/MMU color assignment:

- **Layout** — stack, side-by-side, or inlay arrangement
- **Color assignment** — assign colors per object for multi-material printing
- **AMS/MMU compatible** — ready for Bambu AMS, Prusa MMU, or similar systems
- **Import** — combine existing STL/3MF files into one multi-color project

## Advanced Vase

Generate vases with 7 parametric profiles:

| Profile | Shape |
|---------|-------|
| Cylinder | Straight walls |
| Sine | Wavy sine-wave walls |
| Bulge | Outward bulging mid-section |
| Flare | Widening top opening |
| Twist | Spiraling twisted walls |
| Hourglass | Narrow middle, wide top and bottom |
| Tulip | Tulip-shaped curved profile |

All profiles support adjustable height, diameter, wall thickness, and resolution.

## Threads & Joints

Generate threaded fasteners and mechanical joints:

- **Bolts** — M3 through M20 metric threads
- **Nuts** — matching hex nuts for all bolt sizes
- **Standoffs** — hex or round standoffs with threaded ends
- **Snap-fit clips** — cantilever snap-fit joints for enclosures
- **Thread pitch** — standard or custom pitch values

## Texture Surface

Generate embossed texture patterns for surfaces:

| Pattern | Description |
|---------|-------------|
| Diamond plate | Industrial diamond tread plate |
| Knurl | Straight or diagonal knurling |
| Honeycomb | Hexagonal honeycomb grid |
| Waves | Sinusoidal wave pattern |
| Brick | Brick wall pattern |
| Carbon fiber | Woven carbon fiber texture |
| Dots | Regular dot array |
| Crosshatch | Crossed diagonal lines |

All patterns support adjustable depth, spacing, and tile size.

## 3MF Validator

Validate 3MF files for correctness and compatibility:

- **File validation** — check 3MF structure against the specification
- **Mesh integrity** — detect non-manifold edges, flipped normals, and degenerate triangles
- **Extension detection** — identify 3MF extensions used (production, materials, beam lattice)
- **Color matching** — compare model colors against your spool inventory
- **Report** — detailed validation summary with warnings and errors

---

## Workflow

1. Open **Model Forge** from the sidebar
2. Select a tool
3. Configure parameters using the live 3D preview
4. Click **Generate** to create the 3MF file
5. **Download** the file or **Send to Library** to store it
6. From the library, use **Send to Printer** or **Add to Queue**

:::tip Preview
All tools show a live Three.js 3D preview as you adjust parameters. Rotate and zoom the preview to check the result before generating.
:::
