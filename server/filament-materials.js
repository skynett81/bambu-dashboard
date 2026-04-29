// Comprehensive filament material reference database
// Static data for all common 3D printing materials with print settings,
// plate compatibility, drying info, and material properties.

const MATERIALS = Object.freeze([
  {
    id: 'pla',
    name: 'PLA',
    fullName: 'Polylactic Acid',
    category: 'standard',
    difficulty: 'beginner',
    nozzle_temp: { min: 190, max: 230, recommended: 210 },
    bed_temp: { min: 35, max: 65, recommended: 55 },
    chamber_temp: null,
    plates: {
      cool_plate: { rating: 'excellent', glue_stick: false },
      engineering_plate: { rating: 'good', glue_stick: false },
      high_temp_plate: { rating: 'poor', glue_stick: true },
      textured_pei: { rating: 'excellent', glue_stick: false }
    },
    speed: { min: 40, max: 300, recommended: 200 },
    retraction: { distance: 0.8, speed: 40 },
    fan_speed: { min: 80, max: 100 },
    drying: { temp: 50, hours: 4, hygroscopic: 'low' },
    properties: {
      strength: 3,
      flexibility: 2,
      heat_resistance: 2,
      uv_resistance: 1,
      surface_quality: 4,
      ease_of_print: 5,
      layer_adhesion: 3,
      chemical_resistance: 2
    },
    requires_enclosure: false,
    requires_hardened_nozzle: false,
    compatible_printers: 'all',
    tips: 'Easy to print. Great for beginners. Avoid high temperatures post-printing.',
    warnings: 'Not suitable for outdoor use due to UV degradation. Low heat resistance (~55C HDT).'
  },
  {
    id: 'pla-cf',
    name: 'PLA-CF',
    fullName: 'PLA Carbon Fiber',
    category: 'composite',
    difficulty: 'intermediate',
    nozzle_temp: { min: 210, max: 240, recommended: 220 },
    bed_temp: { min: 45, max: 65, recommended: 55 },
    chamber_temp: null,
    plates: {
      cool_plate: { rating: 'good', glue_stick: false },
      engineering_plate: { rating: 'excellent', glue_stick: false },
      high_temp_plate: { rating: 'poor', glue_stick: true },
      textured_pei: { rating: 'excellent', glue_stick: false }
    },
    speed: { min: 40, max: 200, recommended: 150 },
    retraction: { distance: 0.8, speed: 40 },
    fan_speed: { min: 60, max: 100 },
    drying: { temp: 55, hours: 6, hygroscopic: 'low' },
    properties: {
      strength: 4,
      flexibility: 1,
      heat_resistance: 2,
      uv_resistance: 2,
      surface_quality: 3,
      ease_of_print: 4,
      layer_adhesion: 3,
      chemical_resistance: 2
    },
    requires_enclosure: false,
    requires_hardened_nozzle: true,
    compatible_printers: 'all',
    tips: 'Higher stiffness than standard PLA. Matte surface finish. Reduces stringing.',
    warnings: 'Requires hardened steel nozzle — carbon fiber will rapidly wear brass nozzles.'
  },
  {
    id: 'petg',
    name: 'PETG',
    fullName: 'Polyethylene Terephthalate Glycol',
    category: 'standard',
    difficulty: 'beginner',
    nozzle_temp: { min: 220, max: 260, recommended: 240 },
    bed_temp: { min: 60, max: 80, recommended: 70 },
    chamber_temp: null,
    plates: {
      cool_plate: { rating: 'poor', glue_stick: true },
      engineering_plate: { rating: 'excellent', glue_stick: false },
      high_temp_plate: { rating: 'good', glue_stick: false },
      textured_pei: { rating: 'excellent', glue_stick: false }
    },
    speed: { min: 40, max: 250, recommended: 180 },
    retraction: { distance: 1.0, speed: 35 },
    fan_speed: { min: 30, max: 70 },
    drying: { temp: 65, hours: 6, hygroscopic: 'medium' },
    properties: {
      strength: 4,
      flexibility: 3,
      heat_resistance: 3,
      uv_resistance: 3,
      surface_quality: 3,
      ease_of_print: 4,
      layer_adhesion: 4,
      chemical_resistance: 3
    },
    requires_enclosure: false,
    requires_hardened_nozzle: false,
    compatible_printers: 'all',
    tips: 'Good all-rounder. Better temperature and chemical resistance than PLA. Excellent layer adhesion.',
    warnings: 'Can stick too well to smooth PEI — use glue stick as release agent on Cool Plate. Prone to stringing.'
  },
  {
    id: 'petg-cf',
    name: 'PETG-CF',
    fullName: 'PETG Carbon Fiber',
    category: 'composite',
    difficulty: 'intermediate',
    nozzle_temp: { min: 230, max: 270, recommended: 250 },
    bed_temp: { min: 65, max: 80, recommended: 70 },
    chamber_temp: null,
    plates: {
      cool_plate: { rating: 'poor', glue_stick: true },
      engineering_plate: { rating: 'excellent', glue_stick: false },
      high_temp_plate: { rating: 'good', glue_stick: false },
      textured_pei: { rating: 'excellent', glue_stick: false }
    },
    speed: { min: 40, max: 200, recommended: 150 },
    retraction: { distance: 1.0, speed: 35 },
    fan_speed: { min: 20, max: 60 },
    drying: { temp: 65, hours: 8, hygroscopic: 'medium' },
    properties: {
      strength: 5,
      flexibility: 2,
      heat_resistance: 3,
      uv_resistance: 3,
      surface_quality: 3,
      ease_of_print: 3,
      layer_adhesion: 4,
      chemical_resistance: 3
    },
    requires_enclosure: false,
    requires_hardened_nozzle: true,
    compatible_printers: 'all',
    tips: 'Very rigid and strong. Great for structural parts. Lower warping than standard PETG.',
    warnings: 'Requires hardened steel nozzle. More brittle than standard PETG.'
  },
  {
    id: 'abs',
    name: 'ABS',
    fullName: 'Acrylonitrile Butadiene Styrene',
    category: 'engineering',
    difficulty: 'intermediate',
    nozzle_temp: { min: 240, max: 270, recommended: 255 },
    bed_temp: { min: 90, max: 110, recommended: 100 },
    chamber_temp: { min: 40, max: 60 },
    plates: {
      cool_plate: { rating: 'not_recommended', glue_stick: false },
      engineering_plate: { rating: 'excellent', glue_stick: false },
      high_temp_plate: { rating: 'excellent', glue_stick: false },
      textured_pei: { rating: 'good', glue_stick: false }
    },
    speed: { min: 40, max: 250, recommended: 200 },
    retraction: { distance: 0.6, speed: 40 },
    fan_speed: { min: 0, max: 30 },
    drying: { temp: 65, hours: 6, hygroscopic: 'medium' },
    properties: {
      strength: 4,
      flexibility: 3,
      heat_resistance: 4,
      uv_resistance: 2,
      surface_quality: 3,
      ease_of_print: 2,
      layer_adhesion: 3,
      chemical_resistance: 3
    },
    requires_enclosure: true,
    requires_hardened_nozzle: false,
    compatible_printers: 'enclosed_only',
    tips: 'Classic engineering material. Good mechanical properties. Can be vapor smoothed with acetone.',
    warnings: 'Emits strong fumes — requires enclosed printer with good ventilation. High warping tendency without enclosure.'
  },
  {
    id: 'asa',
    name: 'ASA',
    fullName: 'Acrylonitrile Styrene Acrylate',
    category: 'engineering',
    difficulty: 'intermediate',
    nozzle_temp: { min: 240, max: 270, recommended: 260 },
    bed_temp: { min: 90, max: 110, recommended: 100 },
    chamber_temp: { min: 40, max: 60 },
    plates: {
      cool_plate: { rating: 'not_recommended', glue_stick: false },
      engineering_plate: { rating: 'excellent', glue_stick: false },
      high_temp_plate: { rating: 'excellent', glue_stick: false },
      textured_pei: { rating: 'good', glue_stick: false }
    },
    speed: { min: 40, max: 250, recommended: 200 },
    retraction: { distance: 0.6, speed: 40 },
    fan_speed: { min: 0, max: 30 },
    drying: { temp: 65, hours: 6, hygroscopic: 'medium' },
    properties: {
      strength: 4,
      flexibility: 3,
      heat_resistance: 4,
      uv_resistance: 5,
      surface_quality: 3,
      ease_of_print: 2,
      layer_adhesion: 3,
      chemical_resistance: 3
    },
    requires_enclosure: true,
    requires_hardened_nozzle: false,
    compatible_printers: 'enclosed_only',
    tips: 'UV-resistant alternative to ABS. Excellent for outdoor parts. Similar print settings to ABS.',
    warnings: 'Emits fumes — requires enclosed printer. Warps without enclosure. Similar odor to ABS.'
  },
  {
    id: 'tpu',
    name: 'TPU',
    fullName: 'Thermoplastic Polyurethane',
    category: 'flexible',
    difficulty: 'advanced',
    nozzle_temp: { min: 210, max: 240, recommended: 225 },
    bed_temp: { min: 40, max: 60, recommended: 50 },
    chamber_temp: null,
    plates: {
      cool_plate: { rating: 'excellent', glue_stick: false },
      engineering_plate: { rating: 'good', glue_stick: false },
      high_temp_plate: { rating: 'poor', glue_stick: false },
      textured_pei: { rating: 'good', glue_stick: false }
    },
    speed: { min: 20, max: 80, recommended: 50 },
    retraction: { distance: 0.5, speed: 20 },
    fan_speed: { min: 50, max: 100 },
    drying: { temp: 50, hours: 6, hygroscopic: 'high' },
    properties: {
      strength: 3,
      flexibility: 5,
      heat_resistance: 2,
      uv_resistance: 3,
      surface_quality: 3,
      ease_of_print: 2,
      layer_adhesion: 5,
      chemical_resistance: 4
    },
    requires_enclosure: false,
    requires_hardened_nozzle: false,
    compatible_printers: 'all',
    tips: 'Print slowly for best results. Reduce retraction to avoid jams. Direct drive extruder preferred.',
    warnings: 'Very slow print speeds required. Bowden tube systems may struggle. Highly hygroscopic — dry before use.'
  },
  {
    id: 'pa',
    name: 'PA (Nylon)',
    fullName: 'Polyamide (Nylon)',
    category: 'engineering',
    difficulty: 'advanced',
    nozzle_temp: { min: 260, max: 290, recommended: 275 },
    bed_temp: { min: 80, max: 100, recommended: 90 },
    chamber_temp: { min: 40, max: 60 },
    plates: {
      cool_plate: { rating: 'not_recommended', glue_stick: false },
      engineering_plate: { rating: 'good', glue_stick: true },
      high_temp_plate: { rating: 'excellent', glue_stick: false },
      textured_pei: { rating: 'good', glue_stick: true }
    },
    speed: { min: 40, max: 200, recommended: 150 },
    retraction: { distance: 0.8, speed: 40 },
    fan_speed: { min: 0, max: 30 },
    drying: { temp: 80, hours: 12, hygroscopic: 'extreme' },
    properties: {
      strength: 5,
      flexibility: 4,
      heat_resistance: 4,
      uv_resistance: 2,
      surface_quality: 3,
      ease_of_print: 2,
      layer_adhesion: 4,
      chemical_resistance: 4
    },
    requires_enclosure: true,
    requires_hardened_nozzle: false,
    compatible_printers: 'enclosed_only',
    tips: 'Excellent mechanical properties. Very tough and wear-resistant. Must be bone dry before printing.',
    warnings: 'Extremely hygroscopic — absorbs moisture rapidly. Store in dry box. High warping tendency.'
  },
  {
    id: 'pa-cf',
    name: 'PA-CF',
    fullName: 'Polyamide Carbon Fiber',
    category: 'composite',
    difficulty: 'expert',
    nozzle_temp: { min: 270, max: 300, recommended: 285 },
    bed_temp: { min: 80, max: 100, recommended: 90 },
    chamber_temp: { min: 45, max: 65 },
    plates: {
      cool_plate: { rating: 'not_recommended', glue_stick: false },
      engineering_plate: { rating: 'good', glue_stick: true },
      high_temp_plate: { rating: 'excellent', glue_stick: false },
      textured_pei: { rating: 'good', glue_stick: true }
    },
    speed: { min: 40, max: 150, recommended: 100 },
    retraction: { distance: 0.8, speed: 40 },
    fan_speed: { min: 0, max: 30 },
    drying: { temp: 80, hours: 12, hygroscopic: 'extreme' },
    properties: {
      strength: 5,
      flexibility: 2,
      heat_resistance: 5,
      uv_resistance: 3,
      surface_quality: 3,
      ease_of_print: 1,
      layer_adhesion: 3,
      chemical_resistance: 4
    },
    requires_enclosure: true,
    requires_hardened_nozzle: true,
    compatible_printers: 'enclosed_only',
    tips: 'Very strong and stiff. Excellent for functional parts. Matte surface finish.',
    warnings: 'Requires hardened nozzle and enclosed printer. Extremely hygroscopic. Expert material.'
  },
  {
    id: 'pa-gf',
    name: 'PA-GF',
    fullName: 'Polyamide Glass Fiber',
    category: 'composite',
    difficulty: 'expert',
    nozzle_temp: { min: 270, max: 300, recommended: 285 },
    bed_temp: { min: 80, max: 100, recommended: 90 },
    chamber_temp: { min: 45, max: 65 },
    plates: {
      cool_plate: { rating: 'not_recommended', glue_stick: false },
      engineering_plate: { rating: 'good', glue_stick: true },
      high_temp_plate: { rating: 'excellent', glue_stick: false },
      textured_pei: { rating: 'good', glue_stick: true }
    },
    speed: { min: 40, max: 150, recommended: 100 },
    retraction: { distance: 0.8, speed: 40 },
    fan_speed: { min: 0, max: 30 },
    drying: { temp: 80, hours: 12, hygroscopic: 'extreme' },
    properties: {
      strength: 5,
      flexibility: 2,
      heat_resistance: 5,
      uv_resistance: 3,
      surface_quality: 2,
      ease_of_print: 1,
      layer_adhesion: 3,
      chemical_resistance: 4
    },
    requires_enclosure: true,
    requires_hardened_nozzle: true,
    compatible_printers: 'enclosed_only',
    tips: 'Glass fiber reinforced for maximum rigidity. Better heat resistance than PA-CF. Good for jigs and fixtures.',
    warnings: 'Requires hardened nozzle and enclosed printer. Extremely hygroscopic. Rougher surface than PA-CF.'
  },
  {
    id: 'pc',
    name: 'PC',
    fullName: 'Polycarbonate',
    category: 'engineering',
    difficulty: 'expert',
    nozzle_temp: { min: 260, max: 300, recommended: 280 },
    bed_temp: { min: 100, max: 120, recommended: 110 },
    chamber_temp: { min: 50, max: 70 },
    plates: {
      cool_plate: { rating: 'not_recommended', glue_stick: false },
      engineering_plate: { rating: 'good', glue_stick: true },
      high_temp_plate: { rating: 'excellent', glue_stick: false },
      textured_pei: { rating: 'poor', glue_stick: true }
    },
    speed: { min: 30, max: 150, recommended: 100 },
    retraction: { distance: 0.6, speed: 40 },
    fan_speed: { min: 0, max: 20 },
    drying: { temp: 80, hours: 8, hygroscopic: 'high' },
    properties: {
      strength: 5,
      flexibility: 3,
      heat_resistance: 5,
      uv_resistance: 3,
      surface_quality: 3,
      ease_of_print: 1,
      layer_adhesion: 4,
      chemical_resistance: 3
    },
    requires_enclosure: true,
    requires_hardened_nozzle: false,
    compatible_printers: 'enclosed_only',
    tips: 'Extremely strong and heat-resistant. Transparent variants available. Best for high-performance applications.',
    warnings: 'Very high print temperatures. Significant warping risk. Requires well-calibrated enclosed printer.'
  },
  {
    id: 'pva',
    name: 'PVA',
    fullName: 'Polyvinyl Alcohol',
    category: 'support',
    difficulty: 'intermediate',
    nozzle_temp: { min: 190, max: 220, recommended: 200 },
    bed_temp: { min: 45, max: 60, recommended: 55 },
    chamber_temp: null,
    plates: {
      cool_plate: { rating: 'good', glue_stick: false },
      engineering_plate: { rating: 'good', glue_stick: false },
      high_temp_plate: { rating: 'poor', glue_stick: false },
      textured_pei: { rating: 'good', glue_stick: false }
    },
    speed: { min: 20, max: 60, recommended: 40 },
    retraction: { distance: 1.0, speed: 25 },
    fan_speed: { min: 80, max: 100 },
    drying: { temp: 45, hours: 8, hygroscopic: 'extreme' },
    properties: {
      strength: 1,
      flexibility: 2,
      heat_resistance: 1,
      uv_resistance: 1,
      surface_quality: 3,
      ease_of_print: 2,
      layer_adhesion: 3,
      chemical_resistance: 1
    },
    requires_enclosure: false,
    requires_hardened_nozzle: false,
    compatible_printers: 'all',
    tips: 'Water-soluble support material. Best paired with PLA. Dissolves in warm water in 4-24 hours.',
    warnings: 'Extremely hygroscopic — store sealed with desiccant. Degrades quickly if exposed to humidity.'
  },
  {
    id: 'pvb',
    name: 'PVB',
    fullName: 'Polyvinyl Butyral',
    category: 'specialty',
    difficulty: 'intermediate',
    nozzle_temp: { min: 200, max: 230, recommended: 215 },
    bed_temp: { min: 50, max: 70, recommended: 60 },
    chamber_temp: null,
    plates: {
      cool_plate: { rating: 'good', glue_stick: false },
      engineering_plate: { rating: 'good', glue_stick: false },
      high_temp_plate: { rating: 'poor', glue_stick: false },
      textured_pei: { rating: 'good', glue_stick: false }
    },
    speed: { min: 30, max: 150, recommended: 100 },
    retraction: { distance: 0.8, speed: 35 },
    fan_speed: { min: 50, max: 80 },
    drying: { temp: 50, hours: 6, hygroscopic: 'medium' },
    properties: {
      strength: 3,
      flexibility: 3,
      heat_resistance: 2,
      uv_resistance: 2,
      surface_quality: 5,
      ease_of_print: 3,
      layer_adhesion: 4,
      chemical_resistance: 2
    },
    requires_enclosure: false,
    requires_hardened_nozzle: false,
    compatible_printers: 'all',
    tips: 'Can be vapor smoothed with isopropyl alcohol for glass-like finish. Partially transparent.',
    warnings: 'Less common material. Isopropyl alcohol fumes during smoothing require ventilation.'
  },
  {
    id: 'hips',
    name: 'HIPS',
    fullName: 'High Impact Polystyrene',
    category: 'support',
    difficulty: 'intermediate',
    nozzle_temp: { min: 220, max: 250, recommended: 235 },
    bed_temp: { min: 80, max: 100, recommended: 90 },
    chamber_temp: { min: 35, max: 50 },
    plates: {
      cool_plate: { rating: 'not_recommended', glue_stick: false },
      engineering_plate: { rating: 'good', glue_stick: false },
      high_temp_plate: { rating: 'excellent', glue_stick: false },
      textured_pei: { rating: 'good', glue_stick: false }
    },
    speed: { min: 40, max: 200, recommended: 150 },
    retraction: { distance: 0.8, speed: 40 },
    fan_speed: { min: 0, max: 50 },
    drying: { temp: 60, hours: 6, hygroscopic: 'low' },
    properties: {
      strength: 3,
      flexibility: 2,
      heat_resistance: 3,
      uv_resistance: 2,
      surface_quality: 3,
      ease_of_print: 3,
      layer_adhesion: 3,
      chemical_resistance: 2
    },
    requires_enclosure: true,
    requires_hardened_nozzle: false,
    compatible_printers: 'enclosed_only',
    tips: 'Soluble support material for ABS (dissolves in limonene). Also usable as standalone material.',
    warnings: 'Requires enclosed printer. Dissolving in limonene takes 24+ hours. Strong citrus odor.'
  },
  {
    id: 'pet-cf',
    name: 'PET-CF',
    fullName: 'PET Carbon Fiber',
    category: 'composite',
    difficulty: 'advanced',
    nozzle_temp: { min: 250, max: 280, recommended: 265 },
    bed_temp: { min: 65, max: 85, recommended: 75 },
    chamber_temp: null,
    plates: {
      cool_plate: { rating: 'poor', glue_stick: true },
      engineering_plate: { rating: 'excellent', glue_stick: false },
      high_temp_plate: { rating: 'good', glue_stick: false },
      textured_pei: { rating: 'excellent', glue_stick: false }
    },
    speed: { min: 40, max: 200, recommended: 150 },
    retraction: { distance: 1.0, speed: 35 },
    fan_speed: { min: 20, max: 60 },
    drying: { temp: 65, hours: 8, hygroscopic: 'medium' },
    properties: {
      strength: 5,
      flexibility: 2,
      heat_resistance: 4,
      uv_resistance: 3,
      surface_quality: 3,
      ease_of_print: 3,
      layer_adhesion: 4,
      chemical_resistance: 3
    },
    requires_enclosure: false,
    requires_hardened_nozzle: true,
    compatible_printers: 'all',
    tips: 'Very rigid and dimensionally stable. Good for engineering parts without an enclosure.',
    warnings: 'Requires hardened nozzle. Carbon fiber makes the material more brittle.'
  }
]);

