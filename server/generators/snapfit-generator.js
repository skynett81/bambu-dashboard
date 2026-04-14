/**
 * Cantilever Snap-fit Connector Generator
 *
 * Generates a classic cantilever snap-fit hook (catch + mating tab) that
 * can be used to join two printed parts without fasteners.
 *
 * The generator emits BOTH halves of the snap pair in one 3MF:
 *   - The catch: a rectangular slot with an internal lip
 *   - The hook:  a cantilever beam with a mating bump at the tip
 *
 * Both parts are intended to be printed together on the same plate and
 * then snapped into each other after printing.
 *
 * Deflection geometry follows Bayer Material Science's classic snap-fit
 * design guide (cantilever beam, uniform cross-section) — the strain is
 * tuned for typical 3D-printer PLA/PETG stiffness.
 */

import { MeshBuilder, getLib } from '../mesh-builder.js';
import { num } from './_shared/validate.js';

/**
 * @typedef {object} SnapfitOptions
 * @property {number} [beamLength=15]     - cantilever beam length (mm)
 * @property {number} [beamWidth=8]       - beam width (mm)
 * @property {number} [beamThickness=2]   - beam thickness (mm)
 * @property {number} [hookDepth=1.2]     - engagement depth of the hook (mm)
 * @property {number} [hookHeight=1.8]    - bump height for the catch lip (mm)
 * @property {number} [clearance=0.2]     - sliding clearance between parts (mm)
 */

/**
 * @param {SnapfitOptions} opts
 * @returns {Promise<Buffer>}
 */
export async function generateSnapfit3MF(opts = {}) {
  const beamLength = num(opts.beamLength, 5, 50, 15);
  const beamWidth = num(opts.beamWidth, 3, 30, 8);
  const beamThickness = num(opts.beamThickness, 1, 6, 2);
  const hookDepth = num(opts.hookDepth, 0.5, 5, 1.2);
  const hookHeight = num(opts.hookHeight, 0.8, 5, 1.8);
  const clearance = num(opts.clearance, 0.1, 0.6, 0.2);

  // Layout: male part on the left (x < 0), female part on the right (x > 0).
  const maleBaseW = 6;
  const femaleBaseW = beamWidth + 6;
  const femaleSlotW = beamWidth + clearance * 2;
  const femaleThickness = beamThickness + hookHeight + 2;
  const partGap = 4; // printable gap between male and female parts

  const lib = await getLib();
  const wrapper = new lib.CWrapper();
  const model = wrapper.CreateModel();

  try {
    const matGroup = model.AddBaseMaterialGroup();
    const mgId = matGroup.GetResourceID();
    const col = new lib.sColor();
    col.set_Red(120); col.set_Green(160); col.set_Blue(180); col.set_Alpha(255);
    const matIdx = matGroup.AddMaterial('Snapfit', col);
    col.delete();

    const mesh = model.AddMeshObject();
    mesh.SetName('Snap-fit Pair');
    mesh.SetObjectLevelProperty(mgId, matIdx);
    const mb = new MeshBuilder(lib, mesh);

    // ── Male part (cantilever beam + hook at the tip) ─────────────────
    // Base plate the beam attaches to
    const maleX = -maleBaseW - beamLength;
    mb.addBox(maleX, 0, 0, maleBaseW, beamWidth, beamThickness + hookHeight + 2);
    // Cantilever beam
    mb.addBox(maleX + maleBaseW, 0, 0, beamLength, beamWidth, beamThickness);
    // Hook bump at the beam tip
    const hookX = maleX + maleBaseW + beamLength - hookDepth;
    mb.addBox(hookX, 0, beamThickness, hookDepth, beamWidth, hookHeight);

    // ── Female part (slot with internal catch lip) ────────────────────
    const femaleX = partGap;
    // Outer walls framing the slot (top/bottom/left/back)
    const wallT = 2;
    // Left wall (entry side — closed at the back)
    mb.addBox(femaleX, 0, 0, wallT, beamWidth + wallT * 2, femaleThickness);
    // Top wall (above slot)
    mb.addBox(femaleX, beamWidth + wallT, 0, femaleBaseW, wallT, femaleThickness);
    // Bottom wall (below slot)
    mb.addBox(femaleX, 0, 0, femaleBaseW, wallT, femaleThickness);
    // Back wall (closed end)
    mb.addBox(femaleX + femaleBaseW - wallT, 0, 0, wallT, beamWidth + wallT * 2, femaleThickness);
    // Floor of the slot (under where the beam slides in)
    mb.addBox(femaleX + wallT, wallT, 0, femaleBaseW - wallT * 2, beamWidth, beamThickness);
    // Roof of the slot with a lip that catches the hook bump
    // Roof sits above the beam with clearance; the catch lip is an internal
    // protrusion on the underside of the roof near the entry.
    const roofZ = beamThickness + hookHeight + clearance;
    mb.addBox(femaleX + wallT, wallT, roofZ, femaleBaseW - wallT * 2, beamWidth, femaleThickness - roofZ);
    // Catch lip — a small bump protruding downward from the roof, positioned
    // at the back of the slot so the hook snaps behind it.
    const lipX = femaleX + femaleBaseW - wallT - hookDepth - 0.5;
    mb.addBox(lipX, wallT, beamThickness + clearance, hookDepth, beamWidth, hookHeight);

    model.AddBuildItem(mesh, wrapper.GetIdentityTransform());

    const mdg = model.GetMetaDataGroup();
    const addMd = (k, v) => { const m = mdg.AddMetaData('', k, v, 'string', true); m.delete(); };
    addMd('Title', 'Snap-fit Pair');
    addMd('Application', '3DPrintForge Model Forge');
    addMd('CreationDate', new Date().toISOString().split('T')[0]);

    const vfsPath = `/snapfit_${Date.now()}.3mf`;
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
