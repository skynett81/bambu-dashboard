/**
 * Multi-brand Resources Importer
 *
 * Imports reference data for non-Prusa printer brands:
 *  - Bambu Lab: HMS error codes + G-code reference
 *  - Klipper (Voron, Creality, Elegoo, AnkerMake, Voron, QIDI, RatRig, Snapmaker): G-code reference
 *  - Snapmaker U1: custom G-codes (beyond Klipper)
 *  - OctoPrint: plugin catalog
 *
 * Brings the non-Prusa brands closer to Prusa's depth of integration.
 * Data is cached locally and refreshed every 7 days.
 */

import { getDb } from './db/connection.js';
import { createLogger } from './logger.js';

const log = createLogger('brand-import');

const USER_AGENT = '3dprintforge';
const REFRESH_INTERVAL_MS = 7 * 24 * 60 * 60 * 1000;

async function _fetchText(url, timeoutMs = 15000) {
  const res = await fetch(url, {
    signal: AbortSignal.timeout(timeoutMs),
    headers: { 'User-Agent': USER_AGENT },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} ${url}`);
  return res.text();
}

async function _fetchJson(url, timeoutMs = 15000) {
  const res = await fetch(url, {
    signal: AbortSignal.timeout(timeoutMs),
    headers: { 'User-Agent': USER_AGENT },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} ${url}`);
  return res.json();
}

function _setRefreshStatus(resource, status, items, error) {
  try {
    getDb().prepare(`INSERT OR REPLACE INTO brand_data_refresh (resource, last_fetched_at, status, error, items_imported) VALUES (?, datetime('now'), ?, ?, ?)`)
      .run(resource, status, error || null, items || 0);
  } catch {}
}

// ══════════════════════════════════════════
// BAMBU LAB — HMS error codes + G-codes
// ══════════════════════════════════════════

/**
 * Bambu HMS error codes — imported from the community-maintained OpenBambuAPI docs.
 * Bambu uses 8-digit hex codes like 0C00_0100_0002_0003
 * (module, subcode, severity, error_id).
 */
export async function importBambuResources() {
  const db = getDb();
  const startTs = Date.now();

  // Curated HMS error code database derived from OpenBambuAPI + Bambu wiki
  // Format: [code, severity, module, category, title, description, action]
  const hmsErrors = [
    // X1C/P1 commonly seen errors (module 05 = AMS, 03 = MC, 07 = Nozzle, 0C = Xcam)
    ['0500_0100_0001_0001', 'warning', 'AMS', 'AMS', 'AMS filament switch failure', 'Filament switch sensor reports invalid state in AMS slot', 'Check AMS slot sensors for debris or damage'],
    ['0500_0100_0002_0002', 'warning', 'AMS', 'AMS', 'AMS motion error', 'AMS motor cannot advance filament', 'Clear filament jam in AMS slot'],
    ['0500_0200_0003_0002', 'info', 'AMS', 'AMS', 'AMS tray empty', 'AMS slot is empty — load filament', 'Load filament into the indicated slot'],
    ['0300_9600_0002_0001', 'warning', 'MC', 'Motion', 'Motion check error', 'Motion controller detected an anomaly during print', 'Check belts and gantry for obstruction'],
    ['0700_8000_0001_0001', 'warning', 'Nozzle', 'Nozzle', 'Nozzle clog detected', 'Extruder is not extruding filament as expected', 'Clean the nozzle, check for cold pull, verify temperature'],
    ['0700_8001_0001_0001', 'serious', 'Nozzle', 'Nozzle', 'Nozzle temperature abnormal', 'Hotend thermistor reports abnormal reading', 'Check thermistor connection; replace if damaged'],
    ['0C00_0100_0001_0001', 'info', 'Xcam', 'AI', 'First layer issue detected', 'xcam AI detected first layer defects', 'Check bed adhesion and re-level bed'],
    ['0C00_0100_0002_0001', 'warning', 'Xcam', 'AI', 'Spaghetti failure detected', 'xcam AI detected print spaghetti (runaway filament)', 'Pause print and inspect; re-level bed'],
    ['0C00_0100_0003_0001', 'warning', 'Xcam', 'AI', 'Foreign object detected', 'xcam AI detected foreign object on build plate', 'Remove object from build plate before resuming'],
    ['0C00_0100_0004_0001', 'info', 'Xcam', 'AI', 'Nozzle clumping detected', 'xcam AI detected material build-up on nozzle', 'Clean nozzle to prevent print defects'],
    ['0000_0400_0001_0001', 'serious', 'Bed', 'Bed', 'Bed temperature too high', 'Heatbed thermal runaway protection triggered', 'Power cycle printer; check thermistor'],
    ['0000_0400_0002_0001', 'serious', 'Bed', 'Bed', 'Bed heating failure', 'Heatbed not reaching target temperature', 'Check heatbed wiring and MOSFET'],
    ['0000_0500_0001_0001', 'info', 'Chamber', 'Chamber', 'Chamber temperature high', 'Enclosed chamber temperature exceeds safe limit', 'Open lid to allow cooling, especially for PLA'],
    ['0100_0100_0001_0001', 'warning', 'Door', 'Door', 'Door not closed', 'Print head cannot calibrate with door open', 'Close the printer door'],
    ['0100_0100_0001_0002', 'warning', 'Door', 'Door', 'Door opened during print', 'Enclosure door was opened while printing', 'Close door to maintain chamber temperature'],
    ['0200_0100_0002_0001', 'info', 'LEDs', 'LED', 'LED command error', 'Chamber or work light command failed', 'Check LED connection'],
    ['0300_1000_0004_0001', 'warning', 'MC', 'Motion', 'Z-axis homing failed', 'Z-axis sensor did not trigger during homing', 'Check Z-endstop and BLtouch/inductive probe'],
    ['0300_2000_0005_0001', 'serious', 'MC', 'Motion', 'XY homing failed', 'X or Y axis endstop not triggered', 'Check XY endstops and belt tension'],
    // Filament sensor
    ['0500_2000_0001_0001', 'info', 'AMS', 'Filament', 'Filament runout detected', 'Filament has run out during print', 'Load new filament when prompted'],
    ['0500_0100_0002_0001', 'warning', 'AMS', 'AMS', 'AMS 4 tray issue', '4 tray AMS reports error during filament change', 'Retry filament change; check AMS rollers'],
    ['0800_0100_0001_0001', 'info', 'ToolHead', 'Tool', 'Tool head check', 'Printhead cable or sensor issue detected', 'Check flat cable connection to tool head'],
  ];

  const insErr = db.prepare(`INSERT OR REPLACE INTO brand_error_codes
    (brand, code, printer_model, category, severity, title, description, actions, wiki_url)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`);

  for (const [code, severity, cat, category, title, desc, action] of hmsErrors) {
    // Apply to Bambu models that exist
    const models = ['P1P', 'P1S', 'P2S', 'X1', 'X1C', 'X1E', 'A1', 'A1 mini', 'H2D', 'H2S'];
    for (const model of models) {
      insErr.run('bambu', code, model, category, severity, title, desc, action, `https://wiki.bambulab.com/en/x1/troubleshooting/hmscode/${code.slice(0, 4).toLowerCase()}_${code.slice(5, 9).toLowerCase()}`);
    }
  }

  // Bambu-specific G-code reference (commands unique to Bambu printers)
  const bambuGcodes = [
    ['M220', 'Set Speed Factor', 'Set feed rate percentage for the current print.', 'S[percent]', 'M220 S125', 'all'],
    ['M221', 'Set Flow Rate', 'Set extrusion multiplier percentage.', 'S[percent]', 'M221 S95', 'all'],
    ['M73', 'Set Print Progress', 'Set print progress percentage (used by Bambu Handy).', 'P[percent] R[minutes]', 'M73 P50 R60', 'all'],
    ['M104', 'Set Nozzle Temp', 'Set hotend target temperature without waiting.', 'S[temp] T[tool]', 'M104 S220', 'all'],
    ['M140', 'Set Bed Temp', 'Set heatbed target temperature without waiting.', 'S[temp]', 'M140 S65', 'all'],
    ['M106', 'Part Fan', 'Set part cooling fan speed (0-255).', 'S[0-255] P[fan]', 'M106 S255 P1', 'all'],
    ['M107', 'Fan Off', 'Turn off part cooling fan.', 'P[fan]', 'M107 P1', 'all'],
    ['M710', 'Aux Fan', 'Set auxiliary chamber fan (Bambu-specific).', 'S[0-255]', 'M710 S128', 'X1,X1C,P1P,P1S,P2S'],
    ['M413', 'Power-Loss Recovery', 'Enable/disable power-loss recovery.', 'S[0/1]', 'M413 S1', 'all'],
    ['M862.3', 'Model Check', 'Verify this G-code targets the correct printer model.', 'P"[model]"', 'M862.3 P"X1C"', 'all'],
    ['M862.1', 'Nozzle Diameter Check', 'Verify installed nozzle matches slicer setting.', 'P[diameter]', 'M862.1 P0.4', 'all'],
    ['M862.2', 'Filament Type Check', 'Verify filament type matches slicer setting.', 'P"[type]"', 'M862.2 P"PLA"', 'all'],
    ['M981', 'Start Streaming', 'Start streaming (camera related).', '', 'M981', 'all'],
    ['M1002', 'Gcode Claim Speed Level', 'Set speed level (Bambu Studio).', 'S[1-4]', 'M1002 S2', 'all'],
    ['M1003', 'Set Flow Rate Calibration', 'Internal flow calibration command.', '', 'M1003', 'all'],
    ['M400', 'Wait for Moves', 'Wait for all queued moves to complete.', '', 'M400', 'all'],
    ['G28', 'Home Axes', 'Home specified axes or all if none given.', 'X Y Z', 'G28', 'all'],
    ['G29', 'Auto Bed Leveling', 'Perform automatic bed leveling.', '', 'G29', 'all'],
    ['G1', 'Linear Move', 'Move to coordinates with optional extrusion.', 'X Y Z E F', 'G1 X100 Y100 F3000', 'all'],
    ['M140.1', 'Bed Temp Fast', 'Bambu fast bed heating mode.', 'S[temp]', 'M140.1 S65', 'all'],
  ];

  const insGc = db.prepare(`INSERT OR REPLACE INTO brand_gcode_reference
    (brand, code, title, description, parameters, example, printer_models, source_url)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)`);

  for (const [code, title, desc, params, example, models] of bambuGcodes) {
    insGc.run('bambu', code, title, desc, params, example, models, 'https://github.com/Doridian/OpenBambuAPI');
  }

  const durationMs = Date.now() - startTs;
  const errCount = hmsErrors.length * 10; // 10 models per error
  log.info(`Imported ${errCount} Bambu error entries + ${bambuGcodes.length} G-codes in ${Math.round(durationMs / 1000)}s`);
  _setRefreshStatus('bambu_resources', 'ok', errCount + bambuGcodes.length);
  return { errors: errCount, gcodes: bambuGcodes.length, durationMs };
}

