---
sidebar_position: 8
title: Profile druku i ustawienia
description: Rozumienie i dostosowywanie profili druku w Bambu Studio — prędkość, temperatura, retrakcja i ustawienia jakości
---

# Profile druku i ustawienia

Profil druku to zbiór ustawień, które dokładnie określają sposób pracy drukarki — od temperatury i prędkości po retrakcję i wysokość warstwy. Odpowiedni profil to różnica między idealnym wydrukiem a nieudanym.

## Czym jest profil druku?

Bambu Studio rozróżnia trzy rodzaje profili:

- **Profil filamentu** — temperatura, chłodzenie, retrakcja i suszenie dla konkretnego materiału
- **Profil procesu** — wysokość warstwy, prędkość, wypełnienie i ustawienia podpory
- **Profil drukarki** — ustawienia specyficzne dla maszyny (ustawiane automatycznie dla drukarek Bambu Lab)

Bambu Studio dostarcza generyczne profile dla wszystkich filamentów Bambu Lab i wielu materiałów innych firm. Zewnętrzni dostawcy, tacy jak Polyalkemi, eSUN i Fillamentum, tworzą ponadto zoptymalizowane profile dostrojone do dokładnie ich filamentu.

Profile można swobodnie importować, eksportować i udostępniać między użytkownikami.

## Importowanie profili w Bambu Studio

1. Pobierz profil (plik JSON) ze strony dostawcy lub MakerWorld
2. Otwórz Bambu Studio
3. Przejdź do **Plik → Import → Importuj konfigurację**
4. Wybierz pobrany plik
5. Profil pojawi się pod wyborem filamentu w slicerze

:::tip Organizacja
Nadaj profilom opisowe nazwy, np. "Polyalkemi PLA HF 0.20mm Balanced", aby łatwo znaleźć właściwy profil następnym razem.
:::

## Ważne ustawienia wyjaśnione

### Temperatura

Temperatura jest najważniejszym pojedynczym ustawieniem. Za niska temperatura daje słabe przyleganie warstw i niepełne wypełnienie. Za wysoka daje stringing, bulgoczącą powierzchnię i spalony filament.

| Ustawienie | Opis | Typowe PLA | Typowe PETG | Typowe ABS |
|---|---|---|---|---|
| Temperatura dyszy | Temperatura topnienia | 200–220 °C | 230–250 °C | 240–260 °C |
| Temperatura stołu | Ciepło płyty roboczej | 55–65 °C | 70–80 °C | 90–110 °C |
| Temperatura komory | Temperatura obudowy | Niepotrzebna | Opcjonalna | 40–60 °C zalecane |

Bambu Lab X1C i seria P1 mają aktywne ogrzewanie komory. Dla ABS i ASA jest to kluczowe, aby uniknąć wypaczania i rozwarstwiania.

### Prędkość

Drukarki Bambu Lab mogą działać bardzo szybko, ale wyższa prędkość nie zawsze oznacza lepszy wynik. Szczególnie prędkość zewnętrznej ściany wpływa na powierzchnię.

| Ustawienie | Co wpływa | Tryb jakości | Zrównoważony | Szybki |
|---|---|---|---|---|
| Zewnętrzna ściana | Wynik powierzchni | 45–60 mm/s | 100 mm/s | 150+ mm/s |
| Wewnętrzna ściana | Wytrzymałość strukturalna | 100 mm/s | 150 mm/s | 200+ mm/s |
| Wypełnienie | Wewnętrzne wypełnienie | 150 mm/s | 200 mm/s | 300+ mm/s |
| Górna warstwa | Powierzchnia górna | 45–60 mm/s | 80 mm/s | 100 mm/s |
| Dolna warstwa | Pierwsza warstwa | 30–50 mm/s | 50 mm/s | 50 mm/s |

:::tip Prędkość zewnętrznej ściany jest kluczem do jakości powierzchni
Zmniejsz prędkość zewnętrznej ściany do 45–60 mm/s dla jedwabistego wykończenia. Dotyczy to szczególnie Silk PLA i filamentów matowych. Ściany wewnętrzne i wypełnienie mogą nadal działać szybko bez wpływu na powierzchnię.
:::

### Retrakcja (cofanie)

Retrakcja cofa filament trochę z dyszy, gdy drukarka porusza się bez wytłaczania. Zapobiega to stringingowi (cienkie nici między częściami). Nieprawidłowe ustawienia retrakcji dają albo stringing (za mało) albo zacięcie (za dużo).

| Materiał | Odległość retrakcji | Prędkość retrakcji | Uwaga |
|---|---|---|---|
| PLA | 0,8–2,0 mm | 30–50 mm/s | Standardowe dla większości |
| PETG | 1,0–3,0 mm | 20–40 mm/s | Za dużo = zacięcie |
| ABS | 0,5–1,5 mm | 30–50 mm/s | Podobnie do PLA |
| TPU | 0–1,0 mm | 10–20 mm/s | Minimalna! Lub dezaktywuj |
| Nylon | 1,0–2,0 mm | 30–40 mm/s | Wymaga suchego filamentu |

