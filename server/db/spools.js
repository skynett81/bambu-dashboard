import { getDb } from './connection.js';
import { createLogger } from '../logger.js';

const log = createLogger('db:spools');

// ---- Private helpers ----

function _generateShortId() {
  const db = getDb();
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // No I/O/0/1 to avoid confusion
  for (let attempt = 0; attempt < 100; attempt++) {
    let id = '';
    for (let i = 0; i < 4; i++) id += chars[Math.floor(Math.random() * chars.length)];
    const exists = db.prepare('SELECT 1 FROM spools WHERE short_id = ?').get(id);
    if (!exists) return id;
  }
  return Date.now().toString(36).slice(-4).toUpperCase();
}

function _enrichSpoolRows(rows) {
  for (const r of rows) {
    r.remaining_length_m = weightToLength(r.remaining_weight_g, r.density, r.diameter);
    r.used_length_m = weightToLength(r.used_weight_g, r.density, r.diameter);
  }
  return rows;
}

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

// ---- SPOOL_SELECT constant ----

const SPOOL_SELECT = `SELECT s.*,
  fp.name as profile_name, fp.material,
  COALESCE(s.color_name_override, fp.color_name) as color_name,
  -- Strip a leading '#' from the override so the column always matches
  -- the legacy hex-without-prefix format used by filament_profiles
  -- (frontend code does '#' + color_hex).
  COALESCE(LTRIM(s.color_hex_override, '#'), fp.color_hex) as color_hex,
  fp.color_hex as profile_color_hex, fp.color_name as profile_color_name,
  fp.density, fp.diameter, fp.spool_weight_g as profile_spool_weight_g,
  fp.nozzle_temp_min, fp.nozzle_temp_max, fp.bed_temp_min, fp.bed_temp_max,
  fp.article_number, fp.multi_color_hexes, fp.multi_color_direction,
  fp.extra_fields as profile_extra_fields,
  fp.finish, fp.translucent, fp.glow, fp.weight_options,
  fp.price as profile_price,
  fp.pressure_advance_k, fp.max_volumetric_speed, fp.retraction_distance, fp.retraction_speed, fp.cooling_fan_speed, fp.optimal_settings,
  fp.external_id as profile_external_id, fp.diameters, fp.weights,
  v.name as vendor_name, v.id as vendor_id, v.empty_spool_weight_g as vendor_empty_spool_weight_g,
  v.external_id as vendor_external_id,
  bv.color_name as bambu_color_name, bv.variant_id as bambu_variant_id,
  bv.drying_temp as bambu_drying_temp, bv.drying_hours as bambu_drying_hours,
  bv.spool_weight_g as bambu_spool_weight_g
  FROM spools s
  LEFT JOIN filament_profiles fp ON s.filament_profile_id = fp.id
  LEFT JOIN vendors v ON fp.vendor_id = v.id
  LEFT JOIN bambu_variants bv ON fp.color_name = bv.variant_id`;

// ---- Spools CRUD ----

export function getSpools(filters = {}) {
  const db = getDb();
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
  // Enrich with tags — single batch query to avoid N+1
  if (rows.length > 0) {
    const ids = rows.map(r => r.id);
    const allTags = db.prepare(`SELECT et.entity_id, t.* FROM entity_tags et JOIN tags t ON et.tag_id = t.id WHERE et.entity_type = 'spool' AND et.entity_id IN (${ids.map(() => '?').join(',')}) ORDER BY t.name`).all(...ids);
    const tagMap = {};
    for (const t of allTags) { if (!tagMap[t.entity_id]) tagMap[t.entity_id] = []; tagMap[t.entity_id].push(t); }
    for (const row of rows) { row.tags = tagMap[row.id] || []; }
  } else {
    for (const row of rows) { row.tags = []; }
  }
  return { rows, total };
}

export function getSpool(id) {
  const db = getDb();
  const row = db.prepare(SPOOL_SELECT + ' WHERE s.id = ?').get(id) || null;
  if (row) {
    _enrichSpoolRows([row]);
    row.tags = db.prepare('SELECT t.* FROM tags t JOIN entity_tags et ON t.id = et.tag_id WHERE et.entity_type = ? AND et.entity_id = ? ORDER BY t.name').all('spool', row.id);
  }
  return row;
}

// ── NFC slot sync (Snapmaker U1 — auto-attach NFC-detected spools) ──

/**
 * Sync a single NFC-detected channel to the spools table.
 *  - If the channel reports vendor "NONE" or weight 0, unlink any spool
 *    currently attached to that slot so the UI shows the slot as Empty.
 *  - Else, find a non-archived spool whose lot_number matches the NFC SKU
 *    and printer/slot is unassigned (or already this slot). Link it.
 *  - If no such spool exists, auto-create one with the NFC profile so the
 *    user sees the freshly inserted reel without having to type anything.
 *
 * Errors are logged and swallowed — telemetry must never crash on slot
 * mapping issues.
 *
 * @param {string} printerId
 * @param {number} channel  0-based extruder index (T0..T3 on U1)
 * @param {object} nfc      NFC info as parsed by moonraker-client
 */
export function syncNfcSlot(printerId, channel, nfc) {
  if (!printerId || channel == null) return;
  const db = getDb();
  try {
    const isEmpty = !nfc || !nfc.vendor || nfc.vendor === 'NONE' || (nfc.weight ?? 0) <= 0;
    const linked = db.prepare(
      'SELECT * FROM spools WHERE printer_id = ? AND ams_unit = 0 AND ams_tray = ? AND archived = 0'
    ).get(printerId, channel);

    if (isEmpty) {
      // NFC reports the slot as physically empty. Only auto-unlink if the
      // currently-linked spool was attached *via NFC* in the first place
      // — non-NFC reels (Elegoo, BambuLab, etc.) the user picked manually
      // also produce a NONE NFC reading and must not be stripped.
      // A spool is considered NFC-managed when its lot_number holds the
      // SKU (a 6-digit Snapmaker SKU like 900000).
      if (linked && linked.lot_number && /^\d{4,}$/.test(linked.lot_number)) {
        db.prepare('UPDATE spools SET printer_id = NULL, ams_unit = NULL, ams_tray = NULL WHERE id = ?').run(linked.id);
        try { addSpoolEvent(linked.id, 'unlinked', { reason: 'nfc_empty', channel }, null); } catch { /* ignore */ }
      }
      return;
    }

    const sku = nfc.sku ? String(nfc.sku) : null;
    if (!sku) return; // can't reliably match without SKU

    // Slot already has a spool — keep it (the user picked it manually or
    // it was created earlier with a real filament_profile_id and usage
    // history). Only stamp the NFC SKU into lot_number so the next sync
    // recognises it and we don't replace the user's data.
    if (linked) {
      if (linked.lot_number !== sku) {
        db.prepare('UPDATE spools SET lot_number = ? WHERE id = ?').run(sku, linked.id);
      }
      return;
    }

    // No spool currently in this slot — try to find an existing non-archived
    // spool with the same SKU that isn't attached anywhere.
    const candidate = db.prepare(`SELECT * FROM spools
      WHERE lot_number = ? AND archived = 0 AND printer_id IS NULL
      ORDER BY id DESC LIMIT 1`).get(sku);

    if (candidate) {
      db.prepare('UPDATE spools SET printer_id = ?, ams_unit = 0, ams_tray = ? WHERE id = ?')
        .run(printerId, channel, candidate.id);
      try { addSpoolEvent(candidate.id, 'linked', { source: 'nfc', channel, sku }, null); } catch { /* ignore */ }
      return;
    }

    // Nothing matches — auto-create a new spool from the NFC profile and
    // link it. Resolve filament_profile_id from a vendor+material+color
    // match if possible; otherwise leave null and rely on inline metadata.
    const matName = nfc.type || 'PLA';
    const colorHex = nfc.color || null;
    const vendor = nfc.vendor || 'Snapmaker';
    let profileId = null;
    try {
      const prof = db.prepare(`SELECT fp.id FROM filament_profiles fp
        LEFT JOIN vendors v ON v.id = fp.vendor_id
        WHERE fp.material = ? AND (fp.color_hex = ? OR ? IS NULL)
          AND (v.name = ? OR v.name IS NULL)
        LIMIT 1`).get(matName, colorHex, colorHex, vendor);
      if (prof) profileId = prof.id;
    } catch { /* missing tables are fine */ }

    const initial = nfc.weight ? Math.round(nfc.weight) : 1000;
    const shortId = _generateShortId();
    const ins = db.prepare(`INSERT INTO spools
      (filament_profile_id, remaining_weight_g, used_weight_g, initial_weight_g,
       lot_number, printer_id, ams_unit, ams_tray, comment, short_id)
      VALUES (?, ?, 0, ?, ?, ?, 0, ?, ?, ?)`).run(
      profileId, initial, initial, sku, printerId, channel,
      `Auto-detected via NFC — ${vendor} ${matName} ${nfc.subType || ''}`.trim(), shortId);
    try { addSpoolEvent(Number(ins.lastInsertRowid), 'created', { source: 'nfc', channel, sku }, null); } catch { /* ignore */ }
  } catch (e) {
    log.warn(`NFC slot sync failed (printer=${printerId}, ch=${channel}): ${e.message}`);
  }
}

