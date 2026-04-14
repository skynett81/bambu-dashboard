// Model Forge — Timing Belt Pulley Generator
(function() {
  'use strict';

  const PROFILES = {
    gt2_2: 'GT2 2mm',
    gt2_3: 'GT2 3mm',
    gt3_3: 'GT3 3mm',
    htd_3: 'HTD 3M',
    htd_5: 'HTD 5M',
  };

  window.loadForgePulley = function() {
    const el = document.getElementById('overlay-panel-body');
    if (!el) return;

    const opts = Object.entries(PROFILES).map(([k, v]) => `<option value="${k}">${v}</option>`).join('');
    el.innerHTML = `<style>
      .pul-layout { display:grid; grid-template-columns:360px 1fr; gap:12px; min-height:500px; }
      .pul-sidebar { overflow-y:auto; max-height:calc(100vh - 180px); padding-right:4px; }
      .pul-form { background:var(--bg-secondary); border:1px solid var(--border-color); border-radius:10px; padding:12px; }
      .pul-preview { display:flex; flex-direction:column; align-items:center; justify-content:center; gap:10px; background:var(--bg-secondary); border:1px solid var(--border-color); border-radius:10px; padding:16px; min-height:400px; }
      @media (max-width:900px) { .pul-layout { grid-template-columns:1fr; } }
    </style>
    <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px">
      <button class="form-btn form-btn-sm" onclick="window.loadModelForgePanel()" style="padding:4px 10px">← Back</button>
      <h4 style="margin:0;font-size:1rem">⚙️ Timing Belt Pulley</h4>
    </div>
    <div class="pul-layout">
      <div class="pul-sidebar"><div class="pul-form" id="pul-form">
        <div style="margin-bottom:8px">
          <label style="font-size:0.7rem;color:var(--text-muted)">Profile</label>
          <select class="form-input" id="pul-p" style="font-size:0.82rem;width:100%">${opts}</select>
        </div>
        ${_rf('Teeth', 'pul-t', 10, 200, 20, 1)}
        ${_rf('Face width (mm)', 'pul-w', 2, 30, 6, 0.5)}
        ${_rf('Bore (mm)', 'pul-b', 0, 20, 5, 0.5)}

        <label style="font-size:0.8rem;cursor:pointer;display:flex;align-items:center;gap:6px;margin:8px 0">
          <input type="checkbox" id="pul-fl" checked> Flanges (rims to keep belt on)
        </label>
        ${_rf('Flange height (mm)', 'pul-fh', 0.4, 3, 1, 0.2)}
      </div></div>
      <div class="pul-preview" id="pul-result">
        <div style="color:var(--text-muted);font-size:0.85rem">Configure your pulley and generate</div>
      </div>
    </div>`;

    const form = document.getElementById('pul-form');
    if (form) {
      form.addEventListener('input', () => { clearTimeout(window._pulDebounce); window._pulDebounce = setTimeout(_updatePreview, 300); });
      form.addEventListener('change', _updatePreview);
    }
    setTimeout(_updatePreview, 100);
  };

  function _updatePreview() {
    const result = document.getElementById('pul-result');
    if (!result) return;
    const p = _params();
    // Pitch diameter = teeth * pitch / π
    const profilePitch = { gt2_2: 2, gt2_3: 3, gt3_3: 3, htd_3: 3, htd_5: 5 }[p.profile] || 2;
    const pitchD = p.teeth * profilePitch / Math.PI;
    const maxPx = 260;
    const scale = Math.min(5, maxPx / (pitchD + 4));
    const r = (pitchD / 2 + 1) * scale;
    const innerR = Math.max(3, p.bore * scale / 2);

    result.innerHTML = `
      <div style="display:flex;gap:6px;flex-wrap:wrap;justify-content:center">
        <button class="form-btn form-btn-sm" data-ripple onclick="window._pulPreview3D()" style="background:var(--accent-cyan);color:#fff">🧊 3D Preview</button>
        <button class="form-btn form-btn-sm" data-ripple onclick="window._pulDownload()" style="background:var(--accent-green);color:#fff">📥 Download 3MF</button>
      </div>
      <div style="font-size:0.7rem;color:var(--text-muted);margin:4px 0">${PROFILES[p.profile]} · ${p.teeth}t · pitch ⌀${pitchD.toFixed(1)}mm${p.flanges ? ' · flanged' : ''}</div>
      <svg width="${r*2+20}" height="${r*2+20}" viewBox="${-r-10} ${-r-10} ${r*2+20} ${r*2+20}">
        <circle cx="0" cy="0" r="${r}" fill="#4a4a52" stroke="#22222a" stroke-width="1.5"/>
        <circle cx="0" cy="0" r="${r-2}" fill="#5a5a64" stroke="none"/>
        ${p.bore > 0 ? `<circle cx="0" cy="0" r="${innerR}" fill="var(--bg-secondary)" stroke="#22222a" stroke-width="1"/>` : ''}
      </svg>`;
  }

  function _params() {
    const v = id => parseFloat(document.getElementById(id)?.value) || 0;
    const s = id => document.getElementById(id)?.value;
    const c = id => !!document.getElementById(id)?.checked;
    return {
      profile: s('pul-p') || 'gt2_2',
      teeth: Math.max(10, Math.min(200, v('pul-t') || 20)),
      width: Math.max(2, Math.min(30, v('pul-w') || 6)),
      bore: Math.max(0, Math.min(20, v('pul-b') || 5)),
      flanges: c('pul-fl'),
      flangeHeight: Math.max(0.4, Math.min(3, v('pul-fh') || 1)),
    };
  }

  async function _generate() {
    const res = await fetch('/api/model-forge/pulley/generate-3mf', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(_params())
    });
    if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || 'Failed');
    return res.blob();
  }

  window._pulDownload = async function() {
    try {
      if (typeof showToast === 'function') showToast('Generating pulley...', 'info');
      const blob = await _generate();
      const p = _params();
      const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
      a.download = `pulley_${p.profile}_${p.teeth}t.3mf`;
      a.click(); URL.revokeObjectURL(a.href);
      if (typeof showToast === 'function') showToast('3MF downloaded!', 'success');
    } catch (e) { if (typeof showToast === 'function') showToast(e.message, 'error'); }
  };

  window._pulPreview3D = async function() {
    const result = document.getElementById('pul-result');
    if (result) result.innerHTML = '<div style="padding:20px;color:var(--text-muted)">Generating 3D...</div>';
    try {
      const blob = await _generate();
      const file = new File([blob], 'pulley.3mf', { type: 'application/octet-stream' });
      if (typeof window._g3dHandleFile === 'function') window._g3dHandleFile(file);
      else if (typeof window.open3mfViewer === 'function') window.open3mfViewer(URL.createObjectURL(blob), 'Pulley');
      const obs = new MutationObserver(() => { if (!document.getElementById('_global-3d-overlay')) { obs.disconnect(); _updatePreview(); } });
      obs.observe(document.body, { childList: true, subtree: true });
    } catch (e) { if (result) result.innerHTML = '<div style="padding:20px;color:var(--accent-red)">' + e.message + '</div>'; }
  };

  function _rf(label, id, min, max, val, step) {
    return `<div style="margin-bottom:5px"><div style="display:flex;align-items:center;justify-content:space-between"><label style="font-size:0.7rem;color:var(--text-muted)">${label}</label><input type="number" class="form-input" id="${id}" value="${val}" min="${min}" max="${max}" step="${step}" style="width:50px;font-size:0.75rem;padding:2px 4px;text-align:center;border-radius:4px" oninput="const s=this.parentElement.nextElementSibling;if(s)s.value=this.value"></div><input type="range" min="${min}" max="${max}" value="${val}" step="${step}" style="width:100%;accent-color:var(--accent-blue);margin-top:2px" oninput="const n=this.previousElementSibling.querySelector('input[type=number]');if(n)n.value=this.value"></div>`;
  }
})();
