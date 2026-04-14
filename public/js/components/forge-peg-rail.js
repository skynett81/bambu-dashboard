// Model Forge — Peg Rail
(function() {
  'use strict';
  window.loadForgePegRail = function() {
    const v = id => parseFloat(document.getElementById(id)?.value) || 0;
    window.ForgeCommon.buildTool({
      title: 'Peg Rail', icon: '🪵',
      endpoint: '/api/model-forge/peg-rail/generate-3mf',
      downloadName: 'peg_rail',
      helpText: 'Horizontal wall rail with multiple evenly-spaced hanging pegs.',
      fields: [
        { type: 'num', label: 'Rail length (mm)',  id: 'pr-l', min: 60, max: 600, val: 180, step: 5 },
        { type: 'num', label: 'Rail height (mm)',  id: 'pr-h', min: 20, max: 120, val: 40,  step: 2 },
        { type: 'num', label: 'Rail thickness',    id: 'pr-t', min: 3,  max: 10,  val: 4,   step: 0.2 },
        { type: 'num', label: 'Peg count',         id: 'pr-c', min: 2,  max: 20,  val: 5,   step: 1 },
        { type: 'num', label: 'Peg length (mm)',   id: 'pr-pl',min: 15, max: 120, val: 35,  step: 1 },
        { type: 'num', label: 'Peg radius (mm)',   id: 'pr-pr',min: 2,  max: 12,  val: 3.5, step: 0.2 },
        { type: 'num', label: 'Screw ⌀/2 (mm)',    id: 'pr-sr',min: 1,  max: 5,   val: 2.2, step: 0.1 },
      ],
      getParams: () => ({
        length: v('pr-l'), height: v('pr-h'), thickness: v('pr-t'),
        pegCount: v('pr-c'), pegLength: v('pr-pl'),
        pegRadius: v('pr-pr'), screwHoleRadius: v('pr-sr'),
      }),
      renderPreview: (p) => {
        const s = Math.min(2, 260 / p.length);
        const l = p.length * s, h = p.height * s;
        let pegs = '';
        const sp = (p.length - 40) / (p.pegCount - 1 || 1);
        for (let i = 0; i < p.pegCount; i++) {
          const cx = (20 + i * sp) * s;
          pegs += `<circle cx="${cx}" cy="${h/2}" r="${p.pegRadius*s + 1}" fill="#6a5030" stroke="#2a1a00" stroke-width="1"/>`;
        }
        return `<div style="font-size:0.7rem;color:var(--text-muted);margin:4px 0">${p.length}mm × ${p.pegCount} pegs × ${p.pegLength}mm long</div>
        <svg width="${l+20}" height="${h+20}" viewBox="-10 -10 ${l+20} ${h+20}">
          <rect x="0" y="0" width="${l}" height="${h}" fill="#a0855a" stroke="#3a2a10" stroke-width="1.5" rx="2"/>
          <circle cx="${10*s}" cy="${h/2}" r="${p.screwHoleRadius*s}" fill="#1a1000"/>
          <circle cx="${(p.length-10)*s}" cy="${h/2}" r="${p.screwHoleRadius*s}" fill="#1a1000"/>
          ${pegs}
        </svg>`;
      }
    });
  };
})();
