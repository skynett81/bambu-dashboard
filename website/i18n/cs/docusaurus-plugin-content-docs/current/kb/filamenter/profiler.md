---
sidebar_position: 8
title: Tiskové profily a nastavení
description: Pochopte a přizpůsobte tiskové profily v Bambu Studio — rychlost, teplota, retrakce a nastavení kvality
---

# Tiskové profily a nastavení

Tiskový profil je soubor nastavení, která přesně určují, jak tiskárna pracuje — od teploty a rychlosti až po retrakci a výšku vrstvy. Správný profil je rozdílem mezi dokonalým tiskem a neúspěchem.

## Co je tiskový profil?

Bambu Studio rozlišuje tři typy profilů:

- **Profil filamentu** — teplota, chlazení, retrakce a sušení pro konkrétní materiál
- **Profil procesu** — výška vrstvy, rychlost, plnění a nastavení podpory
- **Profil tiskárny** — nastavení specifická pro stroj (nastavena automaticky pro tiskárny Bambu Lab)

Bambu Studio dodává obecné profily pro všechny filamenty Bambu Lab a řadu materiálů třetích stran. Dodavatelé třetích stran jako Polyalkemi, eSUN a Fillamentum také vytvářejí optimalizované profily doladěné přesně pro jejich filament.

Profily lze volně importovat, exportovat a sdílet mezi uživateli.

## Import profilů v Bambu Studio

1. Stáhněte profil (soubor JSON) z webu dodavatele nebo MakerWorld
2. Otevřete Bambu Studio
3. Přejděte na **Soubor → Import → Importovat konfiguraci**
4. Vyberte stažený soubor
5. Profil se zobrazí pod výběrem filamentu v sliceru

:::tip Organizace
Dejte profilům popisné názvy, např. „Polyalkemi PLA HF 0.20mm Balanced", abyste příště snadno našli správný profil.
:::

## Důležitá nastavení vysvětlena

### Teplota

Teplota je nejdůležitějším jednotlivým nastavením. Příliš nízká teplota dává špatnou adhezi vrstev a nedostatečné plnění. Příliš vysoká dává stringing, bublinkový povrch a spálený filament.

| Nastavení | Popis | Typický PLA | Typický PETG | Typický ABS |
|---|---|---|---|---|
| Teplota trysky | Teplota tání | 200–220 °C | 230–250 °C | 240–260 °C |
| Teplota podložky | Teplo tiskové desky | 55–65 °C | 70–80 °C | 90–110 °C |
| Teplota komory | Teplota uzavřeného prostoru | Není nutná | Volitelně | 40–60 °C doporučeno |

Bambu Lab X1C a řada P1 mají aktivní vyhřívání komory. Pro ABS a ASA je to klíčové pro zabránění deformacím a delaminaci.

### Rychlost

Tiskárny Bambu Lab mohou fungovat extrémně rychle, ale vyšší rychlost neznamená vždy lepší výsledek. Zejména rychlost vnější stěny ovlivňuje povrch.

| Nastavení | Co ovlivňuje | Režim kvality | Vyvážený | Rychlý |
|---|---|---|---|---|
| Vnější stěna | Výsledek povrchu | 45–60 mm/s | 100 mm/s | 150+ mm/s |
| Vnitřní stěna | Strukturální pevnost | 100 mm/s | 150 mm/s | 200+ mm/s |
| Plnění | Vnitřní výplň | 150 mm/s | 200 mm/s | 300+ mm/s |
| Horní vrstva | Horní povrch | 45–60 mm/s | 80 mm/s | 100 mm/s |
| Dolní vrstva | První vrstva | 30–50 mm/s | 50 mm/s | 50 mm/s |

:::tip Rychlost vnější stěny je klíčem ke kvalitě povrchu
Snižte rychlost vnější stěny na 45–60 mm/s pro hedvábný povrch. To platí zejména pro Silk PLA a matné filamenty. Vnitřní stěny a plnění mohou stále běžet rychle bez ovlivnění povrchu.
:::

### Retrakce (stahování)

Retrakce stáhne filament trochu zpět do trysky, když se tiskárna pohybuje bez extruze. Tím se zabraňuje strindingu (jemné vlákno mezi díly). Nesprávné nastavení retrakce dává buď stringing (málo) nebo zaseknutí (příliš).

