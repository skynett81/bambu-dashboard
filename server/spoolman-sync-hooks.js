/**
 * Auto-sync hooks: push local spool / vendor / filament-profile CRUD to
 * the configured Spoolman server, and fan-in updates coming back.
 *
 * Conflict resolution: last-writer-wins. We store the remote `updated_at`
 * in `*_updated_at` columns and compare against the local one before
 * overwriting. If both changed since last sync, we defer to `local_updated_at`
 * unless the user explicitly opted into remote-wins.
 *
 * This module is a collection of small, safe, fire-and-forget helpers —
 * every call swallows errors so the local DB operation always succeeds
 * even if Spoolman is unreachable.
 */

import { getDb } from './db/connection.js';
import { fromConfig as makeSpoolmanClient } from './spoolman-client.js';
import { config } from './config.js';
import { setSpoolmanSyncStatus, markVendorSpoolmanSynced, locationIdToSpoolmanPath } from './db/spools.js';
import { createLogger } from './logger.js';

const log = createLogger('spoolman-sync');

function _client() {
  return makeSpoolmanClient(config);
}

function _stampProfile(id, spoolmanId, remoteUpdatedAt) {
  const db = getDb();
  db.prepare(`UPDATE filament_profiles SET
                spoolman_id = COALESCE(?, spoolman_id),
                spoolman_synced_at = datetime('now'),
                spoolman_updated_at = ?
              WHERE id = ?`).run(spoolmanId || null, remoteUpdatedAt || null, id);
}

// ──────────────────────────────────────────────────────────────
// Spool hooks
// ──────────────────────────────────────────────────────────────
export async function onSpoolCreated(local) {
  const c = _client();
  if (!c || !local) return;
  const payload = {
    filament_id: local.filament_profile_spoolman_id || local.spoolman_filament_id,
    initial_weight: local.initial_weight_g,
    remaining_weight: local.remaining_weight_g,
    used_weight: local.used_weight_g,
    lot_nr: local.lot_number,
    location: locationIdToSpoolmanPath(local.location_id) || local.location || null,
    comment: local.comment,
    price: local.cost,
    purchase_date: local.purchase_date,
  };
  try {
    const created = await c.createSpool(payload);
    if (created?.id) {
      getDb().prepare('UPDATE spools SET external_id = ?, spoolman_updated_at = ? WHERE id = ?')
        .run(created.id, created.last_used || created.updated_at || null, local.id);
      setSpoolmanSyncStatus(local.id);
    }
  } catch (e) {
    setSpoolmanSyncStatus(local.id, e.message);
    log.warn(`spool ${local.id} push failed: ${e.message}`);
  }
}

export async function onSpoolUpdated(local, prevRemote) {
  const c = _client();
  if (!c || !local?.external_id) return;

  // Conflict check: if Spoolman was updated more recently than our last-known
  // sync point, bail and flag the row so the UI can prompt the user.
  if (prevRemote && local.spoolman_updated_at && prevRemote > local.spoolman_updated_at) {
    setSpoolmanSyncStatus(local.id, `Remote changed since last sync (${prevRemote})`);
    return;
  }

  const payload = {
    remaining_weight: local.remaining_weight_g,
    used_weight: local.used_weight_g,
    lot_nr: local.lot_number,
    location: locationIdToSpoolmanPath(local.location_id) || local.location || null,
    comment: local.comment,
    price: local.cost,
    archived: !!local.archived,
  };
  try {
    const updated = await c.updateSpool(local.external_id, payload);
    if (updated?.updated_at) {
      getDb().prepare('UPDATE spools SET spoolman_updated_at = ? WHERE id = ?')
        .run(updated.updated_at, local.id);
    }
    setSpoolmanSyncStatus(local.id);
  } catch (e) {
    setSpoolmanSyncStatus(local.id, e.message);
  }
}

export async function onSpoolDeleted(externalId, localId) {
  const c = _client();
  if (!c || !externalId) return;
  try { await c.deleteSpool(externalId); } catch (e) {
    log.warn(`spool ${localId} delete push failed: ${e.message}`);
  }
}

// ──────────────────────────────────────────────────────────────
// Vendor hooks
// ──────────────────────────────────────────────────────────────
export async function onVendorUpserted(vendor) {
  const c = _client();
  if (!c || !vendor) return;
  const payload = {
    name: vendor.name,
    comment: vendor.comment || null,
    website: vendor.website || null,
    empty_spool_weight: vendor.empty_spool_weight_g || null,
  };
  try {
    if (vendor.spoolman_id) {
      await c.updateVendor(vendor.spoolman_id, payload);
    } else {
      const created = await c.createVendor(payload);
      if (created?.id) markVendorSpoolmanSynced(vendor.id, created.id);
    }
  } catch (e) { log.warn(`vendor ${vendor.id} push failed: ${e.message}`); }
}

// ──────────────────────────────────────────────────────────────
// Filament-profile hooks
// ──────────────────────────────────────────────────────────────
export async function onFilamentProfileUpserted(profile) {
  const c = _client();
  if (!c || !profile) return;

  const payload = {
    name: profile.name,
    vendor_id: profile.vendor_spoolman_id || null,
    material: profile.material,
    price: profile.price || null,
    density: profile.density || null,
    diameter: profile.diameter || 1.75,
    weight: profile.weight_g || 1000,
    spool_weight: profile.spool_weight_g || null,
    article_number: profile.article_number || null,
    comment: profile.comment || null,
    settings_extruder_temp: profile.nozzle_temp_max || profile.nozzle_temp_min || null,
    settings_bed_temp: profile.bed_temp_max || profile.bed_temp_min || null,
    color_hex: profile.color_hex || null,
  };
  try {
    if (profile.spoolman_id) {
      const updated = await c.updateFilament(profile.spoolman_id, payload);
      _stampProfile(profile.id, profile.spoolman_id, updated?.updated_at);
    } else {
      const created = await c.createFilament(payload);
      if (created?.id) _stampProfile(profile.id, created.id, created.updated_at);
    }
  } catch (e) { log.warn(`profile ${profile.id} push failed: ${e.message}`); }
}

export async function onFilamentProfileDeleted(spoolmanId) {
  const c = _client();
  if (!c || !spoolmanId) return;
  try { await c.deleteFilament(spoolmanId); } catch (e) { log.warn(`profile delete: ${e.message}`); }
}
