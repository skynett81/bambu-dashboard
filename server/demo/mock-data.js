// Demo-printere
export const MOCK_PRINTERS = [
  { id: 'demo-p2s', name: 'P2S Combo (Demo)', model: 'P2S Combo' },
  { id: 'demo-x1c', name: 'X1 Carbon (Demo)', model: 'X1 Carbon' },
  { id: 'demo-h2d', name: 'H2D (Demo)', model: 'H2D' }
];

// AMS-data for P2S
export const MOCK_AMS_P2S = {
  ams: [
    {
      id: '0',
      humidity: '3',
      temp: '24.5',
      tray: [
        {
          id: '0',
          tray_color: 'FFFFFFFF',
          tray_type: 'PLA',
          tray_sub_brands: 'Bambu Lab',
          tray_id_name: 'Bambu PLA Basic',
          tray_diameter: '1.75',
          bed_temp: '60',
          nozzle_temp_max: '230',
          nozzle_temp_min: '190',
          remain: 78,
          tag_uid: '0000000000000001',
          tray_uuid: 'a1b2c3d4-0001',
          tray_weight: '1000',
          drying_temp: 55,
          drying_time: 8,
          k: 0.02
        },
        {
          id: '1',
          tray_color: '000000FF',
          tray_type: 'PLA',
          tray_sub_brands: 'Bambu Lab',
          tray_id_name: 'Bambu PLA Basic',
          tray_diameter: '1.75',
          bed_temp: '60',
          nozzle_temp_max: '230',
          nozzle_temp_min: '190',
          remain: 45,
          tag_uid: '0000000000000002',
          tray_uuid: 'a1b2c3d4-0002',
          tray_weight: '1000',
          drying_temp: 55,
          drying_time: 8,
          k: 0.02
        },
        {
          id: '2',
          tray_color: 'FF6600FF',
          tray_type: 'PETG',
          tray_sub_brands: 'Bambu Lab',
          tray_id_name: 'Bambu PETG Basic',
          tray_diameter: '1.75',
          bed_temp: '70',
          nozzle_temp_max: '260',
          nozzle_temp_min: '230',
          remain: 92,
          tag_uid: '0000000000000003',
          tray_uuid: 'a1b2c3d4-0003',
          tray_weight: '1000',
          drying_temp: 65,
          drying_time: 6,
          k: 0.04
        },
        {
          id: '3',
          tray_color: 'CCDDFFAA',
          tray_type: 'TPU',
          tray_sub_brands: 'Bambu Lab',
          tray_id_name: 'Bambu TPU 95A',
          tray_diameter: '1.75',
          bed_temp: '50',
          nozzle_temp_max: '240',
          nozzle_temp_min: '220',
          remain: 60,
          tag_uid: '0000000000000004',
          tray_uuid: 'a1b2c3d4-0004',
          tray_weight: '500',
          drying_temp: 50,
          drying_time: 4,
          k: 0.08
        }
      ]
    }
  ],
  ams_exist_bits: '1',
  tray_exist_bits: 'f',
  tray_read_done_bits: 'f',
  tray_reading_bits: '0',
  tray_now: '0',
  tray_pre: '0',
  tray_tar: '0',
  version: 3
};

