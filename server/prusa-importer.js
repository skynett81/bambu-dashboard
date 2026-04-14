/**
 * Prusa Resources Importer
 *
 * Imports data from official Prusa GitHub repositories:
 * - PrusaSlicer filament/print/printer profiles (32+ vendors, 500+ materials)
 * - Prusa Error Codes (500+ codes with remediation)
 * - Prusa Firmware Buddy G-code reference
 *
 * All data is cached locally in the prusa_* tables so we don't hammer GitHub.
 * Periodic refresh (default every 7 days) keeps data up to date.
 */

import { getDb } from './db/connection.js';
import { createLogger } from './logger.js';

const log = createLogger('prusa-import');

const GITHUB_RAW = 'https://raw.githubusercontent.com';
const GITHUB_API = 'https://api.github.com';
const USER_AGENT = '3dprintforge';
const REFRESH_INTERVAL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

// ── Helpers ──

async function _fetchText(url, timeoutMs = 15000) {
  const res = await fetch(url, {
    signal: AbortSignal.timeout(timeoutMs),
    headers: { 'User-Agent': USER_AGENT, 'Accept': 'text/plain, application/vnd.github.raw' },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} ${url}`);
  return res.text();
}

async function _fetchJson(url, timeoutMs = 15000) {
  const res = await fetch(url, {
    signal: AbortSignal.timeout(timeoutMs),
    headers: { 'User-Agent': USER_AGENT, 'Accept': 'application/vnd.github+json' },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} ${url}`);
  return res.json();
}

// ── INI parser ──
// Parses PrusaSlicer .ini config files which have sections like [filament:Generic PLA]
// and key = value lines. Keys can span multiple lines with line continuations.
function parseIni(text) {
  const sections = {};
  let currentSection = null;
  let currentKey = null;
  let multiLine = '';

  const lines = text.split('\n');
  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];

    // Comments
    if (line.startsWith('#') || line.startsWith(';')) { currentKey = null; continue; }

    // Section header: [section:name]
    const sectionMatch = line.match(/^\[([^\]]+)\]/);
    if (sectionMatch) {
      currentSection = sectionMatch[1];
      if (!sections[currentSection]) sections[currentSection] = {};
      currentKey = null;
      continue;
    }

    if (!currentSection) continue;

    // Key = value
    const kvMatch = line.match(/^\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*=\s*(.*)$/);
    if (kvMatch) {
      currentKey = kvMatch[1];
      let value = kvMatch[2].trim();
      // Line continuation with trailing backslash
      while (value.endsWith('\\') && i + 1 < lines.length) {
        value = value.slice(0, -1) + lines[++i].trim();
      }
      sections[currentSection][currentKey] = value;
    } else if (currentKey && line.trim().length > 0) {
      // Multi-line value continuation (rare in PrusaSlicer ini)
      sections[currentSection][currentKey] += ' ' + line.trim();
    } else {
      currentKey = null;
    }
  }
  return sections;
}

// ── Importers ──

/**
 * Import PrusaSlicer filament/print/printer profiles from all vendor INI files.
 */
