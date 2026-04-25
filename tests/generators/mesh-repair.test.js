// mesh-repair.test.js — Unit tests for mesh-repair toolkit
//
// Builds small synthetic meshes, runs each repair, and asserts on the
// resulting topology. No printer or DB dependencies.

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  dedupeVertices,
  removeDegenerateTriangles,
  fixWinding,
  closeHoles,
  autoRepair,
  analyzeMesh
} from '../../server/mesh-repair.js';

// Cube with duplicated vertices (8 corners stored 3× by face) ─ STL-style.
function dirtyCube() {
  const corners = [
    [0, 0, 0], [1, 0, 0], [1, 1, 0], [0, 1, 0],
    [0, 0, 1], [1, 0, 1], [1, 1, 1], [0, 1, 1]
  ];
  const faces = [
    [0, 2, 1], [0, 3, 2],
    [4, 5, 6], [4, 6, 7],
    [0, 1, 5], [0, 5, 4],
    [2, 3, 7], [2, 7, 6],
    [1, 2, 6], [1, 6, 5],
    [0, 4, 7], [0, 7, 3]
  ];
  // Inflate to STL-style — each face gets its own 3 vertices.
  const positions = [];
  const indices = [];
  for (const [a, b, c] of faces) {
    const ia = positions.length / 3; for (const v of corners[a]) positions.push(v);
    const ib = positions.length / 3; for (const v of corners[b]) positions.push(v);
    const ic = positions.length / 3; for (const v of corners[c]) positions.push(v);
    indices.push(ia, ib, ic);
  }
  return {
    positions: new Float32Array(positions),
    indices: new Uint32Array(indices)
  };
}

describe('mesh-repair: dedupeVertices', () => {
  it('collapses STL-style duplicated cube down to 8 unique vertices', () => {
    const mesh = dirtyCube();
    const before = mesh.positions.length / 3;
    const result = dedupeVertices(mesh);
    assert.equal(before, 36);
    assert.equal(result.mesh.positions.length / 3, 8);
    assert.equal(result.mesh.indices.length, mesh.indices.length);
    assert.equal(result.report.verticesOut, 8);
    assert.equal(result.report.collapsed, 28);
  });

  it('returns identical structure for already-clean mesh', () => {
    const positions = new Float32Array([0, 0, 0, 1, 0, 0, 0, 1, 0]);
    const indices = new Uint32Array([0, 1, 2]);
    const result = dedupeVertices({ positions, indices });
    assert.equal(result.mesh.positions.length / 3, 3);
    assert.equal(result.report.collapsed, 0);
  });
});

describe('mesh-repair: removeDegenerateTriangles', () => {
  it('drops zero-area collapsed triangle', () => {
    const positions = new Float32Array([
      0, 0, 0, 1, 0, 0, 0.5, 0, 0,    // collinear — area zero
      0, 0, 0, 1, 0, 0, 0.5, 1, 0     // valid
    ]);
    const indices = new Uint32Array([0, 1, 2, 3, 4, 5]);
    const result = removeDegenerateTriangles({ positions, indices });
    assert.equal(result.mesh.indices.length / 3, 1);
    assert.equal(result.report.removed, 1);
  });
});

describe('mesh-repair: fixWinding', () => {
  it('runs without error on a cube and reports component count', () => {
    const cube = dedupeVertices(dirtyCube()).mesh;
    const result = fixWinding(cube);
    assert.ok(result.mesh.positions.length === cube.positions.length);
    assert.ok('components' in result.report);
    assert.ok('componentsFlipped' in result.report);
  });
});

describe('mesh-repair: closeHoles', () => {
  it('closes a single boundary hole on an open mesh', () => {
    // Triangle with 1 face → 3 boundary edges; closing should add at least 1
    // triangle (fan of one edge from centroid).
    const positions = new Float32Array([
      0, 0, 0, 1, 0, 0, 0.5, 1, 0
    ]);
    const indices = new Uint32Array([0, 1, 2]);
    const result = closeHoles({ positions, indices });
    assert.ok(result.mesh.indices.length / 3 >= 1);
    assert.ok('trianglesAdded' in result.report);
    assert.ok('holesClosed' in result.report);
  });
});

describe('mesh-repair: autoRepair', () => {
  it('runs full pipeline and returns step-by-step report', () => {
    const mesh = dirtyCube();
    const result = autoRepair(mesh);
    assert.ok(result.report.dedupe);
    assert.ok(result.report.degenerate);
    assert.ok(result.report.winding);
    assert.ok(result.report.holes);
    // Cube should reduce 36 → 8 vertices after dedup.
    assert.equal(result.mesh.positions.length / 3, 8);
  });

  it('respects ops opt-out', () => {
    const mesh = dirtyCube();
    const result = autoRepair(mesh, { ops: ['dedupe'] });
    assert.ok(result.report.dedupe);
    assert.ok(!result.report.holes);
    assert.ok(!result.report.winding);
  });
});

describe('mesh-repair: analyzeMesh', () => {
  it('reports duplicates and boundary edges for dirty cube', () => {
    const mesh = dirtyCube();
    const a = analyzeMesh(mesh);
    assert.equal(a.faces, 12);
    assert.ok(a.duplicateVertices > 0);
    assert.equal(a.isClean, false);
  });

  it('reports zero duplicate vertices after autoRepair', () => {
    const repaired = autoRepair(dirtyCube()).mesh;
    const a = analyzeMesh(repaired);
    assert.equal(a.duplicateVertices, 0);
  });
});
