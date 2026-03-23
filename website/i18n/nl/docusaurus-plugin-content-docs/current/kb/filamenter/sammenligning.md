---
sidebar_position: 9
title: Materiaelvergelijking
description: Vergelijk alle 3D-printmaterialen naast elkaar — sterkte, temp, prijs, moeilijkheidsgraad
---

# Materiaelvergelijking

Het kiezen van het juiste filament is net zo belangrijk als het kiezen van het juiste gereedschap voor een klus. Dit artikel geeft je het volledige beeld — van een eenvoudige vergelijkingstabel tot Shore-hardheid, HDT-waarden en een praktische besluitvormingsgids.

## Grote vergelijkingstabel

| Materiaal | Sterkte | Temp-res | Flexibiliteit | UV-res | Chem. res | Nozzle-eis | Behuizing | Moeilijkheid | Prijs |
|---|---|---|---|---|---|---|---|---|---|
| PLA | ★★★ | ★ | ★ | ★ | ★ | Messing | Nee | ★ Gemakkelijk | Laag |
| PETG | ★★★ | ★★ | ★★ | ★★ | ★★★ | Messing | Nee | ★★ | Laag |
| ABS | ★★★ | ★★★ | ★★ | ★ | ★★ | Messing | JA | ★★★ | Laag |
| ASA | ★★★ | ★★★ | ★★ | ★★★★ | ★★ | Messing | JA | ★★★ | Gemiddeld |
| TPU | ★★ | ★★ | ★★★★★ | ★★ | ★★ | Messing | Nee | ★★★ | Gemiddeld |
| PA (Nylon) | ★★★★ | ★★★ | ★★★ | ★★ | ★★★★ | Messing | JA | ★★★★ | Hoog |
| PA-CF | ★★★★★ | ★★★★ | ★★ | ★★★ | ★★★★ | Gehard staal | JA | ★★★★ | Hoog |
| PC | ★★★★ | ★★★★ | ★★ | ★★ | ★★★ | Messing | JA | ★★★★ | Hoog |
| PLA-CF | ★★★★ | ★★ | ★ | ★ | ★ | Gehard staal | Nee | ★★ | Gemiddeld |

**Toelichting:**
- ★ = zwak/laag/slecht
- ★★★ = gemiddeld/standaard
- ★★★★★ = uitstekend/beste in klasse

---

## Kies het juiste materiaal — besluitvormingsgids

Niet zeker wat je moet kiezen? Volg deze vragen:

### Moet het hitte verdragen?
**Ja** → ABS, ASA, PC of PA

- Beetje hitte (tot ~90 °C): **ABS** of **ASA**
- Veel hitte (boven 100 °C): **PC** of **PA**
- Maximale temperatuurweerstand: **PC** (tot ~120 °C) of **PA-CF** (tot ~160 °C)

### Moet het flexibel zijn?
**Ja** → **TPU**

- Heel zacht (zoals rubber): TPU 85A
- Standaard flexibel: TPU 95A
- Semi-flexibel: PETG of PA

### Wordt het buiten gebruikt?
**Ja** → **ASA** is de duidelijke keuze

ASA is specifiek ontwikkeld voor UV-blootstelling en is superieur aan ABS voor buitengebruik. PETG is de op één na beste keuze als ASA niet beschikbaar is.

### Is maximale sterkte nodig?
**Ja** → **PA-CF** of **PC**

- Sterkste lichtgewicht composiet: **PA-CF**
- Sterkste pure thermoplast: **PC**
- Goede sterkte voor lagere prijs: **PA (Nylon)**

### Zo eenvoudig mogelijk printen?
→ **PLA**

PLA is het meest vergevingsgezinde materiaal dat er is. Laagste temperatuur, geen behuizingsvereisten, weinig warpingrisico.

### Voedselveilig?
→ **PLA** (met voorbehoud)

PLA is op zichzelf niet giftig, maar:
- Gebruik een roestvrijstalen nozzle (niet messing — kan lood bevatten)
- FDM-prints zijn nooit "voedselveilig" vanwege het poreuze oppervlak — bacteriën kunnen groeien
- Vermijd belastende omgevingen (zuur, warm water, vaatwasser)
- PETG is een beter alternatief voor eenmalig contact

---

## Shore-hardheid uitgelegd

Shore-hardheid wordt gebruikt om de hardheid en stijfheid van elastomeren en kunststofmaterialen te beschrijven. Voor 3D-printen is dit met name relevant voor TPU en andere flexibele filamenten.

### Shore A — flexibele materialen

De Shore A-schaal loopt van 0 (extreem zacht, bijna als gel) tot 100 (extreem hard rubber). Waarden boven 90A beginnen de rigide kunststoffen te benaderen.

| Shore A-waarde | Ervaren hardheid | Voorbeeld |
|---|---|---|
| 30A | Extreem zacht | Siliconen, gelei |
| 50A | Heel zacht | Zacht rubber, oordopjes |
| 70A | Zacht | Autoband, loopschoentussenzool |
| 85A | Medium zacht | Fietsband, zachte TPU-filamenten |
| 95A | Halfstijf | Standaard TPU-filament |
| 100A ≈ 55D | Grens tussen schalen | — |

