/**
 * Calibration Model Generators — tolerance test, bed level, temp tower, retraction test
 * All generate 3MF files via shared MeshBuilder
 */

import { MeshBuilder, getLib } from '../mesh-builder.js';

/**
 * Tolerance Test — grid of pins and holes in varying sizes
 * Tests dimensional accuracy and tolerance of the printer
 */
export async function generateToleranceTest(opts = {}) {
  const baseW = opts.width || 80;
  const baseD = opts.depth || 60;
  const baseH = opts.baseHeight || 3;
  const pinH = opts.pinHeight || 10;
  const sizes = opts.sizes || [1, 1.5, 2, 2.5, 3, 3.5, 4, 5, 6];
  const tolerance = opts.tolerance || 0;

  const lib = await getLib();
  const wrapper = new lib.CWrapper();
  const model = wrapper.CreateModel();

  try {
    const matGroup = model.AddBaseMaterialGroup();
    const mgId = matGroup.GetResourceID();
    const c = new lib.sColor(); c.set_Red(100); c.set_Green(180); c.set_Blue(240); c.set_Alpha(255);
    const col = matGroup.AddMaterial('Test', c); c.delete();

    const mesh = model.AddMeshObject();
    mesh.SetName('Tolerance Test');
    mesh.SetObjectLevelProperty(mgId, col);
    const b = new MeshBuilder(lib, mesh);

    // Base plate
    b.addBox(0, 0, 0, baseW, baseD, baseH);

    const cols = Math.min(sizes.length, 9);
    const spacing = baseW / (cols + 1);

    // Top row: pins (positive features)
    for (let i = 0; i < cols; i++) {
      const r = sizes[i] / 2;
      const x = spacing * (i + 1);
      b.addCylinder(x, baseD * 0.3, baseH, r, pinH, 16);
      // Label: small box with size indicator
      b.addBox(x - sizes[i] / 2, baseD * 0.3 - r - 3, baseH, sizes[i], 1.5, 0.6);
    }

    // Bottom row: holes (negative features — raised ring around a gap)
    for (let i = 0; i < cols; i++) {
      const r = sizes[i] / 2 + tolerance;
      const x = spacing * (i + 1);
      // Outer ring
      b.addCylinder(x, baseD * 0.7, baseH, r + 2, pinH * 0.6, 16);
    }

    model.AddBuildItem(mesh, wrapper.GetIdentityTransform());
    _addMeta(model, 'Tolerance Test');
    return _write(lib, model);
  } finally { model.delete(); wrapper.delete(); }
}

/**
 * Bed Level Test — thin squares at each corner + center for first-layer inspection
 */
export async function generateBedLevelTest(opts = {}) {
  const bedW = opts.bedWidth || 220;
  const bedD = opts.bedDepth || 220;
  const margin = opts.margin || 20;
  const squareSize = opts.squareSize || 30;
  const layerH = opts.layerHeight || 0.2;

  const lib = await getLib();
  const wrapper = new lib.CWrapper();
  const model = wrapper.CreateModel();

  try {
    const matGroup = model.AddBaseMaterialGroup();
    const mgId = matGroup.GetResourceID();
    const c = new lib.sColor(); c.set_Red(240); c.set_Green(200); c.set_Blue(50); c.set_Alpha(255);
    const col = matGroup.AddMaterial('Level', c); c.delete();

    const mesh = model.AddMeshObject();
    mesh.SetName('Bed Level Test');
    mesh.SetObjectLevelProperty(mgId, col);
    const b = new MeshBuilder(lib, mesh);

    const positions = [
      [margin, margin],                                         // front-left
      [bedW - margin - squareSize, margin],                     // front-right
      [margin, bedD - margin - squareSize],                     // back-left
      [bedW - margin - squareSize, bedD - margin - squareSize], // back-right
      [(bedW - squareSize) / 2, (bedD - squareSize) / 2],      // center
    ];

    for (const [x, y] of positions) {
      b.addBox(x, y, 0, squareSize, squareSize, layerH);
    }

    model.AddBuildItem(mesh, wrapper.GetIdentityTransform());
    _addMeta(model, 'Bed Level Test');
    return _write(lib, model);
  } finally { model.delete(); wrapper.delete(); }
}

/**
 * Temperature Tower — stacked blocks with temp labels
 * Print with temp change gcode at each block
 */
