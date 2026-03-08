// Maintenance & Wear Tracking Panel — Modular with Tabs and Drag-and-Drop
(function() {

  // ═══ Helpers ═══
  function formatDate(iso) {
    if (!iso) return '--';
    const locale = (window.i18n?.getLocale() || 'nb').replace('_', '-');
    return new Date(iso).toLocaleDateString(locale, { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  }
  function fmtW(g) { return g >= 1000 ? `${(g/1000).toFixed(1)} kg` : `${Math.round(g)}g`; }
  function sRow(lbl, val, clr) { return `<div class="stats-detail-item"><span class="stats-detail-item-label">${lbl}</span><span class="stats-detail-item-value"${clr?` style="color:${clr}"`:''}>${val}</span></div>`; }

  const COMPONENTS = ['nozzle', 'ptfe_tube', 'linear_rods', 'carbon_rods', 'build_plate', 'general'];
  const ACTIONS = ['cleaned', 'replaced', 'lubricated', 'inspected'];
  const WEAR_LIMITS = {
    fan_cooling: 3000, fan_aux: 3000, fan_chamber: 3000, fan_heatbreak: 3000,
    hotend_heater: 2000, bed_heater: 5000,
    belts_x: 5000, belts_y: 5000,
    linear_rails: 10000, extruder_motor: 5000
  };

  // ═══ Tab config ═══
  const TAB_CONFIG = {
    nozzle:     { label: 'maintenance.tab_nozzle',     modules: ['alerts', 'lifetime-stats', 'active-nozzle', 'nozzle-history'] },
    components: { label: 'maintenance.tab_components', modules: ['component-status', 'wear-tracking', 'schedule'] },
    log:        { label: 'maintenance.tab_log',        modules: ['log-form', 'recent-events'] }
  };
  const MODULE_SIZE = {
    'alerts': 'full', 'lifetime-stats': 'full',
    'active-nozzle': 'half', 'nozzle-history': 'half',
    'component-status': 'half', 'wear-tracking': 'half',
    'schedule': 'full',
    'log-form': 'half', 'recent-events': 'half'
  };

  const STORAGE_PREFIX = 'maint-module-order-';
  const LOCK_KEY = 'maint-layout-locked';

  let _selectedMaintPrinter = null;
  let _activeTab = 'nozzle';
  let _locked = localStorage.getItem(LOCK_KEY) !== '0';
  let _status = null;
  let _log = [];
  let _wear = [];
  let _draggedMod = null;

  // ═══ Persistence ═══
  function getOrder(tabId) {
    try { const o = JSON.parse(localStorage.getItem(STORAGE_PREFIX + tabId)); if (Array.isArray(o)) return o; } catch (_) {}
    return TAB_CONFIG[tabId]?.modules || [];
  }
  function saveOrder(tabId) {
    const cont = document.getElementById(`maint-tab-${tabId}`);
    if (!cont) return;
    const ids = [...cont.querySelectorAll('.stats-module[data-module-id]')].map(m => m.dataset.moduleId);
    localStorage.setItem(STORAGE_PREFIX + tabId, JSON.stringify(ids));
  }

  // ═══ Module builders ═══
  const BUILDERS = {
    'alerts': (s) => {
      const overdueComps = (s.components || []).filter(c => c.overdue);
      const nozzleWarn = s.active_nozzle?.wear_estimate?.percentage >= 80;
      if (overdueComps.length === 0 && !nozzleWarn) return '';
      let h = `<div class="maint-alert-banner">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
        <div class="maint-alert-text">`;
      for (const c of overdueComps) {
        h += `<div>${t('maintenance.comp_' + c.component)} — <strong>${t('maintenance.overdue')}</strong> (${c.hours_since_maintenance}${t('time.h')} / ${c.interval_hours}${t('time.h')})</div>`;
      }
      if (nozzleWarn) {
        h += `<div>${t('maintenance.comp_nozzle')} — <strong>${t('maintenance.wear')}: ${s.active_nozzle.wear_estimate.percentage}%</strong></div>`;
      }
      h += '</div></div>';
      return h;
    },

    'lifetime-stats': (s) => {
      return `<div class="stat-grid">
        <div class="stat-card"><div class="stat-value">${s.total_print_hours}${t('time.h')}</div><div class="stat-label">${t('maintenance.total_hours')}</div></div>
        <div class="stat-card"><div class="stat-value">${s.total_prints}</div><div class="stat-label">${t('maintenance.total_prints')}</div></div>
        <div class="stat-card"><div class="stat-value">${fmtW(s.total_filament_g)}</div><div class="stat-label">${t('maintenance.total_filament')}</div></div>
      </div>`;
    },

    'active-nozzle': (s) => {
      let h = `<div class="card-title">${t('maintenance.active_nozzle')}</div>`;
      if (s.active_nozzle) {
        const n = s.active_nozzle;
        const w = n.wear_estimate;
        const wearColor = w.percentage >= 80 ? 'var(--accent-red)' : w.percentage >= 50 ? 'var(--accent-orange)' : 'var(--accent-green)';
        h += `<div class="nozzle-type">${n.type || 'Unknown'} ${n.diameter}mm</div>
          <div class="nozzle-stats">${n.print_hours}${t('time.h')} | ${fmtW(n.filament_g)} | ${n.print_count} prints</div>
          <div class="nozzle-wear-bar"><div class="nozzle-wear-fill" style="width:${w.percentage}%;background:${wearColor}"></div></div>
          <div class="nozzle-wear-text" style="color:${wearColor}">${t('maintenance.wear')}: ${w.percentage}%</div>
          ${n.abrasive_g > 0 ? `<div class="text-muted" style="font-size:0.75rem;margin-top:4px">${t('maintenance.abrasive_used')}: ${fmtW(n.abrasive_g)}</div>` : ''}`;
      } else {
        h += `<p class="text-muted">${t('maintenance.no_nozzle_data')}</p>`;
      }
      h += `<button class="form-btn form-btn-sm mt-sm" data-ripple onclick="toggleNozzleChangeForm()">${t('maintenance.log_nozzle_change')}</button>
        <div id="nozzle-change-form" style="display:none" class="settings-form mt-sm">
          <div class="form-group" style="margin-bottom:8px">
            <label class="form-label">${t('maintenance.nozzle_type')}</label>
            <select class="form-input" id="nozzle-type-input">
              <option value="stainless_steel">Stainless Steel</option>
              <option value="hardened_steel">Hardened Steel</option>
            </select>
          </div>
          <div class="form-group" style="margin-bottom:8px">
            <label class="form-label">${t('maintenance.nozzle_diameter')}</label>
            <select class="form-input" id="nozzle-dia-input">
              <option value="0.4">0.4mm</option>
              <option value="0.2">0.2mm</option>
              <option value="0.6">0.6mm</option>
              <option value="0.8">0.8mm</option>
            </select>
          </div>
          <button class="form-btn" data-ripple onclick="submitNozzleChange()">${t('maintenance.save')}</button>
        </div>`;
      return h;
    },

    'nozzle-history': (s) => {
      if (!s.nozzle_history?.length) return '';
      let h = `<div class="card-title">${t('maintenance.nozzle_history')}</div>`;
      h += `<table class="data-table"><thead><tr><th>${t('maintenance.nozzle_type')}</th><th>${t('maintenance.nozzle_diameter')}</th><th>${t('maintenance.hours')}</th><th>${t('maintenance.prints')}</th><th>${t('history.status')}</th></tr></thead><tbody>`;
      for (const n of s.nozzle_history) {
        const isActive = !n.retired_at;
        const statusPill = isActive ? `<span class="pill pill-completed">${t('maintenance.installed')}</span>` : `<span class="pill pill-cancelled">${t('maintenance.retired')}</span>`;
        h += `<tr><td>${n.nozzle_type}</td><td>${n.nozzle_diameter}mm</td><td>${Math.round(n.total_print_hours * 10) / 10}${t('time.h')}</td><td>${n.print_count}</td><td>${statusPill}</td></tr>`;
      }
      h += '</tbody></table>';
      return h;
    },

    'component-status': (s) => {
      if (!s.components?.length) return '';
      let h = `<div class="card-title">${t('maintenance.component_status')}</div>`;
      for (const c of s.components) {
        const barColor = c.overdue ? 'var(--accent-red)' : c.percentage >= 75 ? 'var(--accent-orange)' : 'var(--accent-green)';
        const overdueTag = c.overdue ? ` <span class="pill pill-failed">${t('maintenance.overdue')}</span>` : '';
        h += `<div class="maintenance-component">
          <div class="maintenance-component-header">
            <span class="maintenance-component-label">${t('maintenance.comp_' + c.component)}</span>${overdueTag}
            <span class="text-muted" style="font-size:0.75rem;margin-left:auto">${c.hours_since_maintenance}${t('time.h')} / ${c.interval_hours}${t('time.h')}</span>
          </div>
          <div class="maintenance-bar"><div class="maintenance-bar-fill" style="width:${c.percentage}%;background:${barColor}"></div></div>
          ${c.last_maintenance ? `<div class="text-muted" style="font-size:0.7rem">${t('maintenance.last')}: ${formatDate(c.last_maintenance)}</div>` : ''}
        </div>`;
      }
      return h;
    },

    'wear-tracking': (s, log, wearData) => {
      if (!wearData?.length) return '';
      let h = `<div class="card-title">${t('maintenance.wear_tracking')}</div>`;
      for (const w of wearData) {
        const limit = WEAR_LIMITS[w.component] || 5000;
        const pct = Math.min(Math.round((w.total_hours / limit) * 100), 100);
        const wearColor = pct >= 80 ? 'var(--accent-red)' : pct >= 50 ? 'var(--accent-orange)' : 'var(--accent-green)';
        const label = t('maintenance.wear_' + w.component) || w.component;
        h += `<div class="wear-item">
          <span class="wear-label">${label}</span>
          <div class="wear-bar"><div class="wear-bar-fill" style="width:${pct}%;background:${wearColor}"></div></div>
          <span class="wear-value">${Math.round(w.total_hours)}${t('time.h')}${w.total_cycles > 0 ? ` / ${w.total_cycles}x` : ''}</span>
        </div>`;
      }
      return h;
    },

    'schedule': (s) => {
      if (!s.components?.length) return '';
      let h = `<div class="card-title">${t('maintenance.schedule')}</div><div class="maint-schedule-grid">`;
      for (const c of s.components) {
        h += `<div class="form-group" style="margin-bottom:0">
          <label class="form-label" style="font-size:0.7rem">${t('maintenance.comp_' + c.component)}</label>
          <div class="flex gap-sm items-center">
            <input class="form-input" style="width:60px;text-align:center" type="number" value="${c.interval_hours}" min="1" data-comp="${c.component}" onchange="updateSchedule(this)">
            <span class="text-muted" style="font-size:0.75rem">${t('time.h')}</span>
          </div>
        </div>`;
      }
      h += '</div>';
      return h;
    },

    'log-form': () => {
      return `<button class="form-btn" data-ripple onclick="toggleMaintenanceForm()">${t('maintenance.log_event')}</button>
        <div id="maint-form-area" style="display:none" class="settings-form mt-sm">
          <div class="flex gap-sm" style="flex-wrap:wrap;align-items:flex-end">
            <div class="form-group" style="flex:1;min-width:120px;margin-bottom:0">
              <label class="form-label">${t('maintenance.component')}</label>
              <select class="form-input" id="maint-component">
                ${COMPONENTS.map(c => `<option value="${c}">${t('maintenance.comp_' + c)}</option>`).join('')}
              </select>
            </div>
            <div class="form-group" style="flex:1;min-width:100px;margin-bottom:0">
              <label class="form-label">${t('maintenance.action')}</label>
              <select class="form-input" id="maint-action">
                ${ACTIONS.map(a => `<option value="${a}">${t('maintenance.action_' + a)}</option>`).join('')}
              </select>
            </div>
            <div class="form-group" style="flex:2;min-width:150px;margin-bottom:0">
              <label class="form-label">${t('maintenance.notes')}</label>
              <input class="form-input" id="maint-notes" placeholder="${t('waste.notes_placeholder')}">
            </div>
            <button class="form-btn" data-ripple onclick="submitMaintenance()">${t('maintenance.save')}</button>
          </div>
        </div>`;
    },

    'recent-events': (s, log) => {
      if (!log?.length) return '';
      let h = `<div class="card-title">${t('maintenance.recent_events')}</div>`;
      h += `<table class="data-table"><thead><tr><th>${t('history.date')}</th><th>${t('maintenance.component')}</th><th>${t('maintenance.action')}</th><th>${t('maintenance.notes')}</th></tr></thead><tbody>`;
      for (const e of log) {
        h += `<tr><td>${formatDate(e.timestamp)}</td><td>${t('maintenance.comp_' + e.component)}</td><td>${t('maintenance.action_' + e.action)}</td><td>${e.notes || '--'}</td></tr>`;
      }
      h += '</tbody></table>';
      return h;
    }
  };

  // ═══ Tab switching ═══
  function switchTab(tabId) {
    _activeTab = tabId;
    document.querySelectorAll('.maint-tab-btn').forEach(b => b.classList.toggle('active', b.dataset.tab === tabId));
    document.querySelectorAll('.maint-tab-panel').forEach(p => {
      const isActive = p.id === `maint-tab-${tabId}`;
      p.classList.toggle('active', isActive);
      p.style.display = isActive ? 'grid' : 'none';
    });
    const slug = tabId === 'nozzle' ? 'maintenance' : `maintenance/${tabId}`;
    if (location.hash !== '#' + slug) history.replaceState(null, '', '#' + slug);
  }

  // ═══ Module Drag & Drop ═══
  function initModuleDrag(container, tabId) {
    container.addEventListener('dragstart', e => {
      const mod = e.target.closest('.stats-module');
      if (!mod || _locked) { e.preventDefault(); return; }
      _draggedMod = mod;
      mod.classList.add('stats-module-dragging');
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', '');
    });
    container.addEventListener('dragover', e => {
      e.preventDefault();
      if (!_draggedMod || _locked) return;
      e.dataTransfer.dropEffect = 'move';
      const target = e.target.closest('.stats-module');
      if (target && target !== _draggedMod) {
        const rect = target.getBoundingClientRect();
        const midY = rect.top + rect.height / 2;
        if (e.clientY < midY) container.insertBefore(_draggedMod, target);
        else container.insertBefore(_draggedMod, target.nextSibling);
      }
    });
    container.addEventListener('drop', e => {
      e.preventDefault();
      if (_draggedMod) { _draggedMod.classList.remove('stats-module-dragging'); saveOrder(tabId); _draggedMod = null; }
    });
    container.addEventListener('dragend', () => {
      if (_draggedMod) { _draggedMod.classList.remove('stats-module-dragging'); _draggedMod = null; }
    });
  }

  // ═══ Main render ═══
  async function loadMaintenance() {
    const panel = document.getElementById('overlay-panel-body');
    if (!panel) return;

    // Read sub-slug from hash
    const hashParts = location.hash.replace('#', '').split('/');
    if (hashParts[0] === 'maintenance' && hashParts[1] && TAB_CONFIG[hashParts[1]]) {
      _activeTab = hashParts[1];
    }

    const printerId = _selectedMaintPrinter || window.printerState.getActivePrinterId();
    _selectedMaintPrinter = printerId;

    if (!printerId) {
      panel.innerHTML = `<div style="text-align:center;padding:3rem 1rem">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" stroke-width="1.5" style="margin-bottom:1rem"><rect x="6" y="2" width="12" height="8" rx="1"/><rect x="4" y="10" width="16" height="10" rx="1"/><circle cx="8" cy="15" r="1"/><line x1="12" y1="15" x2="18" y2="15"/></svg>
        <h3 style="margin:0 0 0.5rem;color:var(--text-primary)">${t('common.no_printers_title')}</h3>
        <p class="text-muted" style="margin:0 0 1rem">${t('common.no_printers_desc')}</p>
        <button class="btn btn-primary" onclick="location.hash='#settings'">${t('common.add_printer_btn')}</button>
      </div>`;
      return;
    }

    try {
      const [statusRes, logRes] = await Promise.all([
        fetch(`/api/maintenance/status?printer_id=${printerId}`),
        fetch(`/api/maintenance/log?printer_id=${printerId}&limit=20`)
      ]);
      _status = await statusRes.json();
      _log = await logRes.json();

      // Fetch wear data (optional)
      try {
        const wearRes = await fetch(`/api/wear?printer_id=${printerId}`);
        _wear = await wearRes.json();
      } catch (_) { _wear = []; }

      let html = '';

      // Printer selector
      html += buildPrinterSelector('changeMaintPrinter', _selectedMaintPrinter, false);

      // Toolbar
      const lockIcon = _locked
        ? '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>'
        : '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 019.9-1"/></svg>';
      html += `<div class="stats-toolbar">
        <button class="form-btn" data-ripple data-tooltip="${t('maintenance.log_nozzle_change')}" onclick="showGlobalNozzleChange()" style="display:flex;align-items:center;gap:4px">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>
          <span>${t('maintenance.log_nozzle_change')}</span>
        </button>
        <button class="form-btn" data-ripple data-tooltip="${t('maintenance.log_event')}" onclick="showGlobalMaintEvent()" style="display:flex;align-items:center;gap:4px">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          <span>${t('maintenance.log_event')}</span>
        </button>
        <button class="speed-btn ${_locked ? '' : 'active'}" data-ripple onclick="toggleMaintLock()" title="${_locked ? t('maintenance.layout_locked') : t('maintenance.layout_unlocked')}">
          ${lockIcon} <span>${_locked ? t('maintenance.layout_locked') : t('maintenance.layout_unlocked')}</span>
        </button>
      </div>`;

      // Global form container
      html += `<div id="maint-global-form" style="display:none"></div>`;

      // Tab bar
      html += '<div class="tabs">';
      for (const [id, cfg] of Object.entries(TAB_CONFIG)) {
        html += `<button class="tab-btn maint-tab-btn ${id === _activeTab ? 'active' : ''}" data-tab="${id}" data-ripple onclick="switchMaintTab('${id}')">${t(cfg.label)}</button>`;
      }
      html += '</div>';

      // Tab panels
      for (const [tabId, cfg] of Object.entries(TAB_CONFIG)) {
        const order = getOrder(tabId);
        html += `<div class="tab-panel maint-tab-panel stats-tab-panel stagger-in ix-tab-panel ${tabId === _activeTab ? 'active' : ''}" id="maint-tab-${tabId}" style="display:${tabId === _activeTab ? 'grid' : 'none'}">`;
        let _si = 0;
        for (const modId of order) {
          const builder = BUILDERS[modId];
          if (!builder) continue;
          const content = builder(_status, _log, _wear);
          if (!content) continue;
          const draggable = _locked ? '' : 'draggable="true"';
          const unlocked = _locked ? '' : ' stats-module-unlocked';
          const isFull = (MODULE_SIZE[modId] || 'full') === 'full';
          html += `<div class="stats-module${unlocked}${isFull ? ' stats-module-full' : ''}" data-module-id="${modId}" ${draggable} style="--i:${_si++}">`;
          if (!_locked) html += '<div class="stats-module-handle" title="Drag to reorder">&#x2630;</div>';
          html += content;
          html += '</div>';
        }
        html += '</div>';
      }

      panel.innerHTML = html;

      // Attach module DnD
      for (const tabId of Object.keys(TAB_CONFIG)) {
        const cont = document.getElementById(`maint-tab-${tabId}`);
        if (cont) initModuleDrag(cont, tabId);
      }
    } catch (e) {
      panel.innerHTML = `<p class="text-muted">${t('maintenance.load_failed')}</p>`;
    }
  }

  // ═══ Global toolbar forms ═══
  window.showGlobalNozzleChange = function() {
    const container = document.getElementById('maint-global-form');
    if (!container) return;
    container.style.display = '';
    container.innerHTML = `<div class="settings-card" style="margin-bottom:10px">
      <div class="settings-form">
        <div class="flex gap-sm" style="flex-wrap:wrap;align-items:flex-end">
          <div class="form-group" style="flex:1;min-width:140px;margin-bottom:0">
            <label class="form-label">${t('maintenance.nozzle_type')}</label>
            <select class="form-input" id="global-nozzle-type">
              <option value="stainless_steel">Stainless Steel</option>
              <option value="hardened_steel">Hardened Steel</option>
            </select>
          </div>
          <div class="form-group" style="flex:1;min-width:100px;margin-bottom:0">
            <label class="form-label">${t('maintenance.nozzle_diameter')}</label>
            <select class="form-input" id="global-nozzle-dia">
              <option value="0.4">0.4mm</option>
              <option value="0.2">0.2mm</option>
              <option value="0.6">0.6mm</option>
              <option value="0.8">0.8mm</option>
            </select>
          </div>
          <button class="form-btn" data-ripple onclick="submitGlobalNozzleChange()">${t('maintenance.save')}</button>
          <button class="form-btn form-btn-sm" data-ripple style="background:transparent;color:var(--text-muted)" onclick="hideGlobalMaintForm()">${t('settings.cancel')}</button>
        </div>
      </div>
    </div>`;
    container.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  };

  window.showGlobalMaintEvent = function() {
    const container = document.getElementById('maint-global-form');
    if (!container) return;
    container.style.display = '';
    container.innerHTML = `<div class="settings-card" style="margin-bottom:10px">
      <div class="settings-form">
        <div class="flex gap-sm" style="flex-wrap:wrap;align-items:flex-end">
          <div class="form-group" style="flex:1;min-width:120px;margin-bottom:0">
            <label class="form-label">${t('maintenance.component')}</label>
            <select class="form-input" id="global-maint-component">
              ${COMPONENTS.map(c => `<option value="${c}">${t('maintenance.comp_' + c)}</option>`).join('')}
            </select>
          </div>
          <div class="form-group" style="flex:1;min-width:100px;margin-bottom:0">
            <label class="form-label">${t('maintenance.action')}</label>
            <select class="form-input" id="global-maint-action">
              ${ACTIONS.map(a => `<option value="${a}">${t('maintenance.action_' + a)}</option>`).join('')}
            </select>
          </div>
          <div class="form-group" style="flex:2;min-width:150px;margin-bottom:0">
            <label class="form-label">${t('maintenance.notes')}</label>
            <input class="form-input" id="global-maint-notes" placeholder="${t('waste.notes_placeholder')}">
          </div>
          <button class="form-btn" data-ripple onclick="submitGlobalMaintEvent()">${t('maintenance.save')}</button>
          <button class="form-btn form-btn-sm" data-ripple style="background:transparent;color:var(--text-muted)" onclick="hideGlobalMaintForm()">${t('settings.cancel')}</button>
        </div>
      </div>
    </div>`;
    container.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  };

  window.hideGlobalMaintForm = function() {
    const c = document.getElementById('maint-global-form');
    if (c) { c.style.display = 'none'; c.innerHTML = ''; }
  };

  window.submitGlobalNozzleChange = async function() {
    const printerId = _selectedMaintPrinter || window.printerState.getActivePrinterId();
    const nozzleType = document.getElementById('global-nozzle-type')?.value;
    const nozzleDia = parseFloat(document.getElementById('global-nozzle-dia')?.value);
    if (!printerId || !nozzleType || !nozzleDia) return;
    await fetch('/api/maintenance/nozzle-change', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ printer_id: printerId, nozzle_type: nozzleType, nozzle_diameter: nozzleDia })
    });
    loadMaintenance();
  };

  window.submitGlobalMaintEvent = async function() {
    const printerId = _selectedMaintPrinter || window.printerState.getActivePrinterId();
    const component = document.getElementById('global-maint-component')?.value;
    const action = document.getElementById('global-maint-action')?.value;
    const notes = document.getElementById('global-maint-notes')?.value?.trim();
    if (!printerId || !component || !action) return;
    await fetch('/api/maintenance/log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ printer_id: printerId, component, action, notes: notes || null })
    });
    loadMaintenance();
  };

  // ═══ Global API ═══
  window.loadMaintenancePanel = loadMaintenance;
  window.changeMaintPrinter = function(value) { _selectedMaintPrinter = value || null; loadMaintenance(); };
  window.switchMaintTab = switchTab;
  window.toggleMaintLock = function() {
    _locked = !_locked;
    localStorage.setItem(LOCK_KEY, _locked ? '1' : '0');
    loadMaintenance();
  };

  window.toggleNozzleChangeForm = function() {
    const f = document.getElementById('nozzle-change-form');
    if (f) f.style.display = f.style.display === 'none' ? '' : 'none';
  };

  window.toggleMaintenanceForm = function() {
    const f = document.getElementById('maint-form-area');
    if (f) f.style.display = f.style.display === 'none' ? '' : 'none';
  };

  window.submitNozzleChange = async function() {
    const printerId = _selectedMaintPrinter || window.printerState.getActivePrinterId();
    const nozzleType = document.getElementById('nozzle-type-input')?.value;
    const nozzleDia = parseFloat(document.getElementById('nozzle-dia-input')?.value);
    if (!printerId || !nozzleType || !nozzleDia) return;
    await fetch('/api/maintenance/nozzle-change', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ printer_id: printerId, nozzle_type: nozzleType, nozzle_diameter: nozzleDia })
    });
    loadMaintenance();
  };

  window.submitMaintenance = async function() {
    const printerId = _selectedMaintPrinter || window.printerState.getActivePrinterId();
    const component = document.getElementById('maint-component')?.value;
    const action = document.getElementById('maint-action')?.value;
    const notes = document.getElementById('maint-notes')?.value?.trim();
    if (!printerId || !component || !action) return;
    await fetch('/api/maintenance/log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ printer_id: printerId, component, action, notes: notes || null })
    });
    loadMaintenance();
  };

  window.updateSchedule = async function(input) {
    const printerId = _selectedMaintPrinter || window.printerState.getActivePrinterId();
    const component = input.dataset.comp;
    const intervalHours = parseInt(input.value, 10);
    if (!printerId || !component || isNaN(intervalHours) || intervalHours < 1) return;
    try {
      await fetch('/api/maintenance/schedule', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ printer_id: printerId, component, interval_hours: intervalHours })
      });
      if (typeof showToast === 'function') showToast(t('maintenance.schedule_saved') || 'Saved', 'success');
      loadMaintenance();
    } catch (_) {}
  };

})();
