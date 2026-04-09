// Snapmaker U1 — Defect Detection + Timelapse + Print Config panel
(function() {
  'use strict';

  /**
   * Render SM-specific cards for controls panel
   */
  window.renderSmAdvancedPanel = function(data) {
    let html = '';

    // ── Defect Detection ──
    if (data._sm_defect) {
      const d = data._sm_defect;
      html += `<div class="ctrl-card">
        <div class="ctrl-card-title">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v4m0 4h.01"/></svg>
          Defect Detection
          <span style="font-size:0.65rem;padding:1px 6px;border-radius:8px;background:${d.enabled ? 'var(--accent-green)' : 'var(--accent-red)'};color:#fff;margin-left:auto">${d.enabled ? 'ON' : 'OFF'}</span>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-bottom:8px">
          ${_detectorCard('Spaghetti', d.noodle)}
          ${_detectorCard('Clean Bed', d.cleanBed)}
          ${_detectorCard('Residue', d.residue)}
          ${_detectorCard('Nozzle', d.nozzle)}
        </div>
        <div style="display:flex;gap:4px">
          <button class="form-btn form-btn-sm" data-ripple onclick="sendCommand('sm_defect_config',{enable:${!d.enabled}})" style="font-size:0.72rem">${d.enabled ? 'Disable' : 'Enable'} Detection</button>
        </div>
      </div>`;
    }

    // ── Filament Entangle Detection ──
    if (data._sm_entangle) {
      const channels = Object.entries(data._sm_entangle);
      if (channels.length > 0) {
        html += `<div class="ctrl-card">
          <div class="ctrl-card-title">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M8 2v4m8-4v4M3 10h18M5 4h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2z"/></svg>
            Filament Entangle
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px">
            ${channels.map(([key, val]) => {
              const factor = val.detectFactor || 0;
              const pct = Math.round(factor * 100);
              const color = factor > 0.8 ? 'var(--accent-red)' : factor > 0.5 ? 'var(--accent-orange)' : 'var(--accent-green)';
              return `<div style="background:var(--bg-inset);border-radius:6px;padding:6px 8px">
                <div style="font-size:0.72rem;color:var(--text-muted)">Extruder ${key.replace('e','')}</div>
                <div style="display:flex;align-items:center;gap:6px;margin-top:2px">
                  <div class="filament-bar" style="flex:1"><div class="filament-bar-fill" style="width:${pct}%;background:${color}"></div></div>
                  <span style="font-size:0.75rem;font-weight:600;color:${color}">${pct}%</span>
                </div>
              </div>`;
            }).join('')}
          </div>
        </div>`;
      }
    }

    // ── Timelapse ──
    if (data._sm_timelapse !== undefined) {
      const active = data._sm_timelapse?.active;
      html += `<div class="ctrl-card">
        <div class="ctrl-card-title">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          Timelapse
          ${active ? '<span style="font-size:0.65rem;padding:1px 6px;border-radius:8px;background:var(--accent-red);color:#fff;margin-left:auto;animation:sm-pulse 1s infinite alternate">REC</span>' : ''}
        </div>
        <div style="display:flex;gap:4px">
          <button class="form-btn form-btn-sm" data-ripple onclick="sendCommand('sm_timelapse_start')" ${active ? 'disabled' : ''} style="font-size:0.72rem;${active ? 'opacity:0.4' : ''}">Start Recording</button>
          <button class="form-btn form-btn-sm" data-ripple onclick="sendCommand('sm_timelapse_stop')" ${!active ? 'disabled' : ''} style="font-size:0.72rem;${!active ? 'opacity:0.4' : ''}">Stop</button>
          <button class="form-btn form-btn-sm" data-ripple onclick="sendCommand('sm_timelapse_frame')" style="font-size:0.72rem">Capture Frame</button>
        </div>
      </div>`;
    }

    // ── Print Task Config ──
    if (data._sm_print_config) {
      const c = data._sm_print_config;
      html += `<div class="ctrl-card">
        <div class="ctrl-card-title">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 01-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.32 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>
          Print Config
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:4px">
          ${_toggleRow('Auto Bed Leveling', c.autoBedLeveling, 'autoBedLeveling')}
          ${_toggleRow('Flow Calibrate', c.flowCalibrate, 'flowCalibrate')}
          ${_toggleRow('Input Shaper', c.shaperCalibrate, 'shaperCalibrate')}
          ${_toggleRow('Timelapse Camera', c.timelapse, 'timelapse')}
          ${_toggleRow('Auto Replenish', c.autoReplenish)}
          ${_toggleRow('Entangle Detect', c.entangleDetect)}
        </div>
        ${c.entangleSensitivity ? '<div style="font-size:0.65rem;color:var(--text-muted);margin-top:4px">Entangle sensitivity: ' + c.entangleSensitivity + '</div>' : ''}
      </div>`;
    }

    // ── Purifier Maintenance ──
    if (data._purifier) {
      const pur = data._purifier;
      const workHours = pur.work_time ? Math.round(pur.work_time / 3600 * 10) / 10 : 0;
      const filterLife = 500; // hours until replacement
      const pct = Math.min(100, Math.round((workHours / filterLife) * 100));
      const needsReplace = workHours > filterLife;
      html += `<div class="ctrl-card">
        <div class="ctrl-card-title">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2.69l5.66 5.66a8 8 0 11-11.31 0z"/></svg>
          Air Purifier
          <span style="font-size:0.65rem;padding:1px 6px;border-radius:8px;background:${pur.fan_speed > 0 ? 'var(--accent-green)' : 'var(--bg-tertiary)'};color:${pur.fan_speed > 0 ? '#fff' : 'var(--text-muted)'};margin-left:auto">${pur.fan_speed > 0 ? pur.fan_speed + '%' : 'OFF'}</span>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;font-size:0.78rem">
          <div><span class="text-muted">Work time:</span> ${workHours}h</div>
          <div><span class="text-muted">Filter:</span> <span style="color:${needsReplace ? 'var(--accent-red)' : 'var(--accent-green)'}">${100 - pct}% remaining</span></div>
        </div>
        <div style="height:4px;background:var(--bg-tertiary);border-radius:2px;margin-top:6px;overflow:hidden">
          <div style="height:100%;width:${pct}%;background:${needsReplace ? 'var(--accent-red)' : pct > 70 ? 'var(--accent-orange)' : 'var(--accent-green)'};border-radius:2px"></div>
        </div>
        ${needsReplace ? '<div style="font-size:0.7rem;color:var(--accent-red);margin-top:4px;font-weight:600">⚠ Filter replacement recommended</div>' : ''}
        <div style="display:flex;gap:4px;margin-top:6px">
          <button class="form-btn form-btn-sm" style="font-size:0.7rem" data-ripple onclick="sendCommand('gcode',{gcode:'SET_FAN_SPEED FAN=purifier SPEED=1.0'})">Full Speed</button>
          <button class="form-btn form-btn-sm" style="font-size:0.7rem" data-ripple onclick="sendCommand('gcode',{gcode:'SET_FAN_SPEED FAN=purifier SPEED=0.5'})">50%</button>
          <button class="form-btn form-btn-sm" style="font-size:0.7rem" data-ripple onclick="sendCommand('gcode',{gcode:'SET_FAN_SPEED FAN=purifier SPEED=0'})">Off</button>
        </div>
      </div>`;
    }

    // ── Power Status ──
    if (data._sm_power) {
      const p = data._sm_power;
      const color = p.powerLoss ? 'var(--accent-red)' : 'var(--accent-green)';
      html += `<div class="ctrl-card">
        <div class="ctrl-card-title">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10"/></svg>
          Power Status
          <span style="width:8px;height:8px;border-radius:50%;background:${color};margin-left:auto"></span>
        </div>
        <div style="font-size:0.78rem;color:var(--text-muted)">
          ${p.powerLoss ? '⚠ Power loss detected!' : 'Power stable'}
          ${p.dutyPercent !== undefined ? ' — Duty: ' + Math.round(p.dutyPercent * 100) + '%' : ''}
        </div>
        ${p.powerLoss ? '<button class="form-btn form-btn-sm" style="font-size:0.7rem;margin-top:6px;background:var(--accent-orange);color:#fff" data-ripple onclick="fetch(\'/api/printers/\'+encodeURIComponent(window.printerState?.getActivePrinterId())+\'/snapmaker/power-recovery\',{method:\'POST\'})">Resume Print (Power Recovery)</button>' : ''}
      </div>`;
    }

    // ── Extended Firmware Status ──
    if (data._extended_firmware) {
      html += `<div class="ctrl-card">
        <div class="ctrl-card-title">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/></svg>
          Extended Firmware
          <span style="font-size:0.65rem;padding:1px 6px;border-radius:8px;background:var(--accent-green);color:#fff;margin-left:auto">Active</span>
        </div>
        <div style="font-size:0.78rem;color:var(--text-muted)">
          paxx12 custom firmware detected. Enhanced camera streaming available.
          ${data._v4l2_mpp_port ? '<br>Camera: v4l2-mpp on port ' + data._v4l2_mpp_port : ''}
        </div>
      </div>`;
    }

    return html;
  };

  function _detectorCard(name, cfg) {
    if (!cfg) return '';
    return `<div style="background:var(--bg-tertiary);padding:6px 8px;border-radius:6px">
      <div style="display:flex;align-items:center;justify-content:space-between">
        <span style="font-size:0.75rem;font-weight:500">${name}</span>
        <span style="width:6px;height:6px;border-radius:50%;background:${cfg.enable ? 'var(--accent-green)' : 'var(--accent-red)'}"></span>
      </div>
      <div style="font-size:0.6rem;color:var(--text-muted)">${cfg.sensitivity || '-'}</div>
    </div>`;
  }

  function _toggleRow(label, value, configKey) {
    const on = !!value;
    const clickHandler = configKey ? `onclick="sendCommand('sm_set_print_config',{${configKey}:${!on}})"` : '';
    return `<div style="display:flex;align-items:center;justify-content:space-between;padding:4px 8px;background:var(--bg-tertiary);border-radius:4px;font-size:0.72rem;${clickHandler ? 'cursor:pointer' : ''}" ${clickHandler}>
      <span>${label}</span>
      <span style="color:${on ? 'var(--accent-green)' : 'var(--accent-red)'}; font-weight:600">${on ? 'ON' : 'OFF'}</span>
    </div>`;
  }
})();
