/**
 * Headphone Stand Generator
 *
 * A classic T-shaped desktop headphone stand: a base slab, a vertical
 * column, and a curved yoke at the top where the headband rests.
 *
 * The yoke is approximated with a thick cylinder (cross-bar) that runs
 * horizontally across the column. The curvature is provided by printing
 * at an orientation that allows the cylinder to serve as a smooth arch
 * for the headband.
 */

import { MeshBuilder, getLib } from '../mesh-builder.js';
import { num } from './_shared/validate.js';

/** @typedef {object} HeadphoneStandOptions
 * @property {number} [baseWidth=100]
 * @property {number} [baseDepth=100]
 * @property {number} [baseHeight=6]
 * @property {number} [columnHeight=220]
 * @property {number} [columnThickness=12]
 * @property {number} [yokeLength=80]
 * @property {number} [yokeRadius=8]
 */

/**
 * @param {HeadphoneStandOptions} opts
 * @returns {Promise<Buffer>}
 */
export async function generateHeadphoneStand3MF(opts = {}) {
  const bw = num(opts.baseWidth, 50, 200, 100);
  const bd = num(opts.baseDepth, 50, 200, 100);
  const bh = num(opts.baseHeight, 3, 20, 6);
  const ch = num(opts.columnHeight, 100, 400, 220);
  const ct = num(opts.columnThickness, 8, 30, 12);
  const yl = num(opts.yokeLength, 40, 150, 80);
  const yr = num(opts.yokeRadius, 4, 15, 8);

  const lib = await getLib();
  const wrapper = new lib.CWrapper();
  const model = wrapper.CreateModel();

  try {
    const matGroup = model.AddBaseMaterialGroup();
    const mgId = matGroup.GetResourceID();
    const col = new lib.sColor();
    col.set_Red(40); col.set_Green(50); col.set_Blue(70); col.set_Alpha(255);
    const matIdx = matGroup.AddMaterial('Stand', col);
    col.delete();

    const mesh = model.AddMeshObject();
    mesh.SetName(`Headphone Stand ${ch}mm`);
    mesh.SetObjectLevelProperty(mgId, matIdx);
    const mb = new MeshBuilder(lib, mesh);

    // Base
    mb.addBox(0, 0, 0, bw, bd, bh);
    // Column — vertical rectangular bar centered on base
    const cx = bw / 2 - ct / 2;
    const cy = bd / 2 - ct / 2;
    mb.addBox(cx, cy, bh, ct, ct, ch);

    // Yoke — a horizontal cylinder across the top. Because MeshBuilder
    // extrudes cylinders along +Z, we build the cross-bar as an
    // X-aligned tube with direct vertex emission.
    const yz = bh + ch + yr;
    const yxA = bw / 2 - yl / 2;
    const yxB = bw / 2 + yl / 2;
    const ycy = bd / 2;
    buildXCylinder(mb, yxA, yxB, ycy, yz, yr, 24);

    model.AddBuildItem(mesh, wrapper.GetIdentityTransform());

    const mdg = model.GetMetaDataGroup();
    const addMd = (k, v) => { const m = mdg.AddMetaData('', k, v, 'string', true); m.delete(); };
    addMd('Title', `Headphone Stand ${ch}mm`);
    addMd('Application', '3DPrintForge Model Forge');
    addMd('CreationDate', new Date().toISOString().split('T')[0]);

    const vfsPath = `/headphone_stand_${Date.now()}.3mf`;
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

/** X-aligned capped cylinder via direct vertex emission. */
function buildXCylinder(mb, xA, xB, cy, cz, r, segs) {
  const base = mb.vOff;
  // End-cap centers
  const cA = mb._addVertex(xA, cy, cz);
  const cB = mb._addVertex(xB, cy, cz);
  // Ring vertices (2 per segment: one at each end)
  for (let i = 0; i < segs; i++) {
    const a = (i / segs) * Math.PI * 2;
    const dy = Math.cos(a) * r;
    const dz = Math.sin(a) * r;
    mb._addVertex(xA, cy + dy, cz + dz);
    mb._addVertex(xB, cy + dy, cz + dz);
  }
  for (let i = 0; i < segs; i++) {
    const n = (i + 1) % segs;
    const a = base + 2 + i * 2, b = a + 1;   // ring at xA, ring at xB
    const na = base + 2 + n * 2, nb = na + 1;
    // End cap at xA — fan from cA, normal facing -X (reversed winding)
    mb._addTri(cA, na, a);
    // End cap at xB — fan from cB, normal facing +X
    mb._addTri(cB, b, nb);
    // Side wall
    mb._addTri(a, na, nb);
    mb._addTri(a, nb, b);
  }
}
