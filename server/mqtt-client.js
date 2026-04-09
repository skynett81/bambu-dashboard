import mqtt from 'mqtt';
import { createHash } from 'node:crypto';
import { createLogger } from './logger.js';
const log = createLogger('mqtt');

export class BambuMqttClient {
  constructor(config, hub) {
    this.ip = config.printer.ip;
    this.serial = config.printer.serial;
    this.accessCode = config.printer.accessCode;
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
  }

  connect() {
    const url = `mqtts://${this.ip}:8883`;
    log.info(`Connecting to ${url}...`);
    // Bambu Lab printers use self-signed certificates — TLS verification
    // cannot be enabled without breaking connectivity. This is a known
    // limitation of the Bambu Lab protocol.

    // TOFU cert pinning: store fingerprint on first connect, verify on subsequent
    const pinnedFp = this._printerConfig.certFingerprint || null;

    this.client = mqtt.connect(url, {
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

      // Detect firmware changes
      if (msg.info.module && Array.isArray(msg.info.module) && this.onFirmwareInfo) {
        for (const mod of msg.info.module) {
          if (!mod.name || !mod.sw_ver) continue;
          const key = `${mod.name}_${mod.sw_ver}`;
          if (!this._lastFirmwareVersions[key]) {
            this._lastFirmwareVersions[key] = true;
            this.onFirmwareInfo(mod);
          }
        }
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

      // AMS summary for quick access
      if (this.state.ams?.ams) {
        this.state._ams_count = this.state.ams.ams.length;
        this.state._ams_humidity = this.state.ams.ams.map(a => ({ id: a.id, humidity: a.humidity, temp: a.temp }));
      }

      // HMS error code tracking
      if (this.state.hms?.length > 0) {
        this.state._active_errors = this.state.hms.filter(h => h.attr > 0).length;
      }

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
