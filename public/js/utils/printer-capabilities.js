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

  // Moonraker/Klipper printers — no Bambu-specific fans (uses cavity_fan via gcode), no AI
  const MOONRAKER_CAPS = { auxFan: false, chamberFan: false, chamberHeat: false, light: true, ai: false, enclosure: true, dualNozzle: false, toolchanger: false, amsType: null, maxAmsUnits: 0, maxNozzleTemp: 300, maxBedTemp: 120, maxChamberTemp: null, buildVolume: [300,300,300], maxSpeed: 500, smFeatures: false };

  // Snapmaker U1 — 4-extruder toolchanger with NFC, defect detection, purifier
  const SM_U1_CAPS = { auxFan: false, chamberFan: false, chamberHeat: false, light: true, ai: false, enclosure: true, dualNozzle: false, toolchanger: true, amsType: null, maxAmsUnits: 0, maxNozzleTemp: 300, maxBedTemp: 110, maxChamberTemp: null, buildVolume: [271,335,275], maxSpeed: 500, smFeatures: true, nozzleCount: 4 };

  // PrusaLink printers
  const PRUSALINK_CAPS = { auxFan: false, chamberFan: false, chamberHeat: false, light: false, ai: false, enclosure: false, dualNozzle: false, toolchanger: false, amsType: null, maxAmsUnits: 0, maxNozzleTemp: 300, maxBedTemp: 120, maxChamberTemp: null, buildVolume: [250,210,220], maxSpeed: 200, smFeatures: false, prusaFeatures: true };

  // Brand-specific Moonraker overrides
  const BRAND_CAPS = {
    'Creality K1': { ...MOONRAKER_CAPS, enclosure: true, maxSpeed: 600, buildVolume: [220,220,250], crealityAI: true },
    'Creality K1 Max': { ...MOONRAKER_CAPS, enclosure: true, maxSpeed: 600, buildVolume: [300,300,300], crealityAI: true, crealityLidar: true },
    'Creality Ender-3 V3': { ...MOONRAKER_CAPS, maxSpeed: 500, buildVolume: [220,220,250] },
    'Elegoo Neptune 4 Pro': { ...MOONRAKER_CAPS, maxSpeed: 500, buildVolume: [225,225,265] },
    'Elegoo Neptune 4 Max': { ...MOONRAKER_CAPS, maxSpeed: 500, buildVolume: [420,420,480] },
    'Voron 2.4': { ...MOONRAKER_CAPS, enclosure: true, chamberHeat: true, maxSpeed: 500, buildVolume: [350,350,350], voronFeatures: true },
    'Voron Trident': { ...MOONRAKER_CAPS, enclosure: true, maxSpeed: 500, buildVolume: [350,350,250], voronFeatures: true },
    'Voron 0.2': { ...MOONRAKER_CAPS, enclosure: true, maxSpeed: 300, buildVolume: [120,120,120], voronFeatures: true },
    'QIDI X-Plus 3': { ...MOONRAKER_CAPS, enclosure: true, chamberHeat: true, maxSpeed: 600, buildVolume: [280,280,270] },
    'QIDI Q1 Pro': { ...MOONRAKER_CAPS, enclosure: true, chamberHeat: true, maxSpeed: 600, buildVolume: [245,245,245] },
    'Prusa MK4': { ...PRUSALINK_CAPS, buildVolume: [250,210,220] },
    'Prusa Mini': { ...PRUSALINK_CAPS, maxNozzleTemp: 280, maxBedTemp: 100, buildVolume: [180,180,180] },
    'Prusa XL': { ...PRUSALINK_CAPS, toolchanger: true, buildVolume: [360,360,360] },
  };

  window.getCapabilities = function(model, meta) {
    // Check brand-specific model overrides first
    if (model && BRAND_CAPS[model]) return BRAND_CAPS[model];
    if (model === 'Snapmaker U1') return SM_U1_CAPS;
    if (meta?.type === 'prusalink') return PRUSALINK_CAPS;
    if (meta?.type === 'moonraker' || meta?.type === 'klipper') {
      return meta?._isSnapmakerU1 ? SM_U1_CAPS : MOONRAKER_CAPS;
    }
    if (['creality', 'elegoo', 'anker', 'voron', 'ratrig', 'qidi'].includes(meta?.type)) return MOONRAKER_CAPS;
    if (!model) return DEFAULT_CAPS;
    return MODELS[model] || DEFAULT_CAPS;
  };

  window.isSnapmakerU1 = function(model, meta) {
    return model === 'Snapmaker U1' || !!meta?._isSnapmakerU1;
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
