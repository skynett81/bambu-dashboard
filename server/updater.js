// Auto-update system — checks GitHub releases, downloads, backs up, restarts
import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync, rmSync, cpSync } from 'node:fs';
import { join, relative } from 'node:path';
import { execSync, spawn } from 'node:child_process';
import { addUpdateEntry, updateUpdateEntry } from './database.js';
import { ROOT_DIR, DATA_DIR } from './config.js';
import { createLogger } from './logger.js';
const log = createLogger('updater');

const REPO = 'skynett81/3dprintforge';
const API_URL = `https://api.github.com/repos/${REPO}/releases/latest`;
const PRESERVE = new Set(['config.json', 'data', 'certs', 'node_modules', '.git']);
const MAX_BACKUPS = 3;

function compareVersions(a, b) {
  const pa = a.replace(/^v/, '').split('.').map(Number);
  const pb = b.replace(/^v/, '').split('.').map(Number);
  for (let i = 0; i < 3; i++) {
    if ((pa[i] || 0) > (pb[i] || 0)) return 1;
    if ((pa[i] || 0) < (pb[i] || 0)) return -1;
  }
  return 0;
}

export class Updater {
  constructor(config, broadcastFn, notifier, hub) {
    this._config = config?.update || {};
    this._broadcast = broadcastFn;
    this._notifier = notifier;
    this._hub = hub;
    this._timer = null;
    this._initialTimer = null;
    this._updateInProgress = false;

    // Read current version from package.json
    try {
      const pkg = JSON.parse(readFileSync(join(ROOT_DIR, 'package.json'), 'utf-8'));
      this._currentVersion = pkg.version || '0.0.0';
    } catch {
      this._currentVersion = '0.0.0';
    }

    // Cache
    this._cache = {
      lastCheck: null,
      result: null,
      etag: null
    };

    this._environment = this._detectEnvironment();
  }

  get currentVersion() { return this._currentVersion; }

  // ---- Lifecycle ----

  start() {
    const intervalMs = (this._config.checkIntervalHours || 6) * 3600000;
    this._timer = setInterval(() => this.checkForUpdate(), intervalMs);
    this._initialTimer = setTimeout(() => this.checkForUpdate(), 30000);
    log.info(`Auto-check enabled (every ${this._config.checkIntervalHours || 6}h, env: ${this._environment})`);
  }

  stop() {
    if (this._timer) clearInterval(this._timer);
    if (this._initialTimer) clearTimeout(this._initialTimer);
  }

  shutdown() { this.stop(); }

  // ---- Environment ----

  _detectEnvironment() {
    if (existsSync('/.dockerenv')) return 'docker';
    try {
      const cgroup = readFileSync('/proc/1/cgroup', 'utf-8');
      if (cgroup.includes('docker') || cgroup.includes('containerd')) return 'docker';
    } catch { /* not in docker */ }
    if (existsSync(join(ROOT_DIR, '.git'))) return 'git';
    return 'tarball';
  }

  // ---- Check ----

  getStatus() {
    return {
      available: this._cache.result?.available || false,
      current: this._currentVersion,
      latest: this._cache.result?.latest || null,
      changelog: this._cache.result?.changelog || null,
      publishedAt: this._cache.result?.publishedAt || null,
      downloadUrl: this._cache.result?.downloadUrl || null,
      environment: this._environment,
      lastCheck: this._cache.lastCheck,
      inProgress: this._updateInProgress
    };
  }

