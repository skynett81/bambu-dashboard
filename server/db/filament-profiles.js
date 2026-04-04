import { getDb } from './connection.js';
import { createLogger } from '../logger.js';

const log = createLogger('db:filament-profiles');

// ---- Private helpers ----

function _jsonCol(val) {
  if (!val) return null;
  return typeof val === 'string' ? val : JSON.stringify(val);
}

// ---- Vendors ----

export function getVendors(filters = {}) {
  const db = getDb();
  if (filters.limit) {
    const total = db.prepare('SELECT COUNT(*) as total FROM vendors').get().total;
    const rows = db.prepare('SELECT * FROM vendors ORDER BY name LIMIT ? OFFSET ?')
      .all(filters.limit, filters.offset || 0);
    return { rows, total };
  }
  return db.prepare('SELECT * FROM vendors ORDER BY name').all();
}

export function addVendor(v) {
  const db = getDb();
  const result = db.prepare('INSERT INTO vendors (name, website, empty_spool_weight_g, comment, extra_fields, external_id) VALUES (?, ?, ?, ?, ?, ?)')
    .run(v.name, v.website || null, v.empty_spool_weight_g || null, v.comment || null,
      v.extra_fields ? (typeof v.extra_fields === 'string' ? v.extra_fields : JSON.stringify(v.extra_fields)) : null,
      v.external_id || null);
  return { id: Number(result.lastInsertRowid), ...v };
}

export function updateVendor(id, v) {
  const db = getDb();
  db.prepare('UPDATE vendors SET name=?, website=?, empty_spool_weight_g=?, comment=?, extra_fields=?, external_id=? WHERE id=?')
    .run(v.name, v.website || null, v.empty_spool_weight_g || null, v.comment || null,
      v.extra_fields ? (typeof v.extra_fields === 'string' ? v.extra_fields : JSON.stringify(v.extra_fields)) : null,
      v.external_id || null, id);
}

export function deleteVendor(id) {
  const db = getDb();
  db.prepare('DELETE FROM vendors WHERE id=?').run(id);
}

// ---- Filament Profiles ----

export function getFilamentProfiles(filters = {}) {
  const db = getDb();
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
  const db = getDb();
  return db.prepare(`SELECT fp.*, v.name as vendor_name FROM filament_profiles fp
    LEFT JOIN vendors v ON fp.vendor_id = v.id WHERE fp.id = ?`).get(id) || null;
}

export function addFilamentProfile(p) {
  const db = getDb();
  const result = db.prepare(`INSERT INTO filament_profiles
    (vendor_id, name, material, color_name, color_hex, density, diameter, spool_weight_g,
     nozzle_temp_min, nozzle_temp_max, bed_temp_min, bed_temp_max, comment,
     article_number, multi_color_hexes, multi_color_direction, extra_fields,
     finish, translucent, glow, weight_options, external_id, diameters, weights, price,
     pressure_advance_k, max_volumetric_speed, retraction_distance, retraction_speed, cooling_fan_speed, optimal_settings,
     transmission_distance, modifiers, tray_id_name, chamber_temp_min, chamber_temp_max, diameter_tolerance, ral_code, pantone_code)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
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
    p.transmission_distance ?? null, _jsonCol(p.modifiers),
    p.tray_id_name || null, p.chamber_temp_min || null, p.chamber_temp_max || null,
    p.diameter_tolerance ?? null, p.ral_code || null, p.pantone_code || null);
  return { id: Number(result.lastInsertRowid) };
}

export function updateFilamentProfile(id, p) {
  const db = getDb();
  db.prepare(`UPDATE filament_profiles SET vendor_id=?, name=?, material=?, color_name=?, color_hex=?,
    density=?, diameter=?, spool_weight_g=?, nozzle_temp_min=?, nozzle_temp_max=?, bed_temp_min=?, bed_temp_max=?,
    comment=?, article_number=?, multi_color_hexes=?, multi_color_direction=?, extra_fields=?,
    finish=?, translucent=?, glow=?, weight_options=?, external_id=?, diameters=?, weights=?, price=?,
    pressure_advance_k=?, max_volumetric_speed=?, retraction_distance=?, retraction_speed=?, cooling_fan_speed=?, optimal_settings=?,
    transmission_distance=?, modifiers=?,
    tray_id_name=?, chamber_temp_min=?, chamber_temp_max=?, diameter_tolerance=?, ral_code=?, pantone_code=?
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
    p.transmission_distance ?? null, _jsonCol(p.modifiers),
    p.tray_id_name || null, p.chamber_temp_min || null, p.chamber_temp_max || null,
    p.diameter_tolerance ?? null, p.ral_code || null, p.pantone_code || null, id);
}

export function deleteFilamentProfile(id) {
  const db = getDb();
  db.prepare('DELETE FROM filament_profiles WHERE id=?').run(id);
}

// ---- Export ----

export function getAllFilamentProfilesForExport() {
  const db = getDb();
  return db.prepare(`SELECT fp.*, v.name as vendor_name FROM filament_profiles fp
    LEFT JOIN vendors v ON fp.vendor_id = v.id ORDER BY fp.id`).all();
}

export function getAllVendorsForExport() {
  const db = getDb();
  return db.prepare('SELECT * FROM vendors ORDER BY id').all();
}

// ---- Import ----

