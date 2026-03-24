import { addHistory, getHistory, addError, getErrors, addAmsSnapshot, getActiveNozzleSession, createNozzleSession, retireNozzleSession, updateNozzleSessionCounters, upsertComponentWear, upsertAmsTrayLifetime, updateAmsTrayFilamentUsed, getSpoolBySlot, useSpoolWeight, savePrintCost, estimatePrintCostAdvanced, lookupNfcTag, linkNfcTag, assignSpoolToSlot, syncAmsToSpool, getActiveLayerPauses, markLayerTriggered, deactivateLayerPauses, addTimeTracking, getInventorySetting, addFilamentUsageSnapshot, getSpoolByTrayIdName, autoMatchTrayToSpool, autoCreateSpoolFromTray, correctRemainWeight, checkSpoolDepletionThresholds, aggregateDailyFilamentUsage, trackConsumedSinceWeight, updateFilamentAccuracy, enrichTrayWithVariant } from './database.js';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { createLogger } from './logger.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const log = createLogger('tracker');
let HMS_CODES = {};
try { HMS_CODES = JSON.parse(readFileSync(join(__dirname, 'hms-codes.json'), 'utf8')); } catch (e) { log.warn('Failed to load HMS codes', e.message); }

export function hmsAttrToHex(attr) {
  if (!attr) return null;
  const s = String(attr);
  // Already in XXXX_XXXX format
  if (/^[0-9a-fA-F]{4}[_-][0-9a-fA-F]{4}$/.test(s)) return s.replace('-', '_').toUpperCase();
  // Decimal number — convert to hex XXXX_XXXX
  const num = parseInt(s, 10);
  if (!isNaN(num)) {
    const hex = num.toString(16).toUpperCase().padStart(8, '0');
    return hex.slice(0, 4) + '_' + hex.slice(4);
  }
  // Hex string without separator
  if (/^[0-9a-fA-F]{6,8}$/.test(s)) {
    const padded = s.toUpperCase().padStart(8, '0');
    return padded.slice(0, 4) + '_' + padded.slice(4);
  }
  return s;
}

export function lookupHmsCode(attr) {
  if (!attr) return null;
  const hexKey = hmsAttrToHex(attr);
  if (!hexKey) return null;
  // Direct lookup
  if (HMS_CODES[hexKey]) return HMS_CODES[hexKey];
  // Try lowercase
  const lower = hexKey.toLowerCase();
  for (const [key, val] of Object.entries(HMS_CODES)) {
    if (key.toLowerCase() === lower) return val;
  }
  // Try without leading zeros
  const short = hexKey.replace(/^0+/, '');
  for (const [key, val] of Object.entries(HMS_CODES)) {
    if (key.replace(/^0+/, '') === short) return val;
  }
  return null;
}

export function getHmsWikiUrl(attr) {
  const hexCode = hmsAttrToHex(attr) || String(attr);
  const parts = hexCode.replace(/[_-]/g, '+');
  return `https://wiki.bambulab.com/en/x1/troubleshooting/hmscode/${hexCode.replace('_', '_').toLowerCase()}`;
}

const ABRASIVE_TYPES = ['PA-CF', 'PA-GF', 'PET-CF', 'PLA-CF', 'PAHT-CF', 'PA6-CF', 'PA6-GF', 'PPA-CF', 'PPA-GF'];

function isAbrasiveFilament(type) {
  if (!type) return false;
  const upper = type.toUpperCase();
  return upper.includes('-CF') || upper.includes('-GF') || ABRASIVE_TYPES.some(t => upper.includes(t));
}

export class PrintTracker {
  constructor(printerId = 'default', wastePerChangeG = 5) {
    this.printerId = printerId;
    this.previousState = null;
    this.currentPrint = null;
    this.amsSnapshot = null;
    this.amsTrayWeights = {};
    this.colorChanges = 0;
    this.lastTrayId = null;
    this.wastePerChangeG = wastePerChangeG;

    // Notification callbacks
    this.onPrintStart = null;
    this.onPrintEnd = null;
    this.onMilestone = null;
    this.onError = null;
    this.onNfcAutoLinked = null;
    // Cloud task provider: (filename) => { weight, costTime, designId, designTitle } | null
    this.cloudTaskProvider = null;
    this._milestonesTriggered = new Set();

    // NFC auto-detection cache: tag_uid -> { spool_id, ams_unit, tray_id }
    this._nfcProcessed = new Map();

    // HMS dedup — one log per code per print session, seeded from DB to survive restarts
    this._hmsLogged = new Set();
    // print_error dedup — track last logged print_error to prevent duplicates across restarts
    this._lastPrintError = null;
    try {
      const recent = getErrors(20, this.printerId);
      for (const e of recent) {
        if (e.code && e.code.startsWith('HMS_')) {
          this._hmsLogged.add(e.code.substring(4));
        } else if (e.code) {
          // Seed last print_error from most recent non-HMS error
          if (!this._lastPrintError) this._lastPrintError = e.code;
        }
      }
    } catch { /* ignore */ }
  }