  async checkForUpdate(force = false) {
    // Return cache if fresh
    const intervalMs = (this._config.checkIntervalHours || 6) * 3600000;
    if (!force && this._cache.lastCheck && (Date.now() - new Date(this._cache.lastCheck).getTime()) < intervalMs) {
      return this.getStatus();
    }

    try {
      const headers = {
        'Accept': 'application/vnd.github+json',
        'User-Agent': '3dprintforge'
      };
      if (this._cache.etag) headers['If-None-Match'] = this._cache.etag;

      // Support private repos via configured GitHub token
      const token = this._config.githubToken || process.env.GITHUB_TOKEN;
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const response = await fetch(API_URL, { headers });

      if (response.status === 304) {
        this._cache.lastCheck = new Date().toISOString();
        return this.getStatus();
      }

      if (response.status === 403) {
        log.warn('GitHub API rate limited');
        return this.getStatus();
      }

      if (!response.ok) {
        log.warn(`GitHub API error: ${response.status}`);
        return this.getStatus();
      }

      const etag = response.headers.get('etag');
      if (etag) this._cache.etag = etag;

      const data = await response.json();
      const latest = (data.tag_name || '').replace(/^v/, '');
      const available = compareVersions(this._currentVersion, latest) < 0;

      this._cache.result = {
        available,
        latest,
        changelog: data.body || '',
        publishedAt: data.published_at || null,
        downloadUrl: data.tarball_url || null
      };
      this._cache.lastCheck = new Date().toISOString();

      if (available) {
        log.info(`New version available: ${latest} (current: ${this._currentVersion})`);
        this._broadcast('update_available', {
          current: this._currentVersion,
          latest,
          changelog: data.body || '',
          publishedAt: data.published_at
        });
        // Notify via channels (Telegram, Discord, etc.)
        if (this._notifier) {
          this._notifier.notify('update_available', {
            current: this._currentVersion,
            latest,
            changelog: data.body || ''
          });
        }
      }

      return this.getStatus();
    } catch (e) {
      log.error('Check failed: ' + e.message);
      return this.getStatus();
    }
  }

  // ---- Apply ----

  isAnyPrinterPrinting() {
    if (!this._hub) return false;
    for (const [, state] of Object.entries(this._hub.printerStates || {})) {
      const gs = state?.print?.gcode_state || state?.gcode_state;
      if (gs === 'RUNNING' || gs === 'PAUSE') return true;
    }
    return false;
  }

  async applyUpdate() {
    if (this._updateInProgress) throw new Error('Update already in progress');
    if (!this._cache.result?.available) throw new Error('No update available');

    const latest = this._cache.result.latest;
    const method = this._environment;

    if (method === 'docker') {
      throw new Error('Docker detected. Run: docker compose pull && docker compose up -d');
    }

    if (this.isAnyPrinterPrinting()) {
      throw new Error('Cannot update while a print is in progress');
    }

    this._updateInProgress = true;
    const startTime = Date.now();
    let entryId;

    try {
      // Record update attempt
      entryId = addUpdateEntry({
        from_version: this._currentVersion,
        to_version: latest,
        method,
        status: 'started'
      });

      // Backup
      this._broadcast('update_status', { stage: 'backing_up' });
      const backupPath = this._createBackup();
      if (entryId) updateUpdateEntry(entryId, 'backing_up', null, null);

      // Download & apply
      this._broadcast('update_status', { stage: 'downloading' });

      if (method === 'git') {
        await this._applyGit(latest);
      } else {
        await this._applyTarball(latest);
      }

      // Success
      const durationMs = Date.now() - startTime;
      if (entryId) updateUpdateEntry(entryId, 'completed', null, durationMs);
      log.info(`Update to v${latest} completed in ${Math.round(durationMs / 1000)}s`);

      this._broadcast('update_status', { stage: 'restarting' });

      // Schedule restart after HTTP response flushes
      setTimeout(() => this._restartProcess(), 500);

      return { ok: true, message: `Updated to v${latest}. Restarting...`, newVersion: latest };
    } catch (e) {
      this._updateInProgress = false;
      if (entryId) updateUpdateEntry(entryId, 'failed', e.message, Date.now() - startTime);
      log.error('Update failed: ' + e.message);
      this._broadcast('update_status', { stage: 'failed', error: e.message });
      throw e;
    }
  }

  // ---- Git update ----

  async _applyGit(version) {
    // Validate version format to prevent command injection
    if (!/^\d+\.\d+\.\d+$/.test(version)) {
      throw new Error(`Invalid version format: ${version}`);
    }
    const tag = `v${version}`;
    try {
      execSync('git fetch origin --tags', { cwd: ROOT_DIR, timeout: 30000, stdio: 'pipe' });
      // Determine current branch (stay on it instead of detached HEAD)
      let branch;
      try {
        branch = execSync('git rev-parse --abbrev-ref HEAD', { cwd: ROOT_DIR, timeout: 5000, encoding: 'utf8' }).trim();
      } catch { branch = ''; }
      if (branch && branch !== 'HEAD') {
        // On a branch — fast-forward merge the tag to stay on branch
        execSync(`git merge --ff-only ${tag}`, { cwd: ROOT_DIR, timeout: 10000, stdio: 'pipe' });
      } else {
        // Detached HEAD or unknown — fall back to checkout
        execSync(`git checkout ${tag}`, { cwd: ROOT_DIR, timeout: 10000, stdio: 'pipe' });
      }
    } catch (e) {
      throw new Error(`Git update failed: ${e.message}`);
    }

    this._npmInstallIfNeeded();
  }

