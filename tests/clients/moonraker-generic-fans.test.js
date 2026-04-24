// moonraker-generic-fans.test.js — Tests that fan_generic * and
// temperature_fan * Klipper objects are discovered and surfaced under
// state._generic_fans (Nevermore carbon filter, named cooling fans, etc.).

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { MoonrakerClient } from '../../server/moonraker-client.js';

function makeClient() {
  const hub = { broadcast: () => {} };
  return new MoonrakerClient(
    { printer: { ip: '127.0.0.1', port: 7125, type: 'voron' } },
    hub,
  );
}

describe('MoonrakerClient generic fan discovery', () => {
  it('surfaces fan_generic Nevermore as state._generic_fans', () => {
    const client = makeClient();
    client._mergeKlipperState({
      'fan_generic nevermore_internal': { speed: 0.65, rpm: 3200 },
    });
    const f = client.state._generic_fans?.nevermore_internal;
    assert.ok(f, 'expected nevermore_internal in _generic_fans');
    assert.equal(f.kind, 'fan_generic');
    assert.equal(f.speed, 65);
    assert.equal(f.rpm, 3200);
  });

  it('surfaces temperature_fan chamber_fan with temperature + target', () => {
    const client = makeClient();
    client._mergeKlipperState({
      'temperature_fan chamber_fan': { speed: 0.4, temperature: 42.3, target: 45 },
    });
    const f = client.state._generic_fans?.chamber_fan;
    assert.ok(f);
    assert.equal(f.kind, 'temperature_fan');
    assert.equal(f.temperature, 42.3);
    assert.equal(f.target, 45);
    assert.equal(f.speed, 40);
  });

  it('handles missing optional fields gracefully', () => {
    const client = makeClient();
    client._mergeKlipperState({
      'fan_generic filter_fan': { speed: 1.0 },
    });
    const f = client.state._generic_fans?.filter_fan;
    assert.equal(f.speed, 100);
    assert.equal(f.rpm, null);
    assert.equal(f.temperature, null);
  });
});
