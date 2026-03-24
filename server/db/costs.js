import { getDb } from './connection.js';
import { createLogger } from '../logger.js';

const log = createLogger('db:costs');

// ---- Waste Tracking ----

export function addWaste(w) {
  const db = getDb();
  return db.prepare('INSERT INTO filament_waste (printer_id, waste_g, reason, notes) VALUES (?, ?, ?, ?)').run(
    w.printer_id || null, w.waste_g, w.reason || 'manual', w.notes || null
  );
}

export function deleteWaste(id) {
  const db = getDb();
  return db.prepare('DELETE FROM filament_waste WHERE id = ?').run(id);
}

export function getWasteHistory(limit = 50, printerId = null) {
  const db = getDb();
  if (printerId) {
    return db.prepare('SELECT * FROM filament_waste WHERE printer_id = ? ORDER BY timestamp DESC LIMIT ?').all(printerId, limit);
  }
  return db.prepare('SELECT * FROM filament_waste ORDER BY timestamp DESC LIMIT ?').all(limit);
}

export function getWasteStats(printerId = null, startupPurgeG = 1.0, wastePerChangeG = 5.0) {
  const db = getDb();
  const where = printerId ? ' WHERE printer_id = ?' : '';
  const params = printerId ? [printerId] : [];

  // From filament_waste table (manual entries)
  const manualWaste = db.prepare(`SELECT COALESCE(SUM(waste_g), 0) as total, COUNT(*) as count FROM filament_waste${where}`).get(...params);

  // From print_history (auto-tracked)
  // waste_g = mechanical waste (purge, color changes)
  // For failed/cancelled prints, filament_used_g is also waste (object is discarded)
  const autoWaste = db.prepare(`SELECT
    COALESCE(SUM(waste_g), 0) as total,
    COALESCE(SUM(CASE WHEN status IN ('failed','cancelled') THEN filament_used_g ELSE 0 END), 0) as failed_waste,
    COALESCE(SUM(color_changes), 0) as changes,
    COUNT(CASE WHEN color_changes > 0 THEN 1 END) as prints_with_changes,
    COUNT(CASE WHEN waste_g > 0 THEN 1 END) as prints_with_waste,
    COUNT(CASE WHEN status IN ('failed','cancelled') THEN 1 END) as failed_count
    FROM print_history${where}`).get(...params);

  // Total prints for average
  const totalPrints = db.prepare(`SELECT COUNT(*) as count FROM print_history${where}`).get(...params);

  // Average cost per gram from inventory (legacy + spools)
  const legacyCostInfo = db.prepare("SELECT AVG(cost_nok / weight_total_g) as avg FROM filament_inventory WHERE weight_total_g > 0 AND cost_nok > 0").get();
  const spoolCostInfo = db.prepare("SELECT AVG(cost / initial_weight_g) as avg FROM spools WHERE initial_weight_g > 0 AND cost > 0").get();
  const costInfo = { avg_cost_per_g: spoolCostInfo.avg || legacyCostInfo.avg || 0.25 };

  // Waste per week (combined)
  const wastePerWeek = db.prepare(`
    SELECT week, SUM(waste) as total FROM (
      SELECT strftime('%Y-W%W', started_at) as week, waste_g as waste FROM print_history${where}${where ? ' AND' : ' WHERE'} started_at >= datetime('now', '-56 days') AND waste_g > 0
      UNION ALL
      SELECT strftime('%Y-W%W', timestamp) as week, waste_g as waste FROM filament_waste${where}${where ? ' AND' : ' WHERE'} timestamp >= datetime('now', '-56 days')
    ) GROUP BY week ORDER BY week
  `).all(...params, ...params);

  // Waste per month (combined, last 6 months)
  const and = where ? ' AND' : ' WHERE';
  const wastePerMonth = db.prepare(`
    SELECT month, SUM(waste) as total FROM (
      SELECT strftime('%Y-%m', started_at) as month, waste_g as waste FROM print_history${where}${and} started_at >= datetime('now', '-180 days') AND waste_g > 0
      UNION ALL
      SELECT strftime('%Y-%m', timestamp) as month, waste_g as waste FROM filament_waste${where}${and} timestamp >= datetime('now', '-180 days')
    ) GROUP BY month ORDER BY month
  `).all(...params, ...params);

  // Waste by material (from print_history only)
  const wasteByMaterial = db.prepare(`SELECT filament_type as type, ROUND(SUM(waste_g), 1) as total FROM print_history${where}${and} waste_g > 0 AND filament_type IS NOT NULL GROUP BY filament_type ORDER BY total DESC`).all(...params);

  // Waste by filament (color + type + brand)
  const wasteByFilament = db.prepare(`
    SELECT filament_type as type, filament_color as color, filament_brand as brand,
           ROUND(SUM(waste_g), 1) as waste, ROUND(SUM(filament_used_g), 1) as used,
           COUNT(*) as prints
    FROM print_history${where}${and} waste_g > 0 AND filament_color IS NOT NULL
    GROUP BY filament_color, filament_type
    ORDER BY waste DESC
  `).all(...params);

  // Waste by printer (combined)
  const wasteByPrinter = db.prepare(`
    SELECT printer_id, ROUND(SUM(waste), 1) as total FROM (
      SELECT printer_id, waste_g as waste FROM print_history${where}${and} waste_g > 0
      UNION ALL
      SELECT printer_id, waste_g as waste FROM filament_waste${where}
    ) WHERE printer_id IS NOT NULL GROUP BY printer_id ORDER BY total DESC
  `).all(...params, ...params);

  // Total filament used (for efficiency ratio)
  const totalFilament = db.prepare(`SELECT COALESCE(SUM(filament_used_g), 0) as total FROM print_history${where}`).get(...params);

  // Waste breakdown by source (purge vs color change vs failed)
  const wasteBreakdown = db.prepare(`
    SELECT
      ROUND(SUM(CASE WHEN status IN ('failed','cancelled') THEN filament_used_g ELSE 0 END), 1) as failed_g,
      COALESCE(SUM(CASE WHEN color_changes > 0 THEN color_changes ELSE 0 END), 0) as total_color_change_count,
      COUNT(*) as total_prints,
      COUNT(CASE WHEN status IN ('failed','cancelled') THEN 1 END) as failed_prints
    FROM print_history${where}
  `).get(...params);
  const purgeG = Math.round((totalPrints.count * startupPurgeG) * 10) / 10;
  const colorChangeG = Math.round((wasteBreakdown.total_color_change_count * wastePerChangeG) * 10) / 10;

  // Daily waste (last 30 days)
  const wastePerDay = db.prepare(`
    SELECT day, SUM(waste) as total FROM (
      SELECT date(started_at) as day, waste_g as waste FROM print_history${where}${and} started_at >= datetime('now', '-30 days') AND waste_g > 0
      UNION ALL
      SELECT date(timestamp) as day, waste_g as waste FROM filament_waste${where}${and} timestamp >= datetime('now', '-30 days')
    ) GROUP BY day ORDER BY day
  `).all(...params, ...params);

  // Top wasteful prints (highest waste ratio)
  const topWasteful = db.prepare(`
    SELECT filename, waste_g, filament_used_g, color_changes, status, filament_color, filament_type,
           CASE WHEN filament_used_g > 0 THEN ROUND(waste_g * 100.0 / filament_used_g, 1) ELSE 0 END as waste_pct
    FROM print_history${where}${and} waste_g > 0 AND filament_used_g > 0
    ORDER BY waste_pct DESC LIMIT 5
  `).all(...params);

  // Recent events with filament color
  const recentAuto = db.prepare(`SELECT printer_id, started_at as timestamp, filename as notes, color_changes, waste_g, status, filament_color, filament_type, filament_brand, filament_used_g, duration_seconds, 'auto' as reason FROM print_history${where}${and} waste_g > 0 ORDER BY started_at DESC LIMIT 20`).all(...params);
  const recentManual = db.prepare(`SELECT id, printer_id, timestamp, notes, 0 as color_changes, waste_g, null as status, null as filament_color, null as filament_type, null as filament_brand, null as filament_used_g, null as duration_seconds, reason FROM filament_waste${where} ORDER BY timestamp DESC LIMIT 20`).all(...params);

  const recent = [...recentAuto, ...recentManual]
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    .slice(0, 20);

  // Total waste = manual + auto (purge/color changes) + failed print filament
  const totalWasteG = manualWaste.total + autoWaste.total + (autoWaste.failed_waste || 0);
  const avgPerG = costInfo.avg_cost_per_g;

  return {
    total_waste_g: Math.round(totalWasteG * 10) / 10,
    total_color_changes: autoWaste.changes,
    total_cost: Math.round(totalWasteG * avgPerG * 10) / 10,
    avg_per_print: totalPrints.count > 0 ? Math.round((totalWasteG / totalPrints.count) * 10) / 10 : 0,
    total_filament_used_g: Math.round(totalFilament.total * 10) / 10,
    total_prints: totalPrints.count,
    manual_entries: manualWaste.count,
    prints_with_changes: autoWaste.prints_with_changes,
    prints_with_waste: autoWaste.prints_with_waste + manualWaste.count,
    waste_breakdown: {
      purge_g: purgeG,
      color_change_g: colorChangeG,
      failed_g: wasteBreakdown.failed_g || 0,
      manual_g: manualWaste.total,
      failed_prints: wasteBreakdown.failed_prints || 0
    },
    cost_per_g: Math.round(avgPerG * 100) / 100,
    waste_per_day: wastePerDay,
    waste_per_week: wastePerWeek,
    waste_per_month: wastePerMonth,
    waste_by_material: wasteByMaterial,
    waste_by_filament: wasteByFilament,
    waste_by_printer: wasteByPrinter,
    waste_top_prints: topWasteful,
    recent
  };
}

