// prusalink-auth.test.js — Tests for PrusaLink auth behaviour
// Validates preemptive digest auth when username/password set (PrusaLink 1.8+ dropped API-key support)
// and fallback to X-Api-Key when only apiKey is configured (legacy firmware).

import { describe, it, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { createHash, randomBytes } from 'node:crypto';
import { PrusaLinkClient } from '../../server/prusalink-client.js';

function createMockPrusaLinkServer({ requireDigest = true, apiKey = null, username = 'maker', password = 'secret' } = {}) {
  const realm = 'Printer API';
  const serverNonce = randomBytes(8).toString('hex');
  const requests = [];

  const server = createServer((req, res) => {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      const entry = {
        method: req.method,
        path: req.url,
        headers: { ...req.headers },
        body,
      };
      requests.push(entry);

      // Check API-key auth path first
      const apiKeyHeader = req.headers['x-api-key'];
      if (apiKey && apiKeyHeader === apiKey && !requireDigest) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ firmware: '1.7.2', serial: 'TEST-SN-12345' }));
        return;
      }

      // Digest auth path
      const authHeader = req.headers.authorization || '';
      if (authHeader.startsWith('Digest ')) {
        // Parse digest response
        const parts = Object.fromEntries(
          [...authHeader.slice(7).matchAll(/(\w+)=(?:"([^"]+)"|(\w+))/g)].map(m => [m[1], m[2] ?? m[3]])
        );
        const ha1 = createHash('md5').update(`${username}:${realm}:${password}`).digest('hex');
        const ha2 = createHash('md5').update(`${req.method}:${parts.uri}`).digest('hex');
        const expected = createHash('md5')
          .update(`${ha1}:${parts.nonce}:${parts.nc}:${parts.cnonce}:${parts.qop}:${ha2}`)
          .digest('hex');
        if (parts.response === expected) {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ firmware: '1.8.0', serial: 'TEST-SN-12345' }));
          return;
        }
      }

      // Challenge: return 401 with WWW-Authenticate
      res.writeHead(401, {
        'WWW-Authenticate': `Digest realm="${realm}", qop="auth", nonce="${serverNonce}"`,
        'Content-Type': 'application/json',
      });
      res.end(JSON.stringify({ error: 'unauthorized' }));
    });
  });

  return { server, requests, serverNonce, realm };
}

function startServer(server) {
  return new Promise((resolve) => {
    server.listen(0, '127.0.0.1', () => resolve(server.address().port));
  });
}

function stopServer(server) {
  return new Promise((resolve) => server.close(resolve));
}

function makeClient({ port, username, password, apiKey }) {
  const hub = { broadcast: () => {} };
  const config = {
    printer: {
      ip: '127.0.0.1',
      port,
      username,
      password,
      accessCode: apiKey || '',
    },
  };
  const client = new PrusaLinkClient(config, hub);
  return client;
}

describe('PrusaLink auth', () => {
  describe('preemptive digest auth (PrusaLink 1.8+)', () => {
    let mock, port;

    before(async () => {
      mock = createMockPrusaLinkServer({ requireDigest: true, username: 'maker', password: 'secret' });
      port = await startServer(mock.server);
    });

    after(async () => {
      await stopServer(mock.server);
    });

    beforeEach(() => {
      mock.requests.length = 0;
    });

    it('authenticates with digest (initial 401 probe + auth retry)', async () => {
      const client = makeClient({ port, username: 'maker', password: 'secret' });
      const res = await client._fetchWithAuth('GET', '/api/v1/info');
      assert.equal(res.status, 200, 'should authenticate with digest after challenge');

      // Standard digest flow: one 401 challenge, one auth'd retry
      assert.equal(mock.requests.length, 2, 'expected 1 probe + 1 auth, got: ' + mock.requests.length);
      assert.ok(
        !mock.requests[0].headers.authorization,
        'first request probes without Authorization header'
      );
      assert.ok(
        mock.requests[1].headers.authorization?.startsWith('Digest '),
        'second request must carry Digest Authorization header'
      );
    });

    it('does NOT send X-Api-Key when username/password set (1.8+ dropped API-key support)', async () => {
      const client = makeClient({ port, username: 'maker', password: 'secret', apiKey: 'should-not-be-sent' });
      await client._fetchWithAuth('GET', '/api/v1/info');
      const apiKeyHeaders = mock.requests.filter(r => r.headers['x-api-key']);
      assert.equal(apiKeyHeaders.length, 0, 'X-Api-Key must not be sent when credentials present');
    });

    it('caches digest nonce across requests (no 401 roundtrip on second call)', async () => {
      const client = makeClient({ port, username: 'maker', password: 'secret' });
      await client._fetchWithAuth('GET', '/api/v1/info');
      mock.requests.length = 0;

      await client._fetchWithAuth('GET', '/api/v1/status');
      assert.equal(mock.requests.length, 1, 'second request should not need a 401 probe');
      assert.ok(mock.requests[0].headers.authorization?.startsWith('Digest '));
    });
  });

  describe('fallback to X-Api-Key (legacy firmware < 1.8)', () => {
    let mock, port;

    before(async () => {
      mock = createMockPrusaLinkServer({ requireDigest: false, apiKey: 'legacy-api-key' });
      port = await startServer(mock.server);
    });

    after(async () => {
      await stopServer(mock.server);
    });

    beforeEach(() => {
      mock.requests.length = 0;
    });

    it('uses X-Api-Key when only apiKey is configured (no username)', async () => {
      const client = makeClient({ port, apiKey: 'legacy-api-key' });
      // Explicitly clear username so it doesn't default to 'maker'
      client.username = '';
      client.password = '';
      const res = await client._fetchWithAuth('GET', '/api/v1/info');
      assert.equal(res.status, 200);
      assert.equal(mock.requests[0].headers['x-api-key'], 'legacy-api-key');
    });
  });

  describe('auth failure broadcast', () => {
    let mock, port;

    before(async () => {
      mock = createMockPrusaLinkServer({ requireDigest: true, username: 'maker', password: 'secret' });
      port = await startServer(mock.server);
    });

    after(async () => {
      await stopServer(mock.server);
    });

    it('broadcasts auth_error when credentials are wrong', async () => {
      const events = [];
      const hub = { broadcast: (channel, payload) => events.push({ channel, payload }) };
      const config = {
        printer: {
          ip: '127.0.0.1',
          port,
          username: 'wrong',
          password: 'wrong',
        },
      };
      const client = new PrusaLinkClient(config, hub);

      const res = await client._fetchWithAuth('GET', '/api/v1/info');
      assert.equal(res.status, 401, 'expected 401 with wrong creds');

      const authErrors = events.filter(e => e.payload?.status === 'auth_error');
      assert.ok(authErrors.length > 0, 'expected auth_error broadcast');
      assert.ok(authErrors[0].payload.hint?.includes('username'), 'hint should mention credentials');
    });
  });
});
