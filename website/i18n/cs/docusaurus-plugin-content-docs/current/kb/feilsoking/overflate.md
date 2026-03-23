---
sidebar_position: 4
title: Povrchové vady
description: Diagnostika a oprava běžných povrchových problémů — blobs, zits, linie vrstev, elephant foot a další
---

# Povrchové vady

Povrch 3D tisku vypovídá hodně o tom, co se děje uvnitř systému. Většina povrchových vad má jednu nebo dvě jasné příčiny — při správné diagnostice je překvapivě snadné je napravit.

## Rychlý diagnostický přehled

| Příznak | Nejčastější příčina | První krok |
|---|---|---|
| Blobs a zits | Nadměrná extruze, umístění švu | Upravte šev, kalibrujte průtok |
| Viditelné linie vrstev | Z-wobble, příliš tlusté vrstvy | Přejděte na tenčí vrstvy, zkontrolujte osu Z |
| Elephant foot | První vrstva příliš široká | Kompenzace elephant foot |
| Ringing/ghosting | Vibrace při vysoké rychlosti | Snižte rychlost, aktivujte input shaper |
| Nedostatečná extruze | Ucpaná tryska, příliš nízká teplota | Vyčistěte trysku, zvyšte teplotu |
| Nadměrná extruze | Příliš vysoký průtok | Kalibrujte průtok |
| Pillowing | Příliš málo horních vrstev, příliš málo chlazení | Zvyšte počet horních vrstev, zvyšte ventilátor |
| Delaminace | Příliš nízká teplota, příliš mnoho chlazení | Zvyšte teplotu, snižte ventilátor |

---

## Blobs a zits

Blobs jsou nepravidelné hrudky na povrchu. Zits jsou bodovitá místa — často podél linie švu.

### Příčiny

- **Nadměrná extruze** — příliš mnoho plastu se extruduje a tlačí do stran
- **Špatné umístění švu** — standardní šev „nearest" soustřeďuje všechny přechody na stejné místo
- **Problém s retrakcí** — nedostatečná retrakce způsobuje nahromadění tlaku v trysce
- **Vlhký filament** — vlhkost vytváří mikrobubliny a kapání

### Řešení

**Nastavení švu v Bambu Studio:**
```
Bambu Studio → Kvalita → Pozice švu
- Aligned: Všechny švy na stejném místě (viditelné, ale úhledné)
- Nearest: Nejbližší bod (rozptyluje blobs náhodně)
- Back: Za objektem (doporučeno pro vizuální kvalitu)
- Random: Náhodné rozmístění (nejlépe maskuje šev)
```

**Kalibrace průtoku:**
```
Bambu Studio → Kalibrace → Průtok
Upravujte v krocích ±2 % dokud blobs nezmizí
```

:::tip Šev na „Back" pro vizuální kvalitu
Umístěte šev na zadní stranu objektu, aby byl co nejméně viditelný. Kombinujte s „Wipe on retract" pro čistější zakončení švu.
:::

---

## Viditelné linie vrstev

Všechny FDM tisky mají linie vrstev, ale měly by být konzistentní a sotva viditelné při normálních tiscích. Abnormální viditelnost poukazuje na konkrétní problémy.

### Příčiny

- **Z-wobble** — osa Z vibruje nebo není rovná, vytváří vlnitý vzor po celé výšce
- **Příliš tlusté vrstvy** — výška vrstvy nad 0,28 mm je znatelná i při dokonalých tiscích
- **Teplotní výkyvy** — nestálá teplota tání dává proměnlivé šířky vrstev
- **Nestálý průměr filamentu** — levný filament s proměnným průměrem

### Řešení

**Z-wobble:**
- Zkontrolujte, zda je vřeteno (Z-leadscrew) čisté a namazané
- Zkontrolujte, zda vřeteno není ohnuté (vizuální kontrola při otáčení)
- Viz článek o údržbě pro [mazání osy Z](/docs/kb/vedlikehold/smoring)

**Výška vrstvy:**
- Přejděte na 0,12 mm nebo 0,16 mm pro rovnoměrnější povrch
- Pamatujte, že snížení výšky na polovinu zdvojnásobí čas tisku

**Teplotní výkyvy:**
- Použijte PID kalibraci (dostupná přes nabídku údržby Bambu Studio)
- Vyhněte se průvanu, který chladí trysku během tisku

