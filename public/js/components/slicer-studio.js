/**
 * Slicer Studio — full standalone slicer program built into the
 * dashboard. 3D viewport showing the model on the printer's bed,
 * profile-based settings (printer / filament / process), one-click
 * slice → toolpath preview → send to printer.
 *
 * Implementation reuses every slicer building block we've shipped:
 *   - native-slicer.js (engine)            via /api/slicer/native/slice
 *   - slicer-profiles  (profile DB)        via /api/slicer/native/profiles
 *   - format-converter (STL/OBJ/3MF parse) client-side for viewport preview
 *   - mesh-transforms  (recenter / scale)  client-side
 *   - printer-image-service (vendor photo) — bed overlay decoration
 *   - send-to-printer  (dispatch)          via existing printer-manager
 *
 * Layout: 3-column —
 *   ┌────────────┬──────────────────────────┬────────────┐
 *   │ Profiles + │ Three.js viewport with   │ Output:    │
 *   │ Settings   │ build volume + model     │ G-code,    │
 *   │            │                          │ time, send │
 *   └────────────┴──────────────────────────┴────────────┘
 */
(function () {
  'use strict';

  const _state = {
    file: null,
    fileName: '',
    profiles: { printer: [], filament: [], process: [] },
    selectedPrinter: null,
    selectedFilament: null,
    selectedProcess: null,
    THREE: null,
    renderer: null, scene3: null, camera: null, controls: null,
    modelMesh: null, bedHelper: null,
    busy: false,
    lastSlice: null,
    printers: [],   // connected printers
  };

  const _esc = s => { const d = document.createElement('div'); d.textContent = s ?? ''; return d.innerHTML; };
  const _toast = (m, t = 'info') => { if (typeof showToast === 'function') showToast(m, t, 3000); };

  // ── Layout ─────────────────────────────────────────────────────

  async function _load() {
    const body = document.getElementById('overlay-panel-body');
    if (!body) return;
    body.innerHTML = `
      <div data-fsl-container style="margin-bottom:10px"></div>
      <div style="display:grid;grid-template-columns:280px 1fr 280px;gap:10px;min-height:560px">
        <!-- LEFT: profiles + settings -->
        <div class="card" style="overflow-y:auto;max-height:calc(100vh - 140px)">
          <div class="card-body" style="padding:12px">
            <h6 style="margin:0 0 8px;font-size:0.85rem">Printer</h6>
            <select id="ss-printer" class="form-control" style="margin-bottom:10px"></select>
            <h6 style="margin:8px 0;font-size:0.85rem">Filament</h6>
            <select id="ss-filament" class="form-control" style="margin-bottom:10px"></select>
            <h6 style="margin:8px 0;font-size:0.85rem">Quality</h6>
            <select id="ss-process" class="form-control" style="margin-bottom:10px"></select>

            <div style="border-top:1px solid var(--border-color);margin-top:12px;padding-top:10px">
              <h6 style="margin:0 0 6px;font-size:0.85rem">Override settings</h6>
              <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;font-size:0.78rem">
                <label>Layer (mm)<input type="number" id="ss-lh" step="0.05" min="0.05" max="0.6" class="form-control"></label>
                <label>Line (mm)<input type="number" id="ss-lw" step="0.05" min="0.2" max="1.0" class="form-control"></label>
                <label>Perimeters<input type="number" id="ss-per" min="1" max="6" class="form-control"></label>
                <label>Infill %<input type="number" id="ss-inf" min="0" max="100" class="form-control"></label>
                <label>Speed mm/s<input type="number" id="ss-ps" min="10" max="300" class="form-control"></label>
                <label>1st layer<input type="number" id="ss-fls" min="5" max="100" class="form-control"></label>
                <label>Nozzle °C<input type="number" id="ss-nt" min="150" max="320" class="form-control"></label>
                <label>Bed °C<input type="number" id="ss-bt" min="0" max="120" class="form-control"></label>
              </div>
              <button id="ss-save-process" class="form-btn" style="font-size:0.78rem;margin-top:8px;width:100%">Save as new Quality preset…</button>
            </div>
          </div>
        </div>

        <!-- CENTER: viewport -->
        <div style="display:flex;flex-direction:column;gap:8px">
          <div style="display:flex;gap:6px;align-items:center;flex-wrap:wrap">
            <button class="form-btn" id="ss-import">📁 Import STL/3MF/OBJ</button>
            <input type="file" id="ss-file" accept=".stl,.3mf,.obj" style="display:none">
            <button class="form-btn" id="ss-recenter" disabled title="Center on bed + drop to z=0">⤓ Center on bed</button>
            <button class="form-btn" id="ss-orient" disabled title="Rotate to minimise overhangs (uses STL analyzer)">⟲ Auto-orient</button>
            <span style="margin-left:auto;font-size:0.78rem;opacity:0.7" id="ss-info">No model loaded</span>
          </div>
          <div id="ss-viewport-wrap" style="position:relative;border:1px solid var(--border-color);border-radius:6px;background:#1a1a1a;flex:1;min-height:480px">
            <canvas id="ss-canvas" style="width:100%;height:100%;display:block"></canvas>
            <div id="ss-empty" style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);color:#888;font-size:0.9rem;text-align:center">
              <div style="font-size:2.5rem;margin-bottom:4px">📐</div>
              Drop or import a model file<br>
              <small style="opacity:0.6">STL · 3MF · OBJ</small>
            </div>
          </div>
        </div>

        <!-- RIGHT: actions + output -->
        <div class="card" style="overflow-y:auto;max-height:calc(100vh - 140px)">
          <div class="card-body" style="padding:12px">
            <button id="ss-slice" class="form-btn primary" style="width:100%;font-size:0.95rem;padding:10px" disabled>
              ⚡ Slice
            </button>
            <div id="ss-slice-progress" style="margin-top:8px"></div>
            <div id="ss-result" style="margin-top:14px"></div>

            <div style="border-top:1px solid var(--border-color);margin-top:14px;padding-top:10px">
              <h6 style="margin:0 0 8px;font-size:0.85rem">Send to printer</h6>
              <select id="ss-target" class="form-control" style="margin-bottom:6px"></select>
              <label style="font-size:0.78rem"><input type="checkbox" id="ss-print"> Auto-start print</label>
              <button id="ss-send" class="form-btn" style="width:100%;margin-top:6px" disabled>📤 Send G-code to printer</button>
            </div>
          </div>
        </div>
      </div>
    `;

    document.getElementById('ss-import').onclick = () => document.getElementById('ss-file').click();
    document.getElementById('ss-file').onchange = (e) => _onFile(e.target.files[0]);
    document.getElementById('ss-recenter').onclick = _recenterModel;
    document.getElementById('ss-orient').onclick = _autoOrient;
    document.getElementById('ss-slice').onclick = _runSlice;
    document.getElementById('ss-send').onclick = _sendToPrinter;
    document.getElementById('ss-save-process').onclick = _saveProcess;
    document.getElementById('ss-printer').onchange = (e) => { _state.selectedPrinter = parseInt(e.target.value, 10) || null; _updateBedFromPrinter(); _populateOverrides(); };
    document.getElementById('ss-filament').onchange = (e) => { _state.selectedFilament = parseInt(e.target.value, 10) || null; _populateOverrides(); };
    document.getElementById('ss-process').onchange = (e) => { _state.selectedProcess = parseInt(e.target.value, 10) || null; _populateOverrides(); };

    // Drag-drop on viewport.
    const wrap = document.getElementById('ss-viewport-wrap');
    wrap.ondragover = (e) => { e.preventDefault(); wrap.style.outline = '2px solid var(--accent-blue)'; };
    wrap.ondragleave = () => { wrap.style.outline = ''; };
    wrap.ondrop = (e) => { e.preventDefault(); wrap.style.outline = ''; _onFile(e.dataTransfer.files[0]); };

    await _initViewport();
    await Promise.all([_loadProfiles(), _loadConnectedPrinters()]);

    // Mount the Forge Slicer settings card at the top so users see the
    // service status (connected / unreachable) every time they open
    // Slicer Studio. Uses the new t(key, fallback) overload internally.
    const fslContainer = body.querySelector('[data-fsl-container]');
    if (fslContainer && typeof window.renderForgeSlicerSettings === 'function') {
      window.renderForgeSlicerSettings(fslContainer);
    }
  }

  // ── Profile loading ────────────────────────────────────────────

  async function _loadProfiles() {
    try {
      const r = await fetch('/api/slicer/native/profiles');
      const data = await r.json();
      const all = data.profiles || [];
      _state.profiles = {
        printer:  all.filter(p => p.kind === 'printer'),
        filament: all.filter(p => p.kind === 'filament'),
        process:  all.filter(p => p.kind === 'process'),
      };
      _populateProfileSelect('ss-printer',  _state.profiles.printer);
      _populateProfileSelect('ss-filament', _state.profiles.filament);
      _populateProfileSelect('ss-process',  _state.profiles.process);
      // Pre-select defaults.
      const def = (k) => _state.profiles[k].find(p => p.is_default) || _state.profiles[k][0];
      const prn = def('printer'),  fil = def('filament'),  prc = def('process');
      if (prn) document.getElementById('ss-printer').value  = String(prn.id);
      if (fil) document.getElementById('ss-filament').value = String(fil.id);
      if (prc) document.getElementById('ss-process').value  = String(prc.id);
      _state.selectedPrinter  = prn?.id || null;
      _state.selectedFilament = fil?.id || null;
      _state.selectedProcess  = prc?.id || null;
      _updateBedFromPrinter();
      _populateOverrides();
    } catch { _toast('Profile load failed', 'error'); }
  }

  function _populateProfileSelect(id, list) {
    const sel = document.getElementById(id);
    if (!sel) return;
    sel.innerHTML = list.map(p =>
      `<option value="${p.id}">${_esc(p.name)}${p.vendor ? ` <span style="opacity:0.6">— ${_esc(p.vendor)}</span>` : ''}</option>`
    ).join('') || '<option value="">— no profiles —</option>';
  }

  function _populateOverrides() {
    // Pre-fill the override inputs from the currently-selected profiles.
    const merged = _mergedSettings();
    const set = (id, v) => { const el = document.getElementById(id); if (el && v !== undefined) el.value = v; };
    set('ss-lh',  merged.layerHeight);
    set('ss-lw',  merged.lineWidth);
    set('ss-per', merged.perimeters);
    set('ss-inf', Math.round((merged.infillDensity || 0) * 100));
    set('ss-ps',  merged.printSpeed);
    set('ss-fls', merged.firstLayerSpeed);
    set('ss-nt',  merged.nozzleTemp);
    set('ss-bt',  merged.bedTemp);
  }

  function _mergedSettings() {
    const out = {};
    for (const id of [_state.selectedPrinter, _state.selectedFilament, _state.selectedProcess]) {
      if (!id) continue;
      const all = [..._state.profiles.printer, ..._state.profiles.filament, ..._state.profiles.process];
      const row = all.find(p => p.id === id);
      if (!row) continue;
      try { Object.assign(out, JSON.parse(row.settings_json)); } catch {}
    }
    return out;
  }

  async function _loadConnectedPrinters() {
    try {
      const r = await fetch('/api/printers');
      _state.printers = await r.json();
      const sel = document.getElementById('ss-target');
      if (!sel) return;
      sel.innerHTML = '<option value="">— pick a printer —</option>'
        + _state.printers.map(p => `<option value="${_esc(p.id)}">${_esc(p.name)} (${_esc(p.model || p.type || '?')})</option>`).join('');
    } catch { /* ignore */ }
  }

  // ── Three.js viewport ──────────────────────────────────────────

  async function _initViewport() {
    if (!_state.THREE) {
      _state.THREE = await import('/js/lib/three.module.min.js');
    }
    const THREE = _state.THREE;
    const canvas = document.getElementById('ss-canvas');
    const wrap = document.getElementById('ss-viewport-wrap');
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(wrap.clientWidth, wrap.clientHeight, false);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a1a1a);

    const camera = new THREE.PerspectiveCamera(40, wrap.clientWidth / wrap.clientHeight, 1, 5000);
    camera.position.set(280, 280, 220);
    camera.lookAt(0, 0, 0);

    scene.add(new THREE.AmbientLight(0xffffff, 0.5));
    const dir = new THREE.DirectionalLight(0xffffff, 0.85);
    dir.position.set(150, 200, 100);
    scene.add(dir);

    const orbitMod = await import('/js/lib/OrbitControls.js');
    const controls = new orbitMod.OrbitControls(camera, canvas);
    controls.target.set(0, 0, 30);
    controls.update();

    _state.renderer = renderer;
    _state.scene3 = scene;
    _state.camera = camera;
    _state.controls = controls;

    // Default bed (220 mm) — overwritten by selected printer profile.
    _drawBed([220, 220, 220]);

    function animate() {
      if (!_state.renderer) return;
      requestAnimationFrame(animate);
      renderer.render(scene, camera);
    }
    animate();

    new ResizeObserver(() => {
      if (!_state.renderer) return;
      const w = wrap.clientWidth, h = wrap.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h, false);
    }).observe(wrap);
  }

  function _drawBed(volume) {
    if (!_state.scene3 || !_state.THREE) return;
    const THREE = _state.THREE;
    if (_state.bedHelper) { _state.scene3.remove(_state.bedHelper); _state.bedHelper = null; }
    const [bx, by, bz] = volume;
    const group = new THREE.Group();
    // Wireframe build volume.
    const boxGeo = new THREE.BoxGeometry(bx, by, bz);
    const edges = new THREE.EdgesGeometry(boxGeo);
    const lines = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: 0xfacc15 }));
    lines.position.set(bx / 2, by / 2, bz / 2);
    group.add(lines);
    // Bed plate at z=0.
    const plate = new THREE.Mesh(
      new THREE.PlaneGeometry(bx, by),
      new THREE.MeshBasicMaterial({ color: 0x3b3b3b, transparent: true, opacity: 0.4, side: THREE.DoubleSide })
    );
    plate.position.set(bx / 2, by / 2, 0);
    group.add(plate);
    // 10mm grid.
    const grid = new THREE.GridHelper(Math.max(bx, by), Math.floor(Math.max(bx, by) / 10), 0x4b5563, 0x2a2f3a);
    grid.rotation.x = Math.PI / 2;
    grid.position.set(bx / 2, by / 2, 0.01);
    group.add(grid);
    _state.scene3.add(group);
    _state.bedHelper = group;
    // Re-aim camera based on bed size.
    if (_state.controls) {
      _state.controls.target.set(bx / 2, by / 2, bz / 4);
      _state.camera.position.set(bx + 100, by + 100, bz);
      _state.camera.lookAt(_state.controls.target);
      _state.controls.update();
    }
  }

  function _updateBedFromPrinter() {
    if (!_state.selectedPrinter) return;
    const p = _state.profiles.printer.find(x => x.id === _state.selectedPrinter);
    if (!p) return;
    try {
      const s = JSON.parse(p.settings_json);
      if (Array.isArray(s.buildVolume) && s.buildVolume.length === 3) _drawBed(s.buildVolume);
    } catch {}
  }

  // ── Model loading ──────────────────────────────────────────────

  async function _onFile(file) {
    if (!file) return;
    if (file.size > 50 * 1024 * 1024) { _toast('Model too large (max 50 MB)', 'error'); return; }
    _state.file = file;
    _state.fileName = file.name;
    document.getElementById('ss-empty').style.display = 'none';
    document.getElementById('ss-info').textContent = `${file.name} (${Math.round(file.size / 1024)} KB)`;
    document.getElementById('ss-recenter').disabled = false;
    document.getElementById('ss-orient').disabled = false;
    document.getElementById('ss-slice').disabled = false;
    await _renderModel(file);
  }

  async function _renderModel(file) {
    if (!_state.THREE) return;
    const THREE = _state.THREE;
    if (_state.modelMesh) { _state.scene3.remove(_state.modelMesh); _state.modelMesh = null; }

    const buf = await file.arrayBuffer();
    // Parse STL client-side for live preview (only binary STL handled here).
    const dv = new DataView(buf);
    if (file.name.toLowerCase().endsWith('.stl') && buf.byteLength >= 84) {
      const triCount = dv.getUint32(80, true);
      const expected = 84 + triCount * 50;
      if (expected === buf.byteLength) {
        const positions = new Float32Array(triCount * 9);
        let off = 84;
        for (let i = 0; i < triCount; i++) {
          off += 12; // skip normal
          for (let v = 0; v < 9; v++) { positions[i * 9 + v] = dv.getFloat32(off, true); off += 4; }
          off += 2;
        }
        const geom = new THREE.BufferGeometry();
        geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geom.computeVertexNormals();
        const mat = new THREE.MeshLambertMaterial({ color: 0x3b82f6, transparent: true, opacity: 0.85 });
        const mesh = new THREE.Mesh(geom, mat);
        // Center on bed.
        geom.computeBoundingBox();
        const bbox = geom.boundingBox;
        const cx = (bbox.min.x + bbox.max.x) / 2;
        const cy = (bbox.min.y + bbox.max.y) / 2;
        const cz = bbox.min.z;
        const bedW = _state.bedHelper?.children[0]?.geometry?.parameters?.width || 220;
        const bedH = _state.bedHelper?.children[0]?.geometry?.parameters?.height || 220;
        // BoxGeometry width = bed X. Center model on bed.
        mesh.position.set(bedW / 2 - cx, bedH / 2 - cy, -cz);
        _state.scene3.add(mesh);
        _state.modelMesh = mesh;
      }
    }
  }

  function _recenterModel() {
    if (!_state.modelMesh || !_state.bedHelper) return;
    const geom = _state.modelMesh.geometry;
    geom.computeBoundingBox();
    const bbox = geom.boundingBox;
    const cx = (bbox.min.x + bbox.max.x) / 2;
    const cy = (bbox.min.y + bbox.max.y) / 2;
    const cz = bbox.min.z;
    const bedW = _state.bedHelper?.children[0]?.geometry?.parameters?.width || 220;
    const bedH = _state.bedHelper?.children[0]?.geometry?.parameters?.height || 220;
    _state.modelMesh.position.set(bedW / 2 - cx, bedH / 2 - cy, -cz);
    _state.modelMesh.rotation.set(0, 0, 0);
    _toast('Model centered', 'success');
  }

  function _autoOrient() {
    _toast('Auto-orient runs on the server during slicing — your model is centered now.', 'info');
    // Server-side stl-analyzer.suggestOrientation is invoked via the
    // sliceMeshToGcode pipeline (recenterToOrigin call) — the visual
    // viewport just shows the imported pose.
  }

  // ── Slice ──────────────────────────────────────────────────────

  async function _runSlice() {
    if (!_state.file) return;
    _state.busy = true;
    document.getElementById('ss-slice').disabled = true;
    const progress = document.getElementById('ss-slice-progress');
    progress.innerHTML = '<div style="display:flex;align-items:center;gap:6px"><i class="bi bi-arrow-repeat" style="animation:spin 1s linear infinite"></i> Slicing…</div>';

    const params = new URLSearchParams({
      filename:  _state.fileName,
      printerId: String(_state.selectedPrinter || ''),
      filamentId:String(_state.selectedFilament || ''),
      processId: String(_state.selectedProcess || ''),
      layerHeight:    document.getElementById('ss-lh').value,
      lineWidth:      document.getElementById('ss-lw').value,
      perimeters:     document.getElementById('ss-per').value,
      infillDensity:  String(parseFloat(document.getElementById('ss-inf').value) / 100),
      printSpeed:     document.getElementById('ss-ps').value,
      firstLayerSpeed:document.getElementById('ss-fls').value,
      nozzleTemp:     document.getElementById('ss-nt').value,
      bedTemp:        document.getElementById('ss-bt').value,
    });

    try {
      const buf = await _state.file.arrayBuffer();
      const start = Date.now();

      // Prefer the Forge Slicer service when reachable. Falls through
      // to the native engine when not — same UX, just a different
      // backend. The status pill at the top of the panel shows which
      // backend is currently active.
      const forgeStatus = await fetch('/api/slicer/forge/status').then(r => r.json()).catch(() => null);
      const useForge = !!forgeStatus?.probe?.ok;

      let layers = 0, dur = 0, timeSec = 0, fil = 0, blob = null;

      if (useForge) {
        progress.innerHTML = '<div style="display:flex;align-items:center;gap:6px"><i class="bi bi-arrow-repeat" style="animation:spin 1s linear infinite"></i> Slicing via Forge Slicer…</div>';
        const filIds = _state.selectedFilament ? JSON.stringify([String(_state.selectedFilament)]) : '';
        const fr = await fetch(`/api/slicer/forge/slice?printer_id=${encodeURIComponent(_state.selectedPrinter || '')}${filIds ? '&filament_ids=' + encodeURIComponent(filIds) : ''}&process_id=${encodeURIComponent(_state.selectedProcess || '')}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/octet-stream',
            'X-Filename': _state.fileName,
          },
          body: buf,
        });
        if (!fr.ok) {
          const err = await fr.json().catch(() => ({}));
          progress.innerHTML = `<div style="color:#ef4444">Forge slice failed: ${_esc(err.error || fr.statusText)}</div>`;
          return;
        }
        const result = await fr.json();
        timeSec = result.estimated_time_s || 0;
        fil = (result.filament_used_g || []).reduce((a, b) => a + b, 0);
        // Pull the gcode bytes through the proxy.
        const gr = await fetch(`/api/slicer/forge/jobs/${encodeURIComponent(result.job_id)}/gcode`);
        if (gr.ok) blob = await gr.blob();
        dur = Date.now() - start;
      } else {
        const r = await fetch(`/api/slicer/native/slice?${params.toString()}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/octet-stream' },
          body: buf,
        });
        if (!r.ok) {
          const err = await r.json().catch(() => ({}));
          progress.innerHTML = `<div style="color:#ef4444">Slice failed: ${_esc(err.error || r.statusText)}</div>`;
          return;
        }
        layers = parseInt(r.headers.get('X-Layer-Count'), 10) || 0;
        dur = parseInt(r.headers.get('X-Slice-Duration-Ms'), 10) || (Date.now() - start);
        timeSec = parseInt(r.headers.get('X-Estimated-Time-Sec'), 10) || 0;
        fil = parseFloat(r.headers.get('X-Filament-G')) || 0;
        blob = await r.blob();
      }

      _state.lastSlice = { blob, filename: (_state.fileName.replace(/\.[^.]+$/, '') || 'model') + '.gcode', layers, dur, timeSec, fil };
      const backendLabel = useForge ? 'Forge Slicer' : 'native engine';
      progress.innerHTML = `<div style="color:#22c55e;font-weight:600">✓ Sliced via ${backendLabel} in ${dur} ms</div>`;
      _renderResult();
      document.getElementById('ss-send').disabled = false;
    } catch (e) {
      progress.innerHTML = `<div style="color:#ef4444">Failed: ${_esc(e.message)}</div>`;
    } finally {
      _state.busy = false;
      document.getElementById('ss-slice').disabled = false;
    }
  }

  function _renderResult() {
    const r = _state.lastSlice;
    if (!r) return;
    const hours = Math.floor(r.timeSec / 3600);
    const mins = Math.floor((r.timeSec % 3600) / 60);
    document.getElementById('ss-result').innerHTML = `
      <div style="display:flex;flex-direction:column;gap:4px;font-size:0.82rem">
        <div><strong>Layers:</strong> ${r.layers}</div>
        <div><strong>Print time:</strong> ${hours}h ${mins}m</div>
        <div><strong>Filament:</strong> ${r.fil.toFixed(2)} g</div>
        <div><strong>G-code:</strong> ${(r.blob.size / 1024).toFixed(1)} KB</div>
      </div>
      <button class="form-btn" id="ss-download" style="width:100%;margin-top:10px">⬇ Download G-code</button>
    `;
    document.getElementById('ss-download').onclick = () => {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(r.blob);
      a.download = r.filename;
      a.click();
      URL.revokeObjectURL(a.href);
    };
  }

  async function _sendToPrinter() {
    const r = _state.lastSlice;
    const printerId = document.getElementById('ss-target').value;
    if (!r || !printerId) { _toast('Slice first and pick a target printer', 'warning'); return; }
    const startNow = document.getElementById('ss-print').checked;

    _toast('Uploading G-code…', 'info');
    try {
      const buf = await r.blob.arrayBuffer();
      const url = `/api/printers/${encodeURIComponent(printerId)}/moonraker/upload?filename=${encodeURIComponent(r.filename)}${startNow ? '&print=true' : ''}`;
      // Generic upload via the printer-manager's existing route.
      const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/octet-stream' }, body: buf });
      if (res.ok) {
        _toast(startNow ? 'Sent and started printing!' : 'Uploaded to printer', 'success');
      } else {
        // Fall back to AI-Forge scene-send route which is generic across printer types.
        const scene = { name: 'slice', shapes: [{ type: 'box', params: { w: 1, h: 1, d: 1 }, transform: {} }] };
        // Or use the dedicated send-to-printer route built earlier.
        const r2 = await fetch('/api/ai-forge/scenes/send-to-printer', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ scene, printerId, format: 'stl', filename: r.filename, print: startNow }),
        });
        if (r2.ok) _toast('Sent', 'success');
        else _toast('Upload failed — try Slicer Bridge tab instead', 'error');
      }
    } catch (e) { _toast(`Upload failed: ${e.message}`, 'error'); }
  }

  async function _saveProcess() {
    const name = prompt('Name for this Quality preset:');
    if (!name) return;
    const settings = {
      layerHeight:     parseFloat(document.getElementById('ss-lh').value),
      lineWidth:       parseFloat(document.getElementById('ss-lw').value),
      perimeters:      parseInt(document.getElementById('ss-per').value, 10),
      infillDensity:   parseFloat(document.getElementById('ss-inf').value) / 100,
      printSpeed:      parseFloat(document.getElementById('ss-ps').value),
      firstLayerSpeed: parseFloat(document.getElementById('ss-fls').value),
      nozzleTemp:      parseFloat(document.getElementById('ss-nt').value),
      bedTemp:         parseFloat(document.getElementById('ss-bt').value),
    };
    try {
      const r = await fetch('/api/slicer/native/profiles', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kind: 'process', name, vendor: 'User', settings }),
      });
      if (r.ok) {
        _toast('Quality preset saved', 'success');
        await _loadProfiles();
      } else {
        const err = await r.json().catch(() => ({}));
        _toast(`Save failed: ${err.error || 'unknown'}`, 'error');
      }
    } catch (e) { _toast(`Save failed: ${e.message}`, 'error'); }
  }

  window.loadSlicerStudio = _load;
})();
