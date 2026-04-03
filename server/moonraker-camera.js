/**
 * MoonrakerCamera — Camera proxy for Klipper/Moonraker printers.
 *
 * Tries multiple snapshot sources automatically:
 * 1. Moonraker webcam API (queries /server/webcams/list for URLs)
 * 2. Common snapshot paths (/webcam/?action=snapshot, :8080, :8081)
 * 3. Crowsnest/camera-streamer default paths
 *
 * Periodically retries if no source is found (webcam may start later).
 * No external dependencies required (no sshpass, no ffmpeg).
 */

import { execFile } from 'node:child_process';
import { readFileSync, existsSync } from 'node:fs';
import { createLogger } from './logger.js';

const log = createLogger('moon-cam');

// Check if sshpass is available (for SSH-based camera fallback)
let _hasSshpass = null;
function hasSshpass() {
  if (_hasSshpass !== null) return _hasSshpass;
  try {
    const { execSync } = require('node:child_process');
    execSync('which sshpass', { stdio: 'ignore' });
    _hasSshpass = true;
  } catch {
    _hasSshpass = false;
  }
  return _hasSshpass;
}
// Async check on module load
import('node:child_process').then(({ execSync }) => {
  try { execSync('which sshpass', { stdio: 'ignore' }); _hasSshpass = true; } catch { _hasSshpass = false; }
});

