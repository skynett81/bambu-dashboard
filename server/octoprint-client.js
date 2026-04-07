/**
 * OctoPrint REST API Client
 * Supports: Any 3D printer running OctoPrint (Ender 3, Prusa MK3, Anycubic, etc.)
 * Protocol: HTTP REST with API key auth, poll-based state updates
 *
 * API Reference: https://docs.octoprint.org/en/master/api/
 */

const log = {
  info: (...a) => console.log('[octoprint]', ...a),
  warn: (...a) => console.warn('[octoprint]', ...a),
  error: (...a) => console.error('[octoprint]', ...a),
};

const STATE_MAP = {
  'Operational':  'IDLE',
  'Printing':     'RUNNING',
  'Starting':     'RUNNING',
  'Pausing':      'PAUSE',
  'Paused':       'PAUSE',
  'Resuming':     'RUNNING',
  'Finishing':    'RUNNING',
  'Cancelling':   'PAUSE',
  'Offline':      'OFFLINE',
  'Error':        'FAILED',
  'Closed':       'OFFLINE',
  'Connecting':   'OFFLINE',
  'Ready':        'IDLE',
};

export class OctoPrintClient {
  constructor(config, hub) {
    this.ip = config.printer.ip;
    this.port = config.printer.port || 80;
    this._printerId = config.printer.id || '';
    this.apiKey = config.printer.accessCode || '';
    this.webcamUrl = config.printer.webcamUrl || '';
    this.hub = hub;
    this.state = {};
    this.connected = false;
    this._pollTimer = null;
    this._pollInterval = 2000;
    this.onFirmwareInfo = null;
    this.onXcamEvent = null;
  }

  get _baseUrl() {
    const proto = this.port === 443 ? 'https' : 'http';
    return `${proto}://${this.ip}:${this.port}`;
  }

  connect() {
    log.info(`Connecting to OctoPrint at ${this._baseUrl}`);
    this._poll();
  }

  disconnect() {
    this.connected = false;
    if (this._pollTimer) { clearTimeout(this._pollTimer); this._pollTimer = null; }
  }

  // ── Polling loop ──

  async _poll() {
    try {
      const [printer, job] = await Promise.all([
        this._apiGet('/api/printer'),
        this._apiGet('/api/job'),
      ]);

      if (!this.connected) {
        this.connected = true;
        this.hub.broadcast('connection', { status: 'connected' });
        log.info(`Connected to OctoPrint: ${this.ip}`);

        // Get version info on first connect
        try {
          const version = await this._apiGet('/api/version');
          if (version && this.onFirmwareInfo) {
            this.onFirmwareInfo({
              name: 'octoprint',
              sw_ver: version.text || version.server || '',
              hw_ver: version.api || '',
              sn: this._printerId,
            });
          }
        } catch {}
      }

      this._mergeState(printer, job);
      this.hub.broadcast('status', { print: this.state });
    } catch (e) {
      if (this.connected) {
        this.connected = false;
        this.hub.broadcast('connection', { status: 'disconnected' });
        log.warn(`OctoPrint disconnected: ${e.message}`);
      }
    }

    this._pollTimer = setTimeout(() => this._poll(), this._pollInterval);
  }

  // ── State mapping ──

