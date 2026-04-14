/**
 * Shape Extruder Generator
 *
 * Extrudes a predefined 2D shape (star, heart, polygon, flower, gear-like)
 * into a solid 3D prism. Useful for ornaments, cookie cutters, tags,
 * decorative parts.
 *
 * Each shape's polygon is computed analytically so results are smooth at
 * any size.
 */

import { MeshBuilder, getLib } from '../mesh-builder.js';
import { int, num, str } from './_shared/validate.js';

/** @typedef {object} ShapeOptions
 * @property {string} [shape='star']     - 'star'|'heart'|'polygon'|'flower'|'circle'
 * @property {number} [size=40]          - nominal radius (mm)
 * @property {number} [height=5]         - extrusion height (mm)
 * @property {number} [points=5]         - points for star/polygon, petals for flower
 */

/**
 * @param {ShapeOptions} opts
 * @returns {Promise<Buffer>}
 */
export async function generateShape3MF(opts = {}) {
  const shape = str(opts.shape, 16, 'star');
  const size = num(opts.size, 10, 200, 40);
  const height = num(opts.height, 1, 50, 5);
  const points = int(opts.points, 3, 16, 5);

  const polygon = buildPolygon(shape, size, points);

  const lib = await getLib();
  const wrapper = new lib.CWrapper();
  const model = wrapper.CreateModel();

  try {
    const matGroup = model.AddBaseMaterialGroup();
    const mgId = matGroup.GetResourceID();
    const col = new lib.sColor();
    col.set_Red(220); col.set_Green(140); col.set_Blue(140); col.set_Alpha(255);
    const matIdx = matGroup.AddMaterial('Shape', col);
    col.delete();

    const mesh = model.AddMeshObject();
    mesh.SetName(`${shape} ${size}mm`);
    mesh.SetObjectLevelProperty(mgId, matIdx);
    const mb = new MeshBuilder(lib, mesh);

    mb.addExtrudedPolygon(polygon, 0, height);

    model.AddBuildItem(mesh, wrapper.GetIdentityTransform());

    const mdg = model.GetMetaDataGroup();
    const addMd = (k, v) => { const m = mdg.AddMetaData('', k, v, 'string', true); m.delete(); };
    addMd('Title', `${shape} ${size}mm`);
    addMd('Application', '3DPrintForge Model Forge');
    addMd('CreationDate', new Date().toISOString().split('T')[0]);

    const vfsPath = `/shape_${Date.now()}.3mf`;
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
 * Return a CCW closed polygon (as array of [x,y] points, centered at origin).
 */
function buildPolygon(shape, size, points) {
  const pts = [];
  switch (shape) {
    case 'star': {
      const inner = size * 0.45;
      for (let i = 0; i < points * 2; i++) {
        const r = i % 2 === 0 ? size : inner;
        const a = (i / (points * 2)) * Math.PI * 2 - Math.PI / 2;
        pts.push([Math.cos(a) * r, Math.sin(a) * r]);
      }
      break;
    }
    case 'heart': {
      const samples = 64;
      for (let i = 0; i < samples; i++) {
        const t = (i / samples) * Math.PI * 2;
        const x = 16 * Math.pow(Math.sin(t), 3);
        const y = 13 * Math.cos(t) - 5 * Math.cos(2*t) - 2 * Math.cos(3*t) - Math.cos(4*t);
        pts.push([x * size / 20, y * size / 20]);
      }
      pts.reverse(); // formula is CW by default
      break;
    }
    case 'flower': {
      const samples = points * 24;
      for (let i = 0; i < samples; i++) {
        const a = (i / samples) * Math.PI * 2;
        const r = size * (0.6 + 0.4 * Math.abs(Math.cos(points * a / 2)));
        pts.push([Math.cos(a) * r, Math.sin(a) * r]);
      }
      break;
    }
    case 'circle': {
      const samples = 48;
      for (let i = 0; i < samples; i++) {
        const a = (i / samples) * Math.PI * 2;
        pts.push([Math.cos(a) * size, Math.sin(a) * size]);
      }
      break;
    }
    case 'polygon':
    default: {
      for (let i = 0; i < points; i++) {
        const a = (i / points) * Math.PI * 2 - Math.PI / 2;
        pts.push([Math.cos(a) * size, Math.sin(a) * size]);
      }
    }
  }
  return pts;
}
