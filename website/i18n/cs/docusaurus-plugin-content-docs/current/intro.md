---
sidebar_position: 1
title: Vítejte v Bambu Dashboard
description: Výkonný, samostatně hostovaný dashboard pro 3D tiskárny Bambu Lab
---

# Vítejte v Bambu Dashboard

**Bambu Dashboard** je samostatně hostovaný, plně vybavený ovládací panel pro 3D tiskárny Bambu Lab. Poskytuje vám úplný přehled a kontrolu nad tiskárnou, zásobami filamentů, historií tisku a dalším — vše z jediné záložky prohlížeče.

## Co je Bambu Dashboard?

Bambu Dashboard se připojuje přímo k vaší tiskárně přes MQTT přes LAN, bez závislosti na serverech Bambu Lab. Můžete se také připojit k Bambu Cloud pro synchronizaci modelů a historie tisku.

### Klíčové funkce

- **Live dashboard** — teplota v reálném čase, průběh, kamera, stav AMS
- **Zásoby filamentů** — sledování všech cívek, barev, synchronizace AMS, sušení
- **Historie tisku** — kompletní protokol se statistikami a exportem
- **Plánovač** — zobrazení kalendáře a tisková fronta
- **Ovládání tiskárny** — teplota, rychlost, ventilátory, konzole G-code
- **Oznámení** — 7 kanálů (Telegram, Discord, e-mail, ntfy, Pushover, SMS, webhook)
- **Multi-tiskárna** — podporuje celou řadu Bambu Lab: X1C, X1E, P1S, P1P, P2S, A1, A1 mini, A1 Combo, H2S, H2D, H2C a další
- **Samostatně hostovaný** — žádná závislost na cloudu, vaše data na vašem stroji

## Rychlý start

| Úkol | Odkaz |
|------|-------|
| Nainstalovat dashboard | [Instalace](./kom-i-gang/installasjon) |
| Nakonfigurovat první tiskárnu | [Nastavení](./kom-i-gang/oppsett) |
| Připojit k Bambu Cloud | [Bambu Cloud](./kom-i-gang/bambu-cloud) |
| Prozkoumat všechny funkce | [Funkce](./funksjoner/oversikt) |
| Dokumentace API | [API](./avansert/api) |

:::tip Demo režim
Můžete vyzkoušet dashboard bez fyzické tiskárny spuštěním `npm run demo`. Tím se spustí 3 simulované tiskárny s živými tiskovými cykly.
:::

## Podporované tiskárny

- **Řada X1**: X1C, X1C Combo, X1E
- **Řada P1**: P1S, P1S Combo, P1P
- **Řada P2**: P2S, P2S Combo
- **Řada A**: A1, A1 Combo, A1 mini
- **Řada H2**: H2S, H2D (dvojitá tryska), H2C (výměník nástrojů, 6 hlav)

## Technický přehled

Bambu Dashboard je postaven na Node.js 22 a vanilla HTML/CSS/JS — žádné těžké frameworky, žádný krok sestavení. Databáze je SQLite, zabudovaná v Node.js 22. Viz [Architektura](./avansert/arkitektur) pro podrobnosti.
