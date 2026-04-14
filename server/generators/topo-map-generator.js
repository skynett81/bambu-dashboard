/**
 * Topographic Map Generator
 *
 * Generates a synthetic 3D terrain tile from layered sine waves (pseudo
 * Perlin-ish noise). Useful for dioramas, map tiles, D&D scenery, or
 * decorative paperweights.
 *
 * Parameters control terrain extent, vertical relief, and how many
 * "mountains" / "valleys" appear. A seeded RNG keeps output reproducible.
 */

import { MeshBuilder, getLib } from '../mesh-builder.js';
import { int, num } from './_shared/validate.js';

const CELL_RES = 0.8;

/** @typedef {object} TopoMapOptions
 * @property {number} [width=120]
 * @property {number} [depth=120]
 * @property {number} [baseThickness=2]
 * @property {number} [maxHeight=20]
 * @property {number} [detail=4]      - number of noise octaves (1..8)
 * @property {number} [roughness=0.5} - how jagged the terrain feels (0..1)
 * @property {number} [seed=42]
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
 * @param {TopoMapOptions} opts
 * @returns {Promise<Buffer>}
 */
export async function generateTopoMap3MF(opts = {}) {
  const W = num(opts.width, 40, 300, 120);
  const D = num(opts.depth, 40, 300, 120);
  const baseThickness = num(opts.baseThickness, 1, 10, 2);
  const maxHeight = num(opts.maxHeight, 5, 80, 20);
  const detail = int(opts.detail, 1, 8, 4);
  const roughness = num(opts.roughness, 0, 1, 0.5);
  const seed = int(opts.seed, 0, 99999, 42);

  const rand = mulberry32(seed);
  // Generate octaves of sinusoidal "mountains" with random offsets
  const octaves = [];
  for (let i = 0; i < detail; i++) {
    octaves.push({
      fx: 0.5 * (i + 1) * (0.6 + rand() * 0.8) / 20,
      fy: 0.5 * (i + 1) * (0.6 + rand() * 0.8) / 20,
      phaseX: rand() * Math.PI * 2,
      phaseY: rand() * Math.PI * 2,
      amp: Math.pow(0.5 + roughness * 0.3, i),
    });
  }

  const cols = Math.round(W / CELL_RES);
  const rows = Math.round(D / CELL_RES);
  const grid = new Array(rows);
  let maxRaw = 0, minRaw = Infinity;

  for (let r = 0; r < rows; r++) {
    const row = new Array(cols);
    const py = (r + 0.5) * CELL_RES;
    for (let c = 0; c < cols; c++) {
      const px = (c + 0.5) * CELL_RES;
      let h = 0;
      for (const o of octaves) {
        h += o.amp * Math.sin(px * o.fx + o.phaseX) * Math.cos(py * o.fy + o.phaseY);
      }
      row[c] = h;
      if (h > maxRaw) maxRaw = h;
      if (h < minRaw) minRaw = h;
    }
    grid[r] = row;
  }
  // Normalize to [0, 1]
  const range = maxRaw - minRaw;
  if (range > 0) {
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        grid[r][c] = (grid[r][c] - minRaw) / range;
      }
    }
  }

  const lib = await getLib();
  const wrapper = new lib.CWrapper();
  const model = wrapper.CreateModel();

  try {
    const matGroup = model.AddBaseMaterialGroup();
    const mgId = matGroup.GetResourceID();
    const col = new lib.sColor();
    col.set_Red(150); col.set_Green(120); col.set_Blue(90); col.set_Alpha(255);
    const matIdx = matGroup.AddMaterial('Terrain', col);
    col.delete();

    const mesh = model.AddMeshObject();
    mesh.SetName(`Topo Map ${W}x${D}mm`);
    mesh.SetObjectLevelProperty(mgId, matIdx);
    const mb = new MeshBuilder(lib, mesh);

    mb.addHeightmapSurface(0, 0, 0, grid, CELL_RES, baseThickness, maxHeight);

    model.AddBuildItem(mesh, wrapper.GetIdentityTransform());

    const mdg = model.GetMetaDataGroup();
    const addMd = (k, v) => { const m = mdg.AddMetaData('', k, v, 'string', true); m.delete(); };
    addMd('Title', `Topographic Map ${W}x${D}mm`);
    addMd('Application', '3DPrintForge Model Forge');
    addMd('CreationDate', new Date().toISOString().split('T')[0]);

    const vfsPath = `/topo_map_${Date.now()}.3mf`;
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
