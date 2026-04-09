/**
 * Panel Data Injector — enriches existing panels with printer-specific data.
 * Injects extra content into: diagnostics, maintenance, fleet, errors,
 * protection, queue, library, filament panels.
 *
 * Called when panels load and on state updates.
 */
(function() {
  'use strict';

  /**
   * Inject printer data into the diagnostics panel
   */
  window.injectDiagnosticsData = function(data) {
    const container = document.getElementById('overlay-panel-body');
    if (!container || window._activePanel !== 'diagnostics') return;

    let existing = document.getElementById('injected-diagnostics');
    if (!existing) {
      existing = document.createElement('div');
      existing.id = 'injected-diagnostics';
      existing.style.cssText = 'margin-bottom:14px';
      container.insertBefore(existing, container.firstChild);
    }

    let html = '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:10px">';

    // System temperatures
    if (data._system_temps) {
      for (const [key, val] of Object.entries(data._system_temps)) {
        const label = key === 'mcu_temp' ? 'MCU Temperature' : key === 'raspberry_pi' ? 'Host CPU' : key;
        const color = val.temp > 70 ? 'var(--accent-red)' : val.temp > 55 ? 'var(--accent-orange)' : 'var(--accent-green)';
        html += `<div class="settings-card" style="padding:12px"><div style="font-size:0.72rem;color:var(--text-muted)">${label}</div><div style="font-size:1.5rem;font-weight:700;color:${color}">${val.temp}°C</div></div>`;
      }
    }

    // TMC drivers
    if (data._tmc) {
      for (const [name, val] of Object.entries(data._tmc)) {
        html += `<div class="settings-card" style="padding:12px"><div style="font-size:0.72rem;color:var(--text-muted)">TMC ${name}</div>
          ${val.temperature ? `<div style="font-size:1.2rem;font-weight:600">${Math.round(val.temperature)}°C</div>` : ''}
          ${val.run_current ? `<div style="font-size:0.7rem">Run: ${val.run_current}A</div>` : ''}
        </div>`;
      }
    }

    // Input shaper
    if (data._input_shaper) {
      const is = data._input_shaper;
      html += `<div class="settings-card" style="padding:12px"><div style="font-size:0.72rem;color:var(--text-muted)">Input Shaper</div>
        <div style="font-size:0.82rem">X: ${is.shaperTypeX} @ ${is.shaperFreqX?.toFixed(1)}Hz</div>
        <div style="font-size:0.82rem">Y: ${is.shaperTypeY} @ ${is.shaperFreqY?.toFixed(1)}Hz</div>
      </div>`;
    }

    // Pressure advance
    if (data._pressure_advance !== undefined) {
      html += `<div class="settings-card" style="padding:12px"><div style="font-size:0.72rem;color:var(--text-muted)">Pressure Advance</div>
        <div style="font-size:1.5rem;font-weight:700">${data._pressure_advance}</div>
        ${data._smooth_time ? `<div style="font-size:0.7rem">Smooth: ${data._smooth_time}s</div>` : ''}
      </div>`;
    }

    // Bed mesh variance
    if (data._bed_mesh?.meshMatrix?.length) {
      let min = Infinity, max = -Infinity;
      for (const row of data._bed_mesh.meshMatrix) for (const v of row) { if (v < min) min = v; if (v > max) max = v; }
      const variance = Math.round((max - min) * 1000) / 1000;
      const color = variance < 0.1 ? 'var(--accent-green)' : variance < 0.3 ? 'var(--accent-orange)' : 'var(--accent-red)';
      html += `<div class="settings-card" style="padding:12px"><div style="font-size:0.72rem;color:var(--text-muted)">Bed Mesh Variance</div>
        <div style="font-size:1.5rem;font-weight:700;color:${color}">${variance}mm</div>
        <div style="font-size:0.7rem">${data._bed_mesh.meshMatrix.length}×${data._bed_mesh.meshMatrix[0]?.length} points</div>
      </div>`;
    }

    // MCU firmware
    if (data._mcu?.mcuVersion) {
      html += `<div class="settings-card" style="padding:12px"><div style="font-size:0.72rem;color:var(--text-muted)">MCU Firmware</div>
        <div style="font-size:0.78rem;font-weight:600;word-break:break-all">${data._mcu.mcuVersion}</div>
      </div>`;
    }

    // Storage
    if (data._storage_state !== undefined) {
      html += `<div class="settings-card" style="padding:12px"><div style="font-size:0.72rem;color:var(--text-muted)">Storage</div>
        <div style="font-size:0.82rem">State: ${data._storage_state}</div>
      </div>`;
    }

    // WiFi
    if (data._wifi_rssi) {
      const rssi = parseInt(data._wifi_rssi) || 0;
      const quality = rssi > -50 ? 'Excellent' : rssi > -60 ? 'Good' : rssi > -70 ? 'Fair' : 'Weak';
      html += `<div class="settings-card" style="padding:12px"><div style="font-size:0.72rem;color:var(--text-muted)">WiFi Signal</div>
        <div style="font-size:1.2rem;font-weight:700">${rssi} dBm</div>
        <div style="font-size:0.7rem">${quality}</div>
      </div>`;
    }

    // Power status (Snapmaker)
    if (data._sm_power) {
      const color = data._sm_power.powerLoss ? 'var(--accent-red)' : 'var(--accent-green)';
      html += `<div class="settings-card" style="padding:12px"><div style="font-size:0.72rem;color:var(--text-muted)">Power</div>
        <div style="font-size:0.82rem;color:${color}">${data._sm_power.powerLoss ? '⚠ Power Loss!' : '✓ Stable'}</div>
        ${data._sm_inputVoltage ? `<div style="font-size:0.7rem">Input: ${data._sm_inputVoltage}</div>` : ''}
      </div>`;
    }

    html += '</div>';
    existing.innerHTML = html;
  };

  /**
   * Inject data into maintenance panel
   */
  window.injectMaintenanceData = function(data) {
    const container = document.getElementById('overlay-panel-body');
    if (!container || window._activePanel !== 'maintenance') return;

    let existing = document.getElementById('injected-maintenance');
    if (existing) return; // Only inject once
    existing = document.createElement('div');
    existing.id = 'injected-maintenance';
    existing.style.cssText = 'margin-bottom:14px';

    let html = '';

    // Bambu maintenance data from firmware
    if (data._maintenance_data) {
      html += `<div class="settings-card" style="margin-bottom:10px"><div class="card-title">Firmware Maintenance Data</div>
        <pre style="font-size:0.7rem;color:var(--text-muted);max-height:100px;overflow:auto">${JSON.stringify(data._maintenance_data, null, 2)}</pre>
      </div>`;
    }

    // Nozzle info
    if (data._nozzle_type !== undefined || data._nozzle_diameter !== undefined) {
      html += `<div class="alert alert-info" style="font-size:0.75rem">
        Nozzle: ${data._nozzle_type || '?'} — ⌀${data._nozzle_diameter || '?'}mm
      </div>`;
    }

    // Purifier filter life
    if (data._purifier || data._sm_purifier) {
      const pur = data._purifier || data._sm_purifier;
      const hours = pur.work_time ? Math.round(pur.work_time / 3600) : 0;
      html += `<div class="alert ${hours > 450 ? 'alert-warning' : 'alert-info'}" style="font-size:0.75rem">
        Air Purifier: ${hours}h / 500h filter life ${hours > 450 ? '— ⚠ Replace soon' : ''}
      </div>`;
    }

    if (html) {
      existing.innerHTML = html;
      container.insertBefore(existing, container.firstChild);
    }
  };

  /**
   * Inject data into fleet dashboard
   */
  window.injectFleetData = function(printers, states) {
    const container = document.getElementById('overlay-panel-body');
    if (!container || window._activePanel !== 'fleet') return;

    let existing = document.getElementById('injected-fleet');
    if (existing) return;
    existing = document.createElement('div');
    existing.id = 'injected-fleet';
    existing.style.cssText = 'margin-bottom:14px';

    let html = '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:10px">';

    for (const [id, state] of Object.entries(states)) {
      const name = printers?.find(p => p.id === id)?.name || id;
      const errors = state._active_errors || 0;
      const fwVer = state._mcu?.mcuVersion || state._firmware_name || '';
      const meshVar = _calcMeshVariance(state._bed_mesh);
      const wifi = state._wifi_rssi ? `${state._wifi_rssi}dBm` : '';

      html += `<div class="settings-card" style="padding:10px">
        <div style="font-size:0.85rem;font-weight:600;margin-bottom:6px">${name}</div>
        <div style="display:flex;gap:8px;flex-wrap:wrap;font-size:0.68rem">
          ${errors > 0 ? `<span style="color:var(--accent-red)">⚠ ${errors} errors</span>` : '<span style="color:var(--accent-green)">✓ No errors</span>'}
          ${meshVar !== null ? `<span>Mesh: ${meshVar}mm</span>` : ''}
          ${wifi ? `<span>WiFi: ${wifi}</span>` : ''}
          ${fwVer ? `<span class="text-muted">FW: ${fwVer.slice(0, 20)}</span>` : ''}
        </div>
      </div>`;
    }

    html += '</div>';
    existing.innerHTML = html;
    container.insertBefore(existing, container.firstChild);
  };

  function _calcMeshVariance(mesh) {
    if (!mesh?.meshMatrix?.length) return null;
    let min = Infinity, max = -Infinity;
    for (const row of mesh.meshMatrix) for (const v of row) { if (v < min) min = v; if (v > max) max = v; }
    return Math.round((max - min) * 1000) / 1000;
  }

  /**
   * Inject error count into errors panel header
   */
  window.injectErrorsData = function(data) {
    if (window._activePanel !== 'errors') return;
    const title = document.getElementById('overlay-panel-title');
    if (!title) return;

    const hmsCount = data.hms?.length || 0;
    const tmcErrors = data._tmc ? Object.values(data._tmc).filter(t => t.error).length : 0;
    if (hmsCount + tmcErrors > 0) {
      const badge = document.getElementById('error-count-badge') || document.createElement('span');
      badge.id = 'error-count-badge';
      badge.style.cssText = 'font-size:0.7rem;padding:2px 8px;border-radius:8px;background:var(--accent-red);color:#fff;margin-left:8px';
      badge.textContent = hmsCount + tmcErrors;
      if (!badge.parentNode) title.appendChild(badge);
    }
  };

  /**
   * Inject into filament panel — ERCF gate colors, NFC sync indicator
   */
  window.injectFilamentData = function(data) {
    if (window._activePanel !== 'filament') return;
    const container = document.getElementById('overlay-panel-body');
    if (!container) return;

    let existing = document.getElementById('injected-filament');
    if (existing) return;

    let html = '';

    // ERCF gate colors
    if (data._ercf?.gateColor?.length) {
      html += '<div style="display:flex;gap:3px;margin-bottom:8px">';
      for (let i = 0; i < data._ercf.numGates; i++) {
        const color = data._ercf.gateColor[i] || '#888';
        html += `<div style="width:20px;height:20px;border-radius:50%;background:${color};border:2px solid ${data._ercf.gate === i ? 'var(--accent-green)' : 'rgba(255,255,255,0.1)'}" title="Gate ${i}"></div>`;
      }
      html += '</div>';
    }

    // NFC sync indicator
    if (data._sm_filament?.length) {
      const synced = data._sm_filament.filter(f => f.sku).length;
      html += `<div class="alert alert-info" style="font-size:0.72rem;margin-bottom:8px">
        NFC Filament: ${synced}/${data._sm_filament.length} spools synced to inventory
      </div>`;
    }

    if (html) {
      existing = document.createElement('div');
      existing.id = 'injected-filament';
      existing.innerHTML = html;
      container.insertBefore(existing, container.firstChild);
    }
  };

  /**
   * Inject protection data — filament sensor + entangle
   */
  window.injectProtectionData = function(data) {
    if (window._activePanel !== 'protection') return;
    const container = document.getElementById('overlay-panel-body');
    if (!container) return;

    let existing = document.getElementById('injected-protection');
    if (existing) return;

    let html = '';

    // Filament sensor
    if (data._filament_sensor) {
      const fs = data._filament_sensor;
      html += `<div class="alert ${fs.detected ? 'alert-success' : 'alert-danger'}" style="font-size:0.75rem;margin-bottom:8px">
        Filament Sensor: ${fs.detected ? '✓ Filament detected' : '⚠ No filament detected!'}
        ${fs.enabled ? '' : ' (disabled)'}
      </div>`;
    }

    // Entangle detection
    if (data._sm_entangle) {
      const channels = Object.entries(data._sm_entangle);
      const maxFactor = Math.max(...channels.map(([, v]) => v.detectFactor || 0));
      if (maxFactor > 0.3) {
        html += `<div class="alert alert-warning" style="font-size:0.75rem;margin-bottom:8px">
          Entangle Risk: ${Math.round(maxFactor * 100)}% on ${channels.filter(([, v]) => v.detectFactor > 0.3).length} channels
        </div>`;
      }
    }

    if (html) {
      existing = document.createElement('div');
      existing.id = 'injected-protection';
      existing.innerHTML = html;
      container.insertBefore(existing, container.firstChild);
    }
  };

  /**
   * Master injection — call from updateDashboard for active panel enrichment
   */
  window.injectPanelData = function(data) {
    const panel = window._activePanel;
    if (!panel) return;

    if (panel === 'diagnostics') injectDiagnosticsData(data);
    else if (panel === 'maintenance') injectMaintenanceData(data);
    else if (panel === 'errors') injectErrorsData(data);
    else if (panel === 'filament' || panel === 'inventory') injectFilamentData(data);
    else if (panel === 'protection') injectProtectionData(data);
  };
})();
