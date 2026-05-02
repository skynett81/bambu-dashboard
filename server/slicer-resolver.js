/**
 * Slicer resolver — single entry point for "give me something that
 * can slice a model". Picks the best available backend in priority
 * order:
 *
 *   1. Forge Slicer service (skynett81/OrcaSlicer fork via REST)
 *      — Best UX: live progress, no tmp files, profile mirroring
 *   2. Slicer Bridge (CLI: OrcaSlicer / BambuStudio / Snapmaker Orca)
 *      — Available on most desktop installs
 *   3. Native slicer (pure-JS pipeline in native-slicer.js)
 *      — Always available, slower, fewer features
 *
 * Callers don't care which is used. The resolver returns a uniform
 * object exposing { kind, label, slice(), getProfiles() } so other
 * code (Slicer Studio UI, queue manager, etc.) doesn't fork-branch.
 */

import { createLogger } from './logger.js';

const log = createLogger('slicer-resolver');

let _cached = { resolvedAt: 0, value: null };
const CACHE_TTL_MS = 30_000;

/**
 * Resolve the active slicer. Cached — re-resolution happens at most
 * once every CACHE_TTL_MS unless { force: true } is passed.
 *
 * @param {object} [opts]
 * @param {boolean} [opts.force]
 * @param {object} [opts.printerInfo] — passed to the bridge picker
 * @returns {Promise<{kind, label, version, slice, getProfiles}>}
 */
export async function resolveSlicer({ force = false, printerInfo = {} } = {}) {
  const now = Date.now();
  if (!force && _cached.value && now - _cached.resolvedAt < CACHE_TTL_MS) {
    return _cached.value;
  }

  // 1. Forge Slicer (REST service)
  try {
    const forge = await import('./forge-slicer-client.js');
    const probeResult = await forge.probe({ force });
    if (probeResult.ok) {
      const value = {
        kind: 'forge',
        label: probeResult.info?.service || 'Forge Slicer',
        version: probeResult.info?.version || '',
        backend: forge,
        async slice(args) { return forge.slice(args); },
        async getProfiles(opts) { return forge.listProfiles(opts || {}); },
      };
      _cached = { resolvedAt: now, value };
      log.debug(`Resolved forge slicer service v${value.version}`);
      return value;
    }
  } catch (e) {
    log.debug('Forge slicer client probe failed: ' + e.message);
  }

  // 2. CLI bridge (OrcaSlicer / BambuStudio / Snapmaker Orca)
  try {
    const bridge = await import('./slicer-bridge.js');
    const slicer = await bridge.pickSlicer(printerInfo);
    if (slicer) {
      const value = {
        kind: 'bridge',
        label: slicer.label,
        version: '',
        backend: bridge,
        slicer,
        async slice(args) {
          return bridge.sliceModel({ ...args, slicer });
        },
        async getProfiles() {
          return bridge.listProfiles(slicer);
        },
      };
      _cached = { resolvedAt: now, value };
      log.debug(`Resolved CLI bridge slicer: ${value.label}`);
      return value;
    }
  } catch (e) {
    log.debug('Slicer bridge resolution failed: ' + e.message);
  }

  // 3. Native fallback (always available)
  try {
    const native = await import('./native-slicer.js');
    const value = {
      kind: 'native',
      label: 'Native (pure JS)',
      version: '',
      backend: native,
      async slice(args) {
        return native.sliceMeshToGcode(args.mesh, args.settings || {});
      },
      async getProfiles() { return []; },
    };
    _cached = { resolvedAt: now, value };
    log.debug('Resolved native slicer');
    return value;
  } catch (e) {
    throw new Error('No slicer backend available: ' + e.message);
  }
}

export function invalidateCache() { _cached = { resolvedAt: 0, value: null }; }

export function lastResolved() { return _cached.value ? { ..._cached.value, _resolvedAt: _cached.resolvedAt } : null; }
