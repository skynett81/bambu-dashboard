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

  const STATUS_COLORS = {
    draft: '#94a3b8', sent: '#3b82f6', paid: '#22c55e', overdue: '#ef4444', cancelled: '#6b7280'
  };

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
      html += `<div class="card"><div class="card-body" style="text-align:center;padding:2rem;opacity:0.6">
        ${_esc(_tl('crm.no_invoices', 'Ingen fakturaer'))}
      </div></div>`;
    } else {
      html += `<div class="card"><div class="card-body" style="padding:0">
        <table class="table table-hover table-sm" style="margin:0">
          <thead><tr>
            <th>${_esc(_tl('crm.invoice_number', 'Faktura #'))}</th>
            <th>${_esc(_tl('crm.order_number', 'Ordre #'))}</th>
            <th>${_esc(_tl('crm.customer_name', 'Kunde'))}</th>
            <th>${_esc(_tl('crm.status', 'Status'))}</th>
            <th style="text-align:right">${_esc(_tl('crm.total', 'Total'))}</th>
            <th>${_esc(_tl('crm.due_date', 'Forfallsdato'))}</th>
          </tr></thead>
          <tbody>${_invoices.map(inv => {
            const sc = STATUS_COLORS[inv.status] || '#94a3b8';
            const isOverdue = inv.due_date && inv.status === 'sent' && new Date(inv.due_date) < new Date();
            const effectiveStatus = isOverdue ? 'overdue' : inv.status;
            const effectiveColor = STATUS_COLORS[effectiveStatus] || sc;
            return `<tr style="cursor:pointer" onclick="window._crmInvDetail(${inv.id})">
              <td><strong>${_esc(inv.invoice_number)}</strong></td>
              <td>${_esc(inv.order_number || '--')}</td>
              <td>${_esc(inv.customer_name || '--')}</td>
              <td><span class="badge" style="background:${effectiveColor};color:#fff;font-size:0.75rem;padding:2px 8px;border-radius:4px">${_esc(_tl('crm.inv_status_' + effectiveStatus, effectiveStatus))}</span></td>
              <td style="text-align:right">${formatCurrency(inv.total)}</td>
              <td>${formatDate(inv.due_date)}</td>
            </tr>`;
          }).join('')}</tbody>
        </table>
      </div></div>`;
    }

    body.innerHTML = html;
  }

  // Render detail
  function renderDetail(body) {
    const inv = _selectedInvoice;
    if (!inv) { _activeView = 'list'; renderList(body); return; }

    const sc = STATUS_COLORS[inv.status] || '#94a3b8';

    let itemsHtml = '';
    let items = [];
    try { items = typeof inv.items === 'string' ? JSON.parse(inv.items) : (inv.items || []); } catch { items = []; }

    if (items.length > 0) {
      itemsHtml = `<table class="table table-sm" style="margin:0">
        <thead><tr>
          <th>${_esc(_tl('crm.description', 'Beskrivelse'))}</th>
          <th>${_esc(_tl('crm.quantity', 'Antall'))}</th>
          <th style="text-align:right">${_esc(_tl('crm.total', 'Pris'))}</th>
        </tr></thead>
        <tbody>${items.map(it => `<tr>
          <td>${_esc(it.description || '--')}</td>
          <td>${it.quantity || 1}</td>
          <td style="text-align:right">${formatCurrency(it.total_cost || it.unit_price)}</td>
        </tr>`).join('')}</tbody>
        <tfoot>
          <tr><td colspan="2" style="text-align:right"><strong>${_esc(_tl('crm.subtotal', 'Subtotal'))}</strong></td><td style="text-align:right"><strong>${formatCurrency(inv.subtotal)}</strong></td></tr>
          ${inv.tax_amount ? `<tr><td colspan="2" style="text-align:right">${_esc(_tl('crm.tax', 'MVA'))} (${inv.tax_pct || 25}%)</td><td style="text-align:right">${formatCurrency(inv.tax_amount)}</td></tr>` : ''}
          <tr><td colspan="2" style="text-align:right"><strong>${_esc(_tl('crm.total', 'Total'))}</strong></td><td style="text-align:right"><strong>${formatCurrency(inv.total)}</strong></td></tr>
        </tfoot>
      </table>`;
    } else {
      itemsHtml = `<div style="text-align:center;padding:1rem;opacity:0.6">${_esc(_tl('crm.no_items', 'Ingen artikler'))}</div>`;
    }

    // Action buttons based on status
    let actionBtns = '';
    if (inv.status === 'draft') {
      actionBtns = `<button class="btn btn-sm btn-primary" onclick="window._crmInvMarkSent(${inv.id})"><i class="bi bi-send"></i> ${_esc(_tl('crm.mark_sent', 'Marker sendt'))}</button>`;
    } else if (inv.status === 'sent') {
      actionBtns = `<button class="btn btn-sm btn-success" onclick="window._crmInvMarkPaid(${inv.id})"><i class="bi bi-check-circle"></i> ${_esc(_tl('crm.mark_paid', 'Marker betalt'))}</button>`;
    }
    // Always show print/open invoice button
    actionBtns += ` <button class="btn btn-sm btn-outline-info" onclick="window.open('/api/crm/invoices/${inv.id}/html', '_blank')"><i class="bi bi-printer"></i> ${_esc(_tl('crm.print_invoice', 'Skriv ut faktura'))}</button>`;

    body.innerHTML = `
      <div style="margin-bottom:1rem;display:flex;gap:0.5rem;flex-wrap:wrap;align-items:center">
        <button class="btn btn-sm btn-outline-secondary" onclick="window._crmInvBack()"><i class="bi bi-arrow-left"></i> ${_esc(_tl('crm.back', 'Tilbake'))}</button>
        ${actionBtns}
      </div>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:1rem">
        <div class="card">
          <div class="card-header"><h3 class="card-title">${_esc(inv.invoice_number)}</h3></div>
          <div class="card-body">
            <div class="stats-detail-item"><span class="stats-detail-item-label">${_esc(_tl('crm.status', 'Status'))}</span><span class="stats-detail-item-value"><span class="badge" style="background:${sc};color:#fff;padding:2px 8px;border-radius:4px">${_esc(_tl('crm.inv_status_' + inv.status, inv.status))}</span></span></div>
            <div class="stats-detail-item"><span class="stats-detail-item-label">${_esc(_tl('crm.order_number', 'Ordre'))}</span><span class="stats-detail-item-value">${_esc(inv.order_number || '--')}</span></div>
            <div class="stats-detail-item"><span class="stats-detail-item-label">${_esc(_tl('crm.customer_name', 'Kunde'))}</span><span class="stats-detail-item-value">${_esc(inv.customer_name || '--')}</span></div>
            <div class="stats-detail-item"><span class="stats-detail-item-label">${_esc(_tl('crm.due_date', 'Forfallsdato'))}</span><span class="stats-detail-item-value">${formatDate(inv.due_date)}</span></div>
            <div class="stats-detail-item"><span class="stats-detail-item-label">${_esc(_tl('crm.created', 'Opprettet'))}</span><span class="stats-detail-item-value">${formatDate(inv.created_at)}</span></div>
            ${inv.sent_at ? `<div class="stats-detail-item"><span class="stats-detail-item-label">${_esc(_tl('crm.sent_at', 'Sendt'))}</span><span class="stats-detail-item-value">${formatDate(inv.sent_at)}</span></div>` : ''}
            ${inv.paid_at ? `<div class="stats-detail-item"><span class="stats-detail-item-label">${_esc(_tl('crm.paid_at', 'Betalt'))}</span><span class="stats-detail-item-value">${formatDate(inv.paid_at)}</span></div>` : ''}
            ${inv.notes ? `<div style="margin-top:0.5rem"><strong>${_esc(_tl('crm.notes', 'Notater'))}</strong><p style="white-space:pre-wrap;margin:0.25rem 0">${_esc(inv.notes)}</p></div>` : ''}
          </div>
        </div>
        <div class="card">
          <div class="card-header"><h3 class="card-title">${_esc(_tl('crm.items', 'Linjer'))}</h3></div>
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
      if (typeof showToast === 'function') showToast(_tl('crm.marked_sent', 'Markert som sendt'), 'success');
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
      if (typeof showToast === 'function') showToast(_tl('crm.marked_paid', 'Markert som betalt'), 'success');
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
