// Print History — Bambu Studio style
(function() {

  // ═══ Helpers ═══
  function printerName(id) {
    return window.printerState?._printerMeta?.[id]?.name || id || '--';
  }
  function statusLabel(status) {
    const map = { completed: 'completed', failed: 'failed', cancelled: 'cancelled' };
    return map[status] ? t(`history.${map[status]}`) : status;
  }
  function statusColor(status) {
    return { completed: 'var(--accent-green)', failed: 'var(--accent-red)', cancelled: 'var(--accent-orange)' }[status] || 'var(--text-muted)';
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
  function formatDateFull(iso) {
    if (!iso) return '--';
    const locale = (window.i18n?.getLocale() || 'nb').replace('_', '-');
    return new Date(iso).toLocaleDateString(locale, { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  }
  function colorSwatch(hex) {
    if (!hex || hex.length < 6) return '';
    const c = '#' + hex.substring(0, 6);
    return typeof miniSpool === 'function' ? miniSpool(c, 16) : `<span class="history-color-swatch" style="background:${c}"></span>`;
  }
  function speedLabel(level) {
    const map = { 1: 'speed.silent', 2: 'speed.standard', 3: 'speed.sport', 4: 'speed.ludicrous' };
    return level && map[level] ? t(map[level]) : null;
  }
  function fmtW(g) { return g >= 1000 ? (g/1000).toFixed(1)+' kg' : Math.round(g)+'g'; }
  function estimatePrintCostBadge(filamentUsedG, filamentType) {
    const prices = { PLA: 200, PETG: 250, ABS: 220, TPU: 350, ASA: 280, PA: 450, PC: 400 };
    const pricePerKg = prices[filamentType] || 230;
    const costNOK = (filamentUsedG / 1000) * pricePerKg;
    return Math.round(costNOK);
  }
  function barRow(lbl, pct, clr, val) { return `<div class="chart-bar-row"><span class="chart-bar-label">${lbl}</span><div class="chart-bar-track"><div class="chart-bar-fill" style="width:${pct}%;background:${clr}"></div></div><span class="chart-bar-value">${val}</span></div>`; }
  function sRow(lbl, val, clr) { return `<div class="stats-detail-item"><span class="stats-detail-item-label">${lbl}</span><span class="stats-detail-item-value"${clr?` style="color:${clr}"`:''}>${val}</span></div>`; }

  // ═══ Status icon helper ═══
  function statusIcon(status) {
    if (status === 'completed') return '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#00e676" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>';
    if (status === 'failed') return '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent-red)" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';
    return '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent-orange)" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>';
  }

  // Placeholder thumbnail SVG
  function thumbPlaceholder(color) {
    const c = color && color.length >= 6 ? '#' + color.substring(0, 6) : '#555';
    return `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
      <rect width="200" height="200" fill="#2a2a2a"/>
      <g transform="translate(100,100)">
        <rect x="-40" y="-30" width="80" height="60" rx="6" fill="${c}" opacity="0.7"/>
        <rect x="-30" y="-40" width="60" height="30" rx="4" fill="${c}" opacity="0.5"/>
        <circle cx="0" cy="10" r="15" fill="${c}" opacity="0.9"/>
      </g>
    </svg>`;
  }

  // Mini donut SVG
  function miniDonut(segments, size = 64, thickness = 8) {
    const r = (size - thickness) / 2;
    const cx = size / 2;
    const total = segments.reduce((s, seg) => s + seg.value, 0);
    if (total === 0) return `<svg width="${size}" height="${size}"><circle cx="${cx}" cy="${cx}" r="${r}" fill="none" stroke="var(--border-color)" stroke-width="${thickness}"/></svg>`;
    let cumAngle = -90;
    let paths = '';
    for (const seg of segments) {
      if (seg.value <= 0) continue;
      const angle = (seg.value / total) * 360;
      const startRad = (cumAngle * Math.PI) / 180;
      const endRad = ((cumAngle + angle) * Math.PI) / 180;
      const x1 = cx + r * Math.cos(startRad);
      const y1 = cx + r * Math.sin(startRad);
      const x2 = cx + r * Math.cos(endRad);
      const y2 = cx + r * Math.sin(endRad);
      const large = angle > 180 ? 1 : 0;
      paths += `<path d="M${x1},${y1} A${r},${r} 0 ${large},1 ${x2},${y2}" fill="none" stroke="${seg.color}" stroke-width="${thickness}" stroke-linecap="round"/>`;
      cumAngle += angle;
    }
    return `<svg width="${size}" height="${size}">${paths}</svg>`;
  }

  // ═══ Tab config ═══
  const TAB_CONFIG = {
    history: { label: 'history.tab_history', modules: ['history-summary', 'history-filters', 'history-list'] }
  };
  const MODULE_SIZE = {
    'history-summary': 'full', 'history-filters': 'full', 'history-list': 'full',
    'stats-hero': 'full',
    'stats-status-activity': 'half', 'stats-duration-temp': 'half',
    'filament-breakdown': 'full',
    'stats-nozzle-models': 'full',
    'print-timeline': 'full'
  };

  let _data = [];
  let _cloudTasks = null;
  let _activeFilter = 'all';
  let _activeTab = 'history';
  let _activePrinter = 'all';
  const _locked = true;
  let _viewMode = localStorage.getItem('history-view-mode') || 'grid';
  let _sortField = localStorage.getItem('history-sort-field') || 'date';
  let _sortDir = localStorage.getItem('history-sort-dir') || 'desc';

  // Load cloud tasks for design title enrichment
  async function _loadCloudTasks() {
    if (_cloudTasks !== null) return;
    try {
      const res = await fetch('/api/bambu-cloud/tasks');
      if (!res.ok) { _cloudTasks = []; return; }
      const data = await res.json();
      _cloudTasks = data.tasks || data || [];
    } catch { _cloudTasks = []; }
  }

  function _getCloudMatch(filename) {
    if (!_cloudTasks || !filename) return null;
    const fn = filename.toLowerCase().trim();
    return _cloudTasks.find(t => {
      const tt = (t.title || '').toLowerCase().trim();
      const dt = (t.designTitle || '').toLowerCase().trim();
      return tt === fn || dt === fn || fn.includes(tt) || fn.includes(dt) || tt.includes(fn) || dt.includes(fn);
    }) || null;
  }

  // ═══ Module order ═══
  function getOrder(tabId) {
    return TAB_CONFIG[tabId]?.modules || [];
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
      // Sort data
      const sorted = [...data].sort((a, b) => {
        let va, vb;
        switch (_sortField) {
          case 'date': va = new Date(a.started_at || 0).getTime(); vb = new Date(b.started_at || 0).getTime(); break;
          case 'name': va = (a.filename || '').toLowerCase(); vb = (b.filename || '').toLowerCase(); break;
          case 'duration': va = a.duration_seconds || 0; vb = b.duration_seconds || 0; break;
          case 'status': va = a.status || ''; vb = b.status || ''; break;
          case 'filament': va = a.filament_used_g || 0; vb = b.filament_used_g || 0; break;
          default: va = new Date(a.started_at || 0).getTime(); vb = new Date(b.started_at || 0).getTime();
        }
        const cmp = va < vb ? -1 : va > vb ? 1 : 0;
        return _sortDir === 'asc' ? cmp : -cmp;
      });

      // Sort + view toolbar
      const arrow = _sortDir === 'asc' ? '↑' : '↓';
      const sortBtns = [
        { field: 'date', label: t('history.sort_date') },
        { field: 'name', label: t('history.sort_name') },
        { field: 'duration', label: t('history.sort_duration') },
        { field: 'filament', label: t('history.sort_filament') },
        { field: 'status', label: t('history.sort_status') }
      ];
      let h = '<div class="ph-list-toolbar">';
      h += '<div class="ph-sort-btns">';
      for (const s of sortBtns) {
        const active = _sortField === s.field;
        h += `<button class="ph-sort-btn${active ? ' active' : ''}" onclick="historySort('${s.field}')">${s.label}${active ? ' ' + arrow : ''}</button>`;
      }
      h += '</div>';
      h += '<div class="ph-view-btns">';
      h += `<button class="ph-view-btn${_viewMode === 'grid' ? ' active' : ''}" onclick="historyViewMode('grid')" title="Grid">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>
      </button>`;
      h += `<button class="ph-view-btn${_viewMode === 'list' ? ' active' : ''}" onclick="historyViewMode('list')" title="List">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
      </button>`;
      h += '</div>';
      // Compare toolbar
      h += '<div class="compare-toolbar">';
      h += '<button class="form-btn form-btn-sm form-btn-secondary" id="compare-selected-btn" style="display:none" onclick="window._launchCompareSelected()"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg> Compare</button>';
      h += '<button class="form-btn form-btn-sm form-btn-secondary" onclick="window.openPrintCompare()" title="Compare prints"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg></button>';
      h += '</div>';
      h += '</div>';

      if (_viewMode === 'grid') {
        h += '<div class="ph-grid" id="history-cards">';
        for (const row of sorted) {
          const fname = (row.filename || '--').replace(/\.(3mf|gcode)$/i, '');
          const cloud = _getCloudMatch(row.filename);
          const displayName = row.model_name || cloud?.designTitle || fname;
          const display = (_activeFilter === 'all' || row.status === _activeFilter) ? '' : 'display:none;';
          const pName = printerName(row.printer_id);
          const duration = formatDuration(row.duration_seconds);
          const dateShort = formatDateShort(row.started_at);
          const thumbUrl = `/api/history/${row.id}/thumbnail`;
          const fallbackThumb = 'data:image/svg+xml,' + encodeURIComponent(thumbPlaceholder(row.filament_color));
          const plateLabel = cloud?.plateIndex ? `Plate ${cloud.plateIndex}` : '';

          h += `<div class="ph-card" data-status="${row.status}" data-id="${row.id}" style="${display}" onclick="showHistoryDetail(${row.id})">
            <input type="checkbox" class="ph-compare-cb" value="${row.id}" onclick="event.stopPropagation();window._updateCompareBtn()" title="Select for compare">
            <button class="ph-crm-order-btn" onclick="event.stopPropagation();window.createOrderFromHistory(${row.id})" title="${t('crm.create_from_history')}" style="display:none">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/></svg>
            </button>
            <div class="ph-card-thumb">
              <img src="${thumbUrl}" alt="" loading="lazy" onerror="this.src='${fallbackThumb}'">
              <span class="ph-badge">Gcode</span>
            </div>
            <div class="ph-card-info">
              <div class="ph-card-name" title="${esc(displayName)}">${(row.model_url || cloud?.designId) ? `<a href="${row.model_url || 'https://makerworld.com/en/models/' + cloud.designId}" target="_blank" rel="noopener" class="ph-model-link-icon" onclick="event.stopPropagation()" title="Åpne modell"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg></a> ` : ''}${esc(displayName)}</div>
              <div class="ph-card-meta">
                <span class="ph-meta-item"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> ${duration}</span>
                <span class="ph-meta-item"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="6" y="2" width="12" height="8" rx="1"/><rect x="2" y="14" width="20" height="8" rx="1"/><line x1="6" y1="18" x2="6" y2="18.01"/></svg> ${esc(pName)}</span>
              </div>
              <div class="ph-card-bottom">
                <span class="ph-card-date">${plateLabel ? plateLabel + '  ' : ''}${dateShort}</span>
                ${row.filament_used_g ? `<span class="cost-badge">~${estimatePrintCostBadge(row.filament_used_g, row.filament_type)} kr</span>` : ''}
                <span class="ph-card-status" style="color:${statusColor(row.status)}">${statusLabel(row.status)}</span>
              </div>
              <div class="ph-card-notes" data-id="${row.id}">
                <span class="ph-notes-text" onclick="event.stopPropagation();window._editHistoryNote(${row.id}, this)">${row.notes ? esc(row.notes) : ''}</span>
                <span class="ph-notes-edit-icon" onclick="event.stopPropagation();window._editHistoryNote(${row.id}, this.previousElementSibling)" title="Edit notes">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                </span>
              </div>
            </div>
          </div>`;
        }
        h += '</div>';
      } else {
        // List view
        h += '<div class="ph-list" id="history-cards">';
        for (const row of sorted) {
          const fname = (row.filename || '--').replace(/\.(3mf|gcode)$/i, '');
          const cloud = _getCloudMatch(row.filename);
          const displayName = row.model_name || cloud?.designTitle || fname;
          const display = (_activeFilter === 'all' || row.status === _activeFilter) ? '' : 'display:none;';
          const pName = printerName(row.printer_id);
          const duration = formatDuration(row.duration_seconds);
          const dateFull = formatDate(row.started_at);
          const filWeight = row.filament_used_g ? fmtW(row.filament_used_g) : '--';
          const thumbUrl = `/api/history/${row.id}/thumbnail`;
          const fallbackThumb = 'data:image/svg+xml,' + encodeURIComponent(thumbPlaceholder(row.filament_color));

          h += `<div class="ph-list-row" data-status="${row.status}" data-id="${row.id}" style="${display}" onclick="showHistoryDetail(${row.id})">
            <input type="checkbox" class="ph-compare-cb" value="${row.id}" onclick="event.stopPropagation();window._updateCompareBtn()" title="Select for compare">
            <button class="ph-crm-order-btn ph-crm-order-btn-list" onclick="event.stopPropagation();window.createOrderFromHistory(${row.id})" title="${t('crm.create_from_history')}" style="display:none">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/></svg>
            </button>
            <div class="ph-list-thumb" data-label="">
              <img src="${thumbUrl}" alt="" loading="lazy" onerror="this.src='${fallbackThumb}'">
            </div>
            <div class="ph-list-name" data-label="Fil" title="${esc(displayName)}">${esc(displayName)}</div>
            <div class="ph-list-date" data-label="Dato">${dateFull}</div>
            <div class="ph-list-duration" data-label="Varighet">${duration}</div>
            <div class="ph-list-filament" data-label="Filament">${filWeight}</div>
            <div class="ph-list-cost" data-label="Kostnad">${row.filament_used_g ? `<span class="cost-badge">~${estimatePrintCostBadge(row.filament_used_g, row.filament_type)} kr</span>` : '--'}</div>
            <div class="ph-list-printer" data-label="Printer">${esc(pName)}</div>
            <div class="ph-list-notes" data-label="Notater" data-id="${row.id}">
              <span class="ph-notes-text" onclick="event.stopPropagation();window._editHistoryNote(${row.id}, this)">${row.notes ? esc(row.notes) : ''}</span>
              <span class="ph-notes-edit-icon" onclick="event.stopPropagation();window._editHistoryNote(${row.id}, this.previousElementSibling)" title="Edit notes">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              </span>
            </div>
            <div class="ph-list-status" data-label="Status" style="color:${statusColor(row.status)}">${statusIcon(row.status)}</div>
          </div>`;
        }
        h += '</div>';
      }

      const exportBase = _activePrinter === 'all' ? '/api/history/export' : `/api/history/export?printer_id=${_activePrinter}`;
      const csvUrl = exportBase + (exportBase.includes('?') ? '&' : '?') + 'format=csv';
      const jsonUrl = exportBase + (exportBase.includes('?') ? '&' : '?') + 'format=json';
      const dlIcon = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>';
      h += `<div class="history-export">
        <button class="form-btn form-btn-sm form-btn-secondary" data-ripple onclick="window.downloadExport('${csvUrl}')">${dlIcon} Export CSV</button>
        <button class="form-btn form-btn-sm form-btn-secondary" data-ripple onclick="window.downloadExport('${jsonUrl}')">${dlIcon} Export JSON</button>
      </div>`;
      return h;
    },

    // ═══ STATS TAB ═══

    // Hero summary cards with icons and ring gauge
    'stats-hero': (data) => {
      if (!data.length) return '';
      const s = getStats(data);
      const rateColor = s.successRate >= 90 ? 'var(--accent-green)' : s.successRate >= 70 ? 'var(--accent-orange)' : 'var(--accent-red)';
      const ratePct = Math.min(s.successRate, 100);
      const avgFilament = data.length > 0 ? Math.round(s.totalFilament / data.length) : 0;
      const wasteTotal = data.reduce((sum, r) => sum + (r.waste_g || 0), 0);

      return `<div class="waste-hero-grid" style="grid-template-columns:repeat(auto-fit, minmax(110px, 1fr))">
        <div class="waste-hero-card waste-hero-card--blue">
          <div class="waste-hero-top">
            <div class="waste-hero-icon" style="background:rgba(59,130,246,0.15);color:var(--accent-blue)">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="6" y="2" width="12" height="8" rx="1"/><rect x="2" y="14" width="20" height="8" rx="1"/></svg>
            </div>
          </div>
          <div class="waste-hero-value">${data.length}</div>
          <div class="waste-hero-label">${t('stats.total_prints')}</div>
        </div>
        <div class="waste-hero-card waste-hero-card--green">
          <div class="waste-hero-top">
            <div class="waste-hero-icon" style="background:rgba(63,185,80,0.15);color:var(--accent-green)">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
            </div>
          </div>
          <div style="position:relative;display:inline-flex;align-items:center;justify-content:center;margin:2px 0">
            <svg width="44" height="44" viewBox="0 0 44 44">
              <circle cx="22" cy="22" r="18" fill="none" stroke="var(--border-color)" stroke-width="4"/>
              <circle cx="22" cy="22" r="18" fill="none" stroke="${rateColor}" stroke-width="4"
                stroke-dasharray="${ratePct * 1.131} ${113.1 - ratePct * 1.131}"
                stroke-dashoffset="28.3" stroke-linecap="round"/>
            </svg>
            <span style="position:absolute;font-size:0.6rem;font-weight:800;color:${rateColor}">${s.successRate}%</span>
          </div>
          <div class="waste-hero-label">${t('stats.success_rate')}</div>
        </div>
        <div class="waste-hero-card waste-hero-card--cyan">
          <div class="waste-hero-top">
            <div class="waste-hero-icon" style="background:rgba(6,182,212,0.15);color:var(--accent-cyan)">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            </div>
          </div>
          <div class="waste-hero-value">${formatDuration(s.totalTime)}</div>
          <div class="waste-hero-label">${t('stats.total_time')}</div>
        </div>
        <div class="waste-hero-card waste-hero-card--orange">
          <div class="waste-hero-top">
            <div class="waste-hero-icon" style="background:rgba(249,115,22,0.15);color:var(--accent-orange)">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/></svg>
            </div>
          </div>
          <div class="waste-hero-value">${fmtW(s.totalFilament)}</div>
          <div class="waste-hero-label">${t('stats.filament_used')}</div>
        </div>
        <div class="waste-hero-card waste-hero-card--red">
          <div class="waste-hero-top">
            <div class="waste-hero-icon" style="background:rgba(248,81,73,0.15);color:var(--accent-red)">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
            </div>
          </div>
          <div class="waste-hero-value">${s.totalLayers.toLocaleString()}</div>
          <div class="waste-hero-label">${t('stats.total_layers')}</div>
        </div>
      </div>`;
    },

    // Combined: Status donut + printer breakdown + activity
    'stats-status-activity': (data) => {
      if (!data.length) return '';
      const s = getStats(data);

      // Status donut
      const segments = [
        { value: s.completed, color: 'var(--accent-green)', label: t('history.completed') },
        { value: s.failed, color: 'var(--accent-red)', label: t('history.failed') },
        { value: s.cancelled, color: 'var(--accent-orange)', label: t('history.cancelled') }
      ].filter(seg => seg.value > 0);

      let h = `<div class="card-title">${t('history.status_breakdown')}</div>`;
      h += `<div style="display:flex;align-items:center;gap:12px">`;
      h += `<div style="position:relative;flex-shrink:0;display:flex;align-items:center;justify-content:center">`;
      h += miniDonut(segments, 70, 8);
      h += `<div class="waste-donut-center" style="width:70px;height:70px">
        <span class="waste-donut-center-value" style="font-size:0.85rem">${data.length}</span>
        <span class="waste-donut-center-label">prints</span>
      </div>`;
      h += `</div>`;
      h += `<div style="flex:1;display:flex;flex-direction:column;gap:3px">`;
      for (const seg of segments) {
        const pct = ((seg.value / data.length) * 100).toFixed(0);
        h += `<div style="display:flex;align-items:center;gap:5px;font-size:0.72rem">
          <span style="width:8px;height:8px;border-radius:2px;background:${seg.color};flex-shrink:0"></span>
          <span style="flex:1">${seg.label}</span>
          <span style="font-weight:700">${seg.value}</span>
          <span class="text-muted" style="font-size:0.6rem">${pct}%</span>
        </div>`;
      }
      h += `</div></div>`;

      // Printer breakdown (compact)
      const byPrinter = {};
      for (const r of data) {
        const pid = r.printer_id || 'unknown';
        byPrinter[pid] = (byPrinter[pid] || 0) + 1;
      }
      const sortedPrinters = Object.entries(byPrinter).sort((a, b) => b[1] - a[1]);
      if (sortedPrinters.length > 0) {
        const mxP = sortedPrinters[0][1];
        h += `<div style="margin-top:10px;padding-top:8px;border-top:1px solid var(--border-color)">`;
        h += `<div class="waste-compact-heading">${t('history.printer_breakdown')}</div>`;
        for (const [pid, cnt] of sortedPrinters) {
          h += barRow(esc(printerName(pid)), (cnt / mxP) * 100, 'var(--accent-purple)', cnt);
        }
        h += `</div>`;
      }

      // Waste + color changes
      const wasteTotal = data.reduce((sum, r) => sum + (r.waste_g || 0), 0);
      const colorChanges = data.reduce((sum, r) => sum + (r.color_changes || 0), 0);
      if (wasteTotal > 0 || colorChanges > 0) {
        h += `<div style="margin-top:8px;padding-top:8px;border-top:1px solid var(--border-color)">`;
        h += `<div class="stats-detail-list">`;
        if (wasteTotal > 0) h += sRow(t('stats.total_waste'), fmtW(wasteTotal), 'var(--accent-orange)');
        if (colorChanges > 0) h += sRow(t('stats.color_changes'), colorChanges);
        h += `</div></div>`;
      }

      return h;
    },

    // Combined: Duration stats + Temperature stats
    'stats-duration-temp': (data) => {
      if (!data.length) return '';
      const s = getStats(data);

      // Duration
      const durations = data.filter(r => r.duration_seconds > 0).map(r => r.duration_seconds);
      const avgDuration = durations.length > 0 ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length) : 0;
      const longest = durations.length > 0 ? Math.max(...durations) : 0;
      const longestRow = data.find(r => r.duration_seconds === longest);
      const avgFilament = data.length > 0 ? Math.round(s.totalFilament / data.length) : 0;

      let h = `<div class="card-title">${t('history.duration_stats')}</div>`;
      h += `<div class="stats-detail-list">`;
      h += sRow(t('stats.avg_duration'), formatDuration(avgDuration));
      h += sRow(t('stats.longest_print'), `${formatDuration(longest)}${longestRow ? ' — ' + esc((longestRow.filename || '').replace(/\.(3mf|gcode)$/i, '').substring(0, 20)) : ''}`);
      h += sRow(t('stats.avg_filament'), `${avgFilament}g`);
      h += sRow(t('stats.total_time'), formatDuration(s.totalTime));
      h += `</div>`;

      // Temperature stats
      const nozzleTemps = data.filter(r => r.max_nozzle_temp > 100).map(r => r.max_nozzle_temp);
      const bedTemps = data.filter(r => r.max_bed_temp > 0).map(r => r.max_bed_temp);
      if (nozzleTemps.length || bedTemps.length) {
        h += `<div style="margin-top:10px;padding-top:8px;border-top:1px solid var(--border-color)">`;
        h += `<div class="waste-compact-heading">Temperaturer</div>`;
        h += `<div class="stats-detail-list">`;
        if (nozzleTemps.length) {
          const avg = Math.round(nozzleTemps.reduce((a, b) => a + b, 0) / nozzleTemps.length);
          const max = Math.max(...nozzleTemps);
          h += sRow('Dyse snitt / maks', `${avg}°C / ${max}°C`);
        }
        if (bedTemps.length) {
          const avg = Math.round(bedTemps.reduce((a, b) => a + b, 0) / bedTemps.length);
          const max = Math.max(...bedTemps);
          h += sRow('Bed snitt / maks', `${avg}°C / ${max}°C`);
        }
        h += `</div></div>`;
      }

      // Nozzle + speed (compact)
      const byNozzle = {};
      let totalLayers = 0;
      for (const r of data) {
        const key = r.nozzle_type && r.nozzle_diameter
          ? `${r.nozzle_type} ${r.nozzle_diameter}mm`
          : r.nozzle_diameter ? `${r.nozzle_diameter}mm` : null;
        if (key) {
          if (!byNozzle[key]) byNozzle[key] = { count: 0, time: 0 };
          byNozzle[key].count++;
          byNozzle[key].time += r.duration_seconds || 0;
        }
        totalLayers += r.layer_count || 0;
      }
      const sortedNozzles = Object.entries(byNozzle).sort((a, b) => b[1].count - a[1].count);
      if (sortedNozzles.length) {
        h += `<div style="margin-top:8px;padding-top:8px;border-top:1px solid var(--border-color)">`;
        h += `<div class="waste-compact-heading">Dyse & hastighet</div>`;
        const mxN = sortedNozzles[0][1].count;
        for (const [nz, d] of sortedNozzles) {
          h += barRow(esc(nz), (d.count / mxN) * 100, 'var(--accent-orange)', `${d.count}× · ${formatDuration(d.time)}`);
        }
        h += `<div class="stats-detail-list" style="margin-top:6px">`;
        h += sRow(t('stats.total_layers'), totalLayers.toLocaleString());
        const speedLevels = data.filter(r => r.speed_level != null);
        if (speedLevels.length > 0) {
          const speedNames = { 1: 'Stille', 2: 'Standard', 3: 'Sport', 4: 'Ludicrous' };
          const bySp = {};
          for (const r of speedLevels) {
            const name = speedNames[r.speed_level] || `Nivå ${r.speed_level}`;
            bySp[name] = (bySp[name] || 0) + 1;
          }
          const topSpeed = Object.entries(bySp).sort((a, b) => b[1] - a[1]);
          h += sRow('Mest brukte', topSpeed[0] ? `${topSpeed[0][0]} (${topSpeed[0][1]}×)` : '--');
        }
        h += `</div></div>`;
      }

      return h;
    },

    'filament-breakdown': (data) => {
      if (!data.length) return '';
      const byType = {};
      const byColor = {};
      const byBrand = {};
      for (const r of data) {
        const tp = r.filament_type || 'Unknown';
        const color = r.filament_color || '';
        const brand = r.filament_brand || 'Unknown';
        if (!byType[tp]) byType[tp] = { count: 0, weight: 0, colors: new Set() };
        byType[tp].count++;
        byType[tp].weight += r.filament_used_g || 0;
        if (color) byType[tp].colors.add(color.substring(0, 6));
        const colorKey = color ? color.substring(0, 6) : 'none';
        if (!byColor[colorKey]) byColor[colorKey] = { count: 0, weight: 0, type: tp };
        byColor[colorKey].count++;
        byColor[colorKey].weight += r.filament_used_g || 0;
        if (!byBrand[brand]) byBrand[brand] = { count: 0, weight: 0 };
        byBrand[brand].count++;
        byBrand[brand].weight += r.filament_used_g || 0;
      }

      let h = `<div class="card-title">${t('history.filament_breakdown')}</div>`;
      h += '<div class="filament-breakdown-grid">';

      // Left: Type bars + Brand bars
      h += '<div class="filament-breakdown-col">';
      const sortedTypes = Object.entries(byType).sort((a, b) => b[1].count - a[1].count);
      const mxT = sortedTypes[0]?.[1].count || 1;
      h += '<div class="card-subtitle">Per type</div><div class="chart-bars">';
      for (const [tp, d] of sortedTypes) {
        const swatches = [...d.colors].map(c => typeof miniSpool === 'function' ? miniSpool('#' + c, 12) : `<span class="color-dot" style="background:#${c}"></span>`).join('');
        h += `<div class="chart-bar-row"><span class="chart-bar-label">${swatches} ${esc(tp)}</span><div class="chart-bar-track"><div class="chart-bar-fill" style="width:${(d.count/mxT)*100}%;background:var(--accent-blue)"></div></div><span class="chart-bar-value">${d.count} · ${fmtW(d.weight)}</span></div>`;
      }
      h += '</div>';

      const sortedBrands = Object.entries(byBrand).sort((a, b) => b[1].weight - a[1].weight);
      if (sortedBrands.length > 1 || (sortedBrands.length === 1 && sortedBrands[0][0] !== 'Unknown')) {
        const mxB = sortedBrands[0]?.[1].weight || 1;
        h += '<div class="card-subtitle" style="margin-top:12px">Per merke</div><div class="chart-bars">';
        for (const [brand, d] of sortedBrands) {
          h += barRow(esc(brand), (d.weight/mxB)*100, 'var(--accent-purple)', `${d.count}× · ${fmtW(d.weight)}`);
        }
        h += '</div>';
      }
      h += '</div>';

      // Right: Color chips
      const sortedColors = Object.entries(byColor).filter(([k]) => k !== 'none').sort((a, b) => b[1].count - a[1].count);
      if (sortedColors.length > 0) {
        h += '<div class="filament-breakdown-col">';
        h += '<div class="card-subtitle">Farger brukt</div><div class="filament-color-grid">';
        for (const [hex, d] of sortedColors) {
          const c = '#' + hex;
          const r = parseInt(hex.substring(0,2),16), g = parseInt(hex.substring(2,4),16), b = parseInt(hex.substring(4,6),16);
          const light = (r*299+g*587+b*114)/1000 > 160;
          h += `<div class="filament-color-chip" style="background:${c};color:${light?'#333':'#fff'}">
            <span class="filament-color-type">${esc(d.type)}</span>
            <span class="filament-color-stats">${d.count}× · ${fmtW(d.weight)}</span>
          </div>`;
        }
        h += '</div></div>';
      }
      h += '</div>';
      return h;
    },

    // Combined: Top models + nozzle side by side in one full-width module
    'stats-nozzle-models': (data) => {
      if (!data.length) return '';

      // Top models
      const byModel = {};
      for (const r of data) {
        const name = (r.filename || 'Ukjent').replace(/\.(3mf|gcode)$/i, '');
        if (!byModel[name]) byModel[name] = { count: 0, time: 0, success: 0, fail: 0 };
        byModel[name].count++;
        byModel[name].time += r.duration_seconds || 0;
        if (r.status === 'completed') byModel[name].success++;
        if (r.status === 'failed') byModel[name].fail++;
      }
      const sorted = Object.entries(byModel).sort((a, b) => b[1].count - a[1].count).slice(0, 8);
      if (!sorted.length) return '';
      const mx = sorted[0]?.[1].count || 1;

      let h = `<div class="card-title">Mest printede modeller</div><div class="chart-bars">`;
      for (const [name, d] of sorted) {
        const failTag = d.fail > 0 ? ` <span style="color:var(--accent-red);font-size:0.65rem">(${d.fail} feilet)</span>` : '';
        h += barRow(esc(name.length > 35 ? name.substring(0, 33) + '…' : name), (d.count / mx) * 100, 'var(--accent-green)', `${d.count}×${failTag}`);
      }
      h += '</div>';
      return h;
    },

    'print-timeline': (data) => {
      if (!data.length) return '';
      const byDay = {};
      for (const r of data) {
        if (!r.started_at) continue;
        const day = r.started_at.substring(0, 10);
        if (!byDay[day]) byDay[day] = { count: 0, time: 0, success: 0 };
        byDay[day].count++;
        byDay[day].time += r.duration_seconds || 0;
        if (r.status === 'completed') byDay[day].success++;
      }
      const days = Object.entries(byDay).sort((a, b) => a[0].localeCompare(b[0]));
      if (days.length < 2) return '';

      const maxCount = Math.max(...days.map(d => d[1].count), 1);
      let h = `<div class="card-title">${t('stats.print_timeline') || 'Printtidslinje'}</div>`;
      h += `<div class="timeline-chart">`;
      for (const [day, d] of days) {
        const pct = (d.count / maxCount) * 100;
        const dateLabel = day.substring(8) + '.' + day.substring(5, 7);
        const successRate = d.count > 0 ? Math.round(d.success / d.count * 100) : 0;
        const color = successRate === 100 ? 'var(--accent-green)' : successRate >= 50 ? 'var(--accent-orange, #f0883e)' : 'var(--accent-red)';
        const tooltipDate = dateLabel + "." + day.substring(0, 4);
        h += `<div class="timeline-bar" title="${tooltipDate}: ${d.count} prints, ${formatDuration(d.time)}">
          <div class="timeline-bar-fill" style="height:${pct}%;background:${color}"></div>
          <span class="timeline-bar-label">${dateLabel}</span>
          <span class="timeline-bar-count">${d.count}</span>
        </div>`;
      }
      h += '</div>';

      // Activity + hourly heatmap
      const totalDays = days.length;
      const first = days[0][0];
      const last = days[days.length - 1][0];
      const span = Math.max(1, Math.round((new Date(last) - new Date(first)) / 86400000));
      const activePct = Math.round(totalDays / span * 100);
      const byHour = Array(24).fill(0);
      for (const r of data) {
        if (!r.started_at) continue;
        byHour[new Date(r.started_at).getHours()]++;
      }
      const peakHour = byHour.indexOf(Math.max(...byHour));
      const maxHour = Math.max(...byHour, 1);

      h += `<div style="display:flex;gap:16px;margin-top:10px;flex-wrap:wrap">`;
      // Left: activity stats
      h += `<div style="flex:1;min-width:180px"><div class="stats-detail-list">`;
      h += sRow('Aktive printdager', `${totalDays} av ${span} dager (${activePct}%)`);
      h += sRow('Prints per dag (snitt)', (data.length / totalDays).toFixed(1));
      h += sRow('Mest aktive time', `${String(peakHour).padStart(2,'0')}:00 – ${String(peakHour+1).padStart(2,'0')}:00 (${byHour[peakHour]} prints)`);
      h += `</div></div>`;
      // Right: hourly mini heatmap
      h += `<div style="flex:1;min-width:200px">`;
      h += `<div class="waste-compact-heading">Aktivitet per time</div>`;
      h += `<div style="display:flex;gap:2px;align-items:flex-end;height:36px">`;
      for (let i = 0; i < 24; i++) {
        const v = byHour[i];
        const ht = maxHour > 0 ? Math.max((v / maxHour) * 100, v > 0 ? 8 : 2) : 2;
        const bg = v > 0 ? `rgba(63, 185, 80, ${Math.max(0.3, v / maxHour)})` : 'var(--bg-tertiary)';
        h += `<div title="${String(i).padStart(2,'0')}:00 — ${v} prints" style="flex:1;height:${ht}%;background:${bg};border-radius:2px 2px 0 0"></div>`;
      }
      h += `</div>`;
      h += `<div style="display:flex;justify-content:space-between;font-size:0.5rem;color:var(--text-muted);margin-top:2px"><span>00</span><span>06</span><span>12</span><span>18</span><span>23</span></div>`;
      h += `</div></div>`;
      return h;
    }
  };

  // ═══ Detail overlay ═══
  function showDetail(id) {
    const row = _data.find(r => r.id === id);
    if (!row) return;

    const fname = (row.filename || '--').replace(/\.(3mf|gcode)$/i, '');
    const cloud = _getCloudMatch(row.filename);
    const displayName = row.model_name || cloud?.designTitle || fname;
    const pName = printerName(row.printer_id);
    const speed = speedLabel(row.speed_level);
    const filWeight = row.filament_used_g ? fmtW(row.filament_used_g) : '--';
    const filBrand = row.filament_brand || '--';
    const filType = row.filament_type || '--';
    const filColorHex = row.filament_color && row.filament_color.length >= 6 ? '#' + row.filament_color.substring(0, 6) : null;
    const traySlot = row.tray_id != null && row.tray_id !== '255' ? `A${parseInt(row.tray_id) + 1}` : row.tray_id === '255' ? 'Ext' : '--';
    const amsUsed = row.ams_units_used ? `${row.ams_units_used} enhet${row.ams_units_used > 1 ? 'er' : ''}` : '--';
    const thumbUrl = `/api/history/${row.id}/thumbnail`;
    const fallbackThumb = 'data:image/svg+xml,' + encodeURIComponent(thumbPlaceholder(row.filament_color));
    const nozzleText = [row.nozzle_type, row.nozzle_diameter ? row.nozzle_diameter + 'mm' : ''].filter(Boolean).join(' ') || '--';
    const plateLabel = cloud?.plateName || (cloud?.plateIndex ? `Plate ${cloud.plateIndex}` : '');

    let filChip = '';
    if (row.filament_type) {
      const fColor = filColorHex || '#888';
      filChip = `<div class="ph-detail-filament-chip">
        <div class="ph-fil-swatch" style="background:${fColor}"></div>
        <div class="ph-fil-chip-info">
          <span class="ph-fil-chip-brand">${esc(filBrand)}</span>
          <span class="ph-fil-chip-type">${esc(filType)}${filWeight !== '--' ? ' · ' + filWeight : ''}</span>
          <span class="ph-fil-chip-slot">${traySlot}</span>
        </div>
      </div>`;
    }

    const overlay = document.createElement('div');
    overlay.className = 'ph-detail-overlay';
    overlay.onclick = (e) => { if (e.target === overlay) overlay.remove(); };

    const tempInfo = [];
    if (row.max_nozzle_temp > 0) tempInfo.push(`Dyse: ${row.max_nozzle_temp}°C`);
    if (row.max_bed_temp > 0) tempInfo.push(`Bed: ${row.max_bed_temp}°C`);
    const tempText = tempInfo.length ? tempInfo.join(' · ') : '--';

    // Build model source link from DB or cloud task data
    let modelLinkHtml = '';
    const modelUrl = row.model_url || (cloud?.designId ? `https://makerworld.com/en/models/${cloud.designId}` : null);
    if (modelUrl) {
      const mwUrl = modelUrl;
      const mwTitle = displayName;
      modelLinkHtml = `<div class="ph-detail-field ph-detail-field-wide">
        <span class="ph-detail-label">Modellkilde</span>
        <span class="ph-detail-value"><a href="${mwUrl}" target="_blank" rel="noopener" class="ph-model-link" title="Åpne på MakerWorld">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:-2px;margin-right:4px"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>${esc(mwTitle)}</a></span>
      </div>`;
    }

    overlay.innerHTML = `<div class="ph-detail-panel">
      <button class="ph-detail-close" onclick="this.closest('.ph-detail-overlay').remove()">&times;</button>
      <div class="ph-detail-layout">
        <div class="ph-detail-left">
          <div class="ph-detail-thumb">
            <img src="${thumbUrl}" alt="" onerror="this.src='${fallbackThumb}'">
            <span class="ph-badge">Gcode</span>
          </div>
          <div class="ph-detail-status-banner" style="background:${statusColor(row.status)}">
            ${statusIcon(row.status)}
            <span>${statusLabel(row.status)}</span>
          </div>
          ${filChip ? `<div class="ph-detail-filaments-section">
            <span class="ph-detail-label">Filaments</span>
            ${filChip}
          </div>` : ''}
        </div>
        <div class="ph-detail-right">
          <div class="ph-detail-header">
            <h3 class="ph-detail-title">${esc(displayName)}</h3>
          </div>
          <div class="ph-detail-grid">
            <div class="ph-detail-field">
              <span class="ph-detail-label">${t('common.printer')}</span>
              <span class="ph-detail-value">${esc(pName)}</span>
            </div>
            <div class="ph-detail-field">
              <span class="ph-detail-label">${t('history.duration')}</span>
              <span class="ph-detail-value">${formatDuration(row.duration_seconds)}</span>
            </div>
            <div class="ph-detail-field">
              <span class="ph-detail-label">Filamentmerke</span>
              <span class="ph-detail-value">${esc(filBrand)}</span>
            </div>
            <div class="ph-detail-field">
              <span class="ph-detail-label">Filamenttype</span>
              <span class="ph-detail-value">${filColorHex ? (typeof miniSpool === 'function' ? miniSpool(filColorHex, 14) + ' ' : `<span class="color-dot" style="background:${filColorHex}"></span> `) : ''}${esc(filType)}</span>
            </div>
            <div class="ph-detail-field">
              <span class="ph-detail-label">Vekt brukt</span>
              <span class="ph-detail-value">${filWeight}</span>
            </div>
            <div class="ph-detail-field">
              <span class="ph-detail-label">${t('history.layers')}</span>
              <span class="ph-detail-value">${row.layer_count || '--'}</span>
            </div>
            <div class="ph-detail-field">
              <span class="ph-detail-label">AMS-spor</span>
              <span class="ph-detail-value">${traySlot}</span>
            </div>
            ${speed ? `<div class="ph-detail-field">
              <span class="ph-detail-label">${t('speed.label').replace(':','')}</span>
              <span class="ph-detail-value">${speed}</span>
            </div>` : ''}
            <div class="ph-detail-field">
              <span class="ph-detail-label">${t('printer_info.nozzle')}</span>
              <span class="ph-detail-value">${nozzleText}</span>
            </div>
            <div class="ph-detail-field">
              <span class="ph-detail-label">Temperaturer</span>
              <span class="ph-detail-value">${tempText}</span>
            </div>
            <div class="ph-detail-field ph-detail-cost-field" data-id="${row.id}" data-filament-g="${row.filament_used_g || 0}" data-duration-s="${row.duration_seconds || 0}">
              <span class="ph-detail-label">${t('filament.cost_estimate')}</span>
              <span class="ph-detail-value ph-detail-cost-value">--</span>
            </div>
            ${plateLabel ? `<div class="ph-detail-field">
              <span class="ph-detail-label">Plate</span>
              <span class="ph-detail-value">${esc(plateLabel)}</span>
            </div>` : ''}
          </div>
          <div class="ph-detail-divider"></div>
          <div class="ph-detail-grid">
            <div class="ph-detail-field">
              <span class="ph-detail-label">${t('history.started')}</span>
              <span class="ph-detail-value">${formatDateFull(row.started_at)}</span>
            </div>
            <div class="ph-detail-field">
              <span class="ph-detail-label">${t('history.ended')}</span>
              <span class="ph-detail-value">${formatDateFull(row.finished_at)}</span>
            </div>
          </div>
          <div class="ph-detail-divider"></div>
          <div id="ph-milestone-album-${row.id}" class="ph-milestone-album"></div>
          <div class="ph-detail-divider"></div>
          <div class="ph-detail-footer-fields">
            <div class="ph-detail-field ph-detail-field-wide">
              <span class="ph-detail-label">${t('history.filename')}</span>
              <span class="ph-detail-value ph-detail-mono">${esc(row.filename) || '--'}</span>
            </div>
            ${modelLinkHtml}
            ${row.notes ? `<div class="ph-detail-field ph-detail-field-wide">
              <span class="ph-detail-label">${t('maintenance.notes')}</span>
              <span class="ph-detail-value">${esc(row.notes)}</span>
            </div>` : ''}
          </div>
          <div class="ph-detail-actions" id="ph-detail-actions-${row.id}" style="display:none">
            <div class="ph-detail-divider"></div>
            <button class="form-btn form-btn-sm form-btn-secondary" onclick="event.stopPropagation();window.createOrderFromHistory(${row.id})" title="${t('crm.create_from_history')}">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/></svg>
              ${t('crm.create_from_history')}
            </button>
          </div>
        </div>
      </div>
    </div>`;

    document.body.appendChild(overlay);

    const costField = overlay.querySelector('.ph-detail-cost-field');
    if (costField) {
      const fg = parseFloat(costField.dataset.filamentG) || 0;
      const ds = parseInt(costField.dataset.durationS) || 0;
      if (fg > 0 || ds > 0) {
        fetch(`/api/inventory/cost-estimate?filament_g=${fg}&duration_s=${ds}`)
          .then(r => r.json())
          .then(cost => {
            if (cost.total_cost > 0) {
              const el = costField.querySelector('.ph-detail-cost-value');
              if (el) el.textContent = formatCurrency(cost.total_cost);
            }
          }).catch(() => {});
      }
    }

    // Async: fetch designer from MakerWorld for model link
    if (cloud?.designId) {
      fetch(`/api/makerworld/${cloud.designId}`).then(r => r.json()).then(mw => {
        if (mw.designer) {
          const linkEl = overlay.querySelector('.ph-model-link');
          if (linkEl) {
            const designerSpan = document.createElement('span');
            designerSpan.style.cssText = 'font-size:0.78rem;color:var(--text-muted);margin-left:8px';
            designerSpan.textContent = 'av ' + mw.designer;
            linkEl.parentElement.appendChild(designerSpan);
          }
        }
      }).catch(() => {});
    }

    // Load milestone album
    const albumEl = overlay.querySelector(`#ph-milestone-album-${id}`);
    if (albumEl) {
      fetch(`/api/milestones/archive/${id}`).then(r => r.json()).then(milestones => {
        if (!milestones.length) { albumEl.style.display = 'none'; return; }
        let ah = `<div class="ph-detail-label" style="margin-bottom:8px">${t('history.milestone_album')}</div>`;
        ah += `<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:6px">`;
        for (const m of milestones) {
          ah += `<div style="position:relative;border-radius:6px;overflow:hidden;cursor:pointer" onclick="window.open('${m.url}','_blank')">`;
          ah += `<img src="${m.url}" alt="${m.milestone}%" style="width:100%;aspect-ratio:16/9;object-fit:cover;display:block">`;
          ah += `<div style="position:absolute;bottom:0;left:0;right:0;background:linear-gradient(transparent,rgba(0,0,0,0.7));padding:2px 6px;text-align:center">`;
          ah += `<span style="color:#fff;font-size:0.7rem;font-weight:700">${m.milestone}%</span>`;
          ah += `</div></div>`;
        }
        ah += `</div>`;
        albumEl.innerHTML = ah;
      }).catch(() => { albumEl.style.display = 'none'; });
    }

    // Show CRM action button if license is active
    fetch('/api/ecommerce/license')
      .then(r => r.ok ? r.json() : { active: false })
      .then(lic => {
        if (lic && lic.active) {
          const actionsEl = overlay.querySelector(`#ph-detail-actions-${id}`);
          if (actionsEl) actionsEl.style.display = '';
        }
      }).catch(() => {});
  }

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


  // ═══ Main render ═══
  async function loadHistory() {
    const panel = document.getElementById('overlay-panel-body');
    if (!panel) return;

    panel.innerHTML = `<div class="history-loading"><span class="text-muted">${t('progress.waiting')}</span></div>`;

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
      const [histRes] = await Promise.all([fetch('/api/history?limit=100'), _loadCloudTasks()]);
      _data = await histRes.json();

      if (!_data.length) {
        panel.innerHTML = emptyState({
          icon: '<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 8v4l3 3"/><circle cx="12" cy="12" r="10"/></svg>',
          title: t('history.no_records'),
          desc: t('history.no_records_desc') || 'Your print history will appear here once you complete your first print.'
        });
        return;
      }

      const filteredData = _activePrinter === 'all'
        ? _data : _data.filter(r => r.printer_id === _activePrinter);

      let html = '<div class="history-layout">';

      // Toolbar

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

      // 2-column layout: left = summary + filters, right = list
      const summaryContent = BUILDERS['history-summary'] ? BUILDERS['history-summary'](filteredData) : '';
      const filtersContent = BUILDERS['history-filters'] ? BUILDERS['history-filters'](filteredData) : '';
      const listContent = BUILDERS['history-list'] ? BUILDERS['history-list'](filteredData) : '';

      html += `<div class="hist-2col">
        <div class="hist-sidebar">
          ${summaryContent ? `<div class="stats-module">${summaryContent}</div>` : ''}
          ${filtersContent ? `<div class="stats-module">${filtersContent}</div>` : ''}
        </div>
        <div class="hist-main">
          ${listContent ? `<div class="stats-module">${listContent}</div>` : ''}
        </div>
      </div>`;

      html += '</div>';
      panel.innerHTML = html;

      // Show CRM order buttons if license is active
      fetch('/api/ecommerce/license')
        .then(r => r.ok ? r.json() : { active: false })
        .then(lic => {
          if (lic && lic.active) {
            panel.querySelectorAll('.ph-crm-order-btn').forEach(btn => {
              btn.style.display = '';
            });
          }
        }).catch(() => {});

    } catch (e) {
      panel.innerHTML = `<p class="text-muted">${t('history.load_failed')}</p>`;
    }
  }

  // ═══ Global API ═══
  window.loadHistoryPanel = loadHistory;
  window.switchHistoryTab = switchTab;
  window.showHistoryDetail = showDetail;
  window.toggleHistoryDetail = function(btn) {
    const card = btn.closest('.history-card-content') || btn.closest('.history-card');
    const detail = card.querySelector('.history-card-detail');
    if (!detail) return;
    const isOpen = detail.style.display !== 'none';
    detail.style.display = isOpen ? 'none' : '';
    btn.classList.toggle('open', !isOpen);
  };

  window.filterHistoryPrinter = function(printerId) {
    _activePrinter = printerId;
    const slug = printerId === 'all' ? 'history' : `history/printer/${printerId}`;
    if (location.hash !== '#' + slug) history.replaceState(null, '', '#' + slug);
    loadHistory();
  };

  window.historySort = function(field) {
    if (_sortField === field) {
      _sortDir = _sortDir === 'desc' ? 'asc' : 'desc';
    } else {
      _sortField = field;
      _sortDir = field === 'name' ? 'asc' : 'desc';
    }
    localStorage.setItem('history-sort-field', _sortField);
    localStorage.setItem('history-sort-dir', _sortDir);
    loadHistory();
  };

  window.historyViewMode = function(mode) {
    _viewMode = mode;
    localStorage.setItem('history-view-mode', mode);
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
    document.querySelectorAll('.ph-card, .ph-list-row').forEach(card => {
      card.style.display = (status === 'all' || card.dataset.status === status) ? '' : 'none';
    });
  };

  // ═══ Compare helpers ═══
  window._updateCompareBtn = function() {
    const checked = document.querySelectorAll('.ph-compare-cb:checked');
    const btn = document.getElementById('compare-selected-btn');
    if (btn) {
      btn.style.display = checked.length === 2 ? '' : 'none';
    }
  };

  window._launchCompareSelected = function() {
    const checked = document.querySelectorAll('.ph-compare-cb:checked');
    if (checked.length !== 2) return;
    const id1 = parseInt(checked[0].value);
    const id2 = parseInt(checked[1].value);
    if (typeof window.openPrintCompare === 'function') {
      window.openPrintCompare(id1, id2);
    }
  };

  // ═══ Inline notes editing ═══
  window._editHistoryNote = function(id, textEl) {
    // Don't open if already editing
    if (textEl.parentElement.querySelector('textarea')) return;
    const currentText = textEl.textContent || '';
    const ta = document.createElement('textarea');
    ta.className = 'ph-notes-textarea';
    ta.value = currentText;
    ta.rows = 2;
    ta.placeholder = 'Add a note...';
    textEl.style.display = 'none';
    textEl.parentElement.querySelector('.ph-notes-edit-icon').style.display = 'none';
    textEl.parentElement.insertBefore(ta, textEl);
    ta.focus();

    async function saveNote() {
      const newText = ta.value.trim();
      try {
        const resp = await fetch(`/api/history/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ notes: newText })
        });
        if (!resp.ok) throw new Error('Failed to save');
        textEl.textContent = newText;
        // Update local cache
        const cached = _data.find(r => r.id === id);
        if (cached) cached.notes = newText;
        if (typeof showToast === 'function') showToast('Note saved', 'success', 2000);
      } catch (e) {
        if (typeof showToast === 'function') showToast('Failed to save note', 'error', 3000);
      }
      ta.remove();
      textEl.style.display = '';
      textEl.parentElement.querySelector('.ph-notes-edit-icon').style.display = '';
    }

    ta.addEventListener('blur', saveNote);
    ta.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); ta.blur(); }
      if (e.key === 'Escape') { ta.value = currentText; ta.blur(); }
    });
  };

  // ═══ Customer select dialog ═══
  window.showCustomerSelectDialog = function(callback) {
    const overlay = document.createElement('div');
    overlay.className = 'ph-detail-overlay';
    overlay.style.zIndex = '10001';
    overlay.onclick = (e) => { if (e.target === overlay) overlay.remove(); };

    const _e = (s) => { const d = document.createElement('div'); d.textContent = s || ''; return d.innerHTML; };

    overlay.innerHTML = `<div class="ph-detail-panel" style="max-width:480px;margin:auto">
      <button class="ph-detail-close" onclick="this.closest('.ph-detail-overlay').remove()">&times;</button>
      <h3 style="margin:0 0 1rem">${t('crm.select_customer')}</h3>
      <input type="text" class="form-control" id="crm-cust-search" placeholder="${t('crm.search_customers')}" style="margin-bottom:0.75rem">
      <div id="crm-cust-results" style="max-height:200px;overflow-y:auto;margin-bottom:1rem"></div>
      <div class="ph-detail-divider"></div>
      <h4 style="margin:0.75rem 0 0.5rem;font-size:0.9rem;color:var(--text-muted)">${t('crm.or_create_new')}</h4>
      <div style="display:flex;gap:0.5rem;margin-bottom:0.5rem">
        <input type="text" class="form-control" id="crm-new-name" placeholder="${t('crm.customer_name')}" style="flex:1">
        <input type="email" class="form-control" id="crm-new-email" placeholder="${t('crm.email')}" style="flex:1">
      </div>
      <button class="form-btn form-btn-sm form-btn-primary" id="crm-quick-create-btn">${t('crm.quick_create')}</button>
    </div>`;

    document.body.appendChild(overlay);

    const searchInput = overlay.querySelector('#crm-cust-search');
    const resultsDiv = overlay.querySelector('#crm-cust-results');

    async function loadCustomers(search) {
      const q = search ? '?search=' + encodeURIComponent(search) : '?limit=10';
      try {
        const r = await fetch('/api/crm/customers' + q);
        const customers = r.ok ? await r.json() : [];
        if (!customers.length) {
          resultsDiv.innerHTML = `<div style="color:var(--text-muted);font-size:0.85rem;padding:0.5rem">${t('crm.no_customers')}</div>`;
          return;
        }
        resultsDiv.innerHTML = customers.map(c =>
          `<div class="crm-cust-row" data-id="${c.id}" style="padding:0.5rem;border-radius:4px;cursor:pointer;display:flex;justify-content:space-between;align-items:center" onmouseenter="this.style.background='var(--bg-hover)'" onmouseleave="this.style.background=''">
            <div>
              <strong>${_e(c.name)}</strong>
              ${c.company ? `<span style="color:var(--text-muted);font-size:0.8rem;margin-left:6px">${_e(c.company)}</span>` : ''}
            </div>
            <span style="color:var(--text-muted);font-size:0.8rem">${_e(c.email || '')}</span>
          </div>`
        ).join('');

        resultsDiv.querySelectorAll('.crm-cust-row').forEach(row => {
          row.addEventListener('click', () => {
            overlay.remove();
            callback(parseInt(row.dataset.id));
          });
        });
      } catch {
        resultsDiv.innerHTML = '';
      }
    }

    loadCustomers('');

    let _searchTimer = null;
    searchInput.addEventListener('input', () => {
      clearTimeout(_searchTimer);
      _searchTimer = setTimeout(() => loadCustomers(searchInput.value.trim()), 300);
    });

    overlay.querySelector('#crm-quick-create-btn').addEventListener('click', async () => {
      const name = overlay.querySelector('#crm-new-name').value.trim();
      const email = overlay.querySelector('#crm-new-email').value.trim();
      if (!name) {
        if (typeof showToast === 'function') showToast(t('crm.customer_name_required'), 'warning');
        return;
      }
      try {
        const r = await fetch('/api/crm/customers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email: email || null })
        });
        const data = await r.json();
        if (data.ok && data.id) {
          overlay.remove();
          callback(data.id);
        } else {
          if (typeof showToast === 'function') showToast(data.error || 'Failed', 'error');
        }
      } catch (e) {
        if (typeof showToast === 'function') showToast('Failed to create customer', 'error');
      }
    });
  };

  // ═══ Create order from history ═══
  window.createOrderFromHistory = function(printId) {
    window.showCustomerSelectDialog(async (customerId) => {
      try {
        const r = await fetch(`/api/crm/orders/from-history/${printId}?customer_id=${customerId}`, { method: 'POST' });
        const data = await r.json();
        if (data.ok) {
          if (typeof showToast === 'function') showToast(t('crm.order_created') + ': ' + data.order_number, 'success');
          // Close the history detail overlay
          const detailOverlay = document.querySelector('.ph-detail-overlay');
          if (detailOverlay) detailOverlay.remove();
          // Navigate to CRM orders panel
          if (typeof openPanel === 'function') openPanel('crm-orders');
        } else {
          if (typeof showToast === 'function') showToast(data.error || 'Failed', 'error');
        }
      } catch (e) {
        if (typeof showToast === 'function') showToast('Failed to create order', 'error');
      }
    });
  };

})();
