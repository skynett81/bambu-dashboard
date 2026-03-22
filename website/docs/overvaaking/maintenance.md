---
sidebar_position: 4
title: Vedlikehold
description: Hold styr på dysebytte, smøring og andre vedlikeholdsoppgaver med påminnelser, intervaller og kostnadslogg
---

# Vedlikehold

Vedlikeholdsmodulen hjelper deg å planlegge og spore alt vedlikehold på Bambu Lab-printerne dine — fra dysebytte til smøring av skinner.

Gå til: **https://localhost:3443/#maintenance**

## Vedlikeholdsplan

Bambu Dashboard kommer med forhåndskonfigurerte vedlikeholdsintervaller for alle Bambu Lab-printermodeller:

| Oppgave | Intervall (standard) | Modell |
|---|---|---|
| Rengjør dyse | Hver 200 timer | Alle |
| Bytt dyse (messing) | Hver 500 timer | Alle |
| Bytt dyse (hardened) | Hver 2000 timer | Alle |
| Smør X-akse | Hver 300 timer | X1C, P1S |
| Smør Z-akse | Hver 300 timer | Alle |
| Rengjør AMS-tannhjul | Hver 200 timer | AMS |
| Rengjør kammer | Hver 500 timer | X1C |
| Bytt PTFE-rør | Etter behov / 1000 timer | Alle |
| Kalibrering (full) | Månedlig | Alle |

Alle intervaller kan tilpasses per printer.

## Dysebytte-logg

1. Gå til **Vedlikehold → Dyser**
2. Klikk **Logg dysebytte**
3. Fyll inn:
   - **Dato** — automatisk satt til i dag
   - **Dystemateriale** — Messing / Hardened Steel / Kobber / Rubinstift
   - **Dysediameter** — 0.2 / 0.4 / 0.6 / 0.8 mm
   - **Merkevare/modell** — valgfritt
   - **Pris** — for kostnadslogg
   - **Timer ved bytte** — automatisk hentet fra printtid-teller
4. Klikk **Lagre**

Loggen viser all dysehistorikk sortert på dato.

:::tip Forhåndspåminnelse
Sett **Varsle X timer i forkant** (f.eks. 50 timer) for å få varsel i god tid før neste anbefalte bytte.
:::

## Opprette vedlikeholdsoppgaver

1. Klikk **Ny oppgave** (+ ikon)
2. Fyll inn:
   - **Oppgavenavn** — f.eks. «Smør Y-akse»
   - **Printer** — velg aktuell printer(e)
   - **Intervalltype** — Timer / Dager / Antall prints
   - **Intervall** — f.eks. 300 timer
   - **Sist utført** — angi når sist ble gjort (sett tilbake-dato)
3. Klikk **Opprett**

## Intervaller og påminnelser

For aktive oppgaver vises:
- **Grønn** — tid til neste vedlikehold > 50 % av intervallet igjen
- **Gul** — tid til neste vedlikehold < 50 % igjen
- **Oransje** — tid til neste vedlikehold < 20 % igjen
- **Rød** — vedlikehold forfalt

### Konfigurere påminnelser

1. Klikk på en oppgave → **Rediger**
2. Aktiver **Påminnelser**
3. Sett **Varsle ved** f.eks. 10 % igjen til forfall
4. Velg varselkanal (se [Varsler](../funksjoner/notifications))

## Markere som utført

1. Finn oppgaven i listen
2. Klikk **Utført** (hake-ikon)
3. Intervallet tilbakestilles fra dagens dato/timer
4. Loggoppføring opprettes automatisk

## Kostnadslogg

Alle vedlikeholdsoppgaver kan ha en tilknyttet kostnad:

- **Deler** — dyser, PTFE-rør, smøremidler
- **Tid** — timer brukt × timesats
- **Ekstern service** — betalt reparasjon

Kostnadene summeres per printer og vises i statistikk-oversikten.

## Vedlikeholdshistorikk

Gå til **Vedlikehold → Historikk** for å se:
- Alle utførte vedlikeholdsoppgaver
- Dato, timer og kostnad
- Hvem som utførte (ved flerbrukersystem)
- Kommentarer og notater

Eksporter historikken til CSV for regnskapsformål.
