/**
 * Snapmaker 2.0 HTTP API Client
 * For: Snapmaker 2.0 A150, A250, A350 (non-SACP machines)
 * Protocol: HTTP REST on port 8080 with token-based auth
 *
 * API reference (from Luban source: SstpHttpChannel.ts):
 *   POST /api/v1/connect       → Connect (returns token, requires printer approval)
 *   GET  /api/v1/status?token= → Status (200=auth'd, 204=pending, 401=denied)
 *   POST /api/v1/upload        → Upload G-code file
 *   POST /api/v1/start_print   → Start printing uploaded file
 *   POST /api/v1/disconnect    → Disconnect
 *   GET  /api/v1/enclosure     → Enclosure status
 *   GET  /api/v1/version       → Firmware version info
 *
 * G-code execution: via serial commands through the HTTP channel
 * Temperature control: via G-code (M104, M140, M109, M190)
 */

const log = {
  info: (...a) => console.log('[sm-http]', ...a),
  warn: (...a) => console.warn('[sm-http]', ...a),
  error: (...a) => console.error('[sm-http]', ...a),
};

const STATE_MAP = {
  'IDLE': 'IDLE',
  'RUNNING': 'RUNNING',
  'PAUSED': 'PAUSE',
  'STOPPED': 'IDLE',
  'FINISH': 'FINISH',
  'UNKNOWN': 'IDLE',
};

export class SnapmakerHttpClient {
  constructor(config, hub) {
    this.ip = config.printer.ip;
    this.port = config.printer.port || 8080;
    this._printerId = config.printer.id || '';
    this.hub = hub;
    this.state = {};
    this.connected = false;
    this._token = null;
    this._pollTimer = null;
    this._pollInterval = 2000;
    this._connectionState = 'disconnected'; // disconnected | pending | connected
    this.onFirmwareInfo = null;
    this.onXcamEvent = null;
  }

  get _baseUrl() {
    return `http://${this.ip}:${this.port}`;
  }

  // ── Connection lifecycle ──

  connect() {
    log.info(`Connecting to Snapmaker HTTP at ${this._baseUrl}`);
    this._initiateConnection();
  }

  disconnect() {
    this.connected = false;
    if (this._pollTimer) { clearTimeout(this._pollTimer); this._pollTimer = null; }
    if (this._token) {
      // Send disconnect
      this._post('/api/v1/disconnect', { token: this._token }).catch(() => {});
      this._token = null;
    }
  }

  async _initiateConnection() {
    try {
      // Step 1: Request connection (user must approve on printer touchscreen)
      const resp = await this._post('/api/v1/connect', { token: '' });
      if (resp?.token) {
        this._token = resp.token;
        this._connectionState = 'pending';
        log.info('Connection requested — waiting for printer approval...');

        // Poll for approval
        this._pollApproval();
        return;
      }
      throw new Error('No token in connect response');
    } catch (e) {
      log.error(`Connection failed: ${e.message}`);
      // Retry after delay
      this._pollTimer = setTimeout(() => this._initiateConnection(), 10000);
    }
  }

  async _pollApproval() {
    try {
      const res = await fetch(`${this._baseUrl}/api/v1/status?token=${this._token}`, {
        signal: AbortSignal.timeout(5000),
      });

      if (res.status === 200) {
        // Approved!
        this._connectionState = 'connected';
        this.connected = true;
        this.hub.broadcast('connection', { status: 'connected' });
        log.info(`Connected to Snapmaker 2.0: ${this.ip}`);

        // Get firmware info
        await this._fetchFirmwareInfo();

        // Start status polling
        this._poll();
        return;
      } else if (res.status === 204) {
        // Still waiting for approval
        log.info('Waiting for approval on printer touchscreen...');
      } else if (res.status === 401) {
        // Denied
        log.warn('Connection denied by printer');
        this._connectionState = 'disconnected';
        this._token = null;
        // Retry after longer delay
        this._pollTimer = setTimeout(() => this._initiateConnection(), 30000);
        return;
      }
    } catch (e) {
      log.warn(`Approval poll failed: ${e.message}`);
    }

    // Continue polling for approval
    this._pollTimer = setTimeout(() => this._pollApproval(), 2000);
  }

  async _fetchFirmwareInfo() {
    try {
      const res = await fetch(`${this._baseUrl}/api/v1/version?token=${this._token}`, {
        signal: AbortSignal.timeout(5000),
      });
      if (res.ok) {
        const info = await res.json();
        if (this.onFirmwareInfo) {
          this.onFirmwareInfo({
            name: 'snapmaker-http',
            sw_ver: info.firmware_version || info.version || '',
            hw_ver: info.model || 'Snapmaker 2.0',
            sn: info.serial || this._printerId,
          });
        }
      }
    } catch {}
  }

  // ── Status polling ──

  async _poll() {
    try {
      const res = await fetch(`${this._baseUrl}/api/v1/status?token=${this._token}`, {
        signal: AbortSignal.timeout(5000),
      });

      if (res.status === 401) {
        // Token expired — reconnect
        this.connected = false;
        this._token = null;
        this.hub.broadcast('connection', { status: 'disconnected' });
        log.warn('Token expired — reconnecting');
        this._initiateConnection();
        return;
      }

      if (res.ok) {
        const data = await res.json();
        this._mergeState(data);
        this.hub.broadcast('status', { print: this.state });
      }
    } catch (e) {
      if (this.connected) {
        this.connected = false;
        this.hub.broadcast('connection', { status: 'disconnected' });
        log.warn(`Poll failed: ${e.message}`);
      }
      // Retry connection
      this._pollTimer = setTimeout(() => this._initiateConnection(), 5000);
      return;
    }

    this._pollTimer = setTimeout(() => this._poll(), this._pollInterval);
  }

