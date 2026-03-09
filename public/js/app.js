const state = window.printerState;
let ws = null;
let reconnectTimer = null;
let reconnectDelay = 1000;
let _wasConnected = false;

function connect() {
  const protocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
  ws = new WebSocket(`${protocol}//${location.host}/ws`);

  ws.onopen = () => {
    console.log('[ws] Tilkoblet');
    if (_wasConnected) {
      // Reconnected after a disconnect
      if (typeof showToast === 'function') showToast(t('connection.reconnected'), 'success', 3000);
    }
    _wasConnected = true;
    reconnectDelay = 1000;
    updateConnectionBadge('connected');
  };

  ws.onmessage = (event) => {
    try {
      const msg = JSON.parse(event.data);

      if (msg.type === 'printer_meta_update' && msg.data) {
        const printers = msg.data.printers || [];
        const newMeta = {};
        for (const p of printers) {
          newMeta[p.id] = { name: p.name, model: p.model || '' };
        }
        // Remove printers that no longer exist
        const oldIds = [...Object.keys(state._printerMeta), ...Object.keys(state._printers)];
        const newIds = new Set(Object.keys(newMeta));
        for (const id of oldIds) {
          if (!newIds.has(id)) {
            state.removePrinter(id);
          }
        }
        // Update meta
        state.replacePrinterMeta(newMeta);

        // Ensure new printers have a state entry so they show in selector
        for (const id of Object.keys(newMeta)) {
          if (!state._printers[id]) {
            state._printers[id] = {};
          }
        }

        // Update selector and badge
        if (typeof updatePrinterSelector === 'function') {
          updatePrinterSelector();
        }
        updateConnectionBadge();

        // If active printer was deleted, update dashboard for the new active
        if (state.getActivePrinterId()) {
          const activeState = state.getActivePrinterState();
          const printData = activeState.print || activeState;
          updateDashboard(printData);
          document.title = `${state.getActivePrinterMeta().name || state.getActivePrinterId()} - Bambu Dashboard`;
        }
        return;
      }

      if (msg.type === 'init' && msg.data) {
        // Initial state dump with all printers
        const { printers, states } = msg.data;

        // Set printer metadata
        for (const [id, meta] of Object.entries(printers || {})) {
          state.setPrinterMeta(id, meta);
        }

        // Set printer states
        for (const [id, stateData] of Object.entries(states || {})) {
          state.updatePrinter(id, stateData);
        }

        updatePrinterSelector();
        updateConnectionBadge('connected');

        // Trigger initial dashboard update
        const activeState = state.getActivePrinterState();
        const printData = activeState.print || activeState;
        updateDashboard(printData);
        return;
      }

      if (msg.type === 'update_available') {
        if (typeof handleUpdateAvailable === 'function') handleUpdateAvailable(msg.data);
        return;
      }
      if (msg.type === 'update_status') {
        if (typeof handleUpdateStatus === 'function') handleUpdateStatus(msg.data);
        return;
      }

      if (msg.type === 'status' && msg.data) {
        const printerId = msg.data.printer_id;
        if (printerId) {
          // Ignore status from printers not in our meta (deleted)
          if (!state._printerMeta[printerId]) return;
          state.updatePrinter(printerId, msg.data);

          // Check notifications for all printers
          if (typeof checkNotifications === 'function') {
            const printData = msg.data.print || msg.data;
            checkNotifications(printerId, printData);
          }

          // Only update dashboard if this is the active printer
          if (printerId === state.getActivePrinterId()) {
            const printData = msg.data.print || msg.data;
            updateDashboard(printData);
          }

          // Always update printer selector (status dots)
          if (typeof updatePrinterSelector === 'function') {
            updatePrinterSelector();
          }
        } else {
          // Legacy single-printer format
          const printData = msg.data.print || msg.data;
          state.updatePrinter('default', msg.data);
          updateDashboard(printData);
        }
      } else if (msg.type === 'connection') {
        updateConnectionBadge(msg.data.status);
      }

      // Dispatch to registered listeners
      if (window._wsListeners) {
        for (const fn of window._wsListeners) {
          try { fn(msg); } catch {}
        }
      }
    } catch (e) {
      console.warn('[ws] Parse-feil:', e);
    }
  };

  ws.onclose = () => {
    console.log('[ws] Frakoblet - gjenkobler...');
    updateConnectionBadge('disconnected');
    if (_wasConnected && typeof showToast === 'function') {
      showToast(t('connection.lost'), 'warning', 4000);
    }
    scheduleReconnect();
  };

  ws.onerror = () => {
    console.warn('[ws] Feil');
    ws.close();
  };
}

