/**
 * OctoPrint Client — Full implementation
 * Supports: Any 3D printer running OctoPrint (Ender 3, Prusa MK3, Anycubic, etc.)
 *
 * Features:
 * - SockJS WebSocket for real-time state updates (2Hz) with HTTP polling fallback
 * - Native REST API for temperature, tool, bed, chamber control
 * - Connection management (connect/disconnect serial port)
 * - Printer profiles (build volume, extruder count, heated bed/chamber)
 * - System commands (restart, reboot, shutdown)
 * - Full file management (list recursive, upload, select, copy, move, delete, SD)
 * - Timelapse management (list, config, delete, render)
 * - Settings read/write
 * - Error info with terminal log
 * - Plugin API (PSU Control, Filament Manager, Bed Level Visualizer)
 * - Slicing API
 *
 * API Reference: https://docs.octoprint.org/en/master/api/
 */

import http from 'node:http';

const log = {
  info: (...a) => console.log('[octoprint]', ...a),
  warn: (...a) => console.warn('[octoprint]', ...a),
  error: (...a) => console.error('[octoprint]', ...a),
};

const STATE_MAP = {
  'Operational': 'IDLE', 'Printing': 'RUNNING', 'Starting': 'RUNNING',
  'Pausing': 'PAUSE', 'Paused': 'PAUSE', 'Resuming': 'RUNNING',
  'Finishing': 'RUNNING', 'Cancelling': 'PAUSE', 'Offline': 'OFFLINE',
  'Error': 'FAILED', 'Closed': 'OFFLINE', 'Connecting': 'OFFLINE', 'Ready': 'IDLE',
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
    this._wsConnected = false;
    this._sessionKey = null;
    this.onFirmwareInfo = null;
    this.onXcamEvent = null;

    // Cached data
    this._printerProfile = null;
    this._settings = null;
    this._plugins = null;
  }

  get _baseUrl() {
    const proto = this.port === 443 ? 'https' : 'http';
    return `${proto}://${this.ip}:${this.port}`;
  }

  // ══════════════════════════════════════════
  // CONNECTION LIFECYCLE
  // ══════════════════════════════════════════

  connect() {
    log.info(`Connecting to OctoPrint at ${this._baseUrl}`);
    this._connectWithWebSocket();
  }

  disconnect() {
    this.connected = false;
    this._wsConnected = false;
    if (this._pollTimer) { clearTimeout(this._pollTimer); this._pollTimer = null; }
  }

  async _connectWithWebSocket() {
    // Try WebSocket first, fall back to polling
    try {
      // Step 1: Passive login to get session key
      const loginRes = await this._apiPost('/api/login', { passive: true });
      if (loginRes?.name) {
        this._sessionKey = loginRes.session || loginRes._session || '';
        log.info(`Passive login as: ${loginRes.name}`);
      }
    } catch {}

    // Step 2: Try SockJS WebSocket
    // OctoPrint uses SockJS at /sockjs/websocket
    try {
      const wsProto = this.port === 443 ? 'wss' : 'ws';
      const wsUrl = `${wsProto}://${this.ip}:${this.port}/sockjs/websocket`;
      const { WebSocket } = await import('ws');
      const ws = new WebSocket(wsUrl);

      ws.on('open', () => {
        log.info('WebSocket connected');
        this._wsConnected = true;

        // Authenticate on socket
        if (this._sessionKey) {
          ws.send(JSON.stringify({ auth: `${this.apiKey}:${this._sessionKey}` }));
        }
      });

      ws.on('message', (data) => {
        try {
          const msg = JSON.parse(data.toString());
          this._handleWsMessage(msg);
        } catch {}
      });

      ws.on('close', () => {
        this._wsConnected = false;
        log.info('WebSocket closed — falling back to polling');
        if (this.connected) this._startPolling();
      });

      ws.on('error', () => {
        this._wsConnected = false;
        // Fall back to polling silently
        this._startPolling();
      });

      // Give WS 3 seconds to connect, otherwise start polling
      setTimeout(() => {
        if (!this._wsConnected && !this.connected) this._startPolling();
      }, 3000);

    } catch {
      // WebSocket not available — use polling
      this._startPolling();
    }
  }

  _handleWsMessage(msg) {
    // OctoPrint SockJS message types: connected, current, history, event, plugin
    if (msg.connected) {
      // Initial connection info
      if (!this.connected) {
        this.connected = true;
        this.hub.broadcast('connection', { status: 'connected' });
        log.info(`Connected to OctoPrint: ${this.ip} (WebSocket)`);
        this._fetchInitialData();
      }
    }

    if (msg.current) {
      // Real-time state update (2Hz)
      this._mergeWsState(msg.current);
      this.hub.broadcast('status', { print: this.state });
    }

    if (msg.history) {
      // Full state history on connect
      this._mergeWsState(msg.history);
      this.hub.broadcast('status', { print: this.state });
    }

    if (msg.event) {
      // System events
      const evt = msg.event;
      if (evt.type === 'PrintFailed' || evt.type === 'Error') {
        this.state._lastError = evt.payload;
      }
      if (evt.type === 'PrintDone') {
        this.state.gcode_state = 'FINISH';
        this.hub.broadcast('status', { print: this.state });
      }
    }

    if (msg.plugin) {
      // Plugin messages
      this.state._pluginData = { ...(this.state._pluginData || {}), [msg.plugin.plugin]: msg.plugin.data };
    }
  }

  _mergeWsState(current) {
    // State
    if (current.state) {
      const stateText = current.state.text || 'Offline';
      this.state.gcode_state = STATE_MAP[stateText] || 'IDLE';
      const flags = current.state.flags || {};
      if (flags.printing) this.state.gcode_state = 'RUNNING';
      else if (flags.pausing || flags.paused) this.state.gcode_state = 'PAUSE';
      else if (flags.error) this.state.gcode_state = 'FAILED';
      else if (flags.closedOrError) this.state.gcode_state = 'OFFLINE';
    }

    // Temperatures
    if (current.temps?.length) {
      const latest = current.temps[current.temps.length - 1];
      if (latest.tool0) {
        this.state.nozzle_temper = Math.round(latest.tool0.actual ?? 0);
        this.state.nozzle_target_temper = Math.round(latest.tool0.target ?? 0);
      }
      if (latest.tool1) {
        this.state._nozzle2_temper = Math.round(latest.tool1.actual ?? 0);
        this.state._nozzle2_target = Math.round(latest.tool1.target ?? 0);
      }
      if (latest.bed) {
        this.state.bed_temper = Math.round(latest.bed.actual ?? 0);
        this.state.bed_target_temper = Math.round(latest.bed.target ?? 0);
      }
      if (latest.chamber) {
        this.state.chamber_temper = Math.round(latest.chamber.actual ?? 0);
      }
    }

    // Job progress
    if (current.progress) {
      if (current.progress.completion != null) this.state.mc_percent = Math.round(current.progress.completion);
      if (current.progress.printTimeLeft != null) this.state.mc_remaining_time = Math.round(current.progress.printTimeLeft / 60);
      if (current.progress.printTime != null) this.state.print_duration_seconds = current.progress.printTime;
    }

    // Job file
    if (current.job?.file) {
      this.state.subtask_name = current.job.file.display || current.job.file.name || '';
      const analysis = current.job.file.gcodeAnalysis;
      if (analysis?.estimatedPrintTime) this.state._slicer_estimated_time = Math.round(analysis.estimatedPrintTime);
      if (analysis?.filament?.tool0) {
        this.state.filament_used_mm = Math.round(analysis.filament.tool0.length || 0);
        this.state._slicer_filament_weight = Math.round((analysis.filament.tool0.volume || 0) * 1.24);
      }
    }

    // Position — X, Y from offsets/resend, Z from currentZ
    if (current.currentZ != null) {
      this.state._position = { ...(this.state._position || {}), z: current.currentZ };
    }
    // Track X/Y from job position if available
    if (current.job?.position) {
      this.state._position = {
        ...(this.state._position || {}),
        x: current.job.position.x ?? this.state._position?.x,
        y: current.job.position.y ?? this.state._position?.y,
      };
    }

    // Print time left estimate
    if (current.progress?.printTimeLeft != null) {
      this.state.mc_remaining_time = Math.round(current.progress.printTimeLeft / 60);
    }

    // Logs (last 10 lines for terminal)
    if (current.logs?.length) {
      this.state._terminalLog = current.logs.slice(-10);
    }

    // Resends / communication quality
    if (current.resends) {
      this.state._resends = {
        count: current.resends.count || 0,
        transmitted: current.resends.transmitted || 0,
        ratio: current.resends.ratio || 0,
      };
    }
  }

  async _fetchInitialData() {
    // Fetch version, profile, settings in parallel
    try {
      const [version, profile, settings] = await Promise.all([
        this._apiGet('/api/version'),
        this._apiGet('/api/printerprofiles'),
        this._apiGet('/api/settings'),
      ]);

      if (version && this.onFirmwareInfo) {
        this.onFirmwareInfo({
          name: 'octoprint', sw_ver: version.text || version.server || '',
          hw_ver: version.api || '', sn: this._printerId,
        });
      }

      // Cache printer profile
      if (profile?.profiles) {
        const defaultProfile = Object.values(profile.profiles).find(p => p.default) || Object.values(profile.profiles)[0];
        if (defaultProfile) {
          this._printerProfile = defaultProfile;
          this.state._buildVolume = defaultProfile.volume || {};
          this.state._extruderCount = defaultProfile.extruder?.count || 1;
          this.state._heatedBed = defaultProfile.heatedBed ?? true;
          this.state._heatedChamber = defaultProfile.heatedChamber ?? false;
          this.state._printerProfile = {
            name: defaultProfile.name,
            model: defaultProfile.model || '',
            volume: defaultProfile.volume,
            extruders: defaultProfile.extruder,
            axes: defaultProfile.axes,
          };
          // Nozzle diameter from profile
          if (defaultProfile.extruder?.nozzleDiameter) {
            this.state.nozzle_diameter = defaultProfile.extruder.nozzleDiameter;
          }
        }
      }

      // Cache settings (webcam URLs, etc.)
      if (settings) {
        this._settings = settings;
        if (!this.webcamUrl && settings.webcam?.snapshotUrl) {
          this.webcamUrl = settings.webcam.snapshotUrl;
        }
        // Detect installed plugins
        if (settings.plugins) {
          this._plugins = Object.keys(settings.plugins);
          this.state._installedPlugins = this._plugins;
        }
      }
    } catch (e) { log.warn(`Initial data fetch failed: ${e.message}`); }

    // Fetch disk usage and plugin data in background
    try {
      const [diskInfo, connInfo] = await Promise.all([
        this._apiGet('/api/files/local').catch(() => null),
        this._apiGet('/api/connection').catch(() => null),
      ]);
      if (diskInfo) {
        this.state._storage = {
          free: diskInfo.free || 0,
          total: diskInfo.total || 0,
        };
      }
      if (connInfo?.current) {
        this.state._connection = {
          port: connInfo.current.port,
          baudrate: connInfo.current.baudrate,
          printerProfile: connInfo.current.printerProfile,
          state: connInfo.current.state,
        };
      }
      // Fetch plugin data if available
      if (this._plugins?.includes('psucontrol')) {
        const psu = await this._apiGet('/api/plugin/psucontrol').catch(() => null);
        if (psu) this.state._psu = { isPSUOn: psu.isPSUOn ?? false };
      }
      if (this._plugins?.includes('bedlevelvisualizer')) {
        const blv = await this._apiGet('/api/plugin/bedlevelvisualizer').catch(() => null);
        if (blv?.mesh) this.state._bed_mesh = { mesh: blv.mesh };
      }
      if (this._plugins?.includes('enclosure')) {
        const enc = await this._apiGet('/api/plugin/enclosure').catch(() => null);
        if (enc) this.state._enclosure = enc;
      }
    } catch { /* non-critical */ }
  }

  // ── HTTP Polling fallback ──

  _startPolling() {
    if (this._pollTimer) return;
    this._poll();
  }

  async _poll() {
    try {
      const [printer, job] = await Promise.all([
        this._apiGet('/api/printer'),
        this._apiGet('/api/job'),
      ]);

      if (!this.connected) {
        this.connected = true;
        this.hub.broadcast('connection', { status: 'connected' });
        log.info(`Connected to OctoPrint: ${this.ip} (polling)`);
        this._fetchInitialData();
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

  _mergeState(printer, job) {
    if (printer?.state) {
      const stateText = printer.state.text || 'Offline';
      this.state.gcode_state = STATE_MAP[stateText] || 'IDLE';
      const flags = printer.state.flags || {};
      if (flags.printing) this.state.gcode_state = 'RUNNING';
      else if (flags.pausing || flags.paused) this.state.gcode_state = 'PAUSE';
      else if (flags.error) this.state.gcode_state = 'FAILED';
      else if (flags.closedOrError) this.state.gcode_state = 'OFFLINE';
    }
    if (printer?.temperature) {
      const t = printer.temperature;
      if (t.tool0) { this.state.nozzle_temper = Math.round(t.tool0.actual ?? 0); this.state.nozzle_target_temper = Math.round(t.tool0.target ?? 0); }
      if (t.tool1) { this.state._nozzle2_temper = Math.round(t.tool1.actual ?? 0); this.state._nozzle2_target = Math.round(t.tool1.target ?? 0); }
      if (t.bed) { this.state.bed_temper = Math.round(t.bed.actual ?? 0); this.state.bed_target_temper = Math.round(t.bed.target ?? 0); }
      if (t.chamber) { this.state.chamber_temper = Math.round(t.chamber.actual ?? 0); }
    }
    if (job) {
      const p = job.progress || {};
      if (p.completion != null) this.state.mc_percent = Math.round(p.completion);
      if (p.printTimeLeft != null) this.state.mc_remaining_time = Math.round(p.printTimeLeft / 60);
      if (p.printTime != null) this.state.print_duration_seconds = p.printTime;
      if (job.job?.file) {
        this.state.subtask_name = job.job.file.display || job.job.file.name || '';
        const a = job.job.file.gcodeAnalysis;
        if (a?.estimatedPrintTime) this.state._slicer_estimated_time = Math.round(a.estimatedPrintTime);
        if (a?.filament?.tool0) { this.state.filament_used_mm = Math.round(a.filament.tool0.length || 0); }
      }
    }
  }

  // ══════════════════════════════════════════
  // COMMANDS — Native REST API (no G-code fallbacks)
  // ══════════════════════════════════════════

  sendCommand(commandObj) {
    if (!this.connected) return;
    const action = commandObj._octoprint_action || commandObj.action;

    switch (action) {
      // Print control
      case 'pause': this._apiPost('/api/job', { command: 'pause', action: 'pause' }); break;
      case 'resume': this._apiPost('/api/job', { command: 'pause', action: 'resume' }); break;
      case 'stop': this._apiPost('/api/job', { command: 'cancel' }); break;
      case 'restart': this._apiPost('/api/job', { command: 'restart' }); break;
      case 'print_file':
        this._apiPost('/api/files/local/' + encodeURIComponent(commandObj.filename), { command: 'select', print: true });
        break;
      case 'select_file':
        this._apiPost('/api/files/local/' + encodeURIComponent(commandObj.filename), { command: 'select', print: false });
        break;

      // Native temperature control (no G-code needed)
      case 'set_nozzle_temp':
      case 'set_temp_nozzle':
        this._apiPost('/api/printer/tool', { command: 'target', targets: { tool0: commandObj.target || 0 } });
        break;
      case 'set_nozzle2_temp':
        this._apiPost('/api/printer/tool', { command: 'target', targets: { tool1: commandObj.target || 0 } });
        break;
      case 'set_bed_temp':
      case 'set_temp_bed':
        this._apiPost('/api/printer/bed', { command: 'target', target: commandObj.target || 0 });
        break;
      case 'set_chamber_temp':
        this._apiPost('/api/printer/chamber', { command: 'target', target: commandObj.target || 0 });
        break;
      case 'temp_offset':
        this._apiPost('/api/printer/tool', { command: 'offset', offsets: commandObj.offsets || {} });
        break;

      // Tool control
      case 'select_tool':
        this._apiPost('/api/printer/tool', { command: 'select', tool: `tool${commandObj.tool || 0}` });
        break;
      case 'extrude':
        this._apiPost('/api/printer/tool', { command: 'extrude', amount: commandObj.amount || 5 });
        break;
      case 'retract':
        this._apiPost('/api/printer/tool', { command: 'extrude', amount: -(commandObj.amount || 5) });
        break;
      case 'flowrate':
        this._apiPost('/api/printer/tool', { command: 'flowrate', factor: commandObj.value || 100 });
        break;

      // Movement
      case 'home':
        this._apiPost('/api/printer/printhead', { command: 'home', axes: commandObj.axes || ['x', 'y', 'z'] });
        break;
      case 'jog':
        this._apiPost('/api/printer/printhead', { command: 'jog', x: commandObj.x || 0, y: commandObj.y || 0, z: commandObj.z || 0 });
        break;
      case 'feedrate':
        this._apiPost('/api/printer/printhead', { command: 'feedrate', factor: commandObj.value || 100 });
        break;
      case 'speed':
        this._apiPost('/api/printer/printhead', { command: 'feedrate', factor: commandObj.value || 100 });
        break;

      // Fan
      case 'set_fan':
        this._sendGcode(`M106 S${Math.round((commandObj.value || 0) * 2.55)}`);
        break;

      // Connection control
      case 'connect_printer':
        this._apiPost('/api/connection', { command: 'connect', port: commandObj.port || '', baudrate: commandObj.baudrate || 0, printerProfile: commandObj.profile || '' });
        break;
      case 'disconnect_printer':
        this._apiPost('/api/connection', { command: 'disconnect' });
        break;

      // System commands
      case 'system_restart':
        this._apiPost('/api/system/commands/core/restart', {});
        break;
      case 'system_reboot':
        this._apiPost('/api/system/commands/core/reboot', {});
        break;
      case 'system_shutdown':
        this._apiPost('/api/system/commands/core/shutdown', {});
        break;

      // SD card
      case 'sd_init':
        this._apiPost('/api/printer/storage', { command: 'init' });
        break;
      case 'sd_refresh':
        this._apiPost('/api/printer/storage', { command: 'refresh' });
        break;
      case 'sd_release':
        this._apiPost('/api/printer/storage', { command: 'release' });
        break;

      // Plugin commands
      case 'plugin':
        if (commandObj.plugin && commandObj.data) {
          this._apiPost(`/api/plugin/${commandObj.plugin}`, commandObj.data);
        }
        break;

      // PSU Control plugin
      case 'psu_on':
        this._apiPost('/api/plugin/psucontrol', { command: 'turnPSUOn' });
        break;
      case 'psu_off':
        this._apiPost('/api/plugin/psucontrol', { command: 'turnPSUOff' });
        break;

      // G-code fallback
      case 'gcode':
        if (commandObj.gcode) this._sendGcode(commandObj.gcode);
        break;
      case 'emergency_stop':
        this._sendGcode('M112');
        break;
      case 'light':
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

  // ══════════════════════════════════════════
  // QUERIES — On-demand data fetching
  // ══════════════════════════════════════════

  // Connection info + available ports
  async getConnectionInfo() {
    return this._apiGet('/api/connection');
  }

  // Printer profiles
  async getPrinterProfiles() {
    return this._apiGet('/api/printerprofiles');
  }

  // Settings
  async getSettings() {
    return this._apiGet('/api/settings');
  }

  // System commands available
  async getSystemCommands() {
    return this._apiGet('/api/system/commands');
  }

  // Server info
  async getServerInfo() {
    return this._apiGet('/api/server');
  }

  // Last error with terminal context
  async getLastError() {
    return this._apiGet('/api/printer/error');
  }

  // Printer info (combined)
  async getPrinterInfo() {
    const [version, connection, profile] = await Promise.all([
      this._apiGet('/api/version'),
      this._apiGet('/api/connection'),
      this._printerProfile ? Promise.resolve(this._printerProfile) : this._apiGet('/api/printerprofiles').then(p => {
        if (p?.profiles) return Object.values(p.profiles).find(pr => pr.default) || Object.values(p.profiles)[0];
        return null;
      }),
    ]);
    return {
      server: version?.server || '', api: version?.api || '', text: version?.text || '',
      state: connection?.current?.state || 'Closed',
      port: connection?.current?.port || '', baudrate: connection?.current?.baudrate || '',
      availablePorts: connection?.options?.ports || [],
      availableBaudrates: connection?.options?.baudrates || [],
      profile: profile ? { name: profile.name, model: profile.model, volume: profile.volume, extruder: profile.extruder } : null,
      plugins: this._plugins || [],
    };
  }

  // ══════════════════════════════════════════
  // FILE MANAGEMENT — Full implementation
  // ══════════════════════════════════════════

  async listFiles(storage = 'local', recursive = true) {
    const data = await this._apiGet(`/api/files/${storage}?recursive=${recursive}`);
    if (!data?.files) return [];
    return this._flattenFiles(data.files, storage);
  }

  _flattenFiles(files, storage, prefix = '') {
    const result = [];
    for (const f of files) {
      const path = prefix ? `${prefix}/${f.name}` : f.name;
      if (f.type === 'folder' && f.children) {
        result.push({ path, type: 'folder', storage });
        result.push(...this._flattenFiles(f.children, storage, path));
      } else {
        result.push({
          path, type: f.type || 'file', storage, size: f.size || 0,
          modified: f.date ? f.date * 1000 : 0, display: f.display || f.name,
          gcodeAnalysis: f.gcodeAnalysis || null, prints: f.prints || null,
        });
      }
    }
    return result;
  }

  async uploadFile(filename, buffer, storage = 'local') {
    const boundary = '----3DPrintForge' + Date.now();
    const header = `--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="${filename}"\r\nContent-Type: application/octet-stream\r\n\r\n`;
    const footer = `\r\n--${boundary}--\r\n`;
    const body = Buffer.concat([Buffer.from(header), buffer, Buffer.from(footer)]);
    const headers = { 'Content-Type': `multipart/form-data; boundary=${boundary}` };
    if (this.apiKey) headers['X-Api-Key'] = this.apiKey;
    const res = await fetch(`${this._baseUrl}/api/files/${storage}`, { method: 'POST', headers, body, signal: AbortSignal.timeout(120000) });
    if (!res.ok) throw new Error(`Upload failed: HTTP ${res.status}`);
    return res.json();
  }

  async uploadAndPrint(filename, buffer, storage = 'local') {
    const boundary = '----3DPrintForge' + Date.now();
    const parts = `--${boundary}\r\nContent-Disposition: form-data; name="select"\r\n\r\ntrue\r\n--${boundary}\r\nContent-Disposition: form-data; name="print"\r\n\r\ntrue\r\n--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="${filename}"\r\nContent-Type: application/octet-stream\r\n\r\n`;
    const footer = `\r\n--${boundary}--\r\n`;
    const body = Buffer.concat([Buffer.from(parts), buffer, Buffer.from(footer)]);
    const headers = { 'Content-Type': `multipart/form-data; boundary=${boundary}` };
    if (this.apiKey) headers['X-Api-Key'] = this.apiKey;
    const res = await fetch(`${this._baseUrl}/api/files/${storage}`, { method: 'POST', headers, body, signal: AbortSignal.timeout(120000) });
    if (!res.ok) throw new Error(`Upload+print failed: HTTP ${res.status}`);
    return res.json();
  }

  async selectFile(filename, print = false) {
    await this._apiPost(`/api/files/local/${encodeURIComponent(filename)}`, { command: 'select', print });
  }

  async copyFile(filename, destination) {
    await this._apiPost(`/api/files/local/${encodeURIComponent(filename)}`, { command: 'copy', destination });
  }

  async moveFile(filename, destination) {
    await this._apiPost(`/api/files/local/${encodeURIComponent(filename)}`, { command: 'move', destination });
  }

  async deleteFile(filename, storage = 'local') {
    await this._apiDelete(`/api/files/${storage}/${encodeURIComponent(filename)}`);
  }

  async createFolder(foldername, storage = 'local') {
    const boundary = '----3DPrintForge' + Date.now();
    const body = `--${boundary}\r\nContent-Disposition: form-data; name="foldername"\r\n\r\n${foldername}\r\n--${boundary}--\r\n`;
    const headers = { 'Content-Type': `multipart/form-data; boundary=${boundary}` };
    if (this.apiKey) headers['X-Api-Key'] = this.apiKey;
    await fetch(`${this._baseUrl}/api/files/${storage}`, { method: 'POST', headers, body: Buffer.from(body), signal: AbortSignal.timeout(10000) });
  }

  // ══════════════════════════════════════════
  // TIMELAPSE
  // ══════════════════════════════════════════

  async getTimelapses() {
    return this._apiGet('/api/timelapse');
  }

  async configureTimelapse(config) {
    // config: { type: 'off'|'zchange'|'timed', fps, interval, postRoll, etc. }
    await this._apiPost('/api/timelapse', config);
  }

  async deleteTimelapse(name) {
    await this._apiDelete(`/api/timelapse/${encodeURIComponent(name)}`);
  }

  async renderTimelapse(name) {
    await this._apiPost(`/api/timelapse/unrendered/${encodeURIComponent(name)}`, { command: 'render' });
  }

  // ══════════════════════════════════════════
  // SLICING
  // ══════════════════════════════════════════

  async getSlicers() {
    return this._apiGet('/api/slicing');
  }

  async getSlicerProfiles(slicer) {
    return this._apiGet(`/api/slicing/${slicer}/profiles`);
  }

  async sliceFile(filename, slicer, profile, printerProfile) {
    await this._apiPost(`/api/files/local/${encodeURIComponent(filename)}`, {
      command: 'slice', slicer, profile, printerProfile,
    });
  }

  // ══════════════════════════════════════════
  // PLUGIN API
  // ══════════════════════════════════════════

  async getPluginData(pluginName) {
    return this._apiGet(`/api/plugin/${pluginName}`);
  }

  async sendPluginCommand(pluginName, command) {
    return this._apiPost(`/api/plugin/${pluginName}`, command);
  }

  // PSU Control
  async getPsuState() {
    return this._apiGet('/api/plugin/psucontrol');
  }

  // Filament Manager
  async getFilamentSpools() {
    return this._apiGet('/api/plugin/filamentmanager/spools');
  }

  async getFilamentSelections() {
    return this._apiGet('/api/plugin/filamentmanager/selections');
  }

  // Bed Level Visualizer
  async getBedLevelData() {
    return this._apiGet('/api/plugin/bedlevelvisualizer');
  }

  // ══════════════════════════════════════════
  // ACCESS CONTROL — User/Group/Permission CRUD
  // ══════════════════════════════════════════

  async getPermissions() { return this._apiGet('/api/access/permissions'); }
  async getGroups() { return this._apiGet('/api/access/groups'); }
  async addGroup(group) { return this._apiPost('/api/access/groups', group); }
  async updateGroup(key, group) { return this._apiPut(`/api/access/groups/${key}`, group); }
  async deleteGroup(key) { await this._apiDelete(`/api/access/groups/${key}`); }
  async getUsers() { return this._apiGet('/api/access/users'); }
  async addUser(user) { return this._apiPost('/api/access/users', user); }
  async getUser(username) { return this._apiGet(`/api/access/users/${username}`); }
  async updateUser(username, user) { return this._apiPut(`/api/access/users/${username}`, user); }
  async deleteUser(username) { await this._apiDelete(`/api/access/users/${username}`); }
  async changePassword(username, password) { return this._apiPut(`/api/access/users/${username}/password`, { password }); }
  async getUserSettings(username) { return this._apiGet(`/api/access/users/${username}/settings`); }
  async updateUserSettings(username, settings) { return this._apiPatch(`/api/access/users/${username}/settings`, settings); }
  async regenerateApiKey(username) { return this._apiPost(`/api/access/users/${username}/apikey`, {}); }
  async deleteUserApiKey(username) { await this._apiDelete(`/api/access/users/${username}/apikey`); }

  // ══════════════════════════════════════════
  // PRINTER PROFILES — Full CRUD
  // ══════════════════════════════════════════

  async addPrinterProfile(profile) { return this._apiPost('/api/printerprofiles', { profile }); }
  async updatePrinterProfile(id, profile) { return this._apiPatch(`/api/printerprofiles/${id}`, { profile }); }
  async deletePrinterProfile(id) { await this._apiDelete(`/api/printerprofiles/${id}`); }

  // ══════════════════════════════════════════
  // SETTINGS — Read + Write
  // ══════════════════════════════════════════

  async updateSettings(settings) { return this._apiPost('/api/settings', settings); }
  async regenerateSystemApiKey() { return this._apiPost('/api/settings/apikey', {}); }

  // ══════════════════════════════════════════
  // LANGUAGES
  // ══════════════════════════════════════════

  async getLanguages() { return this._apiGet('/api/languages'); }
  async deleteLanguage(locale, pack) { await this._apiDelete(`/api/languages/${locale}/${pack}`); }
  async uploadLanguage(locale, buffer, filename) {
    const boundary = '----3DPrintForge' + Date.now();
    const localePart = `--${boundary}\r\nContent-Disposition: form-data; name="locale"\r\n\r\n${locale}\r\n`;
    const filePart = `--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="${filename}"\r\nContent-Type: application/zip\r\n\r\n`;
    const footer = `\r\n--${boundary}--\r\n`;
    const body = Buffer.concat([Buffer.from(localePart + filePart), buffer, Buffer.from(footer)]);
    const headers = { 'Content-Type': `multipart/form-data; boundary=${boundary}` };
    if (this.apiKey) headers['X-Api-Key'] = this.apiKey;
    const res = await fetch(`${this._baseUrl}/api/languages`, { method: 'POST', headers, body, signal: AbortSignal.timeout(30000) });
    if (!res.ok) throw new Error(`Language upload failed: HTTP ${res.status}`);
    return res.json();
  }

  // ══════════════════════════════════════════
  // UTIL + WIZARD
  // ══════════════════════════════════════════

  async testConnectivity(type, target) { return this._apiPost('/api/util/test', { command: type, ...target }); }
  async getWizardData() { return this._apiGet('/setup/wizard'); }
  async finishWizard(data) { return this._apiPost('/setup/wizard', data); }

  // ══════════════════════════════════════════
  // ADDITIONAL COMMANDS
  // ══════════════════════════════════════════

  async babystep(amount) {
    // M290 Z{amount} — babystepping
    await this._sendGcode(`M290 Z${amount || 0.05}`);
  }

  async setZOffset(offset) {
    await this._sendGcode(`M851 Z${offset}`);
  }

  // ══════════════════════════════════════════
  // CAMERA
  // ══════════════════════════════════════════

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

  // ══════════════════════════════════════════
  // HTTP HELPERS
  // ══════════════════════════════════════════

  async _apiGet(path) {
    try {
      const headers = {};
      if (this.apiKey) headers['X-Api-Key'] = this.apiKey;
      const res = await fetch(`${this._baseUrl}${path}`, { method: 'GET', headers, signal: AbortSignal.timeout(5000) });
      if (res.status === 409) return null;
      if (!res.ok) return null;
      return res.json();
    } catch (e) { throw e; }
  }

  async _apiPost(path, body) {
    try {
      const headers = { 'Content-Type': 'application/json' };
      if (this.apiKey) headers['X-Api-Key'] = this.apiKey;
      const res = await fetch(`${this._baseUrl}${path}`, {
        method: 'POST', headers, body: JSON.stringify(body), signal: AbortSignal.timeout(10000),
      });
      if (res.ok || res.status === 204) {
        try { return await res.json(); } catch { return null; }
      }
      return null;
    } catch (e) { log.error(`POST ${path}: ${e.message}`); return null; }
  }

  async _apiPut(path, body) {
    try {
      const headers = { 'Content-Type': 'application/json' };
      if (this.apiKey) headers['X-Api-Key'] = this.apiKey;
      const res = await fetch(`${this._baseUrl}${path}`, {
        method: 'PUT', headers, body: JSON.stringify(body), signal: AbortSignal.timeout(5000),
      });
      if (res.ok) { try { return await res.json(); } catch { return null; } }
      return null;
    } catch (e) { log.error(`PUT ${path}: ${e.message}`); return null; }
  }

  async _apiPatch(path, body) {
    try {
      const headers = { 'Content-Type': 'application/json' };
      if (this.apiKey) headers['X-Api-Key'] = this.apiKey;
      await fetch(`${this._baseUrl}${path}`, {
        method: 'PATCH', headers, body: JSON.stringify(body), signal: AbortSignal.timeout(5000),
      });
    } catch (e) { log.error(`PATCH ${path}: ${e.message}`); }
  }

  async _apiDelete(path) {
    try {
      const headers = {};
      if (this.apiKey) headers['X-Api-Key'] = this.apiKey;
      await fetch(`${this._baseUrl}${path}`, { method: 'DELETE', headers, signal: AbortSignal.timeout(5000) });
    } catch (e) { log.error(`DELETE ${path}: ${e.message}`); }
  }
}

export function buildOctoPrintCommand(msg) {
  return { _octoprint_action: msg.action, ...msg };
}
