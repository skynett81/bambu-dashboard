---
sidebar_position: 1
title: Benvenuto in Bambu Dashboard
description: Un potente dashboard self-hosted per le stampanti 3D Bambu Lab
---

# Benvenuto in Bambu Dashboard

[![ko-fi](https://ko-fi.com/img/githubbutton_sm.svg)](https://ko-fi.com/V7V21NRKM7)

**Bambu Dashboard** è un pannello di controllo self-hosted e completo per le stampanti 3D Bambu Lab. Offre visibilità e controllo completi sulla stampante, sull'inventario dei filamenti, sulla cronologia di stampa e altro ancora — tutto da un'unica scheda del browser.

## Cos'è Bambu Dashboard?

Bambu Dashboard si connette direttamente alla tua stampante tramite MQTT su LAN, senza dipendenza dai server di Bambu Lab. Puoi anche connetterti a Bambu Cloud per la sincronizzazione di modelli e cronologia di stampa.

### Funzionalità principali

- **Dashboard live** — temperatura in tempo reale, avanzamento, fotocamera, stato AMS con indicatore LIVE
- **Inventario filamenti** — traccia tutte le bobine con sincronizzazione AMS, supporto bobina EXT, info materiale, compatibilità piano e guida all'essiccazione
- **Tracciamento filamenti** — tracciamento accurato con 4 livelli di fallback (sensore AMS → stima EXT → cloud → durata)
- **Guida materiali** — 15 materiali con temperature, compatibilità piano, essiccazione, proprietà e consigli
- **Cronologia di stampa** — registro completo con nomi dei modelli, link MakerWorld, consumo di filamento e costi
- **Pianificatore** — vista calendario, coda di stampa con bilanciamento del carico e verifica del filamento
- **Controllo stampante** — temperatura, velocità, ventole, console G-code
- **Print Guard** — protezione automatica con xcam + 5 monitor sensori
- **Stimatore costi** — materiale, elettricità, manodopera, usura, margine con prezzo di vendita suggerito
- **Manutenzione** — tracciamento con intervalli basati su KB, durata dell'ugello, durata del piano e guida
- **Avvisi sonori** — 9 eventi configurabili con caricamento audio personalizzato e altoparlante della stampante (M300)
- **Registro attività** — timeline persistente di tutti gli eventi (stampe, errori, manutenzione, filamento)
- **Notifiche** — 7 canali (Telegram, Discord, e-mail, ntfy, Pushover, SMS, webhook)
- **Multi-stampante** — supporta l'intera gamma Bambu Lab
- **17 lingue** — norvegese, inglese, tedesco, francese, spagnolo, italiano, giapponese, coreano, olandese, polacco, portoghese, svedese, turco, ucraino, cinese, ceco, ungherese
- **Self-hosted** — nessuna dipendenza dal cloud, i tuoi dati sulla tua macchina

### Novità della v1.1.13

- **Rilevamento bobina EXT** per P2S/A1 tramite campo di mapping MQTT — consumo di filamento tracciato correttamente per bobina esterna
- **Database materiali filamento** con 15 materiali, compatibilità piano, guida all'essiccazione e proprietà
- **Pannello di manutenzione** con intervalli basati su KB, 4 nuovi tipi di ugelli, scheda guida con link alla documentazione
- **Avvisi sonori** con 9 eventi, caricamento personalizzato (MP3/OGG/WAV, max 10 s), controllo del volume e altoparlante della stampante
- **Registro attività** — timeline persistente da tutti i database, indipendentemente dal fatto che la pagina fosse aperta
- **Codici di errore HMS** con descrizioni leggibili da oltre 270 codici
- **i18n completo** — tutte le 2944 chiavi tradotte in 17 lingue
- **Documentazione auto-generata** — la documentazione viene generata automaticamente all'installazione e all'avvio del server

## Avvio rapido

| Attività | Collegamento |
|----------|-------------|
| Installa il dashboard | [Installazione](./kom-i-gang/installasjon) |
| Configura la prima stampante | [Configurazione](./kom-i-gang/oppsett) |
| Connetti a Bambu Cloud | [Bambu Cloud](./kom-i-gang/bambu-cloud) |
| Esplora tutte le funzionalità | [Funzionalità](./funksjoner/oversikt) |
| Guida filamenti | [Guida materiali](./kb/filamenter/guide) |
| Guida alla manutenzione | [Manutenzione](./kb/vedlikehold/dyse) |
| Documentazione API | [API](./avansert/api) |

:::tip Modalità demo
Puoi provare il dashboard senza una stampante fisica eseguendo `npm run demo`. Questo avvia 3 stampanti simulate con cicli di stampa in tempo reale.
:::

## Stampanti supportate

Tutte le stampanti Bambu Lab con modalità LAN:

- **Serie X1**: X1C, X1C Combo, X1E
- **Serie P1**: P1S, P1S Combo, P1P
- **Serie P2**: P2S, P2S Combo
- **Serie A**: A1, A1 Combo, A1 mini
- **Serie H2**: H2S, H2D (doppio ugello), H2C (cambiatesta, 6 teste)

## Funzionalità in dettaglio

### Tracciamento filamenti

Il dashboard traccia automaticamente il consumo di filamento con un fallback a 4 livelli:

1. **Diff sensore AMS** — il più accurato, confronta remain% di inizio/fine
2. **EXT diretto** — per P2S/A1 senza vt_tray, usa stima cloud
3. **Stima cloud** — dai dati del lavoro di stampa di Bambu Cloud
4. **Stima per durata** — ~30 g/ora come ultimo fallback

Tutti i valori vengono mostrati come il minimo tra sensore AMS e database bobine per evitare errori dopo stampe fallite.

### Guida materiali

Database integrato con 15 materiali che include:
- Temperature (ugello, piano, camera)
- Compatibilità piano (Cool, Engineering, High Temp, Textured PEI)
- Informazioni sull'essiccazione (temperatura, tempo, igroscopicità)
- 8 proprietà (resistenza, flessibilità, resistenza al calore, UV, superficie, facilità d'uso)
- Livello di difficoltà e requisiti speciali (ugello indurito, enclosure)

### Avvisi sonori

9 eventi configurabili con supporto per:
- **Clip audio personalizzate** — carica MP3/OGG/WAV (max 10 secondi, 500 KB)
- **Toni integrati** — suoni metallici/synth generati con Web Audio API
- **Altoparlante della stampante** — melodie G-code M300 direttamente sul buzzer della stampante
- **Conto alla rovescia** — avviso sonoro quando manca 1 minuto alla fine della stampa

### Manutenzione

Sistema di manutenzione completo con:
- Tracciamento componenti (ugello, tubo PTFE, aste, cuscinetti, AMS, piano, essiccazione)
- Intervalli basati su KB dalla documentazione
- Durata dell'ugello per tipo (ottone, acciaio indurito, HS01)
- Durata del piano per tipo (Cool, Engineering, High Temp, Textured PEI)
- Scheda guida con consigli e link alla documentazione completa

## Panoramica tecnica

Bambu Dashboard è costruito con Node.js 22 e vanilla HTML/CSS/JS — nessun framework pesante, nessuna fase di build. Il database è SQLite, integrato in Node.js 22.

- **Backend**: Node.js 22 con solo 3 pacchetti npm (mqtt, ws, basic-ftp)
- **Frontend**: Vanilla HTML/CSS/JS, nessuna fase di build
- **Database**: SQLite tramite il built-in di Node.js 22 `--experimental-sqlite`
- **Documentazione**: Docusaurus con 17 lingue, generata automaticamente all'installazione
- **API**: 177+ endpoint, documentazione OpenAPI su `/api/docs`

Vedi [Architettura](./avansert/arkitektur) per i dettagli.
