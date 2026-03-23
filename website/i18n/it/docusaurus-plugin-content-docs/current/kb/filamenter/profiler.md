---
sidebar_position: 8
title: Profili di stampa e impostazioni
description: Comprendere e personalizzare i profili di stampa in Bambu Studio — velocità, temperatura, retract e impostazioni qualità
---

# Profili di stampa e impostazioni

Un profilo di stampa è una raccolta di impostazioni che determinano esattamente come lavora la stampante — dalla temperatura e velocità al retract e all'altezza dello strato. Il profilo giusto fa la differenza tra una stampa perfetta e una fallita.

## Cos'è un profilo di stampa?

Bambu Studio distingue tre tipi di profili:

- **Profilo filamento** — temperatura, raffreddamento, retract ed essiccazione per un materiale specifico
- **Profilo processo** — altezza strato, velocità, infill e impostazioni supporto
- **Profilo stampante** — impostazioni specifiche della macchina (impostate automaticamente per le stampanti Bambu Lab)

Bambu Studio fornisce profili generici per tutti i filamenti Bambu Lab e una serie di materiali di terze parti. Fornitori di terze parti come Polyalkemi, eSUN e Fillamentum creano inoltre profili ottimizzati specificamente per i loro filamenti.

I profili possono essere importati, esportati e condivisi liberamente tra gli utenti.

## Importare profili in Bambu Studio

1. Scaricare il profilo (file JSON) dal sito del fornitore o da MakerWorld
2. Aprire Bambu Studio
3. Andare a **File → Importa → Importa configurazione**
4. Selezionare il file scaricato
5. Il profilo apparirà nella selezione filamento nello slicer

:::tip Organizzazione
Dare ai profili un nome descrittivo, es. «Polyalkemi PLA HF 0.20mm Balanced», in modo da trovare facilmente il profilo giusto la prossima volta.
:::

## Impostazioni importanti spiegate

### Temperatura

La temperatura è l'impostazione singola più importante. Una temperatura troppo bassa produce scarsa adesione tra gli strati e sottoriempimento. Una troppo alta produce stringing, superficie a bolle e filamento bruciato.

| Impostazione | Descrizione | PLA tipico | PETG tipico | ABS tipico |
|---|---|---|---|---|
| Temperatura ugello | Temperatura di fusione | 200–220 °C | 230–250 °C | 240–260 °C |
| Temperatura piano | Riscaldamento piatto di stampa | 55–65 °C | 70–80 °C | 90–110 °C |
| Temperatura camera | Temp chiusura | Non necessaria | Opzionale | 40–60 °C consigliato |

Bambu Lab X1C e la serie P1 dispongono della funzione di riscaldamento attivo della camera. Per ABS e ASA questo è fondamentale per evitare warping e delaminazione.

### Velocità

Le stampanti Bambu Lab possono funzionare a velocità estremamente elevate, ma una velocità più alta non significa sempre risultati migliori. È soprattutto la velocità della parete esterna che influisce sulla superficie.

| Impostazione | Cosa influisce | Modalità qualità | Bilanciata | Veloce |
|---|---|---|---|---|
| Parete esterna | Risultato superficiale | 45–60 mm/s | 100 mm/s | 150+ mm/s |
| Parete interna | Resistenza strutturale | 100 mm/s | 150 mm/s | 200+ mm/s |
| Infill | Riempimento interno | 150 mm/s | 200 mm/s | 300+ mm/s |
| Strati superiori | Superficie superiore | 45–60 mm/s | 80 mm/s | 100 mm/s |
| Strati inferiori | Primo strato | 30–50 mm/s | 50 mm/s | 50 mm/s |

:::tip La velocità della parete esterna è la chiave della qualità superficiale
Ridurre la velocità della parete esterna a 45–60 mm/s per una finitura setosa. Questo vale specialmente per Silk PLA e filamenti Matte. Le pareti interne e l'infill possono continuare a funzionare velocemente senza che la superficie ne risenta.
:::

### Retract (ritiro)

Il retract tira leggermente il filamento nell'ugello quando la stampante si sposta senza estrudere. Questo previene lo stringing (fili sottili tra le parti). Impostazioni retract errate producono stringing (troppo poco) o jamming (troppo).

