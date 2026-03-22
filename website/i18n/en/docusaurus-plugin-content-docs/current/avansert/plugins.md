---
sidebar_position: 4
title: Plugin System
description: Create and install plugins to extend Bambu Dashboard
---

# Plugin System

Bambu Dashboard supports a plugin system that lets you extend functionality without modifying the source code.

:::info Experimental
The plugin system is under active development. The API may change between versions.
:::

## What can plugins do?

- Add new API endpoints
- Listen to printer events and react to them
- Add new frontend panels
- Integrate with third-party services
- Extend notification channels

## Plugin structure

A plugin is a Node.js module in the `plugins/` folder:

```
plugins/
└── my-plugin/
    ├── plugin.json    # Metadata
    ├── index.js       # Entry point
    └── README.md      # Documentation (optional)
```

### plugin.json

```json
{
  "name": "my-plugin",
  "version": "1.0.0",
  "description": "Description of the plugin",
  "author": "Your name",
  "main": "index.js",
  "hooks": ["onPrintStart", "onPrintEnd", "onPrinterConnect"]
}
```

### index.js

```javascript
module.exports = {
  // Called when the plugin is loaded
  async onLoad(context) {
    const { api, db, logger, events } = context;
    logger.info('My plugin is loaded');

    // Register a new API route
    api.get('/plugins/my-plugin/status', (req, res) => {
      res.json({ status: 'active' });
    });
  },

  // Called when a print starts
  async onPrintStart(context, printJob) {
    const { logger } = context;
    logger.info(`Print started: ${printJob.name}`);
  },

  // Called when a print is done
  async onPrintEnd(context, printJob) {
    const { logger, db } = context;
    logger.info(`Print done: ${printJob.name}`);
    // Save data to the database
    await db.run(
      'INSERT INTO plugin_data (plugin, key, value) VALUES (?, ?, ?)',
      ['my-plugin', 'last-print', printJob.name]
    );
  }
};
```

## Available hooks

| Hook | Triggers |
|------|---------|
| `onLoad` | Plugin is loaded |
| `onUnload` | Plugin is unloaded |
| `onPrinterConnect` | Printer connects |
| `onPrinterDisconnect` | Printer disconnects |
| `onPrintStart` | Print starts |
| `onPrintEnd` | Print completes |
| `onPrintFail` | Print fails |
| `onFilamentChange` | Filament change |
| `onAmsUpdate` | AMS status updates |

## Plugin context

All hooks receive a `context` object:

| Property | Type | Description |
|----------|------|-------------|
| `api` | Express Router | Add custom API routes |
| `db` | SQLite | Access to the database |
| `logger` | Logger | Logging |
| `events` | EventEmitter | Listen to events |
| `config` | Object | Dashboard configuration |
| `printers` | Map | All connected printers |

## Installing a plugin

```bash
# Copy the plugin folder
cp -r my-plugin/ plugins/

# Restart the dashboard
npm start
```

Plugins are activated automatically at startup if they are found in the `plugins/` folder.

## Disabling a plugin

Add `"disabled": true` to `plugin.json`, or remove the folder.

## Example plugin: Slack notifications

```javascript
const { IncomingWebhook } = require('@slack/webhook');

module.exports = {
  async onLoad(context) {
    this.webhook = new IncomingWebhook(process.env.SLACK_WEBHOOK_URL);
  },

  async onPrintEnd(context, job) {
    await this.webhook.send({
      text: `Print done! *${job.name}* took ${job.duration}`
    });
  }
};
```
