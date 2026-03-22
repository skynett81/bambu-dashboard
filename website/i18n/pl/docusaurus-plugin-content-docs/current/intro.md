---
sidebar_position: 1
title: Witamy w Bambu Dashboard
description: Potężny, samodzielnie hostowany dashboard dla drukarek 3D Bambu Lab
---

# Witamy w Bambu Dashboard

**Bambu Dashboard** to samodzielnie hostowany, w pełni funkcjonalny panel sterowania dla drukarek 3D Bambu Lab. Zapewnia pełny wgląd i kontrolę nad drukarką, zapasami filamentów, historią drukowania i nie tylko — wszystko z jednej karty przeglądarki.

## Czym jest Bambu Dashboard?

Bambu Dashboard łączy się bezpośrednio z drukarką przez MQTT przez LAN, bez zależności od serwerów Bambu Lab. Możesz również połączyć się z Bambu Cloud w celu synchronizacji modeli i historii drukowania.

### Kluczowe funkcje

- **Live dashboard** — temperatura w czasie rzeczywistym, postęp, kamera, status AMS
- **Zapasy filamentów** — śledzenie wszystkich szpul, kolorów, synchronizacja AMS, suszenie
- **Historia drukowania** — kompletny dziennik ze statystykami i eksportem
- **Harmonogram** — widok kalendarza i kolejka drukowania
- **Sterowanie drukarką** — temperatura, prędkość, wentylatory, konsola G-code
- **Powiadomienia** — 7 kanałów (Telegram, Discord, e-mail, ntfy, Pushover, SMS, webhook)
- **Wiele drukarek** — obsługuje całą serię Bambu Lab: X1C, X1E, P1S, P1P, P2S, A1, A1 mini, A1 Combo, H2S, H2D, H2C i więcej
- **Samodzielnie hostowany** — brak zależności od chmury, twoje dane na twoim komputerze

## Szybki start

| Zadanie | Link |
|---------|------|
| Zainstaluj dashboard | [Instalacja](./kom-i-gang/installasjon) |
| Skonfiguruj pierwszą drukarkę | [Konfiguracja](./kom-i-gang/oppsett) |
| Połącz z Bambu Cloud | [Bambu Cloud](./kom-i-gang/bambu-cloud) |
| Odkryj wszystkie funkcje | [Funkcje](./funksjoner/oversikt) |
| Dokumentacja API | [API](./avansert/api) |

:::tip Tryb demo
Możesz wypróbować dashboard bez fizycznej drukarki, uruchamiając `npm run demo`. Uruchamia to 3 symulowane drukarki z żywymi cyklami drukowania.
:::

## Obsługiwane drukarki

- **Seria X1**: X1C, X1C Combo, X1E
- **Seria P1**: P1S, P1S Combo, P1P
- **Seria P2**: P2S, P2S Combo
- **Seria A**: A1, A1 Combo, A1 mini
- **Seria H2**: H2S, H2D (podwójna dysza), H2C (zmieniacz narzędzi, 6 głowic)

## Przegląd techniczny

Bambu Dashboard jest zbudowany z Node.js 22 i vanilla HTML/CSS/JS — brak ciężkich frameworków, brak etapu budowania. Baza danych to SQLite, wbudowana w Node.js 22. Zobacz [Architekturę](./avansert/arkitektur) dla szczegółów.