function scheduleReconnect() {
  if (reconnectTimer) return;
  reconnectTimer = setTimeout(() => {
    reconnectTimer = null;
    reconnectDelay = Math.min(reconnectDelay * 1.5, 10000);
    connect();
  }, reconnectDelay);
}

function sendCommand(action, extra = {}) {
  if (ws && ws.readyState === 1) {
    ws.send(JSON.stringify({
      type: 'command',
      action,
      printer_id: state.getActivePrinterId(),
      ...extra
    }));
  }
}

window.sendCommand = sendCommand;

let _connectionStatus = 'disconnected';

function updateConnectionBadge(status) {
  if (status) _connectionStatus = status;
  const badge = document.getElementById('connection-badge');
  if (!badge) return;
  const count = state.getPrinterIds().length;
  const label = _connectionStatus === 'connected' ? t('connection.connected') : t('connection.disconnected');
  const printerWord = count !== 1 ? t('connection.printers', { count }) : t('connection.printer', { count });
  badge.textContent = count > 0 ? `${label} · ${printerWord}` : label;
  badge.className = `badge badge-${_connectionStatus}`;
}

function updateDashboard(data) {
  if (typeof updateTemperatureGauges === 'function') updateTemperatureGauges(data);
  if (typeof updatePrintProgress === 'function') updatePrintProgress(data);
  if (typeof updateAmsPanel === 'function') updateAmsPanel(data);
  if (typeof updateControls === 'function') updateControls(data);
  if (typeof updateSpeedControl === 'function') updateSpeedControl(data);
  if (typeof updateFanDisplay === 'function') updateFanDisplay(data);
  if (typeof updateActiveFilament === 'function') updateActiveFilament(data);
  if (typeof updatePrinterInfo === 'function') updatePrinterInfo(data);
  if (typeof updatePrintPreview === 'function') updatePrintPreview(data);
  if (typeof updateQuickStatus === 'function') updateQuickStatus(data);
  if (typeof updateSparklineStats === 'function') updateSparklineStats(data);
  updateStatusBar(data);
}

function updateStatusBar(data) {
  // WiFi signal
  const wifiEl = document.getElementById('wifi-signal');
  if (wifiEl && data.wifi_signal) {
    const sig = data.wifi_signal;
    wifiEl.textContent = sig;
    const dbm = typeof sig === 'string' ? parseInt(sig) : sig;
    if (!isNaN(dbm)) {
      wifiEl.style.color = dbm > -50 ? 'var(--accent-green)' : dbm > -70 ? 'var(--accent-orange)' : 'var(--accent-red)';
    }
  }

  // Chamber light
  const lightEl = document.getElementById('light-status');
  if (lightEl && data.lights_report) {
    const chamber = data.lights_report.find(l => l.node === 'chamber_light');
    if (chamber) {
      const isOn = chamber.mode === 'on';
      lightEl.textContent = isOn ? t('status_bar.light_on') : t('status_bar.light_off');
      lightEl.style.color = isOn ? 'var(--accent-yellow)' : '';
      const icon = lightEl.previousElementSibling;
      if (icon) icon.style.color = isOn ? 'var(--accent-yellow)' : '';
    }
  }
}

// Reload active tab data when switching printers
window.reloadActiveTab = function() {
  if (window._activePanel) {
    openPanel(window._activePanel);
  }
};

// ---- Sidebar Toggle (mobile) ----

