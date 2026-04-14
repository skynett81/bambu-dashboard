/**
 * PrusaLink REST API Client
 * Supports: Prusa MK4/MK3.9/Mini+/XL with PrusaLink firmware
 * Protocol: HTTP REST with Digest Auth, poll-based state updates
 */

import { createHash, randomBytes } from 'node:crypto';

const log = { info: (...a) => console.log('[prusalink]', ...a), warn: (...a) => console.warn('[prusalink]', ...a), error: (...a) => console.error('[prusalink]', ...a) };

const STATE_MAP = {
  IDLE: 'IDLE', BUSY: 'RUNNING', PRINTING: 'RUNNING', PAUSED: 'PAUSE',
  FINISHED: 'FINISH', STOPPED: 'IDLE', ERROR: 'FAILED', ATTENTION: 'PAUSE',
};

// Semver-ish comparison: returns true if a > b
function _versionGt(a, b) {
  const pa = String(a).split('.').map(n => parseInt(n, 10) || 0);
  const pb = String(b).split('.').map(n => parseInt(n, 10) || 0);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const x = pa[i] || 0, y = pb[i] || 0;
    if (x > y) return true;
    if (x < y) return false;
  }
  return false;
}

export class PrusaLinkClient {
  constructor(config, hub) {
    this.ip = config.printer.ip;
    this.port = config.printer.port || 80;
    this._printerId = config.printer.id || '';
    this.apiKey = config.printer.accessCode || '';
    this.username = config.printer.username || 'maker';
    this.password = config.printer.password || config.printer.accessCode || '';
    this.hub = hub;
    this.state = {};
    this.connected = false;
    this._pollTimer = null;
    this._pollInterval = 3000;
    this._digestAuth = null;
    this.onFirmwareInfo = null;
    this.onXcamEvent = null;
  }

  get _baseUrl() {
    return `http://${this.ip}:${this.port}`;
  }

  connect() {
    log.info(`Connecting to PrusaLink at ${this._baseUrl}`);
    this._poll();
  }

  disconnect() {
    this.connected = false;
    if (this._pollTimer) { clearTimeout(this._pollTimer); this._pollTimer = null; }
  }

  async _poll() {
    try {
      const [status, job] = await Promise.all([
        this._apiGet('/api/v1/status'),
        this._apiGet('/api/v1/job'),
      ]);

      if (!this.connected) {
        this.connected = true;
        this.hub.broadcast('connection', { status: 'connected' });
        log.info(`Connected to PrusaLink: ${this.ip}`);

        // Get printer info on first connect
        const info = await this._apiGet('/api/v1/info');
        if (info && this.onFirmwareInfo) {
          this.onFirmwareInfo({ name: 'prusalink', sw_ver: info.firmware || '', hw_ver: info.serial || '', sn: info.serial || '' });
        }
      }

      this._mergeState(status, job);
      this.hub.broadcast('status', { print: this.state });
    } catch (e) {
      if (this.connected) {
        this.connected = false;
        this.hub.broadcast('connection', { status: 'disconnected' });
        log.warn(`PrusaLink disconnected: ${e.message}`);
      }
    }

    this._pollTimer = setTimeout(() => this._poll(), this._pollInterval);
  }

