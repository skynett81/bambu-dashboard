/**
 * PrinterProvisioner — Auto-configures printers for optimal camera support.
 *
 * For Snapmaker U1 (and similar printers with unisrv):
 * - Configures nginx to serve /tmp/.monitor.jpg at /webcam/?action=snapshot
 * - This makes the standard HTTP camera polling work without SSH per-frame
 * - Persists across reboots (nginx config is permanent)
 *
 * Provisioning runs once per printer and is idempotent.
 */

import { Client as SSHClient } from 'ssh2';
import { createLogger } from './logger.js';

const log = createLogger('provision');

// Nginx snippet that serves the live monitor image at the webcam endpoint
const NGINX_CAMERA_SNIPPET = `
# 3DPrintForge camera proxy — serves unisrv live monitor image
# This replaces the mjpgstreamer upstream that isn't running
location = /webcam/snapshot {
    alias /tmp/.monitor.jpg;
    add_header Cache-Control "no-cache, no-store, must-revalidate";
    add_header Pragma "no-cache";
    add_header Expires "0";
    add_header Content-Type "image/jpeg" always;
    add_header Access-Control-Allow-Origin "*";
    etag off;
    if_modified_since off;
}
location = /webcam/action/snapshot {
    alias /tmp/.monitor.jpg;
    add_header Cache-Control "no-cache, no-store, must-revalidate";
    add_header Pragma "no-cache";
    add_header Expires "0";
    add_header Content-Type "image/jpeg" always;
    add_header Access-Control-Allow-Origin "*";
    etag off;
    if_modified_since off;
}
`;

// Marker to identify our config
const MARKER = '# 3DPrintForge camera proxy';

const SSH_CREDENTIALS = [
  { username: 'root', password: 'snapmaker' },
  { username: 'lava', password: 'snapmaker' },
  { username: 'root', password: 'makerbase' },
];

/**
 * Provision camera for a Moonraker printer.
 * Checks if the webcam endpoint works; if not, tries to configure nginx via SSH.
 * Returns true if camera is now available via HTTP.
 */
export async function provisionCamera(printerIp, port = 80) {
  // 1. Check if webcam already works
  const webcamOk = await _testWebcam(printerIp, port);
  if (webcamOk) {
    log.info(`${printerIp}: webcam allerede OK via HTTP`);
    return true;
  }

  // 2. Check if this is a printer we can configure (has SSH + unisrv)
  const creds = await _findSshCredentials(printerIp);
  if (!creds) {
    log.info(`${printerIp}: ingen SSH-tilgang — kan ikke konfigurere kamera automatisk`);
    return false;
  }

  // 3. Check if unisrv is running and monitor.jpg exists
  const hasMonitor = await _checkMonitorFile(printerIp, creds);
  if (!hasMonitor) {
    log.info(`${printerIp}: ingen live kamerafil funnet`);
    return false;
  }

  // 4. Configure nginx to serve the monitor image
  const configured = await _configureNginx(printerIp, creds);
  if (!configured) {
    log.info(`${printerIp}: kunne ikke konfigurere nginx`);
    return false;
  }

  // 5. Verify it works now
  // Small delay for nginx reload
  await new Promise(r => setTimeout(r, 1500));
  const works = await _testWebcam(printerIp, port);
  if (works) {
    log.info(`${printerIp}: kamera konfigurert og verifisert via HTTP`);
  } else {
    log.info(`${printerIp}: nginx konfigurert men webcam svarer ikke ennå`);
  }
  return works;
}

async function _testWebcam(ip, port) {
  // Try multiple snapshot paths and ports
  const endpoints = [
    `http://${ip}:${port}/webcam/snapshot`,
    `http://${ip}:${port}/webcam/?action=snapshot`,
    `http://${ip}:8080/`,
    `http://${ip}:8080/?action=snapshot`,
    `http://${ip}:8081/?action=snapshot`,
  ];
  for (const url of endpoints) {
    try {
      const res = await fetch(url + (url.includes('?') ? '&' : '?') + '_t=' + Date.now(), { signal: AbortSignal.timeout(3000) });
      if (!res.ok) continue;
      const ct = res.headers.get('content-type') || '';
      if (!ct.includes('image')) continue;
      const buf = Buffer.from(await res.arrayBuffer());
      if (buf.length > 500) return true;
    } catch { /* next */ }
  }
  return false;
}

