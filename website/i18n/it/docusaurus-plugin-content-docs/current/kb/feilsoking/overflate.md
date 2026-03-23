---
sidebar_position: 4
title: Difetti di superficie
description: Diagnosi e correzione dei problemi superficiali comuni — blobs, zits, linee di strato, elephant foot e altro
---

# Difetti di superficie

La superficie di una stampa 3D rivela molto su cosa sta accadendo all'interno del sistema. La maggior parte dei difetti superficiali ha una o due cause chiare — con la diagnosi corretta sono sorprendentemente semplici da correggere.

## Panoramica rapida della diagnosi

| Sintomo | Causa più comune | Prima azione |
|---|---|---|
| Blobs e zits | Sovra-estrusione, posizionamento seam | Regolare seam, calibrare flusso |
| Linee di strato visibili | Z-wobble, strati troppo spessi | Passare a strati più fini, controllare asse Z |
| Elephant foot | Primo strato troppo largo | Elephant foot compensation |
| Ringing/ghosting | Vibrazioni ad alta velocità | Ridurre velocità, attivare input shaper |
| Sotto-estrusione | Ugello bloccato, temperatura troppo bassa | Pulire ugello, aumentare temperatura |
| Sovra-estrusione | Portata troppo alta | Calibrare portata |
| Pillowing | Troppo pochi strati superiori, raffreddamento insufficiente | Aumentare strati superiori, aumentare ventola |
| Delaminazione | Temperatura troppo bassa, raffreddamento eccessivo | Aumentare temperatura, ridurre ventola |

---

## Blobs e zits

I blobs sono grumi irregolari sulla superficie. Gli zits sono punti simili a punti — spesso lungo la linea di giunzione (seam).

### Cause

- **Sovra-estrusione** — troppa plastica viene estrusa e viene spinta di lato
- **Posizionamento seam scadente** — il seam "nearest" standard raccoglie tutte le transizioni nello stesso posto
- **Problemi di retract** — retract insufficiente causa accumulo di pressione nell'ugello
- **Filamento umido** — l'umidità crea microbolle e gocciolamento

### Soluzioni

**Impostazioni seam in Bambu Studio:**
```
Bambu Studio → Qualità → Seam position
- Aligned: Tutti i seam nello stesso posto (visibile, ma ordinato)
- Nearest: Punto più vicino (distribuisce i blobs casualmente)
- Back: Dietro l'oggetto (consigliato per qualità visiva)
- Random: Distribuzione casuale (camuffa meglio il seam)
```

**Calibrazione portata:**
```
Bambu Studio → Calibrazione → Flow rate
Regolare in passi di ±2% finché i blobs scompaiono
```

:::tip Seam su "Back" per qualità visiva
Posizionare il seam sul retro dell'oggetto in modo che sia meno visibile. Combinare con "Wipe on retract" per una finitura seam più pulita.
:::

---

## Linee di strato visibili

Tutte le stampe FDM hanno linee di strato, ma dovrebbero essere coerenti e appena visibili nelle stampe normali. Una visibilità anomala indica problemi concreti.

### Cause

- **Z-wobble** — l'asse Z vibra o non è dritto, creando un pattern ondulato su tutta l'altezza
- **Strati troppo spessi** — l'altezza dello strato superiore a 0,28 mm è percettibile anche nelle stampe perfette
- **Variazioni di temperatura** — temperatura di fusione inconsistente causa larghezze di strato variabili
- **Diametro del filamento inconsistente** — filamento economico con diametro variabile

### Soluzioni

**Z-wobble:**
- Verificare che la vite (Z-leadscrew) sia pulita e lubrificata
- Controllare che la vite non sia piegata (ispezione visiva durante la rotazione)
- Vedere l'articolo di manutenzione sulla [lubrificazione dell'asse Z](/docs/kb/vedlikehold/smoring)

**Altezza strato:**
- Passare a 0,12 mm o 0,16 mm per una superficie più uniforme
- Ricordare che dimezzare l'altezza dello strato raddoppia il tempo di stampa

**Variazioni di temperatura:**
- Usare la calibrazione PID (disponibile tramite il menu manutenzione di Bambu Studio)
- Evitare correnti d'aria che raffreddano l'ugello durante la stampa

