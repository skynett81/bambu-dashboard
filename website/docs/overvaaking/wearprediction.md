---
sidebar_position: 5
title: Slitasjepredikasjon
description: Prediktiv analyse av 8 printerkomponenter med levetidsberegning, vedlikeholdsvarsler og kostnadsprognose
---

# Slitasjepredikasjon

Slitasjepredikasjonen beregner forventet levetid for kritiske komponenter basert på faktisk bruk, filamenttype og printeratferd — slik at du kan planlegge vedlikehold proaktivt fremfor reaktivt.

Gå til: **https://localhost:3443/#wear**

## Overvåkede komponenter

Bambu Dashboard sporer slitasje på 8 komponenter per printer:

| Komponent | Primær slitasjefaktor | Typisk levetid |
|---|---|---|
| **Dyse (messing)** | Filamenttype + timer | 300–800 timer |
| **Dyse (hardened)** | Timer + abrasivt materiale | 1500–3000 timer |
| **PTFE-rør** | Timer + høy temperatur | 500–1500 timer |
| **Extruder-tannhjul** | Timer + abrasivt materiale | 1000–2000 timer |
| **X-akse-stag (CNC)** | Antall prints + hastighet | 2000–5000 timer |
| **Byggplate-overflate** | Antall prints + temperatur | 200–500 prints |
| **AMS-tannhjul** | Antall filamentbytter | 5000–15000 bytter |
| **Kammervifter** | Timer i drift | 3000–8000 timer |

## Slitasjeberegning

Slitasje beregnes som en samlet prosent (0–100 % slitt):

```
Slitasje % = (faktisk bruk / forventet levetid) × 100
           × materialmultiplikator
           × hastighetsmultiplikator
```

**Materialmultiplikatorer:**
- PLA, PETG: 1.0× (normal slitasje)
- ABS, ASA: 1.1× (litt mer aggressiv)
- PA, PC: 1.2× (hard på PTFE og dyse)
- CF/GF-kompositter: 2.0–3.0× (svært abrasivt)

:::warning Karbonfiber
Karbonfiberforsterkede filamenter (CF-PLA, CF-PA, osv.) sliter ned messingdyser ekstremt raskt. Bruk hardened steel-dyse og forvent 2–3× raskere slitasje.
:::

## Levetidsberegning

For hver komponent vises:

- **Nåværende slitasje** — prosent brukt
- **Estimert gjenværende levetid** — timer eller prints
- **Estimert utløpsdato** — basert på siste 30 dagers gjennomsnittlig bruk
- **Konfidensintervall** — usikkerhetsmargin for prediksjonen

Klikk på en komponent for å se detaljert graf over slitasjeakkumulering over tid.

## Varsler

Konfigurer automatiske varsler per komponent:

1. Gå til **Slitasje → Innstillinger**
2. For hver komponent, sett **Varselterskel** (anbefalt: 75 % og 90 %)
3. Velg varselkanal (se [Varsler](../funksjoner/notifications))

**Eksempel på varselmelding:**
> ⚠️ Dyse (messing) på Min X1C er 78 % slitt. Estimert levetid: ~45 timer. Anbefalt: Planlegg dysebytte.

## Vedlikeholdskostnad

Slitasjemodulen integrerer med kostnadsloggen:

- **Kostnad per komponent** — pris på reservedel
- **Utskiftingskostnad total** — sum for alle komponenter som nærmer seg grensen
- **Prognose neste 6 måneder** — estimert vedlikeholdskostnad fremover

Angi komponentpriser under **Slitasje → Priser**:

1. Klikk **Sett priser**
2. Fyll inn pris per enhet for hver komponent
3. Prisen brukes i kostnadsprognoser og kan variere per printermodell

## Tilbakestille slitasjeteller

Etter vedlikehold, tilbakestill telleren for den aktuelle komponenten:

1. Gå til **Slitasje → [Komponentnavn]**
2. Klikk **Marker som erstattet**
3. Fyll inn:
   - Dato for bytte
   - Kostnad (valgfritt)
   - Notat (valgfritt)
4. Slitasjetelleren nullstilles og beregnes på nytt

Tilbakestillinger vises i vedlikeholdshistorikken.

:::tip Kalibrering
Sammenlikn slitasjepredikasjonen med faktisk erfaringsdata og juster levetidsparameterne under **Slitasje → Konfigurer levetid** for å tilpasse beregningene til din faktiske bruk.
:::
