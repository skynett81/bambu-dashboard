---
sidebar_position: 4
title: Wady powierzchni
description: Diagnoza i naprawa typowych problemów z powierzchnią — blobs, zits, linie warstw, elephant foot i więcej
---

# Wady powierzchni

Powierzchnia wydruku 3D wiele mówi o tym, co dzieje się wewnątrz systemu. Większość wad powierzchni ma jedną lub dwie wyraźne przyczyny — przy właściwej diagnozie są zaskakująco łatwe do naprawienia.

## Szybki przegląd diagnostyczny

| Objaw | Najczęstsza przyczyna | Pierwsza czynność |
|---|---|---|
| Blobs i zits | Nadekstruzja, umiejscowienie szwu | Dostosuj szew, skalibruj przepływ |
| Widoczne linie warstw | Z-wobble, zbyt grube warstwy | Przełącz na cieńsze warstwy, sprawdź oś Z |
| Elephant foot | Pierwsza warstwa zbyt szeroka | Kompensacja elephant foot |
| Ringing/ghosting | Drgania przy dużej prędkości | Zmniejsz prędkość, włącz input shaper |
| Niedobór ekstruzji | Zatkana dysza, zbyt niska temp | Wyczyść dyszę, zwiększ temp |
| Nadmierna ekstruzja | Zbyt duży przepływ | Skalibruj przepływ |
| Pillowing | Za mało warstw górnych, za mało chłodzenia | Zwiększ liczbę warstw górnych, zwiększ wentylator |
| Rozwarstwianie | Zbyt niska temp, za dużo chłodzenia | Zwiększ temp, zmniejsz wentylator |

---

## Blobs i zits

Blobs to nieregularne grudki na powierzchni. Zity to punkty podobne do nakłuć — często wzdłuż linii szwu.

### Przyczyny

- **Nadmierna ekstruzja** — za dużo plastiku jest wytłaczane i wypychane na boki
- **Złe umiejscowienie szwu** — standardowy szew "nearest" koncentruje wszystkie przejścia w tym samym miejscu
- **Problem z retrakcją** — niewystarczająca retrakcja powoduje gromadzenie ciśnienia w dyszy
- **Wilgotny filament** — wilgoć tworzy mikrobebelki i krople

### Rozwiązania

**Ustawienia szwu w Bambu Studio:**
```
Bambu Studio → Jakość → Pozycja szwu
- Aligned: Wszystkie szwy w tym samym miejscu (widoczne, ale schludne)
- Nearest: Najbliższy punkt (losowo rozprasza blobs)
- Back: Za obiektem (zalecane dla jakości wizualnej)
- Random: Losowe rozmieszczenie (najlepiej maskuje szew)
```

**Kalibracja przepływu:**
```
Bambu Studio → Kalibracja → Przepływ
Dostosowuj krokami ±2% aż blobs znikną
```

:::tip Szew na "Back" dla jakości wizualnej
Umieść szew z tyłu obiektu, aby był jak najmniej widoczny. Połącz z "Wipe on retract" dla czystszego zakończenia szwu.
:::

---

## Widoczne linie warstw

Wszystkie wydruki FDM mają linie warstw, ale powinny być spójne i ledwo widoczne przy normalnych wydrukach. Nieprawidłowa widoczność wskazuje na konkretne problemy.

### Przyczyny

- **Z-wobble** — oś Z wibruje lub nie jest prosta, daje falisty wzór na całej wysokości
- **Zbyt grube warstwy** — wysokość warstwy powyżej 0,28 mm jest zauważalna nawet przy idealnych wydrukach
- **Wahania temperatury** — niespójna temperatura topnienia daje zmienne szerokości warstw
- **Niespójna średnica filamentu** — tani filament ze zmienną średnicą

### Rozwiązania

**Z-wobble:**
- Sprawdź czy wrzeciono (Z-leadscrew) jest czyste i nasmarowane
- Sprawdź czy wrzeciono nie jest zgięte (inspekcja wzrokowa przy obróceniu)
- Zobacz artykuł konserwacyjny dotyczący [smarowania osi Z](/docs/kb/vedlikehold/smoring)

**Wysokość warstwy:**
- Przełącz na 0,12 mm lub 0,16 mm dla bardziej równomiernej powierzchni
- Pamiętaj, że zmniejszenie wysokości warstwy o połowę podwaja czas drukowania

**Wahania temperatury:**
- Użyj kalibracji PID (dostępna w menu konserwacji Bambu Studio)
- Unikaj przeciągów, które chłodzą dyszę podczas drukowania

---

## Elephant foot

Elephant foot to sytuacja, gdy pierwsza warstwa jest szersza niż reszta obiektu — jakby obiekt "rozchyla się" u podstawy.

