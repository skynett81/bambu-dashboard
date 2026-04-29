// Context Menu - reusable right-click context menu component
(function() {
  'use strict';

  let _menu = null;

  /**
   * Show a context menu at the given coordinates.
   * @param {number} x - X position (clientX)
   * @param {number} y - Y position (clientY)
   * @param {Array} items - Menu items: { label, icon, onClick, separator, disabled, danger }
   */
  window.showContextMenu = function(x, y, items) {
    hideContextMenu();

    const menu = document.createElement('div');
    menu.className = 'ctx-menu';

    items.forEach(item => {
      if (item.separator) {
        const sep = document.createElement('div');
        sep.className = 'ctx-menu-sep';
        menu.appendChild(sep);
        return;
      }

      const btn = document.createElement('button');
      btn.className = 'ctx-menu-item' + (item.disabled ? ' disabled' : '') + (item.danger ? ' danger' : '');
      btn.type = 'button';

      if (item.icon) {
        const iconSpan = document.createElement('span');
        iconSpan.innerHTML = item.icon;
        btn.appendChild(iconSpan);
      }

      const labelSpan = document.createElement('span');
      labelSpan.textContent = item.label;
      btn.appendChild(labelSpan);

      if (!item.disabled && item.onClick) {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          hideContextMenu();
          item.onClick();
        });
      }

      menu.appendChild(btn);
    });

    document.body.appendChild(menu);
    _menu = menu;

    // Position: ensure menu stays within viewport
    const rect = menu.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    if (x + rect.width > vw) x = vw - rect.width - 8;
    if (y + rect.height > vh) y = vh - rect.height - 8;
    if (x < 0) x = 8;
    if (y < 0) y = 8;

    menu.style.left = x + 'px';
    menu.style.top = y + 'px';
  };

  window.hideContextMenu = function() {
    if (_menu) {
      _menu.remove();
      _menu = null;
    }
  };

  // Close on any left click
  document.addEventListener('click', () => hideContextMenu());

  // Close on Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') hideContextMenu();
  });

  // Close on scroll
  document.addEventListener('scroll', () => hideContextMenu(), true);

  /**
   * Build context menu items for a printer.
   * @param {string} printerId - The printer ID
   * @returns {Array} Menu items array
   */
  window.buildPrinterContextMenuItems = function(printerId) {
    const state = window.printerState;
    const ps = state.printers[printerId]?.print || state.printers[printerId] || {};
    const meta = state.printerMeta[printerId] || {};
    const gcodeState = ps.gcode_state || 'IDLE';
    const isRunning = gcodeState === 'RUNNING';
    const isPaused = gcodeState === 'PAUSE';
    const isPrinting = isRunning || isPaused;

    const items = [];

    // Pause / Resume
    if (isRunning) {
      items.push({
        label: typeof t === 'function' ? t('controls.pause', 'Pause') : 'Pause',
        icon: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>',
        onClick: () => sendCommand('pause', { printer_id: printerId })
      });
    } else if (isPaused) {
      items.push({
        label: typeof t === 'function' ? t('controls.resume', 'Resume') : 'Resume',
        icon: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5,3 19,12 5,21"/></svg>',
        onClick: () => sendCommand('resume', { printer_id: printerId })
      });
    } else {
      items.push({
        label: typeof t === 'function' ? t('controls.pause', 'Pause') : 'Pause',
        icon: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>',
        disabled: true
      });
    }

    // Stop print
    items.push({
      label: typeof t === 'function' ? t('controls.stop', 'Stop print') : 'Stop print',
      icon: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="4" y="4" width="16" height="16" rx="2"/></svg>',
      disabled: !isPrinting,
      danger: isPrinting,
      onClick: isPrinting ? () => {
        if (confirm('Stop the current print?')) {
          sendCommand('stop', { printer_id: printerId });
        }
      } : undefined
    });

    items.push({ separator: true });

    // Toggle light
    items.push({
      label: typeof t === 'function' ? t('controls.light', 'Toggle light') : 'Toggle light',
      icon: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18h6"/><path d="M10 22h4"/><path d="M12 2a7 7 0 0 0-4 12.7V17h8v-2.3A7 7 0 0 0 12 2z"/></svg>',
      onClick: () => {
        // Select printer first if needed, then toggle
        if (state.getActivePrinterId() !== printerId) {
          selectPrinter(printerId);
        }
        if (typeof toggleLight === 'function') toggleLight();
      }
    });

    // Send G-code
    items.push({
      label: typeof t === 'function' ? t('controls.send_gcode', 'Send G-code...') : 'Send G-code...',
      icon: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="16,18 22,12 16,6"/><polyline points="8,6 2,12 8,18"/></svg>',
      onClick: () => {
        if (state.getActivePrinterId() !== printerId) {
          selectPrinter(printerId);
        }
        openPanel('controls');
        // Focus gcode input after panel opens
        setTimeout(() => {
          const input = document.getElementById('gcode-input');
          if (input) input.focus();
        }, 300);
      }
    });

    items.push({ separator: true });

    // View controls
    items.push({
      label: typeof t === 'function' ? t('nav.controls', 'View controls') : 'View controls',
      icon: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83"/></svg>',
      onClick: () => {
        if (state.getActivePrinterId() !== printerId) selectPrinter(printerId);
        openPanel('controls');
      }
    });

    // View diagnostics
    items.push({
      label: typeof t === 'function' ? t('nav.diagnostics', 'View diagnostics') : 'View diagnostics',
      icon: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>',
      onClick: () => {
        if (state.getActivePrinterId() !== printerId) selectPrinter(printerId);
        openPanel('diagnostics');
      }
    });

    // View history
    items.push({
      label: typeof t === 'function' ? t('nav.history', 'View history') : 'View history',
      icon: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12,6 12,12 16,14"/></svg>',
      onClick: () => {
        if (state.getActivePrinterId() !== printerId) selectPrinter(printerId);
        openPanel('history');
      }
    });

    items.push({ separator: true });

    // Edit printer
    items.push({
      label: typeof t === 'function' ? t('settings.edit_printer', 'Edit printer') : 'Edit printer',
      icon: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>',
      onClick: () => {
        if (typeof editPrinter === 'function') editPrinter(printerId);
      }
    });

    // Remove printer
    items.push({
      label: typeof t === 'function' ? t('settings.remove_printer', 'Remove printer') : 'Remove printer',
      icon: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3,6 5,6 21,6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>',
      danger: true,
      onClick: () => {
        if (typeof removePrinter === 'function') removePrinter(printerId);
      }
    });

    return items;
  };
})();
