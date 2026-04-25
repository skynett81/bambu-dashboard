/**
 * Scene Builder — compose a Tinkercad-style multi-shape scene into a
 * single indexed mesh.
 *
 * A scene is JSON of the shape:
 *   {
 *     name: 'My Scene',
 *     shapes: [
 *       {
 *         id: 's1',
 *         name: 'Box 1',
 *         type: 'box' | 'sphere' | 'cylinder' | 'cone' | 'torus' | 'prism' | 'pyramid',
 *         params: { ... type-specific dimensions ... },
 *         transform: { px, py, pz, rx, ry, rz, sx, sy, sz },
 *         color: '#hex',
 *         hole: false
 *       },
 *       ...
 *     ]
 *   }
 *
 * This builder applies each shape's transform (rotation, scale,
 * translation in that order — standard SRT compose) and concatenates
 * the non-hole shapes via unionMeshes. Holes are skipped for now —
 * actual CSG subtraction is left for a follow-up using manifold-3d.
 *
 * Returns the indexed mesh ready for repair / format-converter / export.
 */

import {
  box, sphere, cylinder, cone, torus, prism, pyramid, unionMeshes,
} from './mesh-primitives.js';

// ── Transform helpers ─────────────────────────────────────────────────

function _rotateXYZ(x, y, z, rx, ry, rz) {
  // Apply rotation X then Y then Z (intrinsic). Standard SRT order.
  // Rotation X
  const cx = Math.cos(rx), sx = Math.sin(rx);
  let y1 = y * cx - z * sx;
  let z1 = y * sx + z * cx;
  let x1 = x;
  // Rotation Y
  const cy = Math.cos(ry), sy = Math.sin(ry);
  let x2 = x1 * cy + z1 * sy;
  let z2 = -x1 * sy + z1 * cy;
  let y2 = y1;
  // Rotation Z
  const cz = Math.cos(rz), sz = Math.sin(rz);
  return [
    x2 * cz - y2 * sz,
    x2 * sz + y2 * cz,
    z2,
  ];
}

function _applyTransform(mesh, t) {
  if (!t) return mesh;
  const sx = t.sx ?? 1, sy = t.sy ?? 1, sz = t.sz ?? 1;
  const rx = t.rx ?? 0, ry = t.ry ?? 0, rz = t.rz ?? 0;
  const px = t.px ?? 0, py = t.py ?? 0, pz = t.pz ?? 0;
  const out = new Float32Array(mesh.positions.length);
  for (let i = 0; i < mesh.positions.length; i += 3) {
    let x = mesh.positions[i] * sx;
    let y = mesh.positions[i + 1] * sy;
    let z = mesh.positions[i + 2] * sz;
    if (rx || ry || rz) {
      [x, y, z] = _rotateXYZ(x, y, z, rx, ry, rz);
    }
    out[i] = x + px;
    out[i + 1] = y + py;
    out[i + 2] = z + pz;
  }
  return { positions: out, indices: new Uint32Array(mesh.indices) };
}

// ── Primitive dispatch ────────────────────────────────────────────────

function _buildShape(type, p = {}) {
  switch (type) {
    case 'box':      return box(p.w || 20, p.h || 20, p.d || 20);
    case 'sphere':   return sphere(p.r || 10, p.segments || 24, p.rings || 16);
    case 'cylinder': return cylinder(p.r || 10, p.h || 20, p.segments || 32);
    case 'cone':     return cone(p.r1 || 10, p.r2 || 0, p.h || 20, p.segments || 32);
    case 'torus':    return torus(p.R || 15, p.r || 5, p.ringSegs || 32, p.tubeSegs || 16);
    case 'prism':    return prism(p.sides || 6, p.r || 10, p.h || 20);
    case 'pyramid':  return pyramid(p.w || 20, p.h || 20);
    default: throw new Error(`scene-builder: unsupported primitive type '${type}'`);
  }
}

// ── Public API ────────────────────────────────────────────────────────

/**
 * Validate a scene object. Throws on malformed input.
 *
 * @param {object} scene
 */
export function validateScene(scene) {
  if (!scene || typeof scene !== 'object') throw new Error('scene must be an object');
  if (!Array.isArray(scene.shapes)) throw new Error('scene.shapes must be an array');
  if (scene.shapes.length === 0) throw new Error('scene must contain at least one shape');
  for (const s of scene.shapes) {
    if (!s.type) throw new Error('shape.type required');
    if (!['box', 'sphere', 'cylinder', 'cone', 'torus', 'prism', 'pyramid'].includes(s.type)) {
      throw new Error(`unsupported shape.type '${s.type}'`);
    }
  }
  return true;
}

/**
 * Compose a scene into a single indexed mesh.
 *
 * @param {object} scene - validated scene JSON
 * @param {object} [opts] - { includeHoles: false } - if true, holes are
 *   included as solids (useful for visualisation; usually false)
 * @returns {{positions: Float32Array, indices: Uint32Array}}
 */
export function buildScene(scene, opts = {}) {
  validateScene(scene);
  const includeHoles = opts.includeHoles === true;
  const meshes = [];
  for (const s of scene.shapes) {
    if (!includeHoles && s.hole) continue;
    const base = _buildShape(s.type, s.params || {});
    const transformed = _applyTransform(base, s.transform);
    meshes.push(transformed);
  }
  if (meshes.length === 0) {
    throw new Error('scene yielded no visible shapes (all marked as holes?)');
  }
  return unionMeshes(meshes);
}

/**
 * Build a default scene with one example shape — used as the starting
 * point for new "untitled" projects.
 */
export function defaultScene() {
  return {
    name: 'Untitled Scene',
    shapes: [
      {
        id: 's1',
        name: 'Box',
        type: 'box',
        params: { w: 20, h: 20, d: 20 },
        transform: { px: 0, py: 0, pz: 0, rx: 0, ry: 0, rz: 0, sx: 1, sy: 1, sz: 1 },
        color: '#3b82f6',
        hole: false,
      },
    ],
  };
}

export const _internals = { _rotateXYZ, _applyTransform, _buildShape };