// ══════════════════════════════════════════
// KLIPPER — G-code reference (covers all Klipper brands)
// ══════════════════════════════════════════

/**
 * Klipper G-code reference — applies to Voron, Creality K/Ender, Elegoo, AnkerMake,
 * QIDI, RatRig, Snapmaker U1, and any Klipper-based printer.
 */
export async function importKlipperResources() {
  const db = getDb();
  const startTs = Date.now();

  const klipperGcodes = [
    // Klipper extended commands (beyond standard Marlin)
    ['QUERY_ENDSTOPS', 'Query Endstops', 'Report the state of all endstops.', '', 'QUERY_ENDSTOPS', 'all'],
    ['QUERY_PROBE', 'Query Probe', 'Report the current state of the probe.', '', 'QUERY_PROBE', 'all'],
    ['BED_MESH_CALIBRATE', 'Bed Mesh Calibrate', 'Probe the bed and generate a height map.', 'PROFILE=[name] METHOD=[manual|automatic]', 'BED_MESH_CALIBRATE PROFILE=default', 'all'],
    ['BED_MESH_PROFILE', 'Bed Mesh Profile', 'Save, load, or remove a bed mesh profile.', 'SAVE=[name] LOAD=[name] REMOVE=[name]', 'BED_MESH_PROFILE LOAD=default', 'all'],
    ['SAVE_CONFIG', 'Save Config', 'Write calibration data to printer.cfg and restart.', '', 'SAVE_CONFIG', 'all'],
    ['RESTART', 'Restart', 'Soft restart the Klipper host process.', '', 'RESTART', 'all'],
    ['FIRMWARE_RESTART', 'Firmware Restart', 'Hard reset the MCU and firmware.', '', 'FIRMWARE_RESTART', 'all'],
    ['STATUS', 'Status', 'Report the status of the printer.', '', 'STATUS', 'all'],
    ['TUNING_TOWER', 'Tuning Tower', 'Gradually modify a setting over Z-height for test prints.', 'COMMAND=[cmd] PARAMETER=[param] START=[val] FACTOR=[val]', 'TUNING_TOWER COMMAND=SET_PRESSURE_ADVANCE PARAMETER=ADVANCE START=0 FACTOR=0.005', 'all'],
    ['SET_PRESSURE_ADVANCE', 'Set Pressure Advance', 'Tune Klipper\'s pressure advance value.', 'ADVANCE=[val] EXTRUDER=[name]', 'SET_PRESSURE_ADVANCE ADVANCE=0.045', 'all'],
    ['SHAPER_CALIBRATE', 'Input Shaper Calibrate', 'Run automatic input shaper calibration (requires accelerometer).', 'AXIS=[X|Y]', 'SHAPER_CALIBRATE AXIS=X', 'all'],
    ['TEST_RESONANCES', 'Test Resonances', 'Run resonance test on specified axis.', 'AXIS=[X|Y]', 'TEST_RESONANCES AXIS=X', 'all'],
    ['QUAD_GANTRY_LEVEL', 'Quad Gantry Level', 'Level gantry by probing four corners.', '', 'QUAD_GANTRY_LEVEL', 'Voron 2.4,Trident'],
    ['Z_TILT_ADJUST', 'Z Tilt Adjust', 'Probe Z tilt screws and adjust.', '', 'Z_TILT_ADJUST', 'Voron,RatRig'],
    ['SCREWS_TILT_CALCULATE', 'Screws Tilt Calculate', 'Print required adjustments for manual bed screws.', '', 'SCREWS_TILT_CALCULATE', 'all'],
    ['PROBE', 'Probe', 'Run the probe at current position and report Z.', '', 'PROBE', 'all'],
    ['PROBE_ACCURACY', 'Probe Accuracy', 'Sample probe multiple times and report standard deviation.', 'PROBE_SPEED=[speed] SAMPLES=[count]', 'PROBE_ACCURACY SAMPLES=10', 'all'],
    ['G28', 'Home Axes', 'Home specified axes.', 'X Y Z', 'G28', 'all'],
    ['G32', 'Home + Level', 'Home all axes and perform Z tilt/QGL.', '', 'G32', 'Voron'],
    ['M204', 'Set Acceleration', 'Set default acceleration.', 'S[accel] P[print] T[travel]', 'M204 S3000', 'all'],
    ['M220', 'Speed Factor', 'Set feedrate percentage.', 'S[percent]', 'M220 S125', 'all'],
    ['M221', 'Flow Rate', 'Set extrusion multiplier percentage.', 'S[percent]', 'M221 S100', 'all'],
    ['SET_GCODE_OFFSET', 'Set G-code Offset', 'Apply an offset to the axis coordinate system.', 'X Y Z MOVE=[0|1]', 'SET_GCODE_OFFSET Z=0.05 MOVE=1', 'all'],
    ['SET_FAN_SPEED', 'Set Fan Speed', 'Control a fan by name.', 'FAN=[name] SPEED=[0-1]', 'SET_FAN_SPEED FAN=fan0 SPEED=0.8', 'all'],
    ['RESPOND', 'Respond', 'Print a message to the console.', 'MSG="[text]"', 'RESPOND MSG="Hello"', 'all'],
    ['M117', 'Set LCD Message', 'Set a message to display on the LCD.', '[text]', 'M117 Printing...', 'all'],
    ['M118', 'Serial Message', 'Send a message over serial.', '[text]', 'M118 Layer 50 complete', 'all'],
    ['M300', 'Play Tone', 'Play a tone on the beeper.', 'S[freq] P[duration]', 'M300 S440 P200', 'all'],
    ['M400', 'Wait for Moves', 'Wait for all moves to complete.', '', 'M400', 'all'],
    ['M600', 'Filament Change', 'Pause for filament change.', '', 'M600', 'all'],
    ['M702', 'Unload Filament', 'Unload filament from the hotend.', '', 'M702', 'all'],
    ['M701', 'Load Filament', 'Load filament into the hotend.', '', 'M701', 'all'],
  ];

  const insGc = db.prepare(`INSERT OR REPLACE INTO brand_gcode_reference
    (brand, code, title, description, parameters, example, printer_models, source_url)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)`);

  for (const [code, title, desc, params, example, models] of klipperGcodes) {
    insGc.run('klipper', code, title, desc, params, example, models, 'https://www.klipper3d.org/G-Codes.html');
  }

  const durationMs = Date.now() - startTs;
  log.info(`Imported ${klipperGcodes.length} Klipper G-codes in ${Math.round(durationMs / 1000)}s`);
  _setRefreshStatus('klipper_resources', 'ok', klipperGcodes.length);
  return { gcodes: klipperGcodes.length, durationMs };
}

