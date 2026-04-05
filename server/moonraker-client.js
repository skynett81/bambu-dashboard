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
import { getExtruderSlots } from './db/printers.js';
import { mapSmState, mapFeedState, argbToHex } from './snapmaker-state-map.js';

const log = createLogger('moonraker');

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
    this.apiKey = config.printer.accessCode || '';
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

  _connectWebSocket() {
    if (this.ws) {
      this.ws.removeAllListeners();
      this.ws.close();
    }

    const headers = {};
    if (this.apiKey) headers['X-Api-Key'] = this.apiKey;

    this.ws = new WebSocket(this._wsUrl, { headers, rejectUnauthorized: false });

    this.ws.on('open', () => {
      this.connected = true;
      log.info(`Moonraker WebSocket connected: ${this.ip}`);
      this.hub.broadcast('connection', { status: 'connected' });
      this._subscribe();
      this._requestFullState();
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

  // ---- WebSocket subscription ----

  _subscribe() {
    // Subscribe to printer object updates via Moonraker JSON-RPC
    const objects = {
      'print_stats': null,
      'display_status': null,
      'heater_bed': null,
      'extruder': null,
      'extruder1': null,
      'extruder2': null,
      'extruder3': null,
      'fan': null,
      'toolhead': null,
      'gcode_move': null,
      'motion_report': null,
      'heaters': null,
      'system_stats': null,
      'webhooks': null,
      'idle_timeout': null,
      'virtual_sdcard': null,
      'fan_generic cavity_fan': null,
      'temperature_sensor cavity': null,
      'purifier': null,
      'exclude_object': null,
      // Snapmaker U1 specific (silently ignored on non-SM printers)
      'machine_state_manager': null,
      'filament_detect': null,
      'filament_feed left': null,
      'filament_feed right': null,
      'filament_entangle_detect e0_filament': null,
      'filament_entangle_detect e1_filament': null,
      'filament_entangle_detect e2_filament': null,
      'filament_entangle_detect e3_filament': null,
      'defect_detection': null,
      'timelapse': null,
      'print_task_config': null,
      'power_loss_check': null,
      'flow_calibrator': null,
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
      const [info, status, history] = await Promise.all([
        this._apiGet('/printer/info'),
        this._apiGet('/printer/objects/query?print_stats&display_status&heater_bed&extruder&extruder1&extruder2&extruder3&fan&toolhead&gcode_move&virtual_sdcard&idle_timeout&system_stats&fan_generic%20cavity_fan&temperature_sensor%20cavity&purifier&exclude_object&machine_state_manager&filament_detect&filament_feed%20left&filament_feed%20right&defect_detection&timelapse&print_task_config&power_loss_check&flow_calibrator'),
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

      log.info(`Slicer metadata hentet for ${filename}`);
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

    // Multi-extruder support (Snapmaker U1 has up to 4)
    // Merge into existing _extra_extruders (WS only sends changed fields)
    if (!this.state._extra_extruders) this.state._extra_extruders = [];
    const extras = [ext1, ext2, ext3];
    for (let i = 0; i < extras.length; i++) {
      const ex = extras[i];
      if (ex?.temperature !== undefined) {
        this.state._extra_extruders[i] = {
          ...(this.state._extra_extruders[i] || {}),
          temperature: Math.round(ex.temperature),
          target: Math.round(ex.target || 0),
          state: ex.state || this.state._extra_extruders[i]?.state || null,
          switch_count: ex.switch_count ?? this.state._extra_extruders[i]?.switch_count ?? 0,
          pressure_advance: ex.pressure_advance ?? this.state._extra_extruders[i]?.pressure_advance ?? null,
        };
      }
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

    // Error state
    if (ps.state === 'error' && ps.message) {
      this.state.print_error = 1;
      this.state.print_error_msg = ps.message;
    } else if (ps.state !== 'error') {
      this.state.print_error = 0;
      this.state.print_error_msg = '';
    }

    // Message (display)
    if (ds.message) this.state._display_message = ds.message;

    // Cavity fan (enclosure fan)
    const cavFan = status['fan_generic cavity_fan'];
    if (cavFan?.speed !== undefined) {
      this.state._cavity_fan_speed = Math.round((cavFan.speed || 0) * 100);
    }

    // Cavity temperature sensor
    const cavTemp = status['temperature_sensor cavity'];
    if (cavTemp?.temperature !== undefined) {
      this.state.chamber_temper = Math.round(cavTemp.temperature);
    }

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
        const data = {
          vendor: ch.VENDOR || '',
          manufacturer: ch.MANUFACTURER || '',
          type: ch.MAIN_TYPE || '',
          subType: ch.SUB_TYPE || '',
          color: argbToHex(ch.ARGB_COLOR),
          colorArgb: ch.ARGB_COLOR,
          weight: ch.WEIGHT || 0,
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
        };
        // Persist to DB cache (fire-and-forget)
        try {
          import('./db/snapmaker.js').then(({ upsertNfcFilament }) => {
            upsertNfcFilament(this._printerId, idx, data);
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

    // Filament entangle detection
    for (let i = 0; i < 4; i++) {
      const fed = status[`filament_entangle_detect e${i}_filament`];
      if (fed) {
        if (!this.state._sm_entangle) this.state._sm_entangle = {};
        this.state._sm_entangle[`e${i}`] = { detectFactor: fed.detect_factor };
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
    }

    // Timelapse
    const tl = status.timelapse;
    if (tl) {
      this.state._sm_timelapse = { active: tl.is_active };
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

  // ---- Extended firmware detection (paxx12) ----

  async _detectExtendedFirmware() {
    // Check if v4l2-mpp camera streamer is available (extended firmware feature)
    const ports = [8080, 8081];
    for (const port of ports) {
      try {
        const res = await fetch(`http://${this.ip}:${port}/snapshot`, { signal: AbortSignal.timeout(2000) });
        if (res.ok) {
          const ct = res.headers.get('content-type') || '';
          if (ct.includes('image')) {
            this._extendedFirmware = true;
            this._v4l2MppPort = port;
            this.state._extended_firmware = true;
            this.state._v4l2_mpp_port = port;
            log.info(`Detected extended firmware (v4l2-mpp camera on port ${port})`);
            return;
          }
        }
      } catch { /* not available */ }
    }
    // Check for WebRTC endpoint (v4l2-mpp stream-webrtc)
    try {
      const res = await fetch(`http://${this.ip}:8081/`, { signal: AbortSignal.timeout(2000) });
      if (res.ok) {
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

    const headers = { 'Content-Type': `multipart/form-data; boundary=${boundary}`, 'Content-Length': body.length };
    if (this.apiKey) headers['X-Api-Key'] = this.apiKey;

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

    const headers = { 'Content-Type': `multipart/form-data; boundary=${boundary}`, 'Content-Length': body.length };
    if (this.apiKey) headers['X-Api-Key'] = this.apiKey;

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

  // ---- Moonraker Update Manager ----

  async getUpdateStatus() {
    const data = await this._apiGet('/machine/update/status');
    return data?.result || null;
  }

  async triggerUpdate(name) {
    return this._apiPost(`/machine/update/${name}`);
  }

  // ---- HTTP helpers ----

  async _apiGet(path) {
    const headers = {};
    if (this.apiKey) headers['X-Api-Key'] = this.apiKey;
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
    const headers = { 'Content-Type': 'application/json' };
    if (this.apiKey) headers['X-Api-Key'] = this.apiKey;
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
    const headers = {};
    if (this.apiKey) headers['X-Api-Key'] = this.apiKey;
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
    case 'light': return { _moonraker_action: 'light', mode: msg.mode };
    case 'sm_feed_auto': return { _moonraker_action: 'sm_feed_auto', channel: msg.channel };
    case 'sm_feed_manual': return { _moonraker_action: 'sm_feed_manual', channel: msg.channel };
    case 'sm_feed_unload': return { _moonraker_action: 'sm_feed_unload', channel: msg.channel };
    case 'sm_defect_config': return { _moonraker_action: 'sm_defect_config', enable: msg.enable };
    case 'sm_timelapse_start': return { _moonraker_action: 'sm_timelapse_start' };
    case 'sm_timelapse_stop': return { _moonraker_action: 'sm_timelapse_stop' };
    case 'sm_timelapse_frame': return { _moonraker_action: 'sm_timelapse_frame' };
    case 'sm_flow_calibrate': return { _moonraker_action: 'sm_flow_calibrate' };
    case 'sm_set_print_config': return { _moonraker_action: 'sm_set_print_config', ...msg };
    default: return { _moonraker_action: action, ...msg };
  }
}
