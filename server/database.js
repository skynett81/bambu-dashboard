import { DatabaseSync } from 'node:sqlite';
import { join } from 'node:path';
import { DATA_DIR } from './config.js';

const DB_PATH = join(DATA_DIR, 'dashboard.db');
let db;

export function initDatabase() {
  db = new DatabaseSync(DB_PATH);

  db.exec(`
    CREATE TABLE IF NOT EXISTS schema_version (
      version INTEGER PRIMARY KEY
    );

    CREATE TABLE IF NOT EXISTS printers (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      ip TEXT,
      serial TEXT,
      access_code TEXT,
      model TEXT,
      added_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS print_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      printer_id TEXT,
      started_at TEXT NOT NULL,
      finished_at TEXT,
      filename TEXT,
      status TEXT,
      duration_seconds INTEGER,
      filament_used_g REAL,
      filament_type TEXT,
      filament_color TEXT,
      layer_count INTEGER,
      notes TEXT
    );

    CREATE TABLE IF NOT EXISTS filament_inventory (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      brand TEXT,
      type TEXT NOT NULL,
      color_name TEXT,
      color_hex TEXT,
      weight_total_g REAL DEFAULT 1000,
      weight_used_g REAL DEFAULT 0,
      cost_nok REAL,
      purchase_date TEXT,
      notes TEXT
    );

    CREATE TABLE IF NOT EXISTS error_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      printer_id TEXT,
      timestamp TEXT NOT NULL,
      code TEXT,
      message TEXT,
      severity TEXT
    );

    CREATE TABLE IF NOT EXISTS filament_waste (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      printer_id TEXT,
      timestamp TEXT DEFAULT (datetime('now')),
      waste_g REAL NOT NULL,
      reason TEXT DEFAULT 'manual',
      notes TEXT
    );

    CREATE TABLE IF NOT EXISTS nozzle_sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      printer_id TEXT,
      nozzle_type TEXT NOT NULL,
      nozzle_diameter REAL NOT NULL,
      installed_at TEXT DEFAULT (datetime('now')),
      retired_at TEXT,
      total_print_hours REAL DEFAULT 0,
      total_filament_g REAL DEFAULT 0,
      abrasive_filament_g REAL DEFAULT 0,
      print_count INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS maintenance_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      printer_id TEXT,
      component TEXT NOT NULL,
      action TEXT NOT NULL,
      timestamp TEXT DEFAULT (datetime('now')),
      notes TEXT,
      nozzle_type TEXT,
      nozzle_diameter REAL
    );

    CREATE TABLE IF NOT EXISTS maintenance_schedule (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      printer_id TEXT,
      component TEXT NOT NULL,
      interval_hours REAL NOT NULL,
      label TEXT,
      enabled INTEGER DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS ams_snapshots (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      printer_id TEXT,
      timestamp TEXT DEFAULT (datetime('now')),
      ams_unit INTEGER,
      tray_id INTEGER,
      tray_type TEXT,
      tray_color TEXT,
      tray_brand TEXT,
      tray_name TEXT,
      remain_pct INTEGER,
      humidity TEXT,
      ams_temp TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_history_printer ON print_history(printer_id);
    CREATE INDEX IF NOT EXISTS idx_errors_printer ON error_log(printer_id);
    CREATE INDEX IF NOT EXISTS idx_waste_printer ON filament_waste(printer_id);
    CREATE INDEX IF NOT EXISTS idx_nozzle_printer ON nozzle_sessions(printer_id);
    CREATE INDEX IF NOT EXISTS idx_maintenance_printer ON maintenance_log(printer_id);
    CREATE INDEX IF NOT EXISTS idx_ams_snap_printer ON ams_snapshots(printer_id);
  `);

  // Migrate: add columns to print_history if missing
  const newCols = [
    ['color_changes', 'INTEGER DEFAULT 0'],
    ['waste_g', 'REAL DEFAULT 0'],
    ['nozzle_type', 'TEXT'],
    ['nozzle_diameter', 'REAL'],
    ['speed_level', 'INTEGER'],
    ['bed_target', 'REAL'],
    ['nozzle_target', 'REAL'],
    ['max_nozzle_temp', 'REAL'],
    ['max_bed_temp', 'REAL'],
    ['filament_brand', 'TEXT'],
    ['ams_units_used', 'INTEGER'],
    ['tray_id', 'TEXT']
  ];
  for (const [col, type] of newCols) {
    try { db.exec(`ALTER TABLE print_history ADD COLUMN ${col} ${type}`); } catch (e) { /* exists */ }
  }

  // Run versioned migrations
  _runMigrations();

  console.log('[db] Database klar:', DB_PATH);
  return db;
}

// ---- Migration System ----

function _runMigrations() {
  const row = db.prepare('SELECT MAX(version) as v FROM schema_version').get();
  const currentVersion = row?.v || 0;

  const migrations = [
    { version: 1, up: _mig001_telemetry },
    { version: 2, up: _mig002_ams_extended },
    { version: 3, up: _mig003_component_wear },
    { version: 4, up: _mig004_firmware_history },
    { version: 5, up: _mig005_xcam_events },
    { version: 6, up: _mig006_ams_tray_lifetime },
    { version: 7, up: _mig007_nozzle_index },
    { version: 8, up: _mig008_filament_printer_id },
    { version: 9, up: _mig009_notifications },
    { version: 10, up: _mig010_update_history },
    { version: 11, up: _mig011_protection },
    { version: 12, up: _mig012_sensor_guards },
    { version: 13, up: _mig013_model_links },
    { version: 14, up: _mig014_model_links_metadata },
  ];

  for (const m of migrations) {
    if (m.version > currentVersion) {
      try {
        m.up();
        db.prepare('INSERT INTO schema_version (version) VALUES (?)').run(m.version);
        console.log(`[db] Migrering v${m.version} fullfort`);
      } catch (e) {
        console.error(`[db] Migrering v${m.version} feilet:`, e.message);
      }
    }
  }
}

