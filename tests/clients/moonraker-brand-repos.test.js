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

  it('keeps stable mappings for Creality, Voron, Anker, RatRig', () => {
    const c = makeClient();
    assert.equal(c._resolveBrandRepo('creality', 'K2 Plus'), 'CrealityOfficial/Creality-Wiki');
    assert.equal(c._resolveBrandRepo('voron', 'V2.4'), 'VoronDesign/Voron-2');
    assert.equal(c._resolveBrandRepo('anker', 'M5'), 'Ankermgmt/ankermake-m5-protocol');
    assert.equal(c._resolveBrandRepo('ankermake', 'M5C'), 'Ankermgmt/ankermake-m5-protocol');
    assert.equal(c._resolveBrandRepo('ratrig', 'V-Core 4'), 'RatOS/RatOS');
  });
});