  _mergeState(printer, job) {
    // Printer state
    if (printer?.state) {
      const stateText = printer.state.text || 'Offline';
      this.state.gcode_state = STATE_MAP[stateText] || 'IDLE';

      // Flags for more precise state
      const flags = printer.state.flags || {};
      if (flags.printing) this.state.gcode_state = 'RUNNING';
      else if (flags.pausing || flags.paused) this.state.gcode_state = 'PAUSE';
      else if (flags.cancelling) this.state.gcode_state = 'PAUSE';
      else if (flags.error) this.state.gcode_state = 'FAILED';
      else if (flags.closedOrError) this.state.gcode_state = 'OFFLINE';
    }

    // Temperatures
    if (printer?.temperature) {
      const tool0 = printer.temperature.tool0;
      if (tool0) {
        this.state.nozzle_temper = Math.round(tool0.actual ?? 0);
        this.state.nozzle_target_temper = Math.round(tool0.target ?? 0);
      }
      // Additional extruders
      const tool1 = printer.temperature.tool1;
      if (tool1) {
        this.state._nozzle2_temper = Math.round(tool1.actual ?? 0);
        this.state._nozzle2_target = Math.round(tool1.target ?? 0);
      }

      const bed = printer.temperature.bed;
      if (bed) {
        this.state.bed_temper = Math.round(bed.actual ?? 0);
        this.state.bed_target_temper = Math.round(bed.target ?? 0);
      }

      const chamber = printer.temperature.chamber;
      if (chamber) {
        this.state.chamber_temper = Math.round(chamber.actual ?? 0);
      }
    }

    // Job info
    if (job) {
      // Progress
      const progress = job.progress || {};
      if (progress.completion != null) {
        this.state.mc_percent = Math.round(progress.completion);
      }
      if (progress.printTimeLeft != null) {
        this.state.mc_remaining_time = Math.round(progress.printTimeLeft / 60);
      }
      if (progress.printTime != null) {
        this.state.print_duration_seconds = progress.printTime;
      }

      // File info
      const file = job.job?.file;
      if (file) {
        this.state.subtask_name = file.display || file.name || '';

        // Slicer analysis data
        const analysis = file.gcodeAnalysis;
        if (analysis) {
          if (analysis.estimatedPrintTime) {
            this.state._slicer_estimated_time = Math.round(analysis.estimatedPrintTime);
          }
          // Filament usage
          const filament = analysis.filament;
          if (filament?.tool0) {
            this.state.filament_used_mm = Math.round(filament.tool0.length || 0);
            this.state._slicer_filament_weight = Math.round((filament.tool0.volume || 0) * 1.24); // PLA density approx
          }
        }
      }

      // Filament data from job
      const jobFilament = job.job?.filament;
      if (jobFilament?.tool0) {
        this.state._filament_length_mm = Math.round(jobFilament.tool0.length || 0);
        this.state._filament_volume_cm3 = Math.round((jobFilament.tool0.volume || 0) * 100) / 100;
      }
    }

    // Fan speed (not directly available in OctoPrint API — use M106 tracking or leave unknown)
    // Speed override (not directly available — read via custom plugin or GCODE M220)
  }

  // ── Commands ──

  sendCommand(commandObj) {
    if (!this.connected) return;
    const action = commandObj._octoprint_action || commandObj.action;

    switch (action) {
      case 'pause':
        this._apiPost('/api/job', { command: 'pause', action: 'pause' });
        break;
      case 'resume':
        this._apiPost('/api/job', { command: 'pause', action: 'resume' });
        break;
      case 'stop':
        this._apiPost('/api/job', { command: 'cancel' });
        break;
      case 'print_file':
        this._apiPost('/api/files/local/' + encodeURIComponent(commandObj.filename), {
          command: 'select', print: true,
        });
        break;
      case 'speed':
        this._sendGcode(`M220 S${commandObj.value || 100}`);
        break;
      case 'set_nozzle_temp':
      case 'set_temp_nozzle':
        this._sendGcode(`M104 S${commandObj.target || 0}`);
        break;
      case 'set_bed_temp':
      case 'set_temp_bed':
        this._sendGcode(`M140 S${commandObj.target || 0}`);
        break;
      case 'set_fan':
        this._sendGcode(`M106 S${Math.round((commandObj.value || 0) * 2.55)}`);
        break;
      case 'home':
        this._apiPost('/api/printer/printhead', { command: 'home', axes: ['x', 'y', 'z'] });
        break;
      case 'jog':
        this._apiPost('/api/printer/printhead', {
          command: 'jog',
          x: commandObj.x || 0,
          y: commandObj.y || 0,
          z: commandObj.z || 0,
        });
        break;
      case 'emergency_stop':
        this._sendGcode('M112');
        break;
      case 'gcode':
        if (commandObj.gcode) this._sendGcode(commandObj.gcode);
        break;
      case 'light':
        // OctoPrint doesn't have native light control — try M355
        this._sendGcode(commandObj.mode === 'on' ? 'M355 S1' : 'M355 S0');
        break;
      default:
        log.warn(`Unknown OctoPrint command: ${action}`);
    }
  }

  async _sendGcode(gcode) {
    const commands = gcode.split('\n').map(c => c.trim()).filter(Boolean);
    await this._apiPost('/api/printer/command', { commands });
  }

  // ── Camera ──

  getSnapshotUrl() {
    if (this.webcamUrl) return this.webcamUrl;
    return `${this._baseUrl}/webcam/?action=snapshot`;
  }

