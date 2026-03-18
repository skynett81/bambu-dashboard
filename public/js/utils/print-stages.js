/**
 * Bambu Lab Print Stage Codes (stg_cur).
 * 36 distinkte stager fra BambuBoard-prosjektet.
 * Oversatt til norsk. SVG-ikoner istedenfor emojis.
 */
(function() {
  'use strict';

  // Compact SVG icons (18x18, stroke-based, matches dashboard style)
  const I = {
    print:    '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>',
    level:    '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 20h20"/><path d="M5 20V8l7-5 7 5v12"/></svg>',
    heat:     '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 14.76V3.5a2.5 2.5 0 00-5 0v11.26a4.5 4.5 0 105 0z"/></svg>',
    arrows:   '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14"/><path d="M12 5l7 7-7 7"/></svg>',
    refresh:  '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12a9 9 0 11-9-9"/><path d="M21 3v9h-9"/></svg>',
    pause:    '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>',
    warn:     '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
    target:   '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>',
    scan:     '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 7V2h5"/><path d="M17 2h5v5"/><path d="M22 17v5h-5"/><path d="M7 22H2v-5"/><line x1="2" y1="12" x2="22" y2="12"/></svg>',
    search:   '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>',
    box:      '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/></svg>',
    home:     '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/></svg>',
    brush:    '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9.06 11.9l8.07-8.06a2.85 2.85 0 114.03 4.03l-8.06 8.08"/><path d="M7.07 14.94c-1.66 0-3 1.35-3 3.02 0 1.33-2.5 1.52-2 2.02 1.08 1.1 2.49 2.02 4 2.02 2.2 0 4-1.8 4-4.04a3.01 3.01 0 00-3-3.02z"/></svg>',
    thermo:   '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 14.76V3.5a2.5 2.5 0 00-5 0v11.26a4.5 4.5 0 105 0z"/></svg>',
    door:     '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 2h-3a5 5 0 00-5 5v3H7v5a5 5 0 005 5h3"/><path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4"/></svg>',
    drop:     '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2.69l5.66 5.66a8 8 0 11-11.31 0z"/></svg>',
    up:       '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/></svg>',
    down:     '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/></svg>',
    skip:     '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5 4 15 12 5 20"/><line x1="19" y1="5" x2="19" y2="19"/></svg>',
    volume:   '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19"/><path d="M19.07 4.93a10 10 0 010 14.14"/></svg>',
    fan:      '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 12c-3-3-6-3-8-1s-1 6 2 8 6 1 6-2c3 3 6 3 8 1s1-6-2-8"/><circle cx="12" cy="12" r="1"/></svg>',
    snow:     '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="2" x2="12" y2="22"/><line x1="2" y1="12" x2="22" y2="12"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/><line x1="19.07" y1="4.93" x2="4.93" y2="19.07"/></svg>',
    scissors: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><line x1="20" y1="4" x2="8.12" y2="15.88"/><line x1="14.47" y1="14.48" x2="20" y2="20"/><line x1="8.12" y1="8.12" x2="12" y2="12"/></svg>',
    alert:    '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>',
  };

  const STAGES = {
    0:  { key: 'printing',             nb: 'Printer',                    en: 'Printing',                      icon: I.print,    color: 'var(--accent-green)' },
    1:  { key: 'bed_leveling',         nb: 'Auto bed-nivelering',        en: 'Auto bed leveling',             icon: I.level,    color: 'var(--accent-blue)' },
    2:  { key: 'heatbed_preheating',   nb: 'Forvarmer varmeplate',       en: 'Heatbed preheating',            icon: I.heat,     color: 'var(--accent-orange)' },
    3:  { key: 'sweeping_xy',          nb: 'Sveiper XY-mekanikk',        en: 'Sweeping XY mech mode',         icon: I.arrows,   color: 'var(--text-muted)' },
    4:  { key: 'changing_filament',    nb: 'Bytter filament',            en: 'Changing filament',             icon: I.refresh,  color: 'var(--accent-orange)' },
    5:  { key: 'm400_pause',           nb: 'M400 pause',                 en: 'M400 pause',                    icon: I.pause,    color: 'var(--accent-orange)' },
    6:  { key: 'filament_runout',      nb: 'Pause — filament tom',       en: 'Paused: filament runout',       icon: I.warn,     color: 'var(--accent-red)' },
    7:  { key: 'heating_hotend',       nb: 'Varmer opp dyse',            en: 'Heating hotend',                icon: I.heat,     color: 'var(--accent-orange)' },
    8:  { key: 'calibrating_extrusion',nb: 'Kalibrerer ekstrudering',    en: 'Calibrating extrusion',         icon: I.target,   color: 'var(--accent-blue)' },
    9:  { key: 'scanning_bed',         nb: 'Skanner sengoverflate',      en: 'Scanning bed surface',          icon: I.scan,     color: 'var(--accent-blue)' },
    10: { key: 'inspecting_first_layer',nb:'Inspiserer første lag',      en: 'Inspecting first layer',        icon: I.search,   color: 'var(--accent-blue)' },
    11: { key: 'identifying_plate',    nb: 'Identifiserer byggplate',    en: 'Identifying build plate type',  icon: I.box,      color: 'var(--accent-blue)' },
    12: { key: 'calibrating_lidar',    nb: 'Kalibrerer Micro Lidar',     en: 'Calibrating Micro Lidar',       icon: I.scan,     color: 'var(--accent-blue)' },
    13: { key: 'homing',              nb: 'Homing av verktøyhode',      en: 'Homing toolhead',               icon: I.home,     color: 'var(--accent-blue)' },
    14: { key: 'cleaning_nozzle',     nb: 'Renser dysespiss',            en: 'Cleaning nozzle tip',           icon: I.brush,    color: 'var(--accent-blue)' },
    15: { key: 'checking_extruder',   nb: 'Sjekker ekstrudertemp',       en: 'Checking extruder temperature', icon: I.thermo,   color: 'var(--accent-orange)' },
    16: { key: 'paused_by_user',      nb: 'Pauset av bruker',            en: 'Paused by user',                icon: I.pause,    color: 'var(--accent-orange)' },
    17: { key: 'front_cover_pause',   nb: 'Pause — frontdeksel falt',    en: 'Paused: front cover falling',   icon: I.door,     color: 'var(--accent-red)' },
    18: { key: 'calibrating_lidar_2', nb: 'Kalibrerer Micro Lidar',      en: 'Calibrating Micro Lidar',       icon: I.scan,     color: 'var(--accent-blue)' },
    19: { key: 'calibrating_flow',    nb: 'Kalibrerer ekstruderingsflyt', en:'Calibrating extrusion flow',    icon: I.drop,     color: 'var(--accent-blue)' },
    20: { key: 'nozzle_temp_error',   nb: 'Pause — dysetemp-feil',       en: 'Paused: nozzle temp malfunction',icon:I.thermo,   color: 'var(--accent-red)' },
    21: { key: 'bed_temp_error',      nb: 'Pause — sengtemp-feil',       en: 'Paused: bed temp malfunction',  icon: I.thermo,   color: 'var(--accent-red)' },
    22: { key: 'filament_unloading',  nb: 'Laster ut filament',          en: 'Filament unloading',            icon: I.up,       color: 'var(--accent-orange)' },
    23: { key: 'skip_step_pause',     nb: 'Pause — hoppet over steg',    en: 'Skip step pause',               icon: I.skip,     color: 'var(--accent-orange)' },
    24: { key: 'filament_loading',    nb: 'Laster filament',             en: 'Filament loading',              icon: I.down,     color: 'var(--accent-orange)' },
    25: { key: 'motor_noise_cal',     nb: 'Motorkalibrering (støy)',      en: 'Motor noise calibration',       icon: I.volume,   color: 'var(--accent-blue)' },
    26: { key: 'ams_lost_pause',      nb: 'Pause — AMS mistet',          en: 'Paused: AMS lost',              icon: I.warn,     color: 'var(--accent-red)' },
    27: { key: 'heatbreak_fan_pause', nb: 'Pause — heatbreak vifte lav', en:'Paused: heatbreak fan low speed',icon:I.fan,       color: 'var(--accent-red)' },
    28: { key: 'chamber_temp_error',  nb: 'Pause — kammertemp-feil',     en: 'Paused: chamber temp error',    icon: I.thermo,   color: 'var(--accent-red)' },
    29: { key: 'cooling_chamber',     nb: 'Kjøler ned kammer',           en: 'Cooling chamber',               icon: I.snow,     color: 'var(--accent-blue)' },
    30: { key: 'gcode_pause',         nb: 'Pause fra G-kode',            en: 'Paused by G-code',              icon: I.pause,    color: 'var(--accent-orange)' },
    31: { key: 'motor_noise_showoff', nb: 'Motorstøy-demo',              en: 'Motor noise showoff',           icon: I.volume,   color: 'var(--text-muted)' },
    32: { key: 'nozzle_filament_covered',nb:'Pause — dyse dekket',       en: 'Paused: nozzle filament covered',icon:I.warn,     color: 'var(--accent-red)' },
    33: { key: 'cutter_error',        nb: 'Pause — kutterfeil',          en: 'Paused: cutter error',          icon: I.scissors, color: 'var(--accent-red)' },
    34: { key: 'first_layer_error',   nb: 'Pause — førstelagsfeil',      en: 'Paused: first layer error',     icon: I.alert,    color: 'var(--accent-red)' },
    35: { key: 'nozzle_clog',         nb: 'Pause — dyse tettet',         en: 'Paused: nozzle clog',           icon: I.alert,    color: 'var(--accent-red)' },
  };

  window.getPrintStage = function(stgCur) {
    if (stgCur == null || stgCur === '' || stgCur === -1) return null;
    const code = parseInt(stgCur);
    const stage = STAGES[code];
    if (!stage) return null;

    const lang = (typeof window.currentLang === 'string' && window.currentLang.startsWith('en')) ? 'en' : 'nb';
    return {
      code,
      key: stage.key,
      label: stage[lang] || stage.nb,
      icon: stage.icon,
      color: stage.color,
      isError: [17, 20, 21, 26, 27, 28, 32, 33, 34, 35].includes(code),
      isPause: [5, 6, 16, 17, 20, 21, 23, 26, 27, 28, 30, 32, 33, 34, 35].includes(code),
      isCalibrating: [1, 8, 9, 10, 11, 12, 13, 14, 15, 18, 19, 25].includes(code),
    };
  };

  window.renderStageBadge = function(stgCur) {
    const stage = window.getPrintStage(stgCur);
    if (!stage) return '';
    const bgColor = stage.isError ? 'rgba(239,68,68,0.12)' :
                    stage.isPause ? 'rgba(245,158,11,0.12)' :
                    stage.isCalibrating ? 'rgba(18,121,255,0.12)' :
                    'rgba(0,174,66,0.12)';
    return `<span class="print-stage-badge" style="background:${bgColor};color:${stage.color};font-size:0.72rem;font-weight:600;padding:2px 8px;border-radius:6px;white-space:nowrap;display:inline-flex;align-items:center;gap:4px">
      ${stage.icon}<span>${stage.label}</span>
    </span>`;
  };

  window.getAllPrintStages = function() {
    return Object.entries(STAGES).map(([code, s]) => ({
      code: parseInt(code),
      key: s.key,
      label_nb: s.nb,
      label_en: s.en,
    }));
  };
})();