window.toggleSidebar = function() {
  const sidebar = document.getElementById('sidebar');
  const backdrop = document.getElementById('sidebar-backdrop');
  if (!sidebar) return;

  const isOpen = sidebar.classList.contains('open');
  sidebar.classList.toggle('open', !isOpen);
  if (backdrop) backdrop.classList.toggle('visible', !isOpen);
  document.body.style.overflow = !isOpen ? 'hidden' : '';
};

function closeSidebarIfMobile() {
  if (window.innerWidth <= 768) {
    const sidebar = document.getElementById('sidebar');
    const backdrop = document.getElementById('sidebar-backdrop');
    if (sidebar) sidebar.classList.remove('open');
    if (backdrop) backdrop.classList.remove('visible');
    document.body.style.overflow = '';
  }
}

// ---- Inline Panel System ----

const PANEL_TITLES = {
  controls: 'tabs.controls',
  queue: 'queue.title',
  history: 'tabs.history',
  stats: 'tabs.statistics',
  analysis: 'tabs.analysis',
  telemetry: 'tabs.telemetry',
  filament: 'tabs.filament',
  errors: 'tabs.errors',
  waste: 'tabs.waste',
  maintenance: 'tabs.maintenance',
  protection: 'protection.title',
  modelinfo: 'tabs.model_info',
  learning: 'tabs.learning',
  knowledge: 'nav.knowledge',
  activity: 'tabs.activity',
  gallery: 'tabs.gallery',
  fleet: 'tabs.fleet',
  scheduler: 'tabs.scheduler',
  library: 'tabs.library',
  bedmesh: 'tabs.bedmesh',
  gcode: 'tabs.gcode',
  health: 'tabs.health',
  comparison: 'tabs.comparison',
  forecast: 'tabs.forecast',
  multicolor: 'tabs.multicolor',
  diagnostics: 'tabs.diagnostics',
  labels: 'tabs.labels',
  widgets: 'tabs.widgets',
  timetracker: 'tabs.timetracker',
  printermatrix: 'tabs.printermatrix',
  costestimator: 'tabs.costestimator',
  plugins: 'tabs.plugins',
  backup: 'tabs.backup',
  playground: 'tabs.playground',
  settings: 'tabs.settings',
  materialrec: 'material_rec.title',
  wearprediction: 'wear.title',
  erroranalysis: 'error_analysis.title',
  orders: 'orders.title'
};

