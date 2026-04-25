/**
 * Scene Composer project repository — CRUD over ai_forge_scenes (v134).
 */

import { getDb } from './connection.js';

const COLS = `id, name, scene_json, thumbnail_path, shape_count, created_at, updated_at`;

export function createScene({ name, scene_json, shape_count = 0 }) {
  const db = getDb();
  const info = db.prepare(`
    INSERT INTO ai_forge_scenes (name, scene_json, shape_count)
    VALUES (?, ?, ?)
  `).run(name || 'Untitled', scene_json, shape_count);
  return getScene(info.lastInsertRowid);
}

export function updateScene(id, { name, scene_json, shape_count }) {
  const db = getDb();
  const fields = [];
  const args = [];
  if (name !== undefined) { fields.push('name = ?'); args.push(name); }
  if (scene_json !== undefined) { fields.push('scene_json = ?'); args.push(scene_json); }
  if (shape_count !== undefined) { fields.push('shape_count = ?'); args.push(shape_count); }
  if (fields.length === 0) return getScene(id);
  fields.push("updated_at = datetime('now')");
  args.push(id);
  db.prepare(`UPDATE ai_forge_scenes SET ${fields.join(', ')} WHERE id = ?`).run(...args);
  return getScene(id);
}

export function getScene(id) {
  return getDb().prepare(`SELECT ${COLS} FROM ai_forge_scenes WHERE id = ?`).get(id);
}

export function listScenes({ limit = 100 } = {}) {
  return getDb().prepare(
    `SELECT ${COLS} FROM ai_forge_scenes ORDER BY updated_at DESC LIMIT ?`
  ).all(Math.min(500, Math.max(1, limit)));
}

export function deleteScene(id) {
  const info = getDb().prepare('DELETE FROM ai_forge_scenes WHERE id = ?').run(id);
  return info.changes > 0;
}
