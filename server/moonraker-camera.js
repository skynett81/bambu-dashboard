/**
 * MoonrakerCamera — Camera proxy for Klipper/Moonraker printers.
 *
 * Tries multiple snapshot sources automatically:
 * 1. Moonraker webcam API (queries /server/webcams/list for URLs)
 * 2. Common snapshot paths (/webcam/?action=snapshot, :8080, :8081)
 * 3. SSH snapshot via ssh2 (Snapmaker U1 — /tmp/printer_detection.jpg)
 *
 * Periodically retries if no source is found (webcam may start later).
 * Zero external tool dependencies — ssh2 is pure JavaScript.
 */

import { Client as SSHClient } from 'ssh2';
import { createLogger } from './logger.js';

const log = createLogger('moon-cam');

const SNAPSHOT_CANDIDATES = [
  { path: '/?action=snapshot', port: 8080 },   // 3DPrintForge camera server / mjpgstreamer
  { path: '/?action=snapshot', port: 8081 },
  { path: '/webcam/?action=snapshot', port: null },
  { path: '/webcam/?action=snapshot', port: 4408 },
  { path: '/webcam/snapshot', port: null },
  { path: '/snapshot', port: null },
];

// Common SSH credentials for known printer platforms
const SSH_CREDENTIALS = [
  { username: 'lava', password: 'snapmaker' },    // Snapmaker U1/J1
  { username: 'root', password: 'makerbase' },     // MKS boards
  { username: 'pi', password: 'raspberry' },        // Raspberry Pi default
  { username: 'mks', password: 'makerbase' },      // MKS Klipper
];

// Common camera image paths on printers (ordered by preference — live first)
const SSH_CAMERA_PATHS = [
  '/tmp/.monitor.jpg',             // Snapmaker unisrv live monitor (updates every ~1s)
  '/tmp/printer_detection.jpg',    // Snapmaker unisrv detection snapshot
  '/tmp/snapshot.jpg',             // Common crowsnest path
  '/tmp/camera.jpg',               // Generic
];

export class MoonrakerCamera {
  constructor(config) {
    this.ip = config.printer.ip;
    this.port = config.printer.port || 80;
    this.apiKey = config.printer.accessCode || '';
    this.enabled = config.camera?.enabled !== false;
    this._lastFrame = null;
    this._lastFrameTime = 0;
    this._pollTimer = null;
    this._retryTimer = null;
    this._activeSource = null;    // 'http' | 'ssh' | null
    this._activeUrl = null;
    this._sshCreds = null;        // { username, password }
    this._sshPath = null;         // remote file path
    this._sshConn = null;         // persistent SSH connection
    this._sshSftp = null;         // persistent SFTP session
    this._pollInterval = config.camera?.framerate ? Math.round(1000 / config.camera.framerate) : 200;  // Match configured FPS
    this._retryInterval = 30000;
    this._failCount = 0;
  }

  async start() {
    if (!this.enabled) return;
    await this._findAndStart();
  }

  stop() {
    if (this._pollTimer) { clearInterval(this._pollTimer); this._pollTimer = null; }
    if (this._retryTimer) { clearInterval(this._retryTimer); this._retryTimer = null; }
    this._closeSsh();
    this._activeSource = null;
    this._activeUrl = null;
    this._failCount = 0;
  }

  _closeSsh() {
    if (this._sshSftp) { this._sshSftp = null; }
    if (this._sshConn) { try { this._sshConn.end(); } catch {} this._sshConn = null; }
  }

  updateIp(newIp) {
    if (this.ip === newIp) return;
    const wasActive = !!this._pollTimer;
    this.stop();
    this.ip = newIp;
    if (wasActive || this.enabled) this.start();
  }

  getSnapshot() { return this._lastFrame; }
  getSnapshotTime() { return this._lastFrameTime; }

  // ---- Discovery ----

  async _findAndStart() {
    // 1. Probe common HTTP snapshot paths directly (port 8080 first — camera server)
    const probeUrl = await this._probeSnapshotUrls();
    if (probeUrl) { this._startHttpPolling(probeUrl); return; }

    // 2. Moonraker webcam API (may return nginx-proxied URL)
    const apiUrl = await this._findFromMoonrakerApi();
    if (apiUrl) { this._startHttpPolling(apiUrl); return; }

    // 3. SSH snapshot (Snapmaker, MKS, Raspberry Pi)
    const sshResult = await this._findSshSource();
    if (sshResult) {
      this._sshCreds = sshResult.creds;
      this._sshPath = sshResult.path;
      this._startSshPolling();
      return;
    }

    // 4. Nothing found — retry periodically
    log.info(`No camera source found for ${this.ip} — retrying every ${this._retryInterval / 1000}s`);
    this._scheduleRetry();
  }

