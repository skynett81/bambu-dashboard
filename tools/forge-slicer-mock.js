#!/usr/bin/env node
/**
 * Forge Slicer mock server — a Node implementation of the
 * docs/FORGE_SLICER_API.md contract that you can run while developing
 * the C++ side of skynett81/OrcaSlicer. Lets you validate the
 * 3DPrintForge integration end-to-end without waiting for the fork
 * binary.
 *
 *   node tools/forge-slicer-mock.js [--port 8765]
 *
 * 3DPrintForge's forge-slicer-client probes /api/health, lists
 * /api/profiles, and POSTs /api/slice. This mock returns plausible
 * values for all three so you can:
 *   - Verify the 'Connected' status pill turns green
 *   - See profiles imported into slicer_profiles via the sync hook
 *   - Slice a fake job and get a tiny gcode file back
 *
 * Run side by side with `npm run dev` to develop the UI without the
 * fork. Reference implementation only — not a real slicer.
 */

import { createServer } from 'node:http';
import { Buffer } from 'node:buffer';
import { randomUUID } from 'node:crypto';

const args = process.argv.slice(2);
const portIdx = args.indexOf('--port');
const PORT = portIdx >= 0 ? parseInt(args[portIdx + 1]) : 8765;
const TOKEN = process.env.FORGE_SLICER_MOCK_TOKEN || '';

const STARTED_AT = new Date().toISOString();
const VERSION = '1.10.2-skynett.mock';
const UPSTREAM = 'OrcaSlicer 2.3.1';

// ── Sample profiles — mirrors what a typical OrcaSlicer install ships ──
const PROFILES = [
  { id: 'snapmaker-u1-04', kind: 'printer', name: 'Snapmaker U1 0.4 nozzle', vendor: 'Snapmaker',
    is_default: true, settings: { nozzle: 0.4, build_volume: [220, 220, 220], travel_speed: 200 } },
  { id: 'bambu-p1s-ams',  kind: 'printer', name: 'Bambu P1S 0.4 (AMS)', vendor: 'Bambu Lab',
    is_default: false, settings: { nozzle: 0.4, build_volume: [256, 256, 256], travel_speed: 500 } },
  { id: 'voron-2.4-300',  kind: 'printer', name: 'Voron 2.4 300mm 0.4', vendor: 'Voron',
    is_default: false, settings: { nozzle: 0.4, build_volume: [300, 300, 300], travel_speed: 300 } },

  { id: 'generic-pla',    kind: 'filament', name: 'Generic PLA', vendor: 'Generic',
    is_default: true, settings: { nozzle_temp: 215, bed_temp: 60, retraction: 1.5, density: 1.24 } },
  { id: 'generic-petg',   kind: 'filament', name: 'Generic PETG', vendor: 'Generic',
    is_default: false, settings: { nozzle_temp: 235, bed_temp: 75, retraction: 1.0, density: 1.27 } },
  { id: 'esun-tpu-95a',   kind: 'filament', name: 'eSUN eTPU-95A', vendor: 'eSUN',
    is_default: false, settings: { nozzle_temp: 230, bed_temp: 50, retraction: 0.5, density: 1.21 } },
  { id: 'bambu-pla-basic', kind: 'filament', name: 'Bambu PLA Basic', vendor: 'Bambu Lab',
    is_default: false, settings: { nozzle_temp: 220, bed_temp: 60, retraction: 1.0, density: 1.24 } },

  { id: 'normal-020',     kind: 'process', name: 'Normal (0.20 mm)', vendor: 'OrcaSlicer',
    is_default: true, settings: { layer_height: 0.20, perimeters: 2, infill: 0.20, speed: 80 } },
  { id: 'fine-012',       kind: 'process', name: 'Fine (0.12 mm)', vendor: 'OrcaSlicer',
    is_default: false, settings: { layer_height: 0.12, perimeters: 3, infill: 0.20, speed: 60 } },
  { id: 'draft-030',      kind: 'process', name: 'Draft (0.30 mm)', vendor: 'OrcaSlicer',
    is_default: false, settings: { layer_height: 0.30, perimeters: 2, infill: 0.15, speed: 100 } },
  { id: 'strong-020',     kind: 'process', name: 'Strong 3-walls 40%', vendor: 'OrcaSlicer',
    is_default: false, settings: { layer_height: 0.20, perimeters: 3, infill: 0.40, speed: 80 } },
];

const PRINTERS = PROFILES.filter(p => p.kind === 'printer').map(p => ({ id: p.id, name: p.name, vendor: p.vendor }));
const JOBS = new Map();

function _checkAuth(req, res) {
  if (!TOKEN) return true;
  if (req.headers.authorization === `Bearer ${TOKEN}`) return true;
  res.writeHead(401, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'token required', code: 'ERR_UNAUTHORIZED' }));
  return false;
}

function _json(res, status, body) {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(body));
}

function _readBody(req) {
  return new Promise((resolve) => {
    const chunks = [];
    req.on('data', c => chunks.push(c));
    req.on('end', () => resolve(Buffer.concat(chunks)));
  });
}

