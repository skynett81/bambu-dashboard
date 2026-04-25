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
    selectedId: null,
    THREE: null,
    renderer: null, scene3: null, camera: null, controls: null,
    grid: null,
    meshNodes: new Map(),     // shapeId → THREE.Mesh
    raycaster: null,
    mouse: null,
    saved: true,
  };

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
            <button class="form-btn primary" id="sc-render">Render &amp; Download</button>
            <span style="margin-left:auto;font-size:0.85rem;opacity:0.7" id="sc-saved-status">●</span>
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

    if (!_state.scene) _state.scene = _defaultScene();

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
    _state.selectedId = id;
    _markDirty();
    _renderSidePanel();
    _rebuildViewport();
  }

  function _randomColor() {
    const palette = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899'];
    return palette[Math.floor(Math.random() * palette.length)];
  }

  // ── Side panel: scene tree + selected properties ───────────────────

  function _renderSidePanel() {
    const sel = _state.scene.shapes.find(s => s.id === _state.selectedId);
    const tree = `
      <div style="font-size:0.78rem;font-weight:600;margin-bottom:6px;opacity:0.7">Scene Tree (${_state.scene.shapes.length})</div>
      <div style="margin-bottom:12px">
        ${_state.scene.shapes.map(s => `
          <div style="display:flex;align-items:center;gap:4px;padding:3px 4px;border-radius:3px;cursor:pointer;background:${s.id === _state.selectedId ? 'rgba(59,130,246,0.15)' : 'transparent'}"
               data-shape-id="${_esc(s.id)}">
            <span style="display:inline-block;width:10px;height:10px;border-radius:2px;background:${_esc(s.color)}"></span>
            <span style="flex:1;font-size:0.78rem">${_esc(s.name)}</span>
            <small style="opacity:0.6">${_esc(s.type)}${s.hole ? ' (hole)' : ''}</small>
            <button class="form-btn" data-del-shape="${_esc(s.id)}" style="padding:1px 5px;font-size:0.7rem">×</button>
          </div>
        `).join('')}
      </div>
    `;
    const props = sel ? _renderProperties(sel) : '<em style="font-size:0.78rem;opacity:0.6">No shape selected</em>';
    document.getElementById('sc-side').innerHTML = tree + props;
    // Wire tree clicks.
    document.querySelectorAll('[data-shape-id]').forEach(el => {
      el.onclick = (e) => {
        if (e.target.dataset.delShape) return;
        _state.selectedId = el.dataset.shapeId;
        _renderSidePanel();
        _highlightSelected();
      };
    });
    document.querySelectorAll('[data-del-shape]').forEach(b => {
      b.onclick = (e) => {
        e.stopPropagation();
        _deleteShape(b.dataset.delShape);
      };
    });
    if (sel) _wireProperties(sel);
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
    document.getElementById('sp-hole').onchange = (e) => { s.hole = e.target.checked; onChange(); };
    document.querySelectorAll('.sp-tf').forEach(input => {
      input.onchange = (e) => {
        const k = input.dataset.key;
        let val = parseFloat(e.target.value) || 0;
        if (k.startsWith('r')) val = val * Math.PI / 180;
        s.transform[k] = val;
        _markDirty(); _rebuildViewport();
      };
    });
    document.querySelectorAll('.sp-param').forEach(input => {
      input.onchange = (e) => {
        s.params[input.dataset.key] = parseFloat(e.target.value) || 0;
        _markDirty(); _rebuildViewport();
      };
    });
  }

  function _deleteShape(id) {
    _state.scene.shapes = _state.scene.shapes.filter(s => s.id !== id);
    if (_state.selectedId === id) _state.selectedId = _state.scene.shapes[0]?.id || null;
    _markDirty();
    _renderSidePanel();
    _rebuildViewport();
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
        _state.selectedId = id;
        _renderSidePanel();
        _highlightSelected();
      }
    }
  }

  function _highlightSelected() {
    if (!_state.scene3) return;
    for (const [id, mesh] of _state.meshNodes) {
      const isSel = id === _state.selectedId;
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
    _state.selectedId = _state.scene.shapes[0]?.id || null;
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
      _state.selectedId = _state.scene.shapes[0]?.id || null;
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
      const r = await fetch(url, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scene: _state.scene, format }),
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
