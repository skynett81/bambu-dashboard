---
sidebar_position: 4
title: Plugin-system
description: Lag og installer plugins for å utvide 3DPrintForge
---

# Plugin-system

3DPrintForge støtter et plugin-system som lar deg utvide funksjonaliteten uten å endre kildekoden.

:::info Eksperimentelt
Plugin-systemet er under aktiv utvikling. API-et kan endre seg mellom versjoner.
:::

## Hva kan plugins gjøre?

- Legge til nye API-endepunkter via `registerRoute()`
- Registrere egne frontend-paneler via `registerPanel()`
- Kjøre periodiske oppgaver med `setInterval()`
- Tilgang til SQLite-databasen via `db`-konteksten
- Lytte på printer-hendelser og reagere på dem
- Integrere med tredjeparts tjenester
- Utvide varslingskanaler

## Plugin-struktur

Et plugin er en Node.js-modul i `plugins/`-mappen:

```
plugins/
└── mitt-plugin/
    ├── plugin.json    # Metadata
    ├── index.js       # Inngangspunkt
    └── README.md      # Dokumentasjon (valgfritt)
```

### plugin.json

```json
{
  "name": "mitt-plugin",
  "version": "1.0.0",
  "description": "Beskrivelse av pluginen",
  "author": "Ditt navn",
  "main": "index.js",
  "hooks": ["onPrintStart", "onPrintEnd", "onPrinterConnect"]
}
```

### index.js

```javascript
module.exports = {
  // Kalles når pluginen lastes
  async onLoad(context) {
    const { api, db, logger, events, registerRoute, registerPanel } = context;
    logger.info('Mitt plugin er lastet');

    // Registrer en ny API-rute med registerRoute()
    registerRoute('GET', '/plugins/mitt-plugin/status', (req, res) => {
      res.json({ status: 'aktiv' });
    });

    registerRoute('POST', '/plugins/mitt-plugin/action', (req, res) => {
      // Håndter POST-forespørsler
      res.json({ result: 'ok' });
    });

    // Registrer et frontend-panel
    registerPanel({
      id: 'mitt-plugin-panel',
      title: 'Mitt Plugin',
      position: 'sidebar',   // 'sidebar', 'dashboard', 'settings'
      icon: 'fas fa-puzzle-piece',
      html: '<div id="mitt-plugin-content">Loading...</div>',
      js: '/plugins/mitt-plugin/public/panel.js'
    });

    // Kjør periodisk oppgave med setInterval
    this.intervalId = setInterval(async () => {
      const printers = context.printers;
      for (const [id, printer] of printers) {
        logger.debug(`Printer ${id}: ${printer.status}`);
      }
    }, 60000); // Hvert minutt

    // Direkte databasetilgang
    const rows = db.prepare('SELECT COUNT(*) as count FROM print_history').all();
    logger.info(`Totalt ${rows[0].count} prints i historikken`);
  },

  // Kalles når pluginen lastes ut
  async onUnload(context) {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  },

  // Kalles når en print starter
  async onPrintStart(context, printJob) {
    const { logger } = context;
    logger.info(`Print startet: ${printJob.name}`);
  },

  // Kalles når en print er ferdig
  async onPrintEnd(context, printJob) {
    const { logger, db } = context;
    logger.info(`Print ferdig: ${printJob.name}`);
    // Lagre data i databasen
    db.prepare(
      'INSERT INTO plugin_data (plugin, key, value) VALUES (?, ?, ?)'
    ).run('mitt-plugin', 'siste-print', printJob.name);
  }
};
```

## Tilgjengelige hooks

| Hook | Utløser |
|------|---------|
| `onLoad` | Plugin lastes inn |
| `onUnload` | Plugin lastes ut |
| `onPrinterConnect` | Printer kobler til |
| `onPrinterDisconnect` | Printer kobler fra |
| `onPrintStart` | Print starter |
| `onPrintEnd` | Print fullføres |
| `onPrintFail` | Print feiler |
| `onFilamentChange` | Filamentbytte |
| `onAmsUpdate` | AMS-status oppdateres |

## Plugin context

Alle hooks mottar et `context`-objekt:

| Egenskap | Type | Beskrivelse |
|----------|------|-------------|
| `registerRoute` | Function | Registrer nye API-ruter: `registerRoute(method, path, handler)` |
| `registerPanel` | Function | Registrer frontend-paneler: `registerPanel({ id, title, position, html, js })` |
| `db` | DatabaseSync | Direkte tilgang til SQLite-databasen (Node.js 22 innebygd) |
| `logger` | Logger | Logging med nivåer (debug, info, warn, error) |
| `events` | EventEmitter | Lytt på og emit hendelser |
| `config` | Object | Dashboardets konfigurasjon (les-only) |
| `printers` | Map | Alle tilkoblede printere med status |
| `api` | Router | Bakoverkompatibel API-registrering (bruk `registerRoute` i stedet) |

## Installere en plugin

```bash
# Kopier plugin-mappen
cp -r mitt-plugin/ plugins/

# Restart dashboardet
npm start
```

Plugins aktiveres automatisk ved oppstart hvis de finnes i `plugins/`-mappen.

## Deaktivere en plugin

Legg til `"disabled": true` i `plugin.json`, eller fjern mappen.

## Eksempel-plugin: Slack-varsler

```javascript
const { IncomingWebhook } = require('@slack/webhook');

module.exports = {
  async onLoad(context) {
    this.webhook = new IncomingWebhook(process.env.SLACK_WEBHOOK_URL);
  },

  async onPrintEnd(context, job) {
    await this.webhook.send({
      text: `Print ferdig! *${job.name}* tok ${job.duration}`
    });
  }
};
```
