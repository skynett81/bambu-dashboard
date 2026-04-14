/**
 * Wall Bracket (L-bracket) Generator
 *
 * Generates an L-shaped wall bracket — a vertical back plate joined at a
 * right angle to a horizontal shelf plate. Screw holes are drilled
 * through the back plate for wall mounting and optionally through the
 * shelf plate as well.
 *
 * Built as two heightmap meshes (one per plate) plus a fillet rib along
 * the inside of the corner for strength. Screw holes are real geometry
 * via the heightmap approach used elsewhere in Model Forge.
 */

import { MeshBuilder, getLib } from '../mesh-builder.js';
import { num, bool } from './_shared/validate.js';

const CELL_RES = 0.6;

/** @typedef {object} WallBracketOptions
 * @property {number} [shelfLength=60]     - horizontal arm length (mm)
 * @property {number} [backHeight=80]      - vertical arm height (mm)
 * @property {number} [width=40]           - bracket width (mm)
 * @property {number} [thickness=4]        - plate thickness (mm)
 * @property {number} [screwHoleRadius=2.2]
 * @property {boolean} [gusset=true]       - add a triangular gusset rib
 */

/**
 * @param {WallBracketOptions} opts
 * @returns {Promise<Buffer>}
 */
export async function generateWallBracket3MF(opts = {}) {
  const shelfLen = num(opts.shelfLength, 20, 200, 60);
  const backH = num(opts.backHeight, 20, 200, 80);
  const width = num(opts.width, 15, 120, 40);
  const thickness = num(opts.thickness, 3, 10, 4);
  const screwR = num(opts.screwHoleRadius, 1, 6, 2.2);
  const gusset = bool(opts.gusset, true);

  const lib = await getLib();
  const wrapper = new lib.CWrapper();
  const model = wrapper.CreateModel();

  try {
    const matGroup = model.AddBaseMaterialGroup();
    const mgId = matGroup.GetResourceID();
    const col = new lib.sColor();
    col.set_Red(120); col.set_Green(125); col.set_Blue(135); col.set_Alpha(255);
    const matIdx = matGroup.AddMaterial('Bracket', col);
    col.delete();

    const mesh = model.AddMeshObject();
    mesh.SetName(`Wall Bracket ${shelfLen}x${backH}mm`);
    mesh.SetObjectLevelProperty(mgId, matIdx);
    const mb = new MeshBuilder(lib, mesh);

    // Back plate (vertical) — heightmap in the XZ plane.
    // Use YX grid where Y axis = height, X axis = width.
    const backCols = Math.round(width / CELL_RES);
    const backRows = Math.round(backH / CELL_RES);
    const backGrid = new Array(backRows);
    for (let r = 0; r < backRows; r++) {
      const row = new Array(backCols);
      const py = (r + 0.5) * CELL_RES;
      for (let c = 0; c < backCols; c++) {
        const px = (c + 0.5) * CELL_RES;
        // Two screw holes: top and bottom centered horizontally
        const d1 = Math.hypot(px - width / 2, py - backH * 0.2);
        const d2 = Math.hypot(px - width / 2, py - backH * 0.8);
        row[c] = (d1 < screwR || d2 < screwR) ? 0.0 : 1.0;
      }
      backGrid[r] = row;
    }
    // Place the back plate at its natural heightmap position (XY), then the
    // shelf will be added translated so the corner meets at origin.
    mb.addHeightmapSurface(0, 0, 0, backGrid, CELL_RES, 0.0001, thickness);

    // Shelf plate — also in the XY plane but translated so it extends in +Y
    // from the top edge of the back plate. We place it adjacent so the
    // corner is one contiguous volume.
    const shelfCols = Math.round(width / CELL_RES);
    const shelfRows = Math.round(shelfLen / CELL_RES);
    const shelfGrid = new Array(shelfRows);
    for (let r = 0; r < shelfRows; r++) {
      const row = new Array(shelfCols);
      const py = (r + 0.5) * CELL_RES;
      for (let c = 0; c < shelfCols; c++) {
        const px = (c + 0.5) * CELL_RES;
        // Shelf gets one screw hole in the center for fastening items to it
        const d = Math.hypot(px - width / 2, py - shelfLen * 0.7);
        row[c] = d < screwR ? 0.0 : 1.0;
      }
      shelfGrid[r] = row;
    }
    // The shelf is a plate resting on top of the back plate, offset by
    // backH in Y. Its "thickness" is still along Z.
    mb.addHeightmapSurface(0, backH, 0, shelfGrid, CELL_RES, 0.0001, thickness);

    // Gusset — a right triangle filling the inside corner for strength.
    // Built from a stack of boxes approximating a triangle.
    if (gusset) {
      const gussetSize = Math.min(shelfLen, backH) * 0.6;
      const gussetThickness = Math.max(2, thickness - 1);
      const steps = 8;
      for (let i = 0; i < steps; i++) {
        const stepLen = gussetSize * (1 - i / steps);
        const zStep = gussetSize * (i / steps);
        mb.addBox(
          width / 2 - gussetThickness / 2,
          backH - stepLen,
          thickness + zStep * (gussetSize / steps),
          gussetThickness,
          stepLen,
          gussetSize / steps + 0.2
        );
      }
    }

    model.AddBuildItem(mesh, wrapper.GetIdentityTransform());

    const mdg = model.GetMetaDataGroup();
    const addMd = (k, v) => { const m = mdg.AddMetaData('', k, v, 'string', true); m.delete(); };
    addMd('Title', `Wall Bracket ${shelfLen}x${backH}mm`);
    addMd('Application', '3DPrintForge Model Forge');
    addMd('CreationDate', new Date().toISOString().split('T')[0]);

    const vfsPath = `/bracket_${Date.now()}.3mf`;
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
