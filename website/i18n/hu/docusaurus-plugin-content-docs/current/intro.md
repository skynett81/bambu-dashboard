---
sidebar_position: 1
title: Üdvözöljük a Bambu Dashboard-ban
description: Egy erőteljes, önállóan üzemeltetett dashboard Bambu Lab 3D nyomtatókhoz
---

# Üdvözöljük a Bambu Dashboard-ban

A **Bambu Dashboard** egy önállóan üzemeltetett, teljes funkcionalitású vezérlőpanel Bambu Lab 3D nyomtatókhoz. Teljes áttekintést és irányítást biztosít a nyomtatója, filament készlete, nyomtatási előzményei és egyebek felett — mindezt egyetlen böngészőlapból.

## Mi az a Bambu Dashboard?

A Bambu Dashboard közvetlenül csatlakozik a nyomtatójához MQTT-n keresztül LAN-on, a Bambu Lab szervereinek függősége nélkül. Csatlakozhat a Bambu Cloud-hoz is a modellek és a nyomtatási előzmények szinkronizálásához.

### Főbb funkciók

- **Élő dashboard** — valós idejű hőmérséklet, előrehaladás, kamera, AMS állapot
- **Filament készlet** — összes tekercs, szín, AMS szinkronizálás, szárítás nyomon követése
- **Nyomtatási előzmények** — teljes napló statisztikákkal és exportálással
- **Ütemező** — naptár nézet és nyomtatási sor
- **Nyomtató vezérlés** — hőmérséklet, sebesség, ventilátorok, G-kód konzol
- **Értesítések** — 7 csatorna (Telegram, Discord, e-mail, ntfy, Pushover, SMS, webhook)
- **Több nyomtató** — támogatja a teljes Bambu Lab sorozatot: X1C, X1E, P1S, P1P, P2S, A1, A1 mini, A1 Combo, H2S, H2D, H2C és még több
- **Önállóan üzemeltetett** — nincs felhő-függőség, az adatai a saját gépén

## Gyors kezdés

| Feladat | Hivatkozás |
|---------|-----------|
| Dashboard telepítése | [Telepítés](./kom-i-gang/installasjon) |
| Első nyomtató konfigurálása | [Beállítás](./kom-i-gang/oppsett) |
| Csatlakozás a Bambu Cloud-hoz | [Bambu Cloud](./kom-i-gang/bambu-cloud) |
| Az összes funkció felfedezése | [Funkciók](./funksjoner/oversikt) |
| API dokumentáció | [API](./avansert/api) |

:::tip Demo mód
Kipróbálhatja a dashboardot fizikai nyomtató nélkül az `npm run demo` futtatásával. Ez 3 szimulált nyomtatót indít élő nyomtatási ciklusokkal.
:::

## Támogatott nyomtatók

- **X1 sorozat**: X1C, X1C Combo, X1E
- **P1 sorozat**: P1S, P1S Combo, P1P
- **P2 sorozat**: P2S, P2S Combo
- **A sorozat**: A1, A1 Combo, A1 mini
- **H2 sorozat**: H2S, H2D (kettős fúvóka), H2C (szerszámváltó, 6 fej)

## Technikai áttekintés

A Bambu Dashboard Node.js 22-vel és vanilla HTML/CSS/JS-sel készült — nincsenek nehéz keretrendszerek, nincs build lépés. Az adatbázis SQLite, beépítve a Node.js 22-be. Lásd az [Architektúra](./avansert/arkitektur) oldalt a részletekért.
