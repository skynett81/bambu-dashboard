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
  'P1S': { camera: { modes: ['rtsp'] } },
  'P1P': { camera: { modes: ['rtsp'] } },
  'X1C': { camera: { modes: ['rtsp'] } },
  'X1E': { camera: { modes: ['rtsp'] } },
  'A1': { camera: { modes: ['jpeg-tls', 'rtsp'] } },
  'A1 mini': { camera: { modes: ['jpeg-tls'] } },
  'P2S': { camera: { modes: ['jpeg-tls', 'rtsp'] } },
  'H2D': { camera: { modes: ['jpeg-tls', 'rtsp'] } },

  // Snapmaker models
  'Snapmaker U1': {
    camera: { modes: ['http-snapshot', 'ssh-sftp'], sshPaths: ['/tmp/.monitor.jpg', '/tmp/printer_detection.jpg'] },
  },
  'Snapmaker J1': { features: { multiExtruder: true, idex: true, dualNozzle: true } },
  'Snapmaker J1s': { features: { multiExtruder: true, idex: true, dualNozzle: true } },
  'Snapmaker Artisan': { features: { multiExtruder: true, enclosure: true, purifier: true, dualNozzle: true } },
  'Snapmaker 2.0 A150': { features: { enclosure: true, multiModule: true } },
  'Snapmaker 2.0 A250': { features: { enclosure: true, multiModule: true } },
  'Snapmaker 2.0 A350': { features: { enclosure: true, multiModule: true } },
  'Snapmaker Ray': { features: { laser: true, multiModule: false }, connection: 'sacp-udp' },

  // Prusa models (PrusaLink)
  'Prusa MK4': { camera: { modes: ['http-snapshot'] }, buildVolume: [250, 210, 220] },
  'Prusa MK3.9': { camera: { modes: ['http-snapshot'] }, buildVolume: [250, 210, 210] },
  'Prusa Mini': { camera: { modes: ['http-snapshot'] }, buildVolume: [180, 180, 180] },
  'Prusa XL': { camera: { modes: ['http-snapshot'] }, buildVolume: [360, 360, 360] },

  // Creality models (Klipper/Moonraker)
  'Creality K1': { camera: { modes: ['http-snapshot'] }, buildVolume: [220, 220, 250] },
  'Creality K1 Max': { camera: { modes: ['http-snapshot'] }, buildVolume: [300, 300, 300] },
  'Creality Ender-3 V3': { camera: { modes: ['http-snapshot'] }, buildVolume: [220, 220, 250] },

  // Elegoo models (Klipper/Moonraker)
  'Elegoo Neptune 4': { camera: { modes: ['http-snapshot'] }, buildVolume: [225, 225, 265] },
  'Elegoo Neptune 4 Pro': { camera: { modes: ['http-snapshot'] }, buildVolume: [225, 225, 265] },
  'Elegoo Neptune 4 Max': { camera: { modes: ['http-snapshot'] }, buildVolume: [420, 420, 480] },

  // Voron (Klipper/Moonraker)
  'Voron 0.2': { camera: { modes: ['http-snapshot'] }, buildVolume: [120, 120, 120] },
  'Voron 2.4': { camera: { modes: ['http-snapshot'] }, buildVolume: [350, 350, 350] },
  'Voron Trident': { camera: { modes: ['http-snapshot'] }, buildVolume: [350, 350, 250] },
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
