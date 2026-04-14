// Model Forge — Filament Spool Adapter
(function() {
  'use strict';

  window.loadForgeSpoolAdapter = function() {
    const el = document.getElementById('overlay-panel-body');
    if (!el) return;

    el.innerHTML = `<style>
      .spa-layout { display:grid; grid-template-columns:360px 1fr; gap:12px; min-height:500px; }
      .spa-sidebar { overflow-y:auto; max-height:calc(100vh - 180px); padding-right:4px; }
      .spa-form { background:var(--bg-secondary); border:1px solid var(--border-color); border-radius:10px; padding:12px; }
      .spa-preview { display:flex; flex-direction:column; align-items:center; justify-content:center; gap:10px; background:var(--bg-secondary); border:1px solid var(--border-color); border-radius:10px; padding:16px; min-height:400px; }
      @media (max-width:900px) { .spa-layout { grid-template-columns:1fr; } }
    </style>
    <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px">
      <button class="form-btn form-btn-sm" onclick="window.loadModelForgePanel()" style="padding:4px 10px">← Back</button>
      <h4 style="margin:0;font-size:1rem">🎯 Filament Spool Adapter</h4>
    </div>
    <div class="spa-layout">
      <div class="spa-sidebar"><div class="spa-form" id="spa-form">
        ${_rf('Inner ⌀ (hub, mm)', 'spa-id', 5, 200, 25, 0.5)}
        ${_rf('Outer ⌀ (target, mm)', 'spa-od', 10, 300, 52, 0.5)}
        ${_rf('Height (mm)', 'spa-h', 2, 100, 10, 0.5)}

        <h5 style="margin:14px 0 10px;font-size:0.88rem">Grip ribs (optional)</h5>
        ${_rf('Rib count', 'spa-rc', 0, 24, 0, 1)}
        ${_rf('Rib depth (mm)', 'spa-rh', 0.2, 2, 0.4, 0.05)}
      </div></div>
      <div class="spa-preview" id="spa-result">
        <div style="color:var(--text-muted);font-size:0.85rem">Configure adapter and generate</div>
      </div>
    </div>`;

    const form = document.getElementById('spa-form');
    if (form) form.addEventListener('input', () => { clearTimeout(window._spaDeb); window._spaDeb = setTimeout(_updatePreview, 300); });
    setTimeout(_updatePreview, 100);
  };

  function _updatePreview() {
    const result = document.getElementById('spa-result');
    if (!result) return;
    const p = _params();
    const scale = Math.min(5, 240 / p.outerDiameter);
    const outerR = p.outerDiameter * scale / 2;
    const innerR = p.innerDiameter * scale / 2;
    result.innerHTML = `
      <div style="display:flex;gap:6px;flex-wrap:wrap;justify-content:center">
        <button class="form-btn form-btn-sm" data-ripple onclick="window._spaPreview3D()" style="background:var(--accent-cyan);color:#fff">🧊 3D Preview</button>
        <button class="form-btn form-btn-sm" data-ripple onclick="window._spaDownload()" style="background:var(--accent-green);color:#fff">📥 Download 3MF</button>
      </div>
      <div style="font-size:0.7rem;color:var(--text-muted);margin:4px 0">⌀${p.innerDiameter} → ⌀${p.outerDiameter} · ${p.height}mm tall${p.ribCount > 0 ? ` · ${p.ribCount} ribs` : ''}</div>
      <svg width="${outerR*2+20}" height="${outerR*2+20}" viewBox="${-outerR-10} ${-outerR-10} ${outerR*2+20} ${outerR*2+20}">
        <circle cx="0" cy="0" r="${outerR}" fill="#a89170" stroke="#6a5738" stroke-width="1.5"/>
        <circle cx="0" cy="0" r="${innerR}" fill="var(--bg-secondary)" stroke="#6a5738" stroke-width="1"/>
      </svg>`;
  }

  function _params() {
    const v = id => parseFloat(document.getElementById(id)?.value) || 0;
    return {
      innerDiameter: Math.max(5, Math.min(200, v('spa-id') || 25)),
      outerDiameter: Math.max(10, Math.min(300, v('spa-od') || 52)),
      height: Math.max(2, Math.min(100, v('spa-h') || 10)),
      ribCount: Math.max(0, Math.min(24, v('spa-rc') || 0)),
      ribHeight: Math.max(0.2, Math.min(2, v('spa-rh') || 0.4)),
    };
  }

  async function _generate() {
    const res = await fetch('/api/model-forge/spool-adapter/generate-3mf', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(_params())
    });
    if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || 'Failed');
    return res.blob();
  }

  window._spaDownload = async function() {
    try {
      if (typeof showToast === 'function') showToast('Generating adapter...', 'info');
      const blob = await _generate();
      const p = _params();
      const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
      a.download = `spool_adapter_${p.innerDiameter}_${p.outerDiameter}.3mf`;
      a.click(); URL.revokeObjectURL(a.href);
      if (typeof showToast === 'function') showToast('3MF downloaded!', 'success');
    } catch (e) { if (typeof showToast === 'function') showToast(e.message, 'error'); }
  };

  window._spaPreview3D = async function() {
    const result = document.getElementById('spa-result');
    if (result) result.innerHTML = '<div style="padding:20px;color:var(--text-muted)">Generating 3D...</div>';
    try {
      const blob = await _generate();
      const file = new File([blob], 'spool_adapter.3mf', { type: 'application/octet-stream' });
      if (typeof window._g3dHandleFile === 'function') window._g3dHandleFile(file);
      else if (typeof window.open3mfViewer === 'function') window.open3mfViewer(URL.createObjectURL(blob), 'Spool Adapter');
      const obs = new MutationObserver(() => { if (!document.getElementById('_global-3d-overlay')) { obs.disconnect(); _updatePreview(); } });
      obs.observe(document.body, { childList: true, subtree: true });
    } catch (e) { if (result) result.innerHTML = '<div style="padding:20px;color:var(--accent-red)">' + e.message + '</div>'; }
  };

  function _rf(label, id, min, max, val, step) {
    return `<div style="margin-bottom:5px"><div style="display:flex;align-items:center;justify-content:space-between"><label style="font-size:0.7rem;color:var(--text-muted)">${label}</label><input type="number" class="form-input" id="${id}" value="${val}" min="${min}" max="${max}" step="${step}" style="width:50px;font-size:0.75rem;padding:2px 4px;text-align:center;border-radius:4px" oninput="const s=this.parentElement.nextElementSibling;if(s)s.value=this.value"></div><input type="range" min="${min}" max="${max}" value="${val}" step="${step}" style="width:100%;accent-color:var(--accent-blue);margin-top:2px" oninput="const n=this.previousElementSibling.querySelector('input[type=number]');if(n)n.value=this.value"></div>`;
  }
})();
