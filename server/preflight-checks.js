/**
 * Pre-flight checklist runner — given a printer + intended material, run a
 * battery of cheap checks and return a pass/warn/fail report.
 *
 * Each check is a pure function (state, intent) → check[]; the dispatcher
 * collates them and assigns an overall colour (red if any fail, amber if
 * any warn, green otherwise).
 */

import { getDb } from './db/connection.js';

const NOZZLE_TEMP_LIMITS = {
  PLA: { min: 180, max: 230, dryHours: 0 },
  PETG: { min: 220, max: 260, dryHours: 4 },
  ABS: { min: 230, max: 270, dryHours: 4 },
  ASA: { min: 240, max: 270, dryHours: 4 },
  TPU: { min: 220, max: 250, dryHours: 6 },
  'PA-CF': { min: 260, max: 300, dryHours: 12 },
  'PETG-CF': { min: 240, max: 290, dryHours: 6 },
  PC: { min: 260, max: 310, dryHours: 8 },
};

const BED_TEMP_RECOMMEND = { PLA: 60, PETG: 80, ABS: 100, ASA: 100, TPU: 50, 'PA-CF': 90, 'PETG-CF': 80, PC: 105 };

function _check(severity, message, fix) {
  return { severity, message, fix: fix || null };
}

function _round1(x) { return Math.round(x * 10) / 10; }

function checkFilamentAvailable(intent) {
  if (!intent.spool_id) return _check('warn', 'No spool linked — cannot verify filament weight available.');
  const db = getDb();
  const spool = db.prepare('SELECT remaining_weight_g, profile_name FROM spools WHERE id = ?').get(intent.spool_id);
  if (!spool) return _check('fail', `Spool #${intent.spool_id} not found in inventory.`);
  if (!intent.estimated_grams) return _check('info', 'No filament weight estimate provided — skipping availability check.');
  if (spool.remaining_weight_g < intent.estimated_grams) {
    return _check('fail',
      `Linked spool has only ${_round1(spool.remaining_weight_g)}g, but the print needs ${intent.estimated_grams}g.`,
      'Refill or relink to a fuller spool before starting.');
  }
  if (spool.remaining_weight_g < intent.estimated_grams * 1.15) {
    return _check('warn',
      `Linked spool will be near-empty after this print (${_round1(spool.remaining_weight_g)}g, needs ${intent.estimated_grams}g).`,
      'Have a replacement spool ready.');
  }
  return _check('pass', `Linked spool has ${_round1(spool.remaining_weight_g)}g (need ${intent.estimated_grams}g).`);
}

function checkTempBounds(intent) {
  const m = (intent.material || '').toUpperCase();
  const limit = NOZZLE_TEMP_LIMITS[m];
  if (!limit) return _check('info', `No temperature reference for material '${intent.material || 'unknown'}'.`);
  if (intent.hotend_temp == null) return _check('info', 'No hotend temp specified — skipping check.');
  if (intent.hotend_temp < limit.min) {
    return _check('fail',
      `Hotend ${intent.hotend_temp}°C is below ${m} minimum ${limit.min}°C — cold extrusion expected.`,
      `Increase to ${limit.min}–${limit.max}°C for ${m}.`);
  }
  if (intent.hotend_temp > limit.max) {
    return _check('warn',
      `Hotend ${intent.hotend_temp}°C exceeds typical ${m} max ${limit.max}°C — risk of thermal damage.`,
      `Reduce to ${limit.max}°C unless you have a vendor-specific reason.`);
  }
  return _check('pass', `Hotend ${intent.hotend_temp}°C is in ${m} range (${limit.min}–${limit.max}°C).`);
}

function checkBedTempVsMaterial(intent) {
  const m = (intent.material || '').toUpperCase();
  const recommend = BED_TEMP_RECOMMEND[m];
  if (recommend == null || intent.bed_temp == null) return null;
  const delta = Math.abs(intent.bed_temp - recommend);
  if (delta > 25) {
    return _check('warn',
      `Bed ${intent.bed_temp}°C is ${delta}°C off recommended ${recommend}°C for ${m}.`,
      `Set bed to ${recommend}°C for typical ${m}.`);
  }
  return _check('pass', `Bed ${intent.bed_temp}°C is within 25°C of recommended ${recommend}°C for ${m}.`);
}

function checkDryingNeeded(intent) {
  if (!intent.spool_id) return null;
  const m = (intent.material || '').toUpperCase();
  const limit = NOZZLE_TEMP_LIMITS[m];
  if (!limit || !limit.dryHours) return null;
  const db = getDb();
  const spool = db.prepare('SELECT last_dried_at, profile_name FROM spools WHERE id = ?').get(intent.spool_id);
  if (!spool || !spool.last_dried_at) {
    return _check('warn',
      `${m} drying recommended (last drying date unknown for this spool).`,
      `Dry ${spool?.profile_name || 'this spool'} for ${limit.dryHours}h before printing.`);
  }
  const daysSince = (Date.now() - new Date(spool.last_dried_at).getTime()) / (24 * 3600 * 1000);
  if (daysSince > 60) {
    return _check('warn',
      `Spool last dried ${Math.round(daysSince)} days ago — moisture absorption likely.`,
      `Re-dry for ${limit.dryHours}h before printing.`);
  }
  return _check('pass', `Spool dried ${Math.round(daysSince)} days ago — within tolerance.`);
}

