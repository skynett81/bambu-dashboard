---
sidebar_position: 6
title: Composite Materials (CF/GF)
description: Carbon fiber and glass fiber filled filaments — hardened steel nozzle, wear, and settings
---

# Composite Materials (CF/GF)

Composite filaments contain short carbon fiber (CF) or glass fiber (GF) strands mixed into a base plastic such as PLA, PETG, PA, or ABS. They provide increased stiffness, reduced weight, and better dimensional stability.

## Available types

| Filament | Base | Stiffness | Weight reduction | Difficulty |
|----------|-------|---------|--------------|------------------|
| PLA-CF | PLA | High | Moderate | Easy |
| PETG-CF | PETG | High | Moderate | Moderate |
| PA6-CF | Nylon 6 | Very high | Good | Demanding |
| PA12-CF | Nylon 12 | Very high | Good | Moderate |
| ABS-CF | ABS | High | Moderate | Moderate |
| PLA-GF | PLA | High | Moderate | Easy |

## Hardened steel nozzle is required

:::danger Never use a brass nozzle with CF/GF
Carbon and glass fibers are highly abrasive. They will wear down a standard brass nozzle within hours to days. Always use a **hardened steel nozzle** (Hardened Steel) or **HS01 nozzle** with all CF and GF materials.

- Bambu Lab Hardened Steel Nozzle (0.4 mm)
- Bambu Lab HS01 Nozzle (special coating, longer lifespan)
:::

## Settings (PA-CF example)

| Parameter | Value |
|-----------|-------|
| Nozzle temperature | 270–290 °C |
| Bed temperature | 80–100 °C |
| Part cooling | 0–20% |
| Speed | 80% |
| Drying | 80 °C / 12 hours |

For PLA-CF: nozzle 220–230 °C, bed 35–50 °C — much easier than PA-CF.

## Build plates

| Plate | Suitability | Glue stick? |
|-------|---------|----------|
| Engineering Plate (Textured PEI) | Excellent | Yes (for PA base) |
| High Temp Plate | Good | Yes |
| Cool Plate | Avoid (CF scratches) | — |
| Textured PEI | Good | Yes |

:::warning Plate can be scratched
CF materials can scratch smooth plates during removal. Always use Engineering Plate or Textured PEI. Don't pull the print off — gently flex the plate instead.
:::

## Surface finish

CF filaments give a matte, carbon-like surface that doesn't need painting. The surface is slightly porous and can be impregnated with epoxy for a smoother finish.

## Wear and nozzle lifespan

| Nozzle type | Lifespan with CF | Cost |
|----------|---------------|---------|
| Brass (standard) | Hours–days | Low |
| Hardened steel | 200–500 hours | Moderate |
| HS01 (Bambu) | 500–1000 hours | High |

Replace the nozzle when visible wear is present: enlarged nozzle hole, thin walls, poor dimensional accuracy.

## Drying

CF variants of PA and PETG require drying just like their base material:
- **PLA-CF:** Drying recommended, but not critical
- **PETG-CF:** 65 °C / 6–8 hours
- **PA-CF:** 80 °C / 12 hours — critical
