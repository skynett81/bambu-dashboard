---
sidebar_position: 2
title: Filbibliotek
description: Last opp og administrer 3D-modeller og G-kode-filer, analyser G-kode og koble til MakerWorld og Printables
---

# Filbibliotek

Filbiblioteket er et sentralt sted for å lagre og administrere alle 3D-modellene og G-kode-filene dine — med automatisk G-kode-analyse og integrasjon mot MakerWorld og Printables.

Gå til: **https://localhost:3443/#library**

## Laste opp modeller

### Enkelt opplasting

1. Gå til **Filbibliotek**
2. Klikk **Last opp** eller dra filer til opplastingsområdet
3. Støttede formater: `.3mf`, `.gcode`, `.bgcode`, `.stl`, `.obj`
4. Filen analyseres automatisk etter opplasting

:::info Lagringsmappe
Filer lagres i mappen konfigurert under **Innstillinger → Filbibliotek → Lagringsmappe**. Standard: `./data/library/`
:::

### Batch-opplasting

Dra og slipp en hel mappe for å laste opp alle støttede filer på én gang. Filene behandles i bakgrunnen og du varsles når alt er klart.

## G-kode-analyse

Etter opplasting analyseres `.gcode`- og `.bgcode`-filer automatisk:

| Metrikk | Beskrivelse |
|---|---|
| Estimert printtid | Tid beregnet fra G-kode-kommandoer |
| Filamentforbruk | Gram og meter per materiale/farge |
| Lag-teller | Totalt antall lag |
| Lagtykkelse | Registrert lagtykkelse |
| Materialer | Detekterte materialer (PLA, PETG, osv.) |
| Infill-prosent | Hvis tilgjengelig i metadata |
| Støttemateriell | Estimert støttevekt |
| Printermodell | Målprinter fra metadata |

Analysedataene vises i filkortet og brukes av [Kostnadsberegneren](../analytics/costestimator).

## Filkort og metadata

Hvert filkort viser:
- **Filnavn** og format
- **Opplastet dato**
- **Thumbnail** (fra `.3mf` eller generert)
- **Analysert printtid** og filamentforbruk
- **Tags** og kategori
- **Tilknyttede prints** — antall ganger printet

Klikk på et kort for å åpne detaljvisning med full metadata og historikk.

## Organisering

### Tags

Legg til tags for enkel søking:
1. Klikk på filen → **Rediger metadata**
2. Skriv inn tags (kommaseparert): `benchy, test, PLA, kalibrering`
3. Søk i biblioteket med tagfilter

### Kategorier

Organiser filer i kategorier:
- Klikk **Ny kategori** i sidefeltet
- Dra filer til kategorien
- Kategorier kan nestes (underkategorier støttes)

## Kobling til MakerWorld

1. Gå til **Innstillinger → Integrasjoner → MakerWorld**
2. Logg inn med Bambu Lab-kontoen din
3. Tilbake i biblioteket: klikk på en fil → **Koble til MakerWorld**
4. Søk etter modellen på MakerWorld og velg riktig treff
5. Metadata (designer, lisensiering, rating) importeres fra MakerWorld

Koblingen viser designer-navn og original URL på filkortet.

## Kobling til Printables

1. Gå til **Innstillinger → Integrasjoner → Printables**
2. Lim inn din Printables API-nøkkel
3. Koble filer til Printables-modeller på samme måte som MakerWorld

## Send to Printer

Hver fil i biblioteket har en **Send to Printer**-knapp som sender modellen direkte til en tilkoblet printer:

1. Klikk **Send to Printer** på filkortet (eller i detaljvisningen)
2. Velg målprinter fra listen over tilkoblede printere
3. Velg AMS-spor og filamentmapping (for flerfargeprints)
4. Juster printinnstillinger (profil, hastighet, støtte)
5. Klikk **Start Print** for umiddelbar start

Støtter alle printertyper: Bambu Lab (via MQTT/FTPS), PrusaLink (via HTTP), Moonraker/Klipper (via WebSocket).

:::warning Direktesending
Direktesending starter printen umiddelbart uten bekreftelse i slicerprogramvaren. Pass på at printeren er klar og riktig filament er lastet.
:::

## Add to Queue

I tillegg til direktesending kan du legge filer i print-køen for senere printing:

1. Klikk **Add to Queue** på filkortet
2. Velg målprinter (eller la planleggeren tildele automatisk)
3. Sett prioritet (lav, normal, høy)
4. Valgfritt: sett ønsket starttidspunkt
5. Klikk **Legg i kø**

Filer i køen vises i [Planlegger](../features/scheduler)-visningen og kan omorganiseres, redigeres eller fjernes. Køen støtter lastbalansering på tvers av flere printere.

:::tip Rask kø-handling
Du kan også dra og slippe filer fra biblioteket direkte til print-køen i planleggervisningen.
:::

## 3D-forhåndsvisning

Alle 3MF-filer i biblioteket har en **▶ 3D Forhåndsvisning**-knapp som åpner [3MFConsortium sin 3mfViewer](https://github.com/3MFConsortium/3mfViewer):

- **Full 3D-visning** — scene tree, materialer, farger, wireframe og beam lattice
- **lib3mf WASM** — spec-kompatibel parsing av metadata, thumbnails og mesh-data
- **Interaktiv** — roter, zoom og panorer modellen med musekontroller
- Drevet av den offisielle [3MF Consortium](https://github.com/3mfconsortium) standarden