const PANEL_LOADERS = {
  controls: () => { if (typeof loadControlsPanel === 'function') loadControlsPanel(); },
  queue: () => { if (typeof loadQueuePanel === 'function') loadQueuePanel(); },
  history: () => { if (typeof loadHistoryPanel === 'function') loadHistoryPanel(); },
  analysis: () => { if (typeof loadAnalysisPanel === 'function') loadAnalysisPanel(); },
  filament: () => { if (typeof loadFilamentPanel === 'function') loadFilamentPanel(); },
  errors: () => { if (typeof loadErrorsPanel === 'function') loadErrorsPanel(); },
  maintenance: () => { if (typeof loadMaintenancePanel === 'function') loadMaintenancePanel(); },
  protection: () => { if (typeof loadProtectionPanel === 'function') loadProtectionPanel(); },
  knowledge: () => { if (typeof loadKnowledgePanel === 'function') loadKnowledgePanel(); },
  fleet: () => { if (typeof loadFleetPanel === 'function') loadFleetPanel(); },
  library: () => { if (typeof loadLibraryPanel === 'function') loadLibraryPanel(); },
  diagnostics: () => { if (typeof loadDiagnosticsPanel === 'function') loadDiagnosticsPanel(); },
  labels: () => { if (typeof loadLabelPanel === 'function') loadLabelPanel(); },
  widgets: () => { if (typeof loadWidgetsPanel === 'function') loadWidgetsPanel(); },
  plugins: () => { if (typeof loadPluginsPanel === 'function') loadPluginsPanel(); },
  backup: () => { if (typeof loadBackupPanel === 'function') loadBackupPanel(); },
  playground: () => { if (typeof loadPlaygroundPanel === 'function') loadPlaygroundPanel(); },
  costestimator: () => { if (typeof loadCostEstimatorPanel === 'function') loadCostEstimatorPanel(); },
  settings: () => { if (typeof loadSettingsPanel === 'function') loadSettingsPanel(); },
  materialrec: () => { if (typeof loadMaterialRecommendationsPanel === 'function') loadMaterialRecommendationsPanel(); },
  wearprediction: () => { if (typeof loadWearPredictionPanel === 'function') loadWearPredictionPanel(); },
  erroranalysis: () => { if (typeof loadErrorAnalysisPanel === 'function') loadErrorAnalysisPanel(); },
  orders: () => { if (typeof loadOrderPanel === 'function') loadOrderPanel(); },
  // Redirects — sub-panels call the parent wrapper loader with initialTab parameter
  scheduler: () => { if (typeof _switchQueueTab === 'function') _switchQueueTab('scheduler'); },
  gallery: () => { if (typeof _switchHistoryTab === 'function') _switchHistoryTab('gallery'); },
  activity: () => { if (typeof _switchHistoryTab === 'function') _switchHistoryTab('activity'); },
  stats: () => { if (typeof _switchAnalysisTab === 'function') _switchAnalysisTab('stats'); },
  timetracker: () => { if (typeof _switchAnalysisTab === 'function') _switchAnalysisTab('timetracker'); },
  comparison: () => { if (typeof _switchAnalysisTab === 'function') _switchAnalysisTab('comparison'); },
  printermatrix: () => { if (typeof _switchAnalysisTab === 'function') _switchAnalysisTab('printermatrix'); },
  waste: () => { if (typeof _switchAnalysisTab === 'function') _switchAnalysisTab('waste'); },
  telemetry: () => { if (typeof _switchDiagTab === 'function') _switchDiagTab('telemetry'); },
  bedmesh: () => { if (typeof _switchDiagTab === 'function') _switchDiagTab('bedmesh'); },
  health: () => { if (typeof _switchDiagTab === 'function') _switchDiagTab('health'); },
  gcode: () => { if (typeof _switchLibraryTab === 'function') _switchLibraryTab('gcode'); },
  forecast: () => { if (typeof _switchFilamentTab === 'function') _switchFilamentTab('forecast'); },
  multicolor: () => { if (typeof _switchFilamentTab === 'function') _switchFilamentTab('multicolor'); },
  learning: () => { if (typeof _switchKnowledgeTab === 'function') _switchKnowledgeTab('learning'); },
  modelinfo: () => { if (typeof _switchKnowledgeTab === 'function') _switchKnowledgeTab('modelinfo'); },
};

window._activePanel = null;