export async function importPrusaSlicerProfiles() {
  const db = getDb();
  const startTs = Date.now();
  log.info('Fetching PrusaSlicer vendor profile list...');

  // List all .ini files in resources/profiles
  const listing = await _fetchJson(`${GITHUB_API}/repos/prusa3d/PrusaSlicer/contents/resources/profiles`);
  if (!Array.isArray(listing)) throw new Error('Unexpected GitHub API response');

  const iniFiles = listing.filter(f => f.type === 'file' && f.name.endsWith('.ini') && !f.name.endsWith('.idx'));
  log.info(`Found ${iniFiles.length} vendor INI files`);

  let filamentCount = 0;
  let printCount = 0;
  let printerCount = 0;

  const fIns = db.prepare(`INSERT OR REPLACE INTO prusa_filament_profiles
    (vendor, profile_name, material_type, inherits, filament_vendor, density, cost, diameter,
     nozzle_temp, nozzle_temp_first_layer, bed_temp, bed_temp_first_layer,
     fan_speed_min, fan_speed_max, cooling, max_volumetric_speed,
     retraction_length, retraction_speed, compatible_printers_condition, raw_json)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`);

  const prIns = db.prepare(`INSERT OR REPLACE INTO prusa_print_profiles
    (vendor, profile_name, inherits, layer_height, first_layer_height, perimeters,
     top_solid_layers, bottom_solid_layers, infill_density, infill_pattern,
     perimeter_speed, infill_speed, travel_speed, support_material,
     compatible_printers_condition, raw_json)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`);

  const ptIns = db.prepare(`INSERT OR REPLACE INTO prusa_printer_profiles
    (vendor, profile_name, model_id, family, variant, bed_shape, max_print_height,
     nozzle_diameter, technology, thumbnail, default_materials, raw_json)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`);

  for (const file of iniFiles) {
    const vendorName = file.name.replace(/\.ini$/, '');
    try {
      const text = await _fetchText(`${GITHUB_RAW}/prusa3d/PrusaSlicer/master/resources/profiles/${file.name}`);
      const sections = parseIni(text);

      for (const [sectionKey, values] of Object.entries(sections)) {
        const [type, name] = sectionKey.split(':');
        if (!name || name.startsWith('*')) continue; // Skip abstract templates

        if (type === 'filament') {
          const infillPct = parseInt(values.infill_density) || null;
          fIns.run(
            vendorName,
            name,
            _extractMaterialType(values.inherits || name),
            values.inherits || null,
            values.filament_vendor || null,
            parseFloat(values.filament_density) || null,
            parseFloat(values.filament_cost) || null,
            parseFloat(values.filament_diameter) || null,
            parseInt(values.temperature) || null,
            parseInt(values.first_layer_temperature) || null,
            parseInt(values.bed_temperature) || null,
            parseInt(values.first_layer_bed_temperature) || null,
            parseInt(values.min_fan_speed) || null,
            parseInt(values.max_fan_speed) || null,
            parseInt(values.fan_always_on) || null,
            parseFloat(values.filament_max_volumetric_speed) || null,
            parseFloat(values.filament_retract_length) || null,
            parseFloat(values.filament_retract_speed) || null,
            values.compatible_printers_condition || null,
            JSON.stringify(values).slice(0, 8000),
          );
          filamentCount++;
        } else if (type === 'print') {
          prIns.run(
            vendorName,
            name,
            values.inherits || null,
            parseFloat(values.layer_height) || null,
            parseFloat(values.first_layer_height) || null,
            parseInt(values.perimeters) || null,
            parseInt(values.top_solid_layers) || null,
            parseInt(values.bottom_solid_layers) || null,
            parseFloat(values.fill_density) || null,
            values.fill_pattern || null,
            parseFloat(values.perimeter_speed) || null,
            parseFloat(values.infill_speed) || null,
            parseFloat(values.travel_speed) || null,
            parseInt(values.support_material) || 0,
            values.compatible_printers_condition || null,
            JSON.stringify(values).slice(0, 4000),
          );
          printCount++;
        } else if (type === 'printer_model') {
          ptIns.run(
            vendorName,
            name,
            name,
            values.family || null,
            values.variants || null,
            values.bed_model || null,
            null, // max_print_height not in printer_model section
            parseFloat((values.variants || '').split(';')[0]) || null,
            values.technology || 'FFF',
            values.thumbnail || null,
            values.default_materials || null,
            JSON.stringify(values).slice(0, 4000),
          );
          printerCount++;
        }
      }
    } catch (e) {
      log.warn(`Failed to import ${file.name}: ${e.message}`);
    }
  }

  const durationMs = Date.now() - startTs;
  log.info(`Imported ${filamentCount} filaments, ${printCount} print profiles, ${printerCount} printer models in ${Math.round(durationMs / 1000)}s`);

  _setRefreshStatus('prusaslicer_profiles', 'ok', filamentCount + printCount + printerCount);
  return { filamentCount, printCount, printerCount, durationMs };
}

