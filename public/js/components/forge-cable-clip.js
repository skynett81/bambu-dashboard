// Model Forge — Cable Clip
(function() {
  'use strict';
  window.loadForgeCableClip = function() {
    const numVal = id => parseFloat(document.getElementById(id)?.value) || 0;
    window.ForgeCommon.buildTool({
      title: 'Cable Clip', icon: '📎',
      endpoint: '/api/model-forge/cable-clip/generate-3mf',
      downloadName: 'cable_clip',
      helpText: 'A snap-on C-clip for routing cables along a surface. Print in PETG or TPU for springy fit.',
      fields: [
        { type: 'num', label: 'Cable ⌀ (mm)',    id: 'cc-cd', min: 1,   max: 30, val: 6,   step: 0.5 },
        { type: 'num', label: 'Clip length (mm)',id: 'cc-ln', min: 4,   max: 40, val: 10,  step: 0.5 },
        { type: 'num', label: 'Wall thickness (mm)', id: 'cc-wt', min: 1, max: 4, val: 1.8, step: 0.1 },
        { type: 'num', label: 'Base ears (mm)',  id: 'cc-be', min: 2,   max: 20, val: 6,   step: 0.5 },
      ],
      getParams: () => ({
        cableDiameter: numVal('cc-cd'),
        clipLength: numVal('cc-ln'),
        wallThickness: numVal('cc-wt'),
        baseExtra: numVal('cc-be'),
      }),
      renderPreview: (p) => {
        const s = 6;
        const totalW = (p.cableDiameter + p.wallThickness*2 + p.baseExtra*2) * s;
        const totalH = (p.cableDiameter + p.wallThickness*2) * s;
        const cd = p.cableDiameter * s;
        return `<div style="font-size:0.7rem;color:var(--text-muted);margin:4px 0">For ⌀${p.cableDiameter}mm cable · ${p.clipLength}mm long</div>
        <svg width="${totalW+20}" height="${totalH+20}" viewBox="-10 -10 ${totalW+20} ${totalH+20}">
          <rect x="0" y="${totalH-p.wallThickness*s}" width="${totalW}" height="${p.wallThickness*s}" fill="#b0b0c0" stroke="#50505a"/>
          <rect x="${p.baseExtra*s}" y="${p.wallThickness*s}" width="${p.wallThickness*s}" height="${cd}" fill="#b0b0c0" stroke="#50505a"/>
          <rect x="${(p.baseExtra + p.wallThickness)*s + cd}" y="${p.wallThickness*s}" width="${p.wallThickness*s}" height="${cd}" fill="#b0b0c0" stroke="#50505a"/>
          <rect x="${p.baseExtra*s - 4}" y="0" width="${cd + p.wallThickness*s*2 + 8}" height="${p.wallThickness*s}" fill="#b0b0c0" stroke="#50505a"/>
        </svg>`;
      }
    });
  };
})();