  update(printData) {
    if (!printData) return;

    const prevState = this.previousState?.gcode_state;
    const currState = printData.gcode_state;

    if (prevState !== currState) {
      this._onStateChange(prevState, currState, printData);
    }

    // Track color changes during print (254 = external spool, 255 = no tray)
    if (this.currentPrint && printData.ams?.tray_now != null) {
      const currentTray = String(printData.ams.tray_now);
      if (this.lastTrayId !== null && currentTray !== this.lastTrayId && currentTray !== '255') {
        this.colorChanges++;
      }
      if (currentTray !== '255') {
        this.lastTrayId = currentTray;
      }
    }

    // Track max temperatures during print
    if (this.currentPrint) {
      if (printData.nozzle_temper > this.currentPrint.maxTemp_nozzle) {
        this.currentPrint.maxTemp_nozzle = printData.nozzle_temper;
      }
      if (printData.bed_temper > this.currentPrint.maxTemp_bed) {
        this.currentPrint.maxTemp_bed = printData.bed_temper;
      }
      if (printData.chamber_temper > (this.currentPrint.maxTemp_chamber || 0)) {
        this.currentPrint.maxTemp_chamber = printData.chamber_temper;
      }
    }

    // Milestone detection (25%, 50%, 75%, 100%)
    if (this.currentPrint && this.onMilestone && printData.mc_percent != null) {
      const pct = parseInt(printData.mc_percent) || 0;
      for (const milestone of [25, 50, 75, 100]) {
        if (pct >= milestone && !this._milestonesTriggered.has(milestone)) {
          this._milestonesTriggered.add(milestone);
          this.onMilestone({
            printerId: this.printerId,
            filename: this.currentPrint.filename,
            milestone,
            layer: printData.layer_num || 0,
            totalLayers: printData.total_layer_num || 0,
            progress: pct
          });
        }
      }
    }

    // Live AMS weight sync (throttled: max once per 60s per tray)
    if (printData.ams?.ams) {
      if (!this._amsSyncTs) this._amsSyncTs = {};
      const now = Date.now();
      for (const unit of printData.ams.ams) {
        for (const tray of (unit.tray || [])) {
          if (tray.remain == null || tray.remain < 0) continue;
          const key = `${unit.id}_${tray.id}`;
          if (this._amsSyncTs[key] && now - this._amsSyncTs[key] < 60000) continue;
          const result = syncAmsToSpool(this.printerId, parseInt(unit.id) || 0, parseInt(tray.id) || 0, tray.remain);
          if (result) {
            this._amsSyncTs[key] = now;
            if (this.onBroadcast) this.onBroadcast('spool_weight_synced', { spoolId: result.spoolId, weight: result.newWeight, source: 'ams_live' });
          }
        }
      }
    }

    // Build error context snapshot
    const errorContext = {
      filename: this.currentPrint?.filename || printData.subtask_name || null,
      layer_num: printData.layer_num || null,
      total_layer_num: printData.total_layer_num || null,
      progress: printData.mc_percent ?? null,
      nozzle_temper: printData.nozzle_temper ?? null,
      bed_temper: printData.bed_temper ?? null,
      chamber_temper: printData.chamber_temper ?? null,
      gcode_state: printData.gcode_state || null,
      fan_speed: printData.cooling_fan_speed ?? null
    };

    // Log errors — dedup via previousState + seeded _lastPrintError, skip known benign codes
    const PRINT_ERROR_IGNORE = new Set(['0300_8003']);
    if (printData.print_error && printData.print_error !== 0) {
      const prevError = this.previousState?.print_error;
      if (prevError !== printData.print_error) {
        // Convert decimal to hex format (e.g. 50364419 → 0300_8003)
        const raw = parseInt(printData.print_error) || 0;
        const hexCode = raw > 0xFFFF
          ? `${((raw >> 16) & 0xFFFF).toString(16).padStart(4, '0')}_${(raw & 0xFFFF).toString(16).padStart(4, '0')}`.toUpperCase()
          : String(printData.print_error);
        // Skip benign codes and already-logged codes (survives restarts via seed)
        if (!PRINT_ERROR_IGNORE.has(hexCode) && this._lastPrintError !== hexCode) {
          this._lastPrintError = hexCode;
          const errMsg = printData.print_error_msg || `Feilkode: ${hexCode}`;
          addError({
            printer_id: this.printerId,
            code: hexCode,
            message: errMsg,
            severity: 'error',
            context: errorContext
          });
          if (this.onError) {
            this.onError({ printerId: this.printerId, code: hexCode, errorMessage: errMsg, severity: 'error' });
          }
        }
      }
    }

    // Log HMS errors — only during RUNNING/PAUSE (skip FINISH/IDLE/PREPARE), dedup per code per session
    // Ignore known benign/status HMS codes that are not actual errors
    const HMS_IGNORE = new Set(['0500_0500', '0500_0600', '0C00_0300']);
    const gcodeState = printData.gcode_state || '';
    if (printData.hms && Array.isArray(printData.hms) && ['RUNNING', 'PAUSE'].includes(gcodeState)) {
      if (!this._hmsLogged) this._hmsLogged = new Set();
      for (const hms of printData.hms) {
        const hexAttr = hmsAttrToHex(hms.attr) || String(hms.attr);
        if (HMS_IGNORE.has(hexAttr)) continue;
        if (this._hmsLogged.has(hexAttr)) continue;
        this._hmsLogged.add(hexAttr);
        const hmsSeverity = hms.code >= 0x0C000000 ? 'error' : 'warning';
        const description = lookupHmsCode(hms.attr);
        const wikiUrl = getHmsWikiUrl(hms.attr);
        const hmsMsg = description || hms.msg || `HMS: ${hexAttr}`;
        addError({
          printer_id: this.printerId,
          code: `HMS_${hexAttr}`,
          message: hmsMsg,
          severity: hmsSeverity,
          context: { ...errorContext, wiki_url: wikiUrl }
        });
        if (this.onError) {
          this.onError({ printerId: this.printerId, code: `HMS_${hexAttr}`, errorMessage: hmsMsg, severity: hmsSeverity, wikiUrl });
        }
      }
    }

    // Check layer pause schedule
    if (this.currentPrint && printData.layer_num > 0 && printData.gcode_state === 'RUNNING') {
      this._checkLayerPauses(printData.layer_num);
    }

    this.previousState = { ...printData };
  }

