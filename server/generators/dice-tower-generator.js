/**
 * Dice Tower Generator
 *
 * A compact tabletop dice tower — dice dropped in the top bounce off
 * internal ramps and tumble out of the side opening. Built from boxes
 * + triangular prism ramps (the same technique used by the phone stand).
 *
 * Geometry:
 *   - Outer box (4 walls + floor + top opening)
 *   - Two slanted ramps inside, alternating direction, so a die hits
 *     each ramp in sequence and loses energy
 *   - Front exit chute at the bottom
 */

import { MeshBuilder, getLib } from '../mesh-builder.js';
import { num } from './_shared/validate.js';

/** @typedef {object} DiceTowerOptions
 * @property {number} [width=60]
 * @property {number} [depth=50]
 * @property {number} [height=120]
 * @property {number} [wallThickness=2.4]
 */

/**
 * @param {DiceTowerOptions} opts
 * @returns {Promise<Buffer>}
 */
export async function generateDiceTower3MF(opts = {}) {
  const W = num(opts.width, 30, 150, 60);
  const D = num(opts.depth, 30, 150, 50);
  const H = num(opts.height, 60, 250, 120);
  const wall = num(opts.wallThickness, 1.5, 5, 2.4);

  const lib = await getLib();
  const wrapper = new lib.CWrapper();
  const model = wrapper.CreateModel();

  try {
    const matGroup = model.AddBaseMaterialGroup();
    const mgId = matGroup.GetResourceID();
    const col = new lib.sColor();
    col.set_Red(70); col.set_Green(40); col.set_Blue(100); col.set_Alpha(255);
    const matIdx = matGroup.AddMaterial('DiceTower', col);
    col.delete();

    const mesh = model.AddMeshObject();
    mesh.SetName(`Dice Tower ${W}x${D}x${H}mm`);
    mesh.SetObjectLevelProperty(mgId, matIdx);
    const mb = new MeshBuilder(lib, mesh);

    // Floor slab
    mb.addBox(0, 0, 0, W, D, wall);
    // Back wall
    mb.addBox(0, D - wall, 0, W, wall, H);
    // Left wall
    mb.addBox(0, 0, 0, wall, D, H);
    // Right wall
    mb.addBox(W - wall, 0, 0, wall, D, H);
    // Front wall — with an exit chute cut out at the bottom
    const chuteH = 20;
    mb.addBox(0, 0, chuteH, W, wall, H - chuteH);

    // Internal ramps — triangular prisms extruded along X (left->right).
    // Ramp 1: high on the back, low on the front, at ~2/3 height.
    // Ramp 2: mirror, at ~1/3 height.
    const rampY0 = wall;
    const rampY1 = D - wall;
    buildXTrianglePrism(mb,
      wall, W - wall,
      rampY0, rampY1,
      H * 0.5, H * 0.7,
      'backHigh');
    buildXTrianglePrism(mb,
      wall, W - wall,
      rampY0, rampY1,
      H * 0.2, H * 0.35,
      'frontHigh');

    model.AddBuildItem(mesh, wrapper.GetIdentityTransform());

    const mdg = model.GetMetaDataGroup();
    const addMd = (k, v) => { const m = mdg.AddMetaData('', k, v, 'string', true); m.delete(); };
    addMd('Title', `Dice Tower ${W}x${D}x${H}mm`);
    addMd('Application', '3DPrintForge Model Forge');
    addMd('CreationDate', new Date().toISOString().split('T')[0]);

    const vfsPath = `/dice_tower_${Date.now()}.3mf`;
    const writer = model.QueryWriter('3mf');
    writer.WriteToFile(vfsPath);
    const buf = Buffer.from(lib.FS.readFile(vfsPath));
    try { lib.FS.unlink(vfsPath); } catch { /* ignored */ }
    return buf;
  } finally {
    model.delete();
    wrapper.delete();
  }
}

/**
 * Build a triangular prism extruded along X. The triangle lies in the YZ
 * plane with one face tilted — direction determines which end is higher.
 */
function buildXTrianglePrism(mb, xA, xB, y0, y1, z0, z1, direction) {
  const base = mb.vOff;
  // Triangle vertices (YZ plane)
  let p0, p1, p2;
  if (direction === 'backHigh') {
    // High edge at y1 (back), low edge at y0 (front)
    p0 = [y0, z0];
    p1 = [y1, z0];
    p2 = [y1, z1];
  } else {
    p0 = [y0, z0];
    p1 = [y1, z0];
    p2 = [y0, z1];
  }
  // Front face (x=xA)
  mb._addVertex(xA, p0[0], p0[1]);
  mb._addVertex(xA, p1[0], p1[1]);
  mb._addVertex(xA, p2[0], p2[1]);
  // Back face (x=xB)
  mb._addVertex(xB, p0[0], p0[1]);
  mb._addVertex(xB, p1[0], p1[1]);
  mb._addVertex(xB, p2[0], p2[1]);
  // Caps
  mb._addTri(base + 0, base + 2, base + 1);
  mb._addTri(base + 3, base + 4, base + 5);
  // Side walls (three quads)
  mb._addTri(base + 0, base + 1, base + 4); mb._addTri(base + 0, base + 4, base + 3);
  mb._addTri(base + 1, base + 2, base + 5); mb._addTri(base + 1, base + 5, base + 4);
  mb._addTri(base + 2, base + 0, base + 3); mb._addTri(base + 2, base + 3, base + 5);
}
