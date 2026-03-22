---
sidebar_position: 5
title: PWA
description: Installer Bambu Dashboard som Progressive Web App for app-lignende opplevelse, offline-modus og bakgrunnsvarsler
---

# PWA (Progressive Web App)

Bambu Dashboard kan installeres som en Progressive Web App (PWA) — en app-lignende opplevelse direkte fra nettleseren uten app-butikk. Du får raskere tilgang, push-varsler i bakgrunnen og begrenset offline-funksjonalitet.

## Installere som app

### Desktop (Chrome / Edge / Chromium)

1. Åpne `https://localhost:3443` i nettleseren
2. Se etter **Installer**-ikonet i adressefeltet (ned-pil med skjerm-ikon)
3. Klikk på det
4. Klikk **Installer** i dialogen
5. Bambu Dashboard åpnes som et eget vindu uten nettleser-UI

Alternativt: Klikk på de tre prikkene (⋮) → **Installer Bambu Dashboard...**

### Desktop (Firefox)

Firefox støtter ikke full PWA-installasjon direkte. Bruk Chrome eller Edge for best opplevelse.

### Mobil (Android – Chrome)

1. Åpne **https://din-servers-ip:3443** i Chrome
2. Trykk på de tre prikkene → **Legg til på startskjermen**
3. Gi appen et navn og trykk **Legg til**
4. Ikonet vises på startskjermen — appen åpnes i fullskjerm uten nettleser-UI

### Mobil (iOS – Safari)

1. Åpne **https://din-servers-ip:3443** i Safari
2. Trykk på **Del**-ikonet (firkant med pil opp)
3. Scroll ned og velg **Legg til på hjem-skjerm**
4. Trykk **Legg til**

:::warning iOS-begrensninger
iOS har begrenset PWA-støtte. Push-varsler fungerer kun i iOS 16.4 og nyere. Offline-modus er begrenset.
:::

## Offline-modus

PWA-en cacher nødvendige ressurser for begrenset offline-bruk:

| Funksjon | Offline-tilgjengelig |
|---|---|
| Siste kjente printerstatus | ✅ (fra cache) |
| Printhistorikk | ✅ (fra cache) |
| Filamentlager | ✅ (fra cache) |
| Sanntidsstatus (MQTT) | ❌ Krever tilkobling |
| Kamerastrøm | ❌ Krever tilkobling |
| Sende kommandoer til printer | ❌ Krever tilkobling |

Offline-visning viser et banner øverst: «Kobling mistet — viser siste kjente data».

## Push-varsler i bakgrunnen

PWA-en kan sende push-varsler selv om appen ikke er åpen:

1. Åpne PWA-en
2. Gå til **Innstillinger → Varsler → Browser Push**
3. Klikk **Aktiver push-varsler**
4. Godta tillatelsesdialogen
5. Varslene leveres til operativsystemets varselsentral

Push-varsler fungerer for alle hendelser konfigurert i [Varsler](../funksjoner/notifications).

:::info Service Worker
Push-varsler krever at nettleseren kjører i bakgrunnen (ingen full systemavslutning). PWA-en bruker en Service Worker for mottak.
:::

## App-ikon og utseende

PWA-en bruker Bambu Dashboard-ikonet automatisk. For å tilpasse:

1. Gå til **Innstillinger → System → PWA**
2. Last opp et egendefinert ikon (minimum 512×512 px PNG)
3. Angi **App-navn** og **Kortnavn** (vises under ikonet på mobil)
4. Velg **Temafarge** for statuslinjen på mobil

## Oppdatere PWA-en

PWA-en oppdateres automatisk når serveren oppdateres:

- En diskret banner vises: «Ny versjon tilgjengelig — klikk for å oppdatere»
- Klikk på banneret for å laste inn ny versjon
- Ingen manuell reinstallasjon nødvendig
