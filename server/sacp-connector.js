/**
 * Snapmaker SACP Connector
 * Full-featured connector for Snapmaker machines using SACP protocol:
 * - J1, J1s (IDEX, TCP port 8888)
 * - Artisan (TCP port 8888)
 * - A150, A250, A350 (TCP port 8888)
 *
 * Uses @snapmaker/snapmaker-sacp-sdk for protocol handling
 * and subscribes to real-time status updates.
 *
 * Protocol reference: https://github.com/Snapmaker/Snapmaker-SACP
 * Luban reference: https://github.com/Snapmaker/Luban
 */

import { createConnection } from 'node:net';
import { Dispatcher, helper } from '@snapmaker/snapmaker-sacp-sdk';

const log = {
  info: (...a) => console.log('[sacp]', ...a),
  warn: (...a) => console.warn('[sacp]', ...a),
  error: (...a) => console.error('[sacp]', ...a),
};

// SACP Command Sets and IDs (from protocol docs + Luban source)
const CMD = {
  // System (0x01)
  SUBSCRIBE:      [0x01, 0x00],
  EXECUTE_GCODE:  [0x01, 0x02],
  GET_MODULE_INFO:[0x01, 0x20],
  GET_MACHINE_INFO:[0x01, 0x21],

  // Print (0x04)
  START_PRINT:    [0x04, 0x00],
  PAUSE_PRINT:    [0x04, 0x02],
  RESUME_PRINT:   [0x04, 0x04],
  STOP_PRINT:     [0x04, 0x06],

  // File transfer (0xb0)
  FILE_START:     [0xb0, 0x10],
  FILE_DATA:      [0xb0, 0x11],

  // Subscriptions (response command sets)
  NOZZLE_INFO:        [0xa0, 0x01],
  HOTBED_TEMP:        [0xa0, 0x02],
  COORDINATE_INFO:    [0xa0, 0x04],
  PRINT_PROGRESS:     [0xa0, 0x05],
  PRINT_TIME:         [0xa0, 0x06],
  PRINT_CURRENT_LINE: [0xa0, 0x07],
  GCODE_FILE_INFO:    [0xa0, 0x08],
  MACHINE_STATE:      [0xa0, 0x0a],
  ENCLOSURE_INFO:     [0xa0, 0x0e],
  PURIFIER_INFO:      [0xa0, 0x0f],
};

// Peer IDs
const PEER_CONTROLLER = 0x01;

// Machine model mapping
const MODEL_MAP = {
  0: 'Snapmaker 2.0 A150', 1: 'Snapmaker 2.0 A250', 2: 'Snapmaker 2.0 A350',
  3: 'Snapmaker Artisan', 4: 'Snapmaker J1', 5: 'Snapmaker Ray',
};

