import crypto from 'node:crypto';
import { config, saveConfig } from './config.js';
import { getUserByUsername, updateUser, getApiKeyByHash, updateApiKeyLastUsed } from './database.js';

// In-memory session store: Map<token, { createdAt, username, userId, roleId, roleName, permissions, displayName }>
const sessions = new Map();
let _cleanupInterval = null;

// ---- Password hashing (scrypt) ----

const SCRYPT_KEYLEN = 64;
const SCRYPT_COST = 16384;

export function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(password, salt, SCRYPT_KEYLEN, { N: SCRYPT_COST });
  return `scrypt:${salt}:${derived.toString('hex')}`;
}

function verifyPassword(password, stored) {
  if (stored.startsWith('scrypt:')) {
    const [, salt, hash] = stored.split(':');
    const derived = crypto.scryptSync(password, salt, SCRYPT_KEYLEN, { N: SCRYPT_COST });
    return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), derived);
  }
  // Legacy plaintext comparison (for migration) — constant-time
  const a = Buffer.from(password);
  const b = Buffer.from(stored);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

function migratePasswords() {
  let changed = false;

  // Migrate legacy single-user password
  if (config.auth?.password && !config.auth.password.startsWith('scrypt:')) {
    config.auth.password = hashPassword(config.auth.password);
    changed = true;
  }

  // Migrate multi-user passwords
  if (config.auth?.users?.length > 0) {
    for (const user of config.auth.users) {
      if (user.password && !user.password.startsWith('scrypt:')) {
        user.password = hashPassword(user.password);
        changed = true;
      }
    }
  }

  if (changed) {
    saveConfig({ auth: config.auth });
    console.log('[auth] Passwords migrated to scrypt hashes');
  }
}

export function initAuth() {
  const durationMs = (config.auth?.sessionDurationHours || 24) * 3600000;
  _cleanupInterval = setInterval(() => {
    const now = Date.now();
    for (const [token, session] of sessions) {
      if (now - session.createdAt > durationMs) {
        sessions.delete(token);
      }
    }
  }, 15 * 60 * 1000);

  // Auto-migrate plaintext passwords to hashed
  if (isAuthEnabled()) {
    migratePasswords();
    console.log('[auth] Authentication enabled');
  }
}

export function shutdownAuth() {
  if (_cleanupInterval) clearInterval(_cleanupInterval);
}

export function isAuthEnabled() {
  if (!config.auth?.enabled) return false;
  // Multi-user mode or legacy single-user mode
  return !!(config.auth.users?.length > 0 || config.auth.password);
}

export function isMultiUser() {
  return !!(config.auth?.users?.length > 0);
}

export function validateCredentials(password, username) {
  if (!isAuthEnabled()) return false;

  // Multi-user mode: check against users array
  if (config.auth.users?.length > 0) {
    return config.auth.users.some(u => u.username === username && verifyPassword(password, u.password));
  }

  // Legacy single-user mode
  if (!verifyPassword(password, config.auth.password)) return false;
  if (config.auth.username && username !== config.auth.username) return false;
  return true;
}

export function createSession(userOrUsername) {
  const token = crypto.randomBytes(32).toString('hex');
  const isObj = userOrUsername && typeof userOrUsername === 'object';
  const perms = isObj && userOrUsername.permissions
    ? (typeof userOrUsername.permissions === 'string' ? JSON.parse(userOrUsername.permissions) : userOrUsername.permissions)
    : ['*'];
  sessions.set(token, {
    createdAt: Date.now(),
    username: isObj ? userOrUsername.username : (userOrUsername || null),
    userId: isObj ? (userOrUsername.id || null) : null,
    roleId: isObj ? (userOrUsername.role_id || null) : null,
    roleName: isObj ? (userOrUsername.role_name || null) : null,
    permissions: perms,
    displayName: isObj ? (userOrUsername.display_name || null) : null
  });
  return token;
}

export function validateSession(token) {
  if (!token) return false;
  const session = sessions.get(token);
  if (!session) return false;

  const durationMs = (config.auth?.sessionDurationHours || 24) * 3600000;
  if (Date.now() - session.createdAt > durationMs) {
    sessions.delete(token);
    return false;
  }
  return true;
}

export function destroySession(token) {
  sessions.delete(token);
}

export function getSessionToken(req) {
  // 1. Check cookie
  const cookies = req.headers.cookie || '';
  const match = cookies.match(/bambu_session=([a-f0-9]{64})/);
  if (match) return match[1];

  // 2. Check query param (for WebSocket or external clients)
  try {
    const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    const token = url.searchParams.get('token');
    if (token && /^[a-f0-9]{64}$/.test(token)) return token;
  } catch {}

  return null;
}

// Paths that bypass auth
const PUBLIC_PATHS = new Set([
  '/login.html',
  '/assets/favicon.svg'
]);

export function isPublicPath(pathname) {
  if (PUBLIC_PATHS.has(pathname)) return true;
  if (pathname.startsWith('/api/auth/')) return true;
  if (pathname === '/status.html' || pathname === '/api/status/public') return true;
  return false;
}

// ---- DB-backed user validation ----

export function validateCredentialsDB(username, password) {
  const user = getUserByUsername(username);
  if (!user) return null;
  if (!verifyPassword(password, user.password_hash)) return null;
  updateUser(user.id, { last_login: new Date().toISOString() });
  return user;
}

// ---- API Key authentication ----

export function validateApiKey(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;

  const key = authHeader.substring(7);
  const hash = crypto.createHash('sha256').update(key).digest('hex');
  const apiKey = getApiKeyByHash(hash);
  if (!apiKey) return null;

  // Check expiration
  if (apiKey.expires_at && new Date(apiKey.expires_at) < new Date()) return null;

  updateApiKeyLastUsed(apiKey.id);
  return apiKey;
}

export function generateApiKey() {
  const key = crypto.randomBytes(32).toString('hex');
  const hash = crypto.createHash('sha256').update(key).digest('hex');
  const prefix = key.substring(0, 8);
  return { key, hash, prefix };
}

// ---- Permission checking ----

export function hasPermission(permissions, required) {
  if (!permissions) return false;
  const perms = typeof permissions === 'string' ? JSON.parse(permissions) : permissions;
  if (perms.includes('*')) return true;
  return perms.includes(required);
}

export function getSessionUser(token) {
  if (!token) return null;
  return sessions.get(token) || null;
}

// ---- Request-level permission helpers ----

export function getRequestUser(req) {
  return req._user || null;
}

export function requirePermission(req, permission) {
  if (!isAuthEnabled()) return true;
  const user = getRequestUser(req);
  if (!user) return false;
  return hasPermission(user.permissions, permission);
}
