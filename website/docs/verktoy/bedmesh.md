---
sidebar_position: 6
title: Bed Mesh
description: 3D-visualisering av byggplatens flathetskalibrering med heatmap, skanning fra UI og kalibreringsveiledning
---

# Bed Mesh

Bed mesh-verktøyet gir deg en visuell representasjon av byggplatens flathet — avgjørende for god heft og jevnt første lag.

Gå til: **https://localhost:3443/#bedmesh**

## Hva er bed mesh?

Bambu Lab-printere scanner byggplatens overflate med en probe og lager et kart (mesh) over høydeavvik. Printerens firmware kompenserer automatisk for avvik under printing. Bambu Dashboard visualiserer dette kartet for deg.

## Visualisering

### 3D-overflate

Bed mesh-kartet vises som en interaktiv 3D-overflate:

- Bruk musen til å rotere visningen
- Scroll for å zoome inn/ut
- Klikk **Topvisning** for fuglperspektiv
- Klikk **Sidevisning** for å se profilen

Fargeskalaen viser avvik fra gjennomsnittlig høyde:
- **Blå** — lavere enn senter (konkav)
- **Grønn** — tilnærmet flatt (< 0.1 mm avvik)
- **Gul** — moderat avvik (0.1–0.2 mm)
- **Rød** — høyt avvik (> 0.2 mm)

### Heatmap

Klikk **Heatmap** for en flat 2D-visning av mesh-kartet — enklere å lese for de fleste.

Heatmapen viser:
- Nøyaktige avviksverdier (mm) for hvert målepunkt
- Merkede problempunkter (avvik > 0.3 mm)
- Dimensjoner på målene (antall rader × kolonner)

## Skanne bed mesh fra UI

:::warning Krav
Skanningen krever at printeren er ledig og sengtemperaturen er stabilisert. Varm opp sengen til ønsket temperatur FØR skanning.
:::

1. Gå til **Bed Mesh**
2. Velg printer fra nedtrekkslisten
3. Klikk **Skann nå**
4. Velg sengtemperatur for skanningen:
   - **Kald** (romtemperatur) — rask, men mindre nøyaktig
   - **Varm** (50–60°C PLA, 70–90°C PETG) — anbefalt
5. Bekreft i dialogen — printeren starter automatisk probe-sekvensen
6. Vent til skanningen er ferdig (3–8 minutter avhengig av mesh-størrelse)
7. Det nye mesh-kartet vises automatisk

## Kalibreringsveiledning

Etter skanning gir systemet konkrete anbefalinger:

| Funn | Anbefaling |
|---|---|
| Avvik < 0.1 mm overalt | Utmerket — ingen handling nødvendig |
| Avvik 0.1–0.2 mm | Bra — kompensasjon håndteres av firmware |
| Avvik > 0.2 mm i hjørner | Juster sengfjærene manuelt (om mulig) |
| Avvik > 0.3 mm | Sengen kan være skadet eller feilmontert |
| Senter høyere enn hjørner | Termisk utvidelse — normal for varme senger |

:::tip Historisk sammenligning
Klikk **Sammenlign med forrige** for å se om mesh-kartet har endret seg over tid — nyttig for å oppdage at platen bøyer seg gradvis.
:::

## Mesh-historikk

Alle mesh-skanninger lagres med tidsstempel:

1. Klikk **Historikk** i bed mesh-sidepanelet
2. Velg to skanninger for å sammenligne dem (differansekart vises)
3. Slett gamle skanninger du ikke lenger trenger

## Eksport

Eksporter mesh-data som:
- **PNG** — bilde av heatmap (for dokumentasjon)
- **CSV** — rådata med X, Y og høydeavvik per punkt