**TPU 95A** is de industriestandaard voor 3D-printen en geeft een goede balans tussen elasticiteit en printbaarheid. **TPU 85A** is zeer zacht en vereist meer geduld tijdens het printen.

### Shore D — rigide materialen

Shore D wordt gebruikt voor hardere thermoplasten:

| Materiaal | Circa Shore D |
|---|---|
| PLA | ~80D |
| PETG | ~70D |
| ABS | ~75D |
| PC | ~80D |
| PA (Nylon) | ~70–75D |

:::tip Niet hetzelfde
Shore A 95 en Shore D 40 zijn niet hetzelfde ook al lijken de getallen dichtbij elkaar te liggen. De schalen zijn verschillend en overlappen slechts gedeeltelijk rond de 100A/55D-grens. Controleer altijd welke schaal de leverancier opgeeft.
:::

---

## Temperatuurtoleranties — HDT en VST

Weten bij welke temperatuur een materiaal begint te bezwijken is cruciaal voor functionele onderdelen. Twee standaardmetingen worden gebruikt:

- **HDT (Heat Deflection Temperature)** — de temperatuur waarbij het materiaal 0,25 mm doorbuigt onder een gestandaardiseerde belasting. Maat voor gebruikstemperatuur onder belasting.
- **VST (Vicat Softening Temperature)** — de temperatuur waarbij een gestandaardiseerde naald 1 mm in het materiaal zinkt. Maat voor het absolute verzachtingspunt zonder belasting.

| Materiaal | HDT (°C) | VST (°C) | Praktische max. temp |
|---|---|---|---|
| PLA | 52–60 | 55–65 | ~50 °C |
| PETG | 70–80 | 75–85 | ~70 °C |
| ABS | 85–105 | 95–110 | ~90 °C |
| ASA | 90–105 | 95–108 | ~90 °C |
| TPU | 40–70 | varieert | ~60 °C |
| PA (Nylon) | 70–180 | 180–220 | ~80–160 °C |
| PA-CF | 100–200 | 200–230 | ~100–180 °C |
| PC | 120–140 | 145–160 | ~120 °C |
| PLA-CF | 55–65 | 60–70 | ~55 °C |

:::warning PLA in warme omgevingen
PLA-onderdelen in een auto in de zomer is een ramp. Het dashboard in een geparkeerde auto kan 80–90 °C bereiken. Gebruik ABS, ASA of PETG voor alles wat in de zon of warmte kan komen te staan.
:::

:::info PA-varianten hebben sterk uiteenlopende eigenschappen
PA is een materialenfamilie, niet één enkel materiaal. PA6 heeft een lagere HDT (~70 °C), terwijl PA12 en PA6-CF op 160–200 °C kunnen liggen. Controleer altijd het datablad voor het specifieke filament dat je gebruikt.
:::

---

## Nozzle-eisen

### Messingen nozzle (standaard)

Werkt voor alle materialen **zonder** koolstofvezel- of glasvezelvulling:
- PLA, PETG, ABS, ASA, TPU, PA, PC, PVA
- Messing is zacht en slijt snel door abrasieve materialen

### Geharde stalen nozzle (vereist voor composieten)

**VEREIST** voor:
- PLA-CF (koolstofvezel PLA)
- PETG-CF
- PA-CF
- ABS-GF (glasvezel ABS)
- PPA-CF, PPA-GF
- Alle filamenten met "-CF", "-GF", "-HF" of "koolstofvezel" in de naam

Gehard staal heeft een lagere warmtegeleiding dan messing — compenseer met +5–10 °C op de nozzletemperatuur.

:::danger Koolstofvezelfilamenten beschadigen messingen nozzles snel
Een messingen nozzle kan merkbaar slijten na slechts enkele honderden gram CF-filament. Het resultaat is geleidelijke onder-extrusie en onnauwkeurige afmetingen. Investeer in gehard staal als je composieten print.
:::

---

## Kort materiaaloverzicht per toepassing

| Toepassing | Aanbevolen materiaal | Alternatief |
|---|---|---|
| Decoratie, figuren | PLA, PLA Silk | PETG |
| Functionele binnendelen | PETG | PLA+ |
| Buitenblootstelling | ASA | PETG |
| Flexibele onderdelen, hoesjes | TPU 95A | TPU 85A |
| Motorruimte, warme omgevingen | PA-CF, PC | ABS |
| Lichte, stijve constructie | PLA-CF | PA-CF |
| Ondersteuningsmateriaal (oplosbaar) | PVA | HIPS |
| Voedselveilig (beperkt) | PLA (roestvrijstalen nozzle) | — |
| Maximale sterkte | PA-CF | PC |
| Transparant | PETG helder | PC helder |

Zie individuele materiaalartikelen voor gedetailleerde informatie over temperatuurinstellingen, probleemoplossing en aanbevolen profielen voor Bambu Lab-printers.
