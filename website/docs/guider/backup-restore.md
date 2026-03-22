---
sidebar_position: 9
title: Sikkerhetskopi
description: Automatisk og manuell backup av Bambu Dashboard, gjenoppretting og flytting til ny server
---

# Sikkerhetskopi og gjenoppretting

Bambu Dashboard lagrer all data lokalt — printhistorikk, filamentlager, innstillinger, brukere og mer. Regelmessig sikkerhetskopi sikrer at du ikke mister noe ved serverfeil eller ved flytting.

## Hva inkluderes i en backup?

| Data | Inkludert | Merknad |
|------|-----------|---------|
| Printhistorikk | Ja | Alle logger og statistikk |
| Filamentlager | Ja | Spoler, vekter, merker |
| Innstillinger | Ja | Alle systeminnstillinger |
| Printeroppsett | Ja | IP-adresser, tilgangskoder |
| Brukere og roller | Ja | Passord lagres hashed |
| Varslingskonfigurasjon | Ja | Telegram-tokens osv. |
| Kamerabilder | Valgfritt | Kan bli store filer |
| Timelapse-videoer | Valgfritt | Ekskludert som standard |

## Automatisk nattlig backup

Som standard kjøres en automatisk backup hver natt kl. 03:00.

**Se og konfigurer automatisk backup:**
1. Gå til **System → Backup**
2. Under **Automatisk backup** ser du:
   - Siste vellykkede backup og tidspunkt
   - Neste planlagte backup
   - Antall backups lagret (standard: 7 dager)

**Konfigurere:**
- **Tidspunkt** — endre fra standard 03:00 til et tidspunkt som passer deg
- **Oppbevaringstid** — antall dager backups beholdes (7, 14, 30 dager)
- **Lagringsplass** — lokal mappe (standard) eller ekstern sti
- **Komprimering** — aktivert som standard (reduserer størrelse med 60–80%)

:::info Backup-filer lagres som standard her
```
/path/til/bambu-dashboard/data/backups/
backup-2025-03-22-030000.tar.gz
backup-2025-03-21-030000.tar.gz
...
```
:::

## Manuell backup

Ta en backup når som helst:

1. Gå til **System → Backup**
2. Klikk **Ta backup nå**
3. Vent til statusen viser **Fullført**
4. Last ned backup-filen ved å klikke **Last ned**

**Alternativt via terminal:**
```bash
cd /sti/til/bambu-dashboard
node scripts/backup.js
```

Backup-filen lagres i `data/backups/` med tidsstempel i filnavnet.

## Gjenopprette fra backup

:::warning Gjenoppretting overskriver eksisterende data
All eksisterende data erstattes av innholdet i backup-filen. Sørg for at du gjenoppretter til riktig fil.
:::

### Via dashboardet

1. Gå til **System → Backup**
2. Klikk **Gjenopprett**
3. Velg en backup-fil fra listen, eller last opp en backup-fil fra disk
4. Klikk **Gjenopprett nå**
5. Dashboardet starter på nytt automatisk etter gjenoppretting

### Via terminal

```bash
cd /sti/til/bambu-dashboard
node scripts/restore.js data/backups/backup-2025-03-22-030000.tar.gz
```

Etter gjenoppretting, start dashboardet på nytt:
```bash
sudo systemctl restart bambu-dashboard
# eller
npm start
```

## Eksportere og importere innstillinger

Vil du bare ta vare på innstillingene (ikke all historikk)?

**Eksportere:**
1. Gå til **System → Innstillinger → Eksport**
2. Velg hva som skal inkluderes:
   - Printeroppsett
   - Varslingskonfigurasjon
   - Brukerkontoer
   - Filamentmerker og profiler
3. Klikk **Eksporter** — du laster ned en `.json`-fil

**Importere:**
1. Gå til **System → Innstillinger → Importer**
2. Last opp `.json`-filen
3. Velg hvilke deler som skal importeres
4. Klikk **Importer**

:::tip Nyttig ved ny installasjon
Eksporterte innstillinger er praktisk å ha med seg til ny server. Importer dem etter ny installasjon for å slippe å sette opp alt på nytt.
:::

## Flytte til ny server

Slik flytter du Bambu Dashboard med all data til en ny maskin:

### Steg 1 — Ta backup på gammel server

1. Gå til **System → Backup → Ta backup nå**
2. Last ned backup-filen
3. Kopier filen til ny server (USB, scp, nettverksdeling)

### Steg 2 — Installer på ny server

```bash
git clone https://github.com/skynett81/bambu-dashboard.git
cd bambu-dashboard
./install.sh
```

Følg installasjonsguiden. Du trenger ikke konfigurere noe — bare få dashboardet opp og kjøre.

### Steg 3 — Gjenopprett backupen

Når dashboardet kjører på ny server:

1. Gå til **System → Backup → Gjenopprett**
2. Last opp backup-filen fra gammel server
3. Klikk **Gjenopprett nå**

Alt er nå på plass: historikk, filamentlager, innstillinger og brukere.

### Steg 4 — Verifiser tilkoblingen

1. Gå til **Innstillinger → Printere**
2. Test tilkoblingen til hver printer
3. Sjekk at IP-adressene fortsatt er riktige (ny server kan ha annen IP)

## Tips for god backup-hygiene

- **Test gjenopprettingen** — ta en backup og gjenopprett på en testmaskin minst én gang. Uutprøvde backups er ingen backup.
- **Lagre eksternt** — kopier jevnlig backup-filen til en ekstern disk eller skylagring (Nextcloud, Google Drive osv.)
- **Sett opp varsel** — aktiver varsel for "Backup mislyktes" under **Innstillinger → Varsler → Hendelser** slik at du vet med en gang noe går galt
