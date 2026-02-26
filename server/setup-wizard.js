/**
 * Bambu Dashboard — Setup Wizard Server
 * Standalone lightweight HTTP server for first-time configuration.
 *
 * Security:
 *  - Generates a one-time token on startup, printed in the terminal
 *  - All API calls require this token (header or query param)
 *  - Refuses to start if setup is already completed (flag in SQLite)
 *  - Binds only to localhost by default (use --lan to allow LAN access)
 *
 * After finish:
 *  - Spawns the main dashboard server as a detached child process
 *  - Waits for it to be ready, then exits — seamless handoff on same port
 */

import { createServer } from 'node:http';
import { readFileSync, existsSync, mkdirSync, writeFileSync, openSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync, spawn } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { DatabaseSync } from 'node:sqlite';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const PUBLIC_DIR = join(ROOT, 'public');
const CONFIG_PATH = join(ROOT, 'config.json');
const DATA_DIR = join(ROOT, 'data');
const CERTS_DIR = join(ROOT, 'certs');
const SETUP_HTML = join(ROOT, 'public', 'setup.html');
const DB_PATH = join(DATA_DIR, 'bambu.db');

const PORT = parseInt(process.env.PORT || '3000', 10);
const ALLOW_LAN = process.argv.includes('--lan');
const BIND_HOST = ALLOW_LAN ? '0.0.0.0' : '127.0.0.1';

// ── Security token ──────────────────────────────────────────
const SETUP_TOKEN = randomBytes(24).toString('base64url');

// ── SQLite setup-complete flag ──────────────────────────────
if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });

const db = new DatabaseSync(DB_PATH);
db.exec(`CREATE TABLE IF NOT EXISTS setup_state (
  key TEXT PRIMARY KEY,
  value TEXT,
  updated_at TEXT DEFAULT (datetime('now'))
)`);

function isSetupComplete() {
  const row = db.prepare("SELECT value FROM setup_state WHERE key = 'setup_complete'").get();
  return row?.value === 'true';
}

function markSetupComplete() {
  db.prepare("INSERT OR REPLACE INTO setup_state (key, value, updated_at) VALUES ('setup_complete', 'true', datetime('now'))").run();
}

// ── Refuse if already set up (unless --force) ───────────────
if (isSetupComplete() && !process.argv.includes('--force')) {
  console.error('');
  console.error('  Setup has already been completed.');
  console.error('  To re-run the wizard, use: node server/setup-wizard.js --force');
  console.error('  To start the dashboard: npm start');
  console.error('');
  process.exit(1);
}

// ── Auth middleware ──────────────────────────────────────────
function authenticate(req) {
  // Check Authorization header first
  const authHeader = req.headers['authorization'];
  if (authHeader === `Bearer ${SETUP_TOKEN}`) return true;

  // Check query param ?token=...
  const url = new URL(req.url, `http://localhost:${PORT}`);
  if (url.searchParams.get('token') === SETUP_TOKEN) return true;

  return false;
}

