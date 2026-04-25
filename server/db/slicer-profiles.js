/**
 * Slicer profile repository — CRUD over slicer_profiles (migration v135).
 * Stores printer / filament / process presets as JSON blobs the
 * native-slicer engine can consume directly via JSON.parse(settings_json).
 */

import { getDb } from './connection.js';

const COLS = `id, kind, name, vendor, settings_json, is_default, created_at, updated_at`;

export function listProfiles(kind) {
  const db = getDb();
  if (kind) {
    return db.prepare(`SELECT ${COLS} FROM slicer_profiles WHERE kind = ? ORDER BY is_default DESC, name`).all(kind);
  }
  return db.prepare(`SELECT ${COLS} FROM slicer_profiles ORDER BY kind, is_default DESC, name`).all();
}

export function getProfile(id) {
  return getDb().prepare(`SELECT ${COLS} FROM slicer_profiles WHERE id = ?`).get(id);
}

export function getDefaultProfile(kind) {
  return getDb().prepare(`SELECT ${COLS} FROM slicer_profiles WHERE kind = ? AND is_default = 1 LIMIT 1`).get(kind);
}

export function createProfile({ kind, name, vendor, settings, is_default = 0 }) {
  if (!['printer', 'filament', 'process'].includes(kind)) throw new Error("kind must be printer/filament/process");
  if (!name) throw new Error('name required');
  const db = getDb();
  // Only one default per kind — clear the previous default if user is setting one.
  if (is_default) {
    db.prepare('UPDATE slicer_profiles SET is_default = 0 WHERE kind = ?').run(kind);
  }
  const info = db.prepare(`INSERT INTO slicer_profiles
    (kind, name, vendor, settings_json, is_default) VALUES (?, ?, ?, ?, ?)`
  ).run(kind, name, vendor || null, JSON.stringify(settings || {}), is_default ? 1 : 0);
  return getProfile(info.lastInsertRowid);
}

export function updateProfile(id, { name, vendor, settings, is_default }) {
  const db = getDb();
  const existing = getProfile(id);
  if (!existing) return null;

  if (is_default === 1) {
    db.prepare('UPDATE slicer_profiles SET is_default = 0 WHERE kind = ? AND id != ?').run(existing.kind, id);
  }

  const fields = [];
  const args = [];
  if (name !== undefined)        { fields.push('name = ?');          args.push(name); }
  if (vendor !== undefined)      { fields.push('vendor = ?');        args.push(vendor); }
  if (settings !== undefined)    { fields.push('settings_json = ?'); args.push(JSON.stringify(settings)); }
  if (is_default !== undefined)  { fields.push('is_default = ?');    args.push(is_default ? 1 : 0); }
  if (fields.length === 0) return existing;
  fields.push("updated_at = datetime('now')");
  args.push(id);
  db.prepare(`UPDATE slicer_profiles SET ${fields.join(', ')} WHERE id = ?`).run(...args);
  return getProfile(id);
}

export function deleteProfile(id) {
  const info = getDb().prepare('DELETE FROM slicer_profiles WHERE id = ?').run(id);
  return info.changes > 0;
}

/**
 * Merge a printer + filament + process profile into a single settings
 * object the native-slicer engine can consume. Process settings win
 * over filament, which win over printer (so user-tweaked process speeds
 * always apply).
 */
export function mergeProfiles({ printerId, filamentId, processId }) {
  const out = {};
  for (const id of [printerId, filamentId, processId]) {
    if (!id) continue;
    const row = getProfile(id);
    if (!row) continue;
    try { Object.assign(out, JSON.parse(row.settings_json)); } catch { /* skip */ }
  }
  return out;
}