function _mig001_telemetry() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS telemetry (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      printer_id TEXT NOT NULL,
      timestamp TEXT NOT NULL DEFAULT (datetime('now')),
      nozzle_temp REAL,
      bed_temp REAL,
      chamber_temp REAL,
      nozzle_target REAL,
      bed_target REAL,
      fan_cooling INTEGER,
      fan_aux INTEGER,
      fan_chamber INTEGER,
      fan_heatbreak INTEGER,
      speed_mag INTEGER,
      wifi_signal TEXT,
      print_progress INTEGER,
      layer_num INTEGER
    );
    CREATE INDEX IF NOT EXISTS idx_telemetry_printer_time ON telemetry(printer_id, timestamp);
    CREATE INDEX IF NOT EXISTS idx_telemetry_time ON telemetry(timestamp);
  `);
}

function _mig002_ams_extended() {
  const cols = [
    ['tag_uid', 'TEXT'],
    ['tray_uuid', 'TEXT'],
    ['tray_info_idx', 'TEXT'],
    ['tray_weight', 'REAL'],
    ['tray_diameter', 'REAL'],
    ['drying_temp', 'INTEGER'],
    ['drying_time', 'INTEGER'],
    ['nozzle_temp_min', 'INTEGER'],
    ['nozzle_temp_max', 'INTEGER'],
    ['bed_temp_recommend', 'INTEGER'],
    ['k_value', 'REAL']
  ];
  for (const [col, type] of cols) {
    try { db.exec(`ALTER TABLE ams_snapshots ADD COLUMN ${col} ${type}`); } catch (e) { /* exists */ }
  }
}

function _mig003_component_wear() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS component_wear (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      printer_id TEXT NOT NULL,
      component TEXT NOT NULL,
      total_hours REAL DEFAULT 0,
      total_cycles INTEGER DEFAULT 0,
      last_updated TEXT DEFAULT (datetime('now')),
      UNIQUE(printer_id, component)
    );
    CREATE INDEX IF NOT EXISTS idx_component_wear_printer ON component_wear(printer_id);
  `);
}

function _mig004_firmware_history() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS firmware_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      printer_id TEXT NOT NULL,
      timestamp TEXT NOT NULL DEFAULT (datetime('now')),
      module TEXT NOT NULL,
      sw_ver TEXT,
      hw_ver TEXT,
      sn TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_firmware_printer ON firmware_history(printer_id, module);
  `);
}

function _mig005_xcam_events() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS xcam_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      printer_id TEXT NOT NULL,
      timestamp TEXT NOT NULL DEFAULT (datetime('now')),
      event_type TEXT NOT NULL,
      action_taken TEXT,
      print_id INTEGER
    );
    CREATE INDEX IF NOT EXISTS idx_xcam_printer ON xcam_events(printer_id);
  `);
}

function _mig006_ams_tray_lifetime() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS ams_tray_lifetime (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      printer_id TEXT NOT NULL,
      ams_unit INTEGER NOT NULL,
      tray_id INTEGER NOT NULL,
      tray_uuid TEXT,
      total_filament_used_g REAL DEFAULT 0,
      first_seen TEXT DEFAULT (datetime('now')),
      last_seen TEXT DEFAULT (datetime('now')),
      spool_changes INTEGER DEFAULT 0,
      UNIQUE(printer_id, ams_unit, tray_id, tray_uuid)
    );
  `);
}

function _mig007_nozzle_index() {
  try { db.exec('ALTER TABLE nozzle_sessions ADD COLUMN nozzle_index INTEGER DEFAULT 0'); } catch (e) { /* exists */ }
}

function _mig008_filament_printer_id() {
  try { db.exec('ALTER TABLE filament_inventory ADD COLUMN printer_id TEXT'); } catch (e) { /* exists */ }
  try { db.exec('CREATE INDEX IF NOT EXISTS idx_filament_printer ON filament_inventory(printer_id)'); } catch (e) { /* exists */ }
}

function _mig009_notifications() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS notification_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      timestamp TEXT NOT NULL DEFAULT (datetime('now')),
      event_type TEXT NOT NULL,
      channel TEXT NOT NULL,
      printer_id TEXT,
      title TEXT,
      message TEXT,
      status TEXT NOT NULL DEFAULT 'sent',
      error_info TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_notif_log_time ON notification_log(timestamp);
    CREATE INDEX IF NOT EXISTS idx_notif_log_printer ON notification_log(printer_id);

    CREATE TABLE IF NOT EXISTS notification_queue (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      queued_at TEXT NOT NULL DEFAULT (datetime('now')),
      event_type TEXT NOT NULL,
      printer_id TEXT,
      printer_name TEXT,
      title TEXT,
      message TEXT,
      event_data TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_notif_queue_time ON notification_queue(queued_at);
  `);
}

function _mig010_update_history() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS update_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      timestamp TEXT NOT NULL DEFAULT (datetime('now')),
      from_version TEXT NOT NULL,
      to_version TEXT NOT NULL,
      method TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'started',
      backup_path TEXT,
      error_message TEXT,
      duration_ms INTEGER
    );
  `);
}

function _mig011_protection() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS protection_settings (
      printer_id TEXT PRIMARY KEY,
      enabled INTEGER NOT NULL DEFAULT 1,
      spaghetti_action TEXT NOT NULL DEFAULT 'pause',
      first_layer_action TEXT NOT NULL DEFAULT 'notify',
      foreign_object_action TEXT NOT NULL DEFAULT 'pause',
      nozzle_clump_action TEXT NOT NULL DEFAULT 'pause',
      cooldown_seconds INTEGER NOT NULL DEFAULT 60,
      auto_resume INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS protection_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      printer_id TEXT NOT NULL,
      timestamp TEXT NOT NULL DEFAULT (datetime('now')),
      event_type TEXT NOT NULL,
      action_taken TEXT NOT NULL,
      print_id INTEGER,
      resolved INTEGER NOT NULL DEFAULT 0,
      resolved_at TEXT,
      notes TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_protection_log_printer ON protection_log(printer_id);
  `);
}

function _mig012_sensor_guards() {
  const cols = [
    ['temp_deviation_action', "TEXT NOT NULL DEFAULT 'notify'"],
    ['filament_runout_action', "TEXT NOT NULL DEFAULT 'notify'"],
    ['print_error_action', "TEXT NOT NULL DEFAULT 'notify'"],
    ['fan_failure_action', "TEXT NOT NULL DEFAULT 'notify'"],
    ['print_stall_action', "TEXT NOT NULL DEFAULT 'notify'"],
    ['temp_deviation_threshold', 'INTEGER NOT NULL DEFAULT 15'],
    ['filament_low_pct', 'INTEGER NOT NULL DEFAULT 5'],
    ['stall_minutes', 'INTEGER NOT NULL DEFAULT 10']
  ];
  for (const [col, type] of cols) {
    try { db.exec(`ALTER TABLE protection_settings ADD COLUMN ${col} ${type}`); } catch (e) { /* exists */ }
  }
}

