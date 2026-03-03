// Print History — Modular with Tabs and Drag-and-Drop
(function() {

  // ═══ Helpers ═══
  function printerName(id) {
    return window.printerState?._printerMeta?.[id]?.name || id || '--';
  }
  function statusLabel(status) {
    const key = { completed: 'completed', failed: 'failed', cancelled: 'cancelled' }[status];
    return key ? t(`history.${key}`) : status;
  }
  function formatDuration(seconds) {
    if (!seconds) return '--';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h}${t('time.h')} ${m}${t('time.m')}`;
    if (m > 0) return `${m}${t('time.m')} ${s}${t('time.s')}`;
    return `${s}${t('time.s')}`;
  }
  function formatDate(iso) {
    if (!iso) return '--';
    const locale = (window.i18n?.getLocale() || 'nb').replace('_', '-');
    return new Date(iso).toLocaleDateString(locale, { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  }
  function formatDateShort(iso) {
    if (!iso) return '--';
    const locale = (window.i18n?.getLocale() || 'nb').replace('_', '-');
    return new Date(iso).toLocaleDateString(locale, { day: '2-digit', month: 'short' });
  }
  function colorSwatch(hex) {
    if (!hex || hex.length < 6) return '';
    return `<span class="history-color-swatch" style="background:#${hex.substring(0, 6)}"></span>`;
  }
  function speedLabel(level) {
    const map = { 1: 'speed.silent', 2: 'speed.standard', 3: 'speed.sport', 4: 'speed.ludicrous' };
    return level && map[level] ? t(map[level]) : null;
  }
  function fmtW(g) { return g >= 1000 ? (g/1000).toFixed(1)+' kg' : Math.round(g)+'g'; }
  function barRow(lbl, pct, clr, val) { return `<div class="chart-bar-row"><span class="chart-bar-label">${lbl}</span><div class="chart-bar-track"><div class="chart-bar-fill" style="width:${pct}%;background:${clr}"></div></div><span class="chart-bar-value">${val}</span></div>`; }
  function sRow(lbl, val, clr) { return `<div class="stats-detail-item"><span class="stats-detail-item-label">${lbl}</span><span class="stats-detail-item-value"${clr?` style="color:${clr}"`:''}>${val}</span></div>`; }

  // ═══ Status icon helper ═══
  function statusIcon(status) {
    if (status === 'completed') return '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--accent-green)" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>';
    if (status === 'failed') return '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--accent-red)" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';
    return '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--accent-orange)" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>';
  }

  // ═══ Tab config ═══
  const TAB_CONFIG = {
    history: { label: 'history.tab_history', modules: ['history-summary', 'history-filters', 'history-list'] },
    stats:   { label: 'history.tab_stats',   modules: ['status-breakdown', 'printer-breakdown', 'filament-breakdown', 'duration-stats'] }
  };
  const MODULE_SIZE = {
    'history-summary': 'full', 'history-filters': 'full', 'history-list': 'full',
    'status-breakdown': 'half', 'printer-breakdown': 'half',
    'filament-breakdown': 'half', 'duration-stats': 'half'
  };

  const STORAGE_PREFIX = 'history-module-order-';
  const LOCK_KEY = 'history-layout-locked';

  let _data = [];
  let _activeFilter = 'all';
  let _activeTab = 'history';
  let _activePrinter = 'all';
  let _locked = localStorage.getItem(LOCK_KEY) !== '0';
  let _draggedMod = null;

  // ═══ Persistence ═══
  function getOrder(tabId) {
    try { const o = JSON.parse(localStorage.getItem(STORAGE_PREFIX + tabId)); if (Array.isArray(o)) return o; } catch (_) {}
    return TAB_CONFIG[tabId]?.modules || [];
  }
  function saveOrder(tabId) {
    const cont = document.getElementById(`history-tab-${tabId}`);
    if (!cont) return;
    const ids = [...cont.querySelectorAll('.stats-module[data-module-id]')].map(m => m.dataset.moduleId);
    localStorage.setItem(STORAGE_PREFIX + tabId, JSON.stringify(ids));
  }

  // ═══ Computed stats ═══
  function getStats(data) {
    const completed = data.filter(r => r.status === 'completed').length;
    const failed = data.filter(r => r.status === 'failed').length;
    const cancelled = data.filter(r => r.status === 'cancelled').length;
    const totalTime = data.reduce((s, r) => s + (r.duration_seconds || 0), 0);
    const totalFilament = data.reduce((s, r) => s + (r.filament_used_g || 0), 0);
    const totalLayers = data.reduce((s, r) => s + (r.layer_count || 0), 0);
    const successRate = data.length > 0 ? Math.round(completed / data.length * 100) : 0;
    return { completed, failed, cancelled, totalTime, totalFilament, totalLayers, successRate };
  }

  // ═══ Module builders ═══
  const BUILDERS = {
    'history-summary': (data) => {
      const s = getStats(data);
      return `<div class="history-summary">
        <div class="history-stat">
          <span class="history-stat-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="6" y="2" width="12" height="8" rx="1"/><rect x="2" y="14" width="20" height="8" rx="1"/><line x1="6" y1="18" x2="6" y2="18.01"/></svg></span>
          <span class="history-stat-value">${data.length}</span>
          <span class="history-stat-label">${t('stats.total_prints')}</span>
        </div>
        <div class="history-stat history-stat-success">
          <span class="history-stat-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg></span>
          <span class="history-stat-value">${s.successRate}%</span>
          <span class="history-stat-label">${t('stats.success_rate')}</span>
        </div>
        <div class="history-stat">
          <span class="history-stat-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg></span>
          <span class="history-stat-value">${formatDuration(s.totalTime)}</span>
          <span class="history-stat-label">${t('stats.total_time')}</span>
        </div>
        <div class="history-stat">
          <span class="history-stat-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/></svg></span>
          <span class="history-stat-value">${fmtW(s.totalFilament)}</span>
          <span class="history-stat-label">${t('stats.filament_used')}</span>
        </div>
        <div class="history-stat">
          <span class="history-stat-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg></span>
          <span class="history-stat-value">${s.totalLayers.toLocaleString()}</span>
          <span class="history-stat-label">${t('stats.total_layers')}</span>
        </div>
      </div>`;
    },

    'history-filters': (data) => {
      const s = getStats(data);
      return `<div class="history-filters">
        <button class="history-filter-btn ${_activeFilter === 'all' ? 'active' : ''}" data-filter="all" data-ripple onclick="filterHistory('all', this)">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg>
          ${t('stats.total')} <span class="history-filter-count">${data.length}</span>
        </button>
        <button class="history-filter-btn history-filter-completed ${_activeFilter === 'completed' ? 'active' : ''}" data-filter="completed" data-ripple onclick="filterHistory('completed', this)">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
          ${t('history.completed')} <span class="history-filter-count">${s.completed}</span>
        </button>
        <button class="history-filter-btn history-filter-failed ${_activeFilter === 'failed' ? 'active' : ''}" data-filter="failed" data-ripple onclick="filterHistory('failed', this)">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          ${t('history.failed')} <span class="history-filter-count">${s.failed}</span>
        </button>
        <button class="history-filter-btn history-filter-cancelled ${_activeFilter === 'cancelled' ? 'active' : ''}" data-filter="cancelled" data-ripple onclick="filterHistory('cancelled', this)">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>
          ${t('history.cancelled')} <span class="history-filter-count">${s.cancelled}</span>
        </button>
      </div>`;
    },

    'history-list': (data) => {
      let h = '<div class="history-cards" id="history-cards">';
      for (const row of data) {
        const fname = (row.filename || '--').replace(/\.(3mf|gcode)$/i, '');
        const startDate = formatDate(row.started_at);
        const endDate = row.finished_at ? formatDate(row.finished_at) : '--';
        const display = (_activeFilter === 'all' || row.status === _activeFilter) ? '' : 'display:none;';

        const accentColor = { completed: 'var(--accent-green)', failed: 'var(--accent-red)', cancelled: 'var(--accent-orange)' }[row.status] || 'var(--text-muted)';
        h += `<div class="history-card" data-status="${row.status}" style="${display}">`;
        h += `<div class="history-card-accent" style="background:${accentColor}"></div>`;
        h += `<div class="history-card-content">`;

        h += `<div class="history-card-header">
          <div class="history-card-title">
            <span class="history-card-status-icon">${statusIcon(row.status)}</span>
            ${colorSwatch(row.filament_color)}
            <span class="history-card-filename">${esc(fname)}</span>
          </div>
          <span class="pill pill-${row.status}">${statusLabel(row.status)}</span>
        </div>`;

        // Card body — 3 column labeled grid
        const speed = speedLabel(row.speed_level);
        const filText = `${esc(row.filament_type) || '--'}${row.filament_used_g ? ' · ' + row.filament_used_g + 'g' : ''}`;
        h += `<div class="history-card-grid">
          <div class="hc-cell"><span class="hc-cell-label">${t('common.printer')}</span><span class="hc-cell-value">${esc(printerName(row.printer_id))}</span></div>
          <div class="hc-cell"><span class="hc-cell-label">${t('history.date')}</span><span class="hc-cell-value">${formatDateShort(row.started_at)}</span></div>
          <div class="hc-cell"><span class="hc-cell-label">${t('history.duration')}</span><span class="hc-cell-value">${formatDuration(row.duration_seconds)}</span></div>
          <div class="hc-cell"><span class="hc-cell-label">${t('history.layers')}</span><span class="hc-cell-value">${row.layer_count || '--'}</span></div>
          <div class="hc-cell"><span class="hc-cell-label">${t('history.filament')}</span><span class="hc-cell-value">${filText}</span></div>
          <div class="hc-cell"><span class="hc-cell-label">${speed ? t('speed.label').replace(':','') : ''}</span><span class="hc-cell-value">${speed || ''}</span></div>
          <div class="hc-cell hc-cost-cell" data-filament-g="${row.filament_used_g || 0}" data-duration-s="${row.duration_seconds || 0}"><span class="hc-cell-label">${t('filament.cost_estimate')}</span><span class="hc-cell-value hc-cost-value">--</span></div>
        </div>`;

        // Detail section (expandable)
        h += `<div class="history-card-detail" style="display:none"><div class="history-detail-grid">`;
        h += `<div class="history-detail-row"><span class="history-detail-label">${t('history.started')}</span><span>${startDate}</span></div>`;
        h += `<div class="history-detail-row"><span class="history-detail-label">${t('history.ended')}</span><span>${endDate}</span></div>`;
        if (row.nozzle_target || row.max_nozzle_temp) h += `<div class="history-detail-row"><span class="history-detail-label">${t('temperature.nozzle')}</span><span>${row.nozzle_target ? row.nozzle_target + '°C' : ''}${row.max_nozzle_temp ? ' (max ' + Math.round(row.max_nozzle_temp) + '°C)' : ''}</span></div>`;
        if (row.bed_target || row.max_bed_temp) h += `<div class="history-detail-row"><span class="history-detail-label">${t('temperature.bed')}</span><span>${row.bed_target ? row.bed_target + '°C' : ''}${row.max_bed_temp ? ' (max ' + Math.round(row.max_bed_temp) + '°C)' : ''}</span></div>`;
        if (row.nozzle_type || row.nozzle_diameter) h += `<div class="history-detail-row"><span class="history-detail-label">${t('printer_info.nozzle')}</span><span>${row.nozzle_type || ''} ${row.nozzle_diameter ? row.nozzle_diameter + 'mm' : ''}</span></div>`;
        if (row.color_changes > 0) h += `<div class="history-detail-row"><span class="history-detail-label">${t('waste.color_changes')}</span><span>${row.color_changes}</span></div>`;
        if (row.waste_g > 0) h += `<div class="history-detail-row"><span class="history-detail-label">${t('waste.total_weight')}</span><span>${row.waste_g}g</span></div>`;
        h += `<div class="history-detail-row"><span class="history-detail-label">${t('history.filename')}</span><span class="history-detail-mono">${esc(row.filename) || '--'}</span></div>`;
        if (row.notes) h += `<div class="history-detail-row"><span class="history-detail-label">${t('maintenance.notes')}</span><span>${esc(row.notes)}</span></div>`;
        h += `<div class="history-cost-row" id="cost-row-${row.id}" style="display:none"></div>`;
        h += '</div></div>';
        h += `<button class="history-card-toggle" data-ripple data-tooltip="${t('history.expand_details') || 'Details'}" onclick="toggleHistoryDetail(this)"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg></button>`;
        h += '</div>'; // close .history-card-content
        h += '</div>'; // close .history-card
      }
      h += '</div>';
      const exportUrl = _activePrinter === 'all' ? '/api/history/export' : `/api/history/export?printer_id=${_activePrinter}`;
      h += `<div class="history-export"><a href="${exportUrl}" class="form-btn form-btn-sm form-btn-secondary" data-ripple download>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
        ${t('stats.download_csv')}</a></div>`;
      return h;
    },

    'status-breakdown': (data) => {
      if (!data.length) return '';
      const s = getStats(data);
      const entries = [
        [t('history.completed'), s.completed, 'var(--accent-green)'],
        [t('history.failed'), s.failed, 'var(--accent-red)'],
        [t('history.cancelled'), s.cancelled, 'var(--accent-orange)']
      ].filter(e => e[1] > 0);
      const mx = Math.max(...entries.map(e => e[1]), 1);
      let h = `<div class="card-title">${t('history.status_breakdown')}</div><div class="chart-bars">`;
      for (const [lbl, cnt, clr] of entries) h += barRow(lbl, (cnt / mx) * 100, clr, cnt);
      h += '</div>';
      return h;
    },

    'printer-breakdown': (data) => {
      if (!data.length) return '';
      const byPrinter = {};
      for (const r of data) {
        const pid = r.printer_id || 'unknown';
        byPrinter[pid] = (byPrinter[pid] || 0) + 1;
      }
      const sorted = Object.entries(byPrinter).sort((a, b) => b[1] - a[1]);
      const mx = sorted[0]?.[1] || 1;
      let h = `<div class="card-title">${t('history.printer_breakdown')}</div><div class="chart-bars">`;
      for (const [pid, cnt] of sorted) h += barRow(esc(printerName(pid)), (cnt / mx) * 100, 'var(--accent-purple)', cnt);
      h += '</div>';
      return h;
    },

    'filament-breakdown': (data) => {
      if (!data.length) return '';
      const byType = {};
      for (const r of data) {
        const tp = r.filament_type || 'Unknown';
        if (!byType[tp]) byType[tp] = { count: 0, weight: 0 };
        byType[tp].count++;
        byType[tp].weight += r.filament_used_g || 0;
      }
      const sorted = Object.entries(byType).sort((a, b) => b[1].count - a[1].count);
      const mx = sorted[0]?.[1].count || 1;
      let h = `<div class="card-title">${t('history.filament_breakdown')}</div><div class="chart-bars">`;
      for (const [tp, d] of sorted) h += barRow(esc(tp), (d.count / mx) * 100, 'var(--accent-blue)', `${d.count} (${fmtW(d.weight)})`);
      h += '</div>';
      return h;
    },

    'duration-stats': (data) => {
      if (!data.length) return '';
      const s = getStats(data);
      const durations = data.filter(r => r.duration_seconds > 0).map(r => r.duration_seconds);
      const avgDuration = durations.length > 0 ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length) : 0;
      const longest = durations.length > 0 ? Math.max(...durations) : 0;
      const longestRow = data.find(r => r.duration_seconds === longest);
      const avgFilament = data.length > 0 ? Math.round(s.totalFilament / data.length) : 0;
      let h = `<div class="card-title">${t('history.duration_stats')}</div><div class="stats-detail-list">`;
      h += sRow(t('stats.avg_duration'), formatDuration(avgDuration));
      h += sRow(t('stats.longest_print'), `${formatDuration(longest)}${longestRow ? ' — ' + esc((longestRow.filename || '').replace(/\.(3mf|gcode)$/i, '')) : ''}`);
      h += sRow(t('stats.avg_filament'), `${avgFilament}g`);
      h += sRow(t('stats.total_time'), formatDuration(s.totalTime));
      h += '</div>';
      return h;
    }
  };

  // ═══ Tab switching ═══
  function switchTab(tabId) {
    _activeTab = tabId;
    document.querySelectorAll('.history-tab-btn').forEach(b => b.classList.toggle('active', b.dataset.tab === tabId));
    document.querySelectorAll('.history-tab-panel').forEach(p => {
      const isActive = p.id === `history-tab-${tabId}`;
      p.classList.toggle('active', isActive);
      p.style.display = isActive ? 'grid' : 'none';
      if (isActive) {
        p.classList.add('ix-tab-panel');
        p.addEventListener('animationend', () => p.classList.remove('ix-tab-panel'), { once: true });
      }
    });
    const slug = tabId === 'history' ? 'history' : `history/${tabId}`;
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
  async function loadHistory() {
    const panel = document.getElementById('overlay-panel-body');
    if (!panel) return;

    panel.innerHTML = `<div class="history-loading"><span class="text-muted">${t('progress.waiting')}</span></div>`;

    // Read sub-slug from hash
    const hashParts = location.hash.replace('#', '').split('/');
    if (hashParts[0] === 'history' && hashParts[1]) {
      if (hashParts[1] === 'printer' && hashParts[2]) {
        _activePrinter = hashParts[2];
      } else if (TAB_CONFIG[hashParts[1]]) {
        _activeTab = hashParts[1];
      } else if (['completed', 'failed', 'cancelled'].includes(hashParts[1])) {
        _activeFilter = hashParts[1];
        _activeTab = 'history';
      }
    }

    try {
      const res = await fetch('/api/history?limit=100');
      _data = await res.json();

      if (!_data.length) {
        panel.innerHTML = `<p class="text-muted">${t('history.no_records')}</p>`;
        return;
      }

      // Filter data by selected printer
      const filteredData = _activePrinter === 'all'
        ? _data : _data.filter(r => r.printer_id === _activePrinter);

      let html = '<div class="history-layout">';

      // Toolbar
      const lockIcon = _locked
        ? '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>'
        : '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 019.9-1"/></svg>';
      html += `<div class="stats-toolbar">
        <button class="speed-btn ${_locked ? '' : 'active'}" onclick="toggleHistoryLock()" title="${_locked ? t('history.layout_locked') : t('history.layout_unlocked')}">
          ${lockIcon} <span>${_locked ? t('history.layout_locked') : t('history.layout_unlocked')}</span>
        </button>
      </div>`;

      // Printer tab bar
      const printerIds = [...new Set(_data.map(r => r.printer_id))];
      if (printerIds.length > 1) {
        html += '<div class="tabs history-printer-tabs">';
        html += `<button class="tab-btn ${_activePrinter === 'all' ? 'active' : ''}" onclick="filterHistoryPrinter('all')">${t('history.all_printers')}</button>`;
        for (const pid of printerIds) {
          html += `<button class="tab-btn ${_activePrinter === pid ? 'active' : ''}" onclick="filterHistoryPrinter('${pid}')">${esc(printerName(pid))}</button>`;
        }
        html += '</div>';
      }

      // Tab bar
      html += '<div class="tabs">';
      for (const [id, cfg] of Object.entries(TAB_CONFIG)) {
        html += `<button class="tab-btn history-tab-btn ${id === _activeTab ? 'active' : ''}" data-tab="${id}" onclick="switchHistoryTab('${id}')">${t(cfg.label)}</button>`;
      }
      html += '</div>';

      // Tab panels
      for (const [tabId, cfg] of Object.entries(TAB_CONFIG)) {
        const order = getOrder(tabId);
        html += `<div class="tab-panel history-tab-panel stats-tab-panel stagger-in ${tabId === _activeTab ? 'active' : ''}" id="history-tab-${tabId}" style="display:${tabId === _activeTab ? 'grid' : 'none'}">`;
        let _si = 0;
        for (const modId of order) {
          const builder = BUILDERS[modId];
          if (!builder) continue;
          const content = builder(filteredData);
          if (!content) continue;
          const draggable = _locked ? '' : 'draggable="true"';
          const unlocked = _locked ? '' : ' stats-module-unlocked';
          const span = (MODULE_SIZE[modId] || 'full') === 'full' ? 'grid-column:1/-1;' : '';
          html += `<div class="stats-module${unlocked}" data-module-id="${modId}" ${draggable} style="${span}--i:${_si++};">`;
          if (!_locked) html += '<div class="stats-module-handle" title="Drag to reorder">&#x2630;</div>';
          html += content;
          html += '</div>';
        }
        html += '</div>';
      }

      html += '</div>'; // close .history-layout
      panel.innerHTML = html;

      // Attach module DnD
      for (const tabId of Object.keys(TAB_CONFIG)) {
        const cont = document.getElementById(`history-tab-${tabId}`);
        if (cont) initModuleDrag(cont, tabId);
      }
      // Async cost estimation
      _loadHistoryCosts(panel);
    } catch (e) {
      panel.innerHTML = `<p class="text-muted">${t('history.load_failed')}</p>`;
    }
  }

  async function _loadHistoryCosts(panel) {
    const cells = panel.querySelectorAll('.hc-cost-cell');
    for (const cell of cells) {
      const fg = parseFloat(cell.dataset.filamentG) || 0;
      const ds = parseInt(cell.dataset.durationS) || 0;
      if (fg <= 0 && ds <= 0) continue;
      try {
        const res = await fetch(`/api/inventory/cost-estimate?filament_g=${fg}&duration_s=${ds}`);
        const cost = await res.json();
        const valEl = cell.querySelector('.hc-cost-value');
        if (valEl && cost.total_cost > 0) valEl.textContent = formatCurrency(cost.total_cost);
      } catch {}
    }
  }

  // ═══ Global API ═══
  window.loadHistoryPanel = loadHistory;
  window.switchHistoryTab = switchTab;
  window.toggleHistoryLock = function() {
    _locked = !_locked;
    localStorage.setItem(LOCK_KEY, _locked ? '1' : '0');
    loadHistory();
  };

  window.toggleHistoryDetail = function(btn) {
    const card = btn.closest('.history-card-content') || btn.closest('.history-card');
    const detail = card.querySelector('.history-card-detail');
    if (!detail) return;
    const isOpen = detail.style.display !== 'none';
    detail.style.display = isOpen ? 'none' : '';
    btn.classList.toggle('open', !isOpen);
    // Lazy-load cost data when opening
    if (!isOpen) {
      const costRow = detail.querySelector('.history-cost-row');
      if (costRow && !costRow.dataset.loaded) {
        costRow.dataset.loaded = '1';
        const printId = costRow.id.replace('cost-row-', '');
        fetch(`/api/cost/${printId}`).then(r => r.ok ? r.json() : null).then(cost => {
          if (cost && cost.total_cost > 0) {
            costRow.style.display = '';
            costRow.innerHTML = `<div class="history-detail-row"><span class="history-detail-label">${t('history.print_cost')}</span><span>${formatCurrency(cost.total_cost)}</span></div>` +
              (cost.filament_cost > 0 ? `<div class="history-detail-row text-muted" style="font-size:0.8rem"><span class="history-detail-label" style="padding-left:1rem">${t('history.cost_filament')}</span><span>${formatCurrency(cost.filament_cost)}</span></div>` : '') +
              (cost.electricity_cost > 0 ? `<div class="history-detail-row text-muted" style="font-size:0.8rem"><span class="history-detail-label" style="padding-left:1rem">${t('history.cost_electricity')}</span><span>${formatCurrency(cost.electricity_cost)}</span></div>` : '') +
              (cost.depreciation_cost > 0 ? `<div class="history-detail-row text-muted" style="font-size:0.8rem"><span class="history-detail-label" style="padding-left:1rem">${t('history.cost_depreciation')}</span><span>${formatCurrency(cost.depreciation_cost)}</span></div>` : '') +
              (cost.labor_cost > 0 ? `<div class="history-detail-row text-muted" style="font-size:0.8rem"><span class="history-detail-label" style="padding-left:1rem">${t('history.cost_labor')}</span><span>${formatCurrency(cost.labor_cost)}</span></div>` : '') +
              (cost.markup_amount > 0 ? `<div class="history-detail-row text-muted" style="font-size:0.8rem"><span class="history-detail-label" style="padding-left:1rem">${t('history.cost_markup')}</span><span>${formatCurrency(cost.markup_amount)}</span></div>` : '');
          }
        }).catch(() => {});
      }
    }
  };

  window.filterHistoryPrinter = function(printerId) {
    _activePrinter = printerId;
    const slug = printerId === 'all' ? 'history' : `history/printer/${printerId}`;
    if (location.hash !== '#' + slug) history.replaceState(null, '', '#' + slug);
    loadHistory();
  };

  window.filterHistory = function(status, btn) {
    _activeFilter = status;
    const slug = status === 'all' ? 'history' : `history/${status}`;
    if (location.hash !== '#' + slug) history.replaceState(null, '', '#' + slug);
    document.querySelectorAll('.history-filter-btn').forEach(b => b.classList.remove('active'));
    if (btn) {
      btn.classList.add('active');
    } else {
      document.querySelectorAll('.history-filter-btn').forEach(b => {
        const match = b.getAttribute('onclick')?.match(/filterHistory\('(\w+)'/);
        if (match && match[1] === status) b.classList.add('active');
      });
    }
    document.querySelectorAll('.history-card').forEach(card => {
      card.style.display = (status === 'all' || card.dataset.status === status) ? '' : 'none';
    });
  };

})();