  _mergeState(status, job) {
    if (!status) return;

    // Printer state
    const pState = status.printer?.state || 'IDLE';
    this.state.gcode_state = STATE_MAP[pState] || 'IDLE';

    // Temperatures
    if (status.printer?.temp_nozzle !== undefined) this.state.nozzle_temper = Math.round(status.printer.temp_nozzle);
    if (status.printer?.target_nozzle !== undefined) this.state.nozzle_target_temper = Math.round(status.printer.target_nozzle);
    if (status.printer?.temp_bed !== undefined) this.state.bed_temper = Math.round(status.printer.temp_bed);
    if (status.printer?.target_bed !== undefined) this.state.bed_target_temper = Math.round(status.printer.target_bed);

    // Fan
    if (status.printer?.fan_printing !== undefined) this.state.cooling_fan_speed = status.printer.fan_printing;

    // Speed
    if (status.printer?.speed !== undefined) this.state.spd_mag = status.printer.speed;

    // Flow
    if (status.printer?.flow !== undefined) this.state._flow_rate = status.printer.flow;

    // Z height
    if (status.printer?.axis_z !== undefined) {
      this.state._position = { x: status.printer.axis_x || 0, y: status.printer.axis_y || 0, z: status.printer.axis_z || 0 };
    }

    // Nozzle diameter
    if (status.printer?.nozzle_diameter !== undefined) this.state.nozzle_diameter = status.printer.nozzle_diameter;

    // MMU/tool info
    if (status.printer?.mmu_enabled !== undefined) {
      this.state._mmu_enabled = status.printer.mmu_enabled;
      this.state._mmu_version = status.printer.mmu_version || null;
    }
    if (status.printer?.slot !== undefined) {
      this.state._active_slot = status.printer.slot;
    }

    // Storage
    if (status.storage) {
      this.state._storage = {
        free: status.storage.free,
        total: status.storage.total,
        path: status.storage.path,
      };
    }

    // Camera
    if (status.camera) {
      this.state._camera_available = true;
      this.state._camera_id = status.camera.id;
    }

    // Job info
    if (job) {
      // Track job id for spec-compliant /api/v1/job/{id}/pause etc.
      if (job.id !== undefined) this.state._job_id = job.id;
      if (job.progress !== undefined) this.state.mc_percent = Math.round(job.progress);
      if (job.time_remaining !== undefined) this.state.mc_remaining_time = Math.round(job.time_remaining / 60);
      if (job.time_printing !== undefined) this.state.print_duration_seconds = Math.round(job.time_printing);
      if (job.file?.display_name) this.state.subtask_name = job.file.display_name;
      if (job.file?.m_timestamp) this.state._file_timestamp = job.file.m_timestamp;
      if (job.file?.meta) {
        this.state._slicer = job.file.meta.slicer || null;
        this.state._layer_height = job.file.meta.layer_height || null;
        this.state._slicer_filament_type = job.file.meta.filament_type || null;
        // Filament usage estimates from slicer metadata
        if (job.file.meta.filament_used_mm != null) {
          this.state.filament_used_mm = Math.round(job.file.meta.filament_used_mm);
        }
        if (job.file.meta.filament_used_g != null) {
          this.state._slicer_filament_weight = Math.round(job.file.meta.filament_used_g);
        }
        if (job.file.meta.estimated_print_time != null) {
          this.state._slicer_estimated_time = Math.round(job.file.meta.estimated_print_time);
        }
      }
      // Layer info
      if (job.current_layer != null) this.state.layer_num = job.current_layer;
      if (job.total_layers != null) this.state.total_layer_num = job.total_layers;
    }
  }

  // ── Commands ──

  // Current job id for spec-compliant /api/v1/job/{id}/pause endpoints
  // (fetched from /api/v1/job response; we cache it here)
  _getCurrentJobId() {
    return this.state?._job_id || null;
  }

  sendCommand(commandObj) {
    if (!this.connected) return;
    const action = commandObj._prusalink_action || commandObj.action;
    const jobId = this._getCurrentJobId();

    switch (action) {
      case 'pause':
        // Spec-compliant (OpenAPI 1.0-draft): POST /api/v1/job/{id}/pause
        if (jobId) this._apiPost(`/api/v1/job/${jobId}/pause`, {});
        else this._apiPut('/api/v1/job', { command: 'PAUSE' });
        break;
      case 'resume':
        if (jobId) this._apiPost(`/api/v1/job/${jobId}/resume`, {});
        else this._apiPut('/api/v1/job', { command: 'RESUME' });
        break;
      case 'continue':
        // New in spec: resume after pause-for-error
        if (jobId) this._apiPost(`/api/v1/job/${jobId}/continue`, {});
        break;
      case 'stop':
        if (jobId) this._apiDelete(`/api/v1/job/${jobId}`);
        else this._apiDelete('/api/v1/job');
        break;
      case 'print_file':
        // Spec: POST /api/v1/files/{storage}/{path} with Print-After-Upload header
        // or PUT /api/v1/files/{storage}/{path} body to start
        this._apiPost('/api/v1/job', { command: 'START', path: commandObj.filename });
        break;
      case 'speed':
        this._apiPut('/api/v1/job', { command: 'SET_SPEED', value: commandObj.value || 100 });
        break;
      case 'set_nozzle_temp':
      case 'set_temp_nozzle':
        this._apiPut('/api/v1/status', { temp_nozzle: commandObj.target || 0 });
        break;
      case 'set_bed_temp':
      case 'set_temp_bed':
        this._apiPut('/api/v1/status', { temp_bed: commandObj.target || 0 });
        break;
      case 'gcode':
        this._apiPost('/api/v1/job', { command: 'GCODE', gcode: commandObj.gcode });
        break;
      case 'mmu_load':
        this._apiPost('/api/v1/job', { command: 'MMU_LOAD', slot: commandObj.slot || 0 });
        break;
      case 'mmu_unload':
        this._apiPost('/api/v1/job', { command: 'MMU_UNLOAD' });
        break;
      // LED control
      case 'light':
        this._apiPut('/api/v1/status', { led: commandObj.mode === 'on' ? 1 : 0 });
        break;
      // Home axes
      case 'home':
        this._apiPost('/api/v1/job', { command: 'GCODE', gcode: 'G28' });
        break;
      // Jog movement
      case 'jog':
        this._apiPost('/api/v1/job', { command: 'GCODE', gcode: `G91\nG1 X${commandObj.x || 0} Y${commandObj.y || 0} Z${commandObj.z || 0} F3000\nG90` });
        break;
      // Fan control
      case 'set_fan':
        this._apiPost('/api/v1/job', { command: 'GCODE', gcode: `M106 S${Math.round((commandObj.value || 0) * 2.55)}` });
        break;
      // Emergency stop
      case 'emergency_stop':
        this._apiPost('/api/v1/job', { command: 'GCODE', gcode: 'M112' });
        break;
      // Flow rate
      case 'flowrate':
        this._apiPost('/api/v1/job', { command: 'GCODE', gcode: `M221 S${commandObj.value || 100}` });
        break;
      default:
        log.warn(`Unknown PrusaLink command: ${action}`);
    }
  }

