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

// Map a printer (model + connector type) to a vendor/brand name.
// Used by telemetry to roll up "Bambu Lab" instead of showing P1P, P2S, X1C
// as separate entries.
function _detectBrand(printer) {
  const model = (printer.model || '').toLowerCase().trim();
  const type = (printer.type || '').toLowerCase();
  if (!model && type === 'moonraker') return 'Generic Klipper';
  if (!model) return 'Bambu Lab'; // empty model + bambu MQTT default
  // Specific connector types map directly
  if (type === 'octoprint') return 'OctoPrint';
  if (type === 'prusalink') return 'Prusa';
  if (type === 'duet') return 'Duet/RRF';
  if (type === 'flashforge') return 'FlashForge';
  if (type === 'repetier') return 'Repetier';
  if (type === 'ankermake') return 'AnkerMake';
  if (type === 'sacp' || type === 'snapmaker-sacp' || type === 'snapmaker-http') return 'Snapmaker';
  // Model-name pattern matching (works for both moonraker and bambu connectors)
  if (/^(snapmaker|sm[\s-]|j1|f250|f350|a150|a250|a350|artisan|original)/i.test(model)) return 'Snapmaker';
  if (/^(p1p|p1s|p2s|p2[a-z]?|x1|x1c|x1e|a1|a1[\s-]?mini|h2[a-z]?)/i.test(model)) return 'Bambu Lab';
  if (/^(mk[2-4]|mini\+?|xl|core[\s-]?one)/i.test(model)) return 'Prusa';
  if (/^(ender|cr-|k[12][a-z]?|k2[\s-]plus|hi[\s-]combo)/i.test(model)) return 'Creality';
  if (/^(neptune|centauri|orangestorm)/i.test(model)) return 'Elegoo';
  if (/^voron/i.test(model)) return 'Voron';
  if (/^(v[\s-]?core|v[\s-]?minion|ratrig)/i.test(model)) return 'RatRig';
  if (/^(q1|q2|x[\s-]?(plus|smart|max)|plus4|qidi)/i.test(model)) return 'QIDI';
  if (/^(adventurer|guider|creator|flashforge|finder)/i.test(model)) return 'FlashForge';
  if (/^(m5[a-z]?|v6[a-z]?|ankermake)/i.test(model)) return 'AnkerMake';
  if (/^duet/i.test(model)) return 'Duet/RRF';
  if (type === 'moonraker') return 'Generic Klipper';
  return 'Other';
}

