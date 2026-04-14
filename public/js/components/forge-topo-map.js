// Model Forge — Topographic Map
(function() {
  'use strict';
  window.loadForgeTopoMap = function() {
    const v = id => parseFloat(document.getElementById(id)?.value) || 0;
    window.ForgeCommon.buildTool({
      title: 'Topographic Map', icon: '🗺️',
      endpoint: '/api/model-forge/topo-map/generate-3mf',
      downloadName: 'topo_map',
      helpText: 'Synthetic terrain tile built from layered sinusoidal noise. Great for dioramas, D&D scenery, or paperweights.',
      fields: [
        { type: 'num', label: 'Width (mm)',      id: 'tp-w',  min: 40, max: 300, val: 120, step: 5 },
        { type: 'num', label: 'Depth (mm)',      id: 'tp-d',  min: 40, max: 300, val: 120, step: 5 },
        { type: 'num', label: 'Base (mm)',       id: 'tp-b',  min: 1,  max: 10,  val: 2,   step: 0.5 },
        { type: 'num', label: 'Max height (mm)', id: 'tp-mh', min: 5,  max: 80,  val: 20,  step: 1 },
        { type: 'num', label: 'Detail octaves',  id: 'tp-de', min: 1,  max: 8,   val: 4,   step: 1 },
        { type: 'num', label: 'Roughness',       id: 'tp-rg', min: 0,  max: 1,   val: 0.5, step: 0.05 },
        { type: 'num', label: 'Seed',            id: 'tp-s',  min: 0,  max: 9999,val: 42,  step: 1 },
      ],
      getParams: () => ({
        width: v('tp-w'), depth: v('tp-d'),
        baseThickness: v('tp-b'), maxHeight: v('tp-mh'),
        detail: v('tp-de'), roughness: v('tp-rg'), seed: v('tp-s'),
      }),
    });
  };
})();
