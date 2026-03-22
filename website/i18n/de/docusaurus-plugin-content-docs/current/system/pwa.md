---
sidebar_position: 5
title: PWA
description: Installieren Sie Bambu Dashboard als Progressive Web App für ein app-ähnliches Erlebnis, Offline-Modus und Hintergrundbenachrichtigungen
---

# PWA (Progressive Web App)

Bambu Dashboard kann als Progressive Web App (PWA) installiert werden — ein app-ähnliches Erlebnis direkt aus dem Browser ohne App-Store. Sie erhalten schnelleren Zugriff, Push-Benachrichtigungen im Hintergrund und eingeschränkte Offline-Funktionalität.

## Als App installieren

### Desktop (Chrome / Edge / Chromium)

1. Öffnen Sie `https://localhost:3443` im Browser
2. Suchen Sie nach dem **Installieren**-Symbol in der Adressleiste (Pfeil-nach-unten mit Bildschirm-Symbol)
3. Darauf klicken
4. Klicken Sie im Dialog auf **Installieren**
5. Bambu Dashboard öffnet sich als eigenes Fenster ohne Browser-UI

Alternativ: Auf die drei Punkte (⋮) klicken → **Bambu Dashboard installieren...**

### Desktop (Firefox)

Firefox unterstützt keine vollständige PWA-Installation direkt. Verwenden Sie Chrome oder Edge für das beste Erlebnis.

### Mobil (Android – Chrome)

1. Öffnen Sie **https://ihre-server-ip:3443** in Chrome
2. Auf die drei Punkte tippen → **Zum Startbildschirm hinzufügen**
3. Der App einen Namen geben und auf **Hinzufügen** tippen
4. Das Symbol erscheint auf dem Startbildschirm — die App öffnet sich im Vollbildmodus ohne Browser-UI

### Mobil (iOS – Safari)

1. Öffnen Sie **https://ihre-server-ip:3443** in Safari
2. Auf das **Teilen**-Symbol tippen (Quadrat mit Pfeil nach oben)
3. Nach unten scrollen und **Zum Home-Bildschirm** auswählen
4. Auf **Hinzufügen** tippen

:::warning iOS-Einschränkungen
iOS hat eingeschränkte PWA-Unterstützung. Push-Benachrichtigungen funktionieren nur unter iOS 16.4 und neuer. Der Offline-Modus ist eingeschränkt.
:::

## Offline-Modus

Die PWA speichert notwendige Ressourcen für eingeschränkte Offline-Nutzung:

| Funktion | Offline verfügbar |
|---|---|
| Letzter bekannter Druckerstatus | ✅ (aus Cache) |
| Druckverlauf | ✅ (aus Cache) |
| Filamentlager | ✅ (aus Cache) |
| Echtzeitstatus (MQTT) | ❌ Erfordert Verbindung |
| Kamerastream | ❌ Erfordert Verbindung |
| Befehle an Drucker senden | ❌ Erfordert Verbindung |

Die Offline-Ansicht zeigt ein Banner oben: „Verbindung unterbrochen — zeigt letzte bekannte Daten".

## Push-Benachrichtigungen im Hintergrund

Die PWA kann Push-Benachrichtigungen senden, auch wenn die App nicht geöffnet ist:

1. PWA öffnen
2. Gehen Sie zu **Einstellungen → Benachrichtigungen → Browser Push**
3. Klicken Sie auf **Push-Benachrichtigungen aktivieren**
4. Berechtigungsdialog akzeptieren
5. Benachrichtigungen werden an die Benachrichtigungszentrale des Betriebssystems geliefert

Push-Benachrichtigungen funktionieren für alle unter [Benachrichtigungen](../funksjoner/notifications) konfigurierten Ereignisse.

:::info Service Worker
Push-Benachrichtigungen erfordern, dass der Browser im Hintergrund läuft (kein vollständiges Herunterfahren des Systems). Die PWA verwendet einen Service Worker für den Empfang.
:::

## App-Symbol und Erscheinungsbild

Die PWA verwendet automatisch das Bambu Dashboard-Symbol. Zum Anpassen:

1. Gehen Sie zu **Einstellungen → System → PWA**
2. Ein benutzerdefiniertes Symbol hochladen (mindestens 512×512 px PNG)
3. **App-Name** und **Kurzname** angeben (wird unter dem Symbol auf Mobilgeräten angezeigt)
4. **Themenfarbe** für die Statusleiste auf Mobilgeräten auswählen

## PWA aktualisieren

Die PWA wird automatisch aktualisiert, wenn der Server aktualisiert wird:

- Ein dezentes Banner wird angezeigt: „Neue Version verfügbar — klicken Sie zum Aktualisieren"
- Auf das Banner klicken, um die neue Version zu laden
- Keine manuelle Neuinstallation erforderlich
