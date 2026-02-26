import mqtt from 'mqtt';

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
    console.log(`[mqtt] Kobler til ${url}...`);

    this.client = mqtt.connect(url, {
      username: 'bblp',
      password: this.accessCode,
      rejectUnauthorized: false,
      keepalive: 30,
      reconnectPeriod: 5000,
      connectTimeout: 10000
    });

    this.client.on('connect', () => {
      this.connected = true;
      console.log('[mqtt] Tilkoblet printer');

      const topic = `device/${this.serial}/report`;
      this.client.subscribe(topic, (err) => {
        if (err) {
          console.error('[mqtt] Feil ved abonnering:', err.message);
        } else {
          console.log(`[mqtt] Abonnerer pa ${topic}`);
          this._requestFullState();
        }
      });

      this.hub.broadcast('connection', { status: 'connected' });
    });

    this.client.on('message', (topic, payload) => {
      try {
        const msg = JSON.parse(payload.toString());
        this._handleMessage(msg);
      } catch (e) {
        // Binary or non-JSON message, ignore
      }
    });

    this.client.on('error', (err) => {
      console.error('[mqtt] Feil:', err.message);
    });

    this.client.on('close', () => {
      if (this.connected) {
        console.log('[mqtt] Frakoblet - gjenkobler...');
        this.connected = false;
        this.hub.broadcast('connection', { status: 'disconnected' });
      }
    });

    this.client.on('reconnect', () => {
      console.log('[mqtt] Gjenkobler...');
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
