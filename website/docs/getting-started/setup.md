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

Du trenger tre ting for å koble til printeren:

| Felt | Beskrivelse | Eksempel |
|------|-------------|---------|
| IP-adresse | Printerens lokale IP | `192.168.1.100` |
| Serienummer | 15 tegn, står under printeren | `01P09C123456789` |
| Access Code | 8 tegn, finnes i printerens nettverksinnstillinger | `12345678` |

### Finn Access Code på printeren

**X1C / P1S / P1P:**
1. Gå til **Innstillinger** på skjermen
2. Velg **WLAN** eller **LAN**
3. Se etter **Access Code**

**A1 / A1 Mini:**
1. Trykk på skjermen og velg **Innstillinger**
2. Gå til **WLAN**
3. Se etter **Access Code**

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
