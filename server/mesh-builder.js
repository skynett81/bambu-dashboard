/**
 * Shared MeshBuilder — vertex/triangle primitives for 3MF generation via lib3mf
 * Used by sign-3mf-generator, lithophane-generator, and all Model Forge tools
 */

let _lib = null;

/** Lazy-init lib3mf WASM singleton */
export async function getLib() {
  if (_lib) return _lib;
  const init = (await import('@3mfconsortium/lib3mf')).default;
  _lib = await init();
  return _lib;
}

export class MeshBuilder {
  constructor(lib, mesh) {
    this.lib = lib;
    this.mesh = mesh;
    this.vOff = 0;
  }

  /** Add a vertex and return its index */
  _addVertex(x, y, z) {
    const p = new this.lib.sPosition();
    p.set_Coordinates0(x); p.set_Coordinates1(y); p.set_Coordinates2(z);
    this.mesh.AddVertex(p); p.delete();
    return this.vOff++;
  }

  /** Add a triangle from 3 absolute vertex indices */
  _addTri(a, b, c) {
    const t = new this.lib.sTriangle();
    t.set_Indices0(a); t.set_Indices1(b); t.set_Indices2(c);
    this.mesh.AddTriangle(t); t.delete();
  }

  /** Watertight box */
  addBox(x, y, z, w, h, d) {
    const base = this.vOff;
    const corners = [[x,y,z],[x+w,y,z],[x+w,y+h,z],[x,y+h,z],[x,y,z+d],[x+w,y,z+d],[x+w,y+h,z+d],[x,y+h,z+d]];
    for (const [cx,cy,cz] of corners) this._addVertex(cx, cy, cz);
    const faces = [[0,2,1],[0,3,2],[4,5,6],[4,6,7],[0,1,5],[0,5,4],[2,3,7],[2,7,6],[1,2,6],[1,6,5],[0,4,7],[0,7,3]];
    for (const [a,b,c] of faces) this._addTri(base+a, base+b, base+c);
  }

  /** Watertight cylinder */
  addCylinder(cx, cy, z, r, depth, segments) {
    const segs = segments || 16;
    const base = this.vOff;
    this._addVertex(cx, cy, z);       // bottom center
    this._addVertex(cx, cy, z+depth); // top center
    for (let i = 0; i < segs; i++) {
      const a = (i / segs) * Math.PI * 2;
      this._addVertex(cx + Math.cos(a) * r, cy + Math.sin(a) * r, z);
      this._addVertex(cx + Math.cos(a) * r, cy + Math.sin(a) * r, z + depth);
    }
    for (let i = 0; i < segs; i++) {
      this._addTri(base, base+2+((i+1)%segs)*2, base+2+i*2);           // bottom fan
      this._addTri(base+1, base+3+i*2, base+3+((i+1)%segs)*2);         // top fan
      const bl = base+2+i*2, br = base+2+((i+1)%segs)*2;
      this._addTri(bl, br, br+1);                                        // side quad tri 1
      this._addTri(bl, br+1, bl+1);                                      // side quad tri 2
    }
  }

  /** Flat single-sided plane (2 triangles, facing +Z) */
  addPlane(x, y, z, w, h) {
    const base = this.vOff;
    this._addVertex(x, y, z);
    this._addVertex(x+w, y, z);
    this._addVertex(x+w, y+h, z);
    this._addVertex(x, y+h, z);
    this._addTri(base, base+1, base+2);
    this._addTri(base, base+2, base+3);
  }

  /** Box with rounded vertical edges — delegates to addExtrudedRoundedRect */
  addRoundedBox(x, y, z, w, h, d, radius, segments) {
    const r = Math.min(radius, w/2, h/2);
    if (r <= 0.1) return this.addBox(x, y, z, w, h, d);
    this.addExtrudedRoundedRect(x, y, z, w, h, r, d, segments || 8);
  }

