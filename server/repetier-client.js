/**
 * RepetierClient — Repetier-Server REST API.
 *
 * Repetier-Server is a print-server suite that fronts one or more
 * physical printers behind a single web UI on port 3344. Each managed
 * printer has a unique slug. The REST surface lives at:
 *   http://server:3344/printer/api/{slug}/{command}?apikey={KEY}
 * with a parallel WebSocket on /socket?lang=en for live state, but
 * polling the REST `stateList` endpoint every 2s is enough for our
 * dashboard's needs and keeps the implementation simple.
 *
 * Reference: https://www.repetier-server.com/manuals/programming/API/index.html
 */

import { createLogger } from './logger.js';
const log = createLogger('repetier');

const POLL_MS = 2500;
const PORT_DEFAULT = 3344;

export class RepetierClient {
  constructor(config, hub) {
    this.ip = config.printer.ip;
    this.port = config.printer.port || PORT_DEFAULT;
    this.apiKey = config.printer.accessCode || config.printer.apiKey;
    // Repetier "slug" identifies which physical printer behind the server.
    // Stored under config.printer.slug (or fall back to printer.id).
    this.slug = config.printer.slug || config.printer.id;
    this.printerId = config.printer.id;
    this.hub = hub;
    this.connected = false;
    this.state = {};
    this._pollTimer = null;
  }

  _baseUrl() { return `http://${this.ip}:${this.port}`; }

  _withKey(path) {
    const sep = path.includes('?') ? '&' : '?';
    return `${path}${sep}apikey=${encodeURIComponent(this.apiKey || '')}`;
  }

  async _request(path, opts = {}) {
    const url = `${this._baseUrl()}${this._withKey(path)}`;
    const res = await fetch(url, { ...opts, headers: { Accept: 'application/json', ...(opts.headers || {}) } });
    if (!res.ok) throw new Error(`Repetier ${path}: ${res.status} ${res.statusText}`);
    const ct = res.headers.get('content-type') || '';
    if (ct.includes('application/json')) return res.json();
    return res.text();
  }

  async connect() {
    try {
      // Verify auth + slug by calling listPrinter.
      const info = await this._request('/printer/info');
      // info.printers array contains all slugs with their states.
      if (Array.isArray(info?.printers)) {
        const found = info.printers.find(p => p.slug === this.slug);
        if (!found) {
          log.warn(`Repetier slug '${this.slug}' not found among ${info.printers.length} printers`);
        }
      }
      this.connected = true;
      log.info(`Repetier connected: ${this.ip}:${this.port}/${this.slug}`);
      this._startPolling();
    } catch (e) {
      log.error(`Repetier connect failed: ${e.message}`);
      this._scheduleRetry();
    }
  }

  disconnect() {
    if (this._pollTimer) { clearInterval(this._pollTimer); this._pollTimer = null; }
    this.connected = false;
  }

  _scheduleRetry() {
    if (this._pollTimer) clearInterval(this._pollTimer);
    this._pollTimer = setTimeout(() => this.connect(), 10000);
  }

  _startPolling() {
    if (this._pollTimer) clearInterval(this._pollTimer);
    this._pollTimer = setInterval(() => this._poll(), POLL_MS);
    this._poll();
  }

  async _poll() {
    try {
      const data = await this._request(`/printer/api/${encodeURIComponent(this.slug)}?a=stateList`);
      this.state = this._normalizeState(data);
      this.hub?.broadcast?.('status', { printer_id: this.printerId, ...this.state });
    } catch (e) {
      this.connected = false;
      log.warn(`Repetier poll failed: ${e.message}`);
    }
  }

