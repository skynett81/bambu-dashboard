// moonraker-spoolman.test.js — Tests for Spoolman v2 proxy integration.
// Verifies:
//  - path uses /v1/spool (not /api/v1/spool — Moonraker proxy rejects anything not starting with /v1/)
//  - use_v2_response=true query param is sent
//  - v2 response { response, error } envelope is unwrapped correctly
//  - errors from Spoolman side are distinguished from Moonraker connectivity errors

import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { MoonrakerClient } from '../../server/moonraker-client.js';

function makeClient({ port }) {
  const hub = { broadcast: () => {} };
  const config = {
    printer: {
      ip: '127.0.0.1',
      port,
      type: 'voron',
    },
  };
  return new MoonrakerClient(config, hub);
}

function urlParams(url) {
  const q = url.split('?')[1] || '';
  return Object.fromEntries(new URLSearchParams(q).entries());
}

describe('MoonrakerClient Spoolman v2 proxy', () => {
  let server, port;
  let lastRequest = null;
  let responseFactory = null;

  before(async () => {
    server = createServer((req, res) => {
      lastRequest = { method: req.method, url: req.url, headers: { ...req.headers } };
      const payload = responseFactory ? responseFactory(req) : { result: {} };
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(payload));
    });
    await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
    port = server.address().port;
  });

  after(async () => {
    await new Promise((resolve) => server.close(resolve));
  });

  it('uses path=/v1/spool (not /api/v1/spool)', async () => {
    responseFactory = () => ({
      result: {
        response: [{ id: 1, filament_used: 100 }],
        response_headers: {},
        error: null,
      },
    });

    const client = makeClient({ port });
    await client.getSpoolmanSpools();

    const qp = urlParams(lastRequest.url);
    assert.equal(qp.path, '/v1/spool', `path must be /v1/spool, got: ${qp.path}`);
  });

  it('sends use_v2_response=true', async () => {
    responseFactory = () => ({
      result: { response: [], response_headers: {}, error: null },
    });

    const client = makeClient({ port });
    await client.getSpoolmanSpools();

    const qp = urlParams(lastRequest.url);
    assert.equal(qp.use_v2_response, 'true', 'use_v2_response must be true');
  });

  it('unwraps v2 response and returns spools array', async () => {
    const mockSpools = [
      { id: 1, filament_used: 100 },
      { id: 2, filament_used: 50 },
    ];
    responseFactory = () => ({
      result: { response: mockSpools, response_headers: {}, error: null },
    });

    const client = makeClient({ port });
    const result = await client.getSpoolmanSpools();
    assert.deepEqual(result, mockSpools);
  });

  it('returns [] when Spoolman is disconnected (v2 error with 503)', async () => {
    responseFactory = () => ({
      result: {
        response: null,
        error: { status_code: 503, message: 'Spoolman server not available' },
      },
    });

    const client = makeClient({ port });
    const result = await client.getSpoolmanSpools();
    assert.deepEqual(result, []);
  });

  it('returns [] when Moonraker network call fails entirely', async () => {
    // Use an unused port so the fetch fails
    const client = makeClient({ port: 1 });
    const result = await client.getSpoolmanSpools();
    assert.deepEqual(result, []);
  });

  it('getSpoolmanStatus() exposes spoolman_connected and pending_reports', async () => {
    responseFactory = () => ({
      result: {
        spoolman_connected: true,
        pending_reports: [{ spool_id: 1, filament_used: 25 }],
        spool_id: 42,
      },
    });

    const client = makeClient({ port });
    const status = await client.getSpoolmanStatus();
    assert.equal(status.spoolman_connected, true);
    assert.equal(status.pending_reports.length, 1);
    assert.equal(status.spool_id, 42);
  });
});
