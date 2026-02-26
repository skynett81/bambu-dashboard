// Controls Panel - Dynamic model-based controls
(function() {
  let lightState = 'on';
  let _lastData = null;

  function fanPercent(raw) {
    return Math.round((parseInt(raw) || 0) / 255 * 100);
  }

  window.updateControls = function(data) {
    _lastData = data;
    const container = document.getElementById('controls-content');
    if (!container) return;

    const meta = window.printerState.getActivePrinterMeta();
    const caps = typeof getCapabilities === 'function' ? getCapabilities(meta?.model) : {};
    const state = data.gcode_state || 'IDLE';

    // Track light state
    if (data.lights_report) {
      const chamber = data.lights_report.find(l => l.node === 'chamber_light');
      if (chamber) lightState = chamber.mode;
    }

    let html = '';

    // Section 1: Print controls
    html += `<div class="ctrl-section">
      <div class="ctrl-section-title">${t('controls.print_control')}</div>
      <div class="controls-grid">`;

    if (state === 'RUNNING') {
      html += `<button class="ctrl-btn ctrl-pause" onclick="sendCommand('pause')">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
        ${t('controls.pause')}
      </button>`;
    } else if (state === 'PAUSE') {
      html += `<button class="ctrl-btn ctrl-resume" onclick="sendCommand('resume')">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><polygon points="5,3 19,12 5,21"/></svg>
        ${t('controls.resume')}
      </button>`;
    }

    html += `<button class="ctrl-btn ctrl-stop" ${state === 'IDLE' || state === 'FINISH' ? 'disabled' : ''} onclick="confirmStop()">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><rect x="4" y="4" width="16" height="16" rx="2"/></svg>
      ${t('controls.stop')}
    </button>`;

    html += `</div></div>`;

    // Section 2: Fan sliders
    html += `<div class="ctrl-section">
      <div class="ctrl-section-title">${t('controls.fans')}</div>
      <div class="ctrl-fan-list">`;

    // Part cooling fan - always shown
    const partPct = fanPercent(data.cooling_fan_speed);
    html += fanSlider('part', t('controls.fan_part'), partPct, 'P1');

    // Aux fan - model dependent
    if (caps.auxFan) {
      const auxPct = fanPercent(data.big_fan1_speed);
      html += fanSlider('aux', t('controls.fan_aux'), auxPct, 'P2');
    }

    // Chamber fan - model dependent
    if (caps.chamberFan) {
      const chamberPct = fanPercent(data.big_fan2_speed);
      html += fanSlider('chamber', t('controls.fan_chamber'), chamberPct, 'P3');
    }

    html += `</div></div>`;

    // Section 3: Temperature controls
    html += `<div class="ctrl-section">
      <div class="ctrl-section-title">${t('controls.temperature')}</div>
      <div class="ctrl-temp-list">`;

    const nozzleTemp = Math.round(data.nozzle_temper || 0);
    const nozzleTarget = Math.round(data.nozzle_target_temper || 0);
    html += tempRow('nozzle', t('controls.temp_nozzle'), nozzleTemp, nozzleTarget, 'M104');

    const bedTemp = Math.round(data.bed_temper || 0);
    const bedTarget = Math.round(data.bed_target_temper || 0);
    html += tempRow('bed', t('controls.temp_bed'), bedTemp, bedTarget, 'M140');

    if (caps.chamberHeat) {
      const chamberTemp = Math.round(data.chamber_temper || 0);
      const chamberTarget = Math.round(data.chamber_target_temper || 0);
      html += tempRow('chamber', t('controls.temp_chamber'), chamberTemp, chamberTarget, 'M141');
    }

    html += `</div></div>`;

    // Section 4: Tools
    html += `<div class="ctrl-section">
      <div class="ctrl-section-title">${t('controls.tools')}</div>
      <div class="controls-grid">`;

    if (caps.light) {
      html += `<button class="ctrl-btn ctrl-light ${lightState === 'on' ? 'ctrl-light-on' : ''}" onclick="toggleLight()">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2a7 7 0 0 1 4 12.7V17a2 2 0 0 1-2 2h-4a2 2 0 0 1-2-2v-2.3A7 7 0 0 1 12 2z"/><line x1="10" y1="22" x2="14" y2="22"/></svg>
        ${t('controls.light')}
      </button>`;
    }

    html += `<button class="ctrl-btn" onclick="sendGcode('G28')">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>
      ${t('controls.home')}
    </button>`;

    html += `<button class="ctrl-btn" onclick="sendGcode('G29')">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 20h20"/><path d="M5 20V8l7-5 7 5v12"/><rect x="9" y="12" width="6" height="8"/></svg>
      ${t('controls.calibration')}
    </button>`;

    html += `</div></div>`;

    // Section 5: G-code console
    html += `<div class="ctrl-section">
      <div class="ctrl-section-title">${t('controls.gcode_title')}</div>
      <div class="ctrl-gcode">
        <input class="form-input ctrl-gcode-input" id="gcode-input" placeholder="${t('controls.gcode_placeholder')}" onkeydown="if(event.key==='Enter')sendGcodeInput()">
        <button class="form-btn form-btn-sm" onclick="sendGcodeInput()">${t('controls.gcode_send')}</button>
      </div>
    </div>`;

    container.innerHTML = html;
  };

  function fanSlider(id, label, pct, fanParam) {
    return `<div class="ctrl-fan-row">
      <span class="ctrl-fan-label">${label}</span>
      <input type="range" class="ctrl-slider" id="fan-slider-${id}" min="0" max="100" value="${pct}"
             onchange="setFanSpeed('${fanParam}', this.value)" oninput="document.getElementById('fan-val-${id}').textContent=this.value+'%'">
      <span class="ctrl-fan-value" id="fan-val-${id}">${pct}%</span>
    </div>`;
  }

  function tempRow(id, label, current, target, gcode) {
    return `<div class="ctrl-temp-row">
      <span class="ctrl-temp-label">${label}</span>
      <span class="ctrl-temp-current">${current}°C</span>
      <span class="ctrl-temp-arrow">→</span>
      <input type="number" class="form-input ctrl-temp-input" id="temp-input-${id}" value="${target}" min="0" max="${gcode === 'M104' ? 350 : gcode === 'M140' ? 120 : 65}" step="5">
      <button class="form-btn form-btn-sm" onclick="setTemp('${gcode}', document.getElementById('temp-input-${id}').value)">${t('controls.set')}</button>
    </div>`;
  }

  window.setFanSpeed = function(fanParam, pct) {
    const sVal = Math.round((parseInt(pct) / 100) * 255);
    sendCommand('gcode', { gcode: `M106 ${fanParam} S${sVal}` });
  };

  window.setTemp = function(gcode, temp) {
    const val = parseInt(temp);
    if (isNaN(val) || val < 0) return;
    sendCommand('gcode', { gcode: `${gcode} S${val}` });
  };

  window.sendGcode = function(gcode) {
    sendCommand('gcode', { gcode });
  };

  window.sendGcodeInput = function() {
    const input = document.getElementById('gcode-input');
    if (!input || !input.value.trim()) return;
    sendCommand('gcode', { gcode: input.value.trim() });
    input.value = '';
  };

  window.confirmStop = function() {
    if (confirm(t('controls.confirm_stop'))) {
      sendCommand('stop');
    }
  };

  window.toggleLight = function() {
    const newMode = lightState === 'on' ? 'off' : 'on';
    sendCommand('light', { mode: newMode, node: 'chamber_light' });
  };
})();
