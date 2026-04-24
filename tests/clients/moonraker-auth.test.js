// moonraker-auth.test.js — Tests for Moonraker auth behaviour
// Validates Bearer/X-Api-Key header selection, oneshot_token flow on WS connect,
// and server.connection.identify RPC after WebSocket open.

import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { WebSocketServer } from 'ws';
import { MoonrakerClient } from '../../server/moonraker-client.js';

function makeClient({ port, apiKey = '', token = '' } = {}) {
  const hub = { broadcast: () => {} };
  const config = {
    printer: {
      ip: '127.0.0.1',
      port,
      type: 'voron',
      accessCode: apiKey,
      token,
    },
  };
  return new MoonrakerClient(config, hub);
}

describe('MoonrakerClient._authHeaders()', () => {
  it('returns Bearer token when token is set', () => {
    const client = makeClient({ port: 0, token: 'jwt-abc' });
    const headers = client._authHeaders();
    assert.equal(headers['Authorization'], 'Bearer jwt-abc');
    assert.equal(headers['X-Api-Key'], undefined, 'X-Api-Key should not be set when Bearer is used');
  });

  it('returns X-Api-Key when only apiKey is set', () => {
    const client = makeClient({ port: 0, apiKey: 'api-xyz' });
    const headers = client._authHeaders();
    assert.equal(headers['X-Api-Key'], 'api-xyz');
    assert.equal(headers['Authorization'], undefined);
  });

  it('prefers Bearer over X-Api-Key when both are set', () => {
    const client = makeClient({ port: 0, apiKey: 'api-xyz', token: 'jwt-abc' });
    const headers = client._authHeaders();
    assert.equal(headers['Authorization'], 'Bearer jwt-abc');
    assert.equal(headers['X-Api-Key'], undefined);
  });

  it('returns empty object when neither is set', () => {
    const client = makeClient({ port: 0 });
    const headers = client._authHeaders();
    assert.deepEqual(headers, {});
  });
});

describe('MoonrakerClient WebSocket auth flow', () => {
  let httpServer, wss, port;
  let httpRequests, wsMessages, lastQuery;

  before(async () => {
    httpRequests = [];
    wsMessages = [];
    lastQuery = null;

    httpServer = createServer((req, res) => {
      httpRequests.push({ method: req.method, url: req.url, headers: { ...req.headers } });
      if (req.url.startsWith('/access/oneshot_token')) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ result: 'oneshot-token-xyz' }));
        return;
      }
      res.writeHead(404);
      res.end();
    });

    wss = new WebSocketServer({ server: httpServer, path: '/websocket' });
    wss.on('connection', (ws, req) => {
      lastQuery = req.url;
      ws.on('message', (data) => {
        try {
          const msg = JSON.parse(data.toString());
          wsMessages.push(msg);
          // Reply to identify so client resolves its promise
          if (msg.method === 'server.connection.identify') {
            ws.send(JSON.stringify({
              jsonrpc: '2.0',
              id: msg.id,
              result: { connection_id: 42 },
            }));
          }
          // Reply to printer.objects.list with empty so subscription doesn't hang
          if (msg.method === 'printer.objects.list') {
            ws.send(JSON.stringify({
              jsonrpc: '2.0',
              id: msg.id,
              result: { objects: [] },
            }));
          }
        } catch {}
      });
    });

    await new Promise((resolve) => httpServer.listen(0, '127.0.0.1', resolve));
    port = httpServer.address().port;
  });

  after(async () => {
    wss.close();
    await new Promise((resolve) => httpServer.close(resolve));
  });

  it('requests oneshot_token when apiKey is set and appends it to WS URL', async () => {
    httpRequests.length = 0;
    wsMessages.length = 0;
    lastQuery = null;

    const client = makeClient({ port, apiKey: 'api-xyz' });
    client.connect();

    // Wait for identify to arrive
    await new Promise((resolve) => {
      const t = setInterval(() => {
        if (wsMessages.some(m => m.method === 'server.connection.identify')) {
          clearInterval(t);
          resolve();
        }
      }, 20);
      setTimeout(() => { clearInterval(t); resolve(); }, 2000);
    });

    client.disconnect();

    const tokenReq = httpRequests.find(r => r.url.startsWith('/access/oneshot_token'));
    assert.ok(tokenReq, 'expected a request to /access/oneshot_token');
    assert.equal(tokenReq.headers['x-api-key'], 'api-xyz', 'oneshot_token request should carry X-Api-Key');

    assert.ok(lastQuery?.includes('token=oneshot-token-xyz'), `WS URL should include token= query param (got: ${lastQuery})`);
  });

  it('sends server.connection.identify with client_name=3DPrintForge after WS open', async () => {
    httpRequests.length = 0;
    wsMessages.length = 0;

    const client = makeClient({ port, apiKey: 'api-xyz' });
    client.connect();

    await new Promise((resolve) => {
      const t = setInterval(() => {
        if (wsMessages.some(m => m.method === 'server.connection.identify')) {
          clearInterval(t);
          resolve();
        }
      }, 20);
      setTimeout(() => { clearInterval(t); resolve(); }, 2000);
    });

    client.disconnect();

    const identify = wsMessages.find(m => m.method === 'server.connection.identify');
    assert.ok(identify, 'expected server.connection.identify RPC');
    assert.equal(identify.params?.client_name, '3DPrintForge');
    assert.equal(identify.params?.type, 'other');
    assert.ok(identify.params?.version, 'identify should include version');
    assert.equal(identify.params?.api_key, 'api-xyz', 'identify should include api_key when set');
  });

  it('does not call oneshot_token when no apiKey and no token', async () => {
    httpRequests.length = 0;
    wsMessages.length = 0;
    lastQuery = null;

    const client = makeClient({ port });
    client.connect();

    await new Promise((resolve) => setTimeout(resolve, 300));
    client.disconnect();

    const tokenReq = httpRequests.find(r => r.url.startsWith('/access/oneshot_token'));
    assert.equal(tokenReq, undefined, 'no oneshot_token request expected when unauthenticated');
    assert.ok(!lastQuery?.includes('token='), 'WS URL should not include token= query');
  });
});
