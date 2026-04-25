/**
 * AI Forge generator registry — wires intent keywords to the real
 * parametric Model Forge generators that live in `/generators/`.
 *
 * Each entry maps a normalised shape keyword to:
 *   - import: dynamic import of the generator module
 *   - fn:     name of the exported function on that module
 *   - format: native output format (currently always '3mf' since every
 *             registered generator produces a fully-built 3MF)
 *   - mapParams(intent): translate ai-forge intent.params (+ intent.text)
 *             into the generator-specific options object
 *   - description: short text shown in the prompt-examples gallery
 *   - examples: array of working prompts that resolve to this entry
 *
 * Resolution order in the dispatcher:
 *   1. Look up intent.shape in this registry. If present → real generator.
 *   2. Otherwise fall back to mesh-primitives (the original AI Forge path).
 *
 * 3MF buffers from these generators are already watertight, named, and
 * coloured, so we skip the auto-repair pipeline for them.
 */

export const GENERATOR_REGISTRY = {
  keychain: {
    import: () => import('./generators/keychain-generator.js'),
    fn: 'generateKeychain3MF',
    format: '3mf',
    description: 'Keychain with embossed text and ring hole',
    examples: ['keychain with text "SARA"', 'keychain "DAD" 60x25', 'oval keychain "HOME"'],
    mapParams(intent) {
      const p = intent.params || {};
      return {
        text: intent.text || p.text || 'KEY',
        width: p.w || p.width || (p.size ? p.size : 50),
        height: p.h || p.height || 20,
        thickness: p.thickness || 3,
        textHeight: p.textHeight || 0.8,
        ringHole: p.ringHole !== false,
        ringDiameter: p.ringDiameter || 5,
        shape: intent.modifiers?.rounded ? 'oval' : 'rectangle',
      };
    },
  },

  sign: {
    import: () => import('./generators/text-plate-generator.js'),
    fn: 'generateTextPlate3MF',
    format: '3mf',
    description: 'Sign / plaque with embossed text',
    examples: ['sign "WELCOME" 80x30', 'plaque with text "MAKERSPACE"', 'sign 100x40 "OPEN"'],
    mapParams(intent) {
      const p = intent.params || {};
      return {
        text: intent.text || p.text || 'TEXT',
        width: p.width || p.w || 80,
        height: p.height || p.h || 30,
        thickness: p.thickness || p.d || 4,
        textHeight: p.textHeight || 1.5,
      };
    },
  },

  vase: {
    import: () => import('./generators/vase-generator.js'),
    fn: 'generateVase3MF',
    format: '3mf',
    description: 'Twist or smooth vase',
    examples: ['vase 30x80', 'twisted vase r=25 h=100', 'hollow vase 40x120'],
    mapParams(intent) {
      const p = intent.params || {};
      return {
        radius: p.r || (p.w ? p.w / 2 : 30),
        height: p.h || 80,
        twist: intent.modifiers?.twisted ? 360 : 0,
        wallThickness: p.wallThickness || 1.2,
      };
    },
  },

  gear: {
    import: () => import('./generators/gear-generator.js'),
    fn: 'generateGear3MF',
    format: '3mf',
    description: 'Involute spur gear',
    examples: ['gear teeth=20 modulus=1', 'gear with 40 teeth h=8', 'gear teeth=15 h=5'],
    mapParams(intent) {
      const p = intent.params || {};
      return {
        teeth: p.teeth || 20,
        modulus: p.modulus || 1,
        thickness: p.h || p.thickness || 8,
        boreDiameter: p.bore || p.boreDiameter || 5,
      };
    },
  },

  cable_label: {
    import: () => import('./generators/cable-label-generator.js'),
    fn: 'generateCableLabel3MF',
    format: '3mf',
    description: 'Cable wrap label with text',
    examples: ['cable label "USB-C"', 'cable label with text "POWER"'],
    mapParams(intent) {
      const p = intent.params || {};
      return {
        text: intent.text || p.text || 'LABEL',
        width: p.w || p.width || 25,
        cableDiameter: p.cableDiameter || 6,
      };
    },
  },

  storage_box: {
    import: () => import('./generators/storage-box-generator.js'),
    fn: 'generateStorageBox3MF',
    format: '3mf',
    description: 'Storage box with optional dividers',
    examples: ['storage box 60x40x30', 'storage box 100x60x40 with dividers=2'],
    mapParams(intent) {
      const p = intent.params || {};
      return {
        length: p.w || p.length || 60,
        width: p.h || p.width || 40,
        height: p.d || p.height || 30,
        wallThickness: p.wallThickness || 2,
        dividers: p.dividers || 0,
      };
    },
  },

  plant_pot: {
    import: () => import('./generators/plant-pot-generator.js'),
    fn: 'generatePlantPot3MF',
    format: '3mf',
    description: 'Plant pot with drainage hole',
    examples: ['plant pot 80x60', 'plant pot r=50 h=80'],
    mapParams(intent) {
      const p = intent.params || {};
      return {
        topRadius: p.r || (p.w ? p.w / 2 : 40),
        bottomRadius: p.bottomRadius || (p.r ? p.r * 0.7 : 28),
        height: p.h || 60,
        wallThickness: p.wallThickness || 2,
      };
    },
  },

  phone_stand: {
    import: () => import('./generators/phone-stand-generator.js'),
    fn: 'generatePhoneStand3MF',
    format: '3mf',
    description: 'Adjustable-angle phone stand',
    examples: ['phone stand', 'phone stand 90x60'],
    mapParams(intent) {
      const p = intent.params || {};
      return {
        width: p.w || 90,
        height: p.h || 60,
        angle: p.angle || 60,
      };
    },
  },

  hook: {
    import: () => import('./generators/hook-generator.js'),
    fn: 'generateHook3MF',
    format: '3mf',
    description: 'Wall-mount hook',
    examples: ['hook', 'hook 40x30 with screw holes'],
    mapParams(intent) {
      const p = intent.params || {};
      return {
        width: p.w || 40,
        height: p.h || 30,
        thickness: p.thickness || p.d || 5,
      };
    },
  },

  cable_clip: {
    import: () => import('./generators/cable-clip-generator.js'),
    fn: 'generateCableClip3MF',
    format: '3mf',
    description: 'Cable management clip',
    examples: ['cable clip', 'cable clip diameter=8'],
    mapParams(intent) {
      const p = intent.params || {};
      return {
        cableDiameter: p.cableDiameter || p.diameter || 6,
        clipDepth: p.clipDepth || p.d || 10,
      };
    },
  },

  spring: {
    import: () => import('./generators/spring-generator.js'),
    fn: 'generateSpring3MF',
    format: '3mf',
    description: 'Print-in-place coil spring',
    examples: ['spring', 'spring r=10 h=40'],
    mapParams(intent) {
      const p = intent.params || {};
      return {
        outerRadius: p.r || p.outerRadius || 10,
        wireRadius: p.wireRadius || 1.5,
        height: p.h || 40,
        coils: p.coils || 8,
      };
    },
  },

  hinge: {
    import: () => import('./generators/hinge-generator.js'),
    fn: 'generateHinge3MF',
    format: '3mf',
    description: 'Print-in-place hinge',
    examples: ['hinge', 'hinge 40x20'],
    mapParams(intent) {
      const p = intent.params || {};
      return {
        width: p.w || 40,
        height: p.h || 20,
        thickness: p.thickness || p.d || 4,
      };
    },
  },

  battery_holder: {
    import: () => import('./generators/battery-holder-generator.js'),
    fn: 'generateBatteryHolder3MF',
    format: '3mf',
    description: 'AA/AAA/18650 battery holder',
    examples: ['battery holder', 'battery holder count=4 type=AA'],
    mapParams(intent) {
      const p = intent.params || {};
      return {
        cellType: p.type || 'AA',
        count: p.count || intent.count || 2,
      };
    },
  },

  headphone_stand: {
    import: () => import('./generators/headphone-stand-generator.js'),
    fn: 'generateHeadphoneStand3MF',
    format: '3mf',
    description: 'Headphone display stand',
    examples: ['headphone stand', 'headphone stand h=200'],
    mapParams(intent) {
      const p = intent.params || {};
      return {
        height: p.h || 200,
        baseWidth: p.w || 100,
      };
    },
  },

  gridfinity_bin: {
    import: () => import('./generators/gridfinity-bin-generator.js'),
    fn: 'generateGridfinityBin3MF',
    format: '3mf',
    description: 'Gridfinity-compatible storage bin',
    examples: ['gridfinity bin 1x1', 'gridfinity bin 2x3', 'gridfinity bin 1x2 height=6'],
    mapParams(intent) {
      const p = intent.params || {};
      return {
        unitsX: p.unitsX || (p.w && p.w <= 6 ? p.w : 1),
        unitsY: p.unitsY || (p.h && p.h <= 6 ? p.h : 1),
        heightUnits: p.height || p.heightUnits || 3,
      };
    },
  },

  gridfinity_baseplate: {
    import: () => import('./generators/gridfinity-baseplate-generator.js'),
    fn: 'generateGridfinityBaseplate3MF',
    format: '3mf',
    description: 'Gridfinity baseplate (gridfinity-compatible)',
    examples: ['gridfinity baseplate 4x4', 'gridfinity baseplate 6x3'],
    mapParams(intent) {
      const p = intent.params || {};
      return {
        unitsX: p.unitsX || (p.w && p.w <= 8 ? p.w : 4),
        unitsY: p.unitsY || (p.h && p.h <= 8 ? p.h : 4),
      };
    },
  },

  thread: {
    import: () => import('./generators/thread-generator.js'),
    fn: 'generateThread3MF',
    format: '3mf',
    description: 'Threaded connector (M-series)',
    examples: ['thread M10x1.5 h=20', 'thread r=8 pitch=1.5'],
    mapParams(intent) {
      const p = intent.params || {};
      return {
        majorDiameter: p.r ? p.r * 2 : (p.diameter || 10),
        pitch: p.pitch || 1.5,
        length: p.h || 20,
      };
    },
  },
};

