---
sidebar_position: 6
title: Flere printere
description: Sett opp og administrer flere Bambu-printere i Bambu Dashboard — flåteoversikt, kø og staggered start
---

# Flere printere

Har du mer enn én printer? Bambu Dashboard er bygget for flåtehåndtering — du kan overvåke, styre og koordinere alle printerene fra ett sted.

## Legge til en ny printer

1. Gå til **Innstillinger → Printere**
2. Klikk **+ Legg til printer**
3. Fyll inn:

| Felt | Eksempel | Forklaring |
|------|----------|------------|
| Enhetsnummer (SN) | 01P... | Finnes i Bambu Handy eller på printerens skjerm |
| IP-adresse | 192.168.1.101 | For LAN-modus (anbefalt) |
| Tilgangskode | 12345678 | 8-sifret kode på printerens skjerm |
| Navn | "Bambu #2 - P1S" | Vises i dashboardet |
| Modell | P1P, P1S, X1C, A1 | Velg riktig modell for riktige ikoner og funksjoner |

4. Klikk **Test tilkobling** — du bør se grønn status
5. Klikk **Lagre**

:::tip Gi printerene beskrivende navn
"Bambu 1" og "Bambu 2" er forvirrende. Bruk navn som "X1C - Produksjon" og "P1S - Prototyper" for å holde oversikten.
:::

## Flåteoversikten

Etter at alle printerene er lagt til, vises de samlet i **Flåte**-panelet. Her ser du:

```
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│ X1C - Produksjon│  │ P1S - Prototyper│  │ A1 - Hobbyrom   │
│ ████████░░ 82%  │  │ Ledig           │  │ ████░░░░░░ 38%  │
│ 1t 24m igjen    │  │ Klar for print  │  │ 3t 12m igjen    │
│ Temp: 220/60°C  │  │ AMS: 4 spoler   │  │ Temp: 235/80°C  │
└─────────────────┘  └─────────────────┘  └─────────────────┘
```

Du kan:
- Klikke på en printer for full detaljvisning
- Se alle temperaturer, AMS-status og aktive feil på én gang
- Filtrere på status (aktive prints, ledige, feil)

## Utskriftskø — fordele arbeid

Utskriftskøen lar deg planlegge prints for alle printerene fra ett sted.

**Slik fungerer det:**
1. Gå til **Kø**
2. Klikk **+ Legg til jobb**
3. Velg fil og innstillinger
4. Velg printer, eller velg **Automatisk tildeling**

### Automatisk tildeling
Med automatisk tildeling velger dashboardet printer basert på:
- Ledig kapasitet
- Filament tilgjengelig i AMS
- Planlagte vedlikeholdsvindu

Aktiver under **Innstillinger → Kø → Automatisk tildeling**.

### Prioritering
Dra og slipp jobber i køen for å endre rekkefølge. En jobb med **Høy prioritet** hopper foran vanlige jobber.

## Staggered start — unngå strømtopp

Hvis du starter mange printere samtidig, kan oppvarmingsfasen gi en kraftig strømtopp. Staggered start fordeler oppstarten:

**Slik aktiverer du det:**
1. Gå til **Innstillinger → Flåte → Staggered start**
2. Aktiver **Fordelt oppstart**
3. Sett forsinkelse mellom printere (anbefalt: 2–5 minutter)

**Eksempel med 3 printere og 3 minutters forsinkelse:**
```
kl. 08:00 — Printer 1 starter oppvarming
kl. 08:03 — Printer 2 starter oppvarming
kl. 08:06 — Printer 3 starter oppvarming
```

:::tip Relevant for sikringsstørrelse
En X1C trekker ca. 1000W under oppvarming. Tre printere samtidig = 3000W, noe som kan utløse 16A-sikringen. Staggered start eliminerer problemet.
:::

## Printergrupper

Printergrupper lar deg organisere printere logisk og sende kommandoer til hele gruppen:

**Opprette en gruppe:**
1. Gå til **Innstillinger → Printergrupper**
2. Klikk **+ Ny gruppe**
3. Gi gruppen et navn (f.eks. "Produksjonsgulv", "Hobbyrom")
4. Legg til printere i gruppen

**Gruppefunksjoner:**
- Se samlet statistikk for gruppen
- Send pausekommando til hele gruppen samtidig
- Sett vedlikeholdsvindu for gruppen

## Overvåke alle printerene

### Flervisning-kamera
Gå til **Flåte → Kameravisning** for å se alle kamera-feeds side om side:

```
┌──────────────┐  ┌──────────────┐
│  X1C Feed    │  │  P1S Feed    │
│  [Live]      │  │  [Ledig]     │
└──────────────┘  └──────────────┘
┌──────────────┐  ┌──────────────┐
│  A1 Feed     │  │  + Legg til  │
│  [Live]      │  │              │
└──────────────┘  └──────────────┘
```

### Varsler per printer
Du kan konfigurere forskjellige varslingsregler for ulike printere:
- Produksjonsprinter: varsle alltid, inkludert natt
- Hobbyprinter: varsle kun dagtid

Se [Varsler](./varsler-oppsett) for oppsett.

## Tips for flåtedrift

- **Standardiser filamentspor**: Hold PLA hvit i spor 1, PLA svart i spor 2 på alle printere — da er jobbfordelingen enklere
- **Sjekk AMS-nivåer daglig**: Se [Daglig bruk](./daglig-bruk) for morgenrutine
- **Vedlikehold på rullering**: Ikke vedlikehold alle printere samtidig — hold alltid minst én aktiv
- **Navngi filer tydelig**: Filnavn som `logo_x1c_pla_0.2mm.3mf` gjør det enkelt å velge riktig printer
