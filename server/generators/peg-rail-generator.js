/**
 * Multi-hook Wall Peg Rail Generator
 *
 * A horizontal wall rail with multiple evenly-spaced pegs sticking out
 * the front. Back plate has screw mounting holes at each end.
 *
 * Built from a heightmap back plate + cylindrical pegs added as separate
 * watertight primitives.
 */

import { MeshBuilder, getLib } from '../mesh-builder.js';
import { int, num } from './_shared/validate.js';

const CELL_RES = 0.5;

/** @typedef {object} PegRailOptions
 * @property {number} [length=180]
 * @property {number} [height=40]
 * @property {number} [thickness=4]
 * @property {number} [pegCount=5]
 * @property {number} [pegLength=35]
 * @property {number} [pegRadius=3.5]
 * @property {number} [screwHoleRadius=2.2]
 */

/**
 * @param {PegRailOptions} opts
 * @returns {Promise<Buffer>}
 */
export async function generatePegRail3MF(opts = {}) {
  const len = num(opts.length, 60, 600, 180);
  const height = num(opts.height, 20, 120, 40);
  const thickness = num(opts.thickness, 3, 10, 4);
  const pegCount = int(opts.pegCount, 2, 20, 5);
  const pegLen = num(opts.pegLength, 15, 120, 35);
  const pegR = num(opts.pegRadius, 2, 12, 3.5);
  const screwR = num(opts.screwHoleRadius, 1, 5, 2.2);

  const cols = Math.round(len / CELL_RES);
  const rows = Math.round(height / CELL_RES);
  const grid = new Array(rows);
  for (let r = 0; r < rows; r++) {
    const row = new Array(cols);
    const py = (r + 0.5) * CELL_RES;
    for (let c = 0; c < cols; c++) {
      const px = (c + 0.5) * CELL_RES;
      // Two screw holes — near each end vertically centered
      const d1 = Math.hypot(px - 10, py - height / 2);
      const d2 = Math.hypot(px - (len - 10), py - height / 2);
      row[c] = (d1 < screwR || d2 < screwR) ? 0.0 : 1.0;
    }
    grid[r] = row;
  }

  const lib = await getLib();
  const wrapper = new lib.CWrapper();
  const model = wrapper.CreateModel();

  try {
    const matGroup = model.AddBaseMaterialGroup();
    const mgId = matGroup.GetResourceID();
    const col = new lib.sColor();
    col.set_Red(150); col.set_Green(120); col.set_Blue(90); col.set_Alpha(255);
    const matIdx = matGroup.AddMaterial('PegRail', col);
    col.delete();

    const mesh = model.AddMeshObject();
    mesh.SetName(`Peg Rail ${len}mm ${pegCount}p`);
    mesh.SetObjectLevelProperty(mgId, matIdx);
    const mb = new MeshBuilder(lib, mesh);

    // Back plate
    mb.addHeightmapSurface(0, 0, 0, grid, CELL_RES, 0.0001, thickness);

    // Pegs — evenly spaced along the rail, centered vertically
    const edgeMargin = 20; // keep first/last peg away from screw holes
    const pegSpacing = (len - edgeMargin * 2) / (pegCount - 1 || 1);
    for (let i = 0; i < pegCount; i++) {
      const x = edgeMargin + i * pegSpacing;
      mb.addCylinder(x, height / 2, thickness, pegR, pegLen, 24);
    }

    model.AddBuildItem(mesh, wrapper.GetIdentityTransform());

    const mdg = model.GetMetaDataGroup();
    const addMd = (k, v) => { const m = mdg.AddMetaData('', k, v, 'string', true); m.delete(); };
    addMd('Title', `Peg Rail ${len}mm`);
    addMd('Application', '3DPrintForge Model Forge');
    addMd('Description', `${pegCount} pegs`);
    addMd('CreationDate', new Date().toISOString().split('T')[0]);

    const vfsPath = `/peg_rail_${Date.now()}.3mf`;
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
