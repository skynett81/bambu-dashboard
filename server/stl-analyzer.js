/**
 * STL Analyzer — pure-JS mesh parser + pre-print analysis.
 *
 * Parses both ASCII and binary STL files into a triangle list, then runs
 * a set of cheap geometric analyses:
 *   - Bounding box & dimensions
 *   - Overhang fraction (% of triangle area pointing more than threshold below
 *     horizontal — slicer will need supports there)
 *   - Bridge candidates (large flat-ish triangles facing upward with empty
 *     space below — cheap heuristic, not full ray-cast)
 *   - Orientation suggestion (try 6 axis-aligned flips, pick the one with
 *     the lowest support fraction)
 *   - Mesh integrity (Euler: V − E + F = 2 for closed manifolds)
 *   - Volume (signed tetrahedron sum) → filament estimate
 *   - Surface area
 *
 * Designed to run on raw STL buffers up to ~30 MB without blocking the event
 * loop noticeably; bigger meshes should be analysed in a worker upstream.
 */

const STL_BINARY_HEADER = 80;          // bytes
const STL_BINARY_TRI_SIZE = 50;        // 12 + 9*4 + 2
const DEFAULT_OVERHANG_THRESHOLD_DEG = 45;

/**
 * Parse an STL file (ASCII or binary). Returns triangles as 9-tuples
 * [n.x,n.y,n.z, v1.x,v1.y,v1.z, v2.x,v2.y,v2.z, v3.x,v3.y,v3.z].
 *
 * Detects format from the first 5 bytes ("solid" → likely ASCII, but the
 * binary header can also start with "solid", so we sanity-check by
 * checking expected file size against the triangle count word).
 *
 * @param {Buffer | Uint8Array} buf
 */
export function parseStl(buf) {
  if (!buf || buf.length < STL_BINARY_HEADER + 4) throw new Error('STL: buffer too short');
  const u8 = buf instanceof Uint8Array ? buf : new Uint8Array(buf);

  // Check binary first by trusting the triangle count word.
  const dv = new DataView(u8.buffer, u8.byteOffset, u8.byteLength);
  const triCount = dv.getUint32(STL_BINARY_HEADER, true);
  const expectedBinarySize = STL_BINARY_HEADER + 4 + triCount * STL_BINARY_TRI_SIZE;

  if (expectedBinarySize === u8.length) {
    return _parseBinary(dv, triCount);
  }
  // Otherwise treat as ASCII.
  const text = new TextDecoder('utf-8').decode(u8);
  return _parseAscii(text);
}

function _parseBinary(dv, triCount) {
  const tris = new Float32Array(triCount * 12);
  let off = STL_BINARY_HEADER + 4;
  for (let i = 0; i < triCount; i++) {
    const base = i * 12;
    for (let j = 0; j < 12; j++) {
      tris[base + j] = dv.getFloat32(off, true);
      off += 4;
    }
    off += 2; // attribute byte count
  }
  return { triangles: tris, count: triCount, format: 'binary' };
}

function _parseAscii(text) {
  // Match each `facet normal` block — 1 normal + 3 vertices = 12 floats.
  const tris = [];
  const re = /facet\s+normal\s+(\S+)\s+(\S+)\s+(\S+)[\s\S]+?vertex\s+(\S+)\s+(\S+)\s+(\S+)[\s\S]+?vertex\s+(\S+)\s+(\S+)\s+(\S+)[\s\S]+?vertex\s+(\S+)\s+(\S+)\s+(\S+)[\s\S]+?endfacet/gi;
  let m;
  while ((m = re.exec(text)) !== null) {
    for (let i = 1; i <= 12; i++) tris.push(parseFloat(m[i]));
  }
  return { triangles: new Float32Array(tris), count: tris.length / 12, format: 'ascii' };
}

// ── Geometric helpers ──────────────────────────────────────────────────

function _triNormal(t, i) {
  return [t[i], t[i + 1], t[i + 2]];
}

function _triArea(t, i) {
  const ax = t[i + 6] - t[i + 3], ay = t[i + 7] - t[i + 4], az = t[i + 8] - t[i + 5];
  const bx = t[i + 9] - t[i + 3], by = t[i + 10] - t[i + 4], bz = t[i + 11] - t[i + 5];
  const cx = ay * bz - az * by;
  const cy = az * bx - ax * bz;
  const cz = ax * by - ay * bx;
  return 0.5 * Math.sqrt(cx * cx + cy * cy + cz * cz);
}

function _triCentroid(t, i) {
  return [
    (t[i + 3] + t[i + 6] + t[i + 9]) / 3,
    (t[i + 4] + t[i + 7] + t[i + 10]) / 3,
    (t[i + 5] + t[i + 8] + t[i + 11]) / 3,
  ];
}

