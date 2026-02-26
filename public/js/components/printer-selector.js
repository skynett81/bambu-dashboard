// Printer Selector - tabs in header with mini-status
(function() {
  function stateShort(state) {
    const key = { IDLE: 'idle', RUNNING: 'running', PAUSE: 'pause', FINISH: 'finish', FAILED: 'failed', PREPARE: 'prepare', HEATING: 'heating' }[state];
    return key ? t(`state_short.${key}`) : state;
  }

  window.updatePrinterSelector = function() {
    const container = document.getElementById('printer-selector');
    if (!container) return;

    const state = window.printerState;
    const ids = state.getPrinterIds();
    const activeId = state.getActivePrinterId();

    if (ids.length === 0) {
      container.innerHTML = '';
      return;
    }

    container.innerHTML = ids.map(id => {
      const meta = state._printerMeta[id] || {};
      const ps = state._printers[id]?.print || state._printers[id] || {};
      const isActive = id === activeId;
      const dot = getStatusDot(ps);
      const mini = getMiniStatus(ps);

      return `<button class="printer-tab ${isActive ? 'active' : ''}"
                      data-printer-id="${id}"
                      onclick="selectPrinter('${id}')">
                ${dot}
                <span class="printer-tab-info">
                  <span class="printer-tab-name">${meta.name || id}</span>
                  ${mini}
                </span>
              </button>`;
    }).join('');
  };

  function getMiniStatus(ps) {
    const gcodeState = ps.gcode_state || 'IDLE';
    const percent = ps.mc_percent || 0;
    const remaining = ps.mc_remaining_time || 0;

    if (gcodeState === 'RUNNING' || gcodeState === 'PAUSE') {
      let timeStr = '';
      if (remaining > 0) {
        const h = Math.floor(remaining / 60);
        const m = remaining % 60;
        timeStr = h > 0 ? ` \u00b7 ${h}${t('time.h')}${m}${t('time.m')}` : ` \u00b7 ${m}${t('time.m')}`;
      }
      return `<span class="printer-tab-status">${percent}%${timeStr}</span>`;
    }

    return `<span class="printer-tab-status">${stateShort(gcodeState)}</span>`;
  }

  function getStatusDot(printerState) {
    const gcodeState = printerState.gcode_state || 'IDLE';
    let color;
    switch(gcodeState) {
      case 'RUNNING': color = 'var(--accent-green)'; break;
      case 'PAUSE': color = 'var(--accent-orange)'; break;
      case 'FAILED': color = 'var(--accent-red)'; break;
      case 'PREPARE': case 'HEATING': color = 'var(--accent-blue)'; break;
      case 'FINISH': color = 'var(--accent-green)'; break;
      default: color = 'var(--text-muted)';
    }
    return `<span class="printer-status-dot" style="background:${color}"></span>`;
  }

  window.selectPrinter = function(id) {
    const state = window.printerState;
    state.setActivePrinter(id);

    // Reset sparkline buffers for new printer
    if (typeof resetSparklineBuffers === 'function') resetSparklineBuffers();

    // Update dashboard for new printer
    const activeState = state.getActivePrinterState();
    const printData = activeState.print || activeState;
    if (typeof updateTemperatureGauges === 'function') updateTemperatureGauges(printData);
    if (typeof updatePrintProgress === 'function') updatePrintProgress(printData);
    if (typeof updateAmsPanel === 'function') updateAmsPanel(printData);
    if (typeof updateControls === 'function') updateControls(printData);
    if (typeof updateSpeedControl === 'function') updateSpeedControl(printData);
    if (typeof updateFanDisplay === 'function') updateFanDisplay(printData);
    if (typeof updateActiveFilament === 'function') updateActiveFilament(printData);
    if (typeof updatePrinterInfo === 'function') updatePrinterInfo(printData);
    if (typeof updateStatusBar === 'function') updateStatusBar(printData);

    // Update selector appearance
    window.updatePrinterSelector();

    // Update camera to new printer's port
    if (typeof switchCamera === 'function') {
      const meta = state.getActivePrinterMeta();
      switchCamera(meta.cameraPort);
    }

    // Reload tab data for new printer
    if (typeof reloadActiveTab === 'function') reloadActiveTab();

    // Update page title
    const meta = state.getActivePrinterMeta();
    document.title = `${meta.name || id} - Bambu Dashboard`;
  };
})();
