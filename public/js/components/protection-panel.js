// Protection Panel — Print Guard with Tabs
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

  let _activeTab = 'status';
  const _locked = true;
  let _printers = [];
  let _alerts = [];
  let _settings = {};
  let _log = [];
  let _logFilter = 'all';

  function getOrder(tabId) {
    return TAB_CONFIG[tabId].modules;
  }

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
      if (!_printers.length) return h + `<div class="text-muted pp-text-sm">${t('protection.no_alerts')}</div>`;
      h += '<div class="stats-detail-list">';
      for (const p of _printers) {
        const s = _settings[p.id];
        const enabled = s ? s.enabled : 0;
        const pAlerts = _alerts.filter(a => a.printer_id === p.id);
        const statusColor = enabled ? 'var(--accent-green)' : 'var(--text-muted)';
        const statusText = enabled ? t('protection.enabled') : t('protection.disabled');
        h += `<div class="stats-detail-item">
          <span class="stats-detail-item-label pp-printer-label">
            <span class="pp-status-dot" style="background:${statusColor}"></span>
            ${esc(p.name)}
          </span>
          <span class="stats-detail-item-value">${statusText}${pAlerts.length ? ` <span class="pp-alert-count">${pAlerts.length} alert${pAlerts.length > 1 ? 's' : ''}</span>` : ''}</span>
        </div>`;
      }
      h += '</div>';
      return h;
    },

    'active-alerts': () => {
      let h = `<div class="card-title">${t('protection.active_alerts')}</div>`;
      if (!_alerts.length) return h + `<div class="text-muted pp-text-sm">${t('protection.no_alerts')}</div>`;
      h += '<div class="pp-alert-list">';
      for (const a of _alerts) {
        const evLabel = t(EVENT_LABELS[a.event_type] || a.event_type);
        const actLabel = t(ACTION_LABELS[a.action_taken] || a.action_taken);
        const icon = EVENT_ICONS[a.event_type] || EVENT_ICONS.print_error;
        const isSensor = SENSOR_EVENTS.includes(a.event_type);
        const borderCls = isSensor ? 'pp-alert-sensor' : 'pp-alert-camera';
        const iconCls = isSensor ? 'pp-icon-sensor' : 'pp-icon-camera';
        h += `<div class="pp-alert-card ${borderCls}">
          <span class="pp-alert-icon ${iconCls}">${icon}</span>
          <div class="pp-alert-body">
            <div class="pp-alert-title">${esc(printerName(a.printer_id))} — ${evLabel}</div>
            <div class="pp-alert-meta">${actLabel} · ${fmtTime(a.timestamp)}${a.notes ? ` · ${esc(a.notes)}` : ''}</div>
          </div>
          <button class="form-btn form-btn-sm form-btn-secondary" data-ripple title="${t('protection.resolve')}" data-bs-toggle="tooltip" onclick="resolveProtectionAlert(${a.id})">${t('protection.resolve')}</button>
        </div>`;
      }
      h += '</div>';
      return h;
    },

    'sensor-dashboard': () => {
      let h = `<div class="card-title">${t('protection.sensor_dashboard')}</div>`;
      if (!_printers.length) return h + `<div class="text-muted pp-text-sm">${t('protection.no_printer', 'No printers')}</div>`;
      h += '<div class="pp-sensor-grid">';

      for (const p of _printers) {
        const s = _settings[p.id];
        const enabled = s ? s.enabled : 0;
        const live = window.printerState?.printers?.[p.id] || {};
        const gcState = live.gcode_state || 'IDLE';
        const isPrinting = ['RUNNING', 'PAUSE', 'PREPARE', 'HEATING'].includes(gcState);
        const _stateMap = { RUNNING: t('state.running', 'Printing'), IDLE: t('state.idle', 'Idle'), PAUSE: t('state.pause', 'Paused'), FINISH: t('state.finish', 'Completed'), FAILED: t('state.failed', 'Failed'), PREPARE: t('state.prepare', 'Preparing') };
        const stateLabel = _stateMap[gcState] || gcState;

        h += `<div class="pp-printer-card">
          <div class="pp-printer-header">
            <div class="pp-printer-name">
              <span class="pp-status-dot" style="background:${enabled ? 'var(--accent-green)' : 'var(--text-muted)'}"></span>
              ${esc(p.name)}
            </div>
            <span class="pill ${isPrinting ? 'pill-success' : 'pill-info'} pp-state-pill">${esc(stateLabel)}</span>
          </div>`;

        // Live sensor readings
        const nTemp = live.nozzle_temper != null ? Math.round(live.nozzle_temper) : null;
        const nTarget = live.nozzle_target_temper != null ? Math.round(live.nozzle_target_temper) : null;
        const bTemp = live.bed_temper != null ? Math.round(live.bed_temper) : null;
        const bTarget = live.bed_target_temper != null ? Math.round(live.bed_target_temper) : null;
        const hbFan = live.heatbreak_fan_speed;
        const cFan = live.cooling_fan_speed;
        const threshold = s?.temp_deviation_threshold || 15;

        if (nTemp != null || bTemp != null) {
          h += '<div class="pp-temp-grid">';
          if (nTemp != null) {
            const nDev = nTarget > 0 ? Math.abs(nTemp - nTarget) : 0;
            const nColor = nDev > threshold ? 'var(--accent-red)' : nTarget > 0 ? 'var(--accent-green)' : 'var(--text-muted)';
            h += `<div class="pp-temp-cell">
              <div class="pp-temp-label">${t('temperature.nozzle', 'Nozzle')}</div>
              <div class="pp-temp-value" style="color:${nColor}">${nTemp}°C</div>
              ${nTarget > 0 ? `<div class="pp-temp-target">→ ${nTarget}°C</div>` : ''}
            </div>`;
          }
          if (bTemp != null) {
            const bDev = bTarget > 0 ? Math.abs(bTemp - bTarget) : 0;
            const bColor = bDev > threshold ? 'var(--accent-red)' : bTarget > 0 ? 'var(--accent-green)' : 'var(--text-muted)';
            h += `<div class="pp-temp-cell">
              <div class="pp-temp-label">${t('temperature.bed', 'Bed')}</div>
              <div class="pp-temp-value" style="color:${bColor}">${bTemp}°C</div>
              ${bTarget > 0 ? `<div class="pp-temp-target">→ ${bTarget}°C</div>` : ''}
            </div>`;
          }
          h += '</div>';
        }

        if (hbFan != null || cFan != null) {
          h += '<div class="pp-fan-row">';
          if (hbFan != null) {
            const hbPct = Math.min(100, Math.round((hbFan / (hbFan > 15 ? 255 : 15)) * 100));
            const hbCls = isPrinting && hbPct === 0 ? 'pp-fan-warn' : '';
            h += `<span class="${hbCls}">Heatbreak: ${hbPct}%</span>`;
          }
          if (cFan != null) {
            const cPct = Math.min(100, Math.round((cFan / (cFan > 15 ? 255 : 15)) * 100));
            h += `<span>Part fan: ${cPct}%</span>`;
          }
          h += '</div>';
        }

        // XCam section
        h += `<div class="pp-section-label">${t('protection.section_camera')}</div>
          <div class="pp-event-grid">`;
        for (const et of XCAM_EVENTS) {
          h += _sensorCell(s, et);
        }
        h += '</div>';

        // Sensor section
        h += `<div class="pp-section-label">${t('protection.section_sensors')}</div>
          <div class="pp-event-grid">`;
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
      h += '<div class="pp-settings-list">';
      for (const p of _printers) {
        const s = _settings[p.id] || _defaultSettings();
        h += `<div class="pp-settings-card">
          <div class="pp-settings-header">
            <span class="pp-settings-name">${esc(p.name)}</span>
            <label class="pp-toggle-label">
              <input type="checkbox" ${s.enabled ? 'checked' : ''} onchange="toggleProtection('${p.id}', this.checked)" class="pp-checkbox">
              ${t('protection.enabled')}
            </label>
          </div>`;

        // Camera AI section
        h += `<div class="pp-section-label">${t('protection.section_camera')}</div>
          <div class="pp-settings-grid">
            ${_settingsRow(p.id, 'spaghetti_action', 'protection.spaghetti', s.spaghetti_action)}
            ${_settingsRow(p.id, 'first_layer_action', 'protection.first_layer', s.first_layer_action)}
            ${_settingsRow(p.id, 'foreign_object_action', 'protection.foreign_object', s.foreign_object_action)}
            ${_settingsRow(p.id, 'nozzle_clump_action', 'protection.nozzle_clump', s.nozzle_clump_action)}
          </div>`;

        // Sensor section
        h += `<div class="pp-section-label">${t('protection.section_sensors')}</div>
          <div class="pp-settings-grid">
            ${_settingsRow(p.id, 'temp_deviation_action', 'protection.temp_deviation', s.temp_deviation_action)}
            ${_settingsRow(p.id, 'filament_runout_action', 'protection.filament_runout', s.filament_runout_action)}
            ${_settingsRow(p.id, 'print_error_action', 'protection.print_error', s.print_error_action)}
            ${_settingsRow(p.id, 'fan_failure_action', 'protection.fan_failure', s.fan_failure_action)}
            ${_settingsRow(p.id, 'print_stall_action', 'protection.print_stall', s.print_stall_action)}
          </div>`;

        // Thresholds section
        h += `<div class="pp-section-label">${t('protection.thresholds')}</div>
          <div class="pp-threshold-row">
            <label class="pp-input-label">${t('protection.temp_threshold')}:
              <input type="number" value="${s.temp_deviation_threshold ?? 15}" min="5" max="50" class="pp-input-number" onchange="updateProtectionSetting('${p.id}', 'temp_deviation_threshold', parseInt(this.value))">°C
            </label>
            <label class="pp-input-label">${t('protection.filament_threshold')}:
              <input type="number" value="${s.filament_low_pct ?? 5}" min="1" max="30" class="pp-input-number" onchange="updateProtectionSetting('${p.id}', 'filament_low_pct', parseInt(this.value))">%
            </label>
            <label class="pp-input-label">${t('protection.stall_threshold')}:
              <input type="number" value="${s.stall_minutes ?? 10}" min="3" max="60" class="pp-input-number" onchange="updateProtectionSetting('${p.id}', 'stall_minutes', parseInt(this.value))">${t('time.m')}
            </label>
          </div>`;

        // General settings
        h += `<div class="pp-general-row">
            <label class="pp-input-label">${t('protection.cooldown')}:
              <input type="number" value="${s.cooldown_seconds}" min="10" max="600" class="pp-input-number pp-input-wide" onchange="updateProtectionSetting('${p.id}', 'cooldown_seconds', parseInt(this.value))">
            </label>
            <label class="pp-toggle-label">
              <input type="checkbox" ${s.auto_resume ? 'checked' : ''} onchange="updateProtectionSetting('${p.id}', 'auto_resume', this.checked ? 1 : 0)" class="pp-checkbox">
              ${t('protection.auto_resume')}
            </label>
          </div>
        </div>`;
      }
      h += '</div>';
      return h;
    },

    'protection-log': () => {
      const total = _log.length;
      const unresolved = _log.filter(e => !e.resolved).length;
      const resolved = total - unresolved;

      // Summary stats
      const typeCounts = {};
      for (const e of _log) { typeCounts[e.event_type] = (typeCounts[e.event_type] || 0) + 1; }

      let h = `<div class="pp-log-header">
        <div class="card-title pp-log-title">${t('protection.tab_log')}</div>
        <div class="pp-log-actions">`;

      // Filter buttons
      h += `<button class="form-btn form-btn-sm ${_logFilter === 'all' ? '' : 'form-btn-secondary'}" data-ripple onclick="_setLogFilter('all')">${t('protection.filter_all', 'Alle')} (${total})</button>`;
      h += `<button class="form-btn form-btn-sm ${_logFilter === 'active' ? '' : 'form-btn-secondary'}" data-ripple onclick="_setLogFilter('active')"${unresolved ? ' style="color:var(--accent-red)"' : ''}>${t('protection.filter_active', 'Active')} (${unresolved})</button>`;
      h += `<button class="form-btn form-btn-sm ${_logFilter === 'resolved' ? '' : 'form-btn-secondary'}" data-ripple onclick="_setLogFilter('resolved')">${t('protection.filter_resolved', 'Resolved')} (${resolved})</button>`;

      // Clear buttons
      if (resolved > 0) {
        h += `<button class="form-btn form-btn-sm form-btn-secondary pp-clear-btn" data-ripple onclick="_clearProtectionLog(true)" title="${t('protection.clear_resolved', 'Clear resolved')}">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
          ${t('protection.clear_resolved', 'Clear resolved')}
        </button>`;
      }
      if (total > 0) {
        h += `<button class="form-btn form-btn-sm form-btn-secondary pp-clear-all-btn" data-ripple onclick="_clearProtectionLog(false)" title="${t('protection.clear_all', 'Clear all')}">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
          ${t('protection.clear_all', 'Clear all')}
        </button>`;
      }
      h += '</div></div>';

      // Event type summary chips
      if (total > 0) {
        h += '<div class="pp-type-chips">';
        for (const [et, count] of Object.entries(typeCounts)) {
          const icon = EVENT_ICONS[et] || '';
          const label = t(EVENT_LABELS[et] || et);
          const isSensor = SENSOR_EVENTS.includes(et);
          const chipCls = isSensor ? 'pp-chip-sensor' : 'pp-chip-camera';
          h += `<span class="pp-type-chip ${chipCls}" onclick="_setLogFilter('type:${et}')">
            ${icon} ${label} <span class="pp-chip-count">${count}</span>
          </span>`;
        }
        h += '</div>';
      }

      // Filter entries
      let filtered = _log;
      if (_logFilter === 'active') filtered = _log.filter(e => !e.resolved);
      else if (_logFilter === 'resolved') filtered = _log.filter(e => e.resolved);
      else if (_logFilter.startsWith('type:')) { const ft = _logFilter.slice(5); filtered = _log.filter(e => e.event_type === ft); }

      if (!filtered.length) {
        return h + `<div class="pp-log-empty">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 12 11 14 15 10"/></svg>
          <div>${t('protection.log_empty', 'No events')}</div>
        </div>`;
      }

      h += '<div class="protection-log-cards">';
      for (const entry of filtered) {
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
              ${entry.resolved
                ? `<span class="pill pill-completed pp-resolved-pill">${t('protection.resolved_label', 'Resolved')}</span>`
                : `<span class="pill pill-failed pp-active-pill">${t('protection.active_label', 'Active')}</span>`}
            </div>
            <div class="protection-log-card-meta">
              <span><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="6" y="2" width="12" height="8" rx="1"/><rect x="2" y="14" width="20" height="8" rx="1"/><line x1="6" y1="18" x2="6" y2="18.01"/></svg> ${esc(printerName(entry.printer_id))}</span>
              <span><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> ${fmtTime(entry.timestamp)}</span>
              ${entry.notes ? `<span class="protection-log-card-notes">${esc(entry.notes)}</span>` : ''}
              ${entry.resolved_at ? `<span class="pp-resolved-time"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg> ${fmtTime(entry.resolved_at)}</span>` : ''}
            </div>
            ${!entry.resolved ? `<div class="protection-log-card-footer">
              <button class="form-btn form-btn-sm" data-ripple onclick="resolveProtectionAlert(${entry.id})">${t('protection.resolve')}</button>
            </div>` : ''}
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
    const actCls = actualAction === 'pause' ? 'pp-act-pause' :
                   actualAction === 'stop' ? 'pp-act-stop' :
                   actualAction === 'ignore' ? 'pp-act-ignore' : 'pp-act-notify';
    const icon = EVENT_ICONS[et] || '';
    const label = t(EVENT_LABELS[et] || et);
    return `<div class="pp-event-cell">
      <span class="pp-event-cell-icon">${icon}</span>
      <div class="pp-event-cell-label">${label}</div>
      <div class="pp-event-cell-action ${actCls}">${t(ACTION_LABELS[actualAction] || actualAction)}</div>
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
    return `<div class="pp-setting-field">
      <label class="pp-setting-label">${t(labelKey)}</label>
      <select onchange="updateProtectionSetting('${printerId}', '${field}', this.value)" class="pp-select">${options}</select>
    </div>`;
  }

  // ═══ Rendering ═══
  function render() {
    const body = document.getElementById('overlay-panel-body');
    if (!body) return;

    // Toolbar
    let html = `<div class="stats-toolbar">
      <div class="tabs pp-tabs">`;
    for (const [id, cfg] of Object.entries(TAB_CONFIG)) {
      html += `<button class="tab-btn${id === _activeTab ? ' active' : ''}" data-ripple onclick="switchProtectionTab('${id}')">${t(cfg.label)}</button>`;
    }
    html += `</div>
    </div>`;

    // Tab panels
    for (const [id, cfg] of Object.entries(TAB_CONFIG)) {
      const active = id === _activeTab;
      const order = getOrder(id);
      html += `<div class="protection-tab-panel tab-panel stats-tab-panel${active ? ' active' : ''}" id="protection-tab-${id}" style="display:${active?'grid':'none'}">`;
      for (const modId of order) {
        if (!BUILDERS[modId]) continue;
        const size = MODULE_SIZE[modId] || 'full';
        const fullCls = size === 'full' ? ' stats-module-full' : '';
        html += `<div class="stats-module${fullCls}" data-module-id="${modId}">
          ${BUILDERS[modId]()}
        </div>`;
      }
      html += '</div>';
    }

    body.innerHTML = html;
  }

  // ═══ Public functions ═══
  window.switchProtectionTab = function(tabId) {
    _activeTab = tabId;
    document.querySelectorAll('.protection-tab-panel').forEach(p => { p.style.display = 'none'; p.classList.remove('active'); });
    const el = document.getElementById('protection-tab-' + tabId);
    if (el) { el.style.display = 'grid'; el.classList.add('active'); }
    document.querySelectorAll('.stats-toolbar .tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelector(`.stats-toolbar .tab-btn[onclick="switchProtectionTab('${tabId}')"]`)?.classList.add('active');
    const base = location.hash.split('/')[0] || '#protection';
    history.replaceState(null, '', tabId === 'status' ? base : `${base}/${tabId}`);
  };

  window._setLogFilter = function(filter) {
    _logFilter = filter;
    render();
  };

  window._clearProtectionLog = async function(resolvedOnly) {
    const msg = resolvedOnly
      ? (t('protection.confirm_clear_resolved', 'Clear all resolved events?'))
      : (t('protection.confirm_clear_all', 'Clear the ENTIRE log? This cannot be undone.'));
    if (!confirm(msg)) return;
    try {
      const qs = resolvedOnly ? '?resolved_only=1' : '';
      await fetch('/api/protection/log' + qs, { method: 'DELETE' });
      await loadData();
      render();
      updateBadge();
      if (typeof showToast === 'function') showToast(t('protection.log_cleared', 'Log cleared'), 'success');
    } catch (e) {
      console.error('[protection] Clear log failed:', e);
    }
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
      const _pid = window.printerState?.getActivePrinterId?.() || '';
      const pidQ = _pid ? `?printer_id=${_pid}` : '';
      const [printersRes, statusRes, logRes] = await Promise.all([
        fetch('/api/printers'),
        fetch(`/api/protection/status${pidQ}`),
        fetch(`/api/protection/log?limit=100${_pid ? '&printer_id=' + _pid : ''}`)
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
  let _refreshTimer = null;
  function handleWsMessage(data) {
    if (data.type === 'protection_alert' || data.type === 'protection_resolved') {
      loadData().then(() => {
        if (window._activePanel === 'protection') render();
        updateBadge();
      });
    }
    // Throttled re-render on printer status updates to keep sensor dashboard live
    if (data.type === 'status' && window._activePanel === 'protection' && _activeTab === 'status') {
      if (!_refreshTimer) {
        _refreshTimer = setTimeout(() => {
          _refreshTimer = null;
          if (window._activePanel === 'protection') render();
        }, 3000);
      }
    }
  }

  // ═══ Entry point ═══
  window.loadProtectionPanel = async function() {
    // Clear any pending refresh timer from previous session
    if (_refreshTimer) { clearTimeout(_refreshTimer); _refreshTimer = null; }

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
