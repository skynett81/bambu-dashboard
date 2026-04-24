/**
 * MoonrakerClient — Connector for Klipper/Moonraker-based printers.
 *
 * Supports: Snapmaker U1, Voron, Ratrig, Creality (Klipper), Sovol, QIDI, etc.
 * Protocol: HTTP REST + WebSocket for real-time state.
 *
 * Implements the same interface as BambuMqttClient so PrinterManager
 * can use either connector transparently.
 */

import { createLogger } from './logger.js';
import { WebSocket } from 'ws';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { getExtruderSlots } from './db/printers.js';
import { mapSmState, mapFeedState, argbToHex } from './snapmaker-state-map.js';

// Package version for server.connection.identify — read once at module load
let CLIENT_VERSION = 'unknown';
try {
  const pkgPath = join(dirname(fileURLToPath(import.meta.url)), '..', 'package.json');
  CLIENT_VERSION = JSON.parse(readFileSync(pkgPath, 'utf8')).version || 'unknown';
} catch { /* keep default */ }

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

const log = createLogger('moonraker');

// Snapmaker U1 exception severity levels (from u1-klipper exception_manager.py).
// level=1 reports-only, 2 pauses, 3 cancels.
const U1_EXCEPTION_LEVELS = {
  1: 'info',
  2: 'pause',
  3: 'cancel',
};

// Snapmaker U1 module ID → wiki anchor slug. Source: u1-klipper/exception_manager.py
// ExceptionList.MODULE_ID_* constants matched with wiki.snapmaker.com anchor IDs.
const U1_MODULE_SLUGS = {
  522: 'motion-control',
  523: 'toolhead',
  524: 'camera',
  525: 'filament-feeder',
  526: 'heated-bed',
  527: 'chamber-temperature-detection',
  528: 'homing-anomaly',
  529: 'gcode',
  530: 'detectioncalibration',
  531: 'print-file',
  532: 'defect-detection',
  533: 'purifier',
  2052: 'system',
};

// Build a Snapmaker wiki help URL from an exception object.
// Falls back to the error-codes index page when module ID is unknown.
export function buildU1HelpUrl(ex) {
  const base = 'https://wiki.snapmaker.com/en/snapmaker_u1/troubleshooting/u1_error_codes';
  if (!ex || typeof ex.id !== 'number') return base;
  const slug = U1_MODULE_SLUGS[ex.id];
  const idPad = String(ex.id).padStart(4, '0');
  return slug ? `${base}#h-${idPad}-${slug}` : `${base}#h-${idPad}`;
}

// Parse U1 filament_parameters into a flat catalog: one entry per
// (material, vendor, subType) with per-diameter flow values.
// The on-printer schema is: { [material]: { [vendor_...]: { [sub_...]: { load_temp, flow_k: {"02":...,"04":...}, ...}}}}
export function extractU1FilamentCatalog(fp) {
  if (!fp || typeof fp !== 'object') return null;
  const catalog = {
    version: fp.version || null,
    hardFlowK: fp.hard_filaments_max_flow_k ?? null,
    softFlowK: fp.soft_filaments_max_flow_k ?? null,
    entries: [],
  };
  for (const [material, vendorMap] of Object.entries(fp)) {
    if (typeof vendorMap !== 'object' || vendorMap === null) continue;
    if (['version', 'hard_filaments_max_flow_k', 'soft_filaments_max_flow_k'].includes(material)) continue;
    for (const [vendorKey, subMap] of Object.entries(vendorMap)) {
      if (!vendorKey.startsWith('vendor_') || typeof subMap !== 'object' || subMap === null) continue;
      const vendor = vendorKey.slice('vendor_'.length);
      for (const [subKey, params] of Object.entries(subMap)) {
        if (!subKey.startsWith('sub_') || typeof params !== 'object' || params === null) continue;
        const subType = subKey.slice('sub_'.length);
        catalog.entries.push({
          material,
          vendor,
          subType,
          loadTemp: params.load_temp ?? null,
          unloadTemp: params.unload_temp ?? null,
          cleanNozzleTemp: params.clean_nozzle_temp ?? null,
          flowTemp: params.flow_temp ?? null,
          isSoft: !!params.is_soft,
          flowK: params.flow_k || null,
          flowKMin: params.flow_k_min || null,
          flowKMax: params.flow_k_max || null,
        });
      }
    }
  }
  return catalog;
}

// Map Klipper states to the internal gcode_state format
const STATE_MAP = {
  ready: 'IDLE',
  printing: 'RUNNING',
  paused: 'PAUSE',
  complete: 'FINISH',
  cancelled: 'IDLE',
  error: 'FAILED',
  standby: 'IDLE',
  startup: 'IDLE',
  shutdown: 'IDLE',
  disconnected: 'IDLE',
};

export class MoonrakerClient {
  constructor(config, hub) {
    this.ip = config.printer.ip;
    this.port = config.printer.port || 80;
    this._printerId = config.printer.id || '';
    this._printerBrand = (config.printer.type || '').toLowerCase(); // 'creality', 'elegoo', 'voron', 'qidi', 'anker', 'snapmaker', etc.
    this._printerModel = config.printer.model || '';
    this.apiKey = config.printer.accessCode || '';
    this.token = config.printer.token || '';  // JWT token (preferred over apiKey for Moonraker)
    this.hub = hub;
    this.ws = null;
    this.state = {};
    this.connected = false;
    this.onFirmwareInfo = null;
    this.onXcamEvent = null;
    this._reconnectTimer = null;
    this._pollTimer = null;
    this._lastPrintState = null;
    this._subscriptionId = 0;
    this._ledName = null;       // Detected Klipper LED object name
    this._lightPin = null;      // Detected output_pin for light
    this._isSnapmakerU1 = false; // Auto-detected Snapmaker U1
    this._connectionId = null;   // Set by server.connection.identify
  }

  // Build auth headers for HTTP requests. Prefers Bearer token over X-Api-Key.
  _authHeaders() {
    if (this.token) return { 'Authorization': `Bearer ${this.token}` };
    if (this.apiKey) return { 'X-Api-Key': this.apiKey };
    return {};
  }

  // Fetch a short-lived one-shot token from Moonraker for WebSocket auth
  // (query-param auth — Moonraker does not honour headers in WS upgrades reliably).
  async _fetchOneshotToken() {
    if (!this.apiKey && !this.token) return null;
    try {
      const res = await fetch(`${this._baseUrl}/access/oneshot_token`, {
        headers: this._authHeaders(),
        signal: AbortSignal.timeout(5000),
      });
      if (!res.ok) return null;
      const data = await res.json();
      return data?.result || null;
    } catch (e) {
      log.warn(`oneshot_token fetch failed: ${e.message}`);
      return null;
    }
  }

  get _baseUrl() {
    const proto = this.port === 443 ? 'https' : 'http';
    return `${proto}://${this.ip}:${this.port}`;
  }

  get _wsUrl() {
    const proto = this.port === 443 ? 'wss' : 'ws';
    return `${proto}://${this.ip}:${this.port}/websocket`;
  }

  // ---- Connection ----

  connect() {
    log.info(`Connecting to Moonraker ${this._baseUrl}...`);
    this._connectWebSocket();
  }

  disconnect() {
    if (this._reconnectTimer) { clearTimeout(this._reconnectTimer); this._reconnectTimer = null; }
    if (this._pollTimer) { clearInterval(this._pollTimer); this._pollTimer = null; }
    if (this.ws) {
      this.ws.removeAllListeners();
      this.ws.close();
      this.ws = null;
    }
    this.connected = false;
  }

  async _connectWebSocket() {
    if (this.ws) {
      this.ws.removeAllListeners();
      this.ws.close();
    }

    // Moonraker recommends one-shot token in the WS query string for authentication
    // (header-based auth on upgrade is not reliably supported). Fetch it first.
    let wsUrl = this._wsUrl;
    const oneshotToken = await this._fetchOneshotToken();
    if (oneshotToken) {
      wsUrl += `?token=${encodeURIComponent(oneshotToken)}`;
    }

    const headers = this._authHeaders();

    this.ws = new WebSocket(wsUrl, { headers, rejectUnauthorized: false });

    this.ws.on('open', () => {
      this.connected = true;
      log.info(`Moonraker WebSocket connected: ${this.ip}`);
      this.hub.broadcast('connection', { status: 'connected' });
      this._sendIdentify();
      this._subscribe();
      this._requestFullState();
      this._autoDetectModel();
      this._autoDetectWebcam();
      this._detectLightObjects();
    });

    this.ws.on('message', (raw) => {
      try {
        const msg = JSON.parse(raw.toString());
        this._handleWsMessage(msg);
      } catch { /* ignore non-JSON */ }
    });

    this.ws.on('error', (err) => {
      log.error(`Moonraker WS error: ${err.message}`);
    });

    this.ws.on('close', () => {
      if (this.connected) {
        this.connected = false;
        log.info('Moonraker disconnected — reconnecting in 5s...');
        this.hub.broadcast('connection', { status: 'disconnected' });
      }
      this._scheduleReconnect();
    });
  }

  _scheduleReconnect() {
    if (this._reconnectTimer) return;
    this._reconnectTimer = setTimeout(() => {
      this._reconnectTimer = null;
      this._connectWebSocket();
    }, 5000);
  }

  // Identify this connection to Moonraker (replaces deprecated server.websocket.id).
  // Supported since Moonraker 0.7+; server returns a connection_id for tracking.
  _sendIdentify() {
    const params = {
      client_name: '3DPrintForge',
      version: CLIENT_VERSION,
      type: 'other',
      url: 'https://skynett81.github.io/3dprintforge',
    };
    if (this.token) params.access_token = this.token;
    if (this.apiKey) params.api_key = this.apiKey;

    const id = ++this._subscriptionId;
    this._pendingIdentify = id;
    this._wsSend({
      jsonrpc: '2.0',
      method: 'server.connection.identify',
      params,
      id,
    });
  }

  // ---- WebSocket subscription ----

  async _subscribe() {
    // Step 1: Discover ALL available Klipper objects
    const listId = ++this._subscriptionId;
    this._wsSend({ jsonrpc: '2.0', method: 'printer.objects.list', id: listId });

    // Wait for the object list response, then subscribe to everything
    const onList = (raw) => {
      try {
        const msg = JSON.parse(raw.toString());
        if (msg.id !== listId) return;
        this.ws.removeListener('message', onList);

        const available = msg.result?.objects || [];
        this._availableObjects = available;
        log.info(`Klipper objects discovered: ${available.length}`);

        // Subscribe to ALL discovered objects (null = all fields)
        const objects = {};
        for (const obj of available) {
          objects[obj] = null;
        }

        this._wsSend({
          jsonrpc: '2.0',
          method: 'printer.objects.subscribe',
          params: { objects },
          id: ++this._subscriptionId,
        });

        // Store discovered object categories for the dashboard
        this.state._discovered_objects = this._categorizeObjects(available);
      } catch { /* ignore */ }
    };
    this.ws.on('message', onList);

    // Timeout fallback — if object list doesn't arrive in 5s, use static list
    setTimeout(() => {
      this.ws.removeListener('message', onList);
      if (!this._availableObjects) {
        log.warn('Object list timeout — falling back to static subscription');
        this._subscribeStatic();
      }
    }, 5000);
  }

  // Categorize discovered objects for the dashboard
  _categorizeObjects(objects) {
    const cats = { sensors: [], fans: [], heaters: [], motors: [], leds: [], filament: [], other: [] };
    for (const obj of objects) {
      if (obj.startsWith('temperature_sensor ') || obj.startsWith('adc_current_sensor ')) cats.sensors.push(obj);
      else if (obj.startsWith('fan') || obj.startsWith('temperature_fan ')) cats.fans.push(obj);
      else if (obj.startsWith('heater') || obj === 'extruder' || obj.startsWith('extruder')) cats.heaters.push(obj);
      else if (obj.startsWith('tmc') || obj.startsWith('stepper')) cats.motors.push(obj);
      else if (obj.startsWith('neopixel ') || obj.startsWith('led ') || obj.startsWith('dotstar ')) cats.leds.push(obj);
      else if (obj.startsWith('filament_')) cats.filament.push(obj);
      else cats.other.push(obj);
    }
    return cats;
  }

  // Static fallback subscription (used if object list query fails)
  _subscribeStatic() {
    const objects = {
      'print_stats': null, 'display_status': null, 'heater_bed': null,
      'extruder': null, 'extruder1': null, 'extruder2': null, 'extruder3': null,
      'fan': null, 'toolhead': null, 'gcode_move': null, 'motion_report': null,
      'heaters': null, 'system_stats': null, 'webhooks': null, 'idle_timeout': null,
      'virtual_sdcard': null, 'bed_mesh': null, 'mcu': null, 'probe': null,
      'firmware_retraction': null, 'input_shaper': null, 'exclude_object': null,
      'quad_gantry_level': null, 'z_tilt': null, 'respond': null, 'purifier': null,
      'fan_generic cavity_fan': null, 'temperature_sensor cavity': null,
      'temperature_sensor mcu_temp': null, 'temperature_sensor raspberry_pi': null,
      'tmc2209 stepper_x': null, 'tmc2209 stepper_y': null,
      'tmc2240 stepper_x': null, 'tmc2240 stepper_y': null,
      'filament_switch_sensor runout': null, 'filament_switch_sensor filament_sensor': null,
      'filament_motion_sensor filament_sensor': null,
      'temperature_fan controller_fan': null, 'temperature_fan exhaust_fan': null,
      'fan_generic nevermore_internal': null, 'ercf': null, 'afc': null,
      'neopixel sb_leds': null, 'neopixel my_neopixel': null, 'led chamber_led': null,
      'screws_tilt_adjust': null, 'z_thermal_adjust': null, 'manual_probe': null,
      // Snapmaker U1 specific
      'machine_state_manager': null, 'filament_detect': null,
      'filament_feed left': null, 'filament_feed right': null,
      'filament_entangle_detect e0_filament': null, 'filament_entangle_detect e1_filament': null,
      'filament_entangle_detect e2_filament': null, 'filament_entangle_detect e3_filament': null,
      'defect_detection': null, 'timelapse': null, 'print_task_config': null,
      'power_loss_check': null,
      'power_loss_check e0': null, 'power_loss_check e1': null,
      'power_loss_check e2': null, 'power_loss_check e3': null,
      'adc_current_sensor heater_bed': null, 'adc_current_sensor extruder': null,
      // Snapmaker U1 V1.3.0 — confirmed objects from live V1.3.0 printer.
      // Tool pin state (park/active/grab) is on each extruder object, not a
      // separate park_detector object. Flow calibrator is a gcode macro only.
      'exception_manager': null, 'filament_parameters': null, 'configfile': null,
      'extruder_offset_calibration': null, 'auto_screws_tilt_adjust': null,
      'pause_resume': null,
    };
    this._wsSend({
      jsonrpc: '2.0',
      method: 'printer.objects.subscribe',
      params: { objects },
      id: ++this._subscriptionId,
    });
  }

