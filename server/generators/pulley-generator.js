/**
 * Timing Belt Pulley Generator
 *
 * Generates parametric GT2 / GT3 / HTD timing belt pulleys from standard
 * profile parameters. Supports flanges (raised rims) to keep the belt on
 * the pulley and a central bore for the shaft.
 *
 * Supported profiles (with defaults from the Gates Mectrol engineering
 * catalogue and widely-used open source pulley libraries):
 *
 *   GT2 2mm  — pitch 2.0, tooth depth 0.76, tooth width 1.52
 *   GT2 3mm  — pitch 3.0, tooth depth 1.14, tooth width 2.28
 *   GT3 3mm  — pitch 3.0, tooth depth 1.14, tooth width 2.28
 *   HTD 3mm  — pitch 3.0, tooth depth 1.22, tooth width 1.83
 *   HTD 5mm  — pitch 5.0, tooth depth 2.06, tooth width 3.05
 *
 * The tooth profile is approximated by a rounded trapezoid — good enough
 * for 3D-printed pulleys where tiny detail gets lost anyway.
 */

import { MeshBuilder, getLib } from '../mesh-builder.js';
import { int, num, str } from './_shared/validate.js';

const PROFILES = {
  gt2_2: { name: 'GT2-2mm', pitch: 2.0, depth: 0.76, width: 1.52 },
  gt2_3: { name: 'GT2-3mm', pitch: 3.0, depth: 1.14, width: 2.28 },
  gt3_3: { name: 'GT3-3mm', pitch: 3.0, depth: 1.14, width: 2.28 },
  htd_3: { name: 'HTD-3M',  pitch: 3.0, depth: 1.22, width: 1.83 },
  htd_5: { name: 'HTD-5M',  pitch: 5.0, depth: 2.06, width: 3.05 },
};

/**
 * @typedef {object} PulleyOptions
 * @property {string} [profile='gt2_2'] - one of PROFILES keys
 * @property {number} [teeth=20]        - number of teeth (10..200)
 * @property {number} [width=6]         - pulley face width (2..30 mm)
 * @property {number} [bore=5]          - bore diameter (0..pitch diameter - 2*depth)
 * @property {boolean} [flanges=true]   - add flange rims on top/bottom
 * @property {number} [flangeHeight=1]  - flange rim height (mm)
 * @property {number} [flangeExtra=1]   - flange radius extra above pitch radius (mm)
 */

/**
 * Build the 2D polygon of the pulley outer face (with teeth) — CCW.
 * @param {number} teeth
 * @param {object} profile
 * @returns {Array<[number, number]>}
 */
function buildPulleyPolygon(teeth, profile) {
  const pitchR = (teeth * profile.pitch) / (Math.PI * 2);
  const rootR = pitchR - profile.depth / 2;
  const tipR = pitchR + profile.depth / 2;

  // Tooth angular width on the pitch circle (tooth "width" is chordal).
  const toothAngle = profile.width / pitchR;
  // Bottom of tooth valley occupies the remaining angle.
  const anglePerTooth = (Math.PI * 2) / teeth;
  const valleyAngle = anglePerTooth - toothAngle;

  const points = [];
  for (let k = 0; k < teeth; k++) {
    const base = k * anglePerTooth;
    // Valley start (root radius)
    points.push([Math.cos(base) * rootR, Math.sin(base) * rootR]);
    // Ramp up to tooth tip — left side
    const leftTipAngle = base + valleyAngle / 2;
    points.push([Math.cos(leftTipAngle) * tipR, Math.sin(leftTipAngle) * tipR]);
    // Tooth tip — right side
    const rightTipAngle = base + valleyAngle / 2 + toothAngle;
    points.push([Math.cos(rightTipAngle) * tipR, Math.sin(rightTipAngle) * tipR]);
    // Ramp down back to root
    const valleyEnd = base + anglePerTooth;
    points.push([Math.cos(valleyEnd) * rootR, Math.sin(valleyEnd) * rootR]);
  }
  return points;
}

/**
 * @param {PulleyOptions} opts
 * @returns {Promise<Buffer>}
 */
export async function generatePulley3MF(opts = {}) {
  const profileKey = str(opts.profile, 16, 'gt2_2');
  const profile = PROFILES[profileKey] || PROFILES.gt2_2;
  const teeth = int(opts.teeth, 10, 200, 20);
  const width = num(opts.width, 2, 30, 6);
  const flanges = opts.flanges !== false;
  const flangeHeight = num(opts.flangeHeight, 0.4, 3, 1);
  const flangeExtra = num(opts.flangeExtra, 0.2, 4, 1);
  const pitchR = (teeth * profile.pitch) / (Math.PI * 2);
  const bore = num(opts.bore, 0, 2 * pitchR - 2 * profile.depth - 1, 5);

  const polygon = buildPulleyPolygon(teeth, profile);

  const lib = await getLib();
  const wrapper = new lib.CWrapper();
  const model = wrapper.CreateModel();

  try {
    const matGroup = model.AddBaseMaterialGroup();
    const mgId = matGroup.GetResourceID();
    const col = new lib.sColor();
    col.set_Red(60); col.set_Green(60); col.set_Blue(70); col.set_Alpha(255);
    const matIdx = matGroup.AddMaterial('Pulley', col);
    col.delete();

    const pulleyMesh = model.AddMeshObject();
    pulleyMesh.SetName(`Pulley ${profile.name} ${teeth}t`);
    pulleyMesh.SetObjectLevelProperty(mgId, matIdx);
    const mb = new MeshBuilder(lib, pulleyMesh);

    // Main toothed body — with annular bore when requested
    if (bore > 0) {
      const n = polygon.length;
      const boreR = bore / 2;
      const borePoly = new Array(n);
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2;
        borePoly[i] = [Math.cos(a) * boreR, Math.sin(a) * boreR];
      }
      mb.addExtrudedAnnulus(polygon, borePoly, 0, width);
    } else {
      mb.addExtrudedPolygon(polygon, 0, width);
    }

    // Flanges as solid disks slightly wider than the pitch radius. When a
    // bore is present we use tubes so the flanges share the bore.
    if (flanges) {
      const flangeR = pitchR + profile.depth / 2 + flangeExtra;
      if (bore > 0) {
        mb.addTube(0, 0, -flangeHeight, flangeR, bore / 2, flangeHeight, 48);
        mb.addTube(0, 0, width,         flangeR, bore / 2, flangeHeight, 48);
      } else {
        mb.addCylinder(0, 0, -flangeHeight, flangeR, flangeHeight, 48);
        mb.addCylinder(0, 0, width,         flangeR, flangeHeight, 48);
      }
    }

    model.AddBuildItem(pulleyMesh, wrapper.GetIdentityTransform());

    const mdg = model.GetMetaDataGroup();
    const addMd = (k, v) => { const m = mdg.AddMetaData('', k, v, 'string', true); m.delete(); };
    addMd('Title', `${profile.name} Pulley ${teeth}t`);
    addMd('Application', '3DPrintForge Model Forge');
    addMd('CreationDate', new Date().toISOString().split('T')[0]);

    const vfsPath = `/pulley_${Date.now()}.3mf`;
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
