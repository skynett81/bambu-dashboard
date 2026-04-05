import { spawn } from 'node:child_process';
import { connect as tlsConnect } from 'node:tls';
import net from 'node:net';
import { WebSocketServer } from 'ws';
import { createLogger } from './logger.js';

const log = createLogger('camera');

/**
 * CameraStream — supports two protocols:
 *   1. JPEG stream over TLS port 6000 (P1S, P1P, A1, A1 mini, P2S, H2-series)
 *   2. RTSP via ffmpeg port 322 (X1C, X1E — fallback for all models)
 *
 * Auto-detects: tries JPEG port 6000 first, falls back to RTSP port 322.
 * Clients receive JPEG frames via WebSocket (binary).
 * For RTSP mode, ffmpeg transcodes to MPEG-TS and JSMpeg decodes on client.
 */
export class CameraStream {
  constructor(config) {
    this.ip = config.printer.ip;
    this.accessCode = config.printer.accessCode;
    this.port = config.server.cameraWsPort;
    this.resolution = config.camera?.resolution || '640x480';
    this.framerate = config.camera?.framerate || 15;
    this.bitrate = config.camera?.bitrate || '1000k';
    this.enabled = config.camera?.enabled !== false;

    this.wss = null;
    this.ffmpeg = null;
    this.tlsSocket = null;
    this.clients = new Set();
    this.restartTimer = null;
    this.stopTimer = null;
    this.restartCount = 0;
    this.mode = null; // 'jpeg' or 'rtsp'
    this._headerBuf = Buffer.alloc(0);
    this._authDenied = false;
    this._authDeniedTimer = null;
    this._watchdogTimer = null;
    this._lastFrameTime = 0;
    this._lastFrame = null; // Last JPEG frame buffer for snapshot/MJPEG
    this._mjpegClients = new Set(); // HTTP MJPEG stream clients
  }

  start() {
    if (!this.enabled) {
      log.info('Camera disabled in config');
      return;
    }

    this.wss = new WebSocketServer({ port: this.port });

    this.wss.on('error', (err) => {
      log.warn('WebSocket error on port ' + this.port + ': ' + err.message);
      this.wss = null;
    });

    log.info('WebSocket server on port ' + this.port);

    this.wss.on('connection', (ws) => {
      this.clients.add(ws);
      log.info('Client connected (' + this.clients.size + ' total), mode: ' + (this.mode || 'detecting'));

      if (this.stopTimer) {
        clearTimeout(this.stopTimer);
        this.stopTimer = null;
      }

      // If auth was previously denied, tell the new client immediately
      if (this._authDenied) {
        ws.send(JSON.stringify({ error: 'auth_denied' }));
        return;
      }

      // Start stream if not running
      if (!this.ffmpeg && !this.tlsSocket) {
        this._startStream();
      }

      ws.on('close', () => {
        this.clients.delete(ws);
        log.info('Client disconnected (' + this.clients.size + ' total)');

        if (this.clients.size === 0 && !this.stopTimer) {
          this.stopTimer = setTimeout(() => {
            this._stopStream();
            this.stopTimer = null;
          }, 10000);
        }
      });

      ws.on('error', () => {
        this.clients.delete(ws);
      });
    });
  }

  stop() {
    this._stopStream();
    if (this.wss) {
      this.wss.close();
      this.wss = null;
    }
  }

  /**
   * Auto-detect: TLS-probe port 6000 (JPEG) with auth test, fallback to port 322 (RTSP).
   */
  _startStream() {
    if (!this.ip) {
      log.warn('No IP address configured');
      return;
    }

    // TLS probe port 6000 — test actual TLS+auth, not just TCP
    log.info('Probing TLS port 6000 on ' + this.ip + '...');

    let probeTimedOut = false;
    const probeTimeout = setTimeout(() => {
      probeTimedOut = true;
      if (probeSock) { try { probeSock.destroy(); } catch (e) { log.debug('Error closing probe socket: ' + e.message); } }
      log.info('TLS probe timeout — trying RTSP (port 322)');
      this.mode = 'rtsp';
      this._startFfmpeg();
    }, 3000);

    let probeSock;
    try {
      probeSock = tlsConnect({
        host: this.ip,
        port: 6000,
        rejectUnauthorized: false,
      });
    } catch {
      clearTimeout(probeTimeout);
      log.info('TLS probe failed — trying RTSP (port 322)');
      this.mode = 'rtsp';
      this._startFfmpeg();
      return;
    }

    probeSock.on('secureConnect', () => {
      clearTimeout(probeTimeout);
      probeSock.destroy();
      if (probeTimedOut) return;
      log.info('TLS port 6000 ok — using JPEG stream');
      this.mode = 'jpeg';
      this._startJpegStream();
    });

    probeSock.on('error', () => {
      clearTimeout(probeTimeout);
      probeSock.destroy();
      if (probeTimedOut) return;
      log.info('TLS probe error — trying RTSP (port 322)');
      this.mode = 'rtsp';
      this._startFfmpeg();
    });
  }