  _scheduleRetry() {
    if (this._retryTimer) return;
    this._retryTimer = setInterval(() => this._retryFind(), this._retryInterval);
  }

  async _retryFind() {
    const probeUrl = await this._probeSnapshotUrls();
    if (probeUrl) { this._clearRetry(); this._startHttpPolling(probeUrl); return; }

    const apiUrl = await this._findFromMoonrakerApi();
    if (apiUrl) { this._clearRetry(); this._startHttpPolling(apiUrl); return; }

    const sshResult = await this._findSshSource();
    if (sshResult) {
      this._clearRetry();
      this._sshCreds = sshResult.creds;
      this._sshPath = sshResult.path;
      this._startSshPolling();
    }
  }

  _clearRetry() {
    if (this._retryTimer) { clearInterval(this._retryTimer); this._retryTimer = null; }
  }

  // ---- HTTP discovery ----

  async _findFromMoonrakerApi() {
    try {
      const res = await fetch(`http://${this.ip}:${this.port}/server/webcams/list`, {
        headers: this.apiKey ? { 'X-Api-Key': this.apiKey } : {},
        signal: AbortSignal.timeout(3000)
      });
      if (!res.ok) return null;
      const data = await res.json();
      const webcams = data.result?.webcams || [];
      if (webcams.length === 0) return null;

      const cam = webcams.find(w => w.enabled) || webcams[0];
      const snapshotUrl = cam.snapshot_url || cam.stream_url;
      if (!snapshotUrl) return null;

      // Try the URL on the main port and common alternatives
      const ports = [this.port, 8080, 8081, 4408];
      for (const port of ports) {
        const fullUrl = snapshotUrl.startsWith('http')
          ? snapshotUrl
          : `http://${this.ip}:${port}${snapshotUrl.startsWith('/') ? '' : '/'}${snapshotUrl}`;
        if (await this._testHttpSnapshot(fullUrl)) return fullUrl;
      }
      return null;
    } catch { return null; }
  }

  async _probeSnapshotUrls() {
    for (const c of SNAPSHOT_CANDIDATES) {
      const url = `http://${this.ip}:${c.port || this.port}${c.path}`;
      if (await this._testHttpSnapshot(url)) return url;
    }
    return null;
  }

  async _testHttpSnapshot(url) {
    try {
      const res = await fetch(url, {
        headers: this.apiKey ? { 'X-Api-Key': this.apiKey } : {},
        signal: AbortSignal.timeout(3000)
      });
      if (!res.ok) return false;
      const ct = res.headers.get('content-type') || '';
      if (!ct.includes('image')) return false;
      const buf = Buffer.from(await res.arrayBuffer());
      return buf.length > 500;
    } catch { return false; }
  }

  // ---- SSH discovery ----

  async _findSshSource() {
    for (const creds of SSH_CREDENTIALS) {
      for (const path of SSH_CAMERA_PATHS) {
        const frame = await this._sshFetchFile(creds, path);
        if (frame && frame.length > 500) {
          log.info(`SSH kamera funnet: ${creds.username}@${this.ip}:${path} (${frame.length} bytes)`);
          this._lastFrame = frame;
          this._lastFrameTime = Date.now();
          return { creds, path };
        }
      }
    }
    return null;
  }

  _sshFetchFile(creds, remotePath) {
    return new Promise((resolve) => {
      const conn = new SSHClient();
      const timer = setTimeout(() => { conn.end(); resolve(null); }, 8000);

      conn.on('ready', () => {
        conn.sftp((err, sftp) => {
          if (err) { clearTimeout(timer); conn.end(); resolve(null); return; }
          sftp.readFile(remotePath, (err, buf) => {
            clearTimeout(timer);
            conn.end();
            if (err) return resolve(null);
            resolve(buf);
          });
        });
      });

      conn.on('error', () => { clearTimeout(timer); resolve(null); });

      conn.connect({
        host: this.ip,
        port: 22,
        username: creds.username,
        password: creds.password,
        readyTimeout: 5000,
        algorithms: { kex: ['diffie-hellman-group14-sha256', 'diffie-hellman-group14-sha1', 'ecdh-sha2-nistp256', 'ecdh-sha2-nistp384', 'ecdh-sha2-nistp521'] }
      });
    });
  }

