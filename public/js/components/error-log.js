// Error Log — Modular with Tabs and Drag-and-Drop
(function() {

  // ═══ Helpers ═══
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

  // ═══ Tab config ═══
  const TAB_CONFIG = {
    log:   { label: 'errors.tab_log',   modules: ['error-summary', 'error-filters', 'error-list'] },
    stats: { label: 'errors.tab_stats', modules: ['severity-breakdown', 'printer-breakdown', 'common-errors'] }
  };
  const MODULE_SIZE = {
    'error-summary': 'half', 'error-filters': 'half', 'error-list': 'full',
    'severity-breakdown': 'half', 'printer-breakdown': 'half', 'common-errors': 'full'
  };

  const STORAGE_PREFIX = 'error-module-order-';
  const LOCK_KEY = 'error-layout-locked';

  let _allErrors = [];
  let _activeSeverity = 'all';
  let _searchTerm = '';
  let _selectedErrorPrinter = null;
  let _activeTab = 'log';
  let _locked = localStorage.getItem(LOCK_KEY) !== '0';
  let _draggedMod = null;

  // ═══ Persistence ═══
  function getOrder(tabId) {
    try { const o = JSON.parse(localStorage.getItem(STORAGE_PREFIX + tabId)); if (Array.isArray(o)) return o; } catch (_) {}
    return TAB_CONFIG[tabId]?.modules || [];
  }
  function saveOrder(tabId) {
    const cont = document.getElementById(`error-tab-${tabId}`);
    if (!cont) return;
    const ids = [...cont.querySelectorAll('.stats-module[data-module-id]')].map(m => m.dataset.moduleId);
    localStorage.setItem(STORAGE_PREFIX + tabId, JSON.stringify(ids));
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
      return `<div class="stat-grid" style="grid-template-columns:repeat(3,1fr)">
        <div class="stat-card"><div class="stat-value">${errors.length}</div><div class="stat-label">${t('errors.total')}</div></div>
        <div class="stat-card"><div class="stat-value" style="color:var(--accent-red)">${c.fatal + c.critical}</div><div class="stat-label">${t('errors.critical')}</div></div>
        <div class="stat-card"><div class="stat-value" style="color:var(--accent-orange)">${c.error}</div><div class="stat-label">${t('errors.errors')}</div></div>
      </div>`;
    },

    'error-filters': (errors) => {
      const c = getCounts(errors);
      let h = `<div class="error-sidebar-filters">
        <button class="error-filter-btn ${_activeSeverity === 'all' ? 'active' : ''}" onclick="filterErrorSeverity('all')">${t('errors.all')}</button>
        <button class="error-filter-btn ${_activeSeverity === 'critical' ? 'active' : ''}" onclick="filterErrorSeverity('critical')" style="--filter-color:var(--accent-red)">${t('errors.critical')} (${c.fatal + c.critical})</button>
        <button class="error-filter-btn ${_activeSeverity === 'error' ? 'active' : ''}" onclick="filterErrorSeverity('error')" style="--filter-color:var(--accent-orange)">${t('errors.errors')} (${c.error})</button>
        <button class="error-filter-btn ${_activeSeverity === 'warning' ? 'active' : ''}" onclick="filterErrorSeverity('warning')" style="--filter-color:var(--accent-yellow, #e3b341)">${t('errors.warnings')} (${c.warning})</button>
      </div>
      <div style="margin-top:8px">
        <input type="text" class="form-input" style="width:100%" placeholder="${t('errors.search_placeholder')}" value="${_searchTerm}" oninput="searchErrors(this.value)">
      </div>`;
      return h;
    },

    'error-list': (errors) => {
      return `<div id="error-cards-container" style="max-height:600px;overflow-y:auto"></div>`;
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
    });
    const slug = tabId === 'log' ? 'errors' : `errors/${tabId}`;
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

      // Toolbar
      const lockIcon = _locked
        ? '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>'
        : '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 019.9-1"/></svg>';
      html += `<div class="stats-toolbar">
        <button class="speed-btn ${_locked ? '' : 'active'}" onclick="toggleErrorLock()" title="${_locked ? t('errors.layout_locked') : t('errors.layout_unlocked')}">
          ${lockIcon} <span>${_locked ? t('errors.layout_locked') : t('errors.layout_unlocked')}</span>
        </button>
      </div>`;

      // Tab bar
      html += '<div class="tabs">';
      for (const [id, cfg] of Object.entries(TAB_CONFIG)) {
        html += `<button class="tab-btn error-tab-btn ${id === _activeTab ? 'active' : ''}" data-tab="${id}" onclick="switchErrorTab('${id}')">${t(cfg.label)}</button>`;
      }
      html += '</div>';

      // Tab panels
      for (const [tabId, cfg] of Object.entries(TAB_CONFIG)) {
        const order = getOrder(tabId);
        html += `<div class="tab-panel error-tab-panel stats-tab-panel ${tabId === _activeTab ? 'active' : ''}" id="error-tab-${tabId}" style="display:${tabId === _activeTab ? 'grid' : 'none'}">`;
        for (const modId of order) {
          const builder = BUILDERS[modId];
          if (!builder) continue;
          const content = builder(_allErrors);
          if (!content) continue;
          const draggable = _locked ? '' : 'draggable="true"';
          const unlocked = _locked ? '' : ' stats-module-unlocked';
          const isFull = (MODULE_SIZE[modId] || 'full') === 'full';
          html += `<div class="stats-module${unlocked}${isFull ? ' stats-module-full' : ''}" data-module-id="${modId}" ${draggable}>`;
          if (!_locked) html += '<div class="stats-module-handle" title="Drag to reorder">&#x2630;</div>';
          html += content;
          html += '</div>';
        }
        html += '</div>';
      }

      panel.innerHTML = html;

      // Attach module DnD
      for (const tabId of Object.keys(TAB_CONFIG)) {
        const cont = document.getElementById(`error-tab-${tabId}`);
        if (cont) initModuleDrag(cont, tabId);
      }

      // Render error list
      renderFilteredErrors();
    } catch (e) {
      panel.innerHTML = `<p class="text-muted">${t('errors.load_failed')}</p>`;
    }
  }

  // ═══ Filtered error list rendering ═══
  function renderFilteredErrors() {
    const container = document.getElementById('error-cards-container');
    if (!container) return;

    let filtered = _allErrors;

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
      container.innerHTML = `<p class="text-muted" style="text-align:center;padding:24px 0">${t('errors.no_match')}</p>`;
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
        const hmsAttr = isHms ? e.code.replace('HMS_', '') : null;
        const wikiUrl = isHms ? `https://wiki.bambulab.com/en/x1/troubleshooting/hmscode/${hmsAttr.replace(/-/g, '_')}` : null;
        html += `<div class="error-card" style="--error-color:${color}">
          <div class="error-card-icon" style="color:${color}">${severityIcon(sev)}</div>
          <div class="error-card-body">
            <div class="error-card-top">
              <span class="error-card-message">${esc(e.message) || t('errors.unknown_error')}</span>
              <span class="error-card-ago">${timeAgo(e.timestamp)}</span>
            </div>
            <div class="error-card-meta">
              <span class="printer-tag">${esc(printerName(e.printer_id))}</span>
              ${e.code ? `<span class="error-code">${esc(e.code)}</span>` : ''}
              ${wikiUrl ? `<a href="${wikiUrl}" target="_blank" rel="noopener" class="error-wiki-link" title="${t('errors.hms_wiki_link')}">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
                ${t('errors.hms_wiki_link')}
              </a>` : ''}
              <span class="error-card-time">${formatDate(e.timestamp)}</span>
            </div>
          </div>
          <div class="error-card-severity">
            <span class="error-severity-pill" style="background:${color}">${sev}</span>
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
  window.toggleErrorLock = function() {
    _locked = !_locked;
    localStorage.setItem(LOCK_KEY, _locked ? '1' : '0');
    loadErrors();
  };

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

})();
