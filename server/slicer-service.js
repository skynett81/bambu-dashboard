import { existsSync, mkdirSync, writeFileSync, readFileSync, unlinkSync, statSync, readdirSync } from 'node:fs';
import { join, extname, basename } from 'node:path';
import { execFile } from 'node:child_process';
import { DATA_DIR } from './config.js';
import { addSlicerJob, updateSlicerJob, getSlicerJob } from './database.js';
import { parse3mf, parseGcode } from './file-parser.js';

const UPLOAD_DIR = join(DATA_DIR, 'uploads');
if (!existsSync(UPLOAD_DIR)) mkdirSync(UPLOAD_DIR, { recursive: true });

// Supported slicer CLIs (auto-detected)
const SLICER_PATHS = [
  // OrcaSlicer
  '/usr/bin/orca-slicer',
  '/usr/local/bin/orca-slicer',
  '/opt/OrcaSlicer/orca-slicer',
  // PrusaSlicer
  '/usr/bin/prusa-slicer',
  '/usr/local/bin/prusa-slicer',
  // Flatpak variants
  '/var/lib/flatpak/exports/bin/com.bambulab.OrcaSlicer',
];

let _detectedSlicer = null;

export function detectSlicer() {
  if (_detectedSlicer !== null) return _detectedSlicer;
  // Check env override first
  if (process.env.SLICER_PATH && existsSync(process.env.SLICER_PATH)) {
    _detectedSlicer = { path: process.env.SLICER_PATH, name: basename(process.env.SLICER_PATH) };
    console.log(`[slicer] Found slicer (env): ${_detectedSlicer.path}`);
    return _detectedSlicer;
  }
  for (const p of SLICER_PATHS) {
    if (existsSync(p)) {
      _detectedSlicer = { path: p, name: basename(p) };
      console.log(`[slicer] Found slicer: ${p}`);
      return _detectedSlicer;
    }
  }
  _detectedSlicer = false;
  return false;
}

// Quality presets: layer height + speed modifiers for slicer CLI
const QUALITY_PRESETS = {
  draft:    { label: 'Draft (0.28mm)',    layerHeight: 0.28, infill: 15, speed: 'fast' },
  fast:     { label: 'Fast (0.20mm)',     layerHeight: 0.20, infill: 15, speed: 'fast' },
  normal:   { label: 'Normal (0.16mm)',   layerHeight: 0.16, infill: 20, speed: 'normal' },
  detailed: { label: 'Detailed (0.12mm)', layerHeight: 0.12, infill: 20, speed: 'normal' },
  fine:     { label: 'Fine (0.08mm)',     layerHeight: 0.08, infill: 25, speed: 'slow' },
};

// Detect available slicer profiles from standard install locations
const PROFILE_DIRS = [
  '/usr/share/OrcaSlicer/resources/profiles',
  '/opt/OrcaSlicer/resources/profiles',
  join(process.env.HOME || '', '.config/OrcaSlicer/user'),
  join(process.env.HOME || '', '.config/PrusaSlicer/print'),
];

export function getSlicerProfiles() {
  const profiles = [];
  for (const dir of PROFILE_DIRS) {
    try {
      if (!existsSync(dir)) continue;
      const files = readdirSync(dir).filter(f => f.endsWith('.json') || f.endsWith('.ini'));
      for (const f of files) {
        profiles.push({ name: f.replace(/\.(json|ini)$/, ''), path: join(dir, f), source: dir });
      }
    } catch {}
  }
  return profiles;
}

export function getSlicerStatus() {
  const slicer = detectSlicer();
  return {
    available: !!slicer,
    slicer: slicer ? slicer.name : null,
    path: slicer ? slicer.path : null,
    uploadDir: UPLOAD_DIR,
    supportedFormats: ['.stl', '.3mf', '.obj', '.step'],
    printFormats: ['.3mf', '.gcode', '.gcode.3mf'],
    qualityPresets: Object.entries(QUALITY_PRESETS).map(([k, v]) => ({ id: k, ...v })),
    profiles: getSlicerProfiles().length
  };
}

// Save uploaded file to disk and create a slicer job record
export function saveUploadedFile(filename, buffer, printerId, autoQueue) {
  const ext = extname(filename).toLowerCase();
  const ts = Date.now();
  const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
  const storedName = `${ts}_${safeName}`;
  const storedPath = join(UPLOAD_DIR, storedName);
  writeFileSync(storedPath, buffer);

  const needsSlicing = ['.stl', '.obj', '.step'].includes(ext);
  const status = needsSlicing ? 'pending_slice' : 'ready';

  // Auto-parse 3mf/gcode for weight and time estimates
  let parsed = null;
  if (!needsSlicing) {
    try {
      if (ext === '.3mf') parsed = parse3mf(buffer);
      else if (ext === '.gcode' || ext === '.g') parsed = parseGcode(buffer);
    } catch (e) { console.warn(`[slicer] Auto-parse failed for ${filename}:`, e.message); }
  }

  const jobId = addSlicerJob({
    printer_id: printerId || null,
    original_filename: filename,
    stored_filename: storedName,
    status,
    file_size: buffer.length,
    auto_queue: autoQueue || false,
    estimated_filament_g: parsed?.total_weight_g || null,
    estimated_time_s: parsed?.estimated_time_min ? Math.round(parsed.estimated_time_min * 60) : null
  });

  return { jobId, storedName, storedPath, needsSlicing, status, parsed };
}

