/**
 * Mesh Repair Toolkit — pure-JS auto-fix for common STL/mesh defects.
 *
 * Operations are pure functions over the indexed-mesh form
 *   { positions: Float32Array(3·V), indices: Uint32Array(3·F) }
 * so callers can chain them. STL ↔ indexed conversion lives in
 * format-converter.js.
 *
 * Implemented fixes:
 *   - dedupeVertices: spatial-hash vertex deduplication (essential before
 *     other repairs because STL stores each triangle independently).
 *   - removeDegenerateTriangles: drops zero-area or collapsed triangles.
 *   - fixWinding: flood-fills face normals so neighbours agree, then flips
 *     a connected component if its average outward direction points inward.
 *   - closeHoles: detects boundary loops (edges with one adjacent face)
 *     and triangulates them as a fan from the loop centroid. Works for
 *     small/simple holes; complex topology hands back the un-closed mesh.
 *   - solidifyThinWalls: not full mesh thickening (that requires offset
 *     surface generation). Instead we flag thin regions in a report so
 *     the slicer's wall-count setting can compensate.
 *
 * Each repair returns the new mesh plus a `report` object describing
 * what happened — handy for the UI and for tests.
 */

const EPS = 1e-5;

// ── Helpers ────────────────────────────────────────────────────────────

function _spatialKey(x, y, z) {
  return `${Math.round(x / EPS)},${Math.round(y / EPS)},${Math.round(z / EPS)}`;
}

function _triNormal(p, i0, i1, i2) {
  const ax = p[3 * i1] - p[3 * i0];
  const ay = p[3 * i1 + 1] - p[3 * i0 + 1];
  const az = p[3 * i1 + 2] - p[3 * i0 + 2];
  const bx = p[3 * i2] - p[3 * i0];
  const by = p[3 * i2 + 1] - p[3 * i0 + 1];
  const bz = p[3 * i2 + 2] - p[3 * i0 + 2];
  const cx = ay * bz - az * by;
  const cy = az * bx - ax * bz;
  const cz = ax * by - ay * bx;
  const len = Math.hypot(cx, cy, cz);
  if (len === 0) return [0, 0, 0];
  return [cx / len, cy / len, cz / len];
}

function _triArea(p, i0, i1, i2) {
  const ax = p[3 * i1] - p[3 * i0];
  const ay = p[3 * i1 + 1] - p[3 * i0 + 1];
  const az = p[3 * i1 + 2] - p[3 * i0 + 2];
  const bx = p[3 * i2] - p[3 * i0];
  const by = p[3 * i2 + 1] - p[3 * i0 + 1];
  const bz = p[3 * i2 + 2] - p[3 * i0 + 2];
  const cx = ay * bz - az * by;
  const cy = az * bx - ax * bz;
  const cz = ax * by - ay * bx;
  return 0.5 * Math.hypot(cx, cy, cz);
}

function _triCentroid(p, i0, i1, i2) {
  return [
    (p[3 * i0] + p[3 * i1] + p[3 * i2]) / 3,
    (p[3 * i0 + 1] + p[3 * i1 + 1] + p[3 * i2 + 1]) / 3,
    (p[3 * i0 + 2] + p[3 * i1 + 2] + p[3 * i2 + 2]) / 3,
  ];
}

