// moonraker-canbus.test.js — Tests the CAN-bus peripheral discovery flow.
// Moonraker's /machine/peripherals/canbus returns UUIDs of unassigned Klipper
// or Katapult nodes. The endpoint can also report arbitration errors when
// the bus has a broken termination / missing other node — callers need a
// structured way to see which happened so the setup UI can tell the user
// whether the scan ran but found nothing vs failed to run.

import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { MoonrakerClient } from '../../server/moonraker-client.js';

function makeClient({ port }) {
  const hub = { broadcast: () => {} };
  return new MoonrakerClient(
    { printer: { ip: '127.0.0.1', port, type: 'voron' } },
    hub,
  );
}

describe('MoonrakerClient CAN-bus discovery', () => {
  let server, port;
  let responder = null;

  before(async () => {
    server = createServer((req, res) => responder(req, res));
    await new Promise((r) => server.listen(0, '127.0.0.1', r));
    port = server.address().port;
  });

  after(async () => {
    await new Promise((r) => server.close(r));
  });

  it('returns array of UUIDs on success (back-compat)', async () => {
    responder = (req, res) => {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        result: { can_uuids: [
          { uuid: '11223344aabb', application: 'Klipper' },
          { uuid: 'ccddeeff0011', application: 'Katapult' },
        ] },
      }));
    };
    const c = makeClient({ port });
    const uuids = await c.getCanbusUuids();
    assert.equal(uuids.length, 2);
    assert.equal(uuids[0].uuid, '11223344aabb');
  });

  it('scanCanbus() returns structured { ok, uuids, error } on success', async () => {
    responder = (req, res) => {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        result: { can_uuids: [{ uuid: '11223344aabb', application: 'Klipper' }] },
      }));
    };
    const c = makeClient({ port });
    const result = await c.scanCanbus('can0');
    assert.equal(result.ok, true);
    assert.equal(result.uuids.length, 1);
    assert.equal(result.error, null);
    assert.equal(result.interface, 'can0');
  });

  it('scanCanbus() surfaces arbitration errors as structured error', async () => {
    responder = (req, res) => {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        error: { message: 'CAN arbitration error — bus unreliable or no other nodes online' },
      }));
    };
    const c = makeClient({ port });
    const result = await c.scanCanbus('can0');
    assert.equal(result.ok, false);
    assert.equal(result.uuids.length, 0);
    assert.match(result.error.message, /arbitration/i);
    assert.equal(result.error.code, 'arbitration_error');
  });

  it('scanCanbus() classifies "no such interface" errors', async () => {
    responder = (req, res) => {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        error: { message: 'Interface can9 not found' },
      }));
    };
    const c = makeClient({ port });
    const result = await c.scanCanbus('can9');
    assert.equal(result.ok, false);
    assert.equal(result.error.code, 'interface_not_found');
  });

  it('scanCanbus() classifies generic network failures', async () => {
    const c = makeClient({ port: 1 });  // unreachable
    const result = await c.scanCanbus('can0');
    assert.equal(result.ok, false);
    assert.equal(result.error.code, 'unreachable');
  });

  it('scanCanbus() uses can0 as default interface', async () => {
    let capturedUrl = null;
    responder = (req, res) => {
      capturedUrl = req.url;
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ result: { can_uuids: [] } }));
    };
    const c = makeClient({ port });
    await c.scanCanbus();
    assert.match(capturedUrl, /interface=can0/);
  });
});
