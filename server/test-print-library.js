/**
 * Standard test-print library — 12 reference models with metadata.
 *
 * The library doesn't ship the actual STL bytes (would bloat the repo);
 * instead each entry points at a free-to-download source. Models from
 * 3DBenchy, Voron Calibration Cube, etc. are released under permissive
 * licences specifically so dashboards can link to them.
 */

export const TEST_PRINTS = [
  {
    id: '3dbenchy',
    name: '3DBenchy',
    description: 'The jolly torture-test boat — bridges, overhangs, dimensions, fine details.',
    purpose: 'general-quality',
    tags: ['benchmark', 'overhang', 'bridge', 'dimensions'],
    expected_minutes: 70,
    expected_grams: 14.5,
    sourceUrl: 'https://www.3dbenchy.com/download/',
    licence: 'CC-BY-ND-4.0',
    look_for: [
      'Smooth hull (no over-extrusion or stringing)',
      'Bridge across cabin window must be flat',
      'Chimney circular without elephant\'s foot',
      'Dimensions: 60 × 31 × 48mm exactly',
    ],
  },
  {
    id: 'xyz-cube',
    name: 'XYZ Calibration Cube',
    description: '20×20×20 mm cube with X/Y/Z labels — measures axis dimensions.',
    purpose: 'dimensional',
    tags: ['calibration', 'dimensions', 'simple'],
    expected_minutes: 40,
    expected_grams: 6,
    sourceUrl: 'https://www.thingiverse.com/thing:1278865',
    licence: 'CC-BY-4.0',
    look_for: [
      'Each face measures 20.00 ± 0.10 mm',
      'Letters legible without smearing',
      'Sharp corners (no elephant\'s foot)',
    ],
  },
  {
    id: 'all3dbenchy',
    name: 'All3DBenchy',
    description: 'Massive 6-hour benchmark covering every printer parameter.',
    purpose: 'comprehensive',
    tags: ['benchmark', 'long', 'comprehensive'],
    expected_minutes: 360,
    expected_grams: 60,
    sourceUrl: 'https://www.printables.com/model/272215',
    licence: 'CC-BY-4.0',
    look_for: [
      'Each test section scored 1-5 (visible on print)',
      'Total score ≥ 80% indicates well-tuned printer',
    ],
  },
  {
    id: 'voron-cube',
    name: 'Voron Design Cube',
    description: '5-sided cube used by Voron community to verify printer quality.',
    purpose: 'voron-quality',
    tags: ['voron', 'calibration', 'speed'],
    expected_minutes: 30,
    expected_grams: 5,
    sourceUrl: 'https://github.com/VoronDesign/Voron-2',
    licence: 'GPL-3.0',
    look_for: [
      'Layer lines uniform across all 4 walls',
      'No ringing/ghosting on letter V',
      'Top surface smooth, no pillowing',
    ],
  },
  {
    id: 'stringing-test',
    name: 'Stringing Test (Spike Tower)',
    description: '6 thin spikes spaced apart — find ideal retraction settings.',
    purpose: 'retraction',
    tags: ['retraction', 'stringing'],
    expected_minutes: 25,
    expected_grams: 3,
    sourceUrl: 'https://www.thingiverse.com/thing:909901',
    licence: 'CC-BY-4.0',
    look_for: [
      'No filament strands between spikes',
      'Tips of spikes are sharp, not blobby',
    ],
  },
  {
    id: 'bridging-test',
    name: 'Bridging Test',
    description: 'Spans of varying length to test bridge quality.',
    purpose: 'bridging',
    tags: ['bridge', 'overhang'],
    expected_minutes: 30,
    expected_grams: 4,
    sourceUrl: 'https://www.thingiverse.com/thing:12925',
    licence: 'CC-BY-4.0',
    look_for: [
      'No drooping in spans up to 30mm',
      'Bottom surface smooth (cooling adequate)',
      'No gaps where bridges land on supports',
    ],
  },
  {
    id: 'overhang-test',
    name: 'Overhang Angle Test',
    description: 'Steps from 30° to 75° — find printer\'s overhang limit.',
    purpose: 'overhang',
    tags: ['overhang'],
    expected_minutes: 35,
    expected_grams: 5,
    sourceUrl: 'https://www.thingiverse.com/thing:2806295',
    licence: 'CC-BY-4.0',
    look_for: [
      'Surface clean up to printer\'s rated overhang angle',
      'No support material needed below tested angle',
    ],
  },
  {
    id: 'tolerance-test',
    name: 'Print-In-Place Tolerance Test',
    description: 'Holes of varying clearance to test fit tolerances.',
    purpose: 'tolerances',
    tags: ['tolerance', 'fit', 'clearance'],
    expected_minutes: 50,
    expected_grams: 8,
    sourceUrl: 'https://www.thingiverse.com/thing:1379890',
    licence: 'CC-BY-SA-4.0',
    look_for: [
      'Pegs free at 0.30mm clearance',
      'Pegs press-fit at 0.15mm clearance',
      'Determine your printer\'s fit-tolerance baseline',
    ],
  },
  {
    id: 'temp-tower-pla',
    name: 'PLA Temperature Tower (190-220°C)',
    description: 'Auto-generated locally via Calibration Suite → Temp Tower.',
    purpose: 'temperature',
    tags: ['calibration', 'temperature', 'pla'],
    expected_minutes: 50,
    expected_grams: 12,
    sourceUrl: 'internal:calibration/temp-tower',
    licence: 'internal',
    look_for: [
      'Cleanest layer adhesion',
      'Least stringing',
      'Sharpest overhang quality',
    ],
  },
  {
    id: 'first-layer',
    name: 'First Layer Test (200×200 grid)',
    description: 'Auto-generated locally via Calibration Suite → First Layer.',
    purpose: 'bed-leveling',
    tags: ['first-layer', 'bed-leveling'],
    expected_minutes: 15,
    expected_grams: 4,
    sourceUrl: 'internal:calibration/first-layer',
    licence: 'internal',
    look_for: [
      'Uniform line width across entire plate',
      'No gaps between adjacent passes',
      'Adhesion across the full pattern',
    ],
  },
  {
    id: 'ringing-test',
    name: 'Ringing/Ghosting Test',
    description: 'Sharp corners + plain sides to expose ringing artifacts.',
    purpose: 'resonance',
    tags: ['resonance', 'input-shaper', 'ringing'],
    expected_minutes: 20,
    expected_grams: 3,
    sourceUrl: 'https://www.printables.com/model/19895',
    licence: 'CC-BY-4.0',
    look_for: [
      'No echoes/ripples after each corner',
      'Layer lines straight, not wavy',
      'Run input shaper if ringing visible',
    ],
  },
  {
    id: 'flexible-test',
    name: 'TPU/Flexible Test',
    description: 'Squashed cube + bend test for soft filaments.',
    purpose: 'tpu-quality',
    tags: ['tpu', 'flexible'],
    expected_minutes: 60,
    expected_grams: 10,
    sourceUrl: 'https://www.thingiverse.com/thing:2837916',
    licence: 'CC-BY-4.0',
    look_for: [
      'No stringing on slow extrusion',
      'Bends without delamination',
      'Squash recovers shape',
    ],
  },
];

export function listTestPrints(filters = {}) {
  let out = TEST_PRINTS;
  if (filters.tag) out = out.filter(p => p.tags.includes(filters.tag));
  if (filters.purpose) out = out.filter(p => p.purpose === filters.purpose);
  return out;
}

export function getTestPrint(id) {
  return TEST_PRINTS.find(p => p.id === id) || null;
}

export function listPurposes() {
  return Array.from(new Set(TEST_PRINTS.map(p => p.purpose)));
}

export function listTags() {
  const tags = new Set();
  for (const p of TEST_PRINTS) for (const t of p.tags) tags.add(t);
  return Array.from(tags).sort();
}
