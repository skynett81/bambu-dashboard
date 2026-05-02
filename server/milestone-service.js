// Milestone Screenshot Service — captures camera frames at 25/50/75/100% print progress
// Strategy: 1) Use live camera frame buffer  2) TLS JPEG capture  3) ffmpeg RTSP fallback

import { spawn } from 'node:child_process';
import { existsSync, mkdirSync, writeFileSync, readdirSync, unlinkSync, renameSync, copyFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { connect as tlsConnect } from 'node:tls';
import { createLogger } from './logger.js';

const log = createLogger('milestone');

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, '..', 'data');
const MILESTONE_DIR = join(DATA_DIR, 'milestones');

if (!existsSync(MILESTONE_DIR)) mkdirSync(MILESTONE_DIR, { recursive: true });

const _capturing = new Set();

// Camera frame provider — set by index.js to access live camera frames
let _frameProvider = null;

/**
 * Register a function that returns the last JPEG frame for a printer.
 * Signature: (printerId) => Buffer | null
 */
export function setFrameProvider(fn) {
  _frameProvider = fn;
}

/**
 * Capture a screenshot from the printer camera.
 * Tries in order: 1) Live frame buffer  2) TLS JPEG port 6000  3) ffmpeg RTSP port 322
 */
export async function captureMilestone(printerId, printerIp, accessCode, milestone, meta = {}) {
  const captureKey = `${printerId}_${milestone}`;
  if (_capturing.has(captureKey)) return null;
  _capturing.add(captureKey);

  const printerDir = join(MILESTONE_DIR, printerId);
  if (!existsSync(printerDir)) mkdirSync(printerDir, { recursive: true });

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `milestone_${milestone}_${timestamp}.jpg`;
  const filepath = join(printerDir, filename);

  try {
    // Strategy 1: Use live camera frame buffer (instant, zero cost)
    if (_frameProvider) {
      const frame = _frameProvider(printerId);
      if (frame && frame.length > 100) {
        writeFileSync(filepath, frame);
        log.info('Captured ' + milestone + '% for ' + printerId + ' via live frame: ' + filename);
        _capturing.delete(captureKey);
        return _buildResult(printerId, milestone, filename, filepath, meta);
      }
    }

    // Strategy 2: TLS JPEG capture via port 6000 (direct, without ffmpeg)
    const tlsFrame = await _captureTlsJpeg(printerIp, accessCode).catch(() => null);
    if (tlsFrame && tlsFrame.length > 100) {
      writeFileSync(filepath, tlsFrame);
      log.info('Captured ' + milestone + '% for ' + printerId + ' via TLS: ' + filename);
      _capturing.delete(captureKey);
      return _buildResult(printerId, milestone, filename, filepath, meta);
    }

    // Strategy 3: ffmpeg RTSP fallback (port 322)
    await _captureRtsp(printerIp, accessCode, filepath);
    log.info('Captured ' + milestone + '% for ' + printerId + ' via RTSP: ' + filename);
    _capturing.delete(captureKey);
    return _buildResult(printerId, milestone, filename, filepath, meta);

  } catch (e) {
    log.warn('Capture failed for ' + printerId + ' at ' + milestone + '%: ' + e.message);
    _capturing.delete(captureKey);
    return null;
  }
}

/**
 * Build milestone result object.
 */
function _buildResult(printerId, milestone, filename, filepath, meta) {
  return {
    printerId,
    milestone,
    filename,
    filepath,
    timestamp: new Date().toISOString(),
    layer: meta.layer || 0,
    totalLayers: meta.totalLayers || 0
  };
}

/**
 * Capture a single JPEG frame via TLS port 6000 (Bambu JPEG protocol).
 * Returns a Buffer with the JPEG data, or throws on failure.
 */
