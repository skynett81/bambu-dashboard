import mqtt from 'mqtt';
import { createHash } from 'node:crypto';
import { createLogger } from './logger.js';
const log = createLogger('mqtt');

// Map a Bambu serial-number prefix to a printer model descriptor.
// Community reverse-engineering (OpenBambuAPI, ha-bambulab) has stable
// mappings for the 2023–2026 line-up. Returns { id, label, nozzleCount,
// dualNozzle, amsDefault } so the dashboard can pick the right UI variant.
//
// `infoModule` is optional: an array of {name, product_name, ...} from
// the printer's MQTT info report. When provided we refine the
// serial-prefix guess against the printer's self-reported model name —
// this is the only reliable way to distinguish H2D vs H2D Pro since
// they ship under similar serial ranges.
export function detectBambuModel(serial, infoModule = null) {
  const s = typeof serial === 'string' ? serial.toUpperCase() : '';
  const prefix = s.length >= 3 ? s.slice(0, 3) : '';
  const MAP = {
    '00M': { id: 'x1c',       label: 'X1 Carbon', nozzleCount: 1, dualNozzle: false, amsDefault: 'ams' },
    '03W': { id: 'x1e',       label: 'X1E',       nozzleCount: 1, dualNozzle: false, amsDefault: 'ams' },
    '01P': { id: 'p1p',       label: 'P1P',       nozzleCount: 1, dualNozzle: false, amsDefault: 'ams' },
    '01S': { id: 'p1s',       label: 'P1S',       nozzleCount: 1, dualNozzle: false, amsDefault: 'ams' },
    '039': { id: 'a1',        label: 'A1',        nozzleCount: 1, dualNozzle: false, amsDefault: 'ams_lite' },
    '030': { id: 'a1_mini',   label: 'A1 mini',   nozzleCount: 1, dualNozzle: false, amsDefault: 'ams_lite' },
    '094': { id: 'p2s',       label: 'P2S',       nozzleCount: 1, dualNozzle: false, amsDefault: 'ams_lite' },
    '095': { id: 'p2s',       label: 'P2S',       nozzleCount: 1, dualNozzle: false, amsDefault: 'ams_lite' },
    '0CM': { id: 'h2d',       label: 'H2D',       nozzleCount: 2, dualNozzle: true,  amsDefault: 'ams_2_pro' },
    '0CE': { id: 'h2d_pro',   label: 'H2D Pro',   nozzleCount: 2, dualNozzle: true,  amsDefault: 'ams_2_pro' },
    '0CS': { id: 'h2s',       label: 'H2S',       nozzleCount: 1, dualNozzle: false, amsDefault: 'ams_2_pro' },
    '0CC': { id: 'h2c',       label: 'H2C',       nozzleCount: 7, dualNozzle: false, amsDefault: 'vortek' },
  };
  let detected = MAP[prefix] || { id: 'unknown', label: 'Unknown' };

  // Refine via printer-reported product_name on the main controller
  // module — H2D Pro and H2D may share a serial prefix range, so we
  // override based on what the firmware self-reports.
  if (Array.isArray(infoModule)) {
    for (const m of infoModule) {
      const pn = String(m?.product_name || '').toLowerCase();
      if (!pn) continue;
      if (pn.includes('h2d pro')) {
        return { id: 'h2d_pro', label: 'H2D Pro', nozzleCount: 2, dualNozzle: true, amsDefault: 'ams_2_pro' };
      }
      if (pn === 'h2d' || pn.endsWith(' h2d')) {
        return { id: 'h2d', label: 'H2D', nozzleCount: 2, dualNozzle: true, amsDefault: 'ams_2_pro' };
      }
      if (pn === 'h2s' || pn.endsWith(' h2s')) {
        return { id: 'h2s', label: 'H2S', nozzleCount: 1, dualNozzle: false, amsDefault: 'ams_2_pro' };
      }
      if (pn === 'h2c' || pn.endsWith(' h2c')) {
        return { id: 'h2c', label: 'H2C', nozzleCount: 7, dualNozzle: false, amsDefault: 'vortek' };
      }
    }
  }
  return detected;
}

