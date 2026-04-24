// octoprint-plugins.test.js — Tests OctoPrint 1.11+ plugin hooks plus
// new popular-plugin passthroughs (Octolapse, PrintTimeGenius,
// HeaterTimeout, Firmware Updater).

import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { OctoPrintClient } from '../../server/octoprint-client.js';

function makeClient(port) {
  const hub = { broadcast: () => {} };
  return new OctoPrintClient(
    { printer: { ip: '127.0.0.1', port, accessCode: 'api-key-abc' } },
    hub,
  );
}

describe('OctoPrintClient 1.11 plugin hooks', () => {
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

  it('getHealthChecks returns plugin payload on 200', async () => {
    responder = (req, res) => {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ checks: [{ name: 'uptime', status: 'ok', severity: 'info' }] }));
    };
    const c = makeClient(port);
    const r = await c.getHealthChecks();
    assert.ok(r);
    assert.equal(r.checks[0].name, 'uptime');
  });

  it('getHealthChecks returns null on 404 (pre-1.11 OctoPrint)', async () => {
    responder = (req, res) => { res.writeHead(404); res.end(); };
    const c = makeClient(port);
    const r = await c.getHealthChecks();
    assert.equal(r, null);
  });

  it('getMfaStatus normalises available/enrolled booleans', async () => {
    responder = (req, res) => {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ available: true, enrolled: false, methods: ['totp'] }));
    };
    const c = makeClient(port);
    const r = await c.getMfaStatus();
    assert.equal(r.available, true);
    assert.equal(r.enrolled, false);
    assert.deepEqual(r.methods, ['totp']);
  });

  it('getMfaStatus returns null when plugin not installed', async () => {
    responder = (req, res) => { res.writeHead(404); res.end(); };
    const c = makeClient(port);
    assert.equal(await c.getMfaStatus(), null);
  });

  it('getOctolapseStatus returns plugin data', async () => {
    responder = (req, res) => {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ is_capturing: false, current_profile: 'default' }));
    };
    const c = makeClient(port);
    const r = await c.getOctolapseStatus();
    assert.equal(r.is_capturing, false);
  });

  it('getHeaterTimeoutStatus returns null when plugin missing', async () => {
    responder = (req, res) => { res.writeHead(404); res.end(); };
    const c = makeClient(port);
    assert.equal(await c.getHeaterTimeoutStatus(), null);
  });

  it('getFirmwareUpdaterStatus returns latest / current version info', async () => {
    responder = (req, res) => {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ current: '1.0.0', latest: '1.1.0', status: 'update_available' }));
    };
    const c = makeClient(port);
    const r = await c.getFirmwareUpdaterStatus();
    assert.equal(r.latest, '1.1.0');
  });
});
