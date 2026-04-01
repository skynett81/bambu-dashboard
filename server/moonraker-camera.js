/**
 * MoonrakerCamera — Camera proxy for Klipper/Moonraker printers.
 *
 * For Snapmaker U1: captures via SSH + /tmp/printer_detection.jpg
 * (unisrv writes detection frames here continuously).
 *
 * For standard Moonraker: proxies /webcam/?action=snapshot endpoint.
 *
 * Serves JPEG snapshots via HTTP endpoint on the dashboard.
 */

import { execFile } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { createLogger } from './logger.js';

const log = createLogger('moon-cam');

export class MoonrakerCamera {
  constructor(config) {
    this.ip = config.printer.ip;
    this.apiKey = config.printer.accessCode || '';
    this.enabled = config.camera?.enabled !== false;
    this._lastFrame = null;
    this._lastFrameTime = 0;
    this._pollTimer = null;
    this._sshPass = null;
    this._snapshotPath = '/tmp/printer_detection.jpg'; // Snapmaker unisrv writes here
    this._pollInterval = 3000; // 3s between snapshots
  }

  /**
   * Try to detect the best camera source for this printer.
   */
  async start() {
    if (!this.enabled) return;

    // Try MJPEG snapshot first (standard Moonraker webcam)
    const mjpegUrl = `http://${this.ip}/webcam/?action=snapshot`;
    try {
      const res = await fetch(mjpegUrl, {
        headers: this.apiKey ? { 'X-Api-Key': this.apiKey } : {},
        signal: AbortSignal.timeout(3000)
      });
      if (res.ok) {
        const ct = res.headers.get('content-type') || '';
        if (ct.includes('image')) {
          log.info(`MJPEG snapshot tilgjengelig: ${mjpegUrl}`);
          this._startMjpegPoll(mjpegUrl);
          return;
        }
      }
    } catch { /* not available */ }

    // Try SSH snapshot (Snapmaker U1 — /tmp/printer_detection.jpg)
    try {
      log.info(`Prøver SSH kamera: ${this.ip}:${this._snapshotPath}...`);
      const frame = await this._sshSnapshot();
      if (frame && frame.length > 1000) {
        log.info(`SSH kamera OK: ${this.ip} — ${frame.length} bytes, starter polling`);
        this._lastFrame = frame;
        this._lastFrameTime = Date.now();
        this._startSshPoll();
        return;
      }
      log.info(`SSH kamera feilet: ${this.ip} — ${frame ? frame.length + ' bytes' : 'null'}`);
    } catch (e) {
      log.info(`SSH kamera unntak: ${e.message}`);
    }

    log.info(`Ingen kamerakilde funnet for ${this.ip}`);
  }

  stop() {
    if (this._pollTimer) {
      clearInterval(this._pollTimer);
      this._pollTimer = null;
    }
  }

  /** Get latest JPEG frame (or null). */
  getSnapshot() {
    return this._lastFrame;
  }

  /** Get last frame timestamp. */
  getSnapshotTime() {
    return this._lastFrameTime;
  }

  // ---- MJPEG polling ----
  _startMjpegPoll(url) {
    this._pollTimer = setInterval(async () => {
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
          }
        }
      } catch { /* skip */ }
    }, this._pollInterval);
  }

  // ---- SSH snapshot polling (Snapmaker U1) ----
  _startSshPoll() {
    this._pollTimer = setInterval(async () => {
      try {
        // Trigger a fresh camera capture before fetching
        await this._triggerMqttCapture();
        // Small delay for unisrv to write the file
        await new Promise(r => setTimeout(r, 500));
        const frame = await this._sshSnapshot();
        if (frame && frame.length > 500) {
          this._lastFrame = frame;
          this._lastFrameTime = Date.now();
        }
      } catch { /* skip */ }
    }, this._pollInterval);
  }

  // Trigger camera capture via local MQTT on printer
  async _triggerMqttCapture() {
    try {
      const args = [
        '-p', this._sshPass || 'snapmaker',
        'ssh', '-o', 'StrictHostKeyChecking=no', '-o', 'ConnectTimeout=2',
        `lava@${this.ip}`,
        "python3 -c \"import paho.mqtt.client as m;c=m.Client();c.connect('127.0.0.1',1883);c.publish('camera/request','{\\\"jsonrpc\\\":\\\"2.0\\\",\\\"method\\\":\\\"camera.detect_capture\\\",\\\"id\\\":1}');c.disconnect()\""
      ];
      await new Promise((resolve) => {
        execFile('sshpass', args, { timeout: 4000 }, () => resolve());
      });
    } catch { /* not critical */ }
  }

  _sshSnapshot() {
    return new Promise((resolve) => {
      const tmpFile = `/tmp/.moonraker-snap-${this.ip.replace(/\./g, '-')}.jpg`;
      const args = [
        '-p', this._sshPass || 'snapmaker',
        'scp', '-o', 'StrictHostKeyChecking=no', '-o', 'ConnectTimeout=3',
        `lava@${this.ip}:${this._snapshotPath}`,
        tmpFile
      ];
      execFile('sshpass', args, { timeout: 8000 }, (err) => {
        if (err) return resolve(null);
        try {
          const buf = readFileSync(tmpFile);
          resolve(buf.length > 500 ? buf : null);
        } catch {
          resolve(null);
        }
      });
    });
  }

  /**
   * Also try triggering a fresh capture via MQTT.
   * unisrv listens on camera/request topic.
   */
  async triggerCapture() {
    try {
      const res = await fetch(`http://${this.ip}/printer/gcode/script`, {
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
