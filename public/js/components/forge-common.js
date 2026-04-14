// Model Forge — shared UI helpers for compact tool panels
// Each tool calls window.ForgeCommon.buildTool(config) with:
//   title, icon, endpoint, downloadName, params: [{label, id, min, max, val, step, type}], buildParams(fn)
(function() {
  'use strict';

  function rangeField(label, id, min, max, val, step) {
    return `<div style="margin-bottom:5px"><div style="display:flex;align-items:center;justify-content:space-between"><label style="font-size:0.7rem;color:var(--text-muted)">${label}</label><input type="number" class="form-input" id="${id}" value="${val}" min="${min}" max="${max}" step="${step}" style="width:50px;font-size:0.75rem;padding:2px 4px;text-align:center;border-radius:4px" oninput="const s=this.parentElement.nextElementSibling;if(s)s.value=this.value"></div><input type="range" min="${min}" max="${max}" value="${val}" step="${step}" style="width:100%;accent-color:var(--accent-blue);margin-top:2px" oninput="const n=this.previousElementSibling.querySelector('input[type=number]');if(n)n.value=this.value"></div>`;
  }

  function boolField(label, id, checked) {
    return `<label style="font-size:0.8rem;cursor:pointer;display:flex;align-items:center;gap:6px;margin:6px 0"><input type="checkbox" id="${id}"${checked ? ' checked' : ''}> ${label}</label>`;
  }

  /**
   * Build a minimal tool panel with form + download/preview actions.
   * @param {object} cfg
   * @param {string} cfg.title
   * @param {string} cfg.icon
   * @param {string} cfg.endpoint - POST URL
   * @param {string} cfg.downloadName - filename base (no extension)
   * @param {Array<{type:'num'|'bool', label:string, id:string, min?:number, max?:number, val:any, step?:number}>} cfg.fields
   * @param {function():object} cfg.getParams - build params object from DOM
   * @param {function(object):string=} cfg.renderPreview - optional SVG/HTML preview
   * @param {string=} cfg.helpText
   */
  function buildTool(cfg) {
    const el = document.getElementById('overlay-panel-body');
    if (!el) return;
    const fields = cfg.fields.map(f => {
      if (f.type === 'bool') return boolField(f.label, f.id, f.val);
      return rangeField(f.label, f.id, f.min, f.max, f.val, f.step ?? 1);
    }).join('');
    const help = cfg.helpText ? `<div style="margin-top:12px;padding:8px;background:var(--bg-tertiary);border-radius:6px;font-size:0.7rem;color:var(--text-muted);line-height:1.4">${cfg.helpText}</div>` : '';

    el.innerHTML = `<style>
      .fc-layout { display:grid; grid-template-columns:360px 1fr; gap:12px; min-height:500px; }
      .fc-sidebar { overflow-y:auto; max-height:calc(100vh - 180px); padding-right:4px; }
      .fc-form { background:var(--bg-secondary); border:1px solid var(--border-color); border-radius:10px; padding:12px; }
      .fc-preview { display:flex; flex-direction:column; align-items:center; justify-content:center; gap:10px; background:var(--bg-secondary); border:1px solid var(--border-color); border-radius:10px; padding:16px; min-height:400px; }
      @media (max-width:900px) { .fc-layout { grid-template-columns:1fr; } }
    </style>
    <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px">
      <button class="form-btn form-btn-sm" onclick="window.loadModelForgePanel()" style="padding:4px 10px">← Back</button>
      <h4 style="margin:0;font-size:1rem">${cfg.icon} ${cfg.title}</h4>
    </div>
    <div class="fc-layout">
      <div class="fc-sidebar"><div class="fc-form" id="fc-form">${fields}${help}</div></div>
      <div class="fc-preview" id="fc-result"><div style="color:var(--text-muted);font-size:0.85rem">Configure and generate</div></div>
    </div>`;

    const updatePreview = () => {
      const r = document.getElementById('fc-result');
      if (!r) return;
      const p = cfg.getParams();
      const svg = cfg.renderPreview ? cfg.renderPreview(p) : '';
      r.innerHTML = `
        <div style="display:flex;gap:6px;flex-wrap:wrap;justify-content:center">
          <button class="form-btn form-btn-sm" data-ripple id="fc-btn-3d" style="background:var(--accent-cyan);color:#fff">🧊 3D Preview</button>
          <button class="form-btn form-btn-sm" data-ripple id="fc-btn-dl" style="background:var(--accent-green);color:#fff">📥 Download 3MF</button>
        </div>
        ${svg}`;
      document.getElementById('fc-btn-dl').onclick = async () => {
        try {
          if (typeof showToast === 'function') showToast('Generating...', 'info');
          const blob = await _fetchBlob(cfg.endpoint, cfg.getParams());
          const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
          a.download = cfg.downloadName + '.3mf';
          a.click(); URL.revokeObjectURL(a.href);
          if (typeof showToast === 'function') showToast('Downloaded!', 'success');
        } catch (e) { if (typeof showToast === 'function') showToast(e.message, 'error'); }
      };
      document.getElementById('fc-btn-3d').onclick = async () => {
        const rEl = document.getElementById('fc-result');
        if (rEl) rEl.innerHTML = '<div style="padding:20px;color:var(--text-muted)">Generating 3D...</div>';
        try {
          const blob = await _fetchBlob(cfg.endpoint, cfg.getParams());
          const file = new File([blob], cfg.downloadName + '.3mf', { type: 'application/octet-stream' });
          if (typeof window._g3dHandleFile === 'function') window._g3dHandleFile(file);
          else if (typeof window.open3mfViewer === 'function') window.open3mfViewer(URL.createObjectURL(blob), cfg.title);
          const obs = new MutationObserver(() => { if (!document.getElementById('_global-3d-overlay')) { obs.disconnect(); updatePreview(); } });
          obs.observe(document.body, { childList: true, subtree: true });
        } catch (e) {
          const rEl2 = document.getElementById('fc-result');
          if (rEl2) rEl2.innerHTML = '<div style="padding:20px;color:var(--accent-red)">' + e.message + '</div>';
        }
      };
    };

    const form = document.getElementById('fc-form');
    if (form) {
      form.addEventListener('input', () => { clearTimeout(window._fcDebounce); window._fcDebounce = setTimeout(updatePreview, 300); });
      form.addEventListener('change', updatePreview);
    }
    setTimeout(updatePreview, 100);
  }

  async function _fetchBlob(endpoint, params) {
    const res = await fetch(endpoint, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(params)
    });
    if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || 'Failed');
    return res.blob();
  }

  window.ForgeCommon = { buildTool, rangeField, boolField };
})();
