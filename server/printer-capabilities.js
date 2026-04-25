/**
 * Printer capabilities — per-brand/model configuration for file access, cameras, and features
 * Single source of truth for how to interact with each printer type
 */

/**
 * Capability definitions per printer type
 * Each entry defines HOW to access files, models, and cameras for that printer type
 */
const CAPABILITIES = {
  bambu: {
    label: 'Bambu Lab',
    connection: 'mqtt',
    fileAccess: 'ftps',
    ftps: { port: 990, user: 'bblp', secure: 'implicit' },
    camera: { modes: ['jpeg-tls', 'rtsp'], ports: { jpeg: 6000, rtsp: 322 } },
    modelAccess: {
      // Bambu stores .gcode.3mf on internal storage (root /)
      // The 3MF contains embedded gcode, NOT mesh data
      // Must extract gcode from 3MF ZIP for toolpath rendering
      method: 'ftps-3mf',
      searchDirs: ['/', '/cache/', '/sdcard/', '/data/'],
      filePattern: '.gcode.3mf',
      hasMeshIn3MF: false, // Bambu gcode.3mf has no mesh — only embedded gcode
    },
    gcodeAccess: {
      // Gcode is embedded inside the .gcode.3mf file
      method: 'embedded-in-3mf',
    },
    features: {
      ams: true,
      xcam: true,
      firmwareDetection: true,
      ssdpDiscovery: true,
      cloudTasks: true,
    },
    auth: { required: ['serial', 'accessCode'] },
  },

  moonraker: {
    label: 'Moonraker/Klipper',
    connection: 'websocket',
    fileAccess: 'http-api',
    httpApi: { filesEndpoint: '/server/files/gcodes/', metadataEndpoint: '/server/files/metadata' },
    camera: { modes: ['http-snapshot', 'ssh-sftp'], interval: 200 },
    modelAccess: {
      // Moonraker only has gcode files — no 3MF on the printer
      // Must download gcode and parse as toolpath
      method: 'moonraker-gcode',
      hasMeshIn3MF: false,
    },
    gcodeAccess: {
      method: 'http-download',
      endpoint: '/server/files/gcodes/',
    },
    features: {
      ams: false,
      xcam: false,
      firmwareDetection: false,
      ssdpDiscovery: false,
      cloudTasks: false,
      historySync: true,
      multiExtruder: true,
    },
    auth: { required: ['ip'] },
  },

  prusalink: {
    label: 'PrusaLink',
    connection: 'http-poll',
    fileAccess: 'http-api',
    httpApi: { filesEndpoint: '/api/v1/files/local', metadataEndpoint: '/api/v1/files' },
    camera: { modes: ['http-snapshot'], snapshotEndpoint: '/api/v1/cameras/snap' },
    modelAccess: { method: 'prusalink-gcode', hasMeshIn3MF: false },
    gcodeAccess: { method: 'http-download', endpoint: '/api/v1/files/local/' },
    features: {
      ams: false, xcam: false, firmwareDetection: true,
      ssdpDiscovery: false, cloudTasks: false, historySync: false,
      multiExtruder: false,
    },
    auth: { required: ['ip', 'accessCode'], methods: ['api-key', 'digest'] },
  },

  sacp: {
    label: 'Snapmaker SACP',
    connection: 'sacp-tcp',
    fileAccess: 'sacp-upload',
    camera: { modes: [] },
    modelAccess: { method: 'none', hasMeshIn3MF: false },
    gcodeAccess: { method: 'sacp-upload' },
    features: {
      ams: false, xcam: false, firmwareDetection: true,
      ssdpDiscovery: false, cloudTasks: false, historySync: false,
      multiExtruder: true, enclosure: true, purifier: true,
      sacpDiscovery: true,
    },
    auth: { required: ['ip'] },
  },

  'snapmaker-http': {
    label: 'Snapmaker 2.0 HTTP',
    connection: 'http-token',
    fileAccess: 'http-upload',
    camera: { modes: [] },
    modelAccess: { method: 'none', hasMeshIn3MF: false },
    gcodeAccess: { method: 'http-upload' },
    features: {
      ams: false, xcam: false, firmwareDetection: true,
      ssdpDiscovery: false, cloudTasks: false, historySync: false,
      multiExtruder: false, enclosure: true, multiModule: true,
      sacpDiscovery: true, tokenAuth: true,
    },
    auth: { required: ['ip'], methods: ['token'] },
  },

  ankermake: {
    label: 'AnkerMake (via ankerctl)',
    connection: 'http-ws-proxy',
    fileAccess: 'http-api',
    camera: { modes: ['ws-video'], videoEndpoint: '/ws/video', snapshotEndpoint: '/video' },
    modelAccess: { method: 'none', hasMeshIn3MF: false },
    gcodeAccess: { method: 'none' },
    features: {
      ams: false, xcam: false, firmwareDetection: false,
      ssdpDiscovery: false, cloudTasks: false, historySync: false,
      multiExtruder: false, ankerctlProxy: true,
    },
    auth: { required: ['ip'], methods: ['none'] },
  },

  octoprint: {
    label: 'OctoPrint',
    connection: 'websocket-sockjs',
    fileAccess: 'http-api',
    httpApi: { filesEndpoint: '/api/files/local', metadataEndpoint: '/api/files' },
    camera: { modes: ['http-snapshot'], snapshotEndpoint: '/webcam/?action=snapshot' },
    modelAccess: { method: 'octoprint-gcode', hasMeshIn3MF: false },
    gcodeAccess: { method: 'http-download', endpoint: '/api/files/local/' },
    features: {
      ams: false, xcam: false, firmwareDetection: false,
      ssdpDiscovery: false, cloudTasks: false, historySync: false,
      multiExtruder: true, websocket: true, printerProfiles: true,
      systemCommands: true, timelapse: true, slicing: true,
      connectionControl: true, sdCard: true, pluginApi: true,
      nativeTemp: true, toolControl: true, bedControl: true,
    },
    auth: { required: ['ip', 'accessCode'], methods: ['api-key'] },
    plugins: {
      psuControl: { endpoint: '/api/plugin/psucontrol' },
      filamentManager: { endpoint: '/api/plugin/filamentmanager' },
      bedLevelVisualizer: { endpoint: '/api/plugin/bedlevelvisualizer' },
    },
  },
};