  _checkLayerPauses(currentLayer) {
    try {
      const pauses = getActiveLayerPauses(this.printerId);
      for (const pause of pauses) {
        const layers = JSON.parse(pause.layer_numbers || '[]');
        const triggered = JSON.parse(pause.triggered_layers || '[]');
        if (layers.includes(currentLayer) && !triggered.includes(currentLayer)) {
          markLayerTriggered(pause.id, currentLayer);
          log.info('Layer pause triggered at layer ' + currentLayer + ': ' + (pause.reason || 'scheduled'));
          if (this.onLayerPause) {
            this.onLayerPause({ printerId: this.printerId, layer: currentLayer, reason: pause.reason });
          }
        }
      }
    } catch (e) {
      log.error('Layer pause check error: ' + e.message);
    }
  }

  _onStateChange(prevState, currState, data) {
    // On first connect, capture an already-finished print retroactively
    if (!prevState && (currState === 'FINISH' || currState === 'FAILED') && !this.currentPrint) {
      this._captureRetroactivePrint(currState, data);
      return;
    }

    if (currState === 'RUNNING' && prevState !== 'PAUSE') {
      // Server restart mid-print: prevState is null, print already has progress
      const isResume = !prevState && parseInt(data.mc_percent) > 0;
      this._startPrint(data, isResume);
    }
    if (currState === 'PAUSE' && this.currentPrint) {
      this.currentPrint.pauseCount++;
    }
    if (currState === 'FINISH' && this.currentPrint) {
      this._endPrint('completed', data);
    }
    if (currState === 'FAILED' && this.currentPrint) {
      this._endPrint('failed', data);
    }
    if (currState === 'IDLE' && this.currentPrint && (prevState === 'RUNNING' || prevState === 'PAUSE')) {
      this._endPrint('cancelled', data);
    }
  }

  _startPrint(data, isResume = false) {
    this._hmsLogged = new Set();
    this._lastPrintError = null;
    this._milestonesTriggered = new Set();
    this.amsTrayWeights = this._getAmsTrayWeights(data);
    this.colorChanges = 0;
    this.lastTrayId = data.ams?.tray_now != null ? String(data.ams.tray_now) : null;
    const filamentInfo = this._getActiveFilament(data);

    // Capture estimated time from MQTT (mc_remaining_time is in minutes at print start)
    const estimatedSeconds = parseInt(data.mc_remaining_time) > 0 ? parseInt(data.mc_remaining_time) * 60 : null;

    // Calculate actual start time when resuming after server restart
    let startedAt = new Date().toISOString();
    if (isResume) {
      const pct = parseInt(data.mc_percent) || 0;
      const remainMin = parseInt(data.mc_remaining_time) || 0;
      if (pct > 0 && remainMin > 0) {
        const totalMinutes = remainMin / (1 - pct / 100);
        const elapsedMs = (totalMinutes * 60 * 1000) * (pct / 100);
        startedAt = new Date(Date.now() - elapsedMs).toISOString();
        log.info('Gjenopptatt print etter server-restart: ' + (data.subtask_name || 'ukjent') + ' (' + pct + '% ferdig, estimert start: ' + startedAt + ')');
      } else {
        log.info('Gjenopptatt print etter server-restart: ' + (data.subtask_name || 'ukjent') + ' (' + pct + '% ferdig)');
      }
      // Mark milestones already passed
      for (const m of [25, 50, 75]) {
        if (pct >= m) this._milestonesTriggered.add(m);
      }

      // Reconstruct original AMS snapshot: estimate start values from current + progress
      // If print is X% done, the active tray has lost proportionally more filament
      // We back-calculate: startRemain ≈ currentRemain + (currentRemain was higher at start)
      const currentAms = this._getAmsRemaining(data);
      const activeTray = data.ams?.tray_now;
      if (pct > 0 && activeTray != null) {
        // Find the active tray key and estimate its original remain%
        for (const [key, remain] of Object.entries(currentAms)) {
          const [, trayId] = key.split('_').map(Number);
          if (trayId === activeTray) {
            // Estimate: the tray dropped from X% to current remain% over pct% of print
            // We know the spool weight and can estimate total filament for this print
            // Conservative estimate: use total estimated time to gauge total usage
            // remain_at_start ≈ remain_now + (usage_so_far)
            // usage_so_far is unknown, but we know pct% of print is done
            // Best approach: look at spool assigned to this slot for initial weight
            const spool = getSpoolBySlot(this.printerId, parseInt(key.split('_')[0]), trayId);
            const spoolWeight = spool?.initial_weight_g || this.amsTrayWeights[key] || 1000;
            // If remain is 40% now and print is 95% done, the spool might have been ~full at start
            // We can't know exactly, so we estimate: the remaining% at print start
            // was higher by the amount consumed during pct% of this print
            // Since we don't know total consumption, use a rough estimate:
            // Assume linear consumption: totalUsage ≈ (100% - remain%) of spool was already used before
            // Actually, simplest: just set start snapshot to 100% (full spool) for the active tray
            // This over-estimates but ensures we capture AT LEAST the real diff at print end
            // Better: use the spool's last known weight from DB as the start value
            if (spool) {
              const lastKnownPct = Math.round(spool.remaining_weight_g / spoolWeight * 100);
              currentAms[key] = Math.min(100, lastKnownPct + Math.round((100 - lastKnownPct) * pct / 100));
              log.info('AMS snapshot rekonstruert for tray ' + key + ': ' + currentAms[key] + '% (spool #' + spool.id + ' hadde ' + lastKnownPct + '%)');
            }
          }
        }
      }
      this.amsSnapshot = currentAms;
    } else {
      log.info('Print startet: ' + (data.subtask_name || 'ukjent'));
      this.amsSnapshot = this._getAmsRemaining(data);
    }

    this.currentPrint = {
      started_at: startedAt,
      filename: data.subtask_name || data.gcode_file || 'Ukjent',
      gcode_file: data.gcode_file || null,
      filament_type: filamentInfo.type,
      filament_color: filamentInfo.color,
      filament_brand: filamentInfo.brand,
      total_layers: data.total_layer_num || 0,
      pauseCount: 0,
      maxTemp_nozzle: data.nozzle_target_temper || 0,
      maxTemp_bed: data.bed_target_temper || 0,
      maxTemp_chamber: data.chamber_temper || 0,
      speed_level: data.spd_lvl || 2,
      nozzle_type: data.nozzle_type || null,
      nozzle_diameter: data.nozzle_diameter || null,
      bed_target: data.bed_target_temper || 0,
      nozzle_target: data.nozzle_target_temper || 0,
      ams_units_used: data.ams?.ams?.length || 0,
      tray_id: data.ams?.tray_now != null ? String(data.ams.tray_now) : null,
      estimated_seconds: estimatedSeconds,
      cloud_weight_g: null,
      cloud_time_s: null,
      cloud_design_id: null
    };

    // Fetch cloud estimate (weight + time) for this print
    if (this.cloudTaskProvider) {
      try {
        const cloud = this.cloudTaskProvider(this.currentPrint.filename);
        if (cloud) {
          this.currentPrint.cloud_weight_g = cloud.weight || null;
          this.currentPrint.cloud_time_s = cloud.costTime || null;
          this.currentPrint.cloud_design_id = cloud.designId || null;
          if (cloud.weight) log.info('Cloud-estimat: ' + cloud.weight.toFixed(1) + 'g, ' + Math.round((cloud.costTime || 0) / 60) + ' min');
        }
      } catch (e) { log.debug('Cloud-estimat feilet: ' + e.message); }
    }

    // Check for nozzle change
    this._checkNozzleChange(data);

    // Save AMS snapshot
    this._saveAmsSnapshot(data);

    if (this.onPrintStart) {
      this.onPrintStart({ printerId: this.printerId, filename: this.currentPrint.filename });
    }
  }

