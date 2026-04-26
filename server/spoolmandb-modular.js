/**
 * Modular SpoolmanDB fetcher.
 *
 * The legacy flattened `spoolman_json.json` is what Spoolman itself uses,
 * but the upstream `Donkie/SpoolmanDB` repo exposes richer per-file
 * metadata in `vendors.json`, `materials.json`, and per-vendor
 * `filaments/<vendor>.json` files.
 *
 * This module pulls those three and persists them into:
 *   - `vendors` table (logo_url, country_code, support_email, website)
 *   - `materials_taxonomy` table (density, glass_temp, temp ranges)
 *   - `filament_purge_matrix` table (when materials.json lists purge values)
 *
 * Call `refreshModularSpoolmanDb()` alongside the existing flat-file
 * refresh — they complement each other, they don't replace.
 */

import { getDb } from './db/connection.js';
import { createLogger } from './logger.js';

const log = createLogger('spoolmandb-modular');

const BASE = 'https://raw.githubusercontent.com/Donkie/SpoolmanDB/main';
const VENDORS_URL = `${BASE}/vendors.json`;
const MATERIALS_URL = `${BASE}/materials.json`;

async function _fetchJson(url) {
  const res = await fetch(url, { signal: AbortSignal.timeout(30_000) });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return res.json();
}

function _upsertVendor(db, v) {
  // vendors.name is UNIQUE; upsert enriches existing rows with metadata
  db.prepare(`INSERT INTO vendors (name, website, logo_url, country_code, support_email, extra_fields, created_at)
              VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
              ON CONFLICT(name) DO UPDATE SET
                website = COALESCE(excluded.website, website),
                logo_url = COALESCE(excluded.logo_url, logo_url),
                country_code = COALESCE(excluded.country_code, country_code),
                support_email = COALESCE(excluded.support_email, support_email)`)
    .run(
      v.name || v.id,
      v.website || null,
      v.logo_url || v.logo || null,
      (v.country || v.country_code || '').slice(0, 4) || null,
      v.support_email || null,
      v.extra ? JSON.stringify(v.extra) : null,
    );
}

function _upsertMaterial(db, m) {
  db.prepare(`INSERT INTO materials_taxonomy
              (material, parent_material, category, description, density, glass_temp_c,
               extruder_temp_min, extruder_temp_max, bed_temp_min, bed_temp_max,
               enclosure_required, food_safe, source)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'spoolmandb')
              ON CONFLICT(material) DO UPDATE SET
                parent_material = excluded.parent_material,
                category = excluded.category,
                description = excluded.description,
                density = excluded.density,
                glass_temp_c = excluded.glass_temp_c,
                extruder_temp_min = excluded.extruder_temp_min,
                extruder_temp_max = excluded.extruder_temp_max,
                bed_temp_min = excluded.bed_temp_min,
                bed_temp_max = excluded.bed_temp_max,
                enclosure_required = excluded.enclosure_required,
                food_safe = excluded.food_safe,
                updated_at = datetime('now')`)
    .run(
      m.material || m.name,
      m.parent_material || m.parent || null,
      m.category || null,
      m.description || null,
      typeof m.density === 'number' ? m.density : null,
      typeof m.glass_transition_temp === 'number' ? m.glass_transition_temp : (m.glass_temp_c || null),
      m.extruder_temp?.[0] ?? m.extruder_temp_min ?? null,
      m.extruder_temp?.[1] ?? m.extruder_temp_max ?? null,
      m.bed_temp?.[0] ?? m.bed_temp_min ?? null,
      m.bed_temp?.[1] ?? m.bed_temp_max ?? null,
      m.enclosure_required ? 1 : 0,
      m.food_safe ? 1 : 0,
    );
}

function _importPurgeMatrix(db, materials) {
  // SpoolmanDB materials.json occasionally carries a `purge_values` object:
  //   { "to_material": purge_mm3 }
  const stmt = db.prepare(`INSERT INTO filament_purge_matrix
    (from_material, to_material, purge_volume_mm3, source)
    VALUES (?, ?, ?, 'spoolmandb')
    ON CONFLICT(from_material, to_material, from_color_hex, to_color_hex) DO UPDATE SET
      purge_volume_mm3 = excluded.purge_volume_mm3,
      updated_at = datetime('now')`);
  let count = 0;
  for (const m of materials) {
    const from = m.material || m.name;
    const purge = m.purge_values || m.purge || null;
    if (!from || !purge || typeof purge !== 'object') continue;
    for (const [to, vol] of Object.entries(purge)) {
      if (typeof vol !== 'number' || vol <= 0) continue;
      try { stmt.run(from, to, vol); count++; } catch { /* conflict, skip */ }
    }
  }
  return count;
}

const FILAMENTS_DIR_LISTING = 'https://api.github.com/repos/Donkie/SpoolmanDB/contents/filaments?ref=main';

async function _ghListing(url) {
  const res = await fetch(url, {
    headers: { Accept: 'application/vnd.github.v3+json' },
    signal: AbortSignal.timeout(15_000),
  });
  if (!res.ok) throw new Error(`GitHub listing: HTTP ${res.status}`);
  return res.json();
}

/**
 * Pull the richer per-vendor filament files from SpoolmanDB
 * (`filaments/<vendor>.json`). These carry more metadata than the
 * flat `spoolman_json.json` (per-spool article numbers, per-color
 * swatches, diameter variants).
 */
