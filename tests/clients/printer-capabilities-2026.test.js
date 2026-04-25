// printer-capabilities-2026.test.js — Coverage for the 2024–2026 printer
// model overrides added to MODEL_OVERRIDES (build volumes, feature flags,
// chamber/AI capability detection).

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { getCapabilities, hasFeature } from '../../server/printer-capabilities.js';

function caps(model, type = 'moonraker') {
  return getCapabilities({ model, type });
}

describe('Bambu Lab H-series capabilities', () => {
  it('H2D Pro reports laser, refreshable nozzle, high-temp bed', () => {
    const c = caps('H2D Pro', 'bambu');
    assert.deepEqual(c.buildVolume, [325, 320, 325]);
    assert.equal(c.features?.hasLaser, true);
    assert.equal(c.features?.refreshableNozzle, true);
    assert.equal(c.features?.highTempBed, true);
    assert.equal(c.features?.idex, true);
  });

  it('H2C reports vortek 7-color and heated chamber', () => {
    const c = caps('H2C', 'bambu');
    assert.deepEqual(c.buildVolume, [325, 320, 325]);
    assert.equal(c.features?.vortek, true);
    assert.equal(c.features?.multiColor, true);
    assert.equal(c.features?.chamberHeated, true);
  });

  it('H2S smaller chassis, no IDEX', () => {
    const c = caps('H2S', 'bambu');
    assert.deepEqual(c.buildVolume, [256, 256, 256]);
    assert.notEqual(c.features?.idex, true);
    assert.equal(c.features?.chamber, true);
  });
});

describe('Prusa 2024–2025 line-up', () => {
  it('CORE One has CoreXY enclosure', () => {
    const c = caps('Prusa CORE One', 'prusalink');
    assert.deepEqual(c.buildVolume, [250, 220, 270]);
    assert.equal(c.features?.coreXY, true);
    assert.equal(c.features?.enclosure, true);
  });

  it('MK4S inherits MK4 build volume + Buddy firmware tag', () => {
    const c = caps('Prusa MK4S', 'prusalink');
    assert.deepEqual(c.buildVolume, [250, 210, 220]);
    assert.equal(c.features?.firmware, 'Buddy');
  });

  it('HT90 industrial high-temp + heated chamber', () => {
    const c = caps('Prusa HT90', 'prusalink');
    assert.deepEqual(c.buildVolume, [400, 400, 420]);
    assert.equal(c.features?.highTempBed, true);
    assert.equal(c.features?.chamberHeated, true);
    assert.equal(c.features?.ai, true);
  });

  it('XL exposes 5-toolhead support', () => {
    const c = caps('Prusa XL', 'prusalink');
    assert.equal(c.features?.multiExtruder, true);
    assert.equal(c.features?.toolheads, 5);
  });
});

describe('Creality K-series 2024+', () => {
  it('K2 Plus has CFS multi-color + heated chamber', () => {
    const c = caps('Creality K2 Plus', 'moonraker');
    assert.deepEqual(c.buildVolume, [350, 350, 350]);
    assert.equal(c.features?.cfs, true);
    assert.equal(c.features?.multiColor, true);
    assert.equal(c.features?.chamberHeated, true);
  });

  it('K1C has hardened hotend for carbon-fiber filaments', () => {
    const c = caps('Creality K1C', 'moonraker');
    assert.equal(c.features?.hardenedHotend, true);
    assert.equal(c.features?.enclosure, true);
  });

  it('Hi Combo gets multi-color flag (CFS)', () => {
    const c = caps('Creality Hi Combo', 'moonraker');
    assert.equal(c.features?.multiColor, true);
    assert.equal(c.features?.cfs, true);
  });
});

describe('Elegoo Centauri series', () => {
  it('Centauri Carbon enables AI + hardened hotend', () => {
    const c = caps('Elegoo Centauri Carbon', 'moonraker');
    assert.deepEqual(c.buildVolume, [256, 256, 256]);
    assert.equal(c.features?.hardenedHotend, true);
    assert.equal(c.features?.ai, true);
    assert.equal(c.features?.enclosure, true);
  });

  it('Neptune 4 Plus has 320×320×385 build volume', () => {
    const c = caps('Elegoo Neptune 4 Plus', 'moonraker');
    assert.deepEqual(c.buildVolume, [320, 320, 385]);
  });
});

describe('AnkerMake M5C', () => {
  it('M5C has AI but no enclosure', () => {
    const c = caps('AnkerMake M5C', 'moonraker');
    assert.deepEqual(c.buildVolume, [220, 220, 250]);
    assert.equal(c.features?.ai, true);
    assert.notEqual(c.features?.enclosure, true);
  });
});

describe('QIDI 2024 line-up', () => {
  it('X-Plus 4 has heated chamber + AI', () => {
    const c = caps('QIDI X-Plus 4', 'moonraker');
    assert.deepEqual(c.buildVolume, [305, 305, 305]);
    assert.equal(c.features?.chamberHeated, true);
    assert.equal(c.features?.ai, true);
  });

  it('Q1 Pro is enclosed with heated chamber', () => {
    const c = caps('QIDI Q1 Pro', 'moonraker');
    assert.deepEqual(c.buildVolume, [245, 245, 240]);
    assert.equal(c.features?.chamberHeated, true);
    assert.equal(c.features?.enclosure, true);
  });
});

describe('RatRig & Voron community variants', () => {
  it('V-Core 4 has CoreXY + enclosure', () => {
    const c = caps('RatRig V-Core 4', 'moonraker');
    assert.deepEqual(c.buildVolume, [400, 400, 400]);
    assert.equal(c.features?.coreXY, true);
    assert.equal(c.features?.enclosure, true);
  });

  it('Voron Switchwire has CoreXZ kinematics', () => {
    const c = caps('Voron Switchwire', 'moonraker');
    assert.equal(c.features?.coreXZ, true);
  });
});

describe('Anycubic Kobra series', () => {
  it('Kobra S1 Combo has multi-color + AI + enclosure', () => {
    const c = caps('Anycubic Kobra S1 Combo', 'moonraker');
    assert.deepEqual(c.buildVolume, [250, 250, 250]);
    assert.equal(c.features?.multiColor, true);
    assert.equal(c.features?.ai, true);
    assert.equal(c.features?.enclosure, true);
  });

  it('Kobra 3 base model has AI but no enclosure', () => {
    const c = caps('Anycubic Kobra 3', 'moonraker');
    assert.equal(c.features?.ai, true);
    assert.notEqual(c.features?.enclosure, true);
  });
});

describe('hasFeature helper integration', () => {
  it('hasFeature returns true for printers that opt into chamber feature', () => {
    assert.equal(hasFeature({ model: 'H2D', type: 'bambu' }, 'chamber'), true);
    assert.equal(hasFeature({ model: 'Creality K2 Plus', type: 'moonraker' }, 'chamberHeated'), true);
  });

  it('hasFeature returns false for printers that lack the feature', () => {
    assert.equal(hasFeature({ model: 'A1 mini', type: 'bambu' }, 'chamber'), false);
    assert.equal(hasFeature({ model: 'Creality Hi', type: 'moonraker' }, 'multiColor'), false);
  });
});
