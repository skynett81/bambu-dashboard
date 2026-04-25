// stl-analyzer.test.js — verify STL parsing + geometric analysis on
// synthetic shapes (cube, pyramid, single triangle).

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { parseStl, analyzeStl } from '../../server/stl-analyzer.js';

// Build a binary STL buffer for a list of triangles.
// Each triangle = 9 floats [n.x,n.y,n.z, v1, v2, v3] given as [n, v1, v2, v3].
function _binaryStl(tris) {
  const buf = Buffer.alloc(80 + 4 + tris.length * 50);
  buf.write('TestSTL', 0); // header
  buf.writeUInt32LE(tris.length, 80);
  let off = 84;
  for (const t of tris) {
    for (let i = 0; i < 12; i++) {
      buf.writeFloatLE(t[i], off);
      off += 4;
    }
    buf.writeUInt16LE(0, off); off += 2;
  }
  return buf;
}

// 12 triangles forming a 10mm cube centred on origin.
const CUBE_TRIS = [
  // bottom (z=0, normal -z)
  [0, 0, -1,  0, 0, 0,  10, 0, 0,  10, 10, 0],
  [0, 0, -1,  0, 0, 0,  10, 10, 0,  0, 10, 0],
  // top (z=10, normal +z)
  [0, 0, 1,  0, 0, 10,  10, 10, 10,  10, 0, 10],
  [0, 0, 1,  0, 0, 10,  0, 10, 10,  10, 10, 10],
  // front (y=0, normal -y)
  [0, -1, 0,  0, 0, 0,  10, 0, 10,  10, 0, 0],
  [0, -1, 0,  0, 0, 0,  0, 0, 10,  10, 0, 10],
  // back (y=10)
  [0, 1, 0,  0, 10, 0,  10, 10, 0,  10, 10, 10],
  [0, 1, 0,  0, 10, 0,  10, 10, 10,  0, 10, 10],
  // left (x=0)
  [-1, 0, 0,  0, 0, 0,  0, 10, 0,  0, 10, 10],
  [-1, 0, 0,  0, 0, 0,  0, 10, 10,  0, 0, 10],
  // right (x=10)
  [1, 0, 0,  10, 0, 0,  10, 0, 10,  10, 10, 10],
  [1, 0, 0,  10, 0, 0,  10, 10, 10,  10, 10, 0],
];

describe('parseStl()', () => {
  it('parses binary STL', () => {
    const buf = _binaryStl(CUBE_TRIS);
    const r = parseStl(buf);
    assert.equal(r.format, 'binary');
    assert.equal(r.count, 12);
    assert.equal(r.triangles.length, 144);
  });

  it('parses ASCII STL', () => {
    const ascii = `solid cube
facet normal 0 0 -1
  outer loop
    vertex 0 0 0
    vertex 10 0 0
    vertex 10 10 0
  endloop
endfacet
endsolid cube`;
    const r = parseStl(Buffer.from(ascii, 'utf8'));
    assert.equal(r.format, 'ascii');
    assert.equal(r.count, 1);
  });

  it('throws on too-short buffer', () => {
    assert.throws(() => parseStl(Buffer.alloc(10)));
  });
});

describe('analyzeStl() — cube', () => {
  it('reports correct bounding box and dimensions', () => {
    const r = analyzeStl(_binaryStl(CUBE_TRIS));
    assert.deepEqual(r.bbox.min, [0, 0, 0]);
    assert.deepEqual(r.bbox.max, [10, 10, 10]);
    assert.deepEqual(r.bbox.sizeMm, [10, 10, 10]);
  });

  it('reports volume close to 1000 mm³ (= 1 cm³)', () => {
    const r = analyzeStl(_binaryStl(CUBE_TRIS));
    assert.ok(Math.abs(r.volumeCm3 - 1) < 0.01, `volume should be ~1 cm³, got ${r.volumeCm3}`);
  });

  it('reports surface area close to 600 mm² (6 × 10×10 faces)', () => {
    const r = analyzeStl(_binaryStl(CUBE_TRIS));
    assert.ok(Math.abs(r.surfaceAreaMm2 - 600) < 0.01);
  });

  it('overhang fraction is ~1/6 of total area (the bottom face)', () => {
    const r = analyzeStl(_binaryStl(CUBE_TRIS));
    assert.ok(r.overhang.fraction > 0.15 && r.overhang.fraction < 0.20,
      `overhang fraction should be ~0.166, got ${r.overhang.fraction}`);
    // 0.166 falls in the "heavy" bucket (< 0.30, ≥ 0.15).
    assert.equal(r.overhang.label, 'heavy');
  });

  it('mesh is closed manifold (Euler = 2)', () => {
    const r = analyzeStl(_binaryStl(CUBE_TRIS));
    assert.equal(r.integrity.eulerNumber, 2);
    assert.equal(r.integrity.isManifold, true);
    assert.equal(r.integrity.openEdges, 0);
  });

  it('reports orientation suggestions sorted ascending', () => {
    const r = analyzeStl(_binaryStl(CUBE_TRIS));
    assert.ok(r.orientationSuggestions.length >= 6);
    for (let i = 1; i < r.orientationSuggestions.length; i++) {
      assert.ok(
        r.orientationSuggestions[i].overhangFraction >= r.orientationSuggestions[i - 1].overhangFraction,
      );
    }
  });
});

describe('analyzeStl() — pyramid (severe overhang)', () => {
  it('detects high overhang fraction on inverted pyramid', () => {
    // Inverted pyramid: tip at z=0, base at z=10. Slanted faces ≈ 45° from vertical
    // = 45° from horizontal → trips the threshold for one face.
    const tris = [
      [0, 0, -1,  0, 0, 0,  10, 10, 0,  10, 0, 0], // base bottom
      [0, 0, -1,  0, 0, 0,  0, 10, 0,  10, 10, 0],
      // 4 slanted faces pointing up-and-out — these are NOT overhangs
      [0.7, 0, 0.7,  10, 0, 0,  10, 10, 0,  5, 5, 10],
      [-0.7, 0, 0.7,  0, 0, 0,  5, 5, 10,  0, 10, 0],
      [0, 0.7, 0.7,  0, 10, 0,  5, 5, 10,  10, 10, 0],
      [0, -0.7, 0.7,  0, 0, 0,  10, 0, 0,  5, 5, 10],
    ];
    const r = analyzeStl(_binaryStl(tris));
    // Bottom face is the overhang here
    assert.ok(r.overhang.fraction > 0);
    assert.ok(r.bbox.sizeMm[2] === 10);
  });
});

describe('Empty STL', () => {
  it('rejects zero-triangle file', () => {
    const buf = _binaryStl([]);
    assert.throws(() => analyzeStl(buf), /no triangles/);
  });
});
