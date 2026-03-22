---
sidebar_position: 4
title: Fjernserver
description: Koble sammen flere Bambu Dashboard-instanser for å se alle printere fra ett sentralt dashbord
---

# Fjernserver (Remote Nodes)

Fjernserver-funksjonen lar deg koble flere Bambu Dashboard-instanser sammen slik at du kan se og styre alle printere fra ett sentralt grensesnitt — uansett om de befinner seg i samme nettverk eller på ulike lokasjoner.

Gå til: **https://localhost:3443/#settings** → **Integrasjoner → Fjernservere**

## Bruksscenarioer

- **Hjemme + kontor** — Se printere på begge lokasjoner fra samme dashboard
- **Makerspace** — Sentralt dashbord for alle instanser i rommet
- **Gjesteinstanser** — Gi begrenset innsyn til kunder uten full tilgang

## Arkitektur

```
Primær instans (din PC)
  ├── Printer A (lokal MQTT)
  ├── Printer B (lokal MQTT)
  └── Fjernserver: Sekundær instans
        ├── Printer C (MQTT på fjernlokasjon)
        └── Printer D (MQTT på fjernlokasjon)
```

Den primære instansen poller fjernserverne via REST API og aggregerer data lokalt.

## Legge til en fjernserver

### Steg 1: Generer API-nøkkel på fjerninstansen

1. Logg inn på fjerninstansen (f.eks. `https://192.168.2.50:3443`)
2. Gå til **Innstillinger → API-nøkler**
3. Klikk **Ny nøkkel** → gi den navn «Primær node»
4. Sett tillatelser: **Les** (minst) eller **Les + Skriv** (for fjernstyring)
5. Kopier nøkkelen

### Steg 2: Koble til fra primærinstansen

1. Gå til **Innstillinger → Fjernservere**
2. Klikk **Legg til fjernserver**
3. Fyll inn:
   - **Navn**: f.eks. «Kontor» eller «Garasje»
   - **URL**: `https://192.168.2.50:3443` eller ekstern URL
   - **API-nøkkel**: nøkkelen fra steg 1
4. Klikk **Test tilkobling**
5. Klikk **Lagre**

:::warning Selvsignert sertifikat
Hvis fjerninstansen bruker et selvsignert sertifikat, aktiver **Ignorer TLS-feil** — men gjør dette kun for interne nettverkstilkoblinger.
:::

## Aggregert visning

Etter tilkobling vises fjernprinterene i:

- **Flåteoversikten** — merket med fjernserverens navn og et sky-ikon
- **Statistikk** — aggregert på tvers av alle instanser
- **Filamentlager** — samlet oversikt

## Fjernstyring

Med **Les + Skriv**-tillatelse kan du styre fjernprintere direkte:

- Pause / Gjenoppta / Stopp
- Legge til i utskriftskø (jobb sendes til fjerninstansen)
- Se kamerastrøm (proxyet gjennom fjerninstansen)

:::info Latens
Kamerastrøm via fjernserver kan ha merkbar forsinkelse avhengig av nettverkshastighet og avstand.
:::

## Tilgangskontroll

Begrens hvilke data fjernserveren deler:

1. På fjerninstansen: gå til **Innstillinger → API-nøkler → [Nøkkelnavn]**
2. Begrens tilgang:
   - Kun spesifikke printere
   - Ingen kamerastrøm
   - Skrivebeskyttet (kun lesing)

## Helse og overvåking

Status for hver fjernserver vises i **Innstillinger → Fjernservere**:

- **Tilkoblet** — siste poll vellykket
- **Frakoblet** — kan ikke nå fjernserveren
- **Autentiseringsfeil** — API-nøkkel ugyldig eller utløpt
- **Siste sync** — tidsstempel for siste vellykkede datasynkronisering
