import { DatabaseSync } from 'node:sqlite';
import { join, dirname } from 'node:path';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { DATA_DIR } from './config.js';

const __filename_db = fileURLToPath(import.meta.url);
const __dirname_db = dirname(__filename_db);

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
    { version: 15, up: _mig015_inventory_system },
    { version: 16, up: _mig016_inventory_enhancements },
    { version: 17, up: _mig017_finish_weights_settings },
    { version: 18, up: _mig018_external_id_fields_diameters },
    { version: 19, up: _mig019_filament_price },
    { version: 20, up: _mig020_spool_tare_weight },
    { version: 21, up: _mig021_error_acknowledged },
    { version: 22, up: _mig022_drying_management },
    { version: 23, up: _mig023_enhanced_profiles },
    { version: 24, up: _mig024_print_queue },
    { version: 25, up: _mig025_tags },
    { version: 26, up: _mig026_nfc },
    { version: 27, up: _mig027_checkout },
    { version: 28, up: _mig028_spool_events },
    { version: 29, up: _mig029_macros },
    { version: 30, up: _mig030_webhooks },
    { version: 31, up: _mig031_print_costs },
    { version: 32, up: _mig032_materials },
    { version: 33, up: _mig033_hardware },
    { version: 34, up: _mig034_permissions },
    { version: 35, up: _mig035_api_keys },
    { version: 36, up: _mig036_ecommerce },
    { version: 37, up: _mig037_timelapse },
    { version: 38, up: _mig038_push_subscriptions },
    { version: 39, up: _mig039_community_filaments },
    { version: 40, up: _mig040_brand_defaults },
    { version: 41, up: _mig041_custom_fields },
    { version: 42, up: _mig042_printer_groups },
    { version: 43, up: _mig043_projects },
    { version: 44, up: _mig044_export_templates },
    { version: 45, up: _mig045_totp },
    { version: 46, up: _mig046_user_quotas },
    { version: 47, up: _mig047_hub_kiosk },
    { version: 48, up: _mig048_failure_detection },
    { version: 49, up: _mig049_price_history },
    { version: 50, up: _mig050_multi_plate },
    { version: 51, up: _mig051_dryer_storage },
    { version: 52, up: _mig052_courses },
    { version: 53, up: _mig053_ecom_license },
    { version: 54, up: _mig054_learning_center_v2 },
    { version: 55, up: _mig055_knowledge_base },
    { version: 56, up: _mig054_learning_center_v2 },
    { version: 57, up: _mig057_favorites_multiprint },
    { version: 58, up: _mig058_shared_palettes },
    { version: 59, up: _mig059_transmission_distance },
    { version: 60, up: _mig060_slicer_jobs },
    { version: 61, up: _mig061_filament_database_v2 },
    { version: 62, up: _mig062_price_alerts },
    { version: 63, up: _mig063_queue_tags },
    { version: 64, up: _mig064_bed_mesh },
    { version: 65, up: _mig065_filament_changes },
    { version: 66, up: _mig066_price_source_url },
    { version: 67, up: _mig067_community_sharing },
    { version: 68, up: _mig068_material_modifiers },
    { version: 69, up: _mig069_compatibility_matrix },
    { version: 70, up: _mig070_competitive_features },
    { version: 71, up: _mig071_printer_cost_settings },
    { version: 72, up: _mig072_location_fk },
  ];

  for (const m of migrations) {
    if (m.version > currentVersion) {
      try {
        m.up();
        db.prepare('INSERT INTO schema_version (version) VALUES (?)').run(m.version);
        console.log(`[db] Migrering v${m.version} fullført`);
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

function _mig015_inventory_system() {
  // Vendors
  db.exec(`
    CREATE TABLE IF NOT EXISTS vendors (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      website TEXT,
      empty_spool_weight_g REAL,
      comment TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );
  `);

  // Filament profiles (a SKU / product)
  db.exec(`
    CREATE TABLE IF NOT EXISTS filament_profiles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      vendor_id INTEGER REFERENCES vendors(id) ON DELETE SET NULL,
      name TEXT NOT NULL,
      material TEXT NOT NULL,
      color_name TEXT,
      color_hex TEXT,
      density REAL DEFAULT 1.24,
      diameter REAL DEFAULT 1.75,
      spool_weight_g REAL DEFAULT 1000,
      nozzle_temp_min INTEGER,
      nozzle_temp_max INTEGER,
      bed_temp_min INTEGER,
      bed_temp_max INTEGER,
      comment TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_fp_vendor ON filament_profiles(vendor_id);
    CREATE INDEX IF NOT EXISTS idx_fp_material ON filament_profiles(material);
  `);

  // Individual spools
  db.exec(`
    CREATE TABLE IF NOT EXISTS spools (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      filament_profile_id INTEGER REFERENCES filament_profiles(id) ON DELETE SET NULL,
      remaining_weight_g REAL DEFAULT 1000,
      used_weight_g REAL DEFAULT 0,
      initial_weight_g REAL DEFAULT 1000,
      cost REAL,
      lot_number TEXT,
      purchase_date TEXT,
      first_used_at TEXT,
      last_used_at TEXT,
      location TEXT,
      printer_id TEXT,
      ams_unit INTEGER,
      ams_tray INTEGER,
      archived INTEGER DEFAULT 0,
      comment TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_spools_profile ON spools(filament_profile_id);
    CREATE INDEX IF NOT EXISTS idx_spools_printer ON spools(printer_id);
    CREATE INDEX IF NOT EXISTS idx_spools_archived ON spools(archived);
    CREATE INDEX IF NOT EXISTS idx_spools_slot ON spools(printer_id, ams_unit, ams_tray);
  `);

  // Usage log per print
  db.exec(`
    CREATE TABLE IF NOT EXISTS spool_usage_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      spool_id INTEGER NOT NULL REFERENCES spools(id) ON DELETE CASCADE,
      print_history_id INTEGER REFERENCES print_history(id) ON DELETE SET NULL,
      printer_id TEXT,
      used_weight_g REAL NOT NULL,
      timestamp TEXT DEFAULT (datetime('now')),
      source TEXT DEFAULT 'auto'
    );
    CREATE INDEX IF NOT EXISTS idx_sul_spool ON spool_usage_log(spool_id);
    CREATE INDEX IF NOT EXISTS idx_sul_time ON spool_usage_log(timestamp);
  `);

  // Storage locations
  db.exec(`
    CREATE TABLE IF NOT EXISTS locations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      description TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );
  `);

  // Migrate existing filament_inventory data into the new system
  _migrateFilamentInventory();
}

function _migrateFilamentInventory() {
  const rows = db.prepare('SELECT * FROM filament_inventory').all();
  if (rows.length === 0) return;

  console.log(`[db] Migrating ${rows.length} filament_inventory rows to new inventory system...`);

  // Step 1: Extract unique vendors
  const vendorMap = new Map(); // brand -> vendor_id
  for (const row of rows) {
    const brand = (row.brand || '').trim();
    if (brand && !vendorMap.has(brand)) {
      try {
        const result = db.prepare('INSERT INTO vendors (name) VALUES (?)').run(brand);
        vendorMap.set(brand, Number(result.lastInsertRowid));
      } catch {
        // UNIQUE constraint — already exists
        const existing = db.prepare('SELECT id FROM vendors WHERE name = ?').get(brand);
        if (existing) vendorMap.set(brand, existing.id);
      }
    }
  }

  // Step 2: Extract unique filament profiles
  const profileMap = new Map(); // "brand|type|color_name|color_hex" -> profile_id
  for (const row of rows) {
    const brand = (row.brand || '').trim();
    const key = `${brand}|${row.type}|${row.color_name || ''}|${row.color_hex || ''}`;
    if (!profileMap.has(key)) {
      const vendorId = vendorMap.get(brand) || null;
      const result = db.prepare(`
        INSERT INTO filament_profiles (vendor_id, name, material, color_name, color_hex, spool_weight_g)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(vendorId, `${brand ? brand + ' ' : ''}${row.type}${row.color_name ? ' ' + row.color_name : ''}`,
        row.type, row.color_name || null, row.color_hex || null, row.weight_total_g || 1000);
      profileMap.set(key, Number(result.lastInsertRowid));
    }
  }

  // Step 3: Create spools from each inventory row
  for (const row of rows) {
    const brand = (row.brand || '').trim();
    const key = `${brand}|${row.type}|${row.color_name || ''}|${row.color_hex || ''}`;
    const profileId = profileMap.get(key);
    const remaining = (row.weight_total_g || 1000) - (row.weight_used_g || 0);
    db.prepare(`
      INSERT INTO spools (filament_profile_id, remaining_weight_g, used_weight_g, initial_weight_g, cost, purchase_date, printer_id, comment)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(profileId, Math.max(0, remaining), row.weight_used_g || 0, row.weight_total_g || 1000,
      row.cost_nok || null, row.purchase_date || null, row.printer_id || null, row.notes || null);
  }

  console.log(`[db] Migrated: ${vendorMap.size} vendors, ${profileMap.size} profiles, ${rows.length} spools`);
}

function _mig016_inventory_enhancements() {
  // Multi-color + article number + extra fields for filament_profiles
  const fpCols = [
    ['multi_color_hexes', 'TEXT'],
    ['multi_color_direction', 'TEXT'],
    ['article_number', 'TEXT'],
    ['extra_fields', 'TEXT'],
  ];
  for (const [col, type] of fpCols) {
    try { db.exec(`ALTER TABLE filament_profiles ADD COLUMN ${col} ${type}`); } catch {}
  }
  try { db.exec('CREATE INDEX IF NOT EXISTS idx_fp_article ON filament_profiles(article_number)'); } catch {}

  // Extra fields for vendors
  try { db.exec('ALTER TABLE vendors ADD COLUMN extra_fields TEXT'); } catch {}

  // Extra fields for spools
  try { db.exec('ALTER TABLE spools ADD COLUMN extra_fields TEXT'); } catch {}
}

function _mig017_finish_weights_settings() {
  // Filament finish properties + spool weight options
  const fpCols = [
    ['finish', 'TEXT'],           // matte, glossy, satin, silk
    ['translucent', 'INTEGER'],   // 0 or 1
    ['glow', 'INTEGER'],          // 0 or 1
    ['weight_options', 'TEXT'],   // JSON array e.g. [250, 500, 1000]
  ];
  for (const [col, type] of fpCols) {
    try { db.exec(`ALTER TABLE filament_profiles ADD COLUMN ${col} ${type}`); } catch {}
  }

  // Inventory settings table
  db.exec(`
    CREATE TABLE IF NOT EXISTS inventory_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    )
  `);
}

function _mig018_external_id_fields_diameters() {
  // external_id on vendors and filament_profiles (for SpoolmanDB linking)
  for (const [tbl, col] of [['vendors','external_id'],['filament_profiles','external_id'],['filament_profiles','diameters']]) {
    try { db.exec(`ALTER TABLE ${tbl} ADD COLUMN ${col} TEXT`); } catch {}
  }

  // Custom field schema definitions table
  db.exec(`
    CREATE TABLE IF NOT EXISTS field_schemas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      entity_type TEXT NOT NULL,
      key TEXT NOT NULL,
      name TEXT NOT NULL,
      field_type TEXT NOT NULL DEFAULT 'text',
      unit TEXT,
      UNIQUE(entity_type, key)
    )
  `);

  // Migrate weight_options (simple array) to weights (array of objects with spool_type)
  // Only if weight_options has values and weights column doesn't exist yet
  try { db.exec(`ALTER TABLE filament_profiles ADD COLUMN weights TEXT`); } catch {}
  // Migrate existing weight_options to weights format
  const profiles = db.prepare('SELECT id, weight_options, spool_weight_g FROM filament_profiles WHERE weight_options IS NOT NULL').all();
  for (const p of profiles) {
    try {
      const opts = JSON.parse(p.weight_options);
      if (Array.isArray(opts) && opts.length > 0) {
        const weights = opts.map(w => ({ weight: w, spool_weight: p.spool_weight_g || null, spool_type: 'plastic' }));
        db.prepare('UPDATE filament_profiles SET weights = ? WHERE id = ?').run(JSON.stringify(weights), p.id);
      }
    } catch {}
  }
}

function _mig019_filament_price() {
  try { db.exec('ALTER TABLE filament_profiles ADD COLUMN price REAL'); } catch {}
}

function _mig020_spool_tare_weight() {
  try { db.exec('ALTER TABLE spools ADD COLUMN spool_weight REAL'); } catch {}
}

function _mig021_error_acknowledged() {
  try { db.exec('ALTER TABLE error_log ADD COLUMN acknowledged INTEGER DEFAULT 0'); } catch {}
}

function _mig022_drying_management() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS drying_sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      spool_id INTEGER NOT NULL REFERENCES spools(id) ON DELETE CASCADE,
      temperature INTEGER,
      duration_minutes INTEGER NOT NULL,
      method TEXT NOT NULL DEFAULT 'dryer_box',
      started_at TEXT NOT NULL DEFAULT (datetime('now')),
      completed_at TEXT,
      humidity_before REAL,
      humidity_after REAL,
      notes TEXT,
      active INTEGER NOT NULL DEFAULT 1
    );
    CREATE INDEX IF NOT EXISTS idx_drying_spool ON drying_sessions(spool_id);
    CREATE INDEX IF NOT EXISTS idx_drying_active ON drying_sessions(active);
    CREATE INDEX IF NOT EXISTS idx_drying_started ON drying_sessions(started_at);

    CREATE TABLE IF NOT EXISTS drying_presets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      material TEXT NOT NULL UNIQUE,
      temperature INTEGER NOT NULL,
      duration_minutes INTEGER NOT NULL,
      max_days_without_drying INTEGER DEFAULT 30,
      notes TEXT
    );
  `);

  const defaults = [
    ['PLA', 50, 240, 30],
    ['PLA+', 50, 240, 30],
    ['PLA Matte', 50, 240, 30],
    ['PLA Silk', 50, 240, 30],
    ['PETG', 65, 360, 14],
    ['PETG-CF', 65, 360, 14],
    ['ABS', 80, 240, 14],
    ['ASA', 80, 240, 14],
    ['TPU', 55, 300, 7],
    ['TPU 95A', 55, 300, 7],
    ['PA', 80, 480, 2],
    ['PA-CF', 80, 480, 2],
    ['PA-GF', 80, 480, 2],
    ['PA6-CF', 80, 480, 2],
    ['PAHT-CF', 80, 480, 2],
    ['PC', 80, 360, 7],
    ['PVA', 45, 360, 1],
    ['HIPS', 70, 240, 14],
    ['PET-CF', 65, 360, 14],
    ['PPA-CF', 80, 480, 5],
    ['PPA-GF', 80, 480, 5],
    ['PP', 60, 360, 14],
    ['BVOH', 45, 360, 1],
  ];
  const stmt = db.prepare('INSERT OR IGNORE INTO drying_presets (material, temperature, duration_minutes, max_days_without_drying) VALUES (?, ?, ?, ?)');
  for (const [mat, temp, dur, days] of defaults) {
    stmt.run(mat, temp, dur, days);
  }

  try { db.exec('ALTER TABLE spools ADD COLUMN last_dried_at TEXT'); } catch {}
}

function _mig023_enhanced_profiles() {
  try { db.exec('ALTER TABLE filament_profiles ADD COLUMN pressure_advance_k REAL'); } catch {}
  try { db.exec('ALTER TABLE filament_profiles ADD COLUMN max_volumetric_speed REAL'); } catch {}
  try { db.exec('ALTER TABLE filament_profiles ADD COLUMN retraction_distance REAL'); } catch {}
  try { db.exec('ALTER TABLE filament_profiles ADD COLUMN retraction_speed REAL'); } catch {}
  try { db.exec('ALTER TABLE filament_profiles ADD COLUMN cooling_fan_speed INTEGER'); } catch {}
  try { db.exec('ALTER TABLE filament_profiles ADD COLUMN optimal_settings TEXT'); } catch {}
}

function _mig024_print_queue() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS print_queue (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      status TEXT NOT NULL DEFAULT 'active',
      auto_start INTEGER DEFAULT 0,
      cooldown_seconds INTEGER DEFAULT 60,
      bed_clear_gcode TEXT,
      priority_mode TEXT DEFAULT 'fifo',
      target_printer_id TEXT,
      created_by TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      completed_at TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_pq_status ON print_queue(status);

    CREATE TABLE IF NOT EXISTS queue_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      queue_id INTEGER NOT NULL REFERENCES print_queue(id) ON DELETE CASCADE,
      filename TEXT NOT NULL,
      printer_id TEXT,
      status TEXT NOT NULL DEFAULT 'pending',
      priority INTEGER DEFAULT 0,
      copies INTEGER DEFAULT 1,
      copies_completed INTEGER DEFAULT 0,
      print_history_id INTEGER REFERENCES print_history(id),
      estimated_duration_s INTEGER,
      estimated_filament_g REAL,
      required_material TEXT,
      required_nozzle_mm REAL,
      notes TEXT,
      added_at TEXT DEFAULT (datetime('now')),
      started_at TEXT,
      completed_at TEXT,
      sort_order INTEGER DEFAULT 0
    );
    CREATE INDEX IF NOT EXISTS idx_qi_queue ON queue_items(queue_id);
    CREATE INDEX IF NOT EXISTS idx_qi_status ON queue_items(status);
    CREATE INDEX IF NOT EXISTS idx_qi_printer ON queue_items(printer_id);

    CREATE TABLE IF NOT EXISTS queue_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      queue_id INTEGER REFERENCES print_queue(id),
      item_id INTEGER REFERENCES queue_items(id),
      printer_id TEXT,
      event TEXT NOT NULL,
      details TEXT,
      timestamp TEXT DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_ql_queue ON queue_log(queue_id);
  `);
}

function _mig025_tags() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS tags (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      category TEXT DEFAULT 'custom',
      color TEXT
    );

    CREATE TABLE IF NOT EXISTS entity_tags (
      entity_type TEXT NOT NULL,
      entity_id INTEGER NOT NULL,
      tag_id INTEGER NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
      PRIMARY KEY (entity_type, entity_id, tag_id)
    );
    CREATE INDEX IF NOT EXISTS idx_entity_tags ON entity_tags(entity_type, entity_id);
  `);
}

function _mig026_nfc() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS nfc_mappings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tag_uid TEXT NOT NULL UNIQUE,
      spool_id INTEGER REFERENCES spools(id) ON DELETE SET NULL,
      standard TEXT DEFAULT 'openspool',
      data TEXT,
      last_scanned TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_nfc_spool ON nfc_mappings(spool_id);
  `);
}

function _mig027_checkout() {
  const cols = [
    ['checked_out', 'INTEGER DEFAULT 0'],
    ['checked_out_at', 'TEXT'],
    ['checked_out_by', 'TEXT'],
    ['checked_out_from', 'TEXT']
  ];
  for (const [col, type] of cols) {
    try { db.exec(`ALTER TABLE spools ADD COLUMN ${col} ${type}`); } catch (e) { /* exists */ }
  }
  db.exec(`
    CREATE TABLE IF NOT EXISTS spool_checkout_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      spool_id INTEGER NOT NULL REFERENCES spools(id) ON DELETE CASCADE,
      action TEXT NOT NULL,
      from_location TEXT,
      to_location TEXT,
      actor TEXT,
      timestamp TEXT DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_checkout_spool ON spool_checkout_log(spool_id);
  `);
}

function _mig028_spool_events() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS spool_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      spool_id INTEGER NOT NULL REFERENCES spools(id) ON DELETE CASCADE,
      event_type TEXT NOT NULL,
      details TEXT,
      actor TEXT,
      timestamp TEXT DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_spool_events_spool ON spool_events(spool_id);
    CREATE INDEX IF NOT EXISTS idx_spool_events_type ON spool_events(event_type);
  `);
}

function _mig029_macros() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS gcode_macros (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      gcode TEXT NOT NULL,
      category TEXT DEFAULT 'manual',
      sort_order INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    );
  `);
  // Seed preset macros
  const presets = [
    ['Home All', 'Home all axes', 'G28', 'maintenance'],
    ['Bed Level', 'Auto bed leveling', 'G29', 'maintenance'],
    ['PID Tune Nozzle', 'PID autotune nozzle at 200C', 'M303 E0 S200 C8', 'maintenance'],
    ['Disable Steppers', 'Disable stepper motors', 'M84', 'manual'],
    ['Clear Bed', 'Move printhead up and bed forward for clearing', 'G91\nG1 Z50 F600\nG90\nG1 Y250 F3000', 'post_print']
  ];
  const stmt = db.prepare('INSERT OR IGNORE INTO gcode_macros (name, description, gcode, category, sort_order) VALUES (?, ?, ?, ?, ?)');
  presets.forEach(([name, desc, gcode, cat], i) => {
    try { stmt.run(name, desc, gcode, cat, i + 1); } catch (_) {}
  });
}

function _mig030_webhooks() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS webhook_configs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      url TEXT NOT NULL,
      secret TEXT,
      events TEXT DEFAULT '[]',
      headers TEXT DEFAULT '{}',
      template TEXT DEFAULT 'generic',
      retry_count INTEGER DEFAULT 3,
      retry_delay_s INTEGER DEFAULT 10,
      active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS webhook_deliveries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      webhook_id INTEGER REFERENCES webhook_configs(id) ON DELETE CASCADE,
      event_type TEXT,
      payload TEXT,
      status TEXT DEFAULT 'pending',
      attempts INTEGER DEFAULT 0,
      last_attempt TEXT,
      response_code INTEGER,
      response_body TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );
  `);
}

function _mig031_print_costs() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS print_costs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      print_history_id INTEGER UNIQUE REFERENCES print_history(id) ON DELETE CASCADE,
      filament_cost REAL DEFAULT 0,
      electricity_cost REAL DEFAULT 0,
      depreciation_cost REAL DEFAULT 0,
      labor_cost REAL DEFAULT 0,
      markup_amount REAL DEFAULT 0,
      total_cost REAL DEFAULT 0,
      currency TEXT DEFAULT 'NOK',
      calculated_at TEXT DEFAULT (datetime('now'))
    );
  `);
}

function _mig032_materials() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS material_reference (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      material TEXT UNIQUE NOT NULL,
      category TEXT DEFAULT 'standard',
      difficulty INTEGER DEFAULT 1,
      strength INTEGER DEFAULT 3,
      temp_resistance INTEGER DEFAULT 3,
      moisture_sensitivity INTEGER DEFAULT 3,
      flexibility INTEGER DEFAULT 1,
      layer_adhesion INTEGER DEFAULT 3,
      nozzle_temp_min INTEGER,
      nozzle_temp_max INTEGER,
      bed_temp_min INTEGER,
      bed_temp_max INTEGER,
      chamber_temp INTEGER,
      enclosure INTEGER DEFAULT 0,
      typical_density REAL,
      tips TEXT,
      nozzle_recommendation TEXT,
      abrasive INTEGER DEFAULT 0,
      food_safe INTEGER DEFAULT 0,
      uv_resistant INTEGER DEFAULT 0
    );
  `);
  // Seed common materials
  const materials = [
    ['PLA', 'standard', 1, 2, 1, 2, 1, 4, 190, 230, 45, 65, null, 0, 1.24, '{"print":"Easy to print, good for beginners","storage":"Keep dry, UV sensitive","post":"Can be sanded and painted"}', 'brass', 0, 0, 0],
    ['PLA+', 'standard', 1, 3, 2, 2, 2, 4, 200, 230, 50, 65, null, 0, 1.24, '{"print":"Improved toughness over standard PLA","storage":"Keep dry","post":"Can be sanded and painted"}', 'brass', 0, 0, 0],
    ['PLA-CF', 'composite', 2, 4, 2, 2, 1, 3, 210, 240, 50, 65, null, 0, 1.29, '{"print":"Use hardened nozzle, reduced stringing","storage":"Keep dry","post":"Matte finish, limited post-processing"}', 'hardened_steel', 1, 0, 0],
    ['PETG', 'standard', 2, 3, 3, 3, 2, 4, 220, 260, 70, 90, null, 0, 1.27, '{"print":"Prone to stringing, use retraction","storage":"Absorbs moisture moderately","post":"Difficult to sand, can be painted"}', 'brass', 0, 1, 0],
    ['ABS', 'standard', 3, 3, 4, 2, 2, 3, 230, 260, 90, 110, 60, 1, 1.04, '{"print":"Needs enclosure, prone to warping","storage":"Moderate moisture sensitivity","post":"Acetone smoothing possible"}', 'brass', 0, 0, 0],
    ['ASA', 'standard', 3, 3, 4, 2, 2, 3, 235, 260, 90, 110, 60, 1, 1.07, '{"print":"Similar to ABS, better UV resistance","storage":"Moderate moisture sensitivity","post":"Acetone smoothing possible"}', 'brass', 0, 0, 1],
    ['TPU', 'flexible', 3, 2, 2, 2, 5, 4, 210, 240, 40, 60, null, 0, 1.21, '{"print":"Slow print speed, direct drive preferred","storage":"Absorbs moisture","post":"Flexible, difficult to post-process"}', 'brass', 0, 0, 0],
    ['TPU 95A', 'flexible', 3, 2, 2, 2, 5, 4, 210, 240, 40, 60, null, 0, 1.21, '{"print":"Shore 95A, moderate flexibility","storage":"Absorbs moisture","post":"Flexible parts"}', 'brass', 0, 0, 0],
    ['PA (Nylon)', 'engineering', 4, 4, 4, 5, 3, 5, 240, 270, 70, 90, 60, 1, 1.14, '{"print":"Very hygroscopic, dry before printing","storage":"Must be kept very dry","post":"Can be dyed, strong layer adhesion"}', 'brass', 0, 0, 0],
    ['PA-CF', 'composite', 4, 5, 5, 4, 1, 4, 260, 290, 80, 100, 60, 1, 1.18, '{"print":"Hardened nozzle required, dry filament","storage":"Extremely hygroscopic","post":"Strong lightweight parts"}', 'hardened_steel', 1, 0, 0],
    ['PA-GF', 'composite', 4, 5, 4, 4, 1, 4, 260, 290, 80, 100, 60, 1, 1.22, '{"print":"Hardened nozzle required, abrasive","storage":"Very hygroscopic","post":"Strong structural parts"}', 'hardened_steel', 1, 0, 0],
    ['PC', 'engineering', 4, 4, 5, 3, 2, 4, 260, 300, 100, 120, 70, 1, 1.20, '{"print":"High temps, enclosure required","storage":"Hygroscopic","post":"Very strong, heat resistant"}', 'brass', 0, 0, 1],
    ['PAHT-CF', 'composite', 5, 5, 5, 4, 1, 4, 280, 320, 90, 110, 70, 1, 1.20, '{"print":"High temp PA with carbon fiber","storage":"Keep sealed and dry","post":"Industrial strength parts"}', 'hardened_steel', 1, 0, 0],
    ['PET-CF', 'composite', 3, 4, 4, 3, 1, 3, 240, 270, 70, 90, null, 0, 1.30, '{"print":"Hardened nozzle recommended","storage":"Moderate moisture sensitivity","post":"Stiff and strong"}', 'hardened_steel', 1, 0, 0],
    ['PVA', 'support', 3, 1, 1, 5, 2, 3, 185, 210, 45, 60, null, 0, 1.23, '{"print":"Water soluble support material","storage":"Extremely hygroscopic, seal immediately","post":"Dissolves in warm water"}', 'brass', 0, 0, 0],
    ['HIPS', 'support', 2, 2, 3, 2, 2, 3, 220, 250, 90, 110, null, 1, 1.04, '{"print":"Dissolvable in limonene","storage":"Low moisture sensitivity","post":"Limonene bath to dissolve"}', 'brass', 0, 0, 0],
    ['PPA-CF', 'composite', 5, 5, 5, 4, 1, 4, 290, 320, 90, 110, 80, 1, 1.22, '{"print":"Very high temp, hardened nozzle","storage":"Keep sealed and dry","post":"Extreme performance parts"}', 'hardened_steel', 1, 0, 0],
    ['PPA-GF', 'composite', 5, 5, 5, 4, 1, 4, 290, 320, 90, 110, 80, 1, 1.25, '{"print":"Glass fiber reinforced, very abrasive","storage":"Keep sealed and dry","post":"Extreme temp resistance"}', 'hardened_steel', 1, 0, 0],
    ['PP', 'engineering', 3, 3, 3, 1, 4, 2, 210, 240, 80, 100, null, 0, 0.90, '{"print":"Poor bed adhesion, use PP sheet","storage":"Low moisture absorption","post":"Chemical resistant, food safe"}', 'brass', 0, 1, 0],
    ['PE', 'engineering', 3, 3, 3, 1, 4, 2, 200, 230, 70, 90, null, 0, 0.95, '{"print":"Difficult bed adhesion","storage":"Low moisture absorption","post":"Chemical resistant"}', 'brass', 0, 1, 0],
    ['PVDF', 'engineering', 4, 4, 5, 1, 2, 3, 240, 270, 100, 120, null, 1, 1.78, '{"print":"Chemical resistant engineering material","storage":"Low moisture sensitivity","post":"Excellent chemical resistance"}', 'brass', 0, 0, 0],
    ['POM', 'engineering', 3, 4, 4, 1, 3, 2, 200, 230, 100, 120, null, 0, 1.41, '{"print":"Low friction, poor bed adhesion","storage":"Low moisture sensitivity","post":"Self-lubricating parts"}', 'brass', 0, 0, 0],
    ['PEEK', 'high-performance', 5, 5, 5, 2, 1, 5, 370, 420, 120, 160, 120, 1, 1.30, '{"print":"Requires all-metal hotend, very high temps","storage":"Low moisture sensitivity","post":"CNC-like strength, autoclavable"}', 'hardened_steel', 0, 0, 1],
    ['PEI (ULTEM)', 'high-performance', 5, 5, 5, 2, 1, 4, 350, 400, 120, 160, 100, 1, 1.27, '{"print":"Extremely high temps, specialty printer","storage":"Low moisture sensitivity","post":"Flame retardant, autoclavable"}', 'hardened_steel', 0, 0, 1],
    ['CPE', 'engineering', 3, 3, 4, 3, 2, 3, 240, 270, 70, 90, null, 0, 1.25, '{"print":"Similar to PETG but higher temp resistance","storage":"Moderate moisture sensitivity","post":"Chemical resistant"}', 'brass', 0, 0, 0],
    ['Wood-PLA', 'specialty', 2, 1, 1, 2, 1, 3, 190, 220, 45, 65, null, 0, 1.15, '{"print":"Vary temperature for grain effect","storage":"Keep dry","post":"Can be sanded, stained, sealed"}', 'brass_large', 0, 0, 0],
    ['Silk PLA', 'specialty', 1, 2, 1, 2, 1, 4, 200, 230, 50, 65, null, 0, 1.24, '{"print":"Glossy silk finish, print slightly hotter","storage":"Keep dry","post":"Beautiful surface finish"}', 'brass', 0, 0, 0],
    ['PLA-Metal', 'specialty', 2, 2, 1, 2, 1, 3, 195, 225, 50, 65, null, 0, 2.0, '{"print":"Heavier than normal PLA, metal particles","storage":"Keep dry","post":"Can be polished for metallic look"}', 'hardened_steel', 1, 0, 0],
    ['PA6-CF', 'composite', 5, 5, 5, 5, 1, 4, 270, 300, 90, 110, 70, 1, 1.17, '{"print":"High performance carbon fiber nylon","storage":"Extremely hygroscopic","post":"Industrial grade strength"}', 'hardened_steel', 1, 0, 0],
    ['PA6-GF', 'composite', 5, 5, 4, 5, 1, 4, 270, 300, 90, 110, 70, 1, 1.23, '{"print":"Glass fiber nylon, very abrasive","storage":"Extremely hygroscopic","post":"Structural engineering parts"}', 'hardened_steel', 1, 0, 0],
  ];
  const stmt = db.prepare(`INSERT OR IGNORE INTO material_reference
    (material, category, difficulty, strength, temp_resistance, moisture_sensitivity, flexibility, layer_adhesion,
     nozzle_temp_min, nozzle_temp_max, bed_temp_min, bed_temp_max, chamber_temp, enclosure, typical_density,
     tips, nozzle_recommendation, abrasive, food_safe, uv_resistant)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`);
  for (const m of materials) {
    try { stmt.run(...m); } catch (_) {}
  }
}

function _mig033_hardware() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS hardware_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category TEXT NOT NULL,
      name TEXT NOT NULL,
      brand TEXT,
      model TEXT,
      compatible_printers TEXT DEFAULT '[]',
      specs TEXT DEFAULT '{}',
      purchase_price REAL,
      purchase_date TEXT,
      purchase_url TEXT,
      rating INTEGER,
      notes TEXT,
      image_url TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS hardware_printer_assignments (
      hardware_id INTEGER REFERENCES hardware_items(id) ON DELETE CASCADE,
      printer_id TEXT,
      installed_at TEXT DEFAULT (datetime('now')),
      removed_at TEXT,
      PRIMARY KEY (hardware_id, printer_id, installed_at)
    );
  `);
}

function _mig034_permissions() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS user_roles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      permissions TEXT DEFAULT '[]',
      description TEXT,
      is_default INTEGER DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role_id INTEGER REFERENCES user_roles(id),
      display_name TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      last_login TEXT
    );
  `);
  // Seed default roles
  const roles = [
    ['admin', '["*"]', 'Full access to all features', 0],
    ['operator', '["view","print","queue","controls","filament","macros"]', 'Can view and control printers, manage queue and filament', 0],
    ['viewer', '["view"]', 'Read-only access to dashboard', 1]
  ];
  const stmt = db.prepare('INSERT OR IGNORE INTO user_roles (name, permissions, description, is_default) VALUES (?, ?, ?, ?)');
  for (const r of roles) {
    try { stmt.run(...r); } catch (_) {}
  }
}

function _mig035_api_keys() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS api_keys (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      key_hash TEXT NOT NULL,
      key_prefix TEXT NOT NULL,
      permissions TEXT DEFAULT '["*"]',
      user_id INTEGER REFERENCES users(id),
      last_used TEXT,
      expires_at TEXT,
      active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now'))
    );
  `);
}

function _mig036_ecommerce() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS ecommerce_configs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      platform TEXT NOT NULL DEFAULT 'custom',
      name TEXT NOT NULL,
      webhook_secret TEXT,
      api_url TEXT,
      api_key TEXT,
      auto_queue INTEGER DEFAULT 0,
      target_queue_id INTEGER,
      sku_to_file_mapping TEXT DEFAULT '{}',
      active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS ecommerce_orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      config_id INTEGER REFERENCES ecommerce_configs(id),
      order_id TEXT,
      platform_order_id TEXT,
      customer_name TEXT,
      items TEXT DEFAULT '[]',
      status TEXT DEFAULT 'received',
      queue_item_ids TEXT DEFAULT '[]',
      received_at TEXT DEFAULT (datetime('now')),
      fulfilled_at TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_ecom_orders_config ON ecommerce_orders(config_id);
    CREATE INDEX IF NOT EXISTS idx_ecom_orders_status ON ecommerce_orders(status);
  `);
}

function _mig037_timelapse() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS timelapse_recordings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      printer_id TEXT,
      print_history_id INTEGER,
      filename TEXT,
      format TEXT DEFAULT 'mp4',
      duration_seconds INTEGER,
      frame_count INTEGER DEFAULT 0,
      file_size_bytes INTEGER DEFAULT 0,
      file_path TEXT,
      status TEXT DEFAULT 'recording',
      started_at TEXT DEFAULT (datetime('now')),
      completed_at TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_timelapse_printer ON timelapse_recordings(printer_id);
    CREATE INDEX IF NOT EXISTS idx_timelapse_status ON timelapse_recordings(status);
  `);
}

function _mig038_push_subscriptions() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS push_subscriptions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      endpoint TEXT NOT NULL UNIQUE,
      keys_p256dh TEXT,
      keys_auth TEXT,
      user_agent TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );
  `);
}

// ---- Migration v39-v52 ----

function _mig039_community_filaments() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS community_filaments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      manufacturer TEXT NOT NULL,
      name TEXT,
      material TEXT NOT NULL,
      density REAL,
      diameter REAL DEFAULT 1.75,
      weight INTEGER DEFAULT 1000,
      spool_weight INTEGER,
      extruder_temp INTEGER,
      bed_temp INTEGER,
      color_name TEXT,
      color_hex TEXT,
      td_value REAL,
      shore_hardness TEXT,
      source TEXT DEFAULT 'spoolmandb',
      created_at TEXT DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_cf_manufacturer ON community_filaments(manufacturer);
    CREATE INDEX IF NOT EXISTS idx_cf_material ON community_filaments(material);
    CREATE INDEX IF NOT EXISTS idx_cf_color_hex ON community_filaments(color_hex);
  `);
  // Seed from spoolmandb.json
  try {
    const dataPath = join(__dirname_db, 'spoolmandb.json');
    const raw = readFileSync(dataPath, 'utf8');
    const items = JSON.parse(raw);
    const stmt = db.prepare('INSERT INTO community_filaments (manufacturer, name, material, density, diameter, weight, spool_weight, extruder_temp, bed_temp, color_name, color_hex, source) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
    for (const item of items) {
      stmt.run(item.manufacturer || null, item.name || null, item.material || 'PLA', item.density || null, item.diameter || 1.75, item.weight || 1000, item.spool_weight || null, item.extruder_temp || null, item.bed_temp || null, item.color_name || null, item.color_hex || null, 'spoolmandb');
    }
    console.log(`[db] Seeded ${items.length} community filaments`);
  } catch (e) {
    console.warn('[db] Could not seed community filaments:', e.message);
  }
}

function _mig040_brand_defaults() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS brand_defaults (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      manufacturer TEXT NOT NULL,
      material TEXT,
      default_density REAL,
      default_diameter REAL DEFAULT 1.75,
      default_spool_weight INTEGER,
      default_net_weight INTEGER DEFAULT 1000,
      default_extruder_temp INTEGER,
      default_bed_temp INTEGER,
      default_max_speed INTEGER,
      default_retraction REAL,
      notes TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      UNIQUE(manufacturer, material)
    );
  `);
}

function _mig041_custom_fields() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS custom_field_defs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      entity_type TEXT NOT NULL,
      field_name TEXT NOT NULL,
      field_label TEXT NOT NULL,
      field_type TEXT NOT NULL DEFAULT 'text',
      options TEXT,
      default_value TEXT,
      required INTEGER DEFAULT 0,
      sort_order INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      UNIQUE(entity_type, field_name)
    );

    CREATE TABLE IF NOT EXISTS custom_field_values (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      field_id INTEGER NOT NULL REFERENCES custom_field_defs(id) ON DELETE CASCADE,
      entity_type TEXT NOT NULL,
      entity_id INTEGER NOT NULL,
      value TEXT,
      UNIQUE(field_id, entity_type, entity_id)
    );
    CREATE INDEX IF NOT EXISTS idx_cfv_entity ON custom_field_values(entity_type, entity_id);
  `);
}

function _mig042_printer_groups() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS printer_groups (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      parent_id INTEGER REFERENCES printer_groups(id) ON DELETE SET NULL,
      color TEXT,
      stagger_delay_s INTEGER DEFAULT 0,
      max_concurrent INTEGER DEFAULT 0,
      power_limit_w INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS printer_group_members (
      group_id INTEGER NOT NULL REFERENCES printer_groups(id) ON DELETE CASCADE,
      printer_id TEXT NOT NULL,
      sort_order INTEGER DEFAULT 0,
      PRIMARY KEY(group_id, printer_id)
    );
  `);
}

function _mig043_projects() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS projects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      status TEXT DEFAULT 'active',
      client_name TEXT,
      due_date TEXT,
      total_prints INTEGER DEFAULT 0,
      completed_prints INTEGER DEFAULT 0,
      total_cost REAL DEFAULT 0,
      notes TEXT,
      tags TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      completed_at TEXT
    );

    CREATE TABLE IF NOT EXISTS project_prints (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      print_history_id INTEGER,
      queue_item_id INTEGER,
      filename TEXT,
      status TEXT DEFAULT 'pending',
      notes TEXT,
      added_at TEXT DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_pp_project ON project_prints(project_id);
  `);
}

function _mig044_export_templates() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS export_templates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      entity_type TEXT NOT NULL,
      format TEXT NOT NULL DEFAULT 'csv',
      columns TEXT NOT NULL,
      filters TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );
  `);
}

function _mig045_totp() {
  try { db.exec('ALTER TABLE users ADD COLUMN totp_secret TEXT'); } catch {}
  try { db.exec('ALTER TABLE users ADD COLUMN totp_enabled INTEGER DEFAULT 0'); } catch {}
  try { db.exec('ALTER TABLE users ADD COLUMN totp_backup_codes TEXT'); } catch {}
}

function _mig046_user_quotas() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS user_quotas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      balance REAL DEFAULT 0,
      print_quota_daily INTEGER DEFAULT 0,
      print_quota_monthly INTEGER DEFAULT 0,
      filament_quota_g REAL DEFAULT 0,
      prints_today INTEGER DEFAULT 0,
      prints_this_month INTEGER DEFAULT 0,
      filament_used_g REAL DEFAULT 0,
      last_reset_daily TEXT,
      last_reset_monthly TEXT,
      UNIQUE(user_id)
    );

    CREATE TABLE IF NOT EXISTS user_transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      type TEXT NOT NULL,
      amount REAL NOT NULL,
      description TEXT,
      print_history_id INTEGER,
      created_at TEXT DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_ut_user ON user_transactions(user_id);
  `);
}

function _mig047_hub_kiosk() {
  // Hub/kiosk settings stored in inventory_settings
  // Just seed defaults
  try {
    const existing = db.prepare("SELECT value FROM inventory_settings WHERE key = 'hub_mode'").get();
    if (!existing) {
      db.prepare("INSERT INTO inventory_settings (key, value) VALUES ('hub_mode', '0')").run();
      db.prepare("INSERT INTO inventory_settings (key, value) VALUES ('kiosk_mode', '0')").run();
      db.prepare("INSERT INTO inventory_settings (key, value) VALUES ('kiosk_panels', 'dashboard,queue')").run();
      db.prepare("INSERT INTO inventory_settings (key, value) VALUES ('hub_refresh_interval', '30')").run();
    }
  } catch {}
}

function _mig048_failure_detection() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS failure_detections (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      printer_id TEXT NOT NULL,
      print_history_id INTEGER,
      detection_type TEXT NOT NULL,
      confidence REAL,
      frame_path TEXT,
      action_taken TEXT,
      acknowledged INTEGER DEFAULT 0,
      details TEXT,
      detected_at TEXT DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_fd_printer ON failure_detections(printer_id);
  `);
  // Settings
  try {
    const existing = db.prepare("SELECT value FROM inventory_settings WHERE key = 'ai_detection_enabled'").get();
    if (!existing) {
      db.prepare("INSERT INTO inventory_settings (key, value) VALUES ('ai_detection_enabled', '0')").run();
      db.prepare("INSERT INTO inventory_settings (key, value) VALUES ('ai_detection_interval', '60')").run();
      db.prepare("INSERT INTO inventory_settings (key, value) VALUES ('ai_detection_sensitivity', 'medium')").run();
      db.prepare("INSERT INTO inventory_settings (key, value) VALUES ('ai_detection_action', 'notify')").run();
    }
  } catch {}
}

function _mig049_price_history() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS price_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      filament_profile_id INTEGER REFERENCES filament_profiles(id) ON DELETE CASCADE,
      vendor_id INTEGER REFERENCES vendors(id),
      price REAL NOT NULL,
      currency TEXT DEFAULT 'USD',
      source TEXT,
      recorded_at TEXT DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_ph_profile ON price_history(filament_profile_id);
  `);
}

function _mig050_multi_plate() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS build_plates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      printer_id TEXT NOT NULL,
      name TEXT NOT NULL,
      type TEXT DEFAULT 'smooth_pei',
      material TEXT,
      surface_condition TEXT DEFAULT 'good',
      print_count INTEGER DEFAULT 0,
      notes TEXT,
      active INTEGER DEFAULT 1,
      installed_at TEXT DEFAULT (datetime('now')),
      created_at TEXT DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_bp_printer ON build_plates(printer_id);
  `);
}

function _mig051_dryer_storage() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS dryer_models (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      brand TEXT NOT NULL,
      model TEXT NOT NULL,
      max_temp INTEGER,
      tray_count INTEGER DEFAULT 1,
      max_spool_diameter INTEGER,
      has_humidity_sensor INTEGER DEFAULT 0,
      wattage INTEGER,
      notes TEXT,
      UNIQUE(brand, model)
    );

    CREATE TABLE IF NOT EXISTS storage_conditions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      spool_id INTEGER REFERENCES spools(id) ON DELETE CASCADE,
      humidity REAL,
      temperature REAL,
      container_type TEXT,
      desiccant_type TEXT,
      desiccant_replaced TEXT,
      sealed INTEGER DEFAULT 0,
      notes TEXT,
      recorded_at TEXT DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_sc_spool ON storage_conditions(spool_id);
  `);
  // Seed common dryer models
  const dryers = [
    ['Bambu Lab', 'AMS Lite Dryer', 55, 1, 200, 1, 40],
    ['Sunlu', 'FilaDryer S1', 55, 1, 200, 0, 48],
    ['Sunlu', 'FilaDryer S2', 70, 1, 220, 1, 110],
    ['Sunlu', 'FilaDryer S4', 70, 4, 200, 1, 350],
    ['eSun', 'eBOX Lite', 55, 1, 200, 1, 36],
    ['eSun', 'eBOX', 70, 1, 220, 1, 75],
    ['Creality', 'Filament Dryer', 55, 1, 200, 0, 45],
    ['Sovol', 'SH01', 70, 1, 220, 1, 110],
    ['Polymaker', 'PolyDryer', 70, 2, 200, 1, 120],
    ['EIBOS', 'Cyclopes', 70, 1, 210, 1, 48],
    ['PrintDry', 'Pro 3', 80, 2, 220, 0, 100],
    ['Jayo', 'Filament Dryer', 55, 1, 200, 0, 48],
  ];
  const stmt = db.prepare('INSERT OR IGNORE INTO dryer_models (brand, model, max_temp, tray_count, max_spool_diameter, has_humidity_sensor, wattage) VALUES (?, ?, ?, ?, ?, ?, ?)');
  for (const d of dryers) stmt.run(...d);
}

function _mig052_courses() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS courses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      category TEXT DEFAULT 'general',
      difficulty INTEGER DEFAULT 1,
      content TEXT,
      steps TEXT,
      estimated_minutes INTEGER,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS course_progress (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
      user_id INTEGER,
      status TEXT DEFAULT 'not_started',
      current_step INTEGER DEFAULT 0,
      completed_at TEXT,
      started_at TEXT DEFAULT (datetime('now')),
      UNIQUE(course_id, user_id)
    );
  `);
  // Seed intro courses
  const courses = [
    ['Getting Started with Bambu Dashboard', 'Learn the basics of your dashboard', 'general', 1, null, '["Navigate the dashboard","Add your first printer","Check printer status","View print history"]', 10],
    ['Filament Management 101', 'How to track and manage your filaments', 'filament', 1, null, '["Add a vendor","Create filament profiles","Add spools to inventory","Track usage"]', 15],
    ['Print Queue Basics', 'Learn to use the print queue system', 'printing', 2, null, '["Create a queue","Add items to queue","Start printing","Monitor progress"]', 10],
    ['Advanced Cost Tracking', 'Master print cost estimation', 'printing', 3, null, '["Configure electricity rates","Set labor costs","Track per-print costs","Generate reports"]', 20],
    ['Maintenance & Hardware', 'Keep your printer running smoothly', 'maintenance', 2, null, '["Set maintenance schedules","Track component wear","Log maintenance events","Hardware database"]', 15],
  ];
  const stmt = db.prepare('INSERT INTO courses (title, description, category, difficulty, content, steps, estimated_minutes) VALUES (?, ?, ?, ?, ?, ?, ?)');
  for (const c of courses) stmt.run(...c);
}

function _mig053_ecom_license() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS ecom_license (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      license_key TEXT,
      geektech_email TEXT,
      geektech_api_url TEXT DEFAULT 'https://geektech.no/api/v1',
      instance_id TEXT NOT NULL,
      status TEXT DEFAULT 'inactive',
      holder_name TEXT,
      plan TEXT,
      features TEXT DEFAULT '[]',
      expires_at TEXT,
      last_validated TEXT,
      cached_response TEXT,
      last_report_at TEXT
    );

    CREATE TABLE IF NOT EXISTS ecom_fees (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER REFERENCES ecommerce_orders(id),
      ecom_config_id INTEGER REFERENCES ecommerce_configs(id),
      order_total REAL NOT NULL,
      fee_pct REAL DEFAULT 5.0,
      fee_amount REAL NOT NULL,
      currency TEXT DEFAULT 'NOK',
      reported INTEGER DEFAULT 0,
      reported_at TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_ecom_fees_reported ON ecom_fees(reported);
  `);

  // Initialize singleton with a generated instance_id
  const uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0;
    return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
  });
  db.prepare('INSERT OR IGNORE INTO ecom_license (id, instance_id) VALUES (1, ?)').run(uuid);
}

function _mig054_learning_center_v2() {
  // Add completed_steps column for tracking individual step completion
  try { db.exec('ALTER TABLE course_progress ADD COLUMN completed_steps TEXT DEFAULT \'[]\''); } catch { /* column may exist */ }

  // Re-seed with rich course data (object steps with title, description, action)
  db.exec('DELETE FROM course_progress');
  db.exec('DELETE FROM courses');

  const courses = [
    {
      title: 'Getting Started with Bambu Dashboard',
      description: 'Learn the basics of navigating and using your dashboard.',
      category: 'getting_started', difficulty: 1, estimated_minutes: 10,
      steps: [
        { title: 'Navigate the dashboard', description: 'Open the main dashboard view and explore the live card grid showing printer status, temperatures, camera feed, and AMS slots.', action: null },
        { title: 'Add your first printer', description: 'Go to Settings > Printers and click Add Printer. Enter your Bambu Lab printer IP address, serial number, and access code.', action: '#settings/printers' },
        { title: 'Check printer status', description: 'Return to the dashboard and observe the live status indicators showing connection state, print progress, and temperature readings.', action: null },
        { title: 'View print history', description: 'Open the History panel to see all past print jobs with details like duration, filament usage, and completion status.', action: '#history' },
        { title: 'Explore the sidebar', description: 'Click through each sidebar navigation button to discover all available panels: Controls, Queue, Statistics, Telemetry, and more.', action: null }
      ]
    },
    {
      title: 'Filament Management 101',
      description: 'How to track and manage your filament inventory from vendors to spools.',
      category: 'filament', difficulty: 1, estimated_minutes: 15,
      steps: [
        { title: 'Add a vendor', description: 'Navigate to the Filament panel Manage tab and create your first filament vendor entry with their name and website.', action: '#filament/manage' },
        { title: 'Create filament profiles', description: 'In the Manage tab, add filament profiles under your vendor specifying material type, color, diameter, and temperature settings.', action: '#filament/manage' },
        { title: 'Add spools to inventory', description: 'Switch to the Inventory tab and add a physical spool by selecting a profile, entering the weight, and optionally assigning a location.', action: '#filament' },
        { title: 'Track filament usage', description: 'Start a print and watch the automatic usage tracking deduct weight from your active spool in real time.', action: '#filament' },
        { title: 'Review inventory stats', description: 'Open the Stats tab to see filament consumption breakdown by type, brand, cost summaries, and usage predictions.', action: '#filament/stats' }
      ]
    },
    {
      title: 'Print Queue Basics',
      description: 'Learn to use the print queue system for managing multiple print jobs.',
      category: 'printing', difficulty: 2, estimated_minutes: 10,
      steps: [
        { title: 'Create a queue', description: 'Open the Queue panel and create a new print queue, giving it a name and optionally assigning it to a specific printer.', action: '#queue' },
        { title: 'Add items to queue', description: 'Add print jobs to your queue by specifying the file, quantity, and priority for each item.', action: '#queue' },
        { title: 'Start printing from queue', description: 'Select a queue item and send it to the printer. The queue system will track the job from start to finish.', action: '#queue' },
        { title: 'Monitor print progress', description: 'Watch the real-time progress of your queued print on the dashboard with live updates on percentage, time remaining, and layer count.', action: null }
      ]
    },
    {
      title: 'Advanced Cost Tracking',
      description: 'Master print cost estimation with electricity rates, labor costs, and detailed reports.',
      category: 'printing', difficulty: 3, estimated_minutes: 20,
      steps: [
        { title: 'Configure electricity rates', description: 'Go to Settings > General and enter your electricity cost per kWh so the system can calculate power consumption costs for each print.', action: '#settings/general' },
        { title: 'Set labor costs', description: 'Configure your hourly labor rate to include preparation and post-processing time in cost estimates.', action: '#settings/general' },
        { title: 'Track per-print costs', description: 'View the cost breakdown for any completed print in the History panel, showing filament, electricity, and labor totals.', action: '#history' },
        { title: 'Generate cost reports', description: 'Open the Statistics panel to view aggregated cost summaries, trends over time, and cost-per-material breakdowns.', action: '#stats' },
        { title: 'Use cost estimation', description: 'Before starting a print, use the cost estimator to preview expected costs based on filament weight, print time, and your configured rates.', action: '#stats' }
      ]
    },
    {
      title: 'Maintenance & Hardware',
      description: 'Keep your printer running smoothly with scheduled maintenance and hardware tracking.',
      category: 'maintenance', difficulty: 2, estimated_minutes: 15,
      steps: [
        { title: 'View maintenance status', description: 'Open the Maintenance panel to see the current status of all tracked components including nozzle wear, print hours, and overdue alerts.', action: '#maintenance' },
        { title: 'Set maintenance schedules', description: 'Configure maintenance intervals for components like nozzles, PTFE tubes, and linear rods based on print hours or time.', action: '#maintenance' },
        { title: 'Track component wear', description: 'Monitor the Wear Tracking section to see estimated wear levels for fans, heaters, belts, and rails based on accumulated print time.', action: '#maintenance' },
        { title: 'Log maintenance events', description: 'Record when you clean, replace, lubricate, or inspect a component to keep an accurate maintenance history.', action: '#maintenance' },
        { title: 'Manage hardware inventory', description: 'Add spare parts and hardware items to the Hardware Database, assign them to printers, and track their lifecycle.', action: '#maintenance' }
      ]
    },
    {
      title: 'NFC Tag Management',
      description: 'Set up NFC tags for quick spool identification and automated tracking.',
      category: 'filament', difficulty: 2, estimated_minutes: 12,
      steps: [
        { title: 'Link an NFC tag to a spool', description: 'Open the Filament panel Tools tab, find the NFC Manager section, and scan or manually enter an NFC tag ID to link it to a spool.', action: '#filament/tools' },
        { title: 'Scan a tag to view spool info', description: 'Scan an NFC tag with your phone or reader. The dashboard will display all spool details including remaining weight, material, and color.', action: '#filament/tools' },
        { title: 'Checkout and checkin spools', description: 'Use the checkout system to track who is using which spool. Scan the NFC tag to check a spool out or back in.', action: '#filament/tools' },
        { title: 'View NFC scan history', description: 'Review the timeline of NFC scans to see when and where each spool was last identified.', action: '#filament/tools' }
      ]
    },
    {
      title: 'Drying Management',
      description: 'Track filament drying sessions and maintain optimal material storage conditions.',
      category: 'filament', difficulty: 2, estimated_minutes: 10,
      steps: [
        { title: 'Start a drying session', description: 'Go to the Filament panel Drying tab and start a new drying session by selecting spools, dryer temperature, and duration.', action: '#filament/drying' },
        { title: 'Monitor active sessions', description: 'View all active drying sessions with live countdown timers and temperature targets.', action: '#filament/drying' },
        { title: 'Use drying presets', description: 'Create reusable drying presets for common materials like PLA, PETG, and TPU with recommended temperatures and durations.', action: '#filament/drying' },
        { title: 'Review drying history', description: 'Check the drying history to see all past sessions and ensure your filaments are properly maintained.', action: '#filament/drying' }
      ]
    },
    {
      title: 'Webhooks & Notifications',
      description: 'Set up notifications and webhooks to stay informed about print events.',
      category: 'automation', difficulty: 3, estimated_minutes: 15,
      steps: [
        { title: 'Enable browser notifications', description: 'Go to Settings > General and enable browser notifications to receive alerts for print completion, failures, and warnings.', action: '#settings/general' },
        { title: 'Configure notification triggers', description: 'Open the Notifications settings tab to customize which events trigger alerts: print done, error, filament runout, and more.', action: '#settings/notifications' },
        { title: 'Add a webhook endpoint', description: 'Create a webhook that sends event data to an external URL like Discord, Slack, or your own automation system.', action: '#settings/notifications' },
        { title: 'Test your webhook', description: 'Use the Test button to send a sample payload to your webhook URL and verify it is received correctly.', action: '#settings/notifications' },
        { title: 'Review notification history', description: 'Check the Notification Log to see all sent alerts and webhook delivery statuses.', action: '#settings/notifications' }
      ]
    },
    {
      title: 'Multi-User & API Keys',
      description: 'Set up multiple users with roles, permissions, and API access for integration.',
      category: 'automation', difficulty: 3, estimated_minutes: 15,
      steps: [
        { title: 'Create user accounts', description: 'Go to Settings > System and add new user accounts with usernames, passwords, and assigned roles.', action: '#settings/system' },
        { title: 'Configure roles and permissions', description: 'Define roles that control access levels: which panels users can see and what actions they can perform.', action: '#settings/system' },
        { title: 'Enable authentication', description: 'Enable the authentication system in Settings > System so users must log in to access the dashboard.', action: '#settings/system' },
        { title: 'Generate API keys', description: 'Create API keys for external applications to interact with Bambu Dashboard programmatically via the REST API.', action: '#settings/system' },
        { title: 'Test API access', description: 'Use the generated API key as a Bearer token to make authenticated requests to any API endpoint.', action: '#settings/system' }
      ]
    },
    {
      title: 'E-Commerce Integration',
      description: 'Connect your dashboard to e-commerce platforms for order-driven printing workflows.',
      category: 'automation', difficulty: 3, estimated_minutes: 20,
      steps: [
        { title: 'Activate your license', description: 'Open Settings > System and enter your GeekTech.no license key to activate the e-commerce premium module.', action: '#settings/system' },
        { title: 'Add an e-commerce integration', description: 'Create an e-commerce configuration by selecting your platform (Shopify, WooCommerce, or Custom) and entering webhook credentials.', action: '#settings/system' },
        { title: 'Configure SKU mapping', description: 'Map product SKUs from your store to 3MF/GCODE files so orders automatically queue the correct prints.', action: '#settings/system' },
        { title: 'Receive incoming orders', description: 'Once configured, incoming orders from your store will appear automatically with customer details and item specifications.', action: '#settings/system' },
        { title: 'Track order fulfillment', description: 'Monitor order progress from received to queued to fulfilled, with automatic print queue integration.', action: '#queue' }
      ]
    },
    {
      title: 'Bambu Lab Printer Guide',
      description: 'Understand the full Bambu Lab printer lineup — from the compact A1 mini to the production-grade H2D Pro. Learn which printer suits your needs.',
      category: 'getting_started', difficulty: 1, estimated_minutes: 15,
      steps: [
        { title: 'Entry-level: A1 mini', description: 'The A1 mini (180×180×180mm) is Bambu Lab\'s most affordable printer. Bed-slinger design, MK8 nozzles, Lidar, and AMS Lite compatibility. Perfect for beginners, small prints, and as a secondary printer.', action: '#knowledge' },
        { title: 'All-rounder: A1', description: 'The A1 (256×256×256mm) is a larger bed-slinger with the same reliability as the A1 mini. Open-frame design gives excellent PLA/PETG cooling. Great for general-purpose printing.', action: '#knowledge' },
        { title: 'Enclosed workhorse: P2S', description: 'The P2S replaces the P1S with DynaSense extruder, Lidar, camera, and LAN connectivity. CoreXY enclosed design handles PLA through ABS/ASA. Best value enclosed printer.', action: '#knowledge' },
        { title: 'Premium CoreXY: X1C', description: 'The X1-Carbon is the flagship CoreXY with Lidar, camera, enclosure, hardened nozzle, and full AMS support. Handles all materials from PLA to PA-CF. The all-in-one solution.', action: '#knowledge' },
        { title: 'Industrial: X1E', description: 'The X1E adds active chamber heating (60°C), HEPA filtration, and higher temperature capabilities for engineering materials like PC, PPS-CF, and PPA-CF.', action: '#knowledge' },
        { title: 'Next-gen H2 series', description: 'The H2S, H2D, and H2C represent Bambu Lab\'s latest generation: 600-1000mm/s speeds, Vortek nozzle system, active heated chambers, and AMS 2 Pro support. The H2C adds induction-heated nozzles for ultra-fast multi-material changes.', action: '#knowledge' }
      ]
    },
    {
      title: 'AMS & Filament Systems',
      description: 'Master the Automatic Material System (AMS) in all its variants — from AMS Lite to AMS 2 Pro and AMS HT for high-temperature materials.',
      category: 'getting_started', difficulty: 2, estimated_minutes: 12,
      steps: [
        { title: 'AMS Lite basics', description: 'The AMS Lite works with A1 and A1 mini printers. It holds 4 spools in an open tray design. Simpler than the full AMS but supports the same multi-color features in Bambu Studio.', action: '#knowledge' },
        { title: 'AMS (standard) setup', description: 'The standard AMS is a sealed unit with RFID spool recognition, humidity monitoring, and 4 spool slots. Compatible with X1C, P1S, and P2S. Up to 4 units (16 colors) per printer.', action: '#knowledge' },
        { title: 'AMS 2 Pro features', description: 'The AMS 2 Pro adds airtight drying up to 65°C, improved feeding mechanism, and better filament path management. Designed for the H2 series but backwards compatible. Best for moisture-sensitive materials like PETG and TPU.', action: '#knowledge' },
        { title: 'AMS HT for engineering', description: 'The AMS HT (High Temperature) dries filament up to 85°C — essential for PA, PC, and other hygroscopic engineering materials. Pair with X1E, H2D Pro, or H2S for engineering workflows.', action: '#knowledge' },
        { title: 'Multi-color printing tips', description: 'Design with color changes at layer boundaries when possible. Minimize purge waste by grouping similar colors. Set purge volumes per material pair in Bambu Studio. Use the Flush into Infill option to reduce waste further.', action: null }
      ]
    },
    {
      title: 'Nozzle & Build Plate Guide',
      description: 'Choose the right nozzle type and build plate for your material. Covers brass, hardened steel, stainless steel nozzles and all Bambu Lab build surfaces.',
      category: 'maintenance', difficulty: 2, estimated_minutes: 15,
      steps: [
        { title: 'Brass nozzle (standard)', description: 'The default nozzle for PLA, PETG, ABS, ASA, and TPU. Best thermal conductivity = best print quality for standard materials. Replace every 500-1000 hours or when quality degrades. Costs $2-5 per nozzle.', action: '#knowledge' },
        { title: 'Hardened steel nozzle', description: 'Required for carbon fiber (CF), glass fiber (GF), and other abrasive filaments. Slightly lower thermal conductivity than brass — may need 5-10°C higher temps. Lasts 5-10x longer than brass with abrasives. Available in 0.4mm, 0.6mm, and 0.8mm.', action: '#knowledge' },
        { title: 'Stainless steel nozzle', description: 'Food-safe and chemical-resistant. Used for food contact applications or when chemical resistance is needed. Thermal conductivity between brass and hardened steel.', action: '#knowledge' },
        { title: 'Vortek nozzle system (H2 series)', description: 'The H2 series uses the quick-change Vortek nozzle system — swap nozzles in seconds without tools or recalibration. The H2C adds induction heating for near-instant temperature changes during multi-material printing.', action: '#knowledge' },
        { title: 'Build plates explained', description: 'Cool Plate (smooth PEI): best for PLA. Engineering Plate (textured PEI): best for PETG, ABS, ASA. High Temp Plate: required for PA-CF, PC, and engineering materials with Bambu liquid glue. Never print PETG directly on smooth PEI — it bonds permanently.', action: '#knowledge' }
      ]
    },
    {
      title: 'Filament Materials Guide',
      description: 'Learn the characteristics, requirements, and best practices for every common 3D printing material — from easy PLA to demanding PA-CF.',
      category: 'filament', difficulty: 2, estimated_minutes: 20,
      steps: [
        { title: 'PLA — the easy standard', description: 'PLA is the easiest material to print: 200-220°C nozzle, 55-60°C bed, 100% fan. No enclosure needed. Great for decorative prints, prototypes, and gifts. Variants: Basic, Matte, Silk, Tough+, Wood, Marble, Galaxy, Glow. Not suitable for heat (softens at 60°C) or outdoor UV exposure.', action: '#knowledge' },
        { title: 'PETG — tough & practical', description: 'PETG offers better toughness and heat resistance than PLA: 230-240°C nozzle, 75-85°C bed, 30-40% fan. Mild stringing is normal. Use textured PEI plate (never smooth PEI). Good for functional parts, enclosures, and moderate outdoor use. Variants: Standard, HF (High Flow), CF, Translucent.', action: '#knowledge' },
        { title: 'ABS & ASA — heat resistant', description: 'ABS/ASA require an enclosed printer: 240-250°C nozzle, 100-110°C bed, 0% fan. ABS can be acetone-smoothed. ASA adds UV resistance for outdoor use. Produce fumes — use carbon filter. Common for automotive, electronics housings, and functional parts. ABS shrinks 0.5-0.7%.', action: '#knowledge' },
        { title: 'TPU — flexible material', description: 'TPU is flexible and rubber-like. Print SLOWLY (30-80mm/s), with NO retraction, from an external spool holder (NOT through AMS). 220-230°C nozzle, 45-55°C bed. 95A is medium-flex (shoe sole), 90A is softer, 85A is very flexible. Great for phone cases, gaskets, bumpers.', action: '#knowledge' },
        { title: 'Engineering: PA-CF, PC, PPA-CF', description: 'Engineering materials require: hardened steel nozzle, bone-dry filament, enclosed heated chamber, High Temp Plate. PA-CF: strongest common material (280°C, dry 80°C/8h). PC: transparent and tough (270°C). PPA-CF: high heat resistance for under-hood automotive. These materials reward preparation and patience.', action: '#knowledge' },
        { title: 'Support materials', description: 'PVA: water-soluble, dissolves in warm water — perfect for complex PLA supports. Support for PLA/PETG: easy-break support material. Support for ABS: pairs with ABS at matching temps. Support for PA/PET: engineered for nylon and PETG support interfaces. Always use support materials on dual-material printers for best results.', action: '#knowledge' }
      ]
    },
    {
      title: 'H2 Series Setup & Tips',
      description: 'Get the most from your Bambu Lab H2 series printer — covering the H2S, H2D, H2D Pro, and H2C with their unique features.',
      category: 'getting_started', difficulty: 2, estimated_minutes: 15,
      steps: [
        { title: 'Vortek nozzle system', description: 'The H2 series uses the Vortek quick-change nozzle system. Nozzles swap in seconds without tools — just twist and pull. No recalibration needed after a nozzle change. Keep a set of 0.4mm, 0.6mm, and 0.8mm nozzles ready.', action: '#knowledge' },
        { title: 'Active chamber heating', description: 'Unlike the X1C/P1S passive enclosure, H2 printers actively heat the chamber to 55-65°C. This dramatically reduces warping for ABS, ASA, PA, and PC. The chamber reaches target temperature in minutes, not the 15+ minutes of passive preheating.', action: '#knowledge' },
        { title: 'Speed capabilities', description: 'H2 printers reach 500-1000mm/s depending on the model. Actual speeds depend on part geometry — small parts with many direction changes are acceleration-limited. Long straight walls see the highest speeds. The advanced vibration compensation handles ringing at extreme velocities.', action: '#knowledge' },
        { title: 'H2C induction heating', description: 'The H2C features induction-heated nozzles — the nozzle heats up in seconds rather than minutes. This enables ultra-fast color and material changes with minimal purge waste. Combined with AMS 2 Pro, the H2C is the fastest multi-material printer available.', action: '#knowledge' },
        { title: 'AMS 2 Pro & AMS HT pairing', description: 'H2 printers are designed for the AMS 2 Pro (airtight drying to 65°C) and AMS HT (drying to 85°C). The improved feeding mechanism reduces filament jams during high-speed printing. Up to 4 units for 16 colors.', action: '#knowledge' },
        { title: 'H2D Pro for production', description: 'The H2D Pro adds extended build volume, dual touchscreens, and production-oriented features. Ideal for print farms and professional workshops where reliability and throughput matter most.', action: '#knowledge' }
      ]
    },
    {
      title: 'Upgrading from P1S to P2S',
      description: 'Moving from the P1S to the P2S? Learn what changed, what improved, and how to migrate your workflow.',
      category: 'getting_started', difficulty: 1, estimated_minutes: 10,
      steps: [
        { title: 'What changed', description: 'The P2S replaces the P1S with key upgrades: DynaSense extruder (better flow consistency), Lidar (automatic first-layer calibration like X1C), integrated camera (remote monitoring), and LAN connectivity (faster file transfers). Same CoreXY design and build volume.', action: '#knowledge' },
        { title: 'Lidar advantage', description: 'The biggest upgrade: Lidar eliminates manual Z-offset calibration. No more babysitting the first layer or running Z-offset tests after plate changes. The P2S auto-calibrates like the X1C — just hit print.', action: null },
        { title: 'Camera monitoring', description: 'The P2S now has a built-in camera for remote monitoring via Bambu Handy and the dashboard. Watch first layers, catch failures early, and create timelapses — features the P1S lacked without aftermarket cameras.', action: null },
        { title: 'LAN connectivity', description: 'Wired ethernet on the P2S means faster, more reliable file transfers than Wi-Fi. For large 3MF files (50MB+), LAN transfer is significantly faster. Also more stable for continuous dashboard monitoring.', action: '#settings/printers' },
        { title: 'Profile compatibility', description: 'Your existing Bambu Studio profiles for the P1S work on the P2S with minimal changes. The DynaSense extruder may allow slightly higher speeds and better retraction. Start with P1S profiles and fine-tune from there.', action: '#knowledge' }
      ]
    },
    {
      title: 'Print Surface & Adhesion Mastery',
      description: 'Stop fighting bed adhesion. Learn which build plate to use for each material and how to maintain perfect first layers.',
      category: 'printing', difficulty: 2, estimated_minutes: 12,
      steps: [
        { title: 'Cool Plate (Smooth PEI)', description: 'Best for PLA, TPU, and PVA. Smooth surface gives a glossy bottom finish. Clean with IPA every 3-5 prints. If PLA stops sticking: wash with warm soapy water, then IPA. Replace when surface becomes permanently scratched or oxidized.', action: null },
        { title: 'Engineering Plate (Textured PEI)', description: 'Best for PETG, ABS, ASA, and most engineering materials. The texture prevents over-adhesion that damages smooth PEI. Parts release easily when cooled. Clean with IPA. The textured bottom finish hides imperfections.', action: null },
        { title: 'High Temp Plate', description: 'Required for PA-CF, PA6-CF, PC, PPA-CF, and other high-temp materials. Always use with Bambu liquid glue (thin, even layer). The glue acts as both adhesion promoter and release agent. Reapply glue every 2-3 prints.', action: null },
        { title: 'Troubleshooting adhesion', description: 'Not sticking: clean plate, increase bed temp +5°C, slow first layer to 15mm/s, add brim. Sticking too hard: let plate cool completely before removing, lower bed temp, use less squish (increase Z-offset). PETG on smooth PEI: always use glue stick as release agent.', action: null },
        { title: 'First layer calibration', description: 'Lidar printers (X1C, P2S, A1, H2): automatic calibration. Non-Lidar (P1S, P1P): manual Z-offset — run calibration after changing plates, nozzles, or firmware. A perfect first layer is slightly squished, consistent width, no gaps between lines.', action: null }
      ]
    },
    {
      title: 'Choosing the Right Filament',
      description: 'A practical decision guide for selecting the best filament for your project based on requirements like strength, heat resistance, and appearance.',
      category: 'filament', difficulty: 1, estimated_minutes: 10,
      steps: [
        { title: 'Decorative & display pieces', description: 'PLA is the best choice: widest color range, easiest to print, best detail. For special effects: Silk (shiny metallic), Marble (stone texture), Galaxy (sparkle), Wood (woodgrain), Glow (glow-in-dark). Matte PLA hides layer lines better than glossy.', action: '#knowledge' },
        { title: 'Functional indoor parts', description: 'PETG for tough parts that need impact resistance. ABS if heat resistance matters (electronics near heat sources). PLA Tough+ for a PLA-easy, PETG-strong compromise. Consider wall count and infill more than material for most indoor functional parts.', action: '#knowledge' },
        { title: 'Outdoor & UV exposure', description: 'ASA is the top choice: UV stable, weather resistant, acetone-smoothable. PETG works for moderate outdoor use but may become brittle after years of UV. Never use PLA outdoors — it degrades in UV and warps in heat (car dashboards!).', action: '#knowledge' },
        { title: 'Flexible & rubber-like', description: 'TPU 95A: medium flex, most versatile (phone cases, bumpers). TPU 90A: softer, better for gaskets. TPU 85A: very soft, good for squeezable items. All TPU: print slow, no retraction, external spool only.', action: '#knowledge' },
        { title: 'Maximum strength', description: 'PA-CF (carbon fiber nylon): strongest common 3D print material. PA6-CF: even stronger, more demanding to print. PET-CF: strong without moisture sensitivity of nylon. For best strength: 4 walls, 40%+ infill, Gyroid pattern, align longest dimension with print bed.', action: '#knowledge' }
      ]
    }
  ];

  const stmt = db.prepare('INSERT INTO courses (title, description, category, difficulty, content, steps, estimated_minutes) VALUES (?, ?, ?, ?, ?, ?, ?)');
  for (const c of courses) {
    stmt.run(c.title, c.description, c.category, c.difficulty, null, JSON.stringify(c.steps), c.estimated_minutes);
  }
}

function _mig055_knowledge_base() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS kb_printers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      model TEXT UNIQUE NOT NULL,
      full_name TEXT NOT NULL,
      image_url TEXT,
      release_year INTEGER,
      build_volume TEXT,
      max_speed INTEGER,
      nozzle_type TEXT DEFAULT 'proprietary',
      nozzle_diameter_default REAL DEFAULT 0.4,
      supported_nozzle_sizes TEXT DEFAULT '[0.2,0.4,0.6,0.8]',
      has_ams INTEGER DEFAULT 0,
      has_enclosure INTEGER DEFAULT 0,
      has_lidar INTEGER DEFAULT 0,
      has_camera INTEGER DEFAULT 0,
      has_aux_fan INTEGER DEFAULT 0,
      heated_bed_max INTEGER,
      nozzle_temp_max INTEGER,
      supported_filaments TEXT DEFAULT '[]',
      connectivity TEXT DEFAULT '["wifi"]',
      weight_kg REAL,
      price_usd REAL,
      pros TEXT DEFAULT '[]',
      cons TEXT DEFAULT '[]',
      tips TEXT,
      specs_json TEXT DEFAULT '{}',
      wiki_url TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS kb_accessories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      category TEXT NOT NULL DEFAULT 'other',
      brand TEXT DEFAULT 'Bambu Lab',
      model TEXT,
      image_url TEXT,
      compatible_printers TEXT DEFAULT '[]',
      description TEXT,
      price_usd REAL,
      purchase_url TEXT,
      tips TEXT,
      specs_json TEXT DEFAULT '{}',
      rating INTEGER,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS kb_filaments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      material TEXT NOT NULL,
      brand TEXT,
      variant TEXT,
      category TEXT DEFAULT 'standard',
      difficulty INTEGER DEFAULT 1,
      nozzle_temp_min INTEGER,
      nozzle_temp_max INTEGER,
      bed_temp_min INTEGER,
      bed_temp_max INTEGER,
      chamber_temp INTEGER,
      fan_speed_min INTEGER,
      fan_speed_max INTEGER,
      enclosure_required INTEGER DEFAULT 0,
      nozzle_recommendation TEXT DEFAULT 'brass',
      abrasive INTEGER DEFAULT 0,
      moisture_sensitivity INTEGER DEFAULT 3,
      strength INTEGER DEFAULT 3,
      flexibility INTEGER DEFAULT 1,
      heat_resistance INTEGER DEFAULT 3,
      layer_adhesion INTEGER DEFAULT 3,
      food_safe INTEGER DEFAULT 0,
      uv_resistant INTEGER DEFAULT 0,
      tips_print TEXT,
      tips_storage TEXT,
      tips_post TEXT,
      compatible_printers TEXT DEFAULT '[]',
      profile_json TEXT,
      wiki_url TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS kb_profiles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      printer_model TEXT,
      filament_material TEXT,
      filament_brand TEXT,
      nozzle_size REAL DEFAULT 0.4,
      layer_height REAL,
      print_speed INTEGER,
      infill_pct INTEGER,
      wall_count INTEGER,
      top_layers INTEGER,
      bottom_layers INTEGER,
      retraction_distance REAL,
      retraction_speed INTEGER,
      description TEXT,
      tips TEXT,
      settings_json TEXT DEFAULT '{}',
      source_url TEXT,
      author TEXT,
      difficulty INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS kb_tags (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      entity_type TEXT NOT NULL,
      entity_id INTEGER NOT NULL,
      tag TEXT NOT NULL,
      UNIQUE(entity_type, entity_id, tag)
    );
    CREATE INDEX IF NOT EXISTS idx_kb_tags_entity ON kb_tags(entity_type, entity_id);
    CREATE INDEX IF NOT EXISTS idx_kb_tags_tag ON kb_tags(tag);
  `);

  // Seed printers
  const ip = db.prepare('INSERT OR IGNORE INTO kb_printers (model, full_name, release_year, build_volume, max_speed, nozzle_type, has_ams, has_enclosure, has_lidar, has_camera, has_aux_fan, heated_bed_max, nozzle_temp_max, supported_filaments, connectivity, weight_kg, price_usd, pros, cons, tips, specs_json, wiki_url) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)');
  const printers = [
    ['X1C','Bambu Lab X1-Carbon',2022,'256x256x256',500,'proprietary',1,1,1,1,1,120,300,
      '["PLA","PETG","ABS","ASA","TPU","PA","PA-CF","PC","PVA","PAHT-CF","PPS-CF","Support W"]',
      '["wifi","lan"]',14.13,1449,
      '["Fastest CoreXY in its class — 500mm/s with 20000mm/s² acceleration","Full metal enclosure keeps chamber warm for ABS, ASA, PA and PC","Micro Lidar scans first layer and detects spaghetti failures automatically","7\" touchscreen with built-in camera for remote monitoring","AMS support for up to 16 colors with 4 AMS units","Hardened steel nozzle included — ready for carbon fiber filaments out of the box","Automatic vibration compensation and flow calibration","Active carbon filter reduces fumes from ABS/ASA"]',
      '["Premium price point — significantly more expensive than P1S","Proprietary nozzle quick-swap system limits third-party options","Can be loud at full speed (up to 55 dB) — consider dampening feet","Overkill for users who only print PLA","Firmware updates occasionally require recalibration"]',
      'The X1C is Bambu Lab\'s flagship CoreXY printer and the best all-round option for advanced users. It excels at high-speed printing across a wide range of materials thanks to its fully enclosed chamber, active carbon filter, and Micro Lidar first-layer inspection.\n\nKey tips:\n- Always run full calibration after firmware updates (vibration comp + flow dynamics + motor noise cancellation)\n- Use hardened steel nozzle for any carbon fiber or glass fiber filament — brass will wear out in hours\n- For ABS/ASA: preheat the chamber for 10-15 minutes before starting. Close the top lid and front door\n- The Lidar can detect first-layer issues and spaghetti — enable \"Auto-recovery\" in Bambu Studio\n- Keep the Lidar lens clean with a soft cloth. Dust buildup degrades scan accuracy\n- LAN mode bypasses cloud for faster file transfers and more privacy. Connect via Ethernet for best speed\n- The AMS works best with Bambu-branded filaments. Third-party spools may need the spool holder adapter\n- For multi-color prints, prime tower placement matters — put it where it won\'t interfere with the model\n- Enable \"Timelapse\" in Bambu Studio for cool print videos — uses the toolhead camera\n- Noise reduction: use Luban or Bambu Studio to set max speed limits for nighttime printing',
      JSON.stringify({dimensions:"389×389×457 mm",motion_system:"CoreXY",extruder:"Direct drive, dual gear",filament_diameter:"1.75 mm",layer_height_range:"0.08–0.28 mm (0.4mm nozzle)",nozzle_sizes_available:"0.2, 0.4, 0.6, 0.8 mm",max_acceleration:"20000 mm/s²",power_consumption:"350W typical, 1000W peak",voltage:"100-240V AC",noise_level:"45-55 dB",display:"7-inch touchscreen",build_plate_type:"Magnetic spring steel (multiple options)",bed_leveling:"Automatic (Micro Lidar + force sensor)",resume_after_power_loss:true,air_filtration:"Activated carbon filter",frame_material:"Die-cast aluminum",motion_controller:"Custom 32-bit ARM",firmware:"Bambu OS (OTA updates)",slicer:"Bambu Studio (free), OrcaSlicer compatible",file_transfer:"WiFi, LAN, SD card, Bambu Cloud",max_print_temp_hotend:300,max_print_temp_bed:120}),
      'https://wiki.bambulab.com/en/x1-carbon'],

    ['X1C Combo','Bambu Lab X1-Carbon Combo',2022,'256x256x256',500,'proprietary',1,1,1,1,1,120,300,
      '["PLA","PETG","ABS","ASA","TPU","PA","PA-CF","PC","PVA","PAHT-CF","PPS-CF","Support W"]',
      '["wifi","lan"]',14.13,1599,
      '["Everything the X1C offers plus AMS included — saves $200 vs buying separately","Ready for multi-color and multi-material printing out of the box","AMS humidity control keeps filament dry during storage","Automatic filament switching enables complex multi-material prints","Best value for users who know they want multi-color capability"]',
      '["Same limitations as the standalone X1C","AMS adds complexity — more potential failure points with filament path","AMS not ideal for flexible filaments (TPU) — use external spool holder instead","AMS uses PTFE tubes that need occasional replacement"]',
      'The X1C Combo bundles the flagship X1-Carbon printer with the AMS (Automatic Material System). If you plan to do any multi-color or multi-material printing, the combo saves significant money over buying them separately.\n\nKey tips:\n- The AMS adds 4-spool automatic switching. You can daisy-chain up to 4 AMS units for 16 colors\n- Keep the AMS desiccant fresh — replace every 2-3 months or when the humidity indicator turns pink\n- For PETG in the AMS: increase retraction slightly (0.5-1mm more) to reduce stringing during filament changes\n- TPU does NOT work well in the AMS — feed it directly via the spool holder bypass\n- PVA support material works great with the AMS for complex support structures that dissolve in water\n- The AMS PTFE tubes should be inspected every 500-1000h for wear, especially with abrasive filaments\n- Calibrate filament flow for each new spool — even same brand can vary between batches\n- Store extra AMS desiccant packs in a sealed jar to keep them fresh\n- The AMS buffer helps with retraction — make sure it\'s properly installed and the filament path is smooth',
      JSON.stringify({dimensions:"389×389×457 mm (printer) + 221×332×236 mm (AMS)",motion_system:"CoreXY",extruder:"Direct drive, dual gear",filament_diameter:"1.75 mm",layer_height_range:"0.08–0.28 mm",nozzle_sizes_available:"0.2, 0.4, 0.6, 0.8 mm",max_acceleration:"20000 mm/s²",power_consumption:"350W typical, 1000W peak",voltage:"100-240V AC",noise_level:"45-55 dB",display:"7-inch touchscreen",build_plate_type:"Magnetic spring steel",bed_leveling:"Automatic (Micro Lidar + force sensor)",air_filtration:"Activated carbon filter",ams_spool_capacity:4,ams_max_daisy_chain:4,ams_humidity_control:true,ams_filament_types:"PLA, PETG, ABS, ASA, PVA, PA, PC (not TPU)",frame_material:"Die-cast aluminum",firmware:"Bambu OS (OTA updates)",slicer:"Bambu Studio, OrcaSlicer"}),
      'https://wiki.bambulab.com/en/x1-carbon'],

    ['X1E','Bambu Lab X1E',2024,'256x256x256',500,'proprietary',1,1,1,1,1,120,320,
      '["PLA","PETG","ABS","ASA","PA","PA-CF","PA6-CF","PC","PAHT-CF","PPS-CF","PPA-CF","PPA-GF","Support W"]',
      '["wifi","lan","ethernet"]',16.0,1999,
      '["Industrial-grade fully sealed enclosure with active chamber heating up to 60°C","Highest nozzle temperature (320°C) — supports PAHT-CF, PPS-CF, PPA-CF and other advanced polymers","HEPA + activated carbon air filtration for safe indoor use with engineering materials","Ethernet connectivity for stable, fast file transfers in workshop environments","Hardened steel nozzle standard — ready for all abrasive materials","Enhanced build plate adhesion system for high-temp materials","Best Bambu printer for professional/industrial prototyping"]',
      '["Most expensive Bambu Lab printer at $1999","Active chamber heating adds power consumption","Overkill and overpriced if you only print PLA, PETG, or ABS","Heavier and larger footprint than X1C","Some engineering filaments require extensive drying and careful handling"]',
      'The X1E is Bambu Lab\'s engineering-focused printer designed for high-performance materials that require active chamber heating. It\'s the only Bambu printer that can reliably print PAHT-CF, PPS-CF, and other advanced polymers that need 50-60°C chamber temperatures.\n\nKey tips:\n- Active chamber heating is the key differentiator — preheat chamber for 15-20 minutes for PA6-CF and PAHT-CF\n- ALWAYS use the HEPA filtration when printing PA, PC, ABS, or any engineering material — these release harmful VOCs\n- For PAHT-CF: dry filament at 90°C for 12h minimum. Use inline dryer if possible. This material is extremely moisture-sensitive\n- The sealed enclosure means you CANNOT open the door mid-print for high-temp materials without causing warping\n- Use Bambu\'s High Temp Plate with liquid adhesive for PA6-CF and PAHT-CF\n- Ethernet is recommended over WiFi for large file transfers — engineering prints can have huge G-code files\n- The X1E runs hotter overall — ensure good ventilation around the printer, especially at the back\n- For PPS-CF: this material needs 320°C nozzle temp — only the X1E supports this\n- Consider the X1E if you need to print functional prototypes for automotive, aerospace, or industrial applications\n- The annual filter replacement cost should be factored into TCO — HEPA filters are consumables',
      JSON.stringify({dimensions:"389×389×495 mm",motion_system:"CoreXY",extruder:"Direct drive, dual gear, all-metal",filament_diameter:"1.75 mm",layer_height_range:"0.08–0.28 mm",nozzle_sizes_available:"0.2, 0.4, 0.6, 0.8 mm",max_acceleration:"20000 mm/s²",max_chamber_temp:"60°C (active heating)",power_consumption:"450W typical, 1200W peak",voltage:"100-240V AC",noise_level:"48-58 dB",display:"7-inch touchscreen",build_plate_type:"Magnetic spring steel (High Temp Plate recommended)",bed_leveling:"Automatic (Micro Lidar + force sensor)",air_filtration:"HEPA + Activated carbon dual filter",frame_material:"Die-cast aluminum, reinforced",firmware:"Bambu OS (OTA updates)",slicer:"Bambu Studio, OrcaSlicer",file_transfer:"WiFi, LAN, Ethernet, SD card, Bambu Cloud",sealed_enclosure:true,active_chamber_heating:true}),
      'https://wiki.bambulab.com/en/x1e'],

    ['P1S','Bambu Lab P1S',2023,'256x256x256',500,'proprietary',1,1,0,0,1,120,300,
      '["PLA","PETG","ABS","ASA","TPU","PA","PA-CF","PC","PVA","Support W"]',
      '["wifi"]',9.65,699,
      '["Best price-to-performance ratio in the Bambu lineup","Full enclosure enables ABS, ASA, PA, and PC printing","500mm/s max speed with CoreXY — same as X1C","AMS compatible for multi-color and multi-material printing","Auxiliary part cooling fan for better overhangs","Lighter and more compact than X1C","Excellent print quality rivaling the X1C for most materials"]',
      '["No Micro Lidar — uses strain gauge for bed leveling which is slightly less accurate","No built-in camera — cannot monitor prints remotely without aftermarket solution","WiFi only — no LAN/Ethernet for faster local transfers","No activated carbon filter — ABS/ASA fumes vent into the room","Touchscreen is smaller and less responsive than X1C"]',
      'The P1S is Bambu Lab\'s best mid-range printer and offers incredible value. It shares the same CoreXY motion system and print speed as the X1C but at roughly half the price, making it the smart choice for users who don\'t need Lidar or a built-in camera.\n\nKey tips:\n- The P1S lacks Lidar, so first-layer calibration relies on the strain gauge. Run Z-offset calibration with each new plate\n- Add an aftermarket camera (USB webcam via OctoPrint, or Bambu\'s upcoming camera kit) for remote monitoring\n- The enclosure works for ABS/ASA but lacks active carbon filtration — consider adding an aftermarket HEPA/carbon filter or printing near a window\n- For best results, preheat the chamber for 10 minutes before printing ABS or ASA\n- The P1S is essentially a \"headless X1C\" — same speeds, same quality, just fewer smart features\n- WiFi file transfer works well for files under 100MB. For larger files, use an SD card\n- The AMS works identically on P1S as on X1C — all multi-color features are available\n- Consider upgrading to hardened steel nozzle if you plan to print any carbon fiber or glass fiber filaments\n- The part cooling fan is powerful — great for PLA overhangs and bridging\n- Firmware updates are delivered OTA — keep WiFi connected for latest features',
      JSON.stringify({dimensions:"386×389×367 mm",motion_system:"CoreXY",extruder:"Direct drive, dual gear",filament_diameter:"1.75 mm",layer_height_range:"0.08–0.28 mm",nozzle_sizes_available:"0.2, 0.4, 0.6, 0.8 mm",max_acceleration:"20000 mm/s²",power_consumption:"350W typical",voltage:"100-240V AC",noise_level:"45-55 dB",display:"2.7-inch LCD",build_plate_type:"Magnetic spring steel",bed_leveling:"Automatic (strain gauge)",air_filtration:"None (aftermarket recommended)",frame_material:"Aluminum alloy",firmware:"Bambu OS (OTA updates)",slicer:"Bambu Studio, OrcaSlicer",file_transfer:"WiFi, SD card, Bambu Cloud"}),
      'https://wiki.bambulab.com/en/p1s'],

    ['P1S Combo','Bambu Lab P1S Combo',2023,'256x256x256',500,'proprietary',1,1,0,0,1,120,300,
      '["PLA","PETG","ABS","ASA","TPU","PA","PA-CF","PC","PVA","Support W"]',
      '["wifi"]',9.65,949,
      '["Everything the P1S offers plus AMS included at a $100 discount vs buying separately","Ready for multi-color printing out of the box","Best value combo in the Bambu lineup","AMS humidity control protects filament between prints","Same print quality and speed as standalone P1S"]',
      '["Same limitations as standalone P1S — no Lidar, no camera, no LAN","AMS adds maintenance requirements (desiccant, PTFE tubes)","Additional desk space needed for the AMS unit"]',
      'The P1S Combo is the best value proposition in Bambu Lab\'s lineup if you want multi-color capability. You get the same great P1S printer bundled with the AMS at a significant discount.\n\nKey tips:\n- All P1S tips apply — see the P1S entry for printer-specific advice\n- The AMS adds 4-spool automatic switching. Upgrade to 4 AMS units (via Hub) for 16 colors\n- Replace AMS desiccant packs every 2-3 months — the humidity indicator should stay blue/orange\n- For best multi-color results: use same material type across all spools (e.g., all PLA, not PLA + PETG)\n- The prime tower uses material — factor in 5-15% extra filament usage for multi-color prints\n- Clean the AMS filament cutter regularly — accumulated debris can cause feeding issues\n- If a spool gets tangled in the AMS, don\'t force it — remove and re-feed manually',
      JSON.stringify({dimensions:"386×389×367 mm (printer) + 221×332×236 mm (AMS)",motion_system:"CoreXY",extruder:"Direct drive, dual gear",filament_diameter:"1.75 mm",layer_height_range:"0.08–0.28 mm",nozzle_sizes_available:"0.2, 0.4, 0.6, 0.8 mm",max_acceleration:"20000 mm/s²",power_consumption:"350W typical",voltage:"100-240V AC",noise_level:"45-55 dB",display:"2.7-inch LCD",build_plate_type:"Magnetic spring steel",bed_leveling:"Automatic (strain gauge)",ams_spool_capacity:4,ams_max_daisy_chain:4,ams_humidity_control:true,frame_material:"Aluminum alloy",firmware:"Bambu OS (OTA updates)",slicer:"Bambu Studio, OrcaSlicer"}),
      'https://wiki.bambulab.com/en/p1s'],

    ['P1P','Bambu Lab P1P',2023,'256x256x256',500,'proprietary',1,0,0,0,0,120,300,
      '["PLA","PETG","TPU","PVA","Support W"]',
      '["wifi"]',9.15,599,
      '["Most affordable CoreXY Bambu printer","Same motion system and speed as X1C and P1S","Open frame design provides excellent cooling for PLA","Easy access for maintenance and modifications","AMS compatible for multi-color PLA/PETG","Lightest full-size Bambu printer at 9.15 kg","Great upgrade path — can add enclosure and other mods later"]',
      '["No enclosure — cannot reliably print ABS, ASA, PA, or PC","No camera — no remote monitoring without aftermarket solution","No auxiliary part cooling fan — overhangs may not be as clean as P1S","No activated carbon filter","Open frame collects dust on the rods and belts","Limited to materials that don\'t need a heated chamber"]',
      'The P1P is Bambu Lab\'s entry-level CoreXY printer. It delivers the same high-speed printing as the X1C and P1S in an open-frame design. Perfect for users who primarily print PLA and PETG and want the best bang for their buck.\n\nKey tips:\n- The open frame is actually an advantage for PLA — better cooling means better overhangs and bridging\n- Consider adding a third-party enclosure (many on Printables) if you want to print ABS or ASA later\n- Without an enclosure, avoid drafty rooms — even PLA can warp with cold drafts on large parts\n- The lack of an aux fan means bridging can be trickier — orient parts to minimize long bridges\n- Keep the linear rods and belts clean — the open design means dust accumulates faster\n- Add silicone bed clips to keep the magnetic plate more secure during fast movements\n- WiFi is the only connectivity option — use SD card for large files if WiFi is slow\n- The AMS works great with the P1P for multi-color PLA projects\n- Consider upgrading to the P1S if you find yourself wanting ABS/ASA capability',
      JSON.stringify({dimensions:"386×389×345 mm",motion_system:"CoreXY",extruder:"Direct drive, dual gear",filament_diameter:"1.75 mm",layer_height_range:"0.08–0.28 mm",nozzle_sizes_available:"0.2, 0.4, 0.6, 0.8 mm",max_acceleration:"20000 mm/s²",power_consumption:"350W typical",voltage:"100-240V AC",noise_level:"45-55 dB",display:"2.7-inch LCD",build_plate_type:"Magnetic spring steel",bed_leveling:"Automatic (strain gauge)",air_filtration:"None (open frame)",frame_material:"Aluminum alloy",firmware:"Bambu OS (OTA updates)",slicer:"Bambu Studio, OrcaSlicer",file_transfer:"WiFi, SD card, Bambu Cloud",open_frame:true}),
      'https://wiki.bambulab.com/en/p1p'],

    ['A1','Bambu Lab A1',2023,'256x256x256',500,'mk8_style',1,0,1,1,0,100,300,
      '["PLA","PETG","TPU","PVA","Support W"]',
      '["wifi"]',9.45,399,
      '["Best value Bambu printer with Lidar and camera included","Standard MK8-style nozzle — cheap and widely available third-party replacements","Full-size 256mm build volume at a budget price","Automatic bed leveling with Lidar is more accurate than strain gauge","Built-in camera for remote monitoring and timelapse","AMS Lite compatible for easy 4-color printing","Open bed-slinger design is easy to maintain","Vibration compensation handles the bed-slinger movement well"]',
      '["Bed-slinger (i-style) design — Y-axis moves the bed, which limits speed on tall/heavy parts","No enclosure — cannot print ABS, ASA, PA, or PC reliably","Lower heated bed max (100°C) vs CoreXY models (120°C)","Cannot use standard AMS — requires AMS Lite specifically","More vibration than CoreXY at high speeds due to bed movement","Open design means no fume control"]',
      'The A1 is Bambu Lab\'s full-size bed-slinger printer and the best value option in the lineup. Unlike the P1 series, it uses standard MK8-style nozzles (cheap and plentiful) and includes Lidar + camera which the P1S lacks.\n\nKey tips:\n- The bed-slinger design means the build plate moves on the Y axis. For tall, narrow parts, reduce speed to prevent wobble\n- MK8-style nozzles are a huge advantage — $2-5 for third-party replacements vs $15-20 for proprietary P1/X1 nozzles\n- The Lidar provides better first-layer accuracy than the P1S strain gauge — a real advantage at this price\n- The AMS Lite is smaller and lighter than the full AMS but lacks humidity control — use external dryer for moisture-sensitive filaments\n- For heavy prints (lots of infill), the bed-slinger may cause ringing artifacts at high speed — enable vibration compensation\n- The A1 handles PLA and PETG exceptionally well. For anything that needs an enclosure, look at the P1S or X1C\n- The camera quality is good for monitoring but lower resolution than X1C\n- Consider adding a filament runout sensor if not printing with AMS Lite\n- The A1 is an excellent secondary printer — use it for PLA while your enclosed printer handles engineering materials\n- Great for beginners: Lidar auto-calibration means less manual tuning needed',
      JSON.stringify({dimensions:"403×347×473 mm",motion_system:"Bed-slinger (i-style, Cartesian)",extruder:"Direct drive, single gear",filament_diameter:"1.75 mm",layer_height_range:"0.08–0.28 mm",nozzle_type:"MK8-style (standard, widely available)",nozzle_sizes_available:"0.2, 0.4, 0.6, 0.8 mm",max_acceleration:"10000 mm/s²",power_consumption:"150W typical",voltage:"100-240V AC",noise_level:"43-52 dB",display:"2.4-inch touchscreen",build_plate_type:"Magnetic spring steel",bed_leveling:"Automatic (Micro Lidar)",air_filtration:"None (open frame)",frame_material:"Aluminum alloy",firmware:"Bambu OS (OTA updates)",slicer:"Bambu Studio, OrcaSlicer",file_transfer:"WiFi, SD card, Bambu Cloud",camera:"Built-in 1080p",lidar:"Micro Lidar (first layer + spaghetti detection)"}),
      'https://wiki.bambulab.com/en/a1'],

    ['A1 mini','Bambu Lab A1 mini',2023,'180x180x180',500,'mk8_style',1,0,1,1,0,80,300,
      '["PLA","PETG","TPU","PVA","Support W"]',
      '["wifi"]',5.5,299,
      '["Most affordable Bambu Lab printer — excellent entry point","Compact form factor fits on any desk (only 5.5 kg)","Same Micro Lidar and camera as the full-size A1","Standard MK8-style nozzles — cheap third-party replacements","Surprisingly good print quality for the price","Quick setup — printing within 15 minutes of unboxing","AMS Lite compatible for multi-color prints","Low power consumption — can run from a basic outlet","Great second printer for small parts and quick prototypes"]',
      '["Small build volume (180×180×180mm) limits part size significantly","Lowest heated bed max (80°C) — PETG at the upper limit of capability","No enclosure — PLA and basic PETG only","Bed-slinger design with more vibration at speed due to lightweight frame","Not suitable for ABS, ASA, PA, or any material needing heated chamber","Power supply is external — one more cable to manage"]',
      'The A1 mini is Bambu Lab\'s most affordable printer and an incredible value proposition. Despite its small size, it delivers print quality that rivals much more expensive machines for PLA printing.\n\nKey tips:\n- The 180mm build volume is smaller than you think — measure your parts before committing to this printer\n- The 80°C bed limit means PETG is at the edge of capability — use 70-75°C and textured PEI plate for best results\n- The Micro Lidar makes first-layer setup almost foolproof — great for beginners\n- The compact size makes this ideal as a desk-side printer for quick prints, prototypes, and small parts\n- MK8 nozzles are dirt cheap — buy a variety pack of 0.4mm + 0.6mm for under $10\n- The AMS Lite works great with the mini — 4-color PLA prints are a blast\n- Consider this as a secondary printer even if you have a larger machine — it\'s perfect for small, quick jobs\n- The A1 mini is surprisingly quiet compared to larger printers\n- For PETG: keep parts small and use brim — the lower bed temp means adhesion can be tricky on larger surfaces\n- Excellent gift printer — easy to set up and maintain, minimal frustration for new users\n- The camera is great for timelapse videos of small prints — very satisfying content',
      JSON.stringify({dimensions:"347×315×365 mm",motion_system:"Bed-slinger (i-style, Cartesian)",extruder:"Direct drive, single gear",filament_diameter:"1.75 mm",layer_height_range:"0.08–0.28 mm",nozzle_type:"MK8-style (standard, widely available)",nozzle_sizes_available:"0.2, 0.4, 0.6, 0.8 mm",max_acceleration:"10000 mm/s²",power_consumption:"100W typical",voltage:"100-240V AC (external PSU)",noise_level:"40-48 dB",display:"None (controlled via app/Studio)",build_plate_type:"Magnetic spring steel",bed_leveling:"Automatic (Micro Lidar)",air_filtration:"None (open frame)",frame_material:"Aluminum alloy",firmware:"Bambu OS (OTA updates)",slicer:"Bambu Studio, OrcaSlicer",file_transfer:"WiFi, SD card, Bambu Cloud",camera:"Built-in 1080p",lidar:"Micro Lidar",weight:"5.5 kg"}),
      'https://wiki.bambulab.com/en/a1-mini'],

    ['A1 Combo','Bambu Lab A1 Combo',2023,'256x256x256',500,'mk8_style',1,0,1,1,0,100,300,
      '["PLA","PETG","TPU","PVA","Support W"]',
      '["wifi"]',9.45,559,
      '["Full-size A1 printer bundled with AMS Lite at a discount","Ready for 4-color PLA printing out of the box","Micro Lidar and camera included","Standard MK8 nozzles — cheap replacements","Best value multi-color setup for beginners"]',
      '["Same limitations as standalone A1 — bed-slinger, no enclosure","AMS Lite lacks humidity control — store filament separately","Cannot print ABS/ASA/PA without enclosure"]',
      'The A1 Combo bundles the A1 with the AMS Lite for multi-color printing at a significant discount. If you know you want multi-color PLA capability, the combo saves money over buying separately.\n\nKey tips:\n- All A1 tips apply — see the A1 entry for printer-specific advice\n- The AMS Lite provides 4-spool switching without humidity control\n- Great for multi-color PLA projects. PETG works but benefits from external drying\n- The combo is the easiest way to get started with multi-color 3D printing\n- Consider adding a filament dryer for PETG and TPU use with the AMS Lite',
      JSON.stringify({dimensions:"403×347×473 mm (printer) + 187×288×210 mm (AMS Lite)",motion_system:"Bed-slinger (i-style, Cartesian)",extruder:"Direct drive, single gear",filament_diameter:"1.75 mm",nozzle_type:"MK8-style",max_acceleration:"10000 mm/s²",display:"2.4-inch touchscreen",bed_leveling:"Automatic (Micro Lidar)",ams_type:"AMS Lite",ams_spool_capacity:4,camera:"Built-in 1080p",lidar:"Micro Lidar"}),
      'https://wiki.bambulab.com/en/a1'],

    ['A1 mini Combo','Bambu Lab A1 mini Combo',2023,'180x180x180',500,'mk8_style',1,0,1,1,0,80,300,
      '["PLA","PETG","TPU","PVA","Support W"]',
      '["wifi"]',5.5,459,
      '["Most affordable multi-color setup from Bambu Lab","Compact A1 mini bundled with AMS Lite","Micro Lidar and camera included at budget price","Perfect starter kit for multi-color PLA printing","MK8 nozzles for cheap replacements"]',
      '["Small 180mm build volume","80°C bed temp limits PETG capability","No enclosure — PLA and basic PETG only","AMS Lite has no humidity control"]',
      'The A1 mini Combo is the most affordable way to get into multi-color 3D printing with Bambu Lab. The compact A1 mini paired with the AMS Lite makes 4-color PLA printing accessible to everyone.\n\nKey tips:\n- Perfect for small multi-color prints — ornaments, keychains, logos, figurines\n- The 180mm build volume is limiting but sufficient for most multi-color designs\n- AMS Lite has no humidity control — keep filament sealed when not in use\n- Great gift option — complete multi-color setup at an accessible price point\n- See A1 mini entry for printer-specific tips',
      JSON.stringify({dimensions:"347×315×365 mm (printer) + 187×288×210 mm (AMS Lite)",motion_system:"Bed-slinger (i-style, Cartesian)",extruder:"Direct drive, single gear",nozzle_type:"MK8-style",max_acceleration:"10000 mm/s²",bed_leveling:"Automatic (Micro Lidar)",ams_type:"AMS Lite",ams_spool_capacity:4,camera:"Built-in 1080p",lidar:"Micro Lidar"}),
      'https://wiki.bambulab.com/en/a1-mini'],

    ['P2S','Bambu Lab P2S',2025,'256x256x256',500,'proprietary',1,1,1,1,1,100,300,
      '["PLA","PETG","ABS","ASA","TPU","PA","PA-CF","PC","PVA","Support W"]',
      '["wifi","lan"]',10.0,549,
      '["Successor to P1S — completely reengineered with major upgrades","Now includes Micro Lidar (P1S lacked this) for accurate first-layer calibration","Built-in 1080P camera for remote monitoring and timelapse","DynaSense extruder with better grip and flow consistency","5-inch touchscreen (vs P1S 2.7-inch LCD)","AI-powered error detection (spaghetti, first-layer issues)","Quick-swap nozzle system inherited from X1C","LAN connectivity added (P1S was WiFi only)","More affordable than X1C at $549","Active carbon air filtration included"]',
      '["Replaces P1S — P1S is now discontinued","Bed temp max lowered to 100°C from P1S 120°C — limits some engineering materials","Still positioned below X1C/H2 series in capability","New design means P1S accessories may not be fully compatible"]',
      'The P2S is Bambu Lab\'s completely reengineered mid-range CoreXY printer, replacing the popular P1S. It addresses all of the P1S\'s weaknesses by adding Lidar, camera, LAN, AI error detection, and a much better touchscreen.\n\nKey tips:\n- The DynaSense extruder provides better filament grip — fewer grinding issues with slippery filaments\n- Micro Lidar is a massive upgrade from the P1S strain gauge — much more accurate first-layer calibration\n- The built-in camera enables remote monitoring via Bambu Handy app — no more aftermarket camera needed\n- AI error detection can pause prints automatically when it detects spaghetti or first-layer failures\n- LAN mode provides faster, more private file transfers than WiFi\n- Quick-swap nozzle system makes switching between brass and hardened steel quick and easy\n- Active carbon filter helps with ABS/ASA fumes — a feature previously exclusive to X1C\n- The 5-inch touchscreen is a huge improvement over the tiny P1S LCD\n- Consider the P2S if you were looking at the P1S — it\'s strictly better in every way\n- AMS 2 Pro compatible for advanced multi-material printing',
      JSON.stringify({dimensions:"386×389×370 mm",motion_system:"CoreXY",extruder:"DynaSense direct drive, dual gear",filament_diameter:"1.75 mm",layer_height_range:"0.08–0.28 mm",nozzle_sizes_available:"0.2, 0.4, 0.6, 0.8 mm",max_acceleration:"20000 mm/s²",power_consumption:"350W typical",voltage:"100-240V AC",noise_level:"45-55 dB",display:"5-inch touchscreen",build_plate_type:"Magnetic spring steel",bed_leveling:"Automatic (Micro Lidar + force sensor)",air_filtration:"Activated carbon filter",frame_material:"Aluminum alloy",firmware:"Bambu OS (OTA updates)",slicer:"Bambu Studio, OrcaSlicer",file_transfer:"WiFi, LAN, SD card, Bambu Cloud",camera:"Built-in 1080p",lidar:"Micro Lidar",ai_error_detection:true,nozzle_swap:"Quick-swap system"}),
      'https://wiki.bambulab.com/en/p2s'],

    ['P2S Combo','Bambu Lab P2S Combo',2025,'256x256x256',500,'proprietary',1,1,1,1,1,100,300,
      '["PLA","PETG","ABS","ASA","TPU","PA","PA-CF","PC","PVA","Support W"]',
      '["wifi","lan"]',10.0,799,
      '["P2S bundled with AMS 2 Pro at a significant discount","AMS 2 Pro includes airtight drying up to 65°C — major upgrade over original AMS","Ready for multi-color and multi-material out of the box","All P2S features: Lidar, camera, LAN, AI detection, DynaSense","Best value multi-material CoreXY setup"]',
      '["Same limitations as standalone P2S","AMS 2 Pro is larger than original AMS — more desk space needed","Higher price point than P1S Combo was"]',
      'The P2S Combo pairs the reengineered P2S with the new AMS 2 Pro, which features airtight filament storage with active drying up to 65°C. This is a massive upgrade over the original AMS which only had passive desiccant.\n\nKey tips:\n- The AMS 2 Pro can dry filament at up to 65°C — great for PETG, TPU, and even PA\n- Airtight sealed chambers keep filament dry between prints automatically\n- All P2S tips apply — see the P2S entry for printer-specific advice\n- The AMS 2 Pro supports up to 24 colors when daisy-chained with hub\n- Best value if you want the full Bambu ecosystem without paying X1C/H2 prices',
      JSON.stringify({dimensions:"386×389×370 mm (printer) + AMS 2 Pro",motion_system:"CoreXY",extruder:"DynaSense direct drive",nozzle_sizes_available:"0.2, 0.4, 0.6, 0.8 mm",max_acceleration:"20000 mm/s²",display:"5-inch touchscreen",bed_leveling:"Automatic (Micro Lidar + force sensor)",air_filtration:"Activated carbon filter",ams_type:"AMS 2 Pro",ams_spool_capacity:4,ams_drying_temp:"Up to 65°C",ams_airtight:true,camera:"Built-in 1080p",lidar:"Micro Lidar",ai_error_detection:true}),
      'https://wiki.bambulab.com/en/p2s'],

    ['H2S','Bambu Lab H2S',2025,'340x320x340',1000,'proprietary',1,1,1,1,1,120,300,
      '["PLA","PETG","ABS","ASA","TPU","PA","PA-CF","PA6-CF","PC","PAHT-CF","PVA","Support W"]',
      '["wifi","lan","ethernet"]',18.0,1249,
      '["120% larger build volume than X1C (340×320×340mm) — print much bigger parts","1000mm/s max speed with 20000mm/s² acceleration — fastest Bambu printer","Heated enclosed chamber up to 65°C for engineering materials","Single-nozzle design keeps things simple while maximizing quality","Next-generation CoreXY motion system for speed and precision","Comprehensive sensor suite: Lidar, camera, vibration compensation","Active HEPA + carbon air filtration","Ethernet for ultra-stable connectivity","The successor to X1C for single-material printing"]',
      '["Premium price at $1249","Large footprint — needs significant desk space","Single nozzle only — no dual-nozzle capability (see H2D for that)","Heavy at ~18kg","Overkill for small PLA prints — the A1 is better value for basic work"]',
      'The H2S is Bambu Lab\'s next-generation high-performance single-nozzle CoreXY printer. It replaces the X1C as the flagship single-nozzle machine, offering 120% more build volume and double the max speed.\n\nKey tips:\n- The 340mm build volume opens up entirely new possibilities — print parts that were too big for the X1C\n- 1000mm/s is the advertised max, but real-world printing is typically 300-500mm/s for quality. The high max benefits acceleration for small features\n- Active chamber heating up to 65°C makes this excellent for PA-CF, PA6-CF, and even PAHT-CF\n- HEPA + carbon filtration is essential for the engineering materials this printer targets\n- Ethernet is recommended over WiFi for reliability — engineering prints can run for 20+ hours\n- The larger build volume means larger prime towers for multi-color — factor in material waste\n- Vibration compensation is even more important at 1000mm/s — run calibration after moving the printer\n- AMS 2 compatible for multi-material printing\n- Consider the H2D if you need dual-nozzle capability for dissolvable supports or true multi-material\n- The H2S is positioned as the X1C replacement — if you\'re choosing between them, pick the H2S',
      JSON.stringify({dimensions:"~450×450×500 mm",motion_system:"CoreXY (next-gen)",extruder:"Direct drive, dual gear",filament_diameter:"1.75 mm",layer_height_range:"0.08–0.28 mm",nozzle_sizes_available:"0.2, 0.4, 0.6, 0.8 mm",max_acceleration:"20000 mm/s²",max_chamber_temp:"65°C (active heating)",power_consumption:"500W typical",voltage:"100-240V AC",noise_level:"48-58 dB",display:"7-inch touchscreen",build_plate_type:"Magnetic spring steel",bed_leveling:"Automatic (Micro Lidar + force sensor)",air_filtration:"HEPA + Activated carbon dual filter",frame_material:"Die-cast aluminum",firmware:"Bambu OS (OTA updates)",slicer:"Bambu Studio, OrcaSlicer",file_transfer:"WiFi, LAN, Ethernet, SD card, Bambu Cloud",camera:"Built-in 1080p",lidar:"Micro Lidar",sealed_enclosure:true,active_chamber_heating:true,build_volume_increase:"120% vs X1C"}),
      'https://wiki.bambulab.com/en/h2s'],

    ['H2S AMS Combo','Bambu Lab H2S AMS Combo',2025,'340x320x340',1000,'proprietary',1,1,1,1,1,120,300,
      '["PLA","PETG","ABS","ASA","TPU","PA","PA-CF","PA6-CF","PC","PAHT-CF","PVA","Support W"]',
      '["wifi","lan","ethernet"]',18.0,1499,
      '["H2S bundled with AMS 2 at a discount","Ready for multi-color printing on the large 340mm build volume","All H2S features: 1000mm/s, heated chamber, HEPA filtration","AMS 2 with improved filament handling","Best value large-format multi-color setup"]',
      '["Same limitations as standalone H2S","AMS 2 adds desk space requirements","Premium price point"]',
      'The H2S AMS Combo bundles the powerful H2S with the AMS 2 for large-format multi-color printing.\n\nKey tips:\n- All H2S tips apply — see the H2S entry\n- Multi-color prints on the 340mm build volume can be spectacular — large models with many colors\n- Larger build volume = larger prime tower for multi-color. Plan material usage accordingly\n- The AMS 2 works excellently with the H2S for PLA, PETG, and ABS multi-color\n- For engineering materials (PA-CF, etc.), use the external spool holder for best results',
      JSON.stringify({dimensions:"~450×450×500 mm (printer) + AMS 2",motion_system:"CoreXY (next-gen)",max_acceleration:"20000 mm/s²",max_chamber_temp:"65°C",air_filtration:"HEPA + Activated carbon",ams_type:"AMS 2",ams_spool_capacity:4,camera:"Built-in 1080p",lidar:"Micro Lidar",sealed_enclosure:true,active_chamber_heating:true}),
      'https://wiki.bambulab.com/en/h2s'],

    ['H2D','Bambu Lab H2D',2025,'325x320x325',1000,'proprietary',1,1,1,1,1,120,300,
      '["PLA","PETG","ABS","ASA","TPU","PA","PA-CF","PA6-CF","PC","PAHT-CF","PVA","PPS-CF","Support W"]',
      '["wifi","lan","ethernet"]',20.0,1899,
      '["DUAL NOZZLE system — two independent extruders for true multi-material printing","Print with two different materials simultaneously — e.g., PLA + PVA supports, ABS + HIPS","Heated chamber up to 65°C for engineering materials","1000mm/s max speed with next-gen CoreXY","Supports vinyl/paper cutting with upgrade kit","Laser engraving/cutting capability with upgrade kit (10W or 40W)","Large build volume: 325×320×325mm","Most versatile Bambu printer — printing, cutting, and engraving in one machine"]',
      '["Most complex Bambu printer — dual nozzle adds maintenance","Expensive at $1899 base price","Slightly smaller build volume than H2S (325mm vs 340mm) due to dual nozzle","Heavy and large footprint","Dual nozzle requires more calibration — nozzle offset alignment is critical"]',
      'The H2D is Bambu Lab\'s dual-nozzle powerhouse. Two independent extruders enable true multi-material printing — print PLA with PVA soluble supports, or combine rigid and flexible materials in one print. It also supports upgrade kits for vinyl cutting and laser engraving.\n\nKey tips:\n- Dual nozzle unlocks PLA+PVA, ABS+HIPS, rigid+flex combinations that single-nozzle can\'t do well\n- Nozzle offset calibration is critical — run it after any nozzle change or maintenance\n- The secondary nozzle parks when not in use to prevent oozing on the print\n- Vinyl cutting upgrade turns the H2D into a craft cutter — great for stickers, heat transfer vinyl\n- The 10W laser upgrade handles engraving and thin material cutting\n- The 40W laser handles thicker materials and faster cutting\n- Build volume is slightly smaller than H2S due to the dual nozzle mechanism\n- The dual nozzle eliminates prime tower waste for two-material prints — saves material vs AMS color changes\n- Consider the H2D if you need dissolvable supports or true dual-material functional parts\n- The H2S is better value if you only need single-nozzle with AMS for multi-color',
      JSON.stringify({dimensions:"~460×460×510 mm",motion_system:"CoreXY (next-gen)",extruder:"Dual independent direct drive",nozzle_count:2,filament_diameter:"1.75 mm",layer_height_range:"0.08–0.28 mm",max_acceleration:"20000 mm/s²",max_chamber_temp:"65°C (active heating)",power_consumption:"600W typical",voltage:"100-240V AC",display:"7-inch touchscreen",bed_leveling:"Automatic (Micro Lidar + force sensor)",air_filtration:"HEPA + Activated carbon dual filter",sealed_enclosure:true,active_chamber_heating:true,vinyl_cutting:"Optional upgrade kit",laser_engraving:"Optional upgrade kit (10W or 40W)",camera:"Built-in 1080p",lidar:"Micro Lidar"}),
      'https://wiki.bambulab.com/en/h2d'],

    ['H2D AMS Combo','Bambu Lab H2D AMS Combo',2025,'325x320x325',1000,'proprietary',1,1,1,1,1,120,300,
      '["PLA","PETG","ABS","ASA","TPU","PA","PA-CF","PA6-CF","PC","PAHT-CF","PVA","PPS-CF","Support W"]',
      '["wifi","lan","ethernet"]',20.0,2299,
      '["H2D dual-nozzle bundled with AMS 2","Dual nozzle + AMS = maximum material versatility","All H2D features: dual extruder, heated chamber, HEPA","Ready for complex multi-material prints out of the box"]',
      '["Premium price at $2299","Same dual-nozzle complexity as standalone H2D","Large footprint with AMS added"]',
      'The H2D AMS Combo pairs the dual-nozzle H2D with the AMS 2 for the ultimate material versatility. Dual nozzles for true multi-material + AMS for easy color changes.\n\nKey tips:\n- All H2D tips apply — see the H2D entry\n- The AMS can feed both nozzles, enabling complex material combinations\n- Dual nozzle + AMS is the most capable material setup Bambu offers\n- Best for users who need both multi-color AND multi-material capability',
      JSON.stringify({dimensions:"~460×460×510 mm (printer) + AMS 2",motion_system:"CoreXY (next-gen)",extruder:"Dual independent direct drive",nozzle_count:2,max_acceleration:"20000 mm/s²",max_chamber_temp:"65°C",air_filtration:"HEPA + Activated carbon",ams_type:"AMS 2",ams_spool_capacity:4,sealed_enclosure:true,active_chamber_heating:true,camera:"Built-in 1080p",lidar:"Micro Lidar"}),
      'https://wiki.bambulab.com/en/h2d'],

    ['H2D Pro','Bambu Lab H2D Pro',2025,'325x320x325',1000,'proprietary',1,1,1,1,1,120,320,
      '["PLA","PETG","ABS","ASA","TPU","PA","PA-CF","PA6-CF","PC","PAHT-CF","PPS-CF","PPA-CF","Support W"]',
      '["wifi","lan","ethernet"]',22.0,3799,
      '["Enterprise-grade dual-nozzle printer for professional/industrial use","Tungsten carbide nozzles — hardest nozzle material available, extreme longevity","Vision encoder build plate for optical position calibration","Includes AMS 2 + AMS HT for high-temperature filament drying up to 85°C","Emergency stop button for safety in workshop environments","320°C max nozzle temp for the most demanding materials","Most capable Bambu printer for engineering and industrial applications"]',
      '["Most expensive Bambu printer at $3799","Targeted at professional/enterprise users — overkill for hobbyists","Complex dual-nozzle system requires more maintenance","Heavy and large footprint"]',
      'The H2D Pro is Bambu Lab\'s top-tier enterprise printer. It combines the H2D dual-nozzle system with tungsten carbide nozzles (the hardest nozzle material available), AMS HT for high-temp filament drying, and a vision encoder build plate for optical calibration.\n\nKey tips:\n- Tungsten carbide nozzles outlast even hardened steel by 10-50x — ideal for continuous CF printing\n- The vision encoder build plate uses an optical grid for extremely precise position calibration\n- AMS HT can dry filament at 85°C — sufficient for even the most moisture-sensitive nylons\n- Emergency stop button is a safety requirement for many professional workshops\n- 320°C nozzle temp enables PPS-CF and PPA-CF printing\n- This printer is designed for production-level prototyping and small batch manufacturing\n- Enterprise support options may be available through authorized resellers\n- Consider this for aerospace, automotive, and industrial applications where material performance is critical',
      JSON.stringify({dimensions:"~460×460×510 mm",motion_system:"CoreXY (next-gen)",extruder:"Dual independent direct drive, tungsten carbide nozzles",nozzle_count:2,nozzle_material:"Tungsten carbide",filament_diameter:"1.75 mm",max_acceleration:"20000 mm/s²",max_chamber_temp:"65°C (active heating)",max_nozzle_temp:"320°C",display:"7-inch touchscreen",bed_leveling:"Vision encoder + Micro Lidar",air_filtration:"HEPA + Activated carbon",sealed_enclosure:true,active_chamber_heating:true,ams_included:"AMS 2 + AMS HT",emergency_stop:true,target_market:"Professional / Enterprise"}),
      'https://wiki.bambulab.com/en/h2d-pro'],

    ['H2C','Bambu Lab H2C',2025,'325x320x325',1000,'proprietary',1,1,1,1,1,120,300,
      '["PLA","PETG","ABS","ASA","TPU","PA","PA-CF","PA6-CF","PC","PAHT-CF","PVA","Support W"]',
      '["wifi","lan","ethernet"]',20.0,2399,
      '["Vortek nozzle-swap system: 1 fixed extruder + 6 induction hotends for 7 colors/materials","Induction hotends heat up in ~8 seconds — ultra-fast nozzle changes","Eliminates prime tower waste for multi-color — each nozzle is dedicated to one color","Better multi-color quality than AMS — no color bleeding between switches","Near-zero purge waste compared to traditional multi-color systems","Heated chamber up to 65°C for engineering materials","1000mm/s max speed with next-gen CoreXY"]',
      '["Premium price at $2399","Vortek system is complex — 7 hotends need maintenance","Induction hotends are a new consumable cost","Limited to 7 total colors/materials per print","Nozzle rack takes up some build volume","New technology — less community experience than AMS-based systems"]',
      'The H2C introduces Bambu Lab\'s revolutionary Vortek nozzle-swap system. Instead of purging filament through a single nozzle (AMS approach), the H2C uses dedicated induction hotends for each color. The toolhead swaps hotends in ~8 seconds, producing multi-color prints with near-zero waste and no color bleeding.\n\nKey tips:\n- The Vortek system uses 1 fixed extruder + up to 6 induction hotends on a rack\n- Each induction hotend heats to printing temp in ~8 seconds via electromagnetic induction — very fast\n- Near-zero purge waste means significant material savings on multi-color prints vs AMS\n- No color bleeding = cleaner color transitions than AMS-based multi-color\n- The induction hotends are consumable — budget for replacements over time\n- Nozzle offset calibration runs automatically but verify periodically for best quality\n- The Vortek system can also be used for multi-material (different filament types per hotend)\n- Consider this over the H2D if your primary need is high-quality multi-color rather than dual-material\n- AMS 2 can be combined with the Vortek system for even more material options\n- The H2C can be upgraded to H2D-like capability, and vice versa (H2D can add Vortek via upgrade kit)',
      JSON.stringify({dimensions:"~460×460×510 mm",motion_system:"CoreXY (next-gen)",extruder:"Vortek: 1 fixed + 6 induction hotends",nozzle_count:"Up to 7 (Vortek system)",hotend_heat_time:"~8 seconds (induction)",filament_diameter:"1.75 mm",max_acceleration:"20000 mm/s²",max_chamber_temp:"65°C (active heating)",display:"7-inch touchscreen",bed_leveling:"Automatic (Micro Lidar + force sensor)",air_filtration:"HEPA + Activated carbon",sealed_enclosure:true,active_chamber_heating:true,vortek_system:true,purge_waste:"Near-zero vs AMS multi-color",camera:"Built-in 1080p",lidar:"Micro Lidar"}),
      'https://wiki.bambulab.com/en/h2c']
  ];
  for (const p of printers) ip.run(...p);

  // Seed accessories
  const ia = db.prepare('INSERT OR IGNORE INTO kb_accessories (name, category, brand, compatible_printers, description, price_usd, tips, specs_json) VALUES (?,?,?,?,?,?,?,?)');
  const accessories = [
    ['AMS (Automatic Material System)','ams','Bambu Lab','["X1C","X1C Combo","X1E","P1S","P1S Combo","P1P"]',
      'The AMS (Automatic Material System) is a 4-spool automatic material changer with built-in humidity control. It enables multi-color and multi-material printing by automatically switching between up to 4 filament spools during a print. Up to 4 AMS units can be daisy-chained via the AMS Hub for 16-color capability.\n\nThe AMS includes a built-in humidity sensor and sealed chamber with desiccant to keep filament dry between prints. An integrated cutter handles filament changes, and the buffer system manages retraction during switches. Compatible with most rigid filaments (PLA, PETG, ABS, ASA, PA, PC, PVA) but NOT recommended for flexible filaments like TPU.',
      349,
      'Essential tips for AMS usage:\n- Replace desiccant packs every 2-3 months. The indicator card should stay blue/orange — pink means saturated\n- PETG in the AMS: increase retraction by 0.5-1mm in Bambu Studio to reduce stringing during filament changes\n- TPU and other flexible filaments should NOT be used in the AMS — they will jam in the PTFE tubes. Use the external spool holder instead\n- Clean the filament cutter regularly (every 50-100 material changes) — debris buildup causes feeding failures\n- The AMS buffer needs to be properly tensioned — if it\'s too loose, filament can tangle inside\n- Works best with Bambu Lab branded spools (optimized spool size). Third-party spools may need the spool holder adapter\n- For multi-color prints: use the same material type across all slots for best results. Mixing PLA and PETG in one print requires careful temp management\n- The prime tower can be placed strategically in Bambu Studio — put it where it won\'t leave marks on the model\n- PTFE tubes should be inspected every 500-1000 print hours. Look for discoloration, kinks, or inner surface wear\n- Keep the humidity below 20% for optimal filament storage. The AMS maintains around 15-25% depending on environment',
      JSON.stringify({dimensions:"221×332×236 mm",weight:"2.35 kg",spool_capacity:4,max_spool_diameter:"200 mm",max_spool_width:"68 mm",supported_filament_diameter:"1.75 mm",humidity_sensor:true,sealed_chamber:true,desiccant_type:"Silica gel (replaceable)",filament_cutter:"Integrated blade",buffer_system:"Spring-loaded buffer",daisy_chain_max:4,daisy_chain_via:"AMS Hub",power:"Powered via printer connection",compatible_materials:"PLA, PETG, ABS, ASA, PA, PC, PVA, Support W",incompatible_materials:"TPU, Flex, Soft materials",filament_switch_time:"~15 seconds"})],

    ['AMS Lite','ams','Bambu Lab','["A1","A1 mini"]',
      'The AMS Lite is a lightweight 4-spool filament holder designed specifically for Bambu Lab\'s A-series printers (A1 and A1 mini). It provides automatic filament switching for multi-color prints at a lower price point than the full AMS.\n\nUnlike the full AMS, the AMS Lite does NOT include humidity control, a sealed chamber, or desiccant. It\'s a simpler mechanical design that relies on gravity-fed spool holders and a shared PTFE tube path to the printer\'s extruder. Despite the simpler design, it handles multi-color PLA printing very well.',
      149,
      'Tips for AMS Lite:\n- No humidity control — use an external filament dryer (Bambu Dryer or SUNLU S2) for moisture-sensitive materials\n- Store AMS Lite in a room with reasonable humidity (below 50%) to protect filament\n- The lighter design is optimized for the A-series — it won\'t physically fit on X1/P1 series printers\n- Best for PLA multi-color printing. PETG works but may need extra retraction settings\n- Keep the PTFE tube clean and check for wear every 200-300 print hours\n- The AMS Lite shares the same filament path system as the full AMS — same Bambu Studio settings\n- Up to 4 AMS Lite units can be connected for 16 colors (requires AMS Lite Hub)\n- Third-party spools work fine — the open design is more forgiving of non-standard spool sizes\n- For best results with third-party filament, ensure smooth spool rotation — some spools need the spindle adapter\n- Avoid TPU/flex in the AMS Lite — same limitation as the full AMS',
      JSON.stringify({dimensions:"187×288×210 mm",weight:"1.05 kg",spool_capacity:4,max_spool_diameter:"200 mm",max_spool_width:"68 mm",supported_filament_diameter:"1.75 mm",humidity_sensor:false,sealed_chamber:false,power:"Powered via printer connection",compatible_materials:"PLA, PETG, PVA, Support W",incompatible_materials:"TPU, Flex, Soft materials"})],

    ['Hardened Steel Nozzle 0.4mm','nozzle','Bambu Lab','["X1C","X1C Combo","X1E","P1S","P1S Combo","P1P"]',
      'Hardened steel nozzle in the standard 0.4mm diameter for Bambu Lab\'s proprietary quick-swap nozzle system. Essential for printing abrasive filaments like carbon fiber (CF), glass fiber (GF), glow-in-the-dark, and metallic filaments that would destroy a brass nozzle within hours.\n\nThe hardened steel construction provides dramatically longer life with abrasive materials (thousands of hours vs. hours for brass). The trade-off is slightly lower thermal conductivity than brass, which means you may need to increase nozzle temperature by 5-10°C compared to brass nozzle settings.',
      19.99,
      'When and why to use hardened steel:\n- MANDATORY for: PLA-CF, PETG-CF, PA-CF, PA6-CF, PAHT-CF, PPS-CF, any glass fiber, glow-in-the-dark\n- RECOMMENDED for: metallic/sparkle PLA, wood-fill, stone-fill, or any filled/composite filament\n- NOT NEEDED for: standard PLA, PETG, ABS, ASA, TPU, PA (unfilled nylon), PC\n- Increase nozzle temp by 5-10°C vs brass settings to compensate for lower thermal conductivity\n- The 0.4mm size is the best all-round choice — fine enough for detail, wide enough for reasonable speed\n- Hardened steel nozzles last 2000+ hours with CF filaments vs. 20-50 hours for brass\n- The proprietary quick-swap system makes nozzle changes a 30-second job — no tools needed\n- Keep a brass nozzle handy for pure PLA/PETG — brass gives slightly better surface finish due to better heat transfer\n- Clean nozzle tip regularly with a brass brush — carbon fiber residue can accumulate\n- If you notice degraded print quality after extended CF printing, the nozzle may need replacement despite being hardened',
      JSON.stringify({nozzle_diameter:"0.4 mm",material:"Hardened tool steel (H13/equivalent)",max_temperature:"320°C",thermal_conductivity:"Lower than brass (~26 W/mK vs ~120 W/mK for brass)",wear_resistance:"Excellent — 50-100x longer than brass with abrasive materials",weight:"~3g",installation:"Bambu proprietary quick-swap (tool-free)",compatible_layer_heights:"0.08–0.28 mm",recommended_for:"Carbon fiber, glass fiber, glow-in-dark, metallic, wood-fill, stone-fill",lifespan_with_cf:"2000+ hours",lifespan_with_pla:"10000+ hours"})],

    ['Hardened Steel Nozzle 0.6mm','nozzle','Bambu Lab','["X1C","X1C Combo","X1E","P1S","P1S Combo","P1P"]',
      'Larger 0.6mm hardened steel nozzle for faster prints with abrasive filaments. The wider opening allows 2-3x more material flow per second compared to 0.4mm, reducing print times by 30-40% for large parts while maintaining hardened steel\'s durability with carbon fiber and glass fiber filaments.\n\nIdeal for functional parts, prototypes, and draft-quality prints where speed is more important than fine detail. The wider extrusion also improves layer adhesion on structural parts.',
      19.99,
      'Best use cases for 0.6mm hardened steel:\n- Large functional parts with carbon fiber filaments (boxes, brackets, housings)\n- Draft-quality prints where speed is priority — 30-40% faster than 0.4mm\n- Functional prototypes that need to be strong but don\'t need fine surface detail\n- Use 0.3mm layer height for good speed/quality balance. Can go up to 0.42mm for pure draft\n- At 0.6mm, layer lines are more visible but parts are actually stronger due to better layer adhesion\n- Minimum wall thickness increases from 0.4mm to 0.6mm — adjust wall count in slicer\n- Small features and text below 1mm may lose detail — use 0.4mm for detailed work\n- The wider nozzle is less prone to clogging with filled filaments — good for wood-fill and stone-fill too\n- Print speed can be increased 20-30% over 0.4mm settings since more material flows per second\n- Consider having both 0.4mm and 0.6mm HS nozzles: 0.4mm for detail, 0.6mm for speed',
      JSON.stringify({nozzle_diameter:"0.6 mm",material:"Hardened tool steel",max_temperature:"320°C",thermal_conductivity:"Lower than brass",wear_resistance:"Excellent",installation:"Bambu proprietary quick-swap (tool-free)",compatible_layer_heights:"0.12–0.42 mm",flow_rate_increase:"2-3x vs 0.4mm at same speed",print_time_reduction:"30-40% vs 0.4mm for large parts",recommended_for:"Large functional CF/GF parts, fast prototyping"})],

    ['Hardened Steel Nozzle 0.8mm','nozzle','Bambu Lab','["X1C","X1C Combo","X1E","P1S","P1S Combo","P1P"]',
      'The largest available nozzle for Bambu Lab\'s proprietary system at 0.8mm diameter. Designed for maximum speed rapid prototyping with abrasive materials. The 0.8mm opening provides 4x the flow rate of a 0.4mm nozzle, enabling dramatic reductions in print time for large parts.\n\nBest suited for rapid prototyping, large structural parts, and situations where print speed is far more important than surface quality. Layer lines will be very visible but parts are structurally strong with excellent layer adhesion.',
      19.99,
      'When to use 0.8mm:\n- Rapid prototyping of large parts — print in hours what takes a day with 0.4mm\n- Structural/functional parts where appearance doesn\'t matter (hidden brackets, internal components)\n- Test fitting of assemblies before doing a final high-quality print\n- Use 0.4-0.56mm layer height for best speed. Can go to 0.64mm for extreme draft\n- At 0.8mm, fine details are lost entirely — text needs to be at least 3mm tall to be readable\n- The massive extrusion width means fewer perimeters needed for same wall thickness\n- Infill prints extremely fast — consider 20-30% infill with gyroid for good strength\n- Not suitable for miniatures, detailed models, or anything with fine features\n- Perfect for printing enclosure panels, storage bins, jigs, and fixtures\n- Consider using 0.8mm for support structures even when printing detail with 0.4mm (requires dual nozzle workflow)',
      JSON.stringify({nozzle_diameter:"0.8 mm",material:"Hardened tool steel",max_temperature:"320°C",thermal_conductivity:"Lower than brass",wear_resistance:"Excellent",installation:"Bambu proprietary quick-swap (tool-free)",compatible_layer_heights:"0.2–0.64 mm",flow_rate_increase:"4x vs 0.4mm at same speed",print_time_reduction:"50-70% vs 0.4mm for large parts",recommended_for:"Rapid prototyping, large structural parts, jigs/fixtures"})],

    ['Stainless Steel Nozzle 0.4mm','nozzle','Bambu Lab','["X1C","X1C Combo","X1E","P1S","P1S Combo","P1P","A1","A1 mini"]',
      'Stainless steel nozzle offering a middle ground between brass and hardened steel. Better wear resistance than brass (handles mildly abrasive filaments like silk, sparkle, and metallic PLA) while maintaining better thermal conductivity than hardened steel.\n\nA good all-purpose upgrade from the stock brass nozzle for users who print a variety of materials including some mildly abrasive specialty filaments but don\'t need the extreme durability of hardened steel.',
      14.99,
      'Stainless steel nozzle guide:\n- Good for: silk PLA, metallic PLA, sparkle filaments, marble-fill, and other mildly abrasive materials\n- NOT sufficient for: carbon fiber, glass fiber, or heavily filled composites — use hardened steel for those\n- Better thermal conductivity than hardened steel — usually no temp increase needed vs brass\n- Lasts 5-10x longer than brass with mildly abrasive filaments\n- Available for both proprietary (X1/P1 series) and MK8-style (A1 series) nozzle systems\n- A great \"daily driver\" nozzle if you print various materials including specialty PLA variants\n- If you only print standard PLA and PETG, brass is fine — save the cost\n- If you print ANY carbon fiber or glass fiber, skip stainless and go straight to hardened steel\n- Clean with a brass brush — not a steel brush, which could damage the nozzle\n- The stainless steel provides some food-safety advantages over brass for food-contact applications (check local regulations)',
      JSON.stringify({nozzle_diameter:"0.4 mm",material:"Stainless steel (304/316 grade)",max_temperature:"300°C",thermal_conductivity:"Better than hardened steel (~16 W/mK), less than brass",wear_resistance:"Moderate — 5-10x better than brass",installation:"Bambu proprietary quick-swap (tool-free) or MK8-style (A-series)",compatible_layer_heights:"0.08–0.28 mm",recommended_for:"Silk, metallic, sparkle, marble, wood-fill PLA"})],

    ['Cool Plate (Smooth PEI)','build_plate','Bambu Lab','["X1C","X1C Combo","X1E","P1S","P1S Combo","P1P","A1","A1 mini"]',
      'Smooth PEI spring steel build plate that provides excellent adhesion for PLA and a glossy, mirror-like bottom surface finish on printed parts. The spring steel design is flexible — parts pop off with a simple flex when the plate cools to room temperature.\n\nThe Cool Plate is Bambu Lab\'s default plate for PLA printing and comes included with most printers. The smooth surface gives printed parts a high-gloss bottom finish that looks almost injection-molded.',
      39.99,
      'Cool Plate usage guide:\n- Best for PLA — provides excellent adhesion and a beautiful glossy bottom finish\n- AVOID printing PETG directly on smooth PEI! PETG bonds permanently to smooth PEI and can damage the surface. Always use glue stick as a release agent for PETG\n- Clean with IPA (isopropyl alcohol) every 5-10 prints to maintain adhesion. Use 90%+ concentration\n- For stubborn residue, use a razor blade scraper at a very shallow angle — don\'t gouge the surface\n- Parts should self-release when the plate cools to room temperature. Don\'t force removal while hot\n- If parts aren\'t sticking: clean with IPA, re-level the bed, or increase first layer height slightly\n- The smooth PEI coating will eventually wear with use — expect to replace every 6-12 months with heavy use\n- Avoid touching the print surface with fingers — skin oils reduce adhesion\n- For ABS on smooth PEI: use Bambu liquid glue or regular glue stick. The smooth surface works well with proper adhesive\n- Store plates flat — don\'t bend them when not in use, which can cause permanent warping',
      JSON.stringify({size_x1_p1:"257×257 mm",size_a1:"256×256 mm",size_a1_mini:"180×180 mm",material:"Spring steel + PEI smooth coating",thickness:"~0.8 mm",surface_finish:"Smooth (glossy bottom on prints)",max_temperature:"120°C",magnetic_attachment:true,flexible:true,best_for:"PLA, TPU",requires_adhesive_for:"PETG (glue stick), ABS (glue stick/liquid glue)",lifespan:"6-12 months with regular use"})],

    ['Engineering Plate (Textured PEI)','build_plate','Bambu Lab','["X1C","X1C Combo","X1E","P1S","P1S Combo","P1P","A1","A1 mini"]',
      'Textured PEI spring steel build plate designed primarily for PETG, ABS, ASA, and engineering materials. The textured surface provides a matte, slightly rough bottom finish on printed parts and prevents PETG from bonding too strongly to the plate (a common problem with smooth PEI).\n\nThe textured surface also works well with ABS and ASA, providing good adhesion without the need for glue stick in most cases. The flexibility of the spring steel makes part removal easy.',
      39.99,
      'Engineering Plate usage guide:\n- Best for PETG — the texture prevents over-adhesion that destroys smooth PEI plates\n- Excellent for ABS and ASA — good adhesion without glue in most cases\n- No glue stick needed for PETG on textured PEI — this is the whole point of the textured surface\n- PLA also works well on textured PEI, though you\'ll get a matte bottom instead of glossy\n- The texture pattern gives parts a professional-looking matte finish — many users prefer this over glossy\n- Clean with IPA every 5-10 prints. The texture can trap residue — use a brush if needed\n- For ABS: preheat the plate to full temperature before starting the print for best adhesion\n- If PETG still sticks too strongly, your nozzle may be too close to the bed — increase Z-offset slightly\n- The textured surface hides minor first-layer imperfections better than smooth PEI\n- Great daily driver plate if you switch between PLA and PETG regularly',
      JSON.stringify({size_x1_p1:"257×257 mm",size_a1:"256×256 mm",size_a1_mini:"180×180 mm",material:"Spring steel + PEI textured coating",thickness:"~0.8 mm",surface_finish:"Textured (matte bottom on prints)",max_temperature:"120°C",magnetic_attachment:true,flexible:true,best_for:"PETG, ABS, ASA, PA",requires_adhesive_for:"None for most materials",lifespan:"8-14 months with regular use"})],

    ['High Temp Plate','build_plate','Bambu Lab','["X1C","X1C Combo","X1E","P1S","P1S Combo","P1P"]',
      'Specialized build plate designed for high-temperature materials like PC (polycarbonate), PA-CF (carbon fiber nylon), PA6-CF, PAHT-CF, and other engineering polymers that require bed temperatures above 100°C and strong adhesion under extreme thermal conditions.\n\nThe High Temp Plate uses a different surface coating than standard PEI plates, optimized for adhesion with materials that have high glass transition temperatures and significant warping forces. Bambu liquid glue is strongly recommended for best results.',
      49.99,
      'High Temp Plate guide:\n- REQUIRED for: PC, PA-CF, PA6-CF, PAHT-CF, PPS-CF, PPA-CF and other high-temp engineering materials\n- Apply a thin, even layer of Bambu liquid glue before each print — this is critical for adhesion\n- Preheat the plate to full target temperature and let it stabilize for 5 minutes before starting\n- DO NOT use this plate for standard PLA — it\'s overkill and PLA may stick too aggressively\n- The plate handles up to 120°C bed temperature continuously without degradation\n- For PAHT-CF and PPS-CF on the X1E: combine with active chamber heating for best results\n- Part removal: let the plate cool COMPLETELY before removing parts — high-temp materials contract significantly during cooling\n- Clean the plate with IPA after removing old glue residue. Reapply fresh glue for each print\n- The plate costs more than standard PEI plates but is essential for engineering work\n- Keep a separate plate for high-temp use — don\'t swap between PLA and PA-CF on the same plate if possible',
      JSON.stringify({size_x1_p1:"257×257 mm",material:"Spring steel + high-temperature coating",thickness:"~0.8 mm",surface_finish:"Specialized high-temp surface",max_temperature:"120°C+",magnetic_attachment:true,flexible:true,best_for:"PC, PA-CF, PA6-CF, PAHT-CF, PPS-CF",requires_adhesive:"Bambu liquid glue (strongly recommended)",lifespan:"6-12 months with engineering materials"})],

    ['Textured PEI Plate','build_plate','Bambu Lab','["X1C","X1C Combo","X1E","P1S","P1S Combo","P1P","A1","A1 mini"]',
      'Dual-sided textured PEI plate with a fine texture on one side and a coarser texture on the other. This versatile plate works well with most materials and gives printed parts a consistent matte finish. A popular choice for users who want one plate that handles multiple materials reasonably well.',
      39.99,
      'Textured PEI Plate guide:\n- The dual-sided design gives you two texture options — fine for detailed parts, coarse for larger prints\n- Works with PLA, PETG, ABS, ASA, and TPU without the need for glue stick in most cases\n- The textured surface produces a uniform matte finish that many users prefer over glossy smooth PEI\n- PETG releases much more easily from textured PEI than smooth PEI — no glue stick needed\n- For ABS: the textured surface provides good grip. Preheat the plate and enclosure before starting\n- Clean both sides with IPA regularly — rotate sides periodically to distribute wear evenly\n- PLA adhesion may be slightly less aggressive than on smooth PEI — a good thing for easy removal\n- Great all-purpose plate if you don\'t want to swap plates between materials\n- The coarser side works well for large parts with big first-layer surface areas\n- Fine side is good for parts where you want a more uniform, less pronounced texture pattern',
      JSON.stringify({size_x1_p1:"257×257 mm",size_a1:"256×256 mm",size_a1_mini:"180×180 mm",material:"Spring steel + dual-sided PEI textured coating",thickness:"~0.8 mm",surface_finish:"Dual-sided: fine texture / coarse texture",max_temperature:"120°C",magnetic_attachment:true,flexible:true,best_for:"PLA, PETG, ABS, ASA (all-purpose)",requires_adhesive_for:"None for most materials"})],

    ['Bambu Micro Lidar','upgrade','Bambu Lab','["X1C","X1C Combo","X1E","A1","A1 mini"]',
      'The Micro Lidar is a laser-based inspection system built into the toolhead of X1C, X1E, A1, and A1 mini printers. It performs three critical functions: automatic first-layer scanning to detect adhesion issues, spaghetti detection during printing, and precise bed mesh leveling.\n\nThe Lidar scans the first layer after printing and compares it to the expected pattern. If it detects gaps, poor adhesion, or warping, it can pause the print and alert you. During printing, it periodically scans for spaghetti (failed prints that produce a tangled mess), enabling automatic print failure detection and recovery.',
      0,
      'Micro Lidar tips:\n- The Lidar is built into X1C/X1E/A1/A1 mini — it\'s NOT an add-on accessory for P1 series printers\n- Enable \"Auto-recovery from step loss\" and \"First layer inspection\" in Bambu Studio for maximum benefit\n- Keep the Lidar lens clean — use a soft, dry microfiber cloth. Dust and filament residue degrade scan accuracy\n- The Lidar provides more accurate bed leveling than the strain gauge used in P1S/P1P\n- For first-layer scanning: the Lidar works by comparing the actual printed first layer to the expected extrusion pattern from the G-code\n- Spaghetti detection uses the Lidar to detect irregular extrusion patterns — not 100% reliable but catches most failures\n- The Lidar works with all filament colors, including transparent — it uses laser reflection, not optical imaging\n- If you get false positive first-layer failures, try cleaning the bed and recalibrating\n- The Lidar scan adds a few seconds to the start of each print — a worthwhile trade-off for failure detection\n- This feature alone makes the X1C/A1 worth considering over the P1S for many users',
      JSON.stringify({type:"Time-of-flight laser sensor",wavelength:"940 nm (infrared)",scanning_resolution:"~0.05 mm",functions:["First-layer inspection","Spaghetti detection","Bed mesh leveling","Flow calibration"],built_into:"X1C, X1C Combo, X1E, A1, A1 mini",NOT_available_on:"P1S, P1S Combo, P1P",scan_time:"~30 seconds for first layer",replaceable:false})],

    ['HD Camera Module','upgrade','Bambu Lab','["X1C","X1C Combo","X1E","A1","A1 mini"]',
      'Built-in HD camera integrated into X1C, X1E, A1, and A1 mini printers. Provides live video feed for remote monitoring via the Bambu Handy mobile app and Bambu Studio desktop application. Also enables automatic timelapse recording of prints.\n\nThe camera provides 1080p video streaming over WiFi or LAN. Combined with the Micro Lidar, it forms part of Bambu Lab\'s print monitoring and failure detection system. The camera feed is accessible both locally and via Bambu Cloud.',
      0,
      'Camera tips:\n- Built into X1C/X1E/A1/A1 mini — NOT available on P1S/P1P (consider aftermarket USB camera solutions for those)\n- Remote monitoring via Bambu Handy app (iOS/Android) — check on your prints from anywhere\n- Timelapse recording: enable in Bambu Studio print settings. Creates smooth time-lapse videos of your prints\n- For privacy-conscious users: LAN-only mode disables cloud streaming. Camera only accessible on local network\n- The camera feed quality depends on WiFi signal strength — ensure good WiFi coverage near your printer\n- LED lighting in the chamber helps camera visibility — the X1C/X1E have built-in LEDs\n- The camera works with the AI spaghetti detection system alongside the Lidar\n- Timelapse files are stored on the printer\'s SD card — retrieve via WiFi or physically\n- Camera works during all print states — you can check on heating, printing, and cooling phases\n- The A1/A1 mini camera is the same quality as X1C — a significant value add at their lower price point',
      JSON.stringify({resolution:"1920×1080 (1080p)",frame_rate:"Up to 30 fps",field_of_view:"Wide angle (covers full build volume)",streaming:"WiFi, LAN, Bambu Cloud",app_support:"Bambu Handy (iOS/Android), Bambu Studio (desktop)",timelapse:true,night_vision:false,built_into:"X1C, X1C Combo, X1E, A1, A1 mini",NOT_available_on:"P1S, P1S Combo, P1P"})],

    ['Bambu Filament Dryer','tool','Bambu Lab','["X1C","X1C Combo","X1E","P1S","P1S Combo","P1P","A1","A1 mini"]',
      'Single-spool filament dryer with integrated humidity display and adjustable temperature control up to 55°C. Designed to dry moisture-sensitive filaments before and during printing, which is critical for materials like nylon, PETG, TPU, and PVA that absorb atmospheric moisture.\n\nMoisture in filament causes popping sounds during printing, stringing, poor layer adhesion, and degraded mechanical properties. The dryer can be used as a pre-print treatment or as an inline dryer (feeding directly from the dryer to the printer).',
      49.99,
      'Filament Dryer drying guide:\n- PLA: 45°C for 4-6 hours. PLA is mildly moisture-sensitive — dry if you hear popping or see stringing\n- PETG: 50°C for 6-8 hours. PETG absorbs moisture over weeks — dry regularly if stored in open air\n- TPU: 50°C for 4-6 hours. Flexible filaments absorb moisture quickly — dry before every print session\n- Nylon (PA): 55°C for 8-12 hours. Extremely moisture-sensitive — must be bone dry. Use inline from dryer if possible\n- PVA: 45°C for 4-6 hours. Very moisture-sensitive — dry before each use. PVA can become unusable if too wet\n- ABS/ASA: 50°C for 4 hours. Less moisture-sensitive but benefits from drying for best results\n- PC: 55°C for 8 hours. Polycarbonate absorbs moisture and will bubble if not dried properly\n- The dryer can feed filament directly to the printer — great for nylon and TPU that re-absorb moisture quickly\n- The humidity display shows real-time RH inside the dryer — aim for below 15% before printing\n- For best results, dry filament the night before a print. Don\'t rush — insufficient drying is worse than none\n- Consider a larger dryer (SUNLU S2, eSUN eBOX) if you print a lot of engineering materials — the Bambu dryer only holds one spool\n- Desiccant in the AMS helps but is NOT a substitute for proper drying of nylon and TPU',
      JSON.stringify({capacity:"1 spool (max 1kg standard size)",temperature_range:"35-55°C (adjustable in 5°C steps)",humidity_display:true,power:"~40W",heating_element:"PTC ceramic heater",feed_through:"Yes (inline drying capability)",dimensions:"~220×220×120 mm",compatible_spool_size:"Standard 1kg (200mm diameter, 68mm width)",noise_level:"Silent (no fan in basic model)"})],

    ['AMS Hub','upgrade','Bambu Lab','["X1C","X1C Combo","X1E","P1S","P1S Combo","P1P"]',
      'The AMS Hub connects up to 4 AMS units to a single printer, enabling 16-color or 16-material printing capability. It manages the filament routing from multiple AMS units to the printer\'s extruder via a shared PTFE tube path with automatic switching.\n\nEach AMS holds 4 spools, so 4 × 4 = 16 available filaments. The Hub handles the filament selection, routing, and switching logic. This enables extremely complex multi-color prints, gradient effects, and multi-material functional parts.',
      49.99,
      'AMS Hub tips:\n- The Hub is required to connect more than one AMS unit — a single AMS connects directly to the printer\n- Maximum 4 AMS units = 16 colors/materials. This is the current hardware limit\n- PTFE tube management becomes critical with 4 AMS units — keep tubes tidy and avoid sharp bends\n- Multi-color prints with 8+ colors generate significant waste via the prime tower — plan material usage accordingly\n- The Hub adds a small delay per filament change due to longer tube routing — expect slower prints with many color changes\n- For 16-color prints: plan your prime tower size carefully in Bambu Studio. It needs to be large enough to fully purge each color\n- Color bleeding can occur with high contrast changes (black → white) — increase purge volume in slicer settings\n- 4 AMS units take up considerable desk space — plan your workspace accordingly\n- Power consumption increases with each AMS unit — ensure your electrical circuit can handle the load\n- Most users find 1-2 AMS units sufficient. 4 units is for advanced multi-color or production use',
      JSON.stringify({max_ams_units:4,max_filament_slots:16,connection_type:"Dedicated AMS data cable",power:"Powered via AMS chain",tube_routing:"Shared PTFE path with automatic selection",compatible_with:"AMS (full size), NOT AMS Lite",switching_time:"~15-20 seconds between units"})],

    ['Bambu Spool Holder','tool','Bambu Lab','["X1C","X1C Combo","X1E","P1S","P1S Combo","P1P","A1","A1 mini"]',
      'External spool holder that mounts on the back or side of Bambu Lab printers. Allows the use of third-party filament spools that are too large for the AMS, or materials like TPU that aren\'t compatible with the AMS.\n\nThe spool holder bypasses the AMS entirely and feeds filament directly to the extruder via a PTFE guide tube. This is the recommended setup for flexible filaments (TPU, TPC), large 2kg+ spools, and any filament that jams in the AMS.',
      14.99,
      'Spool Holder usage guide:\n- REQUIRED for: TPU/flex filaments, 2kg+ spools, filaments with non-standard spool sizes\n- The external spool holder feeds directly to the extruder, bypassing the AMS entirely\n- For TPU: always use the external spool holder. TPU in the AMS WILL jam — it\'s too flexible for the tube path\n- Large 2kg and 3kg spools from brands like eSUN and Polymaker won\'t fit in the AMS — use the spool holder\n- Ensure smooth spool rotation — adjust the holder tension so the spool turns freely without resistance\n- Mount the holder so the filament feeds in a gentle curve to the extruder — avoid sharp angles\n- When using the spool holder, disable AMS in Bambu Studio print settings to avoid conflicts\n- The spool holder works alongside the AMS — you can have AMS for multi-color and switch to spool holder for specific materials\n- Keep the PTFE guide tube clean and replace if it shows wear inside\n- Consider printing a spool holder adapter for unusual spool sizes (many designs on Printables/Thingiverse)',
      JSON.stringify({max_spool_diameter:"No limit (external mount)",max_spool_width:"No limit (external mount)",mounting:"Back or side of printer (screw mount)",material:"Injection-molded plastic",feed_path:"Direct to extruder via PTFE tube",ams_bypass:true,best_for:"TPU, large 2kg+ spools, non-standard spools"})],

    ['AMS 2 Pro','ams','Bambu Lab','["P2S","P2S Combo","X1C","X1C Combo","X1E","H2S","H2D","H2C"]',
      'The AMS 2 Pro is the next-generation Automatic Material System with airtight sealed chambers and active filament drying up to 65°C. A major upgrade over the original AMS, it keeps filament dry during storage and can actively dry moisture-sensitive materials before and during printing.\n\nFeatures 4 airtight spool chambers with individual humidity sensors and active heating. Supports up to 24-color printing when daisy-chained with multiple units via hub.',
      284,
      'AMS 2 Pro tips:\n- Active drying up to 65°C — can dry PLA, PETG, and even TPU directly in the AMS\n- Airtight chambers maintain low humidity — no more replacing desiccant packs monthly\n- Individual humidity sensors per chamber let you monitor each spool\n- 24-color capability when daisy-chaining multiple units (vs 16 with original AMS)\n- Still NOT recommended for TPU/flex in the tube path — use external spool holder\n- The drying feature means you can load nylon and have it dry while waiting to print\n- Improved filament cutter and buffer system for more reliable switches\n- Compatible with X1, P2S, and H2 series printers\n- The sealed chambers also protect filament from dust and contamination\n- Worth the upgrade from original AMS if you print moisture-sensitive materials regularly',
      JSON.stringify({spool_capacity:4,drying_temp_max:"65°C",airtight_chambers:true,humidity_sensors:"Per chamber",max_daisy_chain:"24 colors (with hub)",compatible_series:"P2S, X1, H2",filament_diameter:"1.75 mm"})],

    ['AMS HT','ams','Bambu Lab','["H2S","H2D","H2D Pro","H2C"]',
      'The AMS HT (High Temperature) is designed specifically for engineering and high-temperature filaments. It can dry filament at up to 85°C — sufficient for the most moisture-sensitive nylons, PAHT-CF, and PPS-CF. Included with the H2D Pro, optional for other H2 series printers.\n\nThe 85°C drying capability is significantly higher than the AMS 2 Pro (65°C), making it the only AMS that can properly dry PA6-CF, PAHT-CF, and other advanced engineering materials directly in the AMS.',
      169,
      'AMS HT tips:\n- 85°C drying is the key feature — this properly dries nylon, PAHT-CF, PPS-CF, and PPA-CF\n- Designed for H2 series printers — not compatible with X1 or P1/P2 series\n- Essential for anyone regularly printing engineering nylons and high-temp materials\n- The high drying temp means PA-CF can be stored and dried in the AMS continuously\n- Combine with AMS 2 for a mixed setup: AMS HT for engineering, AMS 2 for standard materials\n- Included with H2D Pro — optional purchase for H2S, H2D, H2C\n- For PAHT-CF: the AMS HT can dry at 85°C but 90-100°C is ideal — consider supplementing with a standalone dryer\n- The sealed high-temp chambers are more robust than standard AMS — built for continuous high-temp operation',
      JSON.stringify({spool_capacity:4,drying_temp_max:"85°C",airtight_chambers:true,humidity_sensors:"Per chamber",compatible_series:"H2 series only",target_materials:"PA-CF, PA6-CF, PAHT-CF, PPS-CF, PPA-CF, PC"})],

    ['Vortek Upgrade Kit (H2D)','upgrade','Bambu Lab','["H2D","H2D AMS Combo"]',
      'The Vortek Upgrade Kit converts an H2D dual-nozzle printer into an H2C-style Vortek nozzle-swap system. This adds the induction hotend rack and nozzle offset calibration sensor, enabling up to 7 colors/materials with near-zero purge waste.\n\nThe kit includes the Vortek rack mount beam, induction hotend mounting points, calibration sensor, wiring harness, and detailed installation instructions. Installation takes approximately 4-5 hours.',
      799,
      'Vortek Upgrade Kit guide:\n- Converts H2D to H2C-style capability with 7 nozzle positions\n- Installation is complex — approximately 4-5 hours for experienced users\n- Induction hotends are purchased separately and installed on the rack\n- After installation, run full nozzle offset calibration for each hotend\n- The upgrade is reversible — you can switch back to dual-nozzle H2D configuration\n- Consider buying the H2C outright if you don\'t already own an H2D\n- Near-zero purge waste saves significant material on multi-color prints\n- Each induction hotend heats in ~8 seconds — very fast nozzle swaps',
      JSON.stringify({compatible_printers:"H2D, H2D AMS Combo",installation_time:"4-5 hours",converts_to:"H2C-style Vortek system",nozzle_positions:"Up to 7",hotend_type:"Induction (purchased separately)",reversible:true})],

    ['H2 Laser Upgrade Kit 10W','upgrade','Bambu Lab','["H2D","H2D AMS Combo","H2C","H2C AMS Combo"]',
      'A 10W diode laser module that attaches to the H2D/H2C toolhead for laser engraving and thin material cutting. Enables the H2 series to engrave wood, leather, acrylic, and cut thin materials like paper, felt, and thin wood.\n\nThe 10W laser is suitable for most hobby engraving and light cutting tasks. For thicker materials and faster cutting, consider the 40W upgrade.',
      450,
      'Laser 10W tips:\n- Suitable for: engraving wood, leather, anodized aluminum, acrylic; cutting paper, felt, thin plywood (<3mm)\n- NOT suitable for: cutting thick materials, metal engraving (except anodized), glass\n- Always use the enclosed chamber with the laser — protects eyes from laser radiation\n- The laser uses the same motion system as printing — very precise engraving\n- Ventilation is important — laser cutting/engraving produces smoke and fumes\n- Design files can be imported in Bambu Studio — supports SVG and image files\n- Speed and power settings vary by material — start with manufacturer recommendations\n- The H2D/H2C can switch between printing and laser modes without physical disassembly\n- Consider the 40W upgrade for more capability if you plan heavy laser use',
      JSON.stringify({laser_power:"10W diode",engraving:"Wood, leather, acrylic, anodized aluminum",cutting:"Paper, felt, thin plywood (<3mm)",eye_safety:"Enclosed chamber required",compatible_printers:"H2D, H2C series"})],

    ['H2 Laser Upgrade Kit 40W','upgrade','Bambu Lab','["H2D","H2D AMS Combo","H2C","H2C AMS Combo"]',
      'A powerful 40W diode laser module for the H2D/H2C series enabling heavy-duty laser engraving and cutting. The 40W laser can cut thicker materials, engrave faster, and handle a wider range of applications than the 10W module.\n\nThe 40W module is for serious laser work — cutting 6mm+ plywood, thick acrylic, leather, and engraving at high speeds.',
      700,
      'Laser 40W tips:\n- Significant power upgrade over 10W — cuts 6mm+ plywood, thick acrylic, leather\n- Engraving is much faster than 10W — higher throughput for production work\n- Produces more smoke/fumes than 10W — ensure strong exhaust ventilation\n- The 40W laser generates more heat — monitor for material scorching\n- NOT compatible with H2S — only H2D and H2C series\n- Professional-grade laser capability in a 3D printer platform\n- Consider air assist (blowing air at the cut point) for cleaner cuts\n- Material thickness limits depend on material type and number of passes',
      JSON.stringify({laser_power:"40W diode",cutting_capacity:"6mm+ plywood, thick acrylic, leather",engraving_speed:"Much faster than 10W",compatible_printers:"H2D, H2C series (NOT H2S)",ventilation:"Strong exhaust recommended"})],

    ['H2 Cutting Upgrade Kit','upgrade','Bambu Lab','["H2S","H2D","H2D AMS Combo","H2C","H2C AMS Combo"]',
      'Vinyl and paper cutting upgrade kit for the H2 series. Converts the 3D printer into a precision craft cutter capable of cutting vinyl, paper, cardboard, and thin leather. Includes a 45° cutting blade (0.35mm), LightGrip and StrongGrip cutting mats, and software integration.\n\nCutting area is approximately 300×285mm — large enough for most craft projects.',
      null,
      'Cutting Kit tips:\n- Perfect for: vinyl decals, heat transfer vinyl (HTV), paper crafts, stickers, labels, thin leather\n- Includes two mat types: LightGrip for paper/vinyl, StrongGrip for thicker materials\n- The 45° blade is a consumable — replacements are inexpensive\n- Cutting designs are imported via Bambu Studio — supports SVG files\n- The precision of the H2 motion system produces very accurate cuts\n- Great for combining 3D printing with vinyl/paper crafting\n- Replace the blade when cuts become ragged — typically every 50-100 cutting hours\n- Compatible with all H2 series printers (H2S, H2D, H2C)',
      JSON.stringify({cutting_area:"300×285 mm",blade_type:"45° x 0.35mm",blade_replaceable:true,materials:"Vinyl, paper, cardboard, thin leather, HTV",mats_included:"LightGrip + StrongGrip",compatible_printers:"All H2 series"})],

    ['H2D Complete Hotend Assembly','nozzle','Bambu Lab','["H2D","H2D AMS Combo","H2D Pro"]',
      'Complete hotend assembly for the H2D series including heating element, thermistor, fan, silicone sock, and nozzle. Available with tungsten carbide nozzles in 0.4mm, 0.6mm, and 0.8mm sizes.\n\nA complete replacement assembly for the H2D extruder system. Useful for maintenance, upgrades, or keeping a spare for quick swaps during production.',
      69,
      'H2D Hotend tips:\n- Complete assembly includes everything needed for a nozzle swap\n- Tungsten carbide nozzles are the hardest available — outlast hardened steel 10-50x\n- Keep a spare hotend assembly for quick swaps during production runs\n- The silicone sock prevents filament from sticking to the heater block\n- Available in 0.4, 0.6, and 0.8mm nozzle sizes\n- 0.4mm for detail work, 0.6mm for speed, 0.8mm for rapid prototyping',
      JSON.stringify({nozzle_material:"Tungsten carbide",nozzle_sizes:"0.4, 0.6, 0.8 mm",max_temp:"320°C",includes:"Heating element, thermistor, fan, silicone sock, nozzle",compatible_printers:"H2D series"})],

    ['H2C Induction Hotend','nozzle','Bambu Lab','["H2C","H2C AMS Combo"]',
      'Induction-heated hotend for the H2C Vortek nozzle-swap system. Each induction hotend heats to printing temperature in approximately 8 seconds using electromagnetic induction — no traditional heater cartridge needed.\n\nUp to 6 induction hotends can be mounted on the Vortek rack, with each dedicated to a specific color or material. This eliminates purge waste and color bleeding between nozzle swaps.',
      65,
      'Induction Hotend tips:\n- Heats in ~8 seconds via electromagnetic induction — very fast compared to traditional hotends\n- Each hotend is dedicated to one filament color/material — no purge needed between swaps\n- Up to 6 induction hotends on the Vortek rack + 1 fixed extruder = 7 total\n- The induction heating is a consumable system — hotends have a service life\n- Nozzle offset calibration runs automatically when new hotends are installed\n- Buy one per color you frequently use for fastest multi-color setup\n- The hotend tip design minimizes oozing when parked on the rack\n- Check hotend condition periodically — carbon buildup can affect heating efficiency',
      JSON.stringify({heating_method:"Electromagnetic induction",heat_up_time:"~8 seconds",max_temp:"300°C",nozzle_sizes:"0.4 mm (standard)",rack_positions:6,compatible_printers:"H2C series, H2D with Vortek upgrade"})],

    ['Nozzle Wiper','tool','Bambu Lab','["X1C","X1C Combo","X1E","P1S","P1S Combo","P1P","P2S","P2S Combo","H2S","H2D","H2C"]',
      'Replacement nozzle wiper that cleans the nozzle tip between prints and during filament changes. The wiper removes excess filament from the nozzle to prevent drool marks on the first layer and improve print quality.\n\nThe wiper is a consumable part that wears out over time and should be replaced when visibly worn or when you notice filament residue not being cleaned properly.',
      6,
      'Nozzle Wiper tips:\n- A consumable part — replace every 200-500 print hours depending on usage\n- Signs of worn wiper: filament residue on first layer, nozzle tip not clean after purge\n- Different wiper models for different printer series — check compatibility\n- Keep 2-3 spares on hand for quick replacement\n- The wiper sits in the nozzle parking area and automatically cleans during printer homing\n- Brass nozzles accumulate more residue than hardened steel — wiper wears faster\n- Clean the wiper area of filament debris periodically for best performance',
      JSON.stringify({type:"Consumable replacement part",lifespan:"200-500 print hours",material:"Silicone/rubber compound",installation:"Tool-free snap-in"})],

    ['Filament Buffer','tool','Bambu Lab','["X1C","X1C Combo","X1E","P1S","P1S Combo","P1P","P2S","P2S Combo"]',
      'Spring-loaded filament buffer that manages filament tension and retraction between the AMS and printer extruder. The buffer absorbs the filament slack during retraction and maintains consistent tension during printing, which is critical for reliable AMS operation.\n\nThe buffer is a maintenance item that should be inspected periodically for wear and proper tension.',
      25,
      'Filament Buffer tips:\n- Critical component for reliable AMS operation — without proper buffer tension, filament changes fail\n- Check the spring tension periodically — if it feels weak, replace the buffer\n- Clean inside the buffer housing if you notice filament dust accumulation\n- The buffer should absorb all retraction length smoothly — if you hear clicking, it may need replacement\n- Installed in the filament path between AMS output and printer extruder\n- Replace if you experience inconsistent filament feeding with the AMS\n- Keep a spare on hand — a failed buffer can cause mid-print failures',
      JSON.stringify({function:"Filament tension and retraction management",mechanism:"Spring-loaded",position:"Between AMS output and extruder",maintenance:"Periodic inspection, replace when worn"})],

    ['PTFE Tube (AMS to Extruder)','tool','Bambu Lab','["X1C","X1C Combo","X1E","P1S","P1S Combo","P1P","P2S","P2S Combo"]',
      'Replacement PTFE (Teflon) tube for the filament path between the AMS and printer extruder. The PTFE tube guides filament from the AMS through the buffer to the extruder with minimal friction.\n\nPTFE tubes are a consumable that degrades over time, especially with abrasive filaments like carbon fiber. Regular inspection and replacement ensures reliable filament feeding.',
      6,
      'PTFE Tube tips:\n- Inspect every 500-1000 print hours. Look for: discoloration, inner surface scratches, kinks, deformation\n- Replace immediately if you see inner scoring — this causes feeding resistance and print failures\n- Abrasive filaments (CF, GF) wear PTFE tubes faster — inspect every 200-300 hours with CF\n- Ensure clean, straight cuts when trimming replacement tubes — angled cuts cause feeding issues\n- The tube should slide smoothly over filament — if it grips, it\'s worn\n- Keep 2-3 spare tubes on hand for quick replacement\n- Route the tube in gentle curves — sharp bends cause friction and feeding problems',
      JSON.stringify({material:"PTFE (Teflon)",inner_diameter:"2.0 mm",outer_diameter:"4.0 mm",max_temp:"260°C continuous",function:"Filament guide path (AMS to extruder)",lifespan:"500-1000 hours (shorter with abrasive filaments)"})],

    ['Silicone Sock','tool','Bambu Lab','["X1C","X1C Combo","X1E","P1S","P1S Combo","P1P","P2S","P2S Combo","A1","A1 mini"]',
      'Silicone insulation cover that fits over the printer hotend heater block. The sock prevents filament from sticking to the heater block, improves thermal stability, and protects against accidental burns. A consumable that should be replaced when torn, loose, or degraded.',
      7,
      'Silicone Sock tips:\n- Prevents filament from accumulating on the heater block — avoids messy blobs\n- Improves thermal stability by reducing heat loss from the heater block\n- Safety feature — reduces burn risk when working near the hot end\n- Replace when torn, deformed, or filament has bonded to it\n- Different models for different printer series — check compatibility\n- The sock should fit snugly but not be forced — stretching reduces lifespan\n- Keep 2-3 spares on hand — they\'re inexpensive and a common wear item\n- If filament accumulates on the heater block after sock damage, heat the hotend and carefully remove with pliers',
      JSON.stringify({material:"High-temperature silicone",max_temp:"300°C+",function:"Hotend insulation and protection",installation:"Slip-on (tool-free)",lifespan:"500-1000 hours typical"})]
  ];
  for (const a of accessories) ia.run(...a);

  // Seed filaments
  const fi = db.prepare('INSERT OR IGNORE INTO kb_filaments (material, brand, variant, category, difficulty, nozzle_temp_min, nozzle_temp_max, bed_temp_min, bed_temp_max, chamber_temp, fan_speed_min, fan_speed_max, enclosure_required, nozzle_recommendation, abrasive, moisture_sensitivity, strength, flexibility, heat_resistance, layer_adhesion, food_safe, uv_resistant, tips_print, tips_storage, tips_post, compatible_printers) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)');
  const filaments = [
    ['PLA','Bambu Lab','Basic','standard',1,190,230,45,65,0,80,100,0,'brass',0,2,3,1,2,4,0,0,
      'PLA (Polylactic Acid) is the easiest and most forgiving filament to print with. It\'s the default recommendation for beginners and the most widely used 3D printing material worldwide.\n\nPrint settings:\n- Nozzle: 200-220°C is the sweet spot for most Bambu Lab PLA. Start at 210°C\n- Bed: 55-60°C. Higher temps can cause elephant foot on first layer\n- Fan: 100% after first layer for best overhangs and bridging. Reduce to 80% for better layer adhesion on functional parts\n- Speed: Bambu printers handle PLA at 300-500mm/s. No need to slow down unless you see quality issues\n- No enclosure needed — PLA actually prints better with good airflow\n- First layer: 0.2mm height, 20mm/s speed, 0% fan for best adhesion\n- Retraction: 0.8mm at 30mm/s works well on Bambu direct drive extruders\n\nCommon issues and fixes:\n- Stringing: reduce nozzle temp by 5°C, increase retraction by 0.2mm, or enable wipe\n- Poor bed adhesion: clean bed with IPA, increase first layer height, decrease first layer speed\n- Elephant foot: lower bed temp by 5°C, increase Z-offset slightly\n- Warping on large parts: use brim (5mm), ensure bed is clean, check for drafts',
      'PLA is the least moisture-sensitive common filament but still degrades over time in humid environments.\n\nStorage recommendations:\n- Store in sealed bags or containers with desiccant (silica gel) packs\n- PLA can absorb enough moisture in 2-4 weeks to noticeably affect print quality\n- Signs of wet PLA: popping/crackling sounds during printing, excessive stringing, rough surface finish, tiny bubbles on surface\n- Drying: 45-50°C for 4-6 hours in a filament dryer. Do NOT exceed 55°C — PLA can deform on the spool\n- Vacuum-sealed spools from Bambu Lab have a shelf life of 1-2 years unopened\n- After opening, use within 6 months for best results, or keep sealed between uses\n- Humidity indicator cards in storage containers help monitor conditions — aim for below 30% RH',
      'PLA post-processing options:\n- Sanding: start at 200 grit, work up to 800-1000 grit for a smooth finish. Wet sanding works best\n- Painting: prime with filler primer (Rust-Oleum or similar), then acrylic or spray paint\n- Gluing: super glue (CA) works well. Epoxy for structural bonds. PLA cannot be solvent-welded like ABS\n- PLA is BRITTLE — avoid using it for functional parts that experience impact, bending, or sustained stress\n- Heat resistance is LOW — PLA deforms above 55-60°C. Don\'t use in cars, near heat sources, or outdoors in direct sun\n- Annealing PLA: baking at 80-100°C in an oven can increase heat resistance to ~80°C but causes dimensional warping of 1-3%\n- PLA is biodegradable in industrial composting facilities but NOT in home composting or landfills\n- PLA is generally food-safe in raw form, but FDM layer lines harbor bacteria. Not recommended for food contact without food-safe coating',
      '["X1C","P1S","P1P","A1","A1 mini"]'],

    ['PLA','Bambu Lab','Matte','standard',1,190,230,45,65,0,80,100,0,'brass',0,2,3,1,2,4,0,0,
      'Bambu Lab Matte PLA is a specialized PLA formulation that produces a flat, non-reflective surface finish. The matte effect hides layer lines significantly better than standard PLA, making prints look more professional without post-processing.\n\nPrint settings:\n- Same temperatures as standard PLA: 200-220°C nozzle, 55-60°C bed\n- Fan: 80-100% for best surface quality. The matte effect benefits from good cooling\n- Speed: same as standard PLA — no speed reduction needed\n- The matte finish is consistent regardless of layer height, making it great for fast 0.2-0.3mm layer prints\n- Slightly different flow characteristics than basic PLA — may need minor flow rate adjustment (+/- 2%)\n- Layer adhesion is comparable to standard PLA\n- The matte agent in the filament can cause slightly more nozzle residue — clean nozzle between color changes',
      'Same storage requirements as standard PLA. Store sealed with desiccant.\n\nMatte PLA is slightly more moisture-sensitive than basic PLA due to the matte additives. If you notice the matte finish becoming inconsistent or glossy in spots, the filament may be wet — dry at 45°C for 4-6 hours.\n\nVacuum-sealed with desiccant from Bambu Lab. Use within 3-6 months of opening for best matte effect.',
      'The matte finish is the main advantage — parts look professional without sanding or painting.\n\n- Sanding: works well and the matte surface takes primer and paint beautifully\n- The matte finish hides minor print artifacts, layer lines, and Z-seam marks\n- Paint adhesion is better on matte PLA than glossy PLA due to the slightly textured surface\n- Matte PLA can be mixed with standard PLA in multi-color prints for interesting visual contrasts\n- The matte additive makes the filament slightly less brittle than basic PLA — marginally better impact resistance\n- Same heat resistance limitations as standard PLA (softens at 55-60°C)',
      '["X1C","P1S","P1P","A1","A1 mini"]'],

    ['PLA-CF','Bambu Lab','Carbon Fiber','composite',2,220,250,45,65,0,80,100,0,'hardened_steel',1,2,4,1,3,3,0,0,
      'PLA-CF is PLA reinforced with chopped carbon fibers, creating a stiffer, more rigid material with a professional matte black finish. The carbon fibers increase stiffness by 50-80% compared to standard PLA.\n\nCRITICAL: Use a hardened steel nozzle! Carbon fibers are extremely abrasive and will destroy a brass nozzle in as little as 50-100g of material.\n\nPrint settings:\n- Nozzle: 220-240°C (higher than standard PLA due to CF content)\n- Bed: 55-60°C on smooth or textured PEI\n- Fan: 80-100% for best overhangs. The CF content makes bridging easier\n- Speed: reduce by 10-20% vs standard PLA for best surface quality. 200-300mm/s works well\n- The carbon fibers reduce oozing and stringing significantly — a big advantage\n- Print with 0.4mm or larger nozzle — CF can clog 0.2mm nozzles\n- Increase wall count to 3-4 for maximum stiffness benefit — the CF fibers align along the print direction\n- Retraction: same as standard PLA (0.8mm at 30mm/s) — CF reduces need for retraction',
      'Store sealed with desiccant. PLA-CF is slightly more moisture-sensitive than standard PLA due to the carbon fiber content, which wicks moisture.\n\nDrying: 50°C for 4-6 hours. The carbon fibers make moisture absorption faster than plain PLA.\n\nInspect the spool for tangling before loading — CF filament can be slightly more brittle and prone to snapping if tangled on the spool.',
      'PLA-CF post-processing:\n- The carbon fiber gives a natural matte black finish that looks professional without any post-processing\n- Very stiff but BRITTLE — even more so than standard PLA. Do not use for parts that flex or take impacts\n- Sanding is difficult — the carbon fibers create a rough texture that resists fine sanding\n- The fibers align along the direction of print movement, making parts strongest along the X/Y direction\n- Cross-layer strength (Z-direction) is lower than standard PLA — avoid loads perpendicular to layers\n- Great for: drone frames, RC car parts, brackets, stiffeners, decorative panels, jigs\n- Not suitable for: anything that needs to flex, hinges, snap-fits, or impact-resistant parts\n- Weight is similar to standard PLA — carbon fiber adds stiffness, not lightness (common misconception)',
      '["X1C","P1S","P1P","A1","A1 mini"]'],

    ['PETG','Bambu Lab','Basic','standard',2,220,260,70,90,0,30,50,0,'brass',0,3,3,2,3,4,0,0,
      'PETG (Polyethylene Terephthalate Glycol) is the most popular engineering-lite material, offering a great balance between ease of printing and functional properties. Stronger and more heat-resistant than PLA, with better impact resistance and chemical resistance.\n\nPrint settings:\n- Nozzle: 230-245°C. Start at 235°C for Bambu PETG\n- Bed: 75-85°C on TEXTURED PEI plate. DO NOT print on smooth PEI without glue stick — PETG bonds permanently to smooth PEI\n- Fan: 30-50%. Lower fan gives better layer adhesion but worse overhangs. 40% is a good compromise\n- Speed: 200-300mm/s on Bambu printers. PETG can handle high speeds but stringing increases\n- Some stringing is NORMAL with PETG. Don\'t chase zero stringing — it\'s the nature of the material\n- Retraction: 1.0mm at 30mm/s. Can increase to 1.5mm for less stringing but risk clogs\n- First layer: increase Z-offset by 0.02-0.05mm compared to PLA — PETG doesn\'t like being squished\n- PETG is prone to ooze — enable wipe and retraction moves in slicer settings\n- Avoid crossing perimeters when possible — reduces stringing and blobs on surface',
      'PETG is moderately moisture-sensitive — more so than PLA, less so than nylon.\n\nStorage:\n- Store in sealed bags/containers with desiccant. PETG absorbs moisture over 1-3 weeks in open air\n- Signs of wet PETG: excessive stringing (more than usual), popping sounds, cloudy/hazy appearance, reduced clarity on transparent variants\n- Drying: 50-55°C for 6-8 hours. Can dry at 60°C but monitor spool for deformation\n- Transparent PETG is more noticeably affected by moisture — becomes cloudy when wet\n- After opening, aim to use within 2-4 weeks, or keep sealed between print sessions\n- The AMS helps protect PETG with its sealed chamber and desiccant, but is not a substitute for proper drying if already wet',
      'PETG post-processing:\n- More impact-resistant than PLA — handles drops and bumps better\n- Heat resistance: up to 80-85°C before deformation (vs 55-60°C for PLA)\n- PETG is naturally glossy and somewhat transparent/translucent — great for light diffusers\n- Sanding: possible but PETG tends to fuzz rather than sand smoothly. Use wet sanding with 400+ grit\n- Cannot be acetone smoothed (unlike ABS). Chemical smoothing is limited\n- Gluing: CA glue works, epoxy is better. PETG can also be solvent-welded with dichloromethane (use with extreme caution and ventilation)\n- PETG is food-safe (it\'s the same material as water bottles) but FDM layer lines harbor bacteria\n- UV resistance: moderate — better than PLA but degrades over years in direct sunlight. Use ASA for outdoor applications\n- Chemical resistance: excellent. Resists most common chemicals, oils, and cleaning products\n- Great for: functional parts, enclosures, water-resistant applications, food containers (with coating), outdoor parts (moderate UV)',
      '["X1C","P1S","P1P","A1","A1 mini"]'],

    ['PETG-CF','Bambu Lab','Carbon Fiber','composite',2,240,270,70,90,0,30,50,0,'hardened_steel',1,3,4,1,3,3,0,0,
      'PETG reinforced with chopped carbon fibers, combining PETG\'s impact resistance with increased stiffness from the carbon fiber content. Produces a matte black finish and offers better dimensional stability than standard PETG.\n\nCRITICAL: Hardened steel nozzle is mandatory. Carbon fibers will destroy brass nozzles quickly.\n\nPrint settings:\n- Nozzle: 240-260°C (higher than standard PETG due to CF content)\n- Bed: 75-85°C on textured PEI plate\n- Fan: 30-50%. Same fan strategy as standard PETG\n- Speed: 200-250mm/s. Slightly slower than standard PETG for best results\n- Use 0.4mm or larger nozzle — CF can clog smaller nozzles\n- The CF content significantly reduces stringing compared to standard PETG — a welcome improvement\n- Wall count: 3-4 walls for maximum stiffness. The fibers align with print direction for directional strength\n- Less ooze than standard PETG, making retraction settings less critical\n- Overhangs are cleaner than standard PETG due to the CF content increasing material rigidity during cooling',
      'Store sealed with desiccant. PETG-CF inherits PETG\'s moisture sensitivity plus additional absorption from the carbon fibers.\n\nDrying: 55°C for 6-8 hours before printing. If the filament has been exposed for more than a week, drying is strongly recommended.\n\nThe carbon fibers can make the filament slightly more brittle on the spool — avoid sharp bends and ensure smooth feeding from spool to extruder.',
      'PETG-CF combines the best of both materials:\n- Stiffer than PETG (carbon fibers) with better impact resistance than PLA-CF (PETG matrix)\n- Heat resistance: 80-90°C — comparable to standard PETG with slightly better dimensional stability under heat\n- The matte black CF finish looks professional and hides layer lines well\n- Better dimensional accuracy than standard PETG — less warping and shrinkage\n- Good for: structural brackets, drone frames, RC parts, functional enclosures, technical housings\n- The directional stiffness (anisotropy) means parts are strongest along the print path — design accordingly\n- Chemical resistance: same excellent chemical resistance as standard PETG\n- Can be post-processed with sanding but the CF texture makes smooth finishes difficult',
      '["X1C","P1S","P1P","A1","A1 mini"]'],

    ['ABS','Bambu Lab','Basic','standard',3,230,260,90,110,0,0,30,1,'brass',0,2,4,2,4,4,0,0,
      'ABS (Acrylonitrile Butadiene Styrene) is a classic engineering thermoplastic that offers good strength, impact resistance, and heat resistance. Used for decades in injection molding (LEGO bricks are ABS), it requires an enclosure for reliable FDM printing due to its tendency to warp.\n\nPrint settings:\n- Nozzle: 240-250°C. Bambu ABS works well at 245°C\n- Bed: 95-110°C. Higher temps give better adhesion for large parts\n- Fan: 0-30%. Minimal fan is critical — ABS warps when cooled too quickly\n- ENCLOSURE REQUIRED! Close all doors and lids. Drafts cause warping and layer splitting\n- Speed: 200-300mm/s in an enclosed Bambu printer. ABS handles speed well in a warm chamber\n- Preheat the chamber for 10-15 minutes before starting — aim for 40-50°C chamber temp\n- Brim: use 5-8mm brim for parts larger than 80mm in any dimension\n- First layer: 0.2mm height, slower speed (15-20mm/s), 0% fan, squish slightly more than PLA\n- ABS shrinks ~0.5-0.7% as it cools — account for this in precision parts\n\nWARNING: ABS releases styrene fumes during printing. Print in a well-ventilated area or use an enclosed printer with activated carbon filtration (X1C/X1E). Do NOT breathe the fumes directly.',
      'ABS is one of the least moisture-sensitive filaments — much better than PETG or nylon.\n\nStorage:\n- Store sealed with desiccant but ABS can handle moderate humidity exposure without major quality loss\n- Signs of wet ABS: popping sounds, rough surface texture, reduced impact strength\n- Drying: 60-65°C for 4-6 hours if needed\n- ABS can be stored in open air for weeks without significant degradation in moderate humidity (<50% RH)\n- Shelf life when sealed: 2+ years\n- The low moisture sensitivity makes ABS one of the most forgiving engineering materials for storage',
      'ABS post-processing is where it really shines:\n- ACETONE SMOOTHING: place printed part in a sealed container with acetone vapor. The surface melts slightly, creating a smooth, glossy finish that eliminates layer lines. This is ABS\'s killer feature\n- Acetone welding: apply acetone to surfaces and press together for strong chemical bonds\n- Sanding: ABS sands beautifully. Start at 200 grit, work to 800+, then acetone vapor smooth for perfect finish\n- Painting: takes primer and paint very well. Acetone-smoothed surfaces are excellent for painting\n- Drilling/tapping: ABS machines well. You can drill holes and tap threads after printing\n- Heat resistance: up to 100-105°C. Suitable for automotive, appliance, and electrical applications\n- Impact resistance: good — much better than PLA. Can handle drops and mechanical stress\n- UV resistance: POOR. ABS yellows and becomes brittle with UV exposure. Use ASA instead for outdoor parts\n- Chemical resistance: moderate. Resistant to most acids and alkalis but dissolved by acetone, MEK, and some solvents',
      '["X1C","P1S","X1E"]'],

    ['ASA','Bambu Lab','Basic','standard',3,230,260,90,110,0,0,30,1,'brass',0,2,4,2,5,4,0,1,
      'ASA (Acrylonitrile Styrene Acrylate) is essentially UV-resistant ABS. It shares most of ABS\'s properties but with significantly better weatherability, making it the go-to material for outdoor functional parts.\n\nPrint settings:\n- Nearly identical to ABS: 240-250°C nozzle, 95-110°C bed, 0-30% fan\n- ENCLOSURE REQUIRED — same as ABS. ASA warps in drafts\n- Preheat chamber for 10-15 minutes before starting\n- Speed: 200-300mm/s in enclosed printer\n- ASA has slightly less tendency to warp than ABS but still needs an enclosure\n- Brim: use for parts larger than 80mm\n- ASA may produce slightly more odor than ABS during printing — ensure good filtration\n- Layer adhesion is comparable to ABS — excellent inter-layer bonding with low fan\n\nFume warning: like ABS, ASA releases fumes during printing. Use an enclosed printer with filtration or print in a ventilated area.',
      'Same storage requirements as ABS — low moisture sensitivity.\n\nStorage:\n- Sealed bag with desiccant for optimal results, but ASA handles humidity well\n- Drying: 60-65°C for 4 hours if needed\n- Signs of wet ASA: same as ABS — popping, rough surface\n- Shelf life: 2+ years when sealed. Several months in open air in moderate humidity',
      'ASA\'s key advantage is UV resistance:\n- Withstands years of direct sunlight without yellowing or becoming brittle\n- Perfect for: outdoor enclosures, garden fixtures, car parts, drone shells, weather stations, mailbox numbers, house number signs, planters\n- Can be acetone-smoothed just like ABS for a glossy, professional finish\n- Acetone welding works the same as ABS\n- Heat resistance: 95-105°C — comparable to ABS\n- Impact resistance: good, similar to ABS\n- Mechanical properties are very similar to ABS — consider ASA a direct replacement for outdoor use\n- The UV stability means parts maintain their color and mechanical properties for years outdoors\n- Chemical resistance: similar to ABS. Resistant to most household chemicals\n- If you\'re choosing between ABS and ASA: use ASA for anything that will be outdoors or near windows. Use ABS for indoor-only parts where acetone smoothing is the priority (both can be acetone-smoothed, but ABS has more smoothing documentation)',
      '["X1C","P1S","X1E"]'],

    ['TPU 95A','Bambu Lab','Flexible','flexible',3,210,240,40,60,0,50,80,0,'brass',0,3,2,5,2,3,0,0,
      'TPU 95A (Thermoplastic Polyurethane, Shore 95A hardness) is a flexible/elastic filament. The \"95A\" indicates medium-firm hardness — flexible enough to bend and compress but firm enough to hold its shape.\n\nPrint settings:\n- Nozzle: 220-230°C. Higher temps increase flow but also stringing\n- Bed: 45-55°C on smooth PEI. Glue stick can help with adhesion\n- Fan: 50-80%. Higher fan helps with overhangs but can cause layer adhesion issues\n- Speed: SLOW! 30-80mm/s maximum. TPU cannot handle high speeds — it will buckle in the extruder\n- Retraction: DISABLE or set very low (0.0-0.5mm). TPU compresses in the extruder during retraction, causing jams\n- DO NOT use in the AMS! TPU is too flexible for the PTFE tube path. Use the external spool holder\n- Direct drive extruders (all Bambu printers) handle TPU much better than Bowden setups\n- Print with a wider nozzle (0.4mm minimum) — TPU can clog narrow nozzles\n- Infill: 15-30% for flexible parts. Use gyroid infill pattern for best flex behavior\n- Wall count: 2-3 walls. More walls = stiffer part, fewer walls = more flexible\n- Enable \"Avoid crossing perimeters\" to reduce stringing\n- Linear advance/pressure advance should be reduced or disabled for TPU',
      'TPU is moderately moisture-sensitive and absorbs water relatively quickly when exposed to air.\n\nStorage:\n- Store sealed with desiccant. TPU can absorb enough moisture in 1-2 weeks to cause issues\n- Signs of wet TPU: excessive stringing, bubbling on surface, popping sounds, reduced elasticity in printed parts\n- Drying: 50°C for 4-6 hours. Do NOT exceed 55°C — TPU can deform on the spool\n- Consider using an inline dryer (dryer → printer) for best results, especially in humid climates\n- Wet TPU still prints but the surface quality suffers significantly\n- After drying, use immediately or store in a sealed container',
      'TPU is ideal for flexible functional parts:\n- Phone cases and tablet covers — shock-absorbing and grippy\n- Gaskets, seals, and O-rings — waterproof and chemically resistant\n- Bumpers and vibration dampeners — excellent shock absorption\n- Shoe insoles and orthotics (95A is a good hardness for insoles)\n- Watch bands and wearable accessories\n- Protective covers for electronics\n- Flexible hinges and living hinges\n- Grip covers for tools and handles\n- TPU has excellent abrasion resistance — great for parts that experience sliding wear\n- Chemical resistance is very good — resists oils, greases, and many solvents\n- TPU is NOT acetone-smoothable. Surface finishing options are limited\n- Painting TPU requires flexible paint (like Plasti Dip) — standard paint will crack when flexed\n- TPU can be glued with CA (super glue) or flexible adhesives\n- UV resistance is moderate — TPU will yellow slightly over years in direct sun',
      '["X1C","P1S","P1P","A1","A1 mini"]'],

    ['PA-CF','Bambu Lab','Carbon Fiber Nylon','engineering',4,260,290,80,100,0,0,30,1,'hardened_steel',1,5,5,2,5,4,0,0,
      'PA-CF (Polyamide Carbon Fiber, also called Nylon-CF) is a high-performance engineering material combining nylon\'s toughness with carbon fiber\'s stiffness. It produces parts that rival injection-molded engineering components in strength and rigidity.\n\nCRITICAL requirements:\n1. HARDENED STEEL NOZZLE — mandatory. Carbon fibers will destroy brass in hours\n2. FILAMENT MUST BE DRY — PA absorbs moisture aggressively. Print wet = print garbage\n3. ENCLOSURE REQUIRED — nylon warps severely without a heated chamber\n\nPrint settings:\n- Nozzle: 270-285°C. High temps needed for proper nylon flow\n- Bed: 85-100°C on High Temp Plate with Bambu liquid glue\n- Fan: 0-30%. Minimal fan for best layer adhesion — nylon needs slow cooling\n- Speed: 150-200mm/s. Slower than PLA/PETG for best quality and strength\n- Chamber temp: 35-50°C (passive heating in X1C, active heating in X1E)\n- Brim: use 5-8mm brim for all but the smallest parts\n- Retraction: 0.5mm at 20mm/s. PA-CF oozes less than unfilled nylon\n- Wall count: 3-4 walls for maximum strength. The CF fibers align along the perimeter direction\n- Infill: 15-30% is usually sufficient — the CF walls carry most of the load\n- PA-CF has strong inter-layer adhesion when printed correctly — critical for structural parts',
      'Nylon is EXTREMELY moisture-sensitive. This is the #1 cause of failed PA-CF prints.\n\nDrying protocol:\n- Dry at 80°C for 8-12 hours minimum before first use\n- Even sealed spools from Bambu Lab benefit from 4 hours of drying before printing\n- Use an inline dryer (dryer feeding directly to printer) if possible — PA re-absorbs moisture within hours in humid environments\n- Signs of wet PA-CF: popping/crackling during extrusion, rough surface texture with tiny bubbles, significantly reduced mechanical properties, poor layer adhesion\n- Store in vacuum-sealed bags with fresh desiccant. Silica gel or molecular sieve desiccant\n- In humid climates (>50% RH): consider storing with an active dehumidifier or in a dry cabinet\n- The AMS provides some protection but is NOT sufficient for PA — dry before loading\n- Mark the spool with the date you opened it — reseal and re-dry after 24 hours of exposure',
      'PA-CF produces some of the strongest and stiffest parts possible on consumer 3D printers.\n\nMechanical properties:\n- Tensile strength: 80-110 MPa (3-4x stronger than PLA)\n- Flexural modulus: 5000-7000 MPa (very stiff)\n- Impact resistance: excellent — much better than PLA-CF or PLA\n- Heat resistance: up to 150-180°C continuous use temperature\n\nApplications:\n- Structural brackets, mounts, and fixtures\n- Automotive under-hood components (heat resistant)\n- Drone and RC vehicle frames and structural parts\n- Tool handles, jigs, and manufacturing aids\n- Replacement parts for machinery\n- Enclosures for electronics in harsh environments\n\nPost-processing:\n- PA-CF has a beautiful matte black finish that needs no post-processing\n- Difficult to sand due to carbon fiber content\n- Can be drilled and tapped for threaded inserts\n- Heat-set brass inserts work excellently in PA-CF\n- Cannot be acetone-smoothed or chemically smoothed\n- Excellent chemical resistance — resistant to oils, fuels, and most solvents',
      '["X1C","X1E"]'],

    ['PA6-CF','Bambu Lab','PA6 Carbon Fiber','engineering',4,270,300,80,100,50,0,20,1,'hardened_steel',1,5,5,1,5,4,0,0,
      'PA6-CF is a higher-performance carbon fiber nylon using the PA6 polymer base (instead of the more common PA12). It offers superior mechanical properties, higher heat resistance, and better chemical resistance than standard PA-CF.\n\nRequirements (same as PA-CF, but stricter):\n1. HARDENED STEEL NOZZLE — absolutely mandatory\n2. BONE DRY filament — PA6 is even more moisture-sensitive than PA12\n3. ENCLOSURE with chamber heating — active heating (X1E) is strongly recommended\n\nPrint settings:\n- Nozzle: 280-300°C. PA6 requires higher temps than PA12-based CF\n- Bed: 85-100°C on High Temp Plate with Bambu liquid glue\n- Fan: 0-20%. Absolute minimum fan for best crystallization and strength\n- Speed: 100-180mm/s. Slower than PA-CF for best results\n- Chamber temp: 50°C+ recommended. The X1E with active chamber heating is ideal\n- On X1C: passive chamber heating reaches 35-45°C — adequate for small parts but not ideal\n- Brim: 8mm minimum for all parts. PA6 contracts aggressively during cooling\n- PA6-CF produces the strongest parts available on Bambu printers (excluding PAHT-CF)\n- The higher crystallinity of PA6 means parts continue to shrink slightly for 24-48h after printing',
      'PA6 is the most moisture-sensitive common printing material. Treat it like a medical supply.\n\nDrying protocol:\n- Dry at 85-90°C for 12 hours minimum for fresh spools\n- After ANY exposure: re-dry for 8 hours before printing\n- Use an inline dryer — PA6 absorbs measurable moisture within 30-60 minutes in typical indoor humidity\n- Signs of wet PA6-CF: loud popping, surface bubbles, stringy/hairy surface, parts that crumble or delaminate\n- Molecular sieve desiccant is preferred over silica gel for PA6 (lower dew point)\n- Consider a professional filament dry cabinet if you print PA6-CF regularly\n- NEVER leave PA6-CF on the spool holder or AMS overnight without protection\n- The X1E\'s enclosed chamber helps during printing but does not dry the filament before use',
      'PA6-CF is a professional-grade engineering material:\n\nMechanical properties:\n- Tensile strength: 110-140 MPa (among the strongest FDM materials)\n- Flexural modulus: 7000-9000 MPa (extremely stiff)\n- Heat deflection temperature: 180-200°C (suitable for automotive and industrial)\n- Excellent creep resistance — maintains dimensional stability under sustained load\n\nApplications:\n- Industrial tooling and manufacturing fixtures\n- Automotive structural components and under-hood parts\n- Aerospace prototyping\n- High-stress mechanical components\n- Heat-critical applications (engine components, heat shields)\n\nPost-processing:\n- Professional matte black finish requires no treatment\n- Can be drilled, tapped, and machined with standard tools\n- Heat-set brass inserts work excellently\n- Parts achieve full strength after 48 hours of room-temperature crystallization\n- Annealing at 120-140°C for 2-4 hours can further increase strength and heat resistance',
      '["X1C","X1E"]'],

    ['PVA','Bambu Lab','Water Soluble','support',2,190,220,45,65,0,80,100,0,'brass',0,5,1,1,1,3,0,0,
      'PVA (Polyvinyl Alcohol) is a water-soluble support material designed to be paired with PLA or PETG as the primary material. The PVA supports dissolve completely in warm water, leaving a clean surface on the printed part with no support marks or scars.\n\nPrint settings:\n- Nozzle: 200-210°C. Lower temps reduce oozing. Don\'t exceed 215°C — PVA degrades at high temps\n- Bed: 50-60°C\n- Fan: 80-100%\n- Speed: same as PLA\n- Best used with AMS — automatic switching between PLA and PVA support\n- Support interface: 2-3 layers of PVA between model and support for clean separation\n- PVA can clog if left heated in the nozzle for extended periods — the material degrades and carbonizes\n- If switching from PVA to another material, purge thoroughly to clear residue\n- PVA is compatible with PLA and PETG. NOT compatible with ABS/ASA (too high temperatures)\n- Use \"Support type: Tree\" in Bambu Studio with PVA for efficient support placement',
      'PVA is the MOST moisture-sensitive common filament. Improper storage renders it unusable.\n\nStorage (critical!):\n- Store in vacuum-sealed bags with FRESH desiccant at ALL times when not printing\n- PVA absorbs moisture within hours in normal room humidity (40-60% RH)\n- Signs of wet PVA: filament is soft/gummy to the touch, pops and sizzles during printing, clogs nozzle, dissolves too slowly, filament snaps easily on the spool\n- Drying: 45-50°C for 6-8 hours. Do NOT exceed 55°C — PVA deforms easily\n- Once PVA has absorbed too much moisture, it may be unrecoverable — the polymer chains degrade\n- In humid climates, consider a dry cabinet with active dehumidification for PVA storage\n- Keep opened spools sealed whenever not actively printing — even a few hours of exposure matters\n- Some users recommend vacuum-sealing partially used spools between print sessions',
      'PVA dissolution guide:\n- Dissolve supports in warm water at 40-60°C. Hotter water = faster dissolution\n- Typical dissolution time: 4-12 hours depending on support volume and water temperature\n- Agitation significantly speeds dissolution — use a magnetic stirrer, ultrasonic cleaner, or just stir periodically\n- Change the water halfway through for faster results — saturated water dissolves PVA slower\n- Fully dissolved PVA leaves zero residue on the part surface — this is why PVA supports are preferred for display models\n- PVA is biodegradable and environmentally safe — the dissolved solution can be poured down the drain\n- For complex internal support structures (like inside a hollow model), PVA is the only practical option\n- After dissolution, rinse the part with clean water and let it dry completely\n- PVA supports cost more than breakaway supports — use only when surface finish justifies the cost',
      '["X1C","P1S","A1"]'],

    ['Support W','Bambu Lab','Breakaway','support',1,190,230,45,65,0,80,100,0,'brass',0,2,1,1,1,2,0,0,
      'Support W is Bambu Lab\'s breakaway support material. Unlike PVA (which dissolves in water), Support W is mechanically removed by snapping and peeling off the supports by hand. It\'s designed to have weak adhesion to the model surface, making removal easy.\n\nPrint settings:\n- Same temperature range as PLA: 200-220°C nozzle, 55-60°C bed\n- Fan: 80-100%\n- Speed: same as PLA\n- Works in the AMS just like any other rigid filament\n- Interface layers: 2-3 layers between model and support for cleanest removal\n- Support distance: Bambu Studio default works well (0.15-0.2mm gap)\n- Support W is easier to print than PVA — less moisture-sensitive, no clogging issues\n- Can be used with PLA and PETG primary materials\n- Less precise removal than PVA — may leave slight marks on supported surfaces',
      'Much less moisture-sensitive than PVA — similar to standard PLA.\n\nStorage:\n- Store in sealed bag with desiccant for best results\n- Survives weeks of open-air exposure without major quality issues\n- Drying: 45-50°C for 4 hours if needed\n- The low moisture sensitivity is a major advantage over PVA for casual users\n- Shelf life: 1+ year when sealed',
      'Support W removal and surface finish:\n- Snap off supports by hand — they\'re designed to break away cleanly at the interface\n- Use flush cutters or pliers for tight spots and hard-to-reach areas\n- Supported surfaces will have a visible texture where supports attached — less clean than PVA dissolution\n- For surfaces that need to be smooth: sand the support marks starting at 200 grit\n- Support W is the practical choice for most prints — faster to remove than dissolving PVA and much easier to handle\n- Use PVA only when you need perfect support-free surfaces (display models, complex internal geometry)\n- The support material is recyclable — some filament recycling programs accept it\n- Support W works well with tree supports in Bambu Studio — efficient material usage with easy removal',
      '["X1C","P1S","P1P","A1","A1 mini"]'],

    ['PC','Bambu Lab','Polycarbonate','engineering',4,260,290,100,120,0,0,20,1,'brass',0,3,5,2,5,4,0,1,
      'PC (Polycarbonate) is an extremely tough, heat-resistant, and impact-resistant engineering thermoplastic. It\'s the same material used in bullet-resistant glass, safety goggles, and automotive headlight covers. Printing PC is challenging but produces some of the most durable parts possible.\n\nPrint settings:\n- Nozzle: 265-285°C. PC needs high temps for proper flow and layer adhesion\n- Bed: 105-120°C on High Temp Plate with Bambu liquid glue\n- Fan: 0-20%. Absolute minimum fan — PC needs slow cooling for crystallization and strength\n- ENCLOSURE REQUIRED — PC warps aggressively without a heated chamber\n- Speed: 100-200mm/s. Slower than ABS for best results\n- Chamber temp: 40-50°C helps significantly. X1E with active heating is ideal\n- Brim: 8-10mm for all parts. PC has significant warping forces\n- First layer: extra squish, very slow speed (10-15mm/s), 0% fan\n- PC tends to absorb moisture — dry before printing (see storage tips)\n- Layer adhesion is excellent when printed correctly — PC parts don\'t delaminate easily\n- The material is naturally transparent/translucent — clear PC is available but challenging\n\nSafety: PC releases bisphenol A (BPA) fumes at high temps. Print in a well-ventilated area or enclosed printer with activated carbon filtration.',
      'PC is moderately moisture-sensitive — less than nylon but more than ABS.\n\nStorage:\n- Store sealed with desiccant. PC absorbs moisture over 1-3 weeks in open air\n- Drying: 80°C for 6-8 hours. PC can handle higher drying temps without spool deformation\n- Signs of wet PC: bubbles on surface, popping sounds, reduced clarity (for transparent variants), weaker layer adhesion\n- PC can survive moderate humidity exposure better than nylon but should still be dried before printing\n- Shelf life: 1-2 years sealed, 2-4 weeks open in moderate humidity',
      'PC produces the toughest parts among common 3D printing materials:\n\nMechanical properties:\n- Impact resistance: EXCEPTIONAL — among the highest of any printable material. PC parts can withstand hammering, dropping, and extreme impacts\n- Heat resistance: up to 130-140°C continuous (one of the highest among consumer FDM materials)\n- Tensile strength: 55-75 MPa (strong but slightly less than PA-CF in tensile. PC\'s advantage is impact/toughness)\n- Transparency: PC can be printed clear/translucent — great for light guides, lenses, and see-through enclosures\n\nApplications:\n- Safety equipment and protective covers\n- Transparent/translucent enclosures and light guides\n- High-impact functional parts (cases, housings, shields)\n- Automotive interior parts and lens covers\n- Electrical enclosures (PC is a good electrical insulator)\n- Parts exposed to high temperatures\n\nPost-processing:\n- PC can be polished to near-optical clarity (for transparent variants) using progressive wet sanding + flame polishing\n- Sanding: PC sands smoothly. Work from 200 to 2000 grit for glass-like finish\n- Drilling and tapping: PC machines well, doesn\'t crack or chip easily\n- Gluing: cyanoacrylate (super glue) or solvent welding with dichloromethane\n- UV resistance: excellent — one of the most UV-resistant polymers (used in outdoor applications for decades)',
      '["X1C","X1E"]'],

    ['PAHT-CF','Bambu Lab','High Temp CF Nylon','engineering',5,300,320,100,120,60,0,20,1,'hardened_steel',1,5,5,1,5,5,0,0,
      'PAHT-CF (High-Temperature Polyamide Carbon Fiber) is the most advanced filament in Bambu Lab\'s lineup. It uses a specialty high-temperature nylon matrix with carbon fiber reinforcement, producing parts with exceptional strength, stiffness, and heat resistance up to 200°C+.\n\nThis is a PROFESSIONAL/INDUSTRIAL material. It\'s the most demanding filament to print and requires the X1E\'s active chamber heating (or a heavily modified X1C) for reliable results.\n\nCRITICAL requirements:\n1. X1E printer (or equivalent with 60°C+ active chamber heating)\n2. Hardened steel nozzle — MANDATORY\n3. Filament MUST be bone dry — this is the most moisture-sensitive material\n4. High Temp Plate with Bambu liquid glue\n\nPrint settings:\n- Nozzle: 300-320°C. This requires the highest nozzle temp of any common FDM material\n- Bed: 110-120°C on High Temp Plate\n- Fan: 0-10%. Essentially no fan for best crystallization\n- Chamber: 55-60°C with ACTIVE heating (X1E). Passive heating in X1C is NOT sufficient for reliable prints\n- Speed: 80-150mm/s. Slow and steady for professional-grade results\n- Brim: 10mm minimum. PAHT-CF has extreme warping forces\n- The material continues to crystallize for 48-72 hours after printing — full mechanical properties are reached after this period\n- PAHT-CF has very low shrinkage compared to other high-temp nylons when printed with proper chamber heating',
      'PAHT-CF is arguably the most moisture-sensitive filament available. Extreme drying protocol required.\n\nDrying protocol (MANDATORY before every print session):\n- Dry at 90-100°C for 12+ hours before first use\n- After ANY exposure to air: dry for 8 hours minimum before printing\n- Use an inline dryer feeding directly to the printer — PAHT-CF absorbs measurable moisture within 15-30 minutes\n- Professional dry cabinet with active dehumidification is strongly recommended for regular use\n- Signs of wet PAHT-CF: violent popping, surface covered in bubbles, filament snaps easily, parts crumble or delaminate catastrophically\n- Molecular sieve desiccant (Type 4A) is required — silica gel is NOT sufficient for this material\n- Vacuum-seal unused portions of the spool immediately after removing from the dryer\n- In humid climates: the window between drying and printing is extremely short. Plan your workflow accordingly\n- Cost of failed prints due to moisture is high — invest in proper drying and storage infrastructure',
      'PAHT-CF is a professional-grade material for industrial applications:\n\nMechanical properties (among the best of any FDM material):\n- Tensile strength: 130-160 MPa\n- Flexural modulus: 9000-12000 MPa\n- Heat deflection temperature: 200-250°C (highest of any common FDM material)\n- Continuous use temperature: 180-200°C\n- Excellent creep resistance under sustained load at elevated temperatures\n\nApplications (industrial/professional):\n- Automotive: engine bay components, heat shields, manifold prototypes\n- Aerospace: structural prototypes, production aids, interior parts\n- Industrial: manufacturing jigs and fixtures for high-temp processes\n- Electronic: high-temp enclosures, connector housings, insulation\n- Oil & gas: prototype fittings and tooling for high-temp/chemical environments\n\nPost-processing:\n- Professional matte black finish — requires no treatment\n- Machinable with standard tools (drill, mill, lathe)\n- Heat-set brass inserts work excellently\n- Cannot be chemically smoothed\n- Parts reach full mechanical properties after 48-72 hours of room-temperature crystallization\n- Annealing at 140-160°C for 4-6 hours further improves heat resistance and dimensional stability',
      '["X1E"]'],

    ['PLA+','eSUN','Enhanced PLA','standard',1,200,230,50,65,0,80,100,0,'brass',0,2,3,1,2,4,0,0,
      'eSUN PLA+ is one of the most popular third-party filaments worldwide. It\'s an enhanced PLA formulation that offers improved impact resistance and toughness compared to standard PLA while maintaining the same ease of printing.\n\nPrint settings:\n- Nozzle: 205-220°C. Slightly higher than basic PLA for best layer adhesion\n- Bed: 55-65°C on smooth or textured PEI\n- Fan: 80-100% for overhangs and bridges\n- Speed: full speed on Bambu printers — PLA+ handles 300-500mm/s well\n- The \"+\" enhancement gives slightly better inter-layer adhesion than standard PLA\n- eSUN PLA+ is very consistent — minimal batch-to-batch variation\n- Available in a huge range of colors at competitive prices\n- Works perfectly in the AMS with no special settings needed',
      'Same storage as standard PLA — sealed bag with desiccant.\n\neSUN ships PLA+ vacuum-sealed with desiccant. Shelf life is 1-2 years sealed.\n\nDrying: 45-50°C for 4-6 hours if you notice popping or stringing.\n\neSUN PLA+ is well-packaged and maintains quality during storage better than some budget brands.',
      'eSUN PLA+ advantages over basic PLA:\n- Approximately 30-40% better impact resistance than standard PLA — less brittle, more forgiving\n- Slightly better flexibility — can handle minor stress without snapping\n- Surface finish is glossy and smooth — comparable to Bambu Lab PLA\n- Colors are vibrant and consistent across batches\n- Sanding and painting work the same as standard PLA\n- Same heat resistance as PLA (55-60°C) — the enhancement is mainly toughness, not temperature\n- eSUN PLA+ is widely considered the best value third-party PLA. It\'s a Bambu community favorite\n- Excellent for: functional prototypes, toys, household items, and anything that might get dropped\n- Still not suitable for high-stress structural parts — use PETG or PA-CF for those',
      '["X1C","P1S","P1P","A1","A1 mini"]'],

    ['PETG','eSUN','Standard','standard',2,230,250,75,85,0,30,60,0,'brass',0,3,3,2,3,4,0,0,
      'eSUN PETG is a reliable third-party PETG option at a competitive price. Good all-round PETG with a wide color selection.\n\nPrint settings:\n- Nozzle: 235-250°C. May need 5°C higher than Bambu PETG for optimal flow\n- Bed: 75-85°C on textured PEI plate\n- Fan: 30-50%\n- Speed: 200-300mm/s. Same as Bambu PETG\n- Stringing: eSUN PETG can string slightly more than Bambu brand — increase retraction by 0.2-0.5mm if needed\n- Works in the AMS without issues\n- Good dimensional accuracy for a budget PETG\n- Available in a wide range of colors including transparent variants',
      'Standard PETG storage — sealed bag with desiccant.\n\nDrying: 50-55°C for 6-8 hours if experiencing stringing or surface quality issues.\n\neSUN PETG ships vacuum-sealed but can absorb moisture within 2 weeks of opening.',
      'eSUN PETG offers solid value:\n- Comparable mechanical properties to Bambu Lab PETG at a lower price\n- Good color range including transparent/translucent options\n- Heat resistance: 80-85°C — same as premium PETG brands\n- Good chemical resistance for functional parts\n- Sanding and painting follow standard PETG guidelines\n- A reliable choice for functional parts, enclosures, and water-resistant applications\n- The price-to-performance ratio makes it a great option for large prints where material cost matters',
      '["X1C","P1S","P1P","A1","A1 mini"]'],

    ['PLA','Polymaker','PolyLite','standard',1,190,230,50,65,0,80,100,0,'brass',0,2,3,1,2,4,0,0,
      'Polymaker PolyLite PLA is a premium PLA filament known for its exceptional color accuracy, consistency, and surface finish. Popular among miniature painters and display model makers for its predictable, high-quality results.\n\nPrint settings:\n- Nozzle: 200-220°C. Standard PLA settings work perfectly\n- Bed: 50-60°C on smooth PEI for best glossy finish\n- Fan: 100% for maximum detail and overhang quality\n- Speed: full speed on Bambu printers\n- Polymaker uses tight ±0.02mm diameter tolerance — excellent consistency\n- The wide color range includes unique specialty colors not available from Bambu Lab\n- Works perfectly in the AMS\n- PolyLite has a slightly smoother surface finish than most PLA brands',
      'Standard PLA storage — sealed bag with desiccant.\n\nPolymaker uses vacuum sealing with desiccant. Excellent packaging quality.\n\nThe consistent diameter means you\'re less likely to encounter flow issues even with slightly moist filament, but drying is still recommended for best results.',
      'PolyLite PLA is the choice for visual quality:\n- Exceptional color accuracy and vibrancy — the colors look exactly as advertised\n- Smooth, glossy surface finish that enhances visual appeal\n- Very popular for miniature painting — the surface takes primer and paint beautifully\n- Consistent diameter means consistent extrusion — fewer blobs and artifacts\n- Polymaker offers unique specialty colors, metallics, and translucents\n- Same PLA mechanical properties as standard PLA — the advantage is purely aesthetic/consistency\n- Great for: display models, miniatures, gifts, decorative items, anything where appearance matters',
      '["X1C","P1S","P1P","A1","A1 mini"]'],

    ['PETG','Polymaker','PolyMax','standard',2,230,250,70,85,0,30,60,0,'brass',0,3,4,2,3,4,0,0,
      'Polymaker PolyMax PETG is a nano-reinforced PETG offering significantly better impact resistance than standard PETG. The nano-reinforcement technology improves toughness without affecting printability.\n\nPrint settings:\n- Nozzle: 230-250°C. Standard PETG settings\n- Bed: 70-85°C on textured PEI\n- Fan: 30-50%\n- Speed: 200-300mm/s\n- Prints like standard PETG with no special requirements\n- The enhanced impact resistance becomes apparent in functional parts — drops that break standard PETG won\'t break PolyMax\n- Works in the AMS without issues\n- Good dimensional accuracy for engineering applications',
      'Standard PETG storage — sealed bag with desiccant.\n\nPolymaker vacuum-seals with desiccant. Good shelf life.\n\nDrying: 50-55°C for 6 hours if needed.',
      'PolyMax PETG advantages:\n- Significantly improved impact resistance over standard PETG — Polymaker claims up to 9x improvement\n- Nano-reinforcement maintains the same clarity and surface finish as standard PETG\n- Heat resistance: 80-85°C — same as standard PETG\n- Excellent choice for functional parts that may experience impacts or drops\n- Great for: protective cases, tool handles, drone parts, outdoor functional parts\n- Chemical resistance: same excellent PETG chemical resistance\n- The price premium over standard PETG is justified for parts where durability matters\n- Comparable to Bambu PETG in printability but with better mechanical performance',
      '["X1C","P1S","P1P","A1","A1 mini"]'],

    ['PLA','Prusament','Standard','standard',1,200,230,50,65,0,80,100,0,'brass',0,2,3,1,2,4,0,0,
      'Prusament PLA is Prusa Research\'s premium filament line, known for exceptional quality control and ±0.02mm diameter tolerance. Each spool comes with a QR code linking to actual measured production data for that specific spool.\n\nPrint settings:\n- Nozzle: 205-220°C. Standard PLA settings\n- Bed: 55-65°C on smooth PEI\n- Fan: 100% for best overhangs\n- Speed: full speed on Bambu printers\n- The exceptional diameter tolerance means extremely consistent extrusion\n- Colors are well-calibrated and match the online color swatches accurately\n- Works perfectly in the AMS\n- Prusament is considered the \"gold standard\" of PLA quality by many users',
      'Standard PLA storage — sealed bag with desiccant.\n\nPrusament uses high-quality vacuum sealing. Each spool includes a desiccant pack and a QR code for quality data.\n\nPrusament PLA is known for excellent moisture resistance within the PLA category — maintains quality well even with moderate exposure.',
      'Prusament PLA quality advantages:\n- ±0.02mm diameter tolerance — best-in-class consistency\n- Each spool has traceable production data (QR code → web dashboard showing diameter measurements)\n- Colors are meticulously calibrated — the online swatch matches the real filament very closely\n- Beautiful surface finish with consistent gloss\n- Excellent for precision parts — the consistent diameter means consistent dimensions\n- Available in standard and specialty colors\n- Higher price is justified for quality-critical prints\n- Great for: precision prototypes, display models, gifts, dimensional test parts\n- The consistent quality makes Prusament a reliable reference filament for dialing in printer settings',
      '["X1C","P1S","P1P","A1","A1 mini"]'],

    ['PLA','Hatchbox','Standard','standard',1,190,220,50,65,0,80,100,0,'brass',0,2,3,1,2,4,0,0,
      'Hatchbox PLA is one of the most popular budget PLA filaments, especially in the US market. It offers good quality at an affordable price point with a wide range of available colors.\n\nPrint settings:\n- Nozzle: 195-215°C. Hatchbox PLA tends to print well at slightly lower temps\n- Bed: 50-60°C on smooth PEI\n- Fan: 80-100%\n- Speed: full speed on Bambu printers\n- Hatchbox spools work well in the AMS\n- Color consistency between batches is good but not as precise as premium brands\n- The spool design is standard 200mm diameter — fits all standard holders and AMS\n- Very popular on Amazon — easy to find and usually available with 1-day shipping',
      'Standard PLA storage. Hatchbox uses basic vacuum sealing.\n\nHatchbox PLA handles moisture reasonably well — typical for standard PLA.\n\nDrying: 45-50°C for 4 hours if needed.',
      'Hatchbox PLA is the \"reliable budget choice\":\n- Good print quality for the price — suitable for most general-purpose printing\n- Wide color range with good availability\n- Colors may vary slightly between batches (more so than premium brands)\n- Good for: prototyping, household items, decorative prints, learning and practice\n- Same mechanical properties as standard PLA — the budget pricing doesn\'t compromise basic properties\n- Very large community using Hatchbox — easy to find settings, tips, and troubleshooting advice online\n- One of the best options for beginners due to price and availability\n- Not the best choice for precision parts or color-critical applications — use Prusament or Polymaker for those',
      '["X1C","P1S","P1P","A1","A1 mini"]'],

    ['PLA','Sunlu','Standard','standard',1,190,220,50,60,0,80,100,0,'brass',0,2,3,1,2,3,0,0,
      'SUNLU PLA is a budget-friendly filament option popular for its low price point and decent print quality. SUNLU also manufactures popular filament dryers, making them a well-known brand in the 3D printing ecosystem.\n\nPrint settings:\n- Nozzle: 195-215°C. Standard PLA settings\n- Bed: 50-60°C on smooth PEI\n- Fan: 80-100%\n- Speed: full speed on Bambu printers\n- Quality is adequate for prototyping and non-critical prints\n- Color accuracy can vary between batches — order from the same batch for matching colors\n- Works in the AMS without issues\n- Very competitive pricing, especially when purchased in multi-pack bundles',
      'Standard PLA storage. SUNLU uses vacuum sealing with desiccant.\n\nSUNLU PLA handles storage adequately — typical PLA moisture characteristics.\n\nPro tip: SUNLU also makes one of the most popular filament dryers (SUNLU S2) which works well with all brands.',
      'SUNLU PLA is best for price-sensitive applications:\n- Lowest price point among mainstream brands — great for prototyping and practice\n- Adequate print quality for non-critical applications\n- Good for: learning, rapid prototyping, test prints, large prints where material cost matters\n- Color accuracy is less consistent than premium brands — acceptable for most uses\n- Layer adhesion is generally good but slightly less consistent than Bambu Lab or Prusament\n- SUNLU offers PLA, PLA+, PETG, silk PLA, and other varieties at budget prices\n- Not recommended for: display models where surface quality is critical, precision parts, or production use\n- A solid choice when you need a lot of filament at a low cost',
      '["X1C","P1S","P1P","A1","A1 mini"]'],

    ['PETG','Overture','Standard','standard',2,230,250,70,85,0,30,60,0,'brass',0,3,3,2,3,4,0,0,
      'Overture PETG is a well-packaged budget PETG option that ships vacuum-sealed with desiccant and includes a build surface sheet in each box. Known for reliable quality and good value.\n\nPrint settings:\n- Nozzle: 235-250°C. Standard PETG settings\n- Bed: 75-85°C on textured PEI\n- Fan: 30-50%\n- Speed: 200-300mm/s\n- Overture PETG has good dimensional accuracy for a budget option\n- Ships vacuum-sealed with individual desiccant packs — better packaging than many budget brands\n- Each box includes a build surface sheet — a nice bonus for beginners\n- Works in the AMS without issues\n- Consistent quality between batches',
      'Standard PETG storage — sealed bag with desiccant.\n\nOverture packages very well — vacuum-sealed with desiccant. Some of the best packaging in the budget segment.\n\nDrying: 50-55°C for 6 hours if needed.',
      'Overture PETG is a reliable budget PETG:\n- Good mechanical properties at a competitive price\n- Ships in excellent packaging — vacuum-sealed with desiccant and build surface included\n- Good for: functional parts, enclosures, water-resistant applications, and general engineering use\n- Quality is comparable to eSUN PETG — both are solid budget PETG options\n- The included build surface sheet is a nice bonus, though Bambu users will use their own plates\n- Heat resistance: 80-85°C — standard PETG performance\n- Available in a good range of colors including transparent\n- A safe choice for users who want PETG without paying premium prices',
      '["X1C","P1S","P1P","A1","A1 mini"]'],

    ['PLA','Fillamentum','Crystal Clear','specialty',2,195,235,50,65,0,80,100,0,'brass',0,2,3,1,2,4,0,0,
      'Fillamentum Crystal Clear is a specialty translucent PLA designed for light diffusers, lampshades, and decorative applications where light transmission is desired. The Czech-made filament is known for its premium quality and unique color selection.\n\nPrint settings:\n- Nozzle: 200-230°C. Higher temps improve transparency slightly\n- Bed: 55-60°C on smooth PEI for best bottom surface clarity\n- Fan: 80-100% for best overhangs. Reduce to 60% for slightly better transparency\n- Speed: REDUCE to 150-250mm/s for best optical clarity. Fast printing introduces more air = less transparent\n- Layer height: lower is better for transparency. 0.1-0.15mm for best light transmission\n- 100% infill with rectilinear pattern gives the most uniform light diffusion\n- Avoid crossing perimeters — each crossing creates a visible mark in translucent material\n- The \"crystal clear\" effect is best with thin walls (1-2 perimeters) and backlit\n- Vase mode (spiralize outer contour) produces the most transparent single-wall prints',
      'Standard PLA storage. Fillamentum uses high-quality vacuum sealing.\n\nFillamentum is a Czech manufacturer known for excellent quality control. The Crystal Clear line maintains consistency well in storage.\n\nDrying: 45-50°C for 4 hours if needed. Moisture is less visible in transparent PLA but still affects surface quality.',
      'Crystal Clear PLA for light and decorative applications:\n- Best for: lampshades, light diffusers, ornaments, vases, decorative panels, window decorations\n- 100% infill gives a smooth, gem-like appearance when backlit\n- Vase mode (single wall spiral) produces beautiful translucent containers\n- The transparency is not optical-grade clear (that\'s impossible with FDM) but creates beautiful diffused light effects\n- Multiple colors available in the Crystal Clear line — each creates different light effects\n- Layer lines become part of the aesthetic — they create light patterns when illuminated\n- Can be combined with LED strips for custom lighting fixtures\n- Post-processing: light sanding + clear coat spray can improve transparency slightly\n- Fillamentum is a premium European brand — the price is higher but quality is exceptional\n- Also great for photography light boxes and display cases',
      '["X1C","P1S","P1P","A1","A1 mini"]'],

    ['PLA','add:north','E-PLA','standard',1,195,225,50,65,0,80,100,0,'brass',0,2,3,1,2,4,0,0,
      'add:north E-PLA is a premium Nordic (Swedish) PLA filament known for its exceptional color accuracy and environmentally conscious manufacturing. Made in Sweden with a focus on sustainability and quality.\n\nPrint settings:\n- Nozzle: 200-220°C. Standard PLA settings\n- Bed: 50-60°C on smooth PEI\n- Fan: 80-100%\n- Speed: full speed on Bambu printers\n- add:north uses tight diameter tolerance — excellent consistency\n- The color range is curated rather than massive — each color is carefully formulated\n- Colors are inspired by Scandinavian design — muted, sophisticated palettes alongside vibrant options\n- Works perfectly in the AMS\n- E-PLA stands for \"Easy PLA\" — optimized for hassle-free printing',
      'Standard PLA storage. add:north uses high-quality vacuum sealing.\n\nSwedish manufacturing with quality control throughout the process. Good shelf life and moisture resistance for PLA.\n\nDrying: 45-50°C for 4 hours if needed.',
      'add:north E-PLA is a premium European PLA:\n- Scandinavian design-inspired color palette — unique colors you won\'t find from Asian manufacturers\n- Manufactured in Sweden with environmental consciousness\n- Excellent color consistency — batch-to-batch variation is minimal\n- The \"Easy\" in E-PLA means it\'s formulated for reliable, hassle-free printing\n- Great for: design projects, architectural models, display pieces, gifts\n- Comparable quality to Prusament and Polymaker PolyLite — different color options\n- Price is premium but justified for the quality and sustainability focus\n- Popular in the Nordic 3D printing community\n- add:north also makes specialty PLA variants (silk, matte, metallic) worth exploring\n- Supporting European filament manufacturing vs. imported alternatives',
      '["X1C","P1S","P1P","A1","A1 mini"]'],

    ['PETG','Fiberlogy','Easy PETG','standard',2,220,250,70,85,0,30,60,0,'brass',0,3,3,2,3,4,0,0,
      'Fiberlogy Easy PETG is a Polish-made PETG specifically formulated for reduced stringing — the most common complaint with standard PETG. The \"Easy\" designation means the formulation is optimized for printability.\n\nPrint settings:\n- Nozzle: 225-245°C. Slightly lower range than some PETG brands\n- Bed: 70-85°C on textured PEI\n- Fan: 30-60%. Can use higher fan than typical PETG due to the Easy formulation\n- Speed: 200-300mm/s\n- The key selling point: significantly less stringing than standard PETG\n- Retraction settings can be less aggressive than typical PETG — the Easy formulation handles ooze better\n- Works in the AMS without issues\n- Good dimensional accuracy — Fiberlogy has tight quality control\n- Available in a good range of colors from the Polish manufacturer',
      'Standard PETG storage — sealed bag with desiccant.\n\nFiberlogy uses quality packaging with vacuum sealing and desiccant.\n\nDrying: 50-55°C for 6 hours if stringing becomes excessive.\n\nPolish manufacturing with good quality control. Consistent product.',
      'Fiberlogy Easy PETG advantages:\n- Significantly reduced stringing compared to standard PETG — this is the main selling point\n- If you\'ve struggled with PETG stringing, Easy PETG may solve your problems\n- Mechanical properties are standard PETG — the \"Easy\" formulation doesn\'t compromise strength\n- Heat resistance: 80-85°C — standard PETG\n- Good for: users new to PETG who want a more forgiving experience, functional parts, enclosures\n- The reduced stringing saves post-processing time — less cleanup needed\n- Fiberlogy also makes standard PETG, PA, and other engineering filaments\n- European manufacturing (Poland) — good quality control and reasonable shipping within EU/Europe\n- Comparable pricing to eSUN and Overture with potentially better print experience due to reduced stringing\n- A great \"first PETG\" for users transitioning from PLA',
      '["X1C","P1S","P1P","A1","A1 mini"]'],

    ['PLA','Bambu Lab','Tough+','standard',1,200,230,50,65,0,80,100,0,'brass',0,2,4,2,2,5,0,0,
      'PLA Tough+ is an enhanced PLA formulation with toughness comparable to ABS and 2x the layer adhesion of standard PLA. It bridges the gap between easy-to-print PLA and strong engineering materials.\n\nPrint settings:\n- Same temperatures as standard PLA: 200-220°C nozzle, 55-60°C bed\n- Fan: 80-100% for best surface quality\n- Speed: full speed on Bambu printers — same as standard PLA\n- The enhanced toughness means parts can handle impacts that would shatter standard PLA\n- Layer adhesion is significantly improved — parts don\'t delaminate as easily along layer lines\n- No enclosure needed — prints exactly like standard PLA',
      'Same storage as standard PLA — sealed bag with desiccant.\n\nDrying: 45-50°C for 4-6 hours if needed.\n\nPLA Tough+ handles moisture similarly to standard PLA.',
      'PLA Tough+ advantages:\n- Toughness comparable to ABS without the warping, fumes, or enclosure requirement\n- 2x layer adhesion of standard PLA — parts are much more resistant to delamination\n- Great for: functional parts, mechanical components, snap-fits, clips, brackets\n- Same heat resistance as PLA (~55-60°C) — the improvement is toughness, not temperature\n- Can replace PETG in many applications while being easier to print\n- Available in multiple colors including Black, White, Gray, Cyan, Orange\n- The best PLA variant for functional parts that need to survive real-world use',
      '["X1C","P1S","P1P","P2S","A1","A1 mini","H2S","H2D","H2C"]'],

    ['PLA','Bambu Lab','Silk','specialty',1,200,230,50,65,0,80,100,0,'brass',0,2,3,1,2,3,0,0,
      'PLA Silk has a glossy, silk-like surface finish that catches light beautifully. The filament produces prints with a metallic, pearlescent sheen that looks premium without any post-processing.\n\nPrint settings:\n- Nozzle: 200-220°C. Standard PLA settings\n- Bed: 55-60°C on smooth PEI for maximum gloss\n- Fan: 80-100%\n- Speed: full speed — no reduction needed\n- The silk effect is best on large, smooth surfaces — small details may not show the sheen as well\n- Print with the smooth PEI plate (Cool Plate) for maximum bottom surface gloss',
      'Same storage as standard PLA. The silk additives make the filament slightly more sensitive to moisture — dry if you notice inconsistent sheen.\n\nDrying: 45-50°C for 4-6 hours.',
      'Silk PLA applications:\n- Decorative vases, ornaments, and display pieces look stunning\n- The silk sheen hides layer lines better than basic PLA\n- Available in Gold, Silver, Copper, Green, Purple and more\n- Slightly weaker and more brittle than standard PLA due to silk additives\n- Not recommended for functional parts — purely aesthetic material\n- The mildly abrasive silk particles can cause very slight nozzle wear — stainless steel nozzle recommended for heavy use\n- Gorgeous for gift items and decorative prints',
      '["X1C","P1S","P1P","P2S","A1","A1 mini","H2S","H2D","H2C"]'],

    ['PLA','Bambu Lab','Silk+','specialty',1,200,230,50,65,0,80,100,0,'brass',0,2,3,1,2,4,0,0,
      'PLA Silk+ is an improved version of PLA Silk with better layer adhesion and printability while maintaining the glossy silk-like finish. 13 color variants available with enhanced consistency.\n\nPrint settings are identical to standard PLA — no special settings needed.',
      'Same as standard PLA storage. Vacuum-sealed with desiccant.',
      'Silk+ improvements over original Silk:\n- Better layer adhesion — parts are stronger and less prone to splitting\n- More consistent silk effect across different print speeds\n- 13 color variants for maximum design flexibility\n- The improved formula prints more reliably in the AMS\n- Same beautiful silk sheen on surfaces, better structural integrity\n- Choose Silk+ over original Silk for improved reliability',
      '["X1C","P1S","P1P","P2S","A1","A1 mini","H2S","H2D","H2C"]'],

    ['PLA','Bambu Lab','Silk Multi-Color','specialty',2,200,230,50,65,0,80,100,0,'brass',0,2,3,1,2,3,0,0,
      'PLA Silk Multi-Color features gradient color transitions within a single spool. As the filament is extruded, colors gradually shift, creating beautiful multi-tone effects without needing an AMS or multiple spools.\n\nPrint settings:\n- Standard PLA settings: 200-220°C, 55-60°C bed\n- Taller prints show more color transitions\n- Vase mode (spiralize outer contour) shows the gradient beautifully\n- 10 gradient combinations available',
      'Same as standard PLA storage.',
      'Silk Multi-Color applications:\n- Single-spool multi-color effect — no AMS needed!\n- 10 gradient combinations to choose from\n- Best for tall vases, decorative items, and organic shapes\n- The gradient pattern is random/semi-random per spool — each print is unique\n- Vase mode prints look especially stunning with the color transitions\n- Cannot control exactly where color changes happen — embrace the randomness\n- Great for gift items where each one is unique',
      '["X1C","P1S","P1P","P2S","A1","A1 mini","H2S","H2D","H2C"]'],

    ['PLA','Bambu Lab','Basic Gradient','standard',1,190,230,45,65,0,80,100,0,'brass',0,2,3,1,2,4,0,0,
      'PLA Basic Gradient features smooth color transitions within a single spool, using the standard Basic PLA formula. 8 gradient options provide multi-tone prints from a single spool.\n\nPrints identically to PLA Basic — no special settings needed.',
      'Same as standard PLA storage.',
      'Gradient PLA applications:\n- Multi-tone prints without AMS — great for single-spool printers\n- 8 gradient combinations available\n- Standard PLA mechanical properties — functional and decorative\n- The gradient transitions are gradual and natural-looking\n- Great for artistic and decorative prints',
      '["X1C","P1S","P1P","P2S","A1","A1 mini","H2S","H2D","H2C"]'],

    ['PLA','Bambu Lab','Marble','specialty',2,200,230,50,65,0,80,100,0,'brass',0,2,3,1,2,3,0,0,
      'PLA Marble creates a stone-like marbled appearance in prints, mimicking the look of natural marble or granite. Contains mineral-like particles that create realistic stone textures.\n\nPrint settings:\n- Standard PLA settings: 200-220°C nozzle, 55-60°C bed\n- Lower speeds (200mm/s) can produce more consistent marble patterns\n- The marble effect varies with extrusion rate — experiment with speed for different patterns\n- Available in White Marble and Red Granite variants',
      'Same as standard PLA storage.',
      'Marble PLA applications:\n- Decorative items that mimic stone: busts, statues, planters, bookends\n- White Marble variant looks like Carrara marble\n- Red Granite variant mimics natural red granite\n- The marble pattern is created by mineral particles in the PLA matrix\n- Each print has a unique pattern — no two are identical\n- Very slightly abrasive — stainless steel nozzle recommended for heavy use\n- 100% infill shows the marble effect throughout the part\n- Stunning for architectural models and decorative displays',
      '["X1C","P1S","P1P","P2S","A1","A1 mini","H2S","H2D","H2C"]'],

    ['PLA','Bambu Lab','Metal','specialty',2,200,230,50,65,0,80,100,0,'brass',0,2,3,1,2,3,0,0,
      'PLA Metal contains fine metallic particles that give prints a realistic metal-like appearance and weight. Available in 5 metallic finishes that mimic real metals.\n\nPrint settings:\n- Standard PLA settings work well\n- The metallic particles are mildly abrasive — stainless steel nozzle recommended\n- Slower speeds produce a more consistent metallic finish\n- The parts feel heavier than standard PLA due to the metal particles',
      'Same as standard PLA storage.',
      'Metal PLA applications:\n- Decorative items that look and feel like metal\n- Jewelry prototypes, awards, figurines, cosplay props\n- 5 metallic finishes available — Bronze, Copper, Silver, Gold, Iron\n- The metal particles add real weight — parts feel substantial\n- Can be polished with fine sandpaper for a more metallic sheen\n- Stainless steel nozzle recommended due to abrasive metallic particles\n- Not actually metal — PLA properties for strength and heat resistance\n- Great for prototyping metal parts before actual metalwork',
      '["X1C","P1S","P1P","P2S","A1","A1 mini","H2S","H2D","H2C"]'],

    ['PLA','Bambu Lab','Sparkle','specialty',1,200,230,50,65,0,80,100,0,'brass',0,2,3,1,2,3,0,0,
      'PLA Sparkle contains glitter/sparkle particles that create an eye-catching sparkling effect under light. 6 sparkle variants available.\n\nStandard PLA settings — no special requirements. The sparkle particles are very small and don\'t affect printability.',
      'Same as standard PLA storage.',
      'Sparkle PLA highlights:\n- Eye-catching glitter effect visible under any lighting\n- 6 color/sparkle combinations available\n- The sparkle effect is visible in all lighting conditions but especially stunning under direct light\n- Great for: ornaments, holiday decorations, phone cases, decorative items\n- Minimal abrasiveness — brass nozzle is fine for occasional use\n- Standard PLA mechanical properties — the sparkle is purely visual\n- Combine with AMS and solid-color PLA for multi-color sparkle prints',
      '["X1C","P1S","P1P","P2S","A1","A1 mini","H2S","H2D","H2C"]'],

    ['PLA','Bambu Lab','Galaxy','specialty',1,200,230,50,65,0,80,100,0,'brass',0,2,3,1,2,3,0,0,
      'PLA Galaxy features a deep, glossy finish with embedded sparkle particles that create a galaxy/night-sky effect. 4 options available with different color bases.\n\nStandard PLA settings — prints like basic PLA.',
      'Same as standard PLA storage.',
      'Galaxy PLA highlights:\n- Deep, glossy finish with sparkle creates a night-sky/galaxy effect\n- 4 color options — dark base colors with embedded sparkle\n- Looks stunning on large, smooth surfaces — vases, bowls, decorative panels\n- The glossy finish hides layer lines better than matte variants\n- Great for display pieces and decorative items\n- Standard PLA mechanical properties',
      '["X1C","P1S","P1P","P2S","A1","A1 mini","H2S","H2D","H2C"]'],

    ['PLA','Bambu Lab','Translucent','specialty',1,195,230,50,65,0,80,100,0,'brass',0,2,3,1,2,4,0,0,
      'PLA Translucent allows light to pass through printed parts, making it ideal for lampshades, light diffusers, and decorative items. 10 translucent colors available.\n\nPrint settings:\n- Standard PLA temperatures\n- For best translucency: use thin walls (1-2 perimeters), low layer height (0.1-0.15mm)\n- 100% infill with rectilinear pattern gives uniform light diffusion\n- Vase mode (spiralize) produces the most transparent single-wall prints',
      'Same as standard PLA storage. Moisture can reduce translucency — keep dry.',
      'Translucent PLA applications:\n- Lampshades and light diffusers — the primary use case\n- Decorative panels and ornaments with backlighting\n- LED enclosures and light guides\n- 10 colors available for different lighting effects\n- FDM printing can\'t achieve optical clarity but creates beautiful diffused light\n- Layer lines become part of the aesthetic — they create light patterns\n- Combine with LED strips for custom lighting fixtures\n- 100% infill for uniform light transmission, variable infill for light patterns',
      '["X1C","P1S","P1P","P2S","A1","A1 mini","H2S","H2D","H2C"]'],

    ['PLA','Bambu Lab','Wood','composite',2,200,230,50,65,0,80,100,0,'stainless_steel',1,2,3,1,2,3,0,0,
      'PLA Wood contains fine wood powder mixed into the PLA base, giving prints a realistic wood-like appearance, texture, and even smell. 6 wood tone colors available.\n\nPrint settings:\n- Nozzle: 200-220°C. Higher temps darken the wood color slightly\n- Use 0.4mm or larger nozzle — wood particles can clog smaller nozzles\n- Stainless steel nozzle recommended — wood particles are mildly abrasive\n- Speed: 200-300mm/s for consistent wood grain effect\n- The \"wood grain\" pattern varies naturally with extrusion, creating a unique look',
      'Same as standard PLA storage. Wood-fill PLA can absorb moisture through the wood particles — dry if surface quality degrades.',
      'Wood PLA applications:\n- Boxes, frames, figurines, and decorative items with wood-like appearance\n- 6 wood tone colors from light birch to dark walnut\n- Can be sanded and stained like real wood for finishing\n- Wood PLA smells faintly of wood during printing — pleasant\n- Higher nozzle temps produce darker coloring — use this to create faux wood grain effects\n- Very slightly heavier than standard PLA due to wood content\n- The wood particles create a matte, natural-looking surface texture\n- NOT structural like real wood — PLA mechanical properties\n- Stainless steel nozzle recommended for the mildly abrasive wood particles',
      '["X1C","P1S","P1P","P2S","A1","A1 mini","H2S","H2D","H2C"]'],

    ['PLA','Bambu Lab','Glow','specialty',2,200,230,50,65,0,80,100,0,'stainless_steel',1,2,3,1,2,3,0,0,
      'PLA Glow contains luminous (glow-in-the-dark) powder that absorbs light and glows in darkness. 5 glow colors available. The glow effect lasts several hours after light exposure.\n\nPrint settings:\n- Standard PLA temps: 200-220°C, 55-60°C bed\n- Stainless steel nozzle recommended — glow powder is abrasive!\n- 0.4mm or larger nozzle to prevent clogging\n- Thicker walls (3+) produce brighter glow — more material = more luminous powder',
      'Same as standard PLA storage. Glow powder is stable in storage.',
      'Glow PLA applications:\n- Night lights, switch covers, emergency markers, decorative items\n- 5 glow colors: green (brightest), blue, orange, pink, yellow\n- Green glow is the brightest and longest lasting (hours of glow)\n- Charge under bright light (sunlight or LED) for 10-30 minutes for maximum glow\n- Thicker parts glow brighter — more material = more luminous particles\n- ABRASIVE: stainless steel nozzle strongly recommended, hardened steel for heavy use\n- The glow effect fades gradually but recharges with any light exposure\n- Great for kids\' room decorations, camping accessories, Halloween items\n- Works well as accent material in multi-color prints with AMS',
      '["X1C","P1S","P1P","P2S","A1","A1 mini","H2S","H2D","H2C"]'],

    ['PLA','Bambu Lab','Aero','specialty',2,200,230,50,65,0,80,100,0,'brass',0,2,2,1,2,3,0,0,
      'PLA Aero is a lightweight/foaming PLA that expands slightly during printing, creating a foamed internal structure. Parts are up to 30-40% lighter than standard PLA at the same volume.\n\nPrint settings:\n- Standard PLA temperatures but may need slight flow rate adjustment\n- The foaming effect is temperature-dependent — higher temps = more expansion\n- Layer height: 0.2mm works well\n- Infill: lower percentages work well since the material self-foams\n- Available in White and Gray',
      'Same as standard PLA storage. The foaming agent is moisture-stable.',
      'Aero PLA applications:\n- Lightweight parts: drone components, RC airplane parts, costume props\n- 30-40% weight reduction vs standard PLA at same dimensions\n- The foamed structure creates a unique matte surface texture\n- Slightly lower strength than solid PLA due to internal foam structure\n- Great for large, lightweight models where weight matters\n- Excellent for cosplay armor and props — lighter to wear\n- The foaming effect can be controlled somewhat by adjusting temperature\n- Not suitable for precision parts — the foaming causes slight dimensional variability',
      '["X1C","P1S","P1P","P2S","A1","A1 mini","H2S","H2D","H2C"]'],

    ['PETG','Bambu Lab','HF (High Flow)','standard',2,220,260,70,90,0,30,50,0,'brass',0,3,3,2,3,4,0,0,
      'PETG HF (High Flow) is a speed-optimized PETG formulation designed for maximum print speed without sacrificing quality. The high-flow formula allows faster extrusion rates and higher speeds than standard PETG.\n\nPrint settings:\n- Nozzle: 230-250°C\n- Bed: 75-85°C on textured PEI\n- Fan: 30-50%\n- Speed: 250-400mm/s — faster than standard PETG\n- The high-flow formula reduces pressure advance requirements\n- 14 colors available — wider selection than standard PETG\n- Water-resistant properties — same as standard PETG',
      'Standard PETG storage. High-flow formula has similar moisture sensitivity to standard PETG.',
      'PETG HF advantages:\n- Print faster than standard PETG without quality loss — optimized for speed\n- 14 color options for more design flexibility\n- Same mechanical properties as standard PETG — strength, heat resistance, chemical resistance\n- Water-resistant — suitable for outdoor and wet applications\n- The high-flow formula means less stringing at high speeds\n- Best choice for production-speed PETG printing on H2 series printers\n- Works well in AMS at higher retraction speeds than standard PETG',
      '["X1C","P1S","P1P","P2S","A1","A1 mini","H2S","H2D","H2C"]'],

    ['PETG','Bambu Lab','Translucent','specialty',2,220,260,70,90,0,30,50,0,'brass',0,3,3,2,3,4,0,0,
      'PETG Translucent leverages PETG\'s natural transparency for light-transmission applications. 8 translucent color options available. PETG has better natural clarity than PLA Translucent.\n\nPrint settings:\n- Same as standard PETG: 230-245°C nozzle, 75-85°C bed\n- For best translucency: thin walls, low layer height (0.1-0.15mm), slow speed\n- 100% infill for uniform light diffusion\n- Textured PEI plate still required — translucent PETG bonds aggressively to smooth PEI',
      'Standard PETG storage. Moisture causes cloudiness — keep dry for best transparency.',
      'Translucent PETG applications:\n- Lampshades, light diffusers, LED enclosures — PETG is more heat-resistant than PLA Translucent\n- Better natural clarity than PLA Translucent\n- 8 color options for different lighting effects\n- PETG\'s higher heat resistance (80-85°C) means it can be used near warm LEDs safely\n- Water-resistant — suitable for outdoor lighting fixtures\n- Chemical resistance means it can be cleaned easily\n- 100% infill gives the most uniform light transmission',
      '["X1C","P1S","P1P","P2S","A1","A1 mini","H2S","H2D","H2C"]'],

    ['ABS-GF','Bambu Lab','Glass Fiber','composite',3,240,270,90,110,0,0,30,1,'hardened_steel',1,2,5,1,5,4,0,0,
      'ABS reinforced with glass fibers for increased stiffness and dimensional stability. Glass fibers provide higher stiffness than standard ABS with better heat resistance.\n\nCRITICAL: Hardened steel nozzle required — glass fibers are extremely abrasive.\n\nPrint settings:\n- Nozzle: 245-265°C\n- Bed: 100-110°C\n- Fan: 0-20%\n- Enclosure required — same as standard ABS\n- Speed: 150-250mm/s\n- Glass fibers are even more abrasive than carbon fibers — hardened steel is mandatory',
      'Same as ABS storage — relatively low moisture sensitivity. Dry at 60°C for 4h if needed.',
      'ABS-GF properties:\n- Very stiff — glass fibers add rigidity beyond standard ABS\n- Better dimensional stability and less warping than standard ABS\n- Heat resistance: 100-110°C — slightly better than unfilled ABS\n- Glass fibers are HIGHLY abrasive — hardened steel nozzle wears faster than with CF\n- The glass fibers create a rough, matte surface texture\n- Cannot be acetone smoothed as effectively as standard ABS — the GF particles resist smoothing\n- Great for: structural brackets, electronic enclosures, automotive parts\n- Stronger than standard ABS in bending and compression',
      '["X1C","X1E","P2S","H2S","H2D","H2C"]'],

    ['ASA','Bambu Lab','Aero','specialty',3,230,260,90,110,0,0,30,1,'brass',0,2,3,2,5,4,0,1,
      'ASA Aero is a lightweight/foaming ASA formulation that produces UV-resistant parts with reduced weight. Combines ASA\'s excellent outdoor durability with the weight savings of foaming technology.\n\nPrint settings:\n- Same as standard ASA: 240-250°C nozzle, 100-110°C bed, enclosure required\n- The foaming effect is temperature-dependent\n- Available in White',
      'Same as standard ASA storage.',
      'ASA Aero applications:\n- Lightweight outdoor parts — UV resistant + weight reduction\n- Drone components, outdoor enclosures, automotive trim\n- 30-40% lighter than solid ASA at same dimensions\n- Maintains ASA\'s UV resistance — won\'t yellow in sunlight\n- Can be acetone smoothed like standard ASA\n- Slightly lower strength than solid ASA due to internal foam structure\n- Great for large outdoor parts where weight matters',
      '["X1C","X1E","P2S","H2S","H2D","H2C"]'],

    ['ASA-CF','Bambu Lab','Carbon Fiber','composite',3,240,270,90,110,0,0,30,1,'hardened_steel',1,2,5,1,5,4,0,1,
      'ASA reinforced with carbon fibers for increased stiffness and UV resistance. Combines ASA\'s outdoor durability with carbon fiber\'s rigidity.\n\nCRITICAL: Hardened steel nozzle required.\n\nPrint settings:\n- Nozzle: 245-265°C\n- Bed: 100-110°C, enclosure required\n- Fan: 0-20%\n- Speed: 150-250mm/s',
      'Same as standard ASA storage. CF content slightly increases moisture absorption.',
      'ASA-CF applications:\n- UV-resistant structural outdoor parts — the best of both worlds\n- Drone frames, automotive exterior parts, outdoor equipment housings\n- Very stiff and dimensionally stable in sunlight and weather\n- Hardened steel nozzle mandatory — carbon fibers are abrasive\n- Professional matte black finish with UV stability\n- Excellent for: outdoor functional parts that need stiffness and weather resistance\n- Can be acetone smoothed but with less effect than unfilled ASA',
      '["X1C","X1E","P2S","H2S","H2D","H2C"]'],

    ['TPU','Bambu Lab','AMS Compatible','flexible',3,210,240,40,60,0,50,80,0,'brass',0,3,2,5,2,3,0,0,
      'TPU formulated specifically for reliable feeding through the AMS system. Standard TPU cannot be used in the AMS due to its flexibility, but this formula is stiffer enough to feed through the PTFE tubes while still producing flexible parts.\n\nPrint settings:\n- Nozzle: 220-235°C\n- Bed: 45-55°C\n- Fan: 50-80%\n- Speed: 60-100mm/s — faster than standard TPU\n- Retraction: minimal but possible (0.3-0.5mm)\n- CAN be used in the AMS — this is the key feature\n- Available in Black and White',
      'Same as standard TPU storage — moderately moisture-sensitive. Dry at 50°C for 4-6 hours.',
      'AMS-compatible TPU:\n- The ONLY TPU that works reliably in the AMS\n- Enables multi-material prints combining rigid and flexible parts via AMS\n- Slightly stiffer than standard TPU 95A — Shore hardness around 95-98A\n- Still produces flexible, elastic parts — just firm enough for AMS feeding\n- Perfect for: rigid+flex multi-material prints, overmolding effects, soft-touch elements\n- Standard TPU 95A remains better for maximum flexibility if you can feed directly\n- Available in Black and White',
      '["X1C","P1S","P2S","A1","A1 mini","H2S","H2D","H2C"]'],

    ['TPU 95A','Bambu Lab','HF (High Flow)','flexible',3,210,240,40,60,0,50,80,0,'brass',0,3,2,5,2,3,0,0,
      'TPU 95A HF (High Flow) is a speed-optimized TPU formulation. While standard TPU is limited to 30-80mm/s, the HF formula allows slightly faster printing while maintaining the same Shore 95A hardness and flexibility.\n\nPrint settings:\n- Same as standard TPU but can push 80-120mm/s more reliably\n- Still use external spool holder — NOT for AMS (use TPU AMS Compatible for that)\n- Retraction: 0-0.3mm\n- Available in Black',
      'Same as standard TPU storage.',
      'TPU 95A HF advantages:\n- Faster printing than standard TPU 95A — high-flow formula reduces backpressure\n- Same Shore 95A flexibility — phone cases, gaskets, bumpers\n- Reduced printing time for flexible parts\n- Still requires direct feeding — NOT for AMS use\n- Better flow consistency at higher speeds = smoother surface finish\n- Use this over standard TPU 95A when speed matters',
      '["X1C","P1S","P1P","P2S","A1","A1 mini","H2S","H2D","H2C"]'],

    ['TPU 90A','Bambu Lab','Soft','flexible',3,210,240,40,60,0,50,80,0,'brass',0,3,1,5,2,3,0,0,
      'TPU 90A is a softer, more flexible variant than the standard TPU 95A. The lower Shore hardness (90A vs 95A) produces parts that feel noticeably softer and more elastic.\n\nPrint settings:\n- Same as TPU 95A: 220-235°C nozzle, 45-55°C bed\n- Speed: SLOWER than 95A — 30-60mm/s maximum. Softer = harder to push through extruder\n- Retraction: DISABLE completely\n- External spool holder only — NOT for AMS\n- Available in Black',
      'Same as standard TPU storage — moderately moisture-sensitive.',
      'TPU 90A applications:\n- Softer than 95A — noticeably more flexible and elastic\n- Great for: cushioning, comfort pads, soft grips, protective bumpers\n- Shore 90A ≈ pencil eraser firmness\n- More challenging to print than 95A — requires slower speeds\n- Direct drive extruder (all Bambu printers) essential\n- The softer material is more prone to stringing — accept some stringing\n- Excellent for wearable items like watch bands and bracelet inserts',
      '["X1C","P1S","P1P","P2S","A1","A1 mini","H2S","H2D","H2C"]'],

    ['TPU 85A','Bambu Lab','Extra Soft','flexible',4,210,240,40,60,0,50,80,0,'brass',0,3,1,5,2,3,0,0,
      'TPU 85A is the softest TPU in Bambu Lab\'s lineup. Shore 85A produces very soft, rubber-like parts with high elasticity. The most challenging TPU to print due to its extreme flexibility.\n\nPrint settings:\n- Nozzle: 220-230°C\n- Bed: 40-50°C\n- Speed: 20-40mm/s MAXIMUM — this is extremely soft and difficult to push\n- Retraction: DISABLED completely\n- External spool holder ONLY\n- Print VERY slowly — rushing causes extruder grinding and jams\n- Available in Neon Orange',
      'Very moisture-sensitive due to softness. Dry at 50°C for 4-6 hours. Store sealed at all times.',
      'TPU 85A applications:\n- The softest printable TPU — rubber-like flexibility\n- Shore 85A ≈ soft rubber band / gummy bear firmness\n- Great for: shoe soles, very soft grips, vibration isolators, medical cushions\n- VERY challenging to print — for experienced users only\n- The Neon Orange color is highly visible — great for safety/visibility applications\n- Extreme stringing is normal — post-process with heat gun or scissors\n- Prints will feel almost like injection-molded rubber\n- Consider TPU 90A or 95A if 85A is too difficult to print reliably',
      '["X1C","P1S","P2S","H2S","H2D","H2C"]'],

    ['PC','Bambu Lab','FR (Fire Retardant)','engineering',4,260,290,100,120,0,0,20,1,'brass',0,3,5,2,5,4,0,1,
      'PC FR (Fire Retardant Polycarbonate) meets UL94 V-0 fire rating standards. Self-extinguishing when the flame source is removed. Essential for electrical enclosures, electronics housings, and applications requiring fire safety compliance.\n\nPrint settings:\n- Same as standard PC: 265-285°C nozzle, 105-120°C bed, enclosure required\n- Brim: 8-10mm for all parts\n- Fan: 0-20%\n- High Temp Plate with liquid glue recommended',
      'Same as standard PC storage. Dry at 80°C for 6-8 hours.',
      'PC FR applications:\n- Electrical enclosures and junction boxes\n- Electronics housings requiring fire certification\n- Automotive interior components (fire safety compliance)\n- Industrial equipment guards and panels\n- UL94 V-0 rating — self-extinguishes when flame is removed\n- Same toughness and impact resistance as standard PC\n- Required for many professional and commercial applications\n- Check local regulations — 3D printed parts may need additional certification for production use',
      '["X1C","X1E","P2S","H2S","H2D","H2C"]'],

    ['PA6-GF','Bambu Lab','Glass Fiber Nylon','engineering',4,270,300,80,100,50,0,20,1,'hardened_steel',1,5,5,1,5,4,0,0,
      'PA6-GF (Nylon 6 Glass Fiber) is a glass-fiber-reinforced nylon with extreme stiffness and dimensional stability. Glass fibers provide even higher stiffness than carbon fibers with isotropic properties.\n\nCRITICAL: Hardened steel nozzle mandatory — glass fibers are extremely abrasive. Bone dry filament required.\n\nPrint settings:\n- Nozzle: 275-295°C\n- Bed: 85-100°C on High Temp Plate with liquid glue\n- Enclosure with active chamber heating strongly recommended\n- Fan: 0-20%\n- Speed: 100-180mm/s',
      'Extremely moisture-sensitive — same protocol as PA6-CF. Dry at 85-90°C for 12+ hours. Use inline dryer.',
      'PA6-GF applications:\n- Even stiffer than PA6-CF — glass fibers provide superior rigidity\n- Excellent dimensional stability — less warping than CF-reinforced variants\n- Glass fiber is MORE abrasive than carbon fiber — nozzle wear is faster\n- More isotropic strength than CF (CF is directional, GF is more uniform)\n- Great for: precision jigs, fixtures, molds, stiff structural parts\n- Industrial applications where dimensional accuracy is critical\n- Heat resistance comparable to PA6-CF: 180-200°C\n- Surface finish is rougher than CF — the glass fibers create visible texture',
      '["X1C","X1E","H2S","H2D","H2C"]'],

    ['PET-CF','Bambu Lab','Carbon Fiber PET','engineering',3,250,280,80,100,0,0,30,1,'hardened_steel',1,3,4,1,4,4,0,0,
      'PET-CF is PET (Polyethylene Terephthalate) reinforced with carbon fibers. It offers a middle ground between PETG-CF and PA-CF — stiffer than PETG, easier to print than nylon, with good chemical resistance.\n\nHardened steel nozzle required.\n\nPrint settings:\n- Nozzle: 255-275°C\n- Bed: 85-100°C\n- Enclosure required\n- Fan: 0-30%\n- Speed: 150-250mm/s',
      'Moderately moisture-sensitive. Dry at 65°C for 6 hours before printing.',
      'PET-CF applications:\n- Bridges the gap between PETG-CF (easy to print) and PA-CF (maximum performance)\n- Better chemical resistance than nylon-based CF filaments\n- Lower moisture sensitivity than PA-CF — easier to handle and store\n- Good stiffness and dimensional stability with carbon fiber reinforcement\n- Easier to print than PA-CF — doesn\'t require extreme drying protocols\n- Good for: functional enclosures, structural parts, chemical-resistant housings\n- Compatible with Support for PA/PET dissolvable support material',
      '["X1C","X1E","P2S","H2S","H2D","H2C"]'],

    ['PPA-CF','Bambu Lab','Polyphthalamide CF','engineering',5,300,320,100,120,60,0,20,1,'hardened_steel',1,5,5,1,5,5,0,0,
      'PPA-CF (Polyphthalamide Carbon Fiber) is an ultra-high-performance engineering material with exceptional mechanical properties. PPA offers higher strength and heat resistance than standard PA6-CF.\n\nCRITICAL: X1E or H2 series with active chamber heating required. 320°C nozzle capability needed.\n\nPrint settings:\n- Nozzle: 305-320°C — maximum nozzle temp required\n- Bed: 110-120°C on High Temp Plate with liquid glue\n- Chamber: 55-60°C active heating required\n- Fan: 0-10%\n- Speed: 80-150mm/s',
      'Extremely moisture-sensitive. Same drying protocol as PAHT-CF: 90-100°C for 12+ hours. Molecular sieve desiccant required.',
      'PPA-CF — industrial grade:\n- Exceptional mechanical properties — among the strongest FDM materials available\n- Heat deflection temperature: 250°C+ — higher than PAHT-CF\n- Tensile strength: 150-180 MPa\n- Applications: aerospace prototypes, automotive engine components, industrial tooling\n- Premium priced at $149.99/0.75kg — a professional material\n- Requires the most capable printer setup: X1E or H2 series with full active heating\n- Not for hobbyist use — this is a production-grade engineering material\n- Compatible with Support for PA/PET for dissolvable support structures',
      '["X1E","H2S","H2D","H2D Pro","H2C"]'],

    ['PPS-CF','Bambu Lab','Polyphenylene Sulfide CF','engineering',5,300,320,100,120,60,0,20,1,'hardened_steel',1,5,5,1,5,5,0,0,
      'PPS-CF (Polyphenylene Sulfide Carbon Fiber) is the most chemically resistant FDM material available. PPS is inherently flame-retardant and resistant to nearly all chemicals, acids, and solvents.\n\nCRITICAL: X1E or H2 series with active chamber heating and 320°C nozzle capability required.\n\nPrint settings:\n- Nozzle: 310-320°C — near maximum capability\n- Bed: 110-120°C on High Temp Plate\n- Chamber: 55-60°C active heating\n- Fan: 0-10%\n- Speed: 60-120mm/s — slowest of all materials for best results',
      'Extremely moisture-sensitive. Dry at 90-100°C for 12+ hours. Same extreme drying protocol as PAHT-CF.',
      'PPS-CF — the most chemical-resistant FDM material:\n- Inherently flame-retardant (no FR additives needed) — meets UL94 V-0\n- Resistant to nearly ALL chemicals: acids, bases, solvents, fuels, oils\n- Heat deflection temperature: 260°C+ — highest of any common FDM material\n- Applications: chemical processing equipment, aerospace, automotive fuel systems\n- Premium priced at $129.99/0.75kg\n- The ultimate material for harsh environments — temperature, chemicals, flames\n- Requires maximum printer capability — only X1E and H2 series\n- Very limited color options (Black only)\n- Combined with CF reinforcement for structural capability in extreme conditions',
      '["X1E","H2D Pro","H2S","H2D","H2C"]'],

    ['Support','Bambu Lab','For PLA','support',1,190,220,45,65,0,80,100,0,'brass',0,2,1,1,1,2,0,0,
      'Dedicated breakaway support material optimized for PLA. Easier to remove than using PLA as its own support material, with a cleaner interface.\n\nPrint settings:\n- Standard PLA temperatures\n- Works in AMS for automatic PLA/support switching\n- Easier removal than same-material supports',
      'Standard PLA storage. Low moisture sensitivity.',
      'Support for PLA:\n- Designed specifically for PLA — optimized weak interface for clean removal\n- Easier to remove than standard PLA-on-PLA supports\n- Works in AMS for automatic multi-material support printing\n- Less costly than PVA for applications where perfect supported surfaces aren\'t critical\n- Available in 0.5kg spools at $22.99\n- Best for: general PLA prints with moderate support needs',
      '["X1C","P1S","P1P","P2S","A1","A1 mini","H2S","H2D","H2C"]'],

    ['Support','Bambu Lab','For PLA/PETG','support',2,200,230,55,75,0,60,100,0,'brass',0,3,1,1,1,2,0,0,
      'Universal breakaway support material compatible with both PLA and PETG. Provides a clean break-away interface with both materials.\n\nPrint settings:\n- Temperature range spans both PLA and PETG requirements\n- Works in AMS for automatic support switching\n- Support interface settings in Bambu Studio handle the temperature transitions',
      'Standard storage. Slightly more moisture-sensitive than PLA-only support due to PETG compatibility.',
      'Support for PLA/PETG:\n- Versatile support material for the two most common filaments\n- Works with both PLA and PETG without changing support material\n- Saves AMS slots — one support material for both materials\n- Available at $34.99/0.5kg\n- Clean breakaway interface with both materials\n- Best for: users who print both PLA and PETG and want one universal support material',
      '["X1C","P1S","P1P","P2S","A1","A1 mini","H2S","H2D","H2C"]'],

    ['Support','Bambu Lab','For ABS','support',2,230,260,90,110,0,0,30,1,'brass',0,2,1,1,1,2,0,0,
      'Breakaway support material specifically designed for ABS printing. Requires enclosure like ABS. Provides a clean breakaway interface that separates easily from ABS parts.\n\nPrint settings:\n- ABS temperature range: 240-255°C nozzle, 100-110°C bed\n- Enclosure required — same as ABS\n- Minimal fan — same as ABS to prevent warping',
      'Same as ABS storage — low moisture sensitivity.',
      'Support for ABS:\n- Engineered specifically for ABS interface — clean breakaway\n- Requires enclosure like ABS — both materials need heated chamber\n- Available at $14.99/0.5kg — very affordable\n- Best for: ABS prints with moderate support needs\n- For complex internal supports in ABS, consider HIPS (soluble in limonene) as an alternative\n- Works in AMS alongside ABS for automatic support printing',
      '["X1C","X1E","P2S","H2S","H2D","H2C"]'],

    ['Support','Bambu Lab','For PA/PET','support',3,250,280,80,100,0,0,30,1,'brass',0,4,1,1,1,2,0,0,
      'Specialized support material for high-temperature engineering filaments: PAHT-CF, PPA-CF, PA6-GF, PET-CF, and similar materials. Breaks away cleanly from engineering parts at high temps.\n\nPrint settings:\n- Higher temps than standard support materials: 260-275°C nozzle\n- Enclosure required\n- Designed to withstand the high chamber temperatures needed for engineering materials',
      'Moderately moisture-sensitive. Dry at 65°C for 4-6 hours.',
      'Support for PA/PET:\n- The ONLY support material designed for high-temp engineering filaments\n- Works with PAHT-CF, PPA-CF, PA6-GF, PET-CF\n- Withstands the high chamber temps (50-60°C) these materials require\n- Available at $39.99/0.5kg\n- Essential for complex engineering parts that need support structures\n- Breakaway interface separates cleanly from nylon and PET-based parts\n- Available in Green for easy visual distinction from the primary material',
      '["X1C","X1E","H2S","H2D","H2D Pro","H2C"]']
  ];
  for (const f of filaments) fi.run(...f);

  // Seed profiles
  const pi = db.prepare('INSERT OR IGNORE INTO kb_profiles (name, printer_model, filament_material, filament_brand, nozzle_size, layer_height, print_speed, infill_pct, wall_count, top_layers, bottom_layers, retraction_distance, retraction_speed, description, tips, settings_json, author, difficulty) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)');
  const profiles = [
    ['PLA Standard','X1C','PLA','Bambu Lab',0.4,0.2,300,15,2,4,4,0.8,30,
      'Balanced standard PLA profile for the X1C at 0.4mm nozzle and 0.2mm layer height. This is the recommended starting point for most PLA prints — it offers a great balance of speed (300mm/s), quality, and reliability.\n\nThis profile is optimized for Bambu Lab PLA Basic/Matte on the X1C with smooth PEI (Cool Plate). The Lidar ensures excellent first layer, and the CoreXY motion system handles the high speeds with minimal ringing thanks to vibration compensation.\n\nSuitable for: decorative prints, household items, gifts, prototypes, general-purpose printing.',
      'Getting the best results from PLA Standard:\n- This profile works out of the box for most PLA prints — no tuning needed for 90% of use cases\n- For functional parts: increase walls to 3-4 and infill to 30-40% for more strength\n- For visual quality: slow down to 200mm/s and enable \"Inner wall first\" for smoother surfaces\n- Clean the build plate with IPA before every 5th print to maintain adhesion\n- Z-seam: set to \"Aligned\" for vases and cylinders, \"Random\" for organic shapes\n- The 0.2mm layer height is barely visible on large prints but gives good detail on small features\n- Enable tree supports for complex overhangs — they use less material and are easier to remove\n- For multi-color with AMS: this profile works perfectly with Bambu Lab PLA in all slots\n- First layer: the Lidar calibration handles this automatically on X1C. If adhesion issues occur, increase first layer flow to 105%\n- Print cooling: 100% fan after first layer. Reduce to 80% for better layer adhesion on functional parts',
      JSON.stringify({nozzle_temp:210,nozzle_temp_first_layer:215,bed_temp:55,bed_temp_first_layer:60,fan_speed:"100% after layer 1",fan_speed_first_layer:"0%",first_layer_height:0.2,first_layer_speed:20,outer_wall_speed:200,inner_wall_speed:300,infill_speed:300,travel_speed:500,bridge_speed:50,overhang_speed:150,z_hop:0.4,brim_width:"0mm (auto for small parts)",support_type:"Tree (if needed)",support_angle:45,support_interface_layers:2,skirt_loops:1,line_width:0.42,infill_pattern:"Gyroid",seam_position:"Aligned",ironing:false,max_volumetric_speed:21,acceleration:10000,jerk:10,pressure_advance:0.04}),'Bambu Lab',1],

    ['PLA Standard','P1S','PLA','Bambu Lab',0.4,0.2,300,15,2,4,4,0.8,30,
      'Standard PLA profile for the P1S enclosed printer. Nearly identical to the X1C profile but with adjustments for the strain-gauge-based bed leveling system (vs X1C\'s Lidar).\n\nThe P1S prints PLA just as well as the X1C in terms of speed and quality. The main difference is the lack of Lidar, which means Z-offset may need occasional manual fine-tuning. The enclosure can be left open for PLA — it actually benefits from cooler ambient air.\n\nSuitable for: same applications as X1C PLA Standard — decorative, functional, and general-purpose printing.',
      'P1S-specific PLA tips:\n- The P1S uses strain gauge instead of Lidar for bed leveling — this means Z-offset calibration is important\n- Run Z-offset calibration when: changing build plates, after firmware updates, or if first layer quality changes\n- For PLA: leave the enclosure door OPEN for better cooling and overhang quality\n- Close the enclosure only when printing ABS/ASA/PA — PLA prefers cool air\n- The P1S has the same CoreXY motion system as X1C — 300mm/s is perfectly fine for PLA\n- No camera on P1S — consider a separate webcam (OctoPrint, etc.) for remote monitoring\n- AMS works identically on P1S as X1C — no setting changes needed\n- First layer: if adhesion varies across the bed, run full bed mesh calibration (not just Z-offset)\n- Print quality is virtually identical to X1C for PLA — the Lidar difference is mainly about convenience, not quality\n- Enable \"Arc fitting\" in Bambu Studio for smoother curves on round features',
      JSON.stringify({nozzle_temp:210,nozzle_temp_first_layer:215,bed_temp:55,bed_temp_first_layer:60,fan_speed:"100% after layer 1",fan_speed_first_layer:"0%",first_layer_height:0.2,first_layer_speed:20,outer_wall_speed:200,inner_wall_speed:300,infill_speed:300,travel_speed:500,bridge_speed:50,z_hop:0.4,support_type:"Tree (if needed)",support_angle:45,line_width:0.42,infill_pattern:"Gyroid",seam_position:"Aligned",max_volumetric_speed:21,acceleration:10000,note:"Open enclosure door for better PLA cooling"}),'Bambu Lab',1],

    ['PLA Standard','A1','PLA','Bambu Lab',0.4,0.2,300,15,2,4,4,0.8,30,
      'Standard PLA profile for the A1 bed-slinger printer. Adapted for the A1\'s Cartesian (i-style) motion system where the bed moves on the Y axis, which creates different dynamics than the X1C/P1S CoreXY systems.\n\nThe A1 handles PLA excellently at 300mm/s for most prints. The Lidar provides accurate first-layer calibration (unlike the P1S), and the standard MK8 nozzle means cheap and easily available replacements.\n\nSuitable for: general-purpose PLA printing, especially parts that aren\'t excessively tall or heavy.',
      'A1-specific PLA tips:\n- The A1 is a bed-slinger — the bed moves in Y, toolhead in X/Z. This means:\n  • Tall, narrow parts may wobble at high speeds. Reduce to 200mm/s for parts taller than 150mm\n  • Heavy parts (high infill, large footprint) add mass to the moving bed — quality may decrease at max speed\n  • Wide, flat parts print at full speed without issues\n- The Lidar makes first-layer setup easy — same auto-calibration as X1C\n- MK8-style nozzles are $2-5 from third-party sources — buy a multipack\n- The AMS Lite (not full AMS) is used with A1 — slightly different setup but same Bambu Studio settings\n- Open-frame design = excellent PLA cooling. Overhangs and bridges are very clean\n- In drafty rooms: orient the printer so the bed moves away from the draft source\n- For vase mode prints: the A1 produces excellent results — the bed-slinger design handles spiralize well\n- Bed adhesion: the A1 comes with smooth PEI. Clean with IPA regularly\n- The A1\'s acceleration is lower than CoreXY models (10000 vs 20000 mm/s²) — actual print speeds may be lower for small parts with lots of direction changes',
      JSON.stringify({nozzle_temp:210,nozzle_temp_first_layer:215,bed_temp:55,bed_temp_first_layer:60,fan_speed:"100% after layer 1",fan_speed_first_layer:"0%",first_layer_height:0.2,first_layer_speed:20,outer_wall_speed:200,inner_wall_speed:300,infill_speed:300,travel_speed:400,bridge_speed:50,z_hop:0.4,support_type:"Tree (if needed)",line_width:0.42,infill_pattern:"Gyroid",seam_position:"Aligned",max_volumetric_speed:18,acceleration:10000,note:"Reduce speed for tall/narrow parts due to bed-slinger Y-axis movement"}),'Bambu Lab',1],

    ['PETG Standard','X1C','PETG','Bambu Lab',0.4,0.2,250,15,2,4,4,1.0,30,
      'Standard PETG profile for the X1C with 0.4mm nozzle and 0.2mm layer height. PETG requires different settings than PLA — lower fan speed, higher bed temperature, and slightly more retraction to manage stringing.\n\nThis profile uses the textured PEI plate (Engineering Plate) as the default build surface — PETG bonds too aggressively to smooth PEI. The enclosed X1C chamber provides stable temperatures that help with PETG warping on larger parts.\n\nSuitable for: functional parts, enclosures, outdoor-rated components (moderate UV), water-resistant applications, anything that needs more toughness than PLA.',
      'PETG on X1C — key tips:\n- USE TEXTURED PEI PLATE! Do NOT print PETG directly on smooth PEI — it will bond permanently and damage the plate\n- If you must use smooth PEI, apply a thin layer of glue stick first as a release agent\n- Some stringing is NORMAL with PETG. Don\'t chase perfection — a little stringing is the price of PETG\'s toughness\n- To reduce stringing: dry the filament first (most stringing is from moisture), then lower nozzle temp by 5°C\n- Fan at 30-40%: more fan = better overhangs but worse layer adhesion. 40% is the compromise\n- The enclosure is beneficial for large PETG parts — it reduces warping and drafts\n- First layer: increase Z-offset by 0.02-0.05mm vs PLA. PETG doesn\'t like being squished against the bed\n- Speed: 250mm/s is the sweet spot. Going faster increases stringing significantly\n- Enable wipe moves and combing to reduce surface blobs\n- PETG in the AMS: increase retraction by 0.3mm (to 1.3mm) for cleaner filament changes\n- Clear/transparent PETG: reduce nozzle temp by 5°C and use 0.1mm layer height for best clarity',
      JSON.stringify({nozzle_temp:235,nozzle_temp_first_layer:240,bed_temp:80,bed_temp_first_layer:85,fan_speed:"40% after layer 3",fan_speed_first_layer:"0%",fan_speed_bridge:"80%",first_layer_height:0.2,first_layer_speed:15,outer_wall_speed:200,inner_wall_speed:250,infill_speed:250,travel_speed:500,bridge_speed:40,z_hop:0.4,z_offset_adjustment:"+0.02-0.05mm vs PLA",build_plate:"Textured PEI (Engineering Plate)",brim_width:"3-5mm for parts >100mm",support_type:"Tree or Normal",support_angle:40,line_width:0.42,infill_pattern:"Gyroid",seam_position:"Aligned",max_volumetric_speed:18,wipe_enabled:true,pressure_advance:0.045,note:"Textured PEI plate recommended. Some stringing is normal."}),'Bambu Lab',2],

    ['PETG Standard','P1S','PETG','Bambu Lab',0.4,0.2,250,15,2,4,4,1.0,30,
      'PETG profile for the P1S enclosed printer. The P1S enclosure provides stable temperatures that are beneficial for PETG, especially on larger parts that are prone to warping.\n\nNearly identical to the X1C PETG profile — the main difference is the lack of Lidar for first-layer calibration, which means Z-offset is more important to dial in (PETG is particularly sensitive to Z-offset).\n\nSuitable for: functional parts, enclosures, water-resistant components, parts requiring better toughness than PLA.',
      'P1S-specific PETG tips:\n- Z-offset is CRITICAL for PETG on P1S — too close = bonded to plate, too far = poor adhesion\n- Run Z-offset calibration specifically with PETG and your chosen build plate — it differs from PLA settings\n- The enclosure helps with PETG warping on larger parts — keep it closed\n- However, overhangs benefit from some airflow — if overhangs look rough, crack the enclosure slightly\n- Same build plate rule: textured PEI for PETG, never smooth PEI without glue stick\n- The P1S prints PETG just as well as the X1C — the quality difference is minimal\n- PETG adhesion can be aggressive — if parts are hard to remove, let the plate cool completely to room temp\n- The aux fan on P1S helps with overhangs — PETG benefits from the extra cooling on bridges\n- AMS with PETG on P1S: increase retraction slightly for cleaner filament changes\n- For large flat PETG parts: use 8-10mm brim and preheat the enclosure for 5 minutes before starting',
      JSON.stringify({nozzle_temp:235,nozzle_temp_first_layer:240,bed_temp:80,bed_temp_first_layer:85,fan_speed:"40% after layer 3",fan_speed_first_layer:"0%",first_layer_height:0.2,first_layer_speed:15,outer_wall_speed:200,inner_wall_speed:250,infill_speed:250,travel_speed:500,z_hop:0.4,build_plate:"Textured PEI (Engineering Plate)",line_width:0.42,infill_pattern:"Gyroid",max_volumetric_speed:18,wipe_enabled:true,note:"Z-offset calibration is critical on P1S for PETG. Keep enclosure closed."}),'Bambu Lab',2],

    ['ABS Standard','X1C','ABS','Bambu Lab',0.4,0.2,200,15,3,5,4,0.8,30,
      'ABS profile for the X1C with enclosed chamber. ABS requires an enclosure with warm chamber temperatures and minimal part cooling fan to prevent warping, cracking, and layer splitting.\n\nThe X1C is excellent for ABS printing thanks to its fully enclosed chamber, activated carbon filter (for fume management), and reliable bed adhesion with the Engineering Plate at high temperatures.\n\nSuitable for: functional parts requiring heat resistance (up to 100°C), parts for acetone smoothing, automotive/electronic enclosures, parts for assembly with threaded inserts.',
      'ABS printing strategy:\n- CLOSE ALL DOORS AND LIDS before starting — drafts are ABS\'s worst enemy\n- Preheat the chamber: start a bed-preheat to 110°C for 10-15 minutes before printing. This warms the chamber\n- The activated carbon filter in X1C is important — ABS releases styrene fumes. Replace the filter regularly\n- Fan: 0% is safest. If overhangs sag, try 10-20% but expect some warping risk\n- Brim: use 5-8mm brim for parts larger than 80mm in any dimension. ABS has strong warping forces\n- First layer: squish slightly more than PLA. Bed at 110°C, first layer speed 15mm/s\n- Large flat parts: consider using a raft instead of brim for maximum adhesion\n- ABS shrinks ~0.5-0.7% during cooling — account for this in precision parts by scaling up in the slicer\n- Wall count: 3 walls for better strength and to resist shrinkage forces\n- Acetone smoothing works beautifully on ABS — print with standard settings, then vapor smooth for a professional finish\n- Avoid opening the enclosure during printing — even a brief door opening can cause cracking on multi-hour prints\n- If you see layer splitting (delamination): increase nozzle temp by 5°C, reduce speed, ensure enclosure is sealed',
      JSON.stringify({nozzle_temp:245,nozzle_temp_first_layer:250,bed_temp:105,bed_temp_first_layer:110,fan_speed:"0% (max 20% for overhangs)",fan_speed_first_layer:"0%",first_layer_height:0.2,first_layer_speed:15,outer_wall_speed:150,inner_wall_speed:200,infill_speed:200,travel_speed:400,bridge_speed:30,z_hop:0.4,build_plate:"Textured PEI or Smooth PEI with glue stick",brim_width:"5-8mm",enclosure:"REQUIRED — doors and lid CLOSED",chamber_preheat:"10-15 minutes before printing",support_type:"Normal (tree supports less reliable with ABS warping)",line_width:0.42,infill_pattern:"Gyroid or Grid",seam_position:"Aligned",max_volumetric_speed:15,wipe_enabled:true,shrinkage:"0.5-0.7% (scale model up for precision parts)",fume_filtration:"Activated carbon filter (replace every 3-6 months)"}),'Bambu Lab',3],

    ['TPU 95A Flex','X1C','TPU 95A','Bambu Lab',0.4,0.2,80,15,2,4,4,0.0,0,
      'TPU (flexible filament) profile for the X1C. TPU is fundamentally different from rigid filaments — it requires slow speeds, no retraction (or very minimal), and direct feeding from an external spool holder (NOT through the AMS).\n\nTPU 95A is \"medium flex\" — firm enough to hold shape but soft enough to bend and compress. The 95A hardness is similar to a car tire or shoe sole.\n\nSuitable for: phone cases, protective bumpers, gaskets/seals, vibration dampeners, shoe insoles, watch bands, flexible hinges, grip covers.',
      'TPU is the most challenging common filament to print. Key strategies:\n- SPEED IS EVERYTHING: 30-80mm/s maximum. Faster = the filament buckles in the extruder and jams\n- NO RETRACTION: set to 0mm. TPU compresses rather than retracts, causing jams. Accept some stringing\n- EXTERNAL SPOOL HOLDER: remove from AMS and feed via the spool holder. TPU WILL jam in AMS tubes\n- Direct drive extruder (which all Bambu printers have) is essential — Bowden setups cannot print TPU reliably\n- Infill pattern: Gyroid is ideal for flexible parts — it compresses evenly in all directions\n- Wall count: 2 walls = very flexible, 3-4 walls = stiffer. Adjust for desired flexibility\n- Infill percentage: 10% = very soft/squishy, 30% = firm, 50%+ = rigid-feeling\n- Enable \"Avoid crossing perimeters\" to reduce stringing\n- Print with constant speed — avoid acceleration/deceleration which can cause extruder grinding\n- If you get jams: check the extruder tension. Too tight = filament deforms, too loose = filament slips\n- Z-hop: disable if possible — TPU oozes and Z-hop creates blobs\n- Bed adhesion: TPU sticks to almost everything. Smooth PEI with 45-50°C works well\n- Supports: avoid if possible — TPU supports are very difficult to remove from TPU parts',
      JSON.stringify({nozzle_temp:225,nozzle_temp_first_layer:230,bed_temp:50,bed_temp_first_layer:55,fan_speed:"60% after layer 3",fan_speed_first_layer:"0%",first_layer_height:0.2,first_layer_speed:15,outer_wall_speed:40,inner_wall_speed:60,infill_speed:80,travel_speed:150,bridge_speed:20,retraction_distance:0.0,retraction_speed:0,z_hop:0.0,build_plate:"Smooth PEI (Cool Plate)",brim_width:"0mm (TPU adheres easily)",support_type:"Avoid if possible",line_width:0.42,infill_pattern:"Gyroid",seam_position:"Random",max_volumetric_speed:6,wipe_enabled:false,pressure_advance:0.0,linear_advance:0.0,avoid_crossing_perimeters:true,note:"Use external spool holder — NOT AMS. Speed is critical — DO NOT increase beyond 80mm/s."}),'Bambu Lab',3],

    ['PA-CF Engineering','X1C','PA-CF','Bambu Lab',0.4,0.2,150,15,3,5,4,0.5,20,
      'Engineering PA-CF (Carbon Fiber Nylon) profile for the X1C. This is a high-performance profile for producing structural and functional parts that approach injection-molded quality and strength.\n\nPA-CF is one of the strongest materials available on consumer 3D printers. This profile is optimized for maximum strength and reliability with properly dried Bambu Lab PA-CF filament on the X1C.\n\nCRITICAL REQUIREMENTS: Hardened steel nozzle, bone-dry filament, enclosed chamber, High Temp Plate.\n\nSuitable for: structural brackets, drone frames, automotive parts, tool handles, jigs/fixtures, functional prototypes, replacement parts for machinery.',
      'PA-CF demands careful preparation and attention to detail:\n- DRY THE FILAMENT: 80°C for 8-12 hours minimum. This is non-negotiable. Wet PA-CF = failed print\n- Use inline dryer if possible — PA absorbs moisture from the air during multi-hour prints\n- HARDENED STEEL NOZZLE: check before printing! Carbon fiber will destroy brass in hours\n- High Temp Plate with Bambu liquid glue: apply a thin, even layer. This is critical for bed adhesion\n- Preheat the chamber for 15 minutes before starting — warm chamber prevents warping\n- Close all enclosure openings — drafts cause warping and layer splitting in PA\n- Brim: use 8mm for all but the smallest parts. PA-CF warping forces are significant\n- Wall count: 3 minimum, 4 for maximum strength. CF fibers align along the perimeter direction\n- Speed: 150mm/s gives good results. Don\'t push higher — layer adhesion suffers at high speeds\n- Layer adhesion: if you see delamination, increase nozzle temp by 5°C and reduce speed\n- Post-print: let parts cool in the closed enclosure. Rapid cooling from opening the door can cause warping\n- Parts reach full strength after 24-48 hours of room-temperature crystallization\n- For heat-set inserts: PA-CF accepts brass inserts beautifully — use a soldering iron at 260°C',
      JSON.stringify({nozzle_temp:280,nozzle_temp_first_layer:285,bed_temp:90,bed_temp_first_layer:100,fan_speed:"0-20%",fan_speed_first_layer:"0%",first_layer_height:0.2,first_layer_speed:10,outer_wall_speed:100,inner_wall_speed:150,infill_speed:150,travel_speed:350,bridge_speed:25,z_hop:0.3,build_plate:"High Temp Plate + Bambu liquid glue",brim_width:"8mm",enclosure:"REQUIRED — fully sealed",chamber_preheat:"15 minutes minimum",nozzle_type:"HARDENED STEEL — mandatory",support_type:"Normal (minimal supports recommended)",line_width:0.42,infill_pattern:"Gyroid",seam_position:"Aligned",max_volumetric_speed:12,wipe_enabled:true,filament_drying:"80°C for 8-12h — MANDATORY",cooling_after_print:"Let cool in closed enclosure slowly"}),'Bambu Lab',4],

    ['PLA 0.6mm Draft','X1C','PLA','Bambu Lab',0.6,0.3,350,15,2,3,3,0.8,30,
      'Fast draft PLA profile using the 0.6mm nozzle at 0.3mm layer height. This profile prioritizes speed over surface quality — print times are 30-40% faster than the standard 0.4mm profile.\n\nIdeal for rapid prototyping, test fits, functional parts where appearance doesn\'t matter, and iterating designs quickly. The wider extrusion and taller layers also produce stronger parts due to better layer adhesion per layer.\n\nRequires: 0.6mm nozzle (hardened steel if printing CF materials, brass for standard PLA)\n\nSuitable for: rapid prototypes, test fits, functional parts, large parts where speed matters, structural parts.',
      'Getting the most from 0.6mm draft printing:\n- Layer lines are visible but parts are functional. This is for speed, not beauty\n- Wider extrusion = stronger walls with fewer perimeters needed\n- 2 walls at 0.6mm = 1.2mm wall thickness. Same as 3 walls at 0.4mm but printed faster\n- Small features below 1mm will lose detail — use 0.4mm nozzle for detailed work\n- Text on parts needs to be at least 2mm tall to be readable\n- The 0.6mm nozzle is less prone to clogging — great for filled/composite filaments (with HS nozzle)\n- Travel speed can be higher — the larger extrusion is more forgiving of minor positioning errors\n- Infill prints very fast at 0.6mm — consider increasing infill to 20-25% since the time cost is lower\n- Bridge quality is slightly worse than 0.4mm — plan part orientation to minimize long bridges\n- Great for printing jigs, fixtures, storage containers, and organizer bins\n- Consider having both 0.4mm and 0.6mm nozzles loaded: 0.4mm for detail, 0.6mm for speed',
      JSON.stringify({nozzle_temp:215,nozzle_temp_first_layer:220,bed_temp:55,bed_temp_first_layer:60,fan_speed:"100% after layer 1",fan_speed_first_layer:"0%",first_layer_height:0.3,first_layer_speed:20,outer_wall_speed:250,inner_wall_speed:350,infill_speed:350,travel_speed:500,bridge_speed:60,z_hop:0.5,line_width:0.64,infill_pattern:"Gyroid",seam_position:"Random",max_volumetric_speed:28,acceleration:10000,nozzle_size:"0.6mm",print_time_vs_standard:"-30-40%",detail_level:"Low — visible layer lines, reduced small feature definition",strength:"Good — wider extrusion = better layer adhesion"}),'Bambu Lab',1],

    ['PLA 0.12mm Detail','X1C','PLA','Bambu Lab',0.4,0.12,200,15,3,5,5,0.8,30,
      'High-detail PLA profile for the X1C using 0.12mm layer height — nearly half the standard 0.2mm. Produces significantly finer layer lines that are nearly invisible on large surfaces, making this ideal for display pieces and miniatures.\n\nPrint times are approximately 60-80% longer than the standard 0.2mm profile. Use this profile only when surface quality is a priority.\n\nSuitable for: miniatures, figurines, display models, architectural models, jewelry prototypes, photography props, trophy prints.',
      'Maximizing quality at 0.12mm:\n- Print time increases significantly — a 2-hour print at 0.2mm may take 3.5-4 hours at 0.12mm\n- Use this ONLY when you need the detail. For most prints, 0.2mm is indistinguishable from 0.12mm at arm\'s length\n- Miniatures and figurines are the primary use case — tiny details (faces, hands, textures) benefit enormously\n- Speed: 200mm/s is appropriate. Going faster at 0.12mm can cause vibration artifacts in fine details\n- Fan: 100% at all times (after first layer) for sharpest details and best overhangs\n- Support material: PVA supports at 0.12mm produce incredibly clean supported surfaces\n- Z-seam: \"Aligned\" for best results on organic shapes — the seam line is thin enough to hide easily\n- 3 walls and 5 top/bottom layers ensure smooth surfaces without infill show-through\n- For painting: 0.12mm layers are smooth enough that primer alone may be sufficient (no heavy sanding needed)\n- Consider tree supports — they\'re more efficient and leave smaller marks at this resolution\n- Ironing: enable for top surfaces if you want near-injection-molded surface quality on horizontal faces\n- The X1C Lidar is especially valuable at 0.12mm — perfect first layer is critical for fine details',
      JSON.stringify({nozzle_temp:205,nozzle_temp_first_layer:210,bed_temp:55,bed_temp_first_layer:60,fan_speed:"100% after layer 1",fan_speed_first_layer:"0%",first_layer_height:0.16,first_layer_speed:15,outer_wall_speed:150,inner_wall_speed:200,infill_speed:200,travel_speed:500,bridge_speed:40,z_hop:0.3,line_width:0.42,infill_pattern:"Gyroid",seam_position:"Aligned",max_volumetric_speed:12,ironing:true,ironing_speed:100,ironing_flow:"10-15%",support_type:"Tree or PVA (for best surface quality)",detail_level:"High — layer lines nearly invisible",print_time_vs_standard:"+60-80%"}),'Bambu Lab',2],

    ['PETG 0.6mm Fast','P1S','PETG','Bambu Lab',0.6,0.3,250,15,2,3,3,1.0,30,
      'Fast PETG profile for the P1S using 0.6mm nozzle at 0.3mm layer height. Designed for large functional parts where strength and speed are prioritized over surface finish — boxes, enclosures, brackets, and structural components.\n\nThe P1S enclosure is particularly beneficial for large PETG prints at this resolution — the stable temperature prevents warping on big parts. The wider extrusion also improves layer adhesion, making parts stronger.\n\nRequires: 0.6mm nozzle (brass is fine for standard PETG, hardened steel for PETG-CF)\n\nSuitable for: large enclosures, storage containers, structural parts, functional prototypes, jigs and fixtures.',
      'Fast PETG at 0.6mm — practical tips:\n- The wider extrusion produces stronger parts than 0.4mm at the same wall count\n- 2 walls at 0.6mm = 1.2mm thickness. Very strong for functional parts\n- PETG stringing is less noticeable at 0.6mm — the wider extrusion hides minor stringing\n- Large flat parts: use 5mm brim. The enclosure helps but PETG can still warp on 200mm+ parts\n- Speed: 250mm/s is good for PETG at 0.6mm. Stringing increases above 300mm/s\n- The 0.6mm nozzle is great for printing storage bins, organizers, and enclosure panels\n- Layer adhesion is excellent at 0.6mm — parts feel very solid\n- Surface quality is \"functional\" — visible layer lines but consistent and clean\n- Fan: 30-40%. The wider extrusion holds heat longer — may need slightly more fan than 0.4mm PETG\n- Great for iterating enclosure designs before final printing at 0.4mm for appearance\n- Print time savings of 30-40% vs 0.4mm make this profile ideal for production-quantity functional parts',
      JSON.stringify({nozzle_temp:240,nozzle_temp_first_layer:245,bed_temp:80,bed_temp_first_layer:85,fan_speed:"40% after layer 3",fan_speed_first_layer:"0%",first_layer_height:0.3,first_layer_speed:15,outer_wall_speed:200,inner_wall_speed:250,infill_speed:250,travel_speed:400,bridge_speed:40,z_hop:0.5,build_plate:"Textured PEI (Engineering Plate)",brim_width:"5mm for large parts",line_width:0.64,infill_pattern:"Gyroid",seam_position:"Aligned",max_volumetric_speed:24,nozzle_size:"0.6mm",print_time_vs_standard:"-30-40%",note:"Keep enclosure closed for best results on large parts"}),'Bambu Lab',2],

    ['ASA Outdoor','X1C','ASA','Bambu Lab',0.4,0.2,200,20,3,5,4,0.8,30,
      'ASA profile optimized for UV-resistant outdoor parts on the X1C. ASA (Acrylonitrile Styrene Acrylate) prints identically to ABS but with excellent UV stability — parts maintain color and mechanical properties for years in direct sunlight.\n\nThe X1C\'s enclosed chamber and carbon filter make it ideal for ASA, which produces similar fumes to ABS. This profile uses slightly higher infill (20%) and 3 walls for outdoor durability.\n\nSuitable for: outdoor enclosures, garden fixtures, car accessories, drone shells, weatherproof housings, mailbox numbers, exterior decorative items, planters, outdoor signage.',
      'ASA outdoor printing strategy:\n- ASA prints like ABS — same enclosure requirements, same temperature range, same minimal fan\n- The key difference: ASA is UV stable. Parts won\'t yellow or become brittle in sunlight (ABS will)\n- Use ASA instead of ABS for ANY part that will see sunlight — even through a window\n- 20% infill and 3 walls provide good outdoor durability. Increase to 30% infill for structural outdoor parts\n- ASA can be acetone-smoothed just like ABS — great for weatherproofing and aesthetics\n- Acetone smoothing also helps seal layer lines, improving weather resistance\n- For water-tightness: 4 walls, acetone smooth, or apply clear coat\n- ASA color stability: black and dark colors have the best UV resistance. Light colors may fade very slightly over years\n- The X1C carbon filter handles ASA fumes, but replace the filter every 3-6 months with regular ASA printing\n- Brim: 5-8mm for outdoor parts. Larger brim = less chance of edge warping\n- Post-print: cool slowly in the closed enclosure to minimize internal stress (which can cause cracking in temperature cycling outdoors)\n- For parts that experience temperature cycling (outdoor = hot days + cold nights): design with rounded corners and gradual transitions to reduce stress concentrations\n- Consider drilling drainage holes in outdoor enclosures — water pooling inside causes issues over time',
      JSON.stringify({nozzle_temp:245,nozzle_temp_first_layer:250,bed_temp:105,bed_temp_first_layer:110,fan_speed:"0-10%",fan_speed_first_layer:"0%",first_layer_height:0.2,first_layer_speed:15,outer_wall_speed:150,inner_wall_speed:200,infill_speed:200,travel_speed:400,bridge_speed:25,z_hop:0.4,build_plate:"Textured PEI or Smooth PEI with glue",brim_width:"5-8mm",enclosure:"REQUIRED — doors and lid CLOSED",chamber_preheat:"10-15 minutes",support_type:"Normal (minimal supports recommended)",line_width:0.42,infill_pattern:"Gyroid or Grid (Grid for max strength)",seam_position:"Aligned",max_volumetric_speed:15,wipe_enabled:true,uv_resistance:"Excellent — years of outdoor exposure",weather_resistance:"High — maintains properties in sun, rain, and temperature cycling",shrinkage:"0.5-0.7% (same as ABS)"}),'Bambu Lab',3],

    ['PLA Standard','P2S','PLA','Bambu Lab',0.4,0.2,300,15,2,4,4,0.8,30,
      'Standard PLA profile for the P2S — Bambu Lab\'s successor to the P1S. The P2S features the DynaSense extruder with Lidar (same as X1C), camera monitoring, and LAN connectivity, making it a significant upgrade from the P1S.\n\nWith Lidar-based first layer calibration, the P2S eliminates the Z-offset issues that plagued the P1S. PLA prints beautifully on the P2S with the enclosure door left open for maximum cooling.\n\nSuitable for: all general-purpose PLA printing. Same capabilities as X1C for PLA at a lower price point.',
      'P2S PLA tips:\n- The P2S has Lidar like the X1C — first layer calibration is automatic and reliable\n- Leave the enclosure door OPEN for PLA — better cooling means better overhangs and bridges\n- The DynaSense extruder provides excellent flow consistency at high speeds\n- Camera monitoring means you can watch prints remotely via Bambu Handy\n- LAN connectivity allows faster file transfers than Wi-Fi — use for large models\n- AMS compatibility is identical to P1S/X1C — all AMS units work the same way\n- The P2S CoreXY motion handles 300mm/s PLA easily with minimal ringing\n- For functional parts: increase walls to 3-4 and infill to 30% for better strength\n- Clean the smooth PEI plate with IPA every few prints for consistent adhesion\n- Tree supports work well at 300mm/s — use for complex overhangs',
      JSON.stringify({nozzle_temp:210,nozzle_temp_first_layer:215,bed_temp:55,bed_temp_first_layer:60,fan_speed:"100% after layer 1",fan_speed_first_layer:"0%",first_layer_height:0.2,first_layer_speed:20,outer_wall_speed:200,inner_wall_speed:300,infill_speed:300,travel_speed:500,bridge_speed:50,z_hop:0.4,line_width:0.42,infill_pattern:"Gyroid",seam_position:"Aligned",max_volumetric_speed:21,acceleration:10000,note:"Open enclosure for PLA. DynaSense + Lidar = excellent first layer."}),'Bambu Lab',1],

    ['PETG Standard','P2S','PETG','Bambu Lab',0.4,0.2,250,15,2,4,4,1.0,30,
      'PETG profile for the P2S enclosed printer. The P2S Lidar provides accurate Z-offset calibration which is critical for PETG — getting the first layer height right prevents permanent bonding to the build plate.\n\nThe enclosed chamber provides stable temperatures, and the DynaSense extruder\'s consistent flow helps manage PETG\'s tendency to string.\n\nSuitable for: functional parts, enclosures, water-resistant components, outdoor parts (moderate UV).',
      'P2S PETG tips:\n- Use Textured PEI plate — PETG bonds too aggressively to smooth PEI\n- The Lidar calibration is especially valuable for PETG — it auto-adjusts the critical first layer gap\n- Keep enclosure closed for large PETG parts to prevent warping\n- For small parts with overhangs: crack the door slightly for better cooling\n- The DynaSense extruder handles PETG\'s retraction needs better than the P1S extruder\n- Stringing: some is normal. Dry the filament first if excessive\n- Fan at 30-40%: balances overhang quality with layer adhesion\n- Enable wipe and combing to reduce surface blobs\n- Camera monitoring lets you catch PETG adhesion failures early — saves filament\n- For transparent PETG: lower temp by 5°C and use 0.1mm layer height',
      JSON.stringify({nozzle_temp:235,nozzle_temp_first_layer:240,bed_temp:80,bed_temp_first_layer:85,fan_speed:"40% after layer 3",fan_speed_first_layer:"0%",first_layer_height:0.2,first_layer_speed:15,outer_wall_speed:200,inner_wall_speed:250,infill_speed:250,travel_speed:500,z_hop:0.4,build_plate:"Textured PEI (Engineering Plate)",line_width:0.42,infill_pattern:"Gyroid",max_volumetric_speed:18,wipe_enabled:true,note:"Use textured PEI. Lidar auto-calibrates first layer height."}),'Bambu Lab',2],

    ['ABS Standard','P2S','ABS','Bambu Lab',0.4,0.2,200,15,3,5,4,0.8,30,
      'ABS profile for the P2S enclosed printer. The P2S enclosure and carbon filter make it well-suited for ABS printing with proper fume management. Lidar and camera provide better monitoring than the P1S.\n\nSuitable for: heat-resistant functional parts, acetone-smoothable models, electronic enclosures, automotive parts.',
      'P2S ABS tips:\n- Close all doors and lids — ABS warps severely with any draft\n- Preheat chamber: bed at 110°C for 10-15 minutes before starting\n- The P2S carbon filter handles ABS fumes — replace filter every 3-6 months\n- Fan: 0% is safest. Max 20% for overhangs only\n- Brim: 5-8mm for parts larger than 80mm\n- The DynaSense extruder maintains consistent flow at ABS temperatures\n- Camera lets you catch warping early — watch the first 5 layers for edge lift\n- ABS shrinks 0.5-0.7% — scale up for precision parts\n- 3 walls minimum for strength and to resist warping forces\n- Let parts cool in the closed enclosure — rapid cooling causes cracking\n- Acetone vapor smoothing works beautifully for a professional finish',
      JSON.stringify({nozzle_temp:245,nozzle_temp_first_layer:250,bed_temp:105,bed_temp_first_layer:110,fan_speed:"0% (max 20% overhangs)",fan_speed_first_layer:"0%",first_layer_height:0.2,first_layer_speed:15,outer_wall_speed:150,inner_wall_speed:200,infill_speed:200,travel_speed:400,z_hop:0.4,build_plate:"Textured PEI or Smooth PEI with glue",brim_width:"5-8mm",enclosure:"REQUIRED — closed",chamber_preheat:"10-15 minutes",line_width:0.42,infill_pattern:"Gyroid",max_volumetric_speed:15,shrinkage:"0.5-0.7%"}),'Bambu Lab',3],

    ['PLA Standard','A1 mini','PLA','Bambu Lab',0.4,0.2,300,15,2,4,4,0.8,30,
      'Standard PLA profile for the A1 mini — Bambu Lab\'s most compact and affordable printer. The A1 mini uses a bed-slinger design with a 180x180x180mm build volume.\n\nDespite its small size, the A1 mini produces excellent PLA prints at full speed. The smaller build volume means less bed mass to move, resulting in sharp prints even at 300mm/s.\n\nSuitable for: small to medium PLA prints, miniatures, phone accessories, keychains, small functional parts, gifts.',
      'A1 mini PLA tips:\n- Build volume is 180x180x180mm — plan your designs accordingly\n- The smaller bed means better print quality at high speeds (less momentum)\n- MK8-compatible nozzles — cheap replacements available from many vendors\n- AMS Lite (not full AMS) works with the A1 mini for multi-color prints\n- Open-frame design gives excellent PLA cooling — overhangs print very cleanly\n- The smooth PEI plate works well for PLA — clean with IPA regularly\n- Perfect printer for miniatures and small detailed parts\n- Can handle 300mm/s easily for parts that fit the build volume\n- For tall prints: reduce speed to 200mm/s to avoid wobble\n- Great as a second printer for small jobs while the main printer handles large parts\n- Filament path is shorter = less friction = more reliable feeding\n- Consider printing storage organizers and accessories that maximize the 180mm space',
      JSON.stringify({nozzle_temp:210,nozzle_temp_first_layer:215,bed_temp:55,bed_temp_first_layer:60,fan_speed:"100% after layer 1",fan_speed_first_layer:"0%",first_layer_height:0.2,first_layer_speed:20,outer_wall_speed:200,inner_wall_speed:300,infill_speed:300,travel_speed:400,bridge_speed:50,z_hop:0.4,line_width:0.42,infill_pattern:"Gyroid",seam_position:"Aligned",max_volumetric_speed:16,acceleration:10000,build_volume:"180x180x180mm",note:"Compact printer — excellent quality for small to medium PLA parts."}),'Bambu Lab',1],

    ['PLA Standard','H2D','PLA','Bambu Lab',0.4,0.2,600,15,2,4,4,0.8,30,
      'Standard PLA profile for the H2D — Bambu Lab\'s flagship CoreXY printer with 600mm/s speeds and active heated chamber. The H2D is designed for production-level printing with dual 7-inch touchscreens and advanced motion system.\n\nThe H2D\'s active chamber heating and Vortek nozzle system push PLA printing to new speeds. Despite PLA being a low-temperature material, the H2D\'s motion system and cooling deliver exceptional quality at extreme speeds.\n\nSuitable for: rapid production PLA prints, large functional parts, prototyping at production speed.',
      'H2D PLA tips:\n- The H2D can hit 600mm/s for PLA — actual speed depends on part geometry and acceleration limits\n- Leave enclosure door open for PLA — the active chamber heater is not needed for PLA\n- The Vortek nozzle system provides ultra-fast nozzle changes without re-calibration\n- Dual touchscreens make monitoring and control easy\n- For small parts: actual speeds may be lower due to acceleration/deceleration distances\n- Large parts with long straight walls benefit most from 600mm/s\n- The H2D\'s build volume (256x256x256mm) is generous for PLA projects\n- AMS 2 Pro compatibility gives you up to 16 colors with auto-drying\n- For quality at maximum speed: ensure filament is dry and nozzle is clean\n- Consider 0.6mm nozzle for even faster prints when detail isn\'t critical\n- The H2D\'s vibration compensation handles extreme speeds with minimal ringing',
      JSON.stringify({nozzle_temp:210,nozzle_temp_first_layer:215,bed_temp:55,bed_temp_first_layer:60,fan_speed:"100% after layer 1",fan_speed_first_layer:"0%",first_layer_height:0.2,first_layer_speed:25,outer_wall_speed:400,inner_wall_speed:600,infill_speed:600,travel_speed:700,bridge_speed:60,z_hop:0.4,line_width:0.42,infill_pattern:"Gyroid",seam_position:"Aligned",max_volumetric_speed:32,acceleration:20000,nozzle_system:"Vortek quick-change",note:"Open enclosure for PLA. 600mm/s on long straight walls."}),'Bambu Lab',1],

    ['PETG Standard','H2D','PETG','Bambu Lab',0.4,0.2,400,15,2,4,4,1.0,30,
      'PETG profile for the H2D. The active heated chamber and Vortek nozzle system allow faster PETG printing than traditional CoreXY printers. The consistent chamber temperature reduces warping on large parts.\n\nSuitable for: large functional PETG parts, production runs, enclosures, water-resistant components.',
      'H2D PETG tips:\n- Use Textured PEI plate — same rule as all Bambu printers for PETG\n- Active chamber at 40-45°C helps large PETG parts stay flat\n- Higher speeds than X1C/P1S due to superior motion system — 400mm/s is reliable\n- The Vortek nozzle handles PETG flow well — less stringing than standard nozzles\n- Keep enclosure closed to maintain stable chamber temperature\n- For transparent PETG: lower temp by 5°C and slow down to 250mm/s\n- AMS 2 Pro drying feature helps keep PETG moisture-free during long prints\n- Enable wipe and combing to reduce surface defects at high speeds\n- Camera monitoring catches PETG adhesion failures early\n- Large PETG parts (200mm+) benefit from 5mm brim and chamber preheat',
      JSON.stringify({nozzle_temp:235,nozzle_temp_first_layer:240,bed_temp:80,bed_temp_first_layer:85,fan_speed:"40% after layer 3",fan_speed_first_layer:"0%",first_layer_height:0.2,first_layer_speed:15,outer_wall_speed:300,inner_wall_speed:400,infill_speed:400,travel_speed:600,z_hop:0.4,build_plate:"Textured PEI",chamber_temp:"40-45°C",line_width:0.42,infill_pattern:"Gyroid",max_volumetric_speed:24,wipe_enabled:true,nozzle_system:"Vortek"}),'Bambu Lab',2],

    ['ABS Standard','H2D','ABS','Bambu Lab',0.4,0.2,300,15,3,5,4,0.8,30,
      'ABS profile for the H2D with active heated chamber. The H2D\'s active chamber heating is a game-changer for ABS — it maintains consistent 60°C+ chamber temperature, virtually eliminating warping even on large parts.\n\nThe Vortek nozzle system and advanced motion allow faster ABS printing than traditional enclosed printers. Chamber heating replaces the passive preheat strategy used on X1C/P1S.\n\nSuitable for: large ABS parts, production ABS printing, parts requiring minimal warping, acetone-smoothed final parts.',
      'H2D ABS tips:\n- Active chamber heating to 60°C+ = dramatically less warping than passive chambers\n- No need for 15-minute preheat — the active heater reaches target temperature quickly\n- 300mm/s ABS is achievable with the heated chamber keeping the part warm\n- Fan: 0% is still recommended. The heated chamber provides the thermal stability\n- Brim: can often be reduced to 3-5mm due to active chamber — less warping force\n- The Vortek nozzle maintains consistent ABS flow at high chamber temps\n- Carbon filter handles fumes — replace regularly with frequent ABS printing\n- Large flat ABS parts that were impossible without warping become reliable\n- Post-print: active cooling mode gradually reduces chamber temp to prevent thermal shock\n- ABS shrinkage is more uniform with active chamber heating — better dimensional accuracy\n- For production ABS: the H2D is the best Bambu printer for consistent, warp-free results',
      JSON.stringify({nozzle_temp:245,nozzle_temp_first_layer:250,bed_temp:105,bed_temp_first_layer:110,chamber_temp:"60°C active heating",fan_speed:"0% (max 15% overhangs)",fan_speed_first_layer:"0%",first_layer_height:0.2,first_layer_speed:15,outer_wall_speed:200,inner_wall_speed:300,infill_speed:300,travel_speed:500,z_hop:0.4,build_plate:"Textured PEI or Smooth PEI with glue",brim_width:"3-5mm (reduced due to active chamber)",enclosure:"REQUIRED — doors CLOSED",line_width:0.42,infill_pattern:"Gyroid",max_volumetric_speed:18,nozzle_system:"Vortek",shrinkage:"0.4-0.6% (more uniform with active chamber)"}),'Bambu Lab',3],

    ['PA-CF Engineering','H2D','PA-CF','Bambu Lab',0.4,0.2,200,15,3,5,4,0.5,20,
      'High-performance PA-CF (Carbon Fiber Nylon) profile for the H2D. The active heated chamber is transformative for PA-CF printing — maintaining 60°C+ eliminates the warping that plagues PA-CF on passively heated printers.\n\nThe H2D is arguably the best consumer printer for PA-CF: active chamber, Vortek hardened nozzle, and reliable high-temperature bed adhesion combine for production-quality engineering parts.\n\nSuitable for: structural components, drone frames, automotive brackets, industrial jigs, high-strength prototypes.',
      'H2D PA-CF tips:\n- Active chamber at 60°C+ is a massive advantage for PA — dramatically reduces warping\n- STILL dry the filament: 80°C for 8-12 hours minimum. Chamber doesn\'t fix wet filament\n- Use AMS HT with drying feature to keep PA-CF dry during multi-hour prints\n- Vortek hardened nozzle handles carbon fiber without wear — check it\'s installed before printing\n- High Temp Plate with Bambu liquid glue for bed adhesion\n- Brim can be smaller (5mm) vs X1C (8mm) due to active chamber reducing warp forces\n- Speed: 200mm/s is safe. The H2D can go faster but PA-CF layer adhesion suffers above 250mm/s\n- Active cooling mode after printing gradually reduces chamber temp — prevents thermal shock cracking\n- Parts reach full strength after 24-48 hours of crystallization at room temp\n- The H2D\'s camera monitors for common PA-CF issues: warping, delamination, nozzle clogs\n- For heat-set inserts: PA-CF + H2D = excellent results for functional assemblies',
      JSON.stringify({nozzle_temp:280,nozzle_temp_first_layer:285,bed_temp:90,bed_temp_first_layer:100,chamber_temp:"60°C+ active heating",fan_speed:"0-15%",fan_speed_first_layer:"0%",first_layer_height:0.2,first_layer_speed:10,outer_wall_speed:150,inner_wall_speed:200,infill_speed:200,travel_speed:400,z_hop:0.3,build_plate:"High Temp Plate + Bambu liquid glue",brim_width:"5mm",nozzle_type:"Vortek Hardened Steel",line_width:0.42,infill_pattern:"Gyroid",max_volumetric_speed:14,filament_drying:"80°C for 8-12h MANDATORY",note:"Active chamber dramatically reduces PA-CF warping."}),'Bambu Lab',4],

    ['PLA Standard','H2S','PLA','Bambu Lab',0.4,0.2,500,15,2,4,4,0.8,30,
      'PLA profile for the H2S — Bambu Lab\'s compact flagship with 500mm/s speeds and heated chamber in a smaller form factor than the H2D. The H2S brings H-series performance to a more affordable price point.\n\nSuitable for: general PLA printing at high speed, small to medium parts, rapid prototyping.',
      'H2S PLA tips:\n- 500mm/s is achievable for PLA on long straight walls — small parts will be acceleration-limited\n- Open enclosure door for PLA — heated chamber not needed\n- The Vortek nozzle system allows quick nozzle changes between projects\n- AMS 2 Pro compatible for multi-color printing\n- Same CoreXY motion as H2D but in a more compact package\n- Build volume 256x256x256mm — same as H2D despite smaller footprint\n- Excellent PLA cooling thanks to advanced fan design\n- For miniatures: slow to 200mm/s for maximum detail\n- Tree supports work well at high speeds\n- Clean smooth PEI with IPA regularly for consistent adhesion',
      JSON.stringify({nozzle_temp:210,nozzle_temp_first_layer:215,bed_temp:55,bed_temp_first_layer:60,fan_speed:"100% after layer 1",fan_speed_first_layer:"0%",first_layer_height:0.2,first_layer_speed:25,outer_wall_speed:350,inner_wall_speed:500,infill_speed:500,travel_speed:600,bridge_speed:60,z_hop:0.4,line_width:0.42,infill_pattern:"Gyroid",seam_position:"Aligned",max_volumetric_speed:28,acceleration:15000,nozzle_system:"Vortek"}),'Bambu Lab',1],

    ['ABS Standard','H2S','ABS','Bambu Lab',0.4,0.2,250,15,3,5,4,0.8,30,
      'ABS profile for the H2S with active heated chamber. Like the H2D, the H2S active chamber significantly reduces ABS warping compared to passive enclosures on X1C/P1S.\n\nSuitable for: functional ABS parts, heat-resistant components, acetone-smoothed models.',
      'H2S ABS tips:\n- Active chamber heating to 55-60°C — much better warp control than passive enclosures\n- Keep all doors closed during ABS printing\n- Fan: 0% for best results. Up to 15% for overhangs\n- Brim: 3-5mm usually sufficient with active chamber\n- Preheat is faster than passive — active heater reaches temp in minutes\n- Carbon filter handles fumes — replace regularly\n- 250mm/s is reliable for ABS — slower than PLA but faster than X1C ABS\n- Let parts cool gradually in the closed enclosure\n- ABS shrinkage is more predictable with consistent chamber temp\n- Acetone smoothing for professional finish',
      JSON.stringify({nozzle_temp:245,nozzle_temp_first_layer:250,bed_temp:105,bed_temp_first_layer:110,chamber_temp:"55-60°C active",fan_speed:"0%",fan_speed_first_layer:"0%",first_layer_height:0.2,first_layer_speed:15,outer_wall_speed:180,inner_wall_speed:250,infill_speed:250,travel_speed:450,z_hop:0.4,build_plate:"Textured PEI or Smooth PEI with glue",brim_width:"3-5mm",enclosure:"REQUIRED — closed",line_width:0.42,infill_pattern:"Gyroid",max_volumetric_speed:16}),'Bambu Lab',3],

    ['PLA Standard','H2C','PLA','Bambu Lab',0.4,0.2,600,15,2,4,4,0.8,30,
      'PLA profile for the H2C — Bambu Lab\'s multi-material powerhouse featuring the induction-heated Vortek nozzle for ultra-fast color changes. The H2C is designed for multi-color and multi-material printing at production speeds.\n\nThe induction heating system heats the nozzle in seconds, enabling the fastest color changes in the consumer market. Combined with 600mm/s speeds, the H2C excels at complex multi-color PLA prints.\n\nSuitable for: multi-color PLA prints, figurines, decorative items, complex multi-material designs.',
      'H2C PLA tips:\n- The induction-heated Vortek nozzle is the H2C\'s killer feature — near-instant heat changes\n- Multi-color changes are dramatically faster than traditional wipe-tower systems\n- AMS 2 Pro recommended for the best multi-color experience with up to 16 colors\n- 600mm/s for PLA — same speed capabilities as H2D\n- Open enclosure door for PLA — no chamber heat needed\n- Purge tower settings can be reduced compared to other printers — faster nozzle heating means less purge needed\n- For multi-color prints: design with material transitions at layer changes when possible\n- The induction system means zero ooze during color changes — cleaner transitions\n- Single-color prints are equally fast — the H2C is not just a multi-color machine\n- Build volume matches H2D at 256x256x256mm',
      JSON.stringify({nozzle_temp:210,nozzle_temp_first_layer:215,bed_temp:55,bed_temp_first_layer:60,fan_speed:"100% after layer 1",fan_speed_first_layer:"0%",first_layer_height:0.2,first_layer_speed:25,outer_wall_speed:400,inner_wall_speed:600,infill_speed:600,travel_speed:700,bridge_speed:60,z_hop:0.4,line_width:0.42,infill_pattern:"Gyroid",seam_position:"Aligned",max_volumetric_speed:32,acceleration:20000,nozzle_system:"Vortek Induction",color_change:"Ultra-fast induction heating",note:"Induction nozzle = fastest color changes in class."}),'Bambu Lab',1],

    ['PETG Standard','H2C','PETG','Bambu Lab',0.4,0.2,400,15,2,4,4,1.0,30,
      'Multi-material PETG profile for the H2C. The induction heating allows clean PETG-to-PLA transitions and fast PETG color changes with minimal purge waste.\n\nSuitable for: multi-color PETG parts, functional multi-material assemblies, production PETG printing.',
      'H2C PETG tips:\n- Use Textured PEI for PETG — standard Bambu rule applies\n- The induction nozzle handles PETG-to-PLA transitions cleanly\n- Multi-material prints: PETG body + PLA details work well with the H2C\'s fast material switching\n- Keep enclosure closed for large parts — active chamber at 40-45°C helps\n- 400mm/s PETG is reliable — faster than traditional CoreXY for PETG\n- Less purge waste than traditional printers — the induction system heats faster = less ooze\n- Camera monitors for stringing and adhesion issues\n- For transparent PETG: slow to 250mm/s and lower temp by 5°C\n- AMS 2 Pro drying keeps PETG moisture-free during long multi-color prints\n- Enable wipe moves for cleaner color transitions in multi-color PETG',
      JSON.stringify({nozzle_temp:235,nozzle_temp_first_layer:240,bed_temp:80,bed_temp_first_layer:85,fan_speed:"40% after layer 3",fan_speed_first_layer:"0%",first_layer_height:0.2,first_layer_speed:15,outer_wall_speed:300,inner_wall_speed:400,infill_speed:400,travel_speed:600,z_hop:0.4,build_plate:"Textured PEI",chamber_temp:"40-45°C",line_width:0.42,infill_pattern:"Gyroid",max_volumetric_speed:24,nozzle_system:"Vortek Induction",wipe_enabled:true}),'Bambu Lab',2],

    // ---- P1P profiles ----
    ['PLA Standard','P1P','PLA','Bambu Lab',0.4,0.2,300,15,2,4,4,0.8,30,
      'PLA profile for the P1P — the budget-friendly open-frame CoreXY. The P1P lacks an enclosure and camera but shares the same CoreXY motion system as the P1S. Excellent PLA performance at 300mm/s.\n\nThe open frame provides outstanding cooling for PLA — overhangs and bridges print very cleanly. No Lidar means manual Z-offset calibration is needed.\n\nSuitable for: general PLA printing on a budget with CoreXY speed.',
      'P1P PLA tips:\n- No enclosure = excellent natural cooling for PLA, better than enclosed printers\n- Manual Z-offset calibration required — run after changing plates or nozzles\n- CoreXY motion handles 300mm/s PLA easily\n- No camera — consider a separate webcam for remote monitoring\n- AMS compatible for multi-color printing\n- Upgrade path: add the P1S enclosure kit for ABS/ASA capability\n- Clean smooth PEI with IPA every few prints\n- Tree supports work great at full speed\n- The open frame means drafts can affect tall prints — orient away from AC/windows',
      JSON.stringify({nozzle_temp:210,nozzle_temp_first_layer:215,bed_temp:55,bed_temp_first_layer:60,fan_speed:"100% after layer 1",fan_speed_first_layer:"0%",first_layer_height:0.2,first_layer_speed:20,outer_wall_speed:200,inner_wall_speed:300,infill_speed:300,travel_speed:500,z_hop:0.4,line_width:0.42,infill_pattern:"Gyroid",max_volumetric_speed:21,acceleration:10000,note:"Open frame — excellent PLA cooling. Manual Z-offset required."}),'Bambu Lab',1],

    ['PETG Standard','P1P','PETG','Bambu Lab',0.4,0.2,250,15,2,4,4,1.0,30,
      'PETG profile for the P1P open-frame printer. PETG prints well on the P1P, though large parts may warp more than on enclosed printers due to the open frame. Small to medium parts print excellently.\n\nSuitable for: small to medium functional PETG parts, enclosures, water-resistant components.',
      'P1P PETG tips:\n- Use Textured PEI — never smooth PEI for PETG\n- Open frame means drafts affect PETG more — shield from AC/fans\n- For large PETG parts (150mm+): consider adding the P1S enclosure kit\n- Small to medium PETG parts print great without enclosure\n- Z-offset calibration is critical for PETG on P1P\n- Fan at 30-40%: good balance of overhang quality and layer adhesion\n- Some stringing is normal — dry filament helps\n- 250mm/s is reliable for PETG on P1P',
      JSON.stringify({nozzle_temp:235,nozzle_temp_first_layer:240,bed_temp:80,bed_temp_first_layer:85,fan_speed:"40% after layer 3",fan_speed_first_layer:"0%",first_layer_height:0.2,first_layer_speed:15,outer_wall_speed:200,inner_wall_speed:250,infill_speed:250,travel_speed:500,z_hop:0.4,build_plate:"Textured PEI",line_width:0.42,infill_pattern:"Gyroid",max_volumetric_speed:18,note:"Open frame — shield from drafts for best results."}),'Bambu Lab',2],

    // ---- X1E profiles ----
    ['PLA Standard','X1E','PLA','Bambu Lab',0.4,0.2,300,15,2,4,4,0.8,30,
      'PLA profile for the X1E industrial printer. Identical settings to the X1C for PLA — the X1E\'s active chamber heating and HEPA filtration aren\'t needed for PLA. Leave the enclosure door open for best cooling.\n\nSuitable for: all PLA printing. The X1E is overkill for PLA but produces identical results to X1C.',
      'X1E PLA tips:\n- Leave enclosure door OPEN for PLA — active chamber not needed\n- Lidar auto-calibrates first layer — same as X1C\n- All X1C PLA settings work directly on X1E\n- The HEPA filtration is unnecessary for PLA (no fumes) but won\'t hurt\n- Save the X1E for engineering materials — use a P2S or A1 for PLA if available',
      JSON.stringify({nozzle_temp:210,nozzle_temp_first_layer:215,bed_temp:55,bed_temp_first_layer:60,fan_speed:"100% after layer 1",fan_speed_first_layer:"0%",first_layer_height:0.2,first_layer_speed:20,outer_wall_speed:200,inner_wall_speed:300,infill_speed:300,travel_speed:500,z_hop:0.4,line_width:0.42,infill_pattern:"Gyroid",max_volumetric_speed:21,acceleration:10000}),'Bambu Lab',1],

    ['ABS Standard','X1E','ABS','Bambu Lab',0.4,0.2,200,15,3,5,4,0.8,30,
      'ABS profile for the X1E with active heated chamber up to 60°C. The X1E eliminates the biggest ABS challenge — warping — thanks to its actively heated chamber. No more passive preheat waiting.\n\nSuitable for: large ABS parts, production runs, parts requiring zero warping, precision ABS components.',
      'X1E ABS tips:\n- Active chamber at 60°C = dramatically less warping than passive X1C enclosure\n- HEPA filtration handles ABS fumes — much safer than carbon filter\n- Chamber reaches target temperature quickly with active heating\n- Brim can be reduced to 3-5mm due to active chamber\n- 0% fan for best results, up to 15% for overhangs only\n- Let parts cool gradually — active cooling mode available\n- ABS shrinkage is more uniform with consistent chamber temp\n- Best Bambu printer for large flat ABS parts that would warp on X1C',
      JSON.stringify({nozzle_temp:245,nozzle_temp_first_layer:250,bed_temp:105,bed_temp_first_layer:110,chamber_temp:"60°C active",fan_speed:"0%",fan_speed_first_layer:"0%",first_layer_height:0.2,first_layer_speed:15,outer_wall_speed:150,inner_wall_speed:200,infill_speed:200,travel_speed:400,z_hop:0.4,build_plate:"Textured PEI or Smooth PEI with glue",brim_width:"3-5mm",enclosure:"REQUIRED — closed",line_width:0.42,infill_pattern:"Gyroid",max_volumetric_speed:15}),'Bambu Lab',3],

    ['PA-CF Engineering','X1E','PA-CF','Bambu Lab',0.4,0.2,150,15,3,5,4,0.5,20,
      'PA-CF profile for the X1E — the ideal printer for this demanding material. Active 60°C chamber, HEPA filtration, and high-temp capability combine for production-quality PA-CF parts.\n\nSuitable for: structural components, aerospace brackets, automotive parts, industrial jigs, high-performance prototypes.',
      'X1E PA-CF tips:\n- Active chamber at 60°C is the X1E\'s biggest advantage for PA-CF\n- STILL dry filament: 80°C for 8-12h minimum — chamber doesn\'t fix wet filament\n- Use AMS HT with drying feature to maintain dry filament during long prints\n- HEPA filtration handles PA-CF particulates safely\n- Hardened steel nozzle mandatory — check before printing\n- High Temp Plate with Bambu liquid glue for adhesion\n- Brim: 5mm is usually sufficient with active chamber\n- Parts reach full strength after 24-48h crystallization\n- The X1E is the best Bambu printer for PA-CF reliability and consistency',
      JSON.stringify({nozzle_temp:280,nozzle_temp_first_layer:285,bed_temp:90,bed_temp_first_layer:100,chamber_temp:"60°C active",fan_speed:"0-15%",fan_speed_first_layer:"0%",first_layer_height:0.2,first_layer_speed:10,outer_wall_speed:100,inner_wall_speed:150,infill_speed:150,travel_speed:350,z_hop:0.3,build_plate:"High Temp Plate + Bambu liquid glue",brim_width:"5mm",nozzle_type:"Hardened Steel",line_width:0.42,infill_pattern:"Gyroid",max_volumetric_speed:12,filament_drying:"80°C 8-12h MANDATORY"}),'Bambu Lab',4],

    ['PETG Standard','X1E','PETG','Bambu Lab',0.4,0.2,250,15,2,4,4,1.0,30,
      'PETG profile for the X1E. The active chamber at 40-45°C helps large PETG parts stay flat. Same Lidar calibration as X1C ensures perfect first layers.\n\nSuitable for: large functional PETG parts, production runs, water-resistant components.',
      'X1E PETG tips:\n- Use Textured PEI — same rule as all Bambu printers\n- Active chamber at 40-45°C reduces warping on large parts\n- Lidar handles PETG first-layer gap automatically\n- HEPA filtration is overkill for PETG but adds peace of mind\n- 250mm/s is reliable for PETG\n- Some stringing is normal — dry filament first if excessive',
      JSON.stringify({nozzle_temp:235,nozzle_temp_first_layer:240,bed_temp:80,bed_temp_first_layer:85,fan_speed:"40% after layer 3",fan_speed_first_layer:"0%",first_layer_height:0.2,first_layer_speed:15,outer_wall_speed:200,inner_wall_speed:250,infill_speed:250,travel_speed:500,z_hop:0.4,build_plate:"Textured PEI",chamber_temp:"40-45°C",line_width:0.42,infill_pattern:"Gyroid",max_volumetric_speed:18,wipe_enabled:true}),'Bambu Lab',2],

    ['PC Standard','X1E','PC','Bambu Lab',0.4,0.2,150,15,3,5,4,0.8,25,
      'Polycarbonate profile for the X1E — the only Bambu printer truly suited for PC printing. The 60°C active chamber and HEPA filtration handle PC\'s demanding requirements: high chamber temp, toxic fumes, and extreme warping forces.\n\nSuitable for: transparent structural parts, high-impact enclosures, heat-resistant components up to 140°C.',
      'X1E PC tips:\n- Active chamber at 60°C is essential — PC warps extremely in passive enclosures\n- HEPA filtration is important — PC releases bisphenol A and other compounds when heated\n- Dry filament at 80°C for 6-8h — PC is very hygroscopic\n- Hardened steel nozzle recommended (PC is slightly abrasive at high temps)\n- High Temp Plate with Bambu liquid glue — generous layer\n- Fan: 0% for best layer adhesion. Max 10% for small overhangs\n- Brim: 8mm minimum — PC warping forces are extreme even with active chamber\n- Transparent PC: lower temp by 5°C, 0.1mm layer height for best clarity\n- Post-print: let cool very slowly in closed enclosure to prevent cracking\n- PC is one of the strongest printable plastics — 3x impact strength of ABS',
      JSON.stringify({nozzle_temp:270,nozzle_temp_first_layer:275,bed_temp:110,bed_temp_first_layer:115,chamber_temp:"60°C active",fan_speed:"0%",fan_speed_first_layer:"0%",first_layer_height:0.2,first_layer_speed:10,outer_wall_speed:100,inner_wall_speed:150,infill_speed:150,travel_speed:350,z_hop:0.3,build_plate:"High Temp Plate + liquid glue",brim_width:"8mm",nozzle_type:"Hardened Steel recommended",line_width:0.42,infill_pattern:"Gyroid",max_volumetric_speed:10,filament_drying:"80°C 6-8h"}),'Bambu Lab',4],

    // ---- A1 additional profiles ----
    ['PETG Standard','A1','PETG','Bambu Lab',0.4,0.2,250,15,2,4,4,1.0,30,
      'PETG profile for the A1 open-frame bed-slinger. PETG prints well on the A1 — the open frame provides good cooling for overhangs. Large parts may warp slightly without an enclosure.\n\nSuitable for: small to medium functional parts, enclosures, water-resistant components.',
      'A1 PETG tips:\n- Use Textured PEI plate — mandatory for PETG\n- Lidar auto-calibrates Z-offset — critical for PETG\n- Open frame means excellent overhang cooling but less consistent temps for large parts\n- Fan at 30-40% — standard PETG settings\n- Some stringing is normal — dry filament first\n- For large PETG parts: add brim and shield from drafts\n- AMS Lite works for multi-color PETG\n- 250mm/s is reliable — don\'t push higher to avoid stringing',
      JSON.stringify({nozzle_temp:235,nozzle_temp_first_layer:240,bed_temp:80,bed_temp_first_layer:85,fan_speed:"40% after layer 3",fan_speed_first_layer:"0%",first_layer_height:0.2,first_layer_speed:15,outer_wall_speed:200,inner_wall_speed:250,infill_speed:250,travel_speed:400,z_hop:0.4,build_plate:"Textured PEI",line_width:0.42,infill_pattern:"Gyroid",max_volumetric_speed:18,note:"Open frame — shield from drafts for large parts."}),'Bambu Lab',2],

    ['TPU 95A Flex','A1','TPU 95A','Bambu Lab',0.4,0.2,60,15,2,4,4,0.0,0,
      'TPU profile for the A1. The bed-slinger design works fine for TPU since print speeds are low (30-60mm/s). Feed from external spool holder only — NOT through AMS Lite.\n\nSuitable for: phone cases, bumpers, gaskets, flexible hinges, grip covers.',
      'A1 TPU tips:\n- EXTERNAL SPOOL HOLDER only — TPU will jam in AMS Lite\n- 30-60mm/s maximum — slower than other materials\n- NO retraction — set to 0mm to prevent jams\n- The A1\'s direct drive extruder handles TPU well\n- Bed-slinger: low speeds mean bed movement isn\'t an issue for TPU\n- Smooth PEI at 45-50°C — TPU sticks easily\n- Avoid supports if possible — very hard to remove from TPU',
      JSON.stringify({nozzle_temp:225,nozzle_temp_first_layer:230,bed_temp:50,bed_temp_first_layer:55,fan_speed:"60% after layer 3",fan_speed_first_layer:"0%",first_layer_height:0.2,first_layer_speed:15,outer_wall_speed:30,inner_wall_speed:50,infill_speed:60,travel_speed:150,retraction_distance:0,retraction_speed:0,z_hop:0.0,build_plate:"Smooth PEI",line_width:0.42,infill_pattern:"Gyroid",max_volumetric_speed:5,note:"External spool only — NOT AMS Lite."}),'Bambu Lab',3],

    // ---- A1 mini additional profiles ----
    ['PETG Standard','A1 mini','PETG','Bambu Lab',0.4,0.2,250,15,2,4,4,1.0,30,
      'PETG profile for the A1 mini. Small PETG parts print well on the compact build volume (180x180x180mm). The open frame provides good cooling.\n\nSuitable for: small functional parts, connectors, brackets, water-resistant components.',
      'A1 mini PETG tips:\n- Use Textured PEI — standard rule for PETG\n- Build volume is 180x180mm — plan accordingly\n- Open frame gives good overhang cooling\n- Fan at 30-40% — standard PETG\n- Lidar calibration handles first layer automatically\n- MK8 nozzles — cheap replacements available',
      JSON.stringify({nozzle_temp:235,nozzle_temp_first_layer:240,bed_temp:80,bed_temp_first_layer:85,fan_speed:"40% after layer 3",fan_speed_first_layer:"0%",first_layer_height:0.2,first_layer_speed:15,outer_wall_speed:200,inner_wall_speed:250,infill_speed:250,travel_speed:400,z_hop:0.4,build_plate:"Textured PEI",line_width:0.42,infill_pattern:"Gyroid",max_volumetric_speed:16,build_volume:"180x180x180mm"}),'Bambu Lab',2],

    // ---- P2S additional profiles ----
    ['TPU 95A Flex','P2S','TPU 95A','Bambu Lab',0.4,0.2,80,15,2,4,4,0.0,0,
      'TPU profile for the P2S enclosed printer. Feed from external spool holder only — NOT through AMS. The enclosure can be left open for TPU as chamber heat isn\'t needed.\n\nSuitable for: phone cases, bumpers, gaskets, vibration dampeners, grip covers.',
      'P2S TPU tips:\n- EXTERNAL SPOOL HOLDER only — TPU will jam in AMS\n- 30-80mm/s maximum — don\'t push higher\n- NO retraction — 0mm to prevent jams\n- Leave enclosure door open for better cooling\n- DynaSense extruder handles TPU well\n- Camera lets you monitor for jams remotely\n- Smooth PEI at 45-50°C for bed adhesion',
      JSON.stringify({nozzle_temp:225,nozzle_temp_first_layer:230,bed_temp:50,bed_temp_first_layer:55,fan_speed:"60% after layer 3",fan_speed_first_layer:"0%",first_layer_height:0.2,first_layer_speed:15,outer_wall_speed:40,inner_wall_speed:60,infill_speed:80,travel_speed:150,retraction_distance:0,retraction_speed:0,z_hop:0.0,build_plate:"Smooth PEI",line_width:0.42,infill_pattern:"Gyroid",max_volumetric_speed:6,note:"External spool only — NOT AMS."}),'Bambu Lab',3],

    ['ASA Outdoor','P2S','ASA','Bambu Lab',0.4,0.2,200,20,3,5,4,0.8,30,
      'ASA profile for the P2S enclosed printer. ASA needs an enclosure which the P2S provides. UV-stable material for outdoor parts — prints like ABS but won\'t yellow in sunlight.\n\nSuitable for: outdoor enclosures, garden fixtures, car accessories, weatherproof housings.',
      'P2S ASA tips:\n- Close all doors — ASA needs stable chamber temps like ABS\n- Preheat chamber: bed at 110°C for 10-15 minutes before starting\n- Carbon filter handles fumes — replace regularly\n- Fan: 0% for safest results, up to 15% for overhangs\n- DynaSense extruder maintains consistent flow\n- Camera monitoring catches warping early\n- ASA = UV stable — use instead of ABS for anything outdoors\n- Acetone smoothing works on ASA just like ABS',
      JSON.stringify({nozzle_temp:245,nozzle_temp_first_layer:250,bed_temp:105,bed_temp_first_layer:110,fan_speed:"0-10%",fan_speed_first_layer:"0%",first_layer_height:0.2,first_layer_speed:15,outer_wall_speed:150,inner_wall_speed:200,infill_speed:200,travel_speed:400,z_hop:0.4,build_plate:"Textured PEI or Smooth PEI with glue",brim_width:"5-8mm",enclosure:"REQUIRED — closed",line_width:0.42,infill_pattern:"Gyroid",max_volumetric_speed:15}),'Bambu Lab',3],

    ['PA-CF Engineering','P2S','PA-CF','Bambu Lab',0.4,0.2,150,15,3,5,4,0.5,20,
      'PA-CF profile for the P2S. The P2S enclosure provides passive chamber heating sufficient for PA-CF with proper preheat. Not as reliable as X1E/H2D active chambers for large PA-CF parts, but works well for small to medium prints.\n\nSuitable for: small to medium structural parts, brackets, jigs.',
      'P2S PA-CF tips:\n- Dry filament: 80°C for 8-12h minimum — mandatory\n- Hardened steel nozzle required — check before printing\n- Preheat chamber 15 minutes with bed at 100°C before starting\n- High Temp Plate + Bambu liquid glue for adhesion\n- Brim: 8mm for parts over 50mm\n- For large PA-CF parts: consider X1E or H2D with active chamber instead\n- DynaSense extruder handles PA-CF well\n- Let parts cool in closed enclosure slowly',
      JSON.stringify({nozzle_temp:280,nozzle_temp_first_layer:285,bed_temp:90,bed_temp_first_layer:100,fan_speed:"0-20%",fan_speed_first_layer:"0%",first_layer_height:0.2,first_layer_speed:10,outer_wall_speed:100,inner_wall_speed:150,infill_speed:150,travel_speed:350,z_hop:0.3,build_plate:"High Temp Plate + liquid glue",brim_width:"8mm",enclosure:"REQUIRED — sealed",nozzle_type:"Hardened Steel",line_width:0.42,infill_pattern:"Gyroid",max_volumetric_speed:12,filament_drying:"80°C 8-12h"}),'Bambu Lab',4],

    // ---- H2S additional profiles ----
    ['PETG Standard','H2S','PETG','Bambu Lab',0.4,0.2,400,15,2,4,4,1.0,30,
      'PETG profile for the H2S with active heated chamber. The active chamber at 40-45°C keeps large PETG parts flat while the Vortek nozzle system handles PETG flow at high speeds.\n\nSuitable for: functional PETG parts, production runs, large enclosures.',
      'H2S PETG tips:\n- Use Textured PEI plate\n- Active chamber at 40-45°C helps large parts stay flat\n- 400mm/s PETG is achievable on the H2S\n- Vortek nozzle handles PETG well with less stringing than standard nozzles\n- AMS 2 Pro drying keeps PETG moisture-free\n- Keep enclosure closed for consistent temps\n- Enable wipe moves for clean surfaces',
      JSON.stringify({nozzle_temp:235,nozzle_temp_first_layer:240,bed_temp:80,bed_temp_first_layer:85,fan_speed:"40% after layer 3",fan_speed_first_layer:"0%",first_layer_height:0.2,first_layer_speed:15,outer_wall_speed:300,inner_wall_speed:400,infill_speed:400,travel_speed:600,z_hop:0.4,build_plate:"Textured PEI",chamber_temp:"40-45°C",line_width:0.42,infill_pattern:"Gyroid",max_volumetric_speed:24,nozzle_system:"Vortek",wipe_enabled:true}),'Bambu Lab',2],

    ['PA-CF Engineering','H2S','PA-CF','Bambu Lab',0.4,0.2,150,15,3,5,4,0.5,20,
      'PA-CF profile for the H2S with active heated chamber. The active chamber provides excellent conditions for PA-CF — dramatically less warping than passive enclosures.\n\nSuitable for: structural parts, brackets, drone frames, jigs and fixtures.',
      'H2S PA-CF tips:\n- Active chamber at 55-60°C — great for PA-CF\n- Dry filament: 80°C for 8-12h mandatory\n- Vortek hardened nozzle handles carbon fiber\n- AMS HT recommended for keeping PA-CF dry during prints\n- High Temp Plate + Bambu liquid glue\n- 150mm/s is safe — don\'t push higher for PA-CF\n- Let parts cool in closed enclosure gradually',
      JSON.stringify({nozzle_temp:280,nozzle_temp_first_layer:285,bed_temp:90,bed_temp_first_layer:100,chamber_temp:"55-60°C active",fan_speed:"0-15%",fan_speed_first_layer:"0%",first_layer_height:0.2,first_layer_speed:10,outer_wall_speed:100,inner_wall_speed:150,infill_speed:150,travel_speed:400,z_hop:0.3,build_plate:"High Temp Plate + liquid glue",brim_width:"5mm",nozzle_type:"Vortek Hardened",line_width:0.42,infill_pattern:"Gyroid",max_volumetric_speed:12,filament_drying:"80°C 8-12h"}),'Bambu Lab',4],

    ['ASA Outdoor','H2S','ASA','Bambu Lab',0.4,0.2,250,20,3,5,4,0.8,30,
      'ASA profile for the H2S with active chamber. Active heating at 55-60°C makes ASA printing more reliable than passive enclosures. UV-stable material for outdoor parts.\n\nSuitable for: outdoor enclosures, garden fixtures, automotive parts, weatherproof housings.',
      'H2S ASA tips:\n- Active chamber dramatically reduces ASA warping\n- Close all doors during printing\n- Fan: 0% recommended, up to 15% for overhangs\n- Acetone smoothing works on ASA for weatherproofing\n- Carbon filter handles fumes — replace regularly\n- Brim: 3-5mm usually sufficient with active chamber\n- ASA = UV stable alternative to ABS for outdoor use',
      JSON.stringify({nozzle_temp:245,nozzle_temp_first_layer:250,bed_temp:105,bed_temp_first_layer:110,chamber_temp:"55-60°C active",fan_speed:"0-10%",fan_speed_first_layer:"0%",first_layer_height:0.2,first_layer_speed:15,outer_wall_speed:180,inner_wall_speed:250,infill_speed:250,travel_speed:450,z_hop:0.4,build_plate:"Textured PEI",brim_width:"3-5mm",enclosure:"REQUIRED — closed",line_width:0.42,infill_pattern:"Gyroid",max_volumetric_speed:16}),'Bambu Lab',3],

    // ---- H2D additional profiles ----
    ['ASA Outdoor','H2D','ASA','Bambu Lab',0.4,0.2,300,20,3,5,4,0.8,30,
      'ASA profile for the H2D with active chamber at 60°C+. Best Bambu printer for large UV-stable outdoor parts — the active chamber virtually eliminates warping.\n\nSuitable for: large outdoor parts, automotive components, production ASA runs.',
      'H2D ASA tips:\n- Active chamber at 60°C = almost zero warping even on large ASA parts\n- Same settings as ABS — ASA prints identically\n- UV stable — use ASA instead of ABS for anything outdoors\n- Acetone smoothing for weatherproofing and aesthetics\n- 300mm/s ASA is achievable with active chamber\n- Carbon filter handles fumes\n- Post-print: cool slowly for best dimensional stability',
      JSON.stringify({nozzle_temp:245,nozzle_temp_first_layer:250,bed_temp:105,bed_temp_first_layer:110,chamber_temp:"60°C active",fan_speed:"0-10%",fan_speed_first_layer:"0%",first_layer_height:0.2,first_layer_speed:15,outer_wall_speed:200,inner_wall_speed:300,infill_speed:300,travel_speed:500,z_hop:0.4,build_plate:"Textured PEI",brim_width:"3-5mm",enclosure:"REQUIRED — closed",line_width:0.42,infill_pattern:"Gyroid",max_volumetric_speed:18,nozzle_system:"Vortek"}),'Bambu Lab',3],

    ['TPU 95A Flex','H2D','TPU 95A','Bambu Lab',0.4,0.2,80,15,2,4,4,0.0,0,
      'TPU profile for the H2D. Feed from external spool holder — NOT through AMS 2 Pro. The H2D\'s direct drive Vortek extruder handles TPU well at low speeds.\n\nSuitable for: phone cases, bumpers, gaskets, vibration dampeners, flexible parts.',
      'H2D TPU tips:\n- EXTERNAL SPOOL HOLDER only — TPU jams in AMS 2 Pro\n- 30-80mm/s maximum — Vortek extruder handles TPU at these speeds\n- NO retraction — 0mm\n- Leave enclosure open for TPU — no chamber heat needed\n- Smooth PEI at 45-50°C\n- Avoid supports if possible — TPU supports are hard to remove',
      JSON.stringify({nozzle_temp:225,nozzle_temp_first_layer:230,bed_temp:50,bed_temp_first_layer:55,fan_speed:"60% after layer 3",fan_speed_first_layer:"0%",first_layer_height:0.2,first_layer_speed:15,outer_wall_speed:40,inner_wall_speed:60,infill_speed:80,travel_speed:150,retraction_distance:0,retraction_speed:0,z_hop:0.0,build_plate:"Smooth PEI",line_width:0.42,infill_pattern:"Gyroid",max_volumetric_speed:6,nozzle_system:"Vortek",note:"External spool only."}),'Bambu Lab',3],

    // ---- H2C additional profiles ----
    ['ABS Standard','H2C','ABS','Bambu Lab',0.4,0.2,300,15,3,5,4,0.8,30,
      'ABS profile for the H2C with active heated chamber and induction nozzle. Multi-color ABS printing benefits from the ultra-fast induction heating for minimal purge between colors.\n\nSuitable for: multi-color ABS parts, functional parts, acetone-smoothed models.',
      'H2C ABS tips:\n- Active chamber at 55-60°C — good warp control\n- Induction nozzle enables fast multi-color ABS with minimal purge\n- Close all doors during ABS printing\n- Fan: 0% for best results\n- Carbon filter handles fumes\n- Brim: 3-5mm with active chamber\n- Acetone smoothing works for professional finish\n- Multi-color ABS: the H2C is the fastest option available',
      JSON.stringify({nozzle_temp:245,nozzle_temp_first_layer:250,bed_temp:105,bed_temp_first_layer:110,chamber_temp:"55-60°C active",fan_speed:"0%",fan_speed_first_layer:"0%",first_layer_height:0.2,first_layer_speed:15,outer_wall_speed:200,inner_wall_speed:300,infill_speed:300,travel_speed:500,z_hop:0.4,build_plate:"Textured PEI or Smooth PEI with glue",brim_width:"3-5mm",enclosure:"REQUIRED — closed",line_width:0.42,infill_pattern:"Gyroid",max_volumetric_speed:18,nozzle_system:"Vortek Induction"}),'Bambu Lab',3],

    ['ASA Outdoor','H2C','ASA','Bambu Lab',0.4,0.2,300,20,3,5,4,0.8,30,
      'ASA profile for the H2C. Multi-color UV-stable outdoor parts — the induction nozzle makes color changes faster than any other printer. Active chamber reduces warping.\n\nSuitable for: multi-color outdoor parts, signage, decorative outdoor items.',
      'H2C ASA tips:\n- Active chamber + induction nozzle = fastest multi-color ASA\n- UV stable — perfect for outdoor multi-color parts\n- Same temps and settings as ABS\n- Acetone smoothing seals layer lines for weatherproofing\n- 300mm/s achievable with active chamber\n- Close all doors during printing\n- Minimal purge waste between ASA colors',
      JSON.stringify({nozzle_temp:245,nozzle_temp_first_layer:250,bed_temp:105,bed_temp_first_layer:110,chamber_temp:"55-60°C active",fan_speed:"0-10%",fan_speed_first_layer:"0%",first_layer_height:0.2,first_layer_speed:15,outer_wall_speed:200,inner_wall_speed:300,infill_speed:300,travel_speed:500,z_hop:0.4,build_plate:"Textured PEI",brim_width:"3-5mm",enclosure:"REQUIRED — closed",line_width:0.42,infill_pattern:"Gyroid",max_volumetric_speed:18,nozzle_system:"Vortek Induction"}),'Bambu Lab',3]
  ];
  for (const p of profiles) pi.run(...p);
}

function _mig057_favorites_multiprint() {
  db.exec(`ALTER TABLE spools ADD COLUMN is_favorite INTEGER DEFAULT 0`);
  db.exec(`ALTER TABLE queue_items ADD COLUMN target_printers TEXT`);
}

function _mig059_transmission_distance() {
  db.exec(`ALTER TABLE filament_profiles ADD COLUMN transmission_distance REAL`);
}

function _mig060_slicer_jobs() {
  db.exec(`CREATE TABLE IF NOT EXISTS slicer_jobs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    printer_id TEXT,
    original_filename TEXT NOT NULL,
    stored_filename TEXT,
    status TEXT DEFAULT 'uploading',
    slicer_used TEXT,
    gcode_filename TEXT,
    estimated_filament_g REAL,
    estimated_time_s INTEGER,
    file_size INTEGER,
    error_message TEXT,
    auto_queue INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now')),
    completed_at TEXT
  )`);
}

function _mig061_filament_database_v2() {
  const cols = [
    'pressure_advance_k REAL',
    'max_volumetric_speed REAL',
    'flow_ratio REAL',
    'retraction_distance REAL',
    'retraction_speed REAL',
    'fan_speed_min INTEGER',
    'fan_speed_max INTEGER',
    'chamber_temp INTEGER',
    'material_type TEXT',
    'category TEXT',
    'difficulty INTEGER',
    'image_url TEXT',
    'purchase_url TEXT',
    'price REAL',
    'price_currency TEXT',
    'brand_key TEXT',
    'external_source_id TEXT',
    'total_td_votes INTEGER',
    'tips TEXT',
    'updated_at TEXT'
  ];
  for (const col of cols) {
    try { db.exec(`ALTER TABLE community_filaments ADD COLUMN ${col}`); } catch { /* exists */ }
  }
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_cf_category ON community_filaments(category);
    CREATE INDEX IF NOT EXISTS idx_cf_brand_key ON community_filaments(brand_key);
    CREATE INDEX IF NOT EXISTS idx_cf_material_type ON community_filaments(material_type);
    CREATE INDEX IF NOT EXISTS idx_cf_source_id ON community_filaments(external_source_id);
  `);
}

function _mig062_price_alerts() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS price_alerts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      filament_profile_id INTEGER REFERENCES filament_profiles(id) ON DELETE CASCADE,
      target_price REAL NOT NULL,
      currency TEXT DEFAULT 'USD',
      source_url TEXT,
      notify INTEGER DEFAULT 1,
      triggered INTEGER DEFAULT 0,
      triggered_at TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_pa_profile ON price_alerts(filament_profile_id);
  `);
}

function _mig063_queue_tags() {
  try { db.exec('ALTER TABLE queue_items ADD COLUMN required_tags TEXT'); } catch { /* exists */ }
}

function _mig064_bed_mesh() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS bed_mesh_data (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      printer_id TEXT NOT NULL,
      mesh_data TEXT NOT NULL,
      mesh_rows INTEGER,
      mesh_cols INTEGER,
      z_min REAL,
      z_max REAL,
      z_mean REAL,
      z_std_dev REAL,
      source TEXT DEFAULT 'auto',
      captured_at TEXT DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_bmd_printer ON bed_mesh_data(printer_id);
  `);
}

function _mig065_filament_changes() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS filament_changes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      printer_id TEXT NOT NULL,
      from_spool_id INTEGER,
      to_spool_id INTEGER,
      ams_unit INTEGER,
      ams_tray INTEGER,
      status TEXT NOT NULL DEFAULT 'pending',
      current_step TEXT DEFAULT 'init',
      error_message TEXT,
      started_at TEXT DEFAULT (datetime('now')),
      completed_at TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_fc_printer ON filament_changes(printer_id);
  `);
}

function _mig066_price_source_url() {
  try { db.exec('ALTER TABLE filament_profiles ADD COLUMN purchase_url TEXT'); } catch { /* exists */ }
}

function _mig067_community_sharing() {
  const cols = ['shared_by TEXT', 'shared_from_profile_id INTEGER', 'rating_sum INTEGER DEFAULT 0', 'rating_count INTEGER DEFAULT 0'];
  for (const col of cols) {
    try { db.exec(`ALTER TABLE community_filaments ADD COLUMN ${col}`); } catch { /* exists */ }
  }
  db.exec(`
    CREATE TABLE IF NOT EXISTS community_ratings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      community_filament_id INTEGER NOT NULL REFERENCES community_filaments(id) ON DELETE CASCADE,
      user_id TEXT,
      rating INTEGER NOT NULL CHECK(rating >= 1 AND rating <= 5),
      comment TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      UNIQUE(community_filament_id, user_id)
    );
    CREATE INDEX IF NOT EXISTS idx_cr_filament ON community_ratings(community_filament_id);
  `);
}

function _mig069_compatibility_matrix() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS filament_compatibility (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      material TEXT NOT NULL,
      nozzle_type TEXT DEFAULT 'any',
      nozzle_size_min REAL,
      nozzle_size_max REAL,
      plate_type TEXT DEFAULT 'any',
      compatibility TEXT NOT NULL DEFAULT 'good',
      notes TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_fc_material ON filament_compatibility(material);
  `);
  const ins = db.prepare('INSERT OR IGNORE INTO filament_compatibility (material, nozzle_type, nozzle_size_min, nozzle_size_max, plate_type, compatibility, notes) VALUES (?, ?, ?, ?, ?, ?, ?)');
  const seed = [
    ['PLA', 'any', 0.2, 0.8, 'smooth_pei', 'good', null],
    ['PLA', 'any', 0.2, 0.8, 'textured_pei', 'good', null],
    ['PLA', 'any', 0.2, 0.8, 'cool_plate', 'good', null],
    ['PLA', 'any', 0.2, 0.8, 'engineering_plate', 'fair', 'May stick too well'],
    ['PETG', 'any', 0.2, 0.8, 'smooth_pei', 'poor', 'Bonds permanently to smooth PEI'],
    ['PETG', 'any', 0.2, 0.8, 'textured_pei', 'good', null],
    ['PETG', 'any', 0.2, 0.8, 'cool_plate', 'good', null],
    ['PETG', 'any', 0.2, 0.8, 'engineering_plate', 'good', null],
    ['ABS', 'any', 0.2, 0.8, 'smooth_pei', 'good', 'Requires enclosure'],
    ['ABS', 'any', 0.2, 0.8, 'textured_pei', 'good', 'Requires enclosure'],
    ['ABS', 'any', 0.2, 0.8, 'engineering_plate', 'good', null],
    ['ABS', 'any', 0.2, 0.8, 'cool_plate', 'poor', 'Poor adhesion'],
    ['TPU', 'any', 0.4, 0.8, 'smooth_pei', 'good', null],
    ['TPU', 'any', 0.4, 0.8, 'textured_pei', 'fair', null],
    ['TPU', 'any', 0.2, 0.3, 'any', 'poor', 'Too flexible for small nozzles'],
    ['PA', 'hardened_steel', 0.4, 0.8, 'textured_pei', 'good', null],
    ['PA', 'hardened_steel', 0.4, 0.8, 'engineering_plate', 'good', null],
    ['PA', 'any', 0.4, 0.8, 'smooth_pei', 'fair', 'May warp'],
    ['PA-CF', 'hardened_steel', 0.4, 0.8, 'any', 'good', 'Requires hardened nozzle'],
    ['PA-CF', 'brass', 0.4, 0.8, 'any', 'poor', 'Will damage brass nozzle'],
    ['PC', 'any', 0.4, 0.8, 'engineering_plate', 'good', 'Requires enclosure, high temps'],
    ['PC', 'any', 0.4, 0.8, 'smooth_pei', 'fair', null],
    ['ASA', 'any', 0.2, 0.8, 'smooth_pei', 'good', 'Requires enclosure'],
    ['ASA', 'any', 0.2, 0.8, 'textured_pei', 'good', 'Requires enclosure'],
    ['PLA-CF', 'hardened_steel', 0.4, 0.8, 'any', 'good', 'Requires hardened nozzle'],
    ['PLA-CF', 'brass', 0.4, 0.8, 'any', 'poor', 'Will damage brass nozzle'],
    ['PETG-CF', 'hardened_steel', 0.4, 0.8, 'textured_pei', 'good', 'Requires hardened nozzle'],
    ['PVA', 'any', 0.4, 0.6, 'smooth_pei', 'good', 'Support material, water soluble'],
  ];
  for (const r of seed) ins.run(...r);
}

function _mig068_material_modifiers() {
  try { db.exec('ALTER TABLE filament_profiles ADD COLUMN modifiers TEXT'); } catch { /* exists */ }
}

function _mig070_competitive_features() {
  // #1: Storage method per spool (dry_box, open_air, vacuum_bag, none)
  try { db.exec('ALTER TABLE spools ADD COLUMN storage_method TEXT'); } catch { /* exists */ }
  // #4: Short spool ID for physical marking
  try { db.exec('ALTER TABLE spools ADD COLUMN short_id TEXT'); } catch { /* exists */ }
  // Generate short IDs for existing spools
  const existing = db.prepare('SELECT id FROM spools WHERE short_id IS NULL').all();
  for (const row of existing) {
    const sid = _generateShortId();
    db.prepare('UPDATE spools SET short_id = ? WHERE id = ?').run(sid, row.id);
  }
  try { db.exec('CREATE UNIQUE INDEX IF NOT EXISTS idx_spools_short_id ON spools(short_id)'); } catch { /* exists */ }
  // #5: Location hierarchy (parent_id) and min/max alerts
  try { db.exec('ALTER TABLE locations ADD COLUMN parent_id INTEGER REFERENCES locations(id)'); } catch { /* exists */ }
  try { db.exec('ALTER TABLE locations ADD COLUMN min_spools INTEGER'); } catch { /* exists */ }
  try { db.exec('ALTER TABLE locations ADD COLUMN max_spools INTEGER'); } catch { /* exists */ }
  try { db.exec('ALTER TABLE locations ADD COLUMN min_weight_kg REAL'); } catch { /* exists */ }
  try { db.exec('ALTER TABLE locations ADD COLUMN max_weight_kg REAL'); } catch { /* exists */ }
  // #2: Auto-trash setting (stored in inventory_settings)
  const existing2 = db.prepare("SELECT 1 FROM inventory_settings WHERE key = 'auto_trash_days'").get();
  if (!existing2) db.prepare("INSERT INTO inventory_settings (key, value) VALUES ('auto_trash_days', '0')").run();
  // #8: Recent profiles tracking (stored in inventory_settings)
  const existing3 = db.prepare("SELECT 1 FROM inventory_settings WHERE key = 'recent_profiles'").get();
  if (!existing3) db.prepare("INSERT INTO inventory_settings (key, value) VALUES ('recent_profiles', '[]')").run();
}

function _mig071_printer_cost_settings() {
  const cols = ['electricity_rate_kwh REAL', 'printer_wattage REAL', 'machine_cost REAL', 'machine_lifetime_hours REAL'];
  for (const col of cols) {
    try { db.exec(`ALTER TABLE printers ADD COLUMN ${col}`); } catch { /* exists */ }
  }
}

function _mig072_location_fk() {
  try { db.exec('ALTER TABLE spools ADD COLUMN location_id INTEGER REFERENCES locations(id) ON DELETE SET NULL'); } catch { /* exists */ }
  db.exec('CREATE INDEX IF NOT EXISTS idx_spools_location_id ON spools(location_id)');
  db.exec(`UPDATE spools SET location_id = (SELECT id FROM locations WHERE name = spools.location) WHERE location IS NOT NULL AND location_id IS NULL`);
}

function _generateShortId() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // No I/O/0/1 to avoid confusion
  for (let attempt = 0; attempt < 100; attempt++) {
    let id = '';
    for (let i = 0; i < 4; i++) id += chars[Math.floor(Math.random() * chars.length)];
    const exists = db.prepare('SELECT 1 FROM spools WHERE short_id = ?').get(id);
    if (!exists) return id;
  }
  return Date.now().toString(36).slice(-4).toUpperCase();
}

function _mig058_shared_palettes() {
  db.exec(`CREATE TABLE IF NOT EXISTS shared_palettes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    token TEXT UNIQUE NOT NULL,
    title TEXT,
    filters TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    expires_at TEXT,
    view_count INTEGER DEFAULT 0
  )`);
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
    added_at: r.added_at,
    electricity_rate_kwh: r.electricity_rate_kwh,
    printer_wattage: r.printer_wattage,
    machine_cost: r.machine_cost,
    machine_lifetime_hours: r.machine_lifetime_hours
  }));
}

export function addPrinter(p) {
  return db.prepare('INSERT INTO printers (id, name, ip, serial, access_code, model) VALUES (?, ?, ?, ?, ?, ?)').run(
    p.id, p.name, p.ip || null, p.serial || null, p.accessCode || null, p.model || null
  );
}

export function updatePrinter(id, p) {
  return db.prepare(`UPDATE printers SET name=?, ip=?, serial=?, access_code=?, model=?,
    electricity_rate_kwh=?, printer_wattage=?, machine_cost=?, machine_lifetime_hours=? WHERE id=?`).run(
    p.name, p.ip || null, p.serial || null, p.accessCode || null, p.model || null,
    p.electricity_rate_kwh ?? null, p.printer_wattage ?? null, p.machine_cost ?? null, p.machine_lifetime_hours ?? null, id
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
  const result = db.prepare(`
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
  return Number(result.lastInsertRowid);
}

// ---- Statistics ----

export function getStatistics(printerId = null, startDate = null, endDate = null) {
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

  // Weekly trends: respect date range if given, else last 56 days
  const weekWhere = startDate ? where : (where ? where + ' AND' : ' WHERE') + " started_at >= datetime('now', '-56 days')";
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
  const tempStats = db.prepare(`SELECT COALESCE(MAX(max_nozzle_temp), 0) as peak_nozzle, COALESCE(AVG(max_nozzle_temp), 0) as avg_nozzle, COALESCE(MAX(max_bed_temp), 0) as peak_bed, COALESCE(AVG(max_bed_temp), 0) as avg_bed FROM print_history${where}${and}status = 'completed' AND max_nozzle_temp > 0`).get(...params);

  // Top 5 files
  const topFiles = db.prepare(`SELECT filename, COUNT(*) as count, SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed FROM print_history${where}${and}filename IS NOT NULL GROUP BY filename ORDER BY count DESC LIMIT 5`).all(...params);

  // Monthly trends: respect date range if given, else last 180 days
  const monthWhere = startDate ? where : (where ? where + ' AND' : ' WHERE') + " started_at >= datetime('now', '-180 days')";
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
  const amsFilamentByBrand = db.prepare(`SELECT tray_brand as brand, tray_type as type, COUNT(*) as snapshots FROM ams_snapshots${amsWhere}${amsWhere ? ' AND' : ' WHERE'} tray_brand IS NOT NULL GROUP BY tray_brand, tray_type ORDER BY snapshots DESC LIMIT 10`).all(...amsParams);
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

export function acknowledgeError(id) {
  return db.prepare('UPDATE error_log SET acknowledged = 1 WHERE id = ?').run(id);
}

export function deleteError(id) {
  return db.prepare('DELETE FROM error_log WHERE id = ?').run(id);
}

export function acknowledgeAllErrors(printerId = null) {
  if (printerId) {
    return db.prepare('UPDATE error_log SET acknowledged = 1 WHERE printer_id = ? AND acknowledged = 0').run(printerId);
  }
  return db.prepare('UPDATE error_log SET acknowledged = 1 WHERE acknowledged = 0').run();
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
  return db.prepare(`UPDATE nozzle_sessions SET retired_at = datetime('now') WHERE id = ?`).run(sessionId);
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
    'xcam_events', 'ams_tray_lifetime', 'filament_inventory',
    'protection_log', 'protection_settings', 'notification_log',
    'notification_queue', 'model_links'
  ];

  let deleted = 0;
  for (const table of tables) {
    try {
      const r = db.prepare(`DELETE FROM ${table} WHERE printer_id IN (${placeholders})`).run(...ids);
      deleted += r.changes;
    } catch { /* table may not exist */ }
  }

  // Delete spools assigned to demo printers + their usage logs and drying sessions
  try {
    const demoSpoolIds = db.prepare(`SELECT id FROM spools WHERE printer_id IN (${placeholders})`).all(...ids).map(r => r.id);
    if (demoSpoolIds.length > 0) {
      const sp = demoSpoolIds.map(() => '?').join(',');
      try { db.prepare(`DELETE FROM spool_usage_log WHERE spool_id IN (${sp})`).run(...demoSpoolIds); } catch {}
      try { db.prepare(`DELETE FROM drying_sessions WHERE spool_id IN (${sp})`).run(...demoSpoolIds); } catch {}
      const r = db.prepare(`DELETE FROM spools WHERE id IN (${sp})`).run(...demoSpoolIds);
      deleted += r.changes;
    }
  } catch {}

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

// ---- Vendors ----

export function getVendors(filters = {}) {
  if (filters.limit) {
    const total = db.prepare('SELECT COUNT(*) as total FROM vendors').get().total;
    const rows = db.prepare('SELECT * FROM vendors ORDER BY name LIMIT ? OFFSET ?')
      .all(filters.limit, filters.offset || 0);
    return { rows, total };
  }
  return db.prepare('SELECT * FROM vendors ORDER BY name').all();
}

export function addVendor(v) {
  const result = db.prepare('INSERT INTO vendors (name, website, empty_spool_weight_g, comment, extra_fields, external_id) VALUES (?, ?, ?, ?, ?, ?)')
    .run(v.name, v.website || null, v.empty_spool_weight_g || null, v.comment || null,
      v.extra_fields ? (typeof v.extra_fields === 'string' ? v.extra_fields : JSON.stringify(v.extra_fields)) : null,
      v.external_id || null);
  return { id: Number(result.lastInsertRowid), ...v };
}

export function updateVendor(id, v) {
  db.prepare('UPDATE vendors SET name=?, website=?, empty_spool_weight_g=?, comment=?, extra_fields=?, external_id=? WHERE id=?')
    .run(v.name, v.website || null, v.empty_spool_weight_g || null, v.comment || null,
      v.extra_fields ? (typeof v.extra_fields === 'string' ? v.extra_fields : JSON.stringify(v.extra_fields)) : null,
      v.external_id || null, id);
}

export function deleteVendor(id) {
  db.prepare('DELETE FROM vendors WHERE id=?').run(id);
}

// ---- Filament Profiles ----

export function getFilamentProfiles(filters = {}) {
  let where = ' WHERE 1=1';
  const params = [];
  if (filters.vendor_id) { where += ' AND fp.vendor_id = ?'; params.push(filters.vendor_id); }
  if (filters.material) { where += ' AND fp.material = ?'; params.push(filters.material); }
  const baseSql = `FROM filament_profiles fp LEFT JOIN vendors v ON fp.vendor_id = v.id` + where;
  if (filters.limit) {
    const total = db.prepare(`SELECT COUNT(*) as total ${baseSql}`).get(...params).total;
    const rows = db.prepare(`SELECT fp.*, v.name as vendor_name ${baseSql} ORDER BY v.name, fp.name LIMIT ? OFFSET ?`)
      .all(...params, filters.limit, filters.offset || 0);
    return { rows, total };
  }
  return db.prepare(`SELECT fp.*, v.name as vendor_name ${baseSql} ORDER BY v.name, fp.name`).all(...params);
}

export function getFilamentProfile(id) {
  return db.prepare(`SELECT fp.*, v.name as vendor_name FROM filament_profiles fp
    LEFT JOIN vendors v ON fp.vendor_id = v.id WHERE fp.id = ?`).get(id) || null;
}

function _jsonCol(val) {
  if (!val) return null;
  return typeof val === 'string' ? val : JSON.stringify(val);
}

export function addFilamentProfile(p) {
  const result = db.prepare(`INSERT INTO filament_profiles
    (vendor_id, name, material, color_name, color_hex, density, diameter, spool_weight_g,
     nozzle_temp_min, nozzle_temp_max, bed_temp_min, bed_temp_max, comment,
     article_number, multi_color_hexes, multi_color_direction, extra_fields,
     finish, translucent, glow, weight_options, external_id, diameters, weights, price,
     pressure_advance_k, max_volumetric_speed, retraction_distance, retraction_speed, cooling_fan_speed, optimal_settings,
     transmission_distance, modifiers)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
    p.vendor_id || null, p.name, p.material, p.color_name || null, p.color_hex || null,
    p.density ?? 1.24, p.diameter ?? 1.75, p.spool_weight_g ?? 1000,
    p.nozzle_temp_min || null, p.nozzle_temp_max || null, p.bed_temp_min || null, p.bed_temp_max || null,
    p.comment || null, p.article_number || null,
    _jsonCol(p.multi_color_hexes), p.multi_color_direction || null, _jsonCol(p.extra_fields),
    p.finish || null, p.translucent ? 1 : 0, p.glow ? 1 : 0,
    _jsonCol(p.weight_options), p.external_id || null, _jsonCol(p.diameters), _jsonCol(p.weights),
    p.price ?? null,
    p.pressure_advance_k ?? null, p.max_volumetric_speed ?? null, p.retraction_distance ?? null,
    p.retraction_speed ?? null, p.cooling_fan_speed ?? null, _jsonCol(p.optimal_settings),
    p.transmission_distance ?? null, _jsonCol(p.modifiers));
  return { id: Number(result.lastInsertRowid) };
}

export function updateFilamentProfile(id, p) {
  db.prepare(`UPDATE filament_profiles SET vendor_id=?, name=?, material=?, color_name=?, color_hex=?,
    density=?, diameter=?, spool_weight_g=?, nozzle_temp_min=?, nozzle_temp_max=?, bed_temp_min=?, bed_temp_max=?,
    comment=?, article_number=?, multi_color_hexes=?, multi_color_direction=?, extra_fields=?,
    finish=?, translucent=?, glow=?, weight_options=?, external_id=?, diameters=?, weights=?, price=?,
    pressure_advance_k=?, max_volumetric_speed=?, retraction_distance=?, retraction_speed=?, cooling_fan_speed=?, optimal_settings=?,
    transmission_distance=?, modifiers=?
    WHERE id=?`).run(
    p.vendor_id || null, p.name, p.material, p.color_name || null, p.color_hex || null,
    p.density ?? 1.24, p.diameter ?? 1.75, p.spool_weight_g ?? 1000,
    p.nozzle_temp_min || null, p.nozzle_temp_max || null, p.bed_temp_min || null, p.bed_temp_max || null,
    p.comment || null, p.article_number || null,
    _jsonCol(p.multi_color_hexes), p.multi_color_direction || null, _jsonCol(p.extra_fields),
    p.finish || null, p.translucent ? 1 : 0, p.glow ? 1 : 0,
    _jsonCol(p.weight_options), p.external_id || null, _jsonCol(p.diameters), _jsonCol(p.weights),
    p.price ?? null,
    p.pressure_advance_k ?? null, p.max_volumetric_speed ?? null, p.retraction_distance ?? null,
    p.retraction_speed ?? null, p.cooling_fan_speed ?? null, _jsonCol(p.optimal_settings),
    p.transmission_distance ?? null, _jsonCol(p.modifiers), id);
}

export function deleteFilamentProfile(id) {
  db.prepare('DELETE FROM filament_profiles WHERE id=?').run(id);
}

// ---- Spools ----

const SPOOL_SELECT = `SELECT s.*,
  fp.name as profile_name, fp.material, fp.color_name, fp.color_hex,
  fp.density, fp.diameter, fp.spool_weight_g as profile_spool_weight_g,
  fp.nozzle_temp_min, fp.nozzle_temp_max, fp.bed_temp_min, fp.bed_temp_max,
  fp.article_number, fp.multi_color_hexes, fp.multi_color_direction,
  fp.extra_fields as profile_extra_fields,
  fp.finish, fp.translucent, fp.glow, fp.weight_options,
  fp.price as profile_price,
  fp.pressure_advance_k, fp.max_volumetric_speed, fp.retraction_distance, fp.retraction_speed, fp.cooling_fan_speed, fp.optimal_settings,
  fp.external_id as profile_external_id, fp.diameters, fp.weights,
  v.name as vendor_name, v.id as vendor_id, v.empty_spool_weight_g as vendor_empty_spool_weight_g,
  v.external_id as vendor_external_id
  FROM spools s
  LEFT JOIN filament_profiles fp ON s.filament_profile_id = fp.id
  LEFT JOIN vendors v ON fp.vendor_id = v.id`;

export function getSpools(filters = {}) {
  let where = ' WHERE 1=1';
  const params = [];
  if (filters.archived !== undefined) { where += ' AND s.archived = ?'; params.push(filters.archived ? 1 : 0); }
  if (filters.material) { where += ' AND fp.material = ?'; params.push(filters.material); }
  if (filters.vendor_id) { where += ' AND fp.vendor_id = ?'; params.push(filters.vendor_id); }
  if (filters.location) { where += ' AND s.location = ?'; params.push(filters.location); }
  if (filters.printer_id) { where += ' AND s.printer_id = ?'; params.push(filters.printer_id); }
  if (filters.tag_id) { where += ' AND s.id IN (SELECT entity_id FROM entity_tags WHERE entity_type = ? AND tag_id = ?)'; params.push('spool', filters.tag_id); }
  const countSql = `SELECT COUNT(*) as total FROM spools s
    LEFT JOIN filament_profiles fp ON s.filament_profile_id = fp.id
    LEFT JOIN vendors v ON fp.vendor_id = v.id` + where;
  const total = db.prepare(countSql).get(...params).total;
  let sql = SPOOL_SELECT + where + ' ORDER BY s.archived ASC, s.last_used_at DESC NULLS LAST, s.created_at DESC';
  if (filters.limit) { sql += ' LIMIT ?'; params.push(filters.limit); }
  if (filters.offset) { sql += ' OFFSET ?'; params.push(filters.offset); }
  const rows = _enrichSpoolRows(db.prepare(sql).all(...params));
  // Enrich with tags
  const tagStmt = db.prepare('SELECT t.* FROM tags t JOIN entity_tags et ON t.id = et.tag_id WHERE et.entity_type = ? AND et.entity_id = ? ORDER BY t.name');
  for (const row of rows) { row.tags = tagStmt.all('spool', row.id); }
  return { rows, total };
}

export function getSpool(id) {
  const row = db.prepare(SPOOL_SELECT + ' WHERE s.id = ?').get(id) || null;
  if (row) {
    _enrichSpoolRows([row]);
    row.tags = db.prepare('SELECT t.* FROM tags t JOIN entity_tags et ON t.id = et.tag_id WHERE et.entity_type = ? AND et.entity_id = ? ORDER BY t.name').all('spool', row.id);
  }
  return row;
}

export function addSpool(s) {
  const shortId = _generateShortId();
  const result = db.prepare(`INSERT INTO spools
    (filament_profile_id, remaining_weight_g, used_weight_g, initial_weight_g, cost, lot_number,
     purchase_date, location, printer_id, ams_unit, ams_tray, comment, extra_fields, spool_weight,
     storage_method, short_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
    s.filament_profile_id || null, s.remaining_weight_g ?? s.initial_weight_g ?? 1000,
    s.used_weight_g ?? 0, s.initial_weight_g ?? 1000,
    s.cost || null, s.lot_number || null, s.purchase_date || null,
    s.location || null, s.printer_id || null, s.ams_unit ?? null, s.ams_tray ?? null,
    s.comment || null, s.extra_fields ? JSON.stringify(s.extra_fields) : null,
    s.spool_weight ?? null, s.storage_method || null, shortId);
  const newId = Number(result.lastInsertRowid);
  try { addSpoolEvent(newId, 'created', null, null); } catch (_) {}
  return { id: newId, short_id: shortId };
}

export function updateSpool(id, s) {
  db.prepare(`UPDATE spools SET filament_profile_id=?, remaining_weight_g=?, used_weight_g=?,
    initial_weight_g=?, cost=?, lot_number=?, purchase_date=?, location=?,
    printer_id=?, ams_unit=?, ams_tray=?, archived=?, comment=?, extra_fields=?, spool_weight=?,
    storage_method=?
    WHERE id=?`).run(
    s.filament_profile_id || null, s.remaining_weight_g, s.used_weight_g,
    s.initial_weight_g, s.cost || null, s.lot_number || null, s.purchase_date || null,
    s.location || null, s.printer_id || null, s.ams_unit ?? null, s.ams_tray ?? null,
    s.archived ?? 0, s.comment || null,
    s.extra_fields ? JSON.stringify(s.extra_fields) : null, s.spool_weight ?? null,
    s.storage_method || null, id);
  try { addSpoolEvent(id, 'edited', null, null); } catch (_) {}
}

export function deleteSpool(id) {
  db.prepare('DELETE FROM spools WHERE id=?').run(id);
}

export function archiveSpool(id, archived = true) {
  db.prepare('UPDATE spools SET archived = ? WHERE id = ?').run(archived ? 1 : 0, id);
  try { addSpoolEvent(id, archived ? 'archived' : 'unarchived', null, null); } catch (_) {}
}

export function autoTrashEmptySpools() {
  const setting = getInventorySetting('auto_trash_days');
  const days = parseInt(setting) || 0;
  if (days <= 0) return 0;
  const threshold = getInventorySetting('low_stock_threshold') || 20;
  const minWeight = 10; // grams - consider empty below this
  const result = db.prepare(`DELETE FROM spools WHERE archived = 1 AND remaining_weight_g <= ?
    AND julianday('now') - julianday(COALESCE(last_used_at, created_at)) > ?`).run(minWeight, days);
  return result.changes;
}

export function getRecentProfiles(limit = 5) {
  return db.prepare(`SELECT DISTINCT fp.* FROM filament_profiles fp
    INNER JOIN spools s ON s.filament_profile_id = fp.id
    ORDER BY s.created_at DESC LIMIT ?`).all(limit);
}

export function getLocationAlerts() {
  const locations = db.prepare(`SELECT l.*,
    (SELECT COUNT(*) FROM spools s WHERE (s.location_id = l.id OR s.location = l.name) AND s.archived = 0) as spool_count,
    (SELECT COALESCE(SUM(s.remaining_weight_g), 0) / 1000.0 FROM spools s WHERE (s.location_id = l.id OR s.location = l.name) AND s.archived = 0) as total_weight_kg
    FROM locations l
    WHERE l.min_spools IS NOT NULL OR l.max_spools IS NOT NULL OR l.min_weight_kg IS NOT NULL OR l.max_weight_kg IS NOT NULL`).all();
  const alerts = [];
  for (const loc of locations) {
    if (loc.min_spools != null && loc.spool_count < loc.min_spools) alerts.push({ location: loc.name, type: 'min_spools', current: loc.spool_count, threshold: loc.min_spools });
    if (loc.max_spools != null && loc.spool_count > loc.max_spools) alerts.push({ location: loc.name, type: 'max_spools', current: loc.spool_count, threshold: loc.max_spools });
    if (loc.min_weight_kg != null && loc.total_weight_kg < loc.min_weight_kg) alerts.push({ location: loc.name, type: 'min_weight', current: loc.total_weight_kg, threshold: loc.min_weight_kg });
    if (loc.max_weight_kg != null && loc.total_weight_kg > loc.max_weight_kg) alerts.push({ location: loc.name, type: 'max_weight', current: loc.total_weight_kg, threshold: loc.max_weight_kg });
  }
  return alerts;
}

export function useSpoolWeight(spoolId, weightG, source = 'auto', printHistoryId = null, printerId = null) {
  db.prepare(`UPDATE spools SET
    remaining_weight_g = MAX(0, remaining_weight_g - ?),
    used_weight_g = used_weight_g + ?,
    last_used_at = datetime('now'),
    first_used_at = COALESCE(first_used_at, datetime('now'))
    WHERE id = ?`).run(weightG, weightG, spoolId);

  db.prepare(`INSERT INTO spool_usage_log (spool_id, print_history_id, printer_id, used_weight_g, source)
    VALUES (?, ?, ?, ?, ?)`).run(spoolId, printHistoryId || null, printerId || null, weightG, source);
  try { addSpoolEvent(spoolId, 'used', JSON.stringify({ weight_g: weightG, source }), null); } catch (_) {}
}

export function assignSpoolToSlot(spoolId, printerId, amsUnit, amsTray) {
  // Clear any existing spool in this slot
  if (printerId != null && amsUnit != null && amsTray != null) {
    db.prepare('UPDATE spools SET printer_id = NULL, ams_unit = NULL, ams_tray = NULL WHERE printer_id = ? AND ams_unit = ? AND ams_tray = ? AND id != ?')
      .run(printerId, amsUnit, amsTray, spoolId);
  }
  db.prepare('UPDATE spools SET printer_id = ?, ams_unit = ?, ams_tray = ? WHERE id = ?')
    .run(printerId || null, amsUnit ?? null, amsTray ?? null, spoolId);
  try {
    const evt = printerId ? 'assigned' : 'unassigned';
    addSpoolEvent(spoolId, evt, JSON.stringify({ printer_id: printerId, ams_unit: amsUnit, ams_tray: amsTray }), null);
  } catch (_) {}
}

export function getSpoolBySlot(printerId, amsUnit, amsTray) {
  return db.prepare(SPOOL_SELECT + ' WHERE s.printer_id = ? AND s.ams_unit = ? AND s.ams_tray = ? AND s.archived = 0')
    .get(printerId, amsUnit, amsTray) || null;
}

export function syncAmsToSpool(printerId, amsUnit, trayId, remainPct) {
  const spool = db.prepare('SELECT id, initial_weight_g, remaining_weight_g FROM spools WHERE printer_id = ? AND ams_unit = ? AND ams_tray = ? AND archived = 0')
    .get(printerId, amsUnit, trayId);
  if (!spool || !spool.initial_weight_g) return null;
  const newWeight = Math.round((remainPct / 100) * spool.initial_weight_g * 10) / 10;
  const diff = Math.abs(newWeight - (spool.remaining_weight_g || 0));
  if (diff < 5) return null; // Ignore noise < 5g
  db.prepare('UPDATE spools SET remaining_weight_g = ?, used_weight_g = MAX(0, initial_weight_g - ?), last_used_at = datetime(\'now\') WHERE id = ?')
    .run(newWeight, newWeight, spool.id);
  return { spoolId: spool.id, newWeight, diff };
}

export function toggleSpoolFavorite(id) {
  db.prepare('UPDATE spools SET is_favorite = CASE WHEN is_favorite = 1 THEN 0 ELSE 1 END WHERE id = ?').run(id);
  const row = db.prepare('SELECT is_favorite FROM spools WHERE id = ?').get(id);
  return row ? row.is_favorite : 0;
}

export function batchAddSpools(data, count) {
  const ids = [];
  for (let i = 0; i < count; i++) {
    const result = addSpool(data);
    ids.push(result.id);
  }
  return ids;
}

// ---- Shared Palettes ----

export function createSharedPalette(title, filters) {
  const token = [...Array(16)].map(() => Math.random().toString(36)[2]).join('');
  db.prepare('INSERT INTO shared_palettes (token, title, filters) VALUES (?, ?, ?)').run(token, title || null, filters ? JSON.stringify(filters) : null);
  return token;
}

export function getSharedPalette(token) {
  const row = db.prepare('SELECT * FROM shared_palettes WHERE token = ?').get(token);
  if (row) db.prepare('UPDATE shared_palettes SET view_count = view_count + 1 WHERE token = ?').run(token);
  return row || null;
}

export function deleteSharedPalette(token) {
  db.prepare('DELETE FROM shared_palettes WHERE token = ?').run(token);
}

export function getSharedPaletteSpools(filters) {
  let sql = SPOOL_SELECT + ' WHERE s.archived = 0';
  const params = [];
  if (filters?.material) { sql += ' AND fp.material = ?'; params.push(filters.material); }
  if (filters?.vendor) { sql += ' AND v.name = ?'; params.push(filters.vendor); }
  if (filters?.location) { sql += ' AND s.location = ?'; params.push(filters.location); }
  sql += ' ORDER BY fp.material, fp.color_name';
  return _enrichSpoolRows(db.prepare(sql).all(...params));
}

// ---- Filament Matching for Print Queue ----

export function matchPrinterForFilament(material, colorHex = null, minWeightG = 0) {
  let sql = `SELECT s.printer_id, s.ams_unit, s.ams_tray, s.remaining_weight_g,
    fp.material, fp.color_hex, fp.name AS profile_name, v.name AS vendor_name
    FROM spools s
    LEFT JOIN filament_profiles fp ON s.filament_profile_id = fp.id
    LEFT JOIN vendors v ON fp.vendor_id = v.id
    WHERE s.archived = 0 AND s.printer_id IS NOT NULL AND s.remaining_weight_g > ?`;
  const params = [minWeightG];
  if (material) { sql += ' AND fp.material = ?'; params.push(material); }
  if (colorHex) { sql += ' AND fp.color_hex = ?'; params.push(colorHex); }
  sql += ' ORDER BY s.remaining_weight_g DESC';
  return db.prepare(sql).all(...params);
}

// ---- Temperature Guide ----

export function getTemperatureGuide() {
  return db.prepare(`SELECT fp.material,
    MIN(fp.nozzle_temp_min) as nozzle_min, MAX(fp.nozzle_temp_max) as nozzle_max,
    MIN(fp.bed_temp_min) as bed_min, MAX(fp.bed_temp_max) as bed_max,
    COUNT(*) as profile_count,
    mr.enclosure, mr.nozzle_recommendation, mr.tips, mr.chamber_temp
    FROM filament_profiles fp
    LEFT JOIN material_reference mr ON UPPER(fp.material) = UPPER(mr.material)
    WHERE fp.nozzle_temp_min IS NOT NULL OR fp.nozzle_temp_max IS NOT NULL
    GROUP BY fp.material ORDER BY fp.material`).all();
}

// ---- Filament Compatibility Matrix ----

export function getCompatibilityMatrix(material = null) {
  if (material) return db.prepare('SELECT * FROM filament_compatibility WHERE material = ? ORDER BY plate_type, nozzle_type').all(material);
  return db.prepare('SELECT * FROM filament_compatibility ORDER BY material, plate_type, nozzle_type').all();
}

export function addCompatibilityRule(rule) {
  const r = db.prepare(`INSERT INTO filament_compatibility (material, nozzle_type, nozzle_size_min, nozzle_size_max, plate_type, compatibility, notes) VALUES (?, ?, ?, ?, ?, ?, ?)`)
    .run(rule.material, rule.nozzle_type || 'any', rule.nozzle_size_min ?? null, rule.nozzle_size_max ?? null, rule.plate_type || 'any', rule.compatibility || 'good', rule.notes || null);
  return { id: Number(r.lastInsertRowid) };
}

export function updateCompatibilityRule(id, rule) {
  db.prepare('UPDATE filament_compatibility SET material=?, nozzle_type=?, nozzle_size_min=?, nozzle_size_max=?, plate_type=?, compatibility=?, notes=? WHERE id=?')
    .run(rule.material, rule.nozzle_type || 'any', rule.nozzle_size_min ?? null, rule.nozzle_size_max ?? null, rule.plate_type || 'any', rule.compatibility || 'good', rule.notes || null, id);
}

export function deleteCompatibilityRule(id) {
  db.prepare('DELETE FROM filament_compatibility WHERE id = ?').run(id);
}

// ---- FIFO Spool Suggestion ----

export function getFifoSpool(material, colorHex = null, profileId = null) {
  let sql = SPOOL_SELECT + ' WHERE s.archived = 0 AND s.remaining_weight_g > 0 AND s.printer_id IS NULL';
  const params = [];
  if (profileId) {
    sql += ' AND s.filament_profile_id = ?';
    params.push(profileId);
  } else if (material) {
    sql += ' AND fp.material = ?';
    params.push(material);
    if (colorHex) {
      sql += ' AND fp.color_hex = ?';
      params.push(colorHex);
    }
  }
  sql += ' ORDER BY s.purchase_date ASC NULLS LAST, s.created_at ASC LIMIT 5';
  return _enrichSpoolRows(db.prepare(sql).all(...params));
}

// ---- Slicer Jobs ----

export function addSlicerJob(data) {
  const result = db.prepare(`INSERT INTO slicer_jobs (printer_id, original_filename, stored_filename, status, slicer_used, file_size, auto_queue, estimated_filament_g, estimated_time_s)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
    data.printer_id || null, data.original_filename, data.stored_filename || null,
    data.status || 'uploading', data.slicer_used || null, data.file_size || 0, data.auto_queue ? 1 : 0,
    data.estimated_filament_g || null, data.estimated_time_s || null
  );
  return Number(result.lastInsertRowid);
}

export function getSlicerJobByFilename(filename) {
  return db.prepare('SELECT * FROM slicer_jobs WHERE original_filename = ? ORDER BY created_at DESC LIMIT 1').get(filename) || null;
}

export function updateSlicerJob(id, data) {
  const sets = [];
  const params = [];
  for (const [k, v] of Object.entries(data)) {
    sets.push(`${k} = ?`);
    params.push(v);
  }
  if (!sets.length) return;
  params.push(id);
  db.prepare(`UPDATE slicer_jobs SET ${sets.join(', ')} WHERE id = ?`).run(...params);
}

export function getSlicerJob(id) {
  return db.prepare('SELECT * FROM slicer_jobs WHERE id = ?').get(id) || null;
}

export function getSlicerJobs(limit = 50) {
  return db.prepare('SELECT * FROM slicer_jobs ORDER BY created_at DESC LIMIT ?').all(limit);
}

export function deleteSlicerJob(id) {
  db.prepare('DELETE FROM slicer_jobs WHERE id = ?').run(id);
}

// ---- Spool Usage Log ----

export function getSpoolUsageLog(filters = {}) {
  let sql = `SELECT sul.*, s.id as spool_id, fp.name as profile_name, fp.material, fp.color_hex, v.name as vendor_name
    FROM spool_usage_log sul
    LEFT JOIN spools s ON sul.spool_id = s.id
    LEFT JOIN filament_profiles fp ON s.filament_profile_id = fp.id
    LEFT JOIN vendors v ON fp.vendor_id = v.id WHERE 1=1`;
  const params = [];
  if (filters.spool_id) { sql += ' AND sul.spool_id = ?'; params.push(filters.spool_id); }
  if (filters.printer_id) { sql += ' AND sul.printer_id = ?'; params.push(filters.printer_id); }
  sql += ' ORDER BY sul.timestamp DESC';
  if (filters.limit) { sql += ' LIMIT ?'; params.push(filters.limit); }
  return db.prepare(sql).all(...params);
}

// ---- Locations ----

export function getLocations() {
  return db.prepare('SELECT * FROM locations ORDER BY name').all();
}

export function addLocation(l) {
  const result = db.prepare('INSERT INTO locations (name, description, parent_id, min_spools, max_spools, min_weight_kg, max_weight_kg) VALUES (?, ?, ?, ?, ?, ?, ?)').run(
    l.name, l.description || null, l.parent_id || null, l.min_spools || null, l.max_spools || null, l.min_weight_kg || null, l.max_weight_kg || null
  );
  return { id: Number(result.lastInsertRowid), ...l };
}

export function updateLocation(id, data) {
  const location = db.prepare('SELECT name FROM locations WHERE id = ?').get(id);
  if (!location) return null;
  const oldName = location.name;
  const sets = ['name = ?', 'description = ?'];
  const params = [data.name, data.description ?? null];
  if ('parent_id' in data) { sets.push('parent_id = ?'); params.push(data.parent_id || null); }
  if ('min_spools' in data) { sets.push('min_spools = ?'); params.push(data.min_spools ?? null); }
  if ('max_spools' in data) { sets.push('max_spools = ?'); params.push(data.max_spools ?? null); }
  if ('min_weight_kg' in data) { sets.push('min_weight_kg = ?'); params.push(data.min_weight_kg ?? null); }
  if ('max_weight_kg' in data) { sets.push('max_weight_kg = ?'); params.push(data.max_weight_kg ?? null); }
  params.push(id);
  db.prepare(`UPDATE locations SET ${sets.join(', ')} WHERE id = ?`).run(...params);
  if (data.name !== oldName) {
    db.prepare('UPDATE spools SET location = ? WHERE location = ?').run(data.name, oldName);
  }
  // Keep location_id in sync
  db.prepare('UPDATE spools SET location = ? WHERE location_id = ?').run(data.name, id);
  return { id, old_name: oldName, new_name: data.name };
}

export function deleteLocation(id) {
  const loc = db.prepare('SELECT parent_id FROM locations WHERE id = ?').get(id);
  // Reparent children to this location's parent
  db.prepare('UPDATE locations SET parent_id = ? WHERE parent_id = ?').run(loc?.parent_id || null, id);
  // Nullify spool references
  db.prepare('UPDATE spools SET location_id = NULL, location = NULL WHERE location_id = ?').run(id);
  db.prepare('DELETE FROM locations WHERE id=?').run(id);
}

// ---- Inventory Stats ----

export function getInventoryStats() {
  const totalSpools = db.prepare('SELECT COUNT(*) as count FROM spools WHERE archived = 0').get();
  const totalWeight = db.prepare('SELECT COALESCE(SUM(remaining_weight_g), 0) as weight FROM spools WHERE archived = 0').get();
  const totalUsed = db.prepare('SELECT COALESCE(SUM(used_weight_g), 0) as weight FROM spools WHERE archived = 0').get();
  const totalCost = db.prepare('SELECT COALESCE(SUM(cost), 0) as cost FROM spools WHERE archived = 0').get();
  const lowStock = db.prepare('SELECT COUNT(*) as count FROM spools WHERE archived = 0 AND remaining_weight_g < (initial_weight_g * 0.2)').get();
  const byMaterial = db.prepare(`SELECT fp.material, COUNT(*) as count, COALESCE(SUM(s.remaining_weight_g), 0) as remaining_g
    FROM spools s LEFT JOIN filament_profiles fp ON s.filament_profile_id = fp.id
    WHERE s.archived = 0 GROUP BY fp.material ORDER BY remaining_g DESC`).all();
  const byVendor = db.prepare(`SELECT v.name as vendor, COUNT(*) as count, COALESCE(SUM(s.remaining_weight_g), 0) as remaining_g, COALESCE(SUM(s.cost), 0) as total_cost
    FROM spools s LEFT JOIN filament_profiles fp ON s.filament_profile_id = fp.id LEFT JOIN vendors v ON fp.vendor_id = v.id
    WHERE s.archived = 0 GROUP BY v.name ORDER BY remaining_g DESC`).all();
  const recentUsage = db.prepare(`SELECT COALESCE(SUM(used_weight_g), 0) as used_g FROM spool_usage_log WHERE timestamp >= datetime('now', '-30 days')`).get();

  return {
    total_spools: totalSpools.count,
    total_remaining_g: Math.round(totalWeight.weight),
    total_used_g: Math.round(totalUsed.weight),
    total_cost: Math.round(totalCost.cost * 100) / 100,
    low_stock_count: lowStock.count,
    by_material: byMaterial,
    by_vendor: byVendor,
    usage_last_30d_g: Math.round(recentUsage.used_g)
  };
}

// ---- Search ----

export function searchSpools(query, limit = 50, offset = 0) {
  const pattern = `%${query}%`;
  const where = ` WHERE (
    s.lot_number LIKE ? OR s.location LIKE ? OR s.comment LIKE ?
    OR fp.name LIKE ? OR fp.material LIKE ? OR fp.color_name LIKE ?
    OR fp.article_number LIKE ? OR v.name LIKE ?
  )`;
  const p = [pattern, pattern, pattern, pattern, pattern, pattern, pattern, pattern];
  const total = db.prepare(`SELECT COUNT(*) as total FROM spools s
    LEFT JOIN filament_profiles fp ON s.filament_profile_id = fp.id
    LEFT JOIN vendors v ON fp.vendor_id = v.id` + where).get(...p).total;
  const rows = db.prepare(SPOOL_SELECT + where + ' ORDER BY s.last_used_at DESC NULLS LAST LIMIT ? OFFSET ?').all(...p, limit, offset);
  return { rows: _enrichSpoolRows(rows), total };
}

// ---- Duplicate ----

export function duplicateSpool(id) {
  const original = getSpool(id);
  if (!original) return null;
  const result = db.prepare(`INSERT INTO spools
    (filament_profile_id, remaining_weight_g, used_weight_g, initial_weight_g, cost, lot_number,
     purchase_date, location, comment, extra_fields, spool_weight)
    VALUES (?, ?, 0, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
    original.filament_profile_id, original.initial_weight_g, original.initial_weight_g,
    original.cost || null, original.lot_number || null, original.purchase_date || null,
    original.location || null, original.comment || null, original.extra_fields || null,
    original.spool_weight ?? null);
  return { id: Number(result.lastInsertRowid) };
}

// ---- Merge Spools ----

export function mergeSpools(targetId, sourceIds, actor = null) {
  const target = getSpool(targetId);
  if (!target) return null;
  const sources = sourceIds.map(id => getSpool(id)).filter(Boolean);
  if (sources.length === 0) return null;

  let addRemaining = 0, addUsed = 0, addInitial = 0, totalCost = target.cost || 0;
  for (const src of sources) {
    addRemaining += src.remaining_weight_g || 0;
    addUsed += src.used_weight_g || 0;
    addInitial += src.initial_weight_g || 0;
    if (src.cost) totalCost += src.cost;
  }

  db.prepare(`UPDATE spools SET
    remaining_weight_g = remaining_weight_g + ?,
    used_weight_g = used_weight_g + ?,
    initial_weight_g = initial_weight_g + ?,
    cost = ?,
    last_used_at = datetime('now')
    WHERE id = ?`).run(addRemaining, addUsed, addInitial, totalCost || null, targetId);

  const sourceInfo = sources.map(s => ({ id: s.id, remaining_g: s.remaining_weight_g, profile: s.profile_name }));
  try { addSpoolEvent(targetId, 'merged', JSON.stringify({ absorbed: sourceInfo }), actor); } catch (_) {}

  for (const src of sources) {
    try { addSpoolEvent(src.id, 'merged_into', JSON.stringify({ target_id: targetId }), actor); } catch (_) {}
    db.prepare('UPDATE spools SET archived = 1, remaining_weight_g = 0 WHERE id = ?').run(src.id);
  }

  return getSpool(targetId);
}

// ---- Measure Weight ----

export function measureSpoolWeight(spoolId, grossWeightG) {
  const spool = getSpool(spoolId);
  if (!spool) return null;
  const emptySpoolWeight = spool.spool_weight ?? spool.vendor_empty_spool_weight_g ?? 250;
  const netFilamentG = Math.max(0, grossWeightG - emptySpoolWeight);
  const usedG = Math.max(0, (spool.initial_weight_g || 1000) - netFilamentG);

  db.prepare(`UPDATE spools SET remaining_weight_g = ?, used_weight_g = ?, last_used_at = datetime('now') WHERE id = ?`)
    .run(netFilamentG, usedG, spoolId);

  return {
    gross_weight_g: grossWeightG,
    empty_spool_weight_g: emptySpoolWeight,
    net_filament_g: Math.round(netFilamentG),
    used_g: Math.round(usedG),
    remaining_pct: (spool.initial_weight_g || 1000) > 0 ? Math.round((netFilamentG / (spool.initial_weight_g || 1000)) * 100) : 0
  };
}

// ---- Length Calculations ----

export function weightToLength(weightG, density, diameterMm) {
  if (!weightG || !density || !diameterMm) return null;
  const radiusCm = (diameterMm / 10) / 2;
  const volumeCm3 = weightG / density;
  const lengthCm = volumeCm3 / (Math.PI * radiusCm * radiusCm);
  return Math.round(lengthCm / 100 * 10) / 10;
}

export function lengthToWeight(lengthMm, density, diameterMm) {
  if (!lengthMm || !density || !diameterMm) return null;
  const radiusCm = (diameterMm / 10) / 2;
  const lengthCm = lengthMm / 10;
  const volumeCm3 = lengthCm * Math.PI * radiusCm * radiusCm;
  return Math.round(volumeCm3 * density * 100) / 100;
}

function _enrichSpoolRows(rows) {
  for (const r of rows) {
    r.remaining_length_m = weightToLength(r.remaining_weight_g, r.density, r.diameter);
    r.used_length_m = weightToLength(r.used_weight_g, r.density, r.diameter);
  }
  return rows;
}

// ---- Export ----

export function getAllSpoolsForExport() {
  return _enrichSpoolRows(db.prepare(SPOOL_SELECT + ' ORDER BY s.id').all());
}

export function getAllFilamentProfilesForExport() {
  return db.prepare(`SELECT fp.*, v.name as vendor_name FROM filament_profiles fp
    LEFT JOIN vendors v ON fp.vendor_id = v.id ORDER BY fp.id`).all();
}

export function getAllVendorsForExport() {
  return db.prepare('SELECT * FROM vendors ORDER BY id').all();
}

// ---- Color Similarity (CIELAB Delta-E CIE76) ----

function srgbToLab(hex) {
  if (!hex || hex.length < 6) return null;
  const h = hex.replace('#', '');
  let r = parseInt(h.substring(0, 2), 16) / 255;
  let g = parseInt(h.substring(2, 4), 16) / 255;
  let b = parseInt(h.substring(4, 6), 16) / 255;
  r = r > 0.04045 ? Math.pow((r + 0.055) / 1.055, 2.4) : r / 12.92;
  g = g > 0.04045 ? Math.pow((g + 0.055) / 1.055, 2.4) : g / 12.92;
  b = b > 0.04045 ? Math.pow((b + 0.055) / 1.055, 2.4) : b / 12.92;
  let x = (r * 0.4124564 + g * 0.3575761 + b * 0.1804375) / 0.95047;
  let y = (r * 0.2126729 + g * 0.7151522 + b * 0.0721750);
  let z = (r * 0.0193339 + g * 0.1191920 + b * 0.9503041) / 1.08883;
  const f = v => v > 0.008856 ? Math.pow(v, 1 / 3) : (7.787 * v) + 16 / 116;
  x = f(x); y = f(y); z = f(z);
  return { L: (116 * y) - 16, a: 500 * (x - y), b: 200 * (y - z) };
}

function deltaE(hex1, hex2) {
  const lab1 = srgbToLab(hex1);
  const lab2 = srgbToLab(hex2);
  if (!lab1 || !lab2) return Infinity;
  return Math.sqrt(Math.pow(lab1.L - lab2.L, 2) + Math.pow(lab1.a - lab2.a, 2) + Math.pow(lab1.b - lab2.b, 2));
}

export function findSimilarColors(targetHex, maxDeltaE = 30) {
  const profiles = db.prepare('SELECT id, name, material, color_hex, color_name, vendor_id FROM filament_profiles WHERE color_hex IS NOT NULL').all();
  const results = [];
  for (const p of profiles) {
    const dE = deltaE(targetHex, p.color_hex);
    if (dE <= maxDeltaE) results.push({ ...p, delta_e: Math.round(dE * 10) / 10 });
  }
  results.sort((a, b) => a.delta_e - b.delta_e);
  return results;
}

// ---- Distinct value lists ----

export function getDistinctMaterials() {
  return db.prepare('SELECT DISTINCT material FROM filament_profiles WHERE material IS NOT NULL ORDER BY material').all().map(r => r.material);
}

export function getDistinctLotNumbers() {
  return db.prepare('SELECT DISTINCT lot_number FROM spools WHERE lot_number IS NOT NULL AND lot_number != \'\' ORDER BY lot_number').all().map(r => r.lot_number);
}

export function getDistinctArticleNumbers() {
  return db.prepare('SELECT DISTINCT article_number FROM filament_profiles WHERE article_number IS NOT NULL AND article_number != \'\' ORDER BY article_number').all().map(r => r.article_number);
}

// ---- Inventory Settings ----

export function getInventorySetting(key) {
  const row = db.prepare('SELECT value FROM inventory_settings WHERE key = ?').get(key);
  return row ? row.value : null;
}

export function setInventorySetting(key, value) {
  db.prepare('INSERT OR REPLACE INTO inventory_settings (key, value) VALUES (?, ?)').run(key, String(value));
}

export function getAllInventorySettings() {
  const rows = db.prepare('SELECT key, value FROM inventory_settings ORDER BY key').all();
  const obj = {};
  for (const r of rows) obj[r.key] = r.value;
  return obj;
}

// ---- Import (CSV/JSON) ----

export function importSpools(spools) {
  let count = 0;
  for (const s of spools) {
    try {
      addSpool(s);
      count++;
    } catch {}
  }
  return count;
}

export function importFilamentProfiles(profiles) {
  let count = 0;
  for (const p of profiles) {
    try {
      addFilamentProfile(p);
      count++;
    } catch {}
  }
  return count;
}

export function importVendors(vendors) {
  let count = 0;
  for (const v of vendors) {
    try {
      addVendor(v);
      count++;
    } catch {}
  }
  return count;
}

// ---- Custom field schemas ----

export function getFieldSchemas(entityType) {
  return db.prepare('SELECT * FROM field_schemas WHERE entity_type = ? ORDER BY key').all(entityType);
}

export function addFieldSchema(entityType, key, schema) {
  const result = db.prepare('INSERT INTO field_schemas (entity_type, key, name, field_type, unit) VALUES (?, ?, ?, ?, ?)')
    .run(entityType, key, schema.name || key, schema.field_type || 'text', schema.unit || null);
  return { id: Number(result.lastInsertRowid), entity_type: entityType, key, ...schema };
}

export function deleteFieldSchema(entityType, key) {
  db.prepare('DELETE FROM field_schemas WHERE entity_type = ? AND key = ?').run(entityType, key);
}

// ---- Drying Management ----

export function getDryingSessions(filters = {}) {
  let where = ' WHERE 1=1';
  const params = [];
  if (filters.spool_id) { where += ' AND ds.spool_id = ?'; params.push(filters.spool_id); }
  if (filters.active !== undefined) { where += ' AND ds.active = ?'; params.push(filters.active ? 1 : 0); }
  let sql = `SELECT ds.*, fp.name AS profile_name, fp.material, fp.color_hex, v.name AS vendor_name
    FROM drying_sessions ds
    LEFT JOIN spools s ON ds.spool_id = s.id
    LEFT JOIN filament_profiles fp ON s.filament_profile_id = fp.id
    LEFT JOIN vendors v ON fp.vendor_id = v.id` + where + ' ORDER BY ds.started_at DESC';
  if (filters.limit) { sql += ' LIMIT ?'; params.push(filters.limit); }
  return db.prepare(sql).all(...params);
}

export function getActiveDryingSessions() {
  return db.prepare(`SELECT ds.*, fp.name AS profile_name, fp.material, fp.color_hex, v.name AS vendor_name
    FROM drying_sessions ds
    LEFT JOIN spools s ON ds.spool_id = s.id
    LEFT JOIN filament_profiles fp ON s.filament_profile_id = fp.id
    LEFT JOIN vendors v ON fp.vendor_id = v.id
    WHERE ds.active = 1 ORDER BY ds.started_at DESC`).all();
}

export function startDryingSession(data) {
  const result = db.prepare(`INSERT INTO drying_sessions
    (spool_id, temperature, duration_minutes, method, humidity_before, notes, active)
    VALUES (?, ?, ?, ?, ?, ?, 1)`).run(
    data.spool_id, data.temperature || null, data.duration_minutes,
    data.method || 'dryer_box', data.humidity_before || null, data.notes || null);
  return { id: Number(result.lastInsertRowid) };
}

export function completeDryingSession(sessionId, humidityAfter = null) {
  db.prepare(`UPDATE drying_sessions SET active = 0, completed_at = datetime('now'), humidity_after = ? WHERE id = ?`)
    .run(humidityAfter, sessionId);
  const session = db.prepare('SELECT spool_id FROM drying_sessions WHERE id = ?').get(sessionId);
  if (session) {
    db.prepare(`UPDATE spools SET last_dried_at = datetime('now') WHERE id = ?`).run(session.spool_id);
  }
}

export function deleteDryingSession(sessionId) {
  db.prepare('DELETE FROM drying_sessions WHERE id = ?').run(sessionId);
}

export function getDryingPresets() {
  return db.prepare('SELECT * FROM drying_presets ORDER BY material').all();
}

export function getDryingPreset(material) {
  return db.prepare('SELECT * FROM drying_presets WHERE material = ?').get(material) || null;
}

export function upsertDryingPreset(material, data) {
  const existing = db.prepare('SELECT id FROM drying_presets WHERE material = ?').get(material);
  if (existing) {
    db.prepare('UPDATE drying_presets SET temperature = ?, duration_minutes = ?, max_days_without_drying = ?, notes = ? WHERE id = ?')
      .run(data.temperature, data.duration_minutes, data.max_days_without_drying ?? 30, data.notes || null, existing.id);
  } else {
    db.prepare('INSERT INTO drying_presets (material, temperature, duration_minutes, max_days_without_drying, notes) VALUES (?, ?, ?, ?, ?)')
      .run(material, data.temperature, data.duration_minutes, data.max_days_without_drying ?? 30, data.notes || null);
  }
}

export function deleteDryingPreset(material) {
  db.prepare('DELETE FROM drying_presets WHERE material = ?').run(material);
}

export function getUsagePredictions() {
  const byMaterial = db.prepare(`
    SELECT fp.material,
      SUM(sul.used_weight_g) AS total_used_g,
      COUNT(DISTINCT DATE(sul.timestamp)) AS active_days,
      ROUND(SUM(sul.used_weight_g) / MAX(1, COUNT(DISTINCT DATE(sul.timestamp))), 2) AS avg_daily_g
    FROM spool_usage_log sul
    LEFT JOIN spools s ON sul.spool_id = s.id
    LEFT JOIN filament_profiles fp ON s.filament_profile_id = fp.id
    WHERE sul.timestamp >= datetime('now', '-90 days')
    GROUP BY fp.material
    ORDER BY total_used_g DESC
  `).all();

  const perSpool = db.prepare(`
    SELECT s.id, s.remaining_weight_g, fp.material, fp.name AS profile_name, v.name AS vendor_name, fp.color_hex,
      COALESCE(
        (SELECT ROUND(SUM(sul2.used_weight_g) / MAX(1, COUNT(DISTINCT DATE(sul2.timestamp))), 2)
         FROM spool_usage_log sul2 WHERE sul2.spool_id = s.id AND sul2.timestamp >= datetime('now', '-90 days')),
        0
      ) AS avg_daily_g
    FROM spools s
    LEFT JOIN filament_profiles fp ON s.filament_profile_id = fp.id
    LEFT JOIN vendors v ON fp.vendor_id = v.id
    WHERE s.archived = 0 AND s.remaining_weight_g > 0
    ORDER BY avg_daily_g DESC
  `).all().map(row => ({
    ...row,
    days_until_empty: row.avg_daily_g > 0 ? Math.round(row.remaining_weight_g / row.avg_daily_g) : null,
    needs_reorder: row.avg_daily_g > 0 && (row.remaining_weight_g / row.avg_daily_g) < 14
  }));

  return { by_material: byMaterial, per_spool: perSpool };
}

export function getLowStockSpools(thresholdPct = 20, thresholdGrams = 0) {
  return db.prepare(`SELECT s.id, s.remaining_weight_g, s.initial_weight_g,
    ROUND((s.remaining_weight_g * 100.0 / s.initial_weight_g), 1) AS remaining_pct,
    fp.name AS profile_name, fp.material, v.name AS vendor_name
    FROM spools s
    LEFT JOIN filament_profiles fp ON s.filament_profile_id = fp.id
    LEFT JOIN vendors v ON fp.vendor_id = v.id
    WHERE s.archived = 0 AND s.initial_weight_g > 0
    AND ((s.remaining_weight_g * 100.0 / s.initial_weight_g) < ? OR (? > 0 AND s.remaining_weight_g < ?))
    ORDER BY remaining_pct ASC`).all(thresholdPct, thresholdGrams, thresholdGrams);
}

export function getRestockSuggestions(daysAhead = 30) {
  // Get usage by profile over last 90 days, grouped by filament profile
  const profileUsage = db.prepare(`
    SELECT fp.id AS profile_id, fp.name AS profile_name, fp.material, fp.color_hex,
      v.name AS vendor_name, v.id AS vendor_id,
      COALESCE(SUM(sul.used_weight_g), 0) AS total_used_90d,
      COUNT(DISTINCT DATE(sul.timestamp)) AS active_days,
      ROUND(COALESCE(SUM(sul.used_weight_g), 0) / MAX(1, COUNT(DISTINCT DATE(sul.timestamp))), 2) AS avg_daily_g
    FROM filament_profiles fp
    LEFT JOIN vendors v ON fp.vendor_id = v.id
    LEFT JOIN spools s ON s.filament_profile_id = fp.id AND s.archived = 0
    LEFT JOIN spool_usage_log sul ON sul.spool_id = s.id AND sul.timestamp >= datetime('now', '-90 days')
    GROUP BY fp.id
    HAVING total_used_90d > 0
    ORDER BY avg_daily_g DESC
  `).all();

  // Get current stock per profile
  const stockByProfile = db.prepare(`
    SELECT s.filament_profile_id, SUM(s.remaining_weight_g) AS total_remaining_g,
      COUNT(*) AS spool_count, AVG(s.initial_weight_g) AS avg_spool_size_g
    FROM spools s WHERE s.archived = 0 AND s.remaining_weight_g > 0
    GROUP BY s.filament_profile_id
  `).all();
  const stockMap = {};
  for (const row of stockByProfile) stockMap[row.filament_profile_id] = row;

  // Get latest cost per profile
  const priceByProfile = db.prepare(`
    SELECT s.filament_profile_id, s.cost, s.initial_weight_g
    FROM spools s
    WHERE s.cost > 0
    GROUP BY s.filament_profile_id
    HAVING s.id = MAX(s.id)
  `).all();
  const priceMap = {};
  for (const row of priceByProfile) priceMap[row.filament_profile_id] = { price: row.cost, weight_g: row.initial_weight_g };

  return profileUsage.map(pu => {
    const stock = stockMap[pu.profile_id] || { total_remaining_g: 0, spool_count: 0, avg_spool_size_g: 1000 };
    const needed_g = pu.avg_daily_g * daysAhead;
    const deficit_g = Math.max(0, needed_g - stock.total_remaining_g);
    const days_until_out = pu.avg_daily_g > 0 ? Math.round(stock.total_remaining_g / pu.avg_daily_g) : null;
    const spoolSize = stock.avg_spool_size_g || 1000;
    const spools_to_order = deficit_g > 0 ? Math.ceil(deficit_g / spoolSize) : 0;
    const priceInfo = priceMap[pu.profile_id];
    const est_cost = priceInfo && spools_to_order > 0 ? Math.round(priceInfo.price * spools_to_order * 100) / 100 : null;

    return {
      profile_id: pu.profile_id,
      profile_name: pu.profile_name,
      material: pu.material,
      color_hex: pu.color_hex,
      vendor_name: pu.vendor_name,
      vendor_id: pu.vendor_id,
      avg_daily_g: pu.avg_daily_g,
      total_used_90d: pu.total_used_90d,
      current_stock_g: Math.round(stock.total_remaining_g),
      current_spool_count: stock.spool_count,
      days_until_out,
      needed_g: Math.round(needed_g),
      deficit_g: Math.round(deficit_g),
      spools_to_order,
      est_cost,
      urgency: days_until_out === null ? 'unknown' : days_until_out <= 7 ? 'critical' : days_until_out <= 14 ? 'high' : days_until_out <= 30 ? 'medium' : 'low'
    };
  }).filter(s => s.urgency !== 'low');
}

export function getPrinterCostSettings(printerId = null) {
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

export function estimatePrintCost(filamentUsedG, durationSeconds, spoolId = null, printerId = null) {
  const cs = getPrinterCostSettings(printerId);
  const electricityRate = cs.electricity_rate_kwh;
  const printerWattage = cs.printer_wattage;
  const machineCost = cs.machine_cost;
  const machineLifetimeH = cs.machine_lifetime_hours;

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
  // Fallback: average cost per gram from spools or legacy inventory
  if (filamentCostPerG <= 0) {
    const spoolAvg = db.prepare("SELECT AVG(cost / initial_weight_g) as avg FROM spools WHERE initial_weight_g > 0 AND cost > 0").get();
    if (spoolAvg?.avg > 0) {
      filamentCostPerG = spoolAvg.avg;
    } else {
      const legacyAvg = db.prepare("SELECT AVG(cost_nok / weight_total_g) as avg FROM filament_inventory WHERE weight_total_g > 0 AND cost_nok > 0").get();
      filamentCostPerG = legacyAvg?.avg || 0;
    }
  }

  const laborRate = parseFloat(getInventorySetting('labor_rate_hourly') || '0');

  const filamentCost = Math.round(filamentUsedG * filamentCostPerG * 100) / 100;
  const durationH = durationSeconds / 3600;
  const electricityCost = Math.round(durationH * (printerWattage / 1000) * electricityRate * 100) / 100;
  const depreciationCost = machineLifetimeH > 0 ? Math.round(durationH * (machineCost / machineLifetimeH) * 100) / 100 : 0;
  const laborCost = Math.round(durationH * laborRate * 100) / 100;
  const totalCost = Math.round((filamentCost + electricityCost + depreciationCost + laborCost) * 100) / 100;

  return { filament_cost: filamentCost, electricity_cost: electricityCost, depreciation_cost: depreciationCost, labor_cost: laborCost, total_cost: totalCost };
}

export function getSpoolsDryingStatus() {
  return db.prepare(`SELECT s.id, s.last_dried_at, fp.name AS profile_name, fp.material, fp.color_hex, v.name AS vendor_name,
    dp.max_days_without_drying,
    CASE
      WHEN s.last_dried_at IS NULL THEN 'unknown'
      WHEN julianday('now') - julianday(s.last_dried_at) > COALESCE(dp.max_days_without_drying, 30) THEN 'overdue'
      WHEN julianday('now') - julianday(s.last_dried_at) > COALESCE(dp.max_days_without_drying, 30) * 0.75 THEN 'due_soon'
      ELSE 'fresh'
    END AS drying_status,
    ROUND(julianday('now') - julianday(s.last_dried_at), 1) AS days_since_dried
    FROM spools s
    LEFT JOIN filament_profiles fp ON s.filament_profile_id = fp.id
    LEFT JOIN vendors v ON fp.vendor_id = v.id
    LEFT JOIN drying_presets dp ON fp.material = dp.material
    WHERE s.archived = 0`).all();
}

// ---- Print Queue ----

export function createQueue(opts) {
  const r = db.prepare(`INSERT INTO print_queue (name, description, status, auto_start, cooldown_seconds, bed_clear_gcode, priority_mode, target_printer_id, created_by)
    VALUES (?, ?, 'active', ?, ?, ?, ?, ?, ?)`).run(
    opts.name, opts.description || null, opts.auto_start ? 1 : 0,
    opts.cooldown_seconds || 60, opts.bed_clear_gcode || null,
    opts.priority_mode || 'fifo', opts.target_printer_id || null, opts.created_by || null
  );
  return r.lastInsertRowid;
}

export function getQueues(status) {
  let sql = `SELECT q.*, (SELECT COUNT(*) FROM queue_items qi WHERE qi.queue_id = q.id) AS item_count,
    (SELECT COUNT(*) FROM queue_items qi WHERE qi.queue_id = q.id AND qi.status = 'completed') AS completed_count,
    (SELECT COUNT(*) FROM queue_items qi WHERE qi.queue_id = q.id AND qi.status = 'printing') AS printing_count
    FROM print_queue q`;
  if (status) {
    sql += ` WHERE q.status = ?`;
    return db.prepare(sql + ' ORDER BY q.created_at DESC').all(status);
  }
  return db.prepare(sql + ' ORDER BY q.created_at DESC').all();
}

export function getQueue(id) {
  const queue = db.prepare('SELECT * FROM print_queue WHERE id = ?').get(id);
  if (!queue) return null;
  queue.items = db.prepare('SELECT * FROM queue_items WHERE queue_id = ? ORDER BY sort_order, priority DESC, added_at').all(id);
  return queue;
}

export function updateQueue(id, opts) {
  const fields = [];
  const values = [];
  for (const key of ['name', 'description', 'status', 'priority_mode', 'target_printer_id', 'bed_clear_gcode', 'completed_at']) {
    if (opts[key] !== undefined) { fields.push(`${key} = ?`); values.push(opts[key]); }
  }
  if (opts.auto_start !== undefined) { fields.push('auto_start = ?'); values.push(opts.auto_start ? 1 : 0); }
  if (opts.cooldown_seconds !== undefined) { fields.push('cooldown_seconds = ?'); values.push(opts.cooldown_seconds); }
  if (fields.length === 0) return;
  values.push(id);
  db.prepare(`UPDATE print_queue SET ${fields.join(', ')} WHERE id = ?`).run(...values);
}

export function deleteQueue(id) {
  db.prepare('DELETE FROM queue_log WHERE queue_id = ?').run(id);
  db.prepare('DELETE FROM queue_items WHERE queue_id = ?').run(id);
  db.prepare('DELETE FROM print_queue WHERE id = ?').run(id);
}

export function addQueueItem(queueId, item) {
  const maxSort = db.prepare('SELECT COALESCE(MAX(sort_order), 0) AS m FROM queue_items WHERE queue_id = ?').get(queueId);
  const targetPrinters = item.target_printers ? JSON.stringify(item.target_printers) : null;
  const r = db.prepare(`INSERT INTO queue_items (queue_id, filename, printer_id, status, priority, copies, estimated_duration_s, estimated_filament_g, required_material, required_nozzle_mm, notes, sort_order, target_printers)
    VALUES (?, ?, ?, 'pending', ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
    queueId, item.filename, item.printer_id || null, item.priority || 0,
    item.copies || 1, item.estimated_duration_s || null, item.estimated_filament_g || null,
    item.required_material || null, item.required_nozzle_mm || null, item.notes || null,
    (maxSort?.m || 0) + 1, targetPrinters
  );
  return r.lastInsertRowid;
}

export function getQueueItem(id) {
  return db.prepare('SELECT * FROM queue_items WHERE id = ?').get(id);
}

export function updateQueueItem(id, opts) {
  const fields = [];
  const values = [];
  for (const key of ['filename', 'printer_id', 'status', 'notes', 'started_at', 'completed_at']) {
    if (opts[key] !== undefined) { fields.push(`${key} = ?`); values.push(opts[key]); }
  }
  for (const key of ['priority', 'copies', 'copies_completed', 'print_history_id', 'estimated_duration_s', 'sort_order']) {
    if (opts[key] !== undefined) { fields.push(`${key} = ?`); values.push(opts[key]); }
  }
  if (opts.estimated_filament_g !== undefined) { fields.push('estimated_filament_g = ?'); values.push(opts.estimated_filament_g); }
  if (opts.required_material !== undefined) { fields.push('required_material = ?'); values.push(opts.required_material); }
  if (opts.required_nozzle_mm !== undefined) { fields.push('required_nozzle_mm = ?'); values.push(opts.required_nozzle_mm); }
  if (fields.length === 0) return;
  values.push(id);
  db.prepare(`UPDATE queue_items SET ${fields.join(', ')} WHERE id = ?`).run(...values);
}

export function deleteQueueItem(id) {
  db.prepare('DELETE FROM queue_items WHERE id = ?').run(id);
}

export function reorderQueueItems(queueId, itemIds) {
  const stmt = db.prepare('UPDATE queue_items SET sort_order = ? WHERE id = ? AND queue_id = ?');
  for (let i = 0; i < itemIds.length; i++) {
    stmt.run(i + 1, itemIds[i], queueId);
  }
}

export function getNextPendingItem(queueId, priorityMode) {
  if (priorityMode === 'priority') {
    return db.prepare('SELECT * FROM queue_items WHERE queue_id = ? AND status = ? ORDER BY priority DESC, sort_order, added_at LIMIT 1').get(queueId, 'pending');
  }
  return db.prepare('SELECT * FROM queue_items WHERE queue_id = ? AND status = ? ORDER BY sort_order, added_at LIMIT 1').get(queueId, 'pending');
}

export function getActiveQueueItems() {
  return db.prepare(`SELECT qi.*, pq.name AS queue_name FROM queue_items qi
    JOIN print_queue pq ON qi.queue_id = pq.id
    WHERE qi.status IN ('printing', 'assigned')
    ORDER BY qi.started_at DESC`).all();
}

export function addQueueLog(queueId, itemId, printerId, event, details) {
  db.prepare('INSERT INTO queue_log (queue_id, item_id, printer_id, event, details) VALUES (?, ?, ?, ?, ?)').run(
    queueId, itemId || null, printerId || null, event, details || null
  );
}

export function getQueueLog(queueId, limit = 50) {
  if (queueId) {
    return db.prepare('SELECT * FROM queue_log WHERE queue_id = ? ORDER BY timestamp DESC LIMIT ?').all(queueId, limit);
  }
  return db.prepare('SELECT * FROM queue_log ORDER BY timestamp DESC LIMIT ?').all(limit);
}

// ---- Tags ----

export function getTags(category) {
  const base = `SELECT t.*, (SELECT COUNT(*) FROM entity_tags et WHERE et.tag_id = t.id) AS usage_count FROM tags t`;
  if (category) return db.prepare(base + ' WHERE t.category = ? ORDER BY t.name').all(category);
  return db.prepare(base + ' ORDER BY t.category, t.name').all();
}

export function createTag(name, category, color) {
  const r = db.prepare('INSERT INTO tags (name, category, color) VALUES (?, ?, ?)').run(name, category || 'custom', color || null);
  return r.lastInsertRowid;
}

export function updateTag(id, name, category, color) {
  db.prepare('UPDATE tags SET name = ?, category = ?, color = ? WHERE id = ?').run(name, category || 'custom', color || null, id);
}

export function deleteTag(id) {
  db.prepare('DELETE FROM entity_tags WHERE tag_id = ?').run(id);
  db.prepare('DELETE FROM tags WHERE id = ?').run(id);
}

export function getEntitiesByTag(entityType, tagId) {
  return db.prepare('SELECT entity_id FROM entity_tags WHERE entity_type = ? AND tag_id = ?').all(entityType, tagId).map(r => r.entity_id);
}

export function assignTag(entityType, entityId, tagId) {
  db.prepare('INSERT OR IGNORE INTO entity_tags (entity_type, entity_id, tag_id) VALUES (?, ?, ?)').run(entityType, entityId, tagId);
}

export function unassignTag(entityType, entityId, tagId) {
  db.prepare('DELETE FROM entity_tags WHERE entity_type = ? AND entity_id = ? AND tag_id = ?').run(entityType, entityId, tagId);
}

export function getEntityTags(entityType, entityId) {
  return db.prepare(`SELECT t.* FROM tags t JOIN entity_tags et ON t.id = et.tag_id
    WHERE et.entity_type = ? AND et.entity_id = ?
    ORDER BY t.name`).all(entityType, entityId);
}

// ---- NFC Mappings ----

export function getNfcMappings() {
  return db.prepare(`SELECT n.*, fp.name AS spool_name, fp.color_hex
    FROM nfc_mappings n
    LEFT JOIN spools s ON n.spool_id = s.id
    LEFT JOIN filament_profiles fp ON s.filament_profile_id = fp.id
    ORDER BY n.created_at DESC`).all();
}

export function lookupNfcTag(uid) {
  return db.prepare(`SELECT n.*, fp.name AS spool_name, fp.color_hex, fp.material, v.name AS vendor_name
    FROM nfc_mappings n
    LEFT JOIN spools s ON n.spool_id = s.id
    LEFT JOIN filament_profiles fp ON s.filament_profile_id = fp.id
    LEFT JOIN vendors v ON fp.vendor_id = v.id
    WHERE n.tag_uid = ?`).get(uid);
}

export function linkNfcTag(tagUid, spoolId, standard, data) {
  const existing = db.prepare('SELECT id FROM nfc_mappings WHERE tag_uid = ?').get(tagUid);
  if (existing) {
    db.prepare('UPDATE nfc_mappings SET spool_id = ?, standard = ?, data = ?, last_scanned = datetime(\'now\') WHERE tag_uid = ?')
      .run(spoolId, standard || 'openspool', data || null, tagUid);
    return existing.id;
  }
  const r = db.prepare('INSERT INTO nfc_mappings (tag_uid, spool_id, standard, data, last_scanned) VALUES (?, ?, ?, ?, datetime(\'now\'))')
    .run(tagUid, spoolId, standard || 'openspool', data || null);
  return r.lastInsertRowid;
}

export function unlinkNfcTag(uid) {
  db.prepare('DELETE FROM nfc_mappings WHERE tag_uid = ?').run(uid);
}

export function updateNfcScan(uid) {
  db.prepare('UPDATE nfc_mappings SET last_scanned = datetime(\'now\') WHERE tag_uid = ?').run(uid);
}

// ---- Spool Checkout ----

export function checkoutSpool(spoolId, actor, fromLocation) {
  db.prepare('UPDATE spools SET checked_out = 1, checked_out_at = datetime(\'now\'), checked_out_by = ?, checked_out_from = ? WHERE id = ?')
    .run(actor || null, fromLocation || null, spoolId);
  db.prepare('INSERT INTO spool_checkout_log (spool_id, action, from_location, actor) VALUES (?, ?, ?, ?)')
    .run(spoolId, 'checkout', fromLocation || null, actor || null);
  addSpoolEvent(spoolId, 'checked_out', JSON.stringify({ by: actor, from: fromLocation }), actor);
}

export function checkinSpool(spoolId, actor, toLocation) {
  const spool = db.prepare('SELECT checked_out_from FROM spools WHERE id = ?').get(spoolId);
  db.prepare('UPDATE spools SET checked_out = 0, checked_out_at = NULL, checked_out_by = NULL, checked_out_from = NULL WHERE id = ?')
    .run(spoolId);
  db.prepare('INSERT INTO spool_checkout_log (spool_id, action, from_location, to_location, actor) VALUES (?, ?, ?, ?, ?)')
    .run(spoolId, 'checkin', spool?.checked_out_from || null, toLocation || null, actor || null);
  addSpoolEvent(spoolId, 'checked_in', JSON.stringify({ by: actor, to: toLocation }), actor);
}

export function getCheckedOutSpools() {
  return db.prepare(`SELECT s.*, fp.name AS profile_name, fp.material, fp.color_hex, fp.color_name, v.name AS vendor_name
    FROM spools s
    LEFT JOIN filament_profiles fp ON s.filament_profile_id = fp.id
    LEFT JOIN vendors v ON fp.vendor_id = v.id
    WHERE s.checked_out = 1 ORDER BY s.checked_out_at DESC`).all();
}

export function getCheckoutLog(spoolId, limit = 50) {
  if (spoolId) {
    return db.prepare('SELECT * FROM spool_checkout_log WHERE spool_id = ? ORDER BY timestamp DESC LIMIT ?').all(spoolId, limit);
  }
  return db.prepare('SELECT * FROM spool_checkout_log ORDER BY timestamp DESC LIMIT ?').all(limit);
}

// ---- Spool Events Timeline ----

export function addSpoolEvent(spoolId, eventType, details, actor) {
  db.prepare('INSERT INTO spool_events (spool_id, event_type, details, actor) VALUES (?, ?, ?, ?)')
    .run(spoolId, eventType, details || null, actor || null);
}

export function getSpoolTimeline(spoolId, limit = 100) {
  return db.prepare('SELECT * FROM spool_events WHERE spool_id = ? ORDER BY timestamp DESC LIMIT ?').all(spoolId, limit);
}

export function getRecentSpoolEvents(limit = 50) {
  return db.prepare(`SELECT se.*, fp.name AS spool_name FROM spool_events se
    LEFT JOIN spools s ON se.spool_id = s.id
    LEFT JOIN filament_profiles fp ON s.filament_profile_id = fp.id
    ORDER BY se.timestamp DESC LIMIT ?`).all(limit);
}

// ---- Bulk Spool Operations ----

export function bulkDeleteSpools(ids) {
  const placeholders = ids.map(() => '?').join(',');
  db.prepare(`DELETE FROM spools WHERE id IN (${placeholders})`).run(...ids);
}

export function bulkArchiveSpools(ids) {
  const placeholders = ids.map(() => '?').join(',');
  db.prepare(`UPDATE spools SET archived = 1 WHERE id IN (${placeholders})`).run(...ids);
}

export function bulkRelocateSpools(ids, location) {
  const placeholders = ids.map(() => '?').join(',');
  db.prepare(`UPDATE spools SET location = ? WHERE id IN (${placeholders})`).run(location, ...ids);
}

export function bulkMarkDried(ids) {
  const placeholders = ids.map(() => '?').join(',');
  db.prepare(`UPDATE spools SET last_dried_at = datetime('now') WHERE id IN (${placeholders})`).run(...ids);
}

export function bulkEditSpools(ids, fields) {
  const allowed = ['cost_per_kg', 'notes', 'location', 'material', 'color_hex', 'color_name', 'weight_total'];
  const sets = [];
  const vals = [];
  for (const [k, v] of Object.entries(fields)) {
    if (allowed.includes(k)) { sets.push(`${k} = ?`); vals.push(v); }
  }
  if (sets.length === 0 || ids.length === 0) return 0;
  const placeholders = ids.map(() => '?').join(',');
  const result = db.prepare(`UPDATE spools SET ${sets.join(', ')} WHERE id IN (${placeholders})`).run(...vals, ...ids);
  return result.changes;
}

export function bulkAssignTag(tagId, entityType, entityIds) {
  const stmt = db.prepare('INSERT OR IGNORE INTO entity_tags (entity_type, entity_id, tag_id) VALUES (?, ?, ?)');
  let count = 0;
  for (const id of entityIds) { stmt.run(entityType, id, tagId); count++; }
  return count;
}

export function bulkUnassignTag(tagId, entityType, entityIds) {
  const placeholders = entityIds.map(() => '?').join(',');
  const result = db.prepare(`DELETE FROM entity_tags WHERE tag_id = ? AND entity_type = ? AND entity_id IN (${placeholders})`).run(tagId, entityType, ...entityIds);
  return result.changes;
}

export function bulkDeleteProfiles(ids) {
  const placeholders = ids.map(() => '?').join(',');
  db.prepare(`DELETE FROM filament_profiles WHERE id IN (${placeholders})`).run(...ids);
}

export function bulkEditProfiles(ids, fields) {
  const allowed = ['material', 'density', 'diameter', 'vendor_id', 'notes'];
  const sets = [];
  const vals = [];
  for (const [k, v] of Object.entries(fields)) {
    if (allowed.includes(k)) { sets.push(`${k} = ?`); vals.push(v); }
  }
  if (sets.length === 0 || ids.length === 0) return 0;
  const placeholders = ids.map(() => '?').join(',');
  const result = db.prepare(`UPDATE filament_profiles SET ${sets.join(', ')} WHERE id IN (${placeholders})`).run(...vals, ...ids);
  return result.changes;
}

export function bulkDeleteVendors(ids) {
  const placeholders = ids.map(() => '?').join(',');
  // Check for dependent profiles
  const deps = db.prepare(`SELECT COUNT(*) as c FROM filament_profiles WHERE vendor_id IN (${placeholders})`).get(...ids);
  if (deps.c > 0) throw new Error(`Cannot delete: ${deps.c} profiles depend on these vendors`);
  db.prepare(`DELETE FROM vendors WHERE id IN (${placeholders})`).run(...ids);
}

export function bulkStartDrying(ids, opts = {}) {
  const stmt = db.prepare(`INSERT INTO drying_sessions
    (spool_id, temperature, duration_minutes, method, notes, active)
    VALUES (?, ?, ?, ?, ?, 1)`);
  const results = [];
  for (const id of ids) {
    const r = stmt.run(id, opts.temperature || null, opts.duration_minutes || null, opts.method || 'dryer_box', opts.notes || null);
    results.push(Number(r.lastInsertRowid));
  }
  // Also mark spools as drying
  const placeholders = ids.map(() => '?').join(',');
  db.prepare(`UPDATE spools SET last_dried_at = datetime('now') WHERE id IN (${placeholders})`).run(...ids);
  return results;
}

export function getSpoolsForExportByIds(ids) {
  const placeholders = ids.map(() => '?').join(',');
  return _enrichSpoolRows(db.prepare(SPOOL_SELECT + ` WHERE s.id IN (${placeholders}) ORDER BY s.id`).all(...ids));
}

// ---- G-Code Macros ----

export function getMacros(category) {
  if (category) return db.prepare('SELECT * FROM gcode_macros WHERE category = ? ORDER BY sort_order, name').all(category);
  return db.prepare('SELECT * FROM gcode_macros ORDER BY sort_order, name').all();
}

export function getMacro(id) {
  return db.prepare('SELECT * FROM gcode_macros WHERE id = ?').get(id) || null;
}

export function addMacro(m) {
  const r = db.prepare('INSERT INTO gcode_macros (name, description, gcode, category, sort_order) VALUES (?, ?, ?, ?, ?)')
    .run(m.name, m.description || null, m.gcode, m.category || 'manual', m.sort_order || 0);
  return r.lastInsertRowid;
}

export function updateMacro(id, m) {
  const fields = [];
  const values = [];
  for (const key of ['name', 'description', 'gcode', 'category', 'sort_order']) {
    if (m[key] !== undefined) { fields.push(`${key} = ?`); values.push(m[key]); }
  }
  if (fields.length === 0) return;
  values.push(id);
  db.prepare(`UPDATE gcode_macros SET ${fields.join(', ')} WHERE id = ?`).run(...values);
}

export function deleteMacro(id) {
  db.prepare('DELETE FROM gcode_macros WHERE id = ?').run(id);
}

// ---- Outgoing Webhooks ----

export function getWebhookConfigs() {
  return db.prepare('SELECT * FROM webhook_configs ORDER BY created_at DESC').all();
}

export function getWebhookConfig(id) {
  return db.prepare('SELECT * FROM webhook_configs WHERE id = ?').get(id) || null;
}

export function addWebhookConfig(w) {
  const r = db.prepare(`INSERT INTO webhook_configs (name, url, secret, events, headers, template, retry_count, retry_delay_s, active)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
    w.name, w.url, w.secret || null,
    JSON.stringify(w.events || []), JSON.stringify(w.headers || {}),
    w.template || 'generic', w.retry_count ?? 3, w.retry_delay_s ?? 10, w.active ?? 1
  );
  return Number(r.lastInsertRowid);
}

export function updateWebhookConfig(id, w) {
  const fields = [];
  const values = [];
  for (const key of ['name', 'url', 'secret', 'template', 'retry_count', 'retry_delay_s', 'active']) {
    if (w[key] !== undefined) { fields.push(`${key} = ?`); values.push(w[key]); }
  }
  if (w.events !== undefined) { fields.push('events = ?'); values.push(JSON.stringify(w.events)); }
  if (w.headers !== undefined) { fields.push('headers = ?'); values.push(JSON.stringify(w.headers)); }
  if (fields.length === 0) return;
  values.push(id);
  db.prepare(`UPDATE webhook_configs SET ${fields.join(', ')} WHERE id = ?`).run(...values);
}

export function deleteWebhookConfig(id) {
  db.prepare('DELETE FROM webhook_configs WHERE id = ?').run(id);
}

export function getActiveWebhooks() {
  return db.prepare('SELECT * FROM webhook_configs WHERE active = 1').all();
}

export function addWebhookDelivery(d) {
  const r = db.prepare(`INSERT INTO webhook_deliveries (webhook_id, event_type, payload, status, attempts)
    VALUES (?, ?, ?, ?, ?)`).run(d.webhook_id, d.event_type, d.payload, d.status || 'pending', d.attempts || 0);
  return Number(r.lastInsertRowid);
}

export function updateWebhookDelivery(id, updates) {
  const fields = [];
  const values = [];
  for (const key of ['status', 'attempts', 'last_attempt', 'response_code', 'response_body']) {
    if (updates[key] !== undefined) { fields.push(`${key} = ?`); values.push(updates[key]); }
  }
  if (fields.length === 0) return;
  values.push(id);
  db.prepare(`UPDATE webhook_deliveries SET ${fields.join(', ')} WHERE id = ?`).run(...values);
}

export function getWebhookDeliveries(webhookId, limit = 50) {
  return db.prepare('SELECT * FROM webhook_deliveries WHERE webhook_id = ? ORDER BY created_at DESC LIMIT ?').all(webhookId, limit);
}

export function getPendingDeliveries() {
  return db.prepare("SELECT wd.*, wc.url, wc.secret, wc.headers, wc.template, wc.retry_count, wc.retry_delay_s FROM webhook_deliveries wd JOIN webhook_configs wc ON wd.webhook_id = wc.id WHERE wd.status IN ('pending','retrying') AND wc.active = 1 ORDER BY wd.created_at ASC LIMIT 50").all();
}

// ---- Print Costs (Advanced) ----

export function savePrintCost(printHistoryId, costs) {
  db.prepare(`INSERT OR REPLACE INTO print_costs (print_history_id, filament_cost, electricity_cost, depreciation_cost, labor_cost, markup_amount, total_cost, currency)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)`).run(
    printHistoryId, costs.filament_cost || 0, costs.electricity_cost || 0, costs.depreciation_cost || 0,
    costs.labor_cost || 0, costs.markup_amount || 0, costs.total_cost || 0, costs.currency || 'NOK'
  );
}

export function getPrintCost(printHistoryId) {
  return db.prepare('SELECT * FROM print_costs WHERE print_history_id = ?').get(printHistoryId) || null;
}

export function getCostReport(from, to) {
  let query = `SELECT pc.*, ph.filename, ph.printer_id, ph.started_at, ph.finished_at, ph.duration_seconds, ph.filament_used_g, ph.status
    FROM print_costs pc JOIN print_history ph ON pc.print_history_id = ph.id WHERE 1=1`;
  const params = [];
  if (from) { query += ' AND ph.started_at >= ?'; params.push(from); }
  if (to) { query += ' AND ph.started_at <= ?'; params.push(to); }
  query += ' ORDER BY ph.started_at DESC';
  return db.prepare(query).all(...params);
}

export function getCostSummary(from, to) {
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

export function estimatePrintCostAdvanced(filamentUsedG, durationSeconds, spoolId = null, printerId = null, printStatus = null) {
  const cs = getPrinterCostSettings(printerId);
  const electricityRate = cs.electricity_rate_kwh;
  const printerWattage = cs.printer_wattage;
  const machineCost = cs.machine_cost;
  const machineLifetimeH = cs.machine_lifetime_hours;
  const laborRate = parseFloat(getInventorySetting('labor_rate_hour') || '0');
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

  const filamentCost = Math.round(filamentUsedG * filamentCostPerG * 100) / 100;
  const durationH = durationSeconds / 3600;
  const electricityCost = Math.round(durationH * (printerWattage / 1000) * electricityRate * 100) / 100;
  const depreciationCost = machineLifetimeH > 0 ? Math.round(durationH * (machineCost / machineLifetimeH) * 100) / 100 : 0;
  const laborCost = excludeLabor ? 0 : Math.round((durationH * laborRate + (setupMinutes / 60) * laborRate) * 100) / 100;
  const subtotal = filamentCost + electricityCost + depreciationCost + laborCost;
  const markupAmount = excludeLabor ? 0 : (markupPct > 0 ? Math.round(subtotal * (markupPct / 100) * 100) / 100 : 0);
  const totalCost = Math.round((subtotal + markupAmount) * 100) / 100;

  return { filament_cost: filamentCost, electricity_cost: electricityCost, depreciation_cost: depreciationCost, labor_cost: laborCost, markup_amount: markupAmount, total_cost: totalCost, currency };
}

// ---- Material Reference ----

export function getMaterials() {
  return db.prepare('SELECT * FROM material_reference ORDER BY category, material').all();
}

export function getMaterial(id) {
  return db.prepare('SELECT * FROM material_reference WHERE id = ?').get(id) || null;
}

export function getMaterialByName(name) {
  return db.prepare('SELECT * FROM material_reference WHERE material = ? COLLATE NOCASE').get(name) || null;
}

export function updateMaterial(id, m) {
  const fields = [];
  const values = [];
  for (const key of ['material', 'category', 'difficulty', 'strength', 'temp_resistance', 'moisture_sensitivity', 'flexibility', 'layer_adhesion', 'nozzle_temp_min', 'nozzle_temp_max', 'bed_temp_min', 'bed_temp_max', 'chamber_temp', 'enclosure', 'typical_density', 'tips', 'nozzle_recommendation', 'abrasive', 'food_safe', 'uv_resistant']) {
    if (m[key] !== undefined) { fields.push(`${key} = ?`); values.push(m[key]); }
  }
  if (fields.length === 0) return;
  values.push(id);
  db.prepare(`UPDATE material_reference SET ${fields.join(', ')} WHERE id = ?`).run(...values);
}

export function addMaterial(m) {
  const r = db.prepare(`INSERT INTO material_reference (material, category, difficulty, strength, temp_resistance, moisture_sensitivity, flexibility, layer_adhesion, nozzle_temp_min, nozzle_temp_max, bed_temp_min, bed_temp_max, chamber_temp, enclosure, typical_density, tips, nozzle_recommendation, abrasive, food_safe, uv_resistant)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).run(
    m.material, m.category || 'standard', m.difficulty || 1, m.strength || 3, m.temp_resistance || 3,
    m.moisture_sensitivity || 3, m.flexibility || 1, m.layer_adhesion || 3,
    m.nozzle_temp_min || null, m.nozzle_temp_max || null, m.bed_temp_min || null, m.bed_temp_max || null,
    m.chamber_temp || null, m.enclosure || 0, m.typical_density || null,
    m.tips || null, m.nozzle_recommendation || null, m.abrasive || 0, m.food_safe || 0, m.uv_resistant || 0
  );
  return Number(r.lastInsertRowid);
}

// ---- Hardware Database ----

export function getHardwareItems(category) {
  if (category) return db.prepare('SELECT * FROM hardware_items WHERE category = ? ORDER BY name').all(category);
  return db.prepare('SELECT * FROM hardware_items ORDER BY category, name').all();
}

export function getHardwareItem(id) {
  return db.prepare('SELECT * FROM hardware_items WHERE id = ?').get(id) || null;
}

export function addHardwareItem(h) {
  const r = db.prepare(`INSERT INTO hardware_items (category, name, brand, model, compatible_printers, specs, purchase_price, purchase_date, purchase_url, rating, notes, image_url)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
    h.category, h.name, h.brand || null, h.model || null,
    JSON.stringify(h.compatible_printers || []), JSON.stringify(h.specs || {}),
    h.purchase_price || null, h.purchase_date || null, h.purchase_url || null,
    h.rating || null, h.notes || null, h.image_url || null
  );
  return Number(r.lastInsertRowid);
}

export function updateHardwareItem(id, h) {
  const fields = [];
  const values = [];
  for (const key of ['category', 'name', 'brand', 'model', 'purchase_price', 'purchase_date', 'purchase_url', 'rating', 'notes', 'image_url']) {
    if (h[key] !== undefined) { fields.push(`${key} = ?`); values.push(h[key]); }
  }
  if (h.compatible_printers !== undefined) { fields.push('compatible_printers = ?'); values.push(JSON.stringify(h.compatible_printers)); }
  if (h.specs !== undefined) { fields.push('specs = ?'); values.push(JSON.stringify(h.specs)); }
  if (fields.length === 0) return;
  values.push(id);
  db.prepare(`UPDATE hardware_items SET ${fields.join(', ')} WHERE id = ?`).run(...values);
}

export function deleteHardwareItem(id) {
  db.prepare('DELETE FROM hardware_items WHERE id = ?').run(id);
}

export function assignHardware(hardwareId, printerId) {
  db.prepare('INSERT INTO hardware_printer_assignments (hardware_id, printer_id) VALUES (?, ?)').run(hardwareId, printerId);
}

export function unassignHardware(hardwareId, printerId) {
  db.prepare("UPDATE hardware_printer_assignments SET removed_at = datetime('now') WHERE hardware_id = ? AND printer_id = ? AND removed_at IS NULL").run(hardwareId, printerId);
}

export function getHardwareForPrinter(printerId) {
  return db.prepare(`SELECT hi.*, hpa.installed_at FROM hardware_items hi
    JOIN hardware_printer_assignments hpa ON hi.id = hpa.hardware_id
    WHERE hpa.printer_id = ? AND hpa.removed_at IS NULL
    ORDER BY hi.category, hi.name`).all(printerId);
}

export function getHardwareAssignments(hardwareId) {
  return db.prepare('SELECT * FROM hardware_printer_assignments WHERE hardware_id = ? ORDER BY installed_at DESC').all(hardwareId);
}

// ---- User Roles & Permissions ----

export function getRoles() {
  return db.prepare('SELECT * FROM user_roles ORDER BY name').all();
}

export function getRole(id) {
  return db.prepare('SELECT * FROM user_roles WHERE id = ?').get(id) || null;
}

export function addRole(r) {
  const result = db.prepare('INSERT INTO user_roles (name, permissions, description, is_default) VALUES (?, ?, ?, ?)')
    .run(r.name, JSON.stringify(r.permissions || []), r.description || null, r.is_default || 0);
  return Number(result.lastInsertRowid);
}

export function updateRole(id, r) {
  const fields = [];
  const values = [];
  for (const key of ['name', 'description', 'is_default']) {
    if (r[key] !== undefined) { fields.push(`${key} = ?`); values.push(r[key]); }
  }
  if (r.permissions !== undefined) { fields.push('permissions = ?'); values.push(JSON.stringify(r.permissions)); }
  if (fields.length === 0) return;
  values.push(id);
  db.prepare(`UPDATE user_roles SET ${fields.join(', ')} WHERE id = ?`).run(...values);
}

export function deleteRole(id) {
  db.prepare('DELETE FROM user_roles WHERE id = ?').run(id);
}

// ---- Users (DB-backed) ----

export function getUsers() {
  return db.prepare('SELECT u.id, u.username, u.display_name, u.role_id, u.created_at, u.last_login, r.name AS role_name, r.permissions FROM users u LEFT JOIN user_roles r ON u.role_id = r.id ORDER BY u.username').all();
}

export function getUser(id) {
  return db.prepare('SELECT u.id, u.username, u.display_name, u.role_id, u.created_at, u.last_login, r.name AS role_name, r.permissions FROM users u LEFT JOIN user_roles r ON u.role_id = r.id WHERE u.id = ?').get(id) || null;
}

export function getUserByUsername(username) {
  return db.prepare('SELECT u.*, r.name AS role_name, r.permissions FROM users u LEFT JOIN user_roles r ON u.role_id = r.id WHERE u.username = ?').get(username) || null;
}

export function addUser(u) {
  const result = db.prepare('INSERT INTO users (username, password_hash, role_id, display_name) VALUES (?, ?, ?, ?)')
    .run(u.username, u.password_hash, u.role_id || null, u.display_name || null);
  return Number(result.lastInsertRowid);
}

export function updateUser(id, u) {
  const fields = [];
  const values = [];
  for (const key of ['username', 'password_hash', 'role_id', 'display_name', 'last_login']) {
    if (u[key] !== undefined) { fields.push(`${key} = ?`); values.push(u[key]); }
  }
  if (fields.length === 0) return;
  values.push(id);
  db.prepare(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`).run(...values);
}

export function deleteUser(id) {
  db.prepare('DELETE FROM users WHERE id = ?').run(id);
}

// ---- API Keys ----

export function getApiKeys() {
  return db.prepare('SELECT id, name, key_prefix, permissions, user_id, last_used, expires_at, active, created_at FROM api_keys ORDER BY created_at DESC').all();
}

export function getApiKeyByHash(hash) {
  return db.prepare('SELECT * FROM api_keys WHERE key_hash = ? AND active = 1').get(hash) || null;
}

export function addApiKey(k) {
  const result = db.prepare('INSERT INTO api_keys (name, key_hash, key_prefix, permissions, user_id, expires_at) VALUES (?, ?, ?, ?, ?, ?)')
    .run(k.name, k.key_hash, k.key_prefix, JSON.stringify(k.permissions || ['*']), k.user_id || null, k.expires_at || null);
  return Number(result.lastInsertRowid);
}

export function updateApiKeyLastUsed(id) {
  db.prepare("UPDATE api_keys SET last_used = datetime('now') WHERE id = ?").run(id);
}

export function deleteApiKey(id) {
  db.prepare('DELETE FROM api_keys WHERE id = ?').run(id);
}

export function deactivateApiKey(id) {
  db.prepare('UPDATE api_keys SET active = 0 WHERE id = ?').run(id);
}

// ---- E-Commerce ----

export function getEcommerceConfigs() {
  return db.prepare('SELECT * FROM ecommerce_configs ORDER BY created_at DESC').all();
}

export function getEcommerceConfig(id) {
  return db.prepare('SELECT * FROM ecommerce_configs WHERE id = ?').get(id) || null;
}

export function addEcommerceConfig(c) {
  const result = db.prepare('INSERT INTO ecommerce_configs (platform, name, webhook_secret, api_url, api_key, auto_queue, target_queue_id, sku_to_file_mapping, active) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)')
    .run(c.platform || 'custom', c.name, c.webhook_secret || null, c.api_url || null, c.api_key || null, c.auto_queue ? 1 : 0, c.target_queue_id || null, JSON.stringify(c.sku_to_file_mapping || {}), c.active !== false ? 1 : 0);
  return Number(result.lastInsertRowid);
}

export function updateEcommerceConfig(id, c) {
  const fields = [];
  const values = [];
  for (const key of ['platform', 'name', 'webhook_secret', 'api_url', 'api_key', 'active']) {
    if (c[key] !== undefined) { fields.push(`${key} = ?`); values.push(key === 'active' ? (c[key] ? 1 : 0) : c[key]); }
  }
  if (c.auto_queue !== undefined) { fields.push('auto_queue = ?'); values.push(c.auto_queue ? 1 : 0); }
  if (c.target_queue_id !== undefined) { fields.push('target_queue_id = ?'); values.push(c.target_queue_id); }
  if (c.sku_to_file_mapping !== undefined) { fields.push('sku_to_file_mapping = ?'); values.push(JSON.stringify(c.sku_to_file_mapping)); }
  if (fields.length === 0) return;
  values.push(id);
  db.prepare(`UPDATE ecommerce_configs SET ${fields.join(', ')} WHERE id = ?`).run(...values);
}

export function deleteEcommerceConfig(id) {
  db.prepare('DELETE FROM ecommerce_orders WHERE config_id = ?').run(id);
  db.prepare('DELETE FROM ecommerce_configs WHERE id = ?').run(id);
}

export function getEcommerceOrders(configId = null, limit = 50) {
  if (configId) {
    return db.prepare('SELECT * FROM ecommerce_orders WHERE config_id = ? ORDER BY received_at DESC LIMIT ?').all(configId, limit);
  }
  return db.prepare('SELECT * FROM ecommerce_orders ORDER BY received_at DESC LIMIT ?').all(limit);
}

export function getEcommerceOrder(id) {
  return db.prepare('SELECT * FROM ecommerce_orders WHERE id = ?').get(id) || null;
}

export function addEcommerceOrder(o) {
  const result = db.prepare('INSERT INTO ecommerce_orders (config_id, order_id, platform_order_id, customer_name, items, status, queue_item_ids) VALUES (?, ?, ?, ?, ?, ?, ?)')
    .run(o.config_id, o.order_id || null, o.platform_order_id || null, o.customer_name || null, JSON.stringify(o.items || []), o.status || 'received', JSON.stringify(o.queue_item_ids || []));
  return Number(result.lastInsertRowid);
}

export function updateEcommerceOrder(id, updates) {
  const fields = [];
  const values = [];
  for (const key of ['status', 'customer_name', 'fulfilled_at']) {
    if (updates[key] !== undefined) { fields.push(`${key} = ?`); values.push(updates[key]); }
  }
  if (updates.queue_item_ids !== undefined) { fields.push('queue_item_ids = ?'); values.push(JSON.stringify(updates.queue_item_ids)); }
  if (updates.items !== undefined) { fields.push('items = ?'); values.push(JSON.stringify(updates.items)); }
  if (fields.length === 0) return;
  values.push(id);
  db.prepare(`UPDATE ecommerce_orders SET ${fields.join(', ')} WHERE id = ?`).run(...values);
}

// ---- Timelapse ----

export function getTimelapseRecordings(printerId = null, limit = 50) {
  if (printerId) {
    return db.prepare('SELECT * FROM timelapse_recordings WHERE printer_id = ? ORDER BY started_at DESC LIMIT ?').all(printerId, limit);
  }
  return db.prepare('SELECT * FROM timelapse_recordings ORDER BY started_at DESC LIMIT ?').all(limit);
}

export function getTimelapseRecording(id) {
  return db.prepare('SELECT * FROM timelapse_recordings WHERE id = ?').get(id) || null;
}

export function addTimelapseRecording(r) {
  const result = db.prepare('INSERT INTO timelapse_recordings (printer_id, print_history_id, filename, format, file_path, status) VALUES (?, ?, ?, ?, ?, ?)')
    .run(r.printer_id, r.print_history_id || null, r.filename || null, r.format || 'mp4', r.file_path || null, r.status || 'recording');
  return Number(result.lastInsertRowid);
}

export function updateTimelapseRecording(id, updates) {
  const fields = [];
  const values = [];
  for (const key of ['filename', 'format', 'duration_seconds', 'frame_count', 'file_size_bytes', 'file_path', 'status', 'completed_at', 'print_history_id']) {
    if (updates[key] !== undefined) { fields.push(`${key} = ?`); values.push(updates[key]); }
  }
  if (fields.length === 0) return;
  values.push(id);
  db.prepare(`UPDATE timelapse_recordings SET ${fields.join(', ')} WHERE id = ?`).run(...values);
}

export function deleteTimelapseRecording(id) {
  db.prepare('DELETE FROM timelapse_recordings WHERE id = ?').run(id);
}

// ---- Push Subscriptions ----

export function getPushSubscriptions() {
  return db.prepare('SELECT * FROM push_subscriptions ORDER BY created_at DESC').all();
}

export function addPushSubscription(sub) {
  try {
    const result = db.prepare('INSERT OR REPLACE INTO push_subscriptions (endpoint, keys_p256dh, keys_auth, user_agent) VALUES (?, ?, ?, ?)')
      .run(sub.endpoint, sub.keys_p256dh || null, sub.keys_auth || null, sub.user_agent || null);
    return Number(result.lastInsertRowid);
  } catch (e) {
    return null;
  }
}

export function deletePushSubscription(endpoint) {
  db.prepare('DELETE FROM push_subscriptions WHERE endpoint = ?').run(endpoint);
}

export function deletePushSubscriptionById(id) {
  db.prepare('DELETE FROM push_subscriptions WHERE id = ?').run(id);
}

// ---- Community Filaments ----

export function getCommunityFilaments(filters = {}) {
  let where = 'WHERE 1=1';
  const params = [];
  if (filters.manufacturer) { where += ' AND manufacturer = ?'; params.push(filters.manufacturer); }
  if (filters.material) { where += ' AND material = ?'; params.push(filters.material); }
  if (filters.material_type) { where += ' AND material_type = ?'; params.push(filters.material_type); }
  if (filters.category) { where += ' AND category = ?'; params.push(filters.category); }
  if (filters.color_hex) { where += ' AND color_hex = ?'; params.push(filters.color_hex.replace('#', '')); }
  if (filters.has_k_value) { where += ' AND pressure_advance_k IS NOT NULL'; }
  if (filters.has_td) { where += ' AND td_value IS NOT NULL AND td_value > 0'; }
  if (filters.temp_min) { where += ' AND extruder_temp >= ?'; params.push(filters.temp_min); }
  if (filters.temp_max) { where += ' AND extruder_temp <= ?'; params.push(filters.temp_max); }
  if (filters.search) { where += ' AND (name LIKE ? OR manufacturer LIKE ? OR color_name LIKE ? OR material LIKE ?)'; params.push(`%${filters.search}%`, `%${filters.search}%`, `%${filters.search}%`, `%${filters.search}%`); }

  const allowedSort = ['manufacturer', 'name', 'material', 'extruder_temp', 'pressure_advance_k', 'td_value', 'price', 'category', 'rating_avg', 'created_at'];
  let sort = allowedSort.includes(filters.sort) ? filters.sort : 'manufacturer';
  let dir = filters.sort_dir === 'DESC' ? 'DESC' : 'ASC';
  // Convenience sort aliases
  if (filters.sort === 'rating') { sort = 'rating_count'; dir = 'DESC'; where += ' AND rating_count > 0'; }
  if (filters.sort === 'newest') { sort = 'created_at'; dir = 'DESC'; }
  const order = `ORDER BY ${sort} ${dir}, manufacturer ASC, name ASC`;

  if (filters.limit) {
    const total = db.prepare(`SELECT COUNT(*) as c FROM community_filaments ${where}`).get(...params).c;
    const countParams = [...params];
    params.push(filters.limit);
    if (filters.offset) params.push(filters.offset);
    const rows = db.prepare(`SELECT * FROM community_filaments ${where} ${order} LIMIT ?${filters.offset ? ' OFFSET ?' : ''}`).all(...params);
    return { rows, total };
  }
  return db.prepare(`SELECT * FROM community_filaments ${where} ${order}`).all(...params);
}

export function getCommunityFilament(id) {
  return db.prepare('SELECT * FROM community_filaments WHERE id = ?').get(id) || null;
}

export function searchCommunityByColor(hex, tolerance = 30) {
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  const all = db.prepare("SELECT * FROM community_filaments WHERE color_hex IS NOT NULL AND color_hex != ''").all();
  return all.filter(f => {
    const fr = parseInt(f.color_hex.substring(0, 2), 16);
    const fg = parseInt(f.color_hex.substring(2, 4), 16);
    const fb = parseInt(f.color_hex.substring(4, 6), 16);
    const dist = Math.sqrt((r - fr) ** 2 + (g - fg) ** 2 + (b - fb) ** 2);
    return dist <= tolerance;
  }).map(f => ({ ...f, distance: Math.sqrt((r - parseInt(f.color_hex.substring(0, 2), 16)) ** 2 + (g - parseInt(f.color_hex.substring(2, 4), 16)) ** 2 + (b - parseInt(f.color_hex.substring(4, 6), 16)) ** 2) }))
    .sort((a, b) => a.distance - b.distance);
}

export function getCommunityManufacturers() {
  return db.prepare('SELECT DISTINCT manufacturer FROM community_filaments ORDER BY manufacturer').all().map(r => r.manufacturer);
}

export function getCommunityMaterials() {
  return db.prepare('SELECT DISTINCT material FROM community_filaments ORDER BY material').all().map(r => r.material);
}

const CF_COLUMNS = ['manufacturer', 'name', 'material', 'density', 'diameter', 'weight', 'spool_weight', 'extruder_temp', 'bed_temp', 'color_name', 'color_hex', 'td_value', 'shore_hardness', 'source', 'pressure_advance_k', 'max_volumetric_speed', 'flow_ratio', 'retraction_distance', 'retraction_speed', 'fan_speed_min', 'fan_speed_max', 'chamber_temp', 'material_type', 'category', 'difficulty', 'image_url', 'purchase_url', 'price', 'price_currency', 'brand_key', 'external_source_id', 'total_td_votes', 'tips', 'updated_at'];

export function addCommunityFilament(f) {
  const cols = CF_COLUMNS.filter(c => f[c] !== undefined);
  const placeholders = cols.map(() => '?').join(', ');
  const vals = cols.map(c => f[c] ?? null);
  const result = db.prepare(`INSERT INTO community_filaments (${cols.join(', ')}) VALUES (${placeholders})`).run(...vals);
  return Number(result.lastInsertRowid);
}

export function updateCommunityFilament(id, updates) {
  const fields = [];
  const values = [];
  for (const key of CF_COLUMNS) {
    if (updates[key] !== undefined) { fields.push(`${key} = ?`); values.push(updates[key]); }
  }
  if (fields.length === 0) return;
  values.push(id);
  db.prepare(`UPDATE community_filaments SET ${fields.join(', ')} WHERE id = ?`).run(...values);
}

export function deleteCommunityFilament(id) {
  db.prepare('DELETE FROM community_filaments WHERE id = ?').run(id);
}

export function getCommunityFilamentStats() {
  return {
    total: db.prepare('SELECT COUNT(*) as c FROM community_filaments').get().c,
    brands: db.prepare('SELECT COUNT(DISTINCT manufacturer) as c FROM community_filaments').get().c,
    materials: db.prepare('SELECT COUNT(DISTINCT material) as c FROM community_filaments').get().c,
    with_k_value: db.prepare('SELECT COUNT(*) as c FROM community_filaments WHERE pressure_advance_k IS NOT NULL').get().c,
    with_td: db.prepare('SELECT COUNT(*) as c FROM community_filaments WHERE td_value IS NOT NULL AND td_value > 0').get().c,
    top_brands: db.prepare('SELECT manufacturer, COUNT(*) as count FROM community_filaments GROUP BY manufacturer ORDER BY count DESC LIMIT 20').all(),
    material_breakdown: db.prepare('SELECT material, COUNT(*) as count FROM community_filaments GROUP BY material ORDER BY count DESC').all()
  };
}

export function upsertCommunityFilament(f) {
  // Check by external_source_id first
  if (f.external_source_id) {
    const existing = db.prepare('SELECT id FROM community_filaments WHERE external_source_id = ?').get(f.external_source_id);
    if (existing) { updateCommunityFilament(existing.id, f); return existing.id; }
  }
  // Fallback to natural key
  const existing = db.prepare("SELECT id FROM community_filaments WHERE manufacturer = ? AND COALESCE(name,'') = ? AND material = ? AND COALESCE(color_name,'') = ?").get(f.manufacturer, f.name || '', f.material, f.color_name || '');
  if (existing) { updateCommunityFilament(existing.id, f); return existing.id; }
  return addCommunityFilament(f);
}

export function clearCommunityFilaments(source = null) {
  if (source) db.prepare('DELETE FROM community_filaments WHERE source = ?').run(source);
  else db.prepare('DELETE FROM community_filaments').run();
}

export function getCommunityFilamentCategories() {
  return db.prepare('SELECT COALESCE(category, \'uncategorized\') as category, COUNT(*) as count FROM community_filaments GROUP BY category ORDER BY count DESC').all();
}

// ---- Brand Defaults ----

export function getBrandDefaults(manufacturer = null) {
  if (manufacturer) return db.prepare('SELECT * FROM brand_defaults WHERE manufacturer = ? ORDER BY material').all(manufacturer);
  return db.prepare('SELECT * FROM brand_defaults ORDER BY manufacturer, material').all();
}

export function getBrandDefault(id) {
  return db.prepare('SELECT * FROM brand_defaults WHERE id = ?').get(id) || null;
}

export function upsertBrandDefault(d) {
  const existing = db.prepare('SELECT id FROM brand_defaults WHERE manufacturer = ? AND (material = ? OR (material IS NULL AND ? IS NULL))').get(d.manufacturer, d.material || null, d.material || null);
  if (existing) {
    db.prepare('UPDATE brand_defaults SET default_density = ?, default_diameter = ?, default_spool_weight = ?, default_net_weight = ?, default_extruder_temp = ?, default_bed_temp = ?, default_max_speed = ?, default_retraction = ?, notes = ? WHERE id = ?').run(
      d.default_density || null, d.default_diameter || 1.75, d.default_spool_weight || null, d.default_net_weight || 1000, d.default_extruder_temp || null, d.default_bed_temp || null, d.default_max_speed || null, d.default_retraction || null, d.notes || null, existing.id);
    return existing.id;
  }
  const result = db.prepare('INSERT INTO brand_defaults (manufacturer, material, default_density, default_diameter, default_spool_weight, default_net_weight, default_extruder_temp, default_bed_temp, default_max_speed, default_retraction, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)').run(
    d.manufacturer, d.material || null, d.default_density || null, d.default_diameter || 1.75, d.default_spool_weight || null, d.default_net_weight || 1000, d.default_extruder_temp || null, d.default_bed_temp || null, d.default_max_speed || null, d.default_retraction || null, d.notes || null);
  return Number(result.lastInsertRowid);
}

export function deleteBrandDefault(id) {
  db.prepare('DELETE FROM brand_defaults WHERE id = ?').run(id);
}

// ---- Custom Fields ----

export function getCustomFieldDefs(entityType = null) {
  if (entityType) return db.prepare('SELECT * FROM custom_field_defs WHERE entity_type = ? ORDER BY sort_order, field_name').all(entityType);
  return db.prepare('SELECT * FROM custom_field_defs ORDER BY entity_type, sort_order, field_name').all();
}

export function getCustomFieldDef(id) {
  return db.prepare('SELECT * FROM custom_field_defs WHERE id = ?').get(id) || null;
}

export function addCustomFieldDef(d) {
  const result = db.prepare('INSERT INTO custom_field_defs (entity_type, field_name, field_label, field_type, options, default_value, required, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?)').run(
    d.entity_type, d.field_name, d.field_label, d.field_type || 'text', d.options ? JSON.stringify(d.options) : null, d.default_value || null, d.required ? 1 : 0, d.sort_order || 0);
  return Number(result.lastInsertRowid);
}

export function updateCustomFieldDef(id, updates) {
  const fields = [];
  const values = [];
  for (const key of ['field_label', 'field_type', 'default_value', 'required', 'sort_order']) {
    if (updates[key] !== undefined) { fields.push(`${key} = ?`); values.push(updates[key]); }
  }
  if (updates.options !== undefined) { fields.push('options = ?'); values.push(JSON.stringify(updates.options)); }
  if (fields.length === 0) return;
  values.push(id);
  db.prepare(`UPDATE custom_field_defs SET ${fields.join(', ')} WHERE id = ?`).run(...values);
}

export function deleteCustomFieldDef(id) {
  db.prepare('DELETE FROM custom_field_values WHERE field_id = ?').run(id);
  db.prepare('DELETE FROM custom_field_defs WHERE id = ?').run(id);
}

export function getCustomFieldValues(entityType, entityId) {
  return db.prepare('SELECT cfv.*, cfd.field_name, cfd.field_label, cfd.field_type FROM custom_field_values cfv JOIN custom_field_defs cfd ON cfv.field_id = cfd.id WHERE cfv.entity_type = ? AND cfv.entity_id = ?').all(entityType, entityId);
}

export function setCustomFieldValue(fieldId, entityType, entityId, value) {
  db.prepare('INSERT OR REPLACE INTO custom_field_values (field_id, entity_type, entity_id, value) VALUES (?, ?, ?, ?)').run(fieldId, entityType, entityId, value);
}

export function deleteCustomFieldValues(entityType, entityId) {
  db.prepare('DELETE FROM custom_field_values WHERE entity_type = ? AND entity_id = ?').run(entityType, entityId);
}

// ---- Printer Groups ----

export function getPrinterGroups() {
  return db.prepare('SELECT * FROM printer_groups ORDER BY name').all();
}

export function getPrinterGroup(id) {
  return db.prepare('SELECT * FROM printer_groups WHERE id = ?').get(id) || null;
}

export function addPrinterGroup(g) {
  const result = db.prepare('INSERT INTO printer_groups (name, description, parent_id, color, stagger_delay_s, max_concurrent, power_limit_w) VALUES (?, ?, ?, ?, ?, ?, ?)').run(
    g.name, g.description || null, g.parent_id || null, g.color || null, g.stagger_delay_s || 0, g.max_concurrent || 0, g.power_limit_w || 0);
  return Number(result.lastInsertRowid);
}

export function updatePrinterGroup(id, updates) {
  const fields = [];
  const values = [];
  for (const key of ['name', 'description', 'parent_id', 'color', 'stagger_delay_s', 'max_concurrent', 'power_limit_w']) {
    if (updates[key] !== undefined) { fields.push(`${key} = ?`); values.push(updates[key]); }
  }
  if (fields.length === 0) return;
  values.push(id);
  db.prepare(`UPDATE printer_groups SET ${fields.join(', ')} WHERE id = ?`).run(...values);
}

export function deletePrinterGroup(id) {
  db.prepare('DELETE FROM printer_group_members WHERE group_id = ?').run(id);
  db.prepare('DELETE FROM printer_groups WHERE id = ?').run(id);
}

export function addPrinterToGroup(groupId, printerId) {
  db.prepare('INSERT OR IGNORE INTO printer_group_members (group_id, printer_id) VALUES (?, ?)').run(groupId, printerId);
}

export function removePrinterFromGroup(groupId, printerId) {
  db.prepare('DELETE FROM printer_group_members WHERE group_id = ? AND printer_id = ?').run(groupId, printerId);
}

export function getGroupMembers(groupId) {
  return db.prepare('SELECT * FROM printer_group_members WHERE group_id = ? ORDER BY sort_order').all(groupId);
}

export function getPrinterGroupsForPrinter(printerId) {
  return db.prepare('SELECT pg.* FROM printer_groups pg JOIN printer_group_members pgm ON pg.id = pgm.group_id WHERE pgm.printer_id = ?').all(printerId);
}

// ---- Projects ----

export function getProjects(status = null) {
  if (status) return db.prepare('SELECT * FROM projects WHERE status = ? ORDER BY created_at DESC').all(status);
  return db.prepare('SELECT * FROM projects ORDER BY created_at DESC').all();
}

export function getProject(id) {
  return db.prepare('SELECT * FROM projects WHERE id = ?').get(id) || null;
}

export function addProject(p) {
  const result = db.prepare('INSERT INTO projects (name, description, status, client_name, due_date, notes, tags) VALUES (?, ?, ?, ?, ?, ?, ?)').run(
    p.name, p.description || null, p.status || 'active', p.client_name || null, p.due_date || null, p.notes || null, p.tags ? JSON.stringify(p.tags) : null);
  return Number(result.lastInsertRowid);
}

export function updateProject(id, updates) {
  const fields = [];
  const values = [];
  for (const key of ['name', 'description', 'status', 'client_name', 'due_date', 'total_prints', 'completed_prints', 'total_cost', 'notes', 'completed_at']) {
    if (updates[key] !== undefined) { fields.push(`${key} = ?`); values.push(updates[key]); }
  }
  if (updates.tags !== undefined) { fields.push('tags = ?'); values.push(JSON.stringify(updates.tags)); }
  if (fields.length === 0) return;
  values.push(id);
  db.prepare(`UPDATE projects SET ${fields.join(', ')} WHERE id = ?`).run(...values);
}

export function deleteProject(id) {
  db.prepare('DELETE FROM project_prints WHERE project_id = ?').run(id);
  db.prepare('DELETE FROM projects WHERE id = ?').run(id);
}

export function getProjectPrints(projectId) {
  return db.prepare('SELECT * FROM project_prints WHERE project_id = ? ORDER BY added_at DESC').all(projectId);
}

export function addProjectPrint(pp) {
  const result = db.prepare('INSERT INTO project_prints (project_id, print_history_id, queue_item_id, filename, status, notes) VALUES (?, ?, ?, ?, ?, ?)').run(
    pp.project_id, pp.print_history_id || null, pp.queue_item_id || null, pp.filename || null, pp.status || 'pending', pp.notes || null);
  return Number(result.lastInsertRowid);
}

export function updateProjectPrint(id, updates) {
  const fields = [];
  const values = [];
  for (const key of ['status', 'notes', 'print_history_id']) {
    if (updates[key] !== undefined) { fields.push(`${key} = ?`); values.push(updates[key]); }
  }
  if (fields.length === 0) return;
  values.push(id);
  db.prepare(`UPDATE project_prints SET ${fields.join(', ')} WHERE id = ?`).run(...values);
}

export function deleteProjectPrint(id) {
  db.prepare('DELETE FROM project_prints WHERE id = ?').run(id);
}

// ---- Export Templates ----

export function getExportTemplates(entityType = null) {
  if (entityType) return db.prepare('SELECT * FROM export_templates WHERE entity_type = ? ORDER BY name').all(entityType);
  return db.prepare('SELECT * FROM export_templates ORDER BY entity_type, name').all();
}

export function getExportTemplate(id) {
  return db.prepare('SELECT * FROM export_templates WHERE id = ?').get(id) || null;
}

export function addExportTemplate(t) {
  const result = db.prepare('INSERT INTO export_templates (name, entity_type, format, columns, filters) VALUES (?, ?, ?, ?, ?)').run(
    t.name, t.entity_type, t.format || 'csv', JSON.stringify(t.columns), t.filters ? JSON.stringify(t.filters) : null);
  return Number(result.lastInsertRowid);
}

export function deleteExportTemplate(id) {
  db.prepare('DELETE FROM export_templates WHERE id = ?').run(id);
}

// ---- User Quotas ----

export function getUserQuota(userId) {
  return db.prepare('SELECT * FROM user_quotas WHERE user_id = ?').get(userId) || null;
}

export function upsertUserQuota(userId, updates) {
  const existing = db.prepare('SELECT id FROM user_quotas WHERE user_id = ?').get(userId);
  if (existing) {
    const fields = [];
    const values = [];
    for (const key of ['balance', 'print_quota_daily', 'print_quota_monthly', 'filament_quota_g', 'prints_today', 'prints_this_month', 'filament_used_g', 'last_reset_daily', 'last_reset_monthly']) {
      if (updates[key] !== undefined) { fields.push(`${key} = ?`); values.push(updates[key]); }
    }
    if (fields.length === 0) return existing.id;
    values.push(existing.id);
    db.prepare(`UPDATE user_quotas SET ${fields.join(', ')} WHERE id = ?`).run(...values);
    return existing.id;
  }
  const result = db.prepare('INSERT INTO user_quotas (user_id, balance, print_quota_daily, print_quota_monthly, filament_quota_g) VALUES (?, ?, ?, ?, ?)').run(
    userId, updates.balance || 0, updates.print_quota_daily || 0, updates.print_quota_monthly || 0, updates.filament_quota_g || 0);
  return Number(result.lastInsertRowid);
}

export function addUserTransaction(t) {
  const result = db.prepare('INSERT INTO user_transactions (user_id, type, amount, description, print_history_id) VALUES (?, ?, ?, ?, ?)').run(
    t.user_id, t.type, t.amount, t.description || null, t.print_history_id || null);
  // Update balance
  if (t.type === 'credit') {
    db.prepare('UPDATE user_quotas SET balance = balance + ? WHERE user_id = ?').run(Math.abs(t.amount), t.user_id);
  } else if (t.type === 'debit') {
    db.prepare('UPDATE user_quotas SET balance = balance - ? WHERE user_id = ?').run(Math.abs(t.amount), t.user_id);
  }
  return Number(result.lastInsertRowid);
}

export function getUserTransactions(userId, limit = 50) {
  return db.prepare('SELECT * FROM user_transactions WHERE user_id = ? ORDER BY created_at DESC LIMIT ?').all(userId, limit);
}

// ---- Failure Detection ----

export function getFailureDetections(printerId = null, limit = 50) {
  if (printerId) return db.prepare('SELECT * FROM failure_detections WHERE printer_id = ? ORDER BY detected_at DESC LIMIT ?').all(printerId, limit);
  return db.prepare('SELECT * FROM failure_detections ORDER BY detected_at DESC LIMIT ?').all(limit);
}

export function getFailureDetection(id) {
  return db.prepare('SELECT * FROM failure_detections WHERE id = ?').get(id) || null;
}

export function addFailureDetection(d) {
  const result = db.prepare('INSERT INTO failure_detections (printer_id, print_history_id, detection_type, confidence, frame_path, action_taken, details) VALUES (?, ?, ?, ?, ?, ?, ?)').run(
    d.printer_id, d.print_history_id || null, d.detection_type, d.confidence || null, d.frame_path || null, d.action_taken || null, d.details ? JSON.stringify(d.details) : null);
  return Number(result.lastInsertRowid);
}

export function acknowledgeFailureDetection(id) {
  db.prepare('UPDATE failure_detections SET acknowledged = 1 WHERE id = ?').run(id);
}

export function deleteFailureDetection(id) {
  db.prepare('DELETE FROM failure_detections WHERE id = ?').run(id);
}

// ---- Price History ----

export function getPriceHistory(profileId, limit = 100) {
  return db.prepare('SELECT * FROM price_history WHERE filament_profile_id = ? ORDER BY recorded_at DESC LIMIT ?').all(profileId, limit);
}

export function addPriceEntry(p) {
  const result = db.prepare('INSERT INTO price_history (filament_profile_id, vendor_id, price, currency, source) VALUES (?, ?, ?, ?, ?)').run(
    p.filament_profile_id, p.vendor_id || null, p.price, p.currency || 'USD', p.source || 'manual');
  return Number(result.lastInsertRowid);
}

export function getLowestPrice(profileId) {
  return db.prepare('SELECT MIN(price) as min_price, currency FROM price_history WHERE filament_profile_id = ?').get(profileId) || null;
}

export function getPriceStats(profileId) {
  return db.prepare('SELECT MIN(price) as min_price, MAX(price) as max_price, AVG(price) as avg_price, COUNT(*) as entries FROM price_history WHERE filament_profile_id = ?').get(profileId) || null;
}

// ---- Price Alerts ----

export function getPriceAlerts() {
  return db.prepare(`SELECT pa.*, fp.name AS profile_name, fp.material, fp.color_hex, v.name AS vendor_name,
    (SELECT MIN(ph.price) FROM price_history ph WHERE ph.filament_profile_id = pa.filament_profile_id) AS lowest_price,
    (SELECT ph.price FROM price_history ph WHERE ph.filament_profile_id = pa.filament_profile_id ORDER BY ph.recorded_at DESC LIMIT 1) AS latest_price
    FROM price_alerts pa
    LEFT JOIN filament_profiles fp ON pa.filament_profile_id = fp.id
    LEFT JOIN vendors v ON fp.vendor_id = v.id
    ORDER BY pa.created_at DESC`).all();
}

export function getPriceAlert(id) {
  return db.prepare('SELECT * FROM price_alerts WHERE id = ?').get(id) || null;
}

export function addPriceAlert(a) {
  const result = db.prepare('INSERT INTO price_alerts (filament_profile_id, target_price, currency, source_url, notify) VALUES (?, ?, ?, ?, ?)').run(
    a.filament_profile_id, a.target_price, a.currency || 'USD', a.source_url || null, a.notify !== false ? 1 : 0);
  return Number(result.lastInsertRowid);
}

export function updatePriceAlert(id, fields) {
  const allowed = ['target_price', 'currency', 'source_url', 'notify', 'triggered'];
  const sets = [];
  const vals = [];
  for (const key of allowed) {
    if (fields[key] !== undefined) {
      sets.push(`${key} = ?`);
      vals.push(fields[key]);
    }
  }
  if (sets.length === 0) return;
  vals.push(id);
  db.prepare(`UPDATE price_alerts SET ${sets.join(', ')} WHERE id = ?`).run(...vals);
}

export function deletePriceAlert(id) {
  db.prepare('DELETE FROM price_alerts WHERE id = ?').run(id);
}

export function checkPriceAlerts() {
  // Find alerts where the latest price is at or below target
  return db.prepare(`SELECT pa.*, fp.name AS profile_name, fp.material, v.name AS vendor_name,
    (SELECT ph.price FROM price_history ph WHERE ph.filament_profile_id = pa.filament_profile_id ORDER BY ph.recorded_at DESC LIMIT 1) AS latest_price
    FROM price_alerts pa
    LEFT JOIN filament_profiles fp ON pa.filament_profile_id = fp.id
    LEFT JOIN vendors v ON fp.vendor_id = v.id
    WHERE pa.notify = 1 AND pa.triggered = 0
    AND (SELECT ph.price FROM price_history ph WHERE ph.filament_profile_id = pa.filament_profile_id ORDER BY ph.recorded_at DESC LIMIT 1) <= pa.target_price`).all();
}

export function triggerPriceAlert(id) {
  db.prepare("UPDATE price_alerts SET triggered = 1, triggered_at = datetime('now') WHERE id = ?").run(id);
}

// ---- Build Plates ----

export function getBuildPlates(printerId = null) {
  if (printerId) return db.prepare('SELECT * FROM build_plates WHERE printer_id = ? ORDER BY installed_at DESC').all(printerId);
  return db.prepare('SELECT * FROM build_plates ORDER BY printer_id, installed_at DESC').all();
}

export function getBuildPlate(id) {
  return db.prepare('SELECT * FROM build_plates WHERE id = ?').get(id) || null;
}

export function addBuildPlate(bp) {
  const result = db.prepare('INSERT INTO build_plates (printer_id, name, type, material, surface_condition, notes) VALUES (?, ?, ?, ?, ?, ?)').run(
    bp.printer_id, bp.name, bp.type || 'smooth_pei', bp.material || null, bp.surface_condition || 'good', bp.notes || null);
  return Number(result.lastInsertRowid);
}

export function updateBuildPlate(id, updates) {
  const fields = [];
  const values = [];
  for (const key of ['name', 'type', 'material', 'surface_condition', 'print_count', 'notes', 'active']) {
    if (updates[key] !== undefined) { fields.push(`${key} = ?`); values.push(updates[key]); }
  }
  if (fields.length === 0) return;
  values.push(id);
  db.prepare(`UPDATE build_plates SET ${fields.join(', ')} WHERE id = ?`).run(...values);
}

export function deleteBuildPlate(id) {
  db.prepare('DELETE FROM build_plates WHERE id = ?').run(id);
}

export function incrementBuildPlatePrintCount(printerId) {
  db.prepare('UPDATE build_plates SET print_count = print_count + 1 WHERE printer_id = ? AND active = 1').run(printerId);
}

// ---- Dryer Models ----

export function getDryerModels() {
  return db.prepare('SELECT * FROM dryer_models ORDER BY brand, model').all();
}

export function getDryerModel(id) {
  return db.prepare('SELECT * FROM dryer_models WHERE id = ?').get(id) || null;
}

export function addDryerModel(d) {
  const result = db.prepare('INSERT INTO dryer_models (brand, model, max_temp, tray_count, max_spool_diameter, has_humidity_sensor, wattage, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?)').run(
    d.brand, d.model, d.max_temp || null, d.tray_count || 1, d.max_spool_diameter || null, d.has_humidity_sensor ? 1 : 0, d.wattage || null, d.notes || null);
  return Number(result.lastInsertRowid);
}

export function updateDryerModel(id, updates) {
  const fields = [];
  const values = [];
  for (const key of ['brand', 'model', 'max_temp', 'tray_count', 'max_spool_diameter', 'has_humidity_sensor', 'wattage', 'notes']) {
    if (updates[key] !== undefined) { fields.push(`${key} = ?`); values.push(updates[key]); }
  }
  if (fields.length === 0) return;
  values.push(id);
  db.prepare(`UPDATE dryer_models SET ${fields.join(', ')} WHERE id = ?`).run(...values);
}

export function deleteDryerModel(id) {
  db.prepare('DELETE FROM dryer_models WHERE id = ?').run(id);
}

// ---- Storage Conditions ----

export function getStorageConditions(spoolId) {
  return db.prepare('SELECT * FROM storage_conditions WHERE spool_id = ? ORDER BY recorded_at DESC').all(spoolId);
}

export function getLatestStorageCondition(spoolId) {
  return db.prepare('SELECT * FROM storage_conditions WHERE spool_id = ? ORDER BY recorded_at DESC LIMIT 1').get(spoolId) || null;
}

export function addStorageCondition(s) {
  const result = db.prepare('INSERT INTO storage_conditions (spool_id, humidity, temperature, container_type, desiccant_type, desiccant_replaced, sealed, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?)').run(
    s.spool_id, s.humidity || null, s.temperature || null, s.container_type || null, s.desiccant_type || null, s.desiccant_replaced || null, s.sealed ? 1 : 0, s.notes || null);
  return Number(result.lastInsertRowid);
}

export function deleteStorageCondition(id) {
  db.prepare('DELETE FROM storage_conditions WHERE id = ?').run(id);
}

// ---- Courses ----

export function getCourses(category = null) {
  if (category) return db.prepare('SELECT * FROM courses WHERE category = ? ORDER BY difficulty, title').all(category);
  return db.prepare('SELECT * FROM courses ORDER BY category, difficulty, title').all();
}

export function getCourse(id) {
  return db.prepare('SELECT * FROM courses WHERE id = ?').get(id) || null;
}

export function addCourse(c) {
  const result = db.prepare('INSERT INTO courses (title, description, category, difficulty, content, steps, estimated_minutes) VALUES (?, ?, ?, ?, ?, ?, ?)').run(
    c.title, c.description || null, c.category || 'general', c.difficulty || 1, c.content || null, c.steps ? JSON.stringify(c.steps) : null, c.estimated_minutes || null);
  return Number(result.lastInsertRowid);
}

export function updateCourse(id, updates) {
  const fields = [];
  const values = [];
  for (const key of ['title', 'description', 'category', 'difficulty', 'content', 'estimated_minutes']) {
    if (updates[key] !== undefined) { fields.push(`${key} = ?`); values.push(updates[key]); }
  }
  if (updates.steps !== undefined) { fields.push('steps = ?'); values.push(JSON.stringify(updates.steps)); }
  if (fields.length === 0) return;
  values.push(id);
  db.prepare(`UPDATE courses SET ${fields.join(', ')} WHERE id = ?`).run(...values);
}

export function deleteCourse(id) {
  db.prepare('DELETE FROM course_progress WHERE course_id = ?').run(id);
  db.prepare('DELETE FROM courses WHERE id = ?').run(id);
}

export function getCourseProgress(courseId, userId) {
  return db.prepare('SELECT * FROM course_progress WHERE course_id = ? AND user_id = ?').get(courseId, userId) || null;
}

export function upsertCourseProgress(courseId, userId, updates) {
  const existing = db.prepare('SELECT id FROM course_progress WHERE course_id = ? AND user_id = ?').get(courseId, userId);
  if (existing) {
    const fields = [];
    const values = [];
    for (const key of ['status', 'current_step', 'completed_at', 'completed_steps']) {
      if (updates[key] !== undefined) { fields.push(`${key} = ?`); values.push(updates[key]); }
    }
    if (fields.length === 0) return;
    values.push(existing.id);
    db.prepare(`UPDATE course_progress SET ${fields.join(', ')} WHERE id = ?`).run(...values);
  } else {
    db.prepare('INSERT INTO course_progress (course_id, user_id, status, current_step, completed_steps) VALUES (?, ?, ?, ?, ?)').run(
      courseId, userId, updates.status || 'in_progress', updates.current_step || 0, updates.completed_steps || '[]');
  }
}

export function getUserCourseProgress(userId) {
  return db.prepare('SELECT cp.*, c.title, c.category, c.difficulty FROM course_progress cp JOIN courses c ON cp.course_id = c.id WHERE cp.user_id = ? ORDER BY cp.started_at DESC').all(userId);
}

export function getAllCoursesWithProgress(userId) {
  return db.prepare(`
    SELECT c.*, cp.status AS progress_status, cp.current_step, cp.completed_steps,
           cp.completed_at, cp.started_at AS progress_started_at
    FROM courses c
    LEFT JOIN course_progress cp ON cp.course_id = c.id AND cp.user_id = ?
    ORDER BY c.category, c.difficulty, c.title
  `).all(userId);
}

// ---- Hex Color Search (across inventory) ----

export function searchSpoolsByColor(hex, tolerance = 30) {
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  const all = db.prepare("SELECT s.*, fp.name as profile_name, fp.material, v.name as vendor_name FROM spools s LEFT JOIN filament_profiles fp ON s.filament_profile_id = fp.id LEFT JOIN vendors v ON fp.vendor_id = v.id WHERE s.color_hex IS NOT NULL AND s.color_hex != ''").all();
  return all.filter(s => {
    const ch = s.color_hex.replace('#', '');
    if (ch.length < 6) return false;
    const sr = parseInt(ch.substring(0, 2), 16);
    const sg = parseInt(ch.substring(2, 4), 16);
    const sb = parseInt(ch.substring(4, 6), 16);
    return Math.sqrt((r - sr) ** 2 + (g - sg) ** 2 + (b - sb) ** 2) <= tolerance;
  }).map(s => {
    const ch = s.color_hex.replace('#', '');
    const sr = parseInt(ch.substring(0, 2), 16);
    const sg = parseInt(ch.substring(2, 4), 16);
    const sb = parseInt(ch.substring(4, 6), 16);
    return { ...s, color_distance: Math.sqrt((r - sr) ** 2 + (g - sg) ** 2 + (b - sb) ** 2) };
  }).sort((a, b) => a.color_distance - b.color_distance);
}

// ---- Auto-Generated Spool Names ----

export function generateSpoolName(profileId) {
  const profile = db.prepare('SELECT fp.*, v.name as vendor_name FROM filament_profiles fp LEFT JOIN vendors v ON fp.vendor_id = v.id WHERE fp.id = ?').get(profileId);
  if (!profile) return 'Spool';
  const count = db.prepare('SELECT COUNT(*) as cnt FROM spools WHERE filament_profile_id = ?').get(profileId).cnt;
  const vendor = profile.vendor_name || 'Unknown';
  const material = profile.material || 'PLA';
  const name = profile.name || '';
  return `${vendor} ${material}${name ? ' ' + name : ''} #${count + 1}`;
}

// ---- E-Commerce License ----

export function getEcomLicense() {
  return db.prepare('SELECT * FROM ecom_license WHERE id = 1').get() || null;
}

export function setEcomLicense(data) {
  const row = getEcomLicense();
  if (!row) return;
  const fields = [];
  const values = [];
  for (const key of ['license_key', 'geektech_email', 'geektech_api_url', 'instance_id', 'status', 'holder_name', 'plan', 'features', 'expires_at', 'last_validated', 'cached_response', 'last_report_at']) {
    if (data[key] !== undefined) { fields.push(`${key} = ?`); values.push(data[key]); }
  }
  if (fields.length === 0) return;
  values.push(1);
  db.prepare(`UPDATE ecom_license SET ${fields.join(', ')} WHERE id = ?`).run(...values);
}

export function getEcomFees(reported = null) {
  if (reported !== null) {
    return db.prepare('SELECT * FROM ecom_fees WHERE reported = ? ORDER BY created_at DESC').all(reported);
  }
  return db.prepare('SELECT * FROM ecom_fees ORDER BY created_at DESC').all();
}

export function addEcomFee(fee) {
  const result = db.prepare('INSERT INTO ecom_fees (order_id, ecom_config_id, order_total, fee_pct, fee_amount, currency) VALUES (?, ?, ?, ?, ?, ?)').run(
    fee.order_id || null, fee.ecom_config_id || null, fee.order_total, fee.fee_pct || 5.0, fee.fee_amount, fee.currency || 'NOK'
  );
  return Number(result.lastInsertRowid);
}

export function markFeesReported(feeIds) {
  if (!feeIds.length) return;
  const placeholders = feeIds.map(() => '?').join(',');
  db.prepare(`UPDATE ecom_fees SET reported = 1, reported_at = datetime('now') WHERE id IN (${placeholders})`).run(...feeIds);
}

export function getUnreportedFees() {
  return db.prepare('SELECT ef.*, eo.platform_order_id, ec.platform FROM ecom_fees ef LEFT JOIN ecommerce_orders eo ON ef.order_id = eo.id LEFT JOIN ecommerce_configs ec ON ef.ecom_config_id = ec.id WHERE ef.reported = 0 ORDER BY ef.created_at ASC').all();
}

export function getEcomFeesSummary(from = null, to = null) {
  let sql = 'SELECT COUNT(*) as order_count, COALESCE(SUM(fee_amount), 0) as total_fees, COALESCE(SUM(order_total), 0) as total_revenue, currency FROM ecom_fees';
  const params = [];
  if (from && to) {
    sql += ' WHERE created_at >= ? AND created_at <= ?';
    params.push(from, to);
  } else if (from) {
    sql += ' WHERE created_at >= ?';
    params.push(from);
  }
  sql += ' GROUP BY currency';
  return db.prepare(sql).all(...params);
}

export function getEcomFeesTotal() {
  return db.prepare('SELECT COUNT(*) as pending_count, COALESCE(SUM(fee_amount), 0) as pending_total FROM ecom_fees WHERE reported = 0').get();
}

// ---- Knowledge Base CRUD ----

export function getKbPrinters() { return db.prepare('SELECT * FROM kb_printers ORDER BY release_year DESC, model').all(); }
export function getKbPrinter(id) { return db.prepare('SELECT * FROM kb_printers WHERE id = ?').get(id); }
export function addKbPrinter(p) {
  const r = db.prepare('INSERT INTO kb_printers (model,full_name,image_url,release_year,build_volume,max_speed,nozzle_type,nozzle_diameter_default,supported_nozzle_sizes,has_ams,has_enclosure,has_lidar,has_camera,has_aux_fan,heated_bed_max,nozzle_temp_max,supported_filaments,connectivity,weight_kg,price_usd,pros,cons,tips,specs_json,wiki_url) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)').run(
    p.model,p.full_name,p.image_url||null,p.release_year||null,p.build_volume||null,p.max_speed||null,p.nozzle_type||'proprietary',p.nozzle_diameter_default||0.4,p.supported_nozzle_sizes||'[0.2,0.4,0.6,0.8]',p.has_ams?1:0,p.has_enclosure?1:0,p.has_lidar?1:0,p.has_camera?1:0,p.has_aux_fan?1:0,p.heated_bed_max||null,p.nozzle_temp_max||null,p.supported_filaments||'[]',p.connectivity||'["wifi"]',p.weight_kg||null,p.price_usd||null,p.pros||'[]',p.cons||'[]',p.tips||null,p.specs_json||'{}',p.wiki_url||null
  );
  return Number(r.lastInsertRowid);
}
export function updateKbPrinter(id, p) {
  const fields = []; const vals = [];
  for (const k of ['model','full_name','image_url','release_year','build_volume','max_speed','nozzle_type','nozzle_diameter_default','supported_nozzle_sizes','has_ams','has_enclosure','has_lidar','has_camera','has_aux_fan','heated_bed_max','nozzle_temp_max','supported_filaments','connectivity','weight_kg','price_usd','pros','cons','tips','specs_json','wiki_url']) {
    if (p[k] !== undefined) { fields.push(`${k} = ?`); vals.push(p[k]); }
  }
  if (!fields.length) return;
  fields.push("updated_at = datetime('now')");
  vals.push(id);
  db.prepare(`UPDATE kb_printers SET ${fields.join(', ')} WHERE id = ?`).run(...vals);
}
export function deleteKbPrinter(id) { db.prepare('DELETE FROM kb_printers WHERE id = ?').run(id); db.prepare("DELETE FROM kb_tags WHERE entity_type = 'printer' AND entity_id = ?").run(id); }

export function getKbAccessories(category) {
  if (category) return db.prepare('SELECT * FROM kb_accessories WHERE category = ? ORDER BY name').all(category);
  return db.prepare('SELECT * FROM kb_accessories ORDER BY category, name').all();
}
export function getKbAccessory(id) { return db.prepare('SELECT * FROM kb_accessories WHERE id = ?').get(id); }
export function addKbAccessory(a) {
  const r = db.prepare('INSERT INTO kb_accessories (name,category,brand,model,image_url,compatible_printers,description,price_usd,purchase_url,tips,specs_json,rating) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)').run(
    a.name,a.category||'other',a.brand||'Bambu Lab',a.model||null,a.image_url||null,a.compatible_printers||'[]',a.description||null,a.price_usd||null,a.purchase_url||null,a.tips||null,a.specs_json||'{}',a.rating||null
  );
  return Number(r.lastInsertRowid);
}
export function updateKbAccessory(id, a) {
  const fields = []; const vals = [];
  for (const k of ['name','category','brand','model','image_url','compatible_printers','description','price_usd','purchase_url','tips','specs_json','rating']) {
    if (a[k] !== undefined) { fields.push(`${k} = ?`); vals.push(a[k]); }
  }
  if (!fields.length) return;
  fields.push("updated_at = datetime('now')");
  vals.push(id);
  db.prepare(`UPDATE kb_accessories SET ${fields.join(', ')} WHERE id = ?`).run(...vals);
}
export function deleteKbAccessory(id) { db.prepare('DELETE FROM kb_accessories WHERE id = ?').run(id); db.prepare("DELETE FROM kb_tags WHERE entity_type = 'accessory' AND entity_id = ?").run(id); }

export function getKbFilaments(material, brand) {
  let sql = 'SELECT * FROM kb_filaments'; const params = []; const where = [];
  if (material) { where.push('material = ?'); params.push(material); }
  if (brand) { where.push('brand = ?'); params.push(brand); }
  if (where.length) sql += ' WHERE ' + where.join(' AND ');
  sql += ' ORDER BY material, brand, variant';
  return db.prepare(sql).all(...params);
}
export function getKbFilament(id) { return db.prepare('SELECT * FROM kb_filaments WHERE id = ?').get(id); }
export function addKbFilament(f) {
  const r = db.prepare('INSERT INTO kb_filaments (material,brand,variant,category,difficulty,nozzle_temp_min,nozzle_temp_max,bed_temp_min,bed_temp_max,chamber_temp,fan_speed_min,fan_speed_max,enclosure_required,nozzle_recommendation,abrasive,moisture_sensitivity,strength,flexibility,heat_resistance,layer_adhesion,food_safe,uv_resistant,tips_print,tips_storage,tips_post,compatible_printers,profile_json,wiki_url) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)').run(
    f.material,f.brand||null,f.variant||null,f.category||'standard',f.difficulty||1,f.nozzle_temp_min||null,f.nozzle_temp_max||null,f.bed_temp_min||null,f.bed_temp_max||null,f.chamber_temp||null,f.fan_speed_min||null,f.fan_speed_max||null,f.enclosure_required?1:0,f.nozzle_recommendation||'brass',f.abrasive?1:0,f.moisture_sensitivity||3,f.strength||3,f.flexibility||1,f.heat_resistance||3,f.layer_adhesion||3,f.food_safe?1:0,f.uv_resistant?1:0,f.tips_print||null,f.tips_storage||null,f.tips_post||null,f.compatible_printers||'[]',f.profile_json||null,f.wiki_url||null
  );
  return Number(r.lastInsertRowid);
}
export function updateKbFilament(id, f) {
  const fields = []; const vals = [];
  for (const k of ['material','brand','variant','category','difficulty','nozzle_temp_min','nozzle_temp_max','bed_temp_min','bed_temp_max','chamber_temp','fan_speed_min','fan_speed_max','enclosure_required','nozzle_recommendation','abrasive','moisture_sensitivity','strength','flexibility','heat_resistance','layer_adhesion','food_safe','uv_resistant','tips_print','tips_storage','tips_post','compatible_printers','profile_json','wiki_url']) {
    if (f[k] !== undefined) { fields.push(`${k} = ?`); vals.push(f[k]); }
  }
  if (!fields.length) return;
  fields.push("updated_at = datetime('now')");
  vals.push(id);
  db.prepare(`UPDATE kb_filaments SET ${fields.join(', ')} WHERE id = ?`).run(...vals);
}
export function deleteKbFilament(id) { db.prepare('DELETE FROM kb_filaments WHERE id = ?').run(id); db.prepare("DELETE FROM kb_tags WHERE entity_type = 'filament' AND entity_id = ?").run(id); }

export function getKbProfiles(printer, material) {
  let sql = 'SELECT * FROM kb_profiles'; const params = []; const where = [];
  if (printer) { where.push('printer_model = ?'); params.push(printer); }
  if (material) { where.push('filament_material = ?'); params.push(material); }
  if (where.length) sql += ' WHERE ' + where.join(' AND ');
  sql += ' ORDER BY printer_model, filament_material, name';
  return db.prepare(sql).all(...params);
}
export function getKbProfile(id) { return db.prepare('SELECT * FROM kb_profiles WHERE id = ?').get(id); }
export function addKbProfile(p) {
  const r = db.prepare('INSERT INTO kb_profiles (name,printer_model,filament_material,filament_brand,nozzle_size,layer_height,print_speed,infill_pct,wall_count,top_layers,bottom_layers,retraction_distance,retraction_speed,description,tips,settings_json,source_url,author,difficulty) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)').run(
    p.name,p.printer_model||null,p.filament_material||null,p.filament_brand||null,p.nozzle_size||0.4,p.layer_height||null,p.print_speed||null,p.infill_pct||null,p.wall_count||null,p.top_layers||null,p.bottom_layers||null,p.retraction_distance||null,p.retraction_speed||null,p.description||null,p.tips||null,p.settings_json||'{}',p.source_url||null,p.author||null,p.difficulty||1
  );
  return Number(r.lastInsertRowid);
}
export function updateKbProfile(id, p) {
  const fields = []; const vals = [];
  for (const k of ['name','printer_model','filament_material','filament_brand','nozzle_size','layer_height','print_speed','infill_pct','wall_count','top_layers','bottom_layers','retraction_distance','retraction_speed','description','tips','settings_json','source_url','author','difficulty']) {
    if (p[k] !== undefined) { fields.push(`${k} = ?`); vals.push(p[k]); }
  }
  if (!fields.length) return;
  fields.push("updated_at = datetime('now')");
  vals.push(id);
  db.prepare(`UPDATE kb_profiles SET ${fields.join(', ')} WHERE id = ?`).run(...vals);
}
export function deleteKbProfile(id) { db.prepare('DELETE FROM kb_profiles WHERE id = ?').run(id); db.prepare("DELETE FROM kb_tags WHERE entity_type = 'profile' AND entity_id = ?").run(id); }

export function searchKb(query) {
  const q = `%${query}%`;
  const printers = db.prepare("SELECT id, model AS title, full_name AS subtitle, 'printer' AS type FROM kb_printers WHERE model LIKE ? OR full_name LIKE ? OR tips LIKE ?").all(q,q,q);
  const accessories = db.prepare("SELECT id, name AS title, category AS subtitle, 'accessory' AS type FROM kb_accessories WHERE name LIKE ? OR description LIKE ? OR tips LIKE ?").all(q,q,q);
  const filaments = db.prepare("SELECT id, (brand || ' ' || material || COALESCE(' ' || variant, '')) AS title, category AS subtitle, 'filament' AS type FROM kb_filaments WHERE material LIKE ? OR brand LIKE ? OR variant LIKE ? OR tips_print LIKE ?").all(q,q,q,q);
  const profiles = db.prepare("SELECT id, name AS title, (printer_model || ' / ' || filament_material) AS subtitle, 'profile' AS type FROM kb_profiles WHERE name LIKE ? OR description LIKE ? OR tips LIKE ? OR printer_model LIKE ? OR filament_material LIKE ?").all(q,q,q,q,q);
  return [...printers, ...accessories, ...filaments, ...profiles];
}

export function getKbStats() {
  return {
    printers: db.prepare('SELECT COUNT(*) as count FROM kb_printers').get().count,
    accessories: db.prepare('SELECT COUNT(*) as count FROM kb_accessories').get().count,
    filaments: db.prepare('SELECT COUNT(*) as count FROM kb_filaments').get().count,
    profiles: db.prepare('SELECT COUNT(*) as count FROM kb_profiles').get().count
  };
}

export function getKbTags(entityType, entityId) { return db.prepare('SELECT * FROM kb_tags WHERE entity_type = ? AND entity_id = ?').all(entityType, entityId); }
export function addKbTag(entityType, entityId, tag) {
  const r = db.prepare('INSERT OR IGNORE INTO kb_tags (entity_type, entity_id, tag) VALUES (?, ?, ?)').run(entityType, entityId, tag);
  return Number(r.lastInsertRowid);
}
export function deleteKbTag(id) { db.prepare('DELETE FROM kb_tags WHERE id = ?').run(id); }

export function seedKbData() {
  db.exec('DELETE FROM kb_tags');
  db.exec('DELETE FROM kb_profiles');
  db.exec('DELETE FROM kb_filaments');
  db.exec('DELETE FROM kb_accessories');
  db.exec('DELETE FROM kb_printers');
  _mig055_knowledge_base();
}

// ---- Bed Mesh Data ----
export function addBedMesh(printerId, meshData, stats) {
  const r = db.prepare(`INSERT INTO bed_mesh_data (printer_id, mesh_data, mesh_rows, mesh_cols, z_min, z_max, z_mean, z_std_dev, source)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
    printerId, JSON.stringify(meshData), stats.rows, stats.cols, stats.zMin, stats.zMax, stats.zMean, stats.zStdDev, stats.source || 'auto'
  );
  return Number(r.lastInsertRowid);
}
export function getBedMeshHistory(printerId, limit = 10) {
  return db.prepare('SELECT * FROM bed_mesh_data WHERE printer_id = ? ORDER BY captured_at DESC LIMIT ?').all(printerId, limit);
}
export function getLatestBedMesh(printerId) {
  return db.prepare('SELECT * FROM bed_mesh_data WHERE printer_id = ? ORDER BY captured_at DESC LIMIT 1').get(printerId) || null;
}
export function deleteBedMesh(id) { db.prepare('DELETE FROM bed_mesh_data WHERE id = ?').run(id); }

// ---- Filament Changes ----
export function createFilamentChange(printerId, fromSpoolId, toSpoolId, amsUnit, amsTray) {
  const r = db.prepare(`INSERT INTO filament_changes (printer_id, from_spool_id, to_spool_id, ams_unit, ams_tray, status, current_step)
    VALUES (?, ?, ?, ?, ?, 'in_progress', 'pause')`).run(printerId, fromSpoolId || null, toSpoolId || null, amsUnit ?? null, amsTray ?? null);
  return Number(r.lastInsertRowid);
}
export function updateFilamentChange(id, opts) {
  const fields = []; const values = [];
  for (const key of ['status', 'current_step', 'error_message', 'completed_at']) {
    if (opts[key] !== undefined) { fields.push(`${key} = ?`); values.push(opts[key]); }
  }
  if (fields.length === 0) return;
  values.push(id);
  db.prepare(`UPDATE filament_changes SET ${fields.join(', ')} WHERE id = ?`).run(...values);
}
export function getActiveFilamentChange(printerId) {
  return db.prepare("SELECT * FROM filament_changes WHERE printer_id = ? AND status = 'in_progress' ORDER BY started_at DESC LIMIT 1").get(printerId) || null;
}
export function getFilamentChangeHistory(printerId, limit = 20) {
  return db.prepare('SELECT * FROM filament_changes WHERE printer_id = ? ORDER BY started_at DESC LIMIT ?').all(printerId, limit);
}

// ---- Community Sharing ----
export function shareFilamentProfile(profileId, sharedBy) {
  const profile = db.prepare(`SELECT fp.*, v.name as vendor_name FROM filament_profiles fp LEFT JOIN vendors v ON fp.vendor_id = v.id WHERE fp.id = ?`).get(profileId);
  if (!profile) return null;
  const existing = db.prepare('SELECT id FROM community_filaments WHERE shared_from_profile_id = ?').get(profileId);
  if (existing) return Number(existing.id);
  const r = db.prepare(`INSERT INTO community_filaments
    (manufacturer, name, material, density, diameter, weight, extruder_temp, bed_temp, color_name, color_hex,
     pressure_advance_k, max_volumetric_speed, flow_ratio, retraction_distance, retraction_speed,
     source, shared_by, shared_from_profile_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'user_shared', ?, ?)`).run(
    profile.vendor_name || 'Unknown', profile.name, profile.material,
    profile.density, profile.diameter, profile.spool_weight_g,
    profile.nozzle_temp_min, profile.bed_temp_min,
    profile.color_name, profile.color_hex,
    profile.pressure_advance_k, profile.max_volumetric_speed,
    profile.flow_ratio, profile.retraction_distance, profile.retraction_speed,
    sharedBy || 'anonymous', profileId
  );
  return Number(r.lastInsertRowid);
}
export function rateCommunityFilament(filamentId, userId, rating, comment) {
  db.prepare(`INSERT INTO community_ratings (community_filament_id, user_id, rating, comment)
    VALUES (?, ?, ?, ?) ON CONFLICT(community_filament_id, user_id) DO UPDATE SET rating = excluded.rating, comment = excluded.comment, created_at = datetime('now')`)
    .run(filamentId, userId || 'default', rating, comment || null);
  const agg = db.prepare('SELECT SUM(rating) as s, COUNT(*) as c FROM community_ratings WHERE community_filament_id = ?').get(filamentId);
  db.prepare('UPDATE community_filaments SET rating_sum = ?, rating_count = ? WHERE id = ?').run(agg.s || 0, agg.c || 0, filamentId);
  return { rating_sum: agg.s || 0, rating_count: agg.c || 0, average: agg.c > 0 ? (agg.s / agg.c).toFixed(1) : null };
}
export function getCommunityFilamentRatings(filamentId) {
  return db.prepare('SELECT * FROM community_ratings WHERE community_filament_id = ? ORDER BY created_at DESC').all(filamentId);
}
export function importCommunityToInventory(communityId, vendorId) {
  const cf = db.prepare('SELECT * FROM community_filaments WHERE id = ?').get(communityId);
  if (!cf) return null;
  const r = db.prepare(`INSERT INTO filament_profiles
    (vendor_id, name, material, color_name, color_hex, density, diameter, spool_weight_g,
     nozzle_temp_min, bed_temp_min, pressure_advance_k, max_volumetric_speed,
     flow_ratio, retraction_distance, retraction_speed)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
    vendorId || null, cf.name || cf.material, cf.material,
    cf.color_name, cf.color_hex, cf.density, cf.diameter, cf.weight,
    cf.extruder_temp, cf.bed_temp, cf.pressure_advance_k,
    cf.max_volumetric_speed, cf.flow_ratio, cf.retraction_distance, cf.retraction_speed
  );
  return Number(r.lastInsertRowid);
}