| Materiale | Distanza retract | Velocità retract | Nota |
|---|---|---|---|
| PLA | 0,8–2,0 mm | 30–50 mm/s | Standard per la maggior parte |
| PETG | 1,0–3,0 mm | 20–40 mm/s | Troppo = jamming |
| ABS | 0,5–1,5 mm | 30–50 mm/s | Simile a PLA |
| TPU | 0–1,0 mm | 10–20 mm/s | Minimale! O disattivare |
| Nylon | 1,0–2,0 mm | 30–40 mm/s | Richiede filamento asciutto |

:::warning Retract TPU
Per TPU e altri materiali flessibili: usare retract minimo (0–1 mm) o disattivare completamente. Troppo retract fa sì che il filamento morbido si pieghi e si blocchi nel tubo Bowden, causando jamming.
:::

### Altezza strato

L'altezza dello strato determina il bilanciamento tra livello di dettaglio e velocità di stampa. Un'altezza strato bassa produce dettagli più fini e superfici più lisce, ma richiede molto più tempo.

| Altezza strato | Descrizione | Applicazione |
|---|---|---|
| 0,08 mm | Ultra-fine | Miniature, modelli dettagliati |
| 0,12 mm | Fine | Qualità visiva, testi, loghi |
| 0,16 mm | Alta qualità | Standard per la maggior parte delle stampe |
| 0,20 mm | Bilanciato | Buon equilibrio tempo/qualità |
| 0,28 mm | Veloce | Parti funzionali, prototipi |

Bambu Studio opera con impostazioni processo come «0.16mm High Quality» e «0.20mm Balanced Quality» — queste impostano l'altezza strato e adattano automaticamente velocità e raffreddamento.

### Infill (riempimento)

L'infill determina quanto materiale riempie l'interno della stampa. Più infill = più resistente, più pesante e più tempo di stampa.

| Percentuale | Applicazione | Pattern consigliato |
|---|---|---|
| 10–15% | Decorazione, visivo | Gyroid |
| 20–30% | Uso generale | Cubic, Gyroid |
| 40–60% | Parti funzionali | Cubic, Honeycomb |
| 80–100% | Resistenza massima | Rectilinear |

:::tip Gyroid è il re
Il pattern gyroid offre il miglior rapporto resistenza/peso ed è isotropico — ugualmente resistente in tutte le direzioni. È anche più veloce da stampare rispetto all'honeycomb e ha un bell'aspetto nei modelli aperti. Scelta standard per la maggior parte delle situazioni.
:::

## Consigli profilo per materiale

### PLA — focus qualità

PLA è indulgente e facile da lavorare. Focus sulla qualità superficiale:

- **Parete esterna:** 60 mm/s per superficie perfetta, specialmente con Silk PLA
- **Ventola raffreddamento:** 100% dopo il 3° strato — critico per dettagli nitidi e ponti
- **Brim:** Non necessario su PLA puro con piatto correttamente calibrato
- **Altezza strato:** 0,16 mm High Quality offre un buon equilibrio per le parti decorative

### PETG — bilanciamento

PETG è più resistente del PLA, ma più impegnativo da ottimizzare:

- **Impostazione processo:** 0,16 mm High Quality o 0,20 mm Balanced Quality
- **Ventola raffreddamento:** 30–50% — troppo raffreddamento produce scarsa adesione e stampe fragili
- **Z-hop:** Attivare per evitare che l'ugello strisci sulla superficie durante i movimenti di traslazione
- **Stringing:** Regolare retract e stampare un po' più caldo piuttosto che più freddo

### ABS — la camera è tutto

ABS stampa bene, ma richiede un ambiente controllato:

- **Ventola raffreddamento:** SPENTA (0%) — assolutamente critico! Il raffreddamento causa delaminazione e warping
- **Camera:** Chiudere gli sportelli e lasciare che la camera si riscaldi a 40–60 °C prima dell'inizio della stampa
- **Brim:** 5–8 mm consigliato per parti grandi e piatte — evita warping negli angoli
- **Ventilazione:** Assicurare buona ventilazione nella stanza — ABS emette vapori di stirene

### TPU — lento e con cautela

I materiali flessibili richiedono un approccio completamente diverso:

- **Velocità:** Max 30 mm/s — la stampa troppo veloce fa piegare il filamento
- **Retract:** Minimo (0–1 mm) o disattivare completamente
- **Direct drive:** TPU funziona solo sulle macchine Bambu Lab con direct drive integrato
- **Altezza strato:** 0,20 mm Balanced offre buona fusione tra strati senza troppa tensione

### Nylon — il filamento asciutto è tutto

