import { getProtectionSettings, upsertProtectionSettings, addProtectionLog, getProtectionLog, resolveProtectionAlert, getActiveAlerts, clearProtectionLog } from './database.js';
import { buildPauseCommand, buildStopCommand } from './mqtt-commands.js';
import { createLogger } from './logger.js';
const log = createLogger('guard');

const ACTION_MAP = {
  spaghetti_detected: 'spaghetti_action',
  first_layer_issue: 'first_layer_action',
  foreign_object: 'foreign_object_action',
  nozzle_clump: 'nozzle_clump_action',
  temp_deviation: 'temp_deviation_action',
  filament_runout: 'filament_runout_action',
  print_error: 'print_error_action',
  fan_failure: 'fan_failure_action',
  print_stall: 'print_stall_action'
};

const EVENT_LABELS = {
  spaghetti_detected: 'Spaghetti detected',
  first_layer_issue: 'First layer issue',
  foreign_object: 'Foreign object detected',
  nozzle_clump: 'Nozzle clump detected',
  temp_deviation: 'Temperature deviation',
  filament_runout: 'Filament low/runout',
  print_error: 'Printer error',
  fan_failure: 'Fan failure',
  print_stall: 'Print stalled'
};

const ACTION_LABELS = { notify: 'Notify only', pause: 'Print paused', stop: 'Print stopped' };

const DEFAULT_SETTINGS = {
  enabled: 1,
  spaghetti_action: 'pause',
  first_layer_action: 'notify',
  foreign_object_action: 'pause',
  nozzle_clump_action: 'pause',
  temp_deviation_action: 'notify',
  filament_runout_action: 'notify',
  print_error_action: 'notify',
  fan_failure_action: 'notify',
  print_stall_action: 'notify',
  cooldown_seconds: 300,
  auto_resume: 0,
  temp_deviation_threshold: 25,
  filament_low_pct: 5,
  stall_minutes: 10
};

export class PrintGuardService {
  constructor(printerManager, notifier, broadcast) {
    this.pm = printerManager;
    this.notifier = notifier;
    this.broadcast = broadcast;
    this._cooldowns = new Map(); // printerId:eventType → timestamp
    this._stallTracking = new Map(); // printerId → { percent, layer, since }
    this._lastErrorCode = new Map(); // printerId → last error code
  }

  // Called from XCam events (camera AI detection)
  handleEvent(printerId, eventType, printId) {
    this._processEvent(printerId, eventType, printId);
  }

  // Called on every MQTT status update — checks all sensor data
  processSensorData(printerId, state) {
    try {
      const settings = this._getSettings(printerId);
      if (!settings.enabled) return;

      const gcodeState = state.gcode_state || 'IDLE';
      const isPrinting = gcodeState === 'RUNNING' || gcodeState === 'PAUSE' || gcodeState === 'PREPARE' || gcodeState === 'HEATING';

      // Only monitor sensors during active prints
      if (!isPrinting) {
        // Clear stall tracking when not printing
        this._stallTracking.delete(printerId);
        this._lastErrorCode.delete(printerId);
        return;
      }

      const printer = this.pm.printers.get(printerId);
      const printId = printer?.tracker?.currentPrint?.id || null;

      this._checkTemperature(printerId, state, settings, printId);
      this._checkFilament(printerId, state, settings, printId);
      this._checkPrintError(printerId, state, settings, printId);
      this._checkFans(printerId, state, settings, printId);
      this._checkPrintStall(printerId, state, settings, printId);
    } catch (e) {
      // Silent — don't break MQTT flow
    }
  }

