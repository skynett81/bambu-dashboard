// Model Forge — Plant Pot
(function() {
  'use strict';
  window.loadForgePlantPot = function() {
    const v = id => parseFloat(document.getElementById(id)?.value) || 0;
    window.ForgeCommon.buildTool({
      title: 'Plant Pot', icon: '🪴',
      endpoint: '/api/model-forge/plant-pot/generate-3mf',
      downloadName: 'plant_pot',
      helpText: 'Tapered decorative pot. No drain holes in v1 — drill after printing if needed.',
      fields: [
        { type: 'num', label: 'Top ⌀ (mm)',      id: 'pp-td', min: 20,  max: 300, val: 80,  step: 2 },
        { type: 'num', label: 'Bottom ⌀ (mm)',   id: 'pp-bd', min: 15,  max: 280, val: 55,  step: 2 },
        { type: 'num', label: 'Height (mm)',     id: 'pp-h',  min: 20,  max: 300, val: 90,  step: 2 },
        { type: 'num', label: 'Wall thickness (mm)', id: 'pp-w', min: 1.5, max: 6, val: 2.5, step: 0.1 },
      ],
      getParams: () => ({
        topDiameter: v('pp-td'), bottomDiameter: v('pp-bd'),
        height: v('pp-h'), wallThickness: v('pp-w'),
      }),
      renderPreview: (p) => {
        const s = Math.min(3, 200 / Math.max(p.topDiameter, p.height));
        const tw = p.topDiameter * s, bw = p.bottomDiameter * s, h = p.height * s;
        return `<div style="font-size:0.7rem;color:var(--text-muted);margin:4px 0">⌀${p.topDiameter}mm top · ⌀${p.bottomDiameter}mm base · ${p.height}mm tall</div>
        <svg width="${tw+20}" height="${h+20}" viewBox="${-tw/2-10} -10 ${tw+20} ${h+20}">
          <polygon points="${-tw/2},0 ${tw/2},0 ${bw/2},${h} ${-bw/2},${h}" fill="#b87850" stroke="#5a3518" stroke-width="1.5"/>
        </svg>`;
      }
    });
  };
})();
