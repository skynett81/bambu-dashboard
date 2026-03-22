---
sidebar_position: 8
title: Navigere i dashboardet
description: Lær å navigere i Bambu Dashboard — sidepanel, paneler, tastatursnarvei og tilpasning
---

# Navigere i dashboardet

Denne guiden gir deg en rask innføring i hvordan dashboardet er organisert, og hvordan du navigerer effektivt.

## Sidepanelet

Sidepanelet til venstre er ditt navigasjonssenter. Det er organisert i seksjoner:

```
┌────────────────────┐
│ 🖨  Printerstatuser │  ← Én rad per printer
├────────────────────┤
│ Oversikt           │
│ Flåte              │
│ Aktiv print        │
├────────────────────┤
│ Filament           │
│ Historikk          │
│ Prosjekter         │
│ Kø                 │
│ Planlegger         │
├────────────────────┤
│ Overvåking         │
│  └ Print Guard     │
│  └ Feil            │
│  └ Diagnostikk     │
│  └ Vedlikehold     │
├────────────────────┤
│ Analyse            │
│ Verktøy            │
│ Integrasjoner      │
│ System             │
├────────────────────┤
│ ⚙ Innstillinger    │
└────────────────────┘
```

**Sidepanelet kan skjules** ved å klikke på hamburger-ikonet (☰) øverst til venstre. Nyttig på mindre skjermer eller kiosk-modus.

## Hovedpanelet

Når du klikker på et element i sidepanelet, vises innholdet i hovedpanelet til høyre. Layouten varierer:

| Panel | Layout |
|-------|--------|
| Oversikt | Kort-grid med alle printere |
| Aktiv print | Stort detaljkort + temperaturkurver |
| Historikk | Filtrerbar tabell |
| Filament | Kortvisning med spoler |
| Analyse | Grafer og diagrammer |

## Klikke på printerstatus for detaljer

Printerkortet på oversiktspanelet er klikkbart:

**Enkelt klikk** → Åpner detaljpanelet for den printeren:
- Sanntids temperaturer
- Aktiv print (hvis i gang)
- AMS-status med alle spor
- Siste feil og hendelser
- Rask-knapper: Pause, Stopp, Lykt av/på

**Klikk på kamera-ikonet** → Åpner live kameravisning

**Klikk på ⚙-ikonet** → Printerinnstillinger

## Tastatursnarvei — kommandopaletten

Kommandopaletten gir rask tilgang til alle funksjoner uten å navigere:

| Snarvei | Handling |
|---------|----------|
| `Ctrl + K` (Linux/Windows) | Åpne kommandopaletten |
| `Cmd + K` (macOS) | Åpne kommandopaletten |
| `Esc` | Lukk paletten |

I kommandopaletten kan du:
- Søke etter sider og funksjoner
- Starte en print direkte
- Pause / gjenoppta aktive prints
- Bytte tema (lys/mørk)
- Navigere til hvilken som helst side

**Eksempel:** Trykk `Ctrl+K`, skriv "pause" → velg "Pause alle aktive prints"

## Widget-tilpasning

Oversiktspanelet kan tilpasses med widgets du velger selv:

**Slik redigerer du dashboardet:**
1. Klikk **Rediger layout** (blyant-ikonet) øverst til høyre på oversiktspanelet
2. Dra widgets til ønsket posisjon
3. Klikk og dra i hjørnet av en widget for å endre størrelse
4. Klikk **+ Legg til widget** for å legge til nye:

Tilgjengelige widgets:

| Widget | Viser |
|--------|-------|
| Printerstatus | Kort for alle printere |
| Aktiv print (stor) | Detaljert visning av pågående print |
| AMS-oversikt | Alle spor og filamentnivåer |
| Temperaturkurve | Sanntidsgraf |
| Strømpris | Neste 24 timers prisgraf |
| Filament-meter | Totalt forbruk siste 30 dager |
| Historikk-snarvei | Siste 5 prints |
| Kamera-feed | Live kamerabilde |

5. Klikk **Lagre layout**

:::tip Lagre flere layouter
Du kan ha ulike layouter for ulike formål — en kompakt for daglig bruk, en stor for å henge på storskjerm. Bytt mellom dem med layoutvelgeren.
:::

## Tema — bytte mellom lys og mørk

**Rask bytting:**
- Klikk sol/måne-ikonet øverst til høyre i navigasjonen
- Eller: `Ctrl+K` → skriv "tema"

**Permanent innstilling:**
1. Gå til **System → Temaer**
2. Velg mellom:
   - **Lys** — hvit bakgrunn
   - **Mørk** — mørk bakgrunn (anbefalt om natten)
   - **Automatisk** — følger system-innstillingen på enheten din
3. Velg fargeaksent (blå, grønn, lilla osv.)
4. Klikk **Lagre**

## Tastaturnavigasjon

For effektiv navigasjon uten mus:

| Snarvei | Handling |
|---------|----------|
| `Tab` | Neste interaktivt element |
| `Shift+Tab` | Forrige element |
| `Enter` / `Space` | Aktiver knapp/lenke |
| `Esc` | Lukk modal/dropdown |
| `Ctrl+K` | Kommandopalett |
| `Alt+1` – `Alt+9` | Naviger direkte til de 9 første sidene |

## PWA — installer som app

Bambu Dashboard kan installeres som en progressiv web-app (PWA) og kjøre som en selvstendig app uten nettlesermenyer:

1. Gå til dashboardet i Chrome, Edge eller Safari
2. Klikk på **Installer app**-ikonet i adressefeltet
3. Bekreft installasjonen

Se [PWA-dokumentasjon](../system/pwa) for mer detaljer.

## Kiosk-modus

Kiosk-modus skjuler alt navigasjon og viser bare dashboardet — perfekt for en dedikert skjerm i printeverkstedet:

1. Gå til **System → Kiosk**
2. Aktiver **Kiosk-modus**
3. Velg hvilke widgets som skal vises
4. Sett oppdateringsintervall

Se [Kiosk-dokumentasjon](../system/kiosk) for fullstendig oppsett.
