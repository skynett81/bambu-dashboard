// moonraker-brand-repos.test.js — Verifies that _resolveBrandRepo() routes
// firmware checks to the correct per-model GitHub repository.
//
// Background: QIDI and Elegoo publish firmware per-model rather than under one
// brand-wide repo, so the checker has to pick the right repo based on the
// printer model string we learn from config/Klipper.

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { MoonrakerClient } from '../../server/moonraker-client.js';

function makeClient(model = '') {
  const hub = { broadcast: () => {} };
  const client = new MoonrakerClient(
    { printer: { ip: '127.0.0.1', port: 7125, type: 'qidi', model } },
    hub,
  );
  return client;
}

describe('MoonrakerClient _resolveBrandRepo()', () => {
  it('routes QIDI Plus4 to QIDITECH/QIDI_PLUS4', () => {
    const c = makeClient('X-Plus 4');
    assert.equal(c._resolveBrandRepo('qidi', 'X-Plus 4'), 'QIDITECH/QIDI_PLUS4');
    assert.equal(c._resolveBrandRepo('qidi', 'Plus4'), 'QIDITECH/QIDI_PLUS4');
  });

  it('routes QIDI Max3 to QIDITECH/QIDI_MAX3', () => {
    const c = makeClient();
    assert.equal(c._resolveBrandRepo('qidi', 'X-Max 3'), 'QIDITECH/QIDI_MAX3');
  });

  it('routes QIDI Plus3 to QIDITECH/QIDI_PLUS3', () => {
    const c = makeClient();
    assert.equal(c._resolveBrandRepo('qidi', 'X-Plus 3'), 'QIDITECH/QIDI_PLUS3');
  });

  it('routes QIDI Max4 to QIDITECH/QIDI_MAX4', () => {
    const c = makeClient();
    assert.equal(c._resolveBrandRepo('qidi', 'X-Max 4'), 'QIDITECH/QIDI_MAX4');
  });

  it('routes QIDI Q1 Pro to QIDITECH/Q1_PRO', () => {
    const c = makeClient();
    assert.equal(c._resolveBrandRepo('qidi', 'Q1 Pro'), 'QIDITECH/Q1_PRO');
    assert.equal(c._resolveBrandRepo('qidi', 'Q1Pro'), 'QIDITECH/Q1_PRO');
  });

  it('defaults unknown QIDI models to Plus4 (current flagship)', () => {
    const c = makeClient();
    assert.equal(c._resolveBrandRepo('qidi', 'i-Mate'), 'QIDITECH/QIDI_PLUS4');
    assert.equal(c._resolveBrandRepo('qidi', ''), 'QIDITECH/QIDI_PLUS4');
  });

  it('routes Elegoo Centauri Carbon to elegooofficial/CentauriCarbon', () => {
    const c = makeClient();
    assert.equal(c._resolveBrandRepo('elegoo', 'Centauri Carbon'), 'elegooofficial/CentauriCarbon');
  });

  it('routes other Elegoo models to Neptune-4 repo', () => {
    const c = makeClient();
    assert.equal(c._resolveBrandRepo('elegoo', 'Neptune 4 Pro'), 'Elegoo3DPrinters/Neptune-4');
    assert.equal(c._resolveBrandRepo('elegoo', ''), 'Elegoo3DPrinters/Neptune-4');
  });

  it('returns null for unknown brands', () => {
    const c = makeClient();
    assert.equal(c._resolveBrandRepo('unknown-brand', 'model'), null);
  });

  it('routes Creality K-series to dedicated source-code repos', () => {
    const c = makeClient();
    assert.equal(c._resolveBrandRepo('creality', 'K2 Plus'),     'CrealityOfficial/K2_Plus_Source_Code');
    assert.equal(c._resolveBrandRepo('creality', 'K2 Plus Combo'), 'CrealityOfficial/K2_Plus_Source_Code');
    assert.equal(c._resolveBrandRepo('creality', 'K1 Max'),      'CrealityOfficial/K1_Max_Source_Code');
    assert.equal(c._resolveBrandRepo('creality', 'K1'),          'CrealityOfficial/K1_Source_Code');
  });

  it('falls back to Creality-Wiki for non-Klipper Creality models', () => {
    const c = makeClient();
    assert.equal(c._resolveBrandRepo('creality', 'Ender-3 V3 SE'), 'CrealityOfficial/Creality-Wiki');
    assert.equal(c._resolveBrandRepo('creality', 'CR-10 SE'),      'CrealityOfficial/Creality-Wiki');
    assert.equal(c._resolveBrandRepo('creality', 'Hi'),            'CrealityOfficial/Creality-Wiki');
  });

  it('routes Anycubic Kobra series to its source repo', () => {
    const c = makeClient();
    assert.equal(c._resolveBrandRepo('anycubic', 'Kobra 3'),     'ANYCUBIC-3D/anycubic-kobra-3-source');
    assert.equal(c._resolveBrandRepo('anycubic', 'Kobra S1'),    'ANYCUBIC-3D/anycubic-kobra-3-source');
  });

  it('routes all Prusa models to the Buddy firmware repo', () => {
    const c = makeClient();
    assert.equal(c._resolveBrandRepo('prusa', 'MK4'),       'prusa3d/Prusa-Firmware-Buddy');
    assert.equal(c._resolveBrandRepo('prusa', 'MK4S'),      'prusa3d/Prusa-Firmware-Buddy');
    assert.equal(c._resolveBrandRepo('prusa', 'CORE One'),  'prusa3d/Prusa-Firmware-Buddy');
    assert.equal(c._resolveBrandRepo('prusa', 'HT90'),      'prusa3d/Prusa-Firmware-Buddy');
    assert.equal(c._resolveBrandRepo('prusa', 'XL'),        'prusa3d/Prusa-Firmware-Buddy');
  });

  it('keeps stable mappings for Voron, Anker, RatRig, AnkerMake', () => {
    const c = makeClient();
    assert.equal(c._resolveBrandRepo('voron', 'V2.4'),    'VoronDesign/Voron-2');
    assert.equal(c._resolveBrandRepo('anker', 'M5'),      'Ankermgmt/ankermake-m5-protocol');
    assert.equal(c._resolveBrandRepo('ankermake', 'M5C'), 'Ankermgmt/ankermake-m5-protocol');
    assert.equal(c._resolveBrandRepo('ratrig', 'V-Core 4'), 'RatOS/RatOS');
  });
});