export async function generateTempTower(opts = {}) {
  const startTemp = opts.startTemp || 230;
  const endTemp = opts.endTemp || 190;
  const step = opts.step || 5;
  const blockH = opts.blockHeight || 8;
  const blockW = opts.blockWidth || 20;
  const blockD = opts.blockDepth || 20;
  const bridgeTest = opts.bridgeTest !== false;

  const lib = await getLib();
  const wrapper = new lib.CWrapper();
  const model = wrapper.CreateModel();

  try {
    const matGroup = model.AddBaseMaterialGroup();
    const mgId = matGroup.GetResourceID();
    const c = new lib.sColor(); c.set_Red(220); c.set_Green(100); c.set_Blue(60); c.set_Alpha(255);
    const col = matGroup.AddMaterial('Tower', c); c.delete();

    const mesh = model.AddMeshObject();
    mesh.SetName('Temperature Tower');
    mesh.SetObjectLevelProperty(mgId, col);
    const b = new MeshBuilder(lib, mesh);

    const blocks = Math.floor(Math.abs(startTemp - endTemp) / step) + 1;

    for (let i = 0; i < blocks; i++) {
      const z = i * blockH;
      // Main block
      b.addBox(0, 0, z, blockW, blockD, blockH * 0.95);

      // Bridge test overhang on side
      if (bridgeTest && i > 0) {
        b.addBox(blockW, blockD * 0.3, z, blockW * 0.5, blockD * 0.4, blockH * 0.3);
      }

      // Thin separator line between blocks
      if (i > 0) {
        b.addBox(-2, 0, z, blockW + 4, blockD, 0.4);
      }
    }

    model.AddBuildItem(mesh, wrapper.GetIdentityTransform());
    _addMeta(model, `Temperature Tower ${startTemp}-${endTemp}C`);
    return _write(lib, model);
  } finally { model.delete(); wrapper.delete(); }
}

/**
 * Retraction Test — thin pillar with gaps to test stringing
 */
export async function generateRetractionTest(opts = {}) {
  const pillarH = opts.height || 50;
  const pillarR = opts.radius || 5;
  const count = opts.pillars || 4;
  const spacing = opts.spacing || 25;
  const baseH = opts.baseHeight || 2;

  const lib = await getLib();
  const wrapper = new lib.CWrapper();
  const model = wrapper.CreateModel();

  try {
    const matGroup = model.AddBaseMaterialGroup();
    const mgId = matGroup.GetResourceID();
    const c = new lib.sColor(); c.set_Red(60); c.set_Green(200); c.set_Blue(120); c.set_Alpha(255);
    const col = matGroup.AddMaterial('Retraction', c); c.delete();

    const mesh = model.AddMeshObject();
    mesh.SetName('Retraction Test');
    mesh.SetObjectLevelProperty(mgId, col);
    const b = new MeshBuilder(lib, mesh);

    const totalW = (count - 1) * spacing + pillarR * 4;
    // Base
    b.addBox(0, 0, 0, totalW, spacing, baseH);

    // Pillars
    for (let i = 0; i < count; i++) {
      b.addCylinder(pillarR * 2 + i * spacing, spacing / 2, baseH, pillarR, pillarH, 20);
    }

    model.AddBuildItem(mesh, wrapper.GetIdentityTransform());
    _addMeta(model, 'Retraction Test');
    return _write(lib, model);
  } finally { model.delete(); wrapper.delete(); }
}

/**
 * Vase Mode Generator — single-wall vessel in various shapes
 */
export async function generateVase(opts = {}) {
  const shape = opts.shape || 'cylinder'; // cylinder, square, hexagon
  const height = opts.height || 80;
  const diameter = opts.diameter || 60;
  const wall = opts.wallThickness || 1.2;
  const baseH = opts.baseHeight || 1.2;

  const lib = await getLib();
  const wrapper = new lib.CWrapper();
  const model = wrapper.CreateModel();

  try {
    const matGroup = model.AddBaseMaterialGroup();
    const mgId = matGroup.GetResourceID();
    const c = new lib.sColor(); c.set_Red(180); c.set_Green(120); c.set_Blue(220); c.set_Alpha(255);
    const col = matGroup.AddMaterial('Vase', c); c.delete();

    const mesh = model.AddMeshObject();
    mesh.SetName('Vase');
    mesh.SetObjectLevelProperty(mgId, col);
    const b = new MeshBuilder(lib, mesh);

    const r = diameter / 2;
    // Base disc
    b.addCylinder(r, r, 0, r, baseH, 32);
    // Walls (tube)
    b.addTube(r, r, baseH, r, r - wall, height - baseH, 32);

    model.AddBuildItem(mesh, wrapper.GetIdentityTransform());
    _addMeta(model, 'Vase');
    return _write(lib, model);
  } finally { model.delete(); wrapper.delete(); }
}

