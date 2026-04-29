// Browser Notifications for print events + sound integration
(function() {
  let previousStates = {};
  let enabled = false;
  let recentNotifs = {};
  const COOLDOWN_MS = 60000;

  function requestPermission() {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().then(p => { enabled = p === 'granted'; });
    }
    enabled = typeof Notification !== 'undefined' && Notification.permission === 'granted';
  }

  function notify(key, title, body) {
    if (!enabled) return;
    const now = Date.now();
    if (recentNotifs[key] && now - recentNotifs[key] < COOLDOWN_MS) return;
    recentNotifs[key] = now;
    try {
      new Notification(title, { body, icon: '/assets/favicon.svg' });
    } catch (e) { /* ignore */ }
  }

  window.checkNotifications = function(printerId, data) {
    const curr = data.gcode_state;
    if (!curr) return;

    const prev = previousStates[printerId];
    previousStates[printerId] = curr;

    const name = data.subtask_name || t('notify.print');
    const ns = typeof notificationSound !== 'undefined' ? notificationSound : null;

    // Countdown check — play sound when ≤1 min remaining
    if (curr === 'RUNNING' && ns) {
      const remainSec = parseInt(data.mc_remaining_time) * 60;
      if (remainSec > 0) ns.checkCountdown(printerId, remainSec);
    }

    // Skip first update (initialization)
    if (!prev) return;
    if (prev === curr) return;

    const key = `${printerId}:${curr}`;

    if (prev === 'RUNNING' && curr === 'FINISH') {
      notify(key, t('notify.print_finished'), t('notify.print_finished_body', { name }));
      if (ns) ns.play('print_complete');
    } else if (prev === 'RUNNING' && curr === 'FAILED') {
      notify(key, t('notify.print_failed'), t('notify.print_failed_body', { name }));
      if (ns) ns.play('print_failed');
    } else if (prev !== 'RUNNING' && curr === 'RUNNING') {
      notify(key, t('notify.print_started'), t('notify.print_started_body', { name }));
      if (ns) ns.play('print_started');
    } else if (prev === 'RUNNING' && curr === 'PAUSE') {
      notify(key, t('notify.print_paused', 'Print paused'), name);
      if (ns) ns.play('print_paused');
    }

    // Global alert bar for important state changes
    if (prev === 'RUNNING' && curr === 'FINISH') {
      showGlobalAlert('success', t('notify.print_finished') + ': ' + name, 15000);
    } else if (prev === 'RUNNING' && curr === 'FAILED') {
      showGlobalAlert('error', t('notify.print_failed') + ': ' + name, 0); // persistent until dismissed
    }
  };

  // ═══ Global Alert Bar ═══
  const _dismissedAlerts = new Set();

  window.showGlobalAlert = function(type, message, autoDismissMs) {
    const bar = document.getElementById('global-alert-bar');
    if (!bar) return;

    const id = 'ga-' + Date.now();
    const iconSvg = type === 'error'
      ? '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>'
      : type === 'warn'
      ? '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>'
      : '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>';

    const el = document.createElement('div');
    el.className = 'global-alert-item global-alert-' + type;
    el.id = id;
    el.innerHTML = iconSvg + '<span>' + message + '</span><span class="global-alert-item-dismiss" onclick="dismissGlobalAlert(\'' + id + '\')">&times;</span>';
    bar.appendChild(el);
    bar.style.display = 'flex';

    if (autoDismissMs > 0) {
      setTimeout(() => dismissGlobalAlert(id), autoDismissMs);
    }
  };

  window.dismissGlobalAlert = function(id) {
    const el = document.getElementById(id);
    if (el) el.remove();
    const bar = document.getElementById('global-alert-bar');
    if (bar && !bar.children.length) bar.style.display = 'none';
  };

  // Check for low filament and show persistent alert
  let _filamentAlertDismissed = false;
  let _filamentAlertShown = false;

  window.checkFilamentAlerts = function(data) {
    if (_filamentAlertDismissed) return;
    const bar = document.getElementById('global-alert-bar');
    if (!bar) return;

    // Non-Bambu: filament sensor runout alert
    if (!data.ams?.ams) {
      if (data._filament_sensor && !data._filament_sensor.detected && data.gcode_state === 'RUNNING') {
        if (!bar.querySelector('#filament-sensor-alert')) {
          bar.innerHTML = `<div id="filament-sensor-alert" class="global-alert global-alert-error">
            <span>⚠ Filament not detected! Print may fail.</span>
            <button class="global-alert-dismiss" onclick="this.parentElement.remove()">✕</button>
          </div>`;
          bar.style.display = '';
        }
      }
      return;
    }

    // Only update if not already showing (avoid flicker from re-creating every tick)
    const lowTrays = [];
    for (const unit of data.ams.ams) {
      for (const tray of (unit.tray || [])) {
        if (tray && tray.remain >= 0 && tray.remain <= 10 && tray.tray_type) {
          lowTrays.push({ slot: 'A' + (parseInt(tray.id) + 1), pct: Math.round(tray.remain), type: tray.tray_type });
        }
      }
    }

    const extSpool = typeof getLinkedSpool === 'function' ? getLinkedSpool(window.printerState?.getActivePrinterId?.(), 255, 0) : null;
    if (extSpool && extSpool.initial_weight_g > 0) {
      const extPct = Math.round(extSpool.remaining_weight_g / extSpool.initial_weight_g * 100);
      if (extPct <= 10) lowTrays.push({ slot: 'EXT', pct: extPct, type: extSpool.material || 'PLA' });
    }

    // Remove old filament alerts if status changed
    if (lowTrays.length === 0 || _filamentAlertShown) {
      bar.querySelectorAll('.ga-filament').forEach(el => el.remove());
      if (!bar.children.length) bar.style.display = 'none';
      if (lowTrays.length === 0) { _filamentAlertShown = false; return; }
    }

    if (!_filamentAlertShown && lowTrays.length > 0) {
      _filamentAlertShown = true;
      const msg = lowTrays.map(t => t.slot + ': ' + t.pct + '% ' + t.type).join(' · ');
      const alertType = lowTrays.some(t => t.pct <= 5) ? 'error' : 'warn';
      const el = document.createElement('div');
      el.className = 'global-alert-item global-alert-' + alertType + ' ga-filament';
      el.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg><span>' + (t('ams.low_filament_alert', 'Low filament')) + ': ' + msg + '</span><span class="global-alert-item-dismiss" onclick="_filamentAlertDismissed=true;this.closest(\'.ga-filament\').remove();var b=document.getElementById(\'global-alert-bar\');if(b&&!b.children.length)b.style.display=\'none\'">×</span>';
      bar.appendChild(el);
      bar.style.display = 'flex';
    }

    if (!bar.children.length) bar.style.display = 'none';
  };

  document.addEventListener('DOMContentLoaded', requestPermission);
})();
