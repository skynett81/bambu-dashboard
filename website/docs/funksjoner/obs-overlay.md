---
sidebar_position: 4
title: OBS-overlay
description: Legg til en gjennomsiktig statusoverlay for Bambu Lab-printeren din direkte i OBS Studio
---

# OBS-overlay

OBS-overlayen lar deg vise printerens sanntidsstatus direkte i OBS Studio — perfekt for livestreaming eller opptak av 3D-printing.

## Overlay-URL

Overlayen er tilgjengelig som en nettside med gjennomsiktig bakgrunn:

```
https://localhost:3443/obs-overlay?printer=PRINTER_ID
```

Erstatt `PRINTER_ID` med printerens ID (finnes under **Innstillinger → Printere**).

### Tilgjengelige parametere

| Parameter | Standardverdi | Beskrivelse |
|---|---|---|
| `printer` | første printer | Printer-ID som skal vises |
| `theme` | `dark` | `dark`, `light` eller `minimal` |
| `scale` | `1.0` | Skalering (0.5–2.0) |
| `position` | `bottom-left` | `top-left`, `top-right`, `bottom-left`, `bottom-right` |
| `opacity` | `0.9` | Gjennomsiktighet (0.0–1.0) |
| `fields` | alle | Kommaseparert liste: `progress,temp,ams,time` |
| `color` | `#00d4ff` | Aksentfarge (hex) |

**Eksempel med parametere:**
```
https://localhost:3443/obs-overlay?printer=abc123&theme=minimal&scale=1.2&position=top-right&fields=progress,time
```

## Oppsett i OBS Studio

### Steg 1: Legg til nettleser-kilde

1. Åpne OBS Studio
2. Klikk **+** under **Kilder**
3. Velg **Nettleser** (Browser Source)
4. Gi kilden et navn, f.eks. `Bambu Overlay`
5. Klikk **OK**

### Steg 2: Konfigurer nettleser-kilden

Fyll inn følgende i innstillingsdialogen:

| Felt | Verdi |
|---|---|
| URL | `https://localhost:3443/obs-overlay?printer=DIN_ID` |
| Bredde | `400` |
| Høyde | `200` |
| FPS | `30` |
| Egendefinert CSS | *(la stå tomt)* |

Huk av for:
- ✅ **Slå av kilde når ikke synlig**
- ✅ **Oppdater nettleser når scene aktiveres**

:::warning HTTPS og localhost
OBS kan advare om selvsignert sertifikat. Gå til `https://localhost:3443` i Chrome/Firefox først og godta sertifikatet. OBS bruker da samme godkjenning.
:::

### Steg 3: Gjennomsiktig bakgrunn

Overlayen er bygget med `background: transparent`. For at dette skal fungere i OBS:

1. Huk **ikke** av for **Egendefinert bakgrunnsfarge** i nettleser-kilden
2. Pass på at overlayen ikke er pakket inn i et ugjennomskinnelig element
3. Sett gjerne **Blandingsmodus** til **Normal** på kilden i OBS

:::tip Alternativ: Chroma key
Hvis gjennomsiktighet ikke fungerer, bruk filter → **Chroma Key** med grønn bakgrunn:
Legg til `&bg=green` i URL-en, og sett chroma key-filter på kilden i OBS.
:::

## Hva vises i overlayen

Standardoverlayen inneholder:

- **Fremgangsbar** med prosentverdi
- **Gjenværende tid** (estimert)
- **Dysetemperatur** og **sengtemperatur**
- **Aktivt AMS-spor** med filamentfarge og navn
- **Printermodell** og navn (kan slås av)

## Minimal modus for streaming

For en diskret overlay under streaming:

```
https://localhost:3443/obs-overlay?theme=minimal&fields=progress,time&scale=0.8&opacity=0.7
```

Dette viser kun en liten fremgangsbar med gjenværende tid i hjørnet.