function _mig013_model_links() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS model_links (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      printer_id TEXT,
      filename TEXT NOT NULL,
      source TEXT NOT NULL,
      source_id TEXT NOT NULL,
      title TEXT,
      url TEXT,
      image TEXT,
      designer TEXT,
      linked_at TEXT DEFAULT (datetime('now')),
      UNIQUE(printer_id, filename)
    );
    CREATE INDEX IF NOT EXISTS idx_model_links_printer ON model_links(printer_id);
    CREATE INDEX IF NOT EXISTS idx_model_links_filename ON model_links(filename);
  `);
}

function _mig014_model_links_metadata() {
  const cols = [
    ['description', 'TEXT'],
    ['category', 'TEXT'],
    ['print_settings', 'TEXT']
  ];
  for (const [col, type] of cols) {
    try { db.exec(`ALTER TABLE model_links ADD COLUMN ${col} ${type}`); } catch (e) { /* exists */ }
  }
}

// ---- Printer CRUD ----

export function getPrinters() {
  const rows = db.prepare('SELECT * FROM printers ORDER BY added_at').all();
  return rows.map(r => ({
    id: r.id,
    name: r.name,
    ip: r.ip,
    serial: r.serial,
    accessCode: r.access_code,
    model: r.model,
    added_at: r.added_at
  }));
}

export function addPrinter(p) {
  return db.prepare('INSERT INTO printers (id, name, ip, serial, access_code, model) VALUES (?, ?, ?, ?, ?, ?)').run(
    p.id, p.name, p.ip || null, p.serial || null, p.accessCode || null, p.model || null
  );
}

export function updatePrinter(id, p) {
  return db.prepare('UPDATE printers SET name=?, ip=?, serial=?, access_code=?, model=? WHERE id=?').run(
    p.name, p.ip || null, p.serial || null, p.accessCode || null, p.model || null, id
  );
}

export function deletePrinter(id) {
  return db.prepare('DELETE FROM printers WHERE id=?').run(id);
}

// ---- History ----

export function getHistory(limit = 50, offset = 0, printerId = null) {
  if (printerId) {
    return db.prepare('SELECT * FROM print_history WHERE printer_id = ? ORDER BY started_at DESC LIMIT ? OFFSET ?').all(printerId, limit, offset);
  }
  return db.prepare('SELECT * FROM print_history ORDER BY started_at DESC LIMIT ? OFFSET ?').all(limit, offset);
}

export function addHistory(record) {
  return db.prepare(`
    INSERT INTO print_history (printer_id, started_at, finished_at, filename, status,
      duration_seconds, filament_used_g, filament_type, filament_color, layer_count,
      notes, color_changes, waste_g, nozzle_type, nozzle_diameter, speed_level,
      bed_target, nozzle_target, max_nozzle_temp, max_bed_temp, filament_brand,
      ams_units_used, tray_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(record.printer_id || null, record.started_at, record.finished_at, record.filename, record.status,
    record.duration_seconds, record.filament_used_g, record.filament_type,
    record.filament_color, record.layer_count, record.notes || null,
    record.color_changes || 0, record.waste_g || 0,
    record.nozzle_type || null, record.nozzle_diameter || null,
    record.speed_level || null, record.bed_target || null, record.nozzle_target || null,
    record.max_nozzle_temp || null, record.max_bed_temp || null,
    record.filament_brand || null, record.ams_units_used || null,
    record.tray_id || null);
}

// ---- Statistics ----