| Materiál | Vzdálenost retrakce | Rychlost retrakce | Poznámka |
|---|---|---|---|
| PLA | 0,8–2,0 mm | 30–50 mm/s | Standardní pro většinu |
| PETG | 1,0–3,0 mm | 20–40 mm/s | Příliš mnoho = zaseknutí |
| ABS | 0,5–1,5 mm | 30–50 mm/s | Podobné PLA |
| TPU | 0–1,0 mm | 10–20 mm/s | Minimálně! Nebo deaktivujte |
| Nylon | 1,0–2,0 mm | 30–40 mm/s | Vyžaduje suchý filament |

:::warning Retrakce TPU
Pro TPU a jiné flexibilní materiály: použijte minimální retrakci (0–1 mm) nebo úplně deaktivujte. Příliš mnoho retrakce způsobuje ohnutí měkkého filamentu a blokování v Bowden trubce, což vede k zaseknutí.
:::

### Výška vrstvy

Výška vrstvy určuje rovnováhu mezi úrovní detailů a rychlostí tisku. Nízká výška vrstvy dává jemnější detaily a hladší povrchy, ale trvá mnohem déle.

| Výška vrstvy | Popis | Oblast použití |
|---|---|---|
| 0,08 mm | Ultrajemná | Miniatury, detailní modely |
| 0,12 mm | Jemná | Vizuální kvalita, text, loga |
| 0,16 mm | Vysoká kvalita | Standard pro většinu tisků |
| 0,20 mm | Vyvážená | Dobrá rovnováha čas/kvalita |
| 0,28 mm | Rychlá | Funkční díly, prototypy |

Bambu Studio pracuje s nastavením procesů jako „0.16mm High Quality" a „0.20mm Balanced Quality" — tato nastavení nastavují výšku vrstvy a automaticky přizpůsobují rychlost a chlazení.

### Plnění (Infill)

Plnění určuje, kolik materiálu vyplňuje vnitřek tisku. Více plnění = pevnější, těžší a delší čas tisku.

| Procento | Oblast použití | Doporučený vzor |
|---|---|---|
| 10–15 % | Dekorace, vizuální | Gyroid |
| 20–30 % | Obecné použití | Cubic, Gyroid |
| 40–60 % | Funkční díly | Cubic, Honeycomb |
| 80–100 % | Maximální pevnost | Rectilinear |

:::tip Gyroid je král
Vzor Gyroid poskytuje nejlepší poměr pevnosti k hmotnosti a je izotropní — stejně pevný ve všech směrech. Je také rychlejší k tisku než honeycomb a dobře vypadá u otevřených modelů. Standardní volba pro většinu situací.
:::

## Tipy k profilům podle materiálu

### PLA — zaměřený na kvalitu

PLA je odpouštivý a snadno se s ním pracuje. Zaměřte se na kvalitu povrchu:

- **Vnější stěna:** 60 mm/s pro dokonalý povrch, zejména se Silk PLA
- **Chladicí ventilátor:** 100 % od vrstvy 3 — klíčové pro ostré detaily a mosty
- **Brim:** Není nutný pro čisté PLA se správně kalibrovanou deskou
- **Výška vrstvy:** 0,16 mm High Quality dává dobrou rovnováhu pro dekorativní díly

### PETG — rovnováha

PETG je pevnější než PLA, ale náročnější na jemné doladění:

- **Nastavení procesu:** 0,16 mm High Quality nebo 0,20 mm Balanced Quality
- **Chladicí ventilátor:** 30–50 % — příliš mnoho chlazení dává špatnou adhezi vrstev a křehké tisky
- **Z-hop:** Aktivujte, abyste zabránili tažení trysky po povrchu při přesunech
- **Stringing:** Upravte retrakci a tiskněte trochu tepleji, ne chladněji

### ABS — komora je vše

ABS se tiskne dobře, ale vyžaduje kontrolované prostředí:

- **Chladicí ventilátor:** VYPNUTÝ (0 %) — absolutně kritické! Chlazení způsobuje delaminaci a deformaci
- **Komora:** Zavřete dveře a nechte komoru zahřát na 40–60 °C před zahájením tisku
- **Brim:** 5–8 mm doporučeno pro velké a ploché díly — zabraňuje deformaci v rozích
- **Větrání:** Zajistěte dobré větrání v místnosti — ABS vydává styrénové výpary

### TPU — pomalu a opatrně

Flexibilní materiály vyžadují úplně jiný přístup:

- **Rychlost:** Max. 30 mm/s — příliš rychlý tisk způsobuje ohnutí filamentu
- **Retrakce:** Minimální (0–1 mm) nebo úplně deaktivovaná
- **Direct drive:** TPU funguje pouze na strojích Bambu Lab s vestavěným direct drive
- **Výška vrstvy:** 0,20 mm Balanced dává dobrou fúzi vrstev bez nadměrného napětí

