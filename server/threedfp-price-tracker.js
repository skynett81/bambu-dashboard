/**
 * 3DFilamentProfiles price-history + multi-listing importer.
 *
 * 3DFP aggregates prices from multiple retailers per filament; our existing
 * seed pipeline only stored the first listing. This module extracts the
 * full `price_data.listings[]` array, upserts each retailer as its own
 * row in `price_history`, and tracks history over time so the user can see
 * trends and spot which retailer is cheapest right now.
 */

import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { getDb } from './db/connection.js';
import { createLogger } from './logger.js';

const log = createLogger('3dfp-price');
const __dir = dirname(fileURLToPath(import.meta.url));
const PROFILES_FILE = join(__dir, 'filament-profiles-data.json');

/** Resolve a local filament_profile id for a given 3DFP entry. */
function _findLocalProfile(db, brand, color) {
  if (!brand || !color) return null;
  const row = db.prepare(`SELECT fp.id FROM filament_profiles fp
                          LEFT JOIN vendors v ON v.id = fp.vendor_id
                          WHERE lower(v.name) = lower(?) AND lower(fp.color_name) = lower(?)
                          LIMIT 1`).get(brand, color);
  return row?.id || null;
}

/**
 * Read the cached 3DFP JSON and upsert every retailer-listing into
 * price_history. Creates one row per (profile, retailer, listing_id) tuple
 * per call so time-series trending works.
 */
export function trackPricesFromCache() {
  if (!existsSync(PROFILES_FILE)) return { tracked: 0, skipped: 'no-cache' };
  let raw;
  try { raw = JSON.parse(readFileSync(PROFILES_FILE, 'utf8')); }
  catch (e) { log.warn(`Could not read 3DFP cache: ${e.message}`); return { error: e.message }; }

  const filaments = raw.filaments || raw;
  if (!Array.isArray(filaments)) return { tracked: 0 };

  const db = getDb();
  const stmt = db.prepare(`INSERT INTO price_history
    (filament_profile_id, price, currency, retailer, retailer_url, listing_id, in_stock, recorded_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))`);

  let tracked = 0;
  for (const f of filaments) {
    if (f.deleted) continue;
    const profileId = _findLocalProfile(db, f.brand_name, f.color);
    if (!profileId) continue;

    const listings = f.price_data?.listings || [];
    // If no listings[], fall back to the top-level price_data.price
    if (listings.length === 0 && f.price_data?.price != null) {
      stmt.run(
        profileId, f.price_data.price, f.price_data.currency || 'USD',
        f.price_data.retailer || null, f.price_data.href || null,
        `${f.id}:default`, null,
      );
      tracked++;
      continue;
    }

    for (const listing of listings) {
      const price = listing.price?.value ?? listing.price ?? null;
      if (price == null || price <= 0) continue;
      stmt.run(
        profileId,
        price,
        listing.price?.currency || listing.currency || 'USD',
        listing.retailer || listing.store || null,
        listing.href || listing.url || null,
        listing.id || `${f.id}:${listing.retailer || 'unknown'}`,
        listing.in_stock === false ? 0 : 1,
      );
      tracked++;
    }
  }
  log.info(`Tracked ${tracked} price rows from 3DFP cache`);
  return { tracked };
}

/** Current cheapest listing per filament_profile_id (latest recorded_at). */
export function getCheapestListings() {
  return getDb().prepare(`
    WITH latest AS (
      SELECT filament_profile_id, listing_id, retailer, retailer_url, price, currency, in_stock,
             ROW_NUMBER() OVER (PARTITION BY filament_profile_id, listing_id ORDER BY recorded_at DESC) rn
      FROM price_history
      WHERE filament_profile_id IS NOT NULL
    ),
    priced AS (
      SELECT * FROM latest WHERE rn = 1 AND price > 0 AND (in_stock IS NULL OR in_stock = 1)
    )
    SELECT p.*, fp.name, fp.material, v.name AS vendor_name
    FROM priced p
    LEFT JOIN filament_profiles fp ON fp.id = p.filament_profile_id
    LEFT JOIN vendors v ON v.id = fp.vendor_id
    ORDER BY p.filament_profile_id, p.price ASC
  `).all();
}

/** Price trend for a specific profile over N days. */
export function getPriceTrend(profileId, days = 30) {
  return getDb().prepare(`SELECT recorded_at, retailer, price, currency
                          FROM price_history
                          WHERE filament_profile_id = ?
                            AND julianday('now') - julianday(recorded_at) <= ?
                          ORDER BY recorded_at ASC`).all(profileId, days);
}