const server = createServer(async (req, res) => {
  if (!_checkAuth(req, res)) return;
  const u = new URL(req.url, `http://localhost:${PORT}`);

  // ── /api/health ──
  if (u.pathname === '/api/health' && req.method === 'GET') {
    return _json(res, 200, {
      ok: true, service: 'forge-slicer', version: VERSION, upstream: UPSTREAM,
      started_at: STARTED_AT, config_dir: process.env.HOME + '/.config/OrcaSlicer',
    });
  }

  // ── /api/version ──
  if (u.pathname === '/api/version' && req.method === 'GET') {
    return _json(res, 200, { version: VERSION, api: 1 });
  }

  // ── /api/profiles ──
  if (u.pathname === '/api/profiles' && req.method === 'GET') {
    const kind = u.searchParams.get('kind') || 'all';
    const vendor = u.searchParams.get('vendor');
    const filtered = PROFILES.filter(p => (kind === 'all' || p.kind === kind) && (!vendor || p.vendor === vendor));
    return _json(res, 200, { profiles: filtered });
  }
  const profileMatch = u.pathname.match(/^\/api\/profiles\/([^/]+)$/);
  if (profileMatch && req.method === 'GET') {
    const p = PROFILES.find(p => p.id === profileMatch[1] || p.name === profileMatch[1]);
    if (!p) return _json(res, 404, { error: 'profile not found', code: 'ERR_PROFILE_NOT_FOUND' });
    return _json(res, 200, p);
  }

  // ── /api/printers ──
  if (u.pathname === '/api/printers' && req.method === 'GET') {
    return _json(res, 200, { printers: PRINTERS });
  }

  // ── /api/slice ──
  if (u.pathname === '/api/slice' && req.method === 'POST') {
    const body = await _readBody(req);
    // We don't actually slice — just return plausible numbers so the
    // 3DPrintForge UI can verify its handling.
    const jobId = randomUUID();
    const fakeGcode = Buffer.from(
      ';FORGE-SLICER MOCK GCODE\n' +
      `;MODEL_BYTES=${body.length}\n` +
      'G28\nG1 X10 Y10 Z0.2 E0.5 F1500\nG1 X100 Y10 Z0.2 E10 F1500\nM104 S0\nM140 S0\n'
    );
    JOBS.set(jobId, { gcode: fakeGcode, createdAt: Date.now() });
    return _json(res, 200, {
      ok: true, job_id: jobId,
      gcode_path: `/tmp/forge-slicer/${jobId}.gcode`,
      gcode_size: fakeGcode.length,
      estimated_time_s: 3600 + Math.floor(Math.random() * 1800),
      filament_used_g: [50 + Math.random() * 30, 0, 0, 0],
    });
  }

  // ── /api/jobs/:id/gcode ──
  const gcodeMatch = u.pathname.match(/^\/api\/jobs\/([^/]+)\/gcode$/);
  if (gcodeMatch && req.method === 'GET') {
    const job = JOBS.get(gcodeMatch[1]);
    if (!job) return _json(res, 404, { error: 'job not found', code: 'ERR_JOB_NOT_FOUND' });
    res.writeHead(200, { 'Content-Type': 'application/octet-stream', 'Content-Length': job.gcode.length });
    return res.end(job.gcode);
  }

  // ── /api/preview ── (1×1 PNG stub)
  if (u.pathname === '/api/preview' && req.method === 'POST') {
    await _readBody(req); // discard
    const png = Buffer.from([
      0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
      // Minimal PNG IHDR + IEND chunks
      0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52,
      0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
      0x08, 0x06, 0x00, 0x00, 0x00, 0x1f, 0x15, 0xc4, 0x89,
      0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4e, 0x44,
      0xae, 0x42, 0x60, 0x82,
    ]);
    res.writeHead(200, { 'Content-Type': 'image/png', 'Content-Length': png.length });
    return res.end(png);
  }

  // ── /api/jobs ── queue
  if (u.pathname === '/api/jobs' && req.method === 'GET') {
    const list = [...JOBS.entries()].map(([id, j]) => ({ id, size: j.gcode.length, created_at: j.createdAt }));
    return _json(res, 200, { jobs: list });
  }

  _json(res, 404, { error: 'not found', code: 'ERR_NOT_FOUND' });
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`forge-slicer mock listening on http://127.0.0.1:${PORT}`);
  console.log(`  ${PROFILES.filter(p => p.kind === 'printer').length} printer profiles, ${PROFILES.filter(p => p.kind === 'filament').length} filaments, ${PROFILES.filter(p => p.kind === 'process').length} process presets`);
  if (TOKEN) console.log('  Auth: Bearer token required');
  console.log('\nTry:');
  console.log(`  curl http://127.0.0.1:${PORT}/api/health`);
  console.log(`  curl http://127.0.0.1:${PORT}/api/profiles?kind=printer | jq`);
});