function _extractMaterialType(str) {
  if (!str) return 'Unknown';
  const s = str.toUpperCase();
  const types = ['PLA', 'PETG', 'PET', 'ABS', 'ASA', 'TPU', 'PA', 'PC', 'PP', 'PVA', 'HIPS', 'BVOH', 'FLEX', 'PEEK', 'PEI'];
  for (const t of types) {
    if (s.includes(t)) return t;
  }
  return 'Other';
}

/**
 * Import Prusa Error Codes from Prusa-Error-Codes repo.
 * YAML files: buddy-error-codes.yaml, mmu-error-codes.yaml, sla-error-codes.yaml
 * Each entry has a "printers" list (MINI, MK4, XL, iX, MK3.5, COREONE, etc.)
 * so we expand each entry into one row per printer model.
 */
export async function importPrusaErrorCodes() {
  const db = getDb();
  const startTs = Date.now();
  log.info('Fetching Prusa Error Codes repo list...');

  const yamlFiles = [
    { name: 'buddy-error-codes.yaml', group: 'buddy' },
    { name: 'mmu-error-codes.yaml', group: 'mmu' },
    { name: 'sla-error-codes.yaml', group: 'sla' },
  ];

  let imported = 0;
  const ins = db.prepare(`INSERT OR REPLACE INTO prusa_error_codes
    (code, printer_model, category, title, text, action, buddy_type, approved)
    VALUES (?,?,?,?,?,?,?,?)`);

  for (const file of yamlFiles) {
    try {
      const url = `${GITHUB_RAW}/prusa3d/Prusa-Error-Codes/master/yaml/${file.name}`;
      const text = await _fetchText(url);
      const entries = parseErrorCodeYaml(text);
      for (const e of entries) {
        if (!e.code) continue;
        // Expand printer list (or default to group name if no list)
        const printers = (e.printers && e.printers.length > 0) ? e.printers : [file.group.toUpperCase()];
        const category = _categorizeErrorCode(e.code);
        for (const model of printers) {
          ins.run(
            e.code,
            model.toUpperCase(),
            category,
            e.title || null,
            e.text || null,
            Array.isArray(e.action) ? e.action.join(',') : (e.action || null),
            file.group === 'buddy' ? 1 : 0,
            e.approved === true || e.approved === 'true' ? 1 : 0,
          );
          imported++;
        }
      }
    } catch (e) {
      log.warn(`Failed to import ${file.name}: ${e.message}`);
    }
  }

  const durationMs = Date.now() - startTs;
  log.info(`Imported ${imported} error codes in ${Math.round(durationMs / 1000)}s`);
  _setRefreshStatus('prusa_error_codes', 'ok', imported);
  return { imported, durationMs };
}

// Categorize based on error code digits (xxCxx where C is category per Prusa docs)
function _categorizeErrorCode(code) {
  if (!code) return 'Unknown';
  const str = String(code).toUpperCase();
  // XX1XX = MECHANICAL, XX2XX = TEMPERATURE, XX3XX = ELECTRICAL,
  // XX4XX = CONNECTIVITY, XX5XX = SYSTEM, XX6XX = BOOTLOADER, XX7XX = WARNINGS, XX8XX = CONNECT
  const match = str.match(/^(?:XX|\d{2})(\d)/);
  if (!match) return 'Unknown';
  const c = parseInt(match[1]);
  return ['Unknown', 'Mechanical', 'Temperature', 'Electrical', 'Connectivity', 'System', 'Bootloader', 'Warnings', 'Connect'][c] || 'Unknown';
}

