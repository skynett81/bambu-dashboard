import { createServer as createHttpServer } from 'node:http';
import { createServer as createHttpsServer } from 'node:https';
import { readFileSync, existsSync, mkdirSync, writeFileSync, chmodSync } from 'node:fs';
import { join, extname, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';
import { config, PUBLIC_DIR, DATA_DIR } from './config.js';
import { WebSocketHub } from './websocket-hub.js';
import { initDatabase, getPrinters, addPrinter as dbAddPrinter } from './database.js';
import { startNightlyBackup } from './backup.js';
import { handleApiRequest, handleAuthApiRequest, setApiBroadcast, setOnPrinterRemoved, setOnPrinterAdded, setOnPrinterUpdated, setOnDemoPurge, setNotifier, setUpdater, setHub, setGuard } from './api-routes.js';
import { isAuthEnabled, getSessionToken, validateSession, isPublicPath, initAuth, shutdownAuth } from './auth.js';
import { PrinterManager } from './printer-manager.js';
import { NotificationManager } from './notifications.js';
import { Updater } from './updater.js';
import { sendTelemetryPing } from './telemetry.js';

const IS_DEMO = process.env.BAMBU_DEMO === 'true';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const CERTS_DIR = join(ROOT, 'certs');

// Auto-generate self-signed SSL certificates if none exist
function ensureSSLCerts() {
  const certPath = join(CERTS_DIR, 'cert.pem');
  const keyPath = join(CERTS_DIR, 'key.pem');
  if (existsSync(certPath) && existsSync(keyPath)) return;

  try {
    if (!existsSync(CERTS_DIR)) mkdirSync(CERTS_DIR, { recursive: true });
    execSync(
      `openssl req -x509 -newkey rsa:2048 -keyout "${keyPath}" -out "${certPath}" ` +
      `-days 365 -nodes -subj "/CN=Bambu Dashboard/O=Local" ` +
      `-addext "subjectAltName=DNS:localhost,IP:127.0.0.1"`,
      { stdio: 'pipe' }
    );
    chmodSync(keyPath, 0o600);
    chmodSync(certPath, 0o644);
    console.log('[security] Auto-genererte SSL-sertifikater (gyldige i 365 dager)');
  } catch {
    console.warn('[security] Kunne ikke generere SSL-sertifikater (openssl ikke tilgjengelig?)');
  }
}
ensureSSLCerts();

// Ensure data directory exists
if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });

// Initialize database
initDatabase();

// Start nightly backup
startNightlyBackup();

// Initialize auth
initAuth();

const MIME_TYPES = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2'
};

const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'SAMEORIGIN',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(self), microphone=(), geolocation=()',
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline'",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "img-src 'self' data: blob: https://*.bblmw.com https://public-cdn.bblmw.com",
    "connect-src 'self' ws: wss:",
    "font-src 'self' https://fonts.gstatic.com",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'"
  ].join('; ')
};

function applyHttpsHeaders(res) {
  if (forceHttps) {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }
}

function applySecurityHeaders(res) {
  for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
    res.setHeader(key, value);
  }
  applyHttpsHeaders(res);
}

