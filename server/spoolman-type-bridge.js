/**
 * filament_type taxonomy bridge.
 *
 * Spoolman exposes its own `filament_type` taxonomy (PLA, PETG, PA-CF, ...).
 * We have `materials_taxonomy` populated from SpoolmanDB. This module
 * keeps the two synchronised via `spoolman_type_bridge`:
 *
 *   - `spoolmanTypeToLocalMaterial(type)` — remote → local
 *   - `localMaterialToSpoolmanType(material)` — local → remote
 *   - `refreshTypeBridge()` — pull the current filament_type list from
 *     Spoolman, insert any new mappings, and log orphans.
 */

import { getDb } from './db/connection.js';
import { fromConfig as makeSpoolmanClient } from './spoolman-client.js';
import { config } from './config.js';
import { createLogger } from './logger.js';

const log = createLogger('type-bridge');

export function spoolmanTypeToLocalMaterial(type) {
  if (!type) return null;
  const row = getDb().prepare('SELECT local_material FROM spoolman_type_bridge WHERE spoolman_type = ?').get(type);
  return row?.local_material || type; // fallback to the raw type
}

export function localMaterialToSpoolmanType(material) {
  if (!material) return null;
  const row = getDb().prepare('SELECT spoolman_type FROM spoolman_type_bridge WHERE local_material = ?').get(material);
  return row?.spoolman_type || material;
}

export async function refreshTypeBridge() {
  const client = makeSpoolmanClient(config);
  if (!client) return { skipped: 'spoolman_not_configured' };

  let types;
  try { types = await client.listFilamentTypes(); }
  catch (e) { log.warn(`Could not list filament_types: ${e.message}`); return { error: e.message }; }
  if (!Array.isArray(types)) return { error: 'unexpected response' };

  const db = getDb();
  const materials = db.prepare('SELECT material FROM materials_taxonomy').all().map(r => r.material.toLowerCase());
  const upsert = db.prepare(`INSERT INTO spoolman_type_bridge (spoolman_type, local_material, last_synced_at)
                             VALUES (?, ?, datetime('now'))
                             ON CONFLICT(spoolman_type) DO UPDATE SET
                               local_material = excluded.local_material,
                               last_synced_at = excluded.last_synced_at`);

  let mapped = 0, orphans = [];
  for (const t of types) {
    const typeName = typeof t === 'string' ? t : (t?.name || t?.material);
    if (!typeName) continue;
    const matchIdx = materials.indexOf(typeName.toLowerCase());
    if (matchIdx >= 0) {
      upsert.run(typeName, materials[matchIdx]);
      mapped++;
    } else {
      // Store as identity mapping so downstream code still has a row
      upsert.run(typeName, typeName);
      orphans.push(typeName);
    }
  }
  log.info(`Type-bridge refresh: ${mapped} mapped, ${orphans.length} orphan (fallback identity)`);
  return { mapped, orphans };
}