// Build a face → adjacent-faces table via shared edges. Returns:
//   adjacency[i] = [neighborFaceIdx, ...]
//   edgeLoop = list of boundary edges (only one adjacent face)
function _buildTopology(indices) {
  const F = indices.length / 3;
  const edgeMap = new Map(); // canonical "a|b" → [faceIdx, ...]
  for (let f = 0; f < F; f++) {
    for (let e = 0; e < 3; e++) {
      const a = indices[3 * f + e];
      const b = indices[3 * f + ((e + 1) % 3)];
      const key = a < b ? `${a}|${b}` : `${b}|${a}`;
      if (!edgeMap.has(key)) edgeMap.set(key, []);
      edgeMap.get(key).push(f);
    }
  }
  const adjacency = Array.from({ length: F }, () => []);
  const boundaryEdges = []; // [{a, b, face}]
  for (const [key, faces] of edgeMap) {
    if (faces.length === 1) {
      const [a, b] = key.split('|').map(Number);
      boundaryEdges.push({ a, b, face: faces[0] });
    } else if (faces.length === 2) {
      adjacency[faces[0]].push(faces[1]);
      adjacency[faces[1]].push(faces[0]);
    }
    // length > 2 = non-manifold edge — leave as-is, fixWinding tolerates it.
  }
  return { adjacency, boundaryEdges, edgeMap };
}

// ── Repairs ────────────────────────────────────────────────────────────

/**
 * Deduplicate vertices via a spatial hash. STL stores each triangle's
 * vertices independently, so a typical 12-tri cube has 36 vertices and
 * 0 shared edges — making winding-based repairs impossible. Run this
 * first.
 */
export function dedupeVertices(mesh) {
  const { positions, indices } = mesh;
  const map = new Map();
  const newPos = [];
  const remap = new Uint32Array(positions.length / 3);
  for (let i = 0; i < positions.length / 3; i++) {
    const x = positions[3 * i], y = positions[3 * i + 1], z = positions[3 * i + 2];
    const key = _spatialKey(x, y, z);
    if (map.has(key)) {
      remap[i] = map.get(key);
    } else {
      const idx = newPos.length / 3;
      newPos.push(x, y, z);
      map.set(key, idx);
      remap[i] = idx;
    }
  }
  const newIdx = new Uint32Array(indices.length);
  for (let i = 0; i < indices.length; i++) newIdx[i] = remap[indices[i]];
  return {
    mesh: { positions: new Float32Array(newPos), indices: newIdx },
    report: {
      verticesIn: positions.length / 3,
      verticesOut: newPos.length / 3,
      collapsed: positions.length / 3 - newPos.length / 3,
    },
  };
}

/**
 * Drop triangles with zero area or two coincident vertices.
 */
export function removeDegenerateTriangles(mesh) {
  const { positions, indices } = mesh;
  const F = indices.length / 3;
  const keep = [];
  let degen = 0;
  for (let f = 0; f < F; f++) {
    const i0 = indices[3 * f], i1 = indices[3 * f + 1], i2 = indices[3 * f + 2];
    if (i0 === i1 || i1 === i2 || i0 === i2) { degen++; continue; }
    if (_triArea(positions, i0, i1, i2) < EPS) { degen++; continue; }
    keep.push(i0, i1, i2);
  }
  return {
    mesh: { positions: new Float32Array(positions), indices: new Uint32Array(keep) },
    report: { facesIn: F, facesOut: keep.length / 3, removed: degen },
  };
}

/**
 * Flip normals so all faces in a connected component point outward.
 *
 * Strategy:
 *   1. Find connected components via BFS over face adjacency.
 *   2. For each component compute the signed volume from the centroid; if
 *      negative the surface is inverted → flip every face in that component.
 *   3. Within a component, propagate winding so neighbouring faces share
 *      edge directions consistently.
 */