### Nylon — suchý filament je vše

Nylon je hygroskopický a absorbuje vlhkost během hodin:

- **Vždy sušte:** 70–80 °C po dobu 8–12 hodin před tiskem
- **Komora:** Tiskněte ze sušičky přímo do AMS, aby filament zůstal suchý
- **Retrakce:** Mírná (1,0–2,0 mm) — vlhký nylon dává mnohem více strindingu
- **Tisková deska:** Engineering Plate s lepidlem nebo deska Garolite pro nejlepší adhezi

## Přednastavení Bambu Lab

Bambu Studio má vestavěné profily pro celou produktovou řadu Bambu Lab:

- Bambu Lab Basic PLA, PETG, ABS, TPU, PVA, PA, PC, ASA
- Podpůrné materiály Bambu Lab (Support W, Support G)
- Bambu Lab Specialty (PLA-CF, PETG-CF, ABS-GF, PA-CF, PPA-CF, PPA-GF)
- Obecné profily (Generic PLA, Generic PETG atd.) jako výchozí bod pro filamenty třetích stran

Obecné profily jsou dobrým výchozím bodem. Upravte teplotu o ±5 °C podle skutečného filamentu.

## Profily třetích stran

Mnoho předních dodavatelů nabízí hotové profily Bambu Studio optimalizované přesně pro jejich filament:

| Dodavatel | Dostupné profily | Stáhnout |
|---|---|---|
| [Polyalkemi](https://polyalkemi.no) | PLA, PLA High Speed, PETG, PETG-CF, ABS | [Profily Bambu Lab](https://gammel.polyalkemi.no/bambulabprofiler/) |
| [eSUN](https://www.esun3d.com) | PLA+, ePLA-Lite, PETG, eABS | [Profily eSUN](https://www.esun3d.com/bambu-lab-3d-printer-filament-setting/) |
| [Fillamentum](https://fillamentum.com) | Nonoilen PLA, PLA, PET-G | [Profily Fillamentum](https://fillamentum.com/pages/bambu-lab-print-profiles) |
| [Spectrum](https://spectrumfilaments.com) | PETG FR V0, PETG-HT100 | [Profily Spectrum](https://spectrumfilaments.com/bambu-lab-profiles/) |
| [Fiberlogy](https://fiberlogy.com) | Easy-PETG, Matte-PETG, TPU 30D | [Profily Fiberlogy](https://fiberlogy.com/en/printing-profiles/) |
| [add:north](https://addnorth.com) | PLA, PETG, AduraX, X-PLA | [Profily add:north](https://addnorth.com/printing-profiles) |

:::info Kde najít profily?
- **Bambu Studio:** Vestavěné profily pro materiály Bambu Lab a mnoho třetích stran
- **Web dodavatele:** Hledejte „Bambu Studio profile" nebo „JSON profile" v části ke stažení
- **Bambu Dashboard:** V panelu Tiskových profilů v části Nástroje
- **MakerWorld:** Profily jsou často sdíleny spolu s modely jinými uživateli
:::

## Export a sdílení profilů

Vlastní profily lze exportovat a sdílet s ostatními:

1. Přejděte na **Soubor → Export → Exportovat konfiguraci**
2. Vyberte, které profily (filament, proces, tiskárna) chcete exportovat
3. Uložte jako soubor JSON
4. Sdílejte soubor přímo nebo nahrajte na MakerWorld

To je zvláště užitečné, pokud jste profil v průběhu času doladili a chcete ho uchovat při přeinstalaci Bambu Studio.

---

## Řešení problémů s profily

### Stringing

Jemné vlákno mezi tištěnými díly — zkuste v tomto pořadí:

1. Zvyšte vzdálenost retrakce o 0,5 mm
2. Snižte teplotu tisku o 5 °C
3. Aktivujte „Wipe on retract"
4. Zkontrolujte, zda je filament suchý

### Nedostatečné plnění / díry ve stěnách

Tisk nevypadá pevně nebo má díry:

1. Zkontrolujte, zda je nastavení průměru filamentu správné (1,75 mm)
2. Kalibrujte průtok v Bambu Studio (Kalibrace → Průtok)
3. Zvyšte teplotu o 5 °C
4. Zkontrolujte částečné ucpání trysky

### Špatná adheze vrstev

Vrstvy k sobě dobře nedrží:

1. Zvyšte teplotu o 5–10 °C
2. Snižte chladicí ventilátor (zejména PETG a ABS)
3. Snižte rychlost tisku
4. Zkontrolujte, zda je komora dostatečně teplá (pro ABS/ASA)