// Slice an STL file using detected slicer CLI
export function sliceFile(jobId, options = {}) {
  return new Promise((resolve, reject) => {
    const slicer = detectSlicer();
    if (!slicer) {
      updateSlicerJob(jobId, { status: 'error', error_message: 'No slicer found on system' });
      return reject(new Error('No slicer CLI found'));
    }

    const job = getSlicerJob(jobId);
    if (!job) return reject(new Error('Job not found'));

    const inputPath = join(UPLOAD_DIR, job.stored_filename);
    if (!existsSync(inputPath)) {
      updateSlicerJob(jobId, { status: 'error', error_message: 'Source file missing' });
      return reject(new Error('Source file missing'));
    }

    const outName = job.stored_filename.replace(/\.[^.]+$/, '.3mf');
    const outputPath = join(UPLOAD_DIR, outName);

    updateSlicerJob(jobId, { status: 'slicing', slicer_used: slicer.name });

    // Build CLI args (works for both OrcaSlicer and PrusaSlicer)
    const args = ['--slice', '--export-3mf', outputPath];

    // Apply quality preset overrides
    const preset = options.quality ? QUALITY_PRESETS[options.quality] : null;
    if (preset) {
      args.push('--layer-height', String(preset.layerHeight));
      args.push('--fill-density', String(preset.infill) + '%');
    }

    // Apply custom profile if provided
    if (options.profile) {
      const profiles = getSlicerProfiles();
      const match = profiles.find(p => p.name === options.profile);
      if (match) args.push('--load', match.path);
    }

    // Custom layer height override
    if (options.layerHeight) args.push('--layer-height', String(options.layerHeight));

    args.push(inputPath);

    execFile(slicer.path, args, { timeout: 300000 }, (err, stdout, stderr) => {
      if (err) {
        const msg = stderr?.trim() || err.message;
        updateSlicerJob(jobId, { status: 'error', error_message: msg.substring(0, 500) });
        return reject(new Error(msg));
      }

      // Parse estimate from slicer output if possible
      let estimatedFilament = null;
      let estimatedTime = null;
      const filamentMatch = stdout.match(/filament used\s*[=:]\s*([\d.]+)\s*g/i) || stderr.match(/filament used\s*[=:]\s*([\d.]+)\s*g/i);
      if (filamentMatch) estimatedFilament = parseFloat(filamentMatch[1]);
      const timeMatch = stdout.match(/estimated printing time\s*[=:]\s*(\d+)/i) || stderr.match(/time\s*[=:]\s*(\d+)/i);
      if (timeMatch) estimatedTime = parseInt(timeMatch[1]);

      const fileSize = existsSync(outputPath) ? statSync(outputPath).size : 0;

      updateSlicerJob(jobId, {
        status: 'ready',
        gcode_filename: outName,
        estimated_filament_g: estimatedFilament,
        estimated_time_s: estimatedTime,
        completed_at: new Date().toISOString()
      });

      resolve({ jobId, outputPath, outName, estimatedFilament, estimatedTime, fileSize });
    });
  });
}

// Upload file to printer via FTPS
export async function uploadToPrinter(jobId, printerIp, accessCode) {
  const ftp = await import('basic-ftp').catch(() => null);
  if (!ftp) throw new Error('basic-ftp not available');

  const job = getSlicerJob(jobId);
  if (!job) throw new Error('Job not found');

  const localFile = job.gcode_filename || job.stored_filename;
  const localPath = join(UPLOAD_DIR, localFile);
  if (!existsSync(localPath)) throw new Error('File not found on disk');

  updateSlicerJob(jobId, { status: 'uploading_to_printer' });

  const client = new ftp.Client();
  client.ftp.verbose = false;
  try {
    await client.access({
      host: printerIp, port: 990, user: 'bblp', password: accessCode,
      secure: 'implicit', secureOptions: { rejectUnauthorized: false }
    });
    const remotePath = `/sdcard/${localFile}`;
    await client.uploadFrom(localPath, remotePath);

    updateSlicerJob(jobId, {
      status: 'uploaded',
      completed_at: new Date().toISOString()
    });

    return { remotePath, filename: localFile };
  } catch (e) {
    updateSlicerJob(jobId, { status: 'error', error_message: e.message.substring(0, 500) });
    throw e;
  } finally {
    client.close();
  }
}

// Clean up temporary files for a job
export function cleanupJob(jobId) {
  const job = getSlicerJob(jobId);
  if (!job) return;
  const files = [job.stored_filename, job.gcode_filename].filter(Boolean);
  for (const f of files) {
    const p = join(UPLOAD_DIR, f);
    if (existsSync(p)) try { unlinkSync(p); } catch { /* ignore */ }
  }
}

// Get file path for a job (for download/streaming)
export function getJobFilePath(jobId) {
  const job = getSlicerJob(jobId);
  if (!job) return null;
  const filename = job.gcode_filename || job.stored_filename;
  const p = join(UPLOAD_DIR, filename);
  return existsSync(p) ? p : null;
}