export function getStatistics(printerId = null) {
  const where = printerId ? ' WHERE printer_id = ?' : '';
  const params = printerId ? [printerId] : [];

  const total = db.prepare(`SELECT COUNT(*) as count FROM print_history${where}`).get(...params);
  const completed = db.prepare(`SELECT COUNT(*) as count FROM print_history${where}${where ? ' AND' : ' WHERE'} status = 'completed'`).get(...params);
  const failed = db.prepare(`SELECT COUNT(*) as count FROM print_history${where}${where ? ' AND' : ' WHERE'} status = 'failed'`).get(...params);
  const cancelled = db.prepare(`SELECT COUNT(*) as count FROM print_history${where}${where ? ' AND' : ' WHERE'} status = 'cancelled'`).get(...params);
  const totalTime = db.prepare(`SELECT COALESCE(SUM(duration_seconds), 0) as seconds FROM print_history${where}`).get(...params);
  const totalFilament = db.prepare(`SELECT COALESCE(SUM(filament_used_g), 0) as grams FROM print_history${where}`).get(...params);
  const avgDuration = db.prepare(`SELECT COALESCE(AVG(duration_seconds), 0) as avg FROM print_history${where}${where ? ' AND' : ' WHERE'} status = 'completed'`).get(...params);
  const longestPrint = db.prepare(`SELECT filename, duration_seconds FROM print_history${where}${where ? ' AND' : ' WHERE'} status = 'completed' ORDER BY duration_seconds DESC LIMIT 1`).get(...params);
  const mostUsedFilament = db.prepare(`SELECT filament_type, COUNT(*) as count FROM print_history${where}${where ? ' AND' : ' WHERE'} filament_type IS NOT NULL GROUP BY filament_type ORDER BY count DESC LIMIT 1`).get(...params);

  const filamentByType = db.prepare(`SELECT filament_type as type, COALESCE(SUM(filament_used_g), 0) as grams, COUNT(*) as prints FROM print_history${where}${where ? ' AND' : ' WHERE'} filament_type IS NOT NULL GROUP BY filament_type ORDER BY grams DESC`).all(...params);

  const printsPerWeek = db.prepare(`
    SELECT strftime('%Y-W%W', started_at) as week,
           COUNT(*) as total,
           SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
           SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed
    FROM print_history${where}${where ? ' AND' : ' WHERE'} started_at >= datetime('now', '-56 days')
    GROUP BY week ORDER BY week
  `).all(...params);

  const totalCost = db.prepare("SELECT COALESCE(SUM(cost_nok * (weight_used_g / weight_total_g)), 0) as cost FROM filament_inventory WHERE weight_total_g > 0").get();

  // Success rate by filament type
  const and = where ? ' AND' : ' WHERE';
  const successByFilament = db.prepare(`SELECT filament_type as type, COUNT(*) as total, SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed FROM print_history${where}${and} filament_type IS NOT NULL GROUP BY filament_type ORDER BY total DESC`).all(...params);

  // Success rate by speed level
  const successBySpeed = db.prepare(`SELECT speed_level as level, COUNT(*) as total, SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed FROM print_history${where}${and} speed_level IS NOT NULL GROUP BY speed_level ORDER BY level`).all(...params);

  // Filament by brand
  const filamentByBrand = db.prepare(`SELECT filament_brand as brand, filament_type as type, COALESCE(SUM(filament_used_g), 0) as grams, COUNT(*) as prints FROM print_history${where}${and} filament_brand IS NOT NULL GROUP BY filament_brand, filament_type ORDER BY grams DESC`).all(...params);

  // Temperature records
  const tempStats = db.prepare(`SELECT COALESCE(MAX(max_nozzle_temp), 0) as peak_nozzle, COALESCE(AVG(max_nozzle_temp), 0) as avg_nozzle, COALESCE(MAX(max_bed_temp), 0) as peak_bed, COALESCE(AVG(max_bed_temp), 0) as avg_bed FROM print_history${where}${and} status = 'completed' AND max_nozzle_temp > 0`).get(...params);

  // Top 5 files
  const topFiles = db.prepare(`SELECT filename, COUNT(*) as count, SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed FROM print_history${where}${and} filename IS NOT NULL GROUP BY filename ORDER BY count DESC LIMIT 5`).all(...params);

  // Monthly trends (last 6 months)
  const monthlyTrends = db.prepare(`SELECT strftime('%Y-%m', started_at) as month, COUNT(*) as total, SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed, COALESCE(SUM(duration_seconds), 0) as total_seconds, COALESCE(SUM(filament_used_g), 0) as total_filament_g FROM print_history${where}${and} started_at >= datetime('now', '-180 days') GROUP BY month ORDER BY month`).all(...params);

  // Total layers
  const totalLayers = db.prepare(`SELECT COALESCE(SUM(layer_count), 0) as total FROM print_history${where}${and} status = 'completed'`).get(...params);

  // Prints by day of week (0=Sunday)
  const printsByDayOfWeek = db.prepare(`SELECT CAST(strftime('%w', started_at) AS INTEGER) as dow, COUNT(*) as count FROM print_history${where} GROUP BY dow ORDER BY dow`).all(...params);

  // Prints by hour of day
  const printsByHour = db.prepare(`SELECT CAST(strftime('%H', started_at) AS INTEGER) as hour, COUNT(*) as count FROM print_history${where} GROUP BY hour ORDER BY hour`).all(...params);

  // AMS stats from snapshots
  const amsFilamentByBrand = db.prepare(`SELECT tray_brand as brand, tray_type as type, COUNT(*) as snapshots FROM ams_snapshots${where}${where ? ' AND' : ' WHERE'} tray_brand IS NOT NULL GROUP BY tray_brand, tray_type ORDER BY snapshots DESC LIMIT 10`).all(...params);
  const amsAvgHumidity = db.prepare(`SELECT ams_unit, ROUND(AVG(CAST(humidity AS REAL)), 1) as avg_humidity, COUNT(*) as readings FROM ams_snapshots${where}${where ? ' AND' : ' WHERE'} humidity IS NOT NULL GROUP BY ams_unit ORDER BY ams_unit`).all(...params);

  // Extra stats: waste, color changes, avg filament per print, nozzle breakdown, streaks
  const wasteStats = db.prepare(`SELECT COALESCE(SUM(waste_g), 0) as total_waste, COALESCE(SUM(color_changes), 0) as total_color_changes FROM print_history${where}`).get(...params);
  const avgFilamentPerPrint = db.prepare(`SELECT COALESCE(AVG(filament_used_g), 0) as avg FROM print_history${where}${and} status = 'completed' AND filament_used_g > 0`).get(...params);
  const nozzleBreakdown = db.prepare(`SELECT nozzle_type as type, nozzle_diameter as diameter, COUNT(*) as prints, SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed FROM print_history${where}${and} nozzle_type IS NOT NULL GROUP BY nozzle_type, nozzle_diameter ORDER BY prints DESC`).all(...params);

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
  const avgDurationByDay = db.prepare(`SELECT CAST(strftime('%w', started_at) AS INTEGER) as dow, ROUND(AVG(duration_seconds) / 60) as avg_minutes FROM print_history${where}${and} status = 'completed' GROUP BY dow ORDER BY dow`).all(...params);

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
    temp_stats: tempStats || { peak_nozzle: 0, avg_nozzle: 0, peak_bed: 0, avg_bed: 0 },
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

// ---- Filament ----

export function getFilament(printerId = null) {
  if (printerId) {
    return db.prepare('SELECT * FROM filament_inventory WHERE printer_id = ? ORDER BY id').all(printerId);
  }
  return db.prepare('SELECT * FROM filament_inventory ORDER BY printer_id, id').all();
}

export function addFilament(f) {
  return db.prepare(`
    INSERT INTO filament_inventory (printer_id, brand, type, color_name, color_hex, weight_total_g, weight_used_g, cost_nok, purchase_date, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(f.printer_id || null, f.brand, f.type, f.color_name || null, f.color_hex || null, f.weight_total_g || 1000,
    f.weight_used_g || 0, f.cost_nok || null, f.purchase_date || null, f.notes || null);
}

export function updateFilament(id, f) {
  return db.prepare(`
    UPDATE filament_inventory SET printer_id=?, brand=?, type=?, color_name=?, color_hex=?, weight_total_g=?, weight_used_g=?, cost_nok=?, notes=?
    WHERE id=?
  `).run(f.printer_id || null, f.brand, f.type, f.color_name, f.color_hex, f.weight_total_g, f.weight_used_g, f.cost_nok, f.notes, id);
}

export function deleteFilament(id) {
  return db.prepare('DELETE FROM filament_inventory WHERE id=?').run(id);
}

// ---- Errors ----

export function getErrors(limit = 50, printerId = null) {
  if (printerId) {
    return db.prepare('SELECT * FROM error_log WHERE printer_id = ? ORDER BY timestamp DESC LIMIT ?').all(printerId, limit);
  }
  return db.prepare('SELECT * FROM error_log ORDER BY timestamp DESC LIMIT ?').all(limit);
}

export function addError(e) {
  return db.prepare('INSERT INTO error_log (printer_id, timestamp, code, message, severity) VALUES (?, ?, ?, ?, ?)').run(
    e.printer_id || null, e.timestamp || new Date().toISOString(), e.code, e.message, e.severity
  );
}

// ---- Waste Tracking ----

export function addWaste(w) {
  return db.prepare('INSERT INTO filament_waste (printer_id, waste_g, reason, notes) VALUES (?, ?, ?, ?)').run(
    w.printer_id || null, w.waste_g, w.reason || 'manual', w.notes || null
  );
}

export function getWasteHistory(limit = 50, printerId = null) {
  if (printerId) {
    return db.prepare('SELECT * FROM filament_waste WHERE printer_id = ? ORDER BY timestamp DESC LIMIT ?').all(printerId, limit);
  }
  return db.prepare('SELECT * FROM filament_waste ORDER BY timestamp DESC LIMIT ?').all(limit);
}

// ---- Nozzle Sessions ----

export function getActiveNozzleSession(printerId) {
  return db.prepare('SELECT * FROM nozzle_sessions WHERE printer_id = ? AND retired_at IS NULL ORDER BY installed_at DESC LIMIT 1').get(printerId) || null;
}

export function getNozzleSessions(printerId) {
  return db.prepare('SELECT * FROM nozzle_sessions WHERE printer_id = ? ORDER BY installed_at DESC').all(printerId);
}

export function createNozzleSession(printerId, nozzleType, nozzleDiameter) {
  return db.prepare('INSERT INTO nozzle_sessions (printer_id, nozzle_type, nozzle_diameter) VALUES (?, ?, ?)').run(printerId, nozzleType, nozzleDiameter);
}

export function retireNozzleSession(sessionId) {
  return db.prepare('UPDATE nozzle_sessions SET retired_at = datetime("now") WHERE id = ?').run(sessionId);
}

export function updateNozzleSessionCounters(sessionId, hours, filamentG, abrasiveG) {
  return db.prepare('UPDATE nozzle_sessions SET total_print_hours = total_print_hours + ?, total_filament_g = total_filament_g + ?, abrasive_filament_g = abrasive_filament_g + ?, print_count = print_count + 1 WHERE id = ?').run(hours, filamentG, abrasiveG, sessionId);
}

// ---- Maintenance ----

export function addMaintenanceEvent(event) {
  return db.prepare('INSERT INTO maintenance_log (printer_id, component, action, notes, nozzle_type, nozzle_diameter) VALUES (?, ?, ?, ?, ?, ?)').run(
    event.printer_id, event.component, event.action, event.notes || null, event.nozzle_type || null, event.nozzle_diameter || null
  );
}

export function getMaintenanceLog(printerId, limit = 50) {
  if (printerId) {
    return db.prepare('SELECT * FROM maintenance_log WHERE printer_id = ? ORDER BY timestamp DESC LIMIT ?').all(printerId, limit);
  }
  return db.prepare('SELECT * FROM maintenance_log ORDER BY timestamp DESC LIMIT ?').all(limit);
}

export function getMaintenanceSchedule(printerId) {
  return db.prepare('SELECT * FROM maintenance_schedule WHERE printer_id = ? AND enabled = 1 ORDER BY component').all(printerId);
}

export function upsertMaintenanceSchedule(printerId, component, intervalHours, label) {
  const existing = db.prepare('SELECT id FROM maintenance_schedule WHERE printer_id = ? AND component = ?').get(printerId, component);
  if (existing) {
    return db.prepare('UPDATE maintenance_schedule SET interval_hours = ?, label = ? WHERE id = ?').run(intervalHours, label, existing.id);
  }
  return db.prepare('INSERT INTO maintenance_schedule (printer_id, component, interval_hours, label) VALUES (?, ?, ?, ?)').run(printerId, component, intervalHours, label);
}

function seedDefaultSchedule(printerId) {
  const existing = db.prepare('SELECT COUNT(*) as c FROM maintenance_schedule WHERE printer_id = ?').get(printerId);
  if (existing.c > 0) return;
  const defaults = [
    ['nozzle', 100, 'Clean nozzle'],
    ['ptfe_tube', 500, 'Check PTFE tube'],
    ['linear_rods', 200, 'Lubricate linear rods'],
    ['carbon_rods', 500, 'Inspect carbon rods'],
    ['build_plate', 50, 'Clean build plate'],
    ['general', 1000, 'General maintenance']
  ];
  const stmt = db.prepare('INSERT INTO maintenance_schedule (printer_id, component, interval_hours, label) VALUES (?, ?, ?, ?)');
  for (const [comp, hours, label] of defaults) {
    stmt.run(printerId, comp, hours, label);
  }
}

function estimateNozzleWear(session) {
  if (!session) return null;
  const isHardened = (session.nozzle_type || '').toLowerCase().includes('hardened');
  const baseLife = isHardened ? 1500 : 400;
  const effectiveHours = session.total_print_hours + (session.abrasive_filament_g / 100) * 3;
  const wearPct = Math.min(100, Math.round((effectiveHours / baseLife) * 100));
  let condition = 'good';
  if (wearPct >= 80) condition = 'replace_soon';
  else if (wearPct >= 50) condition = 'worn';
  return { percentage: wearPct, condition, base_life_hours: baseLife };
}

export function getMaintenanceStatus(printerId) {
  seedDefaultSchedule(printerId);

  const totalHours = db.prepare('SELECT COALESCE(SUM(duration_seconds), 0) / 3600.0 as hours FROM print_history WHERE printer_id = ?').get(printerId);
  const totalPrints = db.prepare('SELECT COUNT(*) as count FROM print_history WHERE printer_id = ?').get(printerId);
  const totalFilament = db.prepare('SELECT COALESCE(SUM(filament_used_g), 0) as grams FROM print_history WHERE printer_id = ?').get(printerId);

  const schedule = getMaintenanceSchedule(printerId);
  const components = [];

  for (const sched of schedule) {
    const lastEvent = db.prepare('SELECT timestamp FROM maintenance_log WHERE printer_id = ? AND component = ? ORDER BY timestamp DESC LIMIT 1').get(printerId, sched.component);

    let hoursSinceMaint = totalHours.hours;
    if (lastEvent) {
      const since = db.prepare('SELECT COALESCE(SUM(duration_seconds), 0) / 3600.0 as hours FROM print_history WHERE printer_id = ? AND started_at > ?').get(printerId, lastEvent.timestamp);
      hoursSinceMaint = since.hours;
    }

    components.push({
      component: sched.component,
      label: sched.label,
      interval_hours: sched.interval_hours,
      hours_since_maintenance: Math.round(hoursSinceMaint * 10) / 10,
      percentage: Math.min(100, Math.round((hoursSinceMaint / sched.interval_hours) * 100)),
      overdue: hoursSinceMaint >= sched.interval_hours,
      last_maintenance: lastEvent?.timestamp || null
    });
  }

  const nozzle = getActiveNozzleSession(printerId);

  return {
    total_print_hours: Math.round(totalHours.hours * 10) / 10,
    total_prints: totalPrints.count,
    total_filament_g: Math.round(totalFilament.grams),
    components,
    active_nozzle: nozzle ? {
      id: nozzle.id,
      type: nozzle.nozzle_type,
      diameter: nozzle.nozzle_diameter,
      installed_at: nozzle.installed_at,
      print_hours: Math.round(nozzle.total_print_hours * 10) / 10,
      filament_g: Math.round(nozzle.total_filament_g),
      abrasive_g: Math.round(nozzle.abrasive_filament_g),
      print_count: nozzle.print_count,
      wear_estimate: estimateNozzleWear(nozzle)
    } : null,
    nozzle_history: getNozzleSessions(printerId)
  };
}

// ---- AMS Snapshots ----

export function addAmsSnapshot(s) {
  return db.prepare(`INSERT INTO ams_snapshots (printer_id, ams_unit, tray_id, tray_type, tray_color, tray_brand, tray_name, remain_pct, humidity, ams_temp,
    tag_uid, tray_uuid, tray_info_idx, tray_weight, tray_diameter, drying_temp, drying_time, nozzle_temp_min, nozzle_temp_max, bed_temp_recommend, k_value)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
    s.printer_id, s.ams_unit, s.tray_id, s.tray_type || null, s.tray_color || null,
    s.tray_brand || null, s.tray_name || null, s.remain_pct ?? null, s.humidity || null, s.ams_temp || null,
    s.tag_uid || null, s.tray_uuid || null, s.tray_info_idx || null,
    s.tray_weight ?? null, s.tray_diameter ?? null,
    s.drying_temp ?? null, s.drying_time ?? null,
    s.nozzle_temp_min ?? null, s.nozzle_temp_max ?? null,
    s.bed_temp_recommend ?? null, s.k_value ?? null
  );
}

export function getAmsStats(printerId) {
  const where = printerId ? ' WHERE printer_id = ?' : '';
  const params = printerId ? [printerId] : [];
  const byBrand = db.prepare(`SELECT tray_brand as brand, tray_type as type, COUNT(DISTINCT timestamp) as uses FROM ams_snapshots${where}${where ? ' AND' : ' WHERE'} tray_brand IS NOT NULL GROUP BY tray_brand, tray_type ORDER BY uses DESC LIMIT 10`).all(...params);
  const humidity = db.prepare(`SELECT ams_unit, ROUND(AVG(CAST(humidity AS REAL)), 1) as avg, ROUND(MIN(CAST(humidity AS REAL)), 1) as min_h, ROUND(MAX(CAST(humidity AS REAL)), 1) as max_h, COUNT(*) as readings FROM ams_snapshots${where}${where ? ' AND' : ' WHERE'} humidity IS NOT NULL GROUP BY ams_unit`).all(...params);
  return { filament_by_brand: byBrand, humidity_by_unit: humidity };
}

// ---- Waste Tracking ----

export function getWasteStats(printerId = null) {
  const where = printerId ? ' WHERE printer_id = ?' : '';
  const params = printerId ? [printerId] : [];

  // From filament_waste table (manual entries)
  const manualWaste = db.prepare(`SELECT COALESCE(SUM(waste_g), 0) as total, COUNT(*) as count FROM filament_waste${where}`).get(...params);

  // From print_history (auto-tracked)
  const autoWaste = db.prepare(`SELECT COALESCE(SUM(waste_g), 0) as total, COALESCE(SUM(color_changes), 0) as changes, COUNT(CASE WHEN color_changes > 0 THEN 1 END) as prints_with_changes FROM print_history${where}`).get(...params);

  // Total prints for average
  const totalPrints = db.prepare(`SELECT COUNT(*) as count FROM print_history${where}`).get(...params);

  // Average cost per gram from inventory
  const costInfo = db.prepare("SELECT COALESCE(AVG(cost_nok / weight_total_g), 0.25) as avg_cost_per_g FROM filament_inventory WHERE weight_total_g > 0 AND cost_nok > 0").get();

  // Waste per week (combined)
  const wastePerWeek = db.prepare(`
    SELECT week, SUM(waste) as total FROM (
      SELECT strftime('%Y-W%W', started_at) as week, waste_g as waste FROM print_history${where}${where ? ' AND' : ' WHERE'} started_at >= datetime('now', '-56 days') AND waste_g > 0
      UNION ALL
      SELECT strftime('%Y-W%W', timestamp) as week, waste_g as waste FROM filament_waste${where}${where ? ' AND' : ' WHERE'} timestamp >= datetime('now', '-56 days')
    ) GROUP BY week ORDER BY week
  `).all(...params, ...params);

  // Recent events (combined from both tables)
  const recentAuto = db.prepare(`SELECT printer_id, started_at as timestamp, filename as notes, color_changes, waste_g, 'auto' as reason FROM print_history${where}${where ? ' AND' : ' WHERE'} waste_g > 0 ORDER BY started_at DESC LIMIT 20`).all(...params);
  const recentManual = db.prepare(`SELECT printer_id, timestamp, notes, 0 as color_changes, waste_g, reason FROM filament_waste${where} ORDER BY timestamp DESC LIMIT 20`).all(...params);

  const recent = [...recentAuto, ...recentManual]
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    .slice(0, 20);

  const totalWasteG = manualWaste.total + autoWaste.total;
  const avgPerG = costInfo.avg_cost_per_g;

  return {
    total_waste_g: Math.round(totalWasteG * 10) / 10,
    total_color_changes: autoWaste.changes,
    total_cost: Math.round(totalWasteG * avgPerG * 10) / 10,
    avg_per_print: totalPrints.count > 0 ? Math.round((totalWasteG / totalPrints.count) * 10) / 10 : 0,
    manual_entries: manualWaste.count,
    prints_with_changes: autoWaste.prints_with_changes,
    waste_per_week: wastePerWeek,
    recent
  };
}

// ---- Telemetry ----

export function insertTelemetryBatch(records) {
  const stmt = db.prepare(`INSERT INTO telemetry (printer_id, timestamp, nozzle_temp, bed_temp, chamber_temp,
    nozzle_target, bed_target, fan_cooling, fan_aux, fan_chamber, fan_heatbreak, speed_mag, wifi_signal, print_progress, layer_num)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
  for (const r of records) {
    stmt.run(r.printer_id, r.timestamp, r.nozzle_temp, r.bed_temp, r.chamber_temp,
      r.nozzle_target, r.bed_target, r.fan_cooling, r.fan_aux, r.fan_chamber, r.fan_heatbreak,
      r.speed_mag, r.wifi_signal, r.print_progress, r.layer_num);
  }
}

export function getTelemetry(printerId, from, to, resolution = '1m') {
  const bucketExpr = {
    '30s': "strftime('%Y-%m-%d %H:%M:', timestamp) || CASE WHEN CAST(strftime('%S', timestamp) AS INTEGER) < 30 THEN '00' ELSE '30' END",
    '1m':  "strftime('%Y-%m-%d %H:%M:00', timestamp)",
    '5m':  "strftime('%Y-%m-%d %H:', timestamp) || printf('%02d', (CAST(strftime('%M', timestamp) AS INTEGER) / 5) * 5) || ':00'",
    '15m': "strftime('%Y-%m-%d %H:', timestamp) || printf('%02d', (CAST(strftime('%M', timestamp) AS INTEGER) / 15) * 15) || ':00'",
    '1h':  "strftime('%Y-%m-%d %H:00:00', timestamp)"
  };
  const bucket = bucketExpr[resolution] || bucketExpr['1m'];

  return db.prepare(`
    SELECT ${bucket} as time_bucket,
      ROUND(AVG(nozzle_temp), 1) as nozzle_temp,
      ROUND(AVG(bed_temp), 1) as bed_temp,
      ROUND(AVG(chamber_temp), 1) as chamber_temp,
      ROUND(AVG(nozzle_target), 1) as nozzle_target,
      ROUND(AVG(bed_target), 1) as bed_target,
      ROUND(AVG(fan_cooling)) as fan_cooling,
      ROUND(AVG(fan_aux)) as fan_aux,
      ROUND(AVG(fan_chamber)) as fan_chamber,
      ROUND(AVG(fan_heatbreak)) as fan_heatbreak,
      ROUND(AVG(speed_mag)) as speed_mag,
      MAX(wifi_signal) as wifi_signal,
      ROUND(AVG(print_progress)) as print_progress,
      MAX(layer_num) as layer_num
    FROM telemetry
    WHERE printer_id = ? AND timestamp >= ? AND timestamp <= ?
    GROUP BY time_bucket
    ORDER BY time_bucket
  `).all(printerId, from, to);
}

export function purgeTelemetry(retentionDays = 30) {
  return db.prepare("DELETE FROM telemetry WHERE timestamp < datetime('now', '-' || ? || ' days')").run(retentionDays);
}

// ---- Component Wear ----

export function upsertComponentWear(printerId, component, addHours, addCycles = 0) {
  const existing = db.prepare('SELECT id FROM component_wear WHERE printer_id = ? AND component = ?').get(printerId, component);
  if (existing) {
    return db.prepare("UPDATE component_wear SET total_hours = total_hours + ?, total_cycles = total_cycles + ?, last_updated = datetime('now') WHERE id = ?")
      .run(addHours, addCycles, existing.id);
  }
  return db.prepare('INSERT INTO component_wear (printer_id, component, total_hours, total_cycles) VALUES (?, ?, ?, ?)')
    .run(printerId, component, addHours, addCycles);
}

export function getComponentWear(printerId) {
  return db.prepare('SELECT * FROM component_wear WHERE printer_id = ? ORDER BY component').all(printerId);
}

// ---- Firmware History ----

export function addFirmwareEntry(entry) {
  // Avoid duplicate entries for same printer/module/version
  const existing = db.prepare('SELECT id FROM firmware_history WHERE printer_id = ? AND module = ? AND sw_ver = ?')
    .get(entry.printer_id, entry.module, entry.sw_ver);
  if (existing) return;
  return db.prepare('INSERT INTO firmware_history (printer_id, module, sw_ver, hw_ver, sn) VALUES (?, ?, ?, ?, ?)')
    .run(entry.printer_id, entry.module, entry.sw_ver || null, entry.hw_ver || null, entry.sn || null);
}

export function getFirmwareHistory(printerId) {
  return db.prepare('SELECT * FROM firmware_history WHERE printer_id = ? ORDER BY timestamp DESC').all(printerId);
}

export function getLatestFirmware(printerId) {
  return db.prepare(`SELECT module, sw_ver, hw_ver, sn, MAX(timestamp) as timestamp
    FROM firmware_history WHERE printer_id = ? GROUP BY module ORDER BY module`).all(printerId);
}

// ---- XCam Events ----

export function addXcamEvent(event) {
  return db.prepare('INSERT INTO xcam_events (printer_id, event_type, action_taken, print_id) VALUES (?, ?, ?, ?)')
    .run(event.printer_id, event.event_type, event.action_taken || null, event.print_id || null);
}

export function getXcamEvents(printerId, limit = 50) {
  if (printerId) {
    return db.prepare('SELECT * FROM xcam_events WHERE printer_id = ? ORDER BY timestamp DESC LIMIT ?').all(printerId, limit);
  }
  return db.prepare('SELECT * FROM xcam_events ORDER BY timestamp DESC LIMIT ?').all(limit);
}

export function getXcamStats(printerId = null) {
  const where = printerId ? ' WHERE printer_id = ?' : '';
  const params = printerId ? [printerId] : [];
  const total = db.prepare(`SELECT COUNT(*) as count FROM xcam_events${where}`).get(...params);
  const byType = db.prepare(`SELECT event_type, COUNT(*) as count FROM xcam_events${where} GROUP BY event_type`).all(...params);

  const stats = { total: total.count, spaghetti: 0, first_layer: 0, foreign_object: 0, nozzle_clump: 0 };
  for (const row of byType) {
    if (row.event_type === 'spaghetti_detected') stats.spaghetti = row.count;
    else if (row.event_type === 'first_layer_issue') stats.first_layer = row.count;
    else if (row.event_type === 'foreign_object') stats.foreign_object = row.count;
    else if (row.event_type === 'nozzle_clump') stats.nozzle_clump = row.count;
  }
  return stats;
}

// ---- AMS Tray Lifetime ----

export function upsertAmsTrayLifetime(entry) {
  const key = entry.tray_uuid || `pos_${entry.ams_unit}_${entry.tray_id}`;
  const existing = db.prepare('SELECT id, tray_uuid FROM ams_tray_lifetime WHERE printer_id = ? AND ams_unit = ? AND tray_id = ? AND (tray_uuid = ? OR (tray_uuid IS NULL AND ? IS NULL))')
    .get(entry.printer_id, entry.ams_unit, entry.tray_id, key, key);
  if (existing) {
    return db.prepare("UPDATE ams_tray_lifetime SET last_seen = datetime('now'), tray_uuid = COALESCE(?, tray_uuid) WHERE id = ?")
      .run(entry.tray_uuid || null, existing.id);
  }
  return db.prepare('INSERT INTO ams_tray_lifetime (printer_id, ams_unit, tray_id, tray_uuid) VALUES (?, ?, ?, ?)')
    .run(entry.printer_id, entry.ams_unit, entry.tray_id, entry.tray_uuid || null);
}

export function updateAmsTrayFilamentUsed(printerId, amsUnit, trayId, usedG) {
  db.prepare("UPDATE ams_tray_lifetime SET total_filament_used_g = total_filament_used_g + ?, last_seen = datetime('now') WHERE printer_id = ? AND ams_unit = ? AND tray_id = ?")
    .run(usedG, printerId, amsUnit, trayId);
}

export function getAmsTrayLifetime(printerId) {
  return db.prepare('SELECT * FROM ams_tray_lifetime WHERE printer_id = ? ORDER BY ams_unit, tray_id').all(printerId);
}

// ---- Demo data cleanup ----

export function getDemoPrinterIds() {
  return db.prepare("SELECT id FROM printers WHERE id LIKE 'demo-%'").all().map(r => r.id);
}

export function purgeDemoData() {
  const ids = getDemoPrinterIds();
  if (ids.length === 0) return { deleted: 0 };

  const placeholders = ids.map(() => '?').join(',');
  const tables = [
    'print_history', 'error_log', 'ams_snapshots', 'filament_waste',
    'nozzle_sessions', 'maintenance_log', 'maintenance_schedule',
    'telemetry', 'component_wear', 'firmware_history',
    'xcam_events', 'ams_tray_lifetime', 'filament_inventory'
  ];

  let deleted = 0;
  for (const table of tables) {
    try {
      const r = db.prepare(`DELETE FROM ${table} WHERE printer_id IN (${placeholders})`).run(...ids);
      deleted += r.changes;
    } catch { /* table may not exist */ }
  }

  // Delete the printers themselves
  for (const id of ids) {
    db.prepare('DELETE FROM printers WHERE id = ?').run(id);
  }
  deleted += ids.length;

  return { deleted, printerIds: ids };
}

// ---- Notifications ----

export function addNotificationLog(entry) {
  return db.prepare(`INSERT INTO notification_log
    (event_type, channel, printer_id, title, message, status, error_info)
    VALUES (?, ?, ?, ?, ?, ?, ?)`).run(
    entry.event_type, entry.channel, entry.printer_id || null,
    entry.title, entry.message, entry.status || 'sent', entry.error_info || null
  );
}

export function getNotificationLog(limit = 50, offset = 0) {
  return db.prepare('SELECT * FROM notification_log ORDER BY timestamp DESC LIMIT ? OFFSET ?')
    .all(limit, offset);
}

export function addNotificationQueue(entry) {
  return db.prepare(`INSERT INTO notification_queue
    (event_type, printer_id, printer_name, title, message, event_data)
    VALUES (?, ?, ?, ?, ?, ?)`).run(
    entry.event_type, entry.printer_id || null, entry.printer_name || null,
    entry.title, entry.message, entry.event_data ? JSON.stringify(entry.event_data) : null
  );
}

export function getNotificationQueue() {
  return db.prepare('SELECT * FROM notification_queue ORDER BY queued_at ASC').all();
}

export function clearNotificationQueue() {
  return db.prepare('DELETE FROM notification_queue').run();
}

// ---- Update History ----

export function addUpdateEntry(entry) {
  const result = db.prepare(`
    INSERT INTO update_history (from_version, to_version, method, status, backup_path)
    VALUES (?, ?, ?, ?, ?)
  `).run(entry.from_version, entry.to_version, entry.method, entry.status || 'started', entry.backup_path || null);
  return result.lastInsertRowid;
}

export function updateUpdateEntry(id, status, errorMessage, durationMs) {
  db.prepare('UPDATE update_history SET status = ?, error_message = ?, duration_ms = ? WHERE id = ?')
    .run(status, errorMessage || null, durationMs || null, id);
}

export function getUpdateHistory(limit = 20) {
  return db.prepare('SELECT * FROM update_history ORDER BY timestamp DESC LIMIT ?').all(limit);
}

// ---- Protection Settings & Log ----

export function getProtectionSettings(printerId) {
  return db.prepare('SELECT * FROM protection_settings WHERE printer_id = ?').get(printerId) || null;
}

export function upsertProtectionSettings(printerId, settings) {
  db.prepare(`INSERT INTO protection_settings
    (printer_id, enabled, spaghetti_action, first_layer_action, foreign_object_action, nozzle_clump_action,
     cooldown_seconds, auto_resume, temp_deviation_action, filament_runout_action, print_error_action,
     fan_failure_action, print_stall_action, temp_deviation_threshold, filament_low_pct, stall_minutes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(printer_id) DO UPDATE SET
      enabled = excluded.enabled,
      spaghetti_action = excluded.spaghetti_action,
      first_layer_action = excluded.first_layer_action,
      foreign_object_action = excluded.foreign_object_action,
      nozzle_clump_action = excluded.nozzle_clump_action,
      cooldown_seconds = excluded.cooldown_seconds,
      auto_resume = excluded.auto_resume,
      temp_deviation_action = excluded.temp_deviation_action,
      filament_runout_action = excluded.filament_runout_action,
      print_error_action = excluded.print_error_action,
      fan_failure_action = excluded.fan_failure_action,
      print_stall_action = excluded.print_stall_action,
      temp_deviation_threshold = excluded.temp_deviation_threshold,
      filament_low_pct = excluded.filament_low_pct,
      stall_minutes = excluded.stall_minutes
  `).run(
    printerId,
    settings.enabled ?? 1,
    settings.spaghetti_action || 'pause',
    settings.first_layer_action || 'notify',
    settings.foreign_object_action || 'pause',
    settings.nozzle_clump_action || 'pause',
    settings.cooldown_seconds ?? 60,
    settings.auto_resume ?? 0,
    settings.temp_deviation_action || 'notify',
    settings.filament_runout_action || 'notify',
    settings.print_error_action || 'notify',
    settings.fan_failure_action || 'notify',
    settings.print_stall_action || 'notify',
    settings.temp_deviation_threshold ?? 15,
    settings.filament_low_pct ?? 5,
    settings.stall_minutes ?? 10
  );
}

export function addProtectionLog(entry) {
  return db.prepare(`INSERT INTO protection_log
    (printer_id, event_type, action_taken, print_id, notes)
    VALUES (?, ?, ?, ?, ?)`).run(
    entry.printer_id, entry.event_type, entry.action_taken,
    entry.print_id || null, entry.notes || null
  );
}

export function getProtectionLog(printerId, limit = 50) {
  if (printerId) {
    return db.prepare('SELECT * FROM protection_log WHERE printer_id = ? ORDER BY timestamp DESC LIMIT ?').all(printerId, limit);
  }
  return db.prepare('SELECT * FROM protection_log ORDER BY timestamp DESC LIMIT ?').all(limit);
}

export function resolveProtectionAlert(logId) {
  db.prepare("UPDATE protection_log SET resolved = 1, resolved_at = datetime('now') WHERE id = ?").run(logId);
}

export function getActiveAlerts(printerId) {
  if (printerId) {
    return db.prepare('SELECT * FROM protection_log WHERE printer_id = ? AND resolved = 0 ORDER BY timestamp DESC').all(printerId);
  }
  return db.prepare('SELECT * FROM protection_log WHERE resolved = 0 ORDER BY timestamp DESC').all();
}

// ---- Model Links ----

export function getModelLink(printerId, filename) {
  return db.prepare('SELECT * FROM model_links WHERE printer_id = ? AND filename = ?').get(printerId, filename);
}

export function setModelLink(link) {
  return db.prepare(`INSERT INTO model_links (printer_id, filename, source, source_id, title, url, image, designer, description, category, print_settings)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(printer_id, filename) DO UPDATE SET
      source = excluded.source,
      source_id = excluded.source_id,
      title = excluded.title,
      url = excluded.url,
      image = excluded.image,
      designer = excluded.designer,
      description = excluded.description,
      category = excluded.category,
      print_settings = excluded.print_settings,
      linked_at = datetime('now')
  `).run(
    link.printer_id, link.filename, link.source, link.source_id,
    link.title || null, link.url || null, link.image || null, link.designer || null,
    link.description || null, link.category || null,
    link.print_settings ? (typeof link.print_settings === 'string' ? link.print_settings : JSON.stringify(link.print_settings)) : null
  );
}

export function deleteModelLink(printerId, filename) {
  return db.prepare('DELETE FROM model_links WHERE printer_id = ? AND filename = ?').run(printerId, filename);
}

export function getRecentModelLinks(limit = 10) {
  return db.prepare('SELECT * FROM model_links ORDER BY linked_at DESC LIMIT ?').all(limit);
}