### Przyczyny

- Pierwsza warstwa jest zbyt mocno dociskana do płyty (Z-offset zbyt niski)
- Zbyt wysoka temperatura stołu utrzymuje plastik zbyt długo miękkim i płynnym
- Zbyt małe chłodzenie pierwszej warstwy daje plastikowi więcej czasu na rozprzestrzenianie się

### Rozwiązania

**Kompensacja elephant foot w Bambu Studio:**
```
Bambu Studio → Jakość → Kompensacja Elephant foot
Zacznij od 0,1–0,2 mm i dostosuj aż stopa zniknie
```

**Z-offset:**
- Skalibruj ponownie wysokość pierwszej warstwy
- Podnoś Z-offset o 0,05 mm na raz aż stopa zniknie

**Temperatura stołu:**
- Obniż temperaturę stołu o 5–10 °C
- Dla PLA: 55 °C często wystarcza — 65 °C może powodować elephant foot

:::warning Nie kompensuj zbyt wiele
Zbyt duża kompensacja elephant foot może spowodować dziurę między pierwszą warstwą a resztą. Dostosowuj ostrożnie krokami 0,05 mm.
:::

---

## Ringing i ghosting

Ringing (zwany też "ghosting" lub "echoing") to falisty wzór na powierzchni tuż za ostrymi krawędziami lub narożnikami. Wzór "odbija się echem" od krawędzi.

### Przyczyny

- **Drgania** — szybkie przyspieszanie i zwalnianie przy narożnikach wysyła drgania przez ramę
- **Zbyt duża prędkość** — szczególnie prędkość zewnętrznej ściany powyżej 100 mm/s daje wyraźny ringing
- **Luźne części** — luźna szpula, drgający prowadnik kabli lub luźno zamontowana drukarka

### Rozwiązania

**Bambu Lab input shaper (Kompensacja rezonansu):**
```
Bambu Studio → Drukarka → Kompensacja rezonansu
Bambu Lab X1C i P1S mają wbudowany akcelerometr i kalibrują to automatycznie
```

**Zmniejsz prędkość:**
```
Zewnętrzna ściana: Zmniejsz do 60–80 mm/s
Przyspieszenie: Zmniejsz ze standardowego do 3000–5000 mm/s²
```

**Kontrola mechaniczna:**
- Sprawdź czy drukarka stoi na stabilnym podłożu
- Sprawdź czy szpula nie wibruje w uchwycie na szpulę
- Dokręć wszystkie dostępne śruby na zewnętrznych panelach ramy

:::tip X1C i P1S automatycznie kalibrują ringing
Bambu Lab X1C i P1S mają wbudowaną kalibrację akcelerometru, która uruchamia się automatycznie przy starcie. Uruchom "Pełną kalibrację" z menu konserwacji, jeśli ringing pojawi się po pewnym czasie.
:::

---

## Niedobór ekstruzji

Niedobór ekstruzji to sytuacja, gdy drukarka wytłacza zbyt mało plastiku. Rezultatem są cienkie, słabe ściany, widoczne dziury między warstwami i "strzępiasta" powierzchnia.

### Przyczyny

- **Częściowo zatkana dysza** — nagromadzenie węgla zmniejsza przepływ
- **Zbyt niska temperatura dyszy** — plastik nie jest wystarczająco płynny
- **Zużyte koło zębate** w mechanizmie ekstrudera nie chwyta filamentu wystarczająco dobrze
- **Zbyt duża prędkość** — ekstruder nie może nadążyć za żądanym przepływem

### Rozwiązania

**Zimne wyciąganie (Cold pull):**
```
1. Rozgrzej dyszę do 220 °C
2. Ręcznie wtłocz filament
3. Schłódź dyszę do 90 °C (PLA) przy zachowaniu nacisku
4. Szybko wyciągnij filament
5. Powtarzaj aż wyciągane materiały będą czyste
```

**Regulacja temperatury:**
- Zwiększ temperaturę dyszy o 5–10 °C i przetestuj ponownie
- Zbyt niska temperatura jest częstą przyczyną niedoboru ekstruzji

**Kalibracja przepływu:**
```
Bambu Studio → Kalibracja → Przepływ
Stopniowo zwiększaj aż niedobór ekstruzji zniknie
```

**Sprawdź koło zębate ekstrudera:**
- Usuń filament i sprawdź koło zębate
- Wyczyść małą szczotką jeśli w zębach jest pył filamentowy

---

## Nadmierna ekstruzja

Nadmierna ekstruzja daje zbyt szeroki wątek — powierzchnia wygląda luźno, błyszcząco lub nierównomiernie, z tendencją do blobów.

