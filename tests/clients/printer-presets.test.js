// printer-presets.test.js — Tests that the 2026 printer-model preset seeds
// cover the vendor line-up and resolve correctly.

import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';
import {
  findPrinterPreset,
  listPrinterPresetsForVendor,
  listAllCapabilities,
  clearPresetCache,
} from '../../server/printer-presets.js';
import {
  getMultiMaterialSystem,
  listMultiMaterialSystems,
  isPlaceholderSystem,
} from '../../server/multi-material-capabilities.js';

describe('findPrinterPreset()', () => {
  before(() => clearPresetCache());

  it('resolves Bambu H2D with dual-nozzle flag', () => {
    const p = findPrinterPreset('bambu', 'H2D');
    assert.ok(p);
    assert.equal(p.dual_nozzle, true);
    assert.equal(p.ams_default, 'ams_2_pro');
  });

  it('resolves Bambu H2C with 7 nozzles and vortek', () => {
    const p = findPrinterPreset('bambu', 'H2C');
    assert.equal(p.nozzle_count, 7);
    assert.equal(p.ams_default, 'vortek');
  });

  it('resolves Prusa CORE One L with bed_led_progress capability', () => {
    const p = findPrinterPreset('prusa', 'CORE One L');
    assert.ok(p.capabilities.includes('bed_led_progress'));
    assert.equal(p.chamber_heated, true);
  });

  it('resolves Creality K2 Plus', () => {
    const p = findPrinterPreset('creality', 'K2 Plus');
    assert.ok(p);
    assert.ok(p.capabilities.includes('nebula_camera'));
  });

  it('resolves Elegoo Centauri Carbon 2 with CANVAS capability', () => {
    const p = findPrinterPreset('elegoo', 'Centauri Carbon 2');
    assert.ok(p.capabilities.includes('canvas_multi_material'));
  });

  it('resolves QIDI Plus4 with chamber heating', () => {
    const p = findPrinterPreset('qidi', 'Plus4');
    assert.equal(p.chamber_heated, true);
    assert.equal(p.active_chamber_temp_c, 65);
  });

  it('case- and whitespace-insensitive lookup', () => {
    assert.ok(findPrinterPreset('BAMBU', 'h2d'));
    assert.ok(findPrinterPreset('  qidi  ', 'q1 pro'));
  });

  it('returns placeholder for announced INDX hardware', () => {
    const p = findPrinterPreset('prusa', 'INDX');
    assert.ok(p);
    assert.equal(p._placeholder, true);
    assert.equal(p.status, 'pre_release');
  });

  it('returns null for unknown combination', () => {
    assert.equal(findPrinterPreset('bambu', 'Z99'), null);
    assert.equal(findPrinterPreset('', ''), null);
  });
});

describe('listPrinterPresetsForVendor()', () => {
  it('returns all bambu presets (at least H2D/H2D Pro/H2S/H2C/P2S)', () => {
    const list = listPrinterPresetsForVendor('bambu');
    const models = list.map(p => p.model);
    assert.ok(models.includes('H2D'));
    assert.ok(models.includes('H2C'));
    assert.ok(models.includes('P2S'));
  });

  it('empty array for unknown vendor', () => {
    assert.deepEqual(listPrinterPresetsForVendor('unknown'), []);
  });
});

describe('listAllCapabilities()', () => {
  it('includes 2026 capability flags', () => {
    const caps = listAllCapabilities();
    for (const c of ['dual_extruder', 'ams_2_pro', 'vortek_7_nozzle', 'chamber_heating', 'canvas_multi_material', 'bed_led_progress']) {
      assert.ok(caps.includes(c), `missing capability: ${c}`);
    }
  });
});

describe('Multi-material system catalogue', () => {
  it('resolves ams_2_pro with autoDrying=true', () => {
    const sys = getMultiMaterialSystem('ams_2_pro');
    assert.equal(sys.autoDrying, true);
    assert.equal(sys.rfid, true);
  });

  it('marks INDX + CANVAS as placeholders', () => {
    assert.equal(isPlaceholderSystem('indx_4'), true);
    assert.equal(isPlaceholderSystem('indx_8'), true);
    assert.equal(isPlaceholderSystem('canvas'), true);
  });

  it('marks shipped systems as non-placeholders', () => {
    assert.equal(isPlaceholderSystem('ams'), false);
    assert.equal(isPlaceholderSystem('mmu3'), false);
    assert.equal(isPlaceholderSystem('ercf'), false);
  });

  it('lists all known MM systems', () => {
    const list = listMultiMaterialSystems();
    assert.ok(list.length >= 10);
    assert.ok(list.some(s => s.id === 'snapmaker_u1'));
  });
});