function _captureTlsJpeg(printerIp, accessCode) {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      try { sock.destroy(); } catch (e) { log.debug('Error closing TLS socket on timeout: ' + e.message); }
      reject(new Error('TLS capture timeout'));
    }, 8000);

    let sock;
    try {
      sock = tlsConnect({
        host: printerIp,
        port: 6000,
        rejectUnauthorized: false,
      });
    } catch (e) {
      clearTimeout(timeout);
      reject(e);
      return;
    }

    let buf = Buffer.alloc(0);
    let readState = 'auth_response';
    let payloadSize = 0;
    let gotFrame = false;

    sock.on('secureConnect', () => {
      // Build 80-byte auth packet (same as camera-stream.js)
      const authPacket = Buffer.alloc(80);
      authPacket.writeUInt32LE(0x40, 0);
      authPacket.writeUInt32LE(0x3000, 4);
      authPacket.writeUInt32LE(0, 8);
      authPacket.writeUInt32LE(0, 12);

      const user = Buffer.alloc(32, 0);
      user.write('bblp', 'utf8');
      user.copy(authPacket, 16);

      const pass = Buffer.alloc(32, 0);
      pass.write(accessCode || '', 'utf8');
      pass.copy(authPacket, 48);

      sock.write(authPacket);
    });

    sock.on('data', (chunk) => {
      if (gotFrame) return;
      buf = Buffer.concat([buf, chunk]);

      while (buf.length > 0) {
        if (readState === 'auth_response') {
          if (buf.length < 16) return;
          const pSize = buf.readUInt32LE(0);
          if (buf.length < 16 + pSize) return;

          const payload = buf.subarray(16, 16 + pSize);
          buf = buf.subarray(16 + pSize);

          // Check auth denied
          if (pSize >= 4 && payload.readUInt32LE(0) === 0xFFFFFFFF) {
            clearTimeout(timeout);
            sock.destroy();
            reject(new Error('Auth denied — LAN Live View disabled'));
            return;
          }
          readState = 'header';
          continue;
        }

        if (readState === 'header') {
          if (buf.length < 16) return;
          payloadSize = buf.readUInt32LE(0);
          buf = buf.subarray(16);
          if (payloadSize <= 0 || payloadSize > 10 * 1024 * 1024) {
            clearTimeout(timeout);
            sock.destroy();
            reject(new Error('Invalid payload size: ' + payloadSize));
            return;
          }
          readState = 'payload';
        }

        if (readState === 'payload') {
          if (buf.length < payloadSize) return;
          const frame = buf.subarray(0, payloadSize);

          // Validate JPEG (starts with FFD8)
          if (frame.length > 2 && frame[0] === 0xFF && frame[1] === 0xD8) {
            gotFrame = true;
            clearTimeout(timeout);
            sock.destroy();
            resolve(Buffer.from(frame));
            return;
          }

          // Not a JPEG — skip and try next frame
          buf = buf.subarray(payloadSize);
          readState = 'header';
        }
      }
    });

    sock.on('error', (err) => {
      clearTimeout(timeout);
      reject(err);
    });

    sock.on('close', () => {
      clearTimeout(timeout);
      if (!gotFrame) reject(new Error('TLS connection closed without frame'));
    });
  });
}

/**
 * Capture via ffmpeg RTSP (port 322) — last resort fallback.
 */
function _captureRtsp(printerIp, accessCode, filepath) {
  return new Promise((resolve, reject) => {
    const rtspUrl = `rtsps://bblp:${accessCode}@${printerIp}:322/streaming/live/1`;

    const ff = spawn('ffmpeg', [
      '-rtsp_transport', 'tcp',
      '-stimeout', '8000000',
      '-i', rtspUrl,
      '-frames:v', '1',
      '-q:v', '2',
      '-y',
      filepath
    ], { stdio: ['ignore', 'ignore', 'pipe'] });

    let stderrData = '';
    ff.stderr.on('data', (chunk) => {
      stderrData += chunk.toString();
    });

    const timeout = setTimeout(() => {
      ff.kill('SIGTERM');
      // Give ffmpeg 2s to clean up gracefully before SIGKILL
      setTimeout(() => {
        try { ff.kill('SIGKILL'); } catch (e) { log.debug('Could not kill ffmpeg process: ' + e.message); }
      }, 2000);
    }, 10000);

    ff.on('close', (code) => {
      clearTimeout(timeout);
      if (code === 0 && existsSync(filepath)) {
        resolve();
      } else {
        const reason = stderrData.includes('401') ? 'Authentication rejected'
          : stderrData.includes('Connection refused') ? 'Connection refused'
          : `ffmpeg exited with code ${code}`;
        reject(new Error(reason));
      }
    });

    ff.on('error', (err) => {
      clearTimeout(timeout);
      reject(err);
    });
  });
}

