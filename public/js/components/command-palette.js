(function() {
  'use strict';

  /* ═══ Command Palette ═══
   * VS Code-style Ctrl+K command palette for quick navigation,
   * actions and printer switching.
   */

  const PANEL_LABELS = {
    dashboard: 'Dashboard',
    controls: 'Controls',
    queue: 'Print Queue',
    history: 'History',
    stats: 'Statistics',
    filament: 'Filament',
    errors: 'Error Log',
    maintenance: 'Maintenance',
    fleet: 'Fleet',
    library: 'File Library',
    diagnostics: 'Diagnostics',
    settings: 'Settings',
    achievements: 'Achievements',
    profiles: 'Print Profiles',
    calendar: 'Print Calendar',
    screenshots: 'Screenshots',
    widgets: 'Widgets',
    plugins: 'Plugins',
    backup: 'Backup',
    costestimator: 'Cost Estimator',
    labels: 'Labels',
    scheduler: 'Scheduler',
    telemetry: 'Telemetry',
    bedmesh: 'Bed Mesh',
    health: 'Health',
    gcode: 'G-code',
    comparison: 'Compare',
    forecast: 'Forecast',
    waste: 'Waste',
    playground: 'API Playground',
    learning: 'Learning Resources',
    knowledge: 'Knowledge Base',
    modelinfo: 'Model Info',
    materialrec: 'Recommendations',
    wearprediction: 'Wear Prediction',
    erroranalysis: 'Error Pattern AI',
    multicolor: 'Multicolor',
    protection: 'Print Guard',
    orders: 'Orders',
    printermatrix: 'Printer Matrix',
    timetracker: 'Time Analysis',
    activity: t('tabs.activity') || 'Activity',
    gallery: 'Gallery',
    // 2026 additions — every panel registered in PANEL_TITLES should be
    // searchable from the Ctrl+K palette so users can jump straight in.
    'ai-forge':         'AI Model Forge',
    'mesh-repair':      'Mesh Repair Toolkit',
    'scene-composer':   'Scene Composer',
    'gcode-studio':     'G-code Studio',
    'gcode-reference':  'G-code Reference & Estimator',
    'calibration':      'Calibration & Tuning',
    'preflight':        'Pre-print Analysis',
    'analysis':         'Analysis',
    'analytics':        'Analytics',
    'firmware-updates': 'Firmware Updates',
    'admin-diagnostics':'Diagnostics & Tuning (admin)',
    'admin-inventory':  'Inventory Admin',
    'admin-kb':         'Knowledge Base Admin',
    'modelforge':       'Model Forge',
    'signmaker':        'Sign Maker',
    'jscad':            'JSCAD Studio',
    'octoprint':        'OctoPrint Bridge',
    'resources':        'Vendor Resources',
    'logs':             'Server Logs',
    'filamentanalytics':'Filament Analytics',
    'crm-dashboard':    'CRM Dashboard',
    'crm-customers':    'CRM Customers',
    'crm-orders':       'CRM Orders',
    'crm-invoices':     'CRM Invoices',
    'crm-settings':     'CRM Settings',
  };

  /* ---- SVG Icons (16x16) ---- */
  const ICONS = {
    nav:        '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="12" height="12" rx="2"/><line x1="2" y1="6" x2="14" y2="6"/><line x1="6" y1="6" x2="6" y2="14"/></svg>',
    dashboard:  '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="5" height="5" rx="1"/><rect x="9" y="2" width="5" height="5" rx="1"/><rect x="2" y="9" width="5" height="5" rx="1"/><rect x="9" y="9" width="5" height="5" rx="1"/></svg>',
    theme:      '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="8" cy="8" r="3"/><path d="M8 1v2M8 13v2M1 8h2M13 8h2M3.05 3.05l1.41 1.41M11.54 11.54l1.41 1.41M3.05 12.95l1.41-1.41M11.54 4.46l1.41-1.41"/></svg>',
    fullscreen: '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="4 1 1 1 1 4"/><polyline points="12 1 15 1 15 4"/><polyline points="4 15 1 15 1 12"/><polyline points="12 15 15 15 15 12"/></svg>',
    pause:      '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="3" width="3" height="10" rx="1"/><rect x="9" y="3" width="3" height="10" rx="1"/></svg>',
    shortcuts:  '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="4" width="14" height="9" rx="2"/><line x1="4" y1="7" x2="4" y2="7.01"/><line x1="8" y1="7" x2="8" y2="7.01"/><line x1="12" y1="7" x2="12" y2="7.01"/><line x1="5" y1="10" x2="11" y2="10"/></svg>',
    printer:    '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="7" width="10" height="6" rx="1"/><path d="M5 7V3h6v4"/><line x1="6" y1="10" x2="10" y2="10"/><line x1="6" y1="12" x2="8" y2="12"/></svg>',
    settings:   '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="8" cy="8" r="2"/><path d="M13.7 9.5a1.2 1.2 0 0 0 .24 1.32l.04.04a1.44 1.44 0 1 1-2.04 2.04l-.04-.04a1.2 1.2 0 0 0-1.32-.24 1.2 1.2 0 0 0-.72 1.1v.12a1.44 1.44 0 1 1-2.88 0v-.06a1.2 1.2 0 0 0-.78-1.1 1.2 1.2 0 0 0-1.32.24l-.04.04a1.44 1.44 0 1 1-2.04-2.04l.04-.04a1.2 1.2 0 0 0 .24-1.32 1.2 1.2 0 0 0-1.1-.72h-.12a1.44 1.44 0 1 1 0-2.88h.06a1.2 1.2 0 0 0 1.1-.78 1.2 1.2 0 0 0-.24-1.32l-.04-.04A1.44 1.44 0 1 1 4.5 2.3l.04.04a1.2 1.2 0 0 0 1.32.24h.06a1.2 1.2 0 0 0 .72-1.1V1.44a1.44 1.44 0 1 1 2.88 0v.06a1.2 1.2 0 0 0 .72 1.1 1.2 1.2 0 0 0 1.32-.24l.04-.04a1.44 1.44 0 1 1 2.04 2.04l-.04.04a1.2 1.2 0 0 0-.24 1.32v.06a1.2 1.2 0 0 0 1.1.72h.12a1.44 1.44 0 1 1 0 2.88h-.06a1.2 1.2 0 0 0-1.1.72z"/></svg>',
    stats:      '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><line x1="4" y1="14" x2="4" y2="8"/><line x1="8" y1="14" x2="8" y2="4"/><line x1="12" y1="14" x2="12" y2="6"/></svg>',
    filament:   '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="8" cy="8" r="6"/><circle cx="8" cy="8" r="2"/></svg>',
    error:      '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M7.13 2.24 1.36 12.24a1 1 0 0 0 .87 1.5h11.54a1 1 0 0 0 .87-1.5L8.87 2.24a1 1 0 0 0-1.74 0z"/><line x1="8" y1="6" x2="8" y2="9"/><line x1="8" y1="11" x2="8.01" y2="11"/></svg>',
    calendar:   '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="12" height="11" rx="1"/><line x1="5" y1="1" x2="5" y2="4"/><line x1="11" y1="1" x2="11" y2="4"/><line x1="2" y1="7" x2="14" y2="7"/></svg>',
    search:     '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="7" cy="7" r="4"/><line x1="14" y1="14" x2="10.5" y2="10.5"/></svg>'
  };

  function _getIconForPanel(key) {
    if (key === 'dashboard') return ICONS.dashboard;
    if (key === 'settings') return ICONS.settings;
    if (key === 'stats' || key === 'timetracker' || key === 'comparison') return ICONS.stats;
    if (key === 'filament' || key === 'materialrec') return ICONS.filament;
    if (key === 'errors' || key === 'erroranalysis') return ICONS.error;
    if (key === 'calendar') return ICONS.calendar;
    return ICONS.nav;
  }

  /* ---- Fuzzy match ---- */
  function _fuzzyMatch(query, text) {
    query = query.toLowerCase();
    text = text.toLowerCase();
    if (text.includes(query)) return true;
    let qi = 0;
    for (let ti = 0; ti < text.length && qi < query.length; ti++) {
      if (text[ti] === query[qi]) qi++;
    }
    return qi === query.length;
  }

  function _fuzzyScore(query, text) {
    query = query.toLowerCase();
    text = text.toLowerCase();
    if (text === query) return 100;
    if (text.startsWith(query)) return 90;
    if (text.includes(query)) return 70;
    // subsequence score
    let qi = 0, consecutive = 0, score = 0;
    for (let ti = 0; ti < text.length && qi < query.length; ti++) {
      if (text[ti] === query[qi]) {
        qi++;
        consecutive++;
        score += consecutive * 2;
      } else {
        consecutive = 0;
      }
    }
    return qi === query.length ? score : 0;
  }

  /* ---- Build items ---- */
  function _buildItems() {
    const items = [];

    // Navigation items
    // Dashboard first
    items.push({
      id: 'nav-dashboard',
      label: 'Dashboard',
      category: 'Navigation',
      icon: ICONS.dashboard,
      action: function() {
        if (typeof showDashboard === 'function') showDashboard();
      }
    });

    for (const key in PANEL_LABELS) {
      if (key === 'dashboard') continue;
      items.push({
        id: 'nav-' + key,
        label: PANEL_LABELS[key],
        category: 'Navigation',
        icon: _getIconForPanel(key),
        action: (function(k) {
          return function() {
            if (typeof openPanel === 'function') openPanel(k);
          };
        })(key)
      });
    }

    // Action items
    items.push({
      id: 'act-theme',
      label: 'Toggle theme',
      category: 'Actions',
      icon: ICONS.theme,
      action: function() {
        if (typeof toggleTheme === 'function') toggleTheme();
      }
    });

    items.push({
      id: 'act-fullscreen',
      label: 'Fullscreen',
      category: 'Actions',
      icon: ICONS.fullscreen,
      action: function() {
        if (!document.fullscreenElement) {
          document.documentElement.requestFullscreen?.();
        } else {
          document.exitFullscreen?.();
        }
      }
    });

    items.push({
      id: 'act-pause',
      label: 'Pause / Resume print',
      category: 'Actions',
      icon: ICONS.pause,
      action: function() {
        if (typeof sendCommand === 'function') {
          var ps = window.printerState?.getActivePrinterState?.();
          var gcodeState = ps?.print?.gcode_state || ps?.gcode_state;
          if (gcodeState === 'RUNNING') sendCommand('pause');
          else if (gcodeState === 'PAUSE') sendCommand('resume');
        }
      }
    });

    items.push({
      id: 'act-shortcuts',
      label: t('command_palette.show_shortcuts') || 'Show shortcuts',
      category: t('command_palette.actions') || 'Actions',
      icon: ICONS.shortcuts,
      action: function() {
        if (typeof showShortcutsHelp === 'function') showShortcutsHelp();
      }
    });

    // Printer items
    var printerIds = window.printerState?.getPrinterIds?.() || [];
    for (var i = 0; i < printerIds.length; i++) {
      var pid = printerIds[i];
      var meta = window.printerState.getPrinterMeta?.(pid) || {};
      var name = meta.name || pid;
      items.push({
        id: 'printer-' + pid,
        label: name,
        category: t('command_palette.printers') || 'Printers',
        icon: ICONS.printer,
        action: (function(id) {
          return function() {
            if (typeof window.printerState?.setActivePrinter === 'function') {
              window.printerState.setActivePrinter(id);
            }
          };
        })(pid)
      });
    }

    return items;
  }

  /* ---- Escape HTML ---- */
  function _esc(s) {
    var d = document.createElement('div');
    d.textContent = s;
    return d.innerHTML;
  }

  /* ---- State ---- */
  var _overlay = null;
  var _activeIdx = 0;
  var _filteredItems = [];

  function _close() {
    if (_overlay) {
      _overlay.classList.add('cmd-palette-closing');
      setTimeout(function() {
        if (_overlay && _overlay.parentNode) {
          _overlay.parentNode.removeChild(_overlay);
        }
        _overlay = null;
      }, 150);
    }
  }

  function _render(query) {
    var items = _buildItems();
    query = (query || '').trim();

    if (query) {
      _filteredItems = items.filter(function(it) {
        return _fuzzyMatch(query, it.label) || _fuzzyMatch(query, it.category);
      });
      _filteredItems.sort(function(a, b) {
        return _fuzzyScore(query, b.label) - _fuzzyScore(query, a.label);
      });
    } else {
      _filteredItems = items;
    }

    if (_activeIdx >= _filteredItems.length) _activeIdx = Math.max(0, _filteredItems.length - 1);

    var list = _overlay?.querySelector('.cmd-palette-results');
    if (!list) return;

    if (_filteredItems.length === 0) {
      list.innerHTML = '<div class="cmd-palette-empty">' + (t('command_palette.no_results') || 'No results') + '</div>';
      return;
    }

    var html = '';
    var lastCat = '';
    for (var i = 0; i < _filteredItems.length; i++) {
      var it = _filteredItems[i];
      if (it.category !== lastCat) {
        lastCat = it.category;
        html += '<div class="cmd-palette-group">' + _esc(lastCat) + '</div>';
      }
      html += '<div class="cmd-palette-item' + (i === _activeIdx ? ' active' : '') + '" data-idx="' + i + '">';
      html += '<span class="cmd-palette-icon">' + it.icon + '</span>';
      html += '<span class="cmd-palette-label">' + _esc(it.label) + '</span>';
      html += '<span class="cmd-palette-badge">' + _esc(it.category) + '</span>';
      html += '</div>';
    }
    list.innerHTML = html;

    // Scroll active into view
    var active = list.querySelector('.cmd-palette-item.active');
    if (active) active.scrollIntoView({ block: 'nearest' });
  }

  function _selectItem(idx) {
    if (idx >= 0 && idx < _filteredItems.length) {
      var item = _filteredItems[idx];
      _close();
      setTimeout(function() { item.action(); }, 50);
    }
  }

  function _open() {
    if (_overlay) { _close(); return; }

    _activeIdx = 0;
    _filteredItems = [];

    var el = document.createElement('div');
    el.className = 'cmd-palette-overlay';
    el.innerHTML =
      '<div class="cmd-palette">' +
        '<div class="cmd-palette-header">' +
          '<span class="cmd-palette-search-icon">' + ICONS.search + '</span>' +
          '<input class="cmd-palette-input" type="text" placeholder="' + (t('command_palette.search_placeholder') || 'Search panels, actions, printers...') + '" autocomplete="off" spellcheck="false">' +
          '<kbd class="cmd-palette-esc">Esc</kbd>' +
        '</div>' +
        '<div class="cmd-palette-results"></div>' +
        '<div class="cmd-palette-footer">' +
          '<span><kbd>&uarr;</kbd><kbd>&darr;</kbd> ' + (t('command_palette.navigate') || 'navigate') + '</span>' +
          '<span><kbd>Enter</kbd> ' + (t('command_palette.select') || 'velg') + '</span>' +
          '<span><kbd>Esc</kbd> ' + (t('command_palette.close') || 'lukk') + '</span>' +
        '</div>' +
      '</div>';

    document.body.appendChild(el);
    _overlay = el;

    var input = el.querySelector('.cmd-palette-input');
    _render('');
    input.focus();

    // Event handlers
    input.addEventListener('input', function() {
      _activeIdx = 0;
      _render(input.value);
    });

    input.addEventListener('keydown', function(e) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        _activeIdx = Math.min(_activeIdx + 1, _filteredItems.length - 1);
        _render(input.value);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        _activeIdx = Math.max(_activeIdx - 1, 0);
        _render(input.value);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        _selectItem(_activeIdx);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        _close();
      }
    });

    // Click on item
    el.querySelector('.cmd-palette-results').addEventListener('click', function(e) {
      var row = e.target.closest('.cmd-palette-item');
      if (row) {
        var idx = parseInt(row.getAttribute('data-idx'), 10);
        _selectItem(idx);
      }
    });

    // Hover to highlight
    el.querySelector('.cmd-palette-results').addEventListener('mousemove', function(e) {
      var row = e.target.closest('.cmd-palette-item');
      if (row) {
        var idx = parseInt(row.getAttribute('data-idx'), 10);
        if (idx !== _activeIdx) {
          _activeIdx = idx;
          _render(input.value);
        }
      }
    });

    // Click overlay to close
    el.addEventListener('mousedown', function(e) {
      if (e.target === el) _close();
    });
  }

  /* ---- Keyboard shortcut (Ctrl+K / Cmd+K) ---- */
  document.addEventListener('keydown', function(e) {
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault();
      _open();
    }
  });

  /* ---- Global API ---- */
  window.openCommandPalette = _open;

})();
