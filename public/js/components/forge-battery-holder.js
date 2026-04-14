// Model Forge — Battery Holder
(function() {
  'use strict';
  const PRESETS = {
    aa: { name: 'AA', diameter: 14.5 },
    aaa: { name: 'AAA', diameter: 10.5 },
    c: { name: 'C', diameter: 26.2 },
    d: { name: 'D', diameter: 34.2 },
    b18650: { name: '18650', diameter: 18.4 },
    b21700: { name: '21700', diameter: 21.2 },
    cr123: { name: 'CR123A', diameter: 17.0 },
  };

  window.loadForgeBatteryHolder = function() {
    const v = id => parseFloat(document.getElementById(id)?.value) || 0;
    const s = id => document.getElementById(id)?.value;
    window.ForgeCommon.buildTool({
      title: 'Battery Holder', icon: '🔋',
      endpoint: '/api/model-forge/battery-holder/generate-3mf',
      downloadName: 'battery_holder',
      helpText: 'Compact block with bores sized for common batteries. Pick type below, configure count and layout.',
      fields: [
        { type: 'num', label: 'Count', id: 'bh-cn', min: 1, max: 24, val: 4, step: 1 },
        { type: 'num', label: 'Rows', id: 'bh-rw', min: 1, max: 4, val: 1, step: 1 },
        { type: 'num', label: 'Spacing (mm)', id: 'bh-sp', min: 1, max: 10, val: 2, step: 0.5 },
        { type: 'num', label: 'Margin (mm)', id: 'bh-mg', min: 2, max: 15, val: 3, step: 0.5 },
        { type: 'num', label: 'Slot depth (mm)', id: 'bh-dp', min: 4, max: 40, val: 10, step: 1 },
        { type: 'num', label: 'Floor thickness (mm)', id: 'bh-ft', min: 1, max: 10, val: 2, step: 0.5 },
      ],
      getParams: () => ({
        type: s('bh-type') || 'aa',
        count: v('bh-cn'), rows: v('bh-rw'),
        spacing: v('bh-sp'), margin: v('bh-mg'),
        depth: v('bh-dp'), floorThickness: v('bh-ft'),
      }),
      renderPreview: (p) => {
        const preset = PRESETS[p.type] || PRESETS.aa;
        const cellsPerRow = Math.ceil(p.count / p.rows);
        const d = preset.diameter;
        const pitch = d + p.spacing;
        const totalW = cellsPerRow * pitch - p.spacing + p.margin * 2;
        const totalD = p.rows * pitch - p.spacing + p.margin * 2;
        const scale = Math.min(5, 260 / totalW);
        const pw = totalW * scale, pd = totalD * scale;
        let holes = '';
        let placed = 0;
        for (let r = 0; r < p.rows && placed < p.count; r++) {
          for (let c = 0; c < cellsPerRow && placed < p.count; c++) {
            const cx = (p.margin + d/2 + c * pitch) * scale;
            const cy = (p.margin + d/2 + r * pitch) * scale;
            holes += `<circle cx="${cx}" cy="${cy}" r="${d/2*scale}" fill="#1a2a3a"/>`;
            placed++;
          }
        }
        return `<div style="font-size:0.7rem;color:var(--text-muted);margin:4px 0">${preset.name} × ${p.count}</div>
        <svg width="${pw+20}" height="${pd+20}" viewBox="-10 -10 ${pw+20} ${pd+20}">
          <rect x="0" y="0" width="${pw}" height="${pd}" fill="#4a5a75" stroke="#1a2a3a" stroke-width="1" rx="2"/>
          ${holes}
        </svg>`;
      }
    });

    // Inject battery type selector after form renders
    setTimeout(() => {
      if (document.getElementById('bh-type')) return;
      const form = document.getElementById('fc-form');
      if (!form) return;
      const wrap = document.createElement('div');
      wrap.style.marginBottom = '8px';
      const opts = Object.entries(PRESETS).map(([k, v]) =>
        `<option value="${k}"${k === 'aa' ? ' selected' : ''}>${v.name} (⌀${v.diameter}mm)</option>`
      ).join('');
      wrap.innerHTML = `<label style="font-size:0.7rem;color:var(--text-muted)">Battery type</label><select id="bh-type" class="form-input" style="font-size:0.82rem;width:100%">${opts}</select>`;
      form.insertBefore(wrap, form.firstChild);
      document.getElementById('bh-type').addEventListener('change', () => {
        document.getElementById('fc-form')?.dispatchEvent(new Event('input', { bubbles: true }));
      });
    }, 150);
  };
})();