function unauthorized(res) {
  res.writeHead(401, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Invalid or missing setup token' }));
}

// ── System checks ───────────────────────────────────────────
function checkSystem() {
  const checks = {};

  // Node.js version (REQUIRED: v22+)
  const nodeVer = process.versions.node;
  const nodeMajor = parseInt(nodeVer.split('.')[0], 10);
  checks.node = { version: nodeVer, ok: nodeMajor >= 22 };

  // ffmpeg (optional, for camera streaming)
  try {
    const ffVer = execSync('ffmpeg -version 2>&1', { timeout: 5000 }).toString().split('\n')[0];
    checks.ffmpeg = { version: ffVer.replace('ffmpeg version ', '').split(' ')[0], ok: true };
  } catch {
    checks.ffmpeg = { version: null, ok: false };
  }

  // npm dependencies (REQUIRED)
  checks.dependencies = { ok: existsSync(join(ROOT, 'node_modules', 'mqtt')) };

  // Config file
  checks.config = { exists: existsSync(CONFIG_PATH) };
  checks.dataDir = { exists: existsSync(DATA_DIR) };

  // SSL certs (optional)
  checks.ssl = {
    cert: existsSync(join(CERTS_DIR, 'cert.pem')),
    key: existsSync(join(CERTS_DIR, 'key.pem'))
  };

  // Disk space
  try {
    const dfOut = execSync(`df -BM "${ROOT}" | tail -1`, { timeout: 3000 }).toString().trim();
    const parts = dfOut.split(/\s+/);
    const availMB = parseInt(parts[3], 10) || 0;
    checks.disk = { available_mb: availMB, ok: availMB >= 100 };
  } catch {
    checks.disk = { available_mb: 0, ok: true }; // Can't check, assume ok
  }

  // RAM
  try {
    const memOut = execSync("free -m | grep Mem | awk '{print $2, $7}'", { timeout: 3000 }).toString().trim();
    const [totalStr, availStr] = memOut.split(/\s+/);
    const totalMB = parseInt(totalStr, 10) || 0;
    const availMB = parseInt(availStr, 10) || 0;
    checks.ram = { total_mb: totalMB, available_mb: availMB, ok: availMB >= 128 };
  } catch {
    checks.ram = { total_mb: 0, available_mb: 0, ok: true }; // Can't check, assume ok
  }

  // Write permission on project dir
  try {
    const testFile = join(DATA_DIR, '.write-test');
    writeFileSync(testFile, 'ok');
    execSync(`rm -f "${testFile}"`, { timeout: 2000 });
    checks.writable = { ok: true };
  } catch {
    checks.writable = { ok: false };
  }

  // OS info
  try { checks.os = execSync('uname -srm', { timeout: 3000 }).toString().trim(); }
  catch { checks.os = 'unknown'; }

  // IP address
  try { checks.ip = execSync("hostname -I 2>/dev/null | awk '{print $1}'", { timeout: 3000 }).toString().trim() || 'localhost'; }
  catch { checks.ip = 'localhost'; }

  // Overall compatibility verdict (node + writable are hard requirements)
  checks.compatible = checks.node.ok && checks.writable.ok;

  return checks;
}

function installDependencies() {
  try {
    execSync('npm install --production', { cwd: ROOT, timeout: 120000, stdio: 'pipe' });
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e.stderr?.toString() || e.message };
  }
}

function installFfmpeg() {
  try {
    execSync('sudo apt-get update -qq && sudo apt-get install -y ffmpeg', { timeout: 120000, stdio: 'pipe' });
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e.stderr?.toString() || e.message };
  }
}

function saveConfig(data) {
  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
  if (!existsSync(CERTS_DIR)) mkdirSync(CERTS_DIR, { recursive: true });

  const config = {
    printers: (data.printers || []).map((p, i) => ({
      id: p.id || `printer-${i + 1}`,
      name: p.name || `Printer ${i + 1}`,
      ip: p.ip || '',
      serial: p.serial || '',
      accessCode: p.accessCode || '',
      model: p.model || ''
    })),
    server: {
      port: parseInt(data.port, 10) || 3000,
      httpsPort: parseInt(data.httpsPort, 10) || 3443,
      cameraWsPortStart: parseInt(data.cameraWsPortStart, 10) || 9001,
      forceHttps: !!data.forceHttps
    },
    camera: {
      enabled: data.cameraEnabled !== false,
      resolution: data.cameraResolution || '640x480',
      framerate: parseInt(data.cameraFramerate, 10) || 15,
      bitrate: data.cameraBitrate || '1000k'
    }
  };

  writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));
  return config;
}

function createSystemdService() {
  const nodePath = process.execPath;
  const user = process.env.USER || 'nobody';
  const service = `[Unit]
Description=Bambu Dashboard
After=network.target

[Service]
Type=simple
User=${user}
WorkingDirectory=${ROOT}
ExecStart=${nodePath} --experimental-sqlite server/index.js
Restart=on-failure
RestartSec=5
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
`;
  try {
    const servicePath = '/etc/systemd/system/bambu-dashboard.service';
    execSync(`sudo tee ${servicePath} > /dev/null`, { input: service, timeout: 10000 });
    execSync('sudo systemctl daemon-reload', { timeout: 10000, stdio: 'pipe' });
    execSync('sudo systemctl enable bambu-dashboard', { timeout: 10000, stdio: 'pipe' });
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e.message };
  }
}

// ── Spawn the main dashboard server (detached, survives parent exit) ──
function spawnDashboard() {
  const logFile = join(DATA_DIR, 'dashboard-start.log');
  const out = openSync(logFile, 'a');
  const err = openSync(logFile, 'a');

  const child = spawn(process.execPath, ['--experimental-sqlite', 'server/index.js'], {
    cwd: ROOT,
    detached: true,
    stdio: ['ignore', out, err],
    env: { ...process.env, NODE_ENV: 'production' }
  });

  child.unref();
  console.log(`  [setup] Dashboard spawned (PID: ${child.pid}), log: ${logFile}`);
  return child.pid;
}

