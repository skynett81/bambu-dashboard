// Model Forge — Dice Tower
(function() {
  'use strict';
  window.loadForgeDiceTower = function() {
    const v = id => parseFloat(document.getElementById(id)?.value) || 0;
    window.ForgeCommon.buildTool({
      title: 'Dice Tower', icon: '🎲',
      endpoint: '/api/model-forge/dice-tower/generate-3mf',
      downloadName: 'dice_tower',
      helpText: 'Compact tabletop dice tower — drop dice in the top, they bounce off internal ramps and roll out the exit chute at the front.',
      fields: [
        { type: 'num', label: 'Width (mm)',  id: 'dt-w', min: 30,  max: 150, val: 60,  step: 2 },
        { type: 'num', label: 'Depth (mm)',  id: 'dt-d', min: 30,  max: 150, val: 50,  step: 2 },
        { type: 'num', label: 'Height (mm)', id: 'dt-h', min: 60,  max: 250, val: 120, step: 5 },
        { type: 'num', label: 'Wall thickness (mm)', id: 'dt-wt', min: 1.5, max: 5, val: 2.4, step: 0.2 },
      ],
      getParams: () => ({
        width: v('dt-w'), depth: v('dt-d'), height: v('dt-h'),
        wallThickness: v('dt-wt'),
      }),
    });
  };
})();
