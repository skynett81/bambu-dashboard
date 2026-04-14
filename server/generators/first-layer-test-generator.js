/**
 * First Layer Test Pattern Generator
 *
 * Generates a flat calibration pattern used to dial in bed leveling, Z
 * offset, and first-layer flow. The pattern is a single-layer print with
 * distinctive features at the plate corners and center — gaps between
 * lines reveal over/under extrusion at a glance.
 *
 * Layout:
 *   - Four square "patches" at the plate corners
 *   - One central square
 *   - Thin connecting lines along the plate diagonals
 *
 * Everything is a single layer thick (default 0.2mm). The user's slicer
 * should print it at whatever standard layer height they use; the model
 * thickness is informational and will be clipped to the first layer.
 */

import { MeshBuilder, getLib } from '../mesh-builder.js';
import { num } from './_shared/validate.js';

/**
 * @typedef {object} FirstLayerTestOptions
 * @property {number} [plateWidth=120]  - X bed size (30..400)
 * @property {number} [plateDepth=120]  - Y bed size (30..400)
 * @property {number} [layerHeight=0.2] - single layer thickness (mm)
 * @property {number} [patchSize=20]    - corner patch edge length (mm)
 */

/**
 * @param {FirstLayerTestOptions} opts
 * @returns {Promise<Buffer>}
 */
export async function generateFirstLayerTest3MF(opts = {}) {
  const plateW = num(opts.plateWidth, 30, 400, 120);
  const plateD = num(opts.plateDepth, 30, 400, 120);
  const layerH = num(opts.layerHeight, 0.1, 0.6, 0.2);
  const patchSize = num(opts.patchSize, 10, 50, 20);

  const lib = await getLib();
  const wrapper = new lib.CWrapper();
  const model = wrapper.CreateModel();

  try {
    const matGroup = model.AddBaseMaterialGroup();
    const mgId = matGroup.GetResourceID();
    const col = new lib.sColor();
    col.set_Red(200); col.set_Green(220); col.set_Blue(240); col.set_Alpha(255);
    const matIdx = matGroup.AddMaterial('Test', col);
    col.delete();

    const mesh = model.AddMeshObject();
    mesh.SetName(`First Layer Test ${plateW}x${plateD}`);
    mesh.SetObjectLevelProperty(mgId, matIdx);
    const mb = new MeshBuilder(lib, mesh);

    const edge = 5;    // distance from plate edge to patch
    const line = 1.2;  // thin connector line width

    // Corner patches
    mb.addBox(edge, edge, 0, patchSize, patchSize, layerH);
    mb.addBox(plateW - edge - patchSize, edge, 0, patchSize, patchSize, layerH);
    mb.addBox(edge, plateD - edge - patchSize, 0, patchSize, patchSize, layerH);
    mb.addBox(plateW - edge - patchSize, plateD - edge - patchSize, 0, patchSize, patchSize, layerH);
    // Center patch
    mb.addBox(plateW / 2 - patchSize / 2, plateD / 2 - patchSize / 2, 0, patchSize, patchSize, layerH);

    // Diagonal connector lines — two thin boxes rotated 45° approximations.
    // Because MeshBuilder only emits axis-aligned boxes, render the diagonals
    // as a sequence of stepped small squares. 16 steps over each diagonal.
    const steps = 16;
    const dx1 = (plateW - 2 * edge - patchSize) / steps;
    const dy1 = (plateD - 2 * edge - patchSize) / steps;
    for (let i = 0; i <= steps; i++) {
      const x = edge + patchSize / 2 + i * dx1 - line / 2;
      const y = edge + patchSize / 2 + i * dy1 - line / 2;
      mb.addBox(x, y, 0, line, line, layerH);
      const y2 = plateD - edge - patchSize / 2 - i * dy1 - line / 2;
      mb.addBox(x, y2, 0, line, line, layerH);
    }

    model.AddBuildItem(mesh, wrapper.GetIdentityTransform());

    const mdg = model.GetMetaDataGroup();
    const addMd = (k, v) => { const m = mdg.AddMetaData('', k, v, 'string', true); m.delete(); };
    addMd('Title', `First Layer Test ${plateW}x${plateD}`);
    addMd('Application', '3DPrintForge Model Forge');
    addMd('CreationDate', new Date().toISOString().split('T')[0]);

    const vfsPath = `/first_layer_${Date.now()}.3mf`;
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
