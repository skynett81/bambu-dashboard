/**
 * Snapmaker SACP Connector — Full implementation
 * Corrected command IDs from Luban SacpClient.ts reference.
 *
 * Supports: J1, J1s (IDEX), Artisan, A150, A250, A350, Ray
 * Protocol: Binary TCP:8888 (J1/Artisan/A-series) or UDP:8889 (Ray)
 * via @snapmaker/snapmaker-sacp-sdk
 *
 * Command ID reference (verified against Luban source):
 * - Auth:        0x01, 0x05 → PeerId.SCREEN (not CONTROLLER)
 * - Heartbeat:   0xb0, 0x0b → PeerId.SCREEN
 * - G-code:      0x01, 0x02 → PeerId.CONTROLLER
 * - Machine:     0x01, 0x20/0x21/0x22 → PeerId.CONTROLLER
 * - Nozzle sub:  0x10, 0xa0 (not 0xa0, 0x01)
 * - Bed sub:     0x14, 0xa0 (not 0xa0, 0x02)
 * - Coords sub:  0x01, 0xa2
 * - Status sub:  0x01, 0xa0
 * - Print ctrl:  0xac, 0x04/0x05/0x06 (not 0x04, 0x02/0x04/0x06)
 * - Print file:  0xac, 0x1a (get), 0xac, 0x03 (start)
 * - Speed:       0xac, 0x0e (set), 0xac, 0x0f (get)
 * - File upload:  0xb0, 0x10/0x11 (compressed)
 * - Enclosure:   0x15, 0x01-0x04
 * - Purifier:    0x17, 0x01-0x03
 * - FDM head:    0x10, 0x01-0x09
 * - Errors:      0x04, 0x02
 */

import { createConnection } from 'node:net';
import dgram from 'node:dgram';
import { Dispatcher, helper } from '@snapmaker/snapmaker-sacp-sdk';
import { hostname } from 'node:os';

const log = {
  info: (...a) => console.log('[sacp]', ...a),
  warn: (...a) => console.warn('[sacp]', ...a),
  error: (...a) => console.error('[sacp]', ...a),
};

// ── Peer IDs (from SACP protocol) ──
const PEER = {
  CONTROLLER: 0x01,
  SCREEN: 0x02,
};

// ── Correct Command IDs (verified from Luban SacpClient.ts) ──
const CMD = {
  // System (0x01)
  EXECUTE_GCODE:      { set: 0x01, id: 0x02 },
  WIFI_CONNECTION:    { set: 0x01, id: 0x05 },  // Auth → SCREEN
  WIFI_CLOSE:         { set: 0x01, id: 0x06 },  // Disconnect → SCREEN
  GET_MODULE_INFO:    { set: 0x01, id: 0x20 },
  GET_MACHINE_INFO:   { set: 0x01, id: 0x21 },
  GET_MACHINE_SIZE:   { set: 0x01, id: 0x22 },
  GET_COORDINATES:    { set: 0x01, id: 0x30 },
  REQUEST_HOME:       { set: 0x01, id: 0x35 },
  // System subscriptions
  SUB_HEARTBEAT:      { set: 0x01, id: 0xa0 },
  SUB_COORDINATES:    { set: 0x01, id: 0xa2 },

  // Error reports (0x04)
  GET_ERROR_REPORTS:  { set: 0x04, id: 0x02 },

  // FDM / Extruder (0x10)
  GET_FDM_INFO:       { set: 0x10, id: 0x01 },
  SET_NOZZLE_TEMP:    { set: 0x10, id: 0x02 },
  SET_FILAMENT_STATUS:{ set: 0x10, id: 0x04 },
  SWITCH_EXTRUDER:    { set: 0x10, id: 0x05 },
  SET_EXTRUDER_FAN:   { set: 0x10, id: 0x06 },
  GET_EXTRUDER_OFFSET:{ set: 0x10, id: 0x08 },
  EXTRUDER_MOVEMENT:  { set: 0x10, id: 0x09 },
  SUB_NOZZLE_INFO:    { set: 0x10, id: 0xa0 },

  // Heated Bed (0x14)
  GET_HOT_BED:        { set: 0x14, id: 0x01 },
  SET_BED_TEMP:       { set: 0x14, id: 0x02 },
  SUB_BED_TEMP:       { set: 0x14, id: 0xa0 },

  // Enclosure (0x15)
  GET_ENCLOSURE:      { set: 0x15, id: 0x01 },
  SET_ENCLOSURE_LIGHT:{ set: 0x15, id: 0x02 },
  SET_ENCLOSURE_DOOR: { set: 0x15, id: 0x03 },
  SET_ENCLOSURE_FAN:  { set: 0x15, id: 0x04 },
  SUB_ENCLOSURE:      { set: 0x15, id: 0xa0 },
  SUB_ENCLOSURE_LIGHT:{ set: 0x15, id: 0xa1 },

  // Air Purifier (0x17)
  GET_PURIFIER:       { set: 0x17, id: 0x01 },
  SET_PURIFIER_SPEED: { set: 0x17, id: 0x02 },
  SET_PURIFIER_SWITCH:{ set: 0x17, id: 0x03 },
  SUB_PURIFIER:       { set: 0x17, id: 0xa0 },

  // CNC Head (0x11)
  SET_CNC_POWER:      { set: 0x11, id: 0x02 },
  SET_CNC_SPEED:      { set: 0x11, id: 0x03 },
  SWITCH_CNC:         { set: 0x11, id: 0x05 },
  SUB_CNC_SPEED:      { set: 0x11, id: 0xa0 },

  // Laser Head (0x12)
  GET_LASER_INFO:     { set: 0x12, id: 0x01 },
  SET_LASER_POWER:    { set: 0x12, id: 0x02 },
  SET_LASER_BRIGHTNESS:{ set: 0x12, id: 0x03 },
  SET_FOCAL_LENGTH:   { set: 0x12, id: 0x04 },
  SET_LASER_LOCK:     { set: 0x12, id: 0x07 },
  GET_LASER_LOCK:     { set: 0x12, id: 0x0a },
  SET_FIRE_SENSITIVITY:{ set: 0x12, id: 0x0d },
  GET_FIRE_SENSITIVITY:{ set: 0x12, id: 0x0e },
  SET_CROSSHAIR:      { set: 0x12, id: 0x10 },
  GET_CROSSHAIR:      { set: 0x12, id: 0x11 },
  SUB_LASER_POWER:    { set: 0x12, id: 0xa1 },

  // Print Job Control (0xac) — CORRECT IDs from Luban
  GET_GCODE_FILE:     { set: 0xac, id: 0x00 },
  START_PRINT:        { set: 0xac, id: 0x03 },
  PAUSE_PRINT:        { set: 0xac, id: 0x04 },
  RESUME_PRINT:       { set: 0xac, id: 0x05 },
  STOP_PRINT:         { set: 0xac, id: 0x06 },
  SET_WORK_SPEED:     { set: 0xac, id: 0x0e },
  GET_WORK_SPEED:     { set: 0xac, id: 0x0f },
  GET_PRINTING_FILE:  { set: 0xac, id: 0x1a },
  SUB_PRINT_LINE:     { set: 0xac, id: 0xa0 },
  SUB_WORK_SPEED:     { set: 0xac, id: 0xa4 },
  SUB_PRINT_TIME:     { set: 0xac, id: 0xa5 },

  // File Transfer / Screen (0xb0) — to SCREEN peer
  FILE_UPLOAD_START:  { set: 0xb0, id: 0x00 },
  FILE_UPLOAD_DATA:   { set: 0xb0, id: 0x01 },
  FILE_UPLOAD_RESULT: { set: 0xb0, id: 0x02 },
  SCREEN_PRINT:       { set: 0xb0, id: 0x08 },
  HEARTBEAT:          { set: 0xb0, id: 0x0b },  // → SCREEN
  COMPRESSED_START:   { set: 0xb0, id: 0x10 },
  COMPRESSED_DATA:    { set: 0xb0, id: 0x11 },
  SUB_PROGRESS:       { set: 0xb0, id: 0xa0 },
  SUB_ESTIMATED_TIME: { set: 0xb0, id: 0xa1 },
};

