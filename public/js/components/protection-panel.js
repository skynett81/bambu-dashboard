// Protection Panel — Print Guard with Tabs and Drag-and-Drop
(function() {
  const TAB_CONFIG = {
    status:   { label: 'protection.tab_status',   modules: ['guard-overview','active-alerts','sensor-dashboard'] },
    settings: { label: 'protection.tab_settings',  modules: ['protection-settings'] },
    log:      { label: 'protection.tab_log',       modules: ['protection-log'] }
  };

  const MODULE_SIZE = {
    'guard-overview':       'half',
    'active-alerts':        'half',
    'sensor-dashboard':     'full',
    'protection-settings':  'full',
    'protection-log':       'full'
  };

  const STORAGE_PREFIX = 'protection-module-order-';
  const LOCK_KEY = 'protection-layout-locked';

  let _activeTab = 'status';
  let _locked = localStorage.getItem(LOCK_KEY) !== '0';
  let _printers = [];
  let _alerts = [];
  let _settings = {};
  let _log = [];
  let _draggedMod = null;

  function getOrder(tabId) {
    try { const s = localStorage.getItem(STORAGE_PREFIX + tabId); if (s) return JSON.parse(s); } catch {}
    return TAB_CONFIG[tabId].modules;
  }
  function saveOrder(tabId, order) { localStorage.setItem(STORAGE_PREFIX + tabId, JSON.stringify(order)); }

  // XCam (camera) events
  const XCAM_EVENTS = ['spaghetti_detected', 'first_layer_issue', 'foreign_object', 'nozzle_clump'];
  // Sensor events
  const SENSOR_EVENTS = ['temp_deviation', 'filament_runout', 'print_error', 'fan_failure', 'print_stall'];
  const ALL_EVENTS = [...XCAM_EVENTS, ...SENSOR_EVENTS];

  const EVENT_LABELS = {
    spaghetti_detected: 'protection.spaghetti',
    first_layer_issue:  'protection.first_layer',
    foreign_object:     'protection.foreign_object',
    nozzle_clump:       'protection.nozzle_clump',
    temp_deviation:     'protection.temp_deviation',
    filament_runout:    'protection.filament_runout',
    print_error:        'protection.print_error',
    fan_failure:        'protection.fan_failure',
    print_stall:        'protection.print_stall'
  };

  const EVENT_ICONS = {
    spaghetti_detected: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M8 12s2-4 4-4 4 4 4 4"/></svg>',
    first_layer_issue:  '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="17" width="18" height="4" rx="1"/><path d="M7 17V13m5 4V9m5 8V5"/></svg>',
    foreign_object:     '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>',
    nozzle_clump:       '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v6m0 8v6M2 12h6m8 0h6"/></svg>',
    temp_deviation:     '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z"/></svg>',
    filament_runout:    '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="3"/></svg>',
    print_error:        '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
    fan_failure:        '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 12m-2 0a2 2 0 1 0 4 0a2 2 0 1 0-4 0"/><path d="M12 2C8 2 8 6 8 6s0 2 4 4c4-2 4-4 4-4s0-4-4-4z"/><path d="M12 22c4 0 4-4 4-4s0-2-4-4c-4 2-4 4-4 4s0 4 4 4z"/><path d="M2 12c0 4 4 4 4 4s2 0 4-4c-2-4-4-4-4-4s-4 0-4 4z"/><path d="M22 12c0-4-4-4-4-4s-2 0-4 4c2 4 4 4 4 4s4 0 4-4z"/></svg>',
    print_stall:        '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>'
  };

  const ACTION_LABELS = {
    notify: 'protection.action_notify',
    pause:  'protection.action_pause',
    stop:   'protection.action_stop',
    ignore: 'protection.action_ignore'
  };

  const ACTION_KEY_MAP = {
    spaghetti_detected: 'spaghetti_action',
    first_layer_issue: 'first_layer_action',
    foreign_object: 'foreign_object_action',
    nozzle_clump: 'nozzle_clump_action',
    temp_deviation: 'temp_deviation_action',
    filament_runout: 'filament_runout_action',
    print_error: 'print_error_action',
    fan_failure: 'fan_failure_action',
    print_stall: 'print_stall_action'
  };

  function printerName(id) {
    const p = _printers.find(p => p.id === id);
    return p?.name || id;
  }

  function fmtTime(iso) {
    if (!iso) return '--';
    const l = (window.i18n?.getLocale() || 'nb').replace('_', '-');
    return new Date(iso).toLocaleString(l, { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
  }

  // ═══ Module builders ═══
  const BUILDERS = {
    'guard-overview': () => {
      let h = `<div class="card-title">${t('protection.guard_overview')}</div>`;
      if (!_printers.length) return h + `<div class="text-muted" style="font-size:0.8rem">${t('protection.no_alerts')}</div>`;
      h += '<div class="stats-detail-list">';
      for (const p of _printers) {
        const s = _settings[p.id];
        const enabled = s ? s.enabled : 0;
        const pAlerts = _alerts.filter(a => a.printer_id === p.id);
        const statusColor = enabled ? 'var(--accent-green)' : 'var(--text-muted)';
        const statusText = enabled ? t('protection.enabled') : t('protection.disabled');
        h += `<div class="stats-detail-item">
          <span class="stats-detail-item-label" style="display:flex;align-items:center;gap:6px">
            <span style="width:8px;height:8px;border-radius:50%;background:${statusColor};display:inline-block"></span>
            ${esc(p.name)}
          </span>
          <span class="stats-detail-item-value">${statusText}${pAlerts.length ? ` <span style="color:var(--accent-red);margin-left:6px">${pAlerts.length} alert${pAlerts.length > 1 ? 's' : ''}</span>` : ''}</span>
        </div>`;
      }
      h += '</div>';
      return h;
    },

    'active-alerts': () => {
      let h = `<div class="card-title">${t('protection.active_alerts')}</div>`;
      if (!_alerts.length) return h + `<div class="text-muted" style="font-size:0.8rem">${t('protection.no_alerts')}</div>`;
      h += '<div style="display:flex;flex-direction:column;gap:6px">';
      for (const a of _alerts) {
        const evLabel = t(EVENT_LABELS[a.event_type] || a.event_type);
        const actLabel = t(ACTION_LABELS[a.action_taken] || a.action_taken);
        const icon = EVENT_ICONS[a.event_type] || EVENT_ICONS.print_error;
        const isSensor = SENSOR_EVENTS.includes(a.event_type);
        const borderColor = isSensor ? 'rgba(88,166,255,0.2)' : 'rgba(248,81,73,0.2)';
        const iconColor = isSensor ? 'var(--accent-blue)' : 'var(--accent-red)';
        h += `<div style="display:flex;align-items:center;gap:8px;padding:8px 10px;background:var(--bg-tertiary);border-radius:var(--radius-sm);border:1px solid ${borderColor}">
          <span style="color:${iconColor};flex-shrink:0">${icon}</span>
          <div style="flex:1;min-width:0">
            <div style="font-size:0.8rem;font-weight:600">${esc(printerName(a.printer_id))} — ${evLabel}</div>
            <div style="font-size:0.7rem;color:var(--text-muted)">${actLabel} · ${fmtTime(a.timestamp)}${a.notes ? ` · ${esc(a.notes)}` : ''}</div>
          </div>
          <button class="form-btn form-btn-sm form-btn-secondary" data-ripple data-tooltip="${t('protection.resolve')}" onclick="resolveProtectionAlert(${a.id})">${t('protection.resolve')}</button>
        </div>`;
      }
      h += '</div>';
      return h;
    },

    'sensor-dashboard': () => {
      let h = `<div class="card-title">${t('protection.sensor_dashboard')}</div>`;
      if (!_printers.length) return h + '<div class="text-muted" style="font-size:0.8rem">No printers</div>';
      h += '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:10px">';

      for (const p of _printers) {
        const s = _settings[p.id];
        const enabled = s ? s.enabled : 0;
        h += `<div style="background:var(--bg-tertiary);border-radius:var(--radius);padding:12px;border:1px solid var(--border-color)">
          <div style="font-size:0.8rem;font-weight:600;margin-bottom:8px;display:flex;align-items:center;gap:6px">
            <span style="width:8px;height:8px;border-radius:50%;background:${enabled ? 'var(--accent-green)' : 'var(--text-muted)'};display:inline-block"></span>
            ${esc(p.name)}
          </div>`;

        // XCam section
        h += `<div style="font-size:0.65rem;color:var(--text-muted);margin-bottom:4px;text-transform:uppercase;letter-spacing:0.5px">${t('protection.section_camera')}</div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:4px;margin-bottom:8px">`;
        for (const et of XCAM_EVENTS) {
          h += _sensorCell(s, et);
        }
        h += '</div>';

        // Sensor section
        h += `<div style="font-size:0.65rem;color:var(--text-muted);margin-bottom:4px;text-transform:uppercase;letter-spacing:0.5px">${t('protection.section_sensors')}</div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:4px">`;
        for (const et of SENSOR_EVENTS) {
          h += _sensorCell(s, et);
        }
        h += '</div></div>';
      }
      h += '</div>';
      return h;
    },

    'protection-settings': () => {
      let h = `<div class="card-title">${t('protection.tab_settings')}</div>`;
      if (!_printers.length) return h + '<div class="text-muted">No printers</div>';
      h += '<div style="display:flex;flex-direction:column;gap:16px">';
      for (const p of _printers) {
        const s = _settings[p.id] || _defaultSettings();
        h += `<div style="background:var(--bg-tertiary);border-radius:var(--radius);padding:14px;border:1px solid var(--border-color)">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px">
            <span style="font-size:0.85rem;font-weight:600">${esc(p.name)}</span>
            <label style="display:flex;align-items:center;gap:6px;cursor:pointer;font-size:0.8rem">
              <input type="checkbox" ${s.enabled ? 'checked' : ''} onchange="toggleProtection('${p.id}', this.checked)" style="accent-color:var(--accent-green)">
              ${t('protection.enabled')}
            </label>
          </div>`;

        // Camera AI section
        h += `<div style="font-size:0.7rem;color:var(--text-muted);margin-bottom:6px;text-transform:uppercase;letter-spacing:0.5px">${t('protection.section_camera')}</div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:12px">
            ${_settingsRow(p.id, 'spaghetti_action', 'protection.spaghetti', s.spaghetti_action)}
            ${_settingsRow(p.id, 'first_layer_action', 'protection.first_layer', s.first_layer_action)}
            ${_settingsRow(p.id, 'foreign_object_action', 'protection.foreign_object', s.foreign_object_action)}
            ${_settingsRow(p.id, 'nozzle_clump_action', 'protection.nozzle_clump', s.nozzle_clump_action)}
          </div>`;

        // Sensor section
        h += `<div style="font-size:0.7rem;color:var(--text-muted);margin-bottom:6px;text-transform:uppercase;letter-spacing:0.5px">${t('protection.section_sensors')}</div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:12px">
            ${_settingsRow(p.id, 'temp_deviation_action', 'protection.temp_deviation', s.temp_deviation_action)}
            ${_settingsRow(p.id, 'filament_runout_action', 'protection.filament_runout', s.filament_runout_action)}
            ${_settingsRow(p.id, 'print_error_action', 'protection.print_error', s.print_error_action)}
            ${_settingsRow(p.id, 'fan_failure_action', 'protection.fan_failure', s.fan_failure_action)}
            ${_settingsRow(p.id, 'print_stall_action', 'protection.print_stall', s.print_stall_action)}
          </div>`;

        // Thresholds section
        h += `<div style="font-size:0.7rem;color:var(--text-muted);margin-bottom:6px;text-transform:uppercase;letter-spacing:0.5px">${t('protection.thresholds')}</div>
          <div style="display:flex;gap:12px;flex-wrap:wrap;margin-bottom:10px">
            <label style="font-size:0.75rem;color:var(--text-muted)">${t('protection.temp_threshold')}:
              <input type="number" value="${s.temp_deviation_threshold ?? 15}" min="5" max="50" style="width:55px;padding:3px 6px;background:var(--bg-secondary);border:1px solid var(--border-color);border-radius:6px;color:var(--text-primary);font-size:0.8rem;margin-left:4px" onchange="updateProtectionSetting('${p.id}', 'temp_deviation_threshold', parseInt(this.value))">°C
            </label>
            <label style="font-size:0.75rem;color:var(--text-muted)">${t('protection.filament_threshold')}:
              <input type="number" value="${s.filament_low_pct ?? 5}" min="1" max="30" style="width:55px;padding:3px 6px;background:var(--bg-secondary);border:1px solid var(--border-color);border-radius:6px;color:var(--text-primary);font-size:0.8rem;margin-left:4px" onchange="updateProtectionSetting('${p.id}', 'filament_low_pct', parseInt(this.value))">%
            </label>
            <label style="font-size:0.75rem;color:var(--text-muted)">${t('protection.stall_threshold')}:
              <input type="number" value="${s.stall_minutes ?? 10}" min="3" max="60" style="width:55px;padding:3px 6px;background:var(--bg-secondary);border:1px solid var(--border-color);border-radius:6px;color:var(--text-primary);font-size:0.8rem;margin-left:4px" onchange="updateProtectionSetting('${p.id}', 'stall_minutes', parseInt(this.value))">${t('time.m')}
            </label>
          </div>`;

        // General settings
        h += `<div style="display:flex;gap:12px;align-items:center">
            <label style="font-size:0.75rem;color:var(--text-muted)">${t('protection.cooldown')}:
              <input type="number" value="${s.cooldown_seconds}" min="10" max="600" style="width:60px;padding:3px 6px;background:var(--bg-secondary);border:1px solid var(--border-color);border-radius:6px;color:var(--text-primary);font-size:0.8rem;margin-left:4px" onchange="updateProtectionSetting('${p.id}', 'cooldown_seconds', parseInt(this.value))">
            </label>
            <label style="font-size:0.75rem;color:var(--text-muted);display:flex;align-items:center;gap:4px">
              <input type="checkbox" ${s.auto_resume ? 'checked' : ''} onchange="updateProtectionSetting('${p.id}', 'auto_resume', this.checked ? 1 : 0)" style="accent-color:var(--accent-green)">
              ${t('protection.auto_resume')}
            </label>
          </div>
        </div>`;
      }
      h += '</div>';
      return h;
    },

    'protection-log': () => {
      let h = `<div class="card-title">${t('protection.tab_log')}</div>`;
      if (!_log.length) return h + `<div class="text-muted" style="font-size:0.8rem">${t('protection.no_alerts')}</div>`;
      h += '<div class="protection-log-cards">';
      for (const entry of _log) {
        const evLabel = t(EVENT_LABELS[entry.event_type] || entry.event_type);
        const actLabel = t(ACTION_LABELS[entry.action_taken] || entry.action_taken);
        const isSensor = SENSOR_EVENTS.includes(entry.event_type);
        const accentColor = entry.resolved ? 'var(--text-muted)' : (entry.action_taken === 'stop' ? 'var(--accent-red)' : entry.action_taken === 'pause' ? 'var(--accent-orange)' : isSensor ? 'var(--accent-blue)' : 'var(--accent-red)');
        const icon = EVENT_ICONS[entry.event_type] || '';
        const resolvedCls = entry.resolved ? ' protection-log-card-resolved' : '';
        const actionPill = entry.action_taken === 'pause' ? 'pill-warning' : entry.action_taken === 'stop' ? 'pill-failed' : 'pill-info';

        h += `<div class="protection-log-card protect-card${resolvedCls}">
          <div class="protection-log-card-accent" style="background:${accentColor}"></div>
          <div class="protection-log-card-body">
            <div class="protection-log-card-header">
              <span class="protection-log-card-icon" style="color:${accentColor}">${icon}</span>
              <span class="protection-log-card-event">${evLabel}</span>
              <span class="pill ${actionPill}">${actLabel}</span>
            </div>
            <div class="protection-log-card-meta">
              <span><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="6" y="2" width="12" height="8" rx="1"/><rect x="2" y="14" width="20" height="8" rx="1"/><line x1="6" y1="18" x2="6" y2="18.01"/></svg> ${esc(printerName(entry.printer_id))}</span>
              <span><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> ${fmtTime(entry.timestamp)}</span>
              ${entry.notes ? `<span class="protection-log-card-notes">${esc(entry.notes)}</span>` : ''}
            </div>
            <div class="protection-log-card-footer">
              ${entry.resolved
                ? `<span class="pill pill-completed" style="font-size:0.65rem">${t('protection.resolved_label') || 'Resolved'}</span>`
                : `<button class="form-btn form-btn-sm" data-ripple onclick="resolveProtectionAlert(${entry.id})">${t('protection.resolve')}</button>`}
            </div>
          </div>
        </div>`;
      }
      h += '</div>';
      return h;
    }
  };

  function _sensorCell(s, et) {
    const actionKey = ACTION_KEY_MAP[et];
    const actualAction = s ? (s[actionKey] || 'notify') : 'notify';
    const actColor = actualAction === 'pause' ? 'var(--accent-orange)' :
                    actualAction === 'stop' ? 'var(--accent-red)' :
                    actualAction === 'ignore' ? 'var(--text-muted)' : 'var(--accent-blue)';
    const icon = EVENT_ICONS[et] || '';
    const label = t(EVENT_LABELS[et] || et);
    return `<div style="font-size:0.65rem;padding:4px 6px;border-radius:6px;background:var(--bg-secondary);text-align:center;display:flex;flex-direction:column;align-items:center;gap:2px">
      <span style="color:var(--text-muted)">${icon}</span>
      <div style="color:var(--text-muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:100%">${label}</div>
      <div style="color:${actColor};font-weight:600">${t(ACTION_LABELS[actualAction] || actualAction)}</div>
    </div>`;
  }

  function _defaultSettings() {
    return {
      enabled: 1, spaghetti_action: 'pause', first_layer_action: 'notify', foreign_object_action: 'pause', nozzle_clump_action: 'pause',
      temp_deviation_action: 'notify', filament_runout_action: 'notify', print_error_action: 'notify',
      fan_failure_action: 'notify', print_stall_action: 'notify',
      cooldown_seconds: 60, auto_resume: 0,
      temp_deviation_threshold: 15, filament_low_pct: 5, stall_minutes: 10
    };
  }

  function _settingsRow(printerId, field, labelKey, value) {
    const options = ['notify', 'pause', 'stop', 'ignore'].map(v =>
      `<option value="${v}" ${v === value ? 'selected' : ''}>${t(ACTION_LABELS[v])}</option>`
    ).join('');
    return `<div style="display:flex;flex-direction:column;gap:3px">
      <label style="font-size:0.7rem;color:var(--text-muted)">${t(labelKey)}</label>
      <select onchange="updateProtectionSetting('${printerId}', '${field}', this.value)" style="padding:4px 8px;background:var(--bg-secondary);border:1px solid var(--border-color);border-radius:6px;color:var(--text-primary);font-size:0.78rem;cursor:pointer">${options}</select>
    </div>`;
  }

  // ═══ Rendering ═══
  function render() {
    const body = document.getElementById('overlay-panel-body');
    if (!body) return;

    // Toolbar
    let html = `<div class="stats-toolbar">
      <div class="tabs" style="border-bottom:none;margin-bottom:0">`;
    for (const [id, cfg] of Object.entries(TAB_CONFIG)) {
      html += `<button class="tab-btn${id === _activeTab ? ' active' : ''}" data-ripple onclick="switchProtectionTab('${id}')">${t(cfg.label)}</button>`;
    }
    html += `</div>
      <div class="stats-toolbar-actions">
        <button class="form-btn form-btn-sm form-btn-secondary" data-ripple onclick="toggleProtectionLock()" title="${_locked ? t('protection.layout_locked') : t('protection.layout_unlocked')}">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">${_locked ? '<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>' : '<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 9.9-1"/>'}</svg>
          ${_locked ? t('protection.layout_locked') : t('protection.layout_unlocked')}
        </button>
      </div>
    </div>`;

    // Tab panels
    for (const [id, cfg] of Object.entries(TAB_CONFIG)) {
      const active = id === _activeTab;
      const order = getOrder(id);
      html += `<div class="protection-tab-panel tab-panel stats-tab-panel${active ? ' active' : ''}" id="protection-tab-${id}" style="display:${active?'grid':'none'}">`;
      for (const modId of order) {
        if (!BUILDERS[modId]) continue;
        const size = MODULE_SIZE[modId] || 'full';
        const cls = `stats-module${_locked ? '' : ' stats-module-unlocked'}`;
        const fullCls = size === 'full' ? ' stats-module-full' : '';
        html += `<div class="${cls}${fullCls}" data-module-id="${modId}" ${_locked ? '' : 'draggable="true"'}>
          <span class="stats-module-handle">&#9776;</span>
          ${BUILDERS[modId]()}
        </div>`;
      }
      html += '</div>';
    }

    body.innerHTML = html;
    if (!_locked) initDrag();
  }

  // ═══ Drag and Drop ═══
  function initDrag() {
    const container = document.querySelector(`.protection-tab-panel.active`);
    if (!container) return;
    container.querySelectorAll('.stats-module').forEach(mod => {
      mod.addEventListener('dragstart', e => {
        _draggedMod = mod;
        mod.classList.add('stats-module-dragging');
        e.dataTransfer.effectAllowed = 'move';
      });
      mod.addEventListener('dragend', () => {
        if (_draggedMod) _draggedMod.classList.remove('stats-module-dragging');
        container.querySelectorAll('.stats-module').forEach(m => m.classList.remove('stats-module-over'));
        _draggedMod = null;
      });
      mod.addEventListener('dragover', e => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; mod.classList.add('stats-module-over'); });
      mod.addEventListener('dragleave', () => mod.classList.remove('stats-module-over'));
      mod.addEventListener('drop', e => {
        e.preventDefault();
        mod.classList.remove('stats-module-over');
        if (!_draggedMod || _draggedMod === mod) return;
        const mods = [...container.querySelectorAll('.stats-module')];
        const fromIdx = mods.indexOf(_draggedMod);
        const toIdx = mods.indexOf(mod);
        if (fromIdx < toIdx) mod.after(_draggedMod); else mod.before(_draggedMod);
        const order = [...container.querySelectorAll('.stats-module')].map(m => m.dataset.moduleId);
        saveOrder(_activeTab, order);
      });
    });
  }

  // ═══ Public functions ═══
  window.switchProtectionTab = function(tabId) {
    _activeTab = tabId;
    document.querySelectorAll('.protection-tab-panel').forEach(p => { p.style.display = 'none'; p.classList.remove('active'); });
    const el = document.getElementById('protection-tab-' + tabId);
    if (el) { el.style.display = 'grid'; el.classList.add('active'); }
    document.querySelectorAll('.stats-toolbar .tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelector(`.stats-toolbar .tab-btn[onclick="switchProtectionTab('${tabId}')"]`)?.classList.add('active');
    if (!_locked) initDrag();
    const base = location.hash.split('/')[0] || '#protection';
    history.replaceState(null, '', tabId === 'status' ? base : `${base}/${tabId}`);
  };

  window.toggleProtectionLock = function() {
    _locked = !_locked;
    localStorage.setItem(LOCK_KEY, _locked ? '1' : '0');
    render();
  };

  window.resolveProtectionAlert = async function(logId) {
    try {
      await fetch('/api/protection/resolve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ logId })
      });
      await loadData();
      render();
      updateBadge();
    } catch (e) { console.error('[protection] Resolve failed:', e); }
  };

  window.toggleProtection = async function(printerId, enabled) {
    const s = _settings[printerId] || _defaultSettings();
    s.enabled = enabled ? 1 : 0;
    s.printer_id = printerId;
    await fetch('/api/protection/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(s)
    });
    _settings[printerId] = s;
    render();
  };

  window.updateProtectionSetting = async function(printerId, field, value) {
    const s = _settings[printerId] || _defaultSettings();
    s[field] = value;
    s.printer_id = printerId;
    await fetch('/api/protection/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(s)
    });
    _settings[printerId] = s;
  };

  // ═══ Data loading ═══
  async function loadData() {
    try {
      const [printersRes, statusRes, logRes] = await Promise.all([
        fetch('/api/printers'),
        fetch('/api/protection/status'),
        fetch('/api/protection/log?limit=100')
      ]);
      _printers = await printersRes.json();
      const statusData = await statusRes.json();
      _alerts = statusData.alerts || [];
      _log = await logRes.json();

      // Load settings per printer
      _settings = {};
      await Promise.all(_printers.map(async p => {
        try {
          const res = await fetch(`/api/protection/settings?printer_id=${p.id}`);
          _settings[p.id] = await res.json();
        } catch {}
      }));
    } catch (e) {
      console.error('[protection] Failed to load data:', e);
    }
  }

  function updateBadge() {
    const badge = document.getElementById('protection-badge');
    if (!badge) return;
    if (_alerts.length > 0) {
      badge.textContent = _alerts.length;
      badge.style.display = 'inline-block';
    } else {
      badge.style.display = 'none';
    }
  }

  // ═══ WebSocket handling ═══
  function handleWsMessage(data) {
    if (data.type === 'protection_alert' || data.type === 'protection_resolved') {
      loadData().then(() => {
        if (window._activePanel === 'protection') render();
        updateBadge();
      });
    }
  }

  // ═══ Entry point ═══
  window.loadProtectionPanel = async function() {
    const hashParts = location.hash.replace('#protection', '').split('/').filter(Boolean);
    if (hashParts[0] && TAB_CONFIG[hashParts[0]]) _activeTab = hashParts[0];

    await loadData();
    render();
    updateBadge();
  };

  // Register WebSocket listener
  if (window._wsListeners) {
    window._wsListeners.push(handleWsMessage);
  } else {
    window._wsListeners = [handleWsMessage];
  }

  // Periodically update badge
  setInterval(async () => {
    try {
      const res = await fetch('/api/protection/status');
      const data = await res.json();
      _alerts = data.alerts || [];
      updateBadge();
    } catch {}
  }, 30000);
})();
