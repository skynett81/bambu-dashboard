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
  }

  connect() {
    const url = `mqtts://${this.ip}:8883`;
    log.info(`Connecting to ${url}...`);
    // Bambu Lab printers use self-signed certificates — TLS verification
    // cannot be enabled without breaking connectivity. This is a known
    // limitation of the Bambu Lab protocol.

    // TOFU cert pinning: store fingerprint on first connect, verify on subsequent
    const pinnedFp = config.printer.certFingerprint || null;
    this._certPinConfig = config;

    this.client = mqtt.connect(url, {
      username: 'bblp',
      password: this.accessCode,
      rejectUnauthorized: false, // Required: Bambu printers use self-signed certs
      keepalive: 30,
      reconnectPeriod: 5000,
      connectTimeout: 10000
    });

    // Verify cert fingerprint after TLS handshake (TOFU model)
    this.client.stream?.on('secureConnect', () => {
      try {
        const cert = this.client.stream.getPeerCertificate();
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
            // Store fingerprint for future verification (caller can persist to config)
            if (this.onCertPinned) this.onCertPinned(fp);
          }
        }
      } catch (e) {
        log.warn('Could not verify TLS cert: ' + e.message);
      }
    });

    this.client.on('connect', () => {
      this.connected = true;
      log.info('Connected to printer');

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
