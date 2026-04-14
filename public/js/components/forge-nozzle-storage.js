// Model Forge — Nozzle Storage Block
(function() {
  'use strict';

  window.loadForgeNozzleStorage = function() {
    const el = document.getElementById('overlay-panel-body');
    if (!el) return;

    el.innerHTML = `<style>
      .ns-layout { display:grid; grid-template-columns:360px 1fr; gap:12px; min-height:500px; }
      .ns-form { background:var(--bg-secondary); border:1px solid var(--border-color); border-radius:10px; padding:12px; }
      .ns-preview { display:flex; flex-direction:column; align-items:center; justify-content:center; gap:10px; background:var(--bg-secondary); border:1px solid var(--border-color); border-radius:10px; padding:16px; min-height:400px; }
      @media (max-width:900px) { .ns-layout { grid-template-columns:1fr; } }
    </style>
    <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px">
      <button class="form-btn form-btn-sm" onclick="window.loadModelForgePanel()" style="padding:4px 10px">← Back</button>
      <h4 style="margin:0;font-size:1rem">🔩 Nozzle Storage Block</h4>
    </div>
    <div class="ns-layout">
      <div><div class="ns-form" id="ns-form">
        ${_rf('Slot count', 'ns-s', 2, 24, 8, 1)}
        ${_rf('Slot ⌀ (mm)', 'ns-sd', 3, 15, 6.3, 0.1)}
        ${_rf('Spacing (mm)', 'ns-sp', 2, 15, 4, 0.5)}
        ${_rf('Slot depth (mm)', 'ns-dp', 4, 30, 8, 0.5)}
        ${_rf('Floor thickness (mm)', 'ns-ft', 1, 10, 2, 0.5)}

        <label style="font-size:0.8rem;cursor:pointer;display:flex;align-items:center;gap:6px;margin:8px 0">
          <input type="checkbox" id="ns-lg" checked> Label grooves
        </label>

        <div style="margin-top:12px;padding:8px;background:var(--bg-tertiary);border-radius:6px;font-size:0.7rem;color:var(--text-muted);line-height:1.4">
          Default 6.3mm fits M6×1 nozzles with a comfortable clearance.
        </div>
      </div></div>
      <div class="ns-preview" id="ns-result">
        <div style="color:var(--text-muted);font-size:0.85rem">Configure and generate</div>
      </div>
    </div>`;

    const form = document.getElementById('ns-form');
    if (form) {
      form.addEventListener('input', () => { clearTimeout(window._nsDeb); window._nsDeb = setTimeout(_updatePreview, 300); });
      form.addEventListener('change', _updatePreview);
    }
    setTimeout(_updatePreview, 100);
  };

  function _updatePreview() {
    const r = document.getElementById('ns-result');
    if (!r) return;
    const p = _params();
    const totalW = p.slots * (p.slotDiameter + p.slotSpacing) + 8 - p.slotSpacing;
    const totalD = p.slotDiameter + 8 + (p.labelGrooves ? 6 : 0);
    const scale = Math.min(5, 260 / totalW);
    const pw = totalW * scale, pd = totalD * scale;
    let holes = '';
    for (let i = 0; i < p.slots; i++) {
      const cx = (4 + p.slotDiameter/2 + i * (p.slotDiameter + p.slotSpacing)) * scale;
      const cy = (4 + p.slotDiameter/2) * scale;
      const hr = (p.slotDiameter / 2) * scale;
      holes += `<circle cx="${cx}" cy="${cy}" r="${hr}" fill="#2a3a4a"/>`;
    }
    r.innerHTML = `
      <div style="display:flex;gap:6px;flex-wrap:wrap;justify-content:center">
        <button class="form-btn form-btn-sm" data-ripple onclick="window._nsPreview3D()" style="background:var(--accent-cyan);color:#fff">🧊 3D Preview</button>
        <button class="form-btn form-btn-sm" data-ripple onclick="window._nsDownload()" style="background:var(--accent-green);color:#fff">📥 Download 3MF</button>
      </div>
      <div style="font-size:0.7rem;color:var(--text-muted);margin:4px 0">${p.slots} slots · ⌀${p.slotDiameter}mm · depth ${p.slotDepth}mm</div>
      <svg width="${pw+20}" height="${pd+20}" viewBox="-10 -10 ${pw+20} ${pd+20}">
        <rect x="0" y="0" width="${pw}" height="${pd}" fill="#5a6a85" stroke="#2a3a4a" stroke-width="1" rx="3"/>
        ${holes}
      </svg>`;
  }

  function _params() {
    const v = id => parseFloat(document.getElementById(id)?.value) || 0;
    const c = id => !!document.getElementById(id)?.checked;
    return {
      slots: Math.max(2, Math.min(24, v('ns-s') || 8)),
      slotDiameter: Math.max(3, Math.min(15, v('ns-sd') || 6.3)),
      slotSpacing: Math.max(2, Math.min(15, v('ns-sp') || 4)),
      slotDepth: Math.max(4, Math.min(30, v('ns-dp') || 8)),
      floorThickness: Math.max(1, Math.min(10, v('ns-ft') || 2)),
      labelGrooves: c('ns-lg'),
    };
  }

  async function _generate() {
    const res = await fetch('/api/model-forge/nozzle-storage/generate-3mf', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(_params())
    });
    if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || 'Failed');
    return res.blob();
  }

  window._nsDownload = async function() {
    try {
      if (typeof showToast === 'function') showToast('Generating block...', 'info');
      const blob = await _generate();
      const p = _params();
      const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
      a.download = `nozzle_storage_${p.slots}x.3mf`;
      a.click(); URL.revokeObjectURL(a.href);
      if (typeof showToast === 'function') showToast('3MF downloaded!', 'success');
    } catch (e) { if (typeof showToast === 'function') showToast(e.message, 'error'); }
  };

  window._nsPreview3D = async function() {
    const r = document.getElementById('ns-result');
    if (r) r.innerHTML = '<div style="padding:20px;color:var(--text-muted)">Generating 3D...</div>';
    try {
      const blob = await _generate();
      const file = new File([blob], 'nozzle_storage.3mf', { type: 'application/octet-stream' });
      if (typeof window._g3dHandleFile === 'function') window._g3dHandleFile(file);
      else if (typeof window.open3mfViewer === 'function') window.open3mfViewer(URL.createObjectURL(blob), 'Nozzle Storage');
      const obs = new MutationObserver(() => { if (!document.getElementById('_global-3d-overlay')) { obs.disconnect(); _updatePreview(); } });
      obs.observe(document.body, { childList: true, subtree: true });
    } catch (e) { if (r) r.innerHTML = '<div style="padding:20px;color:var(--accent-red)">' + e.message + '</div>'; }
  };

  function _rf(label, id, min, max, val, step) {
    return `<div style="margin-bottom:5px"><div style="display:flex;align-items:center;justify-content:space-between"><label style="font-size:0.7rem;color:var(--text-muted)">${label}</label><input type="number" class="form-input" id="${id}" value="${val}" min="${min}" max="${max}" step="${step}" style="width:50px;font-size:0.75rem;padding:2px 4px;text-align:center;border-radius:4px" oninput="const s=this.parentElement.nextElementSibling;if(s)s.value=this.value"></div><input type="range" min="${min}" max="${max}" value="${val}" step="${step}" style="width:100%;accent-color:var(--accent-blue);margin-top:2px" oninput="const n=this.previousElementSibling.querySelector('input[type=number]');if(n)n.value=this.value"></div>`;
  }
})();
