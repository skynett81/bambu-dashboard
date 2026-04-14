// Model Forge — Headphone Stand
(function() {
  'use strict';
  window.loadForgeHeadphoneStand = function() {
    const v = id => parseFloat(document.getElementById(id)?.value) || 0;
    window.ForgeCommon.buildTool({
      title: 'Headphone Stand', icon: '🎧',
      endpoint: '/api/model-forge/headphone-stand/generate-3mf',
      downloadName: 'headphone_stand',
      helpText: 'T-shaped desktop headphone stand with round cross-bar at the top. Print on its side to avoid long overhangs.',
      fields: [
        { type: 'num', label: 'Base width (mm)',     id: 'hp-bw', min: 50,  max: 200, val: 100, step: 2 },
        { type: 'num', label: 'Base depth (mm)',     id: 'hp-bd', min: 50,  max: 200, val: 100, step: 2 },
        { type: 'num', label: 'Base height (mm)',    id: 'hp-bh', min: 3,   max: 20,  val: 6,   step: 0.5 },
        { type: 'num', label: 'Column height (mm)',  id: 'hp-ch', min: 100, max: 400, val: 220, step: 5 },
        { type: 'num', label: 'Column thickness (mm)',id: 'hp-ct',min: 8,   max: 30,  val: 12,  step: 0.5 },
        { type: 'num', label: 'Yoke length (mm)',    id: 'hp-yl', min: 40,  max: 150, val: 80,  step: 2 },
        { type: 'num', label: 'Yoke radius (mm)',    id: 'hp-yr', min: 4,   max: 15,  val: 8,   step: 0.5 },
      ],
      getParams: () => ({
        baseWidth: v('hp-bw'), baseDepth: v('hp-bd'), baseHeight: v('hp-bh'),
        columnHeight: v('hp-ch'), columnThickness: v('hp-ct'),
        yokeLength: v('hp-yl'), yokeRadius: v('hp-yr'),
      }),
      renderPreview: (p) => {
        const s = Math.min(1.4, 260 / (p.columnHeight + p.baseHeight + p.yokeRadius*2));
        const bw = p.baseWidth * s, bh = p.baseHeight * s, ct = p.columnThickness * s;
        const ch = p.columnHeight * s, yl = p.yokeLength * s, yr = p.yokeRadius * s;
        return `<div style="font-size:0.7rem;color:var(--text-muted);margin:4px 0">${p.baseWidth}×${p.baseDepth}mm base · ${p.columnHeight}mm column · ${p.yokeLength}mm yoke</div>
        <svg width="${bw+40}" height="${ch+bh+yr*2+20}" viewBox="-10 -10 ${bw+40} ${ch+bh+yr*2+20}">
          <rect x="${bw/2 - ct/2}" y="${yr*2}" width="${ct}" height="${ch}" fill="#3a4a6a" stroke="#0a1020"/>
          <rect x="0" y="${yr*2+ch}" width="${bw}" height="${bh}" fill="#3a4a6a" stroke="#0a1020"/>
          <rect x="${bw/2 - yl/2}" y="0" width="${yl}" height="${yr*2}" rx="${yr}" fill="#5a6a8a" stroke="#0a1020"/>
        </svg>`;
      }
    });
  };
})();
