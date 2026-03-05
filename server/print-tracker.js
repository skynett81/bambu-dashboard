import { addHistory, getHistory, addError, addAmsSnapshot, getActiveNozzleSession, createNozzleSession, retireNozzleSession, updateNozzleSessionCounters, upsertComponentWear, upsertAmsTrayLifetime, updateAmsTrayFilamentUsed, getSpoolBySlot, useSpoolWeight, savePrintCost, estimatePrintCostAdvanced, lookupNfcTag, linkNfcTag, assignSpoolToSlot, syncAmsToSpool } from './database.js';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
let HMS_CODES = {};
try { HMS_CODES = JSON.parse(readFileSync(join(__dirname, 'hms-codes.json'), 'utf8')); } catch (_) {}

export function lookupHmsCode(attr) {
  if (!attr) return null;
  // Try direct lookup (e.g. "0300_8010")
  const clean = String(attr).replace(/-/g, '_');
  if (HMS_CODES[clean]) return HMS_CODES[clean];
  // Try with leading zeros stripped
  const short = clean.replace(/^0+/, '');
  for (const [key, val] of Object.entries(HMS_CODES)) {
    if (key.replace(/^0+/, '') === short) return val;
  }
  return null;
}

export function getHmsWikiUrl(attr) {
  const code = String(attr).replace(/-/g, '_');
  return `https://wiki.bambulab.com/en/x1/troubleshooting/hmscode/${code}`;
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
    this.colorChanges = 0;
    this.lastTrayId = null;
    this.wastePerChangeG = wastePerChangeG;

    // Notification callbacks
    this.onPrintStart = null;
    this.onPrintEnd = null;
    this.onError = null;
    this.onNfcAutoLinked = null;

    // NFC auto-detection cache: tag_uid -> { spool_id, ams_unit, tray_id }
    this._nfcProcessed = new Map();
  }

  update(printData) {
    if (!printData) return;

    const prevState = this.previousState?.gcode_state;
    const currState = printData.gcode_state;

    if (prevState !== currState) {
      this._onStateChange(prevState, currState, printData);
    }

    // Track color changes during print
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

    // Log errors
    if (printData.print_error && printData.print_error !== 0) {
      const prevError = this.previousState?.print_error;
      if (prevError !== printData.print_error) {
        const errMsg = printData.print_error_msg || `Feilkode: ${printData.print_error}`;
        addError({
          printer_id: this.printerId,
          code: String(printData.print_error),
          message: errMsg,
          severity: 'error'
        });
        if (this.onError) {
          this.onError({ printerId: this.printerId, code: String(printData.print_error), errorMessage: errMsg, severity: 'error' });
        }
      }
    }

    // Log HMS errors
    if (printData.hms && Array.isArray(printData.hms)) {
      for (const hms of printData.hms) {
        if (!this._seenHms?.has(hms.attr)) {
          if (!this._seenHms) this._seenHms = new Set();
          this._seenHms.add(hms.attr);
          const hmsSeverity = hms.code >= 0x0C000000 ? 'error' : 'warning';
          const description = lookupHmsCode(hms.attr);
          const wikiUrl = getHmsWikiUrl(hms.attr);
          const hmsMsg = description || hms.msg || `HMS: ${hms.attr}`;
          addError({
            printer_id: this.printerId,
            code: `HMS_${hms.attr}`,
            message: hmsMsg,
            severity: hmsSeverity,
            wiki_url: wikiUrl
          });
          if (this.onError) {
            this.onError({ printerId: this.printerId, code: `HMS_${hms.attr}`, errorMessage: hmsMsg, severity: hmsSeverity, wikiUrl });
          }
        }
      }
    }

    this.previousState = { ...printData };
  }

  _onStateChange(prevState, currState, data) {
    // On first connect, capture an already-finished print retroactively
    if (!prevState && (currState === 'FINISH' || currState === 'FAILED') && !this.currentPrint) {
      this._captureRetroactivePrint(currState, data);
      return;
    }

    if (currState === 'RUNNING' && prevState !== 'PAUSE') {
      this._startPrint(data);
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

  _startPrint(data) {
    console.log(`[tracker:${this.printerId}] Print startet: ${data.subtask_name || 'ukjent'}`);

    this.amsSnapshot = this._getAmsRemaining(data);
    this.colorChanges = 0;
    this.lastTrayId = data.ams?.tray_now != null ? String(data.ams.tray_now) : null;
    const filamentInfo = this._getActiveFilament(data);

    this.currentPrint = {
      started_at: new Date().toISOString(),
      filename: data.subtask_name || data.gcode_file || 'Ukjent',
      filament_type: filamentInfo.type,
      filament_color: filamentInfo.color,
      filament_brand: filamentInfo.brand,
      total_layers: data.total_layer_num || 0,
      pauseCount: 0,
      maxTemp_nozzle: data.nozzle_target_temper || 0,
      maxTemp_bed: data.bed_target_temper || 0,
      speed_level: data.spd_lvl || 2,
      nozzle_type: data.nozzle_type || null,
      nozzle_diameter: data.nozzle_diameter || null,
      bed_target: data.bed_target_temper || 0,
      nozzle_target: data.nozzle_target_temper || 0,
      ams_units_used: data.ams?.ams?.length || 0,
      tray_id: data.ams?.tray_now != null ? String(data.ams.tray_now) : null
    };

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
          filamentUsedG += (diff / 100) * 1000;
        }
      }
    }

    const wasteG = Math.round(this.colorChanges * this.wastePerChangeG * 10) / 10;

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
      filament_brand: this.currentPrint.filament_brand,
      ams_units_used: this.currentPrint.ams_units_used,
      tray_id: this.currentPrint.tray_id,
      completion_pct: status === 'completed' ? 100 : completionPct
    };

    try {
      const printHistoryId = addHistory(record);
      console.log(`[tracker:${this.printerId}] Print ${status}: ${record.filename} (${Math.round(duration / 60)}m, ${filamentUsedG.toFixed(1)}g, ${this.colorChanges} fargebytter, ${wasteG}g waste)`);

      // Update spool inventory from AMS data
      this._updateSpoolUsage(data, printHistoryId);

      // Update nozzle session counters
      this._updateNozzleSession(duration, filamentUsedG, this.currentPrint.filament_type);

      // Notification callback
      if (this.onPrintEnd) {
        this.onPrintEnd({
          printerId: this.printerId,
          filename: record.filename,
          status,
          duration,
          filamentUsed: record.filament_used_g,
          error: data.print_error_msg || null
        });
      }

      // Auto-save print cost
      this._savePrintCost(printHistoryId, filamentUsedG, duration, data, status);

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
      console.error(`[tracker:${this.printerId}] Kunne ikke lagre print:`, e.message);
    }

    this.currentPrint = null;
    this.amsSnapshot = null;
    this.colorChanges = 0;
    this.lastTrayId = null;
  }

  _checkNozzleChange(data) {
    const nType = data.nozzle_type;
    const nDia = data.nozzle_diameter;
    if (!nType && !nDia) return;

    try {
      const active = getActiveNozzleSession(this.printerId);
      if (!active) {
        if (nType || nDia) {
          createNozzleSession(this.printerId, nType || 'unknown', nDia || 0.4);
        }
      } else {
        const typeChanged = nType && active.nozzle_type.toLowerCase() !== nType.toLowerCase();
        const diaChanged = nDia && active.nozzle_diameter !== nDia;
        if (typeChanged || diaChanged) {
          retireNozzleSession(active.id);
          createNozzleSession(this.printerId, nType || active.nozzle_type, nDia || active.nozzle_diameter);
          console.log(`[tracker:${this.printerId}] Dysebytte detektert: ${active.nozzle_type} ${active.nozzle_diameter}mm → ${nType} ${nDia}mm`);
        }
      }
    } catch (e) {
      console.error(`[tracker:${this.printerId}] Nozzle check feil:`, e.message);
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
      console.error(`[tracker:${this.printerId}] Nozzle update feil:`, e.message);
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
          }
        }
      }
    } catch (e) {
      console.error(`[tracker:${this.printerId}] AMS snapshot feil:`, e.message);
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
              console.log(`[tracker:${this.printerId}] NFC auto-assigned spool #${mapping.spool_id} to AMS ${amsUnit}:${trayId} (tag ${tagUid})`);
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
              console.log(`[tracker:${this.printerId}] NFC auto-linked tag ${tagUid} to spool #${existing.id} in AMS ${amsUnit}:${trayId}`);
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
      console.error(`[tracker:${this.printerId}] NFC auto-detect feil:`, e.message);
    }
  }

  _getActiveFilament(data) {
    const result = { type: null, color: null, brand: null };
    if (!data.ams?.ams) return result;

    const activeTray = data.ams.tray_now;
    for (const unit of data.ams.ams) {
      const tray = (unit.tray || []).find(t => t && String(t.id) === String(activeTray));
      if (tray) {
        result.type = tray.tray_type || null;
        result.color = tray.tray_color || null;
        result.brand = tray.tray_sub_brands || tray.tray_id_name || null;
        break;
      }
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

  _captureRetroactivePrint(currState, data) {
    const filename = data.subtask_name || data.gcode_file || 'Unknown';
    if (!filename || filename === 'Unknown') return;

    // Check if this print was already recorded (by filename + printer)
    const recent = getHistory(5, 0, this.printerId);
    if (recent.some(h => h.filename === filename)) {
      console.log(`[tracker:${this.printerId}] Retroactive print already recorded: ${filename}`);
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
      filament_brand: filamentInfo.brand,
      ams_units_used: data.ams?.ams?.length || 0,
      tray_id: data.ams?.tray_now != null ? String(data.ams.tray_now) : null
    };

    try {
      addHistory(record);
      console.log(`[tracker:${this.printerId}] Retroactively captured ${status} print: ${filename}`);
    } catch (e) {
      console.error(`[tracker:${this.printerId}] Failed to capture retroactive print:`, e.message);
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
      console.error(`[tracker:${this.printerId}] Component wear update feilet:`, e.message);
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
          const usedG = (diff / 100) * 1000;
          // Look up spool assigned to this AMS slot
          const spool = getSpoolBySlot(this.printerId, unitId, trayId);
          if (spool) {
            useSpoolWeight(spool.id, usedG, 'auto', printHistoryId, this.printerId);
            console.log(`[tracker:${this.printerId}] Spool #${spool.id} usage: ${usedG.toFixed(1)}g (AMS${unitId}:${trayId})`);
          }
        }
      }
    } catch (e) {
      console.error(`[tracker:${this.printerId}] Spool usage update feilet:`, e.message);
    }
  }

  _savePrintCost(printHistoryId, filamentUsedG, durationSeconds, data, printStatus) {
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
      const costs = estimatePrintCostAdvanced(filamentUsedG || 0, durationSeconds || 0, spoolId, this.printerId, printStatus);
      if (costs.total_cost > 0) {
        savePrintCost(printHistoryId, costs);
      }
    } catch (e) {
      console.error(`[tracker:${this.printerId}] Cost save feilet:`, e.message);
    }
  }

  getCurrentPrint() {
    return this.currentPrint;
  }
}
