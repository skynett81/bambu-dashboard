/**
 * G-code Post-Processor — pure transform functions.
 *
 * Each operation is a pure function (text, params) → newText so callers
 * can chain them. All operations preserve line endings, comments, and
 * unrelated commands.
 *
 * Operations are dispatched through `applyOps()` so the API can accept
 * a sequence: `[{ op: 'set-bed', value: 60 }, { op: 'speed-mul', factor: 0.8 }]`.
 */

const COMMENT_RX = /;.*$/;

// ── Helpers ─────────────────────────────────────────────────────────────

function _editTokens(line, edits) {
  // edits: { letter: newValue } — replaces tokens or appends new ones.
  // Preserves comment, whitespace, and unrelated tokens.
  const idx = line.indexOf(';');
  const head = idx >= 0 ? line.slice(0, idx) : line;
  const tail = idx >= 0 ? line.slice(idx) : '';

  let out = head;
  for (const [letter, val] of Object.entries(edits)) {
    const rx = new RegExp(`(\\s|^)${letter}(-?\\d+(?:\\.\\d+)?)`, 'i');
    if (rx.test(out)) {
      out = out.replace(rx, (m, p1) => `${p1}${letter}${val}`);
    } else {
      out = out.replace(/\s+$/, '') + ` ${letter}${val}`;
    }
  }
  return out + tail;
}

function _firstCmd(line) {
  const t = line.replace(COMMENT_RX, '').trim();
  if (!t) return null;
  const m = t.match(/^([A-Z]\d+)/i);
  return m ? m[1].toUpperCase() : null;
}

// ── Operations ──────────────────────────────────────────────────────────

/** Replace every M140/M190 S-value with `value`. */
export function setBedTemp(text, params) {
  const v = Math.round(params.value);
  if (!Number.isFinite(v) || v < 0 || v > 200) throw new Error('value out of range');
  return text.split('\n').map(line => {
    const cmd = _firstCmd(line);
    if (cmd === 'M140' || cmd === 'M190') return _editTokens(line, { S: v });
    return line;
  }).join('\n');
}

/** Replace every M104/M109 S-value with `value`. */
export function setHotendTemp(text, params) {
  const v = Math.round(params.value);
  if (!Number.isFinite(v) || v < 0 || v > 320) throw new Error('value out of range');
  return text.split('\n').map(line => {
    const cmd = _firstCmd(line);
    if (cmd === 'M104' || cmd === 'M109') return _editTokens(line, { S: v });
    return line;
  }).join('\n');
}

/** Multiply every F (feedrate) on G0/G1 lines by `factor`. */
export function multiplyFeedrate(text, params) {
  const f = Number(params.factor);
  if (!Number.isFinite(f) || f <= 0 || f > 5) throw new Error('factor out of range');
  return text.split('\n').map(line => {
    const cmd = _firstCmd(line);
    if (cmd !== 'G0' && cmd !== 'G1') return line;
    return line.replace(/(\s|^)F(-?\d+(?:\.\d+)?)/i, (m, p1, val) => `${p1}F${Math.round(parseFloat(val) * f)}`);
  }).join('\n');
}

/** Replace every M106 S-value (fan speed) by multiplying with factor (0..1). */
export function multiplyFanSpeed(text, params) {
  const f = Number(params.factor);
  if (!Number.isFinite(f) || f < 0 || f > 1) throw new Error('factor out of range');
  return text.split('\n').map(line => {
    const cmd = _firstCmd(line);
    if (cmd !== 'M106') return line;
    return line.replace(/(\s|^)S(-?\d+(?:\.\d+)?)/i, (m, p1, val) => {
      const newVal = Math.max(0, Math.min(255, Math.round(parseFloat(val) * f)));
      return `${p1}S${newVal}`;
    });
  }).join('\n');
}

/** Insert M0 (pause) before the layer with the given number. */
export function pauseAtLayer(text, params) {
  const layer = parseInt(params.layer, 10);
  if (!Number.isFinite(layer) || layer < 0) throw new Error('layer out of range');
  const lines = text.split('\n');
  const out = [];
  let inserted = false;
  for (const line of lines) {
    const m = line.match(/;\s*(?:LAYER|layer)\s*[:=]?\s*(\d+)/);
    if (!inserted && m && parseInt(m[1], 10) === layer) {
      out.push(`M0 ; Pause inserted at layer ${layer}`);
      inserted = true;
    }
    out.push(line);
  }
  if (!inserted) throw new Error(`layer ${layer} not found`);
  return out.join('\n');
}

/** Add a `; line N` comment to every command-bearing line. */
export function addLineNumbers(text) {
  let n = 0;
  return text.split('\n').map(line => {
    if (_firstCmd(line)) {
      n++;
      const idx = line.indexOf(';');
      const head = idx >= 0 ? line.slice(0, idx).trimEnd() : line.trimEnd();
      const tail = idx >= 0 ? line.slice(idx) : `; line ${n}`;
      return `${head}  ${tail.startsWith(';') ? tail : `; line ${n}`}`;
    }
    return line;
  }).join('\n');
}

/** Remove all comments. */
export function stripComments(text) {
  return text.split('\n').map(line => {
    const idx = line.indexOf(';');
    return idx >= 0 ? line.slice(0, idx).trimEnd() : line;
  }).filter(l => l.length > 0).join('\n');
}

/** Replace every `T<n>` selector argument according to a mapping. */
export function remapTools(text, params) {
  const map = params.map || {};
  return text.split('\n').map(line => {
    const cmd = _firstCmd(line);
    if (!cmd) return line;
    const m = cmd.match(/^T([0-9])$/);
    if (m && map[m[1]] != null) {
      return line.replace(new RegExp(`^(\\s*)T${m[1]}\\b`), `$1T${map[m[1]]}`);
    }
    // Also remap T-parameters on M104/M109/M218.
    if (cmd === 'M104' || cmd === 'M109' || cmd === 'M218') {
      return line.replace(/(\s|^)T(\d)/i, (full, pre, t) => map[t] != null ? `${pre}T${map[t]}` : full);
    }
    return line;
  }).join('\n');
}

// ── Dispatcher ──────────────────────────────────────────────────────────

const OPS = {
  'set-bed': setBedTemp,
  'set-hotend': setHotendTemp,
  'speed-mul': multiplyFeedrate,
  'fan-mul': multiplyFanSpeed,
  'pause-at-layer': pauseAtLayer,
  'line-numbers': addLineNumbers,
  'strip-comments': stripComments,
  'remap-tools': remapTools,
};

/**
 * Apply a sequence of operations to a G-code text.
 * @param {string} text
 * @param {Array<{op:string, ...}>} ops
 * @returns {string}
 */
export function applyOps(text, ops) {
  if (!Array.isArray(ops)) throw new Error('ops must be an array');
  let out = text;
  for (const op of ops) {
    const fn = OPS[op.op];
    if (!fn) throw new Error(`unknown op: ${op.op}`);
    out = fn(out, op);
  }
  return out;
}

export const _internals = { OPS };
