---
sidebar_position: 9
title: Porównanie materiałów
description: Porównaj wszystkie materiały do druku 3D obok siebie — wytrzymałość, temperatura, cena, poziom trudności
---

# Porównanie materiałów

Wybór odpowiedniego filamentu jest tak samo ważny jak wybór odpowiedniego narzędzia do pracy. Ten artykuł daje ci pełny obraz — od prostej tabeli porównawczej po twardość Shore'a, wartości HDT i praktyczny przewodnik decyzyjny.

## Duża tabela porównawcza

| Materiał | Wytrzymałość | Odp. na temp | Elastyczność | Odp. na UV | Odp. chemiczna | Wymagania dysza | Obudowa | Trudność | Cena |
|---|---|---|---|---|---|---|---|---|---|
| PLA | ★★★ | ★ | ★ | ★ | ★ | Mosiądz | Nie | ★ Łatwy | Niska |
| PETG | ★★★ | ★★ | ★★ | ★★ | ★★★ | Mosiądz | Nie | ★★ | Niska |
| ABS | ★★★ | ★★★ | ★★ | ★ | ★★ | Mosiądz | TAK | ★★★ | Niska |
| ASA | ★★★ | ★★★ | ★★ | ★★★★ | ★★ | Mosiądz | TAK | ★★★ | Średnia |
| TPU | ★★ | ★★ | ★★★★★ | ★★ | ★★ | Mosiądz | Nie | ★★★ | Średnia |
| PA (Nylon) | ★★★★ | ★★★ | ★★★ | ★★ | ★★★★ | Mosiądz | TAK | ★★★★ | Wysoka |
| PA-CF | ★★★★★ | ★★★★ | ★★ | ★★★ | ★★★★ | Hartowana stal | TAK | ★★★★ | Wysoka |
| PC | ★★★★ | ★★★★ | ★★ | ★★ | ★★★ | Mosiądz | TAK | ★★★★ | Wysoka |
| PLA-CF | ★★★★ | ★★ | ★ | ★ | ★ | Hartowana stal | Nie | ★★ | Średnia |

**Objaśnienie:**
- ★ = słabe/niskie/złe
- ★★★ = średnie/standardowe
- ★★★★★ = doskonałe/najlepsze w klasie

---

## Wybierz odpowiedni materiał — przewodnik decyzyjny

Nie pewien, co wybrać? Podążaj za tymi pytaniami:

### Czy musi wytrzymywać ciepło?
**Tak** → ABS, ASA, PC lub PA

- Trochę ciepła (do ~90 °C): **ABS** lub **ASA**
- Dużo ciepła (powyżej 100 °C): **PC** lub **PA**
- Maksymalna odporność na temperaturę: **PC** (do ~120 °C) lub **PA-CF** (do ~160 °C)

### Czy musi być elastyczny?
**Tak** → **TPU**

- Bardzo miękki (jak guma): TPU 85A
- Standardowo elastyczny: TPU 95A
- Semi-elastyczny: PETG lub PA

### Czy będzie używany na zewnątrz?
**Tak** → **ASA** to wyraźny wybór

ASA jest opracowane specjalnie do ekspozycji na UV i przewyższa ABS na zewnątrz. PETG jest drugim najlepszym wyborem, jeśli ASA nie jest dostępne.

### Czy potrzebna jest maksymalna wytrzymałość?
**Tak** → **PA-CF** lub **PC**

- Najsilniejszy lekki kompozyt: **PA-CF**
- Najsilniejszy czysty termoplast: **PC**
- Dobra wytrzymałość za niższą cenę: **PA (Nylon)**

### Drukowanie tak proste jak to możliwe?
→ **PLA**

PLA jest najbardziej przebaczającym materiałem jaki istnieje. Najniższa temperatura, brak wymagań obudowy, małe ryzyko wypaczania.

### Kontakt z żywnością?
→ **PLA** (z zastrzeżeniami)

PLA samo w sobie nie jest toksyczne, ale:
- Użyj dyszy ze stali nierdzewnej (nie mosiężnej — może zawierać ołów)
- Wydruki FDM nigdy nie są "bezpieczne dla żywności" ze względu na porowatą powierzchnię — bakterie mogą rosnąć
- Unikaj wymagających środowisk (kwasy, gorąca woda, zmywarka)
- PETG jest lepszą alternatywą do jednorazowego kontaktu

---

## Twardość Shore wyjaśniona

Twardość Shore służy do opisywania twardości i sztywności elastomerów i materiałów plastycznych. W przypadku druku 3D jest szczególnie istotna dla TPU i innych elastycznych filamentów.

### Shore A — materiały elastyczne

Skala Shore A sięga od 0 (ekstremalnie miękki, prawie jak żel) do 100 (ekstremalnie twardy guma). Wartości powyżej 90A zaczynają zbliżać się do sztywnych materiałów plastycznych.

| Wartość Shore A | Odczuwana twardość | Przykład |
|---|---|---|
| 30A | Ekstremalnie miękki | Silikon, galaretka |
| 50A | Bardzo miękki | Miękka guma, zatyczki do uszu |
| 70A | Miękki | Opona samochodowa, wkładka buta do biegania |
| 85A | Średnio miękki | Opona rowerowa, miękki filament TPU |
| 95A | Półsztywny | Standardowy filament TPU |
| 100A ≈ 55D | Granica między skalami | — |

