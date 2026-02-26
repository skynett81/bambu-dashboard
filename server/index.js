import { createServer as createHttpServer } from 'node:http';
import { createServer as createHttpsServer } from 'node:https';
import { readFileSync, existsSync, mkdirSync } from 'node:fs';
import { join, extname, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { config, PUBLIC_DIR, DATA_DIR } from './config.js';
import { WebSocketHub } from './websocket-hub.js';
import { initDatabase, getPrinters, addPrinter as dbAddPrinter } from './database.js';
import { handleApiRequest, setApiBroadcast, setOnPrinterRemoved, setOnPrinterAdded, setOnPrinterUpdated, setOnDemoPurge } from './api-routes.js';
import { PrinterManager } from './printer-manager.js';

const IS_DEMO = process.env.BAMBU_DEMO === 'true';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const CERTS_DIR = join(ROOT, 'certs');

// Ensure data directory exists
if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });

// Initialize database
initDatabase();

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

function handleRequest(req, res) {
  if (req.url.startsWith('/api/')) {
    return handleApiRequest(req, res);
  }

  let filePath = join(PUBLIC_DIR, req.url === '/' ? 'index.html' : req.url.split('?')[0]);

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

const httpServer = createHttpServer((req, res) => {
  if (hasSSL && config.server.forceHttps) {
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

  // Seed demo history if empty
  const { addHistory, addFilament, addError } = await import('./database.js');
  const { getHistory } = await import('./database.js');
  if (getHistory(1, 0, 'demo-p2s').length === 0 && MOCK_HISTORY) {
    for (const h of MOCK_HISTORY) {
      const started = new Date(Date.now() - (h.days_ago || 1) * 86400000).toISOString();
      const finished = new Date(new Date(started).getTime() + (h.duration_seconds || 0) * 1000).toISOString();
      addHistory({
        printer_id: 'demo-p2s', started_at: started, finished_at: finished,
        filename: h.filename, status: h.status, duration_seconds: h.duration_seconds,
        filament_used_g: h.filament_used_g, filament_type: h.filament_type,
        filament_color: h.filament_color, layer_count: h.layer_count
      });
    }
    console.log(`[demo] Seeded ${MOCK_HISTORY.length} history records`);
  }

  // Seed filament inventory
  const { getFilament } = await import('./database.js');
  if (getFilament().length === 0 && MOCK_FILAMENT) {
    for (const f of MOCK_FILAMENT) {
      addFilament(f);
    }
    console.log(`[demo] Seeded ${MOCK_FILAMENT.length} filament records`);
  }

  // Seed errors
  const { getErrors } = await import('./database.js');
  if (getErrors(1, 'demo-p2s').length === 0 && MOCK_ERRORS) {
    for (const e of MOCK_ERRORS) {
      addError({
        printer_id: 'demo-p2s',
        code: e.code, message: e.message, severity: e.severity,
        timestamp: new Date(Date.now() - (e.days_ago || 1) * 86400000).toISOString()
      });
    }
    console.log(`[demo] Seeded ${MOCK_ERRORS.length} error records`);
  }

  // AMS data map per printer
  const AMS_MAP = {
    'demo-p2s': MOCK_AMS_P2S,
    'demo-x1c': MOCK_AMS_X1C,
    'demo-h2d': MOCK_AMS_H2D
  };

  // Start mock printers with telemetry sampling
  const { TelemetrySampler } = await import('./telemetry-sampler.js');

  for (const p of MOCK_PRINTERS) {
    const mock = new MockPrinter(p.id, AMS_MAP[p.id]);
    const sampler = new TelemetrySampler(p.id, { printInterval: 10000, idleInterval: 30000, batchSize: 5 });
    setMetaAll(p.id, { name: p.name, model: p.model || '', cameraPort: 0 });

    mock.onUpdate = (state) => {
      broadcastAll('status', { printer_id: p.id, ...state });
      const printData = state.print || state;
      sampler.update(printData);
    };

    mock.start();
    mock._sampler = sampler;
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
  for (const mock of demoMockPrinters) mock.stop();
  manager.shutdown();
  process.exit(0);
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

// Start servers
httpServer.listen(PORT, () => {
  const printerCount = manager.getPrinterIds().length;
  console.log('');
  console.log('  ╔══════════════════════════════════════════════╗');
  console.log('  ║   Bambu Dashboard                             ║');
  console.log(`  ║   HTTP:  http://localhost:${PORT}                  ║`);
  if (hasSSL) {
    console.log(`  ║   HTTPS: https://localhost:${HTTPS_PORT}                ║`);
  }
  console.log(`  ║   Printere: ${printerCount}                              ║`);
  console.log('  ╚══════════════════════════════════════════════╝');
  console.log('');
});

if (httpsServer) {
  httpsServer.listen(HTTPS_PORT, () => {
    console.log(`[server] HTTPS aktiv pa port ${HTTPS_PORT}`);
  });
}
