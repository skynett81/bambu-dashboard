// Anonymous telemetry — sends a lightweight ping to track active installations.
// No personal data is collected. Only: install ID, version, platform, and aggregate counts.
// Users can disable telemetry by setting DISABLE_TELEMETRY=true environment variable.

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import { platform, arch, totalmem, cpus, uptime as osUptime, hostname } from 'node:os';
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
  if (config.energy?.provider) flags.push('energy_' + config.energy.provider);
  if (config.homeAssistant?.enabled) flags.push('homeassistant');
  if (config.failureDetection?.enabled) flags.push('failure_detection');
  if (config.printGuard?.enabled) flags.push('print_guard');
  if (config.timelapse?.enabled) flags.push('timelapse');
  if (process.env.PUBLIC_HOST) flags.push('public_host');
  if (process.env.TRUSTED_PROXIES) flags.push('trusted_proxies');
  if (process.env.THINGIVERSE_API_KEY) flags.push('thingiverse');
  if (process.env.SLICER_PATH) flags.push('slicer_bridge');
  if (process.env.BAMBU_REGION && process.env.BAMBU_REGION !== 'eu') {
    flags.push('region_' + process.env.BAMBU_REGION);
  }

  // Enabled notification channels
  const channels = config.notifications?.channels || {};
  for (const [name, ch] of Object.entries(channels)) {
    if (ch?.enabled) flags.push(`notif_${name}`);
  }

  return flags;
}

function getAggregateStats() {
  try {
    const db = getDb();
    const printers = getPrinters();
    const spools = getSpools({});
    const profiles = getFilamentProfiles({});
    const language = getInventorySetting('language');

    // Legacy filament_inventory rows (pre-spools migration). Counted
    // alongside `spools` so total reflects everything the user has, not
    // just the new inventory.
    let legacyFilamentRows = 0;
    try {
      legacyFilamentRows = db.prepare('SELECT COUNT(*) as c FROM filament_inventory').get()?.c || 0;
    } catch {}

    // Printer models + brand/connector type breakdown + cloud usage
    const models = {};
    const connectors = {};
    let cloudPrinters = 0;
    for (const p of printers) {
      const m = p.model || 'unknown';
      models[m] = (models[m] || 0) + 1;
      const t = p.type || 'bambu';
      connectors[t] = (connectors[t] || 0) + 1;
      if (p.cloudMode) cloudPrinters++;
    }

    // Print statistics
    let printStats = { total: 0, completed: 0, failed: 0, cancelled: 0, totalDurationH: 0, totalFilamentG: 0 };
    try {
      const row = db.prepare(`
        SELECT
          COUNT(*) as total,
          SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
          SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed,
          SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled,
          COALESCE(SUM(duration_seconds), 0) as total_duration_s,
          COALESCE(SUM(filament_used_g), 0) as total_filament_g
        FROM print_history
      `).get();
      printStats = {
        total: row.total || 0,
        completed: row.completed || 0,
        failed: row.failed || 0,
        cancelled: row.cancelled || 0,
        totalDurationH: Math.round((row.total_duration_s || 0) / 3600),
        totalFilamentKg: Math.round((row.total_filament_g || 0) / 100) / 10
      };
    } catch {}

    // Database version
    let dbVersion = 0;
    try {
      const v = db.prepare('SELECT MAX(version) as v FROM schema_version').get();
      dbVersion = v?.v || 0;
    } catch {}

    // Material types in use
    let materialTypes = [];
    try {
      materialTypes = db.prepare("SELECT DISTINCT material FROM filament_profiles WHERE material IS NOT NULL AND material != '' ORDER BY material").all().map(r => r.material);
    } catch {}

    // Active queue items
    let queueItems = 0;
    try {
      const q = db.prepare("SELECT COUNT(*) as c FROM queue_items WHERE status = 'pending'").get();
      queueItems = q?.c || 0;
    } catch {}

    // E-commerce license
    let ecomActive = false;
    try {
      const lic = db.prepare("SELECT status FROM ecom_license WHERE id = 1").get();
      ecomActive = lic?.status === 'active';
    } catch {}

    // Days since first print (installation age)
    let installAgeDays = 0;
    try {
      const first = db.prepare('SELECT MIN(started_at) as first FROM print_history').get();
      if (first?.first) {
        installAgeDays = Math.floor((Date.now() - new Date(first.first).getTime()) / 86400000);
      }
    } catch {}

    // Plugin count
    let pluginCount = 0;
    try {
      pluginCount = db.prepare("SELECT COUNT(*) as c FROM plugins WHERE enabled = 1").get()?.c || 0;
    } catch {}

    // Slicer jobs handled
    let slicerJobs = 0;
    try {
      slicerJobs = db.prepare("SELECT COUNT(*) as c FROM slicer_jobs").get()?.c || 0;
    } catch {}

    return {
      printerCount: printers.length,
      printerModels: models,
      printerConnectors: connectors,
      cloudPrinters,
      totalSpools: (spools.length || 0) + legacyFilamentRows,
      totalSpoolsNew: spools.length || 0,
      totalSpoolsLegacy: legacyFilamentRows,
      totalProfiles: profiles.length || 0,
      totalPrints: printStats.total,
      completedPrints: printStats.completed,
      failedPrints: printStats.failed,
      cancelledPrints: printStats.cancelled,
      successRate: printStats.total > 0 ? Math.round(printStats.completed / printStats.total * 100) : 0,
      totalPrintHours: printStats.totalDurationH,
      totalFilamentKg: printStats.totalFilamentKg,
      materialTypes,
      queueItems,
      slicerJobs,
      pluginCount,
      ecomActive,
      dbVersion,
      installAgeDays,
      language: language || null
    };
  } catch {
    return { printerCount: config.printers?.length || 0 };
  }
}

export function sendTelemetryPing() {
  // Respect opt-out
  if (process.env.DISABLE_TELEMETRY === 'true' || config.telemetry?.disabled) return;

  const isDemo = process.env.BAMBU_DEMO === 'true';
  const stats = getAggregateStats();
  const cpu = cpus();

  const payload = {
    schemaVersion: 2,
    id: getInstallId(),
    version: getVersion(),
    platform: detectPlatform(),
    nodeVersion: process.versions.node,
    arch: arch(),
    cpuModel: cpu[0]?.model || null,
    cpuCores: cpu.length || 0,
    ramGb: Math.round(totalmem() / (1024 ** 3)),
    uptimeH: Math.round(osUptime() / 3600),
    processUptimeH: Math.round(process.uptime() / 3600),
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
