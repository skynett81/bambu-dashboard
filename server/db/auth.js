import { getDb } from './connection.js';
import { createLogger } from '../logger.js';

const log = createLogger('db:auth');

// ---- User Roles & Permissions ----

export function getRoles() {
  const db = getDb();
  return db.prepare('SELECT * FROM user_roles ORDER BY name').all();
}

export function getRole(id) {
  const db = getDb();
  return db.prepare('SELECT * FROM user_roles WHERE id = ?').get(id) || null;
}

export function addRole(r) {
  const db = getDb();
  const result = db.prepare('INSERT INTO user_roles (name, permissions, description, is_default) VALUES (?, ?, ?, ?)')
    .run(r.name, JSON.stringify(r.permissions || []), r.description || null, r.is_default || 0);
  return Number(result.lastInsertRowid);
}

export function updateRole(id, r) {
  const db = getDb();
  const fields = [];
  const values = [];
  for (const key of ['name', 'description', 'is_default']) {
    if (r[key] !== undefined) { fields.push(`${key} = ?`); values.push(r[key]); }
  }
  if (r.permissions !== undefined) { fields.push('permissions = ?'); values.push(JSON.stringify(r.permissions)); }
  if (fields.length === 0) return;
  values.push(id);
  db.prepare(`UPDATE user_roles SET ${fields.join(', ')} WHERE id = ?`).run(...values);
}

export function deleteRole(id) {
  const db = getDb();
  db.prepare('DELETE FROM user_roles WHERE id = ?').run(id);
}

// ---- Users (DB-backed) ----

export function getUsers() {
  const db = getDb();
  return db.prepare('SELECT u.id, u.username, u.display_name, u.role_id, u.created_at, u.last_login, r.name AS role_name, r.permissions FROM users u LEFT JOIN user_roles r ON u.role_id = r.id ORDER BY u.username').all();
}

export function getUser(id) {
  const db = getDb();
  return db.prepare('SELECT u.id, u.username, u.display_name, u.role_id, u.created_at, u.last_login, r.name AS role_name, r.permissions FROM users u LEFT JOIN user_roles r ON u.role_id = r.id WHERE u.id = ?').get(id) || null;
}

export function getUserByUsername(username) {
  const db = getDb();
  return db.prepare('SELECT u.*, r.name AS role_name, r.permissions FROM users u LEFT JOIN user_roles r ON u.role_id = r.id WHERE u.username = ?').get(username) || null;
}

export function addUser(u) {
  const db = getDb();
  const result = db.prepare('INSERT INTO users (username, password_hash, role_id, display_name) VALUES (?, ?, ?, ?)')
    .run(u.username, u.password_hash, u.role_id || null, u.display_name || null);
  return Number(result.lastInsertRowid);
}

export function updateUser(id, u) {
  const db = getDb();
  const fields = [];
  const values = [];
  // Allowlist controls which columns may be updated. TOTP fields were
  // missing previously, which silently dropped enrolment writes —
  // /api/auth/totp/verify appeared to succeed but `totp_enabled` stayed 0,
  // so MFA was effectively bypassed.
  const ALLOWED = [
    'username', 'password_hash', 'role_id', 'display_name', 'last_login',
    'totp_secret', 'totp_enabled', 'totp_backup_codes',
  ];
  for (const key of ALLOWED) {
    if (u[key] !== undefined) { fields.push(`${key} = ?`); values.push(u[key]); }
  }
  if (fields.length === 0) return;
  values.push(id);
  db.prepare(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`).run(...values);
}

export function deleteUser(id) {
  const db = getDb();
  db.prepare('DELETE FROM users WHERE id = ?').run(id);
}

// ---- API Keys ----

export function getApiKeys() {
  const db = getDb();
  return db.prepare('SELECT id, name, key_prefix, permissions, user_id, last_used, expires_at, active, created_at FROM api_keys ORDER BY created_at DESC').all();
}

export function getApiKeyByHash(hash) {
  const db = getDb();
  return db.prepare('SELECT * FROM api_keys WHERE key_hash = ? AND active = 1').get(hash) || null;
}

export function addApiKey(k) {
  const db = getDb();
  const result = db.prepare('INSERT INTO api_keys (name, key_hash, key_prefix, permissions, user_id, expires_at) VALUES (?, ?, ?, ?, ?, ?)')
    .run(k.name, k.key_hash, k.key_prefix, JSON.stringify(k.permissions || ['*']), k.user_id || null, k.expires_at || null);
  return Number(result.lastInsertRowid);
}

export function updateApiKeyLastUsed(id) {
  const db = getDb();
  db.prepare("UPDATE api_keys SET last_used = datetime('now') WHERE id = ?").run(id);
}

export function deleteApiKey(id) {
  const db = getDb();
  db.prepare('DELETE FROM api_keys WHERE id = ?').run(id);
}

export function deactivateApiKey(id) {
  const db = getDb();
  db.prepare('UPDATE api_keys SET active = 0 WHERE id = ?').run(id);
}

// ---- User Quotas ----

export function getUserQuota(userId) {
  const db = getDb();
  return db.prepare('SELECT * FROM user_quotas WHERE user_id = ?').get(userId) || null;
}

export function upsertUserQuota(userId, updates) {
  const db = getDb();
  const existing = db.prepare('SELECT id FROM user_quotas WHERE user_id = ?').get(userId);
  if (existing) {
    const fields = [];
    const values = [];
    for (const key of ['balance', 'print_quota_daily', 'print_quota_monthly', 'filament_quota_g', 'prints_today', 'prints_this_month', 'filament_used_g', 'last_reset_daily', 'last_reset_monthly']) {
      if (updates[key] !== undefined) { fields.push(`${key} = ?`); values.push(updates[key]); }
    }
    if (fields.length === 0) return existing.id;
    values.push(existing.id);
    db.prepare(`UPDATE user_quotas SET ${fields.join(', ')} WHERE id = ?`).run(...values);
    return existing.id;
  }
  const result = db.prepare('INSERT INTO user_quotas (user_id, balance, print_quota_daily, print_quota_monthly, filament_quota_g) VALUES (?, ?, ?, ?, ?)').run(
    userId, updates.balance || 0, updates.print_quota_daily || 0, updates.print_quota_monthly || 0, updates.filament_quota_g || 0);
  return Number(result.lastInsertRowid);
}

export function addUserTransaction(t) {
  const db = getDb();
  const result = db.prepare('INSERT INTO user_transactions (user_id, type, amount, description, print_history_id) VALUES (?, ?, ?, ?, ?)').run(
    t.user_id, t.type, t.amount, t.description || null, t.print_history_id || null);
  // Update balance
  if (t.type === 'credit') {
    db.prepare('UPDATE user_quotas SET balance = balance + ? WHERE user_id = ?').run(Math.abs(t.amount), t.user_id);
  } else if (t.type === 'debit') {
    db.prepare('UPDATE user_quotas SET balance = balance - ? WHERE user_id = ?').run(Math.abs(t.amount), t.user_id);
  }
  return Number(result.lastInsertRowid);
}

export function getUserTransactions(userId, limit = 50) {
  const db = getDb();
  return db.prepare('SELECT * FROM user_transactions WHERE user_id = ? ORDER BY created_at DESC LIMIT ?').all(userId, limit);
}
