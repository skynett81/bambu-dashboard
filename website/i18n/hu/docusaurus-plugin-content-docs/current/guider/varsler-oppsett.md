---
sidebar_position: 7
title: Értesítések beállítása
description: Telegram, Discord, e-mail és push értesítések konfigurálása a Bambu Dashboardban
---

# Értesítések beállítása

A Bambu Dashboard értesíthet a befejezett nyomtatásoktól a kritikus hibákig — Telegram, Discord, e-mail vagy böngésző push-értesítéseken keresztül.

## Értesítési csatornák áttekintése

| Csatorna | Legjobb | Szükséges |
|----------|---------|----------|
| Telegram | Gyors, mindenhol | Telegram-fiók + bot-token |
| Discord | Csapat/közösség | Discord-szerver + webhook-URL |
| E-mail (SMTP) | Hivatalos értesítés | SMTP-szerver |
| Push böngésző | Asztali értesítések | Böngésző push-támogatással |

---

## Telegram bot

### 1. lépés — Bot létrehozása

1. Nyissa meg a Telegramot, és keresse meg a **@BotFather** alkalmazást
2. Küldje el a `/newbot` parancsot
3. Adjon nevet a botnak (pl. "Bambu Értesítések")
4. Adjon felhasználónevet a botnak (pl. `bambu_alerts_bot`) — `bot`-ra kell végződnie
5. A BotFather egy **API-tokent** válaszol: `123456789:ABCdefGHIjklMNOpqrsTUVwxyz`
6. Másolja és tartsa meg ezt a tokent

### 2. lépés — Keresse meg a chat ID-t

1. Indítson egy beszélgetést a bottal (keresse meg a felhasználónevet, és kattintson a **Kezdés** gombra)
2. Küldjön üzenetet a botnak (pl. "hi")
3. Lépjen a `https://api.telegram.org/bot<SAJÁT_TOKEN>/getUpdates` webhelyre a böngészőben
4. Keresse meg a `"chat":{"id": 123456789}` — ez az ön chat ID

### 3. lépés — Kapcsolódjon az irányítópulthoz

1. Lépjen a **Beállítások → Értesítések → Telegram** menübe
2. Illessze be a **Bot Token** tokent
3. Illessze be a **Chat ID** azonosítót
4. Kattintson az **Értesítés tesztelése** gombra — teszt üzenetet kell kapnia a Telegram-ben
5. Kattintson a **Mentés** gombra

:::tip Csoport értesítése
Szeretne értesíteni egy egész csoportot? Adja hozzá a botot egy Telegram-csoporthoz, keresse meg a csoport-Chat ID (negatív szám, pl. `-100123456789`) és használja azt helyette.
:::

---

## Discord webhook

### 1. lépés — Webhook létrehozása a Discord-ban

1. Lépjen a Discord szerverre
2. Kattintson jobb gombbal a csatornára, amelyre értesítéseket szeretne kapni → **Csatorna szerkesztése**
3. Lépjen az **Integrációk → Webhooks** menübe
4. Kattintson az **Új Webhook** gombra
5. Adjon nevet a webhook-nak (pl. "Bambu Dashboard")
6. Válasszon egy avatárt (opcionális)
7. Kattintson a **Webhook URL másolása** gombra

Az URL így néz ki:
```
https://discord.com/api/webhooks/123456789/abcdefghijk...
```

### 2. lépés — Helyezze az irányítópultba

1. Lépjen a **Beállítások → Értesítések → Discord** menübe
2. Illessze be a **Webhook URL** értéket
3. Kattintson az **Értesítés tesztelése** gombra — a Discord-csatorna teszt üzenetet kapjon
4. Kattintson a **Mentés** gombra

---

## E-mail (SMTP)

### Szükséges információ

Az e-mail szolgáltatótól szüksége lesz az SMTP beállításokra:

| Szolgáltató | SMTP-szerver | Port | Titkosítás |
|------------|-------------|------|------------|
| Gmail | smtp.gmail.com | 587 | TLS |
| Outlook/Hotmail | smtp-mail.outlook.com | 587 | TLS |
| Yahoo | smtp.mail.yahoo.com | 587 | TLS |
| Saját domain | smtp.example.com | 587 | TLS |

:::warning A Gmail alkalmazás-jelszót igényel
A Gmail blokkolja a szokásos jelszóval való bejelentkezést. Létre kell hozni egy **alkalmazás-jelszót** a Google-fiók → Biztonság → 2-faktoros hitelesítés → Alkalmazás-jelszó alatt.
:::

### Konfigurálása az irányítópulton

1. Lépjen a **Beállítások → Értesítések → E-mail** menübe
2. Töltse ki:
   - **SMTP-szerver**: pl. `smtp.gmail.com`
   - **Port**: `587`
   - **Felhasználónév**: az e-mail cím
   - **Jelszó**: alkalmazásjelszó vagy normál jelszó
   - **Feladó**: az e-mail cím, amelyről az értesítés érkezik
   - **Címzett**: az e-mail cím, amelyre az értesítéseket fogadni szeretnéd
3. Kattintson az **E-mail tesztelése** gombra
4. Kattintson a **Mentés** gombra

---

## Push böngésző értesítések

A push értesítések rendszer értesítésként jelennek meg az asztalon — még akkor is, ha a böngésző lapja a háttérben van.

**Aktiválás:**
1. Lépjen a **Beállítások → Értesítések → Push-értesítések** menübe
2. Kattintson az **Push-értesítések engedélyezése** gombra
3. A böngésző engedélyt kér — kattintson az **Engedélyezés** gombra
4. Kattintson az **Értesítés tesztelése** gombra

:::info Csak abban a böngészőben, ahol aktiválta
A push értesítések az adott böngészőhöz és eszközhöz vannak kötve. Aktiválja az értesítéseket minden eszközön, amelyen szeretne értesítéseket kapni.
:::

---

## Válassza ki az értesítendő eseményeket

Miután beállított egy értesítési csatornát, válassza ki, hogy pontosan mely események aktiválnak értesítéseket:

**A Beállítások → Értesítések → Események alatt:**

| Esemény | Ajánlott |
|---------|----------|
| Nyomtatás befejezve | Igen |
| Nyomtatás meghiúsult / visszavont | Igen |
| Print Guard: spagetti felismert | Igen |
| HMS-hiba (kritikus) | Igen |
| HMS-figyelmeztetés | Opcionális |
| Filament alacsony szint | Igen |
| AMS-hiba | Igen |
| Nyomtató leválasztva | Opcionális |
| Karbantartási emlékeztetés | Opcionális |
| Éjszakai biztonsági másolat befejezve | Nem (zajos) |

---

## Csendes óra (éjszaka nem értesítés)

Kerülje a 03:00-kor befejezett nyomtatás miatti felébresztést:

1. Lépjen a **Beállítások → Értesítések → Csendes óra** menübe
2. Engedélyezze a **Csendes óra** lehetőséget
3. Állítsa be az kezdés és a végzés időpontját (pl. **22:00 – 07:00**)
4. Válassza ki, mely eseményeket kell továbbra is értesíteni a csendes időszakban:
   - **Kritikus HMS-hibák** — ajánlott bekapcsolva tartani
   - **Print Guard** — ajánlott bekapcsolva tartani
   - **Nyomtatás befejezve** — éjszaka kikapcsolható

:::tip Éjszakai nyomtatás zavar nélkül
Nyomtatás éjszakai csendes órákkal engedélyezve. A Print Guard figyel — és az értesítések összefoglalása reggel érkezik.
:::
