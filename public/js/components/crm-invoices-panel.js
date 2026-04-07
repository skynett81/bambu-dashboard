// CRM Invoices Panel — Invoice list, detail view, mark sent/paid
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

  let _invoices = [];
  let _activeView = 'list'; // list | detail
  let _selectedInvoice = null;

  // API
  async function fetchInvoices() {
    try { const r = await fetch('/api/crm/invoices'); return r.ok ? r.json() : []; }
    catch { return []; }
  }

  async function fetchInvoiceDetail(id) {
    try { const r = await fetch('/api/crm/invoices/' + id); return r.ok ? r.json() : null; }
    catch { return null; }
  }

  async function apiUpdateStatus(id, status) {
    const r = await fetch('/api/crm/invoices/' + id + '/status', {
      method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status })
    });
    if (!r.ok) throw new Error('Failed');
    return r.json();
  }

  // Render list
  function renderList(body) {
    let html = '';

    if (_invoices.length === 0) {
      html += `<div class="alert alert-info d-flex align-items-center gap-2" role="alert">
        <i class="bi bi-info-circle"></i> ${_esc(_tl('crm.no_invoices', 'No invoices'))}
      </div>`;
    } else {
      html += `<div class="card"><div class="card-body" style="padding:0">
        <table class="table table-hover table-sm" style="margin:0">
          <thead><tr>
            <th>${_esc(_tl('crm.invoice_number', 'Invoice #'))}</th>
            <th>${_esc(_tl('crm.order_number', 'Order #'))}</th>
            <th>${_esc(_tl('crm.customer_name', 'Customer'))}</th>
            <th>${_esc(_tl('crm.status', 'Status'))}</th>
            <th style="text-align:right">${_esc(_tl('crm.total', 'Total'))}</th>
            <th>${_esc(_tl('crm.due_date', 'Due date'))}</th>
            <th data-no-sort style="width:40px"></th>
          </tr></thead>
          <tbody>${_invoices.map(inv => {
            const isOverdue = inv.due_date && inv.status === 'sent' && new Date(inv.due_date) < new Date();
            const effectiveStatus = isOverdue ? 'overdue' : inv.status;
            return `<tr>
              <td style="cursor:pointer" onclick="window._crmInvDetail(${inv.id})"><strong>${_esc(inv.invoice_number)}</strong></td>
              <td>${_esc(inv.order_number || '--')}</td>
              <td>${_esc(inv.customer_name || '--')}</td>
              <td><span class="badge badge-status badge-status-${effectiveStatus}">${_esc(_tl('crm.inv_status_' + effectiveStatus, effectiveStatus))}</span></td>
              <td style="text-align:right">${formatCurrency(inv.total)}</td>
              <td>${formatDate(inv.due_date)}</td>
              <td>
                <div class="dropdown">
                  <button class="btn btn-sm btn-outline-secondary dropdown-toggle" type="button" data-bs-toggle="dropdown" onclick="event.stopPropagation()">
                    <i class="bi bi-three-dots-vertical"></i>
                  </button>
                  <ul class="dropdown-menu dropdown-menu-end">
                    <li><a class="dropdown-item" href="#" onclick="event.preventDefault(); window._crmInvDetail(${inv.id})"><i class="bi bi-eye me-2"></i>${_esc(_tl('crm.view', 'View'))}</a></li>
                    <li><a class="dropdown-item" href="#" onclick="event.preventDefault(); window.open('/api/crm/invoices/${inv.id}/html', '_blank')"><i class="bi bi-printer me-2"></i>${_esc(_tl('crm.print_invoice', 'Print'))}</a></li>
                  </ul>
                </div>
              </td>
            </tr>`;
          }).join('')}</tbody>
        </table>
      </div></div>`;
    }

    body.innerHTML = html;

    const tableCard = body.querySelector('.card-body');
    if (tableCard && typeof enhanceTable === 'function') {
      enhanceTable(tableCard, { pageSize: 20, searchPlaceholder: _tl('crm.search_invoices', 'Search invoices...') });
    }
  }

  // Render detail
  function renderDetail(body) {
    const inv = _selectedInvoice;
    if (!inv) { _activeView = 'list'; renderList(body); return; }

    let itemsHtml = '';
    let items = [];
    try { items = typeof inv.items === 'string' ? JSON.parse(inv.items) : (inv.items || []); } catch { items = []; }

    if (items.length > 0) {
      itemsHtml = `<table class="table table-sm" style="margin:0">
        <thead><tr>
          <th>${_esc(_tl('crm.description', 'Description'))}</th>
          <th>${_esc(_tl('crm.quantity', 'Quantity'))}</th>
          <th style="text-align:right">${_esc(_tl('crm.total', 'Price'))}</th>
        </tr></thead>
        <tbody>${items.map(it => `<tr>
          <td>${_esc(it.description || '--')}</td>
          <td>${it.quantity || 1}</td>
          <td style="text-align:right">${formatCurrency(it.total_cost || it.unit_price)}</td>
        </tr>`).join('')}</tbody>
        <tfoot>
          <tr><td colspan="2" style="text-align:right"><strong>${_esc(_tl('crm.subtotal', 'Subtotal'))}</strong></td><td style="text-align:right"><strong>${formatCurrency(inv.subtotal)}</strong></td></tr>
          ${inv.tax_amount ? `<tr><td colspan="2" style="text-align:right">${_esc(_tl('crm.tax', 'VAT'))} (${inv.tax_pct || 25}%)</td><td style="text-align:right">${formatCurrency(inv.tax_amount)}</td></tr>` : ''}
          <tr><td colspan="2" style="text-align:right"><strong>${_esc(_tl('crm.total', 'Total'))}</strong></td><td style="text-align:right"><strong>${formatCurrency(inv.total)}</strong></td></tr>
        </tfoot>
      </table>`;
    } else {
      itemsHtml = `<div style="text-align:center;padding:1rem;opacity:0.6">${_esc(_tl('crm.no_items', 'No items'))}</div>`;
    }

    // Action buttons based on status
    let actionBtns = '';
    if (inv.status === 'draft') {
      actionBtns = `<button class="btn btn-sm btn-primary" onclick="window._crmInvMarkSent(${inv.id})"><i class="bi bi-send"></i> ${_esc(_tl('crm.mark_sent', 'Mark sent'))}</button>`;
    } else if (inv.status === 'sent') {
      actionBtns = `<button class="btn btn-sm btn-success" onclick="window._crmInvMarkPaid(${inv.id})"><i class="bi bi-check-circle"></i> ${_esc(_tl('crm.mark_paid', 'Mark paid'))}</button>`;
    }
    // Always show print/open invoice button
    actionBtns += ` <button class="btn btn-sm btn-outline-info" onclick="window.open('/api/crm/invoices/${inv.id}/html', '_blank')"><i class="bi bi-printer"></i> ${_esc(_tl('crm.print_invoice', 'Print invoice'))}</button>`;

    body.innerHTML = `
      <div style="margin-bottom:1rem;display:flex;gap:0.5rem;flex-wrap:wrap;align-items:center">
        <button class="btn btn-sm btn-outline-secondary" onclick="window._crmInvBack()"><i class="bi bi-arrow-left"></i> ${_esc(_tl('crm.back', 'Back'))}</button>
        ${actionBtns}
      </div>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:1rem">
        <div class="card">
          <div class="card-header"><h3 class="card-title">${_esc(inv.invoice_number)}</h3></div>
          <div class="card-body">
            <div class="stats-detail-item"><span class="stats-detail-item-label">${_esc(_tl('crm.status', 'Status'))}</span><span class="stats-detail-item-value"><span class="badge badge-status badge-status-${inv.status}">${_esc(_tl('crm.inv_status_' + inv.status, inv.status))}</span></span></div>
            <div class="stats-detail-item"><span class="stats-detail-item-label">${_esc(_tl('crm.order_number', 'Order'))}</span><span class="stats-detail-item-value">${_esc(inv.order_number || '--')}</span></div>
            <div class="stats-detail-item"><span class="stats-detail-item-label">${_esc(_tl('crm.customer_name', 'Customer'))}</span><span class="stats-detail-item-value">${_esc(inv.customer_name || '--')}</span></div>
            <div class="stats-detail-item"><span class="stats-detail-item-label">${_esc(_tl('crm.due_date', 'Due date'))}</span><span class="stats-detail-item-value">${formatDate(inv.due_date)}</span></div>
            <div class="stats-detail-item"><span class="stats-detail-item-label">${_esc(_tl('crm.created', 'Created'))}</span><span class="stats-detail-item-value">${formatDate(inv.created_at)}</span></div>
            ${inv.sent_at ? `<div class="stats-detail-item"><span class="stats-detail-item-label">${_esc(_tl('crm.sent_at', 'Sent'))}</span><span class="stats-detail-item-value">${formatDate(inv.sent_at)}</span></div>` : ''}
            ${inv.paid_at ? `<div class="stats-detail-item"><span class="stats-detail-item-label">${_esc(_tl('crm.paid_at', 'Paid'))}</span><span class="stats-detail-item-value">${formatDate(inv.paid_at)}</span></div>` : ''}
            ${inv.notes ? `<div style="margin-top:0.5rem"><strong>${_esc(_tl('crm.notes', 'Notes'))}</strong><p style="white-space:pre-wrap;margin:0.25rem 0">${_esc(inv.notes)}</p></div>` : ''}
          </div>
        </div>
        <div class="card">
          <div class="card-header"><h3 class="card-title">${_esc(_tl('crm.items', 'Items'))}</h3></div>
          <div class="card-body" style="padding:0">${itemsHtml}</div>
        </div>
      </div>`;
  }

  // Navigation
  window._crmInvBack = function() { _activeView = 'list'; _selectedInvoice = null; _reload(); };

  window._crmInvDetail = async function(id) {
    _selectedInvoice = await fetchInvoiceDetail(id);
    _activeView = 'detail';
    const body = document.getElementById('overlay-panel-body');
    if (body) renderDetail(body);
  };

  window._crmInvMarkSent = async function(id) {
    try {
      await apiUpdateStatus(id, 'sent');
      if (typeof showToast === 'function') showToast(_tl('crm.marked_sent', 'Marked as sent'), 'success');
      _selectedInvoice = await fetchInvoiceDetail(id);
      const body = document.getElementById('overlay-panel-body');
      if (body) renderDetail(body);
    } catch (err) {
      if (typeof showToast === 'function') showToast(err.message, 'danger');
    }
  };

  window._crmInvMarkPaid = async function(id) {
    try {
      await apiUpdateStatus(id, 'paid');
      if (typeof showToast === 'function') showToast(_tl('crm.marked_paid', 'Marked as paid'), 'success');
      _selectedInvoice = await fetchInvoiceDetail(id);
      const body = document.getElementById('overlay-panel-body');
      if (body) renderDetail(body);
    } catch (err) {
      if (typeof showToast === 'function') showToast(err.message, 'danger');
    }
  };

  async function _reload() {
    const body = document.getElementById('overlay-panel-body');
    if (!body) return;
    _invoices = await fetchInvoices();
    if (_activeView === 'list') renderList(body);
    else if (_activeView === 'detail') renderDetail(body);
  }

  async function loadCrmInvoicesPanel() {
    const body = document.getElementById('overlay-panel-body');
    if (!body) return;
    _activeView = 'list';
    _selectedInvoice = null;
    _invoices = await fetchInvoices();
    renderList(body);
  }

  window.loadCrmInvoicesPanel = loadCrmInvoicesPanel;
})();
