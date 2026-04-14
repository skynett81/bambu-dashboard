/**
 * Cable Management Clip Generator
 *
 * A small C-shaped clip that snaps around a cable and has a flat base
 * intended for double-sided tape or a single screw.
 *
 * Built as three simple boxes forming a "C" in the YZ plane extruded
 * along X. The opening is slightly smaller than the cable diameter so
 * flexible filaments (PETG/TPU) give a snappy fit.
 */

import { MeshBuilder, getLib } from '../mesh-builder.js';
import { num } from './_shared/validate.js';

/** @typedef {object} CableClipOptions
 * @property {number} [cableDiameter=6]
 * @property {number} [clipLength=10]
 * @property {number} [wallThickness=1.8]
 * @property {number} [baseExtra=6]
 */

/**
 * @param {CableClipOptions} opts
 * @returns {Promise<Buffer>}
 */
export async function generateCableClip3MF(opts = {}) {
  const cd = num(opts.cableDiameter, 1, 30, 6);
  const len = num(opts.clipLength, 4, 40, 10);
  const wall = num(opts.wallThickness, 1, 4, 1.8);
  const baseExtra = num(opts.baseExtra, 2, 20, 6);

  const outerW = cd + wall * 2 + baseExtra * 2;
  const outerH = cd + wall * 2;

  const lib = await getLib();
  const wrapper = new lib.CWrapper();
  const model = wrapper.CreateModel();

  try {
    const matGroup = model.AddBaseMaterialGroup();
    const mgId = matGroup.GetResourceID();
    const col = new lib.sColor();
    col.set_Red(200); col.set_Green(200); col.set_Blue(210); col.set_Alpha(255);
    const matIdx = matGroup.AddMaterial('Clip', col);
    col.delete();

    const mesh = model.AddMeshObject();
    mesh.SetName(`Cable Clip ⌀${cd}mm`);
    mesh.SetObjectLevelProperty(mgId, matIdx);
    const mb = new MeshBuilder(lib, mesh);

    // Base slab
    mb.addBox(0, 0, 0, outerW, len, wall);
    // Left wall of C
    const wallX = baseExtra;
    mb.addBox(wallX, 0, wall, wall, len, cd);
    // Right wall of C
    mb.addBox(wallX + wall + cd, 0, wall, wall, len, cd);
    // Top retaining bar — slight inward overhang to hold the cable in
    const overhang = Math.min(0.8, cd * 0.1);
    mb.addBox(wallX - overhang, 0, wall + cd, wall * 2 + cd + overhang * 2, len, wall);

    model.AddBuildItem(mesh, wrapper.GetIdentityTransform());

    const mdg = model.GetMetaDataGroup();
    const addMd = (k, v) => { const m = mdg.AddMetaData('', k, v, 'string', true); m.delete(); };
    addMd('Title', `Cable Clip ⌀${cd}mm`);
    addMd('Application', '3DPrintForge Model Forge');
    addMd('CreationDate', new Date().toISOString().split('T')[0]);

    const vfsPath = `/cable_clip_${Date.now()}.3mf`;
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
