---
sidebar_position: 9
title: Materialjämförelse
description: Jämför alla 3D-utskriftsmaterial sida vid sida — styrka, temp, pris, svårighetsgrad
---

# Materialjämförelse

Att välja rätt filament är lika viktigt som att välja rätt verktyg för ett jobb. Den här artikeln ger dig hela bilden — från enkel jämförelsetabell till Shore-hårdhet, HDT-värden och en praktisk beslutsguide.

## Stor jämförelsetabell

| Material | Styrka | Temp-res | Flexibilitet | UV-res | Kemisk res | Munstycke-krav | Inneslutning | Svårighet | Pris |
|---|---|---|---|---|---|---|---|---|---|
| PLA | ★★★ | ★ | ★ | ★ | ★ | Mässing | Nej | ★ Lätt | Låg |
| PETG | ★★★ | ★★ | ★★ | ★★ | ★★★ | Mässing | Nej | ★★ | Låg |
| ABS | ★★★ | ★★★ | ★★ | ★ | ★★ | Mässing | JA | ★★★ | Låg |
| ASA | ★★★ | ★★★ | ★★ | ★★★★ | ★★ | Mässing | JA | ★★★ | Medium |
| TPU | ★★ | ★★ | ★★★★★ | ★★ | ★★ | Mässing | Nej | ★★★ | Medium |
| PA (Nylon) | ★★★★ | ★★★ | ★★★ | ★★ | ★★★★ | Mässing | JA | ★★★★ | Hög |
| PA-CF | ★★★★★ | ★★★★ | ★★ | ★★★ | ★★★★ | Härdat stål | JA | ★★★★ | Hög |
| PC | ★★★★ | ★★★★ | ★★ | ★★ | ★★★ | Mässing | JA | ★★★★ | Hög |
| PLA-CF | ★★★★ | ★★ | ★ | ★ | ★ | Härdat stål | Nej | ★★ | Medium |

**Förklaring:**
- ★ = svag/låg/dålig
- ★★★ = medel/standard
- ★★★★★ = utmärkt/bäst i klassen

---

## Välj rätt material — beslutsguide

Osäker på vad du ska välja? Följ dessa frågor:

### Behöver det tåla värme?
**Ja** → ABS, ASA, PC eller PA

- Lite värme (upp till ~90 °C): **ABS** eller **ASA**
- Mycket värme (över 100 °C): **PC** eller **PA**
- Maximal temperaturmotstånd: **PC** (upp till ~120 °C) eller **PA-CF** (upp till ~160 °C)

### Behöver det flexibilitet?
**Ja** → **TPU**

- Mycket mjuk (som gummi): TPU 85A
- Standard flexibel: TPU 95A
- Semi-flexibel: PETG eller PA

### Ska det användas utomhus?
**Ja** → **ASA** är det klara valet

ASA är utvecklat specifikt för UV-exponering och är överlägset ABS utomhus. PETG är näst bästa val om ASA inte är tillgängligt.

### Behöver det maximal styrka?
**Ja** → **PA-CF** eller **PC**

- Starkaste lättvikts-komposit: **PA-CF**
- Starkaste rena termoplast: **PC**
- God styrka till lägre pris: **PA (Nylon)**

### Enklast möjliga utskrift?
→ **PLA**

PLA är det mest förlåtande material som finns. Lägsta temperatur, inga inneslutningskrav, liten warping-risk.

### Livsmedelskontakt?
→ **PLA** (med förbehåll)

PLA är i sig inte giftigt, men:
- Använd munstycke i rostfritt stål (inte mässing — kan innehålla bly)
- FDM-utskrift är aldrig "food-safe" pga. porös yta — bakterier kan växa
- Undvik krävande miljöer (syra, varmt vatten, diskmaskin)
- PETG är ett bättre alternativ för engångskontakt

---

## Shore-hårdhet förklarad

Shore-hårdhet används för att beskriva hårdhet och styvhet hos elastomerer och plastmaterial. För 3D-utskrift är det särskilt relevant för TPU och andra flexibla filamenter.

### Shore A — flexibla material

Shore A-skalan går från 0 (extremt mjuk, nästan som gel) till 100 (extremt hård gummi). Värden över 90A börjar närma sig rigida plastmaterial.

| Shore A-värde | Upplevd hårdhet | Exempel |
|---|---|---|
| 30A | Extremt mjuk | Silikon, gelé |
| 50A | Mycket mjuk | Mjuk gummi, öronproppar |
| 70A | Mjuk | Bilslang, löpsko-mellansåle |
| 85A | Medium mjuk | Cykeldäck, mjuka TPU-filamenter |
| 95A | Halvstyvt | Standard TPU filament |
| 100A ≈ 55D | Gräns mellan skalorna | — |

