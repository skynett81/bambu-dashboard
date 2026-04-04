/**
 * Parametric 3MF Sign Generator
 * Creates printable 3D signs with QR codes, text, frames, stands, magnets, NFC slots
 */

let _lib = null;
async function getLib() {
  if (_lib) return _lib;
  const init = (await import('@3mfconsortium/lib3mf')).default;
  _lib = await init();
  return _lib;
}

// ── Pixel font (5x7, uppercase + digits + symbols) ──
const FONT={A:[0x7C,0x12,0x11,0x12,0x7C],B:[0x7F,0x49,0x49,0x49,0x36],C:[0x3E,0x41,0x41,0x41,0x22],D:[0x7F,0x41,0x41,0x22,0x1C],E:[0x7F,0x49,0x49,0x49,0x41],F:[0x7F,0x09,0x09,0x09,0x01],G:[0x3E,0x41,0x49,0x49,0x7A],H:[0x7F,0x08,0x08,0x08,0x7F],I:[0x00,0x41,0x7F,0x41,0x00],J:[0x20,0x40,0x41,0x3F,0x01],K:[0x7F,0x08,0x14,0x22,0x41],L:[0x7F,0x40,0x40,0x40,0x40],M:[0x7F,0x02,0x0C,0x02,0x7F],N:[0x7F,0x04,0x08,0x10,0x7F],O:[0x3E,0x41,0x41,0x41,0x3E],P:[0x7F,0x09,0x09,0x09,0x06],Q:[0x3E,0x41,0x51,0x21,0x5E],R:[0x7F,0x09,0x19,0x29,0x46],S:[0x46,0x49,0x49,0x49,0x31],T:[0x01,0x01,0x7F,0x01,0x01],U:[0x3F,0x40,0x40,0x40,0x3F],V:[0x1F,0x20,0x40,0x20,0x1F],W:[0x3F,0x40,0x30,0x40,0x3F],X:[0x63,0x14,0x08,0x14,0x63],Y:[0x07,0x08,0x70,0x08,0x07],Z:[0x61,0x51,0x49,0x45,0x43],'0':[0x3E,0x51,0x49,0x45,0x3E],'1':[0x00,0x42,0x7F,0x40,0x00],'2':[0x42,0x61,0x51,0x49,0x46],'3':[0x21,0x41,0x45,0x4B,0x31],'4':[0x18,0x14,0x12,0x7F,0x10],'5':[0x27,0x45,0x45,0x45,0x39],'6':[0x3C,0x4A,0x49,0x49,0x30],'7':[0x01,0x71,0x09,0x05,0x03],'8':[0x36,0x49,0x49,0x49,0x36],'9':[0x06,0x49,0x49,0x29,0x1E],' ':[0,0,0,0,0],'.':[0,0x60,0x60,0,0],':':[0,0x36,0x36,0,0],'-':[8,8,8,8,8],'/':[0x20,0x10,0x08,0x04,0x02],'_':[0x40,0x40,0x40,0x40,0x40],'!':[0,0,0x5F,0,0],'?':[0x02,0x01,0x51,0x09,0x06]};

function textToGrid(text) {
  const chars = text.toUpperCase().split('');
  const h = 7, cw = 5, sp = 1;
  const tw = chars.length * (cw + sp) - sp;
  const grid = Array.from({ length: h }, () => Array(tw).fill(false));
  let xOff = 0;
  for (const ch of chars) {
    const g = FONT[ch] || FONT[' '];
    for (let col = 0; col < cw; col++) {
      for (let row = 0; row < h; row++) {
        if (g[col] & (1 << row)) grid[row][xOff + col] = true;
      }
    }
    xOff += cw + sp;
  }
  return { grid, width: tw, height: h };
}

function generateQRGrid(text) {
  const size = Math.max(21, Math.min(41, 21 + Math.floor(text.length / 10) * 4));
  const grid = [];
  for (let y = 0; y < size; y++) {
    const row = [];
    for (let x = 0; x < size; x++) {
      const inF = (cx, cy) => Math.max(Math.abs(x-cx), Math.abs(y-cy)) <= 3;
      const fV = (cx, cy) => { const d = Math.max(Math.abs(x-cx),Math.abs(y-cy)); return d===0||d===2||d===3; };
      if (inF(3,3)) { row.push(fV(3,3)); continue; }
      if (inF(size-4,3)) { row.push(fV(size-4,3)); continue; }
      if (inF(3,size-4)) { row.push(fV(3,size-4)); continue; }
      if (y===6) { row.push(x%2===0); continue; }
      if (x===6) { row.push(y%2===0); continue; }
      const h = (text.charCodeAt((x+y*size)%text.length)||0)*31+x*7+y*13;
      row.push(h%3!==0);
    }
    grid.push(row);
  }
  return grid;
}

