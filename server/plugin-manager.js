import { getPlugins, getPlugin, registerPlugin, updatePluginEnabled, removePlugin, getPluginState, setPluginState, getPluginById } from './database.js';
import { getDb } from './db/connection.js';
import { readFileSync, existsSync, readdirSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { createLogger } from './logger.js';
import { config } from './config.js';

const log = createLogger('plugin');

// SSRF guard for plugin outbound HTTP
function _assertPublicUrl(urlStr) {
  try {
    const u = new URL(urlStr);
    const h = u.hostname;
    if (h === 'localhost' || h === '127.0.0.1' || h === '::1' || h === '0.0.0.0') {
      throw new Error('Plugin HTTP blocked: private/localhost URL');
    }
    const p = h.split('.').map(Number);
    if (p.length === 4 && p.every(n => !isNaN(n))) {
      if (p[0] === 10 || (p[0] === 172 && p[1] >= 16 && p[1] <= 31) ||
          (p[0] === 192 && p[1] === 168) || (p[0] === 169 && p[1] === 254)) {
        throw new Error('Plugin HTTP blocked: private IP range');
      }
    }
    if (u.protocol !== 'https:' && u.protocol !== 'http:') {
      throw new Error('Plugin HTTP blocked: non-HTTP scheme');
    }
  } catch (e) {
    if (e.message.startsWith('Plugin HTTP')) throw e;
    throw new Error('Plugin HTTP blocked: invalid URL');
  }
}

// Hook names the system supports
const HOOK_NAMES = [
  'onPrintStart', 'onPrintEnd', 'onPrintProgress', 'onError',
  'onPrinterConnected', 'onPrinterDisconnected',
  'onQueueItemCompleted', 'onMaintenanceAlert',
  'onServerStart', 'onBackupCreated'
];

export class PluginManager {
  constructor(options) {
    // options: { broadcast, dataDir, notifier }
    this.broadcast = options.broadcast;
    this.dataDir = options.dataDir || 'data';
    this.notifier = options.notifier;
    this._hooks = {}; // hookName -> [{ pluginName, handler }]
    this._plugins = new Map(); // name -> { manifest, module, api }
    this._pluginsDir = join(this.dataDir, 'plugins');

    // Initialize hooks map
    for (const h of HOOK_NAMES) this._hooks[h] = [];

    // Ensure plugins directory exists
    if (!existsSync(this._pluginsDir)) mkdirSync(this._pluginsDir, { recursive: true });
  }

  // Scan plugins directory and load all enabled plugins
  async init() {
    const dbPlugins = getPlugins();
    // Also scan filesystem for new plugins not yet in DB
    if (existsSync(this._pluginsDir)) {
      const dirs = readdirSync(this._pluginsDir, { withFileTypes: true })
        .filter(d => d.isDirectory())
        .map(d => d.name);
      for (const dir of dirs) {
        const manifestPath = join(this._pluginsDir, dir, 'manifest.json');
        if (!existsSync(manifestPath)) continue;
        try {
          const manifest = JSON.parse(readFileSync(manifestPath, 'utf-8'));
          const existing = getPlugin(manifest.name || dir);
          if (!existing) {
            registerPlugin({
              name: manifest.name || dir,
              version: manifest.version || '0.0.1',
              description: manifest.description || '',
              author: manifest.author || '',
              entry_point: manifest.entry || 'index.js',
              hooks: JSON.stringify(manifest.hooks || []),
              settings_schema: JSON.stringify(manifest.settings || {}),
              panels: JSON.stringify(manifest.panels || []),
              enabled: manifest.enabled !== undefined ? (manifest.enabled ? 1 : 0) : 1
            });
          }
        } catch (e) {
          log.error('Failed to read manifest for ' + dir + ': ' + e.message);
        }
      }
    }

    // Load enabled plugins
    const allPlugins = getPlugins();
    for (const p of allPlugins) {
      if (p.enabled) {
        await this._loadPlugin(p);
      }
    }

    log.info('Loaded ' + this._plugins.size + ' plugins');
  }

  async _loadPlugin(dbPlugin) {
    const pluginDir = join(this._pluginsDir, dbPlugin.name);
    const entryPath = join(pluginDir, dbPlugin.entry_point);

    if (!existsSync(entryPath)) {
      log.warn('Entry point not found for ' + dbPlugin.name + ': ' + entryPath);
      return;
    }

    // Path traversal guard: entry must be within plugins dir
    const resolvedEntry = join(pluginDir, dbPlugin.entry_point);
    if (!resolvedEntry.startsWith(this._pluginsDir)) {
      log.error('Plugin ' + dbPlugin.name + ': entry point path traversal blocked');
      return;
    }

    // Manifest integrity check (if manifest.json with sha256 hash exists)
    const manifestPath = join(pluginDir, 'manifest.json');
    if (existsSync(manifestPath)) {
      try {
        const { createHash } = await import('node:crypto');
        const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
        if (manifest.integrity) {
          const code = readFileSync(entryPath);
          const hash = 'sha256-' + createHash('sha256').update(code).digest('base64');
          if (hash !== manifest.integrity) {
            log.error('Plugin ' + dbPlugin.name + ': integrity check FAILED (code modified after signing)');
            if (config.plugins?.allowUnsigned !== true) {
              log.error('Set config.plugins.allowUnsigned = true to override');
              return;
            }
            log.warn('Loading anyway — allowUnsigned is true');
          } else {
            log.info('Plugin ' + dbPlugin.name + ': integrity check passed');
          }
        }
      } catch (e) {
        log.warn('Plugin ' + dbPlugin.name + ': manifest parse error: ' + e.message);
      }
    }

    try {
      // Create plugin API sandbox
      const pluginApi = this._createPluginApi(dbPlugin);

      // Dynamic import
      const mod = await import('file://' + entryPath);

      // Call init if exists
      if (typeof mod.init === 'function') {
        await mod.init(pluginApi);
      }

      // Register hooks
      const hooks = JSON.parse(dbPlugin.hooks || '[]');
      for (const hookName of hooks) {
        if (this._hooks[hookName] && typeof mod[hookName] === 'function') {
          this._hooks[hookName].push({ pluginName: dbPlugin.name, handler: mod[hookName] });
        }
      }

      this._plugins.set(dbPlugin.name, { manifest: dbPlugin, module: mod, api: pluginApi });
    } catch (e) {
      log.error('Failed to load ' + dbPlugin.name + ': ' + e.message);
    }
  }

  _createPluginApi(dbPlugin) {
    const self = this;
    // Cache the logger once per plugin instead of allocating on every call.
    const plog = createLogger('plugin:' + dbPlugin.name);
    return {
      name: dbPlugin.name,
      log: (...args) => plog.info(args.join(' ')),
      warn: (...args) => plog.warn(args.join(' ')),
      error: (...args) => plog.error(args.join(' ')),

      // State management (plugin-scoped)
      state: {
        get: (key) => { const r = getPluginState(dbPlugin.id, key); return r ? r.value : null; },
        set: (key, value) => setPluginState(dbPlugin.id, key, typeof value === 'object' ? JSON.stringify(value) : String(value))
      },

      // Broadcast to WebSocket clients
      broadcast: (type, data) => self.broadcast(type, { plugin: dbPlugin.name, ...data }),

      // Send notification
      notify: (title, message) => {
        if (self.notifier) {
          self.notifier.notify('plugin_event', { pluginName: dbPlugin.name, title, message });
        }
      },

      // HTTP helpers for outbound requests (SSRF-guarded)
      http: {
        get: async (url, opts) => { _assertPublicUrl(url); const r = await fetch(url, opts); return r.json(); },
        post: async (url, body, opts) => { _assertPublicUrl(url); const r = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json', ...opts?.headers }, body: JSON.stringify(body) }); return r.json(); }
      },

      // Register a custom API route under /api/plugins/{name}/
      registerRoute: (method, path, handler) => {
        const safeName = dbPlugin.name.replace(/[^a-z0-9-]/g, '');
        const fullPath = `/api/plugins/${safeName}/${path.replace(/^\//, '')}`;
        if (!self._pluginRoutes) self._pluginRoutes = new Map();
        self._pluginRoutes.set(`${method.toUpperCase()}:${fullPath}`, handler);
        self.log?.info(`Plugin ${dbPlugin.name} registered route: ${method.toUpperCase()} ${fullPath}`);
      },

      // Register a UI panel
      registerPanel: (panelId, title, loaderFn) => {
        if (!self._pluginPanels) self._pluginPanels = [];
        self._pluginPanels.push({ plugin: dbPlugin.name, id: panelId, title, loader: loaderFn });
      },

      // Timer for background tasks — tracked per-plugin so disable() can
      // clear only its timers (not all plugins').
      setInterval: (fn, ms) => {
        const timer = setInterval(() => { try { fn(); } catch (e) { self.log?.error(`Plugin ${dbPlugin.name} timer error: ${e.message}`); } }, Math.max(ms, 5000));
        if (!self._pluginTimers) self._pluginTimers = [];
        self._pluginTimers.push({ timer, plugin: dbPlugin.name });
        return timer;
      },

      // Read-only database access
      db: {
        getPrinters: () => { try { return getDb().prepare('SELECT id, name, model, ip FROM printers').all(); } catch { return []; } },
        getHistory: (limit) => { try { return getDb().prepare('SELECT * FROM print_history ORDER BY id DESC LIMIT ?').all(limit || 20); } catch { return []; } },
      }
    };
  }

  // Dispatch a hook to all registered plugins
  async dispatch(hookName, data) {
    const handlers = this._hooks[hookName] || [];
    for (const { pluginName, handler } of handlers) {
      try {
        await handler(data);
      } catch (e) {
        log.error('Hook ' + hookName + ' failed in ' + pluginName + ': ' + e.message);
      }
    }
  }

  // Enable/disable
  async enablePlugin(name) {
    updatePluginEnabled(name, 1);
    const p = getPlugin(name);
    if (p) await this._loadPlugin(p);
  }

  async disablePlugin(name) {
    updatePluginEnabled(name, 0);
    // Unregister hooks
    for (const hookName of HOOK_NAMES) {
      this._hooks[hookName] = this._hooks[hookName].filter(h => h.pluginName !== name);
    }
    // Clear background timers belonging to this plugin
    if (this._pluginTimers) {
      this._pluginTimers = this._pluginTimers.filter(t => {
        if (t.plugin === name) { try { clearInterval(t.timer); } catch {} return false; }
        return true;
      });
    }
    // Call destroy if exists
    const loaded = this._plugins.get(name);
    if (loaded?.module?.destroy) {
      try { await loaded.module.destroy(); } catch (e) { log.debug('Error in destroy() for plugin ' + name + ': ' + e.message); }
    }
    this._plugins.delete(name);
  }

  // Process-shutdown helper — clears every plugin timer.
  shutdown() {
    if (!this._pluginTimers) return;
    for (const t of this._pluginTimers) { try { clearInterval(t.timer); } catch {} }
    this._pluginTimers = [];
  }

  // List loaded plugins
  getLoadedPlugins() {
    return [...this._plugins.entries()].map(([name, p]) => ({
      name, version: p.manifest.version, description: p.manifest.description,
      author: p.manifest.author, hooks: JSON.parse(p.manifest.hooks || '[]'),
      panels: JSON.parse(p.manifest.panels || '[]')
    }));
  }

  // Get all registered hooks
  getHookNames() { return HOOK_NAMES; }
}
