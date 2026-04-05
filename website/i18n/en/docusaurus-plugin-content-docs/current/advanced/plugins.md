---
sidebar_position: 4
title: Plugin System
description: Create and install plugins to extend 3DPrintForge
---

# Plugin System

3DPrintForge supports a plugin system that lets you extend functionality without modifying the source code.

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
    context.registerRoute('GET', '/plugins/my-plugin/status', (req, res) => {
      res.json({ status: 'active' });
    });

    // Register a frontend panel (appears in the sidebar)
    context.registerPanel({
      id: 'my-plugin-panel',
      title: 'My Plugin',
      icon: 'fas fa-plug',
      html: '<div id="my-plugin-container"></div>',
      js: '/plugins/my-plugin/panel.js'
    });

    // Schedule a recurring task (runs every 5 minutes)
    context.setInterval(() => {
      logger.info('Running periodic check');
    }, 5 * 60 * 1000);
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
    // Save data to the database using db access
    db.run(
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
| `db` | SQLite DatabaseSync | Direct access to the SQLite database (synchronous API) |
| `logger` | Logger | Structured logging with plugin name prefix |
| `events` | EventEmitter | Listen to and emit events |
| `config` | Object | Dashboard configuration (read-only) |
| `printers` | Map | All connected printers with live status |

## Plugin API methods

The context also provides these methods for extending the dashboard:

| Method | Description |
|--------|-------------|
| `registerRoute(method, path, handler)` | Register a custom HTTP endpoint (GET, POST, PUT, DELETE) |
| `registerPanel(options)` | Add a new panel to the dashboard sidebar with custom HTML and JS |
| `setInterval(callback, ms)` | Schedule a recurring task (automatically cleared on plugin unload) |
| `db.run(sql, params)` | Execute a write query on the database |
| `db.all(sql, params)` | Execute a read query and return all rows |
| `db.get(sql, params)` | Execute a read query and return the first row |

### registerRoute

```javascript
context.registerRoute('POST', '/plugins/my-plugin/action', (req, res) => {
  const body = req.body;
  // Process the request
  res.json({ success: true });
});
```

Routes are automatically prefixed and protected by the authentication system. API key and session auth both work.

### registerPanel

```javascript
context.registerPanel({
  id: 'my-panel',           // Unique panel identifier
  title: 'My Panel',        // Sidebar label
  icon: 'fas fa-chart-bar', // FontAwesome icon class
  html: '<div>...</div>',   // HTML content or path to HTML file
  js: '/plugins/my-plugin/panel.js'  // Optional JS to load
});
```

### setInterval

```javascript
const interval = context.setInterval(() => {
  // Periodic work (e.g. poll external API, clean up old data)
}, 60000);
```

Intervals registered via `context.setInterval` are automatically cleared when the plugin is unloaded, preventing memory leaks.

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
