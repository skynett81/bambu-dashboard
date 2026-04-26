// 3DPrintForge Telemetry Worker
// Cloudflare Worker + D1 — anonymous installation tracking

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: CORS_HEADERS });
    }

    const url = new URL(request.url);

    try {
      if (url.pathname === '/favicon.ico') {
        return new Response(null, { status: 204 });
      }
      if (url.pathname === '/ping' && request.method === 'POST') {
        return await handlePing(request, env);
      }
      if (url.pathname === '/stats' && request.method === 'GET') {
        const accept = request.headers.get('Accept') || '';
        if (accept.includes('text/html')) {
          return await handleStatsPage(env);
        }
        return await handleStats(env);
      }
      if (url.pathname === '/' && request.method === 'GET') {
        return await handleStatsPage(env);
      }
      return json({ error: 'Not found' }, 404);
    } catch (e) {
      return json({ error: 'Internal error' }, 500);
    }
  }
};

// Idempotent schema bootstrap — runs once per worker instance. SQLite/D1
// has no IF NOT EXISTS on ADD COLUMN so try/catch each one.
let _schemaReady = false;
async function ensureSchema(env) {
  if (_schemaReady) return;
  const cols = [
    ['installations', 'printer_connectors', 'TEXT'],
    ['installations', 'printer_brands', 'TEXT'],
    ['installations', 'cloud_printers', 'INTEGER DEFAULT 0'],
    ['installations', 'plugin_count', 'INTEGER DEFAULT 0'],
    ['installations', 'slicer_jobs', 'INTEGER DEFAULT 0'],
    ['installations', 'schema_version', 'INTEGER DEFAULT 1'],
    // Print activity (already in payload from ping; was being dropped)
    ['installations', 'total_prints', 'INTEGER DEFAULT 0'],
    ['installations', 'completed_prints', 'INTEGER DEFAULT 0'],
    ['installations', 'failed_prints', 'INTEGER DEFAULT 0'],
    ['installations', 'cancelled_prints', 'INTEGER DEFAULT 0'],
    ['installations', 'success_rate', 'INTEGER DEFAULT 0'],
    ['installations', 'total_print_hours', 'INTEGER DEFAULT 0'],
    ['installations', 'total_filament_kg', 'REAL DEFAULT 0'],
    ['installations', 'queue_items', 'INTEGER DEFAULT 0'],
    ['installations', 'install_age_days', 'INTEGER DEFAULT 0'],
    ['installations', 'material_types', 'TEXT'],
    ['installations', 'ram_gb', 'INTEGER'],
    ['installations', 'cpu_cores', 'INTEGER'],
    ['installations', 'cpu_model', 'TEXT'],
    ['installations', 'ecom_active', 'INTEGER DEFAULT 0']
  ];
  for (const [t, c, type] of cols) {
    try { await env.DB.prepare(`ALTER TABLE ${t} ADD COLUMN ${c} ${type}`).run(); }
    catch (e) { /* duplicate column — ignore */ }
  }
  _schemaReady = true;
}

