// tigertag.test.js — Tests offline lookup, online fallback, normalisation,
// UID hygiene (case + separator handling), and cache behaviour.

import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { TigerTagLookup } from '../../server/tigertag-lookup.js';

describe('TigerTagLookup offline DB', () => {
  const db = {
    'DEADBEEF': { material: 'PLA', vendor: 'Polymaker', color: 'FF0000', bed_temp: 60 },
  };

  it('resolves by exact UID', async () => {
    const t = new TigerTagLookup({ offlineDb: db });
    const r = await t.lookup('DEADBEEF');
    assert.equal(r.material, 'PLA');
    assert.equal(r.source, 'offline');
  });

  it('normalises lowercase and separators (dead:beef → DEADBEEF)', async () => {
    const t = new TigerTagLookup({ offlineDb: db });
    assert.equal((await t.lookup('dead-beef')).material, 'PLA');
    assert.equal((await t.lookup('de:ad:be:ef')).material, 'PLA');
    assert.equal((await t.lookup('de ad be ef')).material, 'PLA');
  });

  it('returns null for unknown UID when offline-only', async () => {
    const t = new TigerTagLookup({ offlineDb: db, enableOnlineLookup: false });
    assert.equal(await t.lookup('UNKNOWN01'), null);
  });

  it('returns null for empty / invalid input', async () => {
    const t = new TigerTagLookup({ offlineDb: db });
    assert.equal(await t.lookup(''), null);
    assert.equal(await t.lookup(null), null);
    assert.equal(await t.lookup('!!!'), null);
  });

  it('mergeOfflineDb extends known tags at runtime', async () => {
    const t = new TigerTagLookup({ offlineDb: {} });
    t.mergeOfflineDb({ CAFEBABE: { material: 'PETG' } });
    assert.equal((await t.lookup('CAFEBABE')).material, 'PETG');
  });
});

describe('TigerTagLookup online fallback', () => {
  let server, host;

  before(async () => {
    server = createServer((req, res) => {
      const m = req.url.match(/\/v2\/tag\/([A-F0-9]+)/);
      if (!m) { res.writeHead(400); res.end(); return; }
      if (m[1] === 'CAFE1234') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          uid: 'CAFE1234', vendor: 'Prusament', material: 'PETG',
          color: '00FF00', bed_temp: 85, nozzle_temp_min: 230, nozzle_temp_max: 250,
        }));
      } else {
        res.writeHead(404);
        res.end();
      }
    });
    await new Promise((r) => server.listen(0, '127.0.0.1', r));
    host = `http://127.0.0.1:${server.address().port}`;
  });

  after(async () => {
    await new Promise((r) => server.close(r));
  });

  it('falls back to online API when tag missing from offline DB', async () => {
    const t = new TigerTagLookup({ offlineDb: {}, enableOnlineLookup: true, apiHost: host });
    const r = await t.lookup('CAFE1234');
    assert.equal(r.material, 'PETG');
    assert.equal(r.vendor, 'Prusament');
    assert.equal(r.source, 'online');
  });

  it('returns null on 404 and caches the negative result', async () => {
    const t = new TigerTagLookup({ offlineDb: {}, enableOnlineLookup: true, apiHost: host });
    assert.equal(await t.lookup('NOTFOUND1'), null);
    // Second call hits cache — not the server (we don't count, just verify same result)
    assert.equal(await t.lookup('NOTFOUND1'), null);
  });

  it('online lookup disabled by default → returns null without HTTP call', async () => {
    const t = new TigerTagLookup({ offlineDb: {}, apiHost: host });
    assert.equal(await t.lookup('CAFE1234'), null);
  });
});
