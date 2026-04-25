/**
 * G-code Linter — rule-based static analysis for 3D printer G-code.
 *
 * Each rule is a pure function (lines, ctx) → issue[] so the rule set is
 * easy to extend, test, and gate behind firmware flavour. Issues are
 * shaped after lint diagnostics:
 *   { severity: 'error'|'warning'|'info', code, message, line, column? }
 *
 * Severity policy:
 *   error   — print would almost certainly fail or damage hardware
 *   warning — quality / safety risk; printer might recover
 *   info    — style / efficiency hint
 *
 * Firmware flavour ('marlin' | 'klipper' | 'reprap' | 'snapmaker' | 'auto')
 * lets us reject Klipper-only macros under Marlin and vice versa.
 */

const FIRMWARE_FLAVOURS = new Set(['marlin', 'klipper', 'reprap', 'snapmaker', 'auto']);

// Rough sanity bounds. Per-printer limits should override.
const MAX_HOTEND_TEMP = 320;
const MAX_BED_TEMP = 130;
const MAX_CHAMBER_TEMP = 80;
const MIN_HOTEND_FOR_EXTRUSION = 150;

// Core grammar — strip comment, then either match a classic G/M command
// (G1, M104) or a Klipper-style identifier (SET_FAN_SPEED, BED_MESH_CALIBRATE).
const COMMENT_RX = /;.*$/;
const CLASSIC_HEAD_RX = /^([A-Z])(-?\d+(?:\.\d+)?)/;
const MACRO_HEAD_RX = /^([A-Z][A-Z0-9_]*)/;
const TOKEN_RX = /([A-Z])(-?\d+(?:\.\d+)?)/g;

