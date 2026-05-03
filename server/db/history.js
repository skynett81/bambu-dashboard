import { getDb } from './connection.js';
import { createLogger } from '../logger.js';

const log = createLogger('db:history');

// ---- Print History ----

export function getHistory(limit = 50, offset = 0, printerId = null, status = null) {
  const db = getDb();
  const conditions = [];
  const params = [];
  if (printerId) { conditions.push('printer_id = ?'); params.push(printerId); }
  if (status) { conditions.push('status = ?'); params.push(status); }
  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  params.push(limit, offset);
  // id DESC tiebreaker — started_at is TEXT and not unique; without a
  // stable secondary sort, batch imports or rapid prints can appear
  // twice or be skipped between paginated pages.
  return db.prepare(`SELECT * FROM print_history ${where} ORDER BY started_at DESC, id DESC LIMIT ? OFFSET ?`).all(...params);
}

export function getHistoryById(id) {
  const db = getDb();
  return db.prepare('SELECT * FROM print_history WHERE id = ?').get(id) || null;
}

export function updateHistoryNotes(id, notes) {
  const db = getDb();
  db.prepare('UPDATE print_history SET notes = ? WHERE id = ?').run(notes, id);
  return db.prepare('SELECT * FROM print_history WHERE id = ?').get(id) || null;
}

export function reviewPrint(id, review) {
  const db = getDb();
  const existing = db.prepare('SELECT * FROM print_history WHERE id = ?').get(id);
  if (!existing) return null;

  const status = review.status; // 'approved', 'rejected', 'partial'
  const wasteG = review.waste_g ?? null;
  const notes = review.notes ?? null;

  // Wrap the multi-step review in a transaction. Otherwise a crash
  // between UPDATE review_status and INSERT INTO filament_waste leaves
  // half-written state — waste recorded without the review status, or
  // review marked approved without waste_g zeroed out.
  db.exec('BEGIN');
  try {
    db.prepare(`UPDATE print_history SET
      review_status = ?,
      review_waste_g = ?,
      review_notes = ?,
      reviewed_at = datetime('now')
      WHERE id = ?`).run(status, wasteG, notes, id);

    // If rejected or partial, add waste to filament_waste table
    if ((status === 'rejected' || status === 'partial') && (wasteG || existing.filament_used_g)) {
      const actualWaste = wasteG ?? existing.filament_used_g ?? 0;
      if (actualWaste > 0) {
        db.prepare(`INSERT INTO filament_waste (printer_id, waste_g, reason, notes)
          VALUES (?, ?, ?, ?)`).run(
          existing.printer_id,
          actualWaste,
          status === 'rejected' ? 'rejected_print' : 'partial_waste',
          `Print #${id}: ${existing.filename || 'unknown'} — ${notes || status}`
        );
      }
    }

    // If approved, update waste_g to 0 (no waste)
    if (status === 'approved') {
      db.prepare('UPDATE print_history SET waste_g = 0 WHERE id = ?').run(id);
    }
    db.exec('COMMIT');
  } catch (e) {
    try { db.exec('ROLLBACK'); } catch { /* ignore */ }
    throw e;
  }

  return db.prepare('SELECT * FROM print_history WHERE id = ?').get(id);
}

export function getUnreviewedPrints(printerId = null) {
  const db = getDb();
  let sql = 'SELECT * FROM print_history WHERE review_status IS NULL AND status IN (\'completed\', \'cancelled\', \'failed\') ORDER BY finished_at DESC';
  const params = [];
  if (printerId) {
    sql = 'SELECT * FROM print_history WHERE review_status IS NULL AND status IN (\'completed\', \'cancelled\', \'failed\') AND printer_id = ? ORDER BY finished_at DESC';
    params.push(printerId);
  }
  return db.prepare(sql).all(...params);
}