  _checkTemperature(printerId, state, settings, printId) {
    if (settings.temp_deviation_action === 'ignore') return;

    // Only check temperature deviation when actively printing (RUNNING)
    const gcodeState = state.gcode_state;
    if (gcodeState !== 'RUNNING') return;

    const threshold = settings.temp_deviation_threshold || 15;

    // Track target changes to detect ramp-up/ramp-down periods
    // During filament changes or plate transitions, targets shift rapidly
    const trackKey = `${printerId}_temp`;
    const prev = this._tempTargets?.get(trackKey);
    if (!this._tempTargets) this._tempTargets = new Map();

    const nozzleTemp = state.nozzle_temper;
    const nozzleTarget = state.nozzle_target_temper;
    const bedTemp = state.bed_temper;
    const bedTarget = state.bed_target_temper;

    // Detect if target has recently changed (ramping)
    const now = Date.now();
    const isRamping = prev && (
      (prev.nozzleTarget !== nozzleTarget && now - prev.ts < 120000) ||
      (prev.bedTarget !== bedTarget && now - prev.ts < 120000)
    );

    // Update tracking
    if (!prev || prev.nozzleTarget !== nozzleTarget || prev.bedTarget !== bedTarget) {
      this._tempTargets.set(trackKey, { nozzleTarget, bedTarget, ts: now });
    }

    // Skip alerts during temperature ramp (target just changed within 2 min)
    if (isRamping) return;

    // Skip if nozzle target is low (< 150°C) — typically standby/cooldown during print
    if (nozzleTarget != null && nozzleTarget < 150) return;

    // Skip if actual nozzle temp is in standby range (< 160°C) — Bambu printers
    // hold nozzle at ~140°C between color changes/plates while gcode_state is still RUNNING
    // and nozzle_target_temper remains at the print temperature (e.g. 220°C)
    if (nozzleTemp != null && nozzleTemp < 160) return;

    // Check nozzle temperature — only alert if target is stable and temp is way off
    if (nozzleTemp != null && nozzleTarget != null && nozzleTarget >= 150) {
      const diff = Math.abs(nozzleTemp - nozzleTarget);
      if (diff > threshold) {
        // Extra check: if temp is approaching target (moving in right direction), skip
        const prevTemp = prev?.lastNozzleTemp;
        const approaching = prevTemp != null && Math.abs(nozzleTemp - nozzleTarget) < Math.abs(prevTemp - nozzleTarget);
        if (!approaching) {
          this._processEvent(printerId, 'temp_deviation', printId,
            `Nozzle: ${nozzleTemp}°C (mål ${nozzleTarget}°C, avvik ${diff.toFixed(1)}°C)`);
        }
      }
    }

    // Check bed temperature
    if (bedTemp != null && bedTarget != null && bedTarget > 0) {
      const diff = Math.abs(bedTemp - bedTarget);
      if (diff > threshold) {
        const prevBed = prev?.lastBedTemp;
        const approaching = prevBed != null && Math.abs(bedTemp - bedTarget) < Math.abs(prevBed - bedTarget);
        if (!approaching) {
          this._processEvent(printerId, 'temp_deviation', printId,
            `Bed: ${bedTemp}°C (mål ${bedTarget}°C, avvik ${diff.toFixed(1)}°C)`);
        }
      }
    }

    // Store last temps for direction check
    const entry = this._tempTargets.get(trackKey);
    if (entry) { entry.lastNozzleTemp = nozzleTemp; entry.lastBedTemp = bedTemp; }
  }

  _checkFilament(printerId, state, settings, printId) {
    if (settings.filament_runout_action === 'ignore') return;
    const lowPct = settings.filament_low_pct || 5;

    const amsUnits = state.ams?.ams;
    if (!Array.isArray(amsUnits)) return;

    const activeTray = state.ams?.tray_now;

    for (const unit of amsUnits) {
      if (!Array.isArray(unit.tray)) continue;
      for (const tray of unit.tray) {
        if (!tray) continue;
        // Only alert for the active tray or any tray with filament that's critically low
        const remain = tray.remain;
        if (remain == null || remain < 0) continue;

        // Check if this tray is active
        const trayKey = `${unit.id}_${tray.id}`;
        const isActive = activeTray != null && String(activeTray) === String(tray.id);

        if (remain <= lowPct && isActive) {
          const trayName = tray.tray_type || `AMS${unit.id} Slot ${tray.id}`;
          this._processEvent(printerId, 'filament_runout', printId,
            `${trayName}: ${remain}% remaining`);
          return; // Only one alert per cycle
        }
      }
    }
  }

  _checkPrintError(printerId, state, settings, printId) {
    if (settings.print_error_action === 'ignore') return;

    const errorCode = state.print_error;
    if (!errorCode || errorCode === 0 || errorCode === '0') return;

    // Avoid re-alerting for the same error
    const lastError = this._lastErrorCode.get(printerId);
    if (lastError === errorCode) return;
    this._lastErrorCode.set(printerId, errorCode);

    this._processEvent(printerId, 'print_error', printId,
      `Error code: ${errorCode}`);
  }

  _checkFans(printerId, state, settings, printId) {
    if (settings.fan_failure_action === 'ignore') return;

    const gcodeState = state.gcode_state;
    if (gcodeState !== 'RUNNING') return; // Only check during active printing

    // Heatbreak fan should always be running during print
    const heatbreakSpeed = state.heatbreak_fan_speed;
    if (heatbreakSpeed != null && heatbreakSpeed === 0) {
      this._processEvent(printerId, 'fan_failure', printId,
        'Heatbreak fan stopped during print');
      return;
    }

    // If nozzle is at temperature, cooling fan should generally be active
    // (some materials print without part fan, so only check heatbreak)
  }