// AMS-data for X1C (different filaments)
export const MOCK_AMS_X1C = {
  ams: [
    {
      id: '0',
      humidity: '2',
      temp: '25.0',
      tray: [
        {
          id: '0',
          tray_color: 'CC0000FF',
          tray_type: 'PLA+',
          tray_sub_brands: 'eSUN',
          tray_id_name: 'eSUN PLA+',
          tray_diameter: '1.75',
          bed_temp: '60',
          nozzle_temp_max: '230',
          nozzle_temp_min: '200',
          remain: 85,
          tag_uid: '0000000000000005',
          tray_uuid: 'x1c-uuid-0001',
          tray_weight: '1000',
          drying_temp: 55,
          drying_time: 8,
          k: 0.02
        },
        {
          id: '1',
          tray_color: '888888FF',
          tray_type: 'ASA',
          tray_sub_brands: 'Polymaker',
          tray_id_name: 'PolyLite ASA',
          tray_diameter: '1.75',
          bed_temp: '100',
          nozzle_temp_max: '270',
          nozzle_temp_min: '240',
          remain: 100,
          tag_uid: '0000000000000006',
          tray_uuid: 'x1c-uuid-0002',
          tray_weight: '1000',
          drying_temp: 80,
          drying_time: 12,
          k: 0.04
        },
        {
          id: '2',
          tray_color: '0066FFFF',
          tray_type: 'PLA',
          tray_sub_brands: 'Bambu Lab',
          tray_id_name: 'Bambu PLA Matte',
          tray_diameter: '1.75',
          bed_temp: '60',
          nozzle_temp_max: '230',
          nozzle_temp_min: '190',
          remain: 55,
          tag_uid: '0000000000000007',
          tray_uuid: 'x1c-uuid-0003',
          tray_weight: '1000',
          drying_temp: 55,
          drying_time: 8,
          k: 0.02
        },
        {
          id: '3',
          tray_color: '00CC44FF',
          tray_type: 'PETG',
          tray_sub_brands: 'Bambu Lab',
          tray_id_name: 'Bambu PETG HF',
          tray_diameter: '1.75',
          bed_temp: '70',
          nozzle_temp_max: '270',
          nozzle_temp_min: '240',
          remain: 70,
          tag_uid: '0000000000000008',
          tray_uuid: 'x1c-uuid-0004',
          tray_weight: '1000',
          drying_temp: 65,
          drying_time: 6,
          k: 0.04
        }
      ]
    }
  ],
  ams_exist_bits: '1',
  tray_exist_bits: 'f',
  tray_read_done_bits: 'f',
  tray_reading_bits: '0',
  tray_now: '0',
  tray_pre: '0',
  tray_tar: '0',
  version: 3
};

// AMS-data for H2D (dual-nozzle demo)
export const MOCK_AMS_H2D = {
  ams: [
    {
      id: '0',
      humidity: '2',
      temp: '26.0',
      tray: [
        {
          id: '0',
          tray_color: 'FFFFFFFF',
          tray_type: 'PLA',
          tray_sub_brands: 'Bambu Lab',
          tray_id_name: 'Bambu PLA Basic',
          tray_diameter: '1.75',
          bed_temp: '60',
          nozzle_temp_max: '230',
          nozzle_temp_min: '190',
          remain: 90,
          tag_uid: '0000000000000011',
          tray_uuid: 'h2d-uuid-0001',
          tray_weight: '1000',
          drying_temp: 55,
          drying_time: 8,
          k: 0.02
        },
        {
          id: '1',
          tray_color: 'FF0000FF',
          tray_type: 'PLA',
          tray_sub_brands: 'Bambu Lab',
          tray_id_name: 'Bambu PLA Basic',
          tray_diameter: '1.75',
          bed_temp: '60',
          nozzle_temp_max: '230',
          nozzle_temp_min: '190',
          remain: 65,
          tag_uid: '0000000000000012',
          tray_uuid: 'h2d-uuid-0002',
          tray_weight: '1000',
          drying_temp: 55,
          drying_time: 8,
          k: 0.02
        },
        null,
        null
      ]
    }
  ],
  ams_exist_bits: '1',
  tray_exist_bits: '3',
  tray_read_done_bits: '3',
  tray_reading_bits: '0',
  tray_now: '0',
  tray_pre: '0',
  tray_tar: '0',
  version: 3
};

// Legacy export for compatibility
export const MOCK_AMS = MOCK_AMS_P2S;

