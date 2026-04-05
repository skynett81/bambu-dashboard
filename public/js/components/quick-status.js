// Quick Status Card — WiFi, nozzle, storage, light, speed, errors
(function() {
  const SPEED_LABELS = { 1: 'speed.silent', 2: 'speed.standard', 3: 'speed.sport', 4: 'speed.ludicrous' };

  // Models that use USB instead of SD card
  const USB_MODELS = new Set(['P2S', 'P2S Combo', 'H2D']);

  function _isUsb() {
    const meta = window.printerState?.getActivePrinterMeta?.() || {};
    return USB_MODELS.has(meta.model);
  }

  const ICONS = {
    wifi: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12.55a11 11 0 0 1 14.08 0"/><path d="M1.42 9a16 16 0 0 1 21.16 0"/><path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><circle cx="12" cy="20" r="1"/></svg>',
    nozzle: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>',
    sd: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="4" y="2" width="16" height="20" rx="2"/><line x1="8" y1="6" x2="8" y2="10"/><line x1="12" y1="6" x2="12" y2="10"/><line x1="16" y1="6" x2="16" y2="10"/></svg>',
    usb: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v10"/><path d="M8 8l4-4 4 4"/><rect x="8" y="12" width="8" height="8" rx="1"/><line x1="10" y1="16" x2="14" y2="16"/></svg>',
    light: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>',
    speed: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>',
    error: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
    guard: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>'
  };

  // Cache for error/alert data per printer
  let _cachedErrors = {};
  let _cachedAlerts = {};
  let _lastPrinterId = null;
  let _fetchTimer = null;

  function fetchErrorData(printerId) {
    if (!printerId) return;
    // Fetch latest unacknowledged error from error log
    fetch(`/api/errors?printer_id=${printerId}&limit=10`)
      .then(r => r.json())
      .then(data => {
        const unacked = Array.isArray(data) ? data.find(e => !e.acknowledged) : null;
        _cachedErrors[printerId] = unacked || null;
        _renderCached();
      }).catch(() => {});
    // Fetch active protection alerts
    fetch(`/api/protection/status?printer_id=${printerId}`)
      .then(r => r.json())
      .then(data => {
        const alerts = data.alerts || [];
        _cachedAlerts[printerId] = alerts.length > 0 ? alerts : null;
        _renderCached();
      }).catch(() => {});
  }

  function _renderCached() {
    const container = document.getElementById('sidebar-status-content');
    if (!container || !container._lastHtml) return;
    const printerId = window.printerState?.getActivePrinterId();
    const errEl = container.querySelector('.qs-error-value');
    const guardEl = container.querySelector('.qs-guard-value');
    if (errEl) {
      const err = _cachedErrors[printerId];
      if (err) {
        errEl.innerHTML = `<a href="#errors" class="qs-link" style="color:var(--accent-red)">${t('quick_status.has_errors')}</a>`;
      }
    }
    if (guardEl) {
      const alerts = _cachedAlerts[printerId];
      if (alerts && alerts.length > 0) {
        guardEl.innerHTML = `<a href="#protection" class="qs-link" style="color:var(--accent-orange)">${alerts.length} ${t('quick_status.active')}</a>`;
      }
    }
  }

  function wifiColor(sig) {
    const dbm = typeof sig === 'string' ? parseInt(sig) : sig;
    if (isNaN(dbm)) return '';
    if (dbm > -50) return 'var(--accent-green)';
    if (dbm > -70) return 'var(--accent-orange)';
    return 'var(--accent-red)';
  }

  function item(icon, label, value, color, extraClass) {
    const colorStyle = color ? ` style="color:${color}"` : '';
    const cls = extraClass ? ` ${extraClass}` : '';
    return `<div class="qs-item">
      <div class="qs-icon">${ICONS[icon]}</div>
      <div class="qs-text">
        <span class="qs-label">${label}</span>
        <span class="qs-value${cls}"${colorStyle}>${value}</span>
      </div>
    </div>`;
  }

  window.updateQuickStatus = function(data) {
    const container = document.getElementById('sidebar-status-content');
    if (!container) return;

    const printerId = window.printerState?.getActivePrinterId();

    // Fetch error data on printer change or periodically
    if (printerId !== _lastPrinterId) {
      _lastPrinterId = printerId;
      fetchErrorData(printerId);
      if (_fetchTimer) clearInterval(_fetchTimer);
      _fetchTimer = setInterval(() => fetchErrorData(printerId), 30000);
    }

    // WiFi
    const wifiSig = data.wifi_signal || '--';
    const wifiCol = wifiColor(wifiSig);

    // Nozzle
    const nozzleType = data.nozzle_type || '';
    const nozzleDiam = data.nozzle_diameter || '';
    const nozzleStr = nozzleType && nozzleDiam
      ? `${nozzleType} \u00b7 ${nozzleDiam}mm`
      : nozzleType || nozzleDiam || t('quick_status.unknown');

    // Storage (SD card or USB depending on model)
    const sdInserted = data.sdcard;
    const useUsb = _isUsb();
    const sdStr = sdInserted
      ? (useUsb ? t('quick_status.usb_inserted', 'Connected') : t('quick_status.sd_inserted'))
      : (useUsb ? t('quick_status.usb_none', 'Not connected') : t('quick_status.sd_none'));
    const sdColor = sdInserted ? 'var(--accent-green)' : 'var(--text-muted)';

    // Light
    const lightReport = data.lights_report;
    const chamber = lightReport?.find(l => l.node === 'chamber_light');
    const lightOn = chamber?.mode === 'on';
    const lightStr = lightOn ? t('quick_status.light_on') : t('quick_status.light_off');
    const lightColor = lightOn ? 'var(--accent-yellow)' : 'var(--text-muted)';

    // Speed
    const spdLvl = data.spd_lvl || 2;
    const speedStr = t(SPEED_LABELS[spdLvl] || 'speed.standard');

    // Real-time error (from MQTT)
    const errCode = data.print_error || 0;
    const cachedErr = _cachedErrors[printerId];
    let hasError = errCode > 0 || !!cachedErr;
    let errStr, errColor;
    if (hasError) {
      errStr = `<a href="#errors" class="qs-link" style="color:var(--accent-red)">${t('quick_status.has_errors')}</a>`;
      errColor = '';
    } else {
      errStr = t('quick_status.no_error');
      errColor = 'var(--accent-green)';
    }

    // Protection alerts
    const cachedAlerts = _cachedAlerts[printerId];
    let guardStr, guardColor;
    if (cachedAlerts && cachedAlerts.length > 0) {
      guardStr = `<a href="#protection" class="qs-link" style="color:var(--accent-orange)">${cachedAlerts.length} ${t('quick_status.active')}</a>`;
      guardColor = '';
    } else {
      guardStr = t('quick_status.no_error');
      guardColor = 'var(--accent-green)';
    }

    // Storage row with format button
    const storageIcon = useUsb ? 'usb' : 'sd';
    const storageLabel = useUsb ? t('quick_status.usb_storage', 'USB') : t('quick_status.sd_card');
    const formatTitle = useUsb ? t('controls.format_usb', 'Format USB') : t('controls.format_sd', 'Format SD');
    const storageItem = `<div class="qs-item">
      <div class="qs-icon">${ICONS[storageIcon]}</div>
      <div class="qs-text">
        <span class="qs-label">${storageLabel}</span>
        <span class="qs-value" style="color:${sdColor}">${sdStr}</span>
      </div>
      <button class="qs-action-btn" onclick="event.stopPropagation();formatStorage('${printerId}')" title="${formatTitle}">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
      </button>
    </div>`;

    // Detect printer type for appropriate status items
    const _meta = window.printerState?.getActivePrinterMeta?.() || {};
    const isMoonraker = _meta.type === 'moonraker';

    const isFirstRender = !container._lastHtml;

    if (isMoonraker) {
      // Moonraker/Klipper status — different info than Bambu
      const bedTemp = data.bed_temper ? `${data.bed_temper}°C` : '--';
      const bedTarget = data.bed_target_temper ? ` → ${data.bed_target_temper}°C` : '';
      const bedColor = data.bed_temper > 50 ? 'var(--accent-orange)' : 'var(--text-muted)';
      const activeExt = data._active_extruder ? data._active_extruder.replace('extruder', 'T') : '--';
      const extTemp = data.nozzle_temper ? `${data.nozzle_temper}°C` : '--';
      const extColor = data.nozzle_temper > 180 ? 'var(--accent-red)' : data.nozzle_temper > 50 ? 'var(--accent-orange)' : 'var(--text-muted)';
      const speedPct = data.spd_mag ? `${data.spd_mag}%` : '100%';
      const fanPct = data.cooling_fan_speed != null ? `${data.cooling_fan_speed}%` : '--';
      const fanColor = data.cooling_fan_speed > 0 ? 'var(--accent-blue)' : 'var(--text-muted)';
      const posStr = data._position ? `X:${data._position.x} Y:${data._position.y} Z:${data._position.z}` : '--';

      container.innerHTML = `<div class="qs-grid${isFirstRender ? ' stagger-in' : ''}">
        ${item('nozzle', activeExt + ' Extruder', extTemp, extColor)}
        ${item('nozzle', 'Bed', bedTemp + bedTarget, bedColor)}
        ${item('speed', t('quick_status.speed'), speedPct, '')}
        ${item('light', 'Fan', fanPct, fanColor)}
        ${item('error', t('quick_status.error'), errStr, errColor, 'qs-error-value')}
        ${item('guard', t('protection.title'), guardStr, guardColor, 'qs-guard-value')}
      </div>`;
    } else {
      // Bambu Lab status
      container.innerHTML = `<div class="qs-grid${isFirstRender ? ' stagger-in' : ''}">
        ${item('wifi', t('quick_status.wifi'), wifiSig, wifiCol)}
        ${item('nozzle', t('quick_status.nozzle'), nozzleStr, '')}
        ${storageItem}
        ${item('light', t('quick_status.light'), lightStr, lightColor)}
        ${item('speed', t('quick_status.speed'), speedStr, '')}
        ${item('error', t('quick_status.error'), errStr, errColor, 'qs-error-value')}
        ${item('guard', t('protection.title'), guardStr, guardColor, 'qs-guard-value')}
      </div>`;
    }
    // Apply stagger delay indices for entrance animation
    if (isFirstRender) {
      const items = container.querySelectorAll('.qs-item');
      items.forEach((el, i) => el.style.setProperty('--i', i));
    }
    container._lastHtml = true;
  };
})();