/**
 * Model-specific overrides (extend base type capabilities)
 */
const MODEL_OVERRIDES = {
  // Bambu Lab models
  'P1S': { camera: { modes: ['rtsp'] }, buildVolume: [256, 256, 256] },
  'P1P': { camera: { modes: ['rtsp'] }, buildVolume: [256, 256, 256] },
  'P2S': { camera: { modes: ['jpeg-tls', 'rtsp'] }, buildVolume: [256, 256, 256] },
  'A1': { camera: { modes: ['rtsp'] }, buildVolume: [256, 256, 256] },
  'A1 mini': { camera: { modes: ['rtsp'] }, buildVolume: [180, 180, 180] },
  'X1': { camera: { modes: ['rtsp'] }, buildVolume: [256, 256, 256] },
  'X1C': { camera: { modes: ['rtsp'] }, buildVolume: [256, 256, 256] },
  'X1E': { camera: { modes: ['rtsp'] }, buildVolume: [256, 256, 256] },
  'H2D': {
    camera: { modes: ['rtsp'] },
    buildVolume: [325, 320, 325],
    features: { multiExtruder: true, idex: true, dualNozzle: true, enclosure: true, chamber: true, chamberHeated: true, ai: true, hasLaser: false },
  },
  'H2D Pro': {
    camera: { modes: ['rtsp'] },
    buildVolume: [325, 320, 325],
    features: { multiExtruder: true, idex: true, dualNozzle: true, enclosure: true, chamber: true, chamberHeated: true, ai: true, hasLaser: true, refreshableNozzle: true, highTempBed: true },
  },
  'H2C': {
    camera: { modes: ['rtsp'] },
    buildVolume: [325, 320, 325],
    features: { multiExtruder: true, multiColor: true, vortek: true, enclosure: true, chamber: true, chamberHeated: true, ai: true },
  },
  'H2S': {
    camera: { modes: ['rtsp'] },
    buildVolume: [256, 256, 256],
    features: { enclosure: true, chamber: true, chamberHeated: true, ai: true },
  },
  'Snapmaker U1': {
    features: { multiExtruder: true, toolheads: 4, purifier: true },
    buildVolume: [220, 220, 220],
    camera: { modes: ['http-snapshot', 'ssh-sftp'], sshPaths: ['/tmp/.monitor.jpg', '/tmp/printer_detection.jpg'] },
  },
  'Snapmaker J1': { features: { multiExtruder: true, idex: true, dualNozzle: true }, buildVolume: [300, 200, 200] },
  'Snapmaker J1s': { features: { multiExtruder: true, idex: true, dualNozzle: true }, buildVolume: [300, 200, 200] },
  'Snapmaker Artisan': { features: { multiExtruder: true, enclosure: true, purifier: true, dualNozzle: true }, buildVolume: [400, 400, 400] },
  'X1C': { camera: { modes: ['rtsp'] } },
  // (P2S/A1/A1 mini/X1*/H2D and Snapmaker U1/J1/J1s/Artisan are defined
  //  above in the same MODEL_OVERRIDES map. They include both buildVolume
  //  and camera-specific config as needed.)
  'Snapmaker 2.0 A150': { features: { enclosure: true, multiModule: true } },
  'Snapmaker 2.0 A250': { features: { enclosure: true, multiModule: true } },
  'Snapmaker 2.0 A350': { features: { enclosure: true, multiModule: true } },
  'Snapmaker Ray': { features: { laser: true, multiModule: false }, connection: 'sacp-udp' },

  // Prusa models (PrusaLink)
  'Prusa MK4': { camera: { modes: ['http-snapshot'] }, buildVolume: [250, 210, 220] },
  'Prusa MK4S': { camera: { modes: ['http-snapshot'] }, buildVolume: [250, 210, 220], features: { firmware: 'Buddy' } }, // 2024 refresh w/ improved hotend + Nextruder
  'Prusa MK3.9': { camera: { modes: ['http-snapshot'] }, buildVolume: [250, 210, 210] },
  'Prusa Mini': { camera: { modes: ['http-snapshot'] }, buildVolume: [180, 180, 180] },
  'Prusa Mini+': { camera: { modes: ['http-snapshot'] }, buildVolume: [180, 180, 180] },
  'Prusa XL': { camera: { modes: ['http-snapshot'] }, buildVolume: [360, 360, 360], features: { multiExtruder: true, toolheads: 5, idex: false } }, // up to 5 toolheads
  'Prusa CORE One': { camera: { modes: ['http-snapshot'] }, buildVolume: [250, 220, 270], features: { enclosure: true, chamber: true, coreXY: true } }, // 2024/2025 enclosed CoreXY
  'Prusa HT90': { camera: { modes: ['http-snapshot'] }, buildVolume: [400, 400, 420], features: { enclosure: true, chamber: true, chamberHeated: true, highTempBed: true, ai: true } }, // industrial high-temp
  'Prusa Pro HT90': { camera: { modes: ['http-snapshot'] }, buildVolume: [400, 400, 420], features: { enclosure: true, chamber: true, chamberHeated: true, highTempBed: true, ai: true } },

  // Creality models (Klipper/Moonraker)
  'Creality K1': { camera: { modes: ['http-snapshot'] }, buildVolume: [220, 220, 250] },
  'Creality K1C': { camera: { modes: ['http-snapshot'] }, buildVolume: [220, 220, 250], features: { enclosure: true, ai: true, hardenedHotend: true } }, // 2024 carbon-fiber-ready
  'Creality K1 Max': { camera: { modes: ['http-snapshot'] }, buildVolume: [300, 300, 300] },
  'Creality K1 SE': { camera: { modes: ['http-snapshot'] }, buildVolume: [220, 220, 250] },
  'Creality K2 Plus': { camera: { modes: ['http-snapshot'] }, buildVolume: [350, 350, 350], features: { enclosure: true, chamber: true, chamberHeated: true, ai: true, multiColor: true, cfs: true } }, // 2024 large CoreXY w/ CFS
  'Creality K2 Plus Combo': { camera: { modes: ['http-snapshot'] }, buildVolume: [350, 350, 350], features: { enclosure: true, chamber: true, chamberHeated: true, ai: true, multiColor: true, cfs: true } },
  'Creality Hi': { camera: { modes: ['http-snapshot'] }, buildVolume: [220, 220, 250], features: { ai: true } }, // 2025 budget Klipper
  'Creality Hi Combo': { camera: { modes: ['http-snapshot'] }, buildVolume: [220, 220, 250], features: { ai: true, multiColor: true, cfs: true } },
  'Creality Ender-3 V3': { camera: { modes: ['http-snapshot'] }, buildVolume: [220, 220, 250] },
  'Creality Ender-3 V3 SE': { camera: { modes: ['http-snapshot'] }, buildVolume: [220, 220, 250] },
  'Creality Ender-3 V3 KE': { camera: { modes: ['http-snapshot'] }, buildVolume: [220, 220, 240] },
  'Creality Ender-3 V3 Plus': { camera: { modes: ['http-snapshot'] }, buildVolume: [300, 300, 330] },
  'Creality CR-10 SE': { camera: { modes: ['http-snapshot'] }, buildVolume: [220, 220, 265] },

  // Elegoo models (Klipper/Moonraker)
  'Elegoo Neptune 4': { camera: { modes: ['http-snapshot'] }, buildVolume: [225, 225, 265] },
  'Elegoo Neptune 4 Pro': { camera: { modes: ['http-snapshot'] }, buildVolume: [225, 225, 265] },
  'Elegoo Neptune 4 Plus': { camera: { modes: ['http-snapshot'] }, buildVolume: [320, 320, 385] }, // 2024 mid-size
  'Elegoo Neptune 4 Max': { camera: { modes: ['http-snapshot'] }, buildVolume: [420, 420, 480] },
  'Elegoo Centauri': { camera: { modes: ['http-snapshot'] }, buildVolume: [256, 256, 256], features: { enclosure: true } }, // 2024 enclosed
  'Elegoo Centauri Carbon': { camera: { modes: ['http-snapshot'] }, buildVolume: [256, 256, 256], features: { enclosure: true, ai: true, hardenedHotend: true } }, // 2024 carbon-ready

  // Voron (community Klipper/Moonraker)
  'Voron 0.1': { camera: { modes: ['http-snapshot'] }, buildVolume: [120, 120, 120] },
  'Voron 0.2': { camera: { modes: ['http-snapshot'] }, buildVolume: [120, 120, 120] },
  'Voron 2.4': { camera: { modes: ['http-snapshot'] }, buildVolume: [350, 350, 350], features: { enclosure: true, coreXY: true } },
  'Voron Trident': { camera: { modes: ['http-snapshot'] }, buildVolume: [350, 350, 250], features: { enclosure: true, coreXY: true } },
  'Voron Switchwire': { camera: { modes: ['http-snapshot'] }, buildVolume: [250, 210, 250], features: { coreXZ: true } },
  'Voron Phoenix': { camera: { modes: ['http-snapshot'] }, buildVolume: [350, 350, 350], features: { coreXY: true } },

  // RatRig (Klipper/Moonraker — RatOS)
  'RatRig V-Core 3': { camera: { modes: ['http-snapshot'] }, buildVolume: [300, 300, 300], features: { coreXY: true } },
  'RatRig V-Core 3 Pro': { camera: { modes: ['http-snapshot'] }, buildVolume: [300, 300, 300], features: { coreXY: true } },
  'RatRig V-Core 3.1': { camera: { modes: ['http-snapshot'] }, buildVolume: [400, 400, 400], features: { coreXY: true } },
  'RatRig V-Core 4': { camera: { modes: ['http-snapshot'] }, buildVolume: [400, 400, 400], features: { coreXY: true, enclosure: true } }, // 2025 release
  'RatRig V-Minion': { camera: { modes: ['http-snapshot'] }, buildVolume: [180, 180, 180], features: { coreXY: true } },

  // AnkerMake (MQTT + REST hybrid via Moonraker bridge)
  'AnkerMake M5': { camera: { modes: ['rtsp', 'http-snapshot'] }, buildVolume: [235, 235, 250], features: { ai: true } },
  'AnkerMake M5C': { camera: { modes: ['http-snapshot'] }, buildVolume: [220, 220, 250], features: { ai: true } }, // 2024 budget

  // QIDI (Klipper/Moonraker)
  'QIDI X-Plus 3': { camera: { modes: ['http-snapshot'] }, buildVolume: [280, 280, 270], features: { enclosure: true, chamber: true, chamberHeated: true } },
  'QIDI X-Plus 4': { camera: { modes: ['http-snapshot'] }, buildVolume: [305, 305, 305], features: { enclosure: true, chamber: true, chamberHeated: true, ai: true } }, // 2024
  'QIDI X-Max 3': { camera: { modes: ['http-snapshot'] }, buildVolume: [325, 325, 315], features: { enclosure: true, chamber: true, chamberHeated: true } },
  'QIDI X-Max 4': { camera: { modes: ['http-snapshot'] }, buildVolume: [325, 325, 315], features: { enclosure: true, chamber: true, chamberHeated: true, ai: true } }, // 2024
  'QIDI Q1 Pro': { camera: { modes: ['http-snapshot'] }, buildVolume: [245, 245, 240], features: { enclosure: true, chamber: true, chamberHeated: true } }, // 2024 mid-range
  'QIDI X-CF Pro': { camera: { modes: ['http-snapshot'] }, buildVolume: [300, 250, 300], features: { enclosure: true, chamber: true, chamberHeated: true, hardenedHotend: true } },
  'QIDI Plus4': { camera: { modes: ['http-snapshot'] }, buildVolume: [305, 305, 305], features: { enclosure: true, chamber: true, chamberHeated: true, ai: true } }, // alias

  // Anycubic (Klipper/Moonraker — Kobra series)
  'Anycubic Kobra 3': { camera: { modes: ['http-snapshot'] }, buildVolume: [250, 250, 260], features: { ai: true } }, // 2024
  'Anycubic Kobra 3 Combo': { camera: { modes: ['http-snapshot'] }, buildVolume: [250, 250, 260], features: { ai: true, multiColor: true } },
  'Anycubic Kobra S1': { camera: { modes: ['http-snapshot'] }, buildVolume: [250, 250, 250], features: { enclosure: true, ai: true } }, // 2024 flagship
  'Anycubic Kobra S1 Combo': { camera: { modes: ['http-snapshot'] }, buildVolume: [250, 250, 250], features: { enclosure: true, ai: true, multiColor: true } },
};

