/**
 * Battery Holder Generator
 *
 * A compact block with circular slots sized to hold AA, AAA, C, D, 18650,
 * 21700, CR123A, or 9V batteries. Built as a watertight heightmap so
 * slots are real geometry rather than slicer subtractions.
 *
 * Battery presets (diameter in mm):
 *   AA      — 14.5
 *   AAA     — 10.5
 *   C       — 26.2
 *   D       — 34.2
 *   18650   — 18.4
 *   21700   — 21.2
 *   CR123A  — 17.0
 *   9V      — 26.5 x 48 (non-circular, handled specially)
 */

import { MeshBuilder, getLib } from '../mesh-builder.js';
import { int, num, str } from './_shared/validate.js';

const CELL_RES = 0.4;

const BATTERY_PRESETS = {
  aa:    { name: 'AA',    diameter: 14.5 },
  aaa:   { name: 'AAA',   diameter: 10.5 },
  c:     { name: 'C',     diameter: 26.2 },
  d:     { name: 'D',     diameter: 34.2 },
  b18650:{ name: '18650', diameter: 18.4 },
  b21700:{ name: '21700', diameter: 21.2 },
  cr123:{ name: 'CR123A',diameter: 17.0 },
};

/** @typedef {object} BatteryHolderOptions
 * @property {string} [type='aa']
 * @property {number} [count=4]
 * @property {number} [rows=1]
 * @property {number} [spacing=2]
 * @property {number} [margin=3]
 * @property {number} [depth=10]  - slot depth (mm)
 * @property {number} [floorThickness=2]
 */

/**
 * @param {BatteryHolderOptions} opts
 * @returns {Promise<Buffer>}
 */
export async function generateBatteryHolder3MF(opts = {}) {
  const typeKey = str(opts.type, 16, 'aa');
  const preset = BATTERY_PRESETS[typeKey] || BATTERY_PRESETS.aa;
  const count = int(opts.count, 1, 24, 4);
  const rowsN = int(opts.rows, 1, 4, 1);
  const spacing = num(opts.spacing, 1, 10, 2);
  const margin = num(opts.margin, 2, 15, 3);
  const depth = num(opts.depth, 4, 40, 10);
  const floor = num(opts.floorThickness, 1, 10, 2);

  const cellsPerRow = Math.ceil(count / rowsN);
  const slotR = preset.diameter / 2 + 0.3; // small clearance
  const pitch = preset.diameter + spacing;
  const totalW = cellsPerRow * pitch - spacing + margin * 2;
  const totalD = rowsN * pitch - spacing + margin * 2;

  // Precompute slot centers
  const slotCenters = [];
  let placed = 0;
  for (let r = 0; r < rowsN && placed < count; r++) {
    for (let c = 0; c < cellsPerRow && placed < count; c++) {
      const cx = margin + preset.diameter / 2 + c * pitch;
      const cy = margin + preset.diameter / 2 + r * pitch;
      slotCenters.push([cx, cy]);
      placed++;
    }
  }

  const cols = Math.round(totalW / CELL_RES);
  const rows = Math.round(totalD / CELL_RES);
  const grid = new Array(rows);
  for (let r = 0; r < rows; r++) {
    const row = new Array(cols);
    const py = (r + 0.5) * CELL_RES;
    for (let c = 0; c < cols; c++) {
      const px = (c + 0.5) * CELL_RES;
      let inSlot = false;
      for (const [scx, scy] of slotCenters) {
        const dx = px - scx; const dy = py - scy;
        if (dx * dx + dy * dy < slotR * slotR) { inSlot = true; break; }
      }
      row[c] = inSlot ? 0.0 : 1.0;
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
    col.set_Red(80); col.set_Green(90); col.set_Blue(110); col.set_Alpha(255);
    const matIdx = matGroup.AddMaterial('BatteryHolder', col);
    col.delete();

    const mesh = model.AddMeshObject();
    mesh.SetName(`${preset.name} Holder ${count}x`);
    mesh.SetObjectLevelProperty(mgId, matIdx);
    const mb = new MeshBuilder(lib, mesh);

    mb.addHeightmapSurface(0, 0, 0, grid, CELL_RES, floor, depth);

    model.AddBuildItem(mesh, wrapper.GetIdentityTransform());

    const mdg = model.GetMetaDataGroup();
    const addMd = (k, v) => { const m = mdg.AddMetaData('', k, v, 'string', true); m.delete(); };
    addMd('Title', `${preset.name} Battery Holder (${count}x)`);
    addMd('Application', '3DPrintForge Model Forge');
    addMd('CreationDate', new Date().toISOString().split('T')[0]);

    const vfsPath = `/battery_holder_${Date.now()}.3mf`;
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