  /**
   * JPEG stream over TLS port 6000.
   * Protocol: 80-byte auth packet → auth response → repeating [16-byte header + JPEG data].
   */
  _startJpegStream() {
    log.info('Connecting to JPEG stream ' + this.ip + ':6000...');

    try {
      this.tlsSocket = tlsConnect({
        host: this.ip,
        port: 6000,
        rejectUnauthorized: false, // Printer uses self-signed cert
      });
    } catch (e) {
      log.error('TLS connection failed: ' + e.message);
      this._fallbackToRtsp();
      return;
    }

    this.tlsSocket.on('secureConnect', () => {
      log.info('TLS connected — sending authentication');

      // Build 80-byte auth packet
      const authPacket = Buffer.alloc(80);
      authPacket.writeUInt32LE(0x40, 0);    // Payload size: 64 bytes
      authPacket.writeUInt32LE(0x3000, 4);  // Type: auth request
      authPacket.writeUInt32LE(0, 8);       // Flags
      authPacket.writeUInt32LE(0, 12);      // Reserved

      // Username "bblp" padded to 32 bytes
      const user = Buffer.alloc(32, 0);
      user.write('bblp', 'utf8');
      user.copy(authPacket, 16);

      // Access code padded to 32 bytes
      const pass = Buffer.alloc(32, 0);
      pass.write(this.accessCode || '', 'utf8');
      pass.copy(authPacket, 48);

      this.tlsSocket.write(authPacket);
      this._headerBuf = Buffer.alloc(0);
      this._readState = 'auth_response'; // Wait for auth response first
      this._payloadSize = 0;
    });

    this.tlsSocket.on('data', (chunk) => {
      this._handleJpegData(chunk);
    });

    this.tlsSocket.on('error', (err) => {
      log.warn('JPEG stream error: ' + err.message);
      this._cleanupJpeg();
      if (!this._authDenied) {
        this._scheduleRestart();
      }
    });

    this.tlsSocket.on('close', () => {
      log.info('JPEG stream closed');
      this.tlsSocket = null;
      if (this.clients.size > 0 && !this._authDenied) {
        this._scheduleRestart();
      }
    });

    // Reset restart counter after 10s of stable connection
    setTimeout(() => {
      if (this.tlsSocket) this.restartCount = 0;
    }, 10000);
  }

