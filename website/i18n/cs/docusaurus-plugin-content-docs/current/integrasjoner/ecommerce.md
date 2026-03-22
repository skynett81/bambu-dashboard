---
sidebar_position: 5
title: E-commerce
description: Správa objednávek, zákazníků a fakturace pro prodej 3D tisků — vyžaduje licenci od geektech.no
---

# E-commerce

Modul e-commerce vám poskytuje kompletní systém pro správu zákazníků, objednávek a fakturace — ideální pro ty, kteří prodávají 3D tisky profesionálně nebo poloprofesionálně.

Přejděte na: **https://localhost:3443/#orders**

:::danger Vyžadována licence e-commerce
Modul e-commerce vyžaduje platnou licenci. Licence lze **zakoupit pouze na [geektech.no](https://geektech.no)**. Bez aktivní licence je modul uzamčen a nedostupný.
:::

## Licence — nákup a aktivace

### Zakoupení licence

1. Přejděte na **[geektech.no](https://geektech.no)** a vytvořte účet
2. Vyberte **Bambu Dashboard — Licence e-commerce**
3. Vyberte typ licence:

| Typ licence | Popis | Tiskárny |
|---|---|---|
| **Hobby** | Jedna tiskárna, osobní použití a malý prodej | 1 |
| **Profesionální** | Až 5 tiskáren, komerční použití | 1–5 |
| **Enterprise** | Neomezený počet tiskáren, plná podpora | Neomezeno |

4. Dokončete platbu
5. Obdržíte **licenční klíč** e-mailem

### Aktivace licence

1. Přejděte na **Nastavení → E-commerce** v dashboardu
2. Vyplňte následující pole:

| Pole | Popis | Povinné |
|------|-------|---------|
| **Licenční klíč** | 32znakový hexadecimální klíč z geektech.no | ✅ Ano |
| **E-mailová adresa** | E-mail použitý při nákupu | ✅ Ano |
| **Doména** | Doména, na které dashboard běží (bez https://) | Doporučeno |
| **Telefon** | Kontaktní telefon (s předvolbou, např. +420) | Volitelné |

### Typ licence — vazba identifikátoru

geektech.no váže licenci na jeden nebo více identifikátorů:

| Typ | Ověřuje proti | Případ použití |
|-----|---------------|----------------|
| **Doména** | Název domény (např. `dashboard.firma.cz`) | Pevný server s vlastní doménou |
| **IP** | Veřejná IP adresa/adresy | Server bez domény, pevná IP |
| **MAC** | MAC adresa/adresy síťové karty | Hardwarová vazba |
| **IP + MAC** | Musí souhlasit jak IP, tak MAC | Nejvyšší bezpečnost |

:::info Automatická identifikace
Dashboard automaticky odesílá IP adresu a MAC adresu serveru při každém ověření. Není třeba je zadávat ručně — geektech.no je registruje při první aktivaci.
:::

Lze povolit více IP adres a MAC adres (jeden na řádek v administraci geektech.no). Je to užitečné pro servery s více síťovými kartami nebo dynamickou IP.

3. Klikněte na **Aktivovat licenci**
4. Dashboard odešle žádost o aktivaci na geektech.no
5. Po úspěšné aktivaci se zobrazí:
   - **Typ licence** (Hobby / Profesionální / Enterprise)
   - **Datum vypršení**
   - **Maximální počet tiskáren**
   - **Držitel licence**
   - **ID instance** (jedinečné pro vaši instalaci)

:::warning Licenční klíč je vázán na vaši doménu a instalaci
Klíč se aktivuje pro konkrétní instalaci Bambu Dashboard a doménu. Kontaktujte podporu [geektech.no](https://geektech.no), pokud potřebujete:
- Přesunout licenci na nový server
- Změnit doménu
- Zvýšit počet tiskáren
:::

### Ověření licence

Licence se ověřuje a synchronizuje s geektech.no:

- **Ověření při spuštění** — licence se kontroluje automaticky
- **Průběžné ověřování** — každých 24 hodin revalidace vůči geektech.no
- **Offline režim** — při výpadku sítě licence funguje až **7 dní** s uloženou validací
- **Vypršená licence** → modul se uzamkne, ale existující data (objednávky, zákazníci) se zachovají
- **PIN kód** — geektech.no může uzamknout/odemknout licenci prostřednictvím systému PIN
- **Obnovení** — přes **[geektech.no](https://geektech.no)** → Moje licence → Obnovit

### Typy licencí a omezení

| Plán | Tiskárny | Platformy | Poplatek | Cena |
|------|----------|-----------|----------|------|
| **Hobby** | 1 | 1 (Shopify NEBO WooCommerce) | 5% | Viz geektech.no |
| **Profesionální** | 1–5 | Všechny | 5% | Viz geektech.no |
| **Enterprise** | Neomezeno | Všechny + API | 3% | Viz geektech.no |

### Kontrola stavu licence

Přejděte na **Nastavení → E-commerce** nebo zavolejte API:

```bash
curl -sk https://localhost:3443/api/ecommerce/license
```

Odpověď obsahuje:
```json
{
  "active": true,
  "status": "active",
  "plan": "professional",
  "holder": "Název firmy s.r.o.",
  "email": "firma@priklad.cz",
  "domain": "dashboard.nazevfirmy.cz",
  "max_printers": 5,
  "expires_at": "2027-03-22",
  "provider": "geektech.no",
  "fees_pending": 2,
  "fees_this_month": 450.00,
  "orders_this_month": 12
}
```

## Zákazníci

### Vytvoření zákazníka

1. Přejděte na **E-commerce → Zákazníci**
2. Klikněte na **Nový zákazník**
3. Vyplňte:
   - **Jméno / Název firmy**
   - **Kontaktní osoba** (pro firmy)
   - **E-mailová adresa**
   - **Telefon**
   - **Adresa** (fakturační adresa)
   - **IČO / Rodné číslo** (volitelné, pro plátce DPH)
   - **Poznámka** — interní poznámka
4. Klikněte na **Vytvořit**

### Přehled zákazníků

Seznam zákazníků zobrazuje:
- Jméno a kontaktní informace
- Celkový počet objednávek
- Celkový obrat
- Datum poslední objednávky
- Stav (Aktivní / Neaktivní)

Kliknutím na zákazníka zobrazíte celou historii objednávek a fakturace.

## Správa objednávek

### Vytvoření objednávky

1. Přejděte na **E-commerce → Objednávky**
2. Klikněte na **Nová objednávka**
3. Vyberte **Zákazníka** ze seznamu
4. Přidejte řádky objednávky:
   - Vyberte soubor/model z knihovny nebo přidejte volnotextovou položku
   - Zadejte množství a jednotkovou cenu
   - Systém vypočítá náklady automaticky pokud je propojen s projektem
5. Zadejte **Datum doručení** (odhadované)
6. Klikněte na **Vytvořit objednávku**

### Stav objednávky

| Stav | Popis |
|---|---|
| Poptávka | Přijata poptávka, nepotvrzena |
| Potvrzena | Zákazník potvrdil |
| Ve výrobě | Tisky probíhají |
| Připravena k doručení | Hotovo, čeká na vyzvednutí/odeslání |
| Doručena | Objednávka dokončena |
| Zrušena | Zákazníkem nebo vámi stornováno |

Aktualizujte stav kliknutím na objednávku → **Změnit stav**.

### Propojení tisků s objednávkou

1. Otevřete objednávku
2. Klikněte na **Propojit tisk**
3. Vyberte tisky z historie (podporován vícenásobný výběr)
4. Nákladová data se automaticky načtou z historie tisků

## Fakturace

Viz [Projekty → Fakturace](../funksjoner/projects#fakturering) pro podrobnou dokumentaci fakturace.

Faktura lze generovat přímo z objednávky:

1. Otevřete objednávku
2. Klikněte na **Generovat fakturu**
3. Zkontrolujte částky a DPH
4. Stáhněte PDF nebo odešlete na e-mail zákazníka

### Číselná řada faktur

Nastavte číselnou řadu faktur v části **Nastavení → E-commerce**:
- **Předpona**: např. `2026-`
- **Počáteční číslo**: např. `1001`
- Čísla faktur se přiřazují automaticky ve vzestupném pořadí

## Přehledy a poplatky

### Výkazy poplatků

Systém sleduje všechny transakční poplatky:
- Viz poplatky v části **E-commerce → Poplatky**
- Označte poplatky jako vykázané pro účetní účely
- Exportujte souhrn poplatků za období

### Statistiky

V části **E-commerce → Statistiky**:
- Měsíční obrat (sloupcový diagram)
- Nejlepší zákazníci podle obratu
- Nejprodávanější modely/materiály
- Průměrná velikost objednávky

Exportujte do CSV pro účetní systém.

## Podpora a kontakt

:::info Potřebujete pomoc?
- **Otázky k licencím**: kontaktujte podporu [geektech.no](https://geektech.no)
- **Technické problémy**: [GitHub Issues](https://github.com/skynett81/bambu-dashboard/issues)
- **Požadavky na funkce**: [GitHub Discussions](https://github.com/skynett81/bambu-dashboard/discussions)
:::
