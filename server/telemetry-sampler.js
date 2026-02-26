import { insertTelemetryBatch, purgeTelemetry } from './database.js';

export class TelemetrySampler {
  constructor(printerId, options = {}) {
    this.printerId = printerId;
    this.printInterval = options.printInterval || 30000;
    this.idleInterval = options.idleInterval || 300000;
    this.batchSize = options.batchSize || 10;
    this.retentionDays = options.retentionDays || 30;

    this.buffer = [];
    this.lastSample = 0;
    this.isPrinting = false;
    this.purgeTimer = null;

    this._schedulePurge();
  }

  update(printData) {
    if (!printData) return;

    this.isPrinting = ['RUNNING', 'PAUSE', 'PREPARE'].includes(printData.gcode_state);
    const interval = this.isPrinting ? this.printInterval : this.idleInterval;
    const now = Date.now();

    if (now - this.lastSample < interval) return;
    this.lastSample = now;

    this.buffer.push({
      printer_id: this.printerId,
      timestamp: new Date().toISOString(),
      nozzle_temp: printData.nozzle_temper ?? null,
      bed_temp: printData.bed_temper ?? null,
      chamber_temp: printData.chamber_temper ?? null,
      nozzle_target: printData.nozzle_target_temper ?? null,
      bed_target: printData.bed_target_temper ?? null,
      fan_cooling: parseInt(printData.cooling_fan_speed) || 0,
      fan_aux: parseInt(printData.big_fan1_speed) || 0,
      fan_chamber: parseInt(printData.big_fan2_speed) || 0,
      fan_heatbreak: parseInt(printData.heatbreak_fan_speed) || 0,
      speed_mag: printData.spd_mag ?? null,
      wifi_signal: printData.wifi_signal || null,
      print_progress: printData.mc_percent ?? null,
      layer_num: printData.layer_num ?? null
    });

    if (this.buffer.length >= this.batchSize) {
      this._flush();
    }
  }

  _flush() {
    if (this.buffer.length === 0) return;
    try {
      insertTelemetryBatch(this.buffer);
      this.buffer = [];
    } catch (e) {
      console.error(`[telemetry:${this.printerId}] Flush feilet:`, e.message);
    }
  }

  _schedulePurge() {
    this.purgeTimer = setInterval(() => {
      try {
        purgeTelemetry(this.retentionDays);
      } catch (e) {
        console.error('[telemetry] Purge feilet:', e.message);
      }
    }, 6 * 60 * 60 * 1000);
  }

  stop() {
    this._flush();
    if (this.purgeTimer) clearInterval(this.purgeTimer);
  }
}
