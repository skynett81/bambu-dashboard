import { createServer as createHttpServer } from 'node:http';
import { createServer as createHttpsServer } from 'node:https';
import { readFileSync, existsSync, mkdirSync, writeFileSync, chmodSync, createReadStream, statSync } from 'node:fs';
import { join, extname, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';
import { networkInterfaces, hostname } from 'node:os';
import { config, PUBLIC_DIR, DATA_DIR } from './config.js';
import { WebSocketHub } from './websocket-hub.js';
import { initDatabase, getPrinters, addPrinter as dbAddPrinter, getSpoolsDryingStatus, getLowStockSpools, getInventorySetting, setInventorySetting, getPushSubscriptions, deletePushSubscriptionById, autoTrashEmptySpools } from './database.js';
import { startNightlyBackup } from './backup.js';
import { handleApiRequest, handleAuthApiRequest, setApiBroadcast, setOnPrinterRemoved, setOnPrinterAdded, setOnPrinterUpdated, setOnDemoPurge, setNotifier, setUpdater, setHub, setGuard, setQueueManager, setTimelapseService, setEcomLicense, setPrinterManager, setFailureDetector, setDiscovery, setBambuCloud, setMaterialRecommender, setWearPrediction, setErrorPatternAnalyzer, setPluginManager, dispatchWebhooksForEvent } from './api-routes.js';
import { PluginManager } from './plugin-manager.js';
import { PrinterDiscovery, testMqttConnection } from './printer-discovery.js';
import { BambuCloud } from './bambu-cloud.js';
import { EcomLicenseManager } from './ecom-license.js';
import { isAuthEnabled, getSessionToken, validateSession, isPublicPath, initAuth, shutdownAuth, validateApiKey, getSessionUser } from './auth.js';
import { PrinterManager } from './printer-manager.js';
import { NotificationManager } from './notifications.js';
import { Updater } from './updater.js';
import { sendTelemetryPing } from './telemetry.js';
import { QueueManager } from './queue-manager.js';
import { TimelapseService } from './timelapse-service.js';
import { initEnergyService } from './energy-service.js';
import { initPowerMonitor, onPrintStart, onPrintEnd } from './power-monitor.js';
import { captureMilestone, archivePrintMilestones, setFrameProvider } from './milestone-service.js';
import { initReportService } from './report-service.js';
import { FailureDetectionService } from './failure-detection.js';
import { buildPauseCommand, buildBuzzerCommands } from './mqtt-commands.js';
import { initHaDiscovery, onPrinterStateUpdate, shutdownHaDiscovery } from './ha-discovery.js';
import { initRemoteNodes, shutdownRemoteNodes } from './remote-nodes.js';
import { MaterialRecommenderService } from './material-recommender.js';
import { createLogger } from './logger.js';
const log = createLogger('server');

let IS_DEMO = process.env.BAMBU_DEMO === 'true';

// First-run experience: no printers configured and not explicitly demo mode
if (!IS_DEMO && config.printers.length === 0 && process.stdin.isTTY) {
  const { createInterface } = await import('node:readline');
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  const ask = (q) => new Promise(resolve => rl.question(q, resolve));

  console.log('');
  console.log('  ┌──────────────────────────────────────────┐');
  console.log('  │  Welcome to 3DPrintForge!                │');
  console.log('  │  No printers configured yet.             │');
  console.log('  └──────────────────────────────────────────┘');
  console.log('');
  console.log('  1) Search for printers on the network');
  console.log('  2) Add printer manually');
  console.log('  3) Start without printers (configure via web UI)');
  console.log('');
  console.log('  Tip: Use "npm run demo" to test with simulated printers.');
  console.log('');

  const choice = (await ask('  Choose (1-3): ')).trim();

  if (choice === '1') {
    // Network scan for Bambu printers via SSDP
    console.log('');
    console.log('  Searching for Bambu Lab printers on the network...');
    const { PrinterDiscovery } = await import('./printer-discovery.js');
    const scanner = new PrinterDiscovery();
    const found = await scanner.scan(6000);
    scanner.shutdown();

    if (found.length === 0) {
      console.log('  No printers found. Make sure the printer is on and connected to the same network.');
      console.log('  You can add printers manually via the web UI after startup.');
    } else {
      console.log(`  Found ${found.length} printer${found.length > 1 ? 's' : ''}:`);
      console.log('');
      for (let i = 0; i < found.length; i++) {
        const p = found[i];
        console.log(`  ${i + 1}) ${p.name || p.serial} — ${p.model} (${p.ip})`);
      }
      console.log('');

      const sel = (await ask(`  Add all? (y/n): `)).trim().toLowerCase();
      if (sel === 'y' || sel === 'j') {
        const { saveConfig } = await import('./config.js');
        const printers = found.map(p => ({
          id: p.name?.toLowerCase().replace(/[^a-z0-9]+/g, '-') || p.serial,
          name: p.name || p.serial,
          ip: p.ip,
          serial: p.serial,
          accessCode: '',
          model: p.model,
          type: 'bambu'
        }));

        // Ask for access codes
        for (const printer of printers) {
          const code = (await ask(`  Access code for ${printer.name} (${printer.ip}): `)).trim();
          printer.accessCode = code;
        }

        saveConfig({ printers });
        // Reload config with new printers
        config.printers = printers;
        console.log(`  ${printers.length} printer${printers.length > 1 ? 's' : ''} added to config.json`);
      }
    }
  } else if (choice === '2') {
    // Manual printer setup
    const { saveConfig } = await import('./config.js');
    console.log('');
    console.log('  Supported types: bambu, moonraker');
    const type = (await ask('  Type (bambu/moonraker): ')).trim().toLowerCase() || 'bambu';
    const name = (await ask('  Name: ')).trim();
    const ip = (await ask('  IP address: ')).trim();
    const id = name.toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'printer-1';

    const printer = { id, name, ip, type };

    if (type === 'bambu') {
      printer.serial = (await ask('  Serial number: ')).trim();
      printer.accessCode = (await ask('  Access code: ')).trim();
      printer.model = (await ask('  Model (e.g. P2S, X1C, A1): ')).trim();
    } else {
      printer.port = parseInt((await ask('  Port (default 80): ')).trim()) || 80;
    }

    saveConfig({ printers: [printer] });
    config.printers = [printer];
    console.log(`  ${name} added to config.json`);
  }
  // choice === '3' or anything else: start normally without printers

  rl.close();
  console.log('');
}

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const CERTS_DIR = join(ROOT, 'certs');

// Collect all local IP addresses for SSL SAN and display
function getLocalAddresses() {
  const ips = new Set(['127.0.0.1']);
  const names = new Set(['localhost']);
  try { names.add(hostname()); } catch {}
  const ifaces = networkInterfaces();
  for (const list of Object.values(ifaces)) {
    for (const iface of list) {
      if (iface.internal) continue;
      ips.add(iface.address);
    }
  }
  return { ips: [...ips], names: [...names] };
}

// Auto-generate self-signed SSL certificates if none exist or SANs are incomplete
function ensureSSLCerts() {
  const certPath = join(CERTS_DIR, 'cert.pem');
  const keyPath = join(CERTS_DIR, 'key.pem');

  // Check if existing cert covers all current IPs
  if (existsSync(certPath) && existsSync(keyPath)) {
    try {
      const san = execSync(`openssl x509 -in "${certPath}" -noout -ext subjectAltName 2>/dev/null`, { encoding: 'utf8' });
      const { ips } = getLocalAddresses();
      const allCovered = ips.every(ip => san.includes(`IP:${ip}`) || san.includes(`IP Address:${ip}`));
      if (allCovered && san.includes('DNS:')) return; // cert is good
      log.info('SSL certificate missing SANs for current network — regenerating');
    } catch {
      log.info('SSL certificate SANs could not be verified — regenerating');
    }
  }

  try {
    if (!existsSync(CERTS_DIR)) mkdirSync(CERTS_DIR, { recursive: true });
    const { ips, names } = getLocalAddresses();
    const sanParts = names.map(n => `DNS:${n}`).concat(ips.map(ip => `IP:${ip}`));
    execSync(
      `openssl req -x509 -newkey rsa:2048 -keyout "${keyPath}" -out "${certPath}" ` +
      `-days 365 -nodes -subj "/CN=3DPrintForge/O=Local" ` +
      `-addext "subjectAltName=${sanParts.join(',')}"`,
      { stdio: 'pipe' }
    );
    chmodSync(keyPath, 0o600);
    chmodSync(certPath, 0o644);
    log.info(`Auto-generated SSL certificates (SAN: ${sanParts.join(', ')})`);
  } catch {
    log.warn('Could not generate SSL certificates (openssl not available?)');
  }
}
ensureSSLCerts();

// Ensure data directory exists
if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });

