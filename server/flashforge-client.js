/**
 * FlashForgeClient — native FNet TCP-socket protocol on port 8899.
 *
 * Used by FlashForge Adventurer 5M / 5M Pro / AD5X / Creator 4 / Guider 3
 * when the user has NOT installed a Klipper mod (and is therefore not
 * reachable via Moonraker). Reverse-engineered from community sources
 * (ProtoLabs/flashforge-finder-api, octoprint-flashforge plugin).
 *
 * Wire format: ASCII commands `~M<id> <args>\r\n` sent over TCP. Each
 * response is terminated by `\r\nok\r\n`. Login (`~M601 S1`) is required
 * before any other command. Most printers idle-disconnect after ~5s of
 * silence so we keep a heartbeat (status poll) running.
 */

import net from 'node:net';
import { createLogger } from './logger.js';
const log = createLogger('flashforge');

const RESPONSE_TIMEOUT_MS = 5000;
const HEARTBEAT_MS = 3000;
const PORT = 8899;

export class FlashForgeClient {
  constructor(config, hub) {
    this.ip = config.printer.ip;
    this.printerId = config.printer.id;
    this.hub = hub;
    this.connected = false;
    this.state = {};
    this._socket = null;
    this._buffer = '';
    this._cmdQueue = [];
    this._currentCmd = null;
    this._heartbeat = null;
    this._reconnectTimer = null;
  }

  connect() {
    if (this._socket) return;
    log.info(`FlashForge connecting to ${this.ip}:${PORT}`);
    const socket = net.createConnection({ host: this.ip, port: PORT });
    this._socket = socket;
    socket.setEncoding('utf8');
    socket.on('connect', () => this._onConnect());
    socket.on('data', (chunk) => this._onData(chunk));
    socket.on('error', (e) => log.warn(`FlashForge socket error: ${e.message}`));
    socket.on('close', () => this._onClose());
  }

  disconnect() {
    if (this._reconnectTimer) { clearTimeout(this._reconnectTimer); this._reconnectTimer = null; }
    if (this._heartbeat) { clearInterval(this._heartbeat); this._heartbeat = null; }
    if (this._socket) { try { this._socket.destroy(); } catch {} this._socket = null; }
    this.connected = false;
  }

  async _onConnect() {
    try {
      // FNet requires login before any other command.
      await this._send('~M601 S1');
      this.connected = true;
      log.info(`FlashForge connected: ${this.ip}`);
      this._startHeartbeat();
    } catch (e) {
      log.warn(`FlashForge login failed: ${e.message}`);
      this._scheduleReconnect();
    }
  }

  _onClose() {
    this.connected = false;
    this._socket = null;
    if (this._heartbeat) { clearInterval(this._heartbeat); this._heartbeat = null; }
    this._scheduleReconnect();
  }

  _scheduleReconnect() {
    if (this._reconnectTimer) return;
    this._reconnectTimer = setTimeout(() => {
      this._reconnectTimer = null;
      this.connect();
    }, 5000);
  }

  _onData(chunk) {
    this._buffer += chunk;
    // Each response ends with "\r\nok\r\n" (or "\r\nFailure\r\n").
    let end;
    while ((end = this._buffer.indexOf('\r\nok\r\n')) !== -1) {
      const response = this._buffer.slice(0, end);
      this._buffer = this._buffer.slice(end + 6);
      this._resolveCurrent({ ok: true, body: response });
    }
    let fail;
    while ((fail = this._buffer.indexOf('\r\nFailure\r\n')) !== -1) {
      const response = this._buffer.slice(0, fail);
      this._buffer = this._buffer.slice(fail + 11);
      this._resolveCurrent({ ok: false, body: response });
    }
  }

  _resolveCurrent(result) {
    if (this._currentCmd) {
      const { resolve, timer } = this._currentCmd;
      clearTimeout(timer);
      this._currentCmd = null;
      resolve(result);
    }
    this._processQueue();
  }

  _send(command) {
    return new Promise((resolve, reject) => {
      const job = {
        command,
        resolve,
        reject,
        timer: null,
      };
      this._cmdQueue.push(job);
      this._processQueue();
    });
  }

  _processQueue() {
    if (this._currentCmd || this._cmdQueue.length === 0) return;
    if (!this._socket || this._socket.destroyed) return;
    const job = this._cmdQueue.shift();
    this._currentCmd = job;
    job.timer = setTimeout(() => {
      this._currentCmd = null;
      job.reject(new Error('FlashForge command timeout'));
      this._processQueue();
    }, RESPONSE_TIMEOUT_MS);
    this._socket.write(`${job.command}\r\n`);
  }

  _startHeartbeat() {
    if (this._heartbeat) clearInterval(this._heartbeat);
    this._heartbeat = setInterval(() => this._poll(), HEARTBEAT_MS);
    this._poll();
  }

  async _poll() {
    try {
      const status = await this._send('~M119');           // machine status
      const temps = await this._send('~M105');            // temperatures
      const progress = await this._send('~M27').catch(() => ({ ok: false, body: '' })); // print progress
      this.state = this._parseStatus(status.body, temps.body, progress.body);
      this.hub?.broadcast?.('status', { printer_id: this.printerId, ...this.state });
    } catch (e) {
      log.warn(`FlashForge poll failed: ${e.message}`);
    }
  }