window.openPanel = function(name, skipHash) {
  if (!PANEL_TITLES[name]) return;
  const panelContent = document.getElementById('panel-content');
  const dashboardGrid = document.getElementById('dashboard-grid');
  const statsStrip = document.getElementById('stats-strip');
  const titleEl = document.getElementById('overlay-panel-title');
  if (!panelContent || !dashboardGrid) return;

  closeSidebarIfMobile();

  window._activePanel = name;
  if (titleEl) titleEl.textContent = t(PANEL_TITLES[name] || name);

  // Update URL hash
  if (!skipHash) history.replaceState(null, '', '#' + name);

  // Highlight sidebar button and expand its section
  document.querySelectorAll('.sidebar-btn').forEach(b => b.classList.remove('active'));
  // Map old panel names to their new merged parent for sidebar highlighting
  const _panelParentMap = {};
  const sidebarName = _panelParentMap[name] || name;
  document.querySelector(`.sidebar-btn[data-panel="${sidebarName}"]`)?.classList.add('active');
  _expandSectionForPanel(name);

  // Hide dashboard + stats strip, show panel
  dashboardGrid.classList.add('view-hidden');
  if (statsStrip) statsStrip.classList.add('view-hidden');
  panelContent.classList.add('panel-active');

  // Show skeleton while content loads — tailored per panel type
  const body = document.getElementById('overlay-panel-body');
  if (body) {
    const gridPanels = ['controls', 'filament', 'analysis', 'maintenance', 'learning', 'knowledge', 'diagnostics'];
    const tablePanels = ['history', 'errors', 'queue', 'waste'];
    let skel;
    if (gridPanels.includes(name)) {
      // Tab bar + card grid skeleton
      skel = '<div style="padding:8px 0">' +
        '<div style="display:flex;gap:8px;margin-bottom:16px">' +
        '<div class="skeleton" style="height:32px;width:80px;border-radius:6px"></div>' +
        '<div class="skeleton" style="height:32px;width:80px;border-radius:6px"></div>' +
        '<div class="skeleton" style="height:32px;width:80px;border-radius:6px"></div>' +
        '</div>' +
        '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:12px">' +
        '<div class="skeleton skeleton-block" style="height:140px"></div>' +
        '<div class="skeleton skeleton-block" style="height:140px"></div>' +
        '<div class="skeleton skeleton-block" style="height:140px"></div>' +
        '<div class="skeleton skeleton-block" style="height:140px"></div>' +
        '</div></div>';
    } else if (tablePanels.includes(name)) {
      // Filter bar + list rows skeleton
      skel = '<div style="padding:8px 0">' +
        '<div style="display:flex;gap:8px;margin-bottom:16px">' +
        '<div class="skeleton" style="height:32px;width:120px;border-radius:6px"></div>' +
        '<div class="skeleton" style="height:32px;flex:1;border-radius:6px"></div>' +
        '</div>' +
        '<div class="skeleton skeleton-block" style="height:48px;margin-bottom:6px"></div>' +
        '<div class="skeleton skeleton-block" style="height:48px;margin-bottom:6px"></div>' +
        '<div class="skeleton skeleton-block" style="height:48px;margin-bottom:6px"></div>' +
        '<div class="skeleton skeleton-block" style="height:48px;margin-bottom:6px"></div>' +
        '<div class="skeleton skeleton-block" style="height:48px"></div>' +
        '</div>';
    } else {
      // Generic skeleton
      skel = '<div style="padding:8px 0">' +
        '<div class="skeleton skeleton-block" style="height:40px;margin-bottom:12px"></div>' +
        '<div class="skeleton skeleton-block" style="height:180px;margin-bottom:12px"></div>' +
        '<div class="skeleton skeleton-text" style="width:45%"></div>' +
        '</div>';
    }
    body.innerHTML = skel;
  }

  if (PANEL_LOADERS[name]) PANEL_LOADERS[name]();
};

window.showDashboard = function(skipHash) {
  const panelContent = document.getElementById('panel-content');
  const dashboardGrid = document.getElementById('dashboard-grid');
  const statsStrip = document.getElementById('stats-strip');
  if (!panelContent || !dashboardGrid) return;

  closeSidebarIfMobile();

  dashboardGrid.classList.remove('view-hidden');
  if (statsStrip) statsStrip.classList.remove('view-hidden');
  panelContent.classList.remove('panel-active');
  window._activePanel = null;

  // Update URL hash
  if (!skipHash) history.replaceState(null, '', location.pathname);

  // Highlight dashboard button
  document.querySelectorAll('.sidebar-btn').forEach(b => b.classList.remove('active'));
  document.querySelector('.sidebar-btn[data-panel="dashboard"]')?.classList.add('active');
};

// Backward compatibility
window.closePanel = window.showDashboard;

// Re-render all components (called on language switch)
window.refreshAllComponents = function() {
  const activeState = state.getActivePrinterState();
  const printData = activeState.print || activeState;
  updateDashboard(printData);
  updateConnectionBadge();
  if (typeof updatePrinterSelector === 'function') updatePrinterSelector();
  // Re-render open panel
  window.reloadActiveTab();
};

// ---- Sidebar Collapse ----

const SIDEBAR_COLLAPSED_KEY = 'sidebar-collapsed';
const SIDEBAR_SECTIONS_KEY = 'sidebar-sections';

window.toggleSidebarCollapse = function() {
  const sidebar = document.getElementById('sidebar');
  if (!sidebar || window.innerWidth <= 768) return;
  const isCollapsed = sidebar.classList.toggle('collapsed');
  try { localStorage.setItem(SIDEBAR_COLLAPSED_KEY, isCollapsed ? '1' : '0'); } catch (_) {}
};

