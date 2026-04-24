// moonraker-u1-nozzle.test.js — Snapmaker U1 V1.3.0+ per-tool nozzle-diameter handling.
//
// V1.3.0 (Apr 2026) made nozzle_diameter editable per toolhead (0.2/0.4/0.6/0.8).
// Klipper exposes it as `status.extruder.nozzle_diameter` and same on extruder1..3.
// The client must fan these out into state.nozzle_diameter (primary) plus a
// state._nozzle_diameters summary array for quick UI access.

import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { MoonrakerClient } from '../../server/moonraker-client.js';

function makeClient() {
  const hub = { broadcast: () => {} };
  return new MoonrakerClient(
    { printer: { ip: '127.0.0.1', port: 7125, type: 'moonraker' } },
    hub,
  );
}

describe('Per-tool nozzle_diameter (U1 V1.3.0)', () => {
  let c;
  beforeEach(() => { c = makeClient(); });

  it('reads nozzle_diameter from primary extruder', () => {
    c._mergeKlipperState({
      extruder: { temperature: 25, target: 0, nozzle_diameter: 0.6 },
    });
    assert.equal(c.state.nozzle_diameter, 0.6);
  });

  it('reads nozzle_diameter from extruder1/2/3', () => {
    c._mergeKlipperState({
      extruder:  { temperature: 25, target: 0, nozzle_diameter: 0.4 },
      extruder1: { temperature: 25, target: 0, nozzle_diameter: 0.2 },
      extruder2: { temperature: 25, target: 0, nozzle_diameter: 0.6 },
      extruder3: { temperature: 25, target: 0, nozzle_diameter: 0.8 },
    });
    assert.equal(c.state._extra_extruders[0].nozzle_diameter, 0.2);
    assert.equal(c.state._extra_extruders[1].nozzle_diameter, 0.6);
    assert.equal(c.state._extra_extruders[2].nozzle_diameter, 0.8);
  });

  it('populates _nozzle_diameters summary array in tool order T0..T3', () => {
    c._mergeKlipperState({
      extruder:  { temperature: 25, target: 0, nozzle_diameter: 0.4 },
      extruder1: { temperature: 25, target: 0, nozzle_diameter: 0.2 },
      extruder2: { temperature: 25, target: 0, nozzle_diameter: 0.6 },
      extruder3: { temperature: 25, target: 0, nozzle_diameter: 0.8 },
    });
    assert.deepEqual(c.state._nozzle_diameters, [0.4, 0.2, 0.6, 0.8]);
  });

  it('does not set _nozzle_diameters when no diameter info available', () => {
    c._mergeKlipperState({
      extruder: { temperature: 25, target: 0 },
    });
    assert.equal(c.state._nozzle_diameters, undefined);
  });

  it('coerces string diameter values to Number', () => {
    c._mergeKlipperState({
      extruder: { temperature: 25, target: 0, nozzle_diameter: '0.4' },
    });
    assert.equal(c.state.nozzle_diameter, 0.4);
    assert.equal(typeof c.state.nozzle_diameter, 'number');
  });

  it('preserves other extra-extruder fields when diameter updates arrive alone', () => {
    // Initial temperature update
    c._mergeKlipperState({
      extruder1: { temperature: 210, target: 220, state: 'ready', switch_count: 5 },
    });
    assert.equal(c.state._extra_extruders[0].temperature, 210);
    assert.equal(c.state._extra_extruders[0].state, 'ready');

    // Subsequent diameter-only update from V1.3.0 touchscreen edit
    c._mergeKlipperState({
      extruder1: { nozzle_diameter: 0.6 },
    });
    assert.equal(c.state._extra_extruders[0].nozzle_diameter, 0.6);
    assert.equal(c.state._extra_extruders[0].state, 'ready', 'state preserved');
    assert.equal(c.state._extra_extruders[0].switch_count, 5, 'switch_count preserved');
  });
});
