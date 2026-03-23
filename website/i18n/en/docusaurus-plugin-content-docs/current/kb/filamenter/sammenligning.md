---
sidebar_position: 9
title: Material Comparison
description: Compare all 3D printing materials side by side — strength, temperature, price, difficulty
---

# Material Comparison

Choosing the right filament is just as important as choosing the right tool for a job. This article gives you the full picture — from a simple comparison table to Shore hardness, HDT values and a practical decision guide.

## Full Comparison Table

| Material | Strength | Temp Res | Flexibility | UV Res | Chemical Res | Nozzle Req | Enclosure | Difficulty | Price |
|---|---|---|---|---|---|---|---|---|---|
| PLA | ★★★ | ★ | ★ | ★ | ★ | Brass | No | ★ Easy | Low |
| PETG | ★★★ | ★★ | ★★ | ★★ | ★★★ | Brass | No | ★★ | Low |
| ABS | ★★★ | ★★★ | ★★ | ★ | ★★ | Brass | YES | ★★★ | Low |
| ASA | ★★★ | ★★★ | ★★ | ★★★★ | ★★ | Brass | YES | ★★★ | Medium |
| TPU | ★★ | ★★ | ★★★★★ | ★★ | ★★ | Brass | No | ★★★ | Medium |
| PA (Nylon) | ★★★★ | ★★★ | ★★★ | ★★ | ★★★★ | Brass | YES | ★★★★ | High |
| PA-CF | ★★★★★ | ★★★★ | ★★ | ★★★ | ★★★★ | Hardened steel | YES | ★★★★ | High |
| PC | ★★★★ | ★★★★ | ★★ | ★★ | ★★★ | Brass | YES | ★★★★ | High |
| PLA-CF | ★★★★ | ★★ | ★ | ★ | ★ | Hardened steel | No | ★★ | Medium |

**Key:**
- ★ = weak/low/poor
- ★★★ = medium/standard
- ★★★★★ = excellent/best in class

---

## Choose the Right Material — Decision Guide

Not sure what to choose? Follow these questions:

### Does it need to withstand heat?
**Yes** → ABS, ASA, PC or PA

- Some heat (up to ~90 °C): **ABS** or **ASA**
- High heat (above 100 °C): **PC** or **PA**
- Maximum temperature resistance: **PC** (up to ~120 °C) or **PA-CF** (up to ~160 °C)

### Does it need flexibility?
**Yes** → **TPU**

- Very soft (like rubber): TPU 85A
- Standard flexible: TPU 95A
- Semi-flexible: PETG or PA

### Will it be used outdoors?
**Yes** → **ASA** is the clear choice

ASA is developed specifically for UV exposure and is superior to ABS outdoors. PETG is the next best choice if ASA is not available.

### Does it need maximum strength?
**Yes** → **PA-CF** or **PC**

- Strongest lightweight composite: **PA-CF**
- Strongest pure thermoplastic: **PC**
- Good strength at lower price: **PA (Nylon)**

### Easiest possible printing?
→ **PLA**

PLA is the most forgiving material available. Lowest temperature, no enclosure requirements, minimal warping risk.

### Food contact?
→ **PLA** (with caveats)

PLA itself is not toxic, but:
- Use a stainless steel nozzle (not brass — may contain lead)
- FDM prints are never truly "food-safe" due to porous surface — bacteria can grow
- Avoid demanding environments (acids, hot water, dishwasher)
- PETG is a better option for single-use contact

---

## Shore Hardness Explained

Shore hardness is used to describe the hardness and stiffness of elastomers and plastic materials. For 3D printing it is particularly relevant for TPU and other flexible filaments.

### Shore A — Flexible Materials

The Shore A scale runs from 0 (extremely soft, almost like gel) to 100 (extremely hard rubber). Values above 90A start to approach rigid plastic materials.

| Shore A Value | Perceived Hardness | Example |
|---|---|---|
| 30A | Extremely soft | Silicone, jelly |
| 50A | Very soft | Soft rubber, earplugs |
| 70A | Soft | Car tire inner tube, running shoe midsole |
| 85A | Medium soft | Bicycle tire, soft TPU filament |
| 95A | Semi-rigid | Standard TPU filament |
| 100A ≈ 55D | Border between scales | — |

