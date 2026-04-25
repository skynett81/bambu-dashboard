// Statistics Panel — Modular with Tabs and Drag-and-Drop
(function() {
  // ═══ Helpers ═══
  function fmtDur(sec) { if (!sec) return '--'; const h = Math.floor(sec/3600), m = Math.floor((sec%3600)/60); return h > 0 ? `${h}${t('time.h')} ${m}${t('time.m')}` : `${m}${t('time.m')}`; }
  function fmtW(g) { if (!g) return '0g'; return g >= 1000 ? `${(g/1000).toFixed(1)} kg` : `${Math.round(g)}g`; }
  function fmtDate(iso) { if (!iso) return '--'; const l = (window.i18n?.getLocale()||'nb').replace('_','-'); return new Date(iso).toLocaleDateString(l,{day:'2-digit',month:'short',year:'numeric'}); }
  function rateClr(r) { return r >= 80 ? 'var(--accent-green)' : r >= 50 ? 'var(--accent-orange)' : 'var(--accent-red)'; }
  function sRow(lbl, val, clr) { return `<div class="stats-detail-item"><span class="stats-detail-item-label">${lbl}</span><span class="stats-detail-item-value"${clr?` style="color:${clr}"` : ''}>${val}</span></div>`; }
  function barRow(lbl, pct, clr, val) { return `<div class="chart-bar-row"><span class="chart-bar-label">${lbl}</span><div class="chart-bar-track"><div class="chart-bar-fill" style="width:${pct}%;background:${clr}"></div></div><span class="chart-bar-value">${val}</span></div>`; }
  function formatCurrency(val, currency) {
    if (val === null || val === undefined) return '--';
    if (currency && typeof window.currency !== 'undefined') return window.currency.format(Number(val), currency);
    if (typeof window.formatCurrency === 'function') return window.formatCurrency(Number(val));
    return Number(val).toFixed(2);
  }

  const TYPE_COLORS = { 'PLA':'#00e676','PETG':'#f0883e','TPU':'#9b4dff','ABS':'#ff5252','ASA':'#1279ff','PA':'#e3b341','PLA+':'#00c853','PA-CF':'#d2a8ff','PET-CF':'#f778ba','PLA-CF':'#79c0ff','PC':'#8b949e' };
  const SPEED_MAP = { 1:'speed.silent', 2:'speed.standard', 3:'speed.sport', 4:'speed.ludicrous' };
  const DAYS = ['stats.sun','stats.mon','stats.tue','stats.wed','stats.thu','stats.fri','stats.sat'];

  // ═══ Tab config (alphabetically sorted by translated label, overview first) ═══
  const TAB_CONFIG_UNSORTED = {
    overview:    { label: 'stats.tab_overview',    modules: ['hero-stats','overview','weekly-trends','monthly-trends'], order: 0 },
    filament:    { label: 'stats.tab_filament',    modules: ['filament-by-type','success-by-filament','success-by-speed','filament-by-brand','top-files'] },
    activity:    { label: 'stats.tab_activity',    modules: ['day-heatmap','hour-heatmap','avg-time-by-day'] },
    hardware:    { label: 'stats.tab_hardware',    modules: ['temp-records','nozzle-usage','ams-stats','xcam-stats','maintenance-overview','nozzle-health','build-plate-stats','firmware-info'] },
    cost:        { label: 'stats.tab_cost',        modules: ['cost-hero','cost-breakdown','cost-trends','cost-by-printer','cost-by-material'] },
    printstats:  { label: 'stats.tab_printstats',  modules: ['ps-hero','ps-status-activity','ps-duration-temp','ps-filament-breakdown','ps-nozzle-models','ps-print-timeline'] }
  };
  function _getSortedTabs() {
    const entries = Object.entries(TAB_CONFIG_UNSORTED);
    return entries.sort((a, b) => {
      if (a[1].order === 0) return -1;
      if (b[1].order === 0) return 1;
      const la = t(a[1].label) || a[0];
      const lb = t(b[1].label) || b[0];
      return la.localeCompare(lb);
    });
  }
  const TAB_CONFIG = TAB_CONFIG_UNSORTED;

  const MODULE_SIZE = {
    'hero-stats': 'full',
    'overview': 'half', 'weekly-trends': 'half',
    'monthly-trends': 'full',
    'filament-by-type': 'half', 'success-by-filament': 'half',
    'success-by-speed': 'half', 'filament-by-brand': 'half',
    'top-files': 'full',
    'day-heatmap': 'half', 'hour-heatmap': 'full', 'avg-time-by-day': 'half',
    'temp-records': 'half', 'nozzle-usage': 'half',
    'ams-stats': 'half', 'xcam-stats': 'half',
    'maintenance-overview': 'full', 'nozzle-health': 'half', 'build-plate-stats': 'half', 'firmware-info': 'half',
    'cost-hero': 'full', 'cost-breakdown': 'half', 'cost-trends': 'half',
    'cost-by-printer': 'half', 'cost-by-material': 'half',
    'ps-hero': 'full', 'ps-status-activity': 'half', 'ps-duration-temp': 'half',
    'ps-filament-breakdown': 'full', 'ps-nozzle-models': 'full', 'ps-print-timeline': 'full'
  };

  let _printer = window.printerState?.getActivePrinterId?.() || null;
  let _activeTab = 'overview';
  let _data = null;
  let _xcam = null;
  let _costData = null;
  let _hwData = null;
  let _histData = null;
  let _dateFrom = null;
  let _dateTo = null;
  // ═══ Print stats helpers ═══
  function _printerName(id) { return window.printerState?._printerMeta?.[id]?.name || id || '--'; }
  function _fmtDurLong(sec) { if (!sec) return '--'; const h=Math.floor(sec/3600), m=Math.floor((sec%3600)/60), s=sec%60; if (h>0) return `${h}${t('time.h')} ${m}${t('time.m')}`; if (m>0) return `${m}${t('time.m')} ${s}${t('time.s')}`; return `${s}${t('time.s')}`; }
  function _psGetStats(data) {
    const completed = data.filter(r => r.status === 'completed').length;
    const failed = data.filter(r => r.status === 'failed').length;
    const cancelled = data.filter(r => r.status === 'cancelled').length;
    const totalTime = data.reduce((s, r) => s + (r.duration_seconds || 0), 0);
    const totalFilament = data.reduce((s, r) => s + (r.filament_used_g || 0), 0);
    const totalLayers = data.reduce((s, r) => s + (r.layer_count || 0), 0);
    const successRate = data.length > 0 ? Math.round(completed / data.length * 100) : 0;
    return { completed, failed, cancelled, totalTime, totalFilament, totalLayers, successRate };
  }
  function _miniDonut(segments, size, thickness) {
    size = size || 64; thickness = thickness || 8;
    const r = (size - thickness) / 2, cx = size / 2;
    const total = segments.reduce((s, seg) => s + seg.value, 0);
    if (total === 0) return `<svg width="${size}" height="${size}"><circle cx="${cx}" cy="${cx}" r="${r}" fill="none" stroke="var(--border-color)" stroke-width="${thickness}"/></svg>`;
    let cumAngle = -90, paths = '';
    for (const seg of segments) {
      if (seg.value <= 0) continue;
      const angle = (seg.value / total) * 360;
      const startRad = (cumAngle * Math.PI) / 180, endRad = ((cumAngle + angle) * Math.PI) / 180;
      const x1 = cx + r * Math.cos(startRad), y1 = cx + r * Math.sin(startRad);
      const x2 = cx + r * Math.cos(endRad), y2 = cx + r * Math.sin(endRad);
      const large = angle > 180 ? 1 : 0;
      paths += `<path d="M${x1},${y1} A${r},${r} 0 ${large},1 ${x2},${y2}" fill="none" stroke="${seg.color}" stroke-width="${thickness}" stroke-linecap="round"/>`;
      cumAngle += angle;
    }
    return `<svg width="${size}" height="${size}">${paths}</svg>`;
  }

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
          <div class="stats-hero-value">${s.estimated_cost_nok > 0 ? formatCurrency(s.estimated_cost_nok, 0) : '--'}</div>
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
      if (s.temp_stats.peak_chamber > 0) {
        h += sRow(t('stats.peak_chamber'), `${Math.round(s.temp_stats.peak_chamber)}°C`, '#e3b341');
        h += sRow(t('stats.avg_chamber'), `${Math.round(s.temp_stats.avg_chamber)}°C`, '#e3b341');
      }
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
    },

    // ═══ Hardware extended modules ═══
    'maintenance-overview': (s, x, c, hw) => {
      if (!hw?.maintenance?.length) return '';
      const pNames = window._printerNames || {};
      const showPrinter = !window._statsPanel_printer;
      let h = `<div class="card-title">${t('stats.hw_maintenance')}</div><div class="hw-maint-list">`;
      for (const m of hw.maintenance) {
        const pct = m.percentage || 0;
        const clr = m.overdue ? 'var(--accent-red)' : pct >= 70 ? 'var(--accent-orange)' : 'var(--accent-green)';
        const label = showPrinter ? `${pNames[m.printer_id] || m.printer_id} — ${m.label}` : m.label;
        const hrs = `${m.hours_since_maintenance}/${m.interval_hours}${t('time.h')}`;
        h += `<div class="hw-maint-row">
          <span class="hw-maint-label">${label}</span>
          <div class="hw-maint-bar-track"><div class="hw-maint-bar-fill${m.overdue ? ' overdue' : ''}" style="width:${Math.min(pct, 100)}%;background:${clr}"></div></div>
          <span class="hw-maint-value${m.overdue ? ' overdue' : ''}">${hrs}</span>
        </div>`;
      }
      h += '</div>';
      return h;
    },

    'nozzle-health': (s, x, c, hw) => {
      if (!hw?.active_nozzles?.length) return '';
      const pNames = window._printerNames || {};
      const showPrinter = !window._statsPanel_printer;
      let h = `<div class="card-title">${t('stats.hw_nozzle_health')}</div>`;
      for (const n of hw.active_nozzles) {
        const wear = n.wear;
        const wClr = !wear ? 'var(--text-muted)' : wear.percentage >= 80 ? 'var(--accent-red)' : wear.percentage >= 50 ? 'var(--accent-orange)' : 'var(--accent-green)';
        const wPct = wear ? wear.percentage : 0;
        const pLabel = showPrinter ? `<span class="hw-nozzle-printer">${pNames[n.printer_id] || n.printer_id}</span>` : '';
        h += `<div class="hw-nozzle-card">
          ${pLabel}
          <div class="hw-nozzle-type">${n.type || 'Standard'} ${n.diameter || '0.4'}mm</div>
          <div class="hw-nozzle-wear-track"><div class="hw-nozzle-wear-fill" style="width:${wPct}%;background:${wClr}"></div></div>
          <div class="hw-nozzle-details">
            ${sRow(t('stats.hw_print_hours'), `${n.print_hours}${t('time.h')}`)}
            ${sRow(t('stats.hw_prints'), n.print_count)}
            ${sRow(t('stats.hw_filament_through'), fmtW(n.filament_g))}
            ${n.abrasive_g > 0 ? sRow(t('stats.hw_abrasive'), fmtW(n.abrasive_g), 'var(--accent-orange)') : ''}
            ${sRow(t('stats.hw_wear'), `${wPct}%`, wClr)}
          </div>
        </div>`;
      }
      return h;
    },

    'build-plate-stats': (s, x, c, hw) => {
      if (!hw?.build_plates?.length) return '';
      const pNames = window._printerNames || {};
      const showPrinter = !window._statsPanel_printer;
      const condClr = { good: 'var(--accent-green)', fair: 'var(--accent-orange)', worn: 'var(--accent-red)', new: 'var(--accent-blue)' };
      let h = `<div class="card-title">${t('stats.hw_build_plates')}</div>`;
      const mx = Math.max(...hw.build_plates.map(p => p.print_count || 0), 1);
      h += '<div class="chart-bars">';
      for (const p of hw.build_plates) {
        const pct = mx > 0 ? ((p.print_count || 0) / mx) * 100 : 0;
        const cond = p.surface_condition || 'good';
        const clr = condClr[cond] || 'var(--accent-blue)';
        const label = showPrinter ? `${pNames[p.printer_id] || ''} ${p.name}` : p.name;
        const badge = p.active ? '' : ` <span style="opacity:0.5">(${t('stats.hw_inactive')})</span>`;
        h += barRow(`${label}${badge}`, pct, clr, `${p.print_count || 0} ${t('stats.hw_prints_short')}`);
      }
      h += '</div>';
      if (hw.total_plate_prints > 0) {
        h += `<div class="stats-detail-list" style="margin-top:8px">${sRow(t('stats.hw_total_plate_prints'), hw.total_plate_prints)}</div>`;
      }
      return h;
    },

    'firmware-info': (s, x, c, hw) => {
      if (!hw?.firmware?.length) return '';
      const pNames = window._printerNames || {};
      const showPrinter = !window._statsPanel_printer;
      let h = `<div class="card-title">${t('stats.hw_firmware')}</div>`;
      h += `<table class="data-table"><thead><tr>`;
      if (showPrinter) h += `<th>${t('stats.printer')}</th>`;
      h += `<th>${t('stats.hw_module')}</th><th>${t('stats.hw_version')}</th></tr></thead><tbody>`;
      for (const f of hw.firmware) {
        h += '<tr>';
        if (showPrinter) h += `<td>${pNames[f.printer_id] || f.printer_id}</td>`;
        h += `<td>${f.module}</td><td>${f.sw_ver || '--'}</td></tr>`;
      }
      h += '</tbody></table>';
      return h;
    },

    // ═══ Cost tab modules ═══
    'cost-hero': (s, x, cost) => {
      const hasData = cost?.summary?.grand_total > 0;
      // Always show the recalculate button + setup hints
      let html = '';
      if (!hasData) {
        html += `<div class="stats-card" style="text-align:center;padding:24px">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" stroke-width="1.5" style="margin-bottom:12px"><circle cx="12" cy="12" r="10"/><path d="M12 6v12M8 9h8M8 15h6"/></svg>
          <div style="font-size:1rem;font-weight:600;margin-bottom:8px">${t('stats.cost_no_data')}</div>
          <div style="font-size:0.85rem;color:var(--text-muted);margin-bottom:16px;max-width:500px;margin-left:auto;margin-right:auto">${t('stats.cost_setup_hint')}</div>
          <div style="display:flex;flex-wrap:wrap;gap:8px;justify-content:center;margin-bottom:16px">
            <div class="stats-setup-item"><span class="stats-setup-icon">&#x26A1;</span> ${t('stats.cost_hint_electricity')}</div>
            <div class="stats-setup-item"><span class="stats-setup-icon">&#x1F5A8;</span> ${t('stats.cost_hint_machine')}</div>
            <div class="stats-setup-item"><span class="stats-setup-icon">&#x1F9F5;</span> ${t('stats.cost_hint_spool')}</div>
          </div>
          <button class="form-btn" data-ripple onclick="window._recalcCosts()" id="cost-recalc-btn">${t('stats.cost_recalculate')}</button>
        </div>`;
        return html;
      }
      const c = cost.summary;
      const cur = c.currency || 'NOK';
      html += `<div style="display:flex;align-items:center;justify-content:flex-end;margin-bottom:8px">
        <button class="form-btn form-btn-sm" data-ripple onclick="window._recalcCosts()" title="${t('stats.cost_recalculate')}" style="font-size:0.75rem">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right:4px"><path d="M21.5 2v6h-6"/><path d="M21.34 15.57a10 10 0 11-.57-8.38"/></svg>
          ${t('stats.cost_recalculate')}
        </button>
      </div>`;
      html += `<div class="stats-hero-grid">
        <div class="stats-hero-card">
          <div class="stats-hero-icon"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v12M8 9h8M8 15h6"/></svg></div>
          <div class="stats-hero-value">${c.grand_total.toFixed(2)} ${cur}</div>
          <div class="stats-hero-label">${t('stats.cost_total')}</div>
        </div>
        <div class="stats-hero-card">
          <div class="stats-hero-icon"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v20M2 12h20"/></svg></div>
          <div class="stats-hero-value">${c.avg_per_print.toFixed(2)} ${cur}</div>
          <div class="stats-hero-label">${t('stats.cost_avg')}</div>
        </div>
        <div class="stats-hero-card">
          <div class="stats-hero-icon"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg></div>
          <div class="stats-hero-value">${c.cost_per_hour.toFixed(2)} ${cur}</div>
          <div class="stats-hero-label">${t('stats.cost_per_hour')}</div>
        </div>
        <div class="stats-hero-card">
          <div class="stats-hero-icon"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.38 3.46L16 2 12 4 8 2 3.62 3.46a2 2 0 00-1.34 2.23l.58 3.47"/><path d="M12 22V10"/></svg></div>
          <div class="stats-hero-value">${c.cost_per_kg.toFixed(2)} ${cur}</div>
          <div class="stats-hero-label">${t('stats.cost_per_kg')}</div>
        </div>
      </div>`;
      return html;
    },

    'cost-breakdown': (s, x, cost) => {
      if (!cost || !cost.breakdown) return '';
      const b = cost.breakdown;
      const total = b.filament + b.electricity + b.depreciation + b.labor + b.markup;
      if (total <= 0) return '';
      const cur = cost.summary?.currency || 'NOK';
      const items = [
        { label: t('stats.filament_cost_label'), val: b.filament, clr: 'var(--accent-green)' },
        { label: t('stats.electricity_cost_label'), val: b.electricity, clr: 'var(--accent-orange)' },
        { label: t('stats.depreciation_cost_label'), val: b.depreciation, clr: 'var(--accent-blue)' },
        { label: t('stats.labor_cost_label'), val: b.labor, clr: 'var(--accent-purple, #9b4dff)' },
        { label: t('stats.markup_cost_label'), val: b.markup, clr: 'var(--accent-red)' }
      ].filter(i => i.val > 0);
      let html = `<div class="stats-card"><div class="stats-card-title">${t('stats.cost_breakdown')}</div>`;
      for (const i of items) {
        const pct = Math.round((i.val / total) * 100);
        html += barRow(i.label, pct, i.clr, `${i.val.toFixed(2)} ${cur} (${pct}%)`);
      }
      html += '</div>';
      return html;
    },

    'cost-trends': (s, x, cost) => {
      if (!cost || !cost.by_month || !cost.by_month.length) return '';
      const cur = cost.summary?.currency || 'NOK';
      const maxCost = Math.max(...cost.by_month.map(m => m.total_cost), 1);
      let html = `<div class="stats-card"><div class="stats-card-title">${t('stats.cost_trends')}</div><div class="chart-bars">`;
      for (const m of cost.by_month) {
        const pct = Math.round((m.total_cost / maxCost) * 100);
        const lbl = m.month.substring(2); // "25-01" etc
        html += `<div class="chart-col"><div class="chart-stack" style="height:${pct}%" title="${m.total_cost.toFixed(2)} ${cur} (${m.prints} prints)"><div class="chart-seg" style="height:100%;background:var(--accent-color)"></div></div><span class="chart-x-label">${lbl}</span></div>`;
      }
      html += '</div></div>';
      return html;
    },

    'cost-by-printer': (s, x, cost) => {
      if (!cost || !cost.by_printer || !cost.by_printer.length) return '';
      const cur = cost.summary?.currency || 'NOK';
      const printers = window._printerNames || {};
      let html = `<div class="stats-card"><div class="stats-card-title">${t('stats.cost_by_printer')}</div><table class="stats-table"><thead><tr><th>${t('stats.printer')}</th><th>${t('stats.prints')}</th><th>${t('stats.cost_total')}</th><th>${t('stats.cost_avg')}</th></tr></thead><tbody>`;
      for (const p of cost.by_printer) {
        const name = printers[p.printer_id] || p.printer_id || '--';
        html += `<tr><td>${name}</td><td>${p.prints}</td><td>${p.total_cost.toFixed(2)} ${cur}</td><td>${p.avg_cost.toFixed(2)} ${cur}</td></tr>`;
      }
      html += '</tbody></table></div>';
      return html;
    },

    'cost-by-material': (s, x, cost) => {
      if (!cost || !cost.by_material || !cost.by_material.length) return '';
      const cur = cost.summary?.currency || 'NOK';
      let html = `<div class="stats-card"><div class="stats-card-title">${t('stats.cost_by_material')}</div><table class="stats-table"><thead><tr><th>${t('stats.material')}</th><th>${t('stats.prints')}</th><th>${t('stats.cost_total')}</th><th>${t('filament.weight')}</th><th>${t('stats.cost_per_kg')}</th></tr></thead><tbody>`;
      for (const m of cost.by_material) {
        html += `<tr><td>${m.material}</td><td>${m.prints}</td><td>${m.total_cost.toFixed(2)} ${cur}</td><td>${fmtW(m.total_grams)}</td><td>${m.cost_per_kg.toFixed(2)} ${cur}</td></tr>`;
      }
      html += '</tbody></table></div>';
      return html;
    },

    // ═══ Print Stats modules (from history data) ═══
    'ps-hero': (s, x, c, hw, hist) => {
      if (!hist || !hist.length) return '';
      const ps = _psGetStats(hist);
      const rateColor = ps.successRate >= 90 ? 'var(--accent-green)' : ps.successRate >= 70 ? 'var(--accent-orange)' : 'var(--accent-red)';
      const ratePct = Math.min(ps.successRate, 100);
      return `<div class="waste-hero-grid" style="grid-template-columns:repeat(auto-fit, minmax(110px, 1fr))">
        <div class="waste-hero-card waste-hero-card--blue">
          <div class="waste-hero-top"><div class="waste-hero-icon" style="background:rgba(59,130,246,0.15);color:var(--accent-blue)"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="6" y="2" width="12" height="8" rx="1"/><rect x="2" y="14" width="20" height="8" rx="1"/></svg></div></div>
          <div class="waste-hero-value">${hist.length}</div>
          <div class="waste-hero-label">${t('stats.total_prints')}</div>
        </div>
        <div class="waste-hero-card waste-hero-card--green">
          <div class="waste-hero-top"><div class="waste-hero-icon" style="background:rgba(63,185,80,0.15);color:var(--accent-green)"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg></div></div>
          <div style="position:relative;display:inline-flex;align-items:center;justify-content:center;margin:2px 0">
            <svg width="44" height="44" viewBox="0 0 44 44"><circle cx="22" cy="22" r="18" fill="none" stroke="var(--border-color)" stroke-width="4"/><circle cx="22" cy="22" r="18" fill="none" stroke="${rateColor}" stroke-width="4" stroke-dasharray="${ratePct * 1.131} ${113.1 - ratePct * 1.131}" stroke-dashoffset="28.3" stroke-linecap="round"/></svg>
            <span style="position:absolute;font-size:0.6rem;font-weight:800;color:${rateColor}">${ps.successRate}%</span>
          </div>
          <div class="waste-hero-label">${t('stats.success_rate')}</div>
        </div>
        <div class="waste-hero-card waste-hero-card--cyan">
          <div class="waste-hero-top"><div class="waste-hero-icon" style="background:rgba(6,182,212,0.15);color:var(--accent-cyan)"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg></div></div>
          <div class="waste-hero-value">${_fmtDurLong(ps.totalTime)}</div>
          <div class="waste-hero-label">${t('stats.total_time')}</div>
        </div>
        <div class="waste-hero-card waste-hero-card--orange">
          <div class="waste-hero-top"><div class="waste-hero-icon" style="background:rgba(249,115,22,0.15);color:var(--accent-orange)"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/></svg></div></div>
          <div class="waste-hero-value">${fmtW(ps.totalFilament)}</div>
          <div class="waste-hero-label">${t('stats.filament_used')}</div>
        </div>
        <div class="waste-hero-card waste-hero-card--red">
          <div class="waste-hero-top"><div class="waste-hero-icon" style="background:rgba(248,81,73,0.15);color:var(--accent-red)"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg></div></div>
          <div class="waste-hero-value">${ps.totalLayers.toLocaleString()}</div>
          <div class="waste-hero-label">${t('stats.total_layers')}</div>
        </div>
      </div>`;
    },

    'ps-status-activity': (s, x, c, hw, hist) => {
      if (!hist || !hist.length) return '';
      const ps = _psGetStats(hist);
      const segments = [
        { value: ps.completed, color: 'var(--accent-green)', label: t('history.completed') },
        { value: ps.failed, color: 'var(--accent-red)', label: t('history.failed') },
        { value: ps.cancelled, color: 'var(--accent-orange)', label: t('history.cancelled') }
      ].filter(seg => seg.value > 0);
      let h = `<div class="card-title">${t('history.status_breakdown')}</div>`;
      h += `<div style="display:flex;align-items:center;gap:12px">`;
      h += `<div style="position:relative;flex-shrink:0;display:flex;align-items:center;justify-content:center">`;
      h += _miniDonut(segments, 70, 8);
      h += `<div class="waste-donut-center" style="width:70px;height:70px"><span class="waste-donut-center-value" style="font-size:0.85rem">${hist.length}</span><span class="waste-donut-center-label">prints</span></div>`;
      h += `</div><div style="flex:1;display:flex;flex-direction:column;gap:3px">`;
      for (const seg of segments) {
        const pct = ((seg.value / hist.length) * 100).toFixed(0);
        h += `<div style="display:flex;align-items:center;gap:5px;font-size:0.72rem"><span style="width:8px;height:8px;border-radius:2px;background:${seg.color};flex-shrink:0"></span><span style="flex:1">${seg.label}</span><span style="font-weight:700">${seg.value}</span><span class="text-muted" style="font-size:0.6rem">${pct}%</span></div>`;
      }
      h += `</div></div>`;
      const byPrinter = {};
      for (const r of hist) { const pid = r.printer_id || 'unknown'; byPrinter[pid] = (byPrinter[pid] || 0) + 1; }
      const sortedPrinters = Object.entries(byPrinter).sort((a, b) => b[1] - a[1]);
      if (sortedPrinters.length > 0) {
        const mxP = sortedPrinters[0][1];
        h += `<div style="margin-top:10px;padding-top:8px;border-top:1px solid var(--border-color)"><div class="waste-compact-heading">${t('history.printer_breakdown')}</div>`;
        for (const [pid, cnt] of sortedPrinters) h += barRow(esc(_printerName(pid)), (cnt / mxP) * 100, 'var(--accent-purple)', cnt);
        h += `</div>`;
      }
      const wasteTotal = hist.reduce((sum, r) => sum + (r.waste_g || 0), 0);
      const colorChanges = hist.reduce((sum, r) => sum + (r.color_changes || 0), 0);
      if (wasteTotal > 0 || colorChanges > 0) {
        h += `<div style="margin-top:8px;padding-top:8px;border-top:1px solid var(--border-color)"><div class="stats-detail-list">`;
        if (wasteTotal > 0) h += sRow(t('stats.total_waste'), fmtW(wasteTotal), 'var(--accent-orange)');
        if (colorChanges > 0) h += sRow(t('stats.color_changes'), colorChanges);
        h += `</div></div>`;
      }
      return h;
    },

    'ps-duration-temp': (s, x, c, hw, hist) => {
      if (!hist || !hist.length) return '';
      const ps = _psGetStats(hist);
      const durations = hist.filter(r => r.duration_seconds > 0).map(r => r.duration_seconds);
      const avgDuration = durations.length > 0 ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length) : 0;
      const longest = durations.length > 0 ? Math.max(...durations) : 0;
      const longestRow = hist.find(r => r.duration_seconds === longest);
      const avgFilament = hist.length > 0 ? Math.round(ps.totalFilament / hist.length) : 0;
      let h = `<div class="card-title">${t('history.duration_stats')}</div><div class="stats-detail-list">`;
      h += sRow(t('stats.avg_duration'), _fmtDurLong(avgDuration));
      h += sRow(t('stats.longest_print'), `${_fmtDurLong(longest)}${longestRow ? ' — ' + esc((longestRow.filename || '').replace(/\.(3mf|gcode)$/i, '').substring(0, 20)) : ''}`);
      h += sRow(t('stats.avg_filament'), `${avgFilament}g`);
      h += sRow(t('stats.total_time'), _fmtDurLong(ps.totalTime));
      h += `</div>`;
      const nozzleTemps = hist.filter(r => r.max_nozzle_temp > 100).map(r => r.max_nozzle_temp);
      const bedTemps = hist.filter(r => r.max_bed_temp > 0).map(r => r.max_bed_temp);
      if (nozzleTemps.length || bedTemps.length) {
        h += `<div style="margin-top:10px;padding-top:8px;border-top:1px solid var(--border-color)"><div class="waste-compact-heading">${t('stats.temperatures') || 'Temperaturer'}</div><div class="stats-detail-list">`;
        if (nozzleTemps.length) { const avg = Math.round(nozzleTemps.reduce((a, b) => a + b, 0) / nozzleTemps.length); h += sRow(t('stats.nozzle_avg_max') || 'Nozzle avg / max', `${avg}\u00B0C / ${Math.max(...nozzleTemps)}\u00B0C`); }
        if (bedTemps.length) { const avg = Math.round(bedTemps.reduce((a, b) => a + b, 0) / bedTemps.length); h += sRow(t('stats.bed_avg_max') || 'Bed avg / max', `${avg}\u00B0C / ${Math.max(...bedTemps)}\u00B0C`); }
        h += `</div></div>`;
      }
      const byNozzle = {}; let totalLayers = 0;
      for (const r of hist) {
        const key = r.nozzle_type && r.nozzle_diameter ? `${r.nozzle_type} ${r.nozzle_diameter}mm` : r.nozzle_diameter ? `${r.nozzle_diameter}mm` : null;
        if (key) { if (!byNozzle[key]) byNozzle[key] = { count: 0, time: 0 }; byNozzle[key].count++; byNozzle[key].time += r.duration_seconds || 0; }
        totalLayers += r.layer_count || 0;
      }
      const sortedNozzles = Object.entries(byNozzle).sort((a, b) => b[1].count - a[1].count);
      if (sortedNozzles.length) {
        h += `<div style="margin-top:8px;padding-top:8px;border-top:1px solid var(--border-color)"><div class="waste-compact-heading">${t('stats.nozzle_speed') || 'Nozzle & speed'}</div>`;
        const mxN = sortedNozzles[0][1].count;
        for (const [nz, d] of sortedNozzles) h += barRow(esc(nz), (d.count / mxN) * 100, 'var(--accent-orange)', `${d.count}\u00D7 \u00B7 ${_fmtDurLong(d.time)}`);
        h += `<div class="stats-detail-list" style="margin-top:6px">`;
        h += sRow(t('stats.total_layers'), totalLayers.toLocaleString());
        const speedLevels = hist.filter(r => r.speed_level != null);
        if (speedLevels.length > 0) {
          const bySp = {};
          for (const r of speedLevels) { const name = (SPEED_MAP[r.speed_level] ? t(SPEED_MAP[r.speed_level]) : `${t('stats.level') || 'Level'} ${r.speed_level}`); bySp[name] = (bySp[name] || 0) + 1; }
          const topSpeed = Object.entries(bySp).sort((a, b) => b[1] - a[1]);
          h += sRow(t('stats.most_used') || 'Mest brukte', topSpeed[0] ? `${topSpeed[0][0]} (${topSpeed[0][1]}\u00D7)` : '--');
        }
        h += `</div></div>`;
      }
      return h;
    },

    'ps-filament-breakdown': (s, x, c, hw, hist) => {
      if (!hist || !hist.length) return '';
      const byType = {}, byColor = {}, byBrand = {};
      for (const r of hist) {
        // Normalize semicolon-separated multi-filament to unique types
        const rawType = r.filament_type || 'Unknown';
        const tp = [...new Set(rawType.split(';').map(s => s.trim()).filter(Boolean))].join(' + ') || 'Unknown';
        const color = r.filament_color || '';
        const brand = r.filament_brand || 'Unknown';
        if (!byType[tp]) byType[tp] = { count: 0, weight: 0, colors: new Set() };
        byType[tp].count++; byType[tp].weight += r.filament_used_g || 0;
        // Handle multi-color: add all colors
        for (const c of color.split(';')) { if (c && c.length >= 6) byType[tp].colors.add(c.substring(0, 6)); }
        const colorKey = color.includes(';') ? color.split(';')[0]?.substring(0, 6) || 'none' : (color ? color.substring(0, 6) : 'none');
        if (!byColor[colorKey]) byColor[colorKey] = { count: 0, weight: 0, type: tp };
        byColor[colorKey].count++; byColor[colorKey].weight += r.filament_used_g || 0;
        if (!byBrand[brand]) byBrand[brand] = { count: 0, weight: 0 };
        byBrand[brand].count++; byBrand[brand].weight += r.filament_used_g || 0;
      }
      let h = `<div class="card-title">${t('history.filament_breakdown')}</div><div class="filament-breakdown-grid">`;
      h += '<div class="filament-breakdown-col">';
      const sortedTypes = Object.entries(byType).sort((a, b) => b[1].count - a[1].count);
      const mxT = sortedTypes[0]?.[1].count || 1;
      h += `<div class="card-subtitle">${t('stats.per_type') || 'Per type'}</div><div class="chart-bars">`;
      for (const [tp, d] of sortedTypes) {
        const swatches = [...d.colors].map(cc => typeof miniSpool === 'function' ? miniSpool('#' + cc, 12) : `<span class="color-dot" style="background:#${cc}"></span>`).join('');
        h += `<div class="chart-bar-row"><span class="chart-bar-label">${swatches} ${esc(tp)}</span><div class="chart-bar-track"><div class="chart-bar-fill" style="width:${(d.count/mxT)*100}%;background:var(--accent-blue)"></div></div><span class="chart-bar-value">${d.count} \u00B7 ${fmtW(d.weight)}</span></div>`;
      }
      h += '</div>';
      const sortedBrands = Object.entries(byBrand).sort((a, b) => b[1].weight - a[1].weight);
      if (sortedBrands.length > 1 || (sortedBrands.length === 1 && sortedBrands[0][0] !== 'Unknown')) {
        const mxB = sortedBrands[0]?.[1].weight || 1;
        h += `<div class="card-subtitle" style="margin-top:12px">${t('stats.per_brand') || 'Per merke'}</div><div class="chart-bars">`;
        for (const [brand, d] of sortedBrands) h += barRow(esc(brand), (d.weight/mxB)*100, 'var(--accent-purple)', `${d.count}\u00D7 \u00B7 ${fmtW(d.weight)}`);
        h += '</div>';
      }
      h += '</div>';
      const sortedColors = Object.entries(byColor).filter(([k]) => k !== 'none').sort((a, b) => b[1].count - a[1].count);
      if (sortedColors.length > 0) {
        h += `<div class="filament-breakdown-col"><div class="card-subtitle">${t('stats.colors_used') || 'Farger brukt'}</div><div class="filament-color-grid">`;
        for (const [hex, d] of sortedColors) {
          const cc = '#' + hex, rv = parseInt(hex.substring(0,2),16), gv = parseInt(hex.substring(2,4),16), bv = parseInt(hex.substring(4,6),16);
          const light = (rv*299+gv*587+bv*114)/1000 > 160;
          h += `<div class="filament-color-chip" style="background:${cc};color:${light?'#333':'#fff'}"><span class="filament-color-type">${esc(d.type)}</span><span class="filament-color-stats">${d.count}\u00D7 \u00B7 ${fmtW(d.weight)}</span></div>`;
        }
        h += '</div></div>';
      }
      h += '</div>';
      return h;
    },

    'ps-nozzle-models': (s, x, c, hw, hist) => {
      if (!hist || !hist.length) return '';
      const byModel = {};
      for (const r of hist) {
        const name = (r.filename || t('common.unknown')).replace(/\.(3mf|gcode)$/i, '');
        if (!byModel[name]) byModel[name] = { count: 0, time: 0, success: 0, fail: 0 };
        byModel[name].count++; byModel[name].time += r.duration_seconds || 0;
        if (r.status === 'completed') byModel[name].success++;
        if (r.status === 'failed') byModel[name].fail++;
      }
      const sorted = Object.entries(byModel).sort((a, b) => b[1].count - a[1].count).slice(0, 8);
      if (!sorted.length) return '';
      const mx = sorted[0]?.[1].count || 1;
      let h = `<div class="card-title">${t('stats.most_printed') || 'Mest printede modeller'}</div><div class="chart-bars">`;
      for (const [name, d] of sorted) {
        const failTag = d.fail > 0 ? ` <span style="color:var(--accent-red);font-size:0.65rem">(${d.fail} ${t('history.failed')})</span>` : '';
        h += barRow(esc(name.length > 35 ? name.substring(0, 33) + '\u2026' : name), (d.count / mx) * 100, 'var(--accent-green)', `${d.count}\u00D7${failTag}`);
      }
      h += '</div>';
      return h;
    },

    'ps-print-timeline': (s, x, c, hw, hist) => {
      if (!hist || !hist.length) return '';
      const byDay = {};
      for (const r of hist) {
        if (!r.started_at) continue;
        const day = r.started_at.substring(0, 10);
        if (!byDay[day]) byDay[day] = { count: 0, time: 0, success: 0 };
        byDay[day].count++; byDay[day].time += r.duration_seconds || 0;
        if (r.status === 'completed') byDay[day].success++;
      }
      const days = Object.entries(byDay).sort((a, b) => a[0].localeCompare(b[0]));
      if (days.length < 2) return '';
      const maxCount = Math.max(...days.map(d => d[1].count), 1);
      let h = `<div class="card-title">${t('stats.print_timeline') || 'Printtidslinje'}</div><div class="timeline-chart">`;
      for (const [day, d] of days) {
        const pct = (d.count / maxCount) * 100;
        const dateLabel = day.substring(8) + '.' + day.substring(5, 7);
        const successRate = d.count > 0 ? Math.round(d.success / d.count * 100) : 0;
        const color = successRate === 100 ? 'var(--accent-green)' : successRate >= 50 ? 'var(--accent-orange, #f0883e)' : 'var(--accent-red)';
        h += `<div class="timeline-bar" title="${dateLabel}.${day.substring(0,4)}: ${d.count} prints, ${_fmtDurLong(d.time)}"><div class="timeline-bar-fill" style="height:${pct}%;background:${color}"></div><span class="timeline-bar-label">${dateLabel}</span><span class="timeline-bar-count">${d.count}</span></div>`;
      }
      h += '</div>';
      const totalDays = days.length, first = days[0][0], last = days[days.length - 1][0];
      const span = Math.max(1, Math.round((new Date(last) - new Date(first)) / 86400000));
      const activePct = Math.round(totalDays / span * 100);
      const byHour = Array(24).fill(0);
      for (const r of hist) { if (r.started_at) byHour[new Date(r.started_at).getHours()]++; }
      const peakHour = byHour.indexOf(Math.max(...byHour));
      const maxHour = Math.max(...byHour, 1);
      h += `<div style="display:flex;gap:16px;margin-top:10px;flex-wrap:wrap">`;
      h += `<div style="flex:1;min-width:180px"><div class="stats-detail-list">`;
      h += sRow(t('stats.active_days') || 'Active print days', `${totalDays} ${t('stats.of') || 'of'} ${span} ${t('stats.days') || 'days'} (${activePct}%)`);
      h += sRow(t('stats.prints_per_day') || 'Prints per dag (snitt)', (hist.length / totalDays).toFixed(1));
      h += sRow(t('stats.peak_hour') || 'Mest aktive time', `${String(peakHour).padStart(2,'0')}:00 – ${String(peakHour+1).padStart(2,'0')}:00 (${byHour[peakHour]} prints)`);
      h += `</div></div>`;
      h += `<div style="flex:1;min-width:200px"><div class="waste-compact-heading">${t('stats.hourly_activity') || 'Hourly activity'}</div>`;
      h += `<div style="display:flex;gap:2px;align-items:flex-end;height:36px">`;
      for (let i = 0; i < 24; i++) {
        const v = byHour[i], ht = maxHour > 0 ? Math.max((v / maxHour) * 100, v > 0 ? 8 : 2) : 2;
        const bg = v > 0 ? `rgba(63, 185, 80, ${Math.max(0.3, v / maxHour)})` : 'var(--bg-tertiary)';
        h += `<div title="${String(i).padStart(2,'0')}:00 — ${v} prints" style="flex:1;height:${ht}%;background:${bg};border-radius:2px 2px 0 0"></div>`;
      }
      h += `</div><div style="display:flex;justify-content:space-between;font-size:0.5rem;color:var(--text-muted);margin-top:2px"><span>00</span><span>06</span><span>12</span><span>18</span><span>23</span></div>`;
      h += `</div></div>`;
      return h;
    }
  };

  // ═══ Persistence ═══
  function getOrder(tabId) {
    return [...TAB_CONFIG[tabId].modules];
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

  // ═══ Main render ═══
  async function loadStatistics(initialTab) {
    const panel = document.getElementById('overlay-panel-body');
    if (!panel) return;

    // Accept explicit tab from caller
    if (initialTab && TAB_CONFIG[initialTab]) {
      _activeTab = initialTab;
    }

    // Read sub-slug from hash (e.g. #stats/filament → filament)
    const hashParts = location.hash.replace('#', '').split('/');
    if (hashParts[0] === 'stats' && hashParts[1] && TAB_CONFIG[hashParts[1]]) {
      _activeTab = hashParts[1];
    }
    window._statsPanel_printer = _printer;

    try {
      const qp = new URLSearchParams();
      if (_printer) qp.set('printer_id', _printer);
      if (_dateFrom) qp.set('from', _dateFrom);
      if (_dateTo) qp.set('to', _dateTo);
      const params = qp.toString() ? '?' + qp.toString() : '';
      const [statsRes, xcamRes, costRes, hwRes, histRes] = await Promise.all([
        fetch(`/api/statistics${params}`),
        fetch(`/api/xcam/stats${params}`).catch(() => null),
        fetch(`/api/statistics/costs${params}`).catch(() => null),
        fetch(`/api/statistics/hardware${_printer ? '?printer_id=' + _printer : ''}`).catch(() => null),
        fetch(`/api/history?limit=100&printer_id=${window.printerState?.getActivePrinterId?.() || ''}`).catch(() => null)
      ]);
      _data = await statsRes.json();
      try { _xcam = xcamRes ? await xcamRes.json() : null; } catch (_) { _xcam = null; }
      try { _costData = costRes ? await costRes.json() : null; } catch (_) { _costData = null; }
      try { _hwData = hwRes ? await hwRes.json() : null; } catch (_) { _hwData = null; }
      try { _histData = histRes ? await histRes.json() : null; } catch (_) { _histData = null; }
      if (!Array.isArray(_histData)) _histData = [];

      let html = '<div class="stats-layout">';

      // Printer selector
      html += buildPrinterSelector('changeStatsPrinter', _printer);

      // Toolbar
      html += `<div class="stats-toolbar">
        <div class="stats-date-range">
          <input type="date" class="form-control form-control-sm" value="${_dateFrom || ''}" onchange="statsSetDateFrom(this.value)" title="${t('stats.date_from')}">
          <span class="stats-date-sep">—</span>
          <input type="date" class="form-control form-control-sm" value="${_dateTo || ''}" onchange="statsSetDateTo(this.value)" title="${t('stats.date_to')}">
          <button class="form-btn form-btn-sm" data-ripple onclick="statsResetDates()">${t('stats.all_time')}</button>
        </div>
        <button class="form-btn form-btn-sm" data-ripple onclick="exportCsv()">${t('stats.download_csv')}</button>
        <button class="form-btn form-btn-sm" data-ripple onclick="exportJson()">${t('stats.download_json')}</button>
      </div>`;

      // Tab bar (sorted alphabetically, overview first)
      const sortedTabs = _getSortedTabs();
      html += '<div class="tabs">';
      for (const [id, cfg] of sortedTabs) {
        html += `<button class="tab-btn stats-tab-btn ${id === _activeTab ? 'active' : ''}" data-tab="${id}" onclick="switchStatsTab('${id}')">${t(cfg.label)}</button>`;
      }
      html += '</div>';

      // Tab panels
      for (const [tabId, cfg] of sortedTabs) {
        const order = getOrder(tabId);
        const isActive = tabId === _activeTab;
        html += `<div class="tab-panel stats-tab-panel stagger-in ${isActive ? 'active' : ''}" id="stats-tab-${tabId}" style="display:${isActive ? 'grid' : 'none'}">`;
        let _si = 0;
        for (const modId of order) {
          const builder = BUILDERS[modId];
          if (!builder) continue;
          const content = builder(_data, _xcam, _costData, _hwData, _histData);
          if (!content) continue;
          const size = MODULE_SIZE[modId] || 'half';
          const span = size === 'full' ? ' stats-module-full' : '';
          html += `<div class="stats-module${span}" data-module-id="${modId}" style="--i:${_si++}">`;
          html += content;
          html += '</div>';
        }
        html += '</div>';
      }

      html += '</div>'; // close .stats-layout
      panel.innerHTML = html;

    } catch (e) {
      panel.innerHTML = `<p class="text-muted">${t('stats.load_failed')}</p>`;
    }
  }

  // ═══ Global API ═══
  window.loadStatsPanel = loadStatistics;
  window.changeStatsPrinter = function(v) { _printer = v || null; window._statsPanel_printer = _printer; loadStatistics(); };
  window.switchStatsTab = switchTab;
  window.exportCsv = function() {
    window.open(`/api/history/export${_printer ? '?printer_id='+_printer : ''}`);
  };
  window.exportJson = function() {
    const params = new URLSearchParams({ format: 'json' });
    if (_printer) params.set('printer_id', _printer);
    window.open(`/api/history/export?${params}`);
  };
  window.statsSetDateFrom = function(v) { _dateFrom = v || null; loadStatistics(); };
  window.statsSetDateTo = function(v) { _dateTo = v || null; loadStatistics(); };
  window.statsResetDates = function() { _dateFrom = null; _dateTo = null; loadStatistics(); };

  // Cache printer names for cost-by-printer table
  (async () => {
    try {
      const r = await fetch('/api/printers');
      const printers = await r.json();
      window._printerNames = {};
      for (const p of printers) { window._printerNames[p.id] = p.name; }
    } catch {}
  })();

  window._recalcCosts = async function() {
    const btn = document.getElementById('cost-recalc-btn');
    if (btn) { btn.disabled = true; btn.textContent = t('stats.cost_recalculating'); }
    try {
      const res = await fetch('/api/statistics/costs/recalculate', { method: 'POST' });
      const data = await res.json();
      showToast(`${t('stats.cost_recalculated')}: ${data.updated}/${data.total}`, 'success');
      loadStatistics();
    } catch (e) {
      showToast(e.message, 'error');
      if (btn) { btn.disabled = false; btn.textContent = t('stats.cost_recalculate'); }
    }
  };
})();
