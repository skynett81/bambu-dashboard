// moonraker-power-exclude.test.js — Tests for Moonraker power-device
// notifications, toggle convenience, and Klipper EXCLUDE_OBJECT command surface.

import { describe, it, beforeEach, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { MoonrakerClient } from '../../server/moonraker-client.js';

function makeClient(port = 7125) {
  const events = [];
  const hub = { broadcast: (ch, p) => events.push({ ch, p }) };
  const client = new MoonrakerClient(
    { printer: { ip: '127.0.0.1', port, type: 'voron' } },
    hub,
  );
  return { client, events };
}

describe('MoonrakerClient power notifications', () => {
  it('handles notify_power_changed and broadcasts moonraker_power', () => {
    const { client, events } = makeClient();
    client._handleWsMessage({
      jsonrpc: '2.0',
      method: 'notify_power_changed',
      params: [{ device: 'printer_psu', status: 'on', locked_while_printing: false }],
    });
    const ev = events.find(e => e.ch === 'moonraker_power');
    assert.ok(ev, 'expected moonraker_power broadcast');
    assert.equal(ev.p.device, 'printer_psu');
    assert.equal(ev.p.status, 'on');
  });

  it('ignores notify_power_changed with empty params', () => {
    const { client, events } = makeClient();
    client._handleWsMessage({ jsonrpc: '2.0', method: 'notify_power_changed', params: [] });
    assert.equal(events.filter(e => e.ch === 'moonraker_power').length, 0);
  });
});

describe('MoonrakerClient togglePowerDevice', () => {
  let server, port;
  let lastRequest = null;

  before(async () => {
    server = createServer((req, res) => {
      lastRequest = { method: req.method, url: req.url };
      res.writeHead(200, { 'Content-Type': 'application/json' });
      if (req.url.includes('action=on') || req.url.includes('action=off')) {
        res.end(JSON.stringify({ result: { printer_psu: req.url.includes('on') ? 'on' : 'off' } }));
      } else if (req.url.includes('/machine/device_power/device')) {
        // Query: return current status
        res.end(JSON.stringify({ result: { printer_psu: 'off' } }));
      } else {
        res.end(JSON.stringify({ result: {} }));
      }
    });
    await new Promise((r) => server.listen(0, '127.0.0.1', r));
    port = server.address().port;
  });

  after(async () => {
    await new Promise((r) => server.close(r));
  });

  beforeEach(() => { lastRequest = null; });

  it('toggles off → on when currently off', async () => {
    const { client } = makeClient(port);
    await client.togglePowerDevice('printer_psu');
    assert.match(lastRequest.url, /action=on/);
    assert.equal(lastRequest.method, 'POST');
  });
});

describe('MoonrakerClient getPowerDeviceStatus — stable return shape', () => {
  let server, port;

  before(async () => {
    server = createServer((req, res) => {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ result: { printer_psu: 'on' } }));
    });
    await new Promise((r) => server.listen(0, '127.0.0.1', r));
    port = server.address().port;
  });

  after(async () => {
    await new Promise((r) => server.close(r));
  });

  it('returns just the device status value (not the wrapping object)', async () => {
    const { client } = makeClient(port);
    const status = await client.getPowerDeviceStatus('printer_psu');
    assert.equal(status, 'on', 'should return the device status string, not the full result object');
  });
});

describe('MoonrakerClient EXCLUDE_OBJECT command surface', () => {
  it('excludeObject(name) sends EXCLUDE_OBJECT via gcode helper', () => {
    const { client } = makeClient();
    let sent = null;
    client._apiPost = async (path, body) => { sent = { path, body }; };
    client.excludeObject('cube_a');
    assert.match(sent.path, /printer\/gcode\/script/);
    assert.match(sent.body.script, /EXCLUDE_OBJECT NAME=cube_a/);
  });

  it('excludeObjectById(id) sends EXCLUDE_OBJECT with ID=', () => {
    const { client } = makeClient();
    let sent = null;
    client._apiPost = async (path, body) => { sent = { path, body }; };
    client.excludeObjectById(3);
    assert.match(sent.body.script, /EXCLUDE_OBJECT ID=3/);
  });

  it('resetExcludedObjects sends EXCLUDE_OBJECT RESET=1', () => {
    const { client } = makeClient();
    let sent = null;
    client._apiPost = async (path, body) => { sent = { path, body }; };
    client.resetExcludedObjects();
    assert.match(sent.body.script, /EXCLUDE_OBJECT RESET=1/);
  });
});
