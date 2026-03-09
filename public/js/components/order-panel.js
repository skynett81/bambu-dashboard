// Order Management Panel — project/order tracking, invoicing, customer management
(function() {
  'use strict';

  let _currentTab = 'overview';
  let _dashboard = null;
  let _projects = [];
  let _activeProject = null;
  let _invoices = [];

  function _esc(s) { const d = document.createElement('div'); d.textContent = s || ''; return d.innerHTML; }

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

  function isOverdue(deadline) {
    if (!deadline) return false;
    return new Date(deadline) < new Date();
  }

  // ═══ API calls ═══

  async function fetchDashboard() {
    const res = await fetch('/api/projects/dashboard');
    if (!res.ok) throw new Error('Failed');
    return res.json();
  }

  async function fetchProjects(status) {
    const q = status ? '?status=' + encodeURIComponent(status) : '';
    const res = await fetch('/api/projects' + q);
    if (!res.ok) throw new Error('Failed');
    return res.json();
  }

  async function fetchProjectDetails(id) {
    const res = await fetch('/api/projects/' + id + '/details');
    if (!res.ok) throw new Error('Failed');
    return res.json();
  }

  async function fetchCostSummary(id) {
    const res = await fetch('/api/projects/' + id + '/cost-summary');
    if (!res.ok) throw new Error('Failed');
    return res.json();
  }

  async function apiCreateProject(data) {
    const res = await fetch('/api/projects', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
    if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.error || 'Failed'); }
    return res.json();
  }

  async function apiUpdateProject(id, data) {
    const res = await fetch('/api/projects/' + id, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
    if (!res.ok) throw new Error('Failed');
    return res.json();
  }

  async function apiCreateInvoice(projectId, data) {
    const res = await fetch('/api/projects/' + projectId + '/invoice', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
    if (!res.ok) throw new Error('Failed');
    return res.json();
  }

  async function apiUpdateInvoiceStatus(id, status) {
    const res = await fetch('/api/invoices/' + id + '/status', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) });
    if (!res.ok) throw new Error('Failed');
    return res.json();
  }

  async function apiToggleShare(projectId, enabled) {
    const res = await fetch('/api/projects/' + projectId + '/share', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ enabled }) });
    if (!res.ok) throw new Error('Failed');
    return res.json();
  }

  async function apiLinkQueue(projectId, queueItemId, filename) {
    const res = await fetch('/api/projects/' + projectId + '/link-queue', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ queue_item_id: queueItemId, filename }) });
    if (!res.ok) throw new Error('Failed');
    return res.json();
  }

  // ═══ Tab system ═══

  function switchTab(tab) {
    _currentTab = tab;
    document.querySelectorAll('.order-tab-btn').forEach(b => b.classList.toggle('active', b.dataset.tab === tab));
    const body = document.getElementById('order-tab-content');
    if (!body) return;
    if (tab === 'overview') renderOverview(body);
    else if (tab === 'orders') renderOrders(body);
    else if (tab === 'invoices') renderInvoiceList(body);
  }

  // ═══ Overview tab ═══

  async function renderOverview(container) {
    container.innerHTML = '<div class="skeleton" style="height:200px;border-radius:8px"></div>';
    try {
      _dashboard = await fetchDashboard();
    } catch { _dashboard = { active_orders: 0, overdue_count: 0, revenue_this_month: 0, avg_order_value: 0, upcoming_deadlines: [], recent_activity: [] }; }

    const d = _dashboard;
    let html = '<div class="order-stats-row">' +
      _statCard(t('orders.active_orders'), d.active_orders, 'var(--accent-blue)') +
      _statCard(t('orders.overdue'), d.overdue_count, d.overdue_count > 0 ? 'var(--accent-red)' : 'var(--accent-green)') +
      _statCard(t('orders.revenue_month'), formatCurrency(d.revenue_this_month), 'var(--accent-green)') +
      _statCard(t('orders.avg_value'), formatCurrency(d.avg_order_value), 'var(--accent-purple)') +
      '</div>';

    // Upcoming deadlines
    html += '<div class="order-section"><h3>' + _esc(t('orders.upcoming_deadlines')) + '</h3>';
    if (d.upcoming_deadlines?.length) {
      html += '<div class="order-deadline-list">';
      for (const p of d.upcoming_deadlines) {
        const overdue = isOverdue(p.deadline);
        html += '<div class="order-deadline-item' + (overdue ? ' overdue' : '') + '" onclick="window._orderOpenDetail(' + p.id + ')">' +
          '<span class="order-deadline-name">' + _esc(p.name) + '</span>' +
          '<span class="order-deadline-customer">' + _esc(p.customer_name || p.client_name || '') + '</span>' +
          '<span class="order-deadline-date' + (overdue ? ' text-danger' : '') + '">' + formatDate(p.deadline || p.due_date) + '</span>' +
          '</div>';
      }
      html += '</div>';
    } else {
      html += '<p class="text-muted">' + _esc(t('orders.no_deadlines')) + '</p>';
    }
    html += '</div>';

    // Recent activity
    html += '<div class="order-section"><h3>' + _esc(t('orders.recent_activity')) + '</h3>';
    if (d.recent_activity?.length) {
      html += '<div class="order-timeline">';
      for (const ev of d.recent_activity) {
        html += '<div class="order-timeline-item">' +
          '<div class="order-timeline-dot"></div>' +
          '<div class="order-timeline-content">' +
          '<span class="order-timeline-project">' + _esc(ev.project_name || '') + '</span>' +
          '<span class="order-timeline-desc">' + _esc(ev.description || '') + '</span>' +
          '<span class="order-timeline-time">' + formatDateTime(ev.timestamp) + '</span>' +
          '</div></div>';
      }
      html += '</div>';
    } else {
      html += '<p class="text-muted">' + _esc(t('orders.no_activity')) + '</p>';
    }
    html += '</div>';

    container.innerHTML = html;
  }

  function _statCard(label, value, color) {
    return '<div class="order-stat-card"><div class="order-stat-value" style="color:' + color + '">' + _esc(String(value)) + '</div>' +
      '<div class="order-stat-label">' + _esc(label) + '</div></div>';
  }

  // ═══ Orders tab (Kanban) ═══

  async function renderOrders(container) {
    container.innerHTML = '<div class="skeleton" style="height:300px;border-radius:8px"></div>';
    try {
      _projects = await fetchProjects();
    } catch { _projects = []; }

    const columns = [
      { key: 'active', label: t('orders.status_received'), color: 'var(--accent-blue)' },
      { key: 'printing', label: t('orders.status_printing'), color: 'var(--accent-orange)' },
      { key: 'completed', label: t('orders.status_completed'), color: 'var(--accent-green)' },
      { key: 'invoiced', label: t('orders.status_invoiced'), color: 'var(--accent-purple)' }
    ];

    let html = '<div style="display:flex;justify-content:flex-end;margin-bottom:12px">' +
      '<button class="btn btn-primary btn-sm" onclick="window._orderNewProject()">' + _esc(t('orders.new_order')) + '</button></div>';

    html += '<div class="order-kanban">';
    for (const col of columns) {
      const items = _projects.filter(p => p.status === col.key);
      html += '<div class="order-kanban-col">' +
        '<div class="order-kanban-header" style="border-top:3px solid ' + col.color + '">' +
        '<span>' + _esc(col.label) + '</span><span class="order-kanban-count">' + items.length + '</span></div>' +
        '<div class="order-kanban-items">';
      for (const p of items) {
        const overdue = isOverdue(p.deadline || p.due_date);
        html += '<div class="order-kanban-card' + (overdue ? ' overdue' : '') + '" onclick="window._orderOpenDetail(' + p.id + ')">' +
          '<div class="order-card-name">' + _esc(p.name) + '</div>' +
          '<div class="order-card-customer">' + _esc(p.customer_name || p.client_name || '--') + '</div>' +
          (p.deadline || p.due_date ? '<div class="order-card-deadline' + (overdue ? ' text-danger' : '') + '">' + formatDate(p.deadline || p.due_date) + '</div>' : '') +
          (p.priority > 0 ? '<span class="order-priority-badge">' + _esc(t('orders.priority')) + '</span>' : '') +
          '</div>';
      }
      html += '</div></div>';
    }
    html += '</div>';

    container.innerHTML = html;
  }

  // ═══ Order detail ═══

  async function openDetail(projectId) {
    _currentTab = 'detail';
    const body = document.getElementById('order-tab-content');
    if (!body) return;
    body.innerHTML = '<div class="skeleton" style="height:400px;border-radius:8px"></div>';

    try {
      _activeProject = await fetchProjectDetails(projectId);
    } catch {
      body.innerHTML = '<p class="text-danger">Failed to load project</p>';
      return;
    }

    const costSummary = await fetchCostSummary(projectId).catch(() => null);
    const p = _activeProject;
    const overdue = isOverdue(p.deadline || p.due_date);

    let html = '<div style="display:flex;align-items:center;gap:12px;margin-bottom:16px">' +
      '<button class="btn btn-ghost btn-sm" onclick="window._orderSwitchTab(\'orders\')">&larr; ' + _esc(t('orders.back')) + '</button>' +
      '<h2 style="margin:0;flex:1">' + _esc(p.name) + '</h2>' +
      '<span class="order-status-badge order-status-' + (p.status || 'active') + '">' + _esc(p.status || 'active') + '</span></div>';

    // Customer info form
    html += '<div class="order-detail-grid"><div class="order-detail-section">' +
      '<h3>' + _esc(t('orders.customer_info')) + '</h3>' +
      '<div class="order-form-grid">' +
      _formField('customer_name', t('orders.customer_name'), p.customer_name || p.client_name || '') +
      _formField('customer_email', t('orders.customer_email'), p.customer_email || '', 'email') +
      _formField('customer_phone', t('orders.customer_phone'), p.customer_phone || '', 'tel') +
      '</div>' +
      '<div class="order-form-grid">' +
      '<div class="form-group"><label>' + _esc(t('orders.deadline')) + '</label>' +
      '<input type="date" class="form-input" id="order-deadline" value="' + _esc((p.deadline || p.due_date || '').split('T')[0]) + '"></div>' +
      '<div class="form-group"><label>' + _esc(t('orders.priority_label')) + '</label>' +
      '<select class="form-input" id="order-priority">' +
      '<option value="0"' + (p.priority == 0 ? ' selected' : '') + '>' + _esc(t('orders.priority_normal')) + '</option>' +
      '<option value="1"' + (p.priority == 1 ? ' selected' : '') + '>' + _esc(t('orders.priority_high')) + '</option>' +
      '<option value="2"' + (p.priority == 2 ? ' selected' : '') + '>' + _esc(t('orders.priority_urgent')) + '</option>' +
      '</select></div>' +
      '<div class="form-group"><label>' + _esc(t('orders.status')) + '</label>' +
      '<select class="form-input" id="order-status">' +
      ['active', 'printing', 'completed', 'invoiced', 'cancelled'].map(s =>
        '<option value="' + s + '"' + (p.status === s ? ' selected' : '') + '>' + _esc(s) + '</option>'
      ).join('') +
      '</select></div>' +
      '</div>' +
      '<div class="form-group"><label>' + _esc(t('orders.estimated_cost')) + '</label>' +
      '<input type="number" class="form-input" id="order-estimated-cost" value="' + (p.estimated_cost || '') + '" step="0.01"></div>' +
      '<button class="btn btn-primary btn-sm" style="margin-top:8px" onclick="window._orderSaveDetail()">' + _esc(t('orders.save')) + '</button>' +
      '</div>';

    // Cost summary
    html += '<div class="order-detail-section">' +
      '<h3>' + _esc(t('orders.cost_summary')) + '</h3>';
    if (costSummary) {
      html += '<div class="order-cost-grid">' +
        _costRow(t('orders.total_prints'), costSummary.total_prints) +
        _costRow(t('orders.completed_prints'), costSummary.completed_prints) +
        _costRow(t('orders.filament_cost'), formatCurrency(costSummary.filament_cost)) +
        _costRow(t('orders.energy_cost'), formatCurrency(costSummary.energy_cost)) +
        _costRow(t('orders.actual_cost'), formatCurrency(costSummary.actual_cost)) +
        _costRow(t('orders.filament_used'), (costSummary.total_filament_g || 0).toFixed(1) + ' g') +
        '</div>';
      if (p.estimated_cost) {
        const diff = (costSummary.actual_cost || 0) - p.estimated_cost;
        html += '<div class="order-cost-diff" style="color:' + (diff > 0 ? 'var(--accent-red)' : 'var(--accent-green)') + '">' +
          _esc(t('orders.cost_diff')) + ': ' + (diff > 0 ? '+' : '') + formatCurrency(diff) + '</div>';
      }
    } else {
      html += '<p class="text-muted">' + _esc(t('orders.no_cost_data')) + '</p>';
    }
    html += '</div></div>';

    // Linked prints
    html += '<div class="order-detail-section"><h3>' + _esc(t('orders.linked_prints')) + '</h3>';
    if (p.prints?.length) {
      html += '<table class="order-prints-table"><thead><tr>' +
        '<th>' + _esc(t('orders.filename')) + '</th>' +
        '<th>' + _esc(t('orders.status')) + '</th>' +
        '<th>' + _esc(t('orders.cost')) + '</th>' +
        '</tr></thead><tbody>';
      for (const pr of p.prints) {
        html += '<tr><td>' + _esc(pr.print_filename || pr.filename || '--') + '</td>' +
          '<td><span class="order-print-status order-ps-' + (pr.print_status || pr.status || 'pending') + '">' + _esc(pr.print_status || pr.status || 'pending') + '</span></td>' +
          '<td>' + formatCurrency(pr.print_cost) + '</td></tr>';
      }
      html += '</tbody></table>';
    } else {
      html += '<p class="text-muted">' + _esc(t('orders.no_prints_linked')) + '</p>';
    }
    html += '<button class="btn btn-ghost btn-sm" style="margin-top:8px" onclick="window._orderLinkQueue()">' + _esc(t('orders.link_queue_item')) + '</button>';
    html += '</div>';

    // Share link
    html += '<div class="order-detail-section"><h3>' + _esc(t('orders.share_link')) + '</h3>' +
      '<div style="display:flex;align-items:center;gap:12px">' +
      '<label class="toggle-label"><input type="checkbox" id="order-share-toggle" ' + (p.share_enabled ? 'checked' : '') +
      ' onchange="window._orderToggleShare()"> ' + _esc(t('orders.share_enabled')) + '</label>';
    if (p.share_enabled && p.share_token) {
      const shareUrl = location.origin + '/api/shared/' + p.share_token;
      html += '<input type="text" class="form-input" readonly value="' + _esc(shareUrl) + '" id="order-share-url" style="flex:1">' +
        '<button class="btn btn-ghost btn-sm" onclick="navigator.clipboard.writeText(document.getElementById(\'order-share-url\').value);if(typeof showToast===\'function\')showToast(\'' + _esc(t('orders.link_copied')) + '\',\'success\',2000)">' + _esc(t('orders.copy')) + '</button>';
    }
    html += '</div></div>';

    // Actions
    html += '<div class="order-detail-section"><h3>' + _esc(t('orders.actions')) + '</h3>' +
      '<div style="display:flex;gap:8px;flex-wrap:wrap">' +
      '<button class="btn btn-primary btn-sm" onclick="window._orderGenerateInvoice()">' + _esc(t('orders.generate_invoice')) + '</button>' +
      '</div></div>';

    // Timeline
    html += '<div class="order-detail-section"><h3>' + _esc(t('orders.timeline')) + '</h3>';
    if (p.timeline?.length) {
      html += '<div class="order-timeline">';
      for (const ev of p.timeline) {
        html += '<div class="order-timeline-item">' +
          '<div class="order-timeline-dot"></div>' +
          '<div class="order-timeline-content">' +
          '<span class="order-timeline-desc">' + _esc(ev.description || '') + '</span>' +
          '<span class="order-timeline-time">' + formatDateTime(ev.timestamp) + '</span>' +
          '</div></div>';
      }
      html += '</div>';
    } else {
      html += '<p class="text-muted">' + _esc(t('orders.no_timeline')) + '</p>';
    }
    html += '</div>';

    body.innerHTML = html;
  }

  function _formField(id, label, value, type) {
    return '<div class="form-group"><label>' + _esc(label) + '</label>' +
      '<input type="' + (type || 'text') + '" class="form-input" id="order-' + id + '" value="' + _esc(value) + '"></div>';
  }

  function _costRow(label, value) {
    return '<div class="order-cost-row"><span>' + _esc(label) + '</span><span>' + _esc(String(value)) + '</span></div>';
  }

  // ═══ Invoice list tab ═══

  async function renderInvoiceList(container) {
    container.innerHTML = '<div class="skeleton" style="height:200px;border-radius:8px"></div>';
    try {
      const all = await fetchProjects();
      _invoices = [];
      for (const p of all) {
        try {
          const res = await fetch('/api/projects/' + p.id + '/invoices');
          if (res.ok) {
            const invs = await res.json();
            for (const inv of invs) { inv._project_name = p.name; _invoices.push(inv); }
          }
        } catch {}
      }
    } catch { _invoices = []; }

    let html = '';
    if (_invoices.length === 0) {
      html = '<p class="text-muted">' + _esc(t('orders.no_invoices')) + '</p>';
    } else {
      html = '<table class="order-prints-table"><thead><tr>' +
        '<th>' + _esc(t('orders.invoice_number')) + '</th>' +
        '<th>' + _esc(t('orders.project')) + '</th>' +
        '<th>' + _esc(t('orders.customer_name')) + '</th>' +
        '<th>' + _esc(t('orders.total')) + '</th>' +
        '<th>' + _esc(t('orders.status')) + '</th>' +
        '<th>' + _esc(t('orders.actions')) + '</th>' +
        '</tr></thead><tbody>';
      for (const inv of _invoices) {
        html += '<tr>' +
          '<td>' + _esc(inv.invoice_number || '--') + '</td>' +
          '<td>' + _esc(inv._project_name || '--') + '</td>' +
          '<td>' + _esc(inv.customer_name || '--') + '</td>' +
          '<td>' + formatCurrency(inv.total, inv.currency) + '</td>' +
          '<td><span class="order-invoice-badge order-inv-' + (inv.status || 'draft') + '">' + _esc(inv.status || 'draft') + '</span></td>' +
          '<td><div style="display:flex;gap:4px">' +
          '<button class="btn btn-ghost btn-xs" onclick="window.open(\'/api/invoices/' + inv.id + '/html\',\'_blank\')">' + _esc(t('orders.view')) + '</button>';
        if (inv.status === 'draft') {
          html += '<button class="btn btn-ghost btn-xs" onclick="window._orderSetInvoiceStatus(' + inv.id + ',\'sent\')">' + _esc(t('orders.mark_sent')) + '</button>';
        }
        if (inv.status === 'sent') {
          html += '<button class="btn btn-ghost btn-xs" onclick="window._orderSetInvoiceStatus(' + inv.id + ',\'paid\')">' + _esc(t('orders.mark_paid')) + '</button>';
        }
        html += '</div></td></tr>';
      }
      html += '</tbody></table>';
    }
    container.innerHTML = html;
  }

  // ═══ Actions ═══

  window._orderSwitchTab = function(tab) { switchTab(tab); };

  window._orderOpenDetail = function(id) { openDetail(id); };

  window._orderNewProject = function() {
    const name = prompt(t('orders.enter_name'));
    if (!name) return;
    apiCreateProject({ name, status: 'active' }).then(() => {
      if (typeof showToast === 'function') showToast(t('orders.created'), 'success', 2000);
      switchTab('orders');
    }).catch(e => {
      if (typeof showToast === 'function') showToast(e.message, 'error', 3000);
    });
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
    apiUpdateProject(_activeProject.id, data).then(() => {
      if (typeof showToast === 'function') showToast(t('orders.saved'), 'success', 2000);
      openDetail(_activeProject.id);
    }).catch(e => {
      if (typeof showToast === 'function') showToast(e.message, 'error', 3000);
    });
  };

  window._orderToggleShare = function() {
    if (!_activeProject) return;
    const enabled = document.getElementById('order-share-toggle')?.checked;
    apiToggleShare(_activeProject.id, enabled).then(() => {
      openDetail(_activeProject.id);
    }).catch(e => {
      if (typeof showToast === 'function') showToast(e.message, 'error', 3000);
    });
  };

  window._orderLinkQueue = function() {
    if (!_activeProject) return;
    const queueItemId = prompt(t('orders.enter_queue_id'));
    if (!queueItemId) return;
    apiLinkQueue(_activeProject.id, parseInt(queueItemId)).then(() => {
      if (typeof showToast === 'function') showToast(t('orders.queue_linked'), 'success', 2000);
      openDetail(_activeProject.id);
    }).catch(e => {
      if (typeof showToast === 'function') showToast(e.message, 'error', 3000);
    });
  };

  window._orderGenerateInvoice = async function() {
    if (!_activeProject) return;
    const p = _activeProject;
    try {
      const cost = await fetchCostSummary(p.id);
      const subtotal = cost.actual_cost || 0;
      const taxRate = 0.25;
      const taxAmount = subtotal * taxRate;
      const total = subtotal + taxAmount;
      const items = [];
      if (p.prints) {
        for (const pr of p.prints) {
          items.push({
            description: pr.print_filename || pr.filename || 'Print job',
            qty: 1,
            unit_price: pr.print_cost || 0
          });
        }
      }
      if (items.length === 0) {
        items.push({ description: p.name, qty: 1, unit_price: subtotal });
      }
      await apiCreateInvoice(p.id, {
        customer_name: p.customer_name || p.client_name || '',
        customer_email: p.customer_email || '',
        items,
        subtotal,
        tax_rate: taxRate,
        tax_amount: taxAmount,
        total,
        currency: 'NOK'
      });
      if (typeof showToast === 'function') showToast(t('orders.invoice_created'), 'success', 2000);
      openDetail(p.id);
    } catch (e) {
      if (typeof showToast === 'function') showToast(e.message, 'error', 3000);
    }
  };

  window._orderSetInvoiceStatus = function(id, status) {
    apiUpdateInvoiceStatus(id, status).then(() => {
      if (typeof showToast === 'function') showToast(t('orders.status_updated'), 'success', 2000);
      if (_currentTab === 'invoices') {
        const body = document.getElementById('order-tab-content');
        if (body) renderInvoiceList(body);
      } else if (_activeProject) {
        openDetail(_activeProject.id);
      }
    }).catch(e => {
      if (typeof showToast === 'function') showToast(e.message, 'error', 3000);
    });
  };

  // ═══ Main render ═══

  function t(key) {
    if (typeof window.t === 'function') return window.t(key);
    return key.split('.').pop();
  }

  window.loadOrderPanel = function() {
    const body = document.getElementById('overlay-panel-body');
    if (!body) return;

    body.innerHTML = '<div class="order-panel">' +
      '<div class="order-tabs">' +
      '<button class="order-tab-btn active" data-tab="overview" onclick="window._orderSwitchTab(\'overview\')">' + _esc(t('orders.tab_overview')) + '</button>' +
      '<button class="order-tab-btn" data-tab="orders" onclick="window._orderSwitchTab(\'orders\')">' + _esc(t('orders.tab_orders')) + '</button>' +
      '<button class="order-tab-btn" data-tab="invoices" onclick="window._orderSwitchTab(\'invoices\')">' + _esc(t('orders.tab_invoices')) + '</button>' +
      '</div>' +
      '<div id="order-tab-content"></div>' +
      '</div>' +
      '<style>' +
      '.order-panel { padding: 0; }' +
      '.order-tabs { display: flex; gap: 4px; padding: 0 0 12px; border-bottom: 1px solid var(--border); margin-bottom: 16px; }' +
      '.order-tab-btn { background: none; border: none; padding: 8px 16px; border-radius: 6px 6px 0 0; cursor: pointer; font-weight: 500; color: var(--text-muted); transition: all .15s; }' +
      '.order-tab-btn:hover { background: var(--bg-card-hover, rgba(255,255,255,.05)); }' +
      '.order-tab-btn.active { color: var(--accent-blue); border-bottom: 2px solid var(--accent-blue); }' +
      '.order-stats-row { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 12px; margin-bottom: 24px; }' +
      '.order-stat-card { background: var(--bg-card); border: 1px solid var(--border); border-radius: 10px; padding: 16px; text-align: center; }' +
      '.order-stat-value { font-size: 1.8rem; font-weight: 700; }' +
      '.order-stat-label { font-size: .85rem; color: var(--text-muted); margin-top: 4px; }' +
      '.order-section { margin-bottom: 24px; }' +
      '.order-section h3 { margin: 0 0 12px; font-size: 1rem; }' +
      '.order-deadline-list { display: flex; flex-direction: column; gap: 6px; }' +
      '.order-deadline-item { display: flex; align-items: center; gap: 12px; padding: 10px 14px; background: var(--bg-card); border: 1px solid var(--border); border-radius: 8px; cursor: pointer; transition: border-color .15s; }' +
      '.order-deadline-item:hover { border-color: var(--accent-blue); }' +
      '.order-deadline-item.overdue { border-left: 3px solid var(--accent-red); }' +
      '.order-deadline-name { font-weight: 600; flex: 1; }' +
      '.order-deadline-customer { color: var(--text-muted); font-size: .85rem; }' +
      '.order-deadline-date { font-size: .85rem; font-weight: 500; }' +
      '.order-timeline { display: flex; flex-direction: column; gap: 0; padding-left: 16px; border-left: 2px solid var(--border); }' +
      '.order-timeline-item { display: flex; gap: 12px; padding: 8px 0; position: relative; }' +
      '.order-timeline-dot { width: 10px; height: 10px; background: var(--accent-blue); border-radius: 50%; margin-top: 4px; position: absolute; left: -22px; }' +
      '.order-timeline-content { display: flex; flex-direction: column; gap: 2px; }' +
      '.order-timeline-project { font-weight: 600; font-size: .85rem; }' +
      '.order-timeline-desc { font-size: .85rem; }' +
      '.order-timeline-time { font-size: .75rem; color: var(--text-muted); }' +
      '.order-kanban { display: flex; gap: 12px; overflow-x: auto; padding-bottom: 8px; }' +
      '.order-kanban-col { flex: 1; min-width: 220px; background: var(--bg-card); border: 1px solid var(--border); border-radius: 10px; }' +
      '.order-kanban-header { display: flex; justify-content: space-between; align-items: center; padding: 12px 14px; font-weight: 600; font-size: .9rem; border-radius: 10px 10px 0 0; }' +
      '.order-kanban-count { background: var(--bg-hover, rgba(255,255,255,.1)); padding: 2px 8px; border-radius: 10px; font-size: .75rem; }' +
      '.order-kanban-items { padding: 8px; display: flex; flex-direction: column; gap: 8px; max-height: 500px; overflow-y: auto; }' +
      '.order-kanban-card { padding: 12px; background: var(--bg-main, #1a1a2e); border: 1px solid var(--border); border-radius: 8px; cursor: pointer; transition: all .15s; }' +
      '.order-kanban-card:hover { border-color: var(--accent-blue); transform: translateY(-1px); }' +
      '.order-kanban-card.overdue { border-left: 3px solid var(--accent-red); }' +
      '.order-card-name { font-weight: 600; margin-bottom: 4px; }' +
      '.order-card-customer { font-size: .8rem; color: var(--text-muted); }' +
      '.order-card-deadline { font-size: .8rem; margin-top: 4px; }' +
      '.order-priority-badge { display: inline-block; background: var(--accent-orange); color: #fff; font-size: .65rem; font-weight: 700; padding: 1px 6px; border-radius: 4px; margin-top: 6px; }' +
      '.order-status-badge { display: inline-block; padding: 4px 12px; border-radius: 12px; font-size: .8rem; font-weight: 600; }' +
      '.order-status-active { background: #dbeafe; color: #1e40af; }' +
      '.order-status-printing { background: #fef3c7; color: #92400e; }' +
      '.order-status-completed { background: #d1fae5; color: #065f46; }' +
      '.order-status-invoiced { background: #ede9fe; color: #5b21b6; }' +
      '.order-status-cancelled { background: #fee2e2; color: #991b1b; }' +
      '.order-detail-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 24px; }' +
      '@media (max-width: 768px) { .order-detail-grid { grid-template-columns: 1fr; } .order-kanban { flex-direction: column; } }' +
      '.order-detail-section { margin-bottom: 24px; }' +
      '.order-detail-section h3 { margin: 0 0 12px; font-size: 1rem; }' +
      '.order-form-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 12px; margin-bottom: 12px; }' +
      '.form-group { display: flex; flex-direction: column; gap: 4px; }' +
      '.form-group label { font-size: .8rem; font-weight: 500; color: var(--text-muted); }' +
      '.form-input { padding: 8px 10px; border: 1px solid var(--border); border-radius: 6px; background: var(--bg-card); color: var(--text); font-size: .9rem; }' +
      '.form-input:focus { outline: none; border-color: var(--accent-blue); }' +
      '.order-cost-grid { display: flex; flex-direction: column; gap: 6px; }' +
      '.order-cost-row { display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid var(--border); font-size: .9rem; }' +
      '.order-cost-diff { margin-top: 8px; font-weight: 600; font-size: .9rem; }' +
      '.order-prints-table { width: 100%; border-collapse: collapse; font-size: .85rem; }' +
      '.order-prints-table th { text-align: left; padding: 8px 10px; border-bottom: 2px solid var(--border); font-weight: 600; color: var(--text-muted); font-size: .8rem; }' +
      '.order-prints-table td { padding: 8px 10px; border-bottom: 1px solid var(--border); }' +
      '.order-print-status, .order-invoice-badge { display: inline-block; padding: 2px 8px; border-radius: 8px; font-size: .75rem; font-weight: 600; }' +
      '.order-ps-finish, .order-ps-completed { background: #d1fae5; color: #065f46; }' +
      '.order-ps-pending { background: #e5e7eb; color: #4b5563; }' +
      '.order-ps-printing { background: #fef3c7; color: #92400e; }' +
      '.order-ps-failed { background: #fee2e2; color: #991b1b; }' +
      '.order-inv-draft { background: #e5e7eb; color: #4b5563; }' +
      '.order-inv-sent { background: #dbeafe; color: #1e40af; }' +
      '.order-inv-paid { background: #d1fae5; color: #065f46; }' +
      '.toggle-label { display: flex; align-items: center; gap: 8px; cursor: pointer; font-size: .9rem; }' +
      '.text-danger { color: var(--accent-red); }' +
      '.text-muted { color: var(--text-muted); }' +
      '.btn-xs { padding: 3px 8px; font-size: .75rem; }' +
      '</style>';

    _currentTab = 'overview';
    const content = document.getElementById('order-tab-content');
    if (content) renderOverview(content);
  };
})();
