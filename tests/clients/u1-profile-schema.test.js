// u1-profile-schema.test.js — Snapmaker U1 V1.1.1+ filament catalog and
// V1.3.0+ nozzle-diameter profile schema validation.

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const profile = JSON.parse(
  readFileSync(new URL('../../server/data/sm-u1-profiles.json', import.meta.url), 'utf8'),
);

describe('Snapmaker U1 profile schema', () => {
  it('declares V1.3.0+ nozzle diameters as a selectable set', () => {
    assert.ok(Array.isArray(profile.machine.nozzle_diameters_available));
    assert.deepEqual(profile.machine.nozzle_diameters_available, [0.2, 0.4, 0.6, 0.8]);
    assert.equal(profile.machine.nozzle_diameter_min_firmware, '1.3.0');
  });

  it('keeps the default nozzle diameter at 0.4 for backwards compatibility', () => {
    assert.equal(profile.machine.nozzle_diameter, 0.4);
  });

  it('ships V1.1.1 Snapmaker PETG HF filament profile', () => {
    const petgHf = profile.filaments.find(f => f.name === 'Snapmaker PETG HF');
    assert.ok(petgHf, 'PETG HF profile is present');
    assert.equal(petgHf.type, 'PETG');
    assert.equal(petgHf.subType, 'High-Flow');
    assert.equal(petgHf.min_firmware, '1.1.1');
    assert.ok(
      petgHf.max_volumetric_speed > 10,
      'HF profile should exceed standard PETG volumetric speed',
    );
  });

  it('ships V1.1.1 Snapmaker TPU 95A HF filament profile', () => {
    const tpuHf = profile.filaments.find(f => f.name === 'Snapmaker TPU 95A HF');
    assert.ok(tpuHf, 'TPU 95A HF profile is present');
    assert.equal(tpuHf.type, 'TPU');
    assert.equal(tpuHf.subType, '95A High-Flow');
    assert.equal(tpuHf.min_firmware, '1.1.1');
    assert.ok(
      tpuHf.max_volumetric_speed > 5,
      'HF profile should exceed standard TPU 95A volumetric speed',
    );
  });

  it('does not duplicate existing TPU High-Flow profile', () => {
    const tpuNames = profile.filaments
      .filter(f => f.type === 'TPU')
      .map(f => f.name);
    const uniqueCount = new Set(tpuNames).size;
    assert.equal(uniqueCount, tpuNames.length, 'TPU profile names must be unique');
  });

  it('all filaments carry the required fields', () => {
    for (const f of profile.filaments) {
      assert.ok(f.name, `name required: ${JSON.stringify(f)}`);
      assert.ok(f.type, `type required: ${f.name}`);
      assert.ok(f.nozzle_min > 0, `nozzle_min > 0: ${f.name}`);
      assert.ok(f.nozzle_max >= f.nozzle_min, `nozzle_max >= nozzle_min: ${f.name}`);
      assert.ok(f.bed >= 0, `bed >= 0: ${f.name}`);
      assert.ok(f.density > 0, `density > 0: ${f.name}`);
      assert.ok(f.max_volumetric_speed > 0, `volumetric_speed > 0: ${f.name}`);
    }
  });
});
