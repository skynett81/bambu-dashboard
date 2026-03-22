---
sidebar_position: 5
title: E-commerce
description: Beheer bestellingen, klanten en facturering voor de verkoop van 3D-prints — vereist een licentie van geektech.no
---

# E-commerce

De e-commercemodule biedt u een compleet systeem voor het beheren van klanten, bestellingen en facturering — perfect voor mensen die professioneel of semi-professioneel 3D-prints verkopen.

Ga naar: **https://localhost:3443/#orders**

:::danger E-commercelicentie vereist
De e-commercemodule vereist een geldige licentie. Licenties kunnen **uitsluitend worden gekocht via [geektech.no](https://geektech.no)**. Zonder actieve licentie is de module vergrendeld en niet beschikbaar.
:::

## Licentie — kopen en activeren

### Licentie kopen

1. Ga naar **[geektech.no](https://geektech.no)** en maak een account aan
2. Selecteer **Bambu Dashboard — E-commercelicentie**
3. Kies het licentietype:

| Licentietype | Beschrijving | Printers |
|---|---|---|
| **Hobby** | Één printer, persoonlijk gebruik en kleinschalige verkoop | 1 |
| **Professioneel** | Tot 5 printers, commercieel gebruik | 1–5 |
| **Enterprise** | Onbeperkt aantal printers, volledige ondersteuning | Onbeperkt |

4. Voltooi de betaling
5. U ontvangt een **licentiesleutel** per e-mail

### Licentie activeren

1. Ga naar **Instellingen → E-commerce** in het dashboard
2. Vul de volgende velden in:

| Veld | Beschrijving | Verplicht |
|------|-------------|-----------|
| **Licentiesleutel** | 32-tekens hexadecimale sleutel van geektech.no | ✅ Ja |
| **E-mailadres** | Het e-mailadres waarmee u hebt gekocht | ✅ Ja |
| **Domein** | Het domein waarop het dashboard draait (zonder https://) | Aanbevolen |
| **Telefoon** | Contacttelefoon (met landnummer, bijv. +31) | Optioneel |

### Licentietype — identifikatorbinding

geektech.no koppelt de licentie aan één of meer identifikatoren:

| Type | Valideert tegen | Gebruiksscenario |
|------|-----------------|-----------------|
| **Domein** | Domeinnaam (bijv. `dashboard.bedrijf.nl`) | Vaste server met eigen domein |
| **IP** | Openbaar IP-adres(sen) | Server zonder domein, vast IP |
| **MAC** | MAC-adres(sen) van de netwerkkaart | Hardwarebinding |
| **IP + MAC** | Zowel IP als MAC moet overeenkomen | Hoogste beveiliging |

:::info Automatische identificatie
Het dashboard stuurt bij elke validering automatisch het IP-adres en MAC-adres van de server. U hoeft deze niet handmatig in te voeren — geektech.no registreert ze bij de eerste activering.
:::

Meerdere IP-adressen en MAC-adressen kunnen worden toegestaan (één per regel in de geektech.no admin). Dit is handig voor servers met meerdere netwerkkaarten of dynamisch IP.

3. Klik op **Licentie activeren**
4. Het dashboard stuurt een activeringsverzoek naar geektech.no
5. Bij succesvolle activering worden het volgende weergegeven:
   - **Licentietype** (Hobby / Professioneel / Enterprise)
   - **Vervaldatum**
   - **Maximum aantal printers**
   - **Licentiehouder**
   - **Instantie-ID** (uniek voor uw installatie)

:::warning De licentiesleutel is gekoppeld aan uw domein en installatie
De sleutel wordt geactiveerd voor één specifieke Bambu Dashboard-installatie en domein. Neem contact op met [geektech.no](https://geektech.no) support als u:
- De licentie naar een nieuwe server wilt verplaatsen
- Het domein wilt wijzigen
- Het aantal printers wilt verhogen
:::

### Licentievalidatie

De licentie wordt geverifieerd en gesynchroniseerd met geektech.no:

- **Validering bij opstart** — de licentie wordt automatisch gecontroleerd
- **Doorlopende validering** — elke 24 uur opnieuw gevalideerd bij geektech.no
- **Offline-modus** — bij netwerkstoringen werkt de licentie tot **7 dagen** met gecachede validering
- **Verlopen licentie** → de module wordt vergrendeld, maar bestaande data (bestellingen, klanten) blijft behouden
- **PIN-code** — geektech.no kan de licentie vergrendelen/vrijgeven via het PIN-systeem
- **Verlenging** — via **[geektech.no](https://geektech.no)** → Mijn licenties → Verlengen

### Licentietypen en beperkingen

| Plan | Printers | Platforms | Vergoeding | Prijs |
|------|----------|-----------|------------|-------|
| **Hobby** | 1 | 1 (Shopify OF WooCommerce) | 5% | Zie geektech.no |
| **Professioneel** | 1–5 | Alle | 5% | Zie geektech.no |
| **Enterprise** | Onbeperkt | Alle + API | 3% | Zie geektech.no |

### Licentiestatus controleren

Ga naar **Instellingen → E-commerce** of roep de API aan:

```bash
curl -sk https://localhost:3443/api/ecommerce/license
```

Het antwoord bevat:
```json
{
  "active": true,
  "status": "active",
  "plan": "professional",
  "holder": "Bedrijfsnaam BV",
  "email": "bedrijf@voorbeeld.nl",
  "domain": "dashboard.bedrijfsnaam.nl",
  "max_printers": 5,
  "expires_at": "2027-03-22",
  "provider": "geektech.no",
  "fees_pending": 2,
  "fees_this_month": 450.00,
  "orders_this_month": 12
}
```

## Klanten

### Een klant aanmaken

1. Ga naar **E-commerce → Klanten**
2. Klik op **Nieuwe klant**
3. Vul in:
   - **Naam / Bedrijfsnaam**
   - **Contactpersoon** (voor bedrijven)
   - **E-mailadres**
   - **Telefoon**
   - **Adres** (factuuradres)
   - **KvK-nummer / BSN** (optioneel, voor BTW-geregistreerden)
   - **Opmerking** — interne notitie
4. Klik op **Aanmaken**

### Klantoverzicht

De klantenlijst toont:
- Naam en contactgegevens
- Totaal aantal bestellingen
- Totale omzet
- Datum van laatste bestelling
- Status (Actief / Inactief)

Klik op een klant om alle bestelling- en factureringsgeschiedenis te bekijken.

## Bestelbeheer

### Een bestelling aanmaken

1. Ga naar **E-commerce → Bestellingen**
2. Klik op **Nieuwe bestelling**
3. Selecteer een **Klant** uit de lijst
4. Voeg bestelregels toe:
   - Selecteer bestand/model uit de bestandsbibliotheek, of voeg een vrije-tekstpost toe
   - Geef het aantal en de eenheidsprijs op
   - Systeem berekent kosten automatisch indien gekoppeld aan project
5. Geef de **Leverdatum** op (geschat)
6. Klik op **Bestelling aanmaken**

### Bestelstatus

| Status | Beschrijving |
|---|---|
| Aanvraag | Aanvraag ontvangen, niet bevestigd |
| Bevestigd | Klant heeft bevestigd |
| In productie | Prints lopen |
| Klaar voor levering | Klaar, wacht op afhaling/verzending |
| Geleverd | Bestelling voltooid |
| Geannuleerd | Geannuleerd door klant of door u |

Update de status door op de bestelling te klikken → **Status wijzigen**.

### Prints aan bestelling koppelen

1. Open de bestelling
2. Klik op **Print koppelen**
3. Selecteer prints uit de geschiedenis (meervoudige selectie ondersteund)
4. Kostendata wordt automatisch opgehaald uit de printgeschiedenis

## Facturering

Zie [Projecten → Facturering](../funksjoner/projects#fakturering) voor gedetailleerde factureringsdocumentatie.

Een factuur kan direct vanuit een bestelling worden gegenereerd:

1. Open de bestelling
2. Klik op **Factuur genereren**
3. Controleer bedrag en BTW
4. Download als PDF of stuur naar het e-mailadres van de klant

### Factuurnummerreeks

Stel de factuurnummerreeks in via **Instellingen → E-commerce**:
- **Prefix**: bijv. `2026-`
- **Startnummer**: bijv. `1001`
- Factuurnummers worden automatisch in oplopende volgorde toegewezen

## Rapportage en vergoedingen

### Vergoedingsrapportage

Het systeem volgt alle transactievergoedingen:
- Bekijk vergoedingen via **E-commerce → Vergoedingen**
- Markeer vergoedingen als gerapporteerd voor boekhoudkundige doeleinden
- Exporteer vergoedingssamenvatting per periode

### Statistieken

Via **E-commerce → Statistieken**:
- Maandelijkse omzet (staafdiagram)
- Top-klanten op omzet
- Meest verkochte modellen/materialen
- Gemiddelde bestelgrootte

Exporteer naar CSV voor boekhoudprogramma's.

## Ondersteuning en contact

:::info Hulp nodig?
- **Licentievragen**: neem contact op met [geektech.no](https://geektech.no) support
- **Technische problemen**: [GitHub Issues](https://github.com/skynett81/bambu-dashboard/issues)
- **Functieverzoeken**: [GitHub Discussions](https://github.com/skynett81/bambu-dashboard/discussions)
:::
