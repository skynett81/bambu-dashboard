/**
 * Klipper Extras Panel — Power devices, ERCF/AFC MMU, System management,
 * Diagnostics, Input Shaper, Nevermore, Filament Sensor
 *
 * Renders additional controls for Klipper-based printers based on
 * available state data. Each section only shows if the data exists.
 */
(function() {
  'use strict';

  /**
   * Render all Klipper extra panels
   */
  window.renderKlipperExtrasPanel = function(data) {
    let html = '';

    // ── Power Device Control (smart plugs, GPIO, relays) ──
    html += _renderPowerDevices(data);

    // ── ERCF / AFC MMU Visualization ──
    html += _renderErcfAfc(data);

    // ── System / Service Management ──
    html += _renderSystemPanel(data);

    // ── Diagnostics (MCU, TMC, CPU, sensors) ──
    html += _renderDiagnostics(data);

    // ── Input Shaper ──
    html += _renderInputShaper(data);

    // ── Filament Sensor ──
    html += _renderFilamentSensor(data);

    // ── Nevermore Filter ──
    html += _renderNevermore(data);

    return html;
  };

  // ── Power Device Control ──
  function _renderPowerDevices(data) {
    // Show if printer has powerDevice config or PSU plugin
    if (!data._powerDevices && !data._pluginData?.psucontrol) return '';

    let html = `<div class="ctrl-card">
      <div class="ctrl-card-title">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18.36 6.64A9 9 0 015.64 18.36M19.78 10.22A7 7 0 1113.78 4.22"/><line x1="12" y1="2" x2="12" y2="12"/></svg>
        Power Control
      </div>`;

    // Moonraker power devices
    if (data._powerDevices) {
      for (const dev of data._powerDevices) {
        const isOn = dev.status === 'on';
        html += `<div style="display:flex;align-items:center;justify-content:space-between;padding:6px 8px;background:var(--bg-inset);border-radius:6px;margin-bottom:4px">
          <span style="font-size:0.78rem;font-weight:500">${dev.device || dev.name}</span>
          <div style="display:flex;gap:4px">
            <button class="form-btn form-btn-sm ${isOn ? '' : 'form-btn-secondary'}" style="font-size:0.65rem;padding:2px 8px" data-ripple onclick="sendCommand('power_on',{device:'${dev.device}'})">ON</button>
            <button class="form-btn form-btn-sm ${isOn ? 'form-btn-secondary' : 'form-btn-danger'}" style="font-size:0.65rem;padding:2px 8px" data-ripple onclick="sendCommand('power_off',{device:'${dev.device}'})">OFF</button>
          </div>
        </div>`;
      }
    }

    // OctoPrint PSU Control
    if (data._pluginData?.psucontrol) {
      const psu = data._pluginData.psucontrol;
      const isOn = psu.isPSUOn;
      html += `<div style="display:flex;align-items:center;justify-content:space-between;padding:6px 8px;background:var(--bg-inset);border-radius:6px">
        <span style="font-size:0.78rem;font-weight:500">PSU <span style="color:${isOn ? 'var(--accent-green)' : 'var(--accent-red)'}">${isOn ? '● ON' : '○ OFF'}</span></span>
        <div style="display:flex;gap:4px">
          <button class="form-btn form-btn-sm" style="font-size:0.65rem;padding:2px 8px" data-ripple onclick="sendCommand('psu_on')">ON</button>
          <button class="form-btn form-btn-sm form-btn-danger" style="font-size:0.65rem;padding:2px 8px" data-ripple onclick="sendCommand('psu_off')">OFF</button>
        </div>
      </div>`;
    }

    html += '</div>';
    return html;
  }

  // ── ERCF / AFC Multi-Filament Visualization ──
  function _renderErcfAfc(data) {
    if (!data._ercf && !data._afc) return '';

    let html = `<div class="ctrl-card">
      <div class="ctrl-card-title">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/><path d="M12 2v4m0 12v4"/></svg>
        ${data._ercf ? 'ERCF Multi-Filament' : 'AFC Filament Changer'}
      </div>`;

    if (data._ercf) {
      const e = data._ercf;
      html += `<div style="font-size:0.72rem;margin-bottom:6px">
        <span>Tool: <strong>T${e.tool ?? '?'}</strong></span> ·
        <span>Gate: <strong>${e.gate ?? '?'}</strong></span> ·
        <span>Action: <strong>${e.action}</strong></span> ·
        <span>${e.isHomed ? '✅ Homed' : '⚠ Not homed'}</span>
      </div>`;

      // Gate visualization
      if (e.gateStatus?.length) {
        html += '<div style="display:flex;gap:3px;flex-wrap:wrap">';
        for (let i = 0; i < e.numGates; i++) {
          const status = e.gateStatus[i] ?? 0;
          const color = e.gateColor?.[i] || '#888';
          const isActive = e.gate === i;
          const label = status === 0 ? 'Empty' : status === 1 ? 'Loaded' : status === 2 ? 'Available' : '?';
          html += `<div style="width:36px;text-align:center;padding:4px 2px;border-radius:6px;border:2px solid ${isActive ? 'var(--accent-green)' : 'transparent'};background:var(--bg-inset)">
            <div style="width:16px;height:16px;border-radius:50%;background:${color};margin:0 auto 2px;border:1px solid rgba(255,255,255,0.2)"></div>
            <div style="font-size:0.6rem;font-weight:${isActive ? '700' : '400'}">${i}</div>
            <div style="font-size:0.5rem;color:var(--text-muted)">${label}</div>
          </div>`;
        }
        html += '</div>';
      }
    }

    if (data._afc) {
      const a = data._afc;
      html += `<div style="font-size:0.72rem">
        <span>Lane: <strong>${a.currentLane ?? '?'}</strong></span> ·
        <span>Status: <strong>${a.status}</strong></span>
      </div>`;
      if (a.lanes?.length) {
        html += '<div style="display:flex;gap:3px;margin-top:4px">';
        for (let i = 0; i < a.lanes.length; i++) {
          const lane = a.lanes[i];
          html += `<div style="padding:4px 8px;border-radius:4px;background:var(--bg-inset);font-size:0.65rem">
            Lane ${i}: ${lane.status || 'idle'}
          </div>`;
        }
        html += '</div>';
      }
    }

    html += '</div>';
    return html;
  }

  // ── System Management ──
  function _renderSystemPanel(data) {
    if (!data._detected_brand && !data._pluginData) return '';

    let html = `<div class="ctrl-card">
      <div class="ctrl-card-title">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
        System
      </div>
      <div style="display:flex;gap:4px;flex-wrap:wrap">`;

    // Klipper services
    if (data._detected_brand || data._mcu) {
      html += `<button class="form-btn form-btn-sm" style="font-size:0.65rem" data-ripple onclick="sendCommand('service_restart',{service:'klipper'})">Restart Klipper</button>`;
      html += `<button class="form-btn form-btn-sm" style="font-size:0.65rem" data-ripple onclick="sendCommand('service_restart',{service:'moonraker'})">Restart Moonraker</button>`;
      html += `<button class="form-btn form-btn-sm form-btn-secondary" style="font-size:0.65rem" data-ripple onclick="if(confirm('Reboot printer OS?')) sendCommand('system_reboot')">Reboot</button>`;
      html += `<button class="form-btn form-btn-sm form-btn-danger" style="font-size:0.65rem" data-ripple onclick="if(confirm('Shutdown printer OS?')) sendCommand('system_shutdown')">Shutdown</button>`;
    }

    // OctoPrint system
    if (data._installedPlugins) {
      html += `<button class="form-btn form-btn-sm" style="font-size:0.65rem" data-ripple onclick="sendCommand('system_restart')">Restart OctoPrint</button>`;
      html += `<button class="form-btn form-btn-sm form-btn-secondary" style="font-size:0.65rem" data-ripple onclick="if(confirm('Reboot host?')) sendCommand('system_reboot')">Reboot</button>`;
      html += `<button class="form-btn form-btn-sm form-btn-danger" style="font-size:0.65rem" data-ripple onclick="if(confirm('Shutdown host?')) sendCommand('system_shutdown')">Shutdown</button>`;
    }

    html += '</div></div>';
    return html;
  }

  // ── Diagnostics ──
  function _renderDiagnostics(data) {
    if (!data._system_temps && !data._tmc && !data._mcu) return '';

    let html = `<div class="ctrl-card">
      <div class="ctrl-card-title">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20V10m0 0l-3 3m3-3l3 3M6.3 6.3a8 8 0 0111.4 0"/></svg>
        Diagnostics
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;font-size:0.72rem">`;

    // System temps (MCU, RPi)
    if (data._system_temps) {
      for (const [key, val] of Object.entries(data._system_temps)) {
        const label = key === 'mcu_temp' ? 'MCU' : key === 'raspberry_pi' ? 'RPi' : key;
        const color = val.temp > 70 ? 'var(--accent-red)' : val.temp > 55 ? 'var(--accent-orange)' : 'var(--accent-green)';
        html += `<div style="padding:4px 8px;background:var(--bg-inset);border-radius:4px">
          <span class="text-muted">${label}:</span> <span style="color:${color};font-weight:600">${val.temp}°C</span>
        </div>`;
      }
    }

    // TMC drivers
    if (data._tmc) {
      for (const [name, val] of Object.entries(data._tmc)) {
        html += `<div style="padding:4px 8px;background:var(--bg-inset);border-radius:4px">
          <span class="text-muted">${name}:</span> ${val.temperature ? `<span>${Math.round(val.temperature)}°C</span>` : ''} ${val.run_current ? `${val.run_current}A` : ''}
        </div>`;
      }
    }

    // MCU info
    if (data._mcu?.mcuVersion) {
      html += `<div style="grid-column:span 2;padding:4px 8px;background:var(--bg-inset);border-radius:4px">
        <span class="text-muted">MCU:</span> ${data._mcu.mcuVersion}
      </div>`;
    }

    // Pressure advance
    if (data._pressure_advance !== undefined) {
      html += `<div style="padding:4px 8px;background:var(--bg-inset);border-radius:4px">
        <span class="text-muted">PA:</span> <span style="font-weight:600">${data._pressure_advance}</span>
      </div>`;
    }

    // QGL / Z-tilt
    if (data._qgl) {
      html += `<div style="padding:4px 8px;background:var(--bg-inset);border-radius:4px">
        <span class="text-muted">QGL:</span> ${data._qgl.applied ? '✅ Applied' : '⚠ Not applied'}
      </div>`;
    }

    html += '</div></div>';
    return html;
  }

  // ── Input Shaper ──
  function _renderInputShaper(data) {
    if (!data._input_shaper) return '';
    const is = data._input_shaper;
    return `<div class="ctrl-card">
      <div class="ctrl-card-title">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
        Input Shaper
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;font-size:0.72rem">
        <div style="padding:4px 8px;background:var(--bg-inset);border-radius:4px">
          <span class="text-muted">X:</span> ${is.shaperTypeX || '?'} @ <strong>${is.shaperFreqX?.toFixed(1) || '?'}</strong> Hz
        </div>
        <div style="padding:4px 8px;background:var(--bg-inset);border-radius:4px">
          <span class="text-muted">Y:</span> ${is.shaperTypeY || '?'} @ <strong>${is.shaperFreqY?.toFixed(1) || '?'}</strong> Hz
        </div>
      </div>
      <button class="form-btn form-btn-sm" style="margin-top:6px;font-size:0.65rem" data-ripple onclick="sendGcode('SHAPER_CALIBRATE')">Recalibrate</button>
    </div>`;
  }

  // ── Filament Sensor ──
  function _renderFilamentSensor(data) {
    if (!data._filament_sensor) return '';
    const fs = data._filament_sensor;
    return `<div style="display:flex;align-items:center;gap:8px;padding:6px 10px;background:var(--bg-inset);border-radius:6px;font-size:0.72rem;margin-bottom:6px">
      <span style="width:8px;height:8px;border-radius:50%;background:${fs.detected ? 'var(--accent-green)' : 'var(--accent-red)'}"></span>
      Filament: ${fs.detected ? 'Detected' : 'Not detected'} ${fs.enabled ? '' : '(disabled)'}
    </div>`;
  }

  // ── Nevermore Filter ──
  function _renderNevermore(data) {
    if (!data._nevermore) return '';
    return `<div style="display:flex;align-items:center;gap:8px;padding:6px 10px;background:var(--bg-inset);border-radius:6px;font-size:0.72rem;margin-bottom:6px">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2.69l5.66 5.66a8 8 0 11-11.31 0z"/></svg>
      Nevermore: <strong>${data._nevermore.speed}%</strong>
      <button class="form-btn form-btn-sm" style="font-size:0.6rem;padding:1px 6px;margin-left:auto" data-ripple onclick="sendGcode('SET_FAN_SPEED FAN=nevermore_internal SPEED=1.0')">Max</button>
      <button class="form-btn form-btn-sm form-btn-secondary" style="font-size:0.6rem;padding:1px 6px" data-ripple onclick="sendGcode('SET_FAN_SPEED FAN=nevermore_internal SPEED=0')">Off</button>
    </div>`;
  }
})();
