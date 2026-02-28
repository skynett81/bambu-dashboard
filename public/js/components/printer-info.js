// Printer Info Card - model, WiFi, AI features, timelapse, firmware
(function() {
  let _lastData = null;

  function renderPrinterInfo(container, data) {
    const meta = window.printerState.getActivePrinterMeta();
    const state = data;
    const info = state._info || {};

    const timelapse = state.ipcam?.timelapse === 'enable';
    const firstLayer = state.xcam?.first_layer_inspector;
    const spaghetti = state.xcam?.spaghetti_detector;
    const firmware = info.module?.find(m => m.name === 'ota')?.sw_ver || state.upgrade_state?.ota_new_version_number || '';
    const nozzleType = state.nozzle_type || '';
    const nozzleDiameter = state.nozzle_diameter ? `${state.nozzle_diameter}mm` : '';
    const hasAms = !!(state.ams?.ams?.length > 0);

    let html = '<div class="info-grid">';

    html += `
      <div class="info-item">
        <span class="info-label">${t('printer_info.model')}</span>
        <span class="info-value">${meta.model || state.machine_name || t('printer_info.unknown')}</span>
      </div>
      <div class="info-item">
        <span class="info-label">${t('printer_info.wifi')}</span>
        <span class="info-value">${state.wifi_signal || '--'}</span>
      </div>`;

    if (firmware) {
      html += `
        <div class="info-item">
          <span class="info-label">${t('printer_info.firmware')}</span>
          <span class="info-value">${firmware}</span>
        </div>`;
    }

    if (nozzleType || nozzleDiameter) {
      html += `
        <div class="info-item">
          <span class="info-label">${t('printer_info.nozzle')}</span>
          <span class="info-value">${[nozzleType, nozzleDiameter].filter(Boolean).join(' ')}</span>
        </div>`;
    }

    html += `
      <div class="info-item">
        <span class="info-label">${t('printer_info.ams_label')}</span>
        <span class="info-value ${hasAms ? 'text-green' : 'text-muted'}">${hasAms ? t('printer_info.connected') : t('printer_info.not_connected')}</span>
      </div>
      <div class="info-item">
        <span class="info-label">${t('printer_info.sd_card')}</span>
        <div class="sd-card-visual">
          <div class="sd-card-icon">
            <svg viewBox="0 0 24 30" fill="none">
              <path d="M4 2h10l6 6v20a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z" fill="${state.sdcard ? '#1279ff' : theme.getCSSVar('--bg-tertiary')}" opacity="${state.sdcard ? '0.2' : '0.4'}" stroke="${state.sdcard ? '#1279ff' : theme.getCSSVar('--text-muted')}" stroke-width="1.5"/>
              <path d="M14 2v6h6" fill="none" stroke="${state.sdcard ? '#1279ff' : theme.getCSSVar('--text-muted')}" stroke-width="1.5"/>
              ${state.sdcard ? '<rect x="7" y="12" width="2" height="6" rx="0.5" fill="#1279ff" opacity="0.6"/><rect x="11" y="14" width="2" height="4" rx="0.5" fill="#1279ff" opacity="0.6"/><rect x="15" y="11" width="2" height="7" rx="0.5" fill="#1279ff" opacity="0.6"/>' : ''}
            </svg>
          </div>
          <span class="sd-card-status ${state.sdcard ? 'sd-inserted' : 'sd-missing'}">
            <span class="sd-dot ${state.sdcard ? 'active' : 'inactive'}"></span>${state.sdcard ? t('printer_info.connected') : t('printer_info.not_connected')}
          </span>
        </div>
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
        const date = fw.timestamp ? new Date(fw.timestamp).toLocaleDateString() : '--';
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
