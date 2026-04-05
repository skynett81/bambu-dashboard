// Model Forge — 3MF Converter (Bambu Lab → Snapmaker U1)
(function() {
  'use strict';

  let _fileData = null;

  window.loadForge3mfConverter = function() {
    const el = document.getElementById('overlay-panel-body');
    if (!el) return;

    el.innerHTML = `<style>
      .conv-layout { display:grid; grid-template-columns:360px 1fr; gap:12px; min-height:400px; }
      .conv-sidebar { overflow-y:auto; max-height:calc(100vh - 180px); }
      .conv-form { background:var(--bg-secondary); border:1px solid var(--border-color); border-radius:10px; padding:12px; }
      .conv-preview { display:flex; flex-direction:column; align-items:center; justify-content:center; gap:10px; background:var(--bg-secondary); border:1px solid var(--border-color); border-radius:10px; padding:16px; min-height:300px; }
      .conv-drop { border:2px dashed var(--border-color); border-radius:10px; padding:30px; text-align:center; cursor:pointer; transition:border-color 0.2s; }
      .conv-drop:hover,.conv-drop.dragover { border-color:var(--accent-blue); }
      @media (max-width:900px) { .conv-layout { grid-template-columns:1fr; } }
    </style>
    <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px">
      <button class="form-btn form-btn-sm" onclick="window.loadModelForgePanel()" style="padding:4px 10px">← Back</button>
      <h4 style="margin:0;font-size:1rem">🔄 3MF Converter</h4>
    </div>
    <div class="conv-layout">
      <div class="conv-sidebar"><div class="conv-form">
        <div class="conv-drop" id="conv-drop" onclick="document.getElementById('conv-file').click()">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" stroke-width="1.5" style="margin-bottom:8px"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
          <div style="font-size:0.85rem;color:var(--text-muted)">Drop Bambu Lab .3mf file here</div>
          <div style="font-size:0.72rem;color:var(--text-muted);margin-top:4px">Converts to Snapmaker U1 format</div>
          <input type="file" id="conv-file" accept=".3mf" style="display:none" onchange="window._convFile(this)">
        </div>

        <div style="margin-top:14px;border-top:1px solid var(--border-color);padding-top:12px">
          <h5 style="margin:0 0 8px;font-size:0.88rem">Options</h5>
          <label style="font-size:0.8rem;cursor:pointer;display:flex;align-items:center;gap:6px;margin:6px 0">
            <input type="checkbox" id="conv-center" checked> Auto-center for U1 bed (271×335mm)
          </label>
          <label style="font-size:0.8rem;cursor:pointer;display:flex;align-items:center;gap:6px;margin:6px 0">
            <input type="checkbox" id="conv-drop-bed" checked> Drop to bed (fix Z offset)
          </label>
        </div>

        <div style="margin-top:12px">
          <h5 style="margin:0 0 6px;font-size:0.88rem">Filament Mapping</h5>
          <p style="font-size:0.72rem;color:var(--text-muted);margin:0 0 6px">Bambu filaments are auto-mapped to Snapmaker equivalents</p>
          <div style="font-size:0.7rem;background:var(--bg-tertiary);border-radius:6px;padding:8px;max-height:150px;overflow-y:auto" id="conv-filament-map">
            <div>Bambu PLA Basic → Snapmaker PLA Basic @U1</div>
            <div>Bambu PETG Basic → Snapmaker PETG @U1</div>
            <div>Bambu ABS → Snapmaker ABS @U1</div>
            <div>Bambu TPU 95A → Snapmaker TPU 95A @U1</div>
            <div>Bambu PLA-CF → Snapmaker PLA-CF @U1</div>
            <div>Bambu Support W → Snapmaker PVA @U1</div>
          </div>
        </div>
      </div></div>
      <div class="conv-preview" id="conv-result">
        <div style="color:var(--text-muted);font-size:0.85rem">Upload a Bambu Lab .3mf to convert</div>
      </div>
    </div>`;

    const dz = document.getElementById('conv-drop');
    dz.addEventListener('dragover', e => { e.preventDefault(); dz.classList.add('dragover'); });
    dz.addEventListener('dragleave', () => dz.classList.remove('dragover'));
    dz.addEventListener('drop', e => { e.preventDefault(); dz.classList.remove('dragover'); if (e.dataTransfer.files.length) _handleFile(e.dataTransfer.files[0]); });
  };

  function _handleFile(file) {
    if (!file || !file.name.endsWith('.3mf')) {
      if (typeof showToast === 'function') showToast('Please select a .3mf file', 'error');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      _fileData = { buffer: reader.result, name: file.name, size: file.size };
      _analyze();
    };
    reader.readAsArrayBuffer(file);
  }

  window._convFile = function(input) { if (input.files.length) _handleFile(input.files[0]); };

  async function _analyze() {
    const r = document.getElementById('conv-result');
    if (!r || !_fileData) return;
    r.innerHTML = '<div style="padding:20px;color:var(--text-muted)">Analyzing file...</div>';

    try {
      const res = await fetch('/api/model-forge/3mf-converter/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/octet-stream' },
        body: _fileData.buffer,
      });
      const data = await res.json();

      r.innerHTML = `
        <div style="background:var(--bg-tertiary);border-radius:8px;padding:12px;width:100%;max-width:400px">
          <div style="font-size:0.9rem;font-weight:600;margin-bottom:8px">${_fileData.name}</div>
          <div style="font-size:0.78rem;color:var(--text-muted)">Size: ${((_fileData.size)/1024).toFixed(0)} KB</div>
          <div style="font-size:0.78rem;color:var(--text-muted)">Type: ${data.isBambu ? '<span style="color:var(--accent-green)">Bambu Lab ✓</span>' : data.isSnapmaker ? '<span style="color:var(--accent-blue)">Already Snapmaker</span>' : '<span style="color:var(--accent-orange)">Unknown format</span>'}</div>
          ${data.filaments?.length ? '<div style="font-size:0.78rem;color:var(--text-muted)">Filaments: ' + data.filaments.join(', ') + '</div>' : ''}
          ${data.modelCount ? '<div style="font-size:0.78rem;color:var(--text-muted)">Models: ' + data.modelCount + '</div>' : ''}
        </div>
        <div style="display:flex;gap:6px;margin-top:10px">
          ${data.isBambu ? '<button class="form-btn form-btn-sm" data-ripple onclick="window._convConvert()" style="background:var(--accent-green);color:#fff;padding:6px 20px">🔄 Convert to U1</button>' : ''}
          <button class="form-btn form-btn-sm" data-ripple onclick="window._convPreview3D()" style="background:var(--accent-cyan);color:#fff">🧊 3D Preview</button>
        </div>
        ${data.isSnapmaker ? '<div style="font-size:0.75rem;color:var(--accent-blue);margin-top:8px">This file is already in Snapmaker format — no conversion needed.</div>' : ''}
        ${!data.isBambu && !data.isSnapmaker ? '<div style="font-size:0.75rem;color:var(--accent-orange);margin-top:8px">This file may not be a Bambu Lab project. Convert anyway?<br><button class="form-btn form-btn-sm" style="margin-top:4px" onclick="window._convConvert()">Convert Anyway</button></div>' : ''}`;
    } catch (e) {
      r.innerHTML = '<div style="color:var(--accent-red)">' + e.message + '</div>';
    }
  }

  window._convConvert = async function() {
    if (!_fileData) return;
    const r = document.getElementById('conv-result');
    if (r) r.innerHTML = '<div style="padding:20px;color:var(--text-muted)">Converting...</div>';

    try {
      if (typeof showToast === 'function') showToast('Converting to Snapmaker U1 format...', 'info');
      const res = await fetch('/api/model-forge/3mf-converter/convert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/octet-stream' },
        body: _fileData.buffer,
      });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || 'Conversion failed');
      const blob = await res.blob();
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = _fileData.name.replace('.3mf', '_U1.3mf');
      a.click();
      URL.revokeObjectURL(a.href);
      if (typeof showToast === 'function') showToast('Converted! Open in Snapmaker Orca for slicing.', 'success');
      _analyze(); // refresh
    } catch (e) {
      if (typeof showToast === 'function') showToast(e.message, 'error');
      if (r) r.innerHTML = '<div style="color:var(--accent-red)">' + e.message + '</div>';
    }
  };

  window._convPreview3D = function() {
    if (!_fileData) return;
    const file = new File([_fileData.buffer], _fileData.name, { type: 'application/octet-stream' });
    if (typeof window._g3dHandleFile === 'function') window._g3dHandleFile(file);
    else if (typeof window.open3mfViewer === 'function') window.open3mfViewer(URL.createObjectURL(new Blob([_fileData.buffer])), _fileData.name);
  };
})();
