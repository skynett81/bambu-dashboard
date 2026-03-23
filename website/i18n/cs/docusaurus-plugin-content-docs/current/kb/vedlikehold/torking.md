---
sidebar_position: 5
title: Sušení filamentu
description: Proč, kdy a jak sušit filament — teploty, doby a tipy pro skladování pro všechny materiály
---

# Sušení filamentu

Vlhký filament je jednou z nejčastějších a nejvíce podceňovaných příčin špatných tisků. Filament, který vypadá suchý, mohl absorbovat dostatek vlhkosti, aby zničil výsledek — zejména u materiálů jako nylon a PVA.

## Proč sušit filament?

Mnoho typů plastu je **hygroskopických** — postupně absorbují vlhkost ze vzduchu. Když vlhký filament prochází horkou tryskou, voda náhle odpařuje a vytváří mikrobubliny v roztaveném plastu. Výsledkem je:

- **Praskání a klikání** během tisku
- **Mlha nebo pára** viditelná z trysky
- **Stringing a hairing**, které nelze vyladit
- **Hrubý nebo zrnitý povrch** — zejména na horních vrstvách
- **Slabé díly** se špatnou adhezí vrstev a mikrotrhlinami
- **Matný nebo nevzhledný povrch** u materiálů, které by normálně měly být lesklé nebo hedvábné

:::warning Sušte filament PŘED úpravou nastavení
Mnoho lidí tráví hodiny laděním retrakce a teploty bez zlepšení — protože příčinou je vlhký filament. Vždy filament vysušte a znovu otestujte před změnou nastavení tisku.
:::

## Které materiály je třeba sušit?

Všechny typy plastů mohou navlhnout, ale stupeň hygroskopicity se enormě liší:

| Materiál | Hygroskopický | Teplota sušení | Doba sušení | Priorita |
|---|---|---|---|---|
| PLA | Nízká | 45–50 °C | 4–6 hodin | Volitelné |
| PETG | Střední | 65 °C | 4–6 hodin | Doporučeno |
| ABS | Střední | 65–70 °C | 4 hodiny | Doporučeno |
| TPU | Střední | 50–55 °C | 4–6 hodin | Doporučeno |
| ASA | Střední | 65 °C | 4 hodiny | Doporučeno |
| PC | Vysoká | 70–80 °C | 6–8 hodin | Nutné |
| PA/Nylon | Extrémně vysoká | 70–80 °C | 8–12 hodin | NUTNÉ |
| PA-CF | Extrémně vysoká | 70–80 °C | 8–12 hodin | NUTNÉ |
| PVA | Extrémně vysoká | 45–50 °C | 4–6 hodin | NUTNÉ |

:::tip Nylon a PVA jsou kritické
PA/Nylon a PVA mohou absorbovat dostatek vlhkosti, aby se staly netiskovatelnými za **několik hodin** v normálním vnitřním klimatu. Nikdy neotevírejte novou cívku těchto materiálů bez okamžitého sušení — a vždy tiskněte z uzavřené krabice nebo sušičky.
:::

## Příznaky vlhkého filamentu

Filament nemusíte vždy sušit podle tabulky. Naučte se rozpoznávat příznaky:

| Příznak | Vlhkost? | Jiné možné příčiny |
|---|---|---|
| Praskání/klikání | Ano, velmi pravděpodobné | Částečně ucpaná tryska |
| Mlha/pára z trysky | Ano, téměř jistě | Žádná jiná příčina |
| Hrubý, zrnitý povrch | Ano, možné | Příliš nízká teplota, příliš vysoká rychlost |
| Stringing, který nezmizí | Ano, možné | Špatná retrakce, příliš vysoká teplota |
| Slabé, křehké díly | Ano, možné | Příliš nízká teplota, špatné plnění |
| Změna barvy nebo matný povrch | Ano, možné | Špatná teplota, spálený plast |

## Metody sušení

### Sušička filamentu (doporučeno)

Dedikované sušičky filamentu jsou nejjednodušší a nejbezpečnější řešení. Udržují přesnou teplotu a umožňují tisknout přímo ze sušičky po celou dobu práce.

Oblíbené modely:
- **eSun eBOX** — dostupná cena, lze tisknout z krabice, podporuje většinu materiálů
- **Bambu Lab Filament Dryer** — optimalizovaná pro Bambu AMS, podporuje vysoké teploty
- **Polymaker PolyDryer** — dobrý teploměr a dobrá regulace teploty
- **Sunlu S2 / S4** — cenově dostupná, více cívek najednou

