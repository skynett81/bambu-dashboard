/**
 * Direct Spoolman REST client (opt-in, separate from the Moonraker proxy).
 *
 * The Moonraker proxy in moonraker-client.js is great for read-only flows
 * on Klipper printers, but it only supports GET + set_active. For full
 * two-way sync (create/update/delete a spool in Spoolman when the user
 * changes it here), we talk to the Spoolman server directly over HTTP.
 *
 * Config (in config.json):
 *   "spoolman": {
 *     "enabled": true,
 *     "url": "http://spoolman.local:7912"
 *   }
 *
 * Spoolman v2 API reference: https://donkie.github.io/Spoolman/
 */

import { createLogger } from './logger.js';

const log = createLogger('spoolman');

export class SpoolmanClient {
  constructor({ url }) {
    if (!url) throw new Error('Spoolman URL is required');
    this.base = url.replace(/\/+$/, '') + '/api/v1';
  }

  async _fetch(path, opts = {}) {
    const url = `${this.base}${path}`;
    const res = await fetch(url, {
      ...opts,
      headers: { 'Content-Type': 'application/json', Accept: 'application/json', ...(opts.headers || {}) },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) {
      let msg = `HTTP ${res.status}`;
      try { const body = await res.json(); msg = body.message || body.detail || msg; } catch {}
      throw new Error(`Spoolman ${path}: ${msg}`);
    }
    if (res.status === 204) return null;
    return res.json();
  }

  // ── Info / health ──
  async getInfo()      { return this._fetch('/info'); }
  async health()       { try { await this.getInfo(); return { ok: true }; } catch (e) { return { ok: false, error: e.message }; } }

  // ── Vendors ──
  async listVendors()  { return this._fetch('/vendor'); }
  async getVendor(id)  { return this._fetch(`/vendor/${id}`); }
  async createVendor(body) { return this._fetch('/vendor', { method: 'POST', body: JSON.stringify(body) }); }
  async updateVendor(id, body) { return this._fetch(`/vendor/${id}`, { method: 'PATCH', body: JSON.stringify(body) }); }
  async deleteVendor(id) { return this._fetch(`/vendor/${id}`, { method: 'DELETE' }); }

  // ── Filaments (product profiles) ──
  async listFilaments()     { return this._fetch('/filament'); }
  async getFilament(id)     { return this._fetch(`/filament/${id}`); }
  async createFilament(body) { return this._fetch('/filament', { method: 'POST', body: JSON.stringify(body) }); }
  async updateFilament(id, body) { return this._fetch(`/filament/${id}`, { method: 'PATCH', body: JSON.stringify(body) }); }
  async deleteFilament(id) { return this._fetch(`/filament/${id}`, { method: 'DELETE' }); }

  // ── Spools ──
  async listSpools()     { return this._fetch('/spool'); }
  async getSpool(id)     { return this._fetch(`/spool/${id}`); }
  async createSpool(body) { return this._fetch('/spool', { method: 'POST', body: JSON.stringify(body) }); }
  async updateSpool(id, body) { return this._fetch(`/spool/${id}`, { method: 'PATCH', body: JSON.stringify(body) }); }
  async deleteSpool(id) { return this._fetch(`/spool/${id}`, { method: 'DELETE' }); }
  async useSpool(id, grams) { return this._fetch(`/spool/${id}/use`, { method: 'PUT', body: JSON.stringify({ use_weight: grams }) }); }

  // ── Locations (just a list of strings in Spoolman v2 — no IDs) ──
  async listLocations() {
    const data = await this._fetch('/location');
    return Array.isArray(data) ? data : [];
  }

  // ── Extra fields ──
  async listExtraFields(entity) {
    return this._fetch(`/extra_field/${entity}`);
  }

  // ── Filament types (Spoolman taxonomy) ──
  async listFilamentTypes() { return this._fetch('/filament_type'); }

  // ── Aggregate stats (total spools, used weight, etc.) ──
  async getStats() { return this._fetch('/stats'); }
}

/**
 * Build a client from the global app config.
 * Returns null when Spoolman is not enabled — downstream code should
 * treat that as "skip silently".
 */
export function fromConfig(config) {
  const sm = config?.spoolman;
  if (!sm?.enabled || !sm?.url) return null;
  try {
    return new SpoolmanClient({ url: sm.url });
  } catch (e) {
    log.warn(`Could not create Spoolman client: ${e.message}`);
    return null;
  }
}