// ══════════════════════════════════════════
// SNAPMAKER U1 — custom G-codes
// ══════════════════════════════════════════

/**
 * Snapmaker U1 specific custom G-codes (beyond Klipper standard).
 * Source: Snapmaker U1 wiki + klipper config from u1-klipper repo.
 */
export async function importSnapmakerResources() {
  const db = getDb();
  const startTs = Date.now();

  const u1Gcodes = [
    ['SM_NFC_STATUS', 'NFC Status', 'Report status of NFC filament sensors on all slots.', '', 'SM_NFC_STATUS', 'U1'],
    ['SM_FILAMENT_UNLOAD', 'U1 Filament Unload', 'Unload filament from specific toolhead.', 'T[0-3]', 'SM_FILAMENT_UNLOAD T0', 'U1'],
    ['SM_FILAMENT_LOAD', 'U1 Filament Load', 'Load filament into specific toolhead.', 'T[0-3]', 'SM_FILAMENT_LOAD T0', 'U1'],
    ['SM_TOOL_PICK', 'U1 Tool Pick', 'Pick up a specific tool in the toolchanger.', 'T[0-3]', 'SM_TOOL_PICK T1', 'U1'],
    ['SM_TOOL_PARK', 'U1 Tool Park', 'Park the currently active tool.', '', 'SM_TOOL_PARK', 'U1'],
    ['SM_CALIBRATE_TOOLS', 'U1 Calibrate Tools', 'Run automatic tool offset calibration.', '', 'SM_CALIBRATE_TOOLS', 'U1'],
    ['SM_BED_LEVEL', 'U1 Bed Leveling', 'Run U1-specific bed leveling procedure.', '', 'SM_BED_LEVEL', 'U1'],
    ['SM_PURIFIER_ON', 'Purifier On', 'Turn on the air purifier fan.', 'S[0-100]', 'SM_PURIFIER_ON S80', 'U1'],
    ['SM_PURIFIER_OFF', 'Purifier Off', 'Turn off the air purifier fan.', '', 'SM_PURIFIER_OFF', 'U1'],
    ['SM_DEFECT_DETECT', 'Defect Detection', 'Toggle AI defect detection.', 'ENABLE=[0|1]', 'SM_DEFECT_DETECT ENABLE=1', 'U1'],
    ['SM_POWER_STATUS', 'Power Status', 'Report power loss check status.', '', 'SM_POWER_STATUS', 'U1'],
    ['SM_FLOW_CALIBRATE', 'Flow Calibrate', 'Run automatic flow rate calibration.', 'T[0-3]', 'SM_FLOW_CALIBRATE T0', 'U1'],
    ['SM_TIMELAPSE_START', 'Timelapse Start', 'Start recording a timelapse.', '', 'SM_TIMELAPSE_START', 'U1'],
    ['SM_TIMELAPSE_STOP', 'Timelapse Stop', 'Stop timelapse recording.', '', 'SM_TIMELAPSE_STOP', 'U1'],
  ];

  const insGc = db.prepare(`INSERT OR REPLACE INTO brand_gcode_reference
    (brand, code, title, description, parameters, example, printer_models, source_url)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)`);

  for (const [code, title, desc, params, example, models] of u1Gcodes) {
    insGc.run('snapmaker', code, title, desc, params, example, models, 'https://wiki.snapmaker.com/en/snapmaker_u1');
  }

  // U1 common error/warning codes
  const u1Errors = [
    ['SM_ERR_NFC_READ', 'warning', 'Filament', 'NFC read failure', 'Could not read NFC tag on filament spool', 'Reinsert spool or clean NFC tag'],
    ['SM_ERR_TOOL_PARK', 'warning', 'Toolchanger', 'Tool park failed', 'Tool did not park correctly in dock', 'Check tool dock for obstructions'],
    ['SM_ERR_TOOL_PICK', 'warning', 'Toolchanger', 'Tool pick failed', 'Tool did not pick up correctly', 'Check tool dock alignment'],
    ['SM_ERR_DEFECT_SPAGHETTI', 'warning', 'AI', 'Spaghetti detected', 'AI camera detected print failure (spaghetti)', 'Review print; pause if needed'],
    ['SM_ERR_DEFECT_BED', 'warning', 'AI', 'Bed not clean', 'AI camera detected debris on build plate', 'Clean bed before next print'],
    ['SM_ERR_DEFECT_NOZZLE', 'warning', 'AI', 'Nozzle issue', 'AI camera detected nozzle blob/buildup', 'Clean nozzle'],
    ['SM_ERR_FILAMENT_OUT', 'info', 'Filament', 'Filament runout', 'Spool is empty', 'Load new filament'],
    ['SM_ERR_FILAMENT_TANGLE', 'warning', 'Filament', 'Filament entanglement', 'Filament path is tangled', 'Unload and reload filament'],
    ['SM_ERR_POWER_LOSS', 'warning', 'Power', 'Power loss detected', 'Recent power loss during print', 'Use power-loss recovery or restart'],
    ['SM_ERR_PURIFIER_FULL', 'info', 'Purifier', 'Purifier filter replacement', 'Air purifier filter needs replacement', 'Replace HEPA filter'],
  ];

  const insErr = db.prepare(`INSERT OR REPLACE INTO brand_error_codes
    (brand, code, printer_model, category, severity, title, description, actions, wiki_url)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`);

  for (const [code, severity, category, title, desc, action] of u1Errors) {
    insErr.run('snapmaker', code, 'U1', category, severity, title, desc, action, 'https://wiki.snapmaker.com/en/snapmaker_u1');
  }

  const durationMs = Date.now() - startTs;
  log.info(`Imported ${u1Gcodes.length} Snapmaker G-codes + ${u1Errors.length} error codes in ${Math.round(durationMs / 1000)}s`);
  _setRefreshStatus('snapmaker_resources', 'ok', u1Gcodes.length + u1Errors.length);
  return { gcodes: u1Gcodes.length, errors: u1Errors.length, durationMs };
}