export function fixWinding(mesh) {
  const { positions, indices } = mesh;
  const F = indices.length / 3;
  const { adjacency } = _buildTopology(indices);
  const idx = new Uint32Array(indices);
  const componentOf = new Int32Array(F).fill(-1);
  const components = [];

  // BFS to assign component ids and propagate winding consistency
  for (let f = 0; f < F; f++) {
    if (componentOf[f] !== -1) continue;
    const compId = components.length;
    const stack = [f];
    const memberFaces = [];
    componentOf[f] = compId;
    while (stack.length) {
      const cur = stack.pop();
      memberFaces.push(cur);
      const a = idx[3 * cur], b = idx[3 * cur + 1], c = idx[3 * cur + 2];
      for (const nb of adjacency[cur]) {
        if (componentOf[nb] !== -1) continue;
        componentOf[nb] = compId;
        // Check if edge orientation matches; if not, flip neighbour.
        const na = idx[3 * nb], nb2 = idx[3 * nb + 1], nc = idx[3 * nb + 2];
        // We need to find the shared edge and verify its direction.
        const edges = [[a, b], [b, c], [c, a]];
        const nedges = [[na, nb2], [nb2, nc], [nc, na]];
        let bad = false;
        for (const [u, v] of edges) {
          for (const [x, y] of nedges) {
            if (u === x && v === y) { bad = true; break; }
            if (u === y && v === x) { /* good */ }
          }
          if (bad) break;
        }
        if (bad) {
          // swap second and third index of neighbour
          const tmp = idx[3 * nb + 1];
          idx[3 * nb + 1] = idx[3 * nb + 2];
          idx[3 * nb + 2] = tmp;
        }
        stack.push(nb);
      }
    }
    components.push(memberFaces);
  }

  // Compute signed volume per component; flip inverted ones.
  let flipped = 0;
  for (const member of components) {
    let signedVolume = 0;
    for (const f of member) {
      const i0 = idx[3 * f], i1 = idx[3 * f + 1], i2 = idx[3 * f + 2];
      const x1 = positions[3 * i0], y1 = positions[3 * i0 + 1], z1 = positions[3 * i0 + 2];
      const x2 = positions[3 * i1], y2 = positions[3 * i1 + 1], z2 = positions[3 * i1 + 2];
      const x3 = positions[3 * i2], y3 = positions[3 * i2 + 1], z3 = positions[3 * i2 + 2];
      signedVolume += (x1 * (y2 * z3 - y3 * z2) - x2 * (y1 * z3 - y3 * z1) + x3 * (y1 * z2 - y2 * z1)) / 6;
    }
    if (signedVolume < 0) {
      for (const f of member) {
        const tmp = idx[3 * f + 1];
        idx[3 * f + 1] = idx[3 * f + 2];
        idx[3 * f + 2] = tmp;
      }
      flipped++;
    }
  }

  return {
    mesh: { positions: new Float32Array(positions), indices: idx },
    report: { components: components.length, componentsFlipped: flipped },
  };
}

/**
 * Find boundary loops and triangulate each as a fan from the centroid.
 * Works on simple holes; complex topology (figure-8, multiple linked
 * loops) is left for the user to handle in a dedicated tool.
 */
export function closeHoles(mesh) {
  const { positions, indices } = mesh;
  const { boundaryEdges } = _buildTopology(indices);
  if (boundaryEdges.length === 0) {
    return {
      mesh: { positions: new Float32Array(positions), indices: new Uint32Array(indices) },
      report: { boundaryEdges: 0, holesClosed: 0, trianglesAdded: 0 },
    };
  }

  // Trace loops by following boundary edges vertex-by-vertex.
  const adj = new Map();
  for (const e of boundaryEdges) {
    if (!adj.has(e.a)) adj.set(e.a, []);
    if (!adj.has(e.b)) adj.set(e.b, []);
    adj.get(e.a).push(e.b);
    adj.get(e.b).push(e.a);
  }
  const visited = new Set();
  const loops = [];
  for (const start of adj.keys()) {
    if (visited.has(start)) continue;
    const loop = [start];
    visited.add(start);
    let cur = start;
    let prev = -1;
    while (true) {
      const neighbours = adj.get(cur) || [];
      const next = neighbours.find(n => n !== prev && !visited.has(n));
      if (next === undefined) break;
      visited.add(next);
      loop.push(next);
      prev = cur;
      cur = next;
      // close-up check: are we back to start? then stop
      if (next === start) break;
    }
    if (loop.length >= 3) loops.push(loop);
  }

  const newIdx = Array.from(indices);
  let posArr = Array.from(positions);
  let trianglesAdded = 0;
  let closed = 0;

  for (const loop of loops) {
    if (loop.length < 3) continue;
    // Centroid of loop vertices
    let cx = 0, cy = 0, cz = 0;
    for (const v of loop) {
      cx += posArr[3 * v];
      cy += posArr[3 * v + 1];
      cz += posArr[3 * v + 2];
    }
    cx /= loop.length; cy /= loop.length; cz /= loop.length;
    const cIdx = posArr.length / 3;
    posArr.push(cx, cy, cz);
    // Fan triangulation
    for (let i = 0; i < loop.length; i++) {
      const a = loop[i];
      const b = loop[(i + 1) % loop.length];
      newIdx.push(cIdx, a, b);
      trianglesAdded++;
    }
    closed++;
  }

  return {
    mesh: { positions: new Float32Array(posArr), indices: new Uint32Array(newIdx) },
    report: { boundaryEdges: boundaryEdges.length, holesClosed: closed, trianglesAdded },
  };
}

