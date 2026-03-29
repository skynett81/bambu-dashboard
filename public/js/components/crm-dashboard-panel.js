// CRM Dashboard Panel — Overview stats, recent orders, revenue chart
(function() {
  'use strict';

  function _esc(s) { const d = document.createElement('div'); d.textContent = s || ''; return d.innerHTML; }
  function _tl(key, fb) { return (typeof window.t === 'function' ? window.t(key) : '') || fb; }

  function formatCurrency(val, currency) {
    if (val === null || val === undefined) return '--';
    return Number(val).toFixed(2) + ' ' + (currency || 'NOK');
  }
  function formatDate(iso) {
    if (!iso) return '--';
    const locale = (window.i18n?.getLocale() || 'nb').replace('_', '-');
    return new Date(iso).toLocaleDateString(locale, { day: '2-digit', month: '2-digit', year: 'numeric' });
  }

  const STATUS_COLORS = {
    draft: '#94a3b8', pending: '#f59e0b', printing: '#3b82f6',
    completed: '#22c55e', shipped: '#8b5cf6', cancelled: '#ef4444'
  };

  async function fetchDashboard() {
    try {
      const r = await fetch('/api/crm/dashboard');
      if (!r.ok) throw new Error('Failed');
      return r.json();
    } catch {
      return { total_orders: 0, total_revenue: 0, pending_orders: 0, total_customers: 0, recent_orders: [], revenue_chart: [] };
    }
  }

  function renderStatsCards(data) {
    const cards = [
      { key: 'crm.total_orders', fallback: 'Totale ordrer', value: data.total_orders || 0, color: 'var(--accent-blue)' },
      { key: 'crm.total_revenue', fallback: 'Total inntekt', value: formatCurrency(data.total_revenue), color: 'var(--accent-green)' },
      { key: 'crm.pending_orders', fallback: 'Ventende', value: data.pending_orders || 0, color: 'var(--accent-orange)' },
      { key: 'crm.total_customers', fallback: 'Kunder', value: data.total_customers || 0, color: 'var(--accent-purple, #8b5cf6)' }
    ];

    return '<div class="stats-strip" style="margin-bottom:1rem">' +
      cards.map(c =>
        `<div class="spark-panel">
          <span class="spark-label">${_esc(_tl(c.key, c.fallback))}</span>
          <span class="spark-value" style="color:${c.color}">${_esc(String(c.value))}</span>
        </div>`
      ).join('') +
    '</div>';
  }

  function renderRecentOrders(orders) {
    if (!orders || orders.length === 0) {
      return `<div class="card"><div class="card-body" style="text-align:center;padding:2rem;opacity:0.6">
        ${_esc(_tl('crm.no_orders', 'Ingen ordrer ennå'))}
      </div></div>`;
    }

    let rows = orders.map(o => {
      const statusColor = STATUS_COLORS[o.status] || '#94a3b8';
      return `<tr>
        <td><strong>${_esc(o.order_number)}</strong></td>
        <td>${_esc(o.customer_name || '--')}</td>
        <td><span class="badge" style="background:${statusColor};color:#fff;font-size:0.75rem;padding:2px 8px;border-radius:4px">${_esc(_tl('crm.status_' + o.status, o.status))}</span></td>
        <td style="text-align:right">${_esc(formatCurrency(o.total))}</td>
        <td>${_esc(formatDate(o.created_at))}</td>
      </tr>`;
    }).join('');

    return `<div class="card">
      <div class="card-header"><h3 class="card-title">${_esc(_tl('crm.recent_orders', 'Siste ordrer'))}</h3></div>
      <div class="card-body" style="padding:0">
        <table class="table table-hover table-sm" style="margin:0">
          <thead><tr>
            <th>#</th>
            <th>${_esc(_tl('crm.customer_name', 'Kunde'))}</th>
            <th>${_esc(_tl('crm.status', 'Status'))}</th>
            <th style="text-align:right">${_esc(_tl('crm.total', 'Total'))}</th>
            <th>${_esc(_tl('crm.created', 'Opprettet'))}</th>
          </tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    </div>`;
  }

  function renderRevenueChart(chartData) {
    if (!chartData || chartData.length === 0) return '';

    const maxVal = Math.max(...chartData.map(d => d.revenue || 0), 1);
    const barHeight = 120;

    const bars = chartData.map(d => {
      const pct = ((d.revenue || 0) / maxVal) * 100;
      const h = Math.max(2, (pct / 100) * barHeight);
      return `<div style="display:flex;flex-direction:column;align-items:center;flex:1;min-width:40px">
        <span style="font-size:0.7rem;margin-bottom:4px;opacity:0.7">${_esc(formatCurrency(d.revenue))}</span>
        <div style="width:70%;height:${barHeight}px;display:flex;align-items:flex-end">
          <div style="width:100%;height:${h}px;background:var(--accent-blue);border-radius:4px 4px 0 0;transition:height 0.3s"></div>
        </div>
        <span style="font-size:0.7rem;margin-top:4px;opacity:0.7">${_esc(d.month || '')}</span>
      </div>`;
    }).join('');

    return `<div class="card">
      <div class="card-header"><h3 class="card-title">${_esc(_tl('crm.revenue_chart', 'Inntekt siste 6 måneder'))}</h3></div>
      <div class="card-body">
        <div style="display:flex;gap:4px;align-items:flex-end;padding:0.5rem 0">${bars}</div>
      </div>
    </div>`;
  }

  async function loadCrmDashboardPanel() {
    const body = document.getElementById('overlay-panel-body');
    if (!body) return;

    const data = await fetchDashboard();

    let html = renderStatsCards(data);
    html += '<div style="display:grid;grid-template-columns:1fr;gap:1rem">';
    html += renderRevenueChart(data.revenue_chart || []);
    html += renderRecentOrders(data.recent_orders || []);
    html += '</div>';

    body.innerHTML = html;
  }

  window.loadCrmDashboardPanel = loadCrmDashboardPanel;
})();