**TPU 95A** är industristandarden för 3D-utskrift och ger god balans mellan elasticitet och utskrivbarhet. **TPU 85A** är mycket mjuk och kräver mer tålamod under utskrift.

### Shore D — rigida material

Shore D används för hårdare termoplaster:

| Material | Ungefärlig Shore D |
|---|---|
| PLA | ~80D |
| PETG | ~70D |
| ABS | ~75D |
| PC | ~80D |
| PA (Nylon) | ~70–75D |

:::tip Inte samma sak
Shore A 95 och Shore D 40 är inte samma sak även om siffrorna kan verka nära. Skalorna är olika och överlappar bara delvis runt 100A/55D-gränsen. Kontrollera alltid vilken skala leverantören anger.
:::

---

## Temperaturtoleranser — HDT och VST

Att veta vid vilken temperatur ett material börjar ge efter är kritiskt för funktionella delar. Två standardmätningar används:

- **HDT (Heat Deflection Temperature)** — temperaturen där materialet böjer sig 0,25 mm under en standardiserad last. Mått för användningstemperatur under belastning.
- **VST (Vicat Softening Temperature)** — temperaturen där en standardiserad nål sjunker 1 mm in i materialet. Mått för absolut mjukningspunkt utan last.

| Material | HDT (°C) | VST (°C) | Praktisk max-temp |
|---|---|---|---|
| PLA | 52–60 | 55–65 | ~50 °C |
| PETG | 70–80 | 75–85 | ~70 °C |
| ABS | 85–105 | 95–110 | ~90 °C |
| ASA | 90–105 | 95–108 | ~90 °C |
| TPU | 40–70 | varierar | ~60 °C |
| PA (Nylon) | 70–180 | 180–220 | ~80–160 °C |
| PA-CF | 100–200 | 200–230 | ~100–180 °C |
| PC | 120–140 | 145–160 | ~120 °C |
| PLA-CF | 55–65 | 60–70 | ~55 °C |

:::warning PLA i varma miljöer
PLA-delar i en bil på sommaren är ett katastrofrecept. Instrumentbrädan i en parkerad bil kan nå 80–90 °C. Använd ABS, ASA eller PETG för allt som kan stå i sol eller värme.
:::

:::info PA-varianter har mycket olika egenskaper
PA är en familj av material, inte ett enda material. PA6 har lägre HDT (~70 °C), medan PA12 och PA6-CF kan ligga på 160–200 °C. Kontrollera alltid databladet för precis det filament du använder.
:::

---

## Munstycke-krav

### Mässings-munstycke (standard)

Fungerar för alla material **utan** kolfiber eller glasfiberfyllning:
- PLA, PETG, ABS, ASA, TPU, PA, PC, PVA
- Mässing är mjukt och slits snabbt av abrasiva material

### Härdat stål-munstycke (krav för kompositer)

**KRÄVS** för:
- PLA-CF (kolfiberfylld PLA)
- PETG-CF
- PA-CF
- ABS-GF (glasfiberfylld ABS)
- PPA-CF, PPA-GF
- Alla filamenter med "-CF", "-GF", "-HF" eller "kolfiberfiber" i namnet

Härdat stål har lägre värmeledningsförmåga än mässing — kompensera med +5–10 °C på munstyckstemperatur.

:::danger Kolfiberfilamenter förstör mässings-munstycken snabbt
Ett mässings-munstycke kan bli märkbart slitet efter bara några hundra gram CF-filament. Resultatet är gradvis under-extrusion och onoggranna mått. Investera i härdat stål om du skriver ut kompositer.
:::

---

## Kort materialöversikt per användningsområde

| Användningsområde | Rekommenderat material | Alternativ |
|---|---|---|
| Dekoration, figurer | PLA, PLA Silk | PETG |
| Funktionella inomhusdelar | PETG | PLA+ |
| Utomhus exponering | ASA | PETG |
| Flexibla delar, fodral | TPU 95A | TPU 85A |
| Motorrum, varma miljöer | PA-CF, PC | ABS |
| Lätt, styvt konstruktion | PLA-CF | PA-CF |
| Stödmaterial (lösligt) | PVA | HIPS |
| Livsmedelskontakt (begränsad) | PLA (rostfritt munstycke) | — |
| Maximal styrka | PA-CF | PC |
| Transparent | PETG klar | PC klar |

Se individuella materialartiklar för detaljerad information om temperaturinställningar, felsökning och rekommenderade profiler för Bambu Lab-skrivare.
