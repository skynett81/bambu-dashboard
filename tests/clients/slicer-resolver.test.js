// slicer-resolver.test.js — picks the best available slicer backend.

import { describe, it, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { resolveSlicer, invalidateCache } from '../../server/slicer-resolver.js';
import { configure as configureForge } from '../../server/forge-slicer-client.js';

let server;
let port;

before(async () => {
  server = createServer((req, res) => {
    if (req.url === '/api/health') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ ok: true, service: 'forge-slicer', version: '1.10-test' }));
    }
    res.writeHead(404); res.end();
  });
  await new Promise(r => server.listen(0, '127.0.0.1', r));
  port = server.address().port;
});

after(() => new Promise(r => server.close(r)));

beforeEach(() => {
  invalidateCache();
});

describe('slicer-resolver', () => {
  it('picks forge when the service responds', async () => {
    configureForge({ url: `http://127.0.0.1:${port}`, enabled: true });
    const r = await resolveSlicer({ force: true });
    assert.equal(r.kind, 'forge');
    assert.equal(r.label, 'forge-slicer');
  });

  it('falls back to bridge or native when forge is disabled', async () => {
    configureForge({ enabled: false });
    invalidateCache();
    const r = await resolveSlicer({ force: true });
    // Bridge needs flatpak/AppImage; if not present we get native.
    assert.ok(r.kind === 'bridge' || r.kind === 'native');
    assert.equal(typeof r.slice, 'function');
    assert.equal(typeof r.getProfiles, 'function');
    configureForge({ enabled: true });
  });

  it('returns a uniform shape regardless of backend', async () => {
    configureForge({ url: `http://127.0.0.1:${port}`, enabled: true });
    const r = await resolveSlicer({ force: true });
    for (const key of ['kind', 'label', 'version', 'slice', 'getProfiles']) {
      assert.ok(key in r, `missing key: ${key}`);
    }
  });

  it('caches the result within the TTL', async () => {
    configureForge({ url: `http://127.0.0.1:${port}`, enabled: true });
    const a = await resolveSlicer({ force: true });
    const b = await resolveSlicer();  // cache hit
    assert.equal(a.kind, b.kind);
    assert.equal(a.label, b.label);
  });

  it('force=true bypasses the cache', async () => {
    configureForge({ url: `http://127.0.0.1:${port}`, enabled: true });
    await resolveSlicer({ force: true });
    // Disable forge, force re-resolve — should drop to bridge/native
    configureForge({ enabled: false });
    invalidateCache();
    const r = await resolveSlicer({ force: true });
    assert.notEqual(r.kind, 'forge');
    configureForge({ enabled: true });
  });
});
