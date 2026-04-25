// scene-builder-generators.test.js — Generator-backed scene shapes,
// snap-helpers, preview path.

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { validateScene, buildSceneAsync } from '../../server/scene-builder.js';
import { defaultGeneratorOpts } from '../../server/ai-forge-generators.js';

describe('scene-builder: generator-type shapes', () => {
  it('validateScene accepts generator type', () => {
    assert.doesNotThrow(() => validateScene({
      shapes: [{ type: 'generator', params: { generatorKey: 'keychain' } }],
    }));
  });

  it('validateScene rejects generator without generatorKey', () => {
    assert.throws(() => validateScene({
      shapes: [{ type: 'generator', params: {} }],
    }));
  });

  it('buildSceneAsync produces a real mesh from a generator-shape', async () => {
    const scene = {
      shapes: [{
        id: 'g1', type: 'generator',
        params: {
          generatorKey: 'keychain',
          generatorOpts: { text: 'TEST', width: 30, height: 15, thickness: 3 },
        },
        transform: { px: 0, py: 0, pz: 0, rx: 0, ry: 0, rz: 0, sx: 1, sy: 1, sz: 1 },
      }],
    };
    const mesh = await buildSceneAsync(scene, { useCsg: false });
    // Generator output via lib3mf round-trip — should produce a non-empty mesh.
    assert.ok(mesh.positions.length > 0);
    assert.ok(mesh.indices.length > 0);
    assert.ok(mesh.indices.length / 3 > 10);
  });

  it('combines a primitive and a generator into one mesh', async () => {
    const scene = {
      shapes: [
        { type: 'box', params: { w: 20, h: 20, d: 20 }, transform: {} },
        {
          type: 'generator',
          params: {
            generatorKey: 'gear',
            generatorOpts: { teeth: 12, modulus: 1, thickness: 4, boreDiameter: 3 },
          },
          transform: { px: 50 },
        },
      ],
    };
    const mesh = await buildSceneAsync(scene, { useCsg: false });
    // Both shapes contributed → faces ≥ 12 (box) + something (gear).
    assert.ok(mesh.indices.length / 3 > 12);
  });
});

describe('ai-forge-generators: defaultGeneratorOpts', () => {
  it('returns sensible keychain defaults', () => {
    const opts = defaultGeneratorOpts('keychain');
    assert.equal(typeof opts.text, 'string');
    assert.ok(opts.width > 0);
    assert.ok(opts.thickness > 0);
  });

  it('returns sensible gear defaults', () => {
    const opts = defaultGeneratorOpts('gear');
    assert.ok(opts.teeth >= 8);
    assert.ok(opts.modulus > 0);
    assert.ok(opts.thickness > 0);
  });

  it('returns empty object for unknown key', () => {
    assert.deepEqual(defaultGeneratorOpts('nonexistent'), {});
  });
});
