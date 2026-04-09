/**
 * Printer Extras Panel — Type-specific UI panels that complete 100% coverage:
 * - OctoPrint: Connection manager, timelapse list, exclude objects
 * - PrusaLink: MMU visualization, firmware update
 * - SACP: Laser/CNC controls, module list, build volume
 * - All: WLED color control, firmware retraction, Z thermal adjust
 */
(function() {
  'use strict';

  window.renderPrinterExtrasPanel = function(data) {
    let html = '';
    html += _renderOctoPrintExtras(data);
    html += _renderPrusaMMU(data);
    html += _renderSacpExtras(data);
    html += _renderWled(data);
    html += _renderBuildVolume(data);
    html += _renderFirmwareRetraction(data);
    html += _renderExcludeObjects(data);
    return html;
  };

  // ── OctoPrint: Connection Manager ──
  function _renderOctoPrintExtras(data) {
    if (!data._printerProfile && !data._installedPlugins) return '';
    let html = '';

    // Connection manager
    if (data._printerProfile) {
      html += `<div class="ctrl-card">
        <div class="ctrl-card-title">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
          Connection
        </div>
        <div style="font-size:0.72rem;margin-bottom:6px">
          Profile: <strong>${data._printerProfile.name || '?'}</strong>
          ${data._printerProfile.model ? ` (${data._printerProfile.model})` : ''}
        </div>
        <div style="display:flex;gap:4px">
          <button class="form-btn form-btn-sm" style="font-size:0.65rem" data-ripple onclick="sendCommand('connect_printer')">Connect</button>
          <button class="form-btn form-btn-sm form-btn-secondary" style="font-size:0.65rem" data-ripple onclick="sendCommand('disconnect_printer')">Disconnect</button>
        </div>
      </div>`;
    }

    // Timelapse (OctoPrint)
    if (data._installedPlugins) {
      html += `<div class="ctrl-card" id="octoprint-timelapse-card">
        <div class="ctrl-card-title">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="2" width="20" height="20" rx="2.18"/><line x1="7" y1="2" x2="7" y2="22"/><line x1="17" y1="2" x2="17" y2="22"/><line x1="2" y1="12" x2="22" y2="12"/><line x1="2" y1="7" x2="7" y2="7"/><line x1="2" y1="17" x2="7" y2="17"/><line x1="17" y1="7" x2="22" y2="7"/><line x1="17" y1="17" x2="22" y2="17"/></svg>
          Timelapse
        </div>
        <div id="octoprint-timelapse-list" style="font-size:0.72rem;color:var(--text-muted)">Loading...</div>
      </div>`;
      setTimeout(() => _loadOctoPrintTimelapses(), 500);
    }

    return html;
  }

  async function _loadOctoPrintTimelapses() {
    const el = document.getElementById('octoprint-timelapse-list');
    if (!el) return;
    const pid = window.printerState?.getActivePrinterId?.();
    if (!pid) return;
    try {
      const res = await fetch(`/api/printers/${pid}/proxy/timelapse`);
      const data = await res.json();
      if (!data?.files?.length) { el.textContent = 'No timelapses'; return; }
      el.innerHTML = data.files.slice(0, 10).map(f =>
        `<div style="display:flex;align-items:center;gap:6px;padding:2px 0">
          <span style="flex:1">${f.name}</span>
          <span class="text-muted" style="font-size:0.6rem">${(f.size / 1048576).toFixed(1)} MB</span>
        </div>`
      ).join('');
    } catch { el.textContent = 'Could not load timelapses'; }
  }

  // ── PrusaLink: MMU Visualization ──
  function _renderPrusaMMU(data) {
    if (!data._mmu_enabled) return '';
    const activeSlot = data._active_slot ?? 0;
    const slotCount = 5; // MMU2S has 5 slots

    let html = `<div class="ctrl-card">
      <div class="ctrl-card-title">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="6" width="20" height="12" rx="2"/><line x1="6" y1="6" x2="6" y2="18"/><line x1="10" y1="6" x2="10" y2="18"/><line x1="14" y1="6" x2="14" y2="18"/><line x1="18" y1="6" x2="18" y2="18"/></svg>
        MMU ${data._mmu_version || ''}
      </div>
      <div style="display:flex;gap:4px">`;

    for (let i = 0; i < slotCount; i++) {
      const isActive = i === activeSlot;
      html += `<div style="flex:1;text-align:center;padding:6px 4px;border-radius:6px;border:2px solid ${isActive ? 'var(--accent-green)' : 'transparent'};background:var(--bg-inset)">
        <div style="font-size:0.82rem;font-weight:${isActive ? '700' : '400'}">${i + 1}</div>
        <div style="font-size:0.6rem;color:${isActive ? 'var(--accent-green)' : 'var(--text-muted)'}">${isActive ? 'Active' : 'Slot'}</div>
      </div>`;
    }

    html += `</div>
      <div style="display:flex;gap:4px;margin-top:6px">
        <button class="form-btn form-btn-sm" style="font-size:0.65rem" data-ripple onclick="sendCommand('mmu_load',{slot:0})">Load</button>
        <button class="form-btn form-btn-sm form-btn-secondary" style="font-size:0.65rem" data-ripple onclick="sendCommand('mmu_unload')">Unload</button>
      </div>
    </div>`;
    return html;
  }

  // ── SACP: Laser/CNC Controls + Module List + Build Volume ──
  function _renderSacpExtras(data) {
    let html = '';

    // Laser controls
    if (data._headType === 'laser') {
      html += `<div class="ctrl-card">
        <div class="ctrl-card-title">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="2" x2="12" y2="6"/><line x1="12" y1="18" x2="12" y2="22"/><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"/><circle cx="12" cy="12" r="4"/></svg>
          Laser Control
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;font-size:0.72rem">
          <div class="form-group" style="margin:0"><label class="form-label" style="font-size:0.65rem">Power %</label>
            <input class="form-input" type="range" min="0" max="100" value="0" id="laser-power-slider" oninput="document.getElementById('laser-power-val').textContent=this.value+'%'" onchange="sendCommand('laser_power',{power:this.value})">
            <span id="laser-power-val" style="font-size:0.65rem">0%</span></div>
          <div class="form-group" style="margin:0"><label class="form-label" style="font-size:0.65rem">Focal Length mm</label>
            <input class="form-input" type="number" step="0.1" value="0" style="font-size:0.72rem" onchange="sendCommand('laser_focal_length',{focalLength:parseFloat(this.value)})"></div>
        </div>
        <div style="display:flex;gap:4px;margin-top:6px">
          <button class="form-btn form-btn-sm" style="font-size:0.65rem" data-ripple onclick="sendCommand('laser_lock',{locked:true})">🔒 Lock</button>
          <button class="form-btn form-btn-sm form-btn-secondary" style="font-size:0.65rem" data-ripple onclick="sendCommand('laser_lock',{locked:false})">🔓 Unlock</button>
        </div>
      </div>`;
    }

    // CNC controls
    if (data._headType === 'cnc') {
      html += `<div class="ctrl-card">
        <div class="ctrl-card-title">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M12 1v4m0 14v4"/></svg>
          CNC Control
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;font-size:0.72rem">
          <div class="form-group" style="margin:0"><label class="form-label" style="font-size:0.65rem">Power %</label>
            <input class="form-input" type="range" min="0" max="100" value="0" onchange="sendCommand('cnc_power',{power:parseInt(this.value)})"></div>
          <div class="form-group" style="margin:0"><label class="form-label" style="font-size:0.65rem">RPM</label>
            <input class="form-input" type="number" value="12000" step="1000" style="font-size:0.72rem" onchange="sendCommand('cnc_speed',{rpm:parseInt(this.value)})"></div>
        </div>
        <div style="display:flex;gap:4px;margin-top:6px">
          <button class="form-btn form-btn-sm" style="font-size:0.65rem" data-ripple onclick="sendCommand('cnc_switch',{enabled:true})">Start Spindle</button>
          <button class="form-btn form-btn-sm form-btn-danger" style="font-size:0.65rem" data-ripple onclick="sendCommand('cnc_switch',{enabled:false})">Stop</button>
        </div>
      </div>`;
    }

    // Module list
    if (data._modules?.length) {
      html += `<div class="ctrl-card">
        <div class="ctrl-card-title">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="2" width="20" height="8" rx="2"/><rect x="2" y="14" width="20" height="8" rx="2"/></svg>
          Installed Modules (${data._modules.length})
        </div>
        <div style="display:flex;flex-direction:column;gap:2px">
          ${data._modules.map(m => `<div style="display:flex;align-items:center;gap:6px;padding:3px 6px;background:var(--bg-inset);border-radius:4px;font-size:0.68rem">
            <span style="width:8px;height:8px;border-radius:50%;background:${m.state === 0 ? 'var(--accent-green)' : 'var(--accent-orange)'}"></span>
            <strong>${m.name}</strong>
            ${m.firmwareVersion ? `<span class="text-muted">v${m.firmwareVersion}</span>` : ''}
            ${m.serialNumber ? `<span class="text-muted">#${m.serialNumber}</span>` : ''}
          </div>`).join('')}
        </div>
      </div>`;
    }

    return html;
  }

  // ── WLED Color Control ──
  function _renderWled(data) {
    if (!data._leds || Object.keys(data._leds).length === 0) return '';
    let html = `<div class="ctrl-card">
      <div class="ctrl-card-title">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/></svg>
        LED Strips
      </div>
      <div style="display:flex;gap:4px;flex-wrap:wrap">`;

    for (const [name, led] of Object.entries(data._leds)) {
      const color = led.colorData?.[0] ? `rgb(${Math.round(led.colorData[0][0]*255)},${Math.round(led.colorData[0][1]*255)},${Math.round(led.colorData[0][2]*255)})` : '#888';
      html += `<div style="display:flex;align-items:center;gap:4px;padding:4px 8px;background:var(--bg-inset);border-radius:4px;font-size:0.68rem">
        <span style="width:12px;height:12px;border-radius:50%;background:${color};border:1px solid rgba(255,255,255,0.2)"></span>
        ${name}
      </div>`;
    }

    html += `</div>
      <div style="display:flex;gap:3px;margin-top:4px">
        <button class="form-btn form-btn-sm" style="font-size:0.6rem;padding:2px 6px" data-ripple onclick="sendGcode('SET_LED LED=sb_leds RED=1 GREEN=1 BLUE=1')">White</button>
        <button class="form-btn form-btn-sm" style="font-size:0.6rem;padding:2px 6px" data-ripple onclick="sendGcode('SET_LED LED=sb_leds RED=1 GREEN=0 BLUE=0')">Red</button>
        <button class="form-btn form-btn-sm" style="font-size:0.6rem;padding:2px 6px" data-ripple onclick="sendGcode('SET_LED LED=sb_leds RED=0 GREEN=1 BLUE=0')">Green</button>
        <button class="form-btn form-btn-sm" style="font-size:0.6rem;padding:2px 6px" data-ripple onclick="sendGcode('SET_LED LED=sb_leds RED=0 GREEN=0 BLUE=1')">Blue</button>
        <button class="form-btn form-btn-sm form-btn-secondary" style="font-size:0.6rem;padding:2px 6px" data-ripple onclick="sendGcode('SET_LED LED=sb_leds RED=0 GREEN=0 BLUE=0')">Off</button>
      </div>
    </div>`;
    return html;
  }

  // ── Build Volume Display ──
  function _renderBuildVolume(data) {
    const vol = data._buildVolume || data._printerProfile?.volume;
    if (!vol) return '';
    const w = vol.width || vol.x || 0;
    const d = vol.depth || vol.y || 0;
    const h = vol.height || vol.z || 0;
    if (!w && !d && !h) return '';
    return `<div style="display:flex;align-items:center;gap:6px;padding:6px 10px;background:var(--bg-inset);border-radius:6px;font-size:0.72rem;margin-bottom:6px">
      📐 Build Volume: <strong>${w} × ${d} × ${h} mm</strong>
      ${vol.formFactor ? ` (${vol.formFactor})` : ''}
    </div>`;
  }

  // ── Firmware Retraction ──
  function _renderFirmwareRetraction(data) {
    if (!data._firmware_retraction) return '';
    const fr = data._firmware_retraction;
    return `<div style="display:flex;gap:8px;padding:6px 10px;background:var(--bg-inset);border-radius:6px;font-size:0.68rem;margin-bottom:6px;flex-wrap:wrap">
      ⤺ Retraction: <strong>${fr.retractLength}mm</strong> @ ${fr.retractSpeed}mm/s ·
      Unretract: +${fr.unretractExtraLength}mm @ ${fr.unretractSpeed}mm/s
    </div>`;
  }

  // ── Exclude Objects ──
  function _renderExcludeObjects(data) {
    if (!data.exclude_object?.objects?.length) return '';
    const objects = data.exclude_object.objects;
    const excluded = data.exclude_object.excluded_objects || [];
    const current = data.exclude_object.current_object || '';

    return `<div class="ctrl-card">
      <div class="ctrl-card-title">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="9" y1="9" x2="15" y2="15"/><line x1="15" y1="9" x2="9" y2="15"/></svg>
        Exclude Objects (${objects.length})
      </div>
      <div style="display:flex;flex-direction:column;gap:2px;max-height:120px;overflow-y:auto">
        ${objects.map(obj => {
          const name = obj.name || '?';
          const isExcluded = excluded.includes(name);
          const isCurrent = name === current;
          return `<div style="display:flex;align-items:center;gap:6px;padding:3px 6px;border-radius:4px;background:${isExcluded ? 'rgba(229,57,53,0.1)' : isCurrent ? 'rgba(0,230,118,0.1)' : 'var(--bg-inset)'};font-size:0.68rem">
            <span style="width:6px;height:6px;border-radius:50%;background:${isExcluded ? 'var(--accent-red)' : isCurrent ? 'var(--accent-green)' : 'var(--text-muted)'}"></span>
            <span style="flex:1;${isExcluded ? 'text-decoration:line-through;opacity:0.5' : ''}">${name}</span>
            ${!isExcluded ? `<button class="form-btn form-btn-sm form-btn-danger" style="font-size:0.5rem;padding:0 4px" data-ripple onclick="sendGcode('EXCLUDE_OBJECT NAME=${name}')">Skip</button>` : '<span style="font-size:0.55rem;color:var(--accent-red)">Excluded</span>'}
          </div>`;
        }).join('')}
      </div>
    </div>`;
  }
})();