/**
 * Get current session milestones for a printer
 */
export function getMilestones(printerId) {
  const printerDir = join(MILESTONE_DIR, printerId);
  if (!existsSync(printerDir)) return [];

  try {
    return readdirSync(printerDir)
      .filter(f => f.startsWith('milestone_') && f.endsWith('.jpg'))
      .sort()
      .map(f => {
        const match = f.match(/milestone_(\d+)/);
        return { filename: f, milestone: match ? parseInt(match[1]) : 0, url: `/api/milestones/${printerId}/${f}` };
      });
  } catch { return []; }
}

/**
 * Get milestone file path for serving.
 * Path-traversal hardened: rejects any resolved path that escapes MILESTONE_DIR.
 */
export function getMilestoneFile(printerId, filename) {
  const filepath = join(MILESTONE_DIR, printerId, filename);
  const dirBoundary = MILESTONE_DIR.endsWith('/') ? MILESTONE_DIR : MILESTONE_DIR + '/';
  if (!filepath.startsWith(dirBoundary)) return null;
  return existsSync(filepath) ? filepath : null;
}

/**
 * Archive milestones when print completes (move from printer dir to archive/historyId)
 */
export function archivePrintMilestones(printerId, printHistoryId) {
  const printerDir = join(MILESTONE_DIR, printerId);
  if (!existsSync(printerDir)) return 0;

  const archiveDir = join(MILESTONE_DIR, 'archive', String(printHistoryId));

  try {
    const files = readdirSync(printerDir).filter(f => f.startsWith('milestone_') && f.endsWith('.jpg'));
    if (!files.length) return 0;

    mkdirSync(archiveDir, { recursive: true });

    for (const f of files) {
      try {
        renameSync(join(printerDir, f), join(archiveDir, f));
      } catch {
        copyFileSync(join(printerDir, f), join(archiveDir, f));
        unlinkSync(join(printerDir, f));
      }
    }
    log.info('Archived ' + files.length + ' screenshots for print #' + printHistoryId);
    return files.length;
  } catch (e) {
    log.error('Archiving failed: ' + e.message);
    return 0;
  }
}

/**
 * Get archived milestones for a completed print
 */
export function getArchivedMilestones(printHistoryId) {
  const archiveDir = join(MILESTONE_DIR, 'archive', String(printHistoryId));
  if (!existsSync(archiveDir)) return [];

  try {
    return readdirSync(archiveDir)
      .filter(f => f.startsWith('milestone_') && f.endsWith('.jpg'))
      .sort()
      .map(f => {
        const match = f.match(/milestone_(\d+)/);
        return { filename: f, milestone: match ? parseInt(match[1]) : 0, url: `/api/milestones/archive/${printHistoryId}/${f}` };
      });
  } catch { return []; }
}

/**
 * Get archived milestone file for serving.
 * Path-traversal hardened: rejects any resolved path that escapes MILESTONE_DIR.
 */
export function getArchivedMilestoneFile(printHistoryId, filename) {
  const filepath = join(MILESTONE_DIR, 'archive', String(printHistoryId), filename);
  const dirBoundary = MILESTONE_DIR.endsWith('/') ? MILESTONE_DIR : MILESTONE_DIR + '/';
  if (!filepath.startsWith(dirBoundary)) return null;
  return existsSync(filepath) ? filepath : null;
}
