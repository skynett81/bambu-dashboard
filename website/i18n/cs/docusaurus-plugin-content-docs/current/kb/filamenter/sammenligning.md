---
sidebar_position: 9
title: Srovnání materiálů
description: Porovnejte všechny materiály pro 3D tisk vedle sebe — pevnost, teplota, cena, obtížnost
---

# Srovnání materiálů

Výběr správného filamentu je stejně důležitý jako výběr správného nástroje pro práci. Tento článek vám dává celkový obraz — od jednoduché srovnávací tabulky po tvrdost Shore, hodnoty HDT a praktický průvodce rozhodováním.

## Velká srovnávací tabulka

| Materiál | Pevnost | Tepelná odolnost | Flexibilita | UV odolnost | Chemická odolnost | Požadavky na trysku | Komora | Obtížnost | Cena |
|---|---|---|---|---|---|---|---|---|---|
| PLA | ★★★ | ★ | ★ | ★ | ★ | Mosaz | Ne | ★ Snadný | Nízká |
| PETG | ★★★ | ★★ | ★★ | ★★ | ★★★ | Mosaz | Ne | ★★ | Nízká |
| ABS | ★★★ | ★★★ | ★★ | ★ | ★★ | Mosaz | ANO | ★★★ | Nízká |
| ASA | ★★★ | ★★★ | ★★ | ★★★★ | ★★ | Mosaz | ANO | ★★★ | Střední |
| TPU | ★★ | ★★ | ★★★★★ | ★★ | ★★ | Mosaz | Ne | ★★★ | Střední |
| PA (Nylon) | ★★★★ | ★★★ | ★★★ | ★★ | ★★★★ | Mosaz | ANO | ★★★★ | Vysoká |
| PA-CF | ★★★★★ | ★★★★ | ★★ | ★★★ | ★★★★ | Kalená ocel | ANO | ★★★★ | Vysoká |
| PC | ★★★★ | ★★★★ | ★★ | ★★ | ★★★ | Mosaz | ANO | ★★★★ | Vysoká |
| PLA-CF | ★★★★ | ★★ | ★ | ★ | ★ | Kalená ocel | Ne | ★★ | Střední |

**Vysvětlení:**
- ★ = slabý/nízký/špatný
- ★★★ = střední/standardní
- ★★★★★ = výborný/nejlepší ve třídě

---

## Vyberte správný materiál — průvodce rozhodováním

Nejste si jisti, co zvolit? Postupujte podle těchto otázek:

### Musí odolávat teplu?
**Ano** → ABS, ASA, PC nebo PA

- Trochu tepla (do ~90 °C): **ABS** nebo **ASA**
- Hodně tepla (nad 100 °C): **PC** nebo **PA**
- Maximální teplotní odolnost: **PC** (do ~120 °C) nebo **PA-CF** (do ~160 °C)

### Musí být flexibilní?
**Ano** → **TPU**

- Velmi měkký (jako guma): TPU 85A
- Standardně flexibilní: TPU 95A
- Poloflexibilní: PETG nebo PA

### Bude se používat venku?
**Ano** → **ASA** je jasnou volbou

ASA je vyvinuto speciálně pro UV expozici a je lepší než ABS venku. PETG je druhou nejlepší volbou, pokud ASA není dostupné.

### Je potřeba maximální pevnost?
**Ano** → **PA-CF** nebo **PC**

- Nejpevnější lehký kompozit: **PA-CF**
- Nejpevnější čistý termoplast: **PC**
- Dobrá pevnost za nižší cenu: **PA (Nylon)**

### Nejjednodušší možný tisk?
→ **PLA**

PLA je nejodpouštivější materiál, jaký existuje. Nejnižší teplota, žádné požadavky na komoru, nízké riziko deformace.

### Kontakt s potravinami?
→ **PLA** (s výhradami)

PLA samotné není toxické, ale:
- Použijte trysku z nerezové oceli (ne mosaznou — může obsahovat olovo)
- FDM tisky nikdy nejsou „bezpečné pro potraviny" kvůli poréznímu povrchu — bakterie mohou růst
- Vyhněte se náročným prostředím (kyseliny, horká voda, myčka nádobí)
- PETG je lepší alternativou pro jednorázový kontakt

---

## Tvrdost Shore vysvětlena

Tvrdost Shore se používá k popisu tvrdosti a tuhosti elastomerů a plastových materiálů. Pro 3D tisk je zvláště relevantní pro TPU a jiné flexibilní filamenty.

### Shore A — flexibilní materiály

Stupnice Shore A jde od 0 (extrémně měkký, téměř jako gel) do 100 (extrémně tvrdá guma). Hodnoty nad 90A začínají se přibližovat tuhým plastovým materiálům.

| Hodnota Shore A | Vnímaná tvrdost | Příklad |
|---|---|---|
| 30A | Extrémně měkký | Silikon, želé |
| 50A | Velmi měkký | Měkká guma, ucpávky do uší |
| 70A | Měkký | Pneumatika, mezipodešev běžecké boty |
| 85A | Středně měkký | Pneumatika kola, měkké TPU filamenty |
| 95A | Polotvrdý | Standardní TPU filament |
| 100A ≈ 55D | Hranice mezi stupnicemi | — |