// ── Close wizard HTTP server and release the port ───────────
function closeServer() {
  return new Promise((resolve) => {
    server.close(() => resolve());
    // Force-close any keep-alive connections
    setTimeout(resolve, 1000);
  });
}

// ── Helpers ──────────────────────────────────────────────────
function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', c => { body += c; if (body.length > 1e6) req.destroy(); });
    req.on('end', () => { try { resolve(JSON.parse(body)); } catch { resolve({}); } });
    req.on('error', reject);
  });
}

function json(res, data, status = 200) {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
}

// ── HTTP server ─────────────────────────────────────────────
const server = createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  const path = url.pathname;
  const method = req.method;

  // ── Setup page (inject token) ──
  if (path === '/' || path === '/setup') {
    let html = readFileSync(SETUP_HTML, 'utf-8');
    // Inject token into HTML so the frontend JS can use it
    html = html.replace('{{SETUP_TOKEN}}', SETUP_TOKEN);
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(html);
    return;
  }

  // ── API routes — all require token ──
  if (path.startsWith('/setup/api/')) {
    if (!authenticate(req)) return unauthorized(res);

    if (path === '/setup/api/check' && method === 'GET') {
      return json(res, checkSystem());
    }

    if (path === '/setup/api/install-deps' && method === 'POST') {
      return json(res, installDependencies());
    }

    if (path === '/setup/api/install-ffmpeg' && method === 'POST') {
      return json(res, installFfmpeg());
    }

    if (path === '/setup/api/save' && method === 'POST') {
      const data = await readBody(req);
      try {
        const config = saveConfig(data);
        return json(res, { ok: true, config });
      } catch (e) {
        return json(res, { ok: false, error: e.message }, 500);
      }
    }

    if (path === '/setup/api/systemd' && method === 'POST') {
      return json(res, createSystemdService());
    }

    if (path === '/setup/api/finish' && method === 'POST') {
      markSetupComplete();
      db.close();

      const dashPort = (() => {
        try {
          const cfg = JSON.parse(readFileSync(CONFIG_PATH, 'utf-8'));
          return cfg.server?.port || PORT;
        } catch { return PORT; }
      })();

      // Send response to client FIRST
      json(res, { ok: true, dashPort, message: 'Closing wizard and starting dashboard...' });

      // Then: close wizard server → free the port → spawn dashboard → exit
      setTimeout(async () => {
        console.log('  [setup] Closing wizard server...');
        await closeServer();

        // Small delay to ensure OS releases the port
        await new Promise(r => setTimeout(r, 500));

        console.log('  [setup] Spawning dashboard server...');
        spawnDashboard();

        // Give child a moment to bind, then exit
        setTimeout(() => { process.exit(0); }, 1000);
      }, 200);
      return;
    }

    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not found' }));
    return;
  }

  // ── Static assets (no auth needed for CSS/SVG/JS) ──
  const filePath = join(PUBLIC_DIR, path);
  if (filePath.startsWith(PUBLIC_DIR) && existsSync(filePath)) {
    const ext = path.split('.').pop();
    const mimes = { css: 'text/css', js: 'application/javascript', svg: 'image/svg+xml', png: 'image/png', ico: 'image/x-icon', json: 'application/json' };
    res.writeHead(200, { 'Content-Type': mimes[ext] || 'application/octet-stream' });
    res.end(readFileSync(filePath));
    return;
  }

  res.writeHead(404);
  res.end('Not found');
});

server.listen(PORT, BIND_HOST, () => {
  const ip = (() => { try { return execSync("hostname -I 2>/dev/null | awk '{print $1}'", { timeout: 3000 }).toString().trim(); } catch { return 'localhost'; } })();
  console.log('');
  console.log('  ╔══════════════════════════════════════════════════════╗');
  console.log('  ║   Bambu Dashboard — Setup Wizard                      ║');
  console.log(`  ║   http://${BIND_HOST === '0.0.0.0' ? ip : 'localhost'}:${PORT}                          ║`);
  console.log('  ╠══════════════════════════════════════════════════════╣');
  console.log(`  ║   Setup token: ${SETUP_TOKEN}    ║`);
  console.log('  ╚══════════════════════════════════════════════════════╝');
  console.log('');
  if (BIND_HOST === '127.0.0.1') {
    console.log('  Bound to localhost only. Use --lan to allow network access.');
  }
  console.log('  Open the URL in your browser. The token will be filled automatically.');
  console.log('');
});
