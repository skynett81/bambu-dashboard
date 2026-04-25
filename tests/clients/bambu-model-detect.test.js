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

  it('identifies H2D Pro by serial prefix 0CE (high-temp variant)', () => {
    const m = detectBambuModel('0CE00004444');
    assert.equal(m.id, 'h2d_pro');
    assert.equal(m.label, 'H2D Pro');
    assert.equal(m.dualNozzle, true);
    assert.equal(m.amsDefault, 'ams_2_pro');
  });

  it('refines H2D Pro detection from info.module product_name', () => {
    // Even with a generic/unknown serial, the firmware-reported product_name
    // should upgrade the detection to H2D Pro.
    const m = detectBambuModel('ZZZ99999999', [
      { name: 'mc', product_name: 'Bambu Lab H2D Pro', hw_ver: '...', sw_ver: '01.05.00' },
    ]);
    assert.equal(m.id, 'h2d_pro');
    assert.equal(m.label, 'H2D Pro');
  });

  it('keeps H2D distinct from H2D Pro via product_name', () => {
    // A generic H2D should NOT be promoted to H2D Pro.
    const h2d = detectBambuModel('0CM12345678', [
      { name: 'mc', product_name: 'Bambu Lab H2D' },
    ]);
    assert.equal(h2d.id, 'h2d');
    assert.notEqual(h2d.id, 'h2d_pro');
  });

  it('refines H2S / H2C from product_name when prefix is new', () => {
    const h2s = detectBambuModel('XXX1111', [{ product_name: 'Bambu Lab H2S' }]);
    assert.equal(h2s.id, 'h2s');
    const h2c = detectBambuModel('XXX2222', [{ product_name: 'Bambu Lab H2C' }]);
    assert.equal(h2c.id, 'h2c');
    assert.equal(h2c.nozzleCount, 7);
  });

  it('ignores unknown product_name and falls back to serial-prefix guess', () => {
    const m = detectBambuModel('00M12345678', [
      { product_name: 'Some Other Product' },
    ]);
    assert.equal(m.id, 'x1c'); // serial wins
  });

  it('handles infoModule = null / non-array gracefully', () => {
    assert.equal(detectBambuModel('00M12345678', null).id, 'x1c');
    assert.equal(detectBambuModel('00M12345678', undefined).id, 'x1c');
    assert.equal(detectBambuModel('00M12345678', 'not-an-array').id, 'x1c');
  });
});
