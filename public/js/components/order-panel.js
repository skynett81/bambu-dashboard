// Order Management Panel — project/order tracking, invoicing, customer management
(function() {
  'use strict';

  let _activeTab = 'overview';
  let _dashboard = null;
  let _projects = [];
  let _activeProject = null;
  let _invoices = [];

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
  function formatDateTime(iso) {
    if (!iso) return '--';
    const locale = (window.i18n?.getLocale() || 'nb').replace('_', '-');
    return new Date(iso).toLocaleDateString(locale, { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  }
  function isOverdue(deadline) { return deadline ? new Date(deadline) < new Date() : false; }

  // Tab bar
  const TABS = [
    { id: 'overview', labelKey: 'orders.tab_overview', fallback: 'Oversikt' },
    { id: 'orders', labelKey: 'orders.tab_orders', fallback: 'Bestillinger' },
    { id: 'invoices', labelKey: 'orders.tab_invoices', fallback: 'Fakturaer' }
  ];

  function _tabBarHtml() {
    return '<div class="tabs _wrapper-tabs">' + TABS.map(tab => {
      const label = _tl(tab.labelKey, tab.fallback);
      const active = _activeTab === tab.id ? ' active' : '';
      return `<button class="tab-btn${active}" onclick="_orderSwitchTab('${tab.id}')">${label}</button>`;
    }).join('') + '</div>';
  }
  function _ensureTabBar() {
    const body = document.getElementById('overlay-panel-body');
    if (!body) return;
    const old = body.querySelector('._wrapper-tabs');
    if (old) old.remove();
    body.insertAdjacentHTML('afterbegin', _tabBarHtml());
  }

  // API
  async function fetchDashboard() { const r = await fetch('/api/projects/dashboard'); return r.ok ? r.json() : { active_orders: 0, overdue_count: 0, revenue_this_month: 0, avg_order_value: 0, upcoming_deadlines: [], recent_activity: [] }; }
  async function fetchProjects(status) { const q = status ? '?status=' + encodeURIComponent(status) : ''; const r = await fetch('/api/projects' + q); return r.ok ? r.json() : []; }
  async function fetchProjectDetails(id) { const r = await fetch('/api/projects/' + id + '/details'); if (!r.ok) throw new Error('Failed'); return r.json(); }
  async function fetchCostSummary(id) { const r = await fetch('/api/projects/' + id + '/cost-summary'); return r.ok ? r.json() : null; }
  async function apiCreateProject(data) { const r = await fetch('/api/projects', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }); if (!r.ok) throw new Error('Failed'); return r.json(); }
  async function apiUpdateProject(id, data) { const r = await fetch('/api/projects/' + id, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }); if (!r.ok) throw new Error('Failed'); return r.json(); }
  async function apiCreateInvoice(projectId, data) { const r = await fetch('/api/projects/' + projectId + '/invoice', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }); if (!r.ok) throw new Error('Failed'); return r.json(); }
  async function apiUpdateInvoiceStatus(id, status) { const r = await fetch('/api/invoices/' + id + '/status', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) }); if (!r.ok) throw new Error('Failed'); return r.json(); }
  async function apiToggleShare(projectId, enabled) { const r = await fetch('/api/projects/' + projectId + '/share', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ enabled }) }); if (!r.ok) throw new Error('Failed'); return r.json(); }
  async function apiLinkQueue(projectId, queueItemId) { const r = await fetch('/api/projects/' + projectId + '/link-queue', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ queue_item_id: queueItemId }) }); if (!r.ok) throw new Error('Failed'); return r.json(); }

  // Overview
  async function _renderOverview() {
    const container = document.getElementById('ord-content');
    if (!container) return;
    container.innerHTML = '<div class="matrec-empty"><div class="matrec-spinner"></div></div>';

    try { _dashboard = await fetchDashboard(); }
    catch { _dashboard = { active_orders: 0, overdue_count: 0, revenue_this_month: 0, avg_order_value: 0, upcoming_deadlines: [], recent_activity: [] }; }
    const d = _dashboard;

    let html = `<div class="stats-strip ord-stats">
      <div class="spark-panel"><span class="spark-label">${_tl('orders.active_orders', 'Aktive')}</span><span class="spark-value" style="color:var(--accent-blue)">${d.active_orders}</span></div>
      <div class="spark-panel"><span class="spark-label">${_tl('orders.overdue', 'Forsinket')}</span><span class="spark-value" style="color:${d.overdue_count > 0 ? 'var(--accent-red)' : 'var(--accent-green)'}">${d.overdue_count}</span></div>
      <div class="spark-panel"><span class="spark-label">${_tl('orders.revenue_month', 'Inntekt mnd')}</span><span class="spark-value">${formatCurrency(d.revenue_this_month)}</span></div>
      <div class="spark-panel" style="border-right:none"><span class="spark-label">${_tl('orders.avg_value', 'Snitt verdi')}</span><span class="spark-value">${formatCurrency(d.avg_order_value)}</span></div>
    </div>`;

    // Deadlines
    html += `<div class="card ord-section">
      <div class="card-title">${_tl('orders.upcoming_deadlines', 'Kommende frister')}</div>`;
    if (d.upcoming_deadlines?.length) {
      for (const p of d.upcoming_deadlines) {
        const overdue = isOverdue(p.deadline || p.due_date);
        html += `<div class="ord-deadline${overdue ? ' ord-deadline--overdue' : ''}" onclick="window._orderOpenDetail(${p.id})">
          <span class="ord-deadline-name">${_esc(p.name)}</span>
          <span class="ord-deadline-customer">${_esc(p.customer_name || p.client_name || '')}</span>
          <span class="ord-deadline-date${overdue ? ' ord-text-danger' : ''}">${formatDate(p.deadline || p.due_date)}</span>
        </div>`;
      }
    } else {
      html += `<div class="ord-empty-note">${_tl('orders.no_deadlines', 'Ingen kommende frister')}</div>`;
    }
    html += '</div>';

    // Activity
    html += `<div class="card ord-section">
      <div class="card-title">${_tl('orders.recent_activity', 'Siste aktivitet')}</div>`;
    if (d.recent_activity?.length) {
      html += '<div class="ord-timeline">';
      for (const ev of d.recent_activity) {
        html += `<div class="ord-timeline-item">
          <div class="ord-timeline-dot"></div>
          <div class="ord-timeline-body">
            <div class="ord-timeline-project">${_esc(ev.project_name || '')}</div>
            <div class="ord-timeline-desc">${_esc(ev.description || '')}</div>
            <div class="ord-timeline-time">${formatDateTime(ev.timestamp)}</div>
          </div>
        </div>`;
      }
      html += '</div>';
    } else {
      html += `<div class="ord-empty-note">${_tl('orders.no_activity', 'Ingen aktivitet ennå')}</div>`;
    }
    html += '</div>';

    container.innerHTML = html;
  }

  // Orders (Kanban)
  async function _renderOrders() {
    const container = document.getElementById('ord-content');
    if (!container) return;
    container.innerHTML = '<div class="matrec-empty"><div class="matrec-spinner"></div></div>';
    try { _projects = await fetchProjects(); } catch { _projects = []; }

    const columns = [
      { key: 'active', label: _tl('orders.status_received', 'Mottatt'), color: 'var(--accent-blue)' },
      { key: 'printing', label: _tl('orders.status_printing', 'Printer'), color: 'var(--accent-orange)' },
      { key: 'completed', label: _tl('orders.status_completed', 'Ferdig'), color: 'var(--accent-green)' },
      { key: 'invoiced', label: _tl('orders.status_invoiced', 'Fakturert'), color: 'var(--accent-purple, #7b2ff2)' }
    ];

    let html = `<div class="matrec-toolbar" style="margin-bottom:12px">
      <div></div>
      <button class="matrec-recalc-btn" onclick="window._orderNewProject()" style="margin-left:auto">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        ${_tl('orders.new_order', 'Ny bestilling')}
      </button>
    </div>`;

    html += '<div class="ord-kanban">';
    for (const col of columns) {
      const items = _projects.filter(p => p.status === col.key);
      html += `<div class="ord-kanban-col">
        <div class="ord-kanban-header" style="--col-color:${col.color}">
          <span>${_esc(col.label)}</span>
          <span class="ord-kanban-count">${items.length}</span>
        </div>
        <div class="ord-kanban-items">`;
      for (const p of items) {
        const overdue = isOverdue(p.deadline || p.due_date);
        html += `<div class="ord-kanban-card${overdue ? ' ord-kanban-card--overdue' : ''}" onclick="window._orderOpenDetail(${p.id})">
          <div class="ord-card-name">${_esc(p.name)}</div>
          <div class="ord-card-customer">${_esc(p.customer_name || p.client_name || '--')}</div>
          ${p.deadline || p.due_date ? '<div class="ord-card-deadline' + (overdue ? ' ord-text-danger' : '') + '">' + formatDate(p.deadline || p.due_date) + '</div>' : ''}
          ${p.priority > 0 ? '<span class="ord-priority-badge">' + _tl('orders.priority', 'Prioritet') + '</span>' : ''}
        </div>`;
      }
      html += '</div></div>';
    }
    html += '</div>';

    container.innerHTML = html;
  }

  // Detail
  async function _renderDetail(projectId) {
    const container = document.getElementById('ord-content');
    if (!container) return;
    container.innerHTML = '<div class="matrec-empty"><div class="matrec-spinner"></div></div>';

    try { _activeProject = await fetchProjectDetails(projectId); }
    catch { container.innerHTML = '<div class="matrec-empty"><p>Kunne ikke laste prosjekt</p></div>'; return; }

    const costSummary = await fetchCostSummary(projectId);
    const p = _activeProject;

    let html = `<div class="ord-detail-header">
      <button class="ce-secondary-btn" onclick="window._orderSwitchTab('orders')" style="padding:5px 12px">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
        ${_tl('orders.back', 'Tilbake')}
      </button>
      <span class="ord-detail-title">${_esc(p.name)}</span>
      <span class="ord-status-badge ord-status--${p.status || 'active'}">${_esc(p.status || 'active')}</span>
    </div>`;

    // Two-column grid
    html += '<div class="ord-detail-grid">';

    // Customer info
    html += `<div class="card ord-section">
      <div class="card-title">${_tl('orders.customer_info', 'Kundeinformasjon')}</div>
      <div class="ord-form-grid">
        ${_formField('customer_name', _tl('orders.customer_name', 'Kundenavn'), p.customer_name || p.client_name || '')}
        ${_formField('customer_email', _tl('orders.customer_email', 'E-post'), p.customer_email || '', 'email')}
        ${_formField('customer_phone', _tl('orders.customer_phone', 'Telefon'), p.customer_phone || '', 'tel')}
      </div>
      <div class="ord-form-grid">
        <div class="ce-field"><span class="ce-field-label">${_tl('orders.deadline', 'Frist')}</span><input type="date" class="ce-input" style="border:1px solid var(--border-color);border-radius:var(--radius-sm);padding:8px 12px" id="order-deadline" value="${_esc((p.deadline || p.due_date || '').split('T')[0])}"></div>
        <div class="ce-field"><span class="ce-field-label">${_tl('orders.priority_label', 'Prioritet')}</span>
          <select class="matrec-select" style="width:100%" id="order-priority">
            <option value="0"${p.priority == 0 ? ' selected' : ''}>${_tl('orders.priority_normal', 'Normal')}</option>
            <option value="1"${p.priority == 1 ? ' selected' : ''}>${_tl('orders.priority_high', 'Høy')}</option>
            <option value="2"${p.priority == 2 ? ' selected' : ''}>${_tl('orders.priority_urgent', 'Haster')}</option>
          </select>
        </div>
        <div class="ce-field"><span class="ce-field-label">${_tl('orders.status', 'Status')}</span>
          <select class="matrec-select" style="width:100%" id="order-status">
            ${['active', 'printing', 'completed', 'invoiced', 'cancelled'].map(s => `<option value="${s}"${p.status === s ? ' selected' : ''}>${s}</option>`).join('')}
          </select>
        </div>
      </div>
      <div class="ce-field" style="margin-top:8px"><span class="ce-field-label">${_tl('orders.estimated_cost', 'Estimert kostnad')}</span>
        <div class="ce-input-wrap"><input type="number" class="ce-input" id="order-estimated-cost" value="${p.estimated_cost || ''}" step="0.01"><span class="ce-input-suffix">NOK</span></div>
      </div>
      <button class="matrec-recalc-btn" style="margin-left:0;margin-top:12px" onclick="window._orderSaveDetail()">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/></svg>
        ${_tl('orders.save', 'Lagre')}
      </button>
    </div>`;

    // Cost summary
    html += `<div class="card ord-section">
      <div class="card-title">${_tl('orders.cost_summary', 'Kostnadssammendrag')}</div>`;
    if (costSummary) {
      html += `<div class="ord-cost-list">
        ${_costRow(_tl('orders.total_prints', 'Totalt utskrifter'), costSummary.total_prints)}
        ${_costRow(_tl('orders.completed_prints', 'Fullførte'), costSummary.completed_prints)}
        ${_costRow(_tl('orders.filament_cost', 'Filament'), formatCurrency(costSummary.filament_cost))}
        ${_costRow(_tl('orders.energy_cost', 'Strøm'), formatCurrency(costSummary.energy_cost))}
        ${_costRow(_tl('orders.actual_cost', 'Faktisk kostnad'), formatCurrency(costSummary.actual_cost))}
        ${_costRow(_tl('orders.filament_used', 'Filament brukt'), (costSummary.total_filament_g || 0).toFixed(1) + ' g')}
      </div>`;
      if (p.estimated_cost) {
        const diff = (costSummary.actual_cost || 0) - p.estimated_cost;
        html += `<div class="ord-cost-diff" style="color:${diff > 0 ? 'var(--accent-red)' : 'var(--accent-green)'}">
          ${_tl('orders.cost_diff', 'Avvik')}: ${diff > 0 ? '+' : ''}${formatCurrency(diff)}
        </div>`;
      }
    } else {
      html += `<div class="ord-empty-note">${_tl('orders.no_cost_data', 'Ingen kostnadsdata')}</div>`;
    }
    html += '</div></div>';

    // Linked prints
    html += `<div class="card ord-section">
      <div class="card-title">${_tl('orders.linked_prints', 'Koblede utskrifter')}</div>`;
    if (p.prints?.length) {
      html += '<table class="matrec-table"><thead><tr><th style="text-align:left">' + _tl('orders.filename', 'Fil') + '</th><th>' + _tl('orders.status', 'Status') + '</th><th>' + _tl('orders.cost', 'Kostnad') + '</th></tr></thead><tbody>';
      for (const pr of p.prints) {
        const st = pr.print_status || pr.status || 'pending';
        const stCls = st === 'finish' || st === 'completed' ? 'good' : st === 'failed' ? 'bad' : 'warn';
        html += `<tr><td style="text-align:left">${_esc(pr.print_filename || pr.filename || '--')}</td><td><span class="hs-badge hs-badge-${stCls}">${_esc(st)}</span></td><td>${formatCurrency(pr.print_cost)}</td></tr>`;
      }
      html += '</tbody></table>';
    } else {
      html += `<div class="ord-empty-note">${_tl('orders.no_prints_linked', 'Ingen utskrifter koblet')}</div>`;
    }
    html += `<button class="ce-secondary-btn" style="margin-top:8px" onclick="window._orderLinkQueue()">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/></svg>
      ${_tl('orders.link_queue_item', 'Koble køelement')}
    </button></div>`;

    // Share & Actions
    html += `<div class="ord-actions-row">
      <div class="card ord-section" style="flex:1">
        <div class="card-title">${_tl('orders.share_link', 'Delingslenke')}</div>
        <div class="ord-share-row">
          <label class="wp-toggle"><input type="checkbox" id="order-share-toggle" ${p.share_enabled ? 'checked' : ''} onchange="window._orderToggleShare()"><span class="wp-toggle-track"></span><span class="wp-toggle-knob"></span></label>
          <span style="font-size:0.8rem">${_tl('orders.share_enabled', 'Deling aktivert')}</span>
        </div>
        ${p.share_enabled && p.share_token ? `<div class="ord-share-url">
          <input type="text" class="ce-input" style="border:1px solid var(--border-color);border-radius:var(--radius-sm);padding:6px 10px;font-size:0.75rem;flex:1" readonly value="${_esc(location.origin + '/api/shared/' + p.share_token)}" id="order-share-url">
          <button class="ce-secondary-btn" style="padding:5px 10px;font-size:0.72rem" onclick="navigator.clipboard.writeText(document.getElementById('order-share-url').value);if(typeof showToast==='function')showToast('Kopiert','success',2000)">${_tl('orders.copy', 'Kopier')}</button>
        </div>` : ''}
      </div>
      <div class="card ord-section" style="flex:1">
        <div class="card-title">${_tl('orders.actions', 'Handlinger')}</div>
        <button class="matrec-recalc-btn" style="margin-left:0" onclick="window._orderGenerateInvoice()">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
          ${_tl('orders.generate_invoice', 'Generer faktura')}
        </button>
      </div>
    </div>`;

    // Timeline
    html += `<div class="card ord-section">
      <div class="card-title">${_tl('orders.timeline', 'Tidslinje')}</div>`;
    if (p.timeline?.length) {
      html += '<div class="ord-timeline">';
      for (const ev of p.timeline) {
        html += `<div class="ord-timeline-item"><div class="ord-timeline-dot"></div><div class="ord-timeline-body">
          <div class="ord-timeline-desc">${_esc(ev.description || '')}</div>
          <div class="ord-timeline-time">${formatDateTime(ev.timestamp)}</div>
        </div></div>`;
      }
      html += '</div>';
    } else {
      html += `<div class="ord-empty-note">${_tl('orders.no_timeline', 'Ingen hendelser ennå')}</div>`;
    }
    html += '</div>';

    container.innerHTML = html;
  }

  function _formField(id, label, value, type) {
    return `<div class="ce-field"><span class="ce-field-label">${_esc(label)}</span><input type="${type || 'text'}" class="ce-input" style="border:1px solid var(--border-color);border-radius:var(--radius-sm);padding:8px 12px" id="order-${id}" value="${_esc(value)}"></div>`;
  }
  function _costRow(label, value) {
    return `<div class="ord-cost-row"><span>${_esc(label)}</span><span>${_esc(String(value))}</span></div>`;
  }

  // Invoices
  async function _renderInvoices() {
    const container = document.getElementById('ord-content');
    if (!container) return;
    container.innerHTML = '<div class="matrec-empty"><div class="matrec-spinner"></div></div>';

    try {
      const all = await fetchProjects();
      _invoices = [];
      for (const p of all) {
        try {
          const res = await fetch('/api/projects/' + p.id + '/invoices');
          if (res.ok) { const invs = await res.json(); for (const inv of invs) { inv._project_name = p.name; _invoices.push(inv); } }
        } catch {}
      }
    } catch { _invoices = []; }

    if (!_invoices.length) {
      container.innerHTML = `<div class="matrec-empty">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="opacity:0.3;margin-bottom:12px"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
        <p>${_tl('orders.no_invoices', 'Ingen fakturaer ennå')}</p>
      </div>`;
      return;
    }

    let html = `<div class="card" style="padding:0;overflow:hidden">
      <table class="matrec-table">
        <thead><tr>
          <th style="text-align:left">${_tl('orders.invoice_number', 'Fakturanr')}</th>
          <th style="text-align:left">${_tl('orders.project', 'Prosjekt')}</th>
          <th style="text-align:left">${_tl('orders.customer_name', 'Kunde')}</th>
          <th>${_tl('orders.total', 'Total')}</th>
          <th>${_tl('orders.status', 'Status')}</th>
          <th>${_tl('orders.actions', 'Handlinger')}</th>
        </tr></thead>
        <tbody>`;
    for (const inv of _invoices) {
      const stCls = inv.status === 'paid' ? 'good' : inv.status === 'sent' ? 'warn' : '';
      html += `<tr>
        <td style="text-align:left;font-weight:600">${_esc(inv.invoice_number || '--')}</td>
        <td style="text-align:left">${_esc(inv._project_name || '--')}</td>
        <td style="text-align:left">${_esc(inv.customer_name || '--')}</td>
        <td style="font-weight:700">${formatCurrency(inv.total, inv.currency)}</td>
        <td><span class="hs-badge${stCls ? ' hs-badge-' + stCls : ''}">${_esc(inv.status || 'draft')}</span></td>
        <td><div style="display:flex;gap:4px;justify-content:center">
          <button class="ce-secondary-btn" style="padding:3px 8px;font-size:0.7rem" onclick="window.open('/api/invoices/${inv.id}/html','_blank')">${_tl('orders.view', 'Vis')}</button>
          ${inv.status === 'draft' ? `<button class="ce-secondary-btn" style="padding:3px 8px;font-size:0.7rem" onclick="window._orderSetInvoiceStatus(${inv.id},'sent')">${_tl('orders.mark_sent', 'Sendt')}</button>` : ''}
          ${inv.status === 'sent' ? `<button class="matrec-recalc-btn" style="padding:3px 8px;font-size:0.7rem;margin-left:0" onclick="window._orderSetInvoiceStatus(${inv.id},'paid')">${_tl('orders.mark_paid', 'Betalt')}</button>` : ''}
        </div></td>
      </tr>`;
    }
    html += '</tbody></table></div>';
    container.innerHTML = html;
  }

  // Main render
  async function _render() {
    const body = document.getElementById('overlay-panel-body');
    if (!body) return;

    body.innerHTML = '<div class="ord-panel"><div id="ord-content"></div></div>';
    _ensureTabBar();

    if (_activeTab === 'overview') await _renderOverview();
    else if (_activeTab === 'orders') await _renderOrders();
    else if (_activeTab === 'invoices') await _renderInvoices();
    else if (_activeTab === 'detail' && _activeProject) await _renderDetail(_activeProject.id);
  }

  // Global handlers
  window._orderSwitchTab = function(tab) { _activeTab = tab; _render(); };
  window._orderOpenDetail = function(id) { _activeTab = 'detail'; _renderDetail(id).then(() => _ensureTabBar()); };
  window._orderNewProject = function() {
    const name = prompt(_tl('orders.enter_name', 'Navn på bestilling'));
    if (!name) return;
    apiCreateProject({ name, status: 'active' }).then(() => { if (typeof showToast === 'function') showToast(_tl('orders.created', 'Opprettet'), 'success'); _activeTab = 'orders'; _render(); }).catch(e => { if (typeof showToast === 'function') showToast(e.message, 'error'); });
  };
  window._orderSaveDetail = function() {
    if (!_activeProject) return;
    const data = {
      customer_name: document.getElementById('order-customer_name')?.value || null,
      customer_email: document.getElementById('order-customer_email')?.value || null,
      customer_phone: document.getElementById('order-customer_phone')?.value || null,
      deadline: document.getElementById('order-deadline')?.value || null,
      priority: parseInt(document.getElementById('order-priority')?.value || '0'),
      status: document.getElementById('order-status')?.value || 'active',
      estimated_cost: parseFloat(document.getElementById('order-estimated-cost')?.value) || null
    };
    apiUpdateProject(_activeProject.id, data).then(() => { if (typeof showToast === 'function') showToast(_tl('orders.saved', 'Lagret'), 'success'); _renderDetail(_activeProject.id).then(() => _ensureTabBar()); }).catch(e => { if (typeof showToast === 'function') showToast(e.message, 'error'); });
  };
  window._orderToggleShare = function() {
    if (!_activeProject) return;
    const enabled = document.getElementById('order-share-toggle')?.checked;
    apiToggleShare(_activeProject.id, enabled).then(() => _renderDetail(_activeProject.id).then(() => _ensureTabBar())).catch(e => { if (typeof showToast === 'function') showToast(e.message, 'error'); });
  };
  window._orderLinkQueue = function() {
    if (!_activeProject) return;
    const queueItemId = prompt(_tl('orders.enter_queue_id', 'Kø-element ID'));
    if (!queueItemId) return;
    apiLinkQueue(_activeProject.id, parseInt(queueItemId)).then(() => { if (typeof showToast === 'function') showToast(_tl('orders.queue_linked', 'Koblet'), 'success'); _renderDetail(_activeProject.id).then(() => _ensureTabBar()); }).catch(e => { if (typeof showToast === 'function') showToast(e.message, 'error'); });
  };
  window._orderGenerateInvoice = async function() {
    if (!_activeProject) return;
    const p = _activeProject;
    try {
      const cost = await fetchCostSummary(p.id);
      const subtotal = cost?.actual_cost || 0;
      const taxRate = 0.25;
      const items = [];
      if (p.prints) { for (const pr of p.prints) items.push({ description: pr.print_filename || pr.filename || 'Print job', qty: 1, unit_price: pr.print_cost || 0 }); }
      if (!items.length) items.push({ description: p.name, qty: 1, unit_price: subtotal });
      await apiCreateInvoice(p.id, { customer_name: p.customer_name || p.client_name || '', customer_email: p.customer_email || '', items, subtotal, tax_rate: taxRate, tax_amount: subtotal * taxRate, total: subtotal * (1 + taxRate), currency: 'NOK' });
      if (typeof showToast === 'function') showToast(_tl('orders.invoice_created', 'Faktura opprettet'), 'success');
      _renderDetail(p.id).then(() => _ensureTabBar());
    } catch (e) { if (typeof showToast === 'function') showToast(e.message, 'error'); }
  };
  window._orderSetInvoiceStatus = function(id, status) {
    apiUpdateInvoiceStatus(id, status).then(() => { if (typeof showToast === 'function') showToast(_tl('orders.status_updated', 'Status oppdatert'), 'success'); if (_activeTab === 'invoices') _renderInvoices(); else if (_activeProject) _renderDetail(_activeProject.id).then(() => _ensureTabBar()); }).catch(e => { if (typeof showToast === 'function') showToast(e.message, 'error'); });
  };

  window.loadOrderPanel = async function(initialTab) {
    _activeTab = (typeof initialTab === 'string') ? initialTab : 'overview';
    const body = document.getElementById('overlay-panel-body');
    if (!body) return;
    // Check ecom license before rendering
    try {
      const res = await fetch('/api/ecommerce/license');
      const lic = await res.json();
      if (!lic.active) {
        body.innerHTML = `<div class="matrec-empty" style="padding:3rem">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="opacity:0.3;margin-bottom:12px"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
          <p style="font-weight:600;margin-bottom:4px">${_tl('orders.license_required', 'Premium-lisens kreves')}</p>
          <p style="font-size:0.85rem;color:var(--text-muted)">${_tl('orders.license_required_desc', 'Aktiver e-handelslisensen under Innstillinger → System → Integrasjoner for å bruke ordrebehandling.')}</p>
          <button class="matrec-recalc-btn" style="margin-top:12px" onclick="openPanel('settings');setTimeout(()=>{window._switchSystemSubTab&&window._switchSystemSubTab('integrations')},200)">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>
            ${_tl('orders.go_to_settings', 'Gå til integrasjoner')}
          </button>
        </div>`;
        return;
      }
    } catch { /* continue if check fails */ }
    _render();
  };
})();
