---
sidebar_position: 4
title: API-lekeplass
description: Test alle 177 API-endepunkter direkte i nettleseren med innebygd OpenAPI-dokumentasjon og autentisering
---

# API-lekeplass

API-lekeplassen lar deg utforske og teste alle 177 API-endepunkter i Bambu Dashboard direkte i nettleseren — uten å skrive kode.

Gå til: **https://localhost:3443/api/docs**

## Hva er API-lekeplassen?

Lekeplassen er en interaktiv versjon av OpenAPI-dokumentasjonen (Swagger UI) som er fullstendig integrert med dashboardet. Du er allerede autentisert når du er logget inn, så du kan teste endepunkter direkte.

## Navigere i dokumentasjonen

Endepunktene er organisert i kategorier:

| Kategori | Antall endepunkter | Beskrivelse |
|---|---|---|
| Printere | 24 | Hent status, styr, konfigurer |
| Prints / Historikk | 18 | Hent, søk, eksporter historikk |
| Filament | 22 | Lager, spoler, profiler |
| Kø | 12 | Administrer utskriftskø |
| Statistikk | 15 | Aggregert statistikk og eksport |
| Varsler | 8 | Konfigurer og test varselkanaler |
| Brukere | 10 | Brukere, roller, API-nøkler |
| Innstillinger | 14 | Les og endre konfigurasjon |
| Vedlikehold | 12 | Vedlikeholdsoppgaver og logg |
| Integrasjoner | 18 | HA, Tibber, webhooks, osv. |
| Filbibliotek | 14 | Last opp, analyser, administrer |
| System | 10 | Backup, helse, logg |

Klikk på en kategori for å ekspandere og se alle endepunkter.

## Teste et endepunkt

1. Klikk på et endepunkt (f.eks. `GET /api/printers`)
2. Klikk **Try it out** (prøv det)
3. Fyll inn eventuelle parametere (filter, paginering, printer-ID, osv.)
4. Klikk **Execute**
5. Se responsen under: HTTP-statuskode, headers og JSON-body

### Eksempel: Hent alle printere

```
GET /api/printers
```
Returnerer en liste over alle registrerte printere med sanntidsstatus.

### Eksempel: Send kommando til printer

```
POST /api/printers/{id}/command
Body: {"command": "pause"}
```

:::warning Produksjonsmiljø
API-lekeplassen er tilkoblet det faktiske systemet. Kommandoer sendes til ekte printere. Vær forsiktig med destruktive operasjoner som `DELETE` og `POST /command`.
:::

## Autentisering

### Session-autentisering (innlogget bruker)
Når du er logget inn i dashboardet, er lekeplassen allerede autentisert via session-cookie. Ingen ekstra konfigurasjon nødvendig.

### API-nøkkel-autentisering

For ekstern tilgang:

1. Klikk **Authorize** (lås-ikon øverst i lekeplassen)
2. Fyll inn din API-nøkkel i **ApiKeyAuth**-feltet: `Bearer DIN_NØKKEL`
3. Klikk **Authorize**

Generer API-nøkler under **Innstillinger → API-nøkler** (se [Autentisering](../system/auth)).

## Rate limiting

API-et har rate limiting på **200 forespørsler per minutt** per bruker/nøkkel. Lekeplassen viser gjenværende forespørsler i response-headeren `X-RateLimit-Remaining`.

:::info OpenAPI-spesifikasjon
Last ned hele OpenAPI-spesifikasjonen som YAML eller JSON:
- `https://localhost:3443/api/docs/openapi.yaml`
- `https://localhost:3443/api/docs/openapi.json`

Bruk spesifikasjonen til å generere klientbiblioteker i Python, TypeScript, Go, osv.
:::

## Webhook-testing

Test webhook-integrasjoner direkte:

1. Gå til `POST /api/webhooks/test`
2. Velg event-type fra nedtrekkslisten
3. Systemet sender en test-hendelse til konfigurert webhook-URL
4. Se request/response i lekeplassen
