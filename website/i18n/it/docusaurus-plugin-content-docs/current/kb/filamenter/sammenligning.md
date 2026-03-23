---
sidebar_position: 9
title: Confronto materiali
description: Confronta tutti i materiali per stampa 3D fianco a fianco — resistenza, temperatura, prezzo, difficoltà
---

# Confronto materiali

Scegliere il filamento giusto è importante quanto scegliere lo strumento giusto per un lavoro. Questo articolo ti dà il quadro completo — dalla semplice tabella comparativa alla durezza Shore, ai valori HDT e a una pratica guida decisionale.

## Grande tabella comparativa

| Materiale | Resistenza | Res-temp | Flessibilità | Res-UV | Res-chimica | Req-ugello | Camera | Difficoltà | Prezzo |
|---|---|---|---|---|---|---|---|---|---|
| PLA | ★★★ | ★ | ★ | ★ | ★ | Ottone | No | ★ Facile | Basso |
| PETG | ★★★ | ★★ | ★★ | ★★ | ★★★ | Ottone | No | ★★ | Basso |
| ABS | ★★★ | ★★★ | ★★ | ★ | ★★ | Ottone | SÌ | ★★★ | Basso |
| ASA | ★★★ | ★★★ | ★★ | ★★★★ | ★★ | Ottone | SÌ | ★★★ | Medio |
| TPU | ★★ | ★★ | ★★★★★ | ★★ | ★★ | Ottone | No | ★★★ | Medio |
| PA (Nylon) | ★★★★ | ★★★ | ★★★ | ★★ | ★★★★ | Ottone | SÌ | ★★★★ | Alto |
| PA-CF | ★★★★★ | ★★★★ | ★★ | ★★★ | ★★★★ | Acciaio ind. | SÌ | ★★★★ | Alto |
| PC | ★★★★ | ★★★★ | ★★ | ★★ | ★★★ | Ottone | SÌ | ★★★★ | Alto |
| PLA-CF | ★★★★ | ★★ | ★ | ★ | ★ | Acciaio ind. | No | ★★ | Medio |

**Legenda:**
- ★ = debole/basso/scarso
- ★★★ = medio/standard
- ★★★★★ = eccellente/migliore della categoria

---

## Scegliere il materiale giusto — guida decisionale

Non sai cosa scegliere? Seguire queste domande:

### Ha bisogno di resistere al calore?
**Sì** → ABS, ASA, PC o PA

- Poco calore (fino a ~90 °C): **ABS** o **ASA**
- Molto calore (oltre 100 °C): **PC** o **PA**
- Massima resistenza termica: **PC** (fino a ~120 °C) o **PA-CF** (fino a ~160 °C)

### Ha bisogno di flessibilità?
**Sì** → **TPU**

- Molto morbido (come gomma): TPU 85A
- Flessibile standard: TPU 95A
- Semi-flessibile: PETG o PA

### Verrà usato all'aperto?
**Sì** → **ASA** è la scelta ovvia

ASA è sviluppato specificamente per l'esposizione UV ed è superiore all'ABS all'esterno. PETG è la seconda scelta migliore se ASA non è disponibile.

### Ha bisogno di resistenza massima?
**Sì** → **PA-CF** o **PC**

- Composito leggero più resistente: **PA-CF**
- Termoplastica pura più resistente: **PC**
- Buona resistenza a prezzo inferiore: **PA (Nylon)**

### Stampa il più semplice possibile?
→ **PLA**

PLA è il materiale più indulgente esistente. Temperatura più bassa, nessun requisito di camera, piccolo rischio di warping.

### Contatto alimentare?
→ **PLA** (con riserve)

PLA non è tossico di per sé, ma:
- Usare ugello in acciaio inossidabile (non ottone — può contenere piombo)
- Le stampe FDM non sono mai "food-safe" a causa della superficie porosa — i batteri possono crescere
- Evitare ambienti difficili (acidi, acqua calda, lavastoviglie)
- PETG è un'alternativa migliore per il contatto monouso

---

## Durezza Shore spiegata

La durezza Shore viene utilizzata per descrivere la durezza e la rigidità di elastomeri e materiali plastici. Per la stampa 3D è particolarmente rilevante per TPU e altri filamenti flessibili.

### Shore A — materiali flessibili

La scala Shore A va da 0 (estremamente morbido, quasi come gel) a 100 (gomma estremamente dura). Valori superiori a 90A iniziano ad avvicinarsi ai materiali plastici rigidi.

| Valore Shore A | Durezza percepita | Esempio |
|---|---|---|
| 30A | Estremamente morbido | Silicone, gel |
| 50A | Molto morbido | Gomma morbida, tappi per orecchie |
| 70A | Morbido | Tubo per auto, suola intermedia scarpe da corsa |
| 85A | Medio morbido | Pneumatico bici, filamenti TPU morbidi |
| 95A | Semi-rigido | Filamento TPU standard |
| 100A ≈ 55D | Confine tra le scale | — |

