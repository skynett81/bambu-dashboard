// Power Monitor — Shelly & Tasmota smart plug integration
// Polls smart plugs for real-time power consumption and tracks per-print energy use

import { getInventorySetting, getPowerReading, getPowerReadings, upsertPowerReading } from './database.js';

const POLL_INTERVAL_ACTIVE = 10_000;   // 10s during print
const POLL_INTERVAL_IDLE = 60_000;     // 60s when idle
const FETCH_TIMEOUT = 5_000;           // 5s HTTP timeout

let _pollTimer = null;
let _activePrintId = null;          // Current print history ID
let _readings = [];                 // In-memory buffer of current print readings
let _latestPower = null;            // Latest reading { watts, timestamp }
let _totalReadings = 0;

// ── Public API ──

export function initPowerMonitor() {
  const plugType = getInventorySetting('power_plug_type') || 'none';
  if (plugType === 'none') {
    console.log('[power] Monitor disabled (no smart plug configured)');
    return;
  }
  const ip = getInventorySetting('power_plug_ip') || '';
  if (!ip) {
    console.log('[power] Monitor disabled (no plug IP)');
    return;
  }
  console.log(`[power] Monitor initialized: ${plugType} @ ${ip}`);
  _startPolling(false);
}

export function restartMonitor() {
  _stopPolling();
  const plugType = getInventorySetting('power_plug_type') || 'none';
  if (plugType === 'none') {
    _latestPower = null;
    console.log('[power] Monitor stopped');
    return;
  }
  _startPolling(false);
}

// Called when a print starts — switches to active (fast) polling
export function onPrintStart(printId) {
  const plugType = getInventorySetting('power_plug_type') || 'none';
  if (plugType === 'none') return;
  _activePrintId = printId;
  _readings = [];
  _totalReadings = 0;
  console.log(`[power] Print started (id: ${printId}) — active polling`);
  _stopPolling();
  _startPolling(true);
}

// Called when a print ends — saves accumulated readings, switches to idle polling
export function onPrintEnd(printId) {
  const plugType = getInventorySetting('power_plug_type') || 'none';
  if (plugType === 'none') return;
  if (_activePrintId === printId || _activePrintId === null) {
    _flushReadings(printId || _activePrintId);
    _activePrintId = null;
    _readings = [];
    _totalReadings = 0;
    console.log(`[power] Print ended (id: ${printId}) — idle polling`);
    _stopPolling();
    _startPolling(false);
  }
}

// Get current power reading
export function getLatestPower() {
  return _latestPower;
}

// Get live session stats (for current print)
export function getLiveSession() {
  if (!_activePrintId || !_readings.length) return null;

  const totalWh = _calculateWh(_readings);
  const avgWatts = _readings.reduce((s, r) => s + r.watts, 0) / _readings.length;
  const peakWatts = Math.max(..._readings.map(r => r.watts));
  const durationSec = (Date.now() - _readings[0].ts) / 1000;

  return {
    printId: _activePrintId,
    currentWatts: _latestPower?.watts || 0,
    avgWatts: Math.round(avgWatts),
    peakWatts: Math.round(peakWatts),
    totalWh: Math.round(totalWh * 10) / 10,
    totalKwh: Math.round(totalWh / 100) / 10,
    durationSec: Math.round(durationSec),
    readings: _totalReadings
  };
}

// Get power history for a specific print
export function getPrintPower(printId) {
  return getPowerReading(printId);
}

// Get power history summary (last N prints)
export function getPowerHistory(limit = 20) {
  return getPowerReadings(limit);
}

// Manually poll the plug (for testing)
export async function pollNow() {
  return await _poll();
}

// ── Polling ──

function _startPolling(active) {
  if (_pollTimer) clearInterval(_pollTimer);
  const interval = active ? POLL_INTERVAL_ACTIVE : POLL_INTERVAL_IDLE;
  _poll(); // Immediate first poll
  _pollTimer = setInterval(() => _poll(), interval);
}

function _stopPolling() {
  if (_pollTimer) { clearInterval(_pollTimer); _pollTimer = null; }
}

async function _poll() {
  const plugType = getInventorySetting('power_plug_type') || 'none';
  const ip = getInventorySetting('power_plug_ip') || '';
  if (plugType === 'none' || !ip) return null;

  try {
    let watts = null;
    let voltage = null;
    let current = null;
    let extra = {};

    if (plugType === 'shelly_gen1') {
      const data = await _httpGet(`http://${ip}/status`);
      const meter = data?.meters?.[0] || data?.emeters?.[0];
      watts = meter?.power ?? null;
      voltage = data?.voltage ?? null;
      current = meter?.current ?? null;
      extra.temperature = data?.temperature;
      extra.overtemperature = data?.overtemperature;
    } else if (plugType === 'shelly_gen2' || plugType === 'shelly_gen3') {
      const data = await _httpGet(`http://${ip}/rpc/Switch.GetStatus?id=0`);
      watts = data?.apower ?? null;
      voltage = data?.voltage ?? null;
      current = data?.current ?? null;
      extra.temperature = data?.temperature?.tC;
    } else if (plugType === 'tasmota') {
      const data = await _httpGet(`http://${ip}/cm?cmnd=Status%208`);
      const energy = data?.StatusSNS?.ENERGY;
      watts = energy?.Power ?? null;
      voltage = energy?.Voltage ?? null;
      current = energy?.Current ?? null;
      extra.apparentPower = energy?.ApparentPower;
      extra.reactivePower = energy?.ReactivePower;
      extra.factor = energy?.Factor;
      extra.today = energy?.Today;
    }

    if (watts !== null) {
      _latestPower = { watts, voltage, current, extra, timestamp: Date.now() };

      // Buffer reading during active print
      if (_activePrintId) {
        _readings.push({ watts, ts: Date.now() });
        _totalReadings++;

        // Flush to DB every 100 readings to avoid memory bloat
        if (_readings.length >= 100) {
          _flushReadings(_activePrintId, true);
        }
      }
    }

    return _latestPower;
  } catch (e) {
    console.error(`[power] Poll failed (${plugType} @ ${ip}):`, e.message);
    return null;
  }
}

// ── Energy calculation ──

function _calculateWh(readings) {
  if (readings.length < 2) return 0;
  let totalWh = 0;
  for (let i = 1; i < readings.length; i++) {
    const dtHours = (readings[i].ts - readings[i - 1].ts) / 3_600_000;
    const avgW = (readings[i].watts + readings[i - 1].watts) / 2;
    totalWh += avgW * dtHours;
  }
  return totalWh;
}

function _flushReadings(printId, partial = false) {
  if (!printId || !_readings.length) return;

  const totalWh = _calculateWh(_readings);
  const avgWatts = _readings.reduce((s, r) => s + r.watts, 0) / _readings.length;
  const peakWatts = Math.max(..._readings.map(r => r.watts));
  const startedAt = new Date(_readings[0].ts).toISOString();
  const endedAt = new Date(_readings[_readings.length - 1].ts).toISOString();
  const durationSec = (_readings[_readings.length - 1].ts - _readings[0].ts) / 1000;

  try {
    upsertPowerReading(printId, startedAt, endedAt,
      Math.round(totalWh * 10) / 10,
      Math.round(avgWatts),
      Math.round(peakWatts),
      Math.round(durationSec),
      _readings.length
    );

    if (partial) {
      _readings = [_readings[_readings.length - 1]];
    }
  } catch (e) {
    console.error('[power] Flush failed:', e.message);
  }
}

// ── HTTP helper ──

async function _httpGet(url) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT);
  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(timeout);
  }
}
