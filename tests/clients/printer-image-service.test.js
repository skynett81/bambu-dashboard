// printer-image-service.test.js — service-level tests with isolated
// per-test cache directory + mock HTTP server for vendor URL.

import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { mkdtempSync, rmSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

let tmpDir, originalDataDir;
let vendorServer, vendorPort;
let vendorRequests = 0;
let vendorBody = Buffer.from('not-an-image');
let vendorContentType = 'text/plain';
let vendorStatus = 200;

before(async () => {
  // Run the service against an isolated DATA_DIR. The module reads it on
  // import, so we set it before requiring.
  tmpDir = mkdtempSync(join(tmpdir(), 'printer-img-'));
  originalDataDir = process.env.DATA_DIR;
  process.env.DATA_DIR = tmpDir;

  // Mock vendor CDN.
  vendorServer = http.createServer((req, res) => {
    vendorRequests++;
    if (req.url === '/printer.png') {
      res.writeHead(vendorStatus, { 'Content-Type': vendorContentType });
      res.end(vendorBody);
      return;
    }
    res.writeHead(404); res.end();
  });
  await new Promise(r => vendorServer.listen(0, '127.0.0.1', r));
  vendorPort = vendorServer.address().port;
});

after(() => {
  vendorServer.close();
  if (tmpDir) rmSync(tmpDir, { recursive: true, force: true });
  if (originalDataDir === undefined) delete process.env.DATA_DIR;
  else process.env.DATA_DIR = originalDataDir;
});

// Build a valid PNG: 8-byte signature + IHDR header + small IDAT/IEND.
// Just needs to look enough like a PNG that the content-type check passes.
function _validPngBuffer() {
  const sig = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
  // Pad with garbage so the size is > 200 bytes (the service rejects tiny payloads).
  const body = Buffer.alloc(400, 0x42);
  return Buffer.concat([sig, body]);
}

describe('printer-image-service', () => {
  let svc;

  before(async () => {
    // Re-import the module AFTER process.env.DATA_DIR is set so it picks
    // up our isolated tmp dir.
    svc = await import('../../server/printer-image-service.js?fresh=' + Date.now());
  });

  it('_slug normalises model names', () => {
    assert.equal(svc._internals._slug('Bambu Lab P2S'), 'bambu_lab_p2s');
    assert.equal(svc._internals._slug('Snapmaker U1'),  'snapmaker_u1');
    assert.equal(svc._internals._slug('  H2D Pro!! '),  'h2d_pro');
    assert.equal(svc._internals._slug(''),              '');
    assert.equal(svc._internals._slug(null),            '');
  });

  it('returns null when model is unknown to registry', async () => {
    const res = await svc.getPrinterImage('Unknown Model 9000');
    assert.equal(res, null);
  });

  it('uploads custom image and serves it from cache', async () => {
    const png = _validPngBuffer();
    const result = svc.uploadPrinterImage('Test Printer X', png, 'image/png');
    assert.equal(result.slug, 'test_printer_x');
    assert.equal(result.bytes, png.length);

    const cached = await svc.getPrinterImage('Test Printer X');
    assert.ok(cached);
    assert.equal(cached.contentType, 'image/png');
    assert.equal(cached.buffer.length, png.length);
    assert.equal(cached.source, 'admin-upload');
  });

  it('rejects non-image content-type on upload', () => {
    assert.throws(() => svc.uploadPrinterImage('Bad', Buffer.from('hi'), 'text/plain'));
  });

  it('rejects empty buffer on upload', () => {
    assert.throws(() => svc.uploadPrinterImage('Bad', Buffer.alloc(0), 'image/png'));
  });

  it('clearPrinterImage removes the cached entry', async () => {
    svc.uploadPrinterImage('Tmp Model', _validPngBuffer(), 'image/png');
    const removed = svc.clearPrinterImage('Tmp Model');
    assert.equal(removed.filesRemoved, 2);
    const after = await svc.getPrinterImage('Tmp Model');
    assert.equal(after, null);
  });

  it('getCacheStats reports entry count + total bytes', () => {
    const png = _validPngBuffer();
    svc.uploadPrinterImage('Stats Probe A', png, 'image/png');
    svc.uploadPrinterImage('Stats Probe B', png, 'image/png');
    const stats = svc.getCacheStats();
    assert.ok(stats.entries >= 2);
    assert.ok(stats.bytes >= png.length * 2);
  });

  it('listRegistry returns array with cached:true for uploaded entries', () => {
    // The bundled registry is large; verify shape only.
    const list = svc.listRegistry();
    assert.ok(Array.isArray(list));
    assert.ok(list.length > 50);
    assert.ok(list.every(e => 'slug' in e && 'cached' in e));
  });

  it('fetches from vendor URL when registry has one and caches result', async () => {
    // Patch the registry on the fly: write a temp registry pointing at our mock vendor.
    const reg = svc._internals._loadRegistry();
    reg.fetch_test_model = `http://127.0.0.1:${vendorPort}/printer.png`;
    vendorBody = _validPngBuffer();
    vendorContentType = 'image/png';
    vendorStatus = 200;
    const before = vendorRequests;
    const res1 = await svc.getPrinterImage('Fetch Test Model');
    assert.ok(res1, 'should fetch from vendor');
    assert.equal(res1.contentType, 'image/png');
    assert.ok(vendorRequests > before, 'should have hit the upstream once');
    // Second call must be cached, not re-fetched.
    const before2 = vendorRequests;
    const res2 = await svc.getPrinterImage('Fetch Test Model');
    assert.ok(res2);
    assert.equal(vendorRequests, before2, 'second call should NOT hit upstream');
  });

  it('rejects non-image content-type from vendor URL', async () => {
    const reg = svc._internals._loadRegistry();
    reg.bad_ct_model = `http://127.0.0.1:${vendorPort}/printer.png`;
    vendorBody = Buffer.from('<html>error</html>');
    vendorContentType = 'text/html';
    vendorStatus = 200;
    const res = await svc.getPrinterImage('Bad CT Model');
    assert.equal(res, null);
  });

  it('rejects vendor 404', async () => {
    const reg = svc._internals._loadRegistry();
    reg.notfound_model = `http://127.0.0.1:${vendorPort}/missing.png`;
    const res = await svc.getPrinterImage('NotFound Model');
    assert.equal(res, null);
  });
});
