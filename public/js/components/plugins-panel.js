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
    onPrintStart: 'Utløses når en utskrift starter',
    onPrintEnd: 'Utløses når en utskrift fullføres, feiler eller kanselleres',
    onPrintProgress: 'Utløses periodisk under utskrift',
    onError: 'Utløses ved printerfeil',
    onPrinterConnected: 'Utløses når en printer kobles til via MQTT',
    onPrinterDisconnected: 'Utløses når en printer kobles fra',
    onQueueItemCompleted: 'Utløses når et køelement er ferdig',
    onMaintenanceAlert: 'Utløses når et vedlikeholdsvarsel opprettes',
    onServerStart: 'Utløses etter at serveren er startet',
    onBackupCreated: 'Utløses etter at en backup er opprettet'
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
                ${isLoaded ? '<span class="hs-badge hs-badge-good">' + _tl('plugins.loaded', 'Lastet') + '</span>' : ''}
              </div>
              ${plugin.author ? '<div class="plg-author">' + _tl('plugins.by', 'av') + ' ' + _esc(plugin.author) + '</div>' : ''}
              ${plugin.description ? '<div class="plg-desc">' + _esc(plugin.description) + '</div>' : ''}
            </div>
            <label class="wp-toggle" title="${isEnabled ? _tl('plugins.disable', 'Deaktiver') : _tl('plugins.enable', 'Aktiver')}">
              <input type="checkbox" ${isEnabled ? 'checked' : ''} onchange="window._pluginToggle('${_esc(plugin.name)}', this.checked)">
              <span class="wp-toggle-track"></span>
              <span class="wp-toggle-knob"></span>
            </label>
          </div>
          ${hooks.length > 0 ? '<div class="plg-hooks"><span class="plg-hooks-label">' + _tl('plugins.hooks', 'Hooks') + ':</span> ' + hooks.map(h => _hookBadge(h)).join(' ') + '</div>' : ''}
          ${panels.length > 0 ? '<div class="plg-hooks"><span class="plg-hooks-label">' + _tl('plugins.panels_label', 'Paneler') + ':</span> ' + panels.map(p => '<span class="plg-hook-badge" style="--hook-color:var(--accent-blue)">' + _esc(p.name || p) + '</span>').join(' ') + '</div>' : ''}
          <div class="plg-card-footer">
            ${hasSettings ? '<button class="ce-secondary-btn" onclick="window._pluginSettings(\'' + _esc(plugin.name) + '\')"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"/></svg> ' + _tl('plugins.settings_btn', 'Innstillinger') + '</button>' : ''}
            <button class="plg-uninstall-btn" onclick="window._pluginUninstall('${_esc(plugin.name)}')">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
              ${_tl('plugins.uninstall', 'Avinstaller')}
            </button>
          </div>
        </div>`;
      }
      html += '</div>';
    } else {
      html += `<div class="matrec-empty">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="opacity:0.3;margin-bottom:12px"><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/></svg>
        <p>${_tl('plugins.no_plugins', 'Ingen plugins installert. Legg plugin-mapper i data/plugins/')}</p>
      </div>`;
    }

    // Available hooks
    html += `<div class="card plg-info-section">
      <details>
        <summary class="plg-details-summary">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
          ${_tl('plugins.available_hooks', 'Tilgjengelige hooks')}
        </summary>
        <div class="plg-hooks-list">
          ${_hooks.map(h => `<div class="plg-hook-item">
            ${_hookBadge(h)}
            <span class="plg-hook-desc">${_esc(HOOK_DESCS[h] || '')}</span>
          </div>`).join('')}
        </div>
      </details>
    </div>`;

    // Plugin creation guide
    html += `<div class="card plg-info-section">
      <details>
        <summary class="plg-details-summary">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
          ${_tl('plugins.how_to_create', 'Slik lager du en plugin')}
        </summary>
        <div class="plg-guide">
          <p>${_tl('plugins.guide_intro', 'Opprett en mappe i')} <code>data/plugins/din-plugin/</code> ${_tl('plugins.guide_with', 'med disse filene:')}</p>
          <div class="plg-guide-file">manifest.json</div>
          <pre class="plg-code"><code>{
  "name": "my-plugin",
  "version": "1.0.0",
  "description": "What my plugin does",
  "author": "Your Name",
  "entry": "index.js",
  "hooks": ["onPrintStart", "onPrintEnd"],
  "panels": [],
  "settings": {
    "apiKey": { "type": "string", "label": "API Key" }
  }
}</code></pre>
          <div class="plg-guide-file">index.js</div>
          <pre class="plg-code"><code>export function init(api) {
  api.log('Plugin loaded!');
}

export function onPrintStart(data) {
  // data.printerId, etc.
}

export function destroy() {
  // Cleanup when disabled
}</code></pre>
          <p class="plg-guide-note">${_tl('plugins.guide_restart', 'Start serveren på nytt for å laste endringer.')}</p>
        </div>
      </details>
    </div>`;

    html += '</div>';
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
    if (!confirm(_tl('plugins.confirm_uninstall', 'Fjerne denne pluginen fra databasen?'))) return;
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
      <div class="plg-settings-header">${_esc(name)} — ${_tl('plugins.settings_btn', 'Innstillinger')}</div>
      <div class="plg-settings-fields">${fieldsHtml}</div>
      <div class="plg-settings-actions">
        <button class="ce-secondary-btn" onclick="this.closest('.plg-settings-overlay').remove()">${_tl('plugins.cancel', 'Avbryt')}</button>
        <button class="matrec-recalc-btn" style="margin-left:0" id="plg-settings-save">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
          ${_tl('plugins.save', 'Lagre')}
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

  window.loadPluginsPanel = async function() {
    const el = document.getElementById('overlay-panel-body');
    if (el) el.innerHTML = '<div class="matrec-empty"><div class="matrec-spinner"></div></div>';
    await _fetchPlugins();
    _render();
  };
})();