**TPU 95A** è lo standard industriale per la stampa 3D e offre un buon equilibrio tra elasticità e stampabilità. **TPU 85A** è molto morbido e richiede più pazienza durante la stampa.

### Shore D — materiali rigidi

Shore D viene utilizzato per termoplastiche più dure:

| Materiale | Shore D approssimativo |
|---|---|
| PLA | ~80D |
| PETG | ~70D |
| ABS | ~75D |
| PC | ~80D |
| PA (Nylon) | ~70–75D |

:::tip Non la stessa cosa
Shore A 95 e Shore D 40 non sono la stessa cosa anche se i numeri sembrano vicini. Le scale sono diverse e si sovrappongono solo parzialmente intorno al confine 100A/55D. Verificare sempre quale scala indica il fornitore.
:::

---

## Tolleranze termiche — HDT e VST

Sapere a quale temperatura un materiale inizia a cedere è fondamentale per i pezzi funzionali. Si utilizzano due misurazioni standard:

- **HDT (Heat Deflection Temperature)** — la temperatura a cui il materiale si piega di 0,25 mm sotto un carico standardizzato. Misura della temperatura d'uso sotto carico.
- **VST (Vicat Softening Temperature)** — la temperatura a cui un ago standardizzato affonda di 1 mm nel materiale. Misura del punto di rammollimento assoluto senza carico.

| Materiale | HDT (°C) | VST (°C) | Temp max pratica |
|---|---|---|---|
| PLA | 52–60 | 55–65 | ~50 °C |
| PETG | 70–80 | 75–85 | ~70 °C |
| ABS | 85–105 | 95–110 | ~90 °C |
| ASA | 90–105 | 95–108 | ~90 °C |
| TPU | 40–70 | varia | ~60 °C |
| PA (Nylon) | 70–180 | 180–220 | ~80–160 °C |
| PA-CF | 100–200 | 200–230 | ~100–180 °C |
| PC | 120–140 | 145–160 | ~120 °C |
| PLA-CF | 55–65 | 60–70 | ~55 °C |

:::warning PLA in ambienti caldi
I pezzi in PLA in un'auto d'estate sono una ricetta per il disastro. Il cruscotto di un'auto parcheggiata può raggiungere 80–90 °C. Usare ABS, ASA o PETG per tutto ciò che può essere esposto al sole o al calore.
:::

:::info Le varianti PA hanno proprietà molto diverse
PA è una famiglia di materiali, non un singolo materiale. PA6 ha un HDT inferiore (~70 °C), mentre PA12 e PA6-CF possono essere a 160–200 °C. Controllare sempre la scheda tecnica per il filamento specifico che si utilizza.
:::

---

## Requisiti ugello

### Ugello in ottone (standard)

Funziona per tutti i materiali **senza** riempimento di fibra di carbonio o fibra di vetro:
- PLA, PETG, ABS, ASA, TPU, PA, PC, PVA
- L'ottone è morbido e si consuma rapidamente con materiali abrasivi

### Ugello in acciaio indurito (richiesto per compositi)

**RICHIESTO** per:
- PLA-CF (PLA con fibra di carbonio)
- PETG-CF
- PA-CF
- ABS-GF (ABS con fibra di vetro)
- PPA-CF, PPA-GF
- Tutti i filamenti con "-CF", "-GF", "-HF" o "fibra di carbonio" nel nome

L'acciaio indurito ha una conduttività termica inferiore all'ottone — compensare con +5–10 °C sulla temperatura dell'ugello.

:::danger I filamenti in fibra di carbonio distruggono rapidamente gli ugelli in ottone
Un ugello in ottone può usurarsi notevolmente dopo soli poche centinaia di grammi di filamento CF. Il risultato è sotto-estrusione progressiva e misure imprecise. Investire in acciaio indurito se si stampano compositi.
:::

---

## Breve panoramica dei materiali per applicazione

| Applicazione | Materiale consigliato | Alternativa |
|---|---|---|
| Decorazione, figure | PLA, PLA Silk | PETG |
| Parti funzionali interne | PETG | PLA+ |
| Esposizione esterna | ASA | PETG |
| Parti flessibili, cover | TPU 95A | TPU 85A |
| Vano motore, ambienti caldi | PA-CF, PC | ABS |
| Costruzione leggera e rigida | PLA-CF | PA-CF |
| Materiale di supporto (solubile) | PVA | HIPS |
| Contatto alimentare (limitato) | PLA (ugello inossidabile) | — |
| Resistenza massima | PA-CF | PC |
| Trasparente | PETG trasparente | PC trasparente |

Consultare i singoli articoli sui materiali per informazioni dettagliate sulle impostazioni di temperatura, la risoluzione dei problemi e i profili consigliati per le stampanti Bambu Lab.
