/**
 * 3D QR Code Generator
 *
 * Generates a raised QR code on a flat base plate. The QR matrix is
 * computed by the `qrcode` library, then each "on" module becomes a
 * raised square on the heightmap. Great for WiFi credentials, contact
 * cards, URLs — printed or embossed into other prints.
 */

import qrcode from 'qrcode';
import { MeshBuilder, getLib } from '../mesh-builder.js';
import { num, str, bool } from './_shared/validate.js';

/** @typedef {object} QrOptions
 * @property {string} [text='https://3dprintforge']
 * @property {number} [moduleSize=2]     - mm per QR module
 * @property {number} [baseThickness=1.6}
 * @property {number} [dotHeight=1.2]
 * @property {number} [margin=4]         - quiet zone around the code (modules)
 * @property {boolean} [invert=false]    - swap raised/recessed modules
 * @property {string} [errorLevel='M']   - L, M, Q, H
 */

/**
 * @param {QrOptions} opts
 * @returns {Promise<Buffer>}
 */
export async function generateQr3d3MF(opts = {}) {
  const text = str(opts.text, 400, 'https://3dprintforge');
  const moduleSize = num(opts.moduleSize, 0.6, 6, 2);
  const baseThickness = num(opts.baseThickness, 0.8, 8, 1.6);
  const dotHeight = num(opts.dotHeight, 0.3, 6, 1.2);
  const margin = num(opts.margin, 0, 10, 4);
  const invert = bool(opts.invert, false);
  const errorLevel = ['L', 'M', 'Q', 'H'].includes(opts.errorLevel) ? opts.errorLevel : 'M';

  const qr = qrcode.create(text, { errorCorrectionLevel: errorLevel });
  const modules = qr.modules;
  const size = modules.size;
  const getBit = (r, c) => modules.data[r * size + c] ? 1 : 0;

  // Build heightmap grid at moduleSize / 2 resolution so each QR module
  // covers 2x2 heightmap cells — enough to keep corners crisp.
  const res = moduleSize / 2;
  const plateModules = size + margin * 2;
  const totalMm = plateModules * moduleSize;
  const cols = Math.round(totalMm / res);
  const rows = cols;

  const grid = new Array(rows);
  for (let r = 0; r < rows; r++) {
    const row = new Array(cols);
    for (let c = 0; c < cols; c++) {
      // Map grid cell back to QR module coordinates
      const px = (c + 0.5) * res;
      const py = (r + 0.5) * res;
      const mCol = Math.floor(px / moduleSize) - margin;
      const mRow = Math.floor(py / moduleSize) - margin;
      let raised = 0;
      if (mRow >= 0 && mRow < size && mCol >= 0 && mCol < size) {
        raised = getBit(mRow, mCol);
      }
      if (invert) raised = 1 - raised;
      row[c] = raised;
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
    col.set_Red(30); col.set_Green(30); col.set_Blue(30); col.set_Alpha(255);
    const matIdx = matGroup.AddMaterial('QR', col);
    col.delete();

    const mesh = model.AddMeshObject();
    mesh.SetName(`QR Code 3D (${size}x${size})`);
    mesh.SetObjectLevelProperty(mgId, matIdx);
    const mb = new MeshBuilder(lib, mesh);

    mb.addHeightmapSurface(0, 0, 0, grid, res, baseThickness, dotHeight);

    model.AddBuildItem(mesh, wrapper.GetIdentityTransform());

    const mdg = model.GetMetaDataGroup();
    const addMd = (k, v) => { const m = mdg.AddMetaData('', k, v, 'string', true); m.delete(); };
    addMd('Title', `QR Code 3D`);
    addMd('Description', text.substring(0, 100));
    addMd('Application', '3DPrintForge Model Forge');
    addMd('CreationDate', new Date().toISOString().split('T')[0]);

    const vfsPath = `/qr3d_${Date.now()}.3mf`;
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
