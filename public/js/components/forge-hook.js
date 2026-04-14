// Model Forge — Wall Hook
(function() {
  'use strict';
  window.loadForgeHook = function() {
    const el = document.getElementById('overlay-panel-body');
    if (!el) return;
    el.innerHTML = `<style>.hk-layout{display:grid;grid-template-columns:360px 1fr;gap:12px;min-height:500px}.hk-form{background:var(--bg-secondary);border:1px solid var(--border-color);border-radius:10px;padding:12px}.hk-preview{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;background:var(--bg-secondary);border:1px solid var(--border-color);border-radius:10px;padding:16px;min-height:400px}@media(max-width:900px){.hk-layout{grid-template-columns:1fr}}</style>
    <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px"><button class="form-btn form-btn-sm" onclick="window.loadModelForgePanel()" style="padding:4px 10px">← Back</button><h4 style="margin:0;font-size:1rem">🪝 Wall Hook</h4></div>
    <div class="hk-layout"><div><div class="hk-form" id="hk-form">${_rf('Plate height (mm)','hk-ph',20,200,60,2)}${_rf('Plate width (mm)','hk-pw',15,80,25,1)}${_rf('Plate thickness (mm)','hk-pt',2,10,4,0.5)}${_rf('Peg length (mm)','hk-pl',15,120,40,1)}${_rf('Peg radius (mm)','hk-pr',2,12,4,0.2)}${_rf('Screw hole radius (mm)','hk-sr',1,6,2.2,0.1)}</div></div><div class="hk-preview" id="hk-result"><div style="color:var(--text-muted);font-size:0.85rem">Configure and generate</div></div></div>`;
    const form = document.getElementById('hk-form');
    if (form) form.addEventListener('input', () => { clearTimeout(window._hkD); window._hkD = setTimeout(_up, 300); });
    setTimeout(_up, 100);
  };
  function _up() {
    const r = document.getElementById('hk-result');
    if (!r) return;
    const p = _params();
    const s = Math.min(3, 220 / Math.max(p.plateHeight, p.pegLength));
    r.innerHTML = `<div style="display:flex;gap:6px;flex-wrap:wrap;justify-content:center"><button class="form-btn form-btn-sm" data-ripple onclick="window._hk3D()" style="background:var(--accent-cyan);color:#fff">🧊 3D Preview</button><button class="form-btn form-btn-sm" data-ripple onclick="window._hkDl()" style="background:var(--accent-green);color:#fff">📥 Download 3MF</button></div><div style="font-size:0.7rem;color:var(--text-muted);margin:4px 0">${p.plateWidth}×${p.plateHeight}mm plate · ⌀${p.pegRadius*2}mm peg × ${p.pegLength}mm</div><svg width="${p.plateWidth*s+p.pegLength*s+40}" height="${p.plateHeight*s+20}" viewBox="-10 -10 ${p.plateWidth*s+p.pegLength*s+40} ${p.plateHeight*s+20}"><rect x="0" y="0" width="${p.plateWidth*s}" height="${p.plateHeight*s}" fill="#a08c6a" stroke="#4a3a20"/><circle cx="${p.plateWidth*s/2}" cy="${p.plateHeight*s*0.18}" r="${p.screwHoleRadius*s}" fill="#2a1a00"/><circle cx="${p.plateWidth*s/2}" cy="${p.plateHeight*s*0.82}" r="${p.screwHoleRadius*s}" fill="#2a1a00"/><rect x="${p.plateWidth*s}" y="${p.plateHeight*s*0.55 - p.pegRadius*s}" width="${p.pegLength*s}" height="${p.pegRadius*s*2}" fill="#a08c6a" stroke="#4a3a20"/></svg>`;
  }
  function _params() {
    const v = id => parseFloat(document.getElementById(id)?.value) || 0;
    return {
      plateHeight: v('hk-ph') || 60, plateWidth: v('hk-pw') || 25, plateThickness: v('hk-pt') || 4,
      pegLength: v('hk-pl') || 40, pegRadius: v('hk-pr') || 4, screwHoleRadius: v('hk-sr') || 2.2,
    };
  }
  async function _gen() {
    const res = await fetch('/api/model-forge/hook/generate-3mf', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(_params()) });
    if (!res.ok) throw new Error((await res.json().catch(()=>({}))).error || 'Failed');
    return res.blob();
  }
  window._hkDl = async function() {
    try { if (typeof showToast === 'function') showToast('Generating hook...', 'info');
      const b = await _gen(); const a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = 'wall_hook.3mf'; a.click(); URL.revokeObjectURL(a.href);
      if (typeof showToast === 'function') showToast('Downloaded!', 'success');
    } catch(e) { if (typeof showToast === 'function') showToast(e.message, 'error'); }
  };
  window._hk3D = async function() {
    const r = document.getElementById('hk-result');
    if (r) r.innerHTML = '<div style="padding:20px;color:var(--text-muted)">Generating 3D...</div>';
    try {
      const b = await _gen();
      const f = new File([b], 'hook.3mf', { type: 'application/octet-stream' });
      if (typeof window._g3dHandleFile === 'function') window._g3dHandleFile(f);
      else if (typeof window.open3mfViewer === 'function') window.open3mfViewer(URL.createObjectURL(b), 'Hook');
      const obs = new MutationObserver(() => { if (!document.getElementById('_global-3d-overlay')) { obs.disconnect(); _up(); } });
      obs.observe(document.body, { childList: true, subtree: true });
    } catch(e) { if (r) r.innerHTML = '<div style="padding:20px;color:var(--accent-red)">' + e.message + '</div>'; }
  };
  function _rf(l,i,mn,mx,v,s){return `<div style="margin-bottom:5px"><div style="display:flex;align-items:center;justify-content:space-between"><label style="font-size:0.7rem;color:var(--text-muted)">${l}</label><input type="number" class="form-input" id="${i}" value="${v}" min="${mn}" max="${mx}" step="${s}" style="width:50px;font-size:0.75rem;padding:2px 4px;text-align:center;border-radius:4px" oninput="const x=this.parentElement.nextElementSibling;if(x)x.value=this.value"></div><input type="range" min="${mn}" max="${mx}" value="${v}" step="${s}" style="width:100%;accent-color:var(--accent-blue);margin-top:2px" oninput="const x=this.previousElementSibling.querySelector('input[type=number]');if(x)x.value=this.value"></div>`;}
})();