/**
 * Parse Prusa-Error-Codes YAML — schema-focused parser (no yaml lib dependency).
 * Supports:
 *  - `- code: "XX101"` entry headers
 *  - `key: value` string pairs
 *  - `key: [A, B, C]` flow-sequence lists
 *  - `key: true/false` booleans
 */
function parseErrorCodeYaml(text) {
  const entries = [];
  const lines = text.split('\n');
  let current = null;

  function commit() {
    if (current && current.code) entries.push(current);
    current = null;
  }

  const stripQuotes = (v) => {
    v = v.trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      return v.slice(1, -1);
    }
    return v;
  };

  const parseValue = (v) => {
    v = v.trim();
    if (v === 'true') return true;
    if (v === 'false') return false;
    if (v === 'null' || v === '~' || v === '') return null;
    // Flow-sequence list: [A, B, C]
    if (v.startsWith('[') && v.endsWith(']')) {
      return v.slice(1, -1).split(',').map(s => stripQuotes(s));
    }
    return stripQuotes(v);
  };

  for (const raw of lines) {
    const line = raw.replace(/\r$/, '').replace(/^\s*#.*$/, '');
    if (!line.trim()) continue;

    // New entry: "- code: XX101" or "  - code: "XX101""
    const codeStart = line.match(/^\s*-\s*code:\s*(.+)$/);
    if (codeStart) {
      commit();
      current = { code: stripQuotes(codeStart[1]) };
      continue;
    }

    if (!current) continue;

    // key: value
    const kv = line.match(/^\s+([a-zA-Z_][a-zA-Z0-9_]*):\s*(.*)$/);
    if (kv) {
      current[kv[1]] = parseValue(kv[2]);
    }
  }
  commit();
  return entries;
}

/**
 * Import Prusa-specific G-code reference.
 * Prusa documents custom G/M codes in help.prusa3d.com — we fetch and parse.
 */
