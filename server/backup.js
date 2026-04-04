import { copyFileSync, existsSync, mkdirSync, readdirSync, unlinkSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { DATA_DIR } from './config.js';
import { createLogger } from './logger.js';

const log = createLogger('backup');

const DB_PATH = join(DATA_DIR, 'dashboard.db');
const BACKUP_DIR = join(DATA_DIR, 'backups');
const MAX_BACKUPS = 7;

export function restoreBackup(filename) {
  const srcPath = join(BACKUP_DIR, filename);
  if (!existsSync(srcPath)) throw new Error('Backup not found');
  if (!filename.endsWith('.db')) throw new Error('Invalid backup file');
  // Create a safety backup before restoring
  createBackup('pre-restore');
  copyFileSync(srcPath, DB_PATH);
  log.info('Database gjenopprettet fra: ' + filename);
  return { restored: filename };
}

export function uploadBackup(buffer, originalName) {
  if (!existsSync(BACKUP_DIR)) mkdirSync(BACKUP_DIR, { recursive: true });
  const safeName = (originalName || 'uploaded.db').replace(/[^a-zA-Z0-9._-]/g, '_');
  const filename = safeName.endsWith('.db') ? safeName : safeName + '.db';
  const destPath = join(BACKUP_DIR, filename);
  writeFileSync(destPath, buffer);
  const stat = statSync(destPath);
  log.info('Backup lastet opp: ' + filename + ' (' + Math.round(stat.size / 1024) + 'KB)');
  return { filename, size: stat.size, created_at: stat.mtime.toISOString() };
}

export function createBackup(label = 'manual') {
  if (!existsSync(BACKUP_DIR)) mkdirSync(BACKUP_DIR, { recursive: true });
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').replace('T', '_').slice(0, 19);
  const filename = `dashboard-${label}-${timestamp}.db`;
  const destPath = join(BACKUP_DIR, filename);
  copyFileSync(DB_PATH, destPath);
  pruneOldBackups();
  const stat = statSync(destPath);
  log.info('Backup opprettet: ' + filename + ' (' + Math.round(stat.size / 1024) + 'KB)');
  return { filename, size: stat.size, created_at: stat.mtime.toISOString() };
}

export function listBackups() {
  if (!existsSync(BACKUP_DIR)) return [];
  return readdirSync(BACKUP_DIR)
    .filter(f => f.endsWith('.db'))
    .map(f => {
      const stat = statSync(join(BACKUP_DIR, f));
      return { filename: f, size: stat.size, created_at: stat.mtime.toISOString() };
    })
    .sort((a, b) => b.created_at.localeCompare(a.created_at));
}

function pruneOldBackups() {
  const backups = listBackups();
  if (backups.length > MAX_BACKUPS) {
    for (const old of backups.slice(MAX_BACKUPS)) {
      try { unlinkSync(join(BACKUP_DIR, old.filename)); } catch (e) { log.debug('Kunne ikke slette gammel backup ' + old.filename + ': ' + e.message); }
    }
  }
}

let _nightlyTimer = null;
export function startNightlyBackup() {
  const msUntil3AM = () => {
    const now = new Date();
    const next = new Date(now);
    next.setHours(3, 0, 0, 0);
    if (next <= now) next.setDate(next.getDate() + 1);
    return next - now;
  };
  const schedule = () => {
    _nightlyTimer = setTimeout(() => {
      try { createBackup('nightly'); }
      catch (e) { log.error('Nightly backup failed: ' + e.message); }
      schedule();
    }, msUntil3AM());
  };
  schedule();
  log.info('Nightly backup enabled (03:00)');
}
