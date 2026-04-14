// Model Forge — Cable Chain Link
(function() {
  'use strict';

  window.loadForgeCableChain = function() {
    const el = document.getElementById('overlay-panel-body');
    if (!el) return;

    el.innerHTML = `<style>
      .cc-layout { display:grid; grid-template-columns:360px 1fr; gap:12px; min-height:500px; }
      .cc-sidebar { overflow-y:auto; max-height:calc(100vh - 180px); padding-right:4px; }
      .cc-form { background:var(--bg-secondary); border:1px solid var(--border-color); border-radius:10px; padding:12px; }
      .cc-preview { display:flex; flex-direction:column; align-items:center; justify-content:center; gap:10px; background:var(--bg-secondary); border:1px solid var(--border-color); border-radius:10px; padding:16px; min-height:400px; }
      @media (max-width:900px) { .cc-layout { grid-template-columns:1fr; } }
    </style>
    <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px">
      <button class="form-btn form-btn-sm" onclick="window.loadModelForgePanel()" style="padding:4px 10px">← Back</button>
      <h4 style="margin:0;font-size:1rem">⛓️ Cable Chain Link</h4>
    </div>
    <div class="cc-layout">
      <div class="cc-sidebar"><div class="cc-form" id="cc-form">
        ${_rf('Length pivot-to-pivot (mm)', 'cc-l', 8, 80, 20, 1)}
        ${_rf('Cable channel width (mm)', 'cc-w', 4, 40, 12, 0.5)}
        ${_rf('Cable channel height (mm)', 'cc-h', 4, 40, 10, 0.5)}
        ${_rf('Wall thickness (mm)', 'cc-wt', 0.8, 4, 1.6, 0.2)}
        ${_rf('Pin diameter (mm)', 'cc-pd', 1, 8, 3, 0.1)}

        <div style="margin-top:12px;padding:8px;background:var(--bg-tertiary);border-radius:6px;font-size:0.7rem;color:var(--text-muted);line-height:1.4">
          Print multiple links and connect them with short M3 bolts or printed pins to form a flexible drag chain.
        </div>
      </div></div>
      <div class="cc-preview" id="cc-result">
        <div style="color:var(--text-muted);font-size:0.85rem">Configure link and generate</div>
      </div>
    </div>`;

    const form = document.getElementById('cc-form');
    if (form) form.addEventListener('input', () => { clearTimeout(window._ccDeb); window._ccDeb = setTimeout(_updatePreview, 300); });
    setTimeout(_updatePreview, 100);
  };

  function _updatePreview() {
    const result = document.getElementById('cc-result');
    if (!result) return;
    const p = _params();
    const scale = Math.min(5, 240 / p.length);
    const l = p.length * scale;
    const w = (p.width + p.wallThickness * 2) * scale;
    const h = (p.height + p.wallThickness * 2) * scale;
    result.innerHTML = `
      <div style="display:flex;gap:6px;flex-wrap:wrap;justify-content:center">
        <button class="form-btn form-btn-sm" data-ripple onclick="window._ccPreview3D()" style="background:var(--accent-cyan);color:#fff">🧊 3D Preview</button>
        <button class="form-btn form-btn-sm" data-ripple onclick="window._ccDownload()" style="background:var(--accent-green);color:#fff">📥 Download 3MF</button>
      </div>
      <div style="font-size:0.7rem;color:var(--text-muted);margin:4px 0">${p.length}×${p.width}×${p.height}mm · pin ⌀${p.pinDiameter}mm</div>
      <div style="perspective:400px;margin-top:10px">
        <div style="width:${l + 20}px;height:${h}px;position:relative;transform:rotateX(18deg)">
          <div style="position:absolute;left:10px;top:0;width:${l}px;height:${h}px;background:#555560;border:2px solid #25252a;border-radius:4px"></div>
          <div style="position:absolute;left:0;top:${h/2 - 6}px;width:12px;height:12px;border-radius:50%;background:#25252a"></div>
          <div style="position:absolute;left:${l+8}px;top:${h/2 - 6}px;width:12px;height:12px;border-radius:50%;background:#25252a"></div>
        </div>
      </div>`;
  }

  function _params() {
    const v = id => parseFloat(document.getElementById(id)?.value) || 0;
    return {
      length: Math.max(8, Math.min(80, v('cc-l') || 20)),
      width: Math.max(4, Math.min(40, v('cc-w') || 12)),
      height: Math.max(4, Math.min(40, v('cc-h') || 10)),
      wallThickness: Math.max(0.8, Math.min(4, v('cc-wt') || 1.6)),
      pinDiameter: Math.max(1, Math.min(8, v('cc-pd') || 3)),
    };
  }

  async function _generate() {
    const res = await fetch('/api/model-forge/cable-chain/generate-3mf', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(_params())
    });
    if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || 'Failed');
    return res.blob();
  }

  window._ccDownload = async function() {
    try {
      if (typeof showToast === 'function') showToast('Generating link...', 'info');
      const blob = await _generate();
      const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
      a.download = 'cable_chain_link.3mf';
      a.click(); URL.revokeObjectURL(a.href);
      if (typeof showToast === 'function') showToast('3MF downloaded!', 'success');
    } catch (e) { if (typeof showToast === 'function') showToast(e.message, 'error'); }
  };

  window._ccPreview3D = async function() {
    const result = document.getElementById('cc-result');
    if (result) result.innerHTML = '<div style="padding:20px;color:var(--text-muted)">Generating 3D...</div>';
    try {
      const blob = await _generate();
      const file = new File([blob], 'cable_chain_link.3mf', { type: 'application/octet-stream' });
      if (typeof window._g3dHandleFile === 'function') window._g3dHandleFile(file);
      else if (typeof window.open3mfViewer === 'function') window.open3mfViewer(URL.createObjectURL(blob), 'Cable Chain Link');
      const obs = new MutationObserver(() => { if (!document.getElementById('_global-3d-overlay')) { obs.disconnect(); _updatePreview(); } });
      obs.observe(document.body, { childList: true, subtree: true });
    } catch (e) { if (result) result.innerHTML = '<div style="padding:20px;color:var(--accent-red)">' + e.message + '</div>'; }
  };

  function _rf(label, id, min, max, val, step) {
    return `<div style="margin-bottom:5px"><div style="display:flex;align-items:center;justify-content:space-between"><label style="font-size:0.7rem;color:var(--text-muted)">${label}</label><input type="number" class="form-input" id="${id}" value="${val}" min="${min}" max="${max}" step="${step}" style="width:50px;font-size:0.75rem;padding:2px 4px;text-align:center;border-radius:4px" oninput="const s=this.parentElement.nextElementSibling;if(s)s.value=this.value"></div><input type="range" min="${min}" max="${max}" value="${val}" step="${step}" style="width:100%;accent-color:var(--accent-blue);margin-top:2px" oninput="const n=this.previousElementSibling.querySelector('input[type=number]');if(n)n.value=this.value"></div>`;
  }
})();
