// Widgets Panel — dashboard widget customization with drag-and-drop reorder
(function() {
  const WIDGET_TYPES = [
    { id: 'printer_status', icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>', default: true },
    { id: 'temperature', icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 14.76V3.5a2.5 2.5 0 00-5 0v11.26a4.5 4.5 0 105 0z"/></svg>', default: true },
    { id: 'progress', icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="20" x2="12" y2="10"/><line x1="18" y1="20" x2="18" y2="4"/><line x1="6" y1="20" x2="6" y2="16"/></svg>', default: true },
    { id: 'speed', icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>', default: true },
    { id: 'camera', icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/><circle cx="12" cy="13" r="4"/></svg>', default: true },
    { id: 'filament', icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/></svg>', default: true },
    { id: 'ams', icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/></svg>', default: false },
    { id: 'stats', icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>', default: false },
    { id: 'errors', icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>', default: false },
    { id: 'maintenance', icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/></svg>', default: false }
  ];

  let _widgets = [];
  let _draggedItem = null;

  function _tl(key, fb) { return (typeof t === 'function' ? t(key) : '') || fb; }

  function getDefaults() {
    return WIDGET_TYPES.map(w => ({ id: w.id, enabled: w.default }));
  }

  async function loadLayout() {
    try {
      const res = await fetch('/api/widgets/active');
      if (res.ok) {
        const data = await res.json();
        const layout = typeof data.layout === 'string' ? JSON.parse(data.layout) : data.layout;
        if (Array.isArray(layout) && layout.length > 0) { _widgets = layout; return; }
      }
    } catch {}
    _widgets = getDefaults();
  }

  async function saveLayout() {
    try {
      const res = await fetch('/api/widgets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'default', layout: _widgets, active: true })
      });
      if (res.ok && typeof window.showToast === 'function') {
        window.showToast(_tl('widgets.saved', 'Layout lagret'), 'success');
      }
    } catch {}
  }

  function getMeta(id) {
    return WIDGET_TYPES.find(w => w.id === id) || { id, icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>', default: false };
  }

  function render() {
    const el = document.getElementById('overlay-panel-body');
    if (!el) return;

    const enabledWidgets = _widgets.filter(w => w.enabled);
    const disabledWidgets = WIDGET_TYPES.filter(wt => !_widgets.find(w => w.id === wt.id && w.enabled));

    el.innerHTML = `<div class="wp-panel">
      <!-- Enabled section -->
      <div class="card wp-section">
        <div class="card-title">${_tl('widgets.enabled', 'Aktive widgets')}</div>
        <p class="wp-hint">${_tl('widgets.drag_hint', 'Dra for å endre rekkefølge')}</p>
        <div class="wp-enabled-list" id="wp-enabled-list">
          ${enabledWidgets.length === 0
            ? `<div class="wp-empty-slot">${_tl('widgets.no_widgets', 'Ingen widgets aktivert')}</div>`
            : enabledWidgets.map(w => {
              const meta = getMeta(w.id);
              return `<div class="wp-enabled-item" draggable="true" data-widget-id="${w.id}">
                <span class="wp-grip"><svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><circle cx="8" cy="4" r="2"/><circle cx="16" cy="4" r="2"/><circle cx="8" cy="12" r="2"/><circle cx="16" cy="12" r="2"/><circle cx="8" cy="20" r="2"/><circle cx="16" cy="20" r="2"/></svg></span>
                <span class="wp-item-icon">${meta.icon}</span>
                <span class="wp-item-name">${_tl('widgets.' + w.id, w.id)}</span>
                <button class="wp-remove-btn" data-remove="${w.id}" title="${_tl('widgets.remove', 'Fjern')}">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
              </div>`;
            }).join('')}
        </div>
      </div>

      <!-- Available widgets -->
      <div class="card wp-section">
        <div class="card-title">${_tl('widgets.available', 'Tilgjengelige widgets')}</div>
        <div class="wp-available-grid">
          ${WIDGET_TYPES.map(wt => {
            const entry = _widgets.find(w => w.id === wt.id);
            const enabled = entry ? entry.enabled : false;
            return `<div class="wp-avail-card${enabled ? ' wp-avail-active' : ''}" data-widget-id="${wt.id}">
              <div class="wp-avail-icon">${wt.icon}</div>
              <div class="wp-avail-name">${_tl('widgets.' + wt.id, wt.id)}</div>
              <label class="wp-toggle">
                <input type="checkbox" ${enabled ? 'checked' : ''} data-toggle="${wt.id}">
                <span class="wp-toggle-track"></span>
                <span class="wp-toggle-knob"></span>
              </label>
            </div>`;
          }).join('')}
        </div>
      </div>

      <!-- Preview -->
      ${enabledWidgets.length > 0 ? `
      <div class="card wp-section">
        <div class="card-title">${_tl('widgets.preview', 'Forhåndsvisning')}</div>
        <div class="wp-preview-grid">
          ${enabledWidgets.map(w => {
            const meta = getMeta(w.id);
            return `<div class="wp-preview-item">
              <span class="wp-preview-icon">${meta.icon}</span>
              <span class="wp-preview-name">${_tl('widgets.' + w.id, w.id)}</span>
            </div>`;
          }).join('')}
        </div>
      </div>` : ''}

      <!-- Actions -->
      <div class="wp-actions">
        <button class="matrec-recalc-btn" id="wp-save-btn" style="margin-left:0">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
          ${_tl('widgets.save', 'Lagre layout')}
        </button>
        <button class="ce-secondary-btn" id="wp-reset-btn">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 4v6h6"/><path d="M3.51 15a9 9 0 102.13-9.36L1 10"/></svg>
          ${_tl('widgets.reset', 'Tilbakestill')}
        </button>
      </div>
    </div>`;

    bindEvents();
  }

  function bindEvents() {
    // Toggle switches
    document.querySelectorAll('[data-toggle]').forEach(input => {
      input.addEventListener('change', (e) => {
        const id = e.target.dataset.toggle;
        const entry = _widgets.find(w => w.id === id);
        if (entry) entry.enabled = e.target.checked;
        else _widgets.push({ id, enabled: e.target.checked });
        render();
      });
      input.closest('.wp-avail-card')?.addEventListener('click', (e) => {
        if (e.target === input || e.target.closest('.wp-toggle')) return;
        input.checked = !input.checked;
        input.dispatchEvent(new Event('change'));
      });
    });

    // Remove buttons
    document.querySelectorAll('[data-remove]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.dataset.remove;
        const entry = _widgets.find(w => w.id === id);
        if (entry) entry.enabled = false;
        render();
      });
    });

    document.getElementById('wp-save-btn')?.addEventListener('click', () => saveLayout());
    document.getElementById('wp-reset-btn')?.addEventListener('click', () => { _widgets = getDefaults(); render(); });

    setupDragAndDrop();
  }

  function setupDragAndDrop() {
    const list = document.getElementById('wp-enabled-list');
    if (!list) return;

    list.querySelectorAll('.wp-enabled-item').forEach(item => {
      item.addEventListener('dragstart', (e) => {
        _draggedItem = item;
        item.classList.add('wp-dragging');
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', item.dataset.widgetId);
      });
      item.addEventListener('dragend', () => {
        item.classList.remove('wp-dragging');
        list.querySelectorAll('.wp-enabled-item').forEach(el => el.classList.remove('wp-drag-over'));
        _draggedItem = null;
      });
      item.addEventListener('dragover', (e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; });
      item.addEventListener('dragenter', (e) => { e.preventDefault(); if (item !== _draggedItem) item.classList.add('wp-drag-over'); });
      item.addEventListener('dragleave', () => { item.classList.remove('wp-drag-over'); });
      item.addEventListener('drop', (e) => {
        e.preventDefault();
        item.classList.remove('wp-drag-over');
        if (!_draggedItem || _draggedItem === item) return;
        const fromId = _draggedItem.dataset.widgetId;
        const toId = item.dataset.widgetId;
        const fromIdx = _widgets.findIndex(w => w.id === fromId);
        const toIdx = _widgets.findIndex(w => w.id === toId);
        if (fromIdx < 0 || toIdx < 0) return;
        const [moved] = _widgets.splice(fromIdx, 1);
        _widgets.splice(toIdx, 0, moved);
        render();
      });
    });
  }

  window.loadWidgetsPanel = async function() {
    const el = document.getElementById('overlay-panel-body');
    if (!el) return;
    el.innerHTML = '<div class="matrec-empty"><div class="matrec-spinner"></div></div>';
    await loadLayout();
    render();
  };
})();
