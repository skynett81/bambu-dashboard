// prusa-connect.test.js — Tests for the PrusaConnect cloud camera relay.
// Verifies Token + Fingerprint header auth, 2xx handling, error tolerance,
// size limits, and config-based factory.

import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { PrusaConnectClient, fromPrinterConfig } from '../../server/prusa-connect.js';

const TOKEN = 'abcdef1234567890';
const FINGERPRINT = '3dprintforge-test-fingerprint-16chars';

async function startMock(handler) {
  const requests = [];
  const server = createServer((req, res) => {
    const chunks = [];
    req.on('data', c => chunks.push(c));
    req.on('end', () => {
      const body = Buffer.concat(chunks);
      requests.push({
        method: req.method, url: req.url,
        headers: { ...req.headers },
        body,
      });
      handler(req, res, body);
    });
  });
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  const port = server.address().port;
  return { server, port, requests, host: `http://127.0.0.1:${port}` };
}

describe('PrusaConnectClient construction', () => {
  it('requires token', () => {
    assert.throws(() => new PrusaConnectClient({ fingerprint: 'x'.repeat(20) }),
      /token is required/);
  });

  it('requires fingerprint 16–64 chars', () => {
    assert.throws(() => new PrusaConnectClient({ token: 't', fingerprint: 'short' }),
      /fingerprint must be 16–64/);
    assert.throws(() => new PrusaConnectClient({ token: 't', fingerprint: 'x'.repeat(65) }),
      /fingerprint must be 16–64/);
  });

  it('constructs with valid params', () => {
    const c = new PrusaConnectClient({ token: 'abc', fingerprint: 'x'.repeat(16) });
    assert.equal(c.token, 'abc');
  });

  it('strips trailing slash from host', () => {
    const c = new PrusaConnectClient({ token: 'abc', fingerprint: 'x'.repeat(16), host: 'https://ex.com/' });
    assert.equal(c.host, 'https://ex.com');
  });
});

describe('PrusaConnectClient uploadSnapshot', () => {
  let mock;

  before(async () => {
    mock = await startMock((req, res) => {
      if (req.method === 'PUT' && req.url === '/c/snapshot') {
        res.writeHead(204);
        res.end();
        return;
      }
      res.writeHead(404);
      res.end();
    });
  });

  after(async () => {
    await new Promise((r) => mock.server.close(r));
  });

  it('sends Token + Fingerprint headers with PUT /c/snapshot', async () => {
    mock.requests.length = 0;
    const c = new PrusaConnectClient({ token: TOKEN, fingerprint: FINGERPRINT, host: mock.host });
    const jpeg = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]); // minimal JPEG-ish

    const ok = await c.uploadSnapshot(jpeg);
    assert.equal(ok, true);
    assert.equal(mock.requests.length, 1);

    const req = mock.requests[0];
    assert.equal(req.method, 'PUT');
    assert.equal(req.url, '/c/snapshot');
    assert.equal(req.headers.token, TOKEN);
    assert.equal(req.headers.fingerprint, FINGERPRINT);
    assert.equal(req.headers['content-type'], 'image/jpg');
    assert.equal(req.body.length, 6);
  });

  it('rejects empty buffer', async () => {
    const c = new PrusaConnectClient({ token: TOKEN, fingerprint: FINGERPRINT, host: mock.host });
    await assert.rejects(() => c.uploadSnapshot(Buffer.alloc(0)), /empty buffer/);
  });

  it('rejects non-Buffer input', async () => {
    const c = new PrusaConnectClient({ token: TOKEN, fingerprint: FINGERPRINT, host: mock.host });
    await assert.rejects(() => c.uploadSnapshot('not a buffer'), /Buffer or Uint8Array/);
  });

  it('rejects oversized snapshot (>16 MB)', async () => {
    const c = new PrusaConnectClient({ token: TOKEN, fingerprint: FINGERPRINT, host: mock.host });
    const big = Buffer.alloc(17 * 1024 * 1024);
    await assert.rejects(() => c.uploadSnapshot(big), /too large/);
  });
});

describe('PrusaConnectClient error tolerance', () => {
  it('returns false on server error without throwing', async () => {
    const errorMock = await startMock((req, res) => {
      res.writeHead(500); res.end();
    });
    try {
      const c = new PrusaConnectClient({ token: TOKEN, fingerprint: FINGERPRINT, host: errorMock.host });
      const ok = await c.uploadSnapshot(Buffer.from([0xff, 0xd8]));
      assert.equal(ok, false);
    } finally {
      await new Promise((r) => errorMock.server.close(r));
    }
  });

  it('returns false when host is unreachable', async () => {
    const c = new PrusaConnectClient({ token: TOKEN, fingerprint: FINGERPRINT, host: 'http://127.0.0.1:1' });
    const ok = await c.uploadSnapshot(Buffer.from([0xff, 0xd8]));
    assert.equal(ok, false);
  });
});

describe('PrusaConnectClient updateCameraInfo', () => {
  let mock;

  before(async () => {
    mock = await startMock((req, res) => {
      if (req.method === 'PUT' && req.url === '/c/info') {
        res.writeHead(204);
        res.end();
        return;
      }
      res.writeHead(404); res.end();
    });
  });

  after(async () => {
    await new Promise((r) => mock.server.close(r));
  });

  it('PUTs JSON to /c/info', async () => {
    mock.requests.length = 0;
    const c = new PrusaConnectClient({ token: TOKEN, fingerprint: FINGERPRINT, host: mock.host });
    await c.updateCameraInfo({ config: { resolution: '640x480' } });

    const req = mock.requests[0];
    assert.equal(req.method, 'PUT');
    assert.equal(req.url, '/c/info');
    assert.equal(req.headers['content-type'], 'application/json');
    const body = JSON.parse(req.body.toString('utf8'));
    assert.equal(body.config.resolution, '640x480');
  });
});

describe('fromPrinterConfig()', () => {
  it('returns null when prusaConnect block missing', () => {
    assert.equal(fromPrinterConfig({}), null);
    assert.equal(fromPrinterConfig({ prusaConnect: {} }), null);
    assert.equal(fromPrinterConfig({ prusaConnect: { token: 'x' } }), null);
  });

  it('returns a client when block is complete', () => {
    const c = fromPrinterConfig({
      prusaConnect: { token: 'abc', fingerprint: 'x'.repeat(16) },
    });
    assert.ok(c instanceof PrusaConnectClient);
  });
});
