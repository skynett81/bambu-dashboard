---
sidebar_position: 5
title: PWA
description: Installera Bambu Dashboard som Progressive Web App för appliknande upplevelse, offlineläge och bakgrundsaviseringar
---

# PWA (Progressive Web App)

Bambu Dashboard kan installeras som en Progressive Web App (PWA) — en appliknande upplevelse direkt från webbläsaren utan appbutik. Du får snabbare åtkomst, push-aviseringar i bakgrunden och begränsad offlinefunktionalitet.

## Installera som app

### Desktop (Chrome / Edge / Chromium)

1. Öppna `https://localhost:3443` i webbläsaren
2. Leta efter **Installera**-ikonen i adressfältet (nedpil med skärmikon)
3. Klicka på den
4. Klicka **Installera** i dialogen
5. Bambu Dashboard öppnas som ett eget fönster utan webbläsar-UI

Alternativt: Klicka på de tre punkterna (⋮) → **Installera Bambu Dashboard...**

### Desktop (Firefox)

Firefox stöder inte fullständig PWA-installation direkt. Använd Chrome eller Edge för bästa upplevelse.

### Mobil (Android – Chrome)

1. Öppna **https://din-servers-ip:3443** i Chrome
2. Tryck på de tre punkterna → **Lägg till på startskärmen**
3. Ge appen ett namn och tryck **Lägg till**
4. Ikonen visas på startskärmen — appen öppnas i helskärm utan webbläsar-UI

### Mobil (iOS – Safari)

1. Öppna **https://din-servers-ip:3443** i Safari
2. Tryck på **Dela**-ikonen (fyrkant med pil uppåt)
3. Scrolla ner och välj **Lägg till på hemskärmen**
4. Tryck **Lägg till**

:::warning iOS-begränsningar
iOS har begränsat PWA-stöd. Push-aviseringar fungerar endast i iOS 16.4 och senare. Offlineläge är begränsat.
:::

## Offlineläge

PWA:n cachar nödvändiga resurser för begränsad offlineanvändning:

| Funktion | Tillgänglig offline |
|---|---|
| Senast kända skrivarstatus | ✅ (från cache) |
| Utskriftshistorik | ✅ (från cache) |
| Filamentlager | ✅ (från cache) |
| Realtidsstatus (MQTT) | ❌ Kräver anslutning |
| Kameraström | ❌ Kräver anslutning |
| Skicka kommandon till skrivare | ❌ Kräver anslutning |

Offlinelayouten visar en banner längst upp: «Anslutning förlorad — visar senast kända data».

## Push-aviseringar i bakgrunden

PWA:n kan skicka push-aviseringar även när appen inte är öppen:

1. Öppna PWA:n
2. Gå till **Inställningar → Aviseringar → Browser Push**
3. Klicka **Aktivera push-aviseringar**
4. Godkänn behörighetsdialogen
5. Aviseringarna levereras till operativsystemets aviseringscenter

Push-aviseringar fungerar för alla händelser som konfigurerats i [Aviseringar](../funksjoner/notifications).

:::info Service Worker
Push-aviseringar kräver att webbläsaren körs i bakgrunden (ingen fullständig systemavstängning). PWA:n använder en Service Worker för mottagning.
:::

## Appikon och utseende

PWA:n använder Bambu Dashboard-ikonen automatiskt. För att anpassa:

1. Gå till **Inställningar → System → PWA**
2. Ladda upp en anpassad ikon (minst 512×512 px PNG)
3. Ange **Appnamn** och **Kortnamn** (visas under ikonen på mobil)
4. Välj **Temafärg** för statusfältet på mobil

## Uppdatera PWA:n

PWA:n uppdateras automatiskt när servern uppdateras:

- En diskret banner visas: «Ny version tillgänglig — klicka för att uppdatera»
- Klicka på bannern för att ladda den nya versionen
- Ingen manuell ominstallation behövs