  _endPrint(status, data) {
    if (!this.currentPrint) return;

    const startTime = new Date(this.currentPrint.started_at);
    const duration = Math.round((Date.now() - startTime.getTime()) / 1000);

    // Track completion percentage for proportional deduction on cancel/fail
    const completionPct = parseInt(data.mc_percent) || 0;

    let filamentUsedG = 0;
    if (this.amsSnapshot) {
      const currentAms = this._getAmsRemaining(data);
      for (const [trayId, startRemain] of Object.entries(this.amsSnapshot)) {
        const endRemain = currentAms[trayId] ?? startRemain;
        const diff = startRemain - endRemain;
        if (diff > 0) {
          const trayWeight = this.amsTrayWeights[trayId] || 1000;
          filamentUsedG += (diff / 100) * trayWeight;
        }
      }
    }

    // Fallback: use cloud estimate if AMS diff is too low (e.g. after server restart)
    const cloudWeight = this.currentPrint.cloud_weight_g;
    if (filamentUsedG < 1 && cloudWeight && cloudWeight > 1 && status === 'completed') {
      const pctDone = completionPct || 100;
      filamentUsedG = cloudWeight * (pctDone / 100);
      log.info('Bruker cloud-estimat for filament: ' + filamentUsedG.toFixed(1) + 'g (AMS-diff var 0)');
    }

    // Waste = startup purge + color change waste
    // For feilede/kansellerte prints: filament_used_g inneholder TOTAL forbruk fra AMS
    // Waste skal IKKE inkludere filament_used_g — det ville dobbeltelle
    // I stedet markerer vi bare den vanlige purge/color-change waste
    const startupPurgeG = parseFloat(getInventorySetting('startup_purge_g')) || 1.0;
    const wastePerChange = parseFloat(getInventorySetting('waste_per_change_g')) || this.wastePerChangeG;
    let wasteG = startupPurgeG + (this.colorChanges * wastePerChange);
    wasteG = Math.round(wasteG * 10) / 10;

    const record = {
      printer_id: this.printerId,
      started_at: this.currentPrint.started_at,
      finished_at: new Date().toISOString(),
      filename: this.currentPrint.filename,
      status: status,
      duration_seconds: duration,
      filament_used_g: Math.round(filamentUsedG * 10) / 10 || null,
      filament_type: this.currentPrint.filament_type,
      filament_color: this.currentPrint.filament_color,
      layer_count: data.total_layer_num || this.currentPrint.total_layers,
      notes: this._buildNotes(data),
      color_changes: this.colorChanges,
      waste_g: wasteG,
      nozzle_type: this.currentPrint.nozzle_type,
      nozzle_diameter: this.currentPrint.nozzle_diameter,
      speed_level: this.currentPrint.speed_level,
      bed_target: this.currentPrint.bed_target,
      nozzle_target: this.currentPrint.nozzle_target,
      max_nozzle_temp: this.currentPrint.maxTemp_nozzle,
      max_bed_temp: this.currentPrint.maxTemp_bed,
      max_chamber_temp: this.currentPrint.maxTemp_chamber || null,
      filament_brand: this.currentPrint.filament_brand,
      ams_units_used: this.currentPrint.ams_units_used,
      tray_id: this.currentPrint.tray_id,
      gcode_file: this.currentPrint.gcode_file,
      completion_pct: status === 'completed' ? 100 : completionPct,
      model_name: null,
      model_url: null
    };

    // Enrich with cloud model info
    if (this.currentPrint.cloud_design_id) {
      if (this.cloudTaskProvider) {
        try {
          const cloud = this.cloudTaskProvider(record.filename);
          if (cloud?.designTitle) {
            record.model_name = cloud.designTitle;
            record.model_url = 'https://makerworld.com/en/models/' + cloud.designId;
          }
        } catch {}
      }
    }

    try {
      const printHistoryId = addHistory(record);
      log.info('Print ' + status + ': ' + record.filename + ' (' + Math.round(duration / 60) + 'm, ' + filamentUsedG.toFixed(1) + 'g, ' + this.colorChanges + ' fargebytter, ' + wasteG + 'g waste)');

      // Save thumbnail from cache if available
      this._saveHistoryThumbnail(printHistoryId);

      // Update spool inventory from AMS data
      this._updateSpoolUsage(data, printHistoryId);

      // Update nozzle session counters
      this._updateNozzleSession(duration, filamentUsedG, this.currentPrint.filament_type);

      // Notification callback
      if (this.onPrintEnd) {
        this.onPrintEnd({
          printerId: this.printerId,
          printHistoryId,
          filename: record.filename,
          status,
          duration,
          filamentUsed: record.filament_used_g,
          error: data.print_error_msg || null
        });
      }

      // Save time tracking data (estimated vs actual)
      if (status === 'completed' && this.currentPrint.estimated_seconds && duration > 0) {
        try {
          const est = this.currentPrint.estimated_seconds;
          const accuracy = Math.round((100 - Math.abs(est - duration) * 100 / est) * 10) / 10;
          addTimeTracking({
            print_history_id: printHistoryId,
            printer_id: this.printerId,
            filename: record.filename,
            estimated_s: est,
            actual_s: duration,
            accuracy_pct: accuracy,
            filament_type: record.filament_type,
            finished_at: record.finished_at
          });
        } catch (e) { log.warn('Failed to save time tracking data', e.message); }
      }

      // Auto-save print cost (include waste in filament cost)
      this._savePrintCost(printHistoryId, filamentUsedG, duration, data, status, wasteG);

      // Update filament estimation accuracy (estimated vs actual)
      if (status === 'completed' && filamentUsedG > 0) {
        try { updateFilamentAccuracy(printHistoryId, filamentUsedG); } catch (e) { log.warn('Filament accuracy update failed', e.message); }
      }

      // Update component wear
      this._updateComponentWear(duration, data);

      // Update AMS tray filament usage
      if (this.amsSnapshot) {
        const currentAms = this._getAmsRemaining(data);
        for (const [key, startRemain] of Object.entries(this.amsSnapshot)) {
          const endRemain = currentAms[key] ?? startRemain;
          const diff = startRemain - endRemain;
          if (diff > 0) {
            const [unitId, trayId] = key.split('_').map(Number);
            const usedG = (diff / 100) * 1000;
            try { updateAmsTrayFilamentUsed(this.printerId, unitId, trayId, usedG); } catch (e) { /* ignore */ }
          }
        }
      }
    } catch (e) {
      log.error('Kunne ikke lagre print: ' + e.message);
    }

    // Deactivate any layer pauses for this printer
    try { deactivateLayerPauses(this.printerId); } catch (e) { log.warn('Failed to deactivate layer pauses', e.message); }

    // Aggregate daily filament usage for today
    try {
      const today = new Date().toISOString().split('T')[0];
      aggregateDailyFilamentUsage(today);
    } catch (e) { log.warn('Failed to aggregate daily usage', e.message); }

    this.currentPrint = null;
    this.amsSnapshot = null;
    this.amsTrayWeights = {};
    this.colorChanges = 0;
    this.lastTrayId = null;
  }

