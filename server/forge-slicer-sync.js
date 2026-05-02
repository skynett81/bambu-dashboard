/**
 * Forge Slicer profile sync — periodically pulls the profile catalog
 * from the connected fork and mirrors it into the local
 * `slicer_profiles` SQLite table so the user sees the same list in the
 * 3DPrintForge UI as inside the slicer GUI.
 *
 * Imported profiles are tagged with vendor='forge-slicer' so we can
 * distinguish them from user-created or seeded profiles. Removing /
 * renaming them in the fork is reflected on the next sync (rows that
 * disappear get archived rather than deleted, so user assignments
 * survive a slicer restart).
 */

import { createLogger } from './logger.js';
import * as forge from './forge-slicer-client.js';
import { listProfiles, createProfile, updateProfile, deleteProfile } from './db/slicer-profiles.js';
import { getDb } from './db/connection.js';

const log = createLogger('forge-slicer-sync');

const SYNC_INTERVAL_MS = 5 * 60 * 1000; // 5 min — slicer config rarely changes
let _syncTimer = null;
let _lastSync = { at: 0, ok: false, imported: 0, error: null };

/**
 * Run a one-shot sync. Safe to call repeatedly — `slicer_profiles`
 * upserts are idempotent on (kind, name).
 *
 * @returns {Promise<{ok:boolean, imported:number, removed:number, error?:string}>}
 */
export async function syncOnce() {
  if (!forge.getConfig().enabled) {
    _lastSync = { at: Date.now(), ok: false, imported: 0, error: 'disabled' };
    return { ok: false, imported: 0, removed: 0, error: 'disabled' };
  }
  const probe = await forge.probe({ force: false });
  if (!probe.ok) {
    _lastSync = { at: Date.now(), ok: false, imported: 0, error: probe.error || 'unreachable' };
    return { ok: false, imported: 0, removed: 0, error: probe.error };
  }

  let remoteProfiles;
  try {
    remoteProfiles = await forge.listProfiles({ kind: 'all' });
  } catch (e) {
    _lastSync = { at: Date.now(), ok: false, imported: 0, error: e.message };
    return { ok: false, imported: 0, removed: 0, error: e.message };
  }

  const db = getDb();
  // Build a set of (kind, name) keys present on the remote side so we
  // know which local rows to retire.
  const remoteKeys = new Set(remoteProfiles.map(p => `${p.kind}::${p.name}`));

  // Existing forge-sourced rows in our DB.
  const existing = db.prepare("SELECT id, kind, name FROM slicer_profiles WHERE vendor = 'forge-slicer'").all();
  const existingKeys = new Map(existing.map(r => [`${r.kind}::${r.name}`, r.id]));

  let imported = 0;
  let updated = 0;
  for (const p of remoteProfiles) {
    const key = `${p.kind}::${p.name}`;
    const settingsJson = JSON.stringify(p.settings || {});
    if (existingKeys.has(key)) {
      // Update settings only — keep is_default user-controlled.
      try {
        updateProfile(existingKeys.get(key), { settings: p.settings || {} });
        updated++;
      } catch { /* keep going */ }
    } else {
      try {
        createProfile({
          kind: p.kind,
          name: p.name,
          vendor: 'forge-slicer',
          settings: p.settings || {},
          is_default: 0,
        });
        imported++;
      } catch (e) {
        log.warn(`Could not import profile ${key}: ${e.message}`);
      }
    }
  }

  // Profiles in our DB that no longer exist on the remote side: tag
  // them with vendor='forge-slicer-archived' so they stop showing up
  // as active forge profiles but the user still has them historically.
  let removed = 0;
  for (const [key, id] of existingKeys) {
    if (!remoteKeys.has(key)) {
      try {
        db.prepare("UPDATE slicer_profiles SET vendor = 'forge-slicer-archived' WHERE id = ?").run(id);
        removed++;
      } catch { /* ignore */ }
    }
  }

  _lastSync = { at: Date.now(), ok: true, imported, updated, removed, error: null };
  log.info(`Forge profile sync: ${imported} new, ${updated} updated, ${removed} archived (${remoteProfiles.length} total remote)`);
  return { ok: true, imported, updated, removed };
}

export function startAutoSync() {
  if (_syncTimer) return;
  // First run after 30 s so the slicer has time to start.
  setTimeout(() => { syncOnce().catch(() => {}); }, 30_000);
  _syncTimer = setInterval(() => { syncOnce().catch(() => {}); }, SYNC_INTERVAL_MS);
}

export function stopAutoSync() {
  if (_syncTimer) { clearInterval(_syncTimer); _syncTimer = null; }
}

export function lastSync() { return { ..._lastSync }; }
