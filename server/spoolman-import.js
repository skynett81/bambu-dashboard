/**
 * Initial full-import from a Spoolman server.
 *
 * Pulls vendors → filaments → spools and persists them locally. Uses
 * `external_id` to avoid duplicates on re-run: a second import updates
 * existing rows rather than creating a second copy.
 */

import { getDb } from './db/connection.js';
import { fromConfig as makeSpoolmanClient } from './spoolman-client.js';
import { config } from './config.js';
import { createLogger } from './logger.js';

const log = createLogger('spoolman-import');

function _upsertVendor(db, v) {
  const existing = db.prepare('SELECT id FROM vendors WHERE spoolman_id = ? OR name = ?').get(v.id, v.name);
  if (existing) {
    db.prepare(`UPDATE vendors SET
                  website = COALESCE(?, website),
                  comment = COALESCE(?, comment),
                  empty_spool_weight_g = COALESCE(?, empty_spool_weight_g),
                  spoolman_id = ?,
                  spoolman_synced_at = datetime('now')
                WHERE id = ?`)
      .run(v.website || null, v.comment || null, v.empty_spool_weight || null, v.id, existing.id);
    return existing.id;
  }
  const r = db.prepare(`INSERT INTO vendors (name, website, comment, empty_spool_weight_g, spoolman_id, spoolman_synced_at, created_at)
                        VALUES (?, ?, ?, ?, ?, datetime('now'), datetime('now'))`)
    .run(v.name, v.website || null, v.comment || null, v.empty_spool_weight || null, v.id);
  return r.lastInsertRowid;
}

function _upsertProfile(db, f, vendorIdMap) {
  const localVendorId = f.vendor?.id ? vendorIdMap.get(f.vendor.id) : null;
  const existing = db.prepare('SELECT id FROM filament_profiles WHERE spoolman_id = ?').get(f.id);
  const payload = [
    f.name || `${f.material || 'Filament'} ${f.id}`,
    localVendorId,
    f.material || 'PLA',
    f.density || null,
    f.diameter || 1.75,
    f.weight || 1000,
    f.spool_weight || null,
    f.settings_extruder_temp || null,
    f.settings_bed_temp || null,
    f.color_hex || null,
    f.price || null,
    f.article_number || null,
    f.comment || null,
    f.id,                        // spoolman_id
    f.last_used || f.updated_at || null,  // spoolman_updated_at
  ];
  if (existing) {
    db.prepare(`UPDATE filament_profiles SET
                  name = ?, vendor_id = ?, material = ?, density = ?, diameter = ?,
                  weight_g = COALESCE(?, weight_g), spool_weight_g = ?,
                  nozzle_temp_max = ?, bed_temp_max = ?, color_hex = ?,
                  price = ?, article_number = ?, comment = ?,
                  spoolman_id = ?, spoolman_updated_at = ?, spoolman_synced_at = datetime('now')
                WHERE id = ?`).run(...payload, existing.id);
    return existing.id;
  }
  const r = db.prepare(`INSERT INTO filament_profiles
    (name, vendor_id, material, density, diameter, weight_g, spool_weight_g,
     nozzle_temp_max, bed_temp_max, color_hex, price, article_number, comment,
     spoolman_id, spoolman_updated_at, spoolman_synced_at, source, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), 'spoolman', datetime('now'))`)
    .run(...payload);
  return r.lastInsertRowid;
}

function _upsertSpool(db, s, profileIdMap) {
  const localProfileId = s.filament?.id ? profileIdMap.get(s.filament.id) : null;
  const existing = db.prepare('SELECT id FROM spools WHERE external_id = ?').get(s.id);
  const payload = [
    localProfileId,
    s.remaining_weight || 0,
    s.used_weight || 0,
    s.initial_weight || null,
    s.price || null,
    s.lot_nr || null,
    s.purchase_date || null,
    s.location || null,
    !!s.archived ? 1 : 0,
    s.comment || null,
    s.id,                            // external_id
    s.updated_at || s.last_used || null, // spoolman_updated_at
  ];
  if (existing) {
    db.prepare(`UPDATE spools SET
                  filament_profile_id = ?,
                  remaining_weight_g = ?, used_weight_g = ?, initial_weight_g = COALESCE(?, initial_weight_g),
                  cost = ?, lot_number = ?, purchase_date = ?,
                  location = COALESCE(?, location),
                  archived = ?, comment = ?,
                  external_id = ?, spoolman_updated_at = ?, spoolman_synced_at = datetime('now')
                WHERE id = ?`).run(...payload, existing.id);
    return existing.id;
  }
  const r = db.prepare(`INSERT INTO spools
    (filament_profile_id, remaining_weight_g, used_weight_g, initial_weight_g,
     cost, lot_number, purchase_date, location, archived, comment,
     external_id, spoolman_updated_at, spoolman_synced_at, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`)
    .run(...payload);
  return r.lastInsertRowid;
}

export async function importFromSpoolman() {
  const client = makeSpoolmanClient(config);
  if (!client) throw new Error('Spoolman not configured');
  const db = getDb();
  const result = { vendors: 0, filaments: 0, spools: 0 };

  const vendorIdMap = new Map();
  const profileIdMap = new Map();

  const vendors = await client.listVendors();
  if (Array.isArray(vendors)) {
    db.exec('BEGIN');
    try {
      for (const v of vendors) vendorIdMap.set(v.id, _upsertVendor(db, v));
      db.exec('COMMIT');
    } catch (e) { db.exec('ROLLBACK'); throw e; }
    result.vendors = vendors.length;
  }

  const filaments = await client.listFilaments();
  if (Array.isArray(filaments)) {
    db.exec('BEGIN');
    try {
      for (const f of filaments) profileIdMap.set(f.id, _upsertProfile(db, f, vendorIdMap));
      db.exec('COMMIT');
    } catch (e) { db.exec('ROLLBACK'); throw e; }
    result.filaments = filaments.length;
  }

  const spools = await client.listSpools();
  if (Array.isArray(spools)) {
    db.exec('BEGIN');
    try {
      for (const s of spools) _upsertSpool(db, s, profileIdMap);
      db.exec('COMMIT');
    } catch (e) { db.exec('ROLLBACK'); throw e; }
    result.spools = spools.length;
  }

  log.info(`Imported from Spoolman: ${result.vendors} vendors, ${result.filaments} profiles, ${result.spools} spools`);
  return result;
}
