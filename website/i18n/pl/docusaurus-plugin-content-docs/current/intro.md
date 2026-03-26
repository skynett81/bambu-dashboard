---
sidebar_position: 1
title: Witamy w Bambu Dashboard
description: Potężny, samodzielnie hostowany dashboard dla drukarek 3D Bambu Lab
---

# Witamy w Bambu Dashboard

[![ko-fi](https://ko-fi.com/img/githubbutton_sm.svg)](https://ko-fi.com/V7V21NRKM7)

**Bambu Dashboard** to samodzielnie hostowany, w pełni funkcjonalny panel sterowania dla drukarek 3D Bambu Lab. Zapewnia pełny wgląd i kontrolę nad drukarką, zapasami filamentów, historią drukowania i nie tylko — wszystko z jednej karty przeglądarki.

## Czym jest Bambu Dashboard?

Bambu Dashboard łączy się bezpośrednio z drukarką przez MQTT przez LAN, bez zależności od serwerów Bambu Lab. Możesz również połączyć się z Bambu Cloud w celu synchronizacji modeli i historii drukowania.

### Kluczowe funkcje

- **Live dashboard** — temperatura w czasie rzeczywistym, postęp, kamera, status AMS ze wskaźnikiem LIVE
- **Zapasy filamentów** — śledź wszystkie szpule z synchronizacją AMS, obsługą szpuli EXT, informacjami o materiale, zgodnością z płytą i przewodnikiem suszenia
- **Śledzenie filamentów** — dokładne śledzenie z 4-poziomowym fallbackiem (czujnik AMS → szacunek EXT → cloud → czas trwania)
- **Przewodnik po materiałach** — 15 materiałów z temperaturami, zgodnością z płytą, suszeniem, właściwościami i wskazówkami
- **Historia drukowania** — kompletny dziennik z nazwami modeli, linkami MakerWorld, zużyciem filamentu i kosztami
- **Harmonogram** — widok kalendarza, kolejka drukowania z równoważeniem obciążenia i sprawdzaniem filamentu
- **Sterowanie drukarką** — temperatura, prędkość, wentylatory, konsola G-code
- **Print Guard** — automatyczna ochrona z xcam + 5 monitorami czujników
- **Kalkulator kosztów** — materiał, prąd, robocizna, zużycie, narzut z sugerowaną ceną sprzedaży
- **Konserwacja** — śledzenie z interwałami opartymi na KB, żywotność dyszy, żywotność płyty i przewodnik
- **Alerty dźwiękowe** — 9 konfigurowalnych zdarzeń z niestandardowym przesyłaniem dźwięku i głośnikiem drukarki (M300)
- **Dziennik aktywności** — trwała oś czasu wszystkich zdarzeń (druki, błędy, konserwacja, filament)
- **Powiadomienia** — 7 kanałów (Telegram, Discord, e-mail, ntfy, Pushover, SMS, webhook)
- **Wiele drukarek** — obsługuje całą serię Bambu Lab
- **17 języków** — norweski, angielski, niemiecki, francuski, hiszpański, włoski, japoński, koreański, holenderski, polski, portugalski, szwedzki, turecki, ukraiński, chiński, czeski, węgierski
- **Samodzielnie hostowany** — brak zależności od chmury, twoje dane na twoim komputerze

### Nowości w v1.1.13

- **Wykrywanie szpuli EXT** dla P2S/A1 przez pole mapowania MQTT — zużycie filamentu śledzone poprawnie dla zewnętrznej szpuli
- **Baza danych materiałów filamentów** z 15 materiałami, zgodnością z płytą, przewodnikiem suszenia i właściwościami
- **Panel konserwacji** z interwałami opartymi na KB, 4 nowymi typami dysz, kartą przewodnika z linkami do dokumentacji
- **Alerty dźwiękowe** z 9 zdarzeniami, niestandardowym przesyłaniem (MP3/OGG/WAV, maks. 10 s), kontrolą głośności i głośnikiem drukarki
- **Dziennik aktywności** — trwała oś czasu ze wszystkich baz danych, niezależnie od tego, czy strona była otwarta
- **Kody błędów HMS** z czytelnymi opisami z ponad 270 kodów
- **Pełne i18n** — wszystkie 2944 klucze przetłumaczone na 17 języków
- **Automatyczne tworzenie dokumentacji** — dokumentacja jest tworzona automatycznie podczas instalacji i uruchamiania serwera

## Szybki start

| Zadanie | Link |
|---------|------|
| Zainstaluj dashboard | [Instalacja](./kom-i-gang/installasjon) |
| Skonfiguruj pierwszą drukarkę | [Konfiguracja](./kom-i-gang/oppsett) |
| Połącz z Bambu Cloud | [Bambu Cloud](./kom-i-gang/bambu-cloud) |
| Odkryj wszystkie funkcje | [Funkcje](./funksjoner/oversikt) |
| Przewodnik po filamentach | [Przewodnik po materiałach](./kb/filamenter/guide) |
| Przewodnik konserwacji | [Konserwacja](./kb/vedlikehold/dyse) |
| Dokumentacja API | [API](./avansert/api) |

:::tip Tryb demo
Możesz wypróbować dashboard bez fizycznej drukarki, uruchamiając `npm run demo`. Uruchamia to 3 symulowane drukarki z żywymi cyklami drukowania.
:::

## Obsługiwane drukarki

Wszystkie drukarki Bambu Lab z trybem LAN:

- **Seria X1**: X1C, X1C Combo, X1E
- **Seria P1**: P1S, P1S Combo, P1P
- **Seria P2**: P2S, P2S Combo
- **Seria A**: A1, A1 Combo, A1 mini
- **Seria H2**: H2S, H2D (podwójna dysza), H2C (zmieniacz narzędzi, 6 głowic)

## Funkcje w szczegółach

### Śledzenie filamentów

Dashboard śledzi zużycie filamentu automatycznie z 4-poziomowym fallbackiem:

1. **Diff czujnika AMS** — najdokładniejszy, porównuje remain% na początku/końcu
2. **EXT bezpośrednio** — dla P2S/A1 bez vt_tray, używa szacunku cloud
3. **Szacunek cloud** — z danych zadania drukowania Bambu Cloud
4. **Szacunek na podstawie czasu** — ~30 g/godz. jako ostatni fallback

Wszystkie wartości są wyświetlane jako minimum czujnika AMS i bazy danych szpul, aby uniknąć błędów po nieudanych wydrukach.

### Przewodnik po materiałach

Wbudowana baza danych z 15 materiałami, w tym:
- Temperatury (dysza, stół, komora)
- Zgodność z płytą (Cool, Engineering, High Temp, Textured PEI)
- Informacje o suszeniu (temperatura, czas, higroskopijność)
- 8 właściwości (wytrzymałość, elastyczność, odporność na ciepło, UV, powierzchnia, łatwość użycia)
- Poziom trudności i specjalne wymagania (utwardzona dysza, obudowa)

### Alerty dźwiękowe

9 konfigurowalnych zdarzeń z obsługą:
- **Niestandardowe klipy audio** — prześlij MP3/OGG/WAV (maks. 10 sekund, 500 KB)
- **Wbudowane tony** — metaliczne/synth dźwięki generowane z Web Audio API
- **Głośnik drukarki** — melodie G-code M300 bezpośrednio na buzzerze drukarki
- **Odliczanie** — alarm dźwiękowy, gdy pozostała 1 minuta drukowania

### Konserwacja

Kompletny system konserwacji z:
- Śledzeniem komponentów (dysza, rura PTFE, pręty, łożyska, AMS, płyta, suszenie)
- Interwałami opartymi na KB z dokumentacji
- Żywotnością dyszy według typu (mosiądz, utwardzana stal, HS01)
- Żywotnością płyty według typu (Cool, Engineering, High Temp, Textured PEI)
- Kartą przewodnika ze wskazówkami i linkami do pełnej dokumentacji

## Przegląd techniczny

Bambu Dashboard jest zbudowany z Node.js 22 i vanilla HTML/CSS/JS — brak ciężkich frameworków, brak etapu budowania. Baza danych to SQLite, wbudowana w Node.js 22.

- **Backend**: Node.js 22 z tylko 3 pakietami npm (mqtt, ws, basic-ftp)
- **Frontend**: Vanilla HTML/CSS/JS, brak etapu budowania
- **Baza danych**: SQLite przez wbudowany Node.js 22 `--experimental-sqlite`
- **Dokumentacja**: Docusaurus z 17 językami, automatycznie budowana podczas instalacji
- **API**: 177+ punktów końcowych, dokumentacja OpenAPI pod `/api/docs`

Zobacz [Architekturę](./avansert/arkitektur) dla szczegółów.