---

## Elephant foot

L'elephant foot si verifica quando il primo strato è più largo del resto dell'oggetto — come se l'oggetto si "allargasse" alla base.

### Cause

- Il primo strato viene schiacciato troppo forte contro il piatto (Z-offset troppo stretto)
- Temperatura del piano troppo alta che mantiene la plastica morbida e fluida troppo a lungo
- Raffreddamento insufficiente del primo strato che dà alla plastica più tempo per espandersi

### Soluzioni

**Elephant foot compensation in Bambu Studio:**
```
Bambu Studio → Qualità → Elephant foot compensation
Iniziare con 0,1–0,2 mm e regolare finché il piede scompare
```

**Z-offset:**
- Ricalibrate l'altezza del primo strato
- Aumentare Z-offset di 0,05 mm alla volta finché il piede è scomparso

**Temperatura del piano:**
- Ridurre la temperatura del piano di 5–10 °C
- Per PLA: 55 °C è spesso sufficiente — 65 °C può causare elephant foot

:::warning Non compensare troppo
Una compensazione elephant foot troppo alta può creare uno spazio tra il primo strato e il resto. Regolare con cautela in passi di 0,05 mm.
:::

---

## Ringing e ghosting

Il ringing (chiamato anche "ghosting" o "echoing") è un pattern ondulato sulla superficie subito dopo spigoli o angoli acuti. Il pattern "echeggia" dal bordo.

### Cause

- **Vibrazioni** — la rapida accelerazione e decelerazione agli angoli trasmette vibrazioni attraverso il telaio
- **Velocità troppo alta** — specialmente la velocità della parete esterna oltre 100 mm/s causa ringing marcato
- **Parti allentate** — bobina allentata, supporto cavo vibrante o stampante montata in modo instabile

### Soluzioni

**Bambu Lab input shaper (Resonance Compensation):**
```
Bambu Studio → Stampante → Resonance compensation
Bambu Lab X1C e P1S hanno accelerometro integrato e si auto-calibrano
```

**Ridurre velocità:**
```
Parete esterna: Ridurre a 60–80 mm/s
Accelerazione: Ridurre dallo standard a 3000–5000 mm/s²
```

**Controllo meccanico:**
- Verificare che la stampante si trovi su una superficie stabile
- Verificare che la bobina non vibri nel suo supporto
- Stringere tutte le viti accessibili sui pannelli esterni del telaio

:::tip X1C e P1S auto-calibrano il ringing
Bambu Lab X1C e P1S hanno una calibrazione accelerometrica integrata che si avvia automaticamente all'accensione. Eseguire "Full calibration" dal menu manutenzione se il ringing appare dopo un periodo.
:::

---

## Sotto-estrusione

La sotto-estrusione si verifica quando la stampante estrude troppo poca plastica. Il risultato sono pareti sottili e deboli, fori visibili tra gli strati e una superficie "scraggly".

### Cause

- **Ugello parzialmente bloccato** — l'accumulo di carbonio riduce il flusso
- **Temperatura dell'ugello troppo bassa** — la plastica non è abbastanza fluida
- **Ingranaggio usurato** nel meccanismo dell'estrusore che non afferra bene il filamento
- **Velocità troppo alta** — l'estrusore non riesce a tenere il passo con il flusso desiderato

### Soluzioni

**Cold pull (estrazione a freddo):**
```
1. Riscaldare l'ugello a 220 °C
2. Spingere manualmente il filamento
3. Raffreddare l'ugello a 90 °C (PLA) mantenendo la pressione
4. Estrarre rapidamente il filamento
5. Ripetere finché ciò che viene estratto è pulito
```

**Regolazione temperatura:**
- Aumentare la temperatura dell'ugello di 5–10 °C e testare nuovamente
- La stampa a temperatura troppo bassa è una causa comune di sotto-estrusione

**Calibrazione portata:**
```
Bambu Studio → Calibrazione → Flow rate
Aumentare gradualmente finché la sotto-estrusione scompare
```

**Controllare l'ingranaggio dell'estrusore:**
- Rimuovere il filamento e ispezionare l'ingranaggio
- Pulire con un piccolo spazzolino se c'è polvere di filamento nei denti

---

## Sovra-estrusione

