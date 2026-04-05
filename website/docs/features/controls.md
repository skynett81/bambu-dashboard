---
sidebar_position: 5
title: Printerkontroll
description: Styr temperatur, hastighet, vifter, kalibrering, kamera og send G-code direkte til Bambu Lab, Snapmaker og Moonraker-printere
---

# Printerkontroll

Kontrolipanelet gir deg full manuell kontroll over printeren direkte fra dashboardet.

## Temperaturstyring

### Dyse
- Angi måltemperatur mellom 0–350 °C
- Klikk **Sett** for å sende kommandoen
- Sanntids-avlesning vises med animert ring-måler

### Varmeseng
- Angi måltemperatur mellom 0–120 °C
- Automatisk slukking etter print (konfigurerbart)

### Kammer
- Se kammertemperatur (sanntidsavlesning)
- **X1E, H2S, H2D, H2C**: Aktiv kammervarmestyring via M141 (kontrollerbar måltemperatur)
- **X1C**: Passiv innhylling — kammertemperatur vises, men kan ikke styres direkte
- **P1S**: Passiv innhylling — viser temperatur, ingen aktiv kammervarmestyring
- **P1P, A1, A1 mini og H-serien uten chamberHeat**: Ingen kammersensor

:::warning Maks temperaturer
Overskrid ikke anbefalte temperaturer for dyse og seng. For herdet stål-dyse (HF-type): maks 300 °C. For messing: maks 260 °C. Se printerens manual.
:::

## Hastighetsprofiler

Hastighetskontrollen gir fire forhåndsinnstilte profiler:

| Profil | Hastighet | Bruksområde |
|--------|----------|-------------|
| Stille | 50% | Støyreduksjon, natt-printing |
| Standard | 100% | Normal bruk |
| Sport | 124% | Raskere prints |
| Turbo | 166% | Maks hastighet (kvalitetsfall) |

Skyveknappen lar deg sette en egendefinert prosent mellom 50–200%.

## Vifte-kontroll

Kontroller fan-hastigheter manuelt:

| Vifte | Beskrivelse | Område |
|-------|-------------|--------|
| Part cooling fan | Kjøler printet objekt | 0–100% |
| Auxiliary fan | Kammer-sirkulasjon | 0–100% |
| Chamber fan | Aktiv kammerkjøling | 0–100% |

:::tip Gode innstillinger
- **PLA/PETG:** Del-kjøling 100%, aux 30%
- **ABS/ASA:** Del-kjøling 0–20%, kammer-fan av
- **TPU:** Del-kjøling 50%, lav hastighet
:::

## G-code konsoll

Send G-code-kommandoer direkte til printeren:

```gcode
; Eksempel: Flytt hodeposisjon
G28 ; Home alle akser
G1 X150 Y150 Z10 F3000 ; Flytt til midten
M104 S220 ; Sett dysetemperatur
M140 S60  ; Sett sengtemperatur
```

:::danger Vær forsiktig med G-code
Feil G-code kan skade printeren. Send bare kommandoer du forstår. Unngå `M600` (filamentbytte) midt i en print.
:::

## Filament-operasjoner

Fra kontrollpanelet kan du:

- **Last filament** — varmer opp dysen og trekker inn filament
- **Avlast filament** — varmer opp og trekker ut filament
- **Rens dyse** — kjør rensesyklus

## Makroer

Lagre og kjør sekvenser av G-code-kommandoer som makroer:

1. Klikk **Ny makro**
2. Gi makroen et navn
3. Skriv G-code-sekvensen
4. Lagre og kjør med ett klikk

Eksempel-makro for sengkalibrering:
```gcode
G28
M84
M500
```

## Print-kontroll

Under aktiv print kan du:

- **Pause** — setter printen på pause etter gjeldende lag
- **Gjenoppta** — fortsetter en pauset print
- **Stopp** — avbryter printen (ikke reversibelt)
- **Nødstans** — umiddelbar stopp av alle motorer

## Bambu Lab — Kalibrering og system

### Kalibrerings-UI

Kjør kalibreringsprosedyrer direkte fra dashboardet:

- **Auto-kalibrering** — full kalibreringssyklus (vibrasjon, motor noise, bed leveling)
- **Bed leveling** — automatisk sengkalibrering
- **Vibrasjonskompensering** — input shaper-kalibrering
- **Flow-kalibrering** — korriger filamentflyt for bedre overflater
- **Toleranse-test** — sjekk printerens mekaniske presisjon

### Kamerastyring

- **Oppløsning** — bytt mellom SD/HD
- **Timelapse** — aktiver/deaktiver automatisk timelapse-opptak
- **LED-lys** — slå kammerlys av/på og juster lysstyrke
- **Eksponering** — juster kameraeksponering

### AMS-tørking

- Start og stopp AMS-tørkesyklus direkte fra dashboardet
- Overvåk fuktighet og temperatur under tørking
- Konfigurer tørketid og måltemperatur per materiale

### HMS-feilsystem

Bambu Lab Health Management System (HMS) viser:

- Aktive feil og advarsler fra printeren
- Feilkoder med beskrivelse og løsningsforslag
- Historikk over tidligere HMS-hendelser

### MQTT-kommandoer

Over 40 MQTT-kommandoer er tilgjengelige for Bambu Lab-printere, inkludert:

- Print-styring (start, pause, gjenoppta, stopp)
- Temperatur og hastighet
- Lys og kamera
- AMS-operasjoner
- Kalibreringskommandoer
- Systemkommandoer (nettverksinfo, firmware-versjon)

## Snapmaker — Avanserte kontroller

### NFC-filament

Snapmaker U1 støtter NFC-filamentgjenkjenning:

- Automatisk materialidentifikasjon via NFC-tagg
- Temperaturprofiler lastes automatisk fra filamentdata
- Fargeinformasjon synkroniseres til filamentlageret

### Defektdeteksjon AI

- AI-basert overvåking av printkvalitet under printing
- Automatisk pause ved detekterte defekter (spaghetti, lag-forskyvning, adhesjon)
- Konfigurerbar sensitivitet og varslingsnivå

### Timelapse

- Automatisk timelapse-opptak av alle prints
- Konfigurerbar intervall og oppløsning
- Last ned timelapse-videoer fra dashboardet

### Printkonfigurasjon og kalibrering

- Konfigurerbare printprofiler for Snapmaker U1
- Kalibrering av alle akser og verktøyhoder
- Automatisk Z-offset-justering

### Luftrenser

- Overvåk og kontroller den innebygde luftrenseren
- Se filterstatus og levetid
- Aktiver/deaktiver renseren manuelt eller automatisk

### Strømmåler

- Sanntids strømforbruk under printing
- Historikk over energiforbruk per print
- Integrasjon med kostnadsestimatoren for nøyaktig strømkostnad
