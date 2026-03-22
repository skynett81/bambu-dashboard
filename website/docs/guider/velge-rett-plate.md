---
sidebar_position: 4
title: Velge rett byggplate
description: Oversikt over Bambu Labs byggplater og hvilken som passer best til ditt filament
---

# Velge rett byggplate

Riktig byggplate er avgjørende for god heft og enkelt fjerning av printen. Feil kombinasjon gir enten dårlig heft eller at printen sitter fast og skader platen.

## Oversiktstabell

| Filament | Anbefalt plate | Limstift | Platetemperatur |
|----------|---------------|----------|-----------------|
| PLA | Cool Plate / Textured PEI | Nei / Ja | 35–45°C |
| PETG | Textured PEI | **Ja (påkrevd)** | 70°C |
| ABS | Engineering Plate / High Temp | Ja | 90–110°C |
| ASA | Engineering Plate / High Temp | Ja | 90–110°C |
| TPU | Textured PEI | Nei | 35–45°C |
| PA (Nylon) | Engineering Plate | Ja | 90°C |
| PC | High Temp Plate | Ja | 100–120°C |
| PLA-CF / PETG-CF | Engineering Plate | Ja | 45–90°C |
| PVA | Cool Plate | Nei | 35°C |

## Platebeskrivelse

### Cool Plate (Glatt PEI)
**Beste for:** PLA, PVA
**Overflate:** Glatt, gir glatt underside på printen
**Fjerning:** Bøy platen lett eller vent til den kjøler ned — printen slipper av seg selv

Ikke bruk Cool Plate med PETG — det fester seg **for godt** og kan rive av belegg fra platen.

### Textured PEI (Mønstret)
**Beste for:** PETG, TPU, PLA (gir ru overflate)
**Overflate:** Mønstret, gir ru og estetisk underside
**Fjerning:** Vent til romtemperatur — sprekker av av seg selv

:::warning PETG krever limstift på Textured PEI
Uten limstift fester PETG seg ekstremt godt til Textured PEI og kan flekke av belegg ved fjerning. Påfør alltid et tynt lag limstift (Bambu-limstift eller Elmer's Disappearing Purple Glue) over hele overflaten.
:::

### Engineering Plate
**Beste for:** ABS, ASA, PA, PLA-CF, PETG-CF
**Overflate:** Har en matte PEI-overflate med lavere adhesjon enn Textured PEI
**Fjerning:** Let å fjerne etter avkjøling. Bruk limstift for ABS/ASA

### High Temp Plate
**Beste for:** PC, PA-CF, ABS ved høye temperaturer
**Overflate:** Tåler platetemp opp til 120°C uten deformasjon
**Fjerning:** Kjøl ned i romtemperatur

## Vanlige feil

### PETG på glatt Cool Plate (uten limstift)
**Problem:** PETG binder seg så sterkt at printen ikke kan fjernes uten skade
**Løsning:** Bruk alltid Textured PEI med limstift, eller Engineering Plate

### ABS på Cool Plate
**Problem:** Warping — hjørnene løfter seg under print
**Løsning:** Engineering Plate + limstift + heve kammertemperaturen (lukk frontluken)

### PLA på High Temp Plate
**Problem:** For høy plate-temp gir overdrevent god heft, vanskelig fjerning
**Løsning:** Cool Plate eller Textured PEI for PLA

### For mye limstift
**Problem:** Tykk limstift gir elefantfot (utflytende første lag)
**Løsning:** Ét tynt lag — limstiften skal knapt synes

## Bytte plate

1. **La platen avkjøle** til romtemperatur (eller bruk hansker — platen kan være varm)
2. Løft platen fra fronten og trekk ut
3. Legg inn ny plate — den magneten holder den på plass
4. **Kjør automatisk kalibrering** (Flow Rate og Bed Leveling) etter platebytte i Bambu Studio eller via dashboardet under **Kontroller → Kalibrering**

:::info Husk å kalibrere etter bytte
Platene har litt ulik tykkelse. Uten kalibrering kan første lag bli for langt unna eller krasje inn i platen.
:::

## Vedlikehold av plater

### Rengjøring (etter hver 2–5 prints)
- Tørk av med IPA (isopropanol 70–99%) og et lo-fritt tørkepapir
- Unngå å ta på overflaten med bare hender — fett fra huden reduserer heft
- For Textured PEI: vask med lunkent vann og mild oppvaskmiddel etter mange prints

### Fjerne limstiftrester
- Varm opp platen til 60°C
- Tørk av med fuktig klut
- Avslutt med IPA-tørk

### Utskifting
Bytt platen når du ser:
- Synlige groper eller merker etter fjerning av prints
- Konsekvent dårlig heft selv etter rengjøring
- Bobler eller flekker i belegget

Bambu-plater varer typisk 200–500 prints avhengig av filamenttype og behandling.

:::tip Lagre platene riktig
Oppbevar ubrukte plater i originalemballasjen eller stående i en holder — ikke stablet med tunge ting oppå. Deformerte plater gir ujevnt første lag.
:::
