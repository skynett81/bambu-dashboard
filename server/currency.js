/**
 * Multi-currency support — user picks a display currency, prices are
 * converted from the canonical USD rate at query time.
 *
 * Exchange rates come from frankfurter.app (free, no API key) and are
 * cached in the inventory_settings table for 24h. Falls back to a sane
 * static table when offline.
 *
 * The API surface is small on purpose:
 *   - getActiveCurrency()   → 'NOK' | 'USD' | …
 *   - setActiveCurrency()
 *   - getRate(code)         → rate vs USD (1 USD = rate of code)
 *   - convert(amount, from, to)
 *   - format(amount)        → "kr 123,45" / "$ 12.34" / etc.
 */

import { getDb } from './db/connection.js';

const SUPPORTED_CURRENCIES = [
  { code: 'USD', symbol: '$',   name: 'US Dollar',    locale: 'en-US' },
  { code: 'EUR', symbol: '€',   name: 'Euro',         locale: 'de-DE' },
  { code: 'NOK', symbol: 'kr',  name: 'Norske kroner',locale: 'nb-NO' },
  { code: 'SEK', symbol: 'kr',  name: 'Svenska kronor',locale: 'sv-SE' },
  { code: 'DKK', symbol: 'kr',  name: 'Danske kroner',locale: 'da-DK' },
  { code: 'GBP', symbol: '£',   name: 'British Pound',locale: 'en-GB' },
  { code: 'CHF', symbol: 'CHF', name: 'Swiss Franc',  locale: 'de-CH' },
  { code: 'JPY', symbol: '¥',   name: 'Japanese Yen', locale: 'ja-JP' },
  { code: 'CNY', symbol: '¥',   name: 'Chinese Yuan', locale: 'zh-CN' },
  { code: 'CAD', symbol: 'C$',  name: 'Canadian Dollar', locale: 'en-CA' },
  { code: 'AUD', symbol: 'A$',  name: 'Australian Dollar', locale: 'en-AU' },
  { code: 'PLN', symbol: 'zł',  name: 'Polish Zloty', locale: 'pl-PL' },
  { code: 'CZK', symbol: 'Kč',  name: 'Czech Koruna', locale: 'cs-CZ' },
];

// Last-resort fallback rates (1 USD → currency). Updated 2026-04 ish.
const FALLBACK_RATES_VS_USD = {
  USD: 1.00, EUR: 0.92, NOK: 10.4, SEK: 10.5, DKK: 6.85, GBP: 0.79,
  CHF: 0.88, JPY: 149.5, CNY: 7.20, CAD: 1.35, AUD: 1.51, PLN: 4.05, CZK: 23.10,
};

const RATE_CACHE_KEY = 'currency.rates_json';
const ACTIVE_CURRENCY_KEY = 'currency.active';
const RATE_TIMESTAMP_KEY = 'currency.rates_updated_at';
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

function _setting(key, value) {
  if (value === undefined) {
    const row = getDb().prepare('SELECT value FROM inventory_settings WHERE key = ?').get(key);
    return row?.value;
  }
  getDb().prepare(`
    INSERT INTO inventory_settings (key, value) VALUES (?, ?)
    ON CONFLICT(key) DO UPDATE SET value = excluded.value
  `).run(key, value);
}

export function listCurrencies() {
  return SUPPORTED_CURRENCIES.slice();
}

export function getActiveCurrency() {
  return _setting(ACTIVE_CURRENCY_KEY) || 'USD';
}

export function setActiveCurrency(code) {
  const found = SUPPORTED_CURRENCIES.find(c => c.code === code);
  if (!found) throw new Error(`Unsupported currency: ${code}`);
  _setting(ACTIVE_CURRENCY_KEY, code);
  return found;
}

function _loadRates() {
  const json = _setting(RATE_CACHE_KEY);
  if (!json) return { ...FALLBACK_RATES_VS_USD };
  try {
    return JSON.parse(json);
  } catch {
    return { ...FALLBACK_RATES_VS_USD };
  }
}

function _ratesAreFresh() {
  const ts = parseInt(_setting(RATE_TIMESTAMP_KEY) || '0', 10);
  return ts && (Date.now() - ts) < CACHE_TTL_MS;
}

/**
 * Refresh exchange rates from frankfurter.app. Awaits the network — call
 * this from a periodic job, NOT inline on every request.
 */
export async function refreshRates() {
  // frankfurter.app gives us EUR-based rates; convert to USD-based.
  try {
    const res = await fetch('https://api.frankfurter.app/latest?from=USD', { signal: AbortSignal.timeout(8000) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    const rates = { USD: 1.0, ...data.rates };
    // Frankfurter doesn't include all our currencies; backfill from fallback.
    for (const c of SUPPORTED_CURRENCIES) if (rates[c.code] == null) rates[c.code] = FALLBACK_RATES_VS_USD[c.code];
    _setting(RATE_CACHE_KEY, JSON.stringify(rates));
    _setting(RATE_TIMESTAMP_KEY, String(Date.now()));
    return rates;
  } catch (e) {
    return { error: e.message, rates: _loadRates() };
  }
}

export function getRate(code) {
  const rates = _loadRates();
  return rates[code] ?? FALLBACK_RATES_VS_USD[code] ?? 1;
}

/**
 * Convert an amount between currencies. Both codes must be in
 * SUPPORTED_CURRENCIES.
 */
export function convert(amount, from, to) {
  if (typeof amount !== 'number' || !Number.isFinite(amount)) return 0;
  if (from === to) return amount;
  // Normalise to USD then to target.
  const usd = amount / getRate(from);
  return usd * getRate(to);
}

/**
 * Format an amount in the active (or specified) currency using locale-aware
 * Intl.NumberFormat where available.
 */
export function format(amount, code) {
  const target = code || getActiveCurrency();
  const cur = SUPPORTED_CURRENCIES.find(c => c.code === target) || SUPPORTED_CURRENCIES[0];
  try {
    return new Intl.NumberFormat(cur.locale, { style: 'currency', currency: cur.code }).format(amount);
  } catch {
    return `${cur.symbol} ${amount.toFixed(2)}`;
  }
}

/**
 * Convenience: convert from the canonical storage currency (USD) to the
 * user's active currency, then format.
 */
export function display(amountUsd) {
  const target = getActiveCurrency();
  const converted = convert(amountUsd, 'USD', target);
  return format(converted, target);
}

/** Snapshot for the API. */
export function getCurrencyState() {
  return {
    active: getActiveCurrency(),
    supported: SUPPORTED_CURRENCIES,
    rates: _loadRates(),
    rates_updated_at: parseInt(_setting(RATE_TIMESTAMP_KEY) || '0', 10) || null,
    fresh: _ratesAreFresh(),
  };
}

export const _internals = { SUPPORTED_CURRENCIES, FALLBACK_RATES_VS_USD, _setting };
