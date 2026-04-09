/**
 * Snapmaker U1 database access functions
 * NFC filament cache, defect events, calibration results
 */

import { getDb } from './connection.js';

// ── NFC Filament ──

export function upsertNfcFilament(printerId, channel, data) {
  const db = getDb();
  return db.prepare(`INSERT OR REPLACE INTO sm_nfc_filament
    (printer_id, channel, vendor, manufacturer, filament_type, sub_type, color_hex, weight_g, sku, official,
     nozzle_temp_min, nozzle_temp_max, bed_temp, first_layer_temp, other_layer_temp, drying_temp, drying_time, detected_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
  `).run(
    printerId, channel, data.vendor, data.manufacturer, data.type, data.subType,
    data.color, data.weight, data.sku, data.official ? 1 : 0,
    data.nozzleTempMin, data.nozzleTempMax, data.bedTemp,
    data.firstLayerTemp, data.otherLayerTemp, data.dryingTemp, data.dryingTime
  );
}

export function getNfcFilaments(printerId) {
  const db = getDb();
  return db.prepare('SELECT * FROM sm_nfc_filament WHERE printer_id = ? ORDER BY channel').all(printerId);
}

// ── Defect Events ──

export function addDefectEvent(printerId, eventType, severity, details, printHistoryId, probability) {
  const db = getDb();
  return db.prepare(`INSERT INTO sm_defect_events (printer_id, print_history_id, event_type, severity, details)
    VALUES (?, ?, ?, ?, ?)`).run(
    printerId, printHistoryId || null, eventType, severity || 'warning',
    JSON.stringify({ ...(typeof details === 'string' ? { message: details } : details || {}), probability: probability ?? null })
  );
}

export function getDefectEvents(printerId, limit) {
  const db = getDb();
  return db.prepare('SELECT * FROM sm_defect_events WHERE printer_id = ? ORDER BY detected_at DESC LIMIT ?').all(printerId, limit || 50);
}

export function getDefectTrend(printerId, days) {
  const db = getDb();
  return db.prepare(`SELECT date(detected_at) as day, event_type, COUNT(*) as count
    FROM sm_defect_events WHERE printer_id = ? AND detected_at >= datetime('now', ?)
    GROUP BY day, event_type ORDER BY day`).all(printerId, `-${days || 30} days`);
}

export function acknowledgeDefectEvent(eventId) {
  const db = getDb();
  return db.prepare('UPDATE sm_defect_events SET acknowledged = 1 WHERE id = ?').run(eventId);
}

// ── Calibration Results ──

export function addCalibrationResult(printerId, calType, extruder, kValue, resultData) {
  const db = getDb();
  return db.prepare(`INSERT INTO sm_calibration_results (printer_id, cal_type, extruder, k_value, result_data)
    VALUES (?, ?, ?, ?, ?)`).run(printerId, calType, extruder || 0, kValue || null, resultData ? JSON.stringify(resultData) : null);
}

export function getCalibrationResults(printerId, calType) {
  const db = getDb();
  if (calType) {
    return db.prepare('SELECT * FROM sm_calibration_results WHERE printer_id = ? AND cal_type = ? ORDER BY calibrated_at DESC LIMIT 20').all(printerId, calType);
  }
  return db.prepare('SELECT * FROM sm_calibration_results WHERE printer_id = ? ORDER BY calibrated_at DESC LIMIT 50').all(printerId);
}
