/**
 * Wall Hook Generator
 *
 * Generates a simple wall-mounted peg hook: a vertical back plate with
 * two screw holes and a horizontal peg sticking out. Suitable for hanging
 * keys, bags, cables, towels.
 *
 * The back plate and its screw holes are built as a watertight heightmap
 * (plate + circular pockets for the screw heads), and the peg is added as
 * a Y-aligned cylinder via direct vertex emission.
 */

import { MeshBuilder, getLib } from '../mesh-builder.js';
import { num } from './_shared/validate.js';

const CELL_RES = 0.5;

/** @typedef {object} HookOptions
 * @property {number} [plateHeight=60]
 * @property {number} [plateWidth=25]
 * @property {number} [plateThickness=4]
 * @property {number} [pegLength=40]
 * @property {number} [pegRadius=4]
 * @property {number} [screwHoleRadius=2.2]
 */

/**
 * @param {HookOptions} opts
 * @returns {Promise<Buffer>}
 */
export async function generateHook3MF(opts = {}) {
  const pH = num(opts.plateHeight, 20, 200, 60);
  const pW = num(opts.plateWidth, 15, 80, 25);
  const pT = num(opts.plateThickness, 2, 10, 4);
  const pegLen = num(opts.pegLength, 15, 120, 40);
  const pegR = num(opts.pegRadius, 2, 12, 4);
  const screwR = num(opts.screwHoleRadius, 1, 6, 2.2);

  // Build the plate as a simple box (no heightmap needed for a plain plate)
  const lib = await getLib();
  const wrapper = new lib.CWrapper();
  const model = wrapper.CreateModel();

  try {
    const matGroup = model.AddBaseMaterialGroup();
    const mgId = matGroup.GetResourceID();
    const col = new lib.sColor();
    col.set_Red(160); col.set_Green(140); col.set_Blue(110); col.set_Alpha(255);
    const matIdx = matGroup.AddMaterial('Hook', col);
    col.delete();

    // Plate with screw holes — use heightmap so holes are real geometry.
    // Plate is vertical (in XZ plane), thickness along Y.
    const cols = Math.round(pW / CELL_RES);
    const rows = Math.round(pH / CELL_RES);
    const grid = new Array(rows);
    const screwY1 = pH * 0.18;
    const screwY2 = pH * 0.82;
    const screwX = pW / 2;
    for (let r = 0; r < rows; r++) {
      const row = new Array(cols);
      const py = (r + 0.5) * CELL_RES;
      for (let c = 0; c < cols; c++) {
        const px = (c + 0.5) * CELL_RES;
        const d1 = Math.hypot(px - screwX, py - screwY1);
        const d2 = Math.hypot(px - screwX, py - screwY2);
        if (d1 < screwR || d2 < screwR) {
          row[c] = 0.0; // hole
        } else {
          row[c] = 1.0; // full plate
        }
      }
      grid[r] = row;
    }

    const mesh = model.AddMeshObject();
    mesh.SetName(`Wall Hook ${pW}x${pH}mm`);
    mesh.SetObjectLevelProperty(mgId, matIdx);
    const mb = new MeshBuilder(lib, mesh);

    // Plate: heightmap renders in XY at Z=0 by default. We want the plate
    // vertical (standing up), so we treat the heightmap Z axis as the Y axis
    // by using addHeightmapSurface then... actually, simpler: just build the
    // plate in the XY plane and add the peg in +Y (perpendicular to plate).
    // The final model's "wall" is the bottom of the heightmap (Z=0 plane).
    // We document this so the user orients the print correctly.
    mb.addHeightmapSurface(0, 0, 0, grid, CELL_RES, 0.0001, pT);

    // Peg: Y-aligned cylinder extending from the front face of the plate.
    // Front face is at Z = pT. Peg starts there, goes to Z = pT + pegLen.
    // Placed at center of plate horizontally, 40% from top vertically.
    mb.addCylinder(pW / 2, pH * 0.55, pT, pegR, pegLen, 24);

    model.AddBuildItem(mesh, wrapper.GetIdentityTransform());

    const mdg = model.GetMetaDataGroup();
    const addMd = (k, v) => { const m = mdg.AddMetaData('', k, v, 'string', true); m.delete(); };
    addMd('Title', `Wall Hook ${pW}x${pH}mm`);
    addMd('Application', '3DPrintForge Model Forge');
    addMd('CreationDate', new Date().toISOString().split('T')[0]);

    const vfsPath = `/hook_${Date.now()}.3mf`;
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