function checkLastPrintResult(intent) {
  if (!intent.printer_id) return null;
  const db = getDb();
  const last = db.prepare(`
    SELECT status, finished_at FROM print_history
    WHERE printer_id = ? ORDER BY id DESC LIMIT 1
  `).get(intent.printer_id);
  if (!last) return _check('info', 'No previous print history for this printer.');
  if (last.status === 'failed' || last.status === 'cancelled') {
    return _check('warn',
      `Previous print on this printer ${last.status === 'failed' ? 'failed' : 'was cancelled'}.`,
      'Inspect the printer (filament path, bed clean) before starting a new print.');
  }
  return _check('pass', `Previous print finished successfully.`);
}

function checkPrinterOnline(intent) {
  if (!intent.printer_id) return null;
  const printerStates = intent._printerStates || {};
  const ps = printerStates[intent.printer_id];
  if (!ps) return _check('fail', 'Printer is offline — cannot start a print.');
  if (ps.gcode_state === 'RUNNING' || ps.gcode_state === 'PAUSE') {
    return _check('fail', 'Printer is already busy with another print.', 'Wait for current print to finish.');
  }
  if (ps._u1_exceptions && ps._u1_exceptions.length) {
    return _check('warn',
      `Printer has ${ps._u1_exceptions.length} active exception(s).`,
      'Acknowledge or clear exceptions before starting.');
  }
  return _check('pass', 'Printer is online and idle.');
}

function checkBuildVolume(intent) {
  if (!intent.bbox || !intent.printer_id) return null;
  const db = getDb();
  const p = db.prepare('SELECT model FROM printers WHERE id = ?').get(intent.printer_id);
  if (!p) return null;
  // Coarse build-volume table; production code would hit printer-capabilities.
  const volumes = {
    'Snapmaker U1': [271, 335, 275],
    'Snapmaker J1': [320, 200, 200],
    'Bambu X1C': [256, 256, 256],
    'Bambu A1': [256, 256, 256],
    'Bambu A1 mini': [180, 180, 180],
    'Bambu P1S': [256, 256, 256],
    'Bambu H2D': [320, 320, 325],
    'Prusa MK4': [250, 210, 220],
    'Prusa Mini': [180, 180, 180],
    'Prusa XL': [360, 360, 360],
  };
  const bv = volumes[p.model];
  if (!bv) return null;
  const [sx, sy, sz] = intent.bbox;
  if (sx > bv[0] || sy > bv[1] || sz > bv[2]) {
    return _check('fail',
      `Model ${sx.toFixed(0)}×${sy.toFixed(0)}×${sz.toFixed(0)}mm exceeds ${p.model} build volume ${bv.join('×')}mm.`,
      'Scale the model down or split into pieces.');
  }
  if (sx > bv[0] * 0.95 || sy > bv[1] * 0.95) {
    return _check('warn',
      `Model nearly fills the bed — verify orientation and skirt clearance.`,
      'Add some margin or rotate.');
  }
  return _check('pass', `Model ${sx.toFixed(0)}×${sy.toFixed(0)}×${sz.toFixed(0)}mm fits ${p.model} build volume.`);
}

const CHECKS = [
  checkPrinterOnline,
  checkLastPrintResult,
  checkFilamentAvailable,
  checkTempBounds,
  checkBedTempVsMaterial,
  checkDryingNeeded,
  checkBuildVolume,
];

/**
 * Run all checks. `intent` carries everything: printer_id, material,
 * estimated_grams, spool_id, hotend_temp, bed_temp, bbox=[x,y,z]mm.
 * Optional `_printerStates` injected by the API layer for online check.
 */
export function runPreflight(intent) {
  const results = [];
  for (const c of CHECKS) {
    try {
      const r = c(intent);
      if (r) results.push({ check: c.name, ...r });
    } catch (e) {
      results.push({ check: c.name, severity: 'info', message: `Check '${c.name}' threw: ${e.message}`, fix: null });
    }
  }
  const counts = { pass: 0, warn: 0, fail: 0, info: 0 };
  for (const r of results) counts[r.severity] = (counts[r.severity] || 0) + 1;
  const overall = counts.fail > 0 ? 'fail' : counts.warn > 0 ? 'warn' : 'pass';
  return { overall, counts, checks: results };
}

export const _internals = { CHECKS, NOZZLE_TEMP_LIMITS, BED_TEMP_RECOMMEND };
