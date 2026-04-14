/**
 * VESA Mount Plate Generator
 *
 * Generates a VESA-compatible mounting plate with standard bolt patterns.
 * VESA MIS-D standard supports 75x75mm and 100x100mm bolt patterns (M4
 * threaded holes). This generator creates a plate with configurable size
 * and any of the common VESA hole patterns punched through as real
 * geometry (no slicer boolean needed).
 */

import { MeshBuilder, getLib } from '../mesh-builder.js';
import { num, int } from './_shared/validate.js';

const CELL_RES = 0.5;

/** @typedef {object} VesaMountOptions
 * @property {number} [width=120]
 * @property {number} [height=120]
 * @property {number} [thickness=5]
 * @property {number} [vesaSize=100]       - center-to-center (75 or 100 typical)
 * @property {number} [vesaHoleRadius=2.2] - M4 clearance
 * @property {number} [extraHoleRadius=0]  - optional central cable pass-through
 */

/**
 * @param {VesaMountOptions} opts
 * @returns {Promise<Buffer>}
 */
export async function generateVesaMount3MF(opts = {}) {
  const W = num(opts.width, 50, 300, 120);
  const H = num(opts.height, 50, 300, 120);
  const T = num(opts.thickness, 3, 20, 5);
  const vesaSize = int(opts.vesaSize, 50, 200, 100);
  const vesaR = num(opts.vesaHoleRadius, 1.5, 6, 2.2);
  const centerR = num(opts.extraHoleRadius, 0, 40, 0);

  if (vesaSize > W - 20 || vesaSize > H - 20) {
    throw new Error('VESA pattern too large for plate — increase plate size.');
  }

  const cols = Math.round(W / CELL_RES);
  const rows = Math.round(H / CELL_RES);
  const cx = W / 2;
  const cy = H / 2;
  const off = vesaSize / 2;

  const grid = new Array(rows);
  for (let r = 0; r < rows; r++) {
    const row = new Array(cols);
    const py = (r + 0.5) * CELL_RES;
    for (let c = 0; c < cols; c++) {
      const px = (c + 0.5) * CELL_RES;
      const dx = px - cx;
      const dy = py - cy;
      // 4 VESA holes at corners of the square
      const d1 = Math.hypot(dx - off, dy - off);
      const d2 = Math.hypot(dx + off, dy - off);
      const d3 = Math.hypot(dx - off, dy + off);
      const d4 = Math.hypot(dx + off, dy + off);
      let hole = (d1 < vesaR || d2 < vesaR || d3 < vesaR || d4 < vesaR);
      if (!hole && centerR > 0) {
        if (Math.hypot(dx, dy) < centerR) hole = true;
      }
      row[c] = hole ? 0.0 : 1.0;
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
    col.set_Red(70); col.set_Green(70); col.set_Blue(80); col.set_Alpha(255);
    const matIdx = matGroup.AddMaterial('VESA', col);
    col.delete();

    const mesh = model.AddMeshObject();
    mesh.SetName(`VESA Mount ${vesaSize}x${vesaSize}`);
    mesh.SetObjectLevelProperty(mgId, matIdx);
    const mb = new MeshBuilder(lib, mesh);

    mb.addHeightmapSurface(0, 0, 0, grid, CELL_RES, 0.0001, T);

    model.AddBuildItem(mesh, wrapper.GetIdentityTransform());

    const mdg = model.GetMetaDataGroup();
    const addMd = (k, v) => { const m = mdg.AddMetaData('', k, v, 'string', true); m.delete(); };
    addMd('Title', `VESA Mount ${vesaSize}mm`);
    addMd('Application', '3DPrintForge Model Forge');
    addMd('CreationDate', new Date().toISOString().split('T')[0]);

    const vfsPath = `/vesa_mount_${Date.now()}.3mf`;
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
