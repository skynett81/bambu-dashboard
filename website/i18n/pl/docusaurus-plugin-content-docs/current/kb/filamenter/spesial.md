---
sidebar_position: 7
title: Materiały specjalne
description: ASA, PC, PP, PVA, HIPS i inne materiały specjalne do zaawansowanych zastosowań
---

# Materiały specjalne

Poza zwykłymi materiałami istnieje szereg specjalistycznych materiałów do konkretnych zastosowań — od odpornych na UV części zewnętrznych po rozpuszczalny w wodzie materiał podporowy. Oto praktyczny przegląd.

---

## ASA (Acrylonitrile Styrene Acrylate)

ASA jest najlepszą alternatywą dla ABS do zastosowań zewnętrznych. Drukuje się prawie identycznie jak ABS, ale znacznie lepiej znosi słońce i warunki pogodowe.

### Ustawienia

| Parametr | Wartość |
|----------|---------|
| Temperatura dyszy | 240–260 °C |
| Temperatura stołu | 90–110 °C |
| Temperatura komory | 45–55 °C |
| Chłodzenie części | 0–20% |
| Suszenie | Zalecane (70 °C / 4–6 h) |

### Właściwości

- **Odporność na UV:** Zaprojektowany specjalnie do długotrwałej ekspozycji na słońce bez żółknięcia ani pękania
- **Stabilność termiczna:** Temperatura zeszklenia ~100 °C
- **Odporność na uderzenia:** Lepsza odporność na uderzenia niż ABS
- **Obudowa wymagana:** Wypacza się podobnie jak ABS — X1C/P1S daje najlepsze wyniki

:::tip ASA zamiast ABS na zewnątrz
Czy część będzie żyć na zewnątrz w europejskim klimacie (słońce, deszcz, mróz)? Wybierz ASA zamiast ABS. ASA wytrzymuje wiele lat bez widocznej degradacji. ABS zaczyna pękać i żółknąć po miesiącach.
:::

### Zastosowania
- Zewnętrzne wsporniki, osłony i punkty mocowania
- Części aerodynamiczne samochodów, uchwyty anten
- Meble ogrodowe i środowiska zewnętrzne
- Oznakowanie i dyspensery na zewnątrz budynków

---

## PC (Poliwęglan)

Poliwęglan jest jednym z najsilniejszych i najbardziej odpornych na uderzenia tworzyw sztucznych, które można wydrukować w 3D. Jest przezroczysty i wytrzymuje ekstremalne temperatury.

### Ustawienia

| Parametr | Wartość |
|----------|---------|
| Temperatura dyszy | 260–310 °C |
| Temperatura stołu | 100–120 °C |
| Temperatura komory | 50–70 °C |
| Chłodzenie części | 0–20% |
| Suszenie | Wymagane (80 °C / 8–12 h) |

:::danger PC wymaga all-metal hotend i wysokiej temperatury
PC nie topi się w standardowych temperaturach PLA. Bambu X1C z odpowiednią konfiguracją dyszy obsługuje PC. Zawsze sprawdzaj czy komponenty PTFE w hotend wytrzymają twoją temperaturę — standardowe PTFE nie wytrzymuje ciągłej pracy powyżej 240–250 °C.
:::

### Właściwości

- **Bardzo odporny na uderzenia:** Odporny na pęknięcia nawet w niskich temperaturach
- **Przezroczysty:** Może być używany do okien, soczewek i elementów optycznych
- **Stabilność termiczna:** Temperatura zeszklenia ~147 °C — najwyższa wśród powszechnych materiałów
- **Higroskopiczny:** Szybko pochłania wilgoć — zawsze dokładnie suszyć
- **Wypaczanie:** Silny skurcz — wymaga obudowy i brimu

### Zastosowania
- Osłony ochronne i przyłbice
- Elektryczne obudowy wytrzymujące ciepło
- Uchwyty soczewek i elementy optyczne
- Ramy robotów i korpusy dronów

---

## PP (Polipropylen)

Polipropylen jest jednym z najtrudniejszych materiałów do drukowania, ale daje unikalne właściwości, których żaden inny materiał plastyczny nie może dorównać.

### Ustawienia

| Parametr | Wartość |
|----------|---------|
| Temperatura dyszy | 220–250 °C |
| Temperatura stołu | 80–100 °C |
| Chłodzenie części | 20–50% |
| Suszenie | Zalecane (70 °C / 6 h) |

### Właściwości

- **Odporność chemiczna:** Wytrzymuje mocne kwasy, zasady, alkohol i większość rozpuszczalników
- **Lekki i elastyczny:** Niska gęstość, wytrzymuje wielokrotne zginanie (efekt żywego zawiasu)
- **Niska adhezja:** Słabo przywiera do siebie i do płyty roboczej — to jest wyzwanie
- **Nietrujący:** Bezpieczny do kontaktu z żywnością (w zależności od koloru i dodatków)

:::warning PP słabo przywiera do wszystkiego
PP słynie z tego, że nie przywiera do płyty roboczej. Używaj taśmy PP (takiej jak taśma Tesa lub specjalna taśma PP) na Engineering Plate lub użyj kleju w sztyfcie specjalnie opracowanego dla PP. Brim 15–20 mm jest konieczny.
:::

### Zastosowania
- Butelki laboratoryjne i pojemniki na chemikalia
- Przechowywanie żywności i sprzęt kuchenny
- Żywe zawiasy (pokrywy pudełek wytrzymujące tysiące cykli otwierania/zamykania)
- Części samochodowe odporne na chemikalia