  // ---- Full state fetch ----

  async _requestFullState() {
    try {
      // Build query from discovered objects or use core set
      const queryObjects = this._availableObjects
        ? this._availableObjects.map(o => encodeURIComponent(o)).join('&')
        : 'print_stats&display_status&heater_bed&extruder&extruder1&extruder2&extruder3&fan&toolhead&gcode_move&virtual_sdcard&idle_timeout&system_stats&purifier&exclude_object&machine_state_manager&filament_detect&defect_detection&timelapse&print_task_config&power_loss_check&flow_calibrator';
      const [info, status, history] = await Promise.all([
        this._apiGet('/printer/info'),
        this._apiGet(`/printer/objects/query?${queryObjects}`),
        this._apiGet('/server/history/list?limit=1&order=desc'),
      ]);

      // Printer info (firmware, model)
      if (info?.result) {
        const r = info.result;
        this.state._info = {
          hostname: r.hostname,
          software_version: r.software_version,
          cpu_info: r.cpu_info,
          state: r.state,
          state_message: r.state_message,
        };

        if (this.onFirmwareInfo && r.software_version) {
          this.onFirmwareInfo({
            name: 'klipper',
            sw_ver: r.software_version,
            hw_ver: r.cpu_info || '',
            sn: r.hostname || '',
          });
        }
      }

      // Current state
      if (status?.result?.status) {
        this._mergeKlipperState(status.result.status);
      }

      // Last print info + slicer metadata
      if (history?.result?.jobs?.[0]) {
        const job = history.result.jobs[0];
        if (!this.state.subtask_name && job.filename) {
          this.state.subtask_name = job.filename;
        }
      }

      // Fetch slicer metadata with physical slot color override
      if (this.state.subtask_name && this.state.gcode_state === 'RUNNING') {
        await this._fetchSlicerMetadata(this.state.subtask_name);
      }

      this.hub.broadcast('status', { print: this.state });
    } catch (e) {
      log.error(`State fetch failed: ${e.message}`);
    }
  }

  // ---- State mapping (Klipper → internal format) ----

  async _fetchSlicerMetadata(filename) {
    try {
      const metaRes = await this._apiGet(`/server/files/metadata?filename=${encodeURIComponent(filename)}`);
      if (!metaRes?.result) return;
      const meta = metaRes.result;
      if (meta.estimated_time) this.state._slicer_estimated_time = meta.estimated_time;
      if (meta.object_height) this.state._object_height = meta.object_height;
      if (meta.layer_height) this.state._layer_height = meta.layer_height;
      if (meta.first_layer_height) this.state._first_layer_height = meta.first_layer_height;
      if (meta.filament_type) this.state._slicer_filament_type = meta.filament_type;
      if (meta.filament_weight) this.state._slicer_filament_weights = meta.filament_weight;
      if (meta.filament_weight_total) this.state._slicer_filament_total_g = meta.filament_weight_total;
      if (meta.slicer) this.state._slicer = meta.slicer;
      if (meta.slicer_version) this.state._slicer_version = meta.slicer_version;
      const thumb = meta.thumbnails?.find(t => t.width >= 200)?.relative_path;
      if (thumb) this.state._thumbnail_path = thumb;

      // During printing: use slicer colors (they match what the gcode expects)
      // When idle: use physical slot colors from extruder_slots table
      if (meta.filament_colour) this.state._slicer_filament_colours = meta.filament_colour;
      if (meta.filament_name) this.state._slicer_filament_names = meta.filament_name;

      // Also store physical slot colors separately for idle display
      try {
        const slots = getExtruderSlots(this._printerId || '');
        if (slots.length > 0) {
          this.state._physical_slot_colours = slots.map(s => '#' + s.color_hex).join(';');
          this.state._physical_slot_names = slots.map(s => s.filament_name).join(';');
        }
      } catch { /* not critical */ }

      log.info(`Slicer metadata fetched for ${filename}`);
    } catch { /* not critical */ }
  }

