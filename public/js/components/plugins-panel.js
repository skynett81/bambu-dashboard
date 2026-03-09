// Plugin Management Panel
(function() {
  'use strict';

  let _plugins = [];
  let _hooks = [];

  function _esc(s) { const d = document.createElement('div'); d.textContent = s || ''; return d.innerHTML; }

  function t(key, fallback) {
    if (window.i18n && typeof window.i18n.t === 'function') return window.i18n.t(key) || fallback || key;
    return fallback || key;
  }

  async function _fetchPlugins() {
    try {
      const [pluginRes, hookRes] = await Promise.all([
        fetch('/api/plugins').then(r => r.json()),
        fetch('/api/plugins/hooks').then(r => r.json())
      ]);
      _plugins = Array.isArray(pluginRes) ? pluginRes : [];
      _hooks = Array.isArray(hookRes) ? hookRes : [];
    } catch (e) {
      console.error('[plugins-panel] Fetch error:', e.message);
      _plugins = [];
      _hooks = [];
    }
  }

  function _renderHookBadge(hookName) {
    const colors = {
      onPrintStart: '#22c55e', onPrintEnd: '#3b82f6', onPrintProgress: '#8b5cf6',
      onError: '#ef4444', onPrinterConnected: '#06b6d4', onPrinterDisconnected: '#f97316',
      onQueueItemCompleted: '#a855f7', onMaintenanceAlert: '#eab308',
      onServerStart: '#14b8a6', onBackupCreated: '#64748b'
    };
    const color = colors[hookName] || '#6b7280';
    return `<span class="plugin-badge" style="background:${color}20;color:${color};border:1px solid ${color}40;padding:2px 8px;border-radius:12px;font-size:11px;font-weight:500">${_esc(hookName)}</span>`;
  }

  function _renderPluginCard(plugin) {
    const isLoaded = plugin.loaded;
    const isEnabled = !!plugin.enabled;
    const hooks = Array.isArray(plugin.hooks) ? plugin.hooks : [];
    const panels = Array.isArray(plugin.panels) ? plugin.panels : [];
    const hasSettings = plugin.settings_schema && Object.keys(plugin.settings_schema).length > 0;

    return `
      <div class="plugin-card ${isEnabled ? '' : 'plugin-card--disabled'}" data-plugin="${_esc(plugin.name)}">
        <div class="plugin-card-header">
          <div class="plugin-card-info">
            <div class="plugin-card-title">
              <span class="plugin-name">${_esc(plugin.name)}</span>
              <span class="plugin-version">v${_esc(plugin.version || '0.0.1')}</span>
              ${isLoaded ? '<span class="plugin-status plugin-status--loaded">' + t('plugins.loaded', 'Loaded') + '</span>' : ''}
            </div>
            ${plugin.author ? '<div class="plugin-card-author">' + t('plugins.by', 'by') + ' ' + _esc(plugin.author) + '</div>' : ''}
            ${plugin.description ? '<div class="plugin-card-desc">' + _esc(plugin.description) + '</div>' : ''}
          </div>
          <div class="plugin-card-actions">
            <label class="toggle-switch" title="${isEnabled ? t('plugins.disable', 'Disable') : t('plugins.enable', 'Enable')}">
              <input type="checkbox" ${isEnabled ? 'checked' : ''} onchange="window._pluginToggle('${_esc(plugin.name)}', this.checked)">
              <span class="toggle-slider"></span>
            </label>
          </div>
        </div>
        ${hooks.length > 0 ? '<div class="plugin-card-hooks"><span class="plugin-hooks-label">' + t('plugins.hooks', 'Hooks') + ':</span> ' + hooks.map(h => _renderHookBadge(h)).join(' ') + '</div>' : ''}
        ${panels.length > 0 ? '<div class="plugin-card-panels"><span class="plugin-panels-label">' + t('plugins.panels_label', 'Panels') + ':</span> ' + panels.map(p => '<span class="plugin-badge" style="background:#3b82f620;color:#3b82f6;border:1px solid #3b82f640;padding:2px 8px;border-radius:12px;font-size:11px">' + _esc(p.name || p) + '</span>').join(' ') + '</div>' : ''}
        <div class="plugin-card-footer">
          ${hasSettings ? '<button class="btn btn-sm btn-secondary" onclick="window._pluginSettings(\'' + _esc(plugin.name) + '\')">' + t('plugins.settings_btn', 'Settings') + '</button>' : ''}
          <button class="btn btn-sm btn-danger" onclick="window._pluginUninstall('${_esc(plugin.name)}')">${t('plugins.uninstall', 'Uninstall')}</button>
        </div>
      </div>
    `;
  }

  function _renderHooksList() {
    const hookDescriptions = {
      onPrintStart: 'Fired when a print job starts',
      onPrintEnd: 'Fired when a print job completes, fails, or is cancelled',
      onPrintProgress: 'Fired periodically during print progress updates',
      onError: 'Fired when a printer error occurs',
      onPrinterConnected: 'Fired when a printer connects via MQTT',
      onPrinterDisconnected: 'Fired when a printer disconnects',
      onQueueItemCompleted: 'Fired when a queue item finishes printing',
      onMaintenanceAlert: 'Fired when a maintenance alert is triggered',
      onServerStart: 'Fired after the server finishes starting',
      onBackupCreated: 'Fired after a backup is created'
    };

    return _hooks.map(h => `
      <div class="hook-item">
        ${_renderHookBadge(h)}
        <span class="hook-desc">${_esc(hookDescriptions[h] || '')}</span>
      </div>
    `).join('');
  }

  function _render() {
    const container = document.getElementById('overlay-panel-body');
    if (!container) return;

    const pluginCards = _plugins.length > 0
      ? _plugins.map(p => _renderPluginCard(p)).join('')
      : '<div class="empty-state"><p>' + t('plugins.no_plugins', 'No plugins installed. Place plugin folders in the data/plugins/ directory.') + '</p></div>';

    container.innerHTML = `
      <div class="plugins-panel">
        <div class="plugins-header">
          <h3>${t('plugins.installed', 'Installed Plugins')}</h3>
          <span class="plugins-count">${_plugins.length} ${t('plugins.plugin_count', 'plugin(s)')}</span>
        </div>

        <div class="plugins-grid">
          ${pluginCards}
        </div>

        <div class="plugins-info-section">
          <details>
            <summary>${t('plugins.available_hooks', 'Available Hooks')}</summary>
            <div class="hooks-list">
              ${_renderHooksList()}
            </div>
          </details>

          <details>
            <summary>${t('plugins.how_to_create', 'How to Create a Plugin')}</summary>
            <div class="plugin-guide">
              <p>${t('plugins.guide_intro', 'Create a folder in')} <code>data/plugins/your-plugin-name/</code> ${t('plugins.guide_with', 'with these files:')}</p>
              <h4>manifest.json</h4>
              <pre><code>{
  "name": "my-plugin",
  "version": "1.0.0",
  "description": "What my plugin does",
  "author": "Your Name",
  "entry": "index.js",
  "hooks": ["onPrintStart", "onPrintEnd"],
  "panels": [],
  "settings": {
    "apiKey": { "type": "string", "label": "API Key" },
    "enabled": { "type": "boolean", "label": "Enable feature", "default": true }
  }
}</code></pre>
              <h4>index.js</h4>
              <pre><code>export function init(api) {
  api.log('Plugin loaded!');
  // api.state.get(key) / api.state.set(key, value)
  // api.broadcast(type, data)
  // api.notify(title, message)
  // api.http.get(url) / api.http.post(url, body)
}

export function onPrintStart(data) {
  // data.printerId, etc.
}

export function onPrintEnd(data) {
  // data.printerId, data.status, etc.
}

export function destroy() {
  // Cleanup when disabled
}</code></pre>
              <p>${t('plugins.guide_restart', 'Restart the server or re-enable the plugin to load changes.')}</p>
            </div>
          </details>
        </div>
      </div>

      <style>
        .plugins-panel { max-width: 900px; margin: 0 auto; }
        .plugins-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; }
        .plugins-header h3 { margin: 0; font-size: 18px; }
        .plugins-count { color: var(--text-secondary, #9ca3af); font-size: 13px; }
        .plugins-grid { display: flex; flex-direction: column; gap: 12px; margin-bottom: 24px; }
        .plugin-card { background: var(--card-bg, #1e1e2e); border: 1px solid var(--border, #2d2d3d); border-radius: 10px; padding: 16px; transition: opacity 0.2s; }
        .plugin-card--disabled { opacity: 0.6; }
        .plugin-card-header { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; }
        .plugin-card-info { flex: 1; min-width: 0; }
        .plugin-card-title { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
        .plugin-name { font-weight: 600; font-size: 15px; }
        .plugin-version { color: var(--text-secondary, #9ca3af); font-size: 12px; }
        .plugin-status { font-size: 11px; padding: 2px 8px; border-radius: 12px; font-weight: 500; }
        .plugin-status--loaded { background: #22c55e20; color: #22c55e; border: 1px solid #22c55e40; }
        .plugin-card-author { color: var(--text-secondary, #9ca3af); font-size: 12px; margin-top: 2px; }
        .plugin-card-desc { color: var(--text-secondary, #9ca3af); font-size: 13px; margin-top: 6px; }
        .plugin-card-hooks, .plugin-card-panels { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; margin-top: 10px; }
        .plugin-hooks-label, .plugin-panels-label { font-size: 12px; color: var(--text-secondary, #9ca3af); font-weight: 500; }
        .plugin-card-footer { display: flex; gap: 8px; margin-top: 12px; padding-top: 12px; border-top: 1px solid var(--border, #2d2d3d); }
        .plugin-card-actions { flex-shrink: 0; }

        .toggle-switch { position: relative; display: inline-block; width: 44px; height: 24px; }
        .toggle-switch input { opacity: 0; width: 0; height: 0; }
        .toggle-slider { position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background: var(--border, #3d3d4d); border-radius: 24px; transition: 0.3s; }
        .toggle-slider:before { content: ''; position: absolute; height: 18px; width: 18px; left: 3px; bottom: 3px; background: white; border-radius: 50%; transition: 0.3s; }
        .toggle-switch input:checked + .toggle-slider { background: #22c55e; }
        .toggle-switch input:checked + .toggle-slider:before { transform: translateX(20px); }

        .btn-sm { padding: 4px 12px; font-size: 12px; border-radius: 6px; border: none; cursor: pointer; }
        .btn-secondary { background: var(--border, #3d3d4d); color: var(--text-primary, #e0e0e0); }
        .btn-secondary:hover { background: var(--border-hover, #4d4d5d); }
        .btn-danger { background: #ef444420; color: #ef4444; border: 1px solid #ef444440; }
        .btn-danger:hover { background: #ef444430; }

        .plugins-info-section { margin-top: 24px; }
        .plugins-info-section details { background: var(--card-bg, #1e1e2e); border: 1px solid var(--border, #2d2d3d); border-radius: 10px; margin-bottom: 12px; }
        .plugins-info-section summary { padding: 12px 16px; cursor: pointer; font-weight: 500; font-size: 14px; }
        .plugins-info-section summary:hover { color: var(--accent, #3b82f6); }
        .hooks-list { padding: 0 16px 16px; display: flex; flex-direction: column; gap: 8px; }
        .hook-item { display: flex; align-items: center; gap: 10px; }
        .hook-desc { font-size: 12px; color: var(--text-secondary, #9ca3af); }
        .plugin-guide { padding: 0 16px 16px; font-size: 13px; line-height: 1.6; }
        .plugin-guide h4 { margin: 12px 0 6px; font-size: 13px; color: var(--accent, #3b82f6); }
        .plugin-guide pre { background: var(--bg, #111122); border-radius: 8px; padding: 12px; overflow-x: auto; font-size: 12px; }
        .plugin-guide code { font-family: 'JetBrains Mono', 'Fira Code', monospace; }
        .plugin-guide p code { background: var(--bg, #111122); padding: 2px 6px; border-radius: 4px; font-size: 12px; }

        .empty-state { text-align: center; padding: 40px 20px; color: var(--text-secondary, #9ca3af); }

        .plugin-settings-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.6); z-index: 1000; display: flex; align-items: center; justify-content: center; }
        .plugin-settings-modal { background: var(--card-bg, #1e1e2e); border: 1px solid var(--border, #2d2d3d); border-radius: 12px; padding: 24px; min-width: 360px; max-width: 500px; width: 90%; }
        .plugin-settings-modal h3 { margin: 0 0 16px; font-size: 16px; }
        .plugin-settings-field { margin-bottom: 14px; }
        .plugin-settings-field label { display: block; font-size: 13px; font-weight: 500; margin-bottom: 4px; }
        .plugin-settings-field input[type="text"],
        .plugin-settings-field input[type="number"],
        .plugin-settings-field select { width: 100%; padding: 8px 10px; border-radius: 6px; border: 1px solid var(--border, #3d3d4d); background: var(--bg, #111122); color: var(--text-primary, #e0e0e0); font-size: 13px; box-sizing: border-box; }
        .plugin-settings-actions { display: flex; gap: 8px; justify-content: flex-end; margin-top: 16px; }
      </style>
    `;
  }

  // Global handlers
  window._pluginToggle = async function(name, enabled) {
    try {
      const action = enabled ? 'enable' : 'disable';
      const res = await fetch(`/api/plugins/${encodeURIComponent(name)}/${action}`, { method: 'POST' });
      if (!res.ok) throw new Error('Failed');
      await _fetchPlugins();
      _render();
    } catch (e) {
      console.error('[plugins] Toggle error:', e.message);
      await _fetchPlugins();
      _render();
    }
  };

  window._pluginUninstall = async function(name) {
    if (!confirm(t('plugins.confirm_uninstall', 'Remove this plugin from the database? Files will not be deleted.'))) return;
    try {
      await fetch(`/api/plugins/${encodeURIComponent(name)}`, { method: 'DELETE' });
      await _fetchPlugins();
      _render();
    } catch (e) {
      console.error('[plugins] Uninstall error:', e.message);
    }
  };

  window._pluginSettings = async function(name) {
    const plugin = _plugins.find(p => p.name === name);
    if (!plugin || !plugin.settings_schema) return;

    const schema = plugin.settings_schema;
    const current = plugin.settings || {};

    const overlay = document.createElement('div');
    overlay.className = 'plugin-settings-overlay';
    overlay.onclick = (e) => { if (e.target === overlay) overlay.remove(); };

    let fieldsHtml = '';
    for (const [key, def] of Object.entries(schema)) {
      const val = current[key] !== undefined ? current[key] : (def.default || '');
      const label = def.label || key;
      if (def.type === 'boolean') {
        fieldsHtml += `<div class="plugin-settings-field">
          <label><input type="checkbox" data-key="${_esc(key)}" ${val ? 'checked' : ''}> ${_esc(label)}</label>
        </div>`;
      } else if (def.type === 'number') {
        fieldsHtml += `<div class="plugin-settings-field">
          <label>${_esc(label)}</label>
          <input type="number" data-key="${_esc(key)}" value="${_esc(String(val))}">
        </div>`;
      } else if (def.type === 'select' && def.options) {
        const options = def.options.map(o => `<option value="${_esc(o)}" ${val === o ? 'selected' : ''}>${_esc(o)}</option>`).join('');
        fieldsHtml += `<div class="plugin-settings-field">
          <label>${_esc(label)}</label>
          <select data-key="${_esc(key)}">${options}</select>
        </div>`;
      } else {
        fieldsHtml += `<div class="plugin-settings-field">
          <label>${_esc(label)}</label>
          <input type="text" data-key="${_esc(key)}" value="${_esc(String(val))}">
        </div>`;
      }
    }

    overlay.innerHTML = `
      <div class="plugin-settings-modal">
        <h3>${_esc(name)} - ${t('plugins.settings_btn', 'Settings')}</h3>
        <div class="plugin-settings-fields">${fieldsHtml}</div>
        <div class="plugin-settings-actions">
          <button class="btn btn-sm btn-secondary" onclick="this.closest('.plugin-settings-overlay').remove()">${t('plugins.cancel', 'Cancel')}</button>
          <button class="btn btn-sm" style="background:#3b82f6;color:white" id="plugin-settings-save">${t('plugins.save', 'Save')}</button>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    overlay.querySelector('#plugin-settings-save').onclick = async () => {
      const settings = {};
      overlay.querySelectorAll('[data-key]').forEach(el => {
        const key = el.dataset.key;
        const def = schema[key];
        if (def?.type === 'boolean') {
          settings[key] = el.checked;
        } else if (def?.type === 'number') {
          settings[key] = parseFloat(el.value) || 0;
        } else {
          settings[key] = el.value;
        }
      });
      try {
        await fetch(`/api/plugins/${encodeURIComponent(name)}/settings`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(settings)
        });
        overlay.remove();
        await _fetchPlugins();
        _render();
      } catch (e) {
        console.error('[plugins] Settings save error:', e.message);
      }
    };
  };

  window.loadPluginsPanel = async function() {
    await _fetchPlugins();
    _render();
  };
})();
