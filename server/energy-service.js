// Energy Service — Tibber & Nordpool spot price integration
// Fetches hourly electricity prices and integrates with cost calculator

import { getInventorySetting, setInventorySetting } from './database.js';

const TIBBER_API = 'https://api.tibber.com/v1-beta/gql';
const NORDPOOL_API = 'https://www.hvakosterstrommen.no/api/v1/prices';

let _prices = [];       // Cached hourly prices [{startsAt, total, currency}]
let _fetchTimer = null;
let _lastFetch = 0;

// ── Public API ──

export function initEnergyService() {
  const provider = getInventorySetting('energy_provider') || 'none';
  if (provider === 'none') {
    console.log('[energy] Service disabled (no provider configured)');
    return;
  }
  console.log(`[energy] Initialized with provider: ${provider}`);
  _scheduleFetch();
}

export async function fetchPrices() {
  const provider = getInventorySetting('energy_provider') || 'none';
  if (provider === 'none') return { prices: [], provider: 'none' };

  try {
    if (provider === 'tibber') {
      return await _fetchTibber();
    } else if (provider === 'nordpool') {
      return await _fetchNordpool();
    }
  } catch (e) {
    console.error(`[energy] Fetch failed (${provider}):`, e.message);
    return { prices: _prices, provider, error: e.message };
  }
  return { prices: [], provider };
}

export function getCurrentPrice() {
  const now = new Date();
  const hourStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours()).toISOString();
  const current = _prices.find(p => {
    const pStart = new Date(p.startsAt);
    return pStart.getHours() === now.getHours() &&
           pStart.getDate() === now.getDate() &&
           pStart.getMonth() === now.getMonth();
  });
  return current || null;
}

export function getPriceForHour(date) {
  const d = new Date(date);
  return _prices.find(p => {
    const pStart = new Date(p.startsAt);
    return pStart.getHours() === d.getHours() &&
           pStart.getDate() === d.getDate() &&
           pStart.getMonth() === d.getMonth();
  }) || null;
}

export function getCachedPrices() {
  return {
    prices: _prices,
    provider: getInventorySetting('energy_provider') || 'none',
    lastFetch: _lastFetch,
    currentPrice: getCurrentPrice()
  };
}

// Calculate electricity cost using actual spot prices for a print
export function calculateSpotCost(startedAt, durationSeconds, wattage) {
  if (!_prices.length || !startedAt || !durationSeconds || !wattage) return null;

  const start = new Date(startedAt);
  const end = new Date(start.getTime() + durationSeconds * 1000);
  const kw = wattage / 1000;
  let totalCost = 0;
  let hoursMatched = 0;

  // Walk through each hour of the print
  const current = new Date(start);
  while (current < end) {
    const hourEnd = new Date(current.getFullYear(), current.getMonth(), current.getDate(), current.getHours() + 1);
    const segmentEnd = hourEnd < end ? hourEnd : end;
    const segmentHours = (segmentEnd - current) / 3600000;

    const price = getPriceForHour(current);
    if (price) {
      totalCost += segmentHours * kw * price.total;
      hoursMatched++;
    } else {
      // Fallback to static rate
      const staticRate = parseFloat(getInventorySetting('electricity_rate_kwh') || '0');
      totalCost += segmentHours * kw * staticRate;
    }
    current.setTime(hourEnd.getTime());
  }

  return { cost: Math.round(totalCost * 100) / 100, hoursMatched, currency: _prices[0]?.currency || 'NOK' };
}

// Get price statistics for today
export function getTodayStats() {
  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const todayPrices = _prices.filter(p => p.startsAt.startsWith(todayStr));

  if (!todayPrices.length) return null;

  const prices = todayPrices.map(p => p.total);
  const current = getCurrentPrice();
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const avg = prices.reduce((a, b) => a + b, 0) / prices.length;
  const minHour = todayPrices.find(p => p.total === min);
  const maxHour = todayPrices.find(p => p.total === max);

  // Price level thresholds
  const level = current ? (current.total <= avg * 0.8 ? 'low' : current.total >= avg * 1.2 ? 'high' : 'normal') : 'unknown';

  return {
    current: current?.total || null,
    min, max, avg: Math.round(avg * 100) / 100,
    minHour: minHour ? new Date(minHour.startsAt).getHours() : null,
    maxHour: maxHour ? new Date(maxHour.startsAt).getHours() : null,
    level,
    count: todayPrices.length,
    currency: todayPrices[0]?.currency || 'NOK',
    prices: todayPrices
  };
}

