// Controls Panel - Comprehensive printer controls
(function() {
  let lightState = 'on';
  let _lastData = null;
  let _rendered = false;

  function fanPercent(raw) {
    return Math.round((parseInt(raw) || 0) / 255 * 100);
  }

  function speedLevelKey(lvl) {
    return { 1: 'speed.silent', 2: 'speed.standard', 3: 'speed.sport', 4: 'speed.ludicrous' }[lvl] || 'speed.standard';
  }

  // Full render — only called once when panel opens
  function renderControls(container, data) {
    const meta = window.printerState.getActivePrinterMeta();
    const caps = typeof getCapabilities === 'function' ? getCapabilities(meta?.model) : {};
    const state = data.gcode_state || 'IDLE';
    const isPrinting = state === 'RUNNING' || state === 'PAUSE';

    if (data.lights_report) {
      const chamber = data.lights_report.find(l => l.node === 'chamber_light');
      if (chamber) lightState = chamber.mode;
    }

    let html = '<div class="ctrl-layout">';

    // ===== CARD: Print Control =====
    html += `<div class="ctrl-card ctrl-area-print">
      <div class="ctrl-card-title">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5,3 19,12 5,21"/></svg>
        ${t('controls.print_control')}
      </div>
      <div class="controls-grid" id="ctrl-print-grid">${printControlButtons(state, isPrinting)}</div>
    </div>`;

    // ===== CARD: Objects (only during print) =====
    if (isPrinting && data.obj_list && data.obj_list.length > 0) {
      html += `<div class="ctrl-card ctrl-area-objects">
        <div class="ctrl-card-title">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>
          ${t('controls.objects_title')}
          <span class="ctrl-card-badge">${data.obj_list.length} ${t('controls.objects_title').toLowerCase()}</span>
        </div>
        <div class="ctrl-objects-list" id="ctrl-objects-list">`;
      for (const obj of data.obj_list) {
        const isSkipped = obj.skipped || false;
        const name = obj.name || `Object ${obj.obj_id ?? '?'}`;
        html += `<div class="ctrl-object-row ${isSkipped ? 'ctrl-object-skipped' : ''}">
          <span class="ctrl-object-name">${esc(name)}</span>
          ${isSkipped
            ? `<span class="ctrl-object-status">${t('controls.object_skipped')}</span>`
            : `<button class="form-btn form-btn-sm ctrl-object-skip-btn" onclick="skipObject(${obj.obj_id})">${t('controls.skip_object')}</button>`
          }
        </div>`;
      }
      html += `</div></div>`;
    }

    // ===== CARD: Speed Profile =====
    const spdLvl = data.spd_lvl || 2;
    const spdMag = data.spd_mag || 100;
    const printerName = meta?.name || '';
    html += `<div class="ctrl-card ctrl-area-speed">
      <div class="ctrl-card-title">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
        ${t('controls.speed_profile')}
        ${printerName ? `<span class="ctrl-card-printer-tag" id="ctrl-speed-printer">${esc(printerName)}</span>` : ''}
      </div>
      <div class="ctrl-speed-slider-row">
        <input type="range" class="ctrl-slider ctrl-speed-range" id="ctrl-speed-slider" min="50" max="166" value="${spdMag}"
               oninput="updateSpeedPreview(this.value)" onchange="applySpeedFromSlider(this.value)">
        <span class="ctrl-speed-value" id="ctrl-speed-value">${spdMag}%</span>
      </div>
      <div class="ctrl-speed-grid">
        <button class="ctrl-speed-btn ${spdLvl === 1 ? 'active' : ''}" data-speed="1" onclick="applySpeedPreset(1)">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 18h4l3-8 3 8h4l5-16"/></svg>
          ${t('speed.silent')}
        </button>
        <button class="ctrl-speed-btn ${spdLvl === 2 ? 'active' : ''}" data-speed="2" onclick="applySpeedPreset(2)">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
          ${t('speed.standard')}
        </button>
        <button class="ctrl-speed-btn ${spdLvl === 3 ? 'active' : ''}" data-speed="3" onclick="applySpeedPreset(3)">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
          ${t('speed.sport')}
        </button>
        <button class="ctrl-speed-btn ${spdLvl === 4 ? 'active' : ''}" data-speed="4" onclick="applySpeedPreset(4)">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
          ${t('speed.ludicrous')}
        </button>
      </div>
    </div>`;

    // ===== CARD: Temperature =====
    html += `<div class="ctrl-card ctrl-area-temp">
      <div class="ctrl-card-title">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z"/></svg>
        ${t('controls.temperature')}
      </div>
      <div class="ctrl-temp-list">`;

    const nozzleTemp = Math.round(data.nozzle_temper || 0);
    const nozzleTarget = Math.round(data.nozzle_target_temper || 0);
    const maxNozzle = caps.maxNozzleTemp || 300;
    html += tempRow('nozzle', t('controls.temp_nozzle'), nozzleTemp, nozzleTarget, 'M104', maxNozzle);

    if (caps.dualNozzle) {
      const nozzle2Temp = Math.round(data.nozzle_temper_2 || 0);
      const nozzle2Target = Math.round(data.nozzle_target_temper_2 || 0);
      html += tempRow('nozzle2', t('controls.temp_nozzle') + ' 2', nozzle2Temp, nozzle2Target, 'M104', maxNozzle);
    }

    const bedTemp = Math.round(data.bed_temper || 0);
    const bedTarget = Math.round(data.bed_target_temper || 0);
    const maxBed = caps.maxBedTemp || 120;
    html += tempRow('bed', t('controls.temp_bed'), bedTemp, bedTarget, 'M140', maxBed);

    if (caps.chamberHeat) {
      const chamberTemp = Math.round(data.chamber_temper || 0);
      const chamberTarget = Math.round(data.chamber_target_temper || 0);
      const maxChamber = caps.maxChamberTemp || 60;
      html += tempRow('chamber', t('controls.temp_chamber'), chamberTemp, chamberTarget, 'M141', maxChamber);
    }

    html += `</div>
      <div class="ctrl-presets">
        <span class="ctrl-preset-label">${t('controls.presets')}</span>
        <button class="ctrl-preset-btn" onclick="applyTempPreset(220, 60)" title="PLA">PLA</button>
        <button class="ctrl-preset-btn" onclick="applyTempPreset(250, 80)" title="PETG">PETG</button>
        <button class="ctrl-preset-btn" onclick="applyTempPreset(260, 100)" title="ABS">ABS</button>
        <button class="ctrl-preset-btn" onclick="applyTempPreset(270, 100)" title="ASA">ASA</button>
        <button class="ctrl-preset-btn" onclick="applyTempPreset(230, 60)" title="TPU">TPU</button>
        <button class="ctrl-preset-btn ctrl-preset-off" onclick="applyTempPreset(0, 0)" title="${t('controls.cooldown')}">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          ${t('controls.cooldown')}
        </button>
      </div>
    </div>`;

    // ===== CARD: Fans =====
    html += `<div class="ctrl-card ctrl-area-fans">
      <div class="ctrl-card-title">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 12c-1.5-3-4.5-4-7-3s-3.5 4-2 7 4.5 4 7 3m0-7c3 1.5 4 4.5 3 7s-4 3.5-7 2-4-4.5-3-7m7-2c1.5 3 .5 6-2 7.5"/><circle cx="12" cy="12" r="1.5"/></svg>
        ${t('controls.fans')}
      </div>
      <div class="ctrl-fan-list">`;

    const partPct = fanPercent(data.cooling_fan_speed);
    html += fanSlider('part', t('controls.fan_part'), partPct, 'P1');

    if (caps.auxFan) {
      const auxPct = fanPercent(data.big_fan1_speed);
      html += fanSlider('aux', t('controls.fan_aux'), auxPct, 'P2');
    }

    if (caps.chamberFan) {
      const chamberPct = fanPercent(data.big_fan2_speed);
      html += fanSlider('chamber', t('controls.fan_chamber'), chamberPct, 'P3');
    }

    html += `</div></div>`;

    // ===== CARD: Motion + Extruder =====
    html += `<div class="ctrl-card ctrl-area-motion">
      <div class="ctrl-card-title">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 9l4-4 4 4"/><path d="M9 5v14"/><path d="M19 15l-4 4-4-4"/><path d="M15 19V5"/></svg>
        ${t('controls.motion')}
      </div>
      <div class="ctrl-motion-area">
        <div class="ctrl-motion-grid">
          <div class="ctrl-motion-xy">
            <button class="ctrl-motion-btn" onclick="sendGcode('G91\\nG0 Y10 F3000\\nG90')" title="Y+10">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="18 15 12 9 6 15"/></svg>
            </button>
            <div class="ctrl-motion-row">
              <button class="ctrl-motion-btn" onclick="sendGcode('G91\\nG0 X-10 F3000\\nG90')" title="X-10">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>
              </button>
              <button class="ctrl-motion-btn ctrl-motion-home" onclick="sendGcode('G28')">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>
              </button>
              <button class="ctrl-motion-btn" onclick="sendGcode('G91\\nG0 X10 F3000\\nG90')" title="X+10">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
              </button>
            </div>
            <button class="ctrl-motion-btn" onclick="sendGcode('G91\\nG0 Y-10 F3000\\nG90')" title="Y-10">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
            </button>
          </div>
          <div class="ctrl-motion-z">
            <button class="ctrl-motion-btn" onclick="sendGcode('G91\\nG0 Z5 F600\\nG90')" title="Z+5">Z+</button>
            <span class="ctrl-motion-z-label">Z</span>
            <button class="ctrl-motion-btn" onclick="sendGcode('G91\\nG0 Z-5 F600\\nG90')" title="Z-5">Z-</button>
          </div>
        </div>
        <div class="ctrl-divider"></div>
        <div class="ctrl-card-subtitle">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
          ${t('controls.extruder')}
        </div>
        <div class="ctrl-extrude-row">
          <button class="ctrl-btn" onclick="sendGcode('G91\\nG0 E10 F300\\nG90')">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
            ${t('controls.extrude')} 10mm
          </button>
          <button class="ctrl-btn" onclick="sendGcode('G91\\nG0 E-10 F300\\nG90')">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="18 15 12 9 6 15"/></svg>
            ${t('controls.retract')} 10mm
          </button>
        </div>
      </div>
    </div>`;

    // ===== CARD: Tools =====
    html += `<div class="ctrl-card ctrl-area-tools">
      <div class="ctrl-card-title">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>
        ${t('controls.tools')}
      </div>
      <div class="ctrl-tools-grid">`;

    if (caps.light) {
      html += `<button class="ctrl-tool-btn ${lightState === 'on' ? 'ctrl-tool-active' : ''}" id="ctrl-light-btn" onclick="toggleLight()">
        <div class="ctrl-tool-icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2a7 7 0 0 1 4 12.7V17a2 2 0 0 1-2 2h-4a2 2 0 0 1-2-2v-2.3A7 7 0 0 1 12 2z"/><line x1="10" y1="22" x2="14" y2="22"/></svg>
        </div>
        <span class="ctrl-tool-label">${t('controls.light')}</span>
      </button>`;
    }

    html += `<button class="ctrl-tool-btn" onclick="sendGcode('G29')">
      <div class="ctrl-tool-icon">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 20h20"/><path d="M5 20V8l7-5 7 5v12"/><rect x="9" y="12" width="6" height="8"/></svg>
      </div>
      <span class="ctrl-tool-label">${t('controls.calibration')}</span>
    </button>`;

    if (caps.ai) {
      const spaghetti = data.xcam?.spaghetti_detector;
      const firstLayer = data.xcam?.first_layer_inspector;
      html += `<button class="ctrl-tool-btn ${spaghetti ? 'ctrl-tool-active' : ''}" id="ctrl-ai-spaghetti" disabled title="${t('controls.ai_spaghetti')}">
        <div class="ctrl-tool-icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
        </div>
        <span class="ctrl-tool-label">${t('controls.ai_spaghetti')}</span>
      </button>`;
      html += `<button class="ctrl-tool-btn ${firstLayer ? 'ctrl-tool-active' : ''}" id="ctrl-ai-firstlayer" disabled title="${t('controls.ai_first_layer')}">
        <div class="ctrl-tool-icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/></svg>
        </div>
        <span class="ctrl-tool-label">${t('controls.ai_first_layer')}</span>
      </button>`;
    }

    html += `</div></div>`;

    // ===== CARD: G-code Console (full width) =====
    html += `<div class="ctrl-card ctrl-area-gcode">
      <div class="ctrl-card-title">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="4 17 10 11 4 5"/><line x1="12" y1="19" x2="20" y2="19"/></svg>
        ${t('controls.gcode_title')}
      </div>
      <div class="ctrl-gcode">
        <input class="form-input ctrl-gcode-input" id="gcode-input" placeholder="${t('controls.gcode_placeholder')}" onkeydown="if(event.key==='Enter')sendGcodeInput()">
        <button class="form-btn form-btn-sm" onclick="sendGcodeInput()">${t('controls.gcode_send')}</button>
      </div>
    </div>`;

    html += '</div>'; // close .ctrl-layout
    container.innerHTML = html;
    _rendered = true;
  }

  // Lightweight update — only change values that differ
  function updateControlsInPlace(container, data) {
    if (data.lights_report) {
      const chamber = data.lights_report.find(l => l.node === 'chamber_light');
      if (chamber) lightState = chamber.mode;
    }

    const state = data.gcode_state || 'IDLE';
    const isPrinting = state === 'RUNNING' || state === 'PAUSE';

    const printGrid = container.querySelector('#ctrl-print-grid');
    if (printGrid) printGrid.innerHTML = printControlButtons(state, isPrinting);

    const spdLvl = data.spd_lvl || 2;
    const spdMag = data.spd_mag || 100;
    const spdSlider = container.querySelector('#ctrl-speed-slider');
    const spdValue = container.querySelector('#ctrl-speed-value');
    if (spdSlider && !spdSlider.matches(':active')) spdSlider.value = spdMag;
    if (spdValue) spdValue.textContent = `${spdMag}%`;
    container.querySelectorAll('.ctrl-speed-btn').forEach(btn => {
      const lvl = parseInt(btn.dataset.speed);
      btn.classList.toggle('active', lvl === spdLvl);
    });
    const printerTag = container.querySelector('#ctrl-speed-printer');
    if (printerTag) {
      const meta = window.printerState.getActivePrinterMeta();
      if (meta?.name) printerTag.textContent = meta.name;
    }

    updateTempCurrent(container, 'nozzle', data.nozzle_temper);
    updateTempCurrent(container, 'nozzle2', data.nozzle_temper_2);
    updateTempCurrent(container, 'bed', data.bed_temper);
    updateTempCurrent(container, 'chamber', data.chamber_temper);

    updateFanSlider(container, 'part', data.cooling_fan_speed);
    updateFanSlider(container, 'aux', data.big_fan1_speed);
    updateFanSlider(container, 'chamber', data.big_fan2_speed);

    const lightBtn = container.querySelector('#ctrl-light-btn');
    if (lightBtn) lightBtn.classList.toggle('ctrl-tool-active', lightState === 'on');
  }

  function updateTempCurrent(container, id, rawTemp) {
    const el = container.querySelector(`#temp-current-${id}`);
    if (el && rawTemp !== undefined) el.textContent = `${Math.round(rawTemp)}°C`;
  }

  function updateFanSlider(container, id, rawSpeed) {
    const slider = container.querySelector(`#fan-slider-${id}`);
    const valueEl = container.querySelector(`#fan-val-${id}`);
    if (!slider || rawSpeed === undefined) return;
    if (slider.matches(':active')) return;
    const pct = Math.round((parseInt(rawSpeed) || 0) / 255 * 100);
    slider.value = pct;
    if (valueEl) valueEl.textContent = `${pct}%`;
  }

  function printControlButtons(state, isPrinting) {
    let html = '';
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
    html += `<button class="ctrl-btn ctrl-stop" ${!isPrinting ? 'disabled' : ''} onclick="confirmStop()">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><rect x="4" y="4" width="16" height="16" rx="2"/></svg>
      ${t('controls.stop')}
    </button>`;
    return html;
  }

  window.updateControls = function(data) {
    _lastData = data;
    const miniContainer = document.getElementById('controls-content');
    if (miniContainer) renderControls(miniContainer, data);
    const panelContainer = document.getElementById('controls-panel-content');
    if (panelContainer) {
      if (!_rendered || !panelContainer.hasChildNodes()) {
        renderControls(panelContainer, data);
      } else {
        updateControlsInPlace(panelContainer, data);
      }
    }
  };

  window.loadControlsPanel = function() {
    const panel = document.getElementById('overlay-panel-body');
    if (!panel) return;
    _rendered = false;
    panel.innerHTML = '<div id="controls-panel-content"></div>';
    if (_lastData) renderControls(document.getElementById('controls-panel-content'), _lastData);
  };

  function fanSlider(id, label, pct, fanParam) {
    return `<div class="ctrl-fan-row">
      <span class="ctrl-fan-label">${label}</span>
      <div class="ctrl-fan-slider-wrap">
        <input type="range" class="ctrl-slider" id="fan-slider-${id}" min="0" max="100" value="${pct}"
               onchange="setFanSpeed('${fanParam}', this.value)" oninput="document.getElementById('fan-val-${id}').textContent=this.value+'%'">
      </div>
      <span class="ctrl-fan-value" id="fan-val-${id}">${pct}%</span>
    </div>`;
  }

  function tempRow(id, label, current, target, gcode, max) {
    return `<div class="ctrl-temp-row">
      <span class="ctrl-temp-label">${label}</span>
      <span class="ctrl-temp-current" id="temp-current-${id}">${current}°C</span>
      <span class="ctrl-temp-arrow">\u2192</span>
      <input type="number" class="form-input ctrl-temp-input" id="temp-input-${id}" value="${target}" min="0" max="${max}" step="5">
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

  window.applyTempPreset = function(nozzle, bed) {
    sendCommand('gcode', { gcode: `M104 S${nozzle}` });
    sendCommand('gcode', { gcode: `M140 S${bed}` });
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
    if (confirm(t('controls.confirm_stop'))) sendCommand('stop');
  };

  window.toggleLight = function() {
    const newMode = lightState === 'on' ? 'off' : 'on';
    sendCommand('light', { mode: newMode, node: 'chamber_light' });
  };

  window.skipObject = function(objId) {
    if (!confirm(t('controls.skip_confirm'))) return;
    sendCommand('skip_objects', { obj_list: [objId] });
  };

  // Speed slider helpers
  const SPEED_PRESET_MAP = { 1: 50, 2: 100, 3: 124, 4: 166 };

  window.updateSpeedPreview = function(val) {
    const el = document.getElementById('ctrl-speed-value');
    if (el) el.textContent = `${val}%`;
  };

  window.applySpeedFromSlider = function(val) {
    const pct = parseInt(val);
    // Map slider value to nearest preset level
    let bestLvl = 2;
    let bestDist = Infinity;
    for (const [lvl, target] of Object.entries(SPEED_PRESET_MAP)) {
      const dist = Math.abs(pct - target);
      if (dist < bestDist) { bestDist = dist; bestLvl = parseInt(lvl); }
    }
    sendCommand('speed', { value: bestLvl });
  };

  window.applySpeedPreset = function(level) {
    sendCommand('speed', { value: level });
    const slider = document.getElementById('ctrl-speed-slider');
    const val = SPEED_PRESET_MAP[level] || 100;
    if (slider) slider.value = val;
    const el = document.getElementById('ctrl-speed-value');
    if (el) el.textContent = `${val}%`;
  };
})();
