/**
 * Slicer Bridge — server-side wrapper that exposes the user's installed
 * desktop slicer (OrcaSlicer / Bambu Studio / Snapmaker Orca) as a
 * headless slicing API.
 *
 * Strategy:
 *   - Probe at startup to discover which slicer binaries are installed
 *     (Flatpak, AppImage, or PATH).
 *   - For each slice request, pick the right slicer based on the
 *     target printer (Bambu printers → Bambu Studio, Snapmaker U1 →
 *     the dedicated Snapmaker Orca AppImage, everything else →
 *     OrcaSlicer).
 *   - Spawn the slicer with --slice 0 and the user's existing profiles
 *     (OrcaSlicer keeps printer/filament/process JSONs under
 *     ~/.var/app/com.orcaslicer.OrcaSlicer/config/...). Capture the
 *     output G-code from --outputdir.
 *   - Return G-code bytes + slicer log + parsed time/filament estimates.
 *
 * Each slicer's CLI is roughly the same:
 *   slicer --slice 0 [--load-settings X.json;Y.json] [--load-filaments Z.json]
 *          --outputdir /tmp/slice-out  model.stl
 */

import { spawn } from 'node:child_process';
import { existsSync, readdirSync, statSync, readFileSync, mkdirSync, rmSync, mkdtempSync, writeFileSync, unlinkSync } from 'node:fs';
import { join, basename, resolve as pathResolve } from 'node:path';
import { homedir, tmpdir } from 'node:os';

import { createLogger } from './logger.js';
const log = createLogger('slicer-bridge');

// ── Slicer discovery ─────────────────────────────────────────────────

const SLICER_DEFINITIONS = [
  {
    id: 'orca',
    label: 'OrcaSlicer',
    flatpak: 'com.orcaslicer.OrcaSlicer',
    flatpakCommand: 'orca-slicer',
    binary: 'orca-slicer',
    profileDir: () => join(homedir(), '.var', 'app', 'com.orcaslicer.OrcaSlicer', 'config', 'OrcaSlicer'),
    versionArgs: ['--help'],
    versionPattern: /OrcaSlicer-([0-9.]+)/,
  },
  {
    id: 'bambu',
    label: 'Bambu Studio',
    flatpak: 'com.bambulab.BambuStudio',
    flatpakCommand: 'bambu-studio',
    binary: 'bambu-studio',
    profileDir: () => join(homedir(), '.var', 'app', 'com.bambulab.BambuStudio', 'config', 'BambuStudio'),
    versionArgs: ['--help'],
    versionPattern: /BambuStudio-([0-9.]+)/,
  },
  {
    id: 'snapmaker-orca',
    label: 'Snapmaker Orca',
    appimage: '/opt/snapmaker-orca-appimage/snapmaker-orca-appimage.AppImage',
    profileDir: () => join(homedir(), '.config', 'SnapmakerOrca'),
    versionArgs: ['--help'],
    versionPattern: /Orca[Ss]licer-([0-9.]+)/,
  },
];

let _detected = null;

/**
 * Probe each slicer. Result is cached for the session — call
 * `_detected = null; await detectSlicers()` if you need to re-probe
 * after install.
 */
export async function detectSlicers() {
  if (_detected) return _detected;
  const out = [];
  for (const def of SLICER_DEFINITIONS) {
    let cmd = null;
    if (def.flatpak) {
      const { code } = await _exec('flatpak', ['info', def.flatpak], 5000);
      if (code === 0) cmd = { kind: 'flatpak', flatpak: def.flatpak, command: def.flatpakCommand };
    }
    if (!cmd && def.appimage && existsSync(def.appimage)) {
      cmd = { kind: 'appimage', path: def.appimage };
    }
    if (!cmd && def.binary) {
      const { code, stdout } = await _exec('which', [def.binary], 5000);
      if (code === 0 && stdout.trim()) cmd = { kind: 'binary', path: stdout.trim() };
    }
    if (!cmd) continue;

    out.push({
      id: def.id,
      label: def.label,
      command: cmd,
      profileDir: def.profileDir(),
      profileDirExists: existsSync(def.profileDir()),
    });
  }
  _detected = out;
  log.info(`Detected ${out.length} slicer(s): ${out.map(s => s.id).join(', ') || 'none'}`);
  return out;
}

