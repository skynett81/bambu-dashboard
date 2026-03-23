---
sidebar_position: 7
title: Materiali speciali
description: ASA, PC, PP, PVA, HIPS e altri materiali speciali per applicazioni avanzate
---

# Materiali speciali

Oltre ai materiali comuni, esistono numerosi materiali speciali per casi d'uso specifici — dalle parti da esterno resistenti ai raggi UV ai materiali di supporto solubili in acqua. Ecco una panoramica pratica.

---

## ASA (Acrylonitrile Styrene Acrylate)

ASA è la migliore alternativa ad ABS per uso esterno. Si stampa quasi identicamente all'ABS, ma tollera molto meglio la luce solare e le intemperie.

### Impostazioni

| Parametro | Valore |
|-----------|--------|
| Temperatura ugello | 240–260 °C |
| Temperatura piano | 90–110 °C |
| Temperatura camera | 45–55 °C |
| Raffreddamento parte | 0–20% |
| Essiccazione | Consigliata (70 °C / 4–6 h) |

### Caratteristiche

- **Resistente ai raggi UV:** Progettato specificamente per esposizione solare prolungata senza ingiallire o spaccarsi
- **Stabile al calore:** Temperatura di transizione vetrosa ~100 °C
- **Resistente agli urti:** Migliore resistenza agli urti rispetto all'ABS
- **Camera necessaria:** Warpa allo stesso modo dell'ABS — X1C/P1S danno i migliori risultati

:::tip ASA al posto di ABS all'esterno
La parte dovrà stare all'esterno in un clima nordico (sole, pioggia, gelo)? Scegliere ASA invece di ABS. ASA resiste per molti anni senza degrado visibile. ABS inizia a spaccarsi e ingiallire dopo mesi.
:::

### Applicazioni
- Staffe, gusci e punti di fissaggio per esterni
- Parti per tergi-neve auto, supporti antenna
- Mobili da giardino e ambienti outdoor
- Segnaletica e dispenser all'esterno degli edifici

---

## PC (Policarbonato)

Il policarbonato è una delle plastiche più resistenti e resistenti agli urti che possono essere stampate in 3D. È trasparente e tollera temperature estreme.

### Impostazioni

| Parametro | Valore |
|-----------|--------|
| Temperatura ugello | 260–310 °C |
| Temperatura piano | 100–120 °C |
| Temperatura camera | 50–70 °C |
| Raffreddamento parte | 0–20% |
| Essiccazione | Richiesta (80 °C / 8–12 h) |

:::danger PC richiede hotend tutto metallo e alta temperatura
Il PC non si fonde alle temperature standard del PLA. Bambu X1C con la configurazione ugello corretta gestisce il PC. Verificare sempre che i componenti PTFE nell'hotend tollerino la propria temperatura — il PTFE standard non tollera oltre 240–250 °C in modo continuativo.
:::

### Caratteristiche

- **Molto resistente agli urti:** Resistente alla rottura anche a basse temperature
- **Trasparente:** Può essere usato per finestre, lenti e componenti ottici
- **Stabile al calore:** Temperatura di transizione vetrosa ~147 °C — la più alta tra i materiali comuni
- **Igroscopico:** Assorbe umidità rapidamente — asciugare sempre accuratamente
- **Warping:** Forte ritiro — richiede camera e brim

### Applicazioni
- Visiere di sicurezza e coperture protettive
- Involucri elettrici resistenti al calore
- Porta-lenti e componenti ottici
- Telai per robot e fusoliere per droni

---

## PP (Polipropilene)

Il polipropilene è uno dei materiali più difficili da stampare, ma offre proprietà uniche che nessun altro materiale plastico può eguagliare.

### Impostazioni

| Parametro | Valore |
|-----------|--------|
| Temperatura ugello | 220–250 °C |
| Temperatura piano | 80–100 °C |
| Raffreddamento parte | 20–50% |
| Essiccazione | Consigliata (70 °C / 6 h) |

### Caratteristiche

- **Resistente alle sostanze chimiche:** Tollera acidi forti, basi, alcol e la maggior parte dei solventi
- **Leggero e flessibile:** Bassa densità, tollera la flessione ripetuta (effetto cerniera vivente)
- **Bassa adesione:** Aderisce poco a se stesso e al piano di stampa — questa è la sfida
- **Non tossico:** Sicuro per il contatto alimentare (in base a colore e additivi)

:::warning PP aderisce male a tutto
Il PP è noto per non aderire al piano di stampa. Usare nastro PP (come nastro Tesa o nastro PP dedicato) su Engineering Plate, oppure colla formulata specificamente per PP. Brim di 15–20 mm è necessario.
:::

### Applicazioni
- Flaconi da laboratorio e contenitori per sostanze chimiche
- Parti per la conservazione degli alimenti e utensili da cucina
- Cerniere viventi (coperchi che resistono a migliaia di cicli apertura/chiusura)
- Componenti auto resistenti alle sostanze chimiche

