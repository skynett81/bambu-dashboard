// Model Forge — Wall Plate
(function() {
  'use strict';
  window.loadForgeWallPlate = function() {
    const v = id => parseFloat(document.getElementById(id)?.value) || 0;
    const c = id => !!document.getElementById(id)?.checked;
    window.ForgeCommon.buildTool({
      title: 'Wall Plate', icon: '⬜',
      endpoint: '/api/model-forge/wall-plate/generate-3mf',
      downloadName: 'wall_plate',
      helpText: 'Blank wall plate with 4 corner screw holes. Default 86×86mm matches EU standard. Optional rectangular cutout.',
      fields: [
        { type: 'num', label: 'Width (mm)',    id: 'wp-w', min: 30, max: 200, val: 86, step: 1 },
        { type: 'num', label: 'Height (mm)',   id: 'wp-h', min: 30, max: 200, val: 86, step: 1 },
        { type: 'num', label: 'Thickness (mm)',id: 'wp-t', min: 2,  max: 10,  val: 3,  step: 0.2 },
        { type: 'num', label: 'Screw spacing (mm)', id: 'wp-ss', min: 20, max: 150, val: 60, step: 1 },
        { type: 'num', label: 'Screw ⌀/2 (mm)',id: 'wp-sr', min: 1, max: 5, val: 1.8, step: 0.1 },
        { type: 'bool',label: 'Center cutout', id: 'wp-co', val: false },
        { type: 'num', label: 'Cutout width',  id: 'wp-cw', min: 5, max: 150, val: 40, step: 1 },
        { type: 'num', label: 'Cutout height', id: 'wp-ch', min: 5, max: 150, val: 20, step: 1 },
      ],
      getParams: () => ({
        width: v('wp-w'), height: v('wp-h'), thickness: v('wp-t'),
        screwSpacing: v('wp-ss'), screwHoleRadius: v('wp-sr'),
        cutout: c('wp-co'), cutoutWidth: v('wp-cw'), cutoutHeight: v('wp-ch'),
      }),
      renderPreview: (p) => {
        const s = Math.min(3, 220 / Math.max(p.width, p.height));
        const w = p.width * s, h = p.height * s, off = p.screwSpacing * s / 2;
        return `<div style="font-size:0.7rem;color:var(--text-muted);margin:4px 0">${p.width}×${p.height}×${p.thickness}mm${p.cutout ? ' · cutout '+p.cutoutWidth+'×'+p.cutoutHeight+'mm' : ''}</div>
        <svg width="${w+20}" height="${h+20}" viewBox="-10 -10 ${w+20} ${h+20}">
          <rect x="0" y="0" width="${w}" height="${h}" fill="#e0e0e8" stroke="#6a6a78" stroke-width="1.5"/>
          <circle cx="${w/2 - off}" cy="${h/2 - off}" r="${p.screwHoleRadius*s}" fill="#2a2a35"/>
          <circle cx="${w/2 + off}" cy="${h/2 - off}" r="${p.screwHoleRadius*s}" fill="#2a2a35"/>
          <circle cx="${w/2 - off}" cy="${h/2 + off}" r="${p.screwHoleRadius*s}" fill="#2a2a35"/>
          <circle cx="${w/2 + off}" cy="${h/2 + off}" r="${p.screwHoleRadius*s}" fill="#2a2a35"/>
          ${p.cutout ? `<rect x="${w/2 - p.cutoutWidth*s/2}" y="${h/2 - p.cutoutHeight*s/2}" width="${p.cutoutWidth*s}" height="${p.cutoutHeight*s}" fill="#2a2a35"/>` : ''}
        </svg>`;
      }
    });
  };
})();
