// Poop Counter — Modular with Tabs and Drag-and-Drop
(function() {

  // ═══ Helpers ═══
  function printerName(id) {
    return window.printerState?._printerMeta?.[id]?.name || id || '--';
  }
  function formatDate(iso) {
    if (!iso) return '--';
    const locale = (window.i18n?.getLocale() || 'nb').replace('_', '-');
    return new Date(iso).toLocaleDateString(locale, { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
  }
  function formatWeight(g) {
    if (g >= 1000) return `${(g / 1000).toFixed(2)} kg`;
    return `${Math.round(g)}g`;
  }
  function sRow(lbl, val, clr) { return `<div class="stats-detail-item"><span class="stats-detail-item-label">${lbl}</span><span class="stats-detail-item-value"${clr?` style="color:${clr}"`:''}>${val}</span></div>`; }
  function barRow(lbl, pct, clr, val) { return `<div class="chart-bar-row"><span class="chart-bar-label">${lbl}</span><div class="chart-bar-track"><div class="chart-bar-fill" style="width:${pct}%;background:${clr}"></div></div><span class="chart-bar-value">${val}</span></div>`; }

  // ═══ Tab config ═══
  const TAB_CONFIG = {
    overview: { label: 'waste.tab_overview', modules: ['waste-summary', 'waste-details', 'weekly-chart'] },
    history:  { label: 'waste.tab_history',  modules: ['recent-events'] }
  };
  const MODULE_SIZE = {
    'waste-summary': 'half', 'waste-details': 'half',
    'weekly-chart': 'full', 'waste-settings': 'half',
    'recent-events': 'full'
  };

  const STORAGE_PREFIX = 'waste-module-order-';
  const LOCK_KEY = 'waste-layout-locked';

  let _selectedWastePrinter = null;
  let _activeTab = 'overview';
  let _locked = localStorage.getItem(LOCK_KEY) !== '0';
  let _stats = null;
  let _draggedMod = null;

  // ═══ Persistence ═══
  function getOrder(tabId) {
    try { const o = JSON.parse(localStorage.getItem(STORAGE_PREFIX + tabId)); if (Array.isArray(o)) return o; } catch (_) {}
    return TAB_CONFIG[tabId]?.modules || [];
  }
  function saveOrder(tabId) {
    const cont = document.getElementById(`waste-tab-${tabId}`);
    if (!cont) return;
    const ids = [...cont.querySelectorAll('.stats-module[data-module-id]')].map(m => m.dataset.moduleId);
    localStorage.setItem(STORAGE_PREFIX + tabId, JSON.stringify(ids));
  }

  // ═══ Module builders ═══
  const BUILDERS = {
    'waste-summary': (s) => {
      return `<div class="stat-grid">
        <div class="stat-card"><div class="stat-value">${s.total_color_changes}</div><div class="stat-label">${t('waste.total_count')}</div></div>
        <div class="stat-card"><div class="stat-value" style="color:var(--accent-orange)">${formatWeight(s.total_waste_g)}</div><div class="stat-label">${t('waste.total_weight')}</div></div>
        <div class="stat-card"><div class="stat-value" style="color:var(--accent-red)">${formatCurrency(s.total_cost, 0)}</div><div class="stat-label">${t('waste.total_cost')}</div></div>
      </div>`;
    },

    'waste-details': (s) => {
      const efficiency = s.total_filament_used_g > 0
        ? ((s.total_waste_g / s.total_filament_used_g) * 100).toFixed(1) : '0';
      const savedWaste = localStorage.getItem('wastePerChange') || '5';
      let h = `<div class="stats-detail-list">`;
      h += sRow(t('waste.avg_per_print'), `${s.avg_per_print}g`);
      h += sRow(t('waste.color_changes'), s.total_color_changes);
      h += sRow(t('waste.efficiency'), `${efficiency}%`, parseFloat(efficiency) > 5 ? 'var(--accent-orange)' : 'var(--accent-green)');
      h += `</div>`;
      h += `<div class="flex items-center gap-sm mt-sm" style="border-top:1px solid var(--border-color);padding-top:8px">
        <span class="text-muted" style="font-size:0.8rem">${t('waste.per_change')}</span>
        <input class="form-input" style="width:50px;text-align:center" id="waste-per-change" type="number" value="${savedWaste}" min="1" max="20" step="1" onchange="saveWastePerChange(this.value)">
        <span class="text-muted" style="font-size:0.8rem">g</span>
      </div>`;
      return h;
    },

    'weekly-chart': (s) => {
      let h = `<div class="card-title">${t('waste.per_week')}</div>`;
      if (s.waste_per_week?.length > 0) {
        const maxWeek = Math.max(...s.waste_per_week.map(w => w.total));
        h += '<div class="week-chart">';
        for (const w of s.waste_per_week) {
          const ht = maxWeek > 0 ? (w.total / maxWeek) * 100 : 0;
          const label = w.week.split('-W')[1] ? `${t('stats.week')} ${w.week.split('-W')[1]}` : w.week;
          h += `<div class="week-bar-group">
            <div class="week-bar-stack" style="height:80px">
              <div class="week-bar-fg" style="height:${ht}%;background:var(--accent-orange)"></div>
            </div>
            <div class="week-bar-label">${label}</div>
            <div class="week-bar-count">${Math.round(w.total)}g</div>
          </div>`;
        }
        h += '</div>';
      } else {
        h += `<p class="text-muted" style="font-size:0.8rem">${t('waste.no_data')}</p>`;
      }
      return h;
    },

    'recent-events': (s) => {
      if (!s.recent?.length) return `<p class="text-muted">${t('waste.no_data')}</p>`;
      let h = `<div class="card-title">${t('waste.recent')}</div>`;
      h += '<div class="waste-recent-list">';
      for (const r of s.recent) {
        const isAuto = r.reason === 'auto';
        const pillClass = isAuto ? 'pill pill-completed' : 'pill pill-cancelled';
        const label = isAuto ? t('waste.auto') : t('waste.manual');
        h += `<div class="waste-recent-card">
          <div class="waste-recent-top">
            <span class="printer-tag">${printerName(r.printer_id)}</span>
            <span class="waste-recent-weight">${r.waste_g}g</span>
            <span class="${pillClass}">${label}</span>
          </div>
          <div class="waste-recent-bottom">
            <span class="text-muted">${formatDate(r.timestamp)}</span>
            ${r.color_changes ? `<span class="text-muted">${r.color_changes} ${t('waste.color_changes_short')}</span>` : ''}
            ${r.notes ? `<span class="text-muted">${r.notes}</span>` : ''}
          </div>
        </div>`;
      }
      h += '</div>';
      return h;
    }
  };

  // ═══ Tab switching ═══
  function switchTab(tabId) {
    _activeTab = tabId;
    document.querySelectorAll('.waste-tab-btn').forEach(b => b.classList.toggle('active', b.dataset.tab === tabId));
    document.querySelectorAll('.waste-tab-panel').forEach(p => {
      const isActive = p.id === `waste-tab-${tabId}`;
      p.classList.toggle('active', isActive);
      p.style.display = isActive ? 'grid' : 'none';
    });
    const slug = tabId === 'overview' ? 'waste' : `waste/${tabId}`;
    if (location.hash !== '#' + slug) history.replaceState(null, '', '#' + slug);
  }

  // ═══ Module Drag & Drop ═══
  function initModuleDrag(container, tabId) {
    container.addEventListener('dragstart', e => {
      const mod = e.target.closest('.stats-module');
      if (!mod || _locked) { e.preventDefault(); return; }
      _draggedMod = mod;
      mod.classList.add('stats-module-dragging');
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', '');
    });
    container.addEventListener('dragover', e => {
      e.preventDefault();
      if (!_draggedMod || _locked) return;
      e.dataTransfer.dropEffect = 'move';
      const target = e.target.closest('.stats-module');
      if (target && target !== _draggedMod) {
        const rect = target.getBoundingClientRect();
        const midY = rect.top + rect.height / 2;
        if (e.clientY < midY) container.insertBefore(_draggedMod, target);
        else container.insertBefore(_draggedMod, target.nextSibling);
      }
    });
    container.addEventListener('drop', e => {
      e.preventDefault();
      if (_draggedMod) { _draggedMod.classList.remove('stats-module-dragging'); saveOrder(tabId); _draggedMod = null; }
    });
    container.addEventListener('dragend', () => {
      if (_draggedMod) { _draggedMod.classList.remove('stats-module-dragging'); _draggedMod = null; }
    });
  }

  // ═══ Main render ═══
  async function loadWaste() {
    const panel = document.getElementById('overlay-panel-body');
    if (!panel) return;

    // Read sub-slug from hash
    const hashParts = location.hash.replace('#', '').split('/');
    if (hashParts[0] === 'waste' && hashParts[1] && TAB_CONFIG[hashParts[1]]) {
      _activeTab = hashParts[1];
    }

    const printerId = _selectedWastePrinter;
    const params = printerId ? `?printer_id=${printerId}` : '';

    try {
      const res = await fetch(`/api/waste/stats${params}`);
      _stats = await res.json();

      let html = '';

      // Printer selector
      html += buildPrinterSelector('changeWastePrinter', _selectedWastePrinter);

      // Toolbar
      const lockIcon = _locked
        ? '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>'
        : '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 019.9-1"/></svg>';
      html += `<div class="stats-toolbar">
        <button class="form-btn" data-ripple onclick="showGlobalWasteForm()" style="display:flex;align-items:center;gap:4px">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          <span>${t('waste.add_manual')}</span>
        </button>
        <button class="speed-btn ${_locked ? '' : 'active'}" data-ripple onclick="toggleWasteLock()" title="${_locked ? t('waste.layout_locked') : t('waste.layout_unlocked')}">
          ${lockIcon} <span>${_locked ? t('waste.layout_locked') : t('waste.layout_unlocked')}</span>
        </button>
      </div>`;

      // Global form container
      html += `<div id="waste-global-form" style="display:none"></div>`;

      // Tab bar
      html += '<div class="tabs">';
      for (const [id, cfg] of Object.entries(TAB_CONFIG)) {
        html += `<button class="tab-btn waste-tab-btn ${id === _activeTab ? 'active' : ''}" data-tab="${id}" data-ripple onclick="switchWasteTab('${id}')">${t(cfg.label)}</button>`;
      }
      html += '</div>';

      // Tab panels
      for (const [tabId, cfg] of Object.entries(TAB_CONFIG)) {
        const order = getOrder(tabId);
        html += `<div class="tab-panel waste-tab-panel stats-tab-panel ix-tab-panel ${tabId === _activeTab ? 'active' : ''}" id="waste-tab-${tabId}" style="display:${tabId === _activeTab ? 'grid' : 'none'}">`;
        for (const modId of order) {
          const builder = BUILDERS[modId];
          if (!builder) continue;
          const content = builder(_stats);
          if (!content) continue;
          const draggable = _locked ? '' : 'draggable="true"';
          const unlocked = _locked ? '' : ' stats-module-unlocked';
          const isFull = (MODULE_SIZE[modId] || 'full') === 'full';
          html += `<div class="stats-module${unlocked}${isFull ? ' stats-module-full' : ''}" data-module-id="${modId}" ${draggable}>`;
          if (!_locked) html += '<div class="stats-module-handle" title="Drag to reorder">&#x2630;</div>';
          html += content;
          html += '</div>';
        }
        html += '</div>';
      }

      panel.innerHTML = html;

      // Attach module DnD
      for (const tabId of Object.keys(TAB_CONFIG)) {
        const cont = document.getElementById(`waste-tab-${tabId}`);
        if (cont) initModuleDrag(cont, tabId);
      }
    } catch (e) {
      panel.innerHTML = `<p class="text-muted">${t('waste.load_failed')}</p>`;
    }
  }

  // ═══ Global toolbar form ═══
  window.showGlobalWasteForm = function() {
    if (_activeTab !== 'overview') switchTab('overview');
    const container = document.getElementById('waste-global-form');
    if (!container) return;
    container.style.display = '';
    container.innerHTML = `<div class="settings-card" style="margin-bottom:10px">
      <div class="settings-form">
        <div class="flex gap-sm" style="flex-wrap:wrap;align-items:flex-end">
          <div class="form-group" style="flex:1;min-width:80px;margin-bottom:0">
            <label class="form-label">${t('waste.weight_g')}</label>
            <input class="form-input" id="global-waste-g" type="number" placeholder="5" min="1" step="1">
          </div>
          <div class="form-group" style="flex:2;min-width:150px;margin-bottom:0">
            <label class="form-label">${t('waste.notes')}</label>
            <input class="form-input" id="global-waste-notes" placeholder="${t('waste.notes_placeholder')}">
          </div>
          <button class="form-btn" data-ripple onclick="submitGlobalWaste()">${t('waste.save')}</button>
          <button class="form-btn form-btn-sm" data-ripple style="background:transparent;color:var(--text-muted)" onclick="hideGlobalWasteForm()">${t('settings.cancel')}</button>
        </div>
      </div>
    </div>`;
    container.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  };

  window.hideGlobalWasteForm = function() {
    const c = document.getElementById('waste-global-form');
    if (c) { c.style.display = 'none'; c.innerHTML = ''; }
  };

  window.submitGlobalWaste = async function() {
    const wasteG = parseFloat(document.getElementById('global-waste-g')?.value);
    const notes = document.getElementById('global-waste-notes')?.value?.trim();
    if (!wasteG || wasteG <= 0) return;
    const printerId = _selectedWastePrinter || window.printerState.getActivePrinterId();
    await fetch('/api/waste', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ printer_id: printerId, waste_g: wasteG, notes })
    });
    loadWaste();
  };

  // ═══ Global API ═══
  window.loadWastePanel = loadWaste;
  window.changeWastePrinter = function(value) { _selectedWastePrinter = value || null; loadWaste(); };
  window.switchWasteTab = switchTab;
  window.toggleWasteLock = function() {
    _locked = !_locked;
    localStorage.setItem(LOCK_KEY, _locked ? '1' : '0');
    loadWaste();
  };

  window.saveWastePerChange = function(val) {
    localStorage.setItem('wastePerChange', val);
  };
})();