// Machine model mapping
const MODEL_MAP = {
  0: 'Snapmaker 2.0 A150', 1: 'Snapmaker 2.0 A250', 2: 'Snapmaker 2.0 A350',
  3: 'Snapmaker Artisan', 4: 'Snapmaker J1', 5: 'Snapmaker Ray',
};

const STATE_MAP = {
  0: 'IDLE', 1: 'RUNNING', 2: 'PAUSE', 3: 'PAUSE', 4: 'FINISH',
};

const MODULE_NAMES = {
  0: '3D Print Head', 1: 'CNC Router', 2: '1.6W Laser',
  7: 'Air Purifier', 13: 'Dual Extruder', 14: '10W Laser',
  16: 'Enclosure', 19: '20W Laser', 20: '40W Laser',
  518: 'Ray Enclosure',
};

const PRINTING_MODULES = [0, 13]; // Single head, Dual Extruder
const LASER_MODULES = [2, 14, 19, 20]; // 1.6W, 10W, 20W, 40W
const CNC_MODULES = [1];

export class SacpConnector {
  constructor(config, hub) {
    this.ip = config.printer.ip;
    this.port = config.printer.port || 8888;
    this._printerId = config.printer.id || '';
    this._printerName = config.printer.name || '';
    this.hub = hub;
    this.state = {};
    this.connected = false;
    this._socket = null;
    this._dispatcher = null;
    this._reconnectTimer = null;
    this._reconnectDelay = 3000;
    this._heartbeatTimer = null;
    this.onFirmwareInfo = null;
    this.onXcamEvent = null;
    this._machineInfo = null;
    this._modules = [];
    this._machineSize = null;
    this._transport = config.printer.transport || (config.printer.model?.includes('Ray') ? 'udp' : 'tcp');
    this._udpSocket = null;
    this._headType = null; // 'fdm', 'laser', 'cnc' — detected from modules
  }

  // ══════════════════════════════════════════
  // CONNECTION LIFECYCLE
  // ══════════════════════════════════════════

  connect() {
    log.info(`Connecting to SACP at ${this.ip}:${this.port}`);
    this._connect();
  }

