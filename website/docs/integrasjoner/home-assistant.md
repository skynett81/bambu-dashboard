---
sidebar_position: 1
title: Home Assistant
description: Integrer Bambu Dashboard med Home Assistant via MQTT-oppdagelse, automatiserte enheter og automatiseringseksempler
---

# Home Assistant

Home Assistant-integrasjonen eksponerer alle Bambu Lab-printere som enheter i Home Assistant via MQTT Discovery — automatisk, uten manuell konfigurasjon av YAML.

Gå til: **https://localhost:3443/#settings** → fanen **Integrasjoner → Home Assistant**

## Forutsetninger

- Home Assistant kjørende i nettverket
- MQTT-broker (Mosquitto) installert og konfigurert i Home Assistant
- Bambu Dashboard og Home Assistant bruker samme MQTT-broker

## Aktivere MQTT Discovery

1. Gå til **Innstillinger → Integrasjoner → Home Assistant**
2. Fyll inn MQTT-broker-innstillinger (hvis ikke allerede konfigurert):
   - **Broker-adresse**: f.eks. `192.168.1.100`
   - **Port**: `1883` (eller `8883` for TLS)
   - **Brukernavn og passord**: hvis påkrevd av brokeren
3. Aktiver **MQTT Discovery**
4. Sett **Discovery-prefiks**: standard er `homeassistant`
5. Klikk **Lagre og aktiver**

Bambu Dashboard publiserer nå discovery-meldinger for alle registrerte printere.

## Enheter i Home Assistant

Etter aktivering vises en ny enhet per printer i Home Assistant (**Innstillinger → Enheter og tjenester → MQTT**):

### Entitet-ID-mønster

Entitet-IDer følger mønsteret `sensor.{printer_name_slug}_{sensor_id}`, der `printer_name_slug` er printernavnet i lowercase med spesialtegn erstattet av understrek. Eksempel: en printer med navn «Min P1S» gir `sensor.min_p1s_status`.

### Sensorer (lese)

| Sensor-ID | Enhet | Eksempel |
|---|---|---|
| `{slug}_status` | tekst | `RUNNING` |
| `{slug}_progress` | % | `47` |
| `{slug}_remaining` | min | `83` |
| `{slug}_layer` | tall | `124` |
| `{slug}_total_layers` | tall | `280` |
| `{slug}_nozzle_temp` | °C | `220.5` |
| `{slug}_nozzle_target` | °C | `220.0` |
| `{slug}_bed_temp` | °C | `60.1` |
| `{slug}_bed_target` | °C | `60.0` |
| `{slug}_chamber_temp` | °C | `34.2` |
| `{slug}_current_file` | tekst | `benchy.3mf` |
| `{slug}_speed` | % | `100` |
| `{slug}_wifi_signal` | tekst | `-65dBm` |

### Binære sensorer

| Sensor-ID | Tilstand |
|---|---|
| `{slug}_printing` | `on` / `off` |
| `{slug}_online` | `on` / `off` |

:::info Merk
Knapper (pause/resume/stopp) publiseres ikke via MQTT Discovery. Bruk Bambu Dashboard-APIet for å sende kommandoer fra automatiseringer.
:::

## Automatiseringseksempler

### Varsle på mobil når print er ferdig

Erstatt `min_p1s` med din printers navn-slug.

```yaml
automation:
  - alias: "Bambu - Print ferdig"
    trigger:
      - platform: state
        entity_id: binary_sensor.min_p1s_printing
        from: "on"
        to: "off"
    condition:
      - condition: state
        entity_id: sensor.min_p1s_status
        state: "FINISH"
    action:
      - service: notify.mobile_app_min_telefon
        data:
          title: "Print ferdig!"
          message: "{{ states('sensor.min_p1s_current_file') }} er ferdig."
```

### Slå av lys når print starter

```yaml
automation:
  - alias: "Bambu - Dimm lys under printing"
    trigger:
      - platform: state
        entity_id: binary_sensor.min_p1s_printing
        to: "on"
    action:
      - service: light.turn_on
        target:
          entity_id: light.kjeller
        data:
          brightness_pct: 30
```

## Energiovervåking

Strømmåling via Shelly eller Tasmota håndteres separat og eksponeres ikke direkte via MQTT Discovery til Home Assistant. Se [Strømmåling](./power) for oppsett av smartplugg.
