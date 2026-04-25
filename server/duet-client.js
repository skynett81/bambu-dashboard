/**
 * DuetClient — RepRapFirmware HTTP REST API.
 *
 * Targets the official Duet WebControl / DSF (Duet Software Framework) HTTP
 * interface. Used by Duet 2 / Duet 3 / E3D Toolchanger / Hangprinter / many
 * high-end community builds.
 *
 * Protocol summary (rr_* endpoints):
 *   GET  /rr_connect?password=X&time=ISO    — open session, returns sessionTimeout
 *   GET  /rr_disconnect                       — close session
 *   GET  /rr_status?type=1|2|3                — printer/job/all status
 *   GET  /rr_gcode?gcode=URL_ENCODED          — send G-code
 *   POST /rr_upload?name=PATH&time=ISO        — file upload (raw body)
 *   GET  /rr_files?dir=0:/gcodes&first=0       — directory listing
 *   GET  /rr_fileinfo?name=PATH                — file metadata
 *   GET  /rr_delete?name=PATH                  — delete file
 *
 * Status field `status` maps to: I(dle), P(rinting), S(stopped), A(paused),
 * D(resuming), R(resuming), B(usy), F(lashing), C(onfiguring), M(simulating).
 */

import { createLogger } from './logger.js';
const log = createLogger('duet');

const STATUS_MAP = {
  I: 'idle', P: 'printing', S: 'stopped', A: 'paused',
  D: 'resuming', R: 'resuming', B: 'busy', F: 'flashing',
  C: 'configuring', M: 'simulating',
};

export class DuetClient {
  constructor(config, hub) {
    this.ip = config.printer.ip;
    this.password = config.printer.accessCode || config.printer.password || 'reprap';
    this.printerId = config.printer.id;
    this.hub = hub;
    this.connected = false;
    this.state = {};
    this._pollInterval = null;
    this._pollTimer = null;
    this._sessionExpires = 0;
  }

  _baseUrl() { return `http://${this.ip}`; }

  async _request(path, opts = {}) {
    const url = `${this._baseUrl()}${path}`;
    const res = await fetch(url, { ...opts, headers: { Accept: 'application/json', ...(opts.headers || {}) } });
    if (!res.ok) throw new Error(`Duet ${path}: ${res.status} ${res.statusText}`);
    const ct = res.headers.get('content-type') || '';
    if (ct.includes('application/json')) return res.json();
    return res.text();
  }

  async _ensureSession() {
    if (this.connected && Date.now() < this._sessionExpires) return;
    const time = encodeURIComponent(new Date().toISOString());
    const res = await this._request(`/rr_connect?password=${encodeURIComponent(this.password)}&time=${time}`);
    if (res?.err === 0 || res?.err === undefined) {
      this.connected = true;
      // sessionTimeout in ms; default to 8s if unspecified.
      const timeout = (res?.sessionTimeout && Number.isFinite(res.sessionTimeout)) ? res.sessionTimeout : 8000;
      this._sessionExpires = Date.now() + Math.max(2000, timeout - 500);
    } else {
      this.connected = false;
      throw new Error(`Duet rr_connect rejected (err=${res?.err})`);
    }
  }

  async connect() {
    try {
      await this._ensureSession();
      log.info(`Duet connected: ${this.ip}`);
      this._startPolling(2000);
    } catch (e) {
      log.error(`Duet connect failed (${this.ip}): ${e.message}`);
      this._scheduleRetry();
    }
  }

  disconnect() {
    if (this._pollTimer) { clearInterval(this._pollTimer); this._pollTimer = null; }
    if (this.connected) {
      this._request('/rr_disconnect').catch(() => {});
      this.connected = false;
    }
  }

  _scheduleRetry() {
    if (this._pollTimer) clearInterval(this._pollTimer);
    this._pollTimer = setTimeout(() => this.connect(), 10000);
  }

  _startPolling(ms) {
    if (this._pollTimer) clearInterval(this._pollTimer);
    this._pollInterval = ms;
    this._pollTimer = setInterval(() => this._poll(), ms);
    this._poll();
  }

  async _poll() {
    try {
      await this._ensureSession();
      // type=3 returns full machine state (incl. tools, axes, fans, sensors, job).
      const data = await this._request('/rr_status?type=3');
      this.state = this._normalizeStatus(data);
      this.hub?.broadcast?.('status', { printer_id: this.printerId, ...this.state });
    } catch (e) {
      // Connection lost — drop session and retry.
      this.connected = false;
      log.warn(`Duet poll failed (${this.ip}): ${e.message}`);
    }
  }

