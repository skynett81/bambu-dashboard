---
sidebar_position: 9
title: Prosjekter
description: Organiser prints i prosjekter, spor kostnader, generer faktura og del prosjekter med kunder
---

# Prosjekter

Prosjekter lar deg gruppere relaterte prints, spore materialkostnader, fakturere kunder og dele en oversikt over arbeidet ditt.

Gå til: **https://localhost:3443/#projects**

## Opprette et prosjekt

1. Klikk **Nytt prosjekt** (+ ikon)
2. Fyll inn:
   - **Prosjektnavn** — beskrivende navn (maks 100 tegn)
   - **Kunde** — valgfri kundekonto (se [E-handel](../integrasjoner/ecommerce))
   - **Beskrivelse** — kort tekstbeskrivelse
   - **Farge** — velg en farge for visuell identifikasjon
   - **Tags** — kommaseparerte emneord
3. Klikk **Opprett prosjekt**

## Koble prints til prosjekt

### Under en print

1. Åpne dashboardet mens en print pågår
2. Klikk **Koble til prosjekt** i sidepanelet
3. Velg eksisterende prosjekt eller opprett nytt
4. Printen knyttes automatisk til prosjektet når den fullføres

### Fra historikk

1. Gå til **Historikk**
2. Finn den aktuelle printen
3. Klikk på printen → **Koble til prosjekt**
4. Velg prosjekt fra nedtrekkslisten

### Massekobling

1. Velg flere prints i historikken med avkryssingsbokser
2. Klikk **Handlinger → Koble til prosjekt**
3. Velg prosjekt — alle valgte prints kobles til

## Kostnadsoversikt

Hvert prosjekt beregner totale kostnader basert på:

| Kostnadstype | Kilde |
|---|---|
| Filamentforbruk | Gram × pris per gram per materiale |
| Strøm | kWh × strømpris (fra Tibber/Nordpool hvis konfigurert) |
| Maskinslitasje | Beregnet fra [Slitasjepredikasjon](../overvaaking/wearprediction) |
| Manuell kostnad | Fri-tekst-poster du legger til manuelt |

Kostnadsoversikten vises som tabell og kakediagram per print og totalt.

:::tip Timepriser
Aktivér Tibber- eller Nordpool-integrasjonen for nøyaktige strømkostnader per print. Se [Strømpris](../integrasjoner/energy).
:::

## Fakturering

1. Åpne et prosjekt og klikk **Generer faktura**
2. Fyll inn:
   - **Fakturadato** og **forfallsdato**
   - **Mva-sats** (0 %, 15 %, 25 %)
   - **Påslag** (%)
   - **Notat til kunde**
3. Forhåndsvis fakturaen i PDF-format
4. Klikk **Last ned PDF** eller **Send til kunde** (via e-post)

Fakturaer lagres under prosjektet og kan gjenåpnes og redigeres frem til de er sendt.

:::info Kundedata
Kundedata (navn, adresse, org.nr.) hentes fra kundekontoen du koblet til prosjektet. Se [E-handel](../integrasjoner/ecommerce) for å administrere kunder.
:::

## Prosjektstatus

| Status | Beskrivelse |
|---|---|
| Aktiv | Prosjektet er under arbeid |
| Fullført | Alle prints er klare, faktura sendt |
| Arkivert | Skjult fra standardvisningen, men søkbar |
| På vent | Midlertidig stanset |

Endre status ved å klikke på statusindikatoren øverst i prosjektet.

## Dele et prosjekt

Generer en delbar lenke for å vise prosjektoversikten til kunder:

1. Klikk **Del prosjekt** i prosjektmenyen
2. Velg hva som skal vises:
   - ✅ Prints og bilder
   - ✅ Totalt filamentforbruk
   - ❌ Kostnader og priser (skjult som standard)
3. Sett utløpstid for lenken
4. Kopier og del lenken

Kunden ser en skrivebeskyttet side uten å logge inn.
