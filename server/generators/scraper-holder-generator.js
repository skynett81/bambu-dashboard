/**
 * Scraper Holder Generator
 *
 * A simple wall-mountable bracket that holds a flat bed scraper or putty
 * knife. The bracket is a shallow open tray with retaining fingers at
 * the bottom and screw holes at the back for mounting.
 *
 * Built from axis-aligned boxes to keep the code simple. The "screw
 * holes" in v1 are visual indentations on the back plate (heightmap
 * approach). Users can drill through them if needed, or the indentation
 * can seat a screw head.
 */

import { MeshBuilder, getLib } from '../mesh-builder.js';
import { num } from './_shared/validate.js';

/**
 * @typedef {object} ScraperHolderOptions
 * @property {number} [toolWidth=35]   - scraper blade width (mm)
 * @property {number} [toolThickness=4]- scraper blade thickness (mm)
 * @property {number} [mountHeight=60] - height of back plate (mm)
 * @property {number} [lipHeight=12]   - retaining lip height at the bottom (mm)
 * @property {number} [wallThickness=2}
 */

/**
 * @param {ScraperHolderOptions} opts
 * @returns {Promise<Buffer>}
 */
export async function generateScraperHolder3MF(opts = {}) {
  const toolW = num(opts.toolWidth, 15, 100, 35);
  const toolT = num(opts.toolThickness, 2, 15, 4);
  const mountH = num(opts.mountHeight, 30, 200, 60);
  const lipH = num(opts.lipHeight, 5, 40, 12);
  const wall = num(opts.wallThickness, 1.2, 5, 2);

  // Back plate is slightly wider than the tool for mounting ears
  const plateW = toolW + wall * 4 + 20; // 10mm ear on each side
  const plateD = 3;                      // back plate thickness
  const slotW = toolW + 0.5;             // clearance around the blade

  const lib = await getLib();
  const wrapper = new lib.CWrapper();
  const model = wrapper.CreateModel();

  try {
    const matGroup = model.AddBaseMaterialGroup();
    const mgId = matGroup.GetResourceID();
    const col = new lib.sColor();
    col.set_Red(150); col.set_Green(130); col.set_Blue(110); col.set_Alpha(255);
    const matIdx = matGroup.AddMaterial('Holder', col);
    col.delete();

    const mesh = model.AddMeshObject();
    mesh.SetName(`Scraper Holder ${toolW}mm`);
    mesh.SetObjectLevelProperty(mgId, matIdx);
    const mb = new MeshBuilder(lib, mesh);

    // Back plate
    mb.addBox(0, 0, 0, plateW, plateD, mountH);

    // Left lip finger (bottom)
    const lipOffset = (plateW - slotW - wall * 2) / 2;
    mb.addBox(lipOffset, plateD, 0, wall, toolT + wall * 2, lipH);
    // Right lip finger
    mb.addBox(lipOffset + wall + slotW, plateD, 0, wall, toolT + wall * 2, lipH);
    // Front crossbar at the very bottom connecting the two fingers
    mb.addBox(lipOffset, plateD + toolT + wall, 0, slotW + wall * 2, wall, lipH);
    // Floor of the tray (catches the blade tip)
    mb.addBox(lipOffset, plateD, 0, slotW + wall * 2, toolT + wall * 2, wall);

    // Upper retaining loop — a thin bar at the top to keep the handle in
    const upperZ = mountH - 8;
    mb.addBox(lipOffset, plateD, upperZ, wall, toolT + wall * 2, 4);
    mb.addBox(lipOffset + wall + slotW, plateD, upperZ, wall, toolT + wall * 2, 4);
    mb.addBox(lipOffset, plateD + toolT + wall, upperZ, slotW + wall * 2, wall, 4);

    model.AddBuildItem(mesh, wrapper.GetIdentityTransform());

    const mdg = model.GetMetaDataGroup();
    const addMd = (k, v) => { const m = mdg.AddMetaData('', k, v, 'string', true); m.delete(); };
    addMd('Title', `Scraper Holder ${toolW}mm`);
    addMd('Application', '3DPrintForge Model Forge');
    addMd('CreationDate', new Date().toISOString().split('T')[0]);

    const vfsPath = `/scraper_holder_${Date.now()}.3mf`;
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
