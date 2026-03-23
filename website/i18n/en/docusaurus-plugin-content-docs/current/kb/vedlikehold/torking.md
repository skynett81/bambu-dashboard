---
sidebar_position: 5
title: Drying Filament
description: Why, when and how to dry filament — temperatures, times and storage tips for all materials
---

# Drying Filament

Moist filament is one of the most common and underestimated causes of poor prints. Even filament that looks dry can have absorbed enough moisture to ruin the result — especially for materials like nylon and PVA.

## Why Dry Filament?

Many plastic types are **hygroscopic** — they absorb moisture from the air over time. When moist filament passes through the hot nozzle, the water evaporates suddenly and creates micro-bubbles in the molten plastic. The result is:

- **Popping and crackling sounds** during printing
- **Haze or steam** visible from the nozzle
- **Stringing and hairing** that cannot be dialed out
- **Rough or grainy surface** — especially on top layers
- **Weak parts** with poor layer adhesion and micro-cracks
- **Matte or dull finish** on materials that should normally be glossy or silk

:::warning Dry filament BEFORE adjusting settings
Many users spend hours tweaking retraction and temperature without seeing improvement — because the cause is moist filament. Always dry the filament and retest before changing print settings.
:::

## Which Materials Need Drying?

All plastic types can become moist, but the degree of hygroscopicity varies enormously:

| Material | Hygroscopic | Drying Temp | Drying Time | Priority |
|---|---|---|---|---|
| PLA | Low | 45–50 °C | 4–6 hours | Optional |
| PETG | Medium | 65 °C | 4–6 hours | Recommended |
| ABS | Medium | 65–70 °C | 4 hours | Recommended |
| TPU | Medium | 50–55 °C | 4–6 hours | Recommended |
| ASA | Medium | 65 °C | 4 hours | Recommended |
| PC | High | 70–80 °C | 6–8 hours | Required |
| PA/Nylon | Extremely high | 70–80 °C | 8–12 hours | REQUIRED |
| PA-CF | Extremely high | 70–80 °C | 8–12 hours | REQUIRED |
| PVA | Extremely high | 45–50 °C | 4–6 hours | REQUIRED |

:::tip Nylon and PVA are critical
PA/Nylon and PVA can absorb enough moisture to become unprintable within **a few hours** in normal indoor conditions. Never open a new spool of these materials without drying it right away — and always print from a sealed box or drying box.
:::

## Signs of Moist Filament

You don't always need to dry filament according to a table. Learn to recognize the symptoms:

| Symptom | Moisture? | Other Possible Causes |
|---|---|---|
| Crackling/popping sounds | Yes, very likely | Partially blocked nozzle |
| Haze/steam from nozzle | Yes, almost certain | No other cause |
| Rough, grainy surface | Yes, possible | Temperature too low, speed too high |
| Stringing that won't go away | Yes, possible | Wrong retraction, temperature too high |
| Weak, brittle parts | Yes, possible | Temperature too low, wrong infill |
| Color change or matte finish | Yes, possible | Wrong temp, burnt plastic |

## Drying Methods

### Filament Dryer (Recommended)

Dedicated filament dryers are the simplest and safest solution. They maintain accurate temperature and let you print directly from the dryer for the entire job.

Popular models:
- **eSun eBOX** — affordable, can print from the box, supports most materials
- **Bambu Lab Filament Dryer** — optimized for Bambu AMS, supports high temperatures
- **Polymaker PolyDryer** — good thermometer and good temperature control
- **Sunlu S2 / S4** — budget-friendly, multiple spools at once

Procedure:
```
1. Place spools in the dryer
2. Set temperature from the table above
3. Set timer to recommended time
4. Wait — do not cut the process short
5. Print directly from the dryer or seal immediately
```

### Food Dehydrator

A standard food dehydrator works surprisingly well as a filament dryer:

- Affordable (available from ~$30)
- Good air circulation
- Supports temperatures up to 70–75 °C on many models

:::warning Check the max temperature of your dehydrator
Many cheap food dehydrators have inaccurate thermostats and can vary ±10 °C. Measure the actual temperature with a thermometer for PA and PC which require high heat.
:::

### Oven

The oven can be used in a pinch, but requires care:

:::danger NEVER use a regular oven above 60 °C for PLA — it will deform!
PLA starts to soften at 55–60 °C. A hot oven can destroy spools, melt the core and make the filament unusable. Never use the oven for PLA unless you know the temperature is accurately calibrated and below 50 °C.
:::

For materials that tolerate higher temperatures (ABS, ASA, PA, PC):
```
1. Preheat oven to desired temperature
2. Use a thermometer to verify actual temperature
3. Place spools on a rack (not directly on oven floor)
4. Leave the door slightly ajar to allow moisture to escape
5. Monitor the first time you use this method
```

### Bambu Lab AMS

Bambu Lab AMS Lite and AMS Pro have a built-in drying function (low heat + air circulation). This is not a replacement for full drying, but keeps already-dried filament dry during printing.

- AMS Lite: Passive drying — limits moisture absorption, does not actively dry
- AMS Pro: Active heating — some drying possible, but not as effective as a dedicated dryer

## Filament Storage

Proper storage after drying is just as important as the drying process itself:

### Best Solutions

1. **Dry cabinet with silica gel** — dedicated cabinet with hygrometer and desiccant. Keeps humidity consistently low (below 20% RH ideally)
2. **Vacuum bags** — remove air and seal with desiccant inside. Cheapest long-term storage
3. **Ziplock bags with desiccant** — simple and effective for shorter periods

### Silica Gel and Desiccant

- **Blue/orange silica gel** indicates saturation level — replace or regenerate (dry in oven at 120 °C) when color changes
- **Beaded silica gel** is more effective than granules
- **Desiccant packets** from filament manufacturers can be regenerated and reused

### Hygrometer in Storage Box

A cheap digital hygrometer shows current humidity in the box:

| Relative Humidity (RH) | Status |
|---|---|
| Below 15% | Ideal |
| 15–30% | Good for most materials |
| 30–50% | Acceptable for PLA and PETG |
| Above 50% | Problematic — especially for PA, PVA, PC |

## Practical Tips

- **Dry right BEFORE printing** — dried filament can become moist again within days in normal indoor conditions
- **Print from the dryer** for PA, PC and PVA — don't just dry and put away
- **New spool ≠ dry spool** — manufacturers seal with desiccant, but the supply chain may have failed. Always dry new spools of hygroscopic materials
- **Label dried spools** with the date of drying
- **Dedicated PTFE tube** from dryer to printer minimizes exposure during printing

## Bambu Dashboard and Drying Status

Bambu Dashboard lets you log filament information including the last drying date under filament profiles. Use this to keep track of which spools are freshly dried and which ones need another round.
