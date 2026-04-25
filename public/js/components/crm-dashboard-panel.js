// CRM Dashboard Panel — Overview stats, revenue chart, orders by status, top customers, recent activity
(function() {
  'use strict';

  function _esc(s) { const d = document.createElement('div'); d.textContent = s || ''; return d.innerHTML; }
  function _tl(key, fb) { return (typeof window.t === 'function' ? window.t(key) : '') || fb; }

  function formatCurrency(val, currency) {
    if (val === null || val === undefined) return '--';
    if (currency && typeof window.currency !== 'undefined') return window.currency.format(Number(val), currency);
    if (typeof window.formatCurrency === 'function') return window.formatCurrency(Number(val));
    return Number(val).toFixed(2);
  }
  function formatDate(iso) {
    if (!iso) return '--';
    const locale = (window.i18n?.getLocale() || 'nb').replace('_', '-');
    return new Date(iso).toLocaleDateString(locale, { day: '2-digit', month: '2-digit', year: 'numeric' });
  }

  const STATUS_COLORS = {
    draft: '#94a3b8', pending: '#f59e0b', printing: '#3b82f6',
    completed: '#22c55e', shipped: '#8b5cf6', cancelled: '#ef4444',
    confirmed: '#06b6d4', in_progress: '#f97316'
  };


  async function fetchDashboard() {
    try {
      const r = await fetch('/api/crm/dashboard');
      if (!r.ok) throw new Error('Failed');
      return r.json();
    } catch {
      return {
        total_orders: 0, total_revenue: 0, revenue_this_month: 0,
        pending_orders: 0, total_customers: 0, unpaid_invoices: 0,
        recent_orders: [], revenue_chart: [], orders_by_status: [],
        top_customers: [], recent_activity: []
      };
    }
  }

  function renderStatsCards(data) {
    const cards = [
      { key: 'crm.total_orders', fallback: 'Totale ordrer', value: data.total_orders || 0, icon: 'bi-receipt', color: 'var(--accent-blue)' },
      { key: 'crm.revenue_this_month', fallback: 'Inntekt denne mnd', value: formatCurrency(data.revenue_this_month), icon: 'bi-graph-up-arrow', color: 'var(--accent-green)' },
      { key: 'crm.pending_orders', fallback: 'Ventende', value: data.pending_orders || 0, icon: 'bi-hourglass-split', color: 'var(--accent-orange)' },
      { key: 'crm.unpaid_invoices', fallback: 'Ubetalte fakturaer', value: data.unpaid_invoices || 0, icon: 'bi-exclamation-triangle', color: '#ef4444' },
      { key: 'crm.total_customers', fallback: 'Kunder', value: data.total_customers || 0, icon: 'bi-people', color: 'var(--accent-purple, #8b5cf6)' }
    ];

    return '<div class="stats-strip" style="margin-bottom:1rem">' +
      cards.map(c =>
        `<div class="spark-panel">
          <span class="spark-label"><i class="bi ${c.icon}" style="margin-right:4px"></i>${_esc(_tl(c.key, c.fallback))}</span>
          <span class="spark-value" style="color:${c.color}">${_esc(String(c.value))}</span>
        </div>`
      ).join('') +
    '</div>';
  }

  function renderRevenueChart(chartData) {
    if (!chartData || chartData.length === 0) return '';

    const maxVal = Math.max(...chartData.map(d => d.revenue || 0), 1);
    const barHeight = 140;

    const bars = chartData.map(d => {
      const pct = ((d.revenue || 0) / maxVal) * 100;
      const h = Math.max(2, (pct / 100) * barHeight);
      return `<div style="display:flex;flex-direction:column;align-items:center;flex:1;min-width:50px">
        <span style="font-size:0.7rem;margin-bottom:4px;opacity:0.7">${_esc(formatCurrency(d.revenue))}</span>
        <div style="width:70%;height:${barHeight}px;display:flex;align-items:flex-end">
          <div style="width:100%;height:${h}px;background:linear-gradient(180deg, var(--accent-blue), #1d4ed8);border-radius:4px 4px 0 0;transition:height 0.3s"></div>
        </div>
        <span style="font-size:0.75rem;margin-top:6px;font-weight:500">${_esc(d.month || '')}</span>
      </div>`;
    }).join('');

    return `<div class="card">
      <div class="card-header"><h3 class="card-title"><i class="bi bi-bar-chart" style="margin-right:6px"></i>${_esc(_tl('crm.revenue_chart', 'Inntekt siste 6 maneder'))}</h3></div>
      <div class="card-body">
        <div style="display:flex;gap:4px;align-items:flex-end;padding:0.5rem 0">${bars}</div>
      </div>
    </div>`;
  }

  function renderOrdersByStatus(statusData) {
    if (!statusData || statusData.length === 0) return '';

    const total = statusData.reduce((sum, s) => sum + (s.count || 0), 0);
    if (total === 0) return '';

    const items = statusData.map(s => {
      const pct = ((s.count || 0) / total * 100).toFixed(1);
      const color = STATUS_COLORS[s.status] || '#94a3b8';
      const label = _tl('crm.status_' + s.status, s.status);
      return `<div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">
        <span style="width:90px;font-size:0.85rem">${_esc(label)}</span>
        <div style="flex:1;height:20px;background:rgba(0,0,0,0.05);border-radius:4px;overflow:hidden">
          <div style="height:100%;width:${pct}%;background:${color};border-radius:4px;transition:width 0.4s"></div>
        </div>
        <span style="min-width:50px;text-align:right;font-size:0.85rem;font-weight:600">${s.count}</span>
      </div>`;
    }).join('');

    return `<div class="card">
      <div class="card-header"><h3 class="card-title"><i class="bi bi-pie-chart" style="margin-right:6px"></i>${_esc(_tl('crm.orders_by_status', 'Ordrer etter status'))}</h3></div>
      <div class="card-body">${items}</div>
    </div>`;
  }

  function renderTopCustomers(customers) {
    if (!customers || customers.length === 0) return '';

    const rows = customers.map((c, i) => {
      return `<tr>
        <td style="font-weight:600">${i + 1}.</td>
        <td>${_esc(c.name)}${c.company ? ` <small style="opacity:0.6">(${_esc(c.company)})</small>` : ''}</td>
        <td style="text-align:center">${c.order_count || 0}</td>
        <td style="text-align:right;font-weight:600">${formatCurrency(c.revenue)}</td>
      </tr>`;
    }).join('');

    return `<div class="card">
      <div class="card-header"><h3 class="card-title"><i class="bi bi-trophy" style="margin-right:6px"></i>${_esc(_tl('crm.top_customers', 'Topp 5 kunder'))}</h3></div>
      <div class="card-body" style="padding:0">
        <table class="table table-sm" style="margin:0">
          <thead><tr>
            <th style="width:30px">#</th>
            <th>${_esc(_tl('crm.customer_name', 'Kunde'))}</th>
            <th style="text-align:center">${_esc(_tl('crm.total_orders', 'Ordrer'))}</th>
            <th style="text-align:right">${_esc(_tl('crm.total_revenue', 'Inntekt'))}</th>
          </tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    </div>`;
  }

  function renderRecentActivity(activity) {
    if (!activity || activity.length === 0) return '';

    const items = activity.map(a => {
      const isOrder = a.type === 'order';
      const icon = isOrder ? 'bi-receipt' : 'bi-file-earmark-text';
      const iconColor = isOrder ? 'var(--accent-blue)' : 'var(--accent-green)';
      const statusKey = isOrder ? 'crm.status_' + a.status : 'crm.inv_status_' + a.status;
      const typeLabel = isOrder ? _tl('crm.orders', 'Ordre') : _tl('crm.invoices', 'Faktura');

      return `<div style="display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid rgba(0,0,0,0.05)">
        <i class="bi ${icon}" style="font-size:1.1rem;color:${iconColor}"></i>
        <div style="flex:1;min-width:0">
          <div style="font-weight:600;font-size:0.85rem">${_esc(a.ref_number)}</div>
          <div style="font-size:0.75rem;opacity:0.6">${_esc(a.customer_name || '--')} &middot; ${_esc(typeLabel)}</div>
        </div>
        <span class="badge badge-status badge-status-${a.status}" style="font-size:0.7rem">${_esc(_tl(statusKey, a.status))}</span>
        <span style="min-width:80px;text-align:right;font-size:0.85rem;font-weight:500">${formatCurrency(a.amount)}</span>
        <span style="min-width:70px;text-align:right;font-size:0.75rem;opacity:0.6">${formatDate(a.created_at)}</span>
      </div>`;
    }).join('');

    return `<div class="card">
      <div class="card-header"><h3 class="card-title"><i class="bi bi-activity" style="margin-right:6px"></i>${_esc(_tl('crm.recent_activity', 'Siste aktivitet'))}</h3></div>
      <div class="card-body" style="padding:0.5rem 1rem">${items}</div>
    </div>`;
  }

  async function loadCrmDashboardPanel() {
    const body = document.getElementById('overlay-panel-body');
    if (!body) return;

    body.innerHTML = `<div style="text-align:center;padding:2rem;opacity:0.6">${_tl('common.loading')}</div>`;

    const data = await fetchDashboard();

    let html = renderStatsCards(data);
    html += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem">';
    html += renderRevenueChart(data.revenue_chart || []);
    html += renderOrdersByStatus(data.orders_by_status || []);
    html += '</div>';
    html += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;margin-top:1rem">';
    html += renderTopCustomers(data.top_customers || []);
    html += renderRecentActivity(data.recent_activity || []);
    html += '</div>';

    body.innerHTML = html;
  }

  window.loadCrmDashboardPanel = loadCrmDashboardPanel;
})();