export function backfillWaste(startupPurgeG = 1.0, wastePerChangeG = 5) {
  const db = getDb();
  // Add startup purge to all prints that have waste_g = 0 or only color-change waste
  const prints = db.prepare("SELECT id, status, waste_g, color_changes, filament_used_g FROM print_history").all();
  let updated = 0;
  for (const p of prints) {
    const colorWaste = (p.color_changes || 0) * wastePerChangeG;
    let newWaste = startupPurgeG + colorWaste;
    if (p.status === 'failed' || p.status === 'cancelled') {
      newWaste += (p.filament_used_g || 0);
    }
    newWaste = Math.round(newWaste * 10) / 10;
    if (newWaste !== p.waste_g) {
      db.prepare("UPDATE print_history SET waste_g = ? WHERE id = ?").run(newWaste, p.id);
      updated++;
    }
  }
  return updated;
}

// ---- Print Costs (Advanced) ----

export function recalculateAllCosts() {
  const db = getDb();
  const rows = db.prepare(`SELECT id, printer_id, duration_seconds, filament_used_g, waste_g, status, tray_id FROM print_history`).all();
  let updated = 0;
  for (const row of rows) {
    try {
      // Try to find the linked spool for accurate filament cost
      let spoolId = null;
      if (row.printer_id && row.tray_id != null) {
        const spool = db.prepare('SELECT id FROM spools WHERE printer_id = ? AND ams_tray = ? AND archived = 0').get(row.printer_id, parseInt(row.tray_id));
        if (spool) spoolId = spool.id;
      }
      const costs = estimatePrintCostAdvanced(row.filament_used_g || 0, row.duration_seconds || 0, spoolId, row.printer_id, row.status, row.waste_g || 0);
      if (costs.total_cost > 0) {
        db.prepare(`INSERT OR REPLACE INTO print_costs (print_history_id, filament_cost, electricity_cost, depreciation_cost, labor_cost, markup_amount, total_cost, currency)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)`).run(
          row.id, costs.filament_cost || 0, costs.electricity_cost || 0, costs.depreciation_cost || 0,
          costs.labor_cost || 0, costs.markup_amount || 0, costs.total_cost || 0, costs.currency || 'NOK'
        );
        updated++;
      }
    } catch (e) { log.warn('Failed to update print cost', e.message); }
  }
  return { total: rows.length, updated };
}

