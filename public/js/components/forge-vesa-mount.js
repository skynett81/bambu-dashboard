// Model Forge — VESA Mount
(function() {
  'use strict';
  window.loadForgeVesaMount = function() {
    const v = id => parseFloat(document.getElementById(id)?.value) || 0;
    window.ForgeCommon.buildTool({
      title: 'VESA Mount Plate', icon: '🖥️',
      endpoint: '/api/model-forge/vesa-mount/generate-3mf',
      downloadName: 'vesa_mount',
      helpText: 'Flat mounting plate with VESA MIS-D bolt pattern (75×75 or 100×100 mm, M4). Optional central cable cutout.',
      fields: [
        { type: 'num', label: 'Plate width (mm)',  id: 'vm-w',  min: 50,  max: 300, val: 120, step: 2 },
        { type: 'num', label: 'Plate height (mm)', id: 'vm-h',  min: 50,  max: 300, val: 120, step: 2 },
        { type: 'num', label: 'Thickness (mm)',    id: 'vm-t',  min: 3,   max: 20,  val: 5,   step: 0.2 },
        { type: 'num', label: 'VESA pattern (mm)', id: 'vm-vs', min: 50,  max: 200, val: 100, step: 25 },
        { type: 'num', label: 'Hole radius (mm)',  id: 'vm-hr', min: 1.5, max: 6,   val: 2.2, step: 0.1 },
        { type: 'num', label: 'Center cable hole radius (mm)', id: 'vm-cr', min: 0, max: 40, val: 0, step: 1 },
      ],
      getParams: () => ({
        width: v('vm-w'), height: v('vm-h'), thickness: v('vm-t'),
        vesaSize: v('vm-vs'), vesaHoleRadius: v('vm-hr'),
        extraHoleRadius: v('vm-cr'),
      }),
      renderPreview: (p) => {
        const s = Math.min(2.5, 260 / Math.max(p.width, p.height));
        const w = p.width * s, h = p.height * s, off = p.vesaSize * s / 2;
        return `<div style="font-size:0.7rem;color:var(--text-muted);margin:4px 0">${p.width}×${p.height}mm · VESA ${p.vesaSize}×${p.vesaSize}</div>
        <svg width="${w+20}" height="${h+20}" viewBox="-10 -10 ${w+20} ${h+20}">
          <rect x="0" y="0" width="${w}" height="${h}" fill="#4a4a55" stroke="#1a1a22" stroke-width="1.5"/>
          <circle cx="${w/2 - off}" cy="${h/2 - off}" r="${p.vesaHoleRadius*s}" fill="#1a1a22"/>
          <circle cx="${w/2 + off}" cy="${h/2 - off}" r="${p.vesaHoleRadius*s}" fill="#1a1a22"/>
          <circle cx="${w/2 - off}" cy="${h/2 + off}" r="${p.vesaHoleRadius*s}" fill="#1a1a22"/>
          <circle cx="${w/2 + off}" cy="${h/2 + off}" r="${p.vesaHoleRadius*s}" fill="#1a1a22"/>
          ${p.extraHoleRadius > 0 ? `<circle cx="${w/2}" cy="${h/2}" r="${p.extraHoleRadius*s}" fill="#1a1a22"/>` : ''}
        </svg>`;
      }
    });
  };
})();
