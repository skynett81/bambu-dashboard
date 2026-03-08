// Milestone Screenshot Service — captures camera frames at 25/50/75/100% print progress
// Uses ffmpeg to grab a single JPEG from the printer's RTSP stream

import { spawn } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync, unlinkSync, renameSync, copyFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, '..', 'data');
const MILESTONE_DIR = join(DATA_DIR, 'milestones');

if (!existsSync(MILESTONE_DIR)) mkdirSync(MILESTONE_DIR, { recursive: true });

const _capturing = new Set();

/**
 * Capture a screenshot from the printer camera via RTSP/ffmpeg
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
    const rtspUrl = `rtsps://bblp:${accessCode}@${printerIp}:322/streaming/live/1`;

    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        ff.kill('SIGKILL');
        reject(new Error('Capture timeout'));
      }, 15000);

      const ff = spawn('ffmpeg', [
        '-rtsp_transport', 'tcp',
        '-i', rtspUrl,
        '-frames:v', '1',
        '-q:v', '2',
        '-y',
        filepath
      ], { stdio: ['ignore', 'ignore', 'ignore'] });

      ff.on('close', (code) => {
        clearTimeout(timeout);
        if (code === 0 && existsSync(filepath)) resolve();
        else reject(new Error(`ffmpeg exit code ${code}`));
      });

      ff.on('error', (err) => {
        clearTimeout(timeout);
        reject(err);
      });
    });

    console.log(`[milestone] Captured ${milestone}% for ${printerId}: ${filename}`);
    _capturing.delete(captureKey);

    return { printerId, milestone, filename, filepath, timestamp: new Date().toISOString(), layer: meta.layer || 0, totalLayers: meta.totalLayers || 0 };
  } catch (e) {
    console.error(`[milestone] Capture failed for ${printerId} at ${milestone}%:`, e.message);
    _capturing.delete(captureKey);
    return null;
  }
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
 * Get milestone file path for serving
 */
export function getMilestoneFile(printerId, filename) {
  const filepath = join(MILESTONE_DIR, printerId, filename);
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

    if (!existsSync(join(MILESTONE_DIR, 'archive'))) mkdirSync(join(MILESTONE_DIR, 'archive'), { recursive: true });
    if (!existsSync(archiveDir)) mkdirSync(archiveDir, { recursive: true });

    for (const f of files) {
      try {
        renameSync(join(printerDir, f), join(archiveDir, f));
      } catch {
        copyFileSync(join(printerDir, f), join(archiveDir, f));
        unlinkSync(join(printerDir, f));
      }
    }
    console.log(`[milestone] Archived ${files.length} screenshots for print #${printHistoryId}`);
    return files.length;
  } catch (e) {
    console.error(`[milestone] Archive failed:`, e.message);
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
 * Get archived milestone file for serving
 */
export function getArchivedMilestoneFile(printHistoryId, filename) {
  const filepath = join(MILESTONE_DIR, 'archive', String(printHistoryId), filename);
  return existsSync(filepath) ? filepath : null;
}
