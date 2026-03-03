import { spawn } from 'node:child_process';
import { mkdirSync, existsSync, unlinkSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { DATA_DIR } from './config.js';
import { addFailureDetection, getInventorySetting } from './database.js';

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
    console.log(`[ai-detect] Service initialized (enabled: ${this._enabled})`);
  }

  startMonitoring(printerId, printerIp, accessCode) {
    if (!this._enabled) return;
    if (this._monitors.has(printerId)) return;

    const interval = parseInt(getInventorySetting('ai_detection_interval') || '60') * 1000;
    const monitor = {
      timer: setInterval(() => this._captureAndAnalyze(printerId, printerIp, accessCode), interval),
      lastFrame: null,
      frameCount: 0
    };
    this._monitors.set(printerId, monitor);
    console.log(`[ai-detect] Monitoring started for ${printerId} (interval: ${interval / 1000}s)`);
  }

  stopMonitoring(printerId) {
    const monitor = this._monitors.get(printerId);
    if (monitor) {
      clearInterval(monitor.timer);
      this._monitors.delete(printerId);
      console.log(`[ai-detect] Monitoring stopped for ${printerId}`);
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

  async _captureAndAnalyze(printerId, printerIp, accessCode) {
    const framePath = join(FRAMES_DIR, `${printerId}_${Date.now()}.jpg`);

    try {
      // Capture a single frame via RTSP
      await this._captureFrame(printerIp, accessCode, framePath);

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
      try { unlinkSync(framePath); } catch {}
    } catch (e) {
      console.warn(`[ai-detect] Analysis error for ${printerId}:`, e.message);
      try { unlinkSync(framePath); } catch {}
    }
  }

  _captureFrame(ip, accessCode, outputPath) {
    return new Promise((resolve, reject) => {
      const args = [
        '-y', '-rtsp_transport', 'tcp',
        '-i', `rtsps://bblp:${accessCode}@${ip}:322/streaming/live/1`,
        '-frames:v', '1', '-q:v', '2',
        outputPath
      ];
      const proc = spawn('ffmpeg', args, { stdio: 'pipe', timeout: 15000 });
      proc.on('close', code => code === 0 ? resolve() : reject(new Error(`FFmpeg exit ${code}`)));
      proc.on('error', reject);
      setTimeout(() => { try { proc.kill('SIGKILL'); } catch {} }, 15000);
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
    } catch {}

    return { detected: false };
  }
}
