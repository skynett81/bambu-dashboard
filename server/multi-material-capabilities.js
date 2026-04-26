/**
 * Multi-material capability scaffolding.
 *
 * Describes the capability surface of every multi-material / toolchanger
 * system we recognise. Most of these have live state models we already
 * parse (AMS, MMU3, ERCF, AFC, Bambu vortek). A few are placeholders for
 * hardware that has been announced but not shipped / reverse-engineered:
 *
 *   - INDX (Bondtech, spring 2026): 4/8-head modular multi-material
 *   - CANVAS (Elegoo): Centauri Carbon 2 exclusive, proprietary
 *
 * The placeholder entries let the UI render a "capability present but
 * not yet supported" banner instead of silently ignoring the printer.
 */

export const MULTI_MATERIAL_SYSTEMS = Object.freeze({
  ams: {
    vendor: 'bambu',
    label: 'Bambu AMS',
    slots: 4,
    rfid: true,
    autoDrying: false,
    status: 'shipped',
  },
  ams_2_pro: {
    vendor: 'bambu',
    label: 'Bambu AMS 2 Pro',
    slots: 4,
    rfid: true,
    autoDrying: true,
    status: 'shipped',
  },
  ams_ht: {
    vendor: 'bambu',
    label: 'Bambu AMS HT',
    slots: 4,
    rfid: true,
    autoDrying: true,
    highTemp: true,
    rotisserie: true,
    status: 'shipped',
  },
  ams_lite: {
    vendor: 'bambu',
    label: 'Bambu AMS Lite',
    slots: 4,
    rfid: false,
    autoDrying: false,
    status: 'shipped',
  },
  vortek: {
    vendor: 'bambu',
    label: 'Bambu Vortek (H2C 7-nozzle)',
    slots: 7,
    rfid: false,
    toolchanger: true,
    status: 'shipped',
  },
  mmu3: {
    vendor: 'prusa',
    label: 'Prusa MMU3',
    slots: 5,
    rfid: false,
    status: 'shipped',
  },
  indx_4: {
    vendor: 'prusa',
    label: 'Bondtech INDX (4-head)',
    slots: 4,
    toolchanger: true,
    status: 'announced',
    _note: 'Hardware shipping spring 2026; dashboard capability flag only — full state model will land once API is documented.',
  },
  indx_8: {
    vendor: 'prusa',
    label: 'Bondtech INDX (8-head)',
    slots: 8,
    toolchanger: true,
    status: 'announced',
    _note: 'Hardware shipping spring 2026; dashboard capability flag only — full state model will land once API is documented.',
  },
  ercf: {
    vendor: 'voron',
    label: 'ERCF (Enraged Rabbit Carrot Feeder)',
    slots: 12,
    status: 'shipped',
  },
  afc_lite: {
    vendor: 'armored_turtle',
    label: 'AFC-Lite (Armored Turtle)',
    slots: 12,
    status: 'shipped',
  },
  canvas: {
    vendor: 'elegoo',
    label: 'Elegoo CANVAS',
    status: 'proprietary',
    _note: 'Proprietary multi-material system exclusive to Centauri Carbon 2. No public API — dashboard shows capability flag only.',
  },
  qidi_box: {
    vendor: 'qidi',
    label: 'QIDI Box',
    slots: 4,
    status: 'shipped',
  },
  cfs: {
    vendor: 'creality',
    label: 'Creality Filament System',
    slots: 4,
    rfid: true,
    status: 'shipped',
  },
  snapmaker_u1: {
    vendor: 'snapmaker',
    label: 'Snapmaker U1 toolchanger',
    slots: 4,
    toolchanger: true,
    rfid: true,
    status: 'shipped',
  },
});

/** Resolve a system id to its capability descriptor, or null. */
export function getMultiMaterialSystem(id) {
  return MULTI_MATERIAL_SYSTEMS[id] || null;
}

/** List every MM system known to us. */
export function listMultiMaterialSystems() {
  return Object.entries(MULTI_MATERIAL_SYSTEMS).map(([id, desc]) => ({ id, ...desc }));
}

/** True if the system is known but not yet fully supported. */
export function isPlaceholderSystem(id) {
  const sys = MULTI_MATERIAL_SYSTEMS[id];
  return !!sys && (sys.status === 'announced' || sys.status === 'proprietary');
}
