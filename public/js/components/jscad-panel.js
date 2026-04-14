// JSCAD Studio — scripted parametric 3D modeling panel with code editor and preview
(function() {
  'use strict';

  const _esc = (s) => { const d = document.createElement('div'); d.textContent = s || ''; return d.innerHTML; };
  let _examples = [];
  let _currentCode = '';
  let _currentParams = {};
  let _paramDefs = [];
  let _lastStlBlob = null;

  async function _loadExamples() {
    try {
      const res = await fetch('/api/jscad/examples');
      if (res.ok) _examples = await res.json();
    } catch {}
  }

  async function _extractParams() {
    try {
      const res = await fetch('/api/jscad/params', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: _currentCode }),
      });
      const data = await res.json();
      _paramDefs = Array.isArray(data?.parameters) ? data.parameters : [];
      // Set defaults
      _currentParams = {};
      for (const p of _paramDefs) {
        _currentParams[p.name] = p.initial;
      }
      _renderParams();
    } catch (e) {
      console.warn('Param extraction failed:', e);
    }
  }

  async function _render3D() {
    const statusEl = document.getElementById('jscad-status');
    const previewEl = document.getElementById('jscad-preview');
    if (statusEl) statusEl.innerHTML = '<i class="bi bi-arrow-repeat spin"></i> Rendering...';

    try {
      const res = await fetch('/api/jscad/render', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: _currentCode, params: _currentParams }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `HTTP ${res.status}`);
      }
      const triangles = res.headers.get('X-Triangle-Count') || '?';
      const blob = await res.blob();
      _lastStlBlob = blob;

      // Render via Three.js STL loader if available
      if (previewEl) {
        _renderSTLPreview(previewEl, blob);
      }

      if (statusEl) statusEl.innerHTML = `<i class="bi bi-check-circle text-success"></i> ${triangles} triangles · ${(blob.size / 1024).toFixed(1)} KB`;
    } catch (e) {
      if (statusEl) statusEl.innerHTML = `<i class="bi bi-x-circle text-danger"></i> ${_esc(e.message)}`;
      if (previewEl) previewEl.innerHTML = `<div class="alert alert-danger m-3">${_esc(e.message)}</div>`;
    }
  }

  function _renderSTLPreview(container, stlBlob) {
    // Check if Three.js STL loader exists (from 3MF viewer), otherwise show info
    if (!window.THREE || !window.THREE.STLLoader) {
      container.innerHTML = `
        <div class="p-3 text-center">
          <i class="bi bi-box" style="font-size:4rem;color:var(--bs-primary)"></i>
          <div class="mt-2 small text-muted">STL generated successfully</div>
          <button class="btn btn-sm btn-primary mt-2" onclick="window._jscadDownload()">
            <i class="bi bi-download"></i> Download STL
          </button>
        </div>`;
      return;
    }
    // Three.js available — render
    container.innerHTML = '<canvas id="jscad-canvas" style="width:100%;height:400px"></canvas>';
    // Simple STL rendering would go here; placeholder for now
  }

  function _downloadStl() {
    if (!_lastStlBlob) return;
    const url = URL.createObjectURL(_lastStlBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'jscad-model.stl';
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function _renderParams() {
    const container = document.getElementById('jscad-params');
    if (!container) return;
    if (_paramDefs.length === 0) {
      container.innerHTML = '<div class="text-muted small">No parameters defined. Add a <code>getParameterDefinitions()</code> function to expose parameters.</div>';
      return;
    }
    container.innerHTML = `
      <h6 class="mb-2">Parameters</h6>
      ${_paramDefs.map(p => {
        const val = _currentParams[p.name];
        if (p.type === 'int' || p.type === 'float') {
          return `
            <div class="mb-2">
              <label class="form-label small mb-1">${_esc(p.caption || p.name)}</label>
              <input type="number" class="form-control form-control-sm" data-param="${_esc(p.name)}" value="${val}" step="${p.type === 'int' ? '1' : '0.1'}">
            </div>`;
        }
        if (p.type === 'checkbox') {
          return `
            <div class="form-check mb-2">
              <input type="checkbox" class="form-check-input" data-param="${_esc(p.name)}" ${val ? 'checked' : ''}>
              <label class="form-check-label small">${_esc(p.caption || p.name)}</label>
            </div>`;
        }
        return `
          <div class="mb-2">
            <label class="form-label small mb-1">${_esc(p.caption || p.name)}</label>
            <input type="text" class="form-control form-control-sm" data-param="${_esc(p.name)}" value="${_esc(val || '')}">
          </div>`;
      }).join('')}
      <button class="btn btn-sm btn-primary w-100 mt-2" id="jscad-render-btn">
        <i class="bi bi-play-circle"></i> Render
      </button>`;

    // Wire up input changes
    container.querySelectorAll('[data-param]').forEach(el => {
      el.addEventListener('input', () => {
        const name = el.dataset.param;
        const def = _paramDefs.find(p => p.name === name);
        if (!def) return;
        if (def.type === 'int') _currentParams[name] = parseInt(el.value, 10);
        else if (def.type === 'float') _currentParams[name] = parseFloat(el.value);
        else if (def.type === 'checkbox') _currentParams[name] = el.checked;
        else _currentParams[name] = el.value;
      });
    });
    document.getElementById('jscad-render-btn')?.addEventListener('click', _render3D);
  }

  function _loadExample(id) {
    const example = _examples.find(e => e.id === id);
    if (!example) return;
    _currentCode = example.code;
    const editor = document.getElementById('jscad-editor');
    if (editor) editor.value = example.code;
    _extractParams().then(() => _render3D());
  }

  function _render() {
    const container = document.getElementById('jscad-panel');
    if (!container) return;
    container.innerHTML = `
      <div class="card">
        <div class="card-header">
          <h3 class="card-title"><i class="bi bi-code-slash"></i> JSCAD Studio</h3>
          <div class="card-tools">
            <select class="form-select form-select-sm d-inline-block" id="jscad-example-select" style="width:auto">
              <option value="">Load example...</option>
              ${_examples.map(e => `<option value="${_esc(e.id)}">${_esc(e.name)}</option>`).join('')}
            </select>
            <button class="btn btn-sm btn-success ms-2" onclick="window._jscadDownload()">
              <i class="bi bi-download"></i> STL
            </button>
          </div>
        </div>
        <div class="card-body">
          <div class="alert alert-info py-2 small mb-3">
            <i class="bi bi-info-circle"></i> Write JavaScript code using <code>@jscad/modeling</code> primitives.
            Your code must define a <code>main(params)</code> function that returns geometry.
            Optionally define <code>getParameterDefinitions()</code> to expose parameters.
          </div>
          <div class="row g-3">
            <!-- Left: Code editor + params -->
            <div class="col-md-6">
              <label class="form-label small">Code</label>
              <textarea id="jscad-editor" class="form-control font-monospace" rows="18" style="font-size:0.85rem"
                placeholder="function main(params) {
  const { cube } = primitives;
  return cube({ size: 20 });
}"></textarea>
              <div class="mt-3" id="jscad-params"></div>
            </div>
            <!-- Right: Preview -->
            <div class="col-md-6">
              <label class="form-label small">Preview</label>
              <div id="jscad-preview" style="height:400px;background:var(--bs-tertiary-bg);border-radius:6px;display:flex;align-items:center;justify-content:center">
                <div class="text-muted small">No model rendered yet</div>
              </div>
              <div id="jscad-status" class="mt-2 small"></div>
              <div class="mt-2">
                <strong class="small">Available primitives:</strong>
                <div class="small text-muted">cube, cuboid, sphere, cylinder, cone, polygon, polyhedron, rectangle, circle, star, ellipse</div>
                <strong class="small mt-2 d-block">Booleans:</strong>
                <div class="small text-muted">union, subtract, intersect</div>
                <strong class="small mt-2 d-block">Transforms:</strong>
                <div class="small text-muted">translate, rotate, scale, mirror, align, center</div>
                <strong class="small mt-2 d-block">Extrusions:</strong>
                <div class="small text-muted">extrudeLinear, extrudeRotate, extrudeFromSlices</div>
              </div>
            </div>
          </div>
        </div>
      </div>`;

    // Wire up editor
    const editor = document.getElementById('jscad-editor');
    if (editor) {
      editor.value = _currentCode || _examples[0]?.code || '';
      _currentCode = editor.value;
      editor.addEventListener('input', _debounce(() => {
        _currentCode = editor.value;
        _extractParams();
      }, 500));
    }

    // Wire up example selector
    document.getElementById('jscad-example-select')?.addEventListener('change', (e) => {
      if (e.target.value) _loadExample(e.target.value);
    });

    // Initial param extraction + render
    if (_currentCode) {
      _extractParams().then(() => _render3D());
    }
  }

  function _debounce(fn, ms) {
    let t = null;
    return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); };
  }

  window._jscadDownload = _downloadStl;
  window.loadJscadPanel = async () => {
    await _loadExamples();
    if (!_currentCode && _examples.length > 0) _currentCode = _examples[0].code;
    _render();
  };
})();
