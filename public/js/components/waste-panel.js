// Poop Counter — Enhanced Waste Dashboard v2
(function() {

  // ═══ Helpers ═══
  const _ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
  function esc(s) { if (s == null) return ''; return String(s).replace(/[&<>"']/g, c => _ESC[c]); }
  function printerName(id) {
    return window.printerState?._printerMeta?.[id]?.name || id || '--';
  }
  function formatDate(iso) {
    if (!iso) return '--';
    const locale = (window.i18n?.getLocale() || 'nb').replace('_', '-');
    return new Date(iso).toLocaleDateString(locale, { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
  }
  function formatWeight(g) {
    if (g == null) return '--';
    if (g >= 1000) return `${(g / 1000).toFixed(2)} kg`;
    return `${Math.round(g * 10) / 10}g`;
  }
  function formatDuration(sec) {
    if (!sec) return '--';
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    return h > 0 ? `${h}t ${m}m` : `${m}m`;
  }
  function sRow(lbl, val, clr) { return `<div class="stats-detail-item"><span class="stats-detail-item-label">${lbl}</span><span class="stats-detail-item-value"${clr?` style="color:${clr}"`:''}>${val}</span></div>`; }
  function barRow(lbl, pct, clr, val) { return `<div class="chart-bar-row"><span class="chart-bar-label">${lbl}</span><div class="chart-bar-track"><div class="chart-bar-fill" style="width:${pct}%;background:${clr}"></div></div><span class="chart-bar-value">${val}</span></div>`; }

  function colorSwatch(hex, size = 10) {
    if (!hex) return '';
    const c = hex.substring(0, 6);
    return `<span style="display:inline-block;width:${size}px;height:${size}px;border-radius:50%;background:#${c};border:1px solid rgba(255,255,255,0.15);vertical-align:middle;flex-shrink:0"></span>`;
  }

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
    return `<svg width="${size}" height="${size}" style="transform:rotate(0deg)">${paths}</svg>`;
  }

  // SVG sparkline from array of values
  function sparkline(values, width = 120, height = 28, color = 'var(--accent-orange)') {
    if (!values.length) return '';
    const max = Math.max(...values, 1);
    const step = width / Math.max(values.length - 1, 1);
    let points = '';
    let fillPoints = `0,${height} `;
    for (let i = 0; i < values.length; i++) {
      const x = Math.round(i * step);
      const y = Math.round(height - (values[i] / max) * (height - 4) - 2);
      points += `${x},${y} `;
      fillPoints += `${x},${y} `;
    }
    fillPoints += `${Math.round((values.length - 1) * step)},${height}`;
    return `<svg class="waste-sparkline" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
      <polygon points="${fillPoints}" fill="${color}" opacity="0.1"/>
      <polyline points="${points.trim()}" fill="none" stroke="${color}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`;
  }

  // Trend arrow
  function trendArrow(current, previous) {
    if (previous === 0 && current === 0) return `<span class="waste-hero-trend waste-hero-trend--flat">—</span>`;
    if (previous === 0) return `<span class="waste-hero-trend waste-hero-trend--up">↑ nytt</span>`;
    const pct = ((current - previous) / previous) * 100;
    if (Math.abs(pct) < 5) return `<span class="waste-hero-trend waste-hero-trend--flat">→ ${Math.abs(pct).toFixed(0)}%</span>`;
    if (pct > 0) return `<span class="waste-hero-trend waste-hero-trend--up">↑ ${pct.toFixed(0)}%</span>`;
    return `<span class="waste-hero-trend waste-hero-trend--down">↓ ${Math.abs(pct).toFixed(0)}%</span>`;
  }

  // SVG icons (inline, 16x16)
  const ICONS = {
    prints: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="6" y="2" width="12" height="8" rx="1"/><rect x="2" y="10" width="20" height="8" rx="2"/><path d="M6 18v4h12v-4"/></svg>',
    weight: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.38 3.46L16 2 12 3.46 8 2l-4.38 1.46a1 1 0 00-.62.94v16.2a1 1 0 00.62.94L8 23l4-1.46L16 23l4.38-1.46a1 1 0 00.62-.94V4.4a1 1 0 00-.62-.94z"/></svg>',
    cost: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>',
    avg: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20V10"/><path d="M18 20V4"/><path d="M6 20v-4"/></svg>',
    gauge: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>',
    trend: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>',
    fire: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M8.5 14.5A2.5 2.5 0 0011 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 11-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 002.5 2.5z"/></svg>',
    refresh: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M23 4v6h-6"/><path d="M1 20v-6h6"/><path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/></svg>',
    settings: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 01-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>'
  };

  // ═══ Tab config ═══
  const TAB_CONFIG = {
    overview: { label: 'waste.tab_overview', modules: ['waste-summary', 'waste-analysis', 'waste-details', 'waste-charts-combined', 'waste-top-prints'] },
    history:  { label: 'waste.tab_history',  modules: ['recent-events'] }
  };
  const MODULE_SIZE = {
    'waste-summary': 'full',
    'waste-analysis': 'half', 'waste-details': 'half',
    'waste-charts-combined': 'half', 'waste-top-prints': 'half',
    'recent-events': 'full'
  };

  const STORAGE_PREFIX = 'waste-module-order-';
  const LOCK_KEY = 'waste-layout-locked';

  let _selectedWastePrinter = null;
  let _activeTab = 'overview';
  let _locked = localStorage.getItem(LOCK_KEY) !== '0';
  let _stats = null;
  let _draggedMod = null;

  // ═══ Persistence ═══
  function getOrder(tabId) {
    const defaults = TAB_CONFIG[tabId]?.modules || [];
    try {
      const o = JSON.parse(localStorage.getItem(STORAGE_PREFIX + tabId));
      if (Array.isArray(o)) {
        // Only use saved order if it contains current modules
        const valid = o.filter(id => defaults.includes(id));
        if (valid.length >= defaults.length - 1) return valid;
        // Saved order is stale, clear it
        localStorage.removeItem(STORAGE_PREFIX + tabId);
      }
    } catch (_) {}
    return defaults;
  }
  function saveOrder(tabId) {
    const cont = document.getElementById(`waste-tab-${tabId}`);
    if (!cont) return;
    const ids = [...cont.querySelectorAll('.stats-module[data-module-id]')].map(m => m.dataset.moduleId);
    localStorage.setItem(STORAGE_PREFIX + tabId, JSON.stringify(ids));
  }

  // ═══ Computed trend data ═══
  function computeTrend(s) {
    // Compute this week vs last week from waste_per_day
    const days = s.waste_per_day || [];
    const today = new Date();
    const dayOfWeek = today.getDay() || 7; // Monday = 1
    let thisWeek = 0, lastWeek = 0;
    for (const d of days) {
      const dd = new Date(d.day);
      const diff = Math.floor((today - dd) / 86400000);
      if (diff < dayOfWeek) thisWeek += d.total;
      else if (diff < dayOfWeek + 7) lastWeek += d.total;
    }
    return { thisWeek, lastWeek };
  }

  // ═══ Module builders ═══
  const BUILDERS = {
    'waste-summary': (s) => {
      const efficiency = s.total_filament_used_g > 0
        ? ((s.total_waste_g / s.total_filament_used_g) * 100) : 0;
      const effColor = efficiency > 5 ? 'var(--accent-red)' : efficiency > 2 ? 'var(--accent-orange)' : 'var(--accent-green)';
      const effPct = Math.min(efficiency, 100);

      // Sparkline from daily data
      const days = s.waste_per_day || [];
      const today = new Date();
      const sparkVals = [];
      for (let i = 29; i >= 0; i--) {
        const d = new Date(today); d.setDate(d.getDate() - i);
        const key = d.toISOString().split('T')[0];
        const found = days.find(dd => dd.day === key);
        sparkVals.push(found ? found.total : 0);
      }

      const { thisWeek, lastWeek } = computeTrend(s);

      return `<div class="waste-hero-grid">
        <div class="waste-hero-card waste-hero-card--blue">
          <div class="waste-hero-top">
            <div class="waste-hero-icon" style="background:rgba(59,130,246,0.15);color:var(--accent-blue)">${ICONS.prints}</div>
          </div>
          <div class="waste-hero-value">${s.prints_with_waste || 0}</div>
          <div class="waste-hero-label">${t('waste.total_count')}</div>
        </div>
        <div class="waste-hero-card waste-hero-card--orange">
          <div class="waste-hero-top">
            <div class="waste-hero-icon" style="background:rgba(249,115,22,0.15);color:var(--accent-orange)">${ICONS.weight}</div>
            ${trendArrow(thisWeek, lastWeek)}
          </div>
          <div class="waste-hero-value" style="color:var(--accent-orange)">${formatWeight(s.total_waste_g)}</div>
          <div class="waste-hero-label">${t('waste.total_weight')}</div>
          ${sparkline(sparkVals, 110, 22, 'var(--accent-orange)')}
        </div>
        <div class="waste-hero-card waste-hero-card--red">
          <div class="waste-hero-top">
            <div class="waste-hero-icon" style="background:rgba(248,81,73,0.15);color:var(--accent-red)">${ICONS.cost}</div>
          </div>
          <div class="waste-hero-value" style="color:var(--accent-red)">${formatCurrency(s.total_cost, 0)}</div>
          <div class="waste-hero-label">${t('waste.total_cost')}</div>
        </div>
        <div class="waste-hero-card waste-hero-card--cyan">
          <div class="waste-hero-top">
            <div class="waste-hero-icon" style="background:rgba(6,182,212,0.15);color:var(--accent-cyan)">${ICONS.avg}</div>
          </div>
          <div class="waste-hero-value">${s.avg_per_print}g</div>
          <div class="waste-hero-label">${t('waste.avg_per_print')}</div>
        </div>
        <div class="waste-hero-card waste-hero-card--green">
          <div class="waste-hero-top">
            <div class="waste-hero-icon" style="background:rgba(63,185,80,0.15);color:var(--accent-green)">${ICONS.gauge}</div>
          </div>
          <div style="position:relative;display:inline-flex;align-items:center;justify-content:center;margin:2px 0">
            <svg width="48" height="48" viewBox="0 0 48 48">
              <circle cx="24" cy="24" r="20" fill="none" stroke="var(--border-color)" stroke-width="4"/>
              <circle cx="24" cy="24" r="20" fill="none" stroke="${effColor}" stroke-width="4"
                stroke-dasharray="${effPct * 1.257} ${125.7 - effPct * 1.257}"
                stroke-dashoffset="31.4" stroke-linecap="round"/>
            </svg>
            <span style="position:absolute;font-size:0.65rem;font-weight:800;color:${effColor}">${efficiency.toFixed(1)}%</span>
          </div>
          <div class="waste-hero-label">${t('waste.efficiency')}</div>
        </div>
      </div>`;
    },

    // Combined: breakdown donut + trend + heatmap in one module
    'waste-analysis': (s) => {
      const bd = s.waste_breakdown || {};
      const segments = [
        { value: bd.purge_g || 0, color: 'var(--accent-blue)', label: t('waste.startup_purge') },
        { value: bd.color_change_g || 0, color: 'var(--accent-orange)', label: t('waste.color_changes') },
        { value: bd.failed_g || 0, color: 'var(--accent-red)', label: 'Feilet' },
        { value: bd.manual_g || 0, color: 'var(--accent-purple)', label: t('waste.manual') }
      ].filter(seg => seg.value > 0);
      const total = segments.reduce((s, seg) => s + seg.value, 0) || 1;

      let h = `<div class="card-title">${t('waste.breakdown')}</div>`;
      // Donut + legend row
      h += `<div style="display:flex;align-items:center;gap:12px">`;
      h += `<div style="position:relative;flex-shrink:0;display:flex;align-items:center;justify-content:center">`;
      h += miniDonut(segments, 70, 8);
      h += `<div class="waste-donut-center" style="width:70px;height:70px">
        <span class="waste-donut-center-value" style="font-size:0.85rem">${formatWeight(total)}</span>
      </div>`;
      h += `</div>`;
      h += `<div style="flex:1;display:flex;flex-direction:column;gap:3px">`;
      for (const seg of segments) {
        const pctVal = ((seg.value / total) * 100).toFixed(0);
        h += `<div style="display:flex;align-items:center;gap:5px;font-size:0.72rem">
          <span style="width:8px;height:8px;border-radius:2px;background:${seg.color};flex-shrink:0"></span>
          <span style="flex:1">${seg.label}</span>
          <span style="font-weight:700">${formatWeight(seg.value)}</span>
          <span class="text-muted" style="font-size:0.6rem">${pctVal}%</span>
        </div>`;
      }
      h += `</div></div>`;

      if (bd.failed_prints > 0) {
        h += `<div style="padding:4px 8px;background:rgba(248,81,73,0.08);border-radius:4px;font-size:0.68rem;margin-top:6px;display:flex;align-items:center;gap:5px;color:var(--accent-red)">
          ${ICONS.fire} ${bd.failed_prints} feilede prints kastet ${formatWeight(bd.failed_g)}
        </div>`;
      }

      // Trend section
      const { thisWeek, lastWeek } = computeTrend(s);
      if (thisWeek > 0 || lastWeek > 0) {
        const diff = thisWeek - lastWeek;
        const tPct = lastWeek > 0 ? ((diff / lastWeek) * 100).toFixed(0) : (thisWeek > 0 ? '+100' : '0');
        const deltaColor = diff > 0 ? 'var(--accent-red)' : diff < 0 ? 'var(--accent-green)' : 'var(--text-muted)';
        const arrow = diff > 0 ? '↑' : diff < 0 ? '↓' : '→';
        h += `<div style="margin-top:8px;padding-top:8px;border-top:1px solid var(--border-color);display:flex;align-items:center;gap:8px">
          <span class="text-muted" style="font-size:0.65rem;flex-shrink:0">${t('waste.trend')}:</span>
          <span style="font-weight:800;color:var(--accent-orange);font-size:0.85rem">${formatWeight(thisWeek)}</span>
          <span class="text-muted" style="font-size:0.6rem">vs</span>
          <span style="font-weight:700;color:var(--text-secondary);font-size:0.85rem">${formatWeight(lastWeek)}</span>
          <span style="font-weight:700;font-size:0.75rem;color:${deltaColor};margin-left:auto">${arrow} ${Math.abs(diff).toFixed(1)}g (${tPct}%)</span>
        </div>`;
      }

      // Compact heatmap (last 14 days only, inline)
      const days = s.waste_per_day || [];
      if (days.length > 0) {
        const dayMap = {};
        for (const d of days) dayMap[d.day] = d.total;
        const maxDay = Math.max(...days.map(d => d.total), 1);
        const today = new Date();
        h += `<div style="margin-top:8px;padding-top:8px;border-top:1px solid var(--border-color)">`;
        h += `<div class="text-muted" style="font-size:0.6rem;margin-bottom:4px">Siste 14 dager</div>`;
        h += `<div style="display:flex;gap:2px">`;
        for (let i = 13; i >= 0; i--) {
          const d = new Date(today); d.setDate(d.getDate() - i);
          const key = d.toISOString().split('T')[0];
          const val = dayMap[key] || 0;
          const intensity = val > 0 ? Math.max(0.25, val / maxDay) : 0;
          const bg = val > 0 ? `rgba(249, 115, 22, ${intensity})` : 'var(--bg-tertiary, rgba(255,255,255,0.05))';
          const dayLabel = d.toLocaleDateString('nb', { weekday: 'short', day: 'numeric' });
          h += `<div title="${dayLabel}: ${val}g" style="flex:1;height:16px;background:${bg};border-radius:2px;display:flex;align-items:center;justify-content:center;font-size:0.45rem;font-weight:700;color:${val > 0 ? (intensity > 0.6 ? '#fff' : 'var(--accent-orange)') : 'transparent'}">${val > 0 ? val : ''}</div>`;
        }
        h += `</div></div>`;
      }

      return h;
    },

    'waste-details': (s) => {
      const savedWaste = localStorage.getItem('wastePerChange') || '5';
      const savedPurge = localStorage.getItem('wastePurgeStartup') || '1';
      const costPerPrint = s.total_prints > 0 ? (s.total_cost / s.total_prints).toFixed(2) : '0';
      const usefulG = s.total_filament_used_g - s.total_waste_g;
      const wasteRatio = s.total_filament_used_g > 0 ? ((s.total_waste_g / s.total_filament_used_g) * 100).toFixed(1) : '0';

      let h = `<div class="card-title" style="display:flex;align-items:center;gap:6px">${ICONS.settings} ${t('waste.settings')}</div>`;

      // Stats section
      h += `<div class="stats-detail-list" style="margin-bottom:12px">`;
      h += sRow(t('waste.color_changes'), `${s.total_color_changes} (${s.prints_with_changes} prints)`);
      h += sRow('Kostnad per print', `${formatCurrency(parseFloat(costPerPrint), 0)}`);
      h += sRow('Nyttig filament', formatWeight(usefulG), 'var(--accent-green)');
      h += sRow(t('waste.waste_ratio'), `${wasteRatio}%`, parseFloat(wasteRatio) > 5 ? 'var(--accent-red)' : 'var(--accent-green)');
      h += `</div>`;

      // Settings sliders
      h += `<div class="waste-settings-section">`;

      // Startup purge slider
      h += `<div class="waste-slider-group">
        <div class="waste-slider-header">
          <span class="waste-slider-label">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--accent-blue)" stroke-width="2"><path d="M12 2v6l3-3"/><circle cx="12" cy="14" r="8"/></svg>
            ${t('waste.startup_purge')}
          </span>
          <span class="waste-slider-value" style="color:var(--accent-blue)" id="waste-purge-label">${savedPurge}g</span>
        </div>
        <input type="range" style="width:100%;accent-color:var(--accent-blue)" id="waste-purge-startup" value="${savedPurge}" min="0.5" max="5" step="0.5"
          oninput="document.getElementById('waste-purge-label').textContent=this.value+'g'"
          onchange="saveWastePurgeSetting(this.value)">
        <div class="waste-slider-range"><span>0.5g</span><span>5g</span></div>
      </div>`;

      // Color change waste slider
      h += `<div class="waste-slider-group">
        <div class="waste-slider-header">
          <span class="waste-slider-label">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--accent-orange)" stroke-width="2"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
            ${t('waste.per_change')}
          </span>
          <span class="waste-slider-value" style="color:var(--accent-orange)" id="waste-per-change-label">${savedWaste}g</span>
        </div>
        <input type="range" style="width:100%;accent-color:var(--accent-orange)" id="waste-per-change" value="${savedWaste}" min="1" max="20" step="0.5"
          oninput="document.getElementById('waste-per-change-label').textContent=this.value+'g'"
          onchange="saveWastePerChange(this.value)">
        <div class="waste-slider-range"><span>1g</span><span>20g</span></div>
      </div>`;

      // Recalculate button
      h += `<button class="form-btn" data-ripple onclick="recalcWaste()" style="width:100%;display:flex;align-items:center;justify-content:center;gap:6px">
        ${ICONS.refresh} Rekalkuler waste
      </button>
      <p class="text-muted" style="font-size:0.6rem;text-align:center;margin:0">Oppdaterer all historikk med nåværende innstillinger</p>`;

      h += `</div>`;
      return h;
    },

    'waste-top-prints': (s) => {
      const tops = s.waste_top_prints;
      if (!tops?.length) return '';

      let h = `<div class="card-title" style="display:flex;align-items:center;gap:6px">${ICONS.fire} ${t('waste.top_wasteful')}</div>`;
      h += `<div class="waste-top-list">`;
      for (let i = 0; i < tops.length; i++) {
        const p = tops[i];
        const name = (p.filename || '?').replace(/\.3mf$|\.gcode\.3mf$/i, '');
        const rankClass = i < 3 ? ` waste-top-rank--${i + 1}` : '';
        const statusIcon = (p.status === 'failed' || p.status === 'cancelled')
          ? `<span class="pill pill-failed" style="font-size:0.55rem;padding:1px 4px">${p.status === 'failed' ? 'Feilet' : 'Avbrutt'}</span>` : '';
        h += `<div class="waste-top-item">
          <div class="waste-top-rank${rankClass}">${i + 1}</div>
          ${colorSwatch(p.filament_color, 12)}
          <div class="waste-top-name" title="${esc(name)}">${esc(name)}</div>
          ${statusIcon}
          <div class="waste-top-badge">${p.waste_pct}% waste</div>
          <span class="text-muted" style="font-size:0.7rem;white-space:nowrap">${formatWeight(p.waste_g)} / ${formatWeight(p.filament_used_g)}</span>
        </div>`;
      }
      h += `</div>`;

      // Savings tip
      if (s.waste_breakdown?.purge_g > 0 && s.total_waste_g > 0) {
        const purgePct = ((s.waste_breakdown.purge_g / s.total_waste_g) * 100).toFixed(0);
        if (purgePct > 40) {
          h += `<div style="margin-top:10px;padding:8px 12px;background:rgba(59,130,246,0.08);border-radius:8px;font-size:0.72rem;display:flex;align-items:flex-start;gap:8px;color:var(--accent-blue)">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="flex-shrink:0;margin-top:1px"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
            <span>${t('waste.savings_tip')}: ${purgePct}% av waste er oppstartspurge. Batch flere prints for å redusere antall oppstarter.</span>
          </div>`;
        }
      }

      return h;
    },

    // Combined: weekly/monthly charts + per material + per printer + filament in one module
    'waste-charts-combined': (s) => {
      let h = `<div class="card-title">Statistikk</div>`;
      const sections = [];

      // Per material
      if (s.waste_by_material?.length) {
        let sec = `<div class="waste-compact-section"><div class="waste-compact-heading">${t('waste.by_material')}</div>`;
        const matColors = ['var(--accent-orange)', 'var(--accent-cyan)', 'var(--accent-red)', 'var(--accent-green)'];
        const maxMat = Math.max(...s.waste_by_material.map(m => m.total));
        for (let i = 0; i < s.waste_by_material.length; i++) {
          const m = s.waste_by_material[i];
          const pct = maxMat > 0 ? (m.total / maxMat) * 100 : 0;
          sec += barRow(m.type, pct, matColors[i % matColors.length], formatWeight(m.total));
        }
        sec += `</div>`;
        sections.push(sec);
      }

      // Per printer
      if (s.waste_by_printer?.length) {
        let sec = `<div class="waste-compact-section"><div class="waste-compact-heading">${t('waste.by_printer')}</div>`;
        const pColors = ['var(--accent-cyan)', 'var(--accent-orange)', 'var(--accent-green)'];
        const maxP = Math.max(...s.waste_by_printer.map(p => p.total));
        for (let i = 0; i < s.waste_by_printer.length; i++) {
          const p = s.waste_by_printer[i];
          const pct = maxP > 0 ? (p.total / maxP) * 100 : 0;
          sec += barRow(esc(printerName(p.printer_id)), pct, pColors[i % pColors.length], formatWeight(p.total));
        }
        sec += `</div>`;
        sections.push(sec);
      }

      // Weekly mini bars (inline)
      if (s.waste_per_week?.length) {
        let sec = `<div class="waste-compact-section"><div class="waste-compact-heading">${t('waste.per_week')}</div>`;
        const maxW = Math.max(...s.waste_per_week.map(w => w.total));
        sec += `<div style="display:flex;gap:6px;align-items:flex-end;height:50px">`;
        for (const w of s.waste_per_week) {
          const ht = maxW > 0 ? Math.max((w.total / maxW) * 100, 8) : 8;
          const label = w.week.split('-W')[1] ? `U${w.week.split('-W')[1]}` : w.week;
          sec += `<div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:2px">
            <span style="font-size:0.6rem;font-weight:700;color:var(--text-secondary)">${formatWeight(w.total)}</span>
            <div style="width:100%;height:${ht}%;background:var(--accent-orange);border-radius:3px 3px 0 0;min-height:4px"></div>
            <span style="font-size:0.55rem;color:var(--text-muted)">${label}</span>
          </div>`;
        }
        sec += `</div></div>`;
        sections.push(sec);
      }

      // Monthly mini bars
      if (s.waste_per_month?.length) {
        const monthNames = ['','Jan','Feb','Mar','Apr','Mai','Jun','Jul','Aug','Sep','Okt','Nov','Des'];
        let sec = `<div class="waste-compact-section"><div class="waste-compact-heading">${t('waste.per_month')}</div>`;
        const maxM = Math.max(...s.waste_per_month.map(m => m.total));
        sec += `<div style="display:flex;gap:6px;align-items:flex-end;height:50px">`;
        for (const m of s.waste_per_month) {
          const ht = maxM > 0 ? Math.max((m.total / maxM) * 100, 8) : 8;
          const name = monthNames[parseInt(m.month.split('-')[1])] || m.month;
          sec += `<div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:2px">
            <span style="font-size:0.6rem;font-weight:700;color:var(--text-secondary)">${formatWeight(m.total)}</span>
            <div style="width:100%;height:${ht}%;background:var(--accent-red);border-radius:3px 3px 0 0;min-height:4px"></div>
            <span style="font-size:0.55rem;color:var(--text-muted)">${name}</span>
          </div>`;
        }
        sec += `</div></div>`;
        sections.push(sec);
      }

      // Per filament (inline in this module)
      if (s.waste_by_filament?.length) {
        let sec = `<div class="waste-compact-section"><div class="waste-compact-heading">${t('waste.by_filament')}</div>`;
        const maxF = Math.max(...s.waste_by_filament.map(f => f.waste));
        for (const f of s.waste_by_filament) {
          const hex = (f.color || '').substring(0, 6);
          const brandLabel = f.brand || f.type || '?';
          const label = `${colorSwatch(hex, 10)} <span style="margin-left:3px">${esc(brandLabel)}</span>`;
          const pct = maxF > 0 ? (f.waste / maxF) * 100 : 0;
          const clr = hex ? `#${hex}` : 'var(--accent-orange)';
          const effPct = f.used > 0 ? ((f.waste / f.used) * 100).toFixed(1) : '0';
          sec += `<div class="chart-bar-row">
            <span class="chart-bar-label" style="display:flex;align-items:center;gap:2px">${label}</span>
            <div class="chart-bar-track"><div class="chart-bar-fill" style="width:${pct}%;background:${clr}"></div></div>
            <span class="chart-bar-value" style="white-space:nowrap">${formatWeight(f.waste)} <span class="text-muted" style="font-size:0.55rem">${f.prints}x ${effPct}%</span></span>
          </div>`;
        }
        sec += `</div>`;
        sections.push(sec);
      }

      if (!sections.length) return '';
      h += sections.join('');
      return h;
    },

    'recent-events': (s) => {
      if (!s.recent?.length) return `<p class="text-muted">${t('waste.no_data')}</p>`;
      let h = `<div class="card-title">${t('waste.recent')}</div>`;
      h += '<div class="waste-recent-list">';
      for (const r of s.recent) {
        const isAuto = r.reason === 'auto';
        const isFailed = r.status === 'failed' || r.status === 'cancelled';
        const borderColor = isFailed ? 'var(--accent-red)' : r.color_changes > 0 ? 'var(--accent-purple)' : 'var(--accent-orange)';
        const pillClass = isFailed ? 'pill pill-failed' : isAuto ? 'pill pill-completed' : 'pill pill-cancelled';
        const label = isFailed ? (r.status === 'failed' ? 'Feilet' : 'Avbrutt') : isAuto ? t('waste.auto') : t('waste.manual');
        const deleteBtn = !isAuto && r.id ? ` <button class="filament-delete-btn" onclick="deleteWasteEntry(${r.id})" title="${t('settings.delete')}" aria-label="${t('settings.delete')}"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>` : '';

        // Waste efficiency for this print
        const wasteEff = r.filament_used_g > 0 ? ((r.waste_g / r.filament_used_g) * 100).toFixed(1) : null;

        h += `<div class="waste-recent-card" style="border-left-color:${borderColor}">
          <div class="waste-recent-top">
            ${colorSwatch(r.filament_color, 10)}
            <span class="printer-tag">${esc(printerName(r.printer_id))}</span>
            <span class="waste-recent-weight">${r.waste_g}g</span>
            ${wasteEff ? `<span class="text-muted" style="font-size:0.6rem">(${wasteEff}%)</span>` : ''}
            <span class="${pillClass}" style="font-size:0.6rem">${label}</span>
            ${r.color_changes ? `<span class="text-muted" style="font-size:0.65rem">${r.color_changes} ${t('waste.color_changes_short')}</span>` : ''}
            ${deleteBtn}
          </div>
          <div class="waste-recent-bottom">
            <span class="text-muted">${formatDate(r.timestamp)}</span>
            ${r.filament_type ? `<span class="text-muted">${esc(r.filament_type)}</span>` : ''}
            ${r.filament_used_g ? `<span class="text-muted">${formatWeight(r.filament_used_g)} brukt</span>` : ''}
            ${r.duration_seconds ? `<span class="text-muted">${formatDuration(r.duration_seconds)}</span>` : ''}
            ${r.notes ? `<span class="text-muted" style="flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(r.notes)}</span>` : ''}
          </div>
        </div>`;
      }
      h += '</div>';
      return h;
    }
  };

  // ═══ Tab switching ═══
  function switchTab(tabId) {
    _activeTab = tabId;
    document.querySelectorAll('.waste-tab-btn').forEach(b => b.classList.toggle('active', b.dataset.tab === tabId));
    document.querySelectorAll('.waste-tab-panel').forEach(p => {
      const isActive = p.id === `waste-tab-${tabId}`;
      p.classList.toggle('active', isActive);
      p.style.display = isActive ? 'grid' : 'none';
    });
    const slug = tabId === 'overview' ? 'waste' : `waste/${tabId}`;
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
  async function loadWaste() {
    const panel = document.getElementById('overlay-panel-body');
    if (!panel) return;

    // Read sub-slug from hash
    const hashParts = location.hash.replace('#', '').split('/');
    if (hashParts[0] === 'waste' && hashParts[1] && TAB_CONFIG[hashParts[1]]) {
      _activeTab = hashParts[1];
    }

    const printerId = _selectedWastePrinter;
    const params = printerId ? `?printer_id=${printerId}` : '';

    try {
      const res = await fetch(`/api/waste/stats${params}`);
      _stats = await res.json();

      let html = '';

      // Printer selector
      html += buildPrinterSelector('changeWastePrinter', _selectedWastePrinter);

      // Toolbar
      const lockIcon = _locked
        ? '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>'
        : '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 019.9-1"/></svg>';
      html += `<div class="stats-toolbar">
        <button class="form-btn" data-ripple onclick="showGlobalWasteForm()" style="display:flex;align-items:center;gap:4px">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          <span>${t('waste.add_manual')}</span>
        </button>
        <button class="speed-btn ${_locked ? '' : 'active'}" data-ripple onclick="toggleWasteLock()" title="${_locked ? t('waste.layout_locked') : t('waste.layout_unlocked')}">
          ${lockIcon} <span>${_locked ? t('waste.layout_locked') : t('waste.layout_unlocked')}</span>
        </button>
        <button class="form-btn form-btn-sm" data-ripple onclick="exportWasteCsv()">${t('waste.download_csv')}</button>
      </div>`;

      // Global form container
      html += `<div id="waste-global-form" style="display:none"></div>`;

      // Tab bar
      html += '<div class="tabs">';
      for (const [id, cfg] of Object.entries(TAB_CONFIG)) {
        html += `<button class="tab-btn waste-tab-btn ${id === _activeTab ? 'active' : ''}" data-tab="${id}" data-ripple onclick="switchWasteTab('${id}')">${t(cfg.label)}</button>`;
      }
      html += '</div>';

      // Tab panels
      for (const [tabId, cfg] of Object.entries(TAB_CONFIG)) {
        const order = getOrder(tabId);
        // Merge any new modules not in saved order
        const allModules = cfg.modules;
        const mergedOrder = [...order];
        for (const mod of allModules) {
          if (!mergedOrder.includes(mod)) mergedOrder.push(mod);
        }

        html += `<div class="tab-panel waste-tab-panel stats-tab-panel ix-tab-panel ${tabId === _activeTab ? 'active' : ''}" id="waste-tab-${tabId}" style="display:${tabId === _activeTab ? 'grid' : 'none'}">`;
        let _si = 0;
        for (const modId of mergedOrder) {
          const builder = BUILDERS[modId];
          if (!builder) continue;
          const content = builder(_stats);
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
        const cont = document.getElementById(`waste-tab-${tabId}`);
        if (cont) initModuleDrag(cont, tabId);
      }
    } catch (e) {
      console.error('[waste] Load failed:', e);
      panel.innerHTML = `<p class="text-muted">${t('waste.load_failed')}</p>`;
    }
  }

  // ═══ Global toolbar form ═══
  window.showGlobalWasteForm = function() {
    if (_activeTab !== 'overview') switchTab('overview');
    const container = document.getElementById('waste-global-form');
    if (!container) return;
    container.style.display = '';
    container.innerHTML = `<div class="settings-card" style="margin-bottom:10px">
      <div class="settings-form">
        <div class="flex gap-sm" style="flex-wrap:wrap;align-items:flex-end">
          <div class="form-group" style="flex:1;min-width:80px;margin-bottom:0">
            <label class="form-label">${t('waste.weight_g')}</label>
            <input class="form-input" id="global-waste-g" type="number" placeholder="5" min="1" step="1">
          </div>
          <div class="form-group" style="flex:2;min-width:150px;margin-bottom:0">
            <label class="form-label">${t('waste.notes')}</label>
            <input class="form-input" id="global-waste-notes" placeholder="${t('waste.notes_placeholder')}">
          </div>
          <button class="form-btn" data-ripple onclick="submitGlobalWaste()">${t('waste.save')}</button>
          <button class="form-btn form-btn-sm" data-ripple style="background:transparent;color:var(--text-muted)" onclick="hideGlobalWasteForm()">${t('settings.cancel')}</button>
        </div>
      </div>
    </div>`;
    container.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  };

  window.hideGlobalWasteForm = function() {
    const c = document.getElementById('waste-global-form');
    if (c) { c.style.display = 'none'; c.innerHTML = ''; }
  };

  window.submitGlobalWaste = async function() {
    const wasteG = parseFloat(document.getElementById('global-waste-g')?.value);
    const notes = document.getElementById('global-waste-notes')?.value?.trim();
    if (!wasteG || wasteG <= 0) return;
    const printerId = _selectedWastePrinter || window.printerState.getActivePrinterId();
    await fetch('/api/waste', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ printer_id: printerId, waste_g: wasteG, notes })
    });
    loadWaste();
  };

  // ═══ Global API ═══
  window.loadWastePanel = loadWaste;
  window.changeWastePrinter = function(value) { _selectedWastePrinter = value || null; loadWaste(); };
  window.switchWasteTab = switchTab;
  window.toggleWasteLock = function() {
    _locked = !_locked;
    localStorage.setItem(LOCK_KEY, _locked ? '1' : '0');
    loadWaste();
  };

  window.saveWastePerChange = function(val) {
    localStorage.setItem('wastePerChange', val);
  };

  window.saveWastePurgeSetting = function(val) {
    localStorage.setItem('wastePurgeStartup', val);
  };

  window.recalcWaste = async function() {
    const purgeG = parseFloat(localStorage.getItem('wastePurgeStartup') || '1');
    const changeG = parseFloat(localStorage.getItem('wastePerChange') || '5');
    try {
      const res = await fetch('/api/waste/backfill', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ startup_purge_g: purgeG, waste_per_change_g: changeG })
      });
      const data = await res.json();
      if (window.showToast) window.showToast(`Oppdaterte ${data.updated} prints`, 'success');
      loadWaste();
    } catch (e) {
      console.error('[waste] Recalc failed:', e);
      if (window.showToast) window.showToast('Rekalkulering feilet', 'error');
    }
  };

  window.deleteWasteEntry = async function(id) {
    if (!confirm(t('waste.delete_confirm'))) return;
    await fetch(`/api/waste/${id}`, { method: 'DELETE' });
    loadWaste();
  };

  window.exportWasteCsv = function() {
    const params = _selectedWastePrinter ? `?printer_id=${_selectedWastePrinter}` : '';
    window.open(`/api/waste/export${params}`);
  };
})();