// Demo print-jobber for historikk
export const MOCK_HISTORY = [
  { filename: 'benchy_v2.3mf', status: 'completed', duration_seconds: 3420, filament_used_g: 14.2, filament_type: 'PLA', filament_brand: 'Bambu Lab', filament_color: 'FFFFFFFF', layer_count: 150, days_ago: 1, speed_level: 2, nozzle_target: 220, bed_target: 60, max_nozzle_temp: 221, max_bed_temp: 61, nozzle_type: 'stainless_steel', nozzle_diameter: 0.4 },
  { filename: 'cable_clip_x4.3mf', status: 'completed', duration_seconds: 1860, filament_used_g: 8.5, filament_type: 'PLA', filament_brand: 'Bambu Lab', filament_color: '000000FF', layer_count: 80, days_ago: 2, speed_level: 3, nozzle_target: 220, bed_target: 60, max_nozzle_temp: 222, max_bed_temp: 60, nozzle_type: 'stainless_steel', nozzle_diameter: 0.4 },
  { filename: 'phone_stand.3mf', status: 'completed', duration_seconds: 7200, filament_used_g: 42.0, filament_type: 'PETG', filament_brand: 'Bambu Lab', filament_color: 'FF6600FF', layer_count: 220, days_ago: 3, speed_level: 2, nozzle_target: 250, bed_target: 80, max_nozzle_temp: 252, max_bed_temp: 81, nozzle_type: 'stainless_steel', nozzle_diameter: 0.4 },
  { filename: 'gear_test.3mf', status: 'failed', duration_seconds: 2400, filament_used_g: 12.0, filament_type: 'PLA', filament_brand: 'Bambu Lab', filament_color: 'FFFFFFFF', layer_count: 95, days_ago: 4, speed_level: 4, nozzle_target: 220, bed_target: 60, max_nozzle_temp: 223, max_bed_temp: 61 },
  { filename: 'vase_mode.3mf', status: 'completed', duration_seconds: 5400, filament_used_g: 35.0, filament_type: 'PLA', filament_brand: 'Bambu Lab', filament_color: '000000FF', layer_count: 300, days_ago: 5, speed_level: 1, nozzle_target: 215, bed_target: 55, max_nozzle_temp: 216, max_bed_temp: 56 },
  { filename: 'hinge_prototype.3mf', status: 'completed', duration_seconds: 900, filament_used_g: 4.2, filament_type: 'PETG', filament_brand: 'Bambu Lab', filament_color: 'FF6600FF', layer_count: 45, days_ago: 7, speed_level: 2, nozzle_target: 250, bed_target: 80, max_nozzle_temp: 251, max_bed_temp: 80 },
  { filename: 'bumper_case.3mf', status: 'completed', duration_seconds: 4800, filament_used_g: 28.0, filament_type: 'TPU', filament_brand: 'Bambu Lab', filament_color: 'CCDDFFAA', layer_count: 180, days_ago: 8, speed_level: 1, nozzle_target: 230, bed_target: 60, max_nozzle_temp: 231, max_bed_temp: 61, nozzle_type: 'stainless_steel', nozzle_diameter: 0.4 },
  { filename: 'lithophane.3mf', status: 'cancelled', duration_seconds: 1200, filament_used_g: 6.0, filament_type: 'PLA', filament_brand: 'Bambu Lab', filament_color: 'FFFFFFFF', layer_count: 40, days_ago: 10, speed_level: 1 },
  { filename: 'bracket_v3.3mf', status: 'completed', duration_seconds: 2700, filament_used_g: 18.5, filament_type: 'PETG', filament_brand: 'Bambu Lab', filament_color: 'FF6600FF', layer_count: 120, days_ago: 12, speed_level: 2, nozzle_target: 250, bed_target: 80, max_nozzle_temp: 250, max_bed_temp: 81, color_changes: 2, waste_g: 1.8 },
  { filename: 'fan_duct.3mf', status: 'completed', duration_seconds: 3600, filament_used_g: 22.0, filament_type: 'PLA', filament_brand: 'eSUN', filament_color: '000000FF', layer_count: 160, days_ago: 14, speed_level: 3, nozzle_target: 220, bed_target: 60, max_nozzle_temp: 221, max_bed_temp: 61 },
  { filename: 'raspberry_pi_case.3mf', status: 'completed', duration_seconds: 5100, filament_used_g: 38.0, filament_type: 'PLA', filament_brand: 'Bambu Lab', filament_color: 'FFFFFFFF', layer_count: 200, days_ago: 16, speed_level: 2, nozzle_target: 220, bed_target: 60, max_nozzle_temp: 221, max_bed_temp: 60, nozzle_type: 'stainless_steel', nozzle_diameter: 0.4 },
  { filename: 'gridfinity_base.3mf', status: 'completed', duration_seconds: 1500, filament_used_g: 10.0, filament_type: 'PLA', filament_brand: 'Bambu Lab', filament_color: '000000FF', layer_count: 60, days_ago: 18, speed_level: 2, nozzle_target: 220, bed_target: 60, max_nozzle_temp: 220, max_bed_temp: 60 },
  { filename: 'cable_chain.3mf', status: 'failed', duration_seconds: 800, filament_used_g: 3.0, filament_type: 'PETG', filament_brand: 'Polymaker', filament_color: 'FF6600FF', layer_count: 25, days_ago: 20, speed_level: 3, nozzle_target: 250, bed_target: 80, max_nozzle_temp: 253, max_bed_temp: 82 },
  { filename: 'headphone_hook.3mf', status: 'completed', duration_seconds: 2100, filament_used_g: 15.0, filament_type: 'PLA', filament_brand: 'Bambu Lab', filament_color: 'FFFFFFFF', layer_count: 110, days_ago: 25, speed_level: 2, nozzle_target: 220, bed_target: 60, max_nozzle_temp: 221, max_bed_temp: 60 },
  { filename: 'spool_holder.3mf', status: 'completed', duration_seconds: 6300, filament_used_g: 55.0, filament_type: 'PETG', filament_brand: 'Bambu Lab', filament_color: 'FF6600FF', layer_count: 280, days_ago: 28, speed_level: 2, nozzle_target: 250, bed_target: 80, max_nozzle_temp: 251, max_bed_temp: 81, color_changes: 3, waste_g: 2.4 }
];

