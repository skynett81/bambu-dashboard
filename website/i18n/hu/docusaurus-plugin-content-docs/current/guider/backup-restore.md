---
sidebar_position: 9
title: Biztonsági másolat és visszaállítás
description: A Bambu Dashboard automatikus és manuális biztonsági másolata, visszaállítása és áthelyezése új szerverre
---

# Biztonsági másolat és visszaállítás

A Bambu Dashboard az összes adatot helyileg tárolja — nyomtatási előzmények, filamentkészlet, beállítások, felhasználók és egyebek. A rendszeres biztonsági mentés gondoskodik arról, hogy szerverhiba vagy költözés esetén se veszítsünk el semmit.

## Mit tartalmaznak a biztonsági másolatok?

| Adat | Mellékelt | Megjegyzés |
|------|-----------|---------|
| Nyomtatási előzmények | Igen | Összes napló és statisztika |
| Filamentkészlet | Igen | Tekercse, súlyok, márkák |
| Beállítások | Igen | Az összes rendszerbeállítás |
| Nyomtató beállítása | Igen | IP-címek, hozzáférési kódok |
| Felhasználók és szerepkörök | Igen | Jelszavak hashed |
| Értesítési konfiguráció | Igen | Telegram-tokenek stb. |
| Kamera képek | Opcionális | Nagyobb fájlok lehetnek |
| Timelapse videók | Opcionális | Alapértelmezés szerint kizárt |

## Automatikus éjszakai biztonsági másolat

Alapértelmezés szerint a biztonsági másolat minden éjszaka 03:00-kor fut.

**Tekintse meg és konfigurálja az automatikus biztonsági másolatot:**
1. Lépjen a **Rendszer → Biztonsági másolat** menübe
2. Az **Automatikus biztonsági másolat** alatt láthatók:
   - Utolsó sikeres biztonsági másolat és időpontja
   - Következő ütemezett biztonsági másolat
   - Tárolt biztonsági másolatok száma (alapértelmezés: 7 nap)

**Beállítása:**
- **Időpontja** — módosítsa az alapértelmezett 03:00-ról egy alkalmas időpontra
- **Megőrzési idő** — biztonsági másolatok hány napja tarthatók meg (7, 14, 30 nap)
- **Tárhelyre** — helyi mappa (alapértelmezés) vagy külső útvonal
- **Tömörítés** — alapértelmezés szerint aktiválva (60–80%-kal csökkenti a méretét)

:::info A biztonsági másolat alapértelmezés szerint itt van
```
/path/to/bambu-dashboard/data/backups/
backup-2025-03-22-030000.tar.gz
backup-2025-03-21-030000.tar.gz
...
```
:::

## Kézi biztonsági másolat

Bármikor tegyünk biztonsági másolatot:

1. Lépjen a **Rendszer → Biztonsági másolat** menübe
2. Kattintson a **Biztonsági másolat készítése most** gombra
3. Várjon, amíg az állapot **Befejezve** értéket jelenik meg
4. Töltse le a biztonsági másolat fájlt a **Letöltés** gombra kattintva

**Alternatívul terminálon keresztül:**
```bash
cd /path/to/bambu-dashboard
node scripts/backup.js
```

A biztonsági másolat a `data/backups/` mappában kerül tárolásra az időbélyeges fájlnév alatt.

## Biztonsági másolat visszaállítása

:::warning A visszaállítás felülírja a meglévő adatokat
Az összes meglévő adat helyébe a biztonsági másolat tartalma kerül. Győződjön meg arról, hogy a megfelelő fájlra állítja vissza.
:::

### Az irányítópulton keresztül

1. Lépjen a **Rendszer → Biztonsági másolat** menübe
2. Kattintson a **Visszaállítás** gombra
3. Válasszon egy biztonsági másolat fájlt a listából, vagy töltsön fel egy biztonsági másolat fájlt a lemezről
4. Kattintson a **Visszaállítás most** gombra
5. Az irányítópult a visszaállítás után automatikusan újraindul

### Terminál által

```bash
cd /path/to/bambu-dashboard
node scripts/restore.js data/backups/backup-2025-03-22-030000.tar.gz
```

Visszaállítás után indítsa újra az irányítópultot:
```bash
sudo systemctl restart bambu-dashboard
# vagy
npm start
```

## Beállítások exportálása és importálása

Csak a beállításokat szeretné megmenteni (nem az összes előzményt)?

**Exportálása:**
1. Lépjen a **Rendszer → Beállítások → Exportálása** menübe
2. Válassza ki, mi legyen részben:
   - Nyomtató beállítása
   - Értesítési konfiguráció
   - Felhasználói fiókok
   - Filament márkák és profilok
3. Kattintson az **Exportálás** gombra — `.json` fájlt tölt le

**Importálása:**
1. Lépjen a **Rendszer → Beállítások → Importálása** menübe
2. Töltse fel a `.json` fájlt
3. Válassza ki, mely részek legyenek importálva
4. Kattintson az **Importálás** gombra

:::tip Hasznos új telepítésnél
Az exportált beállítások kényelmessé teszik az új szerverre való átállást. Importáld őket az új telepítés után, hogy ne kelljen mindent újra beállítani.
:::

## Áthelyezés új szerverre

Így helyezheti át a Bambu Dashboard-ot a teljes adatokkal egy új gépre:

### 1. lépés — Biztonsági másolat a régi szerveren

1. Lépjen a **Rendszer → Biztonsági másolat → Biztonsági másolat készítése most** menübe
2. Töltse le a biztonsági másolat fájlt
3. Másolja a fájlt az új szerverre (USB, scp, hálózati megosztás)

### 2. lépés — Telepítés az új szerveren

```bash
git clone https://github.com/skynett81/bambu-dashboard.git
cd bambu-dashboard
./install.sh
```

Kövesd a telepítési útmutatót. Nem szükséges semmit konfigurálni — csak hozd működésbe a dashboardot.

### 3. lépés — Állítsa vissza a biztonsági másolatot

Ha az irányítópult az új szerveren fut:

1. Lépjen a **Rendszer → Biztonsági másolat → Visszaállítás** menübe
2. Töltse fel a biztonsági másolat fájlt a régi szerverről
3. Kattintson a **Visszaállítás most** gombra

Minden a helyén van: előzmények, filamentkészlet, beállítások és felhasználók.

### 4. lépés — Ellenőrizze a kapcsolatot

1. Lépjen a **Beállítások → Nyomtatók** menübe
2. Tesztelje az összes nyomtató kapcsolatát
3. Ellenőrizze, hogy az IP-címek továbbra is helyesek-e (új szerver lehet más IP)

## Tippek a jó biztonsági másolat higiéniához

- **Tesztelje a visszaállítást** — vegyen egy biztonsági másolatot, és állítsa vissza a tesztgépre legalább egyszer. A ki nem próbált biztonsági másolatok nem biztonsági másolatok.
- **Tároljuk kívülről** — másoljuk a biztonsági másolat fájlt rendszeres időközönként külső lemezre vagy felhőtárolásra (Nextcloud, Google Drive stb.)
- **Értesítés beállítása** — engedélyezze a "Biztonsági másolat nem sikerült" értesítést az **Beállítások → Értesítések → Események** alatt, hogy azonnal tudjon, ha valami elromlott
