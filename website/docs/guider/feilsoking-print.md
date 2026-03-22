---
sidebar_position: 5
title: Feilsøking av mislykket print
description: Diagnostiser og løs vanlige printfeil ved hjelp av Bambu Dashboard sine feillogger og verktøy
---

# Feilsøking av mislykket print

Noe gikk galt? Ikke fortvil — de fleste printfeil har enkle løsninger. Bambu Dashboard hjelper deg å finne årsaken raskt.

## Steg 1 — Sjekk HMS-feilkodene

HMS (Handling, Monitoring, Sensing) er Bambu Labs sitt feilsystem. Alle feil logges automatisk i dashboardet.

1. Gå til **Overvåking → Feil**
2. Finn den mislykkede printen
3. Klikk på feilkoden for detaljert beskrivelse og foreslått løsning

Vanlige HMS-koder:

| Kode | Beskrivelse | Rask løsning |
|------|-------------|--------------|
| 0700 1xxx | AMS-feil (fastkjørt, motorproblem) | Sjekk filamentbane i AMS |
| 0300 0xxx | Ekstrusjonsfeil (under/over-ekstrusion) | Rengjør dyse, sjekk filament |
| 0500 xxxx | Kalibreringsfeil | Kjør rekalibrering |
| 1200 xxxx | Temperaturavvik | Sjekk kabeltilkoblinger |
| 0C00 xxxx | Kamerafeil | Start printer på nytt |

:::tip Feilkoder i historikken
Under **Historikk → [Print] → HMS-logg** kan du se alle feilkoder som oppsto underveis — selv om printen "fullførte".
:::

## Vanlige feil og løsninger

### Dårlig heft (første lag sitter ikke fast)

**Symptomer:** Printen løsner fra platen, krøller seg opp, første lag mangler

**Årsaker og løsninger:**

| Årsak | Løsning |
|-------|---------|
| Skitne plate | Tørk av med IPA-alkohol |
| Feil platetemperatur | Øk med 5°C |
| Z-offset feil | Kjør Auto Bed Leveling på nytt |
| Mangler limstift (PETG/ABS) | Påfør tynt lag limstift |
| For rask første-lags-hastighet | Senk til 20–30 mm/s i første lag |

**Rask sjekkliste:**
1. Er platen ren? (IPA + lo-fritt tørkepapir)
2. Er du på riktig plate for filamenttypen? (se [Velge rett plate](./velge-rett-plate))
3. Er Z-kalibreringen gjort etter siste platebytte?

---

### Warping (hjørnene løfter seg)

**Symptomer:** Hjørnene bøyer seg opp fra platen, særlig på store flate modeller

**Årsaker og løsninger:**

| Årsak | Løsning |
|-------|---------|
| Temperaturforskjell | Lukk frontluken på printeren |
| Mangler brim | Aktiver brim i Bambu Studio (3–5 mm) |
| For kald plate | Øk platetemperaturen 5–10°C |
| Filament med høy krymping (ABS) | Bruk Engineering Plate + kammer >40°C |

**ABS og ASA er særlig utsatt.** Sørg alltid for:
- Frontluke lukket
- Ventilasjon minst mulig
- Engineering Plate + limstift
- Kammertemperatur 40°C+

---

### Stringing (tråder mellom deler)

**Symptomer:** Fine plastikkstrenger mellom separate deler av modellen

**Årsaker og løsninger:**

| Årsak | Løsning |
|-------|---------|
| Fuktig filament | Tørk filament 6–8 timer (60–70°C) |
| For høy dysetemperatur | Senk med 5°C |
| For lite retraksjon | Øk retraksjonslengde i Bambu Studio |
| For lav reise-hastighet | Øk travel speed til 200+ mm/s |

**Fuktighetstesten:** Hør etter poppelyder eller se etter bobler i ekstruksjonen — det tyder på fuktig filament. Bambu AMS har innebygd fuktighetsmåling; sjekk fuktigheten under **AMS-status**.

:::tip Filamenttørker
Invester i en filamenttørker (f.eks. Bambu Filament Dryer) hvis du jobber med nylon eller TPU — disse absorberer fuktighet på under 12 timer.
:::

---

### Spaghetti (printen kollapser til en klump)

**Symptomer:** Filament henger i løse tråder i luften, printen er ikke gjenkjennelig

**Årsaker og løsninger:**

| Årsak | Løsning |
|-------|---------|
| Dårlig heft tidlig → løsnet → kollapset | Se heft-seksjonen over |
| For høy hastighet | Senk hastigheten 20–30% |
| Feil støttekonfigurasjon | Aktiver støtte i Bambu Studio |
| Overhenget for bratt | Splitt modellen eller roter 45° |

**Bruk Print Guard for å stoppe spaghetti automatisk** — se neste seksjon.

---

### Underekstrusion (tynne, svake lag)

**Symptomer:** Lagene er ikke solide, hull i vegger, svak modell

**Årsaker og løsninger:**

| Årsak | Løsning |
|-------|---------|
| Dyse delvis tett | Kjør Cold Pull (se vedlikehold) |
| Filament for fuktig | Tørk filament |
| For lav temperatur | Øk dysetemperatur 5–10°C |
| For høy hastighet | Senk 20–30% |
| PTFE-rør skadet | Inspiser og skift PTFE-rør |

## Bruke Print Guard for automatisk beskyttelse

Print Guard overvåker kamerabildene med bildegiengjenkjenning og stopper printen automatisk hvis spaghetti oppdages.

**Aktivere Print Guard:**
1. Gå til **Overvåking → Print Guard**
2. Aktiver **Automatisk oppdagelse**
3. Velg aksjon: **Pause** (anbefalt) eller **Avbryt**
4. Sett sensitivitet (start med **Medium**)

**Når Print Guard griper inn:**
1. Du mottar et varsel med et kamerabilde av hva som ble oppdaget
2. Printen settes på pause
3. Du kan velge: **Fortsett** (hvis falskt positivt) eller **Avbryt print**

:::info Falskt positive
Print Guard kan av og til reagere på modeller med mange tynne søyler. Senk sensitiviteten eller deaktiver midlertidig for komplekse modeller.
:::

## Diagnostikkverktøy i dashboardet

### Temperaturlogg
Under **Historikk → [Print] → Temperaturer** kan du se temperaturkurven gjennom hele printen. Se etter:
- Plutselige temperaturfall (dyse- eller plateproblem)
- Ujevne temperaturer (kalibreringsbehov)

### Filamentstatistikk
Sjekk om forbrukt filament samsvarer med estimat. Stor avvik kan tyde på underekstrusion eller filamentbrudd.

## Når kontakte support?

Kontakt Bambu Labs support hvis:
- HMS-koden gjentar seg etter at du har fulgt alle løsningsforslag
- Du ser mekanisk skade på printeren (bøyde stenger, ødelagte tannhjul)
- Temperaturverdiene er umulige (f.eks. dyse leser -40°C)
- Firmware-oppdatering løser ikke problemet

**Nyttig å ha klart til support:**
- HMS-feilkoder fra dashboardets feillogg
- Kamerabilde av feilen
- Hvilke filament og innstillinger som ble brukt (kan eksporteres fra historikken)
- Printermodell og firmware-versjon (vises under **Innstillinger → Printer → Info**)