// Initialize database
initDatabase();

// Start nightly backup
startNightlyBackup();

// Auto-trash empty spools (run on startup + every 24h)
try { autoTrashEmptySpools(); } catch (e) { log.error('Auto-trash startup error: ' + e.message); }
const _autoTrashInterval = setInterval(() => { try { autoTrashEmptySpools(); } catch (e) { log.error('Auto-trash error: ' + e.message); } }, 24 * 60 * 60 * 1000);

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
  '.woff2': 'font/woff2',
  '.wasm': 'application/wasm',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.map': 'application/json'
};

const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'SAMEORIGIN',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(self), microphone=(), geolocation=(), interest-cohort=()',
  'Content-Security-Policy': [
    "default-src 'self'",
    // unsafe-inline required: frontend uses inline onclick handlers in 100+ IIFE components
    // unsafe-eval removed: lib3mf WASM only needs wasm-unsafe-eval
    "script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval'",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdn.jsdelivr.net",
    "img-src 'self' data: blob: https:",
    "connect-src 'self' ws: wss: https://open.er-api.com",
    "font-src 'self' https://fonts.gstatic.com https://cdn.jsdelivr.net",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-src 'self'",
    "frame-ancestors 'self'",
    "worker-src 'self' blob:",
    "upgrade-insecure-requests"
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

function handleCors(req, res) {
  const origin = req.headers.origin;
  if (!origin) return false;

  // Allow configured origins or * for API key-authenticated requests
  const allowedOrigins = config.server.corsOrigins || [];
  if (allowedOrigins.length === 0) return false; // CORS disabled by default

  const allowed = allowedOrigins.includes('*') || allowedOrigins.includes(origin);
  if (!allowed) return false;

  res.setHeader('Access-Control-Allow-Origin', allowedOrigins.includes('*') ? '*' : origin);
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-API-Key');
  res.setHeader('Access-Control-Max-Age', '86400');
  res.setHeader('Vary', 'Origin');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return true;
  }
  return false;
}

