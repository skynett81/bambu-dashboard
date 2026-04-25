// Plugin Management Panel
(function() {
  'use strict';

  let _plugins = [];
  let _hooks = [];

  function _esc(s) { const d = document.createElement('div'); d.textContent = s || ''; return d.innerHTML; }
  function _tl(key, fb) { return (typeof window.t === 'function' ? window.t(key) : '') || fb; }

  async function _fetchPlugins() {
    try {
      const [pluginRes, hookRes] = await Promise.all([
        fetch('/api/plugins').then(r => r.json()),
        fetch('/api/plugins/hooks').then(r => r.json())
      ]);
      _plugins = Array.isArray(pluginRes) ? pluginRes : [];
      _hooks = Array.isArray(hookRes) ? hookRes : [];
    } catch (e) {
      _plugins = [];
      _hooks = [];
    }
  }

  const HOOK_COLORS = {
    onPrintStart: 'var(--accent-green)', onPrintEnd: 'var(--accent-blue)', onPrintProgress: '#8b5cf6',
    onError: 'var(--accent-red)', onPrinterConnected: '#06b6d4', onPrinterDisconnected: 'var(--accent-orange)',
    onQueueItemCompleted: '#a855f7', onMaintenanceAlert: '#eab308',
    onServerStart: '#14b8a6', onBackupCreated: '#64748b'
  };

  const HOOK_DESCS = {
    onPrintStart: 'Triggered when a print starts',
    onPrintEnd: 'Triggered when a print completes, fails or is cancelled',
    onPrintProgress: 'Triggered periodically during printing',
    onError: 'Triggered on printer error',
    onPrinterConnected: 'Triggered when a printer connects via MQTT',
    onPrinterDisconnected: 'Triggered when a printer disconnects',
    onQueueItemCompleted: 'Triggered when a queue item is completed',
    onMaintenanceAlert: 'Triggered when a maintenance alert is created',
    onServerStart: 'Triggered after the server has started',
    onBackupCreated: 'Triggered after a backup is created'
  };

  function _hookBadge(hookName) {
    const color = HOOK_COLORS[hookName] || '#6b7280';
    return `<span class="plg-hook-badge" style="--hook-color:${color}">${_esc(hookName)}</span>`;
  }

  function _render() {
    const container = document.getElementById('overlay-panel-body');
    if (!container) return;

    let html = '<div class="plg-panel">';

    // Header
    html += `<div class="matrec-toolbar" style="margin-bottom:16px">
      <div style="font-size:0.8rem;color:var(--text-muted)">${_plugins.length} ${_tl('plugins.plugin_count', 'plugin(er)')}</div>
    </div>`;

    // Plugin cards
    if (_plugins.length > 0) {
      html += '<div class="plg-list">';
      for (const plugin of _plugins) {
        const isEnabled = !!plugin.enabled;
        const isLoaded = plugin.loaded;
        const hooks = Array.isArray(plugin.hooks) ? plugin.hooks : [];
        const panels = Array.isArray(plugin.panels) ? plugin.panels : [];
        const hasSettings = plugin.settings_schema && Object.keys(plugin.settings_schema).length > 0;

        html += `<div class="card plg-card${isEnabled ? '' : ' plg-card--disabled'}">
          <div class="plg-card-header">
            <div class="plg-card-info">
              <div class="plg-card-title">
                <span class="plg-name">${_esc(plugin.name)}</span>
                <span class="plg-version">v${_esc(plugin.version || '0.0.1')}</span>
                ${isLoaded ? '<span class="hs-badge hs-badge-good">' + _tl('plugins.loaded', 'Loaded') + '</span>' : ''}
              </div>
              ${plugin.author ? '<div class="plg-author">' + _tl('plugins.by', 'by') + ' ' + _esc(plugin.author) + '</div>' : ''}
              ${plugin.description ? '<div class="plg-desc">' + _esc(plugin.description) + '</div>' : ''}
            </div>
            <label class="wp-toggle" title="${isEnabled ? _tl('plugins.disable', 'Disable') : _tl('plugins.enable', 'Enable')}">
              <input type="checkbox" ${isEnabled ? 'checked' : ''} onchange="window._pluginToggle('${_esc(plugin.name)}', this.checked)">
              <span class="wp-toggle-track"></span>
              <span class="wp-toggle-knob"></span>
            </label>
          </div>
          ${hooks.length > 0 ? '<div class="plg-hooks"><span class="plg-hooks-label">' + _tl('plugins.hooks', 'Hooks') + ':</span> ' + hooks.map(h => _hookBadge(h)).join(' ') + '</div>' : ''}
          ${panels.length > 0 ? '<div class="plg-hooks"><span class="plg-hooks-label">' + _tl('plugins.panels_label', 'Panels') + ':</span> ' + panels.map(p => '<span class="plg-hook-badge" style="--hook-color:var(--accent-blue)">' + _esc(p.name || p) + '</span>').join(' ') + '</div>' : ''}
          <div class="plg-card-footer">
            ${hasSettings ? '<button class="ce-secondary-btn" onclick="window._pluginSettings(\'' + _esc(plugin.name) + '\')"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"/></svg> ' + _tl('plugins.settings_btn', 'Settings') + '</button>' : ''}
            <button class="plg-uninstall-btn" onclick="window._pluginUninstall('${_esc(plugin.name)}')">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
              ${_tl('plugins.uninstall', 'Uninstall')}
            </button>
          </div>
        </div>`;
      }
      html += '</div>';
    } else {
      html += `<div class="matrec-empty">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="opacity:0.3;margin-bottom:12px"><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/></svg>
        <p>${_tl('plugins.no_plugins', 'No plugins installed. Place plugin folders in data/plugins/')}</p>
      </div>`;
    }

    // Wrap all info sections (hooks list, state viewer, logs, API ref,
    // generator, full example, creation guide) in a 2-column auto-fit grid.
    // Wide-content sections (API ref + Full example) span both columns.
    html += `<div class="plg-info-grid" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(380px,1fr));gap:12px;align-items:start">`;

    // Available hooks
    html += `<div class="card plg-info-section">
      <details>
        <summary class="plg-details-summary">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
          ${_tl('plugins.available_hooks', 'Available hooks')}
        </summary>
        <div class="plg-hooks-list">
          ${_hooks.map(h => `<div class="plg-hook-item">
            ${_hookBadge(h)}
            <span class="plg-hook-desc">${_esc(HOOK_DESCS[h] || '')}</span>
          </div>`).join('')}
        </div>
      </details>
    </div>`;

    // Plugin state viewer
    if (_plugins.some(p => p.enabled)) {
      html += `<div class="card plg-info-section">
        <details>
          <summary class="plg-details-summary">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg>
            Plugin State
          </summary>
          <div class="plg-guide" id="plg-state-viewer">
            <p style="font-size:0.75rem;color:var(--text-muted)">Click a plugin to view its stored state:</p>
            <div style="display:flex;gap:4px;flex-wrap:wrap;margin-bottom:8px">
              ${_plugins.filter(p => p.enabled).map(p => '<button class="ce-secondary-btn" style="font-size:0.7rem" onclick="window._pluginViewState(\'' + _esc(p.name) + '\')">' + _esc(p.name) + '</button>').join('')}
            </div>
            <pre class="plg-code" id="plg-state-output" style="min-height:60px"><code>Select a plugin above...</code></pre>
          </div>
        </details>
      </div>`;
    }

    // Plugin logs
    html += `<div class="card plg-info-section">
      <details>
        <summary class="plg-details-summary">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
          Plugin Logs
        </summary>
        <div class="plg-guide">
          <p style="font-size:0.75rem;color:var(--text-muted)">Server logs filtered by plugin activity:</p>
          <button class="ce-secondary-btn" style="font-size:0.7rem;margin-bottom:8px" onclick="window._pluginLoadLogs()">Load Logs</button>
          <pre class="plg-code" id="plg-logs-output" style="min-height:60px;max-height:200px;overflow-y:auto"><code>Click "Load Logs" to fetch...</code></pre>
        </div>
      </details>
    </div>`;

    // Plugin API documentation (full-width — table is wide)
    html += `<div class="card plg-info-section" style="grid-column:1/-1">
      <details>
        <summary class="plg-details-summary">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z"/><path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z"/></svg>
          Plugin API Reference
        </summary>
        <div class="plg-guide">
          <p style="font-size:0.78rem;font-weight:600;margin-bottom:8px">Context object passed to init(api):</p>
          <table class="table table-sm" style="font-size:0.72rem">
            <tr style="border-bottom:1px solid var(--border-color)"><td style="padding:4px 8px;font-weight:600;font-family:monospace;color:var(--accent-blue)">api.log(msg)</td><td style="padding:4px 8px">Log an info message</td></tr>
            <tr style="border-bottom:1px solid var(--border-color)"><td style="padding:4px 8px;font-weight:600;font-family:monospace;color:var(--accent-blue)">api.warn(msg)</td><td style="padding:4px 8px">Log a warning</td></tr>
            <tr style="border-bottom:1px solid var(--border-color)"><td style="padding:4px 8px;font-weight:600;font-family:monospace;color:var(--accent-blue)">api.error(msg)</td><td style="padding:4px 8px">Log an error</td></tr>
            <tr style="border-bottom:1px solid var(--border-color)"><td style="padding:4px 8px;font-weight:600;font-family:monospace;color:var(--accent-blue)">api.state.get(key)</td><td style="padding:4px 8px">Get plugin state value</td></tr>
            <tr style="border-bottom:1px solid var(--border-color)"><td style="padding:4px 8px;font-weight:600;font-family:monospace;color:var(--accent-blue)">api.state.set(key, val)</td><td style="padding:4px 8px">Set plugin state value (persists across restarts)</td></tr>
            <tr style="border-bottom:1px solid var(--border-color)"><td style="padding:4px 8px;font-weight:600;font-family:monospace;color:var(--accent-green)">api.broadcast(type, data)</td><td style="padding:4px 8px">Send data to all WebSocket clients</td></tr>
            <tr style="border-bottom:1px solid var(--border-color)"><td style="padding:4px 8px;font-weight:600;font-family:monospace;color:var(--accent-green)">api.notify(title, msg)</td><td style="padding:4px 8px">Send notification via all channels</td></tr>
            <tr style="border-bottom:1px solid var(--border-color)"><td style="padding:4px 8px;font-weight:600;font-family:monospace;color:var(--accent-cyan)">api.registerRoute(method, path, handler)</td><td style="padding:4px 8px">Register custom API route at /api/plugins/{name}/{path}</td></tr>
            <tr style="border-bottom:1px solid var(--border-color)"><td style="padding:4px 8px;font-weight:600;font-family:monospace;color:var(--accent-cyan)">api.registerPanel(id, title, fn)</td><td style="padding:4px 8px">Register a UI panel in the dashboard</td></tr>
            <tr style="border-bottom:1px solid var(--border-color)"><td style="padding:4px 8px;font-weight:600;font-family:monospace;color:var(--accent-cyan)">api.setInterval(fn, ms)</td><td style="padding:4px 8px">Run a function periodically (min 5s)</td></tr>
            <tr style="border-bottom:1px solid var(--border-color)"><td style="padding:4px 8px;font-weight:600;font-family:monospace;color:var(--accent-orange)">api.db.getPrinters()</td><td style="padding:4px 8px">Get all printers (read-only)</td></tr>
            <tr style="border-bottom:1px solid var(--border-color)"><td style="padding:4px 8px;font-weight:600;font-family:monospace;color:var(--accent-orange)">api.db.getHistory(limit)</td><td style="padding:4px 8px">Get print history (read-only)</td></tr>
            <tr><td style="padding:4px 8px;font-weight:600;font-family:monospace;color:var(--text-muted)">api.http.get(url)</td><td style="padding:4px 8px">Fetch JSON from external URL</td></tr>
          </table>
        </div>
      </details>
    </div>`;

    // Plugin template generator
    html += `<div class="card plg-info-section">
      <details>
        <summary class="plg-details-summary">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/></svg>
          Create New Plugin
        </summary>
        <div class="plg-guide">
          <p style="font-size:0.75rem;color:var(--text-muted);margin-bottom:8px">Generate a plugin skeleton with one click:</p>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-bottom:10px">
            <div><label style="font-size:0.7rem;color:var(--text-muted)">Plugin name</label><input type="text" class="pg-field-input" id="plg-gen-name" value="my-plugin" style="font-size:0.78rem"></div>
            <div><label style="font-size:0.7rem;color:var(--text-muted)">Author</label><input type="text" class="pg-field-input" id="plg-gen-author" value="" style="font-size:0.78rem"></div>
          </div>
          <div style="margin-bottom:8px"><label style="font-size:0.7rem;color:var(--text-muted)">Description</label><input type="text" class="pg-field-input" id="plg-gen-desc" value="My custom plugin" style="font-size:0.78rem"></div>
          <div style="margin-bottom:10px">
            <label style="font-size:0.7rem;color:var(--text-muted)">Hooks</label>
            <div style="display:flex;gap:4px;flex-wrap:wrap;margin-top:4px">
              ${Object.keys(HOOK_DESCS).map(h => '<label style="font-size:0.68rem;cursor:pointer;display:flex;align-items:center;gap:3px"><input type="checkbox" class="plg-gen-hook" value="' + h + '"' + (h === 'onPrintStart' || h === 'onPrintEnd' ? ' checked' : '') + '> ' + h + '</label>').join('')}
            </div>
          </div>
          <button class="matrec-recalc-btn" style="margin-left:0" onclick="window._pluginGenerate()">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            Generate Plugin Files
          </button>
          <div id="plg-gen-output" style="margin-top:8px"></div>
        </div>
      </details>
    </div>`;

    // Updated creation guide with new API (full-width — code blocks)
    html += `<div class="card plg-info-section" style="grid-column:1/-1">
      <details>
        <summary class="plg-details-summary">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
          Full Plugin Example
        </summary>
        <div class="plg-guide">
          <div class="plg-guide-file">manifest.json</div>
          <pre class="plg-code"><code>{
  "name": "my-plugin",
  "version": "1.0.0",
  "description": "Example plugin with all features",
  "author": "Your Name",
  "entry": "index.js",
  "hooks": ["onPrintStart", "onPrintEnd", "onServerStart"],
  "settings": {
    "webhookUrl": { "type": "string", "label": "Webhook URL" },
    "enabled": { "type": "boolean", "label": "Enable notifications", "default": true }
  }
}</code></pre>
          <div class="plg-guide-file">index.js</div>
          <pre class="plg-code"><code>export function init(api) {
  api.log('Plugin loaded!');

  // Register custom API route
  api.registerRoute('GET', 'status', () => {
    return { ok: true, prints: api.db.getHistory(5) };
  });

  // Background task every 60s
  api.setInterval(() => {
    const printers = api.db.getPrinters();
    api.log('Monitoring ' + printers.length + ' printers');
  }, 60000);
}

export function onPrintStart(data) {
  const { api, printerId, printerName } = data;
  api.state.set('lastPrint', printerName);
  api.notify('Print Started', printerName + ' started printing');
}

export function onPrintEnd(data) {
  const { api } = data;
  api.log('Print finished on ' + data.printerName);
}

export function destroy(api) {
  api.log('Plugin unloaded');
}</code></pre>
          <p class="plg-guide-note">Place files in <code>data/plugins/my-plugin/</code> and restart the server.</p>
        </div>
      </details>
    </div>`;

    html += '</div>'; // close .plg-info-grid
    html += '</div>'; // close .plg-panel
    container.innerHTML = html;
  }

  // Global handlers
  window._pluginToggle = async function(name, enabled) {
    try {
      const action = enabled ? 'enable' : 'disable';
      await fetch(`/api/plugins/${encodeURIComponent(name)}/${action}`, { method: 'POST' });
    } catch {}
    await _fetchPlugins();
    _render();
  };

  window._pluginUninstall = async function(name) {
    if (!confirm(_tl('plugins.confirm_uninstall', 'Remove this plugin from the database?'))) return;
    try {
      await fetch(`/api/plugins/${encodeURIComponent(name)}`, { method: 'DELETE' });
    } catch {}
    await _fetchPlugins();
    _render();
  };

  window._pluginSettings = async function(name) {
    const plugin = _plugins.find(p => p.name === name);
    if (!plugin || !plugin.settings_schema) return;

    const schema = plugin.settings_schema;
    const current = plugin.settings || {};

    const overlay = document.createElement('div');
    overlay.className = 'plg-settings-overlay';
    overlay.onclick = (e) => { if (e.target === overlay) overlay.remove(); };

    let fieldsHtml = '';
    for (const [key, def] of Object.entries(schema)) {
      const val = current[key] !== undefined ? current[key] : (def.default || '');
      const label = def.label || key;
      if (def.type === 'boolean') {
        fieldsHtml += `<div class="ce-field"><label class="plg-checkbox-label"><input type="checkbox" data-key="${_esc(key)}" ${val ? 'checked' : ''}> ${_esc(label)}</label></div>`;
      } else if (def.type === 'number') {
        fieldsHtml += `<div class="ce-field"><span class="ce-field-label">${_esc(label)}</span><input type="number" class="ce-input" style="border:1px solid var(--border-color);border-radius:var(--radius-sm);padding:8px 12px" data-key="${_esc(key)}" value="${_esc(String(val))}"></div>`;
      } else if (def.type === 'select' && def.options) {
        fieldsHtml += `<div class="ce-field"><span class="ce-field-label">${_esc(label)}</span><select class="matrec-select" style="width:100%" data-key="${_esc(key)}">${def.options.map(o => `<option value="${_esc(o)}" ${val === o ? 'selected' : ''}>${_esc(o)}</option>`).join('')}</select></div>`;
      } else {
        fieldsHtml += `<div class="ce-field"><span class="ce-field-label">${_esc(label)}</span><input type="text" class="ce-input" style="border:1px solid var(--border-color);border-radius:var(--radius-sm);padding:8px 12px" data-key="${_esc(key)}" value="${_esc(String(val))}"></div>`;
      }
    }

    overlay.innerHTML = `<div class="plg-settings-modal card">
      <div class="plg-settings-header">${_esc(name)} — ${_tl('plugins.settings_btn', 'Settings')}</div>
      <div class="plg-settings-fields">${fieldsHtml}</div>
      <div class="plg-settings-actions">
        <button class="ce-secondary-btn" onclick="this.closest('.plg-settings-overlay').remove()">${_tl('plugins.cancel', 'Cancel')}</button>
        <button class="matrec-recalc-btn" style="margin-left:0" id="plg-settings-save">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
          ${_tl('plugins.save', 'Save')}
        </button>
      </div>
    </div>`;

    document.body.appendChild(overlay);

    overlay.querySelector('#plg-settings-save').onclick = async () => {
      const settings = {};
      overlay.querySelectorAll('[data-key]').forEach(el => {
        const key = el.dataset.key;
        const def = schema[key];
        if (def?.type === 'boolean') settings[key] = el.checked;
        else if (def?.type === 'number') settings[key] = parseFloat(el.value) || 0;
        else settings[key] = el.value;
      });
      try {
        await fetch(`/api/plugins/${encodeURIComponent(name)}/settings`, {
          method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(settings)
        });
        overlay.remove();
        await _fetchPlugins();
        _render();
      } catch {}
    };
  };

  // View plugin state (key-value pairs)
  window._pluginViewState = async function(name) {
    const out = document.getElementById('plg-state-output');
    if (!out) return;
    try {
      const res = await fetch(`/api/plugins/${encodeURIComponent(name)}/state`);
      const data = await res.json();
      out.innerHTML = '<code>' + (Object.keys(data).length > 0 ? JSON.stringify(data, null, 2) : '(no state stored)') + '</code>';
    } catch (e) {
      out.innerHTML = '<code style="color:var(--accent-red)">Error: ' + e.message + '</code>';
    }
  };

  // Load plugin logs from server
  window._pluginLoadLogs = async function() {
    const out = document.getElementById('plg-logs-output');
    if (!out) return;
    try {
      const res = await fetch('/api/logs?filter=plugin&limit=30');
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        out.innerHTML = '<code>' + data.map(l => l.message || l).join('\n') + '</code>';
      } else {
        out.innerHTML = '<code>No plugin logs found. Plugins log with api.log(), api.warn(), api.error()</code>';
      }
    } catch {
      out.innerHTML = '<code>Log endpoint not available — check server logs for plugin output</code>';
    }
  };

  // Generate plugin skeleton files
  window._pluginGenerate = function() {
    const name = (document.getElementById('plg-gen-name')?.value || 'my-plugin').replace(/[^a-z0-9-]/gi, '-');
    const author = document.getElementById('plg-gen-author')?.value || '';
    const desc = document.getElementById('plg-gen-desc')?.value || '';
    const hooks = [];
    document.querySelectorAll('.plg-gen-hook:checked').forEach(el => hooks.push(el.value));

    const manifest = JSON.stringify({
      name, version: '1.0.0', description: desc, author,
      entry: 'index.js', hooks,
      settings: { enabled: { type: 'boolean', label: 'Enabled', default: true } }
    }, null, 2);

    let indexJs = `// ${name} — ${desc}\n\nexport function init(api) {\n  api.log('${name} loaded!');\n\n  // Register a custom API endpoint\n  api.registerRoute('GET', 'status', () => ({\n    name: '${name}',\n    uptime: process.uptime(),\n    printers: api.db.getPrinters().length\n  }));\n}\n`;

    for (const h of hooks) {
      indexJs += `\nexport function ${h}(data) {\n  const { api } = data;\n  api.log('${h}: ' + JSON.stringify(data).slice(0, 100));\n}\n`;
    }

    indexJs += `\nexport function destroy(api) {\n  api.log('${name} unloaded');\n}\n`;

    // Download as ZIP-like (two separate file downloads)
    const out = document.getElementById('plg-gen-output');
    if (out) {
      out.innerHTML = `
        <div style="font-size:0.75rem;color:var(--accent-green);margin-bottom:6px">✓ Files generated for "${name}"</div>
        <div style="display:flex;gap:6px">
          <button class="ce-secondary-btn" style="font-size:0.68rem" onclick="window._downloadText('manifest.json', ${JSON.stringify(manifest)})">📄 manifest.json</button>
          <button class="ce-secondary-btn" style="font-size:0.68rem" onclick="window._downloadText('index.js', ${JSON.stringify(indexJs)})">📄 index.js</button>
        </div>
        <p style="font-size:0.68rem;color:var(--text-muted);margin-top:6px">Save both files to <code>data/plugins/${name}/</code> and restart the server.</p>
      `;
    }
  };

  window._downloadText = function(filename, content) {
    const blob = new Blob([content], { type: 'text/plain' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  window.loadPluginsPanel = async function() {
    const el = document.getElementById('overlay-panel-body');
    if (el) el.innerHTML = '<div class="matrec-empty"><div class="matrec-spinner"></div></div>';
    await _fetchPlugins();
    _render();
  };
})();