:::warning Retrakcja TPU
Dla TPU i innych elastycznych materiałów: używaj minimalnej retrakcji (0–1 mm) lub całkowicie dezaktywuj. Zbyt duża retrakcja powoduje, że miękki filament ugina się i blokuje w rurce Bowdena, co prowadzi do zacięcia.
:::

### Wysokość warstwy

Wysokość warstwy określa równowagę między poziomem szczegółów a szybkością drukowania. Niska wysokość warstwy daje dokładniejsze szczegóły i gładsze powierzchnie, ale trwa znacznie dłużej.

| Wysokość warstwy | Opis | Zastosowanie |
|---|---|---|
| 0,08 mm | Ultrafine | Miniatury, szczegółowe modele |
| 0,12 mm | Fina | Jakość wizualna, tekst, logo |
| 0,16 mm | Wysoka jakość | Standard dla większości wydruków |
| 0,20 mm | Zrównoważona | Dobra równowaga czas/jakość |
| 0,28 mm | Szybka | Części funkcjonalne, prototypy |

Bambu Studio pracuje z ustawieniami procesowymi takimi jak "0.16mm High Quality" i "0.20mm Balanced Quality" — ustawiają one wysokość warstwy i automatycznie dostosowują prędkość i chłodzenie.

### Wypełnienie (Infill)

Wypełnienie określa, ile materiału wypełnia wnętrze wydruku. Więcej wypełnienia = mocniejszy, cięższy i dłuższy czas drukowania.

| Procent | Zastosowanie | Zalecany wzór |
|---|---|---|
| 10–15% | Dekoracja, wizualny | Gyroid |
| 20–30% | Ogólne użycie | Cubic, Gyroid |
| 40–60% | Części funkcjonalne | Cubic, Honeycomb |
| 80–100% | Maksymalna wytrzymałość | Rectilinear |

:::tip Gyroid to król
Wzór Gyroid daje najlepszy stosunek wytrzymałości do wagi i jest izotropowy — równie mocny we wszystkich kierunkach. Jest też szybszy do drukowania niż honeycomb i dobrze wygląda przy otwartych modelach. Standardowy wybór w większości sytuacji.
:::

## Wskazówki dotyczące profili według materiału

### PLA — skoncentrowany na jakości

PLA jest przebaczający i łatwy do obróbki. Skup się na jakości powierzchni:

- **Zewnętrzna ściana:** 60 mm/s dla idealnej powierzchni, szczególnie przy Silk PLA
- **Wentylator chłodzący:** 100% po warstwie 3 — kluczowe dla ostrych szczegółów i mostków
- **Brim:** Niepotrzebny przy czystym PLA z prawidłowo skalibrowaną płytą
- **Wysokość warstwy:** 0,16 mm High Quality daje dobrą równowagę dla części dekoracyjnych

### PETG — równowaga

PETG jest mocniejszy od PLA, ale wymaga więcej dopracowywania:

- **Ustawienie procesu:** 0,16 mm High Quality lub 0,20 mm Balanced Quality
- **Wentylator chłodzący:** 30–50% — zbyt duże chłodzenie daje słabe przyleganie warstw i kruche wydruki
- **Z-hop:** Aktywuj, aby zapobiec wleczeniu dyszy po powierzchni przy ruchu
- **Stringing:** Dostosuj retrakcję i drukuj trochę cieplej, a nie chłodniej

### ABS — obudowa to wszystko

ABS drukuje się dobrze, ale wymaga kontrolowanego środowiska:

- **Wentylator chłodzący:** WYŁĄCZONY (0%) — absolutnie kluczowe! Chłodzenie powoduje rozwarstwianie i wypaczanie
- **Obudowa:** Zamknij drzwi i pozwól komorze nagrzać się do 40–60 °C przed rozpoczęciem druku
- **Brim:** Zalecane 5–8 mm dla dużych i płaskich części — zapobiega wypaczaniu w narożnikach
- **Wentylacja:** Zapewnij dobrą wentylację w pomieszczeniu — ABS emituje opary styrenu

### TPU — wolno i ostrożnie

Elastyczne materiały wymagają zupełnie innego podejścia:

- **Prędkość:** Maks. 30 mm/s — zbyt szybkie drukowanie powoduje wyginanie się filamentu
- **Retrakcja:** Minimalna (0–1 mm) lub całkowite dezaktywowanie
- **Direct drive:** TPU działa tylko na maszynach Bambu Lab z wbudowanym direct drive
- **Wysokość warstwy:** 0,20 mm Balanced daje dobrą fuzję warstw bez nadmiernego naprężenia

