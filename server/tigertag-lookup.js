/**
 * TigerTag filament database lookup.
 *
 * TigerTag is an open NFC-tag standard for 3D-printing filaments. Tags are
 * NXP 213/215/216 or MIFARE 1k, and each encodes a stable UID + a pointer
 * into a community-curated profile DB at https://tigertag.io/.
 *
 * This module is the **lookup surface** — it resolves a TigerTag UID to a
 * filament profile the rest of the app can use (material, color, vendor,
 * drying temp/time, bed temp, nozzle temp range).
 *
 * Data sources (tried in order):
 *   1. User-supplied offline DB at config/tigertag.json (bundled or updated
 *      manually by the user)
 *   2. Online lookup at https://api.tigertag.io/v2/tag/<uid> (opt-in via
 *      `enableOnlineLookup: true` in the tigertag config)
 *
 * Caching: successful online lookups are cached in-memory for the lifetime
 * of the process to avoid re-hitting the API for the same tag.
 */

import { createLogger } from './logger.js';

const log = createLogger('tigertag');

const DEFAULT_API_HOST = 'https://api.tigertag.io';

export class TigerTagLookup {
  constructor({ offlineDb = {}, enableOnlineLookup = false, apiHost = DEFAULT_API_HOST } = {}) {
    // offlineDb: { '<uid>': { material, color, vendor, ...} }
    this.offlineDb = offlineDb;
    this.enableOnlineLookup = enableOnlineLookup;
    this.apiHost = apiHost.replace(/\/+$/, '');
    this._cache = new Map();
  }

  /**
   * Resolve a TigerTag UID to a filament profile.
   * Returns null if unknown in offline DB and online lookup disabled/failed.
   */
  async lookup(uid) {
    if (!uid || typeof uid !== 'string') return null;
    const normalised = uid.trim().toUpperCase().replace(/[^0-9A-F]/g, '');
    if (!normalised) return null;

    // 1. In-memory cache
    if (this._cache.has(normalised)) return this._cache.get(normalised);

    // 2. Offline DB (bundled or user-supplied)
    const offline = this.offlineDb[normalised] || this.offlineDb[uid];
    if (offline) {
      const profile = this._normalise(offline, 'offline');
      this._cache.set(normalised, profile);
      return profile;
    }

    // 3. Online lookup (opt-in)
    if (this.enableOnlineLookup) {
      try {
        const res = await fetch(`${this.apiHost}/v2/tag/${encodeURIComponent(normalised)}`, {
          signal: AbortSignal.timeout(5000),
          headers: { Accept: 'application/json' },
        });
        if (res.ok) {
          const data = await res.json();
          const profile = this._normalise(data, 'online');
          this._cache.set(normalised, profile);
          return profile;
        }
        if (res.status === 404) {
          this._cache.set(normalised, null);
          return null;
        }
        log.warn(`tigertag online lookup failed: HTTP ${res.status}`);
      } catch (e) {
        log.warn(`tigertag online lookup error: ${e.message}`);
      }
    }

    return null;
  }

  /** Normalise varying source shapes to a single filament profile type. */
  _normalise(data, source) {
    return {
      uid: String(data.uid || '').toUpperCase(),
      vendor: data.vendor || data.brand || null,
      material: data.material || data.type || null,
      color: data.color || data.colour || null,
      colorName: data.color_name || data.colorName || null,
      diameter: typeof data.diameter === 'number' ? data.diameter : null,
      density: typeof data.density === 'number' ? data.density : null,
      weightG: typeof data.weight_g === 'number' ? data.weight_g : null,
      bedTemp: typeof data.bed_temp === 'number' ? data.bed_temp : null,
      nozzleTempMin: typeof data.nozzle_temp_min === 'number' ? data.nozzle_temp_min : null,
      nozzleTempMax: typeof data.nozzle_temp_max === 'number' ? data.nozzle_temp_max : null,
      dryingTemp: typeof data.drying_temp === 'number' ? data.drying_temp : null,
      dryingTimeH: typeof data.drying_time_h === 'number' ? data.drying_time_h : null,
      source,
    };
  }

  /** Replace or extend the offline DB at runtime (e.g. after a user imports new tags). */
  mergeOfflineDb(entries) {
    if (!entries || typeof entries !== 'object') return;
    Object.assign(this.offlineDb, entries);
    this._cache.clear();
  }
}
