/**
 * Seed the canonical 60+ filament material catalogue into
 * `materials_taxonomy`. Runs on startup and can be re-run via an API route.
 *
 * Upsert policy: fills in blanks, updates description/temps only when the
 * existing row came from a lower-priority source (kb_markdown < catalog <
 * spoolmandb). `source` column records which layer populated the row.
 */

import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { getDb } from './db/connection.js';
import { createLogger } from './logger.js';

const log = createLogger('materials-catalog');
const __dir = dirname(fileURLToPath(import.meta.url));
const CATALOG_FILE = join(__dir, 'data', 'materials-catalog.json');

// Lower index = lower priority. kb_markdown gives full prose descriptions
// but is limited to ~10 materials; catalog covers 60+ but with terser data;
// spoolmandb is authoritative for properties (density, glass temp, food_safe).
const SOURCE_PRIORITY = { kb_markdown: 1, catalog: 2, spoolmandb: 3 };

function _priority(source) { return SOURCE_PRIORITY[source] || 0; }

function _upsert(db, row) {
  const existing = db.prepare('SELECT source FROM materials_taxonomy WHERE material = ?').get(row.material);
  if (!existing) {
    db.prepare(`INSERT INTO materials_taxonomy
                  (material, parent_material, category, description, density, glass_temp_c,
                   extruder_temp_min, extruder_temp_max, bed_temp_min, bed_temp_max,
                   enclosure_required, food_safe, source)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'catalog')`)
      .run(row.material, row.parent_material || null, row.category || null, row.description || null,
           row.density || null, row.glass_temp_c || null,
           row.extruder_temp_min || null, row.extruder_temp_max || null,
           row.bed_temp_min || null, row.bed_temp_max || null,
           row.enclosure_required ? 1 : 0, row.food_safe ? 1 : 0);
    return 'inserted';
  }
  // Existing source has higher priority? Only fill blanks.
  if (_priority(existing.source) >= _priority('catalog')) {
    db.prepare(`UPDATE materials_taxonomy SET
                  parent_material = COALESCE(parent_material, ?),
                  category = COALESCE(category, ?),
                  description = COALESCE(description, ?),
                  density = COALESCE(density, ?),
                  glass_temp_c = COALESCE(glass_temp_c, ?),
                  food_safe = COALESCE(food_safe, ?)
                WHERE material = ?`)
      .run(row.parent_material || null, row.category || null, row.description || null,
           row.density || null, row.glass_temp_c || null,
           row.food_safe ? 1 : 0, row.material);
    return 'merged';
  }
  // Same or lower priority — overwrite everything except the material name.
  db.prepare(`UPDATE materials_taxonomy SET
                parent_material = ?, category = ?, description = ?,
                density = ?, glass_temp_c = ?,
                extruder_temp_min = ?, extruder_temp_max = ?,
                bed_temp_min = ?, bed_temp_max = ?,
                enclosure_required = ?, food_safe = ?, source = 'catalog',
                updated_at = datetime('now')
              WHERE material = ?`)
    .run(row.parent_material || null, row.category || null, row.description || null,
         row.density || null, row.glass_temp_c || null,
         row.extruder_temp_min || null, row.extruder_temp_max || null,
         row.bed_temp_min || null, row.bed_temp_max || null,
         row.enclosure_required ? 1 : 0, row.food_safe ? 1 : 0, row.material);
  return 'updated';
}

export function seedMaterialsCatalog() {
  const raw = JSON.parse(readFileSync(CATALOG_FILE, 'utf8'));
  const materials = raw.materials || [];
  const db = getDb();
  const counts = { inserted: 0, merged: 0, updated: 0 };

  db.exec('BEGIN');
  try {
    for (const row of materials) {
      const result = _upsert(db, row);
      counts[result]++;
    }
    db.exec('COMMIT');
  } catch (e) {
    db.exec('ROLLBACK');
    throw e;
  }
  log.info(`Materials catalogue seed: ${counts.inserted} inserted, ${counts.merged} merged, ${counts.updated} updated (total ${materials.length})`);
  return { total: materials.length, ...counts };
}
