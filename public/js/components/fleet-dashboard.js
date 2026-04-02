// Fleet Dashboard — multi-printer overview grid with live status
(function() {
  let _updateTimer = null;
  let _cameraIntervals = {};
  let _sortMode = 'name';
  let _gridLayout = localStorage.getItem('fleet-grid-layout') || 'auto';

  // Printer model images — SVG icons for known brands
  function _printerModelImage(model, type) {
    const m = (model || '').toLowerCase();
    // Color by brand
    let brandColor = 'var(--text-muted)';
    let brandName = model || 'Printer';
    if (m.includes('snapmaker')) { brandColor = '#00A98F'; brandName = model; }
    else if (m.includes('voron')) { brandColor = '#E74C3C'; brandName = model; }
    else if (m.includes('creality') || m.includes('k1')) { brandColor = '#1E88E5'; brandName = model; }
    else if (m.includes('p1') || m.includes('p2') || m.includes('x1') || m.includes('a1') || m.includes('h2')) { brandColor = '#00AE42'; brandName = model; }
    else if (m.includes('sovol')) { brandColor = '#FF6F00'; }
    else if (m.includes('qidi')) { brandColor = '#7B1FA2'; }
    else if (m.includes('ratrig')) { brandColor = '#F44336'; }
    // Toolhead count icon
    const isMultiHead = m.includes('u1') || m.includes('h2d') || m.includes('h2c') || m.includes('tool');
    const headsSvg = isMultiHead
      ? '<rect x="14" y="6" width="4" height="6" rx="1" fill="currentColor" opacity="0.6"/><rect x="22" y="6" width="4" height="6" rx="1" fill="currentColor" opacity="0.6"/><rect x="30" y="6" width="4" height="6" rx="1" fill="currentColor" opacity="0.6"/><rect x="38" y="6" width="4" height="6" rx="1" fill="currentColor" opacity="0.6"/>'
      : '<rect x="24" y="6" width="8" height="8" rx="2" fill="currentColor" opacity="0.6"/>';
    return `<div style="display:flex;flex-direction:column;align-items:center;gap:6px;padding:12px 0">
      <svg width="56" height="56" viewBox="0 0 56 56" fill="none" style="color:${brandColor}">
        <rect x="4" y="16" width="48" height="36" rx="4" stroke="currentColor" stroke-width="2" fill="currentColor" opacity="0.08"/>
        <rect x="8" y="20" width="40" height="28" rx="2" fill="currentColor" opacity="0.12"/>
        ${headsSvg}
        <line x1="8" y1="38" x2="48" y2="38" stroke="currentColor" stroke-width="1" opacity="0.3"/>
        <rect x="12" y="40" width="32" height="4" rx="1" fill="currentColor" opacity="0.15"/>
      </svg>
      <span style="font-size:0.7rem;font-weight:600;color:${brandColor};text-align:center">${brandName}</span>
      ${type === 'moonraker' ? '<span style="font-size:0.55rem;color:var(--text-muted)">Moonraker</span>' : ''}
    </div>`;
  }

  window._setFleetLayout = function(layout) {
    _gridLayout = layout;
    localStorage.setItem('fleet-grid-layout', layout);
    const grid = document.getElementById('fleet-grid');
    if (grid) _applyGridLayout(grid);
    document.querySelectorAll('.fleet-layout-btn').forEach(b => b.classList.toggle('active', b.dataset.layout === layout));
  };

  function _applyGridLayout(grid) {
    const layouts = {
      'auto': 'repeat(auto-fill, minmax(320px, 1fr))',
      '1': '1fr',
      '2': 'repeat(2, 1fr)',
      '3': 'repeat(3, 1fr)',
      '4': 'repeat(4, 1fr)',
    };
    grid.style.gridTemplateColumns = layouts[_gridLayout] || layouts.auto;
  }

  function _layoutButtons() {
    const items = [
      { id: 'auto', label: 'Auto', svg: '<rect x="2" y="2" width="8" height="8" rx="1"/><rect x="14" y="2" width="8" height="8" rx="1"/><rect x="2" y="14" width="8" height="8" rx="1"/><rect x="14" y="14" width="8" height="8" rx="1"/>' },
      { id: '1', label: '1', svg: '<rect x="3" y="3" width="18" height="18" rx="1"/>' },
      { id: '2', label: '2', svg: '<rect x="2" y="3" width="9" height="18" rx="1"/><rect x="13" y="3" width="9" height="18" rx="1"/>' },
      { id: '3', label: '3', svg: '<rect x="1" y="3" width="6" height="18" rx="1"/><rect x="9" y="3" width="6" height="18" rx="1"/><rect x="17" y="3" width="6" height="18" rx="1"/>' },
      { id: '4', label: '4', svg: '<rect x="1" y="2" width="5" height="9" rx="1"/><rect x="7" y="2" width="5" height="9" rx="1"/><rect x="13" y="2" width="5" height="9" rx="1"/><rect x="19" y="2" width="4" height="9" rx="1"/>' },
    ];
    return items.map(i => `<button class="fleet-layout-btn${_gridLayout === i.id ? ' active' : ''}" data-layout="${i.id}" onclick="_setFleetLayout('${i.id}')" title="${i.label} ${i.label === 'Auto' ? 'kolonner' : (i.label === '1' ? 'kolonne' : 'kolonner')}"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">${i.svg}</svg></button>`).join('');
  }

  window._sortFleet = function(mode) {
    _sortMode = mode;
    _renderAll();
  };

  window._fleetPauseAll = function() {
    confirmAction(t('fleet.pause_all_confirm') || 'Pause all running printers?', () => {
      const ids = window.printerState.getPrinterIds();
      for (const id of ids) {
        const s = window.printerState._printers[id] || {};
        const state = (s.print?.gcode_state || s.gcode_state || '').toUpperCase();
        if (state === 'RUNNING') {
          sendCommand('pause', { printer_id: id });
        }
      }
      showToast(t('fleet.pausing_all') || 'Pausing all printers...', 'info');
    });
  };

  window._fleetResumeAll = function() {
    confirmAction(t('fleet.resume_all_confirm') || 'Resume all paused printers?', () => {
      const ids = window.printerState.getPrinterIds();
      for (const id of ids) {
        const s = window.printerState._printers[id] || {};
        const state = (s.print?.gcode_state || s.gcode_state || '').toUpperCase();
        if (state === 'PAUSE') {
          sendCommand('resume', { printer_id: id });
        }
      }
      showToast(t('fleet.resuming_all') || 'Resuming all printers...', 'info');
    });
  };

  function _sortPrinterData(data) {
    return [...data].sort((a, b) => {
      if (_sortMode === 'name') {
        return (a.meta.name || a.id).localeCompare(b.meta.name || b.id);
      }
      if (_sortMode === 'status') {
        const statusOrder = { RUNNING: 0, PAUSE: 1, IDLE: 2, FINISH: 3, FAILED: 4, OFFLINE: 5 };
        return (statusOrder[a.gcodeState] ?? 99) - (statusOrder[b.gcodeState] ?? 99);
      }
      if (_sortMode === 'progress') {
        const pa = parseInt(a.printState.mc_percent || a.ps.mc_percent) || 0;
        const pb = parseInt(b.printState.mc_percent || b.ps.mc_percent) || 0;
        return pb - pa;
      }
      return 0;
    });
  }

  window.loadFleetPanel = function() {
    const el = document.getElementById('overlay-panel-body');
    if (!el) return;

    el.innerHTML = `<style>
      .fleet-grid { display:grid; grid-template-columns:repeat(auto-fill, minmax(320px, 1fr)); gap:16px; padding:0; transition:grid-template-columns 0.3s; }
      .fleet-card { background:var(--bg-secondary); border:1px solid var(--border-color); border-radius:var(--radius); overflow:hidden; transition:box-shadow 0.2s; cursor:pointer; }
      .fleet-card:hover { box-shadow:var(--shadow-lg); }
      .fleet-card-header { display:flex; align-items:center; justify-content:space-between; padding:12px 14px 8px; }
      .fleet-printer-name { font-weight:700; font-size:0.9rem; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
      .fleet-printer-model { font-size:0.7rem; color:var(--text-muted); }
      .fleet-badge { padding:3px 10px; border-radius:12px; font-size:0.68rem; font-weight:600; text-transform:uppercase; letter-spacing:0.02em; }
      .fleet-badge-idle { background:rgba(0,174,66,0.1); color:var(--accent-green); }
      .fleet-badge-running { background:rgba(18,121,255,0.1); color:var(--accent-blue); }
      .fleet-badge-pause { background:rgba(245,158,11,0.1); color:#f59e0b; }
      .fleet-badge-finish { background:rgba(0,174,66,0.1); color:var(--accent-green); }
      .fleet-badge-offline { background:rgba(153,153,153,0.1); color:var(--text-muted); }
      .fleet-badge-failed { background:rgba(229,57,53,0.1); color:var(--accent-red); }
      .fleet-badge-prepare { background:rgba(18,121,255,0.1); color:var(--accent-blue); }
      .fleet-badge-maintenance { background:rgba(245,158,11,0.12); color:#f59e0b; }
      .fleet-camera { width:100%; aspect-ratio:16/9; background:var(--bg-tertiary); display:flex; align-items:center; justify-content:center; position:relative; overflow:hidden; }
      .fleet-camera img { width:100%; height:100%; object-fit:cover; }
      .fleet-camera-placeholder { color:var(--text-muted); font-size:0.75rem; }
      .fleet-progress-section { padding:0 14px 10px; }
      .fleet-progress-bar { width:100%; height:5px; background:rgba(0,0,0,0.06); border-radius:3px; overflow:hidden; margin-bottom:6px; }
      .fleet-progress-fill { height:100%; background:var(--accent-blue); border-radius:3px; transition:width 0.5s ease; }
      .fleet-progress-row { display:flex; justify-content:space-between; font-size:0.75rem; }
      .fleet-progress-pct { font-weight:700; color:var(--accent-blue); }
      .fleet-progress-time { color:var(--text-muted); }
      .fleet-file { font-size:0.72rem; color:var(--text-secondary); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; margin-top:2px; }
      .fleet-temps { display:flex; gap:12px; padding:8px 14px; border-top:1px solid var(--border-color); font-size:0.72rem; color:var(--text-muted); }
      .fleet-temp-item { display:flex; align-items:center; gap:3px; }
      .fleet-temp-value { font-weight:600; color:var(--text-primary); }
      .fleet-remote-label { font-size:0.6rem; color:var(--text-muted); opacity:0.7; margin-left:4px; }
      .fleet-layer { font-size:0.72rem; color:var(--text-muted); }
      .fleet-summary { display:flex; gap:10px; margin-bottom:16px; flex-wrap:wrap; }
      .fleet-summary-item { display:flex; align-items:center; gap:5px; padding:5px 12px; border-radius:16px; font-size:0.78rem; font-weight:600; background:var(--bg-secondary); border:1px solid var(--border-color); }
      .fleet-summary-dot { width:8px; height:8px; border-radius:50%; }
      .fleet-summary-dot-printing { background:var(--accent-blue); }
      .fleet-summary-dot-idle { background:var(--accent-green); }
      .fleet-summary-dot-offline { background:var(--text-muted); }
      .fleet-summary-dot-error { background:var(--accent-red); }
      .fleet-layout-group { display:flex; gap:2px; padding:2px; background:var(--bg-tertiary); border:1px solid var(--border-subtle); border-radius:6px; }
      .fleet-layout-btn { width:28px; height:28px; border:none; border-radius:4px; background:transparent; color:var(--text-muted); cursor:pointer; display:flex; align-items:center; justify-content:center; transition:all 0.15s; }
      .fleet-layout-btn:hover { color:var(--text-primary); }
      .fleet-layout-btn.active { background:var(--bg-secondary); color:var(--text-primary); box-shadow:var(--shadow-sm); }
      @media (max-width:700px) { .fleet-grid { grid-template-columns:1fr !important; } }
    </style>
    <div class="fleet-summary" id="fleet-summary"></div>
    <div style="display:flex;gap:8px;align-items:center;margin:8px 0;flex-wrap:wrap">
      <span style="font-size:0.75rem;color:var(--text-muted)">${t('fleet.sort_by') || 'Sorter:'}</span>
      <button class="form-btn form-btn-secondary" style="padding:3px 8px;font-size:0.7rem" onclick="_sortFleet('name')">${t('fleet.sort_name') || 'Navn'}</button>
      <button class="form-btn form-btn-secondary" style="padding:3px 8px;font-size:0.7rem" onclick="_sortFleet('status')">${t('fleet.sort_status') || 'Status'}</button>
      <button class="form-btn form-btn-secondary" style="padding:3px 8px;font-size:0.7rem" onclick="_sortFleet('progress')">${t('fleet.sort_progress') || 'Fremdrift'}</button>
      <div class="fleet-layout-group">${_layoutButtons()}</div>
      <div style="display:flex;gap:8px;margin-left:auto">
        <button class="form-btn form-btn-secondary" style="padding:3px 8px;font-size:0.7rem" onclick="_fleetPauseAll()" data-tooltip="${t('fleet.pause_all_tip') || 'Pause alle som printer'}">${t('fleet.pause_all') || 'Pause alle'}</button>
        <button class="form-btn form-btn-secondary" style="padding:3px 8px;font-size:0.7rem" onclick="_fleetResumeAll()" data-tooltip="${t('fleet.resume_all_tip') || 'Fortsett alle pausede'}">${t('fleet.resume_all') || 'Fortsett alle'}</button>
      </div>
    </div>
    <div class="fleet-grid" id="fleet-grid"></div>`;

    // Apply saved layout
    const grid = document.getElementById('fleet-grid');
    if (grid) _applyGridLayout(grid);

    _renderAll();
    // Live updates every 2 seconds
    if (_updateTimer) clearInterval(_updateTimer);
    _updateTimer = setInterval(_renderAll, 2000);

    // Cleanup on panel close
    const observer = new MutationObserver(() => {
      if (!document.getElementById('fleet-grid')) {
        clearInterval(_updateTimer);
        _updateTimer = null;
        _cleanupCameras();
        observer.disconnect();
      }
    });
    observer.observe(el, { childList: true });
  };

  function _renderAll() {
    const state = window.printerState;
    const ids = state.getPrinterIds();
    const grid = document.getElementById('fleet-grid');
    const summary = document.getElementById('fleet-summary');
    if (!grid) return;

    // Summary counts
    const counts = { printing: 0, idle: 0, offline: 0, error: 0 };
    const printerData = ids.map(id => {
      const meta = state._printerMeta[id] || {};
      const ps = state._printers[id] || {};
      const printState = ps.print || ps;
      const gcodeState = printState.gcode_state || ps.gcode_state || 'OFFLINE';
      if (['RUNNING', 'PREPARE', 'PAUSE'].includes(gcodeState)) counts.printing++;
      else if (gcodeState === 'IDLE' || gcodeState === 'FINISH') counts.idle++;
      else if (gcodeState === 'FAILED') counts.error++;
      else counts.offline++;
      return { id, meta, ps, printState, gcodeState };
    });

    if (summary) {
      let sh = '';
      if (counts.printing > 0) sh += `<div class="fleet-summary-item"><span class="fleet-summary-dot fleet-summary-dot-printing"></span>${counts.printing} ${t('fleet.printing')}</div>`;
      if (counts.idle > 0) sh += `<div class="fleet-summary-item"><span class="fleet-summary-dot fleet-summary-dot-idle"></span>${counts.idle} ${t('fleet.idle')}</div>`;
      if (counts.offline > 0) sh += `<div class="fleet-summary-item"><span class="fleet-summary-dot fleet-summary-dot-offline"></span>${counts.offline} ${t('fleet.offline')}</div>`;
      if (counts.error > 0) sh += `<div class="fleet-summary-item"><span class="fleet-summary-dot fleet-summary-dot-error"></span>${counts.error} ${t('fleet.error')}</div>`;
      sh += `<div class="fleet-summary-item" style="opacity:0.6">${ids.length} ${t('fleet.total')}</div>`;
      summary.innerHTML = sh;
    }

    // Sort printer data
    const sortedData = _sortPrinterData(printerData);

    // Build/update cards
    for (const p of sortedData) {
      let card = grid.querySelector(`[data-fleet-id="${p.id}"]`);
      if (!card) {
        card = document.createElement('div');
        card.className = 'fleet-card';
        card.dataset.fleetId = p.id;
        card.onclick = () => { _goToPrinter(p.id); };
        card.addEventListener('contextmenu', (e) => {
          e.preventDefault();
          e.stopPropagation();
          if (typeof showContextMenu === 'function' && typeof buildPrinterContextMenuItems === 'function') {
            showContextMenu(e.clientX, e.clientY, buildPrinterContextMenuItems(p.id));
          }
        });
        grid.appendChild(card);
      }
      _updateCard(card, p);
    }

    // Reorder DOM to match sort order
    for (const p of sortedData) {
      const card = grid.querySelector(`[data-fleet-id="${p.id}"]`);
      if (card) grid.appendChild(card);
    }

    // Remove cards for printers that no longer exist
    for (const card of grid.querySelectorAll('.fleet-card')) {
      if (!ids.includes(card.dataset.fleetId)) {
        card.remove();
      }
    }
  }

  function _updateCard(card, p) {
    const { id, meta, ps, printState, gcodeState } = p;
    const isMaintenance = meta.maintenance_mode === 1 || meta.maintenance_mode === true;
    const isPrinting = !isMaintenance && ['RUNNING', 'PREPARE', 'PAUSE'].includes(gcodeState);
    const badgeCls = isMaintenance ? 'fleet-badge-maintenance' : `fleet-badge-${gcodeState.toLowerCase()}`;
    const badgeLabel = isMaintenance ? (t('fleet.maintenance') || 'Vedlikehold') : _stateLabel(gcodeState);
    const pct = isPrinting ? (parseInt(printState.mc_percent || ps.mc_percent) || 0) : 0;
    const remaining = isPrinting ? (parseInt(printState.mc_remaining_time || ps.mc_remaining_time) || 0) : 0;
    const file = isPrinting ? (printState.subtask_name || ps.subtask_name || '') : '';
    const layer = parseInt(printState.layer_num || ps.layer_num) || 0;
    const totalLayers = parseInt(printState.total_layer_num || ps.total_layer_num) || 0;
    const nozzle = ps.nozzle_temper ?? printState.nozzle_temper ?? null;
    const bed = ps.bed_temper ?? printState.bed_temper ?? null;
    const chamber = ps.chamber_temper ?? printState.chamber_temper ?? null;
    const remoteLabel = meta.remote ? `<span class="fleet-remote-label">${_esc(meta.remoteNodeName || 'Remote')}</span>` : '';

    if (isMaintenance) card.style.opacity = '0.6';
    else card.style.opacity = '';

    let html = `<div class="fleet-card-header">
      <div>
        <div class="fleet-printer-name">${_esc(meta.name || id)}${remoteLabel}</div>
        ${meta.model ? `<div class="fleet-printer-model">${_esc(meta.model)}</div>` : ''}
      </div>
      <span class="fleet-badge ${badgeCls}">${badgeLabel}</span>
    </div>`;

    // Camera area — try live snapshot, fall back to printer model image
    const cameraPort = meta.cameraPort;
    const snapshotUrl = `/api/printers/${encodeURIComponent(id)}/frame.jpeg?t=${Date.now()}`;
    const modelImg = _printerModelImage(meta.model || '', meta.type || '');
    if (cameraPort && !meta.remote) {
      html += `<div class="fleet-camera" id="fleet-cam-${id}"><img id="fleet-cam-img-${id}" src="" alt="" style="display:none"><div class="fleet-camera-placeholder" id="fleet-cam-ph-${id}">${modelImg}</div></div>`;
    } else {
      // Try snapshot API for Moonraker printers (SSH snapshot)
      html += `<div class="fleet-camera"><img src="${snapshotUrl}" alt="${meta.model || ''}" style="width:100%;height:100%;object-fit:cover" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'"><div class="fleet-camera-placeholder" style="display:none;width:100%;height:100%;align-items:center;justify-content:center">${modelImg}</div></div>`;
    }

    // Progress (if printing)
    if (isPrinting) {
      html += `<div class="fleet-progress-section">
        <div class="fleet-progress-bar"><div class="fleet-progress-fill" style="width:${pct}%"></div></div>
        <div class="fleet-progress-row">
          <span class="fleet-progress-pct">${pct}%</span>
          <span class="fleet-progress-time">${_fmtTime(remaining)}</span>
        </div>
        ${file ? `<div class="fleet-file" title="${_esc(file)}">${_esc(file.replace(/\.3mf$|\.gcode\.3mf$/i, ''))}</div>` : ''}
        ${layer && totalLayers ? `<div class="fleet-layer">${t('fleet.layer')} ${layer}/${totalLayers}</div>` : ''}
        ${typeof renderStageBadge === 'function' ? renderStageBadge(printState.stg_cur ?? ps.stg_cur) : ''}
      </div>`;
    }

    // Temps
    if (nozzle != null || bed != null) {
      html += `<div class="fleet-temps">`;
      if (nozzle != null) html += `<div class="fleet-temp-item"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z"/></svg><span class="fleet-temp-value">${Math.round(nozzle)}</span>°C</div>`;
      if (bed != null) html += `<div class="fleet-temp-item"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="8" width="20" height="8" rx="2"/></svg><span class="fleet-temp-value">${Math.round(bed)}</span>°C</div>`;
      if (chamber != null) html += `<div class="fleet-temp-item"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="4" y="4" width="16" height="16" rx="2"/></svg><span class="fleet-temp-value">${Math.round(chamber)}</span>°C</div>`;
      html += `</div>`;
    }

    card.innerHTML = html;

    // Start camera stream if available
    if (cameraPort && !meta.remote) {
      _startCameraStream(id, cameraPort);
    }
  }

  function _startCameraStream(printerId, port) {
    if (_cameraIntervals[printerId]) return; // Already running
    const imgEl = () => document.getElementById(`fleet-cam-img-${printerId}`);
    const phEl = () => document.getElementById(`fleet-cam-ph-${printerId}`);

    try {
      const wsUrl = `ws://${location.hostname}:${port}`;
      const ws = new WebSocket(wsUrl);
      ws.binaryType = 'arraybuffer';
      let lastUrl = null;

      ws.onmessage = (e) => {
        const img = imgEl();
        const ph = phEl();
        if (!img) { ws.close(); return; }
        if (lastUrl) URL.revokeObjectURL(lastUrl);
        const blob = new Blob([e.data], { type: 'image/jpeg' });
        lastUrl = URL.createObjectURL(blob);
        img.src = lastUrl;
        img.style.display = '';
        if (ph) ph.style.display = 'none';
      };

      ws.onerror = () => {};
      ws.onclose = () => { delete _cameraIntervals[printerId]; };

      _cameraIntervals[printerId] = ws;
    } catch {}
  }

  function _cleanupCameras() {
    for (const [id, ws] of Object.entries(_cameraIntervals)) {
      try { ws.close(); } catch {}
    }
    _cameraIntervals = {};
  }

  function _goToPrinter(id) {
    if (typeof selectPrinter === 'function') selectPrinter(id);
    if (typeof showDashboard === 'function') showDashboard();
  }

  function _stateLabel(state) {
    const map = { IDLE: 'fleet.idle', RUNNING: 'fleet.printing', PAUSE: 'fleet.paused', FINISH: 'fleet.finished', FAILED: 'fleet.error', PREPARE: 'fleet.preparing', OFFLINE: 'fleet.offline' };
    return t(map[state] || 'fleet.offline');
  }

  function _fmtTime(mins) {
    if (!mins) return '--';
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  }

  function _esc(s) { const d = document.createElement('div'); d.textContent = s || ''; return d.innerHTML; }
})();
