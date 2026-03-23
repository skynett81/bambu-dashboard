---
sidebar_position: 7
title: Specialmaterial
description: ASA, PC, PP, PVA, HIPS och andra specialmaterial för avancerade användningsområden
---

# Specialmaterial

Utöver de vanliga materialen finns det en rad specialmaterial för specifika användningsfall — från UV-beständiga utomhusdelar till vattenlösligt stödmaterial. Här är en praktisk översikt.

---

## ASA (Acrylonitrile Styrene Acrylate)

ASA är det bästa alternativet till ABS för utomhusbruk. Det skriver ut nästan identiskt med ABS, men tål solljus och väder mycket bättre.

### Inställningar

| Parameter | Värde |
|-----------|-------|
| Munstyckstemperatur | 240–260 °C |
| Bäddtemperatur | 90–110 °C |
| Kammartemperatur | 45–55 °C |
| Del-kylning | 0–20% |
| Torkning | Rekommenderas (70 °C / 4–6 t) |

### Egenskaper

- **UV-beständig:** Designad specifikt för långvarig solexponering utan att gulna eller spricka
- **Värmestabil:** Glasövergångstemperatur ~100 °C
- **Slagtålig:** Bättre slagtålighet än ABS
- **Inneslutning nödvändig:** Warpar på samma sätt som ABS — X1C/P1S ger bäst resultat

:::tip ASA istället för ABS utomhus
Ska delen leva utomhus i nordiskt klimat (sol, regn, frost)? Välj ASA framför ABS. ASA tål många år utan synlig degradering. ABS börjar spricka och gulna efter månader.
:::

### Användningsområden
- Utomhus fästen, kapslar och monteringspunkter
- Bilskyfflar-delar, antennfästen
- Trädgårdsmöbler och utomhusmiljö
- Skyltning och dispensrar på utsidan av byggnader

---

## PC (Polykarbonat)

Polykarbonat är en av de starkaste och mest slagtåliga plasterna som kan 3D-skrivas ut. Det är genomskinligt och tål extrema temperaturer.

### Inställningar

| Parameter | Värde |
|-----------|-------|
| Munstyckstemperatur | 260–310 °C |
| Bäddtemperatur | 100–120 °C |
| Kammartemperatur | 50–70 °C |
| Del-kylning | 0–20% |
| Torkning | Krävs (80 °C / 8–12 t) |

:::danger PC kräver all-metal hotend och hög temperatur
PC smälter inte vid standard PLA-temperaturer. Bambu X1C med rätt munstyckes-uppsättning hanterar PC. Kontrollera alltid att PTFE-komponenterna i hotend tål din temperatur — standard PTFE tål inte över 240–250 °C kontinuerligt.
:::

### Egenskaper

- **Mycket slagtålig:** Motståndskraftig mot brott även vid låga temperaturer
- **Transparent:** Kan användas till fönster, linser och optiska komponenter
- **Värmestabil:** Glasövergångstemperatur ~147 °C — högst av vanliga material
- **Hygroskopisk:** Absorberar fukt snabbt — torka alltid noggrant
- **Warping:** Kraftig krympning — kräver inneslutning och brim

### Användningsområden
- Säkerhetsvisir och skyddande kåpor
- Elektriska inkapslar som tål värme
- Linshållare och optiska komponenter
- Robotramar och drönarkroppar

---

## PP (Polypropen)

Polypropen är ett av de svåraste materialen att skriva ut, men ger unika egenskaper som inga andra plastmaterial kan matcha.

### Inställningar

| Parameter | Värde |
|-----------|-------|
| Munstyckstemperatur | 220–250 °C |
| Bäddtemperatur | 80–100 °C |
| Del-kylning | 20–50% |
| Torkning | Rekommenderas (70 °C / 6 t) |

### Egenskaper

- **Kemikalie-resistent:** Tål starka syror, baser, alkohol och de flesta lösningsmedel
- **Lätt och flexibel:** Låg densitet, tål upprepad böjning (levande gångjärns-effekt)
- **Låg adhesion:** Häftar dåligt mot sig självt och mot byggplattan — det är utmaningen
- **Inte giftigt:** Säkert för livsmedelskontakt (beroende på färg och tillsatser)

:::warning PP häftar dåligt mot allt
PP är ökänt för att inte häfta mot byggplattan. Använd PP-tejp (som Tesa-tejp eller dedikerad PP-tejp) på Engineering Plate, eller använd limstift speciellt formulerat för PP. Brim på 15–20 mm är nödvändigt.
:::

### Användningsområden
- Laboratorieflaskor och kemikalie-behållare
- Matlagringdelar och köksredskap
- Levande gångjärn (lock som tål tusentals öppna/stäng-cykler)
- Bilkomponenter som tål kemikalier

