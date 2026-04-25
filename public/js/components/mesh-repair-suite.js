/**
 * Mesh Repair Toolkit — 4-tab panel:
 *   1. Repair         — drop a mesh, run auto-repair, download fixed file
 *   2. Transform      — decimate / smooth / hollow / scale / recenter
 *   3. Convert        — STL ↔ OBJ ↔ 3MF
 *   4. Split          — break disconnected components into separate parts
 */
(function () {
  'use strict';

  const _state = {
    tab: 'repair',
    file: null,
    fileName: '',
    sourceFormat: '',
    analysis: null,
    busy: false,
  };

  function _esc(s) { const d = document.createElement('div'); d.textContent = s ?? ''; return d.innerHTML; }
  function _toast(m, t = 'info') { if (typeof showToast === 'function') showToast(m, t, 3000); }

  function _formatBytes(bytes) {
    if (!bytes) return '0 B';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  }

  function _ext(name) {
    const m = String(name || '').toLowerCase().match(/\.([a-z0-9]+)$/);
    return m ? m[1] : '';
  }

  function _detectSourceFormat(name) {
    const e = _ext(name);
    if (e === 'stl' || e === 'obj' || e === '3mf') return e;
    return '';
  }

  function _baseName(name) {
    return String(name || 'mesh').replace(/\.[^.]+$/, '');
  }

  // ── Layout & tabs ────────────────────────────────────────────────────

  function _load() {
    const body = document.getElementById('overlay-panel-body');
    if (!body) return;
    body.innerHTML = `
      <div class="pf-tabs">
        <button class="form-btn pf-tab ${_state.tab === 'repair' ? 'active' : ''}" data-tab="repair">🛠️ Repair</button>
        <button class="form-btn pf-tab ${_state.tab === 'transform' ? 'active' : ''}" data-tab="transform">📐 Transform</button>
        <button class="form-btn pf-tab ${_state.tab === 'convert' ? 'active' : ''}" data-tab="convert">🔄 Convert</button>
        <button class="form-btn pf-tab ${_state.tab === 'split' ? 'active' : ''}" data-tab="split">✂️ Split</button>
      </div>
      <div id="mr-summary"></div>
      <div id="mr-content" class="pf-content"></div>
    `;
    body.querySelectorAll('.pf-tab').forEach(b => b.onclick = () => { _state.tab = b.dataset.tab; _load(); });
    _renderSummary();
    if (_state.tab === 'repair') _renderRepair();
    else if (_state.tab === 'transform') _renderTransform();
    else if (_state.tab === 'convert') _renderConvert();
    else _renderSplit();
  }

  function _renderSummary() {
    const el = document.getElementById('mr-summary');
    if (!el) return;
    if (!_state.file) {
      el.innerHTML = '';
      return;
    }
    const a = _state.analysis;
    const stats = a?.stats;
    el.innerHTML = `
      <div class="card" style="margin:0.5rem 0">
        <div class="card-body" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:0.75rem;font-size:0.85rem">
          <div><strong>File:</strong> ${_esc(_state.fileName)} <small class="text-muted">(${_formatBytes(_state.file.size)})</small></div>
          <div><strong>Format:</strong> ${_esc(_state.sourceFormat || _ext(_state.fileName) || '?')}</div>
          ${stats ? `<div><strong>Vertices:</strong> ${stats.vertices.toLocaleString()}</div>` : ''}
          ${stats ? `<div><strong>Faces:</strong> ${stats.faces.toLocaleString()}</div>` : ''}
          ${stats ? `<div><strong>Size:</strong> ${stats.bbox.size.map(n => n.toFixed(1)).join(' × ')} mm</div>` : ''}
          ${a?.analysis ? `<div><strong>Boundary edges:</strong> ${a.analysis.boundaryEdges} <small class="text-muted">(holes)</small></div>` : ''}
          ${a?.analysis ? `<div><strong>Non-manifold:</strong> ${a.analysis.nonManifoldEdges}</div>` : ''}
          ${a?.analysis ? `<div><strong>Duplicate verts:</strong> ${a.analysis.duplicateVertices}</div>` : ''}
        </div>
      </div>`;
  }

  // ── File drop helper ─────────────────────────────────────────────────

  function _renderDropZone(targetId, onPick) {
    return `
      <div class="pf-drop" id="${targetId}">
        <input type="file" id="${targetId}-file" accept=".stl,.obj,.3mf" style="display:none">
        <strong>Drop a mesh file here</strong>
        <p class="text-muted" style="font-size:0.78rem">or <a href="#" id="${targetId}-pick" style="color:var(--accent-primary)">click to choose a file</a></p>
        <p class="text-muted" style="font-size:0.7rem">Up to 50 MB · STL / OBJ / 3MF</p>
      </div>`;
  }

  function _wireDrop(targetId, onPick) {
    const drop = document.getElementById(targetId);
    const input = document.getElementById(`${targetId}-file`);
    const link = document.getElementById(`${targetId}-pick`);
    if (!drop || !input || !link) return;
    link.onclick = (e) => { e.preventDefault(); input.click(); };
    input.onchange = () => onPick(input.files[0]);
    drop.ondragover = (e) => { e.preventDefault(); drop.classList.add('pf-drop-over'); };
    drop.ondragleave = () => drop.classList.remove('pf-drop-over');
    drop.ondrop = (e) => {
      e.preventDefault();
      drop.classList.remove('pf-drop-over');
      onPick(e.dataTransfer.files[0]);
    };
  }

  async function _loadFile(file) {
    if (!file) return;
    if (file.size > 50 * 1024 * 1024) { _toast('File too large (max 50 MB)', 'error'); return; }
    const fmt = _detectSourceFormat(file.name);
    if (!fmt) { _toast('Unsupported format — use .stl, .obj, or .3mf', 'error'); return; }
    _state.file = file;
    _state.fileName = file.name;
    _state.sourceFormat = fmt;
    _state.analysis = null;
    try {
      _state.busy = true;
      const buf = await file.arrayBuffer();
      const r = await fetch(`/api/mesh/analyze?filename=${encodeURIComponent(file.name)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/octet-stream' },
        body: buf,
      });
      if (!r.ok) {
        const err = await r.json().catch(() => ({}));
        _toast(`Analyze failed: ${err.error || r.statusText}`, 'error');
      } else {
        _state.analysis = await r.json();
      }
    } catch (e) {
      _toast(`Analyze failed: ${e.message}`, 'error');
    } finally {
      _state.busy = false;
      _load();
    }
  }

  // ── Tab 1: Repair ───────────────────────────────────────────────────

  function _renderRepair() {
    const c = document.getElementById('mr-content');
    if (!c) return;
    c.innerHTML = `
      ${_renderDropZone('mr-repair-drop')}
      <div class="card" style="margin-top:0.75rem">
        <div class="card-body">
          <h5>Repairs to run</h5>
          <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:8px">
            <label><input type="checkbox" id="mr-op-dedupe" checked> Deduplicate vertices</label>
            <label><input type="checkbox" id="mr-op-degenerate" checked> Remove zero-area faces</label>
            <label><input type="checkbox" id="mr-op-winding" checked> Fix winding (normals)</label>
            <label><input type="checkbox" id="mr-op-holes" checked> Close simple holes</label>
          </div>
          <div style="margin-top:1rem;display:flex;gap:8px;align-items:center">
            <label>Output format:
              <select id="mr-repair-format" class="form-control" style="display:inline-block;width:auto;margin-left:6px">
                <option value="stl">STL (binary)</option>
                <option value="obj">OBJ</option>
                <option value="3mf">3MF</option>
              </select>
            </label>
            <button id="mr-repair-go" class="form-btn primary" ${_state.file ? '' : 'disabled'}>Repair &amp; Download</button>
          </div>
          <div id="mr-repair-status" style="margin-top:0.75rem"></div>
        </div>
      </div>`;
    _wireDrop('mr-repair-drop', _loadFile);
    const go = document.getElementById('mr-repair-go');
    if (go) go.onclick = _runRepair;
  }

  async function _runRepair() {
    if (!_state.file) return;
    const ops = [];
    if (document.getElementById('mr-op-dedupe').checked) ops.push('dedupe');
    if (document.getElementById('mr-op-degenerate').checked) ops.push('degenerate');
    if (document.getElementById('mr-op-winding').checked) ops.push('winding');
    if (document.getElementById('mr-op-holes').checked) ops.push('holes');
    if (ops.length === 0) { _toast('Select at least one repair operation', 'warning'); return; }
    const format = document.getElementById('mr-repair-format').value;
    const status = document.getElementById('mr-repair-status');
    status.innerHTML = '<em>Running repairs…</em>';
    try {
      const buf = await _state.file.arrayBuffer();
      const url = `/api/mesh/repair?filename=${encodeURIComponent(_state.fileName)}&format=${format}&ops=${ops.join(',')}`;
      const r = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/octet-stream' },
        body: buf,
      });
      if (!r.ok) {
        const err = await r.json().catch(() => ({}));
        status.innerHTML = `<span style="color:#ef4444">Failed: ${_esc(err.error || r.statusText)}</span>`;
        return;
      }
      const reportRaw = r.headers.get('X-Mesh-Report');
      const report = reportRaw ? JSON.parse(decodeURIComponent(reportRaw)) : {};
      const blob = await r.blob();
      _downloadBlob(blob, `${_baseName(_state.fileName)}-repaired.${format}`);
      status.innerHTML = `
        <div style="color:#22c55e;font-weight:600">✓ Repaired and downloaded.</div>
        <details style="margin-top:6px"><summary>Report</summary>
          <pre style="background:rgba(0,0,0,0.05);padding:8px;border-radius:4px;font-size:0.75rem;overflow:auto">${_esc(JSON.stringify(report, null, 2))}</pre>
        </details>`;
    } catch (e) {
      status.innerHTML = `<span style="color:#ef4444">Failed: ${_esc(e.message)}</span>`;
    }
  }

  // ── Tab 2: Transform ────────────────────────────────────────────────

  function _renderTransform() {
    const c = document.getElementById('mr-content');
    if (!c) return;
    c.innerHTML = `
      ${_renderDropZone('mr-tf-drop')}
      <div class="card" style="margin-top:0.75rem">
        <div class="card-body">
          <h5>Transform</h5>
          <label>Operation:
            <select id="mr-tf-op" class="form-control" style="display:inline-block;width:auto;margin-left:6px">
              <option value="decimate">Decimate (reduce polygons)</option>
              <option value="smooth">Smooth (Laplacian)</option>
              <option value="hollow">Hollow-out (shell)</option>
              <option value="scale">Scale</option>
              <option value="recenter">Recenter to origin</option>
            </select>
          </label>
          <div id="mr-tf-params" style="margin-top:8px"></div>
          <div style="margin-top:1rem;display:flex;gap:8px;align-items:center">
            <label>Output:
              <select id="mr-tf-format" class="form-control" style="display:inline-block;width:auto;margin-left:6px">
                <option value="stl">STL</option>
                <option value="obj">OBJ</option>
                <option value="3mf">3MF</option>
              </select>
            </label>
            <button id="mr-tf-go" class="form-btn primary" ${_state.file ? '' : 'disabled'}>Apply &amp; Download</button>
          </div>
          <div id="mr-tf-status" style="margin-top:0.75rem"></div>
        </div>
      </div>`;
    _wireDrop('mr-tf-drop', _loadFile);
    const opSel = document.getElementById('mr-tf-op');
    opSel.onchange = _renderTransformParams;
    _renderTransformParams();
    document.getElementById('mr-tf-go').onclick = _runTransform;
  }

  function _renderTransformParams() {
    const op = document.getElementById('mr-tf-op').value;
    const c = document.getElementById('mr-tf-params');
    if (op === 'decimate') {
      c.innerHTML = `<label>Target ratio (0.05–1.0):
        <input type="number" id="mr-tf-ratio" min="0.05" max="1.0" step="0.05" value="0.5" class="form-control" style="display:inline-block;width:120px;margin-left:6px"></label>`;
    } else if (op === 'smooth') {
      c.innerHTML = `
        <label>Iterations: <input type="number" id="mr-tf-iter" min="1" max="20" step="1" value="2" class="form-control" style="display:inline-block;width:80px;margin-left:6px"></label>
        <label style="margin-left:1rem">Lambda (0.01–1.0): <input type="number" id="mr-tf-lambda" min="0.01" max="1" step="0.05" value="0.5" class="form-control" style="display:inline-block;width:80px;margin-left:6px"></label>`;
    } else if (op === 'hollow') {
      c.innerHTML = `<label>Wall ratio (0.02–0.5):
        <input type="number" id="mr-tf-wall" min="0.02" max="0.5" step="0.02" value="0.1" class="form-control" style="display:inline-block;width:120px;margin-left:6px"></label>`;
    } else if (op === 'scale') {
      c.innerHTML = `
        <label>X: <input type="number" id="mr-tf-sx" step="0.1" value="1.0" class="form-control" style="display:inline-block;width:80px;margin-left:6px"></label>
        <label style="margin-left:1rem">Y: <input type="number" id="mr-tf-sy" step="0.1" value="1.0" class="form-control" style="display:inline-block;width:80px;margin-left:6px"></label>
        <label style="margin-left:1rem">Z: <input type="number" id="mr-tf-sz" step="0.1" value="1.0" class="form-control" style="display:inline-block;width:80px;margin-left:6px"></label>`;
    } else {
      c.innerHTML = '<small class="text-muted">No parameters needed.</small>';
    }
  }

  async function _runTransform() {
    if (!_state.file) return;
    const op = document.getElementById('mr-tf-op').value;
    const format = document.getElementById('mr-tf-format').value;
    const params = new URLSearchParams();
    params.set('op', op);
    params.set('format', format);
    params.set('filename', _state.fileName);
    if (op === 'decimate') params.set('ratio', document.getElementById('mr-tf-ratio').value);
    else if (op === 'smooth') {
      params.set('iterations', document.getElementById('mr-tf-iter').value);
      params.set('lambda', document.getElementById('mr-tf-lambda').value);
    } else if (op === 'hollow') params.set('wall', document.getElementById('mr-tf-wall').value);
    else if (op === 'scale') {
      params.set('sx', document.getElementById('mr-tf-sx').value);
      params.set('sy', document.getElementById('mr-tf-sy').value);
      params.set('sz', document.getElementById('mr-tf-sz').value);
    }
    const status = document.getElementById('mr-tf-status');
    status.innerHTML = '<em>Transforming…</em>';
    try {
      const buf = await _state.file.arrayBuffer();
      const r = await fetch(`/api/mesh/transform?${params.toString()}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/octet-stream' },
        body: buf,
      });
      if (!r.ok) {
        const err = await r.json().catch(() => ({}));
        status.innerHTML = `<span style="color:#ef4444">Failed: ${_esc(err.error || r.statusText)}</span>`;
        return;
      }
      const reportRaw = r.headers.get('X-Mesh-Report');
      const report = reportRaw ? JSON.parse(decodeURIComponent(reportRaw)) : {};
      const blob = await r.blob();
      _downloadBlob(blob, `${_baseName(_state.fileName)}-${op}.${format}`);
      status.innerHTML = `
        <div style="color:#22c55e;font-weight:600">✓ Transform applied and downloaded.</div>
        <details style="margin-top:6px"><summary>Report</summary>
          <pre style="background:rgba(0,0,0,0.05);padding:8px;border-radius:4px;font-size:0.75rem;overflow:auto">${_esc(JSON.stringify(report, null, 2))}</pre>
        </details>`;
    } catch (e) {
      status.innerHTML = `<span style="color:#ef4444">Failed: ${_esc(e.message)}</span>`;
    }
  }

  // ── Tab 3: Convert ──────────────────────────────────────────────────

  function _renderConvert() {
    const c = document.getElementById('mr-content');
    if (!c) return;
    c.innerHTML = `
      ${_renderDropZone('mr-cv-drop')}
      <div class="card" style="margin-top:0.75rem">
        <div class="card-body">
          <h5>Convert format</h5>
          <p class="text-muted" style="font-size:0.85rem">Source format is auto-detected. Choose target format below.</p>
          <label>Target format:
            <select id="mr-cv-format" class="form-control" style="display:inline-block;width:auto;margin-left:6px">
              <option value="stl">STL (binary)</option>
              <option value="obj">OBJ</option>
              <option value="3mf">3MF</option>
            </select>
          </label>
          <button id="mr-cv-go" class="form-btn primary" style="margin-left:12px" ${_state.file ? '' : 'disabled'}>Convert &amp; Download</button>
          <div id="mr-cv-status" style="margin-top:0.75rem"></div>
        </div>
      </div>`;
    _wireDrop('mr-cv-drop', _loadFile);
    document.getElementById('mr-cv-go').onclick = _runConvert;
  }

  async function _runConvert() {
    if (!_state.file) return;
    const format = document.getElementById('mr-cv-format').value;
    const status = document.getElementById('mr-cv-status');
    status.innerHTML = '<em>Converting…</em>';
    try {
      const buf = await _state.file.arrayBuffer();
      const r = await fetch(`/api/mesh/convert?filename=${encodeURIComponent(_state.fileName)}&format=${format}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/octet-stream' },
        body: buf,
      });
      if (!r.ok) {
        const err = await r.json().catch(() => ({}));
        status.innerHTML = `<span style="color:#ef4444">Failed: ${_esc(err.error || r.statusText)}</span>`;
        return;
      }
      const blob = await r.blob();
      _downloadBlob(blob, `${_baseName(_state.fileName)}.${format}`);
      const src = r.headers.get('X-Mesh-Source-Format');
      status.innerHTML = `<div style="color:#22c55e;font-weight:600">✓ Converted ${_esc(src)} → ${_esc(format)}.</div>`;
    } catch (e) {
      status.innerHTML = `<span style="color:#ef4444">Failed: ${_esc(e.message)}</span>`;
    }
  }

  // ── Tab 4: Split components ─────────────────────────────────────────

  function _renderSplit() {
    const c = document.getElementById('mr-content');
    if (!c) return;
    c.innerHTML = `
      ${_renderDropZone('mr-sp-drop')}
      <div class="card" style="margin-top:0.75rem">
        <div class="card-body">
          <h5>Split into components</h5>
          <p class="text-muted" style="font-size:0.85rem">Find disconnected pieces in the mesh and download each one separately.</p>
          <button id="mr-sp-go" class="form-btn primary" ${_state.file ? '' : 'disabled'}>Analyze components</button>
          <div id="mr-sp-status" style="margin-top:0.75rem"></div>
          <div id="mr-sp-list" style="margin-top:0.5rem"></div>
        </div>
      </div>`;
    _wireDrop('mr-sp-drop', _loadFile);
    document.getElementById('mr-sp-go').onclick = _runSplit;
  }

  async function _runSplit() {
    if (!_state.file) return;
    const status = document.getElementById('mr-sp-status');
    const list = document.getElementById('mr-sp-list');
    status.innerHTML = '<em>Analyzing components…</em>';
    list.innerHTML = '';
    try {
      const buf = await _state.file.arrayBuffer();
      const r = await fetch(`/api/mesh/split?filename=${encodeURIComponent(_state.fileName)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/octet-stream' },
        body: buf,
      });
      if (!r.ok) {
        const err = await r.json().catch(() => ({}));
        status.innerHTML = `<span style="color:#ef4444">Failed: ${_esc(err.error || r.statusText)}</span>`;
        return;
      }
      const data = await r.json();
      status.innerHTML = `<div style="color:#22c55e;font-weight:600">✓ Found ${data.report.components} component(s).</div>`;
      list.innerHTML = '<table class="table table-sm" style="margin-top:8px"><thead><tr><th>#</th><th>Vertices</th><th>Faces</th><th>Size (mm)</th><th>Download</th></tr></thead><tbody></tbody></table>';
      const tbody = list.querySelector('tbody');
      data.components.forEach((comp, i) => {
        const sz = comp.stats.bbox.size.map(n => n.toFixed(1)).join(' × ');
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>${i + 1}</td>
          <td>${comp.stats.vertices.toLocaleString()}</td>
          <td>${comp.stats.faces.toLocaleString()}</td>
          <td>${_esc(sz)}</td>
          <td>
            <button class="form-btn" data-i="${i}" data-fmt="stl">STL</button>
            <button class="form-btn" data-i="${i}" data-fmt="obj">OBJ</button>
            <button class="form-btn" data-i="${i}" data-fmt="3mf">3MF</button>
          </td>`;
        tbody.appendChild(tr);
      });
      tbody.querySelectorAll('button[data-i]').forEach(btn => {
        btn.onclick = () => _downloadComponent(parseInt(btn.dataset.i, 10), btn.dataset.fmt);
      });
    } catch (e) {
      status.innerHTML = `<span style="color:#ef4444">Failed: ${_esc(e.message)}</span>`;
    }
  }

  async function _downloadComponent(index, format) {
    if (!_state.file) return;
    try {
      const buf = await _state.file.arrayBuffer();
      const r = await fetch(`/api/mesh/split/component?filename=${encodeURIComponent(_state.fileName)}&format=${format}&index=${index}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/octet-stream' },
        body: buf,
      });
      if (!r.ok) { _toast('Component download failed', 'error'); return; }
      const blob = await r.blob();
      _downloadBlob(blob, `${_baseName(_state.fileName)}-part${index + 1}.${format}`);
    } catch (e) {
      _toast(`Download failed: ${e.message}`, 'error');
    }
  }

  // ── Helpers ─────────────────────────────────────────────────────────

  function _downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 60000);
  }

  // ── Public ──────────────────────────────────────────────────────────

  window.loadMeshRepairSuite = _load;
})();
