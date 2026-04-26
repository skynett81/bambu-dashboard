/**
 * Filament image cache.
 *
 * Downloads filament photos referenced in community DBs (3DFP image_url,
 * vendor logos, Bambu product shots) and keeps them on disk so the
 * dashboard doesn't leak user IPs to third-party CDNs and survives
 * upstream URL rot.
 *
 * Cache layout:
 *   <data-dir>/filament-images/<sha256-of-url>.<ext>
 *
 * Entry metadata lives in the `filament_image_cache` table (see
 * migration 126).
 */

import { createHash } from 'node:crypto';
import { createWriteStream, existsSync, mkdirSync, statSync, unlinkSync } from 'node:fs';
import { Writable } from 'node:stream';
import { join } from 'node:path';
import { getDb } from './db/connection.js';
import { DATA_DIR } from './config.js';
import { createLogger } from './logger.js';

const log = createLogger('image-cache');

const CACHE_DIR = join(DATA_DIR, 'filament-images');
const MAX_BYTES = 5 * 1024 * 1024; // 5 MB per image
const SUPPORTED_TYPES = new Set(['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']);

if (!existsSync(CACHE_DIR)) mkdirSync(CACHE_DIR, { recursive: true });

function _hash(url) { return createHash('sha256').update(url).digest('hex'); }

function _extFor(contentType) {
  return {
    'image/jpeg': 'jpg', 'image/jpg': 'jpg', 'image/png': 'png',
    'image/webp': 'webp', 'image/gif': 'gif',
  }[contentType] || 'bin';
}

/**
 * Return a local file path for the given remote image URL, downloading it
 * on demand. Subsequent calls hit the cache (memory-fast metadata lookup).
 * Returns null on any failure — callers should fall back to the source URL.
 */
export async function getCachedImage(sourceUrl) {
  if (!sourceUrl || typeof sourceUrl !== 'string') return null;
  if (!/^https?:\/\//i.test(sourceUrl)) return null;

  const db = getDb();
  const existing = db.prepare('SELECT * FROM filament_image_cache WHERE source_url = ?').get(sourceUrl);
  if (existing && existsSync(existing.local_path)) {
    // Bump last_used_at (fire-and-forget, ignore errors)
    try { db.prepare('UPDATE filament_image_cache SET last_used_at = datetime(\'now\') WHERE id = ?').run(existing.id); } catch {}
    return existing.local_path;
  }

  try {
    const res = await fetch(sourceUrl, { signal: AbortSignal.timeout(15_000) });
    if (!res.ok) return null;
    const contentType = (res.headers.get('content-type') || '').toLowerCase().split(';')[0].trim();
    if (!SUPPORTED_TYPES.has(contentType)) {
      log.warn(`Unsupported content-type ${contentType} for ${sourceUrl}`);
      return null;
    }
    const lengthHeader = res.headers.get('content-length');
    if (lengthHeader && parseInt(lengthHeader, 10) > MAX_BYTES) {
      log.warn(`Image too large (${lengthHeader} bytes): ${sourceUrl}`);
      return null;
    }

    const fileName = `${_hash(sourceUrl)}.${_extFor(contentType)}`;
    const localPath = join(CACHE_DIR, fileName);

    // Stream to disk with a byte cap — protects against misreported Content-Length.
    const buffer = Buffer.from(await res.arrayBuffer());
    if (buffer.length > MAX_BYTES) {
      log.warn(`Image body exceeds ${MAX_BYTES} bytes after download: ${sourceUrl}`);
      return null;
    }
    await new Promise((resolve, reject) => {
      const stream = createWriteStream(localPath);
      stream.on('finish', resolve);
      stream.on('error', reject);
      stream.end(buffer);
    });

    db.prepare(`INSERT INTO filament_image_cache (source_url, local_path, content_type, size_bytes, last_used_at)
                VALUES (?, ?, ?, ?, datetime('now'))
                ON CONFLICT(source_url) DO UPDATE SET
                  local_path = excluded.local_path,
                  content_type = excluded.content_type,
                  size_bytes = excluded.size_bytes,
                  fetched_at = datetime('now'),
                  last_used_at = datetime('now')`)
      .run(sourceUrl, localPath, contentType, buffer.length);

    return localPath;
  } catch (e) {
    log.warn(`Cache fetch failed for ${sourceUrl}: ${e.message}`);
    return null;
  }
}

/** Evict images older than maxAgeDays AND not used in lastUsedDays days. */
export function pruneCache({ maxAgeDays = 180, lastUsedDays = 60 } = {}) {
  const db = getDb();
  const stale = db.prepare(`SELECT id, local_path FROM filament_image_cache
                            WHERE julianday('now') - julianday(fetched_at) > ?
                              AND (last_used_at IS NULL OR julianday('now') - julianday(last_used_at) > ?)`)
    .all(maxAgeDays, lastUsedDays);
  let removed = 0;
  for (const row of stale) {
    try { if (existsSync(row.local_path)) unlinkSync(row.local_path); } catch {}
    try { db.prepare('DELETE FROM filament_image_cache WHERE id = ?').run(row.id); removed++; } catch {}
  }
  return removed;
}

export function cacheDir() { return CACHE_DIR; }
