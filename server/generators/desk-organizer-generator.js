/**
 * Desk / Drawer Organizer Generator
 *
 * A rectangular tray divided into a configurable grid of compartments.
 * Built as a single watertight heightmap — compartment floors sit at the
 * base thickness while interior walls and the outer perimeter rise to the
 * full height.
 *
 * Serves double duty as a desk organizer and a drawer organizer — pick
 * dimensions to match your drawer interior.
 */

import { MeshBuilder, getLib } from '../mesh-builder.js';
import { int, num } from './_shared/validate.js';

const CELL_RES = 0.5;

/** @typedef {object} DeskOrganizerOptions
 * @property {number} [width=200]     - outer X size (mm)
 * @property {number} [depth=120]     - outer Y size (mm)
 * @property {number} [height=30]     - wall height (mm)
 * @property {number} [cols=4]        - compartment columns along X (1..12)
 * @property {number} [rows=2]        - compartment rows along Y (1..12)
 * @property {number} [wallThickness=1.6]
 * @property {number} [floorThickness=1.5]
 */

/**
 * @param {DeskOrganizerOptions} opts
 * @returns {Promise<Buffer>}
 */
export async function generateDeskOrganizer3MF(opts = {}) {
  const W = num(opts.width, 40, 400, 200);
  const D = num(opts.depth, 30, 400, 120);
  const H = num(opts.height, 10, 120, 30);
  const nCols = int(opts.cols, 1, 12, 4);
  const nRows = int(opts.rows, 1, 12, 2);
  const wall = num(opts.wallThickness, 1, 4, 1.6);
  const floor = num(opts.floorThickness, 0.8, 5, 1.5);

  const cellW = (W - wall * (nCols + 1)) / nCols;
  const cellD = (D - wall * (nRows + 1)) / nRows;
  if (cellW < 5 || cellD < 5) {
    throw new Error('Compartments would be too small — reduce rows/cols or increase size.');
  }

  const cols = Math.round(W / CELL_RES);
  const rows = Math.round(D / CELL_RES);

  // Precompute X/Y positions of the interior walls so we can test efficiently
  const xWalls = [];
  for (let i = 0; i <= nCols; i++) {
    xWalls.push(i * (cellW + wall));
  }
  const yWalls = [];
  for (let i = 0; i <= nRows; i++) {
    yWalls.push(i * (cellD + wall));
  }

  const grid = new Array(rows);
  for (let r = 0; r < rows; r++) {
    const row = new Array(cols);
    const py = (r + 0.5) * CELL_RES;
    for (let c = 0; c < cols; c++) {
      const px = (c + 0.5) * CELL_RES;
      // Check if the point is on a wall (within wall thickness of any wall line)
      let inWall = false;
      for (const xw of xWalls) {
        if (Math.abs(px - xw) < wall / 2) { inWall = true; break; }
      }
      if (!inWall) {
        for (const yw of yWalls) {
          if (Math.abs(py - yw) < wall / 2) { inWall = true; break; }
        }
      }
      row[c] = inWall ? 1.0 : 0.0;
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
    col.set_Red(140); col.set_Green(150); col.set_Blue(170); col.set_Alpha(255);
    const matIdx = matGroup.AddMaterial('Organizer', col);
    col.delete();

    const mesh = model.AddMeshObject();
    mesh.SetName(`Organizer ${W}x${D}mm ${nCols}x${nRows}`);
    mesh.SetObjectLevelProperty(mgId, matIdx);
    const mb = new MeshBuilder(lib, mesh);

    mb.addHeightmapSurface(0, 0, 0, grid, CELL_RES, floor, H - floor);

    model.AddBuildItem(mesh, wrapper.GetIdentityTransform());

    const mdg = model.GetMetaDataGroup();
    const addMd = (k, v) => { const m = mdg.AddMetaData('', k, v, 'string', true); m.delete(); };
    addMd('Title', `Desk Organizer ${W}x${D}mm`);
    addMd('Application', '3DPrintForge Model Forge');
    addMd('Description', `${nCols}x${nRows} compartments`);
    addMd('CreationDate', new Date().toISOString().split('T')[0]);

    const vfsPath = `/organizer_${Date.now()}.3mf`;
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