  /**
   * Build the 2D polygon of a rounded rectangle — axis-aligned, in CCW order.
   * @returns {Array<[number, number]>} points
   */
  _roundedRectPoints(x, y, w, h, r, segments) {
    const segs = Math.max(2, segments || 8);
    const pts = [];
    const r_ = Math.min(r, w/2, h/2);
    // Corners: BL, BR, TR, TL (CCW seen from +Z)
    // BR corner: center (x+w-r, y+r), sweep from -90° to 0°
    const centers = [
      { cx: x + w - r_, cy: y + r_,       a0: -Math.PI/2,       a1: 0          }, // BR
      { cx: x + w - r_, cy: y + h - r_,   a0: 0,                 a1: Math.PI/2  }, // TR
      { cx: x + r_,     cy: y + h - r_,   a0: Math.PI/2,         a1: Math.PI    }, // TL
      { cx: x + r_,     cy: y + r_,       a0: Math.PI,           a1: 3*Math.PI/2}, // BL
    ];
    for (const c of centers) {
      for (let i = 0; i <= segs; i++) {
        const t = c.a0 + (c.a1 - c.a0) * (i / segs);
        pts.push([c.cx + Math.cos(t) * r_, c.cy + Math.sin(t) * r_]);
      }
    }
    return pts;
  }

  /**
   * Extruded rounded rectangle — watertight prism from z to z+depth.
   * @param {number} x - origin X (corner)
   * @param {number} y - origin Y (corner)
   * @param {number} z - base Z
   * @param {number} w - width
   * @param {number} h - height (Y)
   * @param {number} r - corner radius
   * @param {number} depth - Z extrusion
   * @param {number} [segments=8] - segments per corner
   */
  addExtrudedRoundedRect(x, y, z, w, h, r, depth, segments) {
    const segs = Math.max(2, segments || 8);
    const pts = this._roundedRectPoints(x, y, w, h, r, segs);
    const n = pts.length;
    const base = this.vOff;
    // Bottom ring
    for (const [px, py] of pts) this._addVertex(px, py, z);
    // Top ring
    for (const [px, py] of pts) this._addVertex(px, py, z + depth);
    // Bottom center + top center for caps
    // Use average XY as the fan center (rounded rect has center at x+w/2, y+h/2)
    const bCenter = this._addVertex(x + w/2, y + h/2, z);
    const tCenter = this._addVertex(x + w/2, y + h/2, z + depth);
    // Bottom cap (reversed winding so normal faces -Z)
    for (let i = 0; i < n; i++) {
      const a = base + i, b = base + ((i + 1) % n);
      this._addTri(bCenter, b, a);
    }
    // Top cap
    for (let i = 0; i < n; i++) {
      const a = base + n + i, b = base + n + ((i + 1) % n);
      this._addTri(tCenter, a, b);
    }
    // Side walls
    for (let i = 0; i < n; i++) {
      const bl = base + i;
      const br = base + ((i + 1) % n);
      const tl = bl + n;
      const tr = br + n;
      this._addTri(bl, br, tr);
      this._addTri(bl, tr, tl);
    }
  }