// SACP machine state mapping → internal gcode_state
const STATE_MAP = {
  0: 'IDLE',      // Idle
  1: 'RUNNING',   // Running
  2: 'PAUSE',     // Paused
  3: 'PAUSE',     // Stopped (pausing)
  4: 'FINISH',    // Finished
};

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
    this._subscriptions = [];
    this.onFirmwareInfo = null;
    this.onXcamEvent = null;

    // Machine info (populated on connect)
    this._machineInfo = null;
    this._modules = [];
  }

  // ── Connection lifecycle ──

  connect() {
    log.info(`Connecting to SACP at ${this.ip}:${this.port}`);
    this._connect();
  }

  disconnect() {
    this.connected = false;
    this._clearTimers();
    if (this._dispatcher) { this._dispatcher.dispose(); this._dispatcher = null; }
    if (this._socket) { this._socket.destroy(); this._socket = null; }
  }

  _connect() {
    this._clearTimers();

    this._socket = createConnection({ host: this.ip, port: this.port }, () => {
      log.info(`TCP connected to ${this.ip}:${this.port}`);
      this._initDispatcher();
      this._authenticate();
    });

    this._socket.on('error', (err) => {
      if (this.connected) {
        this.connected = false;
        this.hub.broadcast('connection', { status: 'disconnected' });
        log.warn(`SACP error: ${err.message}`);
      }
      this._scheduleReconnect();
    });

    this._socket.on('close', () => {
      if (this.connected) {
        this.connected = false;
        this.hub.broadcast('connection', { status: 'disconnected' });
        log.warn('SACP connection closed');
      }
      this._scheduleReconnect();
    });
  }

  _initDispatcher() {
    this._dispatcher = new Dispatcher('tcp', this._socket);

    // Handle incoming subscription data
    this._dispatcher.setHandler(...CMD.NOZZLE_INFO, (req) => {
      this._handleNozzleInfo(req.data);
      this._dispatcher.ack(...CMD.NOZZLE_INFO, req.packet, Buffer.alloc(1));
    });

    this._dispatcher.setHandler(...CMD.HOTBED_TEMP, (req) => {
      this._handleHotbedTemp(req.data);
      this._dispatcher.ack(...CMD.HOTBED_TEMP, req.packet, Buffer.alloc(1));
    });

    this._dispatcher.setHandler(...CMD.COORDINATE_INFO, (req) => {
      this._handleCoordinateInfo(req.data);
      this._dispatcher.ack(...CMD.COORDINATE_INFO, req.packet, Buffer.alloc(1));
    });

    this._dispatcher.setHandler(...CMD.PRINT_PROGRESS, (req) => {
      this._handlePrintProgress(req.data);
      this._dispatcher.ack(...CMD.PRINT_PROGRESS, req.packet, Buffer.alloc(1));
    });

    this._dispatcher.setHandler(...CMD.PRINT_TIME, (req) => {
      this._handlePrintTime(req.data);
      this._dispatcher.ack(...CMD.PRINT_TIME, req.packet, Buffer.alloc(1));
    });

    this._dispatcher.setHandler(...CMD.GCODE_FILE_INFO, (req) => {
      this._handleGcodeFileInfo(req.data);
      this._dispatcher.ack(...CMD.GCODE_FILE_INFO, req.packet, Buffer.alloc(1));
    });

    this._dispatcher.setHandler(...CMD.MACHINE_STATE, (req) => {
      this._handleMachineState(req.data);
      this._dispatcher.ack(...CMD.MACHINE_STATE, req.packet, Buffer.alloc(1));
    });

    this._dispatcher.setHandler(...CMD.ENCLOSURE_INFO, (req) => {
      this._handleEnclosureInfo(req.data);
      this._dispatcher.ack(...CMD.ENCLOSURE_INFO, req.packet, Buffer.alloc(1));
    });

    this._dispatcher.setHandler(...CMD.PURIFIER_INFO, (req) => {
      this._handlePurifierInfo(req.data);
      this._dispatcher.ack(...CMD.PURIFIER_INFO, req.packet, Buffer.alloc(1));
    });
  }

  async _authenticate() {
    try {
      // WiFi connection handshake (from Luban: SacpClient.wifiConnection)
      const hostname = require('node:os').hostname();
      const connInfo = Buffer.alloc(200);
      let off = 0;
      const hostBuf = helper.stringToBuffer(hostname);
      hostBuf.copy(connInfo, off); off += hostBuf.length;
      const appBuf = helper.stringToBuffer('3DPrintForge');
      appBuf.copy(connInfo, off); off += appBuf.length;
      const tokenBuf = helper.stringToBuffer('');
      tokenBuf.copy(connInfo, off); off += tokenBuf.length;

      await this._dispatcher.send(0xa0, 0x00, PEER_CONTROLLER, connInfo.subarray(0, off));
      log.info('SACP authenticated');

      // Get machine info
      await this._fetchMachineInfo();

      // Start subscriptions
      await this._startSubscriptions();

      // Mark as connected
      this.connected = true;
      this.hub.broadcast('connection', { status: 'connected' });

      // Start heartbeat
      this._startHeartbeat();

    } catch (err) {
      log.error(`SACP auth failed: ${err.message}`);
      this._scheduleReconnect();
    }
  }

  async _fetchMachineInfo() {
    try {
      const resp = await this._dispatcher.send(...CMD.GET_MACHINE_INFO, PEER_CONTROLLER, Buffer.alloc(0));
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
            name: 'sacp',
            sw_ver: this._machineInfo.firmwareVersion,
            hw_ver: this._machineInfo.model,
            sn: this._machineInfo.serialNumber,
          });
        }

        log.info(`Machine: ${this._machineInfo.model}, FW: ${this._machineInfo.firmwareVersion}`);
      }
    } catch (e) { log.warn(`Failed to get machine info: ${e.message}`); }

    // Get module list
    try {
      const resp = await this._dispatcher.send(...CMD.GET_MODULE_INFO, PEER_CONTROLLER, Buffer.alloc(0));
      if (resp?.data) {
        this._modules = this._parseModules(resp.data);
        log.info(`Modules: ${this._modules.map(m => m.name).join(', ')}`);
      }
    } catch (e) { log.warn(`Failed to get modules: ${e.message}`); }
  }

  async _startSubscriptions() {
    const subs = [
      CMD.NOZZLE_INFO,
      CMD.HOTBED_TEMP,
      CMD.COORDINATE_INFO,
      CMD.PRINT_PROGRESS,
      CMD.PRINT_TIME,
      CMD.GCODE_FILE_INFO,
      CMD.MACHINE_STATE,
      CMD.ENCLOSURE_INFO,
      CMD.PURIFIER_INFO,
    ];

    for (const [cmdSet, cmdId] of subs) {
      try {
        const intervalBuf = Buffer.alloc(2);
        intervalBuf.writeUInt16LE(1000); // 1 second interval
        await this._dispatcher.send(0x01, 0x00, PEER_CONTROLLER,
          Buffer.from([cmdSet, cmdId, ...intervalBuf]));
        this._subscriptions.push([cmdSet, cmdId]);
      } catch (e) {
        log.warn(`Subscription ${cmdSet.toString(16)}:${cmdId.toString(16)} failed: ${e.message}`);
      }
    }
  }

  _startHeartbeat() {
    this._heartbeatTimer = setInterval(async () => {
      if (!this.connected || !this._dispatcher) return;
      try {
        // WiFi heartbeat (from Luban: SacpClient.wifiConnectionHeartBeat)
        await this._dispatcher.send(0xa0, 0x01, PEER_CONTROLLER, Buffer.alloc(0));
      } catch {
        // Heartbeat failed — connection may be dead
        if (this.connected) {
          this.connected = false;
          this.hub.broadcast('connection', { status: 'disconnected' });
        }
        this._scheduleReconnect();
      }
    }, 5000);
  }

  // ── Subscription data handlers ──

  _handleNozzleInfo(data) {
    if (!data || data.length < 4) return;
    // ExtruderInfo format: key(1) + count(1) + [actual(2) + target(2)] per nozzle
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
    // BedInfo: key(1) + zone_count(1) + [actual(2) + target(2)] per zone
    if (data.length >= 6) {
      this.state.bed_temper = Math.round(data.readInt16LE(2) / 10);
      this.state.bed_target_temper = Math.round(data.readInt16LE(4) / 10);
    }
    this._broadcastState();
  }

  _handleCoordinateInfo(data) {
    if (!data || data.length < 5) return;
    // CoordinateInfo array: count(1) + [key(1) + value(4)] per axis
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
    if (!data || data.length < 8) return;
    // elapsed(4) + remaining(4)
    const elapsed = data.readUInt32LE(0);
    const remaining = data.readUInt32LE(4);
    this.state.print_duration_seconds = elapsed;
    this.state.mc_remaining_time = Math.round(remaining / 60);
    this._broadcastState();
  }

  _handleGcodeFileInfo(data) {
    if (!data || data.length < 2) return;
    try {
      const { result: name } = helper.readString(data, 0);
      if (name) this.state.subtask_name = name;
    } catch {}
  }

  _handleMachineState(data) {
    if (!data || data.length < 1) return;
    const machineState = data[0];
    this.state.gcode_state = STATE_MAP[machineState] ?? 'IDLE';
    this._broadcastState();
  }

  _handleEnclosureInfo(data) {
    if (!data || data.length < 4) return;
    // Enclosure: led_state(1) + fan_state(1) + door_state(1) + temperature(2)
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

  // ── Commands ──

  sendCommand(commandObj) {
    if (!this.connected || !this._dispatcher) return;
    const action = commandObj._sacp_action || commandObj.action;

    switch (action) {
      case 'pause':
        this._dispatcher.send(...CMD.PAUSE_PRINT, PEER_CONTROLLER, Buffer.alloc(0));
        break;
      case 'resume':
        this._dispatcher.send(...CMD.RESUME_PRINT, PEER_CONTROLLER, Buffer.alloc(0));
        break;
      case 'stop':
        this._dispatcher.send(...CMD.STOP_PRINT, PEER_CONTROLLER, Buffer.alloc(0));
        break;
      case 'gcode':
        if (commandObj.gcode) this._executeGcode(commandObj.gcode);
        break;
      case 'speed':
        this._executeGcode(`M220 S${commandObj.value || 100}`);
        break;
      case 'set_nozzle_temp':
      case 'set_temp_nozzle':
        this._executeGcode(`M104 S${commandObj.target || 0}`);
        break;
      case 'set_bed_temp':
      case 'set_temp_bed':
        this._executeGcode(`M140 S${commandObj.target || 0}`);
        break;
      case 'set_fan':
        this._executeGcode(`M106 S${Math.round((commandObj.value || 0) * 2.55)}`);
        break;
      case 'home':
        this._executeGcode('G28');
        break;
      case 'light':
        this._setEnclosureLight(commandObj.mode === 'on');
        break;
      case 'emergency_stop':
        this._executeGcode('M112');
        break;
      // J1 IDEX modes (M605)
      case 'idex_single_left':
        this._executeGcode('M605 S0\nT0'); // Single mode, left extruder
        break;
      case 'idex_single_right':
        this._executeGcode('M605 S0\nT1'); // Single mode, right extruder
        break;
      case 'idex_duplicate':
        this._executeGcode('M605 S2'); // Duplication mode
        break;
      case 'idex_mirror':
        this._executeGcode('M605 S3'); // Mirror mode
        break;
      case 'idex_backup':
        this._executeGcode('M605 S4'); // Backup mode (J1-specific)
        break;
      default:
        log.warn(`Unknown SACP command: ${action}`);
    }
  }

  async _executeGcode(gcode) {
    const lines = gcode.split('\n').map(l => l.trim()).filter(Boolean);
    for (const line of lines) {
      try {
        const buf = Buffer.from(line + '\n', 'utf8');
        await this._dispatcher.send(...CMD.EXECUTE_GCODE, PEER_CONTROLLER, buf);
      } catch (e) {
        log.error(`G-code failed: ${line}: ${e.message}`);
      }
    }
  }

  async _setEnclosureLight(on) {
    // Enclosure LED via gcode
    this._executeGcode(on ? 'M1010 S1' : 'M1010 S0');
  }

  // ── File transfer ──

  async uploadAndPrint(filename, buffer) {
    // Compressed file transfer (zlib deflate + chunked)
    const zlib = await import('node:zlib');
    const compressed = zlib.deflateSync(buffer);
    const md5 = (await import('node:crypto')).createHash('md5').update(buffer).digest('hex');
    const chunkSize = 512;

    // Start file transfer
    const startPayload = Buffer.alloc(200);
    let off = 0;
    const nameBuf = helper.stringToBuffer(filename);
    nameBuf.copy(startPayload, off); off += nameBuf.length;
    startPayload.writeUInt32LE(buffer.length, off); off += 4;
    startPayload.writeUInt32LE(compressed.length, off); off += 4;
    const md5Buf = Buffer.from(md5, 'utf8');
    md5Buf.copy(startPayload, off); off += md5Buf.length;

    await this._dispatcher.send(...CMD.FILE_START, PEER_CONTROLLER, startPayload.subarray(0, off));

    // Send chunks
    for (let i = 0; i < compressed.length; i += chunkSize) {
      const chunk = compressed.subarray(i, Math.min(i + chunkSize, compressed.length));
      const payload = Buffer.alloc(6 + chunk.length);
      payload.writeUInt16LE(Math.floor(i / chunkSize), 0); // chunk index
      payload.writeUInt32LE(chunk.length, 2);
      chunk.copy(payload, 6);
      await this._dispatcher.send(...CMD.FILE_DATA, PEER_CONTROLLER, payload);
    }

    log.info(`File uploaded: ${filename} (${buffer.length} bytes)`);
    return { filename };
  }

  // ── Printer info ──

  async getPrinterInfo() {
    return {
      ...this._machineInfo,
      modules: this._modules,
    };
  }

  async getCameraFrame() {
    // SACP printers don't have camera API — return null
    return null;
  }

  getSnapshotUrl() {
    return null;
  }

  // ── Module parsing ──

  _parseModules(data) {
    const modules = [];
    const MODULE_NAMES = {
      0: '3D Print Head', 1: 'CNC Router', 2: '1.6W Laser',
      7: 'Air Purifier', 13: 'Dual Extruder', 14: '10W Laser',
      16: 'Enclosure', 19: '20W Laser', 20: '40W Laser',
    };

    try {
      const count = data[0];
      let offset = 1;
      for (let i = 0; i < count && offset < data.length; i++) {
        const moduleId = data.readUInt16LE(offset);
        const name = MODULE_NAMES[moduleId] || `Module ${moduleId}`;
        modules.push({ moduleId, name });
        offset += 30; // approximate module entry size
      }
    } catch {}
    return modules;
  }

  // ── Timers ──

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
