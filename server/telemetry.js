// Anonymous telemetry — sends a lightweight ping to track active installations
// No personal data is collected. Only: install ID, version, platform, node version, and aggregate counts.

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import { platform, arch, totalmem } from 'node:os';
import { config, ROOT_DIR, DATA_DIR } from './config.js';
import { getPrinters, getSpools, getFilamentProfiles, getInventorySetting } from './database.js';
import { getDb } from './db/connection.js';

const TELEMETRY_URL = 'https://telemetry.geektech.no/ping';
const ID_FILE = join(DATA_DIR, '.install-id');

function getInstallId() {
  try {
    if (existsSync(ID_FILE)) {
      return readFileSync(ID_FILE, 'utf-8').trim();
    }
  } catch { /* ignore */ }

  const id = randomUUID();
  try {
    writeFileSync(ID_FILE, id);
  } catch { /* ignore */ }
  return id;
}

function detectPlatform() {
  if (existsSync('/.dockerenv')) return 'docker';
  try {
    const cgroup = readFileSync('/proc/1/cgroup', 'utf-8');
    if (cgroup.includes('docker') || cgroup.includes('containerd')) return 'docker';
  } catch { /* not docker */ }
  if (process.env.P_SERVER_UUID || process.env.PTERODACTYL) return 'pterodactyl';
  return platform();
}

function getVersion() {
  try {
    const pkg = JSON.parse(readFileSync(join(ROOT_DIR, 'package.json'), 'utf-8'));
    return pkg.version || '0.0.0';
  } catch {
    return '0.0.0';
  }
}

function getEnabledFeatures() {
  const flags = [];
  if (config.auth?.enabled) flags.push('auth');
  if (config.camera?.enabled) flags.push('camera');
  if (config.notifications?.enabled) flags.push('notifications');
  if (config.spoolman?.enabled) flags.push('spoolman');
  if (config.server?.forceHttps !== false) flags.push('https');

  // Enabled notification channels
  const channels = config.notifications?.channels || {};
  for (const [name, ch] of Object.entries(channels)) {
    if (ch?.enabled) flags.push(`notif_${name}`);
  }

  return flags;
}

function getAggregateStats() {
  try {
    const printers = getPrinters();
    const spools = getSpools({});
    const profiles = getFilamentProfiles({});
    const language = getInventorySetting('language');

    // Count printer models
    const models = {};
    for (const p of printers) {
      const m = p.model || 'unknown';
      models[m] = (models[m] || 0) + 1;
    }

    // Count prints
    let totalPrints = 0;
    let completedPrints = 0;
    try {
      const db = getDb();
      const counts = db.prepare("SELECT COUNT(*) as total, SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed FROM print_history").get();
      totalPrints = counts.total || 0;
      completedPrints = counts.completed || 0;
    } catch {}

    return {
      printerCount: printers.length,
      printerModels: models,
      totalSpools: spools.length || 0,
      totalPrints,
      completedPrints,
      totalProfiles: profiles.length || 0,
      language: language || null
    };
  } catch {
    return { printerCount: config.printers?.length || 0 };
  }
}

export function sendTelemetryPing() {
  const isDemo = process.env.BAMBU_DEMO === 'true';
  const stats = getAggregateStats();

  const payload = {
    id: getInstallId(),
    version: getVersion(),
    platform: detectPlatform(),
    nodeVersion: process.versions.node,
    arch: arch(),
    ramGb: Math.round(totalmem() / (1024 ** 3)),
    demo: isDemo,
    features: getEnabledFeatures(),
    ...stats
  };

  // Fire-and-forget — never block startup, never throw
  fetch(TELEMETRY_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(10000)
  }).catch(() => { /* silent fail */ });
}