  _checkNozzleChange(data) {
    const nType = data.nozzle_type;
    const nDia = data.nozzle_diameter != null ? parseFloat(data.nozzle_diameter) : null;
    if (!nType && !nDia) return;

    try {
      const active = getActiveNozzleSession(this.printerId);
      if (!active) {
        if (nType || nDia) {
          createNozzleSession(this.printerId, nType || 'unknown', nDia || 0.4);
        }
      } else {
        const typeChanged = nType && active.nozzle_type.toLowerCase() !== nType.toLowerCase();
        const diaChanged = nDia && Math.abs(active.nozzle_diameter - nDia) > 0.01;
        if (typeChanged || diaChanged) {
          retireNozzleSession(active.id);
          createNozzleSession(this.printerId, nType || active.nozzle_type, nDia || active.nozzle_diameter);
          log.info('Dysebytte detektert: ' + active.nozzle_type + ' ' + active.nozzle_diameter + 'mm → ' + nType + ' ' + nDia + 'mm');
        }
      }
    } catch (e) {
      log.error('Nozzle check feil: ' + e.message);
    }
  }

  _updateNozzleSession(durationSec, filamentG, filamentType) {
    try {
      const session = getActiveNozzleSession(this.printerId);
      if (!session) return;
      const hours = durationSec / 3600;
      const abrasiveG = isAbrasiveFilament(filamentType) ? (filamentG || 0) : 0;
      updateNozzleSessionCounters(session.id, hours, filamentG || 0, abrasiveG);
    } catch (e) {
      log.error('Nozzle update feil: ' + e.message);
    }
  }

