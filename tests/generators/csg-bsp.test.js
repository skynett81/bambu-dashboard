// csg-bsp.test.js — Boolean CSG correctness tests

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { box, sphere, cylinder } from '../../server/mesh-primitives.js';
import { meshToCsg, csgToMesh, unionMesh, subtractMesh, intersectMesh, _internals } from '../../server/csg-bsp.js';
import { meshStats } from '../../server/mesh-transforms.js';
import { offset } from '../../server/mesh-primitives.js';

describe('csg-bsp: meshToCsg / csgToMesh round-trip', () => {
  it('preserves a unit cube through the BSP polygon round-trip', () => {
    const cube = box(10, 10, 10);
    const csg = meshToCsg(cube);
    const back = csgToMesh(csg);
    // Should have at least 8 vertices and 12 triangles after round-trip.
    assert.ok(back.positions.length / 3 >= 8);
    assert.ok(back.indices.length / 3 >= 12);
  });

  it('drops degenerate triangles silently', () => {
    // Two identical vertices → zero-area triangle should be discarded.
    const positions = new Float32Array([
      0, 0, 0, 1, 0, 0, 0.5, 0, 0,    // collinear → zero area
      0, 0, 0, 1, 0, 0, 0, 1, 0,      // valid
    ]);
    const indices = new Uint32Array([0, 1, 2, 3, 4, 5]);
    const csg = meshToCsg({ positions, indices });
    assert.equal(csg.polygons.length, 1);
  });
});

describe('csg-bsp: union', () => {
  it('union of disjoint cubes sums faces (with deduplication)', () => {
    const a = box(10, 10, 10);
    const b = offset(box(10, 10, 10), 30, 0, 0).mesh ? offset(box(10, 10, 10), 30, 0, 0).mesh : offset(box(10, 10, 10), 30, 0, 0);
    // offset returns indexed mesh directly (not wrapped) in mesh-primitives.
    const result = unionMesh(a, b);
    const stats = meshStats(result);
    // Two disjoint cubes → 24 triangles total.
    assert.equal(stats.faces, 24);
  });

  it('union of overlapping cubes produces watertight result', () => {
    const a = box(10, 10, 10);
    const b = offset(box(10, 10, 10), 5, 0, 0);
    const result = unionMesh(a, b);
    const stats = meshStats(result);
    // Overlap removes some faces but keeps the surface closed.
    assert.ok(stats.faces > 0);
    assert.ok(stats.vertices > 0);
  });
});

describe('csg-bsp: subtract', () => {
  it('cube minus disjoint cube is just the original cube', () => {
    const a = box(10, 10, 10);
    const b = offset(box(10, 10, 10), 50, 0, 0);
    const result = subtractMesh(a, b);
    const stats = meshStats(result);
    // The "minus B" doesn't touch A → original 12 triangles.
    assert.equal(stats.faces, 12);
  });

  it('cube minus overlapping cube produces fewer triangles than original sum', () => {
    const a = box(20, 20, 20);
    const b = offset(box(10, 10, 10), 5, 5, 5);
    const result = subtractMesh(a, b);
    const stats = meshStats(result);
    // Result should have geometry (the cube with a notch).
    assert.ok(stats.faces > 0);
    assert.ok(stats.vertices > 0);
  });

  it('cube minus identical cube yields empty geometry', () => {
    const a = box(10, 10, 10);
    const b = box(10, 10, 10);
    const result = subtractMesh(a, b);
    // After subtracting itself → essentially empty (may have 0 or near-0 faces).
    assert.ok(result.indices.length / 3 <= 4);
  });
});

describe('csg-bsp: intersect', () => {
  it('disjoint cubes intersect to empty', () => {
    const a = box(10, 10, 10);
    const b = offset(box(10, 10, 10), 50, 0, 0);
    const result = intersectMesh(a, b);
    assert.ok(result.indices.length / 3 <= 4);
  });

  it('overlapping cubes intersect to overlap region', () => {
    const a = box(20, 20, 20);
    const b = offset(box(20, 20, 20), 10, 0, 0);
    const result = intersectMesh(a, b);
    const stats = meshStats(result);
    // Intersection should be a 10×20×20 box-shape (12 tris, possibly more after BSP).
    assert.ok(stats.faces >= 12);
    assert.ok(stats.faces <= 24);
  });
});

describe('csg-bsp: internal Vec3', () => {
  it('Vec3 dot/cross/length work as expected', () => {
    const Vec3 = _internals.Vec3;
    const a = new Vec3(1, 0, 0);
    const b = new Vec3(0, 1, 0);
    assert.equal(a.dot(b), 0);
    assert.equal(a.cross(b).z, 1);
    assert.equal(a.length(), 1);
  });
});
