// Filament Usage Forecast — predict filament consumption
(function() {
  window.loadForecastPanel = function() {
    const el = document.getElementById('overlay-panel-body');
    if (!el) return;

    el.innerHTML = `<style>
      .fc-container { max-width:1200px; }
      /* Hero cards */
      .fc-heroes { display:grid; grid-template-columns:repeat(auto-fill, minmax(180px, 1fr)); gap:10px; margin-bottom:16px; }
      .fc-hero { background:var(--bg-secondary); border:1px solid var(--border-color); border-radius:var(--radius); padding:14px 16px; position:relative; overflow:hidden; }
      .fc-hero::before { content:''; position:absolute; top:0; left:0; right:0; height:3px; }
      .fc-hero.blue::before { background:var(--accent-blue, #1279ff); }
      .fc-hero.green::before { background:var(--accent-green, #00ae42); }
      .fc-hero.amber::before { background:#f59e0b; }
      .fc-hero.red::before { background:var(--accent-red, #e53935); }
      .fc-hero.purple::before { background:#8b5cf6; }
      .fc-hero-icon { font-size:1.1rem; margin-bottom:4px; }
      .fc-hero-label { font-size:0.65rem; color:var(--text-muted); font-weight:600; text-transform:uppercase; letter-spacing:0.5px; }
      .fc-hero-value { font-size:1.4rem; font-weight:800; margin:2px 0; line-height:1.2; }
      .fc-hero-sub { font-size:0.7rem; color:var(--text-muted); }
      .fc-hero-trend { display:inline-flex; align-items:center; gap:3px; font-size:0.7rem; font-weight:600; padding:2px 6px; border-radius:10px; margin-top:4px; }
      .fc-hero-trend.up { background:rgba(239,68,68,0.1); color:#ef4444; }
      .fc-hero-trend.down { background:rgba(0,174,66,0.1); color:#00ae42; }
      .fc-hero-trend.flat { background:rgba(107,114,128,0.1); color:#6b7280; }
      /* Alerts */
      .fc-alerts { display:flex; flex-direction:column; gap:8px; margin-bottom:16px; }
      .fc-alert { border-radius:var(--radius); padding:10px 14px; display:flex; align-items:center; gap:10px; font-size:0.8rem; }
      .fc-alert.critical { background:rgba(239,68,68,0.08); border:1px solid rgba(239,68,68,0.2); color:#ef4444; }
      .fc-alert.warning { background:rgba(245,158,11,0.08); border:1px solid rgba(245,158,11,0.2); color:#f59e0b; }
      .fc-alert.info { background:rgba(18,121,255,0.08); border:1px solid rgba(18,121,255,0.2); color:var(--accent-blue, #1279ff); }
      .fc-alert-icon { font-size:1rem; flex-shrink:0; }
      /* Section */
      .fc-section { margin-bottom:20px; }
      .fc-section-title { font-size:0.85rem; font-weight:700; margin:0 0 10px; display:flex; align-items:center; gap:8px; }
      .fc-section-badge { font-size:0.65rem; background:var(--bg-tertiary); padding:2px 8px; border-radius:10px; color:var(--text-muted); font-weight:600; }
      /* Chart */
      .fc-chart-wrap { background:var(--bg-secondary); border:1px solid var(--border-color); border-radius:var(--radius); padding:16px; }
      .fc-chart { width:100%; height:220px; }
      .fc-chart-legend { display:flex; gap:16px; margin-top:8px; flex-wrap:wrap; }
      .fc-chart-legend-item { display:flex; align-items:center; gap:5px; font-size:0.7rem; color:var(--text-muted); }
      .fc-chart-legend-dot { width:10px; height:10px; border-radius:2px; flex-shrink:0; }
      /* Material grid */
      .fc-materials { display:grid; grid-template-columns:repeat(auto-fill, minmax(280px, 1fr)); gap:10px; }
      .fc-mat-card { background:var(--bg-secondary); border:1px solid var(--border-color); border-radius:var(--radius); padding:14px; }
      .fc-mat-header { display:flex; justify-content:space-between; align-items:center; margin-bottom:10px; }
      .fc-mat-name { font-weight:700; font-size:0.9rem; display:flex; align-items:center; gap:6px; }
      .fc-mat-dot { width:10px; height:10px; border-radius:50%; flex-shrink:0; }
      .fc-mat-badge { font-size:0.65rem; padding:2px 7px; border-radius:10px; font-weight:600; }
      .fc-mat-badge.ok { background:rgba(0,174,66,0.1); color:#00ae42; }
      .fc-mat-badge.low { background:rgba(245,158,11,0.1); color:#f59e0b; }
      .fc-mat-badge.critical { background:rgba(239,68,68,0.1); color:#ef4444; }
      .fc-mat-badge.none { background:rgba(107,114,128,0.1); color:#6b7280; }
      .fc-mat-rows { display:flex; flex-direction:column; gap:4px; }
      .fc-mat-row { display:flex; justify-content:space-between; font-size:0.75rem; }
      .fc-mat-row span:first-child { color:var(--text-muted); }
      .fc-mat-row span:last-child { font-weight:600; }
      .fc-bar { height:6px; background:var(--bg-tertiary); border-radius:3px; overflow:hidden; margin:6px 0; }
      .fc-bar-fill { height:100%; border-radius:3px; transition:width 0.3s ease; }
      .fc-bar-dual { display:flex; height:6px; background:var(--bg-tertiary); border-radius:3px; overflow:hidden; margin:6px 0; }
      .fc-bar-used { height:100%; }
      .fc-bar-stock { height:100%; opacity:0.5; }
      /* Depletion timeline */
      .fc-timeline { background:var(--bg-secondary); border:1px solid var(--border-color); border-radius:var(--radius); padding:14px; }
      .fc-tl-row { display:flex; align-items:center; gap:10px; padding:6px 0; border-bottom:1px solid var(--border-color); }
      .fc-tl-row:last-child { border-bottom:none; }
      .fc-tl-dot { width:8px; height:8px; border-radius:50%; flex-shrink:0; }
      .fc-tl-name { font-size:0.8rem; font-weight:600; flex:1; }
      .fc-tl-bar { flex:2; height:6px; background:var(--bg-tertiary); border-radius:3px; overflow:hidden; }
      .fc-tl-bar-fill { height:100%; border-radius:3px; }
      .fc-tl-date { font-size:0.72rem; color:var(--text-muted); min-width:80px; text-align:right; }
      /* Cost */
      .fc-cost-grid { display:grid; grid-template-columns:repeat(auto-fill, minmax(200px, 1fr)); gap:10px; }
      .fc-cost-card { background:var(--bg-secondary); border:1px solid var(--border-color); border-radius:var(--radius); padding:14px; text-align:center; }
      .fc-cost-label { font-size:0.65rem; color:var(--text-muted); text-transform:uppercase; font-weight:600; }
      .fc-cost-value { font-size:1.3rem; font-weight:800; margin:4px 0; }
      .fc-cost-sub { font-size:0.7rem; color:var(--text-muted); }
      /* Empty */
      .fc-empty { text-align:center; padding:60px 20px; color:var(--text-muted); }
      .fc-empty-icon { font-size:2.5rem; margin-bottom:12px; opacity:0.5; }
      .fc-empty-text { font-size:0.9rem; margin-bottom:4px; }
      .fc-empty-sub { font-size:0.75rem; }
    </style>
    <div class="fc-container">
      <div class="fc-heroes" id="fc-heroes"></div>
      <div class="fc-alerts" id="fc-alerts"></div>
      <div class="fc-section">
        <div class="fc-section-title">${t('forecast.monthly_usage')} <span class="fc-section-badge" id="fc-month-count"></span></div>
        <div class="fc-chart-wrap">
          <canvas class="fc-chart" id="fc-chart"></canvas>
          <div class="fc-chart-legend" id="fc-chart-legend"></div>
        </div>
      </div>
      <div class="fc-section" id="fc-depletion-section" style="display:none">
        <div class="fc-section-title">${t('forecast.depletion_timeline', 'Depletion Timeline')}</div>
        <div class="fc-timeline" id="fc-depletion"></div>
      </div>
      <div class="fc-section">
        <div class="fc-section-title">${t('forecast.by_material')} <span class="fc-section-badge" id="fc-type-count"></span></div>
        <div class="fc-materials" id="fc-by-type"></div>
      </div>
      <div class="fc-section" id="fc-cost-section" style="display:none">
        <div class="fc-section-title">${t('forecast.cost_projection', 'Cost Projection')}</div>
        <div class="fc-cost-grid" id="fc-cost"></div>
      </div>
    </div>`;

    _loadForecast();
  };

  async function _loadForecast() {
    const pid = window.printerState?.getActivePrinterId();
    try {
      const [histR, spoolsR] = await Promise.all([
        fetch(`/api/history?limit=1000${pid ? '&printer_id=' + pid : ''}`).then(r => r.json()),
        fetch('/api/inventory/spools').then(r => r.json()).catch(() => [])
      ]);
      const history = Array.isArray(histR) ? histR : [];
      const spools = Array.isArray(spoolsR) ? spoolsR : [];
      _compute(history, spools);
    } catch {
      document.getElementById('fc-heroes').innerHTML = `<div class="fc-empty">
        <div class="fc-empty-icon">\u{1F4CA}</div>
        <div class="fc-empty-text">${t('forecast.load_error')}</div>
      </div>`;
    }
  }

  function _compute(history, spools) {
    const now = new Date();
    const sixMonthsAgo = new Date(now);
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    const threeMonthsAgo = new Date(now);
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

    // Group by month and type
    const monthly = {};
    const byType = {};
    const recentByType = {}; // last 3 months for trend
    let totalPrints = 0;
    let totalFailed = 0;

    for (const p of history) {
      if (!p.filament_used_g || !p.started_at) continue;
      const date = new Date(p.started_at);
      if (date < sixMonthsAgo) continue;
      const key = `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}`;
      monthly[key] = (monthly[key] || 0) + p.filament_used_g;
      totalPrints++;
      if (p.status === 'failed') totalFailed++;

      const type = [...new Set((p.filament_type || 'Unknown').split(';').filter(Boolean))].join(' + ') || 'Unknown';
      if (!byType[type]) byType[type] = { total: 0, count: 0, months: new Set(), cost: 0 };
      byType[type].total += p.filament_used_g;
      byType[type].count++;
      byType[type].months.add(key);

      // Recent trend (last 3 months)
      if (date >= threeMonthsAgo) {
        if (!recentByType[type]) recentByType[type] = 0;
        recentByType[type] += p.filament_used_g;
      }
    }

    // Monthly stats
    const monthKeys = Object.keys(monthly).sort();
    const totalUsage = Object.values(monthly).reduce((s, v) => s + v, 0);
    const avgMonthly = monthKeys.length > 0 ? totalUsage / monthKeys.length : 0;
    const avgWeekly = avgMonthly / 4.33;
    const avgDaily = avgMonthly / 30;

    // Trend: compare last 3 months to first 3 months
    let trend = 'flat';
    let trendPct = 0;
    if (monthKeys.length >= 4) {
      const half = Math.floor(monthKeys.length / 2);
      const firstHalf = monthKeys.slice(0, half).reduce((s, k) => s + monthly[k], 0) / half;
      const secondHalf = monthKeys.slice(half).reduce((s, k) => s + monthly[k], 0) / (monthKeys.length - half);
      if (firstHalf > 0) {
        trendPct = ((secondHalf - firstHalf) / firstHalf) * 100;
        trend = trendPct > 10 ? 'up' : trendPct < -10 ? 'down' : 'flat';
      }
    }

    // Inventory by type
    const activeSpools = spools.filter(s => !s.archived);
    // Real-time remaining helper for forecast
    function _rtRemain(sp) {
      if (typeof window.realtimeFilament === 'function' && sp.printer_id && sp.ams_unit != null && sp.ams_tray != null) {
        const st = window.printerState?.getActivePrinterState?.();
        const amsData = st?.ams || st?.print?.ams;
        if (amsData) {
          const aIdx = amsData.tray_now != null ? parseInt(amsData.tray_now) : -1;
          const sIdx = sp.ams_unit * 4 + sp.ams_tray;
          const rt = window.realtimeFilament({ remainG: sp.remaining_weight_g || 0, totalG: sp.initial_weight_g || 0, isActive: sIdx === aIdx, data: st });
          return rt.currentG;
        }
      }
      return sp.remaining_weight_g || 0;
    }
    const totalStock = activeSpools.reduce((s, sp) => s + _rtRemain(sp), 0);
    const stockByType = {};
    let totalCostPerKg = 0;
    let costCount = 0;
    for (const sp of activeSpools) {
      const type = sp.material || 'Unknown';
      if (!stockByType[type]) stockByType[type] = { weight: 0, count: 0, cost: 0 };
      stockByType[type].weight += _rtRemain(sp);
      stockByType[type].count++;
      if (sp.price && sp.total_weight_g) {
        const cpk = (sp.price / sp.total_weight_g) * 1000;
        stockByType[type].cost = Math.max(stockByType[type].cost, cpk);
        totalCostPerKg += cpk;
        costCount++;
      }
    }
    const avgCostPerKg = costCount > 0 ? totalCostPerKg / costCount : 0;

    const weeksLeft = avgWeekly > 0 ? totalStock / avgWeekly : Infinity;
    const depletionDate = weeksLeft !== Infinity ? new Date(now.getTime() + weeksLeft * 7 * 86400000) : null;

    // Empty state
    if (!monthKeys.length && !activeSpools.length) {
      document.getElementById('fc-heroes').innerHTML = `<div class="fc-empty" style="grid-column:1/-1">
        <div class="fc-empty-icon">\u{1F4CA}</div>
        <div class="fc-empty-text">${t('forecast.no_data')}</div>
        <div class="fc-empty-sub">${t('forecast.no_data_sub', 'Start printing to see usage forecasts')}</div>
      </div>`;
      return;
    }

    // === HERO CARDS ===
    const heroEl = document.getElementById('fc-heroes');
    if (heroEl) {
      const trendHtml = trend !== 'flat'
        ? `<div class="fc-hero-trend ${trend}">${trend === 'up' ? '\u2191' : '\u2193'} ${Math.abs(trendPct).toFixed(0)}%</div>`
        : `<div class="fc-hero-trend flat">\u2192 ${t('forecast.stable', 'Stable')}</div>`;

      heroEl.innerHTML = `
        <div class="fc-hero blue">
          <div class="fc-hero-label">${t('forecast.avg_monthly')}</div>
          <div class="fc-hero-value">${(avgMonthly/1000).toFixed(1)} kg</div>
          <div class="fc-hero-sub">${avgDaily.toFixed(0)}g/${t('forecast.per_day', 'day')}</div>
          ${trendHtml}
        </div>
        <div class="fc-hero ${weeksLeft < 4 ? 'red' : weeksLeft < 8 ? 'amber' : 'green'}">
          <div class="fc-hero-label">${t('forecast.runway')}</div>
          <div class="fc-hero-value">${weeksLeft === Infinity ? '\u221E' : Math.round(weeksLeft)} ${t('forecast.weeks')}</div>
          <div class="fc-hero-sub">${depletionDate ? depletionDate.toLocaleDateString() : t('forecast.at_current_rate')}</div>
        </div>
        <div class="fc-hero green">
          <div class="fc-hero-label">${t('forecast.total_stock')}</div>
          <div class="fc-hero-value">${(totalStock/1000).toFixed(1)} kg</div>
          <div class="fc-hero-sub">${activeSpools.length} ${t('forecast.spools')} \u00B7 ${Object.keys(stockByType).length} ${t('forecast.types', 'types')}</div>
        </div>
        <div class="fc-hero purple">
          <div class="fc-hero-label">${t('forecast.total_prints', 'Total Prints')}</div>
          <div class="fc-hero-value">${totalPrints}</div>
          <div class="fc-hero-sub">${t('forecast.last_6_months')}</div>
        </div>
        <div class="fc-hero amber">
          <div class="fc-hero-label">${t('forecast.avg_weekly')}</div>
          <div class="fc-hero-value">${avgWeekly.toFixed(0)}g</div>
          <div class="fc-hero-sub">${t('forecast.per_week')}</div>
        </div>
        ${avgCostPerKg > 0 ? `<div class="fc-hero blue">
          <div class="fc-hero-label">${t('forecast.monthly_cost', 'Monthly Cost')}</div>
          <div class="fc-hero-value">${((avgMonthly / 1000) * avgCostPerKg).toFixed(0)} kr</div>
          <div class="fc-hero-sub">${avgCostPerKg.toFixed(0)} kr/kg ${t('forecast.avg', 'avg')}</div>
        </div>` : ''}
      `;
    }

    // === ALERTS ===
    const alertsEl = document.getElementById('fc-alerts');
    if (alertsEl) {
      let html = '';
      if (weeksLeft < 2 && weeksLeft !== Infinity) {
        html += `<div class="fc-alert critical"><span class="fc-alert-icon">\u{1F6A8}</span>${t('forecast.critical_stock', 'Critical: Less than 2 weeks of filament remaining!')}</div>`;
      } else if (weeksLeft < 4 && weeksLeft !== Infinity) {
        html += `<div class="fc-alert warning"><span class="fc-alert-icon">\u26A0\uFE0F</span>${t('forecast.low_stock_warning')}</div>`;
      }
      // Per-type alerts
      for (const [type, data] of Object.entries(byType)) {
        const monthlyRate = data.months.size > 0 ? data.total / data.months.size : 0;
        const stock = stockByType[type]?.weight || 0;
        const weeksForType = monthlyRate > 0 ? (stock / (monthlyRate / 4.33)) : Infinity;
        if (weeksForType < 4 && weeksForType !== Infinity && stock > 0) {
          html += `<div class="fc-alert warning"><span class="fc-alert-icon">\u26A0\uFE0F</span><strong>${_esc(type)}</strong>: ~${Math.round(weeksForType)} ${t('forecast.weeks')} ${t('forecast.remaining', 'remaining')} (${(stock/1000).toFixed(1)}kg ${t('forecast.in_stock', 'in stock')})</div>`;
        }
        if (monthlyRate > 0 && stock === 0) {
          html += `<div class="fc-alert critical"><span class="fc-alert-icon">\u{1F6A8}</span><strong>${_esc(type)}</strong>: ${t('forecast.no_stock', 'No stock! You use')} ~${(monthlyRate/1000).toFixed(1)}kg/${t('forecast.month')}</div>`;
        }
      }
      alertsEl.innerHTML = html;
    }

    // === CHART ===
    const monthCountEl = document.getElementById('fc-month-count');
    if (monthCountEl) monthCountEl.textContent = `${monthKeys.length} ${t('forecast.months', 'months')}`;
    _drawChart(monthly, avgMonthly, byType);

    // Legend
    const legendEl = document.getElementById('fc-chart-legend');
    if (legendEl) {
      legendEl.innerHTML = `
        <div class="fc-chart-legend-item"><div class="fc-chart-legend-dot" style="background:rgba(18,121,255,0.7)"></div>${t('forecast.actual', 'Actual')}</div>
        <div class="fc-chart-legend-item"><div class="fc-chart-legend-dot" style="background:rgba(18,121,255,0.3);border:1px dashed var(--accent-blue,#1279ff)"></div>${t('forecast.projected', 'Projected')}</div>
        <div class="fc-chart-legend-item"><div class="fc-chart-legend-dot" style="background:#f59e0b"></div>${t('forecast.avg')}</div>
      `;
    }

    // === DEPLETION TIMELINE ===
    const depSection = document.getElementById('fc-depletion-section');
    const depEl = document.getElementById('fc-depletion');
    const depletionData = [];
    for (const [type, data] of Object.entries(byType)) {
      const monthlyRate = data.months.size > 0 ? data.total / data.months.size : 0;
      const stock = stockByType[type]?.weight || 0;
      const weeks = monthlyRate > 0 ? (stock / (monthlyRate / 4.33)) : Infinity;
      depletionData.push({ type, stock, monthlyRate, weeks });
    }
    depletionData.sort((a, b) => a.weeks - b.weeks);

    if (depEl && depletionData.some(d => d.weeks !== Infinity)) {
      depSection.style.display = '';
      const maxWeeks = Math.max(...depletionData.filter(d => d.weeks !== Infinity).map(d => d.weeks), 12);
      let html = '';
      for (const d of depletionData) {
        const pct = d.weeks !== Infinity ? Math.min(100, (d.weeks / maxWeeks) * 100) : 100;
        const color = d.weeks < 4 ? '#ef4444' : d.weeks < 8 ? '#f59e0b' : '#00ae42';
        const dateStr = d.weeks !== Infinity
          ? new Date(now.getTime() + d.weeks * 7 * 86400000).toLocaleDateString()
          : '\u221E';
        html += `<div class="fc-tl-row">
          <div class="fc-tl-dot" style="background:${_typeColor(d.type)}"></div>
          <div class="fc-tl-name">${_esc(d.type)}</div>
          <div class="fc-tl-bar"><div class="fc-tl-bar-fill" style="width:${pct}%;background:${color}"></div></div>
          <div class="fc-tl-date">${dateStr}</div>
        </div>`;
      }
      depEl.innerHTML = html;
    }

    // === MATERIAL CARDS ===
    const typeEl = document.getElementById('fc-by-type');
    const typeCountEl = document.getElementById('fc-type-count');
    if (typeCountEl) typeCountEl.textContent = `${Object.keys(byType).length} ${t('forecast.types', 'types')}`;

    if (typeEl) {
      const allTypes = new Set([...Object.keys(byType), ...Object.keys(stockByType)]);
      const sorted = [...allTypes].sort((a, b) => {
        const aTotal = (byType[a]?.total || 0);
        const bTotal = (byType[b]?.total || 0);
        return bTotal - aTotal;
      });

      let html = '';
      for (const type of sorted) {
        const data = byType[type] || { total: 0, count: 0, months: new Set() };
        const stock = stockByType[type] || { weight: 0, count: 0 };
        const monthlyRate = data.months.size > 0 ? data.total / data.months.size : 0;
        const weeklyRate = monthlyRate / 4.33;
        const weeksForType = weeklyRate > 0 ? stock.weight / weeklyRate : Infinity;
        const color = _typeColor(type);

        // Status badge
        let badgeClass, badgeText;
        if (stock.weight === 0 && monthlyRate > 0) { badgeClass = 'critical'; badgeText = t('forecast.out_of_stock', 'Out of stock'); }
        else if (weeksForType < 4) { badgeClass = 'low'; badgeText = `~${Math.round(weeksForType)} ${t('forecast.weeks')}`; }
        else if (weeksForType < 8) { badgeClass = 'ok'; badgeText = `~${Math.round(weeksForType)} ${t('forecast.weeks')}`; }
        else if (stock.weight > 0) { badgeClass = 'ok'; badgeText = t('forecast.good', 'Good'); }
        else { badgeClass = 'none'; badgeText = t('forecast.no_stock_short', 'No stock'); }

        // Usage vs stock bar
        const maxBar = Math.max(data.total, stock.weight * (monthKeys.length || 1), 1);
        const usedPct = (data.total / maxBar) * 100;
        const stockPct = ((stock.weight * (monthKeys.length || 1)) / maxBar) * 100;

        html += `<div class="fc-mat-card">
          <div class="fc-mat-header">
            <span class="fc-mat-name">${typeof miniSpool === 'function' ? miniSpool(color, 14) : `<span class="fc-mat-dot" style="background:${color}"></span>`}${_esc(type)}</span>
            <span class="fc-mat-badge ${badgeClass}">${badgeText}</span>
          </div>
          <div class="fc-bar-dual">
            <div class="fc-bar-used" style="width:${usedPct}%;background:${color}"></div>
            <div class="fc-bar-stock" style="width:${stockPct}%;background:${color}"></div>
          </div>
          <div class="fc-mat-rows">
            <div class="fc-mat-row"><span>${t('forecast.total_used')}</span><span>${(data.total/1000).toFixed(2)} kg</span></div>
            <div class="fc-mat-row"><span>${t('forecast.in_stock', 'In stock')}</span><span>${(stock.weight/1000).toFixed(2)} kg (${stock.count})</span></div>
            <div class="fc-mat-row"><span>${t('forecast.monthly_rate', 'Monthly rate')}</span><span>${monthlyRate > 0 ? (monthlyRate/1000).toFixed(2) + ' kg' : '-'}</span></div>
            <div class="fc-mat-row"><span>${t('forecast.print_count')}</span><span>${data.count}</span></div>
          </div>
        </div>`;
      }
      typeEl.innerHTML = html || `<div style="color:var(--text-muted);font-size:0.8rem;grid-column:1/-1;text-align:center;padding:20px">${t('forecast.no_data')}</div>`;
    }

    // === COST PROJECTION ===
    if (avgCostPerKg > 0) {
      const costSection = document.getElementById('fc-cost-section');
      const costEl = document.getElementById('fc-cost');
      if (costSection) costSection.style.display = '';
      if (costEl) {
        const monthlyCost = (avgMonthly / 1000) * avgCostPerKg;
        costEl.innerHTML = `
          <div class="fc-cost-card">
            <div class="fc-cost-label">${t('forecast.monthly_est', 'Monthly Est.')}</div>
            <div class="fc-cost-value">${monthlyCost.toFixed(0)} kr</div>
            <div class="fc-cost-sub">${t('forecast.based_on_avg', 'Based on avg usage')}</div>
          </div>
          <div class="fc-cost-card">
            <div class="fc-cost-label">${t('forecast.quarterly_est', 'Quarterly Est.')}</div>
            <div class="fc-cost-value">${(monthlyCost * 3).toFixed(0)} kr</div>
            <div class="fc-cost-sub">3 ${t('forecast.months', 'months')}</div>
          </div>
          <div class="fc-cost-card">
            <div class="fc-cost-label">${t('forecast.yearly_est', 'Yearly Est.')}</div>
            <div class="fc-cost-value">${(monthlyCost * 12).toFixed(0)} kr</div>
            <div class="fc-cost-sub">12 ${t('forecast.months', 'months')}</div>
          </div>
          <div class="fc-cost-card">
            <div class="fc-cost-label">${t('forecast.stock_value', 'Stock Value')}</div>
            <div class="fc-cost-value">${((totalStock / 1000) * avgCostPerKg).toFixed(0)} kr</div>
            <div class="fc-cost-sub">${(totalStock/1000).toFixed(1)} kg</div>
          </div>
        `;
      }
    }
  }

  function _drawChart(monthly, avg, byType) {
    const canvas = document.getElementById('fc-chart');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, rect.width, rect.height);

    const _css = (v, fb) => getComputedStyle(document.documentElement).getPropertyValue(v).trim() || fb;
    const keys = Object.keys(monthly).sort();
    if (!keys.length) {
      ctx.fillStyle = _css('--text-muted', '#999');
      ctx.font = '13px Inter';
      ctx.textAlign = 'center';
      ctx.fillText(t('forecast.no_data'), rect.width/2, rect.height/2);
      return;
    }

    // Add 3 forecast months
    const lastMonth = new Date(keys[keys.length-1] + '-01');
    const forecast = {};
    for (let i = 1; i <= 3; i++) {
      const d = new Date(lastMonth);
      d.setMonth(d.getMonth() + i);
      const k = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
      forecast[k] = avg;
    }
    const allKeys = [...keys, ...Object.keys(forecast)];
    const allValues = [...keys.map(k => monthly[k]), ...Object.values(forecast)];
    const maxVal = Math.max(...allValues, 1) * 1.1;

    const pad = { l: 52, r: 16, t: 16, b: 32 };
    const w = rect.width - pad.l - pad.r;
    const h = rect.height - pad.t - pad.b;
    const barW = Math.min(32, w / allKeys.length - 6);

    // Grid lines
    ctx.strokeStyle = 'rgba(128,128,128,0.08)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const y = pad.t + h - (i / 4) * h;
      ctx.beginPath(); ctx.moveTo(pad.l, y); ctx.lineTo(rect.width - pad.r, y); ctx.stroke();
    }

    // Bars
    for (let i = 0; i < allKeys.length; i++) {
      const val = i < keys.length ? monthly[allKeys[i]] : forecast[allKeys[i]];
      const x = pad.l + (i + 0.5) * (w / allKeys.length);
      const barH = (val / maxVal) * h;
      const isForecast = i >= keys.length;

      // Bar shadow
      if (!isForecast) {
        ctx.fillStyle = 'rgba(18,121,255,0.05)';
        ctx.fillRect(x - barW/2 + 2, pad.t + h - barH + 2, barW, barH);
      }

      // Bar fill with gradient
      if (isForecast) {
        ctx.fillStyle = 'rgba(18,121,255,0.15)';
        ctx.fillRect(x - barW/2, pad.t + h - barH, barW, barH);
        ctx.setLineDash([3, 3]);
        ctx.strokeStyle = 'rgba(18,121,255,0.5)';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(x - barW/2, pad.t + h - barH, barW, barH);
        ctx.setLineDash([]);
      } else {
        const grad = ctx.createLinearGradient(0, pad.t + h - barH, 0, pad.t + h);
        grad.addColorStop(0, 'rgba(18,121,255,0.8)');
        grad.addColorStop(1, 'rgba(18,121,255,0.5)');
        ctx.fillStyle = grad;
        // Rounded top
        const r = Math.min(4, barW / 2);
        ctx.beginPath();
        ctx.moveTo(x - barW/2, pad.t + h);
        ctx.lineTo(x - barW/2, pad.t + h - barH + r);
        ctx.quadraticCurveTo(x - barW/2, pad.t + h - barH, x - barW/2 + r, pad.t + h - barH);
        ctx.lineTo(x + barW/2 - r, pad.t + h - barH);
        ctx.quadraticCurveTo(x + barW/2, pad.t + h - barH, x + barW/2, pad.t + h - barH + r);
        ctx.lineTo(x + barW/2, pad.t + h);
        ctx.fill();
      }

      // Value on top
      ctx.fillStyle = _css('--text-muted', '#999');
      ctx.font = '9px Inter';
      ctx.textAlign = 'center';
      if (val > maxVal * 0.05) {
        ctx.fillText((val/1000).toFixed(1), x, pad.t + h - barH - 4);
      }

      // Month label
      ctx.fillStyle = isForecast ? 'rgba(18,121,255,0.5)' : _css('--text-muted', '#999');
      ctx.font = isForecast ? 'italic 10px Inter' : '10px Inter';
      ctx.fillText(allKeys[i].substring(5), x, rect.height - 10);
    }

    // Y axis labels
    ctx.fillStyle = _css('--text-muted', '#999');
    ctx.font = '10px Inter';
    ctx.textAlign = 'right';
    for (let i = 0; i <= 4; i++) {
      const v = (maxVal / 4 * i);
      const y = pad.t + h - (i / 4) * h;
      ctx.fillText((v / 1000).toFixed(1) + 'kg', pad.l - 6, y + 3);
    }

    // Average line
    const avgY = pad.t + h - (avg / maxVal) * h;
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([5, 5]);
    ctx.beginPath(); ctx.moveTo(pad.l, avgY); ctx.lineTo(rect.width - pad.r, avgY); ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = '#f59e0b';
    ctx.font = '600 10px Inter';
    ctx.textAlign = 'left';
    ctx.fillText(`${t('forecast.avg')} ${(avg/1000).toFixed(1)}kg`, pad.l + 4, avgY - 6);
  }

  const TYPE_COLORS = {
    PLA: '#1279ff', PETG: '#00ae42', ABS: '#e53935', TPU: '#8b5cf6',
    ASA: '#f59e0b', PA: '#06b6d4', PC: '#ec4899', PVA: '#94a3b8',
    HIPS: '#a78bfa', WOOD: '#92400e', 'PLA+': '#3b82f6', 'PLA-CF': '#374151',
    'PETG-CF': '#065f46', 'PA-CF': '#164e63', SILK: '#e879f9'
  };
  function _typeColor(type) { return TYPE_COLORS[type?.toUpperCase()] || '#888'; }
  function _esc(s) { const d = document.createElement('div'); d.textContent = s || ''; return d.innerHTML; }
})();
