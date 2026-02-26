import { spawn } from 'node:child_process';
import { WebSocketServer } from 'ws';

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
    this.clients = new Set();
    this.restartTimer = null;
    this.stopTimer = null;
    this.restartCount = 0;
  }

  start() {
    if (!this.enabled) {
      console.log('[kamera] Kamera deaktivert i konfig');
      return;
    }

    this.wss = new WebSocketServer({ port: this.port });

    this.wss.on('error', (err) => {
      console.warn(`[kamera] WebSocket-feil pa port ${this.port}: ${err.message}`);
      this.wss = null;
    });

    console.log(`[kamera] WebSocket server pa port ${this.port}`);

    this.wss.on('connection', (ws) => {
      this.clients.add(ws);
      console.log(`[kamera] Klient tilkoblet (${this.clients.size} totalt)`);

      // Clear stop timer if a client connects
      if (this.stopTimer) {
        clearTimeout(this.stopTimer);
        this.stopTimer = null;
      }

      // Start ffmpeg if not running
      if (!this.ffmpeg) {
        this._startFfmpeg();
      }

      ws.on('close', () => {
        this.clients.delete(ws);
        console.log(`[kamera] Klient frakoblet (${this.clients.size} totalt)`);

        // Stop ffmpeg after grace period if no clients
        if (this.clients.size === 0 && !this.stopTimer) {
          this.stopTimer = setTimeout(() => {
            this._stopFfmpeg();
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
    this._stopFfmpeg();
    if (this.wss) {
      this.wss.close();
      this.wss = null;
    }
  }

  _startFfmpeg() {
    // MPEG-1 only supports certain framerates (24, 25, 30, 50, 60)
    const mpeg1Fps = this.framerate >= 25 ? this.framerate : 25;

    const inputArgs = ['-rtsp_transport', 'tcp', '-i', `rtsps://bblp:${this.accessCode}@${this.ip}:322/streaming/live/1`];

    const args = [
      ...inputArgs,
      '-f', 'mpegts',
      '-codec:v', 'mpeg1video',
      '-b:v', this.bitrate,
      '-r', String(mpeg1Fps),
      '-s', this.resolution,
      '-an',
      '-q:v', '5',
      'pipe:1'
    ];

    console.log(`[kamera] Starter ffmpeg...`);

    try {
      this.ffmpeg = spawn('ffmpeg', args, {
        stdio: ['ignore', 'pipe', 'ignore']
      });
    } catch (e) {
      console.error('[kamera] Kunne ikke starte ffmpeg:', e.message);
      return;
    }

    this.ffmpeg.stdout.on('data', (data) => {
      for (const ws of this.clients) {
        if (ws.readyState === 1) { // OPEN
          ws.send(data, { binary: true });
        }
      }
    });

    this.ffmpeg.on('close', (code) => {
      console.log(`[kamera] ffmpeg avsluttet (kode: ${code})`);
      this.ffmpeg = null;

      // Auto-restart if clients are still connected
      if (this.clients.size > 0 && this.restartCount < 5) {
        this.restartCount++;
        const delay = Math.min(2000 * this.restartCount, 15000);
        console.log(`[kamera] Restarter om ${delay}ms (forsok ${this.restartCount}/5)...`);
        this.restartTimer = setTimeout(() => {
          this._startFfmpeg();
        }, delay);
      }
    });

    this.ffmpeg.on('error', (err) => {
      console.error('[kamera] ffmpeg feil:', err.message);
      this.ffmpeg = null;
    });

    // Reset restart counter on successful run (5 seconds without crash)
    setTimeout(() => {
      if (this.ffmpeg) this.restartCount = 0;
    }, 5000);
  }

  _stopFfmpeg() {
    if (this.restartTimer) {
      clearTimeout(this.restartTimer);
      this.restartTimer = null;
    }
    if (this.ffmpeg) {
      console.log('[kamera] Stopper ffmpeg');
      this.ffmpeg.kill('SIGTERM');
      this.ffmpeg = null;
    }
  }
}
