---
sidebar_position: 5
title: PWA
description: Zainstaluj Bambu Dashboard jako Progressive Web App dla doświadczenia podobnego do aplikacji, trybu offline i powiadomień w tle
---

# PWA (Progressive Web App)

Bambu Dashboard można zainstalować jako Progressive Web App (PWA) — doświadczenie podobne do aplikacji bezpośrednio z przeglądarki bez sklepu z aplikacjami. Uzyskujesz szybszy dostęp, powiadomienia push w tle i ograniczoną funkcjonalność offline.

## Instalacja jako aplikacja

### Desktop (Chrome / Edge / Chromium)

1. Otwórz `https://localhost:3443` w przeglądarce
2. Szukaj ikony **Zainstaluj** w pasku adresu (strzałka w dół z ikoną ekranu)
3. Kliknij na nią
4. Kliknij **Zainstaluj** w oknie dialogowym
5. Bambu Dashboard otwiera się jako oddzielne okno bez interfejsu przeglądarki

Alternatywnie: Kliknij trzy kropki (⋮) → **Zainstaluj Bambu Dashboard...**

### Desktop (Firefox)

Firefox nie obsługuje pełnej instalacji PWA bezpośrednio. Użyj Chrome lub Edge dla najlepszego doświadczenia.

### Mobilny (Android – Chrome)

1. Otwórz **https://twoje-ip-serwera:3443** w Chrome
2. Dotknij trzech kropek → **Dodaj do ekranu startowego**
3. Nadaj aplikacji nazwę i dotknij **Dodaj**
4. Ikona pojawia się na ekranie startowym — aplikacja otwiera się na pełnym ekranie bez interfejsu przeglądarki

### Mobilny (iOS – Safari)

1. Otwórz **https://twoje-ip-serwera:3443** w Safari
2. Dotknij ikony **Udostępnij** (kwadrat ze strzałką w górę)
3. Przewiń w dół i wybierz **Dodaj do ekranu głównego**
4. Dotknij **Dodaj**

:::warning Ograniczenia iOS
iOS ma ograniczoną obsługę PWA. Powiadomienia push działają tylko w iOS 16.4 i nowszych. Tryb offline jest ograniczony.
:::

## Tryb offline

PWA buforuje niezbędne zasoby do ograniczonego użytku offline:

| Funkcja | Dostępna offline |
|---|---|
| Ostatni znany status drukarki | ✅ (z bufora) |
| Historia wydruków | ✅ (z bufora) |
| Magazyn filamentów | ✅ (z bufora) |
| Status w czasie rzeczywistym (MQTT) | ❌ Wymaga połączenia |
| Strumień kamery | ❌ Wymaga połączenia |
| Wysyłanie poleceń do drukarki | ❌ Wymaga połączenia |

Widok offline pokazuje baner u góry: „Utracono połączenie — wyświetlane są ostatnie znane dane".

## Powiadomienia push w tle

PWA może wysyłać powiadomienia push nawet gdy aplikacja nie jest otwarta:

1. Otwórz PWA
2. Przejdź do **Ustawienia → Powiadomienia → Powiadomienia push w przeglądarce**
3. Kliknij **Aktywuj powiadomienia push**
4. Zaakceptuj okno dialogowe uprawnień
5. Powiadomienia są dostarczane do centrum powiadomień systemu operacyjnego

Powiadomienia push działają dla wszystkich zdarzeń skonfigurowanych w [Powiadomieniach](../funksjoner/notifications).

:::info Service Worker
Powiadomienia push wymagają, aby przeglądarka działała w tle (bez pełnego zamknięcia systemu). PWA używa Service Worker do odbierania.
:::

## Ikona i wygląd aplikacji

PWA automatycznie używa ikony Bambu Dashboard. Aby dostosować:

1. Przejdź do **Ustawienia → System → PWA**
2. Prześlij niestandardową ikonę (minimum 512×512 px PNG)
3. Podaj **Nazwę aplikacji** i **Krótką nazwę** (wyświetlaną pod ikoną na telefonie)
4. Wybierz **Kolor motywu** dla paska stanu na telefonie

## Aktualizowanie PWA

PWA aktualizuje się automatycznie po aktualizacji serwera:

- Dyskretny baner jest wyświetlany: „Dostępna nowa wersja — kliknij, aby zaktualizować"
- Kliknij baner, aby załadować nową wersję
- Nie jest wymagana ręczna reinstalacja
