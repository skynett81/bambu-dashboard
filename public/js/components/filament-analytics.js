(function() {
  'use strict';

  let _data = {};
  let _activeTab = 'consumption';

  async function fetchJson(url) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
    return res.json();
  }

  // ---- Formatting helpers (Norwegian conventions) ----

  function fmtW(g) {
    if (g == null || isNaN(g)) return '–';
    if (g >= 1000) return (g / 1000).toLocaleString('nb-NO', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + ' kg';
    return Math.round(g).toLocaleString('nb-NO') + ' g';
  }

  function fmtPct(val) {
    if (val == null || isNaN(val)) return '–';
    return parseFloat(val).toLocaleString('nb-NO', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + ' %';
  }

  function fmtKr(val) {
    if (val == null || isNaN(val)) return '–';
    return Math.round(val).toLocaleString('nb-NO') + ' kr';
  }

  function fmtKrG(val) {
    if (val == null || isNaN(val) || val === 0) return '–';
    return val.toLocaleString('nb-NO', { minimumFractionDigits: 3, maximumFractionDigits: 3 }) + ' kr/g';
  }

  function fmtDays(d) {
    if (d == null || isNaN(d)) return '–';
    if (d > 365) return Math.round(d / 30) + ' mnd';
    return Math.round(d) + ' dager';
  }

  function fmtDate(dateStr) {
    if (!dateStr) return '–';
    try {
      return new Date(dateStr).toLocaleDateString('nb-NO', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch { return dateStr; }
  }

  function fmtNum(val, dec) {
    if (val == null || isNaN(val)) return '–';
    return parseFloat(val).toLocaleString('nb-NO', { minimumFractionDigits: dec || 0, maximumFractionDigits: dec || 0 });
  }

  function colorDot(hex) {
    if (!hex) return '';
    const c = hex.startsWith('#') ? hex : '#' + hex.substring(0, 6);
    return `<span class="fc-mat-dot" style="background:${c}"></span>`;
  }

  function statusBadge(pct) {
    if (pct > 50) return '<span class="fc-mat-badge ok">OK</span>';
    if (pct > 20) return '<span class="fc-mat-badge low">Lav</span>';
    return '<span class="fc-mat-badge critical">Kritisk</span>';
  }

  function wasteBadge(ratio) {
    if (ratio > 20) return `<span class="fc-mat-badge critical">${fmtPct(ratio)}</span>`;
    if (ratio > 10) return `<span class="fc-mat-badge low">${fmtPct(ratio)}</span>`;
    return `<span class="fc-mat-badge ok">${fmtPct(ratio)}</span>`;
  }

  // ---- Scoped CSS ----

  const STYLE = `<style>
    .fa-container { max-width: 1200px; }
    .fa-heroes { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 10px; margin-bottom: 16px; }
    .fa-hero { background: var(--bg-secondary); border: 1px solid var(--border-color); border-radius: var(--radius); padding: 14px 16px; position: relative; overflow: hidden; }
    .fa-hero::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 3px; }
    .fa-hero.green::before { background: var(--accent-green, #00ae42); }
    .fa-hero.blue::before { background: var(--accent-blue, #1279ff); }
    .fa-hero.amber::before { background: #f59e0b; }
    .fa-hero.red::before { background: var(--accent-red, #e53935); }
    .fa-hero.purple::before { background: #8b5cf6; }
    .fa-hero-label { font-size: 0.65rem; color: var(--text-muted); font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; }
    .fa-hero-value { font-size: 1.4rem; font-weight: 800; margin: 2px 0; line-height: 1.2; font-variant-numeric: tabular-nums; }
    .fa-hero-sub { font-size: 0.7rem; color: var(--text-muted); }
    .fa-section { margin-bottom: 20px; }
    .fa-section-title { font-size: 0.85rem; font-weight: 700; margin: 0 0 10px; display: flex; align-items: center; gap: 8px; }
    .fa-section-badge { font-size: 0.65rem; background: var(--bg-tertiary); padding: 2px 8px; border-radius: 10px; color: var(--text-muted); font-weight: 600; }
    .fa-cards { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 10px; }
    .fa-card { background: var(--bg-secondary); border: 1px solid var(--border-color); border-radius: var(--radius); padding: 14px; }
    .fa-card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
    .fa-card-name { font-weight: 700; font-size: 0.9rem; display: flex; align-items: center; gap: 6px; }
    .fa-rows { display: flex; flex-direction: column; gap: 4px; }
    .fa-row { display: flex; justify-content: space-between; font-size: 0.75rem; }
    .fa-row span:first-child { color: var(--text-muted); }
    .fa-row span:last-child { font-weight: 600; }
    .fa-bar { height: 6px; background: var(--bg-tertiary); border-radius: 3px; overflow: hidden; margin: 6px 0; }
    .fa-bar-fill { height: 100%; border-radius: 3px; transition: width 0.3s ease; }
    .fa-tl-row { display: flex; align-items: center; gap: 10px; padding: 6px 0; border-bottom: 1px solid var(--border-color); }
    .fa-tl-row:last-child { border-bottom: none; }
    .fa-tl-name { font-size: 0.8rem; font-weight: 600; flex: 1; display: flex; align-items: center; gap: 6px; }
    .fa-tl-bar { flex: 2; height: 6px; background: var(--bg-tertiary); border-radius: 3px; overflow: hidden; }
    .fa-tl-bar-fill { height: 100%; border-radius: 3px; }
    .fa-tl-meta { font-size: 0.72rem; color: var(--text-muted); min-width: 90px; text-align: right; }
    .fa-tl-days { font-size: 0.8rem; font-weight: 700; min-width: 70px; text-align: right; }
    .fa-empty { text-align: center; padding: 60px 20px; color: var(--text-muted); }
    .fa-empty-icon { font-size: 2.5rem; margin-bottom: 12px; opacity: 0.5; }
    .fa-table-wrap { overflow-x: auto; }
    .fa-table { width: 100%; border-collapse: collapse; font-size: 0.8rem; }
    .fa-table th { text-align: left; padding: 8px 10px; font-size: 0.7rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; color: var(--text-muted); border-bottom: 2px solid var(--border-color); white-space: nowrap; }
    .fa-table td { padding: 8px 10px; border-bottom: 1px solid var(--border-color); white-space: nowrap; }
    .fa-table tr:hover { background: var(--bg-tertiary); }
    .fa-table td.num { text-align: right; font-variant-numeric: tabular-nums; }
  </style>`;

  // ---- Tab: Forbruk (Consumption) ----

  function renderConsumption() {
    const items = _data.consumption || [];
    if (!items.length) return emptyState('📊', t('filament_analytics.no_consumption_data'), t('filament_analytics.consumption_data_hint'));

    // Hero summary
    const totUsed = items.reduce((a, r) => a + (r.total_used_g || 0), 0);
    const totWaste = items.reduce((a, r) => a + (r.total_waste_g || 0), 0);
    const totPrints = items.reduce((a, r) => a + (r.total_prints || 0), 0);
    const totSuccess = items.reduce((a, r) => a + (r.total_success || 0), 0);

    let html = '<div class="fa-heroes">';
    html += hero('green', t('filament_analytics.total_consumed'), fmtW(totUsed), `${items.length} ${t('filament_analytics.materials')}`);
    html += hero('amber', t('filament_analytics.total_waste'), fmtW(totWaste), fmtPct(totWaste * 100 / (totUsed + totWaste || 1)) + ' ' + t('filament_analytics.waste_share'));
    html += hero('blue', t('filament_analytics.print_count'), fmtNum(totPrints), `${fmtPct(totSuccess * 100 / (totPrints || 1))} ${t('filament_analytics.completed_pct')}`);
    html += hero('purple', t('filament_analytics.avg_per_day'), fmtW(items.reduce((a, r) => a + (r.avg_daily_g || 0), 0)), t('filament_analytics.across_all_materials'));
    html += '</div>';

    html += '<div class="fa-section"><div class="fa-section-title">' + t('filament_analytics.consumption_per_material') + ' <span class="fa-section-badge">' + t('filament_analytics.last_30_days') + '</span></div>';
    html += '<div class="fa-table-wrap"><table class="fa-table"><thead><tr>';
    html += '<th>' + t('filament_analytics.material') + '</th><th>' + t('filament_analytics.brand') + '</th><th class="num">' + t('filament_analytics.consumed') + '</th><th class="num">Waste</th><th class="num">' + t('filament_analytics.waste_pct') + '</th><th class="num">' + t('filament_analytics.prints') + '</th><th class="num">' + t('filament_analytics.success_rate') + '</th><th class="num">' + t('filament_analytics.avg_day') + '</th><th class="num">' + t('filament_analytics.active_days') + '</th>';
    html += '</tr></thead><tbody>';
    for (const r of items) {
      html += `<tr>
        <td><strong>${r.material || '–'}</strong></td>
        <td>${r.brand || '–'}</td>
        <td class="num">${fmtW(r.total_used_g)}</td>
        <td class="num">${fmtW(r.total_waste_g)}</td>
        <td class="num">${wasteBadge(r.waste_pct)}</td>
        <td class="num">${fmtNum(r.total_prints)}</td>
        <td class="num">${fmtPct(r.success_rate)}</td>
        <td class="num">${fmtW(r.avg_daily_g)}</td>
        <td class="num">${fmtNum(r.active_days)}</td>
      </tr>`;
    }
    html += '</tbody></table></div></div>';
    return html;
  }

  // ---- Tab: Prognose (delegates to forecast-panel.js) ----

  function renderForecast() {
    // Return a container that forecast-panel.js will render into
    return '<div id="fa-forecast-container"></div>';
  }

  function _loadForecastExternal() {
    // Load forecast-panel.js content into our container
    if (typeof loadForecastPanel !== 'function') return;
    const container = document.getElementById('fa-forecast-container');
    if (!container) return;
    // Temporarily swap overlay-panel-body id so forecast-panel renders here
    const realBody = document.getElementById('overlay-panel-body');
    if (realBody) realBody.removeAttribute('id');
    container.id = 'overlay-panel-body';
    loadForecastPanel();
    container.id = 'fa-forecast-container';
    if (realBody) realBody.id = 'overlay-panel-body';
  }

  // ---- Tab: Svinn (Waste Analysis) ----

  function renderWaste() {
    const items = _data.waste || [];
    if (!items.length) return emptyState('🗑️', t('filament_analytics.no_waste_data'), t('filament_analytics.waste_data_hint'));

    const totWaste = items.reduce((a, r) => a + (r.total_waste_g || 0), 0);
    const totUsed = items.reduce((a, r) => a + (r.total_used_g || 0), 0);

    let html = '<div class="fa-heroes">';
    html += hero('red', 'Totalt svinn', fmtW(totWaste), fmtPct(totWaste * 100 / (totUsed + totWaste || 1)) + ' av total');
    html += hero('amber', 'Fargebytter', fmtNum(items.reduce((a, r) => a + (r.total_color_changes || 0), 0)), 'totalt');
    html += '</div>';

    html += '<div class="fa-section"><div class="fa-section-title">Svinnanalyse per materiale <span class="fa-section-badge">Siste 30 dager</span></div>';
    html += '<div class="fa-table-wrap"><table class="fa-table"><thead><tr>';
    html += '<th>Materiale</th><th>Merke</th><th>Status</th><th class="num">Prints</th><th class="num">Svinn</th><th class="num">Forbrukt</th><th class="num">Svinn-andel</th><th class="num">Fargebytter</th><th class="num">Snitt svinn/print</th>';
    html += '</tr></thead><tbody>';
    for (const r of items) {
      html += `<tr>
        <td><strong>${r.material || '–'}</strong></td>
        <td>${r.brand || '–'}</td>
        <td><span class="fc-mat-badge ${r.status === 'completed' ? 'ok' : r.status === 'failed' ? 'critical' : 'low'}">${r.status === 'completed' ? 'Fullført' : r.status === 'failed' ? 'Feilet' : r.status}</span></td>
        <td class="num">${fmtNum(r.print_count)}</td>
        <td class="num">${fmtW(r.total_waste_g)}</td>
        <td class="num">${fmtW(r.total_used_g)}</td>
        <td class="num">${wasteBadge(r.waste_ratio)}</td>
        <td class="num">${fmtNum(r.total_color_changes)}</td>
        <td class="num">${fmtW(r.avg_waste_per_print)}</td>
      </tr>`;
    }
    html += '</tbody></table></div></div>';
    return html;
  }

  // ---- Tab: Effektivitet (Material Efficiency) ----

  function renderEfficiency() {
    const items = _data.efficiency || [];
    if (!items.length) return emptyState('⚡', t('filament_analytics.no_efficiency_data'), t('filament_analytics.efficiency_data_hint'));

    let html = '<div class="fa-section"><div class="fa-section-title">' + t('filament_analytics.material_efficiency') + ' <span class="fa-section-badge">' + t('filament_analytics.last_30_days') + '</span></div>';
    html += '<div class="fa-cards">';
    for (const r of items) {
      html += `<div class="fa-card">
        <div class="fa-card-header">
          <div class="fa-card-name">${r.material || '–'} ${r.brand ? '(' + r.brand + ')' : ''}</div>
          <span class="fc-mat-badge ${(r.success_rate || 0) > 90 ? 'ok' : (r.success_rate || 0) > 70 ? 'low' : 'critical'}">${fmtPct(r.success_rate)} ${t('filament_analytics.success')}</span>
        </div>
        <div class="fa-rows">
          <div class="fa-row"><span>${t('filament_analytics.prints')}</span><span>${fmtNum(r.print_count)}</span></div>
          <div class="fa-row"><span>${t('filament_analytics.avg_g_per_print')}</span><span>${fmtW(r.avg_g_per_print)}</span></div>
          <div class="fa-row"><span>${t('filament_analytics.g_per_hour')}</span><span>${r.g_per_hour ? fmtNum(r.g_per_hour, 1) + ' g/t' : '–'}</span></div>
          <div class="fa-row"><span>${t('filament_analytics.avg_print_time')}</span><span>${r.avg_print_minutes ? fmtNum(r.avg_print_minutes, 0) + ' min' : '–'}</span></div>
          <div class="fa-row"><span>${t('filament_analytics.avg_nozzle_diameter')}</span><span>${r.avg_nozzle_mm ? fmtNum(r.avg_nozzle_mm, 2) + ' mm' : '–'}</span></div>
          <div class="fa-row"><span>${t('filament_analytics.avg_speed_level')}</span><span>${r.avg_speed_level ? fmtNum(r.avg_speed_level, 1) : '–'}</span></div>
        </div>
      </div>`;
    }
    html += '</div></div>';
    return html;
  }

  // ---- Tab: Kostnad (Cost Analysis) ----

  function renderCost() {
    const items = _data.cost || [];
    if (!items.length) return emptyState('💰', t('filament_analytics.no_cost_data'), t('filament_analytics.cost_data_hint'));

    const totSpent = items.reduce((a, r) => a + (r.total_spent || 0), 0);
    const totRemain = items.reduce((a, r) => a + (r.total_remaining_g || 0), 0);
    const totConsumed = items.reduce((a, r) => a + (r.total_consumed_g || 0), 0);

    let html = '<div class="fa-heroes">';
    html += hero('green', t('filament_analytics.total_invested'), fmtKr(totSpent), `${items.reduce((a, r) => a + (r.spool_count || 0), 0)} ${t('filament_analytics.spools')}`);
    html += hero('blue', t('filament_analytics.consumed'), fmtW(totConsumed), fmtPct(totConsumed * 100 / (totConsumed + totRemain || 1)) + ' ' + t('filament_analytics.utilized'));
    html += hero('purple', t('filament_analytics.remaining_stock'), fmtW(totRemain), t('filament_analytics.in_stock'));
    html += '</div>';

    html += '<div class="fa-section"><div class="fa-section-title">' + t('filament_analytics.cost_per_material') + '</div>';
    html += '<div class="fa-table-wrap"><table class="fa-table"><thead><tr>';
    html += '<th>' + t('filament_analytics.material') + '</th><th>' + t('filament_analytics.vendor') + '</th><th class="num">' + t('filament_analytics.spools') + '</th><th class="num">' + t('filament_analytics.avg_cost_per_g') + '</th><th class="num">' + t('filament_analytics.min_cost_per_g') + '</th><th class="num">' + t('filament_analytics.max_cost_per_g') + '</th><th class="num">' + t('filament_analytics.invested') + '</th><th class="num">' + t('filament_analytics.consumed') + '</th><th class="num">' + t('filament_analytics.remaining') + '</th><th class="num">' + t('filament_analytics.utilization') + '</th>';
    html += '</tr></thead><tbody>';
    for (const r of items) {
      const utilPct = r.utilization_pct || 0;
      html += `<tr>
        <td><strong>${r.material || '–'}</strong></td>
        <td>${r.vendor || '–'}</td>
        <td class="num">${fmtNum(r.spool_count)}</td>
        <td class="num">${fmtKrG(r.avg_cost_per_g)}</td>
        <td class="num">${fmtKrG(r.min_cost_per_g)}</td>
        <td class="num">${fmtKrG(r.max_cost_per_g)}</td>
        <td class="num">${fmtKr(r.total_spent)}</td>
        <td class="num">${fmtW(r.total_consumed_g)}</td>
        <td class="num">${fmtW(r.total_remaining_g)}</td>
        <td class="num">${statusBadge(utilPct)}</td>
      </tr>`;
    }
    html += '</tbody></table></div></div>';
    return html;
  }

  // ---- Tab: Forbruksrater (Consumption Rates) ----

  function renderRates() {
    const items = _data.rates || [];

    let html = '<div style="display:flex;gap:8px;margin-bottom:16px;flex-wrap:wrap">';
    html += `<button class="btn btn-sm" onclick="window._recalcFilamentAnalytics()" style="background:var(--accent-blue);color:#fff;border:none;cursor:pointer">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:middle;margin-right:4px"><path d="M21 12a9 9 0 1 1-9-9"/><path d="M21 3v9h-9"/></svg>
      ${t('filament_analytics.recalculate_data')}
    </button>`;
    html += '</div>';

    if (!items.length) return html + emptyState('📈', t('filament_analytics.no_consumption_rates'), t('filament_analytics.consumption_rates_hint'));

    html += '<div class="fa-cards">';
    for (const r of items) {
      if (!r.material) continue;
      html += `<div class="fa-card">
        <div class="fa-card-header">
          <div class="fa-card-name">${r.material} ${r.brand ? '(' + r.brand + ')' : ''}</div>
          <span class="fc-mat-badge ${(r.success_rate || 0) > 0.9 ? 'ok' : (r.success_rate || 0) > 0.7 ? 'low' : 'critical'}">${fmtPct((r.success_rate || 0) * 100)}</span>
        </div>
        <div class="fa-rows">
          <div class="fa-row"><span>Per dag</span><span>${fmtW(r.avg_daily_g)}</span></div>
          <div class="fa-row"><span>Per uke</span><span>${fmtW(r.avg_weekly_g)}</span></div>
          <div class="fa-row"><span>Per måned</span><span>${fmtW(r.avg_monthly_g)}</span></div>
          <div class="fa-row"><span>Svinn-andel</span><span>${fmtPct((r.waste_ratio || 0) * 100)}</span></div>
          <div class="fa-row"><span>Kostnad per gram</span><span>${fmtKrG(r.avg_cost_per_g)}</span></div>
          <div class="fa-row"><span>Datapunkter</span><span>${fmtNum(r.sample_days)} dager</span></div>
        </div>
      </div>`;
    }
    html += '</div>';
    return html;
  }

  // ---- Helpers ----

  function hero(color, label, value, sub) {
    return `<div class="fa-hero ${color}">
      <div class="fa-hero-label">${label}</div>
      <div class="fa-hero-value">${value}</div>
      <div class="fa-hero-sub">${sub}</div>
    </div>`;
  }

  function emptyState(icon, title, desc) {
    return `<div class="fa-empty">
      <div class="fa-empty-icon">${icon}</div>
      <div style="font-weight:700;margin-bottom:6px">${title}</div>
      <div>${desc}</div>
    </div>`;
  }

  // ---- Tab: Erstatninger (Material Substitutions) ----

  function renderSubstitutions() {
    const items = _data.substitutions || [];
    if (!items.length) return emptyState('🔄', t('filament_analytics.no_substitution_rules'), t('filament_analytics.substitution_rules_hint'));

    let html = '<div class="fa-section"><div class="fa-section-title">' + t('filament_analytics.material_substitutions') + ' <span class="fa-section-badge">' + items.length + ' ' + t('filament_analytics.rules') + '</span></div>';
    html += '<div class="fa-table-wrap"><table class="fa-table"><thead><tr>';
    html += '<th>' + t('filament_analytics.material') + '</th><th>' + t('filament_analytics.substitute') + '</th><th class="num">' + t('filament_analytics.compatibility') + '</th><th>' + t('filament_analytics.note') + '</th><th>' + t('filament_analytics.condition') + '</th>';
    html += '</tr></thead><tbody>';
    for (const r of items) {
      const pct = r.compatibility_pct || 0;
      const badge = pct >= 90 ? 'ok' : pct >= 70 ? 'low' : 'critical';
      html += `<tr>
        <td><strong>${r.material}</strong></td>
        <td>${r.substitute_material}</td>
        <td class="num"><span class="fc-mat-badge ${badge}">${pct} %</span></td>
        <td style="font-size:0.75rem">${r.notes || '–'}</td>
        <td style="font-size:0.75rem;color:var(--text-muted)">${r.conditions || '–'}</td>
      </tr>`;
    }
    html += '</tbody></table></div></div>';
    return html;
  }

  // ---- Tab: Lagring & Holdbarhet (Storage & Expiry) ----

  function renderStorage() {
    const alerts = _data.storageAlerts || [];
    const expiring = _data.expiring || [];
    const expired = _data.expired || [];

    let html = '<div class="fa-heroes">';
    html += hero('red', t('filament_analytics.expired_spools'), fmtNum(expired.length), t('filament_analytics.should_replace'));
    html += hero('amber', t('filament_analytics.expiring_soon'), fmtNum(expiring.length), t('filament_analytics.within_30_days'));
    html += hero(alerts.length > 0 ? 'red' : 'green', t('filament_analytics.storage_alerts'), fmtNum(alerts.length), alerts.length > 0 ? t('filament_analytics.needs_attention') : t('filament_analytics.all_ok'));
    html += '</div>';

    if (alerts.length > 0) {
      html += '<div class="fa-section"><div class="fa-section-title">Lagringsalarmer</div>';
      html += '<div class="fa-cards">';
      for (const a of alerts) {
        const icon = a.type.includes('humidity') ? '💧' : '🌡️';
        const dir = a.type.includes('high') ? 'for høy' : 'for lav';
        html += `<div class="fa-card" style="border-left:3px solid var(--accent-red)">
          <div class="fa-card-header"><div class="fa-card-name">${icon} ${a.location}</div></div>
          <div class="fa-rows">
            <div class="fa-row"><span>Spool</span><span>${a.profile || '–'} (${a.material || '–'})</span></div>
            <div class="fa-row"><span>Problem</span><span style="color:var(--accent-red)">${a.type.includes('humidity') ? 'Fuktighet' : 'Temperatur'} ${dir}</span></div>
            <div class="fa-row"><span>Verdi</span><span>${fmtNum(a.value, 1)}${a.type.includes('humidity') ? ' %' : ' °C'}</span></div>
            <div class="fa-row"><span>Terskel</span><span>${fmtNum(a.threshold, 1)}${a.type.includes('humidity') ? ' %' : ' °C'}</span></div>
          </div>
        </div>`;
      }
      html += '</div></div>';
    }

    if (expired.length > 0) {
      html += '<div class="fa-section"><div class="fa-section-title">Utløpte spoler <span class="fa-section-badge critical" style="background:rgba(239,68,68,0.1);color:#ef4444">' + expired.length + '</span></div>';
      html += '<div class="fa-table-wrap"><table class="fa-table"><thead><tr><th>Spool</th><th>Materiale</th><th>Leverandør</th><th>Utløpsdato</th></tr></thead><tbody>';
      for (const s of expired) {
        html += `<tr><td><strong>${s.profile_name || '–'}</strong></td><td>${s.material || '–'}</td><td>${s.vendor_name || '–'}</td><td style="color:var(--accent-red)">${fmtDate(s.expiry_date)}</td></tr>`;
      }
      html += '</tbody></table></div></div>';
    }

    if (expiring.length > 0) {
      html += '<div class="fa-section"><div class="fa-section-title">Utløper snart</div>';
      html += '<div class="fa-table-wrap"><table class="fa-table"><thead><tr><th>Spool</th><th>Materiale</th><th>Utløpsdato</th><th class="num">Dager igjen</th></tr></thead><tbody>';
      for (const s of expiring) {
        html += `<tr><td><strong>${s.profile_name || '–'}</strong></td><td>${s.material || '–'}</td><td>${fmtDate(s.expiry_date)}</td><td class="num">${fmtNum(s.days_until_expiry)} dager</td></tr>`;
      }
      html += '</tbody></table></div></div>';
    }

    if (!alerts.length && !expired.length && !expiring.length) {
      html += emptyState('✅', t('filament_analytics.all_good'), t('filament_analytics.no_storage_alerts'));
    }

    return html;
  }

  // ---- Tab system ----

  const TABS = [
    { id: 'consumption', label: t('filament_analytics.tab_consumption'), render: renderConsumption },
    { id: 'forecast', label: t('filament_analytics.tab_forecast'), render: renderForecast },
    { id: 'waste', label: t('filament_analytics.tab_waste'), render: renderWaste },
    { id: 'efficiency', label: t('filament_analytics.tab_efficiency'), render: renderEfficiency },
    { id: 'cost', label: t('filament_analytics.tab_cost'), render: renderCost },
    { id: 'rates', label: t('filament_analytics.tab_rates'), render: renderRates },
    { id: 'substitutions', label: t('filament_analytics.tab_substitutions'), render: renderSubstitutions },
    { id: 'storage', label: t('filament_analytics.tab_storage'), render: renderStorage },
  ];

  function renderPanel() {
    let html = STYLE + '<div class="fa-container">';
    html += '<div class="panel-tabs" style="margin-bottom:16px">';
    for (const tab of TABS) {
      html += `<button class="tab-btn${tab.id === _activeTab ? ' active' : ''}" onclick="window._switchFilamentAnalyticsTab('${tab.id}')">${tab.label}</button>`;
    }
    html += '</div>';
    html += '<div id="fa-tab-content"></div></div>';
    return html;
  }

  function renderTabContent() {
    const tab = TABS.find(t => t.id === _activeTab);
    const el = document.getElementById('fa-tab-content');
    if (el && tab) {
      el.innerHTML = tab.render();
      // Load external forecast panel after DOM insert
      if (_activeTab === 'forecast') setTimeout(_loadForecastExternal, 0);
    }
  }

  window._switchFilamentAnalyticsTab = function(tabId) {
    _activeTab = tabId;
    // Update tab buttons
    document.querySelectorAll('.fa-container .tab-btn').forEach(btn => {
      btn.classList.toggle('active', btn.textContent === TABS.find(t => t.id === tabId)?.label);
    });
    renderTabContent();
  };

  window._recalcFilamentAnalytics = async function() {
    try {
      const res = await fetch('/api/filament-analytics/recalculate', { method: 'POST' });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      if (typeof showToast === 'function') showToast(`Rekalkulert: ${data.daily_rows} daglige rader, ${data.rate_rows} materialrater`, 'success');
      window.loadFilamentAnalyticsPanel(_activeTab);
    } catch (e) {
      if (typeof showToast === 'function') showToast('Rekalkulering feilet: ' + e.message, 'error');
    }
  };

  async function loadFilamentAnalyticsPanel(initialTab) {
    const panel = document.getElementById('overlay-panel-body');
    if (!panel) return;
    panel.innerHTML = '<div class="skeleton" style="height:300px"></div>';

    if (initialTab) _activeTab = initialTab;

    try {
      const [consumption, forecast, waste, efficiency, cost, rates, substitutions, storageAlerts, expiring, expired] = await Promise.all([
        fetchJson('/api/filament-analytics/consumption?days=30'),
        fetchJson('/api/filament-analytics/depletion-forecast'),
        fetchJson('/api/filament-analytics/waste?days=30'),
        fetchJson('/api/filament-analytics/material-efficiency?days=30'),
        fetchJson('/api/filament-analytics/cost'),
        fetchJson('/api/filament-analytics/consumption-rates'),
        fetchJson('/api/filament-analytics/substitutions'),
        fetchJson('/api/filament-analytics/storage-alerts'),
        fetchJson('/api/filament-analytics/expiring?days=30'),
        fetchJson('/api/filament-analytics/expired'),
      ]);

      _data = { consumption, forecast, waste, efficiency, cost, rates, substitutions, storageAlerts, expiring, expired };
      panel.innerHTML = renderPanel();
      renderTabContent();
    } catch (e) {
      panel.innerHTML = emptyState('⚠️', 'Kunne ikke laste data', e.message);
    }
  }

  window.loadFilamentAnalyticsPanel = loadFilamentAnalyticsPanel;
})();