function handleRequest(req, res) {
  applySecurityHeaders(res);
  const pathname = req.url.split('?')[0];

  // Public auth API routes (login, logout, status) - always accessible
  if (pathname === '/api/auth/status' || pathname === '/api/auth/login' || pathname === '/api/auth/logout') {
    return handleAuthApiRequest(req, res);
  }

  // If auth is enabled, check session before serving anything else
  if (isAuthEnabled() && !isPublicPath(pathname)) {
    const token = getSessionToken(req);
    if (!validateSession(token)) {
      if (pathname.startsWith('/api/')) {
        res.writeHead(401, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Unauthorized' }));
        return;
      }
      res.writeHead(302, { Location: '/login.html' });
      res.end();
      return;
    }
  }

  if (req.url.startsWith('/api/')) {
    return handleApiRequest(req, res);
  }

  let filePath = join(PUBLIC_DIR, req.url === '/' ? 'index.html' : pathname);

  if (!filePath.startsWith(PUBLIC_DIR)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  if (!existsSync(filePath)) {
    res.writeHead(404);
    res.end('Ikke funnet');
    return;
  }

  const ext = extname(filePath);
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  try {
    const content = readFileSync(filePath);
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(content);
  } catch (e) {
    res.writeHead(500);
    res.end('Serverfeil');
  }
}

// Create servers
const PORT = config.server.port;
const HTTPS_PORT = config.server.httpsPort || 3443;
const certPath = join(CERTS_DIR, 'cert.pem');
const keyPath = join(CERTS_DIR, 'key.pem');
const hasSSL = existsSync(certPath) && existsSync(keyPath);

// Force HTTPS by default when certs are available (unless explicitly disabled)
const forceHttps = hasSSL && config.server.forceHttps !== false;

const httpServer = createHttpServer((req, res) => {
  if (forceHttps) {
    const host = req.headers.host?.replace(`:${PORT}`, `:${HTTPS_PORT}`) || `localhost:${HTTPS_PORT}`;
    res.writeHead(301, { Location: `https://${host}${req.url}` });
    res.end();
    return;
  }
  handleRequest(req, res);
});

let httpsServer = null;
if (hasSSL) {
  const sslOptions = {
    key: readFileSync(keyPath),
    cert: readFileSync(certPath)
  };
  httpsServer = createHttpsServer(sslOptions, handleRequest);
}

// WebSocket hubs
const hub = new WebSocketHub(httpServer);
let hubHttps = null;
if (httpsServer) {
  hubHttps = new WebSocketHub(httpsServer);
}

function broadcastAll(type, data) {
  hub.broadcast(type, data);
  if (hubHttps) hubHttps.broadcast(type, data);
}

function setMetaAll(printerId, meta) {
  hub.setPrinterMeta(printerId, meta);
  if (hubHttps) hubHttps.setPrinterMeta(printerId, meta);
}

// Give API routes access to hub for thumbnail service
setHub(hub);

// Connect API routes to broadcast + sync hub meta
setApiBroadcast((type, data) => {
  // Sync hub printerMeta cache so new connections get fresh data
  if (type === 'printer_meta_update' && data.printers) {
    const newIds = new Set(data.printers.map(p => p.id));
    // Remove deleted printers from hub cache
    for (const id of Object.keys(hub.printerMeta)) {
      if (!newIds.has(id)) {
        hub.removePrinterMeta(id);
        if (hubHttps) hubHttps.removePrinterMeta(id);
      }
    }
    // Update/add printers in hub cache
    for (const p of data.printers) {
      hub.updatePrinterMeta(p.id, { name: p.name, model: p.model || '' });
      if (hubHttps) hubHttps.updatePrinterMeta(p.id, { name: p.name, model: p.model || '' });
    }
  }
  broadcastAll(type, data);
});

// Printer Manager
const manager = new PrinterManager(config, broadcastAll, setMetaAll);
await manager.init();

// Notification Manager
const notifier = new NotificationManager(config.notifications);
notifier.setPrinterListProvider(() =>
  getPrinters().map(p => ({ id: p.id, name: p.name }))
);
manager.setNotificationHandler(notifier);
setNotifier(notifier);
setGuard(manager.guard);

// Updater
const updater = new Updater(config, broadcastAll, notifier, hub);
setUpdater(updater);
if (config.update?.autoCheck !== false) updater.start();

// Demo mode - seed mock printers and run simulations
const demoMockPrinters = [];
if (IS_DEMO) {
  const { MOCK_PRINTERS, MOCK_AMS_P2S, MOCK_AMS_X1C, MOCK_AMS_H2D, MOCK_HISTORY, MOCK_FILAMENT, MOCK_ERRORS } = await import('./demo/mock-data.js');
  const { MockPrinter } = await import('./demo/mock-printer.js');

  // Seed demo printers into DB if not already present
  const existing = getPrinters().map(p => p.id);
  for (const p of MOCK_PRINTERS) {
    if (!existing.includes(p.id)) {
      dbAddPrinter(p);
      console.log(`[demo] Seeded printer: ${p.name}`);
    }
  }

  // Seed demo history if empty — distribute across all printers
  const { addHistory, addFilament, addError, addFirmwareEntry, addXcamEvent } = await import('./database.js');
  const { getHistory } = await import('./database.js');
  const printerIds = MOCK_PRINTERS.map(p => p.id);
  if (getHistory(1, 0, 'demo-p2s').length === 0 && MOCK_HISTORY) {
    for (let i = 0; i < MOCK_HISTORY.length; i++) {
      const h = MOCK_HISTORY[i];
      const pid = printerIds[i % printerIds.length];
      const started = new Date(Date.now() - (h.days_ago || 1) * 86400000).toISOString();
      const finished = new Date(new Date(started).getTime() + (h.duration_seconds || 0) * 1000).toISOString();
      addHistory({
        printer_id: pid, started_at: started, finished_at: finished,
        filename: h.filename, status: h.status, duration_seconds: h.duration_seconds,
        filament_used_g: h.filament_used_g, filament_type: h.filament_type,
        filament_color: h.filament_color, layer_count: h.layer_count,
        filament_brand: h.filament_brand, speed_level: h.speed_level,
        nozzle_target: h.nozzle_target, bed_target: h.bed_target,
        max_nozzle_temp: h.max_nozzle_temp, max_bed_temp: h.max_bed_temp,
        nozzle_type: h.nozzle_type, nozzle_diameter: h.nozzle_diameter,
        color_changes: h.color_changes, waste_g: h.waste_g
      });
    }
    console.log(`[demo] Seeded ${MOCK_HISTORY.length} history records across ${printerIds.length} printers`);
  }

  // Seed filament inventory
  const { getFilament } = await import('./database.js');
  if (getFilament().length === 0 && MOCK_FILAMENT) {
    for (const f of MOCK_FILAMENT) {
      addFilament(f);
    }
    console.log(`[demo] Seeded ${MOCK_FILAMENT.length} filament records`);
  }

  // Seed errors — distribute across printers
  const { getErrors } = await import('./database.js');
  if (getErrors(1, 'demo-p2s').length === 0 && MOCK_ERRORS) {
    for (let i = 0; i < MOCK_ERRORS.length; i++) {
      const e = MOCK_ERRORS[i];
      const pid = printerIds[i % printerIds.length];
      addError({
        printer_id: pid,
        code: e.code, message: e.message, severity: e.severity,
        timestamp: new Date(Date.now() - (e.days_ago || 1) * 86400000).toISOString()
      });
    }
    console.log(`[demo] Seeded ${MOCK_ERRORS.length} error records across ${printerIds.length} printers`);
  }

  // Seed firmware entries for demo printers
  const FIRMWARE_MODULES = {
    'demo-p2s': [
      { module: 'ota', sw_ver: '01.09.01.00', hw_ver: 'AP04' },
      { module: 'mc', sw_ver: '09.01.30.00', hw_ver: '' },
      { module: 'ams', sw_ver: '00.00.06.53', hw_ver: '' }
    ],
    'demo-x1c': [
      { module: 'ota', sw_ver: '01.10.01.00', hw_ver: 'AP05' },
      { module: 'mc', sw_ver: '09.02.10.00', hw_ver: '' },
      { module: 'ams', sw_ver: '00.00.06.55', hw_ver: '' }
    ],
    'demo-h2d': [
      { module: 'ota', sw_ver: '01.08.00.00', hw_ver: 'AP06' },
      { module: 'mc', sw_ver: '09.00.20.00', hw_ver: '' },
      { module: 'ams', sw_ver: '00.00.06.50', hw_ver: '' }
    ]
  };
  for (const p of MOCK_PRINTERS) {
    for (const mod of FIRMWARE_MODULES[p.id] || []) {
      addFirmwareEntry({ printer_id: p.id, module: mod.module, sw_ver: mod.sw_ver, hw_ver: mod.hw_ver, sn: `${p.id}-${mod.module}` });
    }
  }
  console.log('[demo] Seeded firmware entries');

  // Seed protection settings for demo printers
  const { getProtectionSettings, upsertProtectionSettings, addProtectionLog } = await import('./database.js');
  for (const p of MOCK_PRINTERS) {
    if (!getProtectionSettings(p.id)) {
      upsertProtectionSettings(p.id, { enabled: 1, spaghetti_action: 'pause', first_layer_action: 'notify', foreign_object_action: 'pause', nozzle_clump_action: 'pause', cooldown_seconds: 60, auto_resume: 0 });
    }
  }
  // Add a couple demo protection log entries
  const { getProtectionLog } = await import('./database.js');
  if (getProtectionLog('demo-p2s', 1).length === 0) {
    addProtectionLog({ printer_id: 'demo-p2s', event_type: 'spaghetti_detected', action_taken: 'pause', notes: 'Demo event' });
    addProtectionLog({ printer_id: 'demo-x1c', event_type: 'first_layer_issue', action_taken: 'notify', notes: 'Demo event' });
    console.log('[demo] Seeded protection data');
  }

  // AMS data map per printer
  const AMS_MAP = {
    'demo-p2s': MOCK_AMS_P2S,
    'demo-x1c': MOCK_AMS_X1C,
    'demo-h2d': MOCK_AMS_H2D
  };

  // Start mock printers with telemetry sampling and print tracking
  const { TelemetrySampler } = await import('./telemetry-sampler.js');
  const { PrintTracker } = await import('./print-tracker.js');

  for (const p of MOCK_PRINTERS) {
    const mock = new MockPrinter(p.id, AMS_MAP[p.id]);
    const sampler = new TelemetrySampler(p.id, { printInterval: 15000, idleInterval: 120000, batchSize: 5 });
    const tracker = new PrintTracker(p.id);
    setMetaAll(p.id, { name: p.name, model: p.model || '', cameraPort: 0 });

    tracker.onPrintStart = (data) => {
      notifier.notify('print_started', { ...data, printerName: p.name });
    };
    tracker.onPrintEnd = (data) => {
      const eventMap = { completed: 'print_finished', failed: 'print_failed', cancelled: 'print_cancelled' };
      notifier.notify(eventMap[data.status] || 'print_finished', { ...data, printerName: p.name });
    };
    tracker.onError = (data) => {
      notifier.notify('printer_error', { ...data, printerName: p.name });
    };

    // XCam event handler for demo printers
    mock.onXcamEvent = (status) => {
      const eventMap = { 'spaghetti': 'spaghetti_detected', 'first_layer_inspection': 'first_layer_issue' };
      for (const [key, eventType] of Object.entries(eventMap)) {
        if (status.includes(key)) {
          addXcamEvent({ printer_id: p.id, event_type: eventType });
          const printId = tracker.currentPrint?.id || null;
          if (manager.guard) manager.guard.handleEvent(p.id, eventType, printId);
          break;
        }
      }
    };

    mock.onUpdate = (state) => {
      broadcastAll('status', { printer_id: p.id, ...state });
      const printData = state.print || state;
      tracker.update(printData);
      sampler.update(printData);
      notifier.updateBedMonitor(p.id, p.name, printData);
      if (manager.guard) manager.guard.processSensorData(p.id, printData);
    };

    mock.start();
    mock._sampler = sampler;
    mock._tracker = tracker;
    demoMockPrinters.push(mock);
  }

  console.log(`[demo] ${MOCK_PRINTERS.length} mock-printere startet`);
}

// When a printer is added via API, auto-connect via MQTT
setOnPrinterAdded((printerConf) => {
  manager.addPrinter(printerConf);
});

// When a printer is updated via API, reconnect with new config
setOnPrinterUpdated((id, printerConf) => {
  manager.updatePrinter(id, printerConf);
});

// When a printer is deleted via API, stop its services
setOnPrinterRemoved((id) => {
  manager.removePrinter(id);
});

// When demo data is purged, stop mock printers and clean hub meta
setOnDemoPurge((printerIds) => {
  for (const id of printerIds) {
    const idx = demoMockPrinters.findIndex(m => m.id === id);
    if (idx !== -1) {
      demoMockPrinters[idx].stop();
      if (demoMockPrinters[idx]._sampler) demoMockPrinters[idx]._sampler.stop();
      if (demoMockPrinters[idx]._tracker) demoMockPrinters[idx]._tracker.stop?.();
      demoMockPrinters.splice(idx, 1);
    }
    hub.removePrinterMeta(id);
    if (hubHttps) hubHttps.removePrinterMeta(id);
  }
  console.log(`[demo] Purged ${printerIds.length} mock printers`);
});

// Command routing
function commandHandler(msg) {
  // Route to demo mock printers if in demo mode
  if (IS_DEMO) {
    const mock = demoMockPrinters.find(m => m.id === msg.printer_id);
    if (mock) {
      mock.handleCommand(msg);
      return;
    }
  }
  manager.handleCommand(msg);
}
hub.onCommand = commandHandler;
if (hubHttps) hubHttps.onCommand = commandHandler;

// Graceful shutdown
function shutdown() {
  shutdownAuth();
  for (const mock of demoMockPrinters) mock.stop();
  updater.shutdown();
  notifier.shutdown();
  manager.shutdown();
  process.exit(0);
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

// Start servers
httpServer.listen(PORT, () => {
  const printerCount = manager.getPrinterIds().length + (IS_DEMO ? demoMockPrinters.length : 0);
  console.log('');
  console.log('  ╔══════════════════════════════════════════════╗');
  console.log(`  ║   Bambu Dashboard v${updater.currentVersion.padEnd(26)}║`);
  if (forceHttps) {
    console.log(`  ║   HTTPS: https://localhost:${HTTPS_PORT}                ║`);
    console.log(`  ║   HTTP → HTTPS redirect aktiv               ║`);
  } else {
    console.log(`  ║   HTTP:  http://localhost:${PORT}                  ║`);
    if (hasSSL) {
      console.log(`  ║   HTTPS: https://localhost:${HTTPS_PORT}                ║`);
    } else {
      console.log('  ║   ⚠ Ingen SSL-sertifikater funnet            ║');
    }
  }
  console.log(`  ║   Printere: ${printerCount}                              ║`);
  console.log('  ╚══════════════════════════════════════════════╝');
  console.log('');

  // Send anonymous telemetry ping (fire-and-forget)
  sendTelemetryPing();
});

if (httpsServer) {
  httpsServer.listen(HTTPS_PORT, () => {
    console.log(`[server] HTTPS aktiv på port ${HTTPS_PORT}`);
  });
}
