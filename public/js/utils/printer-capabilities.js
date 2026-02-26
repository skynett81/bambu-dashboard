// Printer Capabilities - Model → Feature map for all Bambu Lab printers
(function() {
  const MODELS = {
    'X1 Carbon':  { auxFan: true,  chamberFan: true,  chamberHeat: false, light: true,  ai: true,  enclosure: true,  dualNozzle: false, toolchanger: false, amsType: 'full', maxAmsUnits: 4, maxNozzleTemp: 300, maxBedTemp: 120, maxChamberTemp: 60,   buildVolume: [256,256,256], maxSpeed: 500 },
    'X1E':        { auxFan: true,  chamberFan: true,  chamberHeat: true,  light: true,  ai: true,  enclosure: true,  dualNozzle: false, toolchanger: false, amsType: 'full', maxAmsUnits: 4, maxNozzleTemp: 320, maxBedTemp: 120, maxChamberTemp: 65,   buildVolume: [256,256,256], maxSpeed: 500 },
    'P1S':        { auxFan: true,  chamberFan: true,  chamberHeat: false, light: true,  ai: false, enclosure: true,  dualNozzle: false, toolchanger: false, amsType: 'full', maxAmsUnits: 4, maxNozzleTemp: 300, maxBedTemp: 100, maxChamberTemp: null, buildVolume: [256,256,256], maxSpeed: 500 },
    'P1P':        { auxFan: true,  chamberFan: true,  chamberHeat: false, light: false, ai: false, enclosure: false, dualNozzle: false, toolchanger: false, amsType: 'full', maxAmsUnits: 4, maxNozzleTemp: 300, maxBedTemp: 100, maxChamberTemp: null, buildVolume: [256,256,256], maxSpeed: 500 },
    'P2S':        { auxFan: true,  chamberFan: true,  chamberHeat: false, light: true,  ai: true,  enclosure: true,  dualNozzle: false, toolchanger: false, amsType: 'full', maxAmsUnits: 4, maxNozzleTemp: 300, maxBedTemp: 110, maxChamberTemp: null, buildVolume: [256,256,256], maxSpeed: 500 },
    'P2S Combo':  { auxFan: true,  chamberFan: true,  chamberHeat: false, light: true,  ai: true,  enclosure: true,  dualNozzle: false, toolchanger: false, amsType: 'full', maxAmsUnits: 4, maxNozzleTemp: 300, maxBedTemp: 110, maxChamberTemp: null, buildVolume: [256,256,256], maxSpeed: 500 },
    'A1':         { auxFan: false, chamberFan: false, chamberHeat: false, light: false, ai: false, enclosure: false, dualNozzle: false, toolchanger: false, amsType: 'lite', maxAmsUnits: 1, maxNozzleTemp: 300, maxBedTemp: 100, maxChamberTemp: null, buildVolume: [256,256,256], maxSpeed: 500 },
    'A1 mini':    { auxFan: false, chamberFan: false, chamberHeat: false, light: false, ai: false, enclosure: false, dualNozzle: false, toolchanger: false, amsType: 'lite', maxAmsUnits: 1, maxNozzleTemp: 300, maxBedTemp: 80,  maxChamberTemp: null, buildVolume: [180,180,180], maxSpeed: 500 },
    'H2S':        { auxFan: true,  chamberFan: true,  chamberHeat: true,  light: true,  ai: true,  enclosure: true,  dualNozzle: false, toolchanger: false, amsType: 'full', maxAmsUnits: 4, maxNozzleTemp: 320, maxBedTemp: 120, maxChamberTemp: 65,   buildVolume: [340,320,340], maxSpeed: 600 },
    'H2D':        { auxFan: true,  chamberFan: true,  chamberHeat: true,  light: true,  ai: true,  enclosure: true,  dualNozzle: true,  toolchanger: false, amsType: 'full', maxAmsUnits: 4, maxNozzleTemp: 350, maxBedTemp: 120, maxChamberTemp: 65,   buildVolume: [340,320,340], maxSpeed: 600, nozzleCount: 2 },
    'H2C':        { auxFan: true,  chamberFan: true,  chamberHeat: true,  light: true,  ai: true,  enclosure: true,  dualNozzle: false, toolchanger: true,  amsType: 'full', maxAmsUnits: 4, maxNozzleTemp: 350, maxBedTemp: 120, maxChamberTemp: 65,   buildVolume: [340,320,340], maxSpeed: 600, maxToolheads: 6 }
  };

  const DEFAULT_CAPS = { auxFan: true, chamberFan: true, chamberHeat: true, light: true, ai: true, enclosure: true, dualNozzle: false, toolchanger: false, amsType: 'full', maxAmsUnits: 4, maxNozzleTemp: 300, maxBedTemp: 120, maxChamberTemp: 60, buildVolume: [256,256,256], maxSpeed: 500 };

  window.getCapabilities = function(model) {
    if (!model) return DEFAULT_CAPS;
    return MODELS[model] || DEFAULT_CAPS;
  };

  window.getKnownModels = function() {
    return Object.keys(MODELS);
  };

  window.isDualNozzle = function(model) {
    return getCapabilities(model).dualNozzle === true;
  };

  window.isToolchanger = function(model) {
    return getCapabilities(model).toolchanger === true;
  };

  window.getAmsType = function(model) {
    return getCapabilities(model).amsType || 'full';
  };

  window.getNozzleCount = function(model) {
    const caps = getCapabilities(model);
    if (caps.toolchanger) return caps.maxToolheads || 6;
    if (caps.dualNozzle) return caps.nozzleCount || 2;
    return 1;
  };
})();
