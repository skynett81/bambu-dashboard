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
      // Klipper diagnostic objects (silently ignored if not available)
      'bed_mesh': null,
      'mcu': null,
      'tmc2209 stepper_x': null,
      'tmc2209 stepper_y': null,
      'tmc2240 stepper_x': null,
      'tmc2240 stepper_y': null,
      'filament_switch_sensor runout': null,
      'filament_switch_sensor filament_sensor': null,
      'temperature_fan controller_fan': null,
      'temperature_fan exhaust_fan': null,
      'fan_generic nevermore_internal': null,
      'temperature_sensor mcu_temp': null,
      'temperature_sensor raspberry_pi': null,
      // ERCF/AFC multi-filament (Voron community)
      'ercf': null,
      'afc': null,
      // Voron/Klipper extras (silently ignored if not available)
      'probe': null,
      'z_thermal_adjust': null,
      'firmware_retraction': null,
      'respond': null,
      'quad_gantry_level': null,
      'screws_tilt_adjust': null,
      'z_tilt': null,
      'input_shaper': null,
      'manual_probe': null,
      'neopixel sb_leds': null,
      'neopixel my_neopixel': null,
      'led chamber_led': null,
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
      'park_detector t0': null,
      'park_detector t1': null,
      'park_detector t2': null,
      'park_detector t3': null,
      'adc_current_sensor heater_bed': null,
      'adc_current_sensor extruder': null,
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

    // Park detector — which extruder is active vs parked (U1 toolchanger)
    const parkState = {};
    for (let i = 0; i < 4; i++) {
      const pd = status[`park_detector t${i}`];
      if (pd) {
        parkState[`t${i}`] = {
          parked: pd.park_state === 'PARKED',
          active: pd.park_state === 'ACTIVATE',
          state: pd.park_state || 'UNKNOWN',
        };
      }
    }
    if (Object.keys(parkState).length > 0) {
      this.state._sm_park = parkState;
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

    // MCU health
    const mcu = status.mcu;
    if (mcu) {
      this.state._mcu = {
        lastStats: mcu.last_stats || {},
        mcuVersion: mcu.mcu_version || '',
        mcuBuild: mcu.mcu_build_versions || '',
      };
    }
    // MCU temperature sensors
    for (const key of ['mcu_temp', 'raspberry_pi']) {
      const ts = status[`temperature_sensor ${key}`];
      if (ts) {
        if (!this.state._system_temps) this.state._system_temps = {};
        this.state._system_temps[key] = { temp: Math.round((ts.temperature || 0) * 10) / 10 };
      }
    }

    // TMC driver diagnostics
    for (const driver of ['tmc2209 stepper_x', 'tmc2209 stepper_y', 'tmc2240 stepper_x', 'tmc2240 stepper_y']) {
      const tmc = status[driver];
      if (tmc) {
        if (!this.state._tmc) this.state._tmc = {};
        const name = driver.split(' ')[1];
        this.state._tmc[name] = {
          temperature: tmc.temperature,
          run_current: tmc.run_current,
          hold_current: tmc.hold_current,
        };
      }
    }

    // Filament switch sensor (runout detection)
    for (const sensorName of ['runout', 'filament_sensor']) {
      const fss = status[`filament_switch_sensor ${sensorName}`];
      if (fss) {
        this.state._filament_sensor = {
          name: sensorName,
          enabled: fss.enabled,
          detected: fss.filament_detected,
        };
      }
    }

    // Temperature-controlled fans
    for (const fanName of ['controller_fan', 'exhaust_fan']) {
      const tf = status[`temperature_fan ${fanName}`];
      if (tf) {
        if (!this.state._temp_fans) this.state._temp_fans = {};
        this.state._temp_fans[fanName] = {
          speed: Math.round((tf.speed || 0) * 100),
          temperature: Math.round((tf.temperature || 0) * 10) / 10,
          target: Math.round((tf.target || 0) * 10) / 10,
        };
      }
    }

    // Nevermore filter (Voron community)
    const nevermore = status['fan_generic nevermore_internal'];
    if (nevermore) {
      this.state._nevermore = { speed: Math.round((nevermore.speed || 0) * 100) };
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

    // LED / Neopixel state
    for (const ledKey of ['neopixel sb_leds', 'neopixel my_neopixel', 'led chamber_led']) {
      const led = status[ledKey];
      if (led) {
        if (!this.state._leds) this.state._leds = {};
        const name = ledKey.split(' ')[1] || ledKey;
        this.state._leds[name] = {
          colorData: led.color_data || [],
        };
      }
    }

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

  // ── Power device management ──

  async getPowerDevices() {
    const data = await this._apiGet('/machine/device_power/devices');
    return data?.result?.devices || [];
  }

  async getPowerDeviceStatus(device) {
    const data = await this._apiGet(`/machine/device_power/device?device=${encodeURIComponent(device)}`);
    return data?.result || null;
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
    default: return { _moonraker_action: action, ...msg };
  }
}