  _mergeKlipperState(status) {
    const ps = status.print_stats || {};
    const ds = status.display_status || {};
    const bed = status.heater_bed || {};
    const ext = status.extruder || {};
    const ext1 = status.extruder1;
    const ext2 = status.extruder2;
    const ext3 = status.extruder3;
    const fan = status.fan || {};
    const th = status.toolhead || {};
    const vsd = status.virtual_sdcard || {};
    const gm = status.gcode_move || {};

    // Print state
    if (ps.state !== undefined) {
      const newState = STATE_MAP[ps.state] || 'IDLE';
      // Fetch slicer metadata when print starts (state changes to RUNNING)
      if (newState === 'RUNNING' && this.state.gcode_state !== 'RUNNING' && ps.filename) {
        this._fetchSlicerMetadata(ps.filename);
      }
      // Clear slicer data when print finishes/cancels
      if (newState === 'IDLE' && this.state.gcode_state === 'RUNNING') {
        this.state._slicer_estimated_time = null;
        this.state._thumbnail_path = null;
        this.state._slicer_filament_weights = null;
        this.state._slicer_filament_colours = null;
        this.state._slicer_filament_names = null;
        this.state._slicer_filament_type = null;
      }
      this.state.gcode_state = newState;
    }

    // Progress
    if (ds.progress !== undefined) {
      this.state.mc_percent = Math.round((ds.progress || 0) * 100);
    } else if (vsd.progress !== undefined) {
      this.state.mc_percent = Math.round((vsd.progress || 0) * 100);
    }

    // Time
    if (ps.print_duration !== undefined) {
      this.state.print_duration_seconds = Math.round(ps.print_duration || 0);
    }
    if (ps.total_duration !== undefined) {
      this.state.total_duration_seconds = Math.round(ps.total_duration || 0);
    }
    // Remaining time: use slicer estimate if available, else calculate from progress
    if (this.state._slicer_estimated_time && this.state.print_duration_seconds !== undefined) {
      // Slicer estimate is most accurate
      const remaining = Math.max(0, this.state._slicer_estimated_time - this.state.print_duration_seconds);
      this.state.mc_remaining_time = Math.round(remaining / 60);
    } else if (this.state.mc_percent > 2 && this.state.print_duration_seconds > 60) {
      // Only estimate from progress when >2% and >1min (avoids wild early estimates)
      const totalEstimate = this.state.print_duration_seconds / (this.state.mc_percent / 100);
      this.state.mc_remaining_time = Math.round((totalEstimate - this.state.print_duration_seconds) / 60);
    }

    // Layers
    if (ps.info?.current_layer !== undefined) this.state.layer_num = ps.info.current_layer;
    if (ps.info?.total_layer !== undefined) this.state.total_layer_num = ps.info.total_layer;

    // Temperatures — primary extruder
    if (ext.temperature !== undefined) this.state.nozzle_temper = Math.round(ext.temperature);
    if (ext.target !== undefined) this.state.nozzle_target_temper = Math.round(ext.target);
    // Per-tool nozzle diameter (Snapmaker U1 V1.3.0+ allows 0.2/0.4/0.6/0.8 per toolhead).
    // Klipper reports it on the [extruder] config object; prefer it over the global default.
    if (ext.nozzle_diameter !== undefined && ext.nozzle_diameter !== null) {
      this.state.nozzle_diameter = Number(ext.nozzle_diameter);
    }

    // Multi-extruder support (Snapmaker U1 has up to 4)
    // Merge into existing _extra_extruders (WS only sends changed fields)
    if (!this.state._extra_extruders) this.state._extra_extruders = [];
    const extras = [ext1, ext2, ext3];
    for (let i = 0; i < extras.length; i++) {
      const ex = extras[i];
      if (ex?.temperature !== undefined || ex?.nozzle_diameter !== undefined) {
        this.state._extra_extruders[i] = {
          ...(this.state._extra_extruders[i] || {}),
          ...(ex?.temperature !== undefined ? { temperature: Math.round(ex.temperature) } : {}),
          ...(ex?.target !== undefined ? { target: Math.round(ex.target || 0) } : {}),
          state: ex.state || this.state._extra_extruders[i]?.state || null,
          switch_count: ex.switch_count ?? this.state._extra_extruders[i]?.switch_count ?? 0,
          pressure_advance: ex.pressure_advance ?? this.state._extra_extruders[i]?.pressure_advance ?? null,
          ...(ex?.nozzle_diameter !== undefined && ex.nozzle_diameter !== null
            ? { nozzle_diameter: Number(ex.nozzle_diameter) }
            : {}),
        };
      }
    }
    // Summary array of per-tool diameters for quick UI access.
    const primaryDiam = this.state.nozzle_diameter;
    const diams = [primaryDiam, ...this.state._extra_extruders.map(e => e?.nozzle_diameter)];
    if (diams.some(d => d !== undefined && d !== null)) {
      this.state._nozzle_diameters = diams;
    }

    // Primary extruder state
    if (ext.state) this.state._extruder_state = ext.state;
    if (ext.switch_count !== undefined) this.state._extruder_switch_count = ext.switch_count;

    // Bed
    if (bed.temperature !== undefined) this.state.bed_temper = Math.round(bed.temperature);
    if (bed.target !== undefined) this.state.bed_target_temper = Math.round(bed.target);

    // Fan
    if (fan.speed !== undefined) {
      this.state.cooling_fan_speed = Math.round((fan.speed || 0) * 100);
    }

    // Speed
    if (gm.speed_factor !== undefined) {
      this.state.spd_mag = Math.round((gm.speed_factor || 1) * 100);
    }

    // Filament
    if (ps.filament_used !== undefined) {
      this.state.filament_used_mm = Math.round(ps.filament_used || 0);
    }

    // Filename
    if (ps.filename) this.state.subtask_name = ps.filename;

    // Position
    if (th.position) {
      this.state._position = {
        x: Math.round((th.position[0] || 0) * 10) / 10,
        y: Math.round((th.position[1] || 0) * 10) / 10,
        z: Math.round((th.position[2] || 0) * 10) / 10,
      };
    }

    // Toolhead info
    if (th.extruder) this.state._active_extruder = th.extruder;

    // Error state. The QR/help URL lands on state later via the exception_manager
    // handler below — here we only track the basic error flag + message text.
    if (ps.state === 'error') {
      this.state.print_error = 1;
      if (ps.message) this.state.print_error_msg = ps.message;
    } else if (ps.state !== undefined) {
      this.state.print_error = 0;
      this.state.print_error_msg = '';
      this.state.print_error_qr_url = '';
    }

    // Message (display)
    if (ds.message) this.state._display_message = ds.message;

    // Purifier
    const pur = status.purifier;
    if (pur) {
      this.state._purifier = {
        fan_speed: Math.round((pur.fan_speed || 0) * 100),
        fan_state: pur.fan_state,
        power_detected: pur.power_detected,
      };
    }

    // Exclude objects (for skip object during print)
    const excl = status.exclude_object;
    if (excl?.objects) {
      this.state.obj_list = excl.objects.map((o, i) => ({
        obj_id: i,
        name: o.name || `Object ${i}`,
        skipped: excl.excluded_objects?.includes(o.name) || false,
      }));
    }

    // ── Snapmaker U1 specific state ──

    // Machine state manager (70+ granular states)
    const msm = status.machine_state_manager;
    if (msm && msm.main_state !== undefined) {
      const mapped = mapSmState(msm.main_state);
      this.state._sm_machine_state = msm.main_state;
      this.state._sm_action_code = msm.action_code;
      this.state._sm_state_name = mapped.name;
      this.state._sm_state_category = mapped.category;
      this.state._sm_state_label = mapped.label;
    }

    // NFC filament detection (per-channel spool info)
    const fd = status.filament_detect;
    if (fd?.info) {
      this.state._sm_filament = fd.info.map((ch, idx) => {
        // Parse multi-color ARGB (up to 5 colors per NFC tag)
        const colors = [];
        if (ch.ARGB_COLOR) colors.push(argbToHex(ch.ARGB_COLOR));
        for (let ci = 2; ci <= 5; ci++) {
          const key = `ARGB_COLOR_${ci}`;
          if (ch[key]) colors.push(argbToHex(ch[key]));
        }

        const data = {
          vendor: ch.VENDOR || '',
          manufacturer: ch.MANUFACTURER || '',
          type: ch.MAIN_TYPE || '',
          subType: ch.SUB_TYPE || '',
          color: colors[0] || '#000000',
          colors, // multi-color array (up to 5)
          colorArgb: ch.ARGB_COLOR,
          weight: ch.WEIGHT || 0,
          length: ch.LENGTH || 0,
          diameter: (ch.DIAMETER || 175) / 100,
          sku: ch.SKU || 0,
          official: ch.OFFICIAL || false,
          nozzleTempMin: ch.HOTEND_MIN_TEMP || 0,
          nozzleTempMax: ch.HOTEND_MAX_TEMP || 0,
          bedTemp: ch.BED_TEMP || 0,
          firstLayerTemp: ch.FIRST_LAYER_TEMP || 0,
          otherLayerTemp: ch.OTHER_LAYER_TEMP || 0,
          dryingTemp: ch.DRYING_TEMP || 0,
          dryingTime: ch.DRYING_TIME || 0,
          mfDate: ch.MF_DATE || null,
          cardUid: ch.CARD_UID || null,
        };
        // Persist to DB cache + sync to main filament inventory (fire-and-forget)
        try {
          import('./db/snapmaker.js').then(({ upsertNfcFilament }) => {
            upsertNfcFilament(this._printerId, idx, data);
          }).catch(() => {});

          // Auto-sync NFC spool to filament inventory
          import('./db/index.js').then(({ getDb }) => {
            const db = getDb();
            const sku = data.sku || `nfc-${this._printerId}-ch${idx}`;
            const existing = db.prepare('SELECT id FROM filament WHERE sku = ?').get(sku);
            if (!existing) {
              db.prepare(`INSERT INTO filament (name, material, vendor, color, color_hex, weight_total_g, sku, source, printer_id)
                VALUES (?, ?, ?, ?, ?, ?, ?, 'nfc', ?)`).run(
                `${data.vendor || 'Snapmaker'} ${data.type || 'PLA'} ${data.subType || ''}`.trim(),
                data.type || 'PLA', data.vendor || 'Snapmaker', data.subType || '',
                data.color || '#000000', data.weight || 1000, sku, this._printerId
              );
            }
          }).catch(() => {});
        } catch { /* ignore */ }
        return data;
      });
    }

    // Filament feed state (left: extruder0+1, right: extruder2+3)
    const feedL = status['filament_feed left'];
    const feedR = status['filament_feed right'];
    if (feedL || feedR) {
      const channels = [];
      for (const [key, data] of Object.entries(feedL || {})) {
        const mapped = mapFeedState(data.channel_state);
        channels.push({ extruder: key, side: 'left', ...data, stateLabel: mapped.label, stateCategory: mapped.category });
      }
      for (const [key, data] of Object.entries(feedR || {})) {
        const mapped = mapFeedState(data.channel_state);
        channels.push({ extruder: key, side: 'right', ...data, stateLabel: mapped.label, stateCategory: mapped.category });
      }
      this.state._sm_feed_channels = channels;
    }

    // Filament entangle detection — track + log high factors
    for (let i = 0; i < 4; i++) {
      const fed = status[`filament_entangle_detect e${i}_filament`];
      if (fed) {
        if (!this.state._sm_entangle) this.state._sm_entangle = {};
        this.state._sm_entangle[`e${i}`] = { detectFactor: fed.detect_factor };

        // Log entangle event when factor exceeds threshold during printing
        if (fed.detect_factor > 0.7 && this.state.gcode_state === 'RUNNING') {
          const logKey = `_entangleLog_e${i}`;
          if (!this[logKey]) {
            this[logKey] = Date.now();
            try {
              import('./db/snapmaker.js').then(m => m.addDefectEvent(
                this._printerId, 'entangle', fed.detect_factor > 0.9 ? 'high' : 'warning',
                { extruder: i, detect_factor: fed.detect_factor }, null, fed.detect_factor
              ));
            } catch {}
          }
          if (this[logKey] && Date.now() - this[logKey] > 120000) this[logKey] = null; // re-log after 2min
        }
      }
    }

    // Defect detection (AI camera)
    const dd = status.defect_detection;
    if (dd) {
      this.state._sm_defect = {
        enabled: dd.main_enable,
        cleanBed: dd.clean_bed,
        noodle: dd.noodle,
        residue: dd.residue,
        nozzle: dd.nozzle,
      };

      // Log defect events when probability exceeds threshold (0.5)
      if (dd.main_enable && this.state.gcode_state === 'RUNNING') {
        const logThreshold = 0.5;
        if (dd.noodle?.probability > logThreshold && !this._lastNoodleLog) {
          this._lastNoodleLog = Date.now();
          try { import('./db/snapmaker.js').then(m => m.addDefectEvent(this._printerId, 'spaghetti', dd.noodle.probability > 0.8 ? 'high' : 'warning', dd.noodle, null, dd.noodle.probability)); } catch {}
        }
        if (dd.residue?.probability > logThreshold && !this._lastResidueLog) {
          this._lastResidueLog = Date.now();
          try { import('./db/snapmaker.js').then(m => m.addDefectEvent(this._printerId, 'residue', 'warning', dd.residue, null, dd.residue.probability)); } catch {}
        }
        // Reset log flags after 60s to allow re-logging
        if (this._lastNoodleLog && Date.now() - this._lastNoodleLog > 60000) this._lastNoodleLog = null;
        if (this._lastResidueLog && Date.now() - this._lastResidueLog > 60000) this._lastResidueLog = null;
      }
    }

    // Timelapse — track active state + auto-capture frames
    const tl = status.timelapse;
    if (tl) {
      const wasActive = this.state._sm_timelapse?.active;
      this.state._sm_timelapse = { active: tl.is_active, frameCount: this._timelapseFrameCount || 0 };

      // Auto-capture frame every 30s during active timelapse
      if (tl.is_active && this.state.gcode_state === 'RUNNING') {
        if (!this._timelapseTimer) {
          this._timelapseFrameCount = 0;
          this._timelapseDir = null;
          this._timelapseTimer = setInterval(() => this._captureTimelapseFrame(), 30000);
        }
      } else if (!tl.is_active && wasActive) {
        // Timelapse ended
        if (this._timelapseTimer) { clearInterval(this._timelapseTimer); this._timelapseTimer = null; }
      }
    }

    // Print task config
    const ptc = status.print_task_config;
    if (ptc) {
      this.state._sm_print_config = {
        timelapse: ptc.time_lapse_camera,
        autoBedLeveling: ptc.auto_bed_leveling,
        flowCalibrate: ptc.flow_calibrate,
        shaperCalibrate: ptc.shaper_calibrate,
        autoReplenish: ptc.auto_replenish_filament,
        entangleDetect: ptc.filament_entangle_detect,
        entangleSensitivity: ptc.filament_entangle_sen,
        extruderMap: ptc.extruder_map_table,
        extrudersUsed: ptc.extruders_used,
        flowCalibExtruders: ptc.flow_calib_extruders,
        filamentConfig: ptc.filament_config,
      };
    }

    // Power loss check
    const plc = status.power_loss_check;
    if (plc) {
      this.state._sm_power = {
        initialized: !!plc.initialized,
        powerLoss: !!plc.power_loss_flag,
        dutyPercent: plc.duty_percent,
        voltageType: plc.voltage_type,
      };
    }

    // Flow calibrator
    const fc = status.flow_calibrator;
    if (fc && Object.keys(fc).length > 0) {
      this.state._sm_flow_cal = fc;
    }

    // Tool park / active state (U1 V1.3.0 — derived from extruder[0..3].state
    // plus the park_pin / active_pin / grab_valid_pin trio).
    //
    // CRITICAL: Moonraker `notify_status_update` only sends fields that changed.
    // An extruder-only temperature delta arrives as `{extruder:{temperature:130}}`
    // without park_pin / state / active_pin. If we rebuild _sm_park from the
    // delta alone, we lose the previous park state for the other tools and
    // briefly flip `active_extruder` to something incorrect — that's visible
    // as UI jitter across every tool/filament card every telemetry tick.
    // Merge into the existing state instead.
    const tools = [status.extruder, status.extruder1, status.extruder2, status.extruder3];
    if (!this.state._sm_park) this.state._sm_park = {};
    let parkChanged = false;
    for (let i = 0; i < tools.length; i++) {
      const tool = tools[i];
      if (!tool) continue;
      // Only update this tool slot when the delta actually contains tool-state fields.
      if (tool.park_pin === undefined && tool.active_pin === undefined &&
          tool.grab_valid_pin === undefined && tool.state === undefined) continue;
      const prev = this.state._sm_park[`t${i}`] || {};
      const next = {
        parked: tool.park_pin === true || tool.state === 'PARKED',
        active: tool.active_pin === true || tool.state === 'ACTIVATE',
        grabbed: tool.grab_valid_pin === true,
        state: tool.state || prev.state || 'UNKNOWN',
      };
      if (prev.parked !== next.parked || prev.active !== next.active ||
          prev.grabbed !== next.grabbed || prev.state !== next.state) {
        this.state._sm_park[`t${i}`] = next;
        parkChanged = true;
      }
    }
    // Derive _active_extruder from the tool with active=true (stable across deltas).
    if (parkChanged) {
      for (const [key, ps] of Object.entries(this.state._sm_park)) {
        if (ps.active) {
          const idx = parseInt(key.slice(1), 10);
          this.state._active_extruder = idx === 0 ? 'extruder' : `extruder${idx}`;
          break;
        }
      }
    }

    // Per-tool extruder offset vectors (U1 XYZ offset calibration).
    // Same delta-safe merge — only replace slot values when the delta carries them.
    for (let i = 0; i < tools.length; i++) {
      const off = tools[i]?.extruder_offset;
      if (Array.isArray(off) && off.length === 3) {
        if (!this.state._extruder_offsets) {
          this.state._extruder_offsets = [null, null, null, null];
        }
        this.state._extruder_offsets[i] = off.map(v => Math.round(v * 10000) / 10000);
      }
    }

    // U1 V1.1.0+ exception manager — structured errors with {id,index,code,level,message}.
    const em = status.exception_manager;
    if (em && Array.isArray(em.exceptions)) {
      this.state._u1_exceptions = em.exceptions.map(ex => ({
        id: ex.id,
        index: ex.index,
        code: ex.code,
        level: ex.level,
        levelLabel: U1_EXCEPTION_LEVELS[ex.level] || 'unknown',
        message: ex.message || '',
        helpUrl: buildU1HelpUrl(ex),
      }));
      // Surface the highest-severity exception's help URL for the quick-status badge.
      const active = this.state._u1_exceptions
        .slice()
        .sort((a, b) => (b.level || 0) - (a.level || 0))[0];
      if (active) this.state.print_error_qr_url = active.helpUrl;
    }

    // U1 V1.3.0 filament_parameters — on-printer catalog (vendor → material → sub-type
    // with per-diameter flow values). The catalog is ~9 KB and nearly static
    // (only changes on firmware update), so we diff by the printer's reported
    // version string and skip the state write otherwise. Writing on every
    // merge would bloat every WebSocket broadcast with 9 KB of unchanged JSON
    // and trigger browser-side re-renders on every tick.
    if (status.filament_parameters) {
      const fpVer = String(status.filament_parameters.version || '');
      if (fpVer !== this._lastFilamentParamsVer) {
        this._lastFilamentParamsVer = fpVer;
        this.state._u1_filament_catalog = extractU1FilamentCatalog(status.filament_parameters);
      }
    }

    // U1 V1.3.0 auto_screws_tilt_adjust — bed leveling progress.
    if (status.auto_screws_tilt_adjust) {
      this.state._u1_screws_tilt = status.auto_screws_tilt_adjust;
    }

    // Bed mesh data (for visualization)
    const bm = status.bed_mesh;
    if (bm) {
      this.state._bed_mesh = {
        profileName: bm.profile_name || '',
        meshMin: bm.mesh_min || [0, 0],
        meshMax: bm.mesh_max || [0, 0],
        probeCount: bm.probed_matrix?.length || 0,
        meshMatrix: bm.mesh_matrix || [],
        profiles: bm.profiles || {},
      };
    }

    // Snapmaker U1 V1.1.1+ heated-bed flatness deviation.
    // Snapmaker has not yet documented the exact field name; we probe a set of
    // plausible object paths and fall back to deriving deviation from the bed
    // mesh matrix if none of them are present. The derived value is always a
    // safe floor — if Snapmaker ships a first-party number later, it wins.
    const flatnessDev = this._extractFlatnessDeviation(status);
    if (flatnessDev !== null) {
      this.state._bed_flatness = flatnessDev;
    }

    // MCU health
    const mcu = status.mcu;
    if (mcu) {
      this.state._mcu = {
        lastStats: mcu.last_stats || {},
        mcuVersion: mcu.mcu_version || '',
        mcuBuild: mcu.mcu_build_versions || '',
      };
    }
    // ---- Dynamic object extraction (all discovered objects) ----

    // All filament switch sensors (dynamic names)
    for (const key of Object.keys(status)) {
      if (key.startsWith('filament_switch_sensor ')) {
        const name = key.slice('filament_switch_sensor '.length);
        const fss = status[key];
        if (!this.state._filament_sensors) this.state._filament_sensors = {};
        this.state._filament_sensors[name] = {
          enabled: fss.enabled, detected: fss.filament_detected,
        };
        // Keep legacy field for backward compat
        this.state._filament_sensor = { name, enabled: fss.enabled, detected: fss.filament_detected };
      }
    }

    // All temperature-controlled fans (dynamic names)
    for (const key of Object.keys(status)) {
      if (key.startsWith('temperature_fan ')) {
        const name = key.slice('temperature_fan '.length);
        const tf = status[key];
        if (!this.state._temp_fans) this.state._temp_fans = {};
        this.state._temp_fans[name] = {
          speed: Math.round((tf.speed || 0) * 100),
          temperature: Math.round((tf.temperature || 0) * 10) / 10,
          target: Math.round((tf.target || 0) * 10) / 10,
        };
      }
    }

    // All generic fans (dynamic names)
    for (const key of Object.keys(status)) {
      if (key.startsWith('fan_generic ')) {
        const name = key.slice('fan_generic '.length);
        const gf = status[key];
        if (!this.state._generic_fans) this.state._generic_fans = {};
        this.state._generic_fans[name] = { speed: Math.round((gf.speed || 0) * 100) };
        // Keep legacy fields
        if (name === 'cavity_fan') this.state._cavity_fan_speed = Math.round((gf.speed || 0) * 100);
        if (name === 'nevermore_internal') this.state._nevermore = { speed: Math.round((gf.speed || 0) * 100) };
      }
    }

    // All temperature sensors (dynamic names)
    for (const key of Object.keys(status)) {
      if (key.startsWith('temperature_sensor ')) {
        const name = key.slice('temperature_sensor '.length);
        const ts = status[key];
        if (!this.state._temperature_sensors) this.state._temperature_sensors = {};
        this.state._temperature_sensors[name] = {
          temperature: Math.round((ts.temperature || 0) * 10) / 10,
          measuredMinTemp: ts.measured_min_temp != null ? Math.round(ts.measured_min_temp * 10) / 10 : null,
          measuredMaxTemp: ts.measured_max_temp != null ? Math.round(ts.measured_max_temp * 10) / 10 : null,
        };
        // Keep legacy system_temps
        if (name === 'mcu_temp' || name === 'raspberry_pi' || name === 'cavity') {
          if (!this.state._system_temps) this.state._system_temps = {};
          this.state._system_temps[name] = { temp: Math.round((ts.temperature || 0) * 10) / 10 };
          if (name === 'cavity') this.state.chamber_temper = Math.round(ts.temperature || 0);
        }
      }
    }

    // All heater_generic (dynamic names — chamber heaters, custom heaters).
    // Creality K2, QIDI Plus4/Q1 Pro, Voron (Nevermore), and Snapmaker U1 all
    // expose their chamber heater here under various names; we also promote
    // the first chamber-sounding one to state._chamber_heater for quick access.
    for (const key of Object.keys(status)) {
      if (key.startsWith('heater_generic ')) {
        const name = key.slice('heater_generic '.length);
        const hg = status[key];
        if (!this.state._generic_heaters) this.state._generic_heaters = {};
        const entry = {
          temperature: Math.round((hg.temperature || 0) * 10) / 10,
          target: Math.round((hg.target || 0) * 10) / 10,
          power: hg.power != null ? Math.round(hg.power * 100) : null,
        };
        this.state._generic_heaters[name] = entry;
        if (/chamber|cavity/i.test(name) && !this.state._chamber_heater) {
          this.state._chamber_heater = { name, ...entry };
        }
      }
    }

    // All LED/neopixel/dotstar strips (dynamic names)
    for (const key of Object.keys(status)) {
      if (key.startsWith('neopixel ') || key.startsWith('led ') || key.startsWith('dotstar ')) {
        const led = status[key];
        if (!this.state._leds) this.state._leds = {};
        const name = key.includes(' ') ? key.split(' ').slice(1).join(' ') : key;
        this.state._leds[name] = { colorData: led.color_data || [] };
      }
    }

    // All TMC drivers (dynamic names)
    for (const key of Object.keys(status)) {
      if (key.startsWith('tmc2209 ') || key.startsWith('tmc2240 ') || key.startsWith('tmc2130 ') || key.startsWith('tmc5160 ')) {
        const tmc = status[key];
        if (!this.state._tmc) this.state._tmc = {};
        const name = key.split(' ')[1];
        this.state._tmc[name] = {
          temperature: tmc.temperature, run_current: tmc.run_current, hold_current: tmc.hold_current,
        };
      }
    }

    // All output pins (dynamic names)
    for (const key of Object.keys(status)) {
      if (key.startsWith('output_pin ')) {
        const name = key.slice('output_pin '.length);
        const pin = status[key];
        if (!this.state._output_pins) this.state._output_pins = {};
        this.state._output_pins[name] = { value: pin.value };
      }
    }

    // All fan_generic objects (Nevermore carbon filter, named cooling fans,
    // Squirrel exhaust, etc.). Parse like _generic_heaters so the dashboard
    // can render a generic "named fan" tile for each one.
    for (const key of Object.keys(status)) {
      if (key.startsWith('fan_generic ') || key.startsWith('temperature_fan ')) {
        const prefix = key.startsWith('fan_generic ') ? 'fan_generic ' : 'temperature_fan ';
        const name = key.slice(prefix.length);
        const fan = status[key];
        if (!this.state._generic_fans) this.state._generic_fans = {};
        this.state._generic_fans[name] = {
          kind: prefix.trim(),
          speed: fan.speed != null ? Math.round(fan.speed * 100) : null,
          rpm: fan.rpm != null ? Math.round(fan.rpm) : null,
          temperature: fan.temperature != null ? Math.round(fan.temperature * 10) / 10 : null,
          target: fan.target != null ? Math.round(fan.target * 10) / 10 : null,
        };
      }
    }

    // All filament motion sensors (dynamic names)
    for (const key of Object.keys(status)) {
      if (key.startsWith('filament_motion_sensor ')) {
        const name = key.slice('filament_motion_sensor '.length);
        const fms = status[key];
        if (!this.state._filament_motion_sensors) this.state._filament_motion_sensors = {};
        this.state._filament_motion_sensors[name] = {
          enabled: fms.enabled, detected: fms.filament_detected,
        };
      }
    }

    // ERCF multi-filament (Voron community)
    const ercf = status.ercf;
    if (ercf) {
      this.state._ercf = {
        enabled: ercf.enabled,
        tool: ercf.tool,
        gate: ercf.gate,
        filament: ercf.filament,
        isHomed: ercf.is_homed,
        action: ercf.action || 'idle',
        numGates: ercf.num_gates || 0,
        gateStatus: ercf.gate_status || [],
        gateColor: ercf.gate_color || [],
      };
    }

    // AFC (Automated Filament Changer)
    const afc = status.afc;
    if (afc) {
      this.state._afc = {
        enabled: afc.enabled,
        currentLane: afc.current_lane,
        lanes: afc.lanes || [],
        status: afc.status || 'idle',
      };
    }

    // Probe data (Tap, Klicky, Beacon, BLTouch)
    const probe = status.probe;
    if (probe) {
      this.state._probe = {
        lastQuery: probe.last_query,
        lastZResult: probe.last_z_result,
        name: probe.name || 'probe',
      };
    }

    // Input shaper data
    const is = status.input_shaper;
    if (is) {
      this.state._input_shaper = {
        shaperFreqX: is.shaper_freq_x,
        shaperFreqY: is.shaper_freq_y,
        shaperTypeX: is.shaper_type_x,
        shaperTypeY: is.shaper_type_y,
        damping: is.damping_ratio_x,
      };
    }

    // Quad gantry level
    const qgl = status.quad_gantry_level;
    if (qgl) {
      this.state._qgl = { applied: qgl.applied };
    }

    // Z tilt
    const zt = status.z_tilt;
    if (zt) {
      this.state._z_tilt = { applied: zt.applied };
    }

    // Screws tilt adjust
    const sta = status.screws_tilt_adjust;
    if (sta) {
      this.state._screws_tilt = { results: sta.results, error: sta.error };
    }

    // Firmware retraction
    const fr = status.firmware_retraction;
    if (fr) {
      this.state._firmware_retraction = {
        retractLength: fr.retract_length,
        retractSpeed: fr.retract_speed,
        unretractExtraLength: fr.unretract_extra_length,
        unretractSpeed: fr.unretract_speed,
      };
    }

    // Z thermal adjust
    const zta = status.z_thermal_adjust;
    if (zta) {
      this.state._z_thermal_adjust = {
        enabled: zta.enabled,
        currentZAdjust: zta.current_z_adjust,
        temperature: zta.temperature,
      };
    }

    // LED / Neopixel state — handled by dynamic extraction above

    // Respond messages (M117/RESPOND)
    const respond = status.respond;
    if (respond?.msg) {
      this.state._lastMessage = respond.msg;
    }

    // ADC current sensors — motor/heater current monitoring
    const currentSensors = {};
    for (const key of ['heater_bed', 'extruder']) {
      const cs = status[`adc_current_sensor ${key}`];
      if (cs) {
        currentSensors[key] = {
          current: Math.round((cs.current || 0) * 100) / 100,
          power: Math.round((cs.power || 0) * 10) / 10,
        };
      }
    }
    if (Object.keys(currentSensors).length > 0) {
      this.state._sm_current = currentSensors;
    }

    // Voltage type from power_loss_check (110V vs 220V)
    if (this.state._sm_power?.voltageType !== undefined) {
      this.state._sm_inputVoltage = this.state._sm_power.voltageType === 1 ? '220V' : '110V';
    }

    // ---- Previously subscribed but not extracted ----

    // Motion report — real-time kinematics (live position, velocity)
    const mr = status.motion_report;
    if (mr) {
      this.state._motion = {
        livePosition: mr.live_position || null,
        liveVelocity: mr.live_velocity != null ? Math.round(mr.live_velocity * 10) / 10 : null,
        liveExtruderVelocity: mr.live_extruder_velocity != null ? Math.round(mr.live_extruder_velocity * 100) / 100 : null,
      };
    }

    // System stats — CPU, memory, system load
    const ss = status.system_stats;
    if (ss) {
      this.state._system_stats = {
        sysload: ss.sysload != null ? Math.round(ss.sysload * 100) / 100 : null,
        cpuTemp: ss.cputemp != null ? Math.round(ss.cputemp * 10) / 10 : null,
        memAvail: ss.memavail != null ? Math.round(ss.memavail) : null,
      };
    }

    // Webhooks — Klipper connection state
    const wh = status.webhooks;
    if (wh) {
      this.state._klipper_state = {
        state: wh.state || 'unknown',
        stateMessage: wh.state_message || '',
      };
    }

    // Toolhead limits — max velocity/acceleration from config
    if (th.max_velocity !== undefined || th.max_accel !== undefined) {
      this.state._toolhead_limits = {
        maxVelocity: th.max_velocity || null,
        maxAccel: th.max_accel || null,
        maxAccelToDecel: th.max_accel_to_decel || null,
        squareCornerVelocity: th.square_corner_velocity || null,
        homedAxes: th.homed_axes || '',
      };
    }

    // G-code coordinate system (gcode position vs physical position)
    if (gm.gcode_position) {
      this.state._gcode_position = {
        x: Math.round((gm.gcode_position[0] || 0) * 10) / 10,
        y: Math.round((gm.gcode_position[1] || 0) * 10) / 10,
        z: Math.round((gm.gcode_position[2] || 0) * 10) / 10,
        e: Math.round((gm.gcode_position[3] || 0) * 10) / 10,
      };
    }
    if (gm.homing_origin) {
      this.state._homing_origin = {
        x: gm.homing_origin[0] || 0,
        y: gm.homing_origin[1] || 0,
        z: gm.homing_origin[2] || 0,
      };
    }
    // Extrude factor (flow rate multiplier)
    if (gm.extrude_factor !== undefined) {
      this.state._flow_factor = Math.round((gm.extrude_factor || 1) * 100);
    }

    // Filament motion sensor (more precise than switch sensor)
    const fms = status['filament_motion_sensor filament_sensor'];
    if (fms) {
      this.state._filament_motion_sensor = {
        enabled: fms.enabled,
        detected: fms.filament_detected,
      };
    }

    // Idle timeout
    const it = status.idle_timeout;
    if (it) {
      this.state._idle_timeout = {
        state: it.state || 'unknown',
        printingTime: it.printing_time || 0,
      };
    }

    // Heaters list
    const heaters = status.heaters;
    if (heaters?.available_heaters) {
      this.state._available_heaters = heaters.available_heaters;
      this.state._available_sensors = heaters.available_sensors || [];
    }

  }

