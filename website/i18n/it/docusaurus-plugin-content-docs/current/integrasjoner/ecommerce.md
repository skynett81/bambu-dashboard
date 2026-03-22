---
sidebar_position: 5
title: E-commerce
description: Gestisci ordini, clienti e fatturazione per la vendita di stampe 3D — richiede licenza da geektech.no
---

# E-commerce

Il modulo E-commerce ti fornisce un sistema completo per gestire clienti, ordini e fatturazione — perfetto per chi vende stampe 3D in modo professionale o semi-professionale.

Vai a: **https://localhost:3443/#orders**

:::danger Licenza e-commerce richiesta
Il modulo E-commerce richiede una licenza valida. Le licenze possono essere **acquistate esclusivamente tramite [geektech.no](https://geektech.no)**. Senza licenza attiva, il modulo è bloccato e non disponibile.
:::

## Licenza — Acquisto e Attivazione

### Acquistare la Licenza

1. Vai su **[geektech.no](https://geektech.no)** e crea un account
2. Seleziona **Bambu Dashboard — Licenza E-commerce**
3. Scegli il tipo di licenza:

| Tipo licenza | Descrizione | Stampanti |
|---|---|---|
| **Hobby** | Una stampante, uso personale e piccole vendite | 1 |
| **Professionale** | Fino a 5 stampanti, uso commerciale | 1–5 |
| **Enterprise** | Stampanti illimitate, supporto completo | Illimitate |

4. Completa il pagamento
5. Riceverai una **chiave di licenza** via email

### Attivare la Licenza

1. Vai a **Impostazioni → E-commerce** nel dashboard
2. Compila i seguenti campi:

| Campo | Descrizione | Obbligatorio |
|-------|-------------|--------------|
| **Chiave di licenza** | Chiave esadecimale di 32 caratteri da geektech.no | ✅ Sì |
| **Indirizzo email** | L'email usata al momento dell'acquisto | ✅ Sì |
| **Dominio** | Il dominio su cui gira il dashboard (senza https://) | Consigliato |
| **Telefono** | Telefono di contatto (con prefisso, es. +39) | Facoltativo |

### Tipo di Licenza — Associazione Identificatore

geektech.no associa la licenza a uno o più identificatori:

| Tipo | Valida contro | Caso d'uso |
|------|---------------|------------|
| **Dominio** | Nome dominio (es. `dashboard.azienda.it`) | Server fisso con dominio proprio |
| **IP** | Indirizzo/i IP pubblico/i | Server senza dominio, IP fisso |
| **MAC** | Indirizzo/i MAC della scheda di rete | Associazione hardware |
| **IP + MAC** | IP e MAC devono corrispondere entrambi | Massima sicurezza |

:::info Identificazione automatica
Il dashboard invia automaticamente l'indirizzo IP e l'indirizzo MAC del server ad ogni validazione. Non è necessario inserirli manualmente — geektech.no li registra alla prima attivazione.
:::

È possibile consentire più indirizzi IP e MAC (uno per riga nell'admin di geektech.no). Utile per server con più schede di rete o IP dinamico.

3. Clicca su **Attiva licenza**
4. Il dashboard invia una richiesta di attivazione a geektech.no
5. In caso di attivazione riuscita, vengono mostrati:
   - **Tipo di licenza** (Hobby / Professionale / Enterprise)
   - **Data di scadenza**
   - **Numero massimo di stampanti**
   - **Titolare della licenza**
   - **ID istanza** (univoco per la tua installazione)

:::warning La chiave di licenza è legata al tuo dominio e alla tua installazione
La chiave viene attivata per una specifica installazione di Bambu Dashboard e dominio. Contatta il supporto [geektech.no](https://geektech.no) se hai bisogno di:
- Spostare la licenza su un nuovo server
- Cambiare dominio
- Aumentare il numero di stampanti
:::

### Validazione Licenza

La licenza viene autenticata e sincronizzata con geektech.no:

- **Validazione all'avvio** — la licenza viene verificata automaticamente
- **Validazione continua** — rivalidata ogni 24 ore presso geektech.no
- **Modalità offline** — in caso di interruzione di rete, la licenza funziona per un massimo di **7 giorni** con validazione in cache
- **Licenza scaduta** → il modulo si blocca, ma i dati esistenti (ordini, clienti) vengono mantenuti
- **Codice PIN** — geektech.no può bloccare/sbloccare la licenza tramite il sistema PIN
- **Rinnovo** — tramite **[geektech.no](https://geektech.no)** → Le mie licenze → Rinnova

### Tipi di Licenza e Limitazioni

| Piano | Stampanti | Piattaforme | Commissione | Prezzo |
|-------|-----------|-------------|-------------|--------|
| **Hobby** | 1 | 1 (Shopify O WooCommerce) | 5% | Vedi geektech.no |
| **Professionale** | 1–5 | Tutte | 5% | Vedi geektech.no |
| **Enterprise** | Illimitate | Tutte + API | 3% | Vedi geektech.no |

### Verificare lo Stato della Licenza

Vai a **Impostazioni → E-commerce** oppure chiama l'API:

```bash
curl -sk https://localhost:3443/api/ecommerce/license
```

La risposta contiene:
```json
{
  "active": true,
  "status": "active",
  "plan": "professional",
  "holder": "Nome Azienda SRL",
  "email": "azienda@esempio.it",
  "domain": "dashboard.nomeazienda.it",
  "max_printers": 5,
  "expires_at": "2027-03-22",
  "provider": "geektech.no",
  "fees_pending": 2,
  "fees_this_month": 450.00,
  "orders_this_month": 12
}
```

## Clienti

### Creare un Cliente

1. Vai a **E-commerce → Clienti**
2. Clicca su **Nuovo cliente**
3. Compila:
   - **Nome / Ragione sociale**
   - **Persona di contatto** (per le aziende)
   - **Indirizzo email**
   - **Telefono**
   - **Indirizzo** (indirizzo di fatturazione)
   - **P.IVA / Codice fiscale** (opzionale, per soggetti registrati IVA)
   - **Nota** — annotazione interna
4. Clicca su **Crea**

### Panoramica Clienti

L'elenco clienti mostra:
- Nome e informazioni di contatto
- Numero totale di ordini
- Fatturato totale
- Data dell'ultimo ordine
- Stato (Attivo / Inattivo)

Clicca su un cliente per vedere tutta la cronologia ordini e fatturazione.

## Gestione Ordini

### Creare un Ordine

1. Vai a **E-commerce → Ordini**
2. Clicca su **Nuovo ordine**
3. Seleziona il **Cliente** dall'elenco
4. Aggiungi le righe d'ordine:
   - Seleziona file/modello dalla libreria file, o aggiungi una voce in testo libero
   - Indica quantità e prezzo unitario
   - Il sistema calcola il costo automaticamente se collegato a un progetto
5. Indica la **Data di consegna** (stimata)
6. Clicca su **Crea ordine**

### Stato Ordine

| Stato | Descrizione |
|---|---|
| Richiesta | Richiesta ricevuta, non confermata |
| Confermata | Il cliente ha confermato |
| In produzione | Stampe in corso |
| Pronto per la consegna | Finito, in attesa di ritiro/spedizione |
| Consegnato | Ordine completato |
| Annullato | Cancellato dal cliente o da te |

Aggiorna lo stato cliccando sull'ordine → **Cambia stato**.

### Collegare Stampe all'Ordine

1. Apri l'ordine
2. Clicca su **Collega stampa**
3. Seleziona le stampe dalla cronologia (selezione multipla supportata)
4. I dati di costo vengono recuperati automaticamente dalla cronologia stampe

## Fatturazione

Vedi [Progetti → Fatturazione](../funksjoner/projects#fakturering) per la documentazione dettagliata sulla fatturazione.

La fattura può essere generata direttamente da un ordine:

1. Apri l'ordine
2. Clicca su **Genera fattura**
3. Controlla importo e IVA
4. Scarica il PDF o invialo all'email del cliente

### Serie Numeri Fattura

Configura la serie di numeri fattura in **Impostazioni → E-commerce**:
- **Prefisso**: ad es. `2026-`
- **Numero iniziale**: ad es. `1001`
- Il numero fattura viene assegnato automaticamente in ordine crescente

## Reportistica e Commissioni

### Reportistica Commissioni

Il sistema tiene traccia di tutte le commissioni di transazione:
- Vedi le commissioni in **E-commerce → Commissioni**
- Contrassegna le commissioni come segnalate per scopi contabili
- Esporta il riepilogo commissioni per periodo

### Statistiche

In **E-commerce → Statistiche**:
- Fatturato mensile (grafico a barre)
- Clienti top per fatturato
- Modelli/materiali più venduti
- Dimensione media dell'ordine

Esporta in CSV per il sistema contabile.

## Supporto e Contatti

:::info Hai bisogno di aiuto?
- **Domande sulla licenza**: contatta il supporto di [geektech.no](https://geektech.no)
- **Problemi tecnici**: [GitHub Issues](https://github.com/skynett81/bambu-dashboard/issues)
- **Richieste di funzionalità**: [GitHub Discussions](https://github.com/skynett81/bambu-dashboard/discussions)
:::