async function handlePing(request, env) {
  await ensureSchema(env);

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Invalid JSON' }, 400);
  }

  const { id, version, platform, nodeVersion } = body;
  if (!id || !version) {
    return json({ error: 'Missing id or version' }, 400);
  }

  // Sanitize inputs
  const safeId = String(id).substring(0, 64);
  const safeVersion = String(version).substring(0, 20);
  const safePlatform = String(platform || 'unknown').substring(0, 30);
  const safeNode = String(nodeVersion || '').substring(0, 20);
  const safeArch = String(body.arch || '').substring(0, 20);
  const safeRam = parseInt(body.ramGb) || null;
  const safePrinterCount = parseInt(body.printerCount) || 0;
  const safePrinterModels = body.printerModels ? JSON.stringify(body.printerModels).substring(0, 500) : null;
  const safePrinterConnectors = body.printerConnectors ? JSON.stringify(body.printerConnectors).substring(0, 500) : null;
  const safePrinterBrands = body.printerBrands ? JSON.stringify(body.printerBrands).substring(0, 500) : null;
  const safeCloudPrinters = parseInt(body.cloudPrinters) || 0;
  const safePluginCount = parseInt(body.pluginCount) || 0;
  const safeSlicerJobs = parseInt(body.slicerJobs) || 0;
  const safeSchemaVersion = parseInt(body.schemaVersion) || 1;
  const safeTotalSpools = parseInt(body.totalSpools) || 0;
  const safeTotalProfiles = parseInt(body.totalProfiles) || 0;
  const safeFeatures = Array.isArray(body.features) ? body.features.join(',').substring(0, 500) : null;
  const safeDemo = body.demo ? 1 : 0;
  const safeLanguage = body.language ? String(body.language).substring(0, 10) : null;
  // Print activity + system info that the server already sends
  const safeTotalPrints = parseInt(body.totalPrints) || 0;
  const safeCompletedPrints = parseInt(body.completedPrints) || 0;
  const safeFailedPrints = parseInt(body.failedPrints) || 0;
  const safeCancelledPrints = parseInt(body.cancelledPrints) || 0;
  const safeSuccessRate = parseInt(body.successRate) || 0;
  const safeTotalPrintHours = parseInt(body.totalPrintHours) || 0;
  const safeTotalFilamentKg = parseFloat(body.totalFilamentKg) || 0;
  const safeQueueItems = parseInt(body.queueItems) || 0;
  const safeInstallAgeDays = parseInt(body.installAgeDays) || 0;
  const safeMaterialTypes = Array.isArray(body.materialTypes) ? body.materialTypes.join(',').substring(0, 500) : null;
  const safeCpuCores = parseInt(body.cpuCores) || null;
  const safeCpuModel = body.cpuModel ? String(body.cpuModel).substring(0, 100) : null;
  const safeEcomActive = body.ecomActive ? 1 : 0;
  const today = new Date().toISOString().split('T')[0];

  // Upsert installation
  const existing = await env.DB.prepare(
    'SELECT id, first_seen FROM installations WHERE id = ?'
  ).bind(safeId).first();

  if (existing) {
    await env.DB.prepare(
      `UPDATE installations SET version = ?, platform = ?, node_version = ?, arch = ?, ram_gb = ?,
       cpu_cores = ?, cpu_model = ?,
       printer_count = ?, printer_models = ?, printer_connectors = ?, printer_brands = ?, cloud_printers = ?,
       plugin_count = ?, slicer_jobs = ?, schema_version = ?,
       total_spools = ?, total_profiles = ?,
       total_prints = ?, completed_prints = ?, failed_prints = ?, cancelled_prints = ?,
       success_rate = ?, total_print_hours = ?, total_filament_kg = ?,
       queue_items = ?, install_age_days = ?, material_types = ?, ecom_active = ?,
       features = ?, demo = ?, language = ?,
       last_seen = datetime('now'), ping_count = ping_count + 1 WHERE id = ?`
    ).bind(safeVersion, safePlatform, safeNode, safeArch, safeRam,
      safeCpuCores, safeCpuModel,
      safePrinterCount, safePrinterModels, safePrinterConnectors, safePrinterBrands, safeCloudPrinters,
      safePluginCount, safeSlicerJobs, safeSchemaVersion,
      safeTotalSpools, safeTotalProfiles,
      safeTotalPrints, safeCompletedPrints, safeFailedPrints, safeCancelledPrints,
      safeSuccessRate, safeTotalPrintHours, safeTotalFilamentKg,
      safeQueueItems, safeInstallAgeDays, safeMaterialTypes, safeEcomActive,
      safeFeatures, safeDemo, safeLanguage, safeId).run();
  } else {
    await env.DB.prepare(
      `INSERT INTO installations (id, version, platform, node_version, arch, ram_gb,
       cpu_cores, cpu_model,
       printer_count, printer_models, printer_connectors, printer_brands, cloud_printers,
       plugin_count, slicer_jobs, schema_version,
       total_spools, total_profiles,
       total_prints, completed_prints, failed_prints, cancelled_prints,
       success_rate, total_print_hours, total_filament_kg,
       queue_items, install_age_days, material_types, ecom_active,
       features, demo, language)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(safeId, safeVersion, safePlatform, safeNode, safeArch, safeRam,
      safeCpuCores, safeCpuModel,
      safePrinterCount, safePrinterModels, safePrinterConnectors, safePrinterBrands, safeCloudPrinters,
      safePluginCount, safeSlicerJobs, safeSchemaVersion,
      safeTotalSpools, safeTotalProfiles,
      safeTotalPrints, safeCompletedPrints, safeFailedPrints, safeCancelledPrints,
      safeSuccessRate, safeTotalPrintHours, safeTotalFilamentKg,
      safeQueueItems, safeInstallAgeDays, safeMaterialTypes, safeEcomActive,
      safeFeatures, safeDemo, safeLanguage).run();

    // Increment new installs for today
    await env.DB.prepare(
      `INSERT INTO daily_stats (date, active_installs, new_installs) VALUES (?, 0, 1)
       ON CONFLICT(date) DO UPDATE SET new_installs = new_installs + 1`
    ).bind(today).run();
  }

  // Increment active installs for today
  await env.DB.prepare(
    `INSERT INTO daily_stats (date, active_installs, new_installs) VALUES (?, 1, 0)
     ON CONFLICT(date) DO UPDATE SET active_installs = active_installs + 1`
  ).bind(today).run();

  // Auto-cleanup: remove installations inactive for 30+ days (runs ~1% of pings)
  if (Math.random() < 0.01) {
    await env.DB.prepare(
      `DELETE FROM installations WHERE last_seen < datetime('now', '-30 days')`
    ).run();
  }

  return json({ ok: true });
}

async function handleStats(env) {
  return json(await getStatsData(env));
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS_HEADERS }
  });
}

async function handleStatsPage(env) {
  const s = await getStatsData(env);

  // Build daily chart bars (last 14 days)
  const dailyBars = (s.daily || []).slice(0, 14).reverse();
  const maxActive = Math.max(...dailyBars.map(d => d.active_installs || 0), 1);

  const chartHtml = dailyBars.map(d => {
    const pct = Math.round((d.active_installs || 0) / maxActive * 100);
    const label = d.date ? d.date.substring(5) : '';
    return `<div class="chart-col">
      <div class="chart-val">${d.active_installs || 0}</div>
      <div class="chart-bar-wrap"><div class="chart-bar" style="height:${pct}%"></div></div>
      <div class="chart-label">${esc(label)}</div>
    </div>`;
  }).join('');

  // New installs chart
  const maxNew = Math.max(...dailyBars.map(d => d.new_installs || 0), 1);
  const newChartHtml = dailyBars.map(d => {
    const pct = Math.round((d.new_installs || 0) / maxNew * 100);
    const label = d.date ? d.date.substring(5) : '';
    return `<div class="chart-col">
      <div class="chart-val">${d.new_installs || 0}</div>
      <div class="chart-bar-wrap"><div class="chart-bar purple-bar" style="height:${pct}%"></div></div>
      <div class="chart-label">${esc(label)}</div>
    </div>`;
  }).join('');

  // Recent activity table
  const recentHtml = s.recent.map(r => {
    const ago = timeAgo(r.last_seen);
    const plat = r.platform === 'win32' ? 'Windows' : r.platform === 'darwin' ? 'macOS' : r.platform;
    const printers = r.printer_count || 0;
    const spools = r.total_spools || 0;
    return `<tr>
      <td class="version-badge">v${esc(r.version)}</td>
      <td>${esc(plat)}${r.arch ? ` (${esc(r.arch)})` : ''}</td>
      <td>${r.ram_gb ? r.ram_gb + ' GB' : '—'}</td>
      <td>${printers} printer${printers !== 1 ? 's' : ''}${spools > 0 ? `, ${spools} spools` : ''}</td>
      <td style="color:rgba(255,255,255,0.5)">${r.ping_count} pings</td>
      <td style="color:var(--color-accent)">${ago}</td>
    </tr>`;
  }).join('');

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>3DPrintForge — Telemetry</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400;500;600;700;800;900&family=Rajdhani:wght@300;400;500;600;700&family=Share+Tech+Mono&family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
<style>
:root {
  --c-bg: #04061a;
  --c-bg-2: #0a0e27;
  --color-primary: #1279ff;
  --color-accent: #00d4ff;
  --color-cyan-glow: #7ff5ff;
  --color-orange: #f97316;
  --color-orange-glow: #ffb36b;
  --color-purple: #9b4dff;
  --color-pink: #ff4db8;
  --color-green: #00e676;
  --color-neon: #fbbf24;
  --color-dark: #04061a;
  --color-secondary: #0a0e27;
  --font-heading: 'Orbitron', 'Rajdhani', ui-sans-serif, system-ui, sans-serif;
  --font-body: 'Rajdhani', 'Inter', 'Helvetica Neue', Helvetica, Arial, ui-sans-serif, system-ui, sans-serif;
  --font-mono: 'Share Tech Mono', ui-monospace, monospace;
}
*, *::before, *::after { margin:0; padding:0; box-sizing:border-box; }
body {
  font-family: var(--font-body);
  background: var(--c-bg);
  color: #e2e8f0;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  -webkit-font-smoothing: antialiased;
  position: relative;
  overflow-x: hidden;
}

/* === Cyberpunk animated background (skjerm1 port) === */
.bg-fx { position: fixed; inset: 0; z-index: 0; pointer-events: none; overflow: hidden; }
.bg-radar {
  position: absolute; width: 140vmax; height: 140vmax;
  top: 50%; left: 50%; transform: translate(-50%, -50%);
  background: conic-gradient(from 0deg,
    transparent 0deg,
    rgba(249,115,22,0.18) 40deg,
    rgba(249,115,22,0.08) 60deg,
    transparent 80deg,
    transparent 270deg,
    rgba(0,212,255,0.10) 300deg,
    rgba(0,212,255,0.05) 320deg,
    transparent 360deg);
  filter: blur(30px);
  animation: radarSpin 18s linear infinite;
  opacity: 0.7;
}
@keyframes radarSpin { to { transform: translate(-50%, -50%) rotate(360deg); } }
.bg-grid {
  position: absolute; inset: 0;
  background-image:
    linear-gradient(rgba(0,212,255,0.07) 1px, transparent 1px),
    linear-gradient(90deg, rgba(0,212,255,0.07) 1px, transparent 1px);
  background-size: 60px 60px;
  mask-image: radial-gradient(ellipse 80% 80% at center, black 30%, transparent 85%);
  animation: gridPulse 8s ease-in-out infinite, gridDrift 30s linear infinite;
}
@keyframes gridDrift { from { background-position: 0 0, 0 0; } to { background-position: 60px 60px, 60px 60px; } }
@keyframes gridPulse {
  0%, 100% { opacity: 0.4; }
  50%      { opacity: 0.85; filter: drop-shadow(0 0 12px rgba(0,212,255,0.3)); }
}
.bg-orb {
  position: absolute; border-radius: 50%;
  filter: blur(90px); pointer-events: none; will-change: transform;
}
.bg-orb-1 {
  width: 560px; height: 560px;
  background: radial-gradient(circle, var(--color-orange) 0%, transparent 70%);
  top: -160px; left: -140px; opacity: 0.55;
  animation: orbMorph1 14s ease-in-out infinite;
}
.bg-orb-2 {
  width: 500px; height: 500px;
  background: radial-gradient(circle, var(--color-primary) 0%, transparent 70%);
  bottom: -180px; right: -120px; opacity: 0.5;
  animation: orbMorph2 18s ease-in-out infinite;
}
.bg-orb-3 {
  width: 380px; height: 380px;
  background: radial-gradient(circle, var(--color-accent) 0%, transparent 70%);
  top: 45%; left: 50%; transform: translate(-50%, -50%);
  opacity: 0.22;
  animation: orbMorph3 22s ease-in-out infinite;
}
@keyframes orbMorph1 {
  0%, 100% { transform: translate(0,0) scale(1); border-radius: 50%; }
  33%      { transform: translate(80px,60px) scale(1.15); border-radius: 42% 58% 52% 48%; }
  66%      { transform: translate(40px,120px) scale(0.9); border-radius: 60% 40% 45% 55%; }
}
@keyframes orbMorph2 {
  0%, 100% { transform: translate(0,0) scale(1); border-radius: 50%; }
  50%      { transform: translate(-90px,-60px) scale(1.1); border-radius: 55% 45% 48% 52%; }
}
@keyframes orbMorph3 {
  0%, 100% { transform: translate(-50%,-50%) scale(1); opacity: 0.22; }
  50%      { transform: translate(-50%,-50%) scale(1.4); opacity: 0.4; }
}
.bg-scanlines {
  position: absolute; inset: 0;
  background: repeating-linear-gradient(to bottom,
    transparent 0, transparent 3px,
    rgba(255,255,255,0.012) 3px, rgba(255,255,255,0.012) 4px);
  pointer-events: none;
}
.bg-vignette {
  position: absolute; inset: 0;
  background: radial-gradient(ellipse at center, transparent 30%, rgba(4,6,26,0.7) 90%);
}
/* Horizontal scan-line that travels top→bottom */
.bg-hscan {
  position: absolute; left: 0; right: 0; height: 2px;
  background: linear-gradient(90deg, transparent, var(--color-accent), transparent);
  box-shadow: 0 0 24px var(--color-accent), 0 0 48px rgba(0,212,255,0.3);
  opacity: 0.5;
  animation: hscan 9s linear infinite;
}
@keyframes hscan { 0% { top: -10%; } 100% { top: 110%; } }
/* Falling matrix-style particles */
.bg-particles { position: absolute; inset: 0; overflow: hidden; }
.particle {
  position: absolute; top: -20px; width: 1px;
  background: linear-gradient(to bottom, transparent, var(--color-orange), transparent);
  opacity: 0;
  animation: particleFall linear infinite;
}
@keyframes particleFall {
  0%   { opacity: 0; transform: translateY(0); }
  10%  { opacity: 0.55; }
  90%  { opacity: 0.35; }
  100% { opacity: 0; transform: translateY(110vh); }
}
header, .hero, .content-section, .content-section-alt, .footer, .top-strip { position: relative; z-index: 1; }

/* Top status strip — live mission-control bar */
.top-strip {
  background: linear-gradient(90deg, rgba(249,115,22,0.08), rgba(0,212,255,0.08), rgba(249,115,22,0.08));
  border-bottom: 1px solid rgba(0,212,255,0.2);
  font-family: var(--font-mono);
  font-size: 0.7rem;
  letter-spacing: 0.15em;
  padding: 6px 1rem;
  color: rgba(255,255,255,0.55);
  text-transform: uppercase;
}
.top-strip-inner {
  max-width: 1600px; margin: 0 auto;
  display: flex; gap: 2rem; flex-wrap: wrap; justify-content: center;
}
.top-strip span { display: inline-flex; align-items: center; gap: 6px; }
.live-dot {
  width: 8px; height: 8px; border-radius: 50%;
  background: var(--color-green);
  box-shadow: 0 0 8px var(--color-green), 0 0 16px rgba(0,230,118,0.6);
  animation: livePulse 1.6s ease-in-out infinite;
}
@keyframes livePulse {
  0%, 100% { transform: scale(1); opacity: 1; }
  50%      { transform: scale(1.4); opacity: 0.6; }
}

/* Header */
.header {
  background: linear-gradient(to bottom, rgba(4,6,26,0.95), rgba(10,14,39,0.85));
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(0,212,255,0.3);
  box-shadow: 0 0 30px rgba(0,212,255,0.15), 0 0 60px rgba(249,115,22,0.08);
  padding: 0 1rem;
}
.header-inner {
  max-width: 1600px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 64px;
}
.header-logo {
  font-family: var(--font-heading);
  font-size: 1.25rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: #fff;
  text-decoration: none;
  text-shadow: 0 0 10px rgba(18,121,255,0.8), 0 0 20px rgba(0,212,255,0.4);
}
.header-nav { display: flex; gap: 20px; }
.header-nav a {
  color: rgba(255,255,255,0.7);
  text-decoration: none;
  font-size: 0.85rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  transition: color 0.3s;
}
.header-nav a:hover, .header-nav a.active { color: var(--color-accent); }

/* Hero */
.hero {
  background: linear-gradient(135deg, rgba(26,31,58,0.5), rgba(10,14,39,0.8));
  min-height: 220px;
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
  overflow: hidden;
  padding: 60px 1rem 40px;
}
.hero::before {
  content: '';
  position: absolute;
  inset: 0;
  background: radial-gradient(ellipse at 50% 0%, rgba(18,121,255,0.15) 0%, transparent 70%);
  pointer-events: none;
}
.hero-inner {
  text-align: center;
  position: relative;
  z-index: 1;
}
.hero h1 {
  font-family: var(--font-heading);
  font-size: 3.2rem;
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: #fff;
  text-shadow:
    0 0 14px rgba(249,115,22,0.6),
    0 0 28px rgba(0,212,255,0.5),
    0 0 56px rgba(0,212,255,0.3);
  margin-bottom: 0.5rem;
  animation: titleGlow 4s ease-in-out infinite;
}
@keyframes titleGlow {
  0%, 100% { text-shadow: 0 0 14px rgba(249,115,22,0.6), 0 0 28px rgba(0,212,255,0.5), 0 0 56px rgba(0,212,255,0.3); }
  50%      { text-shadow: 0 0 22px rgba(249,115,22,0.9), 0 0 44px rgba(0,212,255,0.7), 0 0 80px rgba(0,212,255,0.5); }
}
.hero p {
  font-family: var(--font-heading);
  font-size: 1rem;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.15em;
  background: linear-gradient(90deg, var(--color-accent), var(--color-purple), var(--color-pink), var(--color-accent));
  background-size: 200% 200%;
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  animation: gradient 3s infinite;
}
@keyframes gradient { 0% { background-position: 0%; } 50% { background-position: 100%; } 100% { background-position: 0%; } }

/* Content */
.content-section { background: var(--color-dark); padding: 48px 1rem; }
.content-section-alt { background: linear-gradient(135deg, rgba(26,31,58,0.3), rgba(10,14,39,0.5)); padding: 48px 1rem; }
.container { max-width: 1600px; margin: 0 auto; padding: 0 0.5rem; }

/* Section titles */
.section-title {
  font-family: var(--font-heading);
  font-size: 1.3rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: #fff;
  text-shadow: 0 0 10px rgba(18,121,255,0.6), 0 0 20px rgba(0,212,255,0.3);
  margin-bottom: 1.25rem;
  text-align: center;
}

/* Stats grid — Bento layout: hero stats + secondary tier */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(170px, 1fr));
  gap: 16px;
  margin-bottom: 0;
}
/* Mission-control hero strip — 4 oversized stats with hex-ring decorations */
.hero-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 18px;
  margin-bottom: 18px;
}
.hero-stat {
  position: relative;
  clip-path: polygon(16px 0, 100% 0, 100% calc(100% - 16px), calc(100% - 16px) 100%, 0 100%, 0 16px);
  background: linear-gradient(135deg, rgba(10,14,39,0.85), rgba(4,6,26,0.95));
  border: 1px solid rgba(0,212,255,0.3);
  padding: 28px 24px;
  text-align: center;
  overflow: hidden;
  transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}
.hero-stat:hover {
  border-color: rgba(249,115,22,0.6);
  box-shadow: 0 0 40px rgba(249,115,22,0.3), 0 0 80px rgba(0,212,255,0.2), inset 0 0 30px rgba(0,212,255,0.08);
  transform: translateY(-4px);
}
.hero-stat::before {
  content: '';
  position: absolute; top: 0; left: 0; right: 0;
  height: 3px;
  background: linear-gradient(90deg, var(--color-orange), var(--color-accent), var(--color-orange));
  background-size: 200% 100%;
  opacity: 0.7;
  animation: heroStatLine 3s linear infinite;
}
@keyframes heroStatLine { from { background-position: 0% 0; } to { background-position: 200% 0; } }
.hero-stat-label {
  font-family: var(--font-mono);
  font-size: 0.65rem;
  letter-spacing: 0.18em;
  color: rgba(0,212,255,0.7);
  text-transform: uppercase;
  margin-bottom: 8px;
  display: flex; align-items: center; justify-content: center; gap: 8px;
}
.hero-stat-value {
  font-family: var(--font-heading);
  font-size: 3.4rem;
  font-weight: 900;
  letter-spacing: 0.02em;
  line-height: 1;
  color: #fff;
  text-shadow:
    0 0 14px rgba(249,115,22,0.5),
    0 0 28px rgba(0,212,255,0.4);
  margin-bottom: 6px;
}
.hero-stat-value.green { text-shadow: 0 0 14px rgba(0,230,118,0.5), 0 0 28px rgba(0,230,118,0.3); }
.hero-stat-sub {
  font-family: var(--font-mono);
  font-size: 0.7rem;
  color: rgba(255,255,255,0.4);
  letter-spacing: 0.1em;
}
.hero-stat-hex {
  position: absolute;
  top: -20px; right: -20px;
  width: 90px; height: 90px;
  opacity: 0.15;
  pointer-events: none;
  animation: hexSpin 22s linear infinite;
}
@keyframes hexSpin { to { transform: rotate(360deg); } }

/* Bento grid for breakdown panels */
.bento {
  display: grid;
  grid-template-columns: repeat(12, 1fr);
  gap: 18px;
  margin-top: 24px;
}
.bento > .data-section { margin-bottom: 0; }
.bento .span-4 { grid-column: span 4; }
.bento .span-6 { grid-column: span 6; }
.bento .span-8 { grid-column: span 8; }
.bento .span-12 { grid-column: span 12; }
@media (max-width: 1100px) {
  .bento .span-4, .bento .span-6, .bento .span-8 { grid-column: span 12; }
}

/* Gaming card — skjerm1-style with orange/cyan dual glow */
.g-card {
  clip-path: polygon(12px 0, 100% 0, 100% calc(100% - 12px), calc(100% - 12px) 100%, 0 100%, 0 12px);
  background: linear-gradient(135deg, rgba(10,14,39,0.7), rgba(4,6,26,0.9));
  border: 1px solid rgba(0,212,255,0.25);
  position: relative;
  overflow: hidden;
  transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
}
.g-card:hover {
  border-color: rgba(249,115,22,0.5);
  box-shadow:
    0 0 30px rgba(249,115,22,0.25),
    0 0 60px rgba(0,212,255,0.15),
    inset 0 0 20px rgba(0,212,255,0.05);
  transform: translateY(-2px);
}
.g-card::before {
  content: '';
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 2px;
  background: linear-gradient(90deg, transparent, var(--color-orange), var(--color-accent), transparent);
  opacity: 0;
  transition: opacity 0.4s;
}
.g-card:hover::before { opacity: 1; }
.g-card::after {
  content: '';
  position: absolute;
  bottom: 0; left: 12px; right: 0;
  height: 1px;
  background: linear-gradient(90deg, var(--color-orange), transparent);
  opacity: 0.3;
}
.g-card-inner {
  padding: 20px 16px;
  position: relative;
  z-index: 1;
  text-align: center;
}
.g-card-value {
  font-family: var(--font-heading);
  font-size: 2.2rem;
  font-weight: 900;
  letter-spacing: 0.05em;
  color: var(--color-accent);
  text-shadow: 0 0 15px rgba(0,212,255,0.4);
}
.g-card-value.green { color: var(--color-green); text-shadow: 0 0 15px rgba(0,230,118,0.4); }
.g-card-value.purple { color: var(--color-purple); text-shadow: 0 0 15px rgba(155,77,255,0.4); }
.g-card-value.pink { color: var(--color-pink); text-shadow: 0 0 15px rgba(255,77,184,0.4); }
.g-card-value.orange { color: var(--color-orange); text-shadow: 0 0 15px rgba(255,159,67,0.4); }
.g-card-value.blue { color: var(--color-primary); text-shadow: 0 0 15px rgba(18,121,255,0.4); }
.g-card-label {
  font-size: 0.75rem;
  font-weight: 600;
  color: rgba(255,255,255,0.45);
  text-transform: uppercase;
  letter-spacing: 0.1em;
  margin-top: 4px;
}

/* Data sections */
.data-section {
  clip-path: polygon(12px 0, 100% 0, 100% calc(100% - 12px), calc(100% - 12px) 100%, 0 100%, 0 12px);
  background: linear-gradient(135deg, rgba(26,31,58,0.6), rgba(10,14,39,0.8));
  border: 2px solid rgba(18,121,255,0.3);
  overflow: hidden;
  margin-bottom: 20px;
}
.data-section-title {
  font-family: var(--font-heading);
  font-size: 0.8rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--color-accent);
  padding: 14px 20px 8px;
}
table { width: 100%; border-collapse: collapse; }
th, td { padding: 8px 20px; text-align: left; }
th {
  color: rgba(255,255,255,0.35);
  font-size: 0.65rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  border-bottom: 1px solid rgba(18,121,255,0.15);
}
td {
  color: rgba(255,255,255,0.85);
  font-size: 0.85rem;
  font-weight: 500;
  border-bottom: 1px solid rgba(255,255,255,0.04);
}
tr:hover td { background: rgba(18,121,255,0.05); }
.bar-cell { width: 35%; }
.bar {
  height: 6px;
  background: linear-gradient(90deg, var(--color-primary), var(--color-accent));
  border-radius: 3px;
  min-width: 3px;
  box-shadow: 0 0 8px rgba(0,212,255,0.3);
}
.bar.purple-bar { background: linear-gradient(90deg, var(--color-purple), var(--color-pink)); box-shadow: 0 0 8px rgba(155,77,255,0.3); }
.bar.green-bar { background: linear-gradient(90deg, var(--color-green), #33ff99); box-shadow: 0 0 8px rgba(0,230,118,0.3); }
.version-badge {
  font-family: var(--font-heading);
  font-weight: 700;
  letter-spacing: 0.05em;
}

/* Charts */
.chart-wrap {
  display: flex;
  align-items: flex-end;
  gap: 4px;
  height: 140px;
  padding: 16px 20px 8px;
}
.chart-col {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  height: 100%;
}
.chart-bar-wrap {
  flex: 1;
  width: 100%;
  display: flex;
  align-items: flex-end;
  justify-content: center;
}
.chart-bar {
  width: 100%;
  max-width: 28px;
  background: linear-gradient(to top, var(--color-primary), var(--color-accent));
  border-radius: 3px 3px 0 0;
  min-height: 2px;
  box-shadow: 0 0 8px rgba(0,212,255,0.2);
  transition: height 0.3s;
}
.chart-bar.purple-bar {
  background: linear-gradient(to top, var(--color-purple), var(--color-pink));
  box-shadow: 0 0 8px rgba(155,77,255,0.2);
}
.chart-label {
  font-size: 0.6rem;
  color: rgba(255,255,255,0.35);
  margin-top: 4px;
  white-space: nowrap;
}
.chart-val {
  font-size: 0.6rem;
  font-weight: 700;
  color: rgba(255,255,255,0.5);
  margin-bottom: 2px;
}

/* Footer */
.footer {
  background: linear-gradient(to bottom, var(--color-dark), #050508);
  border-top: 2px solid rgba(18,121,255,0.3);
  box-shadow: 0 -4px 30px rgba(18,121,255,0.15);
  padding: 24px 1rem;
  text-align: center;
  margin-top: auto;
}
.footer-inner { max-width: 1600px; margin: 0 auto; }
.footer-text { color: rgba(255,255,255,0.35); font-size: 0.8rem; }
.footer-text a { color: var(--color-accent); text-decoration: none; transition: color 0.3s; }
.footer-text a:hover { color: var(--color-pink); }
.footer-links { display: flex; justify-content: center; gap: 24px; margin-bottom: 12px; }
.footer-links a {
  color: rgba(255,255,255,0.5);
  text-decoration: none;
  font-size: 0.8rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  transition: color 0.3s;
}
.footer-links a:hover { color: var(--color-accent); }

/* Layout helpers */
.two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
.three-col { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 20px; }

@media (max-width: 768px) {
  .hero h1 { font-size: 1.8rem; }
  .hero p { font-size: 0.85rem; }
  .two-col, .three-col { grid-template-columns: 1fr; }
  .stats-grid { grid-template-columns: repeat(2, 1fr); }
  .g-card-value { font-size: 1.6rem; }
  .section-title { font-size: 1.1rem; }
}
@media (max-width: 480px) {
  .stats-grid { grid-template-columns: 1fr 1fr; gap: 10px; }
  .g-card-inner { padding: 14px 12px; }
  .g-card-value { font-size: 1.4rem; }
}
</style>
</head>
<body>

<!-- Cyberpunk animated background (skjerm1.no design) -->
<div class="bg-fx" aria-hidden="true">
  <div class="bg-radar"></div>
  <div class="bg-grid"></div>
  <div class="bg-orb bg-orb-1"></div>
  <div class="bg-orb bg-orb-2"></div>
  <div class="bg-orb bg-orb-3"></div>
  <div class="bg-particles">
    ${Array.from({length: 18}, (_, i) => `<div class="particle" style="left:${(i*5.6+Math.sin(i)*3).toFixed(1)}%;height:${40+i*8}px;animation-duration:${(8+i*0.7).toFixed(1)}s;animation-delay:${(i*0.4).toFixed(1)}s"></div>`).join('')}
  </div>
  <div class="bg-hscan"></div>
  <div class="bg-scanlines"></div>
  <div class="bg-vignette"></div>
</div>

<!-- Top mission-control strip -->
<div class="top-strip">
  <div class="top-strip-inner">
    <span><span class="live-dot"></span>SYSTEM ONLINE</span>
    <span>NODE: TELEMETRY-EU</span>
    <span>D1: ${s.total} INSTALLS</span>
    <span>PINGS: ${(s.total_pings || 0).toLocaleString()}</span>
    <span>UPLINK: CLOUDFLARE WORKERS</span>
  </div>
</div>

<!-- Header -->
<header class="header">
  <div class="header-inner">
    <a href="/" class="header-logo">3DPrintForge</a>
    <nav class="header-nav">
      <a href="https://github.com/skynett81/3dprintforge">GitHub</a>
      <a href="/stats" class="active">Telemetry</a>
      <a href="https://geektech.no">GeekTech</a>
    </nav>
  </div>
</header>

<!-- Hero -->
<section class="hero">
  <div class="hero-inner">
    <h1>Telemetry</h1>
    <p>Anonymous installation statistics</p>
  </div>
</section>

<!-- Mission-control hero stats — 4 oversized -->
<section class="content-section">
  <div class="container">
    <div class="hero-stats">
      <div class="hero-stat">
        <svg class="hero-stat-hex" viewBox="0 0 100 100"><polygon points="50,5 93,28 93,72 50,95 7,72 7,28" fill="none" stroke="#00d4ff" stroke-width="1.5"/><polygon points="50,15 85,33 85,67 50,85 15,67 15,33" fill="none" stroke="#f97316" stroke-width="1"/></svg>
        <div class="hero-stat-label"><span class="live-dot"></span>Active Installs (24h)</div>
        <div class="hero-stat-value green">${s.active_24h}</div>
        <div class="hero-stat-sub">${s.active_7d} weekly · ${s.active_30d} monthly</div>
      </div>
      <div class="hero-stat">
        <svg class="hero-stat-hex" viewBox="0 0 100 100"><polygon points="50,5 93,28 93,72 50,95 7,72 7,28" fill="none" stroke="#00d4ff" stroke-width="1.5"/><polygon points="50,15 85,33 85,67 50,85 15,67 15,33" fill="none" stroke="#f97316" stroke-width="1"/></svg>
        <div class="hero-stat-label">Total Prints</div>
        <div class="hero-stat-value">${s.total_prints.toLocaleString()}</div>
        <div class="hero-stat-sub">${s.overall_success_rate}% success rate</div>
      </div>
      <div class="hero-stat">
        <svg class="hero-stat-hex" viewBox="0 0 100 100"><polygon points="50,5 93,28 93,72 50,95 7,72 7,28" fill="none" stroke="#00d4ff" stroke-width="1.5"/><polygon points="50,15 85,33 85,67 50,85 15,67 15,33" fill="none" stroke="#f97316" stroke-width="1"/></svg>
        <div class="hero-stat-label">Filament Burned</div>
        <div class="hero-stat-value">${s.total_filament_kg.toLocaleString()} <span style="font-size:1.6rem;color:rgba(255,255,255,0.5)">kg</span></div>
        <div class="hero-stat-sub">${s.total_print_hours.toLocaleString()} print hours</div>
      </div>
      <div class="hero-stat">
        <svg class="hero-stat-hex" viewBox="0 0 100 100"><polygon points="50,5 93,28 93,72 50,95 7,72 7,28" fill="none" stroke="#00d4ff" stroke-width="1.5"/><polygon points="50,15 85,33 85,67 50,85 15,67 15,33" fill="none" stroke="#f97316" stroke-width="1"/></svg>
        <div class="hero-stat-label">Connected Printers</div>
        <div class="hero-stat-value">${s.total_printers}</div>
        <div class="hero-stat-sub">${s.total_cloud_printers > 0 ? s.total_cloud_printers + ' via Bambu Cloud' : 'all LAN'}</div>
      </div>
    </div>

    ${(() => {
      const card = (value, label, color = '', display = null) => {
        const num = typeof value === 'number' ? value : Number(value);
        if (!num || num === 0) return '';
        const shown = display !== null ? display : (typeof value === 'number' ? value.toLocaleString() : value);
        return `<div class="g-card"><div class="g-card-inner">
          <div class="g-card-value ${color}">${shown}</div>
          <div class="g-card-label">${label}</div>
        </div></div>`;
      };
      const cards = [
        card(s.total, 'Total Installs'),
        card(s.total_spools, 'Filament Spools', 'pink'),
        card(s.total_plugins, 'Active Plugins', 'purple'),
        card(s.total_slicer_jobs, 'Slicer Jobs', 'green'),
        card(s.queue_items, 'Pending Queue', 'orange'),
        card(s.total_profiles, 'Filament Profiles', 'blue'),
        card(s.avg_install_age_days, 'Avg Install Age', 'blue', s.avg_install_age_days + 'd'),
        card(s.ecom_active_count, 'E-commerce Active', 'purple'),
      ].filter(Boolean);
      return cards.length ? `<div class="stats-grid">${cards.join('')}</div>` : '';
    })()}
  </div>
</section>

<!-- Charts -->
<section class="content-section-alt">
  <div class="container">
    <h2 class="section-title">Activity Trends</h2>
    <div class="two-col">
      <div class="data-section">
        <div class="data-section-title">Daily Active Installs (14 days)</div>
        <div class="chart-wrap">${chartHtml}</div>
      </div>
      <div class="data-section">
        <div class="data-section-title">New Installs per Day</div>
        <div class="chart-wrap">${newChartHtml}</div>
      </div>
    </div>
  </div>
</section>

<!-- Breakdowns -->
<section class="content-section">
  <div class="container">
    <h2 class="section-title">Breakdown</h2>
    <div class="three-col">
      ${s.versions.length ? `<div class="data-section">
        <div class="data-section-title">Versions</div>
        <table><thead><tr><th>Version</th><th>Count</th><th class="bar-cell"></th></tr></thead><tbody>${s.versions.map(v => {
          const maxV = s.versions[0]?.count || 1;
          return `<tr><td class="version-badge">v${esc(v.version)}</td><td>${v.count}</td><td class="bar-cell"><div class="bar" style="width:${Math.max(Math.round(v.count/maxV*100), 5)}%"></div></td></tr>`;
        }).join('')}</tbody></table>
      </div>` : ''}
      ${s.platforms.length ? `<div class="data-section">
        <div class="data-section-title">Platforms</div>
        <table><thead><tr><th>Platform</th><th>Count</th><th class="bar-cell"></th></tr></thead><tbody>${s.platforms.map(p => {
          const maxP = s.platforms[0]?.count || 1;
          const name = p.platform === 'win32' ? 'Windows' : p.platform === 'darwin' ? 'macOS' : p.platform;
          return `<tr><td>${esc(name)}</td><td>${p.count}</td><td class="bar-cell"><div class="bar green-bar" style="width:${Math.max(Math.round(p.count/maxP*100), 5)}%"></div></td></tr>`;
        }).join('')}</tbody></table>
      </div>` : ''}
      ${s.printerModels.length ? `<div class="data-section">
        <div class="data-section-title">Printer Models</div>
        <table><thead><tr><th>Model</th><th>Count</th><th class="bar-cell"></th></tr></thead><tbody>${s.printerModels.map(m => {
          const maxM = s.printerModels[0]?.count || 1;
          return `<tr><td>${esc(m.model)}</td><td>${m.count}</td><td class="bar-cell"><div class="bar purple-bar" style="width:${Math.max(Math.round(m.count/maxM*100), 5)}%"></div></td></tr>`;
        }).join('')}</tbody></table>
      </div>` : ''}
    </div>
    ${(s.brands.length || s.connectors.length || s.materials.length) ? `<div class="three-col" style="margin-top:20px">
      ${s.brands.length ? `<div class="data-section">
        <div class="data-section-title">Printer Brands</div>
        <table><thead><tr><th>Brand</th><th>Count</th><th class="bar-cell"></th></tr></thead><tbody>${s.brands.map(b => {
          const maxB = s.brands[0]?.count || 1;
          return `<tr><td>${esc(b.brand)}</td><td>${b.count}</td><td class="bar-cell"><div class="bar" style="width:${Math.max(Math.round(b.count/maxB*100), 5)}%"></div></td></tr>`;
        }).join('')}</tbody></table>
      </div>` : ''}
      ${s.connectors.length ? `<div class="data-section">
        <div class="data-section-title">Connector Protocols</div>
        <table><thead><tr><th>Type</th><th>Count</th><th class="bar-cell"></th></tr></thead><tbody>${s.connectors.map(c => {
          const maxC = s.connectors[0]?.count || 1;
          const label = { bambu: 'Bambu MQTT', moonraker: 'Moonraker WS', octoprint: 'OctoPrint HTTP', prusalink: 'PrusaLink HTTP', 'snapmaker-sacp': 'Snapmaker SACP', 'snapmaker-http': 'Snapmaker HTTP', sacp: 'SACP', ankermake: 'AnkerMake MQTT', duet: 'Duet/RRF HTTP', flashforge: 'FlashForge', repetier: 'Repetier' }[c.type] || c.type;
          return `<tr><td>${esc(label)}</td><td>${c.count}</td><td class="bar-cell"><div class="bar green-bar" style="width:${Math.max(Math.round(c.count/maxC*100), 5)}%"></div></td></tr>`;
        }).join('')}</tbody></table>
      </div>` : ''}
      ${s.materials.length ? `<div class="data-section">
        <div class="data-section-title">Material Types in Use</div>
        <table><thead><tr><th>Material</th><th>Installs</th><th class="bar-cell"></th></tr></thead><tbody>${s.materials.slice(0, 12).map(m => {
          const maxM = s.materials[0]?.count || 1;
          return `<tr><td>${esc(m.material)}</td><td>${m.count}</td><td class="bar-cell"><div class="bar purple-bar" style="width:${Math.max(Math.round(m.count/maxM*100), 5)}%"></div></td></tr>`;
        }).join('')}</tbody></table>
      </div>` : ''}
      <div class="data-section">
        <div class="data-section-title">Print Outcomes</div>
        <table><tbody>
          <tr><td>Completed</td><td><strong style="color:var(--color-green)">${s.completed_prints.toLocaleString()}</strong></td></tr>
          <tr><td>Failed</td><td><strong style="color:var(--color-pink)">${s.failed_prints.toLocaleString()}</strong></td></tr>
          <tr><td>Cancelled</td><td><strong style="color:rgba(255,255,255,0.5)">${s.cancelled_prints.toLocaleString()}</strong></td></tr>
          <tr><td>Queue (pending)</td><td><strong>${s.queue_items.toLocaleString()}</strong></td></tr>
          <tr><td>Avg install age</td><td><strong>${s.avg_install_age_days} d</strong></td></tr>
          <tr><td>Oldest install</td><td><strong>${s.max_install_age_days} d</strong></td></tr>
        </tbody></table>
      </div>
    </div>` : ''}
    <div class="three-col" style="margin-top:20px">
      ${s.features.length ? `<div class="data-section">
        <div class="data-section-title">Features Enabled</div>
        <table><thead><tr><th>Feature</th><th>Count</th><th class="bar-cell"></th></tr></thead><tbody>${s.features.map(f => {
          const maxF = s.features[0]?.count || 1;
          const label = f.feature.replace('notif_', '').replace('_', ' ');
          return `<tr><td>${esc(label)}</td><td>${f.count}</td><td class="bar-cell"><div class="bar" style="width:${Math.max(Math.round(f.count/maxF*100), 5)}%"></div></td></tr>`;
        }).join('')}</tbody></table>
      </div>` : ''}
      ${s.languages.length ? `<div class="data-section">
        <div class="data-section-title">Languages</div>
        <table><thead><tr><th>Language</th><th>Count</th><th class="bar-cell"></th></tr></thead><tbody>${s.languages.map(l => {
          const maxL = s.languages[0]?.count || 1;
          return `<tr><td>${esc(l.language)}</td><td>${l.count}</td><td class="bar-cell"><div class="bar green-bar" style="width:${Math.max(Math.round(l.count/maxL*100), 5)}%"></div></td></tr>`;
        }).join('')}</tbody></table>
      </div>` : ''}
      ${s.nodeVersions.length ? `<div class="data-section">
        <div class="data-section-title">Node.js Versions</div>
        <table><thead><tr><th>Version</th><th>Count</th><th class="bar-cell"></th></tr></thead><tbody>${s.nodeVersions.map(n => {
          const maxN = s.nodeVersions[0]?.count || 1;
          return `<tr><td>${esc(n.node_version || 'Unknown')}</td><td>${n.count}</td><td class="bar-cell"><div class="bar purple-bar" style="width:${Math.max(Math.round(n.count/maxN*100), 5)}%"></div></td></tr>`;
        }).join('')}</tbody></table>
      </div>` : ''}
    </div>
  </div>
</section>

<!-- Recent Activity -->
<section class="content-section-alt">
  <div class="container">
    <h2 class="section-title">Recent Activity</h2>
    <div class="data-section">
      <div class="data-section-title">Last 10 Active Installations</div>
      <table><thead><tr><th>Version</th><th>Platform</th><th>RAM</th><th>Data</th><th>Pings</th><th>Last Seen</th></tr></thead>
      <tbody>${recentHtml}</tbody></table>
    </div>
  </div>
</section>

<!-- Footer -->
<footer class="footer">
  <div class="footer-inner">
    <div class="footer-links">
      <a href="https://github.com/skynett81/3dprintforge">GitHub</a>
      <a href="/stats">JSON API</a>
      <a href="https://geektech.no">GeekTech</a>
    </div>
    <p class="footer-text">3DPrintForge by <a href="https://github.com/skynett81">SkyNett81</a> &middot; Powered by <a href="https://workers.cloudflare.com">Cloudflare Workers</a></p>
  </div>
</footer>

</body></html>`;
  return new Response(html, { headers: { 'Content-Type': 'text/html;charset=utf-8' } });
}

function esc(s) {
  if (s == null) return '';
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function timeAgo(dateStr) {
  if (!dateStr) return '—';
  const now = new Date();
  const then = new Date(dateStr + 'Z');
  const diffMs = now - then;
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

async function getStatsData(env) {
  await ensureSchema(env);
  const [total, active24h, active7d, active30d, new7d, totalPings,
    versions, platforms, nodeVersions, archs, languages, daily, recent,
    totalPrinters, totalSpools, totalProfiles, demoCount, featureRows,
    totalCloudPrinters, totalPluginCount, totalSlicerJobs, connectorRows, brandRows,
    printActivity, materialTypeRows, ageStats, ecomActiveCount] = await Promise.all([
    env.DB.prepare('SELECT COUNT(*) as count FROM installations').first(),
    env.DB.prepare(`SELECT COUNT(*) as count FROM installations WHERE last_seen >= datetime('now', '-1 day')`).first(),
    env.DB.prepare(`SELECT COUNT(*) as count FROM installations WHERE last_seen >= datetime('now', '-7 days')`).first(),
    env.DB.prepare(`SELECT COUNT(*) as count FROM installations WHERE last_seen >= datetime('now', '-30 days')`).first(),
    env.DB.prepare(`SELECT COUNT(*) as count FROM installations WHERE first_seen >= datetime('now', '-7 days')`).first(),
    env.DB.prepare('SELECT SUM(ping_count) as total FROM installations').first(),
    env.DB.prepare('SELECT version, COUNT(*) as count FROM installations GROUP BY version ORDER BY count DESC LIMIT 20').all(),
    env.DB.prepare('SELECT platform, COUNT(*) as count FROM installations GROUP BY platform ORDER BY count DESC LIMIT 10').all(),
    env.DB.prepare(`SELECT node_version, COUNT(*) as count FROM installations WHERE node_version IS NOT NULL AND node_version != '' GROUP BY node_version ORDER BY count DESC LIMIT 10`).all(),
    env.DB.prepare(`SELECT arch, COUNT(*) as count FROM installations WHERE arch IS NOT NULL AND arch != '' GROUP BY arch ORDER BY count DESC LIMIT 10`).all(),
    env.DB.prepare(`SELECT language, COUNT(*) as count FROM installations WHERE language IS NOT NULL AND language != '' GROUP BY language ORDER BY count DESC LIMIT 20`).all(),
    env.DB.prepare(`SELECT * FROM daily_stats WHERE date >= date('now', '-30 days') ORDER BY date DESC`).all(),
    env.DB.prepare('SELECT version, platform, node_version, arch, ram_gb, printer_count, printer_models, total_spools, total_profiles, features, demo, language, last_seen, ping_count FROM installations ORDER BY last_seen DESC LIMIT 10').all(),
    env.DB.prepare('SELECT SUM(printer_count) as total FROM installations').first(),
    env.DB.prepare('SELECT SUM(total_spools) as total FROM installations').first(),
    env.DB.prepare('SELECT SUM(total_profiles) as total FROM installations').first(),
    env.DB.prepare('SELECT COUNT(*) as count FROM installations WHERE demo = 1').first(),
    env.DB.prepare('SELECT features FROM installations WHERE features IS NOT NULL AND features != \'\'').all(),
    env.DB.prepare('SELECT SUM(cloud_printers) as total FROM installations').first(),
    env.DB.prepare('SELECT SUM(plugin_count) as total FROM installations').first(),
    env.DB.prepare('SELECT SUM(slicer_jobs) as total FROM installations').first(),
    env.DB.prepare('SELECT printer_connectors FROM installations WHERE printer_connectors IS NOT NULL AND printer_connectors != \'\'').all(),
    env.DB.prepare('SELECT printer_brands FROM installations WHERE printer_brands IS NOT NULL AND printer_brands != \'\'').all(),
    env.DB.prepare('SELECT SUM(total_prints) as total, SUM(completed_prints) as completed, SUM(failed_prints) as failed, SUM(cancelled_prints) as cancelled, SUM(total_print_hours) as hours, SUM(total_filament_kg) as kg, SUM(queue_items) as queue FROM installations').first(),
    env.DB.prepare('SELECT material_types FROM installations WHERE material_types IS NOT NULL AND material_types != \'\'').all(),
    env.DB.prepare('SELECT AVG(install_age_days) as avg, MAX(install_age_days) as max FROM installations WHERE install_age_days > 0').first(),
    env.DB.prepare('SELECT COUNT(*) as count FROM installations WHERE ecom_active = 1').first(),
  ]);

  // Aggregate printer models across all installations
  const printerModelCounts = {};
  for (const row of (recent?.results || [])) {
    if (row.printer_models) {
      try {
        const models = JSON.parse(row.printer_models);
        for (const [model, count] of Object.entries(models)) {
          printerModelCounts[model] = (printerModelCounts[model] || 0) + count;
        }
      } catch { /* ignore */ }
    }
  }
  const printerModels = Object.entries(printerModelCounts)
    .map(([model, count]) => ({ model, count }))
    .sort((a, b) => b.count - a.count);

  // Aggregate features across all installations
  const featureCounts = {};
  for (const row of (featureRows?.results || [])) {
    if (row.features) {
      for (const f of row.features.split(',')) {
        const ft = f.trim();
        if (ft) featureCounts[ft] = (featureCounts[ft] || 0) + 1;
      }
    }
  }
  const features = Object.entries(featureCounts)
    .map(([feature, count]) => ({ feature, count }))
    .sort((a, b) => b.count - a.count);

  // Aggregate connector types across installations
  const connectorCounts = {};
  for (const row of (connectorRows?.results || [])) {
    if (row.printer_connectors) {
      try {
        const connectors = JSON.parse(row.printer_connectors);
        for (const [type, count] of Object.entries(connectors)) {
          connectorCounts[type] = (connectorCounts[type] || 0) + count;
        }
      } catch { /* ignore */ }
    }
  }
  const connectors = Object.entries(connectorCounts)
    .map(([type, count]) => ({ type, count }))
    .sort((a, b) => b.count - a.count);

  // Aggregate vendor/brand across installations
  const brandCounts = {};
  for (const row of (brandRows?.results || [])) {
    if (row.printer_brands) {
      try {
        const brands = JSON.parse(row.printer_brands);
        for (const [name, count] of Object.entries(brands)) {
          brandCounts[name] = (brandCounts[name] || 0) + count;
        }
      } catch { /* ignore */ }
    }
  }
  const brands = Object.entries(brandCounts)
    .map(([brand, count]) => ({ brand, count }))
    .sort((a, b) => b.count - a.count);

  // Aggregate material types across installations
  const materialCounts = {};
  for (const row of (materialTypeRows?.results || [])) {
    if (row.material_types) {
      for (const m of row.material_types.split(',')) {
        const mt = m.trim();
        if (mt) materialCounts[mt] = (materialCounts[mt] || 0) + 1;
      }
    }
  }
  const materials = Object.entries(materialCounts)
    .map(([material, count]) => ({ material, count }))
    .sort((a, b) => b.count - a.count);

  const totalAttempted = printActivity?.total || 0;
  const totalCompleted = printActivity?.completed || 0;
  const overallSuccessRate = totalAttempted > 0 ? Math.round(totalCompleted / totalAttempted * 100) : 0;

  return {
    total: total?.count || 0,
    active_24h: active24h?.count || 0,
    active_7d: active7d?.count || 0,
    active_30d: active30d?.count || 0,
    new_7d: new7d?.count || 0,
    total_pings: totalPings?.total || 0,
    total_printers: totalPrinters?.total || 0,
    total_spools: totalSpools?.total || 0,
    total_profiles: totalProfiles?.total || 0,
    total_cloud_printers: totalCloudPrinters?.total || 0,
    total_plugins: totalPluginCount?.total || 0,
    total_slicer_jobs: totalSlicerJobs?.total || 0,
    total_prints: totalAttempted,
    completed_prints: totalCompleted,
    failed_prints: printActivity?.failed || 0,
    cancelled_prints: printActivity?.cancelled || 0,
    overall_success_rate: overallSuccessRate,
    total_print_hours: printActivity?.hours || 0,
    total_filament_kg: Math.round((printActivity?.kg || 0) * 10) / 10,
    queue_items: printActivity?.queue || 0,
    avg_install_age_days: Math.round(ageStats?.avg || 0),
    max_install_age_days: ageStats?.max || 0,
    ecom_active_count: ecomActiveCount?.count || 0,
    demo_count: demoCount?.count || 0,
    versions: versions?.results || [],
    platforms: platforms?.results || [],
    nodeVersions: nodeVersions?.results || [],
    archs: archs?.results || [],
    languages: languages?.results || [],
    printerModels,
    brands,
    connectors,
    materials,
    features,
    daily: daily?.results || [],
    recent: recent?.results || [],
  };
}