  _saveAmsSnapshot(data) {
    if (!data.ams?.ams) return;
    try {
      for (const unit of data.ams.ams) {
        for (const tray of (unit.tray || [])) {
          if (!tray) continue;
          if (tray.tray_type) {
            addAmsSnapshot({
              printer_id: this.printerId,
              ams_unit: parseInt(unit.id) || 0,
              tray_id: parseInt(tray.id) || 0,
              tray_type: tray.tray_type,
              tray_color: tray.tray_color || null,
              tray_brand: tray.tray_sub_brands || null,
              tray_name: tray.tray_id_name || null,
              remain_pct: tray.remain >= 0 ? tray.remain : null,
              humidity: unit.humidity || null,
              ams_temp: unit.temp || null,
              tag_uid: tray.tag_uid || null,
              tray_uuid: tray.tray_uuid || null,
              tray_info_idx: tray.tray_info_idx || null,
              tray_weight: tray.tray_weight ? parseFloat(tray.tray_weight) : null,
              tray_diameter: tray.tray_diameter ? parseFloat(tray.tray_diameter) : null,
              drying_temp: tray.drying_temp ? parseInt(tray.drying_temp) : null,
              drying_time: tray.drying_time ? parseInt(tray.drying_time) : null,
              nozzle_temp_min: tray.nozzle_temp_min ? parseInt(tray.nozzle_temp_min) : null,
              nozzle_temp_max: tray.nozzle_temp_max ? parseInt(tray.nozzle_temp_max) : null,
              bed_temp_recommend: tray.bed_temp ? parseInt(tray.bed_temp) : null,
              k_value: tray.k ? parseFloat(tray.k) : null
            });

            // Update AMS tray lifetime tracking
            upsertAmsTrayLifetime({
              printer_id: this.printerId,
              ams_unit: parseInt(unit.id) || 0,
              tray_id: parseInt(tray.id) || 0,
              tray_uuid: tray.tray_uuid || null
            });

            // Record filament usage history for trend tracking
            // Only record once per 5 minutes per tray to avoid flooding
            const trayKey = `${this.printerId}_${unit.id}_${tray.id}`;
            const now = Date.now();
            if (!this._lastUsageSnapshot) this._lastUsageSnapshot = {};
            if (!this._lastUsageSnapshot[trayKey] || now - this._lastUsageSnapshot[trayKey] > 5 * 60 * 1000) {
              this._lastUsageSnapshot[trayKey] = now;
              const matchedSpool = tray.tray_id_name ? getSpoolByTrayIdName(tray.tray_id_name) : null;
              addFilamentUsageSnapshot({
                printer_id: this.printerId,
                ams_unit: parseInt(unit.id) || 0,
                tray_id: parseInt(tray.id) || 0,
                tray_id_name: tray.tray_id_name || null,
                tray_type: tray.tray_type || null,
                tray_sub_brands: tray.tray_sub_brands || null,
                tray_color: tray.tray_color || null,
                remain_pct: tray.remain >= 0 ? tray.remain : null,
                tray_weight: tray.tray_weight ? parseInt(tray.tray_weight) : null,
                tag_uid: tray.tag_uid || null,
                tray_uuid: tray.tray_uuid || null,
                spool_id: matchedSpool?.id || null,
              });
            }
          }
        }
      }
    } catch (e) {
      log.error('AMS snapshot feil: ' + e.message);
    }

    // Auto-detect NFC tags from AMS trays
    this._processAmsNfcTags(data);
  }

  _processAmsNfcTags(data) {
    if (!data.ams?.ams) return;
    try {
      // Track which tags are currently present so we can evict stale cache entries
      const currentTags = new Set();

      for (const unit of data.ams.ams) {
        for (const tray of (unit.tray || [])) {
          if (!tray) continue;
          const tagUid = tray.tag_uid;
          if (!tagUid || tagUid === '0000000000000000') continue;

          const amsUnit = parseInt(unit.id) || 0;
          const trayId = parseInt(tray.id) || 0;
          const cacheKey = `${tagUid}:${amsUnit}:${trayId}`;
          currentTags.add(cacheKey);

          // Skip if already processed in this slot
          if (this._nfcProcessed.has(cacheKey)) continue;

          const mapping = lookupNfcTag(tagUid);

          if (mapping && mapping.spool_id) {
            // Tag known and linked to a spool — auto-assign spool to this printer slot
            const existing = getSpoolBySlot(this.printerId, amsUnit, trayId);
            if (!existing || existing.id !== mapping.spool_id) {
              assignSpoolToSlot(mapping.spool_id, this.printerId, amsUnit, trayId);
              log.info('NFC auto-assigned spool #' + mapping.spool_id + ' to AMS ' + amsUnit + ':' + trayId + ' (tag ' + tagUid + ')');
              if (this.onNfcAutoLinked) {
                this.onNfcAutoLinked({
                  action: 'assigned',
                  printer_id: this.printerId,
                  ams_unit: amsUnit,
                  tray_id: trayId,
                  tag_uid: tagUid,
                  spool_id: mapping.spool_id,
                  spool_name: mapping.spool_name || null
                });
              }
            }
          } else if (!mapping) {
            // Unknown tag — check if a spool is already assigned to this slot and auto-link
            const existing = getSpoolBySlot(this.printerId, amsUnit, trayId);
            if (existing) {
              linkNfcTag(tagUid, existing.id, 'ams', null);
              log.info('NFC auto-linked tag ' + tagUid + ' to spool #' + existing.id + ' in AMS ' + amsUnit + ':' + trayId);
              if (this.onNfcAutoLinked) {
                this.onNfcAutoLinked({
                  action: 'linked',
                  printer_id: this.printerId,
                  ams_unit: amsUnit,
                  tray_id: trayId,
                  tag_uid: tagUid,
                  spool_id: existing.id,
                  spool_name: existing.name || null
                });
              }
            }
          }

          this._nfcProcessed.set(cacheKey, Date.now());
        }
      }

      // Evict cache entries for tags no longer present (spool removed from tray)
      for (const key of this._nfcProcessed.keys()) {
        if (!currentTags.has(key)) {
          this._nfcProcessed.delete(key);
        }
      }
    } catch (e) {
      log.error('NFC auto-detect feil: ' + e.message);
    }

    // Auto-match AMS trays to spools by color+material (fallback when no NFC tag)
    this._autoMatchAmsTrays(data);
  }