  _parseStatus(statusBody, tempsBody, progressBody) {
    const out = { gcode_state: 'OFFLINE', _flashforge_status: 'unknown' };

    // M119 returns "Endstop: ..." plus "MachineStatus:" line.
    const ms = /MachineStatus\s*:\s*(\w+)/i.exec(statusBody || '');
    if (ms) {
      const s = ms[1].toUpperCase();
      out._flashforge_status = s.toLowerCase();
      if (s === 'BUILDING_FROM_SD') out.gcode_state = 'RUNNING';
      else if (s === 'PAUSED') out.gcode_state = 'PAUSE';
      else if (s === 'READY' || s === 'IDLE') out.gcode_state = 'IDLE';
      else if (s.includes('ERROR')) out.gcode_state = 'FAILED';
    }

    // M105: T0:215.0/220.0 T1:0.0/0.0 B:60.0/60.0
    const tNoz = /T0\s*:\s*([\d.]+)\s*\/\s*([\d.]+)/i.exec(tempsBody || '');
    if (tNoz) { out.nozzle_temper = parseFloat(tNoz[1]); out.nozzle_target_temper = parseFloat(tNoz[2]); }
    const tBed = /B\s*:\s*([\d.]+)\s*\/\s*([\d.]+)/i.exec(tempsBody || '');
    if (tBed) { out.bed_temper = parseFloat(tBed[1]); out.bed_target_temper = parseFloat(tBed[2]); }

    // M27: SD printing byte X/Y or Done printing
    const prog = /SD\s+printing\s+byte\s+(\d+)\s*\/\s*(\d+)/i.exec(progressBody || '');
    if (prog) {
      const cur = parseFloat(prog[1]); const total = parseFloat(prog[2]);
      if (total > 0) out.mc_percent = Math.round((cur / total) * 100);
    } else if (/Not\s*printing/i.test(progressBody || '')) {
      out.mc_percent = 0;
    }

    return out;
  }

  // ── Command interface ──────────────────────────────────────────────

  async sendCommand(commandObj) {
    const action = commandObj.action || commandObj._flashforge_action;
    switch (action) {
      case 'pause':     return this._send('~M25');
      case 'resume':    return this._send('~M24');
      case 'stop':      return this._send('~M26');
      case 'home':      return this._send('~G28');
      case 'emergency_stop': return this._send('~M112');
      case 'set_temp_nozzle': return this._send(`~M104 S${commandObj.target || 0}`);
      case 'set_temp_bed':    return this._send(`~M140 S${commandObj.target || 0}`);
      case 'set_fan':         return this._send(`~M106 S${Math.round((commandObj.value || 0) * 2.55)}`);
      case 'speed':           return this._send(`~M220 S${commandObj.value || 100}`);
      case 'flowrate':        return this._send(`~M221 S${commandObj.value || 100}`);
      case 'gcode':           return this._send(`~${commandObj.gcode || ''}`);
      case 'light':
        return this._send(commandObj.mode === 'on' ? '~M146 r255 g255 b255' : '~M146 r0 g0 b0');
      case 'select_file':     return this._send(`~M23 ${commandObj.filename}`);
      case 'start_file':      return this._send('~M24');
      case 'jog':
        return this._send(`~G91\r\n~G1 X${commandObj.x || 0} Y${commandObj.y || 0} Z${commandObj.z || 0} F3000\r\n~G90`);
      default:
        log.warn(`Unknown FlashForge command: ${action}`);
    }
  }

  // ── File operations ────────────────────────────────────────────────

  /**
   * Upload a G-code file via FNet's chunked binary transfer.
   * Sequence: M28 to begin → 4-byte length + payload chunks → M29 to finalise.
   */
  async uploadFile(filename, buffer) {
    if (!this.connected) throw new Error('FlashForge not connected');
    const safe = String(filename).replace(/[^a-zA-Z0-9._-]/g, '_');
    // Begin upload — M28 with size + filename.
    await this._send(`~M28 ${buffer.length} 0:/user/${safe}`);
    // Send file body in 4 KB chunks via raw socket write (not queued).
    if (this._socket && !this._socket.destroyed) {
      const chunkSize = 4096;
      for (let i = 0; i < buffer.length; i += chunkSize) {
        this._socket.write(buffer.slice(i, i + chunkSize));
      }
    }
    // Finalise.
    await this._send('~M29');
    return { ok: true, uploaded: safe, path: `0:/user/${safe}` };
  }

  async uploadAndPrint(filename, buffer) {
    const result = await this.uploadFile(filename, buffer);
    await this.sendCommand({ action: 'select_file', filename: result.path });
    await this.sendCommand({ action: 'start_file' });
    return { ...result, started: true };
  }

  async listFiles() {
    const res = await this._send('~M661');  // FNet list files
    const lines = (res.body || '').split(/\r?\n/).filter(l => l.includes('.g'));
    return lines.map(l => ({ name: l.trim() }));
  }

  async getPrinterInfo() {
    const fw = await this._send('~M115');
    return { firmware: fw.body, ip: this.ip, port: PORT };
  }
}

export function buildFlashForgeCommand(msg) {
  return { _flashforge_action: msg.action, ...msg };
}