function _exec(cmd, args, timeoutMs = 30000) {
  return new Promise(resolve => {
    let stdout = '', stderr = '';
    const child = spawn(cmd, args, { stdio: ['ignore', 'pipe', 'pipe'] });
    let timer = setTimeout(() => { try { child.kill('SIGKILL'); } catch {} }, timeoutMs);
    child.stdout.on('data', d => { stdout += d.toString('utf8'); });
    child.stderr.on('data', d => { stderr += d.toString('utf8'); });
    child.on('close', code => { clearTimeout(timer); resolve({ code, stdout, stderr }); });
    child.on('error', err => { clearTimeout(timer); resolve({ code: -1, stdout, stderr: err.message }); });
  });
}

// ── Slicer selection per printer ────────────────────────────────────

/**
 * Pick the best slicer for a printer. Bambu → Bambu Studio (best
 * profile coverage and AMS handling), Snapmaker U1 → Snapmaker Orca
 * (vendor-tuned), everything else → OrcaSlicer. Falls back to the
 * first available slicer if the preferred one isn't installed.
 */
export async function pickSlicer(printerInfo = {}) {
  const slicers = await detectSlicers();
  if (!slicers.length) return null;
  const model = String(printerInfo.model || '').toLowerCase();
  const type = String(printerInfo.type || '').toLowerCase();

  let preferredId = 'orca';
  if (/bambu|p1[ps]|p2s|x1|a1|h2[dcs]/.test(model) || type === 'bambu') preferredId = 'bambu';
  if (/snapmaker u1/.test(model)) preferredId = 'snapmaker-orca';

  return slicers.find(s => s.id === preferredId) || slicers[0];
}

// ── Profile discovery ──────────────────────────────────────────────

/**
 * List the printer / filament / process profiles available in the
 * picked slicer's config directory. The user maintains these via the
 * desktop slicer UI; we just read them.
 */
export function listProfiles(slicer) {
  if (!slicer || !slicer.profileDirExists) return { printers: [], filaments: [], processes: [] };
  const root = slicer.profileDir;
  return {
    printers:  _listJsonNames(join(root, 'user', 'default', 'machine')).concat(_listJsonNames(join(root, 'printers'))),
    filaments: _listJsonNames(join(root, 'user', 'default', 'filament')).concat(_listJsonNames(join(root, 'filaments'))),
    processes: _listJsonNames(join(root, 'user', 'default', 'process')).concat(_listJsonNames(join(root, 'processes'))),
  };
}

function _listJsonNames(dir) {
  if (!existsSync(dir)) return [];
  try {
    return readdirSync(dir)
      .filter(f => f.endsWith('.json') && !f.startsWith('._'))
      .map(f => ({ file: join(dir, f), name: f.replace(/\.json$/, '') }));
  } catch { return []; }
}

// ── Slicing ─────────────────────────────────────────────────────────

/**
 * Slice an STL/3MF file using the selected slicer.
 *
 * @param {object} args
 * @param {Buffer} args.modelBuffer - STL or 3MF bytes
 * @param {string} args.modelFilename - hint, controls extension on disk
 * @param {object} [args.slicer] - one of the entries from detectSlicers()
 * @param {object} [args.printerInfo] - { model, type } used to auto-pick
 * @param {string} [args.printerProfile] - path to a printer JSON; if not
 *        set, slicer picks its built-in default for the bundled printer
 * @param {string} [args.filamentProfile] - path to filament JSON
 * @param {string} [args.processProfile] - path to process (quality) JSON
 * @returns {Promise<{ ok, gcodeBuffer, gcodeFilename, log, durationMs, settings }>}
 */
