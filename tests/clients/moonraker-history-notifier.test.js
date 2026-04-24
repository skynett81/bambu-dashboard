// moonraker-history-notifier.test.js — Tests for history CRUD, notifier test
// trigger, and service start/stop/restart symmetry.

import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { MoonrakerClient } from '../../server/moonraker-client.js';

function makeClient(port) {
  const hub = { broadcast: () => {} };
  return new MoonrakerClient(
    { printer: { ip: '127.0.0.1', port, type: 'voron' } },
    hub,
  );
}

describe('MoonrakerClient history CRUD', () => {
  let server, port;
  let lastRequest = null;
  let responder = null;

  before(async () => {
    server = createServer((req, res) => {
      lastRequest = { method: req.method, url: req.url };
      responder(req, res);
    });
    await new Promise((r) => server.listen(0, '127.0.0.1', r));
    port = server.address().port;
  });

  after(async () => {
    await new Promise((r) => server.close(r));
  });

  it('getJob(uid) fetches a single history entry', async () => {
    responder = (req, res) => {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ result: { job: { job_id: 'abc', filename: 'test.gcode', status: 'completed' } } }));
    };
    const client = makeClient(port);
    const job = await client.getHistoryJob('abc');
    assert.equal(job.job_id, 'abc');
    assert.match(lastRequest.url, /server\/history\/job/);
    assert.match(lastRequest.url, /uid=abc/);
  });

  it('deleteHistoryJob(uid) issues DELETE /server/history/delete', async () => {
    responder = (req, res) => {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ result: { count: 1 } }));
    };
    const client = makeClient(port);
    const r = await client.deleteHistoryJob('abc');
    assert.equal(lastRequest.method, 'DELETE');
    assert.match(lastRequest.url, /server\/history\/delete/);
    assert.match(lastRequest.url, /uid=abc/);
    assert.equal(r, true);
  });

  it('resetHistoryTotals() POSTs /server/history/reset_totals', async () => {
    responder = (req, res) => {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ result: { last_totals: {}, job_totals: {} } }));
    };
    const client = makeClient(port);
    await client.resetHistoryTotals();
    assert.equal(lastRequest.method, 'POST');
    assert.match(lastRequest.url, /reset_totals/);
  });
});

describe('MoonrakerClient notifier test-trigger', () => {
  let server, port;
  let lastRequest = null;

  before(async () => {
    server = createServer((req, res) => {
      lastRequest = { method: req.method, url: req.url };
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ result: { name: 'discord', ok: true } }));
    });
    await new Promise((r) => server.listen(0, '127.0.0.1', r));
    port = server.address().port;
  });

  after(async () => {
    await new Promise((r) => server.close(r));
  });

  it('testNotifier(name) POSTs to /server/notifiers/test', async () => {
    const client = makeClient(port);
    await client.testNotifier('discord');
    assert.equal(lastRequest.method, 'POST');
    assert.match(lastRequest.url, /server\/notifiers\/test/);
    assert.match(lastRequest.url, /name=discord/);
  });
});
