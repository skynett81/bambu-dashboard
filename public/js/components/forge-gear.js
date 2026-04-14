// Model Forge — Spur Gear Generator
(function() {
  'use strict';

  window.loadForgeGear = function() {
    const el = document.getElementById('overlay-panel-body');
    if (!el) return;

    el.innerHTML = `<style>
      .gear-layout { display:grid; grid-template-columns:360px 1fr; gap:12px; min-height:500px; }
      .gear-sidebar { overflow-y:auto; max-height:calc(100vh - 180px); padding-right:4px; }
      .gear-form { background:var(--bg-secondary); border:1px solid var(--border-color); border-radius:10px; padding:12px; }
      .gear-preview { display:flex; flex-direction:column; align-items:center; justify-content:center; gap:10px; background:var(--bg-secondary); border:1px solid var(--border-color); border-radius:10px; padding:16px; min-height:400px; }
      @media (max-width:900px) { .gear-layout { grid-template-columns:1fr; } }
    </style>
    <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px">
      <button class="form-btn form-btn-sm" onclick="window.loadModelForgePanel()" style="padding:4px 10px">← Back</button>
      <h4 style="margin:0;font-size:1rem">⚙️ Spur Gear Generator</h4>
    </div>
    <div class="gear-layout">
      <div class="gear-sidebar"><div class="gear-form" id="gear-form">
        <h5 style="margin:0 0 10px;font-size:0.88rem">Teeth</h5>
        ${_rf('Number of teeth', 'gear-t', 8, 200, 20, 1)}
        ${_rf('Module (mm)', 'gear-m', 0.3, 5, 1.5, 0.1)}

        <h5 style="margin:14px 0 10px;font-size:0.88rem">Size</h5>
        ${_rf('Face width (mm)', 'gear-fw', 1, 50, 5, 0.5)}
        ${_rf('Bore (mm)', 'gear-b', 0, 50, 3, 0.5)}

        <h5 style="margin:14px 0 10px;font-size:0.88rem">Geometry</h5>
        ${_rf('Pressure angle (°)', 'gear-pa', 14, 30, 20, 1)}
        ${_rf('Backlash (mm)', 'gear-bl', 0, 0.5, 0.1, 0.02)}
      </div></div>
      <div class="gear-preview" id="gear-result">
        <div style="color:var(--text-muted);font-size:0.85rem">Configure your gear and generate</div>
      </div>
    </div>`;

    const form = document.getElementById('gear-form');
    if (form) {
      form.addEventListener('input', () => { clearTimeout(window._gearDebounce); window._gearDebounce = setTimeout(_updatePreview, 300); });
    }
    setTimeout(_updatePreview, 100);
  };

  function _updatePreview() {
    const result = document.getElementById('gear-result');
    if (!result) return;
    const p = _params();
    const pitchD = p.teeth * p.module;
    const outerD = pitchD + 2 * p.module;
    const maxPx = 280;
    const scale = Math.min(4, maxPx / outerD);
    const r = outerD * scale / 2;
    const innerR = Math.max(3, p.bore * scale / 2);

    result.innerHTML = `
      <div style="display:flex;gap:6px;flex-wrap:wrap;justify-content:center">
        <button class="form-btn form-btn-sm" data-ripple onclick="window._gearPreview3D()" style="background:var(--accent-cyan);color:#fff">🧊 3D Preview</button>
        <button class="form-btn form-btn-sm" data-ripple onclick="window._gearDownload()" style="background:var(--accent-green);color:#fff">📥 Download 3MF</button>
      </div>
      <div style="font-size:0.7rem;color:var(--text-muted);margin:4px 0">${p.teeth}t · m${p.module} · pitch ⌀${pitchD.toFixed(1)}mm · outer ⌀${outerD.toFixed(1)}mm</div>
      <svg width="${r*2+20}" height="${r*2+20}" viewBox="${-r-10} ${-r-10} ${r*2+20} ${r*2+20}">
        <circle cx="0" cy="0" r="${r}" fill="#bfa970" stroke="#6b5a30" stroke-width="1.5"/>
        ${p.bore > 0 ? `<circle cx="0" cy="0" r="${innerR}" fill="var(--bg-secondary)" stroke="#6b5a30" stroke-width="1"/>` : ''}
      </svg>`;
  }

  function _params() {
    const v = id => parseFloat(document.getElementById(id)?.value) || 0;
    return {
      teeth: Math.max(8, Math.min(200, v('gear-t') || 20)),
      module: Math.max(0.3, Math.min(5, v('gear-m') || 1.5)),
      faceWidth: Math.max(1, Math.min(50, v('gear-fw') || 5)),
      bore: Math.max(0, Math.min(50, v('gear-b') || 3)),
      pressureAngle: Math.max(14, Math.min(30, v('gear-pa') || 20)),
      backlash: Math.max(0, Math.min(0.5, v('gear-bl') || 0.1)),
    };
  }

  async function _generate() {
    const res = await fetch('/api/model-forge/gear/generate-3mf', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(_params())
    });
    if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || 'Failed');
    return res.blob();
  }

  window._gearDownload = async function() {
    try {
      if (typeof showToast === 'function') showToast('Generating gear...', 'info');
      const blob = await _generate();
      const p = _params();
      const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
      a.download = `gear_${p.teeth}t_m${p.module}.3mf`;
      a.click(); URL.revokeObjectURL(a.href);
      if (typeof showToast === 'function') showToast('3MF downloaded!', 'success');
    } catch (e) { if (typeof showToast === 'function') showToast(e.message, 'error'); }
  };

  window._gearPreview3D = async function() {
    const result = document.getElementById('gear-result');
    if (result) result.innerHTML = '<div style="padding:20px;color:var(--text-muted)">Generating 3D...</div>';
    try {
      const blob = await _generate();
      const file = new File([blob], 'gear.3mf', { type: 'application/octet-stream' });
      if (typeof window._g3dHandleFile === 'function') window._g3dHandleFile(file);
      else if (typeof window.open3mfViewer === 'function') window.open3mfViewer(URL.createObjectURL(blob), 'Spur Gear');
      const obs = new MutationObserver(() => { if (!document.getElementById('_global-3d-overlay')) { obs.disconnect(); _updatePreview(); } });
      obs.observe(document.body, { childList: true, subtree: true });
    } catch (e) { if (result) result.innerHTML = '<div style="padding:20px;color:var(--accent-red)">' + e.message + '</div>'; }
  };

  function _rf(label, id, min, max, val, step) {
    return `<div style="margin-bottom:5px"><div style="display:flex;align-items:center;justify-content:space-between"><label style="font-size:0.7rem;color:var(--text-muted)">${label}</label><input type="number" class="form-input" id="${id}" value="${val}" min="${min}" max="${max}" step="${step}" style="width:50px;font-size:0.75rem;padding:2px 4px;text-align:center;border-radius:4px" oninput="const s=this.parentElement.nextElementSibling;if(s)s.value=this.value"></div><input type="range" min="${min}" max="${max}" value="${val}" step="${step}" style="width:100%;accent-color:var(--accent-blue);margin-top:2px" oninput="const n=this.previousElementSibling.querySelector('input[type=number]');if(n)n.value=this.value"></div>`;
  }
})();