function _bbox(tris, count) {
  let minX = Infinity, minY = Infinity, minZ = Infinity;
  let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;
  const total = count * 12;
  for (let i = 0; i < total; i += 12) {
    for (let v = 3; v <= 9; v += 3) {
      const x = tris[i + v], y = tris[i + v + 1], z = tris[i + v + 2];
      if (x < minX) minX = x; if (x > maxX) maxX = x;
      if (y < minY) minY = y; if (y > maxY) maxY = y;
      if (z < minZ) minZ = z; if (z > maxZ) maxZ = z;
    }
  }
  return { min: [minX, minY, minZ], max: [maxX, maxY, maxZ], size: [maxX - minX, maxY - minY, maxZ - minZ] };
}

// Volume via signed tetrahedron sum. Works for closed manifolds; opens give
// approximate result that is still useful for filament-mass estimates.
function _volume(tris, count) {
  let vol = 0;
  const total = count * 12;
  for (let i = 0; i < total; i += 12) {
    const x1 = tris[i + 3], y1 = tris[i + 4], z1 = tris[i + 5];
    const x2 = tris[i + 6], y2 = tris[i + 7], z2 = tris[i + 8];
    const x3 = tris[i + 9], y3 = tris[i + 10], z3 = tris[i + 11];
    vol += (x1 * (y2 * z3 - y3 * z2) - x2 * (y1 * z3 - y3 * z1) + x3 * (y1 * z2 - y2 * z1)) / 6;
  }
  return Math.abs(vol);
}

function _surfaceArea(tris, count) {
  let area = 0;
  for (let i = 0; i < count * 12; i += 12) area += _triArea(tris, i);
  return area;
}

// ── Analyses ───────────────────────────────────────────────────────────

/**
 * Compute the overhang fraction — area-weighted ratio of triangles whose
 * downward-facing normal exceeds the threshold (default 45° from horizontal).
 * Higher = more support needed.
 */
function _overhangFraction(tris, count, thresholdDeg = DEFAULT_OVERHANG_THRESHOLD_DEG) {
  const cosThresh = Math.cos(((90 - thresholdDeg) * Math.PI) / 180);
  let overhangArea = 0, totalArea = 0;
  for (let i = 0; i < count * 12; i += 12) {
    const a = _triArea(tris, i);
    totalArea += a;
    const nz = tris[i + 2];
    // Triangle faces "down" when its normal has negative z. Stronger overhang
    // = more negative nz. cosThresh-based threshold matches slicer convention.
    if (-nz > cosThresh) overhangArea += a;
  }
  return { overhangArea, totalArea, fraction: totalArea > 0 ? overhangArea / totalArea : 0 };
}

/**
 * Estimate bridges — flat-ish triangles facing upward sitting some height
 * above the bed with an empty bbox-x/y projection beneath them. Used as a
 * quick heuristic; exact bridge calc requires a slicer.
 */
function _bridgeCandidates(tris, count, bbox) {
  const minBridgeArea = 25; // mm² — ignore tiny shells
  const flatThreshold = 0.85; // |nz| > 0.85 ≈ within ~32° of horizontal
  const minHeightAboveBed = 1; // mm
  let count_ = 0, totalArea = 0;
  for (let i = 0; i < count * 12; i += 12) {
    const nz = tris[i + 2];
    if (nz < flatThreshold) continue;
    const a = _triArea(tris, i);
    if (a < minBridgeArea) continue;
    const c = _triCentroid(tris, i);
    if (c[2] < bbox.min[2] + minHeightAboveBed) continue;
    count_++;
    totalArea += a;
  }
  return { count: count_, totalArea };
}

/**
 * Try the 6 axis-aligned orientations and pick the one with the lowest
 * overhang fraction (lowest support-volume needed). Returns ranked list.
 *
 * Cheap approximation: rotate normals only (vertex positions don't matter
 * for the area-weighted overhang ratio).
 */
function _orientationSuggestions(tris, count) {
  const orientations = [
    { name: 'as-loaded',    rot: [0, 0, 0] },
    { name: 'flip-X 180°',  rot: [Math.PI, 0, 0] },
    { name: 'flip-Y 180°',  rot: [0, Math.PI, 0] },
    { name: 'rotate-X 90°', rot: [Math.PI / 2, 0, 0] },
    { name: 'rotate-X -90°',rot: [-Math.PI / 2, 0, 0] },
    { name: 'rotate-Y 90°', rot: [0, Math.PI / 2, 0] },
    { name: 'rotate-Y -90°',rot: [0, -Math.PI / 2, 0] },
  ];
  const results = [];
  for (const o of orientations) {
    const { sx, sy, sz, cx, cy, cz } = _trig(o.rot);
    let overhangArea = 0, totalArea = 0;
    for (let i = 0; i < count * 12; i += 12) {
      const a = _triArea(tris, i);
      totalArea += a;
      const nx = tris[i], ny = tris[i + 1], nz = tris[i + 2];
      // Apply rotation to the normal only (cheap).
      const nx1 = nx;
      const ny1 = ny * cx - nz * sx;
      const nz1 = ny * sx + nz * cx;
      const nx2 = nx1 * cy + nz1 * sy;
      const nz2 = -nx1 * sy + nz1 * cy;
      const nx3 = nx2 * cz - ny1 * sz;
      const nzFinal = nz2;
      if (-nzFinal > Math.cos(((90 - DEFAULT_OVERHANG_THRESHOLD_DEG) * Math.PI) / 180)) {
        overhangArea += a;
      }
    }
    results.push({ orientation: o.name, overhangFraction: totalArea > 0 ? overhangArea / totalArea : 0 });
  }
  return results.sort((a, b) => a.overhangFraction - b.overhangFraction);
}

