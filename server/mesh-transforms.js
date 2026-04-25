/**
 * Mesh Transforms — decimate, smooth, hollow-out, split, scale, and
 * recompute-normals operations on indexed meshes.
 *
 * Operates on the same indexed-mesh form used by mesh-repair.js:
 *   { positions: Float32Array(3·V), indices: Uint32Array(3·F) }
 *
 * Notes on algorithm choices (kept simple on purpose so the toolkit stays
 * dependency-free and runnable in the main thread for typical STLs):
 *   - decimate: clustered vertex collapse (vertex grid quantization). Far
 *     simpler than QEM but lossy; good enough for "make it 50% smaller".
 *   - smooth: Laplacian smoothing with a uniform weight. Each pass moves
 *     a vertex toward the average of its neighbours. Iterations are
 *     configurable; lambda is clamped to (0, 1].
 *   - hollow: flips inward face normals into a shell by duplicating the
 *     mesh, scaling the inner copy toward its centroid, and reversing
 *     winding. Result has 2× the triangles and an interior cavity equal
 *     to (1 − wallRatio) of the original. Cheap; not surface-offset
 *     accurate, but matches what slicers do conceptually for "infill 0%
 *     vase mode" prints.
 *   - splitComponents: BFS over face-adjacency to separate disconnected
 *     parts so each can be saved/printed independently.
 */

const EPS = 1e-6;

// ── Shared helpers ─────────────────────────────────────────────────────

function _faceAdjacency(indices) {
  // edge "min,max" → array of face indices touching that edge
  const edges = new Map();
  const faceCount = indices.length / 3;
  for (let f = 0; f < faceCount; f++) {
    const a = indices[3 * f];
    const b = indices[3 * f + 1];
    const c = indices[3 * f + 2];
    for (const [u, v] of [[a, b], [b, c], [c, a]]) {
      const key = u < v ? `${u},${v}` : `${v},${u}`;
      let arr = edges.get(key);
      if (!arr) { arr = []; edges.set(key, arr); }
      arr.push(f);
    }
  }
  const adj = Array.from({ length: faceCount }, () => []);
  for (const arr of edges.values()) {
    if (arr.length < 2) continue;
    for (let i = 0; i < arr.length; i++) {
      for (let j = i + 1; j < arr.length; j++) {
        adj[arr[i]].push(arr[j]);
        adj[arr[j]].push(arr[i]);
      }
    }
  }
  return adj;
}

function _boundingBox(positions) {
  if (positions.length === 0) return { min: [0, 0, 0], max: [0, 0, 0], size: [0, 0, 0] };
  let minX = +Infinity, minY = +Infinity, minZ = +Infinity;
  let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;
  for (let i = 0; i < positions.length; i += 3) {
    const x = positions[i], y = positions[i + 1], z = positions[i + 2];
    if (x < minX) minX = x; if (x > maxX) maxX = x;
    if (y < minY) minY = y; if (y > maxY) maxY = y;
    if (z < minZ) minZ = z; if (z > maxZ) maxZ = z;
  }
  return {
    min: [minX, minY, minZ],
    max: [maxX, maxY, maxZ],
    size: [maxX - minX, maxY - minY, maxZ - minZ]
  };
}

function _centroid(positions) {
  if (positions.length === 0) return [0, 0, 0];
  let sx = 0, sy = 0, sz = 0;
  const n = positions.length / 3;
  for (let i = 0; i < positions.length; i += 3) {
    sx += positions[i]; sy += positions[i + 1]; sz += positions[i + 2];
  }
  return [sx / n, sy / n, sz / n];
}