describe('MoonrakerClient _guessBrand() — new model patterns', () => {
  it('detects Creality from K2 Plus and Hi keywords', () => {
    const c = makeClient('K2 Plus');
    c._printerModel = 'K2 Plus';
    assert.equal(c._guessBrand(), 'creality');
    c._printerModel = 'Hi Combo';
    assert.equal(c._guessBrand(), 'creality');
  });

  it('detects Elegoo from Centauri keyword', () => {
    const c = makeClient('Centauri Carbon');
    c._printerModel = 'Centauri Carbon';
    assert.equal(c._guessBrand(), 'elegoo');
  });

  it('detects Anycubic from Kobra keyword', () => {
    const c = makeClient('Kobra 3 Combo');
    c._printerModel = 'Kobra 3 Combo';
    assert.equal(c._guessBrand(), 'anycubic');
  });

  it('detects Prusa from CORE One / MK4 / HT90 keywords', () => {
    const c = makeClient('CORE One');
    c._printerModel = 'CORE One';
    assert.equal(c._guessBrand(), 'prusa');
    c._printerModel = 'HT90';
    assert.equal(c._guessBrand(), 'prusa');
    c._printerModel = 'MK4S';
    assert.equal(c._guessBrand(), 'prusa');
  });

  it('detects AnkerMake M5C as anker', () => {
    const c = makeClient('M5C');
    c._printerModel = 'M5C';
    assert.equal(c._guessBrand(), 'anker');
  });

  it('detects RatRig V-Minion variant', () => {
    const c = makeClient('V-Minion');
    c._printerModel = 'V-Minion';
    assert.equal(c._guessBrand(), 'ratrig');
  });
});
