---
sidebar_position: 1
title: API-referanse
description: REST API med 284+ endepunkter, autentisering og rate limiting
---

# API-referanse

Bambu Dashboard eksponerer et fullverdig REST API med 284+ endepunkter. API-dokumentasjonen er tilgjengelig direkte i dashboardet.

## Interaktiv dokumentasjon

Åpne OpenAPI-dokumentasjonen i nettleseren:

```
https://din-server:3443/api/docs
```

Her finner du alle endepunkter, parametere, request/response-skjemaer og mulighet for å teste API-et direkte.

## Autentisering

API-et bruker **Bearer token**-autentisering (JWT):

```bash
# Logg inn og hent token
curl -X POST https://din-server:3443/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "ditt-passord"}'

# Respons
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": "24h"
}
```

Bruk tokenet i alle påfølgende kall:

```bash
curl https://din-server:3443/api/printers \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

## Rate limiting

API-et er rate-begrenset for å beskytte serveren:

| Grense | Verdi |
|--------|-------|
| Forespørsler per minutt | 200 |
| Burst (maks per sekund) | 20 |
| Respons ved overskridelse | `429 Too Many Requests` |

`Retry-After`-header i svaret angir hvor mange sekunder til neste forespørsel er tillatt.

## Endepunkter oversikt

### Autentisering
| Metode | Endepunkt | Beskrivelse |
|--------|-----------|-------------|
| POST | `/api/auth/login` | Logg inn, hent JWT |
| POST | `/api/auth/logout` | Logg ut |
| GET | `/api/auth/me` | Hent innlogget bruker |

### Printere
| Metode | Endepunkt | Beskrivelse |
|--------|-----------|-------------|
| GET | `/api/printers` | Liste alle printere |
| POST | `/api/printers` | Legg til printer |
| GET | `/api/printers/:id` | Hent printer |
| PUT | `/api/printers/:id` | Oppdater printer |
| DELETE | `/api/printers/:id` | Slett printer |
| GET | `/api/printers/:id/status` | Sanntidsstatus |
| POST | `/api/printers/:id/command` | Send kommando |

### Filament
| Metode | Endepunkt | Beskrivelse |
|--------|-----------|-------------|
| GET | `/api/filaments` | Liste alle spoler |
| POST | `/api/filaments` | Legg til spole |
| PUT | `/api/filaments/:id` | Oppdater spole |
| DELETE | `/api/filaments/:id` | Slett spole |
| GET | `/api/filaments/stats` | Forbruksstatistikk |

### Printhistorikk
| Metode | Endepunkt | Beskrivelse |
|--------|-----------|-------------|
| GET | `/api/history` | Liste historikk (paginert) |
| GET | `/api/history/:id` | Hent enkeltprint |
| GET | `/api/history/export` | Eksporter CSV |
| GET | `/api/history/stats` | Statistikk |

### Print-kø
| Metode | Endepunkt | Beskrivelse |
|--------|-----------|-------------|
| GET | `/api/queue` | Hent køen |
| POST | `/api/queue` | Legg til jobb |
| PUT | `/api/queue/:id` | Oppdater jobb |
| DELETE | `/api/queue/:id` | Fjern jobb |
| POST | `/api/queue/dispatch` | Tving utsendelse |

## WebSocket API

I tillegg til REST finnes et WebSocket API for sanntidsdata:

```javascript
const ws = new WebSocket('wss://din-server:3443/ws');

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log(data.type, data.payload);
};
```

### Meldingstyper (innkommende)
- `printer.status` — oppdatert printerstatus
- `print.progress` — fremgangsprosent oppdatering
- `ams.update` — AMS-tilstandsendring
- `notification` — varselmelding

## Feilkoder

| Kode | Betyr |
|------|-------|
| 200 | OK |
| 201 | Opprettet |
| 400 | Ugyldig forespørsel |
| 401 | Ikke autentisert |
| 403 | Ikke autorisert |
| 404 | Ikke funnet |
| 429 | For mange forespørsler |
| 500 | Serverfeil |
