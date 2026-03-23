---
sidebar_position: 8
title: Print Profiles and Settings
description: Understand and customize print profiles in Bambu Studio — speed, temperature, retraction and quality settings
---

# Print Profiles and Settings

A print profile is a collection of settings that determine exactly how the printer works — from temperature and speed to retraction and layer height. The right profile is the difference between a perfect print and a failed one.

## What Is a Print Profile?

Bambu Studio distinguishes between three types of profiles:

- **Filament profile** — temperature, cooling, retraction and drying for a specific material
- **Process profile** — layer height, speed, infill and support settings
- **Printer profile** — machine-specific settings (set automatically for Bambu Lab printers)

Bambu Studio provides generic profiles for all Bambu Lab filaments and a range of third-party materials. Third-party suppliers like Polyalkemi, eSUN and Fillamentum also create optimized profiles fine-tuned for their specific filament.

Profiles can be imported, exported and shared freely between users.

## Importing Profiles in Bambu Studio

1. Download the profile (JSON file) from the supplier's website or MakerWorld
2. Open Bambu Studio
3. Go to **File → Import → Import configuration**
4. Select the downloaded file
5. The profile appears under filament selection in the slicer

:::tip Organization
Give profiles a descriptive name, e.g. "Polyalkemi PLA HF 0.20mm Balanced", so you can easily find the right profile next time.
:::

## Important Settings Explained

### Temperature

Temperature is the single most important setting. Too low a temperature causes poor layer adhesion and under-filling. Too high causes stringing, bubbly surface and burnt filament.

| Setting | Description | Typical PLA | Typical PETG | Typical ABS |
|---|---|---|---|---|
| Nozzle temperature | Melt temperature | 200–220 °C | 230–250 °C | 240–260 °C |
| Bed temperature | Build plate heat | 55–65 °C | 70–80 °C | 90–110 °C |
| Chamber temperature | Enclosure temp | Not needed | Optional | 40–60 °C recommended |

Bambu Lab X1C and P1-series have active chamber heating. For ABS and ASA this is critical to avoid warping and layer separation.

### Speed

Bambu Lab printers can run extremely fast, but higher speed does not always mean better results. The outer wall speed in particular affects the surface.

| Setting | What it affects | Quality Mode | Balanced | Fast |
|---|---|---|---|---|
| Outer wall | Surface result | 45–60 mm/s | 100 mm/s | 150+ mm/s |
| Inner wall | Structural strength | 100 mm/s | 150 mm/s | 200+ mm/s |
| Infill | Inner fill | 150 mm/s | 200 mm/s | 300+ mm/s |
| Top layer | Top surface | 45–60 mm/s | 80 mm/s | 100 mm/s |
| Bottom layer | First layer | 30–50 mm/s | 50 mm/s | 50 mm/s |

:::tip Outer wall speed is the key to surface quality
Lower the outer wall speed to 45–60 mm/s for a silky finish. This applies especially to Silk PLA and Matte filaments. Inner walls and infill can still run fast without affecting the surface.
:::

### Retraction

Retraction pulls the filament slightly back into the nozzle when the printer moves without extruding. This prevents stringing (fine threads between parts). Wrong retraction settings cause either stringing (too little) or jamming (too much).

| Material | Retraction Distance | Retraction Speed | Notes |
|---|---|---|---|
| PLA | 0.8–2.0 mm | 30–50 mm/s | Standard for most |
| PETG | 1.0–3.0 mm | 20–40 mm/s | Too much = jamming |
| ABS | 0.5–1.5 mm | 30–50 mm/s | Similar to PLA |
| TPU | 0–1.0 mm | 10–20 mm/s | Minimal! Or disable |
| Nylon | 1.0–2.0 mm | 30–40 mm/s | Requires dry filament |

:::warning TPU retraction
For TPU and other flexible materials: use minimal retraction (0–1 mm) or disable entirely. Too much retraction causes the soft filament to buckle and block in the Bowden tube, leading to jamming.
:::

### Layer Height

Layer height determines the balance between detail level and print speed. Low layer height gives finer detail and smoother surfaces, but takes much longer.

| Layer Height | Description | Use Case |
|---|---|---|
| 0.08 mm | Ultra fine | Miniature figures, detailed models |
| 0.12 mm | Fine | Visual quality, text, logos |
| 0.16 mm | High quality | Standard for most prints |
| 0.20 mm | Balanced | Good balance of time/quality |
| 0.28 mm | Fast | Functional parts, prototypes |

Bambu Studio operates with process settings such as "0.16mm High Quality" and "0.20mm Balanced Quality" — these set layer height and automatically adjust speed and cooling.

### Infill

Infill determines how much material fills the inside of the print. More infill = stronger, heavier and longer print time.

| Percent | Use Case | Recommended Pattern |
|---|---|---|
| 10–15% | Decoration, visual | Gyroid |
| 20–30% | General use | Cubic, Gyroid |
| 40–60% | Functional parts | Cubic, Honeycomb |
| 80–100% | Maximum strength | Rectilinear |

:::tip Gyroid is king
Gyroid pattern gives the best strength-to-weight ratio and is isotropic — equally strong in all directions. It is also faster to print than honeycomb and looks great on open models. Default choice for most situations.
:::

## Profile Tips per Material

### PLA — Quality Focus

PLA is forgiving and easy to work with. Focus on surface quality:

- **Outer wall:** 60 mm/s for a perfect surface, especially with Silk PLA
- **Cooling fan:** 100% after layer 3 — critical for sharp details and bridges
- **Brim:** Not needed on clean PLA with a properly calibrated plate
- **Layer height:** 0.16 mm High Quality gives a fine balance for decorative parts

### PETG — Balance

PETG is stronger than PLA but more demanding to fine-tune:

- **Process setting:** 0.16 mm High Quality or 0.20 mm Balanced Quality
- **Cooling fan:** 30–50% — too much cooling causes poor layer adhesion and brittle prints
- **Z-hop:** Enable to prevent the nozzle from dragging on the surface during travel moves
- **Stringing:** Adjust retraction and print slightly hotter rather than cooler

### ABS — Enclosure Is Everything

ABS prints well but requires a controlled environment:

- **Cooling fan:** OFF (0%) — absolutely critical! Cooling causes layer separation and warping
- **Enclosure:** Close the doors and let the chamber heat up to 40–60 °C before print starts
- **Brim:** 5–8 mm recommended for large flat parts — prevents warping at corners
- **Ventilation:** Ensure good room ventilation — ABS emits styrene fumes

### TPU — Slow and Careful

Flexible materials require a completely different approach:

- **Speed:** Max 30 mm/s — printing too fast causes the filament to buckle
- **Retraction:** Minimal (0–1 mm) or disable entirely
- **Direct drive:** TPU works only on Bambu Lab machines with built-in direct drive
- **Layer height:** 0.20 mm Balanced gives good layer fusion without too much stress

### Nylon — Dry Filament Is Everything

Nylon is hygroscopic and absorbs moisture within hours:

- **Always dry:** 70–80 °C for 8–12 hours before print
- **Enclosure:** Run from drying box directly into AMS to keep filament dry
- **Retraction:** Moderate (1.0–2.0 mm) — moist nylon produces much more stringing
- **Build plate:** Engineering Plate with glue, or Garolite plate for best adhesion

## Bambu Lab Built-in Presets

Bambu Studio has built-in profiles for the entire Bambu Lab product family:

- Bambu Lab Basic PLA, PETG, ABS, TPU, PVA, PA, PC, ASA
- Bambu Lab Support materials (Support W, Support G)
- Bambu Lab Specialty (PLA-CF, PETG-CF, ABS-GF, PA-CF, PPA-CF, PPA-GF)
- Generic profiles (Generic PLA, Generic PETG, etc.) that serve as a starting point for third-party filament

Generic profiles are a good starting point. Fine-tune temperature by ±5 °C based on the actual filament.

## Third-Party Profiles

Many leading suppliers offer ready-made Bambu Studio profiles optimized for their specific filament:

| Supplier | Available Profiles | Download |
|---|---|---|
| [Polyalkemi](https://polyalkemi.no) | PLA, PLA High Speed, PETG, PETG-CF, ABS | [Bambu Lab profiles](https://gammel.polyalkemi.no/bambulabprofiler/) |
| [eSUN](https://www.esun3d.com) | PLA+, ePLA-Lite, PETG, eABS | [eSUN profiles](https://www.esun3d.com/bambu-lab-3d-printer-filament-setting/) |
| [Fillamentum](https://fillamentum.com) | Nonoilen PLA, PLA, PET-G | [Fillamentum profiles](https://fillamentum.com/pages/bambu-lab-print-profiles) |
| [Spectrum](https://spectrumfilaments.com) | PETG FR V0, PETG-HT100 | [Spectrum profiles](https://spectrumfilaments.com/bambu-lab-profiles/) |
| [Fiberlogy](https://fiberlogy.com) | Easy-PETG, Matte-PETG, TPU 30D | [Fiberlogy profiles](https://fiberlogy.com/en/printing-profiles/) |
| [add:north](https://addnorth.com) | PLA, PETG, AduraX, X-PLA | [add:north profiles](https://addnorth.com/printing-profiles) |

:::info Where to find profiles?
- **Bambu Studio:** Built-in profiles for Bambu Lab materials and many third parties
- **Supplier website:** Search for "Bambu Studio profile" or "JSON profile" under downloads
- **Bambu Dashboard:** Under the Print Profiles panel in the Tools section
- **MakerWorld:** Profiles are often shared along with models by other users
:::

## Exporting and Sharing Profiles

Custom profiles can be exported and shared with others:

1. Go to **File → Export → Export configuration**
2. Select which profiles (filament, process, printer) you want to export
3. Save as JSON file
4. Share the file directly or upload to MakerWorld

This is especially useful if you have fine-tuned a profile over time and want to preserve it when reinstalling Bambu Studio.

---

## Troubleshooting with Profiles

### Stringing

Fine threads between printed parts — try in this order:

1. Increase retraction distance by 0.5 mm
2. Lower print temperature by 5 °C
3. Enable "Wipe on retract"
4. Check that filament is dry

### Under-filling / Gaps in Walls

The print does not look solid or has gaps:

1. Check that filament diameter setting is correct (1.75 mm)
2. Calibrate flow rate in Bambu Studio (Calibration → Flow Rate)
3. Increase temperature by 5 °C
4. Check for partially blocked nozzle

### Poor Layer Adhesion

Layers do not hold together well:

1. Increase temperature by 5–10 °C
2. Reduce cooling fan (especially PETG and ABS)
3. Reduce print speed
4. Check that enclosure is warm enough (for ABS/ASA)
