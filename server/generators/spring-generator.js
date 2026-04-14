/**
 * Compression Spring Generator
 *
 * Generates a printable helical compression spring with configurable coil
 * count, coil diameter, wire thickness, and pitch. Uses MeshBuilder's
 * `addHelicalTube` primitive which produces a watertight helical coil with
 * a circular cross-section and capped ends.
 *
 * Printing notes:
 *   - Use a flexible filament (TPU/TPE) for a functional spring
 *   - PLA/PETG works for decorative or very light duty springs only
 *   - Increase wall count in your slicer for more stiffness
 */

import { MeshBuilder, getLib } from '../mesh-builder.js';
import { int, num } from './_shared/validate.js';

/**
 * @typedef {object} SpringOptions
 * @property {number} [coils=8]         - number of full turns (2..40)
 * @property {number} [diameter=20]     - coil outer diameter (mm)
 * @property {number} [wireDiameter=2]  - wire thickness (mm)
 * @property {number} [pitch=4]         - vertical distance per coil (mm)
 */

/**
 * @param {SpringOptions} opts
 * @returns {Promise<Buffer>}
 */
export async function generateSpring3MF(opts = {}) {
  const coils = int(opts.coils, 2, 40, 8);
  const diameter = num(opts.diameter, 4, 100, 20);
  const wireDiameter = num(opts.wireDiameter, 0.6, 10, 2);
  const pitch = num(opts.pitch, wireDiameter + 0.3, 20, 4);

  const majorR = diameter / 2 - wireDiameter / 2;
  const wireR = wireDiameter / 2;

  const lib = await getLib();
  const wrapper = new lib.CWrapper();
  const model = wrapper.CreateModel();

  try {
    const matGroup = model.AddBaseMaterialGroup();
    const mgId = matGroup.GetResourceID();
    const col = new lib.sColor();
    col.set_Red(160); col.set_Green(160); col.set_Blue(170); col.set_Alpha(255);
    const matIdx = matGroup.AddMaterial('Spring', col);
    col.delete();

    const mesh = model.AddMeshObject();
    mesh.SetName(`Spring ${diameter}x${coils}c`);
    mesh.SetObjectLevelProperty(mgId, matIdx);
    const mb = new MeshBuilder(lib, mesh);

    mb.addHelicalTube(0, 0, 0, majorR, pitch, coils, wireR, 32, 10);

    model.AddBuildItem(mesh, wrapper.GetIdentityTransform());

    const mdg = model.GetMetaDataGroup();
    const addMd = (k, v) => { const m = mdg.AddMetaData('', k, v, 'string', true); m.delete(); };
    addMd('Title', `Spring ${diameter}mm x ${coils} coils`);
    addMd('Application', '3DPrintForge Model Forge');
    addMd('CreationDate', new Date().toISOString().split('T')[0]);

    const vfsPath = `/spring_${Date.now()}.3mf`;
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
