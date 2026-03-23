---
sidebar_position: 5
title: Essiccazione del filamento
description: Perché, quando e come essiccare il filamento — temperature, tempi e consigli di conservazione per tutti i materiali
---

# Essiccazione del filamento

Il filamento umido è una delle cause più comuni e sottovalutate delle stampe di scarsa qualità. Anche il filamento che sembra asciutto può aver assorbito abbastanza umidità da rovinare il risultato — soprattutto per materiali come nylon e PVA.

## Perché essiccare il filamento?

Molti tipi di plastica sono **igroscopici** — assorbono umidità dall'aria nel tempo. Quando il filamento umido passa attraverso l'ugello caldo, l'acqua evapora improvvisamente e crea microbolle nella plastica fusa. Il risultato è:

- **Crepitii e scoppiettii** durante la stampa
- **Nebbia o vapore** visibili dall'ugello
- **Stringing e filamenti** che non si riescono a correggere
- **Superficie ruvida o granulosa** — specialmente sugli strati superiori
- **Parti deboli** con scarsa adesione tra strati e microincrinature
- **Finitura opaca o spumosa** su materiali che normalmente dovrebbero essere lucidi o con effetto seta

:::warning Essiccare il filamento PRIMA di regolare le impostazioni
Molti passano ore a modificare retract e temperatura senza vedere miglioramenti — perché la causa è il filamento umido. Asciugare sempre il filamento e testare nuovamente prima di modificare le impostazioni di stampa.
:::

## Quali materiali richiedono l'essiccazione?

Tutti i tipi di plastica possono diventare umidi, ma il grado di igroscopicità varia enormemente:

| Materiale | Igroscopico | Temperatura di essiccazione | Tempo | Priorità |
|---|---|---|---|---|
| PLA | Basso | 45–50 °C | 4–6 ore | Opzionale |
| PETG | Medio | 65 °C | 4–6 ore | Consigliato |
| ABS | Medio | 65–70 °C | 4 ore | Consigliato |
| TPU | Medio | 50–55 °C | 4–6 ore | Consigliato |
| ASA | Medio | 65 °C | 4 ore | Consigliato |
| PC | Alto | 70–80 °C | 6–8 ore | Richiesto |
| PA/Nylon | Estremamente alto | 70–80 °C | 8–12 ore | RICHIESTO |
| PA-CF | Estremamente alto | 70–80 °C | 8–12 ore | RICHIESTO |
| PVA | Estremamente alto | 45–50 °C | 4–6 ore | RICHIESTO |

:::tip Nylon e PVA sono critici
PA/Nylon e PVA possono assorbire abbastanza umidità da diventare non stampabili in **poche ore** in un normale ambiente interno. Non aprire mai una nuova bobina di questi materiali senza essiccarla subito dopo — e stampare sempre da una scatola chiusa o dall'essiccatore.
:::

## Segni di filamento umido

Non è sempre necessario essiccare il filamento seguendo una tabella. Imparare a riconoscere i sintomi:

| Sintomo | Umidità? | Altre possibili cause |
|---|---|---|
| Crepitii/scoppiettii | Sì, molto probabile | Ugello parzialmente bloccato |
| Nebbia/vapore dall'ugello | Sì, quasi certo | Nessun'altra causa |
| Superficie ruvida e granulosa | Sì, possibile | Temp troppo bassa, velocità troppo alta |
| Stringing che non scompare | Sì, possibile | Retract errato, temp troppo alta |
| Parti deboli e fragili | Sì, possibile | Temp troppo bassa, infill errato |
| Cambio colore o finitura opaca | Sì, possibile | Temp errata, plastica bruciata |

## Metodi di essiccazione

### Essiccatore per filamento (consigliato)

Gli essiccatori dedicati per filamento sono la soluzione più semplice e sicura. Mantengono una temperatura precisa e consentono di stampare direttamente dall'essiccatore durante tutto il lavoro.

Modelli popolari:
- **eSun eBOX** — economico, permette di stampare dalla scatola, supporta la maggior parte dei materiali
- **Bambu Lab Filament Dryer** — ottimizzato per Bambu AMS, supporta alte temperature
- **Polymaker PolyDryer** — buon termometro e buon controllo della temperatura
- **Sunlu S2 / S4** — economico, più bobine contemporaneamente

