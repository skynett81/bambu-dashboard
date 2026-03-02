// Print Queue Panel
(function() {

  const TAB_CONFIG = {
    active:   { label: 'queue.tab_active',   modules: ['queue-hero', 'queue-list', 'active-jobs'] },
    history:  { label: 'queue.tab_history',   modules: ['completed-items'] },
    settings: { label: 'queue.tab_settings',  modules: ['queue-settings'] }
  };
  const MODULE_SIZE = {
    'queue-hero': 'full', 'queue-list': 'full', 'active-jobs': 'full',
    'completed-items': 'full', 'queue-settings': 'full'
  };

  const STORAGE_PREFIX = 'queue-module-order-';
  const LOCK_KEY = 'queue-layout-locked';

  let _activeTab = 'active';
  let _locked = localStorage.getItem(LOCK_KEY) !== '0';
  let _queues = [];
  let _selectedQueue = null;
  let _draggedMod = null;

  function getOrder(tabId) {
    try { const o = JSON.parse(localStorage.getItem(STORAGE_PREFIX + tabId)); if (Array.isArray(o)) return o; } catch {}
    return TAB_CONFIG[tabId]?.modules || [];
  }
  function saveOrder(tabId) {
    const cont = document.getElementById(`queue-tab-${tabId}`);
    if (!cont) return;
    const ids = [...cont.querySelectorAll('.stats-module[data-module-id]')].map(m => m.dataset.moduleId);
    localStorage.setItem(STORAGE_PREFIX + tabId, JSON.stringify(ids));
  }

  function printerName(id) {
    return window.printerState?._printerMeta?.[id]?.name || id || '--';
  }

  function fmtDate(iso) {
    if (!iso) return '--';
    const locale = (window.i18n?.getLocale() || 'nb').replace('_', '-');
    return new Date(iso).toLocaleDateString(locale, { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
  }

  function statusBadge(status) {
    const colors = { active: 'var(--accent-green)', paused: 'var(--accent-orange)', completed: 'var(--text-secondary)', pending: 'var(--text-secondary)', printing: 'var(--accent-blue)', failed: 'var(--accent-red)', skipped: 'var(--text-muted)', cancelled: 'var(--text-muted)' };
    return `<span class="queue-status-badge" style="background:${colors[status] || 'var(--text-muted)'}33;color:${colors[status] || 'var(--text-muted)'};padding:2px 8px;border-radius:10px;font-size:0.75rem">${t('queue.status_' + status) || status}</span>`;
  }

  // ═══ Module builders ═══
  const BUILDERS = {
    'queue-hero': () => {
      const active = _queues.filter(q => q.status === 'active').length;
      const total = _queues.length;
      const printing = _queues.reduce((s, q) => s + (q.printing_count || 0), 0);
      return `<div class="stat-grid">
        <div class="stat-card"><div class="stat-value">${active}</div><div class="stat-label">${t('queue.active_queues')}</div></div>
        <div class="stat-card"><div class="stat-value" style="color:var(--accent-blue)">${printing}</div><div class="stat-label">${t('queue.active_jobs')}</div></div>
        <div class="stat-card"><div class="stat-value">${total}</div><div class="stat-label">${t('queue.total_queues')}</div></div>
      </div>
      <div style="margin-top:12px;display:flex;gap:8px">
        <button class="btn btn-primary" data-ripple onclick="window._queueShowCreate()">${t('queue.create')}</button>
        <button class="btn btn-ghost" data-ripple onclick="window._queueForceDispatch()">${t('queue.dispatch_now')}</button>
      </div>`;
    },

    'queue-list': () => {
      const activeQueues = _queues.filter(q => q.status === 'active' || q.status === 'paused');
      if (activeQueues.length === 0) return `<div class="stats-empty">${t('queue.no_queues')}</div>`;

      return activeQueues.map(q => {
        const progressPct = q.item_count > 0 ? Math.round((q.completed_count / q.item_count) * 100) : 0;
        return `<div class="queue-card" data-queue-id="${q.id}" onclick="window._queueSelect(${q.id})">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px">
            <strong>${q.name}</strong>
            <div style="display:flex;gap:6px;align-items:center">
              ${statusBadge(q.status)}
              <span style="font-size:0.8rem;color:var(--text-secondary)">${q.completed_count}/${q.item_count}</span>
            </div>
          </div>
          <div class="chart-bar-track" style="height:6px;margin-bottom:6px"><div class="chart-bar-fill" style="width:${progressPct}%;background:var(--accent-green)"></div></div>
          <div style="display:flex;gap:8px;font-size:0.75rem;color:var(--text-secondary)">
            <span>${q.auto_start ? t('queue.auto_start') : t('queue.manual')}</span>
            <span>${q.priority_mode}</span>
            ${q.target_printer_id ? `<span>${printerName(q.target_printer_id)}</span>` : ''}
          </div>
          <div style="margin-top:8px;display:flex;gap:6px">
            ${q.status === 'active' ? `<button class="btn btn-ghost btn-sm" data-ripple data-tooltip="${t('queue.pause_queue')}" onclick="event.stopPropagation();window._queuePause(${q.id})">${t('queue.pause_queue')}</button>` :
              q.status === 'paused' ? `<button class="btn btn-ghost btn-sm" data-ripple data-tooltip="${t('queue.resume_queue')}" onclick="event.stopPropagation();window._queueResume(${q.id})">${t('queue.resume_queue')}</button>` : ''}
            <button class="btn btn-ghost btn-sm" data-ripple onclick="event.stopPropagation();window._queueAddItem(${q.id})">${t('queue.add_item')}</button>
          </div>
        </div>`;
      }).join('');
    },

    'active-jobs': () => {
      if (!_selectedQueue) return '';
      const queue = _queues.find(q => q.id === _selectedQueue);
      if (!queue) return '';

      return `<div id="queue-items-container"></div>`;
    },

    'completed-items': () => {
      return `<div id="queue-completed-container"><div class="stats-empty">${t('queue.loading')}</div></div>`;
    },

    'queue-settings': () => {
      return `<div class="stats-empty">${t('queue.select_queue_settings')}</div>`;
    }
  };

  // ═══ Load queue items for selected queue ═══
  async function _loadQueueItems(queueId) {
    try {
      const resp = await fetch(`/api/queue/${queueId}`);
      const queue = await resp.json();
      if (queue.error) return;

      const container = document.getElementById('queue-items-container');
      if (!container) return;

      const items = queue.items || [];
      if (items.length === 0) {
        container.innerHTML = `<div class="stats-empty">${t('queue.no_items')}</div>`;
        return;
      }

      container.innerHTML = `<div class="queue-items-header" style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
        <strong>${queue.name} — ${t('queue.items_count', { count: items.length })}</strong>
      </div>` + items.map(item => `
        <div class="queue-item q-item" data-item-id="${item.id}" draggable="true" style="display:flex;align-items:center;gap:12px;padding:10px;border:1px solid var(--border);border-radius:8px;margin-bottom:6px;background:var(--card-bg)">
          <span class="queue-item-drag" style="cursor:grab;color:var(--text-muted)">⠿</span>
          <div style="flex:1;min-width:0">
            <div style="font-weight:500;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${item.filename}</div>
            <div style="font-size:0.75rem;color:var(--text-secondary);display:flex;gap:8px;margin-top:2px">
              ${item.printer_id ? `<span>${printerName(item.printer_id)}</span>` : ''}
              ${item.copies > 1 ? `<span>${item.copies_completed}/${item.copies} copies</span>` : ''}
              ${item.required_material ? `<span>${item.required_material}</span>` : ''}
            </div>
          </div>
          ${statusBadge(item.status)}
          <div style="display:flex;gap:4px">
            ${item.status === 'pending' ? `<button class="btn btn-ghost btn-sm" data-ripple data-tooltip="${t('queue.skip')}" onclick="window._queueSkipItem(${item.id})" title="${t('queue.skip')}">&times;</button>` : ''}
          </div>
        </div>`).join('');

      // Setup drag-and-drop for reordering
      _setupItemDrag(container, queueId);
    } catch (e) {
      console.error('[queue] Failed to load items:', e);
    }
  }

  function _setupItemDrag(container, queueId) {
    let dragItem = null;
    container.querySelectorAll('.queue-item').forEach(el => {
      el.addEventListener('dragstart', (e) => { dragItem = el; el.style.opacity = '0.5'; });
      el.addEventListener('dragend', () => { if (dragItem) dragItem.style.opacity = '1'; dragItem = null; });
      el.addEventListener('dragover', (e) => { e.preventDefault(); });
      el.addEventListener('drop', (e) => {
        e.preventDefault();
        if (!dragItem || dragItem === el) return;
        const items = [...container.querySelectorAll('.queue-item')];
        const fromIdx = items.indexOf(dragItem);
        const toIdx = items.indexOf(el);
        if (fromIdx < toIdx) el.after(dragItem);
        else el.before(dragItem);
        // Save new order
        const newOrder = [...container.querySelectorAll('.queue-item')].map(i => parseInt(i.dataset.itemId));
        fetch(`/api/queue/${queueId}/reorder`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ item_ids: newOrder }) });
      });
    });
  }

  // ═══ Load completed history ═══
  async function _loadCompletedItems() {
    try {
      const resp = await fetch('/api/queue/log?limit=100');
      const log = await resp.json();
      const container = document.getElementById('queue-completed-container');
      if (!container) return;

      if (!log.length) {
        container.innerHTML = `<div class="stats-empty">${t('queue.no_history')}</div>`;
        return;
      }

      container.innerHTML = log.map(entry => `
        <div style="display:flex;align-items:center;gap:12px;padding:8px 0;border-bottom:1px solid var(--border)">
          <span style="font-size:0.75rem;color:var(--text-muted);min-width:110px">${fmtDate(entry.timestamp)}</span>
          <span style="flex:1">${entry.event}</span>
          ${entry.printer_id ? `<span style="font-size:0.75rem;color:var(--text-secondary)">${printerName(entry.printer_id)}</span>` : ''}
          ${entry.details ? `<span style="font-size:0.75rem;color:var(--text-muted)">${entry.details}</span>` : ''}
        </div>`).join('');
    } catch (e) {
      console.error('[queue] Failed to load log:', e);
    }
  }

  // ═══ Create queue dialog ═══
  window._queueShowCreate = function() {
    const printers = Object.entries(window.printerState?._printerMeta || {}).map(([id, m]) => ({ id, name: m.name }));
    const printerOpts = printers.map(p => `<option value="${p.id}">${p.name}</option>`).join('');

    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `<div class="modal-content" style="max-width:500px">
      <h3>${t('queue.create')}</h3>
      <div class="form-group"><label>${t('queue.name')}</label><input type="text" id="qc-name" class="form-input" /></div>
      <div class="form-group"><label>${t('queue.description')}</label><input type="text" id="qc-desc" class="form-input" /></div>
      <div class="form-row" style="display:flex;gap:12px">
        <div class="form-group" style="flex:1"><label>${t('queue.priority_mode')}</label>
          <select id="qc-pmode" class="form-input"><option value="fifo">${t('queue.fifo')}</option><option value="priority">${t('queue.priority')}</option></select>
        </div>
        <div class="form-group" style="flex:1"><label>${t('queue.target_printer')}</label>
          <select id="qc-printer" class="form-input"><option value="">${t('queue.any_printer')}</option>${printerOpts}</select>
        </div>
      </div>
      <div class="form-row" style="display:flex;gap:12px;align-items:center">
        <label style="display:flex;align-items:center;gap:6px"><input type="checkbox" id="qc-auto" /> ${t('queue.auto_start')}</label>
        <div class="form-group" style="flex:1"><label>${t('queue.cooldown')}</label><input type="number" id="qc-cooldown" class="form-input" value="60" min="0" /></div>
      </div>
      <div class="form-group"><label>${t('queue.bed_clear_gcode')}</label><textarea id="qc-gcode" class="form-input" rows="3" placeholder="G28\nG1 Z50"></textarea></div>
      <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:16px">
        <button class="btn btn-ghost" data-ripple onclick="this.closest('.modal-overlay').remove()">${t('common.cancel')}</button>
        <button class="btn btn-primary" data-ripple onclick="window._queueDoCreate()">${t('queue.create')}</button>
      </div>
    </div>`;
    document.body.appendChild(overlay);
    overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });
  };

  window._queueDoCreate = async function() {
    const name = document.getElementById('qc-name')?.value?.trim();
    if (!name) return;

    const body = {
      name,
      description: document.getElementById('qc-desc')?.value?.trim() || null,
      priority_mode: document.getElementById('qc-pmode')?.value || 'fifo',
      target_printer_id: document.getElementById('qc-printer')?.value || null,
      auto_start: document.getElementById('qc-auto')?.checked || false,
      cooldown_seconds: parseInt(document.getElementById('qc-cooldown')?.value) || 60,
      bed_clear_gcode: document.getElementById('qc-gcode')?.value?.trim() || null
    };

    await fetch('/api/queue', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    document.querySelector('.modal-overlay')?.remove();
    _reload();
  };

  // ═══ Add item dialog ═══
  window._queueAddItem = function(queueId) {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `<div class="modal-content" style="max-width:450px">
      <h3>${t('queue.add_item')}</h3>
      <div class="form-group"><label>${t('queue.filename')}</label><input type="text" id="qi-filename" class="form-input" placeholder="/sdcard/model.3mf" /></div>
      <div class="form-row" style="display:flex;gap:12px">
        <div class="form-group" style="flex:1"><label>${t('queue.copies')}</label><input type="number" id="qi-copies" class="form-input" value="1" min="1" /></div>
        <div class="form-group" style="flex:1"><label>${t('queue.priority_label')}</label><input type="number" id="qi-priority" class="form-input" value="0" min="0" max="100" /></div>
      </div>
      <div class="form-group"><label>${t('queue.required_material')}</label><input type="text" id="qi-material" class="form-input" placeholder="PLA" /></div>
      <div class="form-group"><label>${t('queue.notes')}</label><input type="text" id="qi-notes" class="form-input" /></div>
      <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:16px">
        <button class="btn btn-ghost" data-ripple onclick="this.closest('.modal-overlay').remove()">${t('common.cancel')}</button>
        <button class="btn btn-primary" data-ripple onclick="window._queueDoAddItem(${queueId})">${t('queue.add_item')}</button>
      </div>
    </div>`;
    document.body.appendChild(overlay);
    overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });
  };

  window._queueDoAddItem = async function(queueId) {
    const filename = document.getElementById('qi-filename')?.value?.trim();
    if (!filename) return;

    const body = {
      filename,
      copies: parseInt(document.getElementById('qi-copies')?.value) || 1,
      priority: parseInt(document.getElementById('qi-priority')?.value) || 0,
      required_material: document.getElementById('qi-material')?.value?.trim() || null,
      notes: document.getElementById('qi-notes')?.value?.trim() || null
    };

    await fetch(`/api/queue/${queueId}/items`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    document.querySelector('.modal-overlay')?.remove();
    _reload();
  };

  // ═══ Queue actions ═══
  window._queueSelect = function(id) {
    _selectedQueue = id;
    _loadQueueItems(id);
  };

  window._queuePause = async function(id) {
    await fetch(`/api/queue/${id}/pause`, { method: 'POST' });
    _reload();
  };

  window._queueResume = async function(id) {
    await fetch(`/api/queue/${id}/resume`, { method: 'POST' });
    _reload();
  };

  window._queueForceDispatch = async function() {
    await fetch('/api/queue/dispatch', { method: 'POST' });
  };

  window._queueSkipItem = async function(itemId) {
    await fetch(`/api/queue/items/${itemId}/skip`, { method: 'POST' });
    if (_selectedQueue) _loadQueueItems(_selectedQueue);
  };

  // ═══ Render engine ═══
  function _renderTabs() {
    const panel = document.getElementById('overlay-panel-body');
    if (!panel) return;

    const tabBar = Object.entries(TAB_CONFIG).map(([id, cfg]) =>
      `<button class="tab-btn${id === _activeTab ? ' active' : ''}" data-tab="${id}" data-ripple>${t(cfg.label)}</button>`
    ).join('');

    let html = `<div class="tab-bar" id="queue-tab-bar">${tabBar}</div>`;
    for (const [tabId, cfg] of Object.entries(TAB_CONFIG)) {
      const display = tabId === _activeTab ? '' : 'display:none';
      const order = getOrder(tabId);
      const mods = order.filter(m => cfg.modules.includes(m));
      html += `<div class="tab-content module-grid ix-tab-panel" id="queue-tab-${tabId}" style="${display}">`;
      for (const modId of mods) {
        const size = MODULE_SIZE[modId] || 'full';
        const content = BUILDERS[modId] ? BUILDERS[modId]() : '';
        html += `<div class="stats-module module-${size}" data-module-id="${modId}">
          <div class="module-header"><h3 class="module-title">${t('queue.mod_' + modId.replace(/-/g, '_')) || modId}</h3></div>
          <div class="module-body">${content}</div>
        </div>`;
      }
      html += '</div>';
    }
    panel.innerHTML = html;

    // Tab click handlers
    panel.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        _activeTab = btn.dataset.tab;
        _renderTabs();
        if (_activeTab === 'history') _loadCompletedItems();
        if (_activeTab === 'active' && _selectedQueue) _loadQueueItems(_selectedQueue);
      });
    });
  }

  async function _reload() {
    try {
      const resp = await fetch('/api/queue');
      _queues = await resp.json();
    } catch { _queues = []; }
    _renderTabs();
    if (_activeTab === 'active' && _selectedQueue) _loadQueueItems(_selectedQueue);
    if (_activeTab === 'history') _loadCompletedItems();
  }

  window.loadQueuePanel = function() {
    _reload();
  };

  // Listen for WebSocket queue updates
  if (!window._wsListeners) window._wsListeners = [];
  window._wsListeners.push((msg) => {
    if (msg.type === 'queue_update' && window._activePanel === 'queue') {
      _reload();
    }
  });

})();
