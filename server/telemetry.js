// Anonymous telemetry — sends a lightweight ping to track active installations
// No personal data is collected. Only: unique install ID, version, platform, node version.

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import { platform } from 'node:os';
import { ROOT_DIR, DATA_DIR } from './config.js';

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

export function sendTelemetryPing() {
  const payload = {
    id: getInstallId(),
    version: getVersion(),
    platform: detectPlatform(),
    nodeVersion: process.versions.node
  };

  // Fire-and-forget — never block startup, never throw
  fetch(TELEMETRY_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(10000)
  }).catch(() => { /* silent fail */ });
}
