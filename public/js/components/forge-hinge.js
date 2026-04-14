// Model Forge — Print-in-Place Hinge Generator
(function() {
  'use strict';

  window.loadForgeHinge = function() {
    const el = document.getElementById('overlay-panel-body');
    if (!el) return;

    el.innerHTML = `<style>
      .hng-layout { display:grid; grid-template-columns:360px 1fr; gap:12px; min-height:500px; }
      .hng-sidebar { overflow-y:auto; max-height:calc(100vh - 180px); padding-right:4px; }
      .hng-form { background:var(--bg-secondary); border:1px solid var(--border-color); border-radius:10px; padding:12px; }
      .hng-preview { display:flex; flex-direction:column; align-items:center; justify-content:center; gap:10px; background:var(--bg-secondary); border:1px solid var(--border-color); border-radius:10px; padding:16px; min-height:400px; }
      @media (max-width:900px) { .hng-layout { grid-template-columns:1fr; } }
    </style>
    <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px">
      <button class="form-btn form-btn-sm" onclick="window.loadModelForgePanel()" style="padding:4px 10px">← Back</button>
      <h4 style="margin:0;font-size:1rem">🪝 Print-in-place Hinge</h4>
    </div>
    <div class="hng-layout">
      <div class="hng-sidebar"><div class="hng-form" id="hng-form">
        <h5 style="margin:0 0 10px;font-size:0.88rem">Leaf plate</h5>
        ${_rf('Plate length (mm)', 'hng-l', 10, 200, 40, 1)}
        ${_rf('Plate width (mm)', 'hng-w', 6, 100, 20, 1)}
        ${_rf('Plate thickness (mm)', 'hng-t', 1, 10, 3, 0.2)}

        <h5 style="margin:14px 0 10px;font-size:0.88rem">Knuckles & pin</h5>
        ${_rf('Knuckle count', 'hng-k', 3, 15, 5, 1)}
        ${_rf('Knuckle radius (mm)', 'hng-kr', 1.5, 10, 3, 0.2)}
        ${_rf('Pin radius (mm)', 'hng-pr', 0.5, 5, 1, 0.1)}
        ${_rf('Clearance (mm)', 'hng-cl', 0.2, 1, 0.35, 0.05)}
      </div></div>
      <div class="hng-preview" id="hng-result">
        <div style="color:var(--text-muted);font-size:0.85rem">Configure your hinge and generate</div>
      </div>
    </div>`;

    const form = document.getElementById('hng-form');
    if (form) {
      form.addEventListener('input', () => { clearTimeout(window._hngDebounce); window._hngDebounce = setTimeout(_updatePreview, 300); });
    }
    setTimeout(_updatePreview, 100);
  };

  function _updatePreview() {
    const result = document.getElementById('hng-result');
    if (!result) return;
    const p = _params();
    const scale = Math.min(4, 280 / Math.max(p.plateLength, p.plateWidth * 2));
    const pl = p.plateLength * scale;
    const pw = p.plateWidth * scale;
    const kr = p.knuckleRadius * scale;
    const knuckleLen = (pl - p.clearance * scale * (p.knuckleCount - 1)) / p.knuckleCount;
    let knuckles = '';
    for (let i = 0; i < p.knuckleCount; i++) {
      const x = i * (knuckleLen + p.clearance * scale);
      knuckles += `<rect x="${x}" y="${-kr}" width="${knuckleLen}" height="${kr*2}" fill="#8090a8" stroke="#3a4d68" stroke-width="0.5"/>`;
    }
    result.innerHTML = `
      <div style="display:flex;gap:6px;flex-wrap:wrap;justify-content:center">
        <button class="form-btn form-btn-sm" data-ripple onclick="window._hngPreview3D()" style="background:var(--accent-cyan);color:#fff">🧊 3D Preview</button>
        <button class="form-btn form-btn-sm" data-ripple onclick="window._hngDownload()" style="background:var(--accent-green);color:#fff">📥 Download 3MF</button>
      </div>
      <div style="font-size:0.7rem;color:var(--text-muted);margin:4px 0">${p.plateLength}×${p.plateWidth}mm · ${p.knuckleCount} knuckles · pin ⌀${p.pinRadius*2}mm</div>
      <svg width="${pl+20}" height="${pw*2+kr*2+20}" viewBox="-10 ${-kr-10} ${pl+20} ${pw*2+kr*2+20}">
        <rect x="0" y="${-pw-kr}" width="${pl}" height="${pw}" fill="#9cacc4" stroke="#3a4d68" stroke-width="0.8"/>
        <rect x="0" y="${kr}" width="${pl}" height="${pw}" fill="#9cacc4" stroke="#3a4d68" stroke-width="0.8"/>
        ${knuckles}
      </svg>`;
  }

  function _params() {
    const v = id => parseFloat(document.getElementById(id)?.value) || 0;
    return {
      plateLength: Math.max(10, Math.min(200, v('hng-l') || 40)),
      plateWidth: Math.max(6, Math.min(100, v('hng-w') || 20)),
      plateThickness: Math.max(1, Math.min(10, v('hng-t') || 3)),
      knuckleCount: Math.max(3, Math.min(15, v('hng-k') || 5)),
      knuckleRadius: Math.max(1.5, Math.min(10, v('hng-kr') || 3)),
      pinRadius: Math.max(0.5, Math.min(5, v('hng-pr') || 1)),
      clearance: Math.max(0.2, Math.min(1, v('hng-cl') || 0.35)),
    };
  }

  async function _generate() {
    const res = await fetch('/api/model-forge/hinge/generate-3mf', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(_params())
    });
    if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || 'Failed');
    return res.blob();
  }

  window._hngDownload = async function() {
    try {
      if (typeof showToast === 'function') showToast('Generating hinge...', 'info');
      const blob = await _generate();
      const p = _params();
      const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
      a.download = `hinge_${p.plateLength}x${p.plateWidth}.3mf`;
      a.click(); URL.revokeObjectURL(a.href);
      if (typeof showToast === 'function') showToast('3MF downloaded!', 'success');
    } catch (e) { if (typeof showToast === 'function') showToast(e.message, 'error'); }
  };

  window._hngPreview3D = async function() {
    const result = document.getElementById('hng-result');
    if (result) result.innerHTML = '<div style="padding:20px;color:var(--text-muted)">Generating 3D...</div>';
    try {
      const blob = await _generate();
      const file = new File([blob], 'hinge.3mf', { type: 'application/octet-stream' });
      if (typeof window._g3dHandleFile === 'function') window._g3dHandleFile(file);
      else if (typeof window.open3mfViewer === 'function') window.open3mfViewer(URL.createObjectURL(blob), 'Hinge');
      const obs = new MutationObserver(() => { if (!document.getElementById('_global-3d-overlay')) { obs.disconnect(); _updatePreview(); } });
      obs.observe(document.body, { childList: true, subtree: true });
    } catch (e) { if (result) result.innerHTML = '<div style="padding:20px;color:var(--accent-red)">' + e.message + '</div>'; }
  };

  function _rf(label, id, min, max, val, step) {
    return `<div style="margin-bottom:5px"><div style="display:flex;align-items:center;justify-content:space-between"><label style="font-size:0.7rem;color:var(--text-muted)">${label}</label><input type="number" class="form-input" id="${id}" value="${val}" min="${min}" max="${max}" step="${step}" style="width:50px;font-size:0.75rem;padding:2px 4px;text-align:center;border-radius:4px" oninput="const s=this.parentElement.nextElementSibling;if(s)s.value=this.value"></div><input type="range" min="${min}" max="${max}" value="${val}" step="${step}" style="width:100%;accent-color:var(--accent-blue);margin-top:2px" oninput="const n=this.previousElementSibling.querySelector('input[type=number]');if(n)n.value=this.value"></div>`;
  }
})();
