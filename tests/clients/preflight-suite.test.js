// preflight-suite.test.js — verify test-print library, preflight checks,
// quality metrics, and currency module.

import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';
import { setupTestDb } from '../test-helper.js';
import { listTestPrints, getTestPrint, listTags, listPurposes } from '../../server/test-print-library.js';
import { runPreflight, _internals as pfInt } from '../../server/preflight-checks.js';
import {
  getSuccessRates, getMtbf, getCostMetrics, getFilamentEfficiency, getDashboardMetrics,
} from '../../server/quality-metrics.js';
import {
  listCurrencies, getActiveCurrency, setActiveCurrency, convert, format, getRate, getCurrencyState,
} from '../../server/currency.js';

describe('Test-print library', () => {
  it('exposes 12 standard prints', () => {
    assert.equal(listTestPrints().length, 12);
  });

  it('filter by tag', () => {
    const benchmarks = listTestPrints({ tag: 'benchmark' });
    assert.ok(benchmarks.length > 0);
    assert.ok(benchmarks.every(p => p.tags.includes('benchmark')));
  });

  it('filter by purpose', () => {
    const cal = listTestPrints({ purpose: 'temperature' });
    assert.ok(cal.every(p => p.purpose === 'temperature'));
  });

  it('getTestPrint() returns expected metadata', () => {
    const p = getTestPrint('3dbenchy');
    assert.ok(p);
    assert.equal(p.name, '3DBenchy');
    assert.ok(p.expected_minutes > 0);
    assert.ok(p.look_for.length >= 3);
  });

  it('returns null for unknown id', () => {
    assert.equal(getTestPrint('does-not-exist'), null);
  });

  it('exposes tags and purposes', () => {
    assert.ok(listTags().length > 0);
    assert.ok(listPurposes().length > 0);
  });
});

describe('Pre-flight check runner', () => {
  before(() => setupTestDb());

  it('overall fail when printer offline', () => {
    const r = runPreflight({ printer_id: 'unknown', material: 'PLA', _printerStates: {} });
    assert.equal(r.overall, 'fail');
    assert.ok(r.checks.some(c => c.severity === 'fail' && c.message.match(/offline/)));
  });

  it('temperature check fires when hotend too cold', () => {
    const r = runPreflight({
      printer_id: 'p1', material: 'PETG', hotend_temp: 180,
      _printerStates: { p1: { gcode_state: 'IDLE' } },
    });
    assert.ok(r.checks.some(c => c.message.match(/below PETG minimum/)));
    assert.equal(r.overall, 'fail');
  });

  it('temperature warning when too hot', () => {
    const r = runPreflight({
      printer_id: 'p1', material: 'PLA', hotend_temp: 250,
      _printerStates: { p1: { gcode_state: 'IDLE' } },
    });
    assert.ok(r.checks.some(c => c.severity === 'warn' && c.message.match(/exceeds typical PLA max/)));
  });

  it('passes for sane PLA setup', () => {
    const r = runPreflight({
      printer_id: 'p1', material: 'PLA', hotend_temp: 215, bed_temp: 60,
      _printerStates: { p1: { gcode_state: 'IDLE' } },
    });
    // The "info" check for unknown printer last-result + no spool counts as
    // info, not warn — overall should be pass or warn, never fail.
    assert.notEqual(r.overall, 'fail');
  });

  it('counts severities correctly', () => {
    const r = runPreflight({
      printer_id: 'p1', material: 'PLA', hotend_temp: 215, bed_temp: 60,
      _printerStates: { p1: { gcode_state: 'IDLE' } },
    });
    const sumChecks = r.counts.pass + r.counts.warn + r.counts.fail + (r.counts.info || 0);
    assert.equal(sumChecks, r.checks.length);
  });

  it('exposes NOZZLE_TEMP_LIMITS for known materials', () => {
    assert.ok(pfInt.NOZZLE_TEMP_LIMITS.PLA);
    assert.ok(pfInt.NOZZLE_TEMP_LIMITS.PETG);
    assert.ok(pfInt.NOZZLE_TEMP_LIMITS.TPU);
  });
});

describe('Quality metrics', () => {
  before(() => setupTestDb());

  it('returns empty metrics for fresh DB', () => {
    const r = getDashboardMetrics();
    // Schema may not include cost_per_print table; functions must still
    // return shape-compatible objects without throwing.
    assert.ok(typeof r === 'object');
    assert.ok('success_by_material' in r);
    assert.ok('mtbf' in r);
    assert.ok('cost' in r);
    assert.ok('efficiency' in r);
    assert.ok('weekly_trend' in r);
  });

  it('weekly trend returns an array', () => {
    const r = getDashboardMetrics({ weeks: 4 });
    assert.ok(Array.isArray(r.weekly_trend));
  });
});

describe('Currency module', () => {
  before(() => setupTestDb());

  it('lists supported currencies', () => {
    const list = listCurrencies();
    assert.ok(list.length >= 13);
    assert.ok(list.find(c => c.code === 'NOK'));
    assert.ok(list.find(c => c.code === 'EUR'));
    assert.ok(list.find(c => c.code === 'USD'));
  });

  it('default active currency is USD', () => {
    assert.equal(getActiveCurrency(), 'USD');
  });

  it('setActiveCurrency persists', () => {
    setActiveCurrency('NOK');
    assert.equal(getActiveCurrency(), 'NOK');
  });

  it('rejects unsupported currency', () => {
    assert.throws(() => setActiveCurrency('BTC'));
  });

  it('convert USD→NOK uses fallback rate when offline', () => {
    const out = convert(100, 'USD', 'NOK');
    // Fallback rate is ~10.4 NOK/USD → 1040, but rates may be in cache.
    // Just verify the conversion isn't a no-op.
    assert.notEqual(out, 100);
    assert.ok(out > 100, `NOK should be more than USD numerically; got ${out}`);
  });

  it('convert same → same returns input', () => {
    assert.equal(convert(42, 'EUR', 'EUR'), 42);
  });

  it('format() returns locale-aware string', () => {
    const out = format(123.45, 'NOK');
    assert.ok(/123/.test(out), `expected NOK formatting, got ${out}`);
  });

  it('getRate returns positive number for known currency', () => {
    assert.ok(getRate('USD') > 0);
    assert.ok(getRate('NOK') > 0);
    assert.equal(getRate('USD'), 1);
  });

  it('getCurrencyState exposes active + rates', () => {
    const s = getCurrencyState();
    assert.ok(s.active);
    assert.ok(s.supported.length >= 13);
    assert.ok(s.rates);
  });
});