// Detect AMS hardware model from info.module entry (hw_ver + product_name).
// Returns one of: 'ams_2_pro', 'ams_ht', 'ams_lite', 'ams', 'unknown'.
// Sources: greghesp/ha-bambulab#1256 (N3F05 = AMS 2 Pro), OpenBambuAPI mqtt.md.
export function detectAmsModel(hwVer, productName) {
  const hv = String(hwVer || '').toUpperCase();
  const pn = String(productName || '').toLowerCase();

  if (hv.startsWith('N3F05') || pn.includes('ams 2 pro')) return 'ams_2_pro';
  if (hv.startsWith('AHT') || pn.includes('ams ht')) return 'ams_ht';
  if (pn.includes('ams lite') || hv.startsWith('AMS_F')) return 'ams_lite';
  if (hv.startsWith('AMS') || /^ams(\s|\(|$)/.test(pn)) return 'ams';
  return 'unknown';
}

// Classify an MQTT connection error. Returns { status, hint } for auth errors, null otherwise.
// Bambu Authorization Control System (rolled out 2025) requires either a valid
// Bambu Connect-signed request OR LAN-only Developer Mode. Third-party clients
// must enable Developer Mode on the printer to retain full control.
export function classifyMqttError(err) {
  if (!err) return null;
  const msg = String(err.message || '').toLowerCase();
  const code = err.code;

  const isAuth =
    msg.includes('not authorized') ||
    msg.includes('bad user name') ||
    msg.includes('bad username') ||
    msg.includes('bad password') ||
    code === 4 || // MQTT 3.1.1 CONNACK: Bad user name or password
    code === 5;   // MQTT 3.1.1 CONNACK: Not authorized

  if (!isAuth) return null;

  return {
    status: 'auth_error',
    message: err.message || 'MQTT authentication failed',
    hint: 'Check your access code, or enable LAN-only Developer Mode on the printer (Settings → General → LAN Only → Developer Mode) — required by the Bambu Authorization Control System for third-party clients.',
  };
}

export class BambuMqttClient {
  constructor(config, hub) {
    this.ip = config.printer.ip;
    this.serial = config.printer.serial;
    this.accessCode = config.printer.accessCode;
    this.developerMode = !!config.printer.developerMode;
    this.hub = hub;
    this.client = null;
    this.state = {};
    this.seqId = 0;
    this.connected = false;
    this.onFirmwareInfo = null;
    this.onXcamEvent = null;
    this._lastFirmwareVersions = {};
    this._lastXcamStatus = null;
    this._printerConfig = config.printer;
    this._authErrorBroadcast = false;

    // Pre-populate printer-model descriptor so the UI knows immediately
    // whether this is a dual-nozzle H2D, a 7-nozzle H2C Vortek, etc.,
    // without waiting for the first MQTT payload.
    this.state._printer_model = detectBambuModel(this.serial);
  }

  // Handle a classified auth error: broadcast once until reset.
  _handleAuthError(err) {
    const classified = classifyMqttError(err);
    if (!classified) return;
    if (this._authErrorBroadcast) return;
    this._authErrorBroadcast = true;
    log.error(`Bambu auth error: ${classified.message}`);
    log.error(`Hint: ${classified.hint}`);
    this.hub?.broadcast?.('connection', {
      ...classified,
      vendor: 'bambu',
    });
  }

  connect() {
    const url = `mqtts://${this.ip}:8883`;
    log.info(`Connecting to ${url}...`);
    // Bambu Lab printers use self-signed certificates — TLS verification
    // cannot be enabled without breaking connectivity. This is a known
    // limitation of the Bambu Lab protocol.

    if (!this.developerMode) {
      log.warn('Bambu Authorization Control System (2025) requires LAN-only Developer Mode for reliable third-party control. Enable it: printer Settings → General → LAN Only → Developer Mode, then set "developerMode": true in the printer config to silence this warning.');
    }

    // TOFU cert pinning: store fingerprint on first connect, verify on subsequent
    const pinnedFp = this._printerConfig.certFingerprint || null;

    // Explicit, stable client-id keeps Bambu's per-account connection cap
    // diagnostics clear (avoid library-generated random IDs and the flagged
    // `nodered_*` prefix). Also ensures reconnects reuse the same session.
    const clientId = `3dprintforge-${this.serial}`;

    this.client = mqtt.connect(url, {
      clientId,
      username: 'bblp',
      password: this.accessCode,
      rejectUnauthorized: false, // Required: Bambu printers use self-signed certs
      keepalive: 30,
      reconnectPeriod: 5000,
      connectTimeout: 10000
    });

    this.client.on('connect', () => {
      this.connected = true;
      log.info('Connected to printer');

      // TOFU cert fingerprint verification (after TLS handshake is complete)
      try {
        const stream = this.client.stream;
        const cert = stream?.getPeerCertificate?.();
        if (cert?.fingerprint256) {
          const fp = cert.fingerprint256;
          if (pinnedFp && pinnedFp !== fp) {
            log.error(`TLS cert fingerprint mismatch! Expected: ${pinnedFp.slice(0, 20)}... Got: ${fp.slice(0, 20)}...`);
            log.error('Possible MITM attack — disconnecting. Remove certFingerprint from printer config to re-pin.');
            this.client.end(true);
            return;
          }
          if (!pinnedFp) {
            log.info('TOFU: Pinning printer TLS cert fingerprint: ' + fp.slice(0, 20) + '...');
            if (this.onCertPinned) this.onCertPinned(fp);
          }
        }
      } catch (e) {
        log.warn('Could not verify TLS cert: ' + e.message);
      }

      const topic = `device/${this.serial}/report`;
      this.client.subscribe(topic, (err) => {
        if (err) {
          log.error('Subscription error: ' + err.message);
        } else {
          log.info(`Subscribing to ${topic}`);
          this._requestFullState();
        }
      });

      this.hub.broadcast('connection', { status: 'connected' });
    });

    this.client.on('message', (topic, payload) => {
      try {
        const msg = JSON.parse(payload.toString());
        this._handleMessage(msg);
        // MQTT debug: broadcast raw message to debug subscribers
        if (this.hub?.broadcastMqttDebug) {
          this.hub.broadcastMqttDebug(this.serial, 'in', topic, payload.toString().substring(0, 8000));
        }
      } catch (e) {
        // Binary or non-JSON message, ignore
      }
    });

    this.client.on('error', (err) => {
      log.error('Error: ' + err.message);
      this._handleAuthError(err);
    });

    this.client.on('close', () => {
      if (this.connected) {
        log.info('Disconnected — reconnecting...');
        this.connected = false;
        this.hub.broadcast('connection', { status: 'disconnected' });
      }
    });

    this.client.on('reconnect', () => {
      log.info('Reconnecting...');
    });
  }

  sendCommand(commandObj) {
    if (!this.client || !this.connected) return;
    const topic = `device/${this.serial}/request`;
    this.client.publish(topic, JSON.stringify(commandObj));
  }

  disconnect() {
    if (this.client) {
      this.client.end(true);
      this.client = null;
      this.connected = false;
    }
  }

  // Check firmware update status from Bambu upgrade_state (already reported via MQTT)
  async checkFirmwareUpdate() {
    // Helper: extract current OTA version from local MQTT info module
    const getCurrentOta = () => {
      // state._info is the result of deepMerge on msg.info which has shape { module: [...] }
      const modules = this.state._info?.module || this.state.info?.module || [];
      if (!Array.isArray(modules)) return '';
      const ota = modules.find(m => m?.name === 'ota');
      if (ota?.sw_ver) return ota.sw_ver;
      // Try 'esp32' / 'rv1126' which are common Bambu main board names
      const main = modules.find(m => ['esp32', 'rv1126', 'mc'].includes(m?.name));
      if (main?.sw_ver) return main.sw_ver;
      // Fallback: first module's sw_ver
      return modules[0]?.sw_ver || '';
    };

    // Request fresh firmware/hardware version from printer via MQTT
    if (this.connected) {
      try {
        this.sendCommand({ info: { sequence_id: String(this.seqId++), command: 'get_version' } });
      } catch {}
    }

    // Check MQTT-reported upgrade_state first (printer knows about pending update)
    const upg = this.state._upgrade;
    let current = getCurrentOta();
    if (upg && upg.newVersion && upg.newVersion !== current) {
      return {
        available: true,
        current: current || 'unknown',
        latest: upg.newVersion,
        status: upg.status,
        message: upg.message,
        forceUpgrade: upg.forceUpgrade,
        source: 'mqtt',
      };
    }

    // Fall back to Bambu Cloud API if available
    if (this._bambuCloud?.isAuthenticated?.()) {
      try {
        const resp = await this._bambuCloud.getDeviceVersion();
        // Response format: { message: "success", devices: [{ dev_id, firmware: [{ version, name, ... }], ... }] }
        const devices = Array.isArray(resp?.devices) ? resp.devices : [];
        const myDevice = devices.find(d => d?.dev_id === this.serial || d?.dev_id === this.serial?.toUpperCase());
        if (myDevice) {
          // firmware array contains modules — find ota/latest entry
          const modules = Array.isArray(myDevice.firmware) ? myDevice.firmware : [];
          const ota = modules.find(m => m?.name === 'ota' || m?.type === 'firmware') || modules[0];
          const latestVersion = ota?.version || ota?.latest_version || myDevice.latest_version;
          const currentVersion = myDevice.firmware_version || current || '';
          if (latestVersion && currentVersion && latestVersion !== currentVersion) {
            return {
              available: true,
              current: currentVersion,
              latest: latestVersion,
              releaseNotes: ota?.description || '',
              source: 'bambu-cloud',
            };
          }
          if (currentVersion) current = currentVersion;
        }
      } catch (e) {
        // Cloud check failed — continue with MQTT-only result
      }
    }

    return { available: false, current: current || 'unknown' };
  }

  // Allow injecting Bambu Cloud client for firmware checks
  setBambuCloud(cloud) { this._bambuCloud = cloud; }

  // Trigger firmware update via MQTT
  // NOTE: Bambu firmware updates cannot reliably be triggered from third-party LAN clients.
  // The upgrade.start command requires a pre-authorized firmware URL from Bambu Cloud
  // which is only obtained through Bambu Handy / Studio or the printer's own screen.
  // This method returns instructions for the user instead of silently failing.
  async triggerFirmwareUpdate() {
    return {
      ok: false,
      requiresManualUpdate: true,
      message: 'Bambu Lab firmware updates must be initiated from the printer itself or from Bambu Handy/Studio. This is a Bambu Lab limitation, not a 3DPrintForge one.',
      instructions: [
        'Open Bambu Handy on your phone, or Bambu Studio on your computer',
        'Go to Device → Settings → Firmware Update',
        'Or: on the printer itself, tap Settings → General → Firmware Update',
        'After updating, click "Recheck" here to clear the badge'
      ]
    };
  }

  // Camera — Bambu uses RTSPS stream handled by camera-stream.js
  // This provides a snapshot URL for the /frame.jpeg endpoint
  getSnapshotUrl() {
    return null; // Camera handled via separate RTSP→MPEG1 pipeline
  }

  async getCameraFrame() {
    return null; // Camera frames served via WebSocket, not HTTP
  }

  // File listing — Bambu uses FTPS, handled by thumbnail-service
  async listFiles() {
    return []; // File management via FTPS in file-parser.js
  }

  _requestFullState() {
    this.sendCommand({
      pushing: {
        sequence_id: String(this.seqId++),
        command: 'pushall'
      }
    });

    // Request firmware/hardware version info
    this.sendCommand({
      info: {
        sequence_id: String(this.seqId++),
        command: 'get_version'
      }
    });
  }

  _handleMessage(msg) {
    let updated = false;

    // print: temps, AMS, progress, fans, lights, WiFi, camera, speed, errors
    if (msg.print) {
      this.state = this._deepMerge(this.state, msg.print);
      updated = true;
    }

    // info: firmware version, device capabilities, model info
    if (msg.info) {
      this.state._info = this._deepMerge(this.state._info || {}, msg.info);
      updated = true;

      // Detect firmware changes + build AMS hardware model map (AMS 2 Pro, AMS HT, etc.)
      if (msg.info.module && Array.isArray(msg.info.module)) {
        // Refine printer-model detection using firmware-reported product_name —
        // necessary to disambiguate H2D vs H2D Pro and to upgrade an
        // 'unknown' detection when the serial prefix is new.
        const refined = detectBambuModel(this.serial, msg.info.module);
        if (refined && refined.id !== 'unknown') {
          this.state._printer_model = refined;
        }
        if (this.onFirmwareInfo) {
          for (const mod of msg.info.module) {
            if (!mod.name || !mod.sw_ver) continue;
            const key = `${mod.name}_${mod.sw_ver}`;
            if (!this._lastFirmwareVersions[key]) {
              this._lastFirmwareVersions[key] = true;
              this.onFirmwareInfo(mod);
            }
          }
        }
        // Expose AMS hardware identification for per-unit UI hints / capability detection.
        const amsModules = msg.info.module.filter(m => typeof m.name === 'string' && m.name.startsWith('ams'));
        this.state._ams_models = amsModules.map(m => ({
          name: m.name,
          sn: m.sn || '',
          hwVer: m.hw_ver || '',
          swVer: m.sw_ver || '',
          productName: m.product_name || '',
          model: detectAmsModel(m.hw_ver, m.product_name),
        }));
      }
    }

    // system: system-level info (LED control responses, etc.)
    if (msg.system) {
      this.state._system = this._deepMerge(this.state._system || {}, msg.system);
      updated = true;
    }

    // XCam event detection
    if (msg.print?.xcam_status && this.onXcamEvent) {
      const status = msg.print.xcam_status;
      if (status !== this._lastXcamStatus && typeof status === 'string' && status.length > 0) {
        this._lastXcamStatus = status;
        this.onXcamEvent(status);
      }
    }

    if (updated) {
      // Normalize key state fields for dashboard consistency
      // (MQTT data uses Bambu-specific names, dashboard expects standard names)
      if (this.state.nozzle_temper !== undefined) this.state._nozzle_actual = this.state.nozzle_temper;
      if (this.state.nozzle_target_temper !== undefined) this.state._nozzle_target = this.state.nozzle_target_temper;
      if (this.state.bed_temper !== undefined) this.state._bed_actual = this.state.bed_temper;
      if (this.state.bed_target_temper !== undefined) this.state._bed_target = this.state.bed_target_temper;

      // Lights report — actual LED state feedback
      if (this.state.lights_report && Array.isArray(this.state.lights_report)) {
        this.state._lights = {};
        for (const l of this.state.lights_report) {
          if (l.node) this.state._lights[l.node] = { mode: l.mode, led_on_time: l.led_on_time };
        }
      }

      // Chamber temperature (X1C, X1E, H2 series)
      if (this.state.chamber_temper !== undefined) {
        this.state._chamber_actual = this.state.chamber_temper;
      }

      // Camera state (ipcam)
      if (this.state.ipcam) {
        this.state._camera_state = {
          recording: this.state.ipcam.ipcam_record === 'enable',
          timelapse: this.state.ipcam.timelapse === 'enable',
          resolution: this.state.ipcam.resolution || '',
          dev: this.state.ipcam.ipcam_dev || '',
          tutkServer: this.state.ipcam.tutk_server || '',
        };
      }

      // Firmware upgrade state
      if (this.state.upgrade_state) {
        this.state._upgrade = {
          sequence_id: this.state.upgrade_state.sequence_id,
          progress: this.state.upgrade_state.progress || '',
          status: this.state.upgrade_state.status || '',
          newVersion: this.state.upgrade_state.new_version || '',
          forceUpgrade: this.state.upgrade_state.force_upgrade || false,
          message: this.state.upgrade_state.message || '',
        };
      }

      // Fan speeds readback
      if (this.state.big_fan1_speed !== undefined) this.state._fan_aux = this.state.big_fan1_speed;
      if (this.state.big_fan2_speed !== undefined) this.state._fan_chamber = this.state.big_fan2_speed;
      if (this.state.heatbreak_fan_speed !== undefined) this.state._fan_heatbreak = this.state.heatbreak_fan_speed;
      if (this.state.cooling_fan_speed !== undefined) this.state._fan_part = this.state.cooling_fan_speed;

      // Print preparation progress
      if (this.state.gcode_file_prepare_percent !== undefined) {
        this.state._prepare_percent = parseInt(this.state.gcode_file_prepare_percent) || 0;
      }

      // WiFi signal strength
      if (this.state.wifi_signal !== undefined) {
        this.state._wifi_rssi = this.state.wifi_signal;
      }

      // Speed level (discrete 1-4)
      if (this.state.spd_lvl !== undefined) {
        this.state._speed_level = this.state.spd_lvl;
      }

      // Maintenance schedule from firmware
      if (this.state.maintain !== undefined) {
        this.state._maintenance_data = this.state.maintain;
      }

      // Storage state
      if (this.state.stg_cur !== undefined) {
        this.state._storage_state = this.state.stg_cur;
      }

      // Nozzle info readback
      if (this.state.nozzle_type !== undefined) this.state._nozzle_type = this.state.nozzle_type;
      if (this.state.nozzle_diameter !== undefined) this.state._nozzle_diameter = this.state.nozzle_diameter;

      // Lifecycle / hardware state
      if (this.state.lifecycle !== undefined) this.state._lifecycle = this.state.lifecycle;
      if (this.state.hw_switch_state !== undefined) this.state._hw_switches = this.state.hw_switch_state;
      if (this.state.home_flag !== undefined) this.state._homed = this.state.home_flag;
      if (this.state.force_upgrade !== undefined) this.state._force_upgrade = this.state.force_upgrade;

      // Print error details
      if (this.state.print_error !== undefined && this.state.print_error !== 0) {
        this.state._print_error_code = this.state.print_error;
      }

      // Task/project IDs for cloud correlation
      if (this.state.subtask_id) this.state._subtask_id = this.state.subtask_id;
      if (this.state.profile_id) this.state._profile_id = this.state.profile_id;
      if (this.state.project_id) this.state._project_id = this.state.project_id;
      if (this.state.gcode_start_time) this.state._print_start_time = this.state.gcode_start_time;

      // Network info
      if (this.state.net) {
        this.state._network = { ip: this.state.net.info?.ip, mask: this.state.net.info?.mask };
      }

      // SD card detailed status
      if (this.state.sdcard !== undefined) this.state._sdcard = this.state.sdcard;

      // AMS detailed: RFID reading state, tray detailed info
      if (this.state.ams?.ams_rfid_reading !== undefined) this.state._ams_rfid_reading = this.state.ams.ams_rfid_reading;
      if (this.state.ams_status !== undefined) this.state._ams_status_code = this.state.ams_status;

      // Timestamp
      if (this.state.t_utc) this.state._last_report_utc = this.state.t_utc;

      // H2D dual-nozzle specific
      if (this.state.nozzle_temper_2 !== undefined) {
        this.state._nozzle2_temper = this.state.nozzle_temper_2;
        this.state._nozzle2_target = this.state.nozzle_target_temper_2 || 0;
      }

      // AMS summary for quick access.
      // AMS 2 Pro / AMS HT add `humidity_raw` (actual RH%), `dry_time` (minutes remaining),
      // and `dry_sf_reason` (safety-stop reason). BambuStudio#7931 and Bambuddy docs.
      if (this.state.ams?.ams) {
        this.state._ams_count = this.state.ams.ams.length;
        this.state._ams_humidity = this.state.ams.ams.map(a => ({
          id: a.id,
          humidity: a.humidity,
          humidityRaw: a.humidity_raw !== undefined ? Number(a.humidity_raw) : null,
          temp: a.temp,
          dryTime: a.dry_time !== undefined ? Number(a.dry_time) : null,
          drySfReason: a.dry_sf_reason !== undefined ? Number(a.dry_sf_reason) : null,
        }));
      }

      // HMS error code tracking with full details + firmware 01.02.00.00 detailed causes
      if (this.state.hms?.length > 0) {
        this.state._active_errors = this.state.hms.filter(h => h.attr > 0).length;
        this.state._hms_errors = this.state.hms.filter(h => h.attr > 0).map(h => ({
          attr: h.attr,
          code: h.code,
          msg: h.msg || '',
          // Firmware 01.02.00.00 adds detailed causes and wiki URLs
          causes: h.causes || h.detailed_causes || null,
          wiki_url: h.wiki_url || null,
          severity: h.severity || (h.attr >> 16) || null,
        }));
      }

      // Stopping status (firmware 01.02.00.00) — new gcode_state value
      if (this.state.gcode_state === 'STOPPING' || this.state.gcode_state === 'SLICING') {
        this.state._stopping = this.state.gcode_state === 'STOPPING';
      } else {
        this.state._stopping = false;
      }

      // Bed low-power mode (firmware 01.02.00.00)
      if (this.state.bed_heating_mode !== undefined) {
        this.state._bed_heating_mode = this.state.bed_heating_mode;
        this.state._bed_low_power = this.state.bed_heating_mode === 'low_power';
      }

      // Motor enable state (firmware 01.02.00.00)
      if (this.state.motor_enabled !== undefined) {
        this.state._motors_enabled = this.state.motor_enabled !== 0;
      }

      // External spool manual change state (firmware 01.02.00.00)
      if (this.state.ext_change) {
        this.state._ext_manual_change = {
          active: this.state.ext_change.active === 1 || this.state.ext_change.active === true,
          step: this.state.ext_change.step || '',
          targetColor: this.state.ext_change.target_color || '',
          targetType: this.state.ext_change.target_type || '',
        };
      }

      // Timelapse storage info (firmware 01.02.00.00 — local storage support)
      if (this.state.ipcam?.timelapse_storage) {
        this.state._timelapse_storage = this.state.ipcam.timelapse_storage; // 'internal' | 'external'
      }
      if (this.state.ipcam?.timelapse_count !== undefined) {
        this.state._timelapse_count = this.state.ipcam.timelapse_count;
      }

      // Print while drying (firmware 01.02.00.00) — concurrent drying during print
      if (this.state.ams?.ams) {
        const dryingDuringPrint = this.state.ams.ams.find(a => a.humidity_raw !== undefined && a.drying_while_printing === 1);
        if (dryingDuringPrint) {
          this.state._drying_while_printing = true;
          this.state._drying_ams_id = dryingDuringPrint.id;
        } else {
          this.state._drying_while_printing = false;
        }
      }

      // XCam AI frame snapshot (firmware 01.02.00.00) — base64 image in popup
      if (this.state.xcam_status?.frame) {
        this.state._xcam_frame = this.state.xcam_status.frame;
        this.state._xcam_frame_at = Date.now();
      }

      // Speed magnitude (percentage, more precise than spd_lvl discrete 1-4)
      if (this.state.spd_mag !== undefined) this.state._speed_percent = this.state.spd_mag;

      // Current G-code action (what the printer is doing right now)
      if (this.state.print_gcode_action !== undefined) this.state._gcode_action = this.state.print_gcode_action;

      // Cloud connectivity state
      if (this.state.online !== undefined) this.state._cloud_online = this.state.online;
      if (this.state.cloud_api_state !== undefined) this.state._cloud_api_state = this.state.cloud_api_state;

      // WiFi network details
      if (this.state.net) {
        if (this.state.net.ssid) this.state._wifi_ssid = this.state.net.ssid;
        if (this.state.net.bssid) this.state._wifi_bssid = this.state.net.bssid;
      }

      // External spool (vt_tray) — P2S/A1 filament properties
      if (this.state.vt_tray) {
        this.state._ext_spool = {
          id: this.state.vt_tray.id,
          type: this.state.vt_tray.tray_type || '',
          subType: this.state.vt_tray.tray_sub_brands || '',
          color: this.state.vt_tray.tray_color || '',
          weight: this.state.vt_tray.tray_weight || 0,
          bedTemp: this.state.vt_tray.bed_temp || 0,
          nozzleTempMin: this.state.vt_tray.nozzle_temp_min || 0,
          nozzleTempMax: this.state.vt_tray.nozzle_temp_max || 0,
          dryingTemp: this.state.vt_tray.drying_temp || 0,
          dryingTime: this.state.vt_tray.drying_time || 0,
          k: this.state.vt_tray.k || 0,
        };
      }

      // AMS tray switching state
      if (this.state.ams) {
        if (this.state.ams.tray_now !== undefined) this.state._ams_tray_now = this.state.ams.tray_now;
        if (this.state.ams.tray_pre !== undefined) this.state._ams_tray_pre = this.state.ams.tray_pre;
        if (this.state.ams.tray_tar !== undefined) this.state._ams_tray_tar = this.state.ams.tray_tar;
        if (this.state.ams.ams_exist_bits !== undefined) this.state._ams_exist_bits = this.state.ams.ams_exist_bits;
        if (this.state.ams.tray_exist_bits !== undefined) this.state._tray_exist_bits = this.state.ams.tray_exist_bits;
        if (this.state.ams.tray_read_done_bits !== undefined) this.state._tray_read_done = this.state.ams.tray_read_done_bits;
      }

      // AMS tray detailed filament properties (drying info, temps, K-factor).
      // Field set aligned with ha-bambulab entities for parity: RFID identifiers,
      // multi-color palette, bed_temp_type, flow ratio (n), calibration index.
      if (this.state.ams?.ams) {
        this.state._ams_trays = [];
        for (const unit of this.state.ams.ams) {
          if (!unit.tray) continue;
          for (const tray of unit.tray) {
            this.state._ams_trays.push({
              amsId: unit.id, trayId: tray.id,
              type: tray.tray_type || '', subBrands: tray.tray_sub_brands || '',
              color: tray.tray_color || '', weight: tray.tray_weight || 0,
              colors: Array.isArray(tray.tray_colors) ? tray.tray_colors.slice() : null,
              bedTemp: tray.bed_temp || 0,
              bedTempType: tray.bed_temp_type != null ? String(tray.bed_temp_type) : null,
              nozzleTempMin: tray.nozzle_temp_min || 0,
              nozzleTempMax: tray.nozzle_temp_max || 0,
              dryingTemp: tray.drying_temp || 0,
              dryingTime: tray.drying_time || 0,
              k: tray.k || 0,
              flowRatio: tray.n != null ? Number(tray.n) : null,
              caliIdx: tray.cali_idx != null ? Number(tray.cali_idx) : null,
              tagUid: tray.tag_uid || null,
              trayUuid: tray.tray_uuid || null,
              trayInfoIdx: tray.tray_info_idx != null ? Number(tray.tray_info_idx) : null,
              remain: tray.remain ?? null,
            });
          }
        }
      }

      // X-Cam AI detection confidence scores + H2D granular toggles.
      // H2D (2026) adds clump_detector (nozzle clumping), airprint_detector,
      // pileup_detector (purge chute), and printing_monitor master toggle.
      // Field names confirmed via OpenBambuAPI mqtt.md.
      if (this.state.xcam) {
        this.state._xcam = {
          firstLayerInspector: this.state.xcam.first_layer_inspector ?? null,
          spaghettiDetector: this.state.xcam.spaghetti_detector ?? null,
          printHalt: this.state.xcam.print_halt ?? null,
          allow: this.state.xcam.allow_skip_parts ?? null,
          buildplateMarkerDetector: this.state.xcam.buildplate_marker_detector ?? null,
          // H2D (2026 firmware)
          clumpDetector: this.state.xcam.clump_detector ?? null,
          airprintDetector: this.state.xcam.airprint_detector ?? null,
          pileupDetector: this.state.xcam.pileup_detector ?? null,
          printingMonitor: this.state.xcam.printing_monitor ?? null,
        };
      }
      if (this.state.xcam_status !== undefined) this.state._xcam_status = this.state.xcam_status;

      // Subtask name / gcode file for display
      if (this.state.subtask_name) this.state._subtask_name = this.state.subtask_name;
      if (this.state.gcode_file) this.state._gcode_file = this.state.gcode_file;

      // All storage states (not just current)
      if (this.state.stg !== undefined) this.state._storage_states = this.state.stg;

      this.hub.broadcast('status', { print: this.state });
    }
  }

  _deepMerge(target, source) {
    const result = { ...target };
    for (const key of Object.keys(source)) {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        result[key] = this._deepMerge(result[key] || {}, source[key]);
      } else {
        result[key] = source[key];
      }
    }
    return result;
  }
}
