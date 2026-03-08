// Widgets Panel — dashboard widget customization with drag-and-drop reorder
(function() {
  const WIDGET_TYPES = [
    { id: 'printer_status', icon: '🖨️', default: true },
    { id: 'temperature', icon: '🌡️', default: true },
    { id: 'progress', icon: '📊', default: true },
    { id: 'speed', icon: '⚡', default: true },
    { id: 'camera', icon: '📷', default: true },
    { id: 'filament', icon: '🎨', default: true },
    { id: 'ams', icon: '📦', default: false },
    { id: 'stats', icon: '📈', default: false },
    { id: 'errors', icon: '⚠️', default: false },
    { id: 'maintenance', icon: '🔧', default: false }
  ];

  let _widgets = [];
  let _draggedItem = null;
  let _toastTimeout = null;

  function getDefaults() {
    return WIDGET_TYPES.map(w => ({
      id: w.id,
      enabled: w.default
    }));
  }

  async function loadLayout() {
    try {
      const res = await fetch('/api/widgets/active');
      if (res.ok) {
        const data = await res.json();
        const layout = typeof data.layout === 'string' ? JSON.parse(data.layout) : data.layout;
        if (Array.isArray(layout) && layout.length > 0) {
          _widgets = layout;
          return;
        }
      }
    } catch (_) {}
    _widgets = getDefaults();
  }

  async function saveLayout() {
    try {
      const res = await fetch('/api/widgets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'default', layout: _widgets, active: true })
      });
      if (res.ok) {
        showToast(t('widgets.saved'));
      }
    } catch (_) {}
  }

  function showToast(msg) {
    let toast = document.getElementById('widgets-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'widgets-toast';
      document.body.appendChild(toast);
    }
    Object.assign(toast.style, {
      position: 'fixed',
      bottom: '24px',
      right: '24px',
      background: 'var(--accent-green)',
      color: '#fff',
      padding: '10px 22px',
      borderRadius: 'var(--radius)',
      fontSize: '14px',
      fontWeight: '600',
      zIndex: '9999',
      opacity: '1',
      transition: 'opacity 0.3s ease',
      pointerEvents: 'none'
    });
    toast.textContent = msg;
    toast.style.opacity = '1';
    if (_toastTimeout) clearTimeout(_toastTimeout);
    _toastTimeout = setTimeout(() => { toast.style.opacity = '0'; }, 2200);
  }

  function getMeta(id) {
    return WIDGET_TYPES.find(w => w.id === id) || { id, icon: '❓', default: false };
  }

  function render() {
    const el = document.getElementById('overlay-panel-body');
    if (!el) return;

    const enabledWidgets = _widgets.filter(w => w.enabled);
    const disabledWidgets = _widgets.filter(w => !w.enabled);

    el.innerHTML = `
      <style>
        .wp-container { max-width: 720px; margin: 0 auto; }
        .wp-title { font-size: 20px; font-weight: 700; color: var(--text-primary); margin-bottom: 20px; }
        .wp-section-label { font-size: 13px; font-weight: 600; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.5px; margin: 18px 0 10px; }
        .wp-hint { font-size: 12px; color: var(--text-muted); margin-bottom: 12px; }
        .wp-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 10px; margin-bottom: 20px; }
        .wp-widget-card {
          background: var(--bg-secondary);
          border: 1px solid var(--border-color);
          border-radius: var(--radius);
          padding: 14px 12px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          transition: border-color 0.15s, box-shadow 0.15s;
          user-select: none;
        }
        .wp-widget-card:hover { border-color: var(--accent-blue); }
        .wp-widget-card.wp-disabled { opacity: 0.5; }
        .wp-widget-icon { font-size: 28px; line-height: 1; }
        .wp-widget-name { font-size: 13px; color: var(--text-primary); font-weight: 500; text-align: center; }
        .wp-toggle { position: relative; width: 36px; height: 20px; flex-shrink: 0; }
        .wp-toggle input { opacity: 0; width: 0; height: 0; position: absolute; }
        .wp-toggle-track {
          position: absolute; inset: 0;
          background: var(--border-color);
          border-radius: 10px;
          cursor: pointer;
          transition: background 0.2s;
        }
        .wp-toggle input:checked + .wp-toggle-track { background: var(--accent-green); }
        .wp-toggle-knob {
          position: absolute; top: 2px; left: 2px;
          width: 16px; height: 16px;
          background: #fff;
          border-radius: 50%;
          transition: transform 0.2s;
          pointer-events: none;
        }
        .wp-toggle input:checked ~ .wp-toggle-knob { transform: translateX(16px); }

        .wp-enabled-list { display: flex; flex-direction: column; gap: 6px; margin-bottom: 20px; min-height: 40px; }
        .wp-enabled-item {
          display: flex; align-items: center; gap: 12px;
          background: var(--bg-secondary);
          border: 1px solid var(--border-color);
          border-radius: var(--radius);
          padding: 10px 14px;
          cursor: grab;
          transition: border-color 0.15s, opacity 0.15s, box-shadow 0.15s;
          user-select: none;
        }
        .wp-enabled-item:active { cursor: grabbing; }
        .wp-enabled-item.wp-drag-over { border-color: var(--accent-blue); box-shadow: 0 0 0 2px rgba(59,130,246,0.15); }
        .wp-enabled-item.wp-dragging { opacity: 0.4; }
        .wp-enabled-item .wp-widget-icon { font-size: 20px; }
        .wp-enabled-item .wp-widget-name { font-size: 14px; flex: 1; text-align: left; }
        .wp-grip { color: var(--text-muted); font-size: 16px; letter-spacing: 2px; }
        .wp-remove-btn {
          background: none; border: none; color: var(--accent-red); cursor: pointer;
          font-size: 18px; padding: 2px 6px; border-radius: var(--radius);
          transition: background 0.15s;
        }
        .wp-remove-btn:hover { background: rgba(239,68,68,0.1); }
        .wp-no-widgets { color: var(--text-muted); font-size: 13px; padding: 16px; text-align: center; }

        .wp-btn-row { display: flex; gap: 10px; margin-top: 16px; }
        .wp-btn {
          padding: 8px 20px;
          border: none; border-radius: var(--radius);
          font-size: 14px; font-weight: 600;
          cursor: pointer; transition: opacity 0.15s;
        }
        .wp-btn:hover { opacity: 0.85; }
        .wp-btn-save { background: var(--accent-blue); color: #fff; }
        .wp-btn-reset { background: var(--border-color); color: var(--text-primary); }

        .wp-preview { margin-top: 24px; }
        .wp-preview-label { font-size: 13px; font-weight: 600; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 10px; }
        .wp-preview-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(100px, 1fr)); gap: 8px; }
        .wp-preview-item {
          background: var(--bg-secondary);
          border: 1px solid var(--border-color);
          border-radius: var(--radius);
          padding: 10px 8px;
          text-align: center;
          font-size: 12px;
          color: var(--text-muted);
        }
        .wp-preview-item .wp-widget-icon { font-size: 22px; display: block; margin-bottom: 4px; }
      </style>

      <div class="wp-container">
        <div class="wp-title">${t('widgets.title')}</div>

        <div class="wp-section-label">${t('widgets.enabled')}</div>
        <div class="wp-hint">${t('widgets.drag_hint')}</div>
        <div class="wp-enabled-list" id="wp-enabled-list">
          ${enabledWidgets.length === 0 ? `<div class="wp-no-widgets">${t('widgets.no_widgets')}</div>` :
            enabledWidgets.map(w => {
              const meta = getMeta(w.id);
              return `
                <div class="wp-enabled-item" draggable="true" data-widget-id="${w.id}">
                  <span class="wp-grip">⠿</span>
                  <span class="wp-widget-icon">${meta.icon}</span>
                  <span class="wp-widget-name">${t('widgets.' + w.id) || w.id}</span>
                  <button class="wp-remove-btn" data-remove="${w.id}" title="${t('widgets.remove')}">✕</button>
                </div>`;
            }).join('')}
        </div>

        <div class="wp-section-label">${t('widgets.available')}</div>
        <div class="wp-grid" id="wp-available-grid">
          ${WIDGET_TYPES.map(wt => {
            const entry = _widgets.find(w => w.id === wt.id);
            const enabled = entry ? entry.enabled : false;
            return `
              <div class="wp-widget-card ${enabled ? '' : 'wp-disabled'}" data-widget-id="${wt.id}">
                <span class="wp-widget-icon">${wt.icon}</span>
                <span class="wp-widget-name">${t('widgets.' + wt.id) || wt.id}</span>
                <label class="wp-toggle">
                  <input type="checkbox" ${enabled ? 'checked' : ''} data-toggle="${wt.id}">
                  <span class="wp-toggle-track"></span>
                  <span class="wp-toggle-knob"></span>
                </label>
              </div>`;
          }).join('')}
        </div>

        <div class="wp-preview">
          <div class="wp-preview-label">${t('widgets.preview')}</div>
          <div class="wp-preview-grid" id="wp-preview-grid">
            ${enabledWidgets.map(w => {
              const meta = getMeta(w.id);
              return `
                <div class="wp-preview-item">
                  <span class="wp-widget-icon">${meta.icon}</span>
                  ${t('widgets.' + w.id) || w.id}
                </div>`;
            }).join('')}
          </div>
        </div>

        <div class="wp-btn-row">
          <button class="wp-btn wp-btn-save" id="wp-save-btn">${t('widgets.save')}</button>
          <button class="wp-btn wp-btn-reset" id="wp-reset-btn">${t('widgets.reset')}</button>
        </div>
      </div>
    `;

    bindEvents();
  }

  function bindEvents() {
    // Toggle switches
    document.querySelectorAll('[data-toggle]').forEach(input => {
      input.addEventListener('change', (e) => {
        const id = e.target.dataset.toggle;
        const entry = _widgets.find(w => w.id === id);
        if (entry) {
          entry.enabled = e.target.checked;
        } else {
          _widgets.push({ id, enabled: e.target.checked });
        }
        render();
      });

      // Prevent card click from double-toggling
      input.closest('.wp-widget-card')?.addEventListener('click', (e) => {
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

    // Save button
    const saveBtn = document.getElementById('wp-save-btn');
    if (saveBtn) saveBtn.addEventListener('click', () => saveLayout());

    // Reset button
    const resetBtn = document.getElementById('wp-reset-btn');
    if (resetBtn) resetBtn.addEventListener('click', () => {
      _widgets = getDefaults();
      render();
    });

    // Drag and drop on enabled list
    setupDragAndDrop();
  }

  function setupDragAndDrop() {
    const list = document.getElementById('wp-enabled-list');
    if (!list) return;

    const items = list.querySelectorAll('.wp-enabled-item');
    items.forEach(item => {
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

      item.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
      });

      item.addEventListener('dragenter', (e) => {
        e.preventDefault();
        if (item !== _draggedItem) {
          item.classList.add('wp-drag-over');
        }
      });

      item.addEventListener('dragleave', () => {
        item.classList.remove('wp-drag-over');
      });

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

    el.innerHTML = '<div style="text-align:center;padding:32px;color:var(--text-muted)">Loading...</div>';
    await loadLayout();
    render();
  };
})();