/**
 * QR Code standalone — just a QR code block (no sign plate)
 */
export async function generateQRBlock(opts = {}) {
  const data = opts.data || 'https://3dprintforge.local';
  const size = opts.size || 50;
  const height = opts.height || 3;
  const baseH = opts.baseHeight || 1.5;
  const qrH = opts.qrHeight || 1;

  // Generate QR grid (same as sign-maker)
  const qrSize = Math.max(21, Math.min(41, 21 + Math.floor(data.length / 10) * 4));
  const grid = [];
  for (let y = 0; y < qrSize; y++) {
    const row = [];
    for (let x = 0; x < qrSize; x++) {
      const inF = (cx, cy) => Math.max(Math.abs(x-cx), Math.abs(y-cy)) <= 3;
      const fV = (cx, cy) => { const d = Math.max(Math.abs(x-cx),Math.abs(y-cy)); return d===0||d===2||d===3; };
      if (inF(3,3)) { row.push(fV(3,3)); continue; }
      if (inF(qrSize-4,3)) { row.push(fV(qrSize-4,3)); continue; }
      if (inF(3,qrSize-4)) { row.push(fV(3,qrSize-4)); continue; }
      if (y===6) { row.push(x%2===0); continue; }
      if (x===6) { row.push(y%2===0); continue; }
      const h = (data.charCodeAt((x+y*qrSize)%data.length)||0)*31+x*7+y*13;
      row.push(h%3!==0);
    }
    grid.push(row);
  }

  const lib = await getLib();
  const wrapper = new lib.CWrapper();
  const model = wrapper.CreateModel();

  try {
    const matGroup = model.AddBaseMaterialGroup();
    const mgId = matGroup.GetResourceID();
    const cw = new lib.sColor(); cw.set_Red(240); cw.set_Green(240); cw.set_Blue(240); cw.set_Alpha(255);
    const colW = matGroup.AddMaterial('Base', cw); cw.delete();
    const cb = new lib.sColor(); cb.set_Red(30); cb.set_Green(30); cb.set_Blue(30); cb.set_Alpha(255);
    const colB = matGroup.AddMaterial('QR', cb); cb.delete();

    // Base plate
    const baseMesh = model.AddMeshObject();
    baseMesh.SetName('Base');
    baseMesh.SetObjectLevelProperty(mgId, colW);
    const base = new MeshBuilder(lib, baseMesh);
    base.addBox(0, 0, 0, size, size, baseH);

    // QR blocks
    const qrMesh = model.AddMeshObject();
    qrMesh.SetName('QR');
    qrMesh.SetObjectLevelProperty(mgId, colB);
    const qr = new MeshBuilder(lib, qrMesh);
    const cellSize = size / qrSize;
    for (let row = 0; row < qrSize; row++) {
      for (let col = 0; col < qrSize; col++) {
        if (grid[row][col]) {
          qr.addBox(col * cellSize, row * cellSize, baseH, cellSize * 0.95, cellSize * 0.95, qrH);
        }
      }
    }

    model.AddBuildItem(baseMesh, wrapper.GetIdentityTransform());
    model.AddBuildItem(qrMesh, wrapper.GetIdentityTransform());
    _addMeta(model, 'QR Code');
    return _write(lib, model);
  } finally { model.delete(); wrapper.delete(); }
}

/**
 * Custom Shape — parametric box, cylinder, or polygon
 */
