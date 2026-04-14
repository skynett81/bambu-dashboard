// Model Forge — First Layer Test Pattern
(function() {
  'use strict';

  window.loadForgeFirstLayer = function() {
    const el = document.getElementById('overlay-panel-body');
    if (!el) return;

    el.innerHTML = `<style>
      .fl-layout { display:grid; grid-template-columns:360px 1fr; gap:12px; min-height:500px; }
      .fl-form { background:var(--bg-secondary); border:1px solid var(--border-color); border-radius:10px; padding:12px; }
      .fl-preview { display:flex; flex-direction:column; align-items:center; justify-content:center; gap:10px; background:var(--bg-secondary); border:1px solid var(--border-color); border-radius:10px; padding:16px; min-height:400px; }
      @media (max-width:900px) { .fl-layout { grid-template-columns:1fr; } }
    </style>
    <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px">
      <button class="form-btn form-btn-sm" onclick="window.loadModelForgePanel()" style="padding:4px 10px">← Back</button>
      <h4 style="margin:0;font-size:1rem">📐 First Layer Test</h4>
    </div>
    <div class="fl-layout">
      <div><div class="fl-form" id="fl-form">
        ${_rf('Plate width (mm)', 'fl-w', 30, 400, 120, 5)}
        ${_rf('Plate depth (mm)', 'fl-d', 30, 400, 120, 5)}
        ${_rf('Layer height (mm)', 'fl-lh', 0.1, 0.6, 0.2, 0.04)}
        ${_rf('Patch size (mm)', 'fl-ps', 10, 50, 20, 1)}
        <div style="margin-top:12px;padding:8px;background:var(--bg-tertiary);border-radius:6px;font-size:0.7rem;color:var(--text-muted);line-height:1.4">
          Single-layer pattern with corner + center patches connected by thin diagonal lines. Great for dialing in Z offset and bed level.
        </div>
      </div></div>
      <div class="fl-preview" id="fl-result">
        <div style="color:var(--text-muted);font-size:0.85rem">Configure test and generate</div>
      </div>
    </div>`;

    const form = document.getElementById('fl-form');
    if (form) form.addEventListener('input', () => { clearTimeout(window._flDeb); window._flDeb = setTimeout(_updatePreview, 300); });
    setTimeout(_updatePreview, 100);
  };

  function _updatePreview() {
    const r = document.getElementById('fl-result');
    if (!r) return;
    const p = _params();
    const scale = Math.min(3, 260 / Math.max(p.plateWidth, p.plateDepth));
    const pw = p.plateWidth * scale, pd = p.plateDepth * scale, ps = p.patchSize * scale;
    const edge = 5 * scale;
    r.innerHTML = `
      <div style="display:flex;gap:6px;flex-wrap:wrap;justify-content:center">
        <button class="form-btn form-btn-sm" data-ripple onclick="window._flPreview3D()" style="background:var(--accent-cyan);color:#fff">🧊 3D Preview</button>
        <button class="form-btn form-btn-sm" data-ripple onclick="window._flDownload()" style="background:var(--accent-green);color:#fff">📥 Download 3MF</button>
      </div>
      <div style="font-size:0.7rem;color:var(--text-muted);margin:4px 0">${p.plateWidth}×${p.plateDepth}mm · ${p.layerHeight}mm layer</div>
      <svg width="${pw+20}" height="${pd+20}" viewBox="-10 -10 ${pw+20} ${pd+20}">
        <rect x="0" y="0" width="${pw}" height="${pd}" fill="var(--bg-tertiary)" stroke="var(--border-color)" stroke-width="1"/>
        <rect x="${edge}" y="${edge}" width="${ps}" height="${ps}" fill="#a7d8f0"/>
        <rect x="${pw-edge-ps}" y="${edge}" width="${ps}" height="${ps}" fill="#a7d8f0"/>
        <rect x="${edge}" y="${pd-edge-ps}" width="${ps}" height="${ps}" fill="#a7d8f0"/>
        <rect x="${pw-edge-ps}" y="${pd-edge-ps}" width="${ps}" height="${ps}" fill="#a7d8f0"/>
        <rect x="${pw/2-ps/2}" y="${pd/2-ps/2}" width="${ps}" height="${ps}" fill="#a7d8f0"/>
        <line x1="${edge+ps/2}" y1="${edge+ps/2}" x2="${pw-edge-ps/2}" y2="${pd-edge-ps/2}" stroke="#a7d8f0" stroke-width="1.5"/>
        <line x1="${pw-edge-ps/2}" y1="${edge+ps/2}" x2="${edge+ps/2}" y2="${pd-edge-ps/2}" stroke="#a7d8f0" stroke-width="1.5"/>
      </svg>`;
  }

  function _params() {
    const v = id => parseFloat(document.getElementById(id)?.value) || 0;
    return {
      plateWidth: Math.max(30, Math.min(400, v('fl-w') || 120)),
      plateDepth: Math.max(30, Math.min(400, v('fl-d') || 120)),
      layerHeight: Math.max(0.1, Math.min(0.6, v('fl-lh') || 0.2)),
      patchSize: Math.max(10, Math.min(50, v('fl-ps') || 20)),
    };
  }

  async function _generate() {
    const res = await fetch('/api/model-forge/first-layer/generate-3mf', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(_params())
    });
    if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || 'Failed');
    return res.blob();
  }

  window._flDownload = async function() {
    try {
      if (typeof showToast === 'function') showToast('Generating test...', 'info');
      const blob = await _generate();
      const p = _params();
      const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
      a.download = `first_layer_${p.plateWidth}x${p.plateDepth}.3mf`;
      a.click(); URL.revokeObjectURL(a.href);
      if (typeof showToast === 'function') showToast('3MF downloaded!', 'success');
    } catch (e) { if (typeof showToast === 'function') showToast(e.message, 'error'); }
  };

  window._flPreview3D = async function() {
    const r = document.getElementById('fl-result');
    if (r) r.innerHTML = '<div style="padding:20px;color:var(--text-muted)">Generating 3D...</div>';
    try {
      const blob = await _generate();
      const file = new File([blob], 'first_layer.3mf', { type: 'application/octet-stream' });
      if (typeof window._g3dHandleFile === 'function') window._g3dHandleFile(file);
      else if (typeof window.open3mfViewer === 'function') window.open3mfViewer(URL.createObjectURL(blob), 'First Layer Test');
      const obs = new MutationObserver(() => { if (!document.getElementById('_global-3d-overlay')) { obs.disconnect(); _updatePreview(); } });
      obs.observe(document.body, { childList: true, subtree: true });
    } catch (e) { if (r) r.innerHTML = '<div style="padding:20px;color:var(--accent-red)">' + e.message + '</div>'; }
  };

  function _rf(label, id, min, max, val, step) {
    return `<div style="margin-bottom:5px"><div style="display:flex;align-items:center;justify-content:space-between"><label style="font-size:0.7rem;color:var(--text-muted)">${label}</label><input type="number" class="form-input" id="${id}" value="${val}" min="${min}" max="${max}" step="${step}" style="width:50px;font-size:0.75rem;padding:2px 4px;text-align:center;border-radius:4px" oninput="const s=this.parentElement.nextElementSibling;if(s)s.value=this.value"></div><input type="range" min="${min}" max="${max}" value="${val}" step="${step}" style="width:100%;accent-color:var(--accent-blue);margin-top:2px" oninput="const n=this.previousElementSibling.querySelector('input[type=number]');if(n)n.value=this.value"></div>`;
  }
})();
