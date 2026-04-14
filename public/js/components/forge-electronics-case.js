// Model Forge — Electronics Case
(function() {
  'use strict';
  window.loadForgeElectronicsCase = function() {
    const v = id => parseFloat(document.getElementById(id)?.value) || 0;
    window.ForgeCommon.buildTool({
      title: 'Electronics Case', icon: '💻',
      endpoint: '/api/model-forge/electronics-case/generate-3mf',
      downloadName: 'electronics_case',
      helpText: 'Case body + friction-fit lid placed side-by-side on the build plate. Common board sizes — Raspberry Pi 4/5: 85×56mm, Arduino Uno: 68.6×53.3mm. Default preset: Raspberry Pi 5 with corner standoffs.',
      fields: [
        { type: 'num', label: 'Board width (mm)',  id: 'ec-bw', min: 20, max: 300, val: 85, step: 1 },
        { type: 'num', label: 'Board depth (mm)',  id: 'ec-bd', min: 20, max: 300, val: 56, step: 1 },
        { type: 'num', label: 'Clearance (mm)',    id: 'ec-cl', min: 0.5, max: 10, val: 2, step: 0.5 },
        { type: 'num', label: 'Wall height (mm)',  id: 'ec-wh', min: 10, max: 120, val: 22, step: 1 },
        { type: 'num', label: 'Wall thickness (mm)', id: 'ec-wt', min: 1.5, max: 5, val: 2, step: 0.2 },
        { type: 'num', label: 'Floor thickness (mm)',id: 'ec-ft', min: 1, max: 5, val: 1.6, step: 0.2 },
      ],
      getParams: () => ({
        preset: 'raspi5',
        boardWidth: v('ec-bw'), boardDepth: v('ec-bd'),
        boardClearance: v('ec-cl'),
        wallHeight: v('ec-wh'),
        wallThickness: v('ec-wt'),
        floorThickness: v('ec-ft'),
      }),
      renderPreview: (p) => {
        const scale = Math.min(3, 260 / ((p.boardWidth + p.wallThickness*2) * 2 + 10));
        const oW = (p.boardWidth + p.boardClearance*2 + p.wallThickness*2) * scale;
        const oD = (p.boardDepth + p.boardClearance*2 + p.wallThickness*2) * scale;
        return `<div style="font-size:0.7rem;color:var(--text-muted);margin:4px 0">Board ${p.boardWidth}×${p.boardDepth}mm · wall ${p.wallHeight}mm tall</div>
        <div style="display:flex;gap:${5*scale}px;align-items:center">
          <div style="width:${oW}px;height:${oD}px;background:#354560;border:2px solid #0a1020;position:relative">
            <div style="position:absolute;inset:${p.wallThickness*scale}px;background:var(--bg-tertiary)"></div>
          </div>
          <div style="width:${oW}px;height:${oD}px;background:#5a6b88;border:2px solid #0a1020"></div>
        </div>
        <div style="font-size:0.65rem;color:var(--text-muted);margin-top:4px">← body + lid →</div>`;
      }
    });
  };
})();
