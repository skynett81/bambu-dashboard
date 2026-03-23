---
sidebar_position: 7
title: Speciální materiály
description: ASA, PC, PP, PVA, HIPS a další speciální materiály pro pokročilé aplikace
---

# Speciální materiály

Kromě běžných materiálů existuje řada specializovaných materiálů pro konkrétní případy použití — od UV odolných venkovních dílů po ve vodě rozpustný podpůrný materiál. Zde je praktický přehled.

---

## ASA (Acrylonitrile Styrene Acrylate)

ASA je nejlepší alternativou ABS pro venkovní použití. Tiskne se téměř identicky jako ABS, ale snáší sluneční světlo a počasí mnohem lépe.

### Nastavení

| Parametr | Hodnota |
|----------|---------|
| Teplota trysky | 240–260 °C |
| Teplota podložky | 90–110 °C |
| Teplota komory | 45–55 °C |
| Chlazení dílu | 0–20 % |
| Sušení | Doporučeno (70 °C / 4–6 h) |

### Vlastnosti

- **UV odolný:** Speciálně navržen pro dlouhodobé vystavení slunečnímu záření bez žloutnutí nebo praskání
- **Tepelně stabilní:** Teplota skleného přechodu ~100 °C
- **Rázuvzdorný:** Lepší rázová odolnost než ABS
- **Nutná komora:** Deformuje se stejně jako ABS — X1C/P1S dává nejlepší výsledky

:::tip ASA místo ABS venku
Bude díl žít venku v evropském klimatu (slunce, déšť, mráz)? Zvolte ASA místo ABS. ASA vydrží mnoho let bez viditelné degradace. ABS začíná praskat a žloutnout po měsících.
:::

### Oblast použití
- Venkovní konzoly, kryty a upevňovací body
- Automobilové aerodynamické díly, držáky antén
- Zahradní nábytek a venkovní prostředí
- Značení a dávkovače na vnější straně budov

---

## PC (Polykarbonát)

Polykarbonát je jednou z nejpevnějších a nejrázuvzdornějších plastů, které lze tisknout 3D. Je průhledný a snáší extrémní teploty.

### Nastavení

| Parametr | Hodnota |
|----------|---------|
| Teplota trysky | 260–310 °C |
| Teplota podložky | 100–120 °C |
| Teplota komory | 50–70 °C |
| Chlazení dílu | 0–20 % |
| Sušení | Nutné (80 °C / 8–12 h) |

:::danger PC vyžaduje all-metal hotend a vysokou teplotu
PC se netaví při standardních teplotách PLA. Bambu X1C se správným nastavením trysky PC zvládne. Vždy zkontrolujte, zda PTFE součásti v hotendu sneou vaši teplotu — standardní PTFE nesnáší nepřetržitý provoz nad 240–250 °C.
:::

### Vlastnosti

- **Velmi rázuvzdorný:** Odolný vůči lámání i při nízkých teplotách
- **Průhledný:** Lze použít pro okna, čočky a optické součásti
- **Tepelně stabilní:** Teplota skleného přechodu ~147 °C — nejvyšší ze běžných materiálů
- **Hygroskopický:** Rychle absorbuje vlhkost — vždy důkladně sušte
- **Deformace:** Silné smrštění — vyžaduje komoru a brim

### Oblast použití
- Ochranné štíty a kryty
- Elektrické kryty odolávající teplu
- Držáky čoček a optické součásti
- Rámy robotů a trupy dronů

---

## PP (Polypropylen)

Polypropylen je jedním z nejtěžších materiálů k tisku, ale poskytuje jedinečné vlastnosti, které žádný jiný plastový materiál nemůže dosáhnout.

### Nastavení

| Parametr | Hodnota |
|----------|---------|
| Teplota trysky | 220–250 °C |
| Teplota podložky | 80–100 °C |
| Chlazení dílu | 20–50 % |
| Sušení | Doporučeno (70 °C / 6 h) |

### Vlastnosti

- **Chemicky odolný:** Snáší silné kyseliny, zásady, alkohol a většinu rozpouštědel
- **Lehký a flexibilní:** Nízká hustota, snáší opakované ohýbání (efekt živého pántě)
- **Nízká přilnavost:** Špatně přilne k sobě i k tiskové desce — to je výzva
- **Netoxický:** Bezpečný pro kontakt s potravinami (závisí na barvě a přísadách)

:::warning PP se špatně přilepuje ke všemu
PP je proslulé tím, že se nepřilepí k tiskové desce. Použijte PP pásku (jako Tesa pásku nebo dedikovanou PP pásku) na Engineering Plate nebo použijte lepicí tyčinku speciálně formulovanou pro PP. Brim 15–20 mm je nutný.
:::

### Oblast použití
- Laboratorní lahve a nádoby na chemikálie
- Skladování potravin a kuchyňské vybavení
- Živé pánty (víčka krabic odolávající tisícům cyklů otevírání/zavírání)
- Automobilové díly odolávající chemikáliím

