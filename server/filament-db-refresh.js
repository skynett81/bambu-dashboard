/**
 * Scheduled auto-refresh of the community filament databases.
 *
 * Two sources kept in sync:
 *   - **SpoolmanDB** at https://github.com/Donkie/SpoolmanDB/ — static
 *     community-curated filament list. We pull the same `spoolman_json.json`
 *     that Spoolman itself uses, which is a flattened list of filament
 *     entries with stable schema.
 *   - **3DFilamentProfiles.com** — fetched via the existing
 *     `fetch3dfpData()` in seed-filament-db.js (RSC-format scrape).
 *
 * Refresh cadence: default weekly, configurable via the `filament_db_refresh`
 * config block. Records last-fetched timestamps in the `brand_data_refresh`
 * table so subsequent startups know whether a refresh is due.
 */

import { writeFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { getDb } from './db/connection.js';
import { seedFilamentDatabase } from './seed-filament-db.js';
import { refreshModularSpoolmanDb, refreshPerVendorFilaments } from './spoolmandb-modular.js';
import { syncOrcaSlicerLibrary } from './orcaslicer-library-sync.js';
import { pruneCache } from './filament-image-cache.js';
import { refreshTypeBridge } from './spoolman-type-bridge.js';
import { createLogger } from './logger.js';

const log = createLogger('filament-db-refresh');
const __dir = dirname(fileURLToPath(import.meta.url));

const SPOOLMANDB_URL = 'https://raw.githubusercontent.com/Donkie/SpoolmanDB/main/spoolman_json.json';
const SPOOLMANDB_LOCAL = join(__dir, 'spoolmandb.json');

const DEFAULT_REFRESH_DAYS = 7;

function _getLastFetch(resource) {
  try {
    const row = getDb().prepare('SELECT last_fetched_at, items_imported, status FROM brand_data_refresh WHERE resource = ?').get(resource);
    return row || null;
  } catch { return null; }
}

function _setLastFetch(resource, status, items = 0, error = null) {
  try {
    getDb().prepare(`INSERT INTO brand_data_refresh (resource, last_fetched_at, status, error, items_imported)
                     VALUES (?, ?, ?, ?, ?)
                     ON CONFLICT(resource) DO UPDATE SET
                       last_fetched_at = excluded.last_fetched_at,
                       status = excluded.status,
                       error = excluded.error,
                       items_imported = excluded.items_imported`)
      .run(resource, new Date().toISOString(), status, error, items);
  } catch (e) { log.warn(`Could not record refresh state: ${e.message}`); }
}

function _isDue(resource, minDaysBetween) {
  const last = _getLastFetch(resource);
  if (!last?.last_fetched_at) return true;
  const ageMs = Date.now() - new Date(last.last_fetched_at).getTime();
  return ageMs >= minDaysBetween * 86_400_000;
}

/** Download the latest SpoolmanDB JSON from GitHub, merging new rows. */
export async function refreshSpoolmanDb({ force = false } = {}) {
  if (!force && !_isDue('spoolmandb', DEFAULT_REFRESH_DAYS)) {
    log.info('SpoolmanDB still fresh — skipping');
    return { skipped: true };
  }
  log.info(`Fetching SpoolmanDB from ${SPOOLMANDB_URL}`);
  try {
    const res = await fetch(SPOOLMANDB_URL, { signal: AbortSignal.timeout(30_000) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (!Array.isArray(data)) throw new Error('Expected an array');
    writeFileSync(SPOOLMANDB_LOCAL, JSON.stringify(data, null, 0));
    log.info(`SpoolmanDB updated: ${data.length} entries written to spoolmandb.json`);
    _setLastFetch('spoolmandb', 'ok', data.length);
    return { ok: true, count: data.length };
  } catch (e) {
    log.warn(`SpoolmanDB refresh failed: ${e.message}`);
    _setLastFetch('spoolmandb', 'error', 0, e.message);
    return { ok: false, error: e.message };
  }
}

/** Refresh 3DFilamentProfiles via the existing seed pipeline. */
export async function refresh3DFP({ force = false } = {}) {
  if (!force && !_isDue('3dfp', DEFAULT_REFRESH_DAYS)) {
    log.info('3DFilamentProfiles still fresh — skipping');
    return { skipped: true };
  }
  log.info('Refreshing 3DFilamentProfiles + re-seeding community filaments');
  try {
    const stats = await seedFilamentDatabase({ fetch3dfp: true });
    _setLastFetch('3dfp', 'ok', stats?.threedfp || stats?.upserted || 0);
    return { ok: true, stats };
  } catch (e) {
    log.warn(`3DFilamentProfiles refresh failed: ${e.message}`);
    _setLastFetch('3dfp', 'error', 0, e.message);
    return { ok: false, error: e.message };
  }
}

/**
 * Start the background refresh scheduler.
 * - Runs once 5 minutes after startup so the server boot isn't blocked.
 * - Re-runs every refreshDays (default 7) after that.
 */
export function startFilamentDbScheduler(options = {}) {
  const refreshDays = options.refreshDays || DEFAULT_REFRESH_DAYS;

  const runOnce = async () => {
    await refreshSpoolmanDb();
    await refresh3DFP();
    // Modular vendors/materials pull adds richer metadata on top of the flat refresh
    try { await refreshModularSpoolmanDb(); } catch (e) { log.warn(`Modular SMDB refresh failed: ${e.message}`); }
    // Per-vendor filament files — richer than the flat spoolman_json.json
    try { await refreshPerVendorFilaments(); } catch (e) { log.warn(`Per-vendor SMDB refresh failed: ${e.message}`); }
    // Taxonomy bridge — map Spoolman filament_types to our materials
    try { await refreshTypeBridge(); } catch (e) { log.warn(`Type-bridge refresh failed: ${e.message}`); }
    // Canonical 60+ filament catalogue (lowest-priority seed, runs first)
    try {
      const { seedMaterialsCatalog } = await import('./materials-catalog-seed.js');
      seedMaterialsCatalog();
    } catch (e) { log.warn(`Materials catalog seed failed: ${e.message}`); }
    // KB markdown → materials_taxonomy + kb_filaments enrichment (higher priority — enriches 10 materials with prose)
    try {
      const { importKbMarkdown } = await import('./kb-markdown-importer.js');
      await importKbMarkdown();
    } catch (e) { log.warn(`KB markdown import failed: ${e.message}`); }
    // Extended KB: build-plates, maintenance, troubleshooting
    try {
      const { importExtendedKb } = await import('./kb-extended-importer.js');
      await importExtendedKb();
    } catch (e) { log.warn(`Extended KB import failed: ${e.message}`); }
    // OrcaSlicer community library is large; only run weekly and only when due
    if (_isDue('orcaslicer_library', refreshDays)) {
      try {
        const r = await syncOrcaSlicerLibrary();
        _setLastFetch('orcaslicer_library', 'ok', r.total);
      } catch (e) {
        log.warn(`OrcaSlicer library sync failed: ${e.message}`);
        _setLastFetch('orcaslicer_library', 'error', 0, e.message);
      }
    }
    // Prune old cached filament images (keeps disk usage sane)
    try { pruneCache(); } catch {}
  };

  // Initial run after startup delay
  setTimeout(runOnce, 5 * 60_000);
  // Periodic refresh every refreshDays
  const intervalMs = refreshDays * 86_400_000;
  setInterval(runOnce, intervalMs);
  log.info(`Filament-DB refresh scheduler started (every ${refreshDays} days)`);
}

/** Expose a manual-trigger handler for the admin API. */
export async function forceRefreshAll() {
  const smdb = await refreshSpoolmanDb({ force: true });
  const tdfp = await refresh3DFP({ force: true });
  let modular = null;
  try { modular = await refreshModularSpoolmanDb(); }
  catch (e) { modular = { error: e.message }; }
  let orca = null;
  try {
    orca = await syncOrcaSlicerLibrary();
    _setLastFetch('orcaslicer_library', 'ok', orca.total);
  } catch (e) {
    orca = { error: e.message };
    _setLastFetch('orcaslicer_library', 'error', 0, e.message);
  }
  try { pruneCache(); } catch {}
  return { spoolmandb: smdb, threedfp: tdfp, modular, orcaslicer: orca };
}