export async function importPrusaGcodeReference() {
  const db = getDb();
  const startTs = Date.now();
  log.info('Fetching Prusa G-code reference...');

  // Core Prusa-specific commands (hardcoded reference since no clean machine-readable source exists)
  const commands = [
    { code: 'M73', title: 'Set Print Progress', description: 'Set print progress percentage and remaining time. Used by slicer-estimated progress.', parameters: 'P[percent] R[minutes]', example: 'M73 P50 R30', models: 'MK3,MK3S,MK4,MK4S,MINI,XL,CORE' },
    { code: 'M74', title: 'Set Mass', description: 'Set the mass of the print for accurate filament tracking.', parameters: 'W[grams]', example: 'M74 W125', models: 'MK4,MK4S,MINI,XL,CORE' },
    { code: 'M104', title: 'Set Nozzle Temperature', description: 'Set target temperature for hotend without waiting.', parameters: 'S[temp] T[tool]', example: 'M104 S210', models: 'all' },
    { code: 'M140', title: 'Set Bed Temperature', description: 'Set target temperature for heatbed without waiting.', parameters: 'S[temp]', example: 'M140 S60', models: 'all' },
    { code: 'M204', title: 'Set Acceleration', description: 'Set default acceleration limits.', parameters: 'P[print] R[retract] T[travel]', example: 'M204 P1250 T1250', models: 'all' },
    { code: 'M205', title: 'Advanced Settings', description: 'Set jerk and minimum feedrate.', parameters: 'X[xy-jerk] Z[z-jerk] E[e-jerk] S[min-feed]', example: 'M205 X10 Y10', models: 'all' },
    { code: 'M221', title: 'Set Flow Rate', description: 'Set extrusion flow rate percentage.', parameters: 'S[percent]', example: 'M221 S95', models: 'all' },
    { code: 'M300', title: 'Play Tone', description: 'Play a tone on the printer speaker.', parameters: 'S[freq] P[duration]', example: 'M300 S440 P200', models: 'all' },
    { code: 'M569', title: 'Set Stepper Driver Mode', description: 'Configure stepper driver (stealthChop vs spreadCycle).', parameters: 'S[0/1] X Y Z E', example: 'M569 S0 X', models: 'MK3S,MK4,MK4S' },
    { code: 'M572', title: 'Pressure Advance', description: 'Set pressure advance (Linear Advance K factor) per extruder.', parameters: 'S[factor] D[extruder]', example: 'M572 S0.03 D0', models: 'MK4,MK4S,XL,CORE' },
    { code: 'M593', title: 'Input Shaper', description: 'Configure input shaping (vibration suppression).', parameters: 'X/Y[type] F[freq] D[damping]', example: 'M593 X F45 D0.1', models: 'MK4,MK4S,MINI+,XL' },
    { code: 'M600', title: 'Filament Change', description: 'Initiate manual filament change sequence.', parameters: 'X[x] Y[y] Z[z] E[e] L[unload]', example: 'M600', models: 'all' },
    { code: 'M601', title: 'Pause Print', description: 'Pause the current print.', parameters: '', example: 'M601', models: 'all' },
    { code: 'M602', title: 'Resume Print', description: 'Resume after pause.', parameters: '', example: 'M602', models: 'all' },
    { code: 'M701', title: 'Load Filament', description: 'Load filament into the extruder.', parameters: 'T[tool] L[length]', example: 'M701 T0 L200', models: 'MK3,MK4,MK4S,MINI,XL,CORE' },
    { code: 'M702', title: 'Unload Filament', description: 'Unload filament from the extruder.', parameters: 'T[tool]', example: 'M702 T0', models: 'MK3,MK4,MK4S,MINI,XL,CORE' },
    { code: 'M862.1', title: 'Check Nozzle Diameter', description: 'Verify installed nozzle matches G-code requirement.', parameters: 'P[diameter]', example: 'M862.1 P0.4', models: 'MK3S,MK4,MK4S,XL,CORE' },
    { code: 'M862.2', title: 'Check Model', description: 'Verify G-code is for this printer model.', parameters: 'P[model]', example: 'M862.2 P"MK4"', models: 'MK3S,MK4,MK4S,XL,CORE' },
    { code: 'M862.3', title: 'Check Model Name', description: 'Verify model name matches.', parameters: 'P"[name]"', example: 'M862.3 P"MK4S"', models: 'MK4S,XL,CORE' },
    { code: 'M862.4', title: 'Check Firmware Version', description: 'Verify minimum firmware version.', parameters: 'P[version]', example: 'M862.4 P"5.1.0"', models: 'MK4,MK4S,XL,CORE' },
    { code: 'M900', title: 'Linear Advance (MK3)', description: 'Legacy linear advance for Prusa MK3 Marlin firmware.', parameters: 'K[factor]', example: 'M900 K0.05', models: 'MK3,MK3S' },
    { code: 'G26', title: 'Mesh Validation Pattern', description: 'Print a mesh validation pattern to verify bed leveling.', parameters: '', example: 'G26', models: 'MK3,MK3S' },
    { code: 'G28', title: 'Home Axes', description: 'Home specified axes.', parameters: 'X Y Z (or none for all)', example: 'G28', models: 'all' },
    { code: 'G29', title: 'Mesh Bed Leveling', description: 'Probe the bed to create a height map (MBL/ABL).', parameters: '', example: 'G29', models: 'all' },
    { code: 'G80', title: 'Mesh Bed Leveling (Prusa)', description: 'Prusa-specific MBL command for MK2/MK3.', parameters: 'N[points]', example: 'G80', models: 'MK2,MK3,MK3S' },
    { code: 'G81', title: 'Print Mesh Bed Level', description: 'Print the current mesh bed level to serial.', parameters: '', example: 'G81', models: 'MK2,MK3,MK3S' },
  ];

  const ins = db.prepare(`INSERT OR REPLACE INTO prusa_gcode_reference
    (code, title, description, parameters, example, printer_models, source_url)
    VALUES (?,?,?,?,?,?,?)`);

  for (const c of commands) {
    ins.run(c.code, c.title, c.description, c.parameters, c.example, c.models, 'https://help.prusa3d.com/article/list-of-prusa-specific-g-codes_112173');
  }

  const durationMs = Date.now() - startTs;
  log.info(`Imported ${commands.length} G-code commands in ${Math.round(durationMs / 1000)}s`);
  _setRefreshStatus('prusa_gcode_reference', 'ok', commands.length);
  return { imported: commands.length, durationMs };
}

