---
sidebar_position: 5
title: E-handel
description: Zarządzaj zamówieniami, klientami i fakturowaniem dla sprzedaży wydruków 3D — wymaga licencji od geektech.no
---

# E-handel

Moduł e-handlu zapewnia kompletny system do zarządzania klientami, zamówieniami i fakturowaniem — idealny dla tych, którzy sprzedają wydruki 3D profesjonalnie lub półprofesjonalnie.

Przejdź do: **https://localhost:3443/#orders**

:::danger Wymagana licencja e-handlu
Moduł e-handlu wymaga ważnej licencji. Licencje można **kupić wyłącznie przez [geektech.no](https://geektech.no)**. Bez aktywnej licencji moduł jest zablokowany i niedostępny.
:::

## Licencja — zakup i aktywacja

### Kupowanie licencji

1. Przejdź do **[geektech.no](https://geektech.no)** i utwórz konto
2. Wybierz **Bambu Dashboard — licencja e-handlu**
3. Wybierz typ licencji:

| Typ licencji | Opis | Drukarki |
|---|---|---|
| **Hobby** | Jedna drukarka, użytek osobisty i drobna sprzedaż | 1 |
| **Profesjonalny** | Do 5 drukarek, użytek komercyjny | 1–5 |
| **Enterprise** | Nieograniczona liczba drukarek, pełne wsparcie | Nieograniczone |

4. Dokończ płatność
5. Otrzymasz **klucz licencyjny** na e-mail

### Aktywowanie licencji

1. Przejdź do **Ustawienia → E-handel** w dashboardzie
2. Wypełnij następujące pola:

| Pole | Opis | Wymagane |
|------|------|----------|
| **Klucz licencyjny** | 32-znakowy klucz szesnastkowy z geektech.no | ✅ Tak |
| **Adres e-mail** | E-mail użyty podczas zakupu | ✅ Tak |
| **Domena** | Domena, na której działa dashboard (bez https://) | Zalecane |
| **Telefon** | Telefon kontaktowy (z kodem kraju, np. +48) | Opcjonalne |

### Typ licencji — wiązanie identyfikatorów

geektech.no wiąże licencję z jednym lub więcej identyfikatorami:

| Typ | Weryfikuje przeciwko | Przypadek użycia |
|-----|---------------------|-----------------|
| **Domena** | Nazwa domeny (np. `dashboard.firma.pl`) | Stały serwer z własną domeną |
| **IP** | Publiczny adres/adresy IP | Serwer bez domeny, stały IP |
| **MAC** | Adres/adresy MAC karty sieciowej | Wiązanie sprzętowe |
| **IP + MAC** | Zarówno IP, jak i MAC muszą pasować | Najwyższe bezpieczeństwo |

:::info Automatyczna identyfikacja
Dashboard automatycznie wysyła adres IP i adres MAC serwera przy każdej weryfikacji. Nie musisz wypełniać ich ręcznie — geektech.no rejestruje je przy pierwszej aktywacji.
:::

Można zezwolić na wiele adresów IP i MAC (jeden na linię w panelu admin geektech.no). Jest to przydatne w przypadku serwerów z wieloma kartami sieciowymi lub dynamicznym IP.

3. Kliknij **Aktywuj licencję**
4. Dashboard wysyła żądanie aktywacji do geektech.no
5. Po pomyślnej aktywacji wyświetlane są:
   - **Typ licencji** (Hobby / Profesjonalny / Enterprise)
   - **Data wygaśnięcia**
   - **Maksymalna liczba drukarek**
   - **Posiadacz licencji**
   - **ID instancji** (unikalne dla twojej instalacji)

:::warning Klucz licencyjny jest powiązany z domeną i instalacją
Klucz jest aktywowany dla konkretnej instalacji Bambu Dashboard i domeny. Skontaktuj się ze wsparciem [geektech.no](https://geektech.no), jeśli potrzebujesz:
- Przenieść licencję na nowy serwer
- Zmienić domenę
- Zwiększyć liczbę drukarek
:::

### Weryfikacja licencji

Licencja jest uwierzytelniana i synchronizowana z geektech.no:

- **Weryfikacja przy uruchomieniu** — licencja jest sprawdzana automatycznie
- **Bieżąca weryfikacja** — reweryfikacja co 24 godziny w geektech.no
- **Tryb offline** — w przypadku awarii sieci licencja działa do **7 dni** z buforowaną weryfikacją
- **Wygasła licencja** → moduł jest zablokowany, ale istniejące dane (zamówienia, klienci) są zachowane
- **Kod PIN** — geektech.no może zablokować/odblokować licencję przez system PIN
- **Odnowienie** — przez **[geektech.no](https://geektech.no)** → Moje licencje → Odnów

### Typy licencji i ograniczenia

| Plan | Drukarki | Platformy | Opłata | Cena |
|------|----------|-----------|--------|------|
| **Hobby** | 1 | 1 (Shopify LUB WooCommerce) | 5% | Patrz geektech.no |
| **Profesjonalny** | 1–5 | Wszystkie | 5% | Patrz geektech.no |
| **Enterprise** | Nieograniczone | Wszystkie + API | 3% | Patrz geektech.no |

### Sprawdzanie statusu licencji

Przejdź do **Ustawienia → E-handel** lub wywołaj API:

```bash
curl -sk https://localhost:3443/api/ecommerce/license
```

Odpowiedź zawiera:
```json
{
  "active": true,
  "status": "active",
  "plan": "professional",
  "holder": "Nazwa Firmy Sp. z o.o.",
  "email": "firma@przyklad.pl",
  "domain": "dashboard.nazwafirmy.pl",
  "max_printers": 5,
  "expires_at": "2027-03-22",
  "provider": "geektech.no",
  "fees_pending": 2,
  "fees_this_month": 450.00,
  "orders_this_month": 12
}
```

## Klienci

### Tworzenie klienta

1. Przejdź do **E-handel → Klienci**
2. Kliknij **Nowy klient**
3. Wypełnij:
   - **Imię / Nazwa firmy**
   - **Osoba kontaktowa** (dla firm)
   - **Adres e-mail**
   - **Telefon**
   - **Adres** (adres rozliczeniowy)
   - **NIP / PESEL** (opcjonalne, dla zarejestrowanych płatników VAT)
   - **Notatka** — wewnętrzna uwaga
4. Kliknij **Utwórz**

### Przegląd klientów

Lista klientów pokazuje:
- Imię i dane kontaktowe
- Łączną liczbę zamówień
- Łączne obroty
- Datę ostatniego zamówienia
- Status (Aktywny / Nieaktywny)

Kliknij klienta, aby zobaczyć całą historię zamówień i fakturowania.

## Zarządzanie zamówieniami

### Tworzenie zamówienia

1. Przejdź do **E-handel → Zamówienia**
2. Kliknij **Nowe zamówienie**
3. Wybierz **Klienta** z listy
4. Dodaj pozycje zamówienia:
   - Wybierz plik/model z biblioteki lub dodaj pozycję jako dowolny tekst
   - Podaj ilość i cenę jednostkową
   - System automatycznie oblicza koszt jeśli powiązany z projektem
5. Podaj **Datę dostawy** (szacowaną)
6. Kliknij **Utwórz zamówienie**

### Status zamówienia

| Status | Opis |
|---|---|
| Zapytanie | Otrzymane zapytanie, niepotwierdzone |
| Potwierdzone | Klient potwierdził |
| W produkcji | Trwa drukowanie |
| Gotowe do dostawy | Gotowe, czeka na odbiór/wysyłkę |
| Dostarczone | Zamówienie zrealizowane |
| Anulowane | Anulowane przez klienta lub ciebie |

Aktualizuj status klikając zamówienie → **Zmień status**.

### Łączenie wydruków z zamówieniem

1. Otwórz zamówienie
2. Kliknij **Połącz wydruk**
3. Wybierz wydruki z historii (obsługiwany wielokrotny wybór)
4. Dane kosztów są automatycznie pobierane z historii wydruków

## Fakturowanie

Zobacz [Projekty → Fakturowanie](../funksjoner/projects#fakturering) dla szczegółowej dokumentacji fakturowania.

Fakturę można wygenerować bezpośrednio z zamówienia:

1. Otwórz zamówienie
2. Kliknij **Generuj fakturę**
3. Sprawdź kwotę i VAT
4. Pobierz PDF lub wyślij na e-mail klienta

### Seria numerów faktur

Skonfiguruj serię numerów faktur w **Ustawienia → E-handel**:
- **Prefiks**: np. `2026-`
- **Numer startowy**: np. `1001`
- Numery faktur są przypisywane automatycznie w kolejności rosnącej

## Raportowanie i opłaty

### Raportowanie opłat

System śledzi wszystkie opłaty transakcyjne:
- Zobacz opłaty w **E-handel → Opłaty**
- Oznaczaj opłaty jako zgłoszone dla celów księgowych
- Eksportuj podsumowanie opłat za okres

### Statystyki

W **E-handel → Statystyki**:
- Miesięczne obroty (wykres słupkowy)
- Najlepsi klienci według obrotów
- Najczęściej sprzedawane modele/materiały
- Średnia wielkość zamówienia

Eksportuj do CSV dla systemu księgowego.

## Wsparcie i kontakt

:::info Potrzebujesz pomocy?
- **Pytania o licencje**: skontaktuj się ze wsparciem [geektech.no](https://geektech.no)
- **Problemy techniczne**: [GitHub Issues](https://github.com/skynett81/bambu-dashboard/issues)
- **Prośby o funkcje**: [GitHub Discussions](https://github.com/skynett81/bambu-dashboard/discussions)
:::