---

## PVA (Polyvinyl Alcohol) — ve vodě rozpustný podpůrný materiál

PVA je speciální materiál používaný výhradně jako podpůrný materiál. Rozpouští se ve vodě a zanechává čistý povrch na modelu.

### Nastavení

| Parametr | Hodnota |
|----------|---------|
| Teplota trysky | 180–220 °C |
| Teplota podložky | 35–60 °C |
| Sušení | Kritické (55 °C / 6–8 h) |

:::danger PVA je extrémně hygroskopické
PVA absorbuje vlhkost rychleji než jakýkoliv jiný běžný filament. Před tiskem důkladně vysušte PVA a vždy uchovávejte v uzavřené krabici se silikagelem. Vlhký PVA se přilepí v trysce a je velmi obtížné ho odstranit.
:::

### Použití a rozpouštění

1. Tiskněte model s PVA jako podpůrným materiálem (vyžaduje multi-materiálovou tiskárnu — AMS)
2. Vložte hotový tisk do teplé vody (30–40 °C)
3. Nechte 30–120 minut, podle potřeby vyměňte vodu
4. Opláchněte čistou vodou a nechte uschnout

**Vždy používejte dedikovaný extrudér pro PVA**, pokud je to možné — zbytky PVA ve standardním extrudéru mohou zničit další tisk.

### Oblast použití
- Složité podpůrné struktury, které nelze ručně odstranit
- Vnitřní podpora převisů bez viditelného otisku na povrchu
- Modely s dutinami a vnitřními kanály

---

## HIPS (High Impact Polystyrene) — v rozpouštědle rozpustný podpůrný materiál

HIPS je další podpůrný materiál, navržený pro použití s ABS. Rozpouští se v **limonu** (citrusové rozpouštědlo).

### Nastavení

| Parametr | Hodnota |
|----------|---------|
| Teplota trysky | 220–240 °C |
| Teplota podložky | 90–110 °C |
| Teplota komory | 45–55 °C |
| Sušení | Doporučeno (65 °C / 4–6 h) |

### Použití s ABS

HIPS se tiskne při stejných teplotách jako ABS a dobře k němu přilne. Po tisku se HIPS rozpustí ponořením tisku do D-limonu na 30–60 minut.

:::warning Limon není voda
D-limon je rozpouštědlo extrahované z pomerančové kůry. Je relativně neškodný, ale přesto používejte rukavice a pracujte ve větrané místnosti. Nelijte použitý limon do odtoku — odevzdejte do sběrny odpadu.
:::

### Srovnání: PVA vs HIPS

| Vlastnost | PVA | HIPS |
|----------|-----|------|
| Rozpouštědlo | Voda | D-limon |
| Vlastní materiál | Kompatibilní s PLA | Kompatibilní s ABS |
| Citlivost na vlhkost | Extrémně vysoká | Střední |
| Náklady | Vysoké | Střední |
| Dostupnost | Dobrá | Střední |

---

## PVB / Fibersmooth — materiál vyhlazovatelný ethanolem

PVB (Polyvinyl Butyral) je jedinečný materiál, který lze **vyhladit ethanolem (lihem)** — stejně jako ABS lze vyhladit acetonem, ale mnohem bezpečněji.

### Nastavení

| Parametr | Hodnota |
|----------|---------|
| Teplota trysky | 190–210 °C |
| Teplota podložky | 35–55 °C |
| Chlazení dílu | 80–100 % |
| Sušení | Doporučeno (55 °C / 4 h) |

### Vyhlazování ethanolem

1. Vytiskněte model při standardním nastavení PVB
2. Naneste 99% isopropylalkohol (IPA) nebo ethanol štětcem
3. Nechte schnout 10–15 minut — povrch se rovnoměrně vyrovná
4. Opakujte v případě potřeby pro hladší povrch
5. Alternativně: naneste a vložte do uzavřené nádoby na 5 minut pro parní ošetření

:::tip Bezpečnější než aceton
IPA/ethanol je mnohem bezpečnější na manipulaci než aceton. Bod vzplanutí je vyšší a výpary jsou mnohem méně toxické. Přesto se doporučuje dobré větrání.
:::

### Oblast použití
- Figurky a dekorace, kde je žádoucí hladký povrch
- Prototypy pro prezentace
- Díly, které budou natřeny — hladký povrch dává lepší barvu

---

## Doporučené tiskové desky pro speciální materiály

| Materiál | Doporučená deska | Lepicí tyčinka? |
|---------|-----------------|-----------------|
| ASA | Engineering Plate / High Temp Plate | Ano |
| PC | High Temp Plate | Ano (nutné) |
| PP | Engineering Plate + PP páska | PP specifická páska |
| PVA | Cool Plate / Textured PEI | Ne |
| HIPS | Engineering Plate / High Temp Plate | Ano |
| PVB | Cool Plate / Textured PEI | Ne |
