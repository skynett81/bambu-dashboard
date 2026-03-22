---
sidebar_position: 8
title: Serverlogg
description: Se serverloggen i sanntid, filtrer på nivå og modul, og feilsøk problemer med Bambu Dashboard
---

# Serverlogg

Serverloggen gir deg innsikt i hva som skjer inne i Bambu Dashboard — nyttig for feilsøking, overvåking og diagnostikk.

Gå til: **https://localhost:3443/#logs**

## Sanntidsvisning

Loggstrømmen oppdateres i sanntid via WebSocket:

1. Gå til **System → Serverlogg**
2. Nye logglinjer vises automatisk nederst
3. Klikk **Lås bunn** for å alltid rulle til siste logg
4. Klikk **Frys** for å stoppe autoscrolling og lese eksisterende linjer

Standardvisning viser de siste 500 logglinjer.

## Loggnivåer

Hver logglinje har et nivå:

| Nivå | Farge | Beskrivelse |
|---|---|---|
| **ERROR** | Rød | Feil som påvirker funksjonalitet |
| **WARN** | Oransje | Advarsler — noe kan gå galt |
| **INFO** | Blå | Normal driftsinformasjon |
| **DEBUG** | Grå | Detaljert utviklerinformasjon |

:::info Loggnivå-konfigurasjon
Endre loggnivå under **Innstillinger → System → Loggnivå**. For normal drift, bruk **INFO**. Bruk **DEBUG** kun ved feilsøking da det genererer mye mer data.
:::

## Filtrering

Bruk filterverktøylinjen øverst i loggvisningen:

1. **Loggnivå** — vis kun ERROR / WARN / INFO / DEBUG eller en kombinasjon
2. **Modul** — filtrer på systemmodul:
   - `mqtt` — MQTT-kommunikasjon med printere
   - `api` — API-forespørsler
   - `db` — databaseoperasjoner
   - `auth` — autentiseringshendelser
   - `queue` — utskriftskø-hendelser
   - `guard` — Print Guard-hendelser
   - `backup` — sikkerhetskopi-operasjoner
3. **Fritekst** — søk i loggteksten (støtter regex)
4. **Tidspunkt** — filtrer på datoperiode

Kombinér filtrene for presis feilsøking.

## Vanlige feilsituasjoner

### MQTT-tilkoblingsproblemer

Se etter logginjer fra `mqtt`-modulen:

```
ERROR [mqtt] Tilkobling til printer XXXX feilet: Connection refused
```

**Løsning:** Sjekk at printeren er på, tilgangsnøkkelen er riktig og nettverket fungerer.

### Database-feil

```
ERROR [db] Migrasjonen v95 feilet: SQLITE_CONSTRAINT
```

**Løsning:** Ta en backup og kjør database-reparasjon via **Innstillinger → System → Reparer database**.

### Autentiseringsfeil

```
WARN [auth] Mislykket innlogging for bruker admin fra IP 192.168.1.x
```

Mange mislykkede innlogginger kan indikere et brute-force-forsøk. Sjekk om IP-hviteliste bør aktiveres.

## Eksportere logger

1. Klikk **Eksporter logg**
2. Velg tidsperiode (standard: siste 24 timer)
3. Velg format: **TXT** (menneskelesbar) eller **JSON** (maskinlesbar)
4. Filen lastes ned

Eksporterte logger er nyttige ved rapportering av bugs eller ved henvendelse til support.

## Logg-rotasjon

Logger roteres automatisk:

| Innstilling | Standard |
|---|---|
| Maks loggfilstørrelse | 50 MB |
| Antall roterte filer å beholde | 5 |
| Total maks loggstørrelse | 250 MB |

Juster under **Innstillinger → System → Logg-rotasjon**. Eldre loggfiler komprimeres automatisk med gzip.

## Loggfil-plassering

Loggfiler lagres på serveren:

```
./data/logs/
├── bambu-dashboard.log          (aktiv logg)
├── bambu-dashboard.log.1.gz     (rotert)
├── bambu-dashboard.log.2.gz     (rotert)
└── ...
```

:::tip SSH-tilgang
For å lese logger direkte på serveren via SSH:
```bash
tail -f ./data/logs/bambu-dashboard.log
```
:::