### Przyczyny

- **Zbyt duży przepływ** (EM — Extrusion Multiplier)
- **Zły rozmiar filamentu** — filament 2,85 mm z profilem 1,75 mm daje masową nadmierną ekstruzję
- **Zbyt wysoka temperatura dyszy** sprawia, że plastik jest zbyt płynny

### Rozwiązania

**Kalibracja przepływu:**
```
Bambu Studio → Kalibracja → Przepływ
Zmniejszaj krokami 2% aż powierzchnia będzie równomierna i matowa
```

**Weryfikacja średnicy filamentu:**
- Zmierz rzeczywistą średnicę filamentu suwmiarką w 5–10 miejscach wzdłuż filamentu
- Średnie odchylenie powyżej 0,05 mm wskazuje na tani filament

---

## Pillowing

Pillowing to wybrzuszone, nierównomierne górne warstwy z "poduszkami" plastiku między warstwami. Szczególnie wyraźne przy małym wypełnieniu i zbyt małej liczbie warstw górnych.

### Przyczyny

- **Za mało warstw górnych** — plastik nad wypełnieniem zapada się w dziury
- **Za mało chłodzenia** — plastik nie stygnie wystarczająco szybko, aby przerzucić mostek nad dziurami wypełnienia
- **Za małe wypełnienie** — duże dziury w wypełnieniu są trudne do przykrycia

### Rozwiązania

**Zwiększ liczbę warstw górnych:**
```
Bambu Studio → Jakość → Górne warstwy powłoki
Minimum: 4 warstwy
Zalecane dla równomiernej powierzchni: 5–6 warstw
```

**Zwiększ chłodzenie:**
- PLA powinno mieć wentylator na 100% od warstwy 3
- Niewystarczające chłodzenie jest najczęstszą przyczyną pillowingu

**Zwiększ wypełnienie:**
- Przejdź z 10–15% do 20–25% jeśli pillowing utrzymuje się
- Wzór Gyroid daje bardziej równomierną powierzchnię mostka niż linie

:::tip Prasowanie (Ironing)
Funkcja "ironing" w Bambu Studio przeprowadza dyszę nad górną warstwą jeszcze raz, aby wyrównać powierzchnię. Włącz w Jakość → Ironing dla najlepszego wykończenia górnej warstwy.
:::

---

## Rozwarstwianie (Layer separation / delamination)

Rozwarstwianie to sytuacja, gdy warstwy nie przylegają do siebie odpowiednio. W najgorszym przypadku wydruk pęka wzdłuż linii warstw.

### Przyczyny

- **Zbyt niska temperatura dyszy** — plastik nie topi się wystarczająco dobrze w poprzedniej warstwie
- **Za dużo chłodzenia** — plastik stygnie zbyt szybko zanim zdąży się połączyć
- **Zbyt duża grubość warstwy** — powyżej 80% średnicy dyszy daje złą fuzję
- **Zbyt duża prędkość** — skrócony czas topnienia na mm ścieżki

### Rozwiązania

**Zwiększ temperaturę:**
- Spróbuj +10 °C powyżej standardu i obserwuj
- ABS i ASA są szczególnie wrażliwe — wymagają kontrolowanego ogrzewania komory

**Zmniejsz chłodzenie:**
- ABS: wentylator WYŁĄCZONY (0%)
- PETG: max. 20–40%
- PLA: może wytrzymać pełne chłodzenie, ale zmniejsz jeśli pojawia się rozwarstwianie

**Grubość warstwy:**
- Używaj maks. 75% średnicy dyszy
- Przy dyszy 0,4 mm: maks. zalecana wysokość warstwy to 0,30 mm

**Sprawdź czy obudowa jest wystarczająco ciepła (ABS/ASA/PA/PC):**
```
Bambu Lab X1C/P1S: Pozwól komorze nagrzać się do 40–60 °C
przed rozpoczęciem druku — nie otwieraj drzwi podczas drukowania
```

---

## Ogólne wskazówki dotyczące rozwiązywania problemów

1. **Zmieniaj jedną rzecz na raz** — testuj małym wydrukiem kalibracyjnym pomiędzy każdą zmianą
2. **Najpierw wysusz filament** — wiele wad powierzchni to w rzeczywistości objawy wilgoci
3. **Wyczyść dyszę** — częściowe zatkanie daje niespójne wady powierzchni, które są trudne do zdiagnozowania
4. **Przeprowadź pełną kalibrację** z menu konserwacji Bambu Studio po większych zmianach
5. **Użyj Bambu Dashboard** do śledzenia, jakie ustawienia dawały najlepsze wyniki w czasie
