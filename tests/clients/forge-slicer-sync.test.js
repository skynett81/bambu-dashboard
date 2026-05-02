// forge-slicer-sync.test.js — mirrors forke profile catalog into local
// slicer_profiles. Uses an in-process mock HTTP server + the test
// helper's in-memory SQLite.

import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { setupTestDb } from '../test-helper.js';
import { configure as configureForge } from '../../server/forge-slicer-client.js';
import { syncOnce, lastSync } from '../../server/forge-slicer-sync.js';
import { listProfiles } from '../../server/db/slicer-profiles.js';
import { getDb } from '../../server/db/connection.js';

let server;
let dbHandle;
let MOCK_PROFILES;

before(async () => {
  dbHandle = await setupTestDb();

  MOCK_PROFILES = [
    { id: 'u1-04', kind: 'printer', name: 'Forge U1 0.4', vendor: 'Snapmaker', is_default: true, settings: { layerHeight: 0.2 } },
    { id: 'pla-generic', kind: 'filament', name: 'Forge Generic PLA', vendor: 'Generic', is_default: false, settings: { nozzleTemp: 215 } },
    { id: 'normal-020', kind: 'process', name: 'Forge Normal 0.20', vendor: 'OrcaSlicer', is_default: false, settings: { layer_height: 0.20 } },
  ];

  server = createServer((req, res) => {
    if (req.url === '/api/health') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ ok: true, service: 'forge-slicer', version: 't' }));
    }
    if (req.url.startsWith('/api/profiles')) {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ profiles: MOCK_PROFILES }));
    }
    res.writeHead(404); res.end();
  });
  await new Promise(r => server.listen(0, '127.0.0.1', r));
  const { port } = server.address();
  configureForge({ url: `http://127.0.0.1:${port}`, enabled: true });
});

after(() => {
  if (dbHandle?.close) dbHandle.close();
  return new Promise(r => server.close(r));
});

describe('forge-slicer-sync', () => {
  it('imports remote profiles into slicer_profiles tagged forge-slicer', async () => {
    const result = await syncOnce();
    assert.equal(result.ok, true);
    assert.equal(result.imported, 3);
    const db = getDb();
    const rows = db.prepare("SELECT * FROM slicer_profiles WHERE vendor = 'forge-slicer'").all();
    assert.equal(rows.length, 3);
    assert.ok(rows.some(r => r.kind === 'printer' && r.name === 'Forge U1 0.4'));
    assert.ok(rows.some(r => r.kind === 'filament' && r.name === 'Forge Generic PLA'));
  });

  it('updates settings on subsequent syncs without duplicating', async () => {
    // Mutate the mock — change a setting.
    MOCK_PROFILES[0].settings.layerHeight = 0.16;
    const result = await syncOnce();
    assert.equal(result.ok, true);
    assert.equal(result.imported, 0);
    assert.equal(result.updated, 3);
    const db = getDb();
    const row = db.prepare("SELECT settings_json FROM slicer_profiles WHERE name = 'Forge U1 0.4'").get();
    const parsed = JSON.parse(row.settings_json);
    assert.equal(parsed.layerHeight, 0.16);
  });

  it('archives profiles that disappear from the remote', async () => {
    MOCK_PROFILES = MOCK_PROFILES.slice(1);  // drop U1 entry
    const result = await syncOnce();
    assert.equal(result.ok, true);
    assert.equal(result.removed, 1);
    const db = getDb();
    const archived = db.prepare("SELECT * FROM slicer_profiles WHERE vendor = 'forge-slicer-archived'").all();
    assert.ok(archived.some(r => r.name === 'Forge U1 0.4'));
    // Active forge-slicer rows should now be 2.
    const active = db.prepare("SELECT COUNT(*) as c FROM slicer_profiles WHERE vendor = 'forge-slicer'").get();
    assert.equal(active.c, 2);
  });

  it('lastSync() reflects the most recent run', async () => {
    const before = lastSync();
    await syncOnce();
    const after = lastSync();
    assert.ok(after.at > before.at);
    assert.equal(after.ok, true);
  });

  it('returns ok:false when forge is disabled', async () => {
    configureForge({ enabled: false });
    const result = await syncOnce();
    assert.equal(result.ok, false);
    assert.equal(result.error, 'disabled');
    configureForge({ enabled: true });
  });
});