export async function sliceModel(args) {
  const slicer = args.slicer || (await pickSlicer(args.printerInfo || {}));
  if (!slicer) return { ok: false, error: 'No slicer available — install OrcaSlicer / Bambu Studio / Snapmaker Orca' };

  const ext = args.modelFilename?.endsWith('.3mf') ? '.3mf' : '.stl';
  const workDir = mkdtempSync(join(tmpdir(), 'slice-'));
  const inputPath = join(workDir, `model${ext}`);
  const outDir = join(workDir, 'out');
  mkdirSync(outDir, { recursive: true });
  writeFileSync(inputPath, args.modelBuffer);

  // Validate that user-supplied profile paths stay inside the slicer's
  // own profile directory — without this, a print-permission user could
  // point the slicer at /etc/passwd or another sensitive file and have
  // the slicer's logs echo back its contents.
  const profileRoot = slicer.profileDir;
  const _safeProfile = (p) => {
    if (!p) return null;
    const resolved = pathResolve(p);
    const boundary = profileRoot.endsWith('/') ? profileRoot : profileRoot + '/';
    if (!resolved.startsWith(boundary)) {
      log.warn(`rejecting profile path outside profileDir: ${p}`);
      return null;
    }
    return resolved;
  };
  const printerProf = _safeProfile(args.printerProfile);
  const processProf = _safeProfile(args.processProfile);
  const filamentProf = _safeProfile(args.filamentProfile);

  // Build CLI args. Most slicers take --slice 0 (all plates), then load
  // settings/filament/process JSONs via --load-settings.
  const settingsParts = [];
  if (printerProf) settingsParts.push(printerProf);
  if (processProf) settingsParts.push(processProf);
  const cliArgs = ['--slice', '0', '--outputdir', outDir];
  if (settingsParts.length) cliArgs.push('--load-settings', settingsParts.join(';'));
  if (filamentProf) cliArgs.push('--load-filaments', filamentProf);
  cliArgs.push(inputPath);

  // Resolve actual command + args based on slicer kind.
  let execCmd, execArgs;
  if (slicer.command.kind === 'flatpak') {
    execCmd = 'flatpak';
    execArgs = ['run', '--command=' + slicer.command.command, slicer.command.flatpak, ...cliArgs];
  } else if (slicer.command.kind === 'appimage') {
    execCmd = slicer.command.path;
    execArgs = cliArgs;
  } else {
    execCmd = slicer.command.path;
    execArgs = cliArgs;
  }

  log.info(`slice → ${slicer.id}: ${execCmd} ${execArgs.slice(0, 4).join(' ')} ...`);
  const start = Date.now();
  const result = await _exec(execCmd, execArgs, 10 * 60 * 1000); // 10 min cap
  const durationMs = Date.now() - start;

  if (result.code !== 0) {
    rmSync(workDir, { recursive: true, force: true });
    return {
      ok: false,
      error: `Slicer exited with code ${result.code}`,
      log: (result.stderr || result.stdout || '').slice(-4000),
      durationMs,
    };
  }

  // Find the produced .gcode file in outDir.
  const produced = readdirSync(outDir)
    .filter(f => f.endsWith('.gcode') || f.endsWith('.gcode.3mf') || f.endsWith('.bgcode'))
    .map(f => ({ name: f, full: join(outDir, f), size: statSync(join(outDir, f)).size }))
    .sort((a, b) => b.size - a.size);

  if (!produced.length) {
    rmSync(workDir, { recursive: true, force: true });
    return {
      ok: false,
      error: 'Slicer ran successfully but no G-code was produced',
      log: (result.stdout || result.stderr || '').slice(-4000),
      durationMs,
    };
  }

  const gcodeBuffer = readFileSync(produced[0].full);
  const gcodeFilename = produced[0].name;
  rmSync(workDir, { recursive: true, force: true });

  return {
    ok: true,
    slicer: slicer.id,
    gcodeBuffer,
    gcodeFilename,
    log: (result.stdout || '').slice(-2000),
    durationMs,
    settings: {
      printerProfile: args.printerProfile ? basename(args.printerProfile) : null,
      filamentProfile: args.filamentProfile ? basename(args.filamentProfile) : null,
      processProfile: args.processProfile ? basename(args.processProfile) : null,
    },
  };
}

export const _internals = { _exec, _listJsonNames, SLICER_DEFINITIONS };
