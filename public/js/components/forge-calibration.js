// Model Forge — Calibration & Utility Tools (8 tools in one panel)
(function() {
  'use strict';

  const TOOLS = [
    { id: 'tolerance-test', name: 'Tolerance Test', icon: '📏', desc: 'Test dimensional accuracy with pins and holes', fields: [
      { id: 'width', label: 'Width (mm)', type: 'number', value: 80, min: 40, max: 200 },
      { id: 'depth', label: 'Depth (mm)', type: 'number', value: 60, min: 30, max: 150 },
      { id: 'pinHeight', label: 'Pin height (mm)', type: 'number', value: 10, min: 5, max: 30 },
    ]},
    { id: 'bed-level', name: 'Bed Level Test', icon: '🔲', desc: 'First-layer squares at corners + center', fields: [
      { id: 'bedWidth', label: 'Bed width (mm)', type: 'number', value: 220, min: 100, max: 500 },
      { id: 'bedDepth', label: 'Bed depth (mm)', type: 'number', value: 220, min: 100, max: 500 },
      { id: 'squareSize', label: 'Square size (mm)', type: 'number', value: 30, min: 10, max: 60 },
    ]},
    { id: 'temp-tower', name: 'Temperature Tower', icon: '🌡️', desc: 'Stacked blocks for finding optimal temp', fields: [
      { id: 'startTemp', label: 'Start temp (°C)', type: 'number', value: 230, min: 180, max: 300 },
      { id: 'endTemp', label: 'End temp (°C)', type: 'number', value: 190, min: 170, max: 280 },
      { id: 'step', label: 'Step (°C)', type: 'number', value: 5, min: 2, max: 10 },
    ]},
    { id: 'retraction-test', name: 'Retraction Test', icon: '🧵', desc: 'Thin pillars to test stringing', fields: [
      { id: 'height', label: 'Height (mm)', type: 'number', value: 50, min: 20, max: 100 },
      { id: 'pillars', label: 'Pillar count', type: 'number', value: 4, min: 2, max: 8 },
      { id: 'spacing', label: 'Spacing (mm)', type: 'number', value: 25, min: 15, max: 50 },
    ]},
    { id: 'vase', name: 'Vase Generator', icon: '🏺', desc: 'Single-wall vase for vase mode printing', fields: [
      { id: 'height', label: 'Height (mm)', type: 'number', value: 80, min: 20, max: 200 },
      { id: 'diameter', label: 'Diameter (mm)', type: 'number', value: 60, min: 20, max: 150 },
      { id: 'wallThickness', label: 'Wall (mm)', type: 'number', value: 1.2, min: 0.4, max: 3, step: 0.2 },
    ]},
    { id: 'qr-block', name: 'QR Code Block', icon: '📱', desc: 'Standalone 3D QR code', fields: [
      { id: 'data', label: 'QR data (URL/text)', type: 'text', value: 'https://3dprintforge.local' },
      { id: 'size', label: 'Size (mm)', type: 'number', value: 50, min: 20, max: 100 },
      { id: 'qrHeight', label: 'QR height (mm)', type: 'number', value: 1, min: 0.4, max: 3, step: 0.2 },
    ]},
    { id: 'custom-shape', name: 'Custom Shape', icon: '🔷', desc: 'Parametric box, cylinder, or tube', fields: [
      { id: 'shape', label: 'Shape', type: 'select', value: 'box', options: ['box', 'cylinder', 'tube'] },
      { id: 'width', label: 'Width/Diameter (mm)', type: 'number', value: 30, min: 5, max: 200 },
      { id: 'height', label: 'Height (mm)', type: 'number', value: 20, min: 2, max: 200 },
      { id: 'wallThickness', label: 'Wall (mm, 0=solid)', type: 'number', value: 0, min: 0, max: 10, step: 0.4 },
    ]},
    { id: 'thread', name: 'Thread/Bolt', icon: '🔩', desc: 'Metric bolt or nut (M3-M10)', fields: [
      { id: 'type', label: 'Type', type: 'select', value: 'bolt', options: ['bolt', 'nut'] },
      { id: 'diameter', label: 'Diameter (mm)', type: 'select', value: '6', options: ['3', '4', '5', '6', '8', '10'] },
      { id: 'length', label: 'Length (mm)', type: 'number', value: 20, min: 5, max: 60 },
    ]},
  ];

  let _activeTool = null;

  window.loadForgeCalibration = function() {
    const el = document.getElementById('overlay-panel-body');
    if (!el) return;

    el.innerHTML = `<style>
      .cal-layout { display:grid; grid-template-columns:280px 1fr; gap:12px; min-height:400px; }
      .cal-tools { display:flex; flex-direction:column; gap:4px; overflow-y:auto; max-height:calc(100vh - 200px); }
      .cal-tool-btn { display:flex; align-items:center; gap:8px; padding:8px 12px; background:var(--bg-secondary); border:1px solid var(--border-color); border-radius:8px; cursor:pointer; transition:all 0.15s; text-align:left; }
      .cal-tool-btn:hover { border-color:var(--accent-blue); }
      .cal-tool-btn.active { border-color:var(--accent-green); background:color-mix(in srgb, var(--accent-green) 10%, var(--bg-secondary)); }
      .cal-preview { display:flex; flex-direction:column; align-items:center; justify-content:center; gap:10px; background:var(--bg-secondary); border:1px solid var(--border-color); border-radius:10px; padding:16px; min-height:300px; }
      @media (max-width:700px) { .cal-layout { grid-template-columns:1fr; } }
    </style>
    <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px">
      <button class="form-btn form-btn-sm" onclick="window.loadModelForgePanel()" style="padding:4px 10px">← Back</button>
      <h4 style="margin:0;font-size:1rem">🔧 Calibration & Utility Tools</h4>
    </div>
    <div class="cal-layout">
      <div class="cal-tools">
        ${TOOLS.map(t => `<div class="cal-tool-btn${_activeTool === t.id ? ' active' : ''}" onclick="window._calSelect('${t.id}')">
          <span style="font-size:1.2rem">${t.icon}</span>
          <div><div style="font-size:0.82rem;font-weight:600">${t.name}</div><div style="font-size:0.65rem;color:var(--text-muted)">${t.desc}</div></div>
        </div>`).join('')}
      </div>
      <div class="cal-preview" id="cal-result">
        <div style="color:var(--text-muted)">Select a tool to get started</div>
      </div>
    </div>`;
  };

  window._calSelect = function(id) {
    _activeTool = id;
    const tool = TOOLS.find(t => t.id === id);
    if (!tool) return;

    // Highlight active
    document.querySelectorAll('.cal-tool-btn').forEach(b => b.classList.toggle('active', b.onclick.toString().includes(id)));

    const r = document.getElementById('cal-result');
    if (!r) return;

    let fieldsHtml = '';
    for (const f of tool.fields) {
      if (f.type === 'select') {
        fieldsHtml += `<div style="margin-bottom:6px"><label style="font-size:0.72rem;color:var(--text-muted)">${f.label}</label><select class="form-input cal-field" id="cal-${f.id}" style="font-size:0.82rem">${f.options.map(o => `<option value="${o}"${o == f.value ? ' selected' : ''}>${o}</option>`).join('')}</select></div>`;
      } else if (f.type === 'text') {
        fieldsHtml += `<div style="margin-bottom:6px"><label style="font-size:0.72rem;color:var(--text-muted)">${f.label}</label><input type="text" class="form-input cal-field" id="cal-${f.id}" value="${f.value}" style="font-size:0.82rem"></div>`;
      } else {
        fieldsHtml += `<div style="margin-bottom:6px"><label style="font-size:0.72rem;color:var(--text-muted)">${f.label}</label><input type="number" class="form-input cal-field" id="cal-${f.id}" value="${f.value}" min="${f.min || 0}" max="${f.max || 999}" step="${f.step || 1}" style="font-size:0.82rem"></div>`;
      }
    }

    r.innerHTML = `
      <div style="text-align:center;margin-bottom:10px">
        <span style="font-size:2rem">${tool.icon}</span>
        <div style="font-size:1rem;font-weight:700;margin-top:4px">${tool.name}</div>
        <div style="font-size:0.78rem;color:var(--text-muted)">${tool.desc}</div>
      </div>
      <div style="width:100%;max-width:300px">${fieldsHtml}</div>
      <div style="display:flex;gap:6px;margin-top:8px">
        <button class="form-btn form-btn-sm" data-ripple onclick="window._calGenerate('${id}')" style="background:var(--accent-cyan);color:#fff">🧊 3D Preview</button>
        <button class="form-btn form-btn-sm" data-ripple onclick="window._calDownload('${id}')" style="background:var(--accent-green);color:#fff">📥 Download 3MF</button>
      </div>`;
  };

  function _getParams(toolId) {
    const tool = TOOLS.find(t => t.id === toolId);
    if (!tool) return {};
    const params = {};
    for (const f of tool.fields) {
      const el = document.getElementById('cal-' + f.id);
      if (!el) continue;
      params[f.id] = f.type === 'number' ? parseFloat(el.value) || f.value : el.value;
    }
    return params;
  }

  window._calGenerate = async function(id) {
    const r = document.getElementById('cal-result');
    try {
      const res = await fetch(`/api/model-forge/${id}/generate-3mf`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(_getParams(id))
      });
      if (!res.ok) throw new Error('Generation failed');
      const blob = await res.blob();
      if (typeof window._g3dHandleFile === 'function') window._g3dHandleFile(new File([blob], id + '.3mf'));
      else if (typeof window.open3mfViewer === 'function') window.open3mfViewer(URL.createObjectURL(blob), TOOLS.find(t => t.id === id)?.name || id);
      const obs = new MutationObserver(() => { if (!document.getElementById('_global-3d-overlay')) { obs.disconnect(); window._calSelect(id); } });
      obs.observe(document.body, { childList: true, subtree: true });
    } catch (e) { if (typeof showToast === 'function') showToast(e.message, 'error'); }
  };

  window._calDownload = async function(id) {
    try {
      if (typeof showToast === 'function') showToast('Generating...', 'info');
      const res = await fetch(`/api/model-forge/${id}/generate-3mf`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(_getParams(id))
      });
      if (!res.ok) throw new Error('Failed');
      const blob = await res.blob();
      const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
      a.download = id.replace(/-/g, '_') + '.3mf'; a.click(); URL.revokeObjectURL(a.href);
      if (typeof showToast === 'function') showToast('Downloaded!', 'success');
    } catch (e) { if (typeof showToast === 'function') showToast(e.message, 'error'); }
  };
})();