function handleRequest(req, res) {
  const reqPath = req.url.split('?')[0];
  // Skip dashboard CSP for docs pages — Docusaurus has its own CSP via meta tag
  if (!reqPath.startsWith('/docs')) {
    applySecurityHeaders(res);
  } else {
    // Minimal headers for docs (no CSP — let Docusaurus meta tag handle it)
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    applyHttpsHeaders(res);
  }

  // Request logging
  const reqStart = Date.now();
  const origEnd = res.end.bind(res);
  res.end = function(...args) {
    const duration = Date.now() - reqStart;
    const pathname = req.url.split('?')[0];
    // Only log API requests and slow static file requests
    if (pathname.startsWith('/api/') || duration > 500) {
      log.info(`${req.method} ${pathname} ${res.statusCode} ${duration}ms`);
    }
    return origEnd(...args);
  };

  // CORS handling for API routes
  if (req.url.startsWith('/api/') && handleCors(req, res)) return;

  const pathname = req.url.split('?')[0];

  // CSRF protection — validate Origin header on state-changing requests
  if (req.url.startsWith('/api/') && req.method !== 'GET' && req.method !== 'HEAD' && req.method !== 'OPTIONS') {
    const origin = req.headers.origin;
    const referer = req.headers.referer;
    // API key requests bypass CSRF (they authenticate via header, not cookies)
    const hasApiKey = req.headers.authorization?.startsWith('Bearer ') || req.headers['x-api-key'];
    if (!hasApiKey && origin) {
      const host = req.headers.host;
      try {
        const originHost = new URL(origin).host;
        if (originHost !== host) {
          res.writeHead(403, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'CSRF validation failed: origin mismatch' }));
          return;
        }
      } catch {
        // Malformed origin header
        res.writeHead(403, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'CSRF validation failed: invalid origin' }));
        return;
      }
    }
  }

  // Public auth API routes (login, logout, status) - always accessible
  if (pathname === '/api/auth/status' || pathname === '/api/auth/login' || pathname === '/api/auth/logout') {
    return handleAuthApiRequest(req, res);
  }

  // If auth is enabled, check session or API key before serving anything else
  if (isAuthEnabled() && !isPublicPath(pathname)) {
    const token = getSessionToken(req);
    const apiKey = pathname.startsWith('/api/') ? validateApiKey(req) : null;
    const sessionValid = validateSession(token);
    if (!sessionValid && !apiKey) {
      if (pathname.startsWith('/api/')) {
        res.writeHead(401, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Unauthorized' }));
        return;
      }
      res.writeHead(302, { Location: '/login.html' });
      res.end();
      return;
    }
    // Inject user data onto request for permission checking
    if (sessionValid) {
      req._user = getSessionUser(token);
    } else if (apiKey) {
      req._user = {
        username: apiKey.name,
        userId: apiKey.user_id || null,
        permissions: typeof apiKey.permissions === 'string' ? JSON.parse(apiKey.permissions) : (apiKey.permissions || ['*']),
        _fromApiKey: true
      };
    }
  }

  if (req.url.startsWith('/api/') || pathname.startsWith('/app/download')) {
    return handleApiRequest(req, res);
  }

  // /app → app download page
  if (pathname === '/app') {
    res.writeHead(302, { Location: '/app.html' });
    res.end();
    return;
  }

  // Print labels route (not under /api/)
  if (pathname.startsWith('/print/labels')) {
    return handleApiRequest(req, res);
  }

  // Serve AdminLTE static files from node_modules
  if (pathname.startsWith('/adminlte/')) {
    const ADMINLTE_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'node_modules', 'admin-lte', 'dist');
    const relative = pathname.replace(/^\/adminlte\//, '');
    const filePath = join(ADMINLTE_DIR, relative);
    if (!filePath.startsWith(ADMINLTE_DIR)) {
      res.writeHead(403);
      res.end('Forbidden');
      return;
    }
    if (existsSync(filePath)) {
      const ext = extname(filePath);
      const ct = MIME_TYPES[ext] || 'application/octet-stream';
      res.writeHead(200, { 'Content-Type': ct, 'Cache-Control': 'public, max-age=86400' });
      createReadStream(filePath).pipe(res);
      return;
    }
    res.writeHead(404);
    res.end('Not found');
    return;
  }

  // Serve Docusaurus documentation from /docs/
  // Build structure: build/assets/ (static), build/docs/ (pages), build/blog/, build/img/
  // URL /docs/X maps to build/X (assets, img, blog) or build/docs/X (doc pages)
  const DOCS_BUILD = join(dirname(fileURLToPath(import.meta.url)), '..', 'website', 'build');
  if (pathname.startsWith('/docs') && existsSync(DOCS_BUILD)) {
    const relative = pathname.replace(/^\/docs\/?/, '') || '';

    const _tryServe = (filePath) => {
      if (!filePath.startsWith(DOCS_BUILD)) return false;
      try {
        const stat = statSync(filePath, { throwIfNoEntry: false });
        // If it's a directory, try index.html inside
        if (stat?.isDirectory()) {
          filePath = join(filePath, 'index.html');
          if (!existsSync(filePath)) return false;
        } else if (!stat) {
          // Try with .html extension (trailingSlash: false generates .html files)
          if (!extname(filePath) && existsSync(filePath + '.html')) {
            filePath = filePath + '.html';
          } else {
            return false;
          }
        }
      } catch { return false; }
      const ext = extname(filePath);
      const ct = MIME_TYPES[ext] || 'application/octet-stream';
      const cache = ['.js', '.css', '.woff2', '.png', '.svg', '.jpg', '.jpeg'].includes(ext) ? 'public, max-age=86400' : 'no-cache';
      res.writeHead(200, { 'Content-Type': ct, 'Cache-Control': cache });
      createReadStream(filePath).pipe(res);
      return true;
    };

    // Try build/{relative} — all docs and assets are directly in build root
    if (_tryServe(join(DOCS_BUILD, relative))) return;

    // /docs/ root → redirect to /docs/intro
    if (!relative) {
      res.writeHead(302, { 'Location': '/docs/intro' });
      res.end();
      return;
    }

    // SPA fallback — use 404.html for client-side routing
    const fallback = join(DOCS_BUILD, '404.html');
    if (existsSync(fallback)) {
      res.writeHead(200, { 'Content-Type': 'text/html', 'Cache-Control': 'no-cache' });
      return createReadStream(fallback).pipe(res);
    }
  }

  let filePath = join(PUBLIC_DIR, req.url === '/' ? 'index.html' : pathname);

  if (!filePath.startsWith(PUBLIC_DIR)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  if (!existsSync(filePath)) {
    res.writeHead(404);
    res.end('Not found');
    return;
  }

  // Directory → index.html (for 3mf-viewer etc.)
  try {
    if (statSync(filePath).isDirectory()) {
      const indexPath = join(filePath, 'index.html');
      if (existsSync(indexPath)) filePath = indexPath;
      else { res.writeHead(404); res.end('Not found'); return; }
    }
  } catch {}

  const ext = extname(filePath);
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  try {
    const content = readFileSync(filePath);
    const headers = { 'Content-Type': contentType };
    // No-cache for dev assets so changes are seen immediately
    if (['.css', '.js', '.html'].includes(ext)) {
      headers['Cache-Control'] = 'no-cache, no-store, must-revalidate';
      headers['Pragma'] = 'no-cache';
    }
    res.writeHead(200, headers);
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
    const reqHost = req.headers.host || req.socket.localAddress || 'localhost';
    const host = reqHost.replace(`:${PORT}`, '') .replace(/:\d+$/, '') + `:${HTTPS_PORT}`;
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
  // Forward printer state to HA MQTT discovery
  if (type === 'status' && data.printer_id) {
    onPrinterStateUpdate(data.printer_id, data);
  }
}

function setMetaAll(printerId, meta) {
  hub.setPrinterMeta(printerId, meta);
  if (hubHttps) hubHttps.setPrinterMeta(printerId, meta);
}

// Give API routes access to hub for thumbnail service
setHub(hub);

// Wire thumbnail cache to PrintTracker for history thumbnail saving
import('./thumbnail-service.js').then(({ getThumbnailCache }) => {
  import('./print-tracker.js').then(({ PrintTracker }) => {
    PrintTracker._thumbCacheRef = getThumbnailCache();
  });
}).catch(e => log.warn('Failed to wire thumbnail cache', e.message));

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
manager.startAutoRediscovery();

// Wire printer manager ref to PrintTracker for Moonraker thumbnail fetching
import('./print-tracker.js').then(({ PrintTracker }) => {
  PrintTracker._printerManagerRef = manager;
}).catch(() => {});

// Notification Manager
const notifier = new NotificationManager(config.notifications);
notifier.setPrinterListProvider(() =>
  getPrinters().map(p => ({ id: p.id, name: p.name }))
);
notifier.setDryingStatusProvider(() => getSpoolsDryingStatus());
notifier.setLowStockProvider(() => {
  const threshold = parseInt(getInventorySetting('low_stock_threshold') || '20');
  const thresholdG = parseInt(getInventorySetting('near_empty_grams') || '0');
  return getLowStockSpools(threshold, thresholdG);
});
notifier.setWebhookDispatcher(dispatchWebhooksForEvent);
manager.setNotificationHandler(notifier);
setNotifier(notifier);
setGuard(manager.guard);

// Updater
const updater = new Updater(config, broadcastAll, notifier, hub);
setUpdater(updater);
if (config.update?.autoCheck !== false) updater.start();

// Queue Manager
const queueManager = new QueueManager(manager, notifier, broadcastAll, null); // failureDetector set below
queueManager.init();
setQueueManager(queueManager);

// Timelapse Service
const timelapseService = new TimelapseService();
timelapseService.init();
setTimelapseService(timelapseService);

// Energy Service (Tibber / Nordpool)
initEnergyService();

// Power Monitor (Shelly / Tasmota smart plugs)
initPowerMonitor();

// Report Service (weekly/monthly)
initReportService();

// Home Assistant MQTT Discovery
initHaDiscovery(hub);

// Remote Node Linking
initRemoteNodes(hub, broadcastAll);

// E-Commerce License Manager
const ecomLicense = new EcomLicenseManager();
await ecomLicense.init();
setEcomLicense(ecomLicense);

// AI Failure Detection Service
const failureDetector = new FailureDetectionService(manager, notifier, (type, data) => hub.broadcast(type, data));
failureDetector.init();
queueManager._failureDetector = failureDetector;
setPrinterManager(manager);
setFailureDetector(failureDetector);

// Milestone frame provider — fetches latest camera frame for instant screenshots
setFrameProvider((printerId) => {
  const entry = manager.printers.get(printerId);
  // Bambu camera or Moonraker camera snapshot
  return entry?.camera?.getLastFrame() || entry?.moonCamera?.getSnapshot() || null;
});

// Printer Discovery (SSDP)
const discovery = new PrinterDiscovery();
setDiscovery(discovery, testMqttConnection);

// Bambu Lab Cloud
const bambuCloud = new BambuCloud();
setBambuCloud(bambuCloud);

// Material Recommender Service
const materialRecommender = new MaterialRecommenderService(broadcastAll);
setMaterialRecommender(materialRecommender);
// Initial calculation after a short delay, then every 12 hours
setTimeout(() => { try { materialRecommender.recalculate(); log.info('Material-rec: initial calculation completed'); } catch (e) { log.error('Material-rec error: ' + e.message); } }, 5000);
const _materialRecInterval = setInterval(() => { try { materialRecommender.recalculate(); } catch (e) { log.error('Material-rec periodic error: ' + e.message); } }, 12 * 60 * 60 * 1000);

// Wear Prediction Service
import { WearPredictionService } from './wear-prediction.js';
const wearPrediction = new WearPredictionService(broadcastAll);
wearPrediction.init();
setWearPrediction(wearPrediction);

// Error Pattern Analyzer
import { ErrorPatternAnalyzer } from './error-pattern-analyzer.js';
const errorPatternAnalyzer = new ErrorPatternAnalyzer(broadcastAll);
setErrorPatternAnalyzer(errorPatternAnalyzer);
// Initial analysis after 10s delay, then daily recalculation
setTimeout(() => { try { errorPatternAnalyzer.analyze(); log.info('Error-analysis: initial analysis completed'); } catch (e) { log.error('Error-analysis error: ' + e.message); } }, 10000);
const _errorPatternInterval = setInterval(() => { try { errorPatternAnalyzer.analyze(); } catch (e) { log.error('Error-analysis periodic error: ' + e.message); } }, 24 * 60 * 60 * 1000);

// Plugin Manager
const pluginManager = new PluginManager({ broadcast: broadcastAll, dataDir: DATA_DIR, notifier });
await pluginManager.init();
setPluginManager(pluginManager);

// Generate VAPID keys for Web Push if not yet set
if (!getInventorySetting('vapid_public_key')) {
  try {
    const { generateKeyPairSync } = await import('node:crypto');
    const { publicKey, privateKey } = generateKeyPairSync('ec', { namedCurve: 'prime256v1' });
    const pubRaw = publicKey.export({ type: 'spki', format: 'der' });
    const privRaw = privateKey.export({ type: 'pkcs8', format: 'der' });
    setInventorySetting('vapid_public_key', pubRaw.subarray(-65).toString('base64url'));
    setInventorySetting('vapid_private_key', privRaw.subarray(-32).toString('base64url'));
    log.info('VAPID keys generated for Web Push');
  } catch (e) {
    log.warn('Could not generate VAPID keys: ' + e.message);
  }
}

// Web Push dispatcher
import { createSign, createHash } from 'node:crypto';

notifier.setPushDispatcher(async (eventType, title, message, data) => {
  const vapidPublicKey = getInventorySetting('vapid_public_key');
  const vapidPrivateKey = getInventorySetting('vapid_private_key');
  if (!vapidPublicKey || !vapidPrivateKey) return;

  const subs = getPushSubscriptions();
  if (subs.length === 0) return;

  const payload = JSON.stringify({ title, body: message, event: eventType, url: '/', tag: eventType });

  for (const sub of subs) {
    try {
      await _sendWebPush(sub, payload, vapidPublicKey, vapidPrivateKey);
    } catch (e) {
      // Remove invalid subscriptions (410 Gone)
      if (e.statusCode === 410 || e.statusCode === 404) {
        deletePushSubscriptionById(sub.id);
      }
    }
  }
});

async function _sendWebPush(sub, payload, vapidPublicKey, vapidPrivateKey) {
  const endpoint = new URL(sub.endpoint);
  const audience = `${endpoint.protocol}//${endpoint.host}`;

  // Create VAPID JWT
  const header = Buffer.from(JSON.stringify({ typ: 'JWT', alg: 'ES256' })).toString('base64url');
  const claims = Buffer.from(JSON.stringify({
    aud: audience,
    exp: Math.floor(Date.now() / 1000) + 3600,
    sub: 'mailto:noreply@3dprintforge.local'
  })).toString('base64url');

  const unsignedToken = `${header}.${claims}`;

  // Sign with VAPID private key
  const privKeyDer = Buffer.concat([
    Buffer.from('302e020100300506032b8104002204203021020101041c', 'hex').subarray(0, 7),
    Buffer.from('3041020100301306072a8648ce3d020106082a8648ce3d030107042730250201010420', 'hex'),
    Buffer.from(vapidPrivateKey, 'base64url')
  ]);

  try {
    const sign = createSign('SHA256');
    sign.update(unsignedToken);
    const sig = sign.sign({ key: privKeyDer, format: 'der', type: 'pkcs8' });
    // Convert DER signature to raw r||s (64 bytes)
    const rLen = sig[3];
    const r = sig.subarray(4, 4 + rLen);
    const sStart = 4 + rLen + 2;
    const sLen = sig[sStart - 1];
    const s = sig.subarray(sStart, sStart + sLen);
    const rawR = r.length > 32 ? r.subarray(r.length - 32) : Buffer.concat([Buffer.alloc(32 - r.length), r]);
    const rawS = s.length > 32 ? s.subarray(s.length - 32) : Buffer.concat([Buffer.alloc(32 - s.length), s]);
    const rawSig = Buffer.concat([rawR, rawS]).toString('base64url');
    const jwt = `${unsignedToken}.${rawSig}`;
    const vapidAuth = `vapid t=${jwt}, k=${vapidPublicKey}`;

    // Simple unencrypted push (TTL-only, no payload encryption for simplicity)
    // Most push services accept this for non-sensitive data
    const { request: httpsReq } = await import('node:https');
    const { request: httpReq } = await import('node:http');
    const reqFn = endpoint.protocol === 'https:' ? httpsReq : httpReq;

    return new Promise((resolve, reject) => {
      const req = reqFn(endpoint.href, {
        method: 'POST',
        headers: {
          'Authorization': vapidAuth,
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payload),
          'TTL': '86400'
        }
      }, (res) => {
        let body = '';
        res.on('data', c => body += c);
        res.on('end', () => {
          if (res.statusCode >= 200 && res.statusCode < 300) resolve();
          else { const err = new Error(`Push ${res.statusCode}`); err.statusCode = res.statusCode; reject(err); }
        });
      });
      req.on('error', reject);
      req.setTimeout(10000, () => req.destroy());
      req.write(payload);
      req.end();
    });
  } catch (e) {
    // VAPID signing not available, skip silently
  }
}

// Cloud task matching helper
function _matchCloudTask(tasks, filename) {
  if (!tasks || !filename) return null;
  const fn = filename.toLowerCase().trim();
  return tasks.find(t => {
    const tt = (t.title || '').toLowerCase().trim();
    const dt = (t.designTitle || '').toLowerCase().trim();
    return tt === fn || dt === fn || fn.includes(tt) || fn.includes(dt) || tt.includes(fn) || dt.includes(fn);
  }) || null;
}

// Wire print completion to queue manager + timelapse for all live printers
for (const [id, entry] of manager.printers) {
  if (entry.tracker) {
    const origOnPrintEnd = entry.tracker.onPrintEnd;
    const origOnPrintStart = entry.tracker.onPrintStart;

    // Cloud task provider — fetches filament estimate from Bambu Cloud
    let _cloudTaskCache = null;
    let _cloudTaskCacheTs = 0;
    entry.tracker.cloudTaskProvider = (filename) => {
      if (!filename) return null;
      // Return from cache if fresh (max 10 min)
      if (_cloudTaskCache && Date.now() - _cloudTaskCacheTs < 600000) {
        return _matchCloudTask(_cloudTaskCache, filename);
      }
      // Async refresh cache (non-blocking)
      if (bambuCloud?.isAuthenticated()) {
        bambuCloud.getTaskHistory().then(data => {
          _cloudTaskCache = Array.isArray(data) ? data : (data.tasks || []);
          _cloudTaskCacheTs = Date.now();
        }).catch(() => {});
      }
      return _cloudTaskCache ? _matchCloudTask(_cloudTaskCache, filename) : null;
    };

    // Timelapse + AI detection + power monitor start on print start
    entry.tracker.onPrintStart = (data) => {
      if (origOnPrintStart) origOnPrintStart(data);
      const printer = getPrinters().find(p => p.id === id);
      if (printer && printer.ip && printer.accessCode) {
        const timelapseSetting = getInventorySetting('timelapse_enabled');
        if (timelapseSetting === '1' || timelapseSetting === 'true') {
          timelapseService.startRecording(id, printer.ip, printer.accessCode);
        }
        // Start AI failure detection monitoring
        failureDetector.startMonitoring(id, printer.ip, printer.accessCode);
      }
      // Start power monitoring for this print
      onPrintStart(id);
      // Dispatch plugin hook
      pluginManager.dispatch('onPrintStart', { printerId: id, ...data }).catch(e => log.warn('Plugin onPrintStart dispatch failed', e.message));
    };

    entry.tracker.onPrintEnd = (data) => {
      if (origOnPrintEnd) origOnPrintEnd(data);
      queueManager.onPrintComplete(id, data.status, null);
      // Stop timelapse recording
      if (timelapseService.isRecording(id)) {
        timelapseService.stopRecording(id).catch(e => log.warn('Failed to stop timelapse recording', e.message));
      }
      // Stop AI failure detection
      failureDetector.stopMonitoring(id);
      // Stop power monitoring — associate with print history ID
      onPrintEnd(data.printHistoryId || id);
      // Archive milestone screenshots to print history
      if (data.printHistoryId) archivePrintMilestones(id, data.printHistoryId);
      // Recalculate wear predictions after print
      wearPrediction.onPrintEnd(id, data);
      // Play buzzer melody on printer if enabled
      try {
        const buzzerEnabled = getInventorySetting('buzzer_enabled');
        if (buzzerEnabled === '1' || buzzerEnabled === 'true') {
          const melody = data.status === 'completed' ? 'print_complete' : 'print_failed';
          const cmds = buildBuzzerCommands(melody);
          if (entry.client && cmds.length > 0) {
            for (const cmd of cmds) entry.client.sendCommand(cmd);
          }
        }
      } catch (e) { log.warn('Buzzer on print end failed', e.message); }
      // Dispatch plugin hook
      pluginManager.dispatch('onPrintEnd', { printerId: id, ...data }).catch(e => log.warn('Plugin onPrintEnd dispatch failed', e.message));
    };

    // Wire plugin dispatch into onError
    const origOnError = entry.tracker.onError;
    entry.tracker.onError = (data) => {
      if (origOnError) origOnError(data);
      pluginManager.dispatch('onError', { printerId: id, ...data }).catch(e => log.warn('Plugin onError dispatch failed', e.message));
    };

    // Milestone screenshot capture (25/50/75/100%)
    entry.tracker.onMilestone = (data) => {
      const printer = getPrinters().find(p => p.id === id);
      if (printer && printer.ip && printer.accessCode) {
        const enabled = getInventorySetting('milestones_enabled');
        if (enabled === '1' || enabled === 'true' || enabled === null || enabled === undefined) {
          captureMilestone(id, printer.ip, printer.accessCode, data.milestone, {
            layer: data.layer,
            totalLayers: data.totalLayers
          }).catch(e => log.warn('Milestone capture failed', e.message));
        }
      }
    };

    // Layer pause — pause printer when target layer is reached
    entry.tracker.onLayerPause = (data) => {
      if (entry.client) entry.client.sendCommand(buildPauseCommand());
      broadcastAll('layer_pause_triggered', data);
    };
  }
}

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
      log.info(`[demo] Seeded printer: ${p.name}`);
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
    log.info(`[demo] Seeded ${MOCK_HISTORY.length} history records across ${printerIds.length} printers`);
  }

  // Seed filament inventory
  const { getFilament } = await import('./database.js');
  if (getFilament().length === 0 && MOCK_FILAMENT) {
    for (const f of MOCK_FILAMENT) {
      addFilament(f);
    }
    log.info(`[demo] Seeded ${MOCK_FILAMENT.length} filament records`);
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
    log.info(`[demo] Seeded ${MOCK_ERRORS.length} error records across ${printerIds.length} printers`);
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
  log.info('[demo] Seeded firmware entries');

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
    log.info('[demo] Seeded protection data');
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
    tracker.onNfcAutoLinked = (data) => {
      broadcastAll('nfc_auto_linked', { ...data, printerName: p.name });
    };
    tracker.onBroadcast = (type, data) => {
      broadcastAll(type, { ...data, printerId: p.id, printerName: p.name });
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

  log.info(`[demo] ${MOCK_PRINTERS.length} mock printers started`);
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
  log.info(`[demo] Purged ${printerIds.length} mock printers`);
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
  clearInterval(_autoTrashInterval);
  clearInterval(_materialRecInterval);
  clearInterval(_errorPatternInterval);
  shutdownAuth();
  ecomLicense.shutdown();
  for (const mock of demoMockPrinters) mock.stop();
  queueManager.shutdown();
  updater.shutdown();
  notifier.shutdown();
  manager.shutdown();
  discovery.shutdown();
  shutdownHaDiscovery();
  shutdownRemoteNodes();
  process.exit(0);
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

// Start servers
httpServer.listen(PORT, () => {
  const printerCount = manager.getPrinterIds().length + (IS_DEMO ? demoMockPrinters.length : 0);
  const { ips, names } = getLocalAddresses();
  // Filter out IPv6 for display (too long for banner), keep IPv4 + hostnames
  const allHosts = [...new Set([...names, ...ips.filter(ip => !ip.includes(':'))])];
  console.log('');
  console.log('  ╔══════════════════════════════════════════════════╗');
  console.log(`  ║   3DPrintForge v${updater.currentVersion.padEnd(30)}║`);
  if (forceHttps) {
    console.log(`  ║   HTTPS (HTTP redirects automatically):         ║`);
    for (const h of allHosts) {
      const url = `https://${h}:${HTTPS_PORT}`;
      console.log(`  ║     ${url.padEnd(43)}║`);
    }
  } else {
    console.log('  ║   Available on:                                  ║');
    for (const h of allHosts) {
      const url = `http://${h}:${PORT}`;
      console.log(`  ║     ${url.padEnd(43)}║`);
    }
    if (hasSSL) {
      console.log('  ║   HTTPS also available:                          ║');
      for (const h of allHosts) {
        const url = `https://${h}:${HTTPS_PORT}`;
        console.log(`  ║     ${url.padEnd(43)}║`);
      }
    } else {
      console.log('  ║   ⚠ No SSL certificates found                    ║');
    }
  }
  console.log(`  ║   Printers: ${String(printerCount).padEnd(36)}║`);
  console.log('  ╚══════════════════════════════════════════════════╝');
  console.log('');

  // Send anonymous telemetry ping (fire-and-forget)
  sendTelemetryPing();

  // Dispatch plugin onServerStart hook
  pluginManager.dispatch('onServerStart', { port: PORT }).catch(e => log.warn('Plugin onServerStart dispatch failed', e.message));
});

if (httpsServer) {
  httpsServer.listen(HTTPS_PORT, () => {
    log.info(`HTTPS active on port ${HTTPS_PORT}`);
  });
}

// Auto-build Docusaurus docs if build is missing or outdated
{
  const docsBuild = join(dirname(fileURLToPath(import.meta.url)), '..', 'website', 'build');
  const docsSource = join(dirname(fileURLToPath(import.meta.url)), '..', 'website', 'docs');
  const docsPkg = join(dirname(fileURLToPath(import.meta.url)), '..', 'website', 'package.json');
  const hasBuild = existsSync(join(docsBuild, 'intro.html')) || existsSync(join(docsBuild, 'index.html'));
  const hasSource = existsSync(docsSource) && existsSync(docsPkg);

  if (!hasBuild && hasSource) {
    log.info('[docs] Build missing — building documentation in background...');
    import('node:child_process').then(({ exec }) => {
      exec('cd website && npm ci --silent 2>/dev/null; npm run build', {
        cwd: join(dirname(fileURLToPath(import.meta.url)), '..'),
        timeout: 600000
      }, (err) => {
        if (err) {
          log.warn('[docs] Docs build failed: ' + (err.message || '').split('\n')[0]);
        } else {
          log.info('[docs] Documentation built — available at /docs/');
        }
      });
    });
  }
}
