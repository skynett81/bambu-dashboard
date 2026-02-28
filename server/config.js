import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const CONFIG_PATH = join(ROOT, 'config.json');

const DEFAULTS = {
  printers: [],
  auth: {
    enabled: false,
    password: '',
    username: '',
    users: [],
    sessionDurationHours: 24
  },
  server: { port: 3000, httpsPort: 3443, cameraWsPortStart: 9001, forceHttps: false },
  camera: { enabled: true, resolution: '640x480', framerate: 15, bitrate: '1000k' },
  notifications: {
    enabled: false,
    channels: {
      telegram:  { enabled: false, botToken: '', chatId: '' },
      discord:   { enabled: false, webhookUrl: '' },
      email:     { enabled: false, host: '', port: 587, user: '', pass: '', from: '', to: '' },
      webhook:   { enabled: false, url: '', headers: {} },
      ntfy:      { enabled: false, serverUrl: 'https://ntfy.sh', topic: '', token: '' },
      pushover:  { enabled: false, apiToken: '', userKey: '' }
    },
    events: {
      print_started:   { enabled: true,  channels: ['telegram','discord','email','webhook','ntfy','pushover'] },
      print_finished:  { enabled: true,  channels: ['telegram','discord','email','webhook','ntfy','pushover'] },
      print_failed:    { enabled: true,  channels: ['telegram','discord','email','webhook','ntfy','pushover'] },
      print_cancelled: { enabled: true,  channels: ['telegram','discord','email','webhook','ntfy','pushover'] },
      printer_error:   { enabled: true,  channels: ['telegram','discord','email','webhook','ntfy','pushover'] },
      maintenance_due: { enabled: false, channels: ['telegram','discord','email','webhook','ntfy','pushover'] },
      bed_cooled:        { enabled: false, channels: ['telegram','discord','email','webhook','ntfy','pushover'] },
      update_available:  { enabled: true,  channels: ['telegram','discord','email','webhook','ntfy','pushover'] }
    },
    quietHours: { enabled: false, start: '23:00', end: '07:00' },
    bedCooledThreshold: 30
  },
  spoolman: {
    enabled: false,
    url: ''
  },
  update: {
    autoCheck: true,
    checkIntervalHours: 6,
    includePrerelease: false,
    githubToken: ''
  }
};

function migrateLegacyConfig(config) {
  // Migrate old single-printer format to new printers array
  if (config.printer && !config.printers) {
    config.printers = [];
    if (config.printer.ip || config.printer.serial) {
      config.printers.push({
        id: 'default',
        name: 'Printer',
        ip: config.printer.ip || '',
        serial: config.printer.serial || '',
        accessCode: config.printer.accessCode || '',
        model: ''
      });
    }
    delete config.printer;
  }
  // Migrate cameraWsPort -> cameraWsPortStart
  if (config.server?.cameraWsPort && !config.server?.cameraWsPortStart) {
    config.server.cameraWsPortStart = config.server.cameraWsPort;
    delete config.server.cameraWsPort;
  }
  return config;
}

function loadConfig() {
  let config = structuredClone(DEFAULTS);

  if (existsSync(CONFIG_PATH)) {
    try {
      let file = JSON.parse(readFileSync(CONFIG_PATH, 'utf-8'));
      file = migrateLegacyConfig(file);
      config = deepMerge(config, file);
    } catch (e) {
      console.warn('[config] Kunne ikke lese config.json:', e.message);
    }
  }

  // Env overrides (adds/overrides first printer)
  if (process.env.BAMBU_IP || process.env.BAMBU_SERIAL) {
    if (config.printers.length === 0) {
      config.printers.push({ id: 'default', name: 'Printer', ip: '', serial: '', accessCode: '', model: '' });
    }
    if (process.env.BAMBU_IP) config.printers[0].ip = process.env.BAMBU_IP;
    if (process.env.BAMBU_SERIAL) config.printers[0].serial = process.env.BAMBU_SERIAL;
    if (process.env.BAMBU_ACCESS_CODE) config.printers[0].accessCode = process.env.BAMBU_ACCESS_CODE;
  }
  if (process.env.PORT) config.server.port = parseInt(process.env.PORT);
  if (process.env.SERVER_PORT) config.server.port = parseInt(process.env.SERVER_PORT);
  if (process.env.GITHUB_TOKEN) config.update.githubToken = process.env.GITHUB_TOKEN;

  // Auth env overrides
  if (process.env.BAMBU_AUTH_PASSWORD) {
    config.auth.password = process.env.BAMBU_AUTH_PASSWORD;
    config.auth.enabled = true;
  }
  if (process.env.BAMBU_AUTH_USERNAME) {
    config.auth.username = process.env.BAMBU_AUTH_USERNAME;
  }

  return config;
}

export function saveConfig(updates) {
  let current = {};
  if (existsSync(CONFIG_PATH)) {
    try {
      current = JSON.parse(readFileSync(CONFIG_PATH, 'utf-8'));
    } catch (e) { /* start fresh */ }
  }
  const merged = deepMerge(current, updates);
  writeFileSync(CONFIG_PATH, JSON.stringify(merged, null, 2));
  return merged;
}

function deepMerge(target, source) {
  const result = { ...target };
  for (const key of Object.keys(source)) {
    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      result[key] = deepMerge(result[key] || {}, source[key]);
    } else {
      result[key] = source[key];
    }
  }
  return result;
}

export const config = loadConfig();
export const ROOT_DIR = ROOT;
export const PUBLIC_DIR = join(ROOT, 'public');
export const DATA_DIR = join(ROOT, 'data');
