/**
 * OrcaSlicer Filament Library sync.
 *
 * OrcaSlicer ships community filament profiles in its GitHub repo at
 *   resources/profiles/<Vendor>/filament/*.json
 *
 * We walk the per-vendor `filament_list.json` (which OrcaSlicer itself
 * reads), pull down each referenced filament preset, and persist a
 * structured row in `orcaslicer_filaments`. The raw JSON is also kept so
 * users can import print parameters (nozzle temp ranges, pressure advance,
 * max volumetric speed) into their own Profile rows.
 *
 * Uses the GitHub REST API for directory listings to keep the dependency
 * list thin (no git clone required).
 */

import { getDb } from './db/connection.js';
import { createLogger } from './logger.js';

const log = createLogger('orcaslicer-sync');

const OWNER = 'SoftFever';
const REPO = 'OrcaSlicer';
const BRANCH = 'main';
const PROFILES_PATH = 'resources/profiles';

// Vendors worth prioritising — keeps the first sync fast and avoids
// pulling 300+ vendor directories on every refresh.
const DEFAULT_VENDORS = [
  'BBL', 'Generic', 'Prusa', 'Polymaker', 'Bambu Lab',
  'Creality', 'Elegoo', 'QIDI', 'Snapmaker', 'Voron',
];

async function _gh(path) {
  const url = `https://api.github.com/repos/${OWNER}/${REPO}/contents/${path}?ref=${BRANCH}`;
  const res = await fetch(url, {
    headers: { Accept: 'application/vnd.github.v3+json' },
    signal: AbortSignal.timeout(15_000),
  });
  if (!res.ok) throw new Error(`GitHub ${path}: HTTP ${res.status}`);
  return res.json();
}

async function _raw(path) {
  const url = `https://raw.githubusercontent.com/${OWNER}/${REPO}/${BRANCH}/${path}`;
  const res = await fetch(url, { signal: AbortSignal.timeout(15_000) });
  if (!res.ok) throw new Error(`raw ${path}: HTTP ${res.status}`);
  return res.json();
}

function _upsert(db, row) {
  db.prepare(`INSERT INTO orcaslicer_filaments
              (vendor, name, material, printer_type,
               nozzle_temp_min, nozzle_temp_max, bed_temp_min, bed_temp_max,
               max_volumetric_speed, raw_json, source_url)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
              ON CONFLICT(vendor, name, printer_type) DO UPDATE SET
                material = excluded.material,
                nozzle_temp_min = excluded.nozzle_temp_min,
                nozzle_temp_max = excluded.nozzle_temp_max,
                bed_temp_min = excluded.bed_temp_min,
                bed_temp_max = excluded.bed_temp_max,
                max_volumetric_speed = excluded.max_volumetric_speed,
                raw_json = excluded.raw_json,
                source_url = excluded.source_url,
                updated_at = datetime('now')`)
    .run(
      row.vendor, row.name, row.material || null, row.printer_type || null,
      row.nozzle_temp_min ?? null, row.nozzle_temp_max ?? null,
      row.bed_temp_min ?? null, row.bed_temp_max ?? null,
      row.max_volumetric_speed ?? null,
      row.raw_json, row.source_url || null,
    );
}

// Orca preset arrays look like `[min, max]` or `[single]` or `single-string`.
function _num(v) {
  if (Array.isArray(v)) v = v[0];
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : null;
}
function _numMax(v) {
  if (Array.isArray(v)) v = v[v.length - 1];
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : null;
}

function _parseFilament(vendor, json) {
  // OrcaSlicer presets use either `type = "filament"` or presence of certain keys.
  const name = json.name || json.filament_name || 'unknown';
  return {
    vendor,
    name: String(name),
    material: json.filament_type || json.material || null,
    printer_type: json.compatible_printers_condition
      || (Array.isArray(json.compatible_printers) ? json.compatible_printers.join(',') : null),
    nozzle_temp_min: _num(json.nozzle_temperature_initial_layer || json.temperature || json.nozzle_temperature),
    nozzle_temp_max: _numMax(json.nozzle_temperature_range_high || json.nozzle_temperature),
    bed_temp_min: _num(json.bed_temperature_initial_layer || json.bed_temperature),
    bed_temp_max: _numMax(json.bed_temperature),
    max_volumetric_speed: _num(json.filament_max_volumetric_speed),
    raw_json: JSON.stringify(json),
  };
}

async function _syncVendor(db, vendor) {
  const basePath = `${PROFILES_PATH}/${vendor}/filament`;
  let listing;
  try {
    listing = await _gh(basePath);
  } catch (e) {
    log.warn(`Vendor ${vendor}: ${e.message}`);
    return 0;
  }
  if (!Array.isArray(listing)) return 0;

  const jsonFiles = listing.filter(f => f.type === 'file' && /\.json$/.test(f.name));
  let imported = 0;
  for (const f of jsonFiles) {
    try {
      const data = await _raw(`${basePath}/${f.name}`);
      // Skip non-filament presets (base print/machine presets sit in the same repo)
      if (data.type && data.type !== 'filament') continue;
      const row = _parseFilament(vendor, data);
      row.source_url = f.html_url || `https://github.com/${OWNER}/${REPO}/blob/${BRANCH}/${basePath}/${f.name}`;
      _upsert(db, row);
      imported++;
    } catch (e) {
      log.warn(`Preset ${vendor}/${f.name}: ${e.message}`);
    }
  }
  return imported;
}

/**
 * Sync the OrcaSlicer library. Pass `vendors: [...]` to restrict the
 * scope (default: a curated prioritised list).
 */
export async function syncOrcaSlicerLibrary({ vendors = DEFAULT_VENDORS } = {}) {
  const db = getDb();
  let total = 0;
  const perVendor = {};
  for (const v of vendors) {
    const n = await _syncVendor(db, v);
    perVendor[v] = n;
    total += n;
  }
  log.info(`OrcaSlicer library sync complete: ${total} filaments across ${vendors.length} vendors`);
  return { total, perVendor };
}