  // ---- WebSocket message handler ----

  _handleWsMessage(msg) {
    // JSON-RPC notification: printer object status update
    if (msg.method === 'notify_status_update' && msg.params?.[0]) {
      this._mergeKlipperState(msg.params[0]);
      this.hub.broadcast('status', { print: this.state });
    }

    // Klippy state changes
    if (msg.method === 'notify_klippy_ready') {
      log.info('Klippy ready');
      this._requestFullState();
    }
    if (msg.method === 'notify_klippy_disconnected') {
      log.warn('Klippy disconnected');
      this.state.gcode_state = 'IDLE';
      this.hub.broadcast('status', { print: this.state });
    }

    // Print events
    if (msg.method === 'notify_gcode_response') {
      // G-code response — could be used for error detection
    }

    // Moonraker 0.8+ real-time notifications — surface to dashboard for live UI updates.
    if (msg.method === 'notify_announcement_update' && msg.params?.[0]) {
      this.hub?.broadcast?.('moonraker_announcement', {
        entries: msg.params[0].entries || [],
      });
    }
    if (msg.method === 'notify_announcement_dismissed' && msg.params?.[0]) {
      this.hub?.broadcast?.('moonraker_announcement', {
        dismissed: msg.params[0].entry_id,
      });
    }
    if (msg.method === 'notify_job_queue_changed' && msg.params?.[0]) {
      const p = msg.params[0];
      this.hub?.broadcast?.('moonraker_queue', {
        action: p.action,
        queue: p.updated_queue || [],
        queue_state: p.queue_state,
      });
    }
    if (msg.method === 'notify_history_changed' && msg.params?.[0]) {
      const p = msg.params[0];
      this.hub?.broadcast?.('moonraker_history', {
        action: p.action,
        job: p.job,
      });
    }
    if (msg.method === 'notify_filelist_changed' && msg.params?.[0]) {
      const p = msg.params[0];
      this.hub?.broadcast?.('moonraker_filelist', {
        action: p.action,
        item: p.item,
        source_item: p.source_item,
      });
    }
    if (msg.method === 'notify_service_state_changed' && msg.params?.[0]) {
      this.hub?.broadcast?.('moonraker_service', { services: msg.params[0] });
    }
    if (msg.method === 'notify_power_changed' && msg.params?.[0]) {
      const p = msg.params[0];
      this.hub?.broadcast?.('moonraker_power', {
        device: p.device,
        status: p.status,
        locked_while_printing: p.locked_while_printing,
      });
    }
    // Spoolman connectivity / pending-report changes surface via the
    // `spoolman:spoolman_status_changed` server event. Broadcast to dashboard
    // so the spool-panel can re-render without polling.
    if (msg.method === 'notify_spoolman_status_changed' && msg.params?.[0]) {
      this.hub?.broadcast?.('spoolman_status', msg.params[0]);
    }
    if (msg.method === 'notify_active_spool_set' && msg.params?.[0]) {
      this.hub?.broadcast?.('spoolman_active_spool', msg.params[0]);
    }

    // JSON-RPC response (subscription ack, query results)
    if (msg.id && msg.result?.status) {
      this._mergeKlipperState(msg.result.status);
      this.hub.broadcast('status', { print: this.state });
    }
  }

  // ---- Light detection ----

