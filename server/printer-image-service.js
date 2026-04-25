/**
 * Printer Image Service — local cache + optional vendor-URL fetch.
 *
 * Goal: when the dashboard wants a representative image of a user's
 * printer (Fleet card, history list, queue dispatch UI), serve a real
 * product photo when we have one and fall back to the existing
 * SVG-icon placeholder otherwise.
 *
 * Storage: each cached image lives in `data/printer-images/{slug}.bin`
 * (we keep the original content-type in `.bin` so callers can serve
 * back the right MIME). The registry (`server/data/printer-image-
 * registry.json`) maps a model name to an upstream vendor URL.
 *
 * Resolution order on every request:
 *   1. Cache hit on disk → serve immediately
 *   2. Registry has URL → fetch + validate content-type → cache → serve
 *   3. No URL or fetch failed → return null (caller falls back to SVG)
 *
 * Admin upload (POST /api/printer-image/:model with binary body) lets
 * users supply their own image for any model the registry doesn't
 * cover — overwrites whatever the cache had.
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync, unlinkSync, readdirSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { createLogger } from './logger.js';
const log = createLogger('printer-images');

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = process.env.DATA_DIR || join(__dirname, '..', 'data');
const CACHE_DIR = join(DATA_DIR, 'printer-images');
const REGISTRY_PATH = join(__dirname, 'data', 'printer-image-registry.json');

if (!existsSync(CACHE_DIR)) mkdirSync(CACHE_DIR, { recursive: true });

let _registry = null;

/**
 * Lazily read the model→URL registry. Reads once, then caches in memory.
 */
function _loadRegistry() {
  if (_registry) return _registry;
  try {
    if (existsSync(REGISTRY_PATH)) {
      _registry = JSON.parse(readFileSync(REGISTRY_PATH, 'utf-8'));
    } else {
      _registry = {};
    }
  } catch (e) {
    log.warn(`registry parse failed: ${e.message}`);
    _registry = {};
  }
  return _registry;
}

function _slug(model) {
  return String(model || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '');
}

function _cachePath(slug, ext = 'bin') {
  return join(CACHE_DIR, `${slug}.${ext}`);
}

function _metaPath(slug) {
  return join(CACHE_DIR, `${slug}.meta.json`);
}

function _getCachedRecord(slug) {
  const bin = _cachePath(slug);
  const meta = _metaPath(slug);
  if (!existsSync(bin) || !existsSync(meta)) return null;
  try {
    const metaJson = JSON.parse(readFileSync(meta, 'utf-8'));
    const buffer = readFileSync(bin);
    return { buffer, contentType: metaJson.contentType || 'image/png', source: metaJson.source || 'unknown' };
  } catch {
    return null;
  }
}

function _writeCache(slug, buffer, contentType, source) {
  writeFileSync(_cachePath(slug), buffer);
  writeFileSync(_metaPath(slug), JSON.stringify({
    contentType, source, savedAt: new Date().toISOString(), bytes: buffer.length,
  }, null, 2));
}

/**
 * Fetch from registry URL with a hard timeout + content-type guard.
 * Returns { buffer, contentType } or null on any failure.
 */
async function _fetchFromVendor(url) {
  if (!url) return null;
  try {
    const ac = new AbortController();
    const timeout = setTimeout(() => ac.abort(), 8000);
    const res = await fetch(url, {
      signal: ac.signal,
      headers: { 'User-Agent': '3DPrintForge/1.1 (+https://github.com/skynett81/3dprintforge)' },
    });
    clearTimeout(timeout);
    if (!res.ok) {
      log.warn(`fetch ${url} → ${res.status}`);
      return null;
    }
    const ct = res.headers.get('content-type') || '';
    if (!ct.startsWith('image/')) {
      log.warn(`fetch ${url} returned non-image content-type: ${ct}`);
      return null;
    }
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length < 200) {
      // Suspiciously tiny — probably an error placeholder.
      log.warn(`fetch ${url} returned only ${buf.length} bytes; ignoring`);
      return null;
    }
    return { buffer: buf, contentType: ct };
  } catch (e) {
    log.warn(`fetch ${url} failed: ${e.message}`);
    return null;
  }
}