// Find cheapest window to start a print of given duration
export function findCheapestWindow(durationMinutes) {
  if (!_prices.length || !durationMinutes) return null;

  const durationHours = durationMinutes / 60;
  const hoursNeeded = Math.ceil(durationHours);
  let bestStart = null;
  let bestCost = Infinity;

  for (let i = 0; i <= _prices.length - hoursNeeded; i++) {
    const window = _prices.slice(i, i + hoursNeeded);
    // Weight last partial hour
    let cost = 0;
    for (let j = 0; j < window.length; j++) {
      const hours = j < window.length - 1 ? 1 : (durationHours - Math.floor(durationHours)) || 1;
      cost += window[j].total * hours;
    }
    if (cost < bestCost) {
      bestCost = cost;
      bestStart = window[0].startsAt;
    }
  }

  return bestStart ? { startsAt: bestStart, avgPrice: Math.round((bestCost / durationHours) * 100) / 100, currency: _prices[0]?.currency || 'NOK' } : null;
}

// ── Tibber ──

async function _fetchTibber() {
  const token = getInventorySetting('energy_tibber_token');
  if (!token) throw new Error('Tibber API token not configured');

  const query = `{
    viewer {
      homes {
        currentSubscription {
          priceInfo {
            current { total startsAt currency level }
            today { total startsAt currency level }
            tomorrow { total startsAt currency level }
          }
        }
      }
    }
  }`;

  const res = await fetch(TIBBER_API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify({ query })
  });

  if (!res.ok) throw new Error(`Tibber API ${res.status}: ${res.statusText}`);
  const data = await res.json();

  if (data.errors?.length) throw new Error(data.errors[0].message);

  const home = data.data?.viewer?.homes?.[0];
  const sub = home?.currentSubscription?.priceInfo;
  if (!sub) throw new Error('No subscription data found');

  const allPrices = [...(sub.today || []), ...(sub.tomorrow || [])];
  _prices = allPrices.map(p => ({
    startsAt: p.startsAt,
    total: p.total,
    currency: p.currency,
    level: p.level
  }));
  _lastFetch = Date.now();

  console.log(`[energy] Tibber: ${_prices.length} prices loaded (${sub.today?.length || 0} today, ${sub.tomorrow?.length || 0} tomorrow)`);
  return { prices: _prices, provider: 'tibber', current: sub.current };
}

// ── Nordpool (via hvakosterstrommen.no) ──

async function _fetchNordpool() {
  const zone = getInventorySetting('energy_nordpool_zone') || 'NO1';
  const now = new Date();
  const today = `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

  // Fetch today
  const todayUrl = `${NORDPOOL_API}/${today}_${zone}.json`;
  const todayRes = await fetch(todayUrl);
  let allPrices = [];

  if (todayRes.ok) {
    const todayData = await todayRes.json();
    allPrices = todayData.map(p => ({
      startsAt: p.time_start,
      total: p.NOK_per_kWh,
      currency: 'NOK',
      level: null
    }));
  }

  // Try tomorrow
  const tomorrow = new Date(now.getTime() + 86400000);
  const tomorrowStr = `${tomorrow.getFullYear()}/${String(tomorrow.getMonth() + 1).padStart(2, '0')}-${String(tomorrow.getDate()).padStart(2, '0')}`;
  try {
    const tomorrowUrl = `${NORDPOOL_API}/${tomorrowStr}_${zone}.json`;
    const tomorrowRes = await fetch(tomorrowUrl);
    if (tomorrowRes.ok) {
      const tomorrowData = await tomorrowRes.json();
      allPrices.push(...tomorrowData.map(p => ({
        startsAt: p.time_start,
        total: p.NOK_per_kWh,
        currency: 'NOK',
        level: null
      })));
    }
  } catch { /* Tomorrow prices may not be available yet */ }

  _prices = allPrices;
  _lastFetch = Date.now();

  // Assign levels based on average
  if (_prices.length) {
    const avg = _prices.reduce((s, p) => s + p.total, 0) / _prices.length;
    for (const p of _prices) {
      p.level = p.total <= avg * 0.8 ? 'VERY_CHEAP' : p.total <= avg * 0.95 ? 'CHEAP' : p.total >= avg * 1.2 ? 'VERY_EXPENSIVE' : p.total >= avg * 1.05 ? 'EXPENSIVE' : 'NORMAL';
    }
  }

  console.log(`[energy] Nordpool ${zone}: ${_prices.length} prices loaded`);
  return { prices: _prices, provider: 'nordpool' };
}

// ── Scheduling ──

function _scheduleFetch() {
  if (_fetchTimer) clearInterval(_fetchTimer);

  // Fetch immediately
  fetchPrices().catch(() => {});

  // Then every hour (prices update ~13:00 for next day)
  _fetchTimer = setInterval(() => fetchPrices().catch(() => {}), 3600000);
}

export function restartService() {
  const provider = getInventorySetting('energy_provider') || 'none';
  if (provider === 'none') {
    if (_fetchTimer) { clearInterval(_fetchTimer); _fetchTimer = null; }
    _prices = [];
    console.log('[energy] Service stopped');
    return;
  }
  _scheduleFetch();
}