// Lookup maps (built once, frozen)
const BY_ID = Object.freeze(
  MATERIALS.reduce((map, m) => { map[m.id] = m; return map; }, {})
);

const BY_NAME = Object.freeze(
  MATERIALS.reduce((map, m) => {
    map[m.name.toLowerCase()] = m;
    // Also map common alternative names
    if (m.name === 'PA (Nylon)') {
      map['pa'] = m;
      map['nylon'] = m;
    }
    return map;
  }, {})
);

/**
 * Get all materials.
 * @returns {Array} Frozen array of material objects.
 */
export function getAllMaterials() {
  return MATERIALS;
}

/**
 * Get a material by its id slug (e.g. 'pla', 'pa-cf').
 * @param {string} id
 * @returns {object|null}
 */
export function getMaterialById(id) {
  if (!id) return null;
  return BY_ID[id.toLowerCase()] || null;
}

/**
 * Look up a material by its display name (e.g. 'PLA', 'PA-CF', 'Nylon').
 * Performs a fuzzy match: tries exact, then lowercase, then strips spaces/parens.
 * @param {string} name
 * @returns {object|null}
 */
export function getMaterialByName(name) {
  if (!name) return null;
  const key = name.toLowerCase().trim();
  if (BY_NAME[key]) return BY_NAME[key];
  const stripped = key.replace(/[() ]/g, '');
  if (BY_NAME[stripped]) return BY_NAME[stripped];
  // Compound names like "Rapid PETG" or "Bambu PLA Basic" — try each token,
  // then check if any known material name appears as a substring.
  for (const tok of key.split(/[\s/_-]+/)) {
    if (BY_NAME[tok]) return BY_NAME[tok];
  }
  for (const m of MATERIALS) {
    const mn = m.name.toLowerCase();
    if (key.includes(mn)) return m;
  }
  return MATERIALS.find(m => m.name.toLowerCase().startsWith(key)) || null;
}

/**
 * Get materials filtered by category.
 * @param {string} category - standard, engineering, composite, flexible, specialty, support
 * @returns {Array}
 */
export function getMaterialsByCategory(category) {
  if (!category) return MATERIALS;
  return MATERIALS.filter(m => m.category === category.toLowerCase());
}
