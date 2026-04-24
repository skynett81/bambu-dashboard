// moonraker-update-shaper.test.js — Tests update_manager refresh/full, a
// new service_start command, and Klipper input-shaper command surface.

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { MoonrakerClient } from '../../server/moonraker-client.js';

function makeClient() {
  const hub = { broadcast: () => {} };
  const client = new MoonrakerClient(
    { printer: { ip: '127.0.0.1', port: 7125, type: 'voron' } },
    hub,
  );
  return client;
}

describe('MoonrakerClient update_manager extensions', () => {
  it('refreshUpdateStatus() POSTs /machine/update/refresh', async () => {
    const c = makeClient();
    let sent = null;
    c._apiPost = async (path) => { sent = path; };
    await c.refreshUpdateStatus();
    assert.match(sent, /machine\/update\/refresh/);
  });

  it('refreshUpdateStatus(name) passes ?name= query', async () => {
    const c = makeClient();
    let sent = null;
    c._apiPost = async (path) => { sent = path; };
    await c.refreshUpdateStatus('klipper');
    assert.match(sent, /name=klipper/);
  });

  it('triggerFullUpdate() POSTs /machine/update/full when /upgrade is unavailable', async () => {
    const c = makeClient();
    let sent = null;
    c._apiPostStatus = async () => false;  // simulate pre-0.10.0 server (no /upgrade)
    c._apiPost = async (path) => { sent = path; };
    await c.triggerFullUpdate();
    assert.match(sent, /machine\/update\/full/);
  });

  it('triggerFullUpdate() prefers /machine/update/upgrade on Moonraker 0.10.0+', async () => {
    const c = makeClient();
    let upgradePath = null;
    let fallbackCalled = false;
    c._apiPostStatus = async (path) => { upgradePath = path; return true; };
    c._apiPost = async () => { fallbackCalled = true; };
    await c.triggerFullUpdate();
    assert.match(upgradePath, /machine\/update\/upgrade/);
    assert.equal(fallbackCalled, false, 'fallback should not run when /upgrade succeeds');
  });

  it('triggerUpdate(name) prefers /machine/update/upgrade?name=<pkg> on 0.10.0+', async () => {
    const c = makeClient();
    let upgradePath = null;
    c._apiPostStatus = async (path) => { upgradePath = path; return true; };
    c._apiPost = async () => { throw new Error('should not fall back'); };
    await c.triggerUpdate('klipper');
    assert.match(upgradePath, /machine\/update\/upgrade\?name=klipper/);
  });
});

describe('MoonrakerClient service_start command', () => {
  it('service_start case POSTs to /machine/services/start', async () => {
    const c = makeClient();
    c.connected = true;  // sendCommand no-ops when disconnected
    let sent = null;
    c._apiPost = async (path) => { sent = path; };
    c.sendCommand({ action: 'service_start', service: 'klipper' });
    assert.match(sent, /machine\/services\/start/);
    assert.match(sent, /service=klipper/);
  });

  it('service_start defaults to klipper when no service given', async () => {
    const c = makeClient();
    c.connected = true;
    let sent = null;
    c._apiPost = async (path) => { sent = path; };
    c.sendCommand({ action: 'service_start' });
    assert.match(sent, /service=klipper/);
  });
});

describe('MoonrakerClient Klipper input-shaper commands', () => {
  it('measureAxesNoise() sends MEASURE_AXES_NOISE gcode', () => {
    const c = makeClient();
    let sent = null;
    c._apiPost = async (path, body) => { sent = body; };
    c.measureAxesNoise();
    assert.match(sent.script, /^MEASURE_AXES_NOISE/);
  });

  it('shaperCalibrate() sends SHAPER_CALIBRATE with optional AXIS', () => {
    const c = makeClient();
    let sent = null;
    c._apiPost = async (path, body) => { sent = body; };
    c.shaperCalibrate();
    assert.match(sent.script, /^SHAPER_CALIBRATE$/);
    c.shaperCalibrate('X');
    assert.match(sent.script, /SHAPER_CALIBRATE AXIS=X/);
  });

  it('testResonances() sends TEST_RESONANCES with axis + output', () => {
    const c = makeClient();
    let sent = null;
    c._apiPost = async (path, body) => { sent = body; };
    c.testResonances('Y', 'resonances');
    assert.match(sent.script, /TEST_RESONANCES AXIS=Y OUTPUT=resonances/);
  });

  it('testResonances() defaults output to "resonances"', () => {
    const c = makeClient();
    let sent = null;
    c._apiPost = async (path, body) => { sent = body; };
    c.testResonances('X');
    assert.match(sent.script, /OUTPUT=resonances/);
  });

  it('rejects invalid axis to avoid arbitrary gcode injection', () => {
    const c = makeClient();
    assert.throws(() => c.shaperCalibrate('X; M112'), /axis/i);
    assert.throws(() => c.testResonances('Z!'), /axis/i);
  });
});