La sovra-estrusione produce un cordone troppo largo — la superficie appare allentata, lucida o irregolare, con tendenza ai blobs.

### Cause

- **Portata troppo alta** (EM — Extrusion Multiplier)
- **Diametro filamento errato** — filamento da 2,85 mm con profilo 1,75 mm causa enorme sovra-estrusione
- **Temperatura ugello troppo alta** rende la plastica troppo fluida

### Soluzioni

**Calibrazione portata:**
```
Bambu Studio → Calibrazione → Flow rate
Ridurre in passi del 2% finché la superficie è uniforme e opaca
```

**Verificare il diametro del filamento:**
- Misurare il diametro effettivo del filamento con un calibro in 5–10 punti lungo il filamento
- Una deviazione media superiore a 0,05 mm indica filamento di bassa qualità

---

## Pillowing

Il pillowing è la formazione di strati superiori irregolari e a bolle con "cuscini" di plastica tra gli strati superiori. Particolarmente evidente con infill basso e troppo pochi strati superiori.

### Cause

- **Troppo pochi strati superiori** — la plastica sopra l'infill collassa nei fori
- **Raffreddamento insufficiente** — la plastica non si solidifica abbastanza velocemente da fare ponte sui fori dell'infill
- **Infill troppo basso** — i grandi fori nell'infill sono difficili da coprire

### Soluzioni

**Aumentare il numero di strati superiori:**
```
Bambu Studio → Qualità → Top shell layers
Minimo: 4 strati
Consigliato per superficie uniforme: 5–6 strati
```

**Aumentare il raffreddamento:**
- PLA dovrebbe avere la ventola al 100% dal 3° strato
- Il raffreddamento insufficiente è la causa più comune del pillowing

**Aumentare l'infill:**
- Passare dal 10–15% al 20–25% se il pillowing persiste
- Il pattern gyroid offre una superficie di ponte più uniforme rispetto alle linee

:::tip Ironing
La funzione "ironing" di Bambu Studio fa passare l'ugello sullo strato superiore una volta in più per livellare la superficie. Attivare in Qualità → Ironing per la miglior finitura dello strato superiore.
:::

---

## Delaminazione degli strati (Layer separation / delamination)

La delaminazione avviene quando gli strati non aderiscono correttamente tra loro. Nel peggiore dei casi la stampa si spezza lungo le linee degli strati.

### Cause

- **Temperatura ugello troppo bassa** — la plastica non si fonde abbastanza bene nello strato sottostante
- **Raffreddamento eccessivo** — la plastica si solidifica troppo rapidamente prima di fondersi
- **Spessore strato troppo alto** — oltre l'80% del diametro dell'ugello produce una scarsa fusione
- **Velocità troppo alta** — riduzione del tempo di fusione per mm di percorso

### Soluzioni

**Aumentare la temperatura:**
- Provare +10 °C dallo standard e osservare
- ABS e ASA sono particolarmente sensibili — richiedono riscaldamento controllato della camera

**Ridurre il raffreddamento:**
- ABS: ventola SPENTA (0%)
- PETG: massimo 20–40%
- PLA: può tollerare il raffreddamento completo, ma ridurre se si verifica delaminazione

**Spessore strato:**
- Usare massimo il 75% del diametro dell'ugello
- Con ugello da 0,4 mm: altezza strato massima consigliata è 0,30 mm

**Verificare che la camera sia abbastanza calda (ABS/ASA/PA/PC):**
```
Bambu Lab X1C/P1S: Lasciare che la camera si riscaldi a 40–60 °C
prima che la stampa inizi — non aprire lo sportello durante la stampa
```

---

## Consigli generali per la risoluzione dei problemi

1. **Cambiare una cosa alla volta** — testare con una piccola stampa di calibrazione tra ogni modifica
2. **Asciugare prima il filamento** — molti difetti superficiali sono in realtà sintomi di umidità
3. **Pulire l'ugello** — un'ostruzione parziale produce difetti superficiali inconsistenti difficili da diagnosticare
4. **Eseguire una calibrazione completa** dal menu manutenzione di Bambu Studio dopo modifiche importanti
5. **Usare Bambu Dashboard** per tracciare quali impostazioni hanno dato i migliori risultati nel tempo
