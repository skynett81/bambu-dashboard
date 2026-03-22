---
sidebar_position: 5
title: PWA
description: Installa Bambu Dashboard come Progressive Web App per un'esperienza simile a un'app, modalità offline e notifiche in background
---

# PWA (Progressive Web App)

Bambu Dashboard può essere installato come Progressive Web App (PWA) — un'esperienza simile a un'app direttamente dal browser, senza app store. Ottieni un accesso più rapido, notifiche push in background e funzionalità offline limitate.

## Installare come app

### Desktop (Chrome / Edge / Chromium)

1. Apri `https://localhost:3443` nel browser
2. Cerca l'icona **Installa** nella barra degli indirizzi (freccia in giù con icona schermo)
3. Clicca su di essa
4. Clicca **Installa** nella finestra di dialogo
5. Bambu Dashboard si apre come finestra separata senza UI del browser

In alternativa: clicca sui tre punti (⋮) → **Installa Bambu Dashboard...**

### Desktop (Firefox)

Firefox non supporta l'installazione PWA completa direttamente. Usa Chrome o Edge per la migliore esperienza.

### Mobile (Android – Chrome)

1. Apri **https://ip-del-tuo-server:3443** in Chrome
2. Tocca i tre punti → **Aggiungi alla schermata Home**
3. Dai un nome all'app e tocca **Aggiungi**
4. L'icona appare nella schermata Home — l'app si apre a schermo intero senza UI del browser

### Mobile (iOS – Safari)

1. Apri **https://ip-del-tuo-server:3443** in Safari
2. Tocca l'icona **Condividi** (quadrato con freccia in su)
3. Scorri verso il basso e seleziona **Aggiungi alla schermata Home**
4. Tocca **Aggiungi**

:::warning Limitazioni iOS
iOS ha supporto PWA limitato. Le notifiche push funzionano solo su iOS 16.4 e versioni successive. La modalità offline è limitata.
:::

## Modalità offline

La PWA memorizza nella cache le risorse necessarie per un utilizzo offline limitato:

| Funzione | Disponibile offline |
|---|---|
| Ultimo stato stampante noto | ✅ (dalla cache) |
| Cronologia stampe | ✅ (dalla cache) |
| Magazzino filamento | ✅ (dalla cache) |
| Stato in tempo reale (MQTT) | ❌ Richiede connessione |
| Feed camera | ❌ Richiede connessione |
| Inviare comandi alla stampante | ❌ Richiede connessione |

La visualizzazione offline mostra un banner in cima: «Connessione persa — visualizzazione ultimo stato noto».

## Notifiche push in background

La PWA può inviare notifiche push anche quando l'app non è aperta:

1. Apri la PWA
2. Vai a **Impostazioni → Notifiche → Browser Push**
3. Clicca **Abilita notifiche push**
4. Accetta la finestra di dialogo dei permessi
5. Le notifiche vengono consegnate al centro notifiche del sistema operativo

Le notifiche push funzionano per tutti gli eventi configurati in [Notifiche](../funksjoner/notifications).

:::info Service Worker
Le notifiche push richiedono che il browser sia in esecuzione in background (nessuno spegnimento completo del sistema). La PWA utilizza un Service Worker per la ricezione.
:::

## Icona e aspetto dell'app

La PWA utilizza automaticamente l'icona di Bambu Dashboard. Per personalizzare:

1. Vai a **Impostazioni → Sistema → PWA**
2. Carica un'icona personalizzata (minimo 512×512 px PNG)
3. Imposta il **Nome app** e il **Nome breve** (mostrato sotto l'icona su mobile)
4. Scegli il **Colore tema** per la barra di stato su mobile

## Aggiornare la PWA

La PWA si aggiorna automaticamente quando il server si aggiorna:

- Viene mostrato un banner discreto: «Nuova versione disponibile — clicca per aggiornare»
- Clicca sul banner per caricare la nuova versione
- Nessuna reinstallazione manuale necessaria