/**
 * Get capabilities for a printer
 * @param {Object} printer - Printer object from DB (with type, model fields)
 * @returns {Object} Merged capabilities
 */
export function getCapabilities(printer) {
  const baseType = (printer.type || 'bambu').toLowerCase();
  // Map brand aliases to connector types
  const TYPE_MAP = { klipper: 'moonraker', mqtt: 'bambu', creality: 'moonraker', elegoo: 'moonraker', anker: 'moonraker', voron: 'moonraker', ratrig: 'moonraker', qidi: 'moonraker' };
  const typeKey = TYPE_MAP[baseType] || baseType;
  const base = CAPABILITIES[typeKey] || CAPABILITIES.bambu;

  // Apply model-specific overrides
  const modelOverride = printer.model ? MODEL_OVERRIDES[printer.model] : null;
  if (!modelOverride) return base;

  return deepMerge(base, modelOverride);
}

/**
 * Get the best strategy to get a 3D model for a printer's history entry
 * @param {Object} printer - Printer from DB
 * @param {Object} histRow - History record
 * @returns {{ strategy: string, searchNames: string[] }}
 */
export function getModelStrategy(printer, histRow) {
  const caps = getCapabilities(printer);
  const searchNames = [histRow.model_name, histRow.filename, histRow.gcode_file].filter(Boolean);

  if (caps.modelAccess.method === 'ftps-3mf') {
    return {
      strategy: 'bambu-ftps',
      searchNames,
      hasMesh: caps.modelAccess.hasMeshIn3MF,
      searchDirs: caps.modelAccess.searchDirs,
    };
  }

  if (caps.modelAccess.method === 'moonraker-gcode') {
    return {
      strategy: 'moonraker-gcode',
      searchNames,
      gcodeEndpoint: caps.gcodeAccess.endpoint,
    };
  }

  return { strategy: 'unknown', searchNames };
}

/**
 * Check if a printer type supports a feature
 */
export function hasFeature(printer, feature) {
  const caps = getCapabilities(printer);
  return !!caps.features?.[feature];
}

function deepMerge(target, source) {
  const result = { ...target };
  for (const key of Object.keys(source)) {
    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      result[key] = deepMerge(target[key] || {}, source[key]);
    } else {
      result[key] = source[key];
    }
  }
  return result;
}