**TPU 95A** is the industry standard for 3D printing and provides a good balance between elasticity and printability. **TPU 85A** is very soft and requires more patience during printing.

### Shore D — Rigid Materials

Shore D is used for harder thermoplastics:

| Material | Approximate Shore D |
|---|---|
| PLA | ~80D |
| PETG | ~70D |
| ABS | ~75D |
| PC | ~80D |
| PA (Nylon) | ~70–75D |

:::tip Not the same scale
Shore A 95 and Shore D 40 are not the same even though the numbers may seem close. The scales are different and overlap only partially around the 100A/55D boundary. Always check which scale the supplier specifies.
:::

---

## Temperature Tolerances — HDT and VST

Knowing at what temperature a material starts to give way is critical for functional parts. Two standard measurements are used:

- **HDT (Heat Deflection Temperature)** — the temperature at which the material deflects 0.25 mm under a standardized load. Measure of service temperature under load.
- **VST (Vicat Softening Temperature)** — the temperature at which a standardized needle penetrates 1 mm into the material. Measure of absolute softening point without load.

| Material | HDT (°C) | VST (°C) | Practical Max Temp |
|---|---|---|---|
| PLA | 52–60 | 55–65 | ~50 °C |
| PETG | 70–80 | 75–85 | ~70 °C |
| ABS | 85–105 | 95–110 | ~90 °C |
| ASA | 90–105 | 95–108 | ~90 °C |
| TPU | 40–70 | varies | ~60 °C |
| PA (Nylon) | 70–180 | 180–220 | ~80–160 °C |
| PA-CF | 100–200 | 200–230 | ~100–180 °C |
| PC | 120–140 | 145–160 | ~120 °C |
| PLA-CF | 55–65 | 60–70 | ~55 °C |

:::warning PLA in hot environments
PLA parts in a car in summer is a recipe for disaster. The dashboard of a parked car can reach 80–90 °C. Use ABS, ASA or PETG for anything that may be left in sun or heat.
:::

:::info PA variants have very different properties
PA is a family of materials, not a single material. PA6 has a lower HDT (~70 °C), while PA12 and PA6-CF can be at 160–200 °C. Always check the datasheet for exactly the filament you are using.
:::

---

## Nozzle Requirements

### Brass Nozzle (Standard)

Works for all materials **without** carbon fiber or glass fiber fill:
- PLA, PETG, ABS, ASA, TPU, PA, PC, PVA
- Brass is soft and will wear quickly with abrasive materials

### Hardened Steel Nozzle (Required for Composites)

**REQUIRED** for:
- PLA-CF (carbon fiber PLA)
- PETG-CF
- PA-CF
- ABS-GF (glass fiber ABS)
- PPA-CF, PPA-GF
- All filaments with "-CF", "-GF", "-HF" or "carbon fiber" in the name

Hardened steel has lower thermal conductivity than brass — compensate with +5–10 °C on nozzle temperature.

:::danger Carbon fiber filaments destroy brass nozzles quickly
A brass nozzle can become noticeably worn after just a few hundred grams of CF filament. The result is gradual under-extrusion and inaccurate dimensions. Invest in hardened steel if you print composites.
:::

---

## Brief Material Overview by Use Case

| Use Case | Recommended Material | Alternative |
|---|---|---|
| Decoration, figures | PLA, PLA Silk | PETG |
| Functional indoor parts | PETG | PLA+ |
| Outdoor exposure | ASA | PETG |
| Flexible parts, cases | TPU 95A | TPU 85A |
| Engine bay, hot environments | PA-CF, PC | ABS |
| Light, rigid construction | PLA-CF | PA-CF |
| Support material (soluble) | PVA | HIPS |
| Food contact (limited) | PLA (stainless nozzle) | — |
| Maximum strength | PA-CF | PC |
| Transparent | PETG clear | PC clear |

See individual material articles for detailed information on temperature settings, troubleshooting and recommended profiles for Bambu Lab printers.