const SNAPSHOT_CANDIDATES = [
  { path: '/webcam/?action=snapshot', port: null },
  { path: '/?action=snapshot', port: 8080 },
  { path: '/?action=snapshot', port: 8081 },
  { path: '/webcam/?action=snapshot', port: 4408 },
  { path: '/webcam/snapshot', port: null },
  { path: '/snapshot', port: null },
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
    this._activeUrl = null;
    this._pollInterval = 3000;
    this._retryInterval = 30000; // Retry finding camera every 30s
  }

  async start() {
    if (!this.enabled) return;
    await this._findAndStart();
  }

  stop() {
    if (this._pollTimer) { clearInterval(this._pollTimer); this._pollTimer = null; }
    if (this._retryTimer) { clearInterval(this._retryTimer); this._retryTimer = null; }
    this._activeUrl = null;
  }

  /** Update IP when printer changes network. */
  updateIp(newIp) {
    if (this.ip === newIp) return;
    const wasPolling = !!this._pollTimer;
    this.stop();
    this.ip = newIp;
    if (wasPolling || this.enabled) this.start();
  }

  /** Get latest JPEG frame (or null). */
  getSnapshot() { return this._lastFrame; }

  /** Get last frame timestamp. */
  getSnapshotTime() { return this._lastFrameTime; }

  // ---- Discovery ----

  async _findAndStart() {
    // 1. Try Moonraker webcam API first (most reliable)
    const apiUrl = await this._findFromMoonrakerApi();
    if (apiUrl) {
      this._startPolling(apiUrl);
      return;
    }

    // 2. Probe common snapshot paths
    const probeUrl = await this._probeSnapshotUrls();
    if (probeUrl) {
      this._startPolling(probeUrl);
      return;
    }

    // 3. SSH fallback (Snapmaker U1 — /tmp/printer_detection.jpg via sshpass)
    if (_hasSshpass) {
      const sshOk = await this._testSshSnapshot();
      if (sshOk) {
        log.info(`SSH kamera OK: ${this.ip} — starter SSH polling`);
        this._startSshPolling();
        return;
      }
    }

    // 4. No camera found — schedule periodic retry
    log.info(`Ingen kamerakilde funnet for ${this.ip} — prøver igjen hvert ${this._retryInterval / 1000}s`);
    if (!this._retryTimer) {
      this._retryTimer = setInterval(() => this._retryFind(), this._retryInterval);
    }
  }

  async _retryFind() {
    // Try Moonraker API
    const apiUrl = await this._findFromMoonrakerApi();
    if (apiUrl) {
      if (this._retryTimer) { clearInterval(this._retryTimer); this._retryTimer = null; }
      log.info(`Kamera funnet etter retry: ${apiUrl}`);
      this._startPolling(apiUrl);
      return;
    }

    // Try probing
    const probeUrl = await this._probeSnapshotUrls();
    if (probeUrl) {
      if (this._retryTimer) { clearInterval(this._retryTimer); this._retryTimer = null; }
      log.info(`Kamera funnet etter retry: ${probeUrl}`);
      this._startPolling(probeUrl);
      return;
    }

    // Try SSH fallback
    if (_hasSshpass) {
      const sshOk = await this._testSshSnapshot();
      if (sshOk) {
        if (this._retryTimer) { clearInterval(this._retryTimer); this._retryTimer = null; }
        log.info(`SSH kamera funnet etter retry: ${this.ip}`);
        this._startSshPolling();
      }
    }
  }

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

      // Use first enabled webcam
      const cam = webcams.find(w => w.enabled) || webcams[0];
      const snapshotUrl = cam.snapshot_url || cam.stream_url;
      if (!snapshotUrl) return null;

      // Build full URL — snapshot_url may be relative or absolute
      const fullUrl = snapshotUrl.startsWith('http')
        ? snapshotUrl
        : `http://${this.ip}:${this.port}${snapshotUrl.startsWith('/') ? '' : '/'}${snapshotUrl}`;

      // Verify it actually returns an image
      const ok = await this._testSnapshot(fullUrl);
      if (ok) return fullUrl;

      // Try on common alternative ports
      for (const altPort of [8080, 8081, 4408]) {
        const altUrl = `http://${this.ip}:${altPort}${snapshotUrl.startsWith('/') ? '' : '/'}${snapshotUrl}`;
        const altOk = await this._testSnapshot(altUrl);
        if (altOk) return altUrl;
      }

      return null;
    } catch {
      return null;
    }
  }

  async _probeSnapshotUrls() {
    for (const candidate of SNAPSHOT_CANDIDATES) {
      const port = candidate.port || this.port;
      const url = `http://${this.ip}:${port}${candidate.path}`;
      const ok = await this._testSnapshot(url);
      if (ok) return url;
    }
    return null;
  }

  async _testSnapshot(url) {
    try {
      const res = await fetch(url, {
        headers: this.apiKey ? { 'X-Api-Key': this.apiKey } : {},
        signal: AbortSignal.timeout(3000)
      });
      if (!res.ok) return false;
      const ct = res.headers.get('content-type') || '';
      if (!ct.includes('image')) return false;
      // Read a bit to make sure it's a real image
      const buf = Buffer.from(await res.arrayBuffer());
      return buf.length > 500;
    } catch {
      return false;
    }
  }

  // ---- Polling ----

  _startPolling(url) {
    this._activeUrl = url;
    log.info(`Kamera aktivt: ${url}`);

    // Fetch first frame immediately
    this._fetchFrame(url);

    this._pollTimer = setInterval(() => this._fetchFrame(url), this._pollInterval);
  }

  async _fetchFrame(url) {
    try {
      const res = await fetch(url, {
        headers: this.apiKey ? { 'X-Api-Key': this.apiKey } : {},
        signal: AbortSignal.timeout(5000)
      });
      if (res.ok) {
        const buf = Buffer.from(await res.arrayBuffer());
        if (buf.length > 500) {
          this._lastFrame = buf;
          this._lastFrameTime = Date.now();
          return;
        }
      }
      // Camera returned error — might have gone offline
      this._handleCameraLost();
    } catch {
      this._handleCameraLost();
    }
  }

  _handleCameraLost() {
    // If we get 5 consecutive failures, restart discovery
    this._failCount = (this._failCount || 0) + 1;
    if (this._failCount >= 5) {
      log.info(`Kamera mistet kontakt: ${this._activeUrl} — starter ny søk`);
      this._failCount = 0;
      if (this._pollTimer) { clearInterval(this._pollTimer); this._pollTimer = null; }
      this._activeUrl = null;
      // Start retry timer
      if (!this._retryTimer) {
        this._retryTimer = setInterval(() => this._retryFind(), this._retryInterval);
      }
    }
  }

  // ---- SSH-based snapshot (Snapmaker U1 fallback) ----

  _testSshSnapshot() {
    return new Promise((resolve) => {
      const tmpFile = `/tmp/.moonraker-snap-${this.ip.replace(/\./g, '-')}.jpg`;
      const args = [
        '-p', this._sshPass || 'snapmaker',
        'scp', '-o', 'StrictHostKeyChecking=no', '-o', 'ConnectTimeout=3',
        `lava@${this.ip}:/tmp/printer_detection.jpg`, tmpFile
      ];
      execFile('sshpass', args, { timeout: 8000 }, (err) => {
        if (err) return resolve(false);
        try {
          const buf = readFileSync(tmpFile);
          if (buf.length > 500) {
            this._lastFrame = buf;
            this._lastFrameTime = Date.now();
            return resolve(true);
          }
        } catch { /* ignore */ }
        resolve(false);
      });
    });
  }

  _startSshPolling() {
    this._activeUrl = 'ssh';
    this._pollTimer = setInterval(async () => {
      try {
        const ok = await this._testSshSnapshot();
        if (!ok) this._handleCameraLost();
      } catch { this._handleCameraLost(); }
    }, this._pollInterval);
  }

  /** Trigger a camera capture via Moonraker gcode (for printers that support it). */
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
    } catch {
      return false;
    }
  }
}