  disconnect() {
    this._clearTimers();
    // Graceful disconnect (Luban: wifiConnectionClose)
    if (this.connected && this._dispatcher) {
      try { this._dispatcher.send(CMD.WIFI_CLOSE.set, CMD.WIFI_CLOSE.id, PEER.SCREEN, Buffer.alloc(0)); } catch {}
    }
    this.connected = false;
    if (this._dispatcher) { this._dispatcher.dispose(); this._dispatcher = null; }
    if (this._socket) { this._socket.destroy(); this._socket = null; }
    if (this._udpSocket) { try { this._udpSocket.close(); } catch {} this._udpSocket = null; }
  }

  _connect() {
    this._clearTimers();

    if (this._transport === 'udp') {
      this._connectUdp();
    } else {
      this._connectTcp();
    }
  }

  _connectTcp() {
    this._socket = createConnection({ host: this.ip, port: this.port }, () => {
      log.info(`TCP connected to ${this.ip}:${this.port}`);
      this._dispatcher = new Dispatcher('tcp', this._socket);
      this._authenticate();
    });

    this._socket.on('error', (err) => {
      if (this.connected) {
        this.connected = false;
        this.hub.broadcast('connection', { status: 'disconnected' });
        log.warn(`SACP TCP error: ${err.message}`);
      }
      this._scheduleReconnect();
    });

    this._socket.on('close', () => {
      if (this.connected) {
        this.connected = false;
        this.hub.broadcast('connection', { status: 'disconnected' });
        log.warn('SACP TCP connection closed');
      }
      this._scheduleReconnect();
    });
  }

  _connectUdp() {
    log.info(`Connecting via UDP to ${this.ip}:${this.port}`);
    this._udpSocket = dgram.createSocket('udp4');

    this._udpSocket.bind(8889, () => {
      log.info('UDP socket bound to port 8889');

      // Create dispatcher with UDP socket wrapper (Luban pattern)
      this._dispatcher = new Dispatcher('udp', {
        socket: this._udpSocket,
        host: this.ip,
        port: this.port,
      });

      this._authenticate();
    });

    this._udpSocket.on('message', (buffer) => {
      if (this._dispatcher) this._dispatcher.read(buffer);
    });

    this._udpSocket.on('error', (err) => {
      log.warn(`SACP UDP error: ${err.message}`);
      if (this.connected) {
        this.connected = false;
        this.hub.broadcast('connection', { status: 'disconnected' });
      }
      this._scheduleReconnect();
    });
  }

  async _authenticate() {
    try {
      // WiFi connection handshake — CORRECT: 0x01, 0x05 to PeerId.SCREEN
      const host = hostname();
      const connPayload = Buffer.concat([
        helper.stringToBuffer(host),
        helper.stringToBuffer('3DPrintForge'),
        helper.stringToBuffer(''),
      ]);

      const resp = await this._dispatcher.send(
        CMD.WIFI_CONNECTION.set, CMD.WIFI_CONNECTION.id,
        PEER.SCREEN, connPayload
      );
      log.info('SACP WiFi authenticated');

      // Set disconnect handler
      this._dispatcher.setHandler(CMD.WIFI_CLOSE.set, CMD.WIFI_CLOSE.id, () => {
        log.warn('Printer requested disconnect');
        this.connected = false;
        this.hub.broadcast('connection', { status: 'disconnected' });
        this._scheduleReconnect();
      });

      // Fetch machine info + modules + size
      await this._fetchMachineInfo();

      // Start subscriptions with CORRECT command IDs
      await this._startSubscriptions();

      this.connected = true;
      this.hub.broadcast('connection', { status: 'connected' });

      // Start heartbeat — CORRECT: 0xb0, 0x0b to PeerId.SCREEN
      this._startHeartbeat();

    } catch (err) {
      log.error(`SACP auth failed: ${err.message}`);
      this._scheduleReconnect();
    }
  }

  async _fetchMachineInfo() {
    // Machine info
    try {
      const resp = await this._send(CMD.GET_MACHINE_INFO, PEER.CONTROLLER, Buffer.alloc(0));
      if (resp?.data) {
        const buf = resp.data;
        const modelId = buf[0];
        this._machineInfo = {
          modelId,
          model: MODEL_MAP[modelId] || `Snapmaker (${modelId})`,
          serialNumber: buf.subarray(31, 61).toString('utf8').replace(/\0/g, '').trim(),
          firmwareVersion: buf.subarray(61, 91).toString('utf8').replace(/\0/g, '').trim(),
        };
        if (this.onFirmwareInfo) {
          this.onFirmwareInfo({
            name: 'sacp', sw_ver: this._machineInfo.firmwareVersion,
            hw_ver: this._machineInfo.model, sn: this._machineInfo.serialNumber,
          });
        }
        log.info(`Machine: ${this._machineInfo.model}, FW: ${this._machineInfo.firmwareVersion}`);
      }
    } catch (e) { log.warn(`Machine info failed: ${e.message}`); }

    // Machine size (build volume)
    try {
      const resp = await this._send(CMD.GET_MACHINE_SIZE, PEER.CONTROLLER, Buffer.alloc(0));
      if (resp?.data && resp.data.length >= 12) {
        this._machineSize = {
          x: resp.data.readFloatLE(0),
          y: resp.data.readFloatLE(4),
          z: resp.data.readFloatLE(8),
        };
        this.state._buildVolume = this._machineSize;
        log.info(`Build volume: ${this._machineSize.x}x${this._machineSize.y}x${this._machineSize.z}mm`);
      }
    } catch (e) { log.warn(`Machine size failed: ${e.message}`); }

    // Module list
    try {
      const resp = await this._send(CMD.GET_MODULE_INFO, PEER.CONTROLLER, Buffer.alloc(0));
      if (resp?.data) {
        this._modules = this._parseModules(resp.data);
        this.state._modules = this._modules;

        // Detect head type from installed modules
        this._headType = 'fdm'; // default
        for (const m of this._modules) {
          if (LASER_MODULES.includes(m.moduleId)) { this._headType = 'laser'; break; }
          if (CNC_MODULES.includes(m.moduleId)) { this._headType = 'cnc'; break; }
          if (PRINTING_MODULES.includes(m.moduleId)) { this._headType = 'fdm'; break; }
        }
        this.state._headType = this._headType;
        log.info(`Modules: ${this._modules.map(m => m.name).join(', ')} [head: ${this._headType}]`);
      }
    } catch (e) { log.warn(`Module info failed: ${e.message}`); }

    // Get error reports
    try {
      const resp = await this._send(CMD.GET_ERROR_REPORTS, PEER.CONTROLLER, Buffer.alloc(0));
      if (resp?.data && resp.data.length > 1) {
        this.state._errors = this._parseErrors(resp.data);
      }
    } catch {}
  }

