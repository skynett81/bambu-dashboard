---
sidebar_position: 5
title: PWA
description: Install Bambu Dashboard as a Progressive Web App for an app-like experience, offline mode, and background notifications
---

# PWA (Progressive Web App)

Bambu Dashboard can be installed as a Progressive Web App (PWA) — an app-like experience directly from the browser without an app store. You get faster access, push notifications in the background, and limited offline functionality.

## Installing as an app

### Desktop (Chrome / Edge / Chromium)

1. Open **https://localhost:3443** in the browser
2. Look for the **Install** icon in the address bar (down arrow with screen icon)
3. Click on it
4. Click **Install** in the dialog
5. Bambu Dashboard opens as its own window without browser UI

Alternatively: Click the three dots (⋮) → **Install Bambu Dashboard...**

### Desktop (Firefox)

Firefox does not support full PWA installation directly. Use Chrome or Edge for the best experience.

### Mobile (Android – Chrome)

1. Open **https://your-server-ip:3443** in Chrome
2. Tap the three dots → **Add to home screen**
3. Give the app a name and tap **Add**
4. The icon appears on the home screen — the app opens in fullscreen without browser UI

### Mobile (iOS – Safari)

1. Open **https://your-server-ip:3443** in Safari
2. Tap the **Share** icon (square with arrow pointing up)
3. Scroll down and select **Add to Home Screen**
4. Tap **Add**

:::warning iOS limitations
iOS has limited PWA support. Push notifications only work in iOS 16.4 and later. Offline mode is limited.
:::

## Offline mode

The PWA caches necessary resources for limited offline use:

| Feature | Offline available |
|---|---|
| Last known printer status | ✅ (from cache) |
| Print history | ✅ (from cache) |
| Filament inventory | ✅ (from cache) |
| Real-time status (MQTT) | ❌ Requires connection |
| Camera stream | ❌ Requires connection |
| Sending commands to printer | ❌ Requires connection |

Offline view shows a banner at the top: "Connection lost — showing last known data".

## Push notifications in the background

The PWA can send push notifications even when the app is not open:

1. Open the PWA
2. Go to **Settings → Notifications → Browser Push**
3. Click **Enable push notifications**
4. Accept the permission dialog
5. Notifications are delivered to the operating system's notification center

Push notifications work for all events configured in [Notifications](../funksjoner/notifications).

:::info Service Worker
Push notifications require the browser to be running in the background (not fully shut down). The PWA uses a Service Worker for reception.
:::

## App icon and appearance

The PWA uses the Bambu Dashboard icon automatically. To customize:

1. Go to **Settings → System → PWA**
2. Upload a custom icon (minimum 512×512 px PNG)
3. Set **App name** and **Short name** (displayed below the icon on mobile)
4. Choose **Theme color** for the status bar on mobile

## Updating the PWA

The PWA updates automatically when the server is updated:

- A subtle banner is shown: "New version available — click to update"
- Click the banner to load the new version
- No manual reinstallation needed
