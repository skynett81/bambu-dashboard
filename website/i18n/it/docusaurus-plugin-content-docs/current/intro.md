---
sidebar_position: 1
title: Benvenuto in Bambu Dashboard
description: Un potente dashboard self-hosted per le stampanti 3D Bambu Lab
---

# Benvenuto in Bambu Dashboard

**Bambu Dashboard** è un pannello di controllo self-hosted e completo per le stampanti 3D Bambu Lab. Offre visibilità e controllo completi sulla stampante, sull'inventario dei filamenti, sulla cronologia di stampa e altro ancora — tutto da un'unica scheda del browser.

## Cos'è Bambu Dashboard?

Bambu Dashboard si connette direttamente alla tua stampante tramite MQTT su LAN, senza dipendenza dai server di Bambu Lab. Puoi anche connetterti a Bambu Cloud per la sincronizzazione di modelli e cronologia di stampa.

### Funzionalità principali

- **Dashboard live** — temperatura in tempo reale, avanzamento, fotocamera, stato AMS
- **Inventario filamenti** — traccia tutte le bobine, colori, sincronizzazione AMS, essiccazione
- **Cronologia di stampa** — registro completo con statistiche ed esportazione
- **Pianificatore** — vista calendario e coda di stampa
- **Controllo stampante** — temperatura, velocità, ventole, console G-code
- **Notifiche** — 7 canali (Telegram, Discord, e-mail, ntfy, Pushover, SMS, webhook)
- **Multi-stampante** — supporta l'intera gamma Bambu Lab: X1C, X1E, P1S, P1P, P2S, A1, A1 mini, A1 Combo, H2S, H2D, H2C e altri
- **Self-hosted** — nessuna dipendenza dal cloud, i tuoi dati sulla tua macchina

## Avvio rapido

| Attività | Collegamento |
|----------|-------------|
| Installa il dashboard | [Installazione](./kom-i-gang/installasjon) |
| Configura la prima stampante | [Configurazione](./kom-i-gang/oppsett) |
| Connetti a Bambu Cloud | [Bambu Cloud](./kom-i-gang/bambu-cloud) |
| Esplora tutte le funzionalità | [Funzionalità](./funksjoner/oversikt) |
| Documentazione API | [API](./avansert/api) |

:::tip Modalità demo
Puoi provare il dashboard senza una stampante fisica eseguendo `npm run demo`. Questo avvia 3 stampanti simulate con cicli di stampa in tempo reale.
:::

## Stampanti supportate

- **Serie X1**: X1C, X1C Combo, X1E
- **Serie P1**: P1S, P1S Combo, P1P
- **Serie P2**: P2S, P2S Combo
- **Serie A**: A1, A1 Combo, A1 mini
- **Serie H2**: H2S, H2D (doppio ugello), H2C (cambiatesta, 6 teste)

## Panoramica tecnica

Bambu Dashboard è costruito con Node.js 22 e vanilla HTML/CSS/JS — nessun framework pesante, nessuna fase di build. Il database è SQLite, integrato in Node.js 22. Vedi [Architettura](./avansert/arkitektur) per i dettagli.
