---
sidebar_position: 7
title: Specialty Materials
description: ASA, PC, PP, PVA, HIPS and other specialty materials for advanced use cases
---

# Specialty Materials

Beyond the common materials, there are a number of specialty materials for specific use cases — from UV-resistant outdoor parts to water-soluble support material. Here is a practical overview.

---

## ASA (Acrylonitrile Styrene Acrylate)

ASA is the best alternative to ABS for outdoor use. It prints almost identically to ABS but handles sunlight and weather far better.

### Settings

| Parameter | Value |
|-----------|-------|
| Nozzle temperature | 240–260 °C |
| Bed temperature | 90–110 °C |
| Chamber temperature | 45–55 °C |
| Part cooling | 0–20% |
| Drying | Recommended (70 °C / 4–6 h) |

### Properties

- **UV resistant:** Designed specifically for prolonged sun exposure without yellowing or cracking
- **Heat stable:** Glass transition temperature ~100 °C
- **Impact resistant:** Better impact resistance than ABS
- **Enclosure required:** Warps the same way as ABS — X1C/P1S gives the best results

:::tip ASA instead of ABS outdoors
Will the part live outdoors in harsh weather (sun, rain, frost)? Choose ASA over ABS. ASA withstands many years without visible degradation. ABS starts to crack and yellow within months.
:::

### Use Cases
- Outdoor brackets, enclosures and mounting points
- Car body parts, antenna mounts
- Garden furniture and outdoor environments
- Signage and dispensers on the outside of buildings

---

## PC (Polycarbonate)

Polycarbonate is one of the strongest and most impact-resistant plastics that can be 3D printed. It is transparent and withstands extreme temperatures.

### Settings

| Parameter | Value |
|-----------|-------|
| Nozzle temperature | 260–310 °C |
| Bed temperature | 100–120 °C |
| Chamber temperature | 50–70 °C |
| Part cooling | 0–20% |
| Drying | Required (80 °C / 8–12 h) |

:::danger PC requires all-metal hotend and high temperature
PC does not melt at standard PLA temperatures. Bambu X1C with the correct nozzle setup handles PC. Always check that the PTFE components in the hotend can handle your temperature — standard PTFE cannot handle above 240–250 °C continuously.
:::

### Properties

- **Highly impact resistant:** Resistant to breakage even at low temperatures
- **Transparent:** Can be used for windows, lenses and optical components
- **Heat stable:** Glass transition temperature ~147 °C — highest of common materials
- **Hygroscopic:** Absorbs moisture quickly — always dry thoroughly
- **Warping:** Strong shrinkage — requires enclosure and brim

### Use Cases
- Safety visors and protective covers
- Electrical enclosures that withstand heat
- Lens holders and optical components
- Robot frames and drone bodies

---

## PP (Polypropylene)

Polypropylene is one of the most difficult materials to print, but offers unique properties that no other plastic material can match.

### Settings

| Parameter | Value |
|-----------|-------|
| Nozzle temperature | 220–250 °C |
| Bed temperature | 80–100 °C |
| Part cooling | 20–50% |
| Drying | Recommended (70 °C / 6 h) |

### Properties

- **Chemically resistant:** Withstands strong acids, bases, alcohol and most solvents
- **Light and flexible:** Low density, withstands repeated bending (living hinge effect)
- **Poor adhesion:** Adheres poorly to itself and to the build plate — that is the challenge
- **Non-toxic:** Safe for food contact (depending on color and additives)

:::warning PP adheres poorly to everything
PP is notorious for not adhering to the build plate. Use PP tape (such as Tesa tape or dedicated PP tape) on the Engineering Plate, or use glue stick specially formulated for PP. Brim of 15–20 mm is required.
:::

### Use Cases
- Laboratory bottles and chemical containers
- Food storage parts and kitchen utensils
- Living hinges (box lids that withstand thousands of open/close cycles)
- Automotive components that withstand chemicals

---

