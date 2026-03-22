---
sidebar_position: 4
title: Tema
description: Tilpass utseendet til Bambu Dashboard med lys/mørk/auto-modus, 6 fargepaletter og egendefinert aksentfarge
---

# Tema

Bambu Dashboard har et fleksibelt temasystem som lar deg tilpasse utseendet til din smak og brukssituasjon.

Gå til: **https://localhost:3443/#settings** → **Tema**

## Fargemodus

Velg mellom tre modi:

| Modus | Beskrivelse |
|---|---|
| **Lys** | Lys bakgrunn, mørk tekst — bra i godt opplyste rom |
| **Mørk** | Mørk bakgrunn, lys tekst — standard og anbefalt for monitoring |
| **Auto** | Følger operativsystemets innstilling (OS-mørkt/lyst) |

Endre modus øverst i temainnstillingene eller via hurtigtasten i navigasjonsfeltet (måne/sol-ikon).

## Fargepaletter

Seks forhåndsinnstilte fargepaletter er tilgjengelige:

| Palett | Primærfarge | Stil |
|---|---|---|
| **Bambu** | Grønn (#00C853) | Standard, inspirert av Bambu Lab |
| **Blå natt** | Blå (#2196F3) | Rolig og profesjonell |
| **Solnedgang** | Oransje (#FF6D00) | Varm og energisk |
| **Lilla** | Lilla (#9C27B0) | Kreativ og distinkt |
| **Rød** | Rød (#F44336) | Høy kontrast, iøynefallende |
| **Monokrom** | Grå (#607D8B) | Nøytral og minimalistisk |

Klikk på en palett for å forhåndsvise og aktivere den umiddelbart.

## Egendefinert aksentfarge

Bruk din helt egne farge som aksentfarge:

1. Klikk **Egendefinert farge** under palettvelgeren
2. Bruk fargevelgeren eller skriv inn en hex-kode (f.eks. `#FF5722`)
3. Forhåndsvisningen oppdateres i sanntid
4. Klikk **Bruk** for å aktivere

:::tip Kontrast
Sørg for at aksentfargen har god kontrast mot bakgrunnen. Systemet varsler hvis fargen kan gi lesbarhetsproblemer (WCAG AA-standard).
:::

## Avrunding

Juster avrundingen på knapper, kort og elementer:

| Innstilling | Beskrivelse |
|---|---|
| **Skarp** | Ingen avrunding (rektangulær stil) |
| **Liten** | Subtil avrunding (4 px) |
| **Medium** | Standard avrunding (8 px) |
| **Stor** | Tydelig avrunding (16 px) |
| **Pill** | Maksimal avrunding (50 px) |

Skyv glidebryteren for å justere manuelt mellom 0–50 px.

## Kompakthet

Tilpass tetthet i grensesnittet:

| Innstilling | Beskrivelse |
|---|---|
| **Romslig** | Mer luft mellom elementer |
| **Standard** | Balansert, standard innstilling |
| **Kompakt** | Tettere pakking — mer info på skjermen |

Kompakt modus anbefales for skjermer under 1080p eller kiosk-visning.

## Typografi

Velg skrifttype:

- **System** — bruker operativsystemets standardskrift (rask å laste)
- **Inter** — klar og moderne (standard valg)
- **JetBrains Mono** — monospace, god for dataverdier
- **Nunito** — mykere og mer avrundet stil

## Animasjoner

Skru av eller tilpass animasjoner:

- **Full** — alle overganger og animasjoner aktive (standard)
- **Redusert** — kun nødvendige animasjoner (respekterer OS-preferanse)
- **Av** — ingen animasjoner for maksimal ytelse

:::tip Kiosk-modus
For kiosk-visning, aktiver **Kompakt** + **Mørk** + **Reduserte animasjoner** for optimal ytelse og lesbarhet på avstand. Se [Kiosk-modus](./kiosk).
:::

## Eksport og import av temainnstillinger

Del temaet ditt med andre:

1. Klikk **Eksporter tema** — laster ned en `.json`-fil
2. Del filen med andre Bambu Dashboard-brukere
3. De importerer via **Importer tema** → velg filen
