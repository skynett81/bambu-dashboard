// Model Forge — Shape Extruder
(function() {
  'use strict';
  const SHAPES = [
    ['star', '⭐ Star'], ['heart', '❤️ Heart'], ['flower', '🌸 Flower'],
    ['polygon', '⬢ Polygon'], ['circle', '⚪ Circle'],
  ];
  window.loadForgeShape = function() {
    const v = id => parseFloat(document.getElementById(id)?.value) || 0;
    window.ForgeCommon.buildTool({
      title: 'Shape Extruder', icon: '✨',
      endpoint: '/api/model-forge/shape/generate-3mf',
      downloadName: 'shape',
      helpText: 'Pick a parametric 2D shape and extrude it into a solid. Great for ornaments, tags, cookie cutters, coasters.',
      fields: [
        { type: 'num', label: 'Size / radius (mm)', id: 'sh-sz', min: 10, max: 200, val: 40, step: 1 },
        { type: 'num', label: 'Extrusion height (mm)', id: 'sh-h', min: 1, max: 50, val: 5, step: 0.5 },
        { type: 'num', label: 'Points / petals', id: 'sh-p', min: 3, max: 16, val: 5, step: 1 },
      ],
      getParams: () => ({
        shape: document.getElementById('sh-type')?.value || 'star',
        size: v('sh-sz'), height: v('sh-h'), points: v('sh-p'),
      }),
    });
    // Inject shape selector
    setTimeout(() => {
      if (document.getElementById('sh-type')) return;
      const form = document.getElementById('fc-form');
      if (!form) return;
      const wrap = document.createElement('div');
      wrap.style.marginBottom = '10px';
      const opts = SHAPES.map(([k, n]) => `<option value="${k}">${n}</option>`).join('');
      wrap.innerHTML = `<label style="font-size:0.7rem;color:var(--text-muted)">Shape</label><select id="sh-type" class="form-input" style="font-size:0.82rem;width:100%">${opts}</select>`;
      form.insertBefore(wrap, form.firstChild);
      wrap.addEventListener('change', () => form.dispatchEvent(new Event('input', { bubbles: true })));
    }, 150);
  };
})();
