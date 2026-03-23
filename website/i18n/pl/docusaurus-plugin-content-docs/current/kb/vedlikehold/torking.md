---
sidebar_position: 5
title: Suszenie filamentu
description: Dlaczego, kiedy i jak suszyć filament — temperatury, czasy i wskazówki dotyczące przechowywania dla wszystkich materiałów
---

# Suszenie filamentu

Wilgotny filament jest jedną z najczęstszych i najbardziej niedocenianych przyczyn słabych wydruków. Nawet filament, który wygląda na suchy, mógł wchłonąć wystarczająco dużo wilgoci, aby zepsuć wynik — szczególnie w przypadku materiałów takich jak nylon i PVA.

## Dlaczego suszyć filament?

Wiele rodzajów tworzyw sztucznych jest **higroskopicznych** — pochłaniają wilgoć z powietrza z biegiem czasu. Gdy wilgotny filament przechodzi przez gorącą dyszę, woda gwałtownie odparowuje i tworzy mikropęcherzyki w stopionym plastiku. Rezultatem jest:

- **Trzaskające i pstrykające dźwięki** podczas drukowania
- **Mgła lub para** widoczna z dyszy
- **Stringing i hairing** których nie można wyeliminować regulacjami
- **Szorstka lub ziarnista powierzchnia** — szczególnie na warstwach górnych
- **Słabe części** z kiepskim przyleganiem warstw i mikropęknięciami
- **Matowe lub błyszczące wykończenie** na materiałach, które normalnie powinny być błyszczące lub jedwabiste

:::warning Wysusz filament ZANIM dostosujesz ustawienia
Wiele osób spędza godziny na dostrajaniu retrakcji i temperatury bez efektu — ponieważ przyczyną jest wilgotny filament. Zawsze suszyć filament i testować ponownie przed zmianą ustawień drukowania.
:::

## Które materiały wymagają suszenia?

Wszystkie rodzaje tworzyw sztucznych mogą się zwilgnąć, ale stopień higroskopiczności różni się ogromnie:

| Materiał | Higroskopiczność | Temperatura suszenia | Czas suszenia | Priorytet |
|---|---|---|---|---|
| PLA | Niska | 45–50 °C | 4–6 godzin | Opcjonalne |
| PETG | Średnia | 65 °C | 4–6 godzin | Zalecane |
| ABS | Średnia | 65–70 °C | 4 godziny | Zalecane |
| TPU | Średnia | 50–55 °C | 4–6 godzin | Zalecane |
| ASA | Średnia | 65 °C | 4 godziny | Zalecane |
| PC | Wysoka | 70–80 °C | 6–8 godzin | Wymagane |
| PA/Nylon | Ekstremalnie wysoka | 70–80 °C | 8–12 godzin | WYMAGANE |
| PA-CF | Ekstremalnie wysoka | 70–80 °C | 8–12 godzin | WYMAGANE |
| PVA | Ekstremalnie wysoka | 45–50 °C | 4–6 godzin | WYMAGANE |

:::tip Nylon i PVA są krytyczne
PA/Nylon i PVA mogą wchłonąć wystarczająco dużo wilgoci, aby stać się niemożliwe do drukowania w ciągu **kilku godzin** w normalnym klimacie wewnętrznym. Nigdy nie otwieraj nowej szpuli tych materiałów bez natychmiastowego suszenia — i zawsze drukuj z zamkniętego pojemnika lub suszarki.
:::

## Objawy wilgotnego filamentu

Nie zawsze trzeba suszyć filament według tabeli. Naucz się rozpoznawać objawy:

| Objaw | Wilgoć? | Inne możliwe przyczyny |
|---|---|---|
| Trzaskające/pstrykające dźwięki | Tak, bardzo prawdopodobne | Częściowo zatkana dysza |
| Mgła/para z dyszy | Tak, niemal pewne | Brak innej przyczyny |
| Szorstka, ziarnista powierzchnia | Tak, możliwe | Za niska temp, za duża prędkość |
| Stringing który nie znika | Tak, możliwe | Zła retrakcja, za wysoka temp |
| Słabe, kruche części | Tak, możliwe | Za niska temp, złe wypełnienie |
| Zmiana koloru lub matowe wykończenie | Tak, możliwe | Zła temp, spalony plastik |

## Metody suszenia

### Suszarka do filamentu (zalecana)

Dedykowane suszarki do filamentu są najprostszym i najbezpieczniejszym rozwiązaniem. Utrzymują dokładną temperaturę i pozwalają drukować bezpośrednio z suszarki przez cały czas drukowania.

Popularne modele:
- **eSun eBOX** — przystępna cena, można drukować z pojemnika, obsługuje większość materiałów
- **Bambu Lab Filament Dryer** — zoptymalizowana dla Bambu AMS, obsługuje wysokie temperatury
- **Polymaker PolyDryer** — dobry termometr i dobra regulacja temperatury
- **Sunlu S2 / S4** — budżetowy, kilka szpul jednocześnie

