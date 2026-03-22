---
sidebar_position: 10
title: Streamelés OBS-sel
description: A Bambu Dashboard beállítása OBS Studio overlay-ként professzionális 3D nyomtatási streamhez
---

# 3D nyomtatás streamelése OBS-sel

A Bambu Dashboard beépített OBS-overlayt tartalmaz, amely a nyomtató állapotát, az előrehaladást, a hőmérsékleteket és a kameraképet közvetlenül a streamedbe jeleníti meg.

## Előfeltételek

- OBS Studio telepítve ([obsproject.com](https://obsproject.com))
- Bambu Dashboard fut és csatlakoztatott nyomtatóval rendelkezik
- (Opcionális) Bambu kamera engedélyezve az élő képhez

## 1. lépés — OBS Browser Source

Az OBS beépített **Browser Source** funkciója egy weboldalt közvetlenül a jelenetedbe jelenít meg.

**Overlay hozzáadása az OBS-ben:**

1. Nyissa meg az OBS Studio-t
2. A **Források** alatt kattintson a **+** gombra
3. Válassza a **Böngésző** (Browser) lehetőséget
4. Adjon nevet a forrásnak, pl. „Bambu Overlay"
5. Töltse ki:

| Beállítás | Érték |
|-----------|-------|
| URL | `http://localhost:3000/obs/overlay` |
| Szélesség | `1920` |
| Magasság | `1080` |
| FPS | `30` |
| Egyéni CSS | Lásd alább |

6. Jelölje be az **Audio kezelése az OBS-ből** lehetőséget
7. Kattintson az **OK** gombra

:::info Igazítsd az URL-t a te szerveredhez
A dashboard egy másik gépen fut, mint az OBS? Cseréld le a `localhost` értéket a szerver IP-címével, pl. `http://192.168.1.50:3000/obs/overlay`
:::

## 2. lépés — Átlátszó háttér

Ahhoz, hogy az overlay beolvadjon a képbe, a háttérnek átlátszónak kell lennie:

**Az OBS Browser Source beállításaiban:**
- Jelöld be a **Háttér eltávolítása** (Remove background) opciót

**Egyéni CSS az átlátszóság kikényszerítéséhez:**
```css
body {
  background-color: rgba(0, 0, 0, 0) !important;
  margin: 0;
  overflow: hidden;
}
```

Illeszd be ezt az **Egyéni CSS** mezőbe a Browser Source beállításaiban.

Az overlay ezután csak magát a widgetet jeleníti meg — fehér vagy fekete háttér nélkül.

## 3. lépés — Az overlay testreszabása

A Bambu Dashboardban konfigurálhatod, mit jelenítsen meg az overlay:

1. Menj a **Funkciók → OBS-overlay** menüpontra
2. Konfiguráld:

| Beállítás | Lehetőségek |
|-----------|------------|
| Pozíció | Felül bal, felül jobb, alul bal, alul jobb |
| Méret | Kicsi, közepes, nagy |
| Téma | Sötét, világos, átlátszó |
| Akcentszín | Válassz a stream stílusához illő színt |
| Elemek | Válaszd ki, mi jelenjen meg (lásd alább) |

**Elérhető overlay-elemek:**

- Nyomtató neve és állapota (online/nyomtat/hiba)
- Előrehaladási sáv százalékkal és hátralévő idővel
- Filament és szín
- Fúvóka- és lemezhőmérséklet
- Felhasznált filament (gramm)
- AMS-áttekintés (kompakt)
- Print Guard állapota

3. Kattints az **Előnézet** gombra az eredmény megtekintéséhez OBS-váltás nélkül
4. Kattints a **Mentés** gombra

:::tip URL nyomtatónként
Több nyomtatód van? Használj külön overlay URL-eket:
```
/obs/overlay?printer=1
/obs/overlay?printer=2
```
:::

## Kamerakép az OBS-ben (külön forrás)

A Bambu kamera külön forrásként adható hozzá az OBS-hez — az overlay-től függetlenül:

**1. lehetőség: A dashboard kamera-proxyn keresztül**

1. Menj a **Rendszer → Kamera** menüpontra
2. Másold az **RTSP- vagy MJPEG-streaming URL-jét**
3. Az OBS-ben: Kattints a **+** → **Médiaforrás** (Media Source) gombra
4. Illeszd be az URL-t
5. Jelöld be az **Ismétlés** (Loop) opciót, és kapcsold ki a helyi fájlok beállítást

**2. lehetőség: Browser Source kameranézettel**

1. Az OBS-ben: Adj hozzá **Browser Source-t**
2. URL: `http://localhost:3000/obs/camera?printer=1`
3. Szélesség/magasság: egyezzen a kamera felbontásával (1080p vagy 720p)

A kameraképet ezután szabadon elhelyezheted a jelenetben, és az overlayt rárakhatod.

## Tippek a jó streamhez

### Jelenetfelépítés streamhez

Egy tipikus jelenet 3D nyomtatás streameléshez:

```
┌─────────────────────────────────────────┐
│                                         │
│      [Kamerakép a nyomtatóból]          │
│                                         │
│  ┌──────────────────┐                  │
│  │ Bambu Overlay    │  ← Alul bal      │
│  │ Print: Logo.3mf  │                  │
│  │ ████████░░ 82%   │                  │
│  │ 1ó 24p maradt    │                  │
│  │ 220°C / 60°C     │                  │
│  └──────────────────┘                  │
└─────────────────────────────────────────┘
```

### Ajánlott beállítások

| Paraméter | Ajánlott érték |
|-----------|---------------|
| Overlay mérete | Közepes (ne legyen túl domináns) |
| Frissítési frekvencia | 30 FPS (az OBS-hez igazítva) |
| Overlay pozíciója | Alul bal (kerüli az arcot/chatet) |
| Színtéma | Sötét, kék akcentussal |

### Jelenetek és jelenetváltás

Hozz létre saját OBS-jeleneteket:

- **„Nyomtatás folyamatban"** — kameranézet + overlay
- **„Szünet / várakozás"** — statikus kép + overlay
- **„Kész"** — eredménykép + overlay „Befejezve" felirattal

Váltogass a jelenetek között OBS billentyűparancsokkal vagy Scene Collectionnel.

### Kamerakép stabilizálása

A Bambu kamera néha lefagyhat. A dashboardon a **Rendszer → Kamera** menüpontban:
- Engedélyezd az **Automatikus újracsatlakozás** funkciót — a dashboard automatikusan újracsatlakozik
- Állítsd az **Újracsatlakozási intervallumot** 10 másodpercre

### Hang

A 3D nyomtatók zajosak — különösen az AMS és a hűtés. Vedd figyelembe:
- Helyezd a mikrofont messze a nyomtatótól
- Adj zajszűrőt a mikrofonhoz az OBS-ben (Noise Suppression)
- Vagy használj háttérzenét / chat hangot helyette

:::tip Automatikus jelenetváltás
Az OBS támogatja a jelenetváltást eseményalapú logikával. Kombináld egy bővítménnyel (pl. obs-websocket) és a Bambu Dashboard API-val, hogy a jelenet automatikusan váltson, amikor a nyomtatás elindul vagy leáll.
:::