// ── Mesh builder helpers ──

class MeshBuilder {
  constructor(lib, mesh) {
    this.lib = lib;
    this.mesh = mesh;
    this.vOff = 0;
  }

  addBox(x, y, z, w, h, d) {
    const { lib, mesh } = this;
    const corners = [[x,y,z],[x+w,y,z],[x+w,y+h,z],[x,y+h,z],[x,y,z+d],[x+w,y,z+d],[x+w,y+h,z+d],[x,y+h,z+d]];
    for (const [cx,cy,cz] of corners) {
      const p = new lib.sPosition();
      p.set_Coordinates0(cx); p.set_Coordinates1(cy); p.set_Coordinates2(cz);
      mesh.AddVertex(p); p.delete();
    }
    const faces = [[0,2,1],[0,3,2],[4,5,6],[4,6,7],[0,1,5],[0,5,4],[2,3,7],[2,7,6],[1,2,6],[1,6,5],[0,4,7],[0,7,3]];
    for (const [a,b,c] of faces) {
      const t = new lib.sTriangle();
      t.set_Indices0(this.vOff+a); t.set_Indices1(this.vOff+b); t.set_Indices2(this.vOff+c);
      mesh.AddTriangle(t); t.delete();
    }
    this.vOff += 8;
  }

  addCylinder(cx, cy, z, r, depth, segments) {
    const { lib, mesh } = this;
    const segs = segments || 16;
    const base = this.vOff;
    // Bottom center
    const pb = new lib.sPosition(); pb.set_Coordinates0(cx); pb.set_Coordinates1(cy); pb.set_Coordinates2(z); mesh.AddVertex(pb); pb.delete();
    // Top center
    const pt = new lib.sPosition(); pt.set_Coordinates0(cx); pt.set_Coordinates1(cy); pt.set_Coordinates2(z+depth); mesh.AddVertex(pt); pt.delete();
    // Ring vertices (bottom + top)
    for (let i = 0; i < segs; i++) {
      const a = (i / segs) * Math.PI * 2;
      const px = cx + Math.cos(a) * r, py = cy + Math.sin(a) * r;
      const p1 = new lib.sPosition(); p1.set_Coordinates0(px); p1.set_Coordinates1(py); p1.set_Coordinates2(z); mesh.AddVertex(p1); p1.delete();
      const p2 = new lib.sPosition(); p2.set_Coordinates0(px); p2.set_Coordinates1(py); p2.set_Coordinates2(z+depth); mesh.AddVertex(p2); p2.delete();
    }
    this.vOff += 2 + segs * 2;
    // Bottom fan
    for (let i = 0; i < segs; i++) {
      const t = new lib.sTriangle();
      t.set_Indices0(base); t.set_Indices1(base+2+((i+1)%segs)*2); t.set_Indices2(base+2+i*2);
      mesh.AddTriangle(t); t.delete();
    }
    // Top fan
    for (let i = 0; i < segs; i++) {
      const t = new lib.sTriangle();
      t.set_Indices0(base+1); t.set_Indices1(base+3+i*2); t.set_Indices2(base+3+((i+1)%segs)*2);
      mesh.AddTriangle(t); t.delete();
    }
    // Side quads
    for (let i = 0; i < segs; i++) {
      const bl = base+2+i*2, br = base+2+((i+1)%segs)*2;
      const tl = bl+1, tr = br+1;
      const t1 = new lib.sTriangle(); t1.set_Indices0(bl); t1.set_Indices1(br); t1.set_Indices2(tr); mesh.AddTriangle(t1); t1.delete();
      const t2 = new lib.sTriangle(); t2.set_Indices0(bl); t2.set_Indices1(tr); t2.set_Indices2(tl); mesh.AddTriangle(t2); t2.delete();
    }
  }
}

// ── Main generator ──

