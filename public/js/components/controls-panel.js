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
            : `<button class="form-btn form-btn-sm ctrl-object-skip-btn" data-ripple onclick="skipObject(${obj.obj_id})">${t('controls.skip_object')}</button>`
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
        <button class="ctrl-speed-btn ${spdLvl === 1 ? 'active' : ''}" data-speed="1" data-ripple onclick="applySpeedPreset(1)">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 18h4l3-8 3 8h4l5-16"/></svg>
          ${t('speed.silent')}
        </button>
        <button class="ctrl-speed-btn ${spdLvl === 2 ? 'active' : ''}" data-speed="2" data-ripple onclick="applySpeedPreset(2)">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
          ${t('speed.standard')}
        </button>
        <button class="ctrl-speed-btn ${spdLvl === 3 ? 'active' : ''}" data-speed="3" data-ripple onclick="applySpeedPreset(3)">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
          ${t('speed.sport')}
        </button>
        <button class="ctrl-speed-btn ${spdLvl === 4 ? 'active' : ''}" data-speed="4" data-ripple onclick="applySpeedPreset(4)">
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
        <button class="ctrl-preset-btn" data-ripple onclick="applyTempPreset(220, 60)" title="PLA">PLA</button>
        <button class="ctrl-preset-btn" data-ripple onclick="applyTempPreset(250, 80)" title="PETG">PETG</button>
        <button class="ctrl-preset-btn" data-ripple onclick="applyTempPreset(260, 100)" title="ABS">ABS</button>
        <button class="ctrl-preset-btn" data-ripple onclick="applyTempPreset(270, 100)" title="ASA">ASA</button>
        <button class="ctrl-preset-btn" data-ripple onclick="applyTempPreset(230, 60)" title="TPU">TPU</button>
        <button class="ctrl-preset-btn ctrl-preset-off" data-ripple onclick="applyTempPreset(0, 0)" title="${t('controls.cooldown')}">
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
            <div></div>
            <button class="ctrl-motion-btn" data-ripple onclick="sendGcode('G91\\nG0 Y10 F3000\\nG90')" title="Y+10">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="18 15 12 9 6 15"/></svg>
            </button>
            <div></div>
            <button class="ctrl-motion-btn" data-ripple onclick="sendGcode('G91\\nG0 X-10 F3000\\nG90')" title="X-10">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>
            </button>
            <button class="ctrl-motion-btn ctrl-motion-home" data-ripple onclick="sendGcode('G28')">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>
            </button>
            <button class="ctrl-motion-btn" data-ripple onclick="sendGcode('G91\\nG0 X10 F3000\\nG90')" title="X+10">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
            </button>
            <div></div>
            <button class="ctrl-motion-btn" data-ripple onclick="sendGcode('G91\\nG0 Y-10 F3000\\nG90')" title="Y-10">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
            </button>
            <div></div>
          </div>
          <div class="ctrl-motion-z">
            <button class="ctrl-motion-btn" data-ripple onclick="sendGcode('G91\\nG0 Z5 F600\\nG90')" title="Z+5">Z+</button>
            <span class="ctrl-motion-z-label">Z</span>
            <button class="ctrl-motion-btn" data-ripple onclick="sendGcode('G91\\nG0 Z-5 F600\\nG90')" title="Z-5">Z-</button>
          </div>
        </div>
        <div class="ctrl-divider"></div>
        <div class="ctrl-card-subtitle">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
          ${t('controls.extruder')}
        </div>
        <div class="ctrl-extrude-row">
          <button class="ctrl-btn" data-ripple onclick="sendGcode('G91\\nG0 E10 F300\\nG90')">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
            ${t('controls.extrude')} 10mm
          </button>
          <button class="ctrl-btn" data-ripple onclick="sendGcode('G91\\nG0 E-10 F300\\nG90')">
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
      html += `<button class="ctrl-tool-btn ${lightState === 'on' ? 'ctrl-tool-active' : ''}" id="ctrl-light-btn" data-ripple data-tooltip="${t('controls.light')}" onclick="toggleLight()">
        <div class="ctrl-tool-icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2a7 7 0 0 1 4 12.7V17a2 2 0 0 1-2 2h-4a2 2 0 0 1-2-2v-2.3A7 7 0 0 1 12 2z"/><line x1="10" y1="22" x2="14" y2="22"/></svg>
        </div>
        <span class="ctrl-tool-label">${t('controls.light')}</span>
      </button>`;
    }

    html += `<button class="ctrl-tool-btn" data-ripple data-tooltip="${t('controls.calibration')}" onclick="sendGcode('G29')">
      <div class="ctrl-tool-icon">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 20h20"/><path d="M5 20V8l7-5 7 5v12"/><rect x="9" y="12" width="6" height="8"/></svg>
      </div>
      <span class="ctrl-tool-label">${t('controls.calibration')}</span>
    </button>`;

    if (caps.ai) {
      const spaghetti = data.xcam?.spaghetti_detector;
      const firstLayer = data.xcam?.first_layer_inspector;
      html += `<button class="ctrl-tool-btn ${spaghetti ? 'ctrl-tool-active' : ''}" id="ctrl-ai-spaghetti" disabled data-tooltip="${t('controls.ai_spaghetti')}" title="${t('controls.ai_spaghetti')}">
        <div class="ctrl-tool-icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
        </div>
        <span class="ctrl-tool-label">${t('controls.ai_spaghetti')}</span>
      </button>`;
      html += `<button class="ctrl-tool-btn ${firstLayer ? 'ctrl-tool-active' : ''}" id="ctrl-ai-firstlayer" disabled data-tooltip="${t('controls.ai_first_layer')}" title="${t('controls.ai_first_layer')}">
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
        <button class="form-btn form-btn-sm" data-ripple onclick="sendGcodeInput()">${t('controls.gcode_send')}</button>
      </div>
    </div>`;

    // ===== CARD: G-Code Macros =====
    html += `<div class="ctrl-card ctrl-area-macros">
      <div class="ctrl-card-title" style="display:flex;align-items:center;justify-content:space-between">
        <span style="display:flex;align-items:center;gap:6px">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/></svg>
          ${t('controls.macros_title')}
        </span>
        <button class="form-btn form-btn-sm" data-ripple onclick="showMacroEditor()">${t('controls.macro_add')}</button>
      </div>
      <div id="ctrl-macros-list"><span class="text-muted" style="font-size:0.8rem">Loading...</span></div>
    </div>`;

    // ===== CARD: SD Card Files =====
    if (meta?.id) {
      html += `<div class="ctrl-card ctrl-area-files">
        <div class="ctrl-card-title" style="display:flex;align-items:center;justify-content:space-between">
          <span style="display:flex;align-items:center;gap:6px">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/></svg>
            ${t('controls.sd_files')}
          </span>
          <button class="form-btn form-btn-sm" data-ripple onclick="loadPrinterFiles('${esc(meta.id)}')">${t('controls.refresh')}</button>
        </div>
        <div id="ctrl-files-list"><span class="text-muted" style="font-size:0.8rem">${t('controls.sd_click_refresh')}</span></div>
      </div>`;
    }

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
      html += `<button class="ctrl-btn ctrl-pause" data-ripple onclick="sendCommand('pause')">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
        ${t('controls.pause')}
      </button>`;
    } else if (state === 'PAUSE') {
      html += `<button class="ctrl-btn ctrl-resume" data-ripple onclick="sendCommand('resume')">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><polygon points="5,3 19,12 5,21"/></svg>
        ${t('controls.resume')}
      </button>`;
    }
    html += `<button class="ctrl-btn ctrl-stop" data-ripple ${!isPrinting ? 'disabled' : ''} onclick="confirmStop()">
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
    if (_lastData) {
      renderControls(document.getElementById('controls-panel-content'), _lastData);
    } else if (!window.printerState.getActivePrinterId()) {
      document.getElementById('controls-panel-content').innerHTML = `<div style="text-align:center;padding:3rem 1rem">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" stroke-width="1.5" style="margin-bottom:1rem"><rect x="6" y="2" width="12" height="8" rx="1"/><rect x="4" y="10" width="16" height="10" rx="1"/><circle cx="8" cy="15" r="1"/><line x1="12" y1="15" x2="18" y2="15"/></svg>
        <h3 style="margin:0 0 0.5rem;color:var(--text-primary)">${t('common.no_printers_title')}</h3>
        <p class="text-muted" style="margin:0 0 1rem">${t('common.no_printers_desc')}</p>
        <button class="btn btn-primary" onclick="location.hash='#settings'">${t('common.add_printer_btn')}</button>
      </div>`;
    }
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
      <button class="form-btn form-btn-sm" data-ripple onclick="setTemp('${gcode}', document.getElementById('temp-input-${id}').value)">${t('controls.set')}</button>
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
    return confirmAction(t('controls.confirm_stop'), () => {
      sendCommand('stop');
    }, { danger: true });
  };

  window.toggleLight = function() {
    const newMode = lightState === 'on' ? 'off' : 'on';
    sendCommand('light', { mode: newMode, node: 'chamber_light' });
  };

  window.skipObject = function(objId) {
    return confirmAction(t('controls.skip_confirm'), () => {
      sendCommand('skip_objects', { obj_list: [objId] });
    }, { danger: true });
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

  // ═══ G-Code Macros ═══
  async function loadMacros() {
    const el = document.getElementById('ctrl-macros-list');
    if (!el) return;
    try {
      const res = await fetch('/api/macros');
      const macros = await res.json();
      if (!macros.length) { el.innerHTML = `<p class="text-muted" style="font-size:0.8rem">${t('controls.no_macros')}</p>`; return; }
      const cats = {};
      for (const m of macros) {
        const cat = m.category || 'manual';
        if (!cats[cat]) cats[cat] = [];
        cats[cat].push(m);
      }
      let h = '';
      for (const [cat, items] of Object.entries(cats)) {
        h += `<div class="ctrl-macro-category"><span class="text-muted" style="font-size:0.7rem;text-transform:uppercase">${t('controls.macro_cat_' + cat, {}, cat)}</span></div>`;
        h += '<div class="ctrl-macro-grid">';
        for (const m of items) {
          h += `<div class="ctrl-macro-btn-wrap">
            <button class="form-btn form-btn-sm ctrl-macro-btn" data-ripple onclick="runMacro(${m.id})" title="${esc(m.description || m.name)}">
              ${esc(m.name)}
            </button>
            <button class="filament-edit-btn" style="opacity:0.6" onclick="showMacroEditor(${m.id})" title="${t('settings.edit')}">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            </button>
          </div>`;
        }
        h += '</div>';
      }
      el.innerHTML = h;
    } catch { el.innerHTML = '<span class="text-muted">Error</span>'; }
  }

  // Load macros when panel renders
  setTimeout(() => loadMacros(), 100);

  window.runMacro = async function(id) {
    const meta = window.printerState?.getActivePrinterMeta();
    if (!meta?.id) { showToast(t('controls.no_printer'), 'warning'); return; }
    try {
      const res = await fetch(`/api/macros/${id}/run`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ printer_id: meta.id })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
    } catch (e) { showToast(e.message, 'error'); }
  };

  window.showMacroEditor = async function(id) {
    let macro = { name: '', description: '', gcode: '', category: 'manual' };
    if (id) {
      try {
        const res = await fetch(`/api/macros/${id}`);
        macro = await res.json();
      } catch { return; }
    }
    const overlay = document.createElement('div');
    overlay.className = 'inv-modal-overlay';
    overlay.onclick = (e) => { if (e.target === overlay) overlay.remove(); };
    overlay.innerHTML = `<div class="inv-modal" style="max-width:500px">
      <div class="inv-modal-header">
        <span>${id ? t('controls.macro_edit') : t('controls.macro_add')}</span>
        <button class="inv-modal-close" onclick="this.closest('.inv-modal-overlay').remove()">&times;</button>
      </div>
      <div style="padding:12px;display:flex;flex-direction:column;gap:8px">
        <label class="form-label">${t('controls.macro_name')}
          <input class="form-input" id="macro-name" value="${esc(macro.name)}">
        </label>
        <label class="form-label">${t('controls.macro_description')}
          <input class="form-input" id="macro-desc" value="${esc(macro.description || '')}">
        </label>
        <label class="form-label">${t('controls.macro_category')}
          <select class="form-input" id="macro-category">
            <option value="manual" ${macro.category === 'manual' ? 'selected' : ''}>Manual</option>
            <option value="pre_print" ${macro.category === 'pre_print' ? 'selected' : ''}>Pre-Print</option>
            <option value="post_print" ${macro.category === 'post_print' ? 'selected' : ''}>Post-Print</option>
            <option value="maintenance" ${macro.category === 'maintenance' ? 'selected' : ''}>Maintenance</option>
          </select>
        </label>
        <label class="form-label">${t('controls.macro_gcode')}
          <textarea class="form-input" id="macro-gcode" rows="6" style="font-family:monospace;font-size:0.8rem">${esc(macro.gcode)}</textarea>
        </label>
      </div>
      <div class="inv-modal-footer" style="display:flex;gap:8px">
        ${id ? `<button class="form-btn" style="color:var(--accent-red)" onclick="deleteMacroItem(${id})">${t('settings.delete')}</button>` : ''}
        <button class="form-btn" onclick="saveMacro(${id || 'null'})">${t('common.save')}</button>
      </div>
    </div>`;
    document.body.appendChild(overlay);
  };

  window.saveMacro = async function(id) {
    const body = {
      name: document.getElementById('macro-name')?.value?.trim(),
      description: document.getElementById('macro-desc')?.value?.trim() || null,
      gcode: document.getElementById('macro-gcode')?.value?.trim(),
      category: document.getElementById('macro-category')?.value || 'manual'
    };
    if (!body.name || !body.gcode) { showToast('Name and G-Code required', 'warning'); return; }
    try {
      const res = await fetch(id ? `/api/macros/${id}` : '/api/macros', {
        method: id ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      if (!res.ok) throw new Error('Failed');
      document.querySelector('.inv-modal-overlay')?.remove();
      loadMacros();
    } catch (e) { showToast(e.message, 'error'); }
  };

  window.deleteMacroItem = function(id) {
    return confirmAction(t('controls.macro_delete_confirm'), async () => {
      try {
        await fetch(`/api/macros/${id}`, { method: 'DELETE' });
        document.querySelector('.inv-modal-overlay')?.remove();
        loadMacros();
      } catch (e) { showToast(e.message, 'error'); }
    }, { danger: true });
  };

  // ═══ SD Card File Browser ═══
  window.loadPrinterFiles = async function(printerId) {
    const el = document.getElementById('ctrl-files-list');
    if (!el) return;
    el.innerHTML = '<span class="text-muted" style="font-size:0.8rem">Loading...</span>';
    try {
      const res = await fetch(`/api/printers/${encodeURIComponent(printerId)}/files`);
      const files = await res.json();
      if (files.error) { el.innerHTML = `<span class="text-muted" style="font-size:0.8rem">${esc(files.error)}</span>`; return; }
      if (!files.length) { el.innerHTML = `<span class="text-muted" style="font-size:0.8rem">${t('controls.sd_no_files')}</span>`; return; }
      let h = '<div class="ctrl-files-grid">';
      for (const f of files) {
        const sizeKb = f.size > 0 ? (f.size / 1024).toFixed(0) + ' KB' : '';
        h += `<div class="ctrl-file-row">
          <div class="ctrl-file-info">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
            <span class="ctrl-file-name">${esc(f.name)}</span>
            <span class="text-muted" style="font-size:0.7rem">${sizeKb}</span>
          </div>
          <div class="ctrl-file-actions">
            <button class="form-btn form-btn-sm" data-ripple onclick="printFile('${esc(printerId)}', '${esc(f.path)}')">${t('controls.print')}</button>
            <button class="form-btn form-btn-sm" data-ripple onclick="addFileToQueue('${esc(f.path)}')">${t('controls.add_to_queue')}</button>
            <button class="filament-delete-btn" style="opacity:0.7" onclick="deleteFile('${esc(printerId)}', '${esc(f.path)}')" title="${t('settings.delete')}">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
        </div>`;
      }
      h += '</div>';
      el.innerHTML = h;
    } catch (e) { el.innerHTML = `<span class="text-muted">Error: ${esc(e.message)}</span>`; }
  };

  window.printFile = function(printerId, filePath) {
    return confirmAction(t('controls.print_confirm'), async () => {
      try {
        await fetch(`/api/printers/${encodeURIComponent(printerId)}/files/print`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ filename: filePath })
        });
      } catch (e) { showToast(e.message, 'error'); }
    }, {});
  };

  window.addFileToQueue = async function(filePath) {
    const filename = filePath.split('/').pop();
    try {
      const qRes = await fetch('/api/queue');
      const queues = await qRes.json();
      if (!queues.length) { showToast(t('controls.no_queues'), 'warning'); return; }
      const queueId = queues[0].id;
      await fetch(`/api/queue/${queueId}/items`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename })
      });
    } catch (e) { showToast(e.message, 'error'); }
  };

  window.deleteFile = function(printerId, filePath) {
    return confirmAction(t('controls.delete_file_confirm'), async () => {
      try {
        await fetch(`/api/printers/${encodeURIComponent(printerId)}/files/${encodeURIComponent(filePath)}`, { method: 'DELETE' });
        loadPrinterFiles(printerId);
      } catch (e) { showToast(e.message, 'error'); }
    }, { danger: true });
  };
})();
