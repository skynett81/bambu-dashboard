---
sidebar_position: 3
title: Flåteoversikt
description: Administrer og overvåk alle Bambu Lab-printere i ett rutenett med sortering, filtrering og sanntidsstatus
---

# Flåteoversikt

Flåteoversikten gir deg en kompakt oversikt over alle tilkoblede printere på én side. Perfekt for verksteder, skolerom eller alle som har mer enn én printer.

Gå til: **https://localhost:3443/#fleet**

## Multi-printer-rutenett

Alle registrerte printere vises i et responsivt rutenett:

- **Kortstørrelse** — Liten (kompakt), Medium (standard), Stor (detaljert)
- **Antall kolonner** — Tilpasses automatisk etter skjermbredde, eller sett manuelt
- **Oppdatering** — Hvert kort oppdateres uavhengig via MQTT

Hvert printerkort viser:
| Felt | Beskrivelse |
|---|---|
| Printernavn | Konfigurert navn med modellikon |
| Status | Ledig / Printer / Pause / Feil / Frakoblet |
| Fremgang | Prosentbar med gjenværende tid |
| Temperatur | Dyse og seng (kompakt) |
| Aktivt filament | Farge og materiale fra AMS |
| Kamera-thumbnail | Stillbilde oppdatert hvert 30. sekund |

## Statusindikator per printer

Statusfarger gjør det enkelt å se tilstanden på avstand:

- **Grønn puls** — Printer aktivt
- **Blå** — Ledig og klar
- **Gul** — Pauset (manuelt eller av Print Guard)
- **Rød** — Feil oppdaget
- **Grå** — Frakoblet eller utilgjengelig

:::tip Kiosk-modus
Bruk flåteoversikten i kiosk-modus på en veggmontert skjerm. Se [Kiosk-modus](../system/kiosk) for oppsett.
:::

## Sortering

Klikk **Sorter** for å velge rekkefølge:

1. **Navn** — Alfabetisk A–Å
2. **Status** — Aktive printere øverst
3. **Fremgang** — Mest ferdig øverst
4. **Sist aktiv** — Nyligst brukt øverst
5. **Modell** — Gruppert etter printermodell

Sorteringen huskes til neste besøk.

## Filtrering

Bruk filterfeltet øverst for å begrense visningen:

- Skriv inn printernavn eller del av navn
- Velg **Status** fra nedtrekkslisten (Alle / Printer / Ledig / Feil)
- Velg **Modell** for å vise kun én printertype (X1C, P1S, A1, osv.)
- Klikk **Nullstill filter** for å vise alle

:::info Søk
Søket filtrerer i sanntid uten å laste siden på nytt.
:::

## Handlinger fra flåteoversikten

Høyreklikk på et kort (eller klikk de tre prikkene) for hurtighandlinger:

- **Åpne dashboard** — Gå direkte til printerens hovedpanel
- **Pause print** — Setter printeren på pause
- **Stopp print** — Avbryter pågående print (krever bekreftelse)
- **Se kamera** — Åpner kameravisning i popup
- **Gå til innstillinger** — Åpner printerinnstillinger

:::danger Stopp print
Å stoppe en print er ikke reversibelt. Bekreft alltid i dialogboksen som vises.
:::

## Aggregert statistikk

Øverst i flåteoversikten vises en oppsummeringsrad:

- Totalt antall printere
- Antall aktive prints
- Totalt filamentforbruk i dag
- Estimert ferdigtid for lengste pågående print
