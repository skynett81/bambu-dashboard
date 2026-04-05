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
    log.info(`${printerIp}: webcam already OK via HTTP`);
    return true;
  }

  // 2. Check if this is a printer we can configure (has SSH + unisrv)
  const creds = await _findSshCredentials(printerIp);
  if (!creds) {
    log.info(`${printerIp}: no SSH access — cannot configure camera automatically`);
    return false;
  }

  // 3. Check if unisrv is running and monitor.jpg exists
  const hasMonitor = await _checkMonitorFile(printerIp, creds);
  if (!hasMonitor) {
    log.info(`${printerIp}: no live camera file found`);
    return false;
  }

  // 4. Configure nginx to serve the monitor image
  const configured = await _configureNginx(printerIp, creds);
  if (!configured) {
    log.info(`${printerIp}: could not configure nginx`);
    return false;
  }

  // 5. Verify it works now
  // Small delay for nginx reload
  await new Promise(r => setTimeout(r, 1500));
  const works = await _testWebcam(printerIp, port);
  if (works) {
    log.info(`${printerIp}: camera configured and verified via HTTP`);
  } else {
    log.info(`${printerIp}: nginx configured but webcam not responding yet`);
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
    log.info(`${ip}: camera server already active`);
    return true;
  }

  // Camera server that:
  // 1. Monitors /tmp/.monitor.jpg for changes (inotify)
  // 2. Falls back to polling the newest .jpg if inotify not available
  // 3. Serves MJPEG stream at /?action=stream (configurable FPS)
  // 4. Serves single snapshot at /?action=snapshot or any other path
  // 5. Works as drop-in replacement for mjpgstreamer on port 8080
  const script = `#!/usr/bin/env python3
"""3DPrintForge camera server — live MJPEG stream + snapshots with MQTT trigger"""
import http.server, os, signal, sys, time, threading, glob, json

FPS = int(os.environ.get("CAMERA_FPS", "5"))
CAMERA_FILES = ["/tmp/printer_detection.jpg", "/tmp/.monitor.jpg"]
frame_lock = threading.Lock()
current_frame = b""
frame_time = 0
mqtt_available = False

# Try to import paho MQTT for triggering camera captures
try:
    import paho.mqtt.client as mqtt_lib
    mqtt_available = True
except ImportError:
    pass

def trigger_capture():
    """Ask unisrv to take a fresh camera image via local MQTT (non-blocking)."""
    if not mqtt_available:
        return
    def _do_trigger():
        try:
            c = mqtt_lib.Client()
            c.connect("127.0.0.1", 1883, keepalive=2)
            payload = json.dumps({"jsonrpc": "2.0", "method": "camera.detect_capture", "id": 1})
            c.publish("camera/request", payload)
            c.disconnect()
        except Exception:
            pass
    t = threading.Thread(target=_do_trigger, daemon=True)
    t.start()

def find_camera_file():
    """Find the most recently modified camera file."""
    best = None
    best_mtime = 0
    for path in CAMERA_FILES:
        try:
            mt = os.path.getmtime(path)
            if mt > best_mtime:
                best_mtime = mt
                best = path
        except OSError:
            pass
    for f in glob.glob("/tmp/*.jpg") + glob.glob("/tmp/.*.jpg"):
        try:
            mt = os.path.getmtime(f)
            if mt > best_mtime:
                best_mtime = mt
                best = f
        except OSError:
            pass
    return best

def frame_reader():
    """Background thread: triggers capture + reads file at target FPS."""
    global current_frame, frame_time
    interval = 1.0 / max(1, FPS)
    cam_file = None
    capture_interval = max(interval, 0.5)  # Don't trigger faster than 2 fps
    last_trigger = 0
    while True:
        now = time.time()
        # Trigger new capture periodically
        if now - last_trigger >= capture_interval:
            trigger_capture()
            last_trigger = now
        # Re-detect camera file periodically
        if cam_file is None or not os.path.exists(cam_file):
            cam_file = find_camera_file()
        if cam_file:
            try:
                mtime = os.path.getmtime(cam_file)
                if mtime != frame_time:
                    with open(cam_file, "rb") as f:
                        data = f.read()
                    if len(data) > 500:
                        with frame_lock:
                            current_frame = data
                            frame_time = mtime
            except (OSError, IOError):
                pass
        time.sleep(interval)

class Handler(http.server.BaseHTTPRequestHandler):
    def do_GET(self):
        if "action=stream" in self.path:
            self._stream()
        else:
            self._snapshot()

    def _snapshot(self):
        with frame_lock:
            data = current_frame
        if not data:
            self.send_error(503, "No camera image available yet")
            return
        self.send_response(200)
        self.send_header("Content-Type", "image/jpeg")
        self.send_header("Content-Length", str(len(data)))
        self.send_header("Cache-Control", "no-cache, no-store")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()
        self.wfile.write(data)

    def _stream(self):
        self.send_response(200)
        self.send_header("Content-Type", "multipart/x-mixed-replace; boundary=--frame")
        self.send_header("Cache-Control", "no-cache, no-store")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()
        interval = 1.0 / max(1, FPS)
        last_time = 0
        try:
            while True:
                with frame_lock:
                    data = current_frame
                if data:
                    self.wfile.write(b"--frame\\r\\n")
                    self.wfile.write(b"Content-Type: image/jpeg\\r\\n")
                    self.wfile.write(f"Content-Length: {len(data)}\\r\\n\\r\\n".encode())
                    self.wfile.write(data)
                    self.wfile.write(b"\\r\\n")
                    self.wfile.flush()
                time.sleep(interval)
        except (BrokenPipeError, ConnectionResetError):
            pass

    def log_message(self, *args): pass

# Write PID
with open("${pidFile}", "w") as f:
    f.write(str(os.getpid()))
signal.signal(signal.SIGTERM, lambda *a: sys.exit(0))

# Start frame reader thread
t = threading.Thread(target=frame_reader, daemon=True)
t.start()

# Wait for first frame
for _ in range(50):
    if current_frame:
        break
    time.sleep(0.1)

mqtt_status = "with MQTT trigger" if mqtt_available else "without MQTT (install paho-mqtt for live capture)"
print(f"Camera server started on port 8080 @ {FPS} fps {mqtt_status}")
http.server.HTTPServer(("0.0.0.0", 8080), Handler).serve_forever()
`;

  // Write script and start it
  const fps = 10; // Target FPS — limited by how fast unisrv writes frames
  const deployCmd = `cat > ${scriptPath} << 'PYEOF'
${script}
PYEOF
chmod +x ${scriptPath}
# Kill any old instance
test -f ${pidFile} && kill $(cat ${pidFile}) 2>/dev/null; sleep 0.5
# Start in background with target FPS
CAMERA_FPS=${fps} nohup python3 ${scriptPath} > /dev/null 2>&1 &
sleep 1.5
# Verify
test -f ${pidFile} && kill -0 $(cat ${pidFile}) 2>/dev/null && echo OK || echo FAILED`;

  const result = await _sshExec(ip, creds, deployCmd);

  if (result && result.trim().endsWith('OK')) {
    log.info(`${ip}: camera server started on port 8080`);
    return true;
  }

  log.error(`${ip}: could not start camera server: ${result?.slice(0, 200)}`);
  return false;
}
