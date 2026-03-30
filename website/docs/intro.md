---
sidebar_position: 1
title: Velkommen til Bambu Dashboard
description: En kraftig, selvdriftet dashboard for Bambu Lab 3D-printere
---

# Velkommen til Bambu Dashboard

[![ko-fi](https://ko-fi.com/img/githubbutton_sm.svg)](https://ko-fi.com/V7V21NRKM7)

**Bambu Dashboard** er et selvdriftet, fullverdig kontrollpanel for Bambu Lab 3D-printere. Det gir deg full oversikt og kontroll over printer, filamentlager, printhistorikk og mer — alt fra én nettleser-fane.

## Hva er Bambu Dashboard?

Bambu Dashboard kobler seg direkte til printeren din via MQTT over LAN, uten avhengighet av Bambu Lab sine servere. Du kan også koble til Bambu Cloud for synkronisering av modeller og printhistorikk.

### Viktigste funksjoner

- **Live dashboard** — sanntids temperatur, fremgang, kamera, AMS-status med LIVE-indikator
- **AdminLTE 4** — moderne dashboard-rammeverk med treeview-sidebar og responsivt design
- **CRM-system** — kunder, ordrer, fakturaer, bedriftsinnstillinger og printhistorikk-kobling
- **Filamentlager** — spor alle spoler med AMS-synk, EXT-spool støtte, materialinfo, plate-kompatibilitet og tørkeguide
- **Filament-tracking** — live sporing under printing med 4-nivå fallback (AMS-sensor → EXT-estimat → cloud → varighet)
- **Materialguide** — 15 materialer med temperaturer, plate-kompatibilitet, tørking, egenskaper og tips
- **Printhistorikk** — komplett logg med modellnavn, MakerWorld-lenker, filamentforbruk og kostnader
- **Planlegger** — kalendervisning, print-kø med lastbalansering og filamentsjekk
- **Printerkontroll** — temperatur, hastighet, vifter, G-code konsoll
- **Print Guard** — automatisk beskyttelse med xcam + 5 sensormonitorer
- **Kostnadsestimator** — material, strøm, arbeid, slitasje, markup, filamentbytte-tid og salgsprisforslag
- **Vedlikehold** — sporing med KB-baserte intervaller, dyselevetid, plate-levetid og guide
- **Lydvarsler** — 9 konfigurerbare events med custom lyd-upload og printerhøyttaler (M300)
- **Aktivitetslogg** — persistent tidslinje fra alle hendelser (prints, feil, vedlikehold, filament)
- **AMS fuktighet/temperatur** — 5-nivå vurdering med anbefalinger for optimal oppbevaring
- **Achievements** — 18 verdens landemerker som milepæler for filamentforbruk med XP-progresjon
- **Varsler** — 7 kanaler (Telegram, Discord, e-post, ntfy, Pushover, SMS, webhook)
- **Multi-printer** — støtter hele Bambu Lab-serien
- **17 språk** — norsk, engelsk, tysk, fransk, spansk, italiensk, japansk, koreansk, nederlandsk, polsk, portugisisk, svensk, tyrkisk, ukrainsk, kinesisk, tsjekkisk, ungarsk
- **Selvdriftet** — ingen sky-avhengighet, dine data på din maskin

### Nytt i v1.1.14

- **AdminLTE 4-integrasjon** — komplett HTML-restrukturering med treeview-sidebar, moderne layout og CSP-støtte for CDN
- **CRM-system** — full kundebehandling med 4 paneler: kunder, ordrer, fakturaer og bedriftsinnstillinger med historikk-integrasjon
- **Moderne UI** — teal aksent, gradient titler, hover glow, floating orbs og forbedret mørkt tema
- **Achievements: 18 landemerker** — vikingskip, Frihetsgudinnen, Eiffeltårnet, Big Ben, Brandenburger Tor, Sagrada Família, Colosseum, Tokyo Tower, Gyeongbokgung, nederlandsk vindmølle, Wawel-dragen, Cristo Redentor, Turning Torso, Hagia Sophia, Moderlandet, Den kinesiske mur, Praha orloj, Budapest parlament — med detalj-popup, XP og rarity
- **AMS fuktighet/temperatur** — 5-nivå vurdering med anbefalinger for oppbevaring og tørking
- **Live filament-tracking** — sanntids oppdatering under printing via cloud estimate fallback
- **Filament-seksjon redesign** — store spoler med full info (brand, vekt, temp, RFID, farge), horisontal layout og klikk-for-detaljer
- **EXT spool inline** — ekstern spool vist sammen med AMS-spoler med bedre plassbruk
- **Dashboard-layout optimalisert** — 2-kolonne standard for 24–27" skjermer, stor 3D/kamera, kompakt filament/AMS
- **Filamentbytte-tid** i kostnadsestimator med synlig bytte-teller
- **Global varselsystem** — alert bar med toast-varsler i bottom-right, blokkerer ikke navbar
- **Guided tour i18n** — alle 14 tour-nøkler oversatt til 17 språk
- **5 nye KB-sider** — kompatibilitetsmatrise og nye filamentguider oversatt til 17 språk
- **Komplett i18n** — alle 3252 nøkler oversatt til 17 språk inkludert CRM og landemerke-achievements

## Hurtigstart

| Oppgave | Lenke |
|---------|-------|
| Installer dashboardet | [Installasjon](./kom-i-gang/installasjon) |
| Konfigurer første printer | [Oppsett](./kom-i-gang/oppsett) |
| Koble til Bambu Cloud | [Bambu Cloud](./kom-i-gang/bambu-cloud) |
| Utforsk alle funksjoner | [Funksjoner](./funksjoner/oversikt) |
| Filamentguide | [Materialguide](./kb/filamenter/guide) |
| Vedlikeholdsguide | [Vedlikehold](./kb/vedlikehold/dyse) |
| API-dokumentasjon | [API](./avansert/api) |

:::tip Demo-modus
Du kan prøve dashboardet uten en fysisk printer ved å kjøre `npm run demo`. Dette starter 3 simulerte printere med live print-sykluser.
:::

## Støttede printere

Alle Bambu Lab-printere med LAN-modus:

- **X1-serien**: X1C, X1C Combo, X1E
- **P1-serien**: P1S, P1S Combo, P1P
- **P2-serien**: P2S, P2S Combo
- **A-serien**: A1, A1 Combo, A1 mini
- **H2-serien**: H2S, H2D (dobbel dyse), H2C (verktøybytter, 6 hoder)

## Funksjoner i detalj

### Filament-tracking

Dashboard tracker filamentforbruk automatisk med 4-nivå fallback:

1. **AMS-sensor diff** — mest nøyaktig, sammenligner start/slutt remain%
2. **EXT direkte** — for P2S/A1 uten vt_tray, bruker cloud-estimat
3. **Cloud estimat** — fra Bambu Cloud printjobb-data
4. **Varighet-estimat** — ~30g/time som siste fallback

Alle verdier vises som minimum av AMS-sensor og spoldatabase for å unngå feil etter mislykkede prints.

### Materialguide

Innebygd database med 15 materialer inkludert:
- Temperaturer (dyse, seng, kammer)
- Plate-kompatibilitet (Cool, Engineering, High Temp, Textured PEI)
- Tørkeinformasjon (temperatur, tid, hygroskopisitet)
- 8 egenskaper (styrke, fleksibilitet, varmeresistens, UV, overflate, brukervennlighet)
- Vanskelighetsgrad og spesielle krav (herdet dyse, enclosure)

### Lydvarsler

9 konfigurerbare events med støtte for:
- **Custom lydklipp** — last opp MP3/OGG/WAV (maks 10 sekunder, 500 KB)
- **Innebygde toner** — metallic/synth-lyder generert med Web Audio API
- **Printerhøyttaler** — M300 G-code melodier direkte på printerens buzzer
- **Countdown** — lydalarm når det er 1 minutt igjen av printen

### Vedlikehold

Komplett vedlikeholdssystem med:
- Komponentsporing (dyse, PTFE-rør, stenger, leiere, AMS, plate, tørking)
- KB-baserte intervaller fra dokumentasjonen
- Dyselevetid per type (messing, herdet stål, HS01)
- Platelevetid per type (Cool, Engineering, High Temp, Textured PEI)
- Guide-fane med tips og lenker til full dokumentasjon

## Teknisk oversikt

Bambu Dashboard er bygget med Node.js 22 og vanilla HTML/CSS/JS — ingen tunge rammeverk, ingen build-steg. Databasen er SQLite, innebygd i Node.js 22.

- **Backend**: Node.js 22 med kun 3 npm-pakker (mqtt, ws, basic-ftp)
- **Frontend**: AdminLTE 4 + vanilla HTML/CSS/JS, ingen build-steg
- **Database**: SQLite via Node.js 22 built-in `--experimental-sqlite`
- **Dokumentasjon**: Docusaurus med 17 språk, automatisk bygget ved installasjon
- **API**: 177+ endepunkter, OpenAPI-dokumentasjon på `/api/docs`

Se [Arkitektur](./avansert/arkitektur) for detaljer.
