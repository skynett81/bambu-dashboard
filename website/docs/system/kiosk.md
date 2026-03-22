---
sidebar_position: 6
title: Kiosk-modus
description: Sett opp Bambu Dashboard som en veggmontert skjerm eller hub-visning med kiosk-modus og automatisk rotasjon
---

# Kiosk-modus

Kiosk-modus er designet for veggmonterte skjermer, TV-er eller dedikerte monitorer som kontinuerlig viser printer-status — uten tastatur, musinteraksjon eller nettleser-UI.

Gå til: **https://localhost:3443/#settings** → **System → Kiosk**

## Hva er kiosk-modus

I kiosk-modus:
- Navigasjonsmenyen er skjult
- Ingen interaktive kontroller er synlige
- Dashboardet oppdateres automatisk
- Skjermen roterer mellom printere (hvis konfigurert)
- Inaktivitets-timeout er deaktivert

## Aktivere kiosk-modus via URL

Legg til `?kiosk=true` i URL-en for å aktivere kiosk-modus uten å endre innstillingene:

```
https://localhost:3443/?kiosk=true
https://localhost:3443/#fleet?kiosk=true
```

Kiosk-modus deaktiveres ved å fjerne parameteren eller legge til `?kiosk=false`.

## Kiosk-innstillinger

1. Gå til **Innstillinger → System → Kiosk**
2. Konfigurer:

| Innstilling | Standardverdi | Beskrivelse |
|---|---|---|
| Standard visning | Flåteoversikt | Hvilken side som vises |
| Rotasjonsintervall | 30 sekunder | Tid per printer i rotasjon |
| Rotasjonsmodus | Kun aktive | Rotér kun mellom printere som er aktive |
| Tema | Mørk | Anbefalt for skjermer |
| Skriftstørrelse | Stor | Lesbar på avstand |
| Klokkeviser | Av | Vis klokke i hjørnet |

## Flåtevisning for kiosk

Flåteoversikten er optimert for kiosk:

```
https://localhost:3443/#fleet?kiosk=true&cols=3&size=large
```

Parametere for flåtevisning:
- `cols=N` — antall kolonner (1–6)
- `size=small|medium|large` — kortsstørrelse

## Enkeltprinter-rotasjon

For rotasjon mellom enkeltprintere (en printer om gangen):

```
https://localhost:3443/?kiosk=true&rotate=true&interval=20
```

- `rotate=true` — aktiver rotasjon
- `interval=N` — sekunder per printer

## Oppsett på Raspberry Pi / NUC

For dedikert kiosk-maskinvare:

### Chromium i kiosk-modus (Linux)

```bash
chromium-browser \
  --kiosk \
  --noerrdialogs \
  --disable-infobars \
  --no-first-run \
  --app="https://localhost:3443/?kiosk=true"
```

Legg inn kommandoen i autostart (`~/.config/autostart/bambu-kiosk.desktop`).

### Automatisk pålogging og oppstart

1. Konfigurer automatisk innlogging i operativsystemet
2. Lag en autostart-oppføring for Chromium
3. Deaktiver skjermsparer og energisparing:
   ```bash
   xset s off
   xset -dpms
   xset s noblank
   ```

:::tip Dedikert brukerkonto
Opprett en dedikert Bambu Dashboard-brukerkonto med **Gjest**-rolle for kiosk-enheten. Da har enheten kun lesetilgang og kan ikke endre innstillinger selv om noen får tilgang til skjermen.
:::

## Hub-innstillinger

Hub-modus viser en oversiktsside med alle printere og nøkkelstatistikk — designet for store TV-er:

```
https://localhost:3443/#hub?kiosk=true
```

Hub-visningen inkluderer:
- Printer-grid med status
- Aggregerte nøkkeltall (aktive prints, total fremgang)
- Klokke og dato
- Siste HMS-varsler
