/**
 * Dashboard Extras — enhances main dashboard cards with printer-specific data.
 * Injects: temp sparkline, fan indicators, WiFi badge, bed mesh variance,
 * error count, firmware status into existing dashboard elements.
 *
 * Called from updateDashboard() on every state update.
 */
(function() {
  'use strict';

  // Mini temp history for sparkline (last 60 data points = 2 min at 2s)
  const _tempHistory = { nozzle: [], bed: [] };
  const SPARK_MAX = 60;

  /**
   * Enhance dashboard with printer-specific data
   * Called on every WebSocket state update
   */
  window.updateDashboardExtras = function(data) {
    _updateTempSparkline(data);
    _updateFanIndicators(data);
    _updateWifiBadge(data);
    _updateBedMeshBadge(data);
    _updateErrorBadge(data);
    _updateFirmwareBadge(data);
    _updateSpeedBadge(data);
    _updateCameraBadge(data);
  };

  // ── Temp Sparkline in progress card ──
  function _updateTempSparkline(data) {
    if (data.nozzle_temper !== undefined) _tempHistory.nozzle.push(data.nozzle_temper);
    if (data.bed_temper !== undefined) _tempHistory.bed.push(data.bed_temper);
    if (_tempHistory.nozzle.length > SPARK_MAX) _tempHistory.nozzle.shift();
    if (_tempHistory.bed.length > SPARK_MAX) _tempHistory.bed.shift();

    let container = document.getElementById('dashboard-temp-spark');
    if (!container) {
      // Inject sparkline container into temp card
      const tempCard = document.getElementById('temp-card');
      if (!tempCard) return;
      const body = tempCard.querySelector('.card-body');
      if (!body) return;
      const div = document.createElement('div');
      div.id = 'dashboard-temp-spark';
      div.style.cssText = 'margin-top:6px;height:30px';
      body.appendChild(div);
      container = div;
    }

    // Draw sparkline
    const w = container.offsetWidth || 200;
    const h = 30;
    if (w < 50) return;

    const allVals = [..._tempHistory.nozzle, ..._tempHistory.bed];
    if (allVals.length < 2) return;
    const maxT = Math.max(...allVals, 50);

    let svg = `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">`;

    // Nozzle line (red)
    if (_tempHistory.nozzle.length > 1) {
      svg += _sparkPath(_tempHistory.nozzle, w, h, maxT, '#ff6b6b');
    }
    // Bed line (teal)
    if (_tempHistory.bed.length > 1) {
      svg += _sparkPath(_tempHistory.bed, w, h, maxT, '#4ecdc4');
    }

    svg += '</svg>';
    container.innerHTML = svg;
  }

  function _sparkPath(data, w, h, maxT, color) {
    const points = data.map((v, i) => {
      const x = (i / (SPARK_MAX - 1)) * w;
      const y = h - (v / maxT) * (h - 2) - 1;
      return `${x},${y}`;
    }).join(' ');
    return `<polyline points="${points}" fill="none" stroke="${color}" stroke-width="1.5" stroke-linejoin="round"/>`;
  }

  // ── Fan Indicators in fans card ──
  function _updateFanIndicators(data) {
    const fansCard = document.getElementById('fans-card-content');
    if (!fansCard) return;

    // Only enhance if Bambu with detailed fan data
    if (data._fan_part === undefined && data._fan_aux === undefined) return;

    let badge = document.getElementById('dashboard-fan-badge');
    if (!badge) {
      badge = document.createElement('div');
      badge.id = 'dashboard-fan-badge';
      badge.style.cssText = 'display:flex;gap:6px;font-size:0.6rem;margin-top:4px;flex-wrap:wrap';
      fansCard.appendChild(badge);
    }

    const fans = [
      { name: 'Part', val: data._fan_part, color: '#4ecdc4' },
      { name: 'Aux', val: data._fan_aux, color: '#ffe66d' },
      { name: 'Chmb', val: data._fan_chamber, color: '#ff9f43' },
      { name: 'HB', val: data._fan_heatbreak, color: '#a29bfe' },
    ].filter(f => f.val !== undefined);

    badge.innerHTML = fans.map(f => {
      const pct = Math.min(100, Math.round((f.val / 15) * 100));
      return `<span style="color:${f.color}">${f.name}:${pct}%</span>`;
    }).join(' ');
  }

  // ── WiFi Signal Badge ──
  function _updateWifiBadge(data) {
    if (!data._wifi_rssi && !data.wifi_signal) return;
    const rssi = parseInt(data._wifi_rssi || data.wifi_signal) || 0;
    if (rssi === 0) return;

    let badge = document.getElementById('dashboard-wifi-badge');
    if (!badge) {
      const header = document.querySelector('.app-header .container-fluid');
      if (!header) return;
      badge = document.createElement('span');
      badge.id = 'dashboard-wifi-badge';
      badge.style.cssText = 'font-size:0.65rem;padding:2px 6px;border-radius:8px;margin-left:6px';
      const connBadge = document.getElementById('connection-badge');
      if (connBadge) connBadge.parentNode.insertBefore(badge, connBadge.nextSibling);
      else header.appendChild(badge);
    }

    const quality = rssi > -50 ? 'var(--accent-green)' : rssi > -60 ? 'var(--accent-blue)' : rssi > -70 ? 'var(--accent-orange)' : 'var(--accent-red)';
    badge.style.color = quality;
    badge.textContent = `📶 ${rssi}dBm`;
  }

  // ── Bed Mesh Variance Badge ──
  function _updateBedMeshBadge(data) {
    if (!data._bed_mesh?.meshMatrix?.length) return;

    let min = Infinity, max = -Infinity;
    for (const row of data._bed_mesh.meshMatrix) {
      for (const val of row) { if (val < min) min = val; if (val > max) max = val; }
    }
    const variance = Math.round((max - min) * 1000) / 1000;

    let badge = document.getElementById('dashboard-bedmesh-badge');
    if (!badge) {
      const statsStrip = document.getElementById('stats-strip');
      if (!statsStrip) return;
      badge = document.createElement('div');
      badge.id = 'dashboard-bedmesh-badge';
      badge.className = 'spark-panel';
      badge.style.cssText = 'min-width:70px';
      statsStrip.appendChild(badge);
    }

    const color = variance < 0.1 ? 'var(--accent-green)' : variance < 0.3 ? 'var(--accent-orange)' : 'var(--accent-red)';
    badge.innerHTML = `<div class="spark-label">Bed Mesh</div><div class="spark-value" style="color:${color}">${variance}mm</div>`;
  }

  // ── Active Error Count Badge ──
  function _updateErrorBadge(data) {
    const count = data._active_errors || 0;
    if (count === 0) return;

    let badge = document.getElementById('dashboard-error-badge');
    if (!badge) {
      const statsStrip = document.getElementById('stats-strip');
      if (!statsStrip) return;
      badge = document.createElement('div');
      badge.id = 'dashboard-error-badge';
      badge.className = 'spark-panel';
      badge.style.cssText = 'min-width:60px';
      statsStrip.appendChild(badge);
    }

    badge.innerHTML = `<div class="spark-label">Errors</div><div class="spark-value" style="color:var(--accent-red)">${count}</div>`;
  }

  // ── Firmware Update Badge ──
  function _updateFirmwareBadge(data) {
    if (!data._upgrade?.newVersion && !data._force_upgrade) return;

    let badge = document.getElementById('dashboard-fw-badge');
    if (!badge) {
      const statsStrip = document.getElementById('stats-strip');
      if (!statsStrip) return;
      badge = document.createElement('div');
      badge.id = 'dashboard-fw-badge';
      badge.className = 'spark-panel';
      badge.style.cssText = 'min-width:80px;cursor:pointer';
      badge.onclick = () => { if (typeof openPanel === 'function') openPanel('settings'); };
      statsStrip.appendChild(badge);
    }

    badge.innerHTML = `<div class="spark-label">Firmware</div><div class="spark-value" style="color:var(--accent-cyan);font-size:0.7rem">Update!</div>`;
  }

  // ── Speed Level Badge (Bambu) ──
  function _updateSpeedBadge(data) {
    if (data._speed_level === undefined) return;
    const levels = ['', 'Silent', 'Normal', 'Sport', 'Ludicrous'];
    const colors = ['', 'var(--accent-green)', 'var(--accent-blue)', 'var(--accent-orange)', 'var(--accent-red)'];

    let badge = document.getElementById('dashboard-speed-badge');
    if (!badge) {
      const statsStrip = document.getElementById('stats-strip');
      if (!statsStrip) return;
      badge = document.createElement('div');
      badge.id = 'dashboard-speed-badge';
      badge.className = 'spark-panel';
      badge.style.cssText = 'min-width:60px';
      statsStrip.appendChild(badge);
    }

    const lvl = data._speed_level || 0;
    badge.innerHTML = `<div class="spark-label">Speed</div><div class="spark-value" style="color:${colors[lvl] || ''};font-size:0.72rem">${levels[lvl] || lvl}</div>`;
  }

  // ── Camera State Badge ──
  function _updateCameraBadge(data) {
    if (!data._camera_state) return;
    const cam = data._camera_state;

    let badge = document.getElementById('dashboard-camera-badge');
    const cameraCard = document.getElementById('camera-card');
    if (!badge && cameraCard) {
      const header = cameraCard.querySelector('.card-header');
      if (header) {
        badge = document.createElement('span');
        badge.id = 'dashboard-camera-badge';
        badge.style.cssText = 'font-size:0.6rem;margin-left:auto;display:flex;gap:4px;align-items:center';
        header.appendChild(badge);
      }
    }
    if (!badge) return;

    let html = '';
    if (cam.recording) html += '<span style="color:var(--accent-red)">● REC</span>';
    if (cam.timelapse) html += '<span style="color:var(--accent-cyan)">⏱ TL</span>';
    if (cam.resolution) html += `<span class="text-muted">${cam.resolution}</span>`;
    badge.innerHTML = html;
  }
})();