  // ---- HTTP polling ----

  _startHttpPolling(url) {
    this._activeSource = 'http';
    this._activeUrl = url;
    this._failCount = 0;
    log.info(`Kamera aktivt (HTTP): ${url}`);
    this._fetchHttpFrame(url);
    this._pollTimer = setInterval(() => this._fetchHttpFrame(url), this._pollInterval);
  }

  async _fetchHttpFrame(url) {
    try {
      // Cache-bust to ensure fresh frame
      const bustUrl = url + (url.includes('?') ? '&' : '?') + '_t=' + Date.now();
      const res = await fetch(bustUrl, {
        headers: this.apiKey ? { 'X-Api-Key': this.apiKey } : {},
        signal: AbortSignal.timeout(5000)
      });
      if (res.ok) {
        const buf = Buffer.from(await res.arrayBuffer());
        if (buf.length > 500) {
          this._lastFrame = buf;
          this._lastFrameTime = Date.now();
          this._failCount = 0;
          return;
        }
      }
      this._handleFailure();
    } catch { this._handleFailure(); }
  }

  // ---- SSH polling with persistent connection ----

  _startSshPolling() {
    this._activeSource = 'ssh';
    this._failCount = 0;
    log.info(`Kamera aktivt (SSH): ${this._sshCreds.username}@${this.ip}:${this._sshPath} @ ${Math.round(1000 / this._pollInterval)} fps`);
    this._ensureSshConnection();
    this._pollTimer = setInterval(() => this._fetchSshFrame(), this._pollInterval);
  }

  _ensureSshConnection() {
    if (this._sshConn && this._sshSftp) return Promise.resolve();

    return new Promise((resolve) => {
      this._closeSsh();
      const conn = new SSHClient();
      const timer = setTimeout(() => { conn.end(); resolve(); }, 8000);

      conn.on('ready', () => {
        conn.sftp((err, sftp) => {
          clearTimeout(timer);
          if (err) { conn.end(); resolve(); return; }
          this._sshConn = conn;
          this._sshSftp = sftp;
          resolve();
        });
      });

      conn.on('error', () => { clearTimeout(timer); this._sshConn = null; this._sshSftp = null; resolve(); });
      conn.on('close', () => { this._sshConn = null; this._sshSftp = null; });

      conn.connect({
        host: this.ip,
        port: 22,
        username: this._sshCreds.username,
        password: this._sshCreds.password,
        readyTimeout: 5000,
        keepaliveInterval: 10000,
        algorithms: { kex: ['diffie-hellman-group14-sha256', 'diffie-hellman-group14-sha1', 'ecdh-sha2-nistp256', 'ecdh-sha2-nistp384', 'ecdh-sha2-nistp521'] }
      });
    });
  }

  async _fetchSshFrame() {
    // Reconnect if needed
    if (!this._sshSftp) {
      await this._ensureSshConnection();
      if (!this._sshSftp) { this._handleFailure(); return; }
    }

    try {
      const buf = await new Promise((resolve) => {
        this._sshSftp.readFile(this._sshPath, (err, data) => {
          if (err) return resolve(null);
          resolve(data);
        });
      });
      if (buf && buf.length > 500) {
        this._lastFrame = buf;
        this._lastFrameTime = Date.now();
        this._failCount = 0;
      } else {
        this._handleFailure();
      }
    } catch {
      this._sshSftp = null;
      this._handleFailure();
    }
  }

  // ---- Failure handling ----

  _handleFailure() {
    this._failCount++;
    if (this._failCount >= 5) {
      log.info(`Camera lost contact (${this._activeSource}) — starting new search`);
      if (this._pollTimer) { clearInterval(this._pollTimer); this._pollTimer = null; }
      this._activeSource = null;
      this._activeUrl = null;
      this._failCount = 0;
      this._scheduleRetry();
    }
  }

  /** Trigger a camera capture via Moonraker gcode. */
  async triggerCapture() {
    try {
      const res = await fetch(`http://${this.ip}:${this.port}/printer/gcode/script`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.apiKey ? { 'X-Api-Key': this.apiKey } : {})
        },
        body: JSON.stringify({ script: 'DEFECT_DETECTION_DETECT_BED' }),
        signal: AbortSignal.timeout(3000)
      });
      return res.ok;
    } catch { return false; }
  }
}