  /**
   * Frustum between two rounded rectangles at different Z heights — watertight.
   * Both rectangles must use the same segments count. Used to create chamfered
   * transitions (e.g. Gridfinity bin feet).
   * @param {number} x1 - bottom origin X
   * @param {number} y1 - bottom origin Y
   * @param {number} w1 - bottom width
   * @param {number} h1 - bottom height
   * @param {number} r1 - bottom corner radius
   * @param {number} x2 - top origin X
   * @param {number} y2 - top origin Y
   * @param {number} w2 - top width
   * @param {number} h2 - top height
   * @param {number} r2 - top corner radius
   * @param {number} zBottom - bottom Z
   * @param {number} zTop - top Z
   * @param {number} [segments=8] - segments per corner
   * @param {boolean} [capBottom=false] - close bottom face
   * @param {boolean} [capTop=false] - close top face
   */
  addFrustumRoundedRect(x1, y1, w1, h1, r1, x2, y2, w2, h2, r2, zBottom, zTop, segments, capBottom, capTop) {
    const segs = Math.max(2, segments || 8);
    const ptsB = this._roundedRectPoints(x1, y1, w1, h1, r1, segs);
    const ptsT = this._roundedRectPoints(x2, y2, w2, h2, r2, segs);
    const n = Math.min(ptsB.length, ptsT.length);
    const base = this.vOff;
    for (let i = 0; i < n; i++) this._addVertex(ptsB[i][0], ptsB[i][1], zBottom);
    for (let i = 0; i < n; i++) this._addVertex(ptsT[i][0], ptsT[i][1], zTop);
    // Side quads
    for (let i = 0; i < n; i++) {
      const bl = base + i;
      const br = base + ((i + 1) % n);
      const tl = bl + n;
      const tr = br + n;
      this._addTri(bl, br, tr);
      this._addTri(bl, tr, tl);
    }
    if (capBottom) {
      const bc = this._addVertex(x1 + w1/2, y1 + h1/2, zBottom);
      for (let i = 0; i < n; i++) {
        const a = base + i, b = base + ((i + 1) % n);
        this._addTri(bc, b, a);
      }
    }
    if (capTop) {
      const tc = this._addVertex(x2 + w2/2, y2 + h2/2, zTop);
      for (let i = 0; i < n; i++) {
        const a = base + n + i, b = base + n + ((i + 1) % n);
        this._addTri(tc, a, b);
      }
    }
  }

  /**
   * Hex prism — watertight regular hexagonal prism.
   * @param {number} cx - center X
   * @param {number} cy - center Y
   * @param {number} z - base Z
   * @param {number} r - circumradius (corner distance)
   * @param {number} depth - Z height
   * @param {boolean} [pointyTop=true] - true = flat-top hex rotated, false = flat sides on X
   */
  addHexPrism(cx, cy, z, r, depth, pointyTop) {
    const offset = pointyTop === false ? Math.PI / 6 : 0;
    const base = this.vOff;
    for (let i = 0; i < 6; i++) {
      const a = offset + (i / 6) * Math.PI * 2;
      this._addVertex(cx + Math.cos(a) * r, cy + Math.sin(a) * r, z);
    }
    for (let i = 0; i < 6; i++) {
      const a = offset + (i / 6) * Math.PI * 2;
      this._addVertex(cx + Math.cos(a) * r, cy + Math.sin(a) * r, z + depth);
    }
    const bCenter = this._addVertex(cx, cy, z);
    const tCenter = this._addVertex(cx, cy, z + depth);
    for (let i = 0; i < 6; i++) {
      const a = base + i, b = base + ((i + 1) % 6);
      this._addTri(bCenter, b, a);
      const at = a + 6, bt = b + 6;
      this._addTri(tCenter, at, bt);
      this._addTri(a, b, bt);
      this._addTri(a, bt, at);
    }
  }

  /**
   * Extruded polygon — watertight prism from an arbitrary closed 2D polygon.
   * The polygon must be simple (non-self-intersecting) and ordered CCW when
   * viewed from +Z for outward-facing side normals.
   *
   * Uses fan triangulation from the polygon centroid for the top and bottom
   * caps. This only produces valid triangulations for convex or star-shaped
   * polygons. For general simple polygons a proper ear-clipping pass would
   * be required.
   *
   * @param {Array<[number, number]>} points - polygon vertices [[x,y], ...]
   * @param {number} z - base Z
   * @param {number} depth - Z extrusion height
   */
  addExtrudedPolygon(points, z, depth) {
    const n = points.length;
    if (n < 3) return;
    const base = this.vOff;
    // Bottom ring
    for (const [px, py] of points) this._addVertex(px, py, z);
    // Top ring
    for (const [px, py] of points) this._addVertex(px, py, z + depth);
    // Centroid for fan triangulation
    let cx = 0, cy = 0;
    for (const [px, py] of points) { cx += px; cy += py; }
    cx /= n; cy /= n;
    const bCenter = this._addVertex(cx, cy, z);
    const tCenter = this._addVertex(cx, cy, z + depth);
    // Bottom cap (normal faces -Z, reversed winding)
    for (let i = 0; i < n; i++) {
      const a = base + i;
      const b = base + ((i + 1) % n);
      this._addTri(bCenter, b, a);
    }
    // Top cap (normal faces +Z)
    for (let i = 0; i < n; i++) {
      const a = base + n + i;
      const b = base + n + ((i + 1) % n);
      this._addTri(tCenter, a, b);
    }
    // Side walls
    for (let i = 0; i < n; i++) {
      const bl = base + i;
      const br = base + ((i + 1) % n);
      const tl = bl + n;
      const tr = br + n;
      this._addTri(bl, br, tr);
      this._addTri(bl, tr, tl);
    }
  }

