---
sidebar_position: 7
title: Model Forge
description: 8 innebygde 3D-generatorer for skilt, lithophane, bokser, tekstplater, nøkkelringer, kabeletiketter, relieff og sjablonger
---

# Model Forge

Model Forge er et integrert verktøysett i 3DPrintForge som lar deg generere printklare 3D-modeller direkte i dashboardet — uten behov for ekstern modelleringsprogramvare.

Gå til: **https://localhost:3443/#model-forge**

:::info Erstatter Sign Maker
Model Forge erstatter den tidligere frittstående Sign Maker-funksjonen og utvider med 7 nye verktøy. Alle eksisterende Sign Maker-prosjekter er kompatible.
:::

## Oversikt over verktøy

Model Forge inneholder 8 spesialiserte 3D-generatorer:

| Verktøy | Beskrivelse |
|---------|-------------|
| Sign Maker | Lag tilpassede skilt med tekst, symboler og dekorative rammer |
| Lithophane | Konverter bilder til lithophane-modeller for bakbelysning |
| Storage Box | Generer oppbevaringsbokser med tilpassede dimensjoner og skillevegger |
| Text Plate | Lag tekstplater med valgfri font, størrelse og layout |
| Keychain | Design egne nøkkelringer med tekst, former og hull |
| Cable Label | Generer kabeletiketter for organisering av kabler og ledninger |
| Image Relief | Konverter bilder til 3D-relieff med justerbar dybde |
| Stencil | Lag sjablonger fra bilder eller tekst for maling og dekorasjon |

## Sign Maker

Lag tilpassede 3D-skilt med tekst og grafikk:

- **Tekst** — skriv inn teksten du vil ha på skiltet
- **Font** — velg mellom flere fonter (inkludert norske tegn)
- **Ramme** — velg dekorativ ramme rundt skiltet
- **Størrelse** — juster bredde, høyde og dybde
- **Symboler** — legg til ikoner og symboler
- **Forhåndsvisning** — se resultatet i sanntids 3D-visning

## Lithophane

Konverter et bilde til en lithophane — en tynn plate der bildet blir synlig når lys skinner gjennom:

- **Last opp bilde** — støtter JPG, PNG og BMP
- **Form** — flat, buet, sylindrisk eller kupp
- **Oppløsning** — juster detaljenivå (piksler per mm)
- **Tykkelse** — minimum og maksimum tykkelse
- **Invertert** — bytt lys og mørke områder
- **Forhåndsvisning** — se resultatet før generering

:::tip Beste resultat
Bruk hvitt PLA-filament og skriv ut med 100% infill for best lysgjennomsiving. Plasser en LED-lyskilde bak for å se bildet.
:::

## Storage Box

Generer tilpassede oppbevaringsbokser:

- **Dimensjoner** — bredde, dybde og høyde i mm
- **Veggtykkelse** — juster veggtykkelse
- **Skillevegger** — legg til interne skillevegger (X- og Y-retning)
- **Lokk** — valgfritt lokk med snap-fit eller skyvelokk
- **Hjørner** — avrundede eller skarpe hjørner
- **Etikettfelt** — valgfritt felt for etiketter på forsiden

## Text Plate

Lag 3D-tekstplater for merking og dekorasjon:

- **Tekst** — flerlinjet tekst med linjebrudd
- **Font** — velg font og tekststørrelse
- **Justering** — venstre, sentrert eller høyre
- **Baseplattform** — juster størrelse og form på bunnplaten
- **Opphevet/nedsunket** — velg om teksten skal stikke opp eller være innfelt
- **Festehull** — valgfrie hull for skruer eller magneter

## Keychain

Design egne nøkkelringer:

- **Tekst** — kort tekst eller initialer
- **Form** — rektangel, sirkel, oval, hjerte eller egendefinert
- **Ringhull** — automatisk hull for nøkkelring
- **Tykkelse** — juster total tykkelse
- **Flerfarget** — mulighet for fargebytte per lag (for flerfargeprintere)

## Cable Label

Generer etiketter for kabelorganisering:

- **Tekst** — kabelnavn eller identifikator
- **Festetype** — clip-on, wrap-around eller flat
- **Kabeldiameter** — tilpass til kabelstørrelse
- **Font** — velg lesbar font for liten tekst
- **Batch** — generer flere etiketter på én plate

## Image Relief

Konverter bilder til 3D-relieff:

- **Last opp bilde** — støtter JPG, PNG og BMP
- **Dybde** — juster total relieff-dybde
- **Inversjon** — bytt høyde og lavpunkt
- **Glatthet** — juster overflatens glatthet
- **Ramme** — legg til ramme rundt relieffet
- **Oppløsning** — detaljnivå basert på bildestørrelse

## Stencil

Lag sjablonger fra bilder eller tekst:

- **Last opp bilde** — automatisk konvertering til sjablongformat
- **Tekst** — alternativt, bruk tekst som sjablongmønster
- **Broer** — automatisk generering av broer for å holde flytende elementer (som bokstaven O)
- **Tykkelse** — sjablongtykkelse i mm
- **Margin** — ramme rundt sjablongen
- **Størrelse** — skaler opp eller ned

## Generelle funksjoner

Alle verktøy i Model Forge deler disse fellesfunksjonene:

- **3D-forhåndsvisning** — sanntids visning av modellen mens du justerer parametere
- **Eksportformat** — eksporter som STL eller 3MF
- **Send direkte til printer** — send generert modell rett til en tilkoblet printer
- **Legg i kø** — legg til i print-køen for senere printing
- **Lagre i biblioteket** — lagre generert modell i filbiblioteket
- **Historikk** — se tidligere genererte modeller med mulighet for å redigere og regenerere