  // ══════════════════════════════════════════
  // SUBSCRIPTIONS — CORRECT COMMAND IDS
  // ══════════════════════════════════════════

  async _startSubscriptions() {
    const d = this._dispatcher;
    const interval = 1000;

    // Nozzle temperature — 0x10, 0xa0
    try {
      await d.subscribe(CMD.SUB_NOZZLE_INFO.set, CMD.SUB_NOZZLE_INFO.id, interval, (resp) => {
        this._handleNozzleInfo(resp.data);
      });
    } catch (e) { log.warn(`Sub nozzle failed: ${e.message}`); }

    // Bed temperature — 0x14, 0xa0
    try {
      await d.subscribe(CMD.SUB_BED_TEMP.set, CMD.SUB_BED_TEMP.id, interval, (resp) => {
        this._handleHotbedTemp(resp.data);
      });
    } catch (e) { log.warn(`Sub bed failed: ${e.message}`); }

    // Coordinates — 0x01, 0xa2
    try {
      await d.subscribe(CMD.SUB_COORDINATES.set, CMD.SUB_COORDINATES.id, interval, (resp) => {
        this._handleCoordinateInfo(resp.data);
      });
    } catch (e) { log.warn(`Sub coords failed: ${e.message}`); }

    // Heartbeat/machine state — 0x01, 0xa0
    try {
      await d.subscribe(CMD.SUB_HEARTBEAT.set, CMD.SUB_HEARTBEAT.id, interval, (resp) => {
        this._handleMachineState(resp.data);
      });
    } catch (e) { log.warn(`Sub heartbeat failed: ${e.message}`); }

    // Print progress — 0xb0, 0xa0
    try {
      await d.subscribe(CMD.SUB_PROGRESS.set, CMD.SUB_PROGRESS.id, interval, (resp) => {
        this._handlePrintProgress(resp.data);
      });
    } catch (e) { log.warn(`Sub progress failed: ${e.message}`); }

    // Print estimated time — 0xb0, 0xa1
    try {
      await d.subscribe(CMD.SUB_ESTIMATED_TIME.set, CMD.SUB_ESTIMATED_TIME.id, interval, (resp) => {
        this._handlePrintTime(resp.data);
      });
    } catch (e) { log.warn(`Sub est.time failed: ${e.message}`); }

    // Print line number — 0xac, 0xa0
    try {
      await d.subscribe(CMD.SUB_PRINT_LINE.set, CMD.SUB_PRINT_LINE.id, interval, (resp) => {
        if (resp?.data && resp.data.length >= 4) {
          this.state._currentLine = resp.data.readUInt32LE(0);
        }
      });
    } catch (e) { log.warn(`Sub print line failed: ${e.message}`); }

    // Work speed — 0xac, 0xa4
    try {
      await d.subscribe(CMD.SUB_WORK_SPEED.set, CMD.SUB_WORK_SPEED.id, interval, (resp) => {
        if (resp?.data && resp.data.length >= 2) {
          this.state.spd_mag = resp.data.readUInt16LE(0);
        }
      });
    } catch (e) { log.warn(`Sub speed failed: ${e.message}`); }

    // Enclosure — 0x15, 0xa0
    try {
      await d.subscribe(CMD.SUB_ENCLOSURE.set, CMD.SUB_ENCLOSURE.id, interval * 2, (resp) => {
        this._handleEnclosureInfo(resp.data);
      });
    } catch (e) { log.warn(`Sub enclosure failed: ${e.message}`); }

    // Purifier — 0x17, 0xa0
    try {
      await d.subscribe(CMD.SUB_PURIFIER.set, CMD.SUB_PURIFIER.id, interval * 2, (resp) => {
        this._handlePurifierInfo(resp.data);
      });
    } catch (e) { log.warn(`Sub purifier failed: ${e.message}`); }
  }

