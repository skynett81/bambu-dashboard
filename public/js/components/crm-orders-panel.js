// CRM Orders Panel — Order list, create/edit, detail view with items
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

  const STATUSES = ['all', 'draft', 'pending', 'printing', 'completed', 'shipped', 'cancelled'];
  const STATUS_COLORS = {
    draft: '#94a3b8', pending: '#f59e0b', printing: '#3b82f6',
    completed: '#22c55e', shipped: '#8b5cf6', cancelled: '#ef4444'
  };

  let _orders = [];
  let _statusFilter = 'all';
  let _activeView = 'list'; // list | detail | form
  let _selectedOrder = null;
  let _orderItems = [];
  let _customers = [];
  let _formItems = []; // items being added in the form

  // API
  async function fetchOrders(status) {
    const q = status && status !== 'all' ? '?status=' + encodeURIComponent(status) : '';
    try { const r = await fetch('/api/crm/orders' + q); return r.ok ? r.json() : []; }
    catch { return []; }
  }

  async function fetchOrderDetail(id) {
    try { const r = await fetch('/api/crm/orders/' + id); return r.ok ? r.json() : null; }
    catch { return null; }
  }

  async function fetchOrderItems(id) {
    try { const r = await fetch('/api/crm/orders/' + id + '/items'); return r.ok ? r.json() : []; }
    catch { return []; }
  }

  async function fetchCustomers() {
    try { const r = await fetch('/api/crm/customers'); return r.ok ? r.json() : []; }
    catch { return []; }
  }

  async function apiSaveOrder(data) {
    const method = data.id ? 'PUT' : 'POST';
    const url = data.id ? '/api/crm/orders/' + data.id : '/api/crm/orders';
    const r = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
    if (!r.ok) { const err = await r.json().catch(() => ({})); throw new Error(err.error || 'Failed'); }
    return r.json();
  }

  async function apiChangeStatus(id, status) {
    const r = await fetch('/api/crm/orders/' + id + '/status', {
      method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status })
    });
    if (!r.ok) throw new Error('Failed');
    return r.json();
  }

  async function apiGenerateInvoice(orderId) {
    const r = await fetch('/api/crm/orders/' + orderId + '/invoice', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({})
    });
    if (!r.ok) { const err = await r.json().catch(() => ({})); throw new Error(err.error || 'Failed'); }
    return r.json();
  }

  async function apiCalculateCost(item) {
    try {
      const r = await fetch('/api/cost-estimator/calculate', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ weight_g: item.filament_weight_g, time_min: item.estimated_time_min, filament_type: item.filament_type })
      });
      return r.ok ? r.json() : null;
    } catch { return null; }
  }

  // Render filter bar
  function renderFilters() {
    return '<div style="display:flex;gap:0.25rem;flex-wrap:wrap;margin-bottom:1rem">' +
      STATUSES.map(s => {
        const active = _statusFilter === s ? ' btn-primary' : ' btn-outline-secondary';
        const label = s === 'all' ? _tl('crm.all', 'Alle') : _tl('crm.status_' + s, s);
        return `<button class="btn btn-sm${active}" onclick="window._crmOrdFilter('${s}')">${_esc(label)}</button>`;
      }).join('') +
      `<div style="flex:1"></div>
      <button class="btn btn-primary btn-sm" onclick="window._crmOrdNewForm()">
        <i class="bi bi-plus-lg"></i> ${_esc(_tl('crm.new_order', 'Ny ordre'))}
      </button></div>`;
  }

  // Render list view
  function renderList(body) {
    let html = renderFilters();

    if (_orders.length === 0) {
      html += `<div class="card"><div class="card-body" style="text-align:center;padding:2rem;opacity:0.6">
        ${_esc(_tl('crm.no_orders', 'Ingen ordrer'))}
      </div></div>`;
    } else {
      html += `<div class="card"><div class="card-body" style="padding:0">
        <table class="table table-hover table-sm" style="margin:0">
          <thead><tr>
            <th>#</th>
            <th>${_esc(_tl('crm.customer_name', 'Kunde'))}</th>
            <th>${_esc(_tl('crm.status', 'Status'))}</th>
            <th style="text-align:right">${_esc(_tl('crm.items', 'Artikler'))}</th>
            <th style="text-align:right">${_esc(_tl('crm.total', 'Total'))}</th>
            <th>${_esc(_tl('crm.created', 'Opprettet'))}</th>
          </tr></thead>
          <tbody>${_orders.map(o => {
            const sc = STATUS_COLORS[o.status] || '#94a3b8';
            return `<tr style="cursor:pointer" onclick="window._crmOrdDetail(${o.id})">
              <td><strong>${_esc(o.order_number)}</strong></td>
              <td>${_esc(o.customer_name || '--')}</td>
              <td><span class="badge" style="background:${sc};color:#fff;font-size:0.75rem;padding:2px 8px;border-radius:4px">${_esc(_tl('crm.status_' + o.status, o.status))}</span></td>
              <td style="text-align:right">${o.item_count || 0}</td>
              <td style="text-align:right">${formatCurrency(o.total)}</td>
              <td>${formatDate(o.created_at)}</td>
            </tr>`;
          }).join('')}</tbody>
        </table>
      </div></div>`;
    }

    body.innerHTML = html;
  }

  // Render detail view
  function renderDetail(body) {
    const o = _selectedOrder;
    if (!o) { _activeView = 'list'; renderList(body); return; }

    const sc = STATUS_COLORS[o.status] || '#94a3b8';

    let itemsHtml = '';
    if (_orderItems.length > 0) {
      itemsHtml = `<table class="table table-sm" style="margin:0">
        <thead><tr>
          <th>${_esc(_tl('crm.description', 'Beskrivelse'))}</th>
          <th>${_esc(_tl('crm.quantity', 'Antall'))}</th>
          <th>${_esc(_tl('crm.filament', 'Filament'))}</th>
          <th style="text-align:right">${_esc(_tl('crm.total', 'Total'))}</th>
        </tr></thead>
        <tbody>${_orderItems.map(it => `<tr>
          <td>${_esc(it.description)}${it.filename ? ` <small style="opacity:0.6">(${_esc(it.filename)})</small>` : ''}</td>
          <td>${it.quantity || 1}</td>
          <td>${_esc(it.filament_type || '--')} ${_esc(it.filament_color || '')}</td>
          <td style="text-align:right">${formatCurrency(it.total_cost)}</td>
        </tr>`).join('')}</tbody>
        <tfoot><tr>
          <td colspan="3" style="text-align:right"><strong>${_esc(_tl('crm.subtotal', 'Subtotal'))}</strong></td>
          <td style="text-align:right"><strong>${formatCurrency(o.subtotal)}</strong></td>
        </tr>
        ${o.tax_amount ? `<tr><td colspan="3" style="text-align:right">${_esc(_tl('crm.tax', 'MVA'))} (${o.tax_pct || 25}%)</td><td style="text-align:right">${formatCurrency(o.tax_amount)}</td></tr>` : ''}
        <tr><td colspan="3" style="text-align:right"><strong>${_esc(_tl('crm.total', 'Total'))}</strong></td><td style="text-align:right"><strong>${formatCurrency(o.total)}</strong></td></tr>
        </tfoot>
      </table>`;
    } else {
      itemsHtml = `<div style="text-align:center;padding:1rem;opacity:0.6">${_esc(_tl('crm.no_items', 'Ingen artikler'))}</div>`;
    }

    // Status change buttons
    const nextStatuses = { draft: ['pending'], pending: ['printing', 'cancelled'], printing: ['completed', 'cancelled'], completed: ['shipped'], shipped: [] };
    const statusBtns = (nextStatuses[o.status] || []).map(s => {
      const c2 = STATUS_COLORS[s] || '#94a3b8';
      return `<button class="btn btn-sm" style="background:${c2};color:#fff" onclick="window._crmOrdChangeStatus(${o.id},'${s}')">${_esc(_tl('crm.status_' + s, s))}</button>`;
    }).join(' ');

    body.innerHTML = `
      <div style="margin-bottom:1rem;display:flex;gap:0.5rem;flex-wrap:wrap;align-items:center">
        <button class="btn btn-sm btn-outline-secondary" onclick="window._crmOrdBack()"><i class="bi bi-arrow-left"></i> ${_esc(_tl('crm.back', 'Tilbake'))}</button>
        ${statusBtns}
        <button class="btn btn-sm btn-outline-primary" onclick="window._crmOrdGenerateInvoice(${o.id})"><i class="bi bi-file-earmark-text"></i> ${_esc(_tl('crm.generate_invoice', 'Generer faktura'))}</button>
      </div>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:1rem">
        <div class="card">
          <div class="card-header"><h3 class="card-title">${_esc(o.order_number)}</h3></div>
          <div class="card-body">
            <div class="stats-detail-item"><span class="stats-detail-item-label">${_esc(_tl('crm.status', 'Status'))}</span><span class="stats-detail-item-value"><span class="badge" style="background:${sc};color:#fff;padding:2px 8px;border-radius:4px">${_esc(_tl('crm.status_' + o.status, o.status))}</span></span></div>
            <div class="stats-detail-item"><span class="stats-detail-item-label">${_esc(_tl('crm.customer_name', 'Kunde'))}</span><span class="stats-detail-item-value">${_esc(o.customer_name || '--')}</span></div>
            <div class="stats-detail-item"><span class="stats-detail-item-label">${_esc(_tl('crm.due_date', 'Frist'))}</span><span class="stats-detail-item-value">${formatDate(o.due_date)}</span></div>
            <div class="stats-detail-item"><span class="stats-detail-item-label">${_esc(_tl('crm.created', 'Opprettet'))}</span><span class="stats-detail-item-value">${formatDate(o.created_at)}</span></div>
            ${o.notes ? `<div style="margin-top:0.5rem"><strong>${_esc(_tl('crm.notes', 'Notater'))}</strong><p style="white-space:pre-wrap;margin:0.25rem 0">${_esc(o.notes)}</p></div>` : ''}
          </div>
        </div>
        <div class="card">
          <div class="card-header"><h3 class="card-title">${_esc(_tl('crm.items', 'Artikler'))}</h3></div>
          <div class="card-body" style="padding:0">${itemsHtml}</div>
        </div>
      </div>`;
  }

  // Render new order form
  function renderForm(body) {
    if (_customers.length === 0) {
      fetchCustomers().then(c => { _customers = c; renderForm(body); });
      body.innerHTML = '<div style="text-align:center;padding:2rem;opacity:0.6">Loading...</div>';
      return;
    }

    const custOptions = _customers.map(c =>
      `<option value="${c.id}">${_esc(c.name)}${c.company ? ' (' + _esc(c.company) + ')' : ''}</option>`
    ).join('');

    function renderItemRows() {
      if (_formItems.length === 0) return `<div style="text-align:center;padding:1rem;opacity:0.6">${_esc(_tl('crm.no_items', 'Ingen artikler lagt til'))}</div>`;
      return _formItems.map((it, i) => `<div class="card" style="margin-bottom:0.5rem;padding:0.75rem" data-item-idx="${i}">
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:0.5rem;align-items:end">
          <div><label class="form-label">${_esc(_tl('crm.description', 'Beskrivelse'))} *</label><input class="form-control form-control-sm crm-item-field" data-field="description" value="${_esc(it.description || '')}"></div>
          <div><label class="form-label">Fil</label><input class="form-control form-control-sm crm-item-field" data-field="filename" value="${_esc(it.filename || '')}"></div>
          <div><label class="form-label">${_esc(_tl('crm.quantity', 'Antall'))}</label><input class="form-control form-control-sm crm-item-field" data-field="quantity" type="number" min="1" value="${it.quantity || 1}"></div>
          <div><label class="form-label">Filament</label><input class="form-control form-control-sm crm-item-field" data-field="filament_type" value="${_esc(it.filament_type || '')}"></div>
          <div><label class="form-label">Farge</label><input class="form-control form-control-sm crm-item-field" data-field="filament_color" value="${_esc(it.filament_color || '')}"></div>
          <div><label class="form-label">Vekt (g)</label><input class="form-control form-control-sm crm-item-field" data-field="filament_weight_g" type="number" step="0.1" value="${it.filament_weight_g || ''}"></div>
          <div><label class="form-label">Tid (min)</label><input class="form-control form-control-sm crm-item-field" data-field="estimated_time_min" type="number" step="1" value="${it.estimated_time_min || ''}"></div>
          <div><label class="form-label">${_esc(_tl('crm.total', 'Pris'))}</label><input class="form-control form-control-sm crm-item-field" data-field="unit_price" type="number" step="0.01" value="${it.unit_price || ''}"></div>
          <div style="display:flex;gap:0.25rem;align-items:end;padding-bottom:2px">
            <button type="button" class="btn btn-sm btn-outline-info" onclick="window._crmOrdCalcItem(${i})" title="Kalkuler"><i class="bi bi-calculator"></i></button>
            <button type="button" class="btn btn-sm btn-outline-danger" onclick="window._crmOrdRemoveItem(${i})" title="${_esc(_tl('crm.remove_item', 'Fjern'))}"><i class="bi bi-trash"></i></button>
          </div>
        </div>
      </div>`).join('');
    }

    body.innerHTML = `
      <div style="margin-bottom:1rem">
        <button class="btn btn-sm btn-outline-secondary" onclick="window._crmOrdBack()"><i class="bi bi-arrow-left"></i> ${_esc(_tl('crm.cancel', 'Avbryt'))}</button>
      </div>
      <div class="card">
        <div class="card-header"><h3 class="card-title">${_esc(_tl('crm.new_order', 'Ny ordre'))}</h3></div>
        <div class="card-body">
          <form id="crm-ord-form">
            <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:0.75rem;margin-bottom:1rem">
              <div><label class="form-label">${_esc(_tl('crm.customer_name', 'Kunde'))} *</label><select class="form-select" name="customer_id" required><option value="">-- ${_esc(_tl('crm.select_customer', 'Velg kunde'))} --</option>${custOptions}</select></div>
              <div><label class="form-label">${_esc(_tl('crm.due_date', 'Frist'))}</label><input class="form-control" name="due_date" type="date"></div>
              <div style="grid-column:1/-1"><label class="form-label">${_esc(_tl('crm.notes', 'Notater'))}</label><textarea class="form-control" name="notes" rows="2"></textarea></div>
            </div>
            <h5 style="margin-bottom:0.5rem">${_esc(_tl('crm.items', 'Artikler'))}</h5>
            <div id="crm-ord-items">${renderItemRows()}</div>
            <button type="button" class="btn btn-sm btn-outline-primary" style="margin-top:0.5rem" onclick="window._crmOrdAddItem()">
              <i class="bi bi-plus-lg"></i> ${_esc(_tl('crm.add_item', 'Legg til artikkel'))}
            </button>
            <hr style="margin:1rem 0">
            <button type="submit" class="btn btn-primary"><i class="bi bi-check-lg"></i> ${_esc(_tl('crm.save', 'Lagre'))}</button>
          </form>
        </div>
      </div>`;

    const form = document.getElementById('crm-ord-form');
    if (form) {
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        _syncFormItems();
        const fd = new FormData(form);
        const data = {
          customer_id: Number(fd.get('customer_id')),
          due_date: fd.get('due_date') || null,
          notes: fd.get('notes') || '',
          items: _formItems.filter(it => it.description)
        };
        try {
          await apiSaveOrder(data);
          if (typeof showToast === 'function') showToast(_tl('crm.saved', 'Lagret!'), 'success');
          _activeView = 'list';
          await _reload();
        } catch (err) {
          if (typeof showToast === 'function') showToast(err.message, 'danger');
        }
      });
    }
  }

  function _syncFormItems() {
    document.querySelectorAll('[data-item-idx]').forEach(row => {
      const idx = Number(row.dataset.itemIdx);
      if (!_formItems[idx]) return;
      row.querySelectorAll('.crm-item-field').forEach(inp => {
        const field = inp.dataset.field;
        const val = inp.type === 'number' ? (inp.value ? Number(inp.value) : null) : inp.value;
        _formItems[idx] = Object.assign({}, _formItems[idx], { [field]: val });
      });
    });
  }

  // Item management
  window._crmOrdAddItem = function() {
    _syncFormItems();
    _formItems = [..._formItems, { description: '', quantity: 1, filament_type: '', filament_color: '', filament_weight_g: null, estimated_time_min: null, unit_price: null }];
    const container = document.getElementById('crm-ord-items');
    const body = document.getElementById('overlay-panel-body');
    if (body && _activeView === 'form') renderForm(body);
  };

  window._crmOrdRemoveItem = function(idx) {
    _syncFormItems();
    _formItems = _formItems.filter((_, i) => i !== idx);
    const body = document.getElementById('overlay-panel-body');
    if (body && _activeView === 'form') renderForm(body);
  };

  window._crmOrdCalcItem = async function(idx) {
    _syncFormItems();
    const item = _formItems[idx];
    if (!item) return;
    const result = await apiCalculateCost(item);
    if (result && result.total !== undefined) {
      _formItems = _formItems.map((it, i) => i === idx ? Object.assign({}, it, { unit_price: result.total }) : it);
      const body = document.getElementById('overlay-panel-body');
      if (body && _activeView === 'form') renderForm(body);
      if (typeof showToast === 'function') showToast(_tl('crm.cost_calculated', 'Kostnad beregnet'), 'success');
    } else {
      if (typeof showToast === 'function') showToast(_tl('crm.calc_failed', 'Kunne ikke beregne'), 'warning');
    }
  };

  // Navigation
  window._crmOrdBack = function() { _activeView = 'list'; _selectedOrder = null; _reload(); };

  window._crmOrdFilter = function(status) {
    _statusFilter = status;
    _reload();
  };

  window._crmOrdDetail = async function(id) {
    _selectedOrder = await fetchOrderDetail(id);
    _orderItems = await fetchOrderItems(id);
    _activeView = 'detail';
    const body = document.getElementById('overlay-panel-body');
    if (body) renderDetail(body);
  };

  window._crmOrdNewForm = function() {
    _activeView = 'form';
    _formItems = [];
    const body = document.getElementById('overlay-panel-body');
    if (body) renderForm(body);
  };

  window._crmOrdChangeStatus = async function(id, status) {
    try {
      await apiChangeStatus(id, status);
      if (typeof showToast === 'function') showToast(_tl('crm.status_changed', 'Status endret'), 'success');
      _selectedOrder = await fetchOrderDetail(id);
      _orderItems = await fetchOrderItems(id);
      const body = document.getElementById('overlay-panel-body');
      if (body) renderDetail(body);
    } catch (err) {
      if (typeof showToast === 'function') showToast(err.message, 'danger');
    }
  };

  window._crmOrdGenerateInvoice = async function(orderId) {
    try {
      await apiGenerateInvoice(orderId);
      if (typeof showToast === 'function') showToast(_tl('crm.invoice_generated', 'Faktura generert'), 'success');
    } catch (err) {
      if (typeof showToast === 'function') showToast(err.message, 'danger');
    }
  };

  async function _reload() {
    const body = document.getElementById('overlay-panel-body');
    if (!body) return;
    _orders = await fetchOrders(_statusFilter);
    if (_activeView === 'list') renderList(body);
    else if (_activeView === 'detail') renderDetail(body);
    else if (_activeView === 'form') renderForm(body);
  }

  async function loadCrmOrdersPanel() {
    const body = document.getElementById('overlay-panel-body');
    if (!body) return;
    _activeView = 'list';
    _statusFilter = 'all';
    _selectedOrder = null;
    _formItems = [];
    _orders = await fetchOrders('');
    renderList(body);
  }

  window.loadCrmOrdersPanel = loadCrmOrdersPanel;
})();
