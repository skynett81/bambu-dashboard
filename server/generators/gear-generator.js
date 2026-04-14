/**
 * Spur Gear Generator
 *
 * Generates a parametric involute spur gear from standard metric module
 * parameters. The tooth profile is computed from involute geometry rather
 * than approximated with splines.
 *
 * Parameters follow the ISO 54/SS-ISO 53 standard:
 *   module (m)          — size of each tooth, in mm
 *   teeth (z)           — number of teeth
 *   pressure angle (α)  — typically 20° for metric gears
 *   face width          — gear thickness in mm
 *   bore diameter       — center shaft hole (0 = solid)
 *
 * The gear profile is built by sampling the involute curve for each tooth
 * flank, mirroring it to form both sides of the tooth, and connecting teeth
 * via arcs on the root circle.
 *
 * The bore is rendered as a separate inverted cylinder mesh in the same
 * 3MF so slicers can treat the gear as a single part with a hole.
 */

import { MeshBuilder, getLib } from '../mesh-builder.js';
import { int, num } from './_shared/validate.js';

/**
 * @typedef {object} GearOptions
 * @property {number} [teeth=20]           - number of teeth (8..200)
 * @property {number} [module=1.5]         - module in mm (0.3..5)
 * @property {number} [faceWidth=5]        - gear thickness (1..50 mm)
 * @property {number} [pressureAngle=20]   - pressure angle in degrees (14..30)
 * @property {number} [bore=3]             - bore diameter (0 = solid, up to rootR)
 * @property {number} [backlash=0.1]       - tooth flank backlash (mm)
 */

const INVOLUTE_SAMPLES = 8; // samples along the involute flank per tooth

/**
 * Compute involute polygon points (CCW) for a single spur gear.
 * @param {number} teeth
 * @param {number} module
 * @param {number} alphaRad - pressure angle (radians)
 * @param {number} backlash
 * @returns {Array<[number, number]>}
 */
function buildGearPolygon(teeth, module, alphaRad, backlash) {
  const pitchR = (teeth * module) / 2;
  const baseR = pitchR * Math.cos(alphaRad);
  const addendumR = pitchR + module;
  const dedendumR = pitchR - 1.25 * module;
  const rootR = Math.max(0.2, dedendumR);

  // Involute parameter at pitch radius and at tip (addendum) radius
  const invT = (r) => Math.sqrt(Math.max(0, (r * r) / (baseR * baseR) - 1));
  const invAngle = (t) => t - Math.atan(t); // involute angle function

  const tPitch = invT(pitchR);
  const tTip = invT(addendumR);

  // Tooth angular width on the pitch circle: half of the circular pitch, minus backlash.
  const circularPitch = (Math.PI * 2) / teeth;
  const halfToothAngle = circularPitch / 4 - backlash / (2 * pitchR);
  // Angular offset that aligns the involute so that the tooth is symmetric
  // about angle 0 at the pitch circle.
  const pitchInvAngle = invAngle(tPitch);
  const rightFlankOffset = -halfToothAngle + pitchInvAngle;

  const points = [];
  for (let k = 0; k < teeth; k++) {
    const base = (k / teeth) * Math.PI * 2;

    // Right flank: from base circle up to tip (t = 0 .. tTip)
    for (let i = 0; i <= INVOLUTE_SAMPLES; i++) {
      const t = (i / INVOLUTE_SAMPLES) * tTip;
      const r = baseR * Math.sqrt(1 + t * t);
      const theta = base - rightFlankOffset + invAngle(t);
      points.push([Math.cos(theta) * r, Math.sin(theta) * r]);
    }
    // Left flank: from tip back down to base circle (mirrored)
    for (let i = 0; i <= INVOLUTE_SAMPLES; i++) {
      const t = (1 - i / INVOLUTE_SAMPLES) * tTip;
      const r = baseR * Math.sqrt(1 + t * t);
      const theta = base + rightFlankOffset - invAngle(t);
      points.push([Math.cos(theta) * r, Math.sin(theta) * r]);
    }
    // Root arc to next tooth
    const nextBase = ((k + 1) / teeth) * Math.PI * 2;
    const rootSamples = 4;
    for (let i = 1; i <= rootSamples; i++) {
      const t = i / rootSamples;
      const theta = base + rightFlankOffset + t * (nextBase - rightFlankOffset - (base + rightFlankOffset));
      points.push([Math.cos(theta) * rootR, Math.sin(theta) * rootR]);
    }
  }
  return points;
}

/**
 * @param {GearOptions} opts
 * @returns {Promise<Buffer>}
 */
export async function generateGear3MF(opts = {}) {
  const teeth = int(opts.teeth, 8, 200, 20);
  const module = num(opts.module, 0.3, 5, 1.5);
  const faceWidth = num(opts.faceWidth, 1, 50, 5);
  const pressureAngle = num(opts.pressureAngle, 14, 30, 20);
  const bore = num(opts.bore, 0, teeth * module - module * 2, 3);
  const backlash = num(opts.backlash, 0, 0.5, 0.1);

  const polygon = buildGearPolygon(teeth, module, (pressureAngle * Math.PI) / 180, backlash);

  const lib = await getLib();
  const wrapper = new lib.CWrapper();
  const model = wrapper.CreateModel();

  try {
    const matGroup = model.AddBaseMaterialGroup();
    const mgId = matGroup.GetResourceID();
    const col = new lib.sColor();
    col.set_Red(200); col.set_Green(180); col.set_Blue(100); col.set_Alpha(255);
    const matIdx = matGroup.AddMaterial('Gear', col);
    col.delete();

    const gearMesh = model.AddMeshObject();
    gearMesh.SetName(`Spur Gear ${teeth}t m${module}`);
    gearMesh.SetObjectLevelProperty(mgId, matIdx);
    const mb = new MeshBuilder(lib, gearMesh);
    if (bore > 0) {
      // Build a matching circular hole polygon with the same vertex count as
      // the outer gear profile so the annular caps triangulate cleanly.
      const n = polygon.length;
      const boreR = bore / 2;
      const bore_poly = new Array(n);
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2;
        bore_poly[i] = [Math.cos(a) * boreR, Math.sin(a) * boreR];
      }
      mb.addExtrudedAnnulus(polygon, bore_poly, 0, faceWidth);
    } else {
      mb.addExtrudedPolygon(polygon, 0, faceWidth);
    }
    model.AddBuildItem(gearMesh, wrapper.GetIdentityTransform());

    const mdg = model.GetMetaDataGroup();
    const addMd = (k, v) => { const m = mdg.AddMetaData('', k, v, 'string', true); m.delete(); };
    addMd('Title', `Spur Gear ${teeth}t m${module}`);
    addMd('Application', '3DPrintForge Model Forge');
    addMd('CreationDate', new Date().toISOString().split('T')[0]);

    const vfsPath = `/gear_${Date.now()}.3mf`;
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