---

## Elephant foot

Elephant foot nastává, když je první vrstva širší než zbytek objektu — jako by se objekt „rozkládal" ve spodní části.

### Příčiny

- První vrstva je příliš tvrdě přitlačena k podložce (Z-offset příliš blízko)
- Příliš vysoká teplota vyhřívaného lože udržuje plast příliš dlouho měkký a tekutý
- Nedostatečné chlazení první vrstvy dává plastu více času na rozprostření

### Řešení

**Kompenzace elephant foot v Bambu Studio:**
```
Bambu Studio → Kvalita → Kompenzace Elephant foot
Začněte s 0,1–0,2 mm a upravujte, dokud noga nezmizí
```

**Z-offset:**
- Znovu kalibrujte výšku první vrstvy
- Zvyšujte Z-offset po 0,05 mm dokud noga nezmizí

**Teplota podložky:**
- Snižte teplotu podložky o 5–10 °C
- Pro PLA: 55 °C je často dostatečné — 65 °C může způsobovat elephant foot

:::warning Nekompenzujte příliš
Příliš vysoká kompenzace elephant foot může vytvořit mezeru mezi první vrstvou a zbytkem. Upravujte opatrně v krocích 0,05 mm.
:::

---

## Ringing a ghosting

Ringing (také „ghosting" nebo „echoing") je vlnitý vzor na povrchu těsně za ostrými hranami nebo rohy. Vzor „se odráží" od hrany.

### Příčiny

- **Vibrace** — rychlé zrychlení a zpomalení v rozích vysílá vibrace rámem
- **Příliš vysoká rychlost** — zejména rychlost vnější stěny nad 100 mm/s dává výrazný ringing
- **Volné díly** — volná cívka, vibrující vedení kabelu nebo volně montovaná tiskárna

### Řešení

**Bambu Lab input shaper (Kompenzace rezonance):**
```
Bambu Studio → Tiskárna → Kompenzace rezonance
Bambu Lab X1C a P1S mají vestavěný akcelerometr a kalibrují to automaticky
```

**Snižte rychlost:**
```
Vnější stěna: Snižte na 60–80 mm/s
Zrychlení: Snižte ze standardního na 3000–5000 mm/s²
```

**Mechanická kontrola:**
- Zkontrolujte, zda tiskárna stojí na stabilním podkladu
- Zkontrolujte, zda cívka nevibruje v držáku cívky
- Utáhněte všechny dostupné šrouby na vnějších panelech rámu

:::tip X1C a P1S automaticky kalibrují ringing
Bambu Lab X1C a P1S mají vestavěnou kalibraci akcelerometru, která se spouští automaticky při startu. Spusťte „Úplnou kalibraci" z nabídky údržby, pokud se ringing po nějaké době objeví.
:::

---

## Nedostatečná extruze

Nedostatečná extruze nastává, když tiskárna extruduje příliš málo plastu. Výsledkem jsou tenké, slabé stěny, viditelné mezery mezi vrstvami a „roztřepený" povrch.

### Příčiny

- **Částečně ucpaná tryska** — hromadění uhlíku snižuje průtok
- **Příliš nízká teplota trysky** — plast není dostatečně tekutý
- **Opotřebené ozubené kolo** v mechanismu extrudéru nezachycuje filament dostatečně dobře
- **Příliš vysoká rychlost** — extrudér nestíhá požadovaný průtok

### Řešení

**Studené vytažení (Cold pull):**
```
1. Zahřejte trysku na 220 °C
2. Ručně vtlačte filament
3. Ochlaďte trysku na 90 °C (PLA) při zachování tlaku
4. Rychle vytáhněte filament
5. Opakujte, dokud vytažený materiál nebude čistý
```

**Nastavení teploty:**
- Zvyšte teplotu trysky o 5–10 °C a znovu otestujte
- Příliš nízká teplota je běžnou příčinou nedostatečné extruze

**Kalibrace průtoku:**
```
Bambu Studio → Kalibrace → Průtok
Postupně zvyšujte, dokud nedostatečná extruze nezmizí
```

**Zkontrolujte ozubené kolo extrudéru:**
- Odstraňte filament a zkontrolujte ozubené kolo
- Vyčistěte malým kartáčkem, pokud jsou v zubech prach z filamentu

---

## Nadměrná extruze