**TPU 95A** je průmyslovým standardem pro 3D tisk a poskytuje dobrou rovnováhu mezi elasticitou a tisknutelností. **TPU 85A** je velmi měkký a vyžaduje více trpělivosti během tisku.

### Shore D — tuhé materiály

Shore D se používá pro tvrdší termoplasty:

| Materiál | Přibližný Shore D |
|---|---|
| PLA | ~80D |
| PETG | ~70D |
| ABS | ~75D |
| PC | ~80D |
| PA (Nylon) | ~70–75D |

:::tip Není to totéž
Shore A 95 a Shore D 40 nejsou totéž, i když čísla mohou vypadat blízko. Stupnice jsou různé a překrývají se jen částečně kolem hranice 100A/55D. Vždy zkontrolujte, kterou stupnici dodavatel uvádí.
:::

---

## Teplotní tolerance — HDT a VST

Vědět, při které teplotě materiál začíná selhat, je klíčové pro funkční díly. Používají se dvě standardní měření:

- **HDT (Heat Deflection Temperature)** — teplota, při které se materiál ohne o 0,25 mm pod standardizovaným zatížením. Míra provozní teploty pod zatížením.
- **VST (Vicat Softening Temperature)** — teplota, při které se standardizovaná jehla ponoří 1 mm do materiálu. Míra absolutního bodu změknutí bez zatížení.

| Materiál | HDT (°C) | VST (°C) | Praktická max. teplota |
|---|---|---|---|
| PLA | 52–60 | 55–65 | ~50 °C |
| PETG | 70–80 | 75–85 | ~70 °C |
| ABS | 85–105 | 95–110 | ~90 °C |
| ASA | 90–105 | 95–108 | ~90 °C |
| TPU | 40–70 | variuje | ~60 °C |
| PA (Nylon) | 70–180 | 180–220 | ~80–160 °C |
| PA-CF | 100–200 | 200–230 | ~100–180 °C |
| PC | 120–140 | 145–160 | ~120 °C |
| PLA-CF | 55–65 | 60–70 | ~55 °C |

:::warning PLA v horkém prostředí
PLA díly v autě v létě jsou recept na katastrofu. Přístrojová deska v zaparkovaném autě může dosáhnout 80–90 °C. Používejte ABS, ASA nebo PETG pro vše, co může stát na slunci nebo v teple.
:::

:::info Varianty PA mají velmi různé vlastnosti
PA je rodina materiálů, ne jeden materiál. PA6 má nižší HDT (~70 °C), zatímco PA12 a PA6-CF mohou být na 160–200 °C. Vždy zkontrolujte datový list pro konkrétní filament, který používáte.
:::

---

## Požadavky na trysku

### Mosazná tryska (standardní)

Funguje pro všechny materiály **bez** plniva z uhlíkových nebo skleněných vláken:
- PLA, PETG, ABS, ASA, TPU, PA, PC, PVA
- Mosaz je měkká a rychle se opotřebovává abrazivními materiály

### Tryska z kalené oceli (nutná pro kompozity)

**NUTNÁ** pro:
- PLA-CF (PLA z uhlíkových vláken)
- PETG-CF
- PA-CF
- ABS-GF (ABS ze skleněných vláken)
- PPA-CF, PPA-GF
- Všechny filamenty s „-CF", „-GF", „-HF" nebo „uhlíková vlákna" v názvu

Kalená ocel má nižší tepelnou vodivost než mosaz — kompenzujte +5–10 °C na teplotě trysky.

:::danger Filamenty z uhlíkových vláken rychle ničí mosazné trysky
Mosazná tryska se může znatelně opotřebovat po pouhých několika stech gramech CF filamentu. Výsledkem je postupná nedostatečná extruze a nepřesné rozměry. Investujte do kalené oceli, pokud tisknete kompozity.
:::

---

## Stručný přehled materiálů podle použití

| Oblast použití | Doporučený materiál | Alternativa |
|---|---|---|
| Dekorace, figurky | PLA, PLA Silk | PETG |
| Funkční vnitřní díly | PETG | PLA+ |
| Venkovní expozice | ASA | PETG |
| Flexibilní díly, pouzdra | TPU 95A | TPU 85A |
| Motorový prostor, horká prostředí | PA-CF, PC | ABS |
| Lehká, tuhá konstrukce | PLA-CF | PA-CF |
| Podpůrný materiál (rozpustný) | PVA | HIPS |
| Kontakt s potravinami (omezený) | PLA (tryska z nerezové oceli) | — |
| Maximální pevnost | PA-CF | PC |
| Průhledný | PETG čirý | PC čirý |

Viz jednotlivé články o materiálech pro podrobné informace o nastavení teploty, řešení problémů a doporučených profilech pro tiskárny Bambu Lab.
