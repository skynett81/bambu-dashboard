---
sidebar_position: 1
title: Etiketter
description: Generer QR-koder, spol-etiketter for termiske skrivere (ZPL), fargekort og delte fargepaletter for filamentlageret
---

# Etiketter

Etikettverktøyet genererer profesjonelle etiketter for filamentspolen dine — QR-koder, spol-etiketter for termiske skrivere og fargekort for visuell identifikasjon.

Gå til: **https://localhost:3443/#labels**

## QR-koder

Generer QR-koder som kobler til filamentinformasjon i dashboardet:

1. Gå til **Etiketter → QR-koder**
2. Velg spolen du vil generere QR-kode for
3. QR-koden genereres automatisk og vises i forhåndsvisningen
4. Klikk **Last ned PNG** eller **Skriv ut**

QR-koden inneholder en URL til filamentprofilen i dashboardet. Skann med mobilen for å hente opp spolinformasjon raskt.

### Batchgenerering

1. Klikk **Velg alle** eller huk av enkeltspolar
2. Klikk **Generer alle QR-koder**
3. Last ned som ZIP med én PNG per spole, eller skriv ut alle på én gang

## Spol-etiketter

Profesjonelle etiketter for termiske skrivere med fullt spolinformasjon:

### Etikett-innhold (standard)

- Spol-farge (utfylt fargeblokk)
- Materialnavn (stor skrift)
- Leverandør
- Farge-hex-kode
- Temperaturanbefalinger (dyse og seng)
- QR-kode
- Strekkode (valgfritt)

### ZPL for termiske skrivere

Generer ZPL-kode (Zebra Programming Language) for Zebra, Brother og Dymo-skrivere:

1. Gå til **Etiketter → Termisk skriving**
2. Velg etikettstørrelse: **25×54 mm** / **36×89 mm** / **62×100 mm**
3. Velg spolen(e)
4. Klikk **Generer ZPL**
5. Send ZPL-koden til skriveren via:
   - **Skriv ut direkte** (USB-tilkobling)
   - **Kopier ZPL** og send via terminalkommando
   - **Last ned .zpl-fil**

:::tip Skriveroppsett
For automatisk utskrift, konfigurer skrivestasjonen under **Innstillinger → Etikett-skriver** med IP-adresse og port (standard: 9100 for RAW TCP).
:::

### PDF-etiketter

For vanlige skrivere, generer PDF med riktige dimensjoner:

1. Velg etikettstørrelse fra malen
2. Klikk **Generer PDF**
3. Skriv ut på selvklebende papir (Avery eller tilsvarende)

## Fargekort

Fargekort er et kompakt rutenett som viser alle spoler visuelt:

1. Gå til **Etiketter → Fargekort**
2. Velg hvilke spoler som skal inkluderes (alle aktive, eller velg manuelt)
3. Velg kortformat: **A4** (4×8), **A3** (6×10), **Letter**
4. Klikk **Generer PDF**

Hvert felt viser:
- Fargeblokk med faktisk farge
- Materialnavn og farge-hex
- Materialnummer (for rask referanse)

Ideelt å laminere og henge ved printer-stasjonen.

## Delte fargepaletter

Eksporter et utvalg farger som en delt palett:

1. Gå til **Etiketter → Fargepaletter**
2. Velg spoler å inkludere i paletten
3. Klikk **Del palett**
4. Kopier lenken — andre kan importere paletten til sitt dashboard
5. Paletten vises med hex-koder og kan eksporteres til **Adobe Swatch** (`.ase`) eller **Procreate** (`.swatches`)
