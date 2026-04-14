/**
 * Miniature Base Generator
 *
 * Generates round bases for tabletop miniatures (D&D, Warhammer, etc).
 * Common sizes: 25mm, 32mm, 40mm, 50mm round lips. Supports optional
 * magnet hole in the bottom and a raised inner lip to "seat" the figure.
 *
 * Built from a watertight base cylinder, an optional inner ring rim,
 * and an optional magnet pocket placed as a solid cylinder that sinks
 * into the bottom face — though without CSG the "pocket" is really a
 * small indicator ring. Users can drill a real pocket with a hand drill.
 */

import { MeshBuilder, getLib } from '../mesh-builder.js';
import { num, bool } from './_shared/validate.js';

/** @typedef {object} MiniBaseOptions
 * @property {number} [diameter=32]
 * @property {number} [thickness=3]
 * @property {number} [lipHeight=1]      - inner raised lip (0 = flat)
 * @property {number} [lipInset=1.5]
 * @property {boolean} [magnetIndicator=false]
 */

/**
 * @param {MiniBaseOptions} opts
 * @returns {Promise<Buffer>}
 */
export async function generateMiniBase3MF(opts = {}) {
  const D = num(opts.diameter, 15, 120, 32);
  const T = num(opts.thickness, 1.5, 15, 3);
  const lipH = num(opts.lipHeight, 0, 4, 1);
  const lipInset = num(opts.lipInset, 0.5, 6, 1.5);
  const magnet = bool(opts.magnetIndicator, false);

  const lib = await getLib();
  const wrapper = new lib.CWrapper();
  const model = wrapper.CreateModel();

  try {
    const matGroup = model.AddBaseMaterialGroup();
    const mgId = matGroup.GetResourceID();
    const col = new lib.sColor();
    col.set_Red(60); col.set_Green(60); col.set_Blue(60); col.set_Alpha(255);
    const matIdx = matGroup.AddMaterial('MiniBase', col);
    col.delete();

    const mesh = model.AddMeshObject();
    mesh.SetName(`Mini Base ${D}mm`);
    mesh.SetObjectLevelProperty(mgId, matIdx);
    const mb = new MeshBuilder(lib, mesh);

    const r = D / 2;

    // Main base disc
    mb.addCylinder(0, 0, 0, r, T, 48);

    // Raised inner lip — a small ring on top, inset from the outer edge
    if (lipH > 0) {
      const innerR = r - lipInset;
      const innerR2 = innerR - 0.8;
      mb.addTube(0, 0, T, innerR, innerR2, lipH, 48);
    }

    // Magnet indicator — a very shallow pocket ring underside
    if (magnet) {
      mb.addTube(0, 0, -0.3, 3.5, 3.0, 0.3, 24);
    }

    model.AddBuildItem(mesh, wrapper.GetIdentityTransform());

    const mdg = model.GetMetaDataGroup();
    const addMd = (k, v) => { const m = mdg.AddMetaData('', k, v, 'string', true); m.delete(); };
    addMd('Title', `Miniature Base ${D}mm`);
    addMd('Application', '3DPrintForge Model Forge');
    addMd('CreationDate', new Date().toISOString().split('T')[0]);

    const vfsPath = `/mini_base_${Date.now()}.3mf`;
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
