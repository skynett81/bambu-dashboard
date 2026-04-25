// slicer-profiles.test.js — DB CRUD for the slicer profile library.

import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { setupTestDb } from '../test-helper.js';

import {
  listProfiles, getProfile, getDefaultProfile,
  createProfile, updateProfile, deleteProfile, mergeProfiles,
} from '../../server/db/slicer-profiles.js';

let dbHandle;

before(async () => {
  dbHandle = await setupTestDb();
});

after(() => {
  if (dbHandle?.close) dbHandle.close();
});

describe('slicer-profiles repo', () => {
  it('seeded defaults are present after migration v135', () => {
    const all = listProfiles();
    assert.ok(all.length >= 12, `expected seed profiles, got ${all.length}`);
    assert.ok(all.some(p => p.kind === 'filament' && p.name === 'Generic PLA'));
    assert.ok(all.some(p => p.kind === 'process'  && p.name === 'Normal (0.20 mm)'));
    assert.ok(all.some(p => p.kind === 'printer'  && p.name === 'Snapmaker U1'));
  });

  it('listProfiles(kind) filters by kind', () => {
    const filaments = listProfiles('filament');
    assert.ok(filaments.length >= 5);
    assert.ok(filaments.every(p => p.kind === 'filament'));
  });

  it('getDefaultProfile returns the entry flagged is_default for that kind', () => {
    const def = getDefaultProfile('process');
    assert.equal(def.name, 'Normal (0.20 mm)');
  });

  it('createProfile stores settings as JSON', () => {
    const created = createProfile({
      kind: 'process', name: 'Test Custom Quality', vendor: 'User',
      settings: { layerHeight: 0.16, perimeters: 4, infillDensity: 0.5 },
    });
    assert.ok(created.id);
    assert.equal(created.name, 'Test Custom Quality');
    const parsed = JSON.parse(created.settings_json);
    assert.equal(parsed.layerHeight, 0.16);
    deleteProfile(created.id); // cleanup
  });

  it('createProfile with is_default unsets the previous default', () => {
    const oldDef = getDefaultProfile('process');
    const newDef = createProfile({
      kind: 'process', name: 'Test Default Replacement',
      settings: {}, is_default: 1,
    });
    const after = getDefaultProfile('process');
    assert.equal(after.id, newDef.id);
    // restore
    updateProfile(oldDef.id, { is_default: 1 });
    deleteProfile(newDef.id);
  });

  it('updateProfile preserves untouched fields', () => {
    const p = createProfile({ kind: 'filament', name: 'tmp-update', settings: { nozzleTemp: 200 } });
    const updated = updateProfile(p.id, { settings: { nozzleTemp: 230 } });
    assert.equal(updated.name, 'tmp-update');
    assert.equal(JSON.parse(updated.settings_json).nozzleTemp, 230);
    deleteProfile(p.id);
  });

  it('deleteProfile returns false for unknown id', () => {
    assert.equal(deleteProfile(999999999), false);
  });

  it('rejects unknown kind', () => {
    assert.throws(() => createProfile({ kind: 'spaceship', name: 'foo' }));
  });

  it('mergeProfiles overlays printer + filament + process', () => {
    const p = listProfiles('printer').find(x => x.name === 'Bambu Lab P2S');
    const f = listProfiles('filament').find(x => x.name === 'Generic PLA');
    const q = listProfiles('process').find(x => x.name === 'Normal (0.20 mm)');
    const merged = mergeProfiles({ printerId: p.id, filamentId: f.id, processId: q.id });
    // Printer brings buildVolume + travelSpeed.
    assert.deepEqual(merged.buildVolume, [256, 256, 256]);
    assert.equal(merged.travelSpeed, 200);
    // Filament brings nozzleTemp + bedTemp.
    assert.equal(merged.nozzleTemp, 215);
    assert.equal(merged.bedTemp, 60);
    // Process brings layer/infill.
    assert.equal(merged.layerHeight, 0.20);
    assert.equal(merged.infillDensity, 0.20);
    assert.equal(merged.perimeters, 2);
  });

  it('mergeProfiles handles missing IDs gracefully', () => {
    const merged = mergeProfiles({ printerId: null, filamentId: null, processId: null });
    assert.deepEqual(merged, {});
  });
});
