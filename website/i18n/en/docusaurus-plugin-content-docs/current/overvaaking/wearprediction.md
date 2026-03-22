---
sidebar_position: 5
title: Wear Prediction
description: Predictive analysis of 8 printer components with lifetime calculations, maintenance alerts, and cost forecasts
---

# Wear Prediction

Wear prediction calculates the expected lifetime of critical components based on actual usage, filament type, and printer behavior — so you can plan maintenance proactively rather than reactively.

Go to: **https://localhost:3443/#wear**

## Monitored components

Bambu Dashboard tracks wear on 8 components per printer:

| Component | Primary wear factor | Typical lifetime |
|---|---|---|
| **Nozzle (brass)** | Filament type + hours | 300–800 hours |
| **Nozzle (hardened)** | Hours + abrasive material | 1500–3000 hours |
| **PTFE tube** | Hours + high temperature | 500–1500 hours |
| **Extruder gear** | Hours + abrasive material | 1000–2000 hours |
| **X-axis rod (CNC)** | Number of prints + speed | 2000–5000 hours |
| **Build plate surface** | Number of prints + temperature | 200–500 prints |
| **AMS gear** | Number of filament changes | 5000–15000 changes |
| **Chamber fans** | Operating hours | 3000–8000 hours |

## Wear calculation

Wear is calculated as a cumulative percentage (0–100% worn):

```
Wear % = (actual usage / expected lifetime) × 100
       × material multiplier
       × speed multiplier
```

**Material multipliers:**
- PLA, PETG: 1.0× (normal wear)
- ABS, ASA: 1.1× (slightly more aggressive)
- PA, PC: 1.2× (hard on PTFE and nozzle)
- CF/GF composites: 2.0–3.0× (highly abrasive)

:::warning Carbon fiber
Carbon fiber reinforced filaments (CF-PLA, CF-PA, etc.) wear down brass nozzles extremely quickly. Use a hardened steel nozzle and expect 2–3× faster wear.
:::

## Lifetime calculation

For each component, the following is shown:

- **Current wear** — percentage used
- **Estimated remaining lifetime** — hours or prints
- **Estimated expiry date** — based on average usage over the last 30 days
- **Confidence interval** — uncertainty margin for the prediction

Click on a component to see a detailed graph of wear accumulation over time.

## Alerts

Configure automatic alerts per component:

1. Go to **Wear → Settings**
2. For each component, set **Alert threshold** (recommended: 75% and 90%)
3. Select notification channel (see [Notifications](../funksjoner/notifications))

**Example alert message:**
> ⚠️ Nozzle (brass) on My X1C is 78% worn. Estimated lifetime: ~45 hours. Recommended: Plan nozzle replacement.

## Maintenance cost

The wear module integrates with the cost log:

- **Cost per component** — price of replacement part
- **Total replacement cost** — sum for all components approaching the limit
- **Forecast next 6 months** — estimated maintenance cost going forward

Enter component prices under **Wear → Prices**:

1. Click **Set prices**
2. Fill in the price per unit for each component
3. The price is used in cost forecasts and can vary per printer model

## Reset wear counter

After maintenance, reset the counter for the relevant component:

1. Go to **Wear → [Component name]**
2. Click **Mark as replaced**
3. Fill in:
   - Date of replacement
   - Cost (optional)
   - Note (optional)
4. The wear counter is reset and recalculated

Resets appear in the maintenance history.

:::tip Calibration
Compare the wear prediction with your actual experience and adjust the lifetime parameters under **Wear → Configure lifetime** to tailor the calculations to your actual usage.
:::