  /**
   * Normalise rr_status output into the dashboard's standard state schema.
   * Matches fields used by other clients (gcode_state, mc_percent, temps).
   */
  _normalizeStatus(s) {
    if (!s || typeof s !== 'object') return {};
    const status = STATUS_MAP[s.status] || 'unknown';
    const out = {
      gcode_state: status === 'printing' ? 'RUNNING' : status === 'paused' ? 'PAUSE' : status === 'idle' ? 'IDLE' : 'OFFLINE',
      _duet_status: status,
      mc_percent: 0,
    };
    // Job progress (fractionPrinted is 0..1).
    if (s.fractionPrinted != null) out.mc_percent = Math.round(s.fractionPrinted * 100);
    if (Array.isArray(s.temps?.current)) {
      const [bed, ...nozzles] = s.temps.current;
      out.bed_temper = bed;
      out.nozzle_temper = nozzles[0] ?? null;
      out.bed_target_temper = s.temps?.bed?.active ?? null;
      out.nozzle_target_temper = s.temps?.tools?.active?.[0]?.[0] ?? null;
    }
    if (Array.isArray(s.coords?.xyz)) {
      out.position = { x: s.coords.xyz[0], y: s.coords.xyz[1], z: s.coords.xyz[2] };
    }
    if (typeof s.params?.fanPercent?.[0] === 'number') {
      out.cooling_fan_speed = s.params.fanPercent[0];
    }
    if (typeof s.timesLeft?.file === 'number') out.time_remaining_min = Math.round(s.timesLeft.file / 60);
    if (typeof s.printDuration === 'number') out.elapsed_seconds = s.printDuration;
    return out;
  }

  // ── Command interface ──────────────────────────────────────────────

  async sendCommand(commandObj) {
    if (!this.connected) await this._ensureSession();
    const action = commandObj.action || commandObj._duet_action;
    const send = (gcode) =>
      this._request(`/rr_gcode?gcode=${encodeURIComponent(gcode)}`, { method: 'GET' }).catch((e) => {
        log.warn(`Duet gcode failed: ${e.message}`);
      });

    switch (action) {
      case 'pause':         return send('M25');
      case 'resume':        return send('M24');
      case 'stop':          return send('M0\nM112');
      case 'home':          return send('G28');
      case 'emergency_stop':return send('M112');
      case 'set_temp_nozzle': return send(`G10 P0 S${commandObj.target || 0}`);
      case 'set_temp_bed':    return send(`M140 S${commandObj.target || 0}`);
      case 'set_fan':        return send(`M106 S${Math.round((commandObj.value || 0) * 2.55)}`);
      case 'speed':          return send(`M220 S${commandObj.value || 100}`);
      case 'flowrate':       return send(`M221 S${commandObj.value || 100}`);
      case 'gcode':          return send(commandObj.gcode || '');
      case 'jog':            return send(`G91\nG1 X${commandObj.x || 0} Y${commandObj.y || 0} Z${commandObj.z || 0} F3000\nG90`);
      case 'light':          return send(commandObj.mode === 'on' ? 'M150 R255 U255 B255' : 'M150 R0 U0 B0');
      default:
        log.warn(`Unknown Duet command: ${action}`);
    }
  }

  // ── File operations ────────────────────────────────────────────────

  async uploadFile(filename, buffer, dir = '0:/gcodes') {
    await this._ensureSession();
    const safe = String(filename).replace(/[^a-zA-Z0-9._-]/g, '_');
    const path = `${dir}/${safe}`;
    const time = encodeURIComponent(new Date().toISOString());
    const url = `${this._baseUrl()}/rr_upload?name=${encodeURIComponent(path)}&time=${time}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/octet-stream', 'Content-Length': buffer.length },
      body: buffer,
    });
    if (!res.ok) throw new Error(`Duet upload: ${res.status} ${res.statusText}`);
    return { ok: true, uploaded: safe, path };
  }

  async uploadAndPrint(filename, buffer, dir = '0:/gcodes') {
    const result = await this.uploadFile(filename, buffer, dir);
    await this.sendCommand({ action: 'gcode', gcode: `M32 "${result.path}"` });
    return { ...result, started: true };
  }

  async listFiles(dir = '0:/gcodes') {
    await this._ensureSession();
    const data = await this._request(`/rr_files?dir=${encodeURIComponent(dir)}&first=0`);
    return Array.isArray(data?.files) ? data.files : [];
  }

  async getFileMetadata(path) {
    await this._ensureSession();
    return this._request(`/rr_fileinfo?name=${encodeURIComponent(path)}`);
  }

  async deleteFile(path) {
    await this._ensureSession();
    return this._request(`/rr_delete?name=${encodeURIComponent(path)}`);
  }

  async getPrinterInfo() {
    await this._ensureSession();
    return this._request('/rr_status?type=2');
  }
}

/**
 * Translate a generic client WebSocket message into a Duet command
 * object — pass-through with explicit `_duet_action` namespace so the
 * dispatcher in DuetClient.sendCommand knows what to do.
 */
export function buildDuetCommand(msg) {
  return { _duet_action: msg.action, ...msg };
}
