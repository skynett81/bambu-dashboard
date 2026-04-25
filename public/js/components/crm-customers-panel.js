// CRM Customers Panel — Customer list, search, create/edit, detail view
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

  let _customers = [];
  let _searchQuery = '';
  let _activeView = 'list'; // list | detail | form
  let _selectedCustomer = null;
  let _customerOrders = [];

  // API
  async function fetchCustomers(query) {
    const q = query ? '?search=' + encodeURIComponent(query) : '';
    try {
      const r = await fetch('/api/crm/customers' + q);
      return r.ok ? r.json() : [];
    } catch { return []; }
  }

  async function fetchCustomerDetail(id) {
    try {
      const r = await fetch('/api/crm/customers/' + id);
      if (!r.ok) throw new Error('Failed');
      return r.json();
    } catch { return null; }
  }

  async function fetchCustomerOrders(id) {
    try {
      const r = await fetch('/api/crm/customers/' + id + '/orders');
      return r.ok ? r.json() : [];
    } catch { return []; }
  }

  async function apiSaveCustomer(data) {
    const method = data.id ? 'PUT' : 'POST';
    const url = data.id ? '/api/crm/customers/' + data.id : '/api/crm/customers';
    const r = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
    if (!r.ok) { const err = await r.json().catch(() => ({})); throw new Error(err.error || 'Failed'); }
    return r.json();
  }

  async function apiDeleteCustomer(id) {
    const r = await fetch('/api/crm/customers/' + id, { method: 'DELETE' });
    if (!r.ok) throw new Error('Failed');
    return r.json();
  }

  // Render list view
  function renderList(body) {
    const filtered = _customers;

    let html = `<div style="display:flex;gap:0.5rem;margin-bottom:1rem;flex-wrap:wrap;align-items:center">
      <input class="form-control" id="crm-cust-search" type="text" placeholder="${_esc(_tl('crm.search', 'Search...'))}"
        value="${_esc(_searchQuery)}" style="flex:1;min-width:200px">
      <button class="btn btn-primary btn-sm" onclick="window._crmCustNewForm()">
        <i class="bi bi-plus-lg"></i> ${_esc(_tl('crm.new_customer', 'New customer'))}
      </button>
    </div>`;

    if (filtered.length === 0) {
      html += `<div class="card"><div class="card-body" style="text-align:center;padding:2rem;opacity:0.6">
        ${_esc(_tl('crm.no_customers', 'No customers found'))}
      </div></div>`;
    } else {
      html += `<div class="card"><div class="card-body" style="padding:0">
        <table class="table table-hover table-sm" style="margin:0">
          <thead><tr>
            <th>${_esc(_tl('crm.customer_name', 'Name'))}</th>
            <th>${_esc(_tl('crm.email', 'Email'))}</th>
            <th>${_esc(_tl('crm.company', 'Company'))}</th>
            <th style="text-align:right">${_esc(_tl('crm.total_orders', 'Orders'))}</th>
            <th style="text-align:right">${_esc(_tl('crm.total_revenue', 'Revenue'))}</th>
          </tr></thead>
          <tbody>${filtered.map(c => `<tr style="cursor:pointer" onclick="window._crmCustDetail(${c.id})">
            <td><strong>${_esc(c.name)}</strong></td>
            <td>${_esc(c.email || '--')}</td>
            <td>${_esc(c.company || '--')}</td>
            <td style="text-align:right">${c.total_orders || 0}</td>
            <td style="text-align:right">${formatCurrency(c.total_revenue)}</td>
          </tr>`).join('')}</tbody>
        </table>
      </div></div>`;
    }

    body.innerHTML = html;

    const searchInput = document.getElementById('crm-cust-search');
    if (searchInput) {
      let timer = null;
      searchInput.addEventListener('input', () => {
        clearTimeout(timer);
        timer = setTimeout(async () => {
          _searchQuery = searchInput.value.trim();
          _customers = await fetchCustomers(_searchQuery);
          renderList(body);
        }, 300);
      });
      searchInput.focus();
    }
  }

  // Render detail view
  function renderDetail(body) {
    const c = _selectedCustomer;
    if (!c) { _activeView = 'list'; renderList(body); return; }

    let ordersHtml = '';
    if (_customerOrders.length > 0) {
      ordersHtml = `<table class="table table-hover table-sm" style="margin:0">
        <thead><tr><th>#</th><th>${_esc(_tl('crm.status', 'Status'))}</th><th style="text-align:right">${_esc(_tl('crm.total', 'Total'))}</th><th>${_esc(_tl('crm.created', 'Created'))}</th></tr></thead>
        <tbody>${_customerOrders.map(o => {
          return `<tr><td>${_esc(o.order_number)}</td>
            <td><span class="badge badge-status badge-status-${o.status}">${_esc(_tl('crm.status_' + o.status, o.status))}</span></td>
            <td style="text-align:right">${formatCurrency(o.total)}</td>
            <td>${formatDate(o.created_at)}</td></tr>`;
        }).join('')}</tbody>
      </table>`;
    } else {
      ordersHtml = `<div style="text-align:center;padding:1rem;opacity:0.6">${_esc(_tl('crm.no_orders', 'No orders'))}</div>`;
    }

    body.innerHTML = `
      <div style="margin-bottom:1rem">
        <button class="btn btn-sm btn-outline-secondary" onclick="window._crmCustBack()"><i class="bi bi-arrow-left"></i> ${_esc(_tl('crm.back', 'Back'))}</button>
        <button class="btn btn-sm btn-primary" style="margin-left:0.5rem" onclick="window._crmCustEditForm(${c.id})"><i class="bi bi-pencil"></i> ${_esc(_tl('crm.edit', 'Edit'))}</button>
        <button class="btn btn-sm btn-outline-danger" style="margin-left:0.5rem" onclick="window._crmCustDelete(${c.id})"><i class="bi bi-trash"></i> ${_esc(_tl('crm.delete', 'Delete'))}</button>
      </div>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:1rem">
        <div class="card">
          <div class="card-header"><h3 class="card-title">${_esc(c.name)}</h3></div>
          <div class="card-body">
            <div class="stats-detail-item"><span class="stats-detail-item-label">${_esc(_tl('crm.email', 'Email'))}</span><span class="stats-detail-item-value">${_esc(c.email || '--')}</span></div>
            <div class="stats-detail-item"><span class="stats-detail-item-label">${_esc(_tl('crm.phone', 'Phone'))}</span><span class="stats-detail-item-value">${_esc(c.phone || '--')}</span></div>
            <div class="stats-detail-item"><span class="stats-detail-item-label">${_esc(_tl('crm.company', 'Company'))}</span><span class="stats-detail-item-value">${_esc(c.company || '--')}</span></div>
            <div class="stats-detail-item"><span class="stats-detail-item-label">${_esc(_tl('crm.address', 'Address'))}</span><span class="stats-detail-item-value">${_esc(c.address || '--')}</span></div>
            ${c.notes ? `<div style="margin-top:0.5rem"><strong>${_esc(_tl('crm.notes', 'Notes'))}</strong><p style="margin:0.25rem 0;white-space:pre-wrap">${_esc(c.notes)}</p></div>` : ''}
          </div>
        </div>
        <div class="card">
          <div class="card-header"><h3 class="card-title">${_esc(_tl('crm.orders', 'Orders'))}</h3></div>
          <div class="card-body" style="padding:0">${ordersHtml}</div>
        </div>
      </div>`;
  }

  // Render form (create/edit)
  function renderForm(body, existing) {
    const c = existing || {};
    const title = c.id ? _tl('crm.edit', 'Edit customer') : _tl('crm.new_customer', 'New customer');

    body.innerHTML = `
      <div style="margin-bottom:1rem">
        <button class="btn btn-sm btn-outline-secondary" onclick="window._crmCustBack()"><i class="bi bi-arrow-left"></i> ${_esc(_tl('crm.cancel', 'Cancel'))}</button>
      </div>
      <div class="card">
        <div class="card-header"><h3 class="card-title">${_esc(title)}</h3></div>
        <div class="card-body">
          <form id="crm-cust-form" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:0.75rem">
            ${c.id ? `<input type="hidden" name="id" value="${c.id}">` : ''}
            <div><label class="form-label">${_esc(_tl('crm.customer_name', 'Name'))} *</label><input class="form-control" name="name" required value="${_esc(c.name || '')}"></div>
            <div><label class="form-label">${_esc(_tl('crm.email', 'Email'))}</label><input class="form-control" name="email" type="email" value="${_esc(c.email || '')}"></div>
            <div><label class="form-label">${_esc(_tl('crm.phone', 'Phone'))}</label><input class="form-control" name="phone" value="${_esc(c.phone || '')}"></div>
            <div><label class="form-label">${_esc(_tl('crm.company', 'Company'))}</label><input class="form-control" name="company" value="${_esc(c.company || '')}"></div>
            <div style="grid-column:1/-1"><label class="form-label">${_esc(_tl('crm.address', 'Address'))}</label><input class="form-control" name="address" value="${_esc(c.address || '')}"></div>
            <div style="grid-column:1/-1"><label class="form-label">${_esc(_tl('crm.notes', 'Notes'))}</label><textarea class="form-control" name="notes" rows="3">${_esc(c.notes || '')}</textarea></div>
            <div style="grid-column:1/-1">
              <button type="submit" class="btn btn-primary"><i class="bi bi-check-lg"></i> ${_esc(_tl('crm.save', 'Save'))}</button>
            </div>
          </form>
        </div>
      </div>`;

    const form = document.getElementById('crm-cust-form');
    if (form) {
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const fd = new FormData(form);
        const data = Object.fromEntries(fd.entries());
        if (data.id) data.id = Number(data.id);
        try {
          await apiSaveCustomer(data);
          if (typeof showToast === 'function') showToast(_tl('crm.saved', 'Saved!'), 'success');
          _activeView = 'list';
          await _reload();
        } catch (err) {
          if (typeof showToast === 'function') showToast(err.message, 'danger');
        }
      });
    }
  }

  // Navigation
  window._crmCustBack = function() {
    _activeView = 'list';
    _selectedCustomer = null;
    _reload();
  };

  window._crmCustDetail = async function(id) {
    const body = document.getElementById('overlay-panel-body');
    if (!body) return;
    _selectedCustomer = await fetchCustomerDetail(id);
    _customerOrders = await fetchCustomerOrders(id);
    _activeView = 'detail';
    renderDetail(body);
  };

  window._crmCustNewForm = function() {
    _activeView = 'form';
    const body = document.getElementById('overlay-panel-body');
    if (body) renderForm(body, null);
  };

  window._crmCustEditForm = async function(id) {
    const detail = await fetchCustomerDetail(id);
    _activeView = 'form';
    const body = document.getElementById('overlay-panel-body');
    if (body) renderForm(body, detail);
  };

  window._crmCustDelete = async function(id) {
    if (!confirm(_tl('crm.confirm_delete', 'Er du sikker?'))) return;
    try {
      await apiDeleteCustomer(id);
      if (typeof showToast === 'function') showToast(_tl('crm.deleted', 'Deleted'), 'success');
      _activeView = 'list';
      await _reload();
    } catch (err) {
      if (typeof showToast === 'function') showToast(err.message, 'danger');
    }
  };

  async function _reload() {
    const body = document.getElementById('overlay-panel-body');
    if (!body) return;
    _customers = await fetchCustomers(_searchQuery);
    if (_activeView === 'list') renderList(body);
    else if (_activeView === 'detail') renderDetail(body);
  }

  async function loadCrmCustomersPanel() {
    const body = document.getElementById('overlay-panel-body');
    if (!body) return;
    _activeView = 'list';
    _selectedCustomer = null;
    _searchQuery = '';
    _customers = await fetchCustomers('');
    renderList(body);
  }

  window.loadCrmCustomersPanel = loadCrmCustomersPanel;
})();
