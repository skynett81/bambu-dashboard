// Model Forge — Voronoi Tray
(function() {
  'use strict';
  window.loadForgeVoronoiTray = function() {
    const v = id => parseFloat(document.getElementById(id)?.value) || 0;
    window.ForgeCommon.buildTool({
      title: 'Voronoi Tray', icon: '🧩',
      endpoint: '/api/model-forge/voronoi-tray/generate-3mf',
      downloadName: 'voronoi_tray',
      helpText: 'Rectangular tray with irregular voronoi compartments. Change the seed to roll a new layout.',
      fields: [
        { type: 'num', label: 'Width (mm)', id: 'vo-w', min: 40, max: 300, val: 120, step: 5 },
        { type: 'num', label: 'Depth (mm)', id: 'vo-d', min: 30, max: 300, val: 80, step: 5 },
        { type: 'num', label: 'Height (mm)', id: 'vo-h', min: 6, max: 60, val: 18, step: 1 },
        { type: 'num', label: 'Cell count', id: 'vo-cc', min: 3, max: 60, val: 10, step: 1 },
        { type: 'num', label: 'Seed', id: 'vo-s', min: 0, max: 9999, val: 42, step: 1 },
        { type: 'num', label: 'Wall thickness (mm)', id: 'vo-wt', min: 0.8, max: 3, val: 1.2, step: 0.1 },
      ],
      getParams: () => ({
        width: v('vo-w'), depth: v('vo-d'), height: v('vo-h'),
        cellCount: v('vo-cc'), seed: v('vo-s'), wallThickness: v('vo-wt'),
      }),
    });
  };
})();
