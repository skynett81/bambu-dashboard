---
sidebar_position: 8
title: Navigálás a dashboardban
description: Ismerd meg a Bambu Dashboard navigációját — oldalsáv, panelek, billentyűparancsok és testreszabás
---

# Navigálás a dashboardban

Ez az útmutató gyors bevezetést nyújt a dashboard szervezéséhez és a hatékony navigációhoz.

## Oldalsáv

Az oldalsáv balra van, a navigációs központja. Szekciókra van szervezve:

```
┌────────────────────┐
│ 🖨  Nyomtató státuszok│  ← Egy sor nyomtatónként
├────────────────────┤
│ Áttekintés         │
│ Flotta             │
│ Aktív nyomtatás    │
├────────────────────┤
│ Filament           │
│ Előzmények         │
│ Projektek          │
│ Sor                │
│ Ütemező            │
├────────────────────┤
│ Monitorozás        │
│  └ Print Guard     │
│  └ Hibák           │
│  └ Diagnosztika    │
│  └ Karbantartás    │
├────────────────────┤
│ Elemzés            │
│ Eszközök           │
│ Integrációk        │
│ Rendszer           │
├────────────────────┤
│ ⚙ Beállítások      │
└────────────────────┘
```

**Az oldalsáv elrejthető** a bal felső sarokban lévő hamburger ikonra (☰) kattintva. Hasznos kisebb képernyőkön vagy kioszk módban.

## Fő panel

Amikor az oldalsávon rákattint egy elemre, a tartalom a jobb oldalon megjelenik. Az elrendezés eltérő:

| Panel | Elrendezés |
|-------|--------|
| Áttekintés | Kártya-rács az összes nyomtatóval |
| Aktív nyomtatás | Nagy részlet kártya + hőmérsékleti görbék |
| Előzmények | Szűrhető táblázat |
| Filament | Kártyanézet tekercsekkel |
| Elemzés | Grafikák és diagramok |

## Kattintson a nyomtató státuszára a részletekhez

A nyomtató kártya az áttekintő panelen kattintható:

**Egy kattintás** → Megnyitja az adott nyomtató részletpanelét:
- Valós idejű hőmérsékletek
- Aktív nyomtatás (ha folyamatban van)
- AMS-státusz az összes nyílással
- Legújabb hibák és események
- Gyors gomb: Szünetel, Stop, Lámpa be/ki

**Kattintson a kamera ikonra** → Megnyitja az élő kamera nézetet

**Kattintson a ⚙ ikonra** → Nyomtató beállítások

## Billentyűparancsok — parancspaletta

A parancs paletta gyors hozzáférést biztosít az összes funkcióhoz navigáció nélkül:

| Billentyűparancs | Intéz |
|---------|----------|
| `Ctrl + K` (Linux/Windows) | Parancs paletta megnyitása |
| `Cmd + K` (macOS) | Parancs paletta megnyitása |
| `Esc` | Paletta bezárása |

A parancs paletára használhat:
- Oldalak és funkciók keresése
- Nyomtatás közvetlen indítása
- Szünetel / aktív nyomtatások folytatása
- Téma váltása (világos/sötét)
- Bármely oldalra navigálás

**Példa:** Nyomja meg a `Ctrl+K`, írja be az "szünetel" → válassza az "Összes aktív nyomtatás szüneteltetése" lehetőséget

## Widget testreszabás

Az áttekintő panel olyan widgetekkel testreszabható, amelyeket választ:

**Az irányítópult szerkesztése:**
1. Kattintson az **Elrendezés szerkesztése** gombra (ceruza ikon) az áttekintő panel jobb felső sarkában
2. Húzza a widgeteket a kívánt helyre
3. Húzza a widget sarkát az átméretezéshez
4. Kattintson a **+ Widget hozzáadása** gombra az új widget hozzáadásához:

Elérhető widgetek:

| Widget | Mutat |
|--------|-------|
| Nyomtató státusz | Kártya az összes nyomtatóhoz |
| Aktív nyomtatás (nagy) | Folyamatban lévő nyomtatás részletezése |
| AMS-áttekintés | Az összes nyílás és filamentnivó |
| Hőmérsékleti görbe | Valós idejű gráf |
| Áramár | Következő 24 óra árgrafikonja |
| Filament-mérő | Teljes felhasználás az utolsó 30 napban |
| Előzmények parancsikon | Utolsó 5 nyomtatás |
| Kamera feed | Élő kamerakép |

5. Kattintson az **Elrendezés mentése** gombra

:::tip Több elrendezés mentése
Különböző céljú elrendezések lehetnek — egy kompakt a napi használathoz, egy nagy egy nagy képernyőhöz. Váltson közöttük az elrendezés választóval.
:::

## Téma — váltson világos és sötét között

**Gyors váltás:**
- Kattintson a nap/hold ikonra a navigáció jobb felső sarkában
- Vagy: `Ctrl+K` → írja be az "téma"

**Állandó beállítás:**
1. Lépjen a **Rendszer → Témák** menübe
2. Válasszon az alábbiak közül:
   - **Világos** — fehér háttér
   - **Sötét** — sötét háttér (ajánlott éjszaka)
   - **Automatikus** — követi az eszköz beállítást
3. Válasszon szín akcentust (kék, zöld, lila stb.)
4. Kattintson a **Mentés** gombra

## Billentyűzet navigációs

A hatékony navigációhoz egér nélkül:

| Billentyűparancs | Intéz |
|---------|----------|
| `Tab` | Következő interaktív elem |
| `Shift+Tab` | Előző elem |
| `Enter` / `Space` | Gomb/link aktiválása |
| `Esc` | Modal/dropdown bezárása |
| `Ctrl+K` | Parancs paletta |
| `Alt+1` – `Alt+9` | Közvetlenül a 9 első oldalra |

## PWA — telepítés alkalmazásként

A Bambu Dashboard progresszív web-alkalmazásként (PWA) telepíthető, és böngésző menü nélkül önálló alkalmazásként futtatható:

1. Lépjen az irányítópultra a Chrome, Edge vagy Safari böngészőben
2. Kattintson az **App telepítése** ikonra a címsávban
3. Erősítse meg a telepítést

A részletekért lásd a [PWA dokumentációját](../system/pwa).

## Kioszk mód

A kioszk mód elrejti az összes navigációt, és csak az irányítópultot jeleníti meg — tökéletes egy dedikált nyomtatási workshop-képernyőhöz:

1. Lépjen a **Rendszer → Kioszk** menübe
2. Engedélyezze a **Kioszk mód** lehetőséget
3. Válassza ki, mely widgetek jelenjenek meg
4. Frissítési intervallum beállítása

A teljes beállításhoz lásd a [Kioszk dokumentációját](../system/kiosk).
