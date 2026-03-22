---
sidebar_position: 5
title: E-handel
description: Hantera beställningar, kunder och fakturering för försäljning av 3D-utskrifter — kräver licens från geektech.no
---

# E-handel

E-handelsmodulen ger dig ett komplett system för att hantera kunder, beställningar och fakturering — perfekt för dem som säljer 3D-utskrifter professionellt eller semi-professionellt.

Gå till: **https://localhost:3443/#orders**

:::danger E-handelslicens krävs
E-handelsmodulen kräver en giltig licens. Licenser kan **endast köpas via [geektech.no](https://geektech.no)**. Utan aktiv licens är modulen låst och otillgänglig.
:::

## Licens — köp och aktivering

### Köpa licens

1. Gå till **[geektech.no](https://geektech.no)** och skapa ett konto
2. Välj **Bambu Dashboard — E-handelslicens**
3. Välj licenstyp:

| Licenstyp | Beskrivning | Skrivare |
|---|---|---|
| **Hobby** | En skrivare, personligt bruk och småförsäljning | 1 |
| **Professionell** | Upp till 5 skrivare, kommersiell användning | 1–5 |
| **Enterprise** | Obegränsat antal skrivare, fullständigt stöd | Obegränsat |

4. Slutför betalning
5. Du får en **licensnyckel** via e-post

### Aktivera licens

1. Gå till **Inställningar → E-handel** i dashboardet
2. Fyll i följande fält:

| Fält | Beskrivning | Obligatorisk |
|------|-------------|--------------|
| **Licensnyckel** | 32-teckens hex-nyckel från geektech.no | ✅ Ja |
| **E-postadress** | E-posten du använde vid köpet | ✅ Ja |
| **Domän** | Domänen som dashboardet körs på (utan https://) | Rekommenderat |
| **Telefon** | Kontakttelefon (med landskod, t.ex. +46) | Valfritt |

### Licenstyp — identifikatorbindning

geektech.no binder licensen till en eller flera identifierare:

| Typ | Validerar mot | Användningsområde |
|-----|---------------|-------------------|
| **Domän** | Domännamn (t.ex. `dashboard.foretag.se`) | Fast server med egen domän |
| **IP** | Offentlig IP-adress(er) | Server utan domän, fast IP |
| **MAC** | MAC-adress(er) på nätverkskortet | Hårdvarubindning |
| **IP + MAC** | Både IP och MAC måste matcha | Högsta säkerhet |

:::info Automatisk identifiering
Dashboardet skickar automatiskt serverns IP-adress och MAC-adress vid varje validering. Du behöver inte fylla i dessa manuellt — geektech.no registrerar dem vid första aktiveringen.
:::

Flera IP-adresser och MAC-adresser kan tillåtas (en per rad i geektech.no admin). Detta är användbart för servrar med flera nätverkskort eller dynamisk IP.

3. Klicka **Aktivera licens**
4. Dashboardet skickar en aktiveringsförfrågan till geektech.no
5. Vid lyckad aktivering visas:
   - **Licenstyp** (Hobby / Professionell / Enterprise)
   - **Utgångsdatum**
   - **Maximalt antal skrivare**
   - **Licensinnehavare**
   - **Instans-ID** (unikt för din installation)

:::warning Licensnyckeln är kopplad till domän och installation
Nyckeln aktiveras för en specifik Bambu Dashboard-installation och domän. Kontakta [geektech.no](https://geektech.no) support om du behöver:
- Flytta licensen till en ny server
- Ändra domän
- Öka antalet skrivare
:::

### Licensvalidering

Licensen autentiseras och synkroniseras med geektech.no:

- **Validering vid uppstart** — licensen kontrolleras automatiskt
- **Löpande validering** — revalideras var 24:e timme mot geektech.no
- **Offline-läge** — vid nätverksavbrott fungerar licensen i upp till **7 dagar** med cachad validering
- **Utgången licens** → modulen låses, men befintlig data (beställningar, kunder) behålls
- **PIN-kod** — geektech.no kan låsa/frigöra licensen via PIN-systemet
- **Förnyelse** — via **[geektech.no](https://geektech.no)** → Mina licenser → Förnya

### Licenstyper och begränsningar

| Plan | Skrivare | Plattformar | Avgift | Pris |
|------|----------|-------------|--------|------|
| **Hobby** | 1 | 1 (Shopify ELLER WooCommerce) | 5% | Se geektech.no |
| **Professionell** | 1–5 | Alla | 5% | Se geektech.no |
| **Enterprise** | Obegränsat | Alla + API | 3% | Se geektech.no |

### Kontrollera licensstatus

Gå till **Inställningar → E-handel** eller anropa API:et:

```bash
curl -sk https://localhost:3443/api/ecommerce/license
```

Svaret innehåller:
```json
{
  "active": true,
  "status": "active",
  "plan": "professional",
  "holder": "Företagsnamn AB",
  "email": "foretag@exempel.se",
  "domain": "dashboard.foretagsnamn.se",
  "max_printers": 5,
  "expires_at": "2027-03-22",
  "provider": "geektech.no",
  "fees_pending": 2,
  "fees_this_month": 450.00,
  "orders_this_month": 12
}
```

## Kunder

### Skapa en kund

1. Gå till **E-handel → Kunder**
2. Klicka **Ny kund**
3. Fyll i:
   - **Namn / Företagsnamn**
   - **Kontaktperson** (för företag)
   - **E-postadress**
   - **Telefon**
   - **Adress** (faktureringsadress)
   - **Org.nr / Personnummer** (valfritt, för momsregistrerade)
   - **Anteckning** — intern notering
4. Klicka **Skapa**

### Kundöversikt

Kundlistan visar:
- Namn och kontaktinformation
- Totalt antal beställningar
- Total omsättning
- Senaste beställningsdatum
- Status (Aktiv / Inaktiv)

Klicka på en kund för att se all beställnings- och faktureringshistorik.

## Orderhantering

### Skapa en beställning

1. Gå till **E-handel → Beställningar**
2. Klicka **Ny beställning**
3. Välj **Kund** från listan
4. Lägg till orderrader:
   - Välj fil/modell från filbiblioteket, eller lägg till en fritextpost
   - Ange antal och enhetspris
   - Systemet beräknar kostnad automatiskt om det kopplas till ett projekt
5. Ange **Leveransdatum** (uppskattad)
6. Klicka **Skapa beställning**

### Beställningsstatus

| Status | Beskrivning |
|---|---|
| Förfrågan | Mottagen förfrågan, ej bekräftad |
| Bekräftad | Kunden har bekräftat |
| Under produktion | Utskrifter pågår |
| Redo för leverans | Klar, väntar på avhämtning/sändning |
| Levererad | Beställning slutförd |
| Avbruten | Avbruten av kund eller dig |

Uppdatera status genom att klicka på beställningen → **Ändra status**.

### Koppla utskrifter till beställning

1. Öppna beställningen
2. Klicka **Koppla utskrift**
3. Välj utskrifter från historiken (flerval stöds)
4. Kostnadsdata hämtas automatiskt från utskriftshistorik

## Fakturering

Se [Projekt → Fakturering](../funksjoner/projects#fakturering) för detaljerad faktureringsdokumentation.

Faktura kan genereras direkt från en beställning:

1. Öppna beställningen
2. Klicka **Generera faktura**
3. Kontrollera belopp och moms
4. Ladda ner PDF eller skicka till kundens e-post

### Fakturanummerserie

Ställ in fakturanummerserie under **Inställningar → E-handel**:
- **Prefix**: t.ex. `2026-`
- **Startnummer**: t.ex. `1001`
- Fakturanummer tilldelas automatiskt i stigande ordning

## Rapportering och avgifter

### Avgiftsrapportering

Systemet spårar alla transaktionsavgifter:
- Se avgifter under **E-handel → Avgifter**
- Markera avgifter som rapporterade för bokföringssyften
- Exportera avgiftssammanfattning per period

### Statistik

Under **E-handel → Statistik**:
- Månadsvis omsättning (stapeldiagram)
- Toppkunder efter omsättning
- Mest sålda modeller/material
- Genomsnittlig beställningsstorlek

Exportera till CSV för bokföringssystem.

## Support och kontakt

:::info Behöver du hjälp?
- **Licensfrågor**: kontakta [geektech.no](https://geektech.no) support
- **Tekniska problem**: [GitHub Issues](https://github.com/skynett81/bambu-dashboard/issues)
- **Funktionsönskemål**: [GitHub Discussions](https://github.com/skynett81/bambu-dashboard/discussions)
:::
