/**
 * Electronics Case Generator (Raspberry Pi / Arduino / generic board)
 *
 * Generates a simple parametric case sized to a PCB footprint. The bottom
 * tray has four screw standoff posts aligned with standard board mounting
 * holes. A lid is placed next to it on the build plate with a friction-fit
 * skirt so both pieces print together.
 *
 * Presets for common boards:
 *   - raspi4:   85 × 56 mm, mounts at 58/49 (corner offset)
 *   - raspi5:   85 × 56 mm, mounts at 58/49
 *   - arduino_uno: 68 × 53 mm, mounts at 50.8 / 15.2 (asymmetric pattern)
 *
 * The user can override with custom dimensions.
 */

import { MeshBuilder, getLib } from '../mesh-builder.js';
import { num, str } from './_shared/validate.js';

const CELL_RES = 0.5;

const PRESETS = {
  raspi4:      { W: 85, D: 56, mountPattern: 'rect', mountW: 58, mountD: 49 },
  raspi5:      { W: 85, D: 56, mountPattern: 'rect', mountW: 58, mountD: 49 },
  arduino_uno: { W: 68.6, D: 53.3, mountPattern: 'custom' }, // skip standoffs (irregular)
  custom:      { W: 80, D: 60, mountPattern: 'rect', mountW: 70, mountD: 50 },
};

/** @typedef {object} CaseOptions
 * @property {string} [preset='raspi5']
 * @property {number} [boardWidth]      - overrides preset width
 * @property {number} [boardDepth]      - overrides preset depth
 * @property {number} [boardClearance=2] - slack around the PCB (mm)
 * @property {number} [wallHeight=22]
 * @property {number} [wallThickness=2]
 * @property {number} [floorThickness=1.6]
 */

/**
 * @param {CaseOptions} opts
 * @returns {Promise<Buffer>}
 */
export async function generateElectronicsCase3MF(opts = {}) {
  const presetKey = str(opts.preset, 16, 'raspi5');
  const preset = PRESETS[presetKey] || PRESETS.custom;
  const boardW = num(opts.boardWidth, 20, 300, preset.W);
  const boardD = num(opts.boardDepth, 20, 300, preset.D);
  const clearance = num(opts.boardClearance, 0.5, 10, 2);
  const wallH = num(opts.wallHeight, 10, 120, 22);
  const wall = num(opts.wallThickness, 1.5, 5, 2);
  const floor = num(opts.floorThickness, 1, 5, 1.6);

  const innerW = boardW + clearance * 2;
  const innerD = boardD + clearance * 2;
  const outerW = innerW + wall * 2;
  const outerD = innerD + wall * 2;

  // Build as heightmap (tray) + place the lid beside it.
  const cols = Math.round(outerW / CELL_RES);
  const rows = Math.round(outerD / CELL_RES);
  const grid = new Array(rows);
  for (let r = 0; r < rows; r++) {
    const row = new Array(cols);
    const py = (r + 0.5) * CELL_RES;
    for (let c = 0; c < cols; c++) {
      const px = (c + 0.5) * CELL_RES;
      const edge = Math.min(px, outerW - px, py, outerD - py);
      row[c] = edge < wall ? 1.0 : 0.0;
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
    col.set_Red(50); col.set_Green(60); col.set_Blue(80); col.set_Alpha(255);
    const matIdx = matGroup.AddMaterial('Case', col);
    col.delete();

    const mesh = model.AddMeshObject();
    mesh.SetName(`Case ${presetKey} ${Math.round(boardW)}x${Math.round(boardD)}mm`);
    mesh.SetObjectLevelProperty(mgId, matIdx);
    const mb = new MeshBuilder(lib, mesh);

    // Tray body
    mb.addHeightmapSurface(0, 0, 0, grid, CELL_RES, floor, wallH - floor);

    // Standoff pillars at the four corners for rectangular mounting patterns
    if (preset.mountPattern === 'rect' && preset.mountW && preset.mountD) {
      const standoffR = 2;
      const standoffH = 4;
      const boardOriginX = wall + clearance + (boardW - preset.mountW) / 2;
      const boardOriginY = wall + clearance + (boardD - preset.mountD) / 2;
      const offsets = [
        [0, 0], [preset.mountW, 0],
        [0, preset.mountD], [preset.mountW, preset.mountD],
      ];
      for (const [ox, oy] of offsets) {
        mb.addCylinder(boardOriginX + ox, boardOriginY + oy, floor, standoffR, standoffH, 20);
      }
    }

    // Lid placed to the right of the case body (+X)
    const gap = 5;
    const lidCols = cols;
    const lidRows = rows;
    const lidGrid = new Array(lidRows);
    const skirtInner = wall + 0.35;
    const skirtWidth = 1.2;
    for (let r = 0; r < lidRows; r++) {
      const row = new Array(lidCols);
      const py = (r + 0.5) * CELL_RES;
      for (let c = 0; c < lidCols; c++) {
        const px = (c + 0.5) * CELL_RES;
        const edge = Math.min(px, outerW - px, py, outerD - py);
        const inSkirt = edge >= skirtInner && edge < skirtInner + skirtWidth;
        row[c] = inSkirt ? 1.0 : 0.0;
      }
      lidGrid[r] = row;
    }
    mb.addHeightmapSurface(outerW + gap, 0, 0, lidGrid, CELL_RES, floor, 3);

    model.AddBuildItem(mesh, wrapper.GetIdentityTransform());

    const mdg = model.GetMetaDataGroup();
    const addMd = (k, v) => { const m = mdg.AddMetaData('', k, v, 'string', true); m.delete(); };
    addMd('Title', `Electronics Case ${presetKey}`);
    addMd('Application', '3DPrintForge Model Forge');
    addMd('CreationDate', new Date().toISOString().split('T')[0]);

    const vfsPath = `/electronics_case_${Date.now()}.3mf`;
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