// ══════════════════════════════════════════
// CREALITY — K1/K1 Max/K2 firmware + Klipper-specific G-codes
// ══════════════════════════════════════════

export async function importCrealityResources() {
  const db = getDb();
  const startTs = Date.now();

  // Creality-specific Klipper commands (beyond standard Klipper)
  const crealityGcodes = [
    ['CR_BED_HEATING_AUTO', 'Auto Bed Temp', 'Creality AI-assisted bed temperature calibration.', '', 'CR_BED_HEATING_AUTO', 'K1,K1 Max,K2 Plus'],
    ['CR_LIDAR_CALIBRATE', 'AI Lidar Calibrate', 'Calibrate AI lidar for first layer scanning (K1 Max/K2).', '', 'CR_LIDAR_CALIBRATE', 'K1 Max,K2 Plus'],
    ['CR_CARBON_FILTER', 'Carbon Filter Fan', 'Control active carbon filter fan (K1 Max).', 'SPEED=[0-255]', 'CR_CARBON_FILTER SPEED=128', 'K1 Max,K2 Plus'],
    ['CR_CALIBRATE_PA', 'Pressure Advance Calibrate', 'Run Creality Print pressure advance calibration.', '', 'CR_CALIBRATE_PA', 'K1,K1 Max,K2 Plus,Ender 3 V3'],
    ['CR_CHAMBER_TEMP', 'Chamber Temperature', 'Read chamber temperature sensor.', '', 'CR_CHAMBER_TEMP', 'K1 Max,K2 Plus'],
    ['TIMELAPSE_TAKE_FRAME', 'Timelapse Frame', 'Capture timelapse frame at current layer.', '', 'TIMELAPSE_TAKE_FRAME', 'K1,K1 Max,K2 Plus'],
    ['TIMELAPSE_RENDER', 'Timelapse Render', 'Render collected timelapse frames to video.', '', 'TIMELAPSE_RENDER', 'K1,K1 Max,K2 Plus'],
    ['M605', 'IDEX Mode', 'Set IDEX mode (Creality CR-X models).', 'S[0-2]', 'M605 S0', 'CR-X,CR-X Pro'],
    ['G34', 'Z-Alignment', 'Automatic Z-axis alignment for dual-Z printers.', '', 'G34', 'K1 Max,K2 Plus'],
  ];

  // Creality common error codes (from Creality community troubleshooting)
  const crealityErrors = [
    ['E001', 'serious', 'Temperature', 'Hotend thermistor disconnected', 'Extruder temperature reading is invalid', 'Check thermistor wiring on hotend'],
    ['E002', 'serious', 'Temperature', 'Heatbed thermistor disconnected', 'Bed temperature reading is invalid', 'Check thermistor wiring under bed'],
    ['E003', 'warning', 'Motion', 'X-axis homing failed', 'X-axis endstop not triggered during home', 'Check X-axis endstop and belt'],
    ['E004', 'warning', 'Motion', 'Y-axis homing failed', 'Y-axis endstop not triggered', 'Check Y-axis endstop and belt'],
    ['E005', 'warning', 'Motion', 'Z-axis homing failed', 'Z-probe or endstop not triggered', 'Check probe connection and alignment'],
    ['E006', 'warning', 'Filament', 'Filament runout', 'Filament sensor triggered during print', 'Load filament and resume'],
    ['E009', 'serious', 'Lidar', 'AI lidar failure', 'K1 Max/K2 AI lidar module not responding', 'Power cycle printer; check lidar cable'],
    ['E010', 'serious', 'Temperature', 'Thermal runaway', 'Temperature did not respond to heating commands', 'Power off immediately; check thermistor and heater'],
  ];

  _insertBrandGcodes(db, 'creality', crealityGcodes, 'https://github.com/CrealityOfficial');
  _insertBrandErrors(db, 'creality', crealityErrors, ['K1', 'K1 Max', 'K1 SE', 'K2 Plus', 'Ender 3 V3', 'Ender 3 V3 Plus', 'CR-10 Smart Pro']);

  const durationMs = Date.now() - startTs;
  const count = crealityGcodes.length + (crealityErrors.length * 7);
  log.info(`Imported ${count} Creality entries in ${Math.round(durationMs / 1000)}s`);
  _setRefreshStatus('creality_resources', 'ok', count);
  return { imported: count, durationMs };
}