---

## PVA (Polyvinyl Alcohol) — materiał podporowy rozpuszczalny w wodzie

PVA to specjalny materiał używany wyłącznie jako materiał podporowy. Rozpuszcza się w wodzie i pozostawia czystą powierzchnię na modelu.

### Ustawienia

| Parametr | Wartość |
|----------|---------|
| Temperatura dyszy | 180–220 °C |
| Temperatura stołu | 35–60 °C |
| Suszenie | Krytyczne (55 °C / 6–8 h) |

:::danger PVA jest ekstremalnie higroskopiczny
PVA pochłania wilgoć szybciej niż jakikolwiek inny popularny filament. Susz PVA dokładnie PRZED drukowaniem i zawsze przechowuj w zapieczętowanym pojemniku z żelem krzemionkowym. Wilgotny PVA klei się w dyszy i jest bardzo trudny do usunięcia.
:::

### Użycie i rozpuszczanie

1. Drukuj model z PVA jako materiałem podporowym (wymaga drukarki multi-material — AMS)
2. Umieść gotowy wydruk w ciepłej wodzie (30–40 °C)
3. Pozostaw na 30–120 minut, zmieniaj wodę w razie potrzeby
4. Spłucz czystą wodą i pozostaw do wyschnięcia

**Zawsze używaj specjalnego ekstrudery dla PVA** jeśli to możliwe — resztki PVA w standardowym extruderze mogą zniszczyć następny wydruk.

### Zastosowania
- Złożone struktury podporowe niemożliwe do ręcznego usunięcia
- Wewnętrzna podpora nawisów bez widocznego odcisku na powierzchni
- Modele z przestrzeniami wewnętrznymi i kanałami wewnętrznymi

---

## HIPS (High Impact Polystyrene) — materiał podporowy rozpuszczalny w rozpuszczalniku

HIPS to inny materiał podporowy, zaprojektowany do użytku z ABS. Rozpuszcza się w **limonenie** (rozpuszczalnik cytrusowy).

### Ustawienia

| Parametr | Wartość |
|----------|---------|
| Temperatura dyszy | 220–240 °C |
| Temperatura stołu | 90–110 °C |
| Temperatura komory | 45–55 °C |
| Suszenie | Zalecane (65 °C / 4–6 h) |

### Użycie z ABS

HIPS drukuje się w tych samych temperaturach co ABS i dobrze do niego przywiera. Po drukowaniu HIPS rozpuszcza się przez zanurzenie wydruku w D-limonenie na 30–60 minut.

:::warning Limonen to nie woda
D-limonen to rozpuszczalnik pozyskiwany ze skórek pomarańczy. Jest stosunkowo nieszkodliwy, ale mimo to używaj rękawic i pracuj w wentylowanym pomieszczeniu. Nie wylewaj użytego limonenu do kanalizacji — oddaj do punktu odbioru odpadów.
:::

### Porównanie: PVA vs HIPS

| Właściwość | PVA | HIPS |
|----------|-----|------|
| Rozpuszczalnik | Woda | D-limonen |
| Własny materiał | Kompatybilny z PLA | Kompatybilny z ABS |
| Wrażliwość na wilgoć | Ekstremalnie wysoka | Umiarkowana |
| Koszt | Wysoki | Umiarkowany |
| Dostępność | Dobra | Umiarkowana |

---

## PVB / Fibersmooth — materiał wygładzany etanolem

PVB (Polyvinyl Butyral) to unikalny materiał, który można **wygładzić etanolem (spirytusem)** — tak samo jak ABS można wygładzić acetonem, ale znacznie bezpieczniej.

### Ustawienia

| Parametr | Wartość |
|----------|---------|
| Temperatura dyszy | 190–210 °C |
| Temperatura stołu | 35–55 °C |
| Chłodzenie części | 80–100% |
| Suszenie | Zalecane (55 °C / 4 h) |

### Wygładzanie etanolem

1. Wydrukuj model przy standardowych ustawieniach PVB
2. Nałóż 99% alkohol izopropylowy (IPA) lub etanol pędzlem
3. Pozostaw do wyschnięcia na 10–15 minut — powierzchnia wyrównuje się równomiernie
4. Powtórz w razie potrzeby dla gładszej powierzchni
5. Alternatywnie: Nałóż i umieść w zamkniętym pojemniku na 5 minut w celu obróbki parą

:::tip Bezpieczniejszy niż aceton
IPA/etanol jest znacznie bezpieczniejszy w obsłudze niż aceton. Temperatura zapłonu jest wyższa, a opary znacznie mniej toksyczne. Dobra wentylacja jest jednak zalecana.
:::

### Zastosowania
- Figurki i dekoracje, gdzie pożądana jest gładka powierzchnia
- Prototypy przeznaczone do prezentacji
- Części przeznaczone do malowania — gładka powierzchnia daje lepszą farbę

---

## Zalecane płyty robocze dla materiałów specjalnych

| Materiał | Zalecana płyta | Klej w sztyfcie? |
|----------|---------------|-----------------|
| ASA | Engineering Plate / High Temp Plate | Tak |
| PC | High Temp Plate | Tak (wymagany) |
| PP | Engineering Plate + taśma PP | Specyficzna taśma PP |
| PVA | Cool Plate / Textured PEI | Nie |
| HIPS | Engineering Plate / High Temp Plate | Tak |
| PVB | Cool Plate / Textured PEI | Nie |