  // ── File Upload ──

  async uploadFile(filename, buffer) {
    const boundary = '----3DPrintForge' + Date.now();
    const header = `--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="${filename}"\r\nContent-Type: application/octet-stream\r\n\r\n`;
    const footer = `\r\n--${boundary}--\r\n`;
    const body = Buffer.concat([Buffer.from(header), buffer, Buffer.from(footer)]);

    const headers = { 'Content-Type': `multipart/form-data; boundary=${boundary}` };
    if (this.apiKey) headers['X-Api-Key'] = this.apiKey;

    const res = await fetch(`${this._baseUrl}/api/v1/files/local`, {
      method: 'POST', headers, body, signal: AbortSignal.timeout(60000),
    });
    if (!res.ok) throw new Error(`PrusaLink upload failed: HTTP ${res.status}`);
    return res.json();
  }

  async uploadAndPrint(filename, buffer) {
    const result = await this.uploadFile(filename, buffer);
    await this._apiPost('/api/v1/job', { command: 'START', path: filename });
    return result;
  }

  // ── Camera ──

  getSnapshotUrl() {
    return `${this._baseUrl}/api/v1/cameras/snap`;
  }

  /** Get last camera frame as buffer (for /frame.jpeg endpoint) */
  async getCameraFrame() {
    try {
      const res = await this._fetchWithAuth('GET', '/api/v1/cameras/snap');
      if (res.ok) return Buffer.from(await res.arrayBuffer());
    } catch {}
    return null;
  }

  // ── File listing ──

  async listFiles() {
    const data = await this._apiGet('/api/v1/files/local');
    if (!data?.children) return [];
    return this._flattenFiles(data.children, '');
  }

  _flattenFiles(children, prefix) {
    const files = [];
    for (const f of children) {
      const path = prefix ? `${prefix}/${f.display_name || f.name}` : (f.display_name || f.name);
      if (f.type === 'FOLDER' && f.children) {
        files.push(...this._flattenFiles(f.children, path));
      } else if (f.type === 'FILE') {
        files.push({
          path,
          size: f.size || 0,
          modified: f.m_timestamp || 0,
          meta: f.meta || null,
        });
      }
    }
    return files;
  }

  // ── Printer info ──

  async getPrinterInfo() {
    const [info, printer] = await Promise.all([
      this._apiGet('/api/v1/info'),
      this._apiGet('/api/v1/printer'),
    ]);
    return {
      ...info,
      printer: printer || {},
      buildVolume: printer?.build_plate || null,
      nozzleDiameter: this.state.nozzle_diameter || null,
      mmu: this.state._mmu_enabled ? { enabled: true, version: this.state._mmu_version } : null,
    };
  }

  // ── System info ──

  async getSystemInfo() {
    const info = await this._apiGet('/api/v1/info');
    return {
      firmware: info?.firmware || '',
      serial: info?.serial || '',
      hostname: info?.hostname || '',
      type: info?.type || '',
      nozzle_diameter: info?.nozzle_diameter || 0.4,
    };
  }

