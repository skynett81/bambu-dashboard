---
sidebar_position: 5
title: E-handel
description: Administrer ordrer, kunder og fakturering for salg av 3D-prints med lisens og kostnadsberegning
---

# E-handel

E-handelmodulen gir deg et enkelt system for å administrere kunder, ordrer og fakturering — perfekt for de som selger 3D-prints profesjonelt eller semi-profesjonelt.

Gå til: **https://localhost:3443/#ecommerce**

## Kunder

### Opprette en kunde

1. Gå til **E-handel → Kunder**
2. Klikk **Ny kunde**
3. Fyll inn:
   - **Navn / Firmanavn**
   - **Kontaktperson** (for bedrifter)
   - **E-postadresse**
   - **Telefon**
   - **Adresse** (faktureringsadresse)
   - **Org.nr / Personnummer** (valgfritt, for MVA-registrerte)
   - **Notat** — intern merknad
4. Klikk **Opprett**

### Kundeoversikt

Kundelisten viser:
- Navn og kontaktinfo
- Totalt antall ordrer
- Total omsetning
- Siste ordredato
- Status (Aktiv / Inaktiv)

Klikk på en kunde for å se all ordre- og fakturering-historikk.

## Ordrehåndtering

### Opprette en ordre

1. Gå til **E-handel → Ordrer**
2. Klikk **Ny ordre**
3. Velg **Kunde** fra listen
4. Legg til ordrelinjer:
   - Velg fil/modell fra filbiblioteket, eller legg til fritekst-post
   - Angi antall og enhetspris
   - System beregner kostnad automatisk hvis kobles til prosjekt
5. Angi **Leveringsdato** (estimert)
6. Klikk **Opprett ordre**

### Ordrestatus

| Status | Beskrivelse |
|---|---|
| Forespørsel | Mottatt forespørsel, ikke bekreftet |
| Bekreftet | Kunden har bekreftet |
| Under produksjon | Prints pågår |
| Klar til levering | Ferdig, venter på henting/sending |
| Levert | Ordre fullført |
| Avbrutt | Kansellert av kunde eller deg |

Oppdater status ved å klikke på ordren → **Endre status**.

### Koble prints til ordre

1. Åpne ordren
2. Klikk **Koble print**
3. Velg prints fra historikken (flervalg støttes)
4. Kostnadsdata hentes automatisk fra printhistorikk

## Fakturering

Se [Prosjekter → Fakturering](../funksjoner/projects#fakturering) for detaljert faktureringsdokumentasjon.

Faktura kan genereres direkte fra en ordre:

1. Åpne ordren
2. Klikk **Generer faktura**
3. Kontroller beløp og mva
4. Last ned PDF eller send til kundens e-post

### Fakturanummerserie

Sett opp fakturanummerserie under **Innstillinger → E-handel**:
- **Prefiks**: f.eks. `2026-`
- **Startnummer**: f.eks. `1001`
- Fakturanummer tildeles automatisk i stigende rekkefølge

## Lisensiering

For kunder som kjøper rettigheter til modeller du har designet:

1. Opprett en **Lisens**-ordrelinje
2. Velg **Lisenstype**: Personlig / Kommersiell / Ubegrenset
3. Systemet genererer et **lisensbevis** som vedlegges fakturaen

:::info Lisens gjelder kun dine egne modeller
Bambu Dashboard støtter kun lisensiering av modeller du selv har laget. For MakerWorld/Printables-modeller, respekter originaldesignerens lisensvilkår.
:::

## Statistikk

Under **E-handel → Statistikk**:
- Månedlig omsetning (stolpediagram)
- Topp-kunder etter omsetning
- Mest solgte modeller/materialer
- Gjennomsnittlig ordrestørrelse

Eksporter til CSV for regnskapssystem.
