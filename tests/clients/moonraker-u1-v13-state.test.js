// moonraker-u1-v13-state.test.js — Snapmaker U1 V1.3.0 state parsing.
//
// Verified against a live V1.3.0 printer's /printer/objects/query output
// (2026-04-24). Covers:
//  - filament_parameters catalog extraction
//  - extruder_offset arrays per tool
//  - park / active / grab pins derived from each extruder object
//    (replaces the obsolete park_detector t0..t3 objects)

import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { MoonrakerClient, extractU1FilamentCatalog } from '../../server/moonraker-client.js';

function makeClient() {
  const hub = { broadcast: () => {} };
  return new MoonrakerClient(
    { printer: { ip: '127.0.0.1', port: 7125, type: 'moonraker' } },
    hub,
  );
}

const LIVE_FILAMENT_PARAMETERS = {
  version: '0.0.10',
  hard_filaments_max_flow_k: 0.4,
  soft_filaments_max_flow_k: 0.5,
  PLA: {
    vendor_Snapmaker: {
      sub_generic: {
        load_temp: 250, unload_temp: 250, clean_nozzle_temp: 170,
        is_soft: false, flow_temp: 220,
        flow_k: { '02': 0.2, '04': 0.02, '06': 0.012, '08': 0.008 },
        flow_k_min: { '02': 0.03, '04': 0.005, '06': 0, '08': 0 },
        flow_k_max: { '02': 0.3, '04': 0.04, '06': 0.03, '08': 0.02 },
      },
      sub_Silk: {
        load_temp: 250, unload_temp: 250, clean_nozzle_temp: 180,
        is_soft: false, flow_temp: 230,
        flow_k: { '02': 0.15, '04': 0.02, '06': 0.012, '08': 0.008 },
      },
    },
  },
  TPU: {
    vendor_Snapmaker: {
      sub_HF: {
        load_temp: 240, unload_temp: 240, clean_nozzle_temp: 180,
        is_soft: true, flow_temp: 225,
        flow_k: { '02': 0.25, '04': 0.03, '06': 0.018, '08': 0.012 },
      },
    },
  },
};

describe('extractU1FilamentCatalog()', () => {
  it('flattens vendor/sub-type tree into entries array', () => {
    const cat = extractU1FilamentCatalog(LIVE_FILAMENT_PARAMETERS);
    assert.equal(cat.version, '0.0.10');
    assert.equal(cat.hardFlowK, 0.4);
    assert.equal(cat.softFlowK, 0.5);
    assert.equal(cat.entries.length, 3);

    const snapGeneric = cat.entries.find(
      e => e.material === 'PLA' && e.vendor === 'Snapmaker' && e.subType === 'generic',
    );
    assert.ok(snapGeneric, 'PLA/Snapmaker/generic entry exists');
    assert.equal(snapGeneric.loadTemp, 250);
    assert.equal(snapGeneric.flowTemp, 220);
    assert.equal(snapGeneric.isSoft, false);
    assert.deepEqual(snapGeneric.flowK, { '02': 0.2, '04': 0.02, '06': 0.012, '08': 0.008 });
  });

  it('flags soft filaments correctly', () => {
    const cat = extractU1FilamentCatalog(LIVE_FILAMENT_PARAMETERS);
    const tpuHf = cat.entries.find(e => e.material === 'TPU' && e.subType === 'HF');
    assert.ok(tpuHf);
    assert.equal(tpuHf.isSoft, true);
  });

  it('returns null for missing or malformed input', () => {
    assert.equal(extractU1FilamentCatalog(null), null);
    assert.equal(extractU1FilamentCatalog('junk'), null);
  });

  it('skips top-level metadata keys as materials', () => {
    const cat = extractU1FilamentCatalog({
      version: '1', hard_filaments_max_flow_k: 0.4, soft_filaments_max_flow_k: 0.5,
      PLA: { vendor_x: { sub_y: { load_temp: 200 } } },
    });
    assert.equal(cat.entries.length, 1);
    assert.equal(cat.entries[0].material, 'PLA');
  });
});

describe('U1 V1.3.0 filament_parameters state', () => {
  it('populates _u1_filament_catalog on state merge', () => {
    const c = makeClient();
    c._mergeKlipperState({ filament_parameters: LIVE_FILAMENT_PARAMETERS });
    assert.ok(c.state._u1_filament_catalog);
    assert.equal(c.state._u1_filament_catalog.entries.length, 3);
  });
});

describe('Tool park / active / grab pins (replaces park_detector)', () => {
  let c;
  beforeEach(() => { c = makeClient(); });

  it('derives parked/active/grabbed from extruder.park_pin and active_pin', () => {
    c._mergeKlipperState({
      extruder:  { temperature: 25, target: 0, state: 'PARKED',   park_pin: true,  active_pin: false, grab_valid_pin: false },
      extruder1: { temperature: 26, target: 0, state: 'ACTIVATE', park_pin: false, active_pin: true,  grab_valid_pin: true  },
      extruder2: { temperature: 25, target: 0, state: 'PARKED',   park_pin: true,  active_pin: false, grab_valid_pin: false },
      extruder3: { temperature: 25, target: 0, state: 'PARKED',   park_pin: true,  active_pin: false, grab_valid_pin: false },
    });
    assert.equal(c.state._sm_park.t0.parked, true);
    assert.equal(c.state._sm_park.t0.active, false);
    assert.equal(c.state._sm_park.t1.parked, false);
    assert.equal(c.state._sm_park.t1.active, true);
    assert.equal(c.state._sm_park.t1.grabbed, true);
  });

  it('tolerates missing extruders (single-tool printers)', () => {
    c._mergeKlipperState({
      extruder: { temperature: 25, target: 0, state: 'PARKED', park_pin: true },
    });
    assert.equal(c.state._sm_park.t0.parked, true);
    assert.equal(c.state._sm_park.t1, undefined);
  });
});

describe('Extruder offset vectors', () => {
  it('reads extruder_offset [x,y,z] from each tool', () => {
    const c = makeClient();
    c._mergeKlipperState({
      extruder:  { temperature: 25, target: 0, extruder_offset: [0.296, -0.004, 0.0] },
      extruder1: { temperature: 25, target: 0, extruder_offset: [-0.118, 0.089, -0.096] },
      extruder2: { temperature: 25, target: 0, extruder_offset: [-0.296, -0.062, -0.025] },
      extruder3: { temperature: 25, target: 0, extruder_offset: [0.0, 0.0, 0.0] },
    });
    assert.deepEqual(c.state._extruder_offsets, [
      [0.296, -0.004, 0.0],
      [-0.118, 0.089, -0.096],
      [-0.296, -0.062, -0.025],
      [0.0, 0.0, 0.0],
    ]);
  });

  it('leaves null for tools without offset data', () => {
    const c = makeClient();
    c._mergeKlipperState({
      extruder: { temperature: 25, target: 0, extruder_offset: [0.1, 0.2, 0.0] },
    });
    assert.deepEqual(c.state._extruder_offsets, [[0.1, 0.2, 0.0], null, null, null]);
  });

  it('does not set _extruder_offsets when no tool has offset data', () => {
    const c = makeClient();
    c._mergeKlipperState({
      extruder: { temperature: 25, target: 0 },
    });
    assert.equal(c.state._extruder_offsets, undefined);
  });
});