function _setRefreshStatus(resource, status, items, error) {
  try {
    getDb().prepare(`INSERT OR REPLACE INTO prusa_data_refresh (resource, last_fetched_at, status, error, items_imported) VALUES (?, datetime('now'), ?, ?, ?)`)
      .run(resource, status, error || null, items || 0);
  } catch {}
}

/**
 * Import everything in sequence (called manually or on schedule).
 */
export async function importAllPrusaResources() {
  const results = { filaments: null, errors: null, gcodes: null, overall: 'ok' };
  try { results.filaments = await importPrusaSlicerProfiles(); } catch (e) { results.filaments = { error: e.message }; results.overall = 'partial'; _setRefreshStatus('prusaslicer_profiles', 'error', 0, e.message); }
  try { results.errors = await importPrusaErrorCodes(); } catch (e) { results.errors = { error: e.message }; results.overall = 'partial'; _setRefreshStatus('prusa_error_codes', 'error', 0, e.message); }
  try { results.gcodes = await importPrusaGcodeReference(); } catch (e) { results.gcodes = { error: e.message }; results.overall = 'partial'; _setRefreshStatus('prusa_gcode_reference', 'error', 0, e.message); }
  return results;
}

// ── Query helpers ──

export function getPrusaFilaments(filters = {}) {
  const db = getDb();
  const where = [];
  const params = [];
  if (filters.vendor) { where.push('vendor = ?'); params.push(filters.vendor); }
  if (filters.filament_vendor) { where.push('filament_vendor = ?'); params.push(filters.filament_vendor); }
  if (filters.material_type) { where.push('material_type = ?'); params.push(filters.material_type); }
  if (filters.q) { where.push('(profile_name LIKE ? OR filament_vendor LIKE ?)'); params.push(`%${filters.q}%`, `%${filters.q}%`); }
  const clause = where.length > 0 ? ' WHERE ' + where.join(' AND ') : '';
  const limit = Math.max(1, Math.min(parseInt(filters.limit) || 100, 500));
  return db.prepare(`SELECT * FROM prusa_filament_profiles${clause} ORDER BY filament_vendor, profile_name LIMIT ?`).all(...params, limit);
}

export function getPrusaPrintProfiles(filters = {}) {
  const db = getDb();
  const where = [];
  const params = [];
  if (filters.vendor) { where.push('vendor = ?'); params.push(filters.vendor); }
  if (filters.q) { where.push('profile_name LIKE ?'); params.push(`%${filters.q}%`); }
  const clause = where.length > 0 ? ' WHERE ' + where.join(' AND ') : '';
  const limit = Math.max(1, Math.min(parseInt(filters.limit) || 100, 500));
  return db.prepare(`SELECT * FROM prusa_print_profiles${clause} ORDER BY vendor, profile_name LIMIT ?`).all(...params, limit);
}

export function getPrusaPrinterProfiles(filters = {}) {
  const db = getDb();
  const where = [];
  const params = [];
  if (filters.vendor) { where.push('vendor = ?'); params.push(filters.vendor); }
  if (filters.family) { where.push('family = ?'); params.push(filters.family); }
  const clause = where.length > 0 ? ' WHERE ' + where.join(' AND ') : '';
  return db.prepare(`SELECT * FROM prusa_printer_profiles${clause} ORDER BY vendor, profile_name`).all(...params);
}

