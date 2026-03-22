---
sidebar_position: 6
title: Varsler
description: Konfigurer varsler via Telegram, Discord, e-post, webhook, ntfy, Pushover og SMS for alle printerhendelser
---

# Varsler

Bambu Dashboard støtter varsler gjennom en rekke kanaler slik at du alltid vet hva som skjer med printerne dine — enten du er hjemme eller på farten.

Gå til: **https://localhost:3443/#settings** → fanen **Varsler**

## Tilgjengelige kanaler

| Kanal | Krever | Støtter bilder |
|---|---|---|
| Telegram | Bot-token + Chat-ID | ✅ |
| Discord | Webhook-URL | ✅ |
| E-post | SMTP-server | ✅ |
| Webhook | URL + valgfri nøkkel | ✅ (base64) |
| ntfy | ntfy-server + topic | ❌ |
| Pushover | API-token + User-key | ✅ |
| SMS (Twilio) | Account SID + Auth token | ❌ |
| Browser push | Ingen konfig nødvendig | ❌ |

## Oppsett per kanal

### Telegram

1. Opprett en bot via [@BotFather](https://t.me/BotFather) — send `/newbot`
2. Kopier **bot-token** (format: `123456789:ABC-def...`)
3. Start en samtale med boten og send `/start`
4. Finn din **Chat-ID**: gå til `https://api.telegram.org/bot<TOKEN>/getUpdates`
5. I Bambu Dashboard: lim inn token og Chat-ID, klikk **Test**

:::tip Gruppekanal
Du kan bruke en Telegram-gruppe som mottaker. Chat-ID for grupper starter med `-`.
:::

### Discord

1. Åpne Discord-serveren du vil varsle til
2. Gå til kanalinnstillinger → **Integrasjoner → Webhooks**
3. Klikk **Ny webhook**, gi den et navn og velg kanal
4. Kopier webhook-URL
5. Lim inn URL i Bambu Dashboard og klikk **Test**

### E-post

1. Fyll inn SMTP-server, port (vanligvis 587 for TLS)
2. Brukernavn og passord for SMTP-kontoen
3. **Fra**-adresse og **Til**-adresse(r) (kommaseparert for flere)
4. Aktiver **TLS/STARTTLS** for sikker sending
5. Klikk **Test** for å sende en test-e-post

:::warning Gmail
Bruk **App-passord** for Gmail, ikke vanlig passord. Aktiver 2-faktor-autentisering i Google-kontoen din først.
:::

### ntfy

1. Opprett et topic på [ntfy.sh](https://ntfy.sh) eller kjør din egen ntfy-server
2. Fyll inn server-URL (f.eks. `https://ntfy.sh`) og topic-navn
3. Installer ntfy-appen på mobilen og abonner på samme topic
4. Klikk **Test**

### Pushover

1. Opprett en konto på [pushover.net](https://pushover.net)
2. Opprett en ny applikasjon — kopier **API Token**
3. Finn din **User Key** på Pushover-dashboardet
4. Fyll inn begge i Bambu Dashboard og klikk **Test**

### Webhook (egendefinert)

Bambu Dashboard sender en HTTP POST med JSON-payload:

```json
{
  "event": "print_complete",
  "printer": "Min X1C",
  "printer_id": "abc123",
  "timestamp": "2026-03-22T14:30:00Z",
  "data": {
    "file": "benchy.3mf",
    "duration_minutes": 47,
    "filament_used_g": 12.4
  }
}
```

Legg til en **Hemmelig nøkkel** for å validere forespørsler med HMAC-SHA256-signatur i headeren `X-Bambu-Signature`.

## Hendelsesfilter

Velg hvilke hendelser som skal utløse varsler per kanal:

| Hendelse | Beskrivelse |
|---|---|
| Print startet | Ny utskrift begynner |
| Print fullført | Utskrift ferdig (med bilde) |
| Print feilet | Utskrift avbrutt med feil |
| Print pauset | Manuell eller automatisk pause |
| Print Guard varslet | XCam eller sensor utløste en handling |
| Filament lavt | Spole nær tom |
| AMS-feil | Blokkering, fuktig filament, osv. |
| Printer frakoblet | MQTT-tilkobling mistet |
| Kø-jobb sendt | Jobb dispatched fra kø |

Huk av hendelsene du ønsker for hver kanal individuelt.

## Stille timer

Unngå varsler på natten:

1. Aktiver **Stille timer** under varselinnstillingene
2. Sett **Fra** og **Til** klokkeslett (f.eks. 23:00 → 07:00)
3. Velg **Tidssone** for timeren
4. Kritiske varsler (Print Guard feil) kan overstyres — huk av **Alltid send kritiske**

## Browser push-varsler

Motta varsler direkte i nettleseren uten app:

1. Gå til **Innstillinger → Varsler → Browser Push**
2. Klikk **Aktiver push-varsler**
3. Godta tillatelsesdialogen fra nettleseren
4. Varsler fungerer selv om dashboardet er minimert (krever at fanen er åpen)

:::info PWA
Installer Bambu Dashboard som PWA for push-varsler i bakgrunnen uten åpen fane. Se [PWA](../system/pwa).
:::