  _mergeState(data) {
    // Machine state
    if (data.status) {
      this.state.gcode_state = STATE_MAP[data.status] || 'IDLE';
    }

    // Temperatures (if available in status response)
    if (data.nozzleTemperature !== undefined) {
      this.state.nozzle_temper = Math.round(data.nozzleTemperature);
    }
    if (data.nozzleTargetTemperature !== undefined) {
      this.state.nozzle_target_temper = Math.round(data.nozzleTargetTemperature);
    }
    if (data.heatedBedTemperature !== undefined) {
      this.state.bed_temper = Math.round(data.heatedBedTemperature);
    }
    if (data.heatedBedTargetTemperature !== undefined) {
      this.state.bed_target_temper = Math.round(data.heatedBedTargetTemperature);
    }

    // Progress
    if (data.progress !== undefined) {
      this.state.mc_percent = Math.round(data.progress * 100);
    }
    if (data.elapsedTime !== undefined) {
      this.state.print_duration_seconds = data.elapsedTime;
    }
    if (data.estimatedTime !== undefined && data.elapsedTime !== undefined) {
      const remaining = Math.max(0, data.estimatedTime - data.elapsedTime);
      this.state.mc_remaining_time = Math.round(remaining / 60);
    }

    // Current file
    if (data.fileName) {
      this.state.subtask_name = data.fileName;
    }

    // Enclosure
    if (data.enclosure) {
      this.state._enclosure = {
        led: data.enclosure.led,
        fan: data.enclosure.fan,
        doorOpen: data.enclosure.door,
      };
    }

    // Position
    if (data.x !== undefined) {
      this.state._position = {
        x: Math.round(data.x * 100) / 100,
        y: Math.round(data.y * 100) / 100,
        z: Math.round(data.z * 100) / 100,
      };
    }
  }

  // ── Commands ──

  sendCommand(commandObj) {
    if (!this.connected || !this._token) return;
    const action = commandObj._smhttp_action || commandObj.action;

    switch (action) {
      case 'pause':
        this._executeGcode('M0'); // Pause
        break;
      case 'resume':
        this._executeGcode('M24'); // Resume
        break;
      case 'stop':
        this._executeGcode('M2'); // Stop
        break;
      case 'speed':
        this._executeGcode(`M220 S${commandObj.value || 100}`);
        break;
      case 'set_nozzle_temp':
      case 'set_temp_nozzle':
        this._executeGcode(`M104 S${commandObj.target || 0}`);
        break;
      case 'set_bed_temp':
      case 'set_temp_bed':
        this._executeGcode(`M140 S${commandObj.target || 0}`);
        break;
      case 'set_fan':
        this._executeGcode(`M106 S${Math.round((commandObj.value || 0) * 2.55)}`);
        break;
      case 'home':
        this._executeGcode('G28');
        break;
      case 'light':
        this._executeGcode(commandObj.mode === 'on' ? 'M1010 S1' : 'M1010 S0');
        break;
      case 'emergency_stop':
        this._executeGcode('M112');
        break;
      case 'gcode':
        if (commandObj.gcode) this._executeGcode(commandObj.gcode);
        break;
      default:
        log.warn(`Unknown Snapmaker HTTP command: ${action}`);
    }
  }

  async _executeGcode(gcode) {
    try {
      await this._post('/api/v1/gcode', { token: this._token, code: gcode });
    } catch (e) {
      log.error(`G-code failed: ${gcode}: ${e.message}`);
    }
  }

  // ── File management ──

  async uploadFile(filename, buffer) {
    const boundary = '----3DPrintForge' + Date.now();
    const tokenPart = `--${boundary}\r\nContent-Disposition: form-data; name="token"\r\n\r\n${this._token}\r\n`;
    const filePart = `--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="${filename}"\r\nContent-Type: application/octet-stream\r\n\r\n`;
    const footer = `\r\n--${boundary}--\r\n`;
    const body = Buffer.concat([
      Buffer.from(tokenPart + filePart), buffer, Buffer.from(footer),
    ]);

    const res = await fetch(`${this._baseUrl}/api/v1/upload`, {
      method: 'POST',
      headers: { 'Content-Type': `multipart/form-data; boundary=${boundary}` },
      body,
      signal: AbortSignal.timeout(120000),
    });
    if (!res.ok) throw new Error(`Upload failed: HTTP ${res.status}`);
    return res.json();
  }

  async uploadAndPrint(filename, buffer) {
    await this.uploadFile(filename, buffer);
    await this._post('/api/v1/start_print', { token: this._token, filename });
    return { filename };
  }

  async getCameraFrame() {
    // Snapmaker 2.0 doesn't have a camera API
    return null;
  }

  getSnapshotUrl() {
    return null;
  }

  async getPrinterInfo() {
    try {
      const res = await fetch(`${this._baseUrl}/api/v1/version?token=${this._token}`, {
        signal: AbortSignal.timeout(5000),
      });
      if (res.ok) return res.json();
    } catch {}
    return null;
  }

  // ── HTTP helpers ──

  async _post(path, body) {
    const res = await fetch(`${this._baseUrl}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok && res.status !== 204) return null;
    try { return await res.json(); } catch { return null; }
  }
}

export function buildSnapmakerHttpCommand(msg) {
  return { _smhttp_action: msg.action, ...msg };
}