  _startHeartbeat() {
    // CORRECT: 0xb0, 0x0b to PeerId.SCREEN
    this._heartbeatTimer = setInterval(async () => {
      if (!this.connected || !this._dispatcher) return;
      try {
        await this._dispatcher.send(
          CMD.HEARTBEAT.set, CMD.HEARTBEAT.id,
          PEER.SCREEN, Buffer.alloc(0)
        );
      } catch {
        if (this.connected) {
          this.connected = false;
          this.hub.broadcast('connection', { status: 'disconnected' });
        }
        this._scheduleReconnect();
      }
    }, 5000);
  }

  // ══════════════════════════════════════════
  // SUBSCRIPTION DATA HANDLERS
  // ══════════════════════════════════════════

  _handleNozzleInfo(data) {
    if (!data || data.length < 4) return;
    const count = data[1] || 1;
    if (data.length >= 6) {
      this.state.nozzle_temper = Math.round(data.readInt16LE(2) / 10);
      this.state.nozzle_target_temper = Math.round(data.readInt16LE(4) / 10);
    }
    if (count > 1 && data.length >= 10) {
      this.state._nozzle2_temper = Math.round(data.readInt16LE(6) / 10);
      this.state._nozzle2_target = Math.round(data.readInt16LE(8) / 10);
    }
    this._broadcastState();
  }

  _handleHotbedTemp(data) {
    if (!data || data.length < 6) return;
    this.state.bed_temper = Math.round(data.readInt16LE(2) / 10);
    this.state.bed_target_temper = Math.round(data.readInt16LE(4) / 10);
    this._broadcastState();
  }

  _handleCoordinateInfo(data) {
    if (!data || data.length < 5) return;
    const count = data[0];
    const coords = { x: 0, y: 0, z: 0 };
    for (let i = 0; i < count && (1 + i * 5 + 5) <= data.length; i++) {
      const key = data[1 + i * 5];
      const val = data.readFloatLE(2 + i * 5);
      if (key === 0) coords.x = Math.round(val * 100) / 100;
      if (key === 1) coords.y = Math.round(val * 100) / 100;
      if (key === 2) coords.z = Math.round(val * 100) / 100;
    }
    this.state._position = coords;
  }

  _handlePrintProgress(data) {
    if (!data || data.length < 1) return;
    this.state.mc_percent = data[0];
    this._broadcastState();
  }

  _handlePrintTime(data) {
    if (!data || data.length < 4) return;
    if (data.length >= 8) {
      this.state.print_duration_seconds = data.readUInt32LE(0);
      this.state.mc_remaining_time = Math.round(data.readUInt32LE(4) / 60);
    } else {
      this.state.mc_remaining_time = Math.round(data.readUInt32LE(0) / 60);
    }
    this._broadcastState();
  }

  _handleMachineState(data) {
    if (!data || data.length < 1) return;
    const machineState = data[0];
    this.state.gcode_state = STATE_MAP[machineState] ?? 'IDLE';
    this._broadcastState();
  }

  _handleEnclosureInfo(data) {
    if (!data || data.length < 3) return;
    this.state._enclosure = {
      led: data[0] === 1,
      fan: data[1] === 1,
      doorOpen: data[2] === 1,
    };
    if (data.length >= 5) {
      this.state.chamber_temper = Math.round(data.readInt16LE(3) / 10);
    }
  }

  _handlePurifierInfo(data) {
    if (!data || data.length < 4) return;
    this.state._purifier = {
      power: data[0] === 1,
      fan: data[1] === 1,
      speedLevel: data[2],
      lifeLevel: data[3],
    };
  }

  _broadcastState() {
    this.hub.broadcast('status', { print: this.state });
  }

  // ══════════════════════════════════════════
  // COMMANDS — Native SACP (no G-code fallback where possible)
  // ══════════════════════════════════════════

