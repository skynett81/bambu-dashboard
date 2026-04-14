// Model Forge — Desk / Drawer Organizer
(function() {
  'use strict';
  window.loadForgeDeskOrganizer = function() {
    const v = id => parseFloat(document.getElementById(id)?.value) || 0;
    window.ForgeCommon.buildTool({
      title: 'Desk / Drawer Organizer', icon: '🗄️',
      endpoint: '/api/model-forge/desk-organizer/generate-3mf',
      downloadName: 'organizer',
      helpText: 'Rectangular tray with a configurable grid of compartments. Sized for drawers or desktops.',
      fields: [
        { type: 'num', label: 'Width (mm)',  id: 'do-w',  min: 40,  max: 400, val: 200, step: 5 },
        { type: 'num', label: 'Depth (mm)',  id: 'do-d',  min: 30,  max: 400, val: 120, step: 5 },
        { type: 'num', label: 'Height (mm)', id: 'do-h',  min: 10,  max: 120, val: 30,  step: 1 },
        { type: 'num', label: 'Columns (X)', id: 'do-c',  min: 1,   max: 12,  val: 4,   step: 1 },
        { type: 'num', label: 'Rows (Y)',    id: 'do-r',  min: 1,   max: 12,  val: 2,   step: 1 },
        { type: 'num', label: 'Wall thickness', id: 'do-wt', min: 1, max: 4, val: 1.6, step: 0.1 },
        { type: 'num', label: 'Floor thickness', id: 'do-ft', min: 0.8, max: 5, val: 1.5, step: 0.1 },
      ],
      getParams: () => ({
        width: v('do-w'), depth: v('do-d'), height: v('do-h'),
        cols: v('do-c'), rows: v('do-r'),
        wallThickness: v('do-wt'), floorThickness: v('do-ft'),
      }),
      renderPreview: (p) => {
        const s = Math.min(3, 260 / Math.max(p.width, p.depth));
        const pw = p.width * s, pd = p.depth * s;
        let grid = '';
        for (let i = 1; i < p.cols; i++) grid += `<line x1="${(pw/p.cols)*i}" y1="0" x2="${(pw/p.cols)*i}" y2="${pd}" stroke="#6a7a95" stroke-width="1.5"/>`;
        for (let i = 1; i < p.rows; i++) grid += `<line x1="0" y1="${(pd/p.rows)*i}" x2="${pw}" y2="${(pd/p.rows)*i}" stroke="#6a7a95" stroke-width="1.5"/>`;
        return `<div style="font-size:0.7rem;color:var(--text-muted);margin:4px 0">${p.width}×${p.depth}×${p.height}mm · ${p.cols}×${p.rows} compartments</div>
        <svg width="${pw+20}" height="${pd+20}" viewBox="-10 -10 ${pw+20} ${pd+20}">
          <rect x="0" y="0" width="${pw}" height="${pd}" fill="#a0adc8" stroke="#3a4a68" stroke-width="2"/>
          ${grid}
        </svg>`;
      }
    });
  };
})();
