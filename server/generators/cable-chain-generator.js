/**
 * Cable Chain Link Generator
 *
 * Generates a single cable chain (drag chain) link with pivot holes at
 * both ends. Users print N copies and link them together with separately
 * printed pins (or short M3 bolts) to form a flexible cable management
 * chain that protects wires from moving printer axes.
 *
 * Each link is a rectangular tube (top + bottom + two side walls) with a
 * through-hole at each end for the pivot pin. Because we can't do CSG,
 * the through-holes are built using `addExtrudedAnnulus` — a watertight
 * prism with a matching inner ring.
 */

import { MeshBuilder, getLib } from '../mesh-builder.js';
import { num } from './_shared/validate.js';

/**
 * @typedef {object} CableChainOptions
 * @property {number} [length=20]       - link length (pivot-to-pivot) (mm)
 * @property {number} [width=12]        - inner cable width (mm)
 * @property {number} [height=10]       - inner cable height (mm)
 * @property {number} [wallThickness=1.6]
 * @property {number} [pinDiameter=3]   - hole diameter for pivot pin (mm)
 */

/**
 * @param {CableChainOptions} opts
 * @returns {Promise<Buffer>}
 */
export async function generateCableChain3MF(opts = {}) {
  const length = num(opts.length, 8, 80, 20);
  const width = num(opts.width, 4, 40, 12);
  const height = num(opts.height, 4, 40, 10);
  const wall = num(opts.wallThickness, 0.8, 4, 1.6);
  const pinD = num(opts.pinDiameter, 1, 8, 3);

  const outerW = width + wall * 2;
  const outerH = height + wall * 2;

  const lib = await getLib();
  const wrapper = new lib.CWrapper();
  const model = wrapper.CreateModel();

  try {
    const matGroup = model.AddBaseMaterialGroup();
    const mgId = matGroup.GetResourceID();
    const col = new lib.sColor();
    col.set_Red(80); col.set_Green(80); col.set_Blue(85); col.set_Alpha(255);
    const matIdx = matGroup.AddMaterial('Chain', col);
    col.delete();

    const mesh = model.AddMeshObject();
    mesh.SetName(`Cable Chain Link ${length}x${width}x${height}mm`);
    mesh.SetObjectLevelProperty(mgId, matIdx);
    const mb = new MeshBuilder(lib, mesh);

    // Floor and ceiling (full length, full width)
    mb.addBox(0, 0, 0, length, outerW, wall);                    // floor
    mb.addBox(0, 0, outerH - wall, length, outerW, wall);        // ceiling

    // Side walls (cable retaining)
    mb.addBox(0, 0, wall, length, wall, outerH - wall * 2);                // left wall
    mb.addBox(0, outerW - wall, wall, length, wall, outerH - wall * 2);    // right wall

    // Pivot lugs at both ends — cylinders with through-holes
    const lugR = outerW / 2 - wall * 0.2;
    const lugLen = wall * 1.8;
    // Left lug (solid cylinder on the -X end)
    buildPivotLug(mb, -lugLen / 2, outerW / 2, outerH / 2, lugR, lugLen, pinD / 2);
    // Right lug
    buildPivotLug(mb, length - lugLen / 2, outerW / 2, outerH / 2, lugR, lugLen, pinD / 2);

    model.AddBuildItem(mesh, wrapper.GetIdentityTransform());

    const mdg = model.GetMetaDataGroup();
    const addMd = (k, v) => { const m = mdg.AddMetaData('', k, v, 'string', true); m.delete(); };
    addMd('Title', 'Cable Chain Link');
    addMd('Application', '3DPrintForge Model Forge');
    addMd('CreationDate', new Date().toISOString().split('T')[0]);

    const vfsPath = `/cable_chain_${Date.now()}.3mf`;
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

/**
 * Build a Z-aligned pivot lug — a hollow disc (outer cylinder with a pin hole).
 * The lug extrudes along +X so the pivot axis runs X.
 */
function buildPivotLug(mb, x0, cy, cz, outerR, lenX, innerR) {
  const segs = 24;
  const base = mb.vOff;
  // 4 rings: outer x0, outer x1, inner x0, inner x1
  for (let i = 0; i < segs; i++) {
    const a = (i / segs) * Math.PI * 2;
    const c = Math.cos(a), s = Math.sin(a);
    mb._addVertex(x0,        cy + c * outerR, cz + s * outerR);
    mb._addVertex(x0 + lenX, cy + c * outerR, cz + s * outerR);
    mb._addVertex(x0,        cy + c * innerR, cz + s * innerR);
    mb._addVertex(x0 + lenX, cy + c * innerR, cz + s * innerR);
  }
  for (let i = 0; i < segs; i++) {
    const n = (i + 1) % segs;
    const o0 = base + i * 4, o1 = o0 + 1, i0 = o0 + 2, i1 = o0 + 3;
    const no0 = base + n * 4, no1 = no0 + 1, ni0 = no0 + 2, ni1 = no0 + 3;
    // Outer cylinder wall
    mb._addTri(o0, no0, no1); mb._addTri(o0, no1, o1);
    // Inner cylinder wall (reversed)
    mb._addTri(i0, ni1, ni0); mb._addTri(i0, i1, ni1);
    // End caps (annular rings)
    mb._addTri(o0, i0, ni0); mb._addTri(o0, ni0, no0);
    mb._addTri(o1, no1, ni1); mb._addTri(o1, ni1, i1);
  }
}