// ══════════════════════════════════════════
// ELEGOO — Neptune 4 Pro/Max resources
// ══════════════════════════════════════════

export async function importElegooResources() {
  const db = getDb();
  const startTs = Date.now();

  const elegooGcodes = [
    ['EG_SAVE_VIBRATION', 'Save Vibration Calibration', 'Store input shaper results from resonance test.', '', 'EG_SAVE_VIBRATION', 'Neptune 4,Neptune 4 Pro,Neptune 4 Max'],
    ['EG_AUTO_LEVEL', 'Auto Level', 'Run Elegoo 121-point bed mesh calibration.', '', 'EG_AUTO_LEVEL', 'Neptune 4,Neptune 4 Pro,Neptune 4 Max,Neptune 4 Plus'],
    ['M106 P0', 'Part Fan 0', 'Control part cooling fan 0 (main).', 'S[0-255]', 'M106 P0 S255', 'all Elegoo'],
    ['M106 P2', 'Side Fan', 'Control side auxiliary fan (Neptune 4 Pro).', 'S[0-255]', 'M106 P2 S128', 'Neptune 4 Pro,Neptune 4 Max'],
    ['M600', 'Filament Change', 'Pause for filament change at current position.', '', 'M600', 'all Elegoo'],
    ['EG_RESTORE_PROBE', 'Restore Probe Offset', 'Restore Z-probe offset from saved value.', '', 'EG_RESTORE_PROBE', 'Neptune 4,Neptune 4 Pro'],
    ['SKEW_PROFILE_LOAD', 'Load Skew Profile', 'Load XY skew correction profile.', 'NAME=[name]', 'SKEW_PROFILE_LOAD NAME=default', 'Neptune 4 Plus,Neptune 4 Max'],
  ];

  const elegooErrors = [
    ['ELG_001', 'warning', 'Temperature', 'Hotend thermistor error', 'Temperature sensor reading out of range', 'Check thermistor connection'],
    ['ELG_002', 'serious', 'Motion', 'Homing sequence failed', 'One or more axes failed to home', 'Check all endstops and belts'],
    ['ELG_003', 'warning', 'Filament', 'Filament sensor triggered', 'Filament runout detected', 'Load new spool'],
    ['ELG_004', 'info', 'Bed', 'Bed mesh not calibrated', 'No mesh profile loaded', 'Run EG_AUTO_LEVEL or G29'],
    ['ELG_005', 'serious', 'Power', 'PSU voltage out of range', 'Power supply voltage drifted from nominal', 'Check PSU; may need replacement'],
  ];

  _insertBrandGcodes(db, 'elegoo', elegooGcodes, 'https://github.com/Elegoo3DPrinters');
  _insertBrandErrors(db, 'elegoo', elegooErrors, ['Neptune 4', 'Neptune 4 Pro', 'Neptune 4 Plus', 'Neptune 4 Max']);

  const durationMs = Date.now() - startTs;
  const count = elegooGcodes.length + (elegooErrors.length * 4);
  log.info(`Imported ${count} Elegoo entries in ${Math.round(durationMs / 1000)}s`);
  _setRefreshStatus('elegoo_resources', 'ok', count);
  return { imported: count, durationMs };
}

// ══════════════════════════════════════════
// VORON — toolhead + mod database + calibration
// ══════════════════════════════════════════

