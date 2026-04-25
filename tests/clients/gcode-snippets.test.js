// gcode-snippets.test.js — CRUD + filter for the macro library.

import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';
import { setupTestDb } from '../test-helper.js';
import {
  listGcodeSnippets,
  getGcodeSnippet,
  createGcodeSnippet,
  updateGcodeSnippet,
  deleteGcodeSnippet,
  getGcodeSnippetCategories,
} from '../../server/db/gcode-snippets.js';

describe('G-code snippet library', () => {
  before(() => setupTestDb());

  it('rejects snippet without name or body', () => {
    assert.throws(() => createGcodeSnippet({ body: 'G28' }));
    assert.throws(() => createGcodeSnippet({ name: 'x' }));
  });

  it('rejects unknown firmware flavour', () => {
    assert.throws(() => createGcodeSnippet({ name: 'x', body: 'G28', firmware: 'duet' }));
  });

  it('creates and retrieves a snippet', () => {
    const created = createGcodeSnippet({
      name: 'Test home', category: 'movement', firmware: 'auto',
      description: 'home all axes', body: 'G28', tags: 'home,test', is_shared: 1,
    });
    assert.ok(created.id);
    assert.equal(created.name, 'Test home');
    const fetched = getGcodeSnippet(created.id);
    assert.equal(fetched.body, 'G28');
  });

  it('lists snippets and filters by category', () => {
    createGcodeSnippet({ name: 'Pre PLA', category: 'temperature', body: 'M104 S210' });
    const all = listGcodeSnippets();
    const tempOnly = listGcodeSnippets({ category: 'temperature' });
    assert.ok(all.length >= 2);
    assert.ok(tempOnly.every(s => s.category === 'temperature'));
  });

  it('filters by firmware (auto matches everything)', () => {
    createGcodeSnippet({ name: 'Klip only', firmware: 'klipper', body: 'SAVE_CONFIG' });
    const klipper = listGcodeSnippets({ firmware: 'klipper' });
    // Klipper filter matches firmware='klipper' OR 'auto'.
    assert.ok(klipper.some(s => s.firmware === 'klipper'));
    assert.ok(klipper.some(s => s.firmware === 'auto'));
  });

  it('search filters across name, description, tags', () => {
    createGcodeSnippet({ name: 'Search target', body: 'M999', tags: 'unique-tag' });
    const found = listGcodeSnippets({ search: 'unique-tag' });
    assert.ok(found.some(s => s.tags === 'unique-tag'));
  });

  it('updates snippet (partial patch)', () => {
    const created = createGcodeSnippet({ name: 'Update me', body: 'G28' });
    const updated = updateGcodeSnippet(created.id, { description: 'now described' });
    assert.equal(updated.description, 'now described');
    assert.equal(updated.body, 'G28'); // body unchanged
  });

  it('returns null when updating missing snippet', () => {
    assert.equal(updateGcodeSnippet(99999, { name: 'ghost' }), null);
  });

  it('deletes a snippet', () => {
    const created = createGcodeSnippet({ name: 'Delete me', body: 'M999' });
    assert.equal(deleteGcodeSnippet(created.id), true);
    assert.equal(getGcodeSnippet(created.id), undefined);
  });

  it('returns false when deleting missing snippet', () => {
    assert.equal(deleteGcodeSnippet(99999), false);
  });

  it('groups categories with counts', () => {
    const cats = getGcodeSnippetCategories();
    assert.ok(Array.isArray(cats));
    for (const c of cats) {
      assert.ok(c.category && c.count > 0);
    }
  });
});
