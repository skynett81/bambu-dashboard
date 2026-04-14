/**
 * Voronoi Tray Generator
 *
 * Generates a rectangular tray with its top surface partitioned into a
 * voronoi cell pattern. The cell borders rise up as walls, creating a
 * decorative tray with irregular compartments that are great for small
 * items (jewellery, screws, dice).
 *
 * Implementation: seed `cellCount` random 2D points inside the tray
 * footprint, then build a heightmap where cells far from the seeds are
 * at "floor" height and cells on the voronoi boundary (equidistant from
 * two or more seeds) rise up to full wall height.
 */

import { MeshBuilder, getLib } from '../mesh-builder.js';
import { int, num } from './_shared/validate.js';

const CELL_RES = 0.6;

/** @typedef {object} VoronoiTrayOptions
 * @property {number} [width=120]
 * @property {number} [depth=80]
 * @property {number} [height=18]
 * @property {number} [cellCount=10]
 * @property {number} [seed=42]
 * @property {number} [floorThickness=1.5]
 * @property {number} [wallThickness=1.2]
 */

/**
 * Minimal seeded PRNG — Mulberry32. Reproducible across runs.
 */
function mulberry32(a) {
  return function() {
    let t = (a += 0x6D2B79F5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * @param {VoronoiTrayOptions} opts
 * @returns {Promise<Buffer>}
 */
export async function generateVoronoiTray3MF(opts = {}) {
  const W = num(opts.width, 40, 300, 120);
  const D = num(opts.depth, 30, 300, 80);
  const H = num(opts.height, 6, 60, 18);
  const cellCount = int(opts.cellCount, 3, 60, 10);
  const seed = int(opts.seed, 0, 99999, 42);
  const floor = num(opts.floorThickness, 1, 5, 1.5);
  const wall = num(opts.wallThickness, 0.8, 3, 1.2);

  // Seed random points inside a margin so cells don't reach the edge
  const margin = 6;
  const rand = mulberry32(seed);
  const seeds = [];
  for (let i = 0; i < cellCount; i++) {
    seeds.push([
      margin + rand() * (W - margin * 2),
      margin + rand() * (D - margin * 2),
    ]);
  }

  const cols = Math.round(W / CELL_RES);
  const rows = Math.round(D / CELL_RES);
  const grid = new Array(rows);
  // wall pixels are those where the difference between the 1st and 2nd
  // nearest seed distances is less than wallThickness / 2 — i.e. the
  // point is close to a voronoi edge.
  const wallTol = wall / 2;
  for (let r = 0; r < rows; r++) {
    const row = new Array(cols);
    const py = (r + 0.5) * CELL_RES;
    for (let c = 0; c < cols; c++) {
      const px = (c + 0.5) * CELL_RES;
      // Outer perimeter is always a wall
      const edge = Math.min(px, W - px, py, D - py);
      if (edge < wall) {
        row[c] = 1.0;
        continue;
      }
      // Find two nearest seeds
      let d1 = Infinity, d2 = Infinity;
      for (const [sx, sy] of seeds) {
        const d = Math.hypot(px - sx, py - sy);
        if (d < d1) { d2 = d1; d1 = d; }
        else if (d < d2) { d2 = d; }
      }
      row[c] = (d2 - d1) < wallTol ? 1.0 : 0.0;
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
    col.set_Red(130); col.set_Green(170); col.set_Blue(190); col.set_Alpha(255);
    const matIdx = matGroup.AddMaterial('Voronoi', col);
    col.delete();

    const mesh = model.AddMeshObject();
    mesh.SetName(`Voronoi Tray ${W}x${D}mm (${cellCount} cells)`);
    mesh.SetObjectLevelProperty(mgId, matIdx);
    const mb = new MeshBuilder(lib, mesh);

    mb.addHeightmapSurface(0, 0, 0, grid, CELL_RES, floor, H - floor);

    model.AddBuildItem(mesh, wrapper.GetIdentityTransform());

    const mdg = model.GetMetaDataGroup();
    const addMd = (k, v) => { const m = mdg.AddMetaData('', k, v, 'string', true); m.delete(); };
    addMd('Title', `Voronoi Tray ${W}x${D}mm`);
    addMd('Application', '3DPrintForge Model Forge');
    addMd('CreationDate', new Date().toISOString().split('T')[0]);

    const vfsPath = `/voronoi_tray_${Date.now()}.3mf`;
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
