/**
 * Printer model preset lookup.
 *
 * Resolves a (vendor, model) pair to a preset descriptor so the dashboard
 * can render build volume, capabilities, nozzle count, etc., before the
 * printer has reported its full state over MQTT/WebSocket.
 */

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dir = dirname(fileURLToPath(import.meta.url));
const PRESET_FILE = join(__dir, 'data', 'printer-model-presets.json');

let _cache = null;

function loadPresets() {
  if (_cache) return _cache;
  const raw = JSON.parse(readFileSync(PRESET_FILE, 'utf8'));
  _cache = {
    presets: raw.presets || [],
    placeholders: raw.placeholder_models || [],
  };
  return _cache;
}

function norm(s) {
  return String(s || '').trim().toLowerCase().replace(/\s+/g, ' ');
}

/**
 * Look up a printer preset by vendor + model. Case- and whitespace-insensitive.
 * Returns null if no match.
 */
export function findPrinterPreset(vendor, model) {
  const { presets, placeholders } = loadPresets();
  const v = norm(vendor);
  const m = norm(model);
  if (!v || !m) return null;

  const match = presets.find(p => norm(p.vendor) === v && norm(p.model) === m);
  if (match) return match;

  // Also check placeholders so the UI can warn "hardware not shipped yet"
  const ph = placeholders.find(p => norm(p.vendor) === v && norm(p.model) === m);
  if (ph) return { ...ph, _placeholder: true };

  return null;
}

/** List all concrete (non-placeholder) presets for a given vendor. */
export function listPrinterPresetsForVendor(vendor) {
  const { presets } = loadPresets();
  const v = norm(vendor);
  return presets.filter(p => norm(p.vendor) === v);
}

/** All capability flags known across the preset DB — useful for a filter UI. */
export function listAllCapabilities() {
  const { presets } = loadPresets();
  const set = new Set();
  for (const p of presets) for (const c of p.capabilities || []) set.add(c);
  return Array.from(set).sort();
}

/** Force a reload on next call (tests + post-import). */
export function clearPresetCache() {
  _cache = null;
}
