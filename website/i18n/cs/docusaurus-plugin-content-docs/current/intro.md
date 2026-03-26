---
sidebar_position: 1
title: Vítejte v Bambu Dashboard
description: Výkonný, samostatně hostovaný dashboard pro 3D tiskárny Bambu Lab
---

# Vítejte v Bambu Dashboard

[![ko-fi](https://ko-fi.com/img/githubbutton_sm.svg)](https://ko-fi.com/V7V21NRKM7)

**Bambu Dashboard** je samostatně hostovaný, plně vybavený ovládací panel pro 3D tiskárny Bambu Lab. Poskytuje vám úplný přehled a kontrolu nad tiskárnou, zásobami filamentů, historií tisku a dalším — vše z jediné záložky prohlížeče.

## Co je Bambu Dashboard?

Bambu Dashboard se připojuje přímo k vaší tiskárně přes MQTT přes LAN, bez závislosti na serverech Bambu Lab. Můžete se také připojit k Bambu Cloud pro synchronizaci modelů a historie tisku.

### Klíčové funkce

- **Live dashboard** — teplota v reálném čase, průběh, kamera, stav AMS s indikátorem LIVE
- **Zásoby filamentů** — spravujte všechny cívky se synchronizací AMS, podporou EXT cívky, informacemi o materiálu, kompatibilitou podložky a průvodcem sušením
- **Sledování filamentů** — přesné sledování se 4úrovňovým záložním mechanismem (senzor AMS → odhad EXT → cloud → trvání)
- **Průvodce materiály** — 15 materiálů s teplotami, kompatibilitou podložky, sušením, vlastnostmi a tipy
- **Historie tisku** — kompletní protokol s názvy modelů, odkazy na MakerWorld, spotřebou filamentů a náklady
- **Plánovač** — zobrazení kalendáře, tisková fronta s vyvažováním zátěže a kontrolou filamentů
- **Ovládání tiskárny** — teplota, rychlost, ventilátory, konzole G-code
- **Print Guard** — automatická ochrana s xcam + 5 monitory senzorů
- **Odhad nákladů** — materiál, energie, práce, opotřebení, marže a návrh prodejní ceny
- **Údržba** — sledování s intervaly na základě KB, životností trysky, životností podložky a průvodcem
- **Zvuková upozornění** — 9 konfigurovatelných událostí s nahráváním vlastních zvuků a reproduktorem tiskárny (M300)
- **Protokol aktivit** — trvalá časová osa všech událostí (tisky, chyby, údržba, filament)
- **Oznámení** — 7 kanálů (Telegram, Discord, e-mail, ntfy, Pushover, SMS, webhook)
- **Více tiskáren** — podporuje celou řadu Bambu Lab
- **17 jazyků** — norština, angličtina, němčina, francouzština, španělština, italština, japonština, korejština, nizozemština, polština, portugalština, švédština, turečtina, ukrajinština, čínština, čeština, maďarština
- **Samostatně hostovaný** — žádná závislost na cloudu, vaše data na vašem stroji

### Novinky ve v1.1.13

- **Detekce EXT cívky** pro P2S/A1 prostřednictvím mapovacího pole MQTT — spotřeba filamentu je správně sledována pro externí cívku
- **Databáze materiálů filamentů** s 15 materiály, kompatibilitou podložky, průvodcem sušením a vlastnostmi
- **Panel údržby** s intervaly na základě KB, 4 novými typy trysek, záložkou průvodce s odkazy na dokumentaci
- **Zvuková upozornění** s 9 událostmi, vlastním nahráváním (MP3/OGG/WAV, max. 10 s), ovládáním hlasitosti a reproduktorem tiskárny
- **Protokol aktivit** — trvalá časová osa ze všech databází, bez ohledu na to, zda byla stránka otevřena
- **Chybové kódy HMS** s čitelnými popisy pro 270+ kódů
- **Kompletní i18n** — všech 2944 klíčů přeloženo do 17 jazyků
- **Automatické sestavení dokumentace** — dokumentace je automaticky sestavena při instalaci a spuštění serveru

## Rychlý start

| Úkol | Odkaz |
|------|-------|
| Nainstalovat dashboard | [Instalace](./kom-i-gang/installasjon) |
| Nakonfigurovat první tiskárnu | [Nastavení](./kom-i-gang/oppsett) |
| Připojit k Bambu Cloud | [Bambu Cloud](./kom-i-gang/bambu-cloud) |
| Prozkoumat všechny funkce | [Funkce](./funksjoner/oversikt) |
| Průvodce filamenty | [Průvodce materiály](./kb/filamenter/guide) |
| Průvodce údržbou | [Údržba](./kb/vedlikehold/dyse) |
| Dokumentace API | [API](./avansert/api) |

:::tip Demo režim
Můžete vyzkoušet dashboard bez fyzické tiskárny spuštěním `npm run demo`. Tím se spustí 3 simulované tiskárny s živými tiskovými cykly.
:::

## Podporované tiskárny

Všechny tiskárny Bambu Lab s režimem LAN:

- **Řada X1**: X1C, X1C Combo, X1E
- **Řada P1**: P1S, P1S Combo, P1P
- **Řada P2**: P2S, P2S Combo
- **Řada A**: A1, A1 Combo, A1 mini
- **Řada H2**: H2S, H2D (dvojitá tryska), H2C (výměník nástrojů, 6 hlav)

## Funkce v detailu

### Sledování filamentů

Dashboard automaticky sleduje spotřebu filamentů se 4úrovňovým záložním mechanismem:

1. **Rozdíl senzoru AMS** — nejpřesnější, porovnává zbývající % na začátku/konci
2. **EXT přímo** — pro P2S/A1 bez vt_tray, používá cloudový odhad
3. **Cloudový odhad** — z dat tiskových úloh Bambu Cloud
4. **Odhad podle trvání** — ~30 g/hod jako poslední záloha

Všechny hodnoty jsou zobrazeny jako minimum ze senzoru AMS a databáze cívek, aby se předešlo chybám po neúspěšných tiscích.

### Průvodce materiály

Vestavěná databáze s 15 materiály zahrnující:
- Teploty (tryska, podložka, komora)
- Kompatibilita podložky (Cool, Engineering, High Temp, Textured PEI)
- Informace o sušení (teplota, čas, hygroskopičnost)
- 8 vlastností (pevnost, flexibilita, odolnost vůči teplu, UV, povrch, snadnost použití)
- Obtížnost a speciální požadavky (kalená tryska, enclosure)

### Zvuková upozornění

9 konfigurovatelných událostí s podporou:
- **Vlastní zvukové klipy** — nahrajte MP3/OGG/WAV (max. 10 sekund, 500 KB)
- **Vestavěné tóny** — kovové/syntetické zvuky generované pomocí Web Audio API
- **Reproduktor tiskárny** — melodie M300 G-code přímo na bzučák tiskárny
- **Odpočítávání** — zvukové upozornění, když zbývá 1 minuta do konce tisku

### Údržba

Kompletní systém údržby:
- Sledování komponent (tryska, PTFE trubka, tyče, ložiska, AMS, podložka, sušení)
- Intervaly na základě KB z dokumentace
- Životnost trysky podle typu (mosaz, kalená ocel, HS01)
- Životnost podložky podle typu (Cool, Engineering, High Temp, Textured PEI)
- Záložka průvodce s tipy a odkazy na úplnou dokumentaci

## Technický přehled

Bambu Dashboard je postaven na Node.js 22 a vanilla HTML/CSS/JS — žádné těžké frameworky, žádný krok sestavení. Databáze je SQLite, zabudovaná v Node.js 22.

- **Backend**: Node.js 22 pouze se 3 npm balíčky (mqtt, ws, basic-ftp)
- **Frontend**: Vanilla HTML/CSS/JS, žádný krok sestavení
- **Databáze**: SQLite přes vestavěný `--experimental-sqlite` Node.js 22
- **Dokumentace**: Docusaurus se 17 jazyky, automaticky sestavená při instalaci
- **API**: 177+ endpointů, dokumentace OpenAPI na `/api/docs`

Viz [Architektura](./avansert/arkitektur) pro podrobnosti.
