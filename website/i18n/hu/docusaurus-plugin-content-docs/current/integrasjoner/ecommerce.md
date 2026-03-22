---
sidebar_position: 5
title: E-kereskedelem
description: Ügyfelek, rendelések és számlázás kezelése a 3D nyomtatások értékesítéséhez — geektech.no licenc szükséges
---

# E-kereskedelem

Az e-kereskedelmi modul teljes rendszert biztosít ügyfelek, rendelések és számlázás kezeléséhez — tökéletes azoknak, akik professzionálisan vagy fél-professzionálisan értékesítenek 3D nyomtatásokat.

Navigálj ide: **https://localhost:3443/#orders**

:::danger E-kereskedelmi licenc szükséges
Az e-kereskedelmi modul érvényes licencet igényel. A licencek **kizárólag a [geektech.no](https://geektech.no) oldalon vásárolhatók**. Aktív licenc nélkül a modul zárolva és elérhetetlen.
:::

## Licenc — vásárlás és aktiválás

### Licenc vásárlása

1. Menj a **[geektech.no](https://geektech.no)** oldalra, és hozz létre fiókot
2. Válaszd a **Bambu Dashboard — E-kereskedelmi licenc** lehetőséget
3. Válassz licenctípust:

| Licenctípus | Leírás | Nyomtatók |
|---|---|---|
| **Hobbi** | Egy nyomtató, személyes használat és kis értékesítés | 1 |
| **Professzionális** | Legfeljebb 5 nyomtató, kereskedelmi használat | 1–5 |
| **Enterprise** | Korlátlan számú nyomtató, teljes támogatás | Korlátlan |

4. Fejezd be a fizetést
5. E-mailben kapod meg a **licenckulcsot**

### Licenc aktiválása

1. Navigálj a **Beállítások → E-kereskedelem** menüpontra a dashboardban
2. Töltsd ki a következő mezőket:

| Mező | Leírás | Kötelező |
|------|--------|----------|
| **Licenckulcs** | 32 karakteres hexadecimális kulcs a geektech.no-tól | ✅ Igen |
| **E-mail cím** | A vásárláshoz használt e-mail | ✅ Igen |
| **Domain** | A domain, amelyen a dashboard fut (https:// nélkül) | Ajánlott |
| **Telefon** | Kapcsolattartó telefon (országkóddal, pl. +36) | Opcionális |

### Licenctípus — azonosítóhoz kötés

geektech.no a licencet egy vagy több azonosítóhoz köti:

| Típus | Érvényesítés ellen | Felhasználási eset |
|-------|-------------------|-------------------|
| **Domain** | Tartománynév (pl. `dashboard.cegnev.hu`) | Saját domainnel rendelkező fix szerver |
| **IP** | Nyilvános IP-cím(ek) | Domain nélküli szerver, fix IP |
| **MAC** | Hálózati kártya MAC-cím(ei) | Hardverhez kötés |
| **IP + MAC** | Mind IP, mind MAC egyeznie kell | Legmagasabb biztonság |

:::info Automatikus azonosítás
A dashboard minden ellenőrzésnél automatikusan elküldi a szerver IP-címét és MAC-címét. Ezeket nem kell kézzel kitölteni — geektech.no az első aktiváláskor rögzíti őket.
:::

Több IP-cím és MAC-cím is engedélyezhető (soronként egy a geektech.no adminban). Ez hasznos több hálózati kártyával vagy dinamikus IP-vel rendelkező szerverekhez.

3. Kattints a **Licenc aktiválása** gombra
4. A dashboard aktiválási kérelmet küld a geektech.no-nak
5. Sikeres aktiválás esetén a következők jelennek meg:
   - **Licenctípus** (Hobbi / Professzionális / Enterprise)
   - **Lejárati dátum**
   - **Maximális nyomtatószám**
   - **Licenctulajdonos**
   - **Példány-azonosító** (egyedi a telepítésedhez)

:::warning A licenckulcs a domainhez és a telepítéshez van kötve
A kulcs egy adott Bambu Dashboard telepítéshez és domainhez aktiválódik. Vedd fel a kapcsolatot a [geektech.no](https://geektech.no) támogatással, ha szükséges:
- A licenc áthelyezése új szerverre
- Domain módosítása
- Nyomtatószám növelése
:::

### Licencérvényesítés

A licenc hitelesítése és szinkronizálása a geektech.no-val történik:

- **Érvényesítés indításkor** — a licenc automatikusan ellenőrzésre kerül
- **Folyamatos érvényesítés** — 24 óránként újraérvényesítés a geektech.no-val szemben
- **Offline mód** — hálózati kiesés esetén a licenc legfeljebb **7 napig** működik gyorsítótárazott érvényesítéssel
- **Lejárt licenc** → a modul zárolódik, de a meglévő adatok (rendelések, ügyfelek) megmaradnak
- **PIN-kód** — geektech.no a PIN-rendszeren keresztül zárolhatja/felszabadíthatja a licencet
- **Megújítás**: **[geektech.no](https://geektech.no)** → Saját licencek → Megújítás

### Licenctípusok és korlátozások

| Csomag | Nyomtatók | Platformok | Díj | Ár |
|--------|-----------|------------|-----|-----|
| **Hobbi** | 1 | 1 (Shopify VAGY WooCommerce) | 5% | Lásd geektech.no |
| **Professzionális** | 1–5 | Összes | 5% | Lásd geektech.no |
| **Enterprise** | Korlátlan | Összes + API | 3% | Lásd geektech.no |

### Licencállapot ellenőrzése

Navigálj a **Beállítások → E-kereskedelem** menüpontra, vagy hívd meg az API-t:

```bash
curl -sk https://localhost:3443/api/ecommerce/license
```

A válasz tartalmazza:
```json
{
  "active": true,
  "status": "active",
  "plan": "professional",
  "holder": "Cégnév Kft.",
  "email": "ceg@pelda.hu",
  "domain": "dashboard.cegnev.hu",
  "max_printers": 5,
  "expires_at": "2027-03-22",
  "provider": "geektech.no",
  "fees_pending": 2,
  "fees_this_month": 450.00,
  "orders_this_month": 12
}
```

## Ügyfelek

### Ügyfél létrehozása

1. Navigálj az **E-kereskedelem → Ügyfelek** menüpontra
2. Kattints az **Új ügyfél** gombra
3. Töltsd ki:
   - **Név / Cégnév**
   - **Kapcsolattartó** (cégek esetén)
   - **E-mail cím**
   - **Telefon**
   - **Cím** (számlázási cím)
   - **Adószám / Személyi szám** (opcionális, ÁFA-regisztráltak számára)
   - **Megjegyzés** — belső feljegyzés
4. Kattints a **Létrehozás** gombra

### Ügyféláttekintés

Az ügyféllistán a következők jelennek meg:
- Név és elérhetőség
- Rendelések teljes száma
- Összes forgalom
- Utolsó rendelés dátuma
- Állapot (Aktív / Inaktív)

Kattints egy ügyfélre a teljes rendelési és számlázási előzmény megtekintéséhez.

## Rendeléskezelés

### Rendelés létrehozása

1. Navigálj az **E-kereskedelem → Rendelések** menüpontra
2. Kattints az **Új rendelés** gombra
3. Válaszd ki az **Ügyfelet** a listából
4. Adj hozzá rendelési sorokat:
   - Válassz fájlt/modellt a fájlkönyvtárból, vagy adj hozzá szabad szöveges tételt
   - Add meg a mennyiséget és egységárat
   - A rendszer automatikusan kiszámítja a költséget, ha projekthez van csatolva
5. Add meg a **Szállítási dátumot** (becsült)
6. Kattints a **Rendelés létrehozása** gombra

### Rendelés állapota

| Állapot | Leírás |
|---|---|
| Megkeresés | Beérkezett megkeresés, még nem megerősített |
| Megerősítve | Az ügyfél megerősítette |
| Gyártás alatt | Nyomtatások folyamatban |
| Szállításra kész | Kész, szállítás/átvétel várja |
| Leszállítva | Rendelés teljesítve |
| Visszavonva | Ügyfél vagy te mondta le |

Frissítsd az állapotot a rendelésre kattintva → **Állapot módosítása**.

### Nyomtatások rendeléshez csatolása

1. Nyisd meg a rendelést
2. Kattints a **Nyomtatás csatolása** gombra
3. Válassz nyomtatásokat az előzményekből (többszörös kiválasztás támogatott)
4. A költségadatok automatikusan beolvasódnak a nyomtatási előzményekből

## Számlázás

A részletes számlázási dokumentációért lásd a [Projektek → Számlázás](../funksjoner/projects#fakturering) oldalt.

Számla közvetlenül rendelésből is generálható:

1. Nyisd meg a rendelést
2. Kattints a **Számla generálása** gombra
3. Ellenőrizd az összeget és az ÁFÁ-t
4. Töltsd le PDF-ként, vagy küld az ügyfél e-mail-címére

### Számlaszám-sorozat

Állítsd be a számlaszám-sorozatot a **Beállítások → E-kereskedelem** menüponton:
- **Előtag**: pl. `2026-`
- **Kezdőszám**: pl. `1001`
- A számlaszámok automatikusan növekvő sorrendben kerülnek kiosztásra

## Jelentéskészítés és díjak

### Díjjelentés

A rendszer nyomon követi az összes tranzakciós díjat:
- Lásd a díjakat az **E-kereskedelem → Díjak** menüponton
- Jelöld meg a díjakat jelentettként könyvelési célokra
- Exportáld a díjösszefoglalót időszakonként

### Statisztika

Az **E-kereskedelem → Statisztika** menüponton:
- Havi forgalom (oszlopdiagram)
- Legjobb ügyfelek forgalom szerint
- Legtöbbet értékesített modellek/anyagok
- Átlagos rendelési méret

Exportálj CSV-be könyvelési rendszerekhez.

## Támogatás és kapcsolat

:::info Segítségre van szükséged?
- **Licenckérdések**: vedd fel a kapcsolatot a [geektech.no](https://geektech.no) támogatással
- **Műszaki problémák**: [GitHub Issues](https://github.com/skynett81/bambu-dashboard/issues)
- **Funkciókérések**: [GitHub Discussions](https://github.com/skynett81/bambu-dashboard/discussions)
:::