function _vertexNeighbours(indices, vertexCount) {
  const neighbours = Array.from({ length: vertexCount }, () => new Set());
  for (let f = 0; f < indices.length; f += 3) {
    const a = indices[f], b = indices[f + 1], c = indices[f + 2];
    neighbours[a].add(b); neighbours[a].add(c);
    neighbours[b].add(a); neighbours[b].add(c);
    neighbours[c].add(a); neighbours[c].add(b);
  }
  return neighbours;
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

// ── Decimate ───────────────────────────────────────────────────────────

/**
 * Reduce triangle count via vertex-cluster collapse on a uniform grid.
 *
 * `targetRatio` is the fraction of the original vertex count to aim for
 * (e.g. 0.5 → halve). The grid resolution is computed from the bounding
 * box and the cube root of `targetRatio`, so the visual scale of detail
 * loss is roughly uniform across axes.
 *
 * Returns the new mesh plus a report:
 *   { mesh, report: { facesBefore, facesAfter, verticesBefore, verticesAfter } }
 */
export function decimate(mesh, targetRatio = 0.5) {
  const ratio = Math.max(0.05, Math.min(1.0, Number(targetRatio) || 0.5));
  if (ratio >= 0.999) {
    return {
      mesh,
      report: {
        facesBefore: mesh.indices.length / 3,
        facesAfter: mesh.indices.length / 3,
        verticesBefore: mesh.positions.length / 3,
        verticesAfter: mesh.positions.length / 3
      }
    };
  }
  const bb = _boundingBox(mesh.positions);
  const longest = Math.max(bb.size[0], bb.size[1], bb.size[2], EPS);
  // Pick cell size so we end up with roughly ratio*V vertices.
  // V_after ≈ (longest / cell)^3 → cell = longest * cuberoot(1/(V*ratio))
  const vertices = mesh.positions.length / 3;
  const cell = longest / Math.max(2, Math.cbrt(vertices * ratio));

  const buckets = new Map();    // key → { sumX, sumY, sumZ, count, newIndex }
  const remap = new Uint32Array(vertices);
  const newPositions = [];

  for (let v = 0; v < vertices; v++) {
    const x = mesh.positions[3 * v];
    const y = mesh.positions[3 * v + 1];
    const z = mesh.positions[3 * v + 2];
    const key = `${Math.floor(x / cell)},${Math.floor(y / cell)},${Math.floor(z / cell)}`;
    let b = buckets.get(key);
    if (!b) {
      b = { sumX: 0, sumY: 0, sumZ: 0, count: 0, newIndex: newPositions.length / 3 };
      buckets.set(key, b);
      newPositions.push(0, 0, 0); // placeholder, filled after averaging
    }
    b.sumX += x; b.sumY += y; b.sumZ += z; b.count += 1;
    remap[v] = b.newIndex;
  }
  for (const b of buckets.values()) {
    const i = b.newIndex * 3;
    newPositions[i] = b.sumX / b.count;
    newPositions[i + 1] = b.sumY / b.count;
    newPositions[i + 2] = b.sumZ / b.count;
  }

  // Rebuild faces, dropping any that collapse to a degenerate after the merge.
  const newIndices = [];
  for (let f = 0; f < mesh.indices.length; f += 3) {
    const a = remap[mesh.indices[f]];
    const b = remap[mesh.indices[f + 1]];
    const c = remap[mesh.indices[f + 2]];
    if (a === b || b === c || a === c) continue;
    newIndices.push(a, b, c);
  }

  return {
    mesh: {
      positions: new Float32Array(newPositions),
      indices: new Uint32Array(newIndices)
    },
    report: {
      facesBefore: mesh.indices.length / 3,
      facesAfter: newIndices.length / 3,
      verticesBefore: vertices,
      verticesAfter: newPositions.length / 3
    }
  };
}

// ── Smooth ─────────────────────────────────────────────────────────────

/**
 * Laplacian smoothing: each vertex moves toward the average of its
 * neighbours by `lambda`, repeated `iterations` times. Boundary vertices
 * are anchored (no displacement) to avoid shrinking open-edge meshes.
 *
 * `lambda` ∈ (0, 1]. Larger = stronger smoothing per pass.
 */
export function smooth(mesh, iterations = 1, lambda = 0.5) {
  const iters = Math.max(1, Math.min(20, Math.floor(iterations) || 1));
  const lam = Math.max(0.01, Math.min(1.0, Number(lambda) || 0.5));
  const vertices = mesh.positions.length / 3;
  const neighbours = _vertexNeighbours(mesh.indices, vertices);

  // Anchor boundary vertices: any vertex on an edge belonging to fewer than 2
  // faces is treated as on the boundary and skipped.
  const boundary = new Uint8Array(vertices);
  {
    const edges = new Map();
    for (let f = 0; f < mesh.indices.length; f += 3) {
      const a = mesh.indices[f], b = mesh.indices[f + 1], c = mesh.indices[f + 2];
      for (const [u, v] of [[a, b], [b, c], [c, a]]) {
        const key = u < v ? `${u},${v}` : `${v},${u}`;
        edges.set(key, (edges.get(key) || 0) + 1);
      }
    }
    for (const [key, count] of edges) {
      if (count >= 2) continue;
      const [u, v] = key.split(',').map(Number);
      boundary[u] = 1; boundary[v] = 1;
    }
  }

  const positions = new Float32Array(mesh.positions);
  const buf = new Float32Array(positions.length);

  for (let pass = 0; pass < iters; pass++) {
    for (let v = 0; v < vertices; v++) {
      if (boundary[v]) {
        buf[3 * v] = positions[3 * v];
        buf[3 * v + 1] = positions[3 * v + 1];
        buf[3 * v + 2] = positions[3 * v + 2];
        continue;
      }
      const ns = neighbours[v];
      if (ns.size === 0) {
        buf[3 * v] = positions[3 * v];
        buf[3 * v + 1] = positions[3 * v + 1];
        buf[3 * v + 2] = positions[3 * v + 2];
        continue;
      }
      let sx = 0, sy = 0, sz = 0;
      for (const n of ns) {
        sx += positions[3 * n]; sy += positions[3 * n + 1]; sz += positions[3 * n + 2];
      }
      const ax = sx / ns.size, ay = sy / ns.size, az = sz / ns.size;
      buf[3 * v] = positions[3 * v] + lam * (ax - positions[3 * v]);
      buf[3 * v + 1] = positions[3 * v + 1] + lam * (ay - positions[3 * v + 1]);
      buf[3 * v + 2] = positions[3 * v + 2] + lam * (az - positions[3 * v + 2]);
    }
    positions.set(buf);
  }

  return {
    mesh: {
      positions,
      indices: new Uint32Array(mesh.indices)
    },
    report: {
      iterations: iters,
      lambda: lam,
      vertices,
      boundaryVertices: Array.from(boundary).reduce((s, b) => s + b, 0)
    }
  };
}

// ── Hollow-out ─────────────────────────────────────────────────────────

/**
 * Make the mesh a shell with `wallRatio` thickness (0 < r < 1, where 1 is
 * a solid outer skin and 0 is "as thin as possible"). Implementation:
 * duplicate the mesh, scale the inner copy toward its centroid by
 * (1 − wallRatio), reverse winding, and concatenate.
 *
 * The result is watertight as long as the input was; thicker walls in the
 * slicer are still recommended.
 */
export function hollow(mesh, wallRatio = 0.1) {
  const wall = Math.max(0.02, Math.min(0.5, Number(wallRatio) || 0.1));
  const innerScale = 1 - wall;
  const center = _centroid(mesh.positions);

  const v = mesh.positions.length / 3;
  const f = mesh.indices.length / 3;

  const newPositions = new Float32Array(2 * mesh.positions.length);
  const newIndices = new Uint32Array(2 * mesh.indices.length);

  // Outer copy: identical.
  newPositions.set(mesh.positions, 0);
  newIndices.set(mesh.indices, 0);

  // Inner copy: scaled toward centroid, winding reversed (b/c swapped).
  for (let i = 0; i < v; i++) {
    const dx = mesh.positions[3 * i] - center[0];
    const dy = mesh.positions[3 * i + 1] - center[1];
    const dz = mesh.positions[3 * i + 2] - center[2];
    newPositions[3 * (v + i)] = center[0] + dx * innerScale;
    newPositions[3 * (v + i) + 1] = center[1] + dy * innerScale;
    newPositions[3 * (v + i) + 2] = center[2] + dz * innerScale;
  }
  for (let t = 0; t < f; t++) {
    newIndices[3 * (f + t)] = v + mesh.indices[3 * t];
    newIndices[3 * (f + t) + 1] = v + mesh.indices[3 * t + 2]; // reversed
    newIndices[3 * (f + t) + 2] = v + mesh.indices[3 * t + 1];
  }

  // Estimate mass savings (volume ≈ scale^3).
  const massSaved = (1 - innerScale * innerScale * innerScale);

  return {
    mesh: { positions: newPositions, indices: newIndices },
    report: {
      wallRatio: wall,
      facesBefore: f,
      facesAfter: 2 * f,
      verticesBefore: v,
      verticesAfter: 2 * v,
      estimatedMassReduction: massSaved
    }
  };
}

// ── Split components ───────────────────────────────────────────────────

/**
 * Split a mesh into one mesh per connected component (over face
 * adjacency). Returns an array of meshes. If the input has only one
 * component, the array has length 1 and the only entry shares vertex
 * data with the input where possible.
 */
export function splitComponents(mesh) {
  const faceCount = mesh.indices.length / 3;
  if (faceCount === 0) return { meshes: [], report: { components: 0 } };

  const adj = _faceAdjacency(mesh.indices);
  const componentOf = new Int32Array(faceCount).fill(-1);
  let nextComp = 0;

  for (let seed = 0; seed < faceCount; seed++) {
    if (componentOf[seed] !== -1) continue;
    const stack = [seed];
    componentOf[seed] = nextComp;
    while (stack.length) {
      const f = stack.pop();
      for (const nb of adj[f]) {
        if (componentOf[nb] === -1) {
          componentOf[nb] = nextComp;
          stack.push(nb);
        }
      }
    }
    nextComp++;
  }

  if (nextComp === 1) {
    return {
      meshes: [{
        positions: new Float32Array(mesh.positions),
        indices: new Uint32Array(mesh.indices)
      }],
      report: { components: 1, faceCounts: [faceCount] }
    };
  }

  const meshes = [];
  const faceCountPer = new Array(nextComp).fill(0);

  for (let c = 0; c < nextComp; c++) {
    const remap = new Map(); // oldVertex → newVertex
    const newPositions = [];
    const newIndices = [];

    for (let f = 0; f < faceCount; f++) {
      if (componentOf[f] !== c) continue;
      faceCountPer[c]++;
      for (let k = 0; k < 3; k++) {
        const old = mesh.indices[3 * f + k];
        let mapped = remap.get(old);
        if (mapped === undefined) {
          mapped = newPositions.length / 3;
          remap.set(old, mapped);
          newPositions.push(
            mesh.positions[3 * old],
            mesh.positions[3 * old + 1],
            mesh.positions[3 * old + 2]
          );
        }
        newIndices.push(mapped);
      }
    }

    meshes.push({
      positions: new Float32Array(newPositions),
      indices: new Uint32Array(newIndices)
    });
  }

  // Sort biggest component first — usually what users want as the "main" piece.
  const order = meshes
    .map((m, i) => ({ m, i, c: faceCountPer[i] }))
    .sort((a, b) => b.c - a.c);

  return {
    meshes: order.map(o => o.m),
    report: { components: nextComp, faceCounts: order.map(o => o.c) }
  };
}

// ── Scale / Transform helpers ──────────────────────────────────────────

/**
 * Scale mesh by independent X/Y/Z factors (e.g. for unit conversion or
 * shrinkage compensation). Pass a single number to scale uniformly.
 */
export function scale(mesh, factor) {
  let sx, sy, sz;
  if (typeof factor === 'number') { sx = sy = sz = factor; }
  else if (Array.isArray(factor) && factor.length === 3) {
    sx = factor[0]; sy = factor[1]; sz = factor[2];
  } else {
    throw new Error('scale: factor must be a number or [x,y,z] array');
  }
  const out = new Float32Array(mesh.positions.length);
  for (let i = 0; i < mesh.positions.length; i += 3) {
    out[i] = mesh.positions[i] * sx;
    out[i + 1] = mesh.positions[i + 1] * sy;
    out[i + 2] = mesh.positions[i + 2] * sz;
  }
  return {
    mesh: { positions: out, indices: new Uint32Array(mesh.indices) },
    report: { scale: [sx, sy, sz] }
  };
}

/**
 * Translate every vertex by [dx, dy, dz]. Useful to recenter or move a
 * mesh onto the build plate.
 */
export function translate(mesh, delta) {
  const [dx, dy, dz] = delta;
  const out = new Float32Array(mesh.positions.length);
  for (let i = 0; i < mesh.positions.length; i += 3) {
    out[i] = mesh.positions[i] + dx;
    out[i + 1] = mesh.positions[i + 1] + dy;
    out[i + 2] = mesh.positions[i + 2] + dz;
  }
  return {
    mesh: { positions: out, indices: new Uint32Array(mesh.indices) },
    report: { translate: [dx, dy, dz] }
  };
}

/**
 * Recenter the mesh so its bounding box minimum sits at [0, 0, 0]. Often
 * needed before exporting for slicers that won't auto-place models.
 */
export function recenterToOrigin(mesh) {
  const bb = _boundingBox(mesh.positions);
  return translate(mesh, [-bb.min[0], -bb.min[1], -bb.min[2]]);
}

// ── Mesh stats helper ─────────────────────────────────────────────────

/**
 * Compute basic mesh statistics — used by the API to summarize a mesh
 * before / after a transform.
 */
export function meshStats(mesh) {
  const v = mesh.positions.length / 3;
  const f = mesh.indices.length / 3;
  const bb = _boundingBox(mesh.positions);
  let area = 0;
  for (let t = 0; t < f; t++) {
    area += _triArea(mesh.positions, mesh.indices[3 * t], mesh.indices[3 * t + 1], mesh.indices[3 * t + 2]);
  }
  return {
    vertices: v,
    faces: f,
    bbox: bb,
    surfaceAreaMm2: area
  };
}