  _autoMatchAmsTrays(data) {
    if (!data.ams?.ams) return;
    try {
      for (const unit of data.ams.ams) {
        for (const tray of (unit.tray || [])) {
          if (!tray || !tray.tray_type) continue;
          const tagUid = tray.tag_uid;
          // Skip if has NFC tag (already handled)
          if (tagUid && tagUid !== '0000000000000000') continue;
          // Skip empty or invalid trays
          if (!tray.tray_color || tray.tray_color === '00000000') continue;
          if (tray.tray_uuid === '00000000000000000000000000000000') continue;

          const amsUnit = parseInt(unit.id) || 0;
          const trayId = parseInt(tray.id) || 0;

          // Already assigned?
          const existing = getSpoolBySlot(this.printerId, amsUnit, trayId);
          if (existing) {
            // Check depletion thresholds
            const remainPct = tray.remain >= 0 ? tray.remain : 100;
            const events = checkSpoolDepletionThresholds(existing.id, remainPct);
            if (events.length > 0 && this.onSpoolDepleting) {
              for (const evt of events) {
                this.onSpoolDepleting({ ...evt, printer_id: this.printerId, ams_unit: amsUnit, tray_id: trayId });
              }
            }
            continue;
          }

          // Try tray_id_name match first
          let matched = null;
          if (tray.tray_id_name) {
            matched = getSpoolByTrayIdName(tray.tray_id_name);
          }

          // Try color+material match
          if (!matched) {
            matched = autoMatchTrayToSpool(
              tray.tray_color, tray.tray_type, tray.tray_sub_brands,
              tray.tray_weight, this.printerId, amsUnit, trayId
            );
          }

          if (matched) {
            assignSpoolToSlot(matched.id, this.printerId, amsUnit, trayId);
            log.info('Auto-matched spool #' + matched.id + ' to AMS ' + amsUnit + ':' + trayId + ' by color+material');
          } else {
            // Auto-create spool if setting enabled
            const autoCreate = getInventorySetting('auto_create_from_ams');
            if (autoCreate === 'true' || autoCreate === '1') {
              const result = autoCreateSpoolFromTray(tray, this.printerId, amsUnit, trayId);
              log.info('Auto-created spool #' + result.id + ' from AMS ' + amsUnit + ':' + trayId);
            }
          }
        }
      }
    } catch (e) {
      log.error('AMS auto-match feil: ' + e.message);
    }
  }

  _getActiveFilament(data) {
    const result = { type: null, color: null, brand: null };
    if (!data.ams?.ams) return result;

    const activeTray = data.ams.tray_now;
    let matchedUnit = null, matchedTrayId = null;
    for (const unit of data.ams.ams) {
      const tray = (unit.tray || []).find(t => t && String(t.id) === String(activeTray));
      if (tray) {
        result.type = tray.tray_type || null;
        result.color = tray.tray_color || null;
        result.brand = tray.tray_sub_brands || tray.tray_id_name || null;
        matchedUnit = unit.id ?? 0;
        matchedTrayId = tray.id;
        break;
      }
    }

    // Enrich from Bambu RFID variant database (gives exact color name + material name)
    if (matchedTrayId !== null) {
      try {
        const activeTrayObj = data.ams.ams.flatMap(u => u.tray || []).find(t => t && String(t.id) === String(activeTray));
        if (activeTrayObj?.tray_id_name) {
          const variant = enrichTrayWithVariant(activeTrayObj.tray_id_name);
          if (variant) {
            if (!result.brand || result.brand === activeTrayObj.tray_id_name) result.brand = variant.material_name;
            if (!result.color) result.color = variant.color_hex;
            result.colorName = variant.color_name;
            result.materialName = variant.material_name;
          }
        }
      } catch { /* ignore */ }
    }

    // Fallback: enrich from linked inventory spool if MQTT data is incomplete
    if (matchedTrayId !== null && (!result.brand || !result.type)) {
      try {
        const spool = getSpoolBySlot(this.printerId, matchedUnit, matchedTrayId);
        if (spool) {
          if (!result.brand) result.brand = spool.vendor_name || spool.profile_name || null;
          if (!result.type) result.type = spool.material || null;
        }
      } catch { /* ignore */ }
    }

    return result;
  }

  _getAmsRemaining(data) {
    const remaining = {};
    if (!data.ams?.ams) return remaining;

    for (const unit of data.ams.ams) {
      for (const tray of (unit.tray || [])) {
        if (!tray) continue;
        if (tray.remain >= 0) {
          remaining[`${unit.id}_${tray.id}`] = tray.remain;
        }
      }
    }
    return remaining;
  }

  _getAmsTrayWeights(data) {
    const weights = {};
    if (!data.ams?.ams) return weights;

    for (const unit of data.ams.ams) {
      for (const tray of (unit.tray || [])) {
        if (!tray) continue;
        const key = `${unit.id}_${tray.id}`;
        // 1. Use linked inventory spool weight if available
        const [unitId, trayId] = [parseInt(unit.id) || 0, parseInt(tray.id) || 0];
        const spool = getSpoolBySlot(this.printerId, unitId, trayId);
        if (spool && spool.initial_weight_g > 0) {
          weights[key] = spool.initial_weight_g;
        } else if (tray.tray_weight && parseFloat(tray.tray_weight) > 0) {
          // 2. Fallback to MQTT-reported tray weight
          weights[key] = parseFloat(tray.tray_weight);
        } else {
          // 3. Default 1000g
          weights[key] = 1000;
        }
      }
    }
    return weights;
  }

  _captureRetroactivePrint(currState, data) {
    const filename = data.subtask_name || data.gcode_file || 'Unknown';
    if (!filename || filename === 'Unknown') return;

    // Check if this print was already recorded (by filename + printer)
    const recent = getHistory(5, 0, this.printerId);
    if (recent.some(h => h.filename === filename)) {
      log.info('Retroactive print already recorded: ' + filename);
      return;
    }

    const status = currState === 'FINISH' ? 'completed' : 'failed';
    const filamentInfo = this._getActiveFilament(data);
    const layers = data.total_layer_num || 0;
    const now = new Date().toISOString();

    const record = {
      printer_id: this.printerId,
      started_at: now,
      finished_at: now,
      filename: filename,
      status: status,
      duration_seconds: null,
      filament_used_g: null,
      filament_type: filamentInfo.type,
      filament_color: filamentInfo.color,
      layer_count: layers,
      notes: 'Retroactively captured on connect',
      color_changes: 0,
      waste_g: 0,
      nozzle_type: data.nozzle_type || null,
      nozzle_diameter: data.nozzle_diameter || null,
      speed_level: data.spd_lvl || null,
      bed_target: data.bed_target_temper || 0,
      nozzle_target: data.nozzle_target_temper || 0,
      max_nozzle_temp: data.nozzle_temper || 0,
      max_bed_temp: data.bed_temper || 0,
      max_chamber_temp: data.chamber_temper || null,
      filament_brand: filamentInfo.brand,
      ams_units_used: data.ams?.ams?.length || 0,
      tray_id: data.ams?.tray_now != null ? String(data.ams.tray_now) : null
    };

    try {
      addHistory(record);
      log.info('Retroactively captured ' + status + ' print: ' + filename);
    } catch (e) {
      log.error('Failed to capture retroactive print: ' + e.message);
    }
  }

