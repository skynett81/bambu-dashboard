---
sidebar_position: 1
title: Din første print
description: Steg-for-steg guide for å starte din første 3D-print og overvåke den i 3DPrintForge
---

# Din første print

Denne guiden tar deg gjennom hele prosessen — fra en tilkoblet printer til en ferdig print — med 3DPrintForge som kontrollsenter.

## Steg 1 — Sjekk at printeren er tilkoblet

Når du åpner dashboardet, ser du statuskortet for printeren din øverst i sidefeltet eller på oversiktspanelet.

**Grønn status** betyr at printeren er online og klar.

| Status | Farge | Betydning |
|--------|-------|-----------|
| Online | Grønn | Klar for print |
| Inaktiv | Grå | Tilkoblet, men ikke aktiv |
| Printer | Blå | Print pågår |
| Feil | Rød | Krever oppmerksomhet |

Hvis printeren viser rød status:
1. Sjekk at printeren er skrudd på
2. Verifiser at den er koblet til samme nettverk som dashboardet
3. Gå til **Innstillinger → Printere** og bekreft IP-adresse og tilgangskode

:::tip Bruk LAN-modus for raskere respons
LAN-modus gir lavere forsinkelse enn sky-modus. Aktiver det under printerinnstillinger hvis printeren og dashboardet er på samme nettverk.
:::

## Steg 2 — Last opp modellen din

3DPrintForge starter ikke prints direkte — det er Bambu Studio eller MakerWorld sin jobb. Dashboardet tar over så snart printen begynner.

**Via Bambu Studio:**
1. Åpne Bambu Studio på PC-en din
2. Importer eller åpne din `.stl`- eller `.3mf`-fil
3. Skiver modellen (velg filament, støtte, infill osv.)
4. Klikk **Print** øverst til høyre

**Via MakerWorld:**
1. Finn modellen på [makerworld.com](https://makerworld.com)
2. Klikk **Print** direkte fra nettstedet
3. Bambu Studio åpnes automatisk med modellen klar

## Steg 3 — Start printen

I Bambu Studio velger du sendemetode:

| Metode | Krav | Fordeler |
|--------|------|----------|
| **Cloud** | Bambu-konto + internett | Fungerer overalt |
| **LAN** | Samme nettverk | Raskere, ingen sky |
| **SD-kort** | Fysisk tilgang | Ingen nettverkskrav |

Klikk **Send** — printeren mottar jobben og begynner oppvarmingsfasen automatisk.

:::info Printen dukker opp i dashboardet
Innen få sekunder etter at Bambu Studio sender jobben, vises den aktive printen i dashboardet under **Aktiv print**.
:::

## Steg 4 — Overvåk i dashboardet

Når printen er i gang, gir dashboardet deg full oversikt:

### Fremdrift
- Prosent ferdig og estimert tid igjen vises på printerkortet
- Klikk på kortet for detaljvisning med laginfo

### Temperaturer
Detaljpanelet viser sanntidstemperaturer:
- **Dyse** — aktuell og måltemperatur
- **Buildplate** — aktuell og måltemperatur
- **Kammer** — romtemperatur inne i printeren (viktig for ABS/ASA)

### Kamera
Klikk på kameraikonet på printerkortet for å se live-feed direkte i dashboardet. Du kan ha kameraet åpent i et eget vindu mens du gjør andre ting.

:::warning Sjekk de første lagene
De første 3–5 lagene er kritiske. Dårlig heft nå betyr mislykket print senere. Se kameraet og verifiser at filamentet legger seg pent og jevnt.
:::

### 3D-modellvisning
- **3D-modellvisning** — se en interaktiv 3D-forhåndsvisning av modellen under printing

### Print Guard
3DPrintForge har en AI-drevet **Print Guard** som automatisk oppdager spaghetti-feil og kan pause printen. Aktiver dette under **Overvåking → Print Guard**.

## Steg 5 — Etter printen er ferdig

Når printen er ferdig, viser dashboardet en fullført-melding (og sender varsel hvis du har satt opp [varsler](./notification-setup)).

### Sjekk historikken
Gå til **Historikk** i sidefeltet for å se den fullførte printen:
- Total printtid
- Filamentforbruk (gram brukt, estimert kostnad)
- Feil eller HMS-hendelser under printen
- Kamerabilde fra avslutning (hvis aktivert)

### Logg et notat
Klikk på printen i historikken og legg til et notat — f.eks. "Trengtes litt mer brim" eller "Perfekt resultat". Dette er nyttig når du later printer samme modell igjen.

### Sjekk filamentforbruket
Under **Filament** kan du se at spolevekten er oppdatert basert på hva som ble brukt. Dashboardet trekker fra automatisk.

## Tips for nybegynnere

:::tip Ikke forlat første print
Følg med på de første 10–15 minuttene. Når du er trygg på at printen fester seg godt, kan du la dashboardet overvåke resten.
:::

- **Vei tomme spoler** — legg inn startvekt på spoler for nøyaktig restberegning (se [Filamentlager](./filament-setup))
- **Sett opp Telegram-varsel** — få beskjed når printen er ferdig uten å sitte og vente (se [Varsler](./notification-setup))
- **Sjekk byggplaten** — ren plate = bedre heft. Tørk av med IPA (isopropanol) mellom prints
- **Bruk riktig plate** — se [Velge rett byggplate](./choosing-plate) for hva som passer ditt filament