export function addHistory(record) {
  const db = getDb();
  const result = db.prepare(`
    INSERT INTO print_history (printer_id, started_at, finished_at, filename, status,
      duration_seconds, filament_used_g, filament_type, filament_color, layer_count,
      notes, color_changes, waste_g, nozzle_type, nozzle_diameter, speed_level,
      bed_target, nozzle_target, max_nozzle_temp, max_bed_temp, max_chamber_temp, filament_brand,
      ams_units_used, tray_id, gcode_file, model_name, model_url)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(record.printer_id || null, record.started_at, record.finished_at, record.filename, record.status,
    record.duration_seconds, record.filament_used_g, record.filament_type,
    record.filament_color, record.layer_count, record.notes || null,
    record.color_changes || 0, record.waste_g || 0,
    record.nozzle_type || null, record.nozzle_diameter || null,
    record.speed_level || null, record.bed_target || null, record.nozzle_target || null,
    record.max_nozzle_temp || null, record.max_bed_temp || null, record.max_chamber_temp || null,
    record.filament_brand || null, record.ams_units_used || null,
    record.tray_id || null, record.gcode_file || null,
    record.model_name || null, record.model_url || null);
  return Number(result.lastInsertRowid);
}

// ---- Statistics ----

export function getStatistics(printerId = null, startDate = null, endDate = null) {
  const db = getDb();
  // Build dynamic WHERE clause for printer + date range
  const clauses = [];
  const params = [];
  if (printerId) { clauses.push('printer_id = ?'); params.push(printerId); }
  if (startDate) { clauses.push('started_at >= ?'); params.push(startDate); }
  if (endDate) { clauses.push('started_at <= ?'); params.push(endDate); }
  const where = clauses.length ? ' WHERE ' + clauses.join(' AND ') : '';
  const and = where ? ' AND ' : ' WHERE ';

  const total = db.prepare(`SELECT COUNT(*) as count FROM print_history${where}`).get(...params);
  const completed = db.prepare(`SELECT COUNT(*) as count FROM print_history${where}${and}status = 'completed'`).get(...params);
  const failed = db.prepare(`SELECT COUNT(*) as count FROM print_history${where}${and}status = 'failed'`).get(...params);
  const cancelled = db.prepare(`SELECT COUNT(*) as count FROM print_history${where}${and}status = 'cancelled'`).get(...params);
  const totalTime = db.prepare(`SELECT COALESCE(SUM(duration_seconds), 0) as seconds FROM print_history${where}`).get(...params);
  const totalFilament = db.prepare(`SELECT COALESCE(SUM(filament_used_g), 0) as grams FROM print_history${where}`).get(...params);
  const avgDuration = db.prepare(`SELECT COALESCE(AVG(duration_seconds), 0) as avg FROM print_history${where}${and}status = 'completed'`).get(...params);
  const longestPrint = db.prepare(`SELECT filename, duration_seconds FROM print_history${where}${and}status = 'completed' ORDER BY duration_seconds DESC LIMIT 1`).get(...params);
  const mostUsedFilament = db.prepare(`SELECT filament_type, COUNT(*) as count FROM print_history${where}${and}filament_type IS NOT NULL GROUP BY filament_type ORDER BY count DESC LIMIT 1`).get(...params);

  const filamentByType = db.prepare(`SELECT filament_type as type, COALESCE(SUM(filament_used_g), 0) as grams, COUNT(*) as prints FROM print_history${where}${and}filament_type IS NOT NULL GROUP BY filament_type ORDER BY grams DESC`).all(...params);

  // Weekly trends: respect date range if given, else last 56 days.
  // Check both startDate AND endDate — passing only endDate previously
  // fell through to the rolling 56-day window even though the caller had
  // specified a range, producing internally inconsistent stats.
  const weekWhere = (startDate || endDate) ? where : (where ? where + ' AND' : ' WHERE') + " started_at >= datetime('now', '-56 days')";
  const printsPerWeek = db.prepare(`
    SELECT strftime('%Y-W%W', started_at) as week,
           COUNT(*) as total,
           SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
           SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed
    FROM print_history${weekWhere}
    GROUP BY week ORDER BY week
  `).all(...params);

  const legacyCost = db.prepare("SELECT COALESCE(SUM(cost_nok * (weight_used_g / weight_total_g)), 0) as cost FROM filament_inventory WHERE weight_total_g > 0").get();
  const spoolCost = db.prepare("SELECT COALESCE(SUM(cost * (used_weight_g / initial_weight_g)), 0) as cost FROM spools WHERE initial_weight_g > 0 AND cost > 0").get();
  const totalCost = { cost: (legacyCost.cost || 0) + (spoolCost.cost || 0) };

  // Success rate by filament type
  const successByFilament = db.prepare(`SELECT filament_type as type, COUNT(*) as total, SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed FROM print_history${where}${and}filament_type IS NOT NULL GROUP BY filament_type ORDER BY total DESC`).all(...params);

  // Success rate by speed level
  const successBySpeed = db.prepare(`SELECT speed_level as level, COUNT(*) as total, SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed FROM print_history${where}${and}speed_level IS NOT NULL GROUP BY speed_level ORDER BY level`).all(...params);

  // Filament by brand
  const filamentByBrand = db.prepare(`SELECT filament_brand as brand, filament_type as type, COALESCE(SUM(filament_used_g), 0) as grams, COUNT(*) as prints FROM print_history${where}${and}filament_brand IS NOT NULL GROUP BY filament_brand, filament_type ORDER BY grams DESC`).all(...params);

  // Temperature records
  const tempStats = db.prepare(`SELECT COALESCE(MAX(max_nozzle_temp), 0) as peak_nozzle, COALESCE(AVG(max_nozzle_temp), 0) as avg_nozzle, COALESCE(MAX(max_bed_temp), 0) as peak_bed, COALESCE(AVG(max_bed_temp), 0) as avg_bed, COALESCE(MAX(max_chamber_temp), 0) as peak_chamber, COALESCE(AVG(CASE WHEN max_chamber_temp > 0 THEN max_chamber_temp END), 0) as avg_chamber FROM print_history${where}${and}status = 'completed' AND max_nozzle_temp > 0`).get(...params);

  // Top 5 files
  const topFiles = db.prepare(`SELECT filename, COUNT(*) as count, SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed FROM print_history${where}${and}filename IS NOT NULL GROUP BY filename ORDER BY count DESC LIMIT 5`).all(...params);

  // Monthly trends: respect date range if given, else last 180 days
  const monthWhere = (startDate || endDate) ? where : (where ? where + ' AND' : ' WHERE') + " started_at >= datetime('now', '-180 days')";
  const monthlyTrends = db.prepare(`SELECT strftime('%Y-%m', started_at) as month, COUNT(*) as total, SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed, COALESCE(SUM(duration_seconds), 0) as total_seconds, COALESCE(SUM(filament_used_g), 0) as total_filament_g FROM print_history${monthWhere} GROUP BY month ORDER BY month`).all(...params);

  // Total layers
  const totalLayers = db.prepare(`SELECT COALESCE(SUM(layer_count), 0) as total FROM print_history${where}${and}status = 'completed'`).get(...params);

  // Prints by day of week (0=Sunday)
  const printsByDayOfWeek = db.prepare(`SELECT CAST(strftime('%w', started_at) AS INTEGER) as dow, COUNT(*) as count FROM print_history${where} GROUP BY dow ORDER BY dow`).all(...params);

  // Prints by hour of day
  const printsByHour = db.prepare(`SELECT CAST(strftime('%H', started_at) AS INTEGER) as hour, COUNT(*) as count FROM print_history${where} GROUP BY hour ORDER BY hour`).all(...params);

  // AMS stats from snapshots — use printer filter only (no date range for ams_snapshots)
  const amsWhere = printerId ? ' WHERE printer_id = ?' : '';
  const amsParams = printerId ? [printerId] : [];
  const amsFilamentByBrand = db.prepare(`SELECT tray_brand as brand, tray_type as type, COUNT(DISTINCT timestamp) as uses FROM ams_snapshots${amsWhere}${amsWhere ? ' AND' : ' WHERE'} tray_brand IS NOT NULL GROUP BY tray_brand, tray_type ORDER BY uses DESC LIMIT 10`).all(...amsParams);
  const amsAvgHumidity = db.prepare(`SELECT ams_unit, ROUND(AVG(CAST(humidity AS REAL)), 1) as avg_humidity, COUNT(*) as readings FROM ams_snapshots${amsWhere}${amsWhere ? ' AND' : ' WHERE'} humidity IS NOT NULL GROUP BY ams_unit ORDER BY ams_unit`).all(...amsParams);

  // Extra stats: waste, color changes, avg filament per print, nozzle breakdown, streaks
  const wasteStats = db.prepare(`SELECT COALESCE(SUM(waste_g), 0) as total_waste, COALESCE(SUM(color_changes), 0) as total_color_changes FROM print_history${where}`).get(...params);
  const avgFilamentPerPrint = db.prepare(`SELECT COALESCE(AVG(filament_used_g), 0) as avg FROM print_history${where}${and}status = 'completed' AND filament_used_g > 0`).get(...params);
  const nozzleBreakdown = db.prepare(`SELECT nozzle_type as type, nozzle_diameter as diameter, COUNT(*) as prints, SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed FROM print_history${where}${and}nozzle_type IS NOT NULL GROUP BY nozzle_type, nozzle_diameter ORDER BY prints DESC`).all(...params);

  // Streak: consecutive completed prints (current)
  const recentPrints = db.prepare(`SELECT status FROM print_history${where} ORDER BY started_at DESC LIMIT 50`).all(...params);
  let currentStreak = 0;
  for (const p of recentPrints) {
    if (p.status === 'completed') currentStreak++;
    else break;
  }
  // Best streak ever
  let bestStreak = 0, tempStreak = 0;
  const allPrintsForStreak = db.prepare(`SELECT status FROM print_history${where} ORDER BY started_at ASC`).all(...params);
  for (const p of allPrintsForStreak) {
    if (p.status === 'completed') { tempStreak++; if (tempStreak > bestStreak) bestStreak = tempStreak; }
    else tempStreak = 0;
  }

  // Avg print time per day-of-week
  const avgDurationByDay = db.prepare(`SELECT CAST(strftime('%w', started_at) AS INTEGER) as dow, ROUND(AVG(duration_seconds) / 60) as avg_minutes FROM print_history${where}${and}status = 'completed' GROUP BY dow ORDER BY dow`).all(...params);

  // First and last print dates
  const firstPrint = db.prepare(`SELECT started_at FROM print_history${where} ORDER BY started_at ASC LIMIT 1`).get(...params);
  const lastPrint = db.prepare(`SELECT started_at FROM print_history${where} ORDER BY started_at DESC LIMIT 1`).get(...params);

  return {
    total_prints: total.count,
    completed_prints: completed.count,
    failed_prints: failed.count,
    cancelled_prints: cancelled.count,
    success_rate: total.count > 0 ? Math.round((completed.count / total.count) * 100) : 0,
    total_hours: Math.round(totalTime.seconds / 3600 * 10) / 10,
    total_filament_g: Math.round(totalFilament.grams * 10) / 10,
    avg_print_minutes: Math.round(avgDuration.avg / 60),
    longest_print: longestPrint || null,
    most_used_filament: mostUsedFilament?.type || null,
    filament_by_type: filamentByType,
    prints_per_week: printsPerWeek,
    estimated_cost_nok: Math.round(totalCost.cost * 10) / 10,
    success_by_filament: successByFilament.map(r => ({ type: r.type, total: r.total, completed: r.completed, rate: r.total > 0 ? Math.round((r.completed / r.total) * 100) : 0 })),
    success_by_speed: successBySpeed.map(r => ({ level: r.level, total: r.total, completed: r.completed, rate: r.total > 0 ? Math.round((r.completed / r.total) * 100) : 0 })),
    filament_by_brand: filamentByBrand,
    temp_stats: tempStats || { peak_nozzle: 0, avg_nozzle: 0, peak_bed: 0, avg_bed: 0, peak_chamber: 0, avg_chamber: 0 },
    top_files: topFiles,
    monthly_trends: monthlyTrends,
    total_layers: totalLayers.total,
    prints_by_day_of_week: printsByDayOfWeek,
    prints_by_hour: printsByHour,
    ams_filament_by_brand: amsFilamentByBrand,
    ams_avg_humidity: amsAvgHumidity,
    total_waste_g: Math.round(wasteStats.total_waste * 10) / 10,
    total_color_changes: wasteStats.total_color_changes,
    avg_filament_per_print_g: Math.round(avgFilamentPerPrint.avg * 10) / 10,
    nozzle_breakdown: nozzleBreakdown.map(r => ({ type: r.type, diameter: r.diameter, prints: r.prints, completed: r.completed, rate: r.prints > 0 ? Math.round((r.completed / r.prints) * 100) : 0 })),
    current_streak: currentStreak,
    best_streak: bestStreak,
    avg_duration_by_day: avgDurationByDay,
    first_print: firstPrint?.started_at || null,
    last_print: lastPrint?.started_at || null
  };
}

export function getHardwareStats(printerId = null) {
  const db = getDb();
  // NOTE: This function calls cross-domain helpers. Import them at call-site when wiring up.
  // For now, all logic is inlined using db directly to avoid circular imports.
  const result = {};

  // Build plates
  const plates = printerId
    ? db.prepare('SELECT * FROM build_plates WHERE printer_id = ? ORDER BY installed_at DESC').all(printerId)
    : db.prepare('SELECT * FROM build_plates ORDER BY printer_id, installed_at DESC').all();
  result.build_plates = plates.map(p => ({
    id: p.id, name: p.name, type: p.type, printer_id: p.printer_id,
    surface_condition: p.surface_condition, print_count: p.print_count || 0,
    active: p.active, installed_at: p.installed_at
  }));
  result.total_plate_prints = plates.reduce((sum, p) => sum + (p.print_count || 0), 0);

  // Firmware
  if (printerId) {
    result.firmware = db.prepare(`SELECT module, sw_ver, hw_ver, sn, MAX(timestamp) as timestamp
      FROM firmware_history WHERE printer_id = ? GROUP BY module ORDER BY module`).all(printerId)
      .map(f => ({ ...f, printer_id: printerId }));
  } else {
    result.firmware = db.prepare(`SELECT printer_id, module, sw_ver, hw_ver, sn, MAX(timestamp) as timestamp
      FROM firmware_history GROUP BY printer_id, module ORDER BY printer_id, module`).all();
  }

  // Component wear
  if (printerId) {
    result.component_wear = db.prepare('SELECT * FROM component_wear WHERE printer_id = ? ORDER BY component').all(printerId);
  } else {
    result.component_wear = db.prepare('SELECT * FROM component_wear ORDER BY printer_id, component').all();
  }

  return result;
}

// ---- Activity Heatmap ----

export function getDailyActivity(days = 365) {
  const db = getDb();
  return db.prepare(`
    SELECT date(started_at) as day,
      COUNT(*) as prints,
      SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
      SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed,
      SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled,
      ROUND(SUM(duration_seconds) / 3600.0, 1) as hours,
      ROUND(SUM(filament_used_g), 1) as filament_g
    FROM print_history
    WHERE started_at >= date('now', '-' || ? || ' days')
    GROUP BY date(started_at)
    ORDER BY day ASC
  `).all(days);
}

export function getActivityStreaks() {
  const db = getDb();
  const rows = db.prepare(`
    SELECT DISTINCT date(started_at) as day
    FROM print_history
    WHERE started_at >= date('now', '-365 days')
    ORDER BY day ASC
  `).all();
  return rows.map(r => r.day);
}