export function savePrintCost(printHistoryId, costs) {
  const db = getDb();
  db.prepare(`INSERT OR REPLACE INTO print_costs (print_history_id, filament_cost, electricity_cost, depreciation_cost, labor_cost, markup_amount, total_cost, currency)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)`).run(
    printHistoryId, costs.filament_cost || 0, costs.electricity_cost || 0, costs.depreciation_cost || 0,
    costs.labor_cost || 0, costs.markup_amount || 0, costs.total_cost || 0, costs.currency || 'NOK'
  );
}

export function getPrintCost(printHistoryId) {
  const db = getDb();
  return db.prepare('SELECT * FROM print_costs WHERE print_history_id = ?').get(printHistoryId) || null;
}

export function getCostReport(from, to) {
  const db = getDb();
  let query = `SELECT pc.*, ph.filename, ph.printer_id, ph.started_at, ph.finished_at, ph.duration_seconds, ph.filament_used_g, ph.status
    FROM print_costs pc JOIN print_history ph ON pc.print_history_id = ph.id WHERE 1=1`;
  const params = [];
  if (from) { query += ' AND ph.started_at >= ?'; params.push(from); }
  if (to) { query += ' AND ph.started_at <= ?'; params.push(to); }
  query += ' ORDER BY ph.started_at DESC';
  return db.prepare(query).all(...params);
}