  async _detectLightObjects() {
    try {
      const data = await this._apiGet('/printer/objects/list');
      if (!data?.result?.objects) return;
      const objects = data.result.objects;
      // Find LED objects (led <name>)
      const ledObj = objects.find(o => o.startsWith('led '));
      if (ledObj) {
        this._ledName = ledObj.replace('led ', '');
        log.info(`Detected Klipper LED: ${this._ledName}`);
      }
      // Find light-related output pins
      const lightPin = objects.find(o =>
        o.startsWith('output_pin ') && /light|case|lamp|led/i.test(o)
      );
      if (lightPin) {
        this._lightPin = lightPin.replace('output_pin ', '');
        log.info(`Detected light pin: ${this._lightPin}`);
      }
      // Detect extended firmware (paxx12) by probing v4l2-mpp camera
      this._detectExtendedFirmware();

      // Detect Snapmaker U1 by presence of machine_state_manager
      if (objects.includes('machine_state_manager')) {
        this._isSnapmakerU1 = true;
        this.state._isSnapmakerU1 = true;
        log.info('Detected Snapmaker U1 printer');
        // Notify hub so frontend gets the SM flag in meta
        if (this.onSmDetected) this.onSmDetected();
      }
    } catch { /* ignore */ }
  }

  // ---- Auto-detect printer model ----

  async _autoDetectModel() {
    try {
      const info = await this._apiGet('/printer/info');
      if (!info?.result) return;
      const hostname = info.result.hostname || '';
      const swVersion = info.result.software_version || '';

      // Try to detect model from hostname or config
      const configRes = await this._apiGet('/printer/objects/query?configfile');
      const config = configRes?.result?.status?.configfile?.config || {};
      const printerCfg = config.printer || {};

      // Extract kinematics and max values for model detection
      const kinematics = printerCfg.kinematics || '';
      const maxVel = parseInt(printerCfg.max_velocity) || 0;
      const maxAccel = parseInt(printerCfg.max_accel) || 0;

      this.state._klipper_version = swVersion;
      this.state._hostname = hostname;
      this.state._kinematics = kinematics;
      this.state._max_velocity = maxVel;
      this.state._max_accel = maxAccel;

      // Auto-detect specific brands from hostname/config
      if (hostname.includes('creality') || hostname.includes('CR-') || hostname.includes('K1')) {
        this.state._detected_brand = 'Creality';
        // Creality K1/K1 Max: custom camera on port 4408 with fluidd
        this.state._brand_camera_port = 4408;
        this.state._brand_ui = 'fluidd';
      } else if (hostname.includes('neptune') || hostname.includes('elegoo')) {
        this.state._detected_brand = 'Elegoo';
        // Elegoo Neptune 4: custom firmware with OpenNept4une, camera usually on 8080
        this.state._brand_camera_port = 8080;
        this.state._brand_ui = 'fluidd';
      } else if (hostname.includes('qidi') || hostname.includes('QIDI')) {
        this.state._detected_brand = 'QIDI';
        // QIDI: custom Klipper with extended firmware, camera varies
        this.state._brand_ui = 'fluidd';
        // QIDI has custom pressure advance tuning
        this.state._brand_features = ['input_shaper', 'pressure_advance', 'chamber_heater'];
      } else if (hostname.includes('voron') || hostname.includes('Voron')) {
        this.state._detected_brand = 'Voron';
        // Voron: advanced features — chamber heater, quad_gantry_level, auto-Z
        this.state._brand_ui = 'mainsail';
        this.state._brand_features = ['quad_gantry_level', 'chamber_heater', 'nevermore_filter', 'auto_z_calibrate'];
      } else if (hostname.includes('ratrig') || hostname.includes('RatRig')) {
        this.state._detected_brand = 'RatRig';
        // RatRig: RatOS with custom macros
        this.state._brand_ui = 'mainsail';
        this.state._brand_features = ['ratos_macros', 'beacon_probe', 'auto_z_calibrate'];
      } else if (hostname.includes('sovol') || hostname.includes('SV')) {
        this.state._detected_brand = 'Sovol';
        this.state._brand_ui = 'mainsail';
        this.state._brand_features = ['auto_z_offset'];
      } else if (hostname.includes('anker') || hostname.includes('AnkerMake')) {
        this.state._detected_brand = 'AnkerMake';
        this.state._brand_camera_port = 8080;
      }

      if (this.state._detected_brand) {
        log.info(`Auto-detected brand: ${this.state._detected_brand} (hostname: ${hostname})`);
        // Fetch brand-specific Klipper objects
        this._fetchBrandSpecificData();
      }
    } catch { /* not critical */ }
  }

  // ---- Brand-specific data fetch ----

  async _fetchBrandSpecificData() {
    const brand = this.state._detected_brand;
    if (!brand) return;

    try {
      // Voron: Quad Gantry Level, chamber heater
      if (brand === 'Voron') {
        const qgl = await this._apiGet('/printer/objects/query?quad_gantry_level');
        if (qgl?.result?.status?.quad_gantry_level) {
          this.state._brand_qgl = qgl.result.status.quad_gantry_level;
        }
        // Chamber heater (generic_heater or heater_generic)
        const chamber = await this._apiGet('/printer/objects/query?heater_generic%20chamber');
        if (chamber?.result?.status?.['heater_generic chamber']) {
          const ch = chamber.result.status['heater_generic chamber'];
          this.state.chamber_temper = Math.round(ch.temperature || 0);
          this.state._chamber_target = Math.round(ch.target || 0);
        }
      }

      // Creality K1: Input shaper results
      if (brand === 'Creality') {
        const shaper = await this._apiGet('/printer/objects/query?input_shaper');
        if (shaper?.result?.status?.input_shaper) {
          this.state._brand_input_shaper = shaper.result.status.input_shaper;
        }
      }

      // QIDI: Chamber heater + filament sensor + firmware version
      if (brand === 'QIDI') {
        const chamber = await this._apiGet('/printer/objects/query?heater_generic%20chamber_heater');
        if (chamber?.result?.status?.['heater_generic chamber_heater']) {
          const ch = chamber.result.status['heater_generic chamber_heater'];
          this.state.chamber_temper = Math.round(ch.temperature || 0);
          this.state._chamber_target = Math.round(ch.target || 0);
        }
        // QIDI filament sensor
        const fsens = await this._apiGet('/printer/objects/query?filament_switch_sensor%20fila');
        if (fsens?.result?.status?.['filament_switch_sensor fila']) {
          this.state._filament_sensor = {
            name: 'fila', enabled: fsens.result.status['filament_switch_sensor fila'].enabled,
            detected: fsens.result.status['filament_switch_sensor fila'].filament_detected,
          };
        }
        // QIDI firmware detection
        const mcuInfo = await this._apiGet('/printer/objects/query?mcu');
        if (mcuInfo?.result?.status?.mcu) {
          this.state._brand_firmware = mcuInfo.result.status.mcu.mcu_version || '';
        }
      }

      // Creality: Nebula camera detection + firmware info
      if (brand === 'Creality') {
        // Try Creality-specific camera endpoints
        try {
          const camRes = await fetch(`http://${this.ip}:4408/?action=snapshot`, { signal: AbortSignal.timeout(2000) });
          if (camRes.ok) this.state._brand_camera_confirmed = true;
        } catch {}
        // Sonic Pad firmware detection
        const mcuInfo = await this._apiGet('/printer/objects/query?mcu');
        if (mcuInfo?.result?.status?.mcu) {
          this.state._brand_firmware = mcuInfo.result.status.mcu.mcu_version || '';
          if (this.state._brand_firmware.includes('sonic')) this.state._brand_sonic_pad = true;
        }
      }

      // RatRig: RatOS macros + Beacon probe data
      if (brand === 'RatRig') {
        const macros = await this._apiGet('/printer/objects/list');
        if (macros?.result?.objects) {
          const ratosObjects = macros.result.objects.filter(o => o.includes('ratos') || o.includes('beacon'));
          this.state._brand_ratos_objects = ratosObjects;
          // Available RatOS calibration macros
          const ratosGcodes = await this._apiGet('/printer/objects/query?gcode_macro%20GENERATE_SHAPER_GRAPHS&gcode_macro%20MEASURE_COREXY_BELT_TENSION&gcode_macro%20BEACON_CALIBRATE');
          this.state._brand_ratos_macros = [];
          if (ratosGcodes?.result?.status) {
            for (const key of Object.keys(ratosGcodes.result.status)) {
              this.state._brand_ratos_macros.push(key.replace('gcode_macro ', ''));
            }
          }
        }
        // Beacon probe specific data
        const beacon = await this._apiGet('/printer/objects/query?beacon');
        if (beacon?.result?.status?.beacon) {
          this.state._brand_beacon = {
            model: beacon.result.status.beacon.model || '',
            lastContact: beacon.result.status.beacon.last_contact_result || null,
            lastScan: beacon.result.status.beacon.last_scan_result || null,
          };
        }
      }

      // All Klipper: Pressure advance
      const pa = await this._apiGet('/printer/objects/query?extruder');
      if (pa?.result?.status?.extruder?.pressure_advance !== undefined) {
        this.state._pressure_advance = pa.result.status.extruder.pressure_advance;
        this.state._smooth_time = pa.result.status.extruder.smooth_time;
      }

    } catch (e) { log.warn(`Brand-specific fetch failed: ${e.message}`); }
  }

  // ---- Webcam auto-discovery ----

  async _autoDetectWebcam() {
    // Try Moonraker's webcam API first
    try {
      const data = await this._apiGet('/server/webcams/list');
      const cams = data?.result?.webcams || [];
      if (cams.length > 0) {
        const cam = cams.find(c => c.enabled) || cams[0];
        this.state._webcam = {
          name: cam.name,
          streamUrl: cam.stream_url?.startsWith('/') ? `http://${this.ip}:${this.port}${cam.stream_url}` : cam.stream_url,
          snapshotUrl: cam.snapshot_url?.startsWith('/') ? `http://${this.ip}:${this.port}${cam.snapshot_url}` : cam.snapshot_url,
          flipH: cam.flip_horizontal,
          flipV: cam.flip_vertical,
          rotation: cam.rotation,
        };
        log.info(`Webcam detected: ${cam.name} (${cam.service})`);
        return;
      }
    } catch { /* no webcam API */ }

    // Probe common webcam ports
    const ports = [8080, 8081, 4408];
    for (const port of ports) {
      try {
        const res = await fetch(`http://${this.ip}:${port}/?action=snapshot`, { signal: AbortSignal.timeout(2000) });
        if (res.ok && (res.headers.get('content-type') || '').includes('image')) {
          this.state._webcam = {
            name: 'camera',
            snapshotUrl: `http://${this.ip}:${port}/?action=snapshot`,
            streamUrl: `http://${this.ip}:${port}/?action=stream`,
          };
          log.info(`Webcam found on port ${port}`);
          return;
        }
      } catch { /* next */ }
    }
  }

  // ---- Extended firmware detection (paxx12) ----

  async _detectExtendedFirmware() {
    // Check if v4l2-mpp camera streamer is available (extended firmware feature)
    // v4l2-mpp has a /status endpoint that our Python camera_server does NOT have
    const ports = [8080, 8081];
    for (const port of ports) {
      try {
        const res = await fetch(`http://${this.ip}:${port}/status`, { signal: AbortSignal.timeout(2000) });
        if (res.ok) {
          const text = await res.text();
          // v4l2-mpp /status returns JSON with encoder/capture info
          if (text.includes('encoder') || text.includes('capture') || text.includes('v4l2')) {
            this._extendedFirmware = true;
            this._v4l2MppPort = port;
            this.state._extended_firmware = true;
            this.state._v4l2_mpp_port = port;
            log.info(`Detected extended firmware (v4l2-mpp on port ${port})`);
            return;
          }
        }
      } catch { /* not available */ }
    }
    // Check for WebRTC endpoint (v4l2-mpp stream-webrtc on port 8081)
    try {
      const res = await fetch(`http://${this.ip}:8081/whep`, { signal: AbortSignal.timeout(2000) });
      if (res.status === 405 || res.ok) { // WebRTC WHEP endpoint exists
        this._extendedFirmware = true;
        this.state._extended_firmware = true;
        log.info('Detected extended firmware (WebRTC available)');
      }
    } catch { /* not available */ }
  }

  // ---- Commands ----

