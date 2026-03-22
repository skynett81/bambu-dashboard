---
sidebar_position: 2
title: Sikkerhetskopi
description: Opprett, gjenopprett og planlegg automatiske sikkerhetskopier av Bambu Dashboard-data
---

# Sikkerhetskopi

Bambu Dashboard kan ta sikkerhetskopi av all konfigurasjon, historikk og data slik at du enkelt kan gjenopprette ved systemfeil, serverflytt eller oppdateringsproblemer.

Gå til: **https://localhost:3443/#settings** → **System → Sikkerhetskopi**

## Hva inkluderes i en sikkerhetskopi

| Datatype | Inkludert | Merknad |
|---|---|---|
| Printeroppsett og -konfigurasjoner | ✅ | |
| Printhistorikk | ✅ | |
| Filamentlager | ✅ | |
| Brukere og roller | ✅ | Passord lagres hashet |
| Innstillinger | ✅ | Inkl. varselkonfigurasjoner |
| Vedlikeholdslogg | ✅ | |
| Prosjekter og faktura | ✅ | |
| Filbibliotek (metadata) | ✅ | |
| Filbibliotek (filer) | Valgfritt | Kan bli stor |
| Timelapse-videoer | Valgfritt | Kan bli svært stor |
| Galleribilder | Valgfritt | |

## Opprette en manuell sikkerhetskopi

1. Gå til **Innstillinger → Sikkerhetskopi**
2. Velg hva som skal inkluderes (se tabellen over)
3. Klikk **Opprett sikkerhetskopi nå**
4. Fremdriftsindikator vises mens backup opprettes
5. Klikk **Last ned** når backup er ferdig

Backup lagres som en `.zip`-fil med tidsstempel i filnavnet:
```
bambu-dashboard-backup-2026-03-22T14-30-00.zip
```

## Laste ned backup

Backup-filer lagres i backupmappen på serveren (konfigurerbart). I tillegg kan du laste dem ned direkte:

1. Gå til **Sikkerhetskopi → Eksisterende backuper**
2. Finn backup i listen (sortert etter dato)
3. Klikk **Last ned** (nedlastingsikon)

:::info Lagringsmappe
Standard lagringsmappe: `./data/backups/`. Endre under **Innstillinger → Sikkerhetskopi → Lagringsmappe**.
:::

## Planlagt automatisk backup

1. Aktiver **Automatisk backup** under **Sikkerhetskopi → Planlegging**
2. Velg intervall:
   - **Daglig** — kjøres kl. 03:00 (konfigurerbart)
   - **Ukentlig** — en bestemt dag og tid
   - **Månedlig** — første dag i måneden
3. Velg **Antall backuper å beholde** (f.eks. 7 — eldre slettes automatisk)
4. Klikk **Lagre**

:::tip Ekstern lagring
For viktige data: monter en ekstern disk eller nettverksdisk som lagringsmappe for backuper. Da overlever backupene selv om systemdisken svikter.
:::

## Gjenopprette fra backup

:::warning Gjenoppretting overskriver eksisterende data
Gjenoppretting erstatter all eksisterende data med innholdet fra backup-filen. Sørg for at du har en fersk backup av gjeldende data først.
:::

### Fra eksisterende backup på server

1. Gå til **Sikkerhetskopi → Eksisterende backuper**
2. Finn backup i listen
3. Klikk **Gjenopprett**
4. Bekreft i dialogen
5. Systemet starter automatisk på nytt etter gjenoppretting

### Fra nedlastet backup-fil

1. Klikk **Last opp backup**
2. Velg `.zip`-filen fra datamaskinen din
3. Filen valideres — du ser hva som er inkludert
4. Klikk **Gjenopprett fra fil**
5. Bekreft i dialogen

## Backup-validering

Bambu Dashboard validerer alle backup-filer før gjenoppretting:

- Sjekker at ZIP-formatet er gyldig
- Verifiserer at databaseskjemaet er kompatibelt med gjeldende versjon
- Viser advarsel hvis backup er fra en eldre versjon (migrering vil utføres automatisk)
