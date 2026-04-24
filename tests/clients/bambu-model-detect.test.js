// bambu-model-detect.test.js — Tests that the Bambu serial-number prefix
// → printer-model mapping covers all 2024–2026 hardware, including the
// new H2-series (H2D, H2S, H2C Vortek 7-nozzle) and P2S.

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { detectBambuModel } from '../../server/mqtt-client.js';

describe('detectBambuModel() — serial-number prefix mapping', () => {
  it('identifies classic X1C / X1E', () => {
    assert.equal(detectBambuModel('00M12345678').id, 'x1c');
    assert.equal(detectBambuModel('03W98765432').id, 'x1e');
  });

  it('identifies P1-series', () => {
    assert.equal(detectBambuModel('01P99887766').id, 'p1p');
    assert.equal(detectBambuModel('01S11223344').id, 'p1s');
  });

  it('identifies A1-series', () => {
    assert.equal(detectBambuModel('03912345678').id, 'a1');
    assert.equal(detectBambuModel('03087654321').id, 'a1_mini');
  });

  it('identifies P2S', () => {
    const m = detectBambuModel('09411112222');
    assert.equal(m.id, 'p2s');
    assert.equal(m.amsDefault, 'ams_lite');
  });

  it('identifies H2D (dual-nozzle, 2025)', () => {
    const m = detectBambuModel('0CM00001111');
    assert.equal(m.id, 'h2d');
    assert.equal(m.dualNozzle, true);
  });

  it('identifies H2S (single-nozzle, 2× X1C volume, 2026)', () => {
    const m = detectBambuModel('0CS00002222');
    assert.equal(m.id, 'h2s');
    assert.equal(m.dualNozzle, false);
  });

  it('identifies H2C (7-nozzle Vortek, FormNext 2025)', () => {
    const m = detectBambuModel('0CC00003333');
    assert.equal(m.id, 'h2c');
    assert.equal(m.nozzleCount, 7);
  });

  it('returns unknown for unrecognized prefix', () => {
    const m = detectBambuModel('ZZZ999999999');
    assert.equal(m.id, 'unknown');
  });

  it('handles empty / invalid input', () => {
    assert.equal(detectBambuModel('').id, 'unknown');
    assert.equal(detectBambuModel(null).id, 'unknown');
    assert.equal(detectBambuModel(undefined).id, 'unknown');
  });
});
