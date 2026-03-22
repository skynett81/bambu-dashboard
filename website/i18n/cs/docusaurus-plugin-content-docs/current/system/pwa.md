---
sidebar_position: 5
title: PWA
description: Nainstalujte Bambu Dashboard jako Progressive Web App pro zážitek podobný aplikaci, offline režim a oznámení na pozadí
---

# PWA (Progressive Web App)

Bambu Dashboard lze nainstalovat jako Progressive Web App (PWA) — zážitek podobný aplikaci přímo z prohlížeče bez obchodu s aplikacemi. Získáte rychlejší přístup, push oznámení na pozadí a omezenou offline funkčnost.

## Instalace jako aplikace

### Desktop (Chrome / Edge / Chromium)

1. Otevřete `https://localhost:3443` v prohlížeči
2. Hledejte ikonu **Instalovat** v adresním řádku (šipka dolů s ikonou monitoru)
3. Klikněte na ni
4. Klikněte na **Instalovat** v dialogu
5. Bambu Dashboard se otevře jako samostatné okno bez prohlížečového uživatelského rozhraní

Alternativně: Klikněte na tři tečky (⋮) → **Instalovat Bambu Dashboard...**

### Desktop (Firefox)

Firefox nepodporuje plnou instalaci PWA přímo. Pro nejlepší zážitek použijte Chrome nebo Edge.

### Mobil (Android – Chrome)

1. Otevřete **https://IP-vašeho-serveru:3443** v Chrome
2. Klepněte na tři tečky → **Přidat na plochu**
3. Pojmenujte aplikaci a klepněte na **Přidat**
4. Ikona se zobrazí na ploše — aplikace se otevírá na celou obrazovku bez prohlížečového uživatelského rozhraní

### Mobil (iOS – Safari)

1. Otevřete **https://IP-vašeho-serveru:3443** v Safari
2. Klepněte na ikonu **Sdílet** (čtverec se šipkou nahoru)
3. Scrollujte dolů a vyberte **Přidat na plochu**
4. Klepněte na **Přidat**

:::warning Omezení iOS
iOS má omezenou podporu PWA. Push oznámení fungují pouze v iOS 16.4 a novějším. Offline režim je omezený.
:::

## Offline režim

PWA ukládá do mezipaměti potřebné zdroje pro omezenou offline funkčnost:

| Funkce | Dostupné offline |
|---|---|
| Poslední známý stav tiskárny | ✅ (z mezipaměti) |
| Historie tisku | ✅ (z mezipaměti) |
| Sklad filamentů | ✅ (z mezipaměti) |
| Stav v reálném čase (MQTT) | ❌ Vyžaduje připojení |
| Kamerový stream | ❌ Vyžaduje připojení |
| Odesílání příkazů tiskárně | ❌ Vyžaduje připojení |

Offline zobrazení zobrazuje banner nahoře: „Ztraceno připojení — zobrazuji poslední známá data".

## Push oznámení na pozadí

PWA může odesílat push oznámení i když aplikace není otevřena:

1. Otevřete PWA
2. Přejděte na **Nastavení → Upozornění → Browser Push**
3. Klikněte na **Aktivovat push oznámení**
4. Přijměte dialog oprávnění
5. Oznámení jsou doručována do centra oznámení operačního systému

Push oznámení fungují pro všechny události nakonfigurované v [Upozorněních](../funksjoner/notifications).

:::info Service Worker
Push oznámení vyžadují, aby prohlížeč běžel na pozadí (ne plné vypnutí systému). PWA používá Service Worker pro příjem.
:::

## Ikona aplikace a vzhled

PWA automaticky používá ikonu Bambu Dashboard. Pro přizpůsobení:

1. Přejděte na **Nastavení → Systém → PWA**
2. Nahrajte vlastní ikonu (minimálně 512×512 px PNG)
3. Zadejte **Název aplikace** a **Krátký název** (zobrazuje se pod ikonou na mobilu)
4. Vyberte **Barvu tématu** pro stavový řádek na mobilu

## Aktualizace PWA

PWA se automaticky aktualizuje při aktualizaci serveru:

- Zobrazí se nenápadný banner: „K dispozici je nová verze — klikněte pro aktualizaci"
- Klikněte na banner pro načtení nové verze
- Není potřeba ruční přeinstalace