  sendCommand(commandObj) {
    if (!this.connected) return;

    // Accept both Bambu-style command objects and direct Moonraker actions
    const action = commandObj._moonraker_action || commandObj.action;

    switch (action) {
      case 'pause':
        this._apiPost('/printer/print/pause');
        break;
      case 'resume':
        this._apiPost('/printer/print/resume');
        break;
      case 'stop':
      case 'cancel':
        this._apiPost('/printer/print/cancel');
        break;
      case 'gcode':
        this._apiPost('/printer/gcode/script', { script: commandObj.gcode || commandObj.param });
        break;
      case 'emergency_stop':
        this._apiPost('/printer/emergency_stop');
        break;
      case 'restart':
        this._apiPost('/printer/restart');
        break;

      // System/OS commands
      case 'system_reboot':
        this._apiPost('/machine/reboot');
        break;
      case 'system_shutdown':
        this._apiPost('/machine/shutdown');
        break;
      case 'service_restart': {
        const svc = commandObj.service || 'klipper';
        this._apiPost(`/machine/services/restart?service=${svc}`);
        break;
      }
      case 'service_stop': {
        const svc2 = commandObj.service || 'klipper';
        this._apiPost(`/machine/services/stop?service=${svc2}`);
        break;
      }
      case 'service_start': {
        const svc3 = commandObj.service || 'klipper';
        this._apiPost(`/machine/services/start?service=${svc3}`);
        break;
      }

      // Power device control (smart plugs, GPIO, relays)
      case 'power_on': {
        const dev = commandObj.device || '';
        this._apiPost(`/machine/device_power/device?device=${encodeURIComponent(dev)}&action=on`);
        break;
      }
      case 'power_off': {
        const dev2 = commandObj.device || '';
        this._apiPost(`/machine/device_power/device?device=${encodeURIComponent(dev2)}&action=off`);
        break;
      }
      case 'power_toggle': {
        this.togglePowerDevice(commandObj.device || '');
        break;
      }

      // Klipper [exclude_object] — skip during print (OrcaSlicer workflow)
      case 'exclude_object_name':
        this.excludeObject(commandObj.name);
        break;
      case 'exclude_object_id':
        this.excludeObjectById(commandObj.id);
        break;
      case 'exclude_object_reset':
        this.resetExcludedObjects();
        break;

      // CAN-bus discovery for setup wizards
      case 'canbus_scan':
        this.scanCanbus(commandObj.interface).then(r => {
          this.hub?.broadcast?.('moonraker_canbus_scan', r);
        }).catch(() => {});
        break;

      // Update manager
      case 'update_refresh':
        this.refreshUpdateStatus(commandObj.name);
        break;
      case 'update_full':
        this.triggerFullUpdate();
        break;

      // Notifier test-trigger
      case 'notifier_test':
        this.testNotifier(commandObj.name);
        break;

      // History CRUD
      case 'history_reset_totals':
        this.resetHistoryTotals();
        break;
      case 'history_delete':
        if (commandObj.uid) this.deleteHistoryJob(commandObj.uid);
        break;

      // Input shaper tuning
      case 'input_shaper_measure':
        this.measureAxesNoise();
        break;
      case 'input_shaper_calibrate':
        try { this.shaperCalibrate(commandObj.axis); } catch (e) { log.warn(e.message); }
        break;
      case 'input_shaper_test':
        try { this.testResonances(commandObj.axis, commandObj.output); } catch (e) { log.warn(e.message); }
        break;

      // WLED strip control
      case 'wled_on':
        this._apiPost(`/machine/wled/on?strip=${commandObj.strip || 'strip'}`);
        break;
      case 'wled_off':
        this._apiPost(`/machine/wled/off?strip=${commandObj.strip || 'strip'}`);
        break;
      case 'wled_preset':
        this._apiPost(`/machine/wled/strip?strip=${commandObj.strip || 'strip'}&preset=${commandObj.preset || 1}`);
        break;
      case 'firmware_restart':
        this._apiPost('/printer/firmware_restart');
        break;
      case 'print_file':
        this._apiPost('/printer/print/start', { filename: commandObj.filename });
        break;
      case 'speed': {
        const factor = (commandObj.value || 100) / 100;
        this._apiPost('/printer/gcode/script', { script: `SET_VELOCITY_LIMIT VELOCITY=${factor * 300}` });
        break;
      }
      case 'set_temp_nozzle':
        this._apiPost('/printer/gcode/script', {
          script: `SET_HEATER_TEMPERATURE HEATER=extruder TARGET=${commandObj.target || 0}`
        });
        break;
      case 'set_temp_bed':
        this._apiPost('/printer/gcode/script', {
          script: `SET_HEATER_TEMPERATURE HEATER=heater_bed TARGET=${commandObj.target || 0}`
        });
        break;
      case 'light': {
        const mode = commandObj.mode || 'on';
        const on = mode === 'on';
        if (this._ledName) {
          // Use detected LED object (e.g. cavity_led, neopixel, etc.)
          const script = on
            ? `SET_LED LED=${this._ledName} RED=1 GREEN=1 BLUE=1 WHITE=1`
            : `SET_LED LED=${this._ledName} RED=0 GREEN=0 BLUE=0 WHITE=0`;
          this._apiPost('/printer/gcode/script', { script });
        } else if (this._lightPin) {
          // Use detected output_pin
          this._apiPost('/printer/gcode/script', { script: `SET_PIN PIN=${this._lightPin} VALUE=${on ? 1 : 0}` });
        } else {
          // No detected light — try common names
          this._apiPost('/printer/gcode/script', { script: `SET_PIN PIN=caselight VALUE=${on ? 1 : 0}` })
            .catch(() => {});
        }
        break;
      }
      case 'home':
        this._apiPost('/printer/gcode/script', { script: 'G28' });
        break;
      case 'pushall':
        // Moonraker equivalent: fetch full state
        this._requestFullState();
        break;
      // ── Snapmaker U1 commands ──
      case 'sm_feed_auto':
        this._apiPost('/printer/gcode/script', { script: `AUTO_FEEDING CHANNEL=${commandObj.channel || 0}` });
        break;
      case 'sm_feed_manual':
        this._apiPost('/printer/gcode/script', { script: `MANUAL_FEEDING CHANNEL=${commandObj.channel || 0}` });
        break;
      case 'sm_feed_unload':
        this._apiPost('/printer/gcode/script', { script: `INNER_FILAMENT_UNLOAD CHANNEL=${commandObj.channel || 0}` });
        break;
      case 'sm_defect_config':
        this._apiPost('/printer/gcode/script', { script: `DEFECT_DETECTION_CONFIG MAIN_ENABLE=${commandObj.enable ? 1 : 0}` });
        break;
      case 'sm_defect_config_detail': {
        // Per-detector enable/disable with optional sensitivity
        const det = commandObj.detector; // noodle, clean_bed, residue, nozzle_check
        const en = commandObj.enable ? 1 : 0;
        const sens = commandObj.sensitivity || '';
        let gcode = `DEFECT_DETECTION_CONFIG ${det.toUpperCase()}_ENABLE=${en}`;
        if (sens) gcode += ` ${det.toUpperCase()}_SENSITIVITY=${sens}`;
        this._apiPost('/printer/gcode/script', { script: gcode });
        break;
      }
      case 'sm_timelapse_start':
        this._apiPost('/printer/gcode/script', { script: 'TIMELAPSE_START TYPE=new' });
        break;
      case 'sm_timelapse_stop':
        this._apiPost('/printer/gcode/script', { script: 'TIMELAPSE_STOP' });
        break;
      case 'sm_timelapse_frame':
        this._apiPost('/printer/gcode/script', { script: 'TIMELAPSE_TAKE_FRAME' });
        break;
      case 'sm_flow_calibrate':
        this._apiPost('/printer/gcode/script', { script: `SET_PRINT_FLOW_CALIBRATION ENABLE=1` });
        break;
      case 'sm_set_print_config': {
        const cmds = [];
        if (commandObj.autoBedLeveling !== undefined) cmds.push(`SET_PRINT_AUTO_BED_LEVELING ENABLE=${commandObj.autoBedLeveling ? 1 : 0}`);
        if (commandObj.timelapse !== undefined) cmds.push(`SET_TIME_LAPSE_CAMERA ENABLE=${commandObj.timelapse ? 1 : 0}`);
        if (commandObj.flowCalibrate !== undefined) cmds.push(`SET_PRINT_FLOW_CALIBRATION ENABLE=${commandObj.flowCalibrate ? 1 : 0}`);
        if (commandObj.shaperCalibrate !== undefined) cmds.push(`SET_PRINT_SHAPER_CALIBRATION ENABLE=${commandObj.shaperCalibrate ? 1 : 0}`);
        for (const cmd of cmds) this._apiPost('/printer/gcode/script', { script: cmd });
        break;
      }
      default:
        log.warn(`Unknown command: ${action}`);
    }
  }

  // ---- Moonraker File Manager ----

  async listFiles(root = 'gcodes') {
    const data = await this._apiGet(`/server/files/list?root=${root}`);
    return data?.result || [];
  }

  async getFileMetadata(filename) {
    const data = await this._apiGet(`/server/files/metadata?filename=${encodeURIComponent(filename)}`);
    return data?.result || null;
  }

  async deleteFile(filename, root = 'gcodes') {
    return this._apiDelete(`/server/files/${root}/${encodeURIComponent(filename)}`);
  }

  getThumbnailUrl(relativePath) {
    return `${this._baseUrl}/server/files/gcodes/${encodeURIComponent(relativePath)}`;
  }

  getFileDownloadUrl(filename) {
    return `${this._baseUrl}/server/files/gcodes/${encodeURIComponent(filename)}`;
  }

  /** Upload a gcode file to the printer */
  async uploadFile(filename, buffer) {
    const boundary = '----3DPrintForge' + Date.now();
    const header = `--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="${filename}"\r\nContent-Type: application/octet-stream\r\n\r\n`;
    const footer = `\r\n--${boundary}--\r\n`;
    const body = Buffer.concat([Buffer.from(header), buffer, Buffer.from(footer)]);

    const headers = { 'Content-Type': `multipart/form-data; boundary=${boundary}`, 'Content-Length': body.length, ...this._authHeaders() };

    try {
      const res = await fetch(`${this._baseUrl}/server/files/upload`, {
        method: 'POST', headers, body, signal: AbortSignal.timeout(60000),
      });
      if (!res.ok) throw new Error(`Upload failed: HTTP ${res.status}`);
      return res.json();
    } catch (e) {
      log.error(`Upload failed: ${e.message}`);
      throw e;
    }
  }

  /** Upload and start printing immediately */
  async uploadAndPrint(filename, buffer) {
    const boundary = '----3DPrintForge' + Date.now();
    const header = `--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="${filename}"\r\nContent-Type: application/octet-stream\r\n\r\n`;
    const printField = `\r\n--${boundary}\r\nContent-Disposition: form-data; name="print"\r\n\r\ntrue`;
    const footer = `\r\n--${boundary}--\r\n`;
    const body = Buffer.concat([Buffer.from(header), buffer, Buffer.from(printField), Buffer.from(footer)]);

    const headers = { 'Content-Type': `multipart/form-data; boundary=${boundary}`, 'Content-Length': body.length, ...this._authHeaders() };

    try {
      const res = await fetch(`${this._baseUrl}/server/files/upload`, {
        method: 'POST', headers, body, signal: AbortSignal.timeout(60000),
      });
      if (!res.ok) throw new Error(`Upload failed: HTTP ${res.status}`);
      return res.json();
    } catch (e) {
      log.error(`Upload+print failed: ${e.message}`);
      throw e;
    }
  }

  // ---- Moonraker Job Queue ----

  async getJobQueue() {
    const data = await this._apiGet('/server/job_queue/status');
    return data?.result || { queued_jobs: [], queue_state: 'paused' };
  }

  async enqueueJob(filenames) {
    const files = Array.isArray(filenames) ? filenames : [filenames];
    return this._apiPost('/server/job_queue/job', { filenames: files });
  }

  async removeQueueJob(jobIds) {
    const ids = Array.isArray(jobIds) ? jobIds : [jobIds];
    return this._apiDelete(`/server/job_queue/job?job_ids=${ids.join(',')}`);
  }

  async pauseQueue() { return this._apiPost('/server/job_queue/pause'); }
  async startQueue() { return this._apiPost('/server/job_queue/start'); }

  // ---- Moonraker Webcam ----

  async getWebcams() {
    const data = await this._apiGet('/server/webcams/list');
    return data?.result?.webcams || [];
  }

  getSnapshotUrl() {
    return `${this._baseUrl}/webcam/?action=snapshot`;
  }

  getStreamUrl() {
    return `${this._baseUrl}/webcam/?action=stream`;
  }

  /** Capture timelapse frame to disk */
  async _captureTimelapseFrame() {
    try {
      const { existsSync, mkdirSync, writeFileSync } = await import('node:fs');
      const { join } = await import('node:path');

      // Create timelapse directory
      if (!this._timelapseDir) {
        const dataDir = join(import.meta.dirname, '..', 'data', 'timelapse', this._printerId);
        const ts = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
        this._timelapseDir = join(dataDir, ts);
        mkdirSync(this._timelapseDir, { recursive: true });
      }

      // Capture snapshot
      const url = this.getSnapshotUrl();
      const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
      if (res.ok) {
        const buffer = Buffer.from(await res.arrayBuffer());
        const frameNum = String(this._timelapseFrameCount++).padStart(5, '0');
        writeFileSync(join(this._timelapseDir, `frame_${frameNum}.jpg`), buffer);
        this.state._sm_timelapse.frameCount = this._timelapseFrameCount;
      }
    } catch (e) {
      // Non-critical — skip frame
    }
  }

  // ---- Moonraker Update Manager ----

  async getUpdateStatus() {
    const data = await this._apiGet('/machine/update/status');
    return data?.result || null;
  }

  /** Rescan upstream repos without actually installing anything. */
  async refreshUpdateStatus(name) {
    const qs = name ? `?name=${encodeURIComponent(name)}` : '';
    return this._apiPost(`/machine/update/refresh${qs}`);
  }

  /** Trigger a full update (klipper + moonraker + system + web clients).
   *  Moonraker 0.10.0 (Jan 2026) consolidated the deprecated /machine/update/full,
   *  /machine/update/client, /machine/update/moonraker, /machine/update/klipper, and
   *  /machine/update/system endpoints into a single /machine/update/upgrade endpoint.
   *  Try the new endpoint first, fall back to /machine/update/full for older servers. */
  async triggerFullUpdate() {
    const ok = await this._apiPostStatus('/machine/update/upgrade');
    if (ok) return;
    return this._apiPost('/machine/update/full');
  }

  // POST wrapper that returns true on HTTP 2xx (for feature-detection of new endpoints).
  async _apiPostStatus(path, body) {
    const headers = { 'Content-Type': 'application/json', ...this._authHeaders() };
    try {
      const res = await fetch(`${this._baseUrl}${path}`, {
        method: 'POST',
        headers,
        body: body ? JSON.stringify(body) : undefined,
        signal: AbortSignal.timeout(5000),
      });
      return res.ok;
    } catch {
      return false;
    }
  }

  // ── Klipper input-shaper command surface ──
  // Small safety wrapper: only allow [XYZE] axis names through the gcode
  // script channel so callers can't inject arbitrary commands via the axis
  // parameter. Output names are also whitelisted.
  _validateAxis(axis) {
    if (!/^[XYZE]$/i.test(String(axis))) throw new Error(`invalid axis: ${axis}`);
    return String(axis).toUpperCase();
  }

  measureAxesNoise() {
    return this._apiPost('/printer/gcode/script', { script: 'MEASURE_AXES_NOISE' });
  }

  shaperCalibrate(axis) {
    const script = axis
      ? `SHAPER_CALIBRATE AXIS=${this._validateAxis(axis)}`
      : 'SHAPER_CALIBRATE';
    return this._apiPost('/printer/gcode/script', { script });
  }