/**
 * Returns true if the given shape keyword is registered to a real
 * parametric generator.
 */
export function hasGenerator(shape) {
  return Object.prototype.hasOwnProperty.call(GENERATOR_REGISTRY, shape);
}

/**
 * Run the registered generator for a parsed intent and return the
 * resulting buffer + native format.
 *
 * @param {object} intent - parsed AI-Forge intent
 * @returns {Promise<{ buffer: Buffer, format: string, opts: object, generatorKey: string }>}
 */
export async function runGenerator(intent) {
  const key = intent.shape;
  const entry = GENERATOR_REGISTRY[key];
  if (!entry) throw new Error(`No generator registered for shape '${key}'`);
  const mod = await entry.import();
  const fn = mod[entry.fn];
  if (typeof fn !== 'function') {
    throw new Error(`Generator module missing function ${entry.fn}`);
  }
  const opts = entry.mapParams(intent);
  const buffer = await fn(opts);
  return { buffer, format: entry.format, opts, generatorKey: key };
}

/**
 * Call a generator directly with already-mapped opts (bypasses the
 * intent mapper). Used by the Scene Composer where the user has
 * already filled in the generator's specific options via the UI.
 */
export async function runGeneratorWithOpts(key, opts = {}) {
  const entry = GENERATOR_REGISTRY[key];
  if (!entry) throw new Error(`No generator registered for key '${key}'`);
  const mod = await entry.import();
  const fn = mod[entry.fn];
  if (typeof fn !== 'function') {
    throw new Error(`Generator module missing function ${entry.fn}`);
  }
  const buffer = await fn(opts);
  return { buffer, format: entry.format, opts, generatorKey: key };
}

/**
 * Default opts for a generator (the same shape mapParams produces from
 * an empty intent). Used by the UI to pre-fill the form when a user
 * inserts a generator-shape into a scene.
 */
export function defaultGeneratorOpts(key) {
  const entry = GENERATOR_REGISTRY[key];
  if (!entry) return {};
  return entry.mapParams({ params: {}, text: null, modifiers: {}, count: 1, raw: '' });
}

/**
 * List the registry as a UI-friendly array.
 */
export function listGenerators() {
  return Object.entries(GENERATOR_REGISTRY).map(([key, e]) => ({
    key,
    description: e.description,
    examples: e.examples,
    nativeFormat: e.format,
  }));
}