  _buildNotes(data) {
    const parts = [];
    if (this.currentPrint.pauseCount > 0) {
      parts.push(`Pauset ${this.currentPrint.pauseCount}x`);
    }
    if (this.currentPrint.filament_brand) {
      parts.push(this.currentPrint.filament_brand);
    }
    if (this.currentPrint.maxTemp_nozzle) {
      parts.push(`Dyse: ${this.currentPrint.maxTemp_nozzle}°C`);
    }
    if (this.currentPrint.speed_level) {
      const names = { 1: 'Stille', 2: 'Standard', 3: 'Sport', 4: 'Vanvidd' };
      parts.push(`Hastighet: ${names[this.currentPrint.speed_level] || this.currentPrint.speed_level}`);
    }
    return parts.length > 0 ? parts.join(' | ') : null;
  }

  _saveHistoryThumbnail(historyId) {
    try {
      // Import thumbnail cache from thumbnail-service
      const thumbCache = PrintTracker._thumbCacheRef;
      if (!thumbCache) return;
      const cached = thumbCache.get(this.printerId);
      if (!cached || !cached.buffer) return;

      const thumbDir = join(__dirname, '..', 'data', 'history-thumbnails');
      if (!existsSync(thumbDir)) mkdirSync(thumbDir, { recursive: true });
      const ext = cached.contentType === 'image/svg+xml' ? 'svg' : 'png';
      writeFileSync(join(thumbDir, `${historyId}.${ext}`), cached.buffer);
      log.info('Thumbnail lagret for history #' + historyId);
    } catch (e) {
      log.warn('Thumbnail-lagring feilet: ' + e.message);
    }
  }

  _updateComponentWear(durationSec, data) {
    const hours = durationSec / 3600;
    try {
      upsertComponentWear(this.printerId, 'belts_x', hours, 0);
      upsertComponentWear(this.printerId, 'belts_y', hours, 0);
      upsertComponentWear(this.printerId, 'linear_rails', hours, 0);
      upsertComponentWear(this.printerId, 'extruder_motor', hours, 0);
      upsertComponentWear(this.printerId, 'hotend_heater', hours, 1);
      upsertComponentWear(this.printerId, 'bed_heater', hours, 1);

      if (parseInt(data?.cooling_fan_speed) > 0)
        upsertComponentWear(this.printerId, 'fan_cooling', hours, 0);
      if (parseInt(data?.big_fan1_speed) > 0)
        upsertComponentWear(this.printerId, 'fan_aux', hours, 0);
      if (parseInt(data?.big_fan2_speed) > 0)
        upsertComponentWear(this.printerId, 'fan_chamber', hours, 0);
      if (parseInt(data?.heatbreak_fan_speed) > 0)
        upsertComponentWear(this.printerId, 'fan_heatbreak', hours, 0);
    } catch (e) {
      log.error('Component wear update feilet: ' + e.message);
    }
  }

  _updateSpoolUsage(data, printHistoryId) {
    if (!this.amsSnapshot) return;
    try {
      const currentAms = this._getAmsRemaining(data);
      for (const [key, startRemain] of Object.entries(this.amsSnapshot)) {
        const endRemain = currentAms[key] ?? startRemain;
        const diff = startRemain - endRemain;
        if (diff > 0) {
          const [unitId, trayId] = key.split('_').map(Number);
          const trayWeight = this.amsTrayWeights[key] || 1000;
          const usedG = (diff / 100) * trayWeight;
          // Look up spool assigned to this AMS slot
          const spool = getSpoolBySlot(this.printerId, unitId, trayId);
          if (spool) {
            useSpoolWeight(spool.id, usedG, 'auto', printHistoryId, this.printerId);
            trackConsumedSinceWeight(spool.id, usedG);
            log.info('Spool #' + spool.id + ' usage: ' + usedG.toFixed(1) + 'g (AMS' + unitId + ':' + trayId + ')');
          }
        }
      }
    } catch (e) {
      log.error('Spool usage update feilet: ' + e.message);
    }
  }

  _savePrintCost(printHistoryId, filamentUsedG, durationSeconds, data, printStatus, wasteG = 0) {
    try {
      // Find the spool used for cost-per-gram calculation
      let spoolId = null;
      if (this.amsSnapshot && data.ams?.tray_now != null) {
        const activeTray = String(data.ams.tray_now);
        for (const key of Object.keys(this.amsSnapshot)) {
          const [unitId, trayId] = key.split('_').map(Number);
          if (String(trayId) === activeTray) {
            const spool = getSpoolBySlot(this.printerId, unitId, trayId);
            if (spool) { spoolId = spool.id; break; }
          }
        }
      }
      const costs = estimatePrintCostAdvanced(filamentUsedG || 0, durationSeconds || 0, spoolId, this.printerId, printStatus, wasteG || 0);
      if (costs.total_cost > 0) {
        savePrintCost(printHistoryId, costs);
      }
    } catch (e) {
      log.error('Cost save feilet: ' + e.message);
    }
  }

  getCurrentPrint() {
    return this.currentPrint;
  }
}