export function getCostSummary(from, to) {
  const db = getDb();
  let query = `SELECT COUNT(*) as print_count,
    COALESCE(SUM(filament_cost), 0) as total_filament,
    COALESCE(SUM(electricity_cost), 0) as total_electricity,
    COALESCE(SUM(depreciation_cost), 0) as total_depreciation,
    COALESCE(SUM(labor_cost), 0) as total_labor,
    COALESCE(SUM(markup_amount), 0) as total_markup,
    COALESCE(SUM(total_cost), 0) as grand_total
    FROM print_costs pc JOIN print_history ph ON pc.print_history_id = ph.id WHERE 1=1`;
  const params = [];
  if (from) { query += ' AND ph.started_at >= ?'; params.push(from); }
  if (to) { query += ' AND ph.started_at <= ?'; params.push(to); }
  return db.prepare(query).get(...params);
}

export function getCostStatistics(printerId = null, startDate = null, endDate = null) {
  const db = getDb();
  const clauses = ['1=1'];
  const params = [];
  if (printerId) { clauses.push('ph.printer_id = ?'); params.push(printerId); }
  if (startDate) { clauses.push('ph.started_at >= ?'); params.push(startDate); }
  if (endDate) { clauses.push('ph.started_at <= ?'); params.push(endDate); }
  const w = clauses.join(' AND ');

  // Summary totals
  const summary = db.prepare(`SELECT COUNT(*) as print_count,
    COALESCE(SUM(pc.filament_cost), 0) as total_filament,
    COALESCE(SUM(pc.electricity_cost), 0) as total_electricity,
    COALESCE(SUM(pc.depreciation_cost), 0) as total_depreciation,
    COALESCE(SUM(pc.labor_cost), 0) as total_labor,
    COALESCE(SUM(pc.markup_amount), 0) as total_markup,
    COALESCE(SUM(pc.total_cost), 0) as grand_total,
    COALESCE(AVG(pc.total_cost), 0) as avg_per_print,
    COALESCE(SUM(ph.duration_seconds), 0) as total_seconds,
    COALESCE(SUM(ph.filament_used_g), 0) as total_filament_g
    FROM print_costs pc JOIN print_history ph ON pc.print_history_id = ph.id WHERE ${w}`).get(...params);

  // Monthly breakdown
  const byMonth = db.prepare(`SELECT strftime('%Y-%m', ph.started_at) as month,
    COUNT(*) as prints, COALESCE(SUM(pc.total_cost), 0) as total_cost,
    COALESCE(SUM(pc.filament_cost), 0) as filament_cost,
    COALESCE(SUM(pc.electricity_cost), 0) as electricity_cost,
    COALESCE(SUM(pc.depreciation_cost), 0) as depreciation_cost
    FROM print_costs pc JOIN print_history ph ON pc.print_history_id = ph.id WHERE ${w}
    GROUP BY month ORDER BY month`).all(...params);

  // By printer
  const byPrinter = db.prepare(`SELECT ph.printer_id, COUNT(*) as prints,
    COALESCE(SUM(pc.total_cost), 0) as total_cost,
    COALESCE(AVG(pc.total_cost), 0) as avg_cost
    FROM print_costs pc JOIN print_history ph ON pc.print_history_id = ph.id WHERE ${w}
    GROUP BY ph.printer_id ORDER BY total_cost DESC`).all(...params);

  // By material type
  const byMaterial = db.prepare(`SELECT ph.filament_type as material, COUNT(*) as prints,
    COALESCE(SUM(pc.total_cost), 0) as total_cost,
    COALESCE(SUM(ph.filament_used_g), 0) as total_grams
    FROM print_costs pc JOIN print_history ph ON pc.print_history_id = ph.id WHERE ${w} AND ph.filament_type IS NOT NULL
    GROUP BY ph.filament_type ORDER BY total_cost DESC`).all(...params);

  const currency = getInventorySetting('cost_currency') || 'NOK';
  const totalH = summary.total_seconds / 3600;

  return {
    summary: {
      print_count: summary.print_count,
      grand_total: Math.round(summary.grand_total * 100) / 100,
      avg_per_print: Math.round(summary.avg_per_print * 100) / 100,
      cost_per_hour: totalH > 0 ? Math.round((summary.grand_total / totalH) * 100) / 100 : 0,
      cost_per_kg: summary.total_filament_g > 0 ? Math.round((summary.grand_total / (summary.total_filament_g / 1000)) * 100) / 100 : 0,
      currency
    },
    breakdown: {
      filament: Math.round(summary.total_filament * 100) / 100,
      electricity: Math.round(summary.total_electricity * 100) / 100,
      depreciation: Math.round(summary.total_depreciation * 100) / 100,
      labor: Math.round(summary.total_labor * 100) / 100,
      markup: Math.round(summary.total_markup * 100) / 100
    },
    by_month: byMonth.map(r => ({ month: r.month, prints: r.prints, total_cost: Math.round(r.total_cost * 100) / 100, filament_cost: Math.round(r.filament_cost * 100) / 100, electricity_cost: Math.round(r.electricity_cost * 100) / 100, depreciation_cost: Math.round(r.depreciation_cost * 100) / 100 })),
    by_printer: byPrinter.map(r => ({ printer_id: r.printer_id, prints: r.prints, total_cost: Math.round(r.total_cost * 100) / 100, avg_cost: Math.round(r.avg_cost * 100) / 100 })),
    by_material: byMaterial.map(r => ({ material: r.material, prints: r.prints, total_cost: Math.round(r.total_cost * 100) / 100, total_grams: Math.round(r.total_grams), cost_per_kg: r.total_grams > 0 ? Math.round((r.total_cost / (r.total_grams / 1000)) * 100) / 100 : 0 }))
  };
}

