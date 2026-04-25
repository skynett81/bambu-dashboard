/**
 * CSG via BSP trees — pure-JS constructive solid geometry.
 *
 * Implements union / subtract / intersect on indexed meshes using the
 * classic Evan Wallace BSP-tree algorithm (public-domain csg.js, 2011),
 * adapted to operate on our indexed-mesh format
 *   { positions: Float32Array(3·V), indices: Uint32Array(3·F) }.
 *
 * The algorithm:
 *   1. Convert each mesh to a list of Polygons.
 *   2. Build a BSPNode from solid A's polygons.
 *   3. For union/subtract/intersect, clip each tree against the other,
 *      possibly inverting one or both, then merge.
 *   4. Collect surviving polygons and triangulate (fan) back into an
 *      indexed mesh.
 *
 * Numerical robustness: the only tunable is `Plane.EPSILON` — Evan's
 * original 1e-5 works well for typical-scale FDM models. Coplanar
 * polygons go to the front side, matching csg.js conventions.
 *
 * Performance: O(N log N) on average for N polygons, but BSP trees can
 * degenerate on aligned geometry. For ~10k triangles this is still
 * sub-second on modern Node.js.
 */

// ── Vector primitives ─────────────────────────────────────────────────

class Vec3 {
  constructor(x, y, z) { this.x = x; this.y = y; this.z = z; }
  clone()              { return new Vec3(this.x, this.y, this.z); }
  negated()            { return new Vec3(-this.x, -this.y, -this.z); }
  plus(b)              { return new Vec3(this.x + b.x, this.y + b.y, this.z + b.z); }
  minus(b)             { return new Vec3(this.x - b.x, this.y - b.y, this.z - b.z); }
  times(s)             { return new Vec3(this.x * s, this.y * s, this.z * s); }
  dividedBy(s)         { return new Vec3(this.x / s, this.y / s, this.z / s); }
  dot(b)               { return this.x * b.x + this.y * b.y + this.z * b.z; }
  lerp(b, t)           { return this.plus(b.minus(this).times(t)); }
  length()             { return Math.sqrt(this.dot(this)); }
  unit()               { return this.dividedBy(this.length() || 1); }
  cross(b) {
    return new Vec3(
      this.y * b.z - this.z * b.y,
      this.z * b.x - this.x * b.z,
      this.x * b.y - this.y * b.x,
    );
  }
}

// ── Vertex & Plane ────────────────────────────────────────────────────

class Vertex {
  constructor(pos, normal) {
    this.pos = pos;
    this.normal = normal || new Vec3(0, 0, 0);
  }
  clone() { return new Vertex(this.pos.clone(), this.normal.clone()); }
  flip()  { this.normal = this.normal.negated(); }
  interpolate(other, t) {
    return new Vertex(this.pos.lerp(other.pos, t), this.normal.lerp(other.normal, t));
  }
}

class Plane {
  constructor(normal, w) { this.normal = normal; this.w = w; }
  static EPSILON = 1e-5;
  static fromPoints(a, b, c) {
    const n = b.minus(a).cross(c.minus(a)).unit();
    return new Plane(n, n.dot(a));
  }
  clone() { return new Plane(this.normal.clone(), this.w); }
  flip()  { this.normal = this.normal.negated(); this.w = -this.w; }
  /**
   * Split a polygon by this plane and append polygons / vertices
   * to coplanarFront / coplanarBack / front / back.
   */
  splitPolygon(polygon, coplanarFront, coplanarBack, front, back) {
    const COPLANAR = 0, FRONT = 1, BACK = 2, SPANNING = 3;
    let polygonType = 0;
    const types = [];
    for (let i = 0; i < polygon.vertices.length; i++) {
      const t = this.normal.dot(polygon.vertices[i].pos) - this.w;
      const type = (t < -Plane.EPSILON) ? BACK : (t > Plane.EPSILON ? FRONT : COPLANAR);
      polygonType |= type;
      types.push(type);
    }
    switch (polygonType) {
      case COPLANAR:
        (this.normal.dot(polygon.plane.normal) > 0 ? coplanarFront : coplanarBack).push(polygon);
        break;
      case FRONT:    front.push(polygon); break;
      case BACK:     back.push(polygon); break;
      case SPANNING: {
        const f = [], b = [];
        for (let i = 0; i < polygon.vertices.length; i++) {
          const j = (i + 1) % polygon.vertices.length;
          const ti = types[i], tj = types[j];
          const vi = polygon.vertices[i], vj = polygon.vertices[j];
          if (ti !== BACK)  f.push(vi);
          if (ti !== FRONT) b.push(ti !== BACK ? vi.clone() : vi);
          if ((ti | tj) === SPANNING) {
            const t = (this.w - this.normal.dot(vi.pos)) / this.normal.dot(vj.pos.minus(vi.pos));
            const v = vi.interpolate(vj, t);
            f.push(v); b.push(v.clone());
          }
        }
        if (f.length >= 3) front.push(new Polygon(f, polygon.shared));
        if (b.length >= 3) back.push(new Polygon(b, polygon.shared));
        break;
      }
    }
  }
}

