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

### Sensorer (lese)

| Entitet | Enhet | Eksempel |
|---|---|---|
| `sensor.printer_nozzle_temp` | °C | `220.5` |
| `sensor.printer_bed_temp` | °C | `60.1` |
| `sensor.printer_chamber_temp` | °C | `34.2` |
| `sensor.printer_progress` | % | `47` |
| `sensor.printer_remaining_time` | min | `83` |
| `sensor.printer_filament_used` | g | `23.4` |
| `sensor.printer_status` | tekst | `printing` |
| `sensor.printer_current_file` | tekst | `benchy.3mf` |
| `sensor.printer_layer` | tekst | `124 / 280` |

### Binære sensorer

| Entitet | Tilstand |
|---|---|
| `binary_sensor.printer_printing` | `on` / `off` |
| `binary_sensor.printer_error` | `on` / `off` |
| `binary_sensor.printer_door_open` | `on` / `off` (X1C) |

### Knapper (handlinger)

| Entitet | Handling |
|---|---|
| `button.printer_pause` | Pause pågående print |
| `button.printer_resume` | Gjenoppta pauset print |
| `button.printer_stop` | Stopp pågående print |

:::danger Stoppeknapp
Stoppe-knappen i Home Assistant avbryter printen uten bekreftelsesdialog. Bruk med forsiktighet i automatiseringer.
:::

## Automatiseringseksempler

### Varsle på mobil når print er ferdig

```yaml
automation:
  - alias: "Bambu - Print ferdig"
    trigger:
      - platform: state
        entity_id: binary_sensor.printer_printing
        from: "on"
        to: "off"
    condition:
      - condition: state
        entity_id: sensor.printer_status
        state: "finish"
    action:
      - service: notify.mobile_app_min_telefon
        data:
          title: "Print ferdig!"
          message: "{{ states('sensor.printer_current_file') }} er ferdig."
```

### Slå av lys når print starter

```yaml
automation:
  - alias: "Bambu - Dimm lys under printing"
    trigger:
      - platform: state
        entity_id: binary_sensor.printer_printing
        to: "on"
    action:
      - service: light.turn_on
        target:
          entity_id: light.kjeller
        data:
          brightness_pct: 30
```

## Energiovervåking

Kombinert med [Strømmåling](./power) eksponeres også:

- `sensor.printer_power_watts` — øyeblikkelig effekt
- `sensor.printer_energy_kwh` — energiforbruk for pågående print

Se [Strømmåling](./power) for oppsett av smartplugg.