  /**
   * Parse JPEG frames from TLS stream.
   * First response after auth: 16-byte header + 8-byte payload with result code.
   * Then repeating: [16-byte header + JPEG data].
   */
  _handleJpegData(chunk) {
    this._headerBuf = Buffer.concat([this._headerBuf, chunk]);

    while (this._headerBuf.length > 0) {
      // Auth response: 16-byte header + small payload
      if (this._readState === 'auth_response') {
        if (this._headerBuf.length < 16) return;

        const payloadSize = this._headerBuf.readUInt32LE(0);
        if (this._headerBuf.length < 16 + payloadSize) return;

        const payload = this._headerBuf.subarray(16, 16 + payloadSize);
        this._headerBuf = this._headerBuf.subarray(16 + payloadSize);

        // Check for error code 0xFFFFFFFF in payload
        if (payloadSize >= 4 && payload.readUInt32LE(0) === 0xFFFFFFFF) {
          log.warn('Authentication rejected — LAN Live View is likely disabled on the printer');
          this._authDenied = true;
          this._broadcastError('auth_denied');
          this._cleanupJpeg();

          // Auto-reset auth denied after 60s — allows new connection
          if (this._authDeniedTimer) clearTimeout(this._authDeniedTimer);
          this._authDeniedTimer = setTimeout(() => {
            log.info('Resetting auth-denied — retrying');
            this._authDenied = false;
            if (this.clients.size > 0) {
              this._startStream();
            }
          }, 60000);
          return;
        }

        log.info('Authentication accepted — starting JPEG stream');
        this._readState = 'header';
        this._lastFrameTime = Date.now();
        this._startWatchdog();
        continue;
      }

      if (this._readState === 'header') {
        if (this._headerBuf.length < 16) return; // Need more data

        this._payloadSize = this._headerBuf.readUInt32LE(0);
        this._headerBuf = this._headerBuf.subarray(16);

        if (this._payloadSize <= 0 || this._payloadSize > 10 * 1024 * 1024) {
          // Invalid payload — try to resync by finding next valid header
          log.warn('Invalid payload size: ' + this._payloadSize + ' — resyncing');
          this._resyncBuffer();
          return;
        }

        this._readState = 'payload';
      }

      if (this._readState === 'payload') {
        if (this._headerBuf.length < this._payloadSize) return; // Need more data

        const frame = this._headerBuf.subarray(0, this._payloadSize);
        this._headerBuf = this._headerBuf.subarray(this._payloadSize);
        this._readState = 'header';

        // Validate JPEG markers (FFD8 start)
        if (frame.length > 2 && frame[0] === 0xFF && frame[1] === 0xD8) {
          this._lastFrameTime = Date.now();
          this._broadcastJpeg(frame);
        }
      }
    }
  }

  /**
   * Send JPEG frame to all WebSocket clients + MJPEG HTTP clients.
   * Also stores last frame for snapshot endpoint.
   */
  _broadcastJpeg(frame) {
    this._lastFrame = frame;

    // WebSocket clients
    for (const ws of this.clients) {
      if (ws.readyState === 1) {
        ws.send(frame, { binary: true });
      }
    }

    // MJPEG HTTP clients (multipart/x-mixed-replace)
    for (const res of this._mjpegClients) {
      try {
        if (!res.writableEnded) {
          res.write(`--mjpegboundary\r\nContent-Type: image/jpeg\r\nContent-Length: ${frame.length}\r\n\r\n`);
          res.write(frame);
          res.write('\r\n');
        } else {
          this._mjpegClients.delete(res);
        }
      } catch {
        this._mjpegClients.delete(res);
      }
    }
  }

  /** Get last captured JPEG frame (for snapshot endpoint). */
  getLastFrame() {
    return this._lastFrame;
  }

  /** Add a MJPEG HTTP stream client. */
  addMjpegClient(res) {
    res.writeHead(200, {
      'Content-Type': 'multipart/x-mixed-replace; boundary=mjpegboundary',
      'Cache-Control': 'no-cache, no-store',
      'Connection': 'close',
    });

    this._mjpegClients.add(res);

    // Send last frame immediately if available
    if (this._lastFrame) {
      res.write(`--mjpegboundary\r\nContent-Type: image/jpeg\r\nContent-Length: ${this._lastFrame.length}\r\n\r\n`);
      res.write(this._lastFrame);
      res.write('\r\n');
    }

    res.on('close', () => this._mjpegClients.delete(res));

    // Start stream if not running
    if (!this.ffmpeg && !this.tlsSocket && !this._authDenied) {
      this._startStream();
    }
  }

  /**
   * Send error message to all WebSocket clients (as JSON text).
   */
  _broadcastError(error) {
    const msg = JSON.stringify({ error });
    for (const ws of this.clients) {
      if (ws.readyState === 1) {
        ws.send(msg);
      }
    }
  }

  _cleanupJpeg() {
    if (this.tlsSocket) {
      try { this.tlsSocket.destroy(); } catch (e) { log.debug('Error closing TLS socket: ' + e.message); }
      this.tlsSocket = null;
    }
    this._headerBuf = Buffer.alloc(0);
  }

  _fallbackToRtsp() {
    log.info('JPEG failed — falling back to RTSP');
    this._cleanupJpeg();
    this.mode = 'rtsp';
    this._startFfmpeg();
  }

