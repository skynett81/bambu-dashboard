/**
 * G-code snippet library — CRUD helpers for the gcode_snippets table.
 * Snippets are reusable G-code blocks (preheat presets, tool pick macros,
 * calibration routines) shared across all printers in the fleet.
 */

import { getDb } from './connection.js';

const ALLOWED_FIRMWARE = new Set(['auto', 'marlin', 'klipper', 'reprap', 'snapmaker']);

function _validate(s) {
  if (!s.name || !s.name.trim()) throw new Error('name required');
  if (!s.body || !s.body.trim()) throw new Error('body required');
  if (s.firmware && !ALLOWED_FIRMWARE.has(s.firmware)) throw new Error('invalid firmware');
}

export function listGcodeSnippets(filters = {}) {
  let sql = 'SELECT * FROM gcode_snippets WHERE 1=1';
  const args = [];
  if (filters.category) { sql += ' AND category = ?'; args.push(filters.category); }
  if (filters.firmware) { sql += ' AND (firmware = ? OR firmware = ?)'; args.push(filters.firmware, 'auto'); }
  if (filters.search) {
    sql += ' AND (name LIKE ? OR description LIKE ? OR tags LIKE ?)';
    const q = `%${filters.search}%`;
    args.push(q, q, q);
  }
  sql += ' ORDER BY category, name';
  return getDb().prepare(sql).all(...args);
}

export function getGcodeSnippet(id) {
  return getDb().prepare('SELECT * FROM gcode_snippets WHERE id = ?').get(id);
}

export function createGcodeSnippet(snippet) {
  _validate(snippet);
  const result = getDb().prepare(`
    INSERT INTO gcode_snippets (name, category, firmware, description, body, tags, printer_models, is_shared, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
  `).run(
    snippet.name.trim(),
    snippet.category || null,
    snippet.firmware || 'auto',
    snippet.description || null,
    snippet.body,
    snippet.tags || null,
    snippet.printer_models || null,
    snippet.is_shared ? 1 : 0,
  );
  return getGcodeSnippet(result.lastInsertRowid);
}

export function updateGcodeSnippet(id, patch) {
  const existing = getGcodeSnippet(id);
  if (!existing) return null;
  const merged = { ...existing, ...patch };
  _validate(merged);
  getDb().prepare(`
    UPDATE gcode_snippets
    SET name=?, category=?, firmware=?, description=?, body=?, tags=?, printer_models=?, is_shared=?,
        updated_at=datetime('now')
    WHERE id=?
  `).run(
    merged.name.trim(),
    merged.category || null,
    merged.firmware || 'auto',
    merged.description || null,
    merged.body,
    merged.tags || null,
    merged.printer_models || null,
    merged.is_shared ? 1 : 0,
    id,
  );
  return getGcodeSnippet(id);
}

export function deleteGcodeSnippet(id) {
  const result = getDb().prepare('DELETE FROM gcode_snippets WHERE id = ?').run(id);
  return result.changes > 0;
}

export function getGcodeSnippetCategories() {
  return getDb().prepare(
    'SELECT category, COUNT(*) as count FROM gcode_snippets WHERE category IS NOT NULL GROUP BY category ORDER BY category'
  ).all();
}
