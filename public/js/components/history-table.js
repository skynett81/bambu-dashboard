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
    history: { label: 'history.tab_history', modules: ['history-summary', 'history-filters', 'history-list'] },
    stats:   { label: 'history.tab_stats',   modules: ['stats-hero', 'stats-status-activity', 'stats-duration-temp', 'filament-breakdown', 'stats-nozzle-models', 'print-timeline'] }
  };
  const MODULE_SIZE = {
    'history-summary': 'full', 'history-filters': 'full', 'history-list': 'full',
    'stats-hero': 'full',
    'stats-status-activity': 'half', 'stats-duration-temp': 'half',
    'filament-breakdown': 'full',
    'stats-nozzle-models': 'full',
    'print-timeline': 'full'
  };

  const STORAGE_PREFIX = 'history-module-order-';
  const LOCK_KEY = 'history-layout-locked';

  let _data = [];
  let _cloudTasks = null;
  let _activeFilter = 'all';
  let _activeTab = 'history';
  let _activePrinter = 'all';
  let _locked = localStorage.getItem(LOCK_KEY) !== '0';
  let _draggedMod = null;

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

  // ═══ Persistence ═══
  function getOrder(tabId) {
    const defaults = TAB_CONFIG[tabId]?.modules || [];
    try {
      const o = JSON.parse(localStorage.getItem(STORAGE_PREFIX + tabId));
      if (Array.isArray(o)) {
        const valid = o.filter(id => defaults.includes(id));
        if (valid.length >= defaults.length - 1) return valid;
        localStorage.removeItem(STORAGE_PREFIX + tabId);
      }
    } catch (_) {}
    return defaults;
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
      let h = '<div class="ph-grid" id="history-cards">';
      for (const row of data) {
        const fname = (row.filename || '--').replace(/\.(3mf|gcode)$/i, '');
        const cloud = _getCloudMatch(row.filename);
        const displayName = cloud?.designTitle || fname;
        const display = (_activeFilter === 'all' || row.status === _activeFilter) ? '' : 'display:none;';
        const pName = printerName(row.printer_id);
        const duration = formatDuration(row.duration_seconds);
        const dateShort = formatDateShort(row.started_at);
        const thumbUrl = `/api/history/${row.id}/thumbnail`;
        const fallbackThumb = 'data:image/svg+xml,' + encodeURIComponent(thumbPlaceholder(row.filament_color));
        const plateLabel = cloud?.plateIndex ? `Plate ${cloud.plateIndex}` : '';

        h += `<div class="ph-card" data-status="${row.status}" data-id="${row.id}" style="${display}" onclick="showHistoryDetail(${row.id})">
          <div class="ph-card-thumb">
            <img src="${thumbUrl}" alt="" loading="lazy" onerror="this.src='${fallbackThumb}'">
            <span class="ph-badge">Gcode</span>
          </div>
          <div class="ph-card-info">
            <div class="ph-card-name" title="${esc(displayName)}">${esc(displayName)}</div>
            <div class="ph-card-meta">
              <span class="ph-meta-item"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> ${duration}</span>
              <span class="ph-meta-item"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="6" y="2" width="12" height="8" rx="1"/><rect x="2" y="14" width="20" height="8" rx="1"/><line x1="6" y1="18" x2="6" y2="18.01"/></svg> ${esc(pName)}</span>
            </div>
            <div class="ph-card-bottom">
              <span class="ph-card-date">${plateLabel ? plateLabel + '  ' : ''}${dateShort}</span>
              <span class="ph-card-status" style="color:${statusColor(row.status)}">${statusLabel(row.status)}</span>
            </div>
          </div>
        </div>`;
      }
      h += '</div>';
      const exportUrl = _activePrinter === 'all' ? '/api/history/export' : `/api/history/export?printer_id=${_activePrinter}`;
      h += `<div class="history-export"><a href="${exportUrl}" class="form-btn form-btn-sm form-btn-secondary" data-ripple download>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
        ${t('stats.download_csv')}</a></div>`;
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
        const swatches = [...d.colors].map(c => `<span class="color-dot" style="background:#${c}"></span>`).join('');
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
      let h = `<div class="card-title">Printtidslinje</div>`;
      h += `<div class="timeline-chart">`;
      for (const [day, d] of days) {
        const pct = (d.count / maxCount) * 100;
        const dateLabel = day.substring(5);
        const successRate = d.count > 0 ? Math.round(d.success / d.count * 100) : 0;
        const color = successRate === 100 ? 'var(--accent-green)' : successRate >= 50 ? 'var(--accent-orange, #f0883e)' : 'var(--accent-red)';
        h += `<div class="timeline-bar" title="${day}: ${d.count} prints, ${formatDuration(d.time)}">
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
    const displayName = cloud?.designTitle || fname;
    const pName = printerName(row.printer_id);
    const speed = speedLabel(row.speed_level);
    const filWeight = row.filament_used_g ? (cloud?.weight || row.filament_used_g) + 'g' : '--';
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
              <span class="ph-detail-value">${filColorHex ? `<span class="color-dot" style="background:${filColorHex}"></span> ` : ''}${esc(filType)}</span>
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
          <div class="ph-detail-footer-fields">
            <div class="ph-detail-field ph-detail-field-wide">
              <span class="ph-detail-label">${t('history.filename')}</span>
              <span class="ph-detail-value ph-detail-mono">${esc(row.filename) || '--'}</span>
            </div>
            ${row.notes ? `<div class="ph-detail-field ph-detail-field-wide">
              <span class="ph-detail-label">${t('maintenance.notes')}</span>
              <span class="ph-detail-value">${esc(row.notes)}</span>
            </div>` : ''}
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
        panel.innerHTML = `<p class="text-muted">${t('history.no_records')}</p>`;
        return;
      }

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
        // Merge new modules
        const allModules = cfg.modules;
        const mergedOrder = [...order];
        for (const mod of allModules) {
          if (!mergedOrder.includes(mod)) mergedOrder.push(mod);
        }

        html += `<div class="tab-panel history-tab-panel stats-tab-panel stagger-in ${tabId === _activeTab ? 'active' : ''}" id="history-tab-${tabId}" style="display:${tabId === _activeTab ? 'grid' : 'none'}">`;
        let _si = 0;
        for (const modId of mergedOrder) {
          const builder = BUILDERS[modId];
          if (!builder) continue;
          const content = builder(filteredData);
          if (!content) continue;
          const draggable = _locked ? '' : 'draggable="true"';
          const unlocked = _locked ? '' : ' stats-module-unlocked';
          const size = MODULE_SIZE[modId] || 'full';
          const isFull = size === 'full';
          html += `<div class="stats-module${unlocked}${isFull ? ' stats-module-full' : ''}" data-module-id="${modId}" ${draggable} style="--i:${_si++};">`;
          if (!_locked) html += '<div class="stats-module-handle" title="Drag to reorder">&#x2630;</div>';
          html += content;
          html += '</div>';
        }
        html += '</div>';
      }

      html += '</div>';
      panel.innerHTML = html;

      for (const tabId of Object.keys(TAB_CONFIG)) {
        const cont = document.getElementById(`history-tab-${tabId}`);
        if (cont) initModuleDrag(cont, tabId);
      }
    } catch (e) {
      panel.innerHTML = `<p class="text-muted">${t('history.load_failed')}</p>`;
    }
  }

  // ═══ Global API ═══
  window.loadHistoryPanel = loadHistory;
  window.switchHistoryTab = switchTab;
  window.showHistoryDetail = showDetail;
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
    document.querySelectorAll('.ph-card').forEach(card => {
      card.style.display = (status === 'all' || card.dataset.status === status) ? '' : 'none';
    });
  };

})();
