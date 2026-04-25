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
            <button class="form-btn" id="sc-import-stl" title="Import STL/OBJ/3MF as a scene shape">Import…</button>
            <input type="file" id="sc-import-file" accept=".stl,.obj,.3mf" style="display:none">
            <span style="border-left:1px solid var(--border-color);height:24px;margin:0 4px"></span>
            <button class="form-btn" id="sc-undo" title="Undo (Ctrl+Z)">↶</button>
            <button class="form-btn" id="sc-redo" title="Redo (Ctrl+Y)">↷</button>
            <button class="form-btn" id="sc-duplicate" title="Duplicate (Ctrl+D)">Duplicate</button>
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
        if (k.startsWith('r')) val = val * Math.PI / 180;
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