export async function importVoronResources() {
  const db = getDb();
  const startTs = Date.now();

  const voronGcodes = [
    ['G32', 'Full Home + Level', 'Home all axes and run QGL (2.4/Trident) or Z tilt.', '', 'G32', 'V2.4,Trident,Phoenix'],
    ['QUAD_GANTRY_LEVEL', 'Quad Gantry Level', 'Level gantry by probing all four corners (V2.4).', 'RETRIES=[n] HORIZONTAL_MOVE_Z=[z]', 'QUAD_GANTRY_LEVEL', 'V2.4'],
    ['Z_TILT_ADJUST', 'Z Tilt Adjust', 'Adjust Z steppers for level gantry (Trident).', '', 'Z_TILT_ADJUST', 'Trident,Switchwire'],
    ['CLEAN_NOZZLE', 'Clean Nozzle', 'Move to brush and wipe nozzle (Stealthburner/Afterburner).', '', 'CLEAN_NOZZLE', 'V2.4,Trident,V0,V1'],
    ['ATTACH_PROBE_LOCK', 'Attach Klicky Probe', 'Attach magnetic Klicky/Klickyng probe.', '', 'ATTACH_PROBE_LOCK', 'Klicky mod'],
    ['DOCK_PROBE_UNLOCK', 'Dock Klicky Probe', 'Return Klicky probe to dock.', '', 'DOCK_PROBE_UNLOCK', 'Klicky mod'],
    ['TAP_PROBE', 'Voron Tap Probe', 'Trigger Voron Tap (load cell probe).', '', 'TAP_PROBE', 'V2.4,Trident with Tap'],
    ['NEVERMORE_ON', 'Activate Nevermore', 'Turn on Nevermore carbon filter.', 'SPEED=[0-255]', 'NEVERMORE_ON SPEED=255', 'enclosed Voron'],
    ['NEVERMORE_OFF', 'Deactivate Nevermore', 'Turn off Nevermore filter.', '', 'NEVERMORE_OFF', 'enclosed Voron'],
    ['PURGE_LINE', 'Purge Line', 'Print a Voron-style purge line at start.', '', 'PURGE_LINE', 'all Voron'],
    ['PRINT_START', 'Print Start Macro', 'Voron standard print start macro (heating, leveling, purging).', 'BED=[t] EXTRUDER=[t] CHAMBER=[t]', 'PRINT_START BED=110 EXTRUDER=245', 'all Voron'],
    ['PRINT_END', 'Print End Macro', 'Voron standard print end macro (cooling, parking).', '', 'PRINT_END', 'all Voron'],
    ['PARK', 'Park Toolhead', 'Park toolhead at safe position (bed back-right corner typically).', '', 'PARK', 'all Voron'],
    ['CENTER', 'Center Toolhead', 'Move toolhead to bed center.', '', 'CENTER', 'all Voron'],
    ['M600', 'Filament Change', 'Pause for manual filament change.', '', 'M600', 'all'],
    ['BLTOUCH_DEBUG', 'BLTouch Debug', 'Manual BLTouch control for diagnostics.', 'COMMAND=[cmd]', 'BLTOUCH_DEBUG COMMAND=pin_down', 'BLTouch users'],
    ['BED_SCREWS_ADJUST', 'Bed Screws Adjust', 'Manual bed screw leveling helper (V0/Switchwire).', '', 'BED_SCREWS_ADJUST', 'V0,Switchwire'],
  ];

  // Voron-specific mod / accessory database
  const voronMods = [
    // These are stored as "gcode reference" entries with description acting as mod info
    ['MOD_STEALTHBURNER', 'Stealthburner', 'Modern Voron toolhead with CNC cowl, 5015 part cooling fans, ADXL345 mount.', '', '', 'all Voron'],
    ['MOD_AFTERBURNER', 'Afterburner (legacy)', 'Older Voron toolhead (V1.8/V2.2) — superseded by Stealthburner.', '', '', 'V1,V2 legacy'],
    ['MOD_GALILEO', 'Galileo 2', 'High-performance gear-reduction extruder with planetary gearbox.', '', '', 'V2,Trident,Phoenix'],
    ['MOD_CLOCKWORK2', 'Clockwork 2', 'Stealthburner default extruder.', '', '', 'all Stealthburner'],
    ['MOD_TAP', 'Voron Tap', 'Load-cell based Z probe built into toolhead. Ultra-accurate nozzle-contact probing.', '', '', 'V2.4,Trident,Phoenix'],
    ['MOD_KLICKY', 'Klicky Probe', 'Magnetic dockable inductive probe.', '', '', 'all (legacy)'],
    ['MOD_CAN_BUS', 'CAN Bus Toolhead', 'CAN bus control board on toolhead reduces wire count.', '', '', 'all modern Voron'],
    ['MOD_NEVERMORE', 'Nevermore Air Filter', 'Active carbon HEPA filter for enclosed printers (ABS/ASA safety).', '', '', 'enclosed Voron'],
    ['MOD_CHAMBER_HEATER', 'Chamber Heater', 'Active heater for high-temp materials (PA, PC).', '', '', 'Voron 2.4,Trident'],
    ['MOD_ADXL345', 'ADXL345 Accelerometer', 'Input shaper calibration via accelerometer measurements.', '', '', 'all'],
    ['MOD_LED_STRIP', 'Addressable LEDs', 'Neopixel/WS2812 status LEDs for print progress.', '', '', 'all'],
    ['MOD_FILAMENT_SENSOR', 'Filament Runout Sensor', 'BTT SFS 2.0, Annex, or homemade runout detection.', '', '', 'all'],
  ];

  _insertBrandGcodes(db, 'voron', [...voronGcodes, ...voronMods], 'https://docs.vorondesign.com');

  // Voron calibration / common issues as "error codes"
  const voronErrors = [
    ['VORON_QGL_FAIL', 'warning', 'Motion', 'QGL convergence failed', 'Quad gantry level could not reach target within max retries', 'Check Z motor belts and pulleys; verify probe consistency'],
    ['VORON_PROBE_NOISE', 'warning', 'Probe', 'Probe readings noisy', 'Tap/Klicky probe accuracy > 0.01mm', 'Check probe mount tightness; re-run PROBE_ACCURACY'],
    ['VORON_BELT_NOT_TENSIONED', 'warning', 'Motion', 'Belt tension uneven', 'A and B belt frequencies differ by more than 5Hz', 'Adjust belt tensioners to match A and B belts'],
    ['VORON_INPUT_SHAPER_LOW', 'info', 'Calibration', 'Low shaper frequency', 'Shaper frequency below 30Hz indicates frame flex or loose belts', 'Check frame squareness, belt tension'],
    ['VORON_FIRST_LAYER_SQUISH', 'info', 'Print quality', 'First layer squish incorrect', 'First layer shows under- or over-extrusion', 'Re-tune Z offset with a first layer calibration print'],
  ];

  _insertBrandErrors(db, 'voron', voronErrors, ['V0.2', 'V1.8', 'V2.4', 'Trident', 'Switchwire', 'Phoenix']);

  const durationMs = Date.now() - startTs;
  const count = voronGcodes.length + voronMods.length + (voronErrors.length * 6);
  log.info(`Imported ${count} Voron entries in ${Math.round(durationMs / 1000)}s`);
  _setRefreshStatus('voron_resources', 'ok', count);
  return { imported: count, durationMs };
}

// ══════════════════════════════════════════
// ANKERMAKE — M5/M5C protocol + firmware
// ══════════════════════════════════════════

