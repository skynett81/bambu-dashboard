// Filament Usage Forecast — predict filament consumption
(function() {
  window.loadForecastPanel = function() {
    const el = document.getElementById('overlay-panel-body');
    if (!el) return;

    el.innerHTML = `<style>
      .fc-container { max-width:1000px; }
      .fc-summary { display:grid; grid-template-columns:repeat(auto-fill, minmax(200px, 1fr)); gap:12px; margin-bottom:20px; }
      .fc-card { background:var(--bg-secondary); border:1px solid var(--border-color); border-radius:var(--radius); padding:16px; }
      .fc-card-label { font-size:0.7rem; color:var(--text-muted); font-weight:600; text-transform:uppercase; }
      .fc-card-value { font-size:1.5rem; font-weight:800; margin-top:4px; }
      .fc-card-sub { font-size:0.72rem; color:var(--text-muted); margin-top:2px; }
      .fc-chart-wrap { background:var(--bg-secondary); border:1px solid var(--border-color); border-radius:var(--radius); padding:16px; margin-bottom:16px; }
      .fc-chart-wrap h4 { margin:0 0 12px; font-size:0.85rem; }
      .fc-chart { width:100%; height:200px; }
      .fc-by-type { display:grid; grid-template-columns:repeat(auto-fill, minmax(250px, 1fr)); gap:12px; }
      .fc-type-card { background:var(--bg-secondary); border:1px solid var(--border-color); border-radius:var(--radius); padding:14px; }
      .fc-type-header { display:flex; justify-content:space-between; align-items:center; margin-bottom:8px; }
      .fc-type-name { font-weight:700; font-size:0.9rem; }
      .fc-type-rate { font-size:0.75rem; color:var(--text-muted); }
      .fc-bar { height:8px; background:var(--bg-tertiary); border-radius:4px; overflow:hidden; margin:6px 0; }
      .fc-bar-fill { height:100%; border-radius:4px; }
      .fc-type-row { display:flex; justify-content:space-between; font-size:0.75rem; padding:3px 0; }
      .fc-type-row span:first-child { color:var(--text-muted); }
      .fc-type-row span:last-child { font-weight:600; }
      .fc-alert { background:rgba(245,158,11,0.08); border:1px solid rgba(245,158,11,0.2); border-radius:var(--radius); padding:12px 14px; margin-bottom:16px; display:flex; align-items:center; gap:10px; }
      .fc-alert-icon { font-size:1.2rem; }
      .fc-alert-text { font-size:0.8rem; }
    </style>
    <div class="fc-container">
      <div class="fc-summary" id="fc-summary"></div>
      <div id="fc-alerts"></div>
      <div class="fc-chart-wrap">
        <h4>${t('forecast.monthly_usage')}</h4>
        <canvas class="fc-chart" id="fc-chart"></canvas>
      </div>
      <h4 style="margin:0 0 12px;font-size:0.9rem">${t('forecast.by_material')}</h4>
      <div class="fc-by-type" id="fc-by-type"></div>
    </div>`;

    _loadForecast();
  };

  async function _loadForecast() {
    const pid = window.printerState?.getActivePrinterId();
    try {
      const [histR, spoolsR] = await Promise.all([
        fetch(`/api/history?limit=500${pid ? '&printer_id=' + pid : ''}`).then(r => r.json()),
        fetch('/api/inventory/spools').then(r => r.json()).catch(() => [])
      ]);
      const history = Array.isArray(histR) ? histR : [];
      const spools = Array.isArray(spoolsR) ? spoolsR : [];
      _compute(history, spools);
    } catch {
      document.getElementById('fc-summary').innerHTML = `<div style="padding:40px;text-align:center;color:var(--text-muted)">${t('forecast.load_error')}</div>`;
    }
  }

  function _compute(history, spools) {
    // Group usage by month
    const monthly = {};
    const byType = {};
    const now = new Date();
    const sixMonthsAgo = new Date(now);
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    for (const p of history) {
      if (!p.filament_used_g || !p.started_at) continue;
      const date = new Date(p.started_at);
      if (date < sixMonthsAgo) continue;
      const key = `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}`;
      monthly[key] = (monthly[key] || 0) + p.filament_used_g;
      const type = p.filament_type || 'Unknown';
      if (!byType[type]) byType[type] = { total: 0, count: 0, months: new Set() };
      byType[type].total += p.filament_used_g;
      byType[type].count++;
      byType[type].months.add(key);
    }

    // Calculate averages
    const monthKeys = Object.keys(monthly).sort();
    const totalUsage = Object.values(monthly).reduce((s, v) => s + v, 0);
    const avgMonthly = monthKeys.length > 0 ? totalUsage / monthKeys.length : 0;
    const avgWeekly = avgMonthly / 4.33;

    // Inventory
    const totalStock = spools.filter(s => !s.archived).reduce((s, sp) => s + (sp.remaining_weight_g || 0), 0);
    const weeksLeft = avgWeekly > 0 ? totalStock / avgWeekly : Infinity;

    // Render summary
    const summaryEl = document.getElementById('fc-summary');
    if (summaryEl) {
      summaryEl.innerHTML = `
        <div class="fc-card"><div class="fc-card-label">${t('forecast.avg_monthly')}</div><div class="fc-card-value">${(avgMonthly/1000).toFixed(1)} kg</div><div class="fc-card-sub">${t('forecast.last_6_months')}</div></div>
        <div class="fc-card"><div class="fc-card-label">${t('forecast.avg_weekly')}</div><div class="fc-card-value">${avgWeekly.toFixed(0)}g</div><div class="fc-card-sub">${t('forecast.per_week')}</div></div>
        <div class="fc-card"><div class="fc-card-label">${t('forecast.total_stock')}</div><div class="fc-card-value">${(totalStock/1000).toFixed(1)} kg</div><div class="fc-card-sub">${spools.filter(s => !s.archived).length} ${t('forecast.spools')}</div></div>
        <div class="fc-card"><div class="fc-card-label">${t('forecast.runway')}</div><div class="fc-card-value" style="color:${weeksLeft < 4 ? 'var(--accent-red)' : weeksLeft < 8 ? '#f59e0b' : 'var(--accent-green)'}">${weeksLeft === Infinity ? '\u221E' : Math.round(weeksLeft)} ${t('forecast.weeks')}</div><div class="fc-card-sub">${t('forecast.at_current_rate')}</div></div>
      `;
    }

    // Alerts
    const alertsEl = document.getElementById('fc-alerts');
    if (alertsEl) {
      let alertHtml = '';
      if (weeksLeft < 4 && weeksLeft !== Infinity) alertHtml += `<div class="fc-alert"><span class="fc-alert-icon">\u26A0</span><span class="fc-alert-text">${t('forecast.low_stock_warning')}</span></div>`;
      alertsEl.innerHTML = alertHtml;
    }

    // Chart
    _drawChart(monthly, avgMonthly);

    // By type
    const typeEl = document.getElementById('fc-by-type');
    if (typeEl) {
      const maxTotal = Math.max(...Object.values(byType).map(v => v.total), 1);
      let html = '';
      const sorted = Object.entries(byType).sort((a, b) => b[1].total - a[1].total);
      for (const [type, data] of sorted) {
        const monthlyAvg = data.months.size > 0 ? data.total / data.months.size : 0;
        const pct = (data.total / maxTotal * 100);
        const color = _typeColor(type);
        html += `<div class="fc-type-card">
          <div class="fc-type-header"><span class="fc-type-name">${_esc(type)}</span><span class="fc-type-rate">${monthlyAvg.toFixed(0)}g/${t('forecast.month')}</span></div>
          <div class="fc-bar"><div class="fc-bar-fill" style="width:${pct}%;background:${color}"></div></div>
          <div class="fc-type-row"><span>${t('forecast.total_used')}</span><span>${(data.total/1000).toFixed(2)} kg</span></div>
          <div class="fc-type-row"><span>${t('forecast.print_count')}</span><span>${data.count}</span></div>
        </div>`;
      }
      typeEl.innerHTML = html || `<div style="color:var(--text-muted);font-size:0.8rem">${t('forecast.no_data')}</div>`;
    }
  }

  function _drawChart(monthly, avg) {
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
    if (!keys.length) { ctx.fillStyle = _css('--text-muted', '#999'); ctx.font = '13px Inter'; ctx.textAlign = 'center'; ctx.fillText(t('forecast.no_data'), rect.width/2, rect.height/2); return; }

    // Add forecast months
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
    const maxVal = Math.max(...allValues, 1);

    const pad = { l: 50, r: 16, t: 16, b: 30 };
    const w = rect.width - pad.l - pad.r;
    const h = rect.height - pad.t - pad.b;
    const barW = Math.min(30, w / allKeys.length - 4);

    for (let i = 0; i < allKeys.length; i++) {
      const val = i < keys.length ? monthly[allKeys[i]] : forecast[allKeys[i]];
      const x = pad.l + (i + 0.5) * (w / allKeys.length);
      const barH = (val / maxVal) * h;
      const isForecast = i >= keys.length;
      ctx.fillStyle = isForecast ? 'rgba(18,121,255,0.3)' : 'rgba(18,121,255,0.7)';
      ctx.fillRect(x - barW / 2, pad.t + h - barH, barW, barH);
      if (isForecast) {
        ctx.setLineDash([3, 3]);
        ctx.strokeStyle = _css('--accent-blue', '#1279ff');
        ctx.strokeRect(x - barW / 2, pad.t + h - barH, barW, barH);
        ctx.setLineDash([]);
      }
      // Label
      ctx.fillStyle = _css('--text-muted', '#999');
      ctx.font = '10px Inter';
      ctx.textAlign = 'center';
      ctx.fillText(allKeys[i].substring(5), x, rect.height - 8);
    }

    // Y axis
    ctx.fillStyle = _css('--text-muted', '#999');
    ctx.font = '10px Inter';
    ctx.textAlign = 'right';
    for (let i = 0; i <= 4; i++) {
      const v = (maxVal / 4 * i);
      const y = pad.t + h - (i / 4) * h;
      ctx.fillText((v / 1000).toFixed(1) + 'kg', pad.l - 6, y + 3);
      ctx.strokeStyle = 'rgba(0,0,0,0.05)';
      ctx.beginPath(); ctx.moveTo(pad.l, y); ctx.lineTo(rect.width - pad.r, y); ctx.stroke();
    }

    // Avg line
    const avgY = pad.t + h - (avg / maxVal) * h;
    ctx.strokeStyle = '#f59e0b';
    ctx.setLineDash([5, 5]);
    ctx.beginPath(); ctx.moveTo(pad.l, avgY); ctx.lineTo(rect.width - pad.r, avgY); ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = '#f59e0b';
    ctx.font = '10px Inter';
    ctx.textAlign = 'left';
    ctx.fillText(t('forecast.avg'), rect.width - pad.r + 4, avgY + 3);
  }

  const TYPE_COLORS = { PLA: '#1279ff', PETG: '#00ae42', ABS: '#e53935', TPU: '#8b5cf6', ASA: '#f59e0b', PA: '#06b6d4', PC: '#ec4899' };
  function _typeColor(type) { return TYPE_COLORS[type?.toUpperCase()] || '#888'; }
  function _esc(s) { const d = document.createElement('div'); d.textContent = s || ''; return d.innerHTML; }
})();