// Demo filament-lager
export const MOCK_FILAMENT = [
  { printer_id: 'demo-p2s', brand: 'Bambu Lab', type: 'PLA', color_name: 'Hvit', color_hex: 'FFFFFF', weight_total_g: 1000, weight_used_g: 220, cost_nok: 219 },
  { printer_id: 'demo-p2s', brand: 'Bambu Lab', type: 'PLA', color_name: 'Svart', color_hex: '000000', weight_total_g: 1000, weight_used_g: 350, cost_nok: 219 },
  { printer_id: 'demo-p2s', brand: 'Bambu Lab', type: 'PETG', color_name: 'Oransje', color_hex: 'FF6600', weight_total_g: 1000, weight_used_g: 80, cost_nok: 249 },
  { printer_id: 'demo-p2s', brand: 'Bambu Lab', type: 'TPU', color_name: 'Klar', color_hex: 'CCDDFF', weight_total_g: 500, weight_used_g: 28, cost_nok: 299 },
  { printer_id: 'demo-x1c', brand: 'eSUN', type: 'PLA+', color_name: 'Rød', color_hex: 'CC0000', weight_total_g: 1000, weight_used_g: 0, cost_nok: 179 },
  { printer_id: 'demo-x1c', brand: 'Polymaker', type: 'ASA', color_name: 'Grå', color_hex: '888888', weight_total_g: 1000, weight_used_g: 0, cost_nok: 329 },
  { printer_id: 'demo-h2d', brand: 'Bambu Lab', type: 'PLA', color_name: 'Blå', color_hex: '0066FF', weight_total_g: 1000, weight_used_g: 150, cost_nok: 219 }
];

// Demo feillogg
export const MOCK_ERRORS = [
  { code: '0300_0100', message: 'Filament brutt i AMS spor 1', severity: 'warning', days_ago: 4 },
  { code: '0700_0001', message: 'Første lag inspeksjon: avvik detektert', severity: 'warning', days_ago: 4 },
  { code: '0500_0200', message: 'Dysetemperatur ustabil', severity: 'error', days_ago: 20 },
  { code: '0300_0300', message: 'AMS spor 3 kunne ikke leses', severity: 'info', days_ago: 22 },
  { code: '0C00_0001', message: 'Nettverkstilkobling midlertidig tapt', severity: 'warning', days_ago: 25 }
];
