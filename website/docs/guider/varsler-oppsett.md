---
sidebar_position: 7
title: Sette opp varsler
description: Konfigurer Telegram, Discord, e-post og push-varsler i Bambu Dashboard
---

# Sette opp varsler

Bambu Dashboard kan varsle deg om alt fra fullførte prints til kritiske feil — via Telegram, Discord, e-post eller browser push-varsler.

## Oversikt over varslingskanaler

| Kanal | Beste for | Krever |
|-------|-----------|--------|
| Telegram | Hurtig, overalt | Telegram-konto + bot-token |
| Discord | Team/community | Discord-server + webhook-URL |
| E-post (SMTP) | Offisiell varsling | SMTP-server |
| Browser push | Desktop-varsler | Nettleser med push-støtte |

---

## Telegram-bot

### Steg 1 — Opprett boten

1. Åpne Telegram og søk etter **@BotFather**
2. Send `/newbot`
3. Gi boten et navn (f.eks. "Bambu Varsler")
4. Gi boten et brukernavn (f.eks. `bambu_varsler_bot`) — må slutte på `bot`
5. BotFather svarer med en **API-token**: `123456789:ABCdefGHIjklMNOpqrsTUVwxyz`
6. Kopier og ta vare på denne tokenen

### Steg 2 — Finn din Chat ID

1. Start en samtale med boten din (søk opp brukernavnet og klikk **Start**)
2. Send en melding til boten (f.eks. "hei")
3. Gå til `https://api.telegram.org/bot<DIN_TOKEN>/getUpdates` i nettleseren
4. Finn `"chat":{"id": 123456789}` — det er din Chat ID

### Steg 3 — Koble til dashboardet

1. Gå til **Innstillinger → Varsler → Telegram**
2. Lim inn **Bot Token**
3. Lim inn **Chat ID**
4. Klikk **Test varsling** — du skal motta en testmelding i Telegram
5. Klikk **Lagre**

:::tip Gruppevarsel
Vil du varsle en hel gruppe? Legg boten til i en Telegram-gruppe, finn gruppe-Chat ID (negativ tall, f.eks. `-100123456789`) og bruk den i stedet.
:::

---

## Discord-webhook

### Steg 1 — Opprett webhook i Discord

1. Gå til Discord-serveren din
2. Høyreklikk på kanalen du vil ha varsler i → **Rediger kanal**
3. Gå til **Integrasjoner → Webhooks**
4. Klikk **Ny Webhook**
5. Gi den et navn (f.eks. "Bambu Dashboard")
6. Velg en avatar (valgfritt)
7. Klikk **Kopier Webhook URL**

URL-en ser slik ut:
```
https://discord.com/api/webhooks/123456789/abcdefghijk...
```

### Steg 2 — Legg inn i dashboardet

1. Gå til **Innstillinger → Varsler → Discord**
2. Lim inn **Webhook URL**
3. Klikk **Test varsling** — Discord-kanalen skal motta en testmelding
4. Klikk **Lagre**

---

## E-post (SMTP)

### Nødvendig informasjon

Du trenger SMTP-innstillingene fra din e-postleverandør:

| Leverandør | SMTP-server | Port | Kryptering |
|------------|-------------|------|------------|
| Gmail | smtp.gmail.com | 587 | TLS |
| Outlook/Hotmail | smtp-mail.outlook.com | 587 | TLS |
| Yahoo | smtp.mail.yahoo.com | 587 | TLS |
| Eget domene | smtp.dittdomene.no | 587 | TLS |

:::warning Gmail krever app-passord
Gmail blokkerer innlogging med vanlig passord. Du må opprette et **App-passord** under Google-konto → Sikkerhet → 2-trinnsverifisering → App-passord.
:::

### Konfigurasjon i dashboardet

1. Gå til **Innstillinger → Varsler → E-post**
2. Fyll inn:
   - **SMTP-server**: f.eks. `smtp.gmail.com`
   - **Port**: `587`
   - **Brukernavn**: din e-postadresse
   - **Passord**: app-passord eller vanlig passord
   - **Fra-adresse**: e-posten varselet sendes fra
   - **Til-adresse**: e-posten du vil motta varslene
3. Klikk **Test e-post**
4. Klikk **Lagre**

---

## Browser push-varsler

Push-varsler dukker opp som systemvarsler på skrivebordet — selv når nettleserfanen er i bakgrunnen.

**Aktivere:**
1. Gå til **Innstillinger → Varsler → Push-varsler**
2. Klikk **Aktiver push-varsler**
3. Nettleseren spør om tillatelse — klikk **Tillat**
4. Klikk **Test varsling**

:::info Kun i nettleseren der du aktiverte det
Push-varsler er koblet til den spesifikke nettleseren og enheten. Aktiver det på hver enhet du vil ha varsler på.
:::

---

## Velge hendelser å varsle om

Etter at du har satt opp en varslingskanal, kan du velge nøyaktig hvilke hendelser som trigger varsling:

**Under Innstillinger → Varsler → Hendelser:**

| Hendelse | Anbefalt |
|----------|----------|
| Print fullført | Ja |
| Print mislykket / avbrutt | Ja |
| Print Guard: spaghetti oppdaget | Ja |
| HMS-feil (kritisk) | Ja |
| HMS-advarsel | Valgfritt |
| Filament lavt nivå | Ja |
| AMS-feil | Ja |
| Printer koblet fra | Valgfritt |
| Vedlikeholdspåminnelse | Valgfritt |
| Nattlig backup fullført | Nei (støyende) |

---

## Stille timer (ikke varsle om natten)

Unngå å bli vekket av en fullført print klokken 03:00:

1. Gå til **Innstillinger → Varsler → Stille timer**
2. Aktiver **Stille timer**
3. Sett fra-tid og til-tid (f.eks. **22:00 til 07:00**)
4. Velg hvilke hendelser som fortsatt skal varsle i stille perioden:
   - **Kritiske HMS-feil** — anbefales å beholde på
   - **Print Guard** — anbefales å beholde på
   - **Print fullført** — kan slås av om natten

:::tip Nattprint uten forstyrrelse
Kjør prints om natten med stille timer aktivert. Print Guard passer på — og du får en oppsummering om morgenen.
:::
