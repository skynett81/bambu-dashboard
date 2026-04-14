// Model Forge — Wall Bracket
(function() {
  'use strict';
  window.loadForgeWallBracket = function() {
    const v = id => parseFloat(document.getElementById(id)?.value) || 0;
    const c = id => !!document.getElementById(id)?.checked;
    window.ForgeCommon.buildTool({
      title: 'Wall Bracket (L)', icon: '📐',
      endpoint: '/api/model-forge/wall-bracket/generate-3mf',
      downloadName: 'wall_bracket',
      helpText: 'L-shaped mounting bracket with screw holes and optional gusset rib for strength.',
      fields: [
        { type: 'num', label: 'Shelf length (mm)', id: 'wb-sl', min: 20, max: 200, val: 60, step: 2 },
        { type: 'num', label: 'Back height (mm)',  id: 'wb-bh', min: 20, max: 200, val: 80, step: 2 },
        { type: 'num', label: 'Width (mm)',        id: 'wb-w',  min: 15, max: 120, val: 40, step: 2 },
        { type: 'num', label: 'Thickness (mm)',    id: 'wb-t',  min: 3,  max: 10,  val: 4,  step: 0.2 },
        { type: 'num', label: 'Screw ⌀/2 (mm)',    id: 'wb-sr', min: 1,  max: 6,   val: 2.2, step: 0.1 },
        { type: 'bool',label: 'Gusset rib',        id: 'wb-g',  val: true },
      ],
      getParams: () => ({
        shelfLength: v('wb-sl'), backHeight: v('wb-bh'),
        width: v('wb-w'), thickness: v('wb-t'),
        screwHoleRadius: v('wb-sr'), gusset: c('wb-g'),
      }),
      renderPreview: (p) => {
        const s = Math.min(3, 200 / Math.max(p.shelfLength, p.backHeight));
        const bh = p.backHeight * s, sl = p.shelfLength * s, t = p.thickness * s;
        return `<div style="font-size:0.7rem;color:var(--text-muted);margin:4px 0">Shelf ${p.shelfLength}mm · Back ${p.backHeight}mm · ${p.width}mm wide</div>
        <svg width="${sl+t+20}" height="${bh+20}" viewBox="-10 -10 ${sl+t+20} ${bh+20}">
          <rect x="0" y="0" width="${t}" height="${bh}" fill="#8a90a0" stroke="#303540" stroke-width="1.5"/>
          <rect x="${t}" y="${bh-t}" width="${sl}" height="${t}" fill="#8a90a0" stroke="#303540" stroke-width="1.5"/>
          ${p.gusset ? `<polygon points="${t},${bh-t} ${t+sl*0.5},${bh-t} ${t},${bh-t - sl*0.5}" fill="#a5abbd" stroke="#303540" stroke-width="1"/>` : ''}
          <circle cx="${t/2}" cy="${bh*0.2}" r="${p.screwHoleRadius*s}" fill="#202530"/>
          <circle cx="${t/2}" cy="${bh*0.8}" r="${p.screwHoleRadius*s}" fill="#202530"/>
        </svg>`;
      }
    });
  };
})();
