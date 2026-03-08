// G-code Analyzer — parse and visualize G-code files
(function() {
  let _parsed = null;

  window.loadGcodePanel = function() {
    const el = document.getElementById('overlay-panel-body');
    if (!el) return;

    el.innerHTML = `<style>
      .gc-container { max-width:1000px; }
      .gc-drop { border:2px dashed var(--border-color); border-radius:var(--radius); padding:40px; text-align:center; color:var(--text-muted); cursor:pointer; transition:border-color 0.2s; margin-bottom:16px; }
      .gc-drop.dragover { border-color:var(--accent-blue); background:rgba(18,121,255,0.05); }
      .gc-drop-icon { font-size:2.5rem; margin-bottom:8px; opacity:0.3; }
      .gc-drop p { font-size:0.85rem; margin:0; }
      .gc-results { display:none; }
      .gc-summary { display:grid; grid-template-columns:repeat(auto-fill, minmax(180px, 1fr)); gap:12px; margin-bottom:20px; }
      .gc-stat-card { background:var(--bg-secondary); border:1px solid var(--border-color); border-radius:var(--radius); padding:14px; }
      .gc-stat-label { font-size:0.7rem; color:var(--text-muted); font-weight:600; text-transform:uppercase; letter-spacing:0.02em; }
      .gc-stat-value { font-size:1.3rem; font-weight:800; margin-top:4px; }
      .gc-stat-sub { font-size:0.7rem; color:var(--text-muted); margin-top:2px; }
      .gc-sections { display:grid; grid-template-columns:1fr 1fr; gap:16px; }
      @media (max-width:700px) { .gc-sections { grid-template-columns:1fr; } }
      .gc-section { background:var(--bg-secondary); border:1px solid var(--border-color); border-radius:var(--radius); padding:16px; }
      .gc-section h4 { margin:0 0 10px; font-size:0.85rem; }
      .gc-table { width:100%; font-size:0.78rem; border-collapse:collapse; }
      .gc-table td { padding:5px 0; border-bottom:1px solid rgba(0,0,0,0.04); }
      .gc-table td:first-child { color:var(--text-muted); }
      .gc-table td:last-child { text-align:right; font-weight:600; }
      .gc-bar-wrap { display:flex; align-items:center; gap:8px; margin-bottom:6px; }
      .gc-bar-label { font-size:0.72rem; color:var(--text-muted); min-width:80px; }
      .gc-bar { flex:1; height:16px; background:var(--bg-tertiary); border-radius:3px; overflow:hidden; }
      .gc-bar-fill { height:100%; border-radius:3px; transition:width 0.3s; }
      .gc-bar-value { font-size:0.72rem; font-weight:600; min-width:50px; text-align:right; }
      .gc-speed-chart { width:100%; height:120px; }
      .gc-reset-btn { margin-top:16px; padding:8px 18px; background:var(--bg-secondary); border:1px solid var(--border-color); border-radius:var(--radius); cursor:pointer; color:var(--text-primary); font-size:0.8rem; }
    </style>
    <div class="gc-container">
      <div class="gc-drop" id="gc-drop" onclick="document.getElementById('gc-file-input').click()">
        <div class="gc-drop-icon">\u2261</div>
        <p>${t('gcode.drop_hint')}</p>
        <input type="file" id="gc-file-input" accept=".gcode,.gco,.g" style="display:none" onchange="_gcHandleFile(this.files[0])">
      </div>
      <div class="gc-results" id="gc-results">
        <div class="gc-summary" id="gc-summary"></div>
        <div class="gc-sections" id="gc-sections"></div>
        <button class="gc-reset-btn" onclick="_gcReset()">${t('gcode.analyze_another')}</button>
      </div>
    </div>`;

    // Drag & drop
    const drop = document.getElementById('gc-drop');
    if (drop) {
      drop.addEventListener('dragover', (e) => { e.preventDefault(); drop.classList.add('dragover'); });
      drop.addEventListener('dragleave', () => drop.classList.remove('dragover'));
      drop.addEventListener('drop', (e) => { e.preventDefault(); drop.classList.remove('dragover'); if (e.dataTransfer.files[0]) _gcHandleFile(e.dataTransfer.files[0]); });
    }
  };

  window._gcHandleFile = function(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      _parsed = _parseGcode(reader.result, file.name, file.size);
      _renderResults();
    };
    reader.readAsText(file);
  };

  window._gcReset = function() {
    _parsed = null;
    document.getElementById('gc-drop').style.display = '';
    document.getElementById('gc-results').style.display = 'none';
  };

  function _parseGcode(text, filename, fileSize) {
    const lines = text.split('\n');
    const result = {
      filename,
      fileSize,
      totalLines: lines.length,
      commands: 0,
      comments: 0,
      moves: { travel: 0, extrude: 0 },
      layers: 0,
      filament: { mm: 0, g: 0 },
      estimatedTime: 0,
      temperatures: { nozzle: [], bed: [] },
      speeds: {},
      retractCount: 0,
      totalDistance: { travel: 0, extrude: 0 },
      materials: [],
      slicer: '--',
      bedSize: null,
      layerHeight: null,
      firstLayerHeight: null,
      infill: null,
      walls: null
    };

    let lastX = 0, lastY = 0, lastZ = 0, lastE = 0;
    let currentLayer = 0;
    let maxTemp = 0, maxBedTemp = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      // Comments
      if (line.startsWith(';')) {
        result.comments++;
        // Parse metadata from comments
        const cl = line.substring(1).trim().toLowerCase();
        if (cl.startsWith('generated by') || cl.startsWith('slicer:')) result.slicer = line.substring(1).trim();
        if (cl.includes('filament used [g]')) { const m = cl.match(/=\s*([\d.]+)/); if (m) result.filament.g = parseFloat(m[1]); }
        if (cl.includes('filament used [mm]') || cl.includes('filament used:')) { const m = cl.match(/=?\s*([\d.]+)/); if (m) result.filament.mm = parseFloat(m[1]); }
        if (cl.includes('estimated printing time')) result.estimatedTime = _parseTimeComment(cl);
        if (cl.includes('filament_type')) { const m = cl.match(/=\s*(\S+)/); if (m && !result.materials.includes(m[1])) result.materials.push(m[1]); }
        if (cl.includes('layer_height')) { const m = cl.match(/=\s*([\d.]+)/); if (m && !result.layerHeight) result.layerHeight = parseFloat(m[1]); }
        if (cl.includes('first_layer_height')) { const m = cl.match(/=\s*([\d.]+)/); if (m) result.firstLayerHeight = parseFloat(m[1]); }
        if (cl.includes('fill_density') || cl.includes('infill_density') || cl.includes('sparse_infill_density')) { const m = cl.match(/=\s*([\d.]+)/); if (m) result.infill = m[1] + '%'; }
        if (cl.includes('wall_loops') || cl.includes('perimeters')) { const m = cl.match(/=\s*(\d+)/); if (m) result.walls = parseInt(m[1]); }
        continue;
      }

      result.commands++;
      const cmd = line.split(';')[0].trim();
      const parts = cmd.split(/\s+/);
      const g = parts[0];

      // G0/G1 moves
      if (g === 'G0' || g === 'G1' || g === 'G28') {
        let x = lastX, y = lastY, z = lastZ, e = lastE, f = null;
        for (const p of parts.slice(1)) {
          const c = p[0];
          const v = parseFloat(p.substring(1));
          if (c === 'X') x = v;
          else if (c === 'Y') y = v;
          else if (c === 'Z') z = v;
          else if (c === 'E') e = v;
          else if (c === 'F') f = v;
        }

        if (f) {
          const bucket = Math.round(f / 60); // mm/s
          const key = `${bucket}`;
          result.speeds[key] = (result.speeds[key] || 0) + 1;
        }

        const dx = x - lastX, dy = y - lastY;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (e > lastE) {
          result.moves.extrude++;
          result.totalDistance.extrude += dist;
        } else if (e < lastE) {
          result.retractCount++;
        } else {
          result.moves.travel++;
          result.totalDistance.travel += dist;
        }

        if (z !== lastZ && z > lastZ) currentLayer++;

        lastX = x; lastY = y; lastZ = z; lastE = e;
      }

      // Temperatures
      if (g === 'M104' || g === 'M109') {
        for (const p of parts) { if (p.startsWith('S')) { const v = parseFloat(p.substring(1)); if (v > maxTemp) maxTemp = v; result.temperatures.nozzle.push(v); } }
      }
      if (g === 'M140' || g === 'M190') {
        for (const p of parts) { if (p.startsWith('S')) { const v = parseFloat(p.substring(1)); if (v > maxBedTemp) maxBedTemp = v; result.temperatures.bed.push(v); } }
      }
    }

    result.layers = currentLayer;
    result.maxNozzleTemp = maxTemp;
    result.maxBedTemp = maxBedTemp;
    if (result.filament.mm > 0 && result.filament.g === 0) {
      result.filament.g = result.filament.mm * 0.00124 * 1000; // rough PLA estimate
    }

    return result;
  }

  function _parseTimeComment(text) {
    let total = 0;
    const d = text.match(/(\d+)\s*d/); if (d) total += parseInt(d[1]) * 86400;
    const h = text.match(/(\d+)\s*h/); if (h) total += parseInt(h[1]) * 3600;
    const m = text.match(/(\d+)\s*m/); if (m) total += parseInt(m[1]) * 60;
    const s = text.match(/(\d+)\s*s/); if (s) total += parseInt(s[1]);
    return total;
  }

  function _renderResults() {
    if (!_parsed) return;
    document.getElementById('gc-drop').style.display = 'none';
    document.getElementById('gc-results').style.display = '';

    const p = _parsed;
    const summaryEl = document.getElementById('gc-summary');
    const sectionsEl = document.getElementById('gc-sections');

    // Summary cards
    summaryEl.innerHTML = `
      ${_statCard(t('gcode.filename'), _esc(p.filename), _fmtSize(p.fileSize))}
      ${_statCard(t('gcode.est_time'), _fmtDuration(p.estimatedTime), p.layers + ' ' + t('gcode.layers'))}
      ${_statCard(t('gcode.filament'), p.filament.g > 0 ? p.filament.g.toFixed(1) + 'g' : '--', p.materials.join(', ') || '--')}
      ${_statCard(t('gcode.commands'), p.commands.toLocaleString(), p.totalLines.toLocaleString() + ' ' + t('gcode.lines'))}
      ${_statCard(t('gcode.moves'), (p.moves.extrude + p.moves.travel).toLocaleString(), p.retractCount + ' ' + t('gcode.retractions'))}
      ${_statCard(t('gcode.max_temp'), p.maxNozzleTemp ? p.maxNozzleTemp + '\u00B0C' : '--', p.maxBedTemp ? t('gcode.bed') + ': ' + p.maxBedTemp + '\u00B0C' : '')}
    `;

    // Sections
    let html = '';

    // Print settings
    html += `<div class="gc-section"><h4>${t('gcode.settings')}</h4><table class="gc-table">
      <tr><td>${t('gcode.slicer')}</td><td>${_esc(p.slicer)}</td></tr>
      <tr><td>${t('gcode.layer_height')}</td><td>${p.layerHeight ? p.layerHeight + ' mm' : '--'}</td></tr>
      <tr><td>${t('gcode.first_layer')}</td><td>${p.firstLayerHeight ? p.firstLayerHeight + ' mm' : '--'}</td></tr>
      <tr><td>${t('gcode.infill')}</td><td>${p.infill || '--'}</td></tr>
      <tr><td>${t('gcode.walls')}</td><td>${p.walls || '--'}</td></tr>
      <tr><td>${t('gcode.total_layers')}</td><td>${p.layers}</td></tr>
    </table></div>`;

    // Move breakdown
    const totalMoves = p.moves.extrude + p.moves.travel;
    const extPct = totalMoves > 0 ? (p.moves.extrude / totalMoves * 100) : 0;
    const trvPct = totalMoves > 0 ? (p.moves.travel / totalMoves * 100) : 0;
    html += `<div class="gc-section"><h4>${t('gcode.move_analysis')}</h4>
      ${_bar(t('gcode.extrusion'), extPct, p.moves.extrude.toLocaleString(), 'var(--accent-blue)')}
      ${_bar(t('gcode.travel'), trvPct, p.moves.travel.toLocaleString(), 'var(--accent-orange)')}
      <table class="gc-table" style="margin-top:10px">
        <tr><td>${t('gcode.extrude_dist')}</td><td>${(p.totalDistance.extrude / 1000).toFixed(1)} m</td></tr>
        <tr><td>${t('gcode.travel_dist')}</td><td>${(p.totalDistance.travel / 1000).toFixed(1)} m</td></tr>
        <tr><td>${t('gcode.retractions')}</td><td>${p.retractCount.toLocaleString()}</td></tr>
      </table>
    </div>`;

    // Speed distribution
    const speedEntries = Object.entries(p.speeds).map(([s, c]) => [parseInt(s), c]).sort((a, b) => a[0] - b[0]);
    const maxCount = Math.max(...speedEntries.map(e => e[1]), 1);
    html += `<div class="gc-section"><h4>${t('gcode.speed_dist')}</h4>`;
    const bucketSize = Math.max(1, Math.floor(speedEntries.length / 8));
    const buckets = [];
    for (let i = 0; i < speedEntries.length; i += bucketSize) {
      const slice = speedEntries.slice(i, i + bucketSize);
      const count = slice.reduce((s, e) => s + e[1], 0);
      const label = slice.length === 1 ? `${slice[0][0]}` : `${slice[0][0]}-${slice[slice.length-1][0]}`;
      buckets.push({ label: label + ' mm/s', count });
    }
    const maxBucket = Math.max(...buckets.map(b => b.count), 1);
    for (const b of buckets.slice(0, 10)) {
      html += _bar(b.label, b.count / maxBucket * 100, b.count.toLocaleString(), 'var(--accent-green)');
    }
    html += '</div>';

    // Line type breakdown
    const totalLines = p.commands + p.comments;
    html += `<div class="gc-section"><h4>${t('gcode.line_types')}</h4>
      ${_bar(t('gcode.g_commands'), p.commands / totalLines * 100, p.commands.toLocaleString(), 'var(--accent-blue)')}
      ${_bar(t('gcode.g_comments'), p.comments / totalLines * 100, p.comments.toLocaleString(), '#8b5cf6')}
    </div>`;

    sectionsEl.innerHTML = html;
  }

  function _statCard(label, value, sub) {
    return `<div class="gc-stat-card"><div class="gc-stat-label">${label}</div><div class="gc-stat-value">${value}</div>${sub ? `<div class="gc-stat-sub">${sub}</div>` : ''}</div>`;
  }

  function _bar(label, pct, value, color) {
    return `<div class="gc-bar-wrap"><span class="gc-bar-label">${label}</span><div class="gc-bar"><div class="gc-bar-fill" style="width:${pct}%;background:${color}"></div></div><span class="gc-bar-value">${value}</span></div>`;
  }

  function _fmtSize(bytes) {
    if (!bytes) return '--';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes/1024).toFixed(1)} KB`;
    return `${(bytes/1048576).toFixed(1)} MB`;
  }

  function _fmtDuration(seconds) {
    if (!seconds) return '--';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  }

  function _esc(s) { const d = document.createElement('div'); d.textContent = s || ''; return d.innerHTML; }
})();
