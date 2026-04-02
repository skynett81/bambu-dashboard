// Interactions — tooltip, toast, confirm, ripple, number counter, keyboard shortcuts
(function() {
  'use strict';

  // ---- Tooltip System ----
  let _activeTooltip = null;
  let _tooltipTimeout = null;

  function _initTooltips() {
    document.addEventListener('mouseover', (e) => {
      const target = e.target.closest('[data-tooltip]');
      if (!target || _activeTooltip) return;
      const text = target.getAttribute('data-tooltip');
      if (!text) return;

      _tooltipTimeout = setTimeout(() => {
        const tip = document.createElement('div');
        tip.className = 'ix-tooltip';
        tip.textContent = text;
        document.body.appendChild(tip);

        const rect = target.getBoundingClientRect();
        const pos = target.getAttribute('data-tooltip-pos') || 'top';
        const tw = tip.offsetWidth;
        const th = tip.offsetHeight;

        let top, left;
        if (pos === 'bottom') {
          top = rect.bottom + 6;
          left = rect.left + rect.width / 2 - tw / 2;
        } else if (pos === 'left') {
          top = rect.top + rect.height / 2 - th / 2;
          left = rect.left - tw - 6;
        } else if (pos === 'right') {
          top = rect.top + rect.height / 2 - th / 2;
          left = rect.right + 6;
        } else {
          top = rect.top - th - 6;
          left = rect.left + rect.width / 2 - tw / 2;
        }

        // Keep within viewport
        left = Math.max(8, Math.min(left, window.innerWidth - tw - 8));
        top = Math.max(8, top);

        tip.style.top = top + 'px';
        tip.style.left = left + 'px';
        _activeTooltip = tip;
      }, 200);
    });

    document.addEventListener('mouseout', (e) => {
      const target = e.target.closest('[data-tooltip]');
      if (!target) return;
      clearTimeout(_tooltipTimeout);
      if (_activeTooltip) {
        _activeTooltip.remove();
        _activeTooltip = null;
      }
    });
  }

  // ---- Toast System ----
  let _toastContainer = null;
  const MAX_TOASTS = 5;

  const TOAST_ICONS = {
    success: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M9 12l2 2 4-4"/></svg>',
    error: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>',
    warning: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
    info: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>'
  };

  function _ensureToastContainer() {
    if (!_toastContainer) {
      _toastContainer = document.createElement('div');
      _toastContainer.id = 'ix-toast-container';
      _toastContainer.setAttribute('aria-live', 'polite');
      _toastContainer.setAttribute('aria-atomic', 'false');
      _toastContainer.setAttribute('role', 'status');
      document.body.appendChild(_toastContainer);
    }
    return _toastContainer;
  }

  /**
   * Show a toast notification.
   * @param {string} message - The message to display
   * @param {'info'|'success'|'warning'|'error'} [type='info'] - Toast type
   * @param {number} [duration=3500] - Auto-dismiss duration in ms (0 = manual dismiss only)
   * @param {Array<{label: string, onClick: Function}>} [actions] - Optional action buttons
   */
  window.showToast = function(message, type, duration, actions) {
    type = type || 'info';
    duration = (duration === undefined || duration === null) ? 3500 : duration;

    // Play notification sound for error toasts
    if (type === 'error' && typeof notificationSound !== 'undefined') notificationSound.error();

    // Feed notification center — only for errors and warnings, not routine toasts
    if ((type === 'error' || type === 'warning') && typeof addNotification === 'function') {
      addNotification(message, '', type);
    }

    const container = _ensureToastContainer();

    // Limit visible toasts
    while (container.children.length >= MAX_TOASTS) {
      container.firstElementChild.remove();
    }

    const toast = document.createElement('div');
    toast.className = 'ix-toast ix-toast--' + type;
    let html = (TOAST_ICONS[type] || TOAST_ICONS.info) + '<span>' + _escHtml(message) + '</span>';

    // Add action buttons
    if (actions && actions.length > 0) {
      html += '<div class="ix-toast-actions">';
      for (let i = 0; i < actions.length; i++) {
        html += '<button class="ix-toast-action" data-action-idx="' + i + '">' + _escHtml(actions[i].label) + '</button>';
      }
      html += '</div>';
    }

    toast.innerHTML = html;

    // Wire up action button clicks
    if (actions && actions.length > 0) {
      toast.querySelectorAll('.ix-toast-action').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const idx = parseInt(btn.dataset.actionIdx);
          if (actions[idx] && actions[idx].onClick) actions[idx].onClick();
          _dismissToast(toast);
        });
      });
    }

    // Click to dismiss (but not on action buttons)
    toast.addEventListener('click', (e) => {
      if (!e.target.closest('.ix-toast-action')) _dismissToast(toast);
    });

    container.appendChild(toast);

    // Auto-dismiss (skip if duration is 0)
    if (duration > 0) {
      setTimeout(() => _dismissToast(toast), duration);
    }
  };

  function _dismissToast(toast) {
    if (toast._dismissed) return;
    toast._dismissed = true;
    toast.classList.add('ix-toast--exit');
    setTimeout(() => toast.remove(), 300);
  }

  // ---- Custom Confirm Dialog ----
  window.confirmAction = function(message, onConfirm, options) {
    options = options || {};
    const title = options.title || (typeof t === 'function' ? t('interactions.confirm_title') : 'Confirm');
    const okText = options.confirmText || (typeof t === 'function' ? t('interactions.confirm_ok') : 'Confirm');
    const cancelText = options.cancelText || (typeof t === 'function' ? t('interactions.confirm_cancel') : 'Cancel');
    const danger = options.danger || false;

    const overlay = document.createElement('div');
    overlay.className = 'ix-confirm-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.innerHTML = `
      <div class="ix-confirm-modal">
        <div class="ix-confirm-title">${_escHtml(title)}</div>
        <div class="ix-confirm-message">${_escHtml(message)}</div>
        <div class="ix-confirm-actions">
          <button class="form-btn form-btn-secondary ix-confirm-cancel">${_escHtml(cancelText)}</button>
          <button class="form-btn ${danger ? 'form-btn-danger' : ''} ix-confirm-ok" data-ripple>${_escHtml(okText)}</button>
        </div>
      </div>
    `;

    function close() {
      overlay.remove();
      document.removeEventListener('keydown', onKey);
    }

    function onKey(e) {
      if (e.key === 'Escape') { e.stopPropagation(); close(); }
    }

    // Backdrop click = cancel
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) close();
    });

    overlay.querySelector('.ix-confirm-cancel').addEventListener('click', close);
    overlay.querySelector('.ix-confirm-ok').addEventListener('click', () => {
      close();
      if (onConfirm) onConfirm();
    });

    document.addEventListener('keydown', onKey, true);
    document.body.appendChild(overlay);

    // Focus confirm button
    const okBtn = overlay.querySelector('.ix-confirm-ok');
    if (okBtn) okBtn.focus();
  };

  // ---- Ripple Effect ----
  function _initRipple() {
    document.addEventListener('click', (e) => {
      const target = e.target.closest('[data-ripple]');
      if (!target) return;

      const rect = target.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height) * 2;
      const x = e.clientX - rect.left - size / 2;
      const y = e.clientY - rect.top - size / 2;

      const ripple = document.createElement('span');
      ripple.className = 'ix-ripple';
      ripple.style.width = ripple.style.height = size + 'px';
      ripple.style.left = x + 'px';
      ripple.style.top = y + 'px';

      target.appendChild(ripple);
      setTimeout(() => ripple.remove(), 650);
    });
  }

  // ---- Number Counter Animation ----
  const _activeCounters = new WeakMap();

  window.animateNumber = function(el, from, to, duration, format) {
    if (!el) return;
    duration = duration || 600;
    format = format || Math.round;

    // Cancel ongoing animation on same element
    const prev = _activeCounters.get(el);
    if (prev) cancelAnimationFrame(prev);

    const start = performance.now();
    const diff = to - from;

    function tick(now) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // Ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = from + diff * eased;

      el.textContent = format(current);

      if (progress < 1) {
        _activeCounters.set(el, requestAnimationFrame(tick));
      } else {
        _activeCounters.delete(el);
      }
    }

    _activeCounters.set(el, requestAnimationFrame(tick));
  };

  // ---- Keyboard Shortcuts ----
  const SHORTCUT_PANELS = [
    null, // Ctrl+0 unused
    'dashboard',  // Ctrl+1
    'controls',   // Ctrl+2
    'queue',      // Ctrl+3
    'history',    // Ctrl+4
    'stats',      // Ctrl+5
    'filament',   // Ctrl+6
    'settings'    // Ctrl+7
  ];

  const ALL_SHORTCUTS = [
    { keys: ['Ctrl', '1'], desc: 'Dashboard' },
    { keys: ['Ctrl', '2'], desc: 'Controls' },
    { keys: ['Ctrl', '3'], desc: 'Queue' },
    { keys: ['Ctrl', '4'], desc: 'History' },
    { keys: ['Ctrl', '5'], desc: 'Statistics' },
    { keys: ['Ctrl', '6'], desc: 'Filament' },
    { keys: ['Ctrl', '7'], desc: 'Settings' },
    { keys: ['Esc'], desc: 'Back to Dashboard / Close' },
    { keys: ['?'], desc: 'Show shortcuts' },
    { keys: ['P'], desc: 'Pause / Resume print' },
    { keys: ['F'], desc: 'Toggle fullscreen' },
    { keys: ['T'], desc: 'Toggle theme' },
    { keys: ['['], desc: 'Previous printer' },
    { keys: [']'], desc: 'Next printer' },
    { keys: ['Ctrl', 'K'], desc: 'Command palette' },
    { keys: ['Alt', '↑'], desc: 'Previous panel' },
    { keys: ['Alt', '↓'], desc: 'Next panel' },
  ];

  function _showShortcutsHelp() {
    let html = '<div style="margin-bottom:16px"><h3 style="margin:0 0 4px">Keyboard Shortcuts</h3><p style="color:var(--text-muted);font-size:0.8rem;margin:0">Quick navigation and controls</p></div>';
    html += '<div class="shortcut-grid">';
    for (const s of ALL_SHORTCUTS) {
      html += '<div class="shortcut-row"><span>' + _escHtml(s.desc) + '</span><span class="shortcut-keys">';
      for (const k of s.keys) html += '<kbd class="kbd">' + _escHtml(k) + '</kbd>';
      html += '</span></div>';
    }
    html += '</div>';
    html += '<div style="margin-top:16px;text-align:right"><button class="form-btn form-btn-secondary" data-close-modal>Close</button></div>';
    if (typeof openModal === 'function') openModal(html, { style: 'max-width:520px;width:90%;padding:24px' });
  }

  window.showShortcutsHelp = _showShortcutsHelp;

  function _initKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
      // Skip when in input fields
      const tag = document.activeElement?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

      // Ctrl+K — command palette
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        if (typeof window.openCommandPalette === 'function') window.openCommandPalette();
        return;
      }

      // Ctrl+number navigation
      if (e.ctrlKey && !e.shiftKey && !e.altKey) {
        const num = parseInt(e.key);
        if (num >= 1 && num <= 7 && SHORTCUT_PANELS[num]) {
          e.preventDefault();
          const panel = SHORTCUT_PANELS[num];
          if (panel === 'dashboard') {
            if (typeof showDashboard === 'function') showDashboard();
          } else {
            if (typeof openPanel === 'function') openPanel(panel);
          }
          return;
        }
      }

      // Alt+Up/Down — navigate sidebar panels
      if (e.altKey && !e.ctrlKey && (e.key === 'ArrowUp' || e.key === 'ArrowDown')) {
        e.preventDefault();
        const btns = [...document.querySelectorAll('.sidebar-btn[data-panel]')];
        const activePanel = window._activePanel;
        const idx = btns.findIndex(b => b.dataset.panel === activePanel);
        const dir = e.key === 'ArrowUp' ? -1 : 1;
        const next = (idx + dir + btns.length) % btns.length;
        const panel = btns[next]?.dataset.panel;
        if (panel) {
          if (panel === 'dashboard' && typeof showDashboard === 'function') showDashboard();
          else if (typeof openPanel === 'function') openPanel(panel);
        }
      }

      // Single-key shortcuts (no modifier)
      if (!e.ctrlKey && !e.altKey && !e.metaKey) {
        switch (e.key) {
          case '?':
            e.preventDefault();
            _showShortcutsHelp();
            break;
          case 'p':
          case 'P':
            if (typeof sendCommand === 'function') {
              const ps = window.printerState?.getActivePrinterState?.();
              const gcodeState = ps?.print?.gcode_state || ps?.gcode_state;
              if (gcodeState === 'RUNNING') sendCommand('pause');
              else if (gcodeState === 'PAUSE') sendCommand('resume');
            }
            break;
          case 'f':
          case 'F':
            if (!document.fullscreenElement) {
              document.documentElement.requestFullscreen?.();
            } else {
              document.exitFullscreen?.();
            }
            break;
          case 't':
          case 'T':
            if (typeof toggleTheme === 'function') toggleTheme();
            break;
          case '[':
            _switchPrinter(-1);
            break;
          case ']':
            _switchPrinter(1);
            break;
        }
      }
    });
  }

  function _switchPrinter(direction) {
    const ids = window.printerState?.getPrinterIds?.() || [];
    if (ids.length < 2) return;
    const active = window.printerState.getActivePrinterId();
    const idx = ids.indexOf(active);
    const next = (idx + direction + ids.length) % ids.length;
    if (typeof window.printerState.setActivePrinter === 'function') {
      window.printerState.setActivePrinter(ids[next]);
      if (typeof window.reloadActiveTab === 'function') window.reloadActiveTab();
      if (typeof updatePrinterSelector === 'function') updatePrinterSelector();
      const meta = window.printerState.getPrinterMeta?.(ids[next]);
      if (typeof showToast === 'function') showToast(meta?.name || ids[next], 'info', 1500);
    }
  }

  // ---- Loading Button Helper ----
  window.withLoading = async function(btn, asyncFn) {
    if (!btn || btn.classList.contains('btn-loading')) return;
    btn.classList.add('btn-loading');
    btn.disabled = true;
    try {
      return await asyncFn();
    } finally {
      btn.classList.remove('btn-loading');
      btn.disabled = false;
    }
  };

  // ---- Tab Animation Helper ----
  // Call this instead of direct display:none/block toggling
  // container = parent of tab panels, activeId = id of panel to show
  window.switchTab = function(container, activeId) {
    if (!container) return;
    const panels = container.querySelectorAll('[data-tab-panel]');
    panels.forEach(p => {
      if (p.id === activeId || p.getAttribute('data-tab-panel') === activeId) {
        p.style.display = '';
        p.classList.add('ix-tab-panel');
        // Remove animation class after it plays so it can retrigger
        p.addEventListener('animationend', () => p.classList.remove('ix-tab-panel'), { once: true });
      } else {
        p.style.display = 'none';
        p.classList.remove('ix-tab-panel');
      }
    });
  };

  // ---- Flash Feedback Helper ----
  window.flashElement = function(el, type) {
    if (!el) return;
    const cls = type === 'error' ? 'ix-flash-error' : 'ix-flash-success';
    el.classList.remove('ix-flash-success', 'ix-flash-error');
    void el.offsetWidth; // force reflow
    el.classList.add(cls);
    el.addEventListener('animationend', () => el.classList.remove(cls), { once: true });
  };

  // ---- Value Pulse Helper ----
  window.pulseElement = function(el) {};

  // ---- Modal Helpers ----
  window.openModal = function(html, options) {
    options = options || {};
    const overlay = document.createElement('div');
    overlay.className = 'ix-modal-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.innerHTML = '<div class="ix-modal-panel" style="' + (options.style || 'max-width:600px;width:90%;padding:24px') + '">' + html + '</div>';

    function close() {
      overlay.classList.add('ix-closing');
      setTimeout(() => overlay.remove(), 200);
      document.removeEventListener('keydown', onKey);
    }

    function onKey(e) {
      if (e.key === 'Escape') { e.stopPropagation(); close(); }
    }

    if (options.closeOnBackdrop !== false) {
      overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });
    }

    document.addEventListener('keydown', onKey, true);
    document.body.appendChild(overlay);

    // Wire up close buttons
    overlay.querySelectorAll('[data-close-modal]').forEach(btn => {
      btn.addEventListener('click', close);
    });

    return { overlay, close };
  };

  // ---- Auto-Ripple for dynamically rendered buttons ----
  // Adds ripple to any .form-btn or .ctrl-btn clicked, even without data-ripple attr
  function _initAutoRipple() {
    document.addEventListener('click', (e) => {
      const target = e.target.closest('.form-btn:not([data-ripple]), .ctrl-btn:not([data-ripple]), .tab-btn:not([data-ripple])');
      if (!target) return;
      // Reuse ripple logic
      const rect = target.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height) * 2;
      const x = e.clientX - rect.left - size / 2;
      const y = e.clientY - rect.top - size / 2;
      const ripple = document.createElement('span');
      ripple.className = 'ix-ripple';
      ripple.style.width = ripple.style.height = size + 'px';
      ripple.style.left = x + 'px';
      ripple.style.top = y + 'px';
      // Ensure parent can contain the ripple
      const pos = getComputedStyle(target).position;
      if (pos === 'static') target.style.position = 'relative';
      if (getComputedStyle(target).overflow !== 'hidden') target.style.overflow = 'hidden';
      target.appendChild(ripple);
      setTimeout(() => ripple.remove(), 650);
    });
  }

  // ---- Utilities ----
  function _escHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  // ---- Scroll-to-top Button ----
  function _initScrollToTop() {
    const btn = document.createElement('button');
    btn.className = 'ix-scroll-top';
    btn.setAttribute('data-tooltip', 'Scroll to top');
    btn.setAttribute('data-tooltip-pos', 'left');
    btn.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="18 15 12 9 6 15"/></svg>';
    document.body.appendChild(btn);

    const main = document.querySelector('.main-wrapper') || window;
    const scrollTarget = document.querySelector('.main-content') || document.querySelector('.main-wrapper') || window;

    function checkScroll() {
      const el = scrollTarget === window ? document.documentElement : scrollTarget;
      const scrollY = el.scrollTop || 0;
      btn.classList.toggle('visible', scrollY > 300);
    }

    (scrollTarget === window ? window : scrollTarget).addEventListener('scroll', checkScroll, { passive: true });

    btn.addEventListener('click', () => {
      const el = scrollTarget === window ? document.documentElement : scrollTarget;
      el.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  // ---- Gauge Danger Monitor ----
  // Watches temperature gauges and adds danger class when values are high
  window.checkGaugeDanger = function() {
    const wrappers = document.querySelectorAll('.gauge-wrapper');
    wrappers.forEach(wrap => {
      const label = wrap.querySelector('.gauge-label');
      if (!label) return;
      // Check the text for temperature values
      const valueEl = wrap.querySelector('text[id*="gauge-value"]') || wrap.querySelector('.gauge-value');
      if (!valueEl) return;
      const val = parseFloat(valueEl.textContent);
      if (!isNaN(val) && val > 250) {
        wrap.classList.add('gauge-danger');
      } else {
        wrap.classList.remove('gauge-danger');
      }
    });
  };

  // ---- Init ----
  document.addEventListener('DOMContentLoaded', () => {
    _initTooltips();
    _initRipple();
    _initAutoRipple();
    _initKeyboardShortcuts();
    _initScrollToTop();
  });

})();