// ── Polygon ───────────────────────────────────────────────────────────

class Polygon {
  constructor(vertices, shared) {
    this.vertices = vertices;
    this.shared = shared;
    this.plane = Plane.fromPoints(vertices[0].pos, vertices[1].pos, vertices[2].pos);
  }
  clone() {
    return new Polygon(this.vertices.map(v => v.clone()), this.shared);
  }
  flip() {
    this.vertices.reverse().forEach(v => v.flip());
    this.plane.flip();
  }
}

// ── BSP Node ──────────────────────────────────────────────────────────

class Node {
  constructor(polygons) {
    this.plane = null;
    this.front = null;
    this.back = null;
    this.polygons = [];
    if (polygons) this.build(polygons);
  }
  clone() {
    const node = new Node();
    node.plane    = this.plane && this.plane.clone();
    node.front    = this.front && this.front.clone();
    node.back     = this.back && this.back.clone();
    node.polygons = this.polygons.map(p => p.clone());
    return node;
  }
  invert() {
    for (const p of this.polygons) p.flip();
    if (this.plane) this.plane.flip();
    if (this.front) this.front.invert();
    if (this.back) this.back.invert();
    const tmp = this.front; this.front = this.back; this.back = tmp;
  }
  clipPolygons(polygons) {
    if (!this.plane) return polygons.slice();
    let front = [], back = [];
    for (const p of polygons) this.plane.splitPolygon(p, front, back, front, back);
    if (this.front) front = this.front.clipPolygons(front);
    if (this.back) back = this.back.clipPolygons(back);
    else back = [];
    return front.concat(back);
  }
  clipTo(bsp) {
    this.polygons = bsp.clipPolygons(this.polygons);
    if (this.front) this.front.clipTo(bsp);
    if (this.back) this.back.clipTo(bsp);
  }
  allPolygons() {
    let polys = this.polygons.slice();
    if (this.front) polys = polys.concat(this.front.allPolygons());
    if (this.back) polys = polys.concat(this.back.allPolygons());
    return polys;
  }
  build(polygons) {
    if (!polygons.length) return;
    if (!this.plane) this.plane = polygons[0].plane.clone();
    const front = [], back = [];
    for (const p of polygons) this.plane.splitPolygon(p, this.polygons, this.polygons, front, back);
    if (front.length) {
      if (!this.front) this.front = new Node();
      this.front.build(front);
    }
    if (back.length) {
      if (!this.back) this.back = new Node();
      this.back.build(back);
    }
  }
}

// ── CSG class ─────────────────────────────────────────────────────────

class CSG {
  constructor(polygons) { this.polygons = polygons || []; }
  clone() { return new CSG(this.polygons.map(p => p.clone())); }
  toPolygons() { return this.polygons; }
  static fromPolygons(polygons) { return new CSG(polygons); }