Il nylon è igroscopico e assorbe umidità in poche ore:

- **Asciugare sempre:** 70–80 °C per 8–12 ore prima della stampa
- **Camera:** Stampare dalla scatola essiccatrice direttamente nell'AMS per mantenere asciutto il filamento
- **Retract:** Moderato (1,0–2,0 mm) — il nylon umido produce molto più stringing
- **Piatto di stampa:** Engineering Plate con colla, o piatto Garolite per la migliore adesione

## Preset Bambu Lab

Bambu Studio ha profili integrati per tutta la famiglia di prodotti Bambu Lab:

- Bambu Lab Basic PLA, PETG, ABS, TPU, PVA, PA, PC, ASA
- Materiali di supporto Bambu Lab (Support W, Support G)
- Bambu Lab Specialty (PLA-CF, PETG-CF, ABS-GF, PA-CF, PPA-CF, PPA-GF)
- Profili generici (Generic PLA, Generic PETG, ecc.) che fungono da punto di partenza per filamenti di terze parti

I profili generici sono un buon punto di partenza. Ottimizzare la temperatura con ±5 °C in base al filamento effettivo.

## Profili di terze parti

Molti fornitori leader offrono profili Bambu Studio pronti all'uso ottimizzati per i loro filamenti:

| Fornitore | Profili disponibili | Scarica |
|---|---|---|
| [Polyalkemi](https://polyalkemi.no) | PLA, PLA High Speed, PETG, PETG-CF, ABS | [Profili Bambu Lab](https://gammel.polyalkemi.no/bambulabprofiler/) |
| [eSUN](https://www.esun3d.com) | PLA+, ePLA-Lite, PETG, eABS | [Profili eSUN](https://www.esun3d.com/bambu-lab-3d-printer-filament-setting/) |
| [Fillamentum](https://fillamentum.com) | Nonoilen PLA, PLA, PET-G | [Profili Fillamentum](https://fillamentum.com/pages/bambu-lab-print-profiles) |
| [Spectrum](https://spectrumfilaments.com) | PETG FR V0, PETG-HT100 | [Profili Spectrum](https://spectrumfilaments.com/bambu-lab-profiles/) |
| [Fiberlogy](https://fiberlogy.com) | Easy-PETG, Matte-PETG, TPU 30D | [Profili Fiberlogy](https://fiberlogy.com/en/printing-profiles/) |
| [add:north](https://addnorth.com) | PLA, PETG, AduraX, X-PLA | [Profili add:north](https://addnorth.com/printing-profiles) |

:::info Dove trovare i profili?
- **Bambu Studio:** Profili integrati per materiali Bambu Lab e molte terze parti
- **Sito del fornitore:** Cercare «Bambu Studio profile» o «JSON profile» nella sezione download
- **Bambu Dashboard:** Nel pannello Profili di stampa nella sezione Strumenti
- **MakerWorld:** I profili vengono spesso condivisi insieme ai modelli da altri utenti
:::

## Esportare e condividere profili

I profili personali possono essere esportati e condivisi con altri:

1. Andare a **File → Esporta → Esporta configurazione**
2. Selezionare quali profili (filamento, processo, stampante) si vuole esportare
3. Salvare come file JSON
4. Condividere il file direttamente o caricarlo su MakerWorld

Questo è particolarmente utile se si è ottimizzato un profilo nel tempo e si vuole preservarlo in caso di reinstallazione di Bambu Studio.

---

## Risoluzione problemi con i profili

### Stringing

Fili sottili tra le parti stampate — provare in questo ordine:

1. Aumentare la distanza di retract di 0,5 mm
2. Ridurre la temperatura di stampa di 5 °C
3. Attivare «Wipe on retract»
4. Verificare che il filamento sia asciutto

### Sottoriempimento / fori nelle pareti

La stampa non sembra solida o ha fori:

1. Verificare che l'impostazione del diametro del filamento sia corretta (1,75 mm)
2. Calibrare il flow rate in Bambu Studio (Calibrazione → Flow Rate)
3. Aumentare la temperatura di 5 °C
4. Verificare la presenza di ostruzione parziale dell'ugello

### Scarsa adesione tra strati

Gli strati non si uniscono bene:

1. Aumentare la temperatura di 5–10 °C
2. Ridurre la ventola di raffreddamento (specialmente PETG e ABS)
3. Ridurre la velocità di stampa
4. Verificare che la camera sia abbastanza calda (per ABS/ASA)
