---
sidebar_position: 10
title: Strømme med OBS
description: Sett opp Bambu Dashboard som overlay i OBS Studio for profesjonell 3D-print-streaming
---

# Strømme 3D-printing til OBS

Bambu Dashboard har et innebygd OBS-overlay som viser printer-status, fremdrift, temperaturer og kamerafeed direkte i strømmen din.

## Forutsetninger

- OBS Studio installert ([obsproject.com](https://obsproject.com))
- Bambu Dashboard kjørende og tilkoblet printer
- (Valgfritt) Bambu-kameraet aktivert for live-feed

## Steg 1 — OBS Browser Source

OBS har en innebygd **Browser Source** som viser en nettside direkte i scenen din.

**Legg til overlay i OBS:**

1. Åpne OBS Studio
2. Under **Kilder** (Sources), klikk **+**
3. Velg **Nettleser** (Browser)
4. Gi kilden et navn, f.eks. "Bambu Overlay"
5. Fyll inn:

| Innstilling | Verdi |
|-------------|-------|
| URL | `http://localhost:3000/obs/overlay` |
| Bredde | `1920` |
| Høyde | `1080` |
| FPS | `30` |
| Egendefinert CSS | Se under |

6. Huk av **Kontroller lyd via OBS**
7. Klikk **OK**

:::info Tilpass URL til din server
Kjøres dashboardet på en annen maskin enn OBS? Bytt ut `localhost` med serverens IP-adresse, f.eks. `http://192.168.1.50:3000/obs/overlay`
:::

## Steg 2 — Transparent bakgrunn

For at overlayet skal smelte inn i bildet må bakgrunnen være gjennomsiktig:

**I OBS Browser Source-innstillingene:**
- Huk av **Fjern bakgrunn** (Shutdown source when not visible / Remove background)

**Egendefinert CSS for å tvinge transparens:**
```css
body {
  background-color: rgba(0, 0, 0, 0) !important;
  margin: 0;
  overflow: hidden;
}
```

Lim dette inn i feltet **Egendefinert CSS** i Browser Source-innstillingene.

Overlayet viser nå kun selve widgeten — uten hvit eller svart bakgrunn.

## Steg 3 — Tilpasse overlayet

I Bambu Dashboard kan du konfigurere hva overlayet viser:

1. Gå til **Funksjoner → OBS-overlay**
2. Konfigurer:

| Innstilling | Alternativer |
|-------------|--------------|
| Posisjon | Øverst venstre, høyre, nedre venstre, høyre |
| Størrelse | Liten, medium, stor |
| Tema | Mørk, lys, gjennomsiktig |
| Aksentfarge | Velg farge som passer strømmens stil |
| Elementer | Velg hva som vises (se under) |

**Tilgjengelige overlay-elementer:**

- Printer-navn og status (online/printer/feil)
- Fremdriftslinje med prosent og tid igjen
- Filament og farge
- Dysetemperatur og platetemperatur
- Filament brukt (gram)
- AMS-oversikt (kompakt)
- Print Guard-status

3. Klikk **Forhåndsvis** for å se resultatet uten å bytte til OBS
4. Klikk **Lagre**

:::tip URL per printer
Har du flere printere? Bruk separate overlay-URLer:
```
/obs/overlay?printer=1
/obs/overlay?printer=2
```
:::

## Kamera-feed i OBS (separat kilde)

Bambu-kameraet kan legges til som en separat kilde i OBS — uavhengig av overlayet:

**Alternativ 1: Via dashboardets kamera-proxy**

1. Gå til **System → Kamera**
2. Kopier **RTSP- eller MJPEG-streamingens URL**
3. I OBS: Klikk **+** → **Mediakilde** (Media Source)
4. Lim inn URL-en
5. Huk av **Gjenta** (Loop) og deaktiver lokale filer

**Alternativ 2: Browser Source med kamera-visning**

1. I OBS: Legg til **Browser Source**
2. URL: `http://localhost:3000/obs/camera?printer=1`
3. Bredde/høyde: matcher kameraets oppløsning (1080p eller 720p)

Du kan nå plassere kamerafeeden fritt i scenen og legge overlayet oppå.

## Tips for god stream

### Oppsett for streamscene

En typisk scene for 3D-print-streaming:

```
┌─────────────────────────────────────────┐
│                                         │
│      [Kamera-feed fra printeren]        │
│                                         │
│  ┌──────────────────┐                  │
│  │ Bambu Overlay    │  ← Nedre venstre │
│  │ Print: Logo.3mf  │                  │
│  │ ████████░░ 82%   │                  │
│  │ 1t 24m igjen     │                  │
│  │ 220°C / 60°C     │                  │
│  └──────────────────┘                  │
└─────────────────────────────────────────┘
```

### Anbefalte innstillinger

| Parameter | Anbefalt verdi |
|-----------|---------------|
| Overlaystørrelse | Medium (ikke for dominerende) |
| Oppdateringsfrekvens | 30 FPS (matcher OBS) |
| Overlayposisjon | Nedre venstre (unngår ansikt/chat) |
| Fargetema | Mørk med blå aksent |

### Scener og scenebytte

Lag egne OBS-scener:

- **"Print pågår"** — kameravisning + overlay
- **"Pause / venter"** — statisk bilde + overlay
- **"Ferdig"** — resultatbilde + overlay som viser "Fullført"

Bytt mellom scener med tastatursnarvei i OBS eller via Scene Collection.

### Stabilisering av kamerabilde

Bambu-kameraet kan noen ganger fryse. I dashboardet under **System → Kamera**:
- Aktiver **Auto-reconnect** — dashboardet kobler seg opp igjen automatisk
- Sett **Reconnect-intervall** til 10 sekunder

### Lyd

3D-printere lager lyd — særlig AMS og kølling. Vurder:
- Plasser mikrofon unna printeren
- Legg til støyfilter på mikrofonen i OBS (Noise Suppression)
- Eller bruk bakgrunnsmusikk / chat-lyd i stedet

:::tip Automatisk scenebytte
OBS har innebygd støtte for scenebytte basert på titler. Kombiner med en Plugin (f.eks. obs-websocket) og Bambu Dashboard API for å bytte scene automatisk når print starter og stopper.
:::
