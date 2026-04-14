/**
 * Plant Pot Generator
 *
 * Generates a tapered plant pot (truncated cone) with a flat bottom. The
 * wall is hollow and builds as a surface of revolution.
 *
 * Drain holes are not included in v1 because hollow-wall pots with radial
 * drains require CSG. Users can drill drain holes after printing or print
 * without them for indoor decorative pots.
 */

import { MeshBuilder, getLib } from '../mesh-builder.js';
import { num } from './_shared/validate.js';

/** @typedef {object} PlantPotOptions
 * @property {number} [topDiameter=80]
 * @property {number} [bottomDiameter=55]
 * @property {number} [height=90]
 * @property {number} [wallThickness=2.5]
 */

/**
 * @param {PlantPotOptions} opts
 * @returns {Promise<Buffer>}
 */
export async function generatePlantPot3MF(opts = {}) {
  const topD = num(opts.topDiameter, 20, 300, 80);
  const botD = num(opts.bottomDiameter, 15, 280, 55);
  const height = num(opts.height, 20, 300, 90);
  const wall = num(opts.wallThickness, 1.5, 6, 2.5);

  const topR = topD / 2;
  const botR = botD / 2;

  const lib = await getLib();
  const wrapper = new lib.CWrapper();
  const model = wrapper.CreateModel();

  try {
    const matGroup = model.AddBaseMaterialGroup();
    const mgId = matGroup.GetResourceID();
    const col = new lib.sColor();
    col.set_Red(180); col.set_Green(120); col.set_Blue(80); col.set_Alpha(255);
    const matIdx = matGroup.AddMaterial('Pot', col);
    col.delete();

    const mesh = model.AddMeshObject();
    mesh.SetName(`Plant Pot ${topD}x${height}mm`);
    mesh.SetObjectLevelProperty(mgId, matIdx);
    const mb = new MeshBuilder(lib, mesh);

    // Use revolution profile: linear taper from botR at z=0 to topR at z=height.
    // Wall thickness is applied inside addRevolutionSurface.
    const profile = (z) => botR + (topR - botR) * (z / height);
    mb.addRevolutionSurface(0, 0, 0, profile, 32, height, 48, wall);
    // Add a flat bottom disk (inside the hollow revolution).
    // addRevolutionSurface with wall > 0 produces top and bottom ring caps
    // so there's no need to add a separate floor. However, the pot interior
    // should have a FLAT bottom at z = wall height — add a small disc.
    mb.addCylinder(0, 0, 0, botR - wall, wall, 32);

    model.AddBuildItem(mesh, wrapper.GetIdentityTransform());

    const mdg = model.GetMetaDataGroup();
    const addMd = (k, v) => { const m = mdg.AddMetaData('', k, v, 'string', true); m.delete(); };
    addMd('Title', `Plant Pot ${topD}x${height}mm`);
    addMd('Application', '3DPrintForge Model Forge');
    addMd('CreationDate', new Date().toISOString().split('T')[0]);

    const vfsPath = `/plant_pot_${Date.now()}.3mf`;
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
