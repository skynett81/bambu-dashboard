/**
 * Honeycomb Tile Generator
 *
 * Generates a flat tile with a hexagonal honeycomb pattern on its top
 * surface — thin hex walls rising above the base plate. Useful as a
 * decorative tile, coaster, or light diffuser.
 *
 * The hex grid is evaluated by computing, at each sample point, the
 * distance to the nearest hex cell border. Points within `wallThickness`
 * of a border become walls; everything else is base.
 */

import { MeshBuilder, getLib } from '../mesh-builder.js';
import { num } from './_shared/validate.js';

const CELL_RES = 0.5;

/** @typedef {object} HoneycombOptions
 * @property {number} [width=120]
 * @property {number} [depth=80]
 * @property {number} [height=6]
 * @property {number} [cellSize=12]      - hex flat-to-flat distance (mm)
 * @property {number} [wallThickness=1.2}
 * @property {number} [baseThickness=1.5}
 */

/**
 * @param {HoneycombOptions} opts
 * @returns {Promise<Buffer>}
 */
export async function generateHoneycombTile3MF(opts = {}) {
  const W = num(opts.width, 40, 300, 120);
  const D = num(opts.depth, 30, 300, 80);
  const H = num(opts.height, 3, 40, 6);
  const cellSize = num(opts.cellSize, 5, 40, 12);
  const wall = num(opts.wallThickness, 0.8, 3, 1.2);
  const base = num(opts.baseThickness, 1, 5, 1.5);

  // Hex grid: flat-top hexagons. Width = cellSize (flat-to-flat), height =
  // cellSize * 2/√3 (corner-to-corner). Column spacing = cellSize * 3/4.
  const hexW = cellSize;
  const hexH = cellSize * 2 / Math.sqrt(3);
  const colStep = cellSize * 0.75;
  const rowStep = hexH / 2;

  /** Return distance from point (x,y) to the nearest hex border. */
  function distToHexBorder(x, y) {
    // Find the nearest hex center by trying a few candidates.
    const col = Math.floor(x / colStep);
    const rowOff = (col & 1) ? hexH / 2 : 0;
    const row = Math.floor((y - rowOff) / hexH);
    let best = Infinity;
    for (let dc = -1; dc <= 1; dc++) {
      for (let dr = -1; dr <= 1; dr++) {
        const c = col + dc;
        const r = row + dr;
        const cx = c * colStep;
        const cy = r * hexH + ((c & 1) ? hexH / 2 : 0);
        // Hex inside-distance in flat-top orientation:
        // d = max(|dx|, (|dx| + √3 * |dy|) / 2) - cellSize/2
        const ax = Math.abs(x - cx);
        const ay = Math.abs(y - cy);
        const d = Math.max(ax, (ax + Math.sqrt(3) * ay) / 2) - cellSize / 2;
        if (d < best) best = d;
      }
    }
    return -best; // negative = inside, positive = outside
  }

  const cols = Math.round(W / CELL_RES);
  const rows = Math.round(D / CELL_RES);
  const grid = new Array(rows);
  for (let r = 0; r < rows; r++) {
    const row = new Array(cols);
    const py = (r + 0.5) * CELL_RES;
    for (let c = 0; c < cols; c++) {
      const px = (c + 0.5) * CELL_RES;
      const edge = Math.min(px, W - px, py, D - py);
      if (edge < wall) { row[c] = 1.0; continue; }
      // Wall = near zero distance to hex border
      const insideDist = distToHexBorder(px, py);
      row[c] = Math.abs(insideDist) < wall / 2 ? 1.0 : 0.0;
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
    col.set_Red(220); col.set_Green(180); col.set_Blue(80); col.set_Alpha(255);
    const matIdx = matGroup.AddMaterial('Honeycomb', col);
    col.delete();

    const mesh = model.AddMeshObject();
    mesh.SetName(`Honeycomb Tile ${W}x${D}mm`);
    mesh.SetObjectLevelProperty(mgId, matIdx);
    const mb = new MeshBuilder(lib, mesh);

    mb.addHeightmapSurface(0, 0, 0, grid, CELL_RES, base, H - base);

    model.AddBuildItem(mesh, wrapper.GetIdentityTransform());

    const mdg = model.GetMetaDataGroup();
    const addMd = (k, v) => { const m = mdg.AddMetaData('', k, v, 'string', true); m.delete(); };
    addMd('Title', `Honeycomb Tile ${W}x${D}mm`);
    addMd('Application', '3DPrintForge Model Forge');
    addMd('CreationDate', new Date().toISOString().split('T')[0]);

    const vfsPath = `/honeycomb_${Date.now()}.3mf`;
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
