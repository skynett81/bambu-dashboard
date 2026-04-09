/**
 * AnkerMake Client — via ankerctl proxy
 *
 * AnkerMake printers (M5, M5C) use a proprietary MQTT + PPPP protocol
 * that requires Python's libflagship library. Direct Node.js implementation
 * is not feasible.
 *
 * Solution: The community tool "ankerctl" (github.com/Ankermgmt/ankermake-m5-protocol)
 * runs a local Flask web server that exposes an OctoPrint-compatible API:
 * - /api/version — server info (emulates OctoPrint format)
 * - /api/files/local — file upload
 * - /ws/mqtt — MQTT state via WebSocket
 * - /ws/video — camera stream via WebSocket
 * - /ws/ctrl — control commands (light, quality)
 *
 * This connector communicates with ankerctl's web interface.
 * User must run ankerctl alongside 3DPrintForge.
 *
 * Setup:
 * 1. Install ankerctl: pip install ankermake
 * 2. Configure with AnkerMake account token
 * 3. Run: ankerctl webserver --port 4470
 * 4. Add printer in 3DPrintForge: type=ankermake, ip=localhost, port=4470
 */

const log = {
  info: (...a) => console.log('[ankermake]', ...a),
  warn: (...a) => console.warn('[ankermake]', ...a),
  error: (...a) => console.error('[ankermake]', ...a),
};

export class AnkerMakeClient {
  constructor(config, hub) {
    this.ip = config.printer.ip || 'localhost';
    this.port = config.printer.port || 4470;
    this._printerId = config.printer.id || '';
    this.hub = hub;
    this.state = {};
    this.connected = false;
    this._pollTimer = null;
    this._pollInterval = 3000;
    this._ws = null;
    this.onFirmwareInfo = null;
    this.onXcamEvent = null;
  }

  get _baseUrl() {
    return `http://${this.ip}:${this.port}`;
  }

  connect() {
    log.info(`Connecting to ankerctl at ${this._baseUrl}`);
    this._connectWs();
    this._poll();
  }

  disconnect() {
    this.connected = false;
    if (this._pollTimer) { clearTimeout(this._pollTimer); this._pollTimer = null; }
    if (this._ws) { this._ws.close(); this._ws = null; }
  }

  // ── WebSocket for real-time MQTT state ──

  async _connectWs() {
    try {
      const { WebSocket } = await import('ws');
      const wsUrl = `ws://${this.ip}:${this.port}/ws/mqtt`;
      this._ws = new WebSocket(wsUrl);

      this._ws.on('message', (data) => {
        try {
          const msg = JSON.parse(data.toString());
          this._handleMqttMessage(msg);
        } catch {}
      });

      this._ws.on('close', () => {
        this._ws = null;
        // Will be retried by poll cycle
      });

      this._ws.on('error', () => {
        this._ws = null;
      });
    } catch {
      // WebSocket not available — rely on polling
    }
  }

  _handleMqttMessage(msg) {
    // ankerctl forwards AnkerMake MQTT messages
    if (msg.nozzle_temp !== undefined) this.state.nozzle_temper = Math.round(msg.nozzle_temp);
    if (msg.nozzle_target !== undefined) this.state.nozzle_target_temper = Math.round(msg.nozzle_target);
    if (msg.hotbed_temp !== undefined) this.state.bed_temper = Math.round(msg.hotbed_temp);
    if (msg.hotbed_target !== undefined) this.state.bed_target_temper = Math.round(msg.hotbed_target);
    if (msg.print_progress !== undefined) this.state.mc_percent = msg.print_progress;
    if (msg.print_speed !== undefined) this.state.spd_mag = msg.print_speed;
    if (msg.filename) this.state.subtask_name = msg.filename;
    if (msg.print_status !== undefined) {
      const statusMap = { 0: 'IDLE', 1: 'RUNNING', 2: 'PAUSE', 3: 'FINISH', 4: 'FAILED' };
      this.state.gcode_state = statusMap[msg.print_status] || 'IDLE';
    }
    if (msg.remaining_time !== undefined) this.state.mc_remaining_time = msg.remaining_time;
    if (msg.elapsed_time !== undefined) this.state.print_duration_seconds = msg.elapsed_time;
    if (msg.fan_speed !== undefined) this.state.cooling_fan_speed = msg.fan_speed;
    if (msg.layer_count !== undefined) this.state.total_layer_num = msg.layer_count;
    if (msg.current_layer !== undefined) this.state.layer_num = msg.current_layer;

    this.hub.broadcast('status', { print: this.state });
  }