  sendCommand(commandObj) {
    if (!this.connected || !this._dispatcher) return;
    const action = commandObj._sacp_action || commandObj.action;

    switch (action) {
      // ── Print control (CORRECT: 0xac command set) ──
      case 'pause':
        this._send(CMD.PAUSE_PRINT, PEER.CONTROLLER, Buffer.alloc(0));
        break;
      case 'resume':
        this._send(CMD.RESUME_PRINT, PEER.CONTROLLER, Buffer.alloc(0));
        break;
      case 'stop':
        this._send(CMD.STOP_PRINT, PEER.CONTROLLER, Buffer.alloc(0));
        break;

      // ── Speed (native SACP: 0xac, 0x0e) ──
      case 'speed': {
        const buf = Buffer.alloc(5);
        buf[0] = 0; // key
        buf[1] = 0; // extruder index
        buf.writeUInt16LE(commandObj.value || 100, 2);
        buf[4] = 0; // reserved
        this._send(CMD.SET_WORK_SPEED, PEER.CONTROLLER, buf);
        break;
      }

      // ── Temperature (native SACP: 0x10, 0x02 / 0x14, 0x02) ──
      case 'set_nozzle_temp':
      case 'set_temp_nozzle': {
        const buf = Buffer.alloc(5);
        buf[0] = 0; // key
        buf[1] = commandObj.extruder || 0; // extruder index
        buf.writeInt16LE((commandObj.target || 0) * 10, 2); // temp * 10
        this._send(CMD.SET_NOZZLE_TEMP, PEER.CONTROLLER, buf);
        break;
      }
      case 'set_bed_temp':
      case 'set_temp_bed': {
        const buf = Buffer.alloc(5);
        buf[0] = 0; // key
        buf[1] = 0; // zone 0
        buf.writeInt16LE((commandObj.target || 0) * 10, 2);
        this._send(CMD.SET_BED_TEMP, PEER.CONTROLLER, buf);
        break;
      }

      // ── Fan (native SACP: 0x10, 0x06) ──
      case 'set_fan': {
        const buf = Buffer.alloc(4);
        buf[0] = 0; // key
        buf[1] = 0; // fan index (0 = part cooling)
        buf[2] = Math.round(commandObj.value || 0); // speed level
        this._send(CMD.SET_EXTRUDER_FAN, PEER.CONTROLLER, buf);
        break;
      }

      // ── Extruder switch (native SACP: 0x10, 0x05) ──
      case 'switch_extruder': {
        const buf = Buffer.alloc(3);
        buf[0] = 0; // key
        buf[1] = commandObj.extruder || 0; // extruder index
        this._send(CMD.SWITCH_EXTRUDER, PEER.CONTROLLER, buf);
        break;
      }

      // ── Home (native SACP: 0x01, 0x35) ──
      case 'home':
        this._send(CMD.REQUEST_HOME, PEER.CONTROLLER, Buffer.from([0]));
        break;

      // ── Enclosure (native SACP: 0x15) ──
      case 'light': {
        const brightness = commandObj.mode === 'on' ? (commandObj.brightness || 100) : 0;
        const buf = Buffer.alloc(3);
        buf[0] = 0; // key
        buf[1] = brightness; // 0-100
        this._send(CMD.SET_ENCLOSURE_LIGHT, PEER.CONTROLLER, buf);
        break;
      }
      case 'set_enclosure_fan': {
        const buf = Buffer.alloc(3);
        buf[0] = 0; // key
        buf[1] = commandObj.value || 0; // 0-100
        this._send(CMD.SET_ENCLOSURE_FAN, PEER.CONTROLLER, buf);
        break;
      }
      case 'set_enclosure_door': {
        const buf = Buffer.alloc(4);
        buf[0] = 0; // key
        buf[1] = commandObj.headType || 0;
        buf[2] = commandObj.enabled ? 1 : 0;
        this._send(CMD.SET_ENCLOSURE_DOOR, PEER.CONTROLLER, buf);
        break;
      }

      // ── Purifier (native SACP: 0x17) ──
      case 'set_purifier_speed': {
        const buf = Buffer.alloc(3);
        buf[0] = 0; // key
        buf[1] = commandObj.speed || 1; // speed level
        this._send(CMD.SET_PURIFIER_SPEED, PEER.CONTROLLER, buf);
        break;
      }
      case 'set_purifier_switch': {
        const buf = Buffer.alloc(3);
        buf[0] = 0; // key
        buf[1] = commandObj.enabled ? 1 : 0;
        this._send(CMD.SET_PURIFIER_SWITCH, PEER.CONTROLLER, buf);
        break;
      }

      // ── G-code (for anything not natively supported) ──
      case 'gcode':
        if (commandObj.gcode) this._executeGcode(commandObj.gcode);
        break;
      case 'emergency_stop':
        this._executeGcode('M112');
        break;

      // ── Laser commands (Artisan/A-series/Ray) ──
      case 'laser_power': {
        const buf = Buffer.alloc(4);
        buf[0] = 0; // key
        buf.writeUInt16LE(Math.round((commandObj.power || 0) * 10), 1); // power * 10
        this._send(CMD.SET_LASER_POWER, PEER.CONTROLLER, buf);
        break;
      }
      case 'laser_brightness': {
        const buf = Buffer.alloc(4);
        buf[0] = 0;
        buf.writeUInt16LE(commandObj.brightness || 0, 1);
        this._send(CMD.SET_LASER_BRIGHTNESS, PEER.CONTROLLER, buf);
        break;
      }
      case 'laser_focal_length': {
        const buf = Buffer.alloc(5);
        buf[0] = 0;
        buf.writeFloatLE(commandObj.focalLength || 0, 1);
        this._send(CMD.SET_FOCAL_LENGTH, PEER.CONTROLLER, buf);
        break;
      }
      case 'laser_lock': {
        const buf = Buffer.alloc(3);
        buf[0] = 0;
        buf[1] = commandObj.locked ? 1 : 0;
        this._send(CMD.SET_LASER_LOCK, PEER.CONTROLLER, buf);
        break;
      }
      case 'laser_fire_sensitivity': {
        const buf = Buffer.alloc(4);
        buf[0] = 0;
        buf.writeUInt16LE(commandObj.sensitivity || 50, 1);
        this._send(CMD.SET_FIRE_SENSITIVITY, PEER.CONTROLLER, buf);
        break;
      }
      case 'laser_crosshair': {
        const buf = Buffer.alloc(9);
        buf[0] = 0;
        buf.writeFloatLE(commandObj.x || 0, 1);
        buf.writeFloatLE(commandObj.y || 0, 5);
        this._send(CMD.SET_CROSSHAIR, PEER.CONTROLLER, buf);
        break;
      }

      // ── CNC commands (Artisan/A-series) ──
      case 'cnc_power': {
        const buf = Buffer.alloc(3);
        buf[0] = 0;
        buf[1] = Math.round(commandObj.power || 0); // 0-100
        this._send(CMD.SET_CNC_POWER, PEER.CONTROLLER, buf);
        break;
      }
      case 'cnc_speed': {
        const buf = Buffer.alloc(5);
        buf[0] = 0;
        buf.writeUInt32LE(commandObj.rpm || 12000, 1);
        this._send(CMD.SET_CNC_SPEED, PEER.CONTROLLER, buf);
        break;
      }
      case 'cnc_switch': {
        const buf = Buffer.alloc(3);
        buf[0] = 0;
        buf[1] = commandObj.enabled ? 1 : 0;
        this._send(CMD.SWITCH_CNC, PEER.CONTROLLER, buf);
        break;
      }

      // ── IDEX modes (J1) ──
      case 'idex_single_left':
        this._executeGcode('M605 S0\nT0');
        break;
      case 'idex_single_right':
        this._executeGcode('M605 S0\nT1');
        break;
      case 'idex_duplicate':
        this._executeGcode('M605 S2');
        break;
      case 'idex_mirror':
        this._executeGcode('M605 S3');
        break;

      default:
        log.warn(`Unknown SACP command: ${action}`);
    }
  }