export async function refreshPerVendorFilaments({ vendorAllowList } = {}) {
  const db = getDb();
  let listing;
  try {
    listing = await _ghListing(FILAMENTS_DIR_LISTING);
  } catch (e) {
    log.warn(`per-vendor filaments listing failed: ${e.message}`);
    return { imported: 0, vendors: 0, error: e.message };
  }

  const files = (Array.isArray(listing) ? listing : []).filter(f => f.name?.endsWith('.json') && f.type === 'file');
  const allow = vendorAllowList ? new Set(vendorAllowList.map(v => v.toLowerCase())) : null;

  const stmt = db.prepare(`INSERT INTO filament_profiles
    (name, vendor_id, material, color_hex, color_name, density, diameter, weight_g, spool_weight_g,
     nozzle_temp_min, nozzle_temp_max, bed_temp_min, bed_temp_max, article_number,
     source, external_id, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'spoolmandb_per_vendor', ?, datetime('now'))
    ON CONFLICT(external_id) DO UPDATE SET
      name = excluded.name,
      material = excluded.material,
      color_hex = excluded.color_hex,
      color_name = excluded.color_name,
      nozzle_temp_min = excluded.nozzle_temp_min,
      nozzle_temp_max = excluded.nozzle_temp_max,
      bed_temp_min = excluded.bed_temp_min,
      bed_temp_max = excluded.bed_temp_max`);

  const resolveVendor = db.prepare('SELECT id FROM vendors WHERE lower(name) = lower(?)');
  const createVendor = db.prepare('INSERT INTO vendors (name, created_at) VALUES (?, datetime(\'now\')) ON CONFLICT(name) DO NOTHING');

  let imported = 0;
  let vendorCount = 0;
  for (const f of files) {
    const vendorName = f.name.replace(/\.json$/, '');
    if (allow && !allow.has(vendorName.toLowerCase())) continue;
    try {
      const raw = await (await fetch(f.download_url, { signal: AbortSignal.timeout(15_000) })).json();
      const entries = Array.isArray(raw) ? raw : (raw.filaments || []);
      if (!Array.isArray(entries)) continue;
      createVendor.run(vendorName);
      const vendorRow = resolveVendor.get(vendorName);
      vendorCount++;
      for (const entry of entries) {
        const mat = entry.material || 'PLA';
        const colors = Array.isArray(entry.colors) ? entry.colors : [{
          name: entry.color_name || 'Default',
          hex: entry.color_hex || null,
        }];
        for (const color of colors) {
          const extId = `smdbpv:${vendorName}:${mat}:${color.name || color.hex || 'x'}`.toLowerCase();
          try {
            stmt.run(
              `${mat} ${color.name || ''}`.trim(),
              vendorRow?.id || null,
              mat,
              color.hex || null,
              color.name || null,
              entry.density || null,
              entry.diameter || 1.75,
              entry.weight || 1000,
              entry.spool_weight || null,
              entry.extruder_temp_range?.[0] ?? entry.extruder_temp_min ?? null,
              entry.extruder_temp_range?.[1] ?? entry.extruder_temp_max ?? null,
              entry.bed_temp_range?.[0] ?? entry.bed_temp_min ?? null,
              entry.bed_temp_range?.[1] ?? entry.bed_temp_max ?? null,
              entry.article_number || null,
              extId,
            );
            imported++;
          } catch { /* skip conflicts */ }
        }
      }
    } catch (e) {
      log.warn(`Per-vendor ${f.name} failed: ${e.message}`);
    }
  }
  log.info(`Imported ${imported} per-vendor filament rows across ${vendorCount} vendors`);
  return { imported, vendors: vendorCount };
}

/**
 * Run one full modular refresh.
 * Returns { vendors, materials, purge_rows } counts on success.
 */
export async function refreshModularSpoolmanDb() {
  const db = getDb();
  const result = { vendors: 0, materials: 0, purge_rows: 0, errors: [] };

  try {
    const vendors = await _fetchJson(VENDORS_URL);
    if (Array.isArray(vendors)) {
      db.exec('BEGIN');
      try { for (const v of vendors) _upsertVendor(db, v); db.exec('COMMIT'); }
      catch (e) { db.exec('ROLLBACK'); throw e; }
      result.vendors = vendors.length;
      log.info(`Upserted ${vendors.length} vendors from SpoolmanDB`);
    }
  } catch (e) {
    log.warn(`Vendor fetch failed: ${e.message}`);
    result.errors.push({ source: 'vendors', message: e.message });
  }

  try {
    const materials = await _fetchJson(MATERIALS_URL);
    if (Array.isArray(materials)) {
      db.exec('BEGIN');
      try { for (const m of materials) _upsertMaterial(db, m); db.exec('COMMIT'); }
      catch (e) { db.exec('ROLLBACK'); throw e; }
      result.materials = materials.length;
      result.purge_rows = _importPurgeMatrix(db, materials);
      log.info(`Upserted ${materials.length} materials + ${result.purge_rows} purge rows`);
    }
  } catch (e) {
    log.warn(`Materials fetch failed: ${e.message}`);
    result.errors.push({ source: 'materials', message: e.message });
  }

  return result;
}