export function estimatePrintCostAdvanced(filamentUsedG, durationSeconds, spoolId = null, printerId = null, printStatus = null, wasteG = 0) {
  const db = getDb();
  const cs = getPrinterCostSettings(printerId);
  const electricityRate = cs.electricity_rate_kwh;
  const printerWattage = cs.printer_wattage;
  const machineCost = cs.machine_cost;
  const machineLifetimeH = cs.machine_lifetime_hours;
  const laborRate = parseFloat(getInventorySetting('labor_rate_hourly') || getInventorySetting('labor_rate_hour') || '0');
  const setupMinutes = parseFloat(getInventorySetting('labor_setup_minutes') || '0');
  const markupPct = parseFloat(getInventorySetting('markup_pct') || '0');
  const currency = getInventorySetting('cost_currency') || 'NOK';

  // Exclude labor & markup for cancelled/failed prints if setting is enabled
  const excludeLabor = printStatus && printStatus !== 'completed'
    && getInventorySetting('exclude_labor_cancelled') === '1';

  let filamentCostPerG = 0;
  if (spoolId) {
    const spool = db.prepare(`SELECT s.cost, s.initial_weight_g,
      (SELECT fp.price FROM filament_profiles fp WHERE fp.id = s.filament_profile_id) AS profile_price
      FROM spools s WHERE s.id = ?`).get(spoolId);
    if (spool) {
      if (spool.cost > 0 && spool.initial_weight_g > 0) {
        filamentCostPerG = spool.cost / spool.initial_weight_g;
      } else if (spool.profile_price > 0) {
        filamentCostPerG = spool.profile_price / 1000;
      }
    }
  }
  // Fallback: average cost per gram from all spools
  if (filamentCostPerG <= 0) {
    const spoolAvg = db.prepare("SELECT AVG(cost / initial_weight_g) as avg FROM spools WHERE initial_weight_g > 0 AND cost > 0").get();
    if (spoolAvg?.avg > 0) {
      filamentCostPerG = spoolAvg.avg;
    } else {
      const legacyAvg = db.prepare("SELECT AVG(cost_nok / weight_total_g) as avg FROM filament_inventory WHERE weight_total_g > 0 AND cost_nok > 0").get();
      filamentCostPerG = legacyAvg?.avg || 0;
    }
  }

  // For failed/cancelled prints: ALL filament used is waste (object is discarded)
  // filament_used_g = total consumed, waste_g = mechanical waste (purge, color changes)
  // Avoid double-counting: total = max(filament_used_g, waste_g) for failed, or sum for completed
  const isFailed = printStatus === 'failed' || printStatus === 'cancelled';
  const totalFilamentG = isFailed
    ? Math.max(filamentUsedG, wasteG || 0)  // All consumed is waste, don't add purge on top
    : filamentUsedG + (wasteG || 0);         // Completed: product filament + waste
  const filamentCost = Math.round(totalFilamentG * filamentCostPerG * 100) / 100;
  const durationH = durationSeconds / 3600;
  const electricityCost = Math.round(durationH * (printerWattage / 1000) * electricityRate * 100) / 100;
  const depreciationCost = machineLifetimeH > 0 ? Math.round(durationH * (machineCost / machineLifetimeH) * 100) / 100 : 0;
  const laborCost = excludeLabor ? 0 : Math.round((durationH * laborRate + (setupMinutes / 60) * laborRate) * 100) / 100;
  const subtotal = filamentCost + electricityCost + depreciationCost + laborCost;
  const markupAmount = excludeLabor ? 0 : (markupPct > 0 ? Math.round(subtotal * (markupPct / 100) * 100) / 100 : 0);
  const totalCost = Math.round((subtotal + markupAmount) * 100) / 100;

  return { filament_cost: filamentCost, electricity_cost: electricityCost, depreciation_cost: depreciationCost, labor_cost: laborCost, markup_amount: markupAmount, total_cost: totalCost, currency };
}