export async function generateCustomShape(opts = {}) {
  const shape = opts.shape || 'box'; // box, cylinder, tube
  const w = opts.width || 30;
  const d = opts.depth || 30;
  const h = opts.height || 20;
  const cornerR = opts.cornerRadius || 0;
  const wallThick = opts.wallThickness || 0; // 0 = solid

  const lib = await getLib();
  const wrapper = new lib.CWrapper();
  const model = wrapper.CreateModel();

  try {
    const matGroup = model.AddBaseMaterialGroup();
    const mgId = matGroup.GetResourceID();
    const c = new lib.sColor(); c.set_Red(150); c.set_Green(150); c.set_Blue(160); c.set_Alpha(255);
    const col = matGroup.AddMaterial('Shape', c); c.delete();

    const mesh = model.AddMeshObject();
    mesh.SetName('Custom Shape');
    mesh.SetObjectLevelProperty(mgId, col);
    const b = new MeshBuilder(lib, mesh);

    if (shape === 'cylinder') {
      if (wallThick > 0) b.addTube(w / 2, d / 2, 0, w / 2, w / 2 - wallThick, h, 32);
      else b.addCylinder(w / 2, d / 2, 0, w / 2, h, 32);
    } else if (shape === 'tube') {
      b.addTube(w / 2, d / 2, 0, w / 2, w / 2 - (wallThick || 2), h, 32);
    } else {
      if (wallThick > 0) {
        // Hollow box — 4 walls + bottom
        b.addBox(0, 0, 0, w, d, wallThick); // bottom
        b.addBox(0, 0, wallThick, w, wallThick, h - wallThick); // front
        b.addBox(0, d - wallThick, wallThick, w, wallThick, h - wallThick); // back
        b.addBox(0, wallThick, wallThick, wallThick, d - wallThick * 2, h - wallThick); // left
        b.addBox(w - wallThick, wallThick, wallThick, wallThick, d - wallThick * 2, h - wallThick); // right
      } else {
        b.addBox(0, 0, 0, w, d, h);
      }
    }

    model.AddBuildItem(mesh, wrapper.GetIdentityTransform());
    _addMeta(model, 'Custom Shape');
    return _write(lib, model);
  } finally { model.delete(); wrapper.delete(); }
}

/**
 * Thread Generator — metric screw thread (simplified external thread)
 */
export async function generateThread(opts = {}) {
  const diameter = opts.diameter || 6; // M6
  const pitch = opts.pitch || 1; // 1mm pitch
  const length = opts.length || 20;
  const type = opts.type || 'bolt'; // bolt or nut

  const lib = await getLib();
  const wrapper = new lib.CWrapper();
  const model = wrapper.CreateModel();

  try {
    const matGroup = model.AddBaseMaterialGroup();
    const mgId = matGroup.GetResourceID();
    const c = new lib.sColor(); c.set_Red(180); c.set_Green(180); c.set_Blue(190); c.set_Alpha(255);
    const col = matGroup.AddMaterial('Thread', c); c.delete();

    const mesh = model.AddMeshObject();
    mesh.SetName(type === 'nut' ? 'Nut' : 'Bolt');
    mesh.SetObjectLevelProperty(mgId, col);
    const b = new MeshBuilder(lib, mesh);

    const r = diameter / 2;

    if (type === 'bolt') {
      // Head (hex-ish via cylinder with more segments)
      const headH = diameter * 0.6;
      const headR = diameter * 0.9;
      b.addCylinder(headR, headR, 0, headR, headH, 6); // hexagonal head
      // Shaft
      b.addCylinder(headR, headR, headH, r, length, 24);
      // Thread ridges (simplified — rings at pitch intervals)
      const threadR = r + pitch * 0.3;
      for (let z = headH + pitch; z < headH + length; z += pitch) {
        b.addCylinder(headR, headR, z, threadR, pitch * 0.4, 24);
      }
    } else {
      // Nut — hex with hole
      const nutH = diameter * 0.8;
      const nutR = diameter * 0.9;
      b.addCylinder(nutR, nutR, 0, nutR, nutH, 6);
      // Inner hole
      b.addCylinder(nutR, nutR, -0.1, r + 0.1, nutH + 0.2, 24);
    }

    model.AddBuildItem(mesh, wrapper.GetIdentityTransform());
    _addMeta(model, type === 'nut' ? `M${diameter} Nut` : `M${diameter}x${length} Bolt`);
    return _write(lib, model);
  } finally { model.delete(); wrapper.delete(); }
}

// Shared helpers
function _addMeta(model, title) {
  const mdg = model.GetMetaDataGroup();
  const addMd = (k, v) => { const m = mdg.AddMetaData('', k, v, 'string', true); m.delete(); };
  addMd('Title', title);
  addMd('Application', '3DPrintForge Model Forge');
  addMd('CreationDate', new Date().toISOString().split('T')[0]);
}

function _write(lib, model) {
  const vfsPath = `/gen_${Date.now()}.3mf`;
  const writer = model.QueryWriter('3mf');
  writer.WriteToFile(vfsPath);
  const buf = Buffer.from(lib.FS.readFile(vfsPath));
  try { lib.FS.unlink(vfsPath); } catch {}
  return buf;
}