export function importFilamentProfiles(profiles) {
  let count = 0;
  for (const p of profiles) {
    try {
      addFilamentProfile(p);
      count++;
    } catch (e) { log.warn('Could not import filament profile "' + (p.name || p.id || '?') + '": ' + e.message); }
  }
  return count;
}

export function importVendors(vendors) {
  let count = 0;
  for (const v of vendors) {
    try {
      addVendor(v);
      count++;
    } catch (e) { log.warn('Could not import vendor "' + (v.name || v.id || '?') + '": ' + e.message); }
  }
  return count;
}

// ---- Bulk operations ----

export function bulkDeleteProfiles(ids) {
  const db = getDb();
  const placeholders = ids.map(() => '?').join(',');
  db.prepare(`DELETE FROM filament_profiles WHERE id IN (${placeholders})`).run(...ids);
}

export function bulkEditProfiles(ids, fields) {
  const db = getDb();
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
  const db = getDb();
  const placeholders = ids.map(() => '?').join(',');
  // Check for dependent profiles
  const deps = db.prepare(`SELECT COUNT(*) as c FROM filament_profiles WHERE vendor_id IN (${placeholders})`).get(...ids);
  if (deps.c > 0) throw new Error(`Cannot delete: ${deps.c} profiles depend on these vendors`);
  db.prepare(`DELETE FROM vendors WHERE id IN (${placeholders})`).run(...ids);
}

// ---- Temperature Guide ----

export function getTemperatureGuide() {
  const db = getDb();
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
  const db = getDb();
  if (material) return db.prepare('SELECT * FROM filament_compatibility WHERE material = ? ORDER BY plate_type, nozzle_type').all(material);
  return db.prepare('SELECT * FROM filament_compatibility ORDER BY material, plate_type, nozzle_type').all();
}

export function addCompatibilityRule(rule) {
  const db = getDb();
  const r = db.prepare(`INSERT INTO filament_compatibility (material, nozzle_type, nozzle_size_min, nozzle_size_max, plate_type, compatibility, notes) VALUES (?, ?, ?, ?, ?, ?, ?)`)
    .run(rule.material, rule.nozzle_type || 'any', rule.nozzle_size_min ?? null, rule.nozzle_size_max ?? null, rule.plate_type || 'any', rule.compatibility || 'good', rule.notes || null);
  return { id: Number(r.lastInsertRowid) };
}

export function updateCompatibilityRule(id, rule) {
  const db = getDb();
  db.prepare('UPDATE filament_compatibility SET material=?, nozzle_type=?, nozzle_size_min=?, nozzle_size_max=?, plate_type=?, compatibility=?, notes=? WHERE id=?')
    .run(rule.material, rule.nozzle_type || 'any', rule.nozzle_size_min ?? null, rule.nozzle_size_max ?? null, rule.plate_type || 'any', rule.compatibility || 'good', rule.notes || null, id);
}

export function deleteCompatibilityRule(id) {
  const db = getDb();
  db.prepare('DELETE FROM filament_compatibility WHERE id = ?').run(id);
}

// ---- Custom field schemas ----

export function getFieldSchemas(entityType) {
  const db = getDb();
  return db.prepare('SELECT * FROM field_schemas WHERE entity_type = ? ORDER BY key').all(entityType);
}

export function addFieldSchema(entityType, key, schema) {
  const db = getDb();
  const result = db.prepare('INSERT INTO field_schemas (entity_type, key, name, field_type, unit) VALUES (?, ?, ?, ?, ?)')
    .run(entityType, key, schema.name || key, schema.field_type || 'text', schema.unit || null);
  return { id: Number(result.lastInsertRowid), entity_type: entityType, key, ...schema };
}

export function deleteFieldSchema(entityType, key) {
  const db = getDb();
  db.prepare('DELETE FROM field_schemas WHERE entity_type = ? AND key = ?').run(entityType, key);
}

// ---- Legacy Filament Inventory (filament_inventory table) ----

export function getFilament(printerId = null) {
  const db = getDb();
  if (printerId) return db.prepare('SELECT * FROM filament_inventory WHERE printer_id = ? ORDER BY id').all(printerId);
  return db.prepare('SELECT * FROM filament_inventory ORDER BY printer_id, id').all();
}

export function addFilament(f) {
  const db = getDb();
  return db.prepare('INSERT INTO filament_inventory (printer_id, brand, type, color_name, color_hex, weight_total_g, weight_used_g, cost_nok, purchase_date, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)').run(
    f.printer_id || null, f.brand, f.type, f.color_name || null, f.color_hex || null,
    f.weight_total_g || 1000, f.weight_used_g || 0, f.cost_nok || null, f.purchase_date || null, f.notes || null);
}

export function updateFilament(id, f) {
  const db = getDb();
  return db.prepare('UPDATE filament_inventory SET printer_id=?, brand=?, type=?, color_name=?, color_hex=?, weight_total_g=?, weight_used_g=?, cost_nok=?, notes=? WHERE id=?').run(
    f.printer_id || null, f.brand, f.type, f.color_name, f.color_hex, f.weight_total_g, f.weight_used_g, f.cost_nok, f.notes, id);
}

export function deleteFilament(id) {
  const db = getDb();
  return db.prepare('DELETE FROM filament_inventory WHERE id=?').run(id);
}