async function getAggregateStats() {
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
    const brands = {};
    const connectors = {};
    let cloudPrinters = 0;
    for (const p of printers) {
      const m = p.model || 'unknown';
      models[m] = (models[m] || 0) + 1;
      const t = p.type || 'bambu';
      connectors[t] = (connectors[t] || 0) + 1;
      const brand = _detectBrand(p);
      brands[brand] = (brands[brand] || 0) + 1;
      if (p.cloudMode) cloudPrinters++;
    }

    // Print statistics
    let printStats = { total: 0, completed: 0, failed: 0, cancelled: 0, totalDurationH: 0, totalFilamentG: 0, totalWasteG: 0, multiColorPrints: 0, totalColorChanges: 0 };
    try {
      const row = db.prepare(`
        SELECT
          COUNT(*) as total,
          SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
          SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed,
          SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled,
          COALESCE(SUM(duration_seconds), 0) as total_duration_s,
          COALESCE(SUM(filament_used_g), 0) as total_filament_g,
          COALESCE(SUM(waste_g), 0) as total_waste_g,
          COALESCE(SUM(color_changes), 0) as total_color_changes,
          SUM(CASE WHEN color_changes > 0 THEN 1 ELSE 0 END) as multi_color_prints
        FROM print_history
      `).get();
      // Prime-tower waste estimate: rows with at least one color change
      // contribute prime-tower purges. Sum their waste as the estimate.
      let primeTowerWaste = 0;
      try {
        const ptRow = db.prepare("SELECT COALESCE(SUM(waste_g), 0) as g FROM print_history WHERE color_changes > 0").get();
        primeTowerWaste = ptRow?.g || 0;
      } catch {}
      printStats = {
        total: row.total || 0,
        completed: row.completed || 0,
        failed: row.failed || 0,
        cancelled: row.cancelled || 0,
        totalDurationH: Math.round((row.total_duration_s || 0) / 3600),
        totalFilamentKg: Math.round((row.total_filament_g || 0) / 100) / 10,
        totalWasteG: Math.round(row.total_waste_g || 0),
        primeTowerWasteG: Math.round(primeTowerWaste),
        totalColorChanges: row.total_color_changes || 0,
        multiColorPrints: row.multi_color_prints || 0,
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

    // Achievements — earned count + per-category breakdown + earned IDs.
    // Defensive: calculateAchievements() walks all history; on a huge install
    // this can be slow, so wrap defensively. Sent fields:
    //   achievementsEarned, achievementsTotal, achievementsByCategory,
    //   achievementsEarnedIds (semicolon-joined for compact storage)
    let achievementsEarned = 0, achievementsTotal = 0;
    const achievementsByCategory = {};
    let achievementsEarnedIds = '';
    try {
      const { calculateAchievements } = await import('./achievements-stats.js').catch(async () => {
        // Fallback to api-routes export until a dedicated module exists.
        const mod = await import('./api-routes.js');
        return { calculateAchievements: mod.calculateAchievements };
      });
      const list = (typeof calculateAchievements === 'function') ? calculateAchievements() : [];
      if (Array.isArray(list)) {
        achievementsTotal = list.length;
        const ids = [];
        for (const a of list) {
          if (a.earned) {
            achievementsEarned++;
            ids.push(a.id);
            const cat = a.category || 'other';
            achievementsByCategory[cat] = (achievementsByCategory[cat] || 0) + 1;
          }
        }
        // Cap at 4000 chars to stay well within worker sanitize limit.
        achievementsEarnedIds = ids.join(';').substring(0, 4000);
      }
    } catch (e) {
      // ignore — achievements may not be available in test/demo
    }

    // Slicer jobs handled
    let slicerJobs = 0;
    try {
      slicerJobs = db.prepare("SELECT COUNT(*) as c FROM slicer_jobs").get()?.c || 0;
    } catch {}

    return {
      printerCount: printers.length,
      printerModels: models,
      printerBrands: brands,
      printerConnectors: connectors,
      cloudPrinters,
      totalSpools: (spools?.total || 0) + legacyFilamentRows,
      totalSpoolsNew: spools?.total || 0,
      totalSpoolsLegacy: legacyFilamentRows,
      totalProfiles: profiles.length || 0,
      totalPrints: printStats.total,
      completedPrints: printStats.completed,
      failedPrints: printStats.failed,
      cancelledPrints: printStats.cancelled,
      successRate: printStats.total > 0 ? Math.round(printStats.completed / printStats.total * 100) : 0,
      totalPrintHours: printStats.totalDurationH,
      totalFilamentKg: printStats.totalFilamentKg,
      totalWasteG: printStats.totalWasteG,
      primeTowerWasteG: printStats.primeTowerWasteG,
      totalColorChanges: printStats.totalColorChanges,
      multiColorPrints: printStats.multiColorPrints,
      materialTypes,
      queueItems,
      slicerJobs,
      pluginCount,
      achievementsEarned,
      achievementsTotal,
      achievementsByCategory,
      achievementsEarnedIds,
      ecomActive,
      dbVersion,
      installAgeDays,
      language: language || null
    };
  } catch {
    return { printerCount: config.printers?.length || 0 };
  }
}

export async function sendTelemetryPing() {
  // Respect opt-out
  if (process.env.DISABLE_TELEMETRY === 'true' || config.telemetry?.disabled) return;

  const isDemo = process.env.BAMBU_DEMO === 'true';
  const stats = await getAggregateStats();
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
