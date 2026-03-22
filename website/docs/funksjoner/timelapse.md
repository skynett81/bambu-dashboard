---
sidebar_position: 7
title: Timelapse
description: Aktiver automatisk timelapse-opptak av 3D-prints, administrer videoer og spill dem av direkte i dashboardet
---

# Timelapse

Bambu Dashboard kan automatisk ta bilder under printing og sette dem sammen til en timelapse-video. Videoene lagres lokalt og kan spilles av direkte i dashboardet.

Gå til: **https://localhost:3443/#timelapse**

## Aktivering

1. Gå til **Innstillinger → Timelapse**
2. Slå på **Aktiver timelapse-opptak**
3. Velg **Opptaksmodus**:
   - **Per lag** — ett bilde per lag (anbefalt for høy kvalitet)
   - **Tidsbasert** — ett bilde hvert N sekund (f.eks. hvert 30. sekund)
4. Velg hvilke printere som skal ha timelapse aktivert
5. Klikk **Lagre**

:::tip Bildeintervall
«Per lag» gir jevnest animasjon fordi bevegelsen er konsistent. «Tidsbasert» bruker mindre lagringsplass.
:::

## Opptaksinnstillinger

| Innstilling | Standardverdi | Beskrivelse |
|---|---|---|
| Oppløsning | 1280×720 | Bildestørrelse (640×480 / 1280×720 / 1920×1080) |
| Bildekvalitet | 85 % | JPEG-komprimeringskvalitet |
| FPS i video | 30 | Bilder per sekund i ferdig video |
| Videoformat | MP4 (H.264) | Utgående format |
| Roter bilde | Av | Roter 90°/180°/270° for monteringsretning |

:::warning Lagringsplass
Et timelapse med 500 bilder i 1080p bruker ca. 200–400 MB før sammenslåing. Ferdig MP4-video er typisk 20–80 MB.
:::

## Lagring

Timelapse-bilder og videoer lagres i `data/timelapse/` under prosjektmappen. Strukturen organiseres per printer og print:

```
data/timelapse/
├── <printer-id>/                     ← Unik printer-ID
│   ├── 2026-03-22_modellnavn/        ← Print-sesjon (dato_modellnavn)
│   │   ├── frame_0001.jpg
│   │   ├── frame_0002.jpg
│   │   ├── frame_0003.jpg
│   │   └── ...                       ← Råbilder (slettes etter sammenslåing)
│   ├── 2026-03-22_modellnavn.mp4     ← Ferdig timelapse-video
│   ├── 2026-03-20_3dbenchy.mp4
│   └── 2026-03-15_telefonstativ.mp4
├── <printer-id-2>/                   ← Flere printere (ved multi-printer)
│   └── ...
```

:::tip Ekstern lagring
For å spare plass på systemdisken kan du symlinke timelapse-mappen til en ekstern disk:
```bash
# Eksempel: flytt til en ekstern disk montert på /mnt/storage
mv data/timelapse /mnt/storage/timelapse

# Opprett symlink tilbake
ln -s /mnt/storage/timelapse data/timelapse
```
Dashboardet følger symlinken automatisk. Du kan bruke hvilken som helst disk eller nettverksshare.
:::

## Automatisk sammenslåing

Når printen er ferdig, settes bildene automatisk sammen til en video med ffmpeg:

1. Bambu Dashboard mottar «print complete»-hendelse fra MQTT
2. ffmpeg kalles med de innsamlede bildene
3. Videoen lagres i lagringsmappen
4. Timelapse-siden oppdateres med den nye videoen

Du kan se fremdriften under **Timelapse → Behandler**-fanen.

## Avspilling

1. Gå til **https://localhost:3443/#timelapse**
2. Velg en printer fra nedtrekkslisten
3. Klikk på en video i listen for å spille den av
4. Bruk avspillingskontrollene:
   - ▶ / ⏸ — Spill av / Pause
   - ⏪ / ⏩ — Spol tilbake / frem
   - Hastighetsknapper: 0.5× / 1× / 2× / 4×
5. Klikk **Fullskjerm** for å åpne i fullskjerm
6. Klikk **Last ned** for å laste ned MP4-filen

## Slette timelapse

1. Velg videoen i listen
2. Klikk **Slett** (søppelbøtte-ikon)
3. Bekreft i dialogboksen

:::danger Permanent sletting
Slettede timelapse-videoer og råbilder kan ikke gjenopprettes. Last ned videoen først hvis du ønsker å beholde den.
:::

## Dele timelapse

Timelapse-videoer kan deles via en tidsbegrenset lenke:

1. Velg videoen og klikk **Del**
2. Sett utløpstid (1 time / 24 timer / 7 dager / ingen utløp)
3. Kopier den genererte lenken og del den
4. Mottakeren trenger ikke å logge inn for å se videoen
