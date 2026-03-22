---
sidebar_position: 1
title: Print Guard
description: Automatisk overvåking med XCam-hendelsesdeteksjon, sensorovervåking og konfigurerbare handlinger ved avvik
---

# Print Guard

Print Guard er Bambu Dashboards sanntidsovervåkingssystem. Det overvåker kamera, sensorer og printerdata kontinuerlig og utfører konfigurerbare handlinger når noe er galt.

Gå til: **https://localhost:3443/#protection**

## XCam-hendelsesdeteksjon

Bambu Lab-printere sender XCam-hendelser via MQTT når AI-kameraet oppdager problemer:

| Hendelse | Kode | Alvorlighet |
|---|---|---|
| Spaghetti oppdaget | `xcam_spaghetti` | Kritisk |
| Plate-heft | `xcam_detach` | Høy |
| Malfunksjon første lag | `xcam_first_layer` | Høy |
| Stringing | `xcam_stringing` | Medium |
| Extrusion-feil | `xcam_extrusion` | Høy |

For hver hendelsestype kan du konfigurere én eller flere handlinger:

- **Varsle** — send varsel via aktive varselkanaler
- **Pause** — sett printen på pause for manuell sjekk
- **Stopp** — avbryt printen umiddelbart
- **Ingen** — ignorer hendelsen (logg den likevel)

:::danger Standardoppførsel
Som standard er XCam-hendelser satt til **Varsle** og **Pause**. Endre til **Stopp** hvis du stoler fullt på AI-deteksjonen.
:::

## Sensorovervåking

Print Guard overvåker sensordata kontinuerlig og slår alarm ved avvik:

### Temperaturavvik

1. Gå til **Print Guard → Temperatur**
2. Sett **Maks avvik fra måltemperatur** (anbefalt: ±5°C for dyse, ±3°C for seng)
3. Velg **Handling ved avvik**: Varsle / Pause / Stopp
4. Sett **Forsinkelse** (sekunder) før handling utføres — gir temperaturen tid til å stabilisere seg

### Filament lavt

Systemet beregner gjenværende filament på spolene:

1. Gå til **Print Guard → Filament**
2. Sett **Minimumsgrense** i gram (f.eks. 50 g)
3. Velg handling: **Pause og varsle** (anbefalt) for å bytte spole manuelt

### Print stopp-deteksjon

Oppdager når printen har stoppet uventet (MQTT-timeout, filamentbrudd, e.l.):

1. Aktiver **Stoppdeteksjon**
2. Sett **Timeout** (anbefalt: 120 sekunder uten data = stoppet)
3. Handling: Varsle alltid — printen kan allerede ha stoppet

## Konfigurasjon

### Aktivere Print Guard

1. Gå til **Innstillinger → Print Guard**
2. Slå på **Aktiver Print Guard**
3. Velg hvilke printere som skal overvåkes
4. Klikk **Lagre**

### Per-printer-regler

Ulike printere kan ha ulike regler:

1. Klikk på en printer i Print Guard-oversikten
2. Slå av **Arv globale regler**
3. Konfigurer egne regler for denne printeren

## Logg og hendelseshistorikk

Alle Print Guard-hendelser logges:

- Gå til **Print Guard → Logg**
- Filtrer på printer, hendelsestype, dato og alvorlighetsgrad
- Klikk på en hendelse for å se detaljert informasjon og eventuelle handlinger som ble utført
- Eksporter logg til CSV

:::tip Falske positiver
Hvis Print Guard utløser unødige pauser, juster sensitiviteten under **Print Guard → Innstillinger → Sensitivitet**. Starte med «Lav» og øk gradvis.
:::