**TPU 95A** jest standardem przemysłowym dla druku 3D i zapewnia dobrą równowagę między elastycznością a drukowalnością. **TPU 85A** jest bardzo miękki i wymaga więcej cierpliwości podczas drukowania.

### Shore D — materiały sztywne

Shore D jest używana dla twardszych termoplastów:

| Materiał | Przybliżony Shore D |
|---|---|
| PLA | ~80D |
| PETG | ~70D |
| ABS | ~75D |
| PC | ~80D |
| PA (Nylon) | ~70–75D |

:::tip Nie to samo
Shore A 95 i Shore D 40 to nie to samo, nawet jeśli liczby mogą wydawać się bliskie. Skale są różne i tylko częściowo nakładają się na siebie w okolicach granicy 100A/55D. Zawsze sprawdzaj którą skalę podaje dostawca.
:::

---

## Tolerancje temperaturowe — HDT i VST

Wiedza o tym, w jakiej temperaturze materiał zaczyna ulegać deformacji jest kluczowa dla części funkcjonalnych. Stosuje się dwa standardowe pomiary:

- **HDT (Heat Deflection Temperature)** — temperatura, przy której materiał ugina się o 0,25 mm pod znormalizowanym obciążeniem. Miara temperatury użytkowej pod obciążeniem.
- **VST (Vicat Softening Temperature)** — temperatura, przy której znormalizowana igła zagłębia się 1 mm w materiał. Miara bezwzględnego punktu mięknienia bez obciążenia.

| Materiał | HDT (°C) | VST (°C) | Praktyczna maks. temperatura |
|---|---|---|---|
| PLA | 52–60 | 55–65 | ~50 °C |
| PETG | 70–80 | 75–85 | ~70 °C |
| ABS | 85–105 | 95–110 | ~90 °C |
| ASA | 90–105 | 95–108 | ~90 °C |
| TPU | 40–70 | różne | ~60 °C |
| PA (Nylon) | 70–180 | 180–220 | ~80–160 °C |
| PA-CF | 100–200 | 200–230 | ~100–180 °C |
| PC | 120–140 | 145–160 | ~120 °C |
| PLA-CF | 55–65 | 60–70 | ~55 °C |

:::warning PLA w gorących środowiskach
Części PLA w samochodzie latem to przepis na katastrofę. Deska rozdzielcza w zaparkowanym samochodzie może osiągnąć 80–90 °C. Używaj ABS, ASA lub PETG do wszystkiego, co może stać w słońcu lub cieple.
:::

:::info Warianty PA mają bardzo różne właściwości
PA to rodzina materiałów, nie jeden materiał. PA6 ma niższy HDT (~70 °C), podczas gdy PA12 i PA6-CF mogą wynosić 160–200 °C. Zawsze sprawdzaj kartę danych dla konkretnego używanego filamentu.
:::

---

## Wymagania dotyczące dyszy

### Dysze mosiężna (standardowa)

Działa ze wszystkimi materiałami **bez** wypełniacza z włókna węglowego lub szklanego:
- PLA, PETG, ABS, ASA, TPU, PA, PC, PVA
- Mosiądz jest miękki i szybko się ściera przy materiałach ściernych

### Dysza z hartowanej stali (wymagana dla kompozytów)

**WYMAGANA** dla:
- PLA-CF (PLA z włóknem węglowym)
- PETG-CF
- PA-CF
- ABS-GF (ABS z włóknem szklanym)
- PPA-CF, PPA-GF
- Wszystkie filamenty z "-CF", "-GF", "-HF" lub "włókno węglowe" w nazwie

Hartowana stal ma niższe przewodnictwo cieplne niż mosiądz — skompensuj +5–10 °C na temperaturze dyszy.

:::danger Filamenty z włóknem węglowym szybko niszczą dysze mosiężne
Dysza mosiężna może zauważalnie się zużyć po zaledwie kilkuset gramach filamentu CF. Rezultatem jest stopniowy niedobór ekstruzji i niedokładne wymiary. Zainwestuj w hartowaną stal jeśli drukujesz kompozyty.
:::

---

## Krótki przegląd materiałów według zastosowania

| Zastosowanie | Zalecany materiał | Alternatywa |
|---|---|---|
| Dekoracja, figurki | PLA, PLA Silk | PETG |
| Funkcjonalne części wewnętrzne | PETG | PLA+ |
| Ekspozycja zewnętrzna | ASA | PETG |
| Elastyczne części, etui | TPU 95A | TPU 85A |
| Komora silnikowa, gorące środowiska | PA-CF, PC | ABS |
| Lekka, sztywna konstrukcja | PLA-CF | PA-CF |
| Materiał podporowy (rozpuszczalny) | PVA | HIPS |
| Kontakt z żywnością (ograniczony) | PLA (dysza ze stali nierdzewnej) | — |
| Maksymalna wytrzymałość | PA-CF | PC |
| Przezroczysty | PETG przezroczysty | PC przezroczysty |

Zobacz indywidualne artykuły o materiałach, aby uzyskać szczegółowe informacje o ustawieniach temperatury, rozwiązywaniu problemów i zalecanych profilach dla drukarek Bambu Lab.
