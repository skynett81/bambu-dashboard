---
sidebar_position: 1
title: Velkommen til 3DPrintForge
description: En kraftig, selvdriftet dashboard for alle dine 3D-printere
---

# Velkommen til 3DPrintForge

[![ko-fi](https://ko-fi.com/img/githubbutton_sm.svg)](https://ko-fi.com/V7V21NRKM7)

**3DPrintForge** er et selvdriftet, fullverdig kontrollpanel for alle dine 3D-printere. Det gir deg full oversikt og kontroll over printer, filamentlager, printhistorikk og mer — alt fra én nettleser-fane.

## Hva er 3DPrintForge?

3DPrintForge kobler seg til printerne dine via MQTT (Bambu Lab), PrusaLink HTTP API (Prusa MK4/Mini/XL), OctoPrint REST API (Ender 3, Prusa MK3, Anycubic, Artillery m.fl.) eller Moonraker WebSocket (Snapmaker, Voron, Creality, Elegoo, AnkerMake, QIDI, RatRig og andre Klipper-printere) over LAN. Snapmaker U1 har dyp integrasjon med NFC-filament, AI-defektdeteksjon og strømmåling. Synkroniser modeller og printhistorikk via Bambu Cloud, Snapmaker Cloud, eller hent data direkte fra printeren.

### Viktigste funksjoner

- **Live dashboard** — sanntids temperatur, fremgang, kamera, AMS-status med LIVE-indikator
- **Model Forge** — 17 innebygde 3D-verktoy: Sign Maker, Lithophane, Storage Box, Text Plate, Keychain, Cable Label, Image Relief, Stencil, NFC Filament Tag, 3MF Converter, Calibration Tools, Lattice Structure, Multi-Color, Advanced Vase, Threads & Joints, Texture Surface og 3MF Validator
- **3D modellvisning** — 3MFConsortium 3mfViewer for 3MF-filer, gcode toolpath-visning med per-lag farger, Three.js-basert rendering
- **G-code Analyzer** — fullstendig G-code-analyse med 3D toolpath-visning for alle printertyper
- **AdminLTE 4** — moderne dashboard-rammeverk med treeview-sidebar og responsivt design
- **CRM-system** — kunder, ordrer, fakturaer, bedriftsinnstillinger og printhistorikk-kobling
- **Filamentlager** — spor alle spoler med AMS-synk, EXT-spool støtte, materialinfo, plate-kompatibilitet og tørkeguide
- **Filament-tracking** — live sporing under printing med 4-nivå fallback (AMS-sensor → EXT-estimat → cloud → varighet)
- **Materialguide** — 15 materialer med temperaturer, plate-kompatibilitet, tørking, egenskaper og tips
- **Printhistorikk** — komplett logg med modellnavn, MakerWorld-lenker, filamentforbruk, kostnader og 3D-forhåndsvisning
- **Planlegger** — kalendervisning, print-kø med lastbalansering og filamentsjekk
- **Printerkontroll** — temperatur, hastighet, vifter, G-code konsoll, kalibrering og kamerastyring
- **Print Guard** — automatisk beskyttelse med xcam + 5 sensormonitorer
- **Kostnadsestimator** — material, strøm, arbeid, slitasje, markup, filamentbytte-tid og salgsprisforslag
- **Vedlikehold** — sporing med KB-baserte intervaller, dyselevetid, plate-levetid og guide
- **Lydvarsler** — 9 konfigurerbare events med custom lyd-upload og printerhøyttaler (M300)
- **Aktivitetslogg** — persistent tidslinje fra alle hendelser (prints, feil, vedlikehold, filament)
- **AMS fuktighet/temperatur** — 5-nivå vurdering med anbefalinger for optimal oppbevaring
- **Achievements** — 18 verdens landemerker som milepæler for filamentforbruk med XP-progresjon
- **Varsler** — 7 kanaler (Telegram, Discord, e-post, ntfy, Pushover, SMS, webhook)
- **Multi-printer, multi-brand** — Bambu Lab (MQTT), PrusaLink, OctoPrint, Creality, Elegoo, AnkerMake, Voron, RatRig, QIDI, Snapmaker og alle Klipper/Moonraker-printere
- **Snapmaker dyp integrasjon** — NFC-filament, defektdeteksjon AI, timelapse, kalibrering, luftrenser og strommaler
- **Printer-capabilities** — per-merke konfigurasjon for filtilgang, kamera og funksjoner
- **Filbibliotek** — 3MF/STL/gcode-bibliotek med thumbnails, kategorier, tags, 3D-forhandsvisning, Send to Printer og Add to Queue
- **Remote Access** — Cloudflare Tunnel for sikker fjerntilgang uten port-forwarding
- **PWA** — installerbar webapp med push-varsler
- **Engelsk UI** — hele applikasjonen pa engelsk, dokumentasjon tilgjengelig pa norsk og engelsk
- **Selvdriftet** — ingen sky-avhengighet, dine data pa din maskin

### Nytt i v1.1.17

- **Model Forge utvidet til 17 verktøy** — 6 nye: Lattice Structure, Multi-Color, Advanced Vase, Threads & Joints, Texture Surface, 3MF Validator
- **16 sikkerhetsforbedringer** — CIS/NIS2-kompatibel: command injection fix, SSRF-guard, kamera WS-auth, TOFU cert pinning, plugin-integritet, session-invalidering, TOTP rate limiting, CSP-hardening
- **Forbedret 3D-viewer** — layer scrubber, parts panel med synlighetstoggle, materials panel
- **Server management** — restart server, clear cache og unregister service worker fra Settings
- **Color matcher** — match 3MF-farger mot filamentlager med CIE76 Delta-E
- **i18n-kvalitet** — 7 duplikatnøkler merget (266 nøkler gjenopprettet), 77+ norske strenger erstattet

### Nytt i v1.1.16

- **Model Forge** — 11 verktøy: Sign Maker, Lithophane, Storage Box, Text Plate, Keychain, Cable Label, Image Relief, Stencil, NFC Filament Tag, 3MF Converter, Calibration Tools
- **Multi-brand** — PrusaLink (Prusa MK4/Mini/XL), Creality, Elegoo, AnkerMake, Voron, RatRig, QIDI via Moonraker
- **Snapmaker U1 dyp integrasjon** — NFC-filament, defektdeteksjon AI, timelapse, printkonfigurasjon, kalibrering, luftrenser og strømmåler. SACP-protokoll for eldre modeller
- **Bambu Lab forbedringer** — 40+ MQTT-kommandoer, kalibrerings-UI, kamerastyring, AMS-tørking og HMS-feilsystem
- **Moonraker API** — filbehandler, jobbkø, webkamera, oppdateringsbehandler og Spoolman-integrasjon
- **Remote Access** — Cloudflare Tunnel under Innstillinger → System → Remote Access
- **Library forbedringer** — Send to Printer og Add to Queue-knapper rett fra filbiblioteket
- **G-code** — fullstendig Analyzer + 3D toolpath-visning
- **PWA** — installerbar webapp med push-varsler

### Nytt i v1.1.15

- **3MF Consortium-integrasjon** — lib3mf WASM for spec-kompatibel 3MF-parsing, 3mfViewer embed for full 3D-visning
- **Gcode toolpath-viewer** — per-lag fargevisualisering for alle Moonraker/Klipper-printere
- **Three.js EnhancedViewer** — smooth shading, orbit controls, clipping planes for print-progress
- **Universell 3D-forhåndsvisning** — fungerer for alle printertyper (Bambu FTPS, Moonraker HTTP, lokale filer)
- **Printer-capabilities** — per-merke/modell konfigurasjon (Bambu Lab, Snapmaker, Voron, Creality etc.)
- **History 3MF-linking** — last opp, erstatt og slett 3MF-filer koblet til printhistorikk
- **Auto 3MF-caching** — lagrer modellnavn og metadata fra Bambu-printer ved print-start
- **3D-knapper overalt** — history, library, kø, planlegger og galleri

### Nytt i v1.1.14

- **AdminLTE 4-integrasjon** — komplett HTML-restrukturering med treeview-sidebar, moderne layout og CSP-støtte for CDN
- **CRM-system** — full kundebehandling med 4 paneler: kunder, ordrer, fakturaer og bedriftsinnstillinger med historikk-integrasjon
- **Moderne UI** — teal aksent, gradient titler, hover glow, floating orbs og forbedret mørkt tema
- **Achievements: 18 landemerker** — vikingskip, Frihetsgudinnen, Eiffeltårnet, Big Ben, Brandenburger Tor, Sagrada Família, Colosseum, Tokyo Tower, Gyeongbokgung, nederlandsk vindmølle, Wawel-dragen, Cristo Redentor, Turning Torso, Hagia Sophia, Moderlandet, Den kinesiske mur, Praha orloj, Budapest parlament — med detalj-popup, XP og rarity
- **AMS fuktighet/temperatur** — 5-nivå vurdering med anbefalinger for oppbevaring og tørking
- **Live filament-tracking** — sanntids oppdatering under printing via cloud estimate fallback
- **Komplett i18n** — alle nøkler oversatt, nå English-only UI med norsk dokumentasjon

## Hurtigstart

| Oppgave | Lenke |
|---------|-------|
| Installer dashboardet | [Installasjon](./getting-started/installation) |
| Konfigurer første printer | [Oppsett](./getting-started/setup) |
| Koble til Bambu Cloud | [Bambu Cloud](./getting-started/bambu-cloud) |
| Utforsk alle funksjoner | [Funksjoner](./features/overview) |
| Filamentguide | [Materialguide](./kb/filaments/guide) |
| Vedlikeholdsguide | [Vedlikehold](./kb/maintenance/nozzle) |
| API-dokumentasjon | [API](./advanced/api) |

:::tip Demo-modus
Du kan prøve dashboardet uten en fysisk printer ved å kjøre `npm run demo`. Dette starter 3 simulerte printere med live print-sykluser.
:::

## Støttede printere

### Bambu Lab (via MQTT)
- **X1-serien**: X1C, X1C Combo, X1E
- **P1-serien**: P1S, P1S Combo, P1P
- **P2-serien**: P2S, P2S Combo
- **A-serien**: A1, A1 Combo, A1 mini
- **H2-serien**: H2S, H2D (dobbel dyse), H2C (verktøybytter, 6 hoder)

### PrusaLink (via HTTP API)
- **Prusa MK4**, MK4S, MK3.9, MK3.5
- **Prusa Mini**, Mini+
- **Prusa XL** (multi-verktøy)

### OctoPrint (via HTTP REST API)
- **Ender 3**: alle varianter (Pro, V2, S1, Neo)
- **Prusa MK3**: i3 MK3S+ med OctoPrint
- **Anycubic**: Mega, Kobra, Vyper
- **Artillery**: Sidewinder, Genius
- **Alle andre** printere med OctoPrint på Raspberry Pi

### Klipper/Moonraker-printere (via WebSocket + REST API)
- **Snapmaker**: U1 (opptil 4 verktøyhoder, NFC-filament, AI defektdeteksjon), J1, A350T, A250T. SACP-støtte for eldre modeller
- **Voron**: V0, Trident, V2.4
- **Creality**: K1, K1 Max, K2 Plus (med Klipper-firmware)
- **Elegoo**: Alle Klipper-baserte modeller via Moonraker
- **AnkerMake**: Via Moonraker-integrasjon
- **Sovol**: SV06, SV07, SV08
- **QIDI**: X-Max 3, X-Plus 3, Q1 Pro
- **RatRig**: V-Core, V-Minion
- **Alle andre** Klipper + Moonraker-baserte printere

## 3D-modellvisning

3DPrintForge integrerer 3MF Consortium sine offisielle verktøy for 3D-modellvisning:

### 3MF-filer (Library og History)
- **3mfViewer** fra [3MFConsortium](https://github.com/3MFConsortium/3mfViewer) — full 3D-viewer med scene tree, materialer, wireframe og farger
- **lib3mf WASM** for spec-kompatibel parsing av metadata, thumbnails og mesh-data
- Last opp 3MF-filer direkte til printhistorikk for 3D-visning

### Gcode toolpath (Moonraker og Bambu)
- Per-lag fargevisualisering (blå bunn → rød topp)
- Automatisk nedlasting fra Moonraker HTTP API eller Bambu FTPS
- Downsampling for store filer (maks 100k segmenter)

### Printer-spesifikk tilgang
| Printertype | 3MF-tilgang | Gcode-tilgang |
|-------------|-------------|---------------|
| Bambu Lab | FTPS (port 990) | Innebygd i gcode.3mf |
| Moonraker/Klipper | Ikke på printer | HTTP API `/server/files/gcodes/` |
| Library-filer | Lokal disk | N/A |

## Teknisk oversikt

3DPrintForge er bygget med Node.js 22 og vanilla HTML/CSS/JS — ingen tunge rammeverk, ingen build-steg. Databasen er SQLite, innebygd i Node.js 22.

- **Backend**: Node.js 22 med 9 npm-pakker (mqtt, ws, basic-ftp, admin-lte, bootstrap, ssh2, qrcode, @3mfconsortium/lib3mf, @snapmaker/snapmaker-sacp-sdk)
- **Frontend**: AdminLTE 4 + vanilla HTML/CSS/JS + Three.js (vendored) + 3mfViewer (embedded), ingen build-steg
- **Database**: SQLite (innebygd i Node.js 22)
- **3D-visning**: Three.js r183 + 3MFConsortium 3mfViewer + lib3mf WASM
- **PWA**: Installerbar webapp med push-varsler for print-hendelser
- **Dokumentasjon**: Docusaurus med engelsk og norsk, automatisk bygget ved installasjon
- **API**: 590+ endepunkter, OpenAPI-dokumentasjon på `/api/docs`

Se [Arkitektur](./advanced/architecture) for detaljer.
