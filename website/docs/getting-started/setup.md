---
sidebar_position: 2
title: Førstegangsoppsett
description: Koble til din Bambu Lab-printer og konfigurer dashboardet
---

# Førstegangsoppsett

Når dashboardet kjører for første gang, åpnes oppsettveiviseren automatisk.

## Oppsettveiviser

Veiviseren er tilgjengelig på `https://din-server:3443/setup`. Den guider deg gjennom:

1. Opprett administrator-bruker
2. Legg til printer
3. Test tilkobling
4. Konfigurer varsler (valgfritt)

## Legge til en printer

Velg printertype i oppsettveiviseren. 3DPrintForge støtter følgende tilkoblingsmetoder:

### Bambu Lab (MQTT)

Du trenger tre ting for å koble til en Bambu Lab-printer:

| Felt | Beskrivelse | Eksempel |
|------|-------------|---------|
| IP-adresse | Printerens lokale IP | `192.168.1.100` |
| Serienummer | 15 tegn, står under printeren | `01P09C123456789` |
| Access Code | 8 tegn, finnes i printerens nettverksinnstillinger | `12345678` |

**Finn Access Code:**

- **X1C / P1S / P1P:** Innstillinger → WLAN/LAN → Access Code
- **A1 / A1 Mini:** Innstillinger → WLAN → Access Code
- **P2S / H2-serien:** Innstillinger → Nettverk → Access Code

### PrusaLink (HTTP API)

For Prusa MK4, MK4S, MK3.9, MK3.5, Mini, Mini+ og XL:

| Felt | Beskrivelse | Eksempel |
|------|-------------|---------|
| IP-adresse | Printerens lokale IP | `192.168.1.101` |
| API-nøkkel | Generert i PrusaLink-webgrensesnittet | `AbCdEf123456` |

**Finn API-nøkkel:**

1. Åpne PrusaLink i nettleseren (`http://printer-ip`)
2. Gå til **Settings → API Key**
3. Generer eller kopier nøkkelen

### Klipper/Moonraker (WebSocket + REST API)

For Snapmaker, Voron, Creality, Elegoo, AnkerMake, QIDI, RatRig, Sovol og alle andre Klipper-printere:

| Felt | Beskrivelse | Eksempel |
|------|-------------|---------|
| IP-adresse | Printerens lokale IP | `192.168.1.102` |
| Port | Moonraker-port (standard 7125) | `7125` |
| API-nøkkel | Valgfritt, hvis Moonraker krever autentisering | `abc123...` |

:::info Snapmaker U1
Snapmaker U1 har ekstra funksjoner som NFC-filament, AI-defektdeteksjon, timelapse, luftrenser og strømmåler. Disse aktiveres automatisk når en U1 detekteres. For eldre Snapmaker-modeller (A350T, A250T) støttes også SACP-protokollen.
:::

### Generelle tips

:::tip Fast IP-adresse
Sett en fast IP-adresse på printeren i ruteren din (DHCP-reservasjon). Da slipper du å oppdatere dashboardet hver gang printeren får ny IP.
:::

:::tip Automatisk konfigurering
3DPrintForge oppdager automatisk printerens type og konfigurerer filtilgang (FTPS/HTTP), kameramodus og andre funksjoner basert på merke og modell.
:::

## AMS-konfigurasjon

Etter at printeren er koblet til, oppdateres AMS-statusen automatisk. Du kan:

- Gi hver spore et navn og farge
- Koble spoler til filamentlageret ditt
- Se filamentforbruk per spole

Gå til **Innstillinger → Printer → AMS** for manuell konfigurasjon.

## HTTPS-sertifikater {#https-sertifikater}

### Selvgenerert sertifikat (standard)

Dashboardet genererer automatisk et selvgenerert sertifikat ved oppstart. For å stole på det i nettleseren:

- **Chrome/Edge:** Klikk "Avansert" → "Fortsett til siden"
- **Firefox:** Klikk "Avansert" → "Godta risiko og fortsett"

### Eget sertifikat

Legg sertifikatfilene i mappen og konfigurer i `config.json`:

```json
{
  "ssl": {
    "cert": "/sti/til/cert.pem",
    "key": "/sti/til/key.pem"
  }
}
```

:::info Let's Encrypt
Bruker du et domenenavn? Generer gratis sertifikat med Let's Encrypt og Certbot, og pek `cert` og `key` til filene i `/etc/letsencrypt/live/ditt-domene/`.
:::

## Miljøvariabler

Alle innstillinger kan overstyres med miljøvariabler:

| Variabel | Standard | Beskrivelse |
|----------|---------|-------------|
| `PORT` | `3000` | HTTP-port |
| `HTTPS_PORT` | `3443` | HTTPS-port |
| `NODE_ENV` | `production` | Miljø |
| `AUTH_SECRET` | (auto) | JWT-hemmelighet |

## Flerprinter-oppsett

Du kan legge til flere printere under **Innstillinger → Printere → Legg til printer**. Bruk printer-velgeren øverst i dashboardet for å bytte mellom dem.