Procedura:
```
1. Umieść szpule w suszarce
2. Ustaw temperaturę z tabeli powyżej
3. Ustaw timer na zalecany czas
4. Poczekaj — nie przerywaj procesu wcześnie
5. Drukuj bezpośrednio z suszarki lub natychmiast zapakuj
```

### Suszarka do żywności

Zwykła suszarka do żywności działa zaskakująco dobrze jako suszarka do filamentu:

- Przystępna cena w zakupie
- Dobra cyrkulacja powietrza
- Obsługuje temperatury do 70–75 °C w wielu modelach

:::warning Sprawdź maksymalną temperaturę swojej suszarki
Wiele tanich suszarek do żywności ma niedokładne termostaty i może wahać się ±10 °C. Zmierz rzeczywistą temperaturę termometrem dla PA i PC, które wymagają wysokiej temperatury.
:::

### Piekarnik

Piekarnik kuchenny może być użyty w nagłych przypadkach, ale wymaga ostrożności:

:::danger NIGDY nie używaj zwykłego piekarnika powyżej 60 °C dla PLA — deformuje się!
PLA zaczyna mięknieć już przy 55–60 °C. Gorący piekarnik może uszkodzić szpule, stopić rdzeń i sprawić, że filament będzie bezużyteczny. Nigdy nie używaj piekarnika dla PLA, chyba że wiesz, że temperatura jest dokładnie skalibrowana i wynosi poniżej 50 °C.
:::

Dla materiałów wytrzymujących wyższe temperatury (ABS, ASA, PA, PC):
```
1. Nagrzej piekarnik do żądanej temperatury
2. Użyj termometru, aby zweryfikować rzeczywistą temperaturę
3. Połóż szpule na kratce (nie bezpośrednio na dnie piekarnika)
4. Pozostaw drzwiczki uchylone, aby wilgoć mogła uchodzić
5. Nadzoruj przy pierwszym użyciu tej metody
```

### Bambu Lab AMS

Bambu Lab AMS Lite i AMS Pro mają wbudowaną funkcję suszenia (niska temperatura + cyrkulacja powietrza). Nie jest to zastępstwo dla pełnego suszenia, ale utrzymuje już wysuszony filament suchym podczas drukowania.

- AMS Lite: Pasywne suszenie — ogranicza wchłanianie wilgoci, nie suszy aktywnie
- AMS Pro: Aktywne podgrzewanie — pewne suszenie możliwe, ale nie tak skuteczne jak dedykowana suszarka

## Przechowywanie filamentu

Prawidłowe przechowywanie po suszeniu jest równie ważne jak sam proces suszenia:

### Najlepsze rozwiązania

1. **Szafka susząca z żelem krzemionkowym** — specjalna szafka z higrometrem i środkiem osuszającym. Utrzymuje wilgotność stabilnie niską (poniżej 20% RH idealnie)
2. **Worki próżniowe** — wyciągnij powietrze i uszczelnij ze środkiem osuszającym w środku. Najtańsze długoterminowe przechowywanie
3. **Worki Ziplock ze środkiem osuszającym** — proste i skuteczne na krótsze okresy

### Żel krzemionkowy i środki osuszające

- **Niebieski/pomarańczowy żel krzemionkowy** wskazuje stopień nasycenia — wymień lub zregeneruj (susz w piekarniku w 120 °C) gdy kolor się zmieni
- **Granulowany żel krzemionkowy** jest skuteczniejszy niż granulat
- **Saszetki osuszające** od producentów filamentów można regenerować i używać ponownie

### Higrometr w pojemniku do przechowywania

Tani cyfrowy higrometr pokazuje aktualną wilgotność powietrza w pojemniku:

| Wilgotność względna (RH) | Status |
|---|---|
| Poniżej 15% | Idealne |
| 15–30% | Dobre dla większości materiałów |
| 30–50% | Akceptowalne dla PLA i PETG |
| Powyżej 50% | Problematyczne — szczególnie dla PA, PVA, PC |

## Praktyczne wskazówki

- **Susz bezpośrednio PRZED drukowaniem** — wysuszony filament może ponownie zwilgnąć w ciągu dni w normalnym klimacie wewnętrznym
- **Drukuj z suszarki** dla PA, PC i PVA — nie tylko susz i odkładaj
- **Nowa szpula ≠ sucha szpula** — producenci uszczelniają ze środkiem osuszającym, ale łańcuch przechowywania mógł zawieść. Zawsze susz nowe szpule materiałów higroskopicznych
- **Oznacz suszone szpule** datą suszenia
- **Specjalna rurka PTFE** od suszarki do drukarki minimalizuje ekspozycję podczas drukowania

## Bambu Dashboard i status suszenia

Bambu Dashboard pozwala rejestrować informacje o filamencie, w tym ostatnią datę suszenia, w profilach filamentów. Użyj tego, aby śledzić które szpule są świeżo wysuszone, a które wymagają kolejnej rundy.