// helper — re-implemented locally to avoid circular import with spools.js
function getPrinterCostSettings(printerId) {
  const db = getDb();
  let ps = null;
  if (printerId) {
    ps = db.prepare('SELECT electricity_rate_kwh, printer_wattage, machine_cost, machine_lifetime_hours FROM printers WHERE id = ?').get(printerId);
  }
  return {
    electricity_rate_kwh: parseFloat(ps?.electricity_rate_kwh || getInventorySetting('electricity_rate_kwh') || '0'),
    printer_wattage: parseFloat(ps?.printer_wattage || getInventorySetting('printer_wattage') || '0'),
    machine_cost: parseFloat(ps?.machine_cost || getInventorySetting('machine_cost') || '0'),
    machine_lifetime_hours: parseFloat(ps?.machine_lifetime_hours || getInventorySetting('machine_lifetime_hours') || '0'),
  };
}

function getInventorySetting(key) {
  const db = getDb();
  const row = db.prepare('SELECT value FROM inventory_settings WHERE key = ?').get(key);
  return row ? row.value : null;
}

// ── Cost Estimate CRUD ──

export function saveCostEstimate(data) {
  const db = getDb();
  const r = db.prepare(`INSERT INTO cost_estimates (filename, file_hash, filament_data, estimated_time_min, filament_cost, electricity_cost, wear_cost, total_cost, settings, currency)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
    data.filename || null,
    data.file_hash || null,
    typeof data.filament_data === 'string' ? data.filament_data : JSON.stringify(data.filament_data || []),
    data.estimated_time_min || 0,
    data.filament_cost || 0,
    data.electricity_cost || 0,
    data.wear_cost || 0,
    data.total_cost || 0,
    typeof data.settings === 'string' ? data.settings : JSON.stringify(data.settings || {}),
    data.currency || 'NOK'
  );
  return Number(r.lastInsertRowid);
}

export function getCostEstimates(limit = 50) {
  const db = getDb();
  return db.prepare('SELECT * FROM cost_estimates ORDER BY created_at DESC LIMIT ?').all(limit);
}

export function getCostEstimate(id) {
  const db = getDb();
  return db.prepare('SELECT * FROM cost_estimates WHERE id = ?').get(id) || null;
}

export function deleteCostEstimate(id) {
  const db = getDb();
  db.prepare('DELETE FROM cost_estimates WHERE id = ?').run(id);
}

// ── Print Time Tracking CRUD ──

export function getTimeTracking(opts = {}) {
  const db = getDb();
  let sql = 'SELECT * FROM print_time_tracking WHERE accuracy_pct IS NOT NULL';
  const params = [];
  if (opts.filament_type) { sql += ' AND filament_type = ?'; params.push(opts.filament_type); }
  if (opts.from) { sql += ' AND finished_at >= ?'; params.push(opts.from); }
  if (opts.to) { sql += ' AND finished_at <= ?'; params.push(opts.to); }
  sql += ' ORDER BY finished_at DESC';
  if (opts.limit) { sql += ' LIMIT ?'; params.push(opts.limit); }
  return db.prepare(sql).all(...params);
}

export function addTimeTracking(data) {
  const db = getDb();
  const accuracy = data.estimated_s > 0 && data.actual_s > 0
    ? Math.round((100 - Math.abs(data.estimated_s - data.actual_s) * 100 / data.estimated_s) * 10) / 10
    : null;
  const r = db.prepare(`INSERT INTO print_time_tracking (print_history_id, printer_id, filename, estimated_s, actual_s, accuracy_pct, filament_type, finished_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)`).run(
    data.print_history_id || null, data.printer_id || null, data.filename || null,
    data.estimated_s || null, data.actual_s || null, accuracy,
    data.filament_type || null, data.finished_at || new Date().toISOString()
  );
  return Number(r.lastInsertRowid);
}

export function getTimeTrackingStats() {
  const db = getDb();
  const row = db.prepare(`SELECT
    COUNT(*) as total,
    ROUND(AVG(accuracy_pct), 1) as avg_accuracy,
    MAX(accuracy_pct) as best,
    MIN(accuracy_pct) as worst
  FROM print_time_tracking WHERE accuracy_pct IS NOT NULL`).get();
  return row || { total: 0, avg_accuracy: 0, best: 0, worst: 0 };
}
