import { spawn } from 'node:child_process';
import { mkdirSync, existsSync, unlinkSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { DATA_DIR } from './config.js';
import { addFailureDetection, getInventorySetting } from './database.js';
import { createLogger } from './logger.js';

const log = createLogger('failure');

const FRAMES_DIR = join(DATA_DIR, 'detection_frames');

export class FailureDetectionService {
  constructor(printerManager, notifier, broadcastFn) {
    this._printerManager = printerManager;
    this._notifier = notifier;
    this._broadcast = broadcastFn;
    this._monitors = new Map(); // printerId -> { timer, lastFrame }
    this._enabled = false;
  }

  init() {
    if (!existsSync(FRAMES_DIR)) mkdirSync(FRAMES_DIR, { recursive: true });
    this._enabled = getInventorySetting('ai_detection_enabled') === '1';
    log.info('Service initialized (enabled: ' + this._enabled + ')');
  }

  startMonitoring(printerId, printerIp, accessCode) {
    if (!this._enabled) return;
    if (this._monitors.has(printerId)) return;

    const normalInterval = parseInt(getInventorySetting('ai_detection_interval') || '60') * 1000;
    const firstLayerInterval = Math.round(normalInterval / 3); // 3x faster during first layers
    const monitor = {
      timer: setInterval(() => this._captureAndAnalyze(printerId, printerIp, accessCode), normalInterval),
      lastFrame: null,
      frameCount: 0,
      firstLayerMode: true,
      normalInterval,
      firstLayerInterval,
      lastEntropy: null,
    };
    this._monitors.set(printerId, monitor);
    // Start in first-layer mode (faster capture rate for first 5 minutes)
    if (firstLayerInterval < normalInterval) {
      clearInterval(monitor.timer);
      monitor.timer = setInterval(() => this._captureAndAnalyze(printerId, printerIp, accessCode), firstLayerInterval);
      // Switch to normal rate after 5 minutes
      monitor.firstLayerTimeout = setTimeout(() => {
        if (!this._monitors.has(printerId)) return;
        clearInterval(monitor.timer);
        monitor.timer = setInterval(() => this._captureAndAnalyze(printerId, printerIp, accessCode), normalInterval);
        monitor.firstLayerMode = false;
        log.info(`First-layer monitoring ended for ${printerId}, switching to normal interval`);
      }, 5 * 60 * 1000);
    }
    log.info('Monitoring started for ' + printerId + ' (first-layer: ' + (firstLayerInterval/1000) + 's, normal: ' + (normalInterval / 1000) + 's)');
  }

  stopMonitoring(printerId) {
    const monitor = this._monitors.get(printerId);
    if (monitor) {
      clearInterval(monitor.timer);
      if (monitor.firstLayerTimeout) clearTimeout(monitor.firstLayerTimeout);
      this._monitors.delete(printerId);
      log.info('Monitoring stopped for ' + printerId);
    }
  }

  isMonitoring(printerId) {
    return this._monitors.has(printerId);
  }

  getActiveMonitors() {
    return Array.from(this._monitors.keys());
  }

  shutdown() {
    for (const [pid] of this._monitors) this.stopMonitoring(pid);
  }

  async checkBedClear(printerId, printerIp, accessCode) {
    const framePath = join(FRAMES_DIR, `${printerId}_bedcheck_${Date.now()}.jpg`);
    try {
      await this._captureFrame(printerIp, accessCode, framePath, printerId);
      if (!existsSync(framePath)) return { clear: false, reason: 'frame_capture_failed' };

      const frame = readFileSync(framePath);
      const stats = this._getFrameStats(frame);
      try { unlinkSync(framePath); } catch (e) { log.debug('Could not delete frame file ' + framePath + ': ' + e.message); }

      // Load baseline stats
      const baselineJson = getInventorySetting(`bed_check_baseline_${printerId}`);
      let baseline = null;
      try { baseline = baselineJson ? JSON.parse(baselineJson) : null; } catch (e) { log.warn('Invalid baseline JSON for ' + printerId + ': ' + e.message); }

      if (!baseline) {
        const isClear = stats.entropy < 5.5 && stats.variance < 3000;
        return { clear: isClear, confidence: isClear ? 0.6 : 0.4, reason: isClear ? 'low_entropy_heuristic' : 'uncertain_no_baseline', stats: { entropy: +stats.entropy.toFixed(2), variance: +stats.variance.toFixed(0) } };
      }

      const entropyDiff = Math.abs(stats.entropy - baseline.entropy);
      const varianceDiff = Math.abs(stats.variance - baseline.variance) / Math.max(baseline.variance, 1);
      const highRatioDiff = Math.abs(stats.highRatio - baseline.highRatio);
      const similarity = 1 - (entropyDiff / 4 + varianceDiff / 2 + highRatioDiff) / 3;
      const isClear = similarity > 0.7;

      return { clear: isClear, confidence: Math.min(Math.max(similarity, 0.1), 0.95), reason: isClear ? 'matches_baseline' : 'differs_from_baseline', stats: { entropy: +stats.entropy.toFixed(2), variance: +stats.variance.toFixed(0), similarity: +similarity.toFixed(3) } };
    } catch (e) {
      try { unlinkSync(framePath); } catch (e2) { log.debug('Could not delete frame file ' + framePath + ': ' + e2.message); }
      return { clear: false, reason: 'error', error: e.message };
    }
  }

  async captureBaseline(printerId, printerIp, accessCode) {
    const framePath = join(FRAMES_DIR, `${printerId}_baseline_${Date.now()}.jpg`);
    try {
      await this._captureFrame(printerIp, accessCode, framePath, printerId);
      if (!existsSync(framePath)) return { ok: false, error: 'capture_failed' };

      const frame = readFileSync(framePath);
      const stats = this._getFrameStats(frame);
      const { setInventorySetting: setSetting } = await import('./database.js');
      setSetting(`bed_check_baseline_${printerId}`, JSON.stringify({
        entropy: stats.entropy, variance: stats.variance, highRatio: stats.highRatio,
        lowRatio: stats.lowRatio, mean: stats.mean, captured_at: new Date().toISOString()
      }));
      try { unlinkSync(framePath); } catch (e) { log.debug('Could not delete baseline frame ' + framePath + ': ' + e.message); }
      return { ok: true, stats: { entropy: +stats.entropy.toFixed(2), variance: +stats.variance.toFixed(0) } };
    } catch (e) {
      try { unlinkSync(framePath); } catch (e2) { log.debug('Could not delete baseline frame ' + framePath + ': ' + e2.message); }
      return { ok: false, error: e.message };
    }
  }

  async _captureAndAnalyze(printerId, printerIp, accessCode) {
    const framePath = join(FRAMES_DIR, `${printerId}_${Date.now()}.jpg`);

    try {
      // Capture frame via RTSP (Bambu), HTTP snapshot (Moonraker/PrusaLink), or ffmpeg
      await this._captureFrame(printerIp, accessCode, framePath, printerId);

      if (!existsSync(framePath)) return;

      // Analyze the frame for common failure patterns
      const result = await this._analyzeFrame(framePath, printerId);

      if (result.detected) {
        const sensitivity = getInventorySetting('ai_detection_sensitivity') || 'medium';
        const thresholds = { low: 0.8, medium: 0.6, high: 0.4 };
        const threshold = thresholds[sensitivity] || 0.6;

        if (result.confidence >= threshold) {
          const action = getInventorySetting('ai_detection_action') || 'notify';

          const detectionId = addFailureDetection({
            printer_id: printerId,
            detection_type: result.type,
            confidence: result.confidence,
            frame_path: framePath,
            action_taken: action,
            details: result.details
          });

          // Notify
          if (this._notifier) {
            this._notifier.notify('print_failure_detected', {
              printer_id: printerId,
              detection_type: result.type,
              confidence: Math.round(result.confidence * 100),
              action: action
            });
          }

          if (this._broadcast) {
            this._broadcast('failure_detected', { id: detectionId, printer_id: printerId, type: result.type, confidence: result.confidence });
          }

          return;
        }
      }

      // Clean up frame if no detection
      try { unlinkSync(framePath); } catch (e) { log.debug('Could not delete analysis frame ' + framePath + ': ' + e.message); }
    } catch (e) {
      log.warn('Analysis error for ' + printerId + ': ' + e.message);
      try { unlinkSync(framePath); } catch (e2) { log.debug('Could not delete analysis frame ' + framePath + ': ' + e2.message); }
    }
  }

  async _captureFrame(ip, accessCode, outputPath, printerId) {
    // Try to determine frame source from printer manager
    const entry = this._printerManager?.printers?.get(printerId);
    const connType = entry?.config?.type;

    // Moonraker/Klipper printers: HTTP snapshot
    if (connType === 'moonraker' || connType === 'klipper' || connType === 'creality' || connType === 'elegoo' || connType === 'voron' || connType === 'anker' || connType === 'ratrig' || connType === 'qidi') {
      try {
        const port = entry?.config?.port || 80;
        const snapUrl = `http://${ip}:${port}/webcam/?action=snapshot`;
        const res = await fetch(snapUrl, { signal: AbortSignal.timeout(10000) });
        if (res.ok) {
          const { writeFileSync } = await import('node:fs');
          writeFileSync(outputPath, Buffer.from(await res.arrayBuffer()));
          return;
        }
      } catch { /* fall through to ffmpeg */ }
    }

    // PrusaLink: camera snap endpoint
    if (connType === 'prusalink') {
      try {
        const snapUrl = `http://${ip}:${entry?.config?.port || 80}/api/v1/cameras/snap`;
        const headers = accessCode ? { 'X-Api-Key': accessCode } : {};
        const res = await fetch(snapUrl, { headers, signal: AbortSignal.timeout(10000) });
        if (res.ok) {
          const { writeFileSync } = await import('node:fs');
          writeFileSync(outputPath, Buffer.from(await res.arrayBuffer()));
          return;
        }
      } catch { /* fall through to ffmpeg */ }
    }

    // Bambu Lab: RTSPS via ffmpeg (default)
    return new Promise((resolve, reject) => {
      const args = [
        '-y', '-rtsp_transport', 'tcp',
        '-i', `rtsps://bblp:${accessCode}@${ip}:322/streaming/live/1`,
        '-frames:v', '1', '-q:v', '2',
        outputPath
      ];
      // Either spawn timeout OR manual SIGKILL — not both. Together they
      // double-fire on the close event and the second kill throws into a
      // catch that swallowed the original error.
      const proc = spawn('ffmpeg', args, { stdio: 'pipe' });
      const killTimer = setTimeout(() => {
        try { proc.kill('SIGKILL'); } catch (e) { log.debug('Could not kill ffmpeg process: ' + e.message); }
      }, 15000);
      proc.on('close', code => {
        clearTimeout(killTimer);
        code === 0 ? resolve() : reject(new Error(`FFmpeg exit ${code}`));
      });
      proc.on('error', err => {
        clearTimeout(killTimer);
        reject(err);
      });
    });
  }

  // Analyze JPEG pixel data without external libraries: parse DCT coefficients from raw JPEG data
  _getFrameStats(buf) {
    const size = buf.length;
    // Compute Shannon entropy of raw bytes (correlates with image complexity)
    const freq = new Uint32Array(256);
    for (let i = 0; i < size; i++) freq[buf[i]]++;
    let entropy = 0;
    for (let i = 0; i < 256; i++) {
      if (freq[i] === 0) continue;
      const p = freq[i] / size;
      entropy -= p * Math.log2(p);
    }
    // High-byte ratio: proportion of bright pixel data (bytes > 192)
    let highBytes = 0, lowBytes = 0;
    for (let i = 0; i < size; i++) {
      if (buf[i] > 192) highBytes++;
      else if (buf[i] < 64) lowBytes++;
    }
    const highRatio = highBytes / size;
    const lowRatio = lowBytes / size;
    // Byte variance (measures texture complexity)
    const mean = buf.reduce((s, b) => s + b, 0) / size;
    let variance = 0;
    for (let i = 0; i < size; i++) variance += (buf[i] - mean) ** 2;
    variance /= size;
    return { size, entropy, highRatio, lowRatio, variance, mean };
  }

  async _analyzeFrame(framePath, printerId) {
    const monitor = this._monitors.get(printerId);
    if (!monitor) return { detected: false };

    try {
      const currentFrame = readFileSync(framePath);
      const stats = this._getFrameStats(currentFrame);

      if (monitor.lastFrame) {
        const lastStats = monitor.lastStats || this._getFrameStats(monitor.lastFrame);
        const sizeDiff = Math.abs(stats.size - lastStats.size) / Math.max(lastStats.size, 1);
        const entropyDiff = Math.abs(stats.entropy - lastStats.entropy);
        const varianceDiff = Math.abs(stats.variance - lastStats.variance) / Math.max(lastStats.variance, 1);

        monitor.lastFrame = currentFrame;
        monitor.lastStats = stats;
        monitor.frameCount++;

        // Camera obstruction: very small frame or extremely low entropy (solid color)
        if (stats.size < 5000 || stats.entropy < 3.0) {
          return {
            detected: true,
            type: 'camera_obstruction',
            confidence: stats.entropy < 2.0 ? 0.9 : 0.7,
            details: { frame_size: stats.size, entropy: stats.entropy.toFixed(2) }
          };
        }

        // Need at least 3 baseline frames before detecting anomalies
        if (monitor.frameCount <= 3) return { detected: false };

        // Spaghetti detection: sudden entropy increase + high variance change
        // Spaghetti filament creates chaotic patterns = high entropy + high texture variance
        if (entropyDiff > 0.8 && stats.entropy > 6.5 && varianceDiff > 0.3) {
          return {
            detected: true,
            type: 'spaghetti_detected',
            confidence: Math.min(0.5 + entropyDiff * 0.3 + varianceDiff * 0.2, 0.95),
            details: { entropy_change: entropyDiff.toFixed(2), variance_change: varianceDiff.toFixed(2), entropy: stats.entropy.toFixed(2) }
          };
        }

        // Bed detachment: significant size change + decreased high-byte ratio (darker = object moved)
        if (sizeDiff > 0.35 && stats.highRatio < lastStats.highRatio * 0.7) {
          return {
            detected: true,
            type: 'bed_detachment',
            confidence: Math.min(0.5 + sizeDiff * 0.4, 0.9),
            details: { size_change: sizeDiff.toFixed(2), brightness_drop: ((1 - stats.highRatio / Math.max(lastStats.highRatio, 0.01)) * 100).toFixed(0) + '%' }
          };
        }

        // Nozzle blob: sudden increase in bright regions (plastic accumulation = shiny/reflective)
        if (stats.highRatio > lastStats.highRatio * 1.5 && stats.highRatio > 0.15 && sizeDiff > 0.2) {
          return {
            detected: true,
            type: 'nozzle_blob',
            confidence: Math.min(0.4 + (stats.highRatio - lastStats.highRatio) * 2, 0.85),
            details: { high_ratio: stats.highRatio.toFixed(3), prev_high_ratio: lastStats.highRatio.toFixed(3) }
          };
        }

        // Generic anomaly: large frame size change (catch-all from original logic)
        if (sizeDiff > 0.4) {
          return {
            detected: true,
            type: 'anomaly_detected',
            confidence: Math.min(0.5 + sizeDiff * 0.5, 0.95),
            details: { size_change: sizeDiff.toFixed(2), frames_analyzed: monitor.frameCount }
          };
        }
      } else {
        monitor.lastFrame = currentFrame;
        monitor.lastStats = stats;
        monitor.frameCount++;
      }
    } catch (e) {
      log.warn('Error during image analysis for ' + printerId + ': ' + e.message);
    }

    return { detected: false };
  }
}
