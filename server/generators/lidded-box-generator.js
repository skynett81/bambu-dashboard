/**
 * Lidded Box Generator
 *
 * Generates a rectangular box body AND a matching friction-fit lid,
 * placed side-by-side on the build plate so the user can print both at
 * once. The lid has a downward skirt sized to slide into the box opening.
 *
 * Both parts are built as watertight heightmaps.
 */

import { MeshBuilder, getLib } from '../mesh-builder.js';
import { num } from './_shared/validate.js';

const CELL_RES = 0.5;

/** @typedef {object} LiddedBoxOptions
 * @property {number} [width=80]
 * @property {number} [depth=60]
 * @property {number} [height=40]
 * @property {number} [wallThickness=1.6]
 * @property {number} [floorThickness=1.6]
 * @property {number} [lidSkirtDepth=3]
 * @property {number} [lidTolerance=0.35}
 */

/**
 * @param {LiddedBoxOptions} opts
 * @returns {Promise<Buffer>}
 */
export async function generateLiddedBox3MF(opts = {}) {
  const W = num(opts.width, 20, 300, 80);
  const D = num(opts.depth, 20, 300, 60);
  const H = num(opts.height, 10, 200, 40);
  const wall = num(opts.wallThickness, 1, 4, 1.6);
  const floor = num(opts.floorThickness, 1, 4, 1.6);
  const skirt = num(opts.lidSkirtDepth, 1.5, 8, 3);
  const tol = num(opts.lidTolerance, 0.15, 0.8, 0.35);
  const gap = 5; // build-plate gap between box and lid

  // ── Box body heightmap ──
  const bCols = Math.round(W / CELL_RES);
  const bRows = Math.round(D / CELL_RES);
  const boxGrid = new Array(bRows);
  for (let r = 0; r < bRows; r++) {
    const row = new Array(bCols);
    const py = (r + 0.5) * CELL_RES;
    for (let c = 0; c < bCols; c++) {
      const px = (c + 0.5) * CELL_RES;
      const edge = Math.min(px, W - px, py, D - py);
      row[c] = edge < wall ? 1.0 : 0.0;
    }
    boxGrid[r] = row;
  }

  // ── Lid heightmap (same footprint; skirt as a narrow inward ring) ──
  const lidInnerEdge = wall + tol;
  const lidSkirtWidth = 1.2; // thickness of the skirt ring itself
  const lidGrid = new Array(bRows);
  for (let r = 0; r < bRows; r++) {
    const row = new Array(bCols);
    const py = (r + 0.5) * CELL_RES;
    for (let c = 0; c < bCols; c++) {
      const px = (c + 0.5) * CELL_RES;
      const edge = Math.min(px, W - px, py, D - py);
      // The skirt protrudes on the ring between lidInnerEdge and
      // lidInnerEdge + lidSkirtWidth. Elsewhere we have just the top slab.
      const inSkirt = edge >= lidInnerEdge && edge < lidInnerEdge + lidSkirtWidth;
      row[c] = inSkirt ? 1.0 : 0.0;
    }
    lidGrid[r] = row;
  }

  const lib = await getLib();
  const wrapper = new lib.CWrapper();
  const model = wrapper.CreateModel();

  try {
    const matGroup = model.AddBaseMaterialGroup();
    const mgId = matGroup.GetResourceID();
    const col = new lib.sColor();
    col.set_Red(100); col.set_Green(140); col.set_Blue(180); col.set_Alpha(255);
    const matIdx = matGroup.AddMaterial('LiddedBox', col);
    col.delete();

    const mesh = model.AddMeshObject();
    mesh.SetName(`Lidded Box ${W}x${D}x${H}mm`);
    mesh.SetObjectLevelProperty(mgId, matIdx);
    const mb = new MeshBuilder(lib, mesh);

    // Box body
    mb.addHeightmapSurface(0, 0, 0, boxGrid, CELL_RES, floor, H - floor);
    // Lid: placed beside the box with a small gap along +X
    mb.addHeightmapSurface(W + gap, 0, 0, lidGrid, CELL_RES, floor, skirt);

    model.AddBuildItem(mesh, wrapper.GetIdentityTransform());

    const mdg = model.GetMetaDataGroup();
    const addMd = (k, v) => { const m = mdg.AddMetaData('', k, v, 'string', true); m.delete(); };
    addMd('Title', `Lidded Box ${W}x${D}x${H}mm`);
    addMd('Application', '3DPrintForge Model Forge');
    addMd('CreationDate', new Date().toISOString().split('T')[0]);

    const vfsPath = `/lidded_box_${Date.now()}.3mf`;
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
