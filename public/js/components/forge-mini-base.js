// Model Forge — Miniature Base
(function() {
  'use strict';
  window.loadForgeMiniBase = function() {
    const v = id => parseFloat(document.getElementById(id)?.value) || 0;
    const c = id => !!document.getElementById(id)?.checked;
    window.ForgeCommon.buildTool({
      title: 'Miniature Base', icon: '♟️',
      endpoint: '/api/model-forge/mini-base/generate-3mf',
      downloadName: 'mini_base',
      helpText: 'Round bases for tabletop miniatures (D&D, Warhammer). Common sizes: 25, 32, 40, 50, 60mm. Optional raised inner lip seats the figure.',
      fields: [
        { type: 'num', label: 'Diameter (mm)', id: 'mb-d', min: 15, max: 120, val: 32, step: 1 },
        { type: 'num', label: 'Thickness (mm)', id: 'mb-t', min: 1.5, max: 15, val: 3, step: 0.2 },
        { type: 'num', label: 'Lip height (mm)', id: 'mb-lh', min: 0, max: 4, val: 1, step: 0.1 },
        { type: 'num', label: 'Lip inset (mm)', id: 'mb-li', min: 0.5, max: 6, val: 1.5, step: 0.1 },
        { type: 'bool', label: 'Magnet indicator (6mm)', id: 'mb-mg', val: false },
      ],
      getParams: () => ({
        diameter: v('mb-d'), thickness: v('mb-t'),
        lipHeight: v('mb-lh'), lipInset: v('mb-li'),
        magnetIndicator: c('mb-mg'),
      }),
    });
  };
})();
