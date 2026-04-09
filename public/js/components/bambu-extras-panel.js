/**
 * Bambu Lab Extras Panel — Individual fans, prepare progress, WiFi,
 * camera state, lights, firmware upgrade, speed level
 */
(function() {
  'use strict';

  window.renderBambuExtrasPanel = function(data) {
    let html = '';

    // ── Individual Fan Speeds ──
    if (data._fan_part !== undefined || data._fan_aux !== undefined) {
      const fans = [
        { name: 'Part Cooling', speed: data._fan_part, icon: '💨' },
        { name: 'Aux Fan', speed: data._fan_aux, icon: '🌀' },
        { name: 'Chamber', speed: data._fan_chamber, icon: '🏠' },
        { name: 'Heatbreak', speed: data._fan_heatbreak, icon: '❄️' },
      ].filter(f => f.speed !== undefined);

      if (fans.length > 0) {
        html += `<div class="ctrl-card">
          <div class="ctrl-card-title">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9.59 4.59A2 2 0 1111 8H2m10.59 11.41A2 2 0 1014 16H2m15.73-8.27A2.5 2.5 0 1119.5 12H2"/></svg>
            Fan Speeds
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px">
            ${fans.map(f => {
              const pct = Math.round((f.speed / 15) * 100); // Bambu fan 0-15
              const pctDisplay = Math.min(100, pct);
              return `<div style="background:var(--bg-inset);padding:6px 8px;border-radius:6px">
                <div style="font-size:0.65rem;color:var(--text-muted)">${f.icon} ${f.name}</div>
                <div style="display:flex;align-items:center;gap:4px;margin-top:2px">
                  <div class="filament-bar" style="flex:1"><div class="filament-bar-fill" style="width:${pctDisplay}%;background:var(--accent-blue)"></div></div>
                  <span style="font-size:0.72rem;font-weight:600;min-width:30px;text-align:right">${pctDisplay}%</span>
                </div>
              </div>`;
            }).join('')}
          </div>
        </div>`;
      }
    }

    // ── Print Preparation Progress ──
    if (data._prepare_percent > 0 && data._prepare_percent < 100 && data.gcode_state !== 'RUNNING') {
      html += `<div style="padding:8px 12px;background:var(--bg-inset);border-radius:6px;margin-bottom:6px">
        <div style="font-size:0.72rem;color:var(--text-muted);margin-bottom:4px">Preparing print file...</div>
        <div class="filament-bar" style="height:8px"><div class="filament-bar-fill" style="width:${data._prepare_percent}%;background:var(--accent-cyan)"></div></div>
        <div style="font-size:0.65rem;text-align:center;margin-top:2px">${data._prepare_percent}%</div>
      </div>`;
    }

    // ── WiFi Signal Strength ──
    if (data._wifi_rssi) {
      const rssi = typeof data._wifi_rssi === 'string' ? parseInt(data._wifi_rssi) : data._wifi_rssi;
      const quality = rssi > -50 ? 'Excellent' : rssi > -60 ? 'Good' : rssi > -70 ? 'Fair' : 'Weak';
      const color = rssi > -50 ? 'var(--accent-green)' : rssi > -60 ? 'var(--accent-blue)' : rssi > -70 ? 'var(--accent-orange)' : 'var(--accent-red)';
      const bars = rssi > -50 ? 4 : rssi > -60 ? 3 : rssi > -70 ? 2 : 1;
      html += `<div style="display:flex;align-items:center;gap:6px;padding:6px 10px;background:var(--bg-inset);border-radius:6px;font-size:0.72rem;margin-bottom:6px">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2">
          ${bars >= 1 ? '<rect x="3" y="18" width="3" height="4" fill="' + color + '"/>' : ''}
          ${bars >= 2 ? '<rect x="8" y="14" width="3" height="8" fill="' + color + '"/>' : '<rect x="8" y="14" width="3" height="8" fill="none" stroke-dasharray="2"/>'}
          ${bars >= 3 ? '<rect x="13" y="10" width="3" height="12" fill="' + color + '"/>' : '<rect x="13" y="10" width="3" height="12" fill="none" stroke-dasharray="2"/>'}
          ${bars >= 4 ? '<rect x="18" y="6" width="3" height="16" fill="' + color + '"/>' : '<rect x="18" y="6" width="3" height="16" fill="none" stroke-dasharray="2"/>'}
        </svg>
        <span>WiFi: <strong style="color:${color}">${quality}</strong> (${rssi} dBm)</span>
      </div>`;
    }

    // ── Camera State ──
    if (data._camera_state) {
      const cam = data._camera_state;
      html += `<div style="display:flex;align-items:center;gap:6px;padding:6px 10px;background:var(--bg-inset);border-radius:6px;font-size:0.72rem;margin-bottom:6px">
        📷 Camera: ${cam.resolution || '?'}
        ${cam.recording ? ' <span style="color:var(--accent-red)">● REC</span>' : ''}
        ${cam.timelapse ? ' <span style="color:var(--accent-cyan)">⏱ TL</span>' : ''}
      </div>`;
    }

    // ── Lights Status ──
    if (data._lights) {
      const lights = Object.entries(data._lights);
      if (lights.length > 0) {
        html += `<div style="display:flex;gap:6px;margin-bottom:6px">`;
        for (const [node, state] of lights) {
          const isOn = state.mode === 'on';
          const label = node === 'chamber_light' ? 'Chamber' : node === 'work_light' ? 'Work' : node;
          html += `<button class="form-btn form-btn-sm ${isOn ? '' : 'form-btn-secondary'}" style="font-size:0.65rem" data-ripple onclick="sendCommand('light',{mode:'${isOn ? 'off' : 'on'}',node:'${node}'})">
            ${isOn ? '💡' : '🔅'} ${label}: ${isOn ? 'ON' : 'OFF'}
          </button>`;
        }
        html += '</div>';
      }
    }

    // ── Speed Level (1-4) ──
    if (data._speed_level !== undefined) {
      const levels = ['Silent', 'Normal', 'Sport', 'Ludicrous'];
      html += `<div style="display:flex;align-items:center;gap:6px;padding:6px 10px;background:var(--bg-inset);border-radius:6px;font-size:0.72rem;margin-bottom:6px">
        🏎️ Speed: <strong>${levels[data._speed_level - 1] || data._speed_level}</strong>
      </div>`;
    }

    // ── Firmware Upgrade Progress ──
    if (data._upgrade?.status) {
      const upg = data._upgrade;
      html += `<div class="ctrl-card">
        <div class="ctrl-card-title">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
          Firmware Update
        </div>
        <div style="font-size:0.72rem">${upg.message || upg.status || 'Checking...'}</div>
        ${upg.newVersion ? `<div style="font-size:0.65rem;color:var(--text-muted)">New version: ${upg.newVersion}</div>` : ''}
        ${upg.progress ? `<div class="filament-bar" style="margin-top:4px"><div class="filament-bar-fill" style="width:${upg.progress}%;background:var(--accent-blue)"></div></div>` : ''}
      </div>`;
    }

    return html;
  };
})();