  async _executeGcode(gcode) {
    for (const line of gcode.split('\n').map(l => l.trim()).filter(Boolean)) {
      try {
        await this._send(CMD.EXECUTE_GCODE, PEER.CONTROLLER, Buffer.from(line + '\n', 'utf8'));
      } catch (e) {
        log.error(`G-code failed: ${line}: ${e.message}`);
      }
    }
  }

  // ══════════════════════════════════════════
  // QUERIES — On-demand data fetching
  // ══════════════════════════════════════════

  async getPrintingFileInfo() {
    try {
      const resp = await this._send(CMD.GET_PRINTING_FILE, PEER.CONTROLLER, Buffer.alloc(0));
      if (resp?.data) {
        const { result: filename, nextOffset } = helper.readString(resp.data, 0);
        const totalLine = resp.data.length >= nextOffset + 4 ? resp.data.readUInt32LE(nextOffset) : 0;
        const estimatedTime = resp.data.length >= nextOffset + 8 ? resp.data.readUInt32LE(nextOffset + 4) : 0;
        return { filename, totalLine, estimatedTime };
      }
    } catch {}
    return null;
  }

  async getWorkSpeed() {
    try {
      const resp = await this._send(CMD.GET_WORK_SPEED, PEER.CONTROLLER, Buffer.alloc(0));
      if (resp?.data && resp.data.length >= 2) return resp.data.readUInt16LE(0);
    } catch {}
    return 100;
  }

  async getErrorReports() {
    try {
      const resp = await this._send(CMD.GET_ERROR_REPORTS, PEER.CONTROLLER, Buffer.alloc(0));
      if (resp?.data) return this._parseErrors(resp.data);
    } catch {}
    return [];
  }

  async getEnclosureInfo() {
    try {
      const resp = await this._send(CMD.GET_ENCLOSURE, PEER.CONTROLLER, Buffer.alloc(0));
      if (resp?.data) { this._handleEnclosureInfo(resp.data); return this.state._enclosure; }
    } catch {}
    return null;
  }

  async getPurifierInfo() {
    try {
      const resp = await this._send(CMD.GET_PURIFIER, PEER.CONTROLLER, Buffer.alloc(0));
      if (resp?.data) { this._handlePurifierInfo(resp.data); return this.state._purifier; }
    } catch {}
    return null;
  }

  async getFdmInfo() {
    try {
      const resp = await this._send(CMD.GET_FDM_INFO, PEER.CONTROLLER, Buffer.alloc(1));
      return resp?.data || null;
    } catch {}
    return null;
  }

  async getLaserInfo() {
    try {
      const resp = await this._send(CMD.GET_LASER_INFO, PEER.CONTROLLER, Buffer.alloc(1));
      if (resp?.data && resp.data.length >= 6) {
        return {
          focalLength: resp.data.readFloatLE(1),
          power: resp.data.length >= 10 ? resp.data.readUInt16LE(5) / 10 : 0,
        };
      }
    } catch {}
    return null;
  }

  async getLaserLockStatus() {
    try {
      const resp = await this._send(CMD.GET_LASER_LOCK, PEER.CONTROLLER, Buffer.alloc(1));
      if (resp?.data) return { locked: resp.data[1] === 1 };
    } catch {}
    return null;
  }

  async getFireSensorSensitivity() {
    try {
      const resp = await this._send(CMD.GET_FIRE_SENSITIVITY, PEER.CONTROLLER, Buffer.alloc(1));
      if (resp?.data && resp.data.length >= 3) return { sensitivity: resp.data.readUInt16LE(1) };
    } catch {}
    return null;
  }

  async getCrosshairOffset() {
    try {
      const resp = await this._send(CMD.GET_CROSSHAIR, PEER.CONTROLLER, Buffer.alloc(1));
      if (resp?.data && resp.data.length >= 9) {
        return { x: resp.data.readFloatLE(1), y: resp.data.readFloatLE(5) };
      }
    } catch {}
    return null;
  }