## PVA (Polyvinyl Alcohol) — Water-Soluble Support Material

PVA is a specialty material used exclusively as support material. It dissolves in water and leaves a clean surface on the model.

### Settings

| Parameter | Value |
|-----------|-------|
| Nozzle temperature | 180–220 °C |
| Bed temperature | 35–60 °C |
| Drying | Critical (55 °C / 6–8 h) |

:::danger PVA is extremely hygroscopic
PVA absorbs moisture faster than any other common filament. Dry PVA thoroughly BEFORE printing, and always store in a sealed box with silica. Moist PVA gets stuck in the nozzle and is very difficult to remove.
:::

### Use and Dissolution

1. Print model with PVA as support material (requires multi-material printer — AMS)
2. Place finished print in warm water (30–40 °C)
3. Let stand for 30–120 minutes, change water as needed
4. Rinse with clean water and let dry

**Always use a dedicated extruder for PVA** if possible — PVA residue in a standard extruder can ruin the next print.

### Use Cases
- Complex support structures that are impossible to remove manually
- Internal overhang support without visible surface marks
- Models with cavities and internal channels

---

## HIPS (High Impact Polystyrene) — Solvent-Soluble Support Material

HIPS is another support material, designed to be used with ABS. It dissolves in **limonene** (citrus solvent).

### Settings

| Parameter | Value |
|-----------|-------|
| Nozzle temperature | 220–240 °C |
| Bed temperature | 90–110 °C |
| Chamber temperature | 45–55 °C |
| Drying | Recommended (65 °C / 4–6 h) |

### Use with ABS

HIPS prints at the same temperatures as ABS and adheres well to it. After printing, HIPS is dissolved by placing the print in D-limonene for 30–60 minutes.

:::warning Limonene is not water
D-limonene is a solvent extracted from orange peel. It is relatively harmless, but wear gloves and work in a ventilated area. Do not pour used limonene down the drain — dispose of at a recycling facility.
:::

### Comparison: PVA vs HIPS

| Property | PVA | HIPS |
|----------|-----|------|
| Solvent | Water | D-limonene |
| Compatible material | PLA-compatible | ABS-compatible |
| Moisture sensitivity | Extremely high | Moderate |
| Cost | High | Moderate |
| Availability | Good | Moderate |

---

## PVB / Fibersmooth — Alcohol-Smoothable Material

PVB (Polyvinyl Butyral) is a unique material that can be **smoothed with ethanol (alcohol)** — similar to how ABS can be smoothed with acetone, but much safer.

### Settings

| Parameter | Value |
|-----------|-------|
| Nozzle temperature | 190–210 °C |
| Bed temperature | 35–55 °C |
| Part cooling | 80–100% |
| Drying | Recommended (55 °C / 4 h) |

### Ethanol Smoothing

1. Print the model on standard PVB settings
2. Brush on 99% isopropyl alcohol (IPA) or ethanol with a paintbrush
3. Let dry for 10–15 minutes — the surface flows out evenly
4. Repeat if needed for a smoother surface
5. Alternatively: brush on and place in a sealed container for 5 minutes for vapor treatment

:::tip Safer than acetone
IPA/ethanol is far safer to handle than acetone. The flash point is higher and the fumes are far less toxic. Good ventilation is still recommended.
:::

### Use Cases
- Figurines and decoration where a smooth surface is desired
- Prototypes to be presented
- Parts to be painted — smooth surface gives better paint adhesion

---

## Recommended Build Plates for Specialty Materials

| Material | Recommended Plate | Glue Stick? |
|----------|------------------|-------------|
| ASA | Engineering Plate / High Temp Plate | Yes |
| PC | High Temp Plate | Yes (required) |
| PP | Engineering Plate + PP tape | PP-specific tape |
| PVA | Cool Plate / Textured PEI | No |
| HIPS | Engineering Plate / High Temp Plate | Yes |
| PVB | Cool Plate / Textured PEI | No |