### Nylon — suchy filament to wszystko

Nylon jest higroskopiczny i pochłania wilgoć w ciągu godzin:

- **Zawsze susz:** 70–80 °C przez 8–12 godzin przed drukowaniem
- **Obudowa:** Drukuj z suszarki bezpośrednio do AMS, aby filament pozostał suchy
- **Retrakcja:** Umiarkowana (1,0–2,0 mm) — wilgotny nylon daje znacznie więcej strsungingu
- **Płyta robocza:** Engineering Plate z klejem lub płyta Garolite dla najlepszej adhezji

## Wstępne ustawienia Bambu Lab

Bambu Studio ma wbudowane profile dla całej rodziny produktów Bambu Lab:

- Bambu Lab Basic PLA, PETG, ABS, TPU, PVA, PA, PC, ASA
- Materiały podporowe Bambu Lab (Support W, Support G)
- Bambu Lab Specialty (PLA-CF, PETG-CF, ABS-GF, PA-CF, PPA-CF, PPA-GF)
- Profile generyczne (Generic PLA, Generic PETG, itp.) służące jako punkt startowy dla filamentów innych firm

Profile generyczne są dobrym punktem startowym. Dostosuj temperaturę o ±5 °C na podstawie rzeczywistego filamentu.

## Profile firm zewnętrznych

Wielu wiodących dostawców oferuje gotowe profile Bambu Studio zoptymalizowane dla konkretnego filamentu:

| Dostawca | Dostępne profile | Pobierz |
|---|---|---|
| [Polyalkemi](https://polyalkemi.no) | PLA, PLA High Speed, PETG, PETG-CF, ABS | [Profile Bambu Lab](https://gammel.polyalkemi.no/bambulabprofiler/) |
| [eSUN](https://www.esun3d.com) | PLA+, ePLA-Lite, PETG, eABS | [Profile eSUN](https://www.esun3d.com/bambu-lab-3d-printer-filament-setting/) |
| [Fillamentum](https://fillamentum.com) | Nonoilen PLA, PLA, PET-G | [Profile Fillamentum](https://fillamentum.com/pages/bambu-lab-print-profiles) |
| [Spectrum](https://spectrumfilaments.com) | PETG FR V0, PETG-HT100 | [Profile Spectrum](https://spectrumfilaments.com/bambu-lab-profiles/) |
| [Fiberlogy](https://fiberlogy.com) | Easy-PETG, Matte-PETG, TPU 30D | [Profile Fiberlogy](https://fiberlogy.com/en/printing-profiles/) |
| [add:north](https://addnorth.com) | PLA, PETG, AduraX, X-PLA | [Profile add:north](https://addnorth.com/printing-profiles) |

:::info Gdzie znaleźć profile?
- **Bambu Studio:** Wbudowane profile dla materiałów Bambu Lab i wielu firm zewnętrznych
- **Strona dostawcy:** Szukaj "Bambu Studio profile" lub "JSON profile" w sekcji pobrań
- **Bambu Dashboard:** W panelu Profili druku w sekcji Narzędzia
- **MakerWorld:** Profile są często udostępniane wraz z modelami przez innych użytkowników
:::

## Eksportowanie i udostępnianie profili

Własne profile można eksportować i udostępniać innym:

1. Przejdź do **Plik → Eksport → Eksportuj konfigurację**
2. Wybierz które profile (filament, proces, drukarka) chcesz wyeksportować
3. Zapisz jako plik JSON
4. Udostępnij plik bezpośrednio lub prześlij na MakerWorld

Jest to szczególnie przydatne, gdy przez dłuższy czas dostosujesz profil i chcesz go zachować przy ponownej instalacji Bambu Studio.

---

## Rozwiązywanie problemów z profilami

### Stringing

Cienkie nici między wydrukowanymi częściami — spróbuj w tej kolejności:

1. Zwiększ odległość retrakcji o 0,5 mm
2. Obniż temperaturę drukowania o 5 °C
3. Aktywuj "Wipe on retract"
4. Sprawdź czy filament jest suchy

### Niepełne wypełnienie / dziury w ścianach

Wydruk nie wygląda solidnie lub ma dziury:

1. Sprawdź czy ustawienie średnicy filamentu jest prawidłowe (1,75 mm)
2. Skalibruj przepływ w Bambu Studio (Kalibracja → Przepływ)
3. Zwiększ temperaturę o 5 °C
4. Sprawdź częściowe zatkanie dyszy

### Słabe przyleganie warstw

Warstwy nie trzymają się razem dobrze:

1. Zwiększ temperaturę o 5–10 °C
2. Zmniejsz wentylator chłodzący (szczególnie PETG i ABS)
3. Zmniejsz prędkość drukowania
4. Sprawdź czy obudowa jest wystarczająco ciepła (dla ABS/ASA)