  _normalizeState(s) {
    if (!s || typeof s !== 'object') return {};
    // Repetier returns a per-slug object: state[slug] = { ... }
    const inner = s[this.slug] || (Object.values(s)[0] || {});
    const out = {
      gcode_state: 'OFFLINE',
      _repetier_status: inner.activeJob ? 'printing' : (inner.paused ? 'paused' : 'idle'),
    };
    if (inner.activeJob && inner.activeJob !== '') {
      out.gcode_state = inner.paused ? 'PAUSE' : 'RUNNING';
      if (typeof inner.done === 'number') out.mc_percent = Math.round(inner.done);
      if (typeof inner.printedTimeComp === 'number') out.elapsed_seconds = Math.round(inner.printedTimeComp);
    } else {
      out.gcode_state = 'IDLE';
    }
    if (Array.isArray(inner.extruder)) {
      out.nozzle_temper = inner.extruder[0]?.tempRead ?? null;
      out.nozzle_target_temper = inner.extruder[0]?.tempSet ?? null;
    }
    if (inner.heatedBeds && Array.isArray(inner.heatedBeds)) {
      out.bed_temper = inner.heatedBeds[0]?.tempRead ?? null;
      out.bed_target_temper = inner.heatedBeds[0]?.tempSet ?? null;
    }
    if (Array.isArray(inner.fans)) {
      out.cooling_fan_speed = inner.fans[0]?.value ?? 0;
    }
    return out;
  }

  // ── Command interface ──────────────────────────────────────────────

  async sendCommand(commandObj) {
    const slug = encodeURIComponent(this.slug);
    const send = (gcode) =>
      this._request(`/printer/api/${slug}?a=send&data=${encodeURIComponent(JSON.stringify({ cmd: gcode }))}`).catch((e) => {
        log.warn(`Repetier gcode failed: ${e.message}`);
      });
    const action = commandObj.action || commandObj._repetier_action;

    switch (action) {
      case 'pause':         return this._request(`/printer/api/${slug}?a=continueJob`);
      case 'resume':        return this._request(`/printer/api/${slug}?a=continueJob`);
      case 'stop':          return this._request(`/printer/api/${slug}?a=stopJob`);
      case 'home':          return send('G28');
      case 'emergency_stop':return send('M112');
      case 'set_temp_nozzle': return send(`M104 S${commandObj.target || 0}`);
      case 'set_temp_bed':    return send(`M140 S${commandObj.target || 0}`);
      case 'set_fan':         return send(`M106 S${Math.round((commandObj.value || 0) * 2.55)}`);
      case 'speed':           return send(`M220 S${commandObj.value || 100}`);
      case 'flowrate':        return send(`M221 S${commandObj.value || 100}`);
      case 'gcode':           return send(commandObj.gcode || '');
      case 'jog':             return send(`G91\nG1 X${commandObj.x || 0} Y${commandObj.y || 0} Z${commandObj.z || 0} F3000\nG90`);
      case 'light':           return send(commandObj.mode === 'on' ? 'M150 R255 U255 B255' : 'M150 R0 U0 B0');
      default:
        log.warn(`Unknown Repetier command: ${action}`);
    }
  }

  // ── File operations ────────────────────────────────────────────────

  async uploadFile(filename, buffer) {
    const slug = encodeURIComponent(this.slug);
    const url = `${this._baseUrl()}/printer/model/${slug}?${this._withKey('').slice(1)}`;
    const safe = String(filename).replace(/[^a-zA-Z0-9._-]/g, '_');
    // Repetier supports raw POST with octet-stream + name in query.
    const res = await fetch(`${url}&a=upload&filename=${encodeURIComponent(safe)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/octet-stream' },
      body: buffer,
    });
    if (!res.ok) throw new Error(`Repetier upload: ${res.status} ${res.statusText}`);
    return { ok: true, uploaded: safe };
  }

  async uploadAndPrint(filename, buffer) {
    const result = await this.uploadFile(filename, buffer);
    const slug = encodeURIComponent(this.slug);
    await this._request(`/printer/api/${slug}?a=copyModel&data=${encodeURIComponent(JSON.stringify({ name: result.uploaded, autostart: true }))}`);
    return { ...result, started: true };
  }

  async listFiles() {
    const slug = encodeURIComponent(this.slug);
    const data = await this._request(`/printer/api/${slug}?a=listModels`);
    return Array.isArray(data?.data) ? data.data : (Array.isArray(data) ? data : []);
  }

  async getPrinterInfo() {
    const info = await this._request('/printer/info');
    return info;
  }
}

export function buildRepetierCommand(msg) {
  return { _repetier_action: msg.action, ...msg };
}