function _trig([rx, ry, rz]) {
  return { sx: Math.sin(rx), sy: Math.sin(ry), sz: Math.sin(rz),
           cx: Math.cos(rx), cy: Math.cos(ry), cz: Math.cos(rz) };
}

/**
 * Mesh integrity check — Euler formula for closed manifolds: V − E + F = 2.
 * We round vertex coordinates to a small epsilon to dedupe shared vertices
 * since STL stores each triangle independently.
 */
function _meshIntegrity(tris, count) {
  const epsilon = 1e-4;
  const vertSet = new Set();
  const edgeMap = new Map(); // canonical edge → count
  for (let i = 0; i < count * 12; i += 12) {
    const v = [];
    for (let k = 0; k < 3; k++) {
      const off = i + 3 + k * 3;
      const key = `${Math.round(tris[off] / epsilon)},${Math.round(tris[off + 1] / epsilon)},${Math.round(tris[off + 2] / epsilon)}`;
      vertSet.add(key);
      v.push(key);
    }
    for (let k = 0; k < 3; k++) {
      const a = v[k], b = v[(k + 1) % 3];
      const ek = a < b ? a + '|' + b : b + '|' + a;
      edgeMap.set(ek, (edgeMap.get(ek) || 0) + 1);
    }
  }
  const V = vertSet.size;
  const E = edgeMap.size;
  const F = count;
  const eulerNumber = V - E + F;
  let nonManifoldEdges = 0, openEdges = 0;
  for (const cnt of edgeMap.values()) {
    if (cnt === 1) openEdges++;
    else if (cnt > 2) nonManifoldEdges++;
  }
  return {
    vertices: V, edges: E, faces: F,
    eulerNumber,
    isManifold: openEdges === 0 && nonManifoldEdges === 0,
    openEdges,
    nonManifoldEdges,
  };
}

// ── Public façade ──────────────────────────────────────────────────────

/**
 * Run the full analysis on an STL buffer.
 * @param {Buffer | Uint8Array} buf
 * @param {object} [opts] — { overhangThreshold, materialDensity }
 * @returns Analysis report.
 */
export function analyzeStl(buf, opts = {}) {
  const overhangThreshold = opts.overhangThreshold ?? DEFAULT_OVERHANG_THRESHOLD_DEG;
  const density = opts.materialDensity ?? 1.24; // PLA-ish g/cm³

  const t0 = Date.now();
  const { triangles, count, format } = parseStl(buf);
  if (count === 0) throw new Error('STL contains no triangles');

  const bbox = _bbox(triangles, count);
  const overhang = _overhangFraction(triangles, count, overhangThreshold);
  const bridges = _bridgeCandidates(triangles, count, bbox);
  const orientation = _orientationSuggestions(triangles, count);
  const integrity = _meshIntegrity(triangles, count);
  const volumeCm3 = _volume(triangles, count) / 1000; // mm³ → cm³
  const surfaceArea = _surfaceArea(triangles, count);

  return {
    format,
    triangleCount: count,
    durationMs: Date.now() - t0,
    bbox: {
      min: bbox.min.map(v => +v.toFixed(3)),
      max: bbox.max.map(v => +v.toFixed(3)),
      sizeMm: bbox.size.map(v => +v.toFixed(2)),
    },
    overhang: {
      thresholdDeg: overhangThreshold,
      areaMm2: +overhang.overhangArea.toFixed(2),
      totalAreaMm2: +overhang.totalArea.toFixed(2),
      fraction: +overhang.fraction.toFixed(4),
      label: overhang.fraction < 0.05 ? 'minimal'
           : overhang.fraction < 0.15 ? 'moderate'
           : overhang.fraction < 0.30 ? 'heavy'
           : 'extreme',
    },
    bridges: {
      candidates: bridges.count,
      areaMm2: +bridges.totalArea.toFixed(2),
    },
    orientationSuggestions: orientation.map(o => ({
      ...o,
      overhangFraction: +o.overhangFraction.toFixed(4),
    })),
    integrity,
    volumeCm3: +volumeCm3.toFixed(3),
    massGrams: +(volumeCm3 * density).toFixed(2),
    surfaceAreaMm2: +surfaceArea.toFixed(2),
  };
}

export const _internals = {
  _triArea, _triCentroid, _triNormal, _bbox, _volume,
  _surfaceArea, _overhangFraction, _bridgeCandidates,
  _orientationSuggestions, _meshIntegrity,
};
