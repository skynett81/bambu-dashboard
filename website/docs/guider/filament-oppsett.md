---
sidebar_position: 2
title: Sette opp filamentlager
description: Hvordan opprette, konfigurere og holde oversikt over filamentspolen dine i Bambu Dashboard
---

# Sette opp filamentlager

Filamentlageret i Bambu Dashboard gir deg full oversikt over alle spolene dine — hva som er igjen, hva du har brukt, og hvilke spoler som sitter i AMS akkurat nå.

## Automatisk oppretting fra AMS

Når du kobler til en printer med AMS, leser dashboardet automatisk informasjon fra RFID-brikkene på Bambu-spoler:

- Filamenttype (PLA, PETG, ABS, TPU osv.)
- Farge (med fargeheks)
- Merke (Bambu Lab)
- Sporevekt og gjenstående mengde

**Disse spolene opprettes automatisk i lageret** — du trenger ikke gjøre noe. Se dem under **Filament → Lager**.

:::info Kun Bambu-spoler har RFID
Tredjeparts spoler (f.eks. eSUN, Polymaker, Bambu-refill uten brikke) gjenkjennes ikke automatisk. Disse må legges inn manuelt.
:::

## Manuelt legge til spoler

For spoler uten RFID, eller for spoler som ikke sitter i AMS:

1. Gå til **Filament → Lager**
2. Klikk **+ Ny spole** øverst til høyre
3. Fyll inn feltene:

| Felt | Eksempel | Obligatorisk |
|------|----------|-------------|
| Merke | eSUN, Polymaker, Bambu | Ja |
| Type | PLA, PETG, ABS, TPU | Ja |
| Farge | #FF5500 eller velg fra fargehjul | Ja |
| Startvekt | 1000 g | Anbefalt |
| Gjenstående | 850 g | Anbefalt |
| Diameter | 1.75 mm | Ja |
| Notat | "Kjøpt 2025-01, fungerer bra" | Valgfritt |

4. Klikk **Lagre**

## Konfigurere farger og merke

Du kan redigere en spole når som helst ved å klikke på den i lageroversikten:

- **Farge** — Velg fra fargehjulet eller skriv inn heksverdi. Fargen brukes som visuell markør i AMS-oversikten
- **Merke** — Vises i statistikk og filtrering. Lag egne merker under **Filament → Merker**
- **Temperaturprofil** — Skriv inn anbefalt dyse- og platetemperatur fra filamentprodusenten. Dashboardet kan da advare hvis du velger feil temp

## Forstå AMS-synkronisering

Dashboardet synkroniserer AMS-status i sanntid:

```
AMS Slot 1 → Spole: Bambu PLA Hvit  [███████░░░] 72% igjen
AMS Slot 2 → Spole: eSUN PETG Grå   [████░░░░░░] 41% igjen
AMS Slot 3 → (tom)
AMS Slot 4 → Spole: Bambu PLA Rød   [██████████] 98% igjen
```

Synkroniseringen oppdateres:
- **Under print** — forbruk trekkes fra i sanntid
- **Ved print-slutt** — endelig forbruk logges i historikken
- **Manuelt** — klikk synkroniser-ikonet på en spole for å hente oppdatert data fra AMS

:::tip Korrigere AMS-estimat
AMS-estimatet fra RFID er ikke alltid 100 % nøyaktig etter første gangs bruk. Vei spolen og oppdater vekten manuelt for best presisjon.
:::

## Sjekke forbruk og gjenstående

### Per spole
Klikk på en spole i lageret for å se:
- Totalt brukt (gram, alle prints)
- Gjenstående estimert mengde
- Liste over alle prints som brukte denne spolen

### Samlet statistikk
Under **Analyse → Filamentanalyse** ser du:
- Forbruk per filamenttype over tid
- Hvilke merker du bruker mest
- Estimert kostnad basert på innkjøpspris per kg

### Lav-nivå-varsler
Sett opp varsler for når en spole nærmer seg slutten:

1. Gå til **Filament → Innstillinger**
2. Aktiver **Varsle ved lav beholdning**
3. Sett terskel (f.eks. 100 g igjen)
4. Velg varslingskanal (Telegram, Discord, e-post)

## Tips: Vei spoler for nøyaktighet

Estimatene fra AMS og fra print-statistikk er aldri helt eksakte. Den mest nøyaktige metoden er å veie selve spolen:

**Slik gjør du det:**

1. Finn tara-vekten (tom spole) — vanligvis 200–250 g, sjekk produsentens nettside eller bunnen av spolen
2. Vei spolen med filament på en kjøkkenvekt
3. Trekk fra tara-vekten
4. Oppdater **Gjenstående** i spoleprofilen

**Eksempel:**
```
Veid vekt:     743 g
Tara (tom):  - 230 g
Filament igjen: 513 g
```

:::tip Spol-etikett-generator
Under **Verktøy → Etiketter** kan du skrive ut etiketter med QR-kode til spolene dine. Skann koden med telefonen for raskt å åpne spoleprofilen.
:::