---

## PVA (Polyvinylalkohol) — vattenlösligt stödmaterial

PVA är ett specialmaterial som används uteslutande som stödmaterial. Det löser upp sig i vatten och lämnar en ren yta på modellen.

### Inställningar

| Parameter | Värde |
|-----------|-------|
| Munstyckstemperatur | 180–220 °C |
| Bäddtemperatur | 35–60 °C |
| Torkning | Kritiskt (55 °C / 6–8 t) |

:::danger PVA är extremt hygroskopisk
PVA absorberar fukt snabbare än något annat vanligt filament. Torka PVA noggrant INNAN utskrift, och förvara alltid i försluten låda med silikagel. Fuktig PVA fastnar i munstycket och är mycket svår att ta bort.
:::

### Användning och upplösning

1. Skriv ut modell med PVA som stödmaterial (kräver multi-material skrivare — AMS)
2. Lägg färdig utskrift i varmt vatten (30–40 °C)
3. Låt stå i 30–120 minuter, byt vatten vid behov
4. Skölj med rent vatten och låt torka

**Använd alltid dedikerad extruder för PVA** om möjligt — PVA-rester i en standard extruder kan förstöra nästa utskrift.

### Användningsområden
- Komplexa stödstrukturer som är omöjliga att ta bort manuellt
- Intern överhängsstöd utan märkbart ytavtryck
- Modeller med hålrum och inre kanaler

---

## HIPS (High Impact Polystyrene) — lösningsmedels-lösligt stödmaterial

HIPS är ett annat stödmaterial, designat för att användas med ABS. Det löser sig i **limonen** (citrus-lösningsmedel).

### Inställningar

| Parameter | Värde |
|-----------|-------|
| Munstyckstemperatur | 220–240 °C |
| Bäddtemperatur | 90–110 °C |
| Kammartemperatur | 45–55 °C |
| Torkning | Rekommenderas (65 °C / 4–6 t) |

### Användning med ABS

HIPS skriver ut vid samma temperaturer som ABS och häftar bra mot det. Efter utskrift löses HIPS upp genom att lägga utskriften i D-limonen i 30–60 minuter.

:::warning Limonen är inte vatten
D-limonen är ett lösningsmedel utvunnet ur apelsinskal. Det är relativt ofarligt, men använd ändå handskar och jobba i ventilerat rum. Kasta inte använt limonen i avloppet — lämna till återvinning.
:::

### Jämförelse: PVA vs HIPS

| Egenskap | PVA | HIPS |
|----------|-----|------|
| Lösningsmedel | Vatten | D-limonen |
| Kompatibelt material | PLA-kompatibel | ABS-kompatibel |
| Fuktkänslighet | Extremt hög | Måttlig |
| Kostnad | Hög | Måttlig |
| Tillgänglighet | God | Måttlig |

---

## PVB / Fibersmooth — etanol-utjämningsbart material

PVB (Polyvinylbutyral) är ett unikt material som kan **jämnas ut med etanol (sprit)** — på samma sätt som ABS kan jämnas ut med aceton, men mycket säkrare.

### Inställningar

| Parameter | Värde |
|-----------|-------|
| Munstyckstemperatur | 190–210 °C |
| Bäddtemperatur | 35–55 °C |
| Del-kylning | 80–100% |
| Torkning | Rekommenderas (55 °C / 4 t) |

### Etanol-smoothing

1. Skriv ut modellen med standard PVB-inställningar
2. Pensla på 99% isopropylalkohol (IPA) eller etanol med pensel
3. Låt torka i 10–15 minuter — ytan flödar jämnt ut
4. Upprepa vid behov för jämnare yta
5. Alternativt: Pensla och lägg i stängd behållare i 5 minuter för ångbehandling

:::tip Säkrare än aceton
IPA/etanol är mycket säkrare att hantera än aceton. Flampunkten är högre och ångorna är mycket mindre giftiga. God ventilation rekommenderas ändå.
:::

### Användningsområden
- Figurer och dekoration där slät yta önskas
- Prototyper som ska presenteras
- Delar som ska målas — slät yta ger bättre målning

---

## Rekommenderade byggplattor för specialmaterial

| Material | Rekommenderad platta | Limstift? |
|----------|---------------------|----------|
| ASA | Engineering Plate / High Temp Plate | Ja |
| PC | High Temp Plate | Ja (krävs) |
| PP | Engineering Plate + PP-tejp | PP-specifik tejp |
| PVA | Cool Plate / Textured PEI | Nej |
| HIPS | Engineering Plate / High Temp Plate | Ja |
| PVB | Cool Plate / Textured PEI | Nej |