Nadměrná extruze dává příliš široký provazec — povrch vypadá volně, lesklý nebo nerovnoměrný, se sklonem ke blobům.

### Příčiny

- **Příliš vysoký průtok** (EM — Extrusion Multiplier)
- **Špatný průměr filamentu** — filament 2,85 mm s profilem 1,75 mm dává masivní nadměrnou extruzi
- **Příliš vysoká teplota trysky** dělá plast příliš tekutým

### Řešení

**Kalibrace průtoku:**
```
Bambu Studio → Kalibrace → Průtok
Snižujte v krocích 2 % dokud není povrch rovnoměrný a matný
```

**Ověřte průměr filamentu:**
- Změřte skutečný průměr filamentu posuvným měřítkem na 5–10 místech podél filamentu
- Průměrná odchylka nad 0,05 mm naznačuje levný filament

---

## Pillowing

Pillowing jsou bublinavé, nerovnoměrné horní vrstvy s „polštáři" plastu mezi nimi. Zvláště výrazné při nízkém plnění a příliš málo horních vrstvách.

### Příčiny

- **Příliš málo horních vrstev** — plast nad plněním se propadá do děr
- **Příliš málo chlazení** — plast nestuhne dostatečně rychle, aby překlenul otvory plnění
- **Příliš nízké plnění** — velké otvory v plnění jsou těžko překlenutelné

### Řešení

**Zvyšte počet horních vrstev:**
```
Bambu Studio → Kvalita → Horní vrstvy pláště
Minimum: 4 vrstvy
Doporučeno pro rovnoměrný povrch: 5–6 vrstev
```

**Zvyšte chlazení:**
- PLA by mělo mít ventilátor chlazení na 100 % od vrstvy 3
- Nedostatečné chlazení je nejčastější příčinou pillowingu

**Zvyšte plnění:**
- Přejděte z 10–15 % na 20–25 %, pokud pillowing přetrvává
- Vzor Gyroid dává rovnoměrnější mostový povrch než linky

:::tip Žehlení (Ironing)
Funkce „ironing" v Bambu Studio nechá trysku projet přes horní vrstvu ještě jednou, aby vyrovnala povrch. Aktivujte v Kvalita → Ironing pro nejlepší dokončení horní vrstvy.
:::

---

## Delaminace (Layer separation / delamination)

Delaminace nastává, když se vrstvy k sobě dostatečně nepřilepí. V nejhorším případě se tisk rozlomí podél linií vrstev.

### Příčiny

- **Příliš nízká teplota trysky** — plast se dostatečně dobře netaví do spodní vrstvy
- **Příliš mnoho chlazení** — plast tuhne příliš rychle, než stihne splynout
- **Příliš velká tloušťka vrstvy** — nad 80 % průměru trysky dává špatnou fúzi
- **Příliš vysoká rychlost** — zkrácená doba tavení na mm dráhy

### Řešení

**Zvyšte teplotu:**
- Zkuste +10 °C nad standard a sledujte
- ABS a ASA jsou zvláště citlivé — vyžadují řízené vyhřívání komory

**Snižte chlazení:**
- ABS: ventilátor VYPNUTÝ (0 %)
- PETG: max. 20–40 %
- PLA: může tolerovat plné chlazení, ale snižte, pokud nastane delaminace

**Tloušťka vrstvy:**
- Používejte max. 75 % průměru trysky
- S tryskou 0,4 mm: max. doporučená výška vrstvy je 0,30 mm

**Zkontrolujte, zda je komora dostatečně teplá (ABS/ASA/PA/PC):**
```
Bambu Lab X1C/P1S: Nechte komoru zahřát na 40–60 °C
před zahájením tisku — neotvírejte dveře během tisku
```

---

## Obecné tipy pro řešení problémů

1. **Měňte jednu věc najednou** — testujte malým kalibračním tiskem mezi každou změnou
2. **Nejprve vysušte filament** — mnoho povrchových vad jsou ve skutečnosti příznaky vlhkosti
3. **Vyčistěte trysku** — částečné ucpání dává nekonzistentní povrchové vady, které jsou obtížně diagnostikovatelné
4. **Spusťte úplnou kalibraci** z nabídky údržby Bambu Studio po větších úpravách
5. **Používejte Bambu Dashboard** ke sledování toho, která nastavení dávala nejlepší výsledky v průběhu času