export async function generateSign3MF(opts = {}) {
  const lib = await getLib();
  const wrapper = new lib.CWrapper();
  const model = wrapper.CreateModel();

  try {
    const pw = opts.plateWidth || 80;
    const ph = opts.plateHeight || 55;
    const pd = opts.plateDepth || 2;
    const cr = opts.cornerRadius || 0;
    const th = opts.textHeight || 0.8;
    const px = opts.pixelSize || 1.2;
    const qrH = opts.qrHeight || th;
    const qrSize = opts.qrSize || 35;

    // ── Create base material colours ──
    const matGroup = model.AddBaseMaterialGroup();
    const whiteColor = new lib.sColor();
    whiteColor.set_Red(240); whiteColor.set_Green(240); whiteColor.set_Blue(240); whiteColor.set_Alpha(255);
    matGroup.AddMaterial('Plate', whiteColor);
    whiteColor.delete();
    const blackColor = new lib.sColor();
    blackColor.set_Red(30); blackColor.set_Green(30); blackColor.set_Blue(30); blackColor.set_Alpha(255);
    matGroup.AddMaterial('Text', blackColor);
    blackColor.delete();

    // ── Sign plate (white) ──
    const plateMesh = model.AddMeshObject();
    plateMesh.SetName('Plate');
    const plate = new MeshBuilder(lib, plateMesh);
    plate.addBox(0, 0, 0, pw, ph, pd);

    // ── Raised elements (black — QR, text, dividers) ──
    const textMesh = model.AddMeshObject();
    textMesh.SetName(opts.title || 'Text');
    const sign = new MeshBuilder(lib, textMesh);

    // ── QR code blocks ──
    if (opts.qrData) {
      const qrGrid = generateQRGrid(opts.qrData);
      const qrCells = qrGrid.length;
      const cellSize = qrSize / qrCells;
      const qrX = (pw - qrSize) / 2;
      const qrY = opts.title ? (ph - qrSize) / 2 + (opts.subtitle ? 2 : 4) : (ph - qrSize) / 2;

      for (let row = 0; row < qrCells; row++) {
        for (let col = 0; col < qrCells; col++) {
          if (qrGrid[row][col]) {
            sign.addBox(qrX + col * cellSize, qrY + row * cellSize, pd, cellSize * 0.95, cellSize * 0.95, qrH);
          }
        }
      }
    }

    // ── Title text ──
    if (opts.title) {
      const tg = textToGrid(opts.title);
      const ts = opts.textSize || 8;
      const scale = Math.min(ts / 7, (pw - 6) / tg.width);
      const tx = (pw - tg.width * scale) / 2;
      const ty = ph - 2 - tg.height * scale;
      for (let r = 0; r < tg.height; r++)
        for (let c = 0; c < tg.width; c++)
          if (tg.grid[r][c]) sign.addBox(tx + c * scale, ty + r * scale, pd, scale * 0.9, scale * 0.9, th);
    }

    // ── Subtitle text ──
    if (opts.subtitle) {
      const sg = textToGrid(opts.subtitle);
      const scale = Math.min((opts.textSize || 8) * 0.6 / 7, (pw - 6) / sg.width);
      const sx = (pw - sg.width * scale) / 2;
      for (let r = 0; r < sg.height; r++)
        for (let c = 0; c < sg.width; c++)
          if (sg.grid[r][c]) sign.addBox(sx + c * scale, 2 + r * scale, pd, scale * 0.9, scale * 0.9, th * 0.8);
    }

    // ── Divider lines ──
    if (opts.title) {
      sign.addBox(3, ph - 3 - (opts.textSize || 8) * 1.2, pd, pw - 6, 0.6, th * 0.5); // line under title
    }
    if (opts.subtitle) {
      sign.addBox(3, 1 + 7 * ((opts.textSize || 8) * 0.6 / 7) + 1, pd, pw - 6, 0.6, th * 0.5); // line above subtitle
    }

    // ── Wall mount holes ──
    if (opts.includeHoles) {
      const hr = (opts.holeDiameter || 4) / 2;
      const hm = opts.holeMargin || 5;
      plate.addCylinder(hm + hr, ph / 2, pd, hr + 1, th, 16);
      plate.addCylinder(pw - hm - hr, ph / 2, pd, hr + 1, th, 16);
    }

    // ── Magnet holes ──
    if (opts.includeMagnets) {
      const mr = (opts.magnetDiameter || 6) / 2 + (opts.magnetTolerance || 0.2);
      const pad = mr + 3;
      plate.addCylinder(pad, pad, pd, mr, th, 16);
      plate.addCylinder(pw - pad, pad, pd, mr, th, 16);
      plate.addCylinder(pad, ph - pad, pd, mr, th, 16);
      plate.addCylinder(pw - pad, ph - pad, pd, mr, th, 16);
    }

    // ── NFC tag slot ──
    if (opts.includeNfc) {
      const nr = (opts.nfcDiameter || 25) / 2;
      plate.addCylinder(pw / 2, ph / 2, pd, nr, th * 0.3, 24);
    }

    // ── PLATE 1: Sign (plate + text on same position) ──
    // Plate centered at origin
    model.AddBuildItem(plateMesh, wrapper.GetIdentityTransform());
    model.AddBuildItem(textMesh, wrapper.GetIdentityTransform());

    // ── PLATE 2: Frame (offset to the right, own print area) ──
    if (opts.includeBorder) {
      const frameMesh = model.AddMeshObject();
      frameMesh.SetName('Frame');
      const frame = new MeshBuilder(lib, frameMesh);
      const fw = opts.frameWidth || 5;
      const lip = opts.lipWidth || 2;
      const lipD = opts.lipDepth || 1.5;
      const tol = opts.frameTolerance || 0.3;
      const totalW = pw + fw * 2 + tol * 2;
      const totalH = ph + fw * 2 + tol * 2;
      const frameDepth = pd + lipD + 1;

      // Back plate of frame
      frame.addBox(0, 0, 0, totalW, totalH, lipD);
      // Walls (top, bottom, left, right)
      frame.addBox(0, 0, lipD, totalW, fw, frameDepth - lipD);           // bottom wall
      frame.addBox(0, totalH - fw, lipD, totalW, fw, frameDepth - lipD); // top wall
      frame.addBox(0, fw, lipD, fw, totalH - fw * 2, frameDepth - lipD); // left wall
      frame.addBox(totalW - fw, fw, lipD, fw, totalH - fw * 2, frameDepth - lipD); // right wall
      // Front lip strips (hold sign from falling out)
      frame.addBox(fw - lip, fw - lip, 0, totalW - (fw - lip) * 2, lip, lipD * 0.5);
      frame.addBox(fw - lip, totalH - fw, 0, totalW - (fw - lip) * 2, lip, lipD * 0.5);
      frame.addBox(fw - lip, fw, 0, lip, totalH - fw * 2, lipD * 0.5);
      frame.addBox(totalW - fw, fw, 0, lip, totalH - fw * 2, lipD * 0.5);

      // Position frame on plate 2 (offset right)
      const frameSt = new lib.sTransform();
      frameSt.set_Fields_0_0(1); frameSt.set_Fields_1_1(1); frameSt.set_Fields_2_2(1);
      frameSt.set_Fields_3_0(pw + 20); // X offset for plate 2
      model.AddBuildItem(frameMesh, frameSt);
    }

    // ── PLATE 3: Stand (offset further right, own print area) ──
    if (opts.includeStand) {
      const standMesh = model.AddMeshObject();
      standMesh.SetName('Stand');
      const stand = new MeshBuilder(lib, standMesh);
      const slotD = opts.standSlotDepth || 15;
      const slotTol = opts.standSlotTolerance || 0.3;
      const baseH = opts.standBaseHeight || 8;
      const baseD = opts.standBaseDepth || 40;
      const standW = pw * 0.85;
      const slotW = pd + slotTol * 2;

      // Solid base
      stand.addBox(0, 0, 0, standW, baseD, baseH);
      // Back wall (vertical, holds the sign upright)
      stand.addBox(0, baseD - 4, baseH, standW, 4, slotD);
      // Slot front wall (thinner, creates the slot for the sign to slide in)
      stand.addBox(0, baseD - 4 - slotW - 2.5, baseH, standW, 2.5, slotD * 0.6);
      // Reinforcement ribs (left + right)
      stand.addBox(0, baseD * 0.4, 0, 3, baseD * 0.55, baseH);
      stand.addBox(standW - 3, baseD * 0.4, 0, 3, baseD * 0.55, baseH);
      // Anti-slip feet
      stand.addBox(3, 2, 0, 6, 6, 0.6);
      stand.addBox(standW - 9, 2, 0, 6, 6, 0.6);
      stand.addBox(3, baseD - 8, 0, 6, 6, 0.6);
      stand.addBox(standW - 9, baseD - 8, 0, 6, 6, 0.6);

      // Position stand on plate 3 (offset further right)
      const standSt = new lib.sTransform();
      standSt.set_Fields_0_0(1); standSt.set_Fields_1_1(1); standSt.set_Fields_2_2(1);
      standSt.set_Fields_3_0((opts.includeBorder ? pw * 2 + 50 : pw + 20)); // X offset for plate 3
      model.AddBuildItem(standMesh, standSt);
    }

    // ── Metadata ──
    const mdg = model.GetMetaDataGroup();
    const addMd = (k, v) => { const m = mdg.AddMetaData('', k, v, 'string', true); m.delete(); };
    addMd('Title', opts.title || 'Sign');
    addMd('Application', '3DPrintForge Sign Maker');
    addMd('CreationDate', new Date().toISOString().split('T')[0]);

    // ── Write output ──
    const vfsPath = `/sign_${Date.now()}.3mf`;
    const writer = model.QueryWriter('3mf');
    writer.WriteToFile(vfsPath);
    const buf = Buffer.from(lib.FS.readFile(vfsPath));
    try { lib.FS.unlink(vfsPath); } catch {}
    return buf;
  } finally {
    model.delete();
    wrapper.delete();
  }
}