  testResonances(axis, output = 'resonances') {
    const ax = this._validateAxis(axis);
    if (!/^[A-Za-z0-9_\-]+$/.test(output)) throw new Error(`invalid output name: ${output}`);
    return this._apiPost('/printer/gcode/script', {
      script: `TEST_RESONANCES AXIS=${ax} OUTPUT=${output}`,
    });
  }

  // ── Bed mesh data ──

  async getBedMeshProfiles() {
    const data = await this._apiGet('/printer/objects/query?bed_mesh');
    return data?.result?.status?.bed_mesh || null;
  }

  // ── Process stats (CPU/memory) ──

  async getProcessStats() {
    const data = await this._apiGet('/machine/proc_stats');
    return data?.result || null;
  }

  // ── System info ──

  async getSystemInfo() {
    const data = await this._apiGet('/machine/system_info');
    return data?.result?.system_info || null;
  }

  // ── Temperature history store ──

  async getTemperatureStore() {
    const data = await this._apiGet('/server/temperature_store');
    return data?.result || null;
  }

  // ── Service management ──

  async getServices() {
    const data = await this._apiGet('/machine/system_info');
    return data?.result?.system_info?.available_services || [];
  }

  // ── WLED strips ──

  async getWledStrips() {
    const data = await this._apiGet('/machine/wled/strips');
    return data?.result?.strips || {};
  }

  // ── Moonraker Power Devices ──

  async getPowerDevices() {
    const data = await this._apiGet('/machine/device_power/devices');
    return data?.result?.devices || [];
  }

  async setPowerDevice(device, action) {
    return this._apiPost(`/machine/device_power/device?device=${encodeURIComponent(device)}&action=${action}`);
  }

  async getPowerDeviceStatus(device) {
    const data = await this._apiGet(`/machine/device_power/device?device=${encodeURIComponent(device)}`);
    return data?.result?.[device] || null;
  }

  /**
   * Toggle a Moonraker power device (smart plug, GPIO, HomeAssistant switch).
   * Reads current state via /machine/device_power/device, flips it, and
   * issues the opposite action. Returns the new state, or null on failure.
   */
  async togglePowerDevice(device) {
    const current = await this.getPowerDeviceStatus(device);
    const action = current === 'on' ? 'off' : 'on';
    await this.setPowerDevice(device, action);
    return action;
  }

  // ── Klipper EXCLUDE_OBJECT surface (for skip-object during active print) ──

  /**
   * Skip an object during an active print by its name. Klipper exposes this
   * via the EXCLUDE_OBJECT G-code macro (requires [exclude_object] in
   * printer.cfg, which is the default in OrcaSlicer-configured Klipper).
   */
  excludeObject(name) {
    if (!name) return;
    return this._apiPost('/printer/gcode/script', { script: `EXCLUDE_OBJECT NAME=${name}` });
  }

  /** Skip an object by its numeric ID from `printer.objects.exclude_object`. */
  excludeObjectById(id) {
    if (id == null) return;
    return this._apiPost('/printer/gcode/script', { script: `EXCLUDE_OBJECT ID=${id}` });
  }

  /** Un-exclude all objects (useful if a user accidentally skipped one). */
  resetExcludedObjects() {
    return this._apiPost('/printer/gcode/script', { script: 'EXCLUDE_OBJECT RESET=1' });
  }

  // ── Firmware check (wraps update manager or Snapmaker wiki for U1) ──

  async checkFirmwareUpdate() {
    // Try Moonraker update_manager first
    try {
      const status = await this.getUpdateStatus();
      if (status?.version_info && Object.keys(status.version_info).length > 0) {
        const updates = [];
        for (const [pkg, info] of Object.entries(status.version_info)) {
          const current = info.version || info.installed_hash || '';
          const latest = info.remote_version || info.remote_hash || '';
          if (latest && current && latest !== current) {
            updates.push({
              module: pkg,
              current,
              latest,
              pendingCommits: info.pending_commits || 0,
            });
          }
        }
        if (updates.length > 0) {
          return { available: true, count: updates.length, updates, busy: status.busy || false };
        }
      }
    } catch {}

    // Detect Snapmaker U1 and fall back to wiki scraping
    try {
      const sysInfoRes = await this._apiGet('/printer/info');
      const sysInfo = sysInfoRes?.result || {};
      const swVer = sysInfo.software_version || '';
      const hostname = sysInfo.hostname || '';
      const isU1 = hostname === 'lava' || swVer.includes('lava') || swVer.match(/^1\.\d+\.\d+\.\d+_\d+/);

      if (isU1) {
        // Extract current version (e.g. "1.2.0.106_20260323113459" → "1.2.0")
        const m = swVer.match(/^(\d+)\.(\d+)\.(\d+)/);
        const current = m ? `${m[1]}.${m[2]}.${m[3]}` : swVer;

        // 1. Fetch latest STABLE release from Snapmaker wiki
        let latest = current;
        let releaseDate = '';
        let releaseUrl = 'https://wiki.snapmaker.com/en/snapmaker_u1/firmware/release_notes';
        try {
          const wikiRes = await fetch(releaseUrl, {
            signal: AbortSignal.timeout(8000),
            headers: { 'User-Agent': '3dprintforge' },
          });
          if (wikiRes.ok) {
            const html = await wikiRes.text();
            const versionMatch = html.match(/V(\d+\.\d+\.\d+)\s*\((\d{4}-\d{2}-\d{2})\)/);
            if (versionMatch) {
              latest = versionMatch[1];
              releaseDate = versionMatch[2];
            }
          }
        } catch {}
        const stableAvailable = _versionGt(latest, current);

        // 2. Fetch DEV commits from GitHub u1-klipper/u1-moonraker/u1-fluidd
        const devCommits = await this._fetchU1DevCommits(latest);

        return {
          available: stableAvailable,
          current,
          latest,
          releaseDate,
          releaseUrl,
          source: 'snapmaker-wiki',
          devCommitsAhead: devCommits.totalAhead,
          devCommits: devCommits.commits,
        };
      }
    } catch (e) {
      return { available: false, error: e.message };
    }

    // Brand-specific firmware fallback for non-U1 Moonraker printers
    try {
      const brandResult = await this._checkBrandFirmware();
      if (brandResult) return brandResult;
    } catch (e) {
      return { available: false, error: e.message };
    }

    return { available: false, reason: 'update_manager not configured and brand not recognized' };
  }

  async triggerFirmwareUpdate(pkg) {
    return this.triggerUpdate(pkg || 'klipper');
  }

  // Brand-specific firmware check via GitHub releases
  async _checkBrandFirmware() {
    const brand = this._printerBrand || this._guessBrand();
    if (!brand) return null;

    const repo = this._resolveBrandRepo(brand, this._printerModel);
    if (!repo) return null;
    const repos = [repo];

    // Get current Klipper version from printer.info
    let current = 'unknown';
    try {
      const info = await this._apiGet('/printer/info');
      current = info?.result?.software_version || 'unknown';
    } catch {}

    // Fetch latest GitHub release
    try {
      const repo = repos[0];
      const res = await fetch(`https://api.github.com/repos/${repo}/releases/latest`, {
        signal: AbortSignal.timeout(8000),
        headers: { 'Accept': 'application/vnd.github+json', 'User-Agent': '3dprintforge' },
      });
      if (!res.ok) {
        // Some repos use tags instead of releases
        const tagsRes = await fetch(`https://api.github.com/repos/${repo}/tags`, {
          signal: AbortSignal.timeout(8000),
          headers: { 'Accept': 'application/vnd.github+json', 'User-Agent': '3dprintforge' },
        });
        if (!tagsRes.ok) return { available: false, current, source: `${brand}-github`, reason: 'No releases or tags found' };
        const tags = await tagsRes.json();
        if (!Array.isArray(tags) || tags.length === 0) return { available: false, current, source: `${brand}-github` };
        const latest = tags[0]?.name || '';
        return {
          available: false, // Can't reliably compare Klipper version to vendor tag
          current,
          latest,
          source: `${brand}-github-tag`,
          reason: 'Brand firmware tracked via tags — manual verification recommended',
        };
      }
      const release = await res.json();
      const tag = (release.tag_name || '').replace(/^v/, '');
      return {
        available: false, // User must manually confirm brand firmware updates
        current,
        latest: tag,
        releaseUrl: release.html_url || `https://github.com/${repo}/releases`,
        releaseNotes: (release.body || '').slice(0, 2000),
        publishedAt: release.published_at,
        source: `${brand}-github`,
        reason: 'Brand firmware — compare versions manually',
      };
    } catch (e) {
      return { available: false, current, error: e.message, source: `${brand}-github` };
    }
  }

  // Heated-bed flatness deviation (mm), derived from the bed mesh matrix.
  //
  // Snapmaker U1 V1.3.0 does not expose a dedicated flatness object — verified
  // against a live printer's /printer/objects/list. Peak-to-peak across the
  // probed mesh is the authoritative reading and matches what Snapmaker Orca
  // reports on the wizard screen.
  //
  // Threshold mapping (matches Snapmaker wiki guidance):
  //   < 0.10 mm → ok
  //   < 0.30 mm → warn
  //   >= 0.30 mm → fail
  _extractFlatnessDeviation(status) {
    const mesh = status.bed_mesh?.mesh_matrix || this.state._bed_mesh?.meshMatrix;
    if (!Array.isArray(mesh) || mesh.length === 0 || !Array.isArray(mesh[0])) return null;

    let mn = Infinity, mx = -Infinity;
    for (const row of mesh) {
      for (const v of row) {
        if (typeof v === 'number' && Number.isFinite(v)) {
          if (v < mn) mn = v;
          if (v > mx) mx = v;
        }
      }
    }
    if (mn === Infinity || mx === -Infinity) return null;

    const dev = Math.round((mx - mn) * 1000) / 1000;
    const status_ = dev < 0.10 ? 'ok' : dev < 0.30 ? 'warn' : 'fail';
    return { deviation_mm: dev, source: 'derived', status: status_ };
  }

  // Resolve GitHub repo for firmware check based on brand + model.
  // QIDI and Elegoo ship per-model firmware repos rather than a single brand-wide repo.
  _resolveBrandRepo(brand, model) {
    const m = (model || '').toLowerCase();
    switch (brand) {
      case 'creality': return 'CrealityOfficial/Creality-Wiki';
      case 'elegoo':
        if (/centauri/.test(m)) return 'elegooofficial/CentauriCarbon';
        return 'Elegoo3DPrinters/Neptune-4';
      case 'voron': return 'VoronDesign/Voron-2';
      case 'anker':
      case 'ankermake': return 'Ankermgmt/ankermake-m5-protocol';
      case 'qidi':
        if (/max.?4/.test(m)) return 'QIDITECH/QIDI_MAX4';
        if (/plus.?4|x-plus.?4/.test(m)) return 'QIDITECH/QIDI_PLUS4';
        if (/max.?3|x-max.?3/.test(m)) return 'QIDITECH/QIDI_MAX3';
        if (/plus.?3|x-plus.?3/.test(m)) return 'QIDITECH/QIDI_PLUS3';
        if (/q1.?pro/.test(m)) return 'QIDITECH/Q1_PRO';
        return 'QIDITECH/QIDI_PLUS4';
      case 'ratrig': return 'RatOS/RatOS';
      default: return null;
    }
  }

  // Guess brand from Klipper hostname or software_version
  _guessBrand() {
    const model = (this._printerModel || '').toLowerCase();
    const swVer = (this.state?._klipper_state?.state_message || '').toLowerCase();
    const combined = `${model} ${swVer}`;
    if (/creality|k1|k2|ender/i.test(combined)) return 'creality';
    if (/elegoo|neptune/i.test(combined)) return 'elegoo';
    if (/voron|v0|v1|v2\.4|trident|phoenix|switchwire/i.test(combined)) return 'voron';
    if (/anker|m5/i.test(combined)) return 'anker';
    if (/qidi|x-plus|x-max|q1 pro/i.test(combined)) return 'qidi';
    if (/ratrig|ratos|v-core/i.test(combined)) return 'ratrig';
    return null;
  }

  // Fetch dev commits from Snapmaker U1 open-source repos since the last release
  async _fetchU1DevCommits(releaseVersion) {
    const repos = ['u1-klipper', 'u1-moonraker', 'u1-fluidd'];
    const result = { totalAhead: 0, commits: [] };

    for (const repo of repos) {
      try {
        // Fetch recent commits (first 30 on main)
        const res = await fetch(`https://api.github.com/repos/Snapmaker/${repo}/commits?per_page=30`, {
          signal: AbortSignal.timeout(8000),
          headers: { 'Accept': 'application/vnd.github+json', 'User-Agent': '3dprintforge' },
        });
        if (!res.ok) continue;
        const commits = await res.json();
        if (!Array.isArray(commits)) continue;

        // Find the release commit (marked with "Release firmware version X.X.X" or containing the version)
        const releasePattern = new RegExp(`Release firmware version ${releaseVersion.replace(/\./g, '\\.')}`, 'i');
        const releaseIdx = commits.findIndex(c => releasePattern.test(c.commit?.message || ''));

        // If release not found, check if any commit contains the version string
        const effectiveIdx = releaseIdx >= 0 ? releaseIdx :
          commits.findIndex(c => (c.commit?.message || '').includes(releaseVersion));

        const ahead = effectiveIdx >= 0 ? effectiveIdx : 0;
        result.totalAhead += ahead;

        // Collect commits ahead of release (exclude the release commit itself)
        const newCommits = commits.slice(0, ahead).map(c => ({
          repo,
          sha: c.sha?.slice(0, 8) || '',
          message: (c.commit?.message || '').split('\n')[0].slice(0, 120),
          author: c.commit?.author?.name || '',
          date: c.commit?.author?.date?.slice(0, 10) || '',
          url: c.html_url || '',
        }));
        result.commits.push(...newCommits);
      } catch { /* skip this repo */ }
    }

    // Sort newest first, keep max 20
    result.commits.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
    result.commits = result.commits.slice(0, 20);
    return result;
  }

  // ── Moonraker Announcements ──

  async getAnnouncements() {
    const data = await this._apiGet('/server/announcements/list');
    return data?.result?.entries || [];
  }

  // ── Moonraker Job History ──