export function parseGcodeLine(rawLine) {
  const text = rawLine.replace(COMMENT_RX, '').trim();
  if (!text) return null;

  // Classic numeric command: G1, M104 …
  const classic = text.match(CLASSIC_HEAD_RX);
  if (classic) {
    const cmd = classic[1] + classic[2];
    const tokens = {};
    let m;
    TOKEN_RX.lastIndex = classic[0].length;
    while ((m = TOKEN_RX.exec(text)) !== null) {
      tokens[m[1]] = parseFloat(m[2]);
    }
    return { cmd, tokens, raw: rawLine };
  }

  // Klipper / Snapmaker macro: SET_FAN_SPEED FAN=part SPEED=0.5
  const macro = text.match(MACRO_HEAD_RX);
  if (macro && /^[A-Z_]+/.test(macro[1])) {
    const tokens = {};
    const tail = text.slice(macro[0].length);
    for (const m of tail.matchAll(/([A-Z][A-Z0-9_]*)\s*=\s*("[^"]*"|\S+)/g)) {
      tokens[m[1]] = m[2].replace(/^"|"$/g, '');
    }
    return { cmd: macro[1].toUpperCase(), tokens, raw: rawLine };
  }
  return null;
}

// ── Rule catalogue ──────────────────────────────────────────────────────

function ruleHomingBeforeMove(parsed, ctx) {
  const issues = [];
  for (const p of parsed) {
    if (p.parsed?.cmd === 'G28') ctx.homed = true;
    if (!ctx.homed && /^G[01]$/.test(p.parsed?.cmd)) {
      issues.push({
        severity: 'error',
        code: 'no-homing',
        message: 'First G0/G1 move executed without prior G28 (homing). Risk of crashing the toolhead.',
        line: p.lineNo,
      });
      break; // one is enough
    }
  }
  return issues;
}

function ruleHotendTempBounds(parsed) {
  const issues = [];
  for (const p of parsed) {
    if (!p.parsed) continue;
    const c = p.parsed.cmd;
    if (c !== 'M104' && c !== 'M109') continue;
    const s = p.parsed.tokens.S;
    if (s == null) continue;
    if (s > MAX_HOTEND_TEMP) {
      issues.push({
        severity: 'error',
        code: 'hotend-too-hot',
        message: `Hotend target ${s}°C exceeds the safe ceiling of ${MAX_HOTEND_TEMP}°C.`,
        line: p.lineNo,
      });
    } else if (s < 0) {
      issues.push({
        severity: 'error',
        code: 'hotend-negative',
        message: `Negative hotend temperature ${s}°C is invalid.`,
        line: p.lineNo,
      });
    }
  }
  return issues;
}

function ruleBedTempBounds(parsed) {
  const issues = [];
  for (const p of parsed) {
    if (!p.parsed) continue;
    const c = p.parsed.cmd;
    if (c !== 'M140' && c !== 'M190') continue;
    const s = p.parsed.tokens.S;
    if (s == null) continue;
    if (s > MAX_BED_TEMP) {
      issues.push({
        severity: 'error',
        code: 'bed-too-hot',
        message: `Bed target ${s}°C exceeds ${MAX_BED_TEMP}°C — sensor may melt.`,
        line: p.lineNo,
      });
    }
  }
  return issues;
}

function ruleChamberTempBounds(parsed) {
  const issues = [];
  for (const p of parsed) {
    if (!p.parsed) continue;
    if (p.parsed.cmd !== 'M141' && p.parsed.cmd !== 'M191') continue;
    const s = p.parsed.tokens.S;
    if (s != null && s > MAX_CHAMBER_TEMP) {
      issues.push({
        severity: 'warning',
        code: 'chamber-too-hot',
        message: `Chamber target ${s}°C is above ${MAX_CHAMBER_TEMP}°C — verify printer supports it.`,
        line: p.lineNo,
      });
    }
  }
  return issues;
}

function ruleExtrudeWithoutHeat(parsed, ctx) {
  const issues = [];
  for (const p of parsed) {
    if (!p.parsed) continue;
    const c = p.parsed.cmd;
    if (c === 'M104' || c === 'M109') {
      const s = p.parsed.tokens.S;
      if (s != null) ctx.lastHotend = s;
    }
    if ((c === 'G0' || c === 'G1') && p.parsed.tokens.E !== undefined && p.parsed.tokens.E > 0) {
      if (ctx.lastHotend < MIN_HOTEND_FOR_EXTRUSION) {
        issues.push({
          severity: 'error',
          code: 'cold-extrusion',
          message: `Extrusion at line ${p.lineNo} but hotend last set to ${ctx.lastHotend}°C (minimum ${MIN_HOTEND_FOR_EXTRUSION}°C).`,
          line: p.lineNo,
        });
        break;
      }
    }
  }
  return issues;
}

function ruleExtruderModeMissing(parsed) {
  // Must see M82 (absolute) or M83 (relative) before first extrusion.
  const issues = [];
  let modeSet = false;
  for (const p of parsed) {
    if (!p.parsed) continue;
    if (p.parsed.cmd === 'M82' || p.parsed.cmd === 'M83') { modeSet = true; continue; }
    if ((p.parsed.cmd === 'G0' || p.parsed.cmd === 'G1') && p.parsed.tokens.E != null && !modeSet) {
      issues.push({
        severity: 'warning',
        code: 'no-extruder-mode',
        message: 'First extrusion happens before M82 (absolute) or M83 (relative). Behaviour depends on printer default.',
        line: p.lineNo,
      });
      break;
    }
  }
  return issues;
}

function ruleZHopExcessive(parsed) {
  // Track Z and warn on any single Z+ jump > 5mm during printing (G1 with Z).
  const issues = [];
  let lastZ = null;
  for (const p of parsed) {
    if (!p.parsed) continue;
    const c = p.parsed.cmd;
    if (c !== 'G0' && c !== 'G1') continue;
    const z = p.parsed.tokens.Z;
    if (z == null) continue;
    if (lastZ != null && z - lastZ > 5) {
      issues.push({
        severity: 'warning',
        code: 'excessive-z-hop',
        message: `Z jumped ${(z - lastZ).toFixed(2)}mm in one move (${lastZ}→${z}). Most slicers Z-hop ≤ 1mm.`,
        line: p.lineNo,
      });
    }
    lastZ = z;
  }
  return issues;
}

function ruleRetractFrequency(parsed) {
  // Count G1 with negative E in a 10-line window; warn if >50/sec equivalent.
  const issues = [];
  const window = [];
  let retracts = 0;
  for (const p of parsed) {
    if (!p.parsed) continue;
    if ((p.parsed.cmd === 'G1' || p.parsed.cmd === 'G0') && p.parsed.tokens.E != null && p.parsed.tokens.E < 0) {
      window.push(p.lineNo);
      retracts++;
      while (window.length && p.lineNo - window[0] > 200) window.shift();
      if (window.length > 100) {
        issues.push({
          severity: 'info',
          code: 'high-retract-density',
          message: `Many retracts in a small window (${window.length} in 200 lines). Consider increasing minimum travel for retraction in slicer.`,
          line: p.lineNo,
        });
        break;
      }
    }
  }
  if (retracts === 0 && parsed.length > 1000) {
    issues.push({
      severity: 'info',
      code: 'no-retraction',
      message: 'No retractions detected in a long file. May produce stringing on travel moves.',
      line: 1,
    });
  }
  return issues;
}

function ruleMultiToolSwap(parsed, ctx) {
  // For multi-tool prints (any T0..T9 selector), make sure tool changes are
  // explicit and surrounded by safe state (cool/lift/etc.) — for now we just
  // warn when a T<n> command appears with no companion temperature command
  // within a few lines.
  const issues = [];
  for (let i = 0; i < parsed.length; i++) {
    const p = parsed[i];
    if (!p.parsed) continue;
    const m = p.parsed.cmd.match(/^T([0-9])$/);
    if (!m) continue;
    ctx.usedTools = ctx.usedTools || new Set();
    ctx.usedTools.add(m[1]);
    // Look 10 lines ahead and behind for an M104/M109 with the matching T.
    let hasTempForTool = false;
    for (let j = Math.max(0, i - 10); j < Math.min(parsed.length, i + 10); j++) {
      const q = parsed[j].parsed;
      if (!q) continue;
      if ((q.cmd === 'M104' || q.cmd === 'M109') && q.tokens.T !== undefined && String(q.tokens.T) === m[1]) {
        hasTempForTool = true;
        break;
      }
    }
    if (!hasTempForTool) {
      issues.push({
        severity: 'info',
        code: 'tool-swap-without-temp',
        message: `Tool change to T${m[1]} at line ${p.lineNo} has no nearby M104/M109 T${m[1]} — verify slicer pre-heats before swap.`,
        line: p.lineNo,
      });
    }
  }
  return issues;
}

function ruleFirmwareFlavourSanity(parsed, ctx) {
  // Detect Klipper-only commands inside a file marked as Marlin and vice versa.
  const issues = [];
  if (ctx.firmware === 'auto') return issues;
  const klipperOnly = /^(SET_|BED_MESH_|TEMPERATURE_WAIT|RESPOND|SAVE_VARIABLE|GET_POSITION|FORCE_MOVE)/i;
  const marlinOnly = /^M(108|125|486|600|701|702|710)$/;
  for (const p of parsed) {
    if (!p.parsed) continue;
    if (ctx.firmware === 'marlin' && klipperOnly.test(p.parsed.cmd)) {
      issues.push({
        severity: 'warning',
        code: 'klipper-cmd-in-marlin',
        message: `${p.parsed.cmd} is a Klipper extension. Marlin will reject it.`,
        line: p.lineNo,
      });
    }
    if (ctx.firmware === 'klipper' && marlinOnly.test(p.parsed.cmd) && p.parsed.cmd !== 'M600') {
      issues.push({
        severity: 'info',
        code: 'marlin-cmd-in-klipper',
        message: `${p.parsed.cmd} is a Marlin command without a Klipper equivalent. Verify your klipper config implements it.`,
        line: p.lineNo,
      });
    }
  }
  return issues;
}

const RULES = [
  ruleHomingBeforeMove,
  ruleHotendTempBounds,
  ruleBedTempBounds,
  ruleChamberTempBounds,
  ruleExtrudeWithoutHeat,
  ruleExtruderModeMissing,
  ruleZHopExcessive,
  ruleRetractFrequency,
  ruleMultiToolSwap,
  ruleFirmwareFlavourSanity,
];

/**
 * Lint a G-code file.
 * @param {string} text — raw G-code source
 * @param {object} [opts] — { firmware: 'marlin'|'klipper'|'reprap'|'snapmaker'|'auto' }
 * @returns {{ issues: Array, stats: { lines, commands, layers, tools } }}
 */
export function lintGcode(text, opts = {}) {
  const firmware = FIRMWARE_FLAVOURS.has(opts.firmware) ? opts.firmware : 'auto';
  const ctx = { firmware, homed: false, lastHotend: 0, usedTools: new Set() };

  // Single-pass parse so each rule can iterate without re-tokenising.
  const lines = text.split(/\r?\n/);
  const parsed = lines.map((line, i) => ({
    lineNo: i + 1,
    parsed: parseGcodeLine(line),
  }));

  const issues = [];
  for (const rule of RULES) {
    try {
      const result = rule(parsed, ctx);
      if (Array.isArray(result)) issues.push(...result);
    } catch (e) {
      issues.push({
        severity: 'info',
        code: 'rule-crashed',
        message: `Internal lint rule '${rule.name}' threw: ${e.message}`,
        line: 0,
      });
    }
  }

  // Sort by line then severity (errors first).
  const sevWeight = { error: 0, warning: 1, info: 2 };
  issues.sort((a, b) => (a.line - b.line) || (sevWeight[a.severity] - sevWeight[b.severity]));

  const cmdCount = parsed.filter(p => p.parsed).length;
  // Layer comments are pure comments (no command), so check the raw text
  // of the original line rather than parsed?.raw which is null for those.
  const layerCount = lines.filter(l => /;\s*(LAYER|layer)\s*[:=]\s*\d+/.test(l)).length;

  return {
    issues,
    stats: {
      lines: lines.length,
      commands: cmdCount,
      layers: layerCount,
      tools: Array.from(ctx.usedTools).map(n => `T${n}`),
    },
  };
}

export const _internals = {
  RULES,
  parseGcodeLine,
  FIRMWARE_FLAVOURS,
  MAX_HOTEND_TEMP,
  MAX_BED_TEMP,
  MIN_HOTEND_FOR_EXTRUSION,
};
