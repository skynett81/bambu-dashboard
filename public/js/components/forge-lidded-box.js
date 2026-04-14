// Model Forge — Lidded Box
(function() {
  'use strict';
  window.loadForgeLiddedBox = function() {
    const v = id => parseFloat(document.getElementById(id)?.value) || 0;
    window.ForgeCommon.buildTool({
      title: 'Lidded Box', icon: '📦',
      endpoint: '/api/model-forge/lidded-box/generate-3mf',
      downloadName: 'lidded_box',
      helpText: 'Box body + friction-fit lid placed side-by-side for a single print. Tweak clearance for a looser or tighter fit.',
      fields: [
        { type: 'num', label: 'Width (mm)',   id: 'lb-w', min: 20, max: 300, val: 80, step: 2 },
        { type: 'num', label: 'Depth (mm)',   id: 'lb-d', min: 20, max: 300, val: 60, step: 2 },
        { type: 'num', label: 'Height (mm)',  id: 'lb-h', min: 10, max: 200, val: 40, step: 2 },
        { type: 'num', label: 'Wall (mm)',    id: 'lb-wt',min: 1,  max: 4,   val: 1.6,step: 0.1 },
        { type: 'num', label: 'Floor (mm)',   id: 'lb-ft',min: 1,  max: 4,   val: 1.6,step: 0.1 },
        { type: 'num', label: 'Lid skirt depth (mm)', id: 'lb-sk', min: 1.5, max: 8, val: 3, step: 0.2 },
        { type: 'num', label: 'Lid clearance (mm)',   id: 'lb-tol',min: 0.15,max: 0.8, val: 0.35, step: 0.05 },
      ],
      getParams: () => ({
        width: v('lb-w'), depth: v('lb-d'), height: v('lb-h'),
        wallThickness: v('lb-wt'), floorThickness: v('lb-ft'),
        lidSkirtDepth: v('lb-sk'), lidTolerance: v('lb-tol'),
      }),
      renderPreview: (p) => {
        const s = Math.min(3, 220 / (p.width * 2 + 10));
        const w = p.width * s, d = p.depth * s, h = p.height * s;
        return `<div style="font-size:0.7rem;color:var(--text-muted);margin:4px 0">Box ${p.width}×${p.depth}×${p.height}mm + lid</div>
        <div style="display:flex;gap:${5*s}px;perspective:400px">
          <div style="width:${w}px;height:${d+h}px;position:relative;transform:rotateX(18deg)">
            <div style="position:absolute;bottom:0;width:${w}px;height:${d}px;background:#5a789c;border:2px solid #2a3d58;border-radius:3px"></div>
            <div style="position:absolute;bottom:${d-2}px;width:${w}px;height:${h}px;background:linear-gradient(180deg,#7a98bc,#5a789c);border:2px solid #2a3d58;border-bottom:none;border-radius:3px 3px 0 0"></div>
          </div>
          <div style="width:${w}px;height:${d}px;background:linear-gradient(145deg,#8aa8cc,#5a789c);border:2px solid #2a3d58;border-radius:3px;align-self:flex-end"></div>
        </div>`;
      }
    });
  };
})();
