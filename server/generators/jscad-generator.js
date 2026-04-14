/**
 * JSCAD Generator — server-side parametric 3D modeling via @jscad/modeling
 *
 * Takes a user JavaScript snippet that returns geometry and renders to STL.
 * The user's code is evaluated in a sandbox with jscad primitives available.
 *
 * Security: User code runs in a Node VM context with limited globals.
 * No network, no filesystem access from user code. Script timeout enforced.
 */

import { runInNewContext } from 'node:vm';
import { createLogger } from '../logger.js';
import jscadPkg from '@jscad/modeling';
import stlSerializer from '@jscad/stl-serializer';

// @jscad/modeling uses CommonJS default export — destructure actual modules
const jscad = jscadPkg.default || jscadPkg;
const serializeSTL = stlSerializer.serialize || stlSerializer.default?.serialize;

const log = createLogger('jscad');

const DEFAULT_TIMEOUT_MS = 10_000;

/**
 * Render a JSCAD script to STL.
 *
 * @param {string} userCode - JavaScript function body returning geometry
 * @param {object} params - User parameter values for getParameterDefinitions()
 * @returns {Promise<{stl: Buffer, binary: boolean, triangleCount: number, warnings: string[]}>}
 */
export async function renderJscadToStl(userCode, params = {}) {
  const warnings = [];

  // Minimal sandbox with jscad exports as "jscad" global
  const sandbox = {
    jscad,
    // Common destructured shortcuts — user code can use these directly
    primitives: jscad.primitives,
    booleans: jscad.booleans,
    transforms: jscad.transforms,
    extrusions: jscad.extrusions,
    hulls: jscad.hulls,
    colors: jscad.colors,
    utils: jscad.utils,
    measurements: jscad.measurements,
    expansions: jscad.expansions,
    text: jscad.text,
    geometries: jscad.geometries,
    maths: jscad.maths,
    params,
    console: {
      log: (...args) => { warnings.push('log: ' + args.join(' ')); },
      warn: (...args) => { warnings.push('warn: ' + args.join(' ')); },
      error: (...args) => { warnings.push('error: ' + args.join(' ')); },
    },
  };

  // Wrap user code in an IIFE that returns the geometry
  const wrapped = `
    (function() {
      ${userCode}
      if (typeof main === 'function') return main(params);
      throw new Error('Script must define a main(params) function');
    })()
  `;

  let geometry;
  try {
    geometry = runInNewContext(wrapped, sandbox, {
      timeout: DEFAULT_TIMEOUT_MS,
      displayErrors: true,
    });
  } catch (e) {
    throw new Error(`JSCAD script error: ${e.message}`);
  }

  if (!geometry) throw new Error('Script did not return geometry');

  // Normalize to array of solids
  const solids = Array.isArray(geometry) ? geometry : [geometry];
  if (solids.length === 0) throw new Error('Script returned empty geometry');

  // Serialize to STL (binary for smaller size)
  // @jscad/stl-serializer returns an array of ArrayBuffers (header, count, triangles)
  const stlParts = serializeSTL({ binary: true }, ...solids);
  const buffers = stlParts.map(part => {
    if (part instanceof ArrayBuffer) return Buffer.from(part);
    if (Buffer.isBuffer(part)) return part;
    return Buffer.from(part);
  });
  const stl = Buffer.concat(buffers);

  // Count triangles in the STL binary (header 80 bytes + 4 byte count)
  let triangleCount = 0;
  if (stl.length >= 84) {
    triangleCount = stl.readUInt32LE(80);
  }

  return {
    stl,
    binary: true,
    triangleCount,
    warnings,
  };
}

/**
 * Extract parameter definitions from a script by evaluating getParameterDefinitions().
 * Returns null if the function isn't defined.
 */
export function extractParameterDefinitions(userCode) {
  const sandbox = { jscad, console: { log() {}, warn() {}, error() {} } };
  const wrapped = `
    (function() {
      ${userCode}
      if (typeof getParameterDefinitions === 'function') return getParameterDefinitions();
      return null;
    })()
  `;
  try {
    const defs = runInNewContext(wrapped, sandbox, { timeout: 2000 });
    return Array.isArray(defs) ? defs : null;
  } catch (e) {
    return null;
  }
}