// ---- Sidebar Sections (collapsible groups) ----

window.toggleSidebarSection = function(name) {
  const section = document.querySelector(`.sidebar-section[data-section="${name}"]`);
  if (!section) return;
  section.classList.toggle('collapsed');
  _saveSidebarSections();
};

function _saveSidebarSections() {
  try {
    const state = {};
    document.querySelectorAll('.sidebar-section').forEach(s => {
      state[s.dataset.section] = s.classList.contains('collapsed') ? 0 : 1;
    });
    localStorage.setItem(SIDEBAR_SECTIONS_KEY, JSON.stringify(state));
  } catch (_) {}
}

function _restoreSidebarSections() {
  try {
    const raw = localStorage.getItem(SIDEBAR_SECTIONS_KEY);
    if (!raw) return;
    const state = JSON.parse(raw);
    for (const [name, open] of Object.entries(state)) {
      const section = document.querySelector(`.sidebar-section[data-section="${name}"]`);
      if (section) {
        if (open) section.classList.remove('collapsed');
        else section.classList.add('collapsed');
      }
    }
  } catch (_) {}
}

// Auto-expand section when its child panel becomes active
function _expandSectionForPanel(panelName) {
  const btn = document.querySelector(`.sidebar-btn[data-panel="${panelName}"]`);
  if (!btn) return;
  const section = btn.closest('.sidebar-section');
  if (section && section.classList.contains('collapsed')) {
    section.classList.remove('collapsed');
    _saveSidebarSections();
  }
}

// ---- Hash-based routing ----

function navigateFromHash() {
  const hash = location.hash.replace('#', '');
  const base = hash.split('/')[0];
  if (hash && PANEL_TITLES[hash]) {
    openPanel(hash, true);
  } else if (base && PANEL_TITLES[base]) {
    openPanel(base, true);
  } else if (window._activePanel) {
    showDashboard(true);
  }
}

window.addEventListener('hashchange', navigateFromHash);

// Init
document.addEventListener('DOMContentLoaded', async () => {
  await window.i18n.init();
  if (window._initPermissions) await window._initPermissions();

  // Apply permission gating to sidebar
  if (window._isAuthEnabled && window._isAuthEnabled()) {
    if (window._can && !window._can('admin')) {
      const settingsBtn = document.querySelector('[data-panel="settings"]');
      // Don't hide settings entirely — operators/viewers still need appearance/push settings
      // But we could hide it if we wanted. For now, keep visible — admin sections are gated inside.
    }
  }

  connect();

  // Restore sidebar collapse state
  if (window.innerWidth > 768 && localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === '1') {
    document.getElementById('sidebar')?.classList.add('collapsed');
  }

  // Restore sidebar section collapse state
  _restoreSidebarSections();

  // Fetch version for sidebar
  fetch('/api/update/status').then(r => r.json()).then(d => {
    const el = document.getElementById('sidebar-version');
    if (el && d.current) el.textContent = `v${d.current}`;
  }).catch(() => {});

  // Restore panel from URL hash on load
  const initHash = location.hash.replace('#', '');
  const initBase = initHash.split('/')[0];
  if (initHash && PANEL_TITLES[initHash]) {
    setTimeout(() => openPanel(initHash), 200);
  } else if (initBase && PANEL_TITLES[initBase]) {
    setTimeout(() => openPanel(initBase), 200);
  }

  // ESC key handler
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (window._activePanel) {
        showDashboard();
      } else if (window.innerWidth <= 768) {
        const sidebar = document.getElementById('sidebar');
        if (sidebar?.classList.contains('open')) toggleSidebar();
      }
    }
  });

  // Close sidebar on resize above mobile breakpoint
  window.addEventListener('resize', () => {
    if (window.innerWidth > 768) {
      const sidebar = document.getElementById('sidebar');
      const backdrop = document.getElementById('sidebar-backdrop');
      if (sidebar) sidebar.classList.remove('open');
      if (backdrop) backdrop.classList.remove('visible');
      document.body.style.overflow = '';
    }
  });
});
