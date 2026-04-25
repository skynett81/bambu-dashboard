/**
 * Scene Composer — Tinkercad-style 3D scene editor.
 *
 * Layout:
 *   ┌───────────┬─────────────────────────┬───────────┐
 *   │ Palette   │ Three.js viewport       │ Properties│
 *   │ (add)     │ (orbit, click-to-select)│ + tree    │
 *   └───────────┴─────────────────────────┴───────────┘
 *   Toolbar: New / Open / Save / Render / Export
 *
 * State is held in `_state.scene` as the same JSON shape the backend
 * accepts (validateScene + buildScene). Changes are immediately
 * reflected in the Three.js viewport via _rebuildViewport().
 */
(function () {
  'use strict';

  const _state = {
    scene: null,
    sceneId: null,
    selectedIds: new Set(),  // multi-select
    THREE: null,
    renderer: null, scene3: null, camera: null, controls: null,
    grid: null,
    meshNodes: new Map(),    // shapeId → THREE.Mesh
    raycaster: null,
    mouse: null,
    saved: true,
    undoStack: [],
    redoStack: [],
    keyHandler: null,
  };

  const MAX_HISTORY = 50;

  function _snapshot() {
    return JSON.stringify({
      scene: _state.scene,
      selectedIds: Array.from(_state.selectedIds),
    });
  }

  function _restoreFromSnapshot(snap) {
    if (!snap) return;
    const { scene, selectedIds } = JSON.parse(snap);
    _state.scene = scene;
    _state.selectedIds = new Set(selectedIds || []);
  }

  function _pushUndo() {
    _state.undoStack.push(_snapshot());
    if (_state.undoStack.length > MAX_HISTORY) _state.undoStack.shift();
    _state.redoStack.length = 0; // new action invalidates redo
  }

  function _undo() {
    if (_state.undoStack.length === 0) return _toast('Nothing to undo', 'info');
    _state.redoStack.push(_snapshot());
    _restoreFromSnapshot(_state.undoStack.pop());
    _markDirty(); _renderSidePanel(); _rebuildViewport();
  }

  function _redo() {
    if (_state.redoStack.length === 0) return _toast('Nothing to redo', 'info');
    _state.undoStack.push(_snapshot());
    _restoreFromSnapshot(_state.redoStack.pop());
    _markDirty(); _renderSidePanel(); _rebuildViewport();
  }

  function _esc(s) { const d = document.createElement('div'); d.textContent = s ?? ''; return d.innerHTML; }
  function _toast(m, t = 'info') { if (typeof showToast === 'function') showToast(m, t, 3000); }

  // ── Defaults ─────────────────────────────────────────────────────────

  function _defaultScene() {
    return {
      name: 'Untitled Scene',
      shapes: [
        { id: 's1', name: 'Box 1', type: 'box',
          params: { w: 20, h: 20, d: 20 },
          transform: { px: 0, py: 0, pz: 0, rx: 0, ry: 0, rz: 0, sx: 1, sy: 1, sz: 1 },
          color: '#3b82f6', hole: false },
      ],
    };
  }

  function _defaultsFor(type) {
    switch (type) {
      case 'box':      return { w: 20, h: 20, d: 20 };
      case 'sphere':   return { r: 10, segments: 24, rings: 16 };
      case 'cylinder': return { r: 10, h: 20, segments: 32 };
      case 'cone':     return { r1: 10, r2: 0, h: 20, segments: 32 };
      case 'torus':    return { R: 15, r: 5, ringSegs: 32, tubeSegs: 16 };
      case 'prism':    return { sides: 6, r: 10, h: 20 };
      case 'pyramid':  return { w: 20, h: 20 };
      default:         return {};
    }
  }

  function _defaultTransform() {
    return { px: 0, py: 0, pz: 0, rx: 0, ry: 0, rz: 0, sx: 1, sy: 1, sz: 1 };
  }

  // ── Layout ───────────────────────────────────────────────────────────

  async function _load() {
    const body = document.getElementById('overlay-panel-body');
    if (!body) return;
    body.innerHTML = `
      <div class="card">
        <div class="card-body" style="padding:0.75rem">
          <div style="display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin-bottom:8px">
            <button class="form-btn" id="sc-new">New</button>
            <button class="form-btn" id="sc-open">Open…</button>
            <button class="form-btn" id="sc-save">Save</button>
            <button class="form-btn" id="sc-gallery" title="Insert from Model Forge generator gallery">Gallery…</button>
            <button class="form-btn" id="sc-import-stl" title="Import STL/OBJ/3MF as a scene shape">Import…</button>
            <input type="file" id="sc-import-file" accept=".stl,.obj,.3mf" style="display:none">
            <span style="border-left:1px solid var(--border-color);height:24px;margin:0 4px"></span>
            <button class="form-btn" id="sc-undo" title="Undo (Ctrl+Z)">↶</button>
            <button class="form-btn" id="sc-redo" title="Redo (Ctrl+Y)">↷</button>
            <button class="form-btn" id="sc-duplicate" title="Duplicate (Ctrl+D)">Duplicate</button>
            <button class="form-btn" id="sc-pattern" title="Pattern array (linear / radial)">Pattern…</button>
            <button class="form-btn" id="sc-delete" title="Delete (Del)">Delete</button>
            <span style="border-left:1px solid var(--border-color);height:24px;margin:0 4px"></span>
            <span style="font-size:0.78rem;opacity:0.7">Mirror:</span>
            <button class="form-btn" data-mirror="x" title="Mirror across X plane">X</button>
            <button class="form-btn" data-mirror="y" title="Mirror across Y plane">Y</button>
            <button class="form-btn" data-mirror="z" title="Mirror across Z plane">Z</button>
            <span style="font-size:0.78rem;opacity:0.7">Align:</span>
            <button class="form-btn" data-align="x-center">centerX</button>
            <button class="form-btn" data-align="y-center">centerY</button>
            <button class="form-btn" data-align="z-min">groundZ</button>
            <span style="border-left:1px solid var(--border-color);height:24px;margin:0 4px"></span>
            <label style="font-size:0.78rem">Snap:
              <select id="sc-snap" class="form-control" style="display:inline-block;width:auto;font-size:0.78rem">
                <option value="0">off</option>
                <option value="0.5">0.5</option>
                <option value="1" selected>1mm</option>
                <option value="5">5mm</option>
                <option value="10">10mm</option>
              </select>
            </label>
            <label style="font-size:0.78rem"><input type="checkbox" id="sc-csg" checked> CSG holes</label>
            <button class="form-btn primary" id="sc-render" style="margin-left:auto">Render &amp; Download</button>
            <span style="font-size:0.85rem;opacity:0.7;margin-left:8px" id="sc-saved-status">●</span>
          </div>
          <div style="display:grid;grid-template-columns:160px 1fr 280px;gap:8px;min-height:540px">
            <div id="sc-palette" style="border:1px solid var(--border-color);border-radius:6px;padding:8px;overflow:auto"></div>
            <div id="sc-viewport-wrap" style="position:relative;border:1px solid var(--border-color);border-radius:6px;background:#1a1a1a;min-height:540px">
              <canvas id="sc-canvas" style="width:100%;height:100%;display:block"></canvas>
              <div id="sc-empty" style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);color:#888;font-size:0.85rem;display:none">Add a shape from the palette →</div>
            </div>
            <div id="sc-side" style="border:1px solid var(--border-color);border-radius:6px;padding:8px;overflow:auto;max-height:540px"></div>
          </div>
        </div>
      </div>
      <div id="sc-status" style="margin-top:8px"></div>
    `;
    document.getElementById('sc-new').onclick = _onNew;
    document.getElementById('sc-open').onclick = _onOpen;
    document.getElementById('sc-save').onclick = _onSave;
    document.getElementById('sc-render').onclick = _onRender;
    document.getElementById('sc-undo').onclick = _undo;
    document.getElementById('sc-redo').onclick = _redo;
    document.getElementById('sc-duplicate').onclick = _duplicateSelected;
    document.getElementById('sc-delete').onclick = _deleteSelected;
    document.getElementById('sc-import-stl').onclick = () => document.getElementById('sc-import-file').click();
    document.getElementById('sc-import-file').onchange = (e) => _importStl(e.target.files[0]);
    document.getElementById('sc-gallery').onclick = _openGallery;
    document.getElementById('sc-pattern').onclick = _openPatternDialog;
    document.querySelectorAll('[data-mirror]').forEach(b => b.onclick = () => _mirrorSelected(b.dataset.mirror));
    document.querySelectorAll('[data-align]').forEach(b => b.onclick = () => _alignSelected(b.dataset.align));

    // Keyboard shortcuts (only while panel is active).
    if (_state.keyHandler) document.removeEventListener('keydown', _state.keyHandler);
    _state.keyHandler = (e) => {
      if (window._activePanel !== 'scene-composer') return;
      // Skip if typing in an input.
      const target = e.target;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) return;
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') { e.preventDefault(); _undo(); }
      else if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.shiftKey && e.key === 'Z'))) { e.preventDefault(); _redo(); }
      else if ((e.ctrlKey || e.metaKey) && e.key === 'd') { e.preventDefault(); _duplicateSelected(); }
      else if (e.key === 'Delete' || e.key === 'Backspace') { e.preventDefault(); _deleteSelected(); }
    };
    document.addEventListener('keydown', _state.keyHandler);

    if (!_state.scene) _state.scene = _defaultScene();
    if (_state.selectedIds.size === 0 && _state.scene.shapes.length) {
      _state.selectedIds.add(_state.scene.shapes[0].id);
    }

    _renderPalette();
    _renderSidePanel();
    await _initViewport();
    _rebuildViewport();
    _markSaved();
  }

  // ── Palette ─────────────────────────────────────────────────────────

  function _renderPalette() {
    const types = [
      { type: 'box',      label: '◧ Box' },
      { type: 'sphere',   label: '● Sphere' },
      { type: 'cylinder', label: '⬭ Cylinder' },
      { type: 'cone',     label: '▲ Cone' },
      { type: 'torus',    label: '◯ Torus' },
      { type: 'prism',    label: '⬡ Prism' },
      { type: 'pyramid',  label: '△ Pyramid' },
    ];
    const wrap = document.getElementById('sc-palette');
    wrap.innerHTML = '<div style="font-size:0.78rem;font-weight:600;margin-bottom:6px;opacity:0.7">Add Shape</div>'
      + types.map(t =>
        `<button class="form-btn" data-add="${t.type}" style="width:100%;text-align:left;margin-bottom:4px;font-size:0.85rem">${_esc(t.label)}</button>`
      ).join('');
    wrap.querySelectorAll('button[data-add]').forEach(b => {
      b.onclick = () => _addShape(b.dataset.add);
    });
  }

  function _addShape(type) {
    _pushUndo();
    const id = `s${Date.now().toString(36)}_${Math.floor(Math.random() * 1000)}`;
    _state.scene.shapes.push({
      id,
      name: `${type.charAt(0).toUpperCase() + type.slice(1)} ${_state.scene.shapes.length + 1}`,
      type,
      params: _defaultsFor(type),
      transform: _defaultTransform(),
      color: _randomColor(),
      hole: false,
    });
    _state.selectedIds.clear();
    _state.selectedIds.add(id);
    _markDirty();
    _renderSidePanel();
    _rebuildViewport();
  }

  // ── Multi-select operations ─────────────────────────────────────────

  function _duplicateSelected() {
    if (_state.selectedIds.size === 0) return _toast('Nothing selected', 'info');
    _pushUndo();
    const newIds = [];
    for (const id of _state.selectedIds) {
      const s = _state.scene.shapes.find(sh => sh.id === id);
      if (!s) continue;
      const newId = `s${Date.now().toString(36)}_${Math.floor(Math.random() * 1000)}`;
      const copy = JSON.parse(JSON.stringify(s));
      copy.id = newId;
      copy.name = `${s.name} (copy)`;
      copy.transform.px = (copy.transform.px || 0) + 25;
      _state.scene.shapes.push(copy);
      newIds.push(newId);
    }
    _state.selectedIds = new Set(newIds);
    _markDirty(); _renderSidePanel(); _rebuildViewport();
  }

  function _deleteSelected() {
    if (_state.selectedIds.size === 0) return _toast('Nothing selected', 'info');
    _pushUndo();
    _state.scene.shapes = _state.scene.shapes.filter(s => !_state.selectedIds.has(s.id));
    _state.selectedIds.clear();
    if (_state.scene.shapes.length === 0) {
      // Don't allow truly empty scene — auto-add a placeholder.
      const ph = _defaultScene().shapes[0];
      _state.scene.shapes.push(ph);
      _state.selectedIds.add(ph.id);
    } else {
      _state.selectedIds.add(_state.scene.shapes[0].id);
    }
    _markDirty(); _renderSidePanel(); _rebuildViewport();
  }

  function _mirrorSelected(axis) {
    if (_state.selectedIds.size === 0) return _toast('Nothing selected', 'info');
    _pushUndo();
    const key = `s${axis}`;
    for (const id of _state.selectedIds) {
      const s = _state.scene.shapes.find(sh => sh.id === id);
      if (!s) continue;
      s.transform[key] = -(s.transform[key] || 1);
    }
    _markDirty(); _renderSidePanel(); _rebuildViewport();
  }

  function _alignSelected(mode) {
    if (_state.selectedIds.size < 2) return _toast('Select 2+ shapes to align', 'info');
    _pushUndo();
    const selected = _state.scene.shapes.filter(s => _state.selectedIds.has(s.id));
    if (mode === 'x-center') {
      const avg = selected.reduce((s, sh) => s + (sh.transform.px || 0), 0) / selected.length;
      for (const s of selected) s.transform.px = avg;
    } else if (mode === 'y-center') {
      const avg = selected.reduce((s, sh) => s + (sh.transform.py || 0), 0) / selected.length;
      for (const s of selected) s.transform.py = avg;
    } else if (mode === 'z-min') {
      const min = Math.min(...selected.map(sh => sh.transform.pz || 0));
      for (const s of selected) s.transform.pz = min;
    }
    _markDirty(); _renderSidePanel(); _rebuildViewport();
  }

  // ── Snap-to-grid helper ─────────────────────────────────────────────

  function _snapValue(v) {
    const step = parseFloat(document.getElementById('sc-snap')?.value) || 0;
    if (step <= 0) return v;
    return Math.round(v / step) * step;
  }

  // ── Pattern array (linear / radial) ─────────────────────────────────

  function _openPatternDialog() {
    if (_state.selectedIds.size === 0) return _toast('Select a shape first', 'info');
    const mode = prompt('Pattern type:\n  1 = Linear (along X)\n  2 = Radial (around Z axis)\n\nEnter 1 or 2:', '1');
    if (mode === '1') {
      const count = parseInt(prompt('Linear count (2–20)?', '4'), 10);
      const spacing = parseFloat(prompt('Spacing in mm?', '30'));
      if (Number.isFinite(count) && count >= 2 && count <= 20 && Number.isFinite(spacing)) {
        _patternLinear(count, spacing);
      }
    } else if (mode === '2') {
      const count = parseInt(prompt('Radial count (2–20)?', '6'), 10);
      const radius = parseFloat(prompt('Radius (mm)?', '40'));
      if (Number.isFinite(count) && count >= 2 && count <= 20 && Number.isFinite(radius)) {
        _patternRadial(count, radius);
      }
    }
  }

  function _patternLinear(count, spacing) {
    _pushUndo();
    const newIds = [];
    const sourceIds = Array.from(_state.selectedIds);
    for (const sid of sourceIds) {
      const src = _state.scene.shapes.find(sh => sh.id === sid);
      if (!src) continue;
      // Skip the source itself; create N-1 copies for total of N items.
      for (let i = 1; i < count; i++) {
        const copy = JSON.parse(JSON.stringify(src));
        copy.id = `s${Date.now().toString(36)}_${i}_${Math.floor(Math.random() * 1000)}`;
        copy.name = `${src.name} #${i + 1}`;
        copy.transform.px = (src.transform.px || 0) + spacing * i;
        _state.scene.shapes.push(copy);
        newIds.push(copy.id);
      }
    }
    _state.selectedIds = new Set([...sourceIds, ...newIds]);
    _markDirty(); _renderSidePanel(); _rebuildViewport();
    _toast(`Linear pattern: ${count} × ${sourceIds.length} shapes`, 'success');
  }

  function _patternRadial(count, radius) {
    _pushUndo();
    const newIds = [];
    const sourceIds = Array.from(_state.selectedIds);
    for (const sid of sourceIds) {
      const src = _state.scene.shapes.find(sh => sh.id === sid);
      if (!src) continue;
      // Centre is the source's existing position; rotate copies around Z.
      const cx = src.transform.px || 0;
      const cy = src.transform.py || 0;
      // Move source to first ring position.
      src.transform.px = cx + radius;
      src.transform.py = cy;
      for (let i = 1; i < count; i++) {
        const angle = (2 * Math.PI * i) / count;
        const copy = JSON.parse(JSON.stringify(src));
        copy.id = `s${Date.now().toString(36)}_${i}_${Math.floor(Math.random() * 1000)}`;
        copy.name = `${src.name} #${i + 1}`;
        copy.transform.px = cx + radius * Math.cos(angle);
        copy.transform.py = cy + radius * Math.sin(angle);
        copy.transform.rz = (src.transform.rz || 0) + angle;
        _state.scene.shapes.push(copy);
        newIds.push(copy.id);
      }
    }
    _state.selectedIds = new Set([...sourceIds, ...newIds]);
    _markDirty(); _renderSidePanel(); _rebuildViewport();
    _toast(`Radial pattern: ${count} copies`, 'success');
  }

  // ── Shape Gallery (Model Forge generators) ──────────────────────────

  async function _openGallery() {
    try {
      const r = await fetch('/api/ai-forge/generators');
      const data = await r.json();
      const gens = data.generators || [];
      // Build a simple modal overlay (no third-party modal lib).
      const existing = document.getElementById('sc-gallery-overlay');
      if (existing) existing.remove();
      const overlay = document.createElement('div');
      overlay.id = 'sc-gallery-overlay';
      overlay.style.cssText = `position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.6);z-index:9999;display:flex;align-items:center;justify-content:center`;
      overlay.innerHTML = `
        <div style="background:var(--bg-card,#fff);color:var(--text-color,#000);border-radius:8px;padding:1rem;max-width:640px;width:90%;max-height:80vh;overflow:auto">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px">
            <h4 style="margin:0">Shape Gallery — Model Forge Generators</h4>
            <button class="form-btn" id="sc-gallery-close">×</button>
          </div>
          <p style="font-size:0.85rem;opacity:0.7">Click a generator to insert it as a scene shape with default options. Customise via the properties panel after inserting.</p>
          <div id="sc-gallery-list" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:6px">
            ${gens.map(g =>
              `<button class="form-btn" data-key="${_esc(g.key)}" style="text-align:left;padding:8px;font-size:0.78rem">
                <strong>${_esc(g.key)}</strong><br>
                <small style="opacity:0.7">${_esc(g.description)}</small>
              </button>`
            ).join('')}
          </div>
        </div>`;
      document.body.appendChild(overlay);
      overlay.querySelector('#sc-gallery-close').onclick = () => overlay.remove();
      overlay.onclick = (e) => { if (e.target === overlay) overlay.remove(); };
      overlay.querySelectorAll('button[data-key]').forEach(b => {
        b.onclick = async () => {
          await _insertGenerator(b.dataset.key);
          overlay.remove();
        };
      });
    } catch (e) { _toast(`Gallery load failed: ${e.message}`, 'error'); }
  }

  async function _insertGenerator(key) {
    try {
      const r = await fetch(`/api/ai-forge/scenes/generator-defaults/${key}`);
      const data = await r.json();
      if (!r.ok) { _toast(data.error || 'Insert failed', 'error'); return; }
      _pushUndo();
      const id = `s${Date.now().toString(36)}_${Math.floor(Math.random() * 1000)}`;
      _state.scene.shapes.push({
        id,
        name: `${key} ${_state.scene.shapes.length + 1}`,
        type: 'generator',
        params: { generatorKey: key, generatorOpts: data.opts },
        transform: _defaultTransform(),
        color: _randomColor(),
        hole: false,
      });
      _state.selectedIds.clear(); _state.selectedIds.add(id);
      _markDirty(); _renderSidePanel(); _rebuildViewport();
      _toast(`Inserted ${key}`, 'success');
      // Fire-and-forget preview load so the placeholder is replaced with real geometry.
      _loadGeneratorPreview(id);
    } catch (e) { _toast(`Insert failed: ${e.message}`, 'error'); }
  }

  async function _loadGeneratorPreview(shapeId) {
    if (!_state.THREE) return;
    const s = _state.scene.shapes.find(sh => sh.id === shapeId);
    if (!s || s.type !== 'generator') return;
    try {
      const r = await fetch('/api/ai-forge/scenes/preview-shape', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'generator', params: s.params }),
      });
      const data = await r.json();
      if (!r.ok) return;
      const THREE = _state.THREE;
      const geom = new THREE.BufferGeometry();
      geom.setAttribute('position', new THREE.BufferAttribute(new Float32Array(data.positions), 3));
      geom.setIndex(new THREE.BufferAttribute(new Uint32Array(data.indices), 1));
      geom.computeVertexNormals();
      const mat = new THREE.MeshLambertMaterial({ color: new THREE.Color(s.color || '#3b82f6') });
      const mesh = new THREE.Mesh(geom, mat);
      mesh.userData.shapeId = s.id;
      _applyTransform(mesh, s.transform);
      const existing = _state.meshNodes.get(s.id);
      if (existing) _state.scene3.remove(existing);
      _state.scene3.add(mesh);
      _state.meshNodes.set(s.id, mesh);
      _highlightSelected();
    } catch { /* preview is best-effort */ }
  }

  async function _importStl(file) {
    if (!file) return;
    if (file.size > 50 * 1024 * 1024) { _toast('File too large (max 50 MB)', 'error'); return; }
    try {
      const buf = await file.arrayBuffer();
      const r = await fetch(`/api/ai-forge/scenes/upload-mesh?filename=${encodeURIComponent(file.name)}`, {
        method: 'POST', headers: { 'Content-Type': 'application/octet-stream' }, body: buf,
      });
      const data = await r.json();
      if (!r.ok) { _toast(`Import failed: ${data.error || r.statusText}`, 'error'); return; }
      _pushUndo();
      const id = `s${Date.now().toString(36)}_${Math.floor(Math.random() * 1000)}`;
      _state.scene.shapes.push({
        id,
        name: file.name.replace(/\.[^.]+$/, ''),
        type: 'mesh',
        params: { meshFile: data.meshFile },
        transform: _defaultTransform(),
        color: _randomColor(),
        hole: false,
      });
      _state.selectedIds.clear(); _state.selectedIds.add(id);
      _markDirty(); _renderSidePanel(); _rebuildViewport();
      _toast(`Imported ${file.name} (${data.stats.vertices} vertices)`, 'success');
      // Try to fetch and add to viewport via Three.js loader.
      _loadImportedMeshIntoViewport(id, file.name, buf);
    } catch (e) { _toast(`Import failed: ${e.message}`, 'error'); }
  }

  async function _loadImportedMeshIntoViewport(shapeId, filename, arrayBuffer) {
    if (!_state.THREE) return;
    const THREE = _state.THREE;
    // Parse STL (binary) client-side for live preview.
    try {
      const dv = new DataView(arrayBuffer);
      // Detect binary STL by header + tri-count length match.
      const triCount = dv.getUint32(80, true);
      const expectedSize = 84 + triCount * 50;
      if (expectedSize !== arrayBuffer.byteLength) {
        // Not binary STL — skip live preview, server still has it.
        return;
      }
      const positions = new Float32Array(triCount * 9);
      let off = 84;
      for (let i = 0; i < triCount; i++) {
        off += 12; // skip normal
        for (let v = 0; v < 9; v++) {
          positions[i * 9 + v] = dv.getFloat32(off, true);
          off += 4;
        }
        off += 2; // attribute byte count
      }
      const geom = new THREE.BufferGeometry();
      geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      geom.computeVertexNormals();
      const s = _state.scene.shapes.find(sh => sh.id === shapeId);
      if (!s) return;
      const mat = new THREE.MeshLambertMaterial({ color: new THREE.Color(s.color || '#3b82f6') });
      const mesh = new THREE.Mesh(geom, mat);
      mesh.userData.shapeId = s.id;
      _applyTransform(mesh, s.transform);
      // Replace the placeholder mesh that _rebuildViewport puts in.
      const existing = _state.meshNodes.get(s.id);
      if (existing) _state.scene3.remove(existing);
      _state.scene3.add(mesh);
      _state.meshNodes.set(s.id, mesh);
    } catch (_) { /* preview is best-effort */ }
  }

  function _randomColor() {
    const palette = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899'];
    return palette[Math.floor(Math.random() * palette.length)];
  }

  // ── Side panel: scene tree + selected properties ───────────────────

  function _renderSidePanel() {
    const onlyId = _state.selectedIds.size === 1 ? Array.from(_state.selectedIds)[0] : null;
    const sel = onlyId ? _state.scene.shapes.find(s => s.id === onlyId) : null;
    const tree = `
      <div style="font-size:0.78rem;font-weight:600;margin-bottom:6px;opacity:0.7">Scene Tree (${_state.scene.shapes.length}) <small style="font-weight:normal">— Ctrl+click for multi-select</small></div>
      <div style="margin-bottom:12px">
        ${_state.scene.shapes.map(s => `
          <div style="display:flex;align-items:center;gap:4px;padding:3px 4px;border-radius:3px;cursor:pointer;background:${_state.selectedIds.has(s.id) ? 'rgba(59,130,246,0.15)' : 'transparent'}"
               data-shape-id="${_esc(s.id)}">
            <span style="display:inline-block;width:10px;height:10px;border-radius:2px;background:${_esc(s.color)}"></span>
            <span style="flex:1;font-size:0.78rem">${_esc(s.name)}</span>
            <small style="opacity:0.6">${_esc(s.type)}${s.hole ? ' (hole)' : ''}</small>
            <button class="form-btn" data-del-shape="${_esc(s.id)}" style="padding:1px 5px;font-size:0.7rem">×</button>
          </div>
        `).join('')}
      </div>
    `;
    let props;
    if (sel) {
      props = _renderProperties(sel);
    } else if (_state.selectedIds.size > 1) {
      props = `<em style="font-size:0.78rem;opacity:0.6">${_state.selectedIds.size} shapes selected — use toolbar buttons (Mirror, Align, Duplicate, Delete) for bulk ops.</em>`;
    } else {
      props = '<em style="font-size:0.78rem;opacity:0.6">No shape selected</em>';
    }
    document.getElementById('sc-side').innerHTML = tree + props;
    // Wire tree clicks (Ctrl/Shift for multi-select).
    document.querySelectorAll('[data-shape-id]').forEach(el => {
      el.onclick = (e) => {
        if (e.target.dataset.delShape) return;
        const id = el.dataset.shapeId;
        if (e.ctrlKey || e.metaKey || e.shiftKey) {
          if (_state.selectedIds.has(id)) _state.selectedIds.delete(id);
          else _state.selectedIds.add(id);
        } else {
          _state.selectedIds.clear();
          _state.selectedIds.add(id);
        }
        _renderSidePanel();
        _highlightSelected();
      };
    });
    document.querySelectorAll('[data-del-shape]').forEach(b => {
      b.onclick = (e) => {
        e.stopPropagation();
        _deleteSingleShape(b.dataset.delShape);
      };
    });
    if (sel) _wireProperties(sel);
  }

  function _deleteSingleShape(id) {
    _pushUndo();
    _state.scene.shapes = _state.scene.shapes.filter(s => s.id !== id);
    _state.selectedIds.delete(id);
    if (_state.scene.shapes.length === 0) {
      const ph = _defaultScene().shapes[0];
      _state.scene.shapes.push(ph);
      _state.selectedIds.add(ph.id);
    } else if (_state.selectedIds.size === 0) {
      _state.selectedIds.add(_state.scene.shapes[0].id);
    }
    _markDirty(); _renderSidePanel(); _rebuildViewport();
  }

  function _renderProperties(s) {
    return `
      <div style="font-size:0.78rem;font-weight:600;margin-bottom:6px;opacity:0.7">Properties — ${_esc(s.name)}</div>
      <label style="display:block;margin-bottom:6px;font-size:0.78rem">Name <input class="form-control" id="sp-name" value="${_esc(s.name)}"></label>
      <label style="display:block;margin-bottom:6px;font-size:0.78rem">Color <input type="color" class="form-control" id="sp-color" value="${_esc(s.color || '#3b82f6')}"></label>
      <label style="display:block;margin-bottom:6px;font-size:0.78rem"><input type="checkbox" id="sp-hole" ${s.hole ? 'checked' : ''}> Hole (subtract from scene)</label>

      <div style="font-size:0.78rem;font-weight:600;margin:10px 0 4px;opacity:0.7">Position (mm)</div>
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:4px">
        ${_xyzInputs(s.transform, 'p', 'mm')}
      </div>
      <div style="font-size:0.78rem;font-weight:600;margin:10px 0 4px;opacity:0.7">Rotation (deg)</div>
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:4px">
        ${_xyzInputs(s.transform, 'r', 'deg')}
      </div>
      <div style="font-size:0.78rem;font-weight:600;margin:10px 0 4px;opacity:0.7">Scale</div>
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:4px">
        ${_xyzInputs(s.transform, 's', '×')}
      </div>

      <div style="font-size:0.78rem;font-weight:600;margin:10px 0 4px;opacity:0.7">Geometry</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:4px">
        ${Object.entries(s.params || {}).map(([k, v]) =>
          `<label style="font-size:0.78rem">${_esc(k)} <input class="form-control sp-param" data-key="${_esc(k)}" type="number" step="0.5" value="${_esc(String(v))}"></label>`
        ).join('')}
      </div>
    `;
  }

  function _xyzInputs(t, prefix, suffix) {
    let html = '';
    for (const axis of ['x', 'y', 'z']) {
      const key = prefix + axis;
      let val = t[key] ?? (prefix === 's' ? 1 : 0);
      if (prefix === 'r') val = (val * 180 / Math.PI).toFixed(1);
      html += `<label style="font-size:0.7rem">${axis.toUpperCase()} <input class="form-control sp-tf" data-key="${key}" type="number" step="${prefix === 's' ? 0.1 : 1}" value="${_esc(String(val))}"></label>`;
    }
    return html;
  }

  function _wireProperties(s) {
    const onChange = () => { _markDirty(); _renderSidePanel(); _rebuildViewport(); };

    document.getElementById('sp-name').oninput = (e) => { s.name = e.target.value; _markDirty(); };
    document.getElementById('sp-color').oninput = (e) => { s.color = e.target.value; _markDirty(); _rebuildViewport(); };
    document.getElementById('sp-hole').onchange = (e) => { _pushUndo(); s.hole = e.target.checked; onChange(); };
    document.querySelectorAll('.sp-tf').forEach(input => {
      input.onchange = (e) => {
        _pushUndo();
        const k = input.dataset.key;
        let val = parseFloat(e.target.value) || 0;
        if (k.startsWith('p')) {
          // Position values respect snap-to-grid.
          val = _snapValue(val);
          e.target.value = val;
        } else if (k.startsWith('r')) {
          val = val * Math.PI / 180;
        }
        s.transform[k] = val;
        _markDirty(); _rebuildViewport();
      };
    });
    document.querySelectorAll('.sp-param').forEach(input => {
      input.onchange = (e) => {
        _pushUndo();
        s.params[input.dataset.key] = parseFloat(e.target.value) || 0;
        _markDirty(); _rebuildViewport();
      };
    });
  }

  // ── Three.js viewport ──────────────────────────────────────────────

  async function _initViewport() {
    if (_state.renderer) return; // already initialised
    if (!_state.THREE) {
      _state.THREE = await import('/js/lib/three.module.min.js');
    }
    const THREE = _state.THREE;
    const canvas = document.getElementById('sc-canvas');
    const wrap = document.getElementById('sc-viewport-wrap');

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(wrap.clientWidth, wrap.clientHeight, false);

    const scene3 = new THREE.Scene();
    scene3.background = new THREE.Color(0x1a1a1a);

    const camera = new THREE.PerspectiveCamera(40, wrap.clientWidth / wrap.clientHeight, 1, 5000);
    camera.position.set(80, 80, 80);
    camera.lookAt(0, 0, 0);

    // Lights.
    scene3.add(new THREE.AmbientLight(0xffffff, 0.45));
    const dir = new THREE.DirectionalLight(0xffffff, 0.85);
    dir.position.set(50, 80, 30);
    scene3.add(dir);

    // Workplane grid.
    const grid = new THREE.GridHelper(200, 20, 0x4b5563, 0x2a2f3a);
    grid.rotation.x = Math.PI / 2; // grid in XY plane (printer bed)
    scene3.add(grid);
    _state.grid = grid;

    // Axes helper.
    const axes = new THREE.AxesHelper(30);
    scene3.add(axes);

    // OrbitControls (already loaded as ESM module).
    const orbitMod = await import('/js/lib/OrbitControls.js');
    const controls = new orbitMod.OrbitControls(camera, canvas);
    controls.target.set(0, 0, 10);
    controls.update();

    _state.renderer = renderer;
    _state.scene3 = scene3;
    _state.camera = camera;
    _state.controls = controls;
    _state.raycaster = new THREE.Raycaster();
    _state.mouse = new THREE.Vector2();

    canvas.onclick = _onViewportClick;
    _setupHandleDragging();

    function animate() {
      if (!_state.renderer) return; // panel closed
      requestAnimationFrame(animate);
      renderer.render(scene3, camera);
    }
    animate();

    // Resize handler.
    const ro = new ResizeObserver(() => {
      if (!_state.renderer) return;
      const w = wrap.clientWidth, h = wrap.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h, false);
    });
    ro.observe(wrap);
  }

  function _rebuildViewport() {
    if (!_state.scene3 || !_state.THREE) return;
    const THREE = _state.THREE;
    const scene3 = _state.scene3;
    // Remove existing shape meshes.
    for (const node of _state.meshNodes.values()) scene3.remove(node);
    _state.meshNodes.clear();

    document.getElementById('sc-empty').style.display = _state.scene.shapes.length ? 'none' : 'block';

    for (const s of _state.scene.shapes) {
      const geom = _buildGeometry(THREE, s);
      const mat = new THREE.MeshLambertMaterial({
        color: new THREE.Color(s.color || '#3b82f6'),
        opacity: s.hole ? 0.35 : 1.0,
        transparent: s.hole,
        wireframe: s.hole,
      });
      const mesh = new THREE.Mesh(geom, mat);
      mesh.userData.shapeId = s.id;
      _applyTransform(mesh, s.transform);
      scene3.add(mesh);
      _state.meshNodes.set(s.id, mesh);
    }
    _highlightSelected();
  }

  function _buildGeometry(THREE, s) {
    const p = s.params || {};
    switch (s.type) {
      case 'box':      return new THREE.BoxGeometry(p.w || 20, p.h || 20, p.d || 20);
      case 'sphere':   return new THREE.SphereGeometry(p.r || 10, p.segments || 24, p.rings || 16);
      case 'cylinder': return new THREE.CylinderGeometry(p.r || 10, p.r || 10, p.h || 20, p.segments || 32);
      case 'cone':     return new THREE.CylinderGeometry(p.r2 || 0.01, p.r1 || 10, p.h || 20, p.segments || 32);
      case 'torus':    return new THREE.TorusGeometry(p.R || 15, p.r || 5, p.tubeSegs || 16, p.ringSegs || 32);
      case 'prism': {
        const g = new THREE.CylinderGeometry(p.r || 10, p.r || 10, p.h || 20, p.sides || 6);
        return g;
      }
      case 'pyramid':  return new THREE.ConeGeometry(p.w / 2 || 10, p.h || 20, 4);
      default:         return new THREE.BoxGeometry(20, 20, 20);
    }
  }

  function _applyTransform(mesh, t = {}) {
    mesh.position.set(t.px || 0, t.py || 0, t.pz || 0);
    mesh.rotation.set(t.rx || 0, t.ry || 0, t.rz || 0);
    mesh.scale.set(t.sx || 1, t.sy || 1, t.sz || 1);
  }

  function _onViewportClick(e) {
    if (!_state.renderer) return;
    const canvas = e.target;
    const rect = canvas.getBoundingClientRect();
    _state.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    _state.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    _state.raycaster.setFromCamera(_state.mouse, _state.camera);
    const objects = Array.from(_state.meshNodes.values());
    const hits = _state.raycaster.intersectObjects(objects, false);
    if (hits.length > 0) {
      const id = hits[0].object.userData.shapeId;
      if (id) {
        // Ctrl/Shift + click = toggle in selection set; plain click = replace.
        if (e.ctrlKey || e.metaKey || e.shiftKey) {
          if (_state.selectedIds.has(id)) _state.selectedIds.delete(id);
          else _state.selectedIds.add(id);
        } else {
          _state.selectedIds.clear();
          _state.selectedIds.add(id);
        }
        _renderSidePanel();
        _highlightSelected();
      }
    }
  }

  function _highlightSelected() {
    if (!_state.scene3) return;
    for (const [id, mesh] of _state.meshNodes) {
      const isSel = _state.selectedIds.has(id);
      mesh.material.emissive = mesh.material.emissive || new _state.THREE.Color(0x000000);
      mesh.material.emissive.set(isSel ? 0x444444 : 0x000000);
    }
    _updateTransformHandles();
  }

  // ── Visual translate handles (3 colored arrows) ────────────────────

  function _ensureHandlesGroup() {
    if (!_state.THREE || !_state.scene3) return null;
    if (_state.handlesGroup) return _state.handlesGroup;
    const THREE = _state.THREE;
    const group = new THREE.Group();
    group.name = 'translate-handles';
    group.visible = false;
    const arrowLen = 18;
    const headLen = 4;
    const headW = 2;
    const axes = [
      { dir: new THREE.Vector3(1, 0, 0), color: 0xff4444 },
      { dir: new THREE.Vector3(0, 1, 0), color: 0x44ff44 },
      { dir: new THREE.Vector3(0, 0, 1), color: 0x4488ff },
    ];
    for (const a of axes) {
      const arrow = new THREE.ArrowHelper(a.dir, new THREE.Vector3(0, 0, 0), arrowLen, a.color, headLen, headW);
      arrow.userData.axisDir = a.dir.clone();
      arrow.userData.axisColor = a.color;
      // Make the arrow line thicker and add a hit-cylinder for raycasting.
      const hitGeo = new THREE.CylinderGeometry(1.5, 1.5, arrowLen, 8);
      const hitMat = new THREE.MeshBasicMaterial({ color: a.color, transparent: true, opacity: 0.0 });
      const hit = new THREE.Mesh(hitGeo, hitMat);
      // Cylinder is along Y; rotate to align with axis direction.
      if (a.dir.x === 1) hit.rotation.z = -Math.PI / 2;
      else if (a.dir.z === 1) hit.rotation.x = Math.PI / 2;
      hit.position.copy(a.dir).multiplyScalar(arrowLen / 2);
      hit.userData.axisDir = a.dir.clone();
      hit.userData.handle = true;
      arrow.add(hit);
      group.add(arrow);
    }
    _state.scene3.add(group);
    _state.handlesGroup = group;
    return group;
  }

  function _updateTransformHandles() {
    const group = _ensureHandlesGroup();
    if (!group) return;
    if (_state.selectedIds.size !== 1) {
      group.visible = false;
      return;
    }
    const id = Array.from(_state.selectedIds)[0];
    const mesh = _state.meshNodes.get(id);
    if (!mesh) { group.visible = false; return; }
    group.visible = true;
    group.position.copy(mesh.position);
  }

  function _setupHandleDragging() {
    if (!_state.renderer) return;
    const canvas = _state.renderer.domElement;
    const THREE = _state.THREE;
    let dragging = null; // { axis: 'x'|'y'|'z', start: Vector3, shape, plane }

    canvas.addEventListener('pointerdown', (e) => {
      if (_state.selectedIds.size !== 1) return;
      const group = _state.handlesGroup;
      if (!group || !group.visible) return;
      const rect = canvas.getBoundingClientRect();
      _state.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      _state.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      _state.raycaster.setFromCamera(_state.mouse, _state.camera);
      const hits = _state.raycaster.intersectObjects(group.children, true);
      const hit = hits.find(h => h.object.userData.axisDir);
      if (!hit) return;
      e.stopPropagation();
      _state.controls.enabled = false; // pause orbit while dragging
      const axisDir = hit.object.userData.axisDir.clone();
      const id = Array.from(_state.selectedIds)[0];
      const shape = _state.scene.shapes.find(sh => sh.id === id);
      // Build a plane through current shape position, normal perpendicular to axis + facing camera.
      const camDir = new THREE.Vector3();
      _state.camera.getWorldDirection(camDir);
      const planeNormal = camDir.clone().sub(camDir.clone().projectOnVector(axisDir)).normalize();
      const plane = new THREE.Plane();
      plane.setFromNormalAndCoplanarPoint(planeNormal, group.position);
      const hitPoint = new THREE.Vector3();
      _state.raycaster.ray.intersectPlane(plane, hitPoint);
      _pushUndo();
      dragging = {
        axisDir,
        plane,
        startPoint: hitPoint.clone(),
        startTransform: { ...shape.transform },
        shape,
      };
    });

    canvas.addEventListener('pointermove', (e) => {
      if (!dragging) return;
      const rect = canvas.getBoundingClientRect();
      _state.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      _state.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      _state.raycaster.setFromCamera(_state.mouse, _state.camera);
      const point = new THREE.Vector3();
      _state.raycaster.ray.intersectPlane(dragging.plane, point);
      const delta = point.clone().sub(dragging.startPoint).dot(dragging.axisDir);
      const snapped = _snapValue(delta);
      const t = dragging.shape.transform;
      if (Math.abs(dragging.axisDir.x) > 0.5) t.px = (dragging.startTransform.px || 0) + snapped;
      if (Math.abs(dragging.axisDir.y) > 0.5) t.py = (dragging.startTransform.py || 0) + snapped;
      if (Math.abs(dragging.axisDir.z) > 0.5) t.pz = (dragging.startTransform.pz || 0) + snapped;
      const mesh = _state.meshNodes.get(dragging.shape.id);
      if (mesh) _applyTransform(mesh, t);
      _state.handlesGroup.position.copy(mesh.position);
      _markDirty();
    });

    canvas.addEventListener('pointerup', () => {
      if (!dragging) return;
      dragging = null;
      _state.controls.enabled = true;
      _renderSidePanel(); // refresh numeric inputs
    });
  }

  // ── Save / Open / New / Render ─────────────────────────────────────

  function _markDirty() { _state.saved = false; const e = document.getElementById('sc-saved-status'); if (e) { e.textContent = '● unsaved'; e.style.color = '#f59e0b'; } }
  function _markSaved() { _state.saved = true; const e = document.getElementById('sc-saved-status'); if (e) { e.textContent = _state.sceneId ? `● scene #${_state.sceneId}` : '● new scene'; e.style.color = '#22c55e'; } }

  function _onNew() {
    if (!_state.saved && !confirm('Discard unsaved changes?')) return;
    _state.scene = _defaultScene();
    _state.sceneId = null;
    _state.selectedIds.clear();
    if (_state.scene.shapes[0]) _state.selectedIds.add(_state.scene.shapes[0].id);
    _state.undoStack.length = 0;
    _state.redoStack.length = 0;
    _renderSidePanel();
    _rebuildViewport();
    _markSaved();
  }

  async function _onOpen() {
    try {
      const r = await fetch('/api/ai-forge/scenes');
      const data = await r.json();
      const scenes = data.scenes || [];
      if (scenes.length === 0) { _toast('No saved scenes yet', 'info'); return; }
      const list = scenes.map((s, i) => `${i + 1}. ${s.name} (${s.shape_count} shapes, ${s.updated_at})`).join('\n');
      const choice = prompt(`Choose a scene to open:\n\n${list}\n\nEnter number:`);
      const idx = parseInt(choice, 10);
      if (!Number.isFinite(idx) || idx < 1 || idx > scenes.length) return;
      const sel = scenes[idx - 1];
      _state.scene = JSON.parse(sel.scene_json);
      _state.sceneId = sel.id;
      _state.selectedIds.clear();
      if (_state.scene.shapes[0]) _state.selectedIds.add(_state.scene.shapes[0].id);
      _state.undoStack.length = 0;
      _state.redoStack.length = 0;
      _renderSidePanel();
      _rebuildViewport();
      _markSaved();
    } catch (e) { _toast(`Open failed: ${e.message}`, 'error'); }
  }

  async function _onSave() {
    try {
      const name = prompt('Scene name', _state.scene.name || 'Untitled') || _state.scene.name;
      _state.scene.name = name;
      const url = _state.sceneId ? `/api/ai-forge/scenes/${_state.sceneId}` : '/api/ai-forge/scenes';
      const method = _state.sceneId ? 'PUT' : 'POST';
      const r = await fetch(url, {
        method, headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scene: _state.scene }),
      });
      const data = await r.json();
      if (!r.ok) { _toast(`Save failed: ${data.error || r.statusText}`, 'error'); return; }
      _state.sceneId = data.id;
      _markSaved();
      _toast('Scene saved', 'success');
    } catch (e) { _toast(`Save failed: ${e.message}`, 'error'); }
  }

  async function _onRender() {
    const status = document.getElementById('sc-status');
    const format = 'stl';
    status.innerHTML = '<em>Rendering scene…</em>';
    try {
      const url = _state.sceneId
        ? `/api/ai-forge/scenes/${_state.sceneId}/render`
        : `/api/ai-forge/scenes/render`;
      const useCsg = document.getElementById('sc-csg')?.checked !== false;
      const r = await fetch(url, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scene: _state.scene, format, useCsg }),
      });
      const data = await r.json();
      if (!r.ok) {
        status.innerHTML = `<span style="color:#ef4444">Failed: ${_esc(data.error || r.statusText)}</span>`;
        return;
      }
      const j = data.job;
      const stats = data.stats || {};
      status.innerHTML = `
        <div style="color:#22c55e;font-weight:600">✓ Rendered scene → ${_esc(j.result_format)} · ${j.result_size_bytes} bytes</div>
        <div style="font-size:0.85rem;margin-top:4px">Vertices: ${(stats.vertices || 0).toLocaleString()} · Faces: ${(stats.faces || 0).toLocaleString()}</div>
        <a href="/api/ai-forge/jobs/${j.id}/download" class="form-btn primary" download style="margin-top:6px">Download ${_esc(j.result_format)}</a>`;
    } catch (e) {
      status.innerHTML = `<span style="color:#ef4444">Failed: ${_esc(e.message)}</span>`;
    }
  }

  window.loadSceneComposer = _load;
})();
