// mesh-transforms.test.js — Unit tests for mesh-transforms toolkit

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  decimate,
  smooth,
  hollow,
  splitComponents,
  scale,
  translate,
  recenterToOrigin,
  meshStats
} from '../../server/mesh-transforms.js';

// Cube made of 8 unique vertices and 12 faces.
function unitCube() {
  const positions = new Float32Array([
    0, 0, 0, 1, 0, 0, 1, 1, 0, 0, 1, 0,
    0, 0, 1, 1, 0, 1, 1, 1, 1, 0, 1, 1
  ]);
  const indices = new Uint32Array([
    0, 2, 1, 0, 3, 2,
    4, 5, 6, 4, 6, 7,
    0, 1, 5, 0, 5, 4,
    2, 3, 7, 2, 7, 6,
    1, 2, 6, 1, 6, 5,
    0, 4, 7, 0, 7, 3
  ]);
  return { positions, indices };
}

// Two disconnected cubes (test split-components).
function twoCubes() {
  const a = unitCube();
  const b = unitCube();
  // Translate the second cube far away.
  for (let i = 0; i < b.positions.length; i += 3) b.positions[i] += 10;
  const positions = new Float32Array(a.positions.length + b.positions.length);
  positions.set(a.positions, 0);
  positions.set(b.positions, a.positions.length);
  const offset = a.positions.length / 3;
  const indices = new Uint32Array(a.indices.length + b.indices.length);
  indices.set(a.indices, 0);
  for (let i = 0; i < b.indices.length; i++) indices[a.indices.length + i] = b.indices[i] + offset;
  return { positions, indices };
}

describe('mesh-transforms: decimate', () => {
  it('reduces vertex count when targetRatio < 1', () => {
    const cube = unitCube();
    const result = decimate(cube, 0.3);
    assert.ok(result.mesh.positions.length / 3 <= cube.positions.length / 3);
    assert.ok(result.report.facesAfter <= result.report.facesBefore);
  });

  it('leaves mesh unchanged when ratio = 1', () => {
    const cube = unitCube();
    const result = decimate(cube, 1.0);
    assert.equal(result.mesh.positions.length / 3, cube.positions.length / 3);
  });
});

describe('mesh-transforms: smooth', () => {
  it('preserves vertex/face count and runs without error', () => {
    const cube = unitCube();
    const result = smooth(cube, 2, 0.3);
    assert.equal(result.mesh.positions.length, cube.positions.length);
    assert.equal(result.mesh.indices.length, cube.indices.length);
  });
});

describe('mesh-transforms: hollow', () => {
  it('doubles face and vertex counts to create inner shell', () => {
    const cube = unitCube();
    const result = hollow(cube, 0.2);
    assert.equal(result.mesh.indices.length, cube.indices.length * 2);
    assert.equal(result.mesh.positions.length, cube.positions.length * 2);
    assert.ok(result.report.estimatedMassReduction > 0);
    assert.ok(result.report.estimatedMassReduction < 1);
  });
});

describe('mesh-transforms: splitComponents', () => {
  it('returns a single mesh for connected input', () => {
    const cube = unitCube();
    const result = splitComponents(cube);
    assert.equal(result.report.components, 1);
    assert.equal(result.meshes.length, 1);
  });

  it('splits two disconnected cubes correctly', () => {
    const result = splitComponents(twoCubes());
    assert.equal(result.report.components, 2);
    assert.equal(result.meshes.length, 2);
    assert.ok(result.meshes[0].positions.length > 0);
    assert.ok(result.meshes[1].positions.length > 0);
  });
});

describe('mesh-transforms: scale & translate', () => {
  it('scales uniformly when given a single factor', () => {
    const cube = unitCube();
    const result = scale(cube, 2);
    const stats = meshStats(result.mesh);
    assert.equal(stats.bbox.size[0], 2);
    assert.equal(stats.bbox.size[1], 2);
  });

  it('translates mesh', () => {
    const cube = unitCube();
    const result = translate(cube, [5, 0, 0]);
    const stats = meshStats(result.mesh);
    assert.equal(stats.bbox.min[0], 5);
  });

  it('recenterToOrigin places min corner at origin', () => {
    const cube = unitCube();
    const moved = translate(cube, [10, 10, 10]).mesh;
    const result = recenterToOrigin(moved);
    const stats = meshStats(result.mesh);
    assert.equal(stats.bbox.min[0], 0);
    assert.equal(stats.bbox.min[1], 0);
    assert.equal(stats.bbox.min[2], 0);
  });
});

describe('mesh-transforms: meshStats', () => {
  it('reports correct stats for unit cube', () => {
    const stats = meshStats(unitCube());
    assert.equal(stats.vertices, 8);
    assert.equal(stats.faces, 12);
    assert.equal(stats.bbox.size[0], 1);
    assert.ok(stats.surfaceAreaMm2 > 5.99 && stats.surfaceAreaMm2 < 6.01);
  });
});
