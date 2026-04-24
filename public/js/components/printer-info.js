// Printer Info Card - model, WiFi, AI features, timelapse, firmware
(function() {
  let _lastData = null;

  function renderPrinterInfo(container, data) {
    const meta = window.printerState.getActivePrinterMeta();
    const state = data;
    const info = state._info || {};

    const pt = typeof getPrinterType === 'function' ? getPrinterType(meta, state) : {};
    const timelapse = state.ipcam?.timelapse === 'enable' || state._sm_timelapse?.active;
    const firstLayer = state.xcam?.first_layer_inspector;
    const spaghetti = state.xcam?.spaghetti_detector || state._sm_defect?.enabled;
    const firmware = info.module?.find(m => m.name === 'ota')?.sw_ver || state.upgrade_state?.ota_new_version_number || state._mcu?.mcuVersion || '';
    const nozzleType = state.nozzle_type || state._nozzle_type || '';
    const nozzleDiameter = state.nozzle_diameter || state._nozzle_diameter ? `${state.nozzle_diameter || state._nozzle_diameter}mm` : '';
    const hasAms = !!(state.ams?.ams?.length > 0);

    let html = '<div class="info-grid">';

    const ipAddr = meta.ip || '';
    const serialNum = meta.serial || '';

    html += `
      <div class="info-item">
        <span class="info-label">${t('printer_info.model')}</span>
        <span class="info-value">${meta.model || state.machine_name || t('printer_info.unknown')}</span>
      </div>
      <div class="info-item">
        <span class="info-label">${t('printer_info.wifi')}</span>
        <span class="info-value">${state.wifi_signal || '--'}</span>
      </div>`;

    if (ipAddr) {
      html += `
        <div class="info-item">
          <span class="info-label">IP</span>
          <span class="info-value"><span class="copy-value" onclick="copyToClipboard('${ipAddr}', 'IP')" title="Click to copy" data-bs-toggle="tooltip">${ipAddr}</span></span>
        </div>`;
    }

    if (serialNum) {
      html += `
        <div class="info-item">
          <span class="info-label">Serial</span>
          <span class="info-value"><span class="copy-value" onclick="copyToClipboard('${serialNum}', 'Serial')" title="Click to copy" data-bs-toggle="tooltip">${serialNum}</span></span>
        </div>`;
    }

    if (firmware) {
      html += `
        <div class="info-item">
          <span class="info-label">${t('printer_info.firmware')}</span>
          <span class="info-value"><span class="copy-value" onclick="copyToClipboard('${firmware}', 'Firmware')" title="Click to copy" data-bs-toggle="tooltip">${firmware}</span></span>
        </div>`;
    }

    if (nozzleType || nozzleDiameter) {
      html += `
        <div class="info-item">
          <span class="info-label">${t('printer_info.nozzle')}</span>
          <span class="info-value">${[nozzleType, nozzleDiameter].filter(Boolean).join(' ')}</span>
        </div>`;
    }

    // Filament system (type-aware). Snapmaker's own docs refer to the U1's
    // four swappable heads as "toolheads" (not "toolchanger"), so match
    // vendor terminology on the printer info card.
    const modelStr = (meta.model || '').toLowerCase();
    const isU1 = state._isSnapmakerU1 || /snapmaker.*u1/.test(modelStr);
    const filamentLabel = pt.hasAms ? 'AMS' : pt.hasErcf ? 'ERCF' : pt.hasAfc ? 'AFC' : pt.hasMmu ? 'MMU' : isU1 ? 'Toolheads' : pt.hasMultiExtruder ? 'Multi-Extruder' : 'Filament';
    const filamentConnected = pt.hasAms || pt.hasErcf || pt.hasAfc || pt.hasMmu || isU1 || pt.hasMultiExtruder;

    html += `
      <div class="info-item">
        <span class="info-label">${filamentLabel}</span>
        <span class="info-value ${filamentConnected ? 'text-green' : 'text-muted'}">${filamentConnected ? t('printer_info.connected') : t('printer_info.not_connected')}</span>
      </div>
      <div class="info-item">
        ${(() => {
          const isUsb = ['P2S', 'P2S Combo', 'H2D'].includes(meta.model);
          const label = isUsb ? t('printer_info.usb_storage', 'USB') : t('printer_info.sd_card');
          const accentColor = state.sdcard ? '#1279ff' : theme.getCSSVar('--text-muted');
          const fillColor = state.sdcard ? '#1279ff' : theme.getCSSVar('--bg-tertiary');
          const fillOpacity = state.sdcard ? '0.2' : '0.4';
          const icon = isUsb
            ? `<svg viewBox="0 0 24 30" fill="none">
                <rect x="7" y="2" width="10" height="20" rx="2" fill="${fillColor}" opacity="${fillOpacity}" stroke="${accentColor}" stroke-width="1.5"/>
                <rect x="9" y="0" width="2.5" height="4" rx="0.5" fill="${accentColor}" opacity="0.6"/>
                <rect x="12.5" y="0" width="2.5" height="4" rx="0.5" fill="${accentColor}" opacity="0.6"/>
                ${state.sdcard ? '<rect x="10" y="10" width="4" height="6" rx="1" fill="#1279ff" opacity="0.5"/>' : ''}
              </svg>`
            : `<svg viewBox="0 0 24 30" fill="none">
                <path d="M4 2h10l6 6v20a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z" fill="${fillColor}" opacity="${fillOpacity}" stroke="${accentColor}" stroke-width="1.5"/>
                <path d="M14 2v6h6" fill="none" stroke="${accentColor}" stroke-width="1.5"/>
                ${state.sdcard ? '<rect x="7" y="12" width="2" height="6" rx="0.5" fill="#1279ff" opacity="0.6"/><rect x="11" y="14" width="2" height="4" rx="0.5" fill="#1279ff" opacity="0.6"/><rect x="15" y="11" width="2" height="7" rx="0.5" fill="#1279ff" opacity="0.6"/>' : ''}
              </svg>`;
          return `<span class="info-label">${label}</span>
        <div class="sd-card-visual">
          <div class="sd-card-icon">${icon}</div>
          <span class="sd-card-status ${state.sdcard ? 'sd-inserted' : 'sd-missing'}">
            <span class="sd-dot ${state.sdcard ? 'active' : 'inactive'}"></span>${state.sdcard ? t('printer_info.connected') : t('printer_info.not_connected')}
          </span>
        </div>`;
        })()}
      </div>
      <div class="info-item">
        <span class="info-label">${t('printer_info.resolution')}</span>
        <span class="info-value">${state.ipcam?.resolution || '--'}</span>
      </div>
      <div class="info-item clickable" onclick="toggleTimelapse()">
        <span class="info-label">${t('printer_info.timelapse')}</span>
        <span class="info-value ${timelapse ? 'text-green' : 'text-muted'}">${timelapse ? t('printer_info.active') : t('printer_info.off')}</span>
      </div>
      <div class="info-item">
        <span class="info-label">${t('printer_info.layer_inspect')}</span>
        <span class="info-value ${firstLayer ? 'text-green' : 'text-muted'}">${firstLayer ? t('printer_info.active') : t('printer_info.off')}</span>
      </div>
      <div class="info-item">
        <span class="info-label">${t('printer_info.spaghetti_ai')}</span>
        <span class="info-value ${spaghetti ? 'text-green' : 'text-muted'}">${spaghetti ? t('printer_info.active') : t('printer_info.off')}</span>
      </div>`;

    // Build volume (if available)
    const vol = state._buildVolume || state._printerProfile?.volume;
    if (vol) {
      const w = vol.width || vol.x || 0, d = vol.depth || vol.y || 0, h = vol.height || vol.z || 0;
      if (w) html += `<div class="info-item"><span class="info-label">Build Volume</span><span class="info-value">${w}×${d}×${h}mm</span></div>`;
    }

    // Input shaper (Klipper)
    if (state._input_shaper) {
      const is = state._input_shaper;
      html += `<div class="info-item"><span class="info-label">Input Shaper</span><span class="info-value">X:${is.shaperTypeX || '?'} ${is.shaperFreqX?.toFixed(0) || '?'}Hz · Y:${is.shaperTypeY || '?'} ${is.shaperFreqY?.toFixed(0) || '?'}Hz</span></div>`;
    }

    // Pressure advance (Klipper)
    if (state._pressure_advance !== undefined) {
      html += `<div class="info-item"><span class="info-label">Pressure Advance</span><span class="info-value">${state._pressure_advance}</span></div>`;
    }

    // MCU firmware (Klipper)
    if (state._mcu?.mcuVersion) {
      html += `<div class="info-item"><span class="info-label">MCU Firmware</span><span class="info-value" style="font-size:0.65rem">${state._mcu.mcuVersion.slice(0, 30)}</span></div>`;
    }

    // System temps (MCU/RPi)
    if (state._system_temps) {
      for (const [key, val] of Object.entries(state._system_temps)) {
        const label = key === 'mcu_temp' ? 'MCU Temp' : key === 'raspberry_pi' ? 'Host CPU' : key;
        const color = val.temp > 70 ? 'text-red' : val.temp > 55 ? '' : 'text-green';
        html += `<div class="info-item"><span class="info-label">${label}</span><span class="info-value ${color}">${val.temp}°C</span></div>`;
      }
    }

    // Installed modules (SACP)
    if (state._modules?.length) {
      html += `<div class="info-item"><span class="info-label">Modules</span><span class="info-value" style="font-size:0.65rem">${state._modules.map(m => m.name).join(', ')}</span></div>`;
    }

    // Detected brand (Moonraker)
    if (state._detected_brand) {
      html += `<div class="info-item"><span class="info-label">Detected Brand</span><span class="info-value">${state._detected_brand}</span></div>`;
    }

    // Extruder count
    if (state._extruderCount > 1) {
      html += `<div class="info-item"><span class="info-label">Extruders</span><span class="info-value">${state._extruderCount}</span></div>`;
    }

    html += '</div>';

    // Firmware history toggle
    if (firmware) {
      html += `<div class="firmware-toggle" onclick="toggleFirmwareHistory()">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
        ${t('printer_info.firmware_history')}
      </div>`;
      html += `<div id="firmware-history-container" class="firmware-history" style="display:none"></div>`;
    }

    container.innerHTML = html;
  }

  window.updatePrinterInfo = function(data) {
    _lastData = data;
    const container = document.getElementById('printer-info');
    if (container) renderPrinterInfo(container, data);
    // Also update settings section if open
    const settingsContainer = document.getElementById('settings-printer-info');
    if (settingsContainer) renderPrinterInfo(settingsContainer, data);
  };

  window.renderPrinterInfoSection = function(container) {
    if (_lastData) renderPrinterInfo(container, _lastData);
  };

  window.toggleFirmwareHistory = async function() {
    const container = document.getElementById('firmware-history-container');
    if (!container) return;

    if (container.style.display !== 'none') {
      container.style.display = 'none';
      return;
    }

    container.style.display = '';
    const printerId = window.printerState.getActivePrinterId();
    if (!printerId) return;

    try {
      const res = await fetch(`/api/firmware?printer_id=${printerId}`);
      const history = await res.json();

      if (!history || history.length === 0) {
        container.innerHTML = `<p class="text-muted" style="font-size:0.8rem">${t('printer_info.no_firmware_history')}</p>`;
        return;
      }

      let html = `<table class="data-table"><thead><tr><th>${t('printer_info.fw_module')}</th><th>${t('printer_info.fw_version')}</th><th>${t('printer_info.fw_hw')}</th><th>${t('history.date')}</th></tr></thead><tbody>`;
      for (const fw of history) {
        const date = fw.timestamp ? new Date(fw.timestamp).toLocaleDateString(window.i18n?.getLocale?.() || 'nb') : '--';
        html += `<tr><td>${esc(fw.module)}</td><td>${esc(fw.sw_ver)}</td><td>${esc(fw.hw_ver) || '--'}</td><td>${date}</td></tr>`;
      }
      html += `</tbody></table>`;
      container.innerHTML = html;
    } catch (_) {
      container.innerHTML = `<p class="text-muted" style="font-size:0.8rem">${t('printer_info.firmware_load_failed')}</p>`;
    }
  };

  window.toggleTimelapse = function() {
    const state = window.printerState.getActivePrinterState();
    const printData = state.print || state;
    const current = printData.ipcam?.timelapse === 'enable';
    const gcode = current ? 'M981 S0' : 'M981 S1';
    sendCommand('gcode', { gcode });
  };
})();