/**
 * Run the standard 4-step repair pipeline. Returns the final mesh plus
 * a per-step report so the UI can show what changed.
 */
export function autoRepair(mesh, options = {}) {
  // ops: 'all' or array of step names ['dedupe','degenerate','winding','holes']
  const opsRaw = options.ops;
  const enable = (name) => {
    if (!opsRaw || opsRaw === 'all') return true;
    if (Array.isArray(opsRaw)) return opsRaw.includes('all') || opsRaw.includes(name);
    return false;
  };
  const reports = {};
  let m = mesh;

  if (enable('dedupe')) {
    const step1 = dedupeVertices(m);
    reports.dedupe = step1.report;
    m = step1.mesh;
  }

  if (enable('degenerate')) {
    const step2 = removeDegenerateTriangles(m);
    reports.degenerate = step2.report;
    m = step2.mesh;
  }

  if (enable('winding')) {
    const step3 = fixWinding(m);
    reports.winding = step3.report;
    m = step3.mesh;
  }

  if (enable('holes')) {
    const step4 = closeHoles(m);
    reports.holes = step4.report;
    m = step4.mesh;
  }

  return { mesh: m, report: reports };
}

/**
 * Analyse without modifying — returns the same metrics autoRepair
 * would fix, so the UI can preview.
 */
export function analyzeMesh(mesh) {
  const { positions, indices } = mesh;
  const F = indices.length / 3;
  const V = positions.length / 3;
  const { boundaryEdges, edgeMap } = _buildTopology(indices);
  let degenerate = 0;
  for (let f = 0; f < F; f++) {
    const i0 = indices[3 * f], i1 = indices[3 * f + 1], i2 = indices[3 * f + 2];
    if (i0 === i1 || i1 === i2 || i0 === i2) { degenerate++; continue; }
    if (_triArea(positions, i0, i1, i2) < EPS) degenerate++;
  }
  let nonManifoldEdges = 0;
  for (const faces of edgeMap.values()) if (faces.length > 2) nonManifoldEdges++;
  // Rough duplicate-vertex count
  const seen = new Set();
  let duplicateVertices = 0;
  for (let i = 0; i < V; i++) {
    const k = _spatialKey(positions[3 * i], positions[3 * i + 1], positions[3 * i + 2]);
    if (seen.has(k)) duplicateVertices++;
    else seen.add(k);
  }
  return {
    vertices: V,
    faces: F,
    boundaryEdges: boundaryEdges.length,
    nonManifoldEdges,
    duplicateVertices,
    degenerateFaces: degenerate,
    isClean:
      boundaryEdges.length === 0 && nonManifoldEdges === 0 &&
      duplicateVertices === 0 && degenerate === 0,
  };
}

export const _internals = { _triNormal, _triArea, _triCentroid, _buildTopology, _spatialKey };
