// Widgets Panel — dashboard widget customization with drag-and-drop reorder
(function() {
  const WIDGET_TYPES = [
    { id: 'printer_status', icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>', default: true, desc: 'Printer name, state, and model info' },
    { id: 'temperature', icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 14.76V3.5a2.5 2.5 0 00-5 0v11.26a4.5 4.5 0 105 0z"/></svg>', default: true, desc: 'Nozzle and bed temperature gauges' },
    { id: 'progress', icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="20" x2="12" y2="10"/><line x1="18" y1="20" x2="18" y2="4"/><line x1="6" y1="20" x2="6" y2="16"/></svg>', default: true, desc: 'Print progress bar with ETA' },
    { id: 'speed', icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>', default: true, desc: 'Speed profile slider' },
    { id: 'camera', icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/><circle cx="12" cy="13" r="4"/></svg>', default: true, desc: 'Live camera view' },
    { id: 'filament', icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/></svg>', default: true, desc: 'Active filament info and tracking' },
    { id: 'ams', icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/></svg>', default: false, desc: 'AMS spool slots (Bambu Lab)' },
    { id: 'stats', icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>', default: false, desc: 'Print statistics sparklines' },
    { id: 'errors', icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>', default: false, desc: 'Recent errors and warnings' },
    { id: 'maintenance', icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/></svg>', default: false, desc: 'Maintenance reminders and status' },
    { id: 'print_preview', icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>', default: false, desc: '3D model preview during print' },
    { id: 'quick_controls', icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82"/></svg>', default: false, desc: 'Quick pause/resume/stop buttons' },
    { id: 'cost_tracker', icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>', default: false, desc: 'Real-time cost estimation' },
    { id: 'power_energy', icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10"/></svg>', default: false, desc: 'Power consumption and energy cost' },
    { id: 'queue_status', icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>', default: false, desc: 'Print queue overview' },
    { id: 'sm_filament', icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/><path d="M12 2v4"/></svg>', default: false, desc: 'Snapmaker NFC filament slots' },
  ];

  let _widgets = [];

  function _tl(key, fb) { if (typeof t === 'function') { const v = t(key); if (v && v !== key) return v; } return fb || key; }

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
        window.showToast(_tl('widgets.saved', 'Layout saved'), 'success');
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
        <div class="card-title">${_tl('widgets.enabled', 'Active widgets')}</div>
        <div class="wp-enabled-list" id="wp-enabled-list">
          ${enabledWidgets.length === 0
            ? `<div class="wp-empty-slot">${_tl('widgets.no_widgets', 'No widgets enabled')}</div>`
            : enabledWidgets.map(w => {
              const meta = getMeta(w.id);
              return `<div class="wp-enabled-item" data-widget-id="${w.id}">
                <span class="wp-item-icon">${meta.icon}</span>
                <span class="wp-item-name">${_tl('widgets.' + w.id, w.id)}</span>
                <button class="wp-remove-btn" data-remove="${w.id}" title="${_tl('widgets.remove', 'Remove')}">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
              </div>`;
            }).join('')}
        </div>
      </div>

      <!-- Available widgets -->
      <div class="card wp-section">
        <div class="card-title">${_tl('widgets.available', 'Available widgets')}</div>
        <div class="wp-available-grid">
          ${WIDGET_TYPES.map(wt => {
            const entry = _widgets.find(w => w.id === wt.id);
            const enabled = entry ? entry.enabled : false;
            return `<div class="wp-avail-card${enabled ? ' wp-avail-active' : ''}" data-widget-id="${wt.id}">
              <div class="wp-avail-icon">${wt.icon}</div>
              <div class="wp-avail-name">${_tl('widgets.' + wt.id, wt.id.replace(/_/g, ' '))}</div>
              ${wt.desc ? '<div style="font-size:0.65rem;color:var(--text-muted);margin-top:2px">' + wt.desc + '</div>' : ''}
              <label class="wp-toggle" style="margin-top:4px">
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
        <div class="card-title">${_tl('widgets.preview', 'Preview')}</div>
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
          ${_tl('widgets.save', 'Save layout')}
        </button>
        <button class="ce-secondary-btn" id="wp-reset-btn">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 4v6h6"/><path d="M3.51 15a9 9 0 102.13-9.36L1 10"/></svg>
          ${_tl('widgets.reset', 'Reset')}
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

  }

  window.loadWidgetsPanel = async function() {
    const el = document.getElementById('overlay-panel-body');
    if (!el) return;
    el.innerHTML = '<div class="matrec-empty"><div class="matrec-spinner"></div></div>';
    await loadLayout();
    render();
  };
})();
