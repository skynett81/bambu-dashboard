/**
 * Blank Wall Plate Generator
 *
 * Generates a flat wall plate with configurable screw holes — useful as a
 * blank cover for electrical boxes, unused switches, or as a starting
 * base plate for more complex wall-mounted designs.
 *
 * Supports an optional rectangular cutout in the center (for recessed
 * fittings, cable pass-throughs, etc).
 */

import { MeshBuilder, getLib } from '../mesh-builder.js';
import { num, bool } from './_shared/validate.js';

const CELL_RES = 0.5;

/** @typedef {object} WallPlateOptions
 * @property {number} [width=86]         - EU standard (86mm) default
 * @property {number} [height=86]
 * @property {number} [thickness=3]
 * @property {number} [screwSpacing=60]  - distance between screw holes (mm)
 * @property {number} [screwHoleRadius=1.8]
 * @property {boolean} [cutout=false]
 * @property {number} [cutoutWidth=40]
 * @property {number} [cutoutHeight=20]
 */

/**
 * @param {WallPlateOptions} opts
 * @returns {Promise<Buffer>}
 */
export async function generateWallPlate3MF(opts = {}) {
  const W = num(opts.width, 30, 200, 86);
  const H = num(opts.height, 30, 200, 86);
  const T = num(opts.thickness, 2, 10, 3);
  const screwSp = num(opts.screwSpacing, 20, 150, 60);
  const screwR = num(opts.screwHoleRadius, 1, 5, 1.8);
  const cutout = bool(opts.cutout, false);
  const coW = num(opts.cutoutWidth, 5, W - 20, 40);
  const coH = num(opts.cutoutHeight, 5, H - 20, 20);

  const cols = Math.round(W / CELL_RES);
  const rows = Math.round(H / CELL_RES);
  const cx = W / 2;
  const cy = H / 2;

  const grid = new Array(rows);
  for (let r = 0; r < rows; r++) {
    const row = new Array(cols);
    const py = (r + 0.5) * CELL_RES;
    for (let c = 0; c < cols; c++) {
      const px = (c + 0.5) * CELL_RES;
      // 4 screw holes centered around (cx, cy) at screwSp/2 offsets diagonally
      const dx = px - cx;
      const dy = py - cy;
      const off = screwSp / 2;
      const dNE = Math.hypot(dx - off, dy - off);
      const dNW = Math.hypot(dx + off, dy - off);
      const dSE = Math.hypot(dx - off, dy + off);
      const dSW = Math.hypot(dx + off, dy + off);
      let isHole = (dNE < screwR || dNW < screwR || dSE < screwR || dSW < screwR);
      if (!isHole && cutout) {
        if (Math.abs(dx) < coW / 2 && Math.abs(dy) < coH / 2) isHole = true;
      }
      row[c] = isHole ? 0.0 : 1.0;
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
    col.set_Red(230); col.set_Green(230); col.set_Blue(235); col.set_Alpha(255);
    const matIdx = matGroup.AddMaterial('Plate', col);
    col.delete();

    const mesh = model.AddMeshObject();
    mesh.SetName(`Wall Plate ${W}x${H}mm`);
    mesh.SetObjectLevelProperty(mgId, matIdx);
    const mb = new MeshBuilder(lib, mesh);

    mb.addHeightmapSurface(0, 0, 0, grid, CELL_RES, 0.0001, T);

    model.AddBuildItem(mesh, wrapper.GetIdentityTransform());

    const mdg = model.GetMetaDataGroup();
    const addMd = (k, v) => { const m = mdg.AddMetaData('', k, v, 'string', true); m.delete(); };
    addMd('Title', `Wall Plate ${W}x${H}mm`);
    addMd('Application', '3DPrintForge Model Forge');
    addMd('CreationDate', new Date().toISOString().split('T')[0]);

    const vfsPath = `/wall_plate_${Date.now()}.3mf`;
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