  async getCameraFrame() {
    try {
      const url = this.getSnapshotUrl();
      const headers = {};
      if (this.apiKey) headers['X-Api-Key'] = this.apiKey;
      const res = await fetch(url, { headers, signal: AbortSignal.timeout(5000) });
      if (res.ok) return Buffer.from(await res.arrayBuffer());
    } catch {}
    return null;
  }

  // ── File management ──

  async listFiles() {
    const data = await this._apiGet('/api/files/local?recursive=false');
    if (!data?.files) return [];
    return data.files
      .filter(f => f.type === 'machinecode' || f.type === 'model')
      .map(f => ({
        path: f.display || f.name,
        size: f.size || 0,
        modified: f.date ? f.date * 1000 : 0,
        origin: 'local',
      }));
  }

  async uploadFile(filename, buffer) {
    const boundary = '----3DPrintForge' + Date.now();
    const header = `--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="${filename}"\r\nContent-Type: application/octet-stream\r\n\r\n`;
    const footer = `\r\n--${boundary}--\r\n`;
    const body = Buffer.concat([Buffer.from(header), buffer, Buffer.from(footer)]);

    const headers = { 'Content-Type': `multipart/form-data; boundary=${boundary}` };
    if (this.apiKey) headers['X-Api-Key'] = this.apiKey;

    const res = await fetch(`${this._baseUrl}/api/files/local`, {
      method: 'POST', headers, body, signal: AbortSignal.timeout(120000),
    });
    if (!res.ok) throw new Error(`OctoPrint upload failed: HTTP ${res.status}`);
    return res.json();
  }

  async uploadAndPrint(filename, buffer) {
    const boundary = '----3DPrintForge' + Date.now();
    const selectPart = `--${boundary}\r\nContent-Disposition: form-data; name="select"\r\n\r\ntrue\r\n`;
    const printPart = `--${boundary}\r\nContent-Disposition: form-data; name="print"\r\n\r\ntrue\r\n`;
    const filePart = `--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="${filename}"\r\nContent-Type: application/octet-stream\r\n\r\n`;
    const footer = `\r\n--${boundary}--\r\n`;
    const body = Buffer.concat([
      Buffer.from(selectPart + printPart + filePart), buffer, Buffer.from(footer),
    ]);

    const headers = { 'Content-Type': `multipart/form-data; boundary=${boundary}` };
    if (this.apiKey) headers['X-Api-Key'] = this.apiKey;

    const res = await fetch(`${this._baseUrl}/api/files/local`, {
      method: 'POST', headers, body, signal: AbortSignal.timeout(120000),
    });
    if (!res.ok) throw new Error(`OctoPrint upload+print failed: HTTP ${res.status}`);
    return res.json();
  }

  async deleteFile(filename) {
    await this._apiDelete(`/api/files/local/${encodeURIComponent(filename)}`);
  }

  // ── Printer info ──

  async getPrinterInfo() {
    const [version, connection] = await Promise.all([
      this._apiGet('/api/version'),
      this._apiGet('/api/connection'),
    ]);
    return {
      server: version?.server || '',
      api: version?.api || '',
      text: version?.text || '',
      state: connection?.current?.state || 'Closed',
      port: connection?.current?.port || '',
      baudrate: connection?.current?.baudrate || '',
    };
  }

  // ── HTTP helpers ──

  async _apiGet(path) {
    try {
      const headers = {};
      if (this.apiKey) headers['X-Api-Key'] = this.apiKey;
      const res = await fetch(`${this._baseUrl}${path}`, {
        method: 'GET', headers, signal: AbortSignal.timeout(5000),
      });
      if (res.status === 409) return null; // printer not connected
      if (!res.ok) return null;
      return res.json();
    } catch (e) {
      throw e; // propagate for connection detection
    }
  }

  async _apiPost(path, body) {
    try {
      const headers = { 'Content-Type': 'application/json' };
      if (this.apiKey) headers['X-Api-Key'] = this.apiKey;
      await fetch(`${this._baseUrl}${path}`, {
        method: 'POST', headers,
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(5000),
      });
    } catch (e) { log.error(`POST ${path}: ${e.message}`); }
  }

  async _apiDelete(path) {
    try {
      const headers = {};
      if (this.apiKey) headers['X-Api-Key'] = this.apiKey;
      await fetch(`${this._baseUrl}${path}`, {
        method: 'DELETE', headers, signal: AbortSignal.timeout(5000),
      });
    } catch (e) { log.error(`DELETE ${path}: ${e.message}`); }
  }
}

export function buildOctoPrintCommand(msg) {
  return { _octoprint_action: msg.action, ...msg };
}
