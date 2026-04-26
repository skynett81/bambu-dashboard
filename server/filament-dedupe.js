/**
 * Duplicate filament-profile detection and merge.
 *
 * The same filament can arrive from 3 different community sources:
 *   - SpoolmanDB (community curated)
 *   - 3DFilamentProfiles.com (community curated + TD rating)
 *   - OrcaSlicer Filament Library (shipped with the slicer)
 *
 * We consider two profiles duplicates when ALL of the following match:
 *   - same vendor (case-insensitive)
 *   - same material code (PLA, PETG, ...)
 *   - same display colour (color_hex) OR same color_name when hex is missing
 *
 * On merge, the canonical row keeps the earliest inserted id (so any
 * foreign-key references — user's spools — stay stable). Other rows get
 * their `duplicate_of` column pointed at the canonical one and their
 * source tag appended to `merged_sources`.
 */

import { getDb } from './db/connection.js';
import { createLogger } from './logger.js';

const log = createLogger('filament-dedupe');

function _normalize(s) { return String(s || '').trim().toLowerCase(); }

function _fingerprint(row) {
  return [
    _normalize(row.vendor_name || row.manufacturer),
    _normalize(row.material),
    _normalize(row.color_hex) || _normalize(row.color_name),
  ].join('|');
}

/**
 * Scan the filament_profiles table for duplicates and link the extras to
 * the canonical row. Returns { scanned, merged }.
 */
export function detectAndLinkDuplicates() {
  const db = getDb();
  // Only consider active (non-duplicate) rows as potential canonicals
  const rows = db.prepare(`SELECT fp.id, fp.material, fp.color_hex, fp.color_name, fp.source, fp.duplicate_of,
                                  fp.merged_sources, v.name AS vendor_name
                           FROM filament_profiles fp
                           LEFT JOIN vendors v ON v.id = fp.vendor_id
                           WHERE fp.duplicate_of IS NULL`).all();

  const byFp = new Map(); // fingerprint → canonical row id
  const updateDup = db.prepare('UPDATE filament_profiles SET duplicate_of = ?, merged_sources = ? WHERE id = ?');
  const updateCanon = db.prepare('UPDATE filament_profiles SET merged_sources = ? WHERE id = ?');
  let merged = 0;

  for (const row of rows) {
    const fp = _fingerprint(row);
    if (!fp || fp.split('|').filter(Boolean).length < 2) continue;

    const canonical = byFp.get(fp);
    if (!canonical) {
      byFp.set(fp, row);
      continue;
    }

    // Merge row into canonical: append source and link
    const merged_sources = new Set(String(canonical.merged_sources || '').split(',').filter(Boolean));
    merged_sources.add(canonical.source || 'unknown');
    merged_sources.add(row.source || 'unknown');

    updateCanon.run([...merged_sources].join(','), canonical.id);
    updateDup.run(canonical.id, [...merged_sources].join(','), row.id);
    canonical.merged_sources = [...merged_sources].join(',');
    merged++;
  }

  log.info(`Scanned ${rows.length} profiles, merged ${merged} duplicates`);
  return { scanned: rows.length, merged };
}

/** Return all profiles flagged as duplicates of a given canonical id. */
export function getDuplicatesFor(canonicalId) {
  return getDb().prepare('SELECT id, source, color_name FROM filament_profiles WHERE duplicate_of = ?').all(canonicalId);
}
