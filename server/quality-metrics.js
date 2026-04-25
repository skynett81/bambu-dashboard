/**
 * Quality Metrics — aggregate `print_history` into useful KPIs:
 *   - Success rate per (printer, material, profile)
 *   - Mean Time Between Failures (MTBF) in hours
 *   - Cost per gram, $/g and total spend over time window
 *   - Filament efficiency (slicer estimate vs actual usage)
 *   - Trend bucketing (weekly / monthly success rate)
 *
 * All functions take an optional time window (`days`) so the dashboard
 * can show "last 30 days" / "last 90 days" rolls.
 */

import { getDb } from './db/connection.js';

function _windowClause(days) {
  if (!days || days <= 0) return '';
  return `AND started_at >= datetime('now', '-${days} days')`;
}

function _safeDiv(a, b) { return b > 0 ? a / b : 0; }

/**
 * Success rate broken down by (printer, material). Status counted:
 *   completed → success; failed/cancelled → failure; in-progress excluded.
 */
export function getSuccessRates(opts = {}) {
  const db = getDb();
  const win = _windowClause(opts.days);
  const where = opts.printerId ? `AND printer_id = ?` : '';
  const args = opts.printerId ? [opts.printerId] : [];
  const rows = db.prepare(`
    SELECT printer_id, COALESCE(filament_type, 'unknown') AS material,
           SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) AS completed,
           SUM(CASE WHEN status IN ('failed','cancelled') THEN 1 ELSE 0 END) AS failed,
           COUNT(*) AS total,
           AVG(filament_used_g) AS avg_grams,
           SUM(filament_used_g) AS total_grams
    FROM print_history
    WHERE 1=1 ${win} ${where}
    GROUP BY printer_id, material
    ORDER BY printer_id, material
  `).all(...args);
  return rows.map(r => ({
    ...r,
    success_rate: _safeDiv(r.completed, r.completed + r.failed),
  }));
}

/**
 * Mean Time Between Failures — average hours of successful printing
 * between failure events. Returns null when there are no failures
 * (good problem to have).
 */
export function getMtbf(opts = {}) {
  const db = getDb();
  const win = _windowClause(opts.days);
  const where = opts.printerId ? `AND printer_id = ?` : '';
  const args = opts.printerId ? [opts.printerId] : [];
  const rows = db.prepare(`
    SELECT status, started_at, finished_at
    FROM print_history
    WHERE 1=1 ${win} ${where}
    ORDER BY started_at
  `).all(...args);
  let succHours = 0, failures = 0;
  for (const r of rows) {
    if (!r.finished_at) continue;
    const dur = (new Date(r.finished_at).getTime() - new Date(r.started_at).getTime()) / 3600000;
    if (r.status === 'completed') succHours += dur;
    else if (r.status === 'failed' || r.status === 'cancelled') failures++;
  }
  return {
    successful_hours: +succHours.toFixed(1),
    failures,
    mtbf_hours: failures > 0 ? +(succHours / failures).toFixed(1) : null,
  };
}

/**
 * Cost per gram + total spend. Pulls cost from cost_per_print table when
 * available, falls back to filament profile cost × usage.
 */
export function getCostMetrics(opts = {}) {
  const db = getDb();
  const win = _windowClause(opts.days);
  const where = opts.printerId ? `AND ph.printer_id = ?` : '';
  const args = opts.printerId ? [opts.printerId] : [];
  // cost_per_print is optional. Probe schema first so test environments
  // without the cost-tracking migration still get a valid (zero) result.
  const hasCostTable = db.prepare(
    "SELECT name FROM sqlite_master WHERE type='table' AND name='cost_per_print'"
  ).get();
  const sql = hasCostTable
    ? `SELECT ph.id, ph.filament_used_g, ph.filament_type, cp.total_cost
       FROM print_history ph
       LEFT JOIN cost_per_print cp ON cp.print_history_id = ph.id
       WHERE ph.status = 'completed' ${win} ${where}`
    : `SELECT ph.id, ph.filament_used_g, ph.filament_type, NULL as total_cost
       FROM print_history ph
       WHERE ph.status = 'completed' ${win} ${where}`;
  const rows = db.prepare(sql).all(...args);
  let totalCost = 0, totalGrams = 0, runs = 0;
  for (const r of rows) {
    if (r.total_cost > 0) totalCost += r.total_cost;
    if (r.filament_used_g > 0) totalGrams += r.filament_used_g;
    runs++;
  }
  return {
    total_cost: +totalCost.toFixed(2),
    total_grams: +totalGrams.toFixed(1),
    cost_per_gram: totalGrams > 0 ? +(totalCost / totalGrams).toFixed(4) : 0,
    runs,
  };
}

/**
 * Filament efficiency — slicer estimate vs actual use. > 1 means we used
 * more than the slicer expected (usually because of priming/purging).
 */
export function getFilamentEfficiency(opts = {}) {
  const db = getDb();
  const win = _windowClause(opts.days);
  const where = opts.printerId ? `AND printer_id = ?` : '';
  const args = opts.printerId ? [opts.printerId] : [];
  const rows = db.prepare(`
    SELECT estimated_filament_g, filament_used_g, filament_type
    FROM print_history
    WHERE estimated_filament_g > 0 AND filament_used_g > 0 AND status = 'completed'
      ${win} ${where}
  `).all(...args);
  if (!rows.length) return { samples: 0, efficiency: null };
  let est = 0, actual = 0;
  for (const r of rows) { est += r.estimated_filament_g; actual += r.filament_used_g; }
  return {
    samples: rows.length,
    estimated_total_g: +est.toFixed(1),
    actual_total_g: +actual.toFixed(1),
    efficiency: +(actual / est).toFixed(4),
    overshoot_grams: +(actual - est).toFixed(1),
  };
}

/**
 * Weekly success-rate trend (last N weeks). Returns ISO week label →
 * { completed, failed, success_rate }.
 */
export function getWeeklyTrend(opts = {}) {
  const db = getDb();
  const weeks = Math.max(1, Math.min(52, opts.weeks || 12));
  const where = opts.printerId ? `AND printer_id = ?` : '';
  const args = opts.printerId ? [opts.printerId] : [];
  const rows = db.prepare(`
    SELECT strftime('%Y-W%W', started_at) AS week,
           SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) AS completed,
           SUM(CASE WHEN status IN ('failed','cancelled') THEN 1 ELSE 0 END) AS failed
    FROM print_history
    WHERE started_at >= datetime('now', '-${weeks * 7} days')
      ${where}
    GROUP BY week
    ORDER BY week
  `).all(...args);
  return rows.map(r => ({
    week: r.week,
    completed: r.completed,
    failed: r.failed,
    success_rate: _safeDiv(r.completed, r.completed + r.failed),
  }));
}

/** Combined dashboard payload. */
export function getDashboardMetrics(opts = {}) {
  return {
    window_days: opts.days || null,
    success_by_material: getSuccessRates(opts),
    mtbf: getMtbf(opts),
    cost: getCostMetrics(opts),
    efficiency: getFilamentEfficiency(opts),
    weekly_trend: getWeeklyTrend(opts),
  };
}
