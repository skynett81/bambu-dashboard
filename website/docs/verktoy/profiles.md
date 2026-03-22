---
sidebar_position: 3
title: Printprofiler
description: Opprett, rediger og administrer printprofiler med forhåndsinnstilte innstillinger for rask og konsekvent printing
---

# Printprofiler

Printprofiler er lagrede sett med printinnstillinger du kan gjenbruke på tvers av prints og printere. Spar tid og sikre konsistent kvalitet ved å definere profiler for ulike formål.

Gå til: **https://localhost:3443/#profiles**

## Opprette en profil

1. Gå til **Verktøy → Printprofiler**
2. Klikk **Ny profil** (+ ikon)
3. Fyll inn:
   - **Profilnavn** — beskrivende navn, f.eks. «PLA - Rask produksjon»
   - **Materiale** — velg fra liste (PLA / PETG / ABS / PA / PC / TPU / osv.)
   - **Printermodell** — X1C / P1S / P1P / A1 / A1 Mini / Alle
   - **Beskrivelse** — valgfri tekst

4. Fyll inn innstillinger (se seksjoner under)
5. Klikk **Lagre profil**

## Innstillinger i en profil

### Temperatur
| Felt | Eksempel |
|---|---|
| Dysetemperatur | 220°C |
| Sengtemperatur | 60°C |
| Kammertemperatur (X1C) | 35°C |

### Hastighet
| Felt | Eksempel |
|---|---|
| Hastighetsinnstilling | Standard |
| Maks hastighet (mm/s) | 200 |
| Akselerasjon | 5000 mm/s² |

### Kvalitet
| Felt | Eksempel |
|---|---|
| Lagtykkelse | 0.2 mm |
| Infill-prosent | 15 % |
| Infill-mønster | Grid |
| Støttemateriell | Auto |

### AMS og farger
| Felt | Beskrivelse |
|---|---|
| Purge-volum | Mengde renspyling ved fargeskifte |
| Foretrukkede spor | Hvilke AMS-spor som foretrekkes |

### Avansert
| Felt | Beskrivelse |
|---|---|
| Tørkemodus | Aktiver AMS-tørking for fuktige materialer |
| Avkjølingstid | Pause mellom lag for avkjøling |
| Fan-hastighet | Kjølevift-hastighet i prosent |

## Redigere en profil

1. Klikk på profilen i listen
2. Klikk **Rediger** (blyant-ikon)
3. Gjør endringer
4. Klikk **Lagre** (overskriv) eller **Lagre som ny** (lager en kopi)

:::tip Versjonering
Bruk «Lagre som ny» for å beholde en fungerende profil mens du eksperimenterer med endringer.
:::

## Bruke en profil

### Fra filbiblioteket

1. Velg fil i biblioteket
2. Klikk **Send til printer**
3. Velg **Profil** fra nedtrekkslisten
4. Innstillingene fra profilen brukes

### Fra utskriftskøen

1. Opprett en ny køjobb
2. Velg **Profil** under innstillinger
3. Profilen kobles til køjobben

## Importere og eksportere profiler

### Eksport
1. Velg én eller flere profiler
2. Klikk **Eksporter**
3. Velg format: **JSON** (for import i andre dashboards) eller **PDF** (for utskrift/dokumentasjon)

### Import
1. Klikk **Importer profiler**
2. Velg en `.json`-fil eksportert fra et annet Bambu Dashboard
3. Eksisterende profiler med samme navn kan overskrives eller beholdes begge

## Dele profiler

Del profiler med andre via fellesskaps-filament-modulen (se [Fellesskaps-filamenter](../integrasjoner/community)) eller via direkte JSON-eksport.

## Standardprofil

Angi en standardprofil per materiale:

1. Velg profilen
2. Klikk **Sett som standard for [materiale]**
3. Standardprofilen velges automatisk når du sender en fil med det materialet