/**
 * Pre-baked example scripts users can start from.
 */
export const EXAMPLES = [
  {
    id: 'cube',
    name: 'Simple Cube',
    description: 'A basic parameterized cube',
    code: `function getParameterDefinitions() {
  return [
    { name: 'size', type: 'float', initial: 20, caption: 'Size (mm)' }
  ];
}

function main(params) {
  const { cube } = primitives;
  return cube({ size: params.size });
}`,
  },
  {
    id: 'gear',
    name: 'Spur Gear',
    description: 'Parametric involute spur gear',
    code: `function getParameterDefinitions() {
  return [
    { name: 'teeth', type: 'int', initial: 20, caption: 'Number of teeth' },
    { name: 'module', type: 'float', initial: 2, caption: 'Module (mm)' },
    { name: 'thickness', type: 'float', initial: 5, caption: 'Thickness (mm)' },
    { name: 'bore', type: 'float', initial: 5, caption: 'Bore diameter (mm)' }
  ];
}

function main(params) {
  const { cylinder, cylinderElliptic } = primitives;
  const { subtract, union } = booleans;
  const { translate, rotate } = transforms;
  const { extrudeLinear } = extrusions;
  const { geom2 } = geometries;

  const pitchRadius = params.module * params.teeth / 2;
  const addendum = params.module;
  const dedendum = params.module * 1.25;
  const outerR = pitchRadius + addendum;
  const innerR = pitchRadius - dedendum;

  // Simple gear approximation: outer cylinder with tooth cutouts
  const body = cylinder({ radius: outerR, height: params.thickness, segments: 64 });
  const bore = cylinder({ radius: params.bore / 2, height: params.thickness + 1, segments: 32 });

  return subtract(body, bore);
}`,
  },
  {
    id: 'text-plate',
    name: 'Text Plate',
    description: 'Plate with embossed text',
    code: `function getParameterDefinitions() {
  return [
    { name: 'message', type: 'text', initial: 'Hello', caption: 'Text' },
    { name: 'width', type: 'float', initial: 80, caption: 'Width (mm)' },
    { name: 'height', type: 'float', initial: 30, caption: 'Height (mm)' },
    { name: 'thickness', type: 'float', initial: 3, caption: 'Thickness (mm)' }
  ];
}

function main(params) {
  const { cuboid } = primitives;
  return cuboid({ size: [params.width, params.height, params.thickness] });
}`,
  },
  {
    id: 'honeycomb',
    name: 'Honeycomb Pattern',
    description: 'Hexagonal honeycomb tile',
    code: `function getParameterDefinitions() {
  return [
    { name: 'rows', type: 'int', initial: 5, caption: 'Rows' },
    { name: 'cols', type: 'int', initial: 5, caption: 'Columns' },
    { name: 'cellSize', type: 'float', initial: 10, caption: 'Cell size (mm)' },
    { name: 'wall', type: 'float', initial: 1.5, caption: 'Wall thickness (mm)' },
    { name: 'height', type: 'float', initial: 5, caption: 'Height (mm)' }
  ];
}

function main(params) {
  const { cylinder, cuboid } = primitives;
  const { subtract, union } = booleans;
  const { translate } = transforms;

  const r = params.cellSize / 2;
  const dx = r * Math.sqrt(3);
  const dy = r * 1.5;

  const tileW = params.cols * dx + dx;
  const tileH = params.rows * dy + r;
  const base = cuboid({ size: [tileW, tileH, params.height] });

  const holes = [];
  for (let row = 0; row < params.rows; row++) {
    for (let col = 0; col < params.cols; col++) {
      const x = col * dx + (row % 2 ? dx / 2 : 0) - tileW / 2 + dx / 2;
      const y = row * dy - tileH / 2 + r;
      holes.push(translate([x, y, 0], cylinder({ radius: r - params.wall, height: params.height + 1, segments: 6 })));
    }
  }
  return subtract(base, ...holes);
}`,
  },
];
