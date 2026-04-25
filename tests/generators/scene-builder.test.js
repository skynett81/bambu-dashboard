// scene-builder.test.js — Tests for Scene Composer mesh composition

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  validateScene, buildScene, defaultScene, _internals,
} from '../../server/scene-builder.js';

describe('scene-builder: validateScene', () => {
  it('accepts a valid scene', () => {
    assert.doesNotThrow(() => validateScene({
      name: 'x',
      shapes: [{ type: 'box', params: {} }],
    }));
  });
  it('rejects null / non-object', () => {
    assert.throws(() => validateScene(null));
    assert.throws(() => validateScene('not an object'));
  });
  it('rejects empty shape list', () => {
    assert.throws(() => validateScene({ shapes: [] }));
  });
  it('rejects unknown type', () => {
    assert.throws(() => validateScene({ shapes: [{ type: 'spaceship' }] }));
  });
});

describe('scene-builder: buildScene', () => {
  it('builds single-box scene', () => {
    const mesh = buildScene({
      shapes: [{ type: 'box', params: { w: 10, h: 10, d: 10 }, transform: {} }],
    });
    assert.equal(mesh.positions.length / 3, 8);
    assert.equal(mesh.indices.length / 3, 12);
  });

  it('combines two boxes via union', () => {
    const mesh = buildScene({
      shapes: [
        { type: 'box', params: { w: 10, h: 10, d: 10 }, transform: { px: 0 } },
        { type: 'box', params: { w: 10, h: 10, d: 10 }, transform: { px: 30 } },
      ],
    });
    assert.equal(mesh.positions.length / 3, 16);
    assert.equal(mesh.indices.length / 3, 24);
  });

  it('skips holes by default', () => {
    const mesh = buildScene({
      shapes: [
        { type: 'box', params: { w: 10, h: 10, d: 10 } },
        { type: 'sphere', params: { r: 5 }, hole: true },
      ],
    });
    // Only the box contributes — 8 vertices.
    assert.equal(mesh.positions.length / 3, 8);
  });

  it('throws when all shapes are holes', () => {
    assert.throws(() => buildScene({
      shapes: [{ type: 'box', params: {}, hole: true }],
    }));
  });

  it('applies translation transform', () => {
    const mesh = buildScene({
      shapes: [{ type: 'box', params: { w: 1, h: 1, d: 1 }, transform: { px: 100 } }],
    });
    // First vertex of box is at origin; translated +100 in X.
    assert.equal(mesh.positions[0], 100);
  });

  it('applies scale transform', () => {
    const mesh = buildScene({
      shapes: [{ type: 'box', params: { w: 1, h: 1, d: 1 }, transform: { sx: 5, sy: 5, sz: 5 } }],
    });
    // Box vertex 1 is at (1,0,0); scaled by 5 → (5,0,0).
    assert.equal(mesh.positions[3], 5);
  });

  it('applies 90-degree rotation around Z', () => {
    const mesh = buildScene({
      shapes: [{
        type: 'box',
        params: { w: 1, h: 1, d: 1 },
        transform: { rz: Math.PI / 2 },
      }],
    });
    // Vertex (1,0,0) rotated 90° around Z → (0,1,0).
    assert.ok(Math.abs(mesh.positions[3]) < 1e-5);
    assert.ok(Math.abs(mesh.positions[4] - 1) < 1e-5);
  });
});

describe('scene-builder: defaultScene', () => {
  it('produces a valid scene', () => {
    const s = defaultScene();
    assert.doesNotThrow(() => validateScene(s));
    assert.equal(s.shapes.length, 1);
  });
});

describe('scene-builder: _rotateXYZ', () => {
  it('identity rotation returns input', () => {
    const r = _internals._rotateXYZ(1, 2, 3, 0, 0, 0);
    assert.equal(r[0], 1); assert.equal(r[1], 2); assert.equal(r[2], 3);
  });
});