  // ══════════════════════════════════════════
  // FILE TRANSFER (compressed, with correct chunk size)
  // ══════════════════════════════════════════

  async uploadAndPrint(filename, buffer) {
    const zlib = await import('node:zlib');
    const crypto = await import('node:crypto');
    const compressed = zlib.deflateRawSync(buffer);
    const md5 = crypto.createHash('md5').update(buffer).digest('hex');
    const chunkSize = 960; // Luban uses 960-byte chunks for compressed

    // Start compressed transfer — 0xb0, 0x10
    const nameBuf = helper.stringToBuffer(filename);
    const startPayload = Buffer.alloc(nameBuf.length + 4 + 4 + 32 + 1);
    let off = 0;
    nameBuf.copy(startPayload, off); off += nameBuf.length;
    startPayload.writeUInt32LE(buffer.length, off); off += 4;
    startPayload.writeUInt32LE(compressed.length, off); off += 4;
    Buffer.from(md5, 'utf8').copy(startPayload, off); off += 32;
    startPayload[off] = 0; // head type (3D print = 0)

    await this._send(CMD.COMPRESSED_START, PEER.CONTROLLER, startPayload.subarray(0, off + 1));

    // Send chunks — 0xb0, 0x11
    const totalChunks = Math.ceil(compressed.length / chunkSize);
    for (let i = 0; i < totalChunks; i++) {
      const start = i * chunkSize;
      const chunk = compressed.subarray(start, Math.min(start + chunkSize, compressed.length));
      const payload = Buffer.alloc(6 + chunk.length);
      payload.writeUInt16LE(i, 0);
      payload.writeUInt32LE(chunk.length, 2);
      chunk.copy(payload, 6);
      await this._send(CMD.COMPRESSED_DATA, PEER.CONTROLLER, payload);
    }

    log.info(`File uploaded: ${filename} (${buffer.length} bytes, ${totalChunks} chunks)`);

    // Start print via screen — 0xb0, 0x08
    const headType = 0; // 3D printing
    const printPayload = Buffer.alloc(nameBuf.length + 32 + 1);
    off = 0;
    printPayload[off] = headType; off += 1;
    nameBuf.copy(printPayload, off); off += nameBuf.length;
    Buffer.from(md5, 'utf8').copy(printPayload, off);

    await this._send(CMD.SCREEN_PRINT, PEER.SCREEN, printPayload);

    return { filename, md5 };
  }

  // ══════════════════════════════════════════
  // PRINTER INFO & CAMERA
  // ══════════════════════════════════════════

  async getPrinterInfo() {
    return {
      ...this._machineInfo,
      modules: this._modules,
      buildVolume: this._machineSize,
      errors: this.state._errors || [],
    };
  }

  async getCameraFrame() { return null; } // SACP machines don't expose camera via API
  getSnapshotUrl() { return null; }

  // ══════════════════════════════════════════
  // INTERNAL HELPERS
  // ══════════════════════════════════════════

  async _send(cmd, peer, payload) {
    return this._dispatcher.send(cmd.set, cmd.id, peer, payload);
  }

  _parseModules(data) {
    const modules = [];
    try {
      // Use SDK ModuleInfo parser if available
      const ModuleInfo = require('@snapmaker/snapmaker-sacp-sdk/dist/models/ModuleInfo').default;
      if (ModuleInfo?.parseArray) {
        const parsed = ModuleInfo.parseArray(data);
        for (const m of parsed) {
          modules.push({
            moduleId: m.moduleId,
            name: MODULE_NAMES[m.moduleId] || `Module ${m.moduleId}`,
            index: m.moduleIndex,
            state: m.moduleState, // 0=NORMAL, 1=UPGRADING, 2=UNAVAIL
            serialNumber: m.serialNumber,
            hardwareVersion: m.hardwareVersion,
            firmwareVersion: m.moduleFirmwareVersion || '',
          });
        }
        return modules;
      }
    } catch {}

    // Fallback: simple parsing
    try {
      const count = data[0];
      let offset = 1;
      for (let i = 0; i < count && offset + 2 <= data.length; i++) {
        const moduleId = data.readUInt16LE(offset);
        modules.push({ moduleId, name: MODULE_NAMES[moduleId] || `Module ${moduleId}` });
        offset += 30;
      }
    } catch {}
    return modules;
  }

  _parseErrors(data) {
    const errors = [];
    try {
      const count = data[0];
      let offset = 1;
      for (let i = 0; i < count && offset + 4 <= data.length; i++) {
        const code = data.readUInt16LE(offset);
        const severity = data[offset + 2];
        errors.push({ code, severity });
        offset += 4;
      }
    } catch {}
    return errors;
  }

  _scheduleReconnect() {
    this._clearTimers();
    this._reconnectTimer = setTimeout(() => this._connect(), this._reconnectDelay);
  }

  _clearTimers() {
    if (this._reconnectTimer) { clearTimeout(this._reconnectTimer); this._reconnectTimer = null; }
    if (this._heartbeatTimer) { clearInterval(this._heartbeatTimer); this._heartbeatTimer = null; }
  }
}

export function buildSacpCommand(msg) {
  return { _sacp_action: msg.action, ...msg };
}