---

## PVA (Polivinil Alcol) — materiale di supporto solubile in acqua

Il PVA è un materiale speciale usato esclusivamente come materiale di supporto. Si dissolve in acqua e lascia una superficie pulita sul modello.

### Impostazioni

| Parametro | Valore |
|-----------|--------|
| Temperatura ugello | 180–220 °C |
| Temperatura piano | 35–60 °C |
| Essiccazione | Critica (55 °C / 6–8 h) |

:::danger PVA è estremamente igroscopico
PVA assorbe umidità più velocemente di qualsiasi altro filamento comune. Asciugare PVA accuratamente PRIMA della stampa, e conservare sempre in una scatola sigillata con gel di silice. Il PVA umido si incolla nell'ugello ed è molto difficile da rimuovere.
:::

### Utilizzo e dissoluzione

1. Stampare il modello con PVA come materiale di supporto (richiede stampante multi-materiale — AMS)
2. Immergere la stampa finita in acqua calda (30–40 °C)
3. Lasciare in ammollo 30–120 minuti, cambiare l'acqua se necessario
4. Sciacquare con acqua pulita e lasciare asciugare

**Usare sempre un estrusore dedicato per PVA** se possibile — i residui di PVA in un estrusore standard possono rovinare la stampa successiva.

### Applicazioni
- Strutture di supporto complesse impossibili da rimuovere manualmente
- Supporto per sbalzi interni senza impronte visibili sulla superficie
- Modelli con cavità e canali interni

---

## HIPS (High Impact Polystyrene) — materiale di supporto solubile in solvente

HIPS è un altro materiale di supporto, progettato per essere usato con ABS. Si dissolve nel **limonene** (solvente a base di agrumi).

### Impostazioni

| Parametro | Valore |
|-----------|--------|
| Temperatura ugello | 220–240 °C |
| Temperatura piano | 90–110 °C |
| Temperatura camera | 45–55 °C |
| Essiccazione | Consigliata (65 °C / 4–6 h) |

### Utilizzo con ABS

HIPS stampa alle stesse temperature di ABS e aderisce bene ad esso. Dopo la stampa, HIPS si scioglie immergendo la stampa in D-limonene per 30–60 minuti.

:::warning Il limonene non è acqua
Il D-limonene è un solvente estratto dalla buccia d'arancia. È relativamente innocuo, ma usare comunque guanti e lavorare in ambiente ventilato. Non smaltire il limonene usato nel lavandino — portarlo a un centro di raccolta rifiuti.
:::

### Confronto: PVA vs HIPS

| Caratteristica | PVA | HIPS |
|----------------|-----|------|
| Solvente | Acqua | D-limonene |
| Materiale compatibile | Compatibile con PLA | Compatibile con ABS |
| Sensibilità all'umidità | Estremamente alta | Moderata |
| Costo | Alto | Moderato |
| Disponibilità | Buona | Moderata |

---

## PVB / Fibersmooth — materiale levigabile con etanolo

PVB (Polivinil Butirrale) è un materiale unico che può essere **levigato con etanolo (alcol)** — allo stesso modo in cui l'ABS può essere levigato con acetone, ma molto più sicuro.

### Impostazioni

| Parametro | Valore |
|-----------|--------|
| Temperatura ugello | 190–210 °C |
| Temperatura piano | 35–55 °C |
| Raffreddamento parte | 80–100% |
| Essiccazione | Consigliata (55 °C / 4 h) |

### Levigatura con etanolo

1. Stampare il modello con impostazioni PVB standard
2. Applicare con un pennello alcol isopropilico al 99% (IPA) o etanolo
3. Lasciare asciugare per 10–15 minuti — la superficie si livella uniformemente
4. Ripetere se necessario per una superficie più liscia
5. In alternativa: applicare e mettere in un contenitore chiuso per 5 minuti per il trattamento a vapore

:::tip Più sicuro dell'acetone
IPA/etanolo è molto più sicuro da maneggiare rispetto all'acetone. Il punto di infiammabilità è più alto e i vapori sono molto meno tossici. Si consiglia comunque una buona ventilazione.
:::

### Applicazioni
- Figurine e decorazioni dove si desidera una superficie liscia
- Prototipi da presentare
- Parti da verniciare — la superficie liscia garantisce una migliore verniciatura

---

## Piatti di stampa consigliati per materiali speciali

| Materiale | Piatto consigliato | Colla a stecca? |
|-----------|-------------------|----------------|
| ASA | Engineering Plate / High Temp Plate | Sì |
| PC | High Temp Plate | Sì (richiesta) |
| PP | Engineering Plate + nastro PP | Nastro specifico PP |
| PVA | Cool Plate / Textured PEI | No |
| HIPS | Engineering Plate / High Temp Plate | Sì |
| PVB | Cool Plate / Textured PEI | No |
