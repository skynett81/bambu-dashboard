---
sidebar_position: 1
title: Welkom bij Bambu Dashboard
description: Een krachtig, zelf-gehost dashboard voor Bambu Lab 3D-printers
---

# Welkom bij Bambu Dashboard

[![ko-fi](https://ko-fi.com/img/githubbutton_sm.svg)](https://ko-fi.com/V7V21NRKM7)

**Bambu Dashboard** is een zelf-gehost, volledig uitgerust controlepaneel voor Bambu Lab 3D-printers. Het geeft je volledig inzicht en controle over je printer, filamentvoorraad, printgeschiedenis en meer — allemaal vanuit één browsertabblad.

## Wat is Bambu Dashboard?

Bambu Dashboard verbindt rechtstreeks met je printer via MQTT over LAN, zonder afhankelijkheid van de servers van Bambu Lab. Je kunt ook verbinding maken met Bambu Cloud voor synchronisatie van modellen en printgeschiedenis.

### Belangrijkste functies

- **Live dashboard** — realtime temperatuur, voortgang, camera, AMS-status met LIVE-indicator
- **Filamentvoorraad** — volg alle spoelen met AMS-synchronisatie, EXT-spoelondersteuning, materiaalinfo, plaatcompatibiliteit en drooggids
- **Filamenttracking** — nauwkeurige tracking met 4-niveau fallback (AMS-sensor → EXT-schatting → cloud → duur)
- **Materiaalhandleiding** — 15 materialen met temperaturen, plaatcompatibiliteit, drogen, eigenschappen en tips
- **Printgeschiedenis** — volledig logboek met modelnamen, MakerWorld-links, filamentverbruik en kosten
- **Planner** — kalenderweergave, printwachtrij met taakverdeling en filamentcontrole
- **Printerbesturing** — temperatuur, snelheid, ventilatoren, G-code console
- **Print Guard** — automatische bescherming met xcam + 5 sensormonitoren
- **Kostenschatter** — materiaal, stroom, arbeid, slijtage, opslag met aanbevolen verkoopprijs
- **Onderhoud** — tracking met KB-gebaseerde intervallen, levensduur nozzle, levensduur plaat en handleiding
- **Geluidsalarmen** — 9 configureerbare events met aangepaste geluidsupload en printerluidspreker (M300)
- **Activiteitenlogboek** — persistente tijdlijn van alle events (prints, fouten, onderhoud, filament)
- **Meldingen** — 7 kanalen (Telegram, Discord, e-mail, ntfy, Pushover, SMS, webhook)
- **Multi-printer** — ondersteunt de volledige Bambu Lab-serie
- **17 talen** — Noors, Engels, Duits, Frans, Spaans, Italiaans, Japans, Koreaans, Nederlands, Pools, Portugees, Zweeds, Turks, Oekraïens, Chinees, Tsjechisch, Hongaars
- **Zelf-gehost** — geen cloudafhankelijkheid, jouw gegevens op jouw machine

### Nieuw in v1.1.13

- **EXT-spoeldetectie** voor P2S/A1 via MQTT-mappingveld — filamentverbruik correct bijgehouden voor externe spoel
- **Filamentmateriaal-database** met 15 materialen, plaatcompatibiliteit, drooggids en eigenschappen
- **Onderhoudspaneel** met KB-gebaseerde intervallen, 4 nieuwe nozzletypen, handleidingtab met links naar documentatie
- **Geluidsalarmen** met 9 events, aangepaste upload (MP3/OGG/WAV, max. 10 s), volumeregeling en printerluidspreker
- **Activiteitenlogboek** — persistente tijdlijn van alle databases, ongeacht of de pagina open was
- **HMS-foutcodes** met leesbare beschrijvingen van 270+ codes
- **Volledig i18n** — alle 2944 sleutels vertaald naar 17 talen
- **Auto-build docs** — documentatie wordt automatisch gegenereerd bij installatie en serverstart

## Snel aan de slag

| Taak | Link |
|------|------|
| Dashboard installeren | [Installatie](./kom-i-gang/installasjon) |
| Eerste printer configureren | [Instellen](./kom-i-gang/oppsett) |
| Verbinding maken met Bambu Cloud | [Bambu Cloud](./kom-i-gang/bambu-cloud) |
| Alle functies verkennen | [Functies](./funksjoner/oversikt) |
| Filamenthandleiding | [Materiaalhandleiding](./kb/filamenter/guide) |
| Onderhoudshandleiding | [Onderhoud](./kb/vedlikehold/dyse) |
| API-documentatie | [API](./avansert/api) |

:::tip Demomodus
Je kunt het dashboard uitproberen zonder een fysieke printer door `npm run demo` uit te voeren. Dit start 3 gesimuleerde printers met live printcycli.
:::

## Ondersteunde printers

Alle Bambu Lab-printers met LAN-modus:

- **X1-serie**: X1C, X1C Combo, X1E
- **P1-serie**: P1S, P1S Combo, P1P
- **P2-serie**: P2S, P2S Combo
- **A-serie**: A1, A1 Combo, A1 mini
- **H2-serie**: H2S, H2D (dubbele nozzle), H2C (toolwisselaar, 6 koppen)

## Functies in detail

### Filamenttracking

Het dashboard houdt het filamentverbruik automatisch bij met een 4-niveau fallback:

1. **AMS-sensor diff** — meest nauwkeurig, vergelijkt start/einde remain%
2. **EXT direct** — voor P2S/A1 zonder vt_tray, gebruikt cloud-schatting
3. **Cloud-schatting** — van Bambu Cloud-printjobgegevens
4. **Duurschatting** — ~30 g/uur als laatste fallback

Alle waarden worden getoond als het minimum van AMS-sensor en spoeldatabase om fouten na mislukte prints te voorkomen.

### Materiaalhandleiding

Ingebouwde database met 15 materialen inclusief:
- Temperaturen (nozzle, bed, kamer)
- Plaatcompatibiliteit (Cool, Engineering, High Temp, Textured PEI)
- Drooginformatie (temperatuur, tijd, hygroscopiciteit)
- 8 eigenschappen (sterkte, flexibiliteit, warmtebestendigheid, UV, oppervlak, gebruiksgemak)
- Moeilijkheidsgraad en speciale vereisten (geharde nozzle, behuizing)

### Geluidsalarmen

9 configureerbare events met ondersteuning voor:
- **Aangepaste audioclips** — upload MP3/OGG/WAV (max. 10 seconden, 500 KB)
- **Ingebouwde tonen** — metallische/synth-geluiden gegenereerd met Web Audio API
- **Printerluidspreker** — M300 G-code melodieën direct op de buzzer van de printer
- **Aftellen** — geluidsalarm wanneer er nog 1 minuut van de print resteert

### Onderhoud

Volledig onderhoudssysteem met:
- Componenttracking (nozzle, PTFE-buis, stangen, lagers, AMS, plaat, drogen)
- KB-gebaseerde intervallen uit de documentatie
- Nozzle-levensduur per type (messing, gehard staal, HS01)
- Plaatlevensduur per type (Cool, Engineering, High Temp, Textured PEI)
- Handleidingtab met tips en links naar volledige documentatie

## Technisch overzicht

Bambu Dashboard is gebouwd met Node.js 22 en vanilla HTML/CSS/JS — geen zware frameworks, geen bouwstap. De database is SQLite, ingebouwd in Node.js 22.

- **Backend**: Node.js 22 met slechts 3 npm-pakketten (mqtt, ws, basic-ftp)
- **Frontend**: Vanilla HTML/CSS/JS, geen bouwstap
- **Database**: SQLite via Node.js 22 built-in `--experimental-sqlite`
- **Documentatie**: Docusaurus met 17 talen, automatisch gegenereerd bij installatie
- **API**: 177+ endpoints, OpenAPI-documentatie op `/api/docs`

Zie [Architectuur](./avansert/arkitektur) voor details.