  /**
   * Extruded annulus — watertight prism with a hole. Both rings must have
   * the same number of vertices (ordered so that outer[i] and inner[i] lie
   * along the same radial direction). The outer ring must be CCW and the
   * inner ring describes the hole boundary — it is implicitly reversed
   * during triangulation.
   *
   * @param {Array<[number, number]>} outer
   * @param {Array<[number, number]>} inner
   * @param {number} z
   * @param {number} depth
   */
  addExtrudedAnnulus(outer, inner, z, depth) {
    const n = outer.length;
    if (inner.length !== n || n < 3) return;
    const base = this.vOff;
    for (const [px, py] of outer) this._addVertex(px, py, z);          // bottom outer
    for (const [px, py] of inner) this._addVertex(px, py, z);          // bottom inner
    for (const [px, py] of outer) this._addVertex(px, py, z + depth);  // top outer
    for (const [px, py] of inner) this._addVertex(px, py, z + depth);  // top inner

    const Ob = base, Ib = base + n, Ot = base + 2 * n, It = base + 3 * n;

    // Bottom annular cap (faces -Z)
    for (let i = 0; i < n; i++) {
      const iN = (i + 1) % n;
      this._addTri(Ob + i, Ib + i, Ib + iN);
      this._addTri(Ob + i, Ib + iN, Ob + iN);
    }
    // Top annular cap (faces +Z)
    for (let i = 0; i < n; i++) {
      const iN = (i + 1) % n;
      this._addTri(Ot + i, Ot + iN, It + iN);
      this._addTri(Ot + i, It + iN, It + i);
    }
    // Outer side wall (faces outward)
    for (let i = 0; i < n; i++) {
      const iN = (i + 1) % n;
      this._addTri(Ob + i, Ob + iN, Ot + iN);
      this._addTri(Ob + i, Ot + iN, Ot + i);
    }
    // Inner side wall (faces inward — reversed winding)
    for (let i = 0; i < n; i++) {
      const iN = (i + 1) % n;
      this._addTri(Ib + i, It + iN, Ib + iN);
      this._addTri(Ib + i, It + i, It + iN);
    }
  }

