// Model Forge — Scraper Holder
(function() {
  'use strict';

  window.loadForgeScraperHolder = function() {
    const el = document.getElementById('overlay-panel-body');
    if (!el) return;

    el.innerHTML = `<style>
      .sh-layout { display:grid; grid-template-columns:360px 1fr; gap:12px; min-height:500px; }
      .sh-form { background:var(--bg-secondary); border:1px solid var(--border-color); border-radius:10px; padding:12px; }
      .sh-preview { display:flex; flex-direction:column; align-items:center; justify-content:center; gap:10px; background:var(--bg-secondary); border:1px solid var(--border-color); border-radius:10px; padding:16px; min-height:400px; }
      @media (max-width:900px) { .sh-layout { grid-template-columns:1fr; } }
    </style>
    <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px">
      <button class="form-btn form-btn-sm" onclick="window.loadModelForgePanel()" style="padding:4px 10px">← Back</button>
      <h4 style="margin:0;font-size:1rem">🪚 Scraper Holder</h4>
    </div>
    <div class="sh-layout">
      <div><div class="sh-form" id="sh-form">
        ${_rf('Blade width (mm)', 'sh-tw', 15, 100, 35, 1)}
        ${_rf('Blade thickness (mm)', 'sh-tt', 2, 15, 4, 0.2)}
        ${_rf('Mount height (mm)', 'sh-mh', 30, 200, 60, 2)}
        ${_rf('Retaining lip height (mm)', 'sh-lh', 5, 40, 12, 1)}
        ${_rf('Wall thickness (mm)', 'sh-wt', 1.2, 5, 2, 0.2)}
      </div></div>
      <div class="sh-preview" id="sh-result">
        <div style="color:var(--text-muted);font-size:0.85rem">Configure holder and generate</div>
      </div>
    </div>`;

    const form = document.getElementById('sh-form');
    if (form) form.addEventListener('input', () => { clearTimeout(window._shDeb); window._shDeb = setTimeout(_updatePreview, 300); });
    setTimeout(_updatePreview, 100);
  };

  function _updatePreview() {
    const r = document.getElementById('sh-result');
    if (!r) return;
    const p = _params();
    const plateW = p.toolWidth + p.wallThickness * 4 + 20;
    const scale = Math.min(3, 220 / Math.max(plateW, p.mountHeight));
    const pw = plateW * scale, ph = p.mountHeight * scale;
    const lh = p.lipHeight * scale;
    r.innerHTML = `
      <div style="display:flex;gap:6px;flex-wrap:wrap;justify-content:center">
        <button class="form-btn form-btn-sm" data-ripple onclick="window._shPreview3D()" style="background:var(--accent-cyan);color:#fff">🧊 3D Preview</button>
        <button class="form-btn form-btn-sm" data-ripple onclick="window._shDownload()" style="background:var(--accent-green);color:#fff">📥 Download 3MF</button>
      </div>
      <div style="font-size:0.7rem;color:var(--text-muted);margin:4px 0">Holds ${p.toolWidth}×${p.toolThickness}mm blade · ${p.mountHeight}mm tall</div>
      <svg width="${pw+40}" height="${ph+20}" viewBox="-10 -10 ${pw+40} ${ph+20}">
        <rect x="0" y="0" width="${pw}" height="${ph}" fill="#8a7a66" stroke="#4a4030" stroke-width="1"/>
        <rect x="${pw*0.2}" y="${ph - lh}" width="${pw*0.6}" height="${lh}" fill="#c0aa88" stroke="#4a4030" stroke-width="0.8"/>
        <rect x="${pw*0.3}" y="${ph - lh - ph*0.08}" width="${pw*0.4}" height="${ph*0.04}" fill="#c0aa88" stroke="#4a4030" stroke-width="0.6"/>
      </svg>`;
  }

  function _params() {
    const v = id => parseFloat(document.getElementById(id)?.value) || 0;
    return {
      toolWidth: Math.max(15, Math.min(100, v('sh-tw') || 35)),
      toolThickness: Math.max(2, Math.min(15, v('sh-tt') || 4)),
      mountHeight: Math.max(30, Math.min(200, v('sh-mh') || 60)),
      lipHeight: Math.max(5, Math.min(40, v('sh-lh') || 12)),
      wallThickness: Math.max(1.2, Math.min(5, v('sh-wt') || 2)),
    };
  }

  async function _generate() {
    const res = await fetch('/api/model-forge/scraper-holder/generate-3mf', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(_params())
    });
    if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || 'Failed');
    return res.blob();
  }

  window._shDownload = async function() {
    try {
      if (typeof showToast === 'function') showToast('Generating holder...', 'info');
      const blob = await _generate();
      const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
      a.download = 'scraper_holder.3mf';
      a.click(); URL.revokeObjectURL(a.href);
      if (typeof showToast === 'function') showToast('3MF downloaded!', 'success');
    } catch (e) { if (typeof showToast === 'function') showToast(e.message, 'error'); }
  };

  window._shPreview3D = async function() {
    const r = document.getElementById('sh-result');
    if (r) r.innerHTML = '<div style="padding:20px;color:var(--text-muted)">Generating 3D...</div>';
    try {
      const blob = await _generate();
      const file = new File([blob], 'scraper_holder.3mf', { type: 'application/octet-stream' });
      if (typeof window._g3dHandleFile === 'function') window._g3dHandleFile(file);
      else if (typeof window.open3mfViewer === 'function') window.open3mfViewer(URL.createObjectURL(blob), 'Scraper Holder');
      const obs = new MutationObserver(() => { if (!document.getElementById('_global-3d-overlay')) { obs.disconnect(); _updatePreview(); } });
      obs.observe(document.body, { childList: true, subtree: true });
    } catch (e) { if (r) r.innerHTML = '<div style="padding:20px;color:var(--accent-red)">' + e.message + '</div>'; }
  };

  function _rf(label, id, min, max, val, step) {
    return `<div style="margin-bottom:5px"><div style="display:flex;align-items:center;justify-content:space-between"><label style="font-size:0.7rem;color:var(--text-muted)">${label}</label><input type="number" class="form-input" id="${id}" value="${val}" min="${min}" max="${max}" step="${step}" style="width:50px;font-size:0.75rem;padding:2px 4px;text-align:center;border-radius:4px" oninput="const s=this.parentElement.nextElementSibling;if(s)s.value=this.value"></div><input type="range" min="${min}" max="${max}" value="${val}" step="${step}" style="width:100%;accent-color:var(--accent-blue);margin-top:2px" oninput="const n=this.previousElementSibling.querySelector('input[type=number]');if(n)n.value=this.value"></div>`;
  }
})();
