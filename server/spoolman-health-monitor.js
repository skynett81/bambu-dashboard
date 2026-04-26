/**
 * Spoolman health monitor.
 *
 * Pings the configured Spoolman server every few minutes and records
 * the result in `spoolman_health_log`. When the state flips (online→offline
 * or vice-versa), fires a notification through the hub + notification
 * channels so operators know without reloading the UI.
 *
 * Health checks are skipped automatically when Spoolman is not configured.
 */

import { getDb } from './db/connection.js';
import { fromConfig as makeSpoolmanClient } from './spoolman-client.js';
import { config } from './config.js';
import { createLogger } from './logger.js';

const log = createLogger('spoolman-health');

const CHECK_INTERVAL_MS = 3 * 60_000; // every 3 minutes
const LOG_RETENTION_ROWS = 1000;

let _prevOk = null;
let _hub = null;
let _notifier = null;
let _timer = null;

export function setHub(hub) { _hub = hub; }
export function setNotifier(n) { _notifier = n; }

async function _check() {
  const client = makeSpoolmanClient(config);
  if (!client) return;
  const { ok, error } = await client.health();
  try {
    getDb().prepare('INSERT INTO spoolman_health_log (ok, error) VALUES (?, ?)').run(ok ? 1 : 0, error || null);
    // Retention
    getDb().prepare(`DELETE FROM spoolman_health_log WHERE id IN (
      SELECT id FROM spoolman_health_log ORDER BY id DESC LIMIT -1 OFFSET ?
    )`).run(LOG_RETENTION_ROWS);
  } catch (e) { log.warn(`Could not log health: ${e.message}`); }

  if (_prevOk === null) { _prevOk = ok; return; }
  if (ok === _prevOk) return;

  // State flipped — announce it once
  _prevOk = ok;
  const evt = ok ? 'spoolman_back_online' : 'spoolman_offline';
  const msg = ok ? 'Spoolman is reachable again' : `Spoolman is offline: ${error || 'unknown'}`;
  log.info(msg);
  _hub?.broadcast?.('spoolman_health', { ok, error: error || null, changed_at: new Date().toISOString() });
  try { _notifier?.notify?.(evt, { message: msg, ok, error: error || null }); } catch {}
}

export function startSpoolmanHealthMonitor() {
  if (_timer) return;
  // Delay first check 30s so startup order doesn't matter
  setTimeout(_check, 30_000);
  _timer = setInterval(_check, CHECK_INTERVAL_MS);
  log.info(`Spoolman health-monitor started (every ${CHECK_INTERVAL_MS / 1000}s)`);
}

export function stopSpoolmanHealthMonitor() {
  if (_timer) { clearInterval(_timer); _timer = null; }
}

export function getHealthHistory(limit = 100) {
  return getDb().prepare('SELECT * FROM spoolman_health_log ORDER BY id DESC LIMIT ?').all(limit);
}
