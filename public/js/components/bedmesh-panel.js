// Bed Mesh Visualizer — 3D heatmap of printer bed leveling data
(function() {
  'use strict';
  let _meshData = null;
  let _latestEntry = null;
  let _history = [];
  let _canvas = null;
  let _ctx = null;
  let _rotX = 55, _rotZ = 45;
  let _dragging = false;
  let _lastMouse = { x: 0, y: 0 };
  let _scale = 1;
  let _viewMode = '3d';
  let _printerId = null;

  function _t(k, fb) { if (typeof t === 'function') { const v = t(k); if (v && v !== k) return v; } return fb || k; }

  window.loadBedMeshPanel = function() {
    const el = document.getElementById('overlay-panel-body');
    if (!el) return;

    _printerId = window.printerState?.getActivePrinterId();

    // Keep tab bar if present
    const tabBar = el.querySelector('._wrapper-tabs');
    el.innerHTML = '';
    if (tabBar) el.appendChild(tabBar);

    el.insertAdjacentHTML('beforeend', `<div class="bm-container">
      <div>
        <div class="bm-canvas-wrap">
          <canvas class="bm-canvas" id="bm-canvas"></canvas>
          <div class="bm-toolbar">
            <button class="bm-view-btn active" id="bm-btn-3d" onclick="_bmSetView('3d')">3D</button>
            <button class="bm-view-btn" id="bm-btn-heatmap" onclick="_bmSetView('heatmap')">${_t('bedmesh.heatmap', 'Heatmap')}</button>
            <button class="bm-view-btn" onclick="_bmReset()">${_t('bedmesh.reset_view', 'Reset view')}</button>
            <div style="flex:1"></div>
            <button class="bm-action-btn" onclick="_bmScanPrinter()" id="bm-scan-btn">${_t('bedmesh.scan_printer', 'Scan printer')}</button>
            <button class="bm-action-btn" onclick="_bmCalibrate()" id="bm-cal-btn">${_t('bedmesh.calibrate', 'Calibrate bed')}</button>
            <button class="bm-upload-btn" onclick="_bmUpload()">${_t('bedmesh.upload_mesh', 'Upload mesh')}</button>
          </div>
          <div class="bm-legend"><span>Low</span><div class="bm-legend-bar"></div><span>High</span></div>
        </div>
        <div id="bm-status-bar"></div>
      </div>
      <div class="bm-sidebar">
        <div class="bm-stats" id="bm-stats"></div>
        <div class="bm-history" id="bm-history"></div>
      </div>
    </div>`);

    _canvas = document.getElementById('bm-canvas');
    _ctx = _canvas?.getContext('2d');
    _setupInteraction();
    _loadData();
  };

  async function _loadData() {
    if (!_printerId) {
      _showEmpty(_t('bedmesh.no_printer', 'No printer selected'));
      return;
    }
    try {
      const r = await fetch(`/api/printers/${_printerId}/bed-mesh`);
      const data = await r.json();
      _history = data.history || [];
      if (data.latest && data.latest.mesh_data) {
        _latestEntry = data.latest;
        _meshData = typeof data.latest.mesh_data === 'string' ? JSON.parse(data.latest.mesh_data) : data.latest.mesh_data;
        _renderStats(data.latest);
      } else {
        _meshData = null;
        _latestEntry = null;
        _showEmpty(_t('bedmesh.no_data', 'No mesh data available'));
      }
      _renderHistory(data.latest?.id);
      _draw();
    } catch {
      _showEmpty(_t('bedmesh.load_error', 'Could not load bed mesh data'));
    }
  }

  function _showEmpty(msg) {
    const el = document.getElementById('bm-stats');
    if (el) el.innerHTML = `<div class="bm-empty"><div class="bm-empty-icon">▦</div><p>${msg}</p></div>`;
  }

  function _setStatus(msg, type) {
    const el = document.getElementById('bm-status-bar');
    if (!el) return;
    const color = type === 'success' ? 'var(--accent-green)' : type === 'error' ? 'var(--accent-red)' : 'var(--text-muted)';
    el.innerHTML = msg ? `<div class="bm-scan-status" style="color:${color}">${msg}</div>` : '';
  }

  function _renderStats(mesh) {
    const el = document.getElementById('bm-stats');
    if (!el || !mesh) return;
    const range = ((mesh.z_max || 0) - (mesh.z_min || 0)).toFixed(3);
    const rangeNum = parseFloat(range);
    const cls = rangeNum < 0.1 ? 'bm-stat-good' : rangeNum < 0.3 ? 'bm-stat-warn' : 'bm-stat-bad';
    const quality = rangeNum < 0.1 ? _t('bedmesh.excellent', 'Excellent') : rangeNum < 0.2 ? _t('bedmesh.good', 'Good') : rangeNum < 0.3 ? _t('bedmesh.fair', 'OK') : _t('bedmesh.poor', 'Poor');
    el.innerHTML = `<h4>${_t('bedmesh.stats', 'Statistics')}</h4>
      <div class="bm-stat-row"><span class="bm-stat-label">${_t('bedmesh.grid', 'Grid')}</span><span class="bm-stat-value">${mesh.mesh_rows || '?'}x${mesh.mesh_cols || '?'}</span></div>
      <div class="bm-stat-row"><span class="bm-stat-label">${_t('bedmesh.z_min', 'Z min')}</span><span class="bm-stat-value">${(mesh.z_min || 0).toFixed(3)} mm</span></div>
      <div class="bm-stat-row"><span class="bm-stat-label">${_t('bedmesh.z_max', 'Z max')}</span><span class="bm-stat-value">${(mesh.z_max || 0).toFixed(3)} mm</span></div>
      <div class="bm-stat-row"><span class="bm-stat-label">${_t('bedmesh.z_range', 'Z range')}</span><span class="bm-stat-value ${cls}">${range} mm</span></div>
      <div class="bm-stat-row"><span class="bm-stat-label">${_t('bedmesh.z_mean', 'Z mean')}</span><span class="bm-stat-value">${(mesh.z_mean || 0).toFixed(3)} mm</span></div>
      <div class="bm-stat-row"><span class="bm-stat-label">${_t('bedmesh.std_dev', 'Std deviation')}</span><span class="bm-stat-value">${(mesh.z_std_dev || 0).toFixed(3)} mm</span></div>
      <div class="bm-stat-row"><span class="bm-stat-label">${_t('bedmesh.quality', 'Quality')}</span><span class="bm-stat-value ${cls}">${quality}</span></div>
      <div class="bm-stat-row"><span class="bm-stat-label">${_t('bedmesh.source', 'Source')}</span><span class="bm-stat-value">${mesh.source || '--'}</span></div>
      <div class="bm-stat-row"><span class="bm-stat-label">${_t('bedmesh.captured', 'Captured')}</span><span class="bm-stat-value">${mesh.captured_at ? new Date(mesh.captured_at).toLocaleString() : '--'}</span></div>`;
  }

  function _renderHistory(activeId) {
    const el = document.getElementById('bm-history');
    if (!el) return;
    let html = `<h4>${_t('bedmesh.history', 'History')} (${_history.length})</h4>`;
    if (!_history.length) {
      html += `<div style="font-size:0.73rem;color:var(--text-muted)">${_t('bedmesh.no_history', 'No history')}</div>`;
    }
    for (const h of _history) {
      const date = h.captured_at ? new Date(h.captured_at).toLocaleDateString() : '--';
      const range = ((h.z_max || 0) - (h.z_min || 0)).toFixed(3);
      const active = h.id === activeId ? ' active' : '';
      html += `<div class="bm-history-item${active}" onclick="_bmLoadHistory(${h.id})">
        <span>${date} <span style="color:var(--text-muted);font-size:0.68rem">${h.source || ''}</span></span><span>${range} mm</span>
      </div>`;
    }
    el.innerHTML = html;
  }

  // ── Scan printer FTP ──
  window._bmScanPrinter = async function() {
    if (!_printerId) { if (typeof showToast === 'function') showToast(_t('bedmesh.no_printer', 'No printer'), 'error'); return; }
    const btn = document.getElementById('bm-scan-btn');
    if (btn) { btn.disabled = true; btn.textContent = '...'; }
    _setStatus(_t('bedmesh.scanning', 'Scanning printer via FTP...'), 'info');
    try {
      const r = await fetch(`/api/printers/${_printerId}/bed-mesh/scan`, { method: 'POST' });
      const data = await r.json();
      if (data.ok && data.id) {
        _setStatus((_t('bedmesh.scan_found', 'Mesh found') + ': ' + data.source), 'success');
        if (typeof showToast === 'function') showToast(_t('bedmesh.scan_found', 'Mesh data found and saved!'), 'success');
        _loadData();
      } else if (data.files) {
        _setStatus((_t('bedmesh.scan_no_mesh', 'No mesh files found') + '. Files: ' + data.files.join(', ')), 'info');
      } else {
        _setStatus(data.error || data.message || 'Scan failed', 'error');
      }
    } catch (e) {
      _setStatus('FTP scan error: ' + e.message, 'error');
    } finally {
      if (btn) { btn.disabled = false; btn.textContent = _t('bedmesh.scan_printer', 'Scan printer'); }
    }
  };

  // ── Trigger bed calibration ──
  window._bmCalibrate = async function() {
    if (!_printerId) { if (typeof showToast === 'function') showToast(_t('bedmesh.no_printer', 'No printer'), 'error'); return; }
    if (!confirm(_t('bedmesh.calibrate_confirm', 'Start auto bed leveling? The printer will run homing (G28) followed by bed leveling (G29).'))) return;
    const btn = document.getElementById('bm-cal-btn');
    if (btn) { btn.disabled = true; btn.textContent = '...'; }
    _setStatus(_t('bedmesh.calibrating', 'Starting calibration...'), 'info');
    try {
      const r = await fetch(`/api/printers/${_printerId}/bed-mesh/calibrate`, { method: 'POST' });
      const data = await r.json();
      if (data.ok) {
        _setStatus(_t('bedmesh.calibrate_started', 'Calibration started. Use "Scan printer" afterwards to fetch results.'), 'success');
        if (typeof showToast === 'function') showToast(_t('bedmesh.calibrate_started', 'Calibration started!'), 'success');
      } else {
        _setStatus(data.error || 'Failed', 'error');
      }
    } catch (e) {
      _setStatus('Error: ' + e.message, 'error');
    } finally {
      if (btn) { btn.disabled = false; btn.textContent = _t('bedmesh.calibrate', 'Calibrate bed'); }
    }
  };

  window._bmLoadHistory = async function(id) {
    if (!_printerId) return;
    const item = _history.find(h => h.id === id);
    if (!item) return;
    _latestEntry = item;
    _meshData = typeof item.mesh_data === 'string' ? JSON.parse(item.mesh_data) : item.mesh_data;
    _renderStats(item);
    _renderHistory(id);
    _draw();
  };

  window._bmSetView = function(mode) {
    _viewMode = mode;
    document.getElementById('bm-btn-3d')?.classList.toggle('active', mode === '3d');
    document.getElementById('bm-btn-heatmap')?.classList.toggle('active', mode === 'heatmap');
    _draw();
  };

  window._bmReset = function() { _rotX = 55; _rotZ = 45; _scale = 1; _draw(); };

  window._bmUpload = function() {
    const overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.5);z-index:999;display:flex;align-items:center;justify-content:center';
    overlay.onclick = (e) => { if (e.target === overlay) overlay.remove(); };
    overlay.innerHTML = `<div style="background:var(--bg-primary);border-radius:12px;padding:24px;width:min(500px,90vw);">
      <h3 style="margin:0 0 12px;font-size:1rem">${_t('bedmesh.upload_mesh', 'Upload mesh')}</h3>
      <p style="font-size:0.78rem;color:var(--text-muted);margin:0 0 10px">${_t('bedmesh.paste_hint', 'Paste mesh data (space or comma separated values, one row per line)')}</p>
      <textarea id="bm-paste" style="width:100%;height:200px;background:var(--bg-secondary);border:1px solid var(--border-color);border-radius:var(--radius);padding:10px;font-family:monospace;font-size:0.75rem;color:var(--text-primary);box-sizing:border-box;resize:vertical" placeholder="0.01 0.02 0.03\n0.02 0.01 0.02\n0.03 0.02 0.01"></textarea>
      <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:12px">
        <button class="bm-action-btn" onclick="this.closest('div[style*=fixed]').remove()">${_t('bedmesh.cancel', 'Cancel')}</button>
        <button class="bm-upload-btn" onclick="_bmSubmitPaste()">${_t('bedmesh.upload', 'Upload')}</button>
      </div>
    </div>`;
    document.body.appendChild(overlay);
  };

  window._bmSubmitPaste = async function() {
    const text = document.getElementById('bm-paste')?.value?.trim();
    if (!text) return;
    try {
      const rows = text.split('\n').filter(l => l.trim());
      const mesh = rows.map(r => r.trim().split(/[\s,]+/).map(Number));
      if (!mesh.length || mesh.some(r => r.some(isNaN))) {
        if (typeof showToast === 'function') showToast(_t('bedmesh.parse_error', 'Invalid format'), 'error');
        return;
      }
      if (!_printerId) return;
      await fetch(`/api/printers/${_printerId}/bed-mesh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mesh_data: mesh, source: 'manual' })
      });
      document.querySelector('div[style*="fixed"]')?.remove();
      _loadData();
      if (typeof showToast === 'function') showToast(_t('bedmesh.uploaded', 'Mesh uploaded'), 'success');
    } catch (e) {
      if (typeof showToast === 'function') showToast(e.message, 'error');
    }
  };

  function _setupInteraction() {
    if (!_canvas) return;
    _canvas.addEventListener('mousedown', (e) => { _dragging = true; _lastMouse = { x: e.clientX, y: e.clientY }; });
    window.addEventListener('mouseup', () => { _dragging = false; });
    window.addEventListener('mousemove', (e) => {
      if (!_dragging) return;
      _rotZ += (e.clientX - _lastMouse.x) * 0.5;
      _rotX = Math.max(10, Math.min(90, _rotX - (e.clientY - _lastMouse.y) * 0.5));
      _lastMouse = { x: e.clientX, y: e.clientY };
      _draw();
    });
    _canvas.addEventListener('wheel', (e) => { e.preventDefault(); _scale = Math.max(0.5, Math.min(3, _scale - e.deltaY * 0.001)); _draw(); });
    _canvas.addEventListener('touchstart', (e) => { if (e.touches.length === 1) { _dragging = true; _lastMouse = { x: e.touches[0].clientX, y: e.touches[0].clientY }; } });
    _canvas.addEventListener('touchmove', (e) => {
      if (!_dragging || e.touches.length !== 1) return;
      e.preventDefault();
      _rotZ += (e.touches[0].clientX - _lastMouse.x) * 0.5;
      _rotX = Math.max(10, Math.min(90, _rotX - (e.touches[0].clientY - _lastMouse.y) * 0.5));
      _lastMouse = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      _draw();
    });
    _canvas.addEventListener('touchend', () => { _dragging = false; });
  }

  function _draw() {
    if (!_canvas || !_ctx) return;
    const dpr = window.devicePixelRatio || 1;
    const rect = _canvas.getBoundingClientRect();
    _canvas.width = rect.width * dpr;
    _canvas.height = rect.height * dpr;
    _ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    _ctx.clearRect(0, 0, rect.width, rect.height);

    if (!_meshData || !_meshData.length) {
      _ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--text-muted').trim() || '#999';
      _ctx.font = '14px Inter, sans-serif';
      _ctx.textAlign = 'center';
      _ctx.fillText(_t('bedmesh.no_data_short', 'No mesh data'), rect.width / 2, rect.height / 2 - 20);
      _ctx.font = '12px Inter, sans-serif';
      _ctx.fillText(_t('bedmesh.use_actions', 'Use the buttons below to fetch or upload data'), rect.width / 2, rect.height / 2 + 5);
      return;
    }

    if (_viewMode === 'heatmap') _drawHeatmap(rect.width, rect.height);
    else _draw3D(rect.width, rect.height);
  }

  function _drawHeatmap(w, h) {
    const rows = _meshData.length;
    const cols = _meshData[0].length;
    const flat = _meshData.flat();
    const zMin = Math.min(...flat);
    const zMax = Math.max(...flat);
    const range = zMax - zMin || 0.001;
    const pad = 40;
    const cellW = (w - pad * 2) / cols;
    const cellH = (h - pad * 2) / rows;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const val = _meshData[r][c];
        const t = (val - zMin) / range;
        _ctx.fillStyle = _heatColor(t);
        _ctx.fillRect(pad + c * cellW, pad + r * cellH, cellW - 1, cellH - 1);
        _ctx.fillStyle = t > 0.5 ? '#fff' : '#000';
        _ctx.font = `${Math.min(cellW * 0.3, 11)}px Inter, sans-serif`;
        _ctx.textAlign = 'center';
        _ctx.textBaseline = 'middle';
        _ctx.fillText(val.toFixed(2), pad + c * cellW + cellW / 2, pad + r * cellH + cellH / 2);
      }
    }
  }

  function _draw3D(w, h) {
    const rows = _meshData.length;
    const cols = _meshData[0].length;
    const flat = _meshData.flat();
    const zMin = Math.min(...flat);
    const zMax = Math.max(...flat);
    const range = zMax - zMin || 0.001;
    const cx = w / 2, cy = h / 2;
    const size = Math.min(w, h) * 0.35 * _scale;
    const radX = _rotX * Math.PI / 180;
    const radZ = _rotZ * Math.PI / 180;
    const cosX = Math.cos(radX), sinX = Math.sin(radX);
    const cosZ = Math.cos(radZ), sinZ = Math.sin(radZ);

    function project(x, y, z) {
      const rx = x * cosZ - y * sinZ;
      const ry = x * sinZ + y * cosZ;
      const py = ry * cosX - z * sinX;
      const pz = ry * sinX + z * cosX;
      return { x: cx + rx * size, y: cy - py * size, z: pz };
    }

    const quads = [];
    for (let r = 0; r < rows - 1; r++) {
      for (let c = 0; c < cols - 1; c++) {
        const nx = (c / (cols - 1)) * 2 - 1;
        const ny = (r / (rows - 1)) * 2 - 1;
        const nx2 = ((c + 1) / (cols - 1)) * 2 - 1;
        const ny2 = ((r + 1) / (rows - 1)) * 2 - 1;
        const zScale = 8;
        const z00 = ((_meshData[r][c] - zMin) / range - 0.5) * zScale;
        const z10 = ((_meshData[r][c+1] - zMin) / range - 0.5) * zScale;
        const z01 = ((_meshData[r+1][c] - zMin) / range - 0.5) * zScale;
        const z11 = ((_meshData[r+1][c+1] - zMin) / range - 0.5) * zScale;
        const p0 = project(nx, ny, z00);
        const p1 = project(nx2, ny, z10);
        const p2 = project(nx2, ny2, z11);
        const p3 = project(nx, ny2, z01);
        const avgZ = (p0.z + p1.z + p2.z + p3.z) / 4;
        const avgVal = (_meshData[r][c] + _meshData[r][c+1] + _meshData[r+1][c] + _meshData[r+1][c+1]) / 4;
        const t = (avgVal - zMin) / range;
        quads.push({ pts: [p0, p1, p2, p3], z: avgZ, color: _heatColor(t) });
      }
    }

    quads.sort((a, b) => a.z - b.z);

    for (const q of quads) {
      _ctx.beginPath();
      _ctx.moveTo(q.pts[0].x, q.pts[0].y);
      for (let i = 1; i < 4; i++) _ctx.lineTo(q.pts[i].x, q.pts[i].y);
      _ctx.closePath();
      _ctx.fillStyle = q.color;
      _ctx.fill();
      _ctx.strokeStyle = 'rgba(0,0,0,0.1)';
      _ctx.lineWidth = 0.5;
      _ctx.stroke();
    }
  }

  function _heatColor(t) {
    if (t < 0.33) {
      const s = t / 0.33;
      return `rgb(${Math.round(18 + (0 - 18) * s)}, ${Math.round(121 + (174 - 121) * s)}, ${Math.round(255 + (66 - 255) * s)})`;
    } else if (t < 0.66) {
      const s = (t - 0.33) / 0.33;
      return `rgb(${Math.round(0 + 245 * s)}, ${Math.round(174 + (158 - 174) * s)}, ${Math.round(66 + (11 - 66) * s)})`;
    } else {
      const s = (t - 0.66) / 0.34;
      return `rgb(${Math.round(245 + (229 - 245) * s)}, ${Math.round(158 + (57 - 158) * s)}, ${Math.round(11 + (53 - 11) * s)})`;
    }
  }
})();
