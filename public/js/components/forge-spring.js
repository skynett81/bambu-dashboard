// Model Forge — Compression Spring Generator
(function() {
  'use strict';

  window.loadForgeSpring = function() {
    const el = document.getElementById('overlay-panel-body');
    if (!el) return;

    el.innerHTML = `<style>
      .spr-layout { display:grid; grid-template-columns:360px 1fr; gap:12px; min-height:500px; }
      .spr-sidebar { overflow-y:auto; max-height:calc(100vh - 180px); padding-right:4px; }
      .spr-form { background:var(--bg-secondary); border:1px solid var(--border-color); border-radius:10px; padding:12px; }
      .spr-preview { display:flex; flex-direction:column; align-items:center; justify-content:center; gap:10px; background:var(--bg-secondary); border:1px solid var(--border-color); border-radius:10px; padding:16px; min-height:400px; }
      @media (max-width:900px) { .spr-layout { grid-template-columns:1fr; } }
    </style>
    <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px">
      <button class="form-btn form-btn-sm" onclick="window.loadModelForgePanel()" style="padding:4px 10px">← Back</button>
      <h4 style="margin:0;font-size:1rem">🌀 Compression Spring</h4>
    </div>
    <div class="spr-layout">
      <div class="spr-sidebar"><div class="spr-form" id="spr-form">
        ${_rf('Coils', 'spr-c', 2, 40, 8, 1)}
        ${_rf('Outer diameter (mm)', 'spr-d', 4, 100, 20, 1)}
        ${_rf('Wire diameter (mm)', 'spr-w', 0.6, 10, 2, 0.1)}
        ${_rf('Pitch (mm / coil)', 'spr-p', 1, 20, 4, 0.2)}

        <div style="margin-top:12px;padding:8px;background:var(--bg-tertiary);border-radius:6px;font-size:0.7rem;color:var(--text-muted);line-height:1.4">
          For a functional spring, print in TPU or TPE. PLA/PETG will work only for decorative or very light duty.
        </div>
      </div></div>
      <div class="spr-preview" id="spr-result">
        <div style="color:var(--text-muted);font-size:0.85rem">Configure your spring and generate</div>
      </div>
    </div>`;

    const form = document.getElementById('spr-form');
    if (form) {
      form.addEventListener('input', () => { clearTimeout(window._sprDebounce); window._sprDebounce = setTimeout(_updatePreview, 300); });
    }
    setTimeout(_updatePreview, 100);
  };

  function _updatePreview() {
    const result = document.getElementById('spr-result');
    if (!result) return;
    const p = _params();
    const h = p.coils * p.pitch;
    const scale = Math.min(6, 240 / Math.max(p.diameter, h));
    const pw = Math.round(p.diameter * scale);
    const ph = Math.round(h * scale);

    let coilsHtml = '';
    for (let i = 0; i < p.coils; i++) {
      const y = i * (ph / p.coils);
      coilsHtml += `<ellipse cx="${pw/2}" cy="${y + ph/p.coils/2}" rx="${pw/2 - 2}" ry="${ph/p.coils/2 - 1}" fill="none" stroke="#a0a0b0" stroke-width="${Math.max(1, p.wireDiameter * scale / 2)}"/>`;
    }

    result.innerHTML = `
      <div style="display:flex;gap:6px;flex-wrap:wrap;justify-content:center">
        <button class="form-btn form-btn-sm" data-ripple onclick="window._sprPreview3D()" style="background:var(--accent-cyan);color:#fff">🧊 3D Preview</button>
        <button class="form-btn form-btn-sm" data-ripple onclick="window._sprDownload()" style="background:var(--accent-green);color:#fff">📥 Download 3MF</button>
      </div>
      <div style="font-size:0.7rem;color:var(--text-muted);margin:4px 0">${p.coils} coils · ⌀${p.diameter}mm · wire ${p.wireDiameter}mm · ${h.toFixed(0)}mm tall</div>
      <svg width="${pw+10}" height="${ph+10}" viewBox="-5 -5 ${pw+10} ${ph+10}">${coilsHtml}</svg>`;
  }

  function _params() {
    const v = id => parseFloat(document.getElementById(id)?.value) || 0;
    return {
      coils: Math.max(2, Math.min(40, v('spr-c') || 8)),
      diameter: Math.max(4, Math.min(100, v('spr-d') || 20)),
      wireDiameter: Math.max(0.6, Math.min(10, v('spr-w') || 2)),
      pitch: Math.max(1, Math.min(20, v('spr-p') || 4)),
    };
  }

  async function _generate() {
    const res = await fetch('/api/model-forge/spring/generate-3mf', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(_params())
    });
    if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || 'Failed');
    return res.blob();
  }

  window._sprDownload = async function() {
    try {
      if (typeof showToast === 'function') showToast('Generating spring...', 'info');
      const blob = await _generate();
      const p = _params();
      const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
      a.download = `spring_${p.diameter}x${p.coils}c.3mf`;
      a.click(); URL.revokeObjectURL(a.href);
      if (typeof showToast === 'function') showToast('3MF downloaded!', 'success');
    } catch (e) { if (typeof showToast === 'function') showToast(e.message, 'error'); }
  };

  window._sprPreview3D = async function() {
    const result = document.getElementById('spr-result');
    if (result) result.innerHTML = '<div style="padding:20px;color:var(--text-muted)">Generating 3D...</div>';
    try {
      const blob = await _generate();
      const file = new File([blob], 'spring.3mf', { type: 'application/octet-stream' });
      if (typeof window._g3dHandleFile === 'function') window._g3dHandleFile(file);
      else if (typeof window.open3mfViewer === 'function') window.open3mfViewer(URL.createObjectURL(blob), 'Spring');
      const obs = new MutationObserver(() => { if (!document.getElementById('_global-3d-overlay')) { obs.disconnect(); _updatePreview(); } });
      obs.observe(document.body, { childList: true, subtree: true });
    } catch (e) { if (result) result.innerHTML = '<div style="padding:20px;color:var(--accent-red)">' + e.message + '</div>'; }
  };

  function _rf(label, id, min, max, val, step) {
    return `<div style="margin-bottom:5px"><div style="display:flex;align-items:center;justify-content:space-between"><label style="font-size:0.7rem;color:var(--text-muted)">${label}</label><input type="number" class="form-input" id="${id}" value="${val}" min="${min}" max="${max}" step="${step}" style="width:50px;font-size:0.75rem;padding:2px 4px;text-align:center;border-radius:4px" oninput="const s=this.parentElement.nextElementSibling;if(s)s.value=this.value"></div><input type="range" min="${min}" max="${max}" value="${val}" step="${step}" style="width:100%;accent-color:var(--accent-blue);margin-top:2px" oninput="const n=this.previousElementSibling.querySelector('input[type=number]');if(n)n.value=this.value"></div>`;
  }
})();