  // ── HTTP polling (fallback + version check) ──

  async _poll() {
    try {
      const version = await this._apiGet('/api/version');
      if (version && !this.connected) {
        this.connected = true;
        this.hub.broadcast('connection', { status: 'connected' });
        log.info(`Connected to ankerctl: ${this.ip}:${this.port}`);
        if (this.onFirmwareInfo) {
          this.onFirmwareInfo({
            name: 'ankermake', sw_ver: version.server || '',
            hw_ver: version.text || '', sn: this._printerId,
          });
        }
      }
    } catch {
      if (this.connected) {
        this.connected = false;
        this.hub.broadcast('connection', { status: 'disconnected' });
        log.warn('ankerctl disconnected');
      }
    }

    this._pollTimer = setTimeout(() => this._poll(), this._pollInterval);
  }

  // ── Commands ──

  sendCommand(commandObj) {
    if (!this.connected) return;
    const action = commandObj._ankermake_action || commandObj.action;

    switch (action) {
      case 'light':
        this._wsCtrl({ light: commandObj.mode === 'on' });
        break;
      case 'gcode':
        if (commandObj.gcode) this._apiPost('/api/gcode', { command: commandObj.gcode });
        break;
      case 'print_file':
        // Upload and print via ankerctl's OctoPrint-compatible endpoint
        log.info(`Print file: ${commandObj.filename}`);
        break;
      default:
        log.warn(`Unknown AnkerMake command: ${action}`);
    }
  }

  _wsCtrl(msg) {
    if (this._ws?.readyState === 1) {
      // ankerctl's /ws/ctrl accepts JSON messages
      try {
        const { WebSocket } = require('ws');
        const ctrl = new WebSocket(`ws://${this.ip}:${this.port}/ws/ctrl`);
        ctrl.on('open', () => { ctrl.send(JSON.stringify(msg)); ctrl.close(); });
      } catch {}
    }
  }

  // ── File management (via ankerctl OctoPrint-compatible API) ──

  async uploadFile(filename, buffer) {
    const boundary = '----3DPrintForge' + Date.now();
    const header = `--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="${filename}"\r\nContent-Type: application/octet-stream\r\n\r\n`;
    const footer = `\r\n--${boundary}--\r\n`;
    const body = Buffer.concat([Buffer.from(header), buffer, Buffer.from(footer)]);
    const res = await fetch(`${this._baseUrl}/api/files/local`, {
      method: 'POST', headers: { 'Content-Type': `multipart/form-data; boundary=${boundary}` },
      body, signal: AbortSignal.timeout(120000),
    });
    if (!res.ok) throw new Error(`Upload failed: HTTP ${res.status}`);
    return res.json();
  }

  async listFiles() { return []; } // ankerctl doesn't list files
  async getCameraFrame() { return null; } // Camera via /ws/video WebSocket
  getSnapshotUrl() { return `${this._baseUrl}/video`; }

  async getPrinterInfo() {
    return this._apiGet('/api/version');
  }

  // ── HTTP helpers ──

  async _apiGet(path) {
    const res = await fetch(`${this._baseUrl}${path}`, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  }

  async _apiPost(path, body) {
    try {
      await fetch(`${this._baseUrl}${path}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body), signal: AbortSignal.timeout(5000),
      });
    } catch (e) { log.error(`POST ${path}: ${e.message}`); }
  }
}

export function buildAnkerMakeCommand(msg) {
  return { _ankermake_action: msg.action, ...msg };
}