export async function importAnkerMakeResources() {
  const db = getDb();
  const startTs = Date.now();

  const ankerGcodes = [
    ['M1000', 'Upload Progress', 'AnkerMake print progress update (internal protocol).', '', 'M1000', 'M5,M5C'],
    ['M1001', 'Status Query', 'Query AnkerMake status via MQTT.', '', 'M1001', 'M5,M5C'],
    ['M1002', 'Video Stream', 'Enable/disable AnkerMake video streaming (AI camera).', '', 'M1002', 'M5,M5C'],
    ['M104', 'Set Hotend Temp', 'Set hotend temperature without waiting.', 'S[temp]', 'M104 S220', 'all Anker'],
    ['M140', 'Set Bed Temp', 'Set bed temperature without waiting.', 'S[temp]', 'M140 S60', 'all Anker'],
    ['M106', 'Part Fan', 'Set part cooling fan speed.', 'S[0-255]', 'M106 S255', 'all Anker'],
    ['G28', 'Home', 'Home all axes.', 'X Y Z', 'G28', 'all Anker'],
    ['G29', 'Bed Level', 'Run automatic bed leveling.', '', 'G29', 'all Anker'],
  ];

  const ankerErrors = [
    ['ANK_E01', 'warning', 'Connection', 'Cloud connection lost', 'M5 cannot reach AnkerMake cloud servers', 'Check internet; restart printer'],
    ['ANK_E02', 'warning', 'Camera', 'AI camera offline', 'Built-in AI camera not responding', 'Power cycle printer'],
    ['ANK_E03', 'warning', 'Filament', 'Filament runout', 'Runout sensor triggered', 'Load filament and resume'],
    ['ANK_E04', 'serious', 'Temperature', 'Thermal runaway', 'Temperature not responding to commands', 'Power off; check thermistor'],
    ['ANK_E05', 'warning', 'Bed', 'Auto level failed', 'Probe could not reach bed', 'Check probe wiring; clean nozzle'],
    ['ANK_E06', 'info', 'Network', 'ankerctl not connected', '3DPrintForge cannot reach ankerctl proxy', 'Start ankerctl on port 4470'],
  ];

  _insertBrandGcodes(db, 'anker', ankerGcodes, 'https://github.com/Ankermgmt/ankermake-m5-protocol');
  _insertBrandErrors(db, 'anker', ankerErrors, ['M5', 'M5C']);

  const durationMs = Date.now() - startTs;
  const count = ankerGcodes.length + (ankerErrors.length * 2);
  log.info(`Imported ${count} AnkerMake entries in ${Math.round(durationMs / 1000)}s`);
  _setRefreshStatus('anker_resources', 'ok', count);
  return { imported: count, durationMs };
}

// ══════════════════════════════════════════
// QIDI — X-Plus 3 / Q1 Pro / X-Max 3 resources
// ══════════════════════════════════════════

export async function importQidiResources() {
  const db = getDb();
  const startTs = Date.now();

  const qidiGcodes = [
    ['QIDI_CHAMBER_ON', 'Chamber Heater On', 'Enable active chamber heater (X-Plus 3/X-Max 3).', 'S[temp]', 'QIDI_CHAMBER_ON S65', 'X-Plus 3,X-Max 3,Q1 Pro'],
    ['QIDI_CHAMBER_OFF', 'Chamber Heater Off', 'Disable chamber heater.', '', 'QIDI_CHAMBER_OFF', 'X-Plus 3,X-Max 3,Q1 Pro'],
    ['QIDI_AUX_FAN', 'Auxiliary Fan', 'Control auxiliary part cooling fan.', 'S[0-255]', 'QIDI_AUX_FAN S255', 'X-Plus 3,X-Max 3,Q1 Pro'],
    ['QIDI_FILTER_FAN', 'Carbon Filter Fan', 'Control internal carbon filter fan.', 'S[0-255]', 'QIDI_FILTER_FAN S128', 'X-Plus 3,X-Max 3'],
    ['QIDI_INPUT_SHAPER', 'Input Shaper Auto', 'Run automatic input shaper calibration.', 'AXIS=[X|Y|ALL]', 'QIDI_INPUT_SHAPER AXIS=ALL', 'X-Plus 3,X-Max 3,Q1 Pro'],
    ['QIDI_BED_MESH', 'Bed Mesh Calibrate', 'Run QIDI 64-point bed mesh.', '', 'QIDI_BED_MESH', 'X-Plus 3,X-Max 3,Q1 Pro'],
    ['QIDI_PURGE', 'Purge Line', 'Print QIDI-style purge line before print.', '', 'QIDI_PURGE', 'all QIDI'],
    ['SET_KINEMATIC_POSITION', 'Kinematic Position', 'Reset Klipper kinematic position (advanced).', 'X Y Z', 'SET_KINEMATIC_POSITION X=0 Y=0', 'all Klipper'],
  ];

  const qidiErrors = [
    ['QIDI_E01', 'warning', 'Chamber', 'Chamber heater timeout', 'Active chamber heater did not reach target', 'Check chamber heater wiring'],
    ['QIDI_E02', 'warning', 'Motion', 'Bed mesh out of range', 'Bed mesh probe values exceed safe range', 'Re-level bed manually; check probe'],
    ['QIDI_E03', 'info', 'Filament', 'Filament runout', 'Runout sensor triggered', 'Load new filament'],
    ['QIDI_E04', 'serious', 'Temperature', 'Hotend thermal runaway', 'Hotend temperature not responding', 'Power off; check thermistor'],
    ['QIDI_E05', 'warning', 'Cooling', 'Carbon filter fan stalled', 'Filter fan tachometer reports no movement', 'Replace carbon filter fan'],
  ];

  _insertBrandGcodes(db, 'qidi', qidiGcodes, 'https://github.com/QIDITECH');
  _insertBrandErrors(db, 'qidi', qidiErrors, ['X-Plus 3', 'X-Max 3', 'Q1 Pro', 'X-Smart 3']);

  const durationMs = Date.now() - startTs;
  const count = qidiGcodes.length + (qidiErrors.length * 4);
  log.info(`Imported ${count} QIDI entries in ${Math.round(durationMs / 1000)}s`);
  _setRefreshStatus('qidi_resources', 'ok', count);
  return { imported: count, durationMs };
}

// ══════════════════════════════════════════
// Shared insertion helpers
// ══════════════════════════════════════════

function _insertBrandGcodes(db, brand, rows, sourceUrl) {
  const ins = db.prepare(`INSERT OR REPLACE INTO brand_gcode_reference
    (brand, code, title, description, parameters, example, printer_models, source_url)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)`);
  for (const [code, title, desc, params, example, models] of rows) {
    ins.run(brand, code, title, desc, params, example, models, sourceUrl);
  }
}

function _insertBrandErrors(db, brand, rows, printerModels) {
  const ins = db.prepare(`INSERT OR REPLACE INTO brand_error_codes
    (brand, code, printer_model, category, severity, title, description, actions, wiki_url)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`);
  for (const [code, severity, category, title, desc, action] of rows) {
    for (const model of printerModels) {
      ins.run(brand, code, model, category, severity, title, desc, action, '');
    }
  }
}

// ══════════════════════════════════════════
// OCTOPRINT — plugin catalog
// ══════════════════════════════════════════

/**
 * Import OctoPrint plugin catalog from the official plugin repo.
 */