  // ---- Tarball update ----

  async _applyTarball(version) {
    const downloadUrl = this._cache.result?.downloadUrl;
    if (!downloadUrl) throw new Error('No download URL available');

    const tempDir = join(DATA_DIR, 'update-temp');
    mkdirSync(tempDir, { recursive: true });
    const tarballPath = join(tempDir, 'release.tar.gz');

    try {
      // Download
      const response = await fetch(downloadUrl, {
        headers: { 'Accept': 'application/vnd.github+json', 'User-Agent': '3dprintforge' },
        redirect: 'follow'
      });
      if (!response.ok) throw new Error(`Download failed: HTTP ${response.status}`);

      const buffer = Buffer.from(await response.arrayBuffer());
      writeFileSync(tarballPath, buffer);

      // Verify
      try {
        execSync(`tar tzf "${tarballPath}" > /dev/null 2>&1`, { timeout: 10000 });
      } catch {
        throw new Error('Downloaded tarball is corrupted');
      }

      // Extract
      this._broadcast('update_status', { stage: 'extracting' });
      execSync(`tar xzf "${tarballPath}" -C "${tempDir}"`, { timeout: 60000 });

      // Find extracted directory
      const entries = readdirSync(tempDir).filter(e => e !== 'release.tar.gz');
      if (entries.length === 0) throw new Error('Tarball is empty');
      const extractedDir = join(tempDir, entries[0]);

      // Replace files
      this._broadcast('update_status', { stage: 'replacing' });

      // Remove old app files (except preserved)
      for (const entry of readdirSync(ROOT_DIR)) {
        if (!PRESERVE.has(entry)) {
          rmSync(join(ROOT_DIR, entry), { recursive: true, force: true });
        }
      }

      // Copy new files (except preserved)
      for (const entry of readdirSync(extractedDir)) {
        if (!PRESERVE.has(entry)) {
          cpSync(join(extractedDir, entry), join(ROOT_DIR, entry), { recursive: true });
        }
      }

      this._npmInstallIfNeeded();
    } finally {
      // Cleanup temp
      try { rmSync(tempDir, { recursive: true, force: true }); } catch { /* ok */ }
    }
  }

  // ---- Helpers ----

  _npmInstallIfNeeded() {
    const lockFile = join(ROOT_DIR, 'package-lock.json');
    const pkgFile = join(ROOT_DIR, 'package.json');
    if (existsSync(lockFile) || existsSync(pkgFile)) {
      try {
        execSync('npm install --production', { cwd: ROOT_DIR, timeout: 120000, stdio: 'pipe' });
      } catch (e) {
        log.warn('npm install warning: ' + e.message);
      }
    }
  }

  _createBackup() {
    const backupDir = join(DATA_DIR, 'backups');
    mkdirSync(backupDir, { recursive: true });

    const backupName = `backup-${this._currentVersion}-${Date.now()}`;
    const backupPath = join(backupDir, backupName);

    // cpSync cannot copy a directory into its own subdirectory, so we
    // iterate top-level entries manually and copy only non-preserved ones.
    mkdirSync(backupPath, { recursive: true });
    for (const entry of readdirSync(ROOT_DIR)) {
      if (PRESERVE.has(entry) && entry !== 'config.json') continue;
      try {
        cpSync(join(ROOT_DIR, entry), join(backupPath, entry), { recursive: true });
      } catch { /* skip unreadable entries */ }
    }

    // Prune old backups (keep max 3)
    try {
      const backups = readdirSync(backupDir)
        .filter(d => d.startsWith('backup-'))
        .sort()
        .reverse();
      for (let i = MAX_BACKUPS; i < backups.length; i++) {
        rmSync(join(backupDir, backups[i]), { recursive: true, force: true });
      }
    } catch { /* ok */ }

    log.info(`Backup created: ${backupName}`);
    return backupPath;
  }

  _restartProcess() {
    const isSystemd = !!process.env.INVOCATION_ID;

    if (isSystemd) {
      log.info('Restarting via systemd...');
      process.exit(0);
    } else {
      const cmd = `sleep 2 && cd "${ROOT_DIR}" && exec node server/index.js`;
      const child = spawn('bash', ['-c', cmd], {
        detached: true,
        stdio: 'ignore',
        cwd: ROOT_DIR
      });
      child.unref();
      log.info('Spawned restart process, exiting...');
      process.exit(0);
    }
  }
}