function _findSshCredentials(ip) {
  return new Promise((resolve) => {
    let idx = 0;
    function tryNext() {
      if (idx >= SSH_CREDENTIALS.length) return resolve(null);
      const creds = SSH_CREDENTIALS[idx++];
      const conn = new SSHClient();
      const timer = setTimeout(() => { conn.end(); tryNext(); }, 5000);

      conn.on('ready', () => {
        clearTimeout(timer);
        conn.end();
        resolve(creds);
      });
      conn.on('error', () => { clearTimeout(timer); tryNext(); });

      conn.connect({
        host: ip, port: 22,
        username: creds.username, password: creds.password,
        readyTimeout: 4000,
        algorithms: { kex: ['diffie-hellman-group14-sha256', 'diffie-hellman-group14-sha1', 'ecdh-sha2-nistp256', 'ecdh-sha2-nistp384', 'ecdh-sha2-nistp521'] }
      });
    }
    tryNext();
  });
}

function _sshExec(ip, creds, cmd) {
  return new Promise((resolve) => {
    const conn = new SSHClient();
    const timer = setTimeout(() => { conn.end(); resolve(null); }, 10000);

    conn.on('ready', () => {
      conn.exec(cmd, (err, stream) => {
        if (err) { clearTimeout(timer); conn.end(); resolve(null); return; }
        let out = '';
        stream.on('data', (d) => { out += d; });
        stream.stderr.on('data', (d) => { out += d; });
        stream.on('close', () => { clearTimeout(timer); conn.end(); resolve(out); });
      });
    });
    conn.on('error', () => { clearTimeout(timer); resolve(null); });

    conn.connect({
      host: ip, port: 22,
      username: creds.username, password: creds.password,
      readyTimeout: 5000,
      algorithms: { kex: ['diffie-hellman-group14-sha256', 'diffie-hellman-group14-sha1', 'ecdh-sha2-nistp256', 'ecdh-sha2-nistp384', 'ecdh-sha2-nistp521'] }
    });
  });
}

async function _checkMonitorFile(ip, creds) {
  const result = await _sshExec(ip, creds,
    'test -f /tmp/.monitor.jpg && stat -c %s /tmp/.monitor.jpg || echo 0'
  );
  if (!result) return false;
  const size = parseInt(result.trim());
  return size > 500;
}

async function _configureNginx(ip, creds) {
  // Start a lightweight Python HTTP server on port 8080 that serves /tmp/.monitor.jpg
  // This replaces the missing mjpgstreamer that nginx expects on that port
  // Works with Fluidd/Mainsail AND 3DPrintForge without modifying any nginx config

  const scriptPath = '/home/lava/camera_server.py';
  const pidFile = '/tmp/camera_server.pid';

  // Check if already running
  const running = await _sshExec(ip, creds,
    `test -f ${pidFile} && kill -0 $(cat ${pidFile}) 2>/dev/null && echo RUNNING || echo STOPPED`
  );

  if (running && running.trim() === 'RUNNING') {
    log.info(`${ip}: kameraserver allerede aktiv`);
    return true;
  }

  // Create a simple Python HTTP server that serves the live camera image
  // Responds to any request with /tmp/.monitor.jpg (mimics mjpgstreamer snapshot)
  const script = `#!/usr/bin/env python3
"""3DPrintForge camera server — serves /tmp/.monitor.jpg on port 8080"""
import http.server, os, signal, sys

class Handler(http.server.BaseHTTPRequestHandler):
    def do_GET(self):
        try:
            with open("/tmp/.monitor.jpg", "rb") as f:
                data = f.read()
            self.send_response(200)
            self.send_header("Content-Type", "image/jpeg")
            self.send_header("Content-Length", str(len(data)))
            self.send_header("Cache-Control", "no-cache, no-store")
            self.send_header("Access-Control-Allow-Origin", "*")
            self.end_headers()
            self.wfile.write(data)
        except FileNotFoundError:
            self.send_error(404, "No camera image available")
        except Exception:
            self.send_error(500, "Internal error")
    def log_message(self, *args): pass

with open("${pidFile}", "w") as f:
    f.write(str(os.getpid()))
signal.signal(signal.SIGTERM, lambda *a: sys.exit(0))
http.server.HTTPServer(("0.0.0.0", 8080), Handler).serve_forever()
`;

  // Write script and start it
  const escaped = script.replace(/"/g, '\\"');
  const deployCmd = `cat > ${scriptPath} << 'PYEOF'
${script}
PYEOF
chmod +x ${scriptPath}
# Kill any old instance
test -f ${pidFile} && kill $(cat ${pidFile}) 2>/dev/null; sleep 0.5
# Start in background
nohup python3 ${scriptPath} > /dev/null 2>&1 &
sleep 1
# Verify
test -f ${pidFile} && kill -0 $(cat ${pidFile}) 2>/dev/null && echo OK || echo FAILED`;

  const result = await _sshExec(ip, creds, deployCmd);

  if (result && result.trim().endsWith('OK')) {
    log.info(`${ip}: kameraserver startet på port 8080`);
    return true;
  }

  log.error(`${ip}: kunne ikke starte kameraserver: ${result?.slice(0, 200)}`);
  return false;
}