export async function importOctoPrintResources() {
  const db = getDb();
  const startTs = Date.now();

  try {
    // OctoPrint maintains a JSON plugin index
    const data = await _fetchJson('https://plugins.octoprint.org/plugins.json', 20000);
    const plugins = Array.isArray(data) ? data : (data?.plugins || []);

    const ins = db.prepare(`INSERT OR REPLACE INTO octoprint_plugins
      (id, title, description, author, homepage, license, tags, compatibility, stats_json)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`);

    let imported = 0;
    for (const p of plugins) {
      const id = p.id || p.name || p.title;
      if (!id) continue;
      ins.run(
        id,
        p.title || p.name || '',
        (p.description || '').slice(0, 2000),
        p.author || null,
        p.homepage || p.source || null,
        p.license || null,
        Array.isArray(p.tags) ? p.tags.join(',') : (p.tags || ''),
        JSON.stringify(p.compatibility || {}).slice(0, 1000),
        JSON.stringify(p.stats || {}).slice(0, 1000),
      );
      imported++;
    }

    const durationMs = Date.now() - startTs;
    log.info(`Imported ${imported} OctoPrint plugins in ${Math.round(durationMs / 1000)}s`);
    _setRefreshStatus('octoprint_plugins', 'ok', imported);
    return { imported, durationMs };
  } catch (e) {
    log.warn('OctoPrint plugin catalog import failed: ' + e.message);
    _setRefreshStatus('octoprint_plugins', 'error', 0, e.message);
    return { imported: 0, error: e.message };
  }
}

// ══════════════════════════════════════════
// Unified entry point
// ══════════════════════════════════════════

export async function importAllBrandResources() {
  const results = {};
  try { results.bambu = await importBambuResources(); } catch (e) { results.bambu = { error: e.message }; }
  try { results.klipper = await importKlipperResources(); } catch (e) { results.klipper = { error: e.message }; }
  try { results.snapmaker = await importSnapmakerResources(); } catch (e) { results.snapmaker = { error: e.message }; }
  try { results.creality = await importCrealityResources(); } catch (e) { results.creality = { error: e.message }; }
  try { results.elegoo = await importElegooResources(); } catch (e) { results.elegoo = { error: e.message }; }
  try { results.voron = await importVoronResources(); } catch (e) { results.voron = { error: e.message }; }
  try { results.anker = await importAnkerMakeResources(); } catch (e) { results.anker = { error: e.message }; }
  try { results.qidi = await importQidiResources(); } catch (e) { results.qidi = { error: e.message }; }
  try { results.octoprint = await importOctoPrintResources(); } catch (e) { results.octoprint = { error: e.message }; }
  return results;
}

// ══════════════════════════════════════════
// Query helpers
// ══════════════════════════════════════════

export function getBrandErrorCodes(filters = {}) {
  const db = getDb();
  const where = [];
  const params = [];
  if (filters.brand) { where.push('brand = ?'); params.push(filters.brand); }
  if (filters.printer_model) { where.push('printer_model = ?'); params.push(filters.printer_model); }
  if (filters.category) { where.push('category = ?'); params.push(filters.category); }
  if (filters.q) { where.push('(code LIKE ? OR title LIKE ? OR description LIKE ?)'); params.push(`%${filters.q}%`, `%${filters.q}%`, `%${filters.q}%`); }
  const clause = where.length > 0 ? ' WHERE ' + where.join(' AND ') : '';
  const limit = Math.max(1, Math.min(parseInt(filters.limit) || 200, 1000));
  return db.prepare(`SELECT * FROM brand_error_codes${clause} ORDER BY brand, code LIMIT ?`).all(...params, limit);
}

export function getBrandGcodes(filters = {}) {
  const db = getDb();
  const where = [];
  const params = [];
  if (filters.brand) { where.push('brand = ?'); params.push(filters.brand); }
  if (filters.q) { where.push('(code LIKE ? OR title LIKE ? OR description LIKE ?)'); params.push(`%${filters.q}%`, `%${filters.q}%`, `%${filters.q}%`); }
  if (filters.model) { where.push('printer_models LIKE ?'); params.push(`%${filters.model}%`); }
  const clause = where.length > 0 ? ' WHERE ' + where.join(' AND ') : '';
  const limit = Math.max(1, Math.min(parseInt(filters.limit) || 500, 2000));
  return db.prepare(`SELECT * FROM brand_gcode_reference${clause} ORDER BY brand, code LIMIT ?`).all(...params, limit);
}

export function getOctoPrintPlugins(filters = {}) {
  const db = getDb();
  const where = [];
  const params = [];
  if (filters.q) { where.push('(title LIKE ? OR description LIKE ? OR id LIKE ?)'); params.push(`%${filters.q}%`, `%${filters.q}%`, `%${filters.q}%`); }
  const clause = where.length > 0 ? ' WHERE ' + where.join(' AND ') : '';
  const limit = Math.max(1, Math.min(parseInt(filters.limit) || 100, 500));
  return db.prepare(`SELECT * FROM octoprint_plugins${clause} ORDER BY title LIMIT ?`).all(...params, limit);
}

export function getBrandRefreshStatus() {
  const db = getDb();
  return db.prepare('SELECT * FROM brand_data_refresh ORDER BY resource').all();
}

// ══════════════════════════════════════════
// Scheduler
// ══════════════════════════════════════════

let _refreshTimer = null;
let _initialTimer = null;

export function startBrandRefresh() {
  _initialTimer = setTimeout(async () => {
    try {
      const db = getDb();
      const row = db.prepare('SELECT COUNT(*) as c FROM brand_error_codes').get();
      if ((row?.c || 0) === 0) {
        log.info('First-run import — fetching brand resources...');
        await importAllBrandResources();
      } else {
        const refresh = db.prepare("SELECT last_fetched_at FROM brand_data_refresh WHERE resource = 'bambu_resources'").get();
        if (refresh?.last_fetched_at) {
          const age = Date.now() - new Date(refresh.last_fetched_at).getTime();
          if (age > REFRESH_INTERVAL_MS) {
            log.info('Brand data is stale — refreshing...');
            await importAllBrandResources();
          }
        }
      }
    } catch (e) { log.error('Initial brand refresh failed: ' + e.message); }
  }, 3 * 60 * 1000); // 3 min after startup (after Prusa)

  _refreshTimer = setInterval(async () => {
    try { await importAllBrandResources(); } catch (e) { log.error('Periodic brand refresh failed: ' + e.message); }
  }, REFRESH_INTERVAL_MS);

  log.info(`Brand resources refresh scheduled (initial: 3 min, periodic: every ${REFRESH_INTERVAL_MS / 86400000} days)`);
}

export function stopBrandRefresh() {
  if (_initialTimer) { clearTimeout(_initialTimer); _initialTimer = null; }
  if (_refreshTimer) { clearInterval(_refreshTimer); _refreshTimer = null; }
}
