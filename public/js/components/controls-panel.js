// Controls Panel - Comprehensive printer controls
(function() {
  let lightState = 'on';
  let _lastData = null;
  let _rendered = false;
  let _renderedForPrinter = null; // Track which printer the panel was rendered for

  function fanPercent(raw) {
    const val = parseInt(raw) || 0;
    if (val === 0) return 0;
    const max = val > 15 ? 255 : 15;
    return Math.min(100, Math.round((val / max) * 100));
  }

  function speedLevelKey(lvl) {
    return { 1: 'speed.silent', 2: 'speed.standard', 3: 'speed.sport', 4: 'speed.ludicrous' }[lvl] || 'speed.standard';
  }

  // Full render — only called once when panel opens
  function renderControls(container, data) {
    const meta = window.printerState.getActivePrinterMeta();
    const caps = typeof getCapabilities === 'function' ? getCapabilities(meta?.model, meta) : {};
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
      <div id="ctrl-stage-badge" style="margin-top:6px">${typeof renderStageBadge === 'function' ? renderStageBadge(data.stg_cur) : ''}</div>
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

    // ===== CARD: Layer Pauses (only during print) =====
    if (isPrinting && meta?.id) {
      html += `<div class="ctrl-card ctrl-area-layerpauses">
        <div class="ctrl-card-title" style="display:flex;align-items:center;justify-content:space-between">
          <span style="display:flex;align-items:center;gap:6px">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
            ${t('controls.layer_pauses')}
          </span>
          <span class="text-muted" style="font-size:0.75rem">${t('controls.layers')}: ${data.layer_num || 0} / ${data.total_layer_num || '?'}</span>
        </div>
        <div style="display:flex;gap:6px;margin-bottom:8px">
          <input class="form-input" id="ctrl-lp-layers" placeholder="${t('controls.layer_pause_placeholder')}" style="flex:1">
          <input class="form-input" id="ctrl-lp-reason" placeholder="${t('controls.layer_pause_reason')}" style="flex:1">
          <button class="form-btn form-btn-sm" data-ripple onclick="window._addLayerPause('${esc(meta.id)}')">${t('controls.add')}</button>
        </div>
        <div id="ctrl-layer-pauses-list"><span class="text-muted" style="font-size:0.8rem">${t('controls.no_layer_pauses')}</span></div>
      </div>`;
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

    // Extra extruders (Moonraker multi-extruder e.g. Snapmaker U1)
    if (data._extra_extruders && data._extra_extruders.length > 0) {
      for (let i = 0; i < data._extra_extruders.length; i++) {
        const ex = data._extra_extruders[i];
        if (!ex) continue;
        const label = `Nozzle ${i + 2}`;
        const gcode = `M104 T${i + 1}`;
        html += tempRow(`nozzle${i+2}`, label, ex.temperature || 0, ex.target || 0, gcode, maxNozzle);
      }
    }

    if (caps.chamberHeat || data.chamber_temper > 0) {
      const chamberTemp = Math.round(data.chamber_temper || 0);
      const chamberTarget = Math.round(data.chamber_target_temper || 0);
      const maxChamber = caps.maxChamberTemp || 60;
      // Cavity temp sensor (read-only for Moonraker)
      if (meta?.type === 'moonraker') {
        html += `<div class="ctrl-temp-row">
          <span class="ctrl-temp-label">Cavity</span>
          <span class="ctrl-temp-current">${chamberTemp}°C</span>
          <span class="ctrl-temp-target" style="opacity:0.5">sensor</span>
        </div>`;
      } else {
        html += tempRow('chamber', t('controls.temp_chamber'), chamberTemp, chamberTarget, 'M141', maxChamber);
      }
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

    // Moonraker-specific: cavity fan
    if (data._cavity_fan_speed !== undefined) {
      html += fanSlider('cavity', 'Cavity Fan', data._cavity_fan_speed, 'cavity_fan');
    }

    // Moonraker-specific: purifier
    if (data._purifier) {
      html += fanSlider('purifier', 'Air Purifier', data._purifier.fan_speed, 'purifier');
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
      html += `<button class="ctrl-tool-btn ${lightState === 'on' ? 'ctrl-tool-active' : ''}" id="ctrl-light-btn" data-ripple title="${t('controls.light')}" data-bs-toggle="tooltip" onclick="toggleLight()">
        <div class="ctrl-tool-icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2a7 7 0 0 1 4 12.7V17a2 2 0 0 1-2 2h-4a2 2 0 0 1-2-2v-2.3A7 7 0 0 1 12 2z"/><line x1="10" y1="22" x2="14" y2="22"/></svg>
        </div>
        <span class="ctrl-tool-label">${t('controls.light')}</span>
      </button>`;
    }

    html += `<button class="ctrl-tool-btn" data-ripple title="${t('controls.calibration')}" data-bs-toggle="tooltip" onclick="sendGcode('G29')">
      <div class="ctrl-tool-icon">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 20h20"/><path d="M5 20V8l7-5 7 5v12"/><rect x="9" y="12" width="6" height="8"/></svg>
      </div>
      <span class="ctrl-tool-label">${t('controls.calibration')}</span>
    </button>`;

    if (caps.ai) {
      const spaghetti = data.xcam?.spaghetti_detector;
      const firstLayer = data.xcam?.first_layer_inspector;
      html += `<button class="ctrl-tool-btn ${spaghetti ? 'ctrl-tool-active' : ''}" id="ctrl-ai-spaghetti" disabled title="${t('controls.ai_spaghetti')}" data-bs-toggle="tooltip">
        <div class="ctrl-tool-icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
        </div>
        <span class="ctrl-tool-label">${t('controls.ai_spaghetti')}</span>
      </button>`;
      html += `<button class="ctrl-tool-btn ${firstLayer ? 'ctrl-tool-active' : ''}" id="ctrl-ai-firstlayer" disabled title="${t('controls.ai_first_layer')}" data-bs-toggle="tooltip">
        <div class="ctrl-tool-icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/></svg>
        </div>
        <span class="ctrl-tool-label">${t('controls.ai_first_layer')}</span>
      </button>`;
    }

    // Moonraker-specific tools
    if (meta?.type === 'moonraker') {
      html += `<button class="ctrl-tool-btn" data-ripple onclick="sendGcode('BED_MESH_CALIBRATE')">
        <div class="ctrl-tool-icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M3 15h18M9 3v18M15 3v18"/></svg>
        </div>
        <span class="ctrl-tool-label">Bed Mesh</span>
      </button>`;

      html += `<button class="ctrl-tool-btn" data-ripple onclick="sendGcode('SHAPER_CALIBRATE')">
        <div class="ctrl-tool-icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 12c0 0 2-4 5-4s3 8 6 8 5-4 5-4"/><path d="M22 12c0 0-2 4-5 4"/></svg>
        </div>
        <span class="ctrl-tool-label">Input Shaper</span>
      </button>`;

      html += `<button class="ctrl-tool-btn" data-ripple onclick="sendCommand('firmware_restart')">
        <div class="ctrl-tool-icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 105.64-12.36L1 10"/></svg>
        </div>
        <span class="ctrl-tool-label">FW Restart</span>
      </button>`;

      html += `<button class="ctrl-tool-btn" data-ripple style="color:var(--accent-red)" onclick="confirmAction('Emergency stop?', () => sendCommand('emergency_stop'), {danger:true})">
        <div class="ctrl-tool-icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--accent-red)" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>
        </div>
        <span class="ctrl-tool-label">E-Stop</span>
      </button>`;
    }

    html += `</div></div>`;

    // ===== CARD: Z-Offset Calibration Wizard (only when idle) =====
    if (!isPrinting) {
      html += `<div class="ctrl-card ctrl-area-zoffset">
        <div class="ctrl-card-title">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v6m0 8v6"/><path d="M2 12h6m8 0h6"/></svg>
          ${t('controls.z_wizard_title')}
        </div>
        <div class="ctrl-wizard-steps">
          <div class="ctrl-wizard-step">
            <span class="ctrl-wizard-num">1</span>
            <div style="flex:1">
              <div style="font-size:0.85rem;font-weight:600">${t('controls.z_step_home')}</div>
              <button class="form-btn form-btn-sm" data-ripple style="margin-top:4px" onclick="window._zWizardHome()">G28 — Home</button>
            </div>
          </div>
          <div class="ctrl-wizard-step">
            <span class="ctrl-wizard-num">2</span>
            <div style="flex:1">
              <div style="font-size:0.85rem;font-weight:600">${t('controls.z_step_level')}</div>
              <button class="form-btn form-btn-sm" data-ripple style="margin-top:4px" onclick="window._zWizardLevel()">G29 — Auto-level</button>
            </div>
          </div>
          <div class="ctrl-wizard-step">
            <span class="ctrl-wizard-num">3</span>
            <div style="flex:1">
              <div style="font-size:0.85rem;font-weight:600">${t('controls.z_step_adjust')}</div>
              <div style="display:flex;align-items:center;gap:6px;margin-top:4px;flex-wrap:wrap">
                <button class="form-btn form-btn-sm" data-ripple onclick="window._zWizardAdjust(-0.10)">-0.10</button>
                <button class="form-btn form-btn-sm" data-ripple onclick="window._zWizardAdjust(-0.05)">-0.05</button>
                <button class="form-btn form-btn-sm" data-ripple onclick="window._zWizardAdjust(-0.01)">-0.01</button>
                <span id="ctrl-z-offset-val" style="font-family:monospace;font-weight:600;min-width:60px;text-align:center">${t('controls.z_offset_current')}: 0.00 mm</span>
                <button class="form-btn form-btn-sm" data-ripple onclick="window._zWizardAdjust(0.01)">+0.01</button>
                <button class="form-btn form-btn-sm" data-ripple onclick="window._zWizardAdjust(0.05)">+0.05</button>
                <button class="form-btn form-btn-sm" data-ripple onclick="window._zWizardAdjust(0.10)">+0.10</button>
                <button class="form-btn form-btn-sm" data-ripple style="opacity:0.7" onclick="window._zWizardReset()" title="Reset">↺</button>
              </div>
            </div>
          </div>
        </div>
      </div>`;
    }

    // ===== CARD: G-code Console (full width) =====
    html += `<div class="ctrl-card ctrl-area-gcode">
      <div class="ctrl-card-title">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="4 17 10 11 4 5"/><line x1="12" y1="19" x2="20" y2="19"/></svg>
        ${t('controls.gcode_title')}
      </div>
      <div id="gcode-history" class="ctrl-gcode-history"></div>
      <div class="ctrl-gcode">
        <input class="form-input ctrl-gcode-input" id="gcode-input" placeholder="${t('controls.gcode_placeholder')}" onkeydown="if(event.key==='Enter')sendGcodeInput()">
        <button class="form-btn form-btn-sm" data-ripple onclick="sendGcodeInput()">${t('controls.gcode_send')}</button>
      </div>
    </div>`;

    // ===== CARD: Quick Commands =====
    const quickCmds = [
      { label: t('controls.qc_home_all') || 'Home All', gcode: 'G28', group: 'motion' },
      { label: t('controls.qc_home_x') || 'Home X', gcode: 'G28 X', group: 'motion' },
      { label: t('controls.qc_home_y') || 'Home Y', gcode: 'G28 Y', group: 'motion' },
      { label: t('controls.qc_home_z') || 'Home Z', gcode: 'G28 Z', group: 'motion' },
      { label: t('controls.qc_auto_level') || 'Auto Level', gcode: 'G29', group: 'motion' },
      { label: t('controls.qc_motors_off') || 'Motors Off', gcode: 'M18', group: 'motion' },
      { label: t('controls.qc_fan_100') || 'Fan 100%', gcode: 'M106 S255', group: 'cooling' },
      { label: t('controls.qc_fan_50') || 'Fan 50%', gcode: 'M106 S127', group: 'cooling' },
      { label: t('controls.qc_fan_off') || 'Fan Off', gcode: 'M107', group: 'cooling' },
      { label: t('controls.qc_pla_preheat') || 'PLA Preheat', gcode: 'M104 S200\\nM140 S60', group: 'temp' },
      { label: t('controls.qc_petg_preheat') || 'PETG Preheat', gcode: 'M104 S240\\nM140 S80', group: 'temp' },
      { label: t('controls.qc_abs_preheat') || 'ABS Preheat', gcode: 'M104 S250\\nM140 S100', group: 'temp' },
      { label: t('controls.cooldown') || 'Cooldown', gcode: 'M104 S0\\nM140 S0', group: 'temp' },
      { label: t('controls.extrude') + ' 10mm', gcode: 'G91\\nG1 E10 F300\\nG90', group: 'filament' },
      { label: t('controls.retract') + ' 10mm', gcode: 'G91\\nG1 E-10 F300\\nG90', group: 'filament' },
      { label: t('controls.qc_report_temps') || 'Report Temps', gcode: 'M105', group: 'info' },
      { label: t('controls.qc_report_pos') || 'Report Position', gcode: 'M114', group: 'info' },
    ];

    const cmdGroups = {};
    for (const cmd of quickCmds) {
      if (!cmdGroups[cmd.group]) cmdGroups[cmd.group] = [];
      cmdGroups[cmd.group].push(cmd);
    }
    const groupLabels = { motion: t('controls.motion'), cooling: t('controls.fans'), temp: t('controls.temperature'), filament: t('controls.filament_change'), info: t('controls.qc_info') || 'Info' };

    html += `<div class="ctrl-card ctrl-area-quickcmds">
      <div class="ctrl-card-title">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10"/></svg>
        ${t('controls.quick_commands') || 'Quick Commands'}
      </div>
      <div class="ctrl-quickcmds-groups">`;

    for (const [group, cmds] of Object.entries(cmdGroups)) {
      html += `<div class="ctrl-quickcmds-group">
        <div class="ctrl-quickcmds-label">${groupLabels[group] || group}</div>
        <div class="ctrl-quickcmds-btns">`;
      for (const cmd of cmds) {
        html += `<button class="ctrl-quick-btn" onclick="_quickGcode('${cmd.gcode}')" data-ripple title="${cmd.gcode.replace(/\\\\n/g, ' → ')}" data-bs-toggle="tooltip">${cmd.label}</button>`;
      }
      html += `</div></div>`;
    }

    html += `</div></div>`;

    // ===== CARD: G-Code Macros =====
    html += `<div class="ctrl-card ctrl-area-macros">
      <div class="ctrl-card-title" style="display:flex;align-items:center;justify-content:space-between">
        <span style="display:flex;align-items:center;gap:6px">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/></svg>
          ${t('controls.macros_title')}
        </span>
        <button class="form-btn form-btn-sm" data-ripple onclick="showMacroEditor()">${t('controls.macro_add')}</button>
      </div>
      <div id="ctrl-macros-list"><span class="text-muted" style="font-size:0.8rem">${t('common.loading')}...</span></div>
    </div>`;

    // ===== CARD: Bed Level Mesh =====
    if (meta?.id) {
      html += `<div class="ctrl-card ctrl-area-bedmesh">
        <div class="ctrl-card-title" style="display:flex;align-items:center;justify-content:space-between">
          <span style="display:flex;align-items:center;gap:6px">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="3" y1="15" x2="21" y2="15"/><line x1="9" y1="3" x2="9" y2="21"/><line x1="15" y1="3" x2="15" y2="21"/></svg>
            ${t('controls.bed_mesh')}
          </span>
          <div style="display:flex;gap:4px">
            <button class="form-btn form-btn-sm" data-ripple onclick="window._loadBedMesh('${esc(meta.id)}')">${t('controls.refresh')}</button>
            <button class="form-btn form-btn-sm" data-ripple onclick="window._captureBedCheck('${esc(meta.id)}')">${t('controls.bed_check')}</button>
            <button class="form-btn form-btn-sm" data-ripple onclick="window._captureBaseline('${esc(meta.id)}')">${t('controls.capture_baseline')}</button>
          </div>
        </div>
        <div id="ctrl-bed-mesh"><span class="text-muted" style="font-size:0.8rem">${t('controls.bed_mesh_hint')}</span></div>
      </div>`;
    }

    // ===== CARD: Filament Change =====
    if (meta?.id) {
      html += `<div class="ctrl-card ctrl-area-filchange">
        <div class="ctrl-card-title">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v6m0 8v6M4.93 4.93l4.24 4.24m5.66 5.66l4.24 4.24M2 12h6m8 0h6M4.93 19.07l4.24-4.24m5.66-5.66l4.24-4.24"/></svg>
          ${t('controls.filament_change')}
        </div>
        <div id="ctrl-filament-change">
          <button class="form-btn form-btn-sm" data-ripple onclick="window._startFilamentChange('${esc(meta.id)}')">${t('controls.start_filament_change')}</button>
        </div>
      </div>`;
    }

    // ===== CARD: Brand-specific tools =====
    // Prusa: MMU controls
    if (meta?.type === 'prusalink' || caps.prusaFeatures) {
      html += `<div class="ctrl-card">
        <div class="ctrl-card-title">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/></svg>
          Prusa Controls
        </div>
        <div style="display:flex;gap:4px;flex-wrap:wrap">
          <button class="form-btn form-btn-sm" data-ripple style="font-size:0.72rem" onclick="sendCommand('gcode',{gcode:'G28'})">Home</button>
          <button class="form-btn form-btn-sm" data-ripple style="font-size:0.72rem" onclick="sendCommand('gcode',{gcode:'G29'})">Mesh Bed</button>
          <button class="form-btn form-btn-sm" data-ripple style="font-size:0.72rem" onclick="sendCommand('mmu_load',{slot:0})">MMU Load T0</button>
          <button class="form-btn form-btn-sm" data-ripple style="font-size:0.72rem" onclick="sendCommand('mmu_load',{slot:1})">MMU Load T1</button>
          <button class="form-btn form-btn-sm" data-ripple style="font-size:0.72rem" onclick="sendCommand('mmu_load',{slot:2})">MMU Load T2</button>
          <button class="form-btn form-btn-sm" data-ripple style="font-size:0.72rem" onclick="sendCommand('mmu_unload')">MMU Unload</button>
        </div>
      </div>`;
    }

    // Creality K1: AI camera + self-check
    if (caps.crealityAI) {
      html += `<div class="ctrl-card">
        <div class="ctrl-card-title">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
          Creality AI
        </div>
        <div style="display:flex;gap:4px;flex-wrap:wrap">
          <button class="form-btn form-btn-sm" data-ripple style="font-size:0.72rem" onclick="sendGcode('SELF_CHECK')">Self Check</button>
          <button class="form-btn form-btn-sm" data-ripple style="font-size:0.72rem" onclick="sendGcode('LEVELING_CALIBRATE')">Auto Level</button>
          <button class="form-btn form-btn-sm" data-ripple style="font-size:0.72rem" onclick="sendGcode('INPUT_SHAPER_CALIBRATE')">Input Shaper</button>
          <button class="form-btn form-btn-sm" data-ripple style="font-size:0.72rem" onclick="sendGcode('PID_CALIBRATE HEATER=extruder TARGET=220')">PID Nozzle</button>
          <button class="form-btn form-btn-sm" data-ripple style="font-size:0.72rem" onclick="sendGcode('PID_CALIBRATE HEATER=heater_bed TARGET=60')">PID Bed</button>
        </div>
        ${caps.crealityLidar ? '<div style="font-size:0.68rem;color:var(--text-muted);margin-top:4px">Lidar first-layer scanning available</div>' : ''}
      </div>`;
    }

    // Voron: QGL, Z-tilt, Stealthburner LEDs
    if (caps.voronFeatures) {
      html += `<div class="ctrl-card">
        <div class="ctrl-card-title">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10"/></svg>
          Voron Tools
        </div>
        <div style="display:flex;gap:4px;flex-wrap:wrap">
          <button class="form-btn form-btn-sm" data-ripple style="font-size:0.72rem" onclick="sendGcode('QUAD_GANTRY_LEVEL')">QGL</button>
          <button class="form-btn form-btn-sm" data-ripple style="font-size:0.72rem" onclick="sendGcode('Z_TILT_ADJUST')">Z-Tilt</button>
          <button class="form-btn form-btn-sm" data-ripple style="font-size:0.72rem" onclick="sendGcode('BED_MESH_CALIBRATE')">Bed Mesh</button>
          <button class="form-btn form-btn-sm" data-ripple style="font-size:0.72rem" onclick="sendGcode('SHAPER_CALIBRATE')">Input Shaper</button>
          <button class="form-btn form-btn-sm" data-ripple style="font-size:0.72rem" onclick="sendGcode('CLEAN_NOZZLE')">Clean Nozzle</button>
          <button class="form-btn form-btn-sm" data-ripple style="font-size:0.72rem" onclick="sendGcode('STATUS_READY')">LEDs On</button>
          <button class="form-btn form-btn-sm" data-ripple style="font-size:0.72rem" onclick="sendGcode('STATUS_OFF')">LEDs Off</button>
          <button class="form-btn form-btn-sm" data-ripple style="font-size:0.72rem;color:var(--accent-red)" onclick="sendGcode('M112')">E-Stop</button>
        </div>
      </div>`;
    }

    // Elegoo: Neptune-specific controls
    if (caps.elegooFeatures) {
      html += `<div class="ctrl-card">
        <div class="ctrl-card-title">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="12" cy="12" r="4"/></svg>
          Elegoo Neptune
        </div>
        <div style="display:flex;gap:4px;flex-wrap:wrap">
          <button class="form-btn form-btn-sm" data-ripple style="font-size:0.72rem" onclick="sendGcode('G28')">Home All</button>
          <button class="form-btn form-btn-sm" data-ripple style="font-size:0.72rem" onclick="sendGcode('BED_MESH_CALIBRATE')">Bed Mesh</button>
          <button class="form-btn form-btn-sm" data-ripple style="font-size:0.72rem" onclick="sendGcode('SHAPER_CALIBRATE')">Input Shaper</button>
          <button class="form-btn form-btn-sm" data-ripple style="font-size:0.72rem" onclick="sendGcode('PID_CALIBRATE HEATER=extruder TARGET=210')">PID Nozzle</button>
          <button class="form-btn form-btn-sm" data-ripple style="font-size:0.72rem" onclick="sendGcode('PID_CALIBRATE HEATER=heater_bed TARGET=60')">PID Bed</button>
          <button class="form-btn form-btn-sm" data-ripple style="font-size:0.72rem" onclick="sendGcode('LOAD_FILAMENT')">Load Filament</button>
          <button class="form-btn form-btn-sm" data-ripple style="font-size:0.72rem" onclick="sendGcode('UNLOAD_FILAMENT')">Unload Filament</button>
        </div>
      </div>`;
    }

    // QIDI: Chamber control + calibration
    if (caps.qidiFeatures) {
      html += `<div class="ctrl-card">
        <div class="ctrl-card-title">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="2" width="20" height="20" rx="3"/><line x1="9" y1="2" x2="9" y2="22"/></svg>
          QIDI Controls
        </div>
        <div style="display:flex;gap:4px;flex-wrap:wrap">
          <button class="form-btn form-btn-sm" data-ripple style="font-size:0.72rem" onclick="sendGcode('G28')">Home All</button>
          <button class="form-btn form-btn-sm" data-ripple style="font-size:0.72rem" onclick="sendGcode('Z_TILT_ADJUST')">Z-Tilt Align</button>
          <button class="form-btn form-btn-sm" data-ripple style="font-size:0.72rem" onclick="sendGcode('BED_MESH_CALIBRATE')">Bed Mesh</button>
          <button class="form-btn form-btn-sm" data-ripple style="font-size:0.72rem" onclick="sendGcode('SHAPER_CALIBRATE')">Input Shaper</button>
          <button class="form-btn form-btn-sm" data-ripple style="font-size:0.72rem" onclick="sendGcode('SET_HEATER_TEMPERATURE HEATER=chamber TARGET=50')">Chamber 50°C</button>
          <button class="form-btn form-btn-sm" data-ripple style="font-size:0.72rem" onclick="sendGcode('SET_HEATER_TEMPERATURE HEATER=chamber TARGET=0')">Chamber Off</button>
          <button class="form-btn form-btn-sm" data-ripple style="font-size:0.72rem" onclick="sendGcode('PID_CALIBRATE HEATER=extruder TARGET=250')">PID Nozzle</button>
        </div>
      </div>`;
    }

    // AnkerMake controls
    if (caps.ankerFeatures) {
      html += `<div class="ctrl-card">
        <div class="ctrl-card-title">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10"/></svg>
          AnkerMake Controls
        </div>
        <div style="display:flex;gap:4px;flex-wrap:wrap">
          <button class="form-btn form-btn-sm" data-ripple style="font-size:0.72rem" onclick="sendGcode('G28')">Home All</button>
          <button class="form-btn form-btn-sm" data-ripple style="font-size:0.72rem" onclick="sendGcode('BED_MESH_CALIBRATE')">Bed Mesh</button>
          <button class="form-btn form-btn-sm" data-ripple style="font-size:0.72rem" onclick="sendGcode('SHAPER_CALIBRATE')">Input Shaper</button>
          <button class="form-btn form-btn-sm" data-ripple style="font-size:0.72rem" onclick="sendGcode('PID_CALIBRATE HEATER=extruder TARGET=210')">PID Nozzle</button>
        </div>
      </div>`;
    }

    // ===== CARD: Klipper Macros (Moonraker printers) =====
    if (meta?.type === 'moonraker' || meta?.type === 'klipper' || meta?.type === 'creality' || meta?.type === 'elegoo' || meta?.type === 'voron') {
      html += `<div class="ctrl-card">
        <div class="ctrl-card-title" style="display:flex;align-items:center;justify-content:space-between">
          <span style="display:flex;align-items:center;gap:6px">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="4 17 10 11 4 5"/><line x1="12" y1="19" x2="20" y2="19"/></svg>
            Klipper Macros
          </span>
          <button class="form-btn form-btn-sm" style="font-size:0.65rem;padding:2px 6px" data-ripple onclick="window._loadKlipperMacros('${esc(meta?.id || '')}')">Load</button>
        </div>
        <div id="ctrl-klipper-macros" style="max-height:200px;overflow-y:auto">
          <span class="text-muted" style="font-size:0.75rem">Click Load to fetch available macros</span>
        </div>
      </div>`;
    }

    // ===== CARD: AMS Drying (Bambu only) =====
    if (caps.amsType && meta?.type !== 'moonraker') {
      const amsData = data.ams;
      const isDrying = amsData?.ams?.[0]?.drying?.status === 1;
      html += `<div class="ctrl-card ctrl-area-amsdry">
        <div class="ctrl-card-title">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2.69l5.66 5.66a8 8 0 11-11.31 0z"/></svg>
          AMS Drying
          ${isDrying ? '<span class="ctrl-card-badge" style="background:var(--accent-green)">Active</span>' : ''}
        </div>
        <div style="display:flex;gap:8px;align-items:end;flex-wrap:wrap">
          <div style="flex:1;min-width:80px">
            <label style="font-size:0.75rem;color:var(--text-muted);display:block;margin-bottom:2px">AMS</label>
            <select class="form-input" id="ams-dry-id" style="font-size:0.82rem">
              <option value="0">AMS 1</option>
              <option value="1">AMS 2</option>
              <option value="2">AMS 3</option>
              <option value="3">AMS 4</option>
            </select>
          </div>
          <div style="flex:1;min-width:80px">
            <label style="font-size:0.75rem;color:var(--text-muted);display:block;margin-bottom:2px">Temp (°C)</label>
            <input type="number" class="form-input" id="ams-dry-temp" value="55" min="35" max="70" step="5" style="font-size:0.82rem">
          </div>
          <div style="flex:1;min-width:80px">
            <label style="font-size:0.75rem;color:var(--text-muted);display:block;margin-bottom:2px">Duration (h)</label>
            <input type="number" class="form-input" id="ams-dry-dur" value="4" min="1" max="24" step="1" style="font-size:0.82rem">
          </div>
          <div style="display:flex;gap:4px">
            <button class="form-btn form-btn-sm" data-ripple style="background:var(--accent-green);color:#fff" onclick="window._startAmsDry()">Start</button>
            <button class="form-btn form-btn-sm" data-ripple style="background:var(--accent-red);color:#fff" onclick="window._stopAmsDry()">Stop</button>
          </div>
        </div>
        <div style="margin-top:6px;display:flex;gap:6px;flex-wrap:wrap">
          <button class="ctrl-preset-btn" data-ripple onclick="document.getElementById('ams-dry-temp').value=45;document.getElementById('ams-dry-dur').value=4">PLA (45°C/4h)</button>
          <button class="ctrl-preset-btn" data-ripple onclick="document.getElementById('ams-dry-temp').value=55;document.getElementById('ams-dry-dur').value=6">PETG (55°C/6h)</button>
          <button class="ctrl-preset-btn" data-ripple onclick="document.getElementById('ams-dry-temp').value=65;document.getElementById('ams-dry-dur').value=8">ABS (65°C/8h)</button>
          <button class="ctrl-preset-btn" data-ripple onclick="document.getElementById('ams-dry-temp').value=50;document.getElementById('ams-dry-dur').value=6">TPU (50°C/6h)</button>
        </div>
      </div>`;
    }

    // ===== Snapmaker U1: Filament + Defect + Config panels =====
    if (data._sm_filament || data._sm_feed_channels) {
      html += typeof renderSmFilamentPanel === 'function' ? renderSmFilamentPanel(data, meta?.id) : '';
    }
    if (data._sm_defect || data._sm_timelapse !== undefined || data._sm_print_config || data._sm_power) {
      html += typeof renderSmAdvancedPanel === 'function' ? renderSmAdvancedPanel(data) : '';
    }
    if (data._sm_print_config || data._sm_flow_cal) {
      html += typeof renderSmCalibrationPanel === 'function' ? renderSmCalibrationPanel(data) : '';
    }

    // ===== Bed Mesh Heatmap (Klipper) =====
    if (data._bed_mesh?.meshMatrix?.length) {
      html += typeof renderBedMeshPanel === 'function' ? renderBedMeshPanel(data) : '';
    }

    // ===== Klipper Extras (Power, ERCF/AFC, System, Diagnostics) =====
    if (data._detected_brand || data._ercf || data._afc || data._system_temps || data._tmc || data._mcu ||
        data._input_shaper || data._filament_sensor || data._nevermore || data._powerDevices || data._pluginData?.psucontrol) {
      html += typeof renderKlipperExtrasPanel === 'function' ? renderKlipperExtrasPanel(data) : '';
    }

    // ===== Bambu Extras (Fans, Prepare, WiFi, Camera, Lights, Speed Level) =====
    if (data._fan_part !== undefined || data._fan_aux !== undefined || data._wifi_rssi ||
        data._camera_state || data._lights || data._speed_level !== undefined || data._prepare_percent > 0 || data._upgrade?.status) {
      html += typeof renderBambuExtrasPanel === 'function' ? renderBambuExtrasPanel(data) : '';
    }

    // ===== CARD: Bambu Calibration (Bambu only) =====
    if (meta?.type !== 'moonraker' && meta?.type !== 'prusalink') {
      html += `<div class="ctrl-card">
        <div class="ctrl-card-title">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/></svg>
          Calibration
        </div>
        <div style="display:flex;gap:4px;flex-wrap:wrap">
          <button class="form-btn form-btn-sm" data-ripple style="font-size:0.72rem" onclick="sendCommand('calibration',{bedLeveling:true})">Bed Leveling</button>
          <button class="form-btn form-btn-sm" data-ripple style="font-size:0.72rem" onclick="sendCommand('calibration',{vibration:true})">Vibration</button>
          <button class="form-btn form-btn-sm" data-ripple style="font-size:0.72rem" onclick="sendCommand('calibration',{motorNoise:true})">Motor Noise</button>
          <button class="form-btn form-btn-sm" data-ripple style="font-size:0.72rem" onclick="sendCommand('pa_calibration',{mode:0})">PA Auto</button>
          <button class="form-btn form-btn-sm" data-ripple style="font-size:0.72rem" onclick="sendCommand('flow_calibration',{tray_index:0,nozzle_temp:220,bed_temp:60})">Flow Cal</button>
        </div>
      </div>`;

      // Camera controls
      html += `<div class="ctrl-card">
        <div class="ctrl-card-title">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/><circle cx="12" cy="13" r="4"/></svg>
          Camera
        </div>
        <div style="display:flex;gap:4px;flex-wrap:wrap">
          <button class="form-btn form-btn-sm" data-ripple style="font-size:0.72rem" onclick="sendCommand('camera_record',{enable:true})">Start Recording</button>
          <button class="form-btn form-btn-sm" data-ripple style="font-size:0.72rem" onclick="sendCommand('camera_record',{enable:false})">Stop Recording</button>
          <button class="form-btn form-btn-sm" data-ripple style="font-size:0.72rem" onclick="sendCommand('camera_timelapse',{enable:true})">Timelapse On</button>
          <button class="form-btn form-btn-sm" data-ripple style="font-size:0.72rem" onclick="sendCommand('camera_timelapse',{enable:false})">Timelapse Off</button>
          <button class="form-btn form-btn-sm" data-ripple style="font-size:0.72rem" onclick="sendCommand('camera_resolution',{resolution:'1080p'})">1080p</button>
          <button class="form-btn form-btn-sm" data-ripple style="font-size:0.72rem" onclick="sendCommand('camera_resolution',{resolution:'720p'})">720p</button>
        </div>
      </div>`;

      // System controls
      html += `<div class="ctrl-card">
        <div class="ctrl-card-title">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06"/></svg>
          System
        </div>
        <div style="display:flex;gap:4px;flex-wrap:wrap">
          <button class="form-btn form-btn-sm" data-ripple style="font-size:0.72rem" onclick="sendCommand('stop_buzzer')">Stop Buzzer</button>
          <button class="form-btn form-btn-sm" data-ripple style="font-size:0.72rem" onclick="sendCommand('set_auto_recovery',{enable:true})">Auto Recovery On</button>
          <button class="form-btn form-btn-sm" data-ripple style="font-size:0.72rem" onclick="sendCommand('set_auto_recovery',{enable:false})">Auto Recovery Off</button>
          <button class="form-btn form-btn-sm" data-ripple style="font-size:0.72rem" onclick="sendCommand('set_door_check',{enable:true})">Door Check On</button>
          <button class="form-btn form-btn-sm" data-ripple style="font-size:0.72rem" onclick="sendCommand('set_door_check',{enable:false})">Door Check Off</button>
        </div>
      </div>`;
    }

    // ===== Snapmaker U1: Status badge override =====
    if (data._sm_state_label && typeof renderSmStatusBadge === 'function') {
      // Will be applied after DOM render via setTimeout
      setTimeout(() => {
        const badge = document.getElementById('ctrl-stage-badge');
        if (badge) badge.innerHTML = renderSmStatusBadge(data);
      }, 10);
    }

    // ===== CARD: Storage Files (SD/USB depending on model) =====
    if (meta?.id) {
      const _isUsbModel = ['P2S', 'P2S Combo', 'H2D'].includes(meta.model);
      const _storageLabel = _isUsbModel ? t('controls.usb_files', 'USB Files') : t('controls.sd_files');
      html += `<div class="ctrl-card ctrl-area-files">
        <div class="ctrl-card-title" style="display:flex;align-items:center;justify-content:space-between">
          <span style="display:flex;align-items:center;gap:6px">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/></svg>
            ${_storageLabel}
          </span>
          <div style="display:flex;gap:4px">
            <button class="form-btn form-btn-sm" data-ripple onclick="showFileUpload('${esc(meta.id)}')">${t('controls.upload_file')}</button>
            <button class="form-btn form-btn-sm" data-ripple onclick="loadPrinterFiles('${esc(meta.id)}')">${t('controls.refresh')}</button>
            <button class="form-btn form-btn-sm" style="color:var(--accent-red)" data-ripple onclick="formatStorage('${esc(meta.id)}')" title="${_isUsbModel ? t('controls.format_usb', 'Format USB') : t('controls.format_sd', 'Format SD')}">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
            </button>
          </div>
        </div>
        <div id="ctrl-upload-area" style="display:none"></div>
        <div id="ctrl-files-list"><span class="text-muted" style="font-size:0.8rem">${t('controls.sd_click_refresh')}</span></div>
      </div>`;
    }

    html += '</div>'; // close .ctrl-layout
    container.innerHTML = html;
    _rendered = true;
    _renderedForPrinter = window.printerState?.getActivePrinterId() || null;
    // Load macros now that DOM is ready
    loadMacros();
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

    const stageBadge = container.querySelector('#ctrl-stage-badge');
    if (stageBadge && typeof renderStageBadge === 'function') stageBadge.innerHTML = renderStageBadge(data.stg_cur);

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
    const pct = fanPercent(rawSpeed);
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
    const activePrinter = window.printerState?.getActivePrinterId();
    const printerChanged = _renderedForPrinter !== null && _renderedForPrinter !== activePrinter;

    const miniContainer = document.getElementById('controls-content');
    if (miniContainer) renderControls(miniContainer, data);
    const panelContainer = document.getElementById('controls-panel-content');
    if (panelContainer) {
      if (!_rendered || !panelContainer.hasChildNodes() || printerChanged) {
        _rendered = false; // Force full re-render
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
    // Use _lastData, or fall back to cached printer state
    let data = _lastData;
    if (!data && window.printerState?.getActivePrinterId()) {
      const s = window.printerState.getActivePrinterState();
      if (s) data = s.print || s;
    }
    if (data && Object.keys(data).length > 0) {
      renderControls(document.getElementById('controls-panel-content'), data);
    } else if (!window.printerState?.getActivePrinterId()) {
      document.getElementById('controls-panel-content').innerHTML = `<div style="text-align:center;padding:3rem 1rem">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" stroke-width="1.5" style="margin-bottom:1rem"><rect x="6" y="2" width="12" height="8" rx="1"/><rect x="4" y="10" width="16" height="10" rx="1"/><circle cx="8" cy="15" r="1"/><line x1="12" y1="15" x2="18" y2="15"/></svg>
        <h3 style="margin:0 0 0.5rem;color:var(--text-primary)">${t('common.no_printers_title')}</h3>
        <p class="text-muted" style="margin:0 0 1rem">${t('common.no_printers_desc')}</p>
        <button class="form-btn" onclick="location.hash='#settings'">${t('common.add_printer_btn')}</button>
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
    const speed = parseInt(pct) / 100;
    // Klipper fan_generic objects use SET_FAN_SPEED
    if (fanParam === 'cavity_fan' || fanParam === 'purifier') {
      sendCommand('gcode', { gcode: `SET_FAN_SPEED FAN=${fanParam} SPEED=${speed.toFixed(2)}` });
    } else {
      const sVal = Math.round(speed * 255);
      sendCommand('gcode', { gcode: `M106 ${fanParam} S${sVal}` });
    }
  };

  window.setTemp = function(gcode, temp) {
    const val = parseInt(temp);
    if (isNaN(val) || val < 0) return;
    const meta = window.printerState?.getActivePrinterMeta();
    if (meta?.type === 'moonraker' && gcode.startsWith('M104')) {
      // Klipper: use SET_HEATER_TEMPERATURE for proper multi-extruder support
      const tMatch = gcode.match(/T(\d+)/);
      const heater = tMatch ? `extruder${tMatch[1]}` : 'extruder';
      sendCommand('gcode', { gcode: `SET_HEATER_TEMPERATURE HEATER=${heater} TARGET=${val}` });
    } else if (meta?.type === 'moonraker' && gcode === 'M140') {
      sendCommand('gcode', { gcode: `SET_HEATER_TEMPERATURE HEATER=heater_bed TARGET=${val}` });
    } else {
      sendCommand('gcode', { gcode: `${gcode} S${val}` });
    }
  };

  window.applyTempPreset = function(nozzle, bed) {
    sendCommand('gcode', { gcode: `M104 S${nozzle}` });
    sendCommand('gcode', { gcode: `M140 S${bed}` });
  };

  function appendGcodeHistory(cmd, isUser) {
    const hist = document.getElementById('gcode-history');
    if (!hist) return;
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const line = document.createElement('div');
    line.className = 'ctrl-gcode-line' + (isUser ? ' ctrl-gcode-user' : '');
    line.innerHTML = `<span class="ctrl-gcode-time">${time}</span><span class="ctrl-gcode-cmd">${cmd.replace(/\\n/g, ' → ')}</span>`;
    hist.appendChild(line);
    hist.scrollTop = hist.scrollHeight;
    // Keep max 50 lines
    while (hist.children.length > 50) hist.removeChild(hist.firstChild);
  }

  window.sendGcode = function(gcode) {
    sendCommand('gcode', { gcode });
    appendGcodeHistory(gcode, false);
  };

  window._quickGcode = function(cmds) {
    const lines = cmds.split('\\n');
    for (const line of lines) {
      if (line.trim()) {
        sendCommand('gcode', { gcode: line.trim() });
      }
    }
    appendGcodeHistory(cmds.replace(/\\n/g, ' → '), false);
  };

  window.sendGcodeInput = function() {
    const input = document.getElementById('gcode-input');
    if (!input || !input.value.trim()) return;
    const cmd = input.value.trim();
    sendCommand('gcode', { gcode: cmd });
    appendGcodeHistory(cmd, true);
    input.value = '';
    input.focus();
  };

  window.confirmStop = function() {
    return confirmAction(t('controls.confirm_stop'), () => {
      sendCommand('stop');
    }, { danger: true });
  };

  window._loadKlipperMacros = async function(printerId) {
    const el = document.getElementById('ctrl-klipper-macros');
    if (!el) return;
    el.innerHTML = '<span class="text-muted" style="font-size:0.75rem">Loading macros...</span>';
    try {
      const res = await fetch(`/api/printers/${encodeURIComponent(printerId)}/macros`);
      const data = await res.json();
      if (!data.macros?.length) { el.innerHTML = '<span class="text-muted" style="font-size:0.75rem">No macros found</span>'; return; }
      let h = `<div style="font-size:0.68rem;color:var(--text-muted);margin-bottom:4px">${data.total} macros available</div>`;
      h += '<div style="display:flex;flex-wrap:wrap;gap:3px">';
      for (const m of data.macros) {
        const isCommon = /^(PRINT_START|PRINT_END|CANCEL_PRINT|PAUSE|RESUME|G28|G29|BED_MESH|SHAPER|CLEAN|HOME)/.test(m);
        h += `<button class="form-btn form-btn-sm" style="font-size:0.62rem;padding:1px 5px;${isCommon ? 'background:var(--accent-blue);color:#fff' : ''}" data-ripple onclick="window._runKlipperMacro('${printerId}','${m}')" title="${m}">${m.length > 20 ? m.slice(0, 18) + '..' : m}</button>`;
      }
      h += '</div>';
      el.innerHTML = h;
    } catch (e) { el.innerHTML = `<span style="color:var(--accent-red);font-size:0.75rem">${e.message}</span>`; }
  };

  window._runKlipperMacro = async function(printerId, macro) {
    try {
      await fetch(`/api/printers/${encodeURIComponent(printerId)}/macros/run`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ macro })
      });
      if (typeof showToast === 'function') showToast(`Running: ${macro}`, 'info');
    } catch (e) { if (typeof showToast === 'function') showToast(e.message, 'error'); }
  };

  window._startAmsDry = function() {
    const amsId = parseInt(document.getElementById('ams-dry-id')?.value) || 0;
    const temp = parseInt(document.getElementById('ams-dry-temp')?.value) || 55;
    const dur = parseInt(document.getElementById('ams-dry-dur')?.value) || 4;
    sendCommand('ams_dry', { ams_id: amsId, temp, duration: dur * 60 });
    if (typeof showToast === 'function') showToast(`AMS ${amsId + 1} drying started: ${temp}°C for ${dur}h`, 'success');
  };

  window._stopAmsDry = function() {
    const amsId = parseInt(document.getElementById('ams-dry-id')?.value) || 0;
    sendCommand('ams_stop_dry', { ams_id: amsId });
    if (typeof showToast === 'function') showToast(`AMS ${amsId + 1} drying stopped`, 'info');
  };

  window.toggleLight = function() {
    const newMode = lightState === 'on' ? 'off' : 'on';
    sendCommand('light', { mode: newMode, node: 'chamber_light' });
    // Update UI immediately (Moonraker printers don't report light state back)
    lightState = newMode;
    const lightBtn = document.getElementById('ctrl-light-btn');
    if (lightBtn) lightBtn.classList.toggle('ctrl-tool-active', newMode === 'on');
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
    } catch { el.innerHTML = `<span class="text-muted">${t('common.error')}</span>`; }
  }

  // loadMacros is called from renderControls after DOM is ready

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
    el.innerHTML = `<span class="text-muted" style="font-size:0.8rem">${t('common.loading')}...</span>`;
    try {
      // Try Moonraker API first, fall back to Bambu FTP API
      const meta = window.printerState?.getActivePrinterMeta();
      let files;
      if (meta?.type === 'moonraker' || meta?.type === 'klipper' || meta?.type === 'prusalink' || meta?.type === 'creality' || meta?.type === 'elegoo' || meta?.type === 'voron') {
        const moonRes = await fetch(`/api/printers/${encodeURIComponent(printerId)}/moonraker/files`);
        const moonData = await moonRes.json();
        files = (moonData.files || []).map(f => ({ name: f.path, path: f.path, size: f.size }));
      } else {
        const res = await fetch(`/api/printers/${encodeURIComponent(printerId)}/files`);
        files = await res.json();
      }
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

  window.formatStorage = function(printerId) {
    const meta = window.printerState?.getActivePrinterMeta?.() || {};
    const isUsb = ['P2S', 'P2S Combo', 'H2D'].includes(meta.model);
    const label = isUsb ? 'USB' : t('controls.sd_card_short', 'SD Card');
    return confirmAction(
      t('controls.format_confirm', { storage: label }) || `Are you sure you want to format ${label}? All files will be permanently deleted.`,
      async () => {
        try {
          const res = await fetch(`/api/printers/${encodeURIComponent(printerId)}/storage/format`, { method: 'POST' });
          const data = await res.json();
          if (data.error) { showToast(data.error, 'error'); return; }
          showToast(t('controls.format_success', { storage: label }) || `${label} formatert`, 'success');
          // Refresh file list
          setTimeout(() => loadPrinterFiles(printerId), 2000);
        } catch (e) { showToast(e.message, 'error'); }
      },
      { danger: true }
    );
  };

  // ═══ Bed Mesh Heatmap ═══
  let _meshHistory = [];
  let _meshSelectedIdx = 0;
  let _meshDiffMode = false;
  let _meshPrinterId = null;

  function _meshColor(z, absMax) {
    // Fixed scale: -absMax (blue) → 0 (green) → +absMax (red)
    const norm = Math.max(-1, Math.min(1, z / Math.max(absMax, 0.001)));
    let r, g, b;
    if (norm < 0) { r = 0; g = Math.round((1 + norm) * 255); b = Math.round(-norm * 255); }
    else { r = Math.round(norm * 255); g = Math.round((1 - norm) * 255); b = 0; }
    return `rgb(${r},${g},${b})`;
  }

  function _drawMeshCanvas(canvasId, mesh, rows, cols, zMin, zMax) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const absMax = Math.max(Math.abs(zMin), Math.abs(zMax), 0.3);
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const z = mesh[r]?.[c] ?? 0;
        ctx.fillStyle = _meshColor(z, absMax);
        ctx.fillRect(c * 40, r * 40, 39, 39);
        ctx.fillStyle = '#fff';
        ctx.font = '10px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(z.toFixed(2), c * 40 + 20, r * 40 + 20);
      }
    }
  }

  function _renderMeshView() {
    const el = document.getElementById('ctrl-bed-mesh');
    if (!el || !_meshHistory.length) return;
    const entry = _meshHistory[_meshSelectedIdx];
    if (!entry) return;
    const mesh = JSON.parse(entry.mesh_data);
    const rows = entry.mesh_rows || mesh.length;
    const cols = entry.mesh_cols || (mesh[0]?.length || 0);
    if (!rows || !cols) { el.innerHTML = '<span class="text-muted" style="font-size:0.8rem">Invalid mesh</span>'; return; }

    // History dropdown
    let html = '<div style="display:flex;gap:8px;align-items:center;margin-bottom:6px;flex-wrap:wrap">';
    html += `<select class="form-input" style="flex:1;min-width:160px;font-size:0.8rem" onchange="window._meshSelectIdx(this.value)">`;
    for (let i = 0; i < _meshHistory.length; i++) {
      const h = _meshHistory[i];
      const label = new Date(h.captured_at).toLocaleString() + (i === 0 ? ` (${t('controls.mesh_latest')})` : '');
      html += `<option value="${i}"${i === _meshSelectedIdx ? ' selected' : ''}>${esc(label)}</option>`;
    }
    html += '</select>';
    if (_meshHistory.length > 1) {
      html += `<label style="font-size:0.8rem;display:flex;align-items:center;gap:4px;cursor:pointer">
        <input type="checkbox" ${_meshDiffMode ? 'checked' : ''} onchange="window._meshToggleDiff(this.checked)">
        ${t('controls.mesh_diff')}
      </label>`;
    }
    html += '</div>';

    const w = cols * 40, h = rows * 40;

    if (_meshDiffMode && _meshHistory.length > 1) {
      // Diff: selected vs oldest (baseline)
      const baseline = _meshHistory[_meshHistory.length - 1];
      const baseMesh = JSON.parse(baseline.mesh_data);
      const diffMesh = [];
      let dMin = Infinity, dMax = -Infinity, dSum = 0, dCount = 0;
      for (let r = 0; r < rows; r++) {
        diffMesh[r] = [];
        for (let c = 0; c < cols; c++) {
          const dz = (mesh[r]?.[c] ?? 0) - (baseMesh[r]?.[c] ?? 0);
          diffMesh[r][c] = dz;
          if (dz < dMin) dMin = dz;
          if (dz > dMax) dMax = dz;
          dSum += dz; dCount++;
        }
      }
      const dMean = dCount ? dSum / dCount : 0;

      html += `<div style="display:flex;gap:12px;flex-wrap:wrap">`;
      html += `<div><div style="font-size:0.75rem;font-weight:600;margin-bottom:2px">${t('controls.mesh_current')}</div>`;
      html += `<canvas id="bed-mesh-canvas-cur" width="${w}" height="${h}" style="border:1px solid var(--border-color);border-radius:4px"></canvas></div>`;
      html += `<div><div style="font-size:0.75rem;font-weight:600;margin-bottom:2px">${t('controls.mesh_diff_label')}</div>`;
      html += `<canvas id="bed-mesh-canvas-diff" width="${w}" height="${h}" style="border:1px solid var(--border-color);border-radius:4px"></canvas></div>`;
      html += '</div>';

      // Diff stats
      html += `<div class="bed-mesh-stats">
        <span>${t('controls.mesh_diff_label')}: ${new Date(baseline.captured_at).toLocaleDateString()} → ${new Date(entry.captured_at).toLocaleDateString()}</span>
        <span>dZ min: ${dMin.toFixed(3)}mm</span>
        <span>dZ max: ${dMax.toFixed(3)}mm</span>
        <span>dZ mean: ${dMean.toFixed(3)}mm</span>
      </div>`;

      el.innerHTML = html;
      _drawMeshCanvas('bed-mesh-canvas-cur', mesh, rows, cols, entry.z_min ?? 0, entry.z_max ?? 0);
      _drawMeshCanvas('bed-mesh-canvas-diff', diffMesh, rows, cols, dMin, dMax);
    } else {
      // Single mesh view
      html += `<div style="overflow:auto"><canvas id="bed-mesh-canvas" width="${w}" height="${h}" style="border:1px solid var(--border-color);border-radius:4px"></canvas></div>`;
      // Stats
      const stdDev = entry.z_std_dev;
      html += `<div class="bed-mesh-stats">
        <span>Z min: <strong>${entry.z_min?.toFixed(3) ?? '--'}mm</strong></span>
        <span>Z max: <strong>${entry.z_max?.toFixed(3) ?? '--'}mm</strong></span>
        <span>Z mean: <strong>${entry.z_mean?.toFixed(3) ?? '--'}mm</strong></span>
        ${stdDev != null ? `<span>StdDev: <strong>${stdDev.toFixed(3)}mm</strong></span>` : ''}
        <span>Range: <strong>${((entry.z_max ?? 0) - (entry.z_min ?? 0)).toFixed(3)}mm</strong></span>
        <span>${rows}x${cols} ${t('controls.mesh_points')}</span>
      </div>`;
      // Color legend
      html += `<div style="display:flex;align-items:center;gap:4px;margin-top:4px;font-size:0.7rem;color:var(--text-secondary)">
        <span style="width:12px;height:12px;background:rgb(0,0,255);border-radius:2px;display:inline-block"></span> ${t('controls.mesh_low')}
        <span style="width:12px;height:12px;background:rgb(0,255,0);border-radius:2px;display:inline-block;margin-left:8px"></span> ${t('controls.mesh_flat')}
        <span style="width:12px;height:12px;background:rgb(255,0,0);border-radius:2px;display:inline-block;margin-left:8px"></span> ${t('controls.mesh_high')}
      </div>`;

      el.innerHTML = html;
      _drawMeshCanvas('bed-mesh-canvas', mesh, rows, cols, entry.z_min ?? 0, entry.z_max ?? 0);
    }
  }

  window._loadBedMesh = async function(printerId) {
    const el = document.getElementById('ctrl-bed-mesh');
    if (!el) return;
    _meshPrinterId = printerId;
    el.innerHTML = `<span class="text-muted" style="font-size:0.8rem">${t('common.loading')}...</span>`;
    try {
      const res = await fetch(`/api/printers/${encodeURIComponent(printerId)}/bed-mesh`);
      const data = await res.json();
      const history = data.history || data;
      if (!history.length) { el.innerHTML = `<span class="text-muted" style="font-size:0.8rem">${t('controls.no_bed_mesh')}</span>`; return; }
      _meshHistory = history;
      _meshSelectedIdx = 0;
      _meshDiffMode = false;
      _renderMeshView();
    } catch (e) { el.innerHTML = `<span class="text-muted" style="font-size:0.8rem">Error: ${esc(e.message)}</span>`; }
  };

  window._meshSelectIdx = function(idx) {
    _meshSelectedIdx = parseInt(idx) || 0;
    _renderMeshView();
  };

  window._meshToggleDiff = function(enabled) {
    _meshDiffMode = enabled;
    _renderMeshView();
  };

  // ═══ Bed Check AI ═══
  window._captureBedCheck = async function(printerId) {
    const el = document.getElementById('ctrl-bed-mesh');
    if (!el) return;
    el.innerHTML = '<span class="text-muted" style="font-size:0.8rem"><span class="spinner" style="width:12px;height:12px;margin-right:4px"></span>Checking bed...</span>';
    try {
      const res = await fetch(`/api/printers/${encodeURIComponent(printerId)}/bed-check`, { method: 'POST' });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      const icon = data.clear ? '&#x2705;' : '&#x274C;';
      const conf = data.confidence ? Math.round(data.confidence * 100) + '%' : '--';
      el.innerHTML = `<div style="font-size:0.85rem;padding:8px">${icon} ${data.clear ? t('controls.bed_clear') : t('controls.bed_not_clear')} <span class="text-muted">(${t('controls.confidence')}: ${conf}, ${data.reason || ''})</span></div>`;
    } catch (e) { el.innerHTML = `<span class="text-muted" style="font-size:0.8rem">Error: ${esc(e.message)}</span>`; }
  };

  window._captureBaseline = async function(printerId) {
    const confirmed = confirm(t('controls.capture_baseline_confirm'));
    if (!confirmed) return;
    const el = document.getElementById('ctrl-bed-mesh');
    if (!el) return;
    el.innerHTML = '<span class="text-muted" style="font-size:0.8rem"><span class="spinner" style="width:12px;height:12px;margin-right:4px"></span>Capturing baseline...</span>';
    try {
      const res = await fetch(`/api/printers/${encodeURIComponent(printerId)}/bed-check/baseline`, { method: 'POST' });
      const data = await res.json();
      if (data.ok) showToast(t('controls.baseline_saved'), 'success');
      else showToast(data.error || 'Error', 'error');
      el.innerHTML = `<span class="text-muted" style="font-size:0.8rem">${data.ok ? t('controls.baseline_saved') : data.error}</span>`;
    } catch (e) { el.innerHTML = `<span class="text-muted" style="font-size:0.8rem">Error: ${esc(e.message)}</span>`; }
  };

  // ═══ Smart Filament Changer ═══
  window._startFilamentChange = async function(printerId) {
    const el = document.getElementById('ctrl-filament-change');
    if (!el) return;
    // Show wizard
    el.innerHTML = `<div class="ctrl-fc-wizard">
      <div style="font-size:0.85rem;margin-bottom:8px">${t('controls.fc_step_init')}</div>
      <div class="form-group" style="display:flex;gap:8px;flex-wrap:wrap">
        <div><label class="form-label">AMS Unit</label><input class="form-input form-input-sm" id="fc-ams-unit" type="number" value="0" min="0" max="3" style="width:60px"></div>
        <div><label class="form-label">Tray</label><input class="form-input form-input-sm" id="fc-ams-tray" type="number" value="0" min="0" max="3" style="width:60px"></div>
        <div><label class="form-label">${t('controls.temp_nozzle')}</label><input class="form-input form-input-sm" id="fc-temp" type="number" value="220" min="150" max="320" style="width:70px"></div>
      </div>
      <div style="display:flex;gap:6px;margin-top:8px">
        <button class="form-btn form-btn-sm" data-ripple onclick="window._doFilamentChange('${esc(printerId)}', 'start')">${t('controls.fc_start')}</button>
      </div>
    </div>`;
  };

  window._doFilamentChange = async function(printerId, step) {
    const el = document.getElementById('ctrl-filament-change');
    if (!el) return;
    const body = { step };
    if (step === 'start') {
      body.ams_unit = parseInt(document.getElementById('fc-ams-unit')?.value) || 0;
      body.ams_tray = parseInt(document.getElementById('fc-ams-tray')?.value) || 0;
      body.temperature = parseInt(document.getElementById('fc-temp')?.value) || 220;
    }
    el.innerHTML = `<div style="font-size:0.8rem"><span class="spinner" style="width:12px;height:12px;margin-right:4px"></span>${t('controls.fc_working')}...</div>`;
    try {
      const res = await fetch(`/api/printers/${encodeURIComponent(printerId)}/change-filament`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      // Show next step
      const nextSteps = { start: 'unload', unload: 'load', load: 'resume' };
      const nextStep = nextSteps[step];
      const stepLabels = {
        unload: t('controls.fc_step_unload'),
        load: t('controls.fc_step_load'),
        resume: t('controls.fc_step_resume')
      };
      if (nextStep) {
        el.innerHTML = `<div style="font-size:0.85rem;margin-bottom:8px">${stepLabels[nextStep]}</div>
          <div style="display:flex;gap:6px">
            <button class="form-btn form-btn-sm" data-ripple onclick="window._doFilamentChange('${esc(printerId)}', '${nextStep}')">${t('controls.fc_next')}: ${stepLabels[nextStep]}</button>
            <button class="form-btn form-btn-sm" data-ripple style="color:var(--text-muted)" onclick="window._startFilamentChange('${esc(printerId)}')">${t('common.cancel')}</button>
          </div>`;
      } else {
        el.innerHTML = `<div style="font-size:0.85rem;color:var(--accent-green)">${t('controls.fc_complete')}</div>`;
        showToast(t('controls.fc_complete'), 'success');
      }
    } catch (e) {
      el.innerHTML = `<div style="font-size:0.8rem;color:var(--accent-red)">Error: ${esc(e.message)}</div>
        <button class="form-btn form-btn-sm" data-ripple style="margin-top:4px" onclick="window._startFilamentChange('${esc(printerId)}')">${t('controls.fc_retry')}</button>`;
    }
  };

  // ═══ File Upload to Printer ═══
  let _uploadPrinterId = null;

  window.showFileUpload = function(printerId) {
    _uploadPrinterId = printerId;
    const area = document.getElementById('ctrl-upload-area');
    if (!area) return;
    const visible = area.style.display !== 'none';
    if (visible) { area.style.display = 'none'; area.innerHTML = ''; return; }
    area.style.display = 'block';
    area.innerHTML = `
      <div class="ctrl-upload-box" id="ctrl-drop-zone">
        <input type="file" id="ctrl-file-input" accept=".3mf,.gcode,.stl,.obj,.step" style="display:none" onchange="handleFileSelect(this)" />
        <div style="text-align:center;padding:16px;cursor:pointer" onclick="document.getElementById('ctrl-file-input').click()">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" stroke-width="1.5"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
          <div style="margin-top:8px;font-size:0.85rem;color:var(--text-muted)">${t('controls.drop_files')}</div>
          <div style="font-size:0.75rem;color:var(--text-muted);margin-top:4px">.3mf, .gcode, .stl, .obj, .step</div>
        </div>
        <div id="ctrl-upload-progress" style="display:none"></div>
      </div>`;
    // Drag-and-drop
    const zone = document.getElementById('ctrl-drop-zone');
    zone.addEventListener('dragover', e => { e.preventDefault(); zone.style.borderColor = 'var(--accent)'; });
    zone.addEventListener('dragleave', () => { zone.style.borderColor = ''; });
    zone.addEventListener('drop', e => {
      e.preventDefault();
      zone.style.borderColor = '';
      if (e.dataTransfer.files.length) _doUpload(e.dataTransfer.files[0]);
    });
  };

  window.handleFileSelect = function(input) {
    if (input.files.length) _doUpload(input.files[0]);
  };

  async function _doUpload(file) {
    const prog = document.getElementById('ctrl-upload-progress');
    if (!prog) return;
    prog.style.display = 'block';
    prog.innerHTML = `<div style="padding:8px;font-size:0.8rem"><span class="spinner" style="width:14px;height:14px;margin-right:6px"></span>${t('controls.uploading')} ${esc(file.name)}...</div>`;

    try {
      // First upload to server
      const params = new URLSearchParams({ filename: file.name, printer_id: _uploadPrinterId || '' });
      const uploadRes = await fetch(`/api/slicer/upload?${params}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/octet-stream' },
        body: file
      });
      const uploadData = await uploadRes.json();
      if (uploadData.error) throw new Error(uploadData.error);

      if (uploadData.needsSlicing) {
        prog.innerHTML = `<div style="padding:8px;font-size:0.8rem"><span class="spinner" style="width:14px;height:14px;margin-right:6px"></span>${t('controls.slicing')} ${esc(file.name)}...</div>`;
        // Poll for slice completion
        await _pollJobStatus(uploadData.jobId, prog, file.name);
      } else {
        // Direct upload to printer
        await _sendToPrinter(uploadData.jobId, prog, file.name);
      }
    } catch (e) {
      prog.innerHTML = `<div style="padding:8px;font-size:0.8rem;color:var(--danger)">${t('controls.upload_failed')}: ${esc(e.message)}</div>`;
    }
  }

  async function _pollJobStatus(jobId, prog, filename) {
    for (let i = 0; i < 120; i++) {
      await new Promise(r => setTimeout(r, 2500));
      const res = await fetch(`/api/slicer/jobs/${jobId}`);
      const job = await res.json();
      if (job.status === 'ready') {
        await _sendToPrinter(jobId, prog, filename);
        return;
      }
      if (job.status === 'error') {
        prog.innerHTML = `<div style="padding:8px;font-size:0.8rem;color:var(--danger)">${t('controls.slice_failed')}: ${esc(job.error_message || 'Unknown')}</div>`;
        return;
      }
    }
    prog.innerHTML = `<div style="padding:8px;font-size:0.8rem;color:var(--warning)">${t('controls.slice_timeout')}</div>`;
  }

  async function _sendToPrinter(jobId, prog, filename) {
    if (!_uploadPrinterId) {
      prog.innerHTML = `<div style="padding:8px;font-size:0.8rem;color:var(--success)">${t('controls.upload_complete')}</div>`;
      return;
    }
    prog.innerHTML = `<div style="padding:8px;font-size:0.8rem"><span class="spinner" style="width:14px;height:14px;margin-right:6px"></span>${t('controls.sending_to_printer')}...</div>`;
    try {
      const res = await fetch(`/api/slicer/jobs/${jobId}/upload-to-printer`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ printer_id: _uploadPrinterId })
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      prog.innerHTML = `<div style="padding:8px;font-size:0.8rem;color:var(--success)">${t('controls.upload_complete')} — ${esc(data.filename)}</div>`;
      showToast(t('controls.file_uploaded'), 'success');
      loadPrinterFiles(_uploadPrinterId);
    } catch (e) {
      prog.innerHTML = `<div style="padding:8px;font-size:0.8rem;color:var(--danger)">${t('controls.upload_failed')}: ${esc(e.message)}</div>`;
    }
  }

  // ═══ Layer Pauses ═══
  window._addLayerPause = async function(printerId) {
    const layersInput = document.getElementById('ctrl-lp-layers');
    const reasonInput = document.getElementById('ctrl-lp-reason');
    if (!layersInput?.value?.trim()) { showToast('Enter layer numbers', 'warning'); return; }
    const layers = layersInput.value.split(/[,\s]+/).map(n => parseInt(n.trim())).filter(n => n > 0);
    if (!layers.length) { showToast('Invalid layer numbers', 'warning'); return; }
    try {
      const res = await fetch(`/api/printers/${encodeURIComponent(printerId)}/layer-pauses`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ layer_numbers: layers, reason: reasonInput?.value?.trim() || null })
      });
      if (!res.ok) throw new Error((await res.json()).error || 'Failed');
      layersInput.value = ''; if (reasonInput) reasonInput.value = '';
      showToast(t('controls.layer_pause_added'), 'success');
      _loadLayerPauses(printerId);
    } catch (e) { showToast(e.message, 'error'); }
  };

  window._loadLayerPauses = async function(printerId) {
    const el = document.getElementById('ctrl-layer-pauses-list');
    if (!el) return;
    try {
      const res = await fetch(`/api/printers/${encodeURIComponent(printerId)}/layer-pauses`);
      const pauses = await res.json();
      if (!pauses.length) { el.innerHTML = `<span class="text-muted" style="font-size:0.8rem">${t('controls.no_layer_pauses')}</span>`; return; }
      let h = '';
      for (const p of pauses) {
        const layers = JSON.parse(p.layer_numbers || '[]');
        const triggered = JSON.parse(p.triggered_layers || '[]');
        const layerChips = layers.map(l => {
          const done = triggered.includes(l);
          return `<span style="display:inline-block;padding:1px 6px;border-radius:4px;font-size:0.75rem;${done ? 'background:var(--success);color:#fff;text-decoration:line-through' : 'background:var(--bg-tertiary)'}">${l}</span>`;
        }).join(' ');
        h += `<div style="display:flex;align-items:center;gap:6px;padding:4px 0;border-bottom:1px solid var(--border-subtle)">
          <div style="flex:1;display:flex;flex-wrap:wrap;gap:3px">${layerChips}</div>
          ${p.reason ? `<span class="text-muted" style="font-size:0.75rem;max-width:120px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="${esc(p.reason)}">${esc(p.reason)}</span>` : ''}
          <button class="filament-delete-btn" style="opacity:0.7" onclick="window._deleteLayerPause('${esc(printerId)}', ${p.id})" title="${t('settings.delete')}">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>`;
      }
      el.innerHTML = h;
    } catch { el.innerHTML = `<span class="text-muted">${t('common.error')}</span>`; }
  };

  window._deleteLayerPause = async function(printerId, pauseId) {
    try {
      await fetch(`/api/printers/${encodeURIComponent(printerId)}/layer-pauses/${pauseId}`, { method: 'DELETE' });
      _loadLayerPauses(printerId);
    } catch (e) { showToast(e.message, 'error'); }
  };

  // Auto-load layer pauses when panel opens during print
  setTimeout(() => {
    const meta = window.printerState?.getActivePrinterMeta();
    if (meta?.id && document.getElementById('ctrl-layer-pauses-list')) {
      _loadLayerPauses(meta.id);
    }
  }, 200);

  // ═══ Z-Offset Calibration Wizard ═══
  let _zBabyStep = 0;

  window._zWizardHome = function() {
    sendGcode('G28');
    showToast(t('controls.z_homing'), 'info');
  };

  window._zWizardLevel = function() {
    sendGcode('G29');
    showToast(t('controls.z_leveling'), 'info');
  };

  window._zWizardAdjust = function(offset) {
    _zBabyStep += offset;
    sendGcode(`G91\nG0 Z${offset} F300\nG90`);
    const el = document.getElementById('ctrl-z-offset-val');
    if (el) el.textContent = _zBabyStep.toFixed(2) + ' mm';
  };

  window._zWizardReset = function() {
    _zBabyStep = 0;
    const el = document.getElementById('ctrl-z-offset-val');
    if (el) el.textContent = '0.00 mm';
  };
})();