  _checkPrintStall(printerId, state, settings, printId) {
    if (settings.print_stall_action === 'ignore') return;
    const stallMinutes = settings.stall_minutes || 10;

    const gcodeState = state.gcode_state;
    if (gcodeState !== 'RUNNING') {
      this._stallTracking.delete(printerId);
      return;
    }

    const percent = state.mc_percent || 0;
    const layer = state.layer_num || 0;
    const now = Date.now();

    const prev = this._stallTracking.get(printerId);
    if (!prev) {
      this._stallTracking.set(printerId, { percent, layer, since: now });
      return;
    }

    // Progress changed — reset tracking
    if (percent !== prev.percent || layer !== prev.layer) {
      this._stallTracking.set(printerId, { percent, layer, since: now });
      return;
    }

    // Progress hasn't changed — check if stalled long enough
    const stalledMs = now - prev.since;
    if (stalledMs >= stallMinutes * 60 * 1000) {
      this._processEvent(printerId, 'print_stall', printId,
        `Stuck at ${percent}% layer ${layer} for ${Math.floor(stalledMs / 60000)} min`);
      // Reset so we don't spam (cooldown handles the rest)
      this._stallTracking.set(printerId, { percent, layer, since: now });
    }
  }

  _getSettings(printerId) {
    return getProtectionSettings(printerId) || { ...DEFAULT_SETTINGS, printer_id: printerId };
  }

  // Core event processing — shared by XCam and sensor events
  _processEvent(printerId, eventType, printId, notes) {
    try {
      const settings = this._getSettings(printerId);
      if (!settings.enabled) return;

      const actionKey = ACTION_MAP[eventType];
      if (!actionKey) return;

      const action = settings[actionKey] || 'notify';
      if (action === 'ignore') return;

      // Check cooldown
      const cooldownKey = `${printerId}:${eventType}`;
      const now = Date.now();
      const lastTime = this._cooldowns.get(cooldownKey) || 0;
      if (now - lastTime < (settings.cooldown_seconds || 60) * 1000) return;
      this._cooldowns.set(cooldownKey, now);

      // Execute action
      if (action === 'pause') {
        this._pausePrint(printerId);
      } else if (action === 'stop') {
        this._stopPrint(printerId);
      }

      // Log
      addProtectionLog({
        printer_id: printerId,
        event_type: eventType,
        action_taken: action,
        print_id: printId || null,
        notes: notes || null
      });

      // Broadcast to frontend
      this.broadcast('protection_alert', {
        printerId,
        eventType,
        action,
        notes: notes || null,
        timestamp: new Date().toISOString()
      });

      // Send notification
      if (this.notifier) {
        const printer = this.pm.printers.get(printerId);
        const printerName = printer?.config?.name || printerId;
        this.notifier.notify('protection_alert', {
          printerName,
          printer_id: printerId,
          eventType: EVENT_LABELS[eventType] || eventType,
          action: ACTION_LABELS[action] || action,
          notes: notes || ''
        });
      }
    } catch (e) {
      log.error('Error handling event: ' + e.message);
    }
  }

  _pausePrint(printerId) {
    const printer = this.pm.printers.get(printerId);
    if (!printer?.live || !printer.client) return;
    const cmd = buildPauseCommand();
    printer.client.sendCommand(cmd);
    log.info(`Paused print on ${printerId}`);
  }

  _stopPrint(printerId) {
    const printer = this.pm.printers.get(printerId);
    if (!printer?.live || !printer.client) return;
    const cmd = buildStopCommand();
    printer.client.sendCommand(cmd);
    log.info(`Stopped print on ${printerId}`);
  }

  getStatus(printerId) {
    const settings = this._getSettings(printerId);
    const alerts = getActiveAlerts(printerId);
    return { settings, alerts };
  }

  resolve(logId) {
    resolveProtectionAlert(logId);
    this.broadcast('protection_resolved', { logId });
  }

  getSettings(printerId) {
    return this._getSettings(printerId);
  }

  updateSettings(printerId, settings) {
    upsertProtectionSettings(printerId, settings);
  }

  getLog(printerId, limit) {
    return getProtectionLog(printerId, limit);
  }

  clearLog(printerId, resolvedOnly) {
    clearProtectionLog(printerId, resolvedOnly);
  }

  getAllActiveAlerts() {
    return getActiveAlerts(null);
  }
}
