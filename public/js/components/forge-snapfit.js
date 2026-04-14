// Model Forge — Snap-fit Connector Generator
(function() {
  'use strict';

  window.loadForgeSnapfit = function() {
    const el = document.getElementById('overlay-panel-body');
    if (!el) return;

    el.innerHTML = `<style>
      .snp-layout { display:grid; grid-template-columns:360px 1fr; gap:12px; min-height:500px; }
      .snp-sidebar { overflow-y:auto; max-height:calc(100vh - 180px); padding-right:4px; }
      .snp-form { background:var(--bg-secondary); border:1px solid var(--border-color); border-radius:10px; padding:12px; }
      .snp-preview { display:flex; flex-direction:column; align-items:center; justify-content:center; gap:10px; background:var(--bg-secondary); border:1px solid var(--border-color); border-radius:10px; padding:16px; min-height:400px; }
      @media (max-width:900px) { .snp-layout { grid-template-columns:1fr; } }
    </style>
    <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px">
      <button class="form-btn form-btn-sm" onclick="window.loadModelForgePanel()" style="padding:4px 10px">← Back</button>
      <h4 style="margin:0;font-size:1rem">🔒 Snap-fit Connector</h4>
    </div>
    <div class="snp-layout">
      <div class="snp-sidebar"><div class="snp-form" id="snp-form">
        ${_rf('Beam length (mm)', 'snp-l', 5, 50, 15, 0.5)}
        ${_rf('Beam width (mm)', 'snp-w', 3, 30, 8, 0.5)}
        ${_rf('Beam thickness (mm)', 'snp-t', 1, 6, 2, 0.1)}
        ${_rf('Hook depth (mm)', 'snp-hd', 0.5, 5, 1.2, 0.1)}
        ${_rf('Hook height (mm)', 'snp-hh', 0.8, 5, 1.8, 0.1)}
        ${_rf('Clearance (mm)', 'snp-cl', 0.1, 0.6, 0.2, 0.05)}

        <div style="margin-top:12px;padding:8px;background:var(--bg-tertiary);border-radius:6px;font-size:0.7rem;color:var(--text-muted);line-height:1.4">
          Generates both halves of a cantilever snap-fit pair — male hook and female catch — ready to print together and snap after cooling.
        </div>
      </div></div>
      <div class="snp-preview" id="snp-result">
        <div style="color:var(--text-muted);font-size:0.85rem">Configure the snap pair and generate</div>
      </div>
    </div>`;

    const form = document.getElementById('snp-form');
    if (form) {
      form.addEventListener('input', () => { clearTimeout(window._snpDebounce); window._snpDebounce = setTimeout(_updatePreview, 300); });
    }
    setTimeout(_updatePreview, 100);
  };

  function _updatePreview() {
    const result = document.getElementById('snp-result');
    if (!result) return;
    const p = _params();
    const scale = Math.min(6, 220 / (p.beamLength + 20));
    const bl = p.beamLength * scale;
    const bw = p.beamWidth * scale;
    const bt = p.beamThickness * scale;
    const hd = p.hookDepth * scale;
    const hh = p.hookHeight * scale;
    result.innerHTML = `
      <div style="display:flex;gap:6px;flex-wrap:wrap;justify-content:center">
        <button class="form-btn form-btn-sm" data-ripple onclick="window._snpPreview3D()" style="background:var(--accent-cyan);color:#fff">🧊 3D Preview</button>
        <button class="form-btn form-btn-sm" data-ripple onclick="window._snpDownload()" style="background:var(--accent-green);color:#fff">📥 Download 3MF</button>
      </div>
      <div style="font-size:0.7rem;color:var(--text-muted);margin:4px 0">Beam ${p.beamLength}×${p.beamWidth}×${p.beamThickness}mm · hook ${p.hookDepth}×${p.hookHeight}mm</div>
      <svg width="${bl + 120}" height="${bw + 30}" viewBox="-5 -5 ${bl + 120} ${bw + 30}">
        <rect x="0" y="0" width="20" height="${bw}" fill="#7ba8b8" stroke="#3a5d6d"/>
        <rect x="20" y="${bw/2 - bt/2}" width="${bl}" height="${bt}" fill="#8ab8c8" stroke="#3a5d6d"/>
        <rect x="${20 + bl - hd}" y="${bw/2 - bt/2 - hh}" width="${hd}" height="${hh}" fill="#9ac8d8" stroke="#3a5d6d"/>
        <rect x="${bl + 40}" y="0" width="60" height="${bw}" fill="#7ba8b8" stroke="#3a5d6d"/>
        <rect x="${bl + 42}" y="${bw/2 - bt/2 - 1}" width="56" height="${bt + 2}" fill="var(--bg-tertiary)"/>
      </svg>`;
  }

  function _params() {
    const v = id => parseFloat(document.getElementById(id)?.value) || 0;
    return {
      beamLength: Math.max(5, Math.min(50, v('snp-l') || 15)),
      beamWidth: Math.max(3, Math.min(30, v('snp-w') || 8)),
      beamThickness: Math.max(1, Math.min(6, v('snp-t') || 2)),
      hookDepth: Math.max(0.5, Math.min(5, v('snp-hd') || 1.2)),
      hookHeight: Math.max(0.8, Math.min(5, v('snp-hh') || 1.8)),
      clearance: Math.max(0.1, Math.min(0.6, v('snp-cl') || 0.2)),
    };
  }

  async function _generate() {
    const res = await fetch('/api/model-forge/snapfit/generate-3mf', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(_params())
    });
    if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || 'Failed');
    return res.blob();
  }

  window._snpDownload = async function() {
    try {
      if (typeof showToast === 'function') showToast('Generating snap pair...', 'info');
      const blob = await _generate();
      const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
      a.download = 'snapfit_pair.3mf';
      a.click(); URL.revokeObjectURL(a.href);
      if (typeof showToast === 'function') showToast('3MF downloaded!', 'success');
    } catch (e) { if (typeof showToast === 'function') showToast(e.message, 'error'); }
  };

  window._snpPreview3D = async function() {
    const result = document.getElementById('snp-result');
    if (result) result.innerHTML = '<div style="padding:20px;color:var(--text-muted)">Generating 3D...</div>';
    try {
      const blob = await _generate();
      const file = new File([blob], 'snapfit.3mf', { type: 'application/octet-stream' });
      if (typeof window._g3dHandleFile === 'function') window._g3dHandleFile(file);
      else if (typeof window.open3mfViewer === 'function') window.open3mfViewer(URL.createObjectURL(blob), 'Snap-fit');
      const obs = new MutationObserver(() => { if (!document.getElementById('_global-3d-overlay')) { obs.disconnect(); _updatePreview(); } });
      obs.observe(document.body, { childList: true, subtree: true });
    } catch (e) { if (result) result.innerHTML = '<div style="padding:20px;color:var(--accent-red)">' + e.message + '</div>'; }
  };

  function _rf(label, id, min, max, val, step) {
    return `<div style="margin-bottom:5px"><div style="display:flex;align-items:center;justify-content:space-between"><label style="font-size:0.7rem;color:var(--text-muted)">${label}</label><input type="number" class="form-input" id="${id}" value="${val}" min="${min}" max="${max}" step="${step}" style="width:50px;font-size:0.75rem;padding:2px 4px;text-align:center;border-radius:4px" oninput="const s=this.parentElement.nextElementSibling;if(s)s.value=this.value"></div><input type="range" min="${min}" max="${max}" value="${val}" step="${step}" style="width:100%;accent-color:var(--accent-blue);margin-top:2px" oninput="const n=this.previousElementSibling.querySelector('input[type=number]');if(n)n.value=this.value"></div>`;
  }
})();
