/**
 * Filament Spool Adapter Generator
 *
 * Generates an annular adapter (bushing) that fits over an existing spool
 * hub to make it fit a different-sized holder. Typical use cases:
 *   - Adapting 25mm hubs to 52mm AMS Lite rollers
 *   - Adapting 52mm hubs to 40mm universal rollers
 *   - Converting cardboard spools to fit 3D-printed holders
 *
 * The adapter is a simple watertight tube — outer cylinder with an inner
 * hole — optionally with internal ribs that bite into cardboard spools
 * to prevent slipping.
 */

import { MeshBuilder, getLib } from '../mesh-builder.js';
import { num, int } from './_shared/validate.js';

/**
 * @typedef {object} SpoolAdapterOptions
 * @property {number} [innerDiameter=25] - inner hole (hub) diameter (mm)
 * @property {number} [outerDiameter=52] - outer diameter (target mount) (mm)
 * @property {number} [height=10]        - axial thickness (mm)
 * @property {number} [ribCount=0]       - internal grip ribs (0 = smooth)
 * @property {number} [ribHeight=0.4]    - rib protrusion depth (mm)
 */

/**
 * @param {SpoolAdapterOptions} opts
 * @returns {Promise<Buffer>}
 */
export async function generateSpoolAdapter3MF(opts = {}) {
  const innerD = num(opts.innerDiameter, 5, 200, 25);
  const outerD = num(opts.outerDiameter, innerD + 2, 300, 52);
  const height = num(opts.height, 2, 100, 10);
  const ribCount = int(opts.ribCount, 0, 24, 0);
  const ribHeight = num(opts.ribHeight, 0.2, 2, 0.4);

  const lib = await getLib();
  const wrapper = new lib.CWrapper();
  const model = wrapper.CreateModel();

  try {
    const matGroup = model.AddBaseMaterialGroup();
    const mgId = matGroup.GetResourceID();
    const col = new lib.sColor();
    col.set_Red(140); col.set_Green(120); col.set_Blue(90); col.set_Alpha(255);
    const matIdx = matGroup.AddMaterial('Adapter', col);
    col.delete();

    const mesh = model.AddMeshObject();
    mesh.SetName(`Spool Adapter ${innerD}-${outerD}mm`);
    mesh.SetObjectLevelProperty(mgId, matIdx);
    const mb = new MeshBuilder(lib, mesh);

    // Main tube
    mb.addTube(0, 0, 0, outerD / 2, innerD / 2, height, 64);

    // Internal grip ribs — small box protrusions facing inward
    if (ribCount > 0) {
      const ribW = 1.5;
      const ribL = Math.min(height - 2, 8);
      for (let i = 0; i < ribCount; i++) {
        const a = (i / ribCount) * Math.PI * 2;
        const cx = Math.cos(a) * (innerD / 2 - ribHeight / 2);
        const cy = Math.sin(a) * (innerD / 2 - ribHeight / 2);
        // Align box roughly tangent to the circle
        mb.addBox(cx - ribW / 2, cy - ribW / 2, (height - ribL) / 2, ribW, ribW, ribL);
      }
    }

    model.AddBuildItem(mesh, wrapper.GetIdentityTransform());

    const mdg = model.GetMetaDataGroup();
    const addMd = (k, v) => { const m = mdg.AddMetaData('', k, v, 'string', true); m.delete(); };
    addMd('Title', `Spool Adapter ${innerD}-${outerD}mm`);
    addMd('Application', '3DPrintForge Model Forge');
    addMd('CreationDate', new Date().toISOString().split('T')[0]);

    const vfsPath = `/spool_adapter_${Date.now()}.3mf`;
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
