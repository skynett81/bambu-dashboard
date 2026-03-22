// Error Log — Modular with Tabs
(function() {

  // ═══ Helpers ═══
  const _ESC_MAP = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
  function esc(s) { if (s == null) return ''; return String(s).replace(/[&<>"']/g, c => _ESC_MAP[c]); }

  function printerName(id) {
    return window.printerState?._printerMeta?.[id]?.name || id || '--';
  }
  function formatDate(iso) {
    if (!iso) return '--';
    const locale = (window.i18n?.getLocale() || 'nb').replace('_', '-');
    return new Date(iso).toLocaleDateString(locale, { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
  }
  function timeAgo(iso) {
    if (!iso) return '';
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return t('errors.just_now');
    if (mins < 60) return `${mins}${t('time.m')}`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}${t('time.h')}`;
    return `${Math.floor(hrs / 24)}d`;
  }
  function severityIcon(sev) {
    switch (sev) {
      case 'fatal':
      case 'critical': return '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>';
      case 'error': return '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>';
      case 'warning': return '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>';
      default: return '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>';
    }
  }
  function severityColor(sev) {
    switch (sev) {
      case 'fatal':
      case 'critical': return 'var(--accent-red)';
      case 'error': return 'var(--accent-orange)';
      case 'warning': return 'var(--accent-yellow, #e3b341)';
      default: return 'var(--accent-blue)';
    }
  }
  function barRow(lbl, pct, clr, val) { return `<div class="chart-bar-row"><span class="chart-bar-label">${lbl}</span><div class="chart-bar-track"><div class="chart-bar-fill" style="width:${pct}%;background:${clr}"></div></div><span class="chart-bar-value">${val}</span></div>`; }

  function parseContext(e) {
    if (!e.context) return null;
    try { return typeof e.context === 'string' ? JSON.parse(e.context) : e.context; } catch { return null; }
  }

  function countOccurrences(errors, code) {
    if (!code) return 0;
    let n = 0;
    for (const e of errors) { if (e.code === code) n++; }
    return n;
  }

  function stateLabel(state) {
    const map = { RUNNING: t('state.running') || 'Skriver ut', IDLE: t('state.idle') || 'Inaktiv', PAUSE: t('state.pause') || 'Pauset', FINISH: t('state.finish') || 'Fullført', FAILED: t('state.failed') || 'Feilet', PREPARE: t('state.prepare') || 'Forbereder' };
    return map[state] || state || '--';
  }

  function fanPercent(raw) {
    const v = parseInt(raw) || 0;
    if (v === 0) return '0%';
    const max = v > 15 ? 255 : 15;
    return Math.min(100, Math.round((v / max) * 100)) + '%';
  }

  // ═══ Tab config ═══
  const TAB_CONFIG = {
    log:   { label: 'errors.tab_log',   modules: ['error-summary', 'error-filters', 'error-list'] },
    stats: { label: 'errors.tab_stats', modules: ['severity-breakdown', 'printer-breakdown', 'common-errors'] }
  };
  const MODULE_SIZE = {
    'error-summary': 'half', 'error-filters': 'half', 'error-list': 'full',
    'severity-breakdown': 'half', 'printer-breakdown': 'half', 'common-errors': 'full'
  };

  let _allErrors = [];
  let _activeSeverity = 'all';
  let _searchTerm = '';
  let _selectedErrorPrinter = null;
  let _activeTab = 'log';
  let _showAcknowledged = false;
  const _locked = true;

  // ═══ Persistence ═══
  function getOrder(tabId) {
    return TAB_CONFIG[tabId]?.modules || [];
  }

  // ═══ Severity counts ═══
  function getCounts(errors) {
    const c = { fatal: 0, critical: 0, error: 0, warning: 0, info: 0 };
    for (const e of errors) {
      const sev = e.severity || 'info';
      if (c[sev] !== undefined) c[sev]++;
      else c.info++;
    }
    return c;
  }

  // ═══ Module builders ═══
  const BUILDERS = {
    'error-summary': (errors) => {
      const c = getCounts(errors);
      const ackCount = errors.filter(e => e.acknowledged).length;
      const unackCount = errors.length - ackCount;
      return `<div class="stat-grid">
        <div class="stat-card"><div class="stat-value">${errors.length}</div><div class="stat-label">${t('errors.total')}</div></div>
        <div class="stat-card"><div class="stat-value" style="color:var(--accent-red)">${c.fatal + c.critical}</div><div class="stat-label">${t('errors.critical')}</div></div>
        <div class="stat-card"><div class="stat-value" style="color:var(--accent-orange)">${c.error}</div><div class="stat-label">${t('errors.errors')}</div></div>
        <div class="stat-card"><div class="stat-value" style="color:var(--accent-green)">${ackCount}</div><div class="stat-label">${t('errors.acknowledged')}</div></div>
        <div class="stat-card"><div class="stat-value" style="color:var(--accent-yellow, #e3b341)">${unackCount}</div><div class="stat-label">${t('errors.unacknowledged')}</div></div>
      </div>`;
    },

    'error-filters': (errors) => {
      const c = getCounts(errors);
      let h = `<div class="error-sidebar-filters">
        <button class="error-filter-btn ${_activeSeverity === 'all' ? 'active' : ''}" data-ripple onclick="filterErrorSeverity('all')">${t('errors.all')}</button>
        <button class="error-filter-btn ${_activeSeverity === 'critical' ? 'active' : ''}" data-ripple onclick="filterErrorSeverity('critical')" style="--filter-color:var(--accent-red)">${t('errors.critical')} (${c.fatal + c.critical})</button>
        <button class="error-filter-btn ${_activeSeverity === 'error' ? 'active' : ''}" data-ripple onclick="filterErrorSeverity('error')" style="--filter-color:var(--accent-orange)">${t('errors.errors')} (${c.error})</button>
        <button class="error-filter-btn ${_activeSeverity === 'warning' ? 'active' : ''}" data-ripple onclick="filterErrorSeverity('warning')" style="--filter-color:var(--accent-yellow, #e3b341)">${t('errors.warnings')} (${c.warning})</button>
      </div>
      <div style="margin-top:8px">
        <input type="text" class="form-input" style="width:100%" placeholder="${t('errors.search_placeholder')}" value="${_searchTerm}" oninput="searchErrors(this.value)">
      </div>
      <div style="margin-top:8px;display:flex;gap:6px;flex-wrap:wrap">
        <button class="error-filter-btn ${!_showAcknowledged ? 'active' : ''}" data-ripple style="--filter-color:var(--accent-blue)" onclick="toggleErrorAcknowledged(false)">${t('errors.show_active')}</button>
        <button class="error-filter-btn ${_showAcknowledged ? 'active' : ''}" data-ripple style="--filter-color:var(--accent-green)" onclick="toggleErrorAcknowledged(true)">${t('errors.show_all')}</button>
      </div>`;
      return h;
    },

    'error-list': (errors) => {
      const unackCount = errors.filter(e => !e.acknowledged).length;
      let h = '';
      if (unackCount > 0) {
        h += `<div style="display:flex;justify-content:flex-end;margin-bottom:8px">
          <button class="speed-btn" onclick="acknowledgeAllErrors()" title="${t('errors.acknowledge_all')}">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
            <span>${t('errors.acknowledge_all')}</span>
          </button>
        </div>`;
      }
      h += `<div id="error-cards-container" style="max-height:600px;overflow-y:auto"></div>`;
      return h;
    },

    'severity-breakdown': (errors) => {
      if (!errors.length) return '';
      const c = getCounts(errors);
      const entries = [
        [t('errors.critical'), c.fatal + c.critical, 'var(--accent-red)'],
        [t('errors.errors'), c.error, 'var(--accent-orange)'],
        [t('errors.warnings'), c.warning, 'var(--accent-yellow, #e3b341)'],
        [t('errors.info'), c.info, 'var(--accent-blue)']
      ].filter(e => e[1] > 0);
      const mx = Math.max(...entries.map(e => e[1]), 1);
      let h = `<div class="card-title">${t('errors.severity_breakdown')}</div><div class="chart-bars">`;
      for (const [lbl, cnt, clr] of entries) {
        h += barRow(lbl, (cnt / mx) * 100, clr, cnt);
      }
      h += '</div>';
      return h;
    },

    'printer-breakdown': (errors) => {
      if (!errors.length) return '';
      const byPrinter = {};
      for (const e of errors) {
        const pid = e.printer_id || 'unknown';
        byPrinter[pid] = (byPrinter[pid] || 0) + 1;
      }
      const sorted = Object.entries(byPrinter).sort((a, b) => b[1] - a[1]);
      const mx = sorted[0]?.[1] || 1;
      let h = `<div class="card-title">${t('errors.printer_breakdown')}</div><div class="chart-bars">`;
      for (const [pid, cnt] of sorted) {
        h += barRow(esc(printerName(pid)), (cnt / mx) * 100, 'var(--accent-purple)', cnt);
      }
      h += '</div>';
      return h;
    },

    'common-errors': (errors) => {
      if (!errors.length) return '';
      const byMsg = {};
      for (const e of errors) {
        const key = e.message || t('errors.unknown_error');
        if (!byMsg[key]) byMsg[key] = { count: 0, severity: e.severity || 'info', code: e.code };
        byMsg[key].count++;
      }
      const sorted = Object.entries(byMsg).sort((a, b) => b[1].count - a[1].count).slice(0, 10);
      if (sorted.length === 0) return '';
      let h = `<div class="card-title">${t('errors.common_errors')}</div>`;
      h += '<div class="error-common-list">';
      for (const [msg, data] of sorted) {
        const color = severityColor(data.severity);
        h += `<div class="error-common-item">
          <span class="error-common-icon" style="color:${color}">${severityIcon(data.severity)}</span>
          <span class="error-common-msg">${esc(msg)}</span>
          ${data.code ? `<span class="error-code">${esc(data.code)}</span>` : ''}
          <span class="error-common-count" style="color:${color}">${data.count}x</span>
        </div>`;
      }
      h += '</div>';
      return h;
    }
  };

  // ═══ Tab switching ═══
  function switchTab(tabId) {
    _activeTab = tabId;
    document.querySelectorAll('.error-tab-btn').forEach(b => b.classList.toggle('active', b.dataset.tab === tabId));
    document.querySelectorAll('.error-tab-panel').forEach(p => {
      const isActive = p.id === `error-tab-${tabId}`;
      p.classList.toggle('active', isActive);
      p.style.display = isActive ? 'grid' : 'none';
      if (isActive) {
        p.classList.add('ix-tab-panel');
        p.addEventListener('animationend', () => p.classList.remove('ix-tab-panel'), { once: true });
      }
    });
    const slug = tabId === 'log' ? 'errors' : `errors/${tabId}`;
    if (location.hash !== '#' + slug) history.replaceState(null, '', '#' + slug);
  }

  // ═══ Main render ═══
  async function loadErrors() {
    const panel = document.getElementById('overlay-panel-body');
    if (!panel) return;

    // Read sub-slug from hash
    const hashParts = location.hash.replace('#', '').split('/');
    if (hashParts[0] === 'errors' && hashParts[1]) {
      if (TAB_CONFIG[hashParts[1]]) {
        _activeTab = hashParts[1];
      } else if (['all', 'critical', 'error', 'warning'].includes(hashParts[1])) {
        _activeSeverity = hashParts[1];
        _activeTab = 'log';
      }
    }

    const printerId = _selectedErrorPrinter;
    const params = printerId ? `?limit=100&printer_id=${printerId}` : '?limit=100';

    try {
      const res = await fetch(`/api/errors${params}`);
      _allErrors = await res.json();

      if (!_allErrors.length) {
        let html = buildPrinterSelector('changeErrorPrinter', _selectedErrorPrinter);
        html += `<div class="error-empty-state">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--accent-green)" stroke-width="1.5" style="opacity:0.5">
            <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
          </svg>
          <p class="text-muted" style="margin-top:12px">${t('errors.no_errors')}</p>
        </div>`;
        panel.innerHTML = html;
        return;
      }

      let html = '';

      // Printer selector
      html += buildPrinterSelector('changeErrorPrinter', _selectedErrorPrinter);

      // Tab bar
      html += '<div class="tabs">';
      for (const [id, cfg] of Object.entries(TAB_CONFIG)) {
        html += `<button class="tab-btn error-tab-btn ${id === _activeTab ? 'active' : ''}" data-tab="${id}" onclick="switchErrorTab('${id}')">${t(cfg.label)}</button>`;
      }
      html += '</div>';

      // Tab panels
      for (const [tabId, cfg] of Object.entries(TAB_CONFIG)) {
        const order = getOrder(tabId);
        html += `<div class="tab-panel error-tab-panel stats-tab-panel stagger-in ${tabId === _activeTab ? 'active' : ''}" id="error-tab-${tabId}" style="display:${tabId === _activeTab ? 'grid' : 'none'}">`;
        let _si = 0;
        for (const modId of order) {
          const builder = BUILDERS[modId];
          if (!builder) continue;
          const content = builder(_allErrors);
          if (!content) continue;
          const isFull = (MODULE_SIZE[modId] || 'full') === 'full';
          html += `<div class="stats-module${isFull ? ' stats-module-full' : ''}" data-module-id="${modId}" style="--i:${_si++}">`;
          html += content;
          html += '</div>';
        }
        html += '</div>';
      }

      panel.innerHTML = html;

      // Render error list
      renderFilteredErrors();
    } catch (e) {
      console.error('[error-log] loadErrors failed:', e);
      panel.innerHTML = `<p class="text-muted">${t('errors.load_failed')}</p><pre style="color:var(--accent-red);font-size:0.7rem;margin-top:8px">${e?.message || e}</pre>`;
    }
  }

  // ═══ Filtered error list rendering ═══
  function renderFilteredErrors() {
    const container = document.getElementById('error-cards-container');
    if (!container) return;

    let filtered = _allErrors;

    // Hide acknowledged unless toggled
    if (!_showAcknowledged) {
      filtered = filtered.filter(e => !e.acknowledged);
    }

    if (_activeSeverity !== 'all') {
      if (_activeSeverity === 'critical') {
        filtered = filtered.filter(e => e.severity === 'fatal' || e.severity === 'critical');
      } else {
        filtered = filtered.filter(e => e.severity === _activeSeverity);
      }
    }

    if (_searchTerm) {
      filtered = filtered.filter(e =>
        (e.message || '').toLowerCase().includes(_searchTerm) ||
        (e.code || '').toLowerCase().includes(_searchTerm) ||
        printerName(e.printer_id).toLowerCase().includes(_searchTerm)
      );
    }

    if (!filtered.length) {
      container.innerHTML = emptyState({
        icon: '<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>',
        title: t('errors.no_match'),
        desc: t('errors.no_match_desc') || 'No errors found matching your filters. That\'s a good thing!'
      });
      return;
    }

    // Group by date
    const groups = {};
    for (const e of filtered) {
      const d = e.timestamp ? new Date(e.timestamp) : new Date();
      const locale = (window.i18n?.getLocale() || 'nb').replace('_', '-');
      const key = d.toLocaleDateString(locale, { day: '2-digit', month: 'long', year: 'numeric' });
      if (!groups[key]) groups[key] = [];
      groups[key].push(e);
    }

    let html = '';
    for (const [date, items] of Object.entries(groups)) {
      html += `<div class="error-group">
        <div class="error-group-header">
          <span>${date}</span>
          <span class="error-group-count">${items.length}</span>
        </div>`;
      for (const e of items) {
        const sev = e.severity || 'info';
        const color = severityColor(sev);
        const isHms = e.code && e.code.startsWith('HMS_');
        const ctx = parseContext(e);
        const codeUrl = ctx?.wiki_url
          ? ctx.wiki_url
          : e.code ? `https://www.google.com/search?q=Bambu+Lab+${isHms ? 'HMS+' : 'error+'}${e.code.replace(/^HMS_/, '').replace(/[_-]/g, '+')}` : null;
        const acked = e.acknowledged;
        const occurrences = e.code ? countOccurrences(_allErrors, e.code) : 0;

        // Build context details section
        let detailRows = '';
        if (ctx) {
          if (ctx.filename) detailRows += `<div class="err-detail-row"><span class="err-detail-lbl">${t('errors.ctx_file')}</span><span class="err-detail-val">${esc(ctx.filename)}</span></div>`;
          if (ctx.gcode_state) detailRows += `<div class="err-detail-row"><span class="err-detail-lbl">${t('errors.ctx_state')}</span><span class="err-detail-val">${stateLabel(ctx.gcode_state)}</span></div>`;
          if (ctx.layer_num != null && ctx.total_layer_num) detailRows += `<div class="err-detail-row"><span class="err-detail-lbl">${t('errors.ctx_layer')}</span><span class="err-detail-val">${ctx.layer_num} / ${ctx.total_layer_num}</span></div>`;
          if (ctx.progress != null) detailRows += `<div class="err-detail-row"><span class="err-detail-lbl">${t('errors.ctx_progress')}</span><span class="err-detail-val">${ctx.progress}%</span></div>`;
          if (ctx.nozzle_temper != null) detailRows += `<div class="err-detail-row"><span class="err-detail-lbl">${t('errors.ctx_nozzle')}</span><span class="err-detail-val">${Math.round(ctx.nozzle_temper)}°C</span></div>`;
          if (ctx.bed_temper != null) detailRows += `<div class="err-detail-row"><span class="err-detail-lbl">${t('errors.ctx_bed')}</span><span class="err-detail-val">${Math.round(ctx.bed_temper)}°C</span></div>`;
          if (ctx.chamber_temper != null) detailRows += `<div class="err-detail-row"><span class="err-detail-lbl">${t('errors.ctx_chamber')}</span><span class="err-detail-val">${Math.round(ctx.chamber_temper)}°C</span></div>`;
          if (ctx.fan_speed != null) detailRows += `<div class="err-detail-row"><span class="err-detail-lbl">${t('errors.ctx_fan')}</span><span class="err-detail-val">${fanPercent(ctx.fan_speed)}</span></div>`;
        }
        if (occurrences > 1) {
          detailRows += `<div class="err-detail-row"><span class="err-detail-lbl">${t('errors.ctx_occurrences')}</span><span class="err-detail-val err-detail-count">${occurrences}x</span></div>`;
        }

        const hasDetails = detailRows.length > 0;

        html += `<div class="error-card${acked ? ' error-card-acked' : ''}" style="--error-color:${color}">
          <div class="error-card-accent" style="background:${color}"></div>
          <div class="error-card-icon" style="color:${color}">${severityIcon(sev)}</div>
          <div class="error-card-body">
            <div class="error-card-top">
              <span class="error-card-message">${esc(e.message) || t('errors.unknown_error')}</span>
              <span class="error-card-ago">${timeAgo(e.timestamp)}</span>
            </div>
            <div class="error-card-meta">
              <span class="printer-tag">${esc(printerName(e.printer_id))}</span>
              ${e.code && codeUrl ? `<a href="${codeUrl}" target="_blank" rel="noopener" class="error-code error-code-link" title="${isHms ? t('errors.hms_wiki_link') : t('errors.search_code')}">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                ${esc(e.code)}
              </a>` : e.code ? `<span class="error-code">${esc(e.code)}</span>` : ''}
              ${occurrences > 1 ? `<span class="err-occ-badge" style="color:${color}">${occurrences}x</span>` : ''}
              <span class="error-card-time">${formatDate(e.timestamp)}</span>
              <span class="error-severity-pill" style="background:${color}">${sev}</span>
              ${hasDetails ? `<button class="err-expand-btn" onclick="toggleErrorDetails(this)" title="${t('errors.show_details')}">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
                ${t('errors.details')}
              </button>` : ''}
            </div>
            ${hasDetails ? `<div class="err-details-panel" style="display:none">
              <div class="err-detail-grid">${detailRows}</div>
            </div>` : ''}
          </div>
          <div class="error-card-actions">
            ${acked
              ? `<span class="pill pill-success" style="font-size:0.65rem">${t('errors.acknowledged')}</span>`
              : `<button class="error-action-btn error-action-ack" data-ripple data-tooltip="${t('errors.acknowledge')}" onclick="acknowledgeError(${e.id})" title="${t('errors.acknowledge')}">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
                </button>`
            }
            <button class="error-action-btn error-action-del" data-ripple data-tooltip="${t('errors.delete')}" onclick="deleteErrorEntry(${e.id})" title="${t('errors.delete')}">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
            </button>
          </div>
        </div>`;
      }
      html += '</div>';
    }

    container.innerHTML = html;
  }

  // ═══ Global API ═══
  window.loadErrorsPanel = loadErrors;
  window.changeErrorPrinter = function(value) { _selectedErrorPrinter = value || null; loadErrors(); };
  window.switchErrorTab = switchTab;
  window.filterErrorSeverity = function(severity) {
    _activeSeverity = severity;
    const slug = severity === 'all' ? 'errors' : `errors/${severity}`;
    if (location.hash !== '#' + slug) history.replaceState(null, '', '#' + slug);
    document.querySelectorAll('.error-filter-btn').forEach(btn => {
      const match = btn.getAttribute('onclick')?.match(/filterErrorSeverity\('(\w+)'\)/);
      if (match) btn.classList.toggle('active', match[1] === severity);
    });
    renderFilteredErrors();
  };

  window.searchErrors = function(term) {
    _searchTerm = term.toLowerCase();
    renderFilteredErrors();
  };

  window.toggleErrorAcknowledged = function(show) {
    _showAcknowledged = show;
    loadErrors();
  };

  window.acknowledgeError = async function(id) {
    try {
      await fetch(`/api/errors/${id}`, { method: 'PATCH' });
      const err = _allErrors.find(e => e.id === id);
      if (err) err.acknowledged = 1;
      renderFilteredErrors();
      // Update summary counts
      const summaryMod = document.querySelector('[data-module-id="error-summary"]');
      if (summaryMod) {
        summaryMod.innerHTML = BUILDERS['error-summary'](_allErrors);
      }
    } catch (e) {
      console.error('Failed to acknowledge error:', e);
    }
  };

  window.deleteErrorEntry = async function(id) {
    try {
      await fetch(`/api/errors/${id}`, { method: 'DELETE' });
      _allErrors = _allErrors.filter(e => e.id !== id);
      renderFilteredErrors();
      // Update summary counts
      const summaryMod = document.querySelector('[data-module-id="error-summary"]');
      if (summaryMod) {
        summaryMod.innerHTML = BUILDERS['error-summary'](_allErrors);
      }
    } catch (e) {
      console.error('Failed to delete error:', e);
    }
  };

  window.toggleErrorDetails = function(btn) {
    const card = btn.closest('.error-card-body');
    const panel = card?.querySelector('.err-details-panel');
    if (!panel) return;
    const show = panel.style.display === 'none';
    panel.style.display = show ? '' : 'none';
    btn.classList.toggle('err-expand-open', show);
  };

  window.acknowledgeAllErrors = async function() {
    try {
      await fetch('/api/errors/acknowledge-all', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ printer_id: _selectedErrorPrinter })
      });
      loadErrors();
    } catch (e) {
      console.error('Failed to acknowledge all errors:', e);
    }
  };

})();
