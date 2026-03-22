---
sidebar_position: 1
title: Autentisering
description: Administrer brukere, roller, tillatelser, API-nøkler og tofaktorautentisering med TOTP
---

# Autentisering

Bambu Dashboard støtter flerbrukere med rollebasert tilgangskontroll, API-nøkler og valgfri tofaktorautentisering (2FA) via TOTP.

Gå til: **https://localhost:3443/#settings** → **Brukere og tilgang**

## Brukere

### Opprette en bruker

1. Gå til **Innstillinger → Brukere**
2. Klikk **Ny bruker**
3. Fyll inn:
   - **Brukernavn** — brukes til innlogging
   - **E-postadresse**
   - **Passord** — minimum 12 tegn anbefalt
   - **Rolle** — se roller under
4. Klikk **Opprett**

Den nye brukeren kan nå logge inn på **https://localhost:3443/login**.

### Endre passord

1. Gå til **Profil** (øverste høyre hjørne → klikk på brukernavnet)
2. Klikk **Endre passord**
3. Fyll inn gjeldende passord og nytt passord
4. Klikk **Lagre**

Administratorer kan tilbakestille andres passord fra **Innstillinger → Brukere → [Bruker] → Tilbakestill passord**.

## Roller

| Rolle | Beskrivelse |
|---|---|
| **Administrator** | Full tilgang — alle innstillinger, brukere og funksjoner |
| **Operatør** | Styre printere, se alt, men ikke endre systeminnstillinger |
| **Gjest** | Kun lese — se dashboard, historikk og statistikk |
| **API-bruker** | Kun API-tilgang — ingen webgrensesnitt |

### Egendefinerte roller

1. Gå til **Innstillinger → Roller**
2. Klikk **Ny rolle**
3. Velg tillatelser enkeltvis:
   - Vis dashboard / historikk / statistikk
   - Styr printere (pause/stopp/start)
   - Administrer filamentlager
   - Administrer kø
   - Se kamerastrøm
   - Endre innstillinger
   - Administrer brukere
4. Klikk **Lagre**

## API-nøkler

API-nøkler gir programmatisk tilgang uten å logge inn.

### Opprette en API-nøkkel

1. Gå til **Innstillinger → API-nøkler**
2. Klikk **Ny nøkkel**
3. Fyll inn:
   - **Navn** — beskrivende navn (f.eks. «Home Assistant», «Python-skript»)
   - **Utløpsdato** — valgfritt, sett for sikkerhet
   - **Tillatelser** — velg rolle eller spesifikke tillatelser
4. Klikk **Generer**
5. **Kopier nøkkelen nå** — den vises kun én gang

### Bruke API-nøkkelen

Legg til i HTTP-header for alle API-kall:
```
Authorization: Bearer DIN_API_NØKKEL
```

Se [API-lekeplassen](../verktoy/playground) for testing.

:::danger Sikker oppbevaring
API-nøkler har samme tilgang som brukeren de er knyttet til. Oppbevar dem sikkert og roter dem regelmessig.
:::

## TOTP 2FA

Aktiver tofaktorautentisering med en autentikator-app (Google Authenticator, Authy, Bitwarden, osv.):

### Aktivere 2FA

1. Gå til **Profil → Sikkerhet → Tofaktorautentisering**
2. Klikk **Aktiver 2FA**
3. Skann QR-koden med autentikator-appen
4. Skriv inn den genererte 6-sifrede koden for å bekrefte
5. Lagre **gjenopprettingskodene** (10 engangskoder) på et sikkert sted
6. Klikk **Aktiver**

### Logge inn med 2FA

1. Skriv inn brukernavn og passord som vanlig
2. Skriv inn den 6-sifrede TOTP-koden fra appen
3. Klikk **Logg inn**

### Tvungen 2FA for alle brukere

Administratorer kan kreve 2FA for alle brukere:

1. Gå til **Innstillinger → Sikkerhet → Tving 2FA**
2. Aktiver innstillingen
3. Brukere uten 2FA vil bli tvunget til å sette det opp ved neste innlogging

## Økt-håndtering

- Standard økt-varighet: 24 timer
- Juster under **Innstillinger → Sikkerhet → Øktvarighet**
- Se aktive økter per bruker og avslutt individuelle økter