  // ── Job history (PrusaLink v1 API) ──

  async getJobHistory() {
    return this._apiGet('/api/v1/job/history') || [];
  }

  // ── Printer profile ──

  async getPrinterProfile() {
    const printer = await this._apiGet('/api/v1/printer');
    if (!printer) return null;
    return {
      type: printer.type || '',
      firmware: printer.firmware || '',
      axes: printer.axes || {},
      nozzle: printer.nozzle_diameter || 0.4,
      mmu: printer.mmu_enabled || false,
    };
  }

  // ── Firmware update ──

  async checkFirmwareUpdate() {
    try {
      // 1. Get current firmware version from printer
      const info = await this._apiGet('/api/v1/info');
      const currentFw = info?.firmware || '';
      const printerType = (info?.hostname || '').toLowerCase().includes('xl') ? 'mk4-xl' :
                         (info?.hostname || '').toLowerCase().includes('mini') ? 'mini' : 'mk4';

      // 2. Check Prusa's public firmware manifest on GitHub
      // Map printer type to GitHub release repo
      const repoMap = {
        'mk4': 'prusa3d/Prusa-Firmware-Buddy',
        'mk4-xl': 'prusa3d/Prusa-Firmware-Buddy',
        'mini': 'prusa3d/Prusa-Firmware-Buddy',
      };
      const repo = repoMap[printerType] || 'prusa3d/Prusa-Firmware-Buddy';
      const releaseUrl = `https://api.github.com/repos/${repo}/releases/latest`;

      const res = await fetch(releaseUrl, {
        headers: { 'Accept': 'application/vnd.github+json', 'User-Agent': '3dprintforge' },
        signal: AbortSignal.timeout(10000),
      });
      if (!res.ok) return { available: false, current: currentFw, error: `GitHub API HTTP ${res.status}` };
      const release = await res.json();

      const latestTag = (release.tag_name || '').replace(/^v/, '');
      const currentClean = currentFw.split('-')[0]; // strip commit suffix
      const updateAvailable = latestTag && currentClean && latestTag !== currentClean && _versionGt(latestTag, currentClean);

      return {
        available: updateAvailable,
        current: currentFw,
        latest: latestTag,
        releaseUrl: release.html_url || '',
        releaseNotes: (release.body || '').slice(0, 2000),
        publishedAt: release.published_at,
      };
    } catch (e) {
      return { available: false, error: e.message };
    }
  }

  async triggerFirmwareUpdate(env) {
    return this._apiPost(`/api/v1/update/${env || 'buddy'}`, {});
  }

  // ── Camera management ──

  async listCameras() {
    return this._apiGet('/api/v1/cameras') || [];
  }

  async getCameraConfig(cameraId) {
    return this._apiGet(`/api/v1/cameras/${cameraId}/config`);
  }

  async testCameraConnection(cameraId) {
    return this._apiPost(`/api/v1/cameras/${cameraId}/connection`, {});
  }

  // ── Transfer (upload progress) ──

  async getActiveTransfers() {
    return this._apiGet('/api/v1/transfer') || [];
  }

  async cancelTransfer(transferId) {
    return this._apiDelete(`/api/v1/transfer/${transferId}`);
  }

  // ── Storage info ──

  async getStorageInfo() {
    return this._apiGet('/api/v1/storage') || {};
  }

  // ── Full printer state query ──

  async getFullPrinterState() {
    const [status, job, printer, info] = await Promise.all([
      this._apiGet('/api/v1/status'),
      this._apiGet('/api/v1/job'),
      this._apiGet('/api/v1/printer'),
      this._apiGet('/api/v1/info'),
    ]);
    return { status, job, printer, info };
  }

  // ── Vibration suppression (MK4/MK3.9) ──

  async setVibrationSuppression(enabled) {
    await this._apiPost('/api/v1/job', { command: 'GCODE', gcode: enabled ? 'M593 F40' : 'M593 F0' });
  }

  // ── Network info ──

  async getNetworkSettings() {
    const info = await this._apiGet('/api/v1/info');
    return {
      hostname: info?.hostname || '',
      ip: info?.ip || '',
      mac: info?.mac || '',
    };
  }

  // ── MMU detailed ──

  async getMMUState() {
    if (!this.state._mmu_enabled) return null;
    return {
      enabled: this.state._mmu_enabled,
      version: this.state._mmu_version,
      activeSlot: this.state._active_slot,
    };
  }