Procedura:
```
1. Inserire le bobine nell'essiccatore
2. Impostare la temperatura dalla tabella sopra
3. Impostare il timer al tempo consigliato
4. Attendere — non interrompere il processo
5. Stampare direttamente dall'essiccatore o confezionare immediatamente
```

### Disidratatore alimentare

Un comune disidratatore alimentare funziona sorprendentemente bene come essiccatore per filamento:

- Economico da acquistare (disponibili da ~30 €)
- Buona circolazione dell'aria
- Supporta temperature fino a 70–75 °C su molti modelli

:::warning Verificare la temperatura massima del proprio disidratatore
Molti disidratatori alimentari economici hanno termostati imprecisi e possono variare di ±10 °C. Misurare la temperatura effettiva con un termometro per PA e PC che richiedono calore elevato.
:::

### Forno

Il forno può essere usato in emergenza, ma richiede cautela:

:::danger Non usare MAI il forno normale sopra i 60 °C per il PLA — si deforma!
Il PLA inizia ad ammorbidirsi già a 55–60 °C. Un forno caldo può distruggere le bobine, sciogliere il nucleo e rendere il filamento inutilizzabile. Non usare mai il forno per il PLA a meno che non si sappia che la temperatura è calibrata con precisione e rimane sotto i 50 °C.
:::

Per materiali che tollerano temperature più alte (ABS, ASA, PA, PC):
```
1. Preriscaldare il forno alla temperatura desiderata
2. Usare un termometro per verificare la temperatura effettiva
3. Posizionare le bobine su una griglia (non direttamente sul fondo del forno)
4. Lasciare lo sportello socchiuso per far uscire l'umidità
5. Monitorare la prima volta che si usa questo metodo
```

### Bambu Lab AMS

Bambu Lab AMS Lite e AMS Pro hanno una funzione di essiccazione integrata (basso calore + circolazione dell'aria). Questo non sostituisce l'essiccazione completa, ma mantiene asciutto il filamento già essiccato durante la stampa.

- AMS Lite: Essiccazione passiva — limita l'assorbimento di umidità, non essicca attivamente
- AMS Pro: Riscaldamento attivo — qualche essiccazione possibile, ma non efficace come un essiccatore dedicato

## Conservazione del filamento

La corretta conservazione dopo l'essiccazione è importante quanto il processo di essiccazione stesso:

### Soluzioni migliori

1. **Armadio asciutto con gel di silice** — armadio dedicato con igrometro e essiccante. Mantiene l'umidità stabilmente bassa (sotto il 20% RH idealmente)
2. **Buste sottovuoto** — aspirare l'aria e sigillare con essiccante all'interno. Conservazione a lungo termine più economica
3. **Buste zip con essiccante** — semplice ed efficace per periodi più brevi

### Gel di silice e essiccante

- **Gel di silice blu/arancione** indica il grado di saturazione — sostituire o rigenerare (asciugare in forno a 120 °C) quando il colore cambia
- **Gel di silice in perle** è più efficace del granulato
- **Bustine di essiccante** dei produttori di filamento possono essere rigenerate e riutilizzate

### Igrometro nella scatola di conservazione

Un economico igrometro digitale mostra l'umidità relativa attuale nella scatola:

| Umidità relativa (RH) | Stato |
|---|---|
| Sotto il 15% | Ideale |
| 15–30% | Buono per la maggior parte dei materiali |
| 30–50% | Accettabile per PLA e PETG |
| Oltre il 50% | Problematico — specialmente per PA, PVA, PC |

## Consigli pratici

- **Essiccare PRIMA della stampa** — il filamento essiccato può tornare umido in pochi giorni in un normale ambiente interno
- **Stampare dall'essiccatore** per PA, PC e PVA — non solo essiccare e riporre
- **Bobina nuova ≠ bobina asciutta** — i produttori sigillano con essiccante, ma la catena di stoccaggio può aver avuto problemi. Asciugare sempre le nuove bobine di materiali igroscopici
- **Etichettare le bobine essiccate** con la data di essiccazione
- **Tubo PTFE dedicato** dall'essiccatore alla stampante minimizza l'esposizione durante la stampa

## Bambu Dashboard e stato essiccazione

Bambu Dashboard consente di registrare informazioni sul filamento, inclusa la data dell'ultima essiccazione, nei profili filamento. Usare questa funzione per tenere traccia di quali bobine sono state essiccate di recente e quali necessitano di un nuovo ciclo.
