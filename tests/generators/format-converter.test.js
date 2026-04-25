// format-converter.test.js — Round-trip tests for STL and OBJ converters
// (3MF requires lib3mf WASM and is exercised end-to-end via the API)

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  detectFormat,
  stlBufferToMesh,
  meshToStlBuffer,
  objBufferToMesh,
  meshToObjString
} from '../../server/format-converter.js';

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

describe('format-converter: detectFormat', () => {
  it('detects format from filename hint', () => {
    assert.equal(detectFormat(Buffer.from([0x50, 0x4B, 1, 2]), 'a.3mf'), '3mf');
    assert.equal(detectFormat(Buffer.from('solid x'), 'a.stl'), 'stl');
    assert.equal(detectFormat(Buffer.from('v 1 2 3\nf 1 2 3\n'), 'a.obj'), 'obj');
  });

  it('detects 3MF from PK magic', () => {
    const buf = Buffer.alloc(100);
    buf[0] = 0x50; buf[1] = 0x4B;
    assert.equal(detectFormat(buf), '3mf');
  });

  it('detects ASCII STL by header', () => {
    assert.equal(detectFormat(Buffer.from('solid abc\nfacet normal 0 0 1\n')), 'stl');
  });

  it('detects OBJ heuristically', () => {
    const text = '# OBJ file\nv 0 0 0\nv 1 0 0\nv 0 1 0\nf 1 2 3\n';
    assert.equal(detectFormat(Buffer.from(text)), 'obj');
  });
});

describe('format-converter: STL round-trip', () => {
  it('writes a binary STL and reads it back to a mesh with same face count', () => {
    const mesh = unitCube();
    const stl = meshToStlBuffer(mesh);
    // Binary STL header is 80 bytes; uint32 at offset 80 is triangle count.
    assert.equal(stl.readUInt32LE(80), 12);
    const back = stlBufferToMesh(stl);
    assert.equal(back.indices.length, 36);
    // Vertices should dedupe back down to 8.
    assert.equal(back.positions.length / 3, 8);
  });
});

describe('format-converter: OBJ round-trip', () => {
  it('writes OBJ and reads it back', () => {
    const mesh = unitCube();
    const obj = meshToObjString(mesh);
    assert.match(obj, /^v 0\.000000 0\.000000 0\.000000$/m);
    assert.match(obj, /^f \d+ \d+ \d+$/m);
    const back = objBufferToMesh(obj);
    assert.equal(back.positions.length / 3, 8);
    assert.equal(back.indices.length, 36);
  });

  it('handles negative (relative) face indices', () => {
    const obj = `v 0 0 0\nv 1 0 0\nv 0 1 0\nf -3 -2 -1\n`;
    const back = objBufferToMesh(obj);
    assert.equal(back.positions.length / 3, 3);
    assert.equal(back.indices.length, 3);
    assert.equal(back.indices[0], 0);
  });

  it('triangulates quad faces into two triangles', () => {
    const obj = `v 0 0 0\nv 1 0 0\nv 1 1 0\nv 0 1 0\nf 1 2 3 4\n`;
    const back = objBufferToMesh(obj);
    assert.equal(back.indices.length, 6);
  });
});