  /**
   * RTSP via ffmpeg (X1C, X1E, or fallback).
   * Transcodes to MPEG-TS for JSMpeg decoding on client.
   */
  _startFfmpeg() {
    const mpeg1Fps = this.framerate >= 25 ? this.framerate : 25;

    const args = [
      '-rtsp_transport', 'tcp',
      '-i', `rtsps://bblp:${this.accessCode}@${this.ip}:322/streaming/live/1`,
      '-f', 'mpegts',
      '-codec:v', 'mpeg1video',
      '-b:v', this.bitrate,
      '-r', String(mpeg1Fps),
      '-s', this.resolution,
      '-an',
      '-q:v', '5',
      'pipe:1'
    ];

    log.info('Starting ffmpeg (RTSP)...');

    try {
      this.ffmpeg = spawn('ffmpeg', args, {
        stdio: ['ignore', 'pipe', 'ignore']
      });
    } catch (e) {
      log.error('Could not start ffmpeg: ' + e.message);
      return;
    }

    this.ffmpeg.stdout.on('data', (data) => {
      for (const ws of this.clients) {
        if (ws.readyState === 1) {
          ws.send(data, { binary: true });
        }
      }
    });

    this.ffmpeg.on('close', (code) => {
      log.info('ffmpeg exited (code: ' + code + ')');
      this.ffmpeg = null;
      if (this.clients.size > 0) {
        this._scheduleRestart();
      }
    });

    this.ffmpeg.on('error', (err) => {
      log.error('ffmpeg error: ' + err.message);
      this.ffmpeg = null;
    });

    setTimeout(() => {
      if (this.ffmpeg) this.restartCount = 0;
    }, 5000);
  }

  /**
   * Resync buffer by scanning for a plausible 16-byte header boundary.
   * Drops data until we find a reasonable payload size, or clears the buffer.
   */
  _resyncBuffer() {
    // Scan forward byte by byte looking for a valid-looking header
    for (let i = 1; i <= this._headerBuf.length - 16; i++) {
      const candidate = this._headerBuf.readUInt32LE(i);
      if (candidate > 0 && candidate < 2 * 1024 * 1024) {
        // Looks like a valid payload size — resync here
        this._headerBuf = this._headerBuf.subarray(i);
        this._readState = 'header';
        log.info('Buffer resynced after ' + i + ' bytes');
        return;
      }
    }
    // No valid header found — clear and wait for new data
    this._headerBuf = Buffer.alloc(0);
    this._readState = 'header';
  }

  /**
   * Watchdog: restart stream if no frames received for 15 seconds.
   */
  _startWatchdog() {
    this._stopWatchdog();
    this._watchdogTimer = setInterval(() => {
      if (this._lastFrameTime && Date.now() - this._lastFrameTime > 15000) {
        log.warn('Watchdog: no frames for 15s — restarting stream');
        this._stopWatchdog();
        this._cleanupJpeg();
        if (this.clients.size > 0) {
          this._scheduleRestart();
        }
      }
    }, 5000);
  }

  _stopWatchdog() {
    if (this._watchdogTimer) {
      clearInterval(this._watchdogTimer);
      this._watchdogTimer = null;
    }
  }

  _scheduleRestart() {
    if (this.restartCount >= 12) {
      log.warn('Max restart attempts reached (12) — giving up');
      this._broadcastError('stream_unavailable');
      return;
    }
    this.restartCount++;
    const delay = Math.min(1000 * this.restartCount, 30000);
    log.info('Restarting in ' + (delay / 1000) + 's (attempt ' + this.restartCount + '/12)...');
    this.restartTimer = setTimeout(() => {
      this._startStream();
    }, delay);
  }

  _stopStream() {
    if (this.restartTimer) {
      clearTimeout(this.restartTimer);
      this.restartTimer = null;
    }
    if (this._authDeniedTimer) {
      clearTimeout(this._authDeniedTimer);
      this._authDeniedTimer = null;
    }
    this._stopWatchdog();
    if (this.ffmpeg) {
      log.info('Stopping ffmpeg');
      this.ffmpeg.kill('SIGTERM');
      this.ffmpeg = null;
    }
    this._cleanupJpeg();
  }
}