  union(other) {
    const a = new Node(this.clone().polygons);
    const b = new Node(other.clone().polygons);
    a.clipTo(b); b.clipTo(a); b.invert(); b.clipTo(a); b.invert();
    a.build(b.allPolygons());
    return CSG.fromPolygons(a.allPolygons());
  }
  subtract(other) {
    const a = new Node(this.clone().polygons);
    const b = new Node(other.clone().polygons);
    a.invert();
    a.clipTo(b); b.clipTo(a); b.invert(); b.clipTo(a); b.invert();
    a.build(b.allPolygons());
    a.invert();
    return CSG.fromPolygons(a.allPolygons());
  }
  intersect(other) {
    const a = new Node(this.clone().polygons);
    const b = new Node(other.clone().polygons);
    a.invert();
    b.clipTo(a);
    b.invert();
    a.clipTo(b); b.clipTo(a);
    a.build(b.allPolygons());
    a.invert();
    return CSG.fromPolygons(a.allPolygons());
  }
}

// ── Indexed mesh ↔ CSG conversion ─────────────────────────────────────

/**
 * Convert an indexed mesh to a CSG.
 *
 * @param {{positions: Float32Array, indices: Uint32Array}} mesh
 */
export function meshToCsg(mesh) {
  const polygons = [];
  for (let f = 0; f < mesh.indices.length; f += 3) {
    const i0 = mesh.indices[f];
    const i1 = mesh.indices[f + 1];
    const i2 = mesh.indices[f + 2];
    const v0 = new Vec3(mesh.positions[3 * i0],     mesh.positions[3 * i0 + 1], mesh.positions[3 * i0 + 2]);
    const v1 = new Vec3(mesh.positions[3 * i1],     mesh.positions[3 * i1 + 1], mesh.positions[3 * i1 + 2]);
    const v2 = new Vec3(mesh.positions[3 * i2],     mesh.positions[3 * i2 + 1], mesh.positions[3 * i2 + 2]);
    // Skip degenerate triangles (zero area) — they break BSP construction.
    const e1 = v1.minus(v0), e2 = v2.minus(v0);
    if (e1.cross(e2).length() < Plane.EPSILON) continue;
    const n = e1.cross(e2).unit();
    polygons.push(new Polygon([
      new Vertex(v0, n), new Vertex(v1, n), new Vertex(v2, n),
    ]));
  }
  return CSG.fromPolygons(polygons);
}

/**
 * Convert a CSG back to indexed mesh form. Polygons with > 3 vertices
 * are fan-triangulated.
 */
export function csgToMesh(csg) {
  const positions = [];
  const indices = [];
  // Naive vertex deduplication via spatial hash so the result is suitable
  // for the existing mesh-repair / mesh-transforms toolkit.
  const map = new Map();
  const EPS = 1e-5;
  function addVertex(p) {
    const key = `${Math.round(p.x / EPS)},${Math.round(p.y / EPS)},${Math.round(p.z / EPS)}`;
    let idx = map.get(key);
    if (idx === undefined) {
      idx = positions.length / 3;
      positions.push(p.x, p.y, p.z);
      map.set(key, idx);
    }
    return idx;
  }
  for (const poly of csg.polygons) {
    if (poly.vertices.length < 3) continue;
    const i0 = addVertex(poly.vertices[0].pos);
    for (let i = 1; i + 1 < poly.vertices.length; i++) {
      const i1 = addVertex(poly.vertices[i].pos);
      const i2 = addVertex(poly.vertices[i + 1].pos);
      if (i0 === i1 || i1 === i2 || i0 === i2) continue;
      indices.push(i0, i1, i2);
    }
  }
  return {
    positions: new Float32Array(positions),
    indices: new Uint32Array(indices),
  };
}

// ── High-level helpers ────────────────────────────────────────────────

/**
 * Boolean union of two indexed meshes.
 */
export function unionMesh(a, b) {
  return csgToMesh(meshToCsg(a).union(meshToCsg(b)));
}

/**
 * Boolean subtraction (A − B).
 */
export function subtractMesh(a, b) {
  return csgToMesh(meshToCsg(a).subtract(meshToCsg(b)));
}

/**
 * Boolean intersection.
 */
export function intersectMesh(a, b) {
  return csgToMesh(meshToCsg(a).intersect(meshToCsg(b)));
}

export const _internals = { Vec3, Vertex, Plane, Polygon, Node, CSG };