  /**
   * Helical tube — watertight coil with a circular cross-section.
   * Great for compression springs, coiled heating elements, decorative coils.
   *
   * @param {number} cx - coil center X
   * @param {number} cy - coil center Y
   * @param {number} zStart - start Z (bottom of coil)
   * @param {number} R - major radius (center of tube to coil axis)
   * @param {number} pitch - vertical distance per full turn (mm)
   * @param {number} turns - number of full turns
   * @param {number} wireR - tube (wire) radius
   * @param {number} [majorSegs=24] - segments per turn along the helix
   * @param {number} [minorSegs=8] - segments around the wire cross-section
   */
  addHelicalTube(cx, cy, zStart, R, pitch, turns, wireR, majorSegs, minorSegs) {
    const M = Math.max(8, Math.round((majorSegs || 24) * turns));
    const m = Math.max(4, minorSegs || 8);
    const base = this.vOff;
    for (let i = 0; i <= M; i++) {
      const t = (i / M) * turns;
      const u = t * Math.PI * 2;
      const cu = Math.cos(u), su = Math.sin(u);
      const axialZ = zStart + t * pitch;
      // Frenet-lite frame: forward along helix tangent, binormal ~ Z,
      // normal ~ radial outward. The tube cross-section lies in the
      // (normal, binormal) plane which we approximate as (radial, Z).
      for (let j = 0; j < m; j++) {
        const v = (j / m) * Math.PI * 2;
        const cv = Math.cos(v), sv = Math.sin(v);
        const radial = R + wireR * cv;
        this._addVertex(cx + cu * radial, cy + su * radial, axialZ + wireR * sv);
      }
    }
    for (let i = 0; i < M; i++) {
      for (let j = 0; j < m; j++) {
        const jN = (j + 1) % m;
        const a = base + i * m + j;
        const b = base + (i + 1) * m + j;
        const c = base + (i + 1) * m + jN;
        const d = base + i * m + jN;
        this._addTri(a, b, c);
        this._addTri(a, c, d);
      }
    }
    // Cap the two open ends with fans so the tube is watertight.
    const startCenter = this._addVertex(cx + R, cy, zStart);
    const endCenter = this._addVertex(
      cx + Math.cos(turns * Math.PI * 2) * R,
      cy + Math.sin(turns * Math.PI * 2) * R,
      zStart + turns * pitch
    );
    // Cap windings must use the OPPOSITE edge direction from the side
    // walls on the shared ring, otherwise the manifold check fails. Start
    // cap uses (center, j, jN); end cap uses (center, jN, j).
    for (let j = 0; j < m; j++) {
      const jN = (j + 1) % m;
      this._addTri(startCenter, base + j, base + jN);
      this._addTri(endCenter, base + M * m + jN, base + M * m + j);
    }
  }

  /**
   * Torus — watertight torus ring. Used for hinges, springs, o-rings.
   * @param {number} cx - center X
   * @param {number} cy - center Y
   * @param {number} cz - center Z
   * @param {number} R - major radius (center of tube)
   * @param {number} r - minor radius (tube thickness)
   * @param {number} [majorSegs=24] - segments around major ring
   * @param {number} [minorSegs=12] - segments around tube
   */
  addTorus(cx, cy, cz, R, r, majorSegs, minorSegs) {
    const M = Math.max(3, majorSegs || 24);
    const m = Math.max(3, minorSegs || 12);
    const base = this.vOff;
    for (let i = 0; i < M; i++) {
      const u = (i / M) * Math.PI * 2;
      const cu = Math.cos(u), su = Math.sin(u);
      for (let j = 0; j < m; j++) {
        const v = (j / m) * Math.PI * 2;
        const cv = Math.cos(v), sv = Math.sin(v);
        this._addVertex(cx + (R + r * cv) * cu, cy + (R + r * cv) * su, cz + r * sv);
      }
    }
    for (let i = 0; i < M; i++) {
      const iN = (i + 1) % M;
      for (let j = 0; j < m; j++) {
        const jN = (j + 1) % m;
        const a = base + i * m + j;
        const b = base + iN * m + j;
        const c = base + iN * m + jN;
        const d = base + i * m + jN;
        this._addTri(a, b, c);
        this._addTri(a, c, d);
      }
    }
  }

  /** Hollow cylinder (tube) */
  addTube(cx, cy, z, outerR, innerR, depth, segments) {
    const segs = segments || 24;
    const base = this.vOff;
    // Outer + inner ring vertices (bottom and top)
    for (let i = 0; i < segs; i++) {
      const a = (i / segs) * Math.PI * 2;
      const cos = Math.cos(a), sin = Math.sin(a);
      this._addVertex(cx + cos * outerR, cy + sin * outerR, z);           // outer bottom
      this._addVertex(cx + cos * outerR, cy + sin * outerR, z + depth);   // outer top
      this._addVertex(cx + cos * innerR, cy + sin * innerR, z);           // inner bottom
      this._addVertex(cx + cos * innerR, cy + sin * innerR, z + depth);   // inner top
    }
    for (let i = 0; i < segs; i++) {
      const n = (i + 1) % segs;
      const ob = base + i*4, ot = ob+1, ib = ob+2, it = ob+3;
      const nob = base + n*4, not_ = nob+1, nib = nob+2, nit = nob+3;
      // Outer wall
      this._addTri(ob, nob, not_); this._addTri(ob, not_, ot);
      // Inner wall (reversed winding)
      this._addTri(ib, nit, nib); this._addTri(ib, it, nit);
      // Bottom ring
      this._addTri(ob, ib, nib); this._addTri(ob, nib, nob);
      // Top ring
      this._addTri(ot, nit, it); this._addTri(ot, not_, nit);
    }
  }

