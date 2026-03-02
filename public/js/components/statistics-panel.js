// Statistics Panel — Modular with Tabs and Drag-and-Drop
(function() {
  // ═══ Helpers ═══
  function fmtDur(sec) { if (!sec) return '--'; const h = Math.floor(sec/3600), m = Math.floor((sec%3600)/60); return h > 0 ? `${h}${t('time.h')} ${m}${t('time.m')}` : `${m}${t('time.m')}`; }
  function fmtW(g) { if (!g) return '0g'; return g >= 1000 ? `${(g/1000).toFixed(1)} kg` : `${Math.round(g)}g`; }
  function fmtDate(iso) { if (!iso) return '--'; const l = (window.i18n?.getLocale()||'nb').replace('_','-'); return new Date(iso).toLocaleDateString(l,{day:'2-digit',month:'short',year:'numeric'}); }
  function rateClr(r) { return r >= 80 ? 'var(--accent-green)' : r >= 50 ? 'var(--accent-orange)' : 'var(--accent-red)'; }
  function sRow(lbl, val, clr) { return `<div class="stats-detail-item"><span class="stats-detail-item-label">${lbl}</span><span class="stats-detail-item-value"${clr?` style="color:${clr}"` : ''}>${val}</span></div>`; }
  function barRow(lbl, pct, clr, val) { return `<div class="chart-bar-row"><span class="chart-bar-label">${lbl}</span><div class="chart-bar-track"><div class="chart-bar-fill" style="width:${pct}%;background:${clr}"></div></div><span class="chart-bar-value">${val}</span></div>`; }

  const TYPE_COLORS = { 'PLA':'#00e676','PETG':'#f0883e','TPU':'#9b4dff','ABS':'#ff5252','ASA':'#1279ff','PA':'#e3b341','PLA+':'#00c853','PA-CF':'#d2a8ff','PET-CF':'#f778ba','PLA-CF':'#79c0ff','PC':'#8b949e' };
  const SPEED_MAP = { 1:'speed.silent', 2:'speed.standard', 3:'speed.sport', 4:'speed.ludicrous' };
  const DAYS = ['stats.sun','stats.mon','stats.tue','stats.wed','stats.thu','stats.fri','stats.sat'];

  // ═══ Tab config ═══
  const TAB_CONFIG = {
    overview:  { label: 'stats.tab_overview',  modules: ['hero-stats','overview','weekly-trends','monthly-trends'] },
    filament:  { label: 'stats.tab_filament',  modules: ['filament-by-type','success-by-filament','success-by-speed','filament-by-brand','top-files'] },
    activity:  { label: 'stats.tab_activity',  modules: ['day-heatmap','hour-heatmap','avg-time-by-day'] },
    hardware:  { label: 'stats.tab_hardware',  modules: ['temp-records','nozzle-usage','ams-stats','xcam-stats'] }
  };

  const MODULE_SIZE = {
    'hero-stats': 'full',
    'overview': 'half', 'weekly-trends': 'half',
    'monthly-trends': 'full',
    'filament-by-type': 'half', 'success-by-filament': 'half',
    'success-by-speed': 'half', 'filament-by-brand': 'half',
    'top-files': 'full',
    'day-heatmap': 'half', 'hour-heatmap': 'full', 'avg-time-by-day': 'half',
    'temp-records': 'half', 'nozzle-usage': 'half',
    'ams-stats': 'half', 'xcam-stats': 'half'
  };

  const STORAGE_PREFIX = 'stats-module-order-';
  const LOCK_KEY = 'stats-layout-locked';

  let _printer = null;
  let _activeTab = 'overview';
  let _locked = localStorage.getItem(LOCK_KEY) !== '0';
  let _data = null;
  let _xcam = null;
  let _draggedMod = null;

  // ═══ Module builders ═══
  const BUILDERS = {
    'hero-stats': (s) => {
      return `<div class="stats-hero-grid">
        <div class="stats-hero-card">
          <div class="stats-hero-icon"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="6" y="2" width="12" height="8" rx="1"/><rect x="2" y="14" width="20" height="8" rx="1"/><line x1="6" y1="18" x2="6" y2="18.01"/></svg></div>
          <div class="stats-hero-value">${s.total_prints}</div>
          <div class="stats-hero-label">${t('stats.total_prints')}</div>
        </div>
        <div class="stats-hero-card stats-hero-success">
          <div class="stats-hero-icon"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg></div>
          <div class="stats-hero-value">${s.success_rate}%</div>
          <div class="stats-hero-label">${t('stats.success_rate')}</div>
        </div>
        <div class="stats-hero-card">
          <div class="stats-hero-icon"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg></div>
          <div class="stats-hero-value">${s.total_hours}${t('time.h')}</div>
          <div class="stats-hero-label">${t('stats.total_time')}</div>
        </div>
        <div class="stats-hero-card">
          <div class="stats-hero-icon"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/></svg></div>
          <div class="stats-hero-value">${fmtW(s.total_filament_g)}</div>
          <div class="stats-hero-label">${t('stats.filament_used')}</div>
        </div>
        <div class="stats-hero-card">
          <div class="stats-hero-icon"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg></div>
          <div class="stats-hero-value" style="color:var(--accent-purple)">${(s.total_layers||0).toLocaleString()}</div>
          <div class="stats-hero-label">${t('stats.total_layers')}</div>
        </div>
        <div class="stats-hero-card">
          <div class="stats-hero-icon"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg></div>
          <div class="stats-hero-value">${s.estimated_cost_nok > 0 ? s.estimated_cost_nok+' '+t('stats.currency') : '--'}</div>
          <div class="stats-hero-label">${t('stats.estimated_cost')}</div>
        </div>
      </div>`;
    },

    'overview': (s) => {
      const tp = s.total_prints || 1;
      let h = `<div class="card-title">${t('stats.overview')}</div>`;
      h += `<div class="stats-status-bar">
        <div class="stats-status-seg" style="width:${Math.round(s.completed_prints/tp*100)}%;background:var(--accent-green)" title="${t('stats.completed')} ${s.completed_prints}"></div>
        <div class="stats-status-seg" style="width:${Math.round(s.failed_prints/tp*100)}%;background:var(--accent-red)" title="${t('stats.failed')} ${s.failed_prints}"></div>
        <div class="stats-status-seg" style="width:${Math.round(s.cancelled_prints/tp*100)}%;background:var(--accent-orange)" title="${t('stats.cancelled')} ${s.cancelled_prints}"></div>
      </div>
      <div class="stats-status-legend">
        <span><span class="legend-dot" style="background:var(--accent-green)"></span>${t('stats.completed')} ${s.completed_prints}</span>
        <span><span class="legend-dot" style="background:var(--accent-red)"></span>${t('stats.failed')} ${s.failed_prints}</span>
        <span><span class="legend-dot" style="background:var(--accent-orange)"></span>${t('stats.cancelled')} ${s.cancelled_prints}</span>
      </div>`;
      h += '<div class="stats-detail-list">';
      h += sRow(t('stats.avg_duration'), `${s.avg_print_minutes}${t('time.m')}`);
      h += sRow(t('stats.avg_filament'), fmtW(s.avg_filament_per_print_g));
      if (s.most_used_filament) h += sRow(t('stats.most_used_filament'), s.most_used_filament);
      if (s.longest_print) h += sRow(t('stats.longest_print'), `${s.longest_print.filename} (${fmtDur(s.longest_print.duration_seconds)})`);
      if (s.total_waste_g > 0) h += sRow(t('stats.total_waste'), fmtW(s.total_waste_g), 'var(--accent-orange)');
      if (s.total_color_changes > 0) h += sRow(t('stats.color_changes'), s.total_color_changes);
      h += '</div>';
      if (s.current_streak > 0 || s.best_streak > 0) {
        h += `<div class="stats-streak-row">
          <div class="stats-streak"><span class="stats-streak-val" style="color:var(--accent-green)">${s.current_streak}</span><span class="stats-streak-label">${t('stats.current_streak')}</span></div>
          <div class="stats-streak"><span class="stats-streak-val" style="color:var(--accent-yellow)">${s.best_streak}</span><span class="stats-streak-label">${t('stats.best_streak')}</span></div>
        </div>`;
      }
      if (s.first_print) h += `<div class="text-muted" style="font-size:0.65rem;margin-top:8px;text-align:center">${fmtDate(s.first_print)} — ${fmtDate(s.last_print)}</div>`;
      return h;
    },

    'weekly-trends': (s) => {
      if (!s.prints_per_week?.length) return '';
      const mx = Math.max(...s.prints_per_week.map(w => w.total));
      let h = `<div class="card-title">${t('stats.prints_per_week')}</div><div class="week-chart">`;
      for (const w of s.prints_per_week) {
        const th = mx > 0 ? (w.total/mx)*100 : 0;
        const ch = mx > 0 ? (w.completed/mx)*100 : 0;
        const lbl = w.week.split('-W')[1] ? `W${w.week.split('-W')[1]}` : w.week;
        h += `<div class="week-bar-group"><div class="week-bar-stack" style="height:70px"><div class="week-bar-bg" style="height:${th}%"></div><div class="week-bar-fg" style="height:${ch}%"></div></div><div class="week-bar-label">${lbl}</div><div class="week-bar-count">${w.total}</div></div>`;
      }
      h += '</div>';
      h += `<div class="chart-legend mt-sm"><span class="legend-item"><span class="legend-dot" style="background:var(--accent-green)"></span>${t('stats.completed')}</span><span class="legend-item"><span class="legend-dot" style="background:var(--bg-tertiary)"></span>${t('stats.total')}</span></div>`;
      return h;
    },

    'monthly-trends': (s) => {
      if (!s.monthly_trends?.length) return '';
      const mx = Math.max(...s.monthly_trends.map(m => m.total));
      let h = `<div class="card-title">${t('stats.monthly_trends')}</div><div class="week-chart">`;
      for (const m of s.monthly_trends) {
        const th = mx > 0 ? (m.total/mx)*100 : 0;
        const ch = mx > 0 ? (m.completed/mx)*100 : 0;
        h += `<div class="week-bar-group"><div class="week-bar-stack" style="height:60px"><div class="week-bar-bg" style="height:${th}%"></div><div class="week-bar-fg" style="height:${ch}%"></div></div><div class="week-bar-label">${m.month.split('-')[1]}</div><div class="week-bar-count">${m.total}</div></div>`;
      }
      h += '</div>';
      const hrs = s.monthly_trends.reduce((a,m) => a+(m.total_seconds||0),0)/3600;
      const fil = s.monthly_trends.reduce((a,m) => a+(m.total_filament_g||0),0);
      h += '<div class="stats-detail-list mt-sm" style="border-top:1px solid rgba(255,255,255,0.04);padding-top:8px">';
      h += sRow(t('stats.period_hours'), `${Math.round(hrs*10)/10}${t('time.h')}`);
      h += sRow(t('stats.period_filament'), fmtW(fil));
      h += '</div>';
      return h;
    },

    'filament-by-type': (s) => {
      if (!s.filament_by_type?.length) return '';
      const mg = Math.max(...s.filament_by_type.map(f => f.grams));
      let h = `<div class="card-title">${t('stats.filament_by_type')}</div><div class="chart-bars">`;
      for (const f of s.filament_by_type) {
        const pct = mg > 0 ? (f.grams/mg)*100 : 0;
        h += barRow(f.type, pct, TYPE_COLORS[f.type]||theme.getCSSVar('--text-muted'), `${fmtW(f.grams)} (${f.prints})`);
      }
      h += '</div>';
      return h;
    },

    'success-by-filament': (s) => {
      if (!s.success_by_filament?.length) return '';
      let h = `<div class="card-title">${t('stats.success_by_filament')}</div><div class="chart-bars">`;
      for (const f of s.success_by_filament) h += barRow(f.type, f.rate, rateClr(f.rate), `${f.rate}% (${f.completed}/${f.total})`);
      h += '</div>';
      return h;
    },

    'success-by-speed': (s) => {
      if (!s.success_by_speed?.length) return '';
      let h = `<div class="card-title">${t('stats.success_by_speed')}</div><div class="chart-bars">`;
      for (const sp of s.success_by_speed) h += barRow(t(SPEED_MAP[sp.level]||'speed.standard'), sp.rate, rateClr(sp.rate), `${sp.rate}% (${sp.completed}/${sp.total})`);
      h += '</div>';
      return h;
    },

    'filament-by-brand': (s) => {
      if (!s.filament_by_brand?.length) return '';
      let h = `<div class="card-title">${t('stats.filament_by_brand')}</div>`;
      h += `<table class="data-table"><thead><tr><th>${t('filament.brand')}</th><th>${t('filament.type')}</th><th>${t('stats.filament_used')}</th><th>#</th></tr></thead><tbody>`;
      for (const b of s.filament_by_brand.slice(0,8)) h += `<tr><td>${b.brand}</td><td>${b.type||'--'}</td><td>${fmtW(b.grams)}</td><td>${b.prints}</td></tr>`;
      h += '</tbody></table>';
      return h;
    },

    'top-files': (s) => {
      if (!s.top_files?.length) return '';
      let h = `<div class="card-title">${t('stats.top_files')}</div>`;
      h += `<table class="data-table"><thead><tr><th>#</th><th>${t('history.filename')}</th><th>${t('stats.total')}</th><th>%</th></tr></thead><tbody>`;
      s.top_files.forEach((f,i) => {
        const rate = f.count > 0 ? Math.round((f.completed/f.count)*100) : 0;
        h += `<tr><td>${i+1}</td><td>${f.filename}</td><td>${f.count}</td><td style="color:${rateClr(rate)}">${rate}%</td></tr>`;
      });
      h += '</tbody></table>';
      return h;
    },

    'day-heatmap': (s) => {
      if (!s.prints_by_day_of_week?.length) return '';
      const mx = Math.max(...s.prints_by_day_of_week.map(d => d.count));
      let h = `<div class="card-title">${t('stats.prints_by_day')}</div><div class="heatmap-row">`;
      for (let d = 0; d < 7; d++) {
        const c = s.prints_by_day_of_week.find(x => x.dow === d)?.count || 0;
        const i = mx > 0 ? c/mx : 0;
        h += `<div class="heatmap-cell" style="background:rgba(0,230,118,${0.1+i*0.7})"><span class="heatmap-day">${t(DAYS[d])}</span><span class="heatmap-count">${c}</span></div>`;
      }
      h += '</div>';
      return h;
    },

    'hour-heatmap': (s) => {
      if (!s.prints_by_hour?.length) return '';
      const mx = Math.max(...s.prints_by_hour.map(h => h.count));
      let h = `<div class="card-title">${t('stats.prints_by_hour')}</div><div class="stats-hour-grid">`;
      for (let hr = 0; hr < 24; hr++) {
        const c = s.prints_by_hour.find(x => x.hour === hr)?.count || 0;
        const i = mx > 0 ? c/mx : 0;
        h += `<div class="stats-hour-cell" style="background:rgba(188,140,255,${0.08+i*0.72})"><span class="stats-hour-label">${String(hr).padStart(2,'0')}</span><span class="stats-hour-count">${c}</span></div>`;
      }
      h += '</div>';
      return h;
    },

    'avg-time-by-day': (s) => {
      if (!s.avg_duration_by_day?.length) return '';
      const mx = Math.max(...s.avg_duration_by_day.map(d => d.avg_minutes || 0));
      let h = `<div class="card-title">${t('stats.avg_time_by_day')}</div><div class="heatmap-row">`;
      for (let d = 0; d < 7; d++) {
        const mins = s.avg_duration_by_day.find(x => x.dow === d)?.avg_minutes || 0;
        const i = mx > 0 ? mins/mx : 0;
        h += `<div class="heatmap-cell" style="background:rgba(88,166,255,${0.1+i*0.7})"><span class="heatmap-day">${t(DAYS[d])}</span><span class="heatmap-count">${mins}${t('time.m')}</span></div>`;
      }
      h += '</div>';
      return h;
    },

    'temp-records': (s) => {
      if (!s.temp_stats || (s.temp_stats.peak_nozzle <= 0 && s.temp_stats.peak_bed <= 0)) return '';
      let h = `<div class="card-title">${t('stats.temperature_records')}</div><div class="stats-detail-list">`;
      h += sRow(t('stats.peak_nozzle'), `${Math.round(s.temp_stats.peak_nozzle)}°C`, '#ff5252');
      h += sRow(t('stats.avg_nozzle'), `${Math.round(s.temp_stats.avg_nozzle)}°C`, '#ff5252');
      h += sRow(t('stats.peak_bed'), `${Math.round(s.temp_stats.peak_bed)}°C`, '#1279ff');
      h += sRow(t('stats.avg_bed'), `${Math.round(s.temp_stats.avg_bed)}°C`, '#1279ff');
      h += '</div>';
      return h;
    },

    'nozzle-usage': (s) => {
      if (!s.nozzle_breakdown?.length) return '';
      const mx = Math.max(...s.nozzle_breakdown.map(n => n.prints));
      let h = `<div class="card-title">${t('stats.nozzle_usage')}</div><div class="chart-bars">`;
      for (const n of s.nozzle_breakdown) {
        const pct = mx > 0 ? (n.prints/mx)*100 : 0;
        h += barRow(`${n.type||'Standard'} ${n.diameter||'0.4'}mm`, pct, 'var(--accent-blue)', `${n.prints} (${n.rate}%)`);
      }
      h += '</div>';
      return h;
    },

    'ams-stats': (s) => {
      if (!s.ams_filament_by_brand?.length && !s.ams_avg_humidity?.length) return '';
      let h = `<div class="card-title">${t('stats.ams_stats')}</div>`;
      if (s.ams_avg_humidity?.length) {
        h += '<div class="stats-detail-list">';
        for (const a of s.ams_avg_humidity) h += sRow(`AMS${parseInt(a.ams_unit)+1} ${t('stats.ams_humidity_avg')}`, `${a.avg_humidity}%`);
        h += '</div>';
      }
      if (s.ams_filament_by_brand?.length) {
        h += `<table class="data-table mt-sm"><thead><tr><th>${t('filament.brand')}</th><th>${t('filament.type')}</th><th>#</th></tr></thead><tbody>`;
        for (const b of s.ams_filament_by_brand) h += `<tr><td>${b.brand}</td><td>${b.type||'--'}</td><td>${b.snapshots}</td></tr>`;
        h += '</tbody></table>';
      }
      return h;
    },

    'xcam-stats': (s, xcam) => {
      if (!xcam || (!xcam.spaghetti_detected && !xcam.first_layer_issue && !xcam.foreign_object && !xcam.nozzle_clump)) return '';
      return `<div class="card-title">${t('stats.xcam_title')}</div>
        <div class="xcam-grid">
          <div class="xcam-card"><div class="xcam-count">${xcam.spaghetti_detected||0}</div><div class="xcam-label">${t('stats.xcam_spaghetti')}</div></div>
          <div class="xcam-card"><div class="xcam-count">${xcam.first_layer_issue||0}</div><div class="xcam-label">${t('stats.xcam_first_layer')}</div></div>
          <div class="xcam-card"><div class="xcam-count">${xcam.foreign_object||0}</div><div class="xcam-label">${t('stats.xcam_foreign')}</div></div>
          <div class="xcam-card"><div class="xcam-count">${xcam.nozzle_clump||0}</div><div class="xcam-label">${t('stats.xcam_clump')}</div></div>
        </div>`;
    }
  };

  // ═══ Persistence ═══
  function getOrder(tabId) {
    const defaults = TAB_CONFIG[tabId].modules;
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_PREFIX + tabId));
      if (saved && Array.isArray(saved)) {
        const known = new Set(defaults);
        const result = saved.filter(id => known.has(id));
        for (const id of defaults) { if (!result.includes(id)) result.push(id); }
        return result;
      }
    } catch (_) {}
    return [...defaults];
  }

  function saveOrder(tabId) {
    const container = document.getElementById(`stats-tab-${tabId}`);
    if (!container) return;
    const ids = [...container.querySelectorAll('.stats-module')].map(el => el.dataset.moduleId);
    localStorage.setItem(STORAGE_PREFIX + tabId, JSON.stringify(ids));
  }

  // ═══ Tab switching ═══
  function switchTab(tabId) {
    _activeTab = tabId;
    document.querySelectorAll('.stats-tab-btn').forEach(b => b.classList.toggle('active', b.dataset.tab === tabId));
    document.querySelectorAll('.stats-tab-panel').forEach(p => {
      const isActive = p.id === `stats-tab-${tabId}`;
      p.classList.toggle('active', isActive);
      p.style.display = isActive ? 'grid' : 'none';
      if (isActive) {
        p.classList.add('ix-tab-panel');
        p.addEventListener('animationend', () => p.classList.remove('ix-tab-panel'), { once: true });
      }
    });
    const slug = tabId === 'overview' ? 'stats' : `stats/${tabId}`;
    if (location.hash !== '#' + slug) history.replaceState(null, '', '#' + slug);
  }

  // ═══ Drag & Drop ═══
  function initDrag(container, tabId) {
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
      if (_draggedMod) saveOrder(tabId);
    });
    container.addEventListener('dragend', () => {
      if (_draggedMod) {
        _draggedMod.classList.remove('stats-module-dragging');
        _draggedMod = null;
      }
    });
  }

  // ═══ Main render ═══
  async function loadStatistics() {
    const panel = document.getElementById('overlay-panel-body');
    if (!panel) return;

    // Read sub-slug from hash (e.g. #stats/filament → filament)
    const hashParts = location.hash.replace('#', '').split('/');
    if (hashParts[0] === 'stats' && hashParts[1] && TAB_CONFIG[hashParts[1]]) {
      _activeTab = hashParts[1];
    }

    try {
      const params = _printer ? `?printer_id=${_printer}` : '';
      const [statsRes, xcamRes] = await Promise.all([
        fetch(`/api/statistics${params}`),
        fetch(`/api/xcam/stats${params}`).catch(() => null)
      ]);
      _data = await statsRes.json();
      try { _xcam = xcamRes ? await xcamRes.json() : null; } catch (_) { _xcam = null; }

      let html = '<div class="stats-layout">';

      // Printer selector
      html += buildPrinterSelector('changeStatsPrinter', _printer);

      // Toolbar
      const lockIcon = _locked
        ? '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>'
        : '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 019.9-1"/></svg>';
      html += `<div class="stats-toolbar">
        <button class="speed-btn ${_locked ? '' : 'active'}" onclick="toggleStatsLock()" title="${_locked ? t('stats.layout_locked') : t('stats.layout_unlocked')}">
          ${lockIcon} <span>${_locked ? t('stats.layout_locked') : t('stats.layout_unlocked')}</span>
        </button>
        <button class="form-btn form-btn-sm" data-ripple onclick="exportCsv()">${t('stats.download_csv')}</button>
      </div>`;

      // Tab bar
      html += '<div class="tabs">';
      for (const [id, cfg] of Object.entries(TAB_CONFIG)) {
        html += `<button class="tab-btn stats-tab-btn ${id === _activeTab ? 'active' : ''}" data-tab="${id}" onclick="switchStatsTab('${id}')">${t(cfg.label)}</button>`;
      }
      html += '</div>';

      // Tab panels — render as grid
      for (const [tabId, cfg] of Object.entries(TAB_CONFIG)) {
        const order = getOrder(tabId);
        const isActive = tabId === _activeTab;
        html += `<div class="tab-panel stats-tab-panel stagger-in ${isActive ? 'active' : ''}" id="stats-tab-${tabId}" style="display:${isActive ? 'grid' : 'none'}">`;
        let _si = 0;
        for (const modId of order) {
          const builder = BUILDERS[modId];
          if (!builder) continue;
          const content = builder(_data, _xcam);
          if (!content) continue;
          const draggable = _locked ? '' : 'draggable="true"';
          const unlocked = _locked ? '' : ' stats-module-unlocked';
          const size = MODULE_SIZE[modId] || 'half';
          const span = size === 'full' ? ' stats-module-full' : '';
          html += `<div class="stats-module${unlocked}${span}" data-module-id="${modId}" ${draggable} style="--i:${_si++}">`;
          if (!_locked) html += '<div class="stats-module-handle" title="Drag to reorder">&#x2630;</div>';
          html += content;
          html += '</div>';
        }
        html += '</div>';
      }

      html += '</div>'; // close .stats-layout
      panel.innerHTML = html;

      // Attach DnD
      for (const tabId of Object.keys(TAB_CONFIG)) {
        const cont = document.getElementById(`stats-tab-${tabId}`);
        if (cont) initDrag(cont, tabId);
      }
    } catch (e) {
      panel.innerHTML = `<p class="text-muted">${t('stats.load_failed')}</p>`;
    }
  }

  // ═══ Global API ═══
  window.loadStatsPanel = loadStatistics;
  window.changeStatsPrinter = function(v) { _printer = v || null; loadStatistics(); };
  window.switchStatsTab = switchTab;
  window.toggleStatsLock = function() {
    _locked = !_locked;
    localStorage.setItem(LOCK_KEY, _locked ? '1' : '0');
    loadStatistics();
  };
  window.exportCsv = function() {
    window.open(`/api/history/export${_printer ? '?printer_id='+_printer : ''}`);
  };
})();