  async getJobHistory(limit = 50) {
    const data = await this._apiGet(`/server/history/list?limit=${limit}`);
    return data?.result?.jobs || [];
  }

  async getJobTotals() {
    const data = await this._apiGet('/server/history/totals');
    return data?.result?.job_totals || null;
  }

  /** Fetch a single history entry by its uid. */
  async getHistoryJob(uid) {
    const data = await this._apiGet(`/server/history/job?uid=${encodeURIComponent(uid)}`);
    return data?.result?.job || null;
  }

  /** Delete a history entry by uid. Returns true on success. */
  async deleteHistoryJob(uid) {
    const r = await this._apiDelete(`/server/history/delete?uid=${encodeURIComponent(uid)}`);
    return !!r;
  }

  /** Reset accumulated job totals (lifetime filament/time stats). */
  async resetHistoryTotals() {
    return this._apiPost('/server/history/reset_totals');
  }

  // ── Moonraker Database ──

  async getDatabaseItem(namespace, key) {
    const path = key ? `/server/database/item?namespace=${namespace}&key=${key}` : `/server/database/item?namespace=${namespace}`;
    const data = await this._apiGet(path);
    return data?.result?.value ?? null;
  }

  async setDatabaseItem(namespace, key, value) {
    await this._apiPost('/server/database/item', { namespace, key, value });
  }

  async deleteDatabaseItem(namespace, key) {
    await this._apiDelete(`/server/database/item?namespace=${namespace}&key=${key}`);
  }

  async listDatabaseNamespaces() {
    const data = await this._apiGet('/server/database/list');
    return data?.result?.namespaces || [];
  }

  // ── Announcements ──

  async getAnnouncements() {
    const data = await this._apiGet('/server/announcements/list');
    return data?.result?.entries || [];
  }

  async dismissAnnouncement(entryId) {
    await this._apiPost(`/server/announcements/dismiss?entry_id=${entryId}`);
  }

  // ── GCode Store (terminal history) ──

  async getGcodeStore(count = 100) {
    const data = await this._apiGet(`/server/gcode_store?count=${count}`);
    return data?.result?.gcode_store || [];
  }

  // ── Peripherals ──

  async getUsbDevices() {
    const data = await this._apiGet('/machine/peripherals/usb');
    return data?.result?.usb_devices || [];
  }

  async getSerialDevices() {
    const data = await this._apiGet('/machine/peripherals/serial');
    return data?.result?.serial_devices || [];
  }

  async getVideoDevices() {
    const data = await this._apiGet('/machine/peripherals/video');
    return data?.result?.v4l_devices || [];
  }

  async getCanbusUuids(interface_ = 'can0') {
    const data = await this._apiGet(`/machine/peripherals/canbus?interface=${interface_}`);
    return data?.result?.can_uuids || [];
  }

  /**
   * Scan the CAN bus for unassigned Klipper/Katapult nodes (setup-UI helper).
   * Distinguishes between the three outcomes a user needs to know about:
   *   - ok=true: scan ran cleanly, uuids is the result list (may be empty)
   *   - arbitration_error: the bus has broken termination, no-ACK, or a
   *     single-node bus — the scan could not complete reliably
   *   - interface_not_found: the named can interface (can0, can1, ...) isn't
   *     configured on the host — user should check systemd-networkd / ifconfig
   *   - unreachable: Moonraker itself didn't respond (network / auth / timeout)
   */
  async scanCanbus(interface_ = 'can0') {
    const url = `${this._baseUrl}/machine/peripherals/canbus?interface=${encodeURIComponent(interface_)}`;
    try {
      const res = await fetch(url, {
        headers: this._authHeaders(),
        signal: AbortSignal.timeout(10000),
      });
      if (res.ok) {
        const data = await res.json();
        return {
          ok: true,
          interface: interface_,
          uuids: data?.result?.can_uuids || [],
          error: null,
        };
      }
      // Non-2xx: parse body for Moonraker's structured error message
      let message = `HTTP ${res.status}`;
      try {
        const body = await res.json();
        message = body?.error?.message || body?.message || message;
      } catch { /* non-JSON body */ }

      let code = 'http_error';
      if (/arbitration/i.test(message)) code = 'arbitration_error';
      else if (/interface.*not\s+found|no such (interface|device)/i.test(message)) code = 'interface_not_found';

      return {
        ok: false,
        interface: interface_,
        uuids: [],
        error: { code, message },
      };
    } catch (e) {
      return {
        ok: false,
        interface: interface_,
        uuids: [],
        error: { code: 'unreachable', message: e.message },
      };
    }
  }

  // ── File operations ──

  async createFileZip(files, destination) {
    const data = await this._apiPost('/server/files/zip', { items: files, dest: destination });
    return data?.result || null;
  }

  async metascanFile(filename) {
    await this._apiPost('/server/files/metascan', { filename });
  }

  async getFileThumbnails(filename) {
    const data = await this._apiGet(`/server/files/thumbnails?filename=${encodeURIComponent(filename)}`);
    return data?.result || [];
  }

  // ── Job Queue ──

  async jumpQueueJob(jobIds) {
    await this._apiPost('/server/job_queue/jump', { job_ids: jobIds });
  }

  // ── Log management ──

  async rolloverLogs() {
    await this._apiPost('/server/logs/rollover');
  }

  async getLogFiles() {
    const data = await this._apiGet('/server/logs/list');
    return data?.result?.logs || [];
  }

  // ── Notifiers (Apprise passthrough configured in moonraker.conf) ──

  async getNotifiers() {
    const data = await this._apiGet('/server/notifiers/list');
    return data?.result?.notifiers || [];
  }

  /**
   * Trigger a test notification through a configured notifier.
   * Useful for a "Test" button next to each notifier in the dashboard.
   */
  async testNotifier(name) {
    return this._apiPost(`/server/notifiers/test?name=${encodeURIComponent(name)}`);
  }

  // ── Spoolman integration (v2 response format — Moonraker 0.9+) ──

  async getSpoolmanStatus() {
    // v1 format still the canonical shape here — { spoolman_connected, pending_reports, spool_id }
    const data = await this._apiGet('/server/spoolman/status');
    return data?.result || null;
  }

  // Internal: proxy a request to Spoolman via Moonraker using v2 response envelope.
  // Returns { ok: boolean, data?: <spoolman_json>, error?: { status_code, message } }.
  // v2 separates Spoolman-side errors from Moonraker transport errors so callers can
  // distinguish "Spoolman disconnected" from "Moonraker unreachable".
  async _spoolmanProxy(method, path, body = null) {
    // Moonraker requires path to start with "/v1/" — paths starting with "/api/" are rejected.
    const query = new URLSearchParams({
      request_method: method,
      path,
      use_v2_response: 'true',
    }).toString();

    const res = body
      ? await this._apiPostRaw(`/server/spoolman/proxy?${query}`, body)
      : await this._apiGet(`/server/spoolman/proxy?${query}`);

    if (!res) return { ok: false, error: { status_code: 0, message: 'Moonraker unreachable' } };

    const envelope = res.result;
    if (envelope?.error) {
      return { ok: false, error: envelope.error };
    }
    return { ok: true, data: envelope?.response ?? null };
  }

  async getSpoolmanSpools() {
    const r = await this._spoolmanProxy('GET', '/v1/spool');
    return r.ok && Array.isArray(r.data) ? r.data : [];
  }

  async setSpoolmanActiveSpool(spoolId) {
    await this._apiPost('/server/spoolman/spool_id', { spool_id: spoolId });
  }

  async getSpoolmanActiveSpool() {
    const data = await this._apiGet('/server/spoolman/spool_id');
    return data?.result?.spool_id || null;
  }

  // POST variant that returns the parsed response (the default _apiPost discards it).
  async _apiPostRaw(path, body) {
    const headers = { 'Content-Type': 'application/json', ...this._authHeaders() };
    try {
      const r = await fetch(`${this._baseUrl}${path}`, {
        method: 'POST',
        headers,
        body: body ? JSON.stringify(body) : undefined,
        signal: AbortSignal.timeout(5000),
      });
      if (!r.ok) return null;
      return r.json();
    } catch (e) {
      log.error(`POST ${path}: ${e.message}`);
      return null;
    }
  }

  // ── Extensions ──

  async getExtensions() {
    const data = await this._apiGet('/server/extensions/list');
    return data?.result?.extensions || [];
  }

  async triggerUpdate(name) {
    // Moonraker 0.10.0+ prefers /machine/update/upgrade?name=<pkg>.
    // Fall back to per-package /machine/update/<name> for older servers.
    const ok = await this._apiPostStatus(`/machine/update/upgrade?name=${encodeURIComponent(name)}`);
    if (ok) return;
    return this._apiPost(`/machine/update/${name}`);
  }

  // ---- HTTP helpers ----

  async _apiGet(path) {
    const headers = this._authHeaders();
    try {
      const res = await fetch(`${this._baseUrl}${path}`, { headers, signal: AbortSignal.timeout(5000) });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    } catch (e) {
      log.error(`GET ${path}: ${e.message}`);
      return null;
    }
  }

  async _apiPost(path, body) {
    const headers = { 'Content-Type': 'application/json', ...this._authHeaders() };
    try {
      const res = await fetch(`${this._baseUrl}${path}`, {
        method: 'POST',
        headers,
        body: body ? JSON.stringify(body) : undefined,
        signal: AbortSignal.timeout(5000),
      });
      if (!res.ok) log.warn(`POST ${path}: HTTP ${res.status}`);
    } catch (e) {
      log.error(`POST ${path}: ${e.message}`);
    }
  }

  async _apiDelete(path) {
    const headers = this._authHeaders();
    try {
      const res = await fetch(`${this._baseUrl}${path}`, { method: 'DELETE', headers, signal: AbortSignal.timeout(5000) });
      if (!res.ok) log.warn(`DELETE ${path}: HTTP ${res.status}`);
      return res.ok;
    } catch (e) {
      log.error(`DELETE ${path}: ${e.message}`);
      return false;
    }
  }

  _wsSend(obj) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(obj));
    }
  }
}

// ---- Moonraker command builder (equivalent to mqtt-commands.js) ----

export function buildMoonrakerCommand(msg) {
  // Map client-facing actions to Moonraker actions
  const action = msg.action;
  switch (action) {
    case 'pause': return { _moonraker_action: 'pause' };
    case 'resume': return { _moonraker_action: 'resume' };
    case 'stop': return { _moonraker_action: 'stop' };
    case 'speed': return { _moonraker_action: 'speed', value: msg.value };
    case 'gcode': return { _moonraker_action: 'gcode', gcode: msg.gcode };
    case 'print_file': return { _moonraker_action: 'print_file', filename: msg.filename };
    case 'pushall': return { _moonraker_action: 'pushall' };
    case 'home': return { _moonraker_action: 'home' };
    case 'emergency_stop': return { _moonraker_action: 'emergency_stop' };
    case 'system_reboot': return { _moonraker_action: 'system_reboot' };
    case 'system_shutdown': return { _moonraker_action: 'system_shutdown' };
    case 'service_restart': return { _moonraker_action: 'service_restart', service: msg.service };
    case 'service_stop': return { _moonraker_action: 'service_stop', service: msg.service };
    case 'power_on': return { _moonraker_action: 'power_on', device: msg.device };
    case 'power_off': return { _moonraker_action: 'power_off', device: msg.device };
    case 'wled_on': return { _moonraker_action: 'wled_on', strip: msg.strip };
    case 'wled_off': return { _moonraker_action: 'wled_off', strip: msg.strip };
    case 'wled_preset': return { _moonraker_action: 'wled_preset', strip: msg.strip, preset: msg.preset };
    case 'light': return { _moonraker_action: 'light', mode: msg.mode };
    case 'sm_feed_auto': return { _moonraker_action: 'sm_feed_auto', channel: msg.channel };
    case 'sm_feed_manual': return { _moonraker_action: 'sm_feed_manual', channel: msg.channel };
    case 'sm_feed_unload': return { _moonraker_action: 'sm_feed_unload', channel: msg.channel };
    case 'sm_defect_config': return { _moonraker_action: 'sm_defect_config', enable: msg.enable };
    case 'sm_defect_config_detail': return { _moonraker_action: 'sm_defect_config_detail', detector: msg.detector, enable: msg.enable, sensitivity: msg.sensitivity };
    case 'sm_timelapse_start': return { _moonraker_action: 'sm_timelapse_start' };
    case 'sm_timelapse_stop': return { _moonraker_action: 'sm_timelapse_stop' };
    case 'sm_timelapse_frame': return { _moonraker_action: 'sm_timelapse_frame' };
    case 'sm_flow_calibrate': return { _moonraker_action: 'sm_flow_calibrate' };
    case 'sm_set_print_config': return { _moonraker_action: 'sm_set_print_config', ...msg };
    // 2025–2026 additions
    case 'power_toggle': return { _moonraker_action: 'power_toggle', device: msg.device };
    case 'service_start': return { _moonraker_action: 'service_start', service: msg.service };
    case 'exclude_object':
      if (msg.reset) return { _moonraker_action: 'exclude_object_reset' };
      if (msg.id != null) return { _moonraker_action: 'exclude_object_id', id: msg.id };
      return { _moonraker_action: 'exclude_object_name', name: msg.name };
    case 'canbus_scan': return { _moonraker_action: 'canbus_scan', interface: msg.interface || 'can0' };
    case 'update_refresh': return { _moonraker_action: 'update_refresh', name: msg.name };
    case 'update_full': return { _moonraker_action: 'update_full' };
    case 'notifier_test': return { _moonraker_action: 'notifier_test', name: msg.name };
    case 'history_reset_totals': return { _moonraker_action: 'history_reset_totals' };
    case 'history_delete': return { _moonraker_action: 'history_delete', uid: msg.uid };
    case 'input_shaper_measure': return { _moonraker_action: 'input_shaper_measure' };
    case 'input_shaper_calibrate': return { _moonraker_action: 'input_shaper_calibrate', axis: msg.axis };
    case 'input_shaper_test': return { _moonraker_action: 'input_shaper_test', axis: msg.axis, output: msg.output };
    default: return { _moonraker_action: action, ...msg };
  }
}