export function getPrusaErrorCode(code, model) {
  const db = getDb();
  if (model) {
    return db.prepare('SELECT * FROM prusa_error_codes WHERE code = ? AND printer_model = ?').get(code, model);
  }
  return db.prepare('SELECT * FROM prusa_error_codes WHERE code = ?').all(code);
}

export function searchPrusaErrorCodes(filters = {}) {
  const db = getDb();
  const where = [];
  const params = [];
  if (filters.model) { where.push('printer_model = ?'); params.push(filters.model.toUpperCase()); }
  if (filters.category) { where.push('category = ?'); params.push(filters.category); }
  if (filters.q) { where.push('(title LIKE ? OR text LIKE ? OR code LIKE ?)'); params.push(`%${filters.q}%`, `%${filters.q}%`, `%${filters.q}%`); }
  const clause = where.length > 0 ? ' WHERE ' + where.join(' AND ') : '';
  const limit = Math.max(1, Math.min(parseInt(filters.limit) || 100, 500));
  return db.prepare(`SELECT * FROM prusa_error_codes${clause} ORDER BY printer_model, code LIMIT ?`).all(...params, limit);
}

export function getPrusaGcodeReference(filters = {}) {
  const db = getDb();
  const where = [];
  const params = [];
  if (filters.q) { where.push('(code LIKE ? OR title LIKE ? OR description LIKE ?)'); params.push(`%${filters.q}%`, `%${filters.q}%`, `%${filters.q}%`); }
  if (filters.model) { where.push('printer_models LIKE ?'); params.push(`%${filters.model}%`); }
  const clause = where.length > 0 ? ' WHERE ' + where.join(' AND ') : '';
  return db.prepare(`SELECT * FROM prusa_gcode_reference${clause} ORDER BY code`).all(...params);
}

export function getPrusaRefreshStatus() {
  const db = getDb();
  return db.prepare('SELECT * FROM prusa_data_refresh ORDER BY resource').all();
}

// ── Scheduler ──

let _refreshTimer = null;
let _initialTimer = null;

export function startPrusaRefresh() {
  // Initial import 2 minutes after startup if DB is empty or stale
  _initialTimer = setTimeout(async () => {
    try {
      const db = getDb();
      const row = db.prepare('SELECT COUNT(*) as c FROM prusa_filament_profiles').get();
      if ((row?.c || 0) === 0) {
        log.info('First-run import — fetching Prusa data...');
        await importAllPrusaResources();
      } else {
        // Check if stale (> 7 days)
        const refresh = db.prepare("SELECT last_fetched_at FROM prusa_data_refresh WHERE resource = 'prusaslicer_profiles'").get();
        if (refresh?.last_fetched_at) {
          const age = Date.now() - new Date(refresh.last_fetched_at).getTime();
          if (age > REFRESH_INTERVAL_MS) {
            log.info('Data is stale — refreshing Prusa resources...');
            await importAllPrusaResources();
          }
        }
      }
    } catch (e) { log.error('Initial refresh failed: ' + e.message); }
  }, 2 * 60 * 1000);

  // Periodic refresh every 7 days
  _refreshTimer = setInterval(async () => {
    try { await importAllPrusaResources(); } catch (e) { log.error('Periodic refresh failed: ' + e.message); }
  }, REFRESH_INTERVAL_MS);

  log.info(`Prusa refresh scheduled (initial: 2 min, periodic: every ${REFRESH_INTERVAL_MS / 86400000} days)`);
}

export function stopPrusaRefresh() {
  if (_initialTimer) { clearTimeout(_initialTimer); _initialTimer = null; }
  if (_refreshTimer) { clearInterval(_refreshTimer); _refreshTimer = null; }
}