/**
 * Get an image for a printer model.
 *
 * @param {string} model - the model name (case-insensitive)
 * @returns {Promise<null | { buffer, contentType, source }>}
 */
export async function getPrinterImage(model) {
  if (!model) return null;
  const slug = _slug(model);
  if (!slug) return null;

  // 1. Cache hit
  const cached = _getCachedRecord(slug);
  if (cached) return cached;

  // 2. Registry lookup
  const reg = _loadRegistry();
  const url = reg[slug];
  if (!url) return null;

  // 3. Fetch + cache
  const fetched = await _fetchFromVendor(url);
  if (!fetched) return null;
  _writeCache(slug, fetched.buffer, fetched.contentType, url);
  return { ...fetched, source: url };
}

/**
 * Manually upload an image for a model. Used by the admin endpoint
 * when the registry has no URL (or returned a bad image) and the user
 * wants to supply their own.
 *
 * @param {string} model
 * @param {Buffer} buffer
 * @param {string} contentType - e.g. 'image/png', 'image/webp'
 */
export function uploadPrinterImage(model, buffer, contentType = 'image/png') {
  const slug = _slug(model);
  if (!slug) throw new Error('model required');
  if (!buffer || !buffer.length) throw new Error('empty buffer');
  if (!contentType.startsWith('image/')) throw new Error('content-type must be image/*');
  _writeCache(slug, buffer, contentType, 'admin-upload');
  return { slug, bytes: buffer.length, contentType };
}

/**
 * Wipe a single cached image. Useful when the upstream URL was bad and
 * the user wants to re-fetch on the next request.
 */
export function clearPrinterImage(model) {
  const slug = _slug(model);
  const bin = _cachePath(slug);
  const meta = _metaPath(slug);
  let removed = 0;
  if (existsSync(bin)) { unlinkSync(bin); removed++; }
  if (existsSync(meta)) { unlinkSync(meta); removed++; }
  return { slug, filesRemoved: removed };
}

/**
 * Cache stats for the admin / diagnostics panel.
 */
export function getCacheStats() {
  if (!existsSync(CACHE_DIR)) return { entries: 0, bytes: 0 };
  let entries = 0, bytes = 0;
  for (const f of readdirSync(CACHE_DIR)) {
    if (!f.endsWith('.bin')) continue;
    entries++;
    bytes += statSync(join(CACHE_DIR, f)).size;
  }
  return { entries, bytes };
}

/**
 * List the registry with cache-state for each entry. Used by the admin
 * UI to show "which models have a real photo, which are using fallback,
 * which can still be filled in".
 */
export function listRegistry() {
  const reg = _loadRegistry();
  const out = [];
  for (const [slug, url] of Object.entries(reg)) {
    if (slug.startsWith('_')) continue; // _comment, _meta etc.
    const cached = !!_getCachedRecord(slug);
    out.push({ slug, url: url || null, cached });
  }
  return out;
}

/**
 * Force-refresh every entry in the registry that has a URL but no
 * (or stale) cache entry. Returns counts so the admin UI can report.
 */
export async function refreshAll(opts = {}) {
  const force = !!opts.force;
  const reg = _loadRegistry();
  const result = { fetched: 0, cached: 0, skipped: 0, failed: 0 };
  for (const [slug, url] of Object.entries(reg)) {
    if (slug.startsWith('_')) continue;
    if (!url) { result.skipped++; continue; }
    if (!force && _getCachedRecord(slug)) { result.cached++; continue; }
    const data = await _fetchFromVendor(url);
    if (data) {
      _writeCache(slug, data.buffer, data.contentType, url);
      result.fetched++;
    } else {
      result.failed++;
    }
  }
  return result;
}

export const _internals = { _slug, _loadRegistry, CACHE_DIR };
