/**
 * Nozzle Storage Block Generator
 *
 * Generates a compact storage block for printer nozzles with correctly
 * sized bore holes for the nozzle shank (M6x1 thread is the most common,
 * giving an ~6mm shank). Nozzles sit upside down in the holes; the block
 * can be placed on a shelf or screwed to a wall.
 *
 * Built as a single watertight heightmap so the bores are real geometry
 * rather than slicer-subtracted cylinders — the block prints without any
 * special "negative part" support.
 */

import { MeshBuilder, getLib } from '../mesh-builder.js';
import { int, num, bool } from './_shared/validate.js';

const CELL_RES = 0.4;

/**
 * @typedef {object} NozzleStorageOptions
 * @property {number} [slots=8]        - number of nozzle bores (2..24)
 * @property {number} [slotDiameter=6.3] - bore diameter (M6 shank = 6.0mm + 0.3 clearance)
 * @property {number} [slotSpacing=4]  - wall between bores (mm)
 * @property {number} [slotDepth=8]    - bore depth (mm)
 * @property {number} [floorThickness=2]
 * @property {number} [margin=4]       - outer wall margin (mm)
 * @property {boolean} [labelGrooves=true] - include thin label troughs next to each slot
 */

/**
 * @param {NozzleStorageOptions} opts
 * @returns {Promise<Buffer>}
 */
export async function generateNozzleStorage3MF(opts = {}) {
  const slots = int(opts.slots, 2, 24, 8);
  const slotDiameter = num(opts.slotDiameter, 3, 15, 6.3);
  const slotSpacing = num(opts.slotSpacing, 2, 15, 4);
  const slotDepth = num(opts.slotDepth, 4, 30, 8);
  const floorThickness = num(opts.floorThickness, 1, 10, 2);
  const margin = num(opts.margin, 2, 15, 4);
  const labelGrooves = bool(opts.labelGrooves, true);

  const slotR = slotDiameter / 2;
  const totalW = slots * (slotDiameter + slotSpacing) + margin * 2 - slotSpacing;
  const totalD = slotDiameter + margin * 2 + (labelGrooves ? 6 : 0);
  const totalH = floorThickness + slotDepth;

  const cols = Math.round(totalW / CELL_RES);
  const rows = Math.round(totalD / CELL_RES);

  // Precompute slot centers
  const slotCenters = [];
  for (let i = 0; i < slots; i++) {
    const cx = margin + slotR + i * (slotDiameter + slotSpacing);
    const cy = margin + slotR;
    slotCenters.push([cx, cy]);
  }

  const grid = new Array(rows);
  for (let r = 0; r < rows; r++) {
    const row = new Array(cols);
    const py = (r + 0.5) * CELL_RES;
    for (let c = 0; c < cols; c++) {
      const px = (c + 0.5) * CELL_RES;
      let inSlot = false;
      for (const [scx, scy] of slotCenters) {
        const dx = px - scx;
        const dy = py - scy;
        if (dx * dx + dy * dy < slotR * slotR) {
          inSlot = true;
          break;
        }
      }
      // Label groove: thin rectangular trough behind each slot (positive Y side)
      let inGroove = false;
      if (labelGrooves) {
        const grooveY0 = margin + slotDiameter + 1;
        const grooveY1 = grooveY0 + 3;
        if (py > grooveY0 && py < grooveY1) {
          // Trough runs the full width
          if (px > margin && px < totalW - margin) inGroove = true;
        }
      }
      // inGroove gives a shallower pocket (only 1.5mm deep, not the full slot)
      if (inSlot) {
        row[c] = 0.0;
      } else if (inGroove) {
        // Partial height: 1.5mm depth out of slotDepth -> normalized = (slotDepth - 1.5) / slotDepth
        row[c] = Math.max(0, (slotDepth - 1.5) / slotDepth);
      } else {
        row[c] = 1.0;
      }
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
    col.set_Red(100); col.set_Green(110); col.set_Blue(130); col.set_Alpha(255);
    const matIdx = matGroup.AddMaterial('Nozzles', col);
    col.delete();

    const mesh = model.AddMeshObject();
    mesh.SetName(`Nozzle Storage ${slots}x ⌀${slotDiameter}mm`);
    mesh.SetObjectLevelProperty(mgId, matIdx);
    const mb = new MeshBuilder(lib, mesh);

    mb.addHeightmapSurface(0, 0, 0, grid, CELL_RES, floorThickness, slotDepth);

    model.AddBuildItem(mesh, wrapper.GetIdentityTransform());

    const mdg = model.GetMetaDataGroup();
    const addMd = (k, v) => { const m = mdg.AddMetaData('', k, v, 'string', true); m.delete(); };
    addMd('Title', `Nozzle Storage ${slots}x`);
    addMd('Application', '3DPrintForge Model Forge');
    addMd('Description', `${slots} bores @ ${slotDiameter}mm`);
    addMd('CreationDate', new Date().toISOString().split('T')[0]);

    const vfsPath = `/nozzle_storage_${Date.now()}.3mf`;
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