Postup:
```
1. Vložte cívky do sušičky
2. Nastavte teplotu z tabulky výše
3. Nastavte časovač na doporučenou dobu
4. Počkejte — nepřerušujte proces předčasně
5. Tiskněte přímo ze sušičky nebo okamžitě zabalte
```

### Potravinový dehydrátor

Běžný potravinový dehydrátor funguje překvapivě dobře jako sušička filamentu:

- Dostupná pořizovací cena
- Dobrá cirkulace vzduchu
- Podporuje teploty až 70–75 °C na mnoha modelech

:::warning Zkontrolujte maximální teplotu vašeho dehydrátoru
Mnoho levných potravinových dehydrátorů má nepřesné termostaty a může se lišit ±10 °C. Pro PA a PC, které vyžadují vysoké teplo, změřte skutečnou teplotu teploměrem.
:::

### Trouba

Kuchyňská trouba může být použita v nouzi, ale vyžaduje opatrnost:

:::danger NIKDY nepoužívejte běžnou troubu nad 60 °C pro PLA — deformuje se!
PLA začíná měknout již při 55–60 °C. Horká trouba může poškodit cívky, roztavit jádro a učinit filament nepoužitelným. Nikdy nepoužívejte troubu pro PLA, pokud nevíte, že teplota je přesně kalibrovaná a pod 50 °C.
:::

Pro materiály snášející vyšší teploty (ABS, ASA, PA, PC):
```
1. Předehřejte troubu na požadovanou teplotu
2. Použijte teploměr k ověření skutečné teploty
3. Položte cívky na rošt (ne přímo na dno trouby)
4. Nechte dvířka pootevřená, aby mohla unikat vlhkost
5. Sledujte při prvním použití této metody
```

### Bambu Lab AMS

Bambu Lab AMS Lite a AMS Pro mají vestavěnou funkci sušení (nízké teplo + cirkulace vzduchu). To nenahrazuje úplné sušení, ale udržuje již vysušený filament suchý během tisku.

- AMS Lite: Pasivní sušení — omezuje příjem vlhkosti, aktivně nesuší
- AMS Pro: Aktivní ohřev — určité sušení možné, ale ne tak efektivní jako dedikovaná sušička

## Skladování filamentu

Správné skladování po sušení je stejně důležité jako samotný proces sušení:

### Nejlepší řešení

1. **Suchá skříňka se silikagelem** — dedikovaná skříňka s hygrometrem a vysoušedlem. Udržuje vlhkost stabilně nízkou (ideálně pod 20 % RH)
2. **Vakuové sáčky** — odsajte vzduch a uzavřete s vysoušedlem uvnitř. Nejlevnější dlouhodobé skladování
3. **Ziplock sáčky s vysoušedlem** — jednoduché a efektivní pro kratší dobu

### Silikagel a vysoušedla

- **Modrý/oranžový silikagel** indikuje stupeň nasycení — vyměňte nebo regenerujte (sušte v troubě při 120 °C) při změně barvy
- **Granulovaný silikagel** je efektivnější než prášek
- **Sáčky s vysoušedlem** od výrobců filamentu lze regenerovat a znovu použít

### Hygrometr v úložném boxu

Levný digitální hygrometr zobrazuje aktuální vlhkost vzduchu v boxu:

| Relativní vlhkost (RH) | Stav |
|---|---|
| Pod 15 % | Ideální |
| 15–30 % | Dobré pro většinu materiálů |
| 30–50 % | Přijatelné pro PLA a PETG |
| Nad 50 % | Problematické — zejména pro PA, PVA, PC |

## Praktické tipy

- **Sušte bezprostředně PŘED tiskem** — vysušený filament může znovu navlhnout za dny v normálním vnitřním klimatu
- **Tiskněte ze sušičky** pro PA, PC a PVA — nejen sušte a odkládejte
- **Nová cívka ≠ suchá cívka** — výrobci pečetí s vysoušedlem, ale skladovací řetězec mohl selhat. Vždy sušte nové cívky hygroskopických materiálů
- **Označte sušené cívky** datem sušení
- **Dedikovaná PTFE trubice** od sušičky k tiskárně minimalizuje expozici během tisku

## Bambu Dashboard a stav sušení

Bambu Dashboard umožňuje zaznamenávat informace o filamentu včetně data posledního sušení v profilech filamentu. Použijte to ke sledování, které cívky jsou čerstvě vysušené a které potřebují nové kolo.
