// Model Forge — Honeycomb Tile
(function() {
  'use strict';
  window.loadForgeHoneycomb = function() {
    const v = id => parseFloat(document.getElementById(id)?.value) || 0;
    window.ForgeCommon.buildTool({
      title: 'Honeycomb Tile', icon: '🍯',
      endpoint: '/api/model-forge/honeycomb/generate-3mf',
      downloadName: 'honeycomb_tile',
      helpText: 'Flat tile with hexagonal honeycomb pattern. Use as a coaster, decorative wall tile, or light diffuser.',
      fields: [
        { type: 'num', label: 'Width (mm)', id: 'hc-w', min: 40, max: 300, val: 120, step: 5 },
        { type: 'num', label: 'Depth (mm)', id: 'hc-d', min: 30, max: 300, val: 80, step: 5 },
        { type: 'num', label: 'Height (mm)', id: 'hc-h', min: 3, max: 40, val: 6, step: 0.5 },
        { type: 'num', label: 'Hex cell size (mm)', id: 'hc-cs', min: 5, max: 40, val: 12, step: 0.5 },
        { type: 'num', label: 'Wall thickness (mm)', id: 'hc-wt', min: 0.8, max: 3, val: 1.2, step: 0.1 },
        { type: 'num', label: 'Base thickness (mm)', id: 'hc-bt', min: 1, max: 5, val: 1.5, step: 0.1 },
      ],
      getParams: () => ({
        width: v('hc-w'), depth: v('hc-d'), height: v('hc-h'),
        cellSize: v('hc-cs'), wallThickness: v('hc-wt'), baseThickness: v('hc-bt'),
      }),
    });
  };
})();