export function addSpool(s) {
  const db = getDb();
  const shortId = _generateShortId();
  const result = db.prepare(`INSERT INTO spools
    (filament_profile_id, remaining_weight_g, used_weight_g, initial_weight_g, cost, lot_number,
     purchase_date, location, printer_id, ams_unit, ams_tray, comment, extra_fields, spool_weight,
     storage_method, short_id, tray_id_name, color_hex_override, color_name_override)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
    s.filament_profile_id || null, s.remaining_weight_g ?? s.initial_weight_g ?? 1000,
    s.used_weight_g ?? 0, s.initial_weight_g ?? 1000,
    s.cost || null, s.lot_number || null, s.purchase_date || null,
    s.location || null, s.printer_id || null, s.ams_unit ?? null, s.ams_tray ?? null,
    s.comment || null, s.extra_fields ? JSON.stringify(s.extra_fields) : null,
    s.spool_weight ?? null, s.storage_method || null, shortId, s.tray_id_name || null,
    s.color_hex_override || null, s.color_name_override || null);
  const newId = Number(result.lastInsertRowid);
  try { addSpoolEvent(newId, 'created', null, null); } catch (e) { log.warn('Failed to log spool created event', e.message); }
  return { id: newId, short_id: shortId };
}

export function updateSpool(id, s) {
  const db = getDb();
  // Merge with existing spool data so partial updates work
  const existing = getSpool(id);
  if (existing) {
    for (const key of Object.keys(existing)) {
      if (!(key in s)) s[key] = existing[key];
    }
  }
  db.prepare(`UPDATE spools SET filament_profile_id=?, remaining_weight_g=?, used_weight_g=?,
    initial_weight_g=?, cost=?, lot_number=?, purchase_date=?, location=?,
    printer_id=?, ams_unit=?, ams_tray=?, archived=?, comment=?, extra_fields=?, spool_weight=?,
    storage_method=?, tray_id_name=?, color_hex_override=?, color_name_override=?
    WHERE id=?`).run(
    s.filament_profile_id || null, s.remaining_weight_g, s.used_weight_g,
    s.initial_weight_g, s.cost || null, s.lot_number || null, s.purchase_date || null,
    s.location || null, s.printer_id || null, s.ams_unit ?? null, s.ams_tray ?? null,
    s.archived ?? 0, s.comment || null,
    s.extra_fields ? JSON.stringify(s.extra_fields) : null, s.spool_weight ?? null,
    s.storage_method || null, s.tray_id_name || null,
    s.color_hex_override || null, s.color_name_override || null, id);
  try { addSpoolEvent(id, 'edited', null, null); } catch (e) { log.warn('Failed to log spool edit event', e.message); }
}

export function deleteSpool(id) {
  const db = getDb();
  db.prepare('DELETE FROM spools WHERE id=?').run(id);
}

export function archiveSpool(id, archived = true) {
  const db = getDb();
  db.prepare('UPDATE spools SET archived = ? WHERE id = ?').run(archived ? 1 : 0, id);
  try { addSpoolEvent(id, archived ? 'archived' : 'unarchived', null, null); } catch (e) { log.warn('Failed to log spool archive event', e.message); }
}

export function refillSpool(id, newWeightG) {
  const db = getDb();
  const spool = db.prepare('SELECT * FROM spools WHERE id = ?').get(id);
  if (!spool) return null;
  const refillCount = (spool.refill_count || 0) + 1;
  db.prepare('UPDATE spools SET is_refill = 1, refill_count = ?, remaining_weight_g = ?, used_weight_g = 0, initial_weight_g = ? WHERE id = ?')
    .run(refillCount, newWeightG, newWeightG, id);
  try { addSpoolEvent(id, 'refilled', `Refill #${refillCount}, ${newWeightG}g`, null); } catch (e) { log.warn('Failed to log spool refill event', e.message); }
  return { id, refill_count: refillCount };
}

export function autoTrashEmptySpools() {
  const db = getDb();
  const setting = getInventorySetting('auto_trash_days');
  const days = parseInt(setting) || 0;
  if (days <= 0) return 0;
  const minWeight = 10; // grams - consider empty below this
  const result = db.prepare(`DELETE FROM spools WHERE archived = 1 AND remaining_weight_g <= ?
    AND julianday('now') - julianday(COALESCE(last_used_at, created_at)) > ?`).run(minWeight, days);
  return result.changes;
}

export function getRecentProfiles(limit = 5) {
  const db = getDb();
  return db.prepare(`SELECT DISTINCT fp.* FROM filament_profiles fp
    INNER JOIN spools s ON s.filament_profile_id = fp.id
    ORDER BY s.created_at DESC LIMIT ?`).all(limit);
}

export function getLocationAlerts() {
  const db = getDb();
  const locations = db.prepare(`SELECT l.*,
    (SELECT COUNT(*) FROM spools s WHERE (s.location_id = l.id OR s.location = l.name) AND s.archived = 0) as spool_count,
    (SELECT COALESCE(SUM(s.remaining_weight_g), 0) / 1000.0 FROM spools s WHERE (s.location_id = l.id OR s.location = l.name) AND s.archived = 0) as total_weight_kg
    FROM locations l
    WHERE l.min_spools IS NOT NULL OR l.max_spools IS NOT NULL
       OR l.min_weight_kg IS NOT NULL OR l.max_weight_kg IS NOT NULL
       OR l.humidity_min IS NOT NULL OR l.humidity_max IS NOT NULL
       OR l.temp_min IS NOT NULL OR l.temp_max IS NOT NULL`).all();
  const alerts = [];
  for (const loc of locations) {
    if (loc.min_spools != null && loc.spool_count < loc.min_spools) alerts.push({ location: loc.name, type: 'min_spools', current: loc.spool_count, threshold: loc.min_spools });
    if (loc.max_spools != null && loc.spool_count > loc.max_spools) alerts.push({ location: loc.name, type: 'max_spools', current: loc.spool_count, threshold: loc.max_spools });
    if (loc.min_weight_kg != null && loc.total_weight_kg < loc.min_weight_kg) alerts.push({ location: loc.name, type: 'min_weight', current: loc.total_weight_kg, threshold: loc.min_weight_kg });
    if (loc.max_weight_kg != null && loc.total_weight_kg > loc.max_weight_kg) alerts.push({ location: loc.name, type: 'max_weight', current: loc.total_weight_kg, threshold: loc.max_weight_kg });

    // Climate alerts use the last recorded reading (updated via POST /api/inventory/locations/:id/climate).
    // Only raises the alarm when we have a reading AND the threshold is set.
    if (loc.last_temp != null) {
      if (loc.temp_min != null && loc.last_temp < loc.temp_min) alerts.push({ location: loc.name, type: 'temp_low', current: loc.last_temp, threshold: loc.temp_min, since: loc.climate_alert_since });
      if (loc.temp_max != null && loc.last_temp > loc.temp_max) alerts.push({ location: loc.name, type: 'temp_high', current: loc.last_temp, threshold: loc.temp_max, since: loc.climate_alert_since });
    }
    if (loc.last_humidity != null) {
      if (loc.humidity_min != null && loc.last_humidity < loc.humidity_min) alerts.push({ location: loc.name, type: 'humidity_low', current: loc.last_humidity, threshold: loc.humidity_min, since: loc.climate_alert_since });
      if (loc.humidity_max != null && loc.last_humidity > loc.humidity_max) alerts.push({ location: loc.name, type: 'humidity_high', current: loc.last_humidity, threshold: loc.humidity_max, since: loc.climate_alert_since });
    }
  }
  return alerts;
}

/** Record a climate reading (temp °C + humidity %) against a location. */
export function recordLocationClimate(locationId, temp, humidity) {
  const db = getDb();
  const loc = db.prepare('SELECT temp_min, temp_max, humidity_min, humidity_max, climate_alert_since FROM locations WHERE id = ?').get(locationId);
  if (!loc) throw new Error(`Location ${locationId} not found`);
  const now = new Date().toISOString();

  const outOfRange =
    (loc.temp_min != null && temp != null && temp < loc.temp_min) ||
    (loc.temp_max != null && temp != null && temp > loc.temp_max) ||
    (loc.humidity_min != null && humidity != null && humidity < loc.humidity_min) ||
    (loc.humidity_max != null && humidity != null && humidity > loc.humidity_max);
  const alertSince = outOfRange ? (loc.climate_alert_since || now) : null;

  db.prepare(`UPDATE locations
              SET last_temp = ?, last_humidity = ?, last_climate_at = ?, climate_alert_since = ?
              WHERE id = ?`).run(temp ?? null, humidity ?? null, now, alertSince, locationId);
  return { out_of_range: outOfRange, alert_since: alertSince };
}

/** Mark sync status with Spoolman for a specific spool. */
export function setSpoolmanSyncStatus(spoolId, error = null) {
  const db = getDb();
  const now = new Date().toISOString();
  db.prepare('UPDATE spools SET spoolman_synced_at = ?, spoolman_sync_error = ? WHERE id = ?')
    .run(error ? null : now, error || null, spoolId);
}

// ─────────────────────────────────────────────────────────────
// extra_field_schema — user-defined custom fields (Spoolman compat)
// ─────────────────────────────────────────────────────────────
export function getExtraFieldSchemas(entity) {
  const db = getDb();
  return db.prepare('SELECT * FROM extra_field_schema WHERE entity = ? ORDER BY order_index, id').all(entity);
}

export function addExtraFieldSchema(entry) {
  const db = getDb();
  const r = db.prepare(`INSERT INTO extra_field_schema
    (entity, key, name, field_type, default_value, choices, unit, order_index)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)`).run(
      entry.entity, entry.key, entry.name,
      entry.field_type || 'text',
      entry.default_value || null,
      entry.choices ? JSON.stringify(entry.choices) : null,
      entry.unit || null,
      entry.order_index || 0,
    );
  return r.lastInsertRowid;
}

export function deleteExtraFieldSchema(id) {
  getDb().prepare('DELETE FROM extra_field_schema WHERE id = ?').run(id);
}

export function listMaterials() {
  return getDb().prepare('SELECT * FROM materials_taxonomy ORDER BY parent_material NULLS FIRST, material').all();
}

export function listPurgeMatrix({ from, to } = {}) {
  const db = getDb();
  if (from && to) return db.prepare('SELECT * FROM filament_purge_matrix WHERE from_material = ? AND to_material = ?').all(from, to);
  if (from) return db.prepare('SELECT * FROM filament_purge_matrix WHERE from_material = ?').all(from);
  return db.prepare('SELECT * FROM filament_purge_matrix ORDER BY from_material, to_material LIMIT 500').all();
}

export function listOrcaSlicerFilaments({ vendor, material } = {}) {
  const db = getDb();
  if (vendor && material) return db.prepare('SELECT id, vendor, name, material, printer_type, nozzle_temp_min, nozzle_temp_max, bed_temp_min, bed_temp_max, max_volumetric_speed FROM orcaslicer_filaments WHERE vendor = ? AND material = ?').all(vendor, material);
  if (vendor) return db.prepare('SELECT id, vendor, name, material, printer_type, nozzle_temp_min, nozzle_temp_max, bed_temp_min, bed_temp_max, max_volumetric_speed FROM orcaslicer_filaments WHERE vendor = ?').all(vendor);
  return db.prepare('SELECT id, vendor, name, material, printer_type FROM orcaslicer_filaments ORDER BY vendor, name LIMIT 1000').all();
}

export function getOrcaSlicerFilament(id) {
  return getDb().prepare('SELECT * FROM orcaslicer_filaments WHERE id = ?').get(id);
}

export function markVendorSpoolmanSynced(vendorId, spoolmanId) {
  getDb().prepare('UPDATE vendors SET spoolman_id = ?, spoolman_synced_at = datetime(\'now\') WHERE id = ?')
    .run(spoolmanId, vendorId);
}

/**
 * Convert our hierarchical location (parent_id chain) to a Spoolman-style
 * "/"-joined path for the location string on a spool push. Returns '' if
 * locationId is null or the location can't be resolved.
 */
export function locationIdToSpoolmanPath(locationId) {
  if (!locationId) return '';
  const db = getDb();
  const parts = [];
  let current = db.prepare('SELECT id, name, parent_id FROM locations WHERE id = ?').get(locationId);
  const seen = new Set();
  while (current && !seen.has(current.id)) {
    seen.add(current.id);
    parts.unshift(current.name);
    current = current.parent_id ? db.prepare('SELECT id, name, parent_id FROM locations WHERE id = ?').get(current.parent_id) : null;
  }
  return parts.join('/');
}

// ---- Filament Usage History ----

export function addFilamentUsageSnapshot(entry) {
  const db = getDb();
  return db.prepare(`INSERT INTO filament_usage_history
    (printer_id, ams_unit, tray_id, tray_id_name, tray_type, tray_sub_brands, tray_color,
     remain_pct, tray_weight, tag_uid, tray_uuid, spool_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
    entry.printer_id, entry.ams_unit, entry.tray_id,
    entry.tray_id_name || null, entry.tray_type || null, entry.tray_sub_brands || null,
    entry.tray_color || null, entry.remain_pct ?? null, entry.tray_weight ?? null,
    entry.tag_uid || null, entry.tray_uuid || null, entry.spool_id || null);
}

export function getFilamentUsageHistory(filters = {}) {
  const db = getDb();
  let sql = 'SELECT * FROM filament_usage_history WHERE 1=1';
  const params = [];
  if (filters.printer_id) { sql += ' AND printer_id = ?'; params.push(filters.printer_id); }
  if (filters.tray_id_name) { sql += ' AND tray_id_name = ?'; params.push(filters.tray_id_name); }
  if (filters.spool_id) { sql += ' AND spool_id = ?'; params.push(filters.spool_id); }
  if (filters.from) { sql += ' AND timestamp >= ?'; params.push(filters.from); }
  if (filters.to) { sql += ' AND timestamp <= ?'; params.push(filters.to); }
  sql += ' ORDER BY timestamp DESC';
  if (filters.limit) { sql += ' LIMIT ?'; params.push(filters.limit); }
  return db.prepare(sql).all(...params);
}

export function getFilamentUsageTrend(trayIdName, days = 30) {
  const db = getDb();
  return db.prepare(`SELECT DATE(timestamp) as date,
    MIN(remain_pct) as min_remain, MAX(remain_pct) as max_remain,
    AVG(remain_pct) as avg_remain, COUNT(*) as samples
    FROM filament_usage_history
    WHERE tray_id_name = ? AND timestamp >= datetime('now', '-' || ? || ' days')
    GROUP BY DATE(timestamp)
    ORDER BY date`).all(trayIdName, days);
}

export function getSpoolByTrayIdName(trayIdName) {
  const db = getDb();
  return db.prepare(`SELECT s.*, fp.name as profile_name, fp.material, fp.color_hex, fp.color_name, v.name as vendor_name
    FROM spools s
    LEFT JOIN filament_profiles fp ON s.filament_profile_id = fp.id
    LEFT JOIN vendors v ON fp.vendor_id = v.id
    WHERE s.tray_id_name = ? AND s.archived = 0
    ORDER BY s.created_at DESC LIMIT 1`).get(trayIdName);
}

// ---- Purchased Spools Registry ----

export function getPurchasedSpools() {
  const db = getDb();
  return db.prepare(`SELECT ps.*, s.remaining_weight_g, s.used_weight_g, s.initial_weight_g,
    s.printer_id as assigned_printer, s.ams_unit, s.ams_tray
    FROM purchased_spools ps
    LEFT JOIN spools s ON ps.spool_id = s.id
    ORDER BY ps.name, ps.purchase_order`).all();
}

export function addPurchasedSpool(p) {
  const db = getDb();
  const result = db.prepare(`INSERT INTO purchased_spools
    (name, brand, form, color_hex, tray_id_name, spool_id, purchase_order, cost, purchase_date, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
    p.name, p.brand || null, p.form || 'spool', p.color_hex || null,
    p.tray_id_name || null, p.spool_id || null, p.purchase_order ?? 1,
    p.cost || null, p.purchase_date || null, p.notes || null);
  return { id: Number(result.lastInsertRowid) };
}

export function updatePurchasedSpool(id, p) {
  const db = getDb();
  db.prepare(`UPDATE purchased_spools SET name=?, brand=?, form=?, color_hex=?,
    tray_id_name=?, spool_id=?, purchase_order=?, cost=?, purchase_date=?, notes=?
    WHERE id=?`).run(
    p.name, p.brand || null, p.form || 'spool', p.color_hex || null,
    p.tray_id_name || null, p.spool_id || null, p.purchase_order ?? 1,
    p.cost || null, p.purchase_date || null, p.notes || null, id);
}

export function deletePurchasedSpool(id) {
  const db = getDb();
  db.prepare('DELETE FROM purchased_spools WHERE id=?').run(id);
}

export function importPurchasedSpools(spools) {
  const db = getDb();
  let count = 0;
  for (const s of spools) {
    db.prepare(`INSERT INTO purchased_spools
      (name, brand, form, color_hex, tray_id_name, purchase_order, cost, purchase_date, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`)
      .run(s.name, s.brand || null, s.form || 'spool', s.color_hex || null,
        s.tray_id_name || null, s.purchase_order ?? s.order ?? 1,
        s.cost || null, s.purchase_date || null, s.notes || null);
    count++;
  }
  return { imported: count };
}

export function linkPurchasedToSpool(purchasedId, spoolId) {
  const db = getDb();
  db.prepare('UPDATE purchased_spools SET spool_id = ? WHERE id = ?').run(spoolId, purchasedId);
}

// ---- Auto-match AMS tray to spool by color + material ----

export function autoMatchTrayToSpool(trayColor, trayMaterial, trayBrand, trayWeight, printerId, amsUnit, trayId) {
  const db = getDb();
  // 1. Check if already assigned by slot
  const existing = getSpoolBySlot(printerId, amsUnit, trayId);
  if (existing) return existing;

  // 2. Match by tray_id_name if available
  // (handled separately via getSpoolByTrayIdName)

  // 3. Match by color + material from inventory
  const colorHex = (trayColor || '').substring(0, 6).toUpperCase();
  if (!colorHex || colorHex === '000000') return null;

  const candidates = db.prepare(`
    SELECT s.*, fp.material, fp.color_hex, fp.color_name, v.name as vendor_name
    FROM spools s
    LEFT JOIN filament_profiles fp ON s.filament_profile_id = fp.id
    LEFT JOIN vendors v ON fp.vendor_id = v.id
    WHERE s.archived = 0
      AND s.printer_id IS NULL
      AND UPPER(SUBSTR(fp.color_hex, 1, 6)) = ?
      AND (fp.material = ? OR fp.material = ?)
    ORDER BY s.remaining_weight_g DESC
    LIMIT 5`).all(colorHex, trayMaterial || '', trayBrand || '');

  if (candidates.length === 0) return null;

  // 4. Prefer weight match (within 15% tolerance like filamentstatus repo)
  const weight = parseInt(trayWeight) || 1000;
  for (const c of candidates) {
    const tolerance = c.initial_weight_g * 0.15;
    if (Math.abs(c.initial_weight_g - weight) <= tolerance) {
      return c;
    }
  }

  // 5. Return best candidate (highest remaining)
  return candidates[0];
}

export function autoCreateSpoolFromTray(tray, printerId, amsUnit, trayId) {
  const db = getDb();
  const colorHex = (tray.tray_color || '').substring(0, 6);
  const material = tray.tray_type || 'PLA';
  const brand = tray.tray_sub_brands || null;
  const weight = parseInt(tray.tray_weight) || 1000;
  const trayIdName = tray.tray_id_name || null;

  // Find or create filament profile
  let profileId = null;
  const profileName = `${brand ? brand + ' ' : ''}${material}${tray.tray_id_name ? ' ' + tray.tray_id_name : ''}`;

  // Try to find existing profile by tray_id_name first
  if (trayIdName) {
    const byTrayId = db.prepare('SELECT id FROM filament_profiles WHERE tray_id_name = ? LIMIT 1').get(trayIdName);
    if (byTrayId) profileId = byTrayId.id;
  }

  // Then by color+material
  if (!profileId) {
    const byColor = db.prepare(`SELECT id FROM filament_profiles
      WHERE UPPER(SUBSTR(color_hex, 1, 6)) = UPPER(?) AND (material = ? OR material = ?)
      LIMIT 1`).get(colorHex, material, brand || material);
    if (byColor) profileId = byColor.id;
  }

  // Create profile if none exists
  if (!profileId) {
    let vendorId = null;
    if (brand) {
      const v = db.prepare('SELECT id FROM vendors WHERE LOWER(name) = LOWER(?) LIMIT 1').get(brand);
      vendorId = v ? v.id : null;
      if (!vendorId) {
        const vr = db.prepare('INSERT INTO vendors (name) VALUES (?)').run(brand);
        vendorId = Number(vr.lastInsertRowid);
      }
    }
    const pr = db.prepare(`INSERT INTO filament_profiles (vendor_id, name, material, color_hex, spool_weight_g, tray_id_name)
      VALUES (?, ?, ?, ?, ?, ?)`).run(vendorId, profileName, material, colorHex, weight, trayIdName);
    profileId = Number(pr.lastInsertRowid);
  }

  // Compute remaining weight from AMS percentage
  const remainPct = Math.max(0, Math.min(100, tray.remain || 0));
  const remainG = correctRemainWeight(remainPct, weight);

  const result = addSpool({
    filament_profile_id: profileId,
    remaining_weight_g: remainG,
    used_weight_g: weight - remainG,
    initial_weight_g: weight,
    printer_id: printerId,
    ams_unit: amsUnit,
    ams_tray: trayId,
    tray_id_name: trayIdName,
    comment: 'Auto-created from AMS tray',
  });

  return result;
}

/** Correct remaining weight for non-1kg spools (ported from filamentstatus repo) */
export function correctRemainWeight(remainPct, trayWeightG) {
  const remain = parseFloat(remainPct);
  const weight = parseFloat(trayWeightG);
  if (weight <= 0 || isNaN(remain)) return 0;

  if (weight < 1000) {
    // AMS reports remain% based on 1000g — correct for actual spool weight
    const gramsOn1kg = (remain / 100) * 1000;
    let correctedPct = (gramsOn1kg / weight) * 100;
    correctedPct = Math.min(100, Math.max(0, correctedPct));
    return Math.round((correctedPct / 100) * weight);
  }
  return Math.round((remain / 100) * weight);
}

// ---- Filament Analytics ----

export function aggregateDailyFilamentUsage(date) {
  const db = getDb();
  // Aggregate from print_history for a given date
  const rows = db.prepare(`
    SELECT COALESCE(printer_id, '') as printer_id,
      COALESCE(filament_type, '') as material,
      COALESCE(filament_brand, '') as brand,
      COALESCE(filament_color, '') as color_hex,
      SUM(CASE WHEN filament_used_g > 0 THEN filament_used_g ELSE 0 END) as filament_used_g,
      SUM(CASE WHEN waste_g > 0 THEN waste_g ELSE 0 END) as waste_g,
      COUNT(*) as print_count,
      SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as success_count,
      SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as fail_count,
      SUM(CASE WHEN duration_seconds > 0 THEN duration_seconds ELSE 0 END) as total_print_seconds,
      SUM(CASE WHEN color_changes > 0 THEN color_changes ELSE 0 END) as color_changes
    FROM print_history
    WHERE DATE(started_at) = ?
    GROUP BY COALESCE(printer_id, ''), COALESCE(filament_type, ''), COALESCE(filament_brand, ''), COALESCE(filament_color, '')
  `).all(date);

  for (const r of rows) {
    db.prepare('DELETE FROM daily_filament_usage WHERE date = ? AND printer_id = ? AND material = ? AND brand = ? AND color_hex = ?')
      .run(date, r.printer_id, r.material, r.brand, r.color_hex);
    db.prepare(`INSERT INTO daily_filament_usage
      (date, printer_id, material, brand, color_hex, filament_used_g, waste_g, print_count,
       success_count, fail_count, total_print_seconds, color_changes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
      .run(date, r.printer_id, r.material, r.brand, r.color_hex,
        r.filament_used_g, r.waste_g, r.print_count, r.success_count, r.fail_count,
        r.total_print_seconds, r.color_changes);
  }
  return rows.length;
}

export function backfillDailyUsage(days = 90) {
  let count = 0;
  for (let i = 0; i < days; i++) {
    const date = new Date(Date.now() - i * 86400000).toISOString().split('T')[0];
    count += aggregateDailyFilamentUsage(date);
  }
  return count;
}

export function getDailyFilamentUsage(filters = {}) {
  const db = getDb();
  let sql = 'SELECT * FROM daily_filament_usage WHERE 1=1';
  const params = [];
  if (filters.from) { sql += ' AND date >= ?'; params.push(filters.from); }
  if (filters.to) { sql += ' AND date <= ?'; params.push(filters.to); }
  if (filters.material) { sql += ' AND material = ?'; params.push(filters.material); }
  if (filters.printer_id) { sql += ' AND printer_id = ?'; params.push(filters.printer_id); }
  if (filters.brand) { sql += ' AND brand = ?'; params.push(filters.brand); }
  sql += ' ORDER BY date DESC';
  if (filters.limit) { sql += ' LIMIT ?'; params.push(filters.limit); }
  return db.prepare(sql).all(...params);
}

export function getFilamentConsumptionSummary(days = 30) {
  const db = getDb();
  return db.prepare(`
    SELECT material, brand,
      SUM(filament_used_g) as total_used_g,
      SUM(waste_g) as total_waste_g,
      SUM(print_count) as total_prints,
      SUM(success_count) as total_success,
      SUM(fail_count) as total_fails,
      SUM(total_print_seconds) as total_seconds,
      ROUND(SUM(waste_g) * 100.0 / NULLIF(SUM(filament_used_g + waste_g), 0), 1) as waste_pct,
      ROUND(SUM(success_count) * 100.0 / NULLIF(SUM(print_count), 0), 1) as success_rate,
      ROUND(SUM(filament_used_g) / NULLIF(COUNT(DISTINCT date), 0), 1) as avg_daily_g,
      COUNT(DISTINCT date) as active_days
    FROM daily_filament_usage
    WHERE date >= DATE('now', '-' || ? || ' days')
    GROUP BY material, brand
    ORDER BY total_used_g DESC`).all(days);
}

export function getFilamentConsumptionByPrinter(days = 30) {
  const db = getDb();
  return db.prepare(`
    SELECT printer_id, material,
      SUM(filament_used_g) as total_used_g,
      SUM(waste_g) as total_waste_g,
      SUM(print_count) as total_prints,
      ROUND(SUM(filament_used_g) / NULLIF(COUNT(DISTINCT date), 0), 1) as avg_daily_g
    FROM daily_filament_usage
    WHERE date >= DATE('now', '-' || ? || ' days')
    GROUP BY printer_id, material
    ORDER BY total_used_g DESC`).all(days);
}

export function getFilamentWeeklyTrend(weeks = 12) {
  const db = getDb();
  return db.prepare(`
    SELECT strftime('%Y-W%W', date) as week,
      material,
      SUM(filament_used_g) as used_g,
      SUM(waste_g) as waste_g,
      SUM(print_count) as prints,
      ROUND(SUM(success_count) * 100.0 / NULLIF(SUM(print_count), 0), 1) as success_rate
    FROM daily_filament_usage
    WHERE date >= DATE('now', '-' || ? || ' days')
    GROUP BY week, material
    ORDER BY week DESC, used_g DESC`).all(weeks * 7);
}

export function updateConsumptionRates() {
  const db = getDb();
  const materials = db.prepare(`
    SELECT COALESCE(material, '') as material, COALESCE(brand, '') as brand,
      ROUND(SUM(filament_used_g) / NULLIF(COUNT(DISTINCT date), 0), 2) as avg_daily_g,
      ROUND(SUM(filament_used_g) / NULLIF(COUNT(DISTINCT date), 0) * 7, 2) as avg_weekly_g,
      ROUND(SUM(filament_used_g) / NULLIF(COUNT(DISTINCT date), 0) * 30, 2) as avg_monthly_g,
      ROUND(SUM(waste_g) * 1.0 / NULLIF(SUM(filament_used_g + waste_g), 0), 4) as waste_ratio,
      ROUND(SUM(success_count) * 1.0 / NULLIF(SUM(print_count), 0), 4) as success_rate,
      COUNT(DISTINCT date) as sample_days
    FROM daily_filament_usage
    WHERE date >= DATE('now', '-90 days')
    GROUP BY COALESCE(material, ''), COALESCE(brand, '')`).all();

  for (const m of materials) {
    const costRow = db.prepare(`SELECT ROUND(AVG(s.cost / NULLIF(s.initial_weight_g, 0)), 4) as cpg
      FROM spools s
      LEFT JOIN filament_profiles fp ON s.filament_profile_id = fp.id
      WHERE fp.material = ? AND (? = '' OR EXISTS (
        SELECT 1 FROM vendors v WHERE v.id = fp.vendor_id AND v.name = ?
      )) AND s.cost > 0`).get(m.material, m.brand, m.brand);

    db.prepare('DELETE FROM material_consumption_rate WHERE material = ? AND brand = ?').run(m.material, m.brand);
    db.prepare(`INSERT INTO material_consumption_rate
      (material, brand, avg_daily_g, avg_weekly_g, avg_monthly_g, waste_ratio, success_rate, avg_cost_per_g, sample_days, last_calculated)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`)
      .run(m.material, m.brand, m.avg_daily_g, m.avg_weekly_g, m.avg_monthly_g,
        m.waste_ratio, m.success_rate, costRow?.cpg || 0, m.sample_days);
  }
  return materials.length;
}

export function getConsumptionRates() {
  const db = getDb();
  return db.prepare('SELECT * FROM material_consumption_rate ORDER BY avg_monthly_g DESC').all();
}

export function getSpoolDepletionForecast() {
  const db = getDb();
  // Get spools first, then enrich with consumption rates in JS
  const spools = db.prepare(`
    SELECT s.id, s.tray_id_name, s.remaining_weight_g, s.initial_weight_g, s.printer_id,
      fp.name as profile_name, fp.material, fp.color_hex,
      (SELECT v.name FROM vendors v WHERE v.id = fp.vendor_id) as vendor_name,
      ROUND(s.remaining_weight_g * 100.0 / NULLIF(s.initial_weight_g, 0), 1) as remain_pct
    FROM spools s
    LEFT JOIN filament_profiles fp ON s.filament_profile_id = fp.id
    WHERE s.archived = 0 AND s.remaining_weight_g > 0
    ORDER BY s.remaining_weight_g ASC`).all();

  const rates = db.prepare('SELECT material, brand, avg_daily_g FROM material_consumption_rate WHERE avg_daily_g > 0').all();

  for (const s of spools) {
    // Find best matching rate: prefer exact material match, then any material match
    const exactMatch = rates.find(r => r.material === s.material && r.brand === s.vendor_name);
    const materialMatch = rates.find(r => r.material === s.material);
    const rate = exactMatch || materialMatch;

    s.avg_daily_g = rate?.avg_daily_g || null;
    if (s.avg_daily_g && s.avg_daily_g > 0) {
      s.days_until_empty = Math.round(s.remaining_weight_g / s.avg_daily_g * 10) / 10;
      const daysInt = Math.round(s.days_until_empty);
      const d = new Date(); d.setDate(d.getDate() + daysInt);
      s.estimated_empty_date = d.toISOString().split('T')[0];
    } else {
      s.days_until_empty = null;
      s.estimated_empty_date = null;
    }
  }

  // Sort: soonest depletion first, nulls last
  spools.sort((a, b) => {
    if (a.days_until_empty == null && b.days_until_empty == null) return 0;
    if (a.days_until_empty == null) return 1;
    if (b.days_until_empty == null) return -1;
    return a.days_until_empty - b.days_until_empty;
  });

  return spools;
}

export function getWasteAnalysis(days = 30) {
  const db = getDb();
  return db.prepare(`
    SELECT
      filament_type as material,
      filament_brand as brand,
      status,
      COUNT(*) as print_count,
      SUM(CASE WHEN waste_g > 0 THEN waste_g ELSE 0 END) as total_waste_g,
      SUM(CASE WHEN filament_used_g > 0 THEN filament_used_g ELSE 0 END) as total_used_g,
      ROUND(SUM(CASE WHEN waste_g > 0 THEN waste_g ELSE 0 END) * 100.0 /
        NULLIF(SUM(CASE WHEN filament_used_g + waste_g > 0 THEN filament_used_g + waste_g ELSE 0 END), 0), 1) as waste_ratio,
      SUM(color_changes) as total_color_changes,
      ROUND(AVG(CASE WHEN waste_g > 0 THEN waste_g ELSE NULL END), 1) as avg_waste_per_print
    FROM print_history
    WHERE started_at >= datetime('now', '-' || ? || ' days')
    GROUP BY filament_type, filament_brand, status
    ORDER BY total_waste_g DESC`).all(days);
}

export function getMaterialEfficiency(days = 30) {
  const db = getDb();
  return db.prepare(`
    SELECT
      filament_type as material,
      filament_brand as brand,
      COUNT(*) as print_count,
      ROUND(AVG(filament_used_g), 1) as avg_g_per_print,
      ROUND(SUM(filament_used_g) / NULLIF(SUM(duration_seconds) / 3600.0, 0), 1) as g_per_hour,
      ROUND(AVG(CASE WHEN status='completed' THEN duration_seconds ELSE NULL END) / 60.0, 1) as avg_print_minutes,
      ROUND(SUM(CASE WHEN status='completed' THEN 1 ELSE 0 END) * 100.0 / NULLIF(COUNT(*), 0), 1) as success_rate,
      ROUND(AVG(CASE WHEN nozzle_diameter > 0 THEN nozzle_diameter ELSE NULL END), 2) as avg_nozzle_mm,
      ROUND(AVG(CASE WHEN speed_level > 0 THEN speed_level ELSE NULL END), 1) as avg_speed_level
    FROM print_history
    WHERE started_at >= datetime('now', '-' || ? || ' days')
      AND filament_type IS NOT NULL
    GROUP BY filament_type, filament_brand
    ORDER BY g_per_hour DESC NULLS LAST`).all(days);
}

export function checkSpoolDepletionThresholds(spoolId, remainPct) {
  const db = getDb();
  const thresholds = [75, 50, 25, 10, 5];
  const events = [];
  for (const t of thresholds) {
    if (remainPct <= t) {
      const existing = db.prepare(
        'SELECT id FROM spool_depletion_events WHERE spool_id = ? AND threshold_pct = ?'
      ).get(spoolId, t);
      if (!existing) {
        db.prepare(`INSERT INTO spool_depletion_events (spool_id, threshold_pct, remain_pct)
          VALUES (?, ?, ?)`).run(spoolId, t, remainPct);
        events.push({ spool_id: spoolId, threshold_pct: t, remain_pct: remainPct });
      }
    }
  }
  return events;
}

export function getSpoolDepletionEvents(spoolId) {
  const db = getDb();
  if (spoolId) {
    return db.prepare('SELECT * FROM spool_depletion_events WHERE spool_id = ? ORDER BY triggered_at DESC').all(spoolId);
  }
  return db.prepare(`SELECT sde.*, s.tray_id_name, fp.name as profile_name, fp.material
    FROM spool_depletion_events sde
    LEFT JOIN spools s ON sde.spool_id = s.id
    LEFT JOIN filament_profiles fp ON s.filament_profile_id = fp.id
    WHERE sde.notified = 0
    ORDER BY sde.triggered_at DESC`).all();
}

export function markDepletionNotified(eventId) {
  const db = getDb();
  db.prepare('UPDATE spool_depletion_events SET notified = 1 WHERE id = ?').run(eventId);
}

export function getFilamentCostAnalysis() {
  const db = getDb();
  return db.prepare(`
    SELECT fp.material, v.name as vendor,
      COUNT(s.id) as spool_count,
      ROUND(AVG(s.cost / NULLIF(s.initial_weight_g, 0)), 4) as avg_cost_per_g,
      ROUND(MIN(s.cost / NULLIF(s.initial_weight_g, 0)), 4) as min_cost_per_g,
      ROUND(MAX(s.cost / NULLIF(s.initial_weight_g, 0)), 4) as max_cost_per_g,
      SUM(s.cost) as total_spent,
      SUM(s.used_weight_g) as total_consumed_g,
      SUM(s.remaining_weight_g) as total_remaining_g,
      ROUND(SUM(s.used_weight_g) * 100.0 / NULLIF(SUM(s.initial_weight_g), 0), 1) as utilization_pct
    FROM spools s
    LEFT JOIN filament_profiles fp ON s.filament_profile_id = fp.id
    LEFT JOIN vendors v ON fp.vendor_id = v.id
    WHERE s.cost > 0
    GROUP BY fp.material, v.name
    ORDER BY total_spent DESC`).all();
}

export function useSpoolWeight(spoolId, weightG, source = 'auto', printHistoryId = null, printerId = null) {
  const db = getDb();
  db.prepare(`UPDATE spools SET
    remaining_weight_g = MAX(0, remaining_weight_g - ?),
    used_weight_g = used_weight_g + ?,
    last_used_at = datetime('now'),
    first_used_at = COALESCE(first_used_at, datetime('now'))
    WHERE id = ?`).run(weightG, weightG, spoolId);

  db.prepare(`INSERT INTO spool_usage_log (spool_id, print_history_id, printer_id, used_weight_g, source)
    VALUES (?, ?, ?, ?, ?)`).run(spoolId, printHistoryId || null, printerId || null, weightG, source);
  try { addSpoolEvent(spoolId, 'used', JSON.stringify({ weight_g: weightG, source }), null); } catch (e) { log.warn('Failed to log spool usage event', e.message); }
}

export function assignSpoolToSlot(spoolId, printerId, amsUnit, amsTray) {
  const db = getDb();
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
  } catch (e) { log.warn('Failed to log spool assignment event', e.message); }
}

export function getSpoolBySlot(printerId, amsUnit, amsTray) {
  const db = getDb();
  return db.prepare(SPOOL_SELECT + ' WHERE s.printer_id = ? AND s.ams_unit = ? AND s.ams_tray = ? AND s.archived = 0')
    .get(printerId, amsUnit, amsTray) || null;
}

export function syncAmsToSpool(printerId, amsUnit, trayId, remainPct) {
  const db = getDb();
  const spool = db.prepare('SELECT id, initial_weight_g, remaining_weight_g, used_weight_g FROM spools WHERE printer_id = ? AND ams_unit = ? AND ams_tray = ? AND archived = 0')
    .get(printerId, amsUnit, trayId);
  if (!spool || !spool.initial_weight_g) return null;
  const amsWeight = Math.round((remainPct / 100) * spool.initial_weight_g * 10) / 10;
  const diff = Math.abs(amsWeight - (spool.remaining_weight_g || 0));
  if (diff < 5) return null; // Ignore noise < 5g
  // Only update if AMS reports LESS remaining than our tracking
  // (AMS can't add filament back, so if our tracking shows more used, trust our data)
  if (amsWeight >= (spool.remaining_weight_g || 0)) return null;
  db.prepare('UPDATE spools SET remaining_weight_g = ?, used_weight_g = MAX(0, initial_weight_g - ?), last_used_at = datetime(\'now\') WHERE id = ?')
    .run(amsWeight, amsWeight, spool.id);
  return { spoolId: spool.id, newWeight: amsWeight, diff };
}

export function toggleSpoolFavorite(id) {
  const db = getDb();
  db.prepare('UPDATE spools SET is_favorite = CASE WHEN is_favorite = 1 THEN 0 ELSE 1 END WHERE id = ?').run(id);
  const row = db.prepare('SELECT is_favorite FROM spools WHERE id = ?').get(id);
  return row ? row.is_favorite : 0;
}

export function batchAddSpools(data, count) {
  // Only the first reel inherits the slot assignment (printer_id +
  // ams_unit + ams_tray). Subsequent ones land unattached so they don't
  // all show up linked to the same toolhead — the user can attach the
  // remaining reels later from the slot picker. This matches the typical
  // workflow: buying 5 of the same colour and only loading 1 right now.
  const ids = [];
  for (let i = 0; i < count; i++) {
    const payload = i === 0 ? data : { ...data, printer_id: null, ams_unit: null, ams_tray: null };
    const result = addSpool(payload);
    ids.push(result.id);
  }
  return ids;
}

// ---- Shared Palettes ----

export function createSharedPalette(title, filters) {
  const db = getDb();
  const token = [...Array(16)].map(() => Math.random().toString(36)[2]).join('');
  db.prepare('INSERT INTO shared_palettes (token, title, filters) VALUES (?, ?, ?)').run(token, title || null, filters ? JSON.stringify(filters) : null);
  return token;
}

export function getSharedPalette(token) {
  const db = getDb();
  const row = db.prepare('SELECT * FROM shared_palettes WHERE token = ?').get(token);
  if (row) db.prepare('UPDATE shared_palettes SET view_count = view_count + 1 WHERE token = ?').run(token);
  return row || null;
}

export function deleteSharedPalette(token) {
  const db = getDb();
  db.prepare('DELETE FROM shared_palettes WHERE token = ?').run(token);
}

export function getSharedPaletteSpools(filters) {
  const db = getDb();
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
  const db = getDb();
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

// ---- FIFO Spool Suggestion ----

export function getFifoSpool(material, colorHex = null, profileId = null) {
  const db = getDb();
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

// ---- Spool Usage Log ----

export function getSpoolUsageLog(filters = {}) {
  const db = getDb();
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
  const db = getDb();
  return db.prepare('SELECT * FROM locations ORDER BY name').all();
}

export function addLocation(l) {
  const db = getDb();
  const result = db.prepare('INSERT INTO locations (name, description, parent_id, min_spools, max_spools, min_weight_kg, max_weight_kg) VALUES (?, ?, ?, ?, ?, ?, ?)').run(
    l.name, l.description || null, l.parent_id || null, l.min_spools || null, l.max_spools || null, l.min_weight_kg || null, l.max_weight_kg || null
  );
  return { id: Number(result.lastInsertRowid), ...l };
}

export function updateLocation(id, data) {
  const db = getDb();
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
  const db = getDb();
  const loc = db.prepare('SELECT parent_id FROM locations WHERE id = ?').get(id);
  // Reparent children to this location's parent
  db.prepare('UPDATE locations SET parent_id = ? WHERE parent_id = ?').run(loc?.parent_id || null, id);
  // Nullify spool references
  db.prepare('UPDATE spools SET location_id = NULL, location = NULL WHERE location_id = ?').run(id);
  db.prepare('DELETE FROM locations WHERE id=?').run(id);
}

// ---- Inventory Stats ----

export function getInventoryStats() {
  const db = getDb();
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
  const db = getDb();
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
  const db = getDb();
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
  const db = getDb();
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
  try { addSpoolEvent(targetId, 'merged', JSON.stringify({ absorbed: sourceInfo }), actor); } catch (e) { log.warn('Failed to log spool merge event', e.message); }

  for (const src of sources) {
    try { addSpoolEvent(src.id, 'merged_into', JSON.stringify({ target_id: targetId }), actor); } catch (e) { log.warn('Failed to log spool merged_into event', e.message); }
    db.prepare('UPDATE spools SET archived = 1, remaining_weight_g = 0 WHERE id = ?').run(src.id);
  }

  return getSpool(targetId);
}

// ---- Measure Weight ----

export function measureSpoolWeight(spoolId, grossWeightG) {
  const db = getDb();
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
  if (weightG == null || density == null || diameterMm == null) return null;
  if (density <= 0 || diameterMm <= 0) return null;
  const radiusCm = (diameterMm / 10) / 2;
  const volumeCm3 = weightG / density;
  const lengthCm = volumeCm3 / (Math.PI * radiusCm * radiusCm);
  return Math.round(lengthCm / 100 * 10) / 10;
}

export function lengthToWeight(lengthMm, density, diameterMm) {
  if (lengthMm == null || density == null || diameterMm == null) return null;
  if (density <= 0 || diameterMm <= 0) return null;
  const radiusCm = (diameterMm / 10) / 2;
  const lengthCm = lengthMm / 10;
  const volumeCm3 = lengthCm * Math.PI * radiusCm * radiusCm;
  return Math.round(volumeCm3 * density * 100) / 100;
}

// ---- Export ----

export function getAllSpoolsForExport() {
  const db = getDb();
  return _enrichSpoolRows(db.prepare(SPOOL_SELECT + ' ORDER BY s.id').all());
}

export function getSpoolsForExportByIds(ids) {
  const db = getDb();
  const placeholders = ids.map(() => '?').join(',');
  return _enrichSpoolRows(db.prepare(SPOOL_SELECT + ` WHERE s.id IN (${placeholders}) ORDER BY s.id`).all(...ids));
}

// ---- Color Similarity (CIELAB Delta-E CIE76) ----

export function findSimilarColors(targetHex, maxDeltaE = 30) {
  const db = getDb();
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
  const db = getDb();
  return db.prepare('SELECT DISTINCT material FROM filament_profiles WHERE material IS NOT NULL ORDER BY material').all().map(r => r.material);
}

export function getDistinctLotNumbers() {
  const db = getDb();
  return db.prepare('SELECT DISTINCT lot_number FROM spools WHERE lot_number IS NOT NULL AND lot_number != \'\' ORDER BY lot_number').all().map(r => r.lot_number);
}

export function getDistinctArticleNumbers() {
  const db = getDb();
  return db.prepare('SELECT DISTINCT article_number FROM filament_profiles WHERE article_number IS NOT NULL AND article_number != \'\' ORDER BY article_number').all().map(r => r.article_number);
}

// ---- Inventory Settings ----

export function getInventorySetting(key) {
  const db = getDb();
  const row = db.prepare('SELECT value FROM inventory_settings WHERE key = ?').get(key);
  return row ? row.value : null;
}

export function setInventorySetting(key, value) {
  const db = getDb();
  db.prepare('INSERT OR REPLACE INTO inventory_settings (key, value) VALUES (?, ?)').run(key, String(value));
}

export function getAllInventorySettings() {
  const db = getDb();
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
    } catch (e) { log.warn('Could not import spool "' + (s.id || s.short_id || '?') + '": ' + e.message); }
  }
  return count;
}

// ---- Drying Management ----

export function getDryingSessions(filters = {}) {
  const db = getDb();
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
  const db = getDb();
  return db.prepare(`SELECT ds.*, fp.name AS profile_name, fp.material, fp.color_hex, v.name AS vendor_name
    FROM drying_sessions ds
    LEFT JOIN spools s ON ds.spool_id = s.id
    LEFT JOIN filament_profiles fp ON s.filament_profile_id = fp.id
    LEFT JOIN vendors v ON fp.vendor_id = v.id
    WHERE ds.active = 1 ORDER BY ds.started_at DESC`).all();
}

export function startDryingSession(data) {
  const db = getDb();
  const result = db.prepare(`INSERT INTO drying_sessions
    (spool_id, temperature, duration_minutes, method, humidity_before, notes, active)
    VALUES (?, ?, ?, ?, ?, ?, 1)`).run(
    data.spool_id, data.temperature || null, data.duration_minutes,
    data.method || 'dryer_box', data.humidity_before || null, data.notes || null);
  return { id: Number(result.lastInsertRowid) };
}

export function completeDryingSession(sessionId, humidityAfter = null) {
  const db = getDb();
  db.prepare(`UPDATE drying_sessions SET active = 0, completed_at = datetime('now'), humidity_after = ? WHERE id = ?`)
    .run(humidityAfter, sessionId);
  const session = db.prepare('SELECT spool_id FROM drying_sessions WHERE id = ?').get(sessionId);
  if (session) {
    db.prepare(`UPDATE spools SET last_dried_at = datetime('now') WHERE id = ?`).run(session.spool_id);
  }
}

export function deleteDryingSession(sessionId) {
  const db = getDb();
  db.prepare('DELETE FROM drying_sessions WHERE id = ?').run(sessionId);
}

export function getDryingPresets() {
  const db = getDb();
  return db.prepare('SELECT * FROM drying_presets ORDER BY material').all();
}

export function getDryingPreset(material) {
  const db = getDb();
  return db.prepare('SELECT * FROM drying_presets WHERE material = ?').get(material) || null;
}

export function upsertDryingPreset(material, data) {
  const db = getDb();
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
  const db = getDb();
  db.prepare('DELETE FROM drying_presets WHERE material = ?').run(material);
}

export function getUsagePredictions() {
  const db = getDb();
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
    SELECT s.id, s.remaining_weight_g, fp.material, fp.name AS profile_name, v.name AS vendor_name, fp.color_hex, fp.color_name,
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
  const db = getDb();
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
  const db = getDb();
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

export function estimatePrintCost(filamentUsedG, durationSeconds, spoolId = null, printerId = null) {
  const db = getDb();
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
  const db = getDb();
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

// ---- Spool Events Timeline ----

export function addSpoolEvent(spoolId, eventType, details, actor) {
  const db = getDb();
  db.prepare('INSERT INTO spool_events (spool_id, event_type, details, actor) VALUES (?, ?, ?, ?)')
    .run(spoolId, eventType, details || null, actor || null);
}

export function getSpoolTimeline(spoolId, limit = 100) {
  const db = getDb();
  return db.prepare('SELECT * FROM spool_events WHERE spool_id = ? ORDER BY timestamp DESC LIMIT ?').all(spoolId, limit);
}

export function getSpoolPrintStats(spoolId) {
  const db = getDb();
  // Get usage log entries linked to print history
  const usageRows = db.prepare(`
    SELECT sul.used_weight_g, sul.timestamp, sul.print_history_id, sul.source,
           ph.filename, ph.status, ph.duration_seconds, ph.filament_used_g as print_total_g,
           ph.started_at, ph.finished_at
    FROM spool_usage_log sul
    LEFT JOIN print_history ph ON sul.print_history_id = ph.id
    WHERE sul.spool_id = ?
    ORDER BY sul.timestamp DESC
  `).all(spoolId);

  // Get spool info with cost
  const spool = db.prepare(`
    SELECT s.*, fp.price as profile_price, fp.name as profile_name, fp.material,
           fp.color_hex, fp.color_name, v.name as vendor_name
    FROM spools s
    LEFT JOIN filament_profiles fp ON s.filament_profile_id = fp.id
    LEFT JOIN vendors v ON fp.vendor_id = v.id
    WHERE s.id = ?
  `).get(spoolId);
  if (!spool) return null;

  const costPerG = spool.cost && spool.initial_weight_g > 0
    ? spool.cost / spool.initial_weight_g
    : spool.profile_price && spool.initial_weight_g > 0
      ? spool.profile_price / spool.initial_weight_g
      : 0;

  const totalUsedG = spool.used_weight_g || 0;
  const totalCostUsed = totalUsedG * costPerG;
  const remainingValue = (spool.remaining_weight_g || 0) * costPerG;

  // Prints linked to this spool
  const prints = usageRows.filter(r => r.print_history_id).map(r => ({
    print_id: r.print_history_id,
    filename: r.filename,
    status: r.status,
    used_g: r.used_weight_g,
    cost: r.used_weight_g * costPerG,
    duration_seconds: r.duration_seconds,
    started_at: r.started_at,
    finished_at: r.finished_at
  }));

  const completedPrints = prints.filter(p => p.status === 'completed');
  const failedPrints = prints.filter(p => p.status === 'failed');

  return {
    spool_id: spoolId,
    total_prints: prints.length,
    completed_prints: completedPrints.length,
    failed_prints: failedPrints.length,
    total_used_g: Math.round(totalUsedG * 100) / 100,
    total_cost_used: Math.round(totalCostUsed * 100) / 100,
    remaining_value: Math.round(remainingValue * 100) / 100,
    cost_per_g: Math.round(costPerG * 1000) / 1000,
    currency: 'NOK',
    avg_per_print_g: completedPrints.length > 0 ? Math.round(completedPrints.reduce((s,p) => s + p.used_g, 0) / completedPrints.length * 100) / 100 : 0,
    total_print_time_s: prints.reduce((s,p) => s + (p.duration_seconds||0), 0),
    waste_from_failed_g: Math.round(failedPrints.reduce((s,p) => s + p.used_g, 0) * 100) / 100,
    prints
  };
}

export function estimateFilamentFromHistory() {
  const db = getDb();
  // Find prints with null filament_used_g that have duration & tray info
  const nullPrints = db.prepare(`
    SELECT ph.id, ph.printer_id, ph.tray_id, ph.duration_seconds, ph.layer_count,
           ph.filament_type, ph.filament_color, ph.filament_brand, ph.status,
           ph.nozzle_diameter, ph.speed_level, ph.filename
    FROM print_history ph
    WHERE ph.filament_used_g IS NULL AND ph.status = 'completed' AND ph.duration_seconds > 0
  `).all();

  if (!nullPrints.length) return { updated: 0, prints: [] };

  // Get average g/second from prints that DO have filament data
  const ref = db.prepare(`
    SELECT AVG(filament_used_g / duration_seconds) as g_per_sec,
           AVG(filament_used_g / NULLIF(layer_count, 0)) as g_per_layer
    FROM print_history
    WHERE filament_used_g > 0 AND duration_seconds > 60 AND status = 'completed'
  `).get();

  const gPerSec = ref?.g_per_sec || 0.02;   // fallback ~72g/hour
  const gPerLayer = ref?.g_per_layer || 0.3; // fallback

  const results = [];
  for (const p of nullPrints) {
    // Estimate: use layer count if available (more accurate), else duration
    let estimatedG;
    if (p.layer_count > 0 && ref?.g_per_layer > 0) {
      estimatedG = p.layer_count * gPerLayer;
    } else {
      estimatedG = p.duration_seconds * gPerSec;
    }
    estimatedG = Math.round(estimatedG * 10) / 10;

    results.push({
      print_id: p.id,
      filename: p.filename,
      tray_id: p.tray_id,
      duration_seconds: p.duration_seconds,
      layer_count: p.layer_count,
      estimated_g: estimatedG,
      method: (p.layer_count > 0 && ref?.g_per_layer > 0) ? 'layer_avg' : 'duration_avg'
    });
  }

  return {
    total_null_prints: nullPrints.length,
    reference_g_per_sec: Math.round(gPerSec * 10000) / 10000,
    reference_g_per_layer: Math.round((gPerLayer || 0) * 1000) / 1000,
    prints: results
  };
}

export function backfillFilamentUsage() {
  const db = getDb();
  // Find prints that have weight but no spool_usage_log entry AND a valid tray
  const missingUsage = db.prepare(`
    SELECT ph.id, ph.printer_id, ph.tray_id, ph.filament_used_g
    FROM print_history ph
    WHERE ph.filament_used_g > 0 AND ph.status = 'completed'
      AND ph.tray_id IS NOT NULL AND CAST(ph.tray_id AS INTEGER) != 255
      AND NOT EXISTS (SELECT 1 FROM spool_usage_log sul WHERE sul.print_history_id = ph.id)
  `).all();

  // Also handle null-weight prints via estimation
  const estimate = estimateFilamentFromHistory();

  let updated = 0;
  let spoolsUpdated = 0;
  const spoolUpdates = {};

  // First: update null-weight prints with estimates
  for (const p of estimate.prints) {
    db.prepare('UPDATE print_history SET filament_used_g = ? WHERE id = ? AND filament_used_g IS NULL')
      .run(p.estimated_g, p.print_id);
    updated++;

    // Find spool for this tray
    const trayNum = parseInt(p.tray_id);
    if (!isNaN(trayNum) && trayNum !== 255) {
      const ph = db.prepare('SELECT printer_id FROM print_history WHERE id = ?').get(p.print_id);
      if (ph) {
        const spool = getSpoolBySlot(ph.printer_id, 0, trayNum);
        if (spool) {
          // Check if already logged
          const existing = db.prepare('SELECT id FROM spool_usage_log WHERE print_history_id = ? AND spool_id = ?').get(p.print_id, spool.id);
          if (!existing) {
            useSpoolWeight(spool.id, p.estimated_g, 'backfill', p.print_id, ph.printer_id);
            if (!spoolUpdates[spool.id]) spoolUpdates[spool.id] = 0;
            spoolUpdates[spool.id] += p.estimated_g;
            spoolsUpdated++;
          }
        }
      }
    }
  }

  // Second: link existing prints (with weight) that have no spool_usage_log
  for (const m of missingUsage) {
    const trayNum = parseInt(m.tray_id);
    if (isNaN(trayNum) || trayNum === 255) continue;
    const spool = getSpoolBySlot(m.printer_id, 0, trayNum);
    if (spool) {
      const existing = db.prepare('SELECT id FROM spool_usage_log WHERE print_history_id = ? AND spool_id = ?').get(m.id, spool.id);
      if (!existing) {
        useSpoolWeight(spool.id, m.filament_used_g, 'backfill', m.id, m.printer_id);
        if (!spoolUpdates[spool.id]) spoolUpdates[spool.id] = 0;
        spoolUpdates[spool.id] += m.filament_used_g;
        spoolsUpdated++;
      }
    }
  }

  return {
    updated,
    spools_updated: spoolsUpdated,
    spool_details: Object.entries(spoolUpdates).map(([id, g]) => ({ spool_id: Number(id), added_g: Math.round(g * 10) / 10 })),
    estimated_prints: estimate.prints,
    linked_prints: missingUsage.length
  };
}

export function syncSpoolWeightsFromLog() {
  const db = getDb();
  // Recalculate used_weight_g and remaining_weight_g from spool_usage_log
  // Use a single SQL UPDATE to avoid any caching/prepared-statement issues
  db.exec(`
    UPDATE spools SET
      used_weight_g = COALESCE((SELECT SUM(used_weight_g) FROM spool_usage_log WHERE spool_id = spools.id), 0),
      remaining_weight_g = MAX(0, initial_weight_g - COALESCE((SELECT SUM(used_weight_g) FROM spool_usage_log WHERE spool_id = spools.id), 0))
    WHERE archived = 0
  `);
  const results = db.prepare('SELECT id as spool_id, ROUND(used_weight_g, 1) as used_g, ROUND(remaining_weight_g, 1) as remaining_g FROM spools WHERE archived = 0').all();
  return results;
}

export function getRecentSpoolEvents(limit = 50) {
  const db = getDb();
  return db.prepare(`SELECT se.*, fp.name AS spool_name FROM spool_events se
    LEFT JOIN spools s ON se.spool_id = s.id
    LEFT JOIN filament_profiles fp ON s.filament_profile_id = fp.id
    ORDER BY se.timestamp DESC LIMIT ?`).all(limit);
}

// ---- Bulk Spool Operations ----

export function bulkDeleteSpools(ids) {
  const db = getDb();
  const placeholders = ids.map(() => '?').join(',');
  db.prepare(`DELETE FROM spools WHERE id IN (${placeholders})`).run(...ids);
}

export function bulkArchiveSpools(ids) {
  const db = getDb();
  const placeholders = ids.map(() => '?').join(',');
  db.prepare(`UPDATE spools SET archived = 1 WHERE id IN (${placeholders})`).run(...ids);
}

export function bulkRelocateSpools(ids, location) {
  const db = getDb();
  const placeholders = ids.map(() => '?').join(',');
  db.prepare(`UPDATE spools SET location = ? WHERE id IN (${placeholders})`).run(location, ...ids);
}

export function bulkMarkDried(ids) {
  const db = getDb();
  const placeholders = ids.map(() => '?').join(',');
  db.prepare(`UPDATE spools SET last_dried_at = datetime('now') WHERE id IN (${placeholders})`).run(...ids);
}

export function bulkEditSpools(ids, fields) {
  const db = getDb();
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

export function bulkStartDrying(ids, opts = {}) {
  const db = getDb();
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

// ---- SpoolEase features ----

export function getSpoolCoreWeights(search) {
  const db = getDb();
  if (search) {
    return db.prepare('SELECT * FROM spool_core_weights WHERE brand_name LIKE ? ORDER BY brand_name')
      .all('%' + search + '%');
  }
  return db.prepare('SELECT * FROM spool_core_weights ORDER BY brand_name').all();
}

export function addSpoolCoreWeight(name, weightG, type) {
  const db = getDb();
  return db.prepare('INSERT OR REPLACE INTO spool_core_weights (brand_name, weight_g, spool_type) VALUES (?, ?, ?)')
    .run(name, weightG, type || 'plastic');
}

export function getBambuFilamentCodes(material) {
  const db = getDb();
  if (material) {
    return db.prepare('SELECT * FROM bambu_filament_codes WHERE material = ? ORDER BY code').all(material);
  }
  return db.prepare('SELECT * FROM bambu_filament_codes ORDER BY code').all();
}

export function lookupBambuCode(code) {
  const db = getDb();
  if (!code) return null;
  return db.prepare('SELECT * FROM bambu_filament_codes WHERE code = ?').get(code);
}

export function getSpoolKCalibrations(spoolId) {
  const db = getDb();
  return db.prepare(`SELECT skc.*, s.tray_id_name, fp.name as profile_name, fp.material
    FROM spool_k_calibrations skc
    LEFT JOIN spools s ON skc.spool_id = s.id
    LEFT JOIN filament_profiles fp ON s.filament_profile_id = fp.id
    WHERE skc.spool_id = ?
    ORDER BY skc.calibrated_at DESC`).all(spoolId);
}

export function upsertSpoolKCalibration(cal) {
  const db = getDb();
  return db.prepare(`INSERT INTO spool_k_calibrations
    (spool_id, printer_id, extruder_id, nozzle_diameter, nozzle_type, k_value, setting_id)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(spool_id, printer_id, extruder_id, nozzle_diameter, nozzle_type) DO UPDATE SET
      k_value = excluded.k_value, setting_id = excluded.setting_id, calibrated_at = datetime('now')`)
    .run(cal.spool_id, cal.printer_id, cal.extruder_id || 0,
      cal.nozzle_diameter || 0.4, cal.nozzle_type || 'standard',
      cal.k_value, cal.setting_id || null);
}

export function getBestKValue(spoolId, printerId, nozzleDiameter, nozzleType) {
  const db = getDb();
  // 1. Exact match for this spool+printer+nozzle
  const exact = db.prepare(`SELECT k_value FROM spool_k_calibrations
    WHERE spool_id = ? AND printer_id = ? AND nozzle_diameter = ? AND nozzle_type = ?
    ORDER BY calibrated_at DESC LIMIT 1`)
    .get(spoolId, printerId, nozzleDiameter || 0.4, nozzleType || 'standard');
  if (exact) return exact.k_value;

  // 2. Same spool, same printer, any nozzle
  const samePrinter = db.prepare(`SELECT k_value FROM spool_k_calibrations
    WHERE spool_id = ? AND printer_id = ? ORDER BY calibrated_at DESC LIMIT 1`)
    .get(spoolId, printerId);
  if (samePrinter) return samePrinter.k_value;

  // 3. Same spool, any printer
  const anySpool = db.prepare(`SELECT k_value FROM spool_k_calibrations
    WHERE spool_id = ? ORDER BY calibrated_at DESC LIMIT 1`).get(spoolId);
  if (anySpool) return anySpool.k_value;

  // 4. Fallback to filament profile
  const spool = db.prepare('SELECT filament_profile_id FROM spools WHERE id = ?').get(spoolId);
  if (spool?.filament_profile_id) {
    const profile = db.prepare('SELECT pressure_advance_k FROM filament_profiles WHERE id = ?').get(spool.filament_profile_id);
    if (profile?.pressure_advance_k) return profile.pressure_advance_k;
  }

  return null;
}

export function recordWeighing(spoolId, grossWeightG) {
  const db = getDb();
  const spool = db.prepare(`SELECT s.*, fp.density, fp.diameter,
    COALESCE(s.spool_weight, v.empty_spool_weight_g, 200) as tare_weight
    FROM spools s
    LEFT JOIN filament_profiles fp ON s.filament_profile_id = fp.id
    LEFT JOIN vendors v ON fp.vendor_id = v.id
    WHERE s.id = ?`).get(spoolId);
  if (!spool) return null;

  // Check spool_core_weights for better tare estimate
  let tareWeight = spool.tare_weight;
  if (!spool.spool_weight) {
    const vendorName = db.prepare(`SELECT v.name FROM vendors v
      JOIN filament_profiles fp ON fp.vendor_id = v.id
      WHERE fp.id = ?`).get(spool.filament_profile_id);
    if (vendorName?.name) {
      const core = db.prepare('SELECT weight_g FROM spool_core_weights WHERE brand_name LIKE ? LIMIT 1')
        .get('%' + vendorName.name + '%');
      if (core) tareWeight = core.weight_g;
    }
  }

  const netFilamentG = Math.max(0, grossWeightG - tareWeight);
  const usedG = Math.max(0, (spool.initial_weight_g || 1000) - netFilamentG);

  db.prepare(`UPDATE spools SET
    remaining_weight_g = ?, used_weight_g = ?,
    consumed_since_weight = 0, last_weighed_at = datetime('now'),
    last_used_at = datetime('now')
    WHERE id = ?`).run(netFilamentG, usedG, spoolId);

  const remainPct = (spool.initial_weight_g || 1000) > 0
    ? Math.round((netFilamentG / (spool.initial_weight_g || 1000)) * 100) : 0;

  return {
    gross_weight_g: grossWeightG,
    tare_weight_g: Math.round(tareWeight),
    net_filament_g: Math.round(netFilamentG),
    used_g: Math.round(usedG),
    remaining_pct: remainPct,
    consumed_since_weight: 0,
    remaining_length_m: weightToLength(netFilamentG, spool.density || 1.24, spool.diameter || 1.75),
  };
}

export function trackConsumedSinceWeight(spoolId, weightG) {
  const db = getDb();
  db.prepare('UPDATE spools SET consumed_since_weight = consumed_since_weight + ? WHERE id = ?')
    .run(weightG, spoolId);
}

export function saveFilamentEstimate(printHistoryId, estimatedG) {
  const db = getDb();
  db.prepare('UPDATE print_history SET estimated_filament_g = ? WHERE id = ?')
    .run(estimatedG, printHistoryId);
}

export function updateFilamentAccuracy(printHistoryId, actualG) {
  const db = getDb();
  const record = db.prepare('SELECT estimated_filament_g FROM print_history WHERE id = ?').get(printHistoryId);
  if (!record?.estimated_filament_g || !actualG) return;
  const accuracy = Math.round((1 - Math.abs(record.estimated_filament_g - actualG) / record.estimated_filament_g) * 1000) / 10;
  db.prepare('UPDATE print_history SET filament_accuracy_pct = ? WHERE id = ?').run(accuracy, printHistoryId);
}

export function getFilamentAccuracyStats() {
  const db = getDb();
  return db.prepare(`SELECT
    filament_type as material,
    COUNT(*) as sample_count,
    ROUND(AVG(filament_accuracy_pct), 1) as avg_accuracy,
    ROUND(MIN(filament_accuracy_pct), 1) as min_accuracy,
    ROUND(MAX(filament_accuracy_pct), 1) as max_accuracy,
    ROUND(AVG(estimated_filament_g), 1) as avg_estimated_g,
    ROUND(AVG(filament_used_g), 1) as avg_actual_g
    FROM print_history
    WHERE estimated_filament_g IS NOT NULL AND filament_used_g IS NOT NULL AND filament_used_g > 0
    GROUP BY filament_type
    ORDER BY sample_count DESC`).all();
}

// ── Bambu Variant Lookup Functions ──

export function getBambuVariants(filters = {}) {
  const db = getDb();
  let sql = 'SELECT * FROM bambu_variants WHERE 1=1';
  const params = [];
  if (filters.material_id) { sql += ' AND material_id = ?'; params.push(filters.material_id); }
  if (filters.material_name) { sql += ' AND material_name = ?'; params.push(filters.material_name); }
  if (filters.search) { sql += ' AND (color_name LIKE ? OR material_name LIKE ? OR variant_id LIKE ?)'; params.push('%'+filters.search+'%', '%'+filters.search+'%', '%'+filters.search+'%'); }
  sql += ' ORDER BY material_name, color_name';
  return db.prepare(sql).all(...params);
}

export function lookupBambuVariant(variantId) {
  const db = getDb();
  if (!variantId) return null;
  return db.prepare('SELECT * FROM bambu_variants WHERE variant_id = ?').get(variantId.trim()) || null;
}

export function lookupBambuByProductCode(productCode) {
  const db = getDb();
  if (!productCode) return null;
  return db.prepare('SELECT * FROM bambu_variants WHERE product_code = ?').get(String(productCode)) || null;
}

export function enrichTrayWithVariant(trayIdName) {
  const db = getDb();
  if (!trayIdName) return null;
  // tray_id_name format: "A00-W0" or "A00-W1" — try exact, then base
  let variant = db.prepare('SELECT * FROM bambu_variants WHERE variant_id = ?').get(trayIdName);
  if (!variant) {
    // Try without trailing digit variations (A00-K00 → A00-K0)
    const base = trayIdName.replace(/(\d)0$/, '$1');
    variant = db.prepare('SELECT * FROM bambu_variants WHERE variant_id = ?').get(base);
  }
  if (!variant) {
    // Fuzzy: match prefix (A00-K matches A00-K0, A00-K1, etc.)
    variant = db.prepare('SELECT * FROM bambu_variants WHERE variant_id LIKE ? ORDER BY variant_id LIMIT 1')
      .get(trayIdName.substring(0, 5) + '%');
  }
  return variant;
}

export function getBambuMaterialNames() {
  const db = getDb();
  return db.prepare('SELECT DISTINCT material_name FROM bambu_variants ORDER BY material_name').all()
    .map(r => r.material_name);
}

export function getBambuColorsByMaterial(materialName) {
  const db = getDb();
  return db.prepare('SELECT variant_id, color_name, color_hex, product_code FROM bambu_variants WHERE material_name = ? ORDER BY color_name')
    .all(materialName);
}