  /**
   * Heightmap surface — creates a watertight solid from a 2D grid of heights.
   * Used for lithophanes, reliefs, and stencils.
   * @param {number} x - origin X
   * @param {number} y - origin Y
   * @param {number} z - origin Z (base bottom)
   * @param {number[][]} grid - 2D array [row][col] of height values (0..1)
   * @param {number} cellSize - size of each cell in mm
   * @param {number} baseThickness - minimum thickness (mm) at height=0
   * @param {number} maxHeight - maximum added height (mm) at height=1
   */
  addHeightmapSurface(x, y, z, grid, cellSize, baseThickness, maxHeight) {
    const rows = grid.length;
    if (rows === 0) return;
    const cols = grid[0].length;
    if (cols === 0) return;

    const base = this.vOff;
    const W = cols * cellSize;
    const H = rows * cellSize;

    // Create vertices: top surface grid + bottom surface grid
    // Top surface: (cols+1) x (rows+1) vertices
    for (let r = 0; r <= rows; r++) {
      for (let c = 0; c <= cols; c++) {
        // Sample height — average surrounding cells
        let h = 0, cnt = 0;
        for (let dr = -1; dr <= 0; dr++) {
          for (let dc = -1; dc <= 0; dc++) {
            const rr = r + dr, cc = c + dc;
            if (rr >= 0 && rr < rows && cc >= 0 && cc < cols) {
              h += grid[rr][cc]; cnt++;
            }
          }
        }
        h = cnt > 0 ? h / cnt : 0;
        const vz = z + baseThickness + h * maxHeight;
        this._addVertex(x + c * cellSize, y + r * cellSize, vz);
      }
    }

    // Bottom surface: (cols+1) x (rows+1) flat vertices at z
    for (let r = 0; r <= rows; r++) {
      for (let c = 0; c <= cols; c++) {
        this._addVertex(x + c * cellSize, y + r * cellSize, z);
      }
    }

    const stride = cols + 1;
    const topBase = base;
    const botBase = base + stride * (rows + 1);

    // Top surface triangles
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const tl = topBase + r * stride + c;
        const tr = tl + 1;
        const bl = tl + stride;
        const br = bl + 1;
        this._addTri(tl, bl, tr);
        this._addTri(tr, bl, br);
      }
    }

    // Bottom surface triangles (reversed winding)
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const tl = botBase + r * stride + c;
        const tr = tl + 1;
        const bl = tl + stride;
        const br = bl + 1;
        this._addTri(tl, tr, bl);
        this._addTri(tr, br, bl);
      }
    }

    // Side walls — stitch top and bottom edges
    // Front edge (r=0)
    for (let c = 0; c < cols; c++) {
      const tt = topBase + c, tn = tt + 1;
      const bt = botBase + c, bn = bt + 1;
      this._addTri(bt, tt, tn); this._addTri(bt, tn, bn);
    }
    // Back edge (r=rows)
    for (let c = 0; c < cols; c++) {
      const tt = topBase + rows * stride + c, tn = tt + 1;
      const bt = botBase + rows * stride + c, bn = bt + 1;
      this._addTri(bt, tn, tt); this._addTri(bt, bn, tn);
    }
    // Left edge (c=0)
    for (let r = 0; r < rows; r++) {
      const tt = topBase + r * stride, tn = tt + stride;
      const bt = botBase + r * stride, bn = bt + stride;
      this._addTri(bt, tn, tt); this._addTri(bt, bn, tn);
    }
    // Right edge (c=cols)
    for (let r = 0; r < rows; r++) {
      const tt = topBase + r * stride + cols, tn = tt + stride;
      const bt = botBase + r * stride + cols, bn = bt + stride;
      this._addTri(bt, tt, tn); this._addTri(bt, tn, bn);
    }
  }

  /**
   * Revolution surface — watertight solid of revolution around Z axis.
   * @param {number} cx - center X
   * @param {number} cy - center Y
   * @param {number} zStart - base Z
   * @param {Function} profileFn - (z) => radius at that height
   * @param {number} layers - number of vertical slices
   * @param {number} height - total height
   * @param {number} segments - radial segments
   * @param {number} wallThickness - wall thickness (0 = solid)
   */
  addRevolutionSurface(cx, cy, zStart, profileFn, layers, height, segments, wallThickness) {
    const segs = segments || 24;
    const wall = wallThickness || 0;
    const base = this.vOff;
    const layerH = height / layers;

    // Generate outer ring vertices per layer
    for (let l = 0; l <= layers; l++) {
      const z = zStart + l * layerH;
      const r = profileFn(l * layerH);
      for (let s = 0; s < segs; s++) {
        const a = (s / segs) * Math.PI * 2;
        this._addVertex(cx + Math.cos(a) * r, cy + Math.sin(a) * r, z);
      }
    }

    if (wall > 0) {
      // Generate inner ring vertices per layer
      for (let l = 0; l <= layers; l++) {
        const z = zStart + l * layerH;
        const r = Math.max(0.1, profileFn(l * layerH) - wall);
        for (let s = 0; s < segs; s++) {
          const a = (s / segs) * Math.PI * 2;
          this._addVertex(cx + Math.cos(a) * r, cy + Math.sin(a) * r, z);
        }
      }
    }

    const outerIdx = (l, s) => base + l * segs + (s % segs);
    const innerBase = base + (layers + 1) * segs;
    const innerIdx = (l, s) => innerBase + l * segs + (s % segs);

    // Outer wall quads
    for (let l = 0; l < layers; l++) {
      for (let s = 0; s < segs; s++) {
        const a = outerIdx(l, s), b = outerIdx(l, s + 1);
        const c = outerIdx(l + 1, s + 1), d = outerIdx(l + 1, s);
        this._addTri(a, b, c); this._addTri(a, c, d);
      }
    }

    if (wall > 0) {
      // Inner wall quads (reversed winding)
      for (let l = 0; l < layers; l++) {
        for (let s = 0; s < segs; s++) {
          const a = innerIdx(l, s), b = innerIdx(l, s + 1);
          const c = innerIdx(l + 1, s + 1), d = innerIdx(l + 1, s);
          this._addTri(a, c, b); this._addTri(a, d, c);
        }
      }
      // Bottom ring
      for (let s = 0; s < segs; s++) {
        this._addTri(outerIdx(0, s), innerIdx(0, s + 1), outerIdx(0, s + 1));
        this._addTri(outerIdx(0, s), innerIdx(0, s), innerIdx(0, s + 1));
      }
      // Top ring
      for (let s = 0; s < segs; s++) {
        this._addTri(outerIdx(layers, s), outerIdx(layers, s + 1), innerIdx(layers, s + 1));
        this._addTri(outerIdx(layers, s), innerIdx(layers, s + 1), innerIdx(layers, s));
      }
    } else {
      // Solid: bottom cap (fan from center)
      const botCenter = this._addVertex(cx, cy, zStart);
      for (let s = 0; s < segs; s++) {
        this._addTri(botCenter, outerIdx(0, s + 1), outerIdx(0, s));
      }
      // Top cap
      const topCenter = this._addVertex(cx, cy, zStart + height);
      for (let s = 0; s < segs; s++) {
        this._addTri(topCenter, outerIdx(layers, s), outerIdx(layers, s + 1));
      }
    }
  }

  /**
   * Helical strip — generates a helix thread profile for screws/bolts.
   * @param {number} cx - center X
   * @param {number} cy - center Y
   * @param {number} zStart - start Z
   * @param {number} radius - outer thread radius
   * @param {number} pitch - distance between thread peaks (mm)
   * @param {number} length - total thread length (mm)
   * @param {number} profileW - thread profile width (radial depth)
   * @param {number} profileH - thread profile height (along Z)
   * @param {number} segments - segments per revolution
   */
  addHelicalStrip(cx, cy, zStart, radius, pitch, length, profileW, profileH, segments) {
    const segs = segments || 32;
    const turns = length / pitch;
    const totalSteps = Math.ceil(turns * segs);
    const base = this.vOff;

    // Generate two rings of vertices per step: outer peak and inner root
    for (let i = 0; i <= totalSteps; i++) {
      const frac = i / totalSteps;
      const angle = frac * turns * Math.PI * 2;
      const z = zStart + frac * length;
      const cos = Math.cos(angle), sin = Math.sin(angle);

      // Outer peak
      this._addVertex(cx + cos * radius, cy + sin * radius, z + profileH / 2);
      // Inner root
      this._addVertex(cx + cos * (radius - profileW), cy + sin * (radius - profileW), z - profileH / 2);
    }

    // Connect strips
    for (let i = 0; i < totalSteps; i++) {
      const a = base + i * 2, b = a + 1;       // current outer, inner
      const c = base + (i + 1) * 2, d = c + 1; // next outer, inner
      // Outer face
      this._addTri(a, c, d); this._addTri(a, d, b);
    }
  }

  /**
   * Cylindrical heightmap — wraps a 2D grid around a cylinder surface.
   * @param {number} cx - center X
   * @param {number} cy - center Y
   * @param {number} zStart - base Z
   * @param {number} radius - cylinder radius
   * @param {number} height - cylinder height
   * @param {number[][]} grid - 2D array [row][col] of displacement values (0..1)
   * @param {number} maxDisplacement - max outward displacement in mm
   * @param {number} wallThickness - wall thickness in mm
   */
  addCylindricalHeightmap(cx, cy, zStart, radius, height, grid, maxDisplacement, wallThickness) {
    const rows = grid.length;
    if (rows === 0) return;
    const cols = grid[0].length;
    if (cols === 0) return;
    const wall = wallThickness || 2;
    const base = this.vOff;

    // Outer surface: displaced
    for (let r = 0; r <= rows; r++) {
      const z = zStart + (r / rows) * height;
      for (let c = 0; c <= cols; c++) {
        const angle = (c / cols) * Math.PI * 2;
        // Sample height
        const gr = Math.min(r, rows - 1), gc = c % cols;
        const h = grid[gr][gc] || 0;
        const outerR = radius + h * maxDisplacement;
        this._addVertex(cx + Math.cos(angle) * outerR, cy + Math.sin(angle) * outerR, z);
      }
    }

    // Inner surface: smooth cylinder
    const innerR = radius - wall;
    for (let r = 0; r <= rows; r++) {
      const z = zStart + (r / rows) * height;
      for (let c = 0; c <= cols; c++) {
        const angle = (c / cols) * Math.PI * 2;
        this._addVertex(cx + Math.cos(angle) * innerR, cy + Math.sin(angle) * innerR, z);
      }
    }

    const stride = cols + 1;
    const outerBase = base;
    const innerBase = base + stride * (rows + 1);

    // Outer surface triangles
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const tl = outerBase + r * stride + c, tr = tl + 1;
        const bl = tl + stride, br = bl + 1;
        this._addTri(tl, bl, tr); this._addTri(tr, bl, br);
      }
    }

    // Inner surface triangles (reversed)
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const tl = innerBase + r * stride + c, tr = tl + 1;
        const bl = tl + stride, br = bl + 1;
        this._addTri(tl, tr, bl); this._addTri(tr, br, bl);
      }
    }

    // Bottom ring cap
    for (let c = 0; c < cols; c++) {
      const oo = outerBase + c, on = oo + 1;
      const io = innerBase + c, in_ = io + 1;
      this._addTri(oo, on, in_); this._addTri(oo, in_, io);
    }
    // Top ring cap
    for (let c = 0; c < cols; c++) {
      const oo = outerBase + rows * stride + c, on = oo + 1;
      const io = innerBase + rows * stride + c, in_ = io + 1;
      this._addTri(oo, in_, on); this._addTri(oo, io, in_);
    }
  }
}