  // ── PrusaConnect Cloud proxy (if token available) ──

  // ── PrusaConnect Cloud Integration ──
  // PrusaConnect (connect.prusa3d.com) is Prusa's cloud platform.
  // PrusaLink firmware forwards telemetry to PrusaConnect when configured.

  async prusaConnectRegister(token) {
    try {
      const headers = { 'Authorization': `Bearer ${token}` };
      if (this.apiKey) headers['X-Api-Key'] = this.apiKey;
      const res = await fetch(`${this._baseUrl}/api/v1/connect`, {
        method: 'POST', headers, signal: AbortSignal.timeout(10000),
      });
      return res.ok;
    } catch {}
    return false;
  }

  async getPrusaConnectStatus() {
    // Check if PrusaConnect is configured on this printer
    const info = await this._apiGet('/api/v1/info');
    return {
      connected: info?.connect_status === 'connected',
      connectUrl: info?.connect_url || 'https://connect.prusa3d.com',
      registered: !!info?.connect_token,
    };
  }

  // ── Additional PrusaLink queries for full coverage ──

  async getTelemetry() {
    return this._apiGet('/api/v1/telemetry');
  }

  async getEvents() {
    return this._apiGet('/api/v1/events');
  }

  async getCurrentUser() {
    return this._apiGet('/api/v1/user');
  }

  async getFlowRate() {
    return this.state._flow_rate || 100;
  }

  async setLedBrightness(brightness) {
    await this._apiPut('/api/v1/status', { led: brightness });
  }

  // ── HTTP with Digest Auth ──

  async _apiGet(path) {
    try {
      const res = await this._fetchWithAuth('GET', path);
      if (!res.ok) return null;
      return res.json();
    } catch (e) {
      log.error(`GET ${path}: ${e.message}`);
      return null;
    }
  }

  async _apiPut(path, body) {
    try {
      await this._fetchWithAuth('PUT', path, body);
    } catch (e) { log.error(`PUT ${path}: ${e.message}`); }
  }

  async _apiPost(path, body) {
    try {
      await this._fetchWithAuth('POST', path, body);
    } catch (e) { log.error(`POST ${path}: ${e.message}`); }
  }

  async _apiDelete(path) {
    try {
      await this._fetchWithAuth('DELETE', path);
    } catch (e) { log.error(`DELETE ${path}: ${e.message}`); }
  }

  async _fetchWithAuth(method, path, body) {
    const url = `${this._baseUrl}${path}`;
    const headers = {};

    // Try API key first (simpler)
    if (this.apiKey) {
      headers['X-Api-Key'] = this.apiKey;
    }

    if (body) headers['Content-Type'] = 'application/json';

    let res = await fetch(url, {
      method, headers,
      body: body ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(5000),
    });

    // If 401, try digest auth
    if (res.status === 401 && this.password) {
      const wwwAuth = res.headers.get('www-authenticate') || '';
      const digestHeader = this._buildDigestAuth(method, path, wwwAuth);
      if (digestHeader) {
        headers['Authorization'] = digestHeader;
        res = await fetch(url, {
          method, headers,
          body: body ? JSON.stringify(body) : undefined,
          signal: AbortSignal.timeout(5000),
        });
      }
    }

    return res;
  }

  _buildDigestAuth(method, path, wwwAuth) {
    const realm = wwwAuth.match(/realm="([^"]+)"/)?.[1];
    const nonce = wwwAuth.match(/nonce="([^"]+)"/)?.[1];
    const qop = wwwAuth.match(/qop="([^"]+)"/)?.[1] || 'auth';
    if (!realm || !nonce) return null;

    const nc = '00000001';
    const cnonce = randomBytes(8).toString('hex');
    const ha1 = createHash('md5').update(`${this.username}:${realm}:${this.password}`).digest('hex');
    const ha2 = createHash('md5').update(`${method}:${path}`).digest('hex');
    const response = createHash('md5').update(`${ha1}:${nonce}:${nc}:${cnonce}:${qop}:${ha2}`).digest('hex');

    return `Digest username="${this.username}", realm="${realm}", nonce="${nonce}", uri="${path}", qop=${qop}, nc=${nc}, cnonce="${cnonce}", response="${response}"`;
  }
}

export function buildPrusaLinkCommand(msg) {
  return { _prusalink_action: msg.action, ...msg };
}
