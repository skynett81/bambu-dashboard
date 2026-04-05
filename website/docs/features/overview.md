---
sidebar_position: 1
title: Funksjoner oversikt
description: Komplett oversikt over alle funksjoner i 3DPrintForge
---

# Funksjoner oversikt

3DPrintForge samler alt du trenger for å overvåke og styre alle dine 3D-printere på ett sted — Bambu Lab, PrusaLink, Snapmaker, Voron, Creality, Elegoo, AnkerMake, QIDI, RatRig og alle andre Klipper/Moonraker-printere.

## Dashboard

Hoveddashboardet viser sanntidsstatus for aktiv printer:

- **Temperatur** — animerte SVG-ringmålere for dyse og seng
- **Fremgang** — prosentvis fremgang med estimert ferdig-tid
- **Kamera** — live kameravisning (RTSPS → MPEG1 via ffmpeg)
- **AMS-panel** — visuell fremstilling av alle AMS-sporer med filamentfarge
- **Hastighets-kontroll** — skyveknapp for å justere hastighet (Stille, Standard, Sport, Turbo)
- **Statistikkpaneler** — Grafana-style paneler med rullegrafar
- **Telemetri** — live-verdier for fans, temperaturer, trykk

Panelene kan dras og slippes for å tilpasse layouten. Bruk lås-knappen for å låse layouten.

## Filamentlager

Se [Filament](./filament) for full dokumentasjon.

- Spor alle spoler med navn, farge, vekt og leverandør
- AMS-synkronisering — se hvilke spoler som sitter i AMS
- Tørkelogg og tørkeplan
- Fargekort og NFC-tagg-støtte
- Import/eksport (CSV)

## Printhistorikk

Se [Historikk](./history) for full dokumentasjon.

- Komplett logg over alle prints
- Filament-sporing per print
- Lenker til MakerWorld-modeller
- Statistikk og eksport til CSV
- 3D-forhåndsvisning med 3mfViewer (3MF) eller gcode toolpath, med mulighet for å laste opp 3MF-filer

## Planlegger

Se [Planlegger](./scheduler) for full dokumentasjon.

- Kalendervisning av prints
- Print-kø med prioritering
- Multi-printer dispatch

## Model Forge

Se [Model Forge](../tools/model-forge) for full dokumentasjon.

Model Forge er et integrert verktøysett med 8 spesialiserte 3D-generatorer:

- **Sign Maker** — lag tilpassede skilt med tekst, symboler og rammer
- **Lithophane** — konverter bilder til lithophane-modeller for bakbelysning
- **Storage Box** — generer oppbevaringsbokser med tilpassede dimensjoner
- **Text Plate** — lag tekstplater med valgfri font og størrelse
- **Keychain** — design egne nøkkelringer med tekst og former
- **Cable Label** — generer kabeletiketter for organisering
- **Image Relief** — konverter bilder til 3D-relieff
- **Stencil** — lag sjablonger fra bilder eller tekst

## Printerkontroll

Se [Kontroll](./controls) for full dokumentasjon.

- Temperaturkontroll (dyse, seng, kammer)
- Hastighetsprofilkontroll
- Vifte-kontroll
- G-code konsoll
- Filament-last/avlast
- Kalibrerings-UI (Bambu Lab og Snapmaker)
- Kamerastyring (Bambu Lab)
- AMS-tørking (Bambu Lab)
- Snapmaker-spesifikk: NFC-filament, defektdeteksjon AI, timelapse, luftrenser, strømmåler

## Varsler

3DPrintForge støtter 7 varslingskanaler:

| Kanal | Hendelser |
|-------|----------|
| Telegram | Print ferdig, feil, pause |
| Discord | Print ferdig, feil, pause |
| E-post | Print ferdig, feil |
| ntfy | Alle hendelser |
| Pushover | Alle hendelser |
| SMS (Twilio) | Kritiske feil |
| Webhook | Tilpasset payload |

Konfigurer under **Innstillinger → Varsler**.

## Print Guard

Print Guard overvåker aktiv print via kamera (xcam) og sensorer:

- Automatisk pause ved spaghetti-feil
- Konfigurerbart sensitivitetsnivå
- Logg over detekterte hendelser

## Vedlikehold

Vedlikeholdsseksjonen sporer:

- Neste anbefalt service per komponent (dyse, plater, AMS)
- Slitasjesporing basert på printhistorikk
- Manuell registrering av vedlikeholdsoppgaver

## G-code Analyzer og Toolpath Viewer

- **G-code Analyzer** — fullstendig analyse av G-code-filer med estimert printtid, filamentforbruk, lagtykkelse og materialdeteksjon
- **3D Toolpath Viewer** — interaktiv 3D-visning av G-code toolpath med per-lag farger (blå bunn → rød topp)
- Fungerer for alle printertyper (Bambu Lab, Moonraker, PrusaLink, lokale filer)

## Remote Access

Sikker fjerntilgang til dashboardet via Cloudflare Tunnel — uten port-forwarding eller eksponering av IP-adresse. Konfigurer under **Innstillinger → System → Remote Access**.

## PWA og Push-varsler

3DPrintForge kan installeres som en Progressive Web App (PWA) direkte fra nettleseren:

- Installer på mobil eller desktop for app-lignende opplevelse
- Push-varsler for print-hendelser (ferdig, feil, pause)
- Fungerer offline med cached ressurser

## Multi-printer, Multi-brand

Med flerprinter- og flermerke-støtte kan du:

- Administrere printere fra Bambu Lab, PrusaLink, Snapmaker, Voron, Creality, Elegoo, AnkerMake, QIDI, RatRig og andre
- Bytte mellom printere med printer-velgeren
- Se statusoversikt for alle printere simultant
- Fordele printjobber med print-køen

## OBS-overlay

En dedikert `obs.html`-side gir en ren overlay for OBS Studio-integrasjon under livestreaming av prints.

## Moonraker API-integrasjon

For alle Klipper/Moonraker-printere gir 3DPrintForge full tilgang til:

- **Filbehandler** — bla, last opp og slett filer direkte på printeren
- **Jobbkø** — administrer printkøen via Moonraker
- **Webkamera** — live kameravisning fra Moonraker-webcam
- **Oppdateringsbehandler** — se og installer firmware-oppdateringer
- **Spoolman** — integrasjon med Spoolman for filamentsporing

## Oppdateringer

Innebygd auto-oppdatering via GitHub Releases. Varsling og oppdatering direkte fra dashboardet under **Innstillinger → Oppdatering**.
